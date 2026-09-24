import { describe, it, expect } from 'vitest'
import {
  ladeSignale, sichereSignale, wendeSignaleAn, begrenzeLautstaerke, begrenzeVorlauf,
  SCHLUESSEL, LAUTSTAERKE_MIN, START_STANDARD_MS,
} from '../src/core/signalEinstellungen.js'
import { getVolume, getStartSignalMs, isStumm } from '../src/core/audio.js'

function speicher(anfang = {}) {
  const m = new Map(Object.entries(anfang))
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }
}

describe('Signaleinstellungen', () => {
  it('ohne gespeicherte Werte gelten 80 % und 600 ms', () => {
    expect(ladeSignale(speicher())).toEqual({ lautstaerke: 80, startMs: 600, stumm: false, vorlaufS: null })
    expect(ladeSignale(null)).toEqual({ lautstaerke: 80, startMs: 600, stumm: false, vorlaufS: null })
  })

  it('kaputter Eintrag fällt auf die Standardwerte zurück', () => {
    expect(ladeSignale(speicher({ [SCHLUESSEL]: '{kaputt' }))).toEqual({ lautstaerke: 80, startMs: 600, stumm: false, vorlaufS: null })
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
    sichereSignale(s, { lautstaerke: 40, startMs: 1000, stumm: true, vorlaufS: 3 })
    expect(ladeSignale(s)).toEqual({ lautstaerke: 40, startMs: 1000, stumm: true, vorlaufS: 3 })
  })

  it('wird auf die Signalausgabe übertragen', () => {
    wendeSignaleAn({ lautstaerke: 30, startMs: 800, stumm: true })
    expect(getVolume()).toBe(30)
    expect(getStartSignalMs()).toBe(800)
    expect(isStumm()).toBe(true)
    wendeSignaleAn({ lautstaerke: 80, startMs: 600, stumm: false })
    expect(isStumm()).toBe(false)
  })

  it('Vorlauf: ohne Eintrag „wie Disziplin“, sonst 0 bis 7 s', () => {
    expect(begrenzeVorlauf(undefined)).toBe(null)
    expect(begrenzeVorlauf(null)).toBe(null)
    expect(begrenzeVorlauf('quatsch')).toBe(null)
    expect(begrenzeVorlauf(0)).toBe(0)
    expect(begrenzeVorlauf(4.4)).toBe(4)
    expect(begrenzeVorlauf(-2)).toBe(0)
    expect(begrenzeVorlauf(12)).toBe(7)
  })

  it('ein früher gespeicherter Eintrag ohne Vorlauf bleibt „wie Disziplin“', () => {
    const s = speicher({ [SCHLUESSEL]: JSON.stringify({ lautstaerke: 60, startMs: 800, stumm: false }) })
    expect(ladeSignale(s).vorlaufS).toBe(null)
  })

  it('Vorlauf 0 bleibt 0 und wird nicht zu „wie Disziplin“', () => {
    const s = speicher()
    sichereSignale(s, { lautstaerke: 80, startMs: 600, vorlaufS: 0 })
    expect(ladeSignale(s).vorlaufS).toBe(0)
  })
})
