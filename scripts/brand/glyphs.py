"""Outline text from the site's own variable fonts (built by next/font) into SVG path data.
Requires a prior `next build` (fonts are read from .next/static/media)."""
import functools, glob, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MEDIA = os.path.join(ROOT, '.next', 'static', 'media')

def font_file(family):
    for f in sorted(glob.glob(os.path.join(MEDIA, '*.woff2'))):
        t = TTFont(f); name = t['name'].getDebugName(1)
        if ord('m') not in t.getBestCmap():
            continue  # non-latin subset
        if name.startswith(family) and (family != 'Geist' or 'Mono' not in name):
            return f
    raise SystemExit(f'font not found: {family} (run `npx next build` first)')

@functools.lru_cache(None)
def font(family, weight):
    return instantiateVariableFont(TTFont(font_file(family)), {'wght': weight})

def text_path(s, family='Space Grotesk', weight=700, size=100, tracking=0.0, x=0.0, baseline=0.0):
    """(path_d, width, (ymin, ymax)) for string s at `size`px with baseline at y=baseline."""
    f = font(family, weight); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    scale = size / upm; pen = SVGPathPen(gs); cursor = 0.0; ymin, ymax = 1e9, -1e9
    for ch in s:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (scale, 0, 0, -scale, x + cursor * scale, baseline)))
        bp = BoundsPen(gs); gs[g].draw(bp)
        if bp.bounds:
            ymin = min(ymin, baseline - bp.bounds[3] * scale); ymax = max(ymax, baseline - bp.bounds[1] * scale)
        cursor += gs[g].width + tracking * upm
    return pen.getCommands(), (cursor - tracking * upm) * scale, (ymin, ymax)

def glyph_box(ch, family='Space Grotesk', weight=700, size=100):
    """Ink bounds of one glyph: (xmin, ymin, xmax, ymax, advance) in SVG coords, origin at baseline-left."""
    f = font(family, weight); gs = f.getGlyphSet(); g = f.getBestCmap()[ord(ch)]; s = size / f['head'].unitsPerEm
    bp = BoundsPen(gs); gs[g].draw(bp); x0, y0, x1, y1 = bp.bounds
    return x0 * s, -y1 * s, x1 * s, -y0 * s, gs[g].width * s
