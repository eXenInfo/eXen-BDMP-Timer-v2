import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { createDiscipline, enrichDiscipline, leererSchritt, COMMAND_SET_OPTIONS } from '../src/core/disciplineRules.js'
import { createLibrary, duplicateSet, exportSet, importSet } from '../src/core/library.js'
import { createSequenceEngine, SeqState } from '../src/core/sequenceEngine.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const fakeStorage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) } }

describe('Eigene Disziplin anlegen', () => {
  it('kommt mit einem ersten, leeren Schritt ohne Vorgaben', () => {
    const d = createDiscipline('Vereinstraining Schnellfeuer')
    expect(d.name).toBe('Vereinstraining Schnellfeuer')
    expect(d.kind).toBe('sequence')
    expect(d.eigen).toBe(true)
    expect(d.phases).toHaveLength(1)
    expect(d.phases[0]).toMatchObject({
      prepMs: 0, durationMs: 0, repetitions: 1, repPauseMs: 0,
      soundAtStart: false, soundAtEnd: false, waitAfter: false,
    })
  })

  it('ein neuer Schritt ist immer leer, unabhängig vom Schritt davor', () => {
    const s = leererSchritt('Neuer Schritt')
    expect(s).toMatchObject({ name: 'Neuer Schritt', prepMs: 0, durationMs: 0, repetitions: 1, repPauseMs: 0,
      soundAtStart: false, soundAtEnd: false, waitAfter: false, roCommands: [] })
    expect(leererSchritt()).not.toBe(leererSchritt())
  })

  it('ein leerer Schritt bringt den Zeitkern nicht aus dem Tritt', () => {
    const e = createSequenceEngine({ phases: createDiscipline().phases })
    e.start(0)
    e.tick(100)
    expect(e.snapshot(100).state).toBe(SeqState.FINISHED)
  })

  it('selbst eingetragene Schritte laufen genau so ab: 4 s Vorlauf, 2 × 10 s mit 3 s Pause, Halt', () => {
    const phasen = [
      { ...leererSchritt('A'), prepMs: 4000, durationMs: 10_000, repetitions: 2, repPauseMs: 3000, waitAfter: true },
      { ...leererSchritt('B'), prepMs: 0, durationMs: 5000 },
    ]
    const e = createSequenceEngine({ phases: phasen })
    e.start(0)
    const zu = (t) => { for (let x = 100; x <= t; x += 100) e.tick(x); return e.snapshot(t) }
    expect(zu(3900).state).toBe(SeqState.PREP)
    expect(zu(4000).state).toBe(SeqState.RUNNING)
    expect(zu(14_000).state).toBe(SeqState.REP_PAUSE)
    expect(zu(17_000).state).toBe(SeqState.RUNNING)
    expect(zu(27_000).state).toBe(SeqState.WAITING_NEXT)
  })
})

describe('Kommandofolge für eigene Disziplinen', () => {
  it('ohne Namenstreffer und mit „auto“ gibt es keine Kommandos', () => {
    const d = enrichDiscipline(createDiscipline('Eigenes Training'))
    expect(d.commandSet).toBeNull()
  })

  it('die amtliche Folge lässt sich ausdrücklich zuweisen', () => {
    const d = enrichDiscipline({ ...createDiscipline('Eigenes Training'), commandSetId: 'ppc1500' })
    expect(d.commandSet.ruleRef).toBe('C.8.5')
    expect(d.commandSet.vorher[0].de).toBe('Laden und holstern!')
  })

  it('„keine“ unterdrückt auch eine am Namen erkannte Folge', () => {
    const d = enrichDiscipline({ ...createDiscipline('BDMP 1020 eigene Fassung'), commandSetId: 'keine' })
    expect(d.commandSet).toBeNull()
  })

  it('die Auswahl bietet beide amtlichen Folgen plus automatisch und keine', () => {
    expect(COMMAND_SET_OPTIONS.map(o => o.id)).toEqual(['auto', 'policePistol', 'ppc1500', 'keine'])
  })

  it('Stellungen werden auch bei eigenen Texten erkannt', () => {
    const d = createDiscipline('Eigenes')
    d.phases[0].description = '6 Schuss sitzend\n6 Schuss stehend, linke Hand, Pfosten links'
    const reich = enrichDiscipline(d)
    expect(reich.phases[0].positions.map(p => p.name)).toContain('Sitzend')
    expect(reich.phases[0].positionChangeNotes.length).toBeGreaterThan(0)
  })
})

describe('Eigene Disziplinen in einem eigenen Satz', () => {
  let bib
  beforeEach(() => { bib = createLibrary(fakeStorage(), legacy) })

  it('lassen sich in einer Kopie anlegen, sichern und wiederfinden', () => {
    const kopie = duplicateSet(bib.builtin(), 'Verein')
    const vorher = kopie.disciplines.length
    kopie.disciplines.push(createDiscipline('Schnellfeuer 5x5'))
    bib.save(kopie)
    bib.setActive(kopie.id)

    const geladen = bib.activeSet()
    expect(geladen.disciplines).toHaveLength(vorher + 1)
    expect(geladen.disciplines.map(d => d.name)).toContain('Schnellfeuer 5x5')
  })

  it('alle Felder bleiben änderbar und überstehen das Sichern', () => {
    const kopie = duplicateSet(bib.builtin(), 'Verein')
    const d = createDiscipline('Eigene Übung')
    d.commandSetId = 'policePistol'
    d.phases[0] = {
      ...d.phases[0],
      name: 'Stage 1 — 25 m', description: '5 Schuss stehend frei',
      roCommands: ['Auf mein Kommando!'],
      prepMs: 7000, durationMs: 42000, repetitions: 3, repPauseMs: 8000,
      soundAtStart: false, soundAtEnd: true, waitAfter: true,
    }
    kopie.disciplines.push(d)
    bib.save(kopie); bib.setActive(kopie.id)

    const p = bib.activeSet().disciplines.find(x => x.name === 'Eigene Übung').phases[0]
    expect(p.name).toBe('Stage 1 — 25 m')
    expect(p.description).toBe('5 Schuss stehend frei')
    expect(p.roCommands).toEqual(['Auf mein Kommando!'])
    expect(p.prepMs).toBe(7000)
    expect(p.durationMs).toBe(42000)
    expect(p.repetitions).toBe(3)
    expect(p.repPauseMs).toBe(8000)
    expect(p.soundAtStart).toBe(false)
    expect(p.waitAfter).toBe(true)
  })

  it('werden beim Ausgeben und Wiedereinlesen vollständig mitgenommen', () => {
    const kopie = duplicateSet(bib.builtin(), 'Verein')
    const d = createDiscipline('Nur meine')
    d.phases[0].durationMs = 33000
    kopie.disciplines.push(d)

    const zurueck = importSet(exportSet(kopie))
    const gefunden = zurueck.disciplines.find(x => x.name === 'Nur meine')
    expect(gefunden.phases[0].durationMs).toBe(33000)
  })

  it('der mitgelieferte Satz bleibt davon unberührt', () => {
    const kopie = duplicateSet(bib.builtin(), 'Verein')
    kopie.disciplines.push(createDiscipline('Nur in der Kopie'))
    bib.save(kopie)
    expect(bib.builtin().disciplines.map(d => d.name)).not.toContain('Nur in der Kopie')
  })
})
