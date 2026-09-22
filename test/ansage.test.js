import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  buildAnnouncement, trennePhasenname, stageNummer, durchgangInGruppe,
  beschreibungBereinigt, modus, durchgangNummer, zeitText, wortpaket,
} from '../src/core/ansage.js'
import { createBuiltinSet } from '../src/core/library.js'
import { enrichDiscipline } from '../src/core/disciplineRules.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const satz = createBuiltinSet(legacy)
const hole = (name) => enrichDiscipline(satz.disciplines.find(d => d.name === name))
const bdmp1020 = hole('BDMP 1020')
const bdmp1500 = hole('BDMP 1500 Matches 1-5 C.8.2')
const de = wortpaket('de')

describe('Bausteine', () => {
  it('trennt Match-Bezeichnung und Rest', () => {
    expect(trennePhasenname('Match 1: Wir gehen auf 7 Meter'))
      .toEqual({ gruppe: 'Match 1', rest: 'Wir gehen auf 7 Meter' })
  })

  it('zählt Stages innerhalb derselben Match-Gruppe', () => {
    const p = bdmp1020.phases
    expect(stageNummer(p, 0)).toBe(1)
    expect(stageNummer(p, 1)).toBe(2)
    expect(stageNummer(p, 2)).toBeNull()      // Match 2 hat nur eine Stage
  })

  it('nimmt Zeit und Modus aus der Beschreibung heraus', () => {
    expect(beschreibungBereinigt('2 x 6 Schuss  - stehend frei - in 20 Sek. inkl. Nachladen', de))
      .toBe('2 × 6 Schüsse, stehend frei, inkl. Nachladen')
    expect(beschreibungBereinigt('2 × 6 Schüsse stehend frei, nur double action.', de))
      .toBe('2 × 6 Schüsse stehend frei')
  })

  it('wirft Kopfzeilen weg, die nur Distanz, Zeit und Modus wiederholen', () => {
    const roh = 'Match 4: 25 Meter/Yards - 35 Sekunden - nur double action\n12 Schüsse stehend frei'
    expect(beschreibungBereinigt(roh, de)).toBe('12 Schüsse stehend frei')
  })

  it('lässt die Schussfolge 2-2-1 unangetastet und behält das Intervall', () => {
    expect(beschreibungBereinigt('2x (max. 2-2-1 Schuss in 3x 2s)', de))
      .toBe('2 × (max. 2-2-1 Schuss in 3 × 2 s)')
  })

  it('setzt die Mehrzahl nur, wo mehrere Schuss fallen', () => {
    expect(beschreibungBereinigt('6x 1 Schuss in 3 Sekunden', de)).toBe('6 × 1 Schuss')
    expect(beschreibungBereinigt('3x 2 Schuss in 3 Sekunden', de)).toBe('3 × 2 Schüsse')
  })

  it('erkennt den Durchgang, egal in welcher Zeile er steht', () => {
    expect(durchgangNummer({ name: 'Match 3: ', description: '2. Durchgang\n2 x 6 Schuss' })).toBe(2)
    expect(durchgangNummer({ name: 'Wiederholung', description: '' })).toBe(2)
    expect(durchgangNummer({ name: 'Match 1: Wir gehen auf 7 Meter', description: '' })).toBeNull()
  })

  it('zählt die ganze Gruppe durch, sobald eine Phase einen Durchgang nennt', () => {
    // BDMP 1500: nur die zweite Phase heißt „Wiederholung“ — trotzdem ist
    // die erste der 1. Durchgang und nicht Stage 1.
    const i = bdmp1500.phases.findIndex(p => /Wiederholung/i.test(p.name))
    expect(durchgangInGruppe(bdmp1500.phases, i - 1)).toBe(1)
    expect(durchgangInGruppe(bdmp1500.phases, i)).toBe(2)
  })

  it('sagt Sekunden, solange die Minute nicht voll ist', () => {
    expect(zeitText(90_000)).toBe('90 Sekunden')
    expect(zeitText(165_000)).toBe('165 Sekunden')
    expect(zeitText(120_000)).toBe('2 Minuten')
    expect(zeitText(180_000)).toBe('3 Minuten')
    expect(zeitText(165_000, 'en')).toBe('165 seconds')
    expect(zeitText(180_000, 'en')).toBe('3 minutes')
  })

  it('holt den Modus aus der Phase, sonst aus dem Regelablauf', () => {
    const ablauf = ['Match 1 — 2 × 6 Schuss, nur double action', 'Match 4 — auch single action erlaubt']
    expect(modus({ description: '' }, 'Match 1', ablauf, de)).toBe('nur double action')
    expect(modus({ description: '' }, 'Match 4', ablauf, de)).toBe('auch single action')
    expect(modus({ description: '' }, 'Match 9', ablauf, de)).toBeNull()
    expect(modus({ description: 'nur double action' }, null, null, de)).toBe('nur double action')
  })
})

describe('BDMP 1020 — die Ansage, wie der RO sie vorliest', () => {
  const an = i => buildAnnouncement(bdmp1020.phases, i, bdmp1020)

  it('Match 1 wird auf 7 Meter geschossen', () => {
    expect(an(0).fuehrung).toBe('Wir gehen auf 7 Meter')
    expect(an(0).detail).toBe('Match 1 Stage 1: 7 m — 20 Sekunden — nur double action — 2 × 6 Schüsse, stehend frei, inkl. Nachladen')
  })

  it('Match 1 Stage 2', () => {
    expect(an(1).fuehrung).toBe('Wir gehen auf 15 Meter')
    expect(an(1).detail).toBe('Match 1 Stage 2: 15 m — 20 Sekunden — nur double action — 2 × 6 Schüsse, stehend frei, inkl. Nachladen')
  })

  it('Match 2 hat nur eine Stage und trägt deshalb keine Stage-Nummer', () => {
    expect(an(2).detail.startsWith('Match 2:')).toBe(true)
    expect(an(2).detail).toContain('90 Sekunden')
  })

  it('der wiederholte Durchgang heißt Durchgang, nicht Stage', () => {
    expect(an(3).detail.startsWith('Match 3, 1. Durchgang:')).toBe(true)
    expect(an(4).detail.startsWith('Match 3, 2. Durchgang:')).toBe(true)
  })

  it('bleibt die Entfernung gleich, sagt der RO „Wir bleiben“', () => {
    expect(an(4).detail).toContain('25 m')
    expect(an(4).fuehrung).toBe('Wir bleiben auf 25 Meter')
  })

  it('keine Zeilenumbrüche in der Detailzeile', () => {
    bdmp1020.phases.forEach((_, i) => expect(an(i).detail).not.toContain('\n'))
  })
})

describe('BDMP 1500', () => {
  const an = i => buildAnnouncement(bdmp1500.phases, i, bdmp1500)

  it('Match 5 hat vier Stationen, die vierte über 12 Sekunden', () => {
    const stationen = bdmp1500.phases.filter(p => /Match 5/i.test(p.name))
    expect(stationen).toHaveLength(4)
    const i = bdmp1500.phases.length - 1
    expect(an(i).detail).toBe('Match 5 Station 4: 25 m — 12 Sekunden — nur double action — 6 Schüsse stehend frei')
  })

  it('die Stationen heißen Station, nicht Stage', () => {
    const i = bdmp1500.phases.findIndex(p => /Match 5 - Station 1/i.test(p.name))
    expect(an(i).detail.startsWith('Match 5 Station 1:')).toBe(true)
    expect(an(i).fuehrung).toBe('Wir gehen auf 7 Meter')
  })

  it('Match 3 nennt den Modus aus dem Regelablauf', () => {
    const i = bdmp1500.phases.findIndex(p => /^Match 3/i.test(p.name))
    expect(an(i).detail).toContain('auch single action')
  })
})

describe('Andere Disziplinen', () => {
  it('Police Pistol 1 nennt Stage, Distanz und Zeit', () => {
    const d = hole('Police Pistol 1 (A-B-OS)')
    expect(buildAnnouncement(d.phases, 0, d).detail).toMatch(/^Stage 1: 25 m — 2 Minuten/)
    expect(buildAnnouncement(d.phases, 1, d).detail).toBe('Stage 2, 1. Durchgang: 15 m — 2 Sekunden — 6 × 1 Schuss')
  })

  it('die Zeitkontrolle ist eine Uhr und bekommt keine Ansage', () => {
    const d = hole('Zeitkontrolle Schütze')
    expect(d.ohneAnsage).toBe(true)
    expect(buildAnnouncement(d.phases, 0, d).detail).toBe('')
  })

  it('jede Phase jeder Disziplin liefert eine Ansage ohne Leerstellen', () => {
    for (const d0 of satz.disciplines) {
      if (d0.kind !== 'sequence') continue
      const d = enrichDiscipline(d0)
      if (d.ohneAnsage) continue
      d.phases.forEach((_, i) => {
        const a = buildAnnouncement(d.phases, i, d)
        expect(a.detail, d.name).not.toMatch(/—\s*—|:\s*$|,\s*,|\(\s*\)/)
        expect(a.detail.length, d.name).toBeGreaterThan(3)
      })
    }
  })
})

describe('Eigene Ansage', () => {
  it('überschreibt die Ableitung vollständig', () => {
    const phasen = [{ name: 'Match 1: Wir gehen auf 10 Meter', durationMs: 20000,
                      ansage: 'Wir gehen auf 7 Meter\nMatch 1 Stage 1: 7 m — 20 Sekunden' }]
    const a = buildAnnouncement(phasen, 0)
    expect(a.eigen).toBe(true)
    expect(a.fuehrung).toBe('Wir gehen auf 7 Meter')
    expect(a.detail).toBe('Match 1 Stage 1: 7 m — 20 Sekunden')
  })

  it('eine einzelne Zeile ist die Detailzeile', () => {
    const a = buildAnnouncement([{ name: 'X', ansage: 'Freies Training' }], 0)
    expect(a.fuehrung).toBeNull()
    expect(a.detail).toBe('Freies Training')
  })
})
