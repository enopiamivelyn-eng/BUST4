import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser, supabaseAuth } from '@/lib/supabase';

interface PasswordSession { access_token: string }

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  try {
    const { currentPassword, newPassword } = await request.json();
    if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Enter your current password and a new password with at least 8 characters.' }, { status: 400 });
    }
    const user = await getSupabaseUser(token);
    const verified = await supabaseAuth<PasswordSession>('token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: currentPassword }),
    });
    await supabaseAuth('user', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${verified.access_token}` },
      body: JSON.stringify({ password: newPassword }),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = (error as { status?: number }).status;
    const message = status === 400 || status === 401 ? 'Current password is incorrect, or the new password was rejected.' : error instanceof Error ? error.message : 'Could not update password.';
    return NextResponse.json({ error: message }, { status: status === 401 ? 401 : 400 });
  }
}
