const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.2'],
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Appwrite Cloud SGP — case covers, screens, logos, headshots are
    // served from the public-assets bucket. Add other regions here if
    // the project moves.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sgp.cloud.appwrite.io',
        pathname: '/v1/storage/buckets/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloud.appwrite.io',
        pathname: '/v1/storage/buckets/**',
      },
    ],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
