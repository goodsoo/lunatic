# Progress

## 현재 상태

**Pre-implementation 완료. 코드 작성 시작 직전.**

3개 plan-mode 리뷰 통과:
- /office-hours (디자인 doc 작성)
- /plan-eng-review (9 아키텍처 결정)
- /plan-design-review (디자인 시스템 잠금)

리뷰 점수: 디자인 3/10 → 8/10. 모든 결정 잠금 상태.

## 다음에 해야 할 일

### Step 0 — 코드 전 (사람 일정)
- [ ] **회장단 합의 미팅** — 사이트가 동아리 공식이 됨, owner/admin 모델, 운영 정책(초상권/모더레이션) 합의
- [ ] **9 장르 팀장 영상 시드** — 각 1주 안에 대표 영상 1개 + 명장면 후보 5개 제출 요청
- [ ] **인프라 계정 생성** — Vercel, Supabase (빌더 본인 명의), 도메인 등록

### Step 1 — 셋업 (코드)
- [ ] Next.js 프로젝트 생성 (App Router)
- [ ] Supabase 프로젝트 + DB 스키마 (멤버, 장르, 행사, 공지, 미디어 등)
- [ ] DB 스키마에 owner/admin/member 권한 모델 반영
- [ ] Big Shoulders Display Black + Pretendard 폰트 셋업
- [ ] CSS variables 또는 Tailwind에 디자인 시스템 (`#000`, `#FFF`, `#F5FF00` 등) 등록
- [ ] Vercel 연결, GitHub repo 생성

### Step 2 — 외부 공개 v1
- [ ] 홈 hero (영상 loop 6–12개 × 5–10초, 무음 autoplay)
- [ ] 다가오는 행사 섹션 (없으면 9 장르 fallback)
- [ ] 9 장르 그리드 (desktop 3×3, mobile 가로 스크롤)
- [ ] 공연 영상 아카이브
- [ ] About / 가입 안내
- [ ] 굿즈 카탈로그 (외부 신청 링크)
- [ ] 통합 검색 (ILIKE %% + pg_trgm 인덱스)

### Step 3 — 인증 + 가입 흐름
- [ ] Google OAuth (Supabase Auth)
- [ ] Auth Hook으로 OWNER_EMAIL 매칭 → JWT custom claim 박음
- [ ] 가입 폼 (모든 필드 — 실명/댄서명/기수/타입/학번/사진/장르/인스타)
- [ ] Invite code 시스템 (만료 기간 설정 가능)
- [ ] admin 승인 큐 페이지

### Step 4 — 9 장르 허브 + 행사 페이지
- [ ] 장르별 멤버 그리드 + 대표 영상
- [ ] 행사 페이지 양식 (운영진이 작성)

### Step 5 — write 기능
- [ ] 공지/행사 이모지 reaction
- [ ] 멤버 프로필 'shout' (한 줄 응원, 모더레이션 신고 버튼 포함)

### Step 6 — 백업 + 운영
- [ ] 주간 pg_dump → Google Drive 자동 백업 (GitHub Actions)
- [ ] takedown 폼
- [ ] 모더레이션 신고/승인 UI

### Step 7 — 점진 출시
- [ ] 지인 베타 (운영진 + 가까운 댄서 5–10명)
- [ ] 본인 페이지 채우기 캠페인
- [ ] 30–50개 댄서 페이지 채워졌을 때 광범위 공개

## 미해결 결정 (구현 단계 중 결정)

- **Logo serif 폰트** — Vollkorn / DM Serif Display / Playfair Display 중 1개 선택
- **카피 voice** — 한국어/영문 mix 비율, 헤드라인 태그라인 작성 (예: "9 GENRES, ONE CREW")
- **굿즈 처리 방식** — 외부 스마트스토어 링크 vs Google 폼 vs 사이트 내 신청 폼 (default: 외부 링크)

## 미해결 위험 (구현 시 의식)

1. **Auth Hook 락아웃 시나리오** — service_role key를 password manager에 보관. 비상 절차 운영 노트에 1페이지 작성.
2. **검색 한국어 형태소 분석 없음** — "팝핀" vs "poppin" vs "파핀" 변형 못 잡음. v1 한계로 수용.
3. **Big Shoulders Display Black 한글 미지원** — 한글은 Pretendard Black. 영/한 mix 시 시각 무게 미세 조정 필요.
4. **Supabase Storage RLS 별도 시스템** — 테이블 RLS와 분리. bucket policy 별도 설정.
5. **유튜브 SPOF** — 채널 정지 시 영상 임베드 다 깨짐. 메타데이터는 우리 DB.

## 알아야 할 컨텍스트

### 빌더 = 졸업생 영구 maintainer
인프라(Vercel/Supabase/도메인)는 본인 명의. 회장단은 app 내 admin 권한만 받음. 인프라 인수인계 안 함. 사이트 owner / admin 분리 모델의 핵심 이유.

### 사이트 ≠ 활동 인원 관리
사이트 가입 = "내 댄서 페이지 만들 권한"이지 "동아리 활동 멤버임"이 아님. 활동 인원은 카톡/노션/엑셀 등 별도. 멤버 status는 `active` / `suspended` 두 상태만.

### Vibe = x2y Creative 계열
Pure black + 거대 컨덴스드 산세리프 + 세리프 lowercase 로고 + 섹션 넘버링 ((01), (02)) + 영상이 색 공급. 댄스 동아리 브랜드와 굿즈에 동일 시스템 적용.

### 첫 출시는 점진 — 빈 사이트 보이지 않도록
지인 베타로 30–50개 댄서 페이지 채운 뒤 광범위 공개.

## 산출물 위치

- Design doc: `~/.gstack/projects/lunatic/ham-main-design-20260426-234903.md`
- Test plan: `~/.gstack/projects/lunatic/ham-main-eng-review-test-plan-20260427-081327.md`
- 프로젝트 컨벤션: `./CLAUDE.md`
