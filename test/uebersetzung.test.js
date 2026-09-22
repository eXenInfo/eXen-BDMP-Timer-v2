import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { TEXTE_EN, fehlendeTexte, uebersetze } from '../src/core/textEn.js'
import { lokalisiereDisziplin } from '../src/core/lokalisierung.js'
import { createBuiltinSet } from '../src/core/library.js'
import { buildAnnouncement, buildEppAnnouncement } from '../src/core/ansage.js'
import { EPP_GENERAL_NOTES, EPP_VARIANTEN } from '../src/core/eppRules.js'
import {
  DISCIPLINE_RULES, COMMAND_SETS, POSITIONS, POSITION_CHANGE_NOTES,
  READINESS, COMMAND_SET_OPTIONS, WEAPON_CLASSES, GENERATED_DISCIPLINES,
} from '../src/core/disciplineRules.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const satz = createBuiltinSet(legacy)

/** Alle deutschen Texte, die aus Daten und Regelwerk in die Oberfläche kommen. */
function alleTexte() {
  const raus = []
  const add = (x) => {
    if (typeof x !== 'string' || !x.trim()) return
    x.split('\n').map(z => z.trim()).filter(Boolean).forEach(z => raus.push(z))
  }
  const addListe = (l) => (l ?? []).forEach(add)

  for (const d of satz.disciplines) {
    add(d.name); add(d.ammo); add(d.target); addListe(d.ablauf); addListe(d.hinweise)
    for (const v of d.varianten ?? []) { add(v.label); addListe(v.hinweise) }
    for (const p of d.phases ?? []) {
      add(p.name); add(p.description); addListe(p.roCommands)
      add(p.station); add(p.position); add(p.shotsNote)
      addListe(p.notes); addListe(p.afterStation)
    }
  }
  for (const r of DISCIPLINE_RULES) {
    add(r.ammo); add(r.target); add(r.abweichung); addListe(r.ablauf); addListe(r.hinweise)
    for (const v of r.varianten ?? []) { add(v.label); addListe(v.hinweise) }
  }
  for (const c of Object.values(COMMAND_SETS)) {
    add(c.label); addListe(c.hinweise)
    for (const k of [...(c.vorher ?? []), ...(c.start ?? []), ...(c.nachher ?? []), ...(c.abbruch ?? [])]) add(k.hinweis)
  }
  for (const p of Object.values(POSITIONS)) { add(p.name); add(p.text) }
  addListe(POSITION_CHANGE_NOTES)
  for (const r of Object.values(READINESS)) add(r.text)
  for (const o of COMMAND_SET_OPTIONS) add(o.label)
  for (const w of Object.values(WEAPON_CLASSES)) add(w.label)
  addListe(EPP_GENERAL_NOTES)
  for (const v of EPP_VARIANTEN) { add(v.label); addListe(v.hinweise) }
  for (const g of GENERATED_DISCIPLINES) {
    add(g.name)
    for (const p of g.phases) { add(p.name); add(p.description) }
  }
  return raus
}

describe('Englische Fassung', () => {
  it('jeder deutsche Text aus Daten und Regelwerk hat eine englische Fassung', () => {
    expect(fehlendeTexte(alleTexte())).toEqual([])
  })

  it('kein Eintrag ist leer', () => {
    const leer = Object.entries(TEXTE_EN).filter(([, en]) => !String(en ?? '').trim())
    expect(leer.map(([de]) => de)).toEqual([])
  })

  it('die Wörterbuchdatei führt keine Texte, die es nicht mehr gibt', () => {
    const vorhanden = new Set(alleTexte())
    expect(Object.keys(TEXTE_EN).filter(k => !vorhanden.has(k))).toEqual([])
  })

  it('Deutsch bleibt unverändert', () => {
    expect(uebersetze('6 Schüsse stehend frei', 'de')).toBe('6 Schüsse stehend frei')
  })

  it('mehrzeilige Texte werden Zeile für Zeile übersetzt', () => {
    const roh = '6 Schuss kniend\nIst jemand nicht fertig? - ACHTUNG!'
    expect(uebersetze(roh, 'en')).toBe('6 rounds kneeling\nIs anyone not ready? - STAND BY!')
  })
})

describe('Disziplin auf Englisch', () => {
  const de = satz.disciplines.find(d => d.name === 'BDMP 1020')
  const en = lokalisiereDisziplin(de, 'en')

  it('Regeltexte, Hinweise und Stellungen sind übersetzt', () => {
    expect(en.ablauf.join(' ')).toContain('double action only')
    expect(en.ablauf.join(' ')).not.toMatch(/Schüsse|Sekunden/)
    expect(en.hinweise.join(' ')).not.toMatch(/Reihenfolge|Scheibenentfernungen/)
    expect(en.readiness.text).toContain('holster')
  })

  it('die Kommandos behalten beide Sprachen, der Hinweis wird übersetzt', () => {
    expect(en.commandSet.vorher[0].de).toBe('Laden und holstern!')
    expect(en.commandSet.vorher[0].en).toBe('Load and holster!')
    expect(en.commandSet.vorher[0].hinweis).toContain('holstered')
  })

  it('die Phasentexte sind übersetzt', () => {
    expect(en.phases[0].name).toBe('Match 1: We move to 7 metres')
    expect(en.phases[0].roCommands.join(' ')).toContain('STAND BY!')
  })

  it('das Deutsche bleibt davon unberührt', () => {
    expect(de.phases[0].name).toBe('Match 1: Wir gehen auf 7 Meter')
  })
})

describe('Ansage auf Englisch', () => {
  const en = lokalisiereDisziplin(satz.disciplines.find(d => d.name === 'BDMP 1020'), 'en')

  it('Führungsansage und Detailzeile sind vollständig englisch', () => {
    const a = buildAnnouncement(en.phases, 0, en, 'en')
    expect(a.fuehrung).toBe('We move to 7 metres')
    expect(a.detail).toBe('Match 1 Stage 1: 7 m — 20 seconds — double action only — 2 × 6 rounds, standing unsupported, including the reload')
  })

  it('bleibt die Entfernung gleich, heißt es „We stay at“', () => {
    expect(buildAnnouncement(en.phases, 4, en, 'en').fuehrung).toBe('We stay at 25 metres')
  })

  it('keine deutschen Reste in irgendeiner Ansage', () => {
    for (const d0 of satz.disciplines) {
      const d = lokalisiereDisziplin(d0, 'en')
      if (d.ohneAnsage) continue
      const bau = d.kind === 'epp' ? buildEppAnnouncement : buildAnnouncement
      d.phases.forEach((_, i) => {
        const a = d.kind === 'epp'
          ? bau(d.phases, i, 'en')
          : bau(d.phases, i, d, 'en')
        const text = `${a.fuehrung ?? ''} ${a.detail}`
        expect(text, `${d.name} / ${i}`).not.toMatch(/Schuss|Schüsse|Sekunden|Minuten|stehend|kniend|liegend|sitzend|Wir gehen|Durchgang/)
      })
    }
  })
})
