-- DB-02 제약 검증 스크립트. 마이그레이션 001~004 적용 후 실행한다.
-- 실행: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/verify.sql
-- 전체를 BEGIN … ROLLBACK으로 감싸 데이터를 남기지 않는다. 기대와 다르면 예외로 중단된다.

SET client_encoding = 'UTF8';
BEGIN;

-- 문장이 지정한 SQLSTATE·제약 이름으로 거부되는지 확인한다
CREATE FUNCTION pg_temp.expect_violation(stmt text, want_state text, want_constraint text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    got_state text;
    got_constraint text;
BEGIN
    BEGIN
        EXECUTE stmt;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS got_state = RETURNED_SQLSTATE, got_constraint = CONSTRAINT_NAME;
        IF got_state = want_state AND got_constraint = want_constraint THEN
            RAISE NOTICE 'OK  % (%)', want_constraint, want_state;
            RETURN;
        END IF;
        RAISE EXCEPTION 'FAIL %: got % / %', want_constraint, got_state, got_constraint;
    END;
    RAISE EXCEPTION 'FAIL %: statement was accepted', want_constraint;
END $$;

-- 준비 데이터: 사용자 2명, 각자 '기본' 카테고리
INSERT INTO users (email, password_hash, name) VALUES
    ('a@verify.test', 'x', 'A'),
    ('b@verify.test', 'x', 'B');
INSERT INTO categories (user_id, name, is_default)
SELECT id, '기본', true FROM users WHERE email IN ('a@verify.test', 'b@verify.test');

-- 정상 할일은 들어가야 한다 (같은 날 시작·종료 허용)
INSERT INTO todos (user_id, category_id, title, start_date, end_date)
SELECT u.id, c.id, '정상', DATE '2026-11-04', DATE '2026-11-04'
FROM users u JOIN categories c ON c.user_id = u.id WHERE u.email = 'a@verify.test';

-- CN-02 중복 이메일
SELECT pg_temp.expect_violation(
    $q$INSERT INTO users (email, password_hash, name) VALUES ('a@verify.test', 'x', 'A2')$q$,
    '23505', 'uq_users_email');

-- CN-03 공백 이름
SELECT pg_temp.expect_violation(
    $q$INSERT INTO users (email, password_hash, name) VALUES ('c@verify.test', 'x', '   ')$q$,
    '23514', 'ck_users_name_not_blank');

-- CN-06 같은 사용자 같은 카테고리 이름
SELECT pg_temp.expect_violation(
    $q$INSERT INTO categories (user_id, name) SELECT id, '기본' FROM users WHERE email = 'a@verify.test'$q$,
    '23505', 'uq_categories_user_id_name');

-- CN-08 같은 사용자 두 번째 '기본'
SELECT pg_temp.expect_violation(
    $q$INSERT INTO categories (user_id, name, is_default) SELECT id, '기본2', true FROM users WHERE email = 'a@verify.test'$q$,
    '23505', 'uq_categories_user_id_default');

-- CN-09 앞 공백 이름
SELECT pg_temp.expect_violation(
    $q$INSERT INTO categories (user_id, name) SELECT id, ' 업무' FROM users WHERE email = 'a@verify.test'$q$,
    '23514', 'ck_categories_name_trimmed');

-- CN-14 end_date < start_date
SELECT pg_temp.expect_violation(
    $q$INSERT INTO todos (user_id, category_id, title, start_date, end_date)
       SELECT u.id, c.id, 't', DATE '2026-11-05', DATE '2026-11-04'
       FROM users u JOIN categories c ON c.user_id = u.id WHERE u.email = 'a@verify.test'$q$,
    '23514', 'ck_todos_date_range');

-- CN-12 다른 사용자(B)의 카테고리로 A의 할일
SELECT pg_temp.expect_violation(
    $q$INSERT INTO todos (user_id, category_id, title, start_date, end_date)
       SELECT (SELECT id FROM users WHERE email = 'a@verify.test'), c.id, 't', DATE '2026-11-04', DATE '2026-11-04'
       FROM categories c JOIN users u ON u.id = c.user_id WHERE u.email = 'b@verify.test'$q$,
    '23503', 'fk_todos_category_owner');

-- CN-15 완료인데 completed_at 없음
SELECT pg_temp.expect_violation(
    $q$INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed, completed_at)
       SELECT u.id, c.id, 't', DATE '2026-11-04', DATE '2026-11-04', true, NULL
       FROM users u JOIN categories c ON c.user_id = u.id WHERE u.email = 'a@verify.test'$q$,
    '23514', 'ck_todos_completed_at');

-- CN-13 공백 제목
SELECT pg_temp.expect_violation(
    $q$INSERT INTO todos (user_id, category_id, title, start_date, end_date)
       SELECT u.id, c.id, '  ', DATE '2026-11-04', DATE '2026-11-04'
       FROM users u JOIN categories c ON c.user_id = u.id WHERE u.email = 'a@verify.test'$q$,
    '23514', 'ck_todos_title_not_blank');

-- CN-18 같은 token_hash 두 번
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
SELECT id, 'hash-1', now() + interval '14 days' FROM users WHERE email = 'a@verify.test';
SELECT pg_temp.expect_violation(
    $q$INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       SELECT id, 'hash-1', now() + interval '14 days' FROM users WHERE email = 'b@verify.test'$q$,
    '23505', 'uq_refresh_tokens_token_hash');

-- CN-17 카테고리·할일 없는 사용자 삭제 시 refresh_tokens도 삭제
INSERT INTO users (email, password_hash, name) VALUES ('d@verify.test', 'x', 'D');
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
SELECT id, 'hash-d', now() + interval '14 days' FROM users WHERE email = 'd@verify.test';
DELETE FROM users WHERE email = 'd@verify.test';
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM refresh_tokens WHERE token_hash = 'hash-d') THEN
        RAISE EXCEPTION 'FAIL fk_refresh_tokens_user_id: CASCADE did not delete token';
    END IF;
    RAISE NOTICE 'OK  fk_refresh_tokens_user_id (CASCADE)';
END $$;

ROLLBACK;
