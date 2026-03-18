/**
 * Vercel Edge Middleware: rate-limits /api/* requests.
 * Sliding window of ~10 requests per minute per IP.
 *
 * Vercel injects the Edge Runtime globals automatically at deploy time.
 * This file is NOT processed by the project's tsc/Vite build — Vercel
 * compiles it separately — so we use plain JS-compatible TS with no
 * external imports.
 */

export const config = {
  matcher: '/api/:path*',
};

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

// In-memory store — resets on cold start, which is acceptable for
// edge isolates (each instance gets its own map).
const hits = new Map<string, { count: number; resetAt: number }>();

export default function middleware(request: Request): Response | undefined {
  const url = new URL(request.url);

  // Only rate-limit API routes (belt-and-suspenders with matcher)
  if (!url.pathname.startsWith('/api/')) {
    return undefined; // pass through
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  let entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    hits.set(ip, entry);
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      },
    );
  }

  // Allow the request to proceed
  return undefined;
}
