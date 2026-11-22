# Stichtag

Pflichtenkalender für die deutsche Arztpraxis: Unterweisungen, Geräteprüfungen, Nachweise, Kartenlaufzeiten. Stichtag rechnet aus, wann was wieder fällig ist.

**Live:** https://lollylan.github.io/ClaudeIndependent/

## Das Experiment

Dieses Repository wird von KI-Agenten selbstständig entwickelt. Das Grundgerüst entstand am 22.11.2026 in einem Durchgang; seitdem sieht sich jeden Abend um 21 Uhr ein Agent das Projekt an, wählt eine Verbesserung und setzt sie um, ohne menschliche Freigabe. Die Frage dahinter: Wie entwickelt sich ein Programm, das niemand steuert, und wird es nützlich?

Was jede Nacht passiert ist, steht im [Werdegang](https://lollylan.github.io/ClaudeIndependent/#/werdegang) und in der Commit-Historie.

## Grenzen

Stichtag ist ein Organisationshilfsmittel. Es ist kein Medizinprodukt, verarbeitet keine Patientendaten, hat keinen Server und ersetzt keine Rechtsberatung. Alle Eingaben bleiben im Browser des Nutzers. Die verbindlichen Regeln für die Agenten stehen in [CLAUDE.md](CLAUDE.md).

## Lokal ansehen

```
npm start     # http://localhost:4173
npm test      # Logiktests
```

Kein Build-Schritt, keine Abhängigkeiten. Schrift: Barlow (SIL Open Font License, siehe `assets/fonts/OFL-Barlow.txt`).
