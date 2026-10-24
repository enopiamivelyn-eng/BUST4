'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGate from '../../components/AuthGate';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../components/AuthContext';
import { formatPrice } from '@/lib/routes';
import { useLiveDatabaseRefresh } from '../../components/useLiveDatabaseRefresh';

interface PaymentRecord {
  id: string;
  passengerName: string;
  passengerEmail: string;
  route: string;
  date: string;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  status: string;
}

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/bookings', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load payments.');
      setRecords(data.bookings || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveDatabaseRefresh(() => { void load(); });

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const setPaymentStatus = async (record: PaymentRecord, paymentStatus: 'paid' | 'failed' | 'refunded') => {
    setError('');
    setSavingId(record.id);
    try {
      const response = await fetch(`/api/admin/payments/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update payment status.');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update payment status.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <AuthGate>
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Admin', role: 'Administrator' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={user?.name ?? 'Admin'} />
          <main className="ds-page">
            <div className="ds-mb"><h1 className="ds-page-title">Payment review</h1><p className="ds-page-sub">Verify the actual payment in the provider or terminal before marking it paid. This issues the passenger&apos;s boarding ticket.</p></div>
            {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
            {loading ? <p className="ds-note">Loading payment records…</p> : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead><tr><th>Passenger</th><th>Route / Date</th><th>Method</th><th>Amount</th><th>Payment</th><th>Booking</th><th>Action</th></tr></thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id}>
                        <td><strong>{record.passengerName}</strong><br /><small>{record.passengerEmail}</small></td>
                        <td>{record.route}<br /><small>{record.date}</small></td>
                        <td>{record.paymentMethod || 'Pay at terminal'}</td>
                        <td>{formatPrice(record.totalAmount)}</td>
                        <td><span className={`ds-badge ${record.paymentStatus === 'paid' ? 'ds-badge-green' : 'ds-badge-amber'}`}>{record.paymentStatus}</span></td>
                        <td>{record.status}</td>
                        <td>{record.paymentStatus !== 'paid' && record.paymentStatus !== 'refunded' && <><button className="ds-btn ds-btn-primary ds-btn-sm" type="button" onClick={() => void setPaymentStatus(record, 'paid')} disabled={savingId === record.id}>{savingId === record.id ? 'Saving…' : 'Verify & mark paid'}</button>{record.paymentStatus !== 'failed' && <button className="ds-btn ds-btn-soft ds-btn-sm" style={{ marginLeft: 6 }} type="button" onClick={() => void setPaymentStatus(record, 'failed')} disabled={savingId === record.id}>Mark failed</button>}</>}{record.paymentStatus === 'paid' && <button className="ds-btn ds-btn-soft ds-btn-sm" type="button" onClick={() => void setPaymentStatus(record, 'refunded')} disabled={savingId === record.id}>Refund & cancel</button>}</td>
                      </tr>
                    ))}
                    {!records.length && <tr><td colSpan={7}>No payment records found.</td></tr>}
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
