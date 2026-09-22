import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  buildAnnouncement, trennePhasenname, stageNummer,
  beschreibungOhneZeit, modusAusRegeln, durchgangNummer, fuehrungsAnsage,
} from '../src/core/ansage.js'
import { createBuiltinSet } from '../src/core/library.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const satz = createBuiltinSet(legacy)
const bdmp1020 = satz.disciplines.find(d => d.name === 'BDMP 1020')

describe('Bausteine', () => {
  it('trennt Match-Bezeichnung und Führungsansage', () => {
    expect(trennePhasenname('Match 1: Wir gehen auf 10 Meter'))
      .toEqual({ gruppe: 'Match 1', rest: 'Wir gehen auf 10 Meter' })
  })

  it('zählt Stages innerhalb derselben Match-Gruppe', () => {
    const p = bdmp1020.phases
    expect(stageNummer(p, 0)).toBe(1)
    expect(stageNummer(p, 1)).toBe(2)
    expect(stageNummer(p, 2)).toBeNull()      // Match 2 hat nur eine Stage
  })

  it('nimmt die Zeitangabe aus der Beschreibung heraus', () => {
    expect(beschreibungOhneZeit('2 x 6 Schuss  - stehend frei - in 20 Sek. inkl. Nachladen'))
      .toBe('2 × 6 Schüsse, stehend frei, inkl. Nachladen')
  })

  it('setzt die Mehrzahl nur, wo mehrere Schuss fallen', () => {
    expect(beschreibungOhneZeit('6x 1 Schuss in 3 Sekunden')).toBe('6 × 1 Schuss')
    expect(beschreibungOhneZeit('3x 2 Schuss in 3 Sekunden')).toBe('3 × 2 Schüsse')
  })

  it('erkennt den Durchgang, egal in welcher Zeile er steht', () => {
    expect(durchgangNummer({ name: 'Match 3: ', description: '2. Durchgang\n2 x 6 Schuss' })).toBe(2)
    expect(durchgangNummer({ name: 'Match 3: Wir bleiben auf 25 Meter', description: '',
                             roCommands: ['1. Durchgang - Wiederholung wird angesagt'] })).toBe(1)
    expect(durchgangNummer({ name: 'Match 1: Wir gehen auf 10 Meter', description: '' })).toBeNull()
  })

  it('macht aus einer nackten Distanz einen Satz', () => {
    expect(fuehrungsAnsage('25m')).toBe('Wir gehen auf 25 Meter')
    expect(fuehrungsAnsage('15m (1. Durchgang)')).toBe('Wir gehen auf 15 Meter')
    expect(fuehrungsAnsage('Wir bleiben auf 25 Meter')).toBe('Wir bleiben auf 25 Meter')
    expect(fuehrungsAnsage('')).toBeNull()
  })

  it('holt den Modus aus dem Regelablauf derselben Match-Nummer', () => {
    const ablauf = ['Match 1 — 2 × 6 Schuss, nur double action', 'Match 4 — auch single action erlaubt']
    expect(modusAusRegeln('Match 1', ablauf)).toBe('nur double action')
    expect(modusAusRegeln('Match 4', ablauf)).toBe('auch single action erlaubt')
    expect(modusAusRegeln('Match 9', ablauf)).toBeNull()
  })
})

describe('BDMP 1020 — die Ansage, wie der RO sie vorliest', () => {
  const an = i => buildAnnouncement(bdmp1020.phases, i, bdmp1020)

  it('Match 1 Stage 1', () => {
    expect(an(0).fuehrung).toBe('Wir gehen auf 10 Meter')
    expect(an(0).detail).toBe('Match 1 Stage 1: 10 m — 20 Sekunden — nur double action — 2 × 6 Schüsse, stehend frei, inkl. Nachladen')
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

  it('der zweite Durchgang erbt die Distanz der ersten Zeile', () => {
    expect(an(4).detail).toContain('25 m')
    expect(an(4).fuehrung).toBeNull()          // es geht nirgendwo hin
  })

  it('keine Zeilenumbrüche in der Detailzeile', () => {
    bdmp1020.phases.forEach((_, i) => expect(an(i).detail).not.toContain('\n'))
  })
})

describe('Andere Disziplinen', () => {
  it('Police Pistol 1 nennt Stage, Distanz und Zeit', () => {
    const d = satz.disciplines.find(x => x.name.startsWith('Police Pistol 1'))
    expect(buildAnnouncement(d.phases, 0, d).detail).toMatch(/^Stage 1: 25 m — 2 Minuten/)
    expect(buildAnnouncement(d.phases, 1, d).detail).toBe('Stage 2, 1. Durchgang: 15 m — 3 Sekunden — 6 × 1 Schuss')
  })

  it('jede Phase jeder Disziplin liefert eine Ansage ohne Leerstellen', () => {
    for (const d of satz.disciplines) {
      if (d.kind !== 'sequence') continue
      d.phases.forEach((_, i) => {
        const a = buildAnnouncement(d.phases, i, d)
        expect(a.detail).not.toMatch(/—\s*—|:\s*$/)
        expect(a.detail.length).toBeGreaterThan(3)
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
