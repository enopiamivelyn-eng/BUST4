import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, isAdmin } from '@/lib/auth/middleware';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  if (!['paid', 'failed', 'refunded'].includes(body.paymentStatus)) {
    return NextResponse.json({ error: 'Choose paid, failed, or refunded.' }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id }, include: { trip: true } });
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    if (booking.status === 'cancelled' || booking.status === 'rejected') return NextResponse.json({ error: 'Cancelled or rejected bookings cannot be paid.' }, { status: 409 });
    if (body.paymentStatus === 'refunded' && booking.paymentStatus === 'refunded') return NextResponse.json({ error: 'This booking is already refunded.' }, { status: 409 });
    if (body.paymentStatus === 'paid' && booking.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'This booking is already marked paid.' }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const ticketToken = booking.ticketToken;
      const changed = await tx.booking.updateMany({
        where: { id, status: { notIn: ['cancelled', 'rejected'] }, ticketToken: booking.ticketToken, ...(body.paymentStatus === 'paid' ? { paymentStatus: { not: 'paid' } } : {}), ...(body.paymentStatus === 'refunded' ? { paymentStatus: { not: 'refunded' } } : {}) },
        data: body.paymentStatus === 'paid'
          ? { paymentStatus: 'paid', status: booking.status === 'confirmed' ? 'approved' : booking.status, ticketToken }
          : body.paymentStatus === 'refunded'
            ? { paymentStatus: 'refunded', status: 'cancelled', ticketToken: null }
            : { paymentStatus: 'failed', status: booking.status === 'confirmed' ? 'approved' : booking.status, ticketToken: booking.ticketToken },
      });
      if (!changed.count) throw new Error('PAYMENT_STATE_CHANGED');
      if (body.paymentStatus === 'refunded') {
        const seatCount = booking.seatNumber.split(',').filter((seat) => seat.trim()).length || 1;
        await tx.trip.update({ where: { id: booking.tripId }, data: { availableSeats: { increment: seatCount } } });
      }
      return tx.booking.findUniqueOrThrow({ where: { id }, select: { id: true, status: true, paymentStatus: true } });
    });
    return NextResponse.json({ success: true, booking: result });
  } catch (cause) {
    if (cause instanceof Error && cause.message === 'PAYMENT_STATE_CHANGED') {
      return NextResponse.json({ error: 'Payment status changed. Refresh and review the booking again.' }, { status: 409 });
    }
    console.error('Admin payment review failed:', cause);
    return NextResponse.json({ error: 'Could not update payment review.' }, { status: 500 });
  }
}
