/**
 * Admin-side collection registry.
 *
 * Drives the sidebar nav, the generic list view, and the generic
 * edit form. Each collection registered here must exist in
 * appwrite.json (the schema source of truth).
 *
 * As new collections are added in later phases (caseStudy, journalPost,
 * teamMember, testimonial, clientLogo, capability, processStep), they
 * just append entries here — no per-collection page code required.
 */

export type FieldType =
  | 'string' // single-line
  | 'text' // multi-line plain
  | 'rich-text' // TipTap JSON document with brand marks
  | 'email'
  | 'url'
  | 'integer'
  | 'boolean'
  | 'enum'
  | 'image' // file ID in public-assets bucket
  | 'reference' // $id in another collection
  // Structured array editors. Persisted as JSON-stringified arrays in
  // the underlying string Appwrite attribute.
  | 'approach-list'
  | 'screens-list'
  | 'metrics-list'
  // Umbrella field for site logo (image OR typeset text). Renders
  // a single fieldset that writes to multiple form keys: logoMode,
  // logoText, logoFontFamily, logoFontSize, logoFontWeight,
  // logoLetterSpacing, wordmarkFileId.
  | 'logo-mode';

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** For `enum` — the allowed values. */
  options?: { value: string; label: string }[];
  /** For `reference` — collection ID to link to. */
  referenceCollection?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Max length for string fields. */
  maxLength?: number;
  /** Min/max for integer fields. */
  min?: number;
  max?: number;
  /** Optional regex pattern (string fields). Tested before save. */
  pattern?: { regex: string; message: string };
};

/**
 * Validate a single field value. Returns null on success, or a string
 * error message describing the failure. Used both client-side (live as
 * editor types) and server-side (in saveDocument) so the same rules apply.
 */
export function validateField(
  field: FieldConfig,
  rawValue: string | undefined,
): string | null {
  const value = (rawValue ?? '').trim();

  if (field.required && value === '') {
    return `${field.label} is required.`;
  }

  if (value === '') return null;

  if (field.maxLength && value.length > field.maxLength) {
    return `${field.label} is too long (max ${field.maxLength} characters; you have ${value.length}).`;
  }

  if (field.type === 'integer') {
    const n = Number(value);
    if (Number.isNaN(n)) return `${field.label} must be a number.`;
    if (field.min !== undefined && n < field.min) {
      return `${field.label} must be ≥ ${field.min}.`;
    }
    if (field.max !== undefined && n > field.max) {
      return `${field.label} must be ≤ ${field.max}.`;
    }
  }

  if (field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return `${field.label} must be a valid email.`;
  }

  if (field.type === 'url' && !/^https?:\/\//.test(value)) {
    return `${field.label} must start with http:// or https://`;
  }

  if (field.pattern) {
    const re = new RegExp(field.pattern.regex);
    if (!re.test(value)) return field.pattern.message;
  }

  return null;
}

export type CollectionConfig = {
  /** Matches Appwrite collection $id. */
  id: string;
  /** Display name in the sidebar. */
  label: string;
  /** Singleton mode: only ever one document, edit-by-default. */
  singleton?: boolean;
  /** Document key used as the "title" in lists and breadcrumbs. */
  titleField?: string;
  /** Fields to show in the list view (in order). */
  listColumns: string[];
  /** Field schema for the edit form (in order). */
  fields: FieldConfig[];
};

export const collections: CollectionConfig[] = [
  {
    id: 'siteSettings',
    label: 'Site Settings',
    singleton: true,
    fields: [
      // — Brand identity
      // Logo (image OR typeset text) — see <LogoFieldset>.
      { key: 'logo', label: 'Logo', type: 'logo-mode' },
      { key: 'faviconFileId', label: 'Favicon', type: 'image' },
      { key: 'appleTouchIconFileId', label: 'Apple Touch Icon', type: 'image' },
      { key: 'ogImageFileId', label: 'OG Image (default)', type: 'image' },
      {
        key: 'themeColor',
        label: 'Theme color',
        type: 'string',
        hint: 'Hex value used in <meta name="theme-color">. E.g. #0a0a0c',
        maxLength: 16,
      },

      // — Metadata defaults
      {
        key: 'ogTitle',
        label: 'OG title (default)',
        type: 'string',
        maxLength: 200,
      },
      {
        key: 'ogSubtitle',
        label: 'OG subtitle (default)',
        type: 'text',
        maxLength: 400,
      },

      // — Contact
      {
        key: 'contactEmail',
        label: 'Contact email',
        type: 'email',
        required: true,
      },
      { key: 'phone', label: 'Phone', type: 'string', maxLength: 32 },
      {
        key: 'bookingUrl',
        label: 'Booking URL (Cal.com etc.)',
        type: 'url',
      },

      // — Social
      {
        key: 'twitterHandle',
        label: 'Twitter handle',
        type: 'string',
        hint: 'No leading @. e.g. codeminds',
      },
      {
        key: 'githubHandle',
        label: 'GitHub handle',
        type: 'string',
      },
      {
        key: 'linkedinHandle',
        label: 'LinkedIn handle',
        type: 'string',
      },

      // — Hero copy
      { key: 'heroEyebrow', label: 'Hero · Eyebrow', type: 'string', maxLength: 120, hint: 'Caption above the H1, e.g. "Booking new projects"' },
      { key: 'heroLine1', label: 'Hero · Headline line 1', type: 'string', maxLength: 120, hint: 'First line of the hero H1, e.g. "Software,"' },
      { key: 'heroLine2', label: 'Hero · Headline line 2 (plain)', type: 'string', maxLength: 120, hint: 'Plain text in line 2, e.g. "built with"' },
      { key: 'heroLine2Accent', label: 'Hero · Headline line 2 (italic accent)', type: 'string', maxLength: 80, hint: 'Italic-serif accent word, e.g. "care."' },
      { key: 'heroSub', label: 'Hero · Sub-paragraph', type: 'text', maxLength: 400 },
      { key: 'heroPrimaryCtaLabel', label: 'Hero · Primary CTA label', type: 'string', maxLength: 60 },
      { key: 'heroPrimaryCtaHref', label: 'Hero · Primary CTA link', type: 'string', maxLength: 200 },
      { key: 'heroSecondaryCtaLabel', label: 'Hero · Secondary CTA label', type: 'string', maxLength: 60 },
      { key: 'heroSecondaryCtaHref', label: 'Hero · Secondary CTA link', type: 'string', maxLength: 200 },
      { key: 'heroAnchorLeft', label: 'Hero · Anchor (left)', type: 'string', maxLength: 80 },
      { key: 'heroAnchorCenter', label: 'Hero · Anchor (center)', type: 'string', maxLength: 80 },
    ],
    listColumns: [], // singleton — no list view
  },

  {
    id: 'navItem',
    label: 'Navigation',
    titleField: 'label',
    listColumns: ['label', 'href', 'location', 'orderIndex'],
    fields: [
      { key: 'label', label: 'Label', type: 'string', required: true, maxLength: 64 },
      { key: 'href', label: 'Link', type: 'string', required: true, maxLength: 500 },
      {
        key: 'location',
        label: 'Location',
        type: 'enum',
        required: true,
        options: [
          { value: 'header', label: 'Header' },
          { value: 'footer-studio', label: 'Footer · Studio column' },
          { value: 'footer-work', label: 'Footer · Work column' },
          { value: 'footer-contact', label: 'Footer · Contact column' },
          { value: 'footer-legal', label: 'Footer · Legal column' },
        ],
      },
      {
        key: 'orderIndex',
        label: 'Order',
        type: 'integer',
        required: true,
        hint: 'Lower numbers appear first within their location.',
      },
    ],
  },

  {
    id: 'caseStudy',
    label: 'Case Studies',
    titleField: 'title',
    listColumns: ['title', 'slug', 'status', 'year'],
    fields: [
      { key: 'slug', label: 'Slug', type: 'string', required: true, maxLength: 200, hint: 'URL segment after /work/. Lowercase, hyphenated.' },
      { key: 'title', label: 'Title', type: 'string', required: true, maxLength: 200 },
      { key: 'client', label: 'Client', type: 'string', maxLength: 200 },
      { key: 'year', label: 'Year', type: 'integer', required: true },
      { key: 'brief', label: 'Brief', type: 'text', required: true, maxLength: 500 },
      {
        key: 'status', label: 'Status', type: 'enum', required: true,
        hint: 'Use the workflow buttons below the form to transition status — this dropdown is for emergency overrides.',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'review', label: 'In review' },
          { value: 'published', label: 'Published' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'archived', label: 'Archived' },
          { value: 'coming', label: 'Coming soon' },
          { value: 'live', label: 'Live (legacy alias for published)' },
        ],
      },
      { key: 'eta', label: 'ETA (for "coming" cases)', type: 'string', maxLength: 100 },
      { key: 'coverFileId', label: 'Cover image', type: 'image' },
      { key: 'coverAlt', label: 'Cover alt text', type: 'string', maxLength: 200 },
      { key: 'role', label: 'Role', type: 'string', maxLength: 200 },
      { key: 'duration', label: 'Duration', type: 'string', maxLength: 100 },
      { key: 'liveUrl', label: 'Live URL', type: 'url' },
      { key: 'problem', label: 'Problem statement', type: 'rich-text', maxLength: 1500, hint: 'The "why was this hard?" lead. Italic-serif for accent words.' },
      { key: 'approachJson', label: 'Approach', type: 'approach-list', hint: 'Numbered steps editors see on the case page.' },
      { key: 'screensJson',  label: 'Screens',  type: 'screens-list',  hint: 'Each row uploads its own image and persists alt + caption.' },
      { key: 'metricsJson',  label: 'Metrics',  type: 'metrics-list',  hint: 'Big-number callouts shown after the screens.' },
      { key: 'testimonialId', label: 'Testimonial', type: 'reference', referenceCollection: 'testimonial' },
      { key: 'orderIndex', label: 'Order', type: 'integer' },
    ],
  },

  {
    id: 'journalPost',
    label: 'Journal Posts',
    titleField: 'title',
    listColumns: ['title', 'slug', 'status', 'publishedAt'],
    fields: [
      { key: 'slug', label: 'Slug', type: 'string', required: true, maxLength: 200 },
      { key: 'title', label: 'Title', type: 'string', required: true, maxLength: 200 },
      { key: 'excerpt', label: 'Excerpt', type: 'text', required: true, maxLength: 500 },
      { key: 'publishedAt', label: 'Published at (ISO 8601)', type: 'string', required: true, hint: 'e.g. 2026-04-12T00:00:00Z' },
      { key: 'readingTime', label: 'Reading time', type: 'string', maxLength: 32, hint: 'e.g. "6 min read"' },
      { key: 'coverFileId', label: 'Cover image', type: 'image' },
      { key: 'body', label: 'Body', type: 'rich-text', maxLength: 12000, hint: 'Long-form post body. Use H2/H3, blockquote (pull-quote), code, lists.' },
      {
        key: 'status', label: 'Status', type: 'enum', required: true,
        hint: 'Use the workflow buttons below the form to transition status.',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'review', label: 'In review' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' },
        ],
      },
      { key: 'authorId', label: 'Author', type: 'reference', referenceCollection: 'teamMember' },
    ],
  },

  {
    id: 'testimonial',
    label: 'Testimonials',
    titleField: 'author',
    listColumns: ['author', 'role', 'company'],
    fields: [
      { key: 'quote', label: 'Quote', type: 'text', required: true, maxLength: 1000 },
      { key: 'author', label: 'Author name', type: 'string', required: true, maxLength: 200 },
      { key: 'role', label: 'Role', type: 'string', required: true, maxLength: 200 },
      { key: 'company', label: 'Company', type: 'string', maxLength: 200 },
      { key: 'photoFileId', label: 'Photo', type: 'image' },
    ],
  },

  {
    id: 'teamMember',
    label: 'Team',
    titleField: 'name',
    listColumns: ['name', 'role'],
    fields: [
      { key: 'name', label: 'Name', type: 'string', required: true, maxLength: 200 },
      { key: 'role', label: 'Role', type: 'string', required: true, maxLength: 200 },
      { key: 'bio', label: 'Bio', type: 'text', maxLength: 2000 },
      { key: 'headshotFileId', label: 'Headshot', type: 'image' },
      { key: 'twitterHandle', label: 'Twitter handle', type: 'string', maxLength: 64 },
      { key: 'githubHandle', label: 'GitHub handle', type: 'string', maxLength: 64 },
      { key: 'linkedinHandle', label: 'LinkedIn handle', type: 'string', maxLength: 64 },
    ],
  },

  {
    id: 'capability',
    label: 'Capabilities',
    titleField: 'title',
    listColumns: ['title', 'displayIndex', 'orderIndex'],
    fields: [
      { key: 'displayIndex', label: 'Display index', type: 'string', maxLength: 4, hint: 'Two-digit caption shown next to the title, e.g. "01"' },
      { key: 'title', label: 'Title', type: 'string', required: true, maxLength: 100 },
      { key: 'description', label: 'Description', type: 'text', required: true, maxLength: 500 },
      { key: 'orderIndex', label: 'Order', type: 'integer', required: true, hint: 'Lower numbers appear first.' },
    ],
  },

  {
    id: 'processStep',
    label: 'Process Steps',
    titleField: 'title',
    listColumns: ['displayIndex', 'title', 'duration', 'orderIndex'],
    fields: [
      { key: 'displayIndex', label: 'Display index', type: 'string', required: true, maxLength: 4, hint: '"01", "02", "03", "04"' },
      { key: 'title', label: 'Title', type: 'string', required: true, maxLength: 100 },
      { key: 'duration', label: 'Duration', type: 'string', maxLength: 100, hint: 'e.g. "1 week", "2–4 weeks"' },
      { key: 'body', label: 'Body', type: 'text', required: true, maxLength: 1000 },
      { key: 'iconPath', label: 'Icon SVG path', type: 'text', maxLength: 1500, hint: 'Path d-attribute for <DrawIcon>. Find one at heroicons.com.' },
      { key: 'orderIndex', label: 'Order', type: 'integer', required: true },
    ],
  },

  {
    id: 'clientLogo',
    label: 'Client Logos',
    titleField: 'name',
    listColumns: ['name', 'ndaBound', 'orderIndex'],
    fields: [
      { key: 'name', label: 'Client name', type: 'string', required: true, maxLength: 100 },
      { key: 'logoFileId', label: 'Logo image', type: 'image', hint: 'Optional. Falls back to wordmark text if not provided.' },
      { key: 'ndaBound', label: 'NDA — hide from public render', type: 'boolean' },
      { key: 'orderIndex', label: 'Order', type: 'integer', required: true },
    ],
  },

  {
    id: 'lead',
    label: 'Leads',
    titleField: 'name',
    listColumns: ['name', 'email', 'status', 'source'],
    fields: [
      { key: 'name', label: 'Name', type: 'string', required: true, maxLength: 200 },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'project', label: 'What they\'re building', type: 'text', maxLength: 500 },
      { key: 'message', label: 'Message', type: 'text', required: true, maxLength: 4000 },
      {
        key: 'status', label: 'Status', type: 'enum', required: true,
        options: [
          { value: 'new', label: 'New' },
          { value: 'qualified', label: 'Qualified' },
          { value: 'replied', label: 'Replied' },
          { value: 'won', label: 'Won' },
          { value: 'lost', label: 'Lost' },
        ],
      },
      {
        key: 'source', label: 'Source', type: 'enum', required: true,
        options: [
          { value: 'contact-form', label: 'Contact form' },
          { value: 'referral', label: 'Referral' },
          { value: 'direct', label: 'Direct outreach' },
          { value: 'other', label: 'Other' },
        ],
      },
      { key: 'assignedTo', label: 'Assigned to (user $id)', type: 'string', maxLength: 64, hint: 'Appwrite user $id of the team member who owns the follow-up.' },
      { key: 'notes', label: 'Internal notes', type: 'text', maxLength: 4000 },
      { key: 'userAgent', label: 'User agent', type: 'string', maxLength: 500, hint: 'Captured at submission. Read-only in practice.' },
      { key: 'ipAddress', label: 'IP address', type: 'string', maxLength: 64, hint: 'Captured at submission.' },
    ],
  },
];

export function getCollection(id: string): CollectionConfig | undefined {
  return collections.find((c) => c.id === id);
}
