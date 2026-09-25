import { describe, it, expect } from 'vitest'
import { createLibrary, duplicateSet, fetchDaten, STANDARD_SCHLUESSEL } from '../src/core/library.js'
import { zeitAbdruck } from '../src/core/kopienAbgleich.js'
import legacy from '../public/disziplinen.json'

function speicher() {
  const m = new Map()
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k), m }
}

/** Sportordnung geändert: PP4 Stage 1 auf 90 s, dazu eine neue Disziplin. */
function neueFassung() {
  const d = structuredClone(legacy)
  d['Police Pistol 4 (Pocket Gun)'][0].duration = 90
  d['Neue Übung 2027'] = [{ name: 'Serie 1: 25m', prepTime: 5, duration: 60, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false }]
  return d
}
const pp4 = (satz) => satz.disciplines.find(x => x.id === 'police-pistol-4-pocket-gun')

describe('Mitgelieferten Satz aktualisieren', () => {
  it('übernimmt neue und geänderte Disziplinen und meldet sie', () => {
    const bib = createLibrary(speicher(), legacy)
    const b = bib.standardAktualisieren(neueFassung())
    expect(b.neu).toEqual(['Neue Übung 2027'])
    expect(b.geaendert).toEqual(['Police Pistol 4 (Pocket Gun)'])
    expect(b.entfallen).toEqual([])
    expect(pp4(bib.builtin()).phases[0].durationMs).toBe(90_000)
    expect(bib.builtin().readonly).toBe(true)
    expect(bib.standardStand().quelle).toBe('nachgeladen')
  })

  it('der nachgeladene Stand gilt auch nach einem Neustart', () => {
    const s = speicher()
    createLibrary(s, legacy).standardAktualisieren(neueFassung())
    const bib = createLibrary(s, legacy)
    expect(pp4(bib.builtin()).phases[0].durationMs).toBe(90_000)
    expect(bib.builtin().disciplines.map(d => d.name)).toContain('Neue Übung 2027')
  })

  it('bringt eine neue App-Version eigene Daten mit, gelten diese und der alte Nachlade-Stand entfällt', () => {
    const s = speicher()
    createLibrary(s, legacy).standardAktualisieren(neueFassung())
    const appNeu = structuredClone(legacy)
    appNeu['Police Pistol 4 (Pocket Gun)'][0].duration = 95
    const bib = createLibrary(s, appNeu)
    expect(pp4(bib.builtin()).phases[0].durationMs).toBe(95_000)
    expect(bib.standardStand().quelle).toBe('app')
    expect(s.m.has(STANDARD_SCHLUESSEL)).toBe(false)
  })

  it('ist die Datei gleich den App-Daten, gibt es keinen eigenen Nachlade-Stand', () => {
    const s = speicher()
    const bib = createLibrary(s, legacy)
    const b = bib.standardAktualisieren(structuredClone(legacy))
    expect([b.neu, b.geaendert, b.entfallen]).toEqual([[], [], []])
    expect(bib.standardStand().quelle).toBe('app')
    expect(s.m.has(STANDARD_SCHLUESSEL)).toBe(false)
  })

  it('unveränderte Kopien ziehen nach, selbst geänderte bleiben', () => {
    const s = speicher()
    const bib = createLibrary(s, legacy)
    const unveraendert = duplicateSet(bib.builtin(), 'Kopie A')
    const selbst = duplicateSet(bib.builtin(), 'Kopie B')
    pp4(selbst).phases[0].durationMs = 80_000
    bib.save(unveraendert); bib.save(selbst)
    const b = bib.standardAktualisieren(neueFassung())
    expect(b.kopien).toEqual([{ satz: 'Kopie A', disziplin: 'Police Pistol 4 (Pocket Gun)' }])
    const saetze = bib.sets()
    expect(pp4(saetze.find(x => x.name === 'Kopie A')).phases[0].durationMs).toBe(90_000)
    expect(pp4(saetze.find(x => x.name === 'Kopie B')).phases[0].durationMs).toBe(80_000)
    expect(zeitAbdruck(pp4(saetze.find(x => x.name === 'Kopie A')).phases)).toBe(zeitAbdruck(pp4(bib.builtin()).phases))
  })

  it('leere oder falsche Daten werden abgewiesen, der Satz bleibt', () => {
    const bib = createLibrary(speicher(), legacy)
    expect(() => bib.standardAktualisieren({})).toThrow(/Keine Disziplinen/)
    expect(pp4(bib.builtin()).phases[0].durationMs).toBe(100_000)
  })

  it('holt die Datei ohne Zwischenspeicher', async () => {
    let optionen
    const daten = await fetchDaten('./disziplinen.json', async (url, o) => { optionen = o; return { ok: true, text: async () => '{"a":1}' } })
    expect(daten).toEqual({ a: 1 })
    expect(optionen.cache).toBe('no-store')
    await expect(fetchDaten('x', async () => ({ ok: false, status: 404 }))).rejects.toThrow(/404/)
  })
})
