import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { deriveStatus, statusSqlCondition, TODO_STATUS } from '../src/domain/todoStatus.js';
import { pool, resetDb } from './helpers.js';

const { NOT_STARTED, IN_PROGRESS, COMPLETED, OVERDUE } = TODO_STATUS;

function todo(startDate, endDate, isCompleted = false) {
  return { startDate, endDate, isCompleted };
}

test('ST-01~04: 경계 예시 (11/10~11/12)', () => {
  const t = todo('2026-11-10', '2026-11-12');
  assert.equal(deriveStatus(t, '2026-11-09'), NOT_STARTED);
  assert.equal(deriveStatus(t, '2026-11-10'), IN_PROGRESS); // 시작일 당일
  assert.equal(deriveStatus(t, '2026-11-11'), IN_PROGRESS);
  assert.equal(deriveStatus(t, '2026-11-12'), IN_PROGRESS); // 종료일 당일
  assert.equal(deriveStatus(t, '2026-11-13'), OVERDUE);
});

test('ST-01~04: 하루짜리 할일', () => {
  const t = todo('2026-11-13', '2026-11-13');
  assert.equal(deriveStatus(t, '2026-11-12'), NOT_STARTED);
  assert.equal(deriveStatus(t, '2026-11-13'), IN_PROGRESS);
  assert.equal(deriveStatus(t, '2026-11-14'), OVERDUE);
});

test('ST-01: 완료가 우선한다 (기한 지난 완료 → COMPLETED)', () => {
  assert.equal(deriveStatus(todo('2026-11-10', '2026-11-12', true), '2026-11-13'), COMPLETED);
  assert.equal(deriveStatus(todo('2026-11-14', '2026-11-16', true), '2026-11-13'), COMPLETED);
});

test('PR-38: 화이트리스트 밖 상태·자리표시자는 예외, 조각에 입력값이 들어가지 않는다', () => {
  assert.throws(() => statusSqlCondition('FOO', '$2'));
  assert.throws(() => statusSqlCondition("COMPLETED' OR 1=1 --", '$2'));
  assert.throws(() => statusSqlCondition('toString', '$2')); // 프로토타입 키 차단
  assert.throws(() => statusSqlCondition('OVERDUE', "'2026-11-13'"));
  assert.throws(() => statusSqlCondition('OVERDUE', '$0'));

  for (const status of Object.values(TODO_STATUS)) {
    const sql = statusSqlCondition(status, '$7');
    assert.doesNotMatch(sql, /'/); // 리터럴 없음
    assert.deepEqual([...new Set(sql.match(/\$\d+/g) ?? [])], status === COMPLETED ? [] : ['$7']);
  }
});

// AD-08, AC-03: 같은 데이터에 대해 SQL 조각 선택 결과가 deriveStatus와 일치해야 한다
const CASES = [
  ['2026-11-10', '2026-11-12', false],
  ['2026-11-13', '2026-11-13', false],
  ['2026-11-12', '2026-11-13', false],
  ['2026-11-13', '2026-11-20', false],
  ['2026-11-14', '2026-11-16', false],
  ['2026-11-01', '2026-11-05', false],
  ['2026-11-10', '2026-11-12', true],
  ['2026-11-14', '2026-11-14', true],
];
const TODAYS = ['2026-11-09', '2026-11-10', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-21'];

before(async () => {
  await resetDb();
  await pool.query("INSERT INTO users (email, password_hash, name) VALUES ('s@t.test', 'x', 'S')");
  await pool.query("INSERT INTO categories (user_id, name, is_default) VALUES (1, '기본', true)");
  for (const [startDate, endDate, isCompleted] of CASES) {
    await pool.query(
      `INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed, completed_at)
       VALUES (1, 1, 't', $1, $2, $3, CASE WHEN $3 THEN now() END)`,
      [startDate, endDate, isCompleted],
    );
  }
});

after(async () => {
  await resetDb();
  await pool.end();
});

test('AD-08: deriveStatus와 statusSqlCondition 결과가 4상태 모두 일치한다', async () => {
  const { rows: all } = await pool.query(
    'SELECT id, start_date AS "startDate", end_date AS "endDate", is_completed AS "isCompleted" FROM todos ORDER BY id',
  );
  const seen = new Set();
  for (const today of TODAYS) {
    for (const status of Object.values(TODO_STATUS)) {
      const condition = statusSqlCondition(status, '$2');
      // COMPLETED 조각은 today를 쓰지 않으므로 그때는 파라미터를 넘기지 않는다
      const params = condition.includes('$2') ? [1, today] : [1];
      const { rows } = await pool.query(
        `SELECT id FROM todos WHERE user_id = $1 AND ${condition} ORDER BY id`,
        params,
      );
      const expected = all.filter((t) => deriveStatus(t, today) === status).map((t) => t.id);
      assert.deepEqual(rows.map((r) => r.id), expected, `${today} ${status}`);
      if (expected.length > 0) seen.add(status);
    }
  }
  assert.equal(seen.size, 4); // 네 상태가 모두 실제로 비교됐다
});
