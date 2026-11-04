import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { config } from '../src/config.js';
import { pool, resetDb, createUserAndToken, bearer } from './helpers.js';

const PROTECTED = '/api/users/me'; // 인증 미들웨어 뒤의 아무 보호 경로
const SIGNUP = { email: 'user@example.com', password: 'password1234', name: '홍길동' };

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const count = async (table, where = 'true', params = []) =>
  (await pool.query(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`, params)).rows[0].c;

// 테스트 DB에 INSERT 실패 트리거를 걸어 트랜잭션 롤백을 확인한다 (repository 모킹 없이, PR-27)
async function withFailingInsert(table, fn) {
  await pool.query(
    "CREATE FUNCTION inject_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END $$",
  );
  await pool.query(`CREATE TRIGGER inject_fail BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION inject_fail()`);
  try {
    await fn();
  } finally {
    await pool.query(`DROP TRIGGER inject_fail ON ${table}`);
    await pool.query('DROP FUNCTION inject_fail()');
  }
}

// ---------- 가입 ----------

test('NFR-09: 가입 201에 토큰 쌍과 user{id,email,name,createdAt}, 해시 없음', async () => {
  const res = await request(app).post('/api/auth/signup').send(SIGNUP);
  assert.equal(res.status, 201);
  assert.ok(res.body.accessToken);
  assert.ok(res.body.refreshToken);
  assert.deepEqual(Object.keys(res.body.user).sort(), ['createdAt', 'email', 'id', 'name']);
  assert.equal(res.body.user.email, SIGNUP.email);
  assert.doesNotMatch(JSON.stringify(res.body), /passwordHash|password_hash|\$2b\$/);
});

test("BR-05: 가입 직후 is_default = true '기본' 카테고리가 정확히 1개", async () => {
  const res = await request(app).post('/api/auth/signup').send(SIGNUP);
  const { rows } = await pool.query('SELECT name FROM categories WHERE user_id = $1 AND is_default', [
    res.body.user.id,
  ]);
  assert.deepEqual(rows, [{ name: '기본' }]);
});

test('PR-11: 카테고리 INSERT 실패 시 사용자 행도 남지 않는다', async (t) => {
  t.mock.method(console, 'error', () => {});
  await withFailingInsert('categories', async () => {
    const res = await request(app).post('/api/auth/signup').send(SIGNUP);
    assert.equal(res.status, 500);
  });
  assert.equal(await count('users'), 0);
});

test("AD-06: refresh token INSERT 실패 시 사용자·'기본' 카테고리 행이 남지 않는다", async (t) => {
  t.mock.method(console, 'error', () => {});
  await withFailingInsert('refresh_tokens', async () => {
    const res = await request(app).post('/api/auth/signup').send(SIGNUP);
    assert.equal(res.status, 500);
  });
  assert.equal(await count('users'), 0);
  assert.equal(await count('categories'), 0);
});

test('NFR-09: DB password_hash가 $2b$10$로 시작하고 평문과 다르다', async () => {
  await request(app).post('/api/auth/signup').send(SIGNUP);
  const { rows } = await pool.query('SELECT password_hash FROM users');
  assert.match(rows[0].password_hash, /^\$2b\$10\$/);
  assert.notEqual(rows[0].password_hash, SIGNUP.password);
});

test('BR-03: 중복 이메일 가입 → 409 CONFLICT fields.email', async () => {
  await request(app).post('/api/auth/signup').send(SIGNUP);
  const res = await request(app).post('/api/auth/signup').send({ ...SIGNUP, name: '다른 사람' });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'CONFLICT');
  assert.ok(res.body.error.fields.email);
  assert.equal(await count('users'), 1);
});

test('SC-01-E2: 필수 누락·이메일 형식·비밀번호 규칙·공백 이름 → 400 + 해당 fields', async () => {
  const cases = [
    [{}, ['email', 'name', 'password']],
    [{ ...SIGNUP, email: 'not-an-email' }, ['email']],
    [{ ...SIGNUP, password: 'short' }, ['password']],
    [{ ...SIGNUP, password: 'a'.repeat(73) }, ['password']],
    [{ ...SIGNUP, name: '   ' }, ['name']],
    [{ ...SIGNUP, email: 123 }, ['email']],
  ];
  for (const [body, fields] of cases) {
    const res = await request(app).post('/api/auth/signup').send(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.deepEqual(Object.keys(res.body.error.fields).sort(), fields, JSON.stringify(body));
  }
  assert.equal(await count('users'), 0);
});

test('본문 없이 가입 요청 → 400', async () => {
  const res = await request(app).post('/api/auth/signup');
  assert.equal(res.status, 400);
});

// ---------- 로그인 ----------

test('UC-02, G-04: 로그인 200 토큰 쌍·user, 미가입·틀린 비밀번호는 같은 401 문구', async () => {
  await createUserAndToken({ email: SIGNUP.email, password: SIGNUP.password });

  const ok = await request(app).post('/api/auth/login').send({ email: SIGNUP.email, password: SIGNUP.password });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.accessToken && ok.body.refreshToken);
  assert.deepEqual(Object.keys(ok.body.user).sort(), ['createdAt', 'email', 'id', 'name']);

  const wrongPassword = await request(app).post('/api/auth/login').send({ email: SIGNUP.email, password: 'wrongpass1' });
  const noUser = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'password1234' });
  assert.equal(wrongPassword.status, 401);
  assert.equal(noUser.status, 401);
  assert.equal(wrongPassword.body.error.code, 'UNAUTHORIZED');
  assert.deepEqual(wrongPassword.body, noUser.body);
});

test('로그인 필수 누락 → 400', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: SIGNUP.email });
  assert.equal(res.status, 400);
  assert.ok(res.body.error.fields.password);
});

test('PR-37: 로그인 시 그 사용자의 만료된 refresh 행만 삭제된다', async () => {
  const a = await createUserAndToken({ email: 'a@example.com' });
  const b = await createUserAndToken({ email: 'b@example.com' });
  const expire = "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() - interval '1 day')";
  await pool.query(expire, [a.user.id, 'a-expired']);
  await pool.query(expire, [b.user.id, 'b-expired']);

  const res = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'password1234' });
  assert.equal(res.status, 200);

  assert.equal(await count('refresh_tokens', 'token_hash = $1', ['a-expired']), 0);
  assert.equal(await count('refresh_tokens', 'token_hash = $1', [sha256(a.refreshToken)]), 1); // 만료 전 행 유지
  assert.equal(await count('refresh_tokens', 'token_hash = $1', ['b-expired']), 1); // 다른 사용자 행 유지
});

// ---------- access token / 인증 미들웨어 ----------

test('BR-01: 보호 경로에 토큰 없음·서명 불일치·만료 → 401 UNAUTHORIZED', async () => {
  const { user } = await createUserAndToken();
  const wrongKey = jwt.sign({ sub: String(user.id) }, 'x'.repeat(64), { algorithm: 'HS384' });
  const expired = jwt.sign(
    { sub: String(user.id), exp: Math.floor(Date.now() / 1000) - 10 },
    config.jwtAccessSecret,
    { algorithm: 'HS384' },
  );
  for (const headers of [{}, bearer(wrongKey), bearer(expired), { Authorization: 'Basic abc' }, bearer('garbage')]) {
    const res = await request(app).get(PROTECTED).set(headers);
    assert.equal(res.status, 401, JSON.stringify(headers));
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  }
});

test('유효한 access token은 보호 경로 인증을 통과한다', async () => {
  const { accessToken } = await createUserAndToken();
  const res = await request(app).get(PROTECTED).set(bearer(accessToken));
  assert.notEqual(res.status, 401);
});

test('PR-37: access token은 HS384, payload는 sub·iat·exp만, exp - iat = 900', async () => {
  const { accessToken, user } = await createUserAndToken();
  const { header, payload } = jwt.decode(accessToken, { complete: true });
  assert.equal(header.alg, 'HS384');
  assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'sub']);
  assert.equal(payload.sub, String(user.id));
  assert.equal(payload.exp - payload.iat, 900);
});

test('PR-37: 같은 비밀키로 HS256 서명한 토큰과 alg none 토큰은 401', async () => {
  const { user } = await createUserAndToken();
  const hs256 = jwt.sign({ sub: String(user.id) }, config.jwtAccessSecret, { algorithm: 'HS256', expiresIn: '15m' });
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: String(user.id), iat: now, exp: now + 900 })}.`;
  for (const token of [hs256, none]) {
    const res = await request(app).get(PROTECTED).set(bearer(token));
    assert.equal(res.status, 401);
  }
});

// ---------- refresh token ----------

test('R-05: DB token_hash = SHA-256(refreshToken), 원문은 DB에 없다', async () => {
  const { refreshToken } = await createUserAndToken();
  const { rows } = await pool.query('SELECT token_hash FROM refresh_tokens');
  assert.deepEqual(rows, [{ token_hash: sha256(refreshToken) }]);
  const leaked = await pool.query(
    "SELECT COUNT(*) AS c FROM refresh_tokens r WHERE r::text LIKE '%' || $1 || '%'",
    [refreshToken],
  );
  assert.equal(leaked.rows[0].c, 0);
});

test('NFR-10: refresh 행 expires_at = 발급 시각 + 14일(±1분)', async () => {
  await createUserAndToken();
  const { rows } = await pool.query(
    "SELECT abs(extract(epoch FROM expires_at - (now() + interval '14 days'))) AS diff FROM refresh_tokens",
  );
  assert.ok(Number(rows[0].diff) < 60, `diff=${rows[0].diff}`);
});

test('PR-37: refresh 200 { accessToken }만, 같은 토큰으로 다시 호출해도 200 (회전 없음)', async () => {
  const { refreshToken, user } = await createUserAndToken();
  for (let i = 0; i < 2; i += 1) {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body), ['accessToken']);
    assert.equal(jwt.verify(res.body.accessToken, config.jwtAccessSecret, { algorithms: ['HS384'] }).sub, String(user.id));
  }
});

test('SC-00-E2: 없는 refresh token과 만료된 refresh token → 401', async () => {
  const { user } = await createUserAndToken();
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() - interval '1 second')",
    [user.id, sha256('expired-token')],
  );
  for (const refreshToken of ['no-such-token', 'expired-token']) {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    assert.equal(res.status, 401, refreshToken);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  }
});

test('A-14: 로그아웃 204 후 refresh 401, 같은 토큰으로 로그아웃 재호출도 204', async () => {
  const { refreshToken } = await createUserAndToken();
  assert.equal((await request(app).post('/api/auth/logout').send({ refreshToken })).status, 204);
  assert.equal((await request(app).post('/api/auth/refresh').send({ refreshToken })).status, 401);
  assert.equal((await request(app).post('/api/auth/logout').send({ refreshToken })).status, 204);
});

test('PR-07: refresh·logout은 Authorization 없이 호출되고, refreshToken 누락·비문자열 → 400', async () => {
  const { refreshToken } = await createUserAndToken();
  const ok = await request(app).post('/api/auth/refresh').send({ refreshToken }); // Authorization 헤더 없음
  assert.equal(ok.status, 200);

  for (const path of ['/api/auth/refresh', '/api/auth/logout']) {
    for (const body of [{}, { refreshToken: 123 }, { refreshToken: '' }, { refreshToken: null }]) {
      const res = await request(app).post(path).send(body);
      assert.equal(res.status, 400, `${path} ${JSON.stringify(body)}`);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
      assert.ok(res.body.error.fields.refreshToken);
    }
  }
});
