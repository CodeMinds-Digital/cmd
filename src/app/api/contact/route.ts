import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { databases, ID, Permission, Role } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';

export const runtime = 'nodejs';

/**
 * Public contact-form endpoint.
 *
 * v1 (Phase A2): emailed via Nodemailer only.
 * v2 (this — A7): primary destination is the Appwrite `lead` collection
 * so editors get a leads inbox in /admin. Email is now best-effort: if
 * SMTP creds are configured, we still notify the team mailbox; if not,
 * the lead row is the source of truth.
 *
 * Order matters — we write the lead first so a transient SMTP outage
 * never loses an inbound enquiry. Email failures are logged but don't
 * surface to the user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const project = String(body.project ?? '').trim();
    // Older form versions submit `message`; the new one matches schema.
    const message = String(body.message ?? '').trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 },
      );
    }
    if (name.length > 200 || email.length > 254 || message.length > 4000) {
      return NextResponse.json(
        { error: 'One or more fields exceed allowed length.' },
        { status: 400 },
      );
    }

    const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? '';
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '';

    // Primary write: Appwrite `lead` collection.
    let leadId: string | null = null;
    try {
      const lead = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        'lead',
        ID.unique(),
        {
          name,
          email,
          project: project || undefined,
          message,
          source: 'contact-form',
          status: 'new',
          userAgent: userAgent || undefined,
          ipAddress: ipAddress || undefined,
        },
        [
          // Authors of public form rows can't read or edit them once submitted.
          Permission.read(Role.team('editor')),
          Permission.read(Role.team('admin')),
          Permission.update(Role.team('editor')),
          Permission.update(Role.team('admin')),
          Permission.delete(Role.team('admin')),
        ],
      );
      leadId = lead.$id;
    } catch (e) {
      // If the DB write itself fails, surface the error — losing an
      // inbound enquiry is worse than a 500 the user can retry.
      console.error('Lead create failed:', e);
      return NextResponse.json(
        { error: 'Could not save your message. Please try again.' },
        { status: 500 },
      );
    }

    // Secondary: SMTP notification. Best-effort.
    void sendNotification({ name, email, project, message, leadId }).catch(
      (e) => {
        // Don't bubble up — lead is already saved.
        console.warn('Lead email notification failed:', e);
      },
    );

    return NextResponse.json({ ok: true, leadId }, { status: 200 });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 },
    );
  }
}

async function sendNotification(input: {
  name: string;
  email: string;
  project: string;
  message: string;
  leadId: string | null;
}): Promise<void> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass || pass === 'your-app-password') {
    // No SMTP creds configured — skip silently. The lead row is enough.
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const adminLink = input.leadId
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codeminds.digital'}/admin/lead/${input.leadId}`
    : null;

  await transporter.sendMail({
    from: user,
    to: 'cmd@codeminds.digital',
    subject: `New lead: ${input.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a0a0c; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
          New lead
        </h2>
        <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        ${input.project ? `<p><strong>Project:</strong> ${escapeHtml(input.project)}</p>` : ''}
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-top:16px;">
          <strong>Message:</strong>
          <p style="line-height:1.6;color:#334155;">${escapeHtml(input.message).replace(/\n/g, '<br>')}</p>
        </div>
        ${adminLink ? `<p style="margin-top:24px;"><a href="${adminLink}" style="color:#6366f1;">Open in admin →</a></p>` : ''}
      </div>
    `,
    text: `New lead

Name: ${input.name}
Email: ${input.email}
${input.project ? `Project: ${input.project}\n` : ''}
Message:
${input.message}
${adminLink ? `\nOpen in admin: ${adminLink}\n` : ''}`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
