/**
 * Enquiry retention (plan D10): delete `lead` rows not updated for
 * RETENTION_MONTHS (default 24). Runs daily on a schedule; each deletion is
 * written to the audit log by row ID only (no personal data).
 *
 * Dry run (manual execution): body {"dryRun": true} reports what would be
 * deleted without deleting; {"dryRun": true, "olderThanDays": N} tests the
 * selection with a shorter window. A real run ignores olderThanDays.
 *
 * Uses the execution's own short-lived API key (x-appwrite-key), scoped to
 * rows.read + rows.write. No dependencies: plain REST.
 */
const PAGE = 100;

export function cutoff(now, { months, days }) {
  const d = new Date(now);
  if (days !== undefined) d.setUTCDate(d.getUTCDate() - days);
  else d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
}

export default async function retention({ req, res, log, error }) {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const project = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const databaseId = process.env.DATABASE_ID;
  const months = Number(process.env.RETENTION_MONTHS ?? 24);
  const key = req.headers['x-appwrite-key'];
  if (!endpoint || !project || !databaseId || !key || !(months >= 1)) {
    error('Missing endpoint, project, DATABASE_ID, RETENTION_MONTHS or execution key.');
    return res.json({ ok: false }, 500);
  }

  let body = {};
  try {
    body = typeof req.bodyJson === 'object' && req.bodyJson ? req.bodyJson : JSON.parse(req.bodyText || '{}');
  } catch {
    body = {};
  }
  const dryRun = body.dryRun === true;
  const days = dryRun && Number.isInteger(body.olderThanDays) && body.olderThanDays >= 0 ? body.olderThanDays : undefined;
  const before = cutoff(Date.now(), { months, days });

  const headers = { 'content-type': 'application/json', 'x-appwrite-project': project, 'x-appwrite-key': key };
  const api = async (method, path, payload) => {
    const r = await fetch(`${endpoint}${path}`, { method, headers, body: payload ? JSON.stringify(payload) : undefined, signal: AbortSignal.timeout(15_000) });
    if (!r.ok && r.status !== 204) throw new Error(`${method} ${path.split('?')[0]} → ${r.status}`);
    return r.status === 204 ? null : r.json();
  };
  const q = (o) => `queries[]=${encodeURIComponent(JSON.stringify(o))}`;

  // Collect every candidate first, then delete (so paging is not disturbed by deletions).
  const ids = [];
  let cursor;
  for (;;) {
    const query = [q({ method: 'lessThan', attribute: '$updatedAt', values: [before] }), q({ method: 'select', values: ['$id'] }), q({ method: 'limit', values: [PAGE] })];
    if (cursor) query.push(q({ method: 'cursorAfter', values: [cursor] }));
    const page = await api('GET', `/tablesdb/${databaseId}/tables/lead/rows?${query.join('&')}`);
    ids.push(...page.rows.map((r) => r.$id));
    if (page.rows.length < PAGE) break;
    cursor = page.rows.at(-1).$id;
  }

  if (dryRun) {
    log(`Dry run: ${ids.length} enquiries last updated before ${before}.`);
    return res.json({ ok: true, dryRun: true, before, candidates: ids.length, ids });
  }

  let deleted = 0;
  for (const id of ids) {
    try {
      await api('DELETE', `/tablesdb/${databaseId}/tables/lead/rows/${encodeURIComponent(id)}`);
      deleted++;
      await api('POST', `/tablesdb/${databaseId}/tables/auditLog/rows`, {
        rowId: 'unique()',
        data: { actor: 'Retention job', actorId: null, action: 'enquiry.retention', collectionId: 'lead', documentId: id, documentLabel: null, diffSummary: `Deleted: not updated since before ${before.slice(0, 10)}` },
      });
    } catch (e) {
      error(`Could not delete ${id}: ${e.message}`);
    }
  }
  log(`Deleted ${deleted} of ${ids.length} enquiries last updated before ${before}.`);
  return res.json({ ok: deleted === ids.length, dryRun: false, before, deleted });
}
