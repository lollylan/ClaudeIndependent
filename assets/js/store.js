// Speicherung ausschließlich im localStorage dieses Browsers.
// Es gibt keinen Server und keine Netzwerkübertragung der Nutzerdaten.

import { istISO, parseISO, tageBis, heute, VORLAUF_MAX_WOCHEN } from './datum.js';
import { katalogEintrag } from './katalog.js';

const SCHLUESSEL = 'stichtag.v1';
// Version 2: gesichertAm und geaendertAm für den Hinweis auf eine fällige Sicherung.
// Ältere Stände haben beides nicht und bekommen null; die Pflichten bleiben unverändert.
// Version 3: vorlaufWochen je Pflicht. Ältere Pflichten bekommen 0, also die bisherige 30-Tage-Grenze.
export const VERSION = 3;

function vorlauf(wert) {
  const n = Math.round(Number(wert));
  return n >= 0 && n <= VORLAUF_MAX_WOCHEN ? n : 0;
}

// Ab so vielen Tagen seit der letzten Sicherung erinnert Stichtag, sofern sich seitdem etwas geändert hat.
export const SICHERUNG_TAGE = 30;

export function leererZustand() {
  return { version: VERSION, pflichten: [], gesichertAm: null, geaendertAm: null };
}

// Bringt beliebige Eingaben (alter Speicherstand, importierte Datei) in die
// aktuelle Form. Unbekanntes wird verworfen, nie ausgeführt.
export function normalisieren(roh) {
  const z = leererZustand();
  if (!roh || typeof roh !== 'object' || !Array.isArray(roh.pflichten)) return z;
  z.gesichertAm = istISO(roh.gesichertAm) ? roh.gesichertAm : null;
  z.geaendertAm = istISO(roh.geaendertAm) ? roh.geaendertAm : null;
  const gesehen = new Set();
  for (const p of roh.pflichten) {
    if (!p || typeof p !== 'object') continue;
    const id = typeof p.id === 'string' && p.id ? p.id.slice(0, 80) : null;
    if (!id || gesehen.has(id)) continue;
    const intervall = Math.round(Number(p.intervallMonate));
    if (!(intervall >= 1 && intervall <= 240)) continue;
    const titel = typeof p.titel === 'string' ? p.titel.trim().slice(0, 120) : '';
    if (!titel) continue;
    gesehen.add(id);
    z.pflichten.push({
      id,
      katalogId: typeof p.katalogId === 'string' && katalogEintrag(p.katalogId) ? p.katalogId : null,
      titel,
      intervallMonate: intervall,
      zuletzt: istISO(p.zuletzt) ? p.zuletzt : null,
      notiz: typeof p.notiz === 'string' ? p.notiz.slice(0, 500) : '',
      vorlaufWochen: vorlauf(p.vorlaufWochen),
    });
  }
  return z;
}

// Soll Stichtag an eine Sicherungsdatei erinnern? Nur wenn es etwas zu verlieren gibt,
// also mindestens ein eingetragenes Datum. Ergebnis: null, { art: 'nie' } oder
// { art: 'alt', seit: 'JJJJ-MM-TT', tage: n }.
export function sicherungsHinweis(zustand, stichtag = heute()) {
  if (!zustand.pflichten.some((p) => p.zuletzt)) return null;
  if (!zustand.gesichertAm) return { art: 'nie' };
  const tage = tageBis(parseISO(zustand.gesichertAm), stichtag);
  const geaendert = !zustand.geaendertAm || zustand.geaendertAm > zustand.gesichertAm;
  if (geaendert && tage >= SICHERUNG_TAGE) return { art: 'alt', seit: zustand.gesichertAm, tage };
  return null;
}

export function laden() {
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    return text ? normalisieren(JSON.parse(text)) : leererZustand();
  } catch {
    return leererZustand();
  }
}

// Gibt false zurück, wenn der Browser das Speichern verweigert (z. B. privater Modus).
export function speichern(zustand) {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(zustand));
    return true;
  } catch {
    return false;
  }
}

export function ausKatalog(eintrag) {
  return {
    id: eintrag.id,
    katalogId: eintrag.id,
    titel: eintrag.titel,
    intervallMonate: eintrag.intervallMonate,
    zuletzt: null,
    notiz: '',
    vorlaufWochen: 0,
  };
}

// Zweites, drittes … Exemplar einer vorhandenen Pflicht, etwa für mehrere Blutdruckmessgeräte
// mit eigenen Prüfdaten. Übernimmt Katalogbezug, Intervall und Vorlauf, aber kein Datum und keine Notiz.
// Die Bezeichnung bekommt eine laufende Nummer, die der Nutzer überschreiben kann.
// Das Speicherformat ändert sich dadurch nicht: katalogId durfte schon immer mehrfach vorkommen.
export function weiteresExemplar(pflichten, quelleId) {
  const quelle = pflichten.find((p) => p.id === quelleId);
  if (!quelle) return null;
  const titel = new Set(pflichten.map((p) => p.titel));
  const basis = quelle.titel.replace(/ \(\d+\)$/, '');
  let n = 2;
  const mitNummer = (k) => `${basis.slice(0, 120 - ` (${k})`.length)} (${k})`;
  while (titel.has(mitNummer(n))) n++;
  const ids = new Set(pflichten.map((p) => p.id));
  let id;
  do {
    id = `${quelle.katalogId || 'eigen'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  } while (ids.has(id));
  return {
    id,
    katalogId: quelle.katalogId,
    titel: mitNummer(n),
    intervallMonate: quelle.intervallMonate,
    zuletzt: null,
    notiz: '',
    vorlaufWochen: vorlauf(quelle.vorlaufWochen),
  };
}

export function eigenePflicht(titel, intervallMonate) {
  return {
    id: `eigen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    katalogId: null,
    titel,
    intervallMonate,
    zuletzt: null,
    notiz: '',
    vorlaufWochen: 0,
  };
}
