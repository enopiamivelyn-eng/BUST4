import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase';

interface VerifiedSession { access_token: string; expires_in?: number }

export async function POST(request: NextRequest) {
  try {
    const { email, token, flow } = await request.json();
    if (typeof email !== 'string' || typeof token !== 'string' || !/^(?:\d{6}|\d{8})$/.test(token)) {
      return NextResponse.json({ error: 'Enter the verification code sent to your email.' }, { status: 400 });
    }
    if (flow !== 'signup' && flow !== 'recovery') {
      return NextResponse.json({ error: 'Invalid verification request.' }, { status: 400 });
    }

    const session = await supabaseAuth<VerifiedSession>('verify', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), token, type: flow === 'signup' ? 'signup' : 'recovery' }),
    });
    const response = NextResponse.json({ success: true, message: flow === 'signup' ? 'Email verified. Your account is active.' : 'Email verified. Choose a new password.' });

    if (flow === 'recovery') {
      response.cookies.set('auth-recovery-token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: session.expires_in || 3600,
        path: '/',
      });
    }
    return response;
  } catch (error) {
    const status = (error as { status?: number }).status;
    const message = error instanceof Error ? error.message : 'The code is invalid or expired.';
    return NextResponse.json({ error: status === 429 ? 'Too many attempts. Wait and try again.' : message }, { status: status === 429 ? 429 : 400 });
  }
}
