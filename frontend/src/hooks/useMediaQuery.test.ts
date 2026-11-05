import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('[G-14] window.matchMedia가 없으면 false를 반환한다', () => {
  vi.stubGlobal('matchMedia', undefined);
  const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
  expect(result.current).toBe(false);
});

test('[G-14] matchMedia(query).matches를 반환하고 change 이벤트에 다시 렌더링한다', () => {
  let listener: ((e: { matches: boolean }) => void) | null = null;
  const mql = {
    matches: true,
    addEventListener: vi.fn((_: string, fn: (e: { matches: boolean }) => void) => {
      listener = fn;
    }),
    removeEventListener: vi.fn(),
  };
  const matchMedia = vi.fn(() => mql);
  vi.stubGlobal('matchMedia', matchMedia);

  const { result, unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
  expect(matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  expect(result.current).toBe(true);
  expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

  act(() => {
    mql.matches = false;
    listener!({ matches: false });
  });
  expect(result.current).toBe(false);

  act(() => {
    mql.matches = true;
    listener!({ matches: true });
  });
  expect(result.current).toBe(true);

  unmount();
  expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});
