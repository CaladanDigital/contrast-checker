/**
 * Vercel serverless function: GET /api/proxy-site?url=<encoded-url>
 * Fetches a page's HTML and serves it without frame-blocking headers,
 * allowing it to be embedded in an iframe from our origin.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB

/** Check if a URL points to a private/reserved IP range. */
function isPrivateUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true;
    if (host.startsWith('192.168.') || host.startsWith('10.')) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
    if (host.endsWith('.local') || host.endsWith('.internal')) return true;
    return false;
  } catch {
    return true;
  }
}

/** Return a simple HTML error page for the iframe. */
function errorPage(res: VercelResponse, status: number, message: string): void {
  res.status(status)
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .send(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0;text-align:center;padding:1rem}p{max-width:360px;line-height:1.5}</style></head><body><p>${message}</p></body></html>`);
}

/** Compute base href from a final URL: origin + path up to the last slash. */
function computeBaseHref(finalUrl: string): string {
  const u = new URL(finalUrl);
  const pathUpToLastSlash = u.pathname.substring(0, u.pathname.lastIndexOf('/') + 1);
  return u.origin + pathUpToLastSlash;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    errorPage(res, 405, 'Method not allowed.');
    return;
  }

  const url = typeof req.query.url === 'string' ? req.query.url : '';

  if (!url) {
    errorPage(res, 400, 'Missing URL parameter.');
    return;
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errorPage(res, 400, 'URL must use http or https.');
      return;
    }
  } catch {
    errorPage(res, 400, 'Invalid URL format.');
    return;
  }

  // Block private IPs
  if (isPrivateUrl(url)) {
    errorPage(res, 400, 'Private/internal URLs are not allowed.');
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AccessibilityColorBot/1.0)',
        'Accept': 'text/html,*/*',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      errorPage(res, 502, `The site returned HTTP ${response.status}.`);
      return;
    }

    // Guard: must be HTML
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      errorPage(res, 400, 'The URL did not return an HTML page.');
      return;
    }

    // Read body with size limit
    const body = await response.text();
    if (body.length > MAX_BODY_SIZE) {
      errorPage(res, 400, 'The page is too large to preview.');
      return;
    }

    // Determine final URL (after redirects) for the base tag
    const finalUrl = response.url || url;
    const baseHref = computeBaseHref(finalUrl);

    // Rewrite HTML: strip any existing <base> tag, then inject our own after <head>
    let html = body.replace(/<base\s[^>]*>/gi, '');
    const baseTag = `<base href="${baseHref}">`;

    const headMatch = html.match(/<head[^>]*>/i);
    if (headMatch) {
      const insertPos = (headMatch.index ?? 0) + headMatch[0].length;
      html = html.slice(0, insertPos) + baseTag + html.slice(insertPos);
    } else {
      html = baseTag + html;
    }

    // Serve the HTML — deliberately omit X-Frame-Options to allow framing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(html);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('abort')) {
      errorPage(res, 504, 'The site took too long to respond.');
    } else {
      errorPage(res, 502, 'Failed to fetch the site.');
    }
  }
}
