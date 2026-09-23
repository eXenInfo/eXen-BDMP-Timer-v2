import { describe, it, expect } from 'vitest'
import {
  ladeSignale, sichereSignale, wendeSignaleAn, begrenzeLautstaerke,
  SCHLUESSEL, LAUTSTAERKE_MIN, START_STANDARD_MS,
} from '../src/core/signalEinstellungen.js'
import { getVolume, getStartSignalMs, isStumm } from '../src/core/audio.js'

function speicher(anfang = {}) {
  const m = new Map(Object.entries(anfang))
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }
}

describe('Signaleinstellungen', () => {
  it('ohne gespeicherte Werte gelten 80 % und 600 ms', () => {
    expect(ladeSignale(speicher())).toEqual({ lautstaerke: 80, startMs: 600, stumm: false })
    expect(ladeSignale(null)).toEqual({ lautstaerke: 80, startMs: 600, stumm: false })
  })

  it('kaputter Eintrag fällt auf die Standardwerte zurück', () => {
    expect(ladeSignale(speicher({ [SCHLUESSEL]: '{kaputt' }))).toEqual({ lautstaerke: 80, startMs: 600, stumm: false })
  })

  it('das Startsignal wird nie stumm', () => {
    expect(begrenzeLautstaerke(0)).toBe(LAUTSTAERKE_MIN)
    expect(begrenzeLautstaerke(-5)).toBe(LAUTSTAERKE_MIN)
    expect(begrenzeLautstaerke(250)).toBe(100)
  })

  it('unbekannte Signallänge ergibt den Standard', () => {
    const s = speicher()
    expect(sichereSignale(s, { lautstaerke: 50, startMs: 777 }).startMs).toBe(START_STANDARD_MS)
  })

  it('gespeicherte Werte überleben das Neuladen', () => {
    const s = speicher()
    sichereSignale(s, { lautstaerke: 40, startMs: 1000, stumm: true })
    expect(ladeSignale(s)).toEqual({ lautstaerke: 40, startMs: 1000, stumm: true })
  })

  it('wird auf die Signalausgabe übertragen', () => {
    wendeSignaleAn({ lautstaerke: 30, startMs: 800, stumm: true })
    expect(getVolume()).toBe(30)
    expect(getStartSignalMs()).toBe(800)
    expect(isStumm()).toBe(true)
    wendeSignaleAn({ lautstaerke: 80, startMs: 600, stumm: false })
    expect(isStumm()).toBe(false)
  })
})
