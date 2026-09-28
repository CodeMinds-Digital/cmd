const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Automatic memoization (babel-plugin-react-compiler).
  reactCompiler: true,
  allowedDevOrigins: ['192.168.1.2'],
  output: 'standalone',
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
    // Required for `next/image` to render local SVG assets (case covers,
    // case screens). Files are first-party in public/work/ — no remote
    // SVG. CSP locks down what an SVG can do (no scripts, sandboxed).
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = withBundleAnalyzer(nextConfig);
