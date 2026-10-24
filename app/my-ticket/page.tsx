'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AuthGate from '../components/AuthGate';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../components/AuthContext';
import { formatScheduleTime } from '@/lib/schedule';
import { formatPrice } from '@/lib/routes';
import { useLiveDatabaseRefresh } from '../components/useLiveDatabaseRefresh';
import { displayBookingStatus, APPROVED_BOOKING_STATUSES, COMPLETED_BOOKING_STATUSES } from '@/lib/booking-status';

interface TicketBooking {
  id: string;
  route: string;
  from: string;
  to: string;
  date: string;
  time: string;
  seatNumber: string;
  busNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
}

export default function MyTicketPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTickets = useCallback(async () => {
    try {
      const requestOptions = { credentials: 'include' as const, cache: 'no-store' as const };
      let response = await fetch('/api/bookings', requestOptions);
      if (response.status === 401) {
        const session = await fetch('/api/auth/me', requestOptions);
        if (session.ok) response = await fetch('/api/bookings', requestOptions);
      }
      if (response.status === 401) {
        setTickets([]);
        setError('Your sign-in session expired. Log in again to view tickets.');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load tickets.');
      // Approved terminal-pay bookings are tickets too; payment is checked at boarding.
      setTickets((data.bookings || []).filter((booking: TicketBooking) => [...APPROVED_BOOKING_STATUSES, ...COMPLETED_BOOKING_STATUSES].includes(booking.status as never)));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveDatabaseRefresh(() => { void loadTickets(); });

  useEffect(() => {
    void loadTickets();
    const interval = window.setInterval(() => { void loadTickets(); }, 8000);
    return () => window.clearInterval(interval);
  }, [loadTickets]);

  return (
    <AuthGate>
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={user?.name ?? 'Traveller'} />
          <main className="ds-page">
            <div className="ds-mb"><h1 className="ds-page-title">My Tickets</h1><p className="ds-page-sub">Open or download the QR ticket for your bookings.</p></div>
            {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
            {loading ? <p className="ds-note">Loading tickets…</p> : tickets.length ? (
              <div className="ds-route-grid">
                {tickets.map((ticket) => (
                  <article key={ticket.id} className="ds-card ds-card-pad">
                    <div className="ds-section-head">
                      <div><h2 className="ds-card-title">{ticket.from} → {ticket.to}</h2><p className="ds-section-sub">{ticket.route}</p></div>
                      <span className={`ds-badge ds-badge-green`}>{displayBookingStatus(ticket.status)}</span>
                    </div>
                    <p><strong>{ticket.date}</strong> · {formatScheduleTime(ticket.time)}</p>
                    <p>Bus {ticket.busNumber} · Seat {ticket.seatNumber}</p>
                    <p>{formatPrice(ticket.totalAmount)} · {ticket.paymentStatus}</p>
                    <Link href={`/reservation?bookingId=${encodeURIComponent(ticket.id)}`} className="ds-btn ds-btn-primary ds-btn-block">View Ticket</Link>
                  </article>
                ))}
              </div>
            ) : <div className="ds-empty"><h2>No approved tickets yet</h2><p>Your QR ticket will appear here after an administrator approves your booking. If you chose terminal payment, pay at the counter before boarding.</p><Link href="/reservations" className="ds-btn ds-btn-primary">View reservations</Link></div>}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
