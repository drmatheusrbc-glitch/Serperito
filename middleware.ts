import { NextRequest, NextResponse } from 'next/server';
const COOKIE = 'serperito_session';
function decode(value: string) {
  const s = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
}
async function valid(value?: string) {
  const secret = process.env.SERPERITO_SESSION_SECRET;
  if (!value || !secret) return false;
  const parts = value.split('.');
  if (parts.length !== 2) return false;
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['verify']);
    if (!await crypto.subtle.verify('HMAC', key, decode(parts[1]), new TextEncoder().encode(parts[0]))) return false;
    return JSON.parse(new TextDecoder().decode(decode(parts[0]))).exp > Math.floor(Date.now()/1000);
  } catch { return false; }
}
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === '/login' || path.startsWith('/api/auth/login') || path.startsWith('/_next/') || path === '/favicon.ico') {
    if (path === '/login' && await valid(req.cookies.get(COOKIE)?.value)) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }
  if (!await valid(req.cookies.get(COOKIE)?.value)) {
    if (path.startsWith('/api/')) return NextResponse.json({error:'Não autenticado.'},{status:401});
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!.*\\.).*)', '/api/:path*'] };
