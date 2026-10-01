import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthMeResponse } from '../../types/auth';

const BACKEND_BASE = process.env.NEST_BACKEND_URL || 'http://127.0.0.1:3001';

/**
 * Validates current session against backend authority /api/v1/auth/me.
 * Forwards only the bei_session cookie.
 * Cache is strictly 'no-store'.
 */
export async function getDashboardSession(): Promise<AuthMeResponse | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('bei_session');

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const res = await fetch(`${BACKEND_BASE}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: `bei_session=${encodeURIComponent(sessionCookie.value)}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data: AuthMeResponse = await res.json();
    return data;
  } catch (error) {
    if ((error as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[Session Server] Error verifying session with backend authority:', error);
    return null;
  }
}

/**
 * Server route boundary assertion.
 * If user does not have a verified active session, redirects to /login.
 * Open-redirect protection: only internal safe dashboard paths are accepted.
 */
export async function requireDashboardSession(targetPath: string = '/dashboard/overview'): Promise<AuthMeResponse> {
  const session = await getDashboardSession();

  if (!session) {
    // Sanitize redirect target path: must start with /dashboard, no protocol-relative URLs
    let safeTarget = '/dashboard/overview';
    if (targetPath && targetPath.startsWith('/dashboard') && !targetPath.startsWith('//')) {
      safeTarget = targetPath;
    }

    redirect(`/login?next=${encodeURIComponent(safeTarget)}`);
  }

  return session;
}
