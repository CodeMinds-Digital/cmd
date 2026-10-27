/**
 * Evolve the live database in place to the CMS plan (D12): additive only.
 * Existing tables, columns and rows are kept; nothing here deletes data.
 * One-off data changes live in scripts/appwrite/migrations/.
 *
 *   npm run appwrite:schema            dry run: prints what would change
 *   npm run appwrite:schema -- --apply apply, then wait until columns are available
 *
 * Idempotent: compares against the live schema and only creates what is
 * missing, and only rewrites permissions/bucket settings that differ.
 * Run `npm run appwrite:backup` first and `npm run appwrite:pull` after.
 *
 * Column types: new text columns are varchar/text/mediumtext (the `string`
 * type is deprecated since 1.9.0). Order uses the existing `orderIndex`
 * convention. Child rows reference their parent by ID column (not a
 * relationship column) so (parentId, orderIndex) can be one index; the admin
 * delete action removes children with the parent (plan D14).
 */
import { Permission, Query, Role, TablesDBIndexType, type Models } from 'node-appwrite';
import { createAdminClient } from '../../packages/cms/src/appwrite/server.ts';
import { retrying } from './retry.mts';

const APPLY = process.argv.includes('--apply');
const admin = createAdminClient();
const env = admin.env;
const [tablesDB, storage] = [retrying(admin.tablesDB), retrying(admin.storage)];
const databaseId = env.databaseId;

// ── Permissions (plan D5/D10: no Role.any() on tables) ───────────────────
const staff = [Role.team('editor'), Role.team('admin')];
const CONTENT = [
  ...staff.map((r) => Permission.read(r)),
  ...staff.map((r) => Permission.create(r)),
  ...staff.map((r) => Permission.update(r)),
  Permission.delete(Role.team('admin')),
];
// Live tables already behind the draft layer (D24): Editors read, only Admins write
// (publishing runs as the Admin's own session, so Appwrite enforces it).
const LIVE_ADMIN = [
  ...staff.map((r) => Permission.read(r)),
  Permission.create(Role.team('admin')),
  Permission.update(Role.team('admin')),
  Permission.delete(Role.team('admin')),
];
// Working copies: any staff member may create, edit and discard.
const DRAFTS = [
  ...staff.map((r) => Permission.read(r)),
  ...staff.map((r) => Permission.create(r)),
  ...staff.map((r) => Permission.update(r)),
  ...staff.map((r) => Permission.delete(r)),
];
// Single seeded row: staff read, Admins update (via publish); nobody creates or deletes.
const SETTINGS = [...staff.map((r) => Permission.read(r)), Permission.update(Role.team('admin'))];
// Enquiries: Admin only; rows are created by the site with the server key.
const ADMIN_ONLY = [Permission.read(Role.team('admin')), Permission.update(Role.team('admin')), Permission.delete(Role.team('admin'))];
// Audit log: append-only via the server key; Admins read.
const AUDIT = [Permission.read(Role.team('admin'))];

// ── Column specs ─────────────────────────────────────────────────────────
type Col =
  | { key: string; type: 'varchar'; size: number; required?: boolean; array?: boolean; default?: string }
  | { key: string; type: 'text' | 'mediumtext'; required?: boolean }
  | { key: string; type: 'integer'; required?: boolean; min?: number; max?: number; default?: number }
  | { key: string; type: 'boolean'; required?: boolean; default?: boolean }
  | { key: string; type: 'datetime'; required?: boolean }
  | { key: string; type: 'enum'; elements: string[]; required?: boolean; default?: string };
type Idx = { key: string; type: 'key' | 'unique'; columns: string[]; orders?: ('ASC' | 'DESC')[] };
type TableSpec = { id: string; name?: string; permissions: string[]; columns?: Col[]; indexes?: Idx[] };

const id36 = (key: string, required = false): Col => ({ key, type: 'varchar', size: 36, required });
const order: Col = { key: 'orderIndex', type: 'integer', required: true, min: 0, max: 10000 };
const state: Col = { key: 'state', type: 'enum', elements: ['draft', 'in_review', 'published', 'archived'], default: 'draft' };
const authors: Col[] = [id36('createdBy'), id36('updatedBy')];

const SPEC: TableSpec[] = [
  {
    id: 'caseStudy',
    permissions: LIVE_ADMIN,
    columns: [state, { key: 'coverSrc', type: 'varchar', size: 255 }, ...authors],
    indexes: [{ key: 'by_state_order', type: 'key', columns: ['state', 'orderIndex'] }],
  },
  {
    id: 'caseApproachStep',
    name: 'Case Approach Steps',
    permissions: LIVE_ADMIN,
    columns: [
      id36('caseStudyId', true),
      order,
      { key: 'displayIndex', type: 'varchar', size: 4 },
      { key: 'title', type: 'varchar', size: 200, required: true },
      { key: 'body', type: 'text', required: true },
    ],
    indexes: [{ key: 'by_case_order', type: 'key', columns: ['caseStudyId', 'orderIndex'] }],
  },
  {
    id: 'caseScreen',
    name: 'Case Screens',
    permissions: LIVE_ADMIN,
    columns: [
      id36('caseStudyId', true),
      order,
      id36('fileId'),
      { key: 'src', type: 'varchar', size: 255 },
      { key: 'alt', type: 'varchar', size: 300, required: true },
      { key: 'caption', type: 'text' },
      { key: 'tone', type: 'enum', elements: ['paper', 'ink', 'mixed'] },
    ],
    indexes: [{ key: 'by_case_order', type: 'key', columns: ['caseStudyId', 'orderIndex'] }],
  },
  {
    id: 'caseMetric',
    name: 'Case Metrics',
    permissions: LIVE_ADMIN,
    columns: [
      id36('caseStudyId', true),
      order,
      { key: 'label', type: 'varchar', size: 60, required: true },
      { key: 'value', type: 'varchar', size: 60, required: true },
    ],
    indexes: [{ key: 'by_case_order', type: 'key', columns: ['caseStudyId', 'orderIndex'] }],
  },
  {
    id: 'contentDraft',
    name: 'Content Drafts',
    permissions: DRAFTS,
    columns: [
      { key: 'tableId', type: 'varchar', size: 32, required: true },
      { key: 'rowId', type: 'varchar', size: 36, required: true },
      { key: 'status', type: 'enum', elements: ['draft', 'in_review'], required: true },
      { key: 'title', type: 'varchar', size: 200, required: true },
      // The whole edited document (e.g. ProjectData) as JSON.
      { key: 'data', type: 'mediumtext', required: true },
      id36('createdBy'),
      id36('updatedBy'),
      id36('submittedBy'),
      { key: 'submittedAt', type: 'datetime' },
    ],
    indexes: [
      { key: 'by_target', type: 'unique', columns: ['tableId', 'rowId'] },
      { key: 'by_table_status', type: 'key', columns: ['tableId', 'status'] },
    ],
  },
  {
    id: 'journalPost',
    permissions: LIVE_ADMIN,
    columns: [
      state,
      { key: 'bodyJson', type: 'mediumtext' },
      { key: 'coverAlt', type: 'varchar', size: 300 },
      { key: 'seoTitle', type: 'varchar', size: 70 },
      { key: 'seoDescription', type: 'varchar', size: 160 },
      { key: 'authorName', type: 'varchar', size: 100 },
      ...authors,
    ],
    indexes: [{ key: 'by_state_published', type: 'key', columns: ['state', 'publishedAt'], orders: ['ASC', 'DESC'] }],
  },
  {
    id: 'testimonial',
    permissions: LIVE_ADMIN,
    columns: [
      { key: 'approved', type: 'boolean', default: false },
      { key: 'orderIndex', type: 'integer', min: 0, max: 10000, default: 0 },
    ],
    indexes: [{ key: 'by_approved_order', type: 'key', columns: ['approved', 'orderIndex'] }],
  },
  {
    id: 'clientLogo',
    permissions: LIVE_ADMIN,
    columns: [
      { key: 'approved', type: 'boolean', default: false },
      { key: 'width', type: 'integer', min: 40, max: 400 },
    ],
    indexes: [{ key: 'by_approved_order', type: 'key', columns: ['approved', 'orderIndex'] }],
  },
  {
    id: 'capability',
    permissions: LIVE_ADMIN,
    columns: [
      state,
      { key: 'services', type: 'varchar', size: 200, array: true },
      { key: 'proof', type: 'varchar', size: 300 },
      { key: 'tone', type: 'enum', elements: ['surface', 'inverse'] },
      { key: 'spanMd', type: 'integer', min: 1, max: 12 },
      { key: 'spanLg', type: 'integer', min: 1, max: 12 },
    ],
    indexes: [{ key: 'by_state_order', type: 'key', columns: ['state', 'orderIndex'] }],
  },
  {
    id: 'capabilityGroup',
    name: 'Capability Groups',
    permissions: LIVE_ADMIN,
    columns: [
      id36('capabilityId', true),
      order,
      { key: 'title', type: 'varchar', size: 100, required: true },
      { key: 'items', type: 'varchar', size: 200, array: true },
    ],
    indexes: [{ key: 'by_capability_order', type: 'key', columns: ['capabilityId', 'orderIndex'] }],
  },
  {
    id: 'processStep',
    permissions: LIVE_ADMIN,
    columns: [state],
    indexes: [{ key: 'by_state_order', type: 'key', columns: ['state', 'orderIndex'] }],
  },
  {
    id: 'stackItem',
    name: 'Stack Items',
    permissions: LIVE_ADMIN,
    columns: [
      { key: 'label', type: 'varchar', size: 60, required: true },
      { key: 'category', type: 'enum', elements: ['languages', 'web', 'mobile', 'backend', 'ai-tools', 'devops'], required: true },
      { key: 'icon', type: 'varchar', size: 32, required: true },
      order,
      state,
    ],
    indexes: [{ key: 'by_category_order', type: 'key', columns: ['category', 'orderIndex'] }],
  },
  {
    id: 'siteSettings',
    permissions: SETTINGS,
    columns: [
      { key: 'city', type: 'varchar', size: 60 },
      { key: 'country', type: 'varchar', size: 60 },
      { key: 'timezoneLabel', type: 'varchar', size: 40 },
      { key: 'replyWithin', type: 'varchar', size: 40 },
      { key: 'bookingOpen', type: 'boolean', default: true },
      { key: 'bookingDetail', type: 'varchar', size: 80 },
      { key: 'deliveryMinWeeks', type: 'integer', min: 1, max: 52 },
      { key: 'deliveryMaxWeeks', type: 'integer', min: 1, max: 52 },
      { key: 'disciplines', type: 'varchar', size: 30, array: true },
    ],
  },
  {
    id: 'lead',
    permissions: ADMIN_ONLY,
    columns: [
      { key: 'budget', type: 'varchar', size: 60 },
      { key: 'timeline', type: 'varchar', size: 60 },
      { key: 'ipHash', type: 'varchar', size: 64 },
      // Full message (form allows 5,000 chars); legacy `message` (string 4,000, required) keeps the first 4,000.
      { key: 'messageBody', type: 'text' },
      { key: 'emailDelivered', type: 'boolean' },
    ],
    indexes: [{ key: 'by_created', type: 'key', columns: ['$createdAt'] }],
  },
  { id: 'auditLog', permissions: AUDIT, indexes: [{ key: 'by_created', type: 'key', columns: ['$createdAt'], orders: ['DESC'] }] },
  // Empty, unused by the plan (nav stays in code; no team page): kept, but no public access.
  { id: 'navItem', permissions: CONTENT },
  { id: 'teamMember', permissions: CONTENT },
];

const BUCKET = {
  bucketId: 'public-assets',
  // Images only. No SVG: it can carry scripts.
  allowedFileExtensions: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif'],
  // Published images are shown on the public site, so read stays public (justified exception).
  permissions: [
    Permission.read(Role.any()),
    ...staff.map((r) => Permission.create(r)),
    ...staff.map((r) => Permission.update(r)),
    Permission.delete(Role.team('admin')),
  ],
  encryption: true,
  antivirus: true,
};

// ── Diff + apply ─────────────────────────────────────────────────────────
const ops: { label: string; run: () => Promise<unknown> }[] = [];
const same = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

function createColumn(tableId: string, c: Col) {
  const base = { databaseId, tableId, key: c.key, required: c.required ?? false };
  switch (c.type) {
    case 'varchar':
      return tablesDB.createVarcharColumn({ ...base, size: c.size, array: c.array, xdefault: c.default });
    case 'text':
      return tablesDB.createTextColumn(base);
    case 'mediumtext':
      return tablesDB.createMediumtextColumn(base);
    case 'integer':
      return tablesDB.createIntegerColumn({ ...base, min: c.min, max: c.max, xdefault: c.default });
    case 'boolean':
      return tablesDB.createBooleanColumn({ ...base, xdefault: c.default });
    case 'datetime':
      return tablesDB.createDatetimeColumn(base);
    case 'enum':
      return tablesDB.createEnumColumn({ ...base, elements: c.elements, xdefault: c.default });
  }
}

const { tables } = await tablesDB.listTables({ databaseId, queries: [Query.limit(100)] });
const live = new Map<string, Models.Table>(tables.map((t) => [t.$id, t]));

for (const spec of SPEC) {
  const table = live.get(spec.id);
  if (!table) {
    ops.push({
      label: `create table ${spec.id}`,
      run: () => tablesDB.createTable({ databaseId, tableId: spec.id, name: spec.name ?? spec.id, permissions: spec.permissions, rowSecurity: false }),
    });
  } else if (!same(table.$permissions, spec.permissions) || table.rowSecurity) {
    ops.push({
      label: `set permissions ${spec.id}: [${table.$permissions.join(', ')}] → [${spec.permissions.join(', ')}]`,
      run: () => tablesDB.updateTable({ databaseId, tableId: spec.id, name: table.name, permissions: spec.permissions, rowSecurity: false }),
    });
  }
  const haveCols = new Set((table?.columns ?? []).map((c) => (c as { key: string }).key));
  for (const c of spec.columns ?? []) {
    if (!haveCols.has(c.key)) ops.push({ label: `add column ${spec.id}.${c.key} (${c.type}${'size' in c ? ` ${c.size}` : ''}${'array' in c && c.array ? '[]' : ''})`, run: () => createColumn(spec.id, c) });
  }
}

const bucket = await storage.getBucket({ bucketId: BUCKET.bucketId });
if (
  !same(bucket.allowedFileExtensions, BUCKET.allowedFileExtensions) ||
  !same(bucket.$permissions, BUCKET.permissions) ||
  bucket.encryption !== BUCKET.encryption ||
  bucket.antivirus !== BUCKET.antivirus
) {
  ops.push({
    label: `update bucket ${bucket.$id}: extensions [${bucket.allowedFileExtensions}] → [${BUCKET.allowedFileExtensions}], encryption ${bucket.encryption} → ${BUCKET.encryption}, permissions → [${BUCKET.permissions.join(', ')}]`,
    run: () =>
      storage.updateBucket({
        bucketId: bucket.$id,
        name: bucket.name,
        permissions: BUCKET.permissions,
        fileSecurity: bucket.fileSecurity,
        enabled: bucket.enabled,
        maximumFileSize: bucket.maximumFileSize,
        allowedFileExtensions: BUCKET.allowedFileExtensions,
        encryption: BUCKET.encryption,
        antivirus: BUCKET.antivirus,
      }),
  });
}

async function waitForColumns(tableId: string) {
  for (let i = 0; i < 60; i++) {
    const t = await tablesDB.getTable({ databaseId, tableId });
    const cols = t.columns as { key: string; status: string; error?: string }[];
    const failed = cols.filter((c) => c.status === 'failed');
    if (failed.length) throw new Error(`${tableId}: column(s) failed: ${failed.map((c) => `${c.key} (${c.error})`).join(', ')}`);
    if (cols.every((c) => c.status === 'available')) return t;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${tableId}: columns not available after 60 s`);
}

// Indexes need their columns available, so they are planned after columns exist.
async function indexOps() {
  const out: typeof ops = [];
  for (const spec of SPEC) {
    if (!spec.indexes?.length) continue;
    const t = live.get(spec.id) && !APPLY ? live.get(spec.id)! : APPLY ? await waitForColumns(spec.id) : undefined;
    const have = new Set((t?.indexes ?? []).map((i) => i.key));
    for (const idx of spec.indexes) {
      if (have.has(idx.key)) continue;
      out.push({
        label: `add index ${spec.id}.${idx.key} (${idx.columns.join(', ')})`,
        run: () =>
          tablesDB.createIndex({
            databaseId,
            tableId: spec.id,
            key: idx.key,
            type: idx.type === 'unique' ? TablesDBIndexType.Unique : TablesDBIndexType.Key,
            columns: idx.columns,
            orders: idx.orders as never,
          }),
      });
    }
  }
  return out;
}

console.log(`${APPLY ? 'Applying to' : 'Dry run against'} database "${databaseId}" (${env.endpoint})\n`);
for (const op of ops) {
  console.log(`  ${op.label}`);
  if (APPLY) await op.run();
}
const idxOps = await indexOps();
for (const op of idxOps) {
  console.log(`  ${op.label}`);
  if (APPLY) await op.run();
}
if (APPLY) for (const spec of SPEC) if (spec.indexes?.length) await waitForIndexes(spec.id);

async function waitForIndexes(tableId: string) {
  for (let i = 0; i < 60; i++) {
    const t = await tablesDB.getTable({ databaseId, tableId });
    const failed = t.indexes.filter((x) => x.status === 'failed');
    if (failed.length) throw new Error(`${tableId}: index(es) failed: ${failed.map((x) => `${x.key} (${x.error})`).join(', ')}`);
    if (t.indexes.every((x) => x.status === 'available')) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${tableId}: indexes not available after 60 s`);
}

const total = ops.length + idxOps.length;
console.log(`\n${total} change(s) ${APPLY ? 'applied' : 'pending'}${!APPLY && total ? '. Re-run with --apply.' : '.'}`);
