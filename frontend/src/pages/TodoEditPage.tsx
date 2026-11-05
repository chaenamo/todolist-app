import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import type { TodoInput } from '../api/types';
import { ConfirmModal } from '../components/ConfirmModal';
import { TodoForm, type TodoFormValues } from '../components/todo/TodoForm';
import { useCategories } from '../hooks/useCategories';
import { useCreateTodo, useTodo, useUpdateTodo } from '../hooks/useTodos';
import { useToastStore } from '../stores/toastStore';
import { NotFoundPage } from './NotFoundPage';
import styles from './TodoEditPage.module.css';

// WF-05: 등록·수정 공용. id 파라미터가 없으면 등록
export function TodoEditPage() {
  const { id: idParam } = useParams();
  const isEdit = idParam !== undefined;
  const idValid = !isEdit || /^[1-9]\d*$/.test(idParam);
  const id = isEdit && idValid ? Number(idParam) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from === '/calendar' ? '/calendar' : '/todos';
  const showToast = useToastStore((s) => s.showToast);

  const categories = useCategories();
  const todo = useTodo(id);
  const create = useCreateTodo();
  const update = useUpdateTodo();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [gone, setGone] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string> | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const handleSubmit = useCallback(
    (input: TodoInput) => {
      setServerErrors(undefined);
      setFormError(undefined);
      const options = {
        onSuccess: () => {
          showToast('success', '저장했습니다.');
          navigate(from);
        },
        onError: (err: Error) => {
          if (err instanceof ApiError && err.status === 404) setGone(true);
          else if (err instanceof ApiError && err.fields) setServerErrors(err.fields);
          else setFormError(err.message);
        },
      };
      if (id === null) create.mutate(input, options);
      else update.mutate({ id, input }, options);
    },
    [id, create, update, showToast, navigate, from],
  );

  const handleCancel = useCallback(
    (dirty: boolean) => (dirty ? setLeaveOpen(true) : navigate(from)),
    [navigate, from],
  );
  const closeLeave = useCallback(() => setLeaveOpen(false), []);
  const leave = useCallback(() => navigate(from), [navigate, from]);

  if (!idValid || gone) return <NotFoundPage />;
  if (todo.error instanceof ApiError && todo.error.status === 404) return <NotFoundPage />;

  const loadError = todo.error ?? categories.error;
  let body;
  if (loadError) {
    body = (
      <p role="alert" className={styles.loadError}>
        {loadError.message}
      </p>
    );
  } else if (categories.data === undefined || (isEdit && todo.data === undefined)) {
    body = (
      <p role="status" className={styles.status}>
        불러오는 중…
      </p>
    );
  } else {
    const t = todo.data;
    const initial: TodoFormValues = t
      ? {
          title: t.title,
          description: t.description ?? '',
          categoryId: t.categoryId,
          startDate: t.startDate,
          endDate: t.endDate,
        }
      : {
          title: '',
          description: '',
          categoryId: categories.data.find((c) => c.isDefault)?.id ?? null,
          startDate: '',
          endDate: '',
        };
    body = (
      <TodoForm
        key={id ?? 'new'}
        initial={initial}
        categories={categories.data}
        submitting={create.isPending || update.isPending}
        serverErrors={serverErrors}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{isEdit ? '할일 수정' : '할일 등록'}</h1>
      {body}
      <ConfirmModal
        open={leaveOpen}
        title="저장하지 않은 변경 사항이 있습니다."
        message="나가면 변경 내용이 사라집니다."
        confirmLabel="나가기"
        cancelLabel="계속 편집"
        onConfirm={leave}
        onCancel={closeLeave}
      />
    </div>
  );
}
