import { expect, test } from 'vitest';
import { useLocaleStore } from '../stores/localeStore';
import { LOCALES, categoryName, getMessages } from '.';
import en from './en';
import ja from './ja';
import ko from './ko';

// 중첩 객체의 키 경로와 값 종류(문자열/함수)를 평탄화한다
function shape(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? shape(v, `${prefix}${k}.`)
      : [`${prefix}${k}:${typeof v}`],
  );
}

test('[FE-14] ko·ja·en 사전은 같은 키와 값 종류를 가진다', () => {
  expect(shape(ja)).toEqual(shape(ko));
  expect(shape(en)).toEqual(shape(ko));
});

test('[FE-14] 보간 함수는 인자를 문구에 넣고, 언어 목록은 고유 이름을 가진다', () => {
  for (const dict of [ko, ja, en]) {
    for (const fn of [
      dict.todo.completeLabel,
      dict.todo.editLabel,
      dict.todo.deleteLabel,
      dict.category.renameLabel,
      dict.category.deleteLabel,
      dict.category.deleteTitle,
      dict.category.deleteMessage,
    ]) {
      expect(fn('ZZ')).toContain('ZZ');
    }
  }
  expect(LOCALES.map((l) => l.label)).toEqual(['한국어', '日本語', 'English']);
});

test('[FE-14] getMessages는 현재 언어의 사전을 돌려준다', () => {
  expect(getMessages()).toBe(ko);
  useLocaleStore.getState().setLocale('en');
  expect(getMessages()).toBe(en);
  useLocaleStore.getState().setLocale('ja');
  expect(getMessages()).toBe(ja);
});

test('[PQ-07] 기본 카테고리만 사전 이름으로 표시하고 사용자 카테고리는 저장된 이름 그대로다', () => {
  expect(categoryName({ name: '기본', isDefault: true }, en)).toBe('Default');
  expect(categoryName({ name: '업무', isDefault: false }, en)).toBe('업무');
});
