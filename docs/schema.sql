-- TodoList 데이터베이스 스키마 (PostgreSQL 17)
-- 근거: docs/7-erd.md v0.1 (T-01~03, CN-01~15, IX-01~03)
-- 추가: docs/7-erd.md v0.2 (T-04 refresh_tokens, CN-16~18, IX-04) - 인증 인프라 테이블, PR-37
-- 실행: psql -d <db> -v ON_ERROR_STOP=1 -f docs/schema.sql
-- 제약 이름은 error 미들웨어의 23505 → 필드 매핑(PR-46)에서 쓰이므로 바꾸지 않는다.
-- 상태(ST-01~04)는 파생 값이므로 컬럼이 없다(PR-03).

BEGIN;

-- T-01 users
CREATE TABLE users (
    id            bigint      GENERATED ALWAYS AS IDENTITY,
    email         text        NOT NULL,
    password_hash text        NOT NULL,
    name          text        NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_users                PRIMARY KEY (id),                    -- CN-01
    CONSTRAINT uq_users_email          UNIQUE (email),                      -- CN-02, BR-03 (대소문자 구분: G-05 잠정)
    CONSTRAINT ck_users_name_not_blank CHECK (btrim(name) <> '')            -- CN-03
);

-- T-02 categories
CREATE TABLE categories (
    id         bigint  GENERATED ALWAYS AS IDENTITY,
    user_id    bigint  NOT NULL,
    name       text    NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    CONSTRAINT pk_categories              PRIMARY KEY (id),                 -- CN-04
    CONSTRAINT fk_categories_user_id      FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT,                           -- CN-05, Q-01 잠정
    CONSTRAINT uq_categories_user_id_name UNIQUE (user_id, name),           -- CN-06, BR-07
    CONSTRAINT uq_categories_id_user_id   UNIQUE (id, user_id),             -- CN-07, 복합 FK 참조 대상
    CONSTRAINT ck_categories_name_trimmed
        CHECK (name <> '' AND name = btrim(name))                           -- CN-09, BR-07
);

-- CN-08: 사용자당 '기본' 카테고리 최대 1개 (BR-05, BR-06)
CREATE UNIQUE INDEX uq_categories_user_id_default
    ON categories (user_id) WHERE is_default;

-- T-03 todos
CREATE TABLE todos (
    id           bigint      GENERATED ALWAYS AS IDENTITY,
    user_id      bigint      NOT NULL,
    category_id  bigint      NOT NULL,
    title        text        NOT NULL,
    description  text,
    start_date   date        NOT NULL,
    end_date     date        NOT NULL,
    is_completed boolean     NOT NULL DEFAULT false,
    completed_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_todos                 PRIMARY KEY (id),                   -- CN-10
    CONSTRAINT fk_todos_user_id         FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT,                           -- CN-11, Q-01 잠정
    CONSTRAINT fk_todos_category_owner  FOREIGN KEY (category_id, user_id)
        REFERENCES categories (id, user_id) ON DELETE RESTRICT,             -- CN-12, 소유자 일치 AQ-12
    CONSTRAINT ck_todos_title_not_blank CHECK (btrim(title) <> ''),         -- CN-13, BR-10
    CONSTRAINT ck_todos_date_range      CHECK (end_date >= start_date),     -- CN-14, BR-11
    CONSTRAINT ck_todos_completed_at
        CHECK (is_completed = (completed_at IS NOT NULL))                   -- CN-15, BR-13
);

-- IX-01 목록(카테고리 필터 없음): ORDER BY end_date, created_at, id (Q-05, AQ-08)
CREATE INDEX ix_todos_user_id_end_date
    ON todos (user_id, end_date, created_at, id);

-- IX-02 목록(카테고리 필터), BR-09 이동, CN-12 RESTRICT 검사
CREATE INDEX ix_todos_user_id_category_id
    ON todos (user_id, category_id, end_date, created_at, id);

-- IX-03 캘린더 기간 겹침: start_date <= $to AND end_date >= $from (BR-16)
CREATE INDEX ix_todos_user_id_start_date
    ON todos (user_id, start_date, end_date);

-- T-04 refresh_tokens: 인증 인프라 테이블(도메인 규칙과 무관). 원문 대신 SHA-256 해시만 저장(PR-37)
CREATE TABLE refresh_tokens (
    id         bigint      GENERATED ALWAYS AS IDENTITY,
    user_id    bigint      NOT NULL,
    token_hash text        NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_refresh_tokens            PRIMARY KEY (id),             -- CN-16
    CONSTRAINT fk_refresh_tokens_user_id    FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,                          -- CN-17, 세션 데이터라 사용자와 함께 삭제
    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash)           -- CN-18, refresh·logout 조회
);

-- IX-04 사용자별 전체 폐기(비밀번호 변경 G-06), 로그인 시 만료 정리
CREATE INDEX ix_refresh_tokens_user_id
    ON refresh_tokens (user_id);

COMMIT;
