import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser, supabaseAuth, writeLoginLog } from '@/lib/supabase';

interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user: { id: string; email?: string; user_metadata?: { name?: string }; app_metadata?: { role?: string } };
}

function isAuthTransportFailure(error: unknown) {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : '';
  return /fetch failed|ECONNREFUSED|ENETUNREACH|EAI_AGAIN|ETIMEDOUT/i.test(message);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Confirm the password before sending an OTP; create the app session only
    // after the passenger verifies the code.
    await supabaseAuth<AuthSession>('token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    await supabaseAuth('otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), create_user: false }),
    });
    return NextResponse.json({ success: true, otpRequired: true, message: 'A sign-in code was sent to your email.' });
  } catch (error) {
    const status = (error as { status?: number }).status;
    const rawMessage = error instanceof Error ? error.message : '';
    if (isAuthTransportFailure(error)) {
      return NextResponse.json({ error: 'Could not connect to Supabase Auth. Check your internet connection and Supabase project settings, then try again.' }, { status: 503 });
    }
    if (status === 429 || /rate limit|too many requests/i.test(rawMessage)) {
      return NextResponse.json({ error: 'Too many attempts. Wait a little while and try again.' }, { status: 429 });
    }
    const message = status === 400 || status === 401
      ? 'Invalid email or password.'
      : rawMessage || 'Login failed.';
    return NextResponse.json({ error: message }, { status: status === 400 || status === 401 ? 401 : 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, token } = await request.json();
    if (typeof email !== 'string' || typeof token !== 'string' || !email.trim() || !/^(?:\d{6}|\d{8})$/.test(token)) {
      return NextResponse.json({ error: 'Enter the verification code sent to your email.' }, { status: 400 });
    }

    const session = await supabaseAuth<AuthSession>('verify', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), token, type: 'email' }),
    });
    const user = await getSupabaseUser(session.access_token);
    await writeLoginLog(user, session.access_token);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        phone: typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : '',
        photoUrl: typeof user.user_metadata?.photoUrl === 'string' ? user.user_metadata.photoUrl : '',
        role: user.app_metadata?.role === 'admin' ? 'admin' : 'passenger',
      },
    });
    response.cookies.set('auth-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in || 3600,
      path: '/',
    });
    if (session.refresh_token) {
      response.cookies.set('auth-refresh-token', session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }
    return response;
  } catch (error) {
    const status = (error as { status?: number }).status;
    const message = error instanceof Error ? error.message : 'The code is invalid or expired.';
    if (isAuthTransportFailure(error)) {
      return NextResponse.json({ error: 'Could not connect to Supabase Auth. Check your internet connection and try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: status === 429 ? 'Too many attempts. Wait and try again.' : message }, { status: status === 429 ? 429 : 400 });
  }
}
