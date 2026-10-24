import Link from 'next/link';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  /** Rendered between the search bar and the status cluster (e.g. Sign in / Log in). */
  actions?: React.ReactNode;
  /** Rendered instead of the default identity block. */
  user?: { name: string; role: string };
  /** Small labelled stats shown on the right, matching the reference mockup. */
  stats?: { label: string; value: string; icon: 'calendar' | 'clock' | 'pin' }[];
}

const statIcons = {
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="13" height="12" rx="2.5" />
      <path d="M7 3v3M13 3v3M3.5 9h13" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 1.5" />
    </>
  ),
  pin: (
    <>
      <path d="M10 17s5-4.2 5-8a5 5 0 0 0-10 0c0 3.8 5 8 5 8Z" />
      <circle cx="10" cy="9" r="1.8" />
    </>
  ),
};

/**
 * Light top bar used across the app: route search on the left, live status /
 * user cluster on the right. Sits above the dark sidebar, as in the mockup.
 */
export default function Navbar({ actions, user, stats }: NavbarProps) {
  return (
    <header className="ds-nav">
      <div className="ds-search">
        <span className="ds-search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="9" cy="9" r="6" />
            <path d="M17 17l-4-4" />
          </svg>
        </span>
        <input
          type="search"
          className="ds-search-input"
          placeholder="Search routes, buses, trips, or booking ID..."
          aria-label="Search routes, buses, trips, or booking ID"
        />
      </div>

      <div className="ds-nav-right">
        {stats?.map((stat) => (
          <div key={stat.label} className="ds-nav-stat">
            <span className="ds-nav-stat-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {statIcons[stat.icon]}
              </svg>
            </span>
            <span className="ds-nav-stat-text">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </span>
          </div>
        ))}

        {actions}

        {!actions && (
          <>
            {user && <NotificationBell />}

            <Link href={user ? '/profile' : '/login'} className="ds-user">
              <span className="ds-user-avatar" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="10" cy="7" r="3.2" />
                  <path d="M4.5 17c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
                </svg>
              </span>
              <span className="ds-user-text">
                <strong>{user?.name ?? 'Sign in'}</strong>
                <span>{user?.role ?? 'Guest'}</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 8l5 5 5-5" />
              </svg>
            </Link>
          </>
        )}

        {actions && (
          <Link href="/profile" className="ds-user">
            <span className="ds-user-avatar" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="10" cy="7" r="3.2" />
                <path d="M4.5 17c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
              </svg>
            </span>
            <span className="ds-user-text">
              <strong>{user?.name ?? 'Admin'}</strong>
              <span>{user?.role ?? 'Administrator'}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 8l5 5 5-5" />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
