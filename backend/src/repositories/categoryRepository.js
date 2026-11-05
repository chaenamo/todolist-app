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

// BR-06: '기본'은 SQL 조건으로도 막는다. 0건이면 null
export async function updateCategoryName(db, userId, id, name) {
  const { rows } = await db.query(
    `UPDATE categories SET name = $3 WHERE user_id = $1 AND id = $2 AND NOT is_default
     RETURNING ${CATEGORY_COLUMNS}`,
    [userId, id, name],
  );
  return rows[0] ?? null;
}

export async function deleteCategory(db, userId, id) {
  const { rowCount } = await db.query(
    'DELETE FROM categories WHERE user_id = $1 AND id = $2 AND NOT is_default',
    [userId, id],
  );
  return rowCount > 0;
}
