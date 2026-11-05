import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { config } from '../src/config.js';
import { pool } from './helpers.js';

after(() => pool.end());

// PR-35: 개발·운영 모두 FE가 BE를 직접 호출하므로 CORS_ORIGIN 출처만 허용한다 (test.env에 2개)
test('CORS_ORIGIN은 쉼표로 나눠 공백을 제거한 목록이다', () => {
  assert.deepEqual(config.corsOrigins, ['http://localhost:5173', 'http://127.0.0.1:5173']);
});

test('PR-35: 허용 출처 preflight → 204, Authorization 헤더·PATCH 허용', async () => {
  for (const origin of config.corsOrigins) {
    const res = await request(app)
      .options('/api/todos/1')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    assert.equal(res.status, 204);
    assert.equal(res.headers['access-control-allow-origin'], origin);
    assert.match(res.headers['access-control-allow-methods'], /PATCH/);
    assert.match(res.headers['access-control-allow-headers'], /authorization/i);
  }
});

test('PR-35: 허용 출처의 실제 요청 응답에 Allow-Origin, 다른 출처에는 없음', async () => {
  const allowed = await request(app).get('/health').set('Origin', config.corsOrigins[1]);
  assert.equal(allowed.headers['access-control-allow-origin'], config.corsOrigins[1]);

  const other = await request(app).get('/health').set('Origin', 'http://evil.example');
  assert.equal(other.headers['access-control-allow-origin'], undefined);
});
