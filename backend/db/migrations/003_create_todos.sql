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
