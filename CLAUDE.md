@AGENTS.md

# Lunatic

KAIST 스트릿 댄스 동아리 디지털 본부 (외부 홍보 + 멤버 커뮤니티 + 굿즈 카탈로그).

## 현재 상태

**Step 3 가입 흐름 + Step 4 /me 프로필 편집 완료** (2026-04-27).
- 라이브: https://lunatic-neon.vercel.app (Vercel auto-deploy from main)
- DB: 7개 마이그레이션 (스키마 + RLS + Auth Hook + Storage + signup + JWT 픽스 + /me update RPC)
- 정적 라우트: `/`, `/about`, `/performances`, `/events`, `/store`, `/genres/[slug]` (9개 사전 생성)
- 가입 라우트: `/signup`, `/signup/pending`, `/auth/callback` (membership 분기), `/me` (프로필 편집)
- Google OAuth + owner 자동 approve end-to-end 검증 완료
- 진행 중: avatar 업로드 (Storage avatars bucket → /me 통합), `/dancers` 갤러리 (다음 세션)

## 핵심 자료

- **Design doc**: `~/.gstack/projects/lunatic/ham-main-design-20260426-234903.md`
  - Status: APPROVED + ENG-REVIEWED + SCOPE-REFINED + DESIGN-REVIEWED
  - 모든 아키텍처/디자인 결정의 single source of truth
- **Test plan**: `~/.gstack/projects/lunatic/ham-main-eng-review-test-plan-20260427-081327.md`
  - ~22 테스트 케이스 정의 (12 E2E + 10 unit)

## 스택 (확정)

- **Frontend**: Next.js (App Router 권장)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **호스팅**: Vercel
- **테스트**: Vitest (unit) + Playwright (E2E)
- **영상**: 유튜브 임베드 (동아리 채널)
- **이미지**: Supabase Storage v1, Cloudinary v2

## 권한 모델 (확정)

- **owner**: 빌더 본인 (영구 maintainer). `app_config.owner_email` row + Supabase Auth Hook으로 JWT custom claim `user_role: owner` 박음 (top-level `role` claim은 PostgREST가 SET ROLE에 사용하므로 절대 건드리면 안 됨 — 0006_fix_owner_claim.sql 참고)
- **admin**: 현역 회장단 (매년 교체). app 내 admin role 토글로 승계
- **member**: 일반 멤버

보안: Supabase RLS (Row Level Security) 단일 source of truth. 코드 라우트 권한 체크 안 함. `members` INSERT는 `signup_member` SECURITY DEFINER RPC만 가능 (role/application_status 사용자 input 무시).

## 디자인 시스템 (확정 — design review 2026-04-27)

**Vibe**: x2y Creative 계열 — pure black + 거대 컨덴스드 산세리프 + 세리프 lowercase 로고 + 섹션 넘버링 + 영상이 색 공급.

**Colors**:
- Background: `#000000`
- Surface: `#0A0A0A`
- Text-1 (heading): `#FFFFFF`
- Text-2 (body): `#999999`
- Text-3 (deemphasized, metadata only): `#555555`
- Accent: `#F5FF00` (1px dot/marker)

**Typography**:
- Headline 영문: Big Shoulders Display Black (Google Fonts)
- Headline 한글: Pretendard Black
- Body 영문: Inter Regular
- Body 한글: Pretendard Regular
- Logo: serif lowercase (Vollkorn / DM Serif Display 중 선택)

**Layout**: 12 col desktop / 4 col mobile. Hard edges, no shadows, no borders, no radius.

자세한 명세는 design doc의 "Design System" 섹션 참조.

## 가입 흐름 (구현됨)

**2단계 분리** — application은 가입 신청 핵심만, profile은 승인 후 `/me`에서 편집:

1. Google OAuth → `/auth/callback` → `has_member_row()` 체크 → 없으면 `/signup`
2. `/signup` 폼 (6 필드): 실명, 기수(0.5단위), 국가(드롭다운), 학교(default KAIST), 학번 + invite code 토글
3. `signup_member` RPC가 분기:
   - JWT `user_role=owner` → 자동 `approved`+`role=owner`
   - 유효한 invite code → 자동 `approved`+`role=member`
   - 코드 없음 → `pending` (운영진 검토 대기, `/signup/pending` 도착)
4. `dancer_name`은 RPC가 `<email_prefix>_<uid 4자>`로 자동 생성. 사용자가 `/me`에서 변경.
5. `/me` 프로필 편집: 댄서명, 타입, 장르(+primary), 인스타, bio, bio_long, 영상 3슬롯. `update_my_profile` RPC로 members + member_genres 원자적 업데이트. (Avatar 업로드는 미구현, 다음 세션)
6. invite_codes는 admin/owner만 발급/회수 (RLS), 만료 기간 enum (1d/7d/30d/semester/permanent)
7. 학교 이메일 강제 안 함 (alumni mode 호환)

## 멤버 status

`active` / `suspended` 두 상태만. 휴학/졸업/탈퇴 분기 안 함 — 사이트는 활동 인원 관리에 관여하지 않음 (운영진이 외부 도구로 별도 관리).

## 사이트 책임 범위

- **하는 일**: 행사 홍보 + 커뮤니티 + 굿즈 카탈로그 + 콘텐츠 아카이브
- **안 하는 일**: 활동 인원 관리, 출석/회비/연습 일정/공연 캐스팅

멤버 페이지의 의미 = "운영 명부"가 아니라 **"댄서 페이지 갤러리"**.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. The
skill has multi-step workflows, checklists, and quality gates that produce better
results than an ad-hoc answer. When in doubt, invoke the skill.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke /office-hours
- Architecture, "does this design make sense" → invoke /plan-eng-review
- Design review of a plan → invoke /plan-design-review
- Bugs, errors, "why is this broken" → invoke /investigate
- Test the site, find bugs → invoke /qa
- Code review, check the diff → invoke /review
- Visual polish, design audit → invoke /design-review
- Ship, deploy, create a PR → invoke /ship
- Save progress, "save my work" → invoke /context-save
- Resume, "where was I" → invoke /context-restore
