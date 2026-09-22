/**
 * Disziplin-Bibliothek: Sätze anlegen, bearbeiten, sichern, aus- und einlesen.
 *
 * Ein SATZ bündelt Disziplinen samt aller Texte — Namen, Beschreibungen und
 * RO-Ansagen. Gründe für diese Klammer:
 *   - Der mitgelieferte Satz bleibt unangetastet, damit man immer auf den
 *     Auslieferungsstand zurück kann.
 *   - Eigene Fassungen (Vereinsansagen, Trainingsvarianten) stehen daneben
 *     und lassen sich als Ganzes weitergeben.
 *   - Kommen neue Disziplinen dazu, wird nachgeladen statt neu eingerichtet;
 *     eigene Änderungen bleiben dabei erhalten.
 *
 * Kein Zugriff auf localStorage im Modul selbst — der Speicher wird
 * hereingereicht. Dadurch ist alles hier testbar.
 */

import { convertLegacyCollection, toLegacyPhase } from './legacyImport.js'
import { EPP_PHASES, EPP_TOTAL_TIME_MS } from './eppRules.js'

export const SPEICHER_SCHLUESSEL = 'bdmp.bibliothek.v1'
export const FORMAT = 'bdmp-timer-satz/1'

const jetzt = () => new Date().toISOString()

const slug = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'ohne-namen'

/** Baut den mitgelieferten Satz aus den Regeldaten und der Altsammlung. */
export function createBuiltinSet(legacyCollection) {
  const disciplines = convertLegacyCollection(legacyCollection).map(d => ({
    id: slug(d.name), name: d.name, kind: d.kind, phases: d.phases,
  }))
  disciplines.unshift({
    id: 'epp',
    name: 'Europäischer Präzisions Parcours (EPP)',
    kind: 'epp',
    ruleRef: 'C.17',
    totalTimeMs: EPP_TOTAL_TIME_MS,
    prepMs: 3000,
    phases: structuredClone(EPP_PHASES),
  })
  return {
    id: 'bdmp-standard',
    name: 'BDMP Standard',
    version: 1,
    updatedAt: jetzt(),
    source: 'builtin',
    readonly: true,
    disciplines,
  }
}

/** Bearbeitbare Kopie eines Satzes. */
export function duplicateSet(satz, neuerName) {
  const name = neuerName?.trim() || `${satz.name} (Kopie)`
  return {
    ...structuredClone(satz),
    id: `${slug(name)}-${Date.now().toString(36)}`,
    name,
    version: 1,
    updatedAt: jetzt(),
    source: 'user',
    readonly: false,
    basedOn: { id: satz.id, version: satz.version },
  }
}

export function touchSet(satz) {
  return { ...satz, version: (satz.version ?? 1) + 1, updatedAt: jetzt() }
}

// ── Speicher ────────────────────────────────────────────────────────────────

export function createLibrary(storage, legacyCollection) {
  function lesen() {
    try {
      const roh = storage?.getItem(SPEICHER_SCHLUESSEL)
      if (!roh) return null
      const daten = JSON.parse(roh)
      return daten && Array.isArray(daten.sets) ? daten : null
    } catch { return null }
  }

  function schreiben(daten) {
    try { storage?.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(daten)); return true }
    catch { return false }
  }

  let zustand = lesen() ?? { sets: [], activeSetId: 'bdmp-standard' }
  const builtin = createBuiltinSet(legacyCollection)

  const alleSaetze = () => [builtin, ...zustand.sets]

  return {
    sets: alleSaetze,
    builtin: () => builtin,
    activeSetId: () => zustand.activeSetId,

    activeSet() {
      return alleSaetze().find(s => s.id === zustand.activeSetId) ?? builtin
    },

    setActive(id) {
      if (!alleSaetze().some(s => s.id === id)) return false
      zustand = { ...zustand, activeSetId: id }
      return schreiben(zustand)
    },

    /** Eigenen Satz sichern (anlegen oder ersetzen). */
    save(satz) {
      if (satz.readonly) return false
      const aktualisiert = touchSet(satz)
      const i = zustand.sets.findIndex(s => s.id === satz.id)
      const sets = [...zustand.sets]
      if (i >= 0) sets[i] = aktualisiert; else sets.push(aktualisiert)
      zustand = { ...zustand, sets }
      return schreiben(zustand) ? aktualisiert : false
    },

    remove(id) {
      if (id === builtin.id) return false
      const sets = zustand.sets.filter(s => s.id !== id)
      const activeSetId = zustand.activeSetId === id ? builtin.id : zustand.activeSetId
      zustand = { sets, activeSetId }
      return schreiben(zustand)
    },

    reload() { zustand = lesen() ?? { sets: [], activeSetId: builtin.id } },
  }
}

// ── Aus- und Einlesen ───────────────────────────────────────────────────────

/** Eigenes Format — vollständig, mit allen Texten. */
export function exportSet(satz) {
  return JSON.stringify({
    format: FORMAT,
    exportedAt: jetzt(),
    set: { ...satz, source: 'imported', readonly: false },
  }, null, 2)
}

/** Altformat des Produktiv-Timers — für den Weg zurück. */
export function exportSetLegacy(satz) {
  const raus = {}
  for (const d of satz.disciplines) {
    if (d.kind === 'sequence') raus[d.name] = d.phases.map(toLegacyPhase)
  }
  return JSON.stringify(raus, null, 2)
}

/**
 * Nimmt beide Formate entgegen: das eigene und die Sammlung des
 * Produktiv-Timers. So lässt sich alles einlesen, was der Nutzer zur Hand hat.
 */
export function importSet(text, fallbackName = 'Eingelesener Satz') {
  let daten
  try { daten = JSON.parse(text) }
  catch { throw new Error('Das ist kein gültiges JSON.') }

  if (daten?.format === FORMAT && daten.set) {
    const s = daten.set
    if (!Array.isArray(s.disciplines)) throw new Error('Dem Satz fehlen die Disziplinen.')
    return { ...s, id: s.id || slug(s.name), source: 'imported', readonly: false, updatedAt: jetzt() }
  }

  if (daten && typeof daten === 'object' && !Array.isArray(daten)) {
    const umgewandelt = convertLegacyCollection(daten)
    if (umgewandelt.length === 0) throw new Error('Keine Disziplinen gefunden.')
    return {
      id: `${slug(fallbackName)}-${Date.now().toString(36)}`,
      name: fallbackName, version: 1, updatedAt: jetzt(),
      source: 'imported', readonly: false,
      disciplines: umgewandelt.map(d => ({ id: slug(d.name), name: d.name, kind: d.kind, phases: d.phases })),
    }
  }
  throw new Error('Unbekanntes Format.')
}

/**
 * Nachladen: neue Disziplinen aufnehmen, bekannte auf Wunsch auffrischen,
 * eigene Änderungen nicht überfahren.
 *
 * @param {'nurNeue'|'auffrischen'} strategie
 * @returns {{ satz, neu: string[], aktualisiert: string[], behalten: string[] }}
 */
export function mergeSet(ziel, quelle, strategie = 'nurNeue') {
  const disciplines = [...ziel.disciplines]
  const neu = [], aktualisiert = [], behalten = []

  for (const d of quelle.disciplines) {
    const i = disciplines.findIndex(x => x.id === d.id || x.name === d.name)
    if (i < 0) {
      disciplines.push(structuredClone(d))
      neu.push(d.name)
    } else if (strategie === 'auffrischen') {
      disciplines[i] = structuredClone(d)
      aktualisiert.push(d.name)
    } else {
      behalten.push(d.name)
    }
  }
  return { satz: { ...ziel, disciplines, updatedAt: jetzt() }, neu, aktualisiert, behalten }
}

/** Nachladen aus dem Netz — im Auslieferungszustand die eigene disziplinen.json. */
export async function fetchSet(url, fetchImpl = globalThis.fetch) {
  const antwort = await fetchImpl(url, { cache: 'no-store' })
  if (!antwort.ok) throw new Error(`Abruf fehlgeschlagen (${antwort.status}).`)
  return importSet(await antwort.text(), 'Nachgeladene Disziplinen')
}
