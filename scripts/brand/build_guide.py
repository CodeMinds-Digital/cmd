"""Brand asset guide (HTML) -> printed to docs/Assets.pdf by print.mjs.
Usage: python3 build_guide.py && node print.mjs"""
import html, os
from glyphs import font_file

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
C = os.path.join(ROOT, 'docs', 'brand', 'candidates')
OUT = os.path.join(os.path.dirname(__file__), '.out'); os.makedirs(OUT, exist_ok=True)
SG, GE, GM = font_file('Space Grotesk'), font_file('Geist'), font_file('Geist Mono')
NAVY, NAVY_TEXT, PAPER, ORANGE = '#0F1B2D', '#091321', '#F2EFE8', '#FF4D00'

def sized(n, h=None, w=None):
    s = open(os.path.join(C, n)).read()
    attrs = (f' height="{h}"' if h else '') + (f' width="{w}"' if w else '')
    return s.replace('<svg ', f'<svg{attrs} style="display:block" ', 1)

MARKS = [('A', 'Chip “c.”', 'Navy “c.” on an orange tile', 'mark-A-chip.svg', True),
         ('B', 'Navy “c.”', 'Paper “c” + orange period on a navy tile', 'mark-B-navy.svg', False),
         ('C', 'Dot', 'Orange dot on a navy tile', 'mark-C-dot.svg', False)]
WORDS = [('W1', '● codeminds', 'Header lockup (current site header)', 'word-W1-dot', False),
         ('W2', 'codeminds.', 'Footer lockup — pairs with the “c.” mark', 'word-W2-period', True),
         ('W3', 'codeminds. / DIGITAL', 'Formal lockup — documents, invoices, letterhead', 'word-W3-digital', False)]

def mark_rows(bg):
    out = ''
    for k, name, desc, f, rec in MARKS:
        sizes = ''.join(f'<figure>{sized(f, z, z)}<figcaption>{z}px</figcaption></figure>' for z in (16, 32, 64, 128))
        badge = '<span class="badge">Recommended</span>' if rec else ''
        out += (f'<div class="mrow"><div class="mlab"><b>{k} · {name}</b>{badge}<small>{desc}</small></div>'
                f'<div class="msizes">{sizes}</div><div class="tab {bg}">{sized(f, 16, 16)}<span>Codeminds Digital</span></div></div>')
    return out

def word_rows(theme):
    out = ''
    for k, name, desc, f, rec in WORDS:
        badge = '<span class="badge">Recommended</span>' if rec else ''
        out += (f'<div class="wrow"><div class="mlab"><b>{k} · {html.escape(name)}</b>{badge}<small>{desc}</small></div>'
                f'<div class="wsm">{sized(f"{f}-{theme}.svg", 24)}<figcaption>24px · header</figcaption></div>'
                f'<div>{sized(f"{f}-{theme}.svg", 46 if k == "W3" else 32)}</div></div>')
    return out

SWATCHES = [('Midnight navy', NAVY, 'oklch(22.1% 0.039 258)', 'Dark tiles · Process band · buttons · app-icon tile (B/C)'),
            ('Navy-black', NAVY_TEXT, 'oklch(18.5% 0.032 258)', 'Wordmark and text on light · text on orange'),
            ('Paper', PAPER, 'oklch(95.3% 0.010 87.5)', 'Light background · wordmark on navy'),
            ('Orange', ORANGE, 'oklch(66.8% 0.224 37)', 'Period / dot · app-icon tile (A) · fills only'),
            ('Orange text', '#B83700', 'oklch(52.5% 0.173 37.6)', 'Only when orange must be text (links)')]
PAIRS = [('Navy-black logo on Paper', NAVY_TEXT, PAPER, '16.2 : 1', 'ok'),
         ('Paper logo on Midnight navy', PAPER, NAVY, '15.1 : 1', 'ok'),
         ('Navy-black logo on Orange', NAVY_TEXT, ORANGE, '5.6 : 1', 'ok'),
         ('Orange dot on Midnight navy', ORANGE, NAVY, '5.2 : 1', 'ok'),
         ('Orange logo on Paper', ORANGE, PAPER, '2.9 : 1', 'no')]
PLACEMENTS = [
    ('Website', [('Header', 'Wordmark (W2)', '24px tall · min 20px', 'SVG'), ('Footer', 'Wordmark (W2)', 'Fluid, up to ~220px', 'Live text (built)'),
                 ('Browser tab', 'Mark A', '16 · 32 · 48px', 'favicon.ico + icon.svg'), ('iPhone home screen', 'Mark A', '180 × 180, no transparency', 'apple-touch-icon.png'),
                 ('Android / PWA', 'Mark A', '192 · 512 + maskable 512 (logo in centre 80%)', 'PNG + manifest'), ('Link previews (OG / X card)', 'Wordmark + headline', '1200 × 630', 'PNG via /api/og (built)')]),
    ('Social', [('LinkedIn company logo', 'Mark A', '400 × 400', 'PNG'), ('LinkedIn cover', 'Wordmark on paper', '1128 × 191', 'PNG'),
                ('X / Twitter avatar', 'Mark A', '400 × 400', 'PNG'), ('X header', 'Wordmark + tagline', '1500 × 500', 'PNG'),
                ('GitHub org avatar', 'Mark A', '500 × 500', 'PNG'), ('GitHub social preview', 'Wordmark + tagline', '1280 × 640', 'PNG'),
                ('Instagram profile', 'Mark A', '1080 × 1080 (shown at 320)', 'PNG')]),
    ('Documents & email', [('Email signature', 'Wordmark (W2)', '200 × 50 (export 400 × 100 @2x)', 'PNG'),
                           ('Invoices / proposals / letterhead', 'Formal lockup (W3)', 'Min 48px / 15mm tall', 'SVG / PDF'),
                           ('Slides', 'Wordmark (W2) + Mark A', 'Wordmark 24–32pt on title slide', 'SVG / PNG')]),
]
ASSETS = [('icon.svg', 'Scalable favicon (Mark A)', 'app/', 'To create'), ('favicon.ico', '16 / 32 / 48 multi-size', 'app/', 'To create'),
          ('apple-icon.png', '180 × 180', 'app/', 'To create'), ('icon-192.png · icon-512.png', 'PWA icons', 'public/brand/', 'To create'),
          ('icon-maskable-512.png', 'Android adaptive icon, 80% safe zone', 'public/brand/', 'To create'),
          ('manifest.webmanifest', 'Name, colours, icons for “Add to Home Screen”', 'app/manifest.ts', 'To create'),
          ('logo-primary.svg / -reversed.svg', 'Wordmark, light + navy', 'public/brand/', 'To create'),
          ('logo-mono-navy.svg / -white.svg', 'One-colour wordmark', 'public/brand/', 'To create'),
          ('logo-formal.svg', 'W3 lockup for documents', 'public/brand/', 'To create'), ('mark.svg · mark-512.png', 'Square mark for avatars', 'public/brand/', 'To create'),
          ('social/*.png', 'LinkedIn, X, GitHub, Instagram sizes above', 'public/brand/social/', 'To create'), ('email-signature.png', '400 × 100', 'public/brand/', 'To create'),
          ('OG image', 'Dynamic, 1200 × 630 (navy)', '/api/og', 'Done'), ('stack-icons.svg', 'Technology marks for the “Built with” strip', 'public/brand/', 'Done'),
          ('/icons/logo.svg (old favicon)', '120 × 40 wordmark used as favicon — unreadable in tabs', 'public/icons/', 'Replace')]

def table(rows, head):
    return ('<table><thead><tr>' + ''.join(f'<th>{h}</th>' for h in head) + '</tr></thead><tbody>'
            + ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table>')

def page(n, kicker, title, body, cls=''):
    return (f'<section class="page {cls}"><header class="ph"><span class="k">{n} ── {kicker}</span><span>codeminds. brand assets · v2026.2</span></header>'
            f'<h1>{title}</h1>{body}<footer class="pf"><span>Codeminds Digital · Chennai</span><span>{n}</span></footer></section>')

css = f'''
@font-face{{font-family:SG;src:url("file://{SG}") format("woff2");font-weight:300 700}}
@font-face{{font-family:GE;src:url("file://{GE}") format("woff2");font-weight:100 900}}
@font-face{{font-family:GM;src:url("file://{GM}") format("woff2");font-weight:100 900}}
@page{{size:A4;margin:0}}*{{box-sizing:border-box}}
body{{margin:0;font:10pt/1.5 GE,system-ui,sans-serif;color:{NAVY_TEXT};-webkit-print-color-adjust:exact;print-color-adjust:exact}}
code{{font-family:GM,monospace;font-size:.92em}}
.page{{width:210mm;height:297mm;padding:16mm 16mm 14mm;background:{PAPER};position:relative;page-break-after:always;overflow:hidden}}
.page.dark{{background:{NAVY};color:{PAPER}}}
.ph,.pf{{display:flex;justify-content:space-between;font:500 7pt GM,monospace;letter-spacing:.12em;text-transform:uppercase;color:#58616E}}
.dark .ph,.dark .pf{{color:#9DA5B1}}.ph .k{{color:#B83700}}.dark .ph .k{{color:#FF7A3D}}
.pf{{position:absolute;left:16mm;right:16mm;bottom:10mm;border-top:1px solid rgba(9,19,33,.12);padding-top:3mm}}.dark .pf{{border-color:rgba(242,239,232,.15)}}
h1{{font:700 26pt/1 SG,sans-serif;letter-spacing:-.03em;margin:9mm 0 6mm}}
h2{{font:600 8pt GM,monospace;letter-spacing:.14em;text-transform:uppercase;color:#58616E;margin:7mm 0 3mm}}.dark h2{{color:#9DA5B1}}
p{{margin:0 0 3mm;max-width:150mm}}.lead{{font-size:11.5pt;color:#4D5767}}.dark .lead{{color:#9DA5B1}}
.tile{{background:#fff;border:1px solid rgba(9,19,33,.1);border-radius:5mm;padding:6mm}}
.mrow,.wrow{{display:flex;align-items:center;gap:7mm;padding:3.2mm 0;border-bottom:1px solid rgba(9,19,33,.08)}}.dark .mrow{{border-color:rgba(242,239,232,.1)}}
.mlab{{width:46mm;flex:none}}.mlab b{{display:block;font:700 10.5pt SG}}.mlab small{{display:block;color:#58616E;font-size:8pt}}.dark .mlab small{{color:#9DA5B1}}
.badge{{display:inline-block;margin:1mm 0;background:{ORANGE};color:{NAVY_TEXT};font:500 6.5pt GM;letter-spacing:.1em;text-transform:uppercase;padding:.6mm 2mm;border-radius:9mm}}
.msizes{{display:flex;align-items:flex-end;gap:5mm}}figure{{margin:0;text-align:center}}figcaption{{font:500 6.5pt GM;color:#58616E;margin-top:1.2mm}}.dark figcaption{{color:#9DA5B1}}
.tab{{display:flex;align-items:center;gap:2mm;padding:2mm 3.5mm;border-radius:2.5mm 2.5mm 0 0;font-size:8pt;margin-left:auto}}.tab.paper{{background:#fff}}.tab.ink{{background:#1d2a3e}}
.wsm{{width:44mm;flex:none}}
.inkPanel{{background:{NAVY};color:{PAPER};border-radius:5mm;padding:5mm 6mm 2mm;margin-top:6mm}}
.inkPanel .wrow{{border-color:rgba(242,239,232,.1)}}.inkPanel .mlab small,.inkPanel figcaption,.inkPanel h2{{color:#9DA5B1}}
.cover{{display:flex;flex-direction:column;justify-content:space-between}}.cover .big{{margin-top:38mm}}.cover h1{{font-size:44pt;margin:10mm 0 4mm}}
.chip{{display:inline-block;background:{ORANGE};color:{NAVY_TEXT};padding:0 .12em .05em;border-radius:.14em}}
.sw{{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm}}.sw div{{border-radius:4mm;overflow:hidden;border:1px solid rgba(9,19,33,.1);background:#fff}}
.sw i{{display:block;height:24mm}}.sw p{{padding:2.5mm 3mm;margin:0;font-size:7.5pt;line-height:1.35}}.sw b{{font:700 9.5pt SG;display:block}}.sw code{{font:500 7pt GM;display:block;color:#4D5767}}
table{{width:100%;border-collapse:collapse;font-size:8.6pt}}th{{text-align:left;font:500 6.8pt GM;letter-spacing:.1em;text-transform:uppercase;color:#58616E;padding:2mm;border-bottom:1.5px solid {NAVY_TEXT}}}
td{{padding:2mm;border-bottom:1px solid rgba(9,19,33,.1);vertical-align:top}}.ok{{color:#14532d;font-weight:600}}.no{{color:#B91C1C;font-weight:600}}
.grid2{{display:grid;grid-template-columns:1fr 1fr;gap:5mm}}ul.rules{{margin:0;padding-left:4.5mm}}ul.rules li{{margin-bottom:1.6mm}}
.cs{{display:inline-block;padding:13mm;border:1px dashed {ORANGE};background:repeating-linear-gradient(45deg,rgba(255,77,0,.08) 0 2mm,transparent 2mm 4mm)}}.cs .in{{background:{PAPER}}}
.status{{font:500 7pt GM;letter-spacing:.08em;text-transform:uppercase;padding:.5mm 1.8mm;border-radius:9mm;white-space:nowrap}}
.s-todo{{background:#E8E4DA;color:#4D5767}}.s-done{{background:{NAVY};color:{PAPER}}}.s-fix{{background:{ORANGE};color:{NAVY_TEXT}}}
.note{{border-left:3px solid {ORANGE};padding:2mm 0 2mm 4mm;margin:4mm 0;font-size:9pt}}
'''

pages = [f'''<section class="page cover"><header class="ph"><span class="k">Brand assets</span><span>v2026.2 · October 2026</span></header>
<div class="big">{sized("word-W2-period-light.svg", 64)}<h1>Logo, colour &amp; <span class="chip">asset sizes.</span></h1>
<p class="lead">The logo system for the Voltage identity — now with Midnight navy as the dark brand colour: the square mark, the wordmark, the colours they may appear in, and every size the studio needs — web, app icons, social, email and documents.</p></div>
<div class="grid2"><div class="tile"><h2 style="margin-top:0">Status</h2><p><b>Draft — logo choice pending.</b> Mark A and wordmark W2 are recommended. Colour updated: <b>Midnight navy #0F1B2D</b> replaces black (Oct 2026).</p></div>
<div class="tile"><h2 style="margin-top:0">How these were made</h2><p>Hand-authored SVG (the Recraft design tool wasn't connected), lettering outlined from the site's own fonts. Regenerate with <code>scripts/brand/</code>.</p></div></div>
<footer class="pf"><span>Codeminds Digital · Chennai</span><span>01</span></footer></section>''']
pages.append(page('02', 'Mark', 'Square mark — candidates', '<p class="lead">Used for the favicon, app icons and social avatars. Shown at real sizes and in a browser tab.</p><h2>On paper</h2>' + mark_rows('paper') +
                  '<div class="note"><b>Recommendation: A · Chip “c.”</b> — it reuses the site’s orange highlight chip and the footer’s “codeminds.” period, stays legible at 16px, and holds its shape on paper and on navy.</div>'))
pages.append(page('03', 'Mark', 'Square mark — on navy', '<p class="lead">The same marks on Midnight navy #0F1B2D (dark UIs, social themes).</p><h2>On navy</h2>' + mark_rows('ink'), 'dark'))
pages.append(page('04', 'Wordmark', 'Wordmark — candidates', '<h2>On paper</h2>' + word_rows('light') + '<div class="inkPanel"><h2 style="margin-top:0">On navy</h2>' + word_rows('dark') + '</div>' +
                  '<div class="note"><b>Recommendation: W2 · “codeminds.”</b> as the primary logo, so wordmark and “c.” mark share one motif. W3 is the formal version for documents — only at 48px / 15mm tall or more.</div>'))
sw = ''.join(f'<div><i style="background:{hx}"></i><p><b>{n}</b><code>{hx}</code><code>{ok}</code>{use}</p></div>' for n, hx, ok, use in SWATCHES)
pairs = ''.join(f'<tr><td>{n}</td><td><span style="display:inline-block;width:14mm;height:6mm;border-radius:1.5mm;background:{bg};border:1px solid rgba(9,19,33,.12);position:relative"><span style="position:absolute;left:2mm;top:1.5mm;width:3mm;height:3mm;border-radius:50%;background:{fg}"></span></span></td><td>{r}</td><td class="{c}">{"Allowed" if c == "ok" else "Never"}</td></tr>' for n, fg, bg, r, c in PAIRS)
pages.append(page('05', 'Colour', 'Logo colours', f'<div class="sw">{sw}</div><h2>Approved combinations</h2>' + table([], ['Combination', 'Sample', 'Contrast', 'Use']).replace('<tbody></tbody>', '<tbody>' + pairs + '</tbody>') +
                  '<h2>Rules</h2><ul class="rules"><li><b>Orange is never the wordmark colour on light backgrounds</b> (2.9 : 1). Orange is for the period/dot and fills only.</li>'
                  '<li>The dark brand colour is <b>Midnight navy #0F1B2D</b> (not black). Text and the wordmark on light use navy-black #091321.</li>'
                  '<li>On an orange background the whole logo is navy-black — one colour, including the period.</li>'
                  '<li>One-colour versions (all navy / all white) for print, embossing and single-colour merch.</li>'
                  '<li>No gradients, shadows, outlines, rotation, stretching or other colours. Always use the supplied files.</li>'
                  '<li>App-icon tile: corner radius 22% of the tile width; the “c.” spans ~60% of the tile.</li></ul>'))
cs = (f'<div class="grid2"><div><h2 style="margin-top:0">Clear space</h2><div class="cs"><div class="in">{sized("word-W2-period-light.svg", 40)}</div></div>'
      '<p style="margin-top:3mm">Keep at least <b>one “c” height</b> (the x-height) clear on every side.</p></div><div><h2 style="margin-top:0">Minimum sizes</h2>'
      + table([['Wordmark W2', '80px wide', '20mm wide'], ['Formal lockup W3', '48px tall', '15mm tall'], ['Mark A', '16px', '6mm'], ['Header wordmark', '20–24px tall', '—']], ['Asset', 'Screen', 'Print'])
      + '<p style="margin-top:3mm">Below these sizes switch to the mark.</p></div></div><h2>Typography around the logo</h2>'
      + table([['Space Grotesk Bold', 'Wordmark, headings', 'Tracking −3% (wordmark), −2.5% to −4% (headings)'], ['Geist', 'Body text, UI, email copy', 'Regular / Medium'],
               ['Geist Mono', '“DIGITAL” descriptor, labels', 'Medium, uppercase, tracking +12–22%']], ['Typeface', 'Role', 'Setting']))
pages.append(page('06', 'Usage', 'Clear space, minimum size, type', cs))
rows = []
for group, items in PLACEMENTS:
    rows.append([f'<b style="font-family:SG">{group}</b>', '', '', '']); rows += [list(i) for i in items]
pages.append(page('07', 'Sizes', 'Sizes for every placement', table(rows, ['Placement', 'Asset', 'Size', 'Format'])))
st = {'To create': 's-todo', 'Done': 's-done', 'Replace': 's-fix'}
arows = [[f'<code>{html.escape(f)}</code>', d, f'<code>{l}</code>', f'<span class="status {st[s]}">{s}</span>'] for f, d, l, s in ASSETS]
pages.append(page('08', 'Checklist', 'Asset checklist', table(arows, ['File', 'What', 'Location', 'Status']) +
                  '<div class="note"><b>Fix first:</b> the current favicon <code>/icons/logo.svg</code> is a 120 × 40 wordmark, unreadable in browser tabs. It is replaced by the square-mark icon set above.</div>'
                  '<p>Icons are wired through Next.js file conventions (<code>app/icon.svg</code>, <code>app/favicon.ico</code>, <code>app/apple-icon.png</code>, <code>app/manifest.ts</code>). Brand files for the team live in <code>public/brand/</code>.</p>'))
open(os.path.join(OUT, 'Assets.html'), 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><title>Codeminds Digital — Brand assets</title><style>{css}</style></head><body>{"".join(pages)}</body></html>')
print(f'{len(pages)} pages -> {os.path.relpath(os.path.join(OUT, "Assets.html"), ROOT)}')
