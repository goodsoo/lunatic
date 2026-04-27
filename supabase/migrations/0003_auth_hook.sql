-- Auth Hook: stamp role: owner JWT claim when email == OWNER_EMAIL.
-- D1 from design doc — owner is enforced via JWT claim, not DB role.
--
-- IMPORTANT — manual step after this migration:
-- 1. Update owner_email() below to your real email (matches .env OWNER_EMAIL).
-- 2. Supabase Dashboard → Authentication → Hooks → enable
--    "Custom Access Token Hook" → point to public.custom_access_token_hook.

-- ============================================================
-- Owner email constant
-- 변경 시: select replace_owner_email('new@example.com')
-- ============================================================

create table app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on app_config from anon, authenticated;

insert into app_config (key, value)
values ('owner_email', 'zzompang2@gmail.com')   -- ⚠️ 본인 이메일로 바꾸기
on conflict (key) do nothing;

create or replace function owner_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select value from app_config where key = 'owner_email' limit 1;
$$;

-- ============================================================
-- Custom access token hook
-- Supabase invokes this at sign-in / token refresh.
-- Receives: { user_id, claims, ... }
-- Returns:  { ...event, claims: { ...originalClaims, role: 'owner' } }
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
    claims := claims || jsonb_build_object('role', 'owner');
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Supabase auth admin가 hook을 실행할 수 있어야 함
grant execute on function custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;

-- 다른 role은 직접 호출 금지
revoke execute on function custom_access_token_hook(jsonb) from authenticated, anon, public;
