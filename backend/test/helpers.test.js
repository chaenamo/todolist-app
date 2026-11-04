import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool, resetDb } from './helpers.js';

after(() => pool.end());

test('PR-27: resetDb 후 네 테이블 행 수 0, 다음 INSERT id가 1부터', async () => {
  const { rows: inserted } = await pool.query(
    "INSERT INTO users (email, password_hash, name) VALUES ('a@t.test', 'x', 'A'), ('b@t.test', 'x', 'B') RETURNING id",
  );
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, 'h', now())",
    [inserted[0].id],
  );

  await resetDb();

  const { rows: counts } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM categories)
          + (SELECT COUNT(*) FROM todos) + (SELECT COUNT(*) FROM refresh_tokens) AS total`,
  );
  assert.equal(counts[0].total, 0);

  const { rows } = await pool.query(
    "INSERT INTO users (email, password_hash, name) VALUES ('c@t.test', 'x', 'C') RETURNING id",
  );
  assert.equal(rows[0].id, 1);
  await resetDb();
});
