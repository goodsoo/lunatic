-- RLS policies + public views
-- Single source of truth for authorization (D2). Code routes do not enforce auth.

-- ============================================================
-- Helper: effective role (JWT owner claim OR members.role)
-- security definer to avoid RLS recursion when reading members.role
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
  jwt_role := auth.jwt() ->> 'role';
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

create or replace function is_admin_or_owner()
returns boolean
language sql
stable
as $$
  select effective_role() in ('admin', 'owner');
$$;

create or replace function is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from members
    where id = auth.uid()
      and application_status = 'approved'
      and status = 'active'
  );
$$;

-- ============================================================
-- Enable RLS everywhere
-- ============================================================

alter table members             enable row level security;
alter table member_genres       enable row level security;
alter table invite_codes        enable row level security;
alter table events              enable row level security;
alter table event_lineup        enable row level security;
alter table videos              enable row level security;
alter table notices             enable row level security;
alter table reactions           enable row level security;
alter table shouts              enable row level security;
alter table reports             enable row level security;
alter table takedown_requests   enable row level security;

-- ============================================================
-- Members
-- ============================================================

-- 본인 SELECT (모든 컬럼)
create policy members_self_select on members
  for select to authenticated
  using (id = auth.uid());

-- Admin/owner SELECT (모든 멤버 + 운영 데이터)
create policy members_admin_select on members
  for select to authenticated
  using (is_admin_or_owner());

-- 일반 멤버끼리 SELECT (approved + active만 보임 — 컬럼 제한은 view로)
create policy members_peer_select on members
  for select to authenticated
  using (
    is_approved_member()
    and application_status = 'approved'
    and status = 'active'
  );

-- 가입 시 본인 row 만들기
create policy members_self_insert on members
  for insert to authenticated
  with check (id = auth.uid());

-- 본인 UPDATE — column-level grants가 추가로 어떤 컬럼만 수정 가능한지 제한 (아래)
create policy members_self_update on members
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin UPDATE (status, role, 가입 큐 처리 등 모든 컬럼)
create policy members_admin_update on members
  for update to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- Column-level: 본인이 수정할 수 있는 컬럼만 grant
revoke update on members from authenticated;
grant update (
  dancer_name, cohort, avatar_url, instagram_handle,
  bio, bio_long, video_urls,
  real_name, student_id, school, country, type
) on members to authenticated;

-- Admin은 service_role 또는 별도 RPC 통해 전체 컬럼 update
grant update on members to service_role;

-- 외부 공개 뷰: 댄서명/기수/사진/인스타/한 줄 자기소개만
create view dancers_public
with (security_invoker = false, security_barrier = true) as
select
  id,
  dancer_name,
  cohort,
  avatar_url,
  instagram_handle,
  bio
from members
where application_status = 'approved'
  and status = 'active';

grant select on dancers_public to anon, authenticated;

-- 멤버 뷰: 갤러리에서 보이는 전체 (실명/학번/이메일 제외)
create view dancers_member
with (security_invoker = false, security_barrier = true) as
select
  id,
  dancer_name,
  cohort,
  avatar_url,
  instagram_handle,
  bio,
  bio_long,
  video_urls,
  type,
  school
from members
where application_status = 'approved'
  and status = 'active';

revoke all on dancers_member from anon;
grant select on dancers_member to authenticated;

-- ============================================================
-- Member genres
-- ============================================================

-- 외부도 볼 수 있음 (장르 그리드 채우기용) — approved+active 멤버만
create policy member_genres_public_select on member_genres
  for select to anon, authenticated
  using (
    exists (
      select 1 from members m
      where m.id = member_genres.member_id
        and m.application_status = 'approved'
        and m.status = 'active'
    )
  );

-- 본인이 자기 장르 관리
create policy member_genres_self_modify on member_genres
  for all to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- ============================================================
-- Invite codes (admin only)
-- ============================================================

create policy invite_codes_admin_all on invite_codes
  for all to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- 가입 폼이 코드 검증할 때 RPC 통하도록 (직접 SELECT 금지). 대신 SECURITY DEFINER 함수 제공.
create or replace function validate_invite_code(p_code text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c invite_codes;
begin
  select * into c from invite_codes where code = p_code;
  if not found then return false; end if;
  if c.revoked_at is not null then return false; end if;
  if c.expires_at is not null and c.expires_at < now() then return false; end if;
  return true;
end;
$$;

grant execute on function validate_invite_code(text) to anon, authenticated;

-- ============================================================
-- Events
-- ============================================================

-- 외부 공개: is_public 행만
create policy events_public_select on events
  for select to anon, authenticated
  using (is_public = true);

-- 멤버: 모든 행사 (비공개 행사도 포함)
create policy events_member_select on events
  for select to authenticated
  using (is_approved_member());

-- Admin write
create policy events_admin_all on events
  for all to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- ============================================================
-- Event lineup
-- ============================================================

create policy event_lineup_public_select on event_lineup
  for select to anon, authenticated
  using (
    exists (
      select 1 from events e
      where e.id = event_lineup.event_id and e.is_public = true
    )
  );

create policy event_lineup_member_select on event_lineup
  for select to authenticated
  using (is_approved_member());

create policy event_lineup_admin_all on event_lineup
  for all to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- ============================================================
-- Videos
-- ============================================================

-- 외부: 공개 행사에 묶인 영상 OR Hall of Fame
create policy videos_public_select on videos
  for select to anon, authenticated
  using (
    is_hall_of_fame = true
    or exists (
      select 1 from events e
      where e.id = videos.event_id and e.is_public = true
    )
  );

create policy videos_member_select on videos
  for select to authenticated
  using (is_approved_member());

create policy videos_admin_all on videos
  for all to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- ============================================================
-- Notices (멤버만)
-- ============================================================

create policy notices_member_select on notices
  for select to authenticated
  using (is_approved_member());

create policy notices_admin_all on notices
  for all to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- ============================================================
-- Reactions (멤버끼리)
-- ============================================================

create policy reactions_member_select on reactions
  for select to authenticated
  using (is_approved_member());

create policy reactions_self_insert on reactions
  for insert to authenticated
  with check (member_id = auth.uid() and is_approved_member());

create policy reactions_self_delete on reactions
  for delete to authenticated
  using (member_id = auth.uid());

-- ============================================================
-- Shouts (멤버끼리, 모더레이션 필터)
-- ============================================================

-- 보이는 shout은 hidden=false만
create policy shouts_member_select on shouts
  for select to authenticated
  using (is_approved_member() and is_hidden = false);

-- 본인 받은 shout은 hidden 포함 다 봄
create policy shouts_recipient_select on shouts
  for select to authenticated
  using (to_member_id = auth.uid());

-- Admin은 다 봄
create policy shouts_admin_select on shouts
  for select to authenticated
  using (is_admin_or_owner());

create policy shouts_send on shouts
  for insert to authenticated
  with check (
    from_member_id = auth.uid()
    and is_approved_member()
    and to_member_id <> auth.uid()
  );

-- 작성자가 삭제 가능
create policy shouts_author_delete on shouts
  for delete to authenticated
  using (from_member_id = auth.uid());

-- Admin이 hide/unhide
create policy shouts_admin_update on shouts
  for update to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- ============================================================
-- Reports
-- ============================================================

create policy reports_self_insert on reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and is_approved_member());

create policy reports_admin_all on reports
  for all to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- ============================================================
-- Takedown requests
-- 외부인도 신청 가능 (anon insert 허용, requester_id null)
-- ============================================================

create policy takedown_anon_insert on takedown_requests
  for insert to anon
  with check (
    requester_id is null
    and requester_email is not null
    and requester_name is not null
  );

create policy takedown_member_insert on takedown_requests
  for insert to authenticated
  with check (
    requester_id = auth.uid() or requester_id is null
  );

create policy takedown_admin_all on takedown_requests
  for all to authenticated
  using (is_admin_or_owner())
  with check (is_admin_or_owner());

-- ============================================================
-- Defense in depth: 직접 anon SELECT는 members에서 막음 (view를 통해서만)
-- ============================================================

revoke select on members from anon;
-- authenticated는 RLS로 self/admin/peer만 보임
