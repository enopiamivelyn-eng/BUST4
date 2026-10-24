import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser, supabaseAuth } from '@/lib/supabase';

type ProfileFields = { name: string; phone: string; photoUrl: string; dateOfBirth: string; address: string; city: string; postalCode: string };
type Preferences = { emailNotifications: boolean; smsNotifications: boolean; promotionalEmails: boolean; bookingReminders: boolean };

function tokenFrom(request: NextRequest) {
  return request.cookies.get('auth-token')?.value || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
}

function profileFrom(metadata: Record<string, unknown> | undefined, email: string): ProfileFields {
  return {
    name: typeof metadata?.name === 'string' ? metadata.name : email.split('@')[0],
    phone: typeof metadata?.phone === 'string' ? metadata.phone : '',
    photoUrl: typeof metadata?.photoUrl === 'string' ? metadata.photoUrl : '',
    dateOfBirth: typeof metadata?.dateOfBirth === 'string' ? metadata.dateOfBirth : '',
    address: typeof metadata?.address === 'string' ? metadata.address : '',
    city: typeof metadata?.city === 'string' ? metadata.city : '',
    postalCode: typeof metadata?.postalCode === 'string' ? metadata.postalCode : '',
  };
}

function preferencesFrom(metadata: Record<string, unknown> | undefined): Preferences {
  const value = metadata?.preferences && typeof metadata.preferences === 'object'
    ? metadata.preferences as Record<string, unknown>
    : {};
  return {
    emailNotifications: value.emailNotifications !== false,
    smsNotifications: value.smsNotifications === true,
    promotionalEmails: value.promotionalEmails !== false,
    bookingReminders: value.bookingReminders !== false,
  };
}

export async function GET(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  try {
    const user = await getSupabaseUser(token);
    return NextResponse.json({ success: true, profile: { id: user.id, email: user.email, ...profileFrom(user.user_metadata, user.email), preferences: preferencesFrom(user.user_metadata) } });
  } catch {
    return NextResponse.json({ error: 'Your session is invalid or expired. Please log in again.' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  try {
    const body = await request.json();
    const user = await getSupabaseUser(token);
    const profile: ProfileFields = {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      photoUrl: typeof body.photoUrl === 'string' ? body.photoUrl.trim() : '',
      dateOfBirth: typeof body.dateOfBirth === 'string' ? body.dateOfBirth : '',
      address: typeof body.address === 'string' ? body.address.trim() : '',
      city: typeof body.city === 'string' ? body.city.trim() : '',
      postalCode: typeof body.postalCode === 'string' ? body.postalCode.trim() : '',
    };
    const preferences: Preferences = {
      emailNotifications: body.preferences?.emailNotifications !== false,
      smsNotifications: body.preferences?.smsNotifications === true,
      promotionalEmails: body.preferences?.promotionalEmails !== false,
      bookingReminders: body.preferences?.bookingReminders !== false,
    };
    if (!profile.name || profile.name.length > 100 || profile.phone.length > 40 || profile.photoUrl.length > 2048 || profile.address.length > 250 || profile.city.length > 100 || profile.postalCode.length > 20) {
      return NextResponse.json({ error: 'Check the profile fields and try again.' }, { status: 400 });
    }
    if (profile.photoUrl && !/^https:\/\//i.test(profile.photoUrl)) {
      return NextResponse.json({ error: 'Profile photo must be an HTTPS image URL.' }, { status: 400 });
    }
    const oldMetadata = user.user_metadata || {};
    const savedUser = await supabaseAuth<{ id: string; email: string; user_metadata?: Record<string, unknown> }>('user', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: { ...oldMetadata, ...profile, preferences } }),
    });
    return NextResponse.json({ success: true, profile: { id: savedUser.id, email: savedUser.email, ...profileFrom(savedUser.user_metadata, savedUser.email), preferences: preferencesFrom(savedUser.user_metadata) } });
  } catch (error) {
    const status = (error as { status?: number }).status;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save profile.' }, { status: status === 401 ? 401 : 400 });
  }
}
