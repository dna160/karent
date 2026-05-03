import { type NextRequest, NextResponse } from 'next/server';

// Runtime env var — no build-time injection needed.
// Set API_URL=https://api-production-b42ee.up.railway.app in Railway dashboard vars.
const API_URL = process.env.API_URL || 'http://localhost:3001';

async function proxy(request: NextRequest, path: string[]) {
  const targetUrl = `${API_URL}/api/${path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key !== 'host') headers.set(key, value);
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(targetUrl, { method: request.method, headers, body });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: new Headers(upstream.headers),
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
