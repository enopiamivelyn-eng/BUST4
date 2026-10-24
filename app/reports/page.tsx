'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import AuthGate from '../components/AuthGate';
import { useAuth } from '../components/AuthContext';
import Navbar from '../components/Navbar';
import { formatPrice } from '@/lib/routes';

interface ReportData {
  soldThisWeek: number;
  revenueThisWeek: number;
  activeReservations: number;
  occupancy: number;
  upcomingTrips: number;
}

const icons = [
  <><path d="M3 8.5V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2.5" /><path d="M3 8.5a1.8 1.8 0 0 0 0 3V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5a1.8 1.8 0 0 1 0-3" /></>,
  <><rect x="2.5" y="5" width="15" height="10" rx="2.5" /><path d="M2.5 9h15" /></>,
  <><circle cx="10" cy="10" r="7.5" /><path d="M10 5.5V10l3 2" /></>,
  <><path d="M5 4v8a2 2 0 0 0 2 2h6" /><path d="M5 16h10" /><path d="M14 8h1.5A1.5 1.5 0 0 1 17 9.5V16" /></>,
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = () => fetch('/api/admin/reports', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load reports.');
        if (active) setReport(data);
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load reports.'); });
    load();
    const interval = window.setInterval(load, 10000);
    window.addEventListener('app:database-change', load);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('app:database-change', load);
    };
  }, []);

  const tiles = report ? [
    { label: 'Tickets sold this week', value: String(report.soldThisWeek) },
    { label: 'Paid revenue this week', value: formatPrice(report.revenueThisWeek) },
    { label: 'Active reservations', value: String(report.activeReservations) },
    { label: 'Upcoming seat occupancy', value: `${report.occupancy}%` },
  ] : [];

  return (
    <AuthGate>
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={user?.name ?? 'Traveller'} />
          <main className="ds-page">
            <div className="ds-mb">
              <h1 className="ds-page-title">Reports</h1>
              <p className="ds-page-sub">Live booking, revenue, and occupancy totals</p>
            </div>
            {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
            {!report && !error ? <p className="ds-note">Loading report data…</p> : (
              <div className="ds-stats ds-mb">
                {tiles.map((tile, index) => (
                  <div key={tile.label} className="ds-stat">
                    <span className="ds-stat-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icons[index]}</svg>
                    </span>
                    <span className="ds-stat-body"><strong>{tile.value}</strong><span>{tile.label}</span></span>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
