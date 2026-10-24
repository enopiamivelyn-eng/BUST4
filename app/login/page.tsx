'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GuestNavbar from '../components/GuestNavbar';
import { useAuth } from '../components/AuthContext';
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  // A valid session goes straight to the protected dashboard.
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (otpRequired) {
        const response = await fetch('/api/auth/login', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, token: otp }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'The code is invalid or expired.');
          return;
        }
        await refreshUser();
        router.replace('/dashboard');
      } else {
        const result = await signIn(email, password);
        if (result.success && result.otpRequired) {
          setOtpRequired(true);
          setResendSeconds(60);
        } else setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, flow: 'login' }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Could not resend the code.');
      else setResendSeconds(60);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="ds-app ds-app-auth">
      <GuestNavbar activeLabel="Log in" showSiteLinks activeSiteLabel={null} />

      <main className="ds-auth-center">
          <div className="ds-auth-card">
            <div className="ds-auth-icon" aria-hidden="true">
              <Image src="/BUSLOGO.png" alt="Bus Ticket" width={512} height={512} />
            </div>

            <div className="ds-auth-head">
              <h1 className="ds-auth-title">Welcome Back!</h1>
              <p className="ds-auth-sub">
                {otpRequired ? `Enter the verification code sent to ${email}.` : 'Log in to your account and continue booking your next trip.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="ds-form">
              {error && (
                <div className="ds-alert ds-alert-error">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="10" cy="10" r="7.5" />
                    <path d="M10 6v4M10 13.5v.5" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {!otpRequired && <>
              <div className="ds-field">
                <label htmlFor="email" className="ds-label">Email</label>
                <span className="ds-input-wrap">
                  <span className="ds-input-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                      <rect x="2.5" y="5" width="15" height="10" rx="2" />
                      <path d="M3 6.5 10 11l7-4.5" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="ds-input"
                    required
                  />
                </span>
              </div>

              <div className="ds-field">
                <label htmlFor="password" className="ds-label">Password</label>
                <span className="ds-input-wrap has-trailing">
                  <span className="ds-input-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                      <rect x="4" y="9" width="12" height="8" rx="2" />
                      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="ds-input"
                    required
                  />
                  <PasswordVisibilityToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((visible) => !visible)}
                  />
                </span>
              </div>

              <div className="ds-form-row">
                <label className="ds-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link href="/forgot-password" className="ds-link">
                  Forgot password?
                </Link>
              </div>
              </>}

              {otpRequired && <div className="ds-field">
                <label htmlFor="login-otp" className="ds-label">Email verification code</label>
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="([0-9]{6}|[0-9]{8})"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Enter verification code"
                  className="ds-input"
                  required
                />
                <button type="button" className="ds-link" onClick={resendOtp} disabled={isResending || resendSeconds > 0}>
                  {isResending ? 'Sending…' : 'Resend code'}
                </button>
                {resendSeconds > 0 && <span aria-live="polite">Resend code available in {resendSeconds}s</span>}
              </div>}

              <button type="submit" className="ds-btn ds-btn-primary ds-btn-block" disabled={isSubmitting}>
                {isSubmitting ? (otpRequired ? 'Verifying…' : 'Sending code…') : (otpRequired ? 'Verify and log in' : 'Log in')}
              </button>

              {!otpRequired && <>
              <div className="ds-divider">or</div>

              <Link href="/signup" className="ds-btn ds-btn-outline ds-btn-block">
                Create New Account
              </Link>
              </>}
            </form>
          </div>
        </main>
    </div>
  );
}
