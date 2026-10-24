'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AuthGate from '../components/AuthGate';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../components/AuthContext';
import { formatScheduleTime } from '@/lib/schedule';
import { formatPrice } from '@/lib/routes';
import { displayBookingStatus, isApprovedBookingStatus } from '@/lib/booking-status';

interface Reservation {
  id: string;
  seatNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalAmount: number;
  trip: {
    route: { name: string; fromCity: string; toCity: string };
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    bus: { busNumber: string; model: string };
  };
}

function manilaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function prettyDate(value: string) {
  return new Date(`${value}T12:00:00+08:00`).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function ReservationsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = useMemo(manilaToday, []);

  useEffect(() => {
    let active = true;
    const load = () => fetch('/api/bookings', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load reservations.');
        if (active) setBookings(data.bookings || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load reservations.');
      })
      .finally(() => { if (active) setLoading(false); });
    load();
    const interval = window.setInterval(load, 10000);
    window.addEventListener('app:database-change', load);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('app:database-change', load);
    };
  }, []);

  const upcoming = bookings.filter((booking) =>
    booking.status !== 'cancelled' && booking.trip.departureDate >= today,
  );

  return (
    <AuthGate>
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={user?.name ?? 'Traveller'} />
          <main className="ds-page">
            <div className="ds-mb">
              <h1 className="ds-page-title">Reservations</h1>
              <p className="ds-page-sub">Your upcoming bus trips, seats, and reservation status.</p>
            </div>
            {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
            {loading ? <p className="ds-note">Loading reservations…</p> : upcoming.length ? (
              <div className="ds-route-grid">
                {upcoming.map((booking) => (
                  <article className="ds-card ds-card-pad" key={booking.id}>
                    <div className="ds-section-head">
                      <div><h2 className="ds-card-title">{booking.trip.route.fromCity} → {booking.trip.route.toCity}</h2><p className="ds-section-sub">{booking.trip.route.name}</p></div>
                      <span className={`ds-badge ${isApprovedBookingStatus(booking.status) ? 'ds-badge-green' : 'ds-badge-amber'}`}>{displayBookingStatus(booking.status)}</span>
                    </div>
                    <dl className="ds-search-details">
                      <div><dt>Travel date</dt><dd>{prettyDate(booking.trip.departureDate)}</dd></div>
                      <div><dt>Departure</dt><dd>{formatScheduleTime(booking.trip.departureTime)}</dd></div>
                      <div><dt>Bus</dt><dd>{booking.trip.bus.busNumber} · {booking.trip.bus.model}</dd></div>
                      <div><dt>Seat{booking.seatNumber.includes(',') ? 's' : ''}</dt><dd>{booking.seatNumber}</dd></div>
                      <div><dt>Payment</dt><dd>{booking.paymentStatus}{booking.paymentMethod ? ` · ${booking.paymentMethod}` : ''}</dd></div>
                      <div><dt>Total</dt><dd>{formatPrice(booking.totalAmount)}</dd></div>
                    </dl>
                    <div className="ds-row-actions">
                      {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && <Link className="ds-btn ds-btn-primary" href={`/payment?bookingId=${encodeURIComponent(booking.id)}`}>Complete payment</Link>}
                      <Link className="ds-btn ds-btn-soft" href={`/reservation?bookingId=${encodeURIComponent(booking.id)}`}>View reservation</Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="ds-empty"><h2>No upcoming reservations</h2><p>Search the timetable and reserve a seat for your next trip.</p><Link href="/reserve" className="ds-btn ds-btn-primary">Search bus trips</Link></div>
            )}
            <p className="ds-note ds-mt"><Link href="/bookings" className="ds-link">View your full booking history</Link></p>
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
