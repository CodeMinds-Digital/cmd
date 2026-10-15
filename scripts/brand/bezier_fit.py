"""Refit traced outlines with few cubic Béziers (Schneider, Graphics Gems 1990).

vtracer's spline output is accurate but verbose (runs of tiny collinear curves).
`simplify(d, tol)` samples each closed subpath, splits at corners, and refits
cubics within `tol` units, emitting compact relative path data.
"""
import re
import numpy as np

TOKEN = re.compile(r'[A-Za-z]|-?\d+(?:\.\d+)?(?:e-?\d+)?')


def _subpaths(d):
    """Absolute M/L/C/Z path data -> list of dense point arrays (one per closed subpath)."""
    toks, i, subs, cur, pt = TOKEN.findall(d), 0, [], [], None
    cmd = None
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]; i += 1
            if cmd in 'Zz':
                if cur: subs.append(np.array(cur))
                cur = []; continue
        n = {'M': 2, 'L': 2, 'C': 6}[cmd]
        v = [float(x) for x in toks[i:i + n]]; i += n
        if cmd == 'M':
            if cur: subs.append(np.array(cur))
            pt = np.array(v); cur = [pt]; cmd = 'L'
        elif cmd == 'L':
            pt = np.array(v); cur.append(pt)
        else:
            p0, p1, p2, p3 = pt, np.array(v[:2]), np.array(v[2:4]), np.array(v[4:])
            for t in np.linspace(0, 1, 7)[1:]:
                cur.append(_bez(np.array([p0, p1, p2, p3]), t))
            pt = p3
    if cur: subs.append(np.array(cur))
    return subs


def _bez(c, t):
    t = np.asarray(t)[..., None]; mt = 1 - t
    return mt ** 3 * c[0] + 3 * mt ** 2 * t * c[1] + 3 * mt * t ** 2 * c[2] + t ** 3 * c[3]


def _bez_d(c, t):
    t = np.asarray(t)[..., None]; mt = 1 - t
    return 3 * mt ** 2 * (c[1] - c[0]) + 6 * mt * t * (c[2] - c[1]) + 3 * t ** 2 * (c[3] - c[2])


def _bez_dd(c, t):
    t = np.asarray(t)[..., None]
    return 6 * (1 - t) * (c[2] - 2 * c[1] + c[0]) + 6 * t * (c[3] - 2 * c[2] + c[1])


def _unit(v):
    n = np.linalg.norm(v); return v / n if n > 1e-9 else v


def _generate(pts, u, t1, t2):
    a1 = np.outer(3 * (1 - u) ** 2 * u, t1); a2 = np.outer(3 * (1 - u) * u ** 2, t2)
    C = np.array([[np.sum(a1 * a1), np.sum(a1 * a2)], [np.sum(a1 * a2), np.sum(a2 * a2)]])
    base = _bez(np.array([pts[0], pts[0], pts[-1], pts[-1]]), u)
    tmp = pts - base
    X = np.array([np.sum(a1 * tmp), np.sum(a2 * tmp)])
    det = C[0, 0] * C[1, 1] - C[0, 1] ** 2
    seg = np.linalg.norm(pts[-1] - pts[0]); eps = 1e-6 * seg
    if abs(det) > 1e-12:
        al1 = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det; al2 = (C[0, 0] * X[1] - C[0, 1] * X[0]) / det
    else:
        al1 = al2 = 0
    if al1 < eps or al2 < eps:
        al1 = al2 = seg / 3
    return np.array([pts[0], pts[0] + t1 * al1, pts[-1] + t2 * al2, pts[-1]])


def _reparam(c, pts, u):
    d1, d2 = _bez_d(c, u), _bez_dd(c, u); diff = _bez(c, u) - pts
    num = np.sum(diff * d1, -1); den = np.sum(d1 * d1, -1) + np.sum(diff * d2, -1)
    return np.where(np.abs(den) > 1e-12, u - num / np.where(den == 0, 1, den), u)


def _fit(pts, t1, t2, tol, out):
    if len(pts) == 2:
        dist = np.linalg.norm(pts[1] - pts[0]) / 3
        out.append(np.array([pts[0], pts[0] + t1 * dist, pts[1] + t2 * dist, pts[1]])); return
    u = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]); u /= u[-1]
    c = _generate(pts, u, t1, t2)
    err = np.sum((_bez(c, u) - pts) ** 2, -1); split = int(np.argmax(err))
    if err[split] < tol ** 2:
        out.append(c); return
    if err[split] < (tol * 4) ** 2:
        for _ in range(8):
            u = np.clip(_reparam(c, pts, u), 0, 1)
            c = _generate(pts, u, t1, t2)
            err = np.sum((_bez(c, u) - pts) ** 2, -1); split = int(np.argmax(err))
            if err[split] < tol ** 2:
                out.append(c); return
    split = min(max(split, 1), len(pts) - 2)
    tc = _unit(pts[split - 1] - pts[split + 1])
    _fit(pts[:split + 1], t1, tc, tol, out)
    _fit(pts[split:], -tc, t2, tol, out)


def _resample(pts, step):
    """Closed polyline -> points spaced `step` apart along its length."""
    closed = np.vstack([pts, pts[:1]])
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(closed, axis=0), axis=1))])
    t = np.arange(0, s[-1], step)
    return np.stack([np.interp(t, s, closed[:, 0]), np.interp(t, s, closed[:, 1])], -1)


def _smooth(seg, r):
    """Moving average over ±r samples with the endpoints (corners) pinned."""
    if len(seg) <= 2 * r + 2: return seg
    k = np.ones(2 * r + 1) / (2 * r + 1)
    pad = np.vstack([np.repeat(seg[:1], r, 0), seg, np.repeat(seg[-1:], r, 0)])
    out = np.stack([np.convolve(pad[:, 0], k, 'valid'), np.convolve(pad[:, 1], k, 'valid')], -1)
    out[0], out[-1] = seg[0], seg[-1]
    return out


def _corners(pts, angle=60, k=8):
    """Indices where the outline turns sharper than `angle` degrees over a ±k-sample window."""
    n, idx = len(pts), []
    for i in range(n):
        a = _unit(pts[i] - pts[(i - k) % n]); b = _unit(pts[(i + k) % n] - pts[i])
        if np.degrees(np.arccos(np.clip(np.dot(a, b), -1, 1))) > angle:
            idx.append(i)
    # keep the sharpest point of each run of adjacent candidates
    keep, run = [], []
    for i in idx:
        if run and i - run[-1] > 1:
            keep.append(run[len(run) // 2]); run = []
        run.append(i)
    if run: keep.append(run[len(run) // 2])
    return keep


def _dedupe(pts, min_d=0.05):
    out = [pts[0]]
    for p in pts[1:]:
        if np.linalg.norm(p - out[-1]) > min_d: out.append(p)
    if len(out) > 1 and np.linalg.norm(out[-1] - out[0]) <= min_d: out.pop()
    return np.array(out)


def _fmt(v):
    s = f'{v:.1f}'
    s = s.rstrip('0').rstrip('.') if '.' in s else s
    if s in ('-0', ''): s = '0'
    return s.replace('0.', '.', 1) if s.startswith('0.') else s.replace('-0.', '-.', 1)


def _join(nums):
    return ' '.join(nums).replace(' -', '-')


def simplify(d, tol=0.5):
    """Return compact relative path data for absolute path `d`, fitted within `tol` units."""
    out = []
    for pts in _subpaths(d):
        pts = _dedupe(pts)
        if len(pts) < 3: continue
        # Uniform 0.5-unit samples; corners judged over ±4 units so 1-pixel stair-steps
        # in the trace don't register as corners, then smoothed away between corners.
        pts = _resample(pts, 0.5)
        if len(pts) < 8: continue
        cs = _corners(pts) or [0]
        pts = np.roll(pts, -cs[0], axis=0); cs = [c - cs[0] for c in cs] + [len(pts)]
        closed = np.vstack([pts, pts[:1]])
        curves = []
        for a, b in zip(cs[:-1], cs[1:]):
            seg = _smooth(_smooth(closed[a:b + 1], 4), 4)
            if len(seg) < 2: continue
            t1 = _unit(seg[min(4, len(seg) - 1)] - seg[0]); t2 = _unit(seg[max(-5, -len(seg))] - seg[-1])
            _fit(seg, t1, t2, tol, curves)
        start = np.round(curves[0][0], 1)
        parts, pen = [f'M{_join([_fmt(start[0]), _fmt(start[1])])}'], start
        cmds = []
        for c in curves:
            # round each control point to the grid *relative to the rounded pen* so error doesn't accumulate
            rel = [np.round(c[i] - pen, 1) for i in (1, 2, 3)]
            cmds += [_fmt(x) for p in rel for x in p]
            pen = pen + rel[2]
        parts.append('c' + _join(cmds) + 'z')
        out.append(''.join(parts))
    return ''.join(out)
