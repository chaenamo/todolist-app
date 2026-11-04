import { pool } from '../db.js';
import { findCategoriesByUser, insertCategory } from '../repositories/categoryRepository.js';

export async function listCategories(userId) {
  return { items: await findCategoriesByUser(pool, userId) };
}

// BR-07: 같은 사용자 내 이름 중복은 uq_categories_user_id_name 위반 → error 미들웨어가 409 fields.name (PR-46)
export async function createCategory(userId, name) {
  return insertCategory(pool, userId, { name });
}
