import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { TodoWithStatus } from '../api/types';
import { ApiError } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
import { FilterBar } from '../components/todo/FilterBar';
import { Pagination } from '../components/todo/Pagination';
import { TodoRow } from '../components/todo/TodoRow';
import { useCategories } from '../hooks/useCategories';
import { categoryName, useT } from '../i18n';
import { useDeleteTodo, useSetCompleted, useTodoList } from '../hooks/useTodos';
import { useToastStore } from '../stores/toastStore';
import { useUiStore } from '../stores/uiStore';
import styles from './TodoListPage.module.css';

export function TodoListPage() {
  const t = useT();
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
      onSuccess: () => showToast('success', t.common.deleted),
      onError: (err) =>
        showToast(
          'error',
          err instanceof ApiError && err.status === 404 ? t.common.notFound : err.message,
        ),
    });
  }, [deleteTarget, deleteMutate, showToast, t]);

  const names = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, categoryName(c, t)])),
    [categories, t],
  );
  const unfiltered = categoryId === null && statuses.length === 0;

  let body;
  if (isPending) {
    body = (
      <p role="status" className={styles.status}>
        {t.common.loading}
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
        <p className={styles.emptyText}>{t.todo.emptyAll}</p>
        <Link to="/todos/new" className={styles.secondary}>
          {t.todo.firstTodo}
        </Link>
      </div>
    ) : (
      <div className={styles.empty}>
        <p className={styles.emptyText}>{t.todo.emptyFiltered}</p>
        <button type="button" className={styles.secondary} onClick={resetFilters}>
          {t.filter.reset}
        </button>
      </div>
    );
  } else {
    body = (
      <>
        <ul aria-label={t.todo.listLabel} className={styles.list}>
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
        <h1 className={styles.title}>{t.todo.listTitle}</h1>
        <Link to="/todos/new" className={styles.primary}>
          {t.todo.newTodo}
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
        title={t.todo.deleteTitle}
        message={t.todo.deleteMessage}
        confirmLabel={t.common.delete}
        danger
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </div>
  );
}
