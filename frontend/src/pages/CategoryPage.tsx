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
import { categoryName, useT } from '../i18n';
import { useToastStore } from '../stores/toastStore';
import styles from './CategoryPage.module.css';

export function CategoryPage() {
  const t = useT();
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
      onSuccess: () => showToast('success', t.common.deleted),
      onError: (err) => showToast('error', err.message),
    });
  }, [deleteTarget, deleteMutate, showToast, t]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    setError(null);
    if (!trimmed) {
      setError(t.category.nameRequired);
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
      setEditError(t.category.nameRequired);
      return;
    }
    rename.mutate(
      { id, name: trimmed },
      {
        onSuccess: () => {
          cancelEdit();
          showToast('success', t.category.renamed);
        },
        onError: (err) =>
          setEditError(err instanceof ApiError ? (err.fields?.name ?? err.message) : err.message),
      },
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t.category.title}</h1>
      <form noValidate className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="category-name">
            {t.category.newCategory}
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
              {t.category.add}
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
          {t.common.loading}
        </p>
      ) : loadError ? (
        <p role="alert" className={styles.loadError}>
          {loadError.message}
        </p>
      ) : (
        <ul aria-label={t.category.list} className={styles.list}>
          {data.map((c) => (
            <li key={c.id} className={styles.item}>
              {c.isDefault ? (
                <>
                  <span className={styles.name}>{categoryName(c, t)}</span>
                  <span className={styles.muted}>{t.category.locked}</span>
                </>
              ) : editingId === c.id ? (
                <form
                  noValidate
                  className={styles.editForm}
                  onSubmit={(e) => handleRename(e, c.id)}
                >
                  <input
                    className={styles.input}
                    aria-label={t.category.newName}
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
                      {t.common.save}
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={cancelEdit}
                    >
                      {t.common.cancel}
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
                      aria-label={t.category.renameLabel(c.name)}
                      onClick={() => startEdit(c)}
                    >
                      {t.category.rename}
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.ghost}`}
                      aria-label={t.category.deleteLabel(c.name)}
                      onClick={() => setDeleteTarget(c)}
                    >
                      {t.common.delete}
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
        title={t.category.deleteTitle(deleteTarget?.name ?? '')}
        message={t.category.deleteMessage(t.common.defaultCategory)}
        confirmLabel={t.common.delete}
        danger
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
      />
    </div>
  );
}
