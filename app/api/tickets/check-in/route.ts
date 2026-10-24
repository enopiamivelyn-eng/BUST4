import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, isAdmin } from '@/lib/auth/middleware';
import { hasTripDeparted } from '@/lib/ticket-validity';
import { APPROVED_BOOKING_STATUSES, COMPLETED_BOOKING_STATUSES } from '@/lib/booking-status';

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  const { token } = await request.json();
  if (typeof token !== 'string' || !/^(?:[a-f0-9]{64}|[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(token)) return NextResponse.json({ error: 'Invalid ticket QR code.' }, { status: 400 });

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { ticketToken: token }, include: { trip: true } });
    if (!booking) return { error: 'Ticket not found.', status: 404 };
    if (booking.paymentStatus !== 'paid' || ![...APPROVED_BOOKING_STATUSES, ...COMPLETED_BOOKING_STATUSES].includes(booking.status as never)) return { error: 'Only paid, approved tickets can check in.', status: 409 };
    if (booking.checkedInAt) return { error: 'This ticket has already been used.', status: 409 };
    if (booking.trip.status !== 'scheduled' || hasTripDeparted(booking.trip.departureDate, booking.trip.departureTime)) return { error: 'This trip is cancelled or has departed.', status: 409 };
    const updated = await tx.booking.updateMany({
      where: { id: booking.id, ticketToken: token, status: { in: [...APPROVED_BOOKING_STATUSES, ...COMPLETED_BOOKING_STATUSES] }, paymentStatus: 'paid', checkedInAt: null },
      data: { checkedInAt: new Date() },
    });
    return updated.count ? { checkedInAt: new Date().toISOString() } : { error: 'Ticket was already checked in.', status: 409 };
  });
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, message: 'Passenger checked in.', checkedInAt: result.checkedInAt });
}
