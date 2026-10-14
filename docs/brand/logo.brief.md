# Logo brief & provenance

**Status:** candidates only — mark and wordmark not yet chosen (recommended: mark A “c.” chip, wordmark W2 “codeminds.”).

**Production route:** hand-authored SVG. The Recraft generative tool was not connected in the session, so the design-assets fallback lane was used (flagged on the guide's cover).

**Brief**
- Identity: Voltage — warm paper `#F2EFE8`, Midnight navy `#0F1B2D` (dark surfaces), navy-black `#091321` (text), orange `#FF4D00` (accent; fills only).
- Mark: square app/favicon icon, legible at 16px, works on paper and navy. Concepts: A “c.” on an orange tile (echoes the site's highlight chip and the footer's “codeminds.” period), B “c.” on navy, C orange dot on navy.
- Wordmark: lowercase “codeminds” in Space Grotesk Bold, tracking −3%. W1 lead dot (current header), W2 orange period (footer), W3 W2 + “DIGITAL” in Geist Mono Medium, tracking +22%.
- Output: vector SVG, lettering outlined to paths (no font dependency).

**Regenerate** (needs a prior `npx next build` for the fonts, Python fontTools + brotli):
```bash
cd scripts/brand && python3 build_candidates.py && python3 build_guide.py && node print.mjs
```
Outputs: `docs/brand/candidates/*.svg`, `docs/Assets.pdf`.
