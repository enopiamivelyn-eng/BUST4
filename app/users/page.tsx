'use client';

import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import AuthGate from '../components/AuthGate';
import { useAuth } from '../components/AuthContext';
import Navbar from '../components/Navbar';
import { useLiveDatabaseRefresh } from '../components/useLiveDatabaseRefresh';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load users.');
      setUsers(data.users || []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveDatabaseRefresh(() => { void loadUsers(); });

  useEffect(() => {
    void loadUsers();
    const interval = window.setInterval(() => { void loadUsers(); }, 15000);
    return () => window.clearInterval(interval);
  }, [loadUsers]);

  return (
    <AuthGate>
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={user?.name ?? 'Traveller'} />
          <main className="ds-page">
            <div className="ds-mb">
              <h1 className="ds-page-title">User management</h1>
              <p className="ds-page-sub">Registered accounts and assigned system roles</p>
            </div>
            {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
            {loading ? <p className="ds-note">Loading accounts…</p> : !error && (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Contact</th><th>Role</th><th>Registered</th></tr></thead>
                  <tbody>
                    {users.map((account) => (
                      <tr key={account.id}>
                        <td className="ds-cell-strong">{account.name || '—'}</td>
                        <td>{account.email}</td>
                        <td>{account.phone || '—'}</td>
                        <td>{account.role === 'admin' ? 'Administrator' : 'Passenger'}</td>
                        <td>{new Date(account.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={5}>No accounts found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
