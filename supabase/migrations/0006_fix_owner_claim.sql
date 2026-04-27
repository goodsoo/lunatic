-- Fix #1: don't overwrite the JWT's top-level `role` claim.
-- PostgREST treats the `role` claim as the Postgres DB role to assume (SET ROLE).
-- Stamping role='owner' breaks every subsequent query with
--   ERROR: role "owner" does not exist
-- because there is no Postgres role named `owner` (only authenticated/anon/service_role).
-- Fix: stamp `user_role: 'owner'` instead, and update effective_role() to read it.
-- After applying this migration, owner must sign out and sign back in to get a
-- fresh JWT with the corrected claim shape.
--
-- Fix #2: signup_member is application-stage only — collect identification fields
-- (real_name, cohort, country, school, student_id) + optional invite_code. Profile
-- fields (dancer_name, genres, bio, instagram, video_urls) move to /me. dancer_name
-- is auto-generated to satisfy the NOT NULL UNIQUE constraint; user renames in /me.

-- ============================================================
-- Auth Hook: write `user_role` claim, leave `role` alone
-- ============================================================

create or replace function custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_email text;
  claims jsonb;
begin
  claims := coalesce(event -> 'claims', '{}'::jsonb);

  select email into user_email
  from auth.users
  where id = (event ->> 'user_id')::uuid;

  if user_email is not null and user_email = owner_email() then
    claims := claims || jsonb_build_object('user_role', 'owner');
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function custom_access_token_hook(jsonb) from authenticated, anon, public;

-- ============================================================
-- effective_role(): read `user_role` instead of `role`
-- ============================================================

create or replace function effective_role()
returns member_role
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  jwt_role text;
  db_role member_role;
begin
  jwt_role := auth.jwt() ->> 'user_role';
  if jwt_role = 'owner' then
    return 'owner'::member_role;
  end if;

  if auth.uid() is null then
    return null;
  end if;

  select role into db_role from members where id = auth.uid();
  return db_role;
end;
$$;

-- ============================================================
-- signup_member: simplified application-stage RPC
-- ============================================================

drop function if exists signup_member(
  text, text, numeric, member_type, genre[], genre,
  text, text, text, text, text, text, text[], text, text
);

create function signup_member(
  p_real_name text,
  p_cohort numeric,
  p_country text,
  p_school text,
  p_student_id text,
  p_invite_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_email_prefix text;
  v_dancer_name text;
  v_is_owner boolean := (auth.jwt() ->> 'user_role') = 'owner';
  v_invite text;
  v_status application_status;
  v_member_role member_role;
  v_invite_used text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from members where id = v_uid) then
    raise exception 'already_signed_up';
  end if;

  if p_real_name is null or length(trim(p_real_name)) = 0 then
    raise exception 'real_name_required';
  end if;

  if p_cohort is null or p_cohort <= 0 or (p_cohort * 2) != trunc(p_cohort * 2) then
    raise exception 'cohort_invalid';
  end if;

  if p_country is null or length(trim(p_country)) = 0 then
    raise exception 'country_required';
  end if;

  if p_school is null or length(trim(p_school)) = 0 then
    raise exception 'school_required';
  end if;

  if p_student_id is null or length(trim(p_student_id)) = 0 then
    raise exception 'student_id_required';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'email_lookup_failed';
  end if;

  -- Auto-generate dancer_name to satisfy NOT NULL UNIQUE. User edits in /me.
  v_email_prefix := split_part(v_email, '@', 1);
  v_dancer_name := v_email_prefix || '_' || substr(replace(v_uid::text, '-', ''), 1, 4);

  v_invite := nullif(trim(coalesce(p_invite_code, '')), '');

  if v_is_owner then
    v_status := 'approved';
    v_member_role := 'owner';
    v_invite_used := v_invite;
  elsif v_invite is not null then
    if not validate_invite_code(v_invite) then
      raise exception 'invite_code_invalid';
    end if;
    v_status := 'approved';
    v_member_role := 'member';
    v_invite_used := v_invite;
  else
    v_status := 'pending';
    v_member_role := 'member';
    v_invite_used := null;
  end if;

  insert into members (
    id, real_name, email, dancer_name, cohort, type,
    student_id, school, country,
    role, application_status,
    approved_at, invite_code_used
  )
  values (
    v_uid, trim(p_real_name), v_email, v_dancer_name, p_cohort, 'undergrad',
    trim(p_student_id), trim(p_school), trim(p_country),
    v_member_role, v_status,
    case when v_status = 'approved' then now() else null end,
    v_invite_used
  );

  return jsonb_build_object(
    'member_id', v_uid,
    'application_status', v_status,
    'role', v_member_role
  );
end;
$$;

revoke execute on function signup_member(text, numeric, text, text, text, text) from public, anon;
grant execute on function signup_member(text, numeric, text, text, text, text) to authenticated;
