/**
 * Brand marks for the stack strip. The path data lives in one cached sprite,
 * public/brand/stack-icons.svg (referenced with <use href>), so it isn't
 * repeated in every page's HTML and RSC payload.
 * Source: Simple Icons 16.35.0 (CC0-1.0) — provenance in docs/brand/logo-sources.md.
 *
 * Trademarks belong to their owners. They are used here only to state which
 * technologies and tools the studio works with — never to imply partnership
 * or endorsement. Render monochrome via `currentColor`.
 */
export const BRAND_SPRITE = '/brand/stack-icons.svg';

export const brandIconKeys = [
  "rust",
  "go",
  "typescript",
  "javascript",
  "python",
  "kotlin",
  "swift",
  "dart",
  "react",
  "nextdotjs",
  "tailwindcss",
  "flutter",
  "android",
  "nodedotjs",
  "postgresql",
  "appwrite",
  "supabase",
  "firebase",
  "claude",
  "cursor",
  "replit",
  "docker",
  "linux",
  "nginx",
  "githubactions",
  "cloudflare",
] as const;

export type BrandIconKey = (typeof brandIconKeys)[number];
