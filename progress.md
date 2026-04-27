# Progress

## 현재 상태

**Step 4 완료 + 추가 (avatar / `/dancers` / `/dancers/[id]` / `/genres/[slug]` 데이터 / unit 테스트). 야간 자동 작업 완료** (2026-04-28).

라이브: https://lunatic-neon.vercel.app (Vercel auto-deploy from `main`).
직전 푸시 fbff478 (4/27). 이번 세션 7 commit 미푸시 — 사용자 브라우저 검증 후 푸시 예정.

이번 세션 미푸시 커밋:
- 612003d feat: /me avatar upload (private bucket + signed URL preview)
- 9a6c774 feat: /dancers 갤러리 (멤버 전용, 장르 필터, batch signed URLs)
- 1884571 docs: sync after avatar + /dancers
- 2718d73 refactor: DancerCard 공유 컴포넌트
- dd67847 feat: /dancers/[id] 댄서 상세 (영상 임베드 + 메타 + 인스타)
- 29f6f5c feat: /genres/[slug] 댄서 데이터 연결 (9개 장르 라우트)
- afef173 test: validation + youtube helper unit tests (29 cases, 합 34 passed)

### 완료 — 큰 그림
- Step 1: 셋업 + Supabase DB (스키마/RLS/Auth Hook/Storage) + Vercel 연결
- Step 2: 정적 페이지 v1 (`/`, `/about`, `/performances`, `/events`, `/store`, `/genres/[slug]` × 9) + 디자인 시스템
- Step 3: Google OAuth + 가입 흐름 (`/signup` + `/signup/pending` + `signup_member` RPC). owner 자동 approve, invite code 즉시 승인, 코드 없음 → pending 큐. 본인 + cross-account 검증 완료.
- Step 4: `/me` 프로필 편집 (`update_my_profile` RPC) + avatar 업로드 (Storage `avatars` private bucket → 클라이언트 업로드 → `updateAvatar`가 `members.avatar_url` 직접 UPDATE + 이전 파일 정리, signed URL preview, 폼과 분리된 즉시 저장).
- 멤버 갤러리 + 댄서 상세 + 장르 데이터 연결: `/dancers` (dancers_member view + member_genres 조인, 장르 필터 `?g=`, `createSignedUrls` 일괄), `/dancers/[id]` (bio_long + youtube 임베드 + 인스타 + 메타), `/genres/[slug]` (placeholder → 실제 댄서 그리드, primary 우선).
- 검증 모듈 추출 + unit 테스트: `src/lib/validation.ts` (signup/profile/avatar path 검증) + `src/lib/youtube.ts` (URL → embed). `signup/actions.ts`, `me/actions.ts`이 위 함수만 호출. 34 unit 테스트 통과.

### 마이그레이션 7개
0001 스키마 → 0002 RLS → 0003 Auth Hook → 0004 Storage → 0005 signup_member RPC → 0006 JWT claim 픽스(`role`→`user_role`) + signup RPC 시그니처 단순화 → 0007 update_my_profile RPC.

## 다음에 해야 할 일

### 직전 작업 검증 + 푸시 (사용자 액션)
- [ ] `/me` avatar — 업로드/교체/삭제, signed URL preview, prod 정책.
- [ ] `/dancers` — 비로그인/pending redirect, 카드 그리드, 장르 필터 카운트.
- [ ] `/dancers/[id]` — 영상 임베드 (watch/youtu.be/shorts 모두), 인스타 링크.
- [ ] `/genres/[slug]` — placeholder 사라지고 댄서 그리드 표시.
- [ ] `git push` (검증 후).

### 다음 작업 후보 (우선순위)
1. **`/events/[id]` 행사 상세 + admin 행사 등록 UI** — Step 5. 새 RPC 가능성 (event INSERT는 admin RLS로 직접 가능할 수도).
2. **`/notices` 멤버 공지** — Step 6.
3. **reaction + shout** — Step 7 (D7 디자인).
4. **`/genres/[slug]` 영상 섹션** — 장르별 대표 영상 + 명장면. 시드 데이터 대기 (팀장).
5. **권한 헬퍼 + 테스트** — `isAdmin`, `canCurate` 등 lib 헬퍼 (테스트 플랜 권한 3건).

### 사용자 액션 대기 (블로커 아님)
- 회장단 합의 미팅 — owner/admin 모델, 운영 정책(초상권/모더레이션)
- 9 장르 팀장 영상 시드 요청 — 대표 영상 1개 + 명장면 후보 5개씩
- 도메인 결정 + 등록 — `lunatic.dance` vs `reallunatic.com` (memory `project_domain_decision.md`)
- About 카피 검수 — 임시 카피 박혀있음, 공식 카피로 교체

## 알아야 할 컨텍스트

### Stack 버전 주의
- **Next.js 16.2.4** — breaking changes. CLAUDE.md `@AGENTS.md` import이 안내 강제. Next-specific 코드 전 `node_modules/next/dist/docs/` 확인.
- **Tailwind 4** — `tailwind.config.js` 없음. 디자인 토큰은 `src/app/globals.css`의 `@theme` 디렉티브.
- **Big Shoulders** — `Big_Shoulders` (not `Big_Shoulders_Display`) + `weight: ["900"]`.
- **pnpm** — `pnpm dev` / `pnpm build` / `pnpm test` / `pnpm test:e2e`.
- **Vitest 4** — `vitest.config.mts` 확장자. DOM 필요 없는 테스트는 파일 상단에 `// @vitest-environment node`.
- **`@rolldown/binding-darwin-x64`** — pnpm 자동 안 깔아서 devDependency 명시.
- **Next 16: `middleware.ts` → `proxy.ts`** — 함수명도 `middleware` → `proxy`. `src/proxy.ts` + `src/lib/supabase/proxy.ts` (helper).
- **Next 16: async cookies + async params** — `cookies()`/`params`/`searchParams` 모두 Promise. `await` 필수.
- **React 19 form 자동 reset** — `<form action={fn}>` + `useActionState`는 액션 끝나면 `requestFormReset`이 controlled checkbox/radio까지 영향. genre + primary 같은 토글 UI는 `<form onSubmit={...}>` + `useTransition`으로 직접 호출 패턴 (`/me/MyProfileForm.tsx` 참고). text input만 있는 폼은 `useActionState`로 충분 (`/signup/SignupForm.tsx`).

### Supabase 인프라 결정 사항
- **Migration 관리**: `supabase/migrations/*.sql`을 repo 커밋 → 사용자가 Supabase Dashboard SQL Editor에서 수동 실행. Docker 불필요. 새 migration은 다음 번호.
- **DB 스키마**: 11 테이블 (members, member_genres, invite_codes, events, event_lineup, videos, notices, reactions, shouts, reports, takedown_requests).
- **RLS 패턴**: `effective_role()` security definer 함수가 JWT claim `user_role: owner` 또는 `members.role` 읽음. RLS 정책이 이 함수 호출. ⚠️ JWT의 top-level `role` claim은 PostgREST가 `SET ROLE`에 사용 — 절대 건드리면 안 됨 (0006_fix_owner_claim.sql 참고).
- **PII 가시성**: `dancers_public` view (anon, 댄서명만) / `dancers_member` view (멤버, 갤러리 데이터) / `members` 직접 접근은 self+admin만.
- **Owner 식별**: `app_config.owner_email` row → Auth Hook이 매칭 시 JWT custom claim `user_role: owner` 박음. 변경은 `app_config` row만 수정.
- **Members INSERT**: `signup_member` SECURITY DEFINER RPC만 가능 (0005에서 `members_self_insert` 정책 drop). role/application_status는 RPC가 서버 측에서 결정.
- **/me 업데이트**: `update_my_profile` SECURITY DEFINER RPC가 members + member_genres 원자적 처리 (genres delete + insert가 partial-write 안 되게).
- **Storage**: avatars/event_photos는 private bucket + 정책. store_images는 public bucket.

### OAuth/Auth 구조
- **Google OAuth**: Google Cloud Console에서 OAuth client 발급 → Supabase Dashboard에서 Google provider Enable + client ID/secret 입력.
- **Redirect URLs**: Supabase URL Configuration에 `http://localhost:3000/**` + `https://lunatic-neon.vercel.app/**` 등록.
- **Auth Hook**: Dashboard에서 `Custom Access Token Hook` Enable + `public.custom_access_token_hook` 매핑 — 매 sign-in 시 OWNER_EMAIL 매칭 검사. 0006 적용 후엔 `user_role` claim에 박음.
- **JWT 갱신 트랩**: 0006 같은 Auth Hook 변경 후엔 기존 세션 쿠키의 JWT는 옛날 claim 모양. 사용자가 sign out → sign in 다시 해야 새 hook 결과 반영.
- **dancer_name 자동 생성**: signup_member RPC가 `<email_prefix>_<uid 4자>` 형식으로 박음. 사용자가 `/me`에서 변경.

### Git remote (multi-account SSH)
- GitHub username `goodsoo` (이전 `zzompang2`에서 변경).
- remote URL `git@github.com-goodsoo:goodsoo/lunatic.git` — **호스트 alias, 오타 아님**.
- `~/.ssh/config`의 `github.com-goodsoo` 항목이 `~/.ssh/id_ed25519_goodsoo`로 매핑.
- `git config user.email` = `zzompang2@gmail.com` (그대로 유지, GitHub commit attribution 정상).

### CLAUDE.md `@AGENTS.md` import 주의
- create-next-app이 자동 생성한 1줄짜리 `@AGENTS.md` ref가 사용자 CLAUDE.md를 덮어쓴 사고 있었음.
- CLAUDE.md 첫 줄 `@AGENTS.md` 절대 지우지 말 것 (Next.js 16 docs 안내 로딩).

### About 페이지 카피 (임시)
- "since 2004" + "@lunatic_street" Instagram + KAIST 학내 동아리 + "약 100명" 문구는 부정확이라 제외.
- 공식 카피 받으면 `src/app/about/page.tsx` 텍스트 교체.

## 미해결 결정

- **도메인** — `lunatic.dance` vs `reallunatic.com` (memory `project_domain_decision.md`).
- **Logo serif 폰트** — Vollkorn 일단 셋업. DM Serif Display / Playfair Display 비교 후 확정.
- **굿즈 처리 방식** — 외부 스마트스토어 링크 vs Google 폼 (default: 외부 링크).
- **Avatar 업로드 시점** — `/me`에서 처리하기로 결정. 다음 세션 작업.

## 미해결 위험

1. **Auth Hook 락아웃** — service_role key를 password manager에 보관. 비상 절차 운영 노트 작성.
2. **검색 한국어 형태소** — "팝핀" / "poppin" / "파핀" 변형 못 잡음. v1 한계로 수용.
3. **Big Shoulders 한글 미지원** — Pretendard Black fallback. 영/한 mix 시 시각 무게 차이.
4. **Supabase Storage RLS 별도 시스템** — 테이블 RLS와 분리. bucket policy 따로 설정.
5. **유튜브 SPOF** — 채널 정지 시 영상 임베드 다 깨짐. 메타데이터는 자체 DB 보관.

## 산출물 위치

- Design doc: `~/.gstack/projects/lunatic/ham-main-design-20260426-234903.md`
- Test plan: `~/.gstack/projects/lunatic/ham-main-eng-review-test-plan-20260427-081327.md`
- 프로젝트 컨벤션: `./CLAUDE.md` (+ `@AGENTS.md` import)
- GitHub: https://github.com/goodsoo/lunatic
- Vercel: https://lunatic-neon.vercel.app
- Memory: `/Users/ham/.claude/projects/-Users-ham-Projects-lunatic/memory/`
