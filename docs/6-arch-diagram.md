# TodoList 기술 아키텍처 다이어그램

## 버전 이력

| 버전 | 일자 | 작성자 | 상태 | 비고 |
|------|------|--------|------|------|
| v0.1 | 2026-11-04 | chaenamo | 초안 | 최초 작성 |
| v0.2 | 2026-11-04 | chaenamo | 초안 | AQ-01~03 결정 반영 |
| v0.3 | 2026-11-04 | chaenamo | 초안 | AD-04 ERD를 `7-erd.md`로 분리 |
| v0.4 | 2026-11-04 | chaenamo | 초안 | 인증: JWT HS384 + refresh token(localStorage, 14일, 회전 없음) 반영 |
| v0.5 | 2026-11-04 | chaenamo | 초안 | 문서 간 정합성 검토 반영 |
| v0.6 | 2026-11-05 | chaenamo | 초안 | 부하 테스트·배포 범위 제외 반영 |
| v0.7 | 2026-11-05 | chaenamo | 초안 | 개발 환경도 CORS 방식으로 변경 |
| v0.8 | 2026-11-05 | chaenamo | 초안 | 백엔드 구현 완료에 맞춰 잠정 표기 정리 |
| v0.9 | 2026-11-05 | chaenamo | 초안 | AQ-04 결정(FE-05) |
| v1.0 | 2026-11-05 | chaenamo | 초안 | U-03 결정(FullCalendar 6.1.22) |
| v1.1 | 2026-11-06 | chaenamo | 초안 | 구현 코드와 대조해 사실 불일치 수정(다국어·화면 설정 상태, 에러 미들웨어, 함수명) |

## 변경 이력

| 버전 | 일자 | 변경 섹션 | 변경 내용 | 변경자 |
|------|------|-----------|-----------|--------|
| v0.1 | 2026-11-04 | 전체 | 도메인 정의서 v0.3, PRD v0.3, 사용자 시나리오 v0.2, 와이어프레임 v0.2, 프로젝트 구조 설계 원칙 v0.1 기반 아키텍처·시퀀스 다이어그램 최초 작성 | chaenamo |
| v0.2 | 2026-11-04 | 기준 문서, AD-06, AD-07, AD-10, 4 | AQ-01(로그인 401 공통 처리 제외), AQ-02(409에 필드 포함), AQ-03(완료 토글 후 즉시 재조회) 결정을 다이어그램과 확인 필요 표에 반영 | chaenamo |
| v0.3 | 2026-11-04 | 0, AD-04, AD-08, 3, 4 | AD-04의 erDiagram과 제약·인덱스 표를 삭제하고 `docs/7-erd.md`로 분리(본문은 요약·링크). AQ-08(`id` 보조 정렬)·AQ-12(bigint, 복합 FK) 결정을 7-erd.md 참조로 표기, AD-08 정렬에 `id` 추가, AQ-05·AQ-06에 데이터 모델 참조 추가 | chaenamo |
| v0.4 | 2026-11-04 | 기준 문서, 0, AD-01~04, AD-06, AD-07, AD-13(신규), 3, 4 | 인증: JWT HS384 + refresh token(localStorage, 14일, 회전 없음) 반영. AD-03 HS256 → HS384(`algorithms` 명시), AD-02 authStore access 메모리·refresh localStorage·single-flight refresh, AD-06 가입 트랜잭션에 refresh_tokens INSERT 포함, AD-07 시퀀스 재작성(토큰 쌍 발급·refresh 재시도·로그아웃 서버 폐기), AD-13 앱 진입 refresh 추가, AQ-11을 AD-13 흐름으로 대체 | chaenamo |
| v0.5 | 2026-11-04 | 기준 문서, AD-11, AD-12, 4.1(AQ-01, AQ-08, AQ-12) | 문서 간 정합성 검토 반영: 기준 시나리오·와이어프레임 v0.5, 원칙 v0.4로 갱신. AD-11 repository 함수명을 AD-09·실행 계획 BE-06/BE-12와 같게(`findCategoryById`, `findDefaultCategory`, `deleteCategory`), AD-12 정렬에 `id` 추가(실행 계획 BE-10과 일치). AQ-01에 refresh·logout까지 확장된 범위(PR-16) 표기, 결정된 AQ-08·AQ-12의 기존 질문 문구를 "(원 내용)"으로 구분 | chaenamo |
| v0.6 | 2026-11-05 | 기준 문서, 0, AD-01, AD-05 | 이번 범위에서 부하 테스트를 하지 않고 배포는 사용자가 직접 하므로: AD-01에서 k6 노드·연결 삭제, AD-05를 "범위 밖"으로 바꾸고 후보 A·B는 코드 전제 참고용으로 유지. 기준 PRD v0.5, 원칙 v0.6 | chaenamo |
| v0.7 | 2026-11-05 | 0 | 개발 환경도 Vite 프록시 대신 CORS: FE(5173)가 `VITE_API_BASE_URL`로 BE(3000)를 직접 호출, BE는 `CORS_ORIGIN`만 허용(원칙 v0.8 PR-35) | chaenamo |
| v0.8 | 2026-11-05 | 4.1(AQ-05~07, AQ-09, AQ-10), 4.2, AD-05, AD-06~12 시퀀스 | BE-01~12 완료 반영: AQ-05·06·07·08(total)·09·10을 구현 값으로 결정 표기, 시퀀스 다이어그램의 "경로·메서드·코드 잠정" 문구 제거, U-04·U-05·U-09 결정 표기 | chaenamo |
| v0.9 | 2026-11-05 | 4.1(AQ-04) | FE-05 구현으로 AQ-04 결정: 날짜 산술은 `lib/date.ts` 안 UTC만, 어댑터도 이 함수 사용 | chaenamo |
| v1.0 | 2026-11-05 | AD-02, AD-12, 4.2 | FE-10 구현으로 U-03 결정: FullCalendar 6.1.22 고정, "미정·가정" 표기 정리 | chaenamo |
| v1.1 | 2026-11-06 | AD-02, AD-03, AD-07, AD-09, AD-13 | 구현 코드와 대조: AD-02 Zustand에 `localeStore`(언어, localStorage `todolist-locale`)·`themeStore`(화면 모드·글자 크기, localStorage `todolist-theme`) 추가, api client가 `Accept-Language`로 현재 언어 전송. AD-03 에러 미들웨어에 23503 → 409(EQ-01)·잘못된 JSON → 400·`i18n.js`로 문구 번역 추가, 헬스체크 화살표를 `checkConnection()`(AQ-07 결정)으로, 개발 환경 전용 Swagger UI(`/api-docs`) 명시. AD-07 만료 정리 조건 `expires_at <= now()`, AD-07·AD-13 service 함수명 `refreshAccessToken`, AD-09 `createTodo`·`updateTodo` | chaenamo |

> 기준 문서: `docs/1-domain-definition.md` (v0.3), `docs/2-PRD.md` (v0.5), `docs/3-user-scenario.md` (v0.5), `docs/4-wireframe.md` (v0.5), `docs/5-project-principle.md` (v0.6).
> 기준 문서 ID(P, FR, ST, BR, UC, AC, A, Q, NFR, TC, M, R, K, SC, G, WF, CMP, PR, U)는 **참조만** 하며 재정의하지 않는다. 구조 결정은 `5-project-principle.md`를 따른다.
> 이 문서 고유 ID: 다이어그램 `AD-xx`, 확인 필요 `AQ-xx`. 삭제되어도 **재사용하거나 다시 매기지 않는다.**

## 0. 읽는 법

- 다이어그램은 원칙 문서(PR)가 정한 것만 그린다. 원칙 문서에 없는 기술(캐시 서버, 메시지 큐, ORM, 마이크로서비스 등)은 쓰지 않는다(PR-08).
- **미정** = 기존 미결 ID(U, G)로 아직 결정되지 않음. **잠정** = 원칙 문서의 잠정 처리 또는 이 문서의 가정. API 경로·메서드·파라미터 이름은 후속 API 문서에서 확정하며 여기서는 모두 잠정이다(PRD 3.2, U-04).
- 시퀀스의 에러 응답은 PR-20 형식 `error.code / message / fields`와 코드↔상태 매핑을 따른다.

| 구분 | 다이어그램 |
|------|------------|
| 1부 기술 아키텍처 | AD-01 시스템 구성, AD-02 FE 내부 구조, AD-03 BE 레이어, AD-04 데이터 모델(→ `7-erd.md`), AD-05 배포 뷰(범위 밖) |
| 2부 시퀀스 | AD-06 회원가입, AD-07 로그인·인증·401·refresh·로그아웃, AD-08 목록 조회·필터, AD-09 할일 등록/수정, AD-10 완료 토글, AD-11 카테고리 삭제, AD-12 캘린더 조회, AD-13 앱 진입 refresh |

---

# 1부. 기술 아키텍처

## AD-01 시스템 컨텍스트 / 전체 구성

브라우저의 React SPA가 HTTPS로 Express API를 호출하고, API만 PostgreSQL에 접근한다. 배포는 사용자가 직접 하며 계획 범위 밖이다(U-01).

```mermaid
flowchart LR
    USER(["사용자<br/>데스크톱·모바일 브라우저 NFR-15, NFR-16"])

    subgraph BROWSER["브라우저"]
        SPA["React 19 + TS SPA<br/>Vite 빌드 정적 파일<br/>TanStack Query + Zustand"]
    end

    subgraph SERVER["API 서버 - 호스팅 미정 U-01"]
        API["Node.js 22 + Express 5<br/>JS ESM, REST /api, GET /health"]
    end

    DB[("PostgreSQL 17<br/>users, categories, todos<br/>refresh_tokens, schema_migrations")]
    ENV["환경변수 PR-33, PR-34<br/>DATABASE_URL, JWT_ACCESS_SECRET, CORS_ORIGIN 등"]

    USER --> SPA
    SPA -->|"HTTPS JSON NFR-14<br/>Authorization: Bearer JWT HS384 NFR-10<br/>HTTPS 종단 위치 미정 U-01"| API
    API -->|"pg.Pool 단일, max 20 NFR-05<br/>파라미터화 SQL NFR-11"| DB
    ENV -.->|"기동 시 1회 로딩"| API
```

- 개발·운영 모두 CORS(PR-35): FE가 `VITE_API_BASE_URL`(개발 `http://localhost:3000`)로 BE를 직접 호출하고, BE는 필수 환경변수 `CORS_ORIGIN`(쉼표로 여러 개, `*` 금지, 개발 `http://localhost:5173`)에 지정한 출처만 허용한다. 프록시는 쓰지 않는다.
- 별도 세션 저장소(Redis 등) 없음. 보호 요청은 access token 서명만 검증하고(무상태), refresh token의 유효·폐기 여부만 DB `refresh_tokens`로 확인한다(NFR-10, PR-37). 서버 시계로 '오늘'을 정하지 않는다(PR-05).

## AD-02 프론트엔드 내부 구조

`pages → hooks → api` 단방향(PR-13). 서버 데이터는 TanStack Query 캐시에만, Zustand는 토큰(access 메모리, refresh localStorage `todolist-auth`), UI 상태, 화면 설정(언어·화면 모드·글자 크기, localStorage)만 가진다(PR-14, PR-37).

```mermaid
flowchart TB
    APP["App.tsx<br/>라우트 + 인증 가드 SC-00-E1"]
    LAYOUT["components/Layout WF-01"]

    subgraph PAGES["pages/ - WF 1:1"]
        PA["LoginPage WF-02<br/>SignupPage WF-03"]
        PT["TodoListPage WF-04<br/>TodoEditPage WF-05"]
        PC["CalendarPage WF-06"]
        PM["MyInfoPage WF-07<br/>CategoryPage WF-08<br/>NotFoundPage CMP-04"]
    end

    COMP["components/ 표시용, props만<br/>StatusBadge CMP-05, ConfirmModal CMP-01·02<br/>Toast CMP-03, todo/"]
    CALAD["components/calendar/ 어댑터<br/>FullCalendar 6.1.22 - U-03 결정<br/>종료일 +1 배타 변환은 여기서만 PR-18"]
    LIB["lib/date.ts<br/>todayString 브라우저 로컬 A-01<br/>월/주 범위, 일요일 시작 A-12"]

    subgraph STATE["상태"]
        AUTHS["stores/authStore<br/>access token 메모리만, persist 안 함<br/>refresh token만 localStorage persist U-02 결정"]
        UIS["stores/uiStore<br/>목록 필터·페이지, 캘린더 뷰·기준 날짜<br/>PR-15, G-08, G-12"]
        LOCS["stores/localeStore<br/>언어 ko·ja·en, localStorage persist<br/>i18n/ 사전 선택, html lang 동기화"]
        THS["stores/themeStore<br/>화면 모드·글자 크기, localStorage persist<br/>html data-theme·data-font-size 동기화"]
        QC[("QueryClient 캐시<br/>할일·카테고리·내 정보")]
    end

    HOOKS["hooks/ TanStack Query<br/>useAuth, useMe, useCategories<br/>useTodos, useCalendarTodos<br/>쓰기 후 invalidateQueries"]
    APIR["api/auth, users, categories, todos<br/>api/types.ts - React import 금지"]
    CLIENT["api/client.ts<br/>fetch + Bearer·Accept-Language 부착, PR-20 에러 파싱<br/>401: single-flight refresh 1회 → 원 요청 1회 재시도<br/>refresh 401: 토큰 둘 다 폐기 → queryClient.clear → /login PR-16"]
    BE["Express API AD-03"]

    APP --> LAYOUT --> PAGES
    APP -.->|"access 유무, 없으면 refresh AD-13"| AUTHS
    PAGES --> COMP
    PC --> CALAD
    PAGES <-->|"UI 상태"| UIS
    PAGES <-->|"언어·화면 설정"| LOCS
    PAGES <-->|"언어·화면 설정"| THS
    PAGES --> HOOKS
    HOOKS --> LIB
    HOOKS <--> QC
    HOOKS --> APIR --> CLIENT
    CLIENT -.->|"토큰 읽기·폐기"| AUTHS
    CLIENT -.->|"언어 읽기"| LOCS
    CLIENT -.->|"401 시 clear"| QC
    CLIENT -->|"HTTPS"| BE
```

- 금지: 페이지·컴포넌트의 직접 `fetch`, 서버 응답의 Zustand 복사, FE의 상태 판정(상태는 응답 값을 표시만, PR-03).
- 로그아웃은 `POST /api/auth/logout`으로 서버의 refresh token을 폐기한 뒤 refresh 실패 처리와 같은 함수(토큰 폐기 + `queryClient.clear()`)를 쓴다(PR-16, PR-37, A-14).
- 인증 엔드포인트(login, signup, refresh, logout)의 401은 공통 401 처리에서 제외한다(AQ-01 결정 확장).

## AD-03 백엔드 레이어 구조

`app.js`가 미들웨어 → 라우터 → 404 → 에러 미들웨어 순으로 조립한다. 의존은 `routes → services → repositories` 한 방향이며 `validators/`·`domain/`은 순수 함수다(PR-09).

```mermaid
flowchart TB
    REQ(["HTTP 요청"])

    subgraph MW["middleware - app.js 조립 순서"]
        CORS["cors<br/>CORS_ORIGIN만 허용 PR-35"]
        JSON["express.json"]
        LOG["requestLog<br/>메서드·경로·상태·시간만 PR-40"]
        AUTH["auth.js<br/>Bearer JWT 검증 algorithms HS384 고정 → req.userId<br/>실패 401 UNAUTHORIZED PR-37"]
    end

    subgraph RT["routes/ - HTTP 레이어, 컨트롤러 겸함"]
        HEALTH["health.js<br/>GET /health 공개 PR-45"]
        RAUTH["auth.js<br/>/api/auth/signup, login, refresh, logout 공개"]
        RPRIV["users.js, categories.js, todos.js<br/>인증 필요 PR-07"]
    end

    subgraph PURE["순수 함수 - I/O 없음"]
        VAL["validators/<br/>필수·형식·실제 날짜·길이·trim·페이지<br/>실패 400 VALIDATION_ERROR + fields PR-39"]
        DOM["domain/todoStatus.js<br/>deriveStatus todo, today<br/>상태별 SQL 조건 조각 PR-03"]
    end

    SVC["services/<br/>authService, userService, categoryService, todoService<br/>BR 판단, 트랜잭션 경계, AppError PR-11"]
    REPO["repositories/<br/>user, category, todo, refreshTokenRepository<br/>userId 첫 인자 + WHERE user_id PR-10<br/>$n 파라미터, AS camelCase PR-19, PR-38"]
    DBJS["db.js<br/>pg.Pool 단일 인스턴스 PR-41<br/>setTypeParser 1082 문자열 PR-42<br/>withTransaction PR-11"]
    PG[("PostgreSQL 17")]
    NF404["미등록 경로<br/>404 NOT_FOUND"]
    ERR["middleware/error.js - 맨 뒤<br/>AppError → 해당 코드, 23505 → 409 CONFLICT<br/>23503 fk_todos_category_owner → 409 EQ-01, 잘못된 JSON → 400<br/>그 외 500 INTERNAL, 스택은 서버 로그만 PR-46<br/>문구는 Accept-Language로 i18n.js 번역 ko·ja·en"]
    CFG["config.js<br/>환경변수 단일 로딩, 필수값 없으면 기동 종료 PR-34"]

    REQ --> CORS --> JSON --> LOG
    LOG --> HEALTH
    LOG --> RAUTH
    LOG --> AUTH --> RPRIV
    LOG --> NF404
    RAUTH --> VAL
    RPRIV --> VAL
    RAUTH --> SVC
    RPRIV --> SVC
    SVC --> DOM
    SVC --> REPO
    REPO -.->|"상태 필터 조각"| DOM
    REPO --> DBJS --> PG
    HEALTH -.->|"checkConnection SELECT 1, AQ-07 결정"| DBJS
    SVC -.->|"throw"| ERR
    AUTH -.->|"throw 401"| ERR
    CFG -.-> DBJS
    CFG -.-> AUTH
    CFG -.-> SVC
```

- 개발 환경(`NODE_ENV=development`, `npm run dev`)에서만 `app.js`가 `/health` 다음에 Swagger UI(`/api-docs`, `apiDocs.js`가 `swagger.yaml` 로드)를 연결한다. 공개 경로다.

| 레이어 | 금지 (PR-09 표) |
|--------|-----------------|
| routes | SQL, `pg` 직접 사용, BR 판단 |
| services | `req`/`res` 접근, SQL 문자열 |
| repositories | 비즈니스 판단, HTTP 상태코드 결정 |
| domain, validators | DB·HTTP·전역 상태 접근 |

## AD-04 데이터 모델

ERD는 `docs/7-erd.md`로 분리되었다(v0.3). 테이블 `users`, `categories`, `todos`(snake_case 복수형, 상태 컬럼 없음 PR-03)와 인증 인프라 테이블 `refresh_tokens`(해시만 저장, 사용자 삭제 시 CASCADE, 도메인 규칙과 무관), 식별자 `bigint identity`, 할일의 카테고리 소유자 일치는 복합 FK로 강제한다. 제약 이름(PR-46 매핑), 인덱스(NFR-07), 마이그레이션 파일은 [7-erd.md](7-erd.md)를 따른다.

## AD-05 배포 뷰 (범위 밖, U-01)

배포는 사용자가 직접 하며 계획 범위 밖이다(U-01). 코드가 전제하는 형태를 참고용으로 남긴다: 후보 A가 코드의 기본 가정(CORS 화이트리스트, `VITE_API_BASE_URL`), B는 대안. 어느 쪽이든 DB는 1개다.

```mermaid
flowchart LR
    subgraph A["후보 A - 잠정: FE·BE 분리 호스팅"]
        A_STATIC["정적 호스팅<br/>frontend 빌드 결과"]
        A_API["Node 22 + Express API<br/>CORS_ORIGIN = FE 출처"]
        A_DB[("PostgreSQL 17")]
        A_STATIC -.->|"브라우저가 HTTPS로 API 호출"| A_API
        A_API --> A_DB
    end

    subgraph B["후보 B - 대안: 단일 서버 같은 출처"]
        B_API["Node 22 + Express<br/>정적 파일 서빙 + /api<br/>CORS 불필요"]
        B_DB[("PostgreSQL 17")]
        B_API --> B_DB
    end
```

- HTTPS 종단 위치(프록시/호스팅 플랫폼), 로컬 실행 방식은 로컬 설치로 결정(U-09).
- 배포 전 확인: `GET /health` 200, 마이그레이션 적용(`scripts/migrate.js`), 환경변수 필수값(PR-34).

---

# 2부. 비즈니스 로직 시퀀스

공통 참여자: User, FE page, Query hook/api(api client 포함), Express auth mw, Route, Validator/Domain, Service, Repository, PostgreSQL. 다이어그램마다 필요한 참여자만 쓴다. 에러는 service·validator가 던지고 에러 미들웨어(AD-03)가 PR-20 형식으로 응답한다. 시퀀스에서는 이를 Route → hook 응답 화살표로 줄여 그린다.

## AD-06 회원가입 + '기본' 카테고리 자동 생성

bcrypt 해시는 트랜잭션 밖에서 먼저 계산해 커넥션 점유 시간을 줄이고, 사용자·'기본' 카테고리·refresh token INSERT를 한 트랜잭션으로 묶는다(BR-05, PR-11). refresh token 저장이 실패하면 가입 전체를 롤백해, 계정은 생겼는데 토큰이 없는 상태를 만들지 않는다. 성공 시 토큰 쌍을 발급해 자동 로그인한다(G-01, PR-37).

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as SignupPage
    participant H as useAuth / api
    participant R as routes/auth
    participant V as validators/auth
    participant S as authService
    participant Repo as user·category·refreshTokenRepo
    participant DB as PostgreSQL

    U->>P: 이메일·비밀번호·이름 입력 후 가입하기
    P->>H: signup mutation
    H->>R: POST /api/auth/signup
    Note over R: 공개 경로, auth mw 미적용 PR-07
    R->>V: validateSignup(body)
    alt 필수 누락·이메일 형식·비밀번호 규칙 위반 SC-01-E2, 규칙 G-05
        V-->>R: throw VALIDATION_ERROR + fields
        R-->>H: 400 VALIDATION_ERROR
        H-->>P: 필드 아래 오류 CMP-03, 입력 유지
    else 검증 통과
        R->>S: signup(email, password, name)
        S->>S: bcrypt.hash(password, BCRYPT_COST 10) NFR-09
        rect rgb(235, 245, 255)
            Note over S,DB: withTransaction - BEGIN
            S->>Repo: insertUser(client, email, passwordHash, name)
            Repo->>DB: INSERT INTO users ... RETURNING id
            alt 이메일 중복 BR-03, unique 위반 23505
                DB-->>Repo: error 23505
                Note over S,DB: ROLLBACK
                S-->>R: 에러 전파 → error mw
                R-->>H: 409 CONFLICT, fields.email - 제약 이름 매핑 PR-46
                H-->>P: 이메일 필드 아래 이미 사용 중 SC-01-E1
            else 사용자 생성
                DB-->>Repo: id
                S->>Repo: insertCategory(client, userId, '기본', isDefault true) BR-05
                Repo->>DB: INSERT INTO categories ...
                S->>S: refreshToken = randomBytes 32 base64url, tokenHash = SHA-256
                S->>Repo: insertRefreshToken(client, userId, tokenHash, now + 14일)
                Repo->>DB: INSERT INTO refresh_tokens - 해시만 저장
                Note over S,DB: COMMIT
                S->>S: accessToken = jwt.sign sub=userId, HS384, 15m PR-37
                S-->>R: accessToken, refreshToken, user (password_hash 제외)
                R-->>H: 201 accessToken, refreshToken, user
                H->>H: authStore - access 메모리, refresh localStorage
                H-->>P: 성공
                P-->>U: 빈 할일 목록 WF-04로 이동 G-01
            end
        end
    end
```

## AD-07 로그인 + 보호 요청 + access 만료 401 → refresh → 재시도 + 로그아웃

로그인 성공 시 access token(JWT HS384, 15분)과 refresh token(불투명 무작위 문자열, 14일, 회전 없음)을 받는다. access token은 `authStore` 메모리에만, refresh token은 localStorage(`persist`)에 둔다. 서버는 refresh token의 SHA-256 해시만 `refresh_tokens`에 저장한다(PR-37). 보호 요청의 401은 api client 한 곳에서 refresh 1회 시도(single-flight) → 원 요청 1회 재시도로 처리하고, refresh도 401이면 로그인 화면으로 보낸다(PR-16, SC-00-E2, G-03). 로그아웃은 서버에서 refresh token 행을 삭제한다(A-14). 앱 진입 시 refresh는 AD-13.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as FE page
    participant H as hook / api client
    participant ST as authStore
    participant A as auth mw
    participant R as Route
    participant S as Service
    participant Repo as user·refreshTokenRepo
    participant DB as PostgreSQL

    rect rgb(245, 245, 245)
        Note over U,DB: 1) 로그인 UC-02 - 토큰 쌍 발급
        U->>P: 이메일·비밀번호 입력 후 로그인 WF-02
        P->>H: login mutation
        H->>R: POST /api/auth/login (공개)
        Note over R: validators/auth로 필수·형식 검증, 실패 400
        R->>S: login(email, password)
        S->>Repo: findUserWithHashByEmail(db, email) PR-36
        Repo->>DB: SELECT id, password_hash ... WHERE email = $1
        alt 사용자 없음 또는 bcrypt.compare 불일치
            S-->>R: throw 401 UNAUTHORIZED, 구분 없는 문구 G-04
            R-->>H: 401
            Note over H: 인증 엔드포인트의 401은 공통 401 처리 제외 PR-16, AQ-01 결정
            H-->>P: 폼 상단 오류, 입력 유지 SC-02-E1
        else 일치
            S->>Repo: deleteExpiredByUser(db, userId)
            Repo->>DB: DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at <= now()
            S->>S: accessToken = jwt.sign sub=userId, HS384, ACCESS_TOKEN_TTL 15m
            S->>S: refreshToken = randomBytes 32 base64url, tokenHash = SHA-256
            S->>Repo: insertRefreshToken(db, userId, tokenHash, now + 14일)
            Repo->>DB: INSERT INTO refresh_tokens - 해시만 저장
            S-->>R: accessToken, refreshToken, user
            R-->>H: 200 accessToken, refreshToken, user
            H->>ST: access는 메모리, refresh는 localStorage persist PR-37
            P-->>U: 할일 목록 WF-04
        end
    end

    rect rgb(235, 245, 255)
        Note over U,DB: 2) 보호 요청 BR-01, NFR-10
        U->>P: 화면 조작
        P->>H: useQuery / useMutation
        H->>ST: access token 읽기
        H->>A: 요청 + Authorization Bearer
        A->>A: jwt.verify algorithms HS384 고정 → req.userId = sub
        A->>R: next()
        R->>S: userId 전달
        S->>Repo: userId 첫 인자 PR-10
        Repo->>DB: ... WHERE user_id = $1
        DB-->>Repo: rows
        Repo-->>S: camelCase 결과
        S-->>R: 결과
        R-->>H: 200 JSON
        H-->>P: 캐시 갱신 후 렌더
    end

    rect rgb(255, 245, 235)
        Note over U,DB: 3) access 만료 401 → refresh 1회 → 원 요청 1회 재시도 PR-16
        H->>A: 요청 + Bearer - 만료·서명 불일치·HS384 아님·없음
        A-->>H: 401 UNAUTHORIZED
        Note over H: 동시에 401이 여러 개여도 refresh 요청은 1개 single-flight, 나머지는 결과 대기
        H->>ST: refresh token 읽기
        H->>R: POST /api/auth/refresh body refreshToken (공개)
        R->>S: refreshAccessToken(refreshToken)
        S->>Repo: findValidByHash(db, SHA-256 해시)
        Repo->>DB: SELECT user_id ... WHERE token_hash = $1 AND expires_at > now()
        alt 유효한 행 있음
            S->>S: jwt.sign sub=userId, HS384, 15m - refresh token은 그대로, 회전 없음
            S-->>R: accessToken
            R-->>H: 200 accessToken
            H->>ST: access token 교체, 메모리
            H->>A: 원 요청 1회 재시도 + 새 Bearer
            A->>R: 검증 통과, 이후 2)와 같음
            R-->>H: 200 JSON
            H-->>P: 렌더, 사용자에게 보이지 않음
        else 행 없음·만료 - 로그아웃·비밀번호 변경으로 폐기된 경우 포함
            S-->>R: throw 401 UNAUTHORIZED
            R-->>H: 401
            Note over H: refresh의 401은 다시 refresh하지 않는다 AQ-01 확장
            H->>ST: access·refresh 둘 다 폐기
            H->>H: queryClient.clear() PR-16
            H-->>P: /login 이동, 작성 중 입력 비보존 G-03
            P-->>U: 로그인 화면 SC-00-E2
        end
    end

    rect rgb(245, 255, 245)
        Note over U,DB: 4) 로그아웃 A-14 - 서버 폐기
        U->>P: 로그아웃 WF-01
        P->>H: logout
        H->>R: POST /api/auth/logout body refreshToken (공개)
        R->>S: logout(refreshToken)
        S->>Repo: deleteByHash(db, SHA-256 해시)
        Repo->>DB: DELETE FROM refresh_tokens WHERE token_hash = $1
        R-->>H: 204 - 행이 없어도 204, 멱등
        Note over H: 네트워크 실패여도 클라이언트 폐기는 진행
        H->>ST: access·refresh 둘 다 폐기
        H->>H: queryClient.clear() PR-16
        P-->>U: 로그인 화면 WF-02
    end
```

- 비밀번호 변경(UC-03, 시퀀스 생략): 성공 시 같은 트랜잭션에서 그 사용자의 `refresh_tokens`를 모두 삭제하고 현재 세션용 새 refresh token을 저장해 `{ refreshToken }`으로 응답한다. FE는 저장된 refresh token을 교체한다. 다른 기기는 access token 만료(최대 15분) 후 3)의 refresh 401 분기로 로그인 화면에 간다(G-06, PR-37).

## AD-13 앱 진입: refresh로 access token 확보 (SC-02-A1)

access token은 메모리에만 있으므로 새로고침·재방문 시에는 없다. 인증 가드는 localStorage의 refresh token으로 refresh를 먼저 호출해 access token을 얻은 뒤 보호 화면을 렌더한다. 판정 중에는 보호 화면을 렌더하지 않으므로 만료 토큰으로 보호 화면이 잠깐 보이는 문제(AQ-11)가 없다.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant APP as App.tsx 인증 가드
    participant H as api client
    participant ST as authStore
    participant R as routes/auth
    participant S as authService
    participant Repo as refreshTokenRepo
    participant DB as PostgreSQL

    U->>APP: 앱 접속 / URL 직접 입력 / 새로고침
    APP->>ST: 메모리 access token 확인
    alt access token 있음 - 같은 탭에서 이미 발급
        APP-->>U: 요청한 보호 화면
    else access token 없음
        APP->>ST: localStorage refresh token 확인
        alt refresh token 없음
            APP-->>U: /login WF-02 SC-00-E1
        else refresh token 있음 SC-02-A1
            Note over APP: 판정 중 로딩 표시, 보호 화면 렌더 안 함
            APP->>H: refresh() - AD-07 3)과 같은 single-flight 함수
            H->>R: POST /api/auth/refresh body refreshToken
            R->>S: refreshAccessToken(refreshToken)
            S->>Repo: findValidByHash(db, SHA-256 해시)
            Repo->>DB: SELECT user_id ... WHERE token_hash = $1 AND expires_at > now()
            alt 유효
                R-->>H: 200 accessToken
                H->>ST: access token 저장, 메모리
                APP-->>U: 보호 화면 진입, 로그인 생략 SC-02-A1
            else 없음·만료·폐기
                R-->>H: 401 UNAUTHORIZED
                H->>ST: refresh token 폐기
                APP-->>U: /login WF-02
            end
        end
    end
```

## AD-08 할일 목록 조회: today 전달, 필터, 정렬, 페이지네이션, 상태 파생

FE가 브라우저 로컬 날짜 `today`를 보내고(PR-05), BE는 이 값으로 상태 필터를 SQL 조건으로 바꾼 뒤 결과마다 상태를 파생한다(PR-03). 카테고리 AND (상태 OR) 조합(BR-15).

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as TodoListPage
    participant UI as uiStore
    participant H as useTodos / api
    participant A as auth mw
    participant R as routes/todos
    participant V as validators/todo
    participant S as todoService
    participant D as domain/todoStatus
    participant Repo as todoRepository
    participant DB as PostgreSQL

    U->>P: 목록 진입 또는 필터·페이지 변경
    P->>UI: categoryId, statuses, page 읽기·쓰기 (필터 변경 시 page 1, G-09)
    P->>H: useTodos(filter, page)
    H->>H: today = todayString() 브라우저 로컬 A-01
    Note over H: queryKey에 today·filter·page 포함, 캐시 재사용 NFR-08
    H->>A: GET /api/todos ?today&categoryId&status&page&limit (형식 U-04)
    A->>R: req.userId
    R->>V: validateListQuery
    alt today 형식·실제 날짜 오류, status 화이트리스트 밖, page·limit 범위 오류
        V-->>R: throw VALIDATION_ERROR
        R-->>H: 400
        H-->>P: 실패 토스트 CMP-03
    else 통과 (limit 기본 50, 최대 100 PR-43)
        R->>S: listTodos(userId, filter, today, page, limit)
        S->>Repo: findTodosByUser(db, userId, filter, today, page, limit)
        Repo->>D: 선택된 상태별 SQL 조건 조각 요청
        D-->>Repo: 화이트리스트 조각, today는 파라미터 자리 PR-38
        Note over Repo: WHERE user_id = $1<br/>[AND category_id = $n]<br/>[AND (조각1 OR 조각2 ...)]<br/>ORDER BY end_date, created_at, id Q-05, AQ-08<br/>LIMIT $n OFFSET $n
        Repo->>DB: SELECT ... AS camelCase + 같은 조건 total 집계
        DB-->>Repo: rows, date 컬럼은 'YYYY-MM-DD' 문자열 PR-42
        Repo-->>S: items, total
        loop 각 할일
            S->>D: deriveStatus(todo, today)
            D-->>S: COMPLETED / OVERDUE / IN_PROGRESS / NOT_STARTED
        end
        S-->>R: items + status
        R-->>H: 200 items, page, limit, total PR-20
        H-->>P: 데이터
        P-->>U: 행 + 상태 배지 CMP-05, 페이지네이션 / 빈 상태 8a·8b
    end
```

`domain/todoStatus.js` 판정 ↔ SQL 조각 대응 (두 표현이 같은 규칙이어야 하므로 한 파일에 둔다, PR-29 경계 테스트로 확인)

| 상태 코드 | ST | `deriveStatus` 판정 (순서: 완료 → 기한 초과 → 진행 중 → 시작 전) | SQL 조각 (`$t` = today) |
|-----------|----|--------------------------------------------------|-------------------------|
| `COMPLETED` | ST-01 | `isCompleted` | `is_completed` |
| `OVERDUE` | ST-04 | 미완료 AND today > endDate | `NOT is_completed AND end_date < $t` |
| `IN_PROGRESS` | ST-03 | 미완료 AND startDate ≤ today ≤ endDate | `NOT is_completed AND start_date <= $t AND end_date >= $t` |
| `NOT_STARTED` | ST-02 | 미완료 AND today < startDate | `NOT is_completed AND start_date > $t` |

AC-03 확인: today 11/13, 할일 11/10~11/12 미완료 → `end_date < $t` 참이므로 OVERDUE에 포함, IN_PROGRESS 조건 `end_date >= $t` 거짓이므로 미포함.

## AD-09 할일 등록 / 수정

등록·수정이 같은 검증과 카테고리 규칙을 쓴다(BR-17). 카테고리 미지정은 '기본'(BR-08), 지정 시 본인 소유 확인(PR-10), 수정 대상이 본인 것이 아니면 404(NFR-12). 완료 여부·완료일시는 수정으로 바꾸지 않는다(SC-07-A1).

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as TodoEditPage
    participant H as useTodos / api
    participant A as auth mw
    participant R as routes/todos
    participant V as validators/todo
    participant S as todoService
    participant Repo as todo·categoryRepo
    participant DB as PostgreSQL

    opt 수정 진입 시 기존 값 조회
        P->>H: useTodo(id) → GET /api/todos/:id
        alt 본인 할일 아님·삭제됨
            H-->>P: 404 NOT_FOUND → CMP-04 SC-07-E2
        end
    end
    U->>P: 제목·설명·카테고리·시작일자·종료일자 입력 후 저장
    P->>P: FE 검증 UX 보조 - 필수, 종료일자 ≥ 시작일자 PR-06
    P->>H: create 또는 update(id) mutation
    H->>A: POST /api/todos 또는 PUT /api/todos/:id (AQ-10)
    A->>R: req.userId
    R->>V: validateTodo(body)
    alt 필수 누락 BR-10, 날짜 형식·실제 날짜 오류, 종료일자 < 시작일자 BR-11
        V-->>R: throw VALIDATION_ERROR + fields
        R-->>H: 400 fields.endDate 등
        H-->>P: 해당 필드 아래 오류 AC-02, SC-04-E2
    else 통과 - 과거 날짜·같은 날 허용 BR-11, BR-12
        R->>S: createTodo(userId, input) 또는 updateTodo(userId, id, input)
        alt categoryId 없음 BR-08
            S->>Repo: findDefaultCategory(db, userId)
            Repo->>DB: SELECT ... WHERE user_id = $1 AND is_default
        else categoryId 지정
            S->>Repo: findCategoryById(db, userId, categoryId)
            Repo->>DB: SELECT ... WHERE user_id = $1 AND id = $2
            alt 0건 - 타인 또는 없는 카테고리 PR-10
                S-->>R: throw 400 VALIDATION_ERROR fields.categoryId (AQ-06)
                R-->>H: 400
            end
        end
        alt 등록
            S->>Repo: insertTodo(db, userId, input)
            Repo->>DB: INSERT INTO todos ... RETURNING
            R-->>H: 201 todo AC-01
        else 수정 BR-17
            S->>Repo: updateTodo(db, userId, id, input)
            Repo->>DB: UPDATE todos SET title, description, category_id, start_date, end_date, updated_at = now() WHERE id = $2 AND user_id = $1 RETURNING
            alt 0건 - 타인 할일·다른 탭에서 삭제됨
                S-->>R: throw 404 NOT_FOUND NFR-12
                R-->>H: 404
                H-->>P: CMP-04 후 목록으로 SC-07-E3
            else 수정됨
                R-->>H: 200 todo (is_completed·completed_at 유지 SC-07-A1)
            end
        end
        H->>H: invalidateQueries 목록·캘린더 PR-14
        P-->>U: 진입했던 화면으로 복귀 G-12
    end
```

- 쓰기 요청에는 `today`가 없으므로(PR-05는 조회에만 전달) 응답에 상태를 넣지 않고 재조회 결과로 표시한다(AQ-09 결정).

## AD-10 완료 토글

완료 시 완료일시 기록, 취소 시 비움(BR-13). 낙관적 업데이트 없이 성공 후 즉시 재조회한다(PR-14, AQ-03 결정). 상태 필터와 안 맞게 된 항목은 재조회 결과에서 바로 사라지고(G-11), 실패 시 캐시가 바뀐 적이 없어 토글이 원 상태로 남는다(SC-06-E1).

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as TodoListPage
    participant H as useTodos / api
    participant A as auth mw
    participant R as routes/todos
    participant V as validators/todo
    participant S as todoService
    participant D as domain/todoStatus
    participant Repo as todoRepository
    participant DB as PostgreSQL

    U->>P: 완료 토글 클릭 WF-04 (6)
    P->>H: setCompleted.mutate(id, 반전값)
    Note over P,H: 요청 중 해당 토글 비활성, 캐시 선반영 없음 PR-14
    H->>A: PATCH /api/todos/:id isCompleted (AQ-10)
    A->>R: req.userId
    R->>V: isCompleted boolean 검증, 실패 400
    R->>S: setCompleted(userId, id, isCompleted)
    S->>Repo: updateCompletion(db, userId, id, isCompleted)
    Repo->>DB: UPDATE todos SET is_completed = $3, completed_at = 완료면 now() 아니면 NULL, updated_at = now() WHERE id = $2 AND user_id = $1 RETURNING
    alt 0건 - 타인·이미 삭제됨
        S-->>R: throw 404 NOT_FOUND
        R-->>H: 404
        H-->>P: 찾을 수 없음 안내 + 목록 재조회
    else 갱신됨 BR-13
        R-->>H: 200 todo
        H->>H: invalidateQueries 목록·캘린더
        H->>A: GET /api/todos ?today... 재조회 (AD-08)
        Note over S,D: 재조회에서 deriveStatus로 재판정<br/>완료 → ST-01, 취소 → ST-02~04<br/>종료일자 지난 할일 취소 → OVERDUE SC-06-A2
        H-->>P: 새 상태 배지, 필터와 안 맞으면 즉시 사라짐 G-11, 캘린더 취소선 Q-03
    end
    opt 네트워크 오류·5xx SC-06-E1
        H-->>P: onError - 캐시 미변경이므로 토글은 원 상태
        P-->>U: 실패 토스트 CMP-03
    end
```

## AD-11 카테고리 삭제 (Should, M-05)

'기본' 카테고리 삭제는 거부하고(BR-06), 소속 할일을 '기본'으로 옮긴 뒤 삭제하는 두 쓰기를 한 트랜잭션으로 묶는다(BR-09, PR-11).

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as CategoryPage
    participant UI as uiStore
    participant H as useCategories / api
    participant A as auth mw
    participant R as routes/categories
    participant S as categoryService
    participant Repo as category·todoRepo
    participant DB as PostgreSQL

    U->>P: 삭제 → CMP-01 카테고리용 확인 G-07
    U->>P: 확인
    P->>H: deleteCategory(id)
    H->>A: DELETE /api/categories/:id
    A->>R: req.userId
    Note over R: validators로 id 형식 검증, 실패 400
    R->>S: deleteCategory(userId, id)
    rect rgb(235, 245, 255)
        Note over S,DB: withTransaction - BEGIN
        S->>Repo: categoryRepository.findCategoryById(client, userId, id)
        Repo->>DB: SELECT ... WHERE user_id = $1 AND id = $2
        alt 0건 - 타인·없는 카테고리
            Note over S,DB: ROLLBACK
            S-->>R: throw 404 NOT_FOUND NFR-12
            R-->>H: 404
        else is_default = true
            Note over S,DB: ROLLBACK
            S-->>R: throw 400 FORBIDDEN_OPERATION BR-06
            R-->>H: 400, 화면은 버튼 비노출 SC-03-E3
        else 사용자 카테고리
            S->>Repo: categoryRepository.findDefaultCategory(client, userId)
            Repo->>DB: SELECT id ... WHERE user_id = $1 AND is_default
            S->>Repo: todoRepository.moveCategory(client, userId, id, defaultId)
            Repo->>DB: UPDATE todos SET category_id = 기본 WHERE user_id = $1 AND category_id = 대상 BR-09
            S->>Repo: categoryRepository.deleteCategory(client, userId, id)
            Repo->>DB: DELETE FROM categories WHERE id = $2 AND user_id = $1 AND NOT is_default
            Note over S,DB: COMMIT, 중간 실패 시 ROLLBACK - 할일 유실 없음
            R-->>H: 204
            H->>H: invalidateQueries 카테고리·목록·캘린더
            H->>UI: 필터가 삭제된 카테고리면 해제 G-08
            P-->>U: 목록에서 제거, 성공 토스트
        end
    end
```

## AD-12 캘린더 조회 (월/주/일)

뷰 범위 `from`~`to`(PR-43 이름. 요청의 start/end, rangeStart/rangeEnd와 같은 뜻)로 기간 겹침 할일만 조회하고(BR-16), 라이브러리 형식 변환은 어댑터 한 곳에서 한다(PR-18). 라이브러리는 FullCalendar 6.1.22로 결정(U-03).

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as CalendarPage
    participant UI as uiStore
    participant CA as calendar 어댑터
    participant H as useCalendarTodos / api
    participant A as auth mw
    participant R as routes/todos
    participant V as validators/todo
    participant S as todoService
    participant D as domain/todoStatus
    participant Repo as todoRepository
    participant DB as PostgreSQL

    U->>P: 캘린더 진입, 뷰 전환, 이전·다음·오늘
    P->>UI: 뷰·기준 날짜 읽기·쓰기 (초기 오늘 포함 월간 G-13)
    P->>CA: 현재 뷰 표시 범위 요청
    CA-->>P: from, to 포함 범위 'YYYY-MM-DD', 주는 일요일 시작 A-12 (라이브러리 범위 end 배타 처리 AQ-04)
    P->>H: useCalendarTodos(from, to)
    H->>H: today = todayString() 일간 뷰 상태 배지용 PR-05
    H->>A: GET 캘린더 기간 조회 ?from&to&today (AQ-05)
    A->>R: req.userId
    R->>V: from·to·today 형식, from ≤ to
    alt 검증 실패
        V-->>R: throw VALIDATION_ERROR
        R-->>H: 400
    else 통과
        R->>S: listCalendarTodos(userId, from, to, today)
        S->>Repo: findTodosInRange(db, userId, from, to)
        Repo->>DB: SELECT ... WHERE user_id = $1 AND start_date ≤ $to AND end_date ≥ $from ORDER BY start_date, id BR-16, PR-43
        DB-->>Repo: 기간이 하루라도 겹치는 할일만, 페이지네이션 없음 NFR-06
        Repo-->>S: items
        loop 각 할일
            S->>D: deriveStatus(todo, today)
        end
        R-->>H: 200 items + status
        H-->>P: 데이터
        P->>CA: toEvents(items)
        CA->>CA: start = startDate, end = endDate + 1일 (종일 이벤트 end 배타) PR-18
        CA->>CA: isCompleted면 취소선 클래스 Q-03
        CA-->>U: 월·주·일 렌더, 기간 전체 칸에 바 표시, 모바일 +N NFR-16
    end
    U->>CA: 바 선택
    CA-->>P: todo id
    P-->>U: WF-05 수정 화면 이동 (복귀는 캘린더 G-12)
```

AC 확인: AC-05 할일 10/30~11/02, 11월 월간 from 11/01 → `start_date 10/30 ≤ to` AND `end_date 11/02 ≥ 11/01` 참 → 포함, 어댑터 end = 11/03(배타)으로 11/01·11/02 칸에 표시. AC-06 할일 11/14~11/16, 주간 11/08~11/14 → `11/14 ≤ 11/14` AND `11/16 ≥ 11/08` 참 → 11/14 칸 표시.

---

## 3. 추적 표 (AD → 근거 ID)

| AD | 제목 | PR | BR / ST / AC | NFR / TC | SC / WF / G |
|----|------|----|--------------|----------|-------------|
| AD-01 | 시스템 구성 | PR-05, PR-08, PR-32~35, PR-37, PR-41 | - | NFR-01~05, NFR-10, NFR-11, NFR-14, TC-02~06 | U-01 |
| AD-02 | FE 내부 구조 | PR-03, PR-13~16, PR-18, PR-24, PR-28, PR-37 | A-01, A-12 | NFR-08, NFR-10, TC-02, TC-03 | WF-01~08, CMP-01~05, G-08, G-12, U-02, U-03 |
| AD-03 | BE 레이어 | PR-07, PR-09~12, PR-19, PR-20, PR-34~46 | BR-01, BR-02 | NFR-05, NFR-10~14, TC-04, TC-05 | SC-00-E1~E4 |
| AD-04 | 데이터 모델 (분리 → `7-erd.md`) | PR-03, PR-04, PR-37, PR-42, PR-44, 3.1 네이밍 | BR-03, BR-05~11, BR-13, 도메인 4장 | NFR-07, NFR-09, NFR-10, TC-06 | G-05, U-05 |
| AD-05 | 배포 뷰 | PR-35, PR-45 | - | NFR-14 | U-01, U-09 |
| AD-06 | 회원가입 | PR-07, PR-11, PR-36, PR-37, PR-46 | BR-03, BR-05 | NFR-09, NFR-10, NFR-13 | SC-01, SC-01-E1·E2, WF-03, G-01, G-05 |
| AD-07 | 로그인·보호 요청·401 refresh 재시도·로그아웃 | PR-07, PR-10, PR-16, PR-36, PR-37 | BR-01, A-14 | NFR-02, NFR-03, NFR-10, R-05 | SC-02, SC-00-E1·E2, SC-10, WF-01, WF-02, G-03, G-04, G-06, U-02 |
| AD-08 | 목록 조회 | PR-03, PR-05, PR-20, PR-38, PR-43 | BR-15, ST-01~04, A-01, Q-05, AC-03, AC-04 | NFR-06, NFR-08, NFR-12 | SC-05, WF-04, G-09, U-04 |
| AD-09 | 할일 등록/수정 | PR-06, PR-10, PR-14, PR-39 | BR-08, BR-10~12, BR-17, AC-01, AC-02 | NFR-12, NFR-13 | SC-04, SC-07, WF-05, G-12 |
| AD-10 | 완료 토글 | PR-03, PR-10, PR-14 | BR-13, ST-01~04 | NFR-12 | SC-06, SC-06-E1, WF-04, G-11 |
| AD-11 | 카테고리 삭제 | PR-10, PR-11, PR-20 | BR-06, BR-09 | NFR-12 | SC-03-A2·E3, WF-08, CMP-01, G-07, G-08 |
| AD-12 | 캘린더 조회 | PR-05, PR-18, PR-28, PR-43 | BR-16, A-12, Q-03, AC-05, AC-06 | NFR-06, NFR-16 | SC-09, WF-06, G-12~14, U-03 |
| AD-13 | 앱 진입 refresh | PR-16, PR-37 | BR-01 | NFR-02, NFR-10 | SC-02-A1, SC-00-E1, WF-02, U-02, AQ-11 |

## 4. 확인 필요

### 4.1 이 문서에서 새로 발견한 사항

| ID | 내용 | 영향 다이어그램 | 관련 |
|----|------|-----------------|------|
| AQ-01 | **결정(2026-11-04)**: 로그인·회원가입 요청의 401은 공통 401 처리에서 제외하고 화면이 폼 오류로 표시한다. PR-16에 반영. v0.4에서 인증 엔드포인트 전체(login, signup, refresh, logout)로 확장(PR-16, AD-02) | AD-07 | PR-16, PR-20, SC-02-E1, G-04 |
| AQ-02 | **결정(2026-11-04)**: 409 `CONFLICT` 응답에 `fields`로 충돌 필드를 담는다. error 미들웨어가 unique 제약 이름을 필드(`email`, `name`)와 한국어 문구로 매핑한다. PR-20, PR-46에 반영 | AD-06, AD-11 | PR-21, PR-46, SC-01-E1, SC-03-E2, CMP-03 |
| AQ-03 | **결정(2026-11-04)**: 낙관적 업데이트 없이 성공 후 즉시 재조회한다. 필터와 안 맞게 된 항목은 바로 사라진다. PR-14, 시나리오 G-11·SC-06-A1, 와이어프레임 WF-04에 반영 | AD-10 | PR-14, G-11, SC-06-E1, WF-04 |
| AQ-04 | **결정(2026-11-05, FE-05)**: ±1일 등 날짜 산술은 `lib/date.ts` 안에서만 UTC 기준 `Date`로 허용하고, 어댑터의 배타적 `end` 변환도 이 함수(`addDays`)를 쓴다. (원 내용) FullCalendar는 이벤트 `end`뿐 아니라 뷰 표시 범위(`datesSet`)의 `end`도 배타적이다. PR-18은 이벤트 쪽만 언급한다. 또한 ±1일 계산은 PR-4장 체크리스트 "날짜를 `Date`로 변환하지 않는다"와 부딪히므로 `lib/date.ts` 또는 어댑터 안에서 UTC 기준 날짜 산술을 예외로 허용할지 명시 필요 | AD-02, AD-12 | PR-04, PR-18, PR-28, U-03 |
| AQ-05 | **결정(2026-11-05, BE-10)**: `GET /api/todos/calendar?from&to&today`, 양 끝 포함 최대 42일(초과·역순 400 `fields.to`), 응답 `{ items }`. (원 내용) 캘린더 조회는 기간 필수(PR-43)지만 기간 길이 상한이 없어 넓은 `from`~`to`로 사실상 전체 조회가 가능하다(NFR-06). 최대 기간 검증 여부, 엔드포인트 경로, 응답 형식(PR-20 목록 형식 `items, page, limit, total` 적용 여부) 확정 필요. 기간 겹침 인덱스는 `7-erd.md` IX-03 | AD-12 | PR-20, PR-43, NFR-06, U-04 |
| AQ-06 | **결정(2026-11-05, BE-07)**: 400 `VALIDATION_ERROR` + `fields.categoryId`, 경합 시 23503은 409 `CONFLICT`(EQ-01). (원 내용) 타인·없는 `categoryId`로 할일 등록·수정 시 응답 코드 미정(PR-10은 확인만, PR-29는 "거부"). 이 문서는 400 `VALIDATION_ERROR` + `fields.categoryId`로 잠정. 확인과 INSERT/UPDATE 사이에 카테고리가 삭제되면 FK 위반(23503)이 PR-46상 500이 되는 점도 처리 필요. DB는 복합 FK로 타인 카테고리를 거부하며 23503 처리는 `7-erd.md` EQ-01 | AD-09 | PR-10, PR-29, PR-46, NFR-12 |
| AQ-07 | **결정(2026-11-05, BE-02)**: route는 `db.js`의 `checkConnection()` 헬퍼만 호출하는 예외로 둔다(PR-45). (원 내용) `GET /health`의 `SELECT 1`은 route가 DB에 직접 접근하는 형태라 PR-09(routes의 `pg` 직접 사용 금지)와 충돌한다. 헬스체크만 예외로 둘지, `db.js` 헬퍼 호출로 볼지 명시 필요 | AD-03 | PR-09, PR-45 |
| AQ-08 | **결정: `7-erd.md` 7.1 참조** (`id` 보조 정렬 추가, total은 별도 COUNT로 결정, BE-08). (원 내용) Q-05 정렬(종료일자, 생성일시)만으로는 동률이 생길 수 있어 OFFSET 페이지네이션에서 행이 중복·누락될 수 있다. `id` 보조 정렬 추가 여부, `total` 집계 방식(별도 COUNT / 윈도 함수) 확인 필요 | AD-08 | Q-05, NFR-02, NFR-06 |
| AQ-09 | **결정(2026-11-05, BE-07·BE-09)**: 쓰기·단건 응답에 `status` 없음, 재조회로 표시. (원 내용) 쓰기 요청(등록·수정·토글)에는 `today`가 없어(PR-05는 조회만) 응답에 상태를 붙일 수 없다. 응답에서 상태를 빼고 재조회로 표시하는 것으로 잠정 | AD-09, AD-10 | PR-03, PR-05 |
| AQ-10 | **결정(2026-11-05, BE-07·BE-09)**: 수정 `PUT /api/todos/:id`(`isCompleted` 포함 시 400), 토글 `PATCH /api/todos/:id { isCompleted }`만. (원 내용) 할일 수정과 완료 토글의 API 형태 미정: 수정에서 `isCompleted` 변경 허용 여부(편집 화면에 토글 없음 G-16), 토글 전용 경로 vs 공용 PATCH, PUT/PATCH 선택 | AD-09, AD-10 | PR 3.1 API 경로, G-16, BR-13, BR-17 |
| AQ-11 | **결정(2026-11-04)**: FE의 JWT `exp` 확인 대신 AD-13 흐름으로 대체한다. access token은 메모리에만 있으므로 앱 진입 시 refresh token으로 refresh를 먼저 호출하고, 성공 시 보호 화면·실패 시 로그인 화면. 판정 중 보호 화면을 렌더하지 않는다. (원 내용) FE 인증 가드는 토큰 유무만 알 수 있어, 만료 토큰으로 재방문하면 보호 화면이 잠깐 보인 뒤 첫 요청 401로 로그인 이동한다. SC-02-A1의 "유효한 토큰" 판정 방법(클라이언트 `exp` 확인 여부) 확인 필요 | AD-02, AD-07, AD-13 | SC-02-A1, PR-16, U-02 |
| AQ-12 | **결정: `7-erd.md` 7.1 참조** (`bigint identity`, 복합 FK로 소유자 일치 강제, service 확인 유지). (원 내용) 식별자 타입(bigint identity / uuid), 할일의 카테고리가 같은 사용자 소유임을 DB 복합 FK로도 강제할지(현재는 service 확인만, PR-10) 후속 DB 설계 문서에서 확정 필요 | AD-04 | PR-10, NFR-07, NFR-12 |

### 4.2 다이어그램에 반영한 기존 미결 사항 (재정의하지 않음)

| 기존 ID | 다이어그램 표시 |
|---------|------------------|
| U-01 배포 환경·HTTPS 종단 | AD-01 "호스팅 미정", AD-05 후보 A(잠정)/B |
| U-02 토큰 저장 위치 | **결정**: AD-02 authStore access 메모리·refresh localStorage, AD-07, AD-13 |
| U-03 캘린더 라이브러리 | **결정**: FullCalendar 6.1.22, AD-02 어댑터, AD-12 |
| U-04 today·상태 필터 파라미터 형식 | **결정**: AD-08, AD-12 쿼리 파라미터. 형식은 `9-api-spec.md` 4장 |
| U-05 / G-05 길이·비밀번호 규칙·이메일 대소문자 | **결정**: `validators/common.js` `LIMITS`(`9-api-spec.md` 4장), AD-06 검증 분기 |
| U-09 실행 방식 | **결정**: 로컬 설치(DB-01), AD-05 주석 |
| G-01 자동 로그인 | AD-06 가입 성공 시 토큰 쌍 발급 |
| G-03 만료 시 입력 비보존 | AD-07 3) refresh 401 분기 |
| G-06 비밀번호 변경 후 토큰 | **결정**: AD-07 하단 비밀번호 변경 설명(전체 refresh 폐기 + 새 발급) |
| G-11 필터 중 토글 | AD-10, AQ-03 |
