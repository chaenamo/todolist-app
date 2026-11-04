import { TODO_STATUS, statusSqlCondition } from '../domain/todoStatus.js';

// PR-10: 모든 함수는 userId를 첫 인자로 받아 WHERE user_id 조건을 건다. PR-19: camelCase 별칭
const TODO_COLUMNS = `id, category_id AS "categoryId", title, description,
  start_date AS "startDate", end_date AS "endDate", is_completed AS "isCompleted",
  completed_at AS "completedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

export async function insertTodo(db, userId, { categoryId, title, description, startDate, endDate }) {
  const { rows } = await db.query(
    `INSERT INTO todos (user_id, category_id, title, description, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${TODO_COLUMNS}`,
    [userId, categoryId, title, description, startDate, endDate],
  );
  return rows[0];
}

export async function findTodoById(db, userId, id) {
  const { rows } = await db.query(`SELECT ${TODO_COLUMNS} FROM todos WHERE user_id = $1 AND id = $2`, [
    userId,
    id,
  ]);
  return rows[0] ?? null;
}

// PR-38: SQL 텍스트에는 화이트리스트 조각과 $n 자리표시자만 들어간다
export async function findTodosByUser(db, userId, { categoryId, statuses, today, page, limit }) {
  const params = [userId];
  const where = ['user_id = $1'];
  if (categoryId !== null) {
    params.push(categoryId);
    where.push(`category_id = $${params.length}`);
  }
  if (statuses.length > 0) {
    const ref = `$${params.length + 1}`;
    // COMPLETED 조각은 today를 쓰지 않는다. 쓰이지 않는 바인딩 파라미터는 PostgreSQL이 08P01로 거부한다
    if (statuses.some((s) => s !== TODO_STATUS.COMPLETED)) params.push(today);
    where.push(`(${statuses.map((s) => statusSqlCondition(s, ref)).join(' OR ')})`);
  }
  const whereSql = where.join(' AND ');
  // shortcut: COUNT와 목록 조회가 별도 쿼리라 동시 쓰기 시 total이 어긋날 수 있다, 정확한 total이 필요해지면 같은 트랜잭션(REPEATABLE READ)으로 묶는다
  const [countResult, pageResult] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM todos WHERE ${whereSql}`, params),
    db.query(
      `SELECT ${TODO_COLUMNS} FROM todos WHERE ${whereSql}
       ORDER BY end_date, created_at, id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
  ]);
  return { items: pageResult.rows, total: Number(countResult.rows[0].total) };
}

// BR-16: 뷰 기간과 하루라도 겹치면 포함 (IX-03)
export async function findTodosInRange(db, userId, from, to) {
  const { rows } = await db.query(
    `SELECT ${TODO_COLUMNS} FROM todos
     WHERE user_id = $1 AND start_date <= $3 AND end_date >= $2
     ORDER BY start_date, id`,
    [userId, from, to],
  );
  return rows;
}

// 완료 필드는 바꾸지 않는다 (SC-07-A1, A-15). 0건이면 null
export async function updateTodo(db, userId, id, { categoryId, title, description, startDate, endDate }) {
  const { rows } = await db.query(
    `UPDATE todos
     SET category_id = $3, title = $4, description = $5, start_date = $6, end_date = $7, updated_at = now()
     WHERE user_id = $1 AND id = $2
     RETURNING ${TODO_COLUMNS}`,
    [userId, id, categoryId, title, description, startDate, endDate],
  );
  return rows[0] ?? null;
}

export async function deleteTodo(db, userId, id) {
  const { rowCount } = await db.query('DELETE FROM todos WHERE user_id = $1 AND id = $2', [userId, id]);
  return rowCount > 0;
}

// BR-13: 완료면 완료일시 기록, 취소면 NULL. 0건이면 null
export async function updateCompletion(db, userId, id, isCompleted) {
  const { rows } = await db.query(
    `UPDATE todos
     SET is_completed = $3, completed_at = CASE WHEN $3::boolean THEN now() END, updated_at = now()
     WHERE user_id = $1 AND id = $2
     RETURNING ${TODO_COLUMNS}`,
    [userId, id, isCompleted],
  );
  return rows[0] ?? null;
}
