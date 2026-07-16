// $UD is created globally by ../libs/js/ulanzideckApi.js
let ACTION_SETTING = {};
let form = null;
let KEY_LABELS = { loading: 'updating…', updated: 'upd', offline: 'offline' };

// mirror of backend THEMES (swatches + preview)
const THEMES = {
  emerald: { bg: '#06140d', up: '#2ecc71', down: '#ff5d5d', track: '#103324', text: '#eafff3', muted: '#5f8a74', accent: '#34d399' },
  midnight:{ bg: '#0b1020', up: '#34d399', down: '#fb7185', track: '#1e293b', text: '#e2e8f0', muted: '#64748b', accent: '#38bdf8' },
  gold:    { bg: '#181203', up: '#ffd24a', down: '#ff6b6b', track: '#332708', text: '#fff7e0', muted: '#9a8650', accent: '#ffcf5c' },
  ocean:   { bg: '#011627', up: '#2ec4b6', down: '#e71d36', track: '#0a2a3a', text: '#cde7f0', muted: '#5b7a8a', accent: '#3aa0c4' },
  grape:   { bg: '#1a1030', up: '#4ade80', down: '#fb7185', track: '#2e1f4a', text: '#ede9fe', muted: '#8b7aa8', accent: '#a78bfa' },
  mono:    { bg: '#000000', up: '#ffffff', down: '#ff5b5b', track: '#222222', text: '#ffffff', muted: '#888888', accent: '#dddddd' },
  paper:   { bg: '#f5f7fa', up: '#16a34a', down: '#dc2626', track: '#dde3ea', text: '#0f172a', muted: '#64748b', accent: '#0284c7' },
  sand:    { bg: '#fbf6ec', up: '#2f855a', down: '#c53030', track: '#ece1cd', text: '#3b2f1e', muted: '#8a7a5f', accent: '#c05621' }
};

// mirror of backend currency table (code, name, symbol)
const CURRENCIES = [
  ['USD','US Dollar','$'],['EUR','Euro','€'],['GBP','British Pound','£'],['JPY','Japanese Yen','¥'],
  ['CNY','Chinese Yuan','¥'],['CHF','Swiss Franc','Fr'],['CAD','Canadian Dollar','$'],['AUD','Australian Dollar','$'],
  ['NZD','New Zealand Dollar','$'],['BRL','Brazilian Real','R$'],['MXN','Mexican Peso','$'],['ARS','Argentine Peso','$'],
  ['CLP','Chilean Peso','$'],['COP','Colombian Peso','$'],['PEN','Peruvian Sol','S/'],['UYU','Uruguayan Peso','$U'],
  ['BOB','Bolivian Boliviano','Bs'],['PYG','Paraguayan Guarani','₲'],['VES','Venezuelan Bolívar','Bs'],['GTQ','Guatemalan Quetzal','Q'],
  ['CRC','Costa Rican Colón','₡'],['DOP','Dominican Peso','RD$'],['HNL','Honduran Lempira','L'],['NIO','Nicaraguan Córdoba','C$'],
  ['PAB','Panamanian Balboa','B/'],['SEK','Swedish Krona','kr'],['NOK','Norwegian Krone','kr'],['DKK','Danish Krone','kr'],
  ['PLN','Polish Zloty','zł'],['CZK','Czech Koruna','Kč'],['HUF','Hungarian Forint','Ft'],['RON','Romanian Leu','lei'],
  ['ISK','Icelandic Króna','kr'],['TRY','Turkish Lira','₺'],['RUB','Russian Ruble','₽'],['UAH','Ukrainian Hryvnia','₴'],
  ['INR','Indian Rupee','₹'],['KRW','South Korean Won','₩'],['SGD','Singapore Dollar','$'],['HKD','Hong Kong Dollar','$'],
  ['TWD','New Taiwan Dollar','NT$'],['THB','Thai Baht','฿'],['IDR','Indonesian Rupiah','Rp'],['MYR','Malaysian Ringgit','RM'],
  ['PHP','Philippine Peso','₱'],['VND','Vietnamese Dong','₫'],['ZAR','South African Rand','R'],['AED','United Arab Emirates Dirham','AED'],
  ['SAR','Saudi Riyal','SAR'],['ILS','Israeli New Shekel','₪'],['EGP','Egyptian Pound','E£'],['NGN','Nigerian Naira','₦'],
  ['KES','Kenyan Shilling','Sh'],['MAD','Moroccan Dirham','MAD'],['AFN','Afghan Afghani','AFN'],['ALL','Albanian Lek','ALL'],
  ['AMD','Armenian Dram','֏'],['ANG','Netherlands Antillean Guilder','ƒ'],['AOA','Angolan Kwanza','AOA'],['AWG','Aruban Florin','ƒ'],
  ['AZN','Azerbaijani Manat','₼'],['BAM','Bosnia-Herzegovina Convertible Mark','BAM'],['BBD','Barbadian Dollar','$'],['BDT','Bangladeshi Taka','৳'],
  ['BGN','Bulgarian Lev','лв'],['BHD','Bahraini Dinar','BHD'],['BIF','Burundian Franc','BIF'],['BMD','Bermudan Dollar','$'],
  ['BND','Brunei Dollar','$'],['BSD','Bahamian Dollar','$'],['BTN','Bhutanese Ngultrum','BTN'],['BWP','Botswanan Pula','P'],
  ['BYN','Belarusian Ruble','BYN'],['BZD','Belize Dollar','$'],['CDF','Congolese Franc','CDF'],['CUP','Cuban Peso','CUP'],
  ['CVE','Cape Verdean Escudo','CVE'],['DJF','Djiboutian Franc','DJF'],['DZD','Algerian Dinar','DZD'],['ERN','Eritrean Nakfa','ERN'],
  ['ETB','Ethiopian Birr','ETB'],['FJD','Fijian Dollar','$'],['FKP','Falkland Islands Pound','£'],['FOK','FOK','FOK'],
  ['GEL','Georgian Lari','₾'],['GGP','GGP','£'],['GHS','Ghanaian Cedi','₵'],['GIP','Gibraltar Pound','£'],
  ['GMD','Gambian Dalasi','GMD'],['GNF','Guinean Franc','GNF'],['GYD','Guyanaese Dollar','$'],['HRK','Croatian Kuna','HRK'],
  ['HTG','Haitian Gourde','HTG'],['IMP','IMP','£'],['IQD','Iraqi Dinar','IQD'],['IRR','Iranian Rial','﷼'],
  ['JEP','JEP','£'],['JMD','Jamaican Dollar','$'],['JOD','Jordanian Dinar','JOD'],['KGS','Kyrgystani Som','KGS'],
  ['KHR','Cambodian Riel','៛'],['KMF','Comorian Franc','KMF'],['KWD','Kuwaiti Dinar','KWD'],['KYD','Cayman Islands Dollar','$'],
  ['KZT','Kazakhstani Tenge','₸'],['LAK','Laotian Kip','₭'],['LBP','Lebanese Pound','£'],['LKR','Sri Lankan Rupee','₨'],
  ['LRD','Liberian Dollar','$'],['LSL','Lesotho Loti','LSL'],['LYD','Libyan Dinar','LYD'],['MDL','Moldovan Leu','MDL'],
  ['MGA','Malagasy Ariary','MGA'],['MKD','Macedonian Denar','MKD'],['MMK','Myanmar Kyat','MMK'],['MNT','Mongolian Tugrik','₮'],
  ['MOP','Macanese Pataca','MOP$'],['MRU','Mauritanian Ouguiya','MRU'],['MUR','Mauritian Rupee','₨'],['MVR','Maldivian Rufiyaa','MVR'],
  ['MWK','Malawian Kwacha','MWK'],['MZN','Mozambican Metical','MZN'],['NAD','Namibian Dollar','$'],['NPR','Nepalese Rupee','₨'],
  ['OMR','Omani Rial','﷼'],['PGK','Papua New Guinean Kina','PGK'],['PKR','Pakistani Rupee','₨'],['QAR','Qatari Riyal','﷼'],
  ['RSD','Serbian Dinar','RSD'],['RWF','Rwandan Franc','RWF'],['SBD','Solomon Islands Dollar','$'],['SCR','Seychellois Rupee','₨'],
  ['SDG','Sudanese Pound','£'],['SHP','St. Helena Pound','£'],['SLE','Sierra Leonean Leone','SLE'],['SOS','Somali Shilling','SOS'],
  ['SRD','Surinamese Dollar','$'],['SSP','South Sudanese Pound','£'],['STN','São Tomé & Príncipe Dobra','STN'],['SYP','Syrian Pound','£'],
  ['SZL','Swazi Lilangeni','SZL'],['TJS','Tajikistani Somoni','TJS'],['TMT','Turkmenistani Manat','TMT'],['TND','Tunisian Dinar','TND'],
  ['TOP','Tongan Paʻanga','TOP'],['TTD','Trinidad & Tobago Dollar','$'],['TZS','Tanzanian Shilling','TZS'],['UGX','Ugandan Shilling','UGX'],
  ['UZS','Uzbekistani Som','UZS'],['VUV','Vanuatu Vatu','VUV'],['WST','Samoan Tala','WST'],['XAF','Central African CFA Franc','XAF'],
  ['XCD','East Caribbean Dollar','$'],['XOF','West African CFA Franc','XOF'],['XPF','CFP Franc','XPF'],['YER','Yemeni Rial','﷼'],
  ['ZMW','Zambian Kwacha','ZMW'],['ZWL','Zimbabwean Dollar (2009–2024)','ZWL'],
  ['CNH','Chinese Yuan (Offshore)','¥'],['CLF','Chilean UF','CLF'],['SLL','Sierra Leonean Leone','SLL'],['ZWG','Zimbabwe Gold','ZWG'],
  ['KID','Kiribati Dollar','$'],['TVD','Tuvaluan Dollar','$'],['XDR','IMF SDR','SDR'],['XCG','Caribbean Guilder','ƒ']
];
const SYMBOL = {}; CURRENCIES.forEach(([c, , s]) => SYMBOL[c] = s);

function flag(code) {
  if (code === 'EUR') return '🇪🇺';
  if (code[0] === 'X' || code === 'ANG') return '🌐';   // supranational / no single country
  const cc = code.slice(0, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '🏳';
  return String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

$UD.connect('com.currency.converter.deck.convert');

$UD.onConnected(() => {
  form = document.querySelector('#property-inspector');
  document.querySelector('.udpi-wrapper').classList.remove('hidden');

  buildCurrencySelect('from'); buildCurrencySelect('to');
  buildSwatches(); buildSeg();

  document.getElementById('swap').addEventListener('click', () => {
    const f = document.getElementById('from').value, t = document.getElementById('to').value;
    document.getElementById('from').value = t; document.getElementById('to').value = f;
    collectAndSend(); renderPreview();
  });
  document.getElementById('btn-refresh').addEventListener('click', () => {
    $UD.sendParamFromPlugin({ forceRefresh: Date.now() }); pulse('btn-refresh');
  });
  document.getElementById('btn-tutorial').addEventListener('click', () => {
    $UD.openUrl('./property-inspector/tutorial.html#lang=' + ($UD.language || 'en'), true);
  });

  const deb = Utils.debounce(() => { collectAndSend(); renderPreview(); }, 200);
  form.addEventListener('input', deb);
  ['from', 'to', 'amount', 'decimals', 'intervalMin', 'font'].forEach(id => {
    const el = document.getElementById(id); if (el) el.addEventListener('change', () => { collectAndSend(); renderPreview(); });
  });

  startPreview();
  loadTranslations();
});

// translate currency names to the user's language natively (no hardcoded list).
// Intl.DisplayNames knows every ISO 4217 currency in every locale; fall back to
// the English name only if the runtime can't resolve it.
let _curNames = null;
function currencyNamer() {
  if (_curNames !== null) return _curNames;
  try {
    const loc = String($UD.language || 'en').replace('_', '-');
    _curNames = new Intl.DisplayNames([loc, 'en'], { type: 'currency' });
  } catch (e) { _curNames = false; }
  return _curNames;
}
function currencyName(code, fallback) {
  const dn = currencyNamer();
  if (dn) { try { const n = dn.of(code); if (n && n !== code) return n; } catch (e) {} }
  return fallback;
}
function buildCurrencySelect(id) {
  const sel = document.getElementById(id); sel.innerHTML = '';
  for (const [code, name] of CURRENCIES) {
    const o = document.createElement('option');
    o.value = code; o.textContent = `${flag(code)}  ${code} — ${currencyName(code, name)}`;
    sel.appendChild(o);
  }
}

function buildSwatches() {
  const wrap = document.getElementById('theme-swatches'); wrap.innerHTML = '';
  Object.keys(THEMES).forEach(name => {
    const tm = THEMES[name];
    const el = document.createElement('div'); el.className = 'theme-swatch'; el.dataset.theme = name; el.title = name;
    el.innerHTML = `<i style="background:${tm.bg}"></i><i style="background:${tm.up}"></i><i style="background:${tm.accent}"></i>`;
    el.addEventListener('click', () => { document.getElementById('theme').value = name; highlightTheme(name); collectAndSend(); renderPreview(); });
    wrap.appendChild(el);
  });
}
function highlightTheme(name) { document.querySelectorAll('.theme-swatch').forEach(el => el.classList.toggle('active', el.dataset.theme === name)); }

function buildSeg() {
  document.querySelectorAll('#screen-seg button').forEach(b => b.addEventListener('click', () => {
    document.getElementById('screenMode').value = b.dataset.mode; highlightSeg(b.dataset.mode); collectAndSend(); renderPreview();
  }));
  highlightSeg(document.getElementById('screenMode').value || '0');
}
function highlightSeg(m) { document.querySelectorAll('#screen-seg button').forEach(b => b.classList.toggle('active', b.dataset.mode === String(m))); }

function pulse(id) { const b = document.getElementById(id); if (!b) return; b.style.transform = 'scale(0.96)'; setTimeout(() => b.style.transform = '', 130); }

// ── preview (demo rate; mirrors the key layout) ─────────────────────────────────
const pv = { frame: 0, active: false };
let pvTimer = null;
// only advance/redraw when something actually animates (anim glow or a marquee);
// otherwise the preview is static and the timer does nothing but a cheap flag check.
// live preview removed (caused flicker + extra CPU while editing the key)
function startPreview() {}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function fmtNum(v, d) { const dd = d == null ? (v >= 1000 ? 0 : v >= 1 ? 2 : 4) : d; const [i, f] = v.toFixed(dd).split('.'); const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, ','); return f ? g + '.' + f : g; }
function demoRate(from, to) { // stable pseudo rate just for the preview
  if (from === to) return 1;
  const h = [...(from + to)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return 0.2 + (h % 900) / 100;
}

function renderPreview() {
  const el = document.getElementById('preview'); if (!el) return;
  const from = document.getElementById('from').value || 'USD';
  const to = document.getElementById('to').value || 'BRL';
  const amount = parseFloat(document.getElementById('amount').value) || 1;
  const decRaw = document.getElementById('decimals').value;
  const decimals = decRaw === '' ? null : parseInt(decRaw, 10);
  const theme = document.getElementById('theme').value || 'emerald';
  const font = document.getElementById('font').value || 'sans';
  const mode = parseInt(document.getElementById('screenMode').value, 10) || 0;
  const anim = document.getElementById('anim').checked;
  const t = THEMES[theme] || THEMES.emerald;
  const af = pv.frame;
  const rate = demoRate(from, to);
  const conv = amount * rate;
  // mirror the backend: symbols the vector font lacks fall back to the ISO code
  const NOGLYPH = new Set(['₲', '₡', '₴', '฿', '֏', '৳', '₸', '₾', '₭', '₮', '៛', '﷼']);
  const rawSym = SYMBOL[to] || '';
  const toS = [...rawSym].some(c => NOGLYPH.has(c)) ? (to + ' ') : rawSym;
  const wob = Math.sin(af * 0.2);
  const dir = wob > 0.2 ? 'up' : wob < -0.2 ? 'down' : 'flat';
  const dc = dir === 'up' ? t.up : dir === 'down' ? t.down : t.muted;
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '•';
  const amt = amount !== 1 ? `${fmtNum(amount, amount >= 1000 ? 0 : 2)} ` : '';
  const header = `${amt}${from} → ${to}`;
  const pairOnly = `${from} → ${to}`;
  const fit = (s, b) => Math.round(s.length <= 6 ? b : s.length <= 8 ? b * 0.82 : s.length <= 10 ? b * 0.68 : b * 0.56);
  // shrink the value to fit the key width (estimate latin glyph width)
  const fitW = (s, base, maxW = 234) => { let z = base; const w = (x) => String(s).length * x * 0.58; while (w(z) > maxW && z > base * 0.6) z -= 1; return Math.round(z); };
  // shrink-then-marquee, mirrors backend bigText(); container clips overflow
  const bigText = (text, cx, cy, base, fill, maxW, frame) => {
    const ew = (sz) => String(text).length * sz * 0.58;
    let s = base; const minS = Math.round(base * 0.6);
    while (ew(s) > maxW && s > minS) s -= 1; s = Math.round(s);
    if (ew(s) <= maxW) return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="${fill}" font-size="${s}" font-weight="bold" font-family="Arial">${esc(text)}</text>`;
    const w = ew(s), left = cx - maxW / 2, gap = 30, period = w + gap, ofs = ((frame || 0) * 1.4) % period;
    const one = (x0) => `<text x="${x0}" y="${cy}" dominant-baseline="middle" fill="${fill}" font-size="${s}" font-weight="bold" font-family="Arial">${esc(text)}</text>`;
    return `<g>${one(left - ofs)}${one(left - ofs + period)}</g>`;
  };
  // header <text> marquee when it overflows (no shrink — just scroll)
  const marqText = (text, cx, cy, size, fill, maxW, frame, anchor) => {
    const ew = String(text).length * size * 0.58;
    const tx = (x, an) => `<text x="${x}" y="${cy}"${an === 'middle' ? ' text-anchor="middle"' : ''} fill="${fill}" font-size="${size}" font-weight="bold" font-family="Arial">${esc(text)}</text>`;
    if (ew <= maxW) return tx(cx, anchor);
    const left = anchor === 'middle' ? cx - maxW / 2 : cx, gap = 30, period = ew + gap, ofs = ((frame || 0) * 1.4) % period;
    return `<g>${tx(left - ofs, 'start')}${tx(left - ofs + period, 'start')}</g>`;
  };
  const convStr = toS + fmtNum(conv, decimals);
  const pct = (wob * 1.4).toFixed(2) + '%';
  const samples = Array.from({ length: 16 }, (_, i) => rate * (1 + Math.sin((i + af * 0.3) * 0.5) * 0.04));

  let defs = '', body = '';
  if (anim) { const gx = (128 + Math.sin(af * 0.05) * 90).toFixed(1); defs += `<radialGradient id="sw" cx="0.5" cy="0.5" r="0.5" gradientUnits="userSpaceOnUse" gradientTransform="translate(${gx} 70)"><stop offset="0" stop-color="${t.accent}" stop-opacity="0.18"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>`; body += `<circle cx="${gx}" cy="70" r="150" fill="url(#sw)"/>`; }

  if (mode === 2) {
    body += marqText(header, 128, 48, 22, t.muted, 234, af, 'middle');
    body += bigText(convStr, 128, 132, 64, t.text, 234, af);
    body += `<text x="128" y="200" text-anchor="middle" fill="${dc}" font-size="24" font-weight="bold" font-family="Arial">${esc(to)} ${arrow}</text>`;
  } else if (mode === 1) {
    body += marqText(pairOnly, 22, 40, 23, t.accent, 212, af, 'start');
    body += spark(samples, 22, 70, 212, 92, dc, t.track);
    body += `<text x="22" y="198" fill="${t.text}" font-size="${Math.min(42, fitW(convStr, 44, 150))}" font-weight="bold" font-family="Arial">${esc(convStr)}</text>`;
    body += `<text x="234" y="204" text-anchor="end" fill="${dc}" font-size="24" font-weight="bold" font-family="Arial">${arrow} ${esc(pct)}</text>`;
  } else {
    body += marqText(header, 128, 46, 26, t.accent, 234, af, 'middle');
    body += `<line x1="34" y1="60" x2="222" y2="60" stroke="${t.track}" stroke-width="2"/>`;
    body += bigText(convStr, 128, 120, 60, t.text, 234, af);
    body += `<text x="128" y="174" text-anchor="middle" fill="${t.muted}" font-size="18" font-family="Arial">1 ${esc(from)} = ${fmtNum(rate, rate >= 1000 ? 2 : 4)} ${esc(to)}</text>`;
    body += `<text x="128" y="210" text-anchor="middle" fill="${dc}" font-size="24" font-weight="bold" font-family="Arial">${arrow} ${esc(pct)}</text>`;
  }
  body += `<text x="128" y="244" text-anchor="middle" fill="${t.muted}" font-size="20" font-family="Arial" opacity="0.85">${esc((KEY_LABELS.updated || 'upd') + ' 09:30')}</text>`;

  // decide if the preview needs to keep animating (saves CPU when static)
  const ewLen = (s, sz) => String(s).length * sz * 0.58;
  const hdrStr = mode === 1 ? pairOnly : header, hdrSz = mode === 1 ? 23 : (mode === 2 ? 22 : 26), hdrMax = mode === 1 ? 212 : 234;
  pv.active = anim || ewLen(hdrStr, hdrSz) > hdrMax ||
    (mode !== 1 && ewLen(convStr, Math.round((mode === 2 ? 64 : 60) * 0.6)) > 234);

  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${defs ? `<defs>${defs}</defs>` : ''}<rect width="256" height="256" fill="${t.bg}"/>${body}</svg>`;
}
function spark(s, x0, y0, w, h, color, track) {
  const lo = Math.min(...s), hi = Math.max(...s), rng = (hi - lo) || 1;
  const pts = s.map((v, i) => `${(x0 + (i / (s.length - 1)) * w).toFixed(1)},${(y0 + h - ((v - lo) / rng) * h).toFixed(1)}`);
  const last = pts[pts.length - 1].split(',');
  return `<polygon points="${x0},${y0 + h} ${pts.join(' ')} ${x0 + w},${y0 + h}" fill="${color}" opacity="0.12"/>` +
         `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>` +
         `<circle cx="${last[0]}" cy="${last[1]}" r="4" fill="${color}"/>`;
}

// ── translations ────────────────────────────────────────────────────────────────
async function loadTranslations() {
  try {
    let data;
    try { data = await Utils.readJson(`${Utils.getPluginPath()}/${$UD.language}.json?t=${Date.now()}`); }
    catch (e) {
      const lang = ($UD.language || '').startsWith('pt') ? 'pt_BR' : 'en';
      data = await Utils.readJson(`${Utils.getPluginPath()}/${lang}.json?t=${Date.now()}`);
    }
    const loc = data?.Localization || {};
    KEY_LABELS = { loading: loc.loading || KEY_LABELS.loading, updated: loc.updated || KEY_LABELS.updated, offline: loc.offline || KEY_LABELS.offline };
  } catch (e) { /* keep defaults */ }
  collectAndSend(); renderPreview();
}

function collectAndSend() {
  if (!form) return;
  const v = Utils.getFormValue(form);
  ACTION_SETTING = { ...ACTION_SETTING, ...v };
  $UD.sendParamFromPlugin({ ...ACTION_SETTING, ...KEY_LABELS });
}

function applySettings(p) {
  if (!p) return;
  ACTION_SETTING = { ...ACTION_SETTING, ...p };
  if (!form) return;
  Utils.setFormValue(ACTION_SETTING, form);
  if (p.from) document.getElementById('from').value = p.from;
  if (p.to) document.getElementById('to').value = p.to;
  document.getElementById('theme').value = ACTION_SETTING.theme || 'emerald';
  document.getElementById('font').value = ACTION_SETTING.font || 'sans';
  document.getElementById('screenMode').value = ACTION_SETTING.screenMode != null ? ACTION_SETTING.screenMode : 0;
  highlightTheme(document.getElementById('theme').value);
  highlightSeg(document.getElementById('screenMode').value);
  renderPreview();
}

$UD.onAdd((jsn) => { if (jsn.param) applySettings(jsn.param); renderPreview(); });
$UD.onParamFromApp((jsn) => { if (jsn.param) applySettings(jsn.param); });
$UD.onParamFromPlugin((jsn) => { if (jsn.param && !jsn.param.forceRefresh) applySettings(jsn.param); });
