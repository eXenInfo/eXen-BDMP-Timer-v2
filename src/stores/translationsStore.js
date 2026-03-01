import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadFromStorage, saveToStorage } from '../services/storage.js'

const STORAGE_KEY = 'PHASE_TEXT_MAP'

/**
 * Built-in English translations for all default disciplines and EPP stations.
 * German original texts are used as keys; the `en` locale is pre-seeded.
 * User changes are merged on top and persisted in localStorage.
 */
const DEFAULT_TRANSLATIONS = {

  // ── Police Pistol 2 (PP2) ────────────────────────────────────────────────
  "Station A: 10m\n2x 6 Schuss in 5 Sekunden": { en: "Station A: 10m\n2×6 rounds in 5 seconds" },
  "Station B: 50m\n24 Schuss in 3 Minuten":    { en: "Station B: 50m\n24 rounds in 3 minutes" },
  "Station C: 25m\n24 Schuss in 2 Minuten":    { en: "Station C: 25m\n24 rounds in 2 minutes" },

  // ── Police Pistol 3 (Carry Gun) ──────────────────────────────────────────
  "Stage 1: 20m\n2x 5 Schuss in 100 Sekunden":     { en: "Stage 1: 20m\n2×5 rounds in 100 seconds" },
  "Stage 2: 15m\n2x (5x 1 Schuss in 2s)":          { en: "Stage 2: 15m\n2×(5×1 round in 2s)" },
  "Stage 3: 10m\n2x (max. 2-2-1 Schuss in 3x 2s)": { en: "Stage 3: 10m\n2×(max. 2-2-1 rounds in 3×2s)" },

  // ── Police Pistol 4 (Pocket Gun) ─────────────────────────────────────────
  "Stage 1: 15m\n2x 5 Schuss in 100 Sekunden":    { en: "Stage 1: 15m\n2×5 rounds in 100 seconds" },
  "Stage 2: 10m\n2x (5x 1 Schuss in 2s)":         { en: "Stage 2: 10m\n2×(5×1 round in 2s)" },
  "Stage 3: 7m\n2x (max. 2-2-1 Schuss in 3x 2s)": { en: "Stage 3: 7m\n2×(max. 2-2-1 rounds in 3×2s)" },

  // ── BDMP 1020 ────────────────────────────────────────────────────────────
  "Match 1: 7 Meter\n2x6 Schuss 20 Sek. stehend frei.\nWaffen laden und Holstern.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Match 1: 7 metres\n2×6 rounds 20 sec. standing unsupported.\nLoad weapons and holster.\nIs anyone not ready? — STANDBY!" },
  "Match 1: 15 Meter\n2x6 Schuss 20 Sek. stehend frei.\nWaffen laden und Holstern.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Match 1: 15 metres\n2×6 rounds 20 sec. standing unsupported.\nLoad weapons and holster.\nIs anyone not ready? — STANDBY!" },
  "Match 2: 25 Meter\n18 Schuss (6 kniend, 6 links, 6 rechts) 90 Sek. \nWaffen laden und Holstern.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Match 2: 25 metres\n18 rounds (6 kneeling, 6 left, 6 right) 90 sec.\nLoad weapons and holster.\nIs anyone not ready? — STANDBY!" },
  "Match 3: 25 Meter (1. Durchgang)\n2x6 Schuss 35 Sek. stehend frei.\nWaffen laden und Holstern.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Match 3: 25 metres (1st run)\n2×6 rounds 35 sec. standing unsupported.\nLoad weapons and holster.\nIs anyone not ready? — STANDBY!" },
  "Match 3: 25 Meter (2. Durchgang)\n2x6 Schuss 35 Sek. stehend frei.\nWaffen laden und Holstern.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Match 3: 25 metres (2nd run)\n2×6 rounds 35 sec. standing unsupported.\nLoad weapons and holster.\nIs anyone not ready? — STANDBY!" },
  "Match 4: 25 Meter\n24 Schuss (6 sitzend, 6 kniend, 6 links, 6 rechts) 165 Sek.\nWaffen laden und Holstern.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Match 4: 25 metres\n24 rounds (6 seated, 6 kneeling, 6 left, 6 right) 165 sec.\nLoad weapons and holster.\nIs anyone not ready? — STANDBY!" },
  "Match 5: 25 Meter (1. Durchgang)\n6 Schuss 12 Sek. stehend frei.\nWaffen laden und Holstern.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Match 5: 25 metres (1st run)\n6 rounds 12 sec. standing unsupported.\nLoad weapons and holster.\nIs anyone not ready? — STANDBY!" },
  "Match 5: 25 Meter (2. Durchgang)\n6 Schuss 12 Sek. stehend frei.\nWaffen laden und Holstern.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Match 5: 25 metres (2nd run)\n6 rounds 12 sec. standing unsupported.\nLoad weapons and holster.\nIs anyone not ready? — STANDBY!" },

  // ── BDMP 1500 Matches 1-5 C.8.2 ─────────────────────────────────────────
  "Match 1: 7 Meter/Yards - 20 Sekunden - nur double action\n12 Schüsse    stehend frei":
    { en: "Match 1: 7 metres/yards - 20 seconds - double action only\n12 rounds    standing unsupported" },
  "Match 1: 15 Meter/Yards - 20 Sekunden - nur double action\n12 Schüsse    stehend frei":
    { en: "Match 1: 15 metres/yards - 20 seconds - double action only\n12 rounds    standing unsupported" },
  "Match 2: 25 Meter/Yards - 90 Sekunden - nur double action \n6 Schüsse    kniend frei\n6 Schüsse    stehend, linke Hand, Pfosten links\n6 Schüsse    stehend, rechte Hand, Pfosten rechts":
    { en: "Match 2: 25 metres/yards - 90 seconds - double action only\n6 rounds    kneeling unsupported\n6 rounds    standing, left hand, left barricade\n6 rounds    standing, right hand, right barricade" },
  "Match 3:  50 Meter/Yards - 165 Sekunden - auch single action erlaubt\n6 Schüsse    sitzend\n6 Schüsse    liegend\n6 Schüsse    stehend, linke Hand, Pfosten links\n6 Schüsse    stehend, rechte Hand, Pfosten rechts":
    { en: "Match 3: 50 metres/yards - 165 seconds - single action also permitted\n6 rounds    seated\n6 rounds    prone\n6 rounds    standing, left hand, left barricade\n6 rounds    standing, right hand, right barricade" },
  "Match 4: 25 Meter/Yards - 35 Sekunden - nur double action\n12 Schüsse    stehend frei":
    { en: "Match 4: 25 metres/yards - 35 seconds - double action only\n12 rounds    standing unsupported" },
  "Wiederholung\nMatch 4: 25 Meter/Yards - 35 Sekunden - nur double action\n12 Schüsse    stehend frei":
    { en: "Repeat\nMatch 4: 25 metres/yards - 35 seconds - double action only\n12 rounds    standing unsupported" },
  "Match 5 - Station 1: \n7 Meter/Yards - 20 Sekunden - nur double action \n12 Schüsse    stehend frei":
    { en: "Match 5 - Station 1:\n7 metres/yards - 20 seconds - double action only\n12 rounds    standing unsupported" },
  "Match 5 - Station 2:\n25 Meter/Yards - 90 Sekunden - nur double action\n6 Schüsse    kniend frei\n6 Schüsse    linke Hand, Pfosten links\n6 Schüsse    rechte Hand, Pfosten rechts":
    { en: "Match 5 - Station 2:\n25 metres/yards - 90 seconds - double action only\n6 rounds    kneeling unsupported\n6 rounds    left hand, left barricade\n6 rounds    right hand, right barricade" },
  "Match 5 - Station 3:\n50 Meter/Yards - 165 Sekunden - auch single action erlaubt\n6 Schüsse sitzend\n6 Schüsse liegend\n6 Schüsse stehend, linke Hand, Pfosten links\n6 Schüsse stehend, rechte Hand, Pfosten rechts":
    { en: "Match 5 - Station 3:\n50 metres/yards - 165 seconds - single action also permitted\n6 rounds seated\n6 rounds prone\n6 rounds standing, left hand, left barricade\n6 rounds standing, right hand, right barricade" },

  // ── NPA Service Pistole (A-B-OS) ─────────────────────────────────────────
  "Stage 1 - 25 Meter\n6 Schuss in 15 Sekunden auf die linke Scheibe.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Stage 1 - 25 metres\n6 rounds in 15 seconds on the left target.\nIs anyone not ready? — STANDBY!" },
  "Stage 2 - 20 Meter\n6 Schuss in 10 Sekunden davon 3 auf jede Scheibe.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Stage 2 - 20 metres\n6 rounds in 10 seconds, 3 on each target.\nIs anyone not ready? — STANDBY!" },
  "Stage 3 - 15 Meter\n2 Schuss in 3 Sekunden mit 3 Wiederholungen auf die rechte Scheibe.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Stage 3 - 15 metres\n2 rounds in 3 seconds, 3 repetitions on the right target.\nIs anyone not ready? — STANDBY!" },
  "Stage 4 - 10 Meter\n6 Schuss in 6 Sekunden davon 3 auf jede Scheibe.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Stage 4 - 10 metres\n6 rounds in 6 seconds, 3 on each target.\nIs anyone not ready? — STANDBY!" },

  // ── Police Pistol 1 (A-B-OS) ─────────────────────────────────────────────
  "Stage 1: 25m\n12 Schuss, bzw. 2x6 Schuss in 120 Sekunden.\nWaffen laden und fertig machen.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Stage 1: 25m\n12 rounds, or 2×6 rounds in 120 seconds.\nLoad weapons and make ready.\nIs anyone not ready? — STANDBY!" },
  "Stage 2: 15m (1. Durchgang)\n6x 1 Schuss in 2 Sekunden.\nWaffen laden und fertig machen.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Stage 2: 15m (1st run)\n6×1 round in 2 seconds.\nLoad weapons and make ready.\nIs anyone not ready? — STANDBY!" },
  "Stage 2: 15m (2. Durchgang)\n6x 1 Schuss in 2 Sekunden.\nWaffen laden und fertig machen.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Stage 2: 15m (2nd run)\n6×1 round in 2 seconds.\nLoad weapons and make ready.\nIs anyone not ready? — STANDBY!" },
  "Stage 3: 10m\n3x 2 Schuss in 2 Sekunden.\nWaffen laden und fertig machen.\nIst jemand nicht fertig? - ACHTUNG!":
    { en: "Stage 3: 10m\n3×2 rounds in 2 seconds.\nLoad weapons and make ready.\nIs anyone not ready? — STANDBY!" },

  // ── Police Pistol 1 (SM) ─────────────────────────────────────────────────
  "Stage 1: 25m\n2x 5 Schuss in 120 Sekunden": { en: "Stage 1: 25m\n2×5 rounds in 120 seconds" },
  "Stage 2: 15m\n2x (5x 1 Schuss in 3s)":      { en: "Stage 2: 15m\n2×(5×1 round in 3s)" },
  "Stage 3: 10m\n2x (5x 1 Schuss in 2s)":      { en: "Stage 3: 10m\n2×(5×1 round in 2s)" },

  // ── Zeitkontrolle Schütze ────────────────────────────────────────────────
  "90 Sekunden":  { en: "90 seconds" },
  "165 Sekunden": { en: "165 seconds" },

  // ── Police Pistol 1 (LAR) ────────────────────────────────────────────────
  "Stage 1: 25m\n12 Schuss in 2 Minuten":                    { en: "Stage 1: 25m\n12 rounds in 2 minutes" },
  "Stage 2: 15m (1. Durchgang)\n6x 1 Schuss in 2 Sekunden":  { en: "Stage 2: 15m (1st run)\n6×1 round in 2 seconds" },
  "Stage 2: 15m (2. Durchgang)\n6x 1 Schuss in 2 Sekunden":  { en: "Stage 2: 15m (2nd run)\n6×1 round in 2 seconds" },
  "Stage 3: 10m\n3x 2 Schuss in 3 Sekunden":                 { en: "Stage 3: 10m\n3×2 rounds in 3 seconds" },

  // ── Police Pistol 1 (30M1 / SpCb) ───────────────────────────────────────
  "Stage 2: 15m (1. Durchgang)\n6x 1 Schuss in 3 Sekunden":  { en: "Stage 2: 15m (1st run)\n6×1 round in 3 seconds" },
  "Stage 2: 15m (2. Durchgang)\n6x 1 Schuss in 3 Sekunden":  { en: "Stage 2: 15m (2nd run)\n6×1 round in 3 seconds" },

  // ── NPA Service Pistol (30M1 / SpCb / LAR) ──────────────────────────────
  "Stage 1: 25m\n6 Schuss in 15 Sekunden":    { en: "Stage 1: 25m\n6 rounds in 15 seconds" },
  "Stage 2: 20m\n6 Schuss in 10 Sekunden":    { en: "Stage 2: 20m\n6 rounds in 10 seconds" },
  "Stage 3: 15m\n3x 2 Schuss in 3 Sekunden":  { en: "Stage 3: 15m\n3×2 rounds in 3 seconds" },
  "Stage 4: 10m\n6 Schuss in 8 Sekunden":     { en: "Stage 4: 10m\n6 rounds in 8 seconds" },

  // ── EPP: Anschläge ────────────────────────────────────────────────────────
  "Stehend frei":       { en: "Standing unsupported" },
  "Liegend frei":       { en: "Prone unsupported" },
  "Stehend am Pfosten": { en: "Standing at barricade" },
  "Sitzend frei":       { en: "Seated unsupported" },
  "Kniend frei":        { en: "Kneeling unsupported" },

  // ── EPP: Beschreibungen ───────────────────────────────────────────────────
  "10 Schuss (2×5 mit Magazinwechsel). FIXE ZEIT — läuft automatisch. Startsignal 2 Töne, Warnsignal bei 2 Sek. Restzeit.":
    { en: "10 rounds (2×5 with magazine change). FIXED TIME — runs automatically. Start signal 2 tones, warning signal at 2 sec. remaining." },
  "10 Schuss. RO STOPPT die Zeit nach letztem Schuss. Bei Störung: Timer anhalten.":
    { en: "10 rounds. RO STOPS the time after the last round. In case of malfunction: pause the timer." },
  "10 Schuss (5 links, 5 rechts am Pfosten). RO STOPPT die Zeit nach letztem Schuss. Bei Störung: Timer anhalten.":
    { en: "10 rounds (5 left, 5 right at barricade). RO STOPS the time after the last round. In case of malfunction: pause the timer." },
  "10 Schuss. FIXE ZEIT — läuft automatisch. Startsignal 2 Töne, Warnsignal bei 2 Sek. Restzeit.":
    { en: "10 rounds. FIXED TIME — runs automatically. Start signal 2 tones, warning signal at 2 sec. remaining." },
  "10 Schuss. RO STOPPT die Zeit nach letztem Schuss. Bei Störung: Timer anhalten. GESAMTZEIT läuft bis zuletzt.":
    { en: "10 rounds. RO STOPS the time after the last round. In case of malfunction: pause the timer. TOTAL TIME continues until the very end." },
}

export const useTranslationsStore = defineStore('translations', () => {
  // Merge built-in defaults with any user overrides from localStorage.
  // User-entered values always win; defaults are used as fallback.
  const userTranslations = loadFromStorage(STORAGE_KEY, {})
  const textMap = ref({ ...DEFAULT_TRANSLATIONS, ...userTranslations })

  /**
   * Returns the translated text for the given locale.
   * Falls back to original if no translation is set.
   */
  function translate(original, locale) {
    if (!original) return original
    const entry = textMap.value[original]
    if (!entry) return original
    return entry[locale] || original
  }

  /**
   * Sets a translation for one locale and persists immediately.
   */
  function setTranslation(original, locale, text) {
    if (!original) return
    textMap.value[original] = { ...(textMap.value[original] ?? {}), [locale]: text }
    saveToStorage(STORAGE_KEY, textMap.value)
  }

  /**
   * Clears user overrides and restores built-in defaults.
   */
  function reset() {
    textMap.value = { ...DEFAULT_TRANSLATIONS }
    saveToStorage(STORAGE_KEY, {})
  }

  return { textMap, translate, setTranslation, reset }
})
