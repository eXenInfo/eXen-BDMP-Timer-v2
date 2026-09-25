import { describe, it, expect } from 'vitest'
import { createBuiltinSet, createLibrary, duplicateSet, SPEICHER_SCHLUESSEL } from '../src/core/library.js'
import { convertLegacyPhase } from '../src/core/legacyImport.js'
import { kopienAbgleichen, zeitAbdruck, FRUEHERE_STAENDE } from '../src/core/kopienAbgleich.js'
import legacy from '../public/disziplinen.json'

const builtin = createBuiltinSet(legacy)
const PP4 = 'police-pistol-4-pocket-gun'

/** PP4, wie sie bis zum 24.09.2026 ausgeliefert wurde: 2 × 100 s, Intervalle ohne Halt. */
const pp4Alt = () => [
  { name: 'Stage 1: 15m\n2x 5 Schuss in 100 Sekunden', prepTime: 5, duration: 100, repetitions: 2, pauseDuration: 10, soundAtStart: true, soundAtEnd: true, pauseAfter: true },
  { name: 'Stage 2: 10m\n2x (5x 1 Schuss in 2s)', prepTime: 5, duration: 2, repetitions: 10, pauseDuration: 5, soundAtStart: true, soundAtEnd: true, pauseAfter: true },
  { name: 'Stage 3: 7m\n2x (max. 2-2-1 Schuss in 3x 2s)', prepTime: 5, duration: 2, repetitions: 6, pauseDuration: 5, soundAtStart: true, soundAtEnd: true, pauseAfter: false },
].map(convertLegacyPhase)

/** Eine „Eigene Disziplinen“-Kopie vom Stand vor der Korrektur. */
function alteKopie(aendern = () => {}) {
  const kopie = duplicateSet(builtin, 'Eigene Disziplinen')
  const d = kopie.disciplines.find(x => x.id === PP4)
  d.phases = pp4Alt()
  aendern(d)
  return kopie
}
const pp4In = (satz) => satz.disciplines.find(x => x.id === PP4)

describe('Kopien übernehmen Korrekturen des mitgelieferten Satzes', () => {
  it('jeder aktuelle Auslieferungsstand ist als bekannter Stand eingetragen', () => {
    for (const d of builtin.disciplines.filter(x => x.kind !== 'epp')) {
      expect(FRUEHERE_STAENDE[d.id], `${d.name}: neuen Abdruck in kopienAbgleich.js ergänzen`)
        .toContain(zeitAbdruck(d.phases))
    }
  })

  it('unveränderte alte Kopie: PP4 bekommt 1 × 100 s und den Halt nach jedem Durchgang', () => {
    const { sets, geaendert } = kopienAbgleichen([alteKopie()], builtin)
    expect(zeitAbdruck(pp4In(sets[0]).phases)).toBe(zeitAbdruck(pp4In(builtin).phases))
    expect(pp4In(sets[0]).phases[0].durationMs).toBe(100_000)
    expect(pp4In(sets[0]).phases[0].repetitions).toBe(1)
    expect(geaendert).toEqual([{ satz: 'Eigene Disziplinen', disziplin: 'Police Pistol 4 (Pocket Gun)' }])
  })

  it('selbst geänderte Zeiten bleiben unangetastet', () => {
    const kopie = alteKopie(d => { d.phases[0].durationMs = 90_000 })
    const { sets, geaendert } = kopienAbgleichen([kopie], builtin)
    expect(pp4In(sets[0]).phases[0].durationMs).toBe(90_000)
    expect(geaendert).toEqual([])
  })

  it('eigene RO-Texte bleiben beim Schritt mit gleichem Namen erhalten', () => {
    const kopie = alteKopie(d => {
      d.phases[0].roCommands = ['Vereinsansage 15 m']
      d.phases[0].roCommandsEigen = true
      d.phases[0].ansage = 'Wir gehen auf 15 Meter, eine Serie'
    })
    const { sets } = kopienAbgleichen([kopie], builtin)
    const erster = pp4In(sets[0]).phases[0]
    expect(erster.roCommands).toEqual(['Vereinsansage 15 m'])
    expect(erster.ansage).toBe('Wir gehen auf 15 Meter, eine Serie')
    expect(erster.durationMs).toBe(100_000)
  })

  it('aktuelle Kopien, eigene Disziplinen und der mitgelieferte Satz bleiben, wie sie sind', () => {
    const aktuell = duplicateSet(builtin, 'Aktuell')
    const eigen = duplicateSet(builtin, 'Mit Eigener')
    eigen.disciplines.push({ id: 'eigen-x', name: 'Eigene', kind: 'sequence', eigen: true, phases: pp4Alt() })
    const { sets, geaendert } = kopienAbgleichen([aktuell, eigen, builtin], builtin)
    expect(sets[0]).toBe(aktuell)
    expect(sets[1]).toBe(eigen)
    expect(sets[2]).toBe(builtin)
    expect(geaendert).toEqual([])
  })

  it('beim Laden der App wird die alte Kopie im Speicher korrigiert', () => {
    const m = new Map()
    const speicher = { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
    const kopie = alteKopie()
    m.set(SPEICHER_SCHLUESSEL, JSON.stringify({ sets: [kopie], activeSetId: kopie.id, favoriten: [] }))
    const bib = createLibrary(speicher, legacy)
    expect(bib.activeSet().disciplines.find(x => x.id === PP4).phases[0].durationMs).toBe(100_000)
    expect(bib.abgeglichen()).toHaveLength(1)
    const gespeichert = JSON.parse(m.get(SPEICHER_SCHLUESSEL))
    expect(gespeichert.sets[0].disciplines.find(x => x.id === PP4).phases).toHaveLength(5)
  })
})
