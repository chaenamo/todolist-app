import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { TOAST_SUCCESS_MS, useToastStore } from './toastStore';

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

test('[CMP-03] showToast는 토스트를 추가하고 증가하는 id를 반환한다', () => {
  const a = useToastStore.getState().showToast('success', '저장했습니다');
  const b = useToastStore.getState().showToast('error', '실패했습니다');

  expect(b).toBeGreaterThan(a);
  expect(useToastStore.getState().toasts).toEqual([
    { id: a, kind: 'success', message: '저장했습니다' },
    { id: b, kind: 'error', message: '실패했습니다' },
  ]);
});

test('[CMP-03] 성공 토스트는 TOAST_SUCCESS_MS(3000ms)에 정확히 사라진다', () => {
  expect(TOAST_SUCCESS_MS).toBe(3000);
  useToastStore.getState().showToast('success', '저장했습니다');

  vi.advanceTimersByTime(2999);
  expect(useToastStore.getState().toasts).toHaveLength(1);

  vi.advanceTimersByTime(1);
  expect(useToastStore.getState().toasts).toHaveLength(0);
});

test('[CMP-03] 실패 토스트는 시간이 지나도 자동으로 사라지지 않는다', () => {
  useToastStore.getState().showToast('error', '실패했습니다');

  vi.advanceTimersByTime(60_000);
  expect(useToastStore.getState().toasts).toHaveLength(1);
});

test('[CMP-03] dismissToast는 해당 id만 제거한다', () => {
  const a = useToastStore.getState().showToast('error', '첫째');
  const b = useToastStore.getState().showToast('error', '둘째');

  useToastStore.getState().dismissToast(a);

  expect(useToastStore.getState().toasts.map((t) => t.id)).toEqual([b]);
});

test('[CMP-03] 없는 id로 dismissToast하면 아무것도 바뀌지 않는다', () => {
  const a = useToastStore.getState().showToast('error', '실패했습니다');

  useToastStore.getState().dismissToast(a + 999);

  expect(useToastStore.getState().toasts.map((t) => t.id)).toEqual([a]);
});

test('[CMP-03] 먼저 닫은 성공 토스트의 타이머가 끝나도 다른 토스트는 남는다', () => {
  const a = useToastStore.getState().showToast('success', '성공');
  useToastStore.getState().dismissToast(a);
  const b = useToastStore.getState().showToast('error', '실패');

  vi.advanceTimersByTime(TOAST_SUCCESS_MS);

  expect(useToastStore.getState().toasts.map((t) => t.id)).toEqual([b]);
});
