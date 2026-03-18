/**
 * Vercel serverless function: POST /api/extract-colors
 * Fetches a page's HTML + CSS and extracts dominant colors.
 * Returns top 4 colors ranked by frequency.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/** 148 CSS named colors → 6-digit hex (lowercase). */
const NAMED_COLORS: Record<string, string> = {
  aliceblue:'#f0f8ff',antiquewhite:'#faebd7',aqua:'#00ffff',aquamarine:'#7fffd4',
  azure:'#f0ffff',beige:'#f5f5dc',bisque:'#ffe4c4',black:'#000000',
  blanchedalmond:'#ffebcd',blue:'#0000ff',blueviolet:'#8a2be2',brown:'#a52a2a',
  burlywood:'#deb887',cadetblue:'#5f9ea0',chartreuse:'#7fff00',chocolate:'#d2691e',
  coral:'#ff7f50',cornflowerblue:'#6495ed',cornsilk:'#fff8dc',crimson:'#dc143c',
  cyan:'#00ffff',darkblue:'#00008b',darkcyan:'#008b8b',darkgoldenrod:'#b8860b',
  darkgray:'#a9a9a9',darkgreen:'#006400',darkgrey:'#a9a9a9',darkkhaki:'#bdb76b',
  darkmagenta:'#8b008b',darkolivegreen:'#556b2f',darkorange:'#ff8c00',darkorchid:'#9932cc',
  darkred:'#8b0000',darksalmon:'#e9967a',darkseagreen:'#8fbc8f',darkslateblue:'#483d8b',
  darkslategray:'#2f4f4f',darkslategrey:'#2f4f4f',darkturquoise:'#00ced1',darkviolet:'#9400d3',
  deeppink:'#ff1493',deepskyblue:'#00bfff',dimgray:'#696969',dimgrey:'#696969',
  dodgerblue:'#1e90ff',firebrick:'#b22222',floralwhite:'#fffaf0',forestgreen:'#228b22',
  fuchsia:'#ff00ff',gainsboro:'#dcdcdc',ghostwhite:'#f8f8ff',gold:'#ffd700',
  goldenrod:'#daa520',gray:'#808080',green:'#008000',greenyellow:'#adff2f',
  grey:'#808080',honeydew:'#f0fff0',hotpink:'#ff69b4',indianred:'#cd5c5c',
  indigo:'#4b0082',ivory:'#fffff0',khaki:'#f0e68c',lavender:'#e6e6fa',
  lavenderblush:'#fff0f5',lawngreen:'#7cfc00',lemonchiffon:'#fffacd',lightblue:'#add8e6',
  lightcoral:'#f08080',lightcyan:'#e0ffff',lightgoldenrodyellow:'#fafad2',lightgray:'#d3d3d3',
  lightgreen:'#90ee90',lightgrey:'#d3d3d3',lightpink:'#ffb6c1',lightsalmon:'#ffa07a',
  lightseagreen:'#20b2aa',lightskyblue:'#87cefa',lightslategray:'#778899',lightslategrey:'#778899',
  lightyellow:'#ffffe0',lime:'#00ff00',limegreen:'#32cd32',linen:'#faf0e6',
  magenta:'#ff00ff',maroon:'#800000',mediumaquamarine:'#66cdaa',mediumblue:'#0000cd',
  mediumorchid:'#ba55d3',mediumpurple:'#9370db',mediumseagreen:'#3cb371',mediumslateblue:'#7b68ee',
  mediumspringgreen:'#00fa9a',mediumturquoise:'#48d1cc',mediumvioletred:'#c71585',midnightblue:'#191970',
  mintcream:'#f5fffa',mistyrose:'#ffe4e1',moccasin:'#ffe4b5',navajowhite:'#ffdead',
  navy:'#000080',oldlace:'#fdf5e6',olive:'#808000',olivedrab:'#6b8e23',
  orange:'#ffa500',orangered:'#ff4500',orchid:'#da70d6',palegoldenrod:'#eee8aa',
  palegreen:'#98fb98',paleturquoise:'#afeeee',palevioletred:'#db7093',papayawhip:'#ffefd5',
  peachpuff:'#ffdab9',peru:'#cd853f',pink:'#ffc0cb',plum:'#dda0dd',
  powderblue:'#b0e0e6',purple:'#800080',rebeccapurple:'#663399',red:'#ff0000',
  rosybrown:'#bc8f8f',royalblue:'#4169e1',saddlebrown:'#8b4513',salmon:'#fa8072',
  sandybrown:'#f4a460',seagreen:'#2e8b57',seashell:'#fff5ee',sienna:'#a0522d',
  silver:'#c0c0c0',skyblue:'#87ceeb',slateblue:'#6a5acd',slategray:'#708090',
  slategrey:'#708090',snow:'#fffafa',springgreen:'#00ff7f',steelblue:'#4682b4',
  tan:'#d2b48c',teal:'#008080',thistle:'#d8bfd8',tomato:'#ff6347',
  turquoise:'#40e0d0',violet:'#ee82ee',wheat:'#f5deb3',white:'#ffffff',
  whitesmoke:'#f5f5f5',yellow:'#ffff00',yellowgreen:'#9acd32',
  lightsteelblue:'#b0c4de',
};

/** Check if a hostname is private/reserved (SSRF protection). */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  // Loopback
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true;

  // Private RFC1918 ranges
  if (host.startsWith('192.168.') || host.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;

  // Link-local & metadata services (AWS/Azure/GCP)
  if (host.startsWith('169.254.')) return true;
  if (host === 'metadata.google.internal' || host === 'metadata.azure.com') return true;
  if (host === 'kubernetes.default.svc') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1, ::ffff:a9fe:a9fe, etc.)
  if (host.startsWith('::ffff:')) return true;
  if (/^\[?::f{4}:/i.test(host)) return true;

  // Reserved TLDs
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) return true;

  // Catch-all: block any bare IPv6 address
  if (host.includes(':')) return true;

  // Block 0.0.0.0/8 range
  if (/^0\./.test(host)) return true;

  return false;
}

/** Check if a URL points to a private/reserved IP range. */
function isPrivateUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    return isPrivateHost(u.hostname);
  } catch {
    return true;
  }
}

/** Normalize any CSS color value to uppercase 6-digit hex, or null. */
function normalizeToHex(raw: string): string | null {
  const s = raw.trim().toLowerCase();

  // 6-digit hex
  if (/^#[0-9a-f]{6}$/.test(s)) return s.toUpperCase();

  // 3-digit hex shorthand
  if (/^#[0-9a-f]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toUpperCase();
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) {
    const [, rs, gs, bs] = rgbMatch;
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const r = clamp(parseInt(rs, 10));
    const g = clamp(parseInt(gs, 10));
    const b = clamp(parseInt(bs, 10));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  // hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslMatch = s.match(/^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%/);
  if (hslMatch) {
    const [, hs, ss, ls] = hslMatch;
    const h = parseInt(hs, 10) / 360;
    const sat = parseInt(ss, 10) / 100;
    const lit = parseInt(ls, 10) / 100;

    let r: number, g: number, b: number;
    if (sat === 0) {
      r = g = b = lit;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = lit < 0.5 ? lit * (1 + sat) : lit + sat - lit * sat;
      const p = 2 * lit - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return '#' + [r, g, b]
      .map(v => Math.round(v * 255).toString(16).padStart(2, '0'))
      .join('').toUpperCase();
  }

  // Named CSS color
  if (NAMED_COLORS[s]) return NAMED_COLORS[s].toUpperCase();

  return null;
}

/** Convert hex to sRGB linear components for deltaE approximation. */
function hexToRgbArray(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** Simple Euclidean distance in RGB — good enough for clustering. */
function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgbArray(a);
  const [r2, g2, b2] = hexToRgbArray(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

interface ColorEntry {
  hex: string;
  frequency: number;
}

/** Cluster similar colors (RGB distance < threshold) and sum frequencies. */
function clusterColors(entries: ColorEntry[], threshold = 30): ColorEntry[] {
  const clusters: ColorEntry[] = [];

  for (const entry of entries) {
    const match = clusters.find(c => colorDistance(c.hex, entry.hex) < threshold);
    if (match) {
      match.frequency += entry.frequency;
    } else {
      clusters.push({ ...entry });
    }
  }

  return clusters;
}

/** Extract all color values from CSS text. */
function extractColorsFromCSS(css: string): Map<string, number> {
  const counts = new Map<string, number>();

  // Hex colors
  const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  let match: RegExpExecArray | null;

  while ((match = hexRegex.exec(css)) !== null) {
    const hex = normalizeToHex(match[0]);
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
  }

  // rgb/rgba
  const rgbRegex = /rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)/gi;
  while ((match = rgbRegex.exec(css)) !== null) {
    const hex = normalizeToHex(match[0]);
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
  }

  // hsl/hsla
  const hslRegex = /hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*[\d.]+)?\s*\)/gi;
  while ((match = hslRegex.exec(css)) !== null) {
    const hex = normalizeToHex(match[0]);
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
  }

  // Named colors in property values (word boundary match)
  const namedColorNames = Object.keys(NAMED_COLORS);
  const namedRegex = new RegExp(`:\\s*(${namedColorNames.join('|')})\\s*[;!}]`, 'gi');
  while ((match = namedRegex.exec(css)) !== null) {
    const hex = normalizeToHex(match[1]);
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
  }

  return counts;
}

/** Extract inline style attributes from HTML. */
function extractInlineStyles(html: string): string {
  const styleAttrRegex = /style\s*=\s*"([^"]*)"/gi;
  const parts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = styleAttrRegex.exec(html)) !== null) {
    parts.push(match[1]);
  }
  return parts.join('\n');
}

/** Extract <style> block contents from HTML. */
function extractStyleBlocks(html: string): string {
  const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const parts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = styleBlockRegex.exec(html)) !== null) {
    parts.push(match[1]);
  }
  return parts.join('\n');
}

/** Extract external stylesheet URLs from HTML. */
function extractStylesheetUrls(html: string, baseUrl: string): string[] {
  const linkRegex = /<link[^>]+rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const linkRegex2 = /<link[^>]+href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi;
  const urls: string[] = [];

  let match: RegExpExecArray | null;
  for (const regex of [linkRegex, linkRegex2]) {
    while ((match = regex.exec(html)) !== null) {
      try {
        const resolved = new URL(match[1], baseUrl).href;
        if (!urls.includes(resolved)) urls.push(resolved);
      } catch {
        // skip invalid URLs
      }
    }
  }

  return urls.slice(0, 5); // limit to 5 stylesheets
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing or invalid URL.' });
    return;
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: 'URL must use http or https.' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL format.' });
    return;
  }

  // Block private IPs
  if (isPrivateUrl(url)) {
    res.status(400).json({ error: 'Private/internal URLs are not allowed.' });
    return;
  }

  try {
    // Fetch the page HTML
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AccessibilityColorBot/1.0)',
        'Accept': 'text/html,text/css,*/*',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(200).json({ colors: [], error: `Site returned ${response.status}` });
      return;
    }

    const html = await response.text();

    // Collect all CSS: inline styles + style blocks + external sheets
    const allCSS: string[] = [];
    allCSS.push(extractInlineStyles(html));
    allCSS.push(extractStyleBlocks(html));

    // Fetch external stylesheets (parallel, with timeouts + SSRF validation)
    const sheetUrls = extractStylesheetUrls(html, url);
    const sheetPromises = sheetUrls.map(async (sheetUrl) => {
      try {
        // Validate each stylesheet URL against SSRF
        if (isPrivateUrl(sheetUrl)) return '';
        const sheetParsed = new URL(sheetUrl);
        if (!['http:', 'https:'].includes(sheetParsed.protocol)) return '';

        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const resp = await fetch(sheetUrl, {
          signal: ctrl.signal,
          redirect: 'manual',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AccessibilityColorBot/1.0)' },
        });
        clearTimeout(t);
        if (resp.ok) return resp.text();
      } catch {
        // skip failed sheets
      }
      return '';
    });

    const sheets = await Promise.all(sheetPromises);
    allCSS.push(...sheets);

    // Extract and count colors
    const combinedCSS = allCSS.join('\n');
    const colorCounts = extractColorsFromCSS(combinedCSS);

    // Convert to array, filter out pure white/black/transparent extremes if desired
    let entries: ColorEntry[] = Array.from(colorCounts.entries())
      .map(([hex, frequency]) => ({ hex, frequency }));

    // Cluster similar colors
    entries = clusterColors(entries);

    // Sort by frequency descending
    entries.sort((a, b) => b.frequency - a.frequency);

    // Return top 4
    const top = entries.slice(0, 4);

    res.status(200).json({ colors: top });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('abort')) {
      res.status(200).json({ colors: [], error: 'Request timed out.' });
    } else {
      res.status(200).json({ colors: [], error: 'Failed to fetch site.' });
    }
  }
}
