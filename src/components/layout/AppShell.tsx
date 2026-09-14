import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Brandmark, Wordmark } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Primitives';
import { useStore, useJourney } from '@/state/store';
import { useTheme } from '@/state/theme';
import { bottomNavItems, navGroups } from './navigation';
import { formatInt } from '@/lib/format';

function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  return (
    <button
      type="button"
      className="btn btn--ghost btn--icon btn--sm"
      onClick={toggle}
      aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
    >
      <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}

function Rail() {
  const { user } = useStore();
  const { leg, level } = useJourney();
  const readyCount = leg?.status === 'ready' ? 1 : 0;

  return (
    <nav className="rail" aria-label="Primary">
      <Link to="/" className="rail__brand">
        <Brandmark />
        <Wordmark />
      </Link>

      <div className="rail__nav">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || user.role === 'admin');
          if (items.length === 0) return null;
          return (
            <div className="navgroup" key={group.label}>
              <p className="navgroup__label">{group.label}</p>
              <div className="navgroup__items">
                {items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className="navlink">
                    <Icon name={item.icon} size={17} />
                    {item.label}
                    {item.to === '/characters' && readyCount > 0 ? (
                      <span className="navlink__badge">{readyCount}</span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rail__foot">
        <ThemeToggle />
        <Link to="/profile" className="userchip">
          <Avatar initials="SO" src={user.avatar} size={36} accent="var(--ember)" />
          <span className="userchip__text">
            <span className="userchip__name">{user.name}</span>
            <span className="userchip__meta">
              Level {level.level} · {level.title}
            </span>
          </span>
        </Link>
      </div>
    </nav>
  );
}

function TopBar() {
  const { totals } = useJourney();
  return (
    <header className="topbar">
      <Link to="/" className="rail__brand" style={{ padding: 0 }}>
        <Brandmark size={30} />
        <Wordmark withTagline={false} />
      </Link>
      <div className="topbar__actions">
        <span className="pill pill--plain numeric">{formatInt(totals.miles)} mi</span>
        <ThemeToggle />
      </div>
    </header>
  );
}

function BottomNavigation() {
  return (
    <nav className="bottomnav" aria-label="Primary">
      <ul className="bottomnav__list">
        {bottomNavItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className="bottomnav__link">
              <Icon name={item.icon} size={20} />
              <span className="bottomnav__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  // A route change is a new page: start it at the top, the way a document would.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Rail />
      <div className="shell__main">
        <TopBar />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
