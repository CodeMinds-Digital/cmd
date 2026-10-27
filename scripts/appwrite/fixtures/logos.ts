/**
 * Client logos for the home trust strip.
 *
 * Only add a client once they've agreed to be listed, then set
 * `approved: true`. The strip switches from stat tiles to a logo marquee
 * once at least MIN_LOGOS_FOR_MARQUEE are approved (plan §4, open question Q1).
 * Real assets go in /public/logos/*.svg; without `src` the name renders as a
 * mono wordmark.
 */
export type ClientLogo = {
  name: string;
  src?: string;
  /** Rendered width in px when `src` is set. Default 120. */
  width?: number;
  approved: boolean;
};

export const MIN_LOGOS_FOR_MARQUEE = 4;

// Example: { name: 'Acme', src: '/logos/acme.svg', approved: true },
export const logos: ClientLogo[] = [];

export const approvedLogos = logos.filter((l) => l.approved);
