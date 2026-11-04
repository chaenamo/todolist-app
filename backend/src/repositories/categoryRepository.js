// PR-10: 모든 함수는 userId를 받아 소유자 조건을 건다
const CATEGORY_COLUMNS = 'id, name, is_default AS "isDefault"';

// '기본' 먼저, 이후 이름순
export async function findCategoriesByUser(db, userId) {
  const { rows } = await db.query(
    `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE user_id = $1 ORDER BY is_default DESC, name, id`,
    [userId],
  );
  return rows;
}

export async function findCategoryById(db, userId, id) {
  const { rows } = await db.query(
    `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE user_id = $1 AND id = $2`,
    [userId, id],
  );
  return rows[0] ?? null;
}

export async function findDefaultCategory(db, userId) {
  const { rows } = await db.query(
    `SELECT ${CATEGORY_COLUMNS} FROM categories WHERE user_id = $1 AND is_default`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function insertCategory(db, userId, { name, isDefault = false }) {
  const { rows } = await db.query(
    `INSERT INTO categories (user_id, name, is_default) VALUES ($1, $2, $3) RETURNING ${CATEGORY_COLUMNS}`,
    [userId, name, isDefault],
  );
  return rows[0];
}
