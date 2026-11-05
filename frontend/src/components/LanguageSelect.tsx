import { LOCALES, useT, type Locale } from '../i18n';
import { useLocaleStore } from '../stores/localeStore';
import styles from './LanguageSelect.module.css';

export function LanguageSelect() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  return (
    <select
      className={styles.select}
      aria-label={t.language.label}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
    >
      {LOCALES.map((l) => (
        <option key={l.value} value={l.value} lang={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
