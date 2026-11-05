// 사용자 시나리오(docs/3-user-scenario.md) 흐름을 API 호출만으로 재현한다.
// 화면 동작(이동·확인 창·입력 보존)은 FE 범위라 제외하고, 서버 응답·DB 상태만 확인한다.
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, resetDb, bearer } from './helpers.js';

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

const PASSWORD = 'password1234';
const TODAY = '2026-11-13'; // SC-11 가정

let seq = 0;
const api = (token) => ({
  get: (url) => request(app).get(url).set(bearer(token)),
  post: (url, body) => request(app).post(url).set(bearer(token)).send(body),
  put: (url, body) => request(app).put(url).set(bearer(token)).send(body),
  patch: (url, body) => request(app).patch(url).set(bearer(token)).send(body),
  del: (url) => request(app).delete(url).set(bearer(token)),
});

async function signup(overrides = {}) {
  seq += 1;
  const body = { email: `sc${seq}@test.example`, password: PASSWORD, name: '사용자', ...overrides };
  const res = await request(app).post('/api/auth/signup').send(body);
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return { ...res.body, email: body.email, api: api(res.body.accessToken) };
}

const todo = (title, startDate, endDate, extra = {}) => ({ title, startDate, endDate, ...extra });
const statusOf = (items, id) => items.find((t) => t.id === id)?.status;

test('SC-01: 가입 → 자동 로그인 토큰, 기본 카테고리 1개, 해시 저장 / E1 중복 이메일 / E2 필드 오류', async () => {
  const me = await signup({ email: 'first@test.example' });
  assert.ok(me.accessToken && me.refreshToken); // G-01 자동 로그인

  const cats = await me.api.get('/api/categories');
  assert.deepEqual(
    cats.body.items.map((c) => [c.name, c.isDefault]),
    [['기본', true]],
  );
  const todos = await me.api.get(`/api/todos?today=${TODAY}`);
  assert.equal(todos.body.items.length, 0); // 빈 목록

  const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [me.email]);
  assert.notEqual(rows[0].password_hash, PASSWORD); // NFR-09

  const dup = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'first@test.example', password: PASSWORD, name: '다른' });
  assert.equal(dup.status, 409);
  assert.ok(dup.body.error.fields.email);

  for (const [body, field] of [
    [{ password: PASSWORD, name: '이름' }, 'email'],
    [{ email: 'not-an-email', password: PASSWORD, name: '이름' }, 'email'],
    [{ email: 'ok@test.example', password: 'short', name: '이름' }, 'password'],
    [{ email: 'ok@test.example', password: PASSWORD }, 'name'],
  ]) {
    const res = await request(app).post('/api/auth/signup').send(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.ok(res.body.error.fields[field], JSON.stringify(res.body));
  }
});

test('SC-02: 로그인 → 갱신 → 로그아웃 후 보호 API 401·refresh 불가 / A1 재방문 갱신 / E1 구분 없는 실패', async () => {
  const { email } = await signup();

  const login = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  assert.equal(login.status, 200);
  const { accessToken, refreshToken } = login.body;
  assert.equal((await api(accessToken).get('/api/users/me')).status, 200);

  // 2단계·A1: refresh token으로 access token 재발급 후 작업 계속
  const refreshed = await request(app).post('/api/auth/refresh').send({ refreshToken });
  assert.equal(refreshed.status, 200);
  assert.equal(
    (await api(refreshed.body.accessToken).get('/api/todos?today=' + TODAY)).status,
    200,
  );

  // 3단계: 로그아웃 → 서버에서 refresh token 폐기
  const logout = await request(app).post('/api/auth/logout').send({ refreshToken });
  assert.equal(logout.status, 204);
  assert.equal((await request(app).post('/api/auth/refresh').send({ refreshToken })).status, 401);

  // 사후 조건: 인증 없는 요청은 401
  assert.equal((await request(app).get('/api/todos?today=' + TODAY)).status, 401);

  // E1: 미가입 이메일과 비밀번호 불일치는 같은 응답
  const wrongPw = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'wrongpass99' });
  const noUser = await request(app)
    .post('/api/auth/login')
    .send({ email: 'nobody@test.example', password: PASSWORD });
  assert.equal(wrongPw.status, 401);
  assert.equal(noUser.status, 401);
  assert.deepEqual(wrongPw.body, noUser.body);
});

test('SC-03: 카테고리 등록 trim → 할일 선택·필터에 사용 / A1 이름 변경 / A2 삭제 시 기본으로 이동 / E1~E3', async () => {
  const me = await signup();
  const created = await me.api.post('/api/categories', { name: '  업무 ' });
  assert.equal(created.status, 201);
  assert.equal(created.body.name, '업무');
  const workId = created.body.id;

  const t = await me.api.post(
    '/api/todos',
    todo('보고서', '2026-11-10', '2026-11-12', { categoryId: workId }),
  );
  assert.equal(t.status, 201);
  const filtered = await me.api.get(`/api/todos?today=${TODAY}&categoryId=${workId}`);
  assert.deepEqual(
    filtered.body.items.map((i) => i.id),
    [t.body.id],
  );

  // A1: 이름 변경 후 소속 할일 유지
  const renamed = await me.api.patch(`/api/categories/${workId}`, { name: ' 회사 ' });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.name, '회사');
  assert.equal((await me.api.get(`/api/todos/${t.body.id}`)).body.categoryId, workId);

  // E1·E2
  assert.ok((await me.api.post('/api/categories', { name: '   ' })).body.error.fields.name);
  for (const name of [' 회사 ', '기본']) {
    assert.equal((await me.api.post('/api/categories', { name })).status, 409, name);
  }

  // E3: '기본' 변경·삭제 거부
  const cats = (await me.api.get('/api/categories')).body.items;
  const defaultId = cats.find((c) => c.isDefault).id;
  assert.equal((await me.api.patch(`/api/categories/${defaultId}`, { name: 'x' })).status, 400);
  assert.equal((await me.api.del(`/api/categories/${defaultId}`)).status, 400);

  // A2: 삭제 → 할일 수 변화 없음, '기본' 소속
  const before = (await me.api.get(`/api/todos?today=${TODAY}`)).body.total;
  assert.equal((await me.api.del(`/api/categories/${workId}`)).status, 204);
  const afterList = await me.api.get(`/api/todos?today=${TODAY}`);
  assert.equal(afterList.body.total, before);
  assert.equal(afterList.body.items[0].categoryId, defaultId);
  assert.ok(!(await me.api.get('/api/categories')).body.items.some((c) => c.id === workId));
});

test('SC-04: 할일 등록 / A1 미지정→기본 / A2 하루짜리 / A3 과거 날짜 기한 초과 / E1 누락 / E2 종료<시작', async () => {
  const me = await signup();
  const defaultId = (await me.api.get('/api/categories')).body.items[0].id;

  const a1 = await me.api.post(
    '/api/todos',
    todo('장보기', '2026-11-20', '2026-11-20', { description: '우유' }),
  );
  assert.equal(a1.status, 201);
  assert.equal(a1.body.categoryId, defaultId); // AC-01
  assert.equal(a1.body.isCompleted, false);

  const past = await me.api.post('/api/todos', todo('지난 일', '2026-11-01', '2026-11-02'));
  assert.equal(past.status, 201);

  const list = (await me.api.get(`/api/todos?today=${TODAY}`)).body.items;
  assert.equal(statusOf(list, a1.body.id), 'NOT_STARTED');
  assert.equal(statusOf(list, past.body.id), 'OVERDUE'); // BR-12

  for (const field of ['title', 'startDate', 'endDate']) {
    const body = todo('제목', '2026-11-10', '2026-11-11');
    delete body[field];
    const res = await me.api.post('/api/todos', body);
    assert.equal(res.status, 400, field);
    assert.ok(res.body.error.fields[field], field);
  }

  const e2 = await me.api.post('/api/todos', todo('역순', '2026-11-12', '2026-11-10')); // AC-02
  assert.equal(e2.status, 400);
  assert.ok(e2.body.error.fields.endDate);
  assert.equal((await me.api.get(`/api/todos?today=${TODAY}`)).body.total, 2);
});

test('SC-05: 종료일 오름차순·상태 표기 / 카테고리 AND 상태 OR / 페이지 / A1 필터 해제 / A3 결과 0건', async () => {
  const me = await signup();
  const workId = (await me.api.post('/api/categories', { name: '업무' })).body.id;
  const add = async (title, s, e, categoryId) =>
    (await me.api.post('/api/todos', todo(title, s, e, categoryId ? { categoryId } : {}))).body.id;

  const late = await add('늦은 마감', '2026-11-13', '2026-11-30', workId); // 진행 중
  const overdue = await add('기한 초과', '2026-11-01', '2026-11-12', workId);
  const future = await add('시작 전', '2026-11-14', '2026-11-15', workId);
  const personal = await add('개인 기한 초과', '2026-11-01', '2026-11-05');

  const all = (await me.api.get(`/api/todos?today=${TODAY}`)).body;
  assert.deepEqual(
    all.items.map((t) => t.id),
    [personal, overdue, future, late],
  );
  assert.equal(statusOf(all.items, late), 'IN_PROGRESS'); // AC-03 경계: 시작일=오늘
  assert.equal(statusOf(all.items, overdue), 'OVERDUE'); // AC-03 경계: 종료일=어제

  // AC-04: 업무 AND (기한 초과 OR 진행 중)
  const filtered = await me.api.get(
    `/api/todos?today=${TODAY}&categoryId=${workId}&status=OVERDUE,IN_PROGRESS`,
  );
  assert.deepEqual(filtered.body.items.map((t) => t.id).sort(), [late, overdue].sort());

  // A1: 상태 미선택 → 해당 카테고리 전체
  assert.equal((await me.api.get(`/api/todos?today=${TODAY}&categoryId=${workId}`)).body.total, 3);

  // NFR-06: 페이지 이동
  const p2 = await me.api.get(`/api/todos?today=${TODAY}&limit=3&page=2`);
  assert.equal(p2.body.total, 4);
  assert.deepEqual(
    p2.body.items.map((t) => t.id),
    [late],
  );

  // A3: 필터 결과 0건
  const none = await me.api.get(`/api/todos?today=${TODAY}&categoryId=${workId}&status=COMPLETED`);
  assert.equal(none.status, 200);
  assert.deepEqual(none.body.items, []);
  assert.equal(none.body.total, 0);
});

test('SC-06: 완료 → 완료일시 기록 / 취소 → 재판정 / A1 상태 필터 재조회 시 제외 / A2 기한 초과로 재판정', async () => {
  const me = await signup();
  const id = (await me.api.post('/api/todos', todo('지난 할일', '2026-11-01', '2026-11-10'))).body
    .id;

  const done = await me.api.patch(`/api/todos/${id}`, { isCompleted: true });
  assert.equal(done.status, 200);
  assert.equal(done.body.isCompleted, true);
  assert.ok(done.body.completedAt);
  let list = (await me.api.get(`/api/todos?today=${TODAY}`)).body.items;
  assert.equal(statusOf(list, id), 'COMPLETED');

  // A1: '기한 초과' 필터 중 완료 → 재조회 결과에서 빠짐
  assert.equal((await me.api.get(`/api/todos?today=${TODAY}&status=OVERDUE`)).body.total, 0);

  // A2: 완료 취소 → 기한 초과
  const undone = await me.api.patch(`/api/todos/${id}`, { isCompleted: false });
  assert.equal(undone.body.isCompleted, false);
  assert.equal(undone.body.completedAt, null);
  list = (await me.api.get(`/api/todos?today=${TODAY}`)).body.items;
  assert.equal(statusOf(list, id), 'OVERDUE');

  // BR-13: 종료일자가 지나도 자동 완료되지 않음 (위 상태가 OVERDUE인 것으로 확인)
  // E1(서버 거부 시 상태 유지): 잘못된 바디 → 400, DB 불변
  assert.equal((await me.api.patch(`/api/todos/${id}`, { isCompleted: 'yes' })).status, 400);
  assert.equal((await me.api.get(`/api/todos/${id}`)).body.isCompleted, false);
});

test('SC-07: 수정 후 새 기간으로 재판정 / A1 완료 유지 / A2 카테고리 비움→기본 / E1 검증 / E2 타인 404 / E3 삭제된 할일 404', async () => {
  const me = await signup();
  const other = await signup();
  const workId = (await me.api.post('/api/categories', { name: '업무' })).body.id;
  const defaultId = (await me.api.get('/api/categories')).body.items.find((c) => c.isDefault).id;
  const id = (
    await me.api.post(
      '/api/todos',
      todo('보고서', '2026-11-01', '2026-11-05', { categoryId: workId }),
    )
  ).body.id;
  const completed = await me.api.patch(`/api/todos/${id}`, { isCompleted: true });

  // A1·A2 + 기본 흐름: 기간·제목 변경, 카테고리 비움
  const res = await me.api.put(
    `/api/todos/${id}`,
    todo('보고서 v2', '2026-11-13', '2026-11-20', { description: '수정' }),
  );
  assert.equal(res.status, 200);
  assert.equal(res.body.title, '보고서 v2');
  assert.equal(res.body.categoryId, defaultId);
  assert.equal(res.body.isCompleted, true);
  assert.equal(res.body.completedAt, completed.body.completedAt);

  // 완료 취소 후 새 기간 기준 재판정
  await me.api.patch(`/api/todos/${id}`, { isCompleted: false });
  const list = (await me.api.get(`/api/todos?today=${TODAY}`)).body.items;
  assert.equal(statusOf(list, id), 'IN_PROGRESS');

  // E1
  assert.equal(
    (await me.api.put(`/api/todos/${id}`, todo('', '2026-11-13', '2026-11-20'))).status,
    400,
  );
  assert.equal(
    (await me.api.put(`/api/todos/${id}`, todo('t', '2026-11-20', '2026-11-13'))).status,
    400,
  );

  // E2: 타인 할일은 존재를 드러내지 않고 404 (SC-00-E3)
  for (const r of [
    await other.api.get(`/api/todos/${id}`),
    await other.api.put(`/api/todos/${id}`, todo('탈취', '2026-11-13', '2026-11-20')),
  ]) {
    assert.equal(r.status, 404);
  }
  assert.equal((await me.api.get(`/api/todos/${id}`)).body.title, '보고서 v2');

  // E3: 다른 탭에서 삭제된 뒤 저장
  await me.api.del(`/api/todos/${id}`);
  assert.equal(
    (await me.api.put(`/api/todos/${id}`, todo('늦은 저장', '2026-11-13', '2026-11-20'))).status,
    404,
  );
});

test('SC-08: 삭제 → 목록·캘린더·단건 어디서도 조회 안 됨 / E1 이미 삭제 404 / 타인 할일 404', async () => {
  const me = await signup();
  const other = await signup();
  const id = (await me.api.post('/api/todos', todo('지울 것', '2026-11-10', '2026-11-14'))).body.id;

  assert.equal((await other.api.del(`/api/todos/${id}`)).status, 404); // SC-00-E3
  assert.equal((await me.api.del(`/api/todos/${id}`)).status, 204);

  assert.equal((await me.api.get(`/api/todos?today=${TODAY}`)).body.total, 0);
  const cal = await me.api.get(`/api/todos/calendar?from=2026-11-01&to=2026-11-30&today=${TODAY}`);
  assert.deepEqual(cal.body.items, []);
  assert.equal((await me.api.get(`/api/todos/${id}`)).status, 404);
  assert.equal((await me.api.del(`/api/todos/${id}`)).status, 404); // E1
});

test('SC-09: 기간 겹침 조회 / A1 이전 달 시작 / A2 토요일 시작 / 완료 표시 / A4 빈 기간 / 기간 오류', async () => {
  const me = await signup();
  const add = async (title, s, e) => (await me.api.post('/api/todos', todo(title, s, e))).body.id;
  const crossMonth = await add('월 걸침', '2026-10-28', '2026-11-03'); // AC-05
  const saturday = await add('토요일 시작', '2026-11-14', '2026-11-17'); // AC-06 (11/14 = 토)
  const inside = await add('주 안', '2026-11-09', '2026-11-10');
  await add('범위 밖', '2026-12-10', '2026-12-11');
  await me.api.patch(`/api/todos/${inside}`, { isCompleted: true });

  // 11월 월간 뷰(6주 그리드 11/01~12/12 중 11월 범위)
  const month = await me.api.get(
    `/api/todos/calendar?from=2026-11-01&to=2026-11-30&today=${TODAY}`,
  );
  assert.equal(month.status, 200);
  assert.deepEqual(month.body.items.map((t) => t.id).sort(), [crossMonth, saturday, inside].sort());
  assert.equal(statusOf(month.body.items, inside), 'COMPLETED'); // Q-03 완료 구분용

  // 주간 뷰 일~토(11/08~11/14): 토요일 시작 할일 포함, 월 걸침 제외
  const week = await me.api.get(`/api/todos/calendar?from=2026-11-08&to=2026-11-14&today=${TODAY}`);
  assert.deepEqual(week.body.items.map((t) => t.id).sort(), [saturday, inside].sort());

  // 일간 뷰
  const day = await me.api.get(`/api/todos/calendar?from=2026-11-02&to=2026-11-02&today=${TODAY}`);
  assert.deepEqual(
    day.body.items.map((t) => t.id),
    [crossMonth],
  );

  // A4: 할일 없는 기간
  const empty = await me.api.get(
    `/api/todos/calendar?from=2027-01-01&to=2027-01-31&today=${TODAY}`,
  );
  assert.deepEqual(empty.body.items, []);

  // NFR-06: 기간 역순·42일 초과는 400
  for (const q of ['from=2026-11-30&to=2026-11-01', 'from=2026-11-01&to=2026-12-13']) {
    const r = await me.api.get(`/api/todos/calendar?${q}&today=${TODAY}`);
    assert.equal(r.status, 400, q);
    assert.ok(r.body.error.fields.to);
  }
});

test('SC-10: 이름 변경 / 비밀번호 변경 후 새 비밀번호만 로그인, 현재 기기 유지·다른 기기 폐기 / E1~E3', async () => {
  const me = await signup();
  const otherDevice = await request(app)
    .post('/api/auth/login')
    .send({ email: me.email, password: PASSWORD });

  const info = await me.api.get('/api/users/me');
  assert.equal(info.body.email, me.email);

  const renamed = await me.api.patch('/api/users/me', { name: ' 새 이름 ' });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.name, '새 이름');

  // E1·E2·E3
  const wrong = await me.api.put('/api/users/me/password', {
    currentPassword: 'wrongpass1',
    newPassword: 'newpass5678',
  });
  assert.equal(wrong.status, 400);
  assert.ok(wrong.body.error.fields.currentPassword);
  assert.equal((await me.api.patch('/api/users/me', { name: '  ' })).status, 400);
  assert.equal(
    (
      await me.api.put('/api/users/me/password', {
        currentPassword: PASSWORD,
        newPassword: 'short',
      })
    ).status,
    400,
  );
  const emailChange = await me.api.patch('/api/users/me', { email: 'new@test.example' });
  assert.equal(emailChange.status, 400);
  assert.equal((await me.api.get('/api/users/me')).body.email, me.email);

  // 기본 흐름 3단계 + 사후 조건 (G-06)
  const changed = await me.api.put('/api/users/me/password', {
    currentPassword: PASSWORD,
    newPassword: 'newpass5678',
  });
  assert.equal(changed.status, 200);
  const login = (password) =>
    request(app).post('/api/auth/login').send({ email: me.email, password });
  assert.equal((await login('newpass5678')).status, 200);
  assert.equal((await login(PASSWORD)).status, 401);
  assert.equal((await me.api.get('/api/users/me')).status, 200); // 현재 기기 access token 유지
  assert.equal(
    (await request(app).post('/api/auth/refresh').send({ refreshToken: changed.body.refreshToken }))
      .status,
    200,
  );
  assert.equal(
    (
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: otherDevice.body.refreshToken })
    ).status,
    401,
  );
});

test('SC-11: 종단 — 가입부터 기한 초과 확인까지 (오늘 = 2026-11-13)', async () => {
  // 1. 가입
  const me = await signup();
  const defaultId = (await me.api.get('/api/categories')).body.items[0].id;

  // 2. 카테고리 "업무"
  const workId = (await me.api.post('/api/categories', { name: '업무' })).body.id;

  // 3~5. 할일 A·B·C
  const a = (
    await me.api.post(
      '/api/todos',
      todo('보고서', '2026-11-10', '2026-11-12', { categoryId: workId }),
    )
  ).body;
  const b = (
    await me.api.post(
      '/api/todos',
      todo('발표 준비', '2026-11-13', '2026-11-16', { categoryId: workId }),
    )
  ).body;
  const c = (await me.api.post('/api/todos', todo('장보기', '2026-11-20', '2026-11-20'))).body;
  assert.equal(c.categoryId, defaultId); // AC-01

  let list = (await me.api.get(`/api/todos?today=${TODAY}`)).body.items;
  assert.equal(statusOf(list, a.id), 'OVERDUE');
  assert.equal(statusOf(list, b.id), 'IN_PROGRESS');
  assert.equal(statusOf(list, c.id), 'NOT_STARTED');

  // 6. 11월 월간 → 11/08 주간
  const month = await me.api.get(
    `/api/todos/calendar?from=2026-11-01&to=2026-12-12&today=${TODAY}`,
  );
  assert.equal(month.body.items.length, 3);
  const week = await me.api.get(`/api/todos/calendar?from=2026-11-08&to=2026-11-14&today=${TODAY}`);
  assert.deepEqual(
    week.body.items.map((t) => t.id),
    [a.id, b.id],
  );

  // 7. B 완료 → 목록·캘린더에 완료 반영
  assert.equal((await me.api.patch(`/api/todos/${b.id}`, { isCompleted: true })).status, 200);
  list = (await me.api.get(`/api/todos?today=${TODAY}`)).body.items;
  assert.equal(statusOf(list, b.id), 'COMPLETED');
  const weekAfter = await me.api.get(
    `/api/todos/calendar?from=2026-11-08&to=2026-11-14&today=${TODAY}`,
  );
  assert.equal(statusOf(weekAfter.body.items, b.id), 'COMPLETED');

  // 8. 업무 + 기한 초과 → A만 (AC-03, AC-04)
  const filtered = await me.api.get(
    `/api/todos?today=${TODAY}&categoryId=${workId}&status=OVERDUE`,
  );
  assert.deepEqual(
    filtered.body.items.map((t) => t.id),
    [a.id],
  );
});

test('SC-00-E3·E4: 타인 카테고리 수정·삭제와 타인 카테고리로 할일 등록은 존재를 드러내지 않는다 / 우회 입력 거부', async () => {
  const me = await signup();
  const other = await signup();
  const theirs = (await other.api.post('/api/categories', { name: '비밀' })).body.id;

  assert.equal((await me.api.patch(`/api/categories/${theirs}`, { name: '탈취' })).status, 404);
  assert.equal((await me.api.del(`/api/categories/${theirs}`)).status, 404);
  const steal = await me.api.post(
    '/api/todos',
    todo('t', '2026-11-10', '2026-11-11', { categoryId: theirs }),
  );
  assert.equal(steal.status, 400); // AQ-06: 없는 카테고리와 같은 응답
  assert.ok(steal.body.error.fields.categoryId);
  assert.equal((await me.api.get(`/api/todos?today=${TODAY}&categoryId=${theirs}`)).body.total, 0);

  // E4: 클라이언트 검증 우회 — 정의되지 않은 필드, 잘못된 JSON
  const extra = await me.api.post(
    '/api/todos',
    todo('t', '2026-11-10', '2026-11-11', { isCompleted: true }),
  );
  assert.equal(extra.status, 400);
  const badJson = await request(app)
    .post('/api/categories')
    .set(bearer(me.accessToken))
    .set('Content-Type', 'application/json')
    .send('{"name":');
  assert.equal(badJson.status, 400);
});
