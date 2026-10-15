"""Outline text into SVG path data.

Site fonts come from a prior `next build` (.next/static/media). Brand-only fonts
are vendored in scripts/brand/fonts/ (with their licences) and shaped with
HarfBuzz (`hb-shape`) so kerning matches what a browser would set.
"""
import functools, glob, json, os, re, subprocess
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MEDIA = os.path.join(ROOT, '.next', 'static', 'media')
FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')
# Brand-only fonts: file + fixed axis settings. Fraunces "Soft" = SOFT 100, WONK 1, display optical size.
LOCAL = {
    'Fraunces': (os.path.join(FONTS, 'Fraunces[SOFT,WONK,opsz,wght].ttf'), {'opsz': 144, 'SOFT': 100, 'WONK': 1}),
}

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
    if family in LOCAL:
        path, axes = LOCAL[family]
        return instantiateVariableFont(TTFont(path), {**axes, 'wght': weight})
    return instantiateVariableFont(TTFont(font_file(family)), {'wght': weight})


def _shape(s, family, weight):
    """[(glyph_name, x_advance, x_offset, y_offset)] in font units, kerned by HarfBuzz."""
    path, axes = LOCAL[family]
    var = ','.join(f'{k}={v}' for k, v in {**axes, 'wght': weight}.items())
    out = subprocess.run(['hb-shape', '--output-format=json', f'--variations={var}', path, s],
                         capture_output=True, text=True, check=True).stdout
    return [(g['g'], g['ax'], g['dx'], g['dy']) for g in json.loads(out)]

def text_path(s, family='Space Grotesk', weight=700, size=100, tracking=0.0, x=0.0, baseline=0.0):
    """(path_d, width, (ymin, ymax)) for string s at `size`px with baseline at y=baseline."""
    f = font(family, weight); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    scale = size / upm; pen = SVGPathPen(gs); cursor = 0.0; ymin, ymax = 1e9, -1e9
    run = _shape(s, family, weight) if family in LOCAL else [(cmap[ord(ch)], None, 0, 0) for ch in s]
    for g, adv, dx, dy in run:
        gs[g].draw(TransformPen(pen, (scale, 0, 0, -scale, x + (cursor + dx) * scale, baseline - dy * scale)))
        bp = BoundsPen(gs); gs[g].draw(bp)
        if bp.bounds:
            ymin = min(ymin, baseline - bp.bounds[3] * scale); ymax = max(ymax, baseline - bp.bounds[1] * scale)
        cursor += (gs[g].width if adv is None else adv) + tracking * upm
    # 2 decimals is 1/100 of a unit at size 100: far below a pixel at any display size.
    d = re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.2f}'.rstrip('0').rstrip('.'), pen.getCommands())
    return d, (cursor - tracking * upm) * scale, (ymin, ymax)

def glyph_box(ch, family='Space Grotesk', weight=700, size=100):
    """Ink bounds of one glyph: (xmin, ymin, xmax, ymax, advance) in SVG coords, origin at baseline-left."""
    f = font(family, weight); gs = f.getGlyphSet(); g = f.getBestCmap()[ord(ch)]; s = size / f['head'].unitsPerEm
    bp = BoundsPen(gs); gs[g].draw(bp); x0, y0, x1, y1 = bp.bounds
    return x0 * s, -y1 * s, x1 * s, -y0 * s, gs[g].width * s
