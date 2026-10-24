import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, isAdmin } from '@/lib/auth/middleware';

/**
 * PUT /api/admin/buses/[id] - Update bus (Admin only)
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
    const { busNumber, model, capacity, status } = body;

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { id },
    });

    if (!existingBus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    // If updating bus number, check for conflicts
    if (busNumber !== undefined && (typeof busNumber !== 'string' || !busNumber.trim())) {
      return NextResponse.json({ error: 'Enter a bus number.' }, { status: 400 });
    }
    if (model !== undefined && (typeof model !== 'string' || !model.trim())) {
      return NextResponse.json({ error: 'Enter the bus model.' }, { status: 400 });
    }
    if (status !== undefined && !['active', 'maintenance', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Choose a valid bus status.' }, { status: 400 });
    }

    if (busNumber && busNumber !== existingBus.busNumber) {
      const conflict = await prisma.bus.findUnique({
        where: { busNumber },
      });

      if (conflict) {
        return NextResponse.json(
          { error: 'A bus with this number already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (busNumber !== undefined) updateData.busNumber = busNumber.trim();
    if (model !== undefined) updateData.model = model.trim();
    if (capacity !== undefined) {
      const nextCapacity = Number(capacity);
      if (!Number.isInteger(nextCapacity) || nextCapacity < 1) {
        return NextResponse.json({ error: 'Bus capacity must be a positive whole number.' }, { status: 400 });
      }
      updateData.capacity = nextCapacity;
    }
    if (status) updateData.status = status;

    const tripsToRecalculate = updateData.capacity !== undefined && updateData.capacity !== existingBus.capacity
      ? await prisma.trip.findMany({
        where: { busId: id },
        include: { bookings: { select: { status: true } } },
      })
      : [];
    if (tripsToRecalculate.some((trip) => trip.bookings.filter((booking) => booking.status !== 'cancelled' && booking.status !== 'rejected').length > updateData.capacity)) {
      return NextResponse.json({ error: 'Bus capacity cannot be lower than the number of active passenger bookings.' }, { status: 400 });
    }

    // Update the bus and its trips together so seat availability stays consistent.
    const updatedBus = await prisma.$transaction(async (tx) => {
      const bus = await tx.bus.update({ where: { id }, data: updateData });
      if (tripsToRecalculate.length) {
        await Promise.all(tripsToRecalculate.map((trip) => {
          const activeBookings = trip.bookings.filter((booking) => booking.status !== 'cancelled' && booking.status !== 'rejected').length;
          const remainingCapacity = Math.max(0, updateData.capacity - activeBookings);
          const capacityDelta = updateData.capacity - existingBus.capacity;
          const availableSeats = Math.min(remainingCapacity, Math.max(0, trip.availableSeats + capacityDelta));
          return tx.trip.update({ where: { id: trip.id }, data: { availableSeats } });
        }));
      }
      return bus;
    });

    return NextResponse.json({
      success: true,
      bus: updatedBus,
    });
  } catch (error) {
    console.error('Error updating bus:', error);
    return NextResponse.json(
      { error: 'Failed to update bus' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/buses/[id] - Delete bus (Admin only)
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

    // Check if bus has trips
    const tripsCount = await prisma.trip.count({
      where: { busId: id },
    });

    if (tripsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete bus with existing trips. Set status to inactive instead.' },
        { status: 400 }
      );
    }

    // Delete bus
    await prisma.bus.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bus:', error);
    return NextResponse.json(
      { error: 'Failed to delete bus' },
      { status: 500 }
    );
  }
}
