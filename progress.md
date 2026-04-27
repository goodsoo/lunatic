# Progress

## 현재 상태

**Step 1 셋업 일부 완료** (2026-04-27). 코드 인프라 끝, Supabase/Vercel 계정 생성 + DB 스키마 + 첫 페이지 작성이 남음.

✅ Next.js 16.2.4 + Tailwind 4 + TS + App Router + src/ + Turbopack (pnpm)
✅ Supabase 클라이언트 (@supabase/supabase-js, @supabase/ssr)
✅ Vitest + RTL + Playwright 설치 + config
✅ 디자인 토큰 (colors + 폰트) `src/app/globals.css`에 `@theme`로 wired
✅ Big Shoulders + Inter + Vollkorn (next/font/google) + Pretendard variable (npm)
✅ `.env.example` 템플릿
✅ GitHub repo 생성 (github.com/goodsoo/lunatic), SSH multi-account 셋업, main push

⏳ Supabase 프로젝트 생성 (사용자 액션, 웹 UI)
⏳ DB 스키마 + RLS
⏳ Vercel 프로젝트 연결
⏳ 도메인 등록 (결정 보류)

## 다음에 해야 할 일

### 사용자 액션 필요 (Step 0)
- [ ] **회장단 합의 미팅** — owner/admin 모델, 운영 정책(초상권/모더레이션) 합의
- [ ] **9 장르 팀장 영상 시드 요청** — 각 1주 안에 대표 영상 1개 + 명장면 후보 5개
- [ ] **Supabase 프로젝트 생성** — app.supabase.com에서 새 프로젝트, URL/keys 받아 `.env.local`에 채우기
- [ ] **Vercel 프로젝트 생성** — GitHub repo 연결, env vars 등록
- [ ] **도메인 결정 + 등록** — `lunatic.dance` vs `reallunatic.com` (memory의 `project_domain_decision.md` 참조)

### 코드 작업 (Supabase 프로젝트 생긴 후)
- [ ] DB 스키마 작성 — 멤버, 장르, 행사, 공지, 미디어 (디자인 doc 참조)
- [ ] RLS 정책 — owner/admin/member 권한 모델
- [ ] OWNER_EMAIL Auth Hook (JWT custom claim에 `role: owner` 박기)
- [ ] boilerplate `src/app/page.tsx` 교체 → 디자인 시스템 적용한 첫 페이지
- [ ] Step 2 — 외부 공개 v1 (홈 hero, 행사, 9 장르 그리드, 영상 아카이브, About, 굿즈)
- [ ] Step 3 — 가입 흐름 (Google OAuth + invite code)
- [ ] Step 4-7 — 9 장르 허브, write 기능, 백업/모더레이션, 점진 출시

## 알아야 할 컨텍스트

### Stack 버전 주의
- **Next.js 16.2.4** — breaking changes 있음. `CLAUDE.md`의 `@AGENTS.md` import이 안내 강제 (Next-specific 코드 전 `node_modules/next/dist/docs/` 확인).
- **Tailwind 4** — `tailwind.config.js` 없음. 디자인 토큰은 `src/app/globals.css`의 `@theme` 디렉티브에 있음.
- **Big Shoulders** — 2024년 Google Fonts 통합으로 `Big_Shoulders_Display`가 사라짐. `next/font/google`의 `Big_Shoulders` + `weight: ["900"]` 사용.
- **pnpm** — `pnpm dev` / `pnpm build` / `pnpm test` / `pnpm test:e2e`. npm/yarn 명령어 쓰지 말 것.

### Git remote (multi-account SSH)
- GitHub username 변경: `zzompang2` → `goodsoo`
- 이 머신에 `agrphai` 다른 계정도 있어서 SSH 분리 셋업
- remote URL: `git@github.com-goodsoo:goodsoo/lunatic.git` — **호스트 alias, 오타 아님**
- `~/.ssh/config`의 `github.com-goodsoo` 항목이 `~/.ssh/id_ed25519_goodsoo` 키로 매핑
- `git config user.name` = `goodsoo` (로컬만), `user.email` = `zzompang2@gmail.com` (그대로, GitHub commit attribution 정상)

### CLAUDE.md `@AGENTS.md` import 주의
- create-next-app이 자동 생성한 1줄짜리 `@AGENTS.md` ref가 사용자 CLAUDE.md를 덮어쓴 사고 있었음
- CLAUDE.md 첫 줄 `@AGENTS.md` 절대 지우지 말 것 (Next.js 16 docs 안내 로딩)

### 도메인 결정 보류
- `lunatic.dance` vs `reallunatic.com` 두 후보로 압축
- `.kr`은 외국인 친구 때문에 제외
- `lunatic.com/.kr/.co.kr/.club` 모두 선점됨 (`lunatic.co.kr`은 2026.03.26 신규 등록 — 동명 추적자 존재 가능성)
- 자세한 분석은 memory의 `project_domain_decision.md`

## 미해결 결정 (구현 단계 중 결정)

- **도메인** — 위 참조
- **Logo serif 폰트** — Vollkorn 일단 셋업. DM Serif Display / Playfair Display 비교 후 확정
- **카피 voice** — 한국어/영문 mix 비율, 헤드라인 태그라인 (예: "9 GENRES, ONE CREW")
- **굿즈 처리 방식** — 외부 스마트스토어 링크 vs Google 폼 vs 사이트 내 신청 (default: 외부 링크)

## 미해결 위험 (구현 시 의식)

1. **Auth Hook 락아웃 시나리오** — service_role key를 password manager에 보관. 비상 절차 운영 노트 작성.
2. **검색 한국어 형태소 분석 없음** — "팝핀" / "poppin" / "파핀" 변형 못 잡음. v1 한계로 수용.
3. **Big Shoulders 한글 미지원** — 한글은 Pretendard Black로 fallback. 영/한 mix 시 시각 무게 미세 조정.
4. **Supabase Storage RLS 별도 시스템** — 테이블 RLS와 분리. bucket policy 따로 설정.
5. **유튜브 SPOF** — 채널 정지 시 영상 임베드 다 깨짐. 메타데이터는 자체 DB 보관.

## 산출물 위치

- Design doc: `~/.gstack/projects/lunatic/ham-main-design-20260426-234903.md`
- Test plan: `~/.gstack/projects/lunatic/ham-main-eng-review-test-plan-20260427-081327.md`
- 프로젝트 컨벤션: `./CLAUDE.md` (+ `@AGENTS.md` import)
- GitHub: https://github.com/goodsoo/lunatic
- Memory: `/Users/ham/.claude/projects/-Users-ham-Projects-lunatic/memory/`
