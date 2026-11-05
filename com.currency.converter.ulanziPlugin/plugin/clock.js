// Footer label for a rate timestamp.
//
// The key has one small line at the bottom, so it shows the moment the RATE was
// published rather than the moment we checked. Same local day prints "10:36";
// anything older prints "29/10 10:36", so a daily fallback cannot look like it
// was fetched a minute ago.
export function clockLabel(ts, now = Date.now()) {
  const d = new Date(ts);
  const n = new Date(now);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (d.toDateString() === n.toDateString()) return `${hh}:${mm}`;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${hh}:${mm}`;
}
