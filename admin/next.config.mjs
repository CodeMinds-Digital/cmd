import { fileURLToPath } from 'node:url';

// Repo root: the admin imports the shared workspace package (packages/cms).
const root = fileURLToPath(new URL('..', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  outputFileTracingRoot: root,
  turbopack: { root },
  transpilePackages: ['@codeminds/cms'],
  experimental: {
    // Project saves are JSON documents (≤ 200 KB); images go through /api/upload.
    serverActions: { bodySizeLimit: '256kb' },
    // The proxy buffers bodies; leave room for a 10 MB image upload.
    proxyClientMaxBodySize: '11mb',
  },
};

export default nextConfig;
