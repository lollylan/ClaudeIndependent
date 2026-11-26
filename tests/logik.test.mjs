import test from 'node:test';
import assert from 'node:assert/strict';

import * as D from '../assets/js/datum.js';
import { KATALOG, BEREICHE } from '../assets/js/katalog.js';
import { normalisieren, ausKatalog } from '../assets/js/store.js';
import { alsICS } from '../assets/js/ics.js';

const tag = (s) => D.parseISO(s);

test('addMonate kappt am Monatsende', () => {
  assert.equal(D.toISO(D.addMonate(tag('2026-01-31'), 1)), '2026-02-28');
  assert.equal(D.toISO(D.addMonate(tag('2024-01-31'), 1)), '2024-02-29');
  assert.equal(D.toISO(D.addMonate(tag('2026-11-22'), 12)), '2027-11-22');
  assert.equal(D.toISO(D.addMonate(tag('2026-11-30'), 3)), '2027-02-28');
});

test('Status richtet sich nach Tagen bis zur Fälligkeit', () => {
  const heute = tag('2026-11-22');
  const p = (zuletzt, intervallMonate = 12) => ({ zuletzt, intervallMonate });
  assert.equal(D.status(p(null), heute), 'offen');
  assert.equal(D.status(p('2025-11-21'), heute), 'ueberfaellig');
  assert.equal(D.status(p('2025-11-22'), heute), 'bald');
  assert.equal(D.status(p('2025-12-22'), heute), 'bald');
  assert.equal(D.status(p('2025-12-23'), heute), 'geplant');
});

test('relativ formuliert Abstände', () => {
  assert.equal(D.relativ(0), 'heute');
  assert.equal(D.relativ(1), 'morgen');
  assert.equal(D.relativ(12), 'in 12 Tagen');
  assert.equal(D.relativ(-5), 'seit 5 Tagen überfällig');
  assert.equal(D.relativ(365), 'in 12 Monaten');
  assert.equal(D.relativ(1826), 'in 5 Jahren');
});

test('Quartal und ISO-Prüfung', () => {
  const q = D.quartal(tag('2026-11-22'));
  assert.deepEqual([q.q, q.jahr, D.toISO(q.ende), q.tageRest], [4, 2026, '2026-12-31', 39]);
  assert.equal(D.istISO('2026-02-30'), false);
  assert.equal(D.istISO('2026-02-28'), true);
  assert.equal(D.istISO('22.11.2026'), false);
});

test('Katalog ist vollständig und eindeutig', () => {
  const ids = new Set();
  const bereiche = new Set(BEREICHE.map((b) => b.id));
  for (const k of KATALOG) {
    assert.ok(!ids.has(k.id), `doppelte id ${k.id}`);
    ids.add(k.id);
    assert.ok(bereiche.has(k.bereich), `unbekannter Bereich bei ${k.id}`);
    assert.ok(k.titel && k.grundlage && k.hinweis, `Pflichtangaben fehlen bei ${k.id}`);
    assert.ok(Number.isInteger(k.intervallMonate) && k.intervallMonate >= 1 && k.intervallMonate <= 240, `Intervall bei ${k.id}`);
  }
});

test('normalisieren verwirft Unbrauchbares und behält Gültiges', () => {
  const z = normalisieren({
    pflichten: [
      { ...ausKatalog(KATALOG[0]), zuletzt: '2026-01-15' },
      { id: 'x', titel: '', intervallMonate: 12 },
      { id: 'y', titel: 'Ohne Intervall' },
      { id: 'z', titel: 'Falsches Datum', intervallMonate: 6, zuletzt: '2026-13-01', katalogId: 'gibt-es-nicht' },
      { ...ausKatalog(KATALOG[0]) },
      null,
    ],
  });
  assert.equal(z.pflichten.length, 2);
  assert.equal(z.pflichten[0].zuletzt, '2026-01-15');
  assert.equal(z.pflichten[1].zuletzt, null);
  assert.equal(z.pflichten[1].katalogId, null);
  assert.deepEqual(normalisieren('Unsinn').pflichten, []);
});

test('ICS enthält nur Pflichten mit Datum', () => {
  const ics = alsICS([
    { id: 'a', titel: 'Feuerlöscher; Prüfung', intervallMonate: 24, zuletzt: '2025-03-10', notiz: '' },
    { id: 'b', titel: 'Ohne Datum', intervallMonate: 12, zuletzt: null, notiz: '' },
  ], new Date(Date.UTC(2026, 10, 22, 20, 0, 0)));
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 1);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20270310'));
  assert.ok(ics.includes('DTEND;VALUE=DATE:20270311'));
  assert.ok(ics.includes('SUMMARY:Stichtag: Feuerlöscher\\; Prüfung'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
});

test('Druckblatt sortiert nach Stichtag und benennt den Stand', async () => {
  const { druckZeilen, druckZusammenfassung } = await import('../assets/js/druck.js');
  const heute = tag('2026-11-22');
  const katalog = KATALOG.find((k) => !k.richtwert);
  const zeilen = druckZeilen([
    { id: 'c', katalogId: null, titel: 'Ohne Datum B', intervallMonate: 12, zuletzt: null, notiz: '' },
    { id: 'a', katalogId: null, titel: 'Später', intervallMonate: 24, zuletzt: '2026-01-10', notiz: 'Raum 2' },
    { id: 'b', katalogId: katalog.id, titel: katalog.titel, intervallMonate: 12, zuletzt: '2025-10-01', notiz: '' },
    { id: 'd', katalogId: null, titel: 'Ohne Datum A', intervallMonate: 6, zuletzt: null, notiz: '' },
  ], heute);
  assert.deepEqual(zeilen.map((z) => z.id), ['b', 'a', 'd', 'c']);
  assert.equal(zeilen[0].stand, 'überfällig');
  assert.equal(zeilen[0].grundlage, katalog.grundlage);
  assert.equal(zeilen[0].faellig, '01.10.2026');
  assert.equal(zeilen[1].zuletzt, '10.01.2026');
  assert.equal(zeilen[1].takt, 'alle 2 Jahre');
  assert.equal(zeilen[1].grundlage, 'Eigene Pflicht');
  assert.equal(zeilen[1].notiz, 'Raum 2');
  assert.equal(zeilen[2].faellig, '');
  assert.equal(zeilen[2].stand, 'ohne Datum');
  assert.equal(druckZusammenfassung(zeilen), '4 Pflichten, 1 überfällig, 2 ohne Datum');
  assert.equal(druckZusammenfassung([]), '0 Pflichten');
});

test('normalisieren übernimmt Stände der Version 1 und die Sicherungsdaten', async () => {
  const { VERSION } = await import('../assets/js/store.js');
  const alt = normalisieren({ version: 1, pflichten: [{ ...ausKatalog(KATALOG[0]), zuletzt: '2026-01-15' }] });
  assert.equal(alt.version, VERSION);
  assert.equal(alt.pflichten.length, 1);
  assert.equal(alt.pflichten[0].zuletzt, '2026-01-15');
  assert.equal(alt.gesichertAm, null);
  assert.equal(alt.geaendertAm, null);
  const neu = normalisieren({ pflichten: [], gesichertAm: '2026-11-01', geaendertAm: 'gestern' });
  assert.equal(neu.gesichertAm, '2026-11-01');
  assert.equal(neu.geaendertAm, null);
});

test('Sicherungshinweis nur, wenn es etwas zu verlieren gibt', async () => {
  const { sicherungsHinweis, SICHERUNG_TAGE } = await import('../assets/js/store.js');
  const heute = tag('2026-11-23');
  const mitDatum = [{ id: 'a', titel: 'A', intervallMonate: 12, zuletzt: '2026-03-01', notiz: '' }];
  const ohneDatum = [{ id: 'a', titel: 'A', intervallMonate: 12, zuletzt: null, notiz: '' }];
  const z = (pflichten, gesichertAm = null, geaendertAm = null) => ({ pflichten, gesichertAm, geaendertAm });

  assert.equal(sicherungsHinweis(z([]), heute), null);
  assert.equal(sicherungsHinweis(z(ohneDatum), heute), null);
  assert.deepEqual(sicherungsHinweis(z(mitDatum), heute), { art: 'nie' });
  // Frisch gesichert: kein Hinweis, auch wenn danach geändert wurde.
  assert.equal(sicherungsHinweis(z(mitDatum, '2026-11-20', '2026-11-22'), heute), null);
  // Alt, aber seitdem unverändert: kein Hinweis.
  assert.equal(sicherungsHinweis(z(mitDatum, '2026-06-01', '2026-06-01'), heute), null);
  // Alt und seitdem geändert.
  assert.deepEqual(sicherungsHinweis(z(mitDatum, '2026-06-01', '2026-11-22'), heute), { art: 'alt', seit: '2026-06-01', tage: 175 });
  // Genau an der Schwelle.
  const grenze = D.toISO(new Date(2026, 10, 23 - SICHERUNG_TAGE));
  assert.equal(sicherungsHinweis(z(mitDatum, grenze, '2026-11-22'), heute).art, 'alt');
  // Ohne Änderungsdatum (älterer Stand) zählt eine alte Sicherung als veraltet.
  assert.equal(sicherungsHinweis(z(mitDatum, '2026-06-01', null), heute).art, 'alt');
});

test('Datumseingabe: Zwischenstände beim Tippen sind unfertig, kein Fehler', () => {
  const heute = tag('2026-11-24');
  // So meldet Chrome die Jahreszahl 2025 Ziffer für Ziffer.
  for (const zwischen of ['0002-03-15', '0020-03-15', '0202-03-15', '1899-12-31']) {
    assert.equal(D.pruefeErledigtAm(zwischen, heute).art, 'unfertig', zwischen);
  }
  assert.deepEqual(D.pruefeErledigtAm('2025-03-15', heute), { art: 'ok', wert: '2025-03-15' });
  assert.deepEqual(D.pruefeErledigtAm('2026-11-24', heute), { art: 'ok', wert: '2026-11-24' });
  assert.equal(D.pruefeErledigtAm('1900-01-01', heute).art, 'ok');
  assert.equal(D.pruefeErledigtAm('2026-11-25', heute).art, 'zukunft');
  assert.equal(D.pruefeErledigtAm('20251-03-15', heute).art, 'ungueltig');
  assert.equal(D.pruefeErledigtAm('2025-02-30', heute).art, 'ungueltig');
  assert.equal(D.pruefeErledigtAm('15.03.2025', heute).art, 'ungueltig');
  assert.equal(D.pruefeErledigtAm('', heute).art, 'leer');
  assert.equal(D.pruefeErledigtAm(null, heute).art, 'leer');
});

test('Eingabe in der Zeile: Meldungssatz und nächste Zeile ohne Datum', () => {
  const heute = tag('2026-11-25');
  assert.equal(D.stichtagSatz({ zuletzt: '2026-03-15', intervallMonate: 12 }, heute), 'Nächster Stichtag: 15.03.2027, in 4 Monaten.');
  assert.equal(D.stichtagSatz({ zuletzt: '2025-01-10', intervallMonate: 12 }, heute), 'Nächster Stichtag: 10.01.2026, seit 10 Monaten überfällig.');
  assert.equal(D.stichtagSatz({ zuletzt: null, intervallMonate: 12 }, heute), '');
  assert.equal(D.nachfolger(['a', 'b', 'c'], 'a'), 'b');
  assert.equal(D.nachfolger(['a', 'b', 'c'], 'c'), 'b');
  assert.equal(D.nachfolger(['a'], 'a'), null);
  assert.equal(D.nachfolger(['a', 'b'], 'x'), null);
});

test('Weiteres Exemplar: eigene id, laufende Nummer, kein Datum, Format bleibt gültig', async () => {
  const { weiteresExemplar } = await import('../assets/js/store.js');
  const mtk = { ...ausKatalog(KATALOG.find((k) => k.id === 'mtk')), zuletzt: '2025-03-15', notiz: 'Sprechzimmer 1', intervallMonate: 12 };
  const eigen = { id: 'eigen-x', katalogId: null, titel: 'Wartung Klimaanlage', intervallMonate: 6, zuletzt: null, notiz: '' };
  const liste = [mtk, eigen];

  const zwei = weiteresExemplar(liste, 'mtk');
  assert.notEqual(zwei.id, 'mtk');
  assert.equal(zwei.katalogId, 'mtk');
  assert.equal(zwei.titel, `${mtk.titel} (2)`);
  assert.equal(zwei.intervallMonate, 12);
  assert.equal(zwei.zuletzt, null);
  assert.equal(zwei.notiz, '');
  liste.push(zwei);

  // Vom zweiten Exemplar aus geht es mit (3) weiter, nicht mit „(2) (2)“.
  const drei = weiteresExemplar(liste, zwei.id);
  assert.equal(drei.titel, `${mtk.titel} (3)`);
  liste.push(drei);
  assert.equal(new Set(liste.map((p) => p.id)).size, liste.length);

  assert.equal(weiteresExemplar(liste, 'eigen-x').titel, 'Wartung Klimaanlage (2)');
  assert.equal(weiteresExemplar(liste, 'eigen-x').katalogId, null);
  assert.equal(weiteresExemplar(liste, 'gibt-es-nicht'), null);

  // Lange Bezeichnungen bleiben innerhalb von 120 Zeichen.
  const lang = { ...eigen, id: 'eigen-lang', titel: 'x'.repeat(120) };
  assert.ok(weiteresExemplar([lang], 'eigen-lang').titel.length <= 120);

  // Gespeichert und wieder geladen bleiben alle Exemplare erhalten.
  const z = normalisieren({ version: 2, pflichten: liste });
  assert.equal(z.pflichten.filter((p) => p.katalogId === 'mtk').length, 3);
  assert.equal(z.pflichten.find((p) => p.id === zwei.id).titel, zwei.titel);
});
