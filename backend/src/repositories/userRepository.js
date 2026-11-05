// PR-19: snake_case → camelCase는 SQL 별칭으로. PR-36: password_hash는 로그인용 조회에서만 select
const USER_COLUMNS = 'id, email, name, created_at AS "createdAt"';

export async function insertUser(db, { email, passwordHash, name }) {
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING ${USER_COLUMNS}`,
    [email, passwordHash, name],
  );
  return rows[0];
}

export async function findUserWithHashByEmail(db, email) {
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash" FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserById(db, id) {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function updateUserName(db, id, name) {
  const { rows } = await db.query(
    `UPDATE users SET name = $2 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [id, name],
  );
  return rows[0] ?? null;
}

// PR-36: 비밀번호 확인 전용
export async function findPasswordHashById(db, id) {
  const { rows } = await db.query('SELECT password_hash AS "passwordHash" FROM users WHERE id = $1', [id]);
  return rows[0]?.passwordHash ?? null;
}

export async function updatePasswordHash(db, id, passwordHash) {
  await db.query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, passwordHash]);
}
