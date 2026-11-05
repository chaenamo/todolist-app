import { useLocaleStore, type Locale } from '../stores/localeStore';
import en from './en';
import ja from './ja';
import ko, { type Messages } from './ko';

export type { Locale, Messages };

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
];

const DICTIONARIES: Record<Locale, Messages> = { ko, ja, en };

export function useT(): Messages {
  return DICTIONARIES[useLocaleStore((s) => s.locale)];
}

// React 밖(api, store)에서 현재 언어의 사전을 읽는다
export function getMessages(): Messages {
  return DICTIONARIES[useLocaleStore.getState().locale];
}

// PQ-07: '기본' 카테고리만 사전 이름으로, 사용자 카테고리는 저장된 이름 그대로
export function categoryName(c: { name: string; isDefault: boolean }, t: Messages): string {
  return c.isDefault ? t.common.defaultCategory : c.name;
}
