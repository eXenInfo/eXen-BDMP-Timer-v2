import { describe, it, expect } from 'vitest'
import { createSequenceEngine, SeqState, SeqEvent, normalizePhase } from '../src/core/sequenceEngine.js'

function advance(engine, fromMs, toMs, stepMs = 100) {
  const events = []
  for (let t = fromMs + stepMs; t <= toMs; t += stepMs) events.push(...engine.tick(t))
  return events
}
const of = (ev, type) => ev.filter(e => e.type === type)

const phase = (o) => ({ name: 'P', prepTime: 0, duration: 10, repetitions: 1, pauseDuration: 0, ...o })

describe('Grundablauf', () => {
  it('Vorlauf, dann Übungsdauer, Startsignal am Übergang', () => {
    const e = createSequenceEngine({ phases: [phase({ prepTime: 5, duration: 10 })] })
    e.start(0)
    const ev = advance(e, 0, 5_000)
    expect(of(ev, SeqEvent.START_SIGNAL)[0].at).toBe(5_000)
    const ende = advance(e, 5_000, 15_000)
    expect(of(ende, SeqEvent.END_SIGNAL)[0].at).toBe(15_000)
    expect(e.snapshot(15_000).state).toBe(SeqState.FINISHED)
  })

  it('Wiederholungen mit Pause dazwischen', () => {
    const e = createSequenceEngine({ phases: [phase({ duration: 4, repetitions: 3, pauseDuration: 2 })] })
    e.start(0)
    const ev = advance(e, 0, 20_000)
    // 3 Durchgänge à 4 s, dazwischen 2 × 2 s Pause = 16 s
    expect(of(ev, SeqEvent.END_SIGNAL).map(x => x.at)).toEqual([4_000, 10_000, 16_000])
    expect(e.snapshot(20_000).state).toBe(SeqState.FINISHED)
  })

  it('das Phasenende rastet auf der Sollzeit ein, nicht auf dem Tick', () => {
    const e = createSequenceEngine({ phases: [phase({ duration: 7 })] })
    e.start(0)
    const ev = advance(e, 0, 9_000, 450)
    expect(of(ev, SeqEvent.END_SIGNAL)[0].at).toBe(7_000)
  })
})

describe('waitAfter führt nicht mehr in eine Sackgasse', () => {
  it('nach der Phase wird gewartet und continueNext führt weiter', () => {
    const e = createSequenceEngine({
      phases: [phase({ duration: 3, pauseAfter: true }), phase({ name: 'Q', duration: 3 })],
    })
    e.start(0)
    advance(e, 0, 3_000)
    const s = e.snapshot(3_000)
    expect(s.state).toBe(SeqState.WAITING_NEXT)
    expect(s.index).toBe(1)              // steht schon auf der nächsten Phase

    e.continueNext(20_000)
    advance(e, 20_000, 23_000)
    expect(e.snapshot(23_000).state).toBe(SeqState.FINISHED)
  })

  it('ohne waitAfter läuft der Ablauf durch', () => {
    const e = createSequenceEngine({ phases: [phase({ duration: 3 }), phase({ duration: 3 })] })
    e.start(0)
    advance(e, 0, 6_000)
    expect(e.snapshot(6_000).state).toBe(SeqState.FINISHED)
  })
})

describe('Anhalten und Fortsetzen', () => {
  it('die Restzeit wird exakt fortgeführt, nicht aufgerundet', () => {
    const e = createSequenceEngine({ phases: [phase({ duration: 10 })] })
    e.start(0)
    advance(e, 0, 2_600)
    e.pause(2_600)
    expect(e.snapshot(2_600).remainingMs).toBe(7_400)
    e.resume(60_000)
    const ev = advance(e, 60_000, 68_000)
    expect(of(ev, SeqEvent.END_SIGNAL)[0].at).toBe(67_400)   // exakt 7,4 s später
  })
})

describe('Training', () => {
  it('eine einzelne Phase lässt sich gezielt anspringen', () => {
    const e = createSequenceEngine({
      phases: [phase({ name: 'A', duration: 5 }), phase({ name: 'B', duration: 5 }), phase({ name: 'C', duration: 5 })],
    })
    e.goToPhase(2, 0)
    e.start(0)
    expect(e.snapshot(0).phase.name).toBe('C')
    advance(e, 0, 5_000)
    expect(e.snapshot(5_000).state).toBe(SeqState.FINISHED)
  })

  it('im Schleifenmodus beginnt der Ablauf von vorn', () => {
    const e = createSequenceEngine({ phases: [phase({ duration: 3 })], loop: true })
    e.start(0)
    const ev = advance(e, 0, 10_000)
    expect(of(ev, SeqEvent.END_SIGNAL).length).toBeGreaterThan(2)
  })
})

describe('Altformat', () => {
  it('Sekundenfelder des Produktiv-Timers werden übernommen', () => {
    const p = normalizePhase({ name: 'X', prepTime: 3, duration: 12, repetitions: 2, pauseDuration: 4, pauseAfter: true })
    expect(p.prepMs).toBe(3_000)
    expect(p.durationMs).toBe(12_000)
    expect(p.repPauseMs).toBe(4_000)
    expect(p.waitAfter).toBe(true)
  })
})
