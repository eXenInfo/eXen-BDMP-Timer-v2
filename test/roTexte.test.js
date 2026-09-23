import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { createLibrary } from '../src/core/library.js'
import { enrichDiscipline, mitEigenenKommandos, COMMAND_SETS } from '../src/core/disciplineRules.js'
import { buildAnnouncement } from '../src/core/ansage.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const fakeStorage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) } }

describe('Eigene Kommandotexte', () => {
  it('ohne eigene Texte bleibt die amtliche Folge unverändert', () => {
    expect(mitEigenenKommandos(COMMAND_SETS.ppc1500, undefined)).toBe(COMMAND_SETS.ppc1500)
  })

  it('eine geänderte Gruppe ersetzt nur diese Gruppe', () => {
    const f = mitEigenenKommandos(COMMAND_SETS.ppc1500, {
      vorher: [{ de: 'Laden und holstern, bitte!', en: 'Load and holster, please!' }, { de: '  ', en: '' }],
    })
    expect(f.vorher).toEqual([{ de: 'Laden und holstern, bitte!', en: 'Load and holster, please!', hinweis: undefined }])
    expect(f.nachher).toBe(COMMAND_SETS.ppc1500.nachher)
    expect(f.eigen).toBe(true)
    expect(f.ruleRef).toBe('C.8.5')
  })

  it('die Disziplin trägt die eigenen Texte in ihre Kommandofolge', () => {
    const d = enrichDiscipline({
      id: 'x', name: 'BDMP 1020', kind: 'sequence',
      commandTexts: { start: [{ de: 'Achtung – los!', en: 'Stand by – go!' }] },
      phases: [{ name: 'Match 1', durationMs: 20000 }],
    })
    expect(d.commandSet.start[0].de).toBe('Achtung – los!')
    expect(d.commandSet.vorher[0].de).toBe('Laden und holstern!')
  })
})

describe('Disziplin ändern', () => {
  let bib
  beforeEach(() => { bib = createLibrary(fakeStorage(), legacy) })

  it('im schreibgeschützten Satz entsteht eine Kopie, die Kennung bleibt', () => {
    const id = bib.builtin().disciplines.find(d => d.kind === 'sequence').id
    const r = bib.disziplinAendern(id, d => { d.phases[0].ansage = 'Wir gehen auf 25 Meter\nEigene Ansage' })
    expect(r.kopieAngelegt).toBe(true)
    expect(r.disziplin.id).toBe(id)
    expect(bib.activeSet().readonly).toBeFalsy()
    const a = buildAnnouncement(r.disziplin.phases, 0, r.disziplin)
    expect(a).toMatchObject({ fuehrung: 'Wir gehen auf 25 Meter', detail: 'Eigene Ansage', eigen: true })
    expect(bib.builtin().disciplines.find(d => d.id === id).phases[0].ansage).toBeUndefined()
  })

  it('im eigenen Satz wird ohne weitere Kopie gespeichert', () => {
    const id = bib.builtin().disciplines[0].id
    bib.disziplinAendern(id, d => { d.phases[0].roCommands = ['Erste Änderung'] })
    const zahl = bib.sets().length
    const r = bib.disziplinAendern(id, d => { d.phases[0].roCommands = ['Zweite Änderung'] })
    expect(r.kopieAngelegt).toBe(false)
    expect(bib.sets()).toHaveLength(zahl)
    expect(bib.activeSet().disciplines.find(d => d.id === id).phases[0].roCommands).toEqual(['Zweite Änderung'])
  })

  it('unbekannte Kennung ändert nichts', () => {
    expect(bib.disziplinAendern('gibt-es-nicht', () => {})).toBeNull()
  })
})
