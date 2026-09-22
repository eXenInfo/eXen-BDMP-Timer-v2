import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { createLibrary, duplicateSet, MAX_FAVORITEN } from '../src/core/library.js'
import { createDiscipline } from '../src/core/disciplineRules.js'
import { DANKESCHOEN } from '../src/core/legal.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))
const fakeStorage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) } }

describe('Favoriten', () => {
  let bib
  beforeEach(() => { bib = createLibrary(fakeStorage(), legacy) })

  it('beginnen leer', () => {
    expect(bib.favoriten()).toEqual([])
  })

  it('lassen sich setzen und wieder entfernen', () => {
    expect(bib.favoritUmschalten('epp')).toBe(true)
    expect(bib.istFavorit('epp')).toBe(true)
    expect(bib.favoritUmschalten('epp')).toBe(true)
    expect(bib.istFavorit('epp')).toBe(false)
  })

  it('höchstens fünf', () => {
    const ids = bib.builtin().disciplines.slice(0, 6).map(d => d.id)
    ids.slice(0, 5).forEach(id => expect(bib.favoritUmschalten(id)).toBe(true))
    expect(bib.favoriten()).toHaveLength(MAX_FAVORITEN)
    expect(bib.favoritUmschalten(ids[5])).toBe(false)
    expect(bib.favoriten()).toHaveLength(MAX_FAVORITEN)
  })

  it('ein Platz wird nach dem Entfernen wieder frei', () => {
    const ids = bib.builtin().disciplines.slice(0, 6).map(d => d.id)
    ids.slice(0, 5).forEach(id => bib.favoritUmschalten(id))
    bib.favoritUmschalten(ids[0])
    expect(bib.favoritUmschalten(ids[5])).toBe(true)
  })

  it('behalten ihre Reihenfolge und liefern vollständige Disziplinen', () => {
    bib.favoritUmschalten('bdmp-1020')
    bib.favoritUmschalten('epp')
    const f = bib.favoritenDisziplinen()
    expect(f.map(d => d.id)).toEqual(['bdmp-1020', 'epp'])
    expect(f[1].phases.length).toBe(7)
  })

  it('überleben einen Neustart der Bibliothek', () => {
    const speicher = fakeStorage()
    const a = createLibrary(speicher, legacy)
    a.favoritUmschalten('epp')
    const b = createLibrary(speicher, legacy)
    expect(b.istFavorit('epp')).toBe(true)
  })

  it('eine Kennung ohne Entsprechung im Satz wird übergangen', () => {
    bib.favoritUmschalten('gibt-es-nicht')
    expect(bib.favoritenDisziplinen()).toEqual([])
  })
})

describe('Disziplin anlegen aus der Oberfläche', () => {
  let bib
  beforeEach(() => { bib = createLibrary(fakeStorage(), legacy) })

  it('legt aus dem schreibgeschützten Satz zuerst eine Kopie an', () => {
    const { satz, disziplin, kopieAngelegt } = bib.disziplinAnlegen('Mein Training', createDiscipline)
    expect(kopieAngelegt).toBe(true)
    expect(satz.readonly).toBe(false)
    expect(satz.name).toBe('Eigene Disziplinen')
    expect(satz.disciplines.map(d => d.name)).toContain('Mein Training')
    expect(disziplin.phases).toHaveLength(1)
  })

  it('der neue Satz ist danach der aktive', () => {
    const { satz } = bib.disziplinAnlegen('Mein Training', createDiscipline)
    expect(bib.activeSetId()).toBe(satz.id)
  })

  it('in einem eigenen Satz wird keine zweite Kopie erzeugt', () => {
    const eigener = duplicateSet(bib.builtin(), 'Verein')
    bib.save(eigener); bib.setActive(eigener.id)
    const { kopieAngelegt, satz } = bib.disziplinAnlegen('Zweite', createDiscipline)
    expect(kopieAngelegt).toBe(false)
    expect(satz.name).toBe('Verein')
    expect(bib.sets().filter(s => !s.readonly)).toHaveLength(1)
  })

  it('der mitgelieferte Satz bleibt unverändert', () => {
    bib.disziplinAnlegen('Mein Training', createDiscipline)
    expect(bib.builtin().disciplines.map(d => d.name)).not.toContain('Mein Training')
  })
})

describe('Dankeschön', () => {
  it('verweist nach außen und verarbeitet nichts in der App', () => {
    expect(DANKESCHOEN.url).toBe('https://paypal.me/exen')
    expect(DANKESCHOEN.label).toMatch(/Dankeschön/)
  })
})
