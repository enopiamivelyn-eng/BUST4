'use client';

import { useEffect, useState } from 'react';
import AuthGate from '../components/AuthGate';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../components/AuthContext';

interface AccountProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  photoUrl: string;
  dateOfBirth: string;
  address: string;
  city: string;
  postalCode: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/profile', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load settings.');
        if (active) setProfile(data.profile);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load settings.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setNotice('');
    if (password.next.length < 8) return setError('Use at least 8 characters for your new password.');
    if (password.next !== password.confirm) return setError('The new passwords do not match.');
    setSavingPassword(true);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: password.current, newPassword: password.next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update password.');
      setPassword({ current: '', next: '', confirm: '' });
      setNotice('Password updated successfully.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Could not update password.');
    } finally { setSavingPassword(false); }
  };

  return (
    <AuthGate>
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={user?.name ?? 'Traveller'} />
          <main className="ds-page">
            <div className="ds-mb">
              <h1 className="ds-page-title">Settings</h1>
              <p className="ds-page-sub">Manage your password security.</p>
            </div>
            {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
            {notice && <div className="ds-alert ds-alert-success" role="status">{notice}</div>}
            {loading ? <p className="ds-note">Loading settingsâ€¦</p> : profile ? <>
              <form className="ds-card ds-card-pad ds-form" onSubmit={changePassword}>
                <div><h2 className="ds-card-title">Change password</h2><p className="ds-card-sub">Signed in as {profile.email}. Your current password is required.</p></div>
                <div className="ds-field"><label className="ds-label" htmlFor="settings-current-password">Current password</label><input className="ds-input" id="settings-current-password" type="password" autoComplete="current-password" required value={password.current} onChange={(event) => setPassword((value) => ({ ...value, current: event.target.value }))} /></div>
                <div className="ds-trip-grid">
                  <div className="ds-field"><label className="ds-label" htmlFor="settings-new-password">New password</label><input className="ds-input" id="settings-new-password" type="password" minLength={8} autoComplete="new-password" required value={password.next} onChange={(event) => setPassword((value) => ({ ...value, next: event.target.value }))} /></div>
                  <div className="ds-field"><label className="ds-label" htmlFor="settings-confirm-password">Confirm new password</label><input className="ds-input" id="settings-confirm-password" type="password" minLength={8} autoComplete="new-password" required value={password.confirm} onChange={(event) => setPassword((value) => ({ ...value, confirm: event.target.value }))} /></div>
                </div>
                <button type="submit" className="ds-btn ds-btn-primary" disabled={savingPassword}>{savingPassword ? 'Updatingâ€¦' : 'Update password'}</button>
              </form>
            </> : null}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
