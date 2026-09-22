import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createBuiltinSet, duplicateSet, createLibrary,
  exportSet, exportSetLegacy, importSet, mergeSet, fetchSet, FORMAT,
} from '../src/core/library.js'

const legacy = JSON.parse(readFileSync(new URL('../public/disziplinen.json', import.meta.url), 'utf8'))

/** Speicher-Attrappe statt localStorage. */
function fakeStorage() {
  const m = new Map()
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    _map: m,
  }
}

describe('Mitgelieferter Satz', () => {
  const satz = createBuiltinSet(legacy)
  it('enthält den EPP, die 14 gepflegten Disziplinen und die zwei ergänzten', () => {
    expect(satz.disciplines).toHaveLength(17)
    expect(satz.disciplines[0].kind).toBe('epp')
    expect(satz.disciplines.filter(d => d.kind === 'sequence')).toHaveLength(16)
    const namen = satz.disciplines.map(d => d.name)
    expect(namen).toContain('DKS 1 – 1020 (Kleinkaliber)')
    expect(namen).toContain('Sports Carbine PP2 (Langwaffe)')
  })
  it('ist schreibgeschützt', () => {
    expect(satz.readonly).toBe(true)
  })
  it('die EPP-Texte sind mit dabei', () => {
    const epp = satz.disciplines[0]
    expect(epp.phases[0].roCommands[0]).toContain('Laden, fertigmachen und holstern')
    expect(epp.phases[6].announceRemainingBeforeStart).toBe(true)
  })
})

describe('Eigene Sätze', () => {
  let bib
  beforeEach(() => { bib = createLibrary(fakeStorage(), legacy) })

  it('eine Kopie ist bearbeitbar und trägt einen eigenen Namen', () => {
    const kopie = duplicateSet(bib.builtin(), 'PSSV Paderborn')
    expect(kopie.readonly).toBe(false)
    expect(kopie.name).toBe('PSSV Paderborn')
    expect(kopie.basedOn.id).toBe('bdmp-standard')
    expect(kopie.id).not.toBe('bdmp-standard')
  })

  it('Änderungen an den Ansagen überleben das Sichern', () => {
    const kopie = duplicateSet(bib.builtin(), 'Verein')
    const d = kopie.disciplines.find(x => x.name === 'BDMP 1020')
    d.phases[0].roCommands = ['Achtung — auf mein Kommando!']
    bib.save(kopie)

    const bib2 = createLibrary(bib._storage ?? null, legacy)
    // frisch aus demselben Speicher lesen
    const gesichert = bib.sets().find(s => s.name === 'Verein')
    expect(gesichert.disciplines.find(x => x.name === 'BDMP 1020').phases[0].roCommands)
      .toEqual(['Achtung — auf mein Kommando!'])
  })

  it('der mitgelieferte Satz lässt sich nicht überschreiben', () => {
    expect(bib.save(bib.builtin())).toBe(false)
  })

  it('der mitgelieferte Satz lässt sich nicht löschen', () => {
    expect(bib.remove('bdmp-standard')).toBe(false)
  })

  it('der aktive Satz wird gemerkt', () => {
    const kopie = duplicateSet(bib.builtin(), 'Training')
    bib.save(kopie)
    expect(bib.setActive(kopie.id)).toBeTruthy()
    expect(bib.activeSet().name).toBe('Training')
  })
})

describe('Ausgeben und Einlesen', () => {
  const satz = createBuiltinSet(legacy)

  it('Ausgabe und Wiedereinlesen ergibt denselben Inhalt', () => {
    const text = exportSet(satz)
    expect(JSON.parse(text).format).toBe(FORMAT)
    const zurueck = importSet(text)
    expect(zurueck.disciplines).toHaveLength(satz.disciplines.length)
    expect(zurueck.readonly).toBe(false)
    expect(zurueck.disciplines[0].phases[0].roCommands).toEqual(satz.disciplines[0].phases[0].roCommands)
  })

  it('das Altformat des Produktiv-Timers wird erkannt', () => {
    const eingelesen = importSet(JSON.stringify(legacy), 'Aus dem alten Timer')
    expect(eingelesen.disciplines).toHaveLength(14)
    expect(eingelesen.name).toBe('Aus dem alten Timer')
  })

  it('Ausgabe im Altformat lässt sich vom alten Timer wieder lesen', () => {
    const text = exportSetLegacy(satz)
    const wieder = JSON.parse(text)
    expect(Object.keys(wieder)).toHaveLength(16)          // EPP ist dort kein Listeneintrag
    expect(Array.isArray(wieder['BDMP 1020'])).toBe(true)
    expect(wieder['BDMP 1020'][0]).toHaveProperty('duration')
  })

  it('Unsinn wird mit klarer Meldung abgelehnt', () => {
    expect(() => importSet('kein json')).toThrow(/JSON/)
    expect(() => importSet('[]')).toThrow(/Unbekanntes Format/)
    expect(() => importSet('{}')).toThrow(/Keine Disziplinen/)
  })
})

describe('Nachladen', () => {
  it('nur Neue: eigene Änderungen bleiben unangetastet', () => {
    const eigener = duplicateSet(createBuiltinSet(legacy), 'Verein')
    const d = eigener.disciplines.find(x => x.name === 'BDMP 1020')
    d.phases[0].roCommands = ['Eigene Ansage']

    const quelle = createBuiltinSet(legacy)
    quelle.disciplines.push({ id: 'neue-disziplin', name: 'Neue Disziplin', kind: 'sequence', phases: [] })

    const { satz, neu, behalten } = mergeSet(eigener, quelle, 'nurNeue')
    expect(neu).toEqual(['Neue Disziplin'])
    expect(behalten.length).toBeGreaterThan(0)
    expect(satz.disciplines.find(x => x.name === 'BDMP 1020').phases[0].roCommands)
      .toEqual(['Eigene Ansage'])
  })

  it('auffrischen: bekannte Disziplinen werden ersetzt', () => {
    const eigener = duplicateSet(createBuiltinSet(legacy), 'Verein')
    eigener.disciplines.find(x => x.name === 'BDMP 1020').phases[0].roCommands = ['Eigene Ansage']
    const { satz, aktualisiert } = mergeSet(eigener, createBuiltinSet(legacy), 'auffrischen')
    expect(aktualisiert).toContain('BDMP 1020')
    expect(satz.disciplines.find(x => x.name === 'BDMP 1020').phases[0].roCommands)
      .not.toEqual(['Eigene Ansage'])
  })

  it('aus dem Netz nachladen', async () => {
    const fake = async () => ({ ok: true, text: async () => JSON.stringify(legacy) })
    const satz = await fetchSet('https://example.invalid/disziplinen.json', fake)
    expect(satz.disciplines).toHaveLength(14)
  })

  it('ein fehlgeschlagener Abruf meldet sich deutlich', async () => {
    const fake = async () => ({ ok: false, status: 404 })
    await expect(fetchSet('x', fake)).rejects.toThrow(/404/)
  })
})
