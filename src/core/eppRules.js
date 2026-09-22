/**
 * EPP-Stationen nach BDMP-Handbuch Sportordnung Teil C, C.17 (Stand 24.02.2026).
 *
 * Die Texte unter `roCommands` und `notes` sind aus der Sportordnung übernommen
 * bzw. eng daran entlang formuliert. Sie bleiben bewusst deutsch: Die Kommandos
 * werden auf dem Stand deutsch gesprochen, eine Übersetzung wäre am Wettkampf
 * nicht verwendbar.
 *
 * Zeitangaben durchgehend in Millisekunden.
 *   timeLimitMs           0 = offene Station, der RO stoppt nach dem Holstern
 *   stopSignalAtMs        Beginn des zweiten Signals, gemessen ab Startsignal
 *   stopSignalDurationMs  Dauer des zweiten Signals; Ende = Ende der Schießzeit
 */

export const EPP_TOTAL_TIME_MS = 330_000   // 5:30 Minuten, C.17.8
export const EPP_TOTAL_SHOTS   = 50        // C.17.8

/** Gilt an jeder Station, C.17.12 */
export const EPP_GENERAL_NOTES = [
  'Vor dem Startsignal steht der Schütze aufrecht in Richtung Scheibe, die Arme hängen zwanglos herab.',
  'Die Hände berühren weder Waffe noch Holster, bis das Startsignal gegeben wird.',
  'Laden, Entspannen und Holstern erfolgen ohne Ausnahme im Stehen.',
  'Das Laden der Waffe erfolgt ausschließlich im nichtgeholsterten Zustand.',
  'Bei einer Störung hebt der Schütze die freie Hand und meldet deutlich „Störung“. Die Zeit wird gestoppt.',
]

export const EPP_PHASES = [
  {
    id: 'st1',
    station: 'Station 1',
    distance: '7 m',
    position: 'stehend',
    shots: 10,
    shotsNote: '2 × 5, mit Magazinwechsel',
    timeLimitMs: 15_000,
    stopSignalAtMs: 13_000,
    stopSignalDurationMs: 2_000,
    ruleRef: 'C.17.14',
    roCommands: [
      'Laden, fertigmachen und holstern!',
    ],
    notes: [
      'Double-Action-Pistole: mit 5 Patronen laden, entspannen, holstern.',
      'Single-Action-Pistole und Pistolen ohne Entspannhebel: nur das gefüllte Magazin einsetzen, dann holstern.',
      'Revolver: mit 4 Patronen laden.',
      'Zweites Magazin mit 5 Patronen bzw. Speedloader mit 6 Patronen bereithalten.',
      'Auf das Startsignal ziehen und stehend schießen, ohne zu spannen bzw. nach dem Durchladen.',
      'Pistole: nach dem fünften Schuss selbstständig Magazinwechsel. Revolver: nach dem vierten Schuss 6 Patronen nachladen.',
      'Zweites Signal nach 13 Sekunden, Dauer 2 Sekunden. Jeder Schuss nach Ende des Signals wird nicht gewertet.',
    ],
    afterStation: [
      'Sicherheitskontrolle durch den RO, danach holstern.',
      'Nach der Meldung „Sicherheit“ auf die 1-m-Linie zur Trefferaufnahme vorgehen.',
      'Nach der Auswertung die Einschusslöcher mit 10 weißen Schusslochpflastern abkleben.',
    ],
  },
  {
    id: 'st2',
    station: 'Station 2',
    distance: '30 m',
    position: 'liegend',
    shots: 5,
    timeLimitMs: 0,
    ruleRef: 'C.17.14',
    roCommands: [
      'Laden, fertigmachen und holstern!',
    ],
    notes: [
      'Auf das Startsignal ziehen, Anschlag liegend einnehmen, erster Schuss ohne zu spannen bzw. nach dem Durchladen.',
      'Nach dem letzten Schuss nach vorn aufstehen, dann selbstständig laden, entspannen und holstern.',
      'Ab dieser Station darf nur noch ein Magazin benutzt werden, das wieder gefüllt werden muss; für den Revolver kein Schnelllader mehr (C.17.9).',
      'Die Zeit stoppt nach dem Holstern der geladenen Waffe.',
    ],
  },
  {
    id: 'st3',
    station: 'Station 3',
    distance: '25 m',
    position: 'stehend am Pfosten',
    shots: 10,
    shotsNote: '5 rechts, 5 links am Pfosten vorbei',
    timeLimitMs: 0,
    ruleRef: 'C.17.14',
    roCommands: [
      'Laden, fertigmachen und holstern!',
    ],
    notes: [
      'Auf das Startsignal ziehen und stehend mit der rechten Hand rechts am Pfosten vorbei schießen.',
      'Der Fuß muss Kontakt zur Verlängerung der seitlichen Begrenzung haben.',
      'Nach dem fünften Schuss selbstständig laden und entspannen, dann mit der linken Hand links am Pfosten vorbei.',
      'Die Schießhand darf mit der freien Hand unterstützt werden.',
      'Der Pfosten darf als Unterstützung dienen, die Waffe darf ihn jedoch nicht berühren.',
    ],
  },
  {
    id: 'st4',
    station: 'Station 4',
    distance: '20 m',
    position: 'sitzend',
    shots: 5,
    timeLimitMs: 0,
    ruleRef: 'C.17.14',
    roCommands: [
      'Laden, fertigmachen und holstern!',
    ],
    notes: [
      'Auf das Startsignal ziehen, auf den Boden setzen und schießen, ohne zu spannen bzw. nach dem Durchladen.',
      'Nach dem letzten Schuss aufstehen, dann laden, entspannen und holstern.',
    ],
  },
  {
    id: 'st5a',
    station: 'Station 5a',
    distance: '15 m',
    position: 'kniend',
    shots: 5,
    timeLimitMs: 0,
    ruleRef: 'C.17.14',
    roCommands: [
      'Laden, fertigmachen und holstern!',
    ],
    notes: [
      'Auf das Startsignal ziehen, Anschlag kniend einnehmen und schießen.',
      'Nach dem letzten Schuss aufstehen, dann laden, entspannen und holstern.',
    ],
  },
  {
    id: 'st5b',
    station: 'Station 5b',
    distance: '15 m',
    position: 'stehend',
    shots: 5,
    timeLimitMs: 10_000,
    stopSignalAtMs: 8_000,
    stopSignalDurationMs: 2_000,
    ruleRef: 'C.17.14',
    roCommands: [
      'Laden, fertigmachen und holstern!',
    ],
    notes: [
      'Ausnahme zu C.17.12: Hier darf die Waffe vor dem Startsignal am Griffstück erfasst werden.',
      'Auf das Startsignal ziehen, Anschlag stehend einnehmen und alle fünf Schüsse in zehn Sekunden abgeben.',
      'Zweites Signal nach 8 Sekunden, Dauer 2 Sekunden. Jeder Schuss nach Ende des Signals wird nicht gewertet.',
      'Nach dem letzten Schuss laden, entspannen und holstern.',
    ],
  },
  {
    id: 'st6',
    station: 'Station 6',
    distance: '10 m',
    position: 'stehend',
    shots: 10,
    shotsNote: '5 einhändig rechte Scheibe, 5 beidhändig linke Scheibe',
    timeLimitMs: 0,
    ruleRef: 'C.17.14',
    announceRemainingBeforeStart: true,   // C.17.8
    roCommands: [
      'Verbleibende Restzeit ansagen!',
      'Laden, fertigmachen und holstern!',
    ],
    notes: [
      'Die verbleibende Restzeit wird dem Schützen vor dem Startsignal mitgeteilt (C.17.8).',
      'Einzige Station, an der der erste Schuss nicht im Double-Action-Modus abgegeben wird (C.17.14).',
      'Auf das Startsignal ziehen, das Schlagstück von Hand spannen und stehend einhändig auf die obere rechte Ringscheibe schießen.',
      'Nach dem fünften Schuss erneut laden, spannen und beidhändig auf die obere linke Ringscheibe schießen.',
    ],
    afterStation: [
      'Nach dem letzten Schuss wird die Gesamtzeit gestoppt.',
      'Leere Waffe und gegebenenfalls Magazin der Aufsicht zur Sicherheitsüberprüfung vorzeigen, danach holstern.',
      'Auf Kommando auf die 1-m-Linie vorgehen.',
      'Die Restzeit auf der Auswertekarte des Schützen vermerken.',
    ],
  },
]

/**
 * Übersetzt Disziplinen aus dem Produktiv-Timer in das neue Modell.
 *
 * Der Produktiv-Timer speichert `warnSignal` als Sekunden AB Start und
 * `stoppSignalDauer` als Tondauer in Sekunden. Ohne diese Umsetzung fiele
 * das zweite Signal beim Import ersatzlos aus.
 */
export function migrateLegacyEppPhase(legacy) {
  const timeLimitMs = (legacy.zeitLimit ?? 0) * 1000
  const hasSignal = legacy.warnSignal > 0 && timeLimitMs > 0
  return {
    id: legacy.station ? String(legacy.station).toLowerCase().replace(/\s+/g, '') : undefined,
    station: legacy.station ?? 'Station',
    distance: legacy.distanz ?? '',
    position: legacy.anschlag ?? '',
    shots: legacy.shots ?? null,
    timeLimitMs,
    stopSignalAtMs: hasSignal ? legacy.warnSignal * 1000 : null,
    stopSignalDurationMs: hasSignal ? (legacy.stoppSignalDauer ?? 2) * 1000 : null,
    ruleRef: 'C.17.14',
    roCommands: [],
    notes: legacy.beschreibung ? [legacy.beschreibung] : [],
  }
}
