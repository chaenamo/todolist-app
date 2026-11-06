# TodoList 프로젝트 구조 설계 원칙

## 버전 이력

| 버전 | 일자 | 작성자 | 상태 | 비고 |
|------|------|--------|------|------|
| v0.1 | 2026-11-04 | chaenamo | 초안 | 최초 작성 |
| v0.2 | 2026-11-04 | chaenamo | 초안 | 아키텍처 다이어그램 AQ-01~03 결정 반영 |
| v0.3 | 2026-11-04 | chaenamo | 초안 | 인증: JWT HS384 + refresh token(localStorage, 14일, 회전 없음) 반영 |
| v0.4 | 2026-11-04 | chaenamo | 초안 | 문서 간 정합성 검토 반영 |
| v0.5 | 2026-11-04 | chaenamo | 초안 | U-08 결정 반영 |
| v0.6 | 2026-11-05 | chaenamo | 초안 | 부하 테스트·배포 범위 제외 반영 |
| v0.7 | 2026-11-05 | chaenamo | 초안 | 헬스체크 응답에 DB 연결 상태(`db`) 추가 |
| v0.8 | 2026-11-05 | chaenamo | 초안 | 개발 환경도 CORS 방식으로 변경(Vite 프록시 제거), `CORS_ORIGIN` 필수화 |
| v0.9 | 2026-11-05 | chaenamo | 초안 | U-07 결정: 스타일 가이드 `docs/style-guide.md` |
| v1.0 | 2026-11-05 | chaenamo | 초안 | 백엔드 구현 완료에 맞춰 미결·PR 확정 |
| v1.1 | 2026-11-05 | chaenamo | 초안 | U-03·U-06 결정 |
| v1.2 | 2026-11-05 | chaenamo | 초안 | FE 구현 결과에 맞춰 디렉토리 트리 보강 |
| v1.3 | 2026-11-06 | chaenamo | 초안 | 구현 코드와 대조해 사실 불일치 수정(다국어·화면 설정·개발 로깅·패키지·디렉토리 트리) |

## 변경 이력

| 버전 | 일자 | 변경 섹션 | 변경 내용 | 변경자 |
|------|------|-----------|-----------|--------|
| v0.1 | 2026-11-04 | 전체 | 도메인 정의서 v0.3, PRD v0.3, 사용자 시나리오 v0.2, 와이어프레임 v0.2 기반 프로젝트 구조 설계 원칙 최초 작성 | chaenamo |
| v0.2 | 2026-11-04 | 기준 문서, PR-14, PR-16, PR-20, PR-46 | AQ-01: 로그인·회원가입 요청의 401은 공통 401 처리에서 제외. AQ-02: 409 `CONFLICT`에 `fields`를 담고 unique 제약 이름으로 필드를 매핑. AQ-03: 쓰기는 낙관적 업데이트 없이 성공 후 즉시 재조회 | chaenamo |
| v0.3 | 2026-11-04 | 기준 문서, PR-07, PR-11, PR-14, PR-16, PR-22, PR-29, PR-34, PR-37, PR-40, 5장 `.env.example`, 6.2, 6.3, 7(U-02) | 인증: JWT HS384 + refresh token(localStorage, 14일, 회전 없음) 반영. PR-16에 401 → single-flight refresh → 원 요청 1회 재시도 추가, PR-37을 HS384·access 15분·`algorithms` 명시·refresh/logout API로 변경, 환경변수 `JWT_ACCESS_SECRET`·`ACCESS_TOKEN_TTL`·`REFRESH_TOKEN_TTL_DAYS`로 교체, `refreshTokenRepository.js` 추가, U-02 결정 처리 | chaenamo |
| v0.4 | 2026-11-04 | 기준 문서, PR-36, 6.2 | 문서 간 정합성 검토 반영: 기준 시나리오·와이어프레임 v0.5로 갱신, 6.2 마이그레이션 트리를 `001_init.sql` 1개에서 ERD(`7-erd.md` 6장)·실행 계획의 테이블별 4개(001~004)로 변경(ERD EQ-02 결정), 실행 계획 Task 파일 `db/verify.sql`·`test/health.test.js`를 트리에 추가, PR-36 `password_hash` select 함수를 로그인용·비밀번호 변경용 각 1개로 명확화(실행 계획 BE-05·BE-11과 일치) | chaenamo |
| v0.5 | 2026-11-04 | 0, 7(U-08) | U-08 결정: 실행 계획 문서는 `docs/8-plan.md`, 두 개발 스킬 경로를 그에 맞게 수정 완료. 0장 스킬 관계 표의 번호 충돌 행을 해결로 갱신 | chaenamo |
| v0.6 | 2026-11-05 | 기준 문서, PR-32, PR-45, 6.2, 6.4, 7(U-01) | 이번 범위에서 부하 테스트를 하지 않고 배포는 사용자가 직접 하므로: PR-32를 "부하 테스트 미실시, NFR-05~07 코드 리뷰 선적용"으로, PR-45 용도에서 배포·부하 테스트 제거, 디렉토리 트리·파일 위치 표에서 `backend/loadtest/` 삭제, U-01을 범위 밖으로 표기. 기준 PRD v0.5 | chaenamo |
| v0.7 | 2026-11-05 | PR-45 | 헬스체크 응답에 DB 연결 상태 `db` 추가(200 `connected`, 503 `disconnected`) | chaenamo |
| v0.8 | 2026-11-05 | PR-34, PR-35, 5, 6.3 | 개발·운영 모두 CORS 방식: Vite 프록시를 제거하고 FE가 `VITE_API_BASE_URL`로 BE를 직접 호출. 개발 값은 `frontend/.env.development`(커밋, 비밀 아님). `CORS_ORIGIN`을 필수 환경변수로(코드 기본값 제거), 쉼표로 여러 출처, `*`면 기동 종료 | chaenamo |
| v0.9 | 2026-11-05 | 0, 6.3, 7(U-07) | U-07 결정: 스타일 가이드 원본은 `docs/style-guide.md`, `tokens.css`는 그 구현(SG-01) | chaenamo |
| v1.0 | 2026-11-05 | PR-45, PR-46, 7(U-04, U-05, U-09) | BE-01~12 완료 반영: PR-45에 `checkConnection()` 헬퍼 사용(AQ-07), PR-46에 23503 → 409 매핑(EQ-01) 명시. U-04·U-05·U-09를 구현 값으로 결정 처리 | chaenamo |
| v1.1 | 2026-11-05 | 7(U-03, U-06) | FE 구현으로 U-03(FullCalendar 6.1.22)·U-06(네이티브 날짜 입력) 결정 | chaenamo |
| v1.2 | 2026-11-05 | 6.3 | FE-01~13 구현 결과 반영: 트리에 `.env.development`, `queryClient.ts`, `hooks/useMediaQuery.ts`, `stores/toastStore.ts` 추가 | chaenamo |
| v1.3 | 2026-11-06 | PR-08, PR-14, PR-21, PR-40, 2.3 허용 패키지, 6.2, 6.3 | 구현 코드와 대조: PR-08 금지 목록의 "i18n"을 "i18n 라이브러리"로(다국어는 FE `i18n/` 사전·BE `i18n.js` 직접 구현, BE-13·FE-14·FE-15). PR-14 Zustand에 화면 설정(`localeStore`, `themeStore`, localStorage) 추가. PR-21 서버 문구를 `Accept-Language`(ko·ja·en)로 번역해 응답. PR-40에 FE `lib/logger.ts`(개발 모드 전용 콘솔 로그) 추가. 허용 패키지에 BE `swagger-ui-express`·`yaml`, FE 개발 `@vitest/coverage-v8`·`@testing-library/react`·`jsdom` 추가. 6.2 트리: scripts(`test:coverage`, `migrate:test`), `dev.env`, `swagger.yaml`, `apiDocs.js`, `i18n.js`, `validators/user.js`, `test/test.env`·기타 테스트 파일. 6.3 트리: scripts(`preview`, `test:coverage`), `test-setup.ts`, `i18n/`, `stores/localeStore.ts`·`themeStore.ts`, `lib/logger.ts`, `components/LanguageSelect`·`ThemeSelect`·`FontSizeSelect` | chaenamo |

> 기준 문서: `docs/1-domain-definition.md` (v0.3), `docs/2-PRD.md` (v0.5), `docs/3-user-scenario.md` (v0.5), `docs/4-wireframe.md` (v0.5).
> 기준 문서 ID(P, FR, ST, BR, UC, AC, A, Q, NFR, TC, M, R, K, SC, G, WF, CMP)는 **참조만** 하며 재정의하지 않는다. 규칙 본문은 원 문서를 따른다.
> 이 문서 고유 ID: 원칙 `PR-xx`, 미결 사항 `U-xx`. 삭제되어도 **재사용하거나 다시 매기지 않는다.**

## 0. 적용 범위와 개발 스킬과의 관계

- 이 문서는 코드를 쓰기 전에 정하는 **구조·관례**만 다룬다. API 엔드포인트 전체 명세, DB DDL, 컴포넌트 상세는 후속 문서에서 정의한다(PRD 3.2).
- 1인·2일 MVP(PRD 1.2, M-01~05)이므로 모든 원칙은 **2일 안에 실제로 지킬 수 있는 것**만 둔다. 원칙끼리 충돌하면 PR-01(단순함)이 우선하되, 보안(PR-07)과 서버 검증(PR-06)은 줄이지 않는다.
- 이 저장소의 개발 스킬(`.claude/skills/develop-backend`, `develop-frontend`)과의 관계:

| 스킬 관례 | 이 문서 | 처리 |
|-----------|---------|------|
| 코드 위치 `backend/`, `frontend/` 디렉토리 | 6장 루트 레이아웃과 동일 | 일치 |
| 작업 단위 문서의 TASK 번호 | 실행 계획 문서는 `docs/8-plan.md` | **해결**(U-08 결정): 스킬 경로를 `docs/8-plan.md`로 고쳐 번호 충돌 없음 |
| 테스트 커버리지 **90% 이상** | 4장은 2일 일정상 **필수 최소 범위**를 정의 | **충돌**. 해결: 스킬로 작업할 때는 스킬 기준(90%)을 따르되, 측정 대상은 그 TASK가 바꾼 BE `services/`·`repositories/`·`validators/`·`domain/`과 FE `lib/`·`hooks/`로 한정한다(PR-30). 페이지·표시용 컴포넌트는 측정에서 뺀다. 시간이 모자라면 PR-29 필수 범위를 먼저 채우고, 미달분은 스킬 규칙대로 보고한다 |
| UI 컴포넌트에 **스타일 가이드** 적용 | 스타일 가이드 문서 없음 | **결정**(U-07): `docs/style-guide.md`가 원본, `frontend/src/styles/tokens.css`는 그 토큰의 구현(PR-24, SG-01) |
| 테스트 작성·구현을 서브에이전트로 병렬 수행 | 레이어·파일 경계를 명확히 둔다(2장, 6장) | 일치 (경계가 분명해야 병렬 작업 충돌이 적다) |

## 1. 최상위 공통 원칙 (모든 스택)

| ID | 규칙 | 이유 (근거) |
|----|------|-------------|
| PR-01 | **단순함 우선 / YAGNI.** 지금 UC·NFR에 필요한 것만 만든다. 추상화는 같은 코드가 3번 반복될 때 만든다. "나중을 위한" 옵션·설정·레이어를 두지 않는다. | 1인·2일 MVP (PRD 1.2, M-01~05, K-01) |
| PR-02 | **문서가 단일 진실 원천.** 규칙은 코드에 다시 정의하지 않고 ID로 참조한다(테스트 이름, 검증 함수 주석, 커밋 메시지에 `BR-11`, `AC-03` 등). 구현 중 규칙을 바꿔야 하면 문서를 먼저 고친다. | 문서 간 추적성 (도메인 ID 규칙, 시나리오 5장 추적 매트릭스) |
| PR-03 | **할일 상태는 파생 값이며 저장하지 않는다.** DB에 `status` 컬럼을 두지 않는다. 판정 로직은 **BE 한 곳**(`backend/src/domain/todoStatus.js`)에만 두고, FE는 응답의 상태 값을 표시만 한다. | ST-01~04, 용어집 '할일 상태', CMP-05 |
| PR-04 | **날짜는 date-only 문자열 `'YYYY-MM-DD'`로 FE↔BE↔DB 일관.** DB는 `date` 타입, API는 문자열, FE도 문자열로 다룬다. 시작일자·종료일자·'오늘'에 타임존 변환을 하지 않는다. 비교는 문자열 비교(사전순 = 날짜순)로 충분하다. 일시(완료일시·생성일시)만 `timestamptz`/ISO 8601이다. | A-01, TC-06, R-03 |
| PR-05 | **'오늘'은 브라우저 로컬 날짜.** FE가 로컬 날짜로 `today`를 만들어 상태 판정이 필요한 조회(목록·캘린더)에 전달하고, BE는 이 값으로 판정·필터한다. 서버 시계로 '오늘'을 정하지 않는다(파라미터 이름·형식은 API 문서). | A-01, PRD 3.2, R-03, AC-03 |
| PR-06 | **서버가 최종 검증자.** 모든 입력은 서버에서 검증한다. FE 검증은 UX 보조이며 서버 검증을 대신하지 않는다. | NFR-13, SC-00-E4 |
| PR-07 | **보안 기본값은 "막힘".** 인증 미들웨어는 기본 적용하고 공개 경로(회원가입·로그인·토큰 갱신 refresh·로그아웃·헬스체크)만 예외로 연다. refresh·로그아웃은 access token 대신 body의 refresh token으로 인증한다. 소유권은 쿼리 조건으로 강제하고, 타인 리소스는 존재 여부를 숨긴 404로 응답한다. | BR-01, BR-02, NFR-10, NFR-12, R-04 |
| PR-08 | **하지 않는다.** 마이크로서비스, DI 컨테이너, 클린/헥사고날 아키텍처 풀세트, 모노레포 툴(nx·turbo·workspace 루트 `package.json`), ORM·쿼리 빌더(Prisma, Knex, Sequelize 등), GraphQL, SSR/Next.js, Redis 등 캐시 서버, 메시지 큐, i18n 라이브러리(다국어는 FE `i18n/` 사전·BE `i18n.js`로 직접 구현), 상태 저장 컬럼. | PR-01, TC-04, TC-05 |

## 2. 의존성 / 레이어 원칙

### 2.1 백엔드 레이어

| ID | 규칙 | 이유 (근거) |
|----|------|-------------|
| PR-09 | BE는 **3개 레이어** `routes → services → repositories`이며 의존은 **한 방향**이다(역방향·건너뛰기 금지: routes가 repository나 `pg`를 직접 부르지 않는다). 순수 로직은 `domain/`(상태 판정)·`validators/`(입력 검증)에 두고 어느 레이어에서나 쓸 수 있다. 별도 `controllers/` 레이어는 **두지 않는다**: 리소스당 핸들러가 몇 개뿐이라 라우터 파일이 컨트롤러 역할을 겸한다. | PR-01, 파일 수 최소화 |
| PR-10 | **소유권은 repository 함수 시그니처로 강제한다.** 할일·카테고리 repository 함수는 모두 `userId`를 첫 인자로 받고 SQL에 `WHERE user_id = $1`을 건다. `userId` 없이 id만으로 조회·수정·삭제하는 함수는 만들지 않는다. 결과 0건이면 service가 404(`NOT_FOUND`)를 던진다. 할일에 지정한 `categoryId`도 같은 사용자 소유인지 확인한다(타인 카테고리 연결 방지). | NFR-12, R-04, SC-00-E3 |
| PR-11 | **트랜잭션은 service에서 연다.** 여러 쿼리가 한 단위인 경우(회원가입 + '기본' 카테고리 생성 + refresh token 저장, 카테고리 삭제 + 할일 '기본' 이동, 비밀번호 변경 + 전체 refresh token 삭제 + 새 refresh token 저장)만 `db.js`의 `withTransaction(fn)`을 쓰고, repository 함수는 실행 대상(`db` = pool 또는 트랜잭션 client)을 인자로 받는다. | BR-05, BR-09, NFR-10, G-06 |
| PR-12 | Express **5**를 쓴다. async 핸들러의 reject가 에러 미들웨어로 바로 전달되므로 `asyncHandler` 래퍼를 만들지 않는다. | PR-01 |

레이어별 책임 / 금지

| 레이어 | 책임 | 금지 |
|--------|------|------|
| `routes/` | 경로·미들웨어 연결, `req`에서 입력 추출, `validators/` 호출, service 호출, 상태코드·JSON 응답 | SQL, `pg` 직접 사용, 비즈니스 규칙(BR) 판단 |
| `services/` | 비즈니스 규칙(BR-04~09, BR-13, BR-17), 트랜잭션 경계, `AppError` 던지기 | `req`/`res` 접근, SQL 문자열 |
| `repositories/` | 파라미터화 SQL 실행, snake_case → camelCase 변환(PR-19), 소유권 조건(PR-10) | 비즈니스 판단, HTTP 상태코드 결정 |
| `domain/`, `validators/` | 순수 함수(입출력만, I/O 없음) | DB·HTTP·전역 상태 접근 |

### 2.2 프론트엔드 레이어

| ID | 규칙 | 이유 (근거) |
|----|------|-------------|
| PR-13 | FE는 `pages → hooks → api` 한 방향이다. 페이지·컴포넌트는 `fetch`를 직접 부르지 않고 `hooks/`의 TanStack Query 훅만 쓴다. `api/`는 HTTP 호출과 타입만 가지며 React를 import하지 않는다. `components/`는 props만 받는 표시용(데이터 조회 금지). | TC-02, TC-03, NFR-08 |
| PR-14 | **Zustand와 TanStack Query 역할 분리.** 서버 데이터(할일·카테고리·내 정보)는 TanStack Query 캐시에만 둔다. Zustand에는 **인증 토큰**(access token은 메모리만, refresh token만 `persist`로 localStorage, PR-37), **UI 상태**(목록 필터·페이지, 캘린더 뷰·기준 날짜), **화면 설정**(언어 `localeStore`, 화면 모드·글자 크기 `themeStore`, 각각 `persist`로 localStorage)만 둔다. 서버 응답을 Zustand에 복사하지 않는다. 쓰기 후에는 관련 쿼리를 `invalidateQueries`로 갱신한다. **낙관적 업데이트는 쓰지 않는다**: 요청 중 해당 컨트롤을 비활성화하고, 성공하면 즉시 재조회하며(필터와 안 맞게 된 항목은 바로 사라짐), 실패하면 캐시가 바뀌지 않았으므로 원 상태 그대로 오류만 표시한다(AQ-03 결정). | TC-03, NFR-08 |
| PR-15 | 필터·캘린더 위치를 Zustand에 두는 이유: 다른 화면에서의 변경이 반영돼야 하고(카테고리 삭제 시 필터 해제 G-08), 편집 후 진입 화면 복귀 시 위치가 유지돼야 한다(G-12). 그 외 화면 한정 상태(모달 열림, 폼 입력값)는 컴포넌트 `useState`에 둔다. | G-08, G-12 |
| PR-16 | **401은 api client 한 곳에서 처리한다**: 보호 API가 401이면 ① `POST /api/auth/refresh`를 **1회** 시도한다. 동시에 여러 요청이 401이면 refresh 요청은 하나만 보내고 나머지는 그 결과를 기다린다(single-flight, 진행 중 Promise 공유). ② 성공하면 새 access token으로 원 요청을 **1회만** 재시도한다(재시도의 401은 다시 refresh하지 않고 ③으로). ③ refresh도 401이면 토큰 둘 다 폐기 → `queryClient.clear()` → 로그인 화면 이동. 로그아웃은 `POST /api/auth/logout` 호출(실패해도 진행) 후 ③과 같은 폐기 함수를 쓴다(이전 사용자 데이터 캐시가 남지 않게). 앱 진입 시 메모리에 access token이 없고 refresh token이 있으면 refresh를 먼저 호출해 성공 시 보호 화면, 실패 시 로그인 화면(SC-02-A1). **단, 인증 엔드포인트(login, signup, refresh, logout)의 401은 이 공통 처리에서 제외**하고 호출한 쪽이 처리한다(로그인·가입은 폼 오류로 표시, 입력 유지, SC-02-E1, AQ-01 결정). | SC-00-E2, SC-02-A1, NFR-10, A-14 |

### 2.3 외부 패키지

| ID | 규칙 | 이유 (근거) |
|----|------|-------------|
| PR-17 | **패키지 추가 기준**: 표준 라이브러리·플랫폼 기능·이미 있는 패키지로 몇 줄에 해결되면 추가하지 않는다. 아래 목록 밖의 런타임 패키지를 추가할 때는 이유를 커밋 메시지에 한 줄 남긴다. | PR-01 |
| PR-18 | **캘린더 라이브러리**는 R-01 완화를 위해 1개까지 허용한다(후보: FullCalendar daygrid). 라이브러리 의존은 `components/calendar/` 안의 어댑터 한 곳에 가둔다. FullCalendar의 종일 이벤트 `end`는 **배타적**이므로 종료일자 +1일 변환을 어댑터에서만 한다(AC-05, AC-06). 날짜 라이브러리(date-fns 등)는 캘린더 라이브러리가 요구하지 않으면 추가하지 않는다. | R-01, BR-16, PR-04 |

허용 패키지 (MVP 기준, 이 외는 PR-17 적용)

| 영역 | 런타임 | 개발 |
|------|--------|------|
| BE | `express`(5), `pg`, `bcrypt`, `jsonwebtoken`, `cors`, `swagger-ui-express`·`yaml`(개발 환경 API 문서 `/api-docs`) | `supertest`, `eslint`, `prettier` |
| FE | `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `zustand`, 캘린더 라이브러리 1개(PR-18) | `vite`, `typescript`, `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `jsdom`, `eslint`, `prettier` |

`dotenv`는 쓰지 않는다(Node `--env-file`, PR-33). 검증 라이브러리(zod 등)는 쓰지 않고 `validators/`에 직접 작성한다. `bcrypt`는 순수 JS `bcryptjs`보다 빠르므로 NFR-03 때문에 네이티브를 쓴다.

## 3. 코드 / 네이밍 원칙

### 3.1 네이밍

| 대상 | 규칙 | 예 |
|------|------|-----|
| BE 파일 | camelCase `.js`, 레이어 접미사 | `routes/todos.js`, `services/todoService.js`, `repositories/todoRepository.js` |
| FE 컴포넌트·페이지 | PascalCase `.tsx`, 페이지는 `Page` 접미사 | `TodoListPage.tsx`, `StatusBadge.tsx` |
| FE 훅 | `use` + camelCase `.ts` | `useTodos.ts`, `useCategories.ts` |
| FE 스토어 | camelCase + `Store` | `authStore.ts`, `uiStore.ts` |
| 폴더 | 소문자 복수형 | `routes/`, `pages/`, `hooks/` |
| 변수·함수 | camelCase, 함수는 동사로 시작, 불리언은 `is/has` | `findTodosByUser`, `isCompleted` |
| 상수 | UPPER_SNAKE_CASE | `PAGE_SIZE_MAX` |
| 타입 | PascalCase, `I` 접두사 없음 | `Todo`, `TodoStatus` |
| DB 테이블 | snake_case **복수형** | `users`, `categories`, `todos`, `schema_migrations` |
| DB 컬럼 | snake_case | `user_id`, `start_date`, `is_completed`, `completed_at` |
| API 경로 | `/api` 접두사, REST, 복수 명사, 여러 단어는 kebab-case, 동사 금지(인증 행위만 예외) | `/api/todos/:id`, `/api/categories`, `/api/users/me`, `/api/auth/login` |
| JSON 필드 | camelCase | `startDate`, `categoryId` |
| 상태 값 | 영문 코드 고정, 화면 문구는 FE에서 매핑 | `NOT_STARTED`(ST-02), `IN_PROGRESS`(ST-03), `COMPLETED`(ST-01), `OVERDUE`(ST-04) |

### 3.2 규칙

| ID | 규칙 | 이유 (근거) |
|----|------|-------------|
| PR-19 | **JS↔DB 케이스 변환은 repository 한 곳**, SQL 별칭으로 한다(`SELECT start_date AS "startDate"`). 변환 헬퍼·자동 변환 라이브러리를 두지 않는다. repository 밖으로 snake_case가 나가지 않는다. | PR-01, TC-05 |
| PR-20 | **에러 응답 형식 통일**: `{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "endDate": "…" } } }`. `fields`는 필드 오류일 때만. 코드↔상태: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `NOT_FOUND` 404, `CONFLICT` 409(이메일 중복 BR-03, 카테고리 이름 중복 BR-07. **`fields`에 충돌한 필드를 담는다**, 예: `{ "email": "이미 사용 중인 이메일입니다" }`, AQ-02 결정), `FORBIDDEN_OPERATION` 400('기본' 카테고리 변경 BR-06), `INTERNAL` 500. 성공 응답은 래핑 없이 데이터 그대로, 목록은 `{ items, page, limit, total }`. | NFR-13, CMP-03(필드 아래 오류 / 토스트 구분), SC-01-E1 |
| PR-21 | 메시지는 사용자에게 보여 줄 문구로 서버가 만든다(CMP-03 "메시지 그대로 표시"). 코드에는 한국어 원문을 쓰고, 에러 미들웨어가 요청의 `Accept-Language`(ko·ja·en, 기본 ko)에 맞춰 `src/i18n.js`로 번역해 응답한다(BE-13). FE api client는 현재 언어를 `Accept-Language`로 보낸다. 500은 내부 정보 없이 일반 문구만. | CMP-03, NFR-14 |
| PR-22 | **상수·매직넘버**: 페이지 크기(50/100), bcrypt cost(10), 토큰 만료(access 15m, refresh 14일), 풀 크기(20) 같은 **가정 수치**는 `config.js`(환경별로 바뀔 값) 또는 각 모듈 상단 상수로 한 번만 정의한다. 코드 중간에 숫자를 직접 쓰지 않는다. | NFR-05, NFR-06, NFR-09, NFR-10 (모두 "가정" 표기, 부하 테스트로 조정) |
| PR-23 | **주석**: 코드로 드러나지 않는 "왜"만 한 줄로 쓰고, 규칙 구현에는 근거 ID를 단다(`// BR-11: 같은 날 허용`). 일부러 단순화한 곳은 `// shortcut: <한계>, <바꿀 시점>` 형식. 주석 처리된 죽은 코드는 남기지 않는다. | PR-02 |
| PR-24 | **FE 타입·스타일**: `tsconfig` `strict: true`, `any` 금지. API 응답 타입은 `api/types.ts`에 손으로 쓴다(코드 생성 도구 없음). 스타일은 CSS Modules(Vite 기본 지원)와 `styles/tokens.css` 변수만 쓰며 CSS 프레임워크는 도입하지 않는다. `dangerouslySetInnerHTML`은 쓰지 않는다. | TC-02, R-05, 스킬 '스타일 가이드' |
| PR-25 | **BE 모듈**: ESM(`"type": "module"`), Node 22 LTS. JS이므로 타입 대신 `validators/`가 입력 형태를 보장한다. JSDoc은 공개 함수 시그니처가 모호할 때만. | TC-04 |

## 4. 테스트 / 품질 원칙

| ID | 규칙 | 이유 (근거) |
|----|------|-------------|
| PR-26 | **도구는 영역당 하나.** BE: `node:test`(내장) + `supertest`. FE: `vitest`. 커버리지는 BE `node --test --experimental-test-coverage`, FE `vitest --coverage`. E2E 도구는 MVP에서 쓰지 않는다. | PR-01, PR-17 |
| PR-27 | **BE API 테스트는 실제 PostgreSQL 테스트 DB**(`TEST_DATABASE_URL`)로 돌리고 repository를 모킹하지 않는다. SQL 자체가 로직(소유권, 필터, 기간 겹침)이기 때문이다. 각 테스트 파일은 시작 시 테이블을 비운다. | NFR-11, NFR-12, BR-15, BR-16 |
| PR-28 | **FE 테스트는 순수 로직 위주**: `lib/date.ts`(오늘 문자열, 월/주 범위 계산, 일요일 시작 A-12), 캘린더 어댑터의 종료일 변환(PR-18). 화면 렌더 테스트는 필수가 아니다. | AC-05, AC-06, PR-04 |
| PR-29 | **필수 최소 테스트 범위** (일정이 밀려도 빼지 않는다): 아래 표. | K-02, NFR-12, NFR-13 |
| PR-30 | 스킬의 커버리지 90%는 0장 해결안대로 TASK가 바꾼 로직 폴더에만 적용한다. 커버리지 수치를 맞추려고 의미 없는 테스트를 쓰지 않는다. | 스킬 충돌 해결 |
| PR-31 | **린트/포맷**: ESLint(flat config) + Prettier, `frontend/`와 `backend/`가 각자 설정을 가진다(루트 공용 설정 없음, PR-08). 경고는 커밋 전 0개. | 품질 일관성 |
| PR-32 | **부하 테스트**는 이번 범위에서 하지 않는다(v0.6). NFR-05~07(풀·페이지네이션·인덱스)은 코드 리뷰로 선적용한다. | NFR-01~07, R-02 |

필수 최소 테스트 (PR-29)

| 대상 | 종류 | 근거 |
|------|------|------|
| `deriveStatus(todo, today)` 4상태 + 경계(시작일·종료일 당일, 하루짜리, 완료 우선) | BE 단위 | ST-01~04, 5장 경계 예시 |
| 카테고리 미지정 등록 → '기본' | BE API | AC-01, BR-08 |
| 종료일자 < 시작일자 거부(400) | BE API | AC-02, BR-11 |
| 상태 필터 경계, 카테고리 AND 상태 OR | BE API | AC-03, AC-04, BR-15 |
| 캘린더 기간 겹침 조회 | BE API + FE 어댑터 | AC-05, AC-06, BR-16 |
| 타 사용자 할일·카테고리 조회·수정·삭제 → 404, 타인 카테고리로 할일 등록 거부 | BE API | NFR-12, PR-10 |
| 토큰 없음/잘못된 토큰/HS384 외 알고리즘으로 서명한 토큰 → 401 | BE API | NFR-10, BR-01 |
| refresh: 정상 → 새 access token, 없는·만료·로그아웃·비밀번호 변경으로 폐기된 refresh token → 401 | BE API | NFR-10, A-14, G-06 |
| api client 401 → single-flight refresh → 원 요청 1회 재시도, refresh 401 → 폐기·로그인 이동 | FE 단위 | PR-16, SC-00-E2 |
| 필수값 누락·잘못된 날짜 형식·공백 카테고리명·중복 이메일/카테고리명 | BE API | NFR-13, BR-03, BR-07, BR-10 |
| '기본' 카테고리 변경·삭제 거부, 삭제 시 할일 '기본' 이동 (M-05 구현 시) | BE API | BR-06, BR-09 |

커밋 전 체크리스트

- [ ] `npm run lint`, `npm test` 통과 (바꾼 쪽 `frontend/` 또는 `backend/`)
- [ ] 새 SQL은 파라미터화(`$1`)이며 할일·카테고리 쿼리에 `user_id` 조건이 있다 (NFR-11, NFR-12)
- [ ] 비밀(`.env`, 토큰, 비밀번호)이 커밋·로그에 없다 (NFR-14)
- [ ] 날짜를 `Date`로 변환해 비교·직렬화하지 않았다 (PR-04)
- [ ] 커밋 메시지에 관련 ID(UC/BR/AC/TASK)가 있다 (PR-02)

## 5. 설정 / 보안 / 운영 원칙

| ID | 규칙 | 이유 (근거) |
|----|------|-------------|
| PR-33 | **환경변수**: 설정은 환경변수로만 주입한다. `.env`는 커밋하지 않고(`.gitignore`에 이미 있음), 키 목록과 더미 값을 담은 `.env.example`을 `backend/`·`frontend/`에 각각 커밋한다. BE는 `node --env-file=.env`로 읽는다. FE는 Vite 규칙상 `VITE_` 접두사 값만 번들에 들어가므로 **비밀을 넣지 않는다**(`VITE_API_BASE_URL`만). | NFR-14 |
| PR-34 | **설정 로딩은 `backend/src/config.js` 한 곳.** 다른 파일은 `process.env`를 직접 읽지 않는다. 필수 값(`DATABASE_URL`, `JWT_ACCESS_SECRET`, `CORS_ORIGIN`)이 없으면 기동 시 즉시 종료한다. `JWT_ACCESS_SECRET`이 48바이트 미만이어도 종료한다(HS384, PR-37). | NFR-14, PR-22 |
| PR-35 | **CORS**: `cors` 미들웨어로 환경변수 `CORS_ORIGIN`에 지정한 출처만 허용한다. 코드에 기본값을 두지 않고, 쉼표로 여러 출처를 지정할 수 있으며, `*`가 들어 있으면 기동 시 종료한다. 개발·운영 모두 FE가 `VITE_API_BASE_URL`로 BE를 직접 호출한다(프록시 없음). 개발 값 `http://localhost:3000`은 `frontend/.env.development`에 둔다. | NFR-14 |
| PR-36 | **비밀번호**: `bcrypt` cost `BCRYPT_COST`(기본 10)로 해시만 저장한다. 비교는 `bcrypt.compare`. 응답·로그에 해시도 내보내지 않는다(repository가 `password_hash`를 select하는 함수는 로그인용·비밀번호 변경용 각 1개뿐). | NFR-09, BR-04 |
| PR-37 | **JWT + refresh token**: ① Access token은 `jsonwebtoken` **HS384**, 비밀키 `JWT_ACCESS_SECRET`(48바이트 이상 무작위), claims는 `sub`(userId)·`iat`·`exp`만, 만료 `ACCESS_TOKEN_TTL`(기본 15m), `Authorization: Bearer`로 전달. `middleware/auth.js`는 `jwt.verify(token, secret, { algorithms: ['HS384'] })`로 **알고리즘을 명시**해 검증하고(알고리즘 혼동 공격 방지) `req.userId`만 설정한다. FE는 access token을 메모리(Zustand, persist 안 함)에만 둔다. ② Refresh token은 JWT가 아닌 불투명 무작위 문자열(`crypto.randomBytes(32)` base64url)이다. 서버가 DB로 폐기 여부를 확인해야 하므로 JWT로 만들 이점이 없다. DB `refresh_tokens`에는 **SHA-256 해시만** 저장하고, 만료 `REFRESH_TOKEN_TTL_DAYS`(기본 14일), **회전 없음**(만료까지 같은 토큰 재사용). FE는 localStorage에 저장한다(R-05 감수). ③ API: 가입·로그인 응답 `{ accessToken, refreshToken, user }`(로그인 시 그 사용자의 만료된 refresh token 행 삭제), `POST /api/auth/refresh` body `{ refreshToken }` → 200 `{ accessToken }`(해시 조회 실패·만료 → 401 `UNAUTHORIZED`), `POST /api/auth/logout` body `{ refreshToken }` → 204(해당 행 삭제, 없어도 204, 멱등). refresh·logout은 공개 경로(PR-07). ④ 비밀번호 변경 성공 시 그 사용자의 모든 refresh token을 삭제하고 현재 세션용 새 refresh token을 발급해 응답한다(`{ refreshToken }`). 다른 기기는 access token 만료(최대 15분) 후 로그아웃된다(G-06). | NFR-10, R-05, A-14, G-06 |
| PR-38 | **SQL**: 모든 쿼리는 `$n` 파라미터화. 동적 조건(필터·정렬)은 **화이트리스트 조각**을 조립하고 값은 항상 파라미터로 넘긴다. 사용자 입력을 SQL 문자열에 넣지 않는다. | NFR-11, BR-15 |
| PR-39 | **입력 검증**: `validators/`가 타입·필수·`YYYY-MM-DD` 형식과 실제 날짜 여부·길이·페이지 범위를 검사하고 실패 시 `VALIDATION_ERROR` + `fields`를 던진다. 문자열 앞뒤 공백 정리(BR-07)도 여기서 한다. 길이 제한 값은 G-05 확정 전까지 상수 하나로 둔다. | NFR-13, BR-07, BR-10, BR-11, G-05 |
| PR-40 | **로깅**: 요청 로그는 메서드·경로·상태·소요시간만 남긴다. 요청 본문, `Authorization` 헤더, 비밀번호, 토큰(access token, refresh token과 그 해시)은 절대 로그에 남기지 않는다. 500 에러는 스택을 서버 로그에만 남긴다. 로깅 라이브러리 없이 `console`을 쓴다. FE는 `lib/logger.ts`로 **개발 모드에서만** 콘솔에 남기고(API 호출·인증·화면 이동·설정 변경, 운영·테스트에서는 무동작) 같은 금지 항목을 지킨다. | NFR-09, NFR-14 |
| PR-41 | **DB 풀**: `pg.Pool`은 `db.js`에서 **한 번만** 생성해 공유한다(`max` = `DB_POOL_MAX`, 기본 20). 요청마다 `Client`를 만들지 않는다. | NFR-05, R-02 |
| PR-42 | **DATE 타입 파서**: `db.js`에서 `pg.types.setTypeParser(1082, v => v)`로 `date` 컬럼을 문자열 그대로 받는다. 기본값(JS `Date` 변환)은 서버 타임존에 따라 하루가 밀린다. | PR-04, A-01, R-03 |
| PR-43 | **페이지네이션 상한**: 목록 `limit` 기본 50, 최대 100으로 서버에서 자른다. 캘린더 조회는 반드시 기간(`from`, `to`)을 받고 기간 겹침(`start_date <= to AND end_date >= from`)으로 제한한다. 기간 없는 전체 조회 API는 두지 않는다. | NFR-06, BR-16 |
| PR-44 | **마이그레이션**: `backend/db/migrations/NNN_설명.sql` 순번 SQL 파일만 쓴다. `scripts/migrate.js`(작은 스크립트)가 `schema_migrations` 테이블에 기록하며 아직 적용 안 된 파일을 번호순으로 트랜잭션 안에서 실행한다. 적용된 파일은 수정하지 않고 새 번호 파일을 추가한다. down 마이그레이션은 두지 않는다. | TC-05, PR-08 |
| PR-45 | **헬스체크**: 인증 없는 `GET /health`가 `db.js`의 `checkConnection()`(`SELECT 1`)으로 확인한다(PR-09의 예외, AQ-07 결정). 성공 시 200 `{ status: "ok", db: "connected" }`, 실패 시 503 `{ status: "unavailable", db: "disconnected" }`. 기동·DB 연결 확인용. | M-04 |
| PR-46 | **에러 처리 미들웨어 한 곳**(`middleware/error.js`, 라우터 맨 뒤): `AppError`는 그 상태·코드로, PostgreSQL unique 위반(`23505`)은 409 `CONFLICT`로 바꾸되 **에러의 제약 이름(`err.constraint`)을 필드로 매핑해 `fields`와 한국어 문구를 채운다**(사용자 이메일 unique → `email`, 카테고리 (사용자, 이름) unique → `name`. 매핑에 없는 제약은 `fields` 없이 409. 매핑 표는 이 미들웨어 한 곳에 둔다, AQ-02 결정), `fk_todos_category_owner` FK 위반(`23503`, 확인과 쓰기 사이 경합)은 409 `CONFLICT`(`fields` 없음, 재시도 안내, EQ-01 결정), 그 외는 500 `INTERNAL`로 PR-20 형식에 맞춰 응답한다. 라우트·서비스는 에러를 삼키지 않고 던진다. 미등록 경로는 404 `NOT_FOUND`. | PR-20, BR-03, BR-07 |

`backend/.env.example` 키 (값은 예시)

```
PORT=3000
DATABASE_URL=postgres://todo:todo@localhost:5432/todo
TEST_DATABASE_URL=postgres://todo:todo@localhost:5432/todo_test
DB_POOL_MAX=20
JWT_ACCESS_SECRET=change-me-to-48-plus-random-bytes
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=14
BCRYPT_COST=10
# 허용할 FE 출처. 쉼표로 여러 개 지정, '*' 금지 (PR-35)
CORS_ORIGIN=http://localhost:5173
```

## 6. 프론트엔드 / 백엔드 디렉토리 구조

### 6.1 저장소 루트

| ID | 규칙 | 이유 (근거) |
|----|------|-------------|
| PR-47 | 루트에는 `frontend/`, `backend/`를 나란히 두고 각자 `package.json`·`node_modules`·린트 설정을 가진 **독립 npm 프로젝트**로 운영한다. 루트 `package.json`·workspace는 두지 않는다. 공유 코드 패키지도 두지 않는다(상태 판정은 BE 한 곳, PR-03). | PR-08, 스킬의 `backend/`·`frontend/` 경로 |

```text
todolist-app/
├── .claude/            # Claude Code 설정·개발 스킬 (기존)
├── docs/               # 도메인·PRD·시나리오·와이어프레임·이 문서 (기존)
├── prompts/            # 문서 작성용 프롬프트 (기존)
├── frontend/           # React 19 + TS SPA (Vite)
├── backend/            # Node.js + Express API + DB 마이그레이션
├── .gitignore          # (기존) .env 제외, .env.example 허용
└── .mcp.json           # (기존)
```

### 6.2 백엔드

```text
backend/
├── package.json            # "type": "module", scripts: dev, start, test, test:coverage, lint, migrate, migrate:test
├── .env.example            # 환경변수 키 목록 (PR-33)
├── dev.env                 # npm run dev 전용 NODE_ENV=development (Swagger UI 활성)
├── swagger.yaml            # OpenAPI 3.0.3 명세
├── src/
│   ├── server.js           # 진입점: config 로드, app.listen
│   ├── app.js              # express 앱 조립: cors, json, 요청 로그, 라우터, 404, 에러 미들웨어 (테스트가 import)
│   ├── config.js           # 환경변수 로딩·검증 한 곳 (PR-34)
│   ├── db.js               # pg.Pool 단일 인스턴스, DATE 파서, withTransaction (PR-11, PR-41, PR-42)
│   ├── errors.js           # AppError, 에러 코드 상수 (PR-20)
│   ├── i18n.js             # 에러 문구 번역 ko·ja·en, Accept-Language 선택 (PR-21, BE-13)
│   ├── apiDocs.js          # 개발 환경 전용 Swagger UI /api-docs
│   ├── middleware/
│   │   ├── auth.js         # Bearer 검증 → req.userId (PR-37)
│   │   ├── requestLog.js   # 메서드·경로·상태·시간만 (PR-40)
│   │   └── error.js        # 에러 → 통일 응답 (PR-46)
│   ├── routes/             # HTTP 레이어 (컨트롤러 겸함, PR-09)
│   │   ├── health.js       # GET /health
│   │   ├── auth.js         # /api/auth/signup, login, refresh, logout (UC-01, UC-02, PR-37)
│   │   ├── users.js        # /api/users/me, /api/users/me/password    (UC-03)
│   │   ├── categories.js   # /api/categories[/:id]                    (UC-04)
│   │   └── todos.js        # /api/todos[/:id], 캘린더 기간 조회       (UC-05~10)
│   ├── services/
│   │   ├── authService.js      # 가입(+기본 카테고리 트랜잭션 BR-05), 로그인, 토큰 쌍 발급, refresh, 로그아웃 (PR-37)
│   │   ├── userService.js      # 이름·비밀번호 변경 (BR-04), 변경 시 refresh token 전체 폐기 (G-06)
│   │   ├── categoryService.js  # BR-06, BR-07, BR-09
│   │   └── todoService.js      # BR-08, BR-10~13, BR-17, 상태 부착
│   ├── repositories/
│   │   ├── userRepository.js
│   │   ├── refreshTokenRepository.js # refresh_tokens 해시 저장·조회·삭제 (PR-37)
│   │   ├── categoryRepository.js
│   │   └── todoRepository.js   # 필터·페이지네이션·기간 겹침 SQL (PR-38, PR-43)
│   ├── validators/
│   │   ├── common.js       # 날짜 문자열, 길이, 페이지 파라미터
│   │   ├── auth.js
│   │   ├── category.js
│   │   ├── todo.js
│   │   └── user.js
│   └── domain/
│       └── todoStatus.js   # deriveStatus(todo, today), 상태별 SQL 조건 조각 (ST-01~04, PR-03)
├── db/
│   ├── migrations/         # 테이블별 파일, 내용은 `docs/7-erd.md` 6장·`docs/schema.sql`
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_categories.sql
│   │   ├── 003_create_todos.sql          # 목록·캘린더 인덱스 포함
│   │   └── 004_create_refresh_tokens.sql # 인증 인프라 테이블 (PR-37)
│   ├── verify.sql          # 제약 위반 검증 스크립트, BEGIN … ROLLBACK
│   └── seed.sql            # 개발용 샘플 데이터 (운영 DB에 실행 금지)
├── scripts/
│   └── migrate.js          # 순번 SQL 적용기 (PR-44)
└── test/
    ├── helpers.js          # 테스트 DB 초기화, 사용자·토큰 생성
    ├── health.test.js      # GET /health 200/503 (PR-45)
    ├── todoStatus.test.js  # ST-01~04 단위
    ├── auth.test.js        # 가입·로그인·refresh·로그아웃·401
    ├── categories.test.js
    ├── todos.test.js       # AC-01~04, 입력 검증
    ├── calendar.test.js    # AC-05, AC-06
    ├── ownership.test.js   # 타 사용자 404 (NFR-12)
    ├── i18n.test.js        # 에러 문구 번역 누락 검사 (BE-13)
    ├── test.env            # 테스트 실행용 환경변수 (npm test가 --env-file로 읽음)
    └── …                   # 그 외 users, completion, todoList, scenarios, cors, config, db, migrate 등 *.test.js
```

리소스 → 파일 매핑

| 리소스 | 경로 예 | routes | services | repositories |
|--------|---------|--------|----------|--------------|
| auth | `/api/auth/signup`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` | `auth.js` | `authService.js` | `userRepository.js`, `categoryRepository.js`, `refreshTokenRepository.js` |
| users/me | `/api/users/me`, `/api/users/me/password` | `users.js` | `userService.js` | `userRepository.js`, `refreshTokenRepository.js`(비밀번호 변경 시 폐기) |
| categories | `/api/categories`, `/api/categories/:id` | `categories.js` | `categoryService.js` | `categoryRepository.js`, `todoRepository.js`(BR-09 이동) |
| todos | `/api/todos`, `/api/todos/:id` (목록·캘린더 조회 방식은 API 문서) | `todos.js` | `todoService.js` | `todoRepository.js`, `categoryRepository.js`(소유 확인·기본 조회) |

### 6.3 프론트엔드

```text
frontend/
├── package.json            # scripts: dev, build, preview, test, test:coverage, lint
├── .env.example            # VITE_API_BASE_URL (PR-33)
├── .env.development        # 개발용 VITE_API_BASE_URL=http://localhost:3000 (커밋, 비밀 아님, PR-35)
├── vite.config.ts          # react 플러그인, vitest 설정 (프록시 없음, PR-35)
├── index.html
└── src/
    ├── main.tsx            # QueryClientProvider, Router 마운트
    ├── App.tsx             # 라우트 정의, 인증 가드(SC-00-E1)
    ├── queryClient.ts      # QueryClient 1개(로그아웃 시 clear, PR-16)
    ├── test-setup.ts       # vitest 공통 설정
    ├── api/
    │   ├── client.ts       # fetch 래퍼: Bearer 부착, 에러 형식 파싱, 401 → single-flight refresh → 재시도 (PR-16)
    │   ├── types.ts        # Todo, Category, User, ApiError 타입 (PR-24)
    │   ├── auth.ts
    │   ├── users.ts
    │   ├── categories.ts
    │   └── todos.ts
    ├── i18n/               # 다국어 사전(FE-14): ko.ts(원본, Messages 타입), ja.ts, en.ts, index.ts(useT, getMessages)
    ├── hooks/              # TanStack Query 훅, 쿼리 키는 각 파일에 상수로
    │   ├── useAuth.ts      # 로그인·가입·로그아웃(서버 폐기)
    │   ├── useMe.ts
    │   ├── useCategories.ts
    │   ├── useTodos.ts     # 목록·상세·등록·수정·완료·삭제
    │   ├── useCalendarTodos.ts
    │   └── useMediaQuery.ts    # 모바일 폭 감지(캘린더 +N, NFR-16)
    ├── stores/
    │   ├── authStore.ts    # access token(메모리), refresh token(persist localStorage) (PR-37, U-02)
    │   ├── uiStore.ts      # 목록 필터·페이지, 캘린더 뷰·기준 날짜 (PR-15)
    │   ├── toastStore.ts   # 토스트 표시 상태 (CMP-03)
    │   ├── localeStore.ts  # 언어 ko·ja·en (persist localStorage, Accept-Language 값)
    │   └── themeStore.ts   # 화면 모드·글자 크기 (persist localStorage, <html data-theme·data-font-size>)
    ├── pages/              # WF 화면 1:1
    │   ├── LoginPage.tsx
    │   ├── SignupPage.tsx
    │   ├── TodoListPage.tsx
    │   ├── TodoEditPage.tsx
    │   ├── CalendarPage.tsx
    │   ├── MyInfoPage.tsx
    │   ├── CategoryPage.tsx
    │   └── NotFoundPage.tsx
    ├── components/
    │   ├── Layout.tsx          # 공통 레이아웃·내비 (WF-01)
    │   ├── ConfirmModal.tsx    # 삭제·이탈 확인 공용 (CMP-01, CMP-02)
    │   ├── Toast.tsx           # (CMP-03)
    │   ├── StatusBadge.tsx     # (CMP-05)
    │   ├── LanguageSelect.tsx  # 언어 선택 (내비·로그인·가입 화면)
    │   ├── ThemeSelect.tsx     # 화면 모드 선택 (내비·로그인·가입 화면)
    │   ├── FontSizeSelect.tsx  # 글자 크기 선택 (내비·로그인·가입 화면)
    │   ├── todo/               # 목록 행, 필터 바, 페이지네이션, 편집 폼 (WF-04, WF-05)
    │   └── calendar/           # 캘린더 라이브러리 어댑터 + 일간 목록 (WF-06, PR-18)
    ├── lib/
    │   ├── date.ts         # todayString(로컬), 월/주(일요일 시작) 범위 (PR-04, A-12)
    │   ├── logger.ts       # 개발 모드 전용 콘솔 로그 (PR-40)
    │   └── date.test.ts    # 테스트는 대상 옆에 *.test.ts (PR-28)
    └── styles/
        ├── tokens.css      # docs/style-guide.md 토큰의 구현 (PR-24, SG-01)
        └── global.css
```

WF → 라우트·폴더 매핑

| WF / CMP | 라우트 | 위치 |
|----------|--------|------|
| WF-01 공통 레이아웃 | 인증 영역 전체의 부모 | `components/Layout.tsx` |
| WF-02 로그인 | `/login` | `pages/LoginPage.tsx` |
| WF-03 회원가입 | `/signup` | `pages/SignupPage.tsx` |
| WF-04 할일 목록 | `/todos` (`/`는 여기로) | `pages/TodoListPage.tsx`, `components/todo/` |
| WF-05 할일 편집 | `/todos/new`, `/todos/:id/edit` | `pages/TodoEditPage.tsx`, `components/todo/` |
| WF-06 캘린더 | `/calendar` | `pages/CalendarPage.tsx`, `components/calendar/` |
| WF-07 내 정보 | `/me` | `pages/MyInfoPage.tsx` |
| WF-08 카테고리 관리 | `/categories` | `pages/CategoryPage.tsx` |
| CMP-01, CMP-02 | - | `components/ConfirmModal.tsx` |
| CMP-03 | - | `components/Toast.tsx` |
| CMP-04 | `*` 및 404 응답 시 | `pages/NotFoundPage.tsx` |
| CMP-05 | - | `components/StatusBadge.tsx` |

### 6.4 테스트·DB 파일 위치 요약

| 종류 | 위치 |
|------|------|
| BE 단위·API 테스트 | `backend/test/*.test.js` (API 테스트가 여러 모듈을 가로지르므로 한 폴더) |
| FE 테스트 | 대상 파일 옆 `*.test.ts(x)` |
| DB 마이그레이션 | `backend/db/migrations/NNN_*.sql` |
| 개발용 시드 | `backend/db/seed.sql` |

## 7. 미결 / 확인 필요

구조에 영향을 주는 미정 사항만 적는다. 확정 시 해당 PR 항목을 고친다.

| ID | 미결 사항 | 영향 | 이 문서의 잠정 처리 |
|----|-----------|------|---------------------|
| U-01 | 배포 환경(단일 서버에서 FE 정적 파일 + API 같은 출처 / FE·BE 분리 호스팅), HTTPS 종단 위치 | PR-35 CORS, `VITE_API_BASE_URL`, 정적 파일 서빙 여부 | **범위 밖**(2026-11-05): 배포는 사용자가 직접 한다. 코드는 FE·BE 분리 가정(CORS 화이트리스트, `VITE_API_BASE_URL`)을 유지 |
| U-02 | 토큰 저장 위치(localStorage / sessionStorage / 메모리) | `authStore` 영속화, R-05 XSS 노출 범위, SC-02-A1 재방문 시 로그인 생략 | **결정(2026-11-04)**: access token은 메모리(persist 안 함), refresh token은 localStorage(Zustand `persist`는 refresh token만). R-05 XSS 노출은 감수, 완화책(PR-24, PR-37) 유지 |
| U-03 | 캘린더 라이브러리 선택(FullCalendar daygrid 등 / 직접 구현) | `components/calendar/` 내부, 번들 크기, 모바일 `+N`(NFR-16, G-14) 지원 여부 | **결정**(2026-11-05, FE-10): FullCalendar(`core`·`react`·`daygrid`) 6.1.22 고정, 어댑터로 격리(PR-18) |
| U-04 | 목록·캘린더 API에 `today` 전달 방식과 상태 필터 파라미터 형식 | `validators/todo.js`, `domain/todoStatus.js` | **결정**(2026-11-05, BE-08·BE-10): 쿼리 `today=YYYY-MM-DD`, `status=A,B`(쉼표), `categoryId`, `page`, `limit`. 상세는 `9-api-spec.md` 4장 |
| U-05 | 입력 길이·비밀번호 규칙·이메일 대소문자(G-05) | `validators/` 상수, DB 컬럼 길이 | **결정**(2026-11-05, BE-04): `validators/common.js` `LIMITS` 한 곳(이메일 ≤254·대소문자 구분, 비밀번호 8~72자, 이름 1~50, 카테고리 1~30, 제목 1~100, 설명 ≤1,000). DB 컬럼은 `text` |
| U-06 | 날짜 피커: 네이티브 `<input type="date">` / 캘린더 라이브러리 / 별도 패키지 (와이어프레임 6.2) | FE 패키지 수 | **결정**(2026-11-05, FE-09): 네이티브 `<input type="date">`(값이 `YYYY-MM-DD` 문자열이라 PR-04와 맞음) |
| U-07 | 스타일 가이드 문서 부재 (develop-frontend 스킬 요구) | 모든 UI 컴포넌트 | **결정**(2026-11-05): `docs/style-guide.md` 작성. `tokens.css`는 그 구현 |
| U-08 | 실행 계획 문서 파일명(`docs/5-plan.md`, 스킬 참조)과 이 문서의 번호 중복 | 문서 번호 체계 | **결정(2026-11-04)**: 실행 계획은 `docs/8-plan.md`로 두고 두 개발 스킬의 경로를 그에 맞게 수정 완료 |
| U-09 | Node.js·PostgreSQL 실행 방식(로컬 설치 / Docker Compose) | 루트에 `docker-compose.yml` 추가 여부 | **결정**(2026-11-05, DB-01): 로컬 설치(Node.js, PostgreSQL 17). `docker-compose.yml` 없음 |
| U-10 | 로그인 시도 제한(무차별 대입 방어) 필요 여부 | 미들웨어 추가, 패키지 추가 | MVP 제외, 문서 범위 밖 (NFR에 없음) |
