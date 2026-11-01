#!/usr/bin/env python3
"""Audit every asset referenced by data/projects.js.

Errors (exit 1): missing file, wrong codec/pixel format, no faststart, over-size
(videos > 1280px, images > 1600px), heavy files, tiny shots, near-blank shots or
posters, near-blank video frames, byte-identical duplicates, off-centre or
non-square icons.
Notes (no failure): tall/ultrawide shots that need a letterboxed slot, and files
under assets/ that nothing references.

  python3 tools/audit_media.py           full table
  python3 tools/audit_media.py --quiet   only problems
  python3 tools/audit_media.py --net     also check every project URL's frame
                                         headers against DV.noFrame
"""
import hashlib, json, os, re, subprocess, sys, urllib.request

QUIET = '--quiet' in sys.argv
NET = '--net' in sys.argv
root = os.path.join(os.path.dirname(__file__), '..')
js = open(os.path.join(root, 'data/projects.js')).read()
DV = json.loads(js[js.index('{'):js.rstrip().rstrip(';').rindex('}') + 1])

refs = []
for p in DV['projects']:
    if p.get('icon'): refs.append((p['slug'], 'icon', p['icon']))
    for s in p['screenshots']: refs.append((p['slug'], 'shot', s))
    for v in p['videos']:
        refs.append((p['slug'], 'video', v['src']))
        if v.get('poster'): refs.append((p['slug'], 'poster', v['poster']))
refs.append(('about', 'photo', DV['about']['photo']))


def run(cmd, binary=False):
    return subprocess.run(cmd, capture_output=True, text=not binary).stdout


def frame(f, t):
    return run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', f, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], binary=True)


def gray_sd(src, gravity=None, crop=None):
    """Grayscale standard deviation in percent; src is a path or PNG bytes."""
    args = ['magick', '-' if isinstance(src, bytes) else src]
    if crop: args += ['-gravity', gravity, '-crop', crop, '+repage']
    args += ['-colorspace', 'gray', '-format', '%[fx:standard_deviation*100]', 'info:']
    out = subprocess.run(args, input=src if isinstance(src, bytes) else None, capture_output=True).stdout
    try: return float(out)
    except ValueError: return None


def img_size(f):
    o = run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', f])
    return int(re.search(r'pixelWidth: (\d+)', o).group(1)), int(re.search(r'pixelHeight: (\d+)', o).group(1))


bad, notes, seen, lines = 0, [], {}, []
checked = set()
for slug, kind, rel in refs:
    f = os.path.join(root, rel); issues = []; info = []
    if not os.path.exists(f):
        lines.append(f'MISSING {slug} {kind} {rel}'); bad += 1; continue
    mb = os.path.getsize(f) / 1e6
    if rel not in checked:
        d = hashlib.md5(open(f, 'rb').read()).hexdigest()
        if d in seen and seen[d] != rel: issues.append('duplicate of ' + seen[d])
        seen.setdefault(d, rel)
    if kind == 'video':
        o = json.loads(run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,pix_fmt:format=duration', '-of', 'json', f]) or '{}')
        st = (o.get('streams') or [{}])[0]; w, h = st.get('width', 0), st.get('height', 0); dur = float(o.get('format', {}).get('duration', 0))
        if st.get('codec_name') != 'h264': issues.append('codec ' + str(st.get('codec_name')))
        if st.get('pix_fmt') != 'yuv420p': issues.append('pix ' + str(st.get('pix_fmt')))
        if max(w, h) > 1280: issues.append('too big')
        if mb > 15: issues.append('heavy')
        if b'moov' not in open(f, 'rb').read(4096): issues.append('no faststart')
        if rel not in checked:
            # A frame whose centre is flat, or a half of the frame that stays flat for 3s
            # (an unrendered WebGL viewport, a dead embed). Dark designs measure 0.3+; dead areas ~0.02.
            for frac in (0.25, 0.5, 0.75, 0.9):
                t = dur * frac
                a, b = frame(f, t), frame(f, min(t + 3, dur - 0.1))
                if not a: continue
                c = gray_sd(a, 'center', '60%x60%+0+0')
                if c is not None and c < 0.5: issues.append(f'blank frame at {t:.0f}s'); break
                flat = lambda png, g: (lambda v: v is not None and v < 0.15)(gray_sd(png, g, '50%x70%+0+0'))
                dead = [g for g in ('east', 'west') if b and flat(a, g) and flat(b, g)]
                if dead: issues.append(f'dead {dead[0]} half at {t:.0f}s'); break
        desc = f'{w}x{h} {dur:.0f}s {mb:.1f}MB'
    else:
        w, h = img_size(f)
        if max(w, h) > 1600: issues.append('too big')
        if mb > 1.2: issues.append('heavy')
        if kind == 'icon':
            if abs(w - h) > 2 or w < 128: issues.append('icon not square/small')
            t = run(['magick', f, '-fuzz', '8%', '-trim', '-format', '%w %h %X %Y', 'info:']).split()
            if len(t) == 4:
                tw, th, tx, ty = (int(x) for x in t)
                cx, cy = tx + tw / 2 - w / 2, ty + th / 2 - h / 2
                if abs(cx) > 0.15 * w or abs(cy) > 0.15 * h: issues.append(f'glyph off centre ({cx:+.0f},{cy:+.0f})')
        if kind in ('shot', 'poster'):
            if w < 300: issues.append('tiny')
            sd = gray_sd(f)
            if sd is not None and sd < 2: issues.append(f'near-blank sd={sd:.1f}')
            if kind == 'shot' and (h > w * 1.1 or w > h * 2.2): info.append(f'aspect {w}x{h}, needs a contain slot')
        desc = f'{w}x{h} {mb * 1000:.0f}KB'
    checked.add(rel)
    bad += bool(issues)
    notes += [f'{slug} {rel}: {n}' for n in info]
    if issues or not QUIET:
        flag = ('  <-- ' + ', '.join(issues)) if issues else ''
        lines.append(f'{slug:24} {kind:6} {rel:58} {desc}{flag}')

# Files nobody references (fonts and CSS-referenced art are expected).
used = {r[2] for r in refs}
css = ''.join(open(os.path.join(root, d, n)).read() for d in ('css', 'js') for n in os.listdir(os.path.join(root, d)) if n.endswith(('.css', '.js')))
html = open(os.path.join(root, 'index.html')).read()
for dp, _, fs in os.walk(os.path.join(root, 'assets')):
    for n in fs:
        rel = os.path.relpath(os.path.join(dp, n), root)
        if n.startswith('.') or rel in used or rel.startswith('assets/fonts/') or n in css or rel in html: continue
        notes.append(f'unreferenced {rel}')

if NET:
    hostOf = lambda u: re.sub(r'^www\.', '', urllib.request.urlparse(u).hostname or '')
    for p in DV['projects']:
        u = p.get('url')
        if not u: continue
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, method='GET', headers={'User-Agent': 'Mozilla/5.0'}), timeout=15)
            xfo = (r.headers.get('X-Frame-Options') or '').lower(); csp = (r.headers.get('Content-Security-Policy') or '').lower()
        except Exception as e:
            lines.append(f'NET {p["slug"]}: {e}'); continue
        blocks = bool(xfo) or ('frame-ancestors' in csp and '*' not in csp.split('frame-ancestors')[1].split(';')[0])
        listed = hostOf(u) in DV['noFrame'] or p.get('noFrame')
        if blocks and not listed: lines.append(f'NET {p["slug"]}: {hostOf(u)} refuses framing but is not in noFrame'); bad += 1
        if listed and not blocks: notes.append(f'{hostOf(u)} is in noFrame but now allows framing')

print('\n'.join(lines))
if notes: print('\nnotes:\n  ' + '\n  '.join(notes))
print(f'\n{len(refs)} refs, {bad} with issues')
sys.exit(1 if bad else 0)
