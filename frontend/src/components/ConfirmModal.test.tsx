import type { ComponentProps } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

afterEach(() => {
  cleanup();
});

function renderModal(props: Partial<ComponentProps<typeof ConfirmModal>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmModal
      open
      title="할일 삭제"
      message="이 할일을 삭제할까요?"
      confirmLabel="삭제"
      danger
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
}

test('[CMP-01] open=false면 아무것도 렌더하지 않는다', () => {
  renderModal({ open: false });
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('[CMP-01] 모달은 제목을 이름, 메시지를 설명으로 갖는 dialog다', () => {
  renderModal();
  const dialog = screen.getByRole('dialog', { name: '할일 삭제' });
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  expect(screen.getByRole('dialog', { description: '이 할일을 삭제할까요?' })).toBe(dialog);
});

test('[CMP-01, CMP-02] ConfirmModal 확인·취소 클릭은 각각 해당 콜백만 호출한다', () => {
  const first = renderModal();
  fireEvent.click(screen.getByRole('button', { name: '삭제' }));
  expect(first.onConfirm).toHaveBeenCalledTimes(1);
  expect(first.onCancel).not.toHaveBeenCalled();
  cleanup();

  const second = renderModal();
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(second.onCancel).toHaveBeenCalledTimes(1);
  expect(second.onConfirm).not.toHaveBeenCalled();
});

test('[CMP-01] cancelLabel을 지정하면 취소 버튼 문구가 바뀐다', () => {
  renderModal({ cancelLabel: '닫기' });
  expect(screen.getByRole('button', { name: '닫기' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '취소' })).toBeNull();
});

test('[CMP-01] 열리면 취소 버튼에 포커스가 간다', () => {
  renderModal();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '취소' }));
});

test('[CMP-01] Escape 키는 onCancel만 호출한다', () => {
  const { onConfirm, onCancel } = renderModal();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});

test('[CMP-02] 열린 채 새 onCancel로 다시 렌더해도 포커스를 옮기지 않고 Escape는 최신 콜백을 부른다', () => {
  const first = vi.fn();
  const latest = vi.fn();
  const props = {
    open: true,
    title: '제목',
    message: '본문',
    confirmLabel: '나가기',
    onConfirm: vi.fn(),
  };
  const { rerender } = render(<ConfirmModal {...props} onCancel={first} />);
  screen.getByRole('button', { name: '나가기' }).focus();

  rerender(<ConfirmModal {...props} onCancel={latest} />);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '나가기' }));

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(latest).toHaveBeenCalledTimes(1);
  expect(first).not.toHaveBeenCalled();
});
