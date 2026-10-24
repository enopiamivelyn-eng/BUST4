import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser, supabaseConfig } from '@/lib/supabase';

function sessionToken(request: NextRequest) {
  return request.cookies.get('auth-token')?.value || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
}

async function restRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.message || 'Message board request failed.'), {
    status: response.status,
    code: payload.code,
  });
  return payload as T;
}

export async function GET(request: NextRequest) {
  const token = sessionToken(request);
  if (!token) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  try {
    const user = await getSupabaseUser(token);
    const isAdmin = user.app_metadata?.role === 'admin';
    const query = isAdmin
      ? 'bus_ticket_messages?select=id,user_id,sender_id,sender_role,body,created_at&order=created_at.asc'
      : `bus_ticket_messages?user_id=eq.${encodeURIComponent(user.id)}&select=id,user_id,sender_id,sender_role,body,created_at&order=created_at.asc`;
    const messages = await restRequest<Array<{ id: number; user_id: string; sender_id: string; sender_role: string; body: string; created_at: string }>>(query, token);
    const contacts = isAdmin
      ? await restRequest<Array<{ id: string; email: string; name: string }>>('auth_profiles?select=id,email,name&order=name.asc', token)
      : [];
    return NextResponse.json({ messages, contacts, isAdmin, currentUserId: user.id });
  } catch (error) {
    const status = (error as { status?: number }).status;
    const code = (error as { code?: string }).code;
    if (code === 'PGRST205') {
      return NextResponse.json({ error: 'The bus ticket message table is not installed in Supabase yet. Run ticket/supabase-auth-migration.sql for a new setup, or ticket/supabase-messages-rename.sql for an existing setup, in the Supabase SQL Editor, then refresh this page.' }, { status: 503 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load messages.' }, { status: status === 401 ? 401 : 503 });
  }
}

export async function POST(request: NextRequest) {
  const token = sessionToken(request);
  if (!token) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  try {
    const { body, userId } = await request.json();
    if (typeof body !== 'string' || !body.trim() || body.trim().length > 4000) {
      return NextResponse.json({ error: 'Message must be between 1 and 4,000 characters.' }, { status: 400 });
    }
    const user = await getSupabaseUser(token);
    const isAdmin = user.app_metadata?.role === 'admin';
    if (isAdmin && (typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId))) {
      return NextResponse.json({ error: 'Choose a user conversation first.' }, { status: 400 });
    }
    const row = {
      user_id: isAdmin ? userId : user.id,
      sender_id: user.id,
      sender_role: isAdmin ? 'admin' : 'user',
      body: body.trim(),
    };
    const created = await restRequest('bus_ticket_messages?select=id,user_id,sender_id,sender_role,body,created_at', token, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    return NextResponse.json({ success: true, message: Array.isArray(created) ? created[0] : created }, { status: 201 });
  } catch (error) {
    const status = (error as { status?: number }).status;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not send message.' }, { status: status === 401 ? 401 : 503 });
  }
}
