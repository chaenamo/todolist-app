import { beforeEach, expect, test } from 'vitest';
import { useAuthStore } from './authStore';

interface Persisted {
  state: Record<string, unknown>;
}

function persisted(): Persisted {
  return JSON.parse(localStorage.getItem('todolist-auth') ?? 'null') as Persisted;
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
});

test('[U-02][PR-37][R-05] setTokens는 메모리에 둘 다 두고 localStorage에는 refreshToken만 저장한다', () => {
  useAuthStore.getState().setTokens('at-1', 'rt-1');

  expect(useAuthStore.getState().accessToken).toBe('at-1');
  expect(useAuthStore.getState().refreshToken).toBe('rt-1');
  const { state } = persisted();
  expect(state.refreshToken).toBe('rt-1');
  expect('accessToken' in state).toBe(false);
});

test('[PR-16] setAccessToken은 accessToken만 바꾸고 refreshToken은 유지한다', () => {
  useAuthStore.getState().setTokens('at-1', 'rt-1');
  useAuthStore.getState().setAccessToken('at-2');

  expect(useAuthStore.getState().accessToken).toBe('at-2');
  expect(useAuthStore.getState().refreshToken).toBe('rt-1');
  expect('accessToken' in persisted().state).toBe(false);
});

test('[SC-00-E2] clear는 두 토큰을 null로 만들고 저장된 refreshToken도 지운다', () => {
  useAuthStore.getState().setTokens('at-1', 'rt-1');
  useAuthStore.getState().clear();

  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().refreshToken).toBeNull();
  expect(persisted().state.refreshToken ?? null).toBeNull();
});
