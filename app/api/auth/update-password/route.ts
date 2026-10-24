import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-recovery-token')?.value;
  if (!token) return NextResponse.json({ error: 'Verify the recovery code before changing your password.' }, { status: 401 });
  try {
    const { password } = await request.json();
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    await supabaseAuth('user', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    });
    const response = NextResponse.json({ success: true, message: 'Password updated. You can now log in.' });
    response.cookies.delete('auth-recovery-token');
    return response;
  } catch (error) {
    const status = (error as { status?: number }).status;
    const message = error instanceof Error ? error.message : 'Could not update the password.';
    return NextResponse.json({ error: status === 429 ? 'Too many requests. Wait before trying again.' : message }, { status: status === 429 ? 429 : 400 });
  }
}
