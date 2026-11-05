import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useT } from '../i18n';
import { useLocaleStore } from '../stores/localeStore';
import { LanguageSelect } from './LanguageSelect';

afterEach(() => {
  cleanup();
});

function Probe() {
  return <p>{useT().nav.logout}</p>;
}

test('[FE-14] 언어 select는 세 언어를 고유 이름으로 보여주고 바꾸면 새로고침 없이 문구가 바뀐다', () => {
  render(
    <>
      <LanguageSelect />
      <Probe />
    </>,
  );
  const select = screen.getByLabelText('언어') as HTMLSelectElement;
  expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
    '한국어',
    '日本語',
    'English',
  ]);
  expect(screen.getByText('로그아웃')).toBeTruthy();

  fireEvent.change(select, { target: { value: 'en' } });
  expect(screen.getByText('Log out')).toBeTruthy();
  expect(screen.getByLabelText('Language')).toBeTruthy();
  expect(useLocaleStore.getState().locale).toBe('en');

  fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'ja' } });
  expect(screen.getByText('ログアウト')).toBeTruthy();
});
