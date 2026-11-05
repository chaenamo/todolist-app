# TodoList API 명세

## 버전 이력

| 버전 | 일자 | 작성자 | 상태 | 비고 |
|------|------|--------|------|------|
| v0.1 | 2026-11-04 | chaenamo | 초안 | 최초 작성 |
| v0.2 | 2026-11-05 | chaenamo | 초안 | 헬스체크 응답에 DB 연결 상태(`db`) 추가 |
| v0.3 | 2026-11-05 | chaenamo | 초안 | 구현 완료 현황 추가 |
| v0.4 | 2026-11-05 | chaenamo | 초안 | 에러 문구 다국어(`Accept-Language`, BE-13) |

## 변경 이력

| 버전 | 일자 | 변경 섹션 | 변경 내용 | 변경자 |
|------|------|-----------|-----------|--------|
| v0.1 | 2026-11-04 | 전체 | `8-plan.md` BE-01 잠정 표와 `backend/swagger.yaml` v0.2 기준으로 엔드포인트 19개, 인증, 공통 형식, 결정 사항 최초 작성 | chaenamo |
| v0.2 | 2026-11-05 | 3.1, 4 | `GET /health` 응답에 DB 연결 상태 필드 `db` 추가: 200 `{ status: "ok", db: "connected" }`, 503 `{ status: "unavailable", db: "disconnected" }` | chaenamo |
| v0.3 | 2026-11-05 | 5(신규) | BE-01~12 완료에 맞춰 5장 "구현 현황" 추가: 19개 구현 완료, 검증 테스트, Swagger UI, CORS 출처 규칙. 계약 변경 없음 | chaenamo |
| v0.4 | 2026-11-05 | 1.1 | 에러 `message`·`fields` 값이 `Accept-Language`(ko/ja/en, 기본 ko)를 따른다(BE-13). `code`·상태·필드 키 변경 없음 | chaenamo |

> 기준 문서: `docs/5-project-principle.md` (v0.4), `docs/6-arch-diagram.md` (v0.5), `docs/7-erd.md` (v0.3), `docs/8-plan.md` (v0.3), `backend/swagger.yaml` (v0.4).
> 기준 문서 ID(BR, AC, PR, AQ, EQ, G, U, PQ 등)는 **참조만** 하며 재정의하지 않는다. 이 문서는 새 ID를 만들지 않는다.
> 스키마 세부(필드 제약·예시 전체)는 `backend/swagger.yaml`이 기계 판독용 원본이다. 개발 환경(`npm run dev`)에서는 `http://localhost:3000/api-docs`에서 Swagger UI로 볼 수 있다(운영 환경에는 열지 않음). 이 문서와 swagger가 다르면 둘을 함께 고친다.

## 1. 공통 형식

- 기본 URL: 로컬 `http://localhost:3000`. 모든 API는 `/api` 하위, 헬스체크만 `/health`.
- JSON 필드는 **camelCase**(PR-20). 성공 응답은 래핑 없이 데이터 그대로.
- 날짜(`startDate`, `endDate`, `today`, `from`, `to`): `YYYY-MM-DD` 문자열, 실제 존재하는 날짜만(`2026-02-30` 거부), 타임존 변환 없음(PR-04).
- 일시(`createdAt`, `updatedAt`, `completedAt`): ISO 8601 문자열.
- id: JSON **number**(PQ-03).
- 목록: 할일 목록만 `{ items, page, limit, total }`, 페이지 없는 목록(카테고리·캘린더)은 `{ items }`.
- 타인 소유 할일·카테고리는 존재 여부를 숨기고 404(NFR-12, PR-10).
- `:id`가 양의 정수가 아니면 400 `VALIDATION_ERROR`.

### 1.1 에러 응답 (PR-20, PR-46)

| 코드 | 상태 | 용도 |
|------|------|------|
| `VALIDATION_ERROR` | 400 | 입력 검증 실패. 필드 오류면 `fields` |
| `FORBIDDEN_OPERATION` | 400 | '기본' 카테고리 변경·삭제(BR-06) |
| `UNAUTHORIZED` | 401 | 토큰 없음·무효·만료, 로그인 실패, refresh 실패 |
| `NOT_FOUND` | 404 | 없음·타인 소유·미등록 경로 |
| `CONFLICT` | 409 | 이메일·카테고리 이름 중복(`fields` 있음), 경합 FK 위반(`fields` 없음, EQ-01) |
| `INTERNAL` | 500 | 그 외. 내부 정보 없는 일반 문구 |

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해 주세요",
    "fields": { "endDate": "종료일자는 시작일자 이후여야 합니다" }
  }
}
```

`message`는 화면에 그대로 보여 줄 문구(PR-21). `fields`의 키는 요청 필드명이다.

**언어(BE-13)**: `message`와 `fields`의 값은 요청 헤더 `Accept-Language`에 따라 한국어(`ko`)·일본어(`ja`)·영어(`en`)로 내려간다. q 값이 가장 큰 지원 언어를 쓰고, 헤더가 없거나 지원 언어가 없으면 한국어. `code`·HTTP 상태·`fields`의 키는 언어와 무관하다. 번역 표는 `backend/src/i18n.js` 한 곳.

### 1.2 엔터티 JSON

User (어떤 응답에도 비밀번호 해시 없음, PR-36)

```json
{ "id": 1, "email": "user@example.com", "name": "홍길동", "createdAt": "2026-11-04T09:00:00.000Z" }
```

Category

```json
{ "id": 2, "name": "업무", "isDefault": false }
```

Todo (쓰기·단건 조회 응답, `status` 없음 — AQ-09)

```json
{
  "id": 11,
  "categoryId": 2,
  "title": "발표 준비",
  "description": "슬라이드 20장",
  "startDate": "2026-11-13",
  "endDate": "2026-11-16",
  "isCompleted": false,
  "completedAt": null,
  "createdAt": "2026-11-04T09:20:00.000Z",
  "updatedAt": "2026-11-04T09:20:00.000Z"
}
```

할일 목록 응답 (`GET /api/todos`, 각 항목 = Todo + `status`)

```json
{
  "items": [
    {
      "id": 10, "categoryId": 2, "title": "보고서", "description": null,
      "startDate": "2026-11-10", "endDate": "2026-11-12",
      "isCompleted": false, "completedAt": null,
      "createdAt": "2026-11-04T09:10:00.000Z", "updatedAt": "2026-11-04T09:10:00.000Z",
      "status": "OVERDUE"
    }
  ],
  "page": 1,
  "limit": 50,
  "total": 1
}
```

### 1.3 할일 상태 값 (원칙 3.1, PR-03)

`status` 응답 값과 `status` 필터 값은 `NOT_STARTED, IN_PROGRESS, COMPLETED, OVERDUE` 4개뿐이다. 판정 순서: 완료 → 기한 초과 → 진행 중 → 시작 전.

| 값 | 조건 (`today` 기준) |
|----|---------------------|
| `COMPLETED` | `isCompleted = true` |
| `OVERDUE` | 미완료, `today > endDate` |
| `IN_PROGRESS` | 미완료, `startDate <= today <= endDate` |
| `NOT_STARTED` | 미완료, `today < startDate` |

## 2. 인증 (PR-16, PR-37, NFR-10)

- **Access token**: JWT **HS384**, 만료 **15분**(`ACCESS_TOKEN_TTL`), claims는 `sub`(userId)·`iat`·`exp`만. `Authorization: Bearer <accessToken>` 헤더로 보낸다. 서버는 `algorithms: ['HS384']`로만 검증하므로 HS256·`alg: none` 토큰은 401.
- **Refresh token**: JWT가 아닌 불투명 무작위 문자열(32바이트 base64url), 만료 **14일**(`REFRESH_TOKEN_TTL_DAYS`), **회전 없음**(만료까지 같은 토큰 재사용). 헤더가 아니라 요청 **body** `{ "refreshToken": "…" }`로 보낸다. 서버는 SHA-256 해시만 저장한다.
- **공개 경로**: `GET /health`, `POST /api/auth/signup`, `login`, `refresh`, `logout`. 그 외 `/api/*`는 Bearer 필수.
- **클라이언트 401 규칙**: 보호 요청이 401이면 `POST /api/auth/refresh`를 **1회** 호출한다(동시 401은 refresh 1개를 공유, single-flight). 성공하면 새 access token으로 원 요청을 **1회만** 재시도하고, 재시도의 401이나 refresh의 401이면 토큰을 모두 폐기하고 로그인 화면으로 간다. 인증 엔드포인트(signup, login, refresh, logout)의 401은 이 처리에서 제외한다(AQ-01).
- 비밀번호 변경 시 그 사용자의 refresh token을 모두 폐기하고 현재 세션용 새 refresh token을 응답한다. 기존 access token은 만료까지 유효하다(G-06).

## 3. 엔드포인트 (19개)

표기: 🔓 = 공개, 그 외 Bearer 필요(없거나 무효 → 401 `UNAUTHORIZED`). 모든 엔드포인트는 500 `INTERNAL`이 날 수 있으며 표에서는 생략한다.

### 3.1 헬스체크

| # | 메서드·경로 | 요청 | 성공 | 오류 |
|---|-------------|------|------|------|
| 1 | 🔓 `GET /health` | - | 200 `{ "status": "ok", "db": "connected" }` | 503 `{ "status": "unavailable", "db": "disconnected" }`(DB `SELECT 1` 실패, PR-45) |

### 3.2 인증 (BE-05)

| # | 메서드·경로 | 요청 | 성공 | 오류 |
|---|-------------|------|------|------|
| 2 | 🔓 `POST /api/auth/signup` | `{ email, password, name }` | 201 `{ accessToken, refreshToken, user }` — 사용자 + '기본' 카테고리 + refresh token을 한 트랜잭션으로 생성(BR-05, G-01) | 400 `fields.email`·`password`·`name`, 409 `CONFLICT` `fields.email`(BR-03) |
| 3 | 🔓 `POST /api/auth/login` | `{ email, password }` | 200 `{ accessToken, refreshToken, user }` — 그 사용자의 만료 refresh 행 정리 | 400, 401 "이메일 또는 비밀번호가 올바르지 않습니다"(미가입·불일치 구분 없음, G-04) |
| 4 | 🔓 `POST /api/auth/refresh` | `{ refreshToken }` | 200 `{ accessToken }` (새 refresh token 없음, 반복 호출 200) | 400(누락·문자열 아님), 401(없음·만료·폐기) |
| 5 | 🔓 `POST /api/auth/logout` | `{ refreshToken }` | 204 (해당 행 삭제, 없어도 204, 멱등 A-14) | 400(누락·문자열 아님) |

### 3.3 내 정보 (BE-11)

| # | 메서드·경로 | 요청 | 성공 | 오류 |
|---|-------------|------|------|------|
| 6 | `GET /api/users/me` | - | 200 `User` | 401 |
| 7 | `PATCH /api/users/me` | `{ name }`만 허용 | 200 `User` (이름 trim 저장) | 400 `fields.name`(공백·길이), 400 `name` 외 필드(예: `email`, A-06), 401 |
| 8 | `PUT /api/users/me/password` | `{ currentPassword, newPassword }` | 200 `{ refreshToken }` (G-06) | 400 `fields.currentPassword`(불일치, PQ-02), 400 `fields.newPassword`(규칙, G-05), 401 |

### 3.4 카테고리 (BE-06, BE-12)

| # | 메서드·경로 | 요청 | 성공 | 오류 |
|---|-------------|------|------|------|
| 9 | `GET /api/categories` | - | 200 `{ items: Category[] }` ('기본' 먼저, 이후 이름순) | 401 |
| 10 | `POST /api/categories` | `{ name }` | 201 `Category` (이름 trim, BR-07) | 400 `fields.name`, 401, 409 `fields.name`(중복) |
| 11 | `PATCH /api/categories/:id` (Should) | `{ name }` | 200 `Category` | 400 `fields.name`, 400 `FORBIDDEN_OPERATION`('기본', BR-06), 401, 404, 409 `fields.name` |
| 12 | `DELETE /api/categories/:id` (Should) | - | 204 (소속 할일을 '기본'으로 이동 후 삭제, BR-09) | 400 `FORBIDDEN_OPERATION`, 401, 404, 409(경합, `fields` 없음, EQ-01) |

### 3.5 할일 (BE-07~BE-10)

| # | 메서드·경로 | 요청 | 성공 | 오류 |
|---|-------------|------|------|------|
| 13 | `GET /api/todos` | 쿼리 `today`(필수), `categoryId`, `status`(쉼표 구분), `page`, `limit` | 200 `{ items(+status), page, limit, total }` 정렬 `endDate → createdAt → id` | 400(`today` 누락·형식, 목록 밖 `status`, `page`·`limit` 0·음수·숫자 아님), 401 |
| 14 | `GET /api/todos/calendar` | 쿼리 `from`, `to`, `today`(모두 필수) | 200 `{ items(+status) }` 정렬 `startDate → id` | 400(`from > to`, 43일 이상, 누락·형식), 401 |
| 15 | `GET /api/todos/:id` | - | 200 `Todo` (`status` 없음) | 400(id), 401, 404 |
| 16 | `POST /api/todos` | `{ title, description?, categoryId?, startDate, endDate }` | 201 `Todo` | 400 `fields.title`·`startDate`·`endDate`·`categoryId`·`description`, 400 정의되지 않은 필드, 401, 409(경합) |
| 17 | `PUT /api/todos/:id` | 등록과 같은 필드(전체 교체). `isCompleted` 불가 | 200 `Todo` (완료 필드 유지, `updatedAt` 갱신) | 400(등록과 동일 + `isCompleted` 포함 시), 401, 404, 409(경합) |
| 18 | `PATCH /api/todos/:id` | `{ isCompleted }`만 | 200 `Todo` (`completedAt` = 완료 시 현재 일시, 취소 시 `null`, BR-13) | 400(다른 필드·boolean 아님), 401, 404 |
| 19 | `DELETE /api/todos/:id` | - | 204 | 400(id), 401, 404 |

할일 입력 규칙 (등록·수정 공용, BR-17)

| 필드 | 규칙 | 오류 키 |
|------|------|---------|
| `title` | 필수, trim 후 1~100자 (BR-10, EQ-03) | `title` |
| `description` | 선택, 최대 1,000자. 생략·`null`이면 비움 | `description` |
| `categoryId` | 선택, 양의 정수. 생략·`null`이면 '기본'(BR-08). 타인·없는 id → 400 (AQ-06) | `categoryId` |
| `startDate` | 필수, 실제 날짜. 과거 허용(BR-12) | `startDate` |
| `endDate` | 필수, 실제 날짜, `endDate >= startDate`(같은 날 허용, BR-11, AC-02) | `endDate` |

## 4. 결정 사항

`8-plan.md` 7장의 잠정 기본값을 이 계약의 결정으로 채택한다.

| ID | 결정 |
|----|------|
| U-04 | 목록 쿼리: `today=YYYY-MM-DD`(필수), `status=NOT_STARTED,IN_PROGRESS`(쉼표 구분, 상태 간 OR, 목록 밖 값 → 400), `categoryId`(단일, 상태와 AND), `page`(1부터, 기본 1), `limit`(기본 50, 100 초과는 100으로 절삭, 0·음수·숫자 아님 → 400). 타인 `categoryId` 필터는 빈 결과(`total = 0`). `status=`(빈 값)은 필터 없음, `status`를 반복 키(`status=A&status=B`)로 보내면 400(쉼표 구분만 허용) |
| AQ-05 | 캘린더: `GET /api/todos/calendar?from&to&today`, 양 끝 포함 기간 최대 42일, 응답 `{ items }`(페이지 없음), `/api/todos/:id`보다 먼저 매칭 |
| AQ-06 | 타인·없는 `categoryId`로 할일 등록·수정 → 400 `VALIDATION_ERROR` + `fields.categoryId` "카테고리를 찾을 수 없습니다" |
| AQ-09 | 쓰기(POST·PUT·PATCH)·단건 조회 응답에 `status` 없음. 클라이언트는 재조회로 상태를 표시 |
| AQ-10 | 수정은 `PUT /api/todos/:id`(`isCompleted` 포함 시 400), 완료 토글은 `PATCH /api/todos/:id { isCompleted }`만 |
| EQ-01 | 경합으로 인한 23503(`fk_todos_category_owner`) → 409 `CONFLICT`, `fields` 없음, 문구 "다른 변경과 충돌했습니다. 다시 시도해 주세요". 잠금 미도입 |
| G-05 | 이메일 형식·최대 254자·대소문자 구분(입력값 그대로 저장·비교), 비밀번호 8~72자, 이름 trim 후 1~50자, 카테고리 이름 trim 후 1~30자, 제목 trim 후 1~100자, 설명 최대 1,000자 |
| PQ-02 | 비밀번호 변경 시 현재 비밀번호 불일치 → 400 `VALIDATION_ERROR` + `fields.currentPassword`(401이면 클라이언트 공통 401 처리로 로그아웃되므로). 이때 refresh token은 삭제하지 않음 |
| PQ-03 | `bigint` id·건수는 JSON number로 직렬화(2^53 미만 가정) |

이 문서에서 함께 정한 세부 (swagger v0.2에 반영)

- `PATCH /api/users/me`: `name` 외 필드가 있으면 400 `VALIDATION_ERROR`(이메일 변경 불가 A-06, 할일 입력의 미허용 필드 처리 AQ-10과 같은 방식).
- `GET /health` 본문: 200 `{ "status": "ok", "db": "connected" }`, 503 `{ "status": "unavailable", "db": "disconnected" }`(v0.2에서 `db` 추가).

## 5. 구현 현황

19개 엔드포인트를 모두 구현했다(BE-02, BE-05~BE-12, 2026-11-05). 이 문서와 `backend/swagger.yaml`(v0.4)이 구현과 일치한다.

| 확인 수단 | 내용 |
|-----------|------|
| `backend/test/*.test.js` | 엔드포인트별 정상·검증 오류·401·타인 소유 404·트랜잭션 롤백·경합 테스트 |
| `backend/test/scenarios.test.js` | 사용자 시나리오 SC-00~SC-11 흐름을 API 호출만으로 재현 |
| `backend/test/apiDocs.test.js` | `swagger.yaml` 파싱·엔드포인트 19개 확인 |
| `GET /api-docs` | 개발 환경(`NODE_ENV=development`)에서만 Swagger UI 제공 |

브라우저 호출은 개발·운영 모두 CORS로 한다. 서버는 필수 환경변수 `CORS_ORIGIN`(쉼표로 여러 출처, `*` 금지)에 지정한 출처만 허용한다(PR-35).
