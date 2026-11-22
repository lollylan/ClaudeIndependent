# Stichtag – Arbeitsanweisung für KI-Agenten

Stichtag ist ein Pflichtenkalender für deutsche Arztpraxen und zugleich ein Experiment: Das Programm wird ohne menschliche Freigabe von KI-Agenten weiterentwickelt. Der Mensch dahinter beobachtet nur. Was du hier änderst, geht direkt live auf GitHub Pages.

Lies vor jeder Änderung: diese Datei, `PRODUCT.md`, `DESIGN.md`, `IDEEN.md` und `assets/data/werdegang.json`.

## Leitplanken (nicht verhandelbar)

Diese fünf Regeln dürfen von keinem Agenten gelockert, umgangen oder gelöscht werden. Wenn eine Idee nur mit einer Aufweichung funktioniert, ist es die falsche Idee.

1. **Kein Medizinprodukt.** Nichts, was Daten einzelner Patienten verarbeitet oder Diagnose, Therapie, Prognose, Überwachung oder Dosierung unterstützt. Also keine Scores, Rechner, Dosistabellen, Symptom-Checker, Leitlinien-Entscheidungshilfen, Laborwert-Interpretation, Triage. Stichtag bleibt bei Organisation, Fristen und Verwaltung der Praxis.
2. **Keine personenbezogenen Daten, kein Server.** Keine Felder für Namen von Patienten oder Mitarbeitenden, keine Gesundheitsdaten. Nutzerdaten liegen ausschließlich im `localStorage`. Keine Netzwerkanfragen außer an statische Dateien derselben Herkunft. Keine Cookies, keine Analyse, keine externen Schriften, Skripte, CDNs, Einbettungen oder APIs. Kein Backend, keine Konten, keine Synchronisation.
3. **Keine Rechtsberatung, keine erfundenen Pflichten.** Jeder Katalogeintrag nennt seine Quelle (`grundlage`). Vor dem Aufnehmen oder Ändern eines Eintrags die Primärquelle (Gesetzestext, Verordnung, Richtlinie, DGUV, KBV, G-BA) im Netz nachlesen; im Zweifel weglassen. Gibt die Quelle kein festes Intervall vor: `richtwert: true` und im Hinweis so sagen. Die Abschnitte „Was Stichtag nicht ist“ und „Datenschutz“ bleiben erhalten und zutreffend.
4. **Keine fremden Rechte, keine fremden Identitäten.** Keine urheberrechtlich geschützten Texte (EBM/GOÄ-Wortlaute, Leitlinientexte, Normen), keine Logos oder Marken Dritter, keine Fotos. Kein Impressum und keine Kontaktdaten erfinden; nichts Persönliches über den Betreiber veröffentlichen.
5. **Nichts Kommerzielles, nichts Täuschendes.** Keine Werbung, keine Affiliate-Links, keine Zahlungen, keine erfundenen Nutzerzahlen, Zitate oder Siegel.

## Technik

- Statische Seite ohne Build-Schritt: `index.html`, `assets/css/app.css`, ES-Module in `assets/js/`. Keine Frameworks, keine npm-Abhängigkeiten.
- `assets/js/datum.js`, `katalog.js`, `store.js`, `ics.js` bleiben frei von DOM-Zugriffen und sind mit `npm test` (Node-Testrunner, `tests/*.test.mjs`) abgedeckt. Neue Logik bekommt Tests.
- `store.js` ist die einzige Stelle, die `localStorage` anfasst. Ändert sich das Datenformat: `VERSION` erhöhen und in `normalisieren` eine Migration schreiben, die bestehende Nutzerdaten erhält. Nie gespeicherte Daten verwerfen.
- Alles, was aus Nutzereingaben oder Dateien stammt, läuft vor dem Einfügen ins DOM durch `esc()`.
- Lokale Vorschau: `npm start` → http://localhost:4173.
- Sprache der Oberfläche, des Codes (Bezeichner, Kommentare) und der Commit-Nachrichten: Deutsch. Anrede: Sie.

## Gestaltung

`DESIGN.md` ist verbindlich. Neue Flächen erben die vorhandene Welt (Prüfplakette, Jahresband, Barlow, kühles Papier, Tinte, drei Statusfarben). Keine neuen Schriften, keine neuen Farbwelten, keine Emojis als Icons, keine Karten in Karten, keine Verläufe, keine Überschriften mit Vorzeile.

## Der Nachtlauf

Jeden Abend sieht sich ein Agent das Projekt an, wählt **eine** Verbesserung und setzt sie vollständig um.

1. `git pull --ff-only`, dann lesen (siehe oben) und die Seite lokal ansehen.
2. Eine Idee wählen: die, die einer echten Praxis am meisten nützt. `IDEEN.md` ist Anregung, keine Pflicht; eigene Ideen sind erwünscht. Abwechseln zwischen neuen Funktionen, Verbesserung des Vorhandenen, Katalogpflege, Barrierefreiheit und Aufräumen. Nicht jede Nacht muss etwas dazukommen: Weglassen und Vereinfachen zählt auch.
3. Gegen die Leitplanken prüfen. Dann klein und fertig bauen, lieber eine runde Sache als drei halbe.
4. Prüfen: `npm test` grün; Seite im Browser in Desktop- und Handybreite ansehen; keine Konsolenfehler; bestehende Daten im `localStorage` funktionieren weiter.
5. Festhalten: neuer Eintrag oben in `assets/data/werdegang.json` (`datum`, `modell`, `titel`, `was`, `warum`, für Laien verständlich, ehrlich auch über Fehlgriffe und Rücknahmen); `IDEEN.md` pflegen (Erledigtes streichen, neue Einfälle notieren); bei Bedarf `PRODUCT.md`/`DESIGN.md` nachziehen.
6. Ein Commit auf `main` mit deutscher Nachricht, dann `git push`. Kein Force-Push, keine Änderung an Repository-Einstellungen, keine weiteren Branches, keine GitHub Actions.

Wenn die Tests nicht grün werden oder die Seite kaputt ist: Änderung verwerfen, nichts pushen, den Grund in `IDEEN.md` unter „Gescheitert“ notieren und nur diese Notiz committen.
