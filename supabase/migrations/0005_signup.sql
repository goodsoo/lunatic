-- Signup flow: signup_member SECURITY DEFINER RPC + lock down direct INSERT into members.
-- After this migration, the only way to create a members row is via signup_member.
-- The RPC enforces role/application_status assignment so users can't self-promote.

-- ============================================================
-- Drop direct self-insert. RPC is now the only INSERT path.
-- ============================================================

drop policy if exists members_self_insert on members;

-- ============================================================
-- signup_member RPC
--
-- Returns: jsonb { member_id, application_status, role }
-- Branches:
--   1. JWT role=owner → approved + role=owner (first-signup self-bootstrap)
--   2. Valid invite_code → approved + role=member + invite_code_used
--   3. apply_reason supplied → pending + role=member (admin queue)
-- Either invite_code or apply_reason must be provided (XOR not enforced; both is OK,
-- code path wins).
-- ============================================================

create or replace function signup_member(
  p_real_name text,
  p_dancer_name text,
  p_cohort numeric,
  p_type member_type,
  p_genres genre[],
  p_primary_genre genre,
  p_student_id text default null,
  p_school text default 'KAIST',
  p_country text default 'KR',
  p_instagram_handle text default null,
  p_bio text default null,
  p_bio_long text default null,
  p_video_urls text[] default '{}'::text[],
  p_invite_code text default null,
  p_apply_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_is_owner boolean := (auth.jwt() ->> 'role') = 'owner';
  v_invite_valid boolean := false;
  v_status application_status;
  v_role member_role;
  v_invite_used text;
  v_genre genre;
begin
  -- Auth check
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- One signup per user
  if exists (select 1 from members where id = v_uid) then
    raise exception 'already_signed_up';
  end if;

  -- Genres: at least one, primary must be in the list
  if array_length(p_genres, 1) is null or array_length(p_genres, 1) < 1 then
    raise exception 'genres_required';
  end if;
  if not (p_primary_genre = any(p_genres)) then
    raise exception 'primary_genre_not_in_list';
  end if;

  -- Cohort: 0.5 increments only
  if p_cohort is null or p_cohort <= 0 or (p_cohort * 2) != trunc(p_cohort * 2) then
    raise exception 'cohort_invalid';
  end if;

  -- video_urls: max 3 (column check covers it but raise a clear error here)
  if array_length(p_video_urls, 1) > 3 then
    raise exception 'too_many_videos';
  end if;

  -- Pull email from auth.users (don't trust client)
  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'email_lookup_failed';
  end if;

  -- Determine path
  if v_is_owner then
    v_status := 'approved';
    v_role := 'owner';
    v_invite_used := p_invite_code;  -- record if they happened to type one
  elsif p_invite_code is not null and p_invite_code <> '' then
    v_invite_valid := validate_invite_code(p_invite_code);
    if not v_invite_valid then
      raise exception 'invite_code_invalid';
    end if;
    v_status := 'approved';
    v_role := 'member';
    v_invite_used := p_invite_code;
  elsif p_apply_reason is not null and length(trim(p_apply_reason)) > 0 then
    v_status := 'pending';
    v_role := 'member';
    v_invite_used := null;
  else
    raise exception 'invite_code_or_reason_required';
  end if;

  -- Insert members row
  insert into members (
    id, real_name, email, dancer_name, cohort, type,
    student_id, school, country,
    instagram_handle, bio, bio_long, video_urls,
    role, application_status,
    approved_at, invite_code_used, apply_reason
  )
  values (
    v_uid, p_real_name, v_email, p_dancer_name, p_cohort, p_type,
    p_student_id, coalesce(p_school, 'KAIST'), coalesce(p_country, 'KR'),
    p_instagram_handle, p_bio, p_bio_long, coalesce(p_video_urls, '{}'::text[]),
    v_role, v_status,
    case when v_status = 'approved' then now() else null end,
    v_invite_used, p_apply_reason
  );

  -- Insert genres (de-duplicated by primary key)
  foreach v_genre in array p_genres loop
    insert into member_genres (member_id, genre, is_primary)
    values (v_uid, v_genre, v_genre = p_primary_genre)
    on conflict (member_id, genre) do nothing;
  end loop;

  return jsonb_build_object(
    'member_id', v_uid,
    'application_status', v_status,
    'role', v_role
  );
end;
$$;

revoke execute on function signup_member(
  text, text, numeric, member_type, genre[], genre,
  text, text, text, text, text, text, text[], text, text
) from public, anon;

grant execute on function signup_member(
  text, text, numeric, member_type, genre[], genre,
  text, text, text, text, text, text, text[], text, text
) to authenticated;

-- ============================================================
-- has_member_row: cheap check used by /auth/callback to decide
-- whether to redirect to /signup or /
-- ============================================================

create or replace function has_member_row()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from members where id = auth.uid());
$$;

grant execute on function has_member_row() to authenticated;
