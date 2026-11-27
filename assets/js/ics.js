// Kalenderexport (iCalendar, RFC 5545) als ganztägige Termine.

import { faelligAm, toISO, hatVorlauf } from './datum.js';

function maskieren(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function kompakt(d) {
  return toISO(d).replace(/-/g, '');
}

// Zeilen dürfen laut RFC höchstens 75 Oktette lang sein.
function falten(zeile) {
  const teile = [];
  let rest = zeile;
  while (new TextEncoder().encode(rest).length > 74) {
    let n = 74;
    while (new TextEncoder().encode(rest.slice(0, n)).length > 74) n--;
    teile.push(rest.slice(0, n));
    rest = ' ' + rest.slice(n);
  }
  teile.push(rest);
  return teile.join('\r\n');
}

export function alsICS(pflichten, jetzt = new Date()) {
  const stempel = jetzt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const zeilen = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stichtag//Pflichtenkalender//DE',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Stichtag Praxispflichten',
  ];
  for (const p of pflichten) {
    const f = faelligAm(p);
    if (!f) continue;
    const folgetag = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1);
    zeilen.push(
      'BEGIN:VEVENT',
      `UID:${p.id}-${kompakt(f)}@stichtag`,
      `DTSTAMP:${stempel}`,
      `DTSTART;VALUE=DATE:${kompakt(f)}`,
      `DTEND;VALUE=DATE:${kompakt(folgetag)}`,
      `SUMMARY:${maskieren('Stichtag: ' + p.titel)}`,
    );
    if (p.notiz) zeilen.push(`DESCRIPTION:${maskieren(p.notiz)}`);
    zeilen.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${maskieren(p.titel)}`,
      // Erinnerung zwei Wochen vorher, bei längerer Vorlaufzeit entsprechend früher.
      `TRIGGER:${hatVorlauf(p) ? `-P${p.vorlaufWochen}W` : '-P14D'}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  zeilen.push('END:VCALENDAR');
  return zeilen.map(falten).join('\r\n') + '\r\n';
}
