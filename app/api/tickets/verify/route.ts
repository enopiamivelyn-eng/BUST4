import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, isAdmin } from '@/lib/auth/middleware';
import { hasTripDeparted } from '@/lib/ticket-validity';
import { formatBookingReference } from '@/lib/booking-reference';
import { APPROVED_BOOKING_STATUSES, COMPLETED_BOOKING_STATUSES } from '@/lib/booking-status';

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  const { token } = await request.json();
  if (typeof token !== 'string' || !/^(?:[a-f0-9]{64}|[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(token)) {
    return NextResponse.json({ valid: false, reason: 'Invalid ticket QR code.' });
  }

  const booking = await prisma.booking.findUnique({
    where: { ticketToken: token },
    include: { trip: { include: { route: true, bus: true } } },
  });
  if (!booking) return NextResponse.json({ valid: false, reason: 'Ticket not found.' });
  const details = {
    bookingReference: formatBookingReference(booking.id, booking.trip.departureDate),
    passengerName: booking.passengerName,
    passengerPhone: booking.passengerPhone,
    seatNumber: booking.seatNumber,
    route: `${booking.trip.route.fromCity} → ${booking.trip.route.toCity}`,
    departureDate: booking.trip.departureDate,
    departureTime: booking.trip.departureTime,
    busNumber: booking.trip.bus.busNumber,
    totalAmount: booking.totalAmount,
    paymentStatus: booking.paymentStatus,
  };
  let reason = '';
  if (booking.status === 'cancelled') reason = 'This booking was cancelled.';
  else if (booking.status === 'rejected') reason = 'This booking was rejected.';
  else if (booking.checkedInAt) reason = 'This ticket has already been used for boarding.';
  else if (![...APPROVED_BOOKING_STATUSES, ...COMPLETED_BOOKING_STATUSES].includes(booking.status as never)) reason = 'This booking has not been approved.';
  else if (booking.trip.status !== 'scheduled') reason = 'This trip is cancelled or unavailable.';
  else if (hasTripDeparted(booking.trip.departureDate, booking.trip.departureTime)) reason = 'This trip has already departed.';
  else if (booking.paymentStatus === 'paid') return NextResponse.json({ valid: true, canCheckIn: true, reason: 'VALID TICKET', ticket: details });
  else if (booking.paymentStatus === 'unpaid') return NextResponse.json({ valid: true, canCheckIn: false, reason: 'APPROVED RESERVATION — PAYMENT DUE AT TERMINAL', ticket: details });
  else if (booking.paymentStatus === 'pending') return NextResponse.json({ valid: true, canCheckIn: false, reason: 'APPROVED RESERVATION — PAYMENT AWAITING VERIFICATION', ticket: details });
  else reason = `Payment is ${booking.paymentStatus}. Contact the administrator.`;
  return NextResponse.json({ valid: false, canCheckIn: false, reason, ticket: details });
}
