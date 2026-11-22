import { BEREICHE, KATALOG, katalogEintrag } from './katalog.js';
import * as D from './datum.js';
import { laden, speichern, normalisieren, ausKatalog, eigenePflicht, leererZustand } from './store.js';
import { plakette } from './plakette.js';
import { alsICS } from './ics.js';

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
  return ['katalog', 'werdegang', 'daten'].includes(r) ? r : '';
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
  if (ueberfaellig.length) titel = ueberfaellig.length === 1 ? 'Eine Pflicht ist überfällig.' : `${zahlwort(ueberfaellig.length)} Pflichten sind überfällig.`;
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
    ${gruppe('Überfällig', ueberfaellig)}
    ${gruppe('In den nächsten 30 Tagen', bald)}
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
      <p class="band__fuss">Die Linie markiert heute. ${imBand.length === 0 ? 'In diesem Zeitraum liegt noch kein Stichtag.' : 'Ein Klick auf einen Punkt führt zur Pflicht.'}${spaeter ? ` ${spaeter === 1 ? 'Ein weiterer Stichtag liegt' : `${spaeter} weitere Stichtage liegen`} dahinter.` : ''}</p>
    </section>`;
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
  const unterzeile = [k ? esc(k.grundlage) : 'Eigene Pflicht', D.intervallText(p.intervallMonate)].join(' · ');
  const richtwert = k && k.richtwert && k.intervallMonate === p.intervallMonate ? ' <span class="marke-richtwert">Richtwert</span>' : '';
  const termin = p.faellig
    ? `<strong>${D.formatDatum(p.faellig)}</strong><span>${D.relativ(p.tage)}</span>`
    : '<strong>Noch kein Datum</strong><span>letzten Termin eintragen</span>';
  const heuteISO = D.toISO(D.heute());

  return `
    <li class="pflicht pflicht--${p.status}" id="p-${esc(p.id)}">
      <div class="pflicht__kopf">
        ${plakette(p.faellig, p.status)}
        <div class="pflicht__titel">
          <h3>${esc(p.titel)}</h3>
          <p>${unterzeile}${richtwert}</p>
        </div>
        <div class="pflicht__termin">${termin}</div>
        <div class="pflicht__aktionen">
          <button class="knopf knopf--klein" type="button" data-erledigt="${esc(p.id)}">${ICON.haken}Heute erledigt</button>
          <button class="knopf knopf--klein knopf--still" type="button" data-details="${esc(p.id)}" aria-expanded="${offen}" aria-controls="d-${esc(p.id)}">Details</button>
        </div>
      </div>
      <div class="pflicht__details" id="d-${esc(p.id)}"${offen ? '' : ' hidden'}>
        ${k ? `<p class="pflicht__hinweis"><strong>${esc(k.grundlage)}.</strong> ${esc(k.hinweis)}</p>` : ''}
        <label class="feld">Zuletzt erledigt
          <input type="date" value="${p.zuletzt ?? ''}" max="${heuteISO}" data-feld="zuletzt" data-id="${esc(p.id)}">
        </label>
        <label class="feld">Intervall in Monaten
          <input type="number" inputmode="numeric" min="1" max="240" step="1" value="${p.intervallMonate}" data-feld="intervallMonate" data-id="${esc(p.id)}">
        </label>
        <label class="feld">Notiz <small>Keine Namen, keine Patientendaten</small>
          <input type="text" maxlength="500" value="${esc(p.notiz)}" placeholder="z. B. Prüffirma, Raum, Gerät" data-feld="notiz" data-id="${esc(p.id)}">
        </label>
        <div class="aktionen">
          <button class="knopf knopf--klein knopf--gefahr" type="button" data-entfernen="${esc(p.id)}">Aus meiner Liste entfernen</button>
        </div>
      </div>
    </li>`;
}

function ansichtKatalog() {
  const aktiv = new Set(zustand.pflichten.map((p) => p.katalogId).filter(Boolean));
  const bereiche = BEREICHE.map((b) => {
    const eintraege = KATALOG.filter((k) => k.bereich === b.id).map((k) => `
      <li>
        <label class="eintrag">
          <input class="schalter" type="checkbox" role="switch" data-umschalten="${k.id}"${aktiv.has(k.id) ? ' checked' : ''}>
          <span>
            <span class="eintrag__titel">${esc(k.titel)}</span>
            <span class="eintrag__text">${esc(k.grundlage)}. ${esc(k.hinweis)}</span>
          </span>
          <span class="eintrag__takt">${D.intervallText(k.intervallMonate)}${k.richtwert ? '<span class="marke-richtwert">Richtwert</span>' : ''}</span>
        </label>
      </li>`).join('');
    return `<section class="abschnitt"><h2>${b.titel}</h2><ul class="liste">${eintraege}</ul></section>`;
  }).join('');

  return `
    <header class="seitenkopf">
      <h1 tabindex="-1">Was gilt für Ihre Praxis?</h1>
      <p>Schalten Sie ein, was auf Sie zutrifft. „Richtwert“ heißt: Die Quelle verlangt Regelmäßigkeit, nennt aber kein festes Intervall. Jedes Intervall lässt sich später anpassen.</p>
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
  return `
    <header class="seitenkopf">
      <h1 tabindex="-1">Daten und Rechtliches</h1>
      <p>Stichtag hat keinen Server. Was Sie eintragen, liegt im Speicher dieses Browsers auf diesem Gerät und nirgends sonst.</p>
    </header>

    <section class="abschnitt">
      <h2>Sichern und mitnehmen</h2>
      <p>${anzahl === 0 ? 'Noch sind keine Pflichten angelegt.' : `${anzahl === 1 ? 'Eine Pflicht ist' : `${anzahl} Pflichten sind`} in diesem Browser gespeichert.`} Wer den Browser wechselt oder die Websitedaten löscht, braucht eine Sicherungsdatei.</p>
      <div class="aktionen">
        <button class="knopf" type="button" data-export>${ICON.herunter}Sicherung herunterladen</button>
        <span>
          <input class="datei" type="file" id="import" accept="application/json,.json" data-import>
          <label class="knopf knopf--still" for="import">${ICON.hoch}Sicherung einspielen</label>
        </span>
        <button class="knopf knopf--still" type="button" data-ics>${ICON.kalender}Stichtage als Kalenderdatei</button>
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

// ---------- Zeichnen ----------

function fokusSchluessel(el) {
  if (!el || !inhalt.contains(el)) return null;
  for (const name of ['erledigt', 'details', 'umschalten', 'entfernen']) {
    if (el.dataset[name] !== undefined) return `[data-${name}="${CSS.escape(el.dataset[name])}"]`;
  }
  if (el.dataset.feld) return `[data-feld="${el.dataset.feld}"][data-id="${CSS.escape(el.dataset.id)}"]`;
  return null;
}

function zeichnen({ neueSeite = false, frisch = null } = {}) {
  const r = route();
  const fokus = neueSeite ? null : fokusSchluessel(document.activeElement);
  const ansichten = { '': ansichtUebersicht, katalog: ansichtKatalog, werdegang: ansichtWerdegang, daten: ansichtDaten };
  inhalt.innerHTML = ansichten[r]();

  for (const a of document.querySelectorAll('.hauptnav a')) {
    if (a.dataset.route === r) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.title = { '': 'Stichtag – Pflichtenkalender für die Arztpraxis', katalog: 'Katalog – Stichtag', werdegang: 'Werdegang – Stichtag', daten: 'Daten und Rechtliches – Stichtag' }[r];

  if (neueSeite) {
    window.scrollTo(0, 0);
    inhalt.querySelector('h1')?.focus({ preventScroll: true });
  } else if (fokus) {
    inhalt.querySelector(fokus)?.focus({ preventScroll: true });
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
  const vorhanden = new Set(zustand.pflichten.map((p) => p.id));
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
    return herunterladen(`stichtag-sicherung-${D.toISO(D.heute())}.json`, JSON.stringify(zustand, null, 2), 'application/json');
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

inhalt.addEventListener('change', (e) => {
  const el = e.target;

  if (el.dataset.umschalten !== undefined) {
    const k = katalogEintrag(el.dataset.umschalten);
    if (!k) return;
    if (el.checked) return aendern((z) => { z.pflichten.push(ausKatalog(k)); }, '');
    const hatDaten = zustand.pflichten.some((p) => p.katalogId === k.id && (p.zuletzt || p.notiz));
    return aendern((z) => { z.pflichten = z.pflichten.filter((p) => p.katalogId !== k.id); }, hatDaten ? 'Pflicht samt Datum entfernt.' : '');
  }

  if (el.dataset.feld) {
    const { feld, id } = el.dataset;
    const p = zustand.pflichten.find((x) => x.id === id);
    if (!p) return;
    if (feld === 'zuletzt') {
      const wert = el.value;
      if (wert && (!D.istISO(wert) || D.parseISO(wert) > D.heute())) {
        melden('Das Datum der letzten Erledigung darf nicht in der Zukunft liegen.', false);
        el.value = p.zuletzt ?? '';
        return;
      }
      return aendern((z) => { z.pflichten.find((x) => x.id === id).zuletzt = wert || null; }, '', { frisch: id });
    }
    if (feld === 'intervallMonate') {
      const n = Math.round(Number(el.value));
      if (!(n >= 1 && n <= 240)) {
        melden('Das Intervall muss zwischen 1 und 240 Monaten liegen.', false);
        el.value = p.intervallMonate;
        return;
      }
      return aendern((z) => { z.pflichten.find((x) => x.id === id).intervallMonate = n; }, '');
    }
    if (feld === 'notiz') {
      return aendern((z) => { z.pflichten.find((x) => x.id === id).notiz = el.value.trim().slice(0, 500); }, '');
    }
  }

  if (el.dataset.import !== undefined && el.files[0]) {
    const leser = new FileReader();
    leser.onload = () => {
      let neu;
      try { neu = normalisieren(JSON.parse(String(leser.result))); } catch { neu = null; }
      if (!neu || neu.pflichten.length === 0) return melden('Diese Datei enthält keine lesbare Stichtag-Sicherung.', false);
      aendern((z) => { Object.assign(z, neu); }, `Sicherung eingespielt: ${neu.pflichten.length} Pflichten.`);
    };
    leser.onerror = () => melden('Die Datei konnte nicht gelesen werden.', false);
    leser.readAsText(el.files[0]);
  }
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
