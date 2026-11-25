# Ideenspeicher

Anregungen für den Nachtlauf. Keine Reihenfolge, keine Pflicht. Erledigtes streichen, neue Einfälle ergänzen. Jede Idee muss die Leitplanken in `CLAUDE.md` einhalten.

## Offen

- ~~Druckansicht: Jahresübersicht der Stichtage als sauberes A4-Blatt für den QM-Ordner~~ (erledigt 22.11.2026, `#/druck`)
- Mehrere Exemplare derselben Pflicht (z. B. drei Blutdruckmessgeräte mit eigenen Daten)
- Pflicht mit festem Kalendertermin statt Intervall (z. B. Abgabefrist immer am 10. nach Quartalsende)
- Erledigt an einem anderen Tag als heute, ohne die Details aufzuklappen (für Pflichten ohne Datum seit 25.11.2026 gelöst; bei Pflichten mit Datum fehlt es noch, etwa als kleines „Anderer Tag …“ neben „Heute erledigt“)
- Verlauf je Pflicht: wann wurde sie in der Vergangenheit erledigt
- Filter oder Suche, sobald die Liste lang wird
- Katalog erweitern (jeweils Primärquelle prüfen): Fachrichtungen jenseits der Hausarztpraxis, Laborqualitätssicherung, Aufbewahrungsfristen als eigene Art von Stichtag
- Vorlaufzeit je Pflicht (manche brauchen acht Wochen Vorlauf, etwa die eHBA-Folgekarte)
- ~~Hinweis auf eine veraltete Sicherung~~ (erledigt 23.11.2026: Zeile unter dem Jahresband, Schwelle 30 Tage mit Änderungen; im Browser noch nicht angesehen, die Vorschau durfte nicht starten)
- Offline nutzbar machen (Service Worker, nur eigene Dateien)
- Tastaturkürzel und Sprunganker für häufige Wege
- Barrierefreiheit prüfen: Screenreader-Durchlauf, Kontraste, Fokusreihenfolge
- Werdegang um eine kleine Statistik ergänzen (Anzahl Nächte, Art der Änderungen)
- Druckblatt: wahlweise nach Bereich gruppiert statt nach Datum; auf echtem Papier prüfen, ob Querformat besser passt
- ~~Sicherungshinweis im Browser ansehen~~ (24.11.2026 am Desktop auf der Live-Seite gesehen, sitzt ordentlich; Handybreite nur auf Überbreite geprüft)
- Beim Einspielen einer Sicherung vorher fragen oder zusammenführen, statt den Stand zu ersetzen (bisher hilft nur „Rückgängig“)
- ~~Datum per Tastatur eintippen~~ (erledigt 24.11.2026: Chrome/Edge meldeten schon „0002“ als Datum; jetzt `pruefeErledigtAm` in `datum.js`)
- ~~Nach dem Startpaket stehen alle Pflichten ohne Datum da: Feld „Zuletzt erledigt“ direkt in der Zeile, danach zur nächsten Zeile ohne Datum springen~~ (erledigt 25.11.2026: `data-ort="zeile"`, Fokus und Bildschirmposition wandern mit)
- Nach jeder Eingabe in „Details“ zeichnet Stichtag alles neu: Die Zeile springt in eine andere Gruppe, der Fokus landet wieder im Tagesteil des Datums, und ein Klick, der das Feld verlässt, kann verloren gehen. Neu zeichnen gezielter machen
- Datumseingabe in Firefox und Safari ausprobieren (bisher nur Chrome geprüft)
- Gemeinsamen Sortier- und Statuscode von Übersicht (`angereichert` in `app.js`) und Druckblatt (`druck.js`) zusammenführen
- Meldung nach „Heute erledigt“ an die neue Zeilen-Meldung angleichen (`D.stichtagSatz` mit Abstand in Worten)
- Beim Startpaket gleich in die erste Zeile ohne Datum springen statt auf die Überschrift
- Bei „eHBA läuft ab“ passt „Zuletzt erledigt am“ schlecht; dort eher „Karte ausgestellt am“ oder ein festes Ablaufdatum (hängt an der Idee mit festen Kalenderterminen)

## Gescheitert

(noch nichts)
