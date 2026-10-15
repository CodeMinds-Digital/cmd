"""Contact sheet of the final logo set at real size, on paper and on navy.

Run after build_logo_set.py:  python3 review_sheet.py
Writes logo-assets/final/review-sheet.png.
"""
import io, os, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
F = os.path.join(ROOT, 'logo-assets', 'final')
PAPER, NAVY, MUTED, LIGHT = (242, 239, 232), (15, 27, 45), (77, 87, 103), (242, 239, 232)
try:
    FONT = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 15)
except OSError:
    FONT = ImageFont.load_default()


def svg(name, w):
    png = subprocess.run(['rsvg-convert', '-w', str(w), os.path.join(F, 'svg', name)], capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGBA')


def png(*p, size=None):
    im = Image.open(os.path.join(F, *p)).convert('RGBA')
    return im.resize((size, size), Image.LANCZOS) if size else im


def circle(im):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).ellipse([0, 0, im.size[0] - 1, im.size[1] - 1], fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0)); out.paste(im, (0, 0), m); return out


sheet = Image.new('RGB', (1500, 1200), PAPER)
d = ImageDraw.Draw(sheet)
d.rectangle([0, 600, 1500, 1200], fill=NAVY)


def put(im, x, y, label=None, dark=False):
    sheet.paste(im, (x, y), im)
    if label: d.text((x, y + im.size[1] + 8), label, fill=LIGHT if dark else MUTED, font=FONT)


# On paper
put(svg('mark.svg', 240), 30, 30, 'mark.svg')
put(svg('mark-mono-navy.svg', 150), 300, 30, 'mark-mono-navy.svg')
put(svg('lockup.svg', 520), 490, 40, 'lockup.svg')
put(svg('lockup-formal.svg', 520), 490, 200, 'lockup-formal.svg')
put(png('email', 'email-signature-520.png'), 30, 400, 'email-signature-520.png (display at 260 px)')
x = 1080
for s in (16, 32, 48):
    put(png('icons', f'favicon-{s}.png'), x, 40); x += s + 16
d.text((1080, 100), 'favicon.ico 16 / 32 / 48 (real size)', fill=MUTED, font=FONT)
put(png('icons', 'apple-icon-180.png'), 1080, 140, 'apple-icon 180')
put(circle(png('icons', 'icon-maskable-512.png', size=150)), 1290, 140, 'maskable (circle crop)')
put(svg('mark-small.svg', 40), 1080, 380)
put(svg('mark-small.svg', 64), 1135, 365, 'mark-small 40 / 64 (same art as mark)')
put(circle(png('social', 'avatar-linkedin-400.png', size=160)), 1300, 400, 'social avatar (circle)')
# On navy
put(svg('mark-reversed.svg', 240), 30, 630, 'mark-reversed.svg', True)
put(svg('mark-mono-white.svg', 150), 300, 630, 'mark-mono-white.svg (one-colour use only)', True)
put(svg('lockup-reversed.svg', 520), 490, 640, 'lockup-reversed.svg', True)
put(svg('lockup-formal-reversed.svg', 520), 490, 800, 'lockup-formal-reversed.svg', True)
put(svg('mark-small-reversed.svg', 40), 1080, 650)
put(svg('mark-small-reversed.svg', 64), 1135, 635, 'mark-small-reversed 40 / 64', True)
put(png('icons', 'icon-512.png', size=120), 1080, 760, 'app icon on a dark home screen', True)
sheet.save(os.path.join(F, 'review-sheet.png'))
print(os.path.join(F, 'review-sheet.png'))
