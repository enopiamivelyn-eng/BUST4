import Link from 'next/link';
import GuestNavbar from '../components/GuestNavbar';

export const metadata = {
  title: 'Sign in',
};

export default function SignInPage() {
  return (
    <div className="ds-app ds-app-auth">
      <GuestNavbar activeLabel="Log in" showSiteLinks activeSiteLabel={null} />

      <main className="ds-auth-center">
        <section className="ds-auth-hero">
          <h2 className="ds-auth-hero-title">
            Travel Made
            <br />
            Easier
          </h2>
          <p className="ds-auth-hero-sub">
            Book Your Bus Tickets
            <br />
            Anytime, Anywhere
          </p>
        </section>

          <div className="ds-auth-card">
            <div className="ds-auth-head">
              <h1 className="ds-auth-title">Sign In</h1>
              <p className="ds-auth-sub">
                Access your bookings and e-tickets
              </p>
            </div>

            <div className="ds-form">
              <Link href="/login" className="ds-btn ds-btn-primary ds-btn-block">
                Continue with Email
              </Link>

              <div className="ds-divider">or</div>

              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-block"
                disabled
              >
                Continue with Google (coming soon)
              </button>
            </div>

            <p className="ds-form-foot" style={{ marginTop: '1.2rem' }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="ds-link">
                Sign up
              </Link>
            </p>
          </div>
        </main>
    </div>
  );
}
