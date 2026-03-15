/**
 * Vercel serverless function: POST /api/validate-license
 * Stub implementation — returns mock responses.
 * Replace with Lemon Squeezy API integration when ready.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { key, email } = req.body || {};

  if (!key || !email) {
    res.status(400).json({ valid: false, error: 'Missing key or email.' });
    return;
  }

  const pattern = /^ACPRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(key)) {
    res.status(200).json({ valid: false, error: 'Invalid license key format.' });
    return;
  }

  // TODO: Replace with Lemon Squeezy API validation
  // const lsResponse = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', { ... });
  res.status(200).json({ valid: true });
}
