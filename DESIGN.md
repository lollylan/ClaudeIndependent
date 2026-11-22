# Stichtag – Gestaltung

## Die Welt

Die **Prüfplakette**. Jedes geprüfte Gerät in einer Praxis trägt eine: rund, farbig, der Monat am Ring, das Jahr in der Mitte. Wer in einer Praxis arbeitet, liest sie im Vorbeigehen. Stichtag überträgt dieses Zeichen auf alle Pflichten, auch auf die, die keinen Aufkleber haben.

Modus: **Operate**. Die Seite ist ein Werkzeug; Übersicht und vertraute Bedienung gehen vor Ausdruck. Charakter steckt in der Plakette, im Jahresband und in der Schrift, nicht in Dekoration.

Szene: Praxisrechner am Empfang oder im Sprechzimmer, Tageslicht und Deckenleuchten. Deshalb hell, mit kräftigem Kontrast; kein Dunkelmodus.

## Farbe

Zurückhaltend: zwei Neutrale plus Tinte. Farbe tragen ausschließlich die drei Statusfarben, und nur dort, wo sie Status bedeuten.

| Token | Wert | Verwendung |
|---|---|---|
| `--grund` | `oklch(0.968 0.008 220)` | Seitenhintergrund, kühles Papier |
| `--flaeche` | `oklch(0.995 0.002 220)` | Zeilen, Felder, Band |
| `--tinte` | `oklch(0.24 0.035 240)` | Text, Hauptknopf, aktive Navigation |
| `--tinte-leise` | `oklch(0.44 0.03 240)` | Nebentext (mind. 4.5:1 auf Grund) |
| `--linie` / `--linie-stark` | `oklch(0.885 0.012 230)` / `oklch(0.6 0.02 235)` | Trennlinien / Feldränder, Quartalsgrenzen |
| `--rot` / `--rot-text` | `oklch(0.57 0.21 27)` / `oklch(0.47 0.19 27)` | überfällig |
| `--gelb` / `--gelb-text` | `oklch(0.86 0.17 92)` / `oklch(0.44 0.09 75)` | fällig in 30 Tagen |
| `--gruen` / `--gruen-text` | `oklch(0.56 0.13 158)` / `oklch(0.41 0.1 158)` | geplant |
| `--blau` | `oklch(0.52 0.16 255)` | nur Fokusring |

Status wird nie allein über Farbe vermittelt: Neben jeder Plakette steht das Datum und der Abstand in Worten.

## Schrift

Selbst gehostet (`assets/fonts/`, SIL OFL), keine externen Anfragen.

- **Barlow Semi Condensed** 600/700: Überschriften, Wortmarke, Ziffern in der Plakette. Die Schildschrift.
- **Barlow** 400/500/600: alles andere.

Seitentitel `clamp(2.25rem, 5.4vw, 4.25rem)`, Zeilenhöhe 1. Abschnittstitel 1.625rem. Fließtext 1.0625rem. Zahlen in Terminen tabellarisch (`tabular-nums`). Textspalten höchstens rund 70 Zeichen breit.

## Bausteine

- **Plakette** (`plakette.js`): Scheibe in Statusfarbe, zwölf Ringsegmente wie ein Zifferblatt (12 oben = Dezember), das Fälligkeitssegment hell bzw. in Tinte hervorgehoben, Jahr zweistellig in der Mitte. Klein (3rem) in jeder Zeile, groß mit Monatsziffern im Auftakt. Ohne Datum: gestrichelter leerer Kreis.
- **Jahresband**: zwölf Monate ab dem laufenden, Spaltenbreite nach Tagen, Quartalsbeginn mit starker Linie und Q-Kennung, Tintenlinie für heute, ein Punkt je Stichtag; überlappende Punkte weichen in Spuren nach unten aus.
- **Pflichtzeile**: Plakette, Titel mit Quelle und Takt, Termin mit Abstand, „Heute erledigt“ und „Details“. Details klappen in der Zeile auf, kein Dialogfenster.
- **Knopf**: Tinte gefüllt (Hauptaktion), umrandet (Nebenaktion), rot umrandet (Entfernen/Löschen). Höhe 2.75rem, klein 2.25rem, Radius 0.625rem.
- **Schalter**: im Katalog, Tinte wenn aktiv.
- **Meldung**: unten mittig, Tinte, mit „Rückgängig“ nach jeder Änderung.

Icons sind eigene SVG-Linienzeichnungen, Strichstärke 2, 20er-Raster (`ICON` in `app.js`).

## Layout

Rahmen höchstens 72rem. Abstände aus der Skala `--raum-1` bis `--raum-7`. Über einer Überschrift mehr Raum als darunter. Unter 44rem einspaltig, Navigation als eigene Zeile, Plakette neben ihrer Legende.

## Bewegung

Sparsam, Ausklang `cubic-bezier(0.16, 1, 0.3, 1)`. Zwei gesetzte Momente: Der Ring der großen Plakette baut sich beim ersten Aufruf auf, und nach „Heute erledigt“ wird die Plakette der Zeile aufgestempelt. Alles andere sind kurze Zustandswechsel. `prefers-reduced-motion` schaltet alles ab.

## Vermeiden

Überschriften mit Vorzeile, gleichförmige Icon-Kartenraster, Karten in Karten, Verläufe, Glas-Effekte, dicke farbige Seitenränder an Karten, Emojis als Icons, große Kennzahl mit kleinem Etikett als Blickfang, Dialogfenster für Aufgaben ohne Unterbrechungsbedarf, Statusfarben als Schmuck.
