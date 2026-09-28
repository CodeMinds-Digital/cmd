import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { escapeHtml } from '@/lib/escape-html';

const MAX_LENGTH = {
  name: 200,
  email: 320,
  project: 200,
  message: 5000,
} as const;

/** Coerce an unknown JSON value to a trimmed string, or '' if it isn't one. */
const field = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export async function POST(request: NextRequest) {
  // Fail closed: never fall back to placeholder credentials.
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) {
    console.error('Contact form is not configured: EMAIL_USER / EMAIL_PASS missing.');
    return NextResponse.json(
      { error: 'Contact form is temporarily unavailable. Please email cmd@codeminds.digital.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const name = field(body.name);
    const email = field(body.email);
    const project = field(body.project);
    const message = field(body.message);

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (
      name.length > MAX_LENGTH.name ||
      email.length > MAX_LENGTH.email ||
      project.length > MAX_LENGTH.project ||
      message.length > MAX_LENGTH.message
    ) {
      return NextResponse.json(
        { error: 'One or more fields are too long' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });

    // Every user-supplied value is escaped before it reaches the HTML body.
    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      project: escapeHtml(project || '—'),
      message: escapeHtml(message).replace(/\r?\n/g, '<br>'),
    };
    const submittedAt = new Date().toLocaleString();

    const mailOptions = {
      from: emailUser,
      to: 'cmd@codeminds.digital',
      replyTo: email,
      // Strip line breaks so user input can't shape the subject header.
      subject: `New Contact Form Submission from ${name.replace(/[\r\n]+/g, ' ')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #FF4D00; padding-bottom: 10px;">New Contact Form Submission</h2>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">Contact Details:</h3>
            <p><strong>Name:</strong> ${safe.name}</p>
            <p><strong>Email:</strong> ${safe.email}</p>
            <p><strong>What they're building:</strong> ${safe.project}</p>
          </div>

          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #475569; margin-top: 0;">Message:</h3>
            <p style="line-height: 1.6; color: #334155;">${safe.message}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #f1f5f9; border-radius: 8px; font-size: 12px; color: #64748b;">
            <p>This email was sent from the contact form on your website.</p>
            <p>Submitted at: ${submittedAt}</p>
          </div>
        </div>
      `,
      text: [
        'New Contact Form Submission',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `What they're building: ${project || '—'}`,
        '',
        'Message:',
        message,
        '',
        `Submitted at: ${submittedAt}`,
      ].join('\n'),
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    );
  }
}
