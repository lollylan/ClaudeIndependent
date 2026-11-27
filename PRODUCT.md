# Stichtag – Produkt

## Was es ist

Ein Pflichtenkalender für die deutsche Arztpraxis. Eine Praxis hat Dutzende wiederkehrende Pflichten mit unterschiedlichen Takten: Unterweisungen jedes Jahr, Geräteprüfungen alle zwei, der Fortbildungsnachweis alle fünf, der eHBA läuft irgendwann ab. Niemand hat das im Kopf, und im QM-Ordner steht es, ohne sich zu melden. Stichtag rechnet aus, wann was wieder fällig ist, und zeigt es auf einen Blick.

## Für wen

Praxisinhaberinnen und -inhaber sowie die Mitarbeiterin, die das QM betreut. Hausarztpraxis zuerst, andere Fachrichtungen später denkbar. Benutzt wird es am Praxisrechner, tagsüber, zwischen zwei anderen Dingen: einmal im Monat fünf Minuten, oder gezielt, wenn der Prüfdienst im Haus war.

## Der Mechanismus

Der Nutzer wählt aus einem Katalog, was für seine Praxis gilt, und trägt ein, wann es zuletzt erledigt wurde. Stichtag addiert das Intervall und sortiert nach Dringlichkeit. „Heute erledigt“ setzt die Uhr neu.

## Was es kann (Stand Grundgerüst)

- Katalog mit 23 Pflichten in fünf Bereichen, jeweils mit Quelle; Richtwerte sind als solche markiert
- Startpaket „Typische Hausarztpraxis“
- Eigene Pflichten mit freiem Intervall
- Mehrere Exemplare derselben Pflicht (etwa je Blutdruckmessgerät eine MTK), jedes mit eigener Bezeichnung und eigenem Datum
- Vorlaufzeit je Pflicht in Wochen: Die Pflicht wird so lange vor dem Stichtag gelb, sonst 30 Tage vorher; die Kalendererinnerung rückt mit
- Übersicht nach Dringlichkeit: überfällig, in 30 Tagen (bzw. „Bald fällig“, wenn ein Vorlauf greift), ohne Datum, später; bei Pflichten ohne Datum steht das Datumsfeld direkt in der Zeile, nach der Eingabe geht es zur nächsten
- Jahresband über zwölf Monate mit Quartalsgrenzen
- Sicherung als JSON-Datei mit Erinnerung, wenn noch nie oder vor über 30 Tagen gesichert wurde und sich seitdem etwas geändert hat; Export der Stichtage als Kalenderdatei (.ics)
- Druckblatt (A4) für den QM-Ordner mit Spalten zum handschriftlichen Abzeichnen
- Werdegang: öffentliches Protokoll der autonomen Weiterentwicklung

## Was es bewusst nicht ist

Kein Medizinprodukt, kein Patientenbezug, kein Server, keine Konten, keine Rechtsberatung, kein Ersatz für das QM-System. Die Grenzen stehen in `CLAUDE.md` unter „Leitplanken“.

## Ton

Kollegial und sachlich, Sie-Form. Kurze Sätze, konkrete Begriffe aus dem Praxisalltag (Unterweisung, STK, Quartal). Keine Werbesprache, keine Ausrufezeichen, keine Verniedlichung.

## Erfolg

Eine Praxis verpasst eine Frist nicht, die sie sonst verpasst hätte. Und sie versteht das Programm, ohne eine Anleitung zu lesen.
