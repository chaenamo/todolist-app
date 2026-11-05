import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCategory, deleteCategory, listCategories, renameCategory } from '../api/categories';
import { useUiStore } from '../stores/uiStore';
import { TODOS_KEY } from './useTodos';

export const CATEGORIES_KEY = ['categories'] as const;

export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: listCategories, select: (d) => d.items });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

// 카테고리 변경·삭제는 할일의 카테고리 표시에도 영향을 주므로 할일 쿼리도 함께 무효화한다
function useInvalidateCategoryAndTodos() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
      queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
    ]);
}

export function useRenameCategory() {
  const invalidate = useInvalidateCategoryAndTodos();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameCategory(id, name),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategoryAndTodos();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: (_d, id) => {
      // 삭제된 카테고리로 필터가 남지 않게 해제한다 (G-08)
      if (useUiStore.getState().categoryId === id) useUiStore.getState().setCategoryId(null);
      return invalidate();
    },
  });
}
