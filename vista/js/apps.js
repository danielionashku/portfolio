/* Daniel Vista — the programs.  Data comes from data/projects.js (window.DV). */
(function () {
  const { $, $$, h, esc } = OS;
  const DV = window.DV;
  const P = Object.fromEntries(DV.projects.map(p => [p.slug, p]));
  OS.profilePic = DV.about.photo;
  const thumbOf = (p) => p.icon || null;
  const shotOf = (p) => (p.screenshots && p.screenshots[0]) || (p.videos && p.videos[0] && p.videos[0].poster) || null;
  const allVideos = () => DV.projects.flatMap(p => (p.videos || []).map(v => ({ ...v, project: p })));
  const allShots = () => DV.projects.flatMap(p => (p.screenshots || []).map(s => ({ src: s, project: p })));
  const projIcon = (p) => p.icon || ICON(p.glyph || 'globe');
  const statusPill = (s) => `<span class="pill ${/live/i.test(s) ? 'live' : /dev|progress|build|beta|soon/i.test(s) ? 'dev' : ''}">${esc(s)}</span>`;
  const hostOf = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return u; } };
  const isPortraitSrc = (s) => /phone|reel-camera/.test(s || '');

  /* Tag every image by aspect ratio as it loads, so landscape slots (thumbs,
     gallery strip, sidebar slideshow, Flip 3D cards) can letterbox portrait
     phone shots and ultrawide captures instead of cropping them to a strip.
     load doesn't bubble, so listen in the capture phase. */
  const tagAspect = (i) => { if (i.tagName !== 'IMG' || !i.naturalWidth) return; const r = i.naturalWidth / i.naturalHeight; i.classList.toggle('tall', r < 0.9); i.classList.toggle('wide', r > 2.2); };
  document.addEventListener('load', (e) => tagAspect(e.target), true);

  /* One player at a time: starting any video or audio pauses the others. */
  document.addEventListener('play', (e) => { $$('video,audio').forEach(v => v !== e.target && !v.paused && v.pause()); }, true);

  /* ======================================================================
     Virtual file system
     ====================================================================== */
  const FOLDERS = DV.folders; // { id: {name, icon, items:[...] } }
  const FS = {
    'Computer': { name: 'Computer', icon: 'computer', items: () => [
      { type: 'folder', id: 'Projects' }, { type: 'folder', id: 'Videos' }, { type: 'folder', id: 'Documents' }, { type: 'folder', id: 'Pictures' },
      { type: 'drive', name: 'Local Disk (C:)', sub: 'Ideas: 98% full', open: () => OS.alert('Local Disk (C:) is 98% full of ideas.<br>Daniel Vista recommends shipping some of them.', 'info', 'Disk Cleanup') },
      { type: 'drive', name: 'Groundwork (G:)', sub: 'Network drive', icon: 'network', open: () => OS.open('project', { slug: 'groundwork' }) },
    ] },
    'Projects': { name: 'Projects', icon: 'folderStar', items: () => DV.folderOrder.map(id => ({ type: 'folder', id })) },
    'Videos': { name: 'Videos', icon: 'folderVideo', items: () => allVideos().map(v => ({ type: 'video', video: v })) },
    'Pictures': { name: 'Pictures', icon: 'folder', items: () => allShots().map((s, i) => ({ type: 'picture', shot: s, i })) },
    'Documents': { name: 'Documents', icon: 'folder', items: () => [
      { type: 'doc', name: 'About Me.pdf', icon: ICON('doc', 'PDF'), open: () => OS.open('aboutme') },
      { type: 'doc', name: 'readme.txt', icon: 'notepad', open: () => OS.open('notepad') },
      { type: 'doc', name: 'Resume (Experience).pdf', icon: ICON('doc', 'PDF'), open: () => OS.open('aboutme', { section: 'experience' }) },
      { type: 'doc', name: 'Contact Daniel.eml', icon: 'mail', open: () => OS.open('mail') },
      { type: 'doc', name: 'ideas-for-later.txt', icon: 'notepad', open: () => OS.open('notepad', { file: 'ideas' }) },
    ] },
    'Desktop': { name: 'Desktop', icon: 'computer', items: () => OS.desktopItems.map(d => ({ type: 'shortcut', d })) },
  };
  Object.entries(FOLDERS).forEach(([id, f]) => { FS[id] = { name: f.name, icon: f.icon, items: () => f.items.map(s => P[s] ? { type: 'project', p: P[s] } : null).filter(Boolean) }; });

  const itemView = (it) => {
    switch (it.type) {
      case 'folder': { const f = FS[it.id]; const n = f.items().length; return { name: f.name, icon: OS.iconHTML(f.icon), sub: `${n} item${n === 1 ? '' : 's'}`, kind: 'File Folder', open: (win) => win.nav(it.id) }; }
      case 'project': { const p = it.p; return { name: p.name, icon: p.icon ? `<img class="app" src="${esc(p.icon)}" alt="">` : (shotOf(p) ? `<img class="shot" src="${esc(shotOf(p))}" alt="">` : ICON(p.glyph || 'globe')), sub: p.status, kind: p.kindLabel || 'Application', detail: p.tagline, open: () => OS.open('project', { slug: p.slug }), menu: p.url ? [{ label: 'Open in web browser', icon: 'globe', act: () => OS.open('browser', { url: p.url }) }] : [] }; }
      case 'video': { const v = it.video; return { name: v.title || v.project.name, icon: v.poster ? `<img class="shot" src="${esc(v.poster)}" alt=""><span class="play">▶</span>` : ICON('film'), sub: v.project.name, kind: 'Video Clip', open: () => OS.open('media', { src: v.src }) }; }
      case 'picture': { const s = it.shot; return { name: s.project.name + ' ' + (it.i + 1), icon: `<img class="shot" src="${esc(s.src)}" alt="">`, sub: 'Screenshot', kind: 'JPEG Image', open: () => OS.open('photos', { src: s.src }) }; }
      case 'shortcut': { const d = it.d; return { name: d.label, icon: d.thumb ? `<img class="app" src="${esc(d.thumb)}" alt="">` : OS.iconHTML(d.icon), sub: 'Shortcut', kind: 'Shortcut', open: d.open }; }
      default: return { name: it.name, icon: OS.iconHTML(it.icon || 'doc'), sub: it.sub || '', kind: it.type === 'drive' ? 'Local Disk' : 'Document', open: it.open };
    }
  };

  /* ======================================================================
     Explorer
     ====================================================================== */
  OS.register('explorer', {
    name: 'Windows Explorer', icon: 'folder', w: 820, h: 540,
    title: (a) => FS[a.path || 'Computer']?.name || 'Explorer',
    icon: (a) => OS.iconHTML(FS[a.path || 'Computer']?.icon || 'folder'),
    run(win, args) {
      const hist = [], fut = [];
      win.body.innerHTML = `
        <div class="addressbar" style="background:linear-gradient(#e9f2fb,#d5e5f5);border-bottom:1px solid #a9c3de">
          <div class="nav-orbs"><button class="nav-orb ex-back" aria-label="Back">${ICON('back')}</button><button class="nav-orb ex-fwd" aria-label="Forward">${ICON('fwd')}</button></div>
          <div class="crumbs"></div>
          <div class="searchbox">${ICON('search')}<input placeholder="Search" aria-label="Search folder"></div>
        </div>
        <div class="toolbar"><button class="tb-btn ex-org">Organize ▾</button><button class="tb-btn ex-views">Views ▾</button><span class="tb-sep"></span><button class="tb-btn ex-slideshow">${ICON('photos')} Slide Show</button><button class="tb-btn ex-burn">Burn</button></div>
        <div class="explorer"><div class="ex-nav"><h5>Favorite Links</h5></div><div class="ex-content" tabindex="0"></div></div>
        <div class="ex-details"></div>`;
      const nav = $('.ex-nav', win.body), content = $('.ex-content', win.body), crumbs = $('.crumbs', win.body), details = $('.ex-details', win.body);
      const favs = [['Projects', 'folderStar'], ...DV.folderOrder.map(id => [id, FOLDERS[id].icon]), ['Videos', 'folderVideo'], ['Pictures', 'folder'], ['Documents', 'folder'], ['Desktop', 'computer'], ['Computer', 'computer']];
      favs.forEach(([id, ic]) => { const n = h('div', { class: 'nav-item', 'data-id': id }, `${OS.iconHTML(ic)}<span>${esc(FS[id].name)}</span>`); n.onclick = () => win.nav(id); nav.appendChild(n); });
      let cur, view = 'large', q = '';
      const setDetails = (v, count) => {
        if (!v) { const f = FS[cur]; details.innerHTML = `<div class="di">${OS.iconHTML(f.icon)}</div><div class="dt"><b>${count} item${count === 1 ? '' : 's'}</b><span>${esc(f.name)}</span></div>`; return; }
        details.innerHTML = `<div class="di">${v.icon.replace('<span class="play">▶</span>', '')}</div><div class="dt"><b>${esc(v.name)}</b><span><em>${esc(v.kind)}</em>${esc(v.detail || v.sub || '')}</span></div>`;
      };
      const render = () => {
        const f = FS[cur]; const raw = f.items();
        let items;
        // In a folder of folders (Computer, Projects), search every project, not just the subfolder names.
        if (q && raw.some(v => v.type === 'folder')) items = DV.projects.filter(p => (p.name + ' ' + p.slug + ' ' + (p.tagline || '') + ' ' + (p.description || '')).toLowerCase().includes(q)).map(p => itemView({ type: 'project', p }));
        else {
          items = raw.map(itemView);
          if (q) items = items.filter(v => (v.name + ' ' + (v.sub || '') + ' ' + (v.detail || '')).toLowerCase().includes(q));
        }
        content.innerHTML = ''; content.className = 'ex-content' + (view === 'tiles' ? ' tiles' : '');
        if (!items.length) content.innerHTML = `<div class="ex-empty">${q ? 'No items match your search.' : 'This folder is empty.'}</div>`;
        items.forEach(v => {
          const el = h('div', { class: 'ex-item', tabindex: 0 }, view === 'tiles'
            ? `<div class="thumb">${v.icon}</div><div class="tx"><div class="nm">${esc(v.name)}</div><div class="sub">${esc(v.kind || '')}</div>${v.sub ? `<div class="sub">${esc(v.sub)}</div>` : ''}</div>`
            : `<div class="thumb">${v.icon}</div><div class="nm">${esc(v.name)}</div>${v.sub ? `<div class="sub">${esc(v.sub)}</div>` : ''}`);
          const open = () => v.open(win);
          el.onclick = (e) => { $$('.ex-item.sel', content).forEach(x => x.classList.remove('sel')); el.classList.add('sel'); setDetails(v); if (OS.isTouch) open(); e.stopPropagation(); };
          el.ondblclick = open; el.onkeydown = (e) => { if (e.key === 'Enter') open(); };
          el.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); OS.menu(e.clientX, e.clientY, [{ label: '<b>Open</b>', act: open }, ...(v.menu || []), '-', { label: 'Properties', act: () => OS.alert(`<b>${esc(v.name)}</b><br>${esc(v.kind)}<br>${esc(v.detail || v.sub || '')}`, 'info', 'Properties') }]); };
          content.appendChild(el);
        });
        setDetails(null, items.length);
      };
      content.onclick = () => { $$('.ex-item.sel', content).forEach(x => x.classList.remove('sel')); render(); };
      win.nav = (id, push = true) => {
        if (!FS[id]) return;
        if (push && cur) { hist.push(cur); fut.length = 0; }
        cur = id; q = ''; $('.searchbox input', win.body).value = '';
        win.setTitle(FS[id].name); $('.win-icon', win.el).innerHTML = OS.iconHTML(FS[id].icon); win.task && ($('svg,img', win.task).outerHTML = OS.iconHTML(FS[id].icon));
        const chain = id === 'Computer' ? ['Computer'] : ['Projects'].includes(id) || ['Videos', 'Pictures', 'Documents', 'Desktop'].includes(id) ? ['Computer', id] : FOLDERS[id] ? ['Computer', 'Projects', id] : [id];
        crumbs.innerHTML = `<span class="crumb-ic">${OS.iconHTML(FS[id].icon)}</span>` + chain.map((c, i) => `<span class="crumb" data-c="${c}">${esc(FS[c].name)}</span>${i < chain.length - 1 ? '<span class="chev">▸</span>' : ''}`).join('');
        $$('.crumb', crumbs).forEach(c => c.onclick = () => win.nav(c.dataset.c));
        $$('.nav-item', nav).forEach(n => n.classList.toggle('on', n.dataset.id === id));
        $('.ex-back', win.body).disabled = !hist.length; $('.ex-fwd', win.body).disabled = !fut.length;
        render();
      };
      $('.ex-back', win.body).onclick = () => { if (!hist.length) return; fut.push(cur); win.nav(hist.pop(), false); $('.ex-fwd', win.body).disabled = false; };
      $('.ex-fwd', win.body).onclick = () => { if (!fut.length) return; hist.push(cur); win.nav(fut.pop(), false); };
      $('.searchbox input', win.body).oninput = (e) => { q = e.target.value.trim().toLowerCase(); render(); };
      $('.ex-views', win.body).onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom, [{ label: 'Large Icons' + (view === 'large' ? ' ✓' : ''), act: () => { view = 'large'; render(); } }, { label: 'Tiles' + (view === 'tiles' ? ' ✓' : ''), act: () => { view = 'tiles'; render(); } }]); };
      $('.ex-org', win.body).onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom, [{ label: 'New Folder', act: () => OS.alert('Folder creation is disabled on this portfolio. Daniel already has enough folders.', 'info') }, '-', { label: 'Properties', act: () => OS.alert(`<b>${esc(FS[cur].name)}</b><br>${FS[cur].items().length} items`, 'info') }, '-', { label: 'Close', act: () => win.close() }]); };
      $('.ex-slideshow', win.body).onclick = () => OS.open('photos', { slideshow: true });
      $('.ex-burn', win.body).onclick = () => OS.alert('Please insert a writable disc into drive D:.<br><small class="muted">(It\'s 2007. You know the drill.)</small>', 'info', 'Burn to Disc');
      win.reuseNav = (a) => a.path && win.nav(a.path);
      win.nav(args.path || 'Computer', false);
      win.flipThumb = null;
    },
    single: (a) => null,
  });
  OS.explore = (path) => {
    const ex = OS.wins.find(w => w.app === 'explorer' && !w.closed);
    if (ex && OS.active === ex) { ex.nav(path); return ex; }
    return OS.open('explorer', { path });
  };

  /* ======================================================================
     Project program window
     ====================================================================== */
  OS.register('project', {
    name: 'Project', w: 900, h: 620, minW: 340,
    title: (a) => P[a.slug]?.name || 'Project',
    icon: (a) => P[a.slug] ? projIcon(P[a.slug]) : 'globe',
    single: (a) => 'project:' + a.slug,
    run(win, { slug }) {
      const p = P[slug]; if (!p) { win.body.innerHTML = '<div class="pad">Project not found.</div>'; return; }
      win.flipThumb = shotOf(p);
      const shots = p.screenshots || [], vids = p.videos || [];
      const theme = p.theme || '#1a5aa6';
      win.body.classList.add('proj');
      win.body.innerHTML = `
        <div class="menubar"><span>File</span><span>View</span><span>Help</span></div>
        <div class="toolbar light">
          ${p.url ? `<button class="tb-btn pj-visit">${ICON('globe')} Visit ${esc(hostOf(p.url))}</button><a class="tb-btn" href="${esc(p.url)}" target="_blank" rel="noopener">Open in new tab ↗</a><span class="tb-sep" style="background:#b7c8da"></span>` : ''}
          ${vids.length ? `<button class="tb-btn pj-play">${ICON('media')} Play video</button>` : ''}
          ${shots.length ? `<button class="tb-btn pj-gallery">${ICON('photos')} Screenshots (${shots.length})</button>` : ''}
          <span style="flex:1"></span><button class="tb-btn pj-help">${ICON('help')}</button>
        </div>
        <div class="scroll selectable">
          <div class="pj-hero" style="--t:${esc(theme)}">
            <div class="pj-icon">${p.icon ? `<img src="${esc(p.icon)}" alt="">` : ICON(p.glyph || 'globe')}</div>
            <div class="pj-hd"><h1>${esc(p.name)}</h1><div class="pj-tag">${esc(p.tagline)}</div>
              <div class="pj-meta">${statusPill(p.status)}${p.url ? `<span class="pill">${esc(hostOf(p.url))}</span>` : ''}${(p.stack || []).slice(0, 6).map(s => `<span class="pill">${esc(s)}</span>`).join('')}</div></div>
          </div>
          <div class="pj-grid">
            <div class="pj-main">
              ${vids.length ? `<div class="pj-video"><video src="${esc(vids[0].src)}" ${vids[0].poster ? `poster="${esc(vids[0].poster)}"` : ''} controls playsinline preload="metadata"></video>${vids.length > 1 ? `<div class="pj-vlist">${vids.map((v, i) => `<button class="vbtn" data-v="${i}">${esc(v.title || 'Video ' + (i + 1))}</button>`).join('')}</div>` : ''}</div>` : ''}
              ${!vids.length && shots.length ? `<div class="pj-shot"><img src="${esc(shots[0])}" alt="${esc(p.name)} screenshot"></div>` : ''}
              <h2 class="vista-h2">About this program</h2>
              <p class="pj-desc">${esc(p.description)}</p>
              ${(p.highlights || []).length ? `<h2 class="vista-h2">What's inside</h2><ul class="pj-hl">${p.highlights.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
              ${shots.length > (vids.length ? 0 : 1) ? `<h2 class="vista-h2">Screenshots</h2><div class="pj-thumbs">${shots.map((s, i) => `<img src="${esc(s)}" data-i="${i}" alt="" loading="lazy">`).join('')}</div>` : ''}
            </div>
            <aside class="pj-side">
              <div class="pj-card"><h4>Program details</h4>
                <dl><dt>Status</dt><dd>${esc(p.status)}</dd><dt>Type</dt><dd>${esc(p.kindLabel || p.category)}</dd>${p.year ? `<dt>Built</dt><dd>${esc(p.year)}</dd>` : ''}${p.url ? `<dt>Address</dt><dd><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(hostOf(p.url))}</a></dd>` : ''}</dl>
                ${p.device ? `<figure class="pj-device"><img src="${esc(p.device)}" alt="${esc(p.deviceCaption || p.name + ' on iPhone')}" loading="lazy"><figcaption>${esc(p.deviceCaption || 'On iPhone')}</figcaption></figure>` : ''}
                ${p.url ? `<button class="vbtn primary pj-openweb">${ICON('globe')}<span>Open in web browser</span></button><a class="pj-newtab" href="${esc(p.url)}" target="_blank" rel="noopener">or open in a real tab ↗</a>` : `<div class="pj-nolink">${/internal|local/i.test(p.status) ? 'Runs on Daniel\'s Mac, so there\'s no public link. The video and screenshots show it in action.' : 'No public link yet.'}</div>`}
              </div>
              ${(p.stack || []).length ? `<div class="pj-card"><h4>Built with</h4>${p.stack.map(s => `<span class="pill">${esc(s)}</span>`).join('')}</div>` : ''}
              ${p.fun_fact ? `<div class="pj-card tip-card"><h4>${ICON('info')} Did you know?</h4><p>${esc(p.fun_fact)}</p></div>` : ''}
            </aside>
          </div>
        </div>
        <div class="statusbar"><span>${esc(p.status)}</span><span style="margin-left:auto">${esc(p.kindLabel || p.category)}</span></div>`;
      $('.pj-visit', win.body) && ($('.pj-visit', win.body).onclick = () => OS.open('browser', { url: p.url }));
      $('.pj-openweb', win.body) && ($('.pj-openweb', win.body).onclick = () => OS.open('browser', { url: p.url }));
      $('.pj-device img', win.body) && ($('.pj-device img', win.body).onclick = () => OS.open('photos', { src: p.device, only: slug }));
      $('.pj-play', win.body) && ($('.pj-play', win.body).onclick = () => OS.open('media', { src: vids[0].src }));
      $('.pj-gallery', win.body) && ($('.pj-gallery', win.body).onclick = () => OS.open('photos', { src: shots[0], only: slug }));
      const help = () => OS.alert(`${esc(p.name)} Help<br><br>Double-click things. Things open. That's the whole manual.`, 'info', 'Help');
      $('.pj-help', win.body).onclick = help;
      const click = (sel) => () => $(sel, win.body)?.click();
      const menus = {
        File: [...(p.url ? [{ label: 'Visit ' + esc(hostOf(p.url)), act: click('.pj-visit') }, { label: 'Open in new tab', act: () => window.open(p.url, '_blank', 'noopener') }, '-'] : []), { label: 'Close', act: () => win.close() }],
        View: [...(shots.length ? [{ label: `Screenshots (${shots.length})`, act: click('.pj-gallery') }] : []), ...(vids.length ? [{ label: 'Play video', act: click('.pj-play') }] : []), ...(shots.length || vids.length ? ['-'] : []), { label: win.maxed ? 'Restore' : 'Maximize', act: () => win.maximize() }],
        Help: [{ label: 'View Help', act: help }, { label: 'About ' + esc(p.name), act: () => OS.alert(`<b>${esc(p.name)}</b><br>${esc(p.tagline)}<br><br>${esc(p.status)}`, 'info', 'About') }],
      };
      $$('.menubar span', win.body).forEach(s => s.onclick = () => { const r = s.getBoundingClientRect(); const m = menus[s.textContent]; if (s.textContent === 'View') m[m.length - 1].label = win.maxed ? 'Restore' : 'Maximize'; OS.menu(r.left, r.bottom, m); });
      $$('.pj-thumbs img', win.body).forEach(img => img.onclick = () => OS.open('photos', { src: shots[+img.dataset.i], only: slug }));
      $$('.pj-vlist .vbtn', win.body).forEach(b => b.onclick = () => { const v = vids[+b.dataset.v]; const el = $('.pj-video video', win.body); el.src = v.src; if (v.poster) el.poster = v.poster; el.play().catch(() => { }); });
    },
  });

  /* ======================================================================
     Browser
     ====================================================================== */
  const homeHTML = () => `
    <div class="ie-home">
      <div class="ie-logo"><span>D</span><span>a</span><span>h</span><span>o</span><span>o</span><span>!</span></div>
      <div class="ie-search"><input placeholder="Search Daniel's corner of the web" aria-label="Search"><button class="vbtn">Search</button></div>
      <div class="ie-links">${DV.projects.filter(p => p.url).map(p => `<a href="#" data-u="${esc(p.url)}" class="ie-link">${p.icon ? `<img src="${esc(p.icon)}" alt="">` : ICON('globe')}<span><b>${esc(p.name)}</b><small>${esc(hostOf(p.url))}</small></span></a>`).join('')}</div>
      <div class="muted" style="text-align:center;margin-top:18px;font-size:11px">Best viewed in Daniel Vista at 1024×768 · Some sites don't like being framed, use “Open in new tab” if a page stays blank.</div>
    </div>`;
  OS.register('browser', {
    name: 'Internet', icon: 'globe', w: 1000, h: 680, minW: 360,
    run(win, { url }) {
      let hist = [], idx = -1;
      win.body.innerHTML = `
        <div class="addressbar ie-bar">
          <div class="nav-orbs"><button class="nav-orb ie-back" aria-label="Back">${ICON('back')}</button><button class="nav-orb ie-fwd" aria-label="Forward">${ICON('fwd')}</button></div>
          <div class="crumbs"><span class="crumb-ic">${ICON('globe')}</span><input class="ie-url" aria-label="Address" spellcheck="false"></div>
          <button class="tb-btn ie-go" style="color:#1e395b">Go</button>
          <a class="tb-btn ie-ext" style="color:#1e395b" target="_blank" rel="noopener" data-tip="Open in a real tab">↗</a>
          <div class="searchbox">${ICON('search')}<input class="ie-q" placeholder="Live Search" aria-label="Search"></div>
        </div>
        <div class="ie-tabs"><div class="ie-tab"><span class="ie-favicon">${ICON('globe')}</span><span class="ie-tabtitle">Home</span></div><span style="flex:1"></span><button class="tb-btn ie-home-btn">⌂ Home</button></div>
        <div class="ie-view"></div>
        <div class="statusbar"><span class="ie-status">Done</span><span style="margin-left:auto">Internet | Protected Mode: On</span></div>`;
      const view = $('.ie-view', win.body), urlIn = $('.ie-url', win.body), status = $('.ie-status', win.body);
      const show = (u) => {
        urlIn.value = u || 'dahoo://home'; $('.ie-ext', win.body).href = u || '#';
        $('.ie-back', win.body).disabled = idx <= 0; $('.ie-fwd', win.body).disabled = idx >= hist.length - 1;
        const fav = $('.ie-favicon', win.body);
        if (!u) {
          fav.innerHTML = ICON('globe');
          view.innerHTML = homeHTML(); $('.ie-tabtitle', win.body).textContent = 'Dahoo! Home'; win.setTitle('Dahoo! Home - Internet');
          $$('.ie-link', view).forEach(a => a.onclick = (e) => { e.preventDefault(); go(a.dataset.u); });
          const si = $('.ie-search input', view); const run = () => { const q = si.value.trim().toLowerCase(); const hit = DV.projects.find(p => (p.name + ' ' + p.tagline).toLowerCase().includes(q)); if (hit) OS.open('project', { slug: hit.slug }); else OS.alert('Dahoo! found 0 results. Daniel probably hasn\'t built that yet.', 'info', 'Dahoo! Search'); };
          $('.ie-search button', view).onclick = run; si.onkeydown = (e) => { if (e.key === 'Enter') run(); }; // a handler property returning false would cancel every keystroke
          status.textContent = 'Done'; return;
        }
        const p = DV.projects.find(x => x.url && hostOf(x.url) === hostOf(u));
        $('.ie-tabtitle', win.body).textContent = p ? p.name : hostOf(u); win.setTitle((p ? p.name : hostOf(u)) + ' - Internet');
        fav.innerHTML = p?.icon ? `<img src="${esc(p.icon)}" alt="">` : ICON('globe');
        status.textContent = 'Opening page ' + u + '…';
        view.innerHTML = `<iframe src="${esc(u)}" title="${esc(hostOf(u))}" referrerpolicy="no-referrer-when-downgrade" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
          <div class="ie-blocked" hidden><div>${ICON('warn')}</div><h3>This page wants to be seen in its own window</h3><p>${esc(hostOf(u))} doesn't allow being shown inside other pages. Totally reasonable of it.</p><a class="vbtn primary" href="${esc(u)}" target="_blank" rel="noopener" style="display:inline-grid;place-items:center;text-decoration:none">Open ${esc(hostOf(u))} in a new tab</a></div>`;
        const fr = $('iframe', view), blk = $('.ie-blocked', view);
        if ((p && p.noFrame) || DV.noFrame.includes(hostOf(u))) { fr.remove(); blk.hidden = false; status.textContent = 'Page cannot be displayed here'; return; }
        fr.onload = () => { status.textContent = 'Done'; };
      };
      const go = (u) => {
        // A bare word ("fiyr") is a project name, not a hostname: map it to that project's site.
        if (u && !u.includes('.') && !u.includes(':') && !u.startsWith('dahoo')) {
          const w = u.toLowerCase(), p = DV.projects.find(x => x.url && (x.slug === w || x.name.toLowerCase() === w));
          if (p) u = p.url; else { const hit = DV.projects.find(x => (x.name + ' ' + x.slug + ' ' + x.tagline).toLowerCase().includes(w)); if (hit) { OS.open('project', { slug: hit.slug }); return; } OS.alert('Dahoo! found 0 results for “' + esc(u) + '”. Try a full address like example.com.', 'info', 'Dahoo! Search'); return; }
        }
        if (u && !/^https?:/.test(u) && !u.startsWith('dahoo')) u = 'https://' + u; if (u === 'dahoo://home') u = ''; hist = hist.slice(0, idx + 1); hist.push(u); idx = hist.length - 1; show(u); };
      $('.ie-back', win.body).onclick = () => { if (idx > 0) show(hist[--idx]); };
      $('.ie-fwd', win.body).onclick = () => { if (idx < hist.length - 1) show(hist[++idx]); };
      $('.ie-go', win.body).onclick = () => go(urlIn.value.trim());
      urlIn.onkeydown = (e) => { if (e.key === 'Enter') go(urlIn.value.trim()); };
      $('.ie-home-btn', win.body).onclick = () => go('');
      $('.ie-q', win.body).onkeydown = (e) => { if (e.key === 'Enter') { const q = e.target.value.trim().toLowerCase(); const hit = DV.projects.find(p => (p.name + ' ' + p.tagline + ' ' + p.description).toLowerCase().includes(q)); hit ? OS.open('project', { slug: hit.slug }) : OS.alert('No results for “' + esc(q) + '”.', 'info', 'Live Search'); } };
      win.go = go; go(url || '');
    },
    reuse: (win, a) => a.url && win.go(a.url),
    single: () => 'browser',
  });

  /* ======================================================================
     Media Player
     ====================================================================== */
  OS.register('media', {
    name: 'Media Player', icon: 'media', w: 900, h: 560, minW: 360, minH: 300,
    single: () => 'media',
    run(win, { src }) {
      const list = allVideos();
      win.body.classList.add('wmp');
      win.body.innerHTML = `
        <div class="wmp-top"><span class="wmp-tab on">Now Playing</span><span class="wmp-tab">Library</span><span class="wmp-tab">Rip</span><span class="wmp-tab">Burn</span><span class="wmp-tab">Sync</span><span style="flex:1"></span><span class="wmp-np"></span></div>
        <div class="wmp-main"><div class="wmp-stage"><video playsinline preload="metadata"></video><div class="wmp-viz"></div></div>
          <div class="wmp-list"><div class="wmp-lh">Now Playing ▾</div>${list.length ? list.map((v, i) => `<div class="wmp-li" data-i="${i}">${v.poster ? `<img src="${esc(v.poster)}" alt="">` : ''}<div><b>${esc(v.title || v.project.name)}</b><small>${esc(v.project.name)}</small></div></div>`).join('') : '<div class="pad" style="color:#9ab">No videos yet.</div>'}</div></div>
        <div class="wmp-ctrl">
          <div class="wmp-seek"><i></i><input type="range" min="0" max="1000" value="0" aria-label="Seek"></div>
          <div class="wmp-btns"><span class="wmp-time">00:00</span><button class="wmp-b sm wmp-prev" aria-label="Previous">⏮</button><button class="wmp-b big wmp-pp" aria-label="Play">▶</button><button class="wmp-b sm wmp-next" aria-label="Next">⏭</button><button class="wmp-b sm wmp-mute" aria-label="Mute">🔊</button><input class="wmp-vol" type="range" min="0" max="1" step=".05" value=".8" aria-label="Volume"><span style="flex:1"></span><button class="wmp-b sm wmp-fs" aria-label="Full screen">⛶</button></div>
        </div>`;
      const v = $('video', win.body), pp = $('.wmp-pp', win.body), seek = $('.wmp-seek input', win.body), bar = $('.wmp-seek i', win.body), t = $('.wmp-time', win.body);
      let cur = Math.max(0, list.findIndex(x => x.src === src));
      const fmt = (s) => isFinite(s) ? `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '00:00';
      const load = (i, play = true) => {
        if (!list.length) return; cur = (i + list.length) % list.length; const it = list[cur];
        v.src = it.src; if (it.poster) v.poster = it.poster; else v.removeAttribute('poster');
        $('.wmp-np', win.body).textContent = (it.title || it.project.name); win.setTitle((it.title || it.project.name) + ' - Media Player');
        $$('.wmp-li', win.body).forEach(li => li.classList.toggle('on', +li.dataset.i === cur));
        if (play) v.play().catch(() => { });
      };
      win.loadSrc = (s) => { const i = list.findIndex(x => x.src === s); if (i >= 0) load(i); };
      pp.onclick = () => v.paused ? v.play() : v.pause();
      v.onplay = () => { pp.textContent = '❚❚'; win.body.classList.add('playing'); };
      v.onpause = () => { pp.textContent = '▶'; win.body.classList.remove('playing'); };
      v.ontimeupdate = () => { const r = v.duration ? v.currentTime / v.duration : 0; seek.value = r * 1000; bar.style.width = r * 100 + '%'; t.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration); };
      v.onended = () => load(cur + 1);
      v.onclick = () => pp.click();
      seek.oninput = () => v.duration && (v.currentTime = seek.value / 1000 * v.duration);
      $('.wmp-prev', win.body).onclick = () => load(cur - 1);
      $('.wmp-next', win.body).onclick = () => load(cur + 1);
      $('.wmp-mute', win.body).onclick = (e) => { v.muted = !v.muted; e.target.textContent = v.muted ? '🔇' : '🔊'; };
      $('.wmp-vol', win.body).oninput = (e) => { v.volume = e.target.value; };
      $('.wmp-fs', win.body).onclick = () => (v.requestFullscreen || v.webkitEnterFullscreen || (() => { })).call(v);
      $$('.wmp-li', win.body).forEach(li => li.onclick = () => load(+li.dataset.i));
      $$('.wmp-tab', win.body).forEach(tb => tb.onclick = () => { if (tb.textContent !== 'Now Playing') OS.alert(`${tb.textContent} is not available. Daniel only makes the videos; he doesn't sell CDs.`, 'info', 'Media Player'); });
      load(cur, !!src);
    },
    reuse: (win, a) => a.src && win.loadSrc(a.src),
  });

  /* ======================================================================
     Photo Gallery
     ====================================================================== */
  OS.register('photos', {
    name: 'Photo Gallery', icon: 'photos', w: 900, h: 620, minW: 340,
    single: () => 'photos',
    run(win, args) {
      win.body.classList.add('pg');
      let timer = null; win.onClose.push(() => clearInterval(timer));
      const build = (a) => {
        clearInterval(timer); timer = null;
        const shots = allShots().filter(s => !a.only || s.project.slug === a.only);
        let i = Math.max(0, shots.findIndex(s => s.src === a.src));
        win.body.innerHTML = `<div class="pg-stage"><img alt=""><div class="pg-cap"></div></div>
          <div class="pg-strip">${shots.map((s, k) => `<img src="${esc(s.src)}" data-k="${k}" alt="" loading="lazy">`).join('')}</div>
          <div class="pg-ctrl"><button class="pg-b pg-prev" aria-label="Previous">◀</button><button class="pg-b big pg-play" aria-label="Slide show">▶</button><button class="pg-b pg-next" aria-label="Next">▶</button><span class="tb-sep"></span><button class="pg-b pg-open" data-tip="Open project">${ICON('info')}</button>${a.only ? `<button class="pg-b pg-all" data-tip="All pictures">All</button>` : ''}</div>`;
        const img = $('.pg-stage img', win.body), cap = $('.pg-cap', win.body);
        const show = (k) => { if (!shots.length) return; i = (k + shots.length) % shots.length; img.src = shots[i].src; cap.textContent = `${shots[i].project.name} · ${i + 1} of ${shots.length}`; win.setTitle(`${shots[i].project.name} - Photo Gallery`); $$('.pg-strip img', win.body).forEach(t => t.classList.toggle('on', +t.dataset.k === i)); $(`.pg-strip img[data-k="${i}"]`, win.body)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); win.flipThumb = shots[i].src; };
        $('.pg-prev', win.body).onclick = () => show(i - 1);
        $('.pg-next', win.body).onclick = () => show(i + 1);
        const play = $('.pg-play', win.body);
        const toggle = () => { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶'; } else { timer = setInterval(() => show(i + 1), 3000); play.textContent = '❚❚'; } };
        play.onclick = toggle;
        $('.pg-open', win.body).onclick = () => shots[i] && OS.open('project', { slug: shots[i].project.slug });
        $('.pg-all', win.body) && ($('.pg-all', win.body).onclick = () => build({ src: shots[i]?.src }));
        $$('.pg-strip img', win.body).forEach(t => t.onclick = () => show(+t.dataset.k));
        win.body.tabIndex = 0; win.body.onkeydown = (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); };
        show(i); if (a.slideshow) toggle();
      };
      win.rebuild = build; build(args);
    },
    reuse: (win, a) => win.rebuild(a),
  });

  /* ======================================================================
     About Me (document reader)
     ====================================================================== */
  OS.register('aboutme', {
    name: 'About Me.pdf', icon: ICON('doc', 'PDF'), w: 760, h: 680, minW: 340,
    title: 'About Me.pdf - Document Reader', single: () => 'aboutme',
    run(win, args) {
      const A = DV.about;
      win.body.innerHTML = `
        <div class="toolbar light"><button class="tb-btn rd-print">🖨 Print</button><button class="tb-btn rd-mail">${ICON('mail')} Email</button><span class="tb-sep" style="background:#b7c8da"></span><button class="tb-btn rd-zo">－</button><span class="rd-zoom">100%</span><button class="tb-btn rd-zi">＋</button><span style="flex:1"></span><span class="muted">Page 1 of 1</span></div>
        <div class="rd-wrap scroll"><div class="rd-page selectable">
          <div class="rd-head"><img src="${esc(A.photo)}" alt="Daniel Ionashku"><div><h1>${esc(A.name)}</h1><div class="rd-role">${esc(A.role)}</div><div class="rd-loc">${esc(A.location)}</div>
            <div class="rd-links">${A.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</div></div></div>
          ${A.bio.map(p => `<p>${esc(p)}</p>`).join('')}
          ${A.now?.length ? `<h2>Right now</h2><ul>${A.now.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          <h2 id="rd-exp">Experience</h2>
          ${A.experience.map(e => `<div class="rd-job"><div><b>${esc(e.role)}</b> · ${esc(e.company)}</div><span>${esc(e.dates)}</span><p>${esc(e.summary)}</p></div>`).join('')}
          <h2>Skills</h2><div>${A.skills.map(s => `<span class="pill">${esc(s)}</span>`).join('')}</div>
          ${A.tools?.length ? `<h2>How I work</h2><div>${A.tools.map(s => `<span class="pill">${esc(s)}</span>`).join('')}</div>` : ''}
          ${A.beyond ? `<h2>Beyond the screen</h2><p>${esc(A.beyond)}</p>` : ''}
          <div class="rd-foot">Built with Claude Code, too much nostalgia, and zero licensed Microsoft assets.</div>
        </div></div>`;
      let z = 1; const page = $('.rd-page', win.body); const sz = () => { page.style.zoom = z; $('.rd-zoom', win.body).textContent = Math.round(z * 100) + '%'; };
      $('.rd-zi', win.body).onclick = () => { z = Math.min(1.6, z + .1); sz(); };
      $('.rd-zo', win.body).onclick = () => { z = Math.max(.6, z - .1); sz(); };
      $('.rd-print', win.body).onclick = () => OS.alert('No printer found.<br><small class="muted">Daniel recommends saving a tree. He knows a tree company.</small>', 'info', 'Print');
      $('.rd-mail', win.body).onclick = () => OS.open('mail');
      if (args.section === 'experience') setTimeout(() => $('#rd-exp', win.body)?.scrollIntoView(), 60);
    },
    reuse: (win, a) => a.section === 'experience' && $('#rd-exp', win.body)?.scrollIntoView({ behavior: 'smooth' }),
  });

  /* ======================================================================
     Notepad
     ====================================================================== */
  /* ======================================================================
     User documents: visitors create .txt files on the desktop (kept in their
     browser) and can send any of them to Daniel.
     ====================================================================== */
  const FORM_URL = 'https://formsubmit.co/ajax/54084151bb7eebcd54f5f686ea7e731e';
  const loadDocs = () => { try { return JSON.parse(localStorage.getItem('dv-docs') || '[]'); } catch (e) { return []; } };
  let DOCS = loadDocs();
  const saveDocs = () => { try { localStorage.setItem('dv-docs', JSON.stringify(DOCS)); } catch (e) { } };
  const docById = (id) => DOCS.find(d => d.id === id);
  const uniqueName = (base) => { let n = base + '.txt', k = 2; while (DOCS.some(d => d.name === n)) n = `${base} (${k++}).txt`; return n; };
  OS.newTextDoc = ({ forDaniel = false } = {}) => {
    const d = { id: 'd' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), name: uniqueName(forDaniel ? 'Note for Daniel' : 'New Text Document'), text: forDaniel ? 'Hi Daniel,\n\n' : '', updated: Date.now(), forDaniel };
    DOCS.push(d); saveDocs(); OS.refreshDesktop(); OS.sound.pop();
    OS.open('notepad', { doc: d.id });
    return d;
  };
  OS.deleteDoc = (id) => { const d = docById(id); if (!d) return; DOCS = DOCS.filter(x => x !== d); saveDocs(); DV.recycle.unshift({ name: d.name, sub: 'Deleted by you', icon: 'notepad', why: d.text.slice(0, 200) || '(empty)' }); updateBin(); OS.sound.recycle(); OS.wins.filter(w => w.key === 'notepad:' + id).forEach(w => w.close()); };
  OS.prompt = (title, label, value, ok) => {
    const win = OS.createWindow({ title, icon: ICON('notepad'), w: 360, h: 170, noMax: true, noMin: true, noResize: true });
    win.isDialog = true;
    win.body.innerHTML = `<div class="pad"><label style="display:block;margin-bottom:6px">${esc(label)}</label><input class="dlg-in" style="width:100%;height:24px;border:1px solid #7e95ad;padding:0 6px;font:inherit"></div><div class="dlg-bar"><button class="vbtn primary">OK</button><button class="vbtn">Cancel</button></div>`;
    const inp = $('.dlg-in', win.body); inp.value = value || '';
    const [okB, cancel] = $$('.dlg-bar .vbtn', win.body);
    const go = () => { const v = inp.value.trim(); if (!v) return; win.close(); ok(v); };
    okB.onclick = go; cancel.onclick = () => win.close(); inp.onkeydown = (e) => e.key === 'Enter' && go();
    setTimeout(() => { inp.focus(); inp.select(); }, 60);
  };
  OS.renameDoc = (id) => { const d = docById(id); if (!d) return; OS.prompt('Rename', 'New name:', d.name, (v) => { d.name = /\.txt$/i.test(v) ? v : v + '.txt'; saveDocs(); OS.refreshDesktop(); OS.wins.filter(w => w.key === 'notepad:' + id).forEach(w => w.setTitle(d.name + ' - Notepad')); }); };

  /* Delivers a message to Daniel's inbox. Resolves true on success. */
  OS.sendToDaniel = async ({ subject, message, name, email }) => {
    const body = { _subject: subject, name: name || 'Anonymous visitor', email: email || undefined, message, _template: 'table', _captcha: 'false', page: location.href };
    if (email) body._replyto = email;
    try {
      const r = await fetch(FORM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      return r.ok && String(j.success) === 'true';
    } catch (e) { return false; }
  };
  OS.sendDialog = ({ subject, message, onSent, title = 'Send to Daniel' }) => {
    if (!message.trim()) { OS.alert('This note is empty. Write something first, then send it.', 'info', title); return; }
    const win = OS.createWindow({ title, icon: ICON('mail'), w: 440, h: 300, noMax: true, noResize: true });
    win.isDialog = true;
    let who = {}; try { who = JSON.parse(localStorage.getItem('dv-who') || '{}'); } catch (e) { }
    win.body.innerHTML = `<div class="pad send-dlg"><div class="send-head">${ICON('mail')}<div><b>Send this to Daniel's inbox</b><br><span class="muted">He reads every one. Add your email if you'd like a reply.</span></div></div>
      <div class="m-fields" style="background:none;border:0;padding:8px 0"><label>Your name:</label><input class="s-name" placeholder="Optional"><label>Your email:</label><input class="s-email" type="email" placeholder="Optional, for a reply"></div>
      <div class="send-prev selectable"></div><input class="s-hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"></div>
      <div class="dlg-bar"><span class="s-status muted"></span><button class="vbtn primary s-go">Send</button><button class="vbtn s-cancel">Cancel</button></div>`;
    $('.s-name', win.body).value = who.name || ''; $('.s-email', win.body).value = who.email || '';
    $('.send-prev', win.body).textContent = message.length > 400 ? message.slice(0, 400) + '…' : message;
    $('.s-cancel', win.body).onclick = () => win.close();
    $('.s-go', win.body).onclick = async () => {
      if ($('.s-hp', win.body).value) { win.close(); return; }
      const name = $('.s-name', win.body).value.trim(), email = $('.s-email', win.body).value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $('.s-status', win.body).textContent = 'That email looks off.'; return; }
      try { localStorage.setItem('dv-who', JSON.stringify({ name, email })); } catch (e) { }
      const btn = $('.s-go', win.body); btn.disabled = true; $('.s-status', win.body).innerHTML = '<span class="spinner sm"></span> Sending…';
      const ok = await OS.sendToDaniel({ subject, message, name, email });
      if (ok) { win.close(); OS.sound.ding(); OS.balloon('Sent to Daniel', 'Your note is in his inbox. Thanks for stopping by!', { icon: 'mail' }); onSent && onSent(); }
      else { btn.disabled = false; $('.s-status', win.body).innerHTML = `Couldn't send. <a href="mailto:${esc(DV.about.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}">Email it instead</a>`; }
    };
    setTimeout(() => $('.s-name', win.body).focus(), 60);
  };

  /* ======================================================================
     Notepad
     ====================================================================== */
  OS.register('notepad', {
    name: 'Notepad', icon: 'notepad', w: 620, h: 460,
    title: (a) => (a.doc ? (docById(a.doc)?.name || 'Untitled') : a.file === 'ideas' ? 'ideas-for-later.txt' : 'readme.txt') + ' - Notepad',
    single: (a) => 'notepad:' + (a.doc || a.file || 'readme'),
    run(win, a) {
      if (a.blank) { win.close(); OS.newTextDoc(); return; }
      const doc = a.doc ? docById(a.doc) : null;
      const text = doc ? doc.text : a.file === 'ideas' ? DV.notes.ideas : DV.notes.readme;
      win.body.innerHTML = `<div class="menubar"><span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span></div><textarea class="np selectable" spellcheck="${doc ? 'true' : 'false'}" aria-label="Text" ${doc ? 'placeholder="Type anything. It saves automatically on this computer."' : ''}></textarea>
        ${doc ? `<div class="np-bar"><span>${ICON('info')}<span class="np-saved">Saved on this computer.</span> Want Daniel to read it?</span><button class="vbtn primary np-send">${ICON('mail')} Send to Daniel</button></div>` : ''}
        <div class="statusbar"><span class="np-pos">Ln 1, Col 1</span></div>`;
      const ta = $('textarea', win.body); ta.value = text;
      const pos = () => { const v = ta.value.slice(0, ta.selectionStart).split('\n'); $('.np-pos', win.body).textContent = `Ln ${v.length}, Col ${v[v.length - 1].length + 1}`; };
      ta.onkeyup = ta.onclick = pos;
      let saveT;
      const save = () => { if (!doc) return; doc.text = ta.value; doc.updated = Date.now(); saveDocs(); const sv = $('.np-saved', win.body); if (sv) sv.textContent = 'Saved on this computer.'; };
      if (doc) {
        ta.oninput = () => { $('.np-saved', win.body).textContent = 'Saving…'; clearTimeout(saveT); saveT = setTimeout(save, 400); };
        win.onClose.push(save);
        const send = () => { save(); OS.sendDialog({ subject: `Note from Daniel Vista: ${doc.name}`, message: doc.text, onSent: () => { doc.sentAt = Date.now(); saveDocs(); } }); };
        $('.np-send', win.body).onclick = send; win.sendDoc = send;
      }
      let statusOn = true;
      const notSaved = () => OS.alert('This file is part of the portfolio, so it can\'t be changed. Right-click the desktop and choose <b>New &gt; Text Document</b> to write your own.', 'info', 'Notepad');
      const menus = {
        File: () => [{ label: 'New', act: () => OS.newTextDoc() }, { label: 'Save', act: () => doc ? (save(), OS.balloon('Saved', `${esc(doc.name)} is saved on this computer.`)) : notSaved() }, ...(doc ? [{ label: 'Rename…', act: () => OS.renameDoc(doc.id) }, { label: '<b>Send to Daniel…</b>', icon: 'mail', act: () => win.sendDoc() }, '-', { label: 'Delete', act: () => OS.deleteDoc(doc.id) }] : []), '-', { label: 'Exit', act: () => win.close() }],
        Edit: () => [{ label: 'Select All', act: () => { ta.focus(); ta.select(); pos(); } }, { label: 'Time/Date', act: () => { ta.setRangeText(new Date().toLocaleString(), ta.selectionStart, ta.selectionEnd, 'end'); ta.focus(); pos(); doc && ta.oninput(); } }],
        Format: () => [{ label: 'Word Wrap' + (ta.style.whiteSpace === 'pre' ? '' : ' ✓'), act: () => { ta.style.whiteSpace = ta.style.whiteSpace === 'pre' ? 'pre-wrap' : 'pre'; } }, { label: 'Font…' + (ta.classList.contains('np-big') ? ' (Large)' : ''), act: () => { ta.classList.toggle('np-big'); } }],
        View: () => [{ label: 'Status Bar' + (statusOn ? ' ✓' : ''), act: () => { statusOn = !statusOn; $('.statusbar', win.body).style.display = statusOn ? '' : 'none'; } }],
        Help: () => [{ label: 'About Notepad', act: () => OS.alert('Notepad<br>Version 6.0 (Build 6000)<br>© Daniel Ionashku. All feelings reserved.', 'info', 'About Notepad') }],
      };
      $$('.menubar span', win.body).forEach(s => s.onclick = () => { const r = s.getBoundingClientRect(); OS.menu(r.left, r.bottom, menus[s.textContent]()); });
      setTimeout(() => { const at = doc ? ta.value.length : 0; ta.setSelectionRange(at, at); ta.focus({ preventScroll: true }); if (!doc) ta.scrollTop = 0; pos(); }, 50);
    },
  });

  /* ======================================================================
     Mail
     ====================================================================== */
  OS.register('mail', {
    name: 'Mail', icon: 'mail', w: 620, h: 500, single: () => 'mail', title: 'New Message - Mail',
    run(win) {
      const A = DV.about;
      let who = {}; try { who = JSON.parse(localStorage.getItem('dv-who') || '{}'); } catch (e) { }
      win.body.innerHTML = `<div class="toolbar light"><button class="tb-btn m-send">${ICON('mail')} Send</button><span class="tb-sep" style="background:#b7c8da"></span>${A.links.map(l => `<a class="tb-btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>
        <div class="m-fields"><label>To:</label><input value="${esc(A.name)}" readonly><label>From:</label><input class="m-name" placeholder="Your name"><label>Reply to:</label><input class="m-email" type="email" placeholder="you@example.com (optional)"><label>Subject:</label><input class="m-subj" value="Hey Daniel, saw your Vista portfolio"></div>
        <textarea class="m-body selectable" placeholder="Write your message…">Hi Daniel,\n\n</textarea>
        <div class="statusbar"><span class="m-st">Goes straight to Daniel's inbox</span></div>`;
      $('.m-name', win.body).value = who.name || ''; $('.m-email', win.body).value = who.email || '';
      $('.m-send', win.body).onclick = async () => {
        const msg = $('.m-body', win.body).value, name = $('.m-name', win.body).value.trim(), email = $('.m-email', win.body).value.trim();
        if (msg.replace(/^Hi Daniel,\s*/, '').trim().length < 2) { OS.alert('Write a message first.', 'info', 'Mail'); return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { OS.alert('That reply-to email looks off.', 'info', 'Mail'); return; }
        try { localStorage.setItem('dv-who', JSON.stringify({ name, email })); } catch (e) { }
        $('.m-st', win.body).textContent = 'Sending…'; $('.m-send', win.body).disabled = true;
        const ok = await OS.sendToDaniel({ subject: $('.m-subj', win.body).value || 'Message from Daniel Vista', message: msg, name, email });
        if (ok) { win.close(); OS.sound.ding(); OS.balloon('Message sent', 'It\'s in Daniel\'s inbox. Thanks for reaching out!', { icon: 'mail' }); }
        else { $('.m-send', win.body).disabled = false; $('.m-st', win.body).innerHTML = `Couldn't send. <a href="mailto:${esc(A.email)}">Email Daniel directly</a>`; }
      };
    },
  });

  /* ======================================================================
     Command Prompt (UAC-gated, for laughs)
     ====================================================================== */
  OS.register('cmd', {
    name: 'Command Prompt', icon: 'cmd', w: 680, h: 420, uac: true, publisher: 'Daniel Ionashku (Verified publisher)', uacNote: 'This program can make changes to how impressed you are.',
    single: () => 'cmd', title: 'Administrator: Command Prompt',
    run(win) {
      win.body.classList.add('cmdw');
      win.body.innerHTML = `<div class="cmd-out selectable"></div>`;
      const out = $('.cmd-out', win.body);
      const print = (s = '') => { const d = h('div'); d.textContent = s; out.appendChild(d); };
      let line, hist = [], hi = 0, launched = false;
      const prompt = () => {
        line = h('div', { class: 'cmd-line' }, `<span>C:\\Users\\Daniel&gt;</span><input spellcheck="false" autocomplete="off" aria-label="Command">`);
        out.appendChild(line); const inp = $('input', line);
        // Don't steal focus back from a window the last command just opened.
        if (!launched) inp.focus(); launched = false; out.scrollTop = out.scrollHeight;
        inp.onkeydown = (e) => {
          if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); }
          if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; }
          if (e.key !== 'Enter') return;
          const v = inp.value.trim(); inp.replaceWith(Object.assign(h('span'), { textContent: v })); if (v) { hist.push(v); hi = hist.length; }
          run(v); prompt();
        };
      };
      const cmds = {
        help: () => ['Commands:', '  projects        list everything Daniel built', '  open <name>     open a project (e.g. open fiyr)', '  whoami          who is this guy', '  contact         ways to reach Daniel', '  videos          open the Media Player', '  dir             list this folder', '  ver             version info', '  color           change the colors', '  cls             clear the screen', '  exit            close this window'].forEach(l => print(l)),
        projects: () => DV.projects.forEach(p => print(`  ${p.slug.padEnd(18)} ${p.name}  ·  ${p.tagline}`)),
        dir: () => { print(' Volume in drive C is IDEAS'); print(' Directory of C:\\Users\\Daniel\\Projects'); print(''); DV.projects.forEach(p => print(`10/31/2026  09:00 PM    <DIR>          ${p.name}`)); print(`               ${DV.projects.length} Dir(s)   0 bytes free (it's all ideas)`); },
        whoami: () => { print(`${DV.about.name}`); print(DV.about.role); print(DV.about.bio[0]); },
        contact: () => DV.about.links.forEach(l => print(`  ${l.label.padEnd(10)} ${l.url}`)),
        ver: () => { print(''); print('Daniel Vista [Version 6.0.2026]'); print('Copyright (c) 2026 Daniel Ionashku. All rights reserved.'); },
        cls: () => { out.innerHTML = ''; },
        exit: () => win.close(),
        videos: () => { launched = true; OS.open('media'); },
        color: () => { win.body.classList.toggle('green'); },
        sudo: () => print('Nice try. This is Windows. Did you mean to click "Continue" on a UAC prompt?'),
        format: () => print('Format C: denied. Those are Daniel\'s ideas.'),
        hello: () => print('Hello! Type "help".'),
        ls: () => { print('\'ls\' is not recognized… but fine, here you go:'); cmds.dir(); },
      };
      const run = (v) => {
        if (!v) return; const [c, ...rest] = v.split(/\s+/); const arg = rest.join(' ').toLowerCase();
        const k = c.toLowerCase();
        if (k === 'open' || k === 'start') {
          if (!arg) { print(`Usage: ${k} <name>   (type "projects" for the list)`); return; }
          const p = DV.projects.find(x => x.slug === arg || x.name.toLowerCase() === arg) || DV.projects.find(x => x.name.toLowerCase().includes(arg) || x.slug.includes(arg));
          if (p) { print(`Opening ${p.name}…`); launched = true; OS.open('project', { slug: p.slug }); } else print(`The system cannot find the project '${arg}'.`);
          return;
        }
        if (cmds[k]) return cmds[k]();
        print(`'${c}' is not recognized as an internal or external command,`); print('operable program or batch file. Type "help".');
      };
      print('Daniel Vista [Version 6.0.2026]'); print('Copyright (c) 2026 Daniel Ionashku. All rights reserved.'); print(''); print('Type "help" to see what this thing can do.'); print('');
      prompt(); win.body.onclick = () => $('input', out)?.focus();
    },
  });

  /* ======================================================================
     Recycle Bin
     ====================================================================== */
  OS.register('recycle', {
    name: 'Recycle Bin', icon: ICON('recycle', true), w: 700, h: 440, single: () => 'recycle',
    run(win) {
      const render = () => {
        win.body.innerHTML = `<div class="toolbar"><button class="tb-btn rb-empty">Empty the Recycle Bin</button><button class="tb-btn rb-restore">Restore all items</button></div>
          <div class="ex-content">${DV.recycle.length ? DV.recycle.map(r => `<div class="ex-item" data-tip="${esc(r.why)}"><div class="thumb">${OS.iconHTML(r.icon || 'doc')}</div><div class="nm">${esc(r.name)}</div><div class="sub">${esc(r.sub || '')}</div></div>`).join('') : '<div class="ex-empty">The Recycle Bin is empty. Every idea left in here got shipped.</div>'}</div>
          <div class="statusbar"><span>${DV.recycle.length} items</span></div>`;
        $$('.ex-item', win.body).forEach((el, i) => el.ondblclick = () => OS.alert(`<b>${esc(DV.recycle[i].name)}</b><br>${esc(DV.recycle[i].why)}`, 'info', 'Recycle Bin'));
        $('.rb-empty', win.body).onclick = () => OS.alert('Are you sure you want to permanently delete these ' + DV.recycle.length + ' items?', 'info', 'Delete Multiple Items', [{ label: 'Yes', primary: true, act: () => { OS.sound.recycle(); DV.recycle.length = 0; render(); updateBin(); } }, { label: 'No' }]);
        $('.rb-restore', win.body).onclick = () => OS.alert('Restoring would undo Daniel\'s growth as a person. Request denied.', 'info', 'Restore');
      };
      render();
    },
  });
  const updateBin = () => { const d = OS.desktopItems.find(x => x.id === 'recycle'); if (d) { d.icon = ICON('recycle', DV.recycle.length > 0); OS.refreshDesktop(); } };

  /* ======================================================================
     FIRE calculator (FIYR tie-in)
     ====================================================================== */
  OS.register('calc', {
    name: 'FIRE Calculator', icon: 'calc', w: 330, h: 470, noMax: true, noResize: true, single: () => 'calc',
    run(win) {
      win.body.classList.add('calcw');
      win.body.innerHTML = `<div class="menubar"><span>View</span><span>Help</span></div>
        <div class="calc-body">
          <div class="calc-disp"><small>Years to financial independence</small><b class="calc-out">--</b><span class="calc-sub"></span></div>
          <label>Yearly spending <input type="number" class="c-spend" value="50000" min="0" step="1000"></label>
          <label>Invested so far <input type="number" class="c-have" value="40000" min="0" step="1000"></label>
          <label>Saving per year <input type="number" class="c-save" value="20000" min="0" step="1000"></label>
          <label>Real return % <input type="number" class="c-ret" value="5" min="0" max="15" step=".5"></label>
          <div class="calc-keys"><button class="vbtn primary c-go">=</button><button class="vbtn c-fiyr">Try the real thing: FIYR</button></div>
          <div class="muted" style="font-size:10.5px;margin-top:6px">Uses the 4% rule (25× spending). For fun, not financial advice.</div>
        </div>`;
      const g = (c) => +$(c, win.body).value || 0;
      const calc = () => {
        const target = g('.c-spend') * 25, r = g('.c-ret') / 100, save = g('.c-save'); let bal = g('.c-have'), y = 0;
        while (bal < target && y < 100) { bal = bal * (1 + r) + save; y++; }
        $('.calc-out', win.body).textContent = y >= 100 ? '∞' : y; $('.calc-sub', win.body).textContent = `FI number: $${Math.round(target).toLocaleString()}`;
      };
      $$('input', win.body).forEach(i => i.oninput = calc); $('.c-go', win.body).onclick = calc; calc();
      $('.c-fiyr', win.body).onclick = () => OS.open('project', { slug: 'fiyr' });
      $$('.menubar span', win.body).forEach(s => s.onclick = () => OS.alert('FIRE Calculator<br>A tiny cousin of the FIRE planner inside FIYR.', 'info', 'About'));
    },
  });

  /* ======================================================================
     Personalize + calendar
     ====================================================================== */
  OS.register('personalize', {
    name: 'Personalize', icon: 'paint', w: 560, h: 380, single: () => 'personalize', title: 'Desktop Background',
    run(win) {
      win.body.innerHTML = `<div class="pad"><h1 class="vista-h1">Choose a desktop background</h1><p class="muted">Click a picture to make it your desktop background.</p><div class="wp-grid">${OS.wallpapers.map(([c, n]) => `<div class="wp-opt" data-c="${c}"><div class="${c}"></div><span>${n}</span></div>`).join('')}</div>
        <h2 class="vista-h2">Sounds</h2><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" class="snd" ${OS.muted ? '' : 'checked'}> Play Daniel Vista sounds</label></div>`;
      const mark = () => $$('.wp-opt', win.body).forEach(o => o.classList.toggle('on', $('#wallpaper').classList.contains(o.dataset.c)));
      $$('.wp-opt', win.body).forEach(o => o.onclick = () => { OS.setWallpaper(o.dataset.c); mark(); });
      $('.snd', win.body).onchange = (e) => { OS.muted = !e.target.checked; };
      mark();
    },
  });
  OS.register('calendar', {
    name: 'Date and Time', icon: 'calc', w: 300, h: 300, noMax: true, noResize: true, single: () => 'cal',
    run(win) {
      const d = new Date(), y = d.getFullYear(), m = d.getMonth(); const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
      win.body.innerHTML = `<div class="pad cal"><div class="cal-h">${d.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div><div class="cal-g">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(x => `<b>${x}</b>`).join('')}${'<span></span>'.repeat(first)}${Array.from({ length: days }, (_, i) => `<span class="${i + 1 === d.getDate() ? 'on' : ''}">${i + 1}</span>`).join('')}</div><div class="muted" style="margin-top:8px;text-align:center">${d.toLocaleTimeString()}</div></div>`;
    },
  });

  /* ======================================================================
     Welcome Center (first window after login)
     ====================================================================== */
  OS.register('welcome', {
    name: 'Welcome Center', icon: 'computer', w: 760, h: 520, single: () => 'welcome',
    run(win) {
      const A = DV.about; const feat = DV.featured.map(s => P[s]).filter(Boolean);
      win.body.innerHTML = `<div class="wc scroll">
        <div class="wc-top"><img src="${esc(A.photo)}" alt=""><div><h1>${esc(A.name)}</h1><div>${esc(A.role)}</div><div class="muted">${esc(A.headline)}</div><a href="#" class="wc-more">Show more details</a></div></div>
        <div class="wc-sec"><h2>Get started with Daniel Vista</h2><div class="wc-grid">
          ${feat.map(p => `<div class="wc-tile" data-s="${p.slug}">${p.icon ? `<img src="${esc(p.icon)}" alt="">` : ICON(p.glyph || 'globe')}<div><b>${esc(p.name)}</b><small>${esc(p.tagline)}</small></div></div>`).join('')}
          <div class="wc-tile" data-a="projects">${ICON('folderStar')}<div><b>Browse all projects</b><small>Every app, site and tool in folders</small></div></div>
          <div class="wc-tile" data-a="videos">${ICON('media')}<div><b>Watch the videos</b><small>Promo films and demos</small></div></div>
          <div class="wc-tile" data-a="about">${ICON('doc', 'PDF')}<div><b>About Me.pdf</b><small>Bio, experience, contact</small></div></div>
        </div></div>
        <label class="wc-foot"><input type="checkbox" checked> Run at startup <span class="muted" style="margin-left:auto">Tip: right-click the desktop, or click Flip 3D in Quick Launch, next to Start</span></label></div>`;
      $$('.wc-tile', win.body).forEach(t => t.onclick = () => { const a = t.dataset.a; if (t.dataset.s) OS.open('project', { slug: t.dataset.s }); else if (a === 'projects') OS.explore('Projects'); else if (a === 'videos') OS.open('media'); else OS.open('aboutme'); });
      $('.wc-more', win.body).onclick = (e) => { e.preventDefault(); OS.open('aboutme'); };
    },
  });

  /* ======================================================================
     Desktop, start menu, quick launch, sidebar
     ====================================================================== */
  const projOpen = (s) => () => OS.open('project', { slug: s });
  OS.desktopItems = [
    { id: 'computer', label: 'Computer', icon: 'computer', open: () => OS.explore('Computer') },
    { id: 'projects', label: 'Projects', icon: 'folderStar', open: () => OS.explore('Projects') },
    { id: 'about', label: 'About Me.pdf', icon: ICON('doc', 'PDF'), open: () => OS.open('aboutme'), desc: 'Bio, photo, experience.' },
    ...DV.desktop.map(s => P[s]).filter(Boolean).map(p => ({ id: p.slug, label: p.name, thumb: p.icon, icon: p.glyph || 'globe', shortcut: true, open: projOpen(p.slug), desc: p.tagline, menu: p.url ? [{ label: 'Open in web browser', icon: 'globe', act: () => OS.open('browser', { url: p.url }) }] : [] })),
    { id: 'videos', label: 'Videos', icon: 'folderVideo', open: () => OS.explore('Videos') },
    { id: 'media', label: 'Media Player', icon: 'media', shortcut: true, open: () => OS.open('media') },
    { id: 'readme', label: 'readme.txt', icon: 'notepad', open: () => OS.open('notepad') },
    { id: 'internet', label: 'Internet', icon: 'globe', shortcut: true, open: () => OS.open('browser') },
    { id: 'cmd', label: 'Command Prompt', icon: 'cmd', shortcut: true, open: () => OS.open('cmd') },
    { id: 'calc', label: 'FIRE Calculator', icon: 'calc', shortcut: true, open: () => OS.open('calc') },
    { id: 'mail', label: 'Contact Me', icon: 'mail', shortcut: true, open: () => OS.open('mail') },
    { id: 'note', label: 'Leave Daniel a note', icon: 'notepad', shortcut: true, open: () => OS.newTextDoc({ forDaniel: true }), desc: 'Write anything. It saves on this computer, and you can send it to Daniel.' },
    { id: 'recycle', label: 'Recycle Bin', icon: ICON('recycle', true), open: () => OS.open('recycle') },
  ];
  const TYPE_RANK = { system: 0, folder: 1, project: 2, doc: 3, app: 4, user: 5 };
  const typeOf = (d) => d.user ? 'user' : ['computer', 'recycle'].includes(d.id) ? 'system' : ['projects', 'videos'].includes(d.id) ? 'folder' : P[d.id] ? 'project' : ['about', 'readme'].includes(d.id) ? 'doc' : 'app';
  try { OS.desktopSort = localStorage.getItem('dv-sort') || 'default'; } catch (e) { OS.desktopSort = 'default'; }
  OS.refreshDesktop = () => {
    let items = [...OS.desktopItems, ...DOCS.map(doc => ({ id: doc.id, user: true, label: doc.name, icon: 'notepad', updated: doc.updated, desc: 'A note you wrote. It lives in this browser until you send it.', open: () => OS.open('notepad', { doc: doc.id }),
      menu: [{ label: '<b>Send to Daniel…</b>', icon: 'mail', act: () => OS.open('notepad', { doc: doc.id }).sendDoc?.() }, { label: 'Rename', act: () => OS.renameDoc(doc.id) }, { label: 'Delete', act: () => OS.deleteDoc(doc.id) }] }))];
    const mode = OS.desktopSort;
    if (mode === 'name') items.sort((a, b) => a.label.localeCompare(b.label));
    else if (mode === 'type') items.sort((a, b) => TYPE_RANK[typeOf(a)] - TYPE_RANK[typeOf(b)] || a.label.localeCompare(b.label));
    else if (mode === 'date') items.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    OS.renderDesktop(items);
  };
  OS.setDesktopSort = (v) => {
    OS.desktopSort = v; try { localStorage.setItem('dv-sort', v); } catch (e) { }
    const box = $('#icons'); box.classList.add('resorting');
    setTimeout(() => { OS.refreshDesktop(); box.classList.remove('resorting'); }, 140);
  };
  const appEntry = (p) => ({ label: p.name, sub: p.tagline, thumb: p.icon, icon: p.glyph || 'globe', pic: p.icon, open: projOpen(p.slug), keywords: [p.slug, p.category, p.description, (p.stack || []).join(' ')].join(' ') });
  OS.startConfig = {
    pinned: () => [
      { label: 'Internet', sub: 'Dahoo! + all my live sites', icon: 'globe', open: () => OS.open('browser'), bold: true },
      { label: 'Media Player', sub: 'Promo films + demos', icon: 'media', open: () => OS.open('media'), bold: true },
      '-',
      ...DV.featured.map(s => P[s]).filter(Boolean).map(appEntry),
      '-',
      { label: 'Welcome Center', icon: 'computer', open: () => OS.open('welcome') },
    ],
    all: () => [...DV.projects.slice().sort((a, b) => a.name.localeCompare(b.name)).map(appEntry), '-', ...['cmd', 'calc', 'notepad', 'photos', 'mail', 'personalize'].map(id => ({ label: OS.apps[id].name, icon: OS.apps[id].icon, open: () => OS.open(id) }))],
    searchable: () => [...DV.projects.map(appEntry), ...['browser', 'media', 'cmd', 'calc', 'notepad', 'photos', 'mail', 'personalize', 'aboutme', 'welcome', 'recycle'].map(id => ({ label: OS.apps[id].name, icon: OS.apps[id].icon, open: () => OS.open(id), keywords: id }))],
    right: [
      { label: 'Daniel', bold: true, open: () => OS.open('aboutme'), pic: DV.about.photo },
      { label: 'Documents', open: () => OS.explore('Documents') },
      { label: 'Pictures', open: () => OS.explore('Pictures') },
      { label: 'Videos', open: () => OS.explore('Videos') },
      '-',
      { label: 'Projects', open: () => OS.explore('Projects'), arrow: true },
      ...DV.folderOrder.map(id => ({ label: FOLDERS[id].name, open: () => OS.explore(id) })),
      '-',
      { label: 'Computer', open: () => OS.explore('Computer') },
      { label: 'Contact Me', open: () => OS.open('mail') },
      { label: 'Personalize', open: () => OS.open('personalize') },
      { label: 'Help and Support', open: () => OS.alert('Double-click icons to open them. Drag windows by their title bars. The Start orb (bottom left) has search.<br><br>Flip 3D: the stacked-windows button in Quick Launch, next to Start, or Ctrl+Alt+F<br>Alt+W: close the active window', 'info', 'Help and Support') },
    ],
  };
  OS.quickLaunch = [
    { label: 'Show desktop', icon: 'showdesk', act: () => $('#show-desktop').click() },
    { label: 'Switch between windows (Flip 3D)', icon: 'flip', act: () => OS.flip3d() },
    { label: 'Internet', icon: 'globe', act: () => OS.open('browser') },
    ...DV.featured.slice(0, 3).map(s => P[s]).filter(Boolean).map(p => ({ label: p.name, icon: p.icon || p.glyph || 'globe', act: projOpen(p.slug) })),
  ];

  const buildSidebar = () => {
    const sb = $('#sidebar');
    // One landscape-first picture per project; portrait phone shots go to the back so the desktop never opens on one.
    const gadgetShot = (p) => (p.screenshots || []).find(s => !isPortraitSrc(s)) || shotOf(p);
    const shots = DV.projects.filter(p => shotOf(p)).map(p => ({ src: gadgetShot(p), p })).sort((x, y) => isPortraitSrc(x.src) - isPortraitSrc(y.src));
    sb.innerHTML = `
      <div class="gadget gadget-clock" aria-label="Clock"><div class="face">${Array.from({ length: 12 }, (_, i) => `<div class="tick" style="transform:rotate(${i * 30}deg)"></div>`).join('')}<div class="brand">DANIEL</div><div class="hand h"></div><div class="hand m"></div><div class="hand s"></div><div class="pin"></div></div></div>
      ${shots.length ? `<div class="gadget gadget-box gadget-slideshow" data-tip="Open in Photo Gallery"><div class="frame"><img alt=""><img alt="" style="opacity:0"></div><div class="cap"></div></div>` : ''}
      <div class="gadget gadget-box"><h4>Ship-o-meter <span>●</span></h4><div class="meter">
        <div><div class="dial"><div class="needle n1"></div><b class="v1">0%</b></div><div class="lbl">Ideas</div></div>
        <div><div class="dial"><div class="needle n2"></div><b class="v2">0%</b></div><div class="lbl">Shipped</div></div></div></div>
      <div class="gadget gadget-note">${esc(DV.notes.sticky)}</div>`;
    const clock = () => { const d = new Date(); const s = d.getSeconds(), m = d.getMinutes() + s / 60, hr = (d.getHours() % 12) + m / 60; $('.gadget-clock .h').style.transform = `rotate(${hr * 30}deg)`; $('.gadget-clock .m').style.transform = `rotate(${m * 6}deg)`; $('.gadget-clock .s').style.transform = `rotate(${s * 6}deg)`; };
    clock(); setInterval(clock, 1000);
    if (shots.length) {
      let k = 0, flip = 0, shown = shots[0]; const imgs = $$('.gadget-slideshow img'); imgs[0].src = shots[0].src; $('.gadget-slideshow .cap').textContent = shots[0].p.name;
      setInterval(() => { k = (k + 1) % shots.length; const next = imgs[1 - flip]; const cur = shots[k]; next.onload = () => { if (shots[k] !== cur) return; next.style.opacity = 1; imgs[flip].style.opacity = 0; flip = 1 - flip; $('.gadget-slideshow .cap').textContent = cur.p.name; shown = cur; }; next.src = cur.src; }, 5000);
      $('.gadget-slideshow').onclick = () => OS.open('photos', { src: shown.src });
    }
    const meter = () => { const a = 88 + Math.random() * 12, b = 55 + Math.random() * 40; $('.n1').style.transform = `rotate(${-120 + a * 2.4}deg)`; $('.n2').style.transform = `rotate(${-120 + b * 2.4}deg)`; $('.v1').textContent = Math.round(a) + '%'; $('.v2').textContent = Math.round(b) + '%'; };
    meter(); setInterval(meter, 2500);
  };

  /* ======================================================================
     Boot
     ====================================================================== */
  OS.buildShell();
  OS.refreshDesktop();
  buildSidebar();
  OS.onFirstLogin = () => {
    const q = new URLSearchParams(location.search);
    if (q.get('open') && P[q.get('open')]) OS.open('project', { slug: q.get('open') });
    else if (!OS.isMobile()) OS.open('welcome');
    setTimeout(() => OS.balloon('Welcome to Daniel Vista', DV.notes.balloon, { onClick: () => OS.explore('Projects') }), 1400);
  };
  OS.boot();
})();
