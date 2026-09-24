import { describe, it, expect } from 'vitest'
import {
  offeneNeuigkeiten, neuigkeitenGesehen, punkteIn, NEUIGKEITEN, GESEHEN_SCHLUESSEL,
} from '../src/core/neuigkeiten.js'

function speicher(anfang = {}) {
  const m = new Map(Object.entries(anfang))
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }
}

const liste = [
  { stand: '2026-10-01', punkte: { de: ['neu'], en: ['new'] } },
  { stand: '2026-09-24', punkte: { de: ['alt'], en: ['old'] } },
]

describe('Neu in dieser Version', () => {
  it('beim allerersten Start nichts anzeigen und den Stand still vermerken', () => {
    const s = speicher()
    expect(offeneNeuigkeiten(s, liste)).toEqual([])
    expect(s.m.get(GESEHEN_SCHLUESSEL)).toBe('2026-10-01')
    expect(offeneNeuigkeiten(s, liste)).toEqual([])
  })

  it('wer die App schon benutzt hat, sieht nach dem Update alle Einträge', () => {
    const s = speicher({ exen_signale: '{}' })
    expect(offeneNeuigkeiten(s, liste).map(e => e.stand)).toEqual(['2026-10-01', '2026-09-24'])
  })

  it('nach „Verstanden“ bleibt es still bis zum nächsten Eintrag', () => {
    const s = speicher({ 'bdmp.bibliothek.v1': '{}' })
    neuigkeitenGesehen(s, liste)
    expect(offeneNeuigkeiten(s, liste)).toEqual([])
  })

  it('nach einem weiteren Update erscheint nur, was seitdem neu ist', () => {
    const s = speicher({ [GESEHEN_SCHLUESSEL]: '2026-09-24' })
    expect(offeneNeuigkeiten(s, liste).map(e => e.stand)).toEqual(['2026-10-01'])
  })

  it('ohne Speicher gibt es keinen Absturz', () => {
    expect(offeneNeuigkeiten(null, liste)).toEqual([])
    expect(() => neuigkeitenGesehen(null, liste)).not.toThrow()
  })

  it('jeder Eintrag hat Deutsch und Englisch in gleicher Länge, neuester oben', () => {
    for (const e of NEUIGKEITEN) {
      expect(e.punkte.de.length).toBeGreaterThan(0)
      expect(e.punkte.en.length).toBe(e.punkte.de.length)
      expect(punkteIn(e, 'en')).toBe(e.punkte.en)
      expect(punkteIn(e, 'fr')).toBe(e.punkte.de)
    }
    const staende = NEUIGKEITEN.map(e => e.stand)
    expect([...staende].sort().reverse()).toEqual(staende)
  })
})
