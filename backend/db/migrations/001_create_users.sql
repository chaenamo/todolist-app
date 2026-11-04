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
