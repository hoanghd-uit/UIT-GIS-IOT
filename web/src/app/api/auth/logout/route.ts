import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEST_BACKEND_URL || 'http://127.0.0.1:3001';

export async function POST(request: NextRequest) {
  try {
    const customHeader = request.headers.get('x-bei-request');
    if (!customHeader || customHeader !== '1') {
      return NextResponse.json(
        { message: 'Yêu cầu bị từ chối: Thiếu tiêu đề bảo mật X-BEI-Request.' },
        { status: 403 },
      );
    }

    const sessionCookie = request.cookies.get('bei_session');
    const headers: Record<string, string> = {
      'X-BEI-Request': '1',
      Origin: request.nextUrl.origin,
    };

    if (sessionCookie && sessionCookie.value) {
      headers['Cookie'] = `bei_session=${encodeURIComponent(sessionCookie.value)}`;
    }

    const backendRes = await fetch(`${BACKEND_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers,
      cache: 'no-store',
    });

    const data = await backendRes.json().catch(() => ({ success: true }));
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    responseHeaders.set('Cache-Control', 'no-store');

    // Forward Set-Cookie clearing header
    const setCookie = backendRes.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    } else {
      // Fallback: explicitly clear cookie on response
      responseHeaders.set(
        'set-cookie',
        'bei_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      );
    }

    return new NextResponse(JSON.stringify(data), {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Next.js Auth Logout Error]:', error);
    return NextResponse.json(
      { message: 'Dịch vụ xác thực tạm thời không khả dụng.' },
      { status: 503 },
    );
  }
}
