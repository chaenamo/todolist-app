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
