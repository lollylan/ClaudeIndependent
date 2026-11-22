// Speicherung ausschließlich im localStorage dieses Browsers.
// Es gibt keinen Server und keine Netzwerkübertragung der Nutzerdaten.

import { istISO } from './datum.js';
import { katalogEintrag } from './katalog.js';

const SCHLUESSEL = 'stichtag.v1';
export const VERSION = 1;

export function leererZustand() {
  return { version: VERSION, pflichten: [] };
}

// Bringt beliebige Eingaben (alter Speicherstand, importierte Datei) in die
// aktuelle Form. Unbekanntes wird verworfen, nie ausgeführt.
export function normalisieren(roh) {
  const z = leererZustand();
  if (!roh || typeof roh !== 'object' || !Array.isArray(roh.pflichten)) return z;
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
    });
  }
  return z;
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
  };
}
