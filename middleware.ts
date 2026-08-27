import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Закрываем пути /admin и /api/admin
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
    // Basic Auth removed per user request. Authentication is now handled by Telegram ID on the client side.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
