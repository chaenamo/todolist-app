// PR-37: 원문이 아닌 SHA-256 해시만 다룬다

export async function insertRefreshToken(db, userId, tokenHash, expiresAt) {
  await db.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [
    userId,
    tokenHash,
    expiresAt,
  ]);
}

// 만료 전 토큰만 유효
export async function findValidByHash(db, tokenHash) {
  const { rows } = await db.query(
    'SELECT user_id AS "userId" FROM refresh_tokens WHERE token_hash = $1 AND expires_at > now()',
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function deleteByHash(db, tokenHash) {
  await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

export async function deleteExpiredByUser(db, userId) {
  await db.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at <= now()', [userId]);
}

// G-06: 비밀번호 변경 시 그 사용자의 모든 기기 세션 폐기
export async function deleteAllByUser(db, userId) {
  await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}
