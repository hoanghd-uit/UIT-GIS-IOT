import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEST_BACKEND_URL || 'http://127.0.0.1:3001';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join('/');
  const search = request.nextUrl.search;
  const backendUrl = `${BACKEND_BASE}/api/v1/${targetPath}${search}`;

  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') || 'application/json',
  };

  const revision = request.headers.get('x-expected-placement-revision');
  if (revision) {
    headers['X-Expected-Placement-Revision'] = revision;
  }

  const requestId = request.headers.get('x-request-id');
  if (requestId) {
    headers['X-Request-Id'] = requestId;
  }

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      cache: 'no-store',
    };

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      fetchOptions.body = await request.text();
    }

    const res = await fetch(backendUrl, fetchOptions);
    const data = await res.text();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error(`[API Proxy Error] Failed to proxy to ${backendUrl}:`, error);
    return NextResponse.json(
      {
        statusCode: 503,
        errorCode: 'BACKEND_UNAVAILABLE',
        message: 'Backend service is currently unavailable',
      },
      { status: 503 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;

