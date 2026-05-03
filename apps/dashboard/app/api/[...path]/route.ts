import { type NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function proxy(request: NextRequest, path: string[]) {
  const targetUrl = `${API_URL}/api/${path.join('/')}${request.nextUrl.search}`;
  console.log(`[proxy] ${request.method} ${targetUrl}`);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key !== 'host') headers.set(key, value);
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(targetUrl, { method: request.method, headers, body });
    console.log(`[proxy] upstream responded ${upstream.status}`);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: new Headers(upstream.headers),
    });
  } catch (err) {
    console.error('[proxy] upstream fetch failed:', String(err));
    return NextResponse.json(
      { success: false, error: `Proxy error: ${String(err)}` },
      { status: 502 }
    );
  }
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
