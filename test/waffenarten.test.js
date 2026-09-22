import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { WEAPON_CLASSES, findDisciplineRules, enrichDiscipline, GENERATED_DISCIPLINES } from '../src/core/disciplineRules.js'
import { EPP_VARIANTEN } from '../src/core/eppRules.js'
import { createBuiltinSet } from '../src/core/library.js'
import { nominalDurationMs } from '../src/core/legacyImport.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const satz = createBuiltinSet(legacy)
const hole = (name) => satz.disciplines.find(d => d.name === name)

describe('Ein Satz für mehrere Waffenarten, wenn die Zeiten gleich sind', () => {
  it('BDMP 1500 gilt für Kurzwaffe und Carbine', () => {
    const v = findDisciplineRules('BDMP 1500 Matches 1-5 C.8.2').varianten
    expect(v.map(x => x.klasse)).toEqual(['kurzwaffe', 'langwaffe'])
    expect(v[1].ruleRef).toBe('D.37')
  })

  it('DKS 1020 gilt für Kleinkaliber-Kurzwaffe und -Langwaffe', () => {
    const v = findDisciplineRules('DKS 1 – 1020 (Kleinkaliber)').varianten
    expect(v.map(x => x.ruleRef)).toEqual(['C.15A', 'D.22.A'])
  })

  it('der EPP gilt für Kurzwaffe und Rifle/Carbine', () => {
    expect(EPP_VARIANTEN.map(v => v.ruleRef)).toEqual(['C.17', 'D.25'])
    expect(hole('Europäischer Präzisions Parcours (EPP)').varianten).toHaveLength(2)
  })

  it('die Langwaffenvariante trägt ihre abweichende Handhabung als Hinweis', () => {
    const lw = EPP_VARIANTEN.find(v => v.klasse === 'langwaffe')
    expect(lw.hinweise.join(' ')).toMatch(/Teilladen und fertigmachen/)
    expect(lw.hinweise.join(' ')).toMatch(/Sicherheitsfahne/)
  })

  it('jede Waffenart hat ein Kürzel für die Anzeige', () => {
    for (const k of Object.values(WEAPON_CLASSES)) {
      expect(k.kurz.length).toBeLessThanOrEqual(5)
      expect(k.label.length).toBeGreaterThan(5)
    }
  })
})

describe('Eigener Satz, wenn die Zeiten abweichen', () => {
  const scp2 = hole('Sports Carbine PP2 (Langwaffe)')

  it('Sports Carbine PP2 ist als eigene Disziplin vorhanden', () => {
    expect(scp2).toBeTruthy()
    expect(scp2.varianten[0].klasse).toBe('langwaffe')
    expect(scp2.varianten[0].ruleRef).toBe('D.36')
  })

  it('ihre Zeiten weichen an allen drei Stationen von der Kurzwaffen-PP2 ab', () => {
    const lw = GENERATED_DISCIPLINES.find(d => d.id === 'sports-carbine-pp2').phases
    expect(lw[0].durationMs).toBe(7_000)     // Kurzwaffe: 5 s
    expect(lw[2].durationMs).toBe(140_000)   // Kurzwaffe: 180 s
    expect(lw[3].durationMs).toBe(90_000)    // Kurzwaffe: 120 s

    const kw = hole('Police Pistol 2 (PP2)').phases
    expect(kw[0].durationMs).toBe(5_000)
    expect(kw[1].durationMs).toBe(180_000)
    expect(kw[2].durationMs).toBe(120_000)
  })

  it('der Grund für den eigenen Satz steht in den Hinweisen', () => {
    expect(findDisciplineRules('Sports Carbine PP2 (Langwaffe)').hinweise.join(' '))
      .toMatch(/eigener Satz/i)
  })

  it('die bereits gepflegten Langwaffenfassungen bleiben eigenständig', () => {
    // Sports Carbine PP1 und NPA weichen in den Intervallen ab und stehen
    // in der Sammlung bereits als eigene Einträge.
    expect(hole('Police Pistol 1 (30M1 - SpCb)').phases[1].durationMs).toBe(3_000)
    expect(hole('Police Pistol 1 (A-B-OS)').phases[1].durationMs).toBe(2_000)
    expect(hole('NPA Service Pistol (SpCb)').phases[3].durationMs).toBe(8_000)
    expect(hole('NPA Service Pistol (30M1)').phases[3].durationMs).toBe(6_000)
  })

  it('läuft vollständig durch die Sollzeitrechnung', () => {
    expect(nominalDurationMs(scp2.phases)).toBe(7_000 + 7_000 + 140_000 + 90_000 + 4 * 5_000)
  })
})

describe('Varianten kommen bis in die Anzeige durch', () => {
  it('enrichDiscipline reicht sie weiter', () => {
    const d = enrichDiscipline({ name: 'BDMP 1500 Matches 1-5 C.8.2', kind: 'sequence', phases: [] })
    expect(d.varianten).toHaveLength(2)
  })

  it('eine eigene Disziplin ohne Regelwerk hat eine leere Variantenliste', () => {
    const d = enrichDiscipline({ name: 'Mein Training', kind: 'sequence', phases: [] })
    expect(d.varianten).toEqual([])
  })
})
