// Minimal Appwrite stand-in for the admin E2E tests (localhost only, test
// accounts only). Implements just the endpoints the admin calls, with the
// response shapes node-appwrite expects. Never point it at real data.
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_PORT ?? 4010);
const PASSWORD = 'correct-horse-battery';
const OTP = '123456';

const users = {
  'u-admin': { $id: 'u-admin', email: 'admin@test.local', name: 'Ada Admin', mfa: true, teams: ['admin'] },
  'u-nomfa': { $id: 'u-nomfa', email: 'newadmin@test.local', name: 'Noor New', mfa: false, teams: ['admin'] },
  'u-editor': { $id: 'u-editor', email: 'editor@test.local', name: 'Eli Editor', mfa: false, teams: ['editor'] },
  'u-outsider': { $id: 'u-outsider', email: 'outsider@test.local', name: 'Olly Outsider', mfa: false, teams: [] },
  // Fresh accounts for the projects suite (the admin suite rate-limits / removes the ones above).
  'u-admin2': { $id: 'u-admin2', email: 'admin2@test.local', name: 'Pat Publisher', mfa: true, teams: ['admin'] },
  'u-editor2': { $id: 'u-editor2', email: 'editor2@test.local', name: 'Robin Writer', mfa: false, teams: ['editor'] },
  // Journal suite.
  'u-admin3': { $id: 'u-admin3', email: 'admin3@test.local', name: 'Jo Journal', mfa: true, teams: ['admin'] },
  'u-editor3': { $id: 'u-editor3', email: 'editor3@test.local', name: 'Sam Scribe', mfa: false, teams: ['editor'] },
  // Security-fix suite.
  'u-admin5': { $id: 'u-admin5', email: 'admin5@test.local', name: 'Kim Keeper', mfa: true, teams: ['admin'] },
  'u-editor5': { $id: 'u-editor5', email: 'editor5@test.local', name: 'Ola Olsen', mfa: false, teams: ['editor'] },
  // Registered by "someone" before being invited (pre-hijack scenario); has a session and an authenticator.
  'u-squatter': { $id: 'u-squatter', email: 'future-hire@test.local', name: 'Squatter', mfa: true, teams: [] },
  // Content + inbox suite.
  'u-admin4': { $id: 'u-admin4', email: 'admin4@test.local', name: 'Lee Lead', mfa: true, teams: ['admin'] },
  'u-editor4': { $id: 'u-editor4', email: 'editor4@test.local', name: 'Max Maker', mfa: false, teams: ['editor'] },
};

const sessions = new Map(); // secret → { userId, verified }
const audit = [];
/** Key-side account resets, for the invite test. */
const resets = [];
const recoveries = [];
let n = 0;

// ── Generic table store (mirrors the live permission split, D24) ──
const LIVE_ADMIN = new Set(['caseStudy', 'caseApproachStep', 'caseScreen', 'caseMetric', 'testimonial', 'journalPost', 'capability', 'capabilityGroup', 'processStep', 'stackItem', 'clientLogo', 'siteSettings']);
/** Readable (and writable) by the admin team only. */
const ADMIN_ONLY = new Set(['lead']);
const tables = new Map();
let clock = Date.parse('2026-10-27T00:00:00Z');
const stamp = () => new Date((clock += 1000)).toISOString();
const table = (id) => (tables.has(id) ? tables.get(id) : tables.set(id, new Map()).get(id));
function seedRow(tableId, $id, data) {
  const t = stamp();
  table(tableId).set($id, { $id, $createdAt: t, $updatedAt: t, $permissions: [], $tableId: tableId, $databaseId: 'e2e-db', $sequence: ++n, ...data });
}
seedRow('caseStudy', 'cs-alpha', { slug: 'alpha-project', title: 'Alpha project', client: null, year: 2026, brief: 'A live case.', tags: ['Next.js'], status: 'live', eta: null, coverSrc: '/work/fintech-cover.svg', coverFileId: null, coverAlt: 'Alpha cover', role: null, duration: null, liveUrl: null, problem: 'The problem.', testimonialId: null, orderIndex: 0, state: 'published', publishedAt: stamp() });
seedRow('caseStudy', 'cs-beta', { slug: 'beta-project', title: 'Beta project', client: null, year: 2026, brief: 'Coming soon.', tags: [], status: 'coming', eta: 'Soon', coverSrc: null, coverFileId: null, coverAlt: null, role: null, duration: null, liveUrl: null, problem: null, testimonialId: null, orderIndex: 1, state: 'published', publishedAt: stamp() });
seedRow('journalPost', 'jp-legacy', { slug: 'legacy-post', title: 'Legacy post', excerpt: 'Old excerpt.', publishedAt: '2026-04-12T00:00:00.000+00:00', readingTime: '1 min read', tags: ['Studio'], body: 'First paragraph.\n\nSecond paragraph.', bodyJson: null, coverFileId: null, coverAlt: null, seoTitle: null, seoDescription: null, authorName: null, status: 'published', state: 'published' });
seedRow('capability', 'cap-web', { displayIndex: '01', title: 'Web platforms', description: 'Fast sites.', tags: ['React'], services: [], proof: 'LCP 1.6s', tone: null, spanMd: null, spanLg: null, orderIndex: 0, state: 'published' });
seedRow('capability', 'cap-backend', { displayIndex: '02', title: 'Backend & APIs', description: 'Services.', tags: ['Go'], services: [], proof: null, tone: 'inverse', spanMd: 6, spanLg: 8, orderIndex: 1, state: 'published' });
seedRow('capabilityGroup', 'cap-backend-g1', { capabilityId: 'cap-backend', orderIndex: 0, title: 'Custom backends', items: ['REST APIs'] });
seedRow('processStep', 'ps-1', { displayIndex: '01', title: 'Brief', body: 'We listen.', duration: '1 week', deliverables: ['Scope'], orderIndex: 0, state: 'published' });
seedRow('processStep', 'ps-2', { displayIndex: '02', title: 'Build', body: 'We build.', duration: '3 weeks', deliverables: ['App'], orderIndex: 1, state: 'published' });
seedRow('stackItem', 'st-rust', { label: 'Rust', category: 'languages', icon: 'rust', orderIndex: 0, state: 'published' });
seedRow('stackItem', 'st-react', { label: 'React', category: 'web', icon: 'react', orderIndex: 1, state: 'published' });
seedRow('clientLogo', 'cl-acme', { name: 'Acme', logoFileId: null, width: null, approved: false, orderIndex: 0 });
seedRow('siteSettings', 'siteSettings', { contactEmail: 'hello@test.local', bookingUrl: 'https://cal.example/x', city: 'Chennai', country: 'India', timezoneLabel: 'IST', replyWithin: '24 hours', bookingOpen: true, bookingDetail: null, deliveryMinWeeks: 2, deliveryMaxWeeks: 4, disciplines: ['Web', 'AI'] });
seedRow('lead', 'lead-1', { name: 'Priya Prospect', email: 'priya@client.example', project: 'A booking app', budget: '$30–60k', timeline: 'ASAP', message: 'Hello, we need an app.', messageBody: 'Hello, we need an app.', source: 'contact-form', status: 'new', notes: null, assignedTo: null, emailDelivered: true });
seedRow('lead', 'lead-2', { name: '=HYPERLINK("https://evil.example","click")', email: 'csv@attack.example', project: null, budget: null, timeline: null, message: '+cmd|calc', messageBody: null, source: 'api', status: 'spam', notes: null, assignedTo: null, emailDelivered: false });
seedRow('caseApproachStep', 'cs-alpha-a1', { caseStudyId: 'cs-alpha', orderIndex: 0, displayIndex: '01', title: 'First step', body: 'We did a thing.' });
const transactions = new Map();

function canWrite(req, tableId) {
  if (hasKey(req)) return true;
  const ctx = sessionUser(req);
  if (!ctx?.s.verified) return false;
  if (LIVE_ADMIN.has(tableId) || ADMIN_ONLY.has(tableId)) return ctx.user.teams.includes('admin');
  return ctx.user.teams.includes('admin') || ctx.user.teams.includes('editor');
}
function canRead(req, tableId) {
  if (hasKey(req)) return true;
  const ctx = sessionUser(req);
  if (!ctx?.s.verified) return false;
  return ADMIN_ONLY.has(tableId) ? ctx.user.teams.includes('admin') : true;
}

function matches(row, queries) {
  return queries.every((q) => {
    if (q.method === 'equal') return q.values.includes(row[q.attribute]);
    if (q.method === 'startsWith') return String(row[q.attribute] ?? '').startsWith(q.values[0]);
    return true;
  });
}
function list(tableId, rawQueries) {
  const queries = rawQueries.map((q) => JSON.parse(q));
  let rows = [...table(tableId).values()].filter((r) => matches(r, queries));
  for (const q of queries) {
    if (q.method === 'orderAsc' || q.method === 'orderDesc') {
      const dir = q.method === 'orderAsc' ? 1 : -1;
      rows.sort((a, b) => (a[q.attribute] > b[q.attribute] ? dir : a[q.attribute] < b[q.attribute] ? -dir : 0));
    }
  }
  const limit = queries.find((q) => q.method === 'limit')?.values[0] ?? 25;
  return { total: rows.length, rows: rows.slice(0, limit) };
}
/** Apply a write now; inside a transaction, remember how to undo it. */
function write(tableId, rowId, next, transactionId) {
  const t = table(tableId);
  const before = t.get(rowId);
  if (next === null) t.delete(rowId);
  else t.set(rowId, next);
  if (transactionId) transactions.get(transactionId)?.push(() => (before ? t.set(rowId, before) : t.delete(rowId)));
}

const now = () => new Date().toISOString();
/** node-appwrite sends queries as queries[0], queries[1], … */
const queryParams = (url) => [...url.searchParams].filter(([k]) => /^queries\[\d*\]$/.test(k)).map(([, v]) => v);
const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const err = (res, status, type, message = type) => json(res, status, { message, code: status, type, version: 'mock' });

function sessionUser(req) {
  const s = sessions.get(req.headers['x-appwrite-session']);
  return s ? { s, user: users[s.userId] } : null;
}
const hasKey = (req) => typeof req.headers['x-appwrite-key'] === 'string' && req.headers['x-appwrite-key'].length >= 32;
const userJson = (u) => ({ $id: u.$id, $createdAt: now(), $updatedAt: now(), name: u.name, email: u.email, mfa: u.mfa, status: true, labels: [], prefs: {}, emailVerification: true });
const membership = (u, team) => ({
  $id: `m-${team}-${u.$id}`, $createdAt: now(), $updatedAt: now(), userId: u.$id, userName: u.name, userEmail: u.email, userPhone: '',
  teamId: team, teamName: team, invited: now(), joined: now(), confirm: true, mfa: u.mfa, userAccessedAt: now(), roles: [],
});

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = url.pathname.replace(/^\/v1/, '');
  let body = {};
  if (req.method !== 'GET') {
    const raw = await new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => r(d)); });
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
  }
  const route = `${req.method} ${path}`;

  // ── test inspection ──
  if (route === 'GET /__audit') return json(res, 200, audit);
  const peek = path.match(/^\/__table\/([^/]+)$/);
  if (peek && req.method === 'GET') return json(res, 200, [...table(peek[1]).values()]);
  if (route === 'GET /__recoveries') return json(res, 200, recoveries);
  if (route === 'GET /__resets') return json(res, 200, resets);
  if (route === 'GET /__sessions') return json(res, 200, [...sessions.values()].map((v) => v.userId));
  if (route === 'POST /__session') {
    // Give a user a live session directly (simulates them having signed in elsewhere).
    const secret = `sess-${url.searchParams.get('userId')}-${++n}`;
    sessions.set(secret, { userId: url.searchParams.get('userId'), verified: true });
    return json(res, 201, { secret });
  }
  if (route === 'POST /__revoke') {
    for (const [k, v] of sessions) if (v.userId === url.searchParams.get('userId')) sessions.delete(k);
    res.writeHead(204).end(); return;
  }

  // ── sessions (keyed client) ──
  if (route === 'POST /account/sessions/email') {
    if (!hasKey(req)) return err(res, 401, 'general_unauthorized_scope');
    const u = Object.values(users).find((x) => x.email === body.email);
    if (!u || body.password !== PASSWORD) return err(res, 401, 'user_invalid_credentials');
    const secret = `sess-${u.$id}-${++n}`;
    sessions.set(secret, { userId: u.$id, verified: !u.mfa });
    return json(res, 201, { $id: `s${n}`, userId: u.$id, secret, expire: new Date(Date.now() + 365 * 864e5).toISOString(), factors: ['password'], mfaUpdatedAt: '' });
  }

  // ── account (session client) ──
  if (path.startsWith('/account') && route !== 'POST /account/recovery') {
    const ctx = sessionUser(req);
    if (!ctx) return err(res, 401, 'general_unauthorized_scope', 'User (role: guests) missing scope (account)');
    const { s, user } = ctx;
    if (route === 'POST /account/mfa/challenges') return json(res, 201, { $id: 'ch-1', $createdAt: now(), userId: user.$id, expire: now() });
    if (route === 'PUT /account/mfa/challenges') {
      if (body.otp !== OTP) return err(res, 401, 'user_invalid_token');
      s.verified = true;
      return json(res, 200, { $id: 'sx', userId: user.$id });
    }
    if (!s.verified) return err(res, 401, 'user_more_factors_required');
    if (route === 'GET /account') return json(res, 200, userJson(user));
    if (route === 'POST /account/mfa/authenticators/totp') return json(res, 200, { secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/Codeminds:test?secret=JBSWY3DPEHPK3PXP' });
    if (route === 'PUT /account/mfa/authenticators/totp') {
      if (body.otp !== OTP) return err(res, 400, 'user_invalid_token');
      return json(res, 200, userJson(user));
    }
    if (route === 'PATCH /account/mfa') { user.mfa = body.mfa === true; return json(res, 200, userJson(user)); }
    if (route === 'POST /account/mfa/recovery-codes') return json(res, 201, { recoveryCodes: ['a1b2c3d4e5', 'f6g7h8i9j0', 'k1l2m3n4o5', 'p6q7r8s9t0'] });
    if (route === 'GET /account/sessions') {
      const mine = [...sessions].filter(([, v]) => v.userId === user.$id).map(([k]) => ({ $id: k, current: k === req.headers['x-appwrite-session'] }));
      return json(res, 200, { total: mine.length, sessions: mine });
    }
    const delSession = path.match(/^\/account\/sessions\/([^/]+)$/);
    if (delSession && req.method === 'DELETE' && delSession[1] !== 'current') {
      if (sessions.get(delSession[1])?.userId === user.$id) sessions.delete(delSession[1]);
      res.writeHead(204).end();
      return;
    }
    if (route === 'PATCH /account/password') {
      if (body.oldPassword !== PASSWORD) return err(res, 401, 'user_invalid_credentials');
      return json(res, 200, userJson(user));
    }
    if (route === 'DELETE /account/sessions/current') { sessions.delete(req.headers['x-appwrite-session']); res.writeHead(204).end(); return; }
    return err(res, 404, 'mock_not_implemented', route);
  }
  if (route === 'POST /account/recovery') { recoveries.push({ email: body.email, url: body.url }); return json(res, 201, { $id: 'r1', secret: '', expire: now() }); }

  if (route === 'GET /avatars/qr') {
    // 1×1 PNG stands in for the QR image.
    res.writeHead(200, { 'content-type': 'image/png' });
    res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
    return;
  }
  if (route === 'GET /teams') {
    const ctx = sessionUser(req);
    if (!ctx) return err(res, 401, 'general_unauthorized_scope');
    if (!ctx.s.verified) return err(res, 401, 'user_more_factors_required');
    const teams = ctx.user.teams.map((t) => ({ $id: t, name: t, total: 1, prefs: {}, $createdAt: now(), $updatedAt: now() }));
    return json(res, 200, { total: teams.length, teams });
  }

  // ── key-only admin APIs ──
  const m = path.match(/^\/teams\/([^/]+)\/memberships(?:\/([^/]+))?$/);
  if (m) {
    if (!hasKey(req)) return err(res, 401, 'general_unauthorized_scope');
    const [, team, membershipId] = m;
    if (req.method === 'GET') {
      const list = Object.values(users).filter((u) => u.teams.includes(team)).map((u) => membership(u, team));
      return json(res, 200, { total: list.length, memberships: list });
    }
    if (req.method === 'POST') {
      const u = users[body.userId];
      if (!u.teams.includes(team)) u.teams.push(team);
      return json(res, 201, membership(u, team));
    }
    if (req.method === 'DELETE') {
      const u = Object.values(users).find((x) => membershipId === `m-${team}-${x.$id}`);
      if (u) u.teams = u.teams.filter((t) => t !== team);
      res.writeHead(204).end(); return;
    }
  }
  if (route === 'GET /users') {
    const email = (queryParams(url).join(' ').match(/"values":\["([^"]+)"\]/) ?? [])[1];
    const list = Object.values(users).filter((u) => u.email === email).map(userJson);
    return json(res, 200, { total: list.length, users: list });
  }
  if (route === 'POST /users') {
    const u = { $id: `u-${++n}`, email: body.email, name: body.name, mfa: false, teams: [] };
    users[u.$id] = u;
    return json(res, 201, userJson(u));
  }
  const userOp = path.match(/^\/users\/([^/]+)\/(password|mfa|mfa\/authenticators\/totp)$/);
  if (userOp && hasKey(req)) {
    const u = users[userOp[1]];
    if (!u) return err(res, 404, 'user_not_found');
    resets.push(`${req.method} ${userOp[2]} ${u.$id}`);
    if (userOp[2] === 'mfa') u.mfa = body.mfa === true;
    if (req.method === 'DELETE') { res.writeHead(204).end(); return; }
    return json(res, 200, userJson(u));
  }
  const ds = path.match(/^\/users\/([^/]+)\/sessions$/);
  if (ds && req.method === 'DELETE') {
    for (const [k, v] of sessions) if (v.userId === ds[1]) sessions.delete(k);
    res.writeHead(204).end(); return;
  }

  // ── transactions ──
  if (route === 'POST /tablesdb/transactions') {
    const id = `tx${++n}`;
    transactions.set(id, []);
    return json(res, 201, { $id: id, status: 'pending', operations: 0, expiresAt: now() });
  }
  const tx = path.match(/^\/tablesdb\/transactions\/([^/]+)$/);
  if (tx && req.method === 'PATCH') {
    const undo = transactions.get(tx[1]) ?? [];
    if (body.rollback) for (const fn of undo.reverse()) fn();
    transactions.delete(tx[1]);
    return json(res, 200, { $id: tx[1], status: body.rollback ? 'failed' : 'committed' });
  }

  // ── storage ──
  const up = path.match(/^\/storage\/buckets\/([^/]+)\/files$/);
  if (up && req.method === 'POST') {
    const ctx = sessionUser(req);
    if (!hasKey(req) && !(ctx?.s.verified && ctx.user.teams.length)) return err(res, 401, 'user_unauthorized');
    return json(res, 201, { $id: `file${++n}`, bucketId: up[1], name: 'upload', mimeType: 'image/png', sizeOriginal: 68, $createdAt: now(), $updatedAt: now(), $permissions: [], signature: '', chunksTotal: 1, chunksUploaded: 1 });
  }
  if (/^\/storage\/buckets\/[^/]+\/files\/[^/]+\/view$/.test(path)) {
    res.writeHead(200, { 'content-type': 'image/png' });
    res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
    return;
  }

  // ── tables ──
  const one = path.match(/^\/tablesdb\/([^/]+)\/tables\/([^/]+)\/rows\/([^/]+)$/);
  if (one && one[2] !== 'auditLog') {
    const [, , tableId, rowId] = one;
    const current = table(tableId).get(rowId);
    if (req.method === 'GET') {
      if (!canRead(req, tableId)) return err(res, 401, 'user_unauthorized');
      return current ? json(res, 200, current) : err(res, 404, 'row_not_found');
    }
    if (!canWrite(req, tableId)) return err(res, 401, 'user_unauthorized', 'The current user is not authorized to perform the requested action.');
    if (req.method === 'DELETE') {
      if (!current) return err(res, 404, 'row_not_found');
      write(tableId, rowId, null, body.transactionId);
      res.writeHead(204).end();
      return;
    }
    if (req.method === 'PATCH' && !current) return err(res, 404, 'row_not_found');
    const t = stamp();
    const base = req.method === 'PUT' && !current ? { $id: rowId, $createdAt: t, $permissions: [], $tableId: tableId, $databaseId: 'e2e-db', $sequence: ++n } : current;
    const next = { ...base, ...body.data, $updatedAt: t };
    write(tableId, rowId, next, body.transactionId);
    return json(res, 200, next);
  }
  const t = path.match(/^\/tablesdb\/([^/]+)\/tables\/([^/]+)\/rows$/);
  if (t && t[2] !== 'auditLog') {
    const tableId = t[2];
    if (req.method === 'GET') {
      if (!canRead(req, tableId)) return err(res, 401, 'user_unauthorized');
      return json(res, 200, list(tableId, queryParams(url)));
    }
    if (req.method === 'POST') {
      if (!canWrite(req, tableId)) return err(res, 401, 'user_unauthorized');
      const rowId = body.rowId === 'unique()' || !body.rowId ? `r${++n}` : body.rowId;
      if (table(tableId).has(rowId)) return err(res, 409, 'row_already_exists');
      if (tableId === 'contentDraft' && [...table(tableId).values()].some((r) => r.tableId === body.data.tableId && r.rowId === body.data.rowId)) return err(res, 409, 'row_already_exists');
      const ts = stamp();
      const row = { $id: rowId, $createdAt: ts, $updatedAt: ts, $permissions: [], $tableId: tableId, $databaseId: 'e2e-db', $sequence: ++n, ...body.data };
      write(tableId, rowId, row, body.transactionId);
      return json(res, 201, row);
    }
  }
  if (t) {
    if (req.method === 'POST' && t[2] === 'auditLog') {
      if (!hasKey(req)) return err(res, 401, 'user_unauthorized');
      const row = { $id: `a${++n}`, $createdAt: now(), $updatedAt: now(), ...body.data };
      audit.unshift(row);
      return json(res, 201, row);
    }
    if (req.method === 'GET') {
      const ctx = sessionUser(req);
      if (t[2] === 'auditLog') {
        if (!ctx?.user.teams.includes('admin')) return err(res, 401, 'user_unauthorized');
        return json(res, 200, { total: audit.length, rows: audit.slice(0, 50) });
      }
      return json(res, 200, { total: 3, rows: [] });
    }
  }

  return err(res, 404, 'mock_not_implemented', route);
}).listen(PORT, '127.0.0.1', () => console.log(`mock appwrite ready on ${PORT}`));
