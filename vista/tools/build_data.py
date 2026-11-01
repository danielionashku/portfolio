#!/usr/bin/env python3
"""Merge research.json (+ overrides below) into data/projects.js."""
import json, sys, os, re, subprocess
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'projects.js')
rows = json.load(open(SRC))
about = next(r for r in rows if r['slug'] == 'about')
# Held back from the public site: scarlett-creative is unlaunched agency work (needs Working Hours' OK first).
HIDDEN = {'scarlett-creative'}
projects = [r for r in rows if r['slug'] != 'about' and r['slug'] not in HIDDEN]
SOT = 'assets/scroll-of-time/'

OV = {
  'fiyr': dict(theme='#0f6b4f', kindLabel='Personal finance app', year='2023–now', device='assets/fiyr/ios.png', deviceCaption='FIYR on iPhone (demo data)'),
  'lifegrid': dict(name='4160', theme='#1f2a44', kindLabel='Life planner app', year='2023–now'),
  'scroll-of-time': dict(theme='#6b4a1f', kindLabel='Interactive Bible history',
    videos=[dict(src=SOT+'tour.mp4', poster=SOT+'tour-poster.jpg', title="Scroll of Time tour: intro, timeline and Paul's first journey")]),
  # The landing-page clip was 12s of a static page; shot1 is the hero until a real walkthrough exists.
  'what-we-preach': dict(theme='#3b2d6b', kindLabel='Sermon analytics', glyph='chart', videos=[]),
  'reel-camera': dict(name='Reel Camera', theme='#3a2a1a', kindLabel='iPhone app', status='Beta (TestFlight)', url='https://reel-camera.web.app',
    screenshots=['assets/reel-camera/roll-poster.jpg','assets/reel-camera/shot1.jpg','assets/reel-camera/shot2.jpg']),
  'vesper': dict(theme='#0d1b2e', kindLabel='Voice assistant for Mac', status='In development (demo coming)'),
  'world': dict(theme='#b5651d', kindLabel='Data story website'),
  'reel-replicator': dict(name='Reel Replicator', glyph='bolt', theme='#5a1f6b', kindLabel='Claude Code skill + agent'),
  'reel-editor': dict(theme='#1d1d2b', kindLabel='Mac video editor'),
  # Media removed: the old tour showed a real inventory car's title history. Re-render against a fictional mock car.
  'demo-video': dict(glyph='film', theme='#23395b', kindLabel='Claude Code skill', screenshots=[], videos=[]),
  'groundwork': dict(theme='#1b2a24', kindLabel='AI automation studio'),
  'symbis': dict(name='Counseling Dashboard', glyph='contact', theme='#7a2e46', kindLabel='Internal church tool',
    screenshots=['assets/symbis/dashboard.jpg','assets/symbis/couple.jpg']),  # fictional demo couples
  'kingdom-feud': dict(name='Kingdom Feud', glyph='game', theme='#8a1c1c', kindLabel='Church game-show night'),
  'founders-realm': dict(glyph='castle', theme='#3d5a2a', kindLabel='3D game', status='Mac app (private build)', fun_fact='It took four tries: a static map, then a pixelated 2D canvas, then procedural three.js, and finally hand-placed CC0 art kits. Version four is the one that felt like a real kingdom.', videos_prepend=[dict(src='assets/founders-realm/teaser.mp4', poster='assets/founders-realm/teaser-poster.jpg', title="Founder's Realm teaser (0:46)")]),
  'power-dialer': dict(glyph='phone', theme='#14532d', kindLabel='Sales tool'),
  'mission-control': dict(glyph='dashboard', theme='#111827', kindLabel='Personal command center',
    screenshots=['assets/mission-control/terminals.jpg','assets/mission-control/automations.jpg']),  # seeded demo data
  'chief-of-staff': dict(glyph='user', theme='#334155', kindLabel='AI agent',
    screenshots=['assets/chief-of-staff/brief.jpg','assets/chief-of-staff/board.jpg']),
  'pulse': dict(glyph='bolt', theme='#0b3b5e', kindLabel='Terminal status line'),
  'side-quests': dict(glyph='game', icon='assets/side-quests/icon.png', url='https://4160.life', theme='#4c1d95', kindLabel='Pixel RPG inside 4160'),
  'cafe-automne-3d': dict(glyph='globe', theme='#5b3a29', kindLabel='Walkable 3D scene'),
  'lofi-rooms': dict(glyph='music', theme='#2b2140', kindLabel='YouTube ambience channel'),
  # shot2 (the coming-soon page) stays as a later thumb because the fun fact refers to it; the blank CRT capture is gone.
  'crystal-creative': dict(screenshots=['assets/crystal-creative/shot1.jpg','assets/crystal-creative/shot3.jpg','assets/crystal-creative/shot2.jpg']),
  'highland-glass': dict(fun_fact='I threw out my first version for looking like every other trade site, then built three separate luxury directions for the client to choose from.'),
}
# Single-string fixes inside research copy: (slug, field, old, new).
TEXT = [
  ('the-order-music', 'description', 'It came through Working Hours Studio.', 'Built with Working Hours Studio.'),
  ('vesper', 'highlights', 'Records calls and transcribes them locally with Daniel/Them speaker labels', "Transcribes meetings locally, with everyone's OK, and labels who said what"),
]
for p in projects:
    p.update(OV.get(p['slug'], {}))
    if p.get('videos_prepend'): p['videos'] = p.pop('videos_prepend') + (p.get('videos') or [])
    for slug, field, old, new in TEXT:
        if p['slug'] != slug: continue
        v = p.get(field)
        p[field] = [new if x == old else x for x in v] if isinstance(v, list) else (v or '').replace(old, new)
    p.pop('notes', None)
    if p['category'] == 'client': p.setdefault('kindLabel', 'Client website'); p.setdefault('theme', '#2a3b4f')
    for k in ('screenshots', 'videos', 'highlights', 'stack'): p[k] = p.get(k) or []
    if not p.get('icon'): p['icon'] = None

# Featured projects first: the desktop slideshow and Media Player start from the top of this list.
FEAT = ['fiyr','lifegrid','scroll-of-time','what-we-preach','reel-camera','vesper','founders-realm']
projects.sort(key=lambda p: FEAT.index(p['slug']) if p['slug'] in FEAT else len(FEAT))

slugs = {p['slug'] for p in projects}
def keep(lst): return [s for s in lst if s in slugs]
folders = {
  'Apps': dict(name='Apps', icon='folderApps', items=keep(['fiyr','lifegrid','scroll-of-time','what-we-preach','reel-camera','vesper','world','reel-editor'])),
  'Websites': dict(name='Websites (Groundwork)', icon='folderWeb', items=keep(['groundwork','velocity-german-autos','classics-for-weddings','highland-glass','north-bank-tree','pro-tile-marble','rose-manor-afh','the-order-music','crystal-creative','paradigm-coffee'])),
  'Tools': dict(name='Tools & Agents', icon='folderTools', items=keep(['reel-replicator','power-dialer','demo-video','mission-control','chief-of-staff','pulse','symbis'])),
  'Games': dict(name='Games & Experiments', icon='folderGames', items=keep(['founders-realm','kingdom-feud','side-quests','cafe-automne-3d','lofi-rooms'])),
}
placed = {s for f in folders.values() for s in f['items']}
extra = [p['slug'] for p in projects if p['slug'] not in placed]
if extra: folders['Tools']['items'] += extra

n = json.loads(about['notes']) if about.get('notes','').strip().startswith('{') else {}
exp = n.get('experience_timeline', [])
exp = sorted(exp, key=lambda e: 0 if 'Founder' in e['role'] else 1)
A = dict(
  name='Daniel Ionashku', role='Engineer & builder · Founder, Fivebags, Inc.',
  headline='10+ years in SaaS support engineering by day. Shipping my own apps by night.',
  location='Camas, WA (remote)', photo='assets/about/profile.jpg', email='daniel.ionashku@gmail.com',
  links=[dict(label='GitHub', url='https://github.com/danielionashku'), dict(label='LinkedIn', url='https://www.linkedin.com/in/danielionashku/'), dict(label='Email', url='mailto:daniel.ionashku@gmail.com'), dict(label='Groundwork', url='https://groundwork-studio.web.app')],
  bio=["I build things I'm curious about, usually somewhere between data, visuals, and something no one asked for.",
       "By day I work in support engineering, currently at Mixpanel and before that Atlassian and InVision, after starting out in customer support at Simple Finance. I debug systems, untangle APIs and dig into the problems most people avoid.",
       "What drives me is making things. In 2023 I founded Fivebags, Inc. and started shipping my own ideas: FIYR, 4160, Scroll of Time, What We Preach, a Super 8 camera app, a voice assistant, and a lot of websites through Groundwork, my AI automation studio. These days Claude Code is my co-pilot for almost all of it.",
       "I also love analog things: film, paper, things with weight. That pull between modern tooling and older, slower formats is where most of my ideas come from. (Hence this whole desktop.)"],
  now=['Shipping FIYR and 4160 on web, iPhone and Apple Watch','Building Groundwork: websites + AI automation for small businesses','Finishing Reel Camera and Vesper'],
  experience=[dict(role=e['role'], company=e['company'], dates=e['dates'], summary=e['line']) for e in exp],
  skills=['Debugging & root cause analysis','REST APIs','SSO / SAML / OAuth','JavaScript','Python','SQL','Vue','React','Swift / SwiftUI','Firebase','GCP / AWS','Claude Code','MCP','LLM integrations','Technical writing','Mentoring'],
  tools=['Claude Code','Terminal + zellij','Alfred','Wispr Flow','Firebase','Higgsfield','ffmpeg'],
  beyond='Travel and street photography: new places, candid moments, light. It sharpens how I see detail and composition, and that carries straight into design. I speak English, Russian and Romanian.',
)
DV = dict(
  about=A, projects=projects, folders=folders, folderOrder=list(folders.keys()),
  desktop=keep(['fiyr','lifegrid','scroll-of-time','what-we-preach','reel-camera','vesper','founders-realm','power-dialer','reel-replicator','groundwork']),
  featured=keep(['fiyr','lifegrid','scroll-of-time','what-we-preach','reel-camera','vesper','founders-realm']),
  # Hosts that refuse to be framed (X-Frame-Options / frame-ancestors). audit_media.py --net re-checks these.
  noFrame=['fiyr.app','paradigmcoffeeco.com'],
  notes=dict(
    readme="WELCOME TO DANIEL VISTA\n=======================\n\nHi, I'm Daniel. My old portfolio was a normal website.\nThis one is a 2007 desktop, because why not.\n\nHOW TO USE THIS COMPUTER\n- Double-click icons to open them (one tap on a phone).\n- Drag windows around by the title bar. Double-click it to maximize.\n- The round Start orb (bottom left) has search. Try typing \"fiyr\".\n- Ctrl+Alt+F (or the Flip button next to Start) opens Flip 3D.\n  Right-click the desktop for more.\n- Command Prompt is real-ish. Type \"help\".\n\nWHERE THINGS ARE\n- Projects folder: every app, site, tool and game, sorted.\n- Videos: promo films for FIYR and 4160 (made with code, not editing software), plus demos.\n- About Me.pdf: bio, experience, how to reach me.\n\nEverything here was built with Claude Code as my pair programmer.\nNo Microsoft assets were harmed: every icon is hand-drawn SVG.\n\n- Daniel",
    ideas="ideas-for-later.txt\n\n[ ] teach the FIRE calculator to judge my coffee spending\n[ ] Reel Camera: the marketing site (in progress)\n[ ] Vesper: record a real demo\n[ ] Founder's Realm: more villagers, fewer bugs\n[ ] finally empty the Recycle Bin\n[x] rebuild my portfolio as Windows Vista  <- you are here",
    sticky='Double-click anything.\nStart orb = search.\nCtrl+Alt+F = Flip 3D ✨',
    balloon='Your projects are ready. Click here to open the Projects folder.',
  ),
  recycle=[
    dict(name='old-portfolio.html', sub='Replaced', icon='doc', why='A perfectly fine scrolling portfolio. Too normal. Replaced by this desktop.'),
    dict(name='screen-recorder.app', sub='Built and binned in a week', icon='film', why='I built a screen recorder with auto-zoom, called it trash, and replaced it with the Demo Video skill, which records nothing.'),
    dict(name='ai-ad-style-v1.mp4', sub='Rejected', icon='media', why='An AI video ad style I hated. Replaced by ads rendered from HTML.'),
    dict(name='generic-trade-site.html', sub='Rejected', icon='globe', why='Looked like every other contractor site, so I binned it and built three luxury design directions instead.'),
    dict(name='Untitled (47).txt', sub='Empty', icon='notepad', why='Just an idea I forgot. Probably genius.'),
  ],
)
# Pixel size of every referenced image/video, so the page can pick contain vs cover without waiting for load.
ROOT = os.path.join(os.path.dirname(__file__), '..')
def dims(rel):
    f = os.path.join(ROOT, rel)
    if not os.path.exists(f): return None
    if rel.endswith('.mp4'):
        o = subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip().split(',')
        return [int(o[0]), int(o[1])] if len(o) == 2 else None
    o = subprocess.run(['sips','-g','pixelWidth','-g','pixelHeight',f],capture_output=True,text=True).stdout
    m = re.findall(r'pixel(?:Width|Height): (\d+)', o)
    return [int(m[0]), int(m[1])] if len(m) == 2 else None
media = {}
for p in projects:
    for rel in [p['icon']] + p['screenshots'] + [x for v in p['videos'] for x in (v['src'], v.get('poster'))]:
        if rel and rel not in media:
            d = dims(rel)
            if d: media[rel] = d
DV['media'] = media
open(OUT, 'w').write('/* generated by tools/build_data.py */\nwindow.DV = ' + json.dumps(DV, indent=1, ensure_ascii=False) + ';\n')
print('wrote', OUT, len(projects), 'projects')
# Gate every rebuild on the media audit, so a bad upload is caught when the data is regenerated.
sys.exit(subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'audit_media.py'), '--quiet']).returncode)
