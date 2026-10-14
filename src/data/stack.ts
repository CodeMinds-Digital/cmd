import type { BrandIconKey } from '@/components/icons/brand';

/**
 * Technologies and tools the studio works with — shown in the home page's
 * stack strip. Services (what we sell) live in data/capabilities.ts.
 * Only list what we'd staff a project on today.
 */

export type GenericGlyph = 'terminal' | 'phone' | 'code';

export type StackCategory = 'languages' | 'web' | 'mobile' | 'backend' | 'ai-tools' | 'devops';

export type StackItem = {
  label: string;
  category: StackCategory;
  /** Brand mark (monochrome), or a generic glyph where no brand mark may be used. */
  icon: BrandIconKey | GenericGlyph;
};

export const stackCategories: { id: StackCategory; label: string }[] = [
  { id: 'languages', label: 'Languages' },
  { id: 'web', label: 'Web' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'backend', label: 'Backend' },
  { id: 'ai-tools', label: 'AI tools' },
  { id: 'devops', label: 'Cloud & DevOps' },
];

export const stack: StackItem[] = [
  // Languages
  { label: 'Rust', category: 'languages', icon: 'rust' },
  { label: 'Go', category: 'languages', icon: 'go' },
  { label: 'TypeScript', category: 'languages', icon: 'typescript' },
  { label: 'JavaScript', category: 'languages', icon: 'javascript' },
  { label: 'Python', category: 'languages', icon: 'python' },
  // Oracle's Java logo isn't available for this use: generic code glyph.
  { label: 'Java', category: 'languages', icon: 'code' },
  { label: 'Kotlin', category: 'languages', icon: 'kotlin' },
  { label: 'Swift', category: 'languages', icon: 'swift' },
  { label: 'Dart', category: 'languages', icon: 'dart' },
  // Web
  { label: 'React', category: 'web', icon: 'react' },
  { label: 'Next.js', category: 'web', icon: 'nextdotjs' },
  { label: 'Tailwind CSS', category: 'web', icon: 'tailwindcss' },
  // Mobile
  { label: 'Flutter', category: 'mobile', icon: 'flutter' },
  { label: 'React Native', category: 'mobile', icon: 'react' },
  { label: 'SwiftUI', category: 'mobile', icon: 'swift' },
  { label: 'Android', category: 'mobile', icon: 'android' },
  // Apple's guidelines don't permit third-party use of the Apple logo, and the
  // 'iOS' mark is just the word — use a generic phone glyph.
  { label: 'iOS', category: 'mobile', icon: 'phone' },
  // Backend & backend-as-a-service
  { label: 'Node.js', category: 'backend', icon: 'nodedotjs' },
  { label: 'PostgreSQL', category: 'backend', icon: 'postgresql' },
  { label: 'Appwrite', category: 'backend', icon: 'appwrite' },
  { label: 'Supabase', category: 'backend', icon: 'supabase' },
  { label: 'Firebase', category: 'backend', icon: 'firebase' },
  // AI tools
  { label: 'Claude Code', category: 'ai-tools', icon: 'claude' },
  { label: 'Cursor', category: 'ai-tools', icon: 'cursor' },
  { label: 'Replit', category: 'ai-tools', icon: 'replit' },
  // OpenAI's mark isn't licensed for this use (and isn't in Simple Icons):
  // text label with a generic terminal glyph instead.
  { label: 'Codex', category: 'ai-tools', icon: 'terminal' },
  // Cloud & DevOps
  { label: 'Docker', category: 'devops', icon: 'docker' },
  { label: 'Linux', category: 'devops', icon: 'linux' },
  { label: 'Nginx', category: 'devops', icon: 'nginx' },
  { label: 'GitHub Actions', category: 'devops', icon: 'githubactions' },
  { label: 'Cloudflare', category: 'devops', icon: 'cloudflare' },
];
