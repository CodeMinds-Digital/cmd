/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Surface tones (dark canvas) ──────────────────────────
        ink: {
          900: '#0a0a0c',  // page bg
          800: '#101013',  // section bg, cards
          700: '#17171b',  // elevated cards
          600: '#22222a',  // dividers
          500: '#3a3a45',  // muted borders
        },
        // ── Text on dark ─────────────────────────────────────────
        paper: {
          50:  '#f5f5f7',  // primary
          100: '#e8e8ed',  // body
          200: '#cfcfd9',  // secondary
          300: '#a5a5b4',  // dim / labels
          400: '#6b6c8a',  // mono utility / anchor text
        },
        // ── Single brand accent — indigo ─────────────────────────
        // Canonical accent shades for the new design: 300, 400, 500, 600.
        // The 50/100/200/700+ shades are retained as legacy shims for
        // sections that R2 will rewrite. Do not introduce new uses outside
        // the canonical four.
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#c7d2fe',  // canonical (hover/active text)
          400: '#a5b4fc',  // canonical (links, highlights)
          500: '#818cf8',  // canonical (primary fill)
          600: '#6366f1',  // canonical (pressed, shader uniform)
          700: '#4f46e5',
          800: '#3730a3',
          900: '#312e81',
        },
        // Tailwind's `neutral` ramp stays available for legacy callers;
        // it will be cleaned up as sections are rewritten in R2.
      },
      fontFamily: {
        sans:  ['var(--font-geist)',      'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)',      'Georgia',   'serif'],
        mono:  ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Editorial scale — major-third (1.25). lh / letter-spacing baked in.
        'mono-xs': ['10px', { lineHeight: '1',    letterSpacing: '0.22em' }],
        'mono-sm': ['11px', { lineHeight: '1.4',  letterSpacing: '0.18em' }],
        'body':    ['15px', { lineHeight: '1.6' }],
        'lead':    ['18px', { lineHeight: '1.55' }],
        'h3':      ['24px', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
        'h2':      ['40px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'h1':      ['72px', { lineHeight: '0.95', letterSpacing: '-0.025em' }],
        'display': ['96px', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        // Legacy default scale retained so existing components don't blow up.
        'xs':  ['0.75rem',   { lineHeight: '1rem' }],
        'sm':  ['0.875rem',  { lineHeight: '1.25rem' }],
        'base':['1rem',      { lineHeight: '1.5rem' }],
        'lg':  ['1.125rem',  { lineHeight: '1.75rem' }],
        'xl':  ['1.25rem',   { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],
        '3xl': ['1.875rem',  { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',   { lineHeight: '2.5rem' }],
        '5xl': ['3rem',      { lineHeight: '1.1' }],
        '6xl': ['3.75rem',   { lineHeight: '1.1' }],
        '7xl': ['4.5rem',    { lineHeight: '1.1' }],
      },
      spacing: {
        '18':  '4.5rem',
        '88':  '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        // House easings — used everywhere
        'expo-out':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'quint-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'gentle':    'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      transitionDuration: {
        // House durations
        'instant': '100ms',
        'snap':    '200ms',
        'natural': '450ms',
        'reveal':  '900ms',
      },
      boxShadow: {
        // Dark-surface friendly shadows: lift via inner glow + faint drop
        'soft':    '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 1px 2px 0 rgba(0,0,0,0.4)',
        'medium':  '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 24px -8px rgba(0,0,0,0.55)',
        'glow':    '0 0 32px rgba(99, 102, 241, 0.18)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        // Kept fadeIn only — used by globals.css legacy class.
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
