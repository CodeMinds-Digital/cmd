import type { BrandIconKey } from '@/components/icons/brand';

/**
 * Technologies and tools the studio works with — shown in the home page's
 * stack strip. Services (what we sell) live in data/capabilities.ts.
 * Only list what we'd staff a project on today.
 */

export type GenericGlyph = 'terminal' | 'phone';

export type StackCategory = 'languages' | 'web' | 'mobile' | 'ai-tools';

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
  { id: 'ai-tools', label: 'AI tools' },
];

export const stack: StackItem[] = [
  { label: 'Rust', category: 'languages', icon: 'rust' },
  { label: 'JavaScript', category: 'languages', icon: 'javascript' },
  { label: 'TypeScript', category: 'languages', icon: 'typescript' },
  { label: 'React', category: 'web', icon: 'react' },
  { label: 'Next.js', category: 'web', icon: 'nextdotjs' },
  { label: 'Flutter', category: 'mobile', icon: 'flutter' },
  { label: 'React Native', category: 'mobile', icon: 'react' },
  { label: 'SwiftUI', category: 'mobile', icon: 'swift' },
  { label: 'Android', category: 'mobile', icon: 'android' },
  // Apple's guidelines don't permit third-party use of the Apple logo, and the
  // 'iOS' mark is just the word — use a generic phone glyph.
  { label: 'iOS', category: 'mobile', icon: 'phone' },
  { label: 'Claude Code', category: 'ai-tools', icon: 'claude' },
  { label: 'Cursor', category: 'ai-tools', icon: 'cursor' },
  { label: 'Replit', category: 'ai-tools', icon: 'replit' },
  // OpenAI's mark isn't licensed for this use (and isn't in Simple Icons):
  // text label with a generic terminal glyph instead.
  { label: 'Codex', category: 'ai-tools', icon: 'terminal' },
];
