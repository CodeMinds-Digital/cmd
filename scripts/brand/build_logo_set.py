"""Build the final logo set from the traced layers (docs/brand/final/_layers.json).

Run after vectorize_mark.py (and a `next build`, for the wordmark fonts):
    python3 build_logo_set.py
Writes the full deliverable set to logo-assets/final/ (svg, png, icons, social,
email, review sheet), the files the site serves to public/brand/, and the
Next.js icon conventions to src/app/.

Every variant is the full mark — letterform, lotus, peacock (with eye) and crest.
On navy the peacock and lotus leaves switch to NAVY_TINT (same hue as navy,
lightened) so the mark keeps its two-tone read instead of turning white;
app icons and avatars sit on a paper tile so they keep the true colours.
"""
import base64, io, json, os, re, shutil, subprocess
from PIL import Image
from glyphs import text_path, glyph_box
from bezier_fit import simplify

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FINAL = os.path.join(ROOT, 'docs', 'brand', 'final')
PUBLIC = os.path.join(ROOT, 'public', 'brand')
APP = os.path.join(ROOT, 'src', 'app')
os.makedirs(PUBLIC, exist_ok=True); os.makedirs(os.path.join(PUBLIC, 'social'), exist_ok=True)

ORANGE, NAVY, NAVY_TEXT, PAPER, WHITE = '#FF4D00', '#0F1B2D', '#091321', '#F2EFE8', '#FFFFFF'
NAVY_TINT = '#94ACD1'  # oklch(74% 0.06 258): navy's hue, 7.5:1 on navy — peacock + leaves on dark grounds
ASSETS = os.path.join(ROOT, 'logo-assets', 'final')
for sub in ('svg', 'png', 'icons', 'social', 'email'):
    os.makedirs(os.path.join(ASSETS, sub), exist_ok=True)
NUM = re.compile(r'-?\d+(?:\.\d+)?(?:e-?\d+)?')

data = json.load(open(os.path.join(FINAL, '_layers.json')))
SRC_W, SRC_H = data['width'], data['height']
UNIT = 1000 / max(SRC_W, SRC_H)  # normalise the mark to a 1000-unit box


def norm_path(d, tx, ty):
    """Bake translate + scale into the coordinates; round to 1 decimal (of 1000)."""
    nums = iter([float(n) for n in NUM.findall(d)])
    out, toggle = [], 0
    def fmt(v): return f'{v:.1f}'.rstrip('0').rstrip('.')
    for tok in re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?(?:e-?\d+)?', d):
        if tok.isalpha():
            out.append(tok); toggle = 0; continue
        v = next(nums)
        v = (v + (tx if toggle == 0 else ty)) * UNIT  # vtracer emits absolute coords in the translated frame
        out.append(fmt(v)); toggle ^= 1
    return ' '.join(out).replace(' C ', 'C').replace(' Z', 'Z').replace(' M ', 'M')


def bbox(d):
    v = [float(n) for n in NUM.findall(d)]
    xs, ys = v[0::2], v[1::2]
    return min(xs), min(ys), max(xs), max(ys)


layers = {k: [norm_path(*p) for p in v] for k, v in data['layers'].items()}
W, H = SRC_W * UNIT, SRC_H * UNIT

# Classify parts by position: crest = small orange parts top-right; peacock = navy part on the right.
crest_parts = [p for p in layers['orange'] if (lambda b: b[0] > 0.72 * W and b[3] < 0.30 * H)(bbox(p))]
letter_lotus = [p for p in layers['orange'] if p not in crest_parts]
navy_boxes = [(p, bbox(p)) for p in layers['navy']]
peacock = [p for p, b in navy_boxes if b[2] > 0.85 * W]
leaves = [p for p, b in navy_boxes if b[2] <= 0.85 * W]
print(f'parts: letter+lotus {len(letter_lotus)}, crest {len(crest_parts)}, peacock {len(peacock)}, leaves {len(leaves)}')



# Peacock eye: a cut-out (shows the background) on the head, in mark units.
EYE = (908, 220, 9)


_compact = {}


def _d(ps):
    for p in ps:
        if p not in _compact: _compact[p] = simplify(p, tol=0.6)
    return ''.join(_compact[p] for p in ps)


def paths(ps, fill, extra_d='', rule=''):
    """One path element per colour. No stroke "boldening": a same-colour stroke
    merges the lotus petals, pushes the leaves onto the letterform and clips the
    edges, so every size uses the exact artwork."""
    if not ps: return ''
    rule = f' fill-rule="{rule}"' if rule else ''
    return f'<path fill="{fill}"{rule} d="{_d(ps)}{extra_d}"/>'


def eye_d():
    x, y, r = EYE
    return f'M{x - r} {y}a{r} {r} 0 1 0 {2 * r} 0a{r} {r} 0 1 0 {-2 * r} 0z'


def svg(body, w, h, vb=None, title='Codeminds Digital'):
    vb = vb or f'0 0 {w:.1f} {h:.1f}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'


def full_mark(letter=ORANGE, bird=NAVY, crest=ORANGE, leaf=NAVY):
    """The whole mark; the eye is cut out of the peacock (even-odd)."""
    return (paths(letter_lotus, letter) + paths(crest_parts, crest)
            + paths(peacock, bird, eye_d(), 'evenodd') + paths(leaves, leaf))


COLOUR = dict()                                   # orange + navy, for light grounds
REVERSED = dict(bird=NAVY_TINT, leaf=NAVY_TINT)   # for navy / dark grounds
MONO_NAVY = dict(letter=NAVY_TEXT, bird=NAVY_TEXT, crest=NAVY_TEXT, leaf=NAVY_TEXT)
MONO_WHITE = dict(letter=WHITE, bird=WHITE, crest=WHITE, leaf=WHITE)


def framed(size, bg, inner, radius=0.0, **colours):
    """Square canvas, mark centred at `inner` × size (by its longer side)."""
    s = inner * size / max(W, H)
    ox, oy = (size - W * s) / 2, (size - H * s) / 2
    rect = f'<rect width="{size}" height="{size}" rx="{size * radius:.1f}" fill="{bg}"/>' if bg else ''
    return svg(f'{rect}<g transform="translate({ox:.1f} {oy:.1f}) scale({s:.5f})">{full_mark(**colours)}</g>', size, size)


# Wordmark: "Codeminds." in Fraunces Soft Bold (Undercase Type, SIL OFL 1.1; fonts/OFL-Fraunces.txt),
# outlined so the logo never depends on a font being installed or loaded.
WORD, WORD_FONT, WORD_WEIGHT, WORD_TRACK = 'Codeminds', 'Fraunces', 700, -0.02


def wordmark(text_fill, period_fill, x0=0.0, S=100):
    """(svg parts, right edge, (top, bottom)) for 'Codeminds.' with its baseline at y=0."""
    kw = dict(family=WORD_FONT, weight=WORD_WEIGHT, size=S)
    w_d, ww, (top, bottom) = text_path(WORD, tracking=WORD_TRACK, x=x0, **kw)
    px = x0 + ww + WORD_TRACK * S
    p_d, pw, (_, pbottom) = text_path('.', x=px, **kw)
    right = px + glyph_box('.', **kw)[2]
    return ([f'<path fill="{text_fill}" d="{w_d}"/>', f'<path fill="{period_fill}" d="{p_d}"/>'],
            right, (top, max(bottom, pbottom)))


def wordmark_svg(text_fill, period_fill):
    parts, right, (top, bottom) = wordmark(text_fill, period_fill)
    pad = 2
    return svg(''.join(parts), 0, 0, f'{-pad} {top - pad:.2f} {right + 2 * pad:.2f} {bottom - top + 2 * pad:.2f}')


# DIGITAL descriptor (formal lockup): Geist Mono Medium at 30 % of the wordmark size,
# so it renders at >= 12 px whenever the lockup is >= 48 px tall (site header desktop).
DESC_SIZE, DESC_TRACK, DESC_GAP = 0.30, 0.34, 0.13


def lockup(text_fill, period_fill, mark_body, descriptor=False):
    """Mark + 'Codeminds.' (+ DIGITAL stacked beneath, left-aligned to the C).
    The mark is centred on the text block: the cap band alone, or cap band + DIGITAL."""
    S = 100
    kw = dict(family=WORD_FONT, weight=WORD_WEIGHT, size=S)
    cap = -glyph_box('H', **kw)[1]
    dcap = DESC_SIZE * S * 0.70  # Geist Mono cap height ≈ 0.70 em
    block_top, block_bot = -cap, (DESC_GAP * S + dcap) if descriptor else 0.0
    mh = cap * 1.6 if not descriptor else (block_bot - block_top) * 1.04
    ms = mh / H; mw = W * ms
    x0 = mw + S * 0.2
    parts, right, (top, bottom) = wordmark(text_fill, period_fill, x0, S)
    mark_top = (block_top + block_bot) / 2 - mh / 2
    parts.insert(0, f'<g transform="translate(0 {mark_top:.2f}) scale({ms:.5f})">{mark_body}</g>')
    y_top, y_bot = min(top, mark_top), max(bottom, mark_top + mh)
    if descriptor:
        dd, _, (dtop, dmax) = text_path('DIGITAL', family='Geist Mono', weight=500, size=S * DESC_SIZE,
                                        tracking=DESC_TRACK, x=x0 + glyph_box('C', **kw)[0] + S * 0.01,
                                        baseline=DESC_GAP * S + dcap)
        parts.append(f'<path fill="{text_fill}" d="{dd}"/>'); y_bot = max(y_bot, dmax)
    pad = S * 0.04
    vb = f'{-pad:.2f} {y_top - pad:.2f} {right + 2 * pad:.2f} {y_bot - y_top + 2 * pad:.2f}'
    return svg(''.join(parts), 0, 0, vb)


files = {
    'mark.svg': svg(full_mark(**COLOUR), W, H),
    'mark-reversed.svg': svg(full_mark(**REVERSED), W, H),
    'mark-mono-navy.svg': svg(full_mark(**MONO_NAVY), W, H),
    'mark-mono-white.svg': svg(full_mark(**MONO_WHITE), W, H),
    # Header / small-UI copies: identical artwork to mark / mark-reversed
    'mark-small.svg': svg(full_mark(**COLOUR), W, H),
    'mark-small-reversed.svg': svg(full_mark(**REVERSED), W, H),
    'app-icon.svg': framed(512, PAPER, 0.76, radius=0.22),
    'lockup.svg': lockup(NAVY_TEXT, ORANGE, full_mark(**COLOUR)),
    'lockup-reversed.svg': lockup(PAPER, ORANGE, full_mark(**REVERSED)),
    'lockup-formal.svg': lockup(NAVY_TEXT, ORANGE, full_mark(**COLOUR), descriptor=True),
    'lockup-formal-reversed.svg': lockup(PAPER, ORANGE, full_mark(**REVERSED), descriptor=True),
    # Wordmark alone (footer, places the mark already appears)
    'wordmark.svg': wordmark_svg(NAVY_TEXT, ORANGE),
    'wordmark-reversed.svg': wordmark_svg(PAPER, ORANGE),
}
for name, content in files.items():
    for d in (PUBLIC, os.path.join(ASSETS, 'svg')):
        open(os.path.join(d, name), 'w').write(content)


def render(svg_text, out, w, bg=None):
    cmd = ['rsvg-convert', '-w', str(w)] + (['-b', bg] if bg else [])
    png = subprocess.run(cmd, input=svg_text.encode(), capture_output=True, check=True).stdout
    if out: open(out, 'wb').write(png)
    return png


def save(png, *paths_):
    for p in paths_: open(p, 'wb').write(png)


A = lambda *p: os.path.join(ASSETS, *p)
# Transparent PNG of every SVG (2048 px wide) for slides, docs and print proofs
for name, content in files.items():
    render(content, A('png', name.replace('.svg', '.png')), 2048)

# Next.js file-convention icons (src/app/) — paper tile keeps the true colours
open(os.path.join(APP, 'icon.svg'), 'w').write(files['app-icon.svg'])
shutil.copyfile(os.path.join(APP, 'icon.svg'), A('icons', 'icon.svg'))
save(render(framed(180, PAPER, 0.80), None, 180), os.path.join(APP, 'apple-icon.png'), A('icons', 'apple-icon-180.png'))
# favicon.ico: 16 / 32 / 48 frames of the exact mark
SIZES = (16, 32, 48)
ico = [Image.open(io.BytesIO(render(framed(s, PAPER, 0.92, radius=0.2), None, s))).convert('RGBA') for s in SIZES]
for out in (os.path.join(APP, 'favicon.ico'), A('icons', 'favicon.ico')):
    ico[-1].save(out, sizes=[(s, s) for s in SIZES], append_images=ico[:-1])
for s, im in zip(SIZES, ico): im.save(A('icons', f'favicon-{s}.png'))
# PWA icons
save(render(framed(512, PAPER, 0.76, radius=0.22), None, 512), os.path.join(PUBLIC, 'icon-512.png'), A('icons', 'icon-512.png'))
save(render(framed(512, PAPER, 0.76, radius=0.22), None, 192), os.path.join(PUBLIC, 'icon-192.png'), A('icons', 'icon-192.png'))
# Maskable: full bleed; mark inside the 80 % safe circle
save(render(framed(512, PAPER, 0.58), None, 512), os.path.join(PUBLIC, 'icon-maskable-512.png'), A('icons', 'icon-maskable-512.png'))
# Social avatars: centred for circular crops
for name, size in [('linkedin-400', 400), ('x-400', 400), ('github-500', 500), ('instagram-1080', 1080)]:
    save(render(framed(size, PAPER, 0.66), None, size),
         os.path.join(PUBLIC, 'social', f'avatar-{name}.png'), A('social', f'avatar-{name}.png'))
# Email signature: formal lockup on white, 520 px wide = 2× of a 260 px display width,
# the smallest at which DIGITAL stays >= 12 px.
save(render(files['lockup-formal.svg'], None, 520, bg=WHITE), os.path.join(PUBLIC, 'email-signature.png'), A('email', 'email-signature-520.png'))
print('sizes:', {n: f'{len(c) / 1024:.1f} KB' for n, c in files.items()})

# OG image (src/app/api/og, edge runtime: no filesystem) gets the logos as data URIs.
og = os.path.join(APP, 'api', 'og', 'brand.ts')
uri = lambda name: 'data:image/svg+xml;base64,' + base64.b64encode(files[name].encode()).decode()
ratio = lambda name: (lambda v: round(v[2] / v[3], 4))([float(x) for x in re.search(r'viewBox="([^"]+)"', files[name]).group(1).split()])
open(og, 'w').write(
    '// Generated by scripts/brand/build_logo_set.py — do not edit.\n'
    '// Logo SVGs as data URIs for the OG image (edge runtime can\'t read public/).\n\n'
    f"export const lockup = {{ src: '{uri('lockup-formal.svg')}', ratio: {ratio('lockup-formal.svg')} }};\n"
    f"export const markReversed = {{ src: '{uri('mark-reversed.svg')}', ratio: {ratio('mark-reversed.svg')} }};\n")
print('wrote', os.path.relpath(og, ROOT))
