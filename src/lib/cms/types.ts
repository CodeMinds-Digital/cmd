/**
 * Content models the site renders. Loaded from Appwrite by
 * src/lib/cms/repository.ts (rows are mapped in mappers.ts).
 */
import type { BrandIconKey } from '@/components/icons/brand';

export type CaseStatus = 'live' | 'coming';

export type CaseApproachStep = {
  index: string; // "01", "02"…
  title: string;
  body: string;
};

export type CaseScreen = {
  /** Optional image src — falls back to a generated gradient placeholder. */
  src?: string;
  alt: string;
  caption?: string;
  /** Visual treatment of the placeholder when no src. */
  tone?: 'paper' | 'ink' | 'mixed';
};

export type CaseMetricItem = {
  label: string;
  value: string;
};

export type CaseTestimonial = {
  quote: string;
  author: string;
  role: string;
};

export type CaseStub = {
  slug: string;
  title: string;
  client?: string;
  year: number;
  brief: string;
  tags: string[];
  status: CaseStatus;
  eta?: string;
  /** Square or 16:10 cover image — used by tiles + case hero. */
  cover?: string;
  /** Optional alt for the cover image. Falls back to title. */
  coverAlt?: string;
  role?: string;
  duration?: string;
  liveUrl?: string;
  problem?: string;
  approach?: CaseApproachStep[];
  screens?: CaseScreen[];
  metrics?: CaseMetricItem[];
  testimonial?: CaseTestimonial;
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO yyyy-mm-dd
  readingTime: string;
  tags: string[];
  /** Legacy plain-text body (used when there's no rich document). */
  body?: string;
  /** Rich article (allow-listed JSON; rendered by lib/cms/rich-text.ts). */
  doc?: unknown;
  cover?: { src: string; alt?: string };
  seoTitle?: string;
  seoDescription?: string;
};

export type Capability = {
  index: string;
  title: string;
  tags: string[];
  description: string;
  /** Services offered under this capability (rendered as a list). */
  services?: string[];
  /** One concrete, verifiable line of evidence. */
  proof?: string;
  /** Services split into named groups (rendered side by side when the tile is wide). */
  serviceGroups?: { title: string; items: string[] }[];
  /** Visual weight in the bento; one inverse tile per grid. */
  tone?: 'surface' | 'inverse';
  /** Columns (of 12) at md and lg. Defaults: md 6, lg 4. */
  span?: { md?: 6 | 12; lg?: 4 | 6 | 8 };
};

export type ProcessStep = {
  index: string;
  title: string;
  body: string;
  duration: string;
  deliverables: string[];
};

export type GenericGlyph = 'terminal' | 'phone' | 'code';
export type StackCategory = 'languages' | 'web' | 'mobile' | 'backend' | 'ai-tools' | 'devops';
export type StackItem = {
  label: string;
  category: StackCategory;
  /** Brand mark (monochrome), or a generic glyph where no brand mark may be used. */
  icon: BrandIconKey | GenericGlyph;
};

export type ClientLogo = {
  name: string;
  src?: string;
  /** Rendered width in px when `src` is set. Default 120. */
  width?: number;
};

/** Editable studio facts (Appwrite `siteSettings`). Structure (name, nav) lives in src/config/site.ts. */
export type SiteSettings = {
  email: string;
  calUrl: string;
  city: string;
  country: string;
  timezoneLabel: string;
  replyWithin: string;
  /** Delivery window, in weeks, for the hero stat tile. */
  delivery: { minWeeks: number; maxWeeks: number };
  disciplines: string[];
  booking: { open: boolean; detail: string | null };
};
