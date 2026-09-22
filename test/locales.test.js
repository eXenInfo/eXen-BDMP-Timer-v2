import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { GENERATED_DISCIPLINES, findDisciplineRules } from '../src/core/disciplineRules.js'
import { createBuiltinSet } from '../src/core/library.js'

const lade = (s) => JSON.parse(readFileSync(new URL(`../src/locales/${s}.json`, import.meta.url), 'utf8'))
const de = lade('de'), en = lade('en')
const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))

function schluessel(obj, praefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? schluessel(v, `${praefix}${k}.`) : [`${praefix}${k}`])
}

describe('Sprachdateien', () => {
  it('Deutsch und Englisch führen dieselben Schlüssel', () => {
    const d = schluessel(de).sort(), e = schluessel(en).sort()
    expect(d.filter(k => !e.includes(k))).toEqual([])
    expect(e.filter(k => !d.includes(k))).toEqual([])
  })

  it('kein Schlüssel ist leer', () => {
    for (const [name, datei] of [['de', de], ['en', en]]) {
      const leer = schluessel(datei).filter(k =>
        !k.split('.').reduce((o, teil) => o?.[teil], datei))
      expect(leer, `${name} hat leere Schlüssel`).toEqual([])
    }
  })

  it('Englisch ist nicht bloß das deutsche Original', () => {
    const gleich = schluessel(de.v3).filter(k => {
      const hole = (o) => k.split('.').reduce((x, teil) => x?.[teil], o)
      const a = hole(de.v3), b = hole(en.v3)
      return typeof a === 'string' && a === b && a.length > 12
    })
    // Platzhalterformeln dürfen identisch sein
    expect(gleich.filter(k => !/durchgangPlan/.test(k))).toEqual([])
  })
})

describe('DKS 1 – 1020', () => {
  it('ist als eigene Disziplin vorhanden und heißt eindeutig anders als die BDMP 1020', () => {
    const satz = createBuiltinSet(legacy)
    const namen = satz.disciplines.map(d => d.name)
    expect(namen).toContain('DKS 1 – 1020 (Kleinkaliber)')
    expect(namen).toContain('BDMP 1020')
  })

  it('Match 1 wird auf 10 m geschossen', () => {
    const d = GENERATED_DISCIPLINES.find(x => x.id === 'dks-1-1020')
    expect(d.phases[0].name).toContain('10 m')
    expect(d.phases[0].durationMs).toBe(20_000)
  })

  it('acht Matches, Halt nach jedem bis auf das letzte', () => {
    const d = GENERATED_DISCIPLINES.find(x => x.id === 'dks-1-1020')
    expect(d.phases).toHaveLength(8)
    expect(d.phases.slice(0, 7).every(p => p.waitAfter)).toBe(true)
    expect(d.phases[7].waitAfter).toBe(false)
  })

  it('bekommt die PPC-Kommandofolge nach C.8.5', () => {
    const r = findDisciplineRules('DKS 1 – 1020 (Kleinkaliber)')
    expect(r.commandSet).toBe('ppc1500')
    expect(r.ruleRef).toBe('C.15A')
  })

  it('bei der BDMP 1020 steht jetzt der Hinweis auf die Kleinkaliber-Fassung statt einer Warnung', () => {
    const r = findDisciplineRules('BDMP 1020')
    expect(r.abweichung).toBeUndefined()
    expect(r.hinweise.join(' ')).toMatch(/DKS 1 – 1020/)
  })
})
