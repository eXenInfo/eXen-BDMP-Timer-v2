import { describe, it, expect } from 'vitest'
import {
  phasenFuerSchuetzenuhr, freieZeitDisziplin, ladeModus, sichereModus,
  mitTon, neutraleAnzeige, MODUS_SCHLUESSEL,
} from '../src/core/laufModus.js'
import { createSequenceEngine, SeqState, SeqEvent } from '../src/core/sequenceEngine.js'
import * as audio from '../src/core/audio.js'

const speicher = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) } }
const of = (ev, type) => ev.filter(e => e.type === type)
function lauf(e, von, bis, schritt = 100) {
  const ev = []
  for (let t = von + schritt; t <= bis; t += schritt) ev.push(...e.tick(t))
  return ev
}

describe('Laufmodus', () => {
  it('Standard ist die Aufsicht, unbekannte Werte fallen darauf zurück', () => {
    expect(ladeModus(speicher())).toBe('aufsicht')
    const s = speicher(); s.setItem(MODUS_SCHLUESSEL, '"quatsch"')
    expect(ladeModus(s)).toBe('aufsicht')
  })

  it('der gewählte Modus bleibt gespeichert', () => {
    const s = speicher()
    sichereModus(s, 'schuetzenuhr')
    expect(ladeModus(s)).toBe('schuetzenuhr')
  })

  it('nur die Aufsicht darf Töne abgeben, nur die Schützenuhr bleibt farbneutral', () => {
    expect([mitTon('aufsicht'), mitTon('schuetzenuhr')]).toEqual([true, false])
    expect([neutraleAnzeige('aufsicht'), neutraleAnzeige('schuetzenuhr')]).toEqual([false, true])
  })

  it('ein früher gespeichertes „stumm“ gilt als Aufsicht, der Ton wird separat eingestellt', () => {
    const s = speicher(); s.setItem(MODUS_SCHLUESSEL, '"stumm"')
    expect(ladeModus(s)).toBe('aufsicht')
  })
})

describe('Schützenuhr', () => {
  const phasen = [
    { name: 'Match 1', prepMs: 5000, durationMs: 20000, repetitions: 2, repPauseMs: 10000, soundAtStart: true, soundAtEnd: true, waitAfter: true },
    { name: 'Match 4', prepMs: 5000, durationMs: 165000, repetitions: 1, repPauseMs: 0, soundAtStart: true, soundAtEnd: true, waitAfter: false },
  ]

  it('jede Wiederholung wird eine eigene Serie ohne Vorlauf und ohne Signal', () => {
    const raus = phasenFuerSchuetzenuhr(phasen)
    expect(raus.map(p => p.name)).toEqual(['Match 1 (1/2)', 'Match 1 (2/2)', 'Match 4'])
    expect(raus.every(p => p.prepMs === 0 && p.repetitions === 1 && p.waitAfter)).toBe(true)
    expect(raus.every(p => !p.soundAtStart && !p.soundAtEnd)).toBe(true)
  })

  it('die Zeit beginnt genau mit dem Tipp und die nächste Serie wartet', () => {
    const e = createSequenceEngine({ phases: phasenFuerSchuetzenuhr(phasen) })
    e.start(1000)
    expect(e.snapshot(1000).state).toBe(SeqState.RUNNING)
    const ev = lauf(e, 1000, 30000)
    expect(of(ev, SeqEvent.START_SIGNAL)).toEqual([])
    expect(of(ev, SeqEvent.END_SIGNAL)).toEqual([])
    expect(e.snapshot(30000).state).toBe(SeqState.WAITING_NEXT)
    expect(e.snapshot(30000).index).toBe(1)
  })

  it('165 s laufen auf die Sekunde', () => {
    const e = createSequenceEngine({ phases: [freieZeitDisziplin(165).phases[0]] })
    e.start(0)
    lauf(e, 0, 164900)
    expect(e.snapshot(164900).state).toBe(SeqState.RUNNING)
    lauf(e, 164900, 165000)
    expect(e.snapshot(165000).state).toBe(SeqState.FINISHED)
  })

  it('freie Zeit wird auf 1 s bis 60 min begrenzt', () => {
    expect(freieZeitDisziplin(0).phases[0].durationMs).toBe(1000)
    expect(freieZeitDisziplin(99999).phases[0].durationMs).toBe(3_600_000)
  })

  it('stumm gibt die Signalausgabe keinen einzigen Ton ab', () => {
    audio.setStumm(true)
    expect(audio.playStartSignal()).toBe(false)
    expect(audio.playTone({})).toBe(false)
    audio.setStumm(false)
    expect(audio.isStumm()).toBe(false)
  })

  it('Einstellung und Schützenuhr schalten getrennt stumm', () => {
    audio.setStummEinstellung(true)
    audio.setStumm(false)
    expect(audio.isStumm()).toBe(true)
    audio.setStummEinstellung(false)
    expect(audio.isStumm()).toBe(false)
  })
})
