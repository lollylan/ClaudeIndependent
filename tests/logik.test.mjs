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
