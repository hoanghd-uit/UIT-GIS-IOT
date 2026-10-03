import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEST_BACKEND_URL || 'http://127.0.0.1:3001';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('bei_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { message: 'Chưa xác thực: Yêu cầu thiếu phiên đăng nhập.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const backendRes = await fetch(`${BACKEND_BASE}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: `bei_session=${encodeURIComponent(sessionCookie.value)}`,
      },
      cache: 'no-store',
    });

    const data = await backendRes.json();
    return NextResponse.json(data, {
      status: backendRes.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Next.js Auth Me Error]:', error);
    return NextResponse.json(
      { message: 'Dịch vụ xác thực tạm thời không khả dụng.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
