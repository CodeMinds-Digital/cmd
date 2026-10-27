/**
 * Brand marks available in the site's sprite (public/brand/stack-icons.svg).
 * Keep in sync with the sprite: tests/unit/brand-sprite.test.mjs checks both
 * ways. Generic glyphs are for tools whose marks can't be used.
 */
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
  "pocketbase",
  "convex",
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

export const GENERIC_GLYPHS = ['terminal', 'phone', 'code'] as const;
export type GenericGlyph = (typeof GENERIC_GLYPHS)[number];
