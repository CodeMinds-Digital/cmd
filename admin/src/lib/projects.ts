import 'server-only';
import type { TablesDB } from 'node-appwrite';
import { projectFromLive, projectSchema, type ProjectData } from '@codeminds/cms/content/project';
import type { CaseApproachStepRow, CaseMetricRow, CaseScreenRow, CaseStudyRow, ContentDraftRow, TestimonialRow } from '@codeminds/cms/schema';
import { Query } from '@codeminds/cms/server';
import { getDraft, listDrafts } from '@/lib/drafts';

export type ProjectListItem = {
  rowId: string;
  title: string;
  slug: string;
  /** Live row state; null = never published. */
  live: 'published' | 'unpublished' | null;
  draft: 'draft' | 'in_review' | null;
  updatedAt: string;
  orderIndex: number | null;
};

export async function listProjects(db: TablesDB, databaseId: string): Promise<ProjectListItem[]> {
  const [live, drafts] = await Promise.all([
    db.listRows<CaseStudyRow>({ databaseId, tableId: 'caseStudy', queries: [Query.orderAsc('orderIndex'), Query.limit(100)] }),
    listDrafts(db, databaseId, 'caseStudy'),
  ]);
  const byRow = new Map(drafts.map((d) => [d.rowId, d]));
  const items: ProjectListItem[] = live.rows.map((r) => {
    const d = byRow.get(r.$id);
    byRow.delete(r.$id);
    return {
      rowId: r.$id,
      title: d?.title ?? r.title,
      slug: r.slug,
      live: r.state === 'published' ? 'published' : 'unpublished',
      draft: d?.status ?? null,
      updatedAt: d?.$updatedAt ?? r.$updatedAt,
      orderIndex: r.orderIndex ?? null,
    };
  });
  for (const d of byRow.values()) {
    items.push({ rowId: d.rowId, title: d.title, slug: draftSlug(d), live: null, draft: d.status, updatedAt: d.$updatedAt, orderIndex: null });
  }
  return items;
}

function draftSlug(d: ContentDraftRow) {
  try {
    return String((JSON.parse(d.data) as { slug?: string }).slug ?? '');
  } catch {
    return '';
  }
}

export type LoadedProject = {
  rowId: string;
  data: ProjectData;
  live: CaseStudyRow | null;
  draft: ContentDraftRow | null;
};

/** The editable document: the draft if one exists, else the published version. */
export async function loadProject(db: TablesDB, databaseId: string, rowId: string): Promise<LoadedProject | null> {
  const [live, draft] = await Promise.all([
    db.getRow<CaseStudyRow>({ databaseId, tableId: 'caseStudy', rowId }).catch(() => null),
    getDraft(db, databaseId, 'caseStudy', rowId),
  ]);
  if (!live && !draft) return null;
  if (draft) {
    const parsed = projectSchema.safeParse(JSON.parse(draft.data));
    // An invalid saved draft (e.g. half-finished) is still loaded raw so nothing is lost.
    return { rowId, data: parsed.success ? parsed.data : (JSON.parse(draft.data) as ProjectData), live, draft };
  }
  const q = [Query.equal('caseStudyId', rowId), Query.limit(100)];
  const [steps, screens, metrics, testimonial] = await Promise.all([
    db.listRows<CaseApproachStepRow>({ databaseId, tableId: 'caseApproachStep', queries: q }).then((r) => r.rows),
    db.listRows<CaseScreenRow>({ databaseId, tableId: 'caseScreen', queries: q }).then((r) => r.rows),
    db.listRows<CaseMetricRow>({ databaseId, tableId: 'caseMetric', queries: q }).then((r) => r.rows),
    live!.testimonialId ? db.getRow<TestimonialRow>({ databaseId, tableId: 'testimonial', rowId: live!.testimonialId }).catch(() => null) : null,
  ]);
  return { rowId, data: projectFromLive(live!, { steps, screens, metrics, testimonial }), live, draft: null };
}
