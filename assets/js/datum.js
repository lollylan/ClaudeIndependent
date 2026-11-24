// Reine Datumslogik. Keine DOM-Zugriffe, damit sie mit `npm test` prüfbar bleibt.

export const BALD_TAGE = 30;

const MONATE_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONATE_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function heute() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function istISO(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISO(s);
  return toISO(d) === s;
}

export function parseISO(s) {
  const [j, m, t] = s.split('-').map(Number);
  return new Date(j, m - 1, t);
}

export function toISO(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${t}`;
}

// Monatsende wird gekappt: 31.01. + 1 Monat = 28./29.02.
export function addMonate(d, n) {
  const ziel = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const letzterTag = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0).getDate();
  ziel.setDate(Math.min(d.getDate(), letzterTag));
  return ziel;
}

export function tageBis(von, bis) {
  const a = Date.UTC(von.getFullYear(), von.getMonth(), von.getDate());
  const b = Date.UTC(bis.getFullYear(), bis.getMonth(), bis.getDate());
  return Math.round((b - a) / 86400000);
}

// Jahre davor gelten als noch nicht fertig getippt (siehe pruefeErledigtAm).
export const FRUEHESTES_JAHR = 1900;

// Prüft den Wert eines Datumsfelds für „zuletzt erledigt“.
// Chrome und Edge melden beim Tippen schon nach der ersten Jahresziffer ein
// vollständiges Datum („0002-03-15“), dann „0020-…“, „0202-…“ und erst zuletzt
// „2025-…“. Solche Zwischenstände sind 'unfertig' und dürfen weder gespeichert
// noch als Fehler gemeldet werden.
// Ergebnis: { art: 'leer' | 'ok' | 'unfertig' | 'zukunft' | 'ungueltig', wert? }
export function pruefeErledigtAm(wert, stichtag = heute()) {
  if (wert === '' || wert === null || wert === undefined) return { art: 'leer' };
  const m = /^(\d{4,6})-\d{2}-\d{2}$/.exec(String(wert));
  if (!m) return { art: 'ungueltig' };
  if (Number(m[1]) < FRUEHESTES_JAHR) return { art: 'unfertig' };
  if (!istISO(wert)) return { art: 'ungueltig' };
  if (parseISO(wert) > stichtag) return { art: 'zukunft' };
  return { art: 'ok', wert };
}

export function faelligAm(pflicht) {
  if (!pflicht.zuletzt) return null;
  return addMonate(parseISO(pflicht.zuletzt), pflicht.intervallMonate);
}

// 'offen' = noch kein Datum hinterlegt.
export function status(pflicht, stichtag = heute()) {
  const f = faelligAm(pflicht);
  if (!f) return 'offen';
  const t = tageBis(stichtag, f);
  if (t < 0) return 'ueberfaellig';
  if (t <= BALD_TAGE) return 'bald';
  return 'geplant';
}

export function relativ(tage) {
  if (tage === 0) return 'heute';
  if (tage === 1) return 'morgen';
  if (tage === -1) return 'seit gestern überfällig';
  const n = Math.abs(tage);
  let spanne;
  if (n < 60) spanne = `${n} Tagen`;
  else if (n < 730) spanne = `${Math.round(n / 30.44)} Monaten`;
  else spanne = `${Math.round(n / 365.25)} Jahren`;
  return tage > 0 ? `in ${spanne}` : `seit ${spanne} überfällig`;
}

export function formatDatum(d) {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function monatKurz(i) { return MONATE_KURZ[i]; }
export function monatLang(i) { return MONATE_LANG[i]; }

export function intervallText(monate) {
  if (monate === 1) return 'monatlich';
  if (monate === 3) return 'vierteljährlich';
  if (monate === 6) return 'halbjährlich';
  if (monate === 12) return 'jährlich';
  if (monate % 12 === 0) return `alle ${monate / 12} Jahre`;
  return `alle ${monate} Monate`;
}

export function quartal(d = heute()) {
  const q = Math.floor(d.getMonth() / 3) + 1;
  const ende = new Date(d.getFullYear(), q * 3, 0);
  return { q, jahr: d.getFullYear(), ende, tageRest: tageBis(d, ende) };
}
