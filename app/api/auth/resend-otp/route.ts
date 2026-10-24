import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, flow, password } = await request.json();
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (flow === 'signup') {
      await supabaseAuth('resend', { method: 'POST', body: JSON.stringify({ email: normalizedEmail, type: 'signup' }) });
    } else if (flow === 'login') {
      if (typeof password !== 'string' || !password) return NextResponse.json({ error: 'Enter your password to request a new sign-in code.' }, { status: 400 });
      await supabaseAuth('token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      await supabaseAuth('otp', { method: 'POST', body: JSON.stringify({ email: normalizedEmail, create_user: false }) });
    } else if (flow === 'recovery') {
      await supabaseAuth('recover', { method: 'POST', body: JSON.stringify({ email: normalizedEmail }) });
    } else {
      return NextResponse.json({ error: 'Invalid OTP request.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'A new verification code was sent if the account is eligible.' });
  } catch (error) {
    const status = (error as { status?: number }).status;
    const message = error instanceof Error ? error.message : 'Could not send a new code.';
    return NextResponse.json({ error: status === 429 ? 'Too many requests. Wait before trying again.' : message }, { status: status === 429 ? 429 : 400 });
  }
}
