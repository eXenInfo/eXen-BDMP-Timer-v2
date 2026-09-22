import { describe, it, expect } from 'vitest'
import { createEppEngine, EppState, EppEvent } from '../src/core/eppEngine.js'
import { EPP_PHASES, EPP_TOTAL_TIME_MS, migrateLegacyEppPhase } from '../src/core/eppRules.js'

/** Treibt die Uhr in Schritten und sammelt alle Ereignisse ein. */
function advance(engine, fromMs, toMs, stepMs = 100) {
  const events = []
  for (let t = fromMs + stepMs; t <= toMs; t += stepMs) {
    events.push(...engine.tick(t))
  }
  return events
}
const firstOf = (events, type) => events.find(e => e.type === type)
const only = (phaseId) => EPP_PHASES.filter(p => p.id === phaseId)

describe('C.17.14 — das zweite Signal ist das Stoppsignal', () => {
  it('Station 1: beginnt bei 13,000 s, dauert 2,000 s, endet mit dem Limit von 15,000 s', () => {
    const engine = createEppEngine({ phases: only('st1'), prepMs: 0 })
    engine.start(0)

    const vorher = advance(engine, 0, 12_900)
    expect(firstOf(vorher, EppEvent.STOP_SIGNAL)).toBeUndefined()

    const signal = firstOf(advance(engine, 12_900, 13_000), EppEvent.STOP_SIGNAL)
    expect(signal).toBeDefined()
    expect(signal.durationMs).toBe(2_000)

    const ende = firstOf(advance(engine, 13_000, 15_000), EppEvent.STATION_END)
    expect(ende.at).toBe(15_000)
    // Signalbeginn + Signaldauer == Ende der Schießzeit
    expect(13_000 + signal.durationMs).toBe(15_000)
  })

  it('Station 5b: 8,000 s / 2,000 s / 10,000 s', () => {
    const engine = createEppEngine({ phases: only('st5b'), prepMs: 0 })
    engine.start(0)
    const signal = firstOf(advance(engine, 0, 8_000), EppEvent.STOP_SIGNAL)
    expect(signal.durationMs).toBe(2_000)
    const ende = firstOf(advance(engine, 8_000, 10_000), EppEvent.STATION_END)
    expect(ende.at).toBe(10_000)
  })

  it('das Stationsende rastet auf dem Limit ein, nicht auf dem Tickzeitpunkt', () => {
    const engine = createEppEngine({ phases: only('st1'), prepMs: 0 })
    engine.start(0)
    // Grobe, krumme Taktung — wie bei gedrosseltem Hintergrund-Tab
    const ende = firstOf(advance(engine, 0, 16_000, 333), EppEvent.STATION_END)
    expect(ende.at).toBe(15_000)
  })
})

describe('C.17.8 — die Gesamtzeit summiert ausschließlich Stationszeit', () => {
  it('Wartezeit zwischen zwei Stationen wird nicht angerechnet', () => {
    const engine = createEppEngine({ phases: EPP_PHASES.slice(0, 2), prepMs: 0 })
    engine.start(0)
    advance(engine, 0, 15_000)                 // Station 1 läuft ab: 15 s
    expect(engine.snapshot(15_000).totalElapsedMs).toBe(15_000)

    advance(engine, 15_000, 75_000)            // 60 s Trefferaufnahme und Abkleben
    expect(engine.snapshot(75_000).totalElapsedMs).toBe(15_000)

    engine.start(75_000)                       // Station 2
    advance(engine, 75_000, 95_000)
    engine.stopStation(95_000)
    expect(engine.snapshot(95_000).totalElapsedMs).toBe(35_000)
  })

  it('kompletter Parcours: 6:03 Uhrzeit, aber nur 2:23 angerechnet', () => {
    const engine = createEppEngine({ phases: EPP_PHASES, prepMs: 0 })
    let t = 0
    const station = (dauerMs, pauseMs) => {
      engine.start(t)
      advance(engine, t, t + dauerMs)
      if (engine.snapshot(t + dauerMs).state !== EppState.IDLE) engine.stopStation(t + dauerMs)
      t += dauerMs + pauseMs
      advance(engine, t - pauseMs, t)
    }
    station(15_000, 60_000)   // Station 1, fix
    station(20_000, 40_000)   // Station 2
    station(35_000, 30_000)   // Station 3
    station(18_000, 25_000)   // Station 4
    station(15_000, 20_000)   // Station 5a
    station(10_000, 45_000)   // Station 5b, fix
    station(30_000, 0)        // Station 6

    const s = engine.snapshot(t)
    expect(s.state).toBe(EppState.FINISHED)
    expect(s.totalElapsedMs).toBe(143_000)                      // 2:23
    expect(s.totalRemainingMs).toBe(EPP_TOTAL_TIME_MS - 143_000) // 3:07 übrig
    expect(t).toBe(363_000)                                      // 6:03 Uhrzeit
  })
})

describe('C.17.11 — Störungen', () => {
  it('die Zeit steht während der Störung und läuft danach weiter, nicht von vorn', () => {
    const engine = createEppEngine({ phases: only('st2'), prepMs: 0 })
    engine.start(0)
    advance(engine, 0, 4_000)
    engine.reportMalfunction(4_000)
    expect(engine.snapshot(4_000).state).toBe(EppState.MALFUNCTION)

    advance(engine, 4_000, 24_000)   // 20 s Störungsbeseitigung
    expect(engine.snapshot(24_000).stationElapsedMs).toBe(4_000)

    engine.resumeAfterMalfunction(24_000)
    advance(engine, 24_000, 30_000)
    expect(engine.snapshot(30_000).stationElapsedMs).toBe(10_000)
    expect(engine.snapshot(30_000).totalElapsedMs).toBe(10_000)
  })

  it('die zweite Störung führt zum Ausschluss', () => {
    const engine = createEppEngine({ phases: only('st2'), prepMs: 0 })
    engine.start(0)
    engine.reportMalfunction(2_000)
    engine.resumeAfterMalfunction(5_000)
    const events = engine.reportMalfunction(8_000)
    expect(firstOf(events, EppEvent.EXCLUDED)).toBeDefined()
    expect(engine.snapshot(8_000).state).toBe(EppState.EXCLUDED)
    expect(engine.snapshot(8_000).malfunctionCount).toBe(2)
  })

  it('auch an einer Station mit fester Zeit steht die Uhr', () => {
    const engine = createEppEngine({ phases: only('st1'), prepMs: 0 })
    engine.start(0)
    advance(engine, 0, 5_000)
    engine.reportMalfunction(5_000)
    advance(engine, 5_000, 30_000)
    expect(engine.snapshot(30_000).stationRemainingMs).toBe(10_000)
  })
})

describe('Vorlauf und Startsignal', () => {
  it('das Startsignal kommt exakt nach dem Vorlauf, unabhängig von der Taktung', () => {
    const engine = createEppEngine({ phases: only('st1'), prepMs: 3_000 })
    engine.start(0)
    const sig = firstOf(advance(engine, 0, 4_000, 700), EppEvent.START_SIGNAL)
    expect(sig.at).toBe(3_000)
  })

  it('der Vorlauf zählt nicht zur Gesamtzeit', () => {
    const engine = createEppEngine({ phases: only('st1'), prepMs: 3_000 })
    engine.start(0)
    advance(engine, 0, 3_000)
    expect(engine.snapshot(3_000).totalElapsedMs).toBe(0)
  })
})

describe('Training einzelner Stationen', () => {
  it('ohne Gesamtzeit gibt es keine Restzeit', () => {
    const engine = createEppEngine({ phases: only('st3'), totalTimeMs: null, prepMs: 0 })
    engine.start(0)
    advance(engine, 0, 12_000)
    expect(engine.snapshot(12_000).totalRemainingMs).toBeNull()
  })

  it('eine Teilauswahl läuft eigenständig durch', () => {
    const phases = EPP_PHASES.filter(p => ['st5a', 'st5b'].includes(p.id))
    const engine = createEppEngine({ phases, totalTimeMs: null, prepMs: 0 })
    engine.start(0)
    engine.stopStation(9_000)
    engine.start(9_000)
    advance(engine, 9_000, 19_000)
    expect(engine.snapshot(19_000).state).toBe(EppState.FINISHED)
  })
})

describe('Import aus dem Produktiv-Timer', () => {
  it('warnSignal und stoppSignalDauer werden korrekt übersetzt', () => {
    const p = migrateLegacyEppPhase({
      station: 'Station 1', distanz: '7 m', anschlag: 'Stehend',
      zeitLimit: 15, warnSignal: 13, stoppSignalDauer: 2, pausable: false,
    })
    expect(p.timeLimitMs).toBe(15_000)
    expect(p.stopSignalAtMs).toBe(13_000)
    expect(p.stopSignalDurationMs).toBe(2_000)
  })

  it('eine übersetzte Station signalisiert an derselben Stelle wie die Regelvorgabe', () => {
    const p = migrateLegacyEppPhase({ station: 'Station 1', zeitLimit: 15, warnSignal: 13, stoppSignalDauer: 2 })
    const engine = createEppEngine({ phases: [p], prepMs: 0 })
    engine.start(0)
    const sig = firstOf(advance(engine, 0, 13_000), EppEvent.STOP_SIGNAL)
    expect(sig.at).toBe(13_000)
    expect(sig.durationMs).toBe(2_000)
  })

  it('offene Stationen erhalten kein Stoppsignal', () => {
    const p = migrateLegacyEppPhase({ station: 'Station 2', zeitLimit: 0, pausable: true })
    expect(p.stopSignalAtMs).toBeNull()
  })
})

describe('Datenmodell gegen die Sportordnung', () => {
  it('sieben Stationen mit 50 Schüssen', () => {
    expect(EPP_PHASES).toHaveLength(7)
    expect(EPP_PHASES.reduce((a, p) => a + p.shots, 0)).toBe(50)
  })

  it('nur Station 1 und 5b haben ein Zeitlimit', () => {
    expect(EPP_PHASES.filter(p => p.timeLimitMs > 0).map(p => p.id)).toEqual(['st1', 'st5b'])
  })

  it('bei jeder Station mit Limit endet das Signal mit der Schießzeit', () => {
    for (const p of EPP_PHASES.filter(x => x.timeLimitMs > 0)) {
      expect(p.stopSignalAtMs + p.stopSignalDurationMs).toBe(p.timeLimitMs)
    }
  })

  it('die Gesamtzeit beträgt 5:30', () => {
    expect(EPP_TOTAL_TIME_MS).toBe(5 * 60_000 + 30_000)
  })
})
