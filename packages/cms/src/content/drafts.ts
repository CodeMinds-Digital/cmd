/**
 * contentDraft row IDs: one draft per item (projects, posts) or per whole
 * section (capabilities, process, stack, logos, studio details — rowId "all").
 * Shared by the admin (writes) and the site (draft preview).
 */
const PREFIX: Record<string, string> = {
  caseStudy: 'cs',
  journalPost: 'jp',
  capability: 'cap',
  processStep: 'ps',
  stackItem: 'st',
  clientLogo: 'cl',
  siteSettings: 'ss',
};

export const SECTION_ROW_ID = 'all';

export const draftRowId = (tableId: string, rowId: string) => `${PREFIX[tableId] ?? tableId.slice(0, 4)}_${rowId}`;
