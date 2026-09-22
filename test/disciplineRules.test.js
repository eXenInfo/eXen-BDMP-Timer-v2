import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  COMMAND_SETS, POSITIONS, DISCIPLINE_RULES,
  findDisciplineRules, detectPositions, enrichDiscipline,
} from '../src/core/disciplineRules.js'
import { convertLegacyCollection } from '../src/core/legacyImport.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const disziplinen = convertLegacyCollection(legacy)

describe('Kommandofolgen der Sportordnung', () => {
  it('die beiden Folgen sind getrennt und tragen ihre Regelstelle', () => {
    expect(COMMAND_SETS.policePistol.ruleRef).toBe('C.6.10')
    expect(COMMAND_SETS.ppc1500.ruleRef).toBe('C.8.5')
  })

  it('Police Pistol beginnt mit „Laden und fertigmachen!“', () => {
    expect(COMMAND_SETS.policePistol.vorher[0].de).toBe('Laden und fertigmachen!')
    expect(COMMAND_SETS.policePistol.vorher[0].en).toBe('Load and make ready!')
  })

  it('1500 und 1020 beginnen mit „Laden und holstern!“ — anderer Wortlaut', () => {
    expect(COMMAND_SETS.ppc1500.vorher[0].de).toBe('Laden und holstern!')
    expect(COMMAND_SETS.ppc1500.vorher[0].de).not.toBe(COMMAND_SETS.policePistol.vorher[0].de)
  })

  it('nur 1500 und 1020 kennen ein Abbruchkommando', () => {
    expect(COMMAND_SETS.ppc1500.abbruch[0].de).toBe('Schießen einstellen!')
    expect(COMMAND_SETS.policePistol.abbruch).toBeUndefined()
  })

  it('jedes Kommando hat eine deutsche und eine englische Fassung', () => {
    for (const satz of Object.values(COMMAND_SETS)) {
      for (const gruppe of ['vorher', 'start', 'nachher', 'abbruch']) {
        for (const k of satz[gruppe] ?? []) {
          expect(k.de, JSON.stringify(k)).toBeTruthy()
          expect(k.en, JSON.stringify(k)).toBeTruthy()
        }
      }
    }
  })
})

describe('Stellungen', () => {
  it('kniend und Pfosten im selben Text werden getrennt erkannt', () => {
    expect(detectPositions('6 Schuss kniend, 6 Schuss stehend, linke Hand, Pfosten links'))
      .toEqual(['kniendFrei', 'stehendPfosten'])
  })

  it('das Match 3 der 1500 erkennt alle vier Stellungen', () => {
    const t = '6 Schüsse sitzend\n6 Schüsse liegend\n6 Schüsse stehend, linke Hand, Pfosten links\n6 Schüsse stehend, rechte Hand, Pfosten rechts'
    expect(detectPositions(t).sort()).toEqual(['liegend', 'sitzend', 'stehendPfosten'])
  })

  it('stehend frei allein bleibt stehend frei', () => {
    expect(detectPositions('12 Schüsse stehend frei')).toEqual(['stehendFrei'])
  })

  it('jede Stellung trägt Regelstelle und Text', () => {
    for (const [k, p] of Object.entries(POSITIONS)) {
      expect(p.ruleRef, k).toBeTruthy()
      expect(p.text.length, k).toBeGreaterThan(40)
    }
  })
})

describe('Zuordnung der Regelwerke', () => {
  it('jede der 14 Disziplinen findet ihr Regelwerk', () => {
    const ohne = disziplinen
      .filter(d => d.kind === 'sequence')
      .filter(d => !findDisciplineRules(d.name))
      .map(d => d.name)
    // Die Zeitkontrolle ist keine Wettkampfdisziplin und braucht keins.
    expect(ohne).toEqual(['Zeitkontrolle Schütze'])
  })

  it('1020 und 1500 bekommen die PPC-Kommandos, PP1 die Police-Pistol-Kommandos', () => {
    expect(findDisciplineRules('BDMP 1020').commandSet).toBe('ppc1500')
    expect(findDisciplineRules('BDMP 1500 Matches 1-5 C.8.2').commandSet).toBe('ppc1500')
    expect(findDisciplineRules('Police Pistol 1 (SM)').commandSet).toBe('policePistol')
    expect(findDisciplineRules('NPA Service Pistol (30M1)').commandSet).toBe('policePistol')
  })

  it('die Abweichung bei BDMP 1020 ist vermerkt, nicht stillschweigend geändert', () => {
    expect(findDisciplineRules('BDMP 1020').abweichung).toMatch(/7 m und 15 m/)
  })
})

describe('Anreichern einer Disziplin', () => {
  const roh = disziplinen.find(d => d.name === 'BDMP 1020')
  const reich = enrichDiscipline({ ...roh, id: 'bdmp-1020' })

  it('Zeiten und Phasenzahl bleiben unangetastet', () => {
    expect(reich.phases).toHaveLength(roh.phases.length)
    reich.phases.forEach((p, i) => {
      expect(p.durationMs).toBe(roh.phases[i].durationMs)
      expect(p.prepMs).toBe(roh.phases[i].prepMs)
    })
  })

  it('Kommandofolge, Fertigstellung und Ablauf kommen dazu', () => {
    expect(reich.commandSet.ruleRef).toBe('C.8.5')
    expect(reich.readiness.ruleRef).toBe('C.8.7')
    expect(reich.ablauf.length).toBe(5)
    expect(reich.ruleRef).toBe('C.21')
  })

  it('Match 2 bekommt Stellungen und die Hinweise zum Stellungswechsel', () => {
    const m2 = reich.phases.find(p => /Match 2/.test(p.name))
    expect(m2.positions.length).toBeGreaterThan(1)
    expect(m2.positionChangeNotes.length).toBeGreaterThan(0)
  })

  it('eine Phase mit nur einer Stellung bekommt keine Wechselhinweise', () => {
    const m5 = reich.phases.find(p => /Match 5/.test(p.name))
    expect(m5.positionChangeNotes).toEqual([])
  })
})
