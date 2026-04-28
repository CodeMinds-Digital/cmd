'use client';

import React, { useState } from 'react';
import SplitText from '@/components/animations/SplitText';
import Magnetic from '@/components/animations/Magnetic';
import SectionEyebrow from '@/components/ui/SectionEyebrow';

type FormState = {
  name: string;
  email: string;
  project: string;
  message: string;
};

const initialState: FormState = {
  name: '',
  email: '',
  project: '',
  message: '',
};

export default function Conversation() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setForm(initialState);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error ?? 'Failed to send. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="section-padding relative bg-ink-900 border-t border-ink-700 overflow-hidden"
    >
      <div className="container">
        <SectionEyebrow index="04" label="Let's talk" className="mb-8" />

        {/* Closing-moment headline */}
        <h2 className="text-h2 md:text-display font-bold text-paper-50 mb-16 md:mb-24 max-w-5xl text-balance">
          <SplitText>Let&apos;s make</SplitText>
          <SplitText
            className="font-serif italic font-normal text-brand-400"
            delay={0.4}
          >
            something.
          </SplitText>
        </h2>

        {/* Two-column layout — form left, contact info right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left: form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 space-y-8"
          >
            <Field label="Name" name="name" value={form.name} onChange={handleChange} required />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Field
              label="What you're building"
              name="project"
              value={form.project}
              onChange={handleChange}
              placeholder="e.g. Marketing rebuild · Mobile MVP · AI search"
            />
            <FieldArea
              label="Tell us more"
              name="message"
              value={form.message}
              onChange={handleChange}
              required
            />

            {error && (
              <p className="font-mono text-mono-sm text-red-400">{error}</p>
            )}
            {success && (
              <p className="font-mono text-mono-sm text-brand-400">
                Thanks — we'll be in touch within 24 hours.
              </p>
            )}

            <div className="flex items-center gap-6 pt-2">
              <Magnetic>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary btn-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send'}
                  {!submitting && (
                    <svg
                      className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  )}
                </button>
              </Magnetic>
              <span className="font-mono text-mono-sm text-paper-400">
                Or email cmd@codeminds.digital
              </span>
            </div>
          </form>

          {/* Right: direct channels */}
          <aside className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-ink-700">
            <ChannelRow label="Email" value="cmd@codeminds.digital" href="mailto:cmd@codeminds.digital" />
            <ChannelRow label="Book a call" value="cal.com/codeminds" href="https://cal.com/codeminds" />
            <ChannelRow label="Location" value="Chennai · IST · UTC+5:30" />
            <ChannelRow label="Response" value="Within 24 hours" />
          </aside>
        </div>

        {/* Footer caption strip */}
        <div className="mt-24 pt-8 border-t border-ink-700 flex items-center justify-between font-mono text-mono-sm text-paper-400">
          <span>WE REPLY WITHIN 24H</span>
          <span className="hidden md:inline">CHENNAI · IST</span>
          <span>v2026.1</span>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: keyof FormState;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block group">
      <span className="font-mono text-mono-sm text-paper-400 group-focus-within:text-brand-400 transition-colors">
        {label}
        {required && <span className="ml-1">*</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="mt-2 block w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-lead text-paper-50 placeholder:text-paper-400 py-2 transition-colors"
      />
    </label>
  );
}

function FieldArea({
  label,
  name,
  value,
  onChange,
  required,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
}) {
  return (
    <label className="block group">
      <span className="font-mono text-mono-sm text-paper-400 group-focus-within:text-brand-400 transition-colors">
        {label}
        {required && <span className="ml-1">*</span>}
      </span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        rows={4}
        className="mt-2 block w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-lead text-paper-50 py-2 transition-colors resize-none"
      />
    </label>
  );
}

function ChannelRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-baseline justify-between py-5 border-b border-ink-700 group">
      <span className="font-mono text-mono-sm text-paper-400">{label}</span>
      <span
        className={`text-body text-paper-100 ${
          href ? 'group-hover:text-brand-400 transition-colors' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );

  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
}
