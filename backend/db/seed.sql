-- !!! 운영 DB 실행 금지 — 개발용 샘플 데이터 !!!
-- 실행: 마이그레이션 적용 후 psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed.sql
-- 사용자 2명, 공통 비밀번호(개발 전용): devpass1234  (bcrypt cost 10 해시만 저장)
-- 사용자별 '기본'·'업무' 카테고리, SC-11 할일 A·B·C(오늘 = 2026-11-13 가정), 생성 할일 200건

SET client_encoding = 'UTF8';
BEGIN;

INSERT INTO users (email, password_hash, name) VALUES
    ('dev1@example.com', '$2a$10$uEdwouIqGeiqQSes36dOK.EMTfPsqB7nmtetZIS/MYkuwun.X5Tvy', '개발자1'),
    ('dev2@example.com', '$2a$10$uEdwouIqGeiqQSes36dOK.EMTfPsqB7nmtetZIS/MYkuwun.X5Tvy', '개발자2');

INSERT INTO categories (user_id, name, is_default)
SELECT u.id, c.name, c.is_default
FROM users u
CROSS JOIN (VALUES ('기본', true), ('업무', false)) AS c(name, is_default)
WHERE u.email IN ('dev1@example.com', 'dev2@example.com');

-- SC-11 할일 A·B·C
INSERT INTO todos (user_id, category_id, title, start_date, end_date)
SELECT u.id, c.id, t.title, t.start_date, t.end_date
FROM users u
CROSS JOIN (VALUES
    ('보고서',    '업무', DATE '2026-11-10', DATE '2026-11-12'),
    ('발표 준비', '업무', DATE '2026-11-13', DATE '2026-11-16'),
    ('장보기',    '기본', DATE '2026-11-20', DATE '2026-11-20')
) AS t(title, category, start_date, end_date)
JOIN categories c ON c.user_id = u.id AND c.name = t.category
WHERE u.email IN ('dev1@example.com', 'dev2@example.com');

-- 사용자당 200건: 2026-09-01부터 하루씩, 기간 0~4일, 카테고리 번갈아, 5건 중 1건 완료
INSERT INTO todos (user_id, category_id, title, description, start_date, end_date, is_completed, completed_at)
SELECT u.id, c.id,
       '샘플 할일 ' || g,
       CASE WHEN g % 3 = 0 THEN '샘플 설명 ' || g END,
       DATE '2026-09-01' + g,
       DATE '2026-09-01' + g + g % 5,
       g % 5 = 0,
       CASE WHEN g % 5 = 0 THEN now() END
FROM users u
CROSS JOIN generate_series(1, 200) AS g
JOIN categories c ON c.user_id = u.id AND c.name = CASE WHEN g % 2 = 0 THEN '업무' ELSE '기본' END
WHERE u.email IN ('dev1@example.com', 'dev2@example.com');

COMMIT;
