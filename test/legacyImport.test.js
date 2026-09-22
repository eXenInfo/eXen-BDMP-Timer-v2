import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  splitLegacyPhaseName, extractDistance, convertLegacyPhase,
  toLegacyPhase, convertLegacyCollection, nominalDurationMs,
} from '../src/core/legacyImport.js'
import { createSequenceEngine, SeqState } from '../src/core/sequenceEngine.js'

const sammlung = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const konvertiert = convertLegacyCollection(sammlung)

describe('Aufteilen des vermischten Namensfeldes', () => {
  it('trennt Überschrift, Beschreibung und RO-Kommando', () => {
    const r = splitLegacyPhaseName(
      'Match 1: Wir gehen auf 10 Meter\n' +
      '2 x 6 Schuss  - stehend frei - in 20 Sek. inkl. Nachladen\n' +
      'Dazu die Waffen laden und Holstern.\n' +
      'Ist jemand nicht fertig? - ACHTUNG!')
    expect(r.name).toBe('Match 1: Wir gehen auf 10 Meter')
    expect(r.description).toBe('2 x 6 Schuss  - stehend frei - in 20 Sek. inkl. Nachladen')
    expect(r.roCommands).toEqual(['Dazu die Waffen laden und Holstern.', 'Ist jemand nicht fertig? - ACHTUNG!'])
  })

  it('kommt mit einzeiligen Namen zurecht', () => {
    const r = splitLegacyPhaseName('Stage 4: 10m')
    expect(r.name).toBe('Stage 4: 10m')
    expect(r.roCommands).toEqual([])
  })

  it('liest die Entfernung aus', () => {
    expect(extractDistance('Stage 1: 25m')).toBe('25 m')
    expect(extractDistance('Match 3: Wir bleiben auf 25 Meter')).toBe('25 m')
    expect(extractDistance('Zeitkontrolle')).toBeNull()
  })
})

describe('Die komplette Sammlung des Produktiv-Timers', () => {
  it('alle 14 Disziplinen werden übernommen — sämtlich Sequenz-Disziplinen', () => {
    // Der EPP steht NICHT in disziplinen.json. Der Produktiv-Timer hält ihn
    // fest in script.js und mischt ihn beim Laden dazu. In v2 kommt er aus
    // eppRules.js, also direkt aus der Sportordnung.
    expect(konvertiert).toHaveLength(14)
    expect(konvertiert.filter(d => d.kind === 'epp')).toHaveLength(0)
    expect(konvertiert.filter(d => d.kind === 'sequence')).toHaveLength(14)
  })

  it('die bekannten Disziplinen sind dabei', () => {
    const namen = konvertiert.map(d => d.name).join(' | ')
    for (const n of ['Police Pistol 1', 'Police Pistol 2', 'NPA Service Pistol', 'BDMP 1020', 'BDMP 1500']) {
      expect(namen).toContain(n)
    }
  })

  it('kein Rundungsverlust: Rückexport ergibt dieselben Sekundenwerte', () => {
    for (const [name, wert] of Object.entries(sammlung)) {
      if (!Array.isArray(wert)) continue
      const zurueck = convertLegacyCollection({ [name]: wert })[0].phases.map(toLegacyPhase)
      wert.forEach((orig, i) => {
        expect(zurueck[i].duration).toBe(orig.duration)
        expect(zurueck[i].prepTime).toBe(orig.prepTime ?? 0)
        expect(zurueck[i].repetitions).toBe(orig.repetitions ?? 1)
        expect(zurueck[i].pauseDuration).toBe(orig.pauseDuration ?? 0)
        expect(zurueck[i].pauseAfter).toBe(!!orig.pauseAfter)
        expect(zurueck[i].name).toBe(orig.name)
      })
    }
  })

  it('jede Sequenz-Disziplin läuft im Zeitkern vollständig durch', () => {
    for (const d of konvertiert.filter(x => x.kind === 'sequence')) {
      const engine = createSequenceEngine({ phases: d.phases })
      const soll = nominalDurationMs(d.phases)
      let t = 0
      engine.start(0)
      // grob takten und an jedem Haltepunkt weitergeben
      for (let i = 0; i < 20_000 && engine.snapshot(t).state !== SeqState.FINISHED; i++) {
        t += 250
        engine.tick(t)
        if (engine.snapshot(t).state === SeqState.WAITING_NEXT) engine.continueNext(t)
      }
      expect(engine.snapshot(t).state, `${d.name} läuft nicht durch`).toBe(SeqState.FINISHED)
      // Die reine Schieß- und Vorlaufzeit muss der Rechnung entsprechen
      expect(t, `${d.name} Sollzeit`).toBeGreaterThanOrEqual(soll)
      expect(t - soll, `${d.name} Abweichung`).toBeLessThan(500)
    }
  })

  it('BDMP 1020 hat acht Matches mit Halt nach jedem bis auf das letzte', () => {
    const d = konvertiert.find(x => x.name === 'BDMP 1020')
    expect(d.phases).toHaveLength(8)
    expect(d.phases.slice(0, 7).every(p => p.waitAfter)).toBe(true)
    expect(d.phases[7].waitAfter).toBe(false)
  })

  it('RO-Kommandos werden bei BDMP 1020 erkannt', () => {
    const d = konvertiert.find(x => x.name === 'BDMP 1020')
    expect(d.phases[0].roCommands.length).toBeGreaterThan(0)
    expect(d.phases[0].roCommands.join(' ')).toContain('ACHTUNG')
    expect(d.phases[0].name).not.toContain('\n')
  })
})
