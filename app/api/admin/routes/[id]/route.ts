import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, isAdmin } from '@/lib/auth/middleware';

/**
 * PUT /api/admin/routes/[id] - Update route (Admin only)
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
    const { name, fromCity, toCity, distance, basePrice, duration, status } = body;

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    for (const [field, value] of Object.entries({ name, fromCity, toCity, duration })) {
      if (value !== undefined && (typeof value !== 'string' || !value.trim())) {
        return NextResponse.json({ error: `Enter a valid route ${field}.` }, { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (fromCity !== undefined) updateData.fromCity = fromCity.trim();
    if (toCity !== undefined) updateData.toCity = toCity.trim();
    if (distance !== undefined) updateData.distance = Number(distance);
    if (basePrice !== undefined) updateData.basePrice = Number(basePrice);
    if (duration !== undefined) updateData.duration = duration.trim();
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) return NextResponse.json({ error: 'Route status must be active or inactive.' }, { status: 400 });
      updateData.status = status;
    }
    if ((updateData.distance !== undefined && (!Number.isFinite(updateData.distance) || updateData.distance <= 0))
      || (updateData.basePrice !== undefined && (!Number.isFinite(updateData.basePrice) || updateData.basePrice <= 0))) {
      return NextResponse.json({ error: 'Distance and fare must be positive numbers.' }, { status: 400 });
    }

    // Update route
    const updatedRoute = await prisma.route.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      route: updatedRoute,
    });
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json(
      { error: 'Failed to update route' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/routes/[id] - Delete route (Admin only)
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

    // Check if route has trips
    const tripsCount = await prisma.trip.count({
      where: { routeId: id },
    });

    if (tripsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete route with existing trips' },
        { status: 400 }
      );
    }

    // Delete route
    await prisma.route.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
