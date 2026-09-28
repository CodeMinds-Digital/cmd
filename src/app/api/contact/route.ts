import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deliverContact } from '@/lib/contact';
import { contactSchema, HONEYPOT_FIELD } from '@/lib/contact-schema';

/**
 * JSON contact endpoint, kept for external callers. The site's own form uses
 * the `submitContact` server action; both share the same schema and
 * delivery code.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
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
