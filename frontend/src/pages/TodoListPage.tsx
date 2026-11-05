import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { TodoWithStatus } from '../api/types';
import { ApiError } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
import { FilterBar } from '../components/todo/FilterBar';
import { Pagination } from '../components/todo/Pagination';
import { TodoRow } from '../components/todo/TodoRow';
import { useCategories } from '../hooks/useCategories';
import { useDeleteTodo, useSetCompleted, useTodoList } from '../hooks/useTodos';
import { useToastStore } from '../stores/toastStore';
import { useUiStore } from '../stores/uiStore';
import styles from './TodoListPage.module.css';

export function TodoListPage() {
  const { categoryId, statuses, page, setCategoryId, setStatuses, setPage, resetFilters } =
    useUiStore();
  const { data: categories } = useCategories();
  const { data, isPending, error } = useTodoList({ categoryId, statuses, page });

  const setCompleted = useSetCompleted();
  const { mutate: deleteMutate } = useDeleteTodo();
  const [deleteTarget, setDeleteTarget] = useState<TodoWithStatus | null>(null);
  const showToast = useToastStore.getState().showToast;

  const onCancel = useCallback(() => setDeleteTarget(null), []);
  const onConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    deleteMutate(deleteTarget.id, {
      onSuccess: () => showToast('success', '삭제했습니다.'),
      onError: (err) =>
        showToast(
          'error',
          err instanceof ApiError && err.status === 404
            ? '요청하신 항목을 찾을 수 없습니다.'
            : err.message,
        ),
    });
  }, [deleteTarget, deleteMutate, showToast]);

  const names = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);
  const unfiltered = categoryId === null && statuses.length === 0;

  let body;
  if (isPending) {
    body = (
      <p role="status" className={styles.status}>
        불러오는 중…
      </p>
    );
  } else if (error) {
    body = (
      <p role="alert" className={styles.loadError}>
        {error.message}
      </p>
    );
  } else if (data.total === 0) {
    body = unfiltered ? (
      <div className={styles.empty}>
        <p className={styles.emptyText}>등록된 할일이 없습니다.</p>
        <Link to="/todos/new" className={styles.secondary}>
          + 첫 할일 등록
        </Link>
      </div>
    ) : (
      <div className={styles.empty}>
        <p className={styles.emptyText}>조건에 맞는 할일이 없습니다.</p>
        <button type="button" className={styles.secondary} onClick={resetFilters}>
          필터 초기화
        </button>
      </div>
    );
  } else {
    body = (
      <>
        <ul aria-label="할일 목록" className={styles.list}>
          {data.items.map((t) => (
            <TodoRow
              key={t.id}
              todo={t}
              categoryName={names.get(t.categoryId) ?? ''}
              toggling={setCompleted.isPending && setCompleted.variables?.id === t.id}
              onToggle={(v) =>
                setCompleted.mutate(
                  { id: t.id, isCompleted: v },
                  { onError: (err) => showToast('error', err.message) },
                )
              }
              onDelete={() => setDeleteTarget(t)}
            />
          ))}
        </ul>
        <Pagination page={page} total={data.total} limit={data.limit} onChange={setPage} />
      </>
    );
  }

  return (
    <div>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>할일 목록</h1>
        <Link to="/todos/new" className={styles.primary}>
          + 새 할일
        </Link>
      </div>
      <FilterBar
        categories={categories ?? []}
        categoryId={categoryId}
        statuses={statuses}
        onCategoryChange={setCategoryId}
        onStatusesChange={setStatuses}
        onReset={resetFilters}
      />
      {body}
      <ConfirmModal
        open={deleteTarget !== null}
        title="할일을 삭제할까요?"
        message="삭제하면 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </div>
  );
}
