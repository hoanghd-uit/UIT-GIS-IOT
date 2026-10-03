import { LoginCredentials, AuthMeResponse } from '../../types/auth';

/**
 * Client authentication API calling same-origin Next.js API routes.
 * Always includes required custom header X-BEI-Request: 1 for CSRF verification.
 */
export async function apiLogin(credentials: LoginCredentials): Promise<AuthMeResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BEI-Request': '1',
    },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Đăng nhập không thành công');
  }

  return data;
}

export async function apiLogout(): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'X-BEI-Request': '1',
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Đăng xuất không thành công');
  }
}

export async function apiGetMe(): Promise<AuthMeResponse | null> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store',
      },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('[Auth API] Error fetching current user:', error);
    return null;
  }
}
