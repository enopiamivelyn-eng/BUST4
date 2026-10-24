import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAdmin } from '@/lib/auth/middleware';
import { supabaseConfig } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { user } = await authenticateRequest(request);
  if (!isAdmin(user)) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  try {
    const { url, anonKey } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/auth_profiles?select=id,email,name,phone,role,created_at&order=created_at.desc`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: payload.message || 'Could not load users.' }, { status: 503 });
    return NextResponse.json({ users: payload });
  } catch {
    return NextResponse.json({ error: 'Could not load users.' }, { status: 503 });
  }
}
