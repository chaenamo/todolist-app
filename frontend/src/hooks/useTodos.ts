import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { createTodo, deleteTodo, getTodo, listTodos, setCompleted, updateTodo } from '../api/todos';
import type { TodoInput, TodoStatus } from '../api/types';
import { todayString } from '../lib/date';

export const TODOS_KEY = ['todos'] as const;

export function useTodoList(filter: {
  categoryId: number | null;
  statuses: TodoStatus[];
  page: number;
}) {
  const today = todayString();
  return useQuery({
    queryKey: [...TODOS_KEY, 'list', { today, ...filter }],
    queryFn: () => listTodos({ today, ...filter }),
    // SG-17: 재조회 중 기존 목록 유지
    placeholderData: keepPreviousData,
  });
}

// 모든 할일 쿼리 키는 TODOS_KEY 하위라서 목록·캘린더가 함께 재조회된다
function useInvalidatingMutationOptions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: TODOS_KEY });
  return {
    onSuccess: invalidate,
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 404) invalidate();
    },
  };
}

export function useSetCompleted() {
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      setCompleted(id, isCompleted),
    ...useInvalidatingMutationOptions(),
  });
}

export function useTodo(id: number | null) {
  return useQuery({
    queryKey: [...TODOS_KEY, 'detail', id],
    queryFn: () => getTodo(id as number),
    enabled: id !== null,
    retry: false,
  });
}

export function useCreateTodo() {
  return useMutation({ mutationFn: createTodo, ...useInvalidatingMutationOptions() });
}

export function useUpdateTodo() {
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TodoInput }) => updateTodo(id, input),
    ...useInvalidatingMutationOptions(),
  });
}

export function useDeleteTodo() {
  return useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    ...useInvalidatingMutationOptions(),
  });
}
