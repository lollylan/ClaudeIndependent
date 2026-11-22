// Die Prüfplakette: Der Monat sitzt wie auf einem Zifferblatt (12 oben = Dezember),
// das Jahr steht zweistellig in der Mitte, die Farbe zeigt den Status.
// Die Plakette ist immer Begleitung zu einem ausgeschriebenen Datum, nie alleinige Auskunft.

import { monatLang } from './datum.js';

function punkt(radius, winkelGrad) {
  const w = ((winkelGrad - 90) * Math.PI) / 180;
  return [50 + radius * Math.cos(w), 50 + radius * Math.sin(w)];
}

function bogen(radius, von, bis) {
  const [x1, y1] = punkt(radius, von);
  const [x2, y2] = punkt(radius, bis);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function plakette(faellig, status, { gross = false } = {}) {
  const klasse = `plakette plakette--${status}${gross ? ' plakette--gross' : ''}`;
  if (!faellig) {
    return `<svg class="${klasse}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle class="plakette__leer" cx="50" cy="50" r="46"/>
      <path class="plakette__strich" d="M38 50H62"/>
    </svg>`;
  }
  const monat = faellig.getMonth() + 1;
  const jahr = String(faellig.getFullYear()).slice(-2);
  const radius = gross ? 38 : 39;
  let ring = '';
  let ziffern = '';
  for (let m = 1; m <= 12; m++) {
    const mitte = (m % 12) * 30;
    const aktiv = m === monat;
    ring += `<path class="plakette__segment${aktiv ? ' ist-monat' : ''}" style="--i:${m}" d="${bogen(radius, mitte - 12.5, mitte + 12.5)}"/>`;
    if (gross) {
      const [x, y] = punkt(radius, mitte);
      ziffern += `<text class="plakette__ziffer${aktiv ? ' ist-monat' : ''}" x="${x.toFixed(2)}" y="${(y + 2.6).toFixed(2)}">${m}</text>`;
    }
  }
  const titel = gross ? `<title>Fällig im ${monatLang(monat - 1)} ${faellig.getFullYear()}</title>` : '';
  return `<svg class="${klasse}" viewBox="0 0 100 100" ${gross ? 'role="img"' : 'aria-hidden="true" focusable="false"'}>
    ${titel}
    <circle class="plakette__scheibe" cx="50" cy="50" r="49"/>
    <g class="plakette__ring">${ring}</g>
    ${ziffern}
    <text class="plakette__jahr" x="50" y="${gross ? 60.5 : 62}">${jahr}</text>
  </svg>`;
}
