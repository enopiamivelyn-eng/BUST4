import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    await supabaseAuth('recover', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    return NextResponse.json({ success: true, message: 'If an account exists, a recovery code was sent.' });
  } catch (error) {
    const status = (error as { status?: number }).status;
    const message = error instanceof Error ? error.message : 'Could not start password recovery.';
    return NextResponse.json({ error: status === 429 ? 'Too many requests. Wait before trying again.' : message }, { status: status === 429 ? 429 : 400 });
  }
}
