// Katalog wiederkehrender Praxispflichten.
//
// Regeln für jeden Eintrag (siehe CLAUDE.md, Leitplanke 3):
// - `grundlage` nennt die Quelle, auf die sich die Pflicht stützt.
// - `richtwert: true`, wenn die Quelle KEIN festes Intervall vorgibt und der
//   Wert nur eine gängige Praxis ist. Der Nutzer kann jedes Intervall ändern.
// - `starter: true` = Teil des Startpakets "Typische Hausarztpraxis".
// - Keine patientenbezogenen Inhalte, keine medizinischen Empfehlungen.

export const BEREICHE = [
  { id: 'team', titel: 'Team und Arbeitsschutz' },
  { id: 'geraete', titel: 'Geräte und Technik' },
  { id: 'hygiene', titel: 'Hygiene und Arzneimittel' },
  { id: 'orga', titel: 'Organisation und Qualität' },
  { id: 'it', titel: 'Telematik und IT' },
];

export const KATALOG = [
  // Team und Arbeitsschutz
  {
    id: 'arbeitsschutz-unterweisung', bereich: 'team', starter: true,
    titel: 'Arbeitsschutz-Unterweisung des Teams', intervallMonate: 12,
    grundlage: 'ArbSchG § 12, DGUV Vorschrift 1 § 4',
    hinweis: 'Mindestens einmal jährlich, mit Dokumentation.',
  },
  {
    id: 'biostoff-unterweisung', bereich: 'team', starter: true,
    titel: 'Unterweisung Biostoffe (Infektionsgefährdung)', intervallMonate: 12,
    grundlage: 'BioStoffV § 14, TRBA 250',
    hinweis: 'Jährlich, mündlich und arbeitsplatzbezogen.',
  },
  {
    id: 'gefahrstoff-unterweisung', bereich: 'team', starter: true,
    titel: 'Unterweisung Gefahrstoffe', intervallMonate: 12,
    grundlage: 'GefStoffV § 14',
    hinweis: 'Jährlich, anhand der Betriebsanweisungen (z. B. Desinfektionsmittel).',
  },
  {
    id: 'gefaehrdungsbeurteilung', bereich: 'team', starter: true, richtwert: true,
    titel: 'Gefährdungsbeurteilung überprüfen', intervallMonate: 12,
    grundlage: 'ArbSchG § 5',
    hinweis: 'Keine feste Frist; regelmäßig und bei jeder Änderung der Arbeitsbedingungen.',
  },
  {
    id: 'brandschutz-unterweisung', bereich: 'team', richtwert: true,
    titel: 'Brandschutz-Unterweisung', intervallMonate: 12,
    grundlage: 'ArbSchG § 12, ASR A2.2',
    hinweis: 'Üblich im Rahmen der jährlichen Unterweisung.',
  },
  {
    id: 'ersthelfer', bereich: 'team',
    titel: 'Fortbildung der betrieblichen Ersthelfer', intervallMonate: 24,
    grundlage: 'DGUV Vorschrift 1 § 26',
    hinweis: 'In der Regel alle zwei Jahre.',
  },
  {
    id: 'notfalltraining', bereich: 'team', starter: true, richtwert: true,
    titel: 'Notfalltraining im Team', intervallMonate: 12,
    grundlage: 'QM-Richtlinie des G-BA (Notfallmanagement)',
    hinweis: 'Die Richtlinie verlangt regelmäßiges Training, nennt aber kein Intervall.',
  },
  {
    id: 'arbmed-vorsorge', bereich: 'team', richtwert: true,
    titel: 'Arbeitsmedizinische Vorsorge anbieten', intervallMonate: 36,
    grundlage: 'ArbMedVV',
    hinweis: 'Die Fristen legt die Betriebsärztin oder der Betriebsarzt fest.',
  },

  // Geräte und Technik
  {
    id: 'stk', bereich: 'geraete', starter: true,
    titel: 'Sicherheitstechnische Kontrolle (z. B. Defibrillator)', intervallMonate: 24,
    grundlage: 'MPBetreibV, Anlage 1',
    hinweis: 'Nach Herstellerangabe, spätestens alle zwei Jahre.',
  },
  {
    id: 'mtk', bereich: 'geraete', starter: true,
    titel: 'Messtechnische Kontrolle (z. B. Blutdruckmessgeräte)', intervallMonate: 24,
    grundlage: 'MPBetreibV, Anlage 2',
    hinweis: 'Fristen je Gerätetyp laut Anlage 2; nichtinvasive Blutdruckmessgeräte alle zwei Jahre.',
  },
  {
    id: 'dguv-v3', bereich: 'geraete', starter: true, richtwert: true,
    titel: 'Prüfung elektrischer Geräte', intervallMonate: 24,
    grundlage: 'DGUV Vorschrift 3',
    hinweis: 'Frist nach Gefährdungsbeurteilung; für ortsveränderliche Geräte in Büroumgebung häufig 24 Monate.',
  },
  {
    id: 'feuerloescher', bereich: 'geraete', starter: true,
    titel: 'Feuerlöscher prüfen lassen', intervallMonate: 24,
    grundlage: 'ASR A2.2',
    hinweis: 'Alle zwei Jahre durch eine sachkundige Person.',
  },

  // Hygiene und Arzneimittel
  {
    id: 'hygieneplan', bereich: 'hygiene', starter: true, richtwert: true,
    titel: 'Hygieneplan überprüfen und aktualisieren', intervallMonate: 12,
    grundlage: 'IfSG § 23, TRBA 250',
    hinweis: 'Jährliche Durchsicht ist gängige Praxis; zusätzlich bei jeder Änderung der Abläufe.',
  },
  {
    id: 'aufbereitung-validierung', bereich: 'hygiene', richtwert: true,
    titel: 'Aufbereitungsprozess validieren (Sterilisator)', intervallMonate: 12,
    grundlage: 'MPBetreibV, KRINKO/BfArM-Empfehlung',
    hinweis: 'Nur bei eigener Aufbereitung. Das Intervall steht im Validierungsbericht.',
  },
  {
    id: 'notfallausruestung', bereich: 'hygiene', starter: true, richtwert: true,
    titel: 'Notfallausrüstung und Verfalldaten prüfen', intervallMonate: 3,
    grundlage: 'QM-Richtlinie des G-BA (Notfallmanagement)',
    hinweis: 'Intervall selbst festlegen; vierteljährlich ist verbreitet.',
  },
  {
    id: 'btm-bestand', bereich: 'hygiene',
    titel: 'BtM-Bestand prüfen und abzeichnen', intervallMonate: 1,
    grundlage: 'BtMVV § 13',
    hinweis: 'Am Ende jedes Kalendermonats, sofern ein BtM-Bestand geführt wird.',
  },

  // Organisation und Qualität
  {
    id: 'fortbildungsnachweis', bereich: 'orga', starter: true,
    titel: 'Fortbildungsnachweis (250 CME-Punkte)', intervallMonate: 60,
    grundlage: 'SGB V § 95d',
    hinweis: 'Nachweis gegenüber der KV alle fünf Jahre. Tragen Sie den Beginn Ihres Zeitraums ein.',
  },
  {
    id: 'qm-selbstbewertung', bereich: 'orga', starter: true, richtwert: true,
    titel: 'QM-Selbstbewertung und Zielplanung', intervallMonate: 12,
    grundlage: 'QM-Richtlinie des G-BA',
    hinweis: 'Regelmäßig verlangt, ohne festes Intervall; jährlich ist üblich.',
  },
  {
    id: 'datenschutz-schulung', bereich: 'orga', starter: true, richtwert: true,
    titel: 'Datenschutz-Schulung des Teams', intervallMonate: 12,
    grundlage: 'DSGVO Art. 32 (organisatorische Maßnahmen)',
    hinweis: 'Kein gesetzliches Intervall; jährliche Auffrischung ist üblich.',
  },
  {
    id: 'quartalsabrechnung', bereich: 'orga', starter: true,
    titel: 'Quartalsabrechnung bei der KV einreichen', intervallMonate: 3,
    grundlage: 'Abrechnungsrichtlinie Ihrer KV',
    hinweis: 'Die Abgabefrist legt jede KV selbst fest. Tragen Sie Ihre letzte Abgabe ein.',
  },

  // Telematik und IT
  {
    id: 'ehba', bereich: 'it', starter: true, richtwert: true,
    titel: 'eHBA läuft ab', intervallMonate: 60,
    grundlage: 'Zertifikatslaufzeit der Karte',
    hinweis: 'Ausstellungsdatum eintragen; die Laufzeit steht auf der Karte. Folgekarte früh bestellen.',
  },
  {
    id: 'smcb', bereich: 'it', richtwert: true,
    titel: 'Praxisausweis (SMC-B) läuft ab', intervallMonate: 60,
    grundlage: 'Zertifikatslaufzeit der Karte',
    hinweis: 'Ausstellungsdatum eintragen; die Laufzeit nennt Ihr Kartenanbieter.',
  },
  {
    id: 'ruecksicherung', bereich: 'it', starter: true, richtwert: true,
    titel: 'Datensicherung: Rücksicherung testen', intervallMonate: 3,
    grundlage: 'IT-Sicherheitsrichtlinie der KBV',
    hinweis: 'Eine Sicherung zählt erst, wenn die Wiederherstellung geklappt hat.',
  },
];

export function katalogEintrag(id) {
  return KATALOG.find((k) => k.id === id) || null;
}
