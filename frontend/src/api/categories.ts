import { request } from './client';
import type { Category, Items } from './types';

export function listCategories(): Promise<Items<Category>> {
  return request('GET', '/api/categories');
}

export function createCategory(name: string): Promise<Category> {
  return request('POST', '/api/categories', { name });
}

export function renameCategory(id: number, name: string): Promise<Category> {
  return request('PATCH', `/api/categories/${id}`, { name });
}

export function deleteCategory(id: number): Promise<void> {
  return request('DELETE', `/api/categories/${id}`);
}
