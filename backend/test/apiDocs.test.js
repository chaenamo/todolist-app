import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';
import { loadApiSpec, mountApiDocs } from '../src/apiDocs.js';

after(() => pool.end());

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

test('swagger.yaml은 YAML·OpenAPI로 읽히고 엔드포인트 19개를 담는다 (BE-01, 9-api-spec 3장)', () => {
  const spec = loadApiSpec();
  assert.equal(spec.openapi, '3.0.3');
  const operations = Object.values(spec.paths).flatMap((item) =>
    METHODS.filter((method) => item[method]),
  );
  assert.equal(operations.length, 19);
});

test('개발 환경에서 mountApiDocs를 붙이면 /api-docs가 Swagger UI를 보여 준다', async () => {
  const devApp = express();
  mountApiDocs(devApp);
  const res = await request(devApp).get('/api-docs/');
  assert.equal(res.status, 200);
  assert.match(res.text, /swagger-ui/i);
});

test('개발 환경이 아니면(테스트 환경) /api-docs는 404', async () => {
  const res = await request(app).get('/api-docs/');
  assert.equal(res.status, 404);
});
