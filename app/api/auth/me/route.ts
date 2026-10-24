import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser, supabaseAuth, SupabaseUser } from '@/lib/supabase';

interface RefreshedSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

function userResponse(user: SupabaseUser, session?: RefreshedSession, oldRefreshToken?: string) {
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
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');

  if (session) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
    response.cookies.set('auth-token', session.access_token, {
      ...cookieOptions,
      maxAge: session.expires_in || 3600,
    });
    const refreshToken = session.refresh_token || oldRefreshToken;
    if (refreshToken) {
      response.cookies.set('auth-refresh-token', refreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const refreshToken = request.cookies.get('auth-refresh-token')?.value;
  if (!token && !refreshToken) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  }
  try {
    if (token) {
      try {
        return userResponse(await getSupabaseUser(token));
      } catch (accessError) {
        if (!refreshToken) throw accessError;
      }
    }

    const session = await supabaseAuth<RefreshedSession>('token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const user = await getSupabaseUser(session.access_token);
    return userResponse(user, session, refreshToken);
  } catch {
    const response = NextResponse.json({ error: 'Session is invalid or expired.' }, { status: 401 });
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.cookies.delete('auth-token');
    response.cookies.delete('auth-refresh-token');
    return response;
  }
}
