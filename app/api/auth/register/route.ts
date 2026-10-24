import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, address, city, postalCode, dateOfBirth, photoUrl } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string' || !email.trim() || !name.trim()) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });

    const result = await supabaseAuth<{ user?: { id: string }; session?: { access_token: string } }>('signup', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        data: {
          name: name.trim(),
          // Older Supabase profile triggers in this project expect a
          // `username` metadata field when inserting into public.profiles.
          username: name.trim(),
          phone: typeof phone === 'string' ? phone.trim() : '',
          address: typeof address === 'string' ? address.trim() : '',
          city: typeof city === 'string' ? city.trim() : '',
          postalCode: typeof postalCode === 'string' ? postalCode.trim() : '',
          dateOfBirth: typeof dateOfBirth === 'string' ? dateOfBirth : '',
          photoUrl: typeof photoUrl === 'string' ? photoUrl.trim() : '',
        },
      }),
    });
    if (!result.user) return NextResponse.json({ error: 'Supabase did not create the account.' }, { status: 502 });

    return NextResponse.json({
      success: true,
      otpRequired: !result.session,
      message: result.session ? 'Account created. You can now log in.' : 'Account created. Enter the code sent to your email to activate it.',
    }, { status: 201 });
  } catch (error) {
    const status = (error as { status?: number }).status;
    const message = error instanceof Error ? error.message : 'Registration failed.';
    if (status === 429 || /rate limit|too many requests/i.test(message)) {
      return NextResponse.json({
        error: 'Supabase temporarily limited confirmation emails. Wait before trying again, or configure a custom SMTP provider in Supabase Auth settings.',
      }, { status: 429 });
    }
    return NextResponse.json({ error: message }, { status: status === 422 || status === 400 ? 400 : status === 429 ? 429 : 500 });
  }
}
