import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';

after(() => pool.end());

test('PR-45: DB 정상 시 GET /health 200 { status: "ok", db: "connected" }', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok', db: 'connected' });
});

test('PR-45: 풀 접속 실패 시 GET /health 503 { status: "unavailable", db: "disconnected" }', async (t) => {
  t.mock.method(pool, 'query', async () => {
    throw new Error('connection refused');
  });
  const res = await request(app).get('/health');
  assert.equal(res.status, 503);
  assert.deepEqual(res.body, { status: 'unavailable', db: 'disconnected' });
});

test('PR-46: 미등록 경로는 404 NOT_FOUND', async () => {
  const res = await request(app).get('/nope');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('잘못된 JSON 본문은 400 VALIDATION_ERROR', async () => {
  const res = await request(app).post('/health').set('Content-Type', 'application/json').send('{bad');
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('PR-40: 요청 로그에 Authorization 헤더·본문이 없다', async (t) => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args.join(' ')));
  await request(app)
    .post('/api/auth/refresh?x=1')
    .set('Authorization', 'Bearer secret-access-token')
    .send({ refreshToken: 'secret-refresh-token' });
  const line = logs.join('\n');
  assert.match(line, /POST \/api\/auth\/refresh \d{3} /);
  assert.doesNotMatch(line, /secret-access-token|secret-refresh-token|Bearer|x=1/);
});
