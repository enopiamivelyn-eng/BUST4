'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import AuthGate from '../components/AuthGate';
import { useAuth } from '../components/AuthContext';
import Navbar from '../components/Navbar';

interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  photoUrl: string;
  dateOfBirth: string;
  address: string;
  city: string;
  postalCode: string;
  preferences: { emailNotifications: boolean; smsNotifications: boolean; promotionalEmails: boolean; bookingReminders: boolean };
}

const emptyProfile: Profile = {
  id: '', email: '', name: '', phone: '', photoUrl: '', dateOfBirth: '', address: '', city: '', postalCode: '',
  preferences: { emailNotifications: true, smsNotifications: false, promotionalEmails: true, bookingReminders: true },
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let current = true;
    if (!user?.id) return;
    setProfile(emptyProfile);
    setLoading(true);
    setError('');
    setNotice('');
    fetch('/api/profile', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load your profile.');
        if (current && data.profile.id === user.id) setProfile(data.profile);
      })
      .catch((loadError) => { if (current) setError(loadError instanceof Error ? loadError.message : 'Could not load your profile.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [user?.id]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setNotice(''); setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save your profile.');
      setProfile(data.profile);
      await refreshUser();
      setEditing(false);
      setEditingPreferences(false);
      setNotice('Your profile was saved to your account.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your profile.');
    } finally { setSaving(false); }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    if (passwordData.newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (passwordData.newPassword !== passwordData.confirmPassword) return setError('New passwords do not match.');
    setPasswordSaving(true);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update password.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice('Password updated successfully.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Could not update password.');
    } finally { setPasswordSaving(false); }
  };

  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const setField = (key: keyof Omit<Profile, 'id' | 'email' | 'preferences'>, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const togglePreference = (key: keyof Profile['preferences']) => setProfile((current) => ({ ...current, preferences: { ...current.preferences, [key]: !current.preferences[key] } }));

  return (
    <AuthGate>
      <div className="ds-app">
        <Navbar user={{ name: profile.name || user?.name || 'Account', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={profile.name || user?.name || 'Account'} />
          <main className="ds-page">
            <div className="ds-mb"><h1 className="ds-page-title">Profile & Settings</h1><p className="ds-page-sub">Manage your personal information and account settings.</p></div>
            {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
            {notice && <div className="ds-alert ds-alert-success" role="status">{notice}</div>}
            {loading || profile.id !== user?.id ? <p className="ds-note">Loading your accountâ€¦</p> : <>
              <section className="ds-profile-banner ds-mb">
                <div className="ds-profile-identity">
                  {profile.photoUrl ? <img src={profile.photoUrl} alt={`${profile.name}'s profile`} className="ds-account-photo" /> : <span className="ds-profile-avatar" aria-label={`${profile.name} initials`}>{initials || 'U'}</span>}
                  <div><h2>{profile.name}</h2></div>
                </div>
              </section>

              <form onSubmit={saveProfile} className="ds-form" style={{ gap: '1.2rem' }}>
                <section className="ds-card ds-card-pad">
                  <div className="ds-card-head"><h2 className="ds-card-title">Personal information</h2><button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={() => setEditing((value) => !value)}>{editing ? 'Cancel edit' : 'Edit profile'}</button></div>
                  <div className="ds-trip-grid">
                    <div className="ds-field"><label htmlFor="profile-name" className="ds-label">Full name</label><input id="profile-name" className="ds-input" autoComplete="name" value={profile.name} onChange={(event) => setField('name', event.target.value)} disabled={!editing} required maxLength={100} /></div>
                    <div className="ds-field"><label htmlFor="profile-email" className="ds-label">Email</label><input id="profile-email" type="email" className="ds-input" value={profile.email} disabled readOnly /></div>
                    <div className="ds-field"><label htmlFor="profile-phone" className="ds-label">Phone</label><input id="profile-phone" type="tel" autoComplete="tel" className="ds-input" value={profile.phone} onChange={(event) => setField('phone', event.target.value)} disabled={!editing} maxLength={40} /></div>
                    <div className="ds-field"><label htmlFor="profile-dob" className="ds-label">Date of birth</label><input id="profile-dob" type="date" className="ds-input" value={profile.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)} disabled={!editing} /></div>
                    <div className="ds-field"><label htmlFor="profile-address" className="ds-label">Address</label><input id="profile-address" autoComplete="street-address" className="ds-input" value={profile.address} onChange={(event) => setField('address', event.target.value)} disabled={!editing} maxLength={250} /></div>
                    <div className="ds-field"><label htmlFor="profile-city" className="ds-label">City / Location</label><input id="profile-city" autoComplete="address-level2" className="ds-input" value={profile.city} onChange={(event) => setField('city', event.target.value)} disabled={!editing} maxLength={100} /></div>
                    <div className="ds-field"><label htmlFor="profile-postal" className="ds-label">Postal code</label><input id="profile-postal" autoComplete="postal-code" className="ds-input" value={profile.postalCode} onChange={(event) => setField('postalCode', event.target.value)} disabled={!editing} maxLength={20} /></div>
                    <div className="ds-field"><label htmlFor="profile-photo" className="ds-label">Profile photo URL (HTTPS)</label><input id="profile-photo" type="url" className="ds-input" value={profile.photoUrl} onChange={(event) => setField('photoUrl', event.target.value)} disabled={!editing} placeholder="https://â€¦" /></div>
                  </div>
                  {editing && <div className="ds-row-actions"><button type="submit" className="ds-btn ds-btn-primary" disabled={saving}>{saving ? 'Savingâ€¦' : 'Save profile'}</button></div>}
                </section>

                <section className="ds-card ds-card-pad">
                  <div className="ds-card-head"><h2 className="ds-card-title">Account settings</h2><button type="button" className="ds-btn ds-btn-outline ds-btn-sm" onClick={() => setEditingPreferences((value) => !value)}>{editingPreferences ? 'Cancel edit' : 'Edit settings'}</button></div>
                  {(['emailNotifications', 'smsNotifications', 'promotionalEmails', 'bookingReminders'] as const).map((key) => (
                    <label key={key} className="ds-pref"><span>{({ emailNotifications: 'Email notifications', smsNotifications: 'SMS notifications', promotionalEmails: 'Promotional emails', bookingReminders: 'Booking reminders' })[key]}</span><input type="checkbox" checked={profile.preferences[key]} disabled={!editingPreferences} onChange={() => togglePreference(key)} aria-label={({ emailNotifications: 'Email notifications', smsNotifications: 'SMS notifications', promotionalEmails: 'Promotional emails', bookingReminders: 'Booking reminders' })[key]} /></label>
                  ))}
                  {editingPreferences && <button type="submit" className="ds-btn ds-btn-primary ds-mt" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>}
                </section>

              </form>

              <form onSubmit={updatePassword} className="ds-card ds-card-pad ds-form ds-mt">
                <h2 className="ds-card-title">Change password</h2>
                <div className="ds-field"><label htmlFor="current-password" className="ds-label">Current password</label><input id="current-password" type="password" autoComplete="current-password" className="ds-input" value={passwordData.currentPassword} onChange={(event) => setPasswordData({ ...passwordData, currentPassword: event.target.value })} required /></div>
                <div className="ds-trip-grid">
                  <div className="ds-field"><label htmlFor="new-password" className="ds-label">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} className="ds-input" value={passwordData.newPassword} onChange={(event) => setPasswordData({ ...passwordData, newPassword: event.target.value })} required /></div>
                  <div className="ds-field"><label htmlFor="confirm-password" className="ds-label">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} className="ds-input" value={passwordData.confirmPassword} onChange={(event) => setPasswordData({ ...passwordData, confirmPassword: event.target.value })} required /></div>
                </div>
                <button type="submit" className="ds-btn ds-btn-primary" disabled={passwordSaving}>{passwordSaving ? 'Updatingâ€¦' : 'Update password'}</button>
              </form>
            </>}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
