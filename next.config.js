const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Automatic memoization (babel-plugin-react-compiler).
  reactCompiler: true,
  experimental: {
    // The contact form is the only server action; its payload is < 10 KB.
    serverActions: { bodySizeLimit: '64kb' },
    // Inline the (small) global stylesheet into the HTML: saves a render-
    // blocking round trip before first paint on slow mobile connections.
    inlineCss: true,
  },
  allowedDevOrigins: ['192.168.1.2'],
  output: 'standalone',
  // Shared Appwrite code (npm workspace) ships as TypeScript source.
  transpilePackages: ['@codeminds/cms'],
  // Pin the workspace root to this project; a stray lockfile higher up the
  // tree otherwise makes Next infer the wrong root for tracing/Turbopack.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  outputFileTracingExcludes: {
    '*': [
      'docs/**',
      'backups/**',
      '.superpowers/**',
      '.qodo/**',
      '.claude/**',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Images uploaded in the admin (Appwrite Storage, public-assets bucket).
    remotePatterns: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
      ? [
          {
            protocol: 'https',
            hostname: new URL(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).hostname,
            pathname: '/v1/storage/buckets/public-assets/files/**',
          },
        ]
      : [],
    // Required for `next/image` to render local SVG assets (case covers,
    // case screens). Files are first-party in public/work/ — no remote
    // SVG. CSP locks down what an SVG can do (no scripts, sandboxed).
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Baseline security headers. The pages stay static, so there's no per-request
  // script nonce here: the CSP restricts framing, plugins, <base> and form
  // targets, not scripts (the admin app has the strict nonce CSP).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
