import { describe, it, expect } from 'vitest'
import { createBuiltinSet } from '../src/core/library.js'
import { createSequenceEngine, SeqState } from '../src/core/sequenceEngine.js'
import legacy from '../public/disziplinen.json'

/**
 * Ablauf der Police-Pistol-Disziplinen nach Sportordnung (Fassung 24.02.2026).
 *
 * „Dann erfolgt das Nachladen und ein erneuter Durchgang“ (C.6A.5, C.6C.5,
 * C.6D.5, C.6E.5): Nach jedem Durchgang hält der Timer an, die Aufsicht gibt
 * die Kommandofolge nach C.6.10 neu. „2 mal 5 Schüsse in 100 Sekunden
 * einschließlich Nachladen“ ist EINE Serie: 100 s ab dem Signal für alle
 * 10 Schüsse.
 *
 * Je Phase: [Sekunden je Serie, Serien ohne Halt, danach Halt].
 */
const SOLL = {
  'Police Pistol 1 (A-B-OS)':      [[120, 1, true], [2, 6, true], [2, 6, true], [2, 3, false]],
  'Police Pistol 1 (LAR)':         [[120, 1, true], [2, 6, true], [2, 6, true], [3, 3, false]],
  'Police Pistol 1 (30M1 - SpCb)': [[120, 1, true], [3, 6, true], [3, 6, true], [3, 3, false]],
  'Police Pistol 1 (SM)':          [[120, 1, true], [3, 5, true], [3, 5, true], [2, 5, true], [2, 5, false]],
  'Police Pistol 2 (PP2)':         [[5, 1, true], [5, 1, true], [180, 1, true], [120, 1, false]],
  'Police Pistol 3 (Carry Gun)':   [[100, 1, true], [2, 5, true], [2, 5, true], [2, 3, true], [2, 3, false]],
  'Police Pistol 4 (Pocket Gun)':  [[100, 1, true], [2, 5, true], [2, 5, true], [2, 3, true], [2, 3, false]],
  'Zeitkontrolle Schütze':         [[90, 1, true], [165, 1, false]],
}

const satz = createBuiltinSet(legacy)
const disziplin = (name) => satz.disciplines.find(d => d.name === name)
const ablauf = (d) => d.phases.map(p => [p.durationMs / 1000, p.repetitions, !!p.waitAfter])

describe('Durchgänge nach Sportordnung', () => {
  for (const [name, soll] of Object.entries(SOLL)) {
    it(`${name}: Serien, Zeiten und Halt nach jedem Durchgang`, () => {
      expect(disziplin(name), name).toBeTruthy()
      expect(ablauf(disziplin(name))).toEqual(soll)
    })
  }

  it('PP1: nach den 6 Intervallen des 1. Durchgangs wartet der Timer auf die Aufsicht', () => {
    const e = createSequenceEngine({ phases: disziplin('Police Pistol 1 (A-B-OS)').phases })
    e.goToPhase(1, 0)
    e.start(0)
    // 5 s Vorlauf + 6 × 2 s Serie + 5 × 5 s Pause = 42 s
    for (let t = 100; t <= 60_000; t += 100) e.tick(t)
    const s = e.snapshot(60_000)
    expect(s.state).toBe(SeqState.WAITING_NEXT)
    expect(s.index).toBe(2)
  })

  it('kein mitgelieferter Ablauf läuft ohne Halt von einem Durchgang in den nächsten', () => {
    for (const d of satz.disciplines.filter(d => d.kind === 'sequence')) {
      d.phases.forEach((p, i) => {
        if (/1\.\s*Durchgang/.test(p.name) && i < d.phases.length - 1) {
          expect(p.waitAfter, `${d.name}: ${p.name}`).toBe(true)
        }
      })
    }
  })
})
