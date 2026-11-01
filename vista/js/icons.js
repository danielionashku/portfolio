/* Original glossy Aero-style SVG icons. Every icon is a string; ICON(name) returns markup. */
(function () {
  let n = 0;
  const uid = (p) => p + (++n);
  const I = {};

  I.folder = () => { const a = uid('f'), b = uid('f'), c = uid('f'); return `<svg viewBox="0 0 64 64"><defs>
    <linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d97a"/><stop offset="1" stop-color="#d9a52b"/></linearGradient>
    <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".5" stop-color="#fbd86a"/><stop offset="1" stop-color="#e7b236"/></linearGradient>
    <linearGradient id="${c}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dfe9f3"/></linearGradient></defs>
    <path d="M5 14c0-2 1.5-3.5 3.5-3.5h14l4 4.5H55c2 0 3.5 1.5 3.5 3.5V50H5z" fill="url(#${a})" stroke="#a87a13" stroke-width="1"/>
    <rect x="11" y="18" width="40" height="28" rx="1.5" fill="url(#${c})" stroke="#9aa9b8" stroke-width=".8" transform="rotate(-3 31 32)"/>
    <rect x="14" y="20" width="38" height="26" rx="1.5" fill="#fff" stroke="#b4c2cf" stroke-width=".8" transform="rotate(2 33 33)"/>
    <path d="M3.5 25.5c-.3-2 1.2-3.5 3.2-3.5h50.6c2 0 3.5 1.6 3.2 3.5L57.8 51c-.3 1.9-2 3.2-3.9 3.2H10.1c-1.9 0-3.6-1.3-3.9-3.2z" fill="url(#${b})" stroke="#b8861a" stroke-width="1"/>
    <path d="M6 25.5c0-1 .8-1.6 1.8-1.6h48.4c1 0 1.8.7 1.6 1.6l-.7 5H6.6z" fill="#fff" opacity=".45"/></svg>`; };

  I.folderVideo = () => I.folder().replace('</svg>', `<g transform="translate(22 32)"><rect width="20" height="15" rx="2" fill="#24384f" stroke="#0e1b29"/><path d="M8 4l6 3.5-6 3.5z" fill="#fff"/></g></svg>`);
  I.folderWeb = () => I.folder().replace('</svg>', `<g transform="translate(23 30)"><circle cx="9" cy="9" r="9" fill="#3d9be9" stroke="#145a98"/><path d="M0 9h18M9 0c-4 4-4 14 0 18M9 0c4 4 4 14 0 18M2 4.5h14M2 13.5h14" stroke="#cdeaff" stroke-width="1" fill="none"/></g></svg>`);
  I.folderApps = () => I.folder().replace('</svg>', `<g transform="translate(22 30)"><rect width="9" height="9" rx="2" fill="#2fb6ff"/><rect x="11" width="9" height="9" rx="2" fill="#37d67a"/><rect y="11" width="9" height="9" rx="2" fill="#ffb84a"/><rect x="11" y="11" width="9" height="9" rx="2" fill="#ff6b6b"/></g></svg>`);
  I.folderTools = () => I.folder().replace('</svg>', `<g transform="translate(23 29)"><path d="M3 18l9-9" stroke="#6b7785" stroke-width="4" stroke-linecap="round"/><circle cx="14" cy="6" r="5" fill="none" stroke="#6b7785" stroke-width="3"/></g></svg>`);
  I.folderGames = () => I.folder().replace('</svg>', `<g transform="translate(21 31)"><rect width="22" height="13" rx="6.5" fill="#3e4a59" stroke="#1d242c"/><path d="M5 6.5h5M7.5 4v5" stroke="#fff" stroke-width="1.6"/><circle cx="15" cy="5" r="1.4" fill="#ff6b6b"/><circle cx="17.5" cy="8" r="1.4" fill="#37d67a"/></g></svg>`);
  I.folderStar = () => I.folder().replace('</svg>', `<path d="M32 30l3 6.2 6.8 1-4.9 4.8 1.2 6.8L32 45.6l-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1z" fill="#ffd34a" stroke="#c48a0c"/></svg>`);

  I.computer = () => { const a = uid('c'), b = uid('c'); return `<svg viewBox="0 0 64 64"><defs>
    <linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6470"/><stop offset="1" stop-color="#1e242b"/></linearGradient>
    <linearGradient id="${b}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d9be0"/><stop offset=".55" stop-color="#0a4f9c"/><stop offset="1" stop-color="#07335f"/></linearGradient></defs>
    <rect x="6" y="8" width="52" height="36" rx="3" fill="url(#${a})" stroke="#111"/>
    <rect x="9.5" y="11.5" width="45" height="29" fill="url(#${b})"/>
    <path d="M9.5 11.5h45v10c-15 6-30 6-45 2z" fill="#fff" opacity=".22"/>
    <path d="M14 34c8-7 17-9 36-6" stroke="#7fe0ff" stroke-width="2" fill="none" opacity=".8"/>
    <path d="M24 44h16l3 8H21z" fill="#3a434d"/><rect x="16" y="52" width="32" height="4" rx="2" fill="#262d35"/></svg>`; };

  I.recycle = (full) => { const a = uid('r'); return `<svg viewBox="0 0 64 64"><defs>
    <linearGradient id="${a}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe3f3" stop-opacity=".85"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#9fc2de" stop-opacity=".85"/></linearGradient></defs>
    <path d="M13 14h38l-4.5 42c-.2 1.7-1.6 3-3.3 3H20.8c-1.7 0-3.1-1.3-3.3-3z" fill="url(#${a})" stroke="#6f8ea8"/>
    <ellipse cx="32" cy="14" rx="19.5" ry="4" fill="#e9f3fb" stroke="#6f8ea8"/>
    ${full ? `<path d="M19 13l6-7 7 5 6-6 6 7z" fill="#f4f4f4" stroke="#999"/><rect x="22" y="22" width="14" height="10" fill="#fff" stroke="#aaa" transform="rotate(-12 29 27)"/><rect x="30" y="30" width="12" height="9" fill="#ffe9a8" stroke="#c9a640" transform="rotate(10 36 34)"/>` : ''}
    <g fill="none" stroke="#1d9b4a" stroke-width="2.6" stroke-linecap="round"><path d="M27 39l4-6 4 6"/><path d="M38 42l-2 5h-8"/><path d="M24 45l-2-4"/></g></svg>`; };

  I.notepad = () => { const a = uid('n'); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#2d8fd6"/></linearGradient></defs>
    <rect x="12" y="8" width="40" height="50" rx="2" fill="#fff" stroke="#7d8a96"/>
    <rect x="12" y="8" width="40" height="9" fill="url(#${a})" stroke="#2a6ea3"/>
    ${[24, 30, 36, 42, 48].map(y => `<path d="M17 ${y}h30" stroke="#a9c7e3" stroke-width="1.4"/>`).join('')}
    ${[18, 26, 34, 42].map(x => `<rect x="${x}" y="5" width="3" height="7" rx="1.5" fill="#9aa3ad" stroke="#5d6670" stroke-width=".6"/>`).join('')}</svg>`; };

  I.doc = (ext) => `<svg viewBox="0 0 64 64"><path d="M14 5h26l12 12v42H14z" fill="#fff" stroke="#8796a5"/><path d="M40 5v12h12" fill="#e7eef5" stroke="#8796a5"/>
    ${[26, 32, 38, 44].map(y => `<path d="M20 ${y}h24" stroke="#c3d1de" stroke-width="1.6"/>`).join('')}
    ${ext ? `<rect x="10" y="44" width="30" height="13" rx="2" fill="${ext === 'PDF' ? '#d7301f' : '#2d7bd6'}"/><text x="25" y="54" font-size="9" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">${ext}</text>` : ''}</svg>`;

  I.media = () => { const a = uid('m'), b = uid('m'); return `<svg viewBox="0 0 64 64"><defs>
    <radialGradient id="${a}" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#9ff0a0"/><stop offset=".5" stop-color="#2fb24a"/><stop offset="1" stop-color="#0d5c24"/></radialGradient>
    <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <circle cx="32" cy="32" r="26" fill="url(#${a})" stroke="#0b4a1c" stroke-width="1.2"/>
    <path d="M26 20l18 12-18 12z" fill="#fff" stroke="#0b4a1c" stroke-width="1"/>
    <ellipse cx="32" cy="20" rx="19" ry="11" fill="url(#${b})"/></svg>`; };

  I.globe = () => { const a = uid('g'), b = uid('g'); return `<svg viewBox="0 0 64 64"><defs>
    <radialGradient id="${a}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#bfe9ff"/><stop offset=".5" stop-color="#2d93e0"/><stop offset="1" stop-color="#0c3f7d"/></radialGradient>
    <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <circle cx="32" cy="32" r="25" fill="url(#${a})" stroke="#0a3566"/>
    <path d="M18 18c5 2 6 6 3 9s1 7 5 7 3 6 0 9l-2 6M40 10c-2 4 1 6 4 7s4 5 1 8-1 8 3 9 4 6 2 10" fill="none" stroke="#5fd16a" stroke-width="5" stroke-linecap="round" opacity=".85"/>
    <ellipse cx="30" cy="20" rx="18" ry="10" fill="url(#${b})"/>
    <path d="M6 40c18-14 40-18 54-12" stroke="#ffcf3f" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`; };

  I.cmd = () => `<svg viewBox="0 0 64 64"><rect x="6" y="10" width="52" height="44" rx="3" fill="#0c0c0c" stroke="#5a6672"/><rect x="6" y="10" width="52" height="7" rx="3" fill="#cfd8e2"/><path d="M14 27l7 5-7 5" stroke="#d8d8d8" stroke-width="2.5" fill="none"/><path d="M25 39h12" stroke="#d8d8d8" stroke-width="2.5"/></svg>`;

  I.photos = () => { const a = uid('p'); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc6ff"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient></defs>
    <rect x="14" y="8" width="40" height="32" fill="#fff" stroke="#8a97a4" transform="rotate(8 34 24)"/>
    <rect x="8" y="16" width="44" height="38" fill="#fff" stroke="#7d8a96"/><rect x="12" y="20" width="36" height="26" fill="url(#${a})"/>
    <path d="M12 46l10-12 7 8 6-6 13 10z" fill="#3ea64a"/><circle cx="40" cy="27" r="4" fill="#ffe14a"/></svg>`; };

  I.mail = () => `<svg viewBox="0 0 64 64"><rect x="6" y="16" width="52" height="34" rx="3" fill="#f5f8fb" stroke="#6f8399"/><path d="M7 18l25 18 25-18" fill="none" stroke="#6f8399" stroke-width="1.6"/><path d="M7 49l18-15M57 49L39 34" stroke="#a9b8c7"/><circle cx="48" cy="18" r="9" fill="#2fb24a" stroke="#0b5c22"/><path d="M44 18h8M48 14v8" stroke="#fff" stroke-width="2.2"/></svg>`;

  I.user = () => `<svg viewBox="0 0 64 64"><circle cx="32" cy="22" r="11" fill="#f3c9a3" stroke="#a5765a"/><path d="M12 56c1-12 9-18 20-18s19 6 20 18z" fill="#2d7bd6" stroke="#1a4f8f"/></svg>`;
  I.contact = () => `<svg viewBox="0 0 64 64"><rect x="10" y="8" width="44" height="50" rx="3" fill="#fff8e7" stroke="#9a8a6a"/><rect x="10" y="8" width="8" height="50" fill="#e0b25a"/><circle cx="36" cy="26" r="8" fill="#f3c9a3" stroke="#a5765a"/><path d="M22 48c1-8 6-12 14-12s13 4 14 12z" fill="#3d9be9"/></svg>`;
  I.info = () => `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#2d7bd6" stroke="#174c8c"/><ellipse cx="32" cy="20" rx="18" ry="10" fill="#fff" opacity=".3"/><circle cx="32" cy="19" r="4" fill="#fff"/><rect x="28" y="27" width="8" height="21" rx="2" fill="#fff"/></svg>`;
  I.help = () => `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#2d7bd6" stroke="#174c8c"/><ellipse cx="32" cy="20" rx="18" ry="10" fill="#fff" opacity=".3"/><text x="32" y="44" font-family="Georgia" font-size="32" font-weight="700" fill="#fff" text-anchor="middle">?</text></svg>`;
  I.warn = () => `<svg viewBox="0 0 64 64"><path d="M32 6l28 50H4z" fill="#ffd34a" stroke="#a37a0b" stroke-linejoin="round" stroke-width="1.5"/><rect x="29" y="22" width="6" height="18" rx="2" fill="#222"/><circle cx="32" cy="47" r="3.5" fill="#222"/></svg>`;
  I.shield = () => `<svg viewBox="0 0 64 64"><defs><linearGradient id="shg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa6ea"/><stop offset="1" stop-color="#0c3f84"/></linearGradient></defs><path d="M32 4l24 9v16c0 15-10 26-24 31C18 55 8 44 8 29V13z" fill="url(#shg)" stroke="#0a2f63" stroke-width="1.5"/><path d="M32 7l21 8v14c0 6-2 11-5 15C40 38 30 30 12 28V15z" fill="#fff" opacity=".18"/><path d="M22 32l7 7 13-14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  I.calc = () => `<svg viewBox="0 0 64 64"><rect x="12" y="6" width="40" height="52" rx="4" fill="#3c4855" stroke="#1b232b"/><rect x="17" y="11" width="30" height="11" rx="1" fill="#c6f2c2"/><text x="44" y="20" font-family="Arial" font-size="8" fill="#1d3c1d" text-anchor="end">4%</text>${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${17 + c * 10.5}" y="${27 + r * 9.5}" width="8" height="7" rx="1.5" fill="#e9eef3"/>`).join('')).join('')}<rect x="17" y="55" width="0" height="0"/></svg>`;
  I.network = () => `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#2d93e0" stroke="#0a3566"/><path d="M8 32h48M32 8c-9 8-9 40 0 48M32 8c9 8 9 40 0 48" stroke="#cdeaff" fill="none" stroke-width="1.5"/></svg>`;
  I.music = () => `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#f39a1f" stroke="#a65c00"/><path d="M26 44V20l16-4v24" stroke="#fff" stroke-width="3" fill="none"/><circle cx="22" cy="44" r="5" fill="#fff"/><circle cx="38" cy="40" r="5" fill="#fff"/></svg>`;
  I.game = () => `<svg viewBox="0 0 64 64"><rect x="6" y="20" width="52" height="28" rx="14" fill="#4b5867" stroke="#1d242c" stroke-width="1.5"/><path d="M15 34h12M21 28v12" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="42" cy="30" r="3.5" fill="#ff6b6b"/><circle cx="48" cy="37" r="3.5" fill="#37d67a"/></svg>`;
  I.castle = () => `<svg viewBox="0 0 64 64"><path d="M10 58V26h6v5h6v-5h6v5h8v-5h6v5h6v-5h6v32z" fill="#8a7a66" stroke="#4a3f33"/><path d="M28 58V44a4 4 0 018 0v14z" fill="#3a2a1a"/><path d="M30 6v20M30 6l12 4-12 4" fill="#e5462e" stroke="#4a3f33"/></svg>`;
  I.phone = () => `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#2fb24a" stroke="#0b5c22"/><path d="M22 18c2-2 5-1 6 1l2 5c1 2 0 3-1 4l-2 2c2 4 5 7 9 9l2-2c1-1 2-2 4-1l5 2c2 1 3 4 1 6-6 6-15 1-21-5s-11-15-5-21z" fill="#fff"/></svg>`;
  I.camera = () => `<svg viewBox="0 0 64 64"><rect x="6" y="18" width="52" height="36" rx="6" fill="#2b2f36" stroke="#0e1014"/><path d="M22 18l4-7h12l4 7z" fill="#2b2f36" stroke="#0e1014"/><circle cx="32" cy="36" r="12" fill="#11151a" stroke="#6b7785" stroke-width="2"/><circle cx="32" cy="36" r="6" fill="#2d7bd6"/><circle cx="29" cy="33" r="2" fill="#fff" opacity=".7"/><circle cx="50" cy="25" r="2.5" fill="#ff4b4b"/></svg>`;
  I.mic = () => `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#14161c" stroke="#3a3f4a"/><rect x="25" y="13" width="14" height="25" rx="7" fill="#8fd6ff"/><path d="M19 32a13 13 0 0026 0M32 45v7M25 52h14" stroke="#cfe9ff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  I.film = () => `<svg viewBox="0 0 64 64"><rect x="8" y="10" width="48" height="44" rx="3" fill="#2b2f36" stroke="#0e1014"/>${[14, 24, 34, 44].map(y => `<rect x="11" y="${y}" width="5" height="5" fill="#fff"/><rect x="48" y="${y}" width="5" height="5" fill="#fff"/>`).join('')}<rect x="20" y="14" width="24" height="36" fill="#4aa3e8"/><path d="M28 24l10 8-10 8z" fill="#fff"/></svg>`;
  I.dashboard = () => `<svg viewBox="0 0 64 64"><rect x="6" y="10" width="52" height="42" rx="4" fill="#1d2633" stroke="#0b1018"/><rect x="11" y="16" width="18" height="12" rx="2" fill="#37d67a"/><rect x="33" y="16" width="20" height="12" rx="2" fill="#2fb6ff"/><path d="M12 46l8-8 6 4 10-10 8 6 8-8" stroke="#ffb84a" stroke-width="2.5" fill="none"/></svg>`;
  I.bolt = () => `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#1c2430" stroke="#0b1018"/><path d="M36 8L18 36h12l-4 20 20-30H34z" fill="#ffd34a" stroke="#a37a0b"/></svg>`;
  I.chart = () => `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="4" fill="#fff" stroke="#8796a5"/><rect x="15" y="34" width="7" height="16" fill="#2fb24a"/><rect x="26" y="24" width="7" height="26" fill="#2d7bd6"/><rect x="37" y="16" width="7" height="34" fill="#f39a1f"/></svg>`;
  I.paint = () => `<svg viewBox="0 0 64 64"><path d="M32 6C16 6 6 18 6 31s9 25 22 25c5 0 5-4 3-7s0-6 4-6h8c9 0 15-6 15-14C58 16 47 6 32 6z" fill="#f4e6c8" stroke="#8a7346"/><circle cx="20" cy="26" r="4" fill="#e5462e"/><circle cx="30" cy="17" r="4" fill="#ffd34a"/><circle cx="42" cy="19" r="4" fill="#2fb24a"/><circle cx="47" cy="30" r="4" fill="#2d7bd6"/></svg>`;
  I.drive = () => `<svg viewBox="0 0 64 64"><rect x="6" y="22" width="52" height="22" rx="4" fill="#c8d2dc" stroke="#69778a"/><rect x="6" y="22" width="52" height="8" rx="4" fill="#eef3f7"/><circle cx="48" cy="37" r="2.5" fill="#37d67a"/><rect x="12" y="35" width="24" height="3" rx="1.5" fill="#8b97a4"/></svg>`;
  I.lock = () => `<svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="8" rx="1.5" fill="#fff"/><path d="M5 7V5a3 3 0 016 0v2" stroke="#fff" stroke-width="1.8" fill="none"/></svg>`;
  I.power = () => `<svg viewBox="0 0 16 16"><path d="M8 1.5v6" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M4.4 4a5.3 5.3 0 107.2 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  I.arrowR = () => `<svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke="#fff" stroke-width="2" fill="none"/></svg>`;
  I.back = () => `<svg viewBox="0 0 16 16"><path d="M13 8H4M8 3L3 8l5 5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  I.fwd = () => `<svg viewBox="0 0 16 16"><path d="M3 8h9M8 3l5 5-5 5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  I.min = () => `<svg viewBox="0 0 11 11"><rect x="1.5" y="7" width="8" height="2.2" fill="#fff"/></svg>`;
  I.max = () => `<svg viewBox="0 0 11 11"><rect x="1.5" y="1.5" width="8" height="7.5" fill="none" stroke="#fff" stroke-width="1.6"/><rect x="1.5" y="1.5" width="8" height="2.4" fill="#fff"/></svg>`;
  I.restore = () => `<svg viewBox="0 0 11 11"><rect x="3.5" y=".8" width="6.5" height="5.5" fill="none" stroke="#fff" stroke-width="1.3"/><rect x=".8" y="4" width="6.5" height="6" fill="#d9e6f2" fill-opacity=".2" stroke="#fff" stroke-width="1.3"/></svg>`;
  I.close = () => `<svg viewBox="0 0 11 11"><path d="M2 2l7 7M9 2l-7 7" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/></svg>`;
  I.search = () => `<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.3" fill="none" stroke="#3b5f8a" stroke-width="1.8"/><path d="M10 10l4 4" stroke="#3b5f8a" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  I.volume = () => `<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z" fill="#fff"/><path d="M11 5c1.5 1.5 1.5 4.5 0 6M12.8 3.4c2.5 2.5 2.5 6.7 0 9.2" stroke="#fff" stroke-width="1.2" fill="none"/></svg>`;
  I.wifi = () => `<svg viewBox="0 0 16 16"><rect x="1" y="9" width="5" height="5" fill="#cfe9ff" stroke="#fff" stroke-width=".6"/><rect x="9" y="3" width="6" height="6" fill="#cfe9ff" stroke="#fff" stroke-width=".6"/><path d="M4 9V6h8" stroke="#fff" fill="none"/></svg>`;
  I.flip = () => `<svg viewBox="0 0 16 16"><rect x="1" y="5" width="9" height="8" fill="#8fd6ff" stroke="#fff" transform="skewY(-8)"/><rect x="5" y="3" width="9" height="8" fill="#2d7bd6" stroke="#fff" transform="skewY(-8)"/></svg>`;
  I.showdesk = () => `<svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="10" fill="#2fb24a" stroke="#fff"/><rect x="3" y="13" width="10" height="1.5" fill="#fff"/></svg>`;
  I.star = () => `<svg viewBox="0 0 16 16"><path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.8 3.8 14l.8-4.7L1.2 6l4.7-.7z" fill="#ffd34a" stroke="#c48a0c" stroke-width=".7"/></svg>`;
  I.orb = () => `<svg viewBox="0 0 32 32" class="glyph"><defs><radialGradient id="og" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bfe9ff"/></radialGradient></defs>
    <path d="M16 3c1.6 6.4 6.6 11.4 13 13-6.4 1.6-11.4 6.6-13 13-1.6-6.4-6.6-11.4-13-13 6.4-1.6 11.4-6.6 13-13z" fill="url(#og)" opacity=".95"/>
    <circle cx="16" cy="16" r="3.2" fill="#37d67a"/></svg>`;

  window.ICON = (name, ...a) => (I[name] ? I[name](...a) : I.doc());
  window.ICONS = I;
})();
