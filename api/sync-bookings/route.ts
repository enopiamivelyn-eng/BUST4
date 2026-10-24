import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Mock: Return deleted booking codes from Django/Admin
    // In production, fetch from your Django API
    const deletedCodes: string[] = [];
    
    // Example: const response = await fetch('YOUR_DJANGO_API/deleted-bookings');
    // const deletedCodes = await response.json();
    
    return NextResponse.json({ deletedCodes });
  } catch (error) {
    return NextResponse.json({ deletedCodes: [] });
  }
}
