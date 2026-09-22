/**
 * Übernahme der Disziplinen aus dem Produktiv-Timer.
 *
 * Dort steckt im Feld `name` ein mehrzeiliger Block, der Überschrift,
 * Übungsbeschreibung und RO-Kommando vermischt. Beispiel:
 *
 *   "Match 1: Wir gehen auf 10 Meter
 *    2 x 6 Schuss - stehend frei - in 20 Sek. inkl. Nachladen
 *    Dazu die Waffen laden und Holstern.
 *    Ist jemand nicht fertig? - ACHTUNG!"
 *
 * Getrennt wird in `name`, `description` und `roCommands`, damit die
 * Oberfläche das Kommando groß zeigen und der Editor jedes Stück einzeln
 * bearbeiten kann. `legacyName` bewahrt den Originaltext unverändert auf,
 * damit beim Rückexport nichts verlorengeht.
 */

import { migrateLegacyEppPhase } from './eppRules.js'

/** Zeilen, die der RO ansagt statt sie zu lesen. */
const RO_MUSTER = /ACHTUNG|Waffen laden|laden und [Hh]olstern|fertig ?machen|nicht fertig|Trefferaufnahme|Wiederholung wird angesagt/i

export function splitLegacyPhaseName(raw) {
  const zeilen = String(raw ?? '')
    .split('\n')
    .map(z => z.trim())
    .filter(Boolean)

  if (zeilen.length === 0) return { name: 'Unbenannte Phase', description: '', roCommands: [] }

  const name = zeilen[0]
  const rest = zeilen.slice(1)
  const roCommands = rest.filter(z => RO_MUSTER.test(z))
  const description = rest.filter(z => !RO_MUSTER.test(z)).join('\n')
  return { name, description, roCommands }
}

/** Zieht "10m", "25 Meter", "7 Meter/Yards" aus dem Namen. */
export function extractDistance(name) {
  const m = String(name ?? '').match(/(\d+)\s*(m\b|Meter)/i)
  return m ? `${m[1]} m` : null
}

export function convertLegacyPhase(p) {
  const { name, description, roCommands } = splitLegacyPhaseName(p.name)
  return {
    name,
    description,
    roCommands,
    distance:     extractDistance(p.name),
    legacyName:   p.name,
    prepMs:       (p.prepTime ?? 0) * 1000,
    durationMs:   (p.duration ?? 0) * 1000,
    repetitions:  Math.max(1, p.repetitions ?? 1),
    repPauseMs:   (p.pauseDuration ?? 0) * 1000,
    soundAtStart: p.soundAtStart ?? false,
    soundAtEnd:   p.soundAtEnd ?? false,
    waitAfter:    p.pauseAfter ?? false,
  }
}

/** Baut aus einer Phase wieder das Altformat — für den Rückexport. */
export function toLegacyPhase(p) {
  return {
    name:          p.legacyName ?? [p.name, p.description, ...(p.roCommands ?? [])].filter(Boolean).join('\n'),
    prepTime:      Math.round((p.prepMs ?? 0) / 1000),
    duration:      Math.round((p.durationMs ?? 0) / 1000),
    repetitions:   p.repetitions ?? 1,
    pauseDuration: Math.round((p.repPauseMs ?? 0) / 1000),
    soundAtStart:  !!p.soundAtStart,
    soundAtEnd:    !!p.soundAtEnd,
    pauseAfter:    !!p.waitAfter,
  }
}

/**
 * Wandelt die komplette Sammlung um.
 * @returns {Array<{name, kind: 'epp'|'sequence', phases}>}
 */
export function convertLegacyCollection(collection) {
  const out = []
  for (const [name, wert] of Object.entries(collection ?? {})) {
    if (wert && !Array.isArray(wert) && wert.isEpp) {
      out.push({
        name,
        kind: 'epp',
        prepMs: (wert.prepTime ?? 3) * 1000,
        phases: (wert.phases ?? []).map(migrateLegacyEppPhase),
      })
    } else if (Array.isArray(wert)) {
      out.push({ name, kind: 'sequence', phases: wert.map(convertLegacyPhase) })
    }
  }
  return out
}

/** Sollzeit einer Sequenz-Disziplin in Millisekunden (ohne Wartezeiten). */
export function nominalDurationMs(phases) {
  return phases.reduce((summe, p) => summe
    + (p.prepMs ?? 0)
    + (p.durationMs ?? 0) * (p.repetitions ?? 1)
    + (p.repPauseMs ?? 0) * Math.max(0, (p.repetitions ?? 1) - 1), 0)
}
