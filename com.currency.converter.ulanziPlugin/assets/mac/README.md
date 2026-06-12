# macOS notes

Currency Converter is fully cross-platform and ships **no native binaries**.

- Exchange rates are fetched over HTTPS with Node's built-in `https` module — no
  helper app, no `child_process`, nothing to sign or notarize.
- The only dependencies are pure-JS (`opentype.js`, `ws`), so the plugin runs the
  same on macOS and Windows.
- Sample history (for the chart) is stored locally under
  `~/Library/Application Support/UlanziDeck/com.currency.converter.deck/`.

Nothing to configure here — this folder is kept only for parity with the other
plugins in the suite.
