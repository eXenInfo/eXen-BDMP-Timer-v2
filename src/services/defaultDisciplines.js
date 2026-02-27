/**
 * Standard BDMP-Disziplinen — 1:1 aus dem Original übernommen
 */
export const DEFAULT_DISCIPLINES = {
  "PP2": [
    { name: "5 Schuss, 10 Meter, Anschlag frei", prepTime: 5, duration: 10, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 15 Meter, Anschlag frei", prepTime: 5, duration: 15, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 25 Meter, stehend freihändig", prepTime: 5, duration: 30, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false }
  ],
  "PP3": [
    { name: "5 Schuss, 10 Meter, Anschlag frei", prepTime: 5, duration: 10, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 15 Meter, Anschlag frei", prepTime: 5, duration: 15, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 25 Meter, stehend freihändig", prepTime: 5, duration: 30, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 25 Meter, kniend freihändig", prepTime: 5, duration: 30, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false }
  ],
  "PP4": [
    { name: "5 Schuss, 10 Meter, Anschlag frei", prepTime: 5, duration: 10, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 15 Meter, Anschlag frei", prepTime: 5, duration: 15, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 25 Meter, stehend freihändig", prepTime: 5, duration: 30, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 25 Meter, kniend freihändig", prepTime: 5, duration: 30, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5 Schuss, 25 Meter, liegend freihändig", prepTime: 5, duration: 30, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false }
  ],
  "BDMP 1020": [
    { name: "2x5 Schuss, 25 Meter, stehend freihändig", prepTime: 5, duration: 30, repetitions: 2, pauseDuration: 10, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "2x5 Schuss, 25 Meter, kniend freihändig", prepTime: 5, duration: 30, repetitions: 2, pauseDuration: 10, soundAtStart: true, soundAtEnd: true, pauseAfter: false }
  ],
  "BDMP 1500": [
    { name: "5x5 Schuss, 25 Meter, stehend freihändig", prepTime: 5, duration: 60, repetitions: 5, pauseDuration: 15, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5x5 Schuss, 25 Meter, kniend freihändig", prepTime: 5, duration: 60, repetitions: 5, pauseDuration: 15, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
    { name: "5x5 Schuss, 25 Meter, liegend freihändig", prepTime: 5, duration: 60, repetitions: 5, pauseDuration: 15, soundAtStart: true, soundAtEnd: true, pauseAfter: false }
  ],
  "Zeitkontrolle 90s": [
    { name: "Zeitkontrolle", prepTime: 3, duration: 90, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false }
  ],
  "Zeitkontrolle 165s": [
    { name: "Zeitkontrolle", prepTime: 3, duration: 165, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false }
  ]
}

/**
 * EPP-Disziplin — separate Struktur mit isEpp: true
 */
export const EPP_DISCIPLINE = {
  name: "Europäischer Präzisions Parcours (EPP)",
  isEpp: true,
  prepTime: 3,
  phases: [
    {
      station: "Station 1", distanz: "7 m", anschlag: "Stehend freihändig",
      zeitLimit: 15, pausable: false, warnSignal: 13, stoppSignalDauer: 2,
      beschreibung: "2×5 Schuss, Magazinwechsel. Zeit ist fix."
    },
    {
      station: "Station 2", distanz: "30 m", anschlag: "Liegend freihändig",
      zeitLimit: 0, pausable: true,
      beschreibung: "Zeit wird durch RO gestoppt."
    },
    {
      station: "Station 3", distanz: "25 m", anschlag: "Stehend am Pfosten",
      zeitLimit: 0, pausable: true,
      beschreibung: "Zeit wird durch RO gestoppt."
    },
    {
      station: "Station 4", distanz: "20 m", anschlag: "Sitzend",
      zeitLimit: 0, pausable: true,
      beschreibung: "Zeit wird durch RO gestoppt."
    },
    {
      station: "Station 5a", distanz: "15 m", anschlag: "Kniend",
      zeitLimit: 0, pausable: true,
      beschreibung: "Zeit wird durch RO gestoppt."
    },
    {
      station: "Station 5b", distanz: "15 m", anschlag: "Stehend freihändig",
      zeitLimit: 10, pausable: false, warnSignal: 8, stoppSignalDauer: 2,
      beschreibung: "Zeit ist fix."
    },
    {
      station: "Station 6", distanz: "10 m", anschlag: "Stehend freihändig",
      zeitLimit: 0, pausable: true,
      beschreibung: "Zeit wird durch RO gestoppt."
    }
  ]
}
