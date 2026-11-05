import { useState, type FormEvent } from 'react';
import type { Category, TodoInput } from '../../api/types';
import styles from './TodoForm.module.css';

export interface TodoFormValues {
  title: string;
  description: string;
  categoryId: number | null;
  startDate: string;
  endDate: string;
}

interface TodoFormProps {
  initial: TodoFormValues;
  categories: Category[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  formError?: string;
  onSubmit: (input: TodoInput) => void;
  onCancel: (dirty: boolean) => void;
}

type Field = 'title' | 'description' | 'categoryId' | 'startDate' | 'endDate';

// CMP-02
export function TodoForm({
  initial,
  categories,
  submitting,
  serverErrors,
  formError,
  onSubmit,
  onCancel,
}: TodoFormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const set = <K extends Field>(key: K, value: TodoFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const errorOf = (f: Field) => errors[f] ?? serverErrors?.[f];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    if (values.title.trim() === '') next.title = '제목을 입력하세요';
    if (!values.startDate) next.startDate = '시작일자를 선택하세요';
    if (!values.endDate) next.endDate = '종료일자를 선택하세요';
    else if (values.startDate && values.endDate < values.startDate)
      next.endDate = '종료일자는 시작일자 이후여야 합니다';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      title: values.title,
      description: values.description.trim() === '' ? null : values.description,
      categoryId: values.categoryId,
      startDate: values.startDate,
      endDate: values.endDate,
    });
  }

  const aria = (f: Field, id: string) => ({
    id,
    'aria-invalid': errorOf(f) ? (true as const) : undefined,
    'aria-describedby': errorOf(f) ? `${id}-error` : undefined,
  });
  const fieldError = (f: Field, id: string) =>
    errorOf(f) && (
      <p id={`${id}-error`} className={styles.fieldError}>
        {errorOf(f)}
      </p>
    );

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="todo-title">
          제목<span className={styles.required}> *</span>
        </label>
        <input
          {...aria('title', 'todo-title')}
          className={styles.input}
          type="text"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
        />
        {fieldError('title', 'todo-title')}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="todo-description">
          설명
        </label>
        <textarea
          {...aria('description', 'todo-description')}
          className={`${styles.input} ${styles.textarea}`}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
        {fieldError('description', 'todo-description')}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="todo-category">
          카테고리
        </label>
        <select
          {...aria('categoryId', 'todo-category')}
          className={styles.input}
          value={values.categoryId ?? ''}
          onChange={(e) => set('categoryId', e.target.value === '' ? null : Number(e.target.value))}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldError('categoryId', 'todo-category')}
      </div>
      <div className={styles.dates}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="todo-start">
            시작일자<span className={styles.required}> *</span>
          </label>
          <input
            {...aria('startDate', 'todo-start')}
            className={styles.input}
            type="date"
            value={values.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
          {fieldError('startDate', 'todo-start')}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="todo-end">
            종료일자<span className={styles.required}> *</span>
          </label>
          <input
            {...aria('endDate', 'todo-end')}
            className={styles.input}
            type="date"
            value={values.endDate}
            onChange={(e) => set('endDate', e.target.value)}
          />
          {fieldError('endDate', 'todo-end')}
        </div>
      </div>
      {formError && (
        <div role="alert" className={styles.formError}>
          {formError}
        </div>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles.secondary}`}
          onClick={() => onCancel(JSON.stringify(values) !== JSON.stringify(initial))}
        >
          취소
        </button>
        <button
          type="submit"
          className={`${styles.button} ${styles.primary}`}
          disabled={submitting}
        >
          저장
        </button>
      </div>
    </form>
  );
}
