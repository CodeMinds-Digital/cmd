/**
 * Journal post type. Single source of truth for the shape across
 * CMS reads, admin schema, page renderers, and migration.
 */

export type PostStatus = 'draft' | 'published' | 'scheduled';

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO 8601 (yyyy-mm-dd or full timestamp). */
  date: string;
  readingTime: string;
  tags: string[];
  /** Optional long-form body (markdown for v1; TipTap JSON in A5+). */
  body?: string;
};
