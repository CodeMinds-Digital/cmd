# Security review — 2026-10-27 (Phase 6)

An independent, read-only review of the site, admin app, shared package and Functions, done by a separate reviewer that got the code, not the author's conclusions. Each finding below was re-checked before fixing; every fix has a regression test.

| # | Severity | Finding | Resolution | Test |
|---|---|---|---|---|
| 1 | High* | **Account pre-hijack via invite**: inviting an email that someone had already self-registered attached *their* account (their password, sessions, authenticator) to the staff team | Invite now treats any existing account as untrusted: random password, all sessions ended, authenticator removed, MFA off — only the inbox owner can set a password | `admin/tests/security.spec.ts` |
| 2 | Medium | **Open redirect after sign-in**: `next=/%09/evil.tld` passed `isSafePath`; browsers strip the tab → `https://evil.tld` (reproduced) | `isSafePath` rejects all control characters and requires the path to resolve to the same origin | `tests/unit/security-fixes.test.mjs`, E2E |
| 3 | Medium | **Publishing an unreviewed version**: publish read whatever draft existed at click time | Publish sends the draft version on screen; the server refuses if it changed | `security.spec.ts` |
| 4 | Medium | **Open-ended preview**: Next's draft-mode cookie is site-wide, never expires (until the next deploy) and showed hidden items | Preview also needs a signed `cmd_preview` cookie valid 10 minutes; preview = live published content + saved drafts only (hidden/archived never shown); banner says when it has expired | unit + real-Appwrite check |
| 5 | Low | Password change left other sessions alive | Other sessions are ended on password change | `security.spec.ts` |
| 6 | Low | "At least one Admin" check could race | Re-checked after the change; rolled back if no Admin remains | code review |
| 7 | Low | Unauthenticated bodies read before the size check (chunked uploads) | Streamed read with a hard byte cap (`src/lib/read-body.ts`) on `/api/contact` and `/api/revalidate` | unit |
| 9a | Low | Public site sent no security headers | `frame-ancestors`, `object-src`, `base-uri`, `form-action` CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS; `X-Powered-By` off. Pages stay static; Lighthouse 1.0 | curl + Lighthouse |
| 9b | Info | Audit page showed a self-editable display name | Names resolved from the account (`actorId`), ID shown | — |
| 9c | Info | `.dockerignore` missed nested `.env*.local` | `**/.env*.local` added | — |

\* High only if self-registration is possible; fixed regardless.

## Accepted risks (documented, not changed)

- **Key scopes are per resource type, not per table.** The site key needs `rows.write` for enquiries, so a compromised site server could write any table; the admin key's `users.write` can act on any user (needed for staff management); `rows.write` keys can alter the audit log, so it is append-only for *people*, not against server keys. Mitigations: separate least-privilege keys per service (checked by `npm run appwrite:check-key`), keys never leave the servers, rotation runbook. A further step would be moving enquiry writes into an Appwrite Function.
- **Editors can upload to Storage directly** (bypassing the admin's content sniffing); the bucket still enforces image extensions, 10 MB, antivirus and encryption, and the site renders images through `next/image`/`<img>`.
- **Rate limits are in memory per container** and trust `X-Real-IP` from Dokploy's proxy — safe only while the containers are reachable solely through that proxy (Dokploy default). They reset on deploy.
- **Admin two-factor is enforced by the admin app**, not by Appwrite: an Admin who hasn't enrolled yet could still use Appwrite's API directly with their password. Admins are forced to enrol on first sign-in.
- **Appwrite session length**: the admin cookie is capped at 12 h, but the Appwrite session itself lasts the project's session length. Set **Auth → Security → Session length = 12 hours** and enable **invalidate sessions on password change** in the Console (account-level settings the API key can't change).
- **Self-registration**: set **Auth → Security → Users limit** (or disable unused auth methods) in the Console; the invite fix makes pre-registration harmless either way.

## Areas checked and found sound

Access control on every action/route (role re-checked server-side, writes run as the user so Appwrite permissions back it up); CSRF (`__Host-` SameSite=Strict cookie, server-action origin checks, upload origin check); sign-out ends the Appwrite session; no account enumeration; HMAC verification (constant-time, format check, 5-minute window); query building via SDK helpers only; CSV formula escaping; rich-text allow-list on save and render; nonce CSP in the admin; no SSRF; secrets never reach client bundles or logs; both Functions have no execute permission and minimal scopes.
