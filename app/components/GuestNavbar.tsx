'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from './AuthContext';

export interface GuestNavbarProps {
  /** Where the auth buttons should send the user — defaults to the login page. */
  activeLabel?: 'Log in' | 'Sign up';
  /** Show the public landing page navigation links. */
  showSiteLinks?: boolean;
  /** Highlight the active link in the public navigation. */
  activeSiteLabel?: 'Home' | 'Online Booking' | 'About Us' | null;
}

/**
 * Top bar for signed-out visitors. Unlike <Navbar> it has no search field,
 * no status cluster and no sidebar beside it — a guest sees only the brand
 * lockup plus the Log in / Sign up actions.
 */
export default function GuestNavbar({ activeLabel, showSiteLinks = false, activeSiteLabel = 'Home' }: GuestNavbarProps) {
  const { user, loading } = useAuth();
  const signedIn = Boolean(user) && !loading;

  return (
    <header className={`ds-nav ds-nav-guest ${showSiteLinks ? 'ds-nav-landing' : ''}`}>
      <Link href="/" className="ds-guest-brand">
        <span className="ds-guest-brand-logo">
          <Image
            src="/BUSLOGO.png"
            alt="Bus Ticket"
            width={512}
            height={512}
            priority
          />
        </span>
        <span className="ds-guest-brand-text">
          <strong>Bus Ticket</strong>
          <span>Management System</span>
        </span>
      </Link>

      {showSiteLinks && (
        <nav className="ds-site-links" aria-label="Main navigation">
          <Link href="/" aria-current={activeSiteLabel === 'Home' ? 'page' : undefined}>Home</Link>
          <Link href="/reserve" aria-current={activeSiteLabel === 'Online Booking' ? 'page' : undefined}>Online Booking</Link>
          <Link href="/search">Schedules</Link>
          <Link href="/routes">Routes</Link>
          <Link href="/about" aria-current={activeSiteLabel === 'About Us' ? 'page' : undefined}>About Us</Link>
        </nav>
      )}

      <nav className="ds-guest-actions" aria-label="Account">
        {signedIn ? (
          <Link href="/home" className="ds-btn ds-btn-primary ds-btn-sm">
            Go to Home
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className={`ds-btn ds-btn-sm ${
                activeLabel === 'Log in' ? 'ds-btn-primary' : 'ds-btn-outline'
              }`}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={`ds-btn ds-btn-sm ${
                activeLabel === 'Sign up' ? 'ds-btn-primary' : 'ds-btn-outline'
              }`}
            >
              Sign up
            </Link>
          </>
        )}
        {showSiteLinks && !signedIn && (
          <Link href="/reserve" className="ds-btn ds-btn-primary ds-btn-sm ds-book-now">
            Book Now
          </Link>
        )}
      </nav>
    </header>
  );
}
