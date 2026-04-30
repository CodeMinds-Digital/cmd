/**
 * Case-study type definitions. Single source of truth for the shape
 * of a case study across CMS reads, admin schema, page renderers, and
 * the migration script. Values flow through Appwrite at runtime; the
 * typed schema lives here.
 */

/**
 * Workflow + display states.
 *   - draft / review / published / archived → workflow (Phase A6)
 *   - live    → legacy alias for `published` (kept for backwards compat)
 *   - coming  → placeholder for "coming soon" stub cases
 *   - scheduled → set + flipped to `published` by /api/cron/publish-scheduled
 */
export type CaseStatus =
  | 'draft'
  | 'review'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'live'
  | 'coming';

export type CaseApproachStep = {
  /** "01" / "02" / … — string so we can use leading zeros. */
  index: string;
  title: string;
  body: string;
};

export type CaseScreen = {
  /** Pre-resolved public URL when read from CMS; undefined if no asset yet. */
  src?: string;
  /** Appwrite Storage file ID — only present in admin-edit context. */
  fileId?: string;
  alt: string;
  caption?: string;
  /** Fallback gradient tone when src is missing. */
  tone?: 'indigo' | 'cyan' | 'mixed';
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

  /** Pre-resolved public URL when read from CMS. */
  cover?: string;
  /** Appwrite Storage file ID — only present in admin-edit context. */
  coverFileId?: string;
  coverAlt?: string;

  role?: string;
  duration?: string;
  liveUrl?: string;

  problem?: string;
  approach?: CaseApproachStep[];
  screens?: CaseScreen[];
  metrics?: CaseMetricItem[];
  testimonial?: CaseTestimonial;
  /** Reference to the linked testimonial document — admin-edit context only. */
  testimonialId?: string;

  orderIndex?: number;
};
