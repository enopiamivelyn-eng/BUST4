'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import GuestNavbar from '../components/GuestNavbar';
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle';

type Stage = 'email' | 'otp' | 'password' | 'done';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stage, setStage] = useState<Stage>('email');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Could not send the recovery code.');
      else {
        setStage('otp');
        setResendSeconds(60);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ email, token: code, flow: 'recovery' }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'The code is invalid or expired.');
      else setStage('password');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Could not update the password.');
      else setStage('done');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, flow: 'recovery' }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Could not resend the code.');
      else setResendSeconds(60);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ds-app">
      <GuestNavbar activeLabel="Log in" showSiteLinks activeSiteLabel={null} />
      <main className="ds-auth">
        <section className="ds-auth-card">
          <div className="ds-auth-head">
            <h1 className="ds-auth-title">
              {stage === 'email' ? 'Forgot Password' : stage === 'otp' ? 'Verify recovery code' : stage === 'password' ? 'Choose a new password' : 'Password updated'}
            </h1>
            <p className="ds-auth-sub">
              {stage === 'email' ? 'We will send a recovery code to your email.' : stage === 'otp' ? `Enter the verification code sent to ${email}.` : stage === 'password' ? 'Your new password must be at least 8 characters.' : 'Your password was changed successfully.'}
            </p>
          </div>
          {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}

          {stage === 'email' && <form className="ds-form" onSubmit={requestCode}>
            <div className="ds-field">
              <label htmlFor="recovery-email" className="ds-label">Email</label>
              <input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" className="ds-input" required />
            </div>
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-block" disabled={busy}>{busy ? 'Sending…' : 'Send recovery code'}</button>
          </form>}

          {stage === 'otp' && <form className="ds-form" onSubmit={verifyCode}>
            <div className="ds-field">
              <label htmlFor="recovery-code" className="ds-label">Verification code</label>
              <input id="recovery-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="([0-9]{6}|[0-9]{8})" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter verification code" className="ds-input" required />
            </div>
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-block" disabled={busy}>{busy ? 'Verifying…' : 'Verify code'}</button>
            <button type="button" className="ds-btn ds-btn-outline ds-btn-block" onClick={resendCode} disabled={busy || resendSeconds > 0}>
              {busy ? 'Sending…' : resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend code'}
            </button>
          </form>}

          {stage === 'password' && <form className="ds-form" onSubmit={updatePassword}>
            <div className="ds-field">
              <label htmlFor="new-password" className="ds-label">New password</label>
              <div className="ds-password-wrap">
                <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="ds-input" required minLength={8} />
                <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
              </div>
            </div>
            <div className="ds-field">
              <label htmlFor="confirm-password" className="ds-label">Confirm new password</label>
              <div className="ds-password-wrap">
                <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="ds-input" required minLength={8} />
                <PasswordVisibilityToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} />
              </div>
            </div>
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-block" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
          </form>}

          {stage === 'done' && <Link href="/login" className="ds-btn ds-btn-primary ds-btn-block">Go to log in</Link>}
          {stage !== 'done' && <p className="ds-form-foot">Remembered it? <Link href="/login" className="ds-link">Back to log in</Link></p>}
        </section>
      </main>
    </div>
  );
}
