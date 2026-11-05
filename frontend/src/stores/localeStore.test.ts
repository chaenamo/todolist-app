import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// detectLocale은 store 생성 시점에 실행되므로 매번 모듈을 새로 불러온다
async function freshStore(language: string) {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language);
  vi.resetModules();
  return (await import('./localeStore')).useLocaleStore;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('[PQ-06] 저장값이 없으면 브라우저 언어로 정한다: ja → ja, en-US → en, 그 밖 → ko', async () => {
  expect((await freshStore('ja-JP')).getState().locale).toBe('ja');
  localStorage.clear();
  expect((await freshStore('en-US')).getState().locale).toBe('en');
  localStorage.clear();
  expect((await freshStore('fr-FR')).getState().locale).toBe('ko');
});

test('[PQ-06] 언어를 바꾸면 localStorage(todolist-locale)에 저장되고 새로 불러와도 유지된다', async () => {
  const store = await freshStore('en-US');
  store.getState().setLocale('ja');

  const saved = JSON.parse(localStorage.getItem('todolist-locale') ?? '{}') as {
    state: { locale: string };
  };
  expect(saved.state.locale).toBe('ja');
  expect((await freshStore('en-US')).getState().locale).toBe('ja');
});

test('[PQ-06] <html lang>이 초기값과 변경에 맞춰 갱신된다', async () => {
  const store = await freshStore('ja');
  expect(document.documentElement.lang).toBe('ja');
  store.getState().setLocale('en');
  expect(document.documentElement.lang).toBe('en');
});
