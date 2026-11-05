import { request } from './client';
import type { Items, Paged, Todo, TodoInput, TodoStatus, TodoWithStatus } from './types';

export interface TodoListParams {
  today: string;
  categoryId: number | null;
  statuses: TodoStatus[];
  page: number;
}

export function listTodos(p: TodoListParams): Promise<Paged<TodoWithStatus>> {
  const qs = new URLSearchParams({ today: p.today });
  if (p.categoryId !== null) qs.set('categoryId', String(p.categoryId));
  if (p.statuses.length > 0) qs.set('status', p.statuses.join(','));
  qs.set('page', String(p.page));
  return request('GET', `/api/todos?${qs}`);
}

export function setCompleted(id: number, isCompleted: boolean): Promise<Todo> {
  return request('PATCH', `/api/todos/${id}`, { isCompleted });
}

export function deleteTodo(id: number): Promise<void> {
  return request('DELETE', `/api/todos/${id}`);
}

export function getTodo(id: number): Promise<Todo> {
  return request('GET', `/api/todos/${id}`);
}

export function createTodo(input: TodoInput): Promise<Todo> {
  return request('POST', '/api/todos', input);
}

export function updateTodo(id: number, input: TodoInput): Promise<Todo> {
  return request('PUT', `/api/todos/${id}`, input);
}

export function listCalendarTodos(p: {
  from: string;
  to: string;
  today: string;
}): Promise<Items<TodoWithStatus>> {
  const qs = new URLSearchParams({ from: p.from, to: p.to, today: p.today });
  return request('GET', `/api/todos/calendar?${qs}`);
}
