import { pool } from '../db.js';
import { notFoundError } from '../errors.js';
import { validationError } from '../validators/common.js';
import { findCategoryById, findDefaultCategory } from '../repositories/categoryRepository.js';
import { deriveStatus } from '../domain/todoStatus.js';
import {
  insertTodo,
  findTodoById,
  findTodosByUser,
  updateTodo as updateTodoRow,
  updateCompletion,
  deleteTodo as deleteTodoRow,
} from '../repositories/todoRepository.js';

// BR-08: 미지정이면 '기본'. AQ-06: 타인·없는 카테고리는 400 fields.categoryId (PR-10)
async function resolveCategoryId(userId, categoryId) {
  if (categoryId === null) return (await findDefaultCategory(pool, userId)).id;
  const category = await findCategoryById(pool, userId, categoryId);
  if (!category) throw validationError({ categoryId: '카테고리를 찾을 수 없습니다' });
  return category.id;
}

export async function createTodo(userId, input) {
  const categoryId = await resolveCategoryId(userId, input.categoryId);
  return insertTodo(pool, userId, { ...input, categoryId });
}

// categoryId 소유 검사를 하지 않는다: user_id 조건 때문에 타인·없는 카테고리는 빈 목록이 된다 (PR-10)
export async function listTodos(userId, query) {
  const { items, total } = await findTodosByUser(pool, userId, query);
  return {
    items: items.map((todo) => ({ ...todo, status: deriveStatus(todo, query.today) })),
    page: query.page,
    limit: query.limit,
    total,
  };
}

export async function getTodo(userId, id) {
  const todo = await findTodoById(pool, userId, id);
  if (!todo) throw notFoundError();
  return todo;
}

// BR-17: 등록과 같은 검증, 전체 교체
export async function updateTodo(userId, id, input) {
  const categoryId = await resolveCategoryId(userId, input.categoryId);
  const todo = await updateTodoRow(pool, userId, id, { ...input, categoryId });
  if (!todo) throw notFoundError();
  return todo;
}

// BR-14: 영구 삭제
export async function deleteTodo(userId, id) {
  if (!(await deleteTodoRow(pool, userId, id))) throw notFoundError();
}

// UC-08, AQ-09: 응답에 status 없음(클라이언트가 재조회)
export async function setCompleted(userId, id, isCompleted) {
  const todo = await updateCompletion(pool, userId, id, isCompleted);
  if (!todo) throw notFoundError();
  return todo;
}
