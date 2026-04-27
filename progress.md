# Progress

## 현재 상태

**Step 2 외부 공개 v1 라이브 + Step 3 가입 흐름 절반** (2026-04-27).

라이브: https://lunatic-neon.vercel.app (Vercel auto-deploy from `main`)

✅ Step 1 — 셋업 (Next.js 16, Tailwind 4, Supabase 클라이언트, Vitest, Playwright, 디자인 토큰, 폰트, GitHub repo)
✅ Step 1 — Supabase 프로젝트 + DB 셋업 (스키마 + RLS + Auth Hook + Storage, 11 테이블/7 enum)
✅ Step 1 — Auth Hook Dashboard 토글 (사용자가 활성화)
✅ Step 1 — Vercel 프로젝트 연결 + env vars + auto-deploy 동작
✅ Step 2 — 정적 페이지 v1: `/`, `/about`, `/performances`, `/events`, `/store`, `/genres/[slug]` (9개 사전 생성)
✅ Step 2 — 헤더/푸터 layout으로 공통화, Big Shoulders/Inter/Pretendard/Vollkorn 폰트 wired
✅ Step 3 — Supabase SSR client wrappers (`browser.ts`, `server.ts`, `proxy.ts`)
✅ Step 3 — Next 16 `proxy.ts` (이전 `middleware.ts` 컨벤션 deprecate됨)
✅ Step 3 — `/auth/callback` route + `/auth/error` 페이지
✅ Step 3 — Server actions: `signInWithGoogle`, `signOut`
✅ Step 3 — SiteHeader 로그인 상태 표시 (Sign in / 이메일 + Sign out)
✅ Step 3 — Google Cloud Console OAuth client + Supabase Google provider 활성화 (사용자 작업)
✅ Step 3 — 로컬에서 Google OAuth end-to-end 검증 통과

## 다음에 해야 할 일

### Step 3 가입 흐름 마무리 (다음 세션 핵심)
- [ ] **`0005_signup.sql` 마이그레이션** — `signup_member` SECURITY DEFINER RPC 함수
  - 폼 데이터 받아 `members` row + `member_genres` rows 생성
  - invite code 검증 → 유효시 `application_status='approved'`, 없으면 `'pending'`
  - `role`/`application_status` 사용자가 직접 못 박게 RPC가 강제
  - 기존 `members_self_insert` 정책 drop (RPC만이 INSERT 경로)
- [ ] **`/signup` 폼 페이지** — 디자인 시스템 적용
  - 필수: 실명, 댄서명, 기수(numeric 0.5단위), 타입(undergrad/grad/other), 장르(>=1, primary 1개)
  - 선택: 학번, 학교(default KAIST), 국가(default KR), 인스타, 한 줄 자기소개, 자유 텍스트(200자), 영상 3슬롯
  - 코드 입력 또는 가입 사유 둘 중 하나 필수
- [ ] **`/auth/callback` 업데이트** — exchangeCode 후 members row 존재 여부 체크 → 없으면 `/signup`, 있으면 `/`로
- [ ] **헬퍼** `getUserAndMember()` (server component용)
- [ ] **본인 첫 가입 테스트** — 본인 OWNER_EMAIL이라 invite code 없어도 admin 승인 없이 진입 가능해야 함 (RPC에서 owner 자동 approve 분기 추가 검토)
- [ ] **avatar 업로드** — 일단 건너뜀 (`/me` 페이지에서 추후)

### Step 4 이후 (큰 그림)
- [ ] `/me` 프로필 편집 페이지 (avatar 업로드 포함)
- [ ] `/dancers` 갤러리 + `/dancers/[dancer_name]`
- [ ] `/genres/[slug]` 실제 데이터 연결
- [ ] `/events/[id]` 행사 상세
- [ ] `/notices` 공지 (멤버 전용)
- [ ] reaction + shout 구현 (D7)
- [ ] 검색 (pg_trgm)
- [ ] Hall of Fame 큐레이션 UI
- [ ] 신고/모더레이션, takedown 폼
- [ ] 주간 백업 자동화

### 사용자 액션 대기
- [ ] **회장단 합의 미팅** — owner/admin 모델, 운영 정책(초상권/모더레이션) 합의
- [ ] **9 장르 팀장 영상 시드 요청** — 대표 영상 1개 + 명장면 후보 5개씩
- [ ] **도메인 결정 + 등록** — `lunatic.dance` vs `reallunatic.com` (memory의 `project_domain_decision.md`)
- [ ] **About 카피 검수** — 임시 카피 박혀있음, 공식 카피로 교체

## 알아야 할 컨텍스트

### Stack 버전 주의
- **Next.js 16.2.4** — breaking changes. CLAUDE.md의 `@AGENTS.md` import이 안내 강제 (Next-specific 코드 전 `node_modules/next/dist/docs/` 확인).
- **Tailwind 4** — `tailwind.config.js` 없음. 디자인 토큰은 `src/app/globals.css`의 `@theme` 디렉티브.
- **Big Shoulders** — `Big_Shoulders` (not `Big_Shoulders_Display`) + `weight: ["900"]`.
- **pnpm** — `pnpm dev` / `pnpm build` / `pnpm test` / `pnpm test:e2e`.
- **Vitest 4 ESM/CJS** — `vitest.config.mts` 확장자. DOM 필요 없는 테스트는 파일 상단에 `// @vitest-environment node`.
- **`@rolldown/binding-darwin-x64`** — pnpm 자동 안 깔아서 devDependency 명시. arm64/linux 머신에서는 별도 binding 필요할 수 있음.
- **Next 16: `middleware.ts` → `proxy.ts`** — 이전 컨벤션 deprecated. 함수명도 `middleware` → `proxy`. 우리는 `src/proxy.ts` + `src/lib/supabase/proxy.ts` (helper).
- **Next 16: async cookies + async params** — `cookies()`/`params`/`searchParams` 모두 Promise. `await` 필수.

### Supabase 인프라 결정 사항
- **Migration 관리**: `supabase/migrations/*.sql` 파일을 repo에 커밋 → 사용자가 Supabase Dashboard SQL Editor에서 수동 실행. Docker 불필요. 새 migration은 다음 번호 (`0005_*.sql`).
- **DB 스키마**: 11 테이블 (members, member_genres, invite_codes, events, event_lineup, videos, notices, reactions, shouts, reports, takedown_requests).
- **RLS 패턴**: `effective_role()` security definer 함수가 JWT claim(`role: owner`) 또는 `members.role` 읽음. RLS 정책이 이 함수 호출.
- **PII 가시성**: `dancers_public` view (anon, 댄서명만) / `dancers_member` view (멤버, 갤러리 데이터) / `members` 직접 접근은 self+admin만.
- **Owner 식별**: `app_config` 테이블의 `owner_email` row → Auth Hook이 매칭 시 JWT에 `role: owner` 박음. 변경은 `app_config` row만 수정.
- **Storage**: avatars/event_photos는 private bucket + 정책. store_images는 public bucket.

### OAuth/Auth 구조
- **Google OAuth**: Google Cloud Console에서 OAuth client 발급 → Supabase Dashboard에서 Google provider Enable + client ID/secret 입력.
- **Redirect URLs**: Supabase URL Configuration에 `http://localhost:3000/**` + `https://lunatic-neon.vercel.app/**` 등록 필요.
- **Auth Hook**: Dashboard에서 `Custom Access Token Hook` Enable + `public.custom_access_token_hook` 매핑 — 매 sign-in 시 OWNER_EMAIL 매칭 검사.
- **로컬 dev 검증**: 시크릿 창 + http://localhost:3000 에서 Sign in 클릭 → Google 동의 → /auth/callback → 헤더 우상단 본인 이메일 표시 확인.

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
- **Owner 첫 가입 처리** — RPC에서 OWNER_EMAIL 매칭 시 자동 approve 분기 vs admin 직접 row 생성.
- **Avatar 업로드 시점** — 가입 폼에 포함 vs `/me` 편집에서. 현재는 `/me`로 미룸.

## 미해결 위험

1. **Auth Hook 락아웃** — service_role key를 password manager에 보관. 비상 절차 운영 노트 작성.
2. **검색 한국어 형태소** — "팝핀" / "poppin" / "파핀" 변형 못 잡음. v1 한계로 수용.
3. **Big Shoulders 한글 미지원** — Pretendard Black fallback. 영/한 mix 시 시각 무게 차이.
4. **Supabase Storage RLS 별도 시스템** — 테이블 RLS와 분리. bucket policy 따로 설정.
5. **유튜브 SPOF** — 채널 정지 시 영상 임베드 다 깨짐. 메타데이터는 자체 DB 보관.
6. **Members INSERT 보안** — 현재 `members_self_insert` 정책이 `id = auth.uid()`만 검증. role/application_status 임의 설정 가능. `0005_signup.sql`에서 RPC만 허용으로 잠가야 함.

## 산출물 위치

- Design doc: `~/.gstack/projects/lunatic/ham-main-design-20260426-234903.md`
- Test plan: `~/.gstack/projects/lunatic/ham-main-eng-review-test-plan-20260427-081327.md`
- 프로젝트 컨벤션: `./CLAUDE.md` (+ `@AGENTS.md` import)
- GitHub: https://github.com/goodsoo/lunatic
- Vercel: https://lunatic-neon.vercel.app
- Memory: `/Users/ham/.claude/projects/-Users-ham-Projects-lunatic/memory/`
