import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, isAdmin } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const { user } = await authenticateRequest(request);
  if (!isAdmin(user)) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const today = now.toISOString().slice(0, 10);

    const [weeklyBookings, paidBookings, reservations, trips] = await Promise.all([
      prisma.booking.findMany({
        where: { bookingDate: { gte: weekStart }, status: { notIn: ['cancelled', 'rejected'] } },
        select: { totalAmount: true, paymentStatus: true, seatNumber: true },
      }),
      prisma.booking.aggregate({
        where: { paymentStatus: 'paid', status: { notIn: ['cancelled', 'rejected'] } },
        _sum: { totalAmount: true },
      }),
      prisma.booking.count({ where: { status: { in: ['pending', 'approved', 'confirmed'] } } }),
      prisma.trip.findMany({
        where: { status: 'scheduled', departureDate: { gte: today } },
        select: { availableSeats: true, bus: { select: { capacity: true } } },
      }),
    ]);

    const soldThisWeek = weeklyBookings.reduce(
      (sum, booking) => sum + (booking.seatNumber.split(',').filter((seat) => seat.trim()).length || 1), 0,
    );
    const revenueThisWeek = weeklyBookings.reduce(
      (sum, booking) => sum + (booking.paymentStatus === 'paid' ? booking.totalAmount : 0), 0,
    );
    const totalSeats = trips.reduce((sum, trip) => sum + trip.bus.capacity, 0);
    const bookedSeats = trips.reduce((sum, trip) => sum + Math.max(0, trip.bus.capacity - trip.availableSeats), 0);

    return NextResponse.json({
      soldThisWeek,
      revenueThisWeek,
      activeReservations: reservations,
      occupancy: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0,
      upcomingTrips: trips.length,
      paidRevenue: paidBookings._sum.totalAmount || 0,
    });
  } catch (error) {
    console.error('Report aggregation failed:', error);
    return NextResponse.json({ error: 'Could not load report data.' }, { status: 500 });
  }
}
