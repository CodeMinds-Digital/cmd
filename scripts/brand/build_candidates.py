"""Logo candidates (marks A–C, wordmarks W1–W3) as outlined SVG -> docs/brand/candidates/.
Hand-authored fallback (Recraft unavailable) — see docs/brand/logo.brief.md."""
import os
from glyphs import text_path, glyph_box

NAVY_TEXT, NAVY, PAPER, ORANGE = '#091321', '#0F1B2D', '#F2EFE8', '#FF4D00'
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'brand', 'candidates'); os.makedirs(OUT, exist_ok=True)
TRACK = -0.03

def mark_c_dot(tile, letter, dot, size=512, radius=0.22):
    S = 383  # glyph size so the ink spans ~60% of the tile
    cx0, _, _, _, cadv = glyph_box('c', size=S); px1 = glyph_box('.', size=S)[2]
    ink_w = (cadv + TRACK * S + px1) - cx0
    x = (size - ink_w) / 2 - cx0
    xh = -glyph_box('x', size=S)[1]; baseline = size / 2 + xh / 2
    c_d, _, _ = text_path('c', size=S, x=x, baseline=baseline)
    p_d, _, _ = text_path('.', size=S, x=x + cadv + TRACK * S, baseline=baseline)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
            f'<rect width="{size}" height="{size}" rx="{size * radius:.1f}" fill="{tile}"/>'
            f'<path fill="{letter}" d="{c_d}"/><path fill="{dot}" d="{p_d}"/></svg>')

def mark_dot(size=512, radius=0.22):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
            f'<rect width="{size}" height="{size}" rx="{size * radius:.1f}" fill="{NAVY}"/>'
            f'<circle cx="{size / 2}" cy="{size / 2}" r="{size * 0.17:.1f}" fill="{ORANGE}"/></svg>')

def word(text_color, dot_color, lead_dot=False, descriptor=None, S=100):
    xh = -glyph_box('x', size=S)[1]; pad_left = 0.0; parts = []
    if lead_dot:
        d = xh; parts.append(f'<circle cx="{d / 2:.2f}" cy="{-xh / 2:.2f}" r="{d / 2:.2f}" fill="{dot_color}"/>')
        pad_left = d + S * 0.16
    w_d, w, (top, bottom) = text_path('codeminds', size=S, tracking=TRACK, x=pad_left)
    parts.append(f'<path fill="{text_color}" d="{w_d}"/>'); width = pad_left + w
    if not lead_dot:
        p_d, _, _ = text_path('.', size=S, x=width + TRACK * S)
        parts.append(f'<path fill="{dot_color}" d="{p_d}"/>'); width += TRACK * S + glyph_box('.', size=S)[2]
    if descriptor:
        dd, _, (_, dmax) = text_path(descriptor, family='Geist Mono', weight=500, size=S * 0.24, tracking=0.22,
                                     x=pad_left + glyph_box('c', size=S)[0], baseline=S * 0.5)
        parts.append(f'<path fill="{text_color}" d="{dd}"/>'); bottom = dmax
    pad = S * 0.02
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad:.2f} {top - pad:.2f} {width + 2 * pad:.2f} {bottom - top + 2 * pad:.2f}">'
            + ''.join(parts) + '</svg>')

files = {
    'mark-A-chip.svg': mark_c_dot(ORANGE, NAVY_TEXT, NAVY_TEXT),
    'mark-B-navy.svg': mark_c_dot(NAVY, PAPER, ORANGE),
    'mark-C-dot.svg': mark_dot(),
    'word-W1-dot-light.svg': word(NAVY_TEXT, ORANGE, lead_dot=True),
    'word-W1-dot-dark.svg': word(PAPER, ORANGE, lead_dot=True),
    'word-W2-period-light.svg': word(NAVY_TEXT, ORANGE),
    'word-W2-period-dark.svg': word(PAPER, ORANGE),
    'word-W3-digital-light.svg': word(NAVY_TEXT, ORANGE, descriptor='DIGITAL'),
    'word-W3-digital-dark.svg': word(PAPER, ORANGE, descriptor='DIGITAL'),
}
for name, svg in files.items():
    open(os.path.join(OUT, name), 'w').write(svg)
print(f'{len(files)} candidates -> {os.path.relpath(OUT, ROOT)}')
