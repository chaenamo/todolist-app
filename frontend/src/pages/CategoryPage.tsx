import { useCallback, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import type { Category } from '../api/types';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useRenameCategory,
} from '../hooks/useCategories';
import { useToastStore } from '../stores/toastStore';
import styles from './CategoryPage.module.css';

export function CategoryPage() {
  const { data, isPending, error: loadError } = useCategories();
  const create = useCreateCategory();
  const rename = useRenameCategory();
  const { mutate: deleteMutate } = useDeleteCategory();
  const showToast = useToastStore.getState().showToast;
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const onDeleteCancel = useCallback(() => setDeleteTarget(null), []);
  const onDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    deleteMutate(deleteTarget.id, {
      onSuccess: () => showToast('success', '삭제했습니다.'),
      onError: (err) => showToast('error', err.message),
    });
  }, [deleteTarget, deleteMutate, showToast]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    setError(null);
    if (!trimmed) {
      setError('이름을 입력하세요');
      return;
    }
    create.mutate(trimmed, {
      onSuccess: () => setName(''),
      onError: (err) =>
        setError(err instanceof ApiError ? (err.fields?.name ?? err.message) : err.message),
    });
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  function handleRename(e: FormEvent, id: number) {
    e.preventDefault();
    const trimmed = editName.trim();
    setEditError(null);
    if (!trimmed) {
      setEditError('이름을 입력하세요');
      return;
    }
    rename.mutate(
      { id, name: trimmed },
      {
        onSuccess: () => {
          cancelEdit();
          showToast('success', '이름을 변경했습니다.');
        },
        onError: (err) =>
          setEditError(err instanceof ApiError ? (err.fields?.name ?? err.message) : err.message),
      },
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>카테고리 관리</h1>
      <form noValidate className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="category-name">
            새 카테고리
          </label>
          <div className={styles.row}>
            <input
              id="category-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'category-name-error' : undefined}
            />
            <button type="submit" className={styles.submit} disabled={create.isPending}>
              등록
            </button>
          </div>
          {error && (
            <p id="category-name-error" className={styles.fieldError}>
              {error}
            </p>
          )}
        </div>
      </form>
      {isPending ? (
        <p role="status" className={styles.status}>
          불러오는 중…
        </p>
      ) : loadError ? (
        <p role="alert" className={styles.loadError}>
          {loadError.message}
        </p>
      ) : (
        <ul aria-label="카테고리 목록" className={styles.list}>
          {data.map((c) => (
            <li key={c.id} className={styles.item}>
              {c.isDefault ? (
                <>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.muted}>(변경·삭제 불가)</span>
                </>
              ) : editingId === c.id ? (
                <form
                  noValidate
                  className={styles.editForm}
                  onSubmit={(e) => handleRename(e, c.id)}
                >
                  <input
                    className={styles.input}
                    aria-label="새 이름"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-invalid={editError ? true : undefined}
                    aria-describedby={editError ? `category-${c.id}-error` : undefined}
                  />
                  <div className={styles.actions}>
                    <button
                      type="submit"
                      className={`${styles.button} ${styles.primary}`}
                      disabled={rename.isPending}
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={cancelEdit}
                    >
                      취소
                    </button>
                  </div>
                  {editError && (
                    <p id={`category-${c.id}-error`} className={styles.fieldError}>
                      {editError}
                    </p>
                  )}
                </form>
              ) : (
                <>
                  <span className={styles.name}>{c.name}</span>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.secondary}`}
                      aria-label={`${c.name} 이름 변경`}
                      onClick={() => startEdit(c)}
                    >
                      이름 변경
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.ghost}`}
                      aria-label={`${c.name} 삭제`}
                      onClick={() => setDeleteTarget(c)}
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmModal
        open={deleteTarget !== null}
        title={`카테고리 '${deleteTarget?.name ?? ''}'를 삭제할까요?`}
        message="소속 할일은 삭제되지 않고 '기본'으로 이동합니다."
        confirmLabel="삭제"
        danger
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
      />
    </div>
  );
}
