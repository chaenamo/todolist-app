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
