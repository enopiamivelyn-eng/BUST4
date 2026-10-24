import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, isAdmin } from '@/lib/auth/middleware';
import { normalizeScheduleTime } from '@/lib/schedule';
import { databaseRequestError } from '@/lib/db/errors';

/**
 * PUT /api/admin/trips/[id] - Update trip (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticateRequest(request);
    
    if (error || !user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      routeId,
      busId,
      departureDate,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
      status,
    } = body;

    // Check if trip exists
    const existingTrip = await prisma.trip.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });

    if (!existingTrip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const nextRouteId = routeId || existingTrip.routeId;
    const nextBusId = busId || existingTrip.busId;
    const nextDate = departureDate === undefined ? existingTrip.departureDate : departureDate;
    const nextTime = normalizeScheduleTime(departureTime === undefined ? existingTrip.departureTime : departureTime);
    const nextArrivalTime = normalizeScheduleTime(arrivalTime === undefined ? existingTrip.arrivalTime : arrivalTime);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate) || Number.isNaN(Date.parse(`${nextDate}T00:00:00Z`))) {
      return NextResponse.json({ error: 'Enter a valid departure date.' }, { status: 400 });
    }
    if (!nextTime || !nextArrivalTime) {
      return NextResponse.json({ error: 'Enter valid departure and arrival times.' }, { status: 400 });
    }
    if (status !== undefined && !['scheduled', 'boarding', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Choose a valid schedule status.' }, { status: 400 });
    }

    const nextPrice = price === undefined || price === null || price === '' ? existingTrip.price : Number(price);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      return NextResponse.json({ error: 'Schedule price must be a positive number.' }, { status: 400 });
    }

    const [nextRoute, nextBus] = await Promise.all([
      prisma.route.findUnique({ where: { id: nextRouteId }, select: { id: true } }),
      prisma.bus.findUnique({ where: { id: nextBusId }, select: { id: true, capacity: true } }),
    ]);
    if (!nextRoute) return NextResponse.json({ error: 'Selected route no longer exists. Refresh the page and choose another route.' }, { status: 404 });
    if (!nextBus) return NextResponse.json({ error: 'Selected bus no longer exists. Refresh the page and choose another bus.' }, { status: 404 });

    if (nextBusId !== existingTrip.busId && existingTrip.bookings.length > 0) {
      return NextResponse.json({ error: 'This schedule has passenger bookings, so its bus cannot be changed.' }, { status: 400 });
    }
    const activeBookingCount = existingTrip.bookings.filter((booking) => booking.status !== 'cancelled' && booking.status !== 'rejected').length;
    const maxAvailableSeats = Math.max(0, nextBus.capacity - activeBookingCount);
    const requestedAvailableSeats = availableSeats === undefined
      ? (nextBusId !== existingTrip.busId ? maxAvailableSeats : existingTrip.availableSeats)
      : Number(availableSeats);
    if ((availableSeats !== undefined || nextBusId !== existingTrip.busId)
      && (!Number.isInteger(requestedAvailableSeats) || requestedAvailableSeats < 0 || requestedAvailableSeats > maxAvailableSeats)) {
      return NextResponse.json({
        error: `Available seats must be between 0 and ${maxAvailableSeats}, based on this bus's capacity and existing bookings.`,
      }, { status: 400 });
    }
    const sameDateSchedules = await prisma.trip.findMany({
      where: { id: { not: id }, departureDate: nextDate, OR: [{ routeId: nextRouteId }, { busId: nextBusId }] },
      select: { routeId: true, busId: true, departureTime: true },
    });
    const duplicateRoute = sameDateSchedules.some((trip) =>
      trip.routeId === nextRouteId && normalizeScheduleTime(trip.departureTime) === nextTime,
    );
    const duplicateBus = sameDateSchedules.some((trip) =>
      trip.busId === nextBusId && normalizeScheduleTime(trip.departureTime) === nextTime,
    );
    if (duplicateRoute || duplicateBus) {
      return NextResponse.json({
        error: duplicateBus
          ? 'This bus already has a schedule at that date and time.'
          : 'This route already has a schedule at that date and time.',
      }, { status: 409 });
    }

    // Build update data
    const updateData: any = {
      routeId: nextRouteId,
      busId: nextBusId,
      departureDate: nextDate,
      departureTime: nextTime,
      arrivalTime: nextArrivalTime,
      price: nextPrice,
      availableSeats: requestedAvailableSeats,
      status: status ?? existingTrip.status,
    };
    if (nextBusId !== existingTrip.busId) updateData.availableSeats = nextBus.capacity;

    // Update trip
    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        route: true,
        bus: true,
      },
    });

    return NextResponse.json({
      success: true,
      trip: updatedTrip,
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    const errorMessage = error instanceof Error ? error.message : '';
    if (code === 'P2002') {
      return NextResponse.json({ error: 'This route or bus already has a schedule at that date and time.' }, { status: 409 });
    }
    if (code === 'P2003') {
      return NextResponse.json({ error: 'The selected route or bus is no longer available. Refresh the page and try again.' }, { status: 400 });
    }
    if (code === 'P2025') {
      return NextResponse.json({ error: 'This schedule no longer exists. Refresh the page and try again.' }, { status: 404 });
    }
    if (/column\s+["'`]?new["'`]?\s+does not exist/i.test(errorMessage)) {
      return NextResponse.json({
        error: 'The Supabase Trip update trigger is broken. Run supabase-fix-schedule-update-trigger.sql in the Supabase SQL Editor, then try again.',
      }, { status: 500 });
    }
    console.error('Error updating trip:', error);
    const failure = databaseRequestError(error, 'schedule');
    return NextResponse.json(
      { error: failure.status === 503 ? failure.error : 'Could not update the schedule. Please refresh and try again.' },
      { status: failure.status }
    );
  }
}

/**
 * DELETE /api/admin/trips/[id] - Delete trip (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticateRequest(request);
    
    if (error || !user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if trip has bookings
    const bookingsCount = await prisma.booking.count({
      where: {
        tripId: id,
        status: { notIn: ['cancelled', 'rejected'] },
      },
    });

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete trip with confirmed bookings. Cancel the trip instead.' },
        { status: 400 }
      );
    }

    // Delete trip
    await prisma.trip.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
