import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEST_BACKEND_URL || 'http://127.0.0.1:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const customHeader = request.headers.get('x-bei-request');
    if (!customHeader || customHeader !== '1') {
      return NextResponse.json(
        { message: 'Yêu cầu bị từ chối: Thiếu tiêu đề bảo mật X-BEI-Request.' },
        { status: 403 },
      );
    }

    // Call backend login endpoint
    const backendRes = await fetch(`${BACKEND_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BEI-Request': '1',
        Origin: request.nextUrl.origin,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await backendRes.json();
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    responseHeaders.set('Cache-Control', 'no-store');

    // Forward Set-Cookie header from backend
    const setCookie = backendRes.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    }

    return new NextResponse(JSON.stringify(data), {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Next.js Auth Login Error]:', error);
    return NextResponse.json(
      { message: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại.' },
      { status: 503 },
    );
  }
}
