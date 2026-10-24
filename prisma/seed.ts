import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding bus-ticket catalog data...');

  // Create buses
  const buses = await Promise.all([
    prisma.bus.upsert({
      where: { busNumber: 'BUS-001' },
      update: {},
      create: {
        busNumber: 'BUS-001',
        model: 'Hino Grand Cruiser',
        capacity: 45,
        status: 'active',
      },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-002' },
      update: {},
      create: {
        busNumber: 'BUS-002',
        model: 'Hyundai Universe',
        capacity: 50,
        status: 'active',
      },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-003' },
      update: {},
      create: {
        busNumber: 'BUS-003',
        model: 'Daewoo GDW6117',
        capacity: 40,
        status: 'active',
      },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-004' },
      update: {},
      create: {
        busNumber: 'BUS-004',
        model: 'Yutong ZK6127',
        capacity: 48,
        status: 'maintenance',
      },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-005' },
      update: {},
      create: { busNumber: 'BUS-005', model: 'Ceres Coachliner', capacity: 45, status: 'active' },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-006' },
      update: {},
      create: { busNumber: 'BUS-006', model: 'Ceres Coachliner', capacity: 45, status: 'active' },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-007' },
      update: {},
      create: { busNumber: 'BUS-007', model: 'Ceres Coachliner', capacity: 45, status: 'active' },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-008' },
      update: {},
      create: { busNumber: 'BUS-008', model: 'Ceres Coachliner', capacity: 45, status: 'active' },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-009' },
      update: {},
      create: { busNumber: 'BUS-009', model: 'Ceres Coachliner', capacity: 45, status: 'active' },
    }),
    prisma.bus.upsert({
      where: { busNumber: 'BUS-010' },
      update: {},
      create: { busNumber: 'BUS-010', model: 'Ceres Coachliner', capacity: 45, status: 'active' },
    }),
  ]);

  console.log('✅ Created buses:', buses.length);

  // Upsert routes and trips so seeding never deletes existing bookings.
  const routes = await Promise.all([
    prisma.route.upsert({
      where: { name: 'Cebu-Bato' },
      update: {},
      create: {
        name: 'Cebu-Bato',
        fromCity: 'Cebu City',
        toCity: 'Bato',
        distance: 120.5,
        basePrice: 300,
        duration: '5 hours',
      },
    }),
    prisma.route.upsert({
      where: { name: 'Cebu-Oslob' },
      update: {},
      create: {
        name: 'Cebu-Oslob',
        fromCity: 'Cebu City',
        toCity: 'Oslob',
        distance: 115.0,
        basePrice: 200,
        duration: '5 hours',
      },
    }),
    prisma.route.upsert({
      where: { name: 'Cebu-Boljoon' },
      update: {},
      create: {
        name: 'Cebu-Boljoon',
        fromCity: 'Cebu City',
        toCity: 'Boljoon',
        distance: 105.0,
        basePrice: 300,
        duration: '5 hours',
      },
    }),
    prisma.route.upsert({
      where: { name: 'Cebu-Dalaguete' },
      update: {},
      create: {
        name: 'Cebu-Dalaguete',
        fromCity: 'Cebu City',
        toCity: 'Dalaguete',
        distance: 85.0,
        basePrice: 300,
        duration: '5 hours',
      },
    }),
    prisma.route.upsert({
      where: { name: 'Cebu-Moalboal' },
      update: {},
      create: {
        name: 'Cebu-Moalboal',
        fromCity: 'Cebu City',
        toCity: 'Moalboal',
        distance: 89.0,
        basePrice: 250,
        duration: '4 hours',
      },
    }),
    prisma.route.upsert({
      where: { name: 'Cebu-Argao' },
      update: {},
      create: {
        name: 'Cebu-Argao',
        fromCity: 'Cebu City',
        toCity: 'Argao',
        distance: 67.0,
        basePrice: 280,
        duration: '4.5 hours',
      },
    }),
    prisma.route.upsert({
      where: { name: 'Cebu-Carcar' },
      update: {},
      create: { name: 'Cebu-Carcar', fromCity: 'Cebu City', toCity: 'Carcar', distance: 40, basePrice: 100, duration: '1.5 hours' },
    }),
    prisma.route.upsert({
      where: { name: 'Cebu-Toledo' },
      update: {},
      create: { name: 'Cebu-Toledo', fromCity: 'Cebu City', toCity: 'Toledo City', distance: 50, basePrice: 120, duration: '2.5 hours' },
    }),
    prisma.route.upsert({
      where: { name: 'Cebu-Sibonga' },
      update: {},
      create: { name: 'Cebu-Sibonga', fromCity: 'Cebu City', toCity: 'Sibonga', distance: 55, basePrice: 140, duration: '2 hours' },
    }),
  ]);

  console.log('✅ Ready routes:', routes.length);

  // Create a repeatable 30-day timetable. Each route has a dedicated coach
  // and daily departure, avoiding randomly assigning a bus to overlapping trips.
  const activeBuses = buses.filter((bus) => bus.status === 'active');
  const schedules = ['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'];
  const manilaParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const partValue = (type: string) => Number(manilaParts.find((part) => part.type === type)?.value ?? 0);
  const firstTripDate = new Date(Date.UTC(partValue('year'), partValue('month') - 1, partValue('day')));
  const formatTime = (minutesAfterMidnight: number) => {
    const minutes = ((minutesAfterMidnight % 1440) + 1440) % 1440;
    const hour24 = Math.floor(minutes / 60);
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${suffix}`;
  };

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const tripDate = new Date(firstTripDate);
    tripDate.setUTCDate(tripDate.getUTCDate() + dayOffset);
    const dateString = tripDate.toISOString().slice(0, 10);

    for (const [routeIndex, route] of routes.entries()) {
      const bus = activeBuses[routeIndex % activeBuses.length];
      const departureTime = schedules[routeIndex % schedules.length];
      const durationHours = Number.parseFloat(route.duration) || 0;
      const departureParts = departureTime.match(/^(\d{2}):(\d{2}) (AM|PM)$/)!;
      let departureMinutes = (Number(departureParts[1]) % 12) * 60 + Number(departureParts[2]);
      if (departureParts[3] === 'PM') departureMinutes += 12 * 60;
      const arrivalTime = formatTime(departureMinutes + Math.round(durationHours * 60));

      await prisma.trip.upsert({
        where: {
          routeId_departureDate_departureTime: {
            routeId: route.id,
            departureDate: dateString,
            departureTime,
          },
        },
        update: {},
        create: {
          routeId: route.id,
          busId: bus.id,
          departureDate: dateString,
          departureTime,
          arrivalTime,
          price: route.basePrice,
          availableSeats: bus.capacity,
          status: 'scheduled',
        },
      });
    }
  }

  console.log('✅ Ready trips for the next seven days.');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
