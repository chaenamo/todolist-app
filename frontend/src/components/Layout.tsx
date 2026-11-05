import { useId, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { useT } from '../i18n';
import { LanguageSelect } from './LanguageSelect';
import { ThemeSelect } from './ThemeSelect';
import { FontSizeSelect } from './FontSizeSelect';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/todos', key: 'todos' },
  { to: '/calendar', key: 'calendar' },
  { to: '/categories', key: 'categories' },
  { to: '/me', key: 'me' },
] as const;

export function Layout({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const navId = useId();
  const t = useT();

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/todos" className={styles.brand}>
            TodoList
          </Link>
          <button
            type="button"
            className={styles.hamburger}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
            aria-controls={navId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '×' : '☰'}
          </button>
          <nav id={navId} aria-label={t.nav.label} className={styles.nav} data-open={open}>
            <ul className={styles.list}>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {t.nav[item.key]}
                  </NavLink>
                </li>
              ))}
              <li className={styles.langItem}>
                <LanguageSelect />
              </li>
              <li className={styles.langItem}>
                <ThemeSelect />
              </li>
              <li className={styles.langItem}>
                <FontSizeSelect />
              </li>
              <li className={styles.logoutItem}>
                <button
                  type="button"
                  className={`${styles.link} ${styles.logout}`}
                  onClick={onLogout}
                >
                  {t.nav.logout}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
