/* Daniel Vista — window manager, shell, boot + login.  Apps live in apps.js and register via OS.register(). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); } if (html) e.innerHTML = html; return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isMobile = () => window.innerWidth <= 720;
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const OS = window.OS = {
    apps: {}, wins: [], z: 10, seq: 0, $, $$, h, esc, isMobile, isTouch,
    register(id, def) { this.apps[id] = { id, ...def }; },
  };

  /* ---------------- icons ---------------- */
  OS.iconHTML = (icon, cls = '') => {
    if (!icon) return ICON('doc');
    if (typeof icon === 'string' && icon.trim().startsWith('<svg')) return icon;
    if (typeof icon === 'string' && ICONS[icon]) return ICON(icon);
    return `<img src="${esc(icon)}" class="${cls}" alt="" loading="lazy">`;
  };

  /* ---------------- sound ---------------- */
  let actx;
  const ac = () => (actx ||= new (window.AudioContext || window.webkitAudioContext)());
  OS.muted = false;
  OS.tone = (freqs, { dur = 0.5, type = 'sine', gain = 0.08, spread = 0.09, attack = 0.02 } = {}) => {
    if (OS.muted) return;
    try {
      const c = ac(), t0 = c.currentTime;
      freqs.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = t0 + i * spread;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
      });
    } catch (e) { /* audio blocked */ }
  };
  OS.sound = {
    startup: () => { OS.tone([261.6, 392, 523.3, 659.3, 784], { dur: 2.6, gain: 0.05, spread: 0.18, attack: 0.25 }); OS.tone([130.8, 196], { dur: 3, gain: 0.04, spread: 0.3, attack: 0.6, type: 'triangle' }); },
    ding: () => OS.tone([880, 1318.5], { dur: 0.5, gain: 0.06, spread: 0.08 }),
    error: () => OS.tone([523.3, 392], { dur: 0.35, gain: 0.07, spread: 0.12, type: 'triangle' }),
    pop: () => OS.tone([1046.5], { dur: 0.12, gain: 0.035 }),
    uac: () => OS.tone([659.3, 987.8], { dur: 0.7, gain: 0.06, spread: 0.15 }),
    recycle: () => OS.tone([300, 200, 140], { dur: 0.25, gain: 0.05, spread: 0.06, type: 'sawtooth' }),
  };

  /* ---------------- windows ---------------- */
  const area = () => { const d = $('#desktop').getBoundingClientRect(); return { w: d.width, h: d.height }; };

  OS.createWindow = function (o) {
    if (o.key) { const ex = OS.wins.find(w => w.key === o.key); if (ex) { ex.restore(); ex.focus(); if (o.reuse) o.reuse(ex); return ex; } }
    const A = area();
    const w = Math.min(o.w || 720, A.w - 20), hgt = Math.min(o.h || 480, A.h - 20);
    const off = isMobile() ? 0 : (OS.seq % 8) * 26;
    let x = o.x ?? Math.round((A.w - w) / 2 - 90 + off), y = o.y ?? Math.round((A.h - hgt) / 2 - 50 + off);
    x = Math.max(8, Math.min(x, A.w - w - 8)); y = Math.max(6, Math.min(y, A.h - hgt - 6));
    const id = 'w' + (++OS.seq);
    const el = h('div', { class: 'win', id, role: 'dialog', 'aria-label': o.title || '' });
    el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${hgt}px`;
    el.innerHTML = `
      <div class="win-titlebar"><span class="win-icon">${OS.iconHTML(o.icon)}</span><div class="win-title">${esc(o.title)}</div>
        <div class="win-buttons">${o.noMin ? '' : `<button class="b-min" title="Minimize">${ICON('min')}</button>`}${o.noMax ? '' : `<button class="b-max" title="Maximize">${ICON('max')}</button>`}<button class="b-close" title="Close">${ICON('close')}</button></div></div>
      <div class="win-body ${o.bodyClass || ''}"></div>
      ${o.noResize ? '' : ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<div class="win-resize ${d}" data-d="${d}"></div>`).join('')}`;
    $('#windows').appendChild(el);

    const win = {
      id, el, key: o.key, app: o.app, icon: o.icon, body: $('.win-body', el), onClose: [], maxed: false, minned: false, prev: null,
      setTitle(t) { this.title = t; $('.win-title', el).textContent = t; el.setAttribute('aria-label', t); if (this.task) $('span', this.task).textContent = t; },
      focus() {
        if (OS.active === this) return;
        OS.wins.forEach(x => { x.el.classList.add('inactive'); x.task?.classList.remove('active'); });
        el.classList.remove('inactive'); el.style.zIndex = ++OS.z; this.task?.classList.add('active'); OS.active = this;
      },
      close() {
        if (this.closed) return; this.closed = true;
        this.onClose.forEach(f => { try { f(); } catch (e) { } });
        $$('video,audio', el).forEach(v => { try { v.pause(); } catch (e) { } });
        el.classList.add('closing'); this.task?.remove(); clearTimeout(OS._tt); OS._tb?.remove();
        setTimeout(() => el.remove(), 170);
        OS.wins = OS.wins.filter(x => x !== this);
        if (OS.active === this) { OS.active = null; const top = OS.topWindow(); top && top.focus(); }
      },
      maximize() {
        if (this.maxed) { el.classList.remove('max'); Object.assign(el.style, this.prev); this.maxed = false; $('.b-max', el) && ($('.b-max', el).innerHTML = ICON('max')); }
        else { this.prev = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height }; Object.assign(el.style, { left: '0px', top: '0px', width: '100%', height: '100%' }); el.classList.add('max'); this.maxed = true; $('.b-max', el) && ($('.b-max', el).innerHTML = ICON('restore')); }
        OS.emit(this, 'resize');
      },
      minimize() {
        if (this.minned) return;
        this.minned = true; this.task?.classList.remove('active');
        if (OS.active === this) { OS.active = null; const top = OS.topWindow(); top && top.focus(); }
        const done = () => { el.classList.remove('minimizing'); el.style.transform = ''; el.style.transformOrigin = ''; if (this.minned) el.classList.add('min'); };
        if (reduceMotion() || !this.task) return done();
        const t = this.task.getBoundingClientRect(), r = el.getBoundingClientRect();
        el.style.transformOrigin = `${t.left + t.width / 2 - r.left}px ${t.top - r.top}px`;
        el.classList.add('minimizing'); el.style.transform = 'scale(.15)';
        clearTimeout(this._minT); this._minT = setTimeout(done, 250);
      },
      restore() {
        if (!this.minned) return;
        this.minned = false; clearTimeout(this._minT);
        el.classList.remove('min', 'minimizing'); el.style.transform = '';
        if (!reduceMotion() && this.task) {
          const t = this.task.getBoundingClientRect(), r = el.getBoundingClientRect();
          el.style.transformOrigin = `${t.left + t.width / 2 - r.left}px ${t.top - r.top}px`;
          el.animate([{ transform: 'scale(.15)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => { el.style.transformOrigin = ''; };
        }
      },
      listeners: {},
      on(ev, f) { (this.listeners[ev] ||= []).push(f); },
    };
    win.title = o.title;
    OS.wins.push(win);

    // taskbar button
    win.task = h('div', { class: 'task', 'aria-label': o.title || '' }, `${OS.iconHTML(o.icon)}<span>${esc(o.title)}</span>`);
    if (!isTouch) {
      // Aero-style live preview above the taskbar button
      win.task.addEventListener('mouseenter', () => {
        clearTimeout(OS._tt);
        OS._tt = setTimeout(() => {
          if (win.closed || !win.task.isConnected) return;
          const r = win.task.getBoundingClientRect();
          const shot = win.flipThumb || $('img', win.body)?.src || $('video', win.body)?.poster;
          OS._tb?.remove();
          OS._tb = h('div', { class: 'tb-thumb' }, `<div class="tt">${OS.iconHTML(win.icon)}<span>${esc(win.title)}</span></div><div class="tc">${shot ? `<img src="${esc(shot)}" alt="">` : OS.iconHTML(win.icon)}</div>`);
          OS._tb.style.left = Math.max(4, Math.min(innerWidth - 214, r.left + r.width / 2 - 105)) + 'px';
          document.body.appendChild(OS._tb);
        }, 400);
      });
      win.task.addEventListener('mouseleave', () => { clearTimeout(OS._tt); OS._tb?.remove(); });
      win.task.addEventListener('pointerdown', () => { clearTimeout(OS._tt); OS._tb?.remove(); });
    }
    win.task.addEventListener('click', () => {
      if (win.minned) { win.restore(); win.focus(); }
      else if (OS.active === win) win.minimize();
      else win.focus();
    });
    win.task.addEventListener('contextmenu', (e) => { e.preventDefault(); OS.menu(e.clientX, e.clientY - 60, [{ label: win.maxed ? 'Restore' : 'Maximize', act: () => win.maximize() }, { label: 'Minimize', act: () => win.minimize() }, '-', { label: '<b>Close</b>', act: () => win.close() }]); });
    $('#tasks').appendChild(win.task);

    // buttons
    $('.b-close', el).addEventListener('click', (e) => { e.stopPropagation(); win.close(); });
    $('.b-min', el)?.addEventListener('click', (e) => { e.stopPropagation(); win.minimize(); });
    $('.b-max', el)?.addEventListener('click', (e) => { e.stopPropagation(); win.maximize(); });
    el.addEventListener('pointerdown', () => win.focus(), true);

    // drag
    const tb = $('.win-titlebar', el);
    tb.addEventListener('dblclick', (e) => { if (isMobile()) return; if (!e.target.closest('.win-buttons') && !o.noMax) win.maximize(); });
    tb.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.win-buttons')) return;
      if (isMobile() && win.maxed) return; // a scroll-ish swipe shouldn't pull a phone window out of maximized
      const sx = e.clientX, sy = e.clientY; let moved = false;
      let r0 = el.getBoundingClientRect(); const d = $('#desktop').getBoundingClientRect();
      let shield = null; // only created once a drag starts, so a plain double-click still reaches the title bar
      const mv = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
        if (!shield) { shield = h('div', { class: 'drag-shield' }); document.body.appendChild(shield); }
        if (win.maxed && !moved) { // pull out of maximized state
          const ratio = (sx - r0.left) / r0.width; win.maximize(); r0 = el.getBoundingClientRect();
          el.style.left = (sx - d.left - r0.width * ratio) + 'px'; el.style.top = (sy - d.top - 12) + 'px'; r0 = el.getBoundingClientRect();
        }
        moved = true;
        let nx = r0.left - d.left + dx, ny = r0.top - d.top + dy;
        ny = Math.max(0, Math.min(ny, d.height - 30)); nx = Math.max(-r0.width + 80, Math.min(nx, d.width - 80));
        el.style.left = nx + 'px'; el.style.top = ny + 'px';
      };
      const up = (ev) => { shield?.remove(); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (moved && ev.clientY - d.top <= 2 && !o.noMax && !win.maxed) win.maximize(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });

    // resize
    $$('.win-resize', el).forEach(rz => rz.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); const dir = rz.dataset.d; const sx = e.clientX, sy = e.clientY;
      const r0 = { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      const mw = o.minW || 300, mh = o.minH || 180;
      const shield = h('div', { class: 'drag-shield' }); shield.style.cursor = getComputedStyle(rz).cursor; document.body.appendChild(shield);
      const mv = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy; let { l, t, w, h: hh } = r0;
        if (dir.includes('e')) w = Math.max(mw, r0.w + dx);
        if (dir.includes('s')) hh = Math.max(mh, r0.h + dy);
        if (dir.includes('w')) { w = Math.max(mw, r0.w - dx); l = r0.l + r0.w - w; }
        if (dir.includes('n')) { hh = Math.max(mh, r0.h - dy); t = Math.max(0, r0.t + r0.h - hh); }
        Object.assign(el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: hh + 'px' });
        OS.emit(win, 'resize');
      };
      const up = () => { shield.remove(); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    }));

    if (o.maximized || ((isMobile() || (isTouch && A.w < 1024)) && !o.noMax)) win.maximize();
    win.focus();
    return win;
  };
  OS.emit = (win, ev, ...a) => (win.listeners[ev] || []).forEach(f => f(...a));
  OS.topWindow = () => OS.wins.filter(w => !w.minned).sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex))[0];

  /* Launch an app by id */
  OS.open = function (id, args = {}) {
    const app = OS.apps[id];
    if (!app) { OS.alert('Windows cannot find \'' + id + '\'. Make sure you typed the name correctly, and then try again.', 'error'); return; }
    closeStart();
    const doOpen = () => {
      const key = app.single ? (typeof app.single === 'function' ? app.single(args) : id) : null;
      const win = OS.createWindow({
        title: app.title ? (typeof app.title === 'function' ? app.title(args) : app.title) : app.name,
        icon: typeof app.icon === 'function' ? app.icon(args) : app.icon, app: id, key,
        w: app.w, h: app.h, minW: app.minW, minH: app.minH, maximized: app.maximized, noMax: app.noMax, noResize: app.noResize, noMin: app.noMin, bodyClass: app.bodyClass,
        reuse: app.reuse ? (ex) => app.reuse(ex, args) : null,
      });
      if (!win._ran) { win._ran = true; try { app.run(win, args); } catch (e) { console.error(e); win.body.innerHTML = `<div class="pad">This program has stopped working.<br><small class="muted">${esc(e.message)}</small></div>`; } }
      return win;
    };
    if (app.uac && !OS._uacOk?.[id]) return OS.uac(app, () => { (OS._uacOk ||= {})[id] = true; doOpen(); });
    return doOpen();
  };

  /* ---------------- dialogs ---------------- */
  OS.alert = function (msg, kind = 'info', title, buttons) {
    OS.sound[kind === 'error' ? 'error' : 'ding']();
    const win = OS.createWindow({ title: title || (kind === 'error' ? 'Error' : 'Daniel Vista'), icon: kind === 'error' ? ICON('warn') : ICON('info'), w: 380, h: 170, noMax: true, noMin: true, noResize: true });
    win.body.innerHTML = `<div style="flex:1;min-height:0;overflow:auto;display:flex;gap:14px;padding:18px 18px 8px;align-items:flex-start"><div style="width:32px;flex:none">${ICON(kind === 'error' ? 'warn' : 'info')}</div><div class="selectable" style="line-height:1.5">${msg}</div></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:10px 12px;background:#f0f0f0;border-top:1px solid #dfdfdf"></div>`;
    const bar = win.body.lastElementChild;
    win.isDialog = true;
    (buttons || [{ label: 'OK', primary: true }]).forEach(b => { const btn = h('button', { class: 'vbtn' + (b.primary ? ' primary' : '') }, b.label); btn.onclick = () => { win.close(); b.act && b.act(); }; bar.appendChild(btn); });
    // size to the message instead of a fixed 170px, but never taller than the desktop
    { const A = area(), el = win.el; el.style.height = 'auto'; el.style.maxHeight = (A.h - 12) + 'px'; if (el.offsetTop + el.offsetHeight > A.h - 6) el.style.top = Math.max(6, A.h - el.offsetHeight - 6) + 'px'; }
    setTimeout(() => bar.querySelector('.primary')?.focus(), 50);
    return win;
  };

  OS.uac = function (app, ok) {
    OS.sound.uac();
    const ov = h('div', { id: 'uac' }, `<div class="uac-box" role="alertdialog">
      <div class="uac-head">${ICON('shield')}<div><b>Daniel Vista needs your permission to continue</b></div></div>
      <div class="uac-body">If you started this action, continue.<div class="uac-prog"><div class="ic">${OS.iconHTML(app.icon)}</div><div><b>${esc(app.name)}</b><br><span class="muted">${esc(app.publisher || 'Daniel Ionashku (verified, mostly)')}</span></div></div>
      <span class="muted">${esc(app.uacNote || 'User Account Control helps stop unauthorized changes to your portfolio.')}</span></div>
      <div class="uac-foot"><button class="vbtn primary" data-a="1">Continue</button><button class="vbtn" data-a="0">Cancel</button></div></div>`);
    document.body.appendChild(ov);
    $$('button', ov).forEach(b => b.onclick = () => { ov.remove(); if (b.dataset.a === '1') ok(); else OS.balloon('Access denied', 'Fair. It\'s just a command prompt, though. Promise.'); });
    setTimeout(() => $('.primary', ov).focus(), 50);
  };

  OS.balloon = function (title, text, { icon = 'info', ms = 7000, onClick } = {}) {
    $$('.balloon').forEach(b => b.remove());
    const b = h('div', { class: 'balloon', role: 'status' }, `<span class="x">✕</span><b>${ICON(icon)}${esc(title)}</b><div>${text}</div>`);
    document.body.appendChild(b); OS.sound.pop();
    $('.x', b).onclick = (e) => { e.stopPropagation(); b.remove(); };
    if (onClick) { b.style.cursor = 'pointer'; b.onclick = () => { b.remove(); onClick(); }; }
    setTimeout(() => b.remove(), ms);
  };

  /* ---------------- context menu ---------------- */
  OS.menu = function (x, y, items, isSub = false) {
    if (!isSub) closeMenu();
    const m = h('div', { class: 'ctx' + (isSub ? ' sub' : ''), role: 'menu' });
    items.forEach(it => {
      if (it === '-') return m.appendChild(h('div', { class: 'csep' }));
      const ci = h('div', { class: 'ci' + (it.disabled ? ' disabled' : ''), role: 'menuitem' }, `${it.icon ? `<span class="cic">${OS.iconHTML(it.icon)}</span>` : ''}<span>${it.label}</span>${it.sub ? '<span>▸</span>' : ''}`);
      if (!it.disabled && !it.sub) ci.addEventListener('click', (e) => { e.stopPropagation(); closeMenu(); it.act && it.act(); });
      if (it.sub) {
        const openSub = () => { clearTimeout(OS._subT); if (ci._sub?.isConnected) return; $$('.ctx.sub').forEach(s => s.remove()); const r = ci.getBoundingClientRect(); ci._sub = OS.menu(r.right - 2, r.top - 3, it.sub, true); ci._sub.addEventListener('mouseenter', () => clearTimeout(OS._subT)); };
        ci.addEventListener('mouseenter', openSub);
        ci.addEventListener('click', (e) => { e.stopPropagation(); openSub(); }); // touch has no hover
      } else if (!isSub) ci.addEventListener('mouseenter', () => { clearTimeout(OS._subT); OS._subT = setTimeout(() => $$('.ctx.sub').forEach(s => s.remove()), 300); }); // grace period so a diagonal move into the submenu doesn't close it
      m.appendChild(ci);
    });
    document.body.appendChild(m);
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px'; m.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + 'px';
    return m;
  };
  const closeMenu = () => $$('.ctx').forEach(m => m.remove());
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.ctx')) closeMenu(); if (!e.target.closest('#startmenu,#start-orb')) closeStart(); });

  /* ---------------- tooltip ---------------- */
  let tipT, tipEl;
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-tip]'); clearTimeout(tipT); tipEl?.remove();
    if (!t || isTouch || (t.id === 'start-orb' && $('#startmenu').classList.contains('open'))) return;
    tipT = setTimeout(() => { tipEl = h('div', { class: 'tip' }, esc(t.dataset.tip)); document.body.appendChild(tipEl); const r = t.getBoundingClientRect(), tr = tipEl.getBoundingClientRect(); tipEl.style.left = Math.min(innerWidth - tr.width - 4, Math.max(4, r.left + r.width / 2 - tr.width / 2)) + 'px'; tipEl.style.top = (r.top - tr.height - 6 < 0 ? r.bottom + 6 : r.top - tr.height - 6) + 'px'; }, 550);
  });

  document.addEventListener('pointerdown', () => { clearTimeout(tipT); tipEl?.remove(); }, true);

  /* The one-player-at-a-time rule and the .tall/.wide image tagger live in apps.js. */

  /* ---------------- desktop ---------------- */
  OS.renderDesktop = function (items) {
    const box = $('#icons'); box.innerHTML = '';
    items.forEach((it, i) => {
      const d = h('div', { class: 'dicon', tabindex: 0, 'data-i': i }, `<div class="ic">${it.thumb ? `<img class="appthumb" src="${esc(it.thumb)}" alt="">` : OS.iconHTML(it.icon)}${it.shortcut ? `<svg class="shortcut" viewBox="0 0 14 14"><rect width="14" height="14" fill="#fff" stroke="#888"/><path d="M4 10c0-4 2-6 6-6M7 3h3.5v3.5" stroke="#1d5fb4" stroke-width="1.6" fill="none"/></svg>` : ''}</div><span>${esc(it.label)}</span>`);
      const launch = () => { d.classList.remove('sel'); it.open(); };
      d.addEventListener('click', (e) => { $$('.dicon.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); if (isTouch) launch(); e.stopPropagation(); });
      d.addEventListener('dblclick', launch);
      d.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });
      d.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); $$('.dicon.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); OS.menu(e.clientX, e.clientY, [{ label: '<b>Open</b>', act: launch }, ...(it.menu || []), '-', { label: 'Properties', act: () => OS.alert(`<b>${esc(it.label)}</b><br>${esc(it.desc || 'A thing Daniel made.')}`, 'info', it.label + ' Properties') }]); });
      box.appendChild(d);
    });
  };
  const wallpapers = [['wp-aurora', 'Aurora'], ['wp-blue', 'Blue Ribbons'], ['wp-sunset', 'Dusk'], ['wp-black', 'Midnight']];
  OS.iconScale = 1;
  OS.setIconScale = (v) => { OS.iconScale = v; document.documentElement.style.setProperty('--di', v); try { localStorage.setItem('dv-di', v); } catch (e) { } };
  OS.setWallpaper = (cls) => { $('#wallpaper').className = cls; try { localStorage.setItem('dv-wp', cls); } catch (e) { } };

  /* ---------------- start menu ---------------- */
  const closeStart = () => { $('#startmenu')?.classList.remove('open'); $('#start-orb')?.classList.remove('open'); };
  OS.toggleStart = () => { const sm = $('#startmenu'); const open = !sm.classList.contains('open'); sm.classList.toggle('open', open); $('#start-orb').classList.toggle('open', open); if (open) { $('#sm-search').value = ''; OS.renderStartList(); setTimeout(() => !isTouch && $('#sm-search').focus(), 30); } };
  OS.renderStartList = function (q = '', all = false) {
    const list = $('#sm-list'); const cfg = OS.startConfig;
    let items;
    if (q) {
      const ql = q.toLowerCase();
      items = cfg.searchable().filter(i => (i.label + ' ' + (i.sub || '') + ' ' + (i.keywords || '')).toLowerCase().includes(ql)).slice(0, 12);
      list.innerHTML = items.length ? `<div class="muted" style="padding:4px 8px 6px;font-weight:600">Programs &amp; projects</div>` : `<div class="muted pad">No items match your search.</div>`;
    } else { items = all ? cfg.all() : cfg.pinned(); list.innerHTML = ''; }
    items.forEach((it, i) => {
      if (it === '-') return list.appendChild(h('div', { class: 'sm-sep' }));
      const row = h('div', { class: 'sm-item' + (q && i === 0 ? ' kb' : ''), ...(it.sub ? { 'data-tip': it.sub } : {}) }, `<div class="ic">${it.thumb ? `<img class="app" src="${esc(it.thumb)}" alt="">` : OS.iconHTML(it.icon)}</div><div><b>${it.bold ? `<strong>${esc(it.label)}</strong>` : esc(it.label)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</div>`);
      row.onclick = () => { closeStart(); it.open(); };
      row.onmouseenter = () => it.pic && ($('#sm-pic').src = it.pic);
      row.onmouseleave = () => ($('#sm-pic').src = OS.profilePic);
      list.appendChild(row);
    });
    $('#sm-all').innerHTML = all && !q ? `<span>◂</span> Back` : `All Programs <span style="margin-left:auto">▸</span>`;
    $('#sm-all').dataset.all = all ? '1' : '';
  };

  /* ---------------- Flip 3D ---------------- */
  OS.flip3d = function () {
    const f = $('#flip3d'); if (f.classList.contains('on')) return closeFlip();
    document.activeElement?.blur?.();
    const wins = OS.wins.slice().sort((a, b) => (+a.el.style.zIndex) - (+b.el.style.zIndex));
    if (!wins.length) { OS.balloon('Nothing to flip', 'Open a few projects first, then try Flip 3D again.'); return; }
    closeStart();
    const st = $('.stack', f); st.innerHTML = '';
    let idx = wins.length - 1;
    const cards = wins.map((w, i) => {
      const shot = w.flipThumb || $('img', w.body)?.src;
      const c = h('div', { class: 'card' }, `<div class="ct">${OS.iconHTML(w.icon)}<span>${esc(w.title)}</span></div><div class="cb">${shot ? `<img src="${esc(shot)}" alt="">` : OS.iconHTML(w.icon)}</div>`);
      c.onclick = (e) => { e.stopPropagation(); closeFlip(); w.restore(); w.focus(); };
      st.appendChild(c); return c;
    });
    // cards[idx] is the front card, so what you see is what Enter or a click opens
    const lay = () => cards.forEach((c, i) => { const k = (i - idx + cards.length) % cards.length; c.style.transform = `translate3d(${k * 95}px, ${-k * 40}px, ${-k * 200}px)`; c.style.zIndex = 100 - k; c.style.opacity = k > 6 ? 0 : 1; c.classList.toggle('front', k === 0); });
    lay(); f.classList.add('on'); document.body.classList.add('flipping');
    f.onwheel = (e) => { idx = (idx + (e.deltaY > 0 ? 1 : -1) + cards.length) % cards.length; lay(); };
    f.onclick = closeFlip;
    OS._flipKey = (e) => { if (e.key === 'Escape') closeFlip(); if (e.key === 'ArrowRight' || e.key === 'Tab') { e.preventDefault(); idx = (idx + 1) % cards.length; lay(); } if (e.key === 'ArrowLeft') { idx = (idx - 1 + cards.length) % cards.length; lay(); } if (e.key === 'Enter') { e.preventDefault(); const w = wins[idx]; closeFlip(); w.restore(); w.focus(); } };
    addEventListener('keydown', OS._flipKey);
  };
  const closeFlip = () => { $('#flip3d').classList.remove('on'); document.body.classList.remove('flipping'); removeEventListener('keydown', OS._flipKey); };

  /* ---------------- shell build ---------------- */
  OS.buildShell = function () {
    // taskbar
    $('#start-orb').innerHTML = ICON('orb');
    $('#start-orb').onclick = (e) => { e.stopPropagation(); OS.toggleStart(); };
    $('#quicklaunch').innerHTML = '';
    (OS.quickLaunch || []).forEach(q => { const b = h('button', { 'data-tip': q.label, 'aria-label': q.label }, OS.iconHTML(q.icon)); b.onclick = q.act; $('#quicklaunch').appendChild(b); });
    $('#tray').innerHTML = `<span class="tray-ic" data-tip="Network: Connected to the Internet">${ICON('wifi')}</span><span class="tray-ic" id="tray-vol" data-tip="Volume: on">${ICON('volume')}</span><div id="clock"></div>`;
    $('#tray-vol').onclick = () => { OS.muted = !OS.muted; $('#tray-vol').style.opacity = OS.muted ? .35 : .9; $('#tray-vol').dataset.tip = 'Volume: ' + (OS.muted ? 'muted' : 'on'); };
    $('#show-desktop').onclick = () => { const anyOpen = OS.wins.some(w => !w.minned); if (anyOpen) { OS._shown = OS.wins.filter(w => !w.minned).sort((a, b) => (+a.el.style.zIndex) - (+b.el.style.zIndex)); OS._shown.forEach(w => w.minimize()); } else { (OS._shown || []).forEach(w => { w.restore(); w.focus(); }); } };
    $('#show-desktop').dataset.tip = 'Show desktop';
    const tick = () => { const d = new Date(); $('#clock').innerHTML = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); $('#clock').dataset.tip = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); };
    tick(); setInterval(tick, 10000);
    $('#clock').onclick = () => OS.open('calendar');

    // start menu
    const sm = $('#startmenu');
    sm.innerHTML = `<div class="sm-left"><div class="sm-list" id="sm-list"></div><div class="sm-allprog" id="sm-all"></div>
      <div class="sm-search"><input id="sm-search" placeholder="Start Search" aria-label="Start Search"></div></div>
      <div class="sm-right"><div class="user-frame"><img id="sm-pic" alt=""></div>${(OS.startConfig.right || []).map((r, i) => r === '-' ? '<div class="sm-rsep"></div>' : `<div class="sm-link ${r.bold ? 'bold' : ''}" data-r="${i}" ${r.pic ? `data-pic="${esc(r.pic)}"` : ''}><span class="sl">${esc(r.label)}</span>${r.arrow ? '<span>▸</span>' : ''}</div>`).join('')}
      <div class="sm-power"><button class="pw" data-tip="Sleep" id="sm-sleep">${ICON('power')}</button><button class="lk" data-tip="Lock this computer" id="sm-lock">${ICON('lock')}</button><button class="mr" data-tip="More options" id="sm-more">${ICON('arrowR')}</button></div></div>`;
    $('#sm-pic').src = OS.profilePic;
    $$('.sm-link', sm).forEach(l => { const r = OS.startConfig.right[+l.dataset.r]; l.onclick = () => { closeStart(); r.open(); }; l.onmouseenter = () => r.pic && ($('#sm-pic').src = r.pic); l.onmouseleave = () => ($('#sm-pic').src = OS.profilePic); });
    $('#sm-all').onclick = () => OS.renderStartList('', !$('#sm-all').dataset.all);
    $('#sm-search').addEventListener('input', (e) => OS.renderStartList(e.target.value.trim()));
    $('#sm-search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { $('#sm-list .sm-item')?.click(); } if (e.key === 'Escape') { e.stopPropagation(); closeStart(); } });
    $('#sm-lock').onclick = () => { closeStart(); OS.showLogin(true); };
    $('#sm-sleep').onclick = () => { closeStart(); OS.sleep(); };
    $('#sm-more').onclick = (e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.right, r.top - 150, [{ label: 'Switch User', act: () => OS.showLogin(true) }, { label: 'Log Off', act: () => OS.showLogin(true) }, { label: 'Lock', act: () => OS.showLogin(true) }, '-', { label: 'Restart', act: () => OS.restart() }, { label: 'Sleep', act: () => OS.sleep() }, { label: 'Shut Down', act: () => OS.shutdown() }]); };

    // desktop interactions
    const desk = $('#desktop');
    desk.addEventListener('click', (e) => { if (e.target.closest('.dicon,.win,#sidebar')) return; $$('.dicon.sel').forEach(x => x.classList.remove('sel')); });
    desk.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.win,.dicon')) return; e.preventDefault();
      OS.menu(e.clientX, e.clientY, [
        { label: 'View', sub: [['Large Icons', 1.35], ['Medium Icons', 1], ['Classic Icons', 0.75]].map(([label, v]) => ({ label: label + (OS.iconScale === v ? ' ✓' : ''), act: () => OS.setIconScale(v) })) },
        { label: 'Sort By', sub: [{ label: 'Name', act: () => OS.renderDesktop(OS.desktopItems.slice().sort((a, b) => a.label.localeCompare(b.label))) }, { label: 'Default', act: () => OS.renderDesktop(OS.desktopItems) }] },
        { label: 'Refresh', act: () => { $('#icons').style.opacity = 0; setTimeout(() => $('#icons').style.opacity = 1, 120); } },
        '-',
        { label: 'New', sub: [{ label: 'Folder', icon: 'folder', act: () => OS.alert('You can\'t create folders on someone else\'s portfolio. Nice try though.', 'info', 'New Folder') }, { label: 'Text Document', icon: 'notepad', act: () => OS.open('notepad', { blank: true }) }] },
        '-',
        { label: 'Flip 3D', icon: 'flip', act: OS.flip3d },
        { label: 'Personalize', icon: 'paint', act: () => OS.open('personalize') },
      ]);
    });

    // keyboard
    addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Escape') { e.preventDefault(); OS.toggleStart(); }
      if (e.key === 'Escape') {
        const busy = $('#startmenu').classList.contains('open') || $('.ctx') || $('#flip3d').classList.contains('on');
        closeStart(); closeMenu();
        if (!busy) { const u = $('#uac [data-a="0"]'); if (u) u.click(); else if (OS.active?.isDialog) OS.active.close(); }
      }
      // e.code, not e.key: on macOS Option+W types a symbol instead of 'w'
      if (e.altKey && e.code === 'KeyW') { e.preventDefault(); OS.active?.close(); }
      // Alt+Tab is swallowed by Windows and most Linux desktops, so Ctrl+Alt+F opens Flip 3D too. A second Alt+Tab cycles (handled in _flipKey).
      if ((e.altKey && e.key === 'Tab') || (e.ctrlKey && e.altKey && e.code === 'KeyF')) { e.preventDefault(); if (!$('#flip3d').classList.contains('on')) OS.flip3d(); }
    });

    // wallpaper
    let wp = 'wp-aurora'; try { wp = localStorage.getItem('dv-wp') || wp; } catch (e) { }
    OS.setWallpaper(wp);
    let di = 1; try { di = +localStorage.getItem('dv-di') || 1; } catch (e) { }
    if (di !== 1) OS.setIconScale(di);
    OS.wallpapers = wallpapers;
  };

  /* ---------------- boot / login / power ---------------- */
  OS.showLogin = function (relock) {
    const L = $('#login');
    if (relock) { OS.wins.forEach(w => $$('video,audio', w.el).forEach(v => v.pause())); }
    L.classList.remove('welcome'); L.style.display = 'flex'; L.style.opacity = 1;
    $('.login-tile', L).focus();
  };
  const logIn = () => {
    const L = $('#login');
    if (L.classList.contains('welcome')) return;
    L.classList.add('welcome');
    try { ac().resume(); } catch (e) { }
    setTimeout(() => {
      OS.sound.startup();
      L.style.opacity = 0;
      setTimeout(() => { L.style.display = 'none'; if (!OS._booted) { OS._booted = true; OS.onFirstLogin && OS.onFirstLogin(); } }, 700);
    }, 1300);
  };
  OS.sleep = () => { const s = h('div', {}, ''); s.style.cssText = 'position:fixed;inset:0;z-index:100001;background:#000;opacity:0;transition:opacity .6s;cursor:pointer;display:grid;place-items:center;color:#333;font-size:12px'; s.textContent = 'Zzz… click anywhere to wake'; document.body.appendChild(s); requestAnimationFrame(() => s.style.opacity = 1); s.onclick = () => { s.style.opacity = 0; setTimeout(() => { s.remove(); OS.showLogin(true); }, 600); }; };
  OS.shutdown = () => {
    OS.wins.slice().forEach(w => w.close());
    const s = h('div', {}, `<div style="display:flex;align-items:center;gap:14px;font-size:24px;font-weight:300"><div class="spinner"></div>Shutting down…</div>`);
    s.style.cssText = 'position:fixed;inset:0;z-index:100001;display:grid;place-items:center;color:#fff;background:linear-gradient(180deg,#0b3b75,#1a5aa6 45%,#0f4687)';
    document.body.appendChild(s);
    setTimeout(() => { s.innerHTML = `<div style="text-align:center;color:#888;font-size:13px;line-height:2">It's now safe to close this tab.<br><span style="color:#5a5a5a">…or <a href="#" style="color:#7fc4ff">turn it back on</a></span></div>`; s.style.background = '#000'; $('a', s).onclick = (e) => { e.preventDefault(); location.reload(); }; }, 2200);
  };
  OS.restart = () => { OS.wins.slice().forEach(w => w.close()); setTimeout(() => location.reload(), 400); };

  OS.boot = function () {
    $('#login .user-frame img').src = OS.profilePic;
    const tile = $('.login-tile'); tile.onclick = logIn; tile.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logIn(); } };
    const skip = new URLSearchParams(location.search).has('skip');
    const boot = $('#boot');
    if (skip) { boot.remove(); $('#login').style.display = 'none'; OS._booted = true; OS.onFirstLogin && OS.onFirstLogin(); return; }
    setTimeout(() => { boot.style.opacity = 0; OS.showLogin(); setTimeout(() => boot.remove(), 650); }, 2600);
  };
})();
