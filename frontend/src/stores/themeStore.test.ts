import { beforeEach, expect, test, vi } from 'vitest';

async function freshStore() {
  vi.resetModules();
  return (await import('./themeStore')).useThemeStore;
}

beforeEach(() => {
  localStorage.clear();
});

test('[PQ-08] 저장값이 없으면 라이트, <html data-theme>도 light', async () => {
  const store = await freshStore();
  expect(store.getState().theme).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('[FE-16] 다크로 바꾸면 <html data-theme>가 바뀌고 localStorage(todolist-theme)에 남아 새로 불러와도 유지된다', async () => {
  const store = await freshStore();
  store.getState().setTheme('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');

  const saved = JSON.parse(localStorage.getItem('todolist-theme') ?? '{}') as {
    state: { theme: string };
  };
  expect(saved.state.theme).toBe('dark');
  expect((await freshStore()).getState().theme).toBe('dark');
});

test('[PQ-09] 글자 크기 기본은 medium, 바꾸면 <html data-font-size>와 localStorage에 반영된다', async () => {
  const store = await freshStore();
  expect(store.getState().fontSize).toBe('medium');
  expect(document.documentElement.dataset.fontSize).toBe('medium');

  store.getState().setFontSize('large');
  expect(document.documentElement.dataset.fontSize).toBe('large');
  expect((await freshStore()).getState().fontSize).toBe('large');
  // 모드 설정과 같은 키에 함께 저장된다
  expect((await freshStore()).getState().theme).toBe('light');
});
