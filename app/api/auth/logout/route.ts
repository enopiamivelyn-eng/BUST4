import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    try {
      await supabaseAuth('logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // Always clear the browser session even if Supabase already expired it.
    }
  }
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('auth-token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  response.cookies.set('auth-refresh-token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}
