import { pool, withTransaction } from '../db.js';
import { AppError, ERROR_CODES, notFoundError } from '../errors.js';
import {
  findCategoriesByUser,
  findCategoryById,
  findDefaultCategory,
  insertCategory,
  updateCategoryName,
  deleteCategory as deleteCategoryRow,
} from '../repositories/categoryRepository.js';
import { moveCategory } from '../repositories/todoRepository.js';

export async function listCategories(userId) {
  return { items: await findCategoriesByUser(pool, userId) };
}

// BR-07: 같은 사용자 내 이름 중복은 uq_categories_user_id_name 위반 → error 미들웨어가 409 fields.name (PR-46)
export async function createCategory(userId, name) {
  return insertCategory(pool, userId, { name });
}

// 없거나 타인 것이면 404(PR-10), '기본'이면 400(BR-06)
async function findEditableCategory(db, userId, id) {
  const category = await findCategoryById(db, userId, id);
  if (!category) throw notFoundError();
  if (category.isDefault) {
    throw new AppError(
      400,
      ERROR_CODES.FORBIDDEN_OPERATION,
      "'기본' 카테고리는 변경하거나 삭제할 수 없습니다",
    );
  }
  return category;
}

export async function renameCategory(userId, id, name) {
  await findEditableCategory(pool, userId, id);
  const category = await updateCategoryName(pool, userId, id, name);
  if (!category) throw notFoundError(); // 조회 후 삭제된 경합
  return category;
}

// AD-11, BR-09, PR-11: 할일 '기본'으로 이동 + 삭제를 한 트랜잭션으로. 이동 후 끼어든 할일은 FK 23503 → 409(EQ-01)
export async function deleteCategory(userId, id) {
  await withTransaction(async (client) => {
    await findEditableCategory(client, userId, id);
    const defaultCategory = await findDefaultCategory(client, userId);
    await moveCategory(client, userId, id, defaultCategory.id);
    if (!(await deleteCategoryRow(client, userId, id))) throw notFoundError();
  });
}
