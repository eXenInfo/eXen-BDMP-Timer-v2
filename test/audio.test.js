import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Signalausgabe gegen ein nachgebautes Web Audio. Geprüft wird, welche Töne
 * mit welcher Höhe und Länge geplant werden, nicht der Klang selbst.
 */
const toene = []
class FakeParam {
  constructor() { this.value = 0 }
  setValueAtTime() {} linearRampToValueAtTime() {} setTargetAtTime() {}
}
class FakeNode { constructor() { this.gain = new FakeParam() } connect(n) { return n } }
class FakeOsc extends FakeNode {
  constructor() { super(); this.frequency = new FakeParam() }
  start(at) { this.startAt = at }
  stop(at) { toene.push({ freqHz: this.frequency.value, dauerS: at - 0.02 - this.startAt }) }
}
class FakeContext {
  constructor() { this.state = 'running'; this.currentTime = 0; this.destination = new FakeNode() }
  createGain() { return new FakeNode() }
  createOscillator() { return new FakeOsc() }
  resume() { return Promise.resolve() }
}

const sitzung = { type: 'auto' }
let audio
beforeAll(async () => {
  globalThis.window = { AudioContext: FakeContext }
  Object.defineProperty(globalThis, 'navigator', { value: { audioSession: sitzung }, configurable: true })
  audio = await import('../src/core/audio.js')
})

const rund = (t) => ({ freqHz: t.freqHz, ms: Math.round(t.dauerS * 1000) })

describe('Signalausgabe', () => {
  it('iPhone: Ausgabe als Wiedergabe, damit der Stummschalter die Signale nicht verschluckt', async () => {
    expect(await audio.arm()).toBe(true)
    expect(sitzung.type).toBe('playback')
  })

  it('das Endsignal klingt wie das Startsignal: gleiche Höhe, gleiche Länge', () => {
    toene.length = 0
    audio.setStartSignalMs(800)
    audio.playStartSignal()
    audio.playEndSignal()
    expect(toene.map(rund)).toEqual([{ freqHz: 880, ms: 800 }, { freqHz: 880, ms: 800 }])
  })

  it('das EPP-Stoppsignal behält seine Regeldauer', () => {
    toene.length = 0
    audio.playStopSignal(2000)
    expect(toene.map(rund)).toEqual([{ freqHz: 880, ms: 2000 }])
  })
})
