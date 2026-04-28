const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.2'],
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
