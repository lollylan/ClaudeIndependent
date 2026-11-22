// Druckblatt für den QM-Ordner: alle Pflichten als Tabelle, nach Stichtag sortiert.
// Reine Logik ohne DOM-Zugriff, damit sie mit `npm test` prüfbar bleibt.

import * as D from './datum.js';
import { katalogEintrag } from './katalog.js';

const STAND = {
  ueberfaellig: 'überfällig',
  bald: 'in 30 Tagen',
  geplant: 'geplant',
  offen: 'ohne Datum',
};

// Liefert eine Zeile je Pflicht. Pflichten mit Stichtag zuerst (früheste oben),
// danach die ohne Datum alphabetisch.
export function druckZeilen(pflichten, stichtag = D.heute()) {
  return pflichten
    .map((p) => {
      const faellig = D.faelligAm(p);
      const status = D.status(p, stichtag);
      const k = p.katalogId ? katalogEintrag(p.katalogId) : null;
      return {
        id: p.id,
        titel: p.titel,
        grundlage: k ? k.grundlage : 'Eigene Pflicht',
        takt: D.intervallText(p.intervallMonate),
        richtwert: Boolean(k && k.richtwert && k.intervallMonate === p.intervallMonate),
        notiz: p.notiz || '',
        zuletzt: p.zuletzt ? D.formatDatum(D.parseISO(p.zuletzt)) : '',
        faellig: faellig ? D.formatDatum(faellig) : '',
        sortierung: faellig ? faellig.getTime() : Infinity,
        status,
        stand: STAND[status],
      };
    })
    .sort((a, b) => a.sortierung - b.sortierung || a.titel.localeCompare(b.titel, 'de'));
}

// Kurze Zusammenfassung für den Kopf des Blattes.
export function druckZusammenfassung(zeilen) {
  const zaehle = (s) => zeilen.filter((z) => z.status === s).length;
  const teile = [`${zeilen.length} ${zeilen.length === 1 ? 'Pflicht' : 'Pflichten'}`];
  const ue = zaehle('ueberfaellig');
  const bald = zaehle('bald');
  const offen = zaehle('offen');
  if (ue) teile.push(`${ue} überfällig`);
  if (bald) teile.push(`${bald} in den nächsten 30 Tagen`);
  if (offen) teile.push(`${offen} ohne Datum`);
  return teile.join(', ');
}
