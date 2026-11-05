import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { logger } from '../lib/logger';

export type Locale = 'ko' | 'ja' | 'en';

// PQ-06: 저장값이 없으면 브라우저 언어, 지원 밖이면 한국어
function detectLocale(): Locale {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('en')) return 'en';
  return 'ko';
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'todolist-locale',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);

function syncHtmlLang(locale: Locale): void {
  document.documentElement.lang = locale;
}
syncHtmlLang(useLocaleStore.getState().locale);
useLocaleStore.subscribe((s, prev) => {
  if (s.locale !== prev.locale) logger.info('settings', `언어: ${prev.locale} → ${s.locale}`);
  syncHtmlLang(s.locale);
});
