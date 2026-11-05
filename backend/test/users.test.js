import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { getMe, updateMe, changePassword } from '../src/services/userService.js';
import { validateUpdateMe, validateChangePassword } from '../src/validators/user.js';
import { pool, resetDb, createUserAndToken, bearer } from './helpers.js';

const PASSWORD = 'password1234';
const NEW_PASSWORD = 'newpassword5678';

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

const getUserRow = async (id) =>
  (await pool.query('SELECT email, name, password_hash FROM users WHERE id = $1', [id])).rows[0];
const countTokens = async () =>
  Number((await pool.query('SELECT COUNT(*) AS c FROM refresh_tokens')).rows[0].c);

const patchMe = (token, body) => request(app).patch('/api/users/me').set(bearer(token)).send(body);
const changePw = (token, body) =>
  request(app).put('/api/users/me/password').set(bearer(token)).send(body);
const refresh = (refreshToken) => request(app).post('/api/auth/refresh').send({ refreshToken });
const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

// 400 VALIDATION_ERROR와 fields 키 확인
function assertValidation(res, field) {
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.ok(res.body.error.fields[field], JSON.stringify(res.body));
}

// ---------- 내 정보 조회 ----------

test('PR-36: GET /api/users/me → 200 {id,email,name,createdAt}만, 해시 없음', async () => {
  const me = await createUserAndToken({ email: 'me@test.example' });
  const res = await request(app).get('/api/users/me').set(bearer(me.accessToken));
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body).sort(), ['createdAt', 'email', 'id', 'name']);
  assert.deepEqual(res.body, JSON.parse(JSON.stringify(me.user))); // createdAt은 JSON에서 ISO 문자열
  assert.doesNotMatch(JSON.stringify(res.body), /passwordHash|password_hash|\$2b\$/);
});

test('GET /api/users/me 토큰 없음 → 401', async () => {
  const res = await request(app).get('/api/users/me');
  assert.equal(res.status, 401);
});

test('getMe·updateMe·changePassword: 없는 사용자 → 404 AppError', async () => {
  await assert.rejects(getMe(999999), (err) => err.status === 404);
  await assert.rejects(updateMe(999999, { name: '이름' }), (err) => err.status === 404);
  await assert.rejects(
    changePassword(999999, { currentPassword: 'password1234', newPassword: 'newpass1234' }),
    (err) => err.status === 404,
  );
});

// ---------- 이름 수정 ----------

test('SC-10-E2: PATCH 이름 앞뒤 공백 trim 저장 → 200 User', async () => {
  const me = await createUserAndToken();
  const res = await patchMe(me.accessToken, { name: '  새이름 ' });
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body).sort(), ['createdAt', 'email', 'id', 'name']);
  assert.equal(res.body.name, '새이름');
  assert.equal((await getUserRow(me.user.id)).name, '새이름');
});

test('SC-10-E2: 이름 50자 → 200 (경계)', async () => {
  const me = await createUserAndToken();
  const res = await patchMe(me.accessToken, { name: '가'.repeat(50) });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, '가'.repeat(50));
});

test('SC-10-E2: 공백·빈·51자·누락 이름 → 400 fields.name, 이름 불변', async () => {
  const me = await createUserAndToken();
  for (const body of [{ name: '   ' }, { name: '' }, { name: 'a'.repeat(51) }, {}]) {
    assertValidation(await patchMe(me.accessToken, body), 'name');
  }
  assert.equal((await getUserRow(me.user.id)).name, '테스터');
});

test('A-06, SC-10-E3: PATCH에 email 포함 → 400 fields.email, DB email·name 불변', async () => {
  const me = await createUserAndToken({ email: 'keep@test.example' });
  const res = await patchMe(me.accessToken, { name: '새이름', email: 'other@test.example' });
  assertValidation(res, 'email');
  const row = await getUserRow(me.user.id);
  assert.equal(row.email, 'keep@test.example');
  assert.equal(row.name, '테스터');
});

test('PATCH /api/users/me 토큰 없음 → 401', async () => {
  const res = await request(app).patch('/api/users/me').send({ name: '새이름' });
  assert.equal(res.status, 401);
});

// ---------- 비밀번호 변경 ----------

test('BR-04, SC-10-E1, PQ-02, PR-11: 현재 비밀번호 불일치 → 400 fields.currentPassword, 해시·토큰 불변', async () => {
  const me = await createUserAndToken();
  await login(me.user.email, PASSWORD); // 다른 기기 토큰
  const before = await getUserRow(me.user.id);
  const tokensBefore = await countTokens();

  const res = await changePw(me.accessToken, {
    currentPassword: 'wrongpassword',
    newPassword: NEW_PASSWORD,
  });
  assertValidation(res, 'currentPassword');
  assert.equal((await getUserRow(me.user.id)).password_hash, before.password_hash);
  assert.equal(await countTokens(), tokensBefore);
  assert.equal((await refresh(me.refreshToken)).status, 200);
});

test('PQ-02: currentPassword 누락 → 400 fields.currentPassword, 해시 불변', async () => {
  const me = await createUserAndToken();
  const before = await getUserRow(me.user.id);
  assertValidation(await changePw(me.accessToken, { newPassword: NEW_PASSWORD }), 'currentPassword');
  assert.equal((await getUserRow(me.user.id)).password_hash, before.password_hash);
});

test('G-05: 새 비밀번호 규칙 위반(7자·73바이트·누락) → 400 fields.newPassword', async () => {
  const me = await createUserAndToken();
  const before = await getUserRow(me.user.id);
  for (const newPassword of ['short77', 'a'.repeat(73), '가'.repeat(25), undefined]) {
    const res = await changePw(me.accessToken, { currentPassword: PASSWORD, newPassword });
    assertValidation(res, 'newPassword');
  }
  assert.equal((await getUserRow(me.user.id)).password_hash, before.password_hash);
});

test('BR-04: 변경 성공 200 {refreshToken}만, 새 비밀번호 로그인 200·옛 비밀번호 401', async () => {
  const me = await createUserAndToken();
  const res = await changePw(me.accessToken, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body), ['refreshToken']);
  assert.equal(typeof res.body.refreshToken, 'string');

  assert.equal((await login(me.user.email, NEW_PASSWORD)).status, 200);
  assert.equal((await login(me.user.email, PASSWORD)).status, 401);
});

test('G-06: 변경 전 모든 refresh token(다른 기기 포함) → 401, 새 토큰 → 200, 행은 1개', async () => {
  const me = await createUserAndToken();
  const other = await login(me.user.email, PASSWORD); // 두 번째 기기
  assert.equal(other.status, 200);

  const res = await changePw(me.accessToken, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
  assert.equal(res.status, 200);
  const { rows } = await pool.query('SELECT COUNT(*) AS c FROM refresh_tokens WHERE user_id = $1', [
    me.user.id,
  ]);
  assert.equal(Number(rows[0].c), 1);

  assert.equal((await refresh(me.refreshToken)).status, 401);
  assert.equal((await refresh(other.body.refreshToken)).status, 401);
  assert.equal((await refresh(res.body.refreshToken)).status, 200);
});

test('G-06: 변경 직후 기존 access token으로 GET /api/users/me → 200', async () => {
  const me = await createUserAndToken();
  await changePw(me.accessToken, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
  const res = await request(app).get('/api/users/me').set(bearer(me.accessToken));
  assert.equal(res.status, 200);
  assert.equal(res.body.id, me.user.id);
});

test('BR-02: 다른 사용자의 refresh token은 비밀번호 변경의 영향을 받지 않는다', async () => {
  const me = await createUserAndToken();
  const stranger = await createUserAndToken();
  await changePw(me.accessToken, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
  assert.equal((await refresh(stranger.refreshToken)).status, 200);
});

test('PUT /api/users/me/password 토큰 없음 → 401', async () => {
  const res = await request(app)
    .put('/api/users/me/password')
    .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
  assert.equal(res.status, 401);
});

// ---------- validators 직접 호출 ----------

test('validateUpdateMe: 이름 trim 반환, 공백 이름·email 포함 → 400', () => {
  assert.deepEqual(validateUpdateMe({ name: '  새이름 ' }), { name: '새이름' });
  assert.throws(
    () => validateUpdateMe({ name: '  ' }),
    (err) => err.status === 400 && Boolean(err.fields.name),
  );
  assert.throws(
    () => validateUpdateMe({ name: '새이름', email: 'x@test.example' }),
    (err) => err.status === 400 && Boolean(err.fields.email),
  );
});

test('validateChangePassword: 정상 반환, 누락·규칙 위반 → 해당 fields', () => {
  assert.deepEqual(validateChangePassword({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD }), {
    currentPassword: PASSWORD,
    newPassword: NEW_PASSWORD,
  });
  assert.throws(
    () => validateChangePassword({ newPassword: NEW_PASSWORD }),
    (err) => err.status === 400 && Boolean(err.fields.currentPassword),
  );
  assert.throws(
    () => validateChangePassword({ currentPassword: PASSWORD, newPassword: 'short' }),
    (err) => err.status === 400 && Boolean(err.fields.newPassword),
  );
});
