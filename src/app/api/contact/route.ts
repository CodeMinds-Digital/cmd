import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp } from '@/lib/client-ip';
import { deliverContact } from '@/lib/contact';
import { takeContactToken } from '@/lib/contact-rate-limit';
import { HONEYPOT_FIELD } from '@/lib/contact-options';
import { contactSchema } from '@/lib/contact-schema';

/**
 * JSON contact endpoint, kept for external callers. The site's own form uses
 * the `submitContact` server action; both share the same schema and
 * delivery code.
 */
const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  // Require JSON: this forces a CORS preflight for cross-site callers, so a
  // hostile page can't submit here via a plain HTML form (text/plain body).
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Expected application/json' }, { status: 415 });
  }
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }
  const text = await request.text().catch(() => '');
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const trap = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof trap === 'string' && trap.trim() !== '') {
    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return NextResponse.json(
      { error: 'Invalid submission', fieldErrors },
      { status: 400 },
    );
  }

  const limit = takeContactToken(clientIp(request.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterMinutes * 60) } },
    );
  }

  const result = await deliverContact(parsed.data);
  if (!result.ok) {
    return result.reason === 'not-configured'
      ? NextResponse.json(
          { error: 'Contact form is temporarily unavailable. Please email cmd@codeminds.digital.' },
          { status: 503 },
        )
      : NextResponse.json(
          { error: 'Failed to send email. Please try again later.' },
          { status: 500 },
        );
  }

  return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
}
