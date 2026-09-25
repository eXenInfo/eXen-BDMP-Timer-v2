import { describe, it, expect } from 'vitest'
import {
  phasenFuerSchuetzenuhr, phasenMitVorlauf, vorlaufMs, freieZeitDisziplin, ladeModus, sichereModus,
  langeSerien, hatSchuetzenuhr, eppGesamtzeitDisziplin, SCHUETZENUHR_MIN_MS, aufsichtVorlauf,
  mitTon, neutraleAnzeige, MODUS_SCHLUESSEL,
} from '../src/core/laufModus.js'
import { createSequenceEngine, SeqState, SeqEvent } from '../src/core/sequenceEngine.js'
import * as audio from '../src/core/audio.js'
import { createBuiltinSet } from '../src/core/library.js'
import legacy from '../public/disziplinen.json'

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
    { name: 'Match 1', prepMs: 5000, durationMs: 100000, repetitions: 2, repPauseMs: 10000, soundAtStart: true, soundAtEnd: true, waitAfter: true },
    { name: 'Intervall', prepMs: 5000, durationMs: 2000, repetitions: 6, repPauseMs: 5000, soundAtStart: true, soundAtEnd: true, waitAfter: true },
    { name: 'Match 4', prepMs: 5000, durationMs: 165000, repetitions: 1, repPauseMs: 0, soundAtStart: true, soundAtEnd: true, waitAfter: false },
  ]

  it('jede Wiederholung einer langen Serie wird eine eigene Serie ohne Vorlauf und ohne Signal', () => {
    const raus = phasenFuerSchuetzenuhr(phasen)
    expect(raus.map(p => p.name)).toEqual(['Match 1 (1/2)', 'Match 1 (2/2)', 'Match 4'])
    expect(raus.every(p => p.prepMs === 0 && p.repetitions === 1 && p.waitAfter)).toBe(true)
    expect(raus.every(p => !p.soundAtStart && !p.soundAtEnd)).toBe(true)
  })

  it('die Zeit beginnt genau mit dem Tipp und die nächste Serie wartet', () => {
    const e = createSequenceEngine({ phases: phasenFuerSchuetzenuhr(phasen) })
    e.start(1000)
    expect(e.snapshot(1000).state).toBe(SeqState.RUNNING)
    const ev = lauf(e, 1000, 101000)
    expect(of(ev, SeqEvent.START_SIGNAL)).toEqual([])
    expect(of(ev, SeqEvent.END_SIGNAL)).toEqual([])
    expect(e.snapshot(101000).state).toBe(SeqState.WAITING_NEXT)
    expect(e.snapshot(101000).index).toBe(1)
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

describe('Vorlauf aus den Signaleinstellungen', () => {
  const phasen = [
    { name: 'Match 1', prepMs: 5000, durationMs: 100000, repetitions: 2, repPauseMs: 10000, soundAtStart: true, soundAtEnd: true, waitAfter: true },
    { name: 'Alt', prepTime: 5, duration: 10, repetitions: 1 },
  ]

  it('„wie Disziplin“: Aufsicht behält den Vorlauf der Phase, Schützenuhr hat keinen', () => {
    expect(vorlaufMs(5000, null, 'aufsicht')).toBe(5000)
    expect(vorlaufMs(5000, null, 'schuetzenuhr')).toBe(0)
    expect(phasenMitVorlauf(phasen, null)).toBe(phasen)
  })

  it('ein eingestellter Wert gilt in beiden Betriebsarten, auch 0', () => {
    expect(vorlaufMs(5000, 3, 'aufsicht')).toBe(3000)
    expect(vorlaufMs(5000, 3, 'schuetzenuhr')).toBe(3000)
    expect(vorlaufMs(5000, 0, 'aufsicht')).toBe(0)
  })

  it('Aufsicht: jede Phase bekommt den eingestellten Vorlauf, auch alte Daten mit prepTime', () => {
    const raus = phasenMitVorlauf(phasen, 2)
    expect(raus.map(p => p.prepMs)).toEqual([2000, 2000])
    expect(raus[1].prepTime).toBe(2)
    expect(phasen[0].prepMs).toBe(5000)
  })

  it('Aufsicht mit 7 s: Startsignal genau 7 s nach dem Start', () => {
    const e = createSequenceEngine({ phases: phasenMitVorlauf(phasen, 7) })
    e.start(0)
    expect(e.snapshot(0).state).toBe(SeqState.PREP)
    expect(of(lauf(e, 0, 6900), SeqEvent.START_SIGNAL)).toEqual([])
    expect(of(lauf(e, 6900, 7000), SeqEvent.START_SIGNAL)).toHaveLength(1)
    expect(e.snapshot(7000).state).toBe(SeqState.RUNNING)
  })

  it('Aufsicht mit 0 s: das Startsignal fällt mit dem Tipp', () => {
    const e = createSequenceEngine({ phases: phasenMitVorlauf(phasen, 0) })
    const ev = e.start(0)
    expect(of(ev, SeqEvent.START_SIGNAL)).toHaveLength(1)
    expect(e.snapshot(0).state).toBe(SeqState.RUNNING)
  })

  it('Schützenuhr mit Vorlauf: Tipp bei „Achtung“, Zeit läuft nach dem Vorlauf, ohne Ton', () => {
    const e = createSequenceEngine({ phases: phasenFuerSchuetzenuhr(phasen, 4) })
    e.start(0)
    expect(e.snapshot(0).state).toBe(SeqState.PREP)
    const ev = lauf(e, 0, 4000)
    expect(e.snapshot(4000).state).toBe(SeqState.RUNNING)
    expect(of(ev, SeqEvent.START_SIGNAL)).toEqual([])
    lauf(e, 4000, 104000)
    expect(e.snapshot(104000).state).toBe(SeqState.WAITING_NEXT)
  })

  it('Schützenuhr mit Vorlauf: jede weitere Serie beginnt nach dem Tipp wieder mit Vorlauf', () => {
    const e = createSequenceEngine({ phases: phasenFuerSchuetzenuhr(phasen, 4) })
    e.start(0)
    lauf(e, 0, 104000)
    e.continueNext(110000)
    expect(e.snapshot(110000).state).toBe(SeqState.PREP)
    lauf(e, 110000, 114000)
    expect(e.snapshot(114000).state).toBe(SeqState.RUNNING)
  })
})

describe('Schützenuhr nur für lange Serien', () => {
  const satz = createBuiltinSet(legacy)
  const hole = (name) => satz.disciplines.find(d => d.name === name)
  const serien = (name) => phasenFuerSchuetzenuhr(hole(name).phases).map(p => p.durationMs / 1000)

  it('die Grenze liegt bei 60 s', () => {
    expect(SCHUETZENUHR_MIN_MS).toBe(60_000)
    expect(langeSerien([{ durationMs: 59_999 }, { durationMs: 60_000 }, { duration: 90 }])).toHaveLength(2)
  })

  it('PP1: nur die 25 m mit 120 s, keine Intervalle', () => {
    expect(serien('Police Pistol 1 (A-B-OS)')).toEqual([120])
  })

  it('PP2: nur Station B und C, Station A (5 s) entfällt', () => {
    expect(serien('Police Pistol 2 (PP2)')).toEqual([180, 120])
  })

  it('PP3, PP4, Super Magnum: nur die erste Entfernung', () => {
    expect(serien('Police Pistol 3 (Carry Gun)')).toEqual([100])
    expect(serien('Police Pistol 4 (Pocket Gun)')).toEqual([100])
    expect(serien('Police Pistol 1 (SM)')).toEqual([120])
  })

  it('1020 und 1500: nur 90 s und 165 s', () => {
    expect(serien('BDMP 1020')).toEqual([90, 165])
    expect(serien('BDMP 1500 Matches 1-5 C.8.2')).toEqual([90, 165, 90, 165])
  })

  it('ohne lange Serie gibt es keine Schützenuhr, etwa bei der NPA', () => {
    expect(hatSchuetzenuhr(hole('NPA Service Pistol (30M1)'))).toBe(false)
    expect(hatSchuetzenuhr(hole('Police Pistol 1 (A-B-OS)'))).toBe(true)
  })

  it('EPP und freie Zeit haben immer eine Schützenuhr', () => {
    expect(hatSchuetzenuhr(hole('Europäischer Präzisions Parcours (EPP)'))).toBe(true)
    expect(hatSchuetzenuhr(freieZeitDisziplin(20))).toBe(true)
  })

  it('freie Zeit unter 60 s bleibt als Serie erhalten', () => {
    const f = freieZeitDisziplin(20)
    expect(phasenFuerSchuetzenuhr(f.phases, null, { alle: true }).map(p => p.durationMs)).toEqual([20_000])
  })

  it('EPP: eine einzige Serie über die Gesamtzeit von 5:30, still und auf Tipp', () => {
    const d = eppGesamtzeitDisziplin(hole('Europäischer Präzisions Parcours (EPP)'), 'Gesamtzeit')
    expect(hatSchuetzenuhr(d)).toBe(true)
    const p = phasenFuerSchuetzenuhr(d.phases, null, { alle: true })
    expect(p.map(x => [x.durationMs, x.prepMs, x.soundAtStart, x.soundAtEnd])).toEqual([[330_000, 0, false, false]])
    const e = createSequenceEngine({ phases: p })
    e.start(0)
    lauf(e, 0, 329_900, 1000)
    expect(e.snapshot(329_900).state).toBe(SeqState.RUNNING)
    lauf(e, 329_900, 330_000)
    expect(e.snapshot(330_000).state).toBe(SeqState.FINISHED)
  })
})

describe('Vorlauf in eigenen Sätzen', () => {
  const eigene = [{ name: 'Eigener Schritt', prepMs: 7000, durationMs: 30_000, repetitions: 1 }]

  it('der globale Vorlauf gilt nur im mitgelieferten Satz', () => {
    expect(aufsichtVorlauf(3, false)).toBe(3)
    expect(aufsichtVorlauf(3, true)).toBe(null)
    expect(aufsichtVorlauf(null, true)).toBe(null)
  })

  it('eigener Satz: der Vorlauf aus dem Editor läuft, auch wenn global 3 s eingestellt sind', () => {
    const e = createSequenceEngine({ phases: phasenMitVorlauf(eigene, aufsichtVorlauf(3, true)) })
    e.start(0)
    lauf(e, 0, 6900)
    expect(e.snapshot(6900).state).toBe(SeqState.PREP)
    lauf(e, 6900, 7000)
    expect(e.snapshot(7000).state).toBe(SeqState.RUNNING)
  })
})
