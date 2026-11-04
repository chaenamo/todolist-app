import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { findCategoryById, findDefaultCategory } from '../src/repositories/categoryRepository.js';
import { pool, resetDb, createUserAndToken, bearer } from './helpers.js';

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

const post = (token, body) => request(app).post('/api/categories').set(bearer(token)).send(body);
const list = (token) => request(app).get('/api/categories').set(bearer(token));

test("BR-02: 목록은 본인 카테고리만, 첫 항목은 '기본'", async () => {
  const me = await createUserAndToken();
  const other = await createUserAndToken();
  await post(other.accessToken, { name: '남의 것' });
  await post(me.accessToken, { name: '가나다' });
  await post(me.accessToken, { name: 'Alpha' });

  const res = await list(me.accessToken);
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body), ['items']);
  const names = res.body.items.map((c) => c.name);
  assert.equal(names[0], '기본');
  assert.equal(res.body.items[0].isDefault, true);
  assert.equal(names.length, 3);
  assert.ok(!names.includes('남의 것'));
  assert.deepEqual(Object.keys(res.body.items[0]).sort(), ['id', 'isDefault', 'name']);
});

test('BR-07: POST {name: "  업무  "} → 201, 저장된 이름 "업무"', async () => {
  const me = await createUserAndToken();
  const res = await post(me.accessToken, { name: '  업무  ' });
  assert.equal(res.status, 201);
  assert.equal(res.body.name, '업무');
  assert.equal(res.body.isDefault, false);
  const { rows } = await pool.query('SELECT name FROM categories WHERE id = $1', [res.body.id]);
  assert.equal(rows[0].name, '업무');
});

test('SC-03-E1: 공백만·누락·비문자열·31자 이름 → 400 fields.name', async () => {
  const me = await createUserAndToken();
  for (const body of [{ name: '   ' }, {}, { name: 42 }, { name: 'a'.repeat(31) }]) {
    const res = await post(me.accessToken, body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.fields.name);
  }
});

test('SC-03-E2: " 업무 " 재등록과 "기본" 등록 → 409 fields.name', async () => {
  const me = await createUserAndToken();
  await post(me.accessToken, { name: '업무' });
  for (const name of [' 업무 ', '기본']) {
    const res = await post(me.accessToken, { name });
    assert.equal(res.status, 409, name);
    assert.equal(res.body.error.code, 'CONFLICT');
    assert.ok(res.body.error.fields.name);
  }
});

test('CN-06: 다른 사용자는 같은 이름 "업무"를 등록할 수 있다', async () => {
  const a = await createUserAndToken();
  const b = await createUserAndToken();
  assert.equal((await post(a.accessToken, { name: '업무' })).status, 201);
  assert.equal((await post(b.accessToken, { name: '업무' })).status, 201);
});

test("findDefaultCategory·findCategoryById: 본인 것만, 없으면 null", async () => {
  const me = await createUserAndToken();
  const other = await createUserAndToken();
  const mine = await findDefaultCategory(pool, me.user.id);
  assert.equal(mine.name, '기본');
  assert.deepEqual(await findCategoryById(pool, me.user.id, mine.id), mine);
  assert.equal(await findCategoryById(pool, other.user.id, mine.id), null); // PR-10
  assert.equal(await findDefaultCategory(pool, 999999), null);
});

test('BR-01: 토큰 없이 GET·POST 모두 401', async () => {
  assert.equal((await request(app).get('/api/categories')).status, 401);
  assert.equal((await request(app).post('/api/categories').send({ name: '업무' })).status, 401);
});
