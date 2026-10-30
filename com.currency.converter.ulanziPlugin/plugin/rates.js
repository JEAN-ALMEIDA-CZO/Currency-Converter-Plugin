// Exchange-rate sources, tried in order:
//
//   1. AwesomeAPI   — ~30 s, BRL-centric, 540 pairs, no key
//   2. Coinbase     — near real-time, broad fiat/crypto coverage, no key
//   3. fawazahmed0  — daily, 339 currencies (covers the exotics 1 and 2 miss)
//
// Every source returns { rate, ts, source } where `ts` is the moment the DATA
// was published (ms epoch), not the moment we fetched it. `ts` is null when the
// provider does not expose one (Coinbase).
//
// The open endpoint used before (open.er-api.com) publishes once every 24 h, so
// on a volatile pair such as USD/BRL the key could be ~1 % off for most of the
// day while still looking freshly updated.

import https from 'https';

const TIMEOUT_MS = 9000;
const USER_AGENT = 'UlanziCurrencyConverter/1.0';

export function httpGetJSON(url, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (r) => {
      if (r.statusCode < 200 || r.statusCode >= 300) {
        r.resume();
        return reject(new Error('HTTP ' + r.statusCode));
      }
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch {
          reject(new Error('not JSON'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
  });
}

// ── pure parsers (exported so they can be unit-tested without a network) ──────

// AwesomeAPI: { "USDBRL": { bid, ask, timestamp, ... } }
// bid is the price you sell USD at, ask the price you buy — their midpoint is
// the market rate, the same notion of "the rate" Google and XE use.
export function parseAwesome(j, base, quote) {
  const row = j && j[`${base}${quote}`];
  if (!row) throw new Error('no pair');
  const bid = Number(row.bid);
  const ask = Number(row.ask);
  const rate = bid > 0 && ask > 0 ? (bid + ask) / 2 : bid;
  if (!(rate > 0) || !isFinite(rate)) throw new Error('bad rate');
  return {
    rate,
    ts: row.timestamp ? Number(row.timestamp) * 1000 : null,
    source: 'awesome',
  };
}

// Coinbase: { data: { currency, rates: { BRL: "5.43", ... } } }
export function parseCoinbase(j, base, quote) {
  const r = j && j.data && j.data.rates && j.data.rates[quote];
  if (r == null) throw new Error('no rate');
  const rate = Number(r);
  if (!(rate > 0) || !isFinite(rate)) throw new Error('bad rate');
  return { rate, ts: null, source: 'coinbase' };
}

// fawazahmed0: { date: "2026-10-30", usd: { brl: 5.42, ... } }
export function parseFawaz(j, base, quote) {
  const b = base.toLowerCase();
  const table = j && j[b];
  const v = table && table[quote.toLowerCase()];
  if (v == null) throw new Error('no rate');
  const rate = Number(v);
  if (!(rate > 0) || !isFinite(rate)) throw new Error('bad rate');
  return {
    rate,
    ts: j.date ? Date.parse(j.date + 'T00:00:00Z') || null : null,
    source: 'fawaz',
  };
}

export const SOURCES = [
  {
    id: 'awesome',
    label: 'AwesomeAPI',
    cadence: '~30 s',
    async load(base, quote, getJSON) {
      const pair = `${base}-${quote}`;
      return parseAwesome(
        await getJSON(`https://economia.awesomeapi.com.br/json/last/${pair}`),
        base,
        quote
      );
    },
  },
  {
    id: 'coinbase',
    label: 'Coinbase',
    cadence: 'near real-time',
    async load(base, quote, getJSON) {
      return parseCoinbase(
        await getJSON(`https://api.coinbase.com/v2/exchange-rates?currency=${base}`),
        base,
        quote
      );
    },
  },
  {
    id: 'fawaz',
    label: 'currency-api',
    cadence: 'daily',
    async load(base, quote, getJSON) {
      const b = base.toLowerCase();
      return parseFawaz(
        await getJSON(
          `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${b}.json`
        ),
        base,
        quote
      );
    },
  },
];

// ── sanity band ───────────────────────────────────────────────────────────────
// A source may answer with something real but wrong for us (a crypto token that
// shares an ISO code, a redenominated currency). Keep the last accepted rate per
// pair and refuse anything more than 5× away from it.
const _lastGood = new Map();
const BAND = 5;
export function _resetSanity() {
  _lastGood.clear();
}

function sane(key, rate) {
  const prev = _lastGood.get(key);
  if (prev != null && (rate > prev * BAND || rate < prev / BAND)) {
    throw new Error(`outside ${BAND}× band of ${prev}`);
  }
  _lastGood.set(key, rate);
  return rate;
}

/**
 * Fetch one pair through the chain. Resolves with { rate, ts, source } or
 * rejects with every source's error joined, so the log says what happened.
 */
export async function fetchRate(base, quote, { getJSON = httpGetJSON } = {}) {
  const errors = [];
  for (const src of SOURCES) {
    try {
      const r = await src.load(base, quote, getJSON);
      r.rate = sane(`${base}${quote}`, r.rate);
      return { ...r, source: src.id, label: src.label };
    } catch (e) {
      errors.push(`${src.id}: ${e.message}`);
    }
  }
  throw new Error(errors.join(' · '));
}
