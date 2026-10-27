/**
 * Which site cache tag a table's rows feed. A row change in any listed table
 * revalidates that tag; tables not listed (enquiries, audit log) never touch
 * public pages.
 */
export const CACHE_TAGS = {
  cases: 'cms:cases',
  posts: 'cms:posts',
  capabilities: 'cms:capabilities',
  process: 'cms:process',
  stack: 'cms:stack',
  logos: 'cms:logos',
  site: 'cms:site',
} as const;
export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

const TABLE_TAG: Record<string, CacheTag> = {
  caseStudy: CACHE_TAGS.cases,
  caseApproachStep: CACHE_TAGS.cases,
  caseScreen: CACHE_TAGS.cases,
  caseMetric: CACHE_TAGS.cases,
  testimonial: CACHE_TAGS.cases,
  journalPost: CACHE_TAGS.posts,
  capability: CACHE_TAGS.capabilities,
  capabilityGroup: CACHE_TAGS.capabilities,
  processStep: CACHE_TAGS.process,
  stackItem: CACHE_TAGS.stack,
  clientLogo: CACHE_TAGS.logos,
  siteSettings: CACHE_TAGS.site,
};

export function tagForTable(tableId: string): CacheTag | undefined {
  return Object.hasOwn(TABLE_TAG, tableId) ? TABLE_TAG[tableId] : undefined;
}

/** `databases.<db>.tables.<table>.rows.<row>.<action>` → table ID. */
export function tableFromEvent(event: string): string | undefined {
  return /^databases\.[^.]+\.tables\.([^.]+)\.rows\./.exec(event)?.[1];
}
