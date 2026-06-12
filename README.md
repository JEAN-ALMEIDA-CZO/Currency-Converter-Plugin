# Currency Converter — Ulanzi Deck Plugin

Live currency converter right on your Ulanzi Deck. Pick any two of **166 currencies**,
set an amount, and the key shows the converted value with the live exchange rate, an
up/down trend arrow and a mini chart. **Press the key to invert the conversion**
(swap *From* ↔ *To*). Modern UI with color themes, fonts and 3 screen styles. Fully
localized.

- **UUID:** `com.currency.converter.deck`
- **Version:** 1.0.0
- **Author:** Jean Almeida
- **Platforms:** Windows 10+, macOS 10.11+ · Ulanzi Software 2.1.0+
- **Controller:** Keypad

---

## Features

- **166 currencies** via [open.er-api.com](https://open.er-api.com) (free, no API key).
- **Live rate + trend** — converted value, exchange rate, ▲/▼ direction arrow and % change.
- **3 screen styles:**
  - **Classic** — header, big value, rate line, change %.
  - **Chart** — currency pair, sparkline of recent rates, value + change.
  - **Minimal** — pair on top, large value, target code below.
- **Press = invert** — tap the key to swap *From* ↔ *To*; the new pair is saved and the
  inspector dropdowns sync automatically.
- **Marquee** — long values and headers (e.g. billions, big amounts) scroll instead of clipping.
- **No-tofu symbols** — when the chosen font lacks a currency glyph (₮ ₭ ฿ ₡ ₴ …) the key
  falls back to the ISO code so it never shows a broken box.
- **8 color themes**, 4 fonts (Sans / Mono / Serif / Display), optional animated glow.
- **Localized** in 11 languages: EN, PT-BR, PT-PT, ES, FR, DE, IT, JA, KO, ZH-CN, ZH-HK.
  Currency names are translated natively per locale via `Intl.DisplayNames`.

---

## Settings (Property Inspector)

| Setting     | Description                                                        |
|-------------|--------------------------------------------------------------------|
| **From / To** | Source and target currency (searchable, flag + ISO code + name). |
| **Amount**  | Value to convert (defaults to 1).                                  |
| **Decimals**| Fixed decimal places, or auto when left blank.                     |
| **Interval**| Refresh period in minutes (min 1).                                 |
| **Refresh now** | Forces an immediate update.                                   |
| **Screen**  | Classic · Chart · Minimal.                                         |
| **Theme / Font** | Color palette and typeface.                                  |
| **Animated**| Optional moving accent glow (off by default to save CPU).         |

The footer shows the **last local check time** (`upd HH:MM`) and a pulsing **"updating…"**
cue while fetching.

---

## Performance

Built to run many keys without weighing on the CPU:

- **Shared rate cache** — every key on the same base currency shares **one** network
  fetch (reused 60s, concurrent requests coalesced). 20 keys cost the same as 1.
- **Shared sample store** — a single in-memory copy and one debounced writer for all keys
  (one file, no clobbering).
- **Single animation ticker** — one 5 fps timer drives every key that needs motion; when
  nothing animates there is **no timer at all** (zero idle CPU).
- **Glyph / width caching** — opentype paths and text widths are cached, so marquee frames
  are nearly free.
- **Redundant-send dedup** — an identical frame is never re-sent over the socket.
- Animation is **off by default**; a still key does no continuous rendering.

---

## Notes

- The free API refreshes rates roughly **once a day**, so the converted value can stay the
  same between checks — the footer time still updates to confirm the key polled.
- No telemetry. The only network call is the public exchange-rate endpoint over HTTPS.

---

## Install / Reload

After editing plugin code, **fully restart the Ulanzi Software** (quit from the tray, not
just close the window) so the Node plugin process reloads. Bumping the `Version` in
`manifest.json` helps force a reload.

## Credits

- Exchange rates: [Open Exchange Rate API](https://open.er-api.com)
- Vector text: [opentype.js](https://github.com/opentypejs/opentype.js)
- WebSocket: [ws](https://github.com/websockets/ws)
