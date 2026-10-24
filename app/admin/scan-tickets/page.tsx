'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AuthGate from '../../components/AuthGate';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../components/AuthContext';
import { formatScheduleTime } from '@/lib/schedule';

type Ticket = { bookingReference: string; passengerName: string; passengerPhone: string; seatNumber: string; route: string; departureDate: string; departureTime: string; busNumber: string; totalAmount: number; paymentStatus: string };
type Result = { valid: boolean; canCheckIn?: boolean; reason: string; ticket?: Ticket };
type Detector = { detect: (video: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };

function ScanTicketsContent() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScannedRef = useRef('');
  const [token, setToken] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const extractToken = (value: string) => value.startsWith('SUNRAYS_TICKET:') ? value.slice('SUNRAYS_TICKET:'.length) : value;
  const verify = useCallback(async (value = token) => {
    const qrToken = extractToken(value.trim());
    if (!qrToken) return;
    setBusy(true); setResult(null);
    try {
      const response = await fetch('/api/tickets/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ token: qrToken }) });
      const data = await response.json();
      setToken(qrToken);
      setResult({ valid: data.valid, canCheckIn: data.canCheckIn, reason: data.reason || data.error || 'Could not verify ticket.', ticket: data.ticket });
    } catch { setResult({ valid: false, reason: 'Could not reach the server. Try again.' }); }
    finally { setBusy(false); }
  }, [token]);
  const verifyRef = useRef(verify);
  const busyRef = useRef(busy);
  useEffect(() => { verifyRef.current = verify; busyRef.current = busy; }, [verify, busy]);

  const checkIn = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/tickets/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) setResult({ valid: false, canCheckIn: false, reason: data.error || 'Could not check in passenger.', ticket: result?.ticket });
      else setResult({ valid: false, canCheckIn: false, reason: 'CHECKED IN — this ticket is now used.', ticket: result?.ticket });
    } catch { setResult({ valid: false, canCheckIn: false, reason: 'Could not reach the server. Try again.', ticket: result?.ticket }); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    let active = true;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = async () => {
      const Barcode = (window as Window & { BarcodeDetector?: new (options?: { formats: string[] }) => Detector }).BarcodeDetector;
      if (!Barcode || !navigator.mediaDevices?.getUserMedia || !videoRef.current) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!active || !videoRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new Barcode({ formats: ['qr_code'] });
        timer = setInterval(async () => {
          if (!active || busyRef.current || !videoRef.current) return;
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue && codes[0].rawValue !== lastScannedRef.current) { lastScannedRef.current = codes[0].rawValue; setToken(extractToken(codes[0].rawValue)); await verifyRef.current(codes[0].rawValue); }
        }, 600);
      } catch { setCameraError('Camera unavailable. Use a USB QR scanner or paste the ticket code below.'); }
    };
    void start();
    return () => { active = false; if (timer) clearInterval(timer); stream?.getTracks().forEach(track => track.stop()); };
  }, []);

  const admin = user?.role === 'admin';
  return <div className="ds-app"><Navbar user={{ name: user?.name ?? 'Admin', role: 'Administrator' }} /><div className="ds-app-body"><Sidebar isAuthenticated username={user?.name ?? 'Admin'} /><main className="ds-page">
    <div className="ds-mb"><h1 className="ds-page-title">Scan boarding tickets</h1><p className="ds-page-sub">Scan a passenger&apos;s QR code, verify payment and trip status, then check them in once.</p></div>
    {!admin ? <div className="ds-alert ds-alert-error">Administrator access is required to verify tickets.</div> : <>
      <section className="ds-card ds-card-pad" style={{ maxWidth: 760 }}>
        <video ref={videoRef} aria-label="Ticket QR scanner camera" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 12, background: '#102f32' }} />
        {cameraError && <p className="ds-note">{cameraError}</p>}
        <label className="ds-detail-label" htmlFor="ticket-code">Ticket code or USB scanner input</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}><input id="ticket-code" className="ds-input" value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void verify(); }} placeholder="Scan QR or paste its code" autoComplete="off" /><button className="ds-btn ds-btn-primary" disabled={busy || !token} onClick={() => void verify()}>{busy ? 'Checking…' : 'Verify ticket'}</button></div>
      </section>
      {result && <section className="ds-card ds-card-pad" style={{ maxWidth: 760, marginTop: 20 }}>
        <h2 className="ds-card-title" style={{ color: result.valid ? '#087b56' : '#b42318' }}>{result.reason}</h2>
        {result.ticket && <div className="ds-detail-grid" style={{ marginTop: 16 }}>
          <div><span className="ds-detail-label">Reference</span><span className="ds-detail-value">{result.ticket.bookingReference}</span></div><div><span className="ds-detail-label">Passenger</span><span className="ds-detail-value">{result.ticket.passengerName}</span></div><div><span className="ds-detail-label">Contact</span><span className="ds-detail-value">{result.ticket.passengerPhone}</span></div><div><span className="ds-detail-label">Route</span><span className="ds-detail-value">{result.ticket.route}</span></div><div><span className="ds-detail-label">Departure</span><span className="ds-detail-value">{result.ticket.departureDate} · {formatScheduleTime(result.ticket.departureTime)}</span></div><div><span className="ds-detail-label">Bus / seat</span><span className="ds-detail-value">{result.ticket.busNumber} · {result.ticket.seatNumber}</span></div><div><span className="ds-detail-label">Payment</span><span className="ds-detail-value">{result.ticket.paymentStatus}</span></div><div><span className="ds-detail-label">Fare</span><span className="ds-detail-value">₱{result.ticket.totalAmount.toLocaleString('en-PH')}</span></div>
        </div>}
        {result.valid && result.canCheckIn && <button className="ds-btn ds-btn-primary" style={{ marginTop: 18 }} disabled={busy} onClick={() => void checkIn()}>{busy ? 'Checking in…' : 'Check in passenger'}</button>}
        {result.valid && !result.canCheckIn && <p className="ds-note" role="status">Do not check in until payment is verified.</p>}
      </section>}
    </>}
  </main></div></div>;
}

export default function ScanTicketsPage() { return <AuthGate><ScanTicketsContent /></AuthGate>; }
