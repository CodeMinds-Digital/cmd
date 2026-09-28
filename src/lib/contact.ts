import nodemailer from 'nodemailer';
import { escapeHtml } from '@/lib/escape-html';
import type { ContactInput } from '@/lib/contact-schema';

export type DeliveryResult = { ok: true } | { ok: false; reason: 'not-configured' | 'send-failed' };

const TO = 'cmd@codeminds.digital';

/**
 * Email a validated contact submission to the studio. Server-only: used by
 * the contact server action and the legacy /api/contact route.
 * Fails closed when SMTP credentials are missing.
 */
export async function deliverContact(input: ContactInput): Promise<DeliveryResult> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    console.error('Contact form is not configured: EMAIL_USER / EMAIL_PASS missing.');
    return { ok: false, reason: 'not-configured' };
  }

  const rows: [string, string][] = [
    ['Name', input.name],
    ['Email', input.email],
    ["What they're building", input.project ?? '—'],
    ['Budget', input.budget ?? '—'],
    ['Timeline', input.timeline ?? '—'],
  ];
  const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Every user-supplied value is escaped before it reaches the HTML body.
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <h2 style="border-bottom: 2px solid #FF4D00; padding-bottom: 10px;">New project enquiry</h2>
      <table style="border-collapse: collapse; margin: 16px 0;">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding: 4px 16px 4px 0; color: #5C5A55;">${escapeHtml(k)}</td><td style="padding: 4px 0;"><strong>${escapeHtml(v)}</strong></td></tr>`,
          )
          .join('')}
      </table>
      <div style="background: #F2EFE8; padding: 20px; border-radius: 12px; line-height: 1.6;">
        ${escapeHtml(input.message).replace(/\r?\n/g, '<br>')}
      </div>
      <p style="margin-top: 16px; font-size: 12px; color: #5C5A55;">Submitted ${escapeHtml(submittedAt)} IST via codeminds.digital</p>
    </div>`;

  const text = [
    'New project enquiry',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    input.message,
    '',
    `Submitted ${submittedAt} IST`,
  ].join('\n');

  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transporter.sendMail({
      from: user,
      to: TO,
      replyTo: input.email,
      // Strip line breaks so user input can't shape the subject header.
      subject: `New project enquiry from ${input.name.replace(/[\r\n]+/g, ' ')}`,
      html,
      text,
    });
    return { ok: true };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { ok: false, reason: 'send-failed' };
  }
}
