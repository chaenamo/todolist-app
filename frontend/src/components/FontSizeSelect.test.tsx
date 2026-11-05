import { afterEach, expect, test } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useLocaleStore } from '../stores/localeStore';
import { useThemeStore } from '../stores/themeStore';
import { FontSizeSelect } from './FontSizeSelect';

afterEach(() => {
  cleanup();
});

test('[FE-17] 글자 크기 select로 작게/중간/크게를 바꾸고, 문구는 언어를 따른다', () => {
  render(<FontSizeSelect />);
  const select = screen.getByLabelText('글자 크기') as HTMLSelectElement;
  expect(Array.from(select.options).map((o) => o.textContent)).toEqual(['작게', '중간', '크게']);
  expect(select.value).toBe('medium');

  fireEvent.change(select, { target: { value: 'small' } });
  expect(useThemeStore.getState().fontSize).toBe('small');
  expect(document.documentElement.dataset.fontSize).toBe('small');

  act(() => useLocaleStore.getState().setLocale('en'));
  expect(screen.getByLabelText('Text size')).toBeTruthy();
  expect(screen.getByText('Large')).toBeTruthy();
});
