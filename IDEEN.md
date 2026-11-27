# Ideenspeicher

Anregungen für den Nachtlauf. Keine Reihenfolge, keine Pflicht. Erledigtes streichen, neue Einfälle ergänzen. Jede Idee muss die Leitplanken in `CLAUDE.md` einhalten.

## Offen

- ~~Druckansicht: Jahresübersicht der Stichtage als sauberes A4-Blatt für den QM-Ordner~~ (erledigt 22.11.2026, `#/druck`)
- ~~Mehrere Exemplare derselben Pflicht (z. B. drei Blutdruckmessgeräte mit eigenen Daten)~~ (erledigt 26.11.2026: „Weiteres Exemplar“ unter „Details“, Bezeichnung dort änderbar)
- Pflicht mit festem Kalendertermin statt Intervall (z. B. Abgabefrist immer am 10. nach Quartalsende)
- Erledigt an einem anderen Tag als heute, ohne die Details aufzuklappen (für Pflichten ohne Datum seit 25.11.2026 gelöst; bei Pflichten mit Datum fehlt es noch, etwa als kleines „Anderer Tag …“ neben „Heute erledigt“)
- Verlauf je Pflicht: wann wurde sie in der Vergangenheit erledigt
- Filter oder Suche, sobald die Liste lang wird
- Katalog erweitern (jeweils Primärquelle prüfen): Fachrichtungen jenseits der Hausarztpraxis, Laborqualitätssicherung, Aufbewahrungsfristen als eigene Art von Stichtag
- ~~Vorlaufzeit je Pflicht (manche brauchen acht Wochen Vorlauf, etwa die eHBA-Folgekarte)~~ (erledigt 27.11.2026: „Vorlauf in Wochen“ unter „Details“, wirkt auf Status, Druckblatt und Kalendererinnerung)
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
- Nach jeder Eingabe in „Details“ zeichnet Stichtag alles neu: Die Zeile springt in eine andere Gruppe, der Fokus landet wieder im Tagesteil des Datums, und ein Klick, der das Feld verlässt, kann verloren gehen. Neu zeichnen gezielter machen (26.11.2026 teilweise: Bei Bezeichnung, Intervall und Notiz geht der Fokus per Tab jetzt ins nächste Feld statt auf die Seite; 27.11.2026: Springt die Zeile in eine andere Gruppe, folgt die Ansicht; der verlorene Klick bleibt)
- Exemplare: Ein Exemplar sollte auch direkt im Katalog angelegt werden können, nicht nur über „Details“ in der Übersicht
- Exemplare im Druckblatt und in der Übersicht nach Pflicht gruppieren, wenn es viele werden
- ~~Ins Zahlenfeld „Intervall“ getippte Ziffern hängen sich an den alten Wert an~~ (erledigt 27.11.2026: Inhalt wird beim Betreten markiert)
- Datumseingabe in Firefox und Safari ausprobieren (bisher nur Chrome geprüft)
- Gemeinsamen Sortier- und Statuscode von Übersicht (`angereichert` in `app.js`) und Druckblatt (`druck.js`) zusammenführen
- Meldung nach „Heute erledigt“ an die neue Zeilen-Meldung angleichen (`D.stichtagSatz` mit Abstand in Worten)
- Beim Startpaket gleich in die erste Zeile ohne Datum springen statt auf die Überschrift
- Vorlauf auch im Katalog vorschlagen, wo eine Quelle ihn belegt (etwa Bestellfristen für Folgekarten); bisher bewusst leer
- Ein Vorlauf beim Anlegen eines weiteren Exemplars wird mitkopiert; prüfen, ob das in der Praxis stört
- In den Details stehen die Eingabefelder durch den Hilfstext unter „Vorlauf“ wenige Pixel versetzt; bei Gelegenheit die Felder unten bündig ausrichten
- Bei „eHBA läuft ab“ passt „Zuletzt erledigt am“ schlecht; dort eher „Karte ausgestellt am“ oder ein festes Ablaufdatum (hängt an der Idee mit festen Kalenderterminen)

## Gescheitert

(noch nichts)
