import 'server-only';

/** Public URL of this admin app (links in emails), e.g. https://admin.codeminds.digital. */
export function adminUrl() {
  const url = process.env.ADMIN_URL?.replace(/\/$/, '');
  if (!url || !/^https?:\/\//.test(url)) throw new Error('ADMIN_URL is not set (e.g. https://admin.codeminds.digital).');
  return url;
}

/** The public site (draft preview links), e.g. https://codeminds.digital. */
export function siteUrl() {
  const url = process.env.SITE_URL?.replace(/\/$/, '');
  if (!url || !/^https?:\/\//.test(url)) throw new Error('SITE_URL is not set (e.g. https://codeminds.digital).');
  return url;
}

/** Shared with the site: signs draft-preview links. */
export function previewSecret() {
  const s = process.env.PREVIEW_SECRET;
  if (!s || s.length < 32) throw new Error('PREVIEW_SECRET is not set (same value as the site).');
  return s;
}
