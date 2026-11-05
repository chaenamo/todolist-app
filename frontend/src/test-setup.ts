import { beforeEach } from 'vitest';
import { useLocaleStore } from './stores/localeStore';

// jsdom의 navigator.language는 en-US이므로 기존 한국어 기준 테스트를 위해 매번 ko로 되돌린다
beforeEach(() => {
  useLocaleStore.getState().setLocale('ko');
});
