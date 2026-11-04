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
