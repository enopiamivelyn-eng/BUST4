'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GuestNavbar from '../components/GuestNavbar';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get('email') || '');
  }, []);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code, flow: 'signup' }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'The code is invalid or expired.');
      else setVerified(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, flow: 'signup' }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Could not resend the code.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="ds-app">
      <GuestNavbar activeLabel="Sign up" showSiteLinks activeSiteLabel={null} />
      <main className="ds-auth">
        <section className="ds-auth-card">
          <div className="ds-auth-head">
            <h1 className="ds-auth-title">{verified ? 'Email verified' : 'Verify your email'}</h1>
            <p className="ds-auth-sub">
              {verified ? 'Your account is active. You can now log in.' : `Enter the verification code sent to ${email || 'your email address'}.`}
            </p>
          </div>
          {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
          {verified ? (
            <Link href="/login" className="ds-btn ds-btn-primary ds-btn-block">Go to log in</Link>
          ) : (
            <form className="ds-form" onSubmit={verify}>
              <div className="ds-field">
                <label htmlFor="signup-otp" className="ds-label">Verification code</label>
                <input
                  id="signup-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="([0-9]{6}|[0-9]{8})"
                  maxLength={8}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="ds-input"
                  placeholder="Enter verification code"
                  required
                />
              </div>
              <button type="submit" className="ds-btn ds-btn-primary ds-btn-block" disabled={busy || !email}>
                {busy ? 'Verifying…' : 'Verify email'}
              </button>
              <button type="button" className="ds-btn ds-btn-outline ds-btn-block" onClick={resend} disabled={resending || !email}>
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
