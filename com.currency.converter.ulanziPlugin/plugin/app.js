import UlanzideckApi from '../libs/node/ulanzideckApi.js';
import https from 'https';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import opentype from 'opentype.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_VERSION = '1.0.1';
const DEBUG = process.env.CURRENCY_DEBUG === '1';

function log(...a) { if (DEBUG) console.log('[Currency]', ...a); }

// ── persistence (sparkline samples per pair survive reloads) ──────────────────
const DATA_DIR = (() => {
  const base = os.platform() === 'darwin'
    ? path.join(os.homedir(), 'Library', 'Application Support')
    : (process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'));
  const d = path.join(base, 'UlanziDeck', 'com.currency.converter.deck');
  try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
  return d;
})();
const SAMPLE_FILE = path.join(DATA_DIR, 'samples.json');

// ── color themes ──────────────────────────────────────────────────────────────
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

// ── currency table (code, name, symbol) — vast list, all on open.er-api ─────────
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
const SYMBOL = {}; const NAME = {};
for (const [c, n, s] of CURRENCIES) { SYMBOL[c] = s; NAME[c] = n; }

// ── vector fonts (digits/letters as real glyph paths) ──────────────────────────
const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const FONT_FILES = { sans: 'sans.ttf', mono: 'mono.ttf', serif: 'serif.ttf', display: 'display.ttf' };
const _fontCache = {};
function loadFont(key) {
  if (key in _fontCache) return _fontCache[key];
  try { _fontCache[key] = opentype.parse(fs.readFileSync(path.join(FONT_DIR, FONT_FILES[key] || FONT_FILES.sans)).buffer); }
  catch (e) { log('font fail', key, e.message); _fontCache[key] = null; }
  return _fontCache[key];
}
function textPath(font, text, size) {
  const p = new opentype.Path(); let x = 0; const sc = size / font.unitsPerEm;
  for (const ch of String(text)) { const g = font.charToGlyph(ch); p.extend(g.getPath(x, 0, size)); x += g.advanceWidth * sc; }
  return p;
}
// glyph geometry cache: building opentype paths is the hot path during marquee
// (same string re-rendered ~5×/s). Cache the heavy bits (pathData + bbox) keyed
// by font|size|text so a frame is just a cheap translate string.
const _geomCache = new Map();
function geom(fontKey, text, size) {
  const k = fontKey + '|' + size + '|' + text;
  let v = _geomCache.get(k);
  if (v !== undefined) return v;
  const font = loadFont(fontKey);
  if (!font) { v = null; }
  else {
    const p = textPath(font, text, size); const bb = p.getBoundingBox();
    let adv = 0; const sc = size / font.unitsPerEm;
    for (const ch of String(text)) adv += font.charToGlyph(ch).advanceWidth * sc;
    v = { d: p.toPathData(2), x1: bb.x1, x2: bb.x2, y1: bb.y1, y2: bb.y2, adv };
  }
  if (_geomCache.size > 500) _geomCache.clear();
  _geomCache.set(k, v);
  return v;
}
function glyph(fontKey, text, cx, cy, size, fill, anchor = 'middle') {
  const g = geom(fontKey, text, size);
  if (!g) return `<text x="${cx}" y="${cy}" text-anchor="${anchor}" dominant-baseline="middle" fill="${fill}" font-size="${size}" font-weight="bold" font-family="Arial, Helvetica, sans-serif">${esc(text)}</text>`;
  const w = g.x2 - g.x1, h = g.y2 - g.y1;
  let dx = cx - g.x1; if (anchor === 'middle') dx = cx - (g.x1 + w / 2); else if (anchor === 'end') dx = cx - g.x2;
  const dy = cy - (g.y1 + h / 2);
  return `<path transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})" d="${g.d}" fill="${fill}"/>`;
}
// true when the chosen vector font can draw every char (else it renders .notdef tofu)
const _hasGlyphCache = new Map();
function hasGlyphs(fontKey, str) {
  const k = fontKey + '|' + str;
  let v = _hasGlyphCache.get(k);
  if (v !== undefined) return v;
  const font = loadFont(fontKey);
  v = true;
  if (font) for (const ch of String(str)) { if (ch === ' ') continue; if (font.charToGlyphIndex(ch) === 0) { v = false; break; } }
  if (_hasGlyphCache.size > 500) _hasGlyphCache.clear();
  _hasGlyphCache.set(k, v);
  return v;
}
// pixel width of a vector string (for overflow / marquee decisions) — cached
function textWidth(fontKey, text, size) {
  const g = geom(fontKey, text, size);
  return g ? g.adv : String(text).length * size * 0.6;
}
// Big centered text. Shrinks first (down to a readable minimum) so values stay
// big but fit; only marquee-scrolls when it still overflows at the minimum size.
function bigText(fontKey, text, cx, cy, size, fill, maxW, af) {
  const minS = Math.round(size * 0.6);
  let s = size, w = textWidth(fontKey, text, s);
  while (w > maxW && s > minS) { s -= 2; w = textWidth(fontKey, text, s); }
  if (w <= maxW) return glyph(fontKey, text, cx, cy, s, fill, 'middle');
  const left = cx - maxW / 2, gap = 30, period = w + gap;
  const off = ((af || 0) * 1.4) % period;
  const one = (x0) => glyph(fontKey, text, x0, cy, s, fill, 'start');
  return `<g>${one(left - off)}${one(left - off + period)}</g>`;
}
// header <text> that marquee-scrolls when it overflows maxW. anchor: 'middle'|'start'.
function marqText(fontKey, text, cx, cy, size, fill, maxW, af, anchor) {
  const tx = (x, an) => `<text x="${x.toFixed ? x.toFixed(1) : x}" y="${cy}"${an === 'middle' ? ' text-anchor="middle"' : ''} fill="${fill}" font-size="${size}" font-weight="bold" font-family="Arial, Helvetica, sans-serif">${esc(text)}</text>`;
  const w = textWidth(fontKey, text, size);
  if (w <= maxW) return tx(cx, anchor);
  const left = anchor === 'middle' ? cx - maxW / 2 : cx;
  const gap = 30, period = w + gap, off = ((af || 0) * 1.4) % period;
  return `<g>${tx(left - off, 'start')}${tx(left - off + period, 'start')}</g>`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── number formatting ──────────────────────────────────────────────────────────
function fmtNum(v, decimals) {
  if (!isFinite(v)) return '—';
  const d = (decimals == null) ? (v >= 1000 ? 0 : v >= 1 ? 2 : 4) : decimals;
  const fixed = v.toFixed(d);
  const [intp, frac] = fixed.split('.');
  const grouped = intp.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? grouped + '.' + frac : grouped;
}

// ── sparkline ──────────────────────────────────────────────────────────────────
function buildSpark(samples, x0, y0, w, h, color, track) {
  if (!samples || samples.length < 2) {
    return `<line x1="${x0}" y1="${(y0 + h / 2).toFixed(1)}" x2="${x0 + w}" y2="${(y0 + h / 2).toFixed(1)}" stroke="${track}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 8" opacity="0.7"/>`;
  }
  const lo = Math.min(...samples), hi = Math.max(...samples), rng = (hi - lo) || 1;
  const pts = samples.map((v, i) => {
    const x = x0 + (i / (samples.length - 1)) * w;
    const y = y0 + h - ((v - lo) / rng) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `${x0},${(y0 + h).toFixed(1)} ` + pts.join(' ') + ` ${x0 + w},${(y0 + h).toFixed(1)}`;
  return `<polygon points="${area}" fill="${color}" opacity="0.12"/>` +
         `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>` +
         `<circle cx="${pts[pts.length - 1].split(',')[0]}" cy="${pts[pts.length - 1].split(',')[1]}" r="4" fill="${color}"/>`;
}

// ── SVG key renderer ────────────────────────────────────────────────────────────
function generateSVG(o) {
  const t = THEMES[o.theme] || THEMES.emerald;
  const af = o.animFrame || 0;
  const dir = o.dir || 'flat';
  const dirColor = dir === 'up' ? t.up : dir === 'down' ? t.down : t.muted;
  // currency symbol → fall back to the ISO code when the vector font lacks the
  // glyph (e.g. ₮ ₭ ฿ ₡ …), so the key never shows a .notdef "tofu" box.
  const safeSym = (code) => { const s = SYMBOL[code] || code; return hasGlyphs(o.font, s) ? s : (code + ' '); };
  const fromS = safeSym(o.from); const toS = safeSym(o.to);
  const L = o.labels || {};

  let defs = '', body = '';

  // header: amount + FROM → TO  (compact arrow so it never overflows)
  const amt = (o.amount != null && o.amount !== 1) ? `${fmtNum(o.amount, o.amount >= 1000 ? 0 : 2)} ` : '';
  const header = `${amt}${o.from} → ${o.to}`;
  const pairOnly = `${o.from} → ${o.to}`;
  const mode = o.screenMode || 0;
  // shrink the big value as it gets longer so it always fits the 256px key
  const fit = (s, b) => Math.round(s.length <= 6 ? b : s.length <= 8 ? b * 0.82 : s.length <= 10 ? b * 0.68 : b * 0.56);

  if (o.loading && o.rate == null) {
    body += glyph(o.font, '…', 128, 128, 60, t.muted);
    body += `<text x="128" y="180" text-anchor="middle" fill="${t.muted}" font-size="15" font-family="Arial, Helvetica, sans-serif">${esc(L.loading || 'updating…')}</text>`;
    return wrap(t, defs, body);
  }

  const conv = (o.rate != null) ? o.amount * o.rate : null;
  const convStr = conv != null ? toS + fmtNum(conv, o.decimals) : '—';
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '•';
  const pctStr = (o.changePct != null && isFinite(o.changePct)) ? `${o.changePct >= 0 ? '+' : ''}${o.changePct.toFixed(2)}%` : '';

  if (mode === 2) {
    // ── MINIMAL: pair tiny on top, big converted value, code below ──
    body += marqText(o.font, header, 128, 48, 22, t.muted, 234, af, 'middle');
    body += bigText(o.font, convStr, 128, 132, 64, t.text, 234, af);
    body += `<text x="128" y="200" text-anchor="middle" fill="${dirColor}" font-size="24" font-weight="bold" font-family="Arial, Helvetica, sans-serif">${esc(o.to)} ${arrow}</text>`;
  } else if (mode === 1) {
    // ── CHART: pair header (no amount → no overflow), sparkline, value + change ──
    body += marqText(o.font, pairOnly, 22, 40, 23, t.accent, 212, af, 'start');
    body += buildSpark(o.samples, 22, 66, 212, 88, dirColor, t.track);
    body += glyph(o.font, convStr, 22, 198, Math.min(42, fit(convStr, 44)), t.text, 'start');
    if (pctStr) body += `<text x="234" y="204" text-anchor="end" fill="${dirColor}" font-size="24" font-weight="bold" font-family="Arial, Helvetica, sans-serif">${arrow} ${esc(pctStr)}</text>`;
  } else {
    // ── CLASSIC: header, big converted value, rate line, change ──
    body += marqText(o.font, header, 128, 46, 26, t.accent, 234, af, 'middle');
    body += `<line x1="34" y1="60" x2="222" y2="60" stroke="${t.track}" stroke-width="2"/>`;
    body += bigText(o.font, convStr, 128, 120, 60, t.text, 234, af);
    const rateLine = (o.rate != null) ? `1 ${o.from} = ${fmtNum(o.rate, o.rate >= 1000 ? 2 : 4)} ${o.to}` : (L.offline || 'offline');
    body += `<text x="128" y="174" text-anchor="middle" fill="${t.muted}" font-size="18" font-family="Arial, Helvetica, sans-serif">${esc(rateLine)}</text>`;
    if (pctStr) body += `<text x="128" y="210" text-anchor="middle" fill="${dirColor}" font-size="24" font-weight="bold" font-family="Arial, Helvetica, sans-serif">${arrow} ${esc(pctStr)}</text>`;
  }

  // footer: last local check time — stays put (no "updating…" swap) so a refresh
  // never blinks the key. A tiny dot marks in-flight; a red dot marks an error.
  if (o.updated) {
    body += `<text x="128" y="244" text-anchor="middle" fill="${t.muted}" font-size="20" font-family="Arial, Helvetica, sans-serif" opacity="0.85">${esc((L.updated || 'upd') + ' ' + o.updated)}</text>`;
  }
  if (o.loading && o.rate != null) body += `<circle cx="238" cy="18" r="4" fill="${t.accent}" opacity="0.9"/>`;
  else if (o.error && o.rate != null) body += `<circle cx="238" cy="18" r="4" fill="${t.down}"/>`;

  return wrap(t, defs, body);
}
function wrap(t, defs, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">${defs ? `<defs>${defs}</defs>` : ''}<rect width="256" height="256" fill="${t.bg}"/>${body}</svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// ── HTTPS get with timeout ──────────────────────────────────────────────────────
function httpGet(url, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'UlanziCurrencyConverter/1.0' } }, (r) => {
      if (r.statusCode < 200 || r.statusCode >= 300) { r.resume(); return reject(new Error('HTTP ' + r.statusCode)); }
      let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(new Error('timeout')); });
  });
}

// ── shared FX rate cache ─────────────────────────────────────────────────────────
// Every key on the same base currency shares ONE network fetch + parse instead of
// N. A fetched table is reused for 60s, and concurrent requests are coalesced, so
// 20 keys cost the same as 1.
const _rateCache = new Map();    // base -> { ts, rates }
const _rateInflight = new Map(); // base -> Promise<{rates}>
const RATE_TTL = 60 * 1000;
// primary: open.er-api.com (uppercase-keyed rates)
function fetchPrimary(base) {
  return httpGet(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`).then((raw) => {
    const j = JSON.parse(raw);
    if (j.result !== 'success' || !j.rates) throw new Error('primary: no rates');
    return j.rates;
  });
}
// fallback: jsDelivr currency-api (@fawazahmed0) — works where the primary is
// blocked/unreachable (e.g. some restricted networks). Lowercase codes → normalize
// to the same UPPERCASE shape the rest of the code expects.
function fetchFallback(base) {
  const b = base.toLowerCase();
  return httpGet(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${encodeURIComponent(b)}.json`).then((raw) => {
    const j = JSON.parse(raw);
    const m = j[b];
    if (!m) throw new Error('fallback: no rates');
    const out = {};
    for (const k in m) out[k.toUpperCase()] = m[k];
    return out;
  });
}
function getRates(base) {
  const c = _rateCache.get(base);
  if (c && Date.now() - c.ts < RATE_TTL) return Promise.resolve(c);
  const pending = _rateInflight.get(base);
  if (pending) return pending;
  const p = fetchPrimary(base)
    .catch((e) => { log('rate primary fail, trying fallback:', e.message); return fetchFallback(base); })
    .then((rates) => { const entry = { ts: Date.now(), rates }; _rateCache.set(base, entry); return entry; })
    .finally(() => { _rateInflight.delete(base); });
  _rateInflight.set(base, p);
  return p;
}

// ── shared sample store ──────────────────────────────────────────────────────────
// One in-memory copy + one debounced writer for ALL keys (was N reads + N clobbering
// writes of the same file).
let _samples = null, _samplesSaveT = null;
function samplesStore() {
  if (!_samples) { try { _samples = JSON.parse(fs.readFileSync(SAMPLE_FILE, 'utf8')) || {}; } catch (e) { _samples = {}; } }
  return _samples;
}
function saveSamplesStore() {
  if (_samplesSaveT) clearTimeout(_samplesSaveT);
  _samplesSaveT = setTimeout(() => { try { fs.writeFileSync(SAMPLE_FILE, JSON.stringify(_samples || {})); } catch (e) {} }, 5000);
}

// ── single shared animation ticker ───────────────────────────────────────────────
// One setInterval drives every key that needs motion, regardless of key count.
// Empty set => no timer at all (zero idle CPU).
const _animSet = new Set();
let _animTimer = null;
let _addSeq = 0; // staggers each new key's first fetch (see constructor)
// fewer frames per second as more keys animate at once — keeps total render load
// roughly flat no matter how many keys are on the deck.
function _animInterval() { const n = _animSet.size; return n <= 2 ? 200 : n <= 4 ? 300 : 450; }
function _animRestart() {
  if (_animTimer) { clearInterval(_animTimer); _animTimer = null; }
  if (_animSet.size) _animTimer = setInterval(() => { for (const it of _animSet) { it.animFrame++; it.render(); } }, _animInterval());
}
function animJoin(inst) { _animSet.add(inst); _animRestart(); }
function animLeave(inst) { _animSet.delete(inst); _animRestart(); }

// ── Converter instance ──────────────────────────────────────────────────────────
class Converter {
  constructor(context, $UD) {
    this.$UD = $UD; this.context = context;
    this.config = {
      from: 'USD', to: 'BRL', amount: 1, decimals: null,
      intervalMin: 60, theme: 'emerald', font: 'sans', screenMode: 0,
      labels: {}
    };
    this.rate = null; this.prevRate = null; this.dir = 'flat'; this.changePct = null;
    this.samples = []; this.updated = ''; this.error = false; this.loading = false;
    this.animFrame = 0; this.refreshTimer = null;
    this._lastCfg = Date.now(); // last editor/config activity (guards swap-on-press)
    this._allSamples = samplesStore(); // shared store (one copy for all keys)
    this.render();
    this._startAnim();
    // stagger the first fetch/render so dragging several keys at once doesn't
    // fire a synchronous burst of network + glyph work (what made key #6 lag).
    const slot = Math.min(_addSeq++, 12);
    this.refreshTimer = setTimeout(() => this.refresh(), slot * 180);
  }

  setConfig(p) {
    if (!p) return;
    this._lastCfg = Date.now(); // editor/config touch → block an immediate swap
    if (p.forceRefresh) { this.refresh(); return; }
    const pairBefore = this.config.from + this.config.to;
    if (p.from) this.config.from = p.from.toUpperCase();
    if (p.to) this.config.to = p.to.toUpperCase();
    if (p.amount !== undefined) { const a = parseFloat(p.amount); if (isFinite(a) && a > 0) this.config.amount = a; }
    if (p.decimals !== undefined && p.decimals !== '') { const d = parseInt(p.decimals, 10); this.config.decimals = (isFinite(d) && d >= 0 && d <= 6) ? d : null; }
    if (p.intervalMin !== undefined) { const m = parseInt(p.intervalMin, 10); if (isFinite(m) && m >= 1) this.config.intervalMin = m; }
    if (p.theme) this.config.theme = p.theme;
    if (p.font) this.config.font = p.font;
    if (p.screenMode !== undefined) this.config.screenMode = parseInt(p.screenMode, 10) || 0;
    const labelKeys = ['loading', 'updated', 'offline'];
    this.config.labels = this.config.labels || {};
    for (const k of labelKeys) if (p[k]) this.config.labels[k] = p[k];

    this._startAnim();
    if (pairBefore !== this.config.from + this.config.to) {
      this.rate = null; this.prevRate = null; this.dir = 'flat'; this.changePct = null;
      this.samples = (this._allSamples[this.config.from + this.config.to] || []).slice(-40);
      this.refresh();
    } else {
      this._scheduleRefresh();
      this.render();
    }
  }

  // physical key press: invert the conversion (FROM ↔ TO) and re-fetch.
  // Two guards keep it to *deliberate* presses only:
  //  - editor guard: a run that lands right after add/config/activate is almost
  //    certainly placement/move noise from the editor, not a real press → ignore.
  //  - debounce: never flip twice within 900ms.
  swap() {
    const now = Date.now();
    if (this._lastCfg && now - this._lastCfg < 700) return;      // editor move/placement noise
    if (this._lastSwap && now - this._lastSwap < 900) return;    // debounce bursts
    this._lastSwap = now;
    const f = this.config.from;
    this.config.from = this.config.to;
    this.config.to = f;
    // instant inverse (cross-rate 1/r is exact) — no blanking, no reload, no blink.
    this.rate = (this.rate && this.rate > 0) ? 1 / this.rate : this.rate;
    this.prevRate = null; this.dir = 'flat'; this.changePct = null;
    this.samples = (this._allSamples[this.config.from + this.config.to] || []).slice(-40);
    // NOTE: runtime-only. We deliberately do NOT persist here — pushing the swapped
    // pair back to the deck made it fight the deck's own settings push and flip
    // endlessly. The next scheduled refresh keeps the value exact.
    this.render();
  }

  async refresh() {
    if (this.loading) return;
    this.loading = true; this.render(); // paint the static "updating…" cue once
    const { from, to } = this.config;
    try {
      if (from === to) { this._apply(1); }
      else {
        const { rates } = await getRates(from); // coalesced across all keys
        if (rates[to] == null) throw new Error('no rate');
        this._apply(rates[to]);
      }
      this.error = false;
    } catch (e) {
      log('refresh fail', e.message); this.error = true;
    } finally {
      this.loading = false; this._scheduleRefresh(); this._startAnim(); this.render();
    }
  }

  _apply(rate) {
    this.prevRate = this.rate;
    this.rate = rate;
    if (this.prevRate != null) {
      this.dir = rate > this.prevRate ? 'up' : rate < this.prevRate ? 'down' : 'flat';
      this.changePct = this.prevRate ? ((rate - this.prevRate) / this.prevRate) * 100 : 0;
    }
    const key = this.config.from + this.config.to;
    const arr = this._allSamples[key] || [];
    arr.push(rate); while (arr.length > 60) arr.shift();
    this._allSamples[key] = arr; this.samples = arr.slice(-40);
    saveSamplesStore();
    // footer shows our last successful CHECK time (local now); the free API only
    // refreshes rates ~once a day, so its time_last_update would look frozen.
    const d = new Date();
    this.updated = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  _scheduleRefresh() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.refresh(), Math.max(1, this.config.intervalMin) * 60000);
  }

  // marquee needs the loop even when the animated theme is off
  _needsMarquee() {
    if (this.rate == null) return false;
    const f = this.config.font, mode = this.config.screenMode;
    // header overflow (any mode): amount + FROM → TO
    const amt = (this.config.amount != null && this.config.amount !== 1)
      ? `${fmtNum(this.config.amount, this.config.amount >= 1000 ? 0 : 2)} ` : '';
    if (mode === 1) return textWidth(f, `${this.config.from} → ${this.config.to}`, 23) > 212;
    const header = `${amt}${this.config.from} → ${this.config.to}`;
    const hSize = mode === 2 ? 22 : 26;
    if (textWidth(f, header, hSize) > 234) return true;
    // value overflow (Minimal/Classic): big value shrinks then marquees
    const code = this.config.to, raw = SYMBOL[code] || code;
    const sym = hasGlyphs(f, raw) ? raw : (code + ' ');
    const str = sym + fmtNum(this.config.amount * this.rate, this.config.decimals);
    const minS = Math.round(60 * 0.6);               // matches bigText's minimum
    return textWidth(f, str, minS) > 234;
  }
  // join/leave the single shared ticker (one timer total, all keys). Only the
  // animated theme or an overflowing marquee need motion — the "updating…" cue is
  // static, so a plain refresh never spins the CPU.
  _startAnim() {
    if (this._needsMarquee()) animJoin(this);
    else animLeave(this);
  }

  // coalesce: several state changes in the same tick (constructor + refresh +
  // setConfig) would each build an SVG; batch them into one paint per tick.
  render() {
    if (this._flushT) return;
    this._flushT = setImmediate(() => { this._flushT = null; this._renderNow(); });
  }
  _renderNow() {
    try {
      const svg = generateSVG({
        from: this.config.from, to: this.config.to, amount: this.config.amount, decimals: this.config.decimals,
        rate: this.rate, dir: this.dir, changePct: this.changePct, samples: this.samples,
        theme: this.config.theme, font: this.config.font, screenMode: this.config.screenMode,
        animFrame: this.animFrame, updated: this.updated,
        loading: this.loading, error: this.error, labels: this.config.labels
      });
      if (svg === this._lastSvg) return; // skip redundant WS sends (no visual change)
      this._lastSvg = svg;
      this.$UD.setBaseDataIcon(this.context, svg);
    } catch (e) { log('render err', e.message); }
  }

  destroy() {
    animLeave(this);
    if (this._flushT) { clearImmediate(this._flushT); this._flushT = null; }
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }
}

// ── Bootstrap ───────────────────────────────────────────────────────────────────
const $UD = new UlanzideckApi();
const CACHE = {};
$UD.connect('com.currency.converter.deck');
$UD.onConnected(() => log('connected v' + PLUGIN_VERSION));
$UD.onError((e) => log('err', typeof e === 'string' ? e : ''));

// one live instance per action. Moving a key changes its context (position), so
// without this the old instance survives and both render to the same key → blink.
function dropStaleFor(ctx) {
  let actionid;
  try { actionid = $UD.decodeContext(ctx).actionid; } catch (e) { return; }
  if (!actionid) return;
  for (const k of Object.keys(CACHE)) {
    if (k === ctx) continue;
    let a; try { a = $UD.decodeContext(k).actionid; } catch (e) { continue; }
    if (a === actionid) { CACHE[k].destroy(); delete CACHE[k]; }
  }
}
$UD.onAdd((jsn) => {
  const ctx = jsn.context;
  dropStaleFor(ctx); // clear a previous placement of this same action (moved key)
  if (!CACHE[ctx]) CACHE[ctx] = new Converter(ctx, $UD);
  CACHE[ctx]._lastCfg = Date.now(); // (re)placement → block an immediate swap
  if (jsn.param) CACHE[ctx].setConfig(jsn.param);
});
$UD.onParamFromApp((jsn) => { const i = CACHE[jsn.context]; if (i && jsn.param) i.setConfig(jsn.param); });
$UD.onParamFromPlugin((jsn) => { const i = CACHE[jsn.context]; if (i && jsn.param) i.setConfig(jsn.param); });
// physical key press → invert the pair (guarded inside swap() so editor
// move/placement run-events don't flip it). Inverting also works from the
// property inspector's ⇅ swap button.
$UD.onRun((jsn) => { const ctx = jsn.context; if (!CACHE[ctx]) { dropStaleFor(ctx); CACHE[ctx] = new Converter(ctx, $UD); } CACHE[ctx].swap(); });
// setActive fires when a key (re)appears — e.g. page switch or editor move — so
// treat it as editor activity that blocks an immediate swap.
$UD.onSetActive((jsn) => { const i = CACHE[jsn.context]; if (i) { i._lastCfg = Date.now(); i.render(); } });
$UD.onClear((jsn) => { if (!jsn.param) return; for (const it of jsn.param) { const i = CACHE[it.context]; if (i) { i.destroy(); delete CACHE[it.context]; } } });
