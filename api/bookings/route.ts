import { NextRequest, NextResponse } from 'next/server';

// API route to sync with Django backend
export async function GET(request: NextRequest) {
  try {
    // Get all bookings from Django backend
    // Replace with your actual Django API endpoint
    const djangoUrl = process.env.DJANGO_API_URL || 'http://localhost:8000/api/bookings';
    
    const response = await fetch(djangoUrl, {
      headers: {
        'Authorization': `Bearer ${request.headers.get('Authorization')}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: response.status }
      );
    }

    const bookings = await response.json();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get deleted booking codes
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'get_deleted') {
      // Fetch list of deleted booking codes from Django
      const djangoUrl = process.env.DJANGO_API_URL || 'http://localhost:8000/api/bookings/deleted';
      
      const response = await fetch(djangoUrl, {
        headers: {
          'Authorization': `Bearer ${request.headers.get('Authorization')}`,
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch deleted bookings' },
          { status: response.status }
        );
      }

      const deletedCodes = await response.json();
      return NextResponse.json({ deletedCodes });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
