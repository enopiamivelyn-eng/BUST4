import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/trips/[id] - Get specific trip details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        route: true,
        bus: true,
        bookings: {
          select: {
            seatNumber: true,
            status: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Get booked seat numbers
    const bookedSeats = trip.bookings
      .filter(b => b.status !== 'cancelled' && b.status !== 'rejected')
      .flatMap(b => b.seatNumber.split(',').map(seat => seat.trim().toUpperCase()).filter(Boolean));

    return NextResponse.json({
      success: true,
      trip: {
        id: trip.id,
        routeName: trip.route.name,
        from: trip.route.fromCity,
        to: trip.route.toCity,
        date: trip.departureDate,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        price: trip.price,
        availableSeats: trip.availableSeats,
        busNumber: trip.bus.busNumber,
        busModel: trip.bus.model,
        capacity: trip.bus.capacity,
        duration: trip.route.duration,
        status: trip.status,
        bookedSeats,
        bookedSeatNumbers: bookedSeats,
      },
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip details' },
      { status: 500 }
    );
  }
}
