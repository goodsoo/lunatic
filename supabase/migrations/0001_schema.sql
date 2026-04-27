-- Lunatic v1 schema
-- Run order: 0001 → 0002 (RLS) → 0003 (auth hook) → 0004 (storage)

-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists pg_trgm;       -- fuzzy search (member name, event name)
create extension if not exists "uuid-ossp";   -- gen_random_uuid via uuid_generate_v4 fallback

-- ============================================================
-- Enums
-- ============================================================

create type genre as enum (
  'popping', 'locking', 'soul', 'waacking', 'breaking',
  'girls_hiphop', 'hiphop', 'house', 'krump'
);

create type member_type as enum ('undergrad', 'grad', 'other');

create type member_status as enum ('active', 'suspended');

create type application_status as enum ('pending', 'approved', 'rejected');

create type member_role as enum ('owner', 'admin', 'member');

create type invite_duration as enum ('1d', '7d', '30d', 'semester', 'permanent');

-- ============================================================
-- Members
-- auth.users는 Supabase가 관리. members는 1:1 확장 프로필.
-- ============================================================

create table members (
  id uuid primary key references auth.users on delete cascade,

  -- Public (외부 노출 OK)
  dancer_name text not null unique,
  cohort numeric(4,1) not null,                 -- 11, 11.5, 12, 12.5...
  avatar_url text,                              -- Supabase Storage path
  instagram_handle text,                        -- @ 없이
  bio text,                                     -- 한 줄
  bio_long text,                                -- markdown 200자
  video_urls text[] default '{}'::text[]
    check (array_length(video_urls, 1) is null or array_length(video_urls, 1) <= 3),

  -- PII (admin + 본인만)
  real_name text not null,
  email text not null unique,
  student_id text,
  school text not null default 'KAIST',
  country text not null default 'KR',
  type member_type not null default 'undergrad',

  -- Operational
  role member_role not null default 'member',
  status member_status not null default 'active',
  suspended_at timestamptz,
  suspended_by uuid references members(id),
  suspended_reason text,

  -- 가입 큐
  application_status application_status not null default 'pending',
  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references members(id),
  rejection_reason text,
  invite_code_used text,                        -- 사용한 코드 (감사용)

  -- 가입 폼 추가 (코드 없을 때)
  apply_reason text,
  apply_referrer uuid references members(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index members_dancer_name_trgm on members using gin (dancer_name gin_trgm_ops);
create index members_real_name_trgm on members using gin (real_name gin_trgm_ops);
create index members_application_status_idx on members (application_status) where application_status = 'pending';

-- ============================================================
-- Member ↔ Genre (N:M)
-- ============================================================

create table member_genres (
  member_id uuid not null references members(id) on delete cascade,
  genre genre not null,
  is_primary boolean not null default false,
  primary key (member_id, genre)
);

-- 멤버당 primary genre 0–1개 (partial unique index)
create unique index member_genres_one_primary
  on member_genres (member_id) where is_primary;

-- ============================================================
-- Invite codes
-- ============================================================

create table invite_codes (
  code text primary key,                        -- admin이 정하거나 랜덤 생성
  duration invite_duration not null,
  expires_at timestamptz,                       -- permanent면 null
  created_by uuid not null references members(id),
  created_at timestamptz not null default now(),
  notes text,                                   -- "2026 봄 신입 모집" 같은 라벨
  revoked_at timestamptz                        -- admin이 회수 시
);

create index invite_codes_active_idx on invite_codes (expires_at)
  where revoked_at is null;

-- ============================================================
-- Events (행사 / 공연)
-- ============================================================

create type event_kind as enum ('performance', 'battle', 'workshop', 'session', 'other');

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                    -- /events/[slug]
  title text not null,
  kind event_kind not null default 'performance',
  starts_at timestamptz not null,               -- 미래/과거 둘 다
  ends_at timestamptz,
  location text,
  description text,                             -- markdown
  cover_image_url text,                         -- Storage path
  is_public boolean not null default true,      -- 외부 공개 여부
  genres genre[] not null default '{}',         -- 출연 장르
  created_by uuid references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_starts_at_idx on events (starts_at desc);
create index events_title_trgm on events using gin (title gin_trgm_ops);

-- 행사 lineup (어떤 멤버가 어떤 장르로 나왔는지)
create table event_lineup (
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  genre genre,                                  -- 그 행사에서 어떤 장르로
  role text,                                    -- "댄서", "MC", "DJ" 등 자유
  primary key (event_id, member_id, genre)
);

-- ============================================================
-- Videos (유튜브 임베드 + 메타데이터)
-- 행사에 묶인 영상 + Hall of Fame 큐레이션
-- ============================================================

create table videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,                     -- e.g. "dQw4w9WgXcQ"
  title text not null,
  event_id uuid references events(id) on delete set null,
  genres genre[] not null default '{}',
  thumbnail_url text,                           -- 자동 생성 가능 (yt thumbnail)
  duration_seconds int,
  is_hall_of_fame boolean not null default false,
  hof_added_at timestamptz,
  hof_added_by uuid references members(id),
  created_at timestamptz not null default now()
);

create index videos_hof_idx on videos (hof_added_at desc) where is_hall_of_fame;
create index videos_event_idx on videos (event_id);
create index videos_title_trgm on videos using gin (title gin_trgm_ops);

-- ============================================================
-- Notices (내부 공지)
-- ============================================================

create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,                           -- markdown
  pinned boolean not null default false,
  author_id uuid not null references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notices_created_idx on notices (pinned desc, created_at desc);

-- ============================================================
-- Reactions (이모지) — 공지/행사에 멤버가 :fire: 같은 반응
-- ============================================================

create type reaction_target as enum ('notice', 'event');

create table reactions (
  member_id uuid not null references members(id) on delete cascade,
  target_type reaction_target not null,
  target_id uuid not null,
  emoji text not null,                          -- e.g. "🔥" "👏" — emoji shortcode 아니라 unicode
  created_at timestamptz not null default now(),
  primary key (member_id, target_type, target_id, emoji)
);

create index reactions_target_idx on reactions (target_type, target_id);

-- ============================================================
-- Shouts (멤버 프로필에 다른 멤버의 응원 한 줄)
-- ============================================================

create table shouts (
  id uuid primary key default gen_random_uuid(),
  to_member_id uuid not null references members(id) on delete cascade,
  from_member_id uuid not null references members(id) on delete cascade,
  body text not null check (length(body) <= 200),
  is_hidden boolean not null default false,     -- 모더레이션
  hidden_reason text,
  created_at timestamptz not null default now()
);

create index shouts_to_member_idx on shouts (to_member_id, created_at desc);

-- ============================================================
-- Reports (모더레이션 신고)
-- ============================================================

create type report_target as enum ('member_bio', 'shout', 'notice');

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references members(id),
  target_type report_target not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'open',          -- open / reviewed / dismissed
  reviewed_by uuid references members(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Takedown requests (외부 공개 영상에서 본인 빼달라는 요청)
-- ============================================================

create table takedown_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references members(id),     -- 외부인이면 null
  requester_email text,
  requester_name text,
  video_id uuid references videos(id),
  reason text not null,
  status text not null default 'open',          -- open / resolved / rejected
  resolved_by uuid references members(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- updated_at trigger
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_updated_at
  before update on members
  for each row execute function set_updated_at();

create trigger events_updated_at
  before update on events
  for each row execute function set_updated_at();

create trigger notices_updated_at
  before update on notices
  for each row execute function set_updated_at();
