import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { databaseRequestError } from '@/lib/db/errors';

/**
 * GET /api/routes - Get all available routes
 */
export async function GET() {
  try {
    const dateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const routes = await prisma.route.findMany({
      where: { status: 'active' },
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: { trips: { where: { status: 'scheduled', departureDate: { gte: dateParts } } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      routes: routes.map(route => ({
        id: route.id,
        name: route.name,
        from: route.fromCity,
        to: route.toCity,
        distance: route.distance,
        price: route.basePrice,
        duration: route.duration,
        tripsCount: route._count.trips,
      })),
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    const failure = databaseRequestError(error, 'routes');
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
