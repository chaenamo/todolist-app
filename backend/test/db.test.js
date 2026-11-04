import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool, withTransaction } from '../src/db.js';

after(() => pool.end());

test("PR-42: date 컬럼은 'YYYY-MM-DD' 문자열", async () => {
  const { rows } = await pool.query("SELECT DATE '2026-11-13' AS d");
  assert.equal(rows[0].d, '2026-11-13');
});

test('PQ-03: bigint와 COUNT는 number', async () => {
  const { rows } = await pool.query('SELECT 9007199254740991::bigint AS b, COUNT(*) AS c FROM (VALUES (1), (2)) v');
  assert.equal(rows[0].b, 9007199254740991);
  assert.equal(rows[0].c, 2);
});

test('PR-11: withTransaction은 성공 시 결과를 돌려주고 실패 시 롤백한다', async () => {
  const value = await withTransaction(async (client) => (await client.query('SELECT 1 AS v')).rows[0].v);
  assert.equal(value, 1);

  await assert.rejects(
    withTransaction(async (client) => {
      await client.query('CREATE TABLE tx_probe (x int)');
      throw new Error('boom');
    }),
    /boom/,
  );
  const { rows } = await pool.query("SELECT to_regclass('public.tx_probe') AS t");
  assert.equal(rows[0].t, null);
});
