import { afterEach, expect, test } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useLocaleStore } from '../stores/localeStore';
import { useThemeStore } from '../stores/themeStore';
import { ThemeSelect } from './ThemeSelect';

afterEach(() => {
  cleanup();
});

test('[FE-16] 화면 모드 select로 라이트/다크를 바꾸고, 문구는 언어를 따른다', () => {
  render(<ThemeSelect />);
  const select = screen.getByLabelText('화면 모드') as HTMLSelectElement;
  expect(Array.from(select.options).map((o) => o.textContent)).toEqual(['라이트', '다크']);
  expect(select.value).toBe('light');

  fireEvent.change(select, { target: { value: 'dark' } });
  expect(useThemeStore.getState().theme).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');

  act(() => useLocaleStore.getState().setLocale('en'));
  expect(screen.getByLabelText('Theme')).toBeTruthy();
  expect(screen.getByText('Dark')).toBeTruthy();
});
