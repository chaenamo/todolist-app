import { act } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Toaster } from './Toast';
import { useToastStore } from '../stores/toastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test('[CMP-03] 성공 토스트는 3초 후 사라지고 실패 토스트는 닫기 전까지 남는다', () => {
  vi.useFakeTimers();
  render(<Toaster />);

  act(() => {
    useToastStore.getState().showToast('success', '저장했습니다');
    useToastStore.getState().showToast('error', '저장에 실패했습니다');
  });

  expect(screen.getByRole('status').textContent).toContain('저장했습니다');
  expect(screen.getByRole('alert').textContent).toContain('저장에 실패했습니다');

  act(() => vi.advanceTimersByTime(3000));

  expect(screen.queryByText('저장했습니다')).toBeNull();
  expect(screen.getByRole('alert').textContent).toContain('저장에 실패했습니다');

  act(() => vi.advanceTimersByTime(60_000));
  expect(screen.getByRole('alert')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: '알림 닫기' }));

  expect(screen.queryByRole('alert')).toBeNull();
  expect(useToastStore.getState().toasts).toEqual([]);
});

test('[CMP-03] 토스트가 없으면 알림을 렌더하지 않는다', () => {
  render(<Toaster />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('button', { name: '알림 닫기' })).toBeNull();
});
