'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import AuthGate from '../components/AuthGate';
import { useAuth } from '../components/AuthContext';
import { formatScheduleTime } from '@/lib/schedule';
import Navbar from '../components/Navbar';
import QRCode from 'qrcode';
import { formatBookingReference } from '@/lib/booking-reference';
import { useLiveDatabaseRefresh } from '../components/useLiveDatabaseRefresh';
import { displayBookingStatus, APPROVED_BOOKING_STATUSES, COMPLETED_BOOKING_STATUSES } from '@/lib/booking-status';

interface Booking {
  id: string;
  tripId: string;
  seatNumber: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  ticketToken: string | null;
  totalAmount: number;
  bookingDate: string;
  trip: {
    route: {
      name: string;
      fromCity: string;
      toCity: string;
    };
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    bus: {
      busNumber: string;
      model: string;
    };
  };
}

function ReservationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { user } = useAuth();
  const username = user?.name ?? 'Traveller';
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bookingRequestVersion = useRef(0);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) { setLoading(false); return; }
    const requestVersion = ++bookingRequestVersion.current;
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (requestVersion !== bookingRequestVersion.current) return;
        setBooking(data.booking);
        setError('');
        if (![...APPROVED_BOOKING_STATUSES, ...COMPLETED_BOOKING_STATUSES].includes(data.booking.status as never) || !data.booking.ticketToken) {
          setQrCodeUrl('');
          return;
        }
        
        // Generate QR code
        const qrData = `SUNRAYS_TICKET:${data.booking.ticketToken}`;
        
        try {
          const generatedQr = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
          if (requestVersion === bookingRequestVersion.current) setQrCodeUrl(generatedQr);
        } catch {
          if (requestVersion === bookingRequestVersion.current) {
            setQrCodeUrl('');
            setError('The approved booking was loaded, but its QR could not be generated. Please retry.');
          }
        }
      } else {
        const data = await response.json().catch(() => ({}));
        if (requestVersion === bookingRequestVersion.current) {
          if (response.status === 401 || response.status === 403 || response.status === 404) setBooking(null);
          setQrCodeUrl('');
          setError(data.error || 'Failed to load booking details');
        }
      }
    } catch {
      if (requestVersion === bookingRequestVersion.current) {
        setQrCodeUrl('');
        setError('Could not reach the booking service. Please retry.');
      }
    } finally {
      if (requestVersion === bookingRequestVersion.current) setLoading(false);
    }
  }, [bookingId]);

  useLiveDatabaseRefresh(() => { void fetchBooking(); });

  useEffect(() => {
    let active = true;
    const refresh = () => { if (active) void fetchBooking(); };
    refresh();
    // Keep pending reservation pages in sync so approval displays its QR without
    // requiring the passenger to refresh the page.
    // Keep approved tickets fresh too, so a rejected/cancelled status change
    // removes an already displayed QR from an open ticket page.
    const awaitingApprovalOrToken = !booking || ['pending', 'approved', 'confirmed'].includes(booking.status) || (
      [...APPROVED_BOOKING_STATUSES, ...COMPLETED_BOOKING_STATUSES].includes(booking.status as never) && !booking.ticketToken
    );
    const interval = !awaitingApprovalOrToken
      ? undefined
      : window.setInterval(refresh, 8000);
    return () => { active = false; if (interval) window.clearInterval(interval); };
  }, [booking?.status, booking?.ticketToken, fetchBooking]);

  const formatPrice = (amount: number): string => {
    return `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const bookingReference = booking ? formatBookingReference(booking.id, booking.trip.departureDate) : '';
  const isApproved = Boolean(booking && [...APPROVED_BOOKING_STATUSES, ...COMPLETED_BOOKING_STATUSES].includes(booking.status as never));
  const bookingStatusLabel = booking ? displayBookingStatus(booking.status) : '';

  const downloadTicket = async () => {
    if (!booking || !isApproved || !qrCodeUrl) return;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const left = 42;
    const top = 30;
    const width = 816;
    const height = 1390;
    ctx.fillStyle = '#f1f5f2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0b6544';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 26);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#075c3e';
    ctx.beginPath();
    ctx.roundRect(left, top, width, 205, [24, 24, 12, 12]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('B O O K I N G   I D', 92, 88);
    ctx.font = 'bold 58px Arial';
    ctx.fillText(bookingReference, 92, 158, 710);

    const qr = new Image();
    qr.src = qrCodeUrl;
    await new Promise<void>((resolve, reject) => {
      qr.onload = () => resolve();
      qr.onerror = () => reject(new Error('Could not load ticket QR code.'));
    });
    ctx.drawImage(qr, 315, 255, 270, 270);
    ctx.fillStyle = '#075c3e';
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px Arial';
    ctx.fillText('SCAN FOR VERIFICATION', 450, 554);
    ctx.fillText('OR RECEIPT', 450, 580);

    const rule = (y: number) => {
      ctx.strokeStyle = '#b8d5c8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(76, y);
      ctx.lineTo(824, y);
      ctx.stroke();
    };
    const field = (label: string, value: string, x: number, y: number, maxWidth = 730) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#176c4d';
      ctx.font = 'bold 15px Arial';
      ctx.fillText(label.toUpperCase(), x, y);
      ctx.fillStyle = '#172b25';
      ctx.font = 'bold 26px Arial';
      ctx.fillText(value, x, y + 34, maxWidth);
    };

    rule(610);
    field('Passenger name', booking.passengerName, 82, 650);
    rule(708);
    field('Bus number', booking.trip.bus.busNumber, 82, 744);
    rule(802);
    field('From', booking.trip.route.fromCity, 82, 838);
    rule(896);
    field('To', booking.trip.route.toCity, 82, 932);
    rule(990);

    field('Travel date', formatDate(booking.trip.departureDate), 82, 1030, 320);
    field('Departure time', formatScheduleTime(booking.trip.departureTime), 468, 1030, 320);
    ctx.strokeStyle = '#b8d5c8';
    ctx.beginPath();
    ctx.moveTo(450, 1012);
    ctx.lineTo(450, 1090);
    ctx.stroke();
    rule(1104);

    field('Seat number', booking.seatNumber, 82, 1142, 320);
    field('Fare', `PHP ${booking.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 468, 1142, 320);
    ctx.beginPath();
    ctx.moveTo(450, 1124);
    ctx.lineTo(450, 1202);
    ctx.stroke();
    rule(1216);
    field('Payment status', booking.paymentStatus.toUpperCase(), 82, 1254);
    field('Booking status', bookingStatusLabel.toUpperCase(), 82, 1320);
    ctx.textAlign = 'start';

    const link = document.createElement('a');
    link.download = `sunrays-ticket-${bookingReference}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (loading) {
    return (
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={username} />
          <main className="ds-page">
            <div className="ds-empty">
              <div className="loading" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading ticket...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={username} />
          <main className="ds-page">
            <div className="ds-empty">
              <h3>Booking not found</h3>
              <p>The booking you&apos;re looking for doesn&apos;t exist.</p>
              <button 
                onClick={() => router.push('/bookings')}
                className="ds-btn ds-btn-primary"
                style={{ marginTop: '1rem' }}
              >
                View My Bookings
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-app">
      <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />

      <div className="ds-app-body">
        <Sidebar isAuthenticated username={username} />

        <main className="ds-page">
          <div className="ds-section-head">
            <div>
              <h1 className="ds-page-title">My Ticket</h1>
              <p className="ds-page-sub">
                Your e-ticket for the journey
              </p>
            </div>
          </div>

          {booking.status === 'pending' && <div className="ds-alert ds-alert-warning ds-mb" role="status">Your booking is awaiting admin approval. Your QR code ticket will be available once your booking is approved.</div>}
          {booking.status === 'rejected' && <div className="ds-alert ds-alert-error ds-mb" role="alert">Your booking has been rejected. Please contact the administrator for assistance.</div>}
          {booking.status === 'cancelled' && <div className="ds-alert ds-alert-error ds-mb" role="alert">This booking has been cancelled.</div>}
          {isApproved && booking.paymentStatus !== 'paid' && <div className="ds-alert ds-alert-info ds-mb" role="status">Your booking is approved. Present this QR at the terminal and pay there before boarding.</div>}

          {error && (
            <div className="ds-alert ds-alert-error ds-mb">
              <span>{error}</span>
            </div>
          )}

          <article className="ds-ticket-card">
            <header className="ds-ticket-heading">
              <span>BOOKING ID</span>
              <h2>{bookingReference}</h2>
            </header>

            {isApproved && qrCodeUrl && <>
              <div className="ds-ticket-qr">
                <NextImage src={qrCodeUrl} alt="Secure ticket QR code" width={240} height={240} unoptimized />
              </div>
              <p className="ds-ticket-scan-caption">Scan for Verification<br />or Receipt</p>
            </>}
            {isApproved && !qrCodeUrl && <div className="ds-ticket-qr-pending" role="status">Preparing your approved booking QR code... <button type="button" className="ds-btn ds-btn-soft ds-btn-sm" onClick={() => void fetchBooking()}>Refresh ticket</button></div>}

            <div className="ds-ticket-details-wrap">
              <dl className="ds-ticket-fields">
                <div><dt>Passenger name</dt><dd>{booking.passengerName}</dd></div>
                <div><dt>Bus number</dt><dd>{booking.trip.bus.busNumber}</dd></div>
                <div><dt>From</dt><dd>{booking.trip.route.fromCity}</dd></div>
                <div><dt>To</dt><dd>{booking.trip.route.toCity}</dd></div>
                <div className="ds-ticket-field-pair">
                  <div><dt>Travel date</dt><dd>{formatDate(booking.trip.departureDate)}</dd></div>
                  <div><dt>Departure time</dt><dd>{formatScheduleTime(booking.trip.departureTime)}</dd></div>
                </div>
                <div className="ds-ticket-field-pair">
                  <div><dt>Seat number</dt><dd>{booking.seatNumber}</dd></div>
                  <div><dt>Fare</dt><dd>{formatPrice(booking.totalAmount)}</dd></div>
                </div>
                <div><dt>Booking status</dt><dd>{bookingStatusLabel}</dd></div>
                <div><dt>Payment status</dt><dd>{booking.paymentStatus.toUpperCase()}</dd></div>
              </dl>
            </div>

            <footer className="ds-ticket-actions">
              <button type="button" disabled={!isApproved || !qrCodeUrl} onClick={() => void downloadTicket()} className="ds-btn ds-btn-primary">Download ticket as PNG</button>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <AuthGate>
      <Suspense fallback={
        <div className="ds-app">
          <Navbar user={{ name: 'Traveller', role: 'Passenger' }} />
          <div className="ds-app-body">
            <Sidebar isAuthenticated username="Traveller" />
            <main className="ds-page">
              <div className="ds-empty">
                <div className="loading" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading...</p>
              </div>
            </main>
          </div>
        </div>
      }>
        <ReservationContent />
      </Suspense>
    </AuthGate>
  );
}
