"""Vectorize the chosen concept (01 · Classic Peacock Lotus) into flat brand-colour layers.

Source: docs/brand/source/01-classic-peacock-lotus.png (AI concept board, supplied by the studio).
Steps: hue-separate into orange and navy layers (strict two-colour: the green lotus
leaves join the navy layer) -> clean specks/holes -> upscale 2x + light Gaussian blur, re-threshold (removes
pixel stair-steps, which otherwise trace as wobbles and bloat the node count) ->
trace each layer with vtracer (binary, spline) -> write layer path data to
docs/brand/final/_layers.json for build_logo_set.py.

Usage: python3 vectorize_mark.py
"""
import json, os, re, tempfile
import numpy as np
from PIL import Image
from scipy import ndimage
import vtracer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'docs', 'brand', 'source', '01-classic-peacock-lotus.png')
OUT = os.path.join(ROOT, 'docs', 'brand', 'final')
UPSCALE = 2
BLUR = 1.5  # source pixels

def hsv(a):
    mx, mn = a.max(-1), a.min(-1); d = np.maximum(mx - mn, 1e-6)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return h, s, mx

def clean(mask, min_obj=120, min_hole=120):
    lab, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    keep = np.isin(lab, np.where(sizes >= min_obj)[0] + 1)
    holes = ~keep; hl, hn = ndimage.label(holes)
    hs = ndimage.sum(holes, hl, range(1, hn + 1))
    small_holes = np.isin(hl, np.where(hs < min_hole)[0] + 1)
    return keep | small_holes

def trace(mask):
    """Binary mask -> list of (d, tx, ty) path tuples from vtracer."""
    img = Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).convert('RGB')
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = os.path.join(tmp, 'in.png'), os.path.join(tmp, 'out.svg')
        img.save(src)
        vtracer.convert_image_to_svg_py(src, dst, colormode='binary', mode='spline', filter_speckle=10 * UPSCALE ** 2,
                                        corner_threshold=60, length_threshold=4.0, splice_threshold=45,
                                        path_precision=1)
        svg = open(dst).read()
    paths = []
    for tag in re.findall(r'<path\b[^>]*>', svg):
        d = re.search(r'\bd="([^"]+)"', tag).group(1)
        t = re.search(r'transform="translate\(([-\d.]+),([-\d.]+)\)"', tag)
        paths.append((d, float(t.group(1)) if t else 0.0, float(t.group(2)) if t else 0.0))
    return paths

def main():
    a = np.asarray(Image.open(SRC).convert('RGB')).astype(float) / 255
    ink = np.sqrt(((1 - a) ** 2).sum(-1)) > 0.25
    h, s, v = hsv(a)
    orange = ink & ((h < 55) | (h > 320)) & (s > 0.35)
    blue = ink & (h >= 170) & (h <= 320)
    green = ink & (h >= 60) & (h < 170)
    dark = ink & (v < 0.35)
    layers = {'orange': orange & ~dark, 'navy': blue | green | dark}
    union = layers['orange'] | layers['navy']
    ys, xs = np.where(union); pad = 6
    y0, y1, x0, x1 = max(ys.min() - pad, 0), ys.max() + pad, max(xs.min() - pad, 0), xs.max() + pad
    out = {'width': int((x1 - x0) * UPSCALE), 'height': int((y1 - y0) * UPSCALE), 'layers': {}}
    for name, m in layers.items():
        m = clean(m[y0:y1, x0:x1])
        big = Image.fromarray((m * 255).astype(np.uint8)).resize(((x1 - x0) * UPSCALE, (y1 - y0) * UPSCALE), Image.LANCZOS)
        big = ndimage.gaussian_filter(np.asarray(big).astype(float) / 255, BLUR * UPSCALE) > 0.5
        out['layers'][name] = trace(big)
        print(name, 'pixels', int(m.sum()), 'paths', len(out['layers'][name]))
    os.makedirs(OUT, exist_ok=True)
    json.dump(out, open(os.path.join(OUT, '_layers.json'), 'w'))
    print('viewBox', out['width'], out['height'])

if __name__ == '__main__':
    main()
