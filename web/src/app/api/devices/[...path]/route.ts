import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEST_BACKEND_URL || 'http://127.0.0.1:3001';

// Strict regex patterns for allowed paths
const ALLOWED_GET_PATTERNS = [
  /^buildings\/[^/]+\/floors$/,
  /^buildings\/[^/]+\/floors\/[^/]+\/devices$/,
  /^buildings\/[^/]+\/floors\/[^/]+\/devices\/summary$/,
  /^devices\/[^/]+$/,
  /^devices\/[^/]+\/telemetry$/,
  /^dashboard\/buildings\/[^/]+\/iot\/devices$/,
  /^dashboard\/buildings\/[^/]+\/water\/meters$/,
  /^dashboard\/buildings\/[^/]+\/water\/readings$/,
  /^dashboard\/buildings\/[^/]+\/environment\/sources$/,
  /^dashboard\/buildings\/[^/]+\/environment\/readings$/,
  /^dashboard\/buildings\/[^/]+\/environment\/summary$/,
  /^dashboard\/buildings\/[^/]+\/alerts\/evaluation-status$/,
];

const ALLOWED_MUTATION_PATTERNS = [
  /^devices\/[^/]+\/display-position$/,
];

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // 1. Validation & Traversal Guard
  for (const seg of segments) {
    if (seg === '.' || seg === '..' || seg.includes('/') || seg.includes('\\') || seg.includes('%')) {
      return NextResponse.json(
        { statusCode: 400, message: 'Invalid path segment or path traversal detected' },
        { status: 400 },
      );
    }
  }

  const normalizedPath = segments.join('/');

  // 2. Reject any attempt to route to auth via devices proxy
  if (normalizedPath === 'auth' || normalizedPath.startsWith('auth/')) {
    return NextResponse.json(
      { statusCode: 403, message: 'Direct access to authentication routes through devices proxy is forbidden' },
      { status: 403 },
    );
  }

  // 3. Match against allowed path + method allowlist
  const method = request.method.toUpperCase();
  let isAllowed = false;

  if (method === 'GET') {
    isAllowed = ALLOWED_GET_PATTERNS.some((pattern) => pattern.test(normalizedPath));
  } else if (method === 'PUT' || method === 'DELETE') {
    isAllowed = ALLOWED_MUTATION_PATTERNS.some((pattern) => pattern.test(normalizedPath));
  }

  if (!isAllowed) {
    const isKnownPathAnyMethod =
      ALLOWED_GET_PATTERNS.some((p) => p.test(normalizedPath)) ||
      ALLOWED_MUTATION_PATTERNS.some((p) => p.test(normalizedPath));

    if (isKnownPathAnyMethod) {
      return NextResponse.json(
        { statusCode: 405, message: `Method ${method} is not allowed for ${normalizedPath}` },
        { status: 405 },
      );
    }

    return NextResponse.json(
      { statusCode: 404, message: `Path ${normalizedPath} not found in approved API catalogue` },
      { status: 404 },
    );
  }

  // 4. Construct upstream request
  const search = request.nextUrl.search;
  const backendUrl = `${BACKEND_BASE}/api/v1/${normalizedPath}${search}`;

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

  // Forward custom header and origin for unsafe methods
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    headers['X-BEI-Request'] = '1';
    headers['Origin'] = request.nextUrl.origin;
  }

  // Forward ONLY application session cookie (no arbitrary cookies, tokens, or user headers)
  const sessionCookie = request.cookies.get('bei_session');
  if (sessionCookie && sessionCookie.value) {
    headers['Cookie'] = `bei_session=${encodeURIComponent(sessionCookie.value)}`;
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: 'no-store',
    };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = await request.text();
    }

    const res = await fetch(backendUrl, fetchOptions);
    const data = await res.text();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
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
export const PUT = handleProxy;
export const DELETE = handleProxy;
