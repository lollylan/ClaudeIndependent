import { BEREICHE, KATALOG, katalogEintrag } from './katalog.js';
import * as D from './datum.js';
import { laden, speichern, normalisieren, ausKatalog, eigenePflicht, weiteresExemplar, leererZustand, sicherungsHinweis } from './store.js';
import { plakette } from './plakette.js';
import { alsICS } from './ics.js';
import { druckZeilen, druckZusammenfassung } from './druck.js';

const inhalt = document.getElementById('inhalt');
const meldungEl = document.getElementById('meldung');

let zustand = laden();
let vorher = null; // Stand vor der letzten Änderung, für "Rückgängig"
let meldungTimer = null;
let werdegangDaten = null;
let formularFehler = '';
const aufgeklappt = new Set();

const ZAHLWORT = ['Keine', 'Eine', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Elf', 'Zwölf'];
const zahlwort = (n) => ZAHLWORT[n] ?? String(n);

const ICON = {
  haken: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg>',
  plus: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>',
  herunter: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3v10M5.5 9l4.5 4.5L14.5 9M4 17h12"/></svg>',
  hoch: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14V4M5.5 8L10 3.5 14.5 8M4 17h12"/></svg>',
  drucker: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 7.5V3h9v4.5M5.5 14H3.5v-6.5h13V14h-2"/><rect x="5.5" y="11.5" width="9" height="5.5" rx="0.5"/></svg>',
  kalender: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 2.5v4M13 2.5v4"/></svg>',
};

function esc(wert) {
  return String(wert).replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z]));
}

// ---------- Zustand ----------

function angereichert() {
  const heute = D.heute();
  return zustand.pflichten
    .map((p) => {
      const faellig = D.faelligAm(p);
      return {
        ...p,
        faellig,
        status: D.status(p, heute),
        tage: faellig ? D.tageBis(heute, faellig) : null,
        katalog: p.katalogId ? katalogEintrag(p.katalogId) : null,
      };
    })
    .sort((a, b) => (a.faellig ? a.faellig.getTime() : Infinity) - (b.faellig ? b.faellig.getTime() : Infinity) || a.titel.localeCompare(b.titel, 'de'));
}

function aendern(fn, text, { frisch = null } = {}) {
  vorher = structuredClone(zustand);
  fn(zustand);
  zustand.geaendertAm = D.toISO(D.heute());
  const gespeichert = speichern(zustand);
  zeichnen({ frisch });
  if (!gespeichert) melden('Speichern nicht möglich. Ihr Browser blockiert den lokalen Speicher, etwa im privaten Modus.', false);
  else if (text) melden(text, true);
}

function melden(text, mitRueckgaengig) {
  clearTimeout(meldungTimer);
  meldungEl.innerHTML = `<span>${esc(text)}</span>${mitRueckgaengig ? '<button type="button" data-rueckgaengig>Rückgängig</button>' : ''}`;
  meldungEl.hidden = false;
  meldungTimer = setTimeout(() => { meldungEl.hidden = true; }, 9000);
}

// ---------- Ansichten ----------

function route() {
  const r = location.hash.replace(/^#\/?/, '');
  return ['katalog', 'werdegang', 'daten', 'impressum', 'druck'].includes(r) ? r : '';
}

function ansichtUebersicht() {
  const liste = angereichert();
  if (liste.length === 0) {
    return `
      <section class="auftakt">
        <div>
          <h1 tabindex="-1">Welche Pflichten hat Ihre Praxis?</h1>
          <p class="auftakt__lead">Unterweisungen, Geräteprüfungen, Nachweise, Kartenlaufzeiten: Stichtag rechnet aus, wann was wieder fällig ist. Beginnen Sie mit dem Startpaket und streichen Sie, was nicht passt.</p>
          <div class="aktionen">
            <button class="knopf" type="button" data-startpaket>${ICON.plus}Typische Hausarztpraxis laden</button>
            <a class="knopf knopf--still" href="#/katalog">Katalog durchsehen</a>
          </div>
        </div>
        <div class="auftakt__plakette">
          ${plakette(D.addMonate(D.heute(), 12), 'geplant', { gross: true })}
          <p class="auftakt__legende">So liest sich die Plakette: Monat am Ring, Jahr in der Mitte.</p>
        </div>
      </section>`;
  }

  const ueberfaellig = liste.filter((p) => p.status === 'ueberfaellig');
  const bald = liste.filter((p) => p.status === 'bald');
  const offen = liste.filter((p) => p.status === 'offen');
  const geplant = liste.filter((p) => p.status === 'geplant');
  const naechste = liste.find((p) => p.faellig);

  let titel;
  // Mit Vorlaufzeit kann eine Pflicht schon Monate vorher „bald“ sein; dann stimmt „30 Tage“ nicht mehr.
  const baldWeiter = bald.some((p) => p.tage > D.BALD_TAGE);
  if (ueberfaellig.length) titel = ueberfaellig.length === 1 ? 'Eine Pflicht ist überfällig.' : `${zahlwort(ueberfaellig.length)} Pflichten sind überfällig.`;
  else if (bald.length && baldWeiter) titel = bald.length === 1 ? 'Ein Stichtag rückt näher.' : `${zahlwort(bald.length)} Stichtage rücken näher.`;
  else if (bald.length) titel = bald.length === 1 ? 'Ein Stichtag in den nächsten 30 Tagen.' : `${zahlwort(bald.length)} Stichtage in den nächsten 30 Tagen.`;
  else if (!naechste) titel = 'Wann war es zuletzt so weit?';
  else titel = 'Alles im Takt.';

  let lead;
  if (naechste) {
    lead = `Als Nächstes: <strong>${esc(naechste.titel)}</strong>, ${naechste.tage < 0 ? 'fällig seit dem' : 'fällig am'} ${D.formatDatum(naechste.faellig)}.`;
    if (offen.length) lead += ` ${offen.length === 1 ? 'Bei einer Pflicht' : `Bei ${offen.length} Pflichten`} fehlt noch das letzte Datum.`;
  } else {
    lead = 'Tragen Sie bei jeder Pflicht ein, wann sie zuletzt erledigt wurde. Stichtag rechnet daraus den nächsten Termin.';
  }

  return `
    <section class="auftakt">
      <div>
        <h1 tabindex="-1">${titel}</h1>
        <p class="auftakt__lead">${lead}</p>
      </div>
      <div class="auftakt__plakette">
        ${plakette(naechste ? naechste.faellig : null, naechste ? naechste.status : 'offen', { gross: true })}
        <p class="auftakt__legende">${naechste ? `${esc(naechste.titel)}: ${D.monatLang(naechste.faellig.getMonth())} ${naechste.faellig.getFullYear()}` : 'Noch kein Stichtag berechnet'}</p>
      </div>
    </section>
    ${jahresband(liste)}
    ${sicherungsZeile()}
    ${gruppe('Überfällig', ueberfaellig)}
    ${baldWeiter
    ? gruppe('Bald fällig', bald, 'Fällig in den nächsten 30 Tagen, oder die eingestellte Vorlaufzeit hat begonnen.')
    : gruppe('In den nächsten 30 Tagen', bald)}
    ${gruppe('Noch ohne Datum', offen, 'Sobald das letzte Datum eingetragen ist, erscheint die Pflicht im Kalender.')}
    ${gruppe('Später', geplant)}`;
}

function jahresband(liste) {
  const heute = D.heute();
  const start = new Date(heute.getFullYear(), heute.getMonth(), 1);
  const ende = D.addMonate(start, 12);
  const gesamt = D.tageBis(start, ende);

  let monate = '';
  for (let i = 0; i < 12; i++) {
    const m = D.addMonate(start, i);
    const tage = D.tageBis(m, D.addMonate(m, 1));
    const quartalsbeginn = m.getMonth() % 3 === 0;
    const zusatz = quartalsbeginn ? `<b>Q${m.getMonth() / 3 + 1}</b>` : m.getMonth() === 0 || i === 0 ? `<b>${m.getFullYear()}</b>` : '';
    monate += `<div class="band__monat${quartalsbeginn ? ' ist-quartalsbeginn' : ''}" style="--tage:${tage}"><span>${D.monatKurz(m.getMonth())}</span>${zusatz}</div>`;
  }

  const imBand = liste.filter((p) => p.faellig && p.faellig < ende);
  // Punkte, die sich überdecken würden, weichen in die nächste Spur aus (20 px Mindestabstand).
  const abstand = (20 / Math.max(280, inhalt.clientWidth - 32)) * 100;
  const spurEnde = [];
  let marken = '';
  for (const p of imBand) {
    const x = Math.max(0, (D.tageBis(start, p.faellig) / gesamt) * 100);
    let spur = spurEnde.findIndex((e) => e + abstand <= x);
    if (spur === -1) spur = Math.min(spurEnde.length, 5);
    spurEnde[spur] = x;
    const text = `${p.titel}, ${D.formatDatum(p.faellig)}, ${D.relativ(p.tage)}`;
    marken += `<button type="button" class="band__marke band__marke--${p.status}" style="--x:${x.toFixed(2)}%;--spur:${spur}" data-springe="${esc(p.id)}" title="${esc(text)}" aria-label="${esc(text)}"></button>`;
  }
  const heuteX = (D.tageBis(start, heute) / gesamt) * 100;
  const spaeter = liste.filter((p) => p.faellig && p.faellig >= ende).length;

  return `
    <section class="band">
      <h2>Die nächsten zwölf Monate</h2>
      <div class="band__feld" style="--spuren:${Math.max(1, spurEnde.length)}">
        <div class="band__skala">${monate}</div>
        <div class="band__spur">
          <div class="band__heute" style="left:${heuteX.toFixed(2)}%"></div>
          ${marken}
        </div>
      </div>
      <p class="band__fuss">Die Linie markiert heute. ${imBand.length === 0 ? 'In diesem Zeitraum liegt noch kein Stichtag.' : 'Ein Klick auf einen Punkt führt zur Pflicht.'}${spaeter ? ` ${spaeter === 1 ? 'Ein weiterer Stichtag liegt' : `${spaeter} weitere Stichtage liegen`} dahinter.` : ''} <a href="#/druck">Als Druckblatt für den QM-Ordner</a></p>
    </section>`;
}

function sicherungsZeile() {
  const h = sicherungsHinweis(zustand);
  if (!h) return '';
  const text = h.art === 'nie'
    ? '<strong>Noch keine Sicherung.</strong> Ihre Einträge liegen nur in diesem Browser. Wer die Websitedaten löscht oder den Rechner wechselt, verliert sie.'
    : `<strong>Letzte Sicherung vom ${D.formatDatum(D.parseISO(h.seit))}.</strong> Seitdem hat sich etwas geändert. Eine neue Sicherungsdatei hält den aktuellen Stand fest.`;
  return `
    <aside class="sicherung" aria-label="Sicherung">
      <p>${text}</p>
      <button class="knopf knopf--klein knopf--still" type="button" data-export>${ICON.herunter}Sicherung herunterladen</button>
    </aside>`;
}

function gruppe(titel, liste, hinweis = '') {
  if (liste.length === 0) return '';
  return `
    <section class="gruppe">
      <h2>${titel} <span>${liste.length}</span></h2>
      ${hinweis ? `<p class="gruppe__hinweis">${hinweis}</p>` : ''}
      <ul class="liste">${liste.map(pflichtZeile).join('')}</ul>
    </section>`;
}

function pflichtZeile(p) {
  const offen = aufgeklappt.has(p.id);
  const k = p.katalog;
  const unterzeile = [k ? esc(k.grundlage) : 'Eigene Pflicht', D.intervallText(p.intervallMonate), D.hatVorlauf(p) ? D.vorlaufText(p.vorlaufWochen) : '']
    .filter(Boolean).join(' · ');
  const richtwert = k && k.richtwert && k.intervallMonate === p.intervallMonate ? ' <span class="marke-richtwert">Richtwert</span>' : '';
  const heuteISO = D.toISO(D.heute());
  // Ohne Datum steht das Feld gleich in der Zeile: Nach dem Startpaket ist das die erste Arbeit.
  const termin = p.faellig
    ? `<div class="pflicht__termin"><strong>${D.formatDatum(p.faellig)}</strong><span>${D.relativ(p.tage)}</span></div>`
    : `<label class="pflicht__termin pflicht__eintrag"><span aria-hidden="true">Zuletzt erledigt am</span>
          <input type="date" max="${heuteISO}" data-feld="zuletzt" data-ort="zeile" data-id="${esc(p.id)}" aria-label="${esc(p.titel)}: zuletzt erledigt am">
        </label>`;

  return `
    <li class="pflicht pflicht--${p.status}" id="p-${esc(p.id)}">
      <div class="pflicht__kopf">
        ${plakette(p.faellig, p.status)}
        <div class="pflicht__titel">
          <h3>${esc(p.titel)}</h3>
          <p>${unterzeile}${richtwert}</p>
        </div>
        ${termin}
        <div class="pflicht__aktionen">
          <button class="knopf knopf--klein" type="button" data-erledigt="${esc(p.id)}">${ICON.haken}Heute erledigt</button>
          <button class="knopf knopf--klein knopf--still" type="button" data-details="${esc(p.id)}" aria-expanded="${offen}" aria-controls="d-${esc(p.id)}">Details</button>
        </div>
      </div>
      <div class="pflicht__details" id="d-${esc(p.id)}"${offen ? '' : ' hidden'}>
        ${k ? `<p class="pflicht__hinweis"><strong>${esc(k.grundlage)}.</strong> ${esc(k.hinweis)}</p>` : ''}
        <label class="feld feld--breit">Bezeichnung <small>Etwa Gerät oder Raum, keine Namen</small>
          <input type="text" maxlength="120" value="${esc(p.titel)}" data-feld="titel" data-id="${esc(p.id)}">
        </label>
        ${p.zuletzt ? `<label class="feld">Zuletzt erledigt
          <input type="date" value="${p.zuletzt}" max="${heuteISO}" data-feld="zuletzt" data-id="${esc(p.id)}">
        </label>` : ''}
        <label class="feld">Intervall in Monaten
          <input type="number" inputmode="numeric" min="1" max="240" step="1" value="${p.intervallMonate}" data-feld="intervallMonate" data-id="${esc(p.id)}">
        </label>
        <label class="feld">Vorlauf in Wochen <small>Ohne Angabe gelb ab 30 Tagen vorher</small>
          <input type="number" inputmode="numeric" min="0" max="${D.VORLAUF_MAX_WOCHEN}" step="1" value="${p.vorlaufWochen || ''}" placeholder="z. B. 8" data-feld="vorlaufWochen" data-id="${esc(p.id)}">
        </label>
        <label class="feld">Notiz <small>Keine Namen, keine Patientendaten</small>
          <input type="text" maxlength="500" value="${esc(p.notiz)}" placeholder="z. B. Prüffirma, Raum, Gerät" data-feld="notiz" data-id="${esc(p.id)}">
        </label>
        <div class="aktionen">
          <button class="knopf knopf--klein knopf--still" type="button" data-exemplar="${esc(p.id)}">${ICON.plus}Weiteres Exemplar</button>
          <button class="knopf knopf--klein knopf--gefahr" type="button" data-entfernen="${esc(p.id)}">Aus meiner Liste entfernen</button>
        </div>
      </div>
    </li>`;
}

function ansichtKatalog() {
  const anzahl = new Map();
  for (const p of zustand.pflichten) if (p.katalogId) anzahl.set(p.katalogId, (anzahl.get(p.katalogId) || 0) + 1);
  const bereiche = BEREICHE.map((b) => {
    const eintraege = KATALOG.filter((k) => k.bereich === b.id).map((k) => `
      <li>
        <label class="eintrag">
          <input class="schalter" type="checkbox" role="switch" data-umschalten="${k.id}"${anzahl.has(k.id) ? ' checked' : ''}>
          <span>
            <span class="eintrag__titel">${esc(k.titel)}</span>
            <span class="eintrag__text">${esc(k.grundlage)}. ${esc(k.hinweis)}${anzahl.get(k.id) > 1 ? ` <strong>${zahlwort(anzahl.get(k.id))} Exemplare in Ihrer Liste.</strong>` : ''}</span>
          </span>
          <span class="eintrag__takt">${D.intervallText(k.intervallMonate)}${k.richtwert ? '<span class="marke-richtwert">Richtwert</span>' : ''}</span>
        </label>
      </li>`).join('');
    return `<section class="abschnitt"><h2>${b.titel}</h2><ul class="liste">${eintraege}</ul></section>`;
  }).join('');

  return `
    <header class="seitenkopf">
      <h1 tabindex="-1">Was gilt für Ihre Praxis?</h1>
      <p>Schalten Sie ein, was auf Sie zutrifft. „Richtwert“ heißt: Die Quelle verlangt Regelmäßigkeit, nennt aber kein festes Intervall. Jedes Intervall lässt sich später anpassen. Gibt es ein Gerät mehrfach, legen Sie in der Übersicht unter „Details“ ein weiteres Exemplar an.</p>
      <div class="aktionen" style="margin-top:var(--raum-5)">
        <button class="knopf" type="button" data-startpaket>${ICON.plus}Typische Hausarztpraxis laden</button>
        <a class="knopf knopf--still" href="#/">Zur Übersicht</a>
      </div>
    </header>
    ${bereiche}
    <section class="abschnitt">
      <h2>Eigene Pflicht</h2>
      <p>Für alles, was im Katalog fehlt: Wartungsverträge, Vertragslaufzeiten, interne Routinen.</p>
      <form class="formular" data-eigene novalidate>
        <label class="feld">Bezeichnung <small>Keine Namen, keine Patientendaten</small>
          <input type="text" name="titel" maxlength="120" autocomplete="off" placeholder="z. B. Wartung Klimaanlage">
        </label>
        <label class="feld">Intervall in Monaten
          <input type="number" name="intervall" inputmode="numeric" min="1" max="240" step="1" value="12">
        </label>
        <button class="knopf" type="submit">${ICON.plus}Hinzufügen</button>
        ${formularFehler ? `<p class="formular__fehler" role="alert">${esc(formularFehler)}</p>` : ''}
      </form>
    </section>`;
}

function ansichtWerdegang() {
  let liste;
  if (werdegangDaten === null) {
    liste = '<p class="leer">Der Werdegang wird geladen …</p>';
  } else if (werdegangDaten === false) {
    liste = '<p class="leer">Der Werdegang konnte nicht geladen werden. Laden Sie die Seite neu; öffnen Sie sie über einen Webserver, nicht als lokale Datei.</p>';
  } else {
    liste = `<ol class="werdegang">${werdegangDaten.map((e) => `
      <li>
        <time datetime="${esc(e.datum)}">${D.istISO(e.datum) ? D.formatDatum(D.parseISO(e.datum)) : esc(e.datum)}<small>${esc(e.modell ?? '')}</small></time>
        <div>
          <h2>${esc(e.titel)}</h2>
          <p>${esc(e.was)}</p>
          ${e.warum ? `<p class="werdegang__warum">${esc(e.warum)}</p>` : ''}
        </div>
      </li>`).join('')}</ol>`;
  }
  return `
    <header class="seitenkopf">
      <h1 tabindex="-1">Werdegang</h1>
      <p>Stichtag ist ein Versuch: Das Grundgerüst hat eine KI entworfen, und jeden Abend um 21 Uhr sieht sich eine KI das Programm an, wählt selbst eine Verbesserung und setzt sie um. Kein Mensch gibt die Änderungen frei. Hier steht, was dabei passiert ist.</p>
    </header>
    ${liste}`;
}

function ansichtDaten() {
  const anzahl = zustand.pflichten.length;
  const gesichert = zustand.gesichertAm
    ? `Die letzte Sicherung aus diesem Browser stammt vom ${D.formatDatum(D.parseISO(zustand.gesichertAm))}.`
    : 'Aus diesem Browser wurde noch keine Sicherung heruntergeladen.';
  return `
    <header class="seitenkopf">
      <h1 tabindex="-1">Daten und Rechtliches</h1>
      <p>Stichtag hat keinen Server. Was Sie eintragen, liegt im Speicher dieses Browsers auf diesem Gerät und nirgends sonst.</p>
    </header>

    <section class="abschnitt">
      <h2>Sichern und mitnehmen</h2>
      <p>${anzahl === 0 ? 'Noch sind keine Pflichten angelegt.' : `${anzahl === 1 ? 'Eine Pflicht ist' : `${anzahl} Pflichten sind`} in diesem Browser gespeichert.`} Wer den Browser wechselt oder die Websitedaten löscht, braucht eine Sicherungsdatei. ${gesichert} Legen Sie die Datei außerhalb des Browsers ab, etwa im QM-Ordner auf dem Praxisserver.</p>
      <div class="aktionen">
        <button class="knopf" type="button" data-export>${ICON.herunter}Sicherung herunterladen</button>
        <span>
          <input class="datei" type="file" id="import" accept="application/json,.json" data-import>
          <label class="knopf knopf--still" for="import">${ICON.hoch}Sicherung einspielen</label>
        </span>
        <button class="knopf knopf--still" type="button" data-ics>${ICON.kalender}Stichtage als Kalenderdatei</button>
        <a class="knopf knopf--still" href="#/druck">${ICON.drucker}Druckblatt</a>
      </div>
    </section>

    <section class="abschnitt">
      <h2>Was Stichtag nicht ist</h2>
      <div class="text">
        <ul>
          <li><strong>Kein Medizinprodukt.</strong> Stichtag verarbeitet keine Patientendaten und trifft keine Aussagen zu Diagnose oder Therapie. Es zählt Kalendertage.</li>
          <li><strong>Keine Rechtsberatung.</strong> Der Katalog ist eine Gedächtnisstütze ohne Anspruch auf Vollständigkeit oder Aktualität. Maßgeblich sind die genannten Vorschriften, Ihre KV, Ärztekammer und Berufsgenossenschaft.</li>
          <li><strong>Kein Ersatz für Ihre QM-Dokumentation.</strong> Die Nachweise selbst gehören weiterhin in Ihr QM-System.</li>
        </ul>
      </div>
    </section>

    <section class="abschnitt">
      <h2>Datenschutz</h2>
      <div class="text">
        <p>Stichtag setzt keine Cookies, lädt keine Schriften oder Skripte von Dritten und misst keine Besuche. Die Seite wird über GitHub Pages ausgeliefert; dabei verarbeitet GitHub technisch bedingt Ihre IP-Adresse, wie jeder Webserver.</p>
        <p>Bitte tragen Sie in Notizen und eigene Pflichten keine Namen von Mitarbeitenden oder Patienten ein. Dafür ist Stichtag nicht gedacht.</p>
      </div>
    </section>

    <section class="abschnitt">
      <h2>Alles löschen</h2>
      <p>Entfernt alle Pflichten und Daten aus diesem Browser.</p>
      <div class="aktionen">
        <button class="knopf knopf--gefahr" type="button" data-loeschen${anzahl === 0 ? ' disabled' : ''}>Alle Daten löschen</button>
      </div>
    </section>`;
}

function ansichtDruck() {
  const zeilen = druckZeilen(zustand.pflichten);
  const stand = D.formatDatum(D.heute());
  if (zeilen.length === 0) {
    return `
      <header class="seitenkopf">
        <h1 tabindex="-1">Druckblatt</h1>
        <p>Hier entsteht eine Übersicht aller Stichtage zum Ausdrucken, sobald Pflichten angelegt sind.</p>
      </header>
      <p class="leer">Noch keine Pflichten. Legen Sie im <a href="#/katalog">Katalog</a> fest, was für Ihre Praxis gilt.</p>`;
  }
  const reihen = zeilen.map((z) => `
        <tr class="druck__zeile druck__zeile--${z.status}">
          <th scope="row">
            <span class="druck__titel">${esc(z.titel)}</span>
            <span class="druck__quelle">${esc(z.grundlage)}${z.notiz ? ` · ${esc(z.notiz)}` : ''}</span>
          </th>
          <td>${esc(z.takt)}${z.richtwert ? '<span class="druck__richtwert">Richtwert</span>' : ''}${z.vorlauf ? `<span class="druck__quelle">${esc(z.vorlauf)}</span>` : ''}</td>
          <td class="druck__datum">${z.zuletzt || '–'}</td>
          <td class="druck__datum"><strong>${z.faellig || '–'}</strong></td>
          <td><span class="druck__stand">${z.stand}</span></td>
          <td class="druck__frei"></td>
          <td class="druck__frei"></td>
        </tr>`).join('');
  return `
    <header class="seitenkopf druck__kopf">
      <h1 tabindex="-1">Stichtage der Praxis</h1>
      <p>Stand ${stand}: ${esc(druckZusammenfassung(zeilen))}. Die beiden rechten Spalten sind für Ihre Einträge von Hand.</p>
      <div class="aktionen druck__aktionen">
        <button class="knopf" type="button" data-drucken>${ICON.drucker}Drucken</button>
        <a class="knopf knopf--still" href="#/">Zur Übersicht</a>
      </div>
    </header>
    <div class="druck__rahmen" role="region" aria-label="Tabelle der Stichtage" tabindex="0">
      <table class="druck">
        <caption class="nur-druck">Stichtage der Praxis, Stand ${stand}. ${esc(druckZusammenfassung(zeilen))}.</caption>
        <thead>
          <tr>
            <th scope="col">Pflicht und Quelle</th>
            <th scope="col">Takt</th>
            <th scope="col">Zuletzt</th>
            <th scope="col">Nächster Stichtag</th>
            <th scope="col">Stand</th>
            <th scope="col">Erledigt am</th>
            <th scope="col">Zeichen</th>
          </tr>
        </thead>
        <tbody>${reihen}
        </tbody>
      </table>
    </div>
    <p class="druck__fuss">Erstellt mit Stichtag. Eine Gedächtnisstütze ohne Anspruch auf Vollständigkeit, keine Rechtsberatung; maßgeblich sind die genannten Vorschriften. Die Nachweise selbst gehören in Ihr QM-System.</p>`;
}

// Vom Betreiber vorgegeben. Inhalt nicht ändern (CLAUDE.md, Leitplanke 4).
function ansichtImpressum() {
  return `
    <header class="seitenkopf">
      <h1 tabindex="-1">Impressum</h1>
      <p>Stichtag ist ein kostenloses, nicht kommerzielles Experiment aus der Hausarztpraxis Dr. Rasche in Würzburg.</p>
    </header>

    <section class="abschnitt">
      <h2>Angaben gemäß § 5 DDG</h2>
      <address class="text">
        Dr. med. Florian Rasche<br>
        Facharzt für Allgemeinmedizin<br>
        Huttenstraße 6<br>
        97072 Würzburg<br>
        Deutschland
      </address>
    </section>

    <section class="abschnitt">
      <h2>Kontakt</h2>
      <dl class="angaben">
        <dt>Telefon</dt><dd><a href="tel:+4993172525">0931 / 72525</a></dd>
        <dt>Fax</dt><dd>0931 / 76264</dd>
        <dt>E-Mail</dt><dd><a href="mailto:praxis@dr-rasche.de">praxis@dr-rasche.de</a></dd>
        <dt>Praxis</dt><dd><a href="https://www.dr-rasche.de" rel="noopener">www.dr-rasche.de</a></dd>
      </dl>
    </section>

    <section class="abschnitt">
      <h2>Berufsrechtliche Angaben</h2>
      <div class="text">
        <p>Berufsbezeichnung: Arzt, verliehen in der Bundesrepublik Deutschland. Zuständige Kammer: Bayerische Landesärztekammer, Mühlbaurstraße 16, 81677 München (<a href="https://www.blaek.de" rel="noopener">www.blaek.de</a>). Zuständige Aufsichtsbehörde: Regierung von Unterfranken, Peterplatz 9, 97070 Würzburg.</p>
        <p>Es gelten die Berufsordnung für die Ärzte Bayerns, das Heilberufe-Kammergesetz und die Bundesärzteordnung, einsehbar auf der Website der Bayerischen Landesärztekammer.</p>
      </div>
    </section>

    <section class="abschnitt">
      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <div class="text"><p>Dr. med. Florian Rasche, Huttenstraße 6, 97072 Würzburg</p></div>
    </section>

    <section class="abschnitt">
      <h2>Haftung</h2>
      <div class="text">
        <p>Stichtag wird ohne Gewähr bereitgestellt. Das Programm wird von KI-Agenten ohne menschliche Freigabe weiterentwickelt; Inhalte und Funktionen können sich täglich ändern und Fehler enthalten. Der Katalog ist eine Gedächtnisstütze und keine Rechtsberatung. Für Inhalte verlinkter Seiten ist der jeweilige Anbieter verantwortlich.</p>
        <p>Angaben zum Datenschutz stehen unter <a href="#/daten">Daten und Rechtliches</a>. Der Quellcode liegt auf <a href="https://github.com/lollylan/ClaudeIndependent" rel="noopener">GitHub</a>.</p>
      </div>
    </section>`;
}

// ---------- Zeichnen ----------

function fokusSchluessel(el) {
  if (!el || !inhalt.contains(el)) return null;
  for (const name of ['erledigt', 'details', 'exemplar', 'umschalten', 'entfernen', 'export']) {
    if (el.dataset[name] !== undefined) return `[data-${name}="${CSS.escape(el.dataset[name])}"]`;
  }
  if (el.dataset.feld) return `[data-feld="${el.dataset.feld}"][data-id="${CSS.escape(el.dataset.id)}"]`;
  return null;
}

function zeichnen({ neueSeite = false, frisch = null } = {}) {
  const r = route();
  const fokus = neueSeite ? null : fokusSchluessel(document.activeElement);
  const ansichten = { '': ansichtUebersicht, katalog: ansichtKatalog, werdegang: ansichtWerdegang, daten: ansichtDaten, impressum: ansichtImpressum, druck: ansichtDruck };
  inhalt.innerHTML = ansichten[r]();

  for (const a of document.querySelectorAll('.hauptnav a')) {
    if (a.dataset.route === r) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.title = { '': 'Stichtag – Pflichtenkalender für die Arztpraxis', katalog: 'Katalog – Stichtag', werdegang: 'Werdegang – Stichtag', daten: 'Daten und Rechtliches – Stichtag', impressum: 'Impressum – Stichtag', druck: 'Druckblatt – Stichtag' }[r];

  if (neueSeite) {
    window.scrollTo(0, 0);
    inhalt.querySelector('h1')?.focus({ preventScroll: true });
  } else if (fokus) {
    const ziel = inhalt.querySelector(fokus);
    ziel?.focus({ preventScroll: true });
    // Ein Feld unter „Details“ kann seine Zeile in eine andere Gruppe schieben, etwa nach einer
    // Änderung von Intervall oder Vorlauf. Dann der Zeile folgen, statt den Fokus unsichtbar zu lassen.
    if (ziel?.dataset.feld) {
      const r = ziel.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) ziel.closest('.pflicht')?.scrollIntoView({ block: 'center' });
    }
  }
  if (frisch) document.getElementById(`p-${frisch}`)?.classList.add('ist-frisch');
  if (r === 'werdegang' && werdegangDaten === null) ladeWerdegang();
}

async function ladeWerdegang() {
  try {
    const antwort = await fetch('assets/data/werdegang.json', { cache: 'no-cache' });
    if (!antwort.ok) throw new Error(String(antwort.status));
    const daten = await antwort.json();
    werdegangDaten = Array.isArray(daten) ? [...daten].sort((a, b) => String(b.datum).localeCompare(String(a.datum))) : false;
  } catch {
    werdegangDaten = false;
  }
  if (route() === 'werdegang') zeichnen();
}

function herunterladen(dateiname, inhaltText, typ) {
  const url = URL.createObjectURL(new Blob([inhaltText], { type: typ }));
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function startpaketLaden() {
  // Nach Katalogbezug, nicht nach id: Wer nur noch ein weiteres Exemplar hat, bekommt kein Duplikat.
  const vorhanden = new Set(zustand.pflichten.map((p) => p.katalogId).filter(Boolean));
  const neu = KATALOG.filter((k) => k.starter && !vorhanden.has(k.id));
  if (neu.length === 0) return melden('Das Startpaket ist bereits vollständig in Ihrer Liste.', false);
  aendern((z) => { z.pflichten.push(...neu.map(ausKatalog)); }, `${neu.length} Pflichten hinzugefügt.`);
  if (route() !== '') location.hash = '#/';
}

// ---------- Ereignisse ----------

inhalt.addEventListener('click', (e) => {
  const ziel = e.target.closest('button, a');
  if (!ziel) return;
  const d = ziel.dataset;

  if (d.startpaket !== undefined) return startpaketLaden();

  if (d.drucken !== undefined) return window.print();

  if (d.erledigt !== undefined) {
    const id = d.erledigt;
    return aendern((z) => {
      const p = z.pflichten.find((x) => x.id === id);
      if (p) p.zuletzt = D.toISO(D.heute());
    }, (() => {
      const p = zustand.pflichten.find((x) => x.id === id);
      return p ? `Erledigt. Nächster Stichtag: ${D.formatDatum(D.addMonate(D.heute(), p.intervallMonate))}.` : '';
    })(), { frisch: id });
  }

  if (d.details !== undefined) {
    if (aufgeklappt.has(d.details)) aufgeklappt.delete(d.details);
    else aufgeklappt.add(d.details);
    return zeichnen();
  }

  if (d.exemplar !== undefined) {
    const neu = weiteresExemplar(zustand.pflichten, d.exemplar);
    if (!neu) return;
    aufgeklappt.add(neu.id);
    aendern((z) => { z.pflichten.push(neu); },
      `„${neu.titel}“ angelegt. Passen Sie die Bezeichnung an und tragen Sie das letzte Datum ein.`, { frisch: neu.id });
    // Die neue Zeile steht unter „Noch ohne Datum“, mit offenen Details: gleich die Bezeichnung anpassen.
    document.getElementById(`p-${neu.id}`)?.scrollIntoView({ block: 'center' });
    const feld = inhalt.querySelector(`[data-feld="titel"][data-id="${CSS.escape(neu.id)}"]`);
    feld?.focus({ preventScroll: true });
    feld?.select();
    return;
  }

  if (d.entfernen !== undefined) {
    const id = d.entfernen;
    aufgeklappt.delete(id);
    return aendern((z) => { z.pflichten = z.pflichten.filter((x) => x.id !== id); }, 'Pflicht entfernt.');
  }

  if (d.springe !== undefined) {
    const zeile = document.getElementById(`p-${d.springe}`);
    if (!zeile) return;
    inhalt.querySelector('.ist-ziel')?.classList.remove('ist-ziel');
    zeile.classList.add('ist-ziel');
    zeile.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    return zeile.querySelector('[data-details]')?.focus({ preventScroll: true });
  }

  if (d.export !== undefined) {
    // Ob die Datei wirklich gespeichert wurde, verrät der Browser nicht; der Klick zählt als Sicherung.
    zustand.gesichertAm = D.toISO(D.heute());
    const gespeichert = speichern(zustand);
    herunterladen(`stichtag-sicherung-${zustand.gesichertAm}.json`, JSON.stringify(zustand, null, 2), 'application/json');
    zeichnen();
    // Der Hinweis in der Übersicht verschwindet samt Knopf; der Fokus bleibt dann im Inhalt.
    if (!inhalt.contains(document.activeElement)) inhalt.focus({ preventScroll: true });
    return gespeichert ? melden('Sicherung erstellt. Bewahren Sie die Datei außerhalb des Browsers auf.', false) : undefined;
  }

  if (d.ics !== undefined) {
    if (!zustand.pflichten.some((p) => p.zuletzt)) return melden('Noch kein Stichtag berechnet. Tragen Sie zuerst ein, wann eine Pflicht zuletzt erledigt wurde.', false);
    return herunterladen('stichtag.ics', alsICS(zustand.pflichten), 'text/calendar');
  }

  if (d.loeschen !== undefined) {
    if (d.sicher === undefined) {
      ziel.dataset.sicher = '';
      ziel.textContent = 'Wirklich alles löschen?';
      return;
    }
    aufgeklappt.clear();
    return aendern((z) => { Object.assign(z, leererZustand()); }, 'Alle Daten gelöscht.');
  }
});

// Textfelder melden „change“ beim Verlassen, bevor der Fokus im nächsten Feld angekommen ist.
// Würde sofort neu gezeichnet, ginge der Fokus verloren und landete auf der Seite. Deshalb erst
// zeichnen, wenn der Browser den Fokus weitergegeben hat; zeichnen() stellt ihn dann wieder her.
function nachFokuswechsel(fn) {
  setTimeout(fn, 0);
}

inhalt.addEventListener('change', (e) => {
  const el = e.target;

  if (el.dataset.umschalten !== undefined) {
    const k = katalogEintrag(el.dataset.umschalten);
    if (!k) return;
    if (el.checked) return aendern((z) => { z.pflichten.push(ausKatalog(k)); }, '');
    const betroffen = zustand.pflichten.filter((p) => p.katalogId === k.id);
    const hatDaten = betroffen.some((p) => p.zuletzt || p.notiz);
    const text = betroffen.length > 1 ? `${zahlwort(betroffen.length)} Exemplare entfernt.` : hatDaten ? 'Pflicht samt Datum entfernt.' : '';
    return aendern((z) => { z.pflichten = z.pflichten.filter((p) => p.katalogId !== k.id); }, text);
  }

  if (el.dataset.feld) {
    const { feld, id } = el.dataset;
    const p = zustand.pflichten.find((x) => x.id === id);
    if (!p) return;
    if (feld === 'zuletzt') {
      const pruefung = D.pruefeErledigtAm(el.value);
      // Das Jahr wird noch getippt: nichts speichern, nichts neu zeichnen, sonst ginge die Eingabe verloren.
      // Leer ist das Feld auch, wenn jemand ein Datum korrigiert und gerade einen Teil gelöscht hat.
      // Entfernt wird das Datum deshalb erst beim Verlassen des Felds (siehe focusout).
      if (pruefung.art === 'unfertig' || (pruefung.art === 'leer' && p.zuletzt)) return;
      if (pruefung.art === 'zukunft' || pruefung.art === 'ungueltig') {
        melden(pruefung.art === 'zukunft' ? 'Das Datum der letzten Erledigung darf nicht in der Zukunft liegen.' : 'Bitte geben Sie ein gültiges Datum ein.', false);
        el.value = p.zuletzt ?? '';
        return;
      }
      const wert = pruefung.art === 'ok' ? pruefung.wert : null;
      if (wert === p.zuletzt) return;
      if (el.dataset.ort !== 'zeile') {
        return aendern((z) => { z.pflichten.find((x) => x.id === id).zuletzt = wert; }, '', { frisch: id });
      }
      // Eingabe direkt in der Zeile: Die Zeile wandert in ihre neue Gruppe, der Fokus geht zur
      // nächsten Zeile ohne Datum, und die bleibt dabei an ihrer Stelle auf dem Bildschirm.
      const zeilenFelder = () => [...inhalt.querySelectorAll('[data-ort="zeile"]')];
      const weiterId = D.nachfolger(zeilenFelder().map((f) => f.dataset.id), id);
      const vorTop = weiterId ? zeilenFelder().find((f) => f.dataset.id === weiterId).getBoundingClientRect().top : 0;
      aendern((z) => { z.pflichten.find((x) => x.id === id).zuletzt = wert; },
        `„${p.titel}“ eingetragen. ${D.stichtagSatz({ ...p, zuletzt: wert })}`, { frisch: id });
      const weiter = weiterId && zeilenFelder().find((f) => f.dataset.id === weiterId);
      if (weiter) {
        window.scrollBy(0, weiter.getBoundingClientRect().top - vorTop);
        weiter.focus({ preventScroll: true });
      } else {
        // Alle Daten eingetragen: Fokus zur eben bearbeiteten Zeile.
        const zeile = document.getElementById(`p-${id}`);
        zeile?.scrollIntoView({ block: 'center' });
        zeile?.querySelector('[data-details]')?.focus({ preventScroll: true });
      }
      return;
    }
    if (feld === 'intervallMonate') {
      const n = Math.round(Number(el.value));
      if (!(n >= 1 && n <= 240)) {
        melden('Das Intervall muss zwischen 1 und 240 Monaten liegen.', false);
        el.value = p.intervallMonate;
        return;
      }
      return nachFokuswechsel(() => aendern((z) => { z.pflichten.find((x) => x.id === id).intervallMonate = n; }, ''));
    }
    if (feld === 'vorlaufWochen') {
      const roh = el.value.trim();
      const n = roh === '' ? 0 : Math.round(Number(roh));
      if (!(n >= 0 && n <= D.VORLAUF_MAX_WOCHEN)) {
        melden(`Der Vorlauf muss zwischen 0 und ${D.VORLAUF_MAX_WOCHEN} Wochen liegen.`, false);
        el.value = p.vorlaufWochen || '';
        return;
      }
      if (n === (p.vorlaufWochen || 0)) return;
      const text = n > 0 && !D.hatVorlauf({ vorlaufWochen: n })
        ? 'Gespeichert. Bis vier Wochen ändert das nichts: Stichtag meldet jede Pflicht ohnehin 30 Tage vorher.'
        : '';
      return nachFokuswechsel(() => aendern((z) => { z.pflichten.find((x) => x.id === id).vorlaufWochen = n; }, text));
    }
    if (feld === 'titel') {
      const titel = el.value.trim().slice(0, 120);
      if (!titel) {
        melden('Die Bezeichnung darf nicht leer sein.', false);
        el.value = p.titel;
        return;
      }
      if (titel === p.titel) return;
      return nachFokuswechsel(() => aendern((z) => { z.pflichten.find((x) => x.id === id).titel = titel; }, ''));
    }
    if (feld === 'notiz') {
      const notiz = el.value.trim().slice(0, 500);
      return nachFokuswechsel(() => aendern((z) => { z.pflichten.find((x) => x.id === id).notiz = notiz; }, ''));
    }
  }

  if (el.dataset.import !== undefined && el.files[0]) {
    const leser = new FileReader();
    leser.onload = () => {
      let neu;
      try { neu = normalisieren(JSON.parse(String(leser.result))); } catch { neu = null; }
      if (!neu || neu.pflichten.length === 0) return melden('Diese Datei enthält keine lesbare Stichtag-Sicherung.', false);
      // Der eingespielte Stand liegt bereits als Datei vor und gilt deshalb als gesichert.
      aendern((z) => { Object.assign(z, neu, { gesichertAm: D.toISO(D.heute()) }); }, `Sicherung eingespielt: ${neu.pflichten.length} Pflichten.`);
    };
    leser.onerror = () => melden('Die Datei konnte nicht gelesen werden.', false);
    leser.readAsText(el.files[0]);
  }
});

// Beim Verlassen des Datumsfelds: Eine halb getippte Jahreszahl bekommt einen Hinweis statt
// stillschweigend verworfen zu werden; ein geleertes Feld entfernt das Datum (mit „Rückgängig“).
inhalt.addEventListener('focusout', (e) => {
  const el = e.target;
  if (el.dataset?.feld !== 'zuletzt' || !el.isConnected) return;
  const id = el.dataset.id;
  const p = zustand.pflichten.find((x) => x.id === id);
  if (!p) return;
  const art = D.pruefeErledigtAm(el.value).art;
  if (art === 'unfertig') {
    el.value = p.zuletzt ?? '';
    melden('Bitte geben Sie das Jahr vierstellig ein, etwa 2025. Das Datum wurde nicht übernommen.', false);
  } else if (art === 'leer' && p.zuletzt) {
    aendern((z) => { z.pflichten.find((x) => x.id === id).zuletzt = null; }, 'Datum entfernt.');
  }
});

// Zahlenfelder: Beim Betreten ist der Inhalt markiert, damit eine getippte Zahl den alten Wert
// ersetzt, statt sich anzuhängen (aus 24 wurde sonst 2412).
inhalt.addEventListener('focusin', (e) => {
  const el = e.target;
  if (el.type === 'number' && el.dataset?.feld) el.select();
});

inhalt.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-eigene]');
  if (!form) return;
  e.preventDefault();
  const titel = form.elements.titel.value.trim();
  const n = Math.round(Number(form.elements.intervall.value));
  if (!titel) formularFehler = 'Bitte geben Sie der Pflicht eine Bezeichnung.';
  else if (!(n >= 1 && n <= 240)) formularFehler = 'Das Intervall muss zwischen 1 und 240 Monaten liegen.';
  else formularFehler = '';
  if (formularFehler) {
    zeichnen();
    return inhalt.querySelector(titel ? '[name="intervall"]' : '[name="titel"]')?.focus();
  }
  aendern((z) => { z.pflichten.push(eigenePflicht(titel.slice(0, 120), n)); }, `„${titel.slice(0, 60)}“ hinzugefügt.`);
});

meldungEl.addEventListener('click', (e) => {
  if (!e.target.closest('[data-rueckgaengig]') || !vorher) return;
  zustand = vorher;
  vorher = null;
  speichern(zustand);
  meldungEl.hidden = true;
  zeichnen();
});

window.addEventListener('hashchange', () => {
  formularFehler = '';
  zeichnen({ neueSeite: true });
});

// Ein anderes Fenster hat gespeichert: Stand übernehmen.
window.addEventListener('storage', () => {
  zustand = laden();
  zeichnen();
});

// Das Jahresband verteilt seine Punkte abhängig von der Breite.
let breiteTimer = null;
let letzteBreite = inhalt.clientWidth;
window.addEventListener('resize', () => {
  clearTimeout(breiteTimer);
  breiteTimer = setTimeout(() => {
    if (inhalt.clientWidth === letzteBreite) return;
    letzteBreite = inhalt.clientWidth;
    if (route() === '') zeichnen();
  }, 150);
});

// ---------- Start ----------

const q = D.quartal();
document.getElementById('quartal').innerHTML = `<strong>Q${q.q} ${q.jahr}</strong> · ${q.tageRest === 0 ? 'endet heute' : `noch ${q.tageRest} ${q.tageRest === 1 ? 'Tag' : 'Tage'}`}`;

document.documentElement.classList.add('erststart');
setTimeout(() => document.documentElement.classList.remove('erststart'), 1500);
zeichnen();
