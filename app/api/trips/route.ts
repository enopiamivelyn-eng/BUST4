import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { databaseRequestError } from '@/lib/db/errors';

function timeInMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || hour > 23) return Number.MAX_SAFE_INTEGER;
  if (match[3]) {
    hour %= 12;
    if (match[3].toUpperCase() === 'PM') hour += 12;
  }
  return hour * 60 + minute;
}

function manilaDateAndTime() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  };
}

/**
 * GET /api/trips - Search for available trips
 * Query params: from, to, date, routeId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const routeId = searchParams.get('routeId');
    const time = searchParams.get('time');
    const passengers = Math.max(1, Math.min(10, Number(searchParams.get('passengers')) || 1));

    // Build query conditions
    const where: any = {
      status: 'scheduled',
      availableSeats: { gte: passengers },
    };

    // Filter by route ID if provided
    if (routeId) {
      where.routeId = routeId;
    }

    // Filter by date if provided
    if (date) {
      where.departureDate = date;
    }

    // Filter by route cities if provided
    if (from || to) {
      where.route = { status: 'active' };
      if (from) {
        where.route.fromCity = { contains: from, mode: 'insensitive' };
      }
      if (to) {
        where.route.toCity = { contains: to, mode: 'insensitive' };
      }
    } else {
      where.route = { status: 'active' };
    }
    where.bus = { status: 'active' };

    // Fetch trips with route and bus details
    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: true,
        bus: true,
        bookings: { where: { status: { notIn: ['cancelled', 'rejected'] } }, select: { seatNumber: true } },
      },
      orderBy: { departureDate: 'asc' },
    });

    const current = manilaDateAndTime();
    const filteredTrips = trips
      .filter((trip) => {
        if (trip.departureDate < current.date) return false;
        const departureMinutes = timeInMinutes(trip.departureTime);
        if (trip.departureDate === current.date && departureMinutes <= current.minutes) return false;
        if (time && departureMinutes < timeInMinutes(time)) return false;
        return true;
      })
      .sort((first, second) => first.departureDate.localeCompare(second.departureDate)
        || timeInMinutes(first.departureTime) - timeInMinutes(second.departureTime));

    // Format response
    const formattedTrips = filteredTrips.map(trip => ({
      id: trip.id,
      routeId: trip.routeId,
      busId: trip.busId,
      departureDate: trip.departureDate,
      routeName: trip.route.name,
      from: trip.route.fromCity,
      to: trip.route.toCity,
      route: {
        name: trip.route.name,
        fromCity: trip.route.fromCity,
        toCity: trip.route.toCity,
      },
      date: trip.departureDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      price: trip.price,
      availableSeats: trip.availableSeats,
      bookedSeatNumbers: trip.bookings.flatMap((booking) => booking.seatNumber.split(',').map((seat) => seat.trim().toUpperCase()).filter(Boolean)),
      busNumber: trip.bus.busNumber,
      busModel: trip.bus.model,
      capacity: trip.bus.capacity,
      bus: {
        busNumber: trip.bus.busNumber,
        model: trip.bus.model,
        capacity: trip.bus.capacity,
      },
      duration: trip.route.duration,
      status: trip.status,
    }));

    return NextResponse.json({
      success: true,
      trips: formattedTrips,
      count: formattedTrips.length,
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    const failure = databaseRequestError(error, 'trips');
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
