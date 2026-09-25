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
import { enrichDiscipline, GENERATED_DISCIPLINES } from './disciplineRules.js'
import { EPP_PHASES, EPP_TOTAL_TIME_MS, EPP_VARIANTEN } from './eppRules.js'
import { kopienAbgleichen, zeitAbdruck } from './kopienAbgleich.js'

export const SPEICHER_SCHLUESSEL = 'bdmp.bibliothek.v1'
/** Nachgeladener Stand des mitgelieferten Satzes (Altformat wie public/disziplinen.json). */
export const STANDARD_SCHLUESSEL = 'bdmp.standard.v1'
export const FORMAT = 'bdmp-timer-satz/1'
export const MAX_FAVORITEN = 5

const jetzt = () => new Date().toISOString()

/** Kurzer Prüfwert eines Textes, um gleiche Daten zu erkennen. */
function textAbdruck(text) {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return `${text.length}-${h.toString(36)}`
}

const slug = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'ohne-namen'

/** Baut den mitgelieferten Satz aus den Regeldaten und der Altsammlung. */
export function createBuiltinSet(legacyCollection) {
  const disciplines = convertLegacyCollection(legacyCollection).map(d => enrichDiscipline({
    id: slug(d.name), name: d.name, kind: d.kind, phases: d.phases,
  }))
  for (const g of GENERATED_DISCIPLINES) {
    if (!disciplines.some(d => d.name === g.name)) disciplines.push(enrichDiscipline(structuredClone(g)))
  }
  disciplines.sort((a, b) => a.name.localeCompare(b.name, 'de'))
  disciplines.unshift({
    id: 'epp',
    name: 'Europäischer Präzisions Parcours (EPP)',
    kind: 'epp',
    ruleRef: 'C.17',
    varianten: EPP_VARIANTEN,
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

  let zustand = lesen() ?? { sets: [], activeSetId: 'bdmp-standard', favoriten: [] }
  if (!Array.isArray(zustand.favoriten)) zustand = { ...zustand, favoriten: [] }

  /*
   * Mitgelieferter Satz: aus der App oder, wenn nachgeladen, aus dem Speicher.
   * Der nachgeladene Stand gilt nur, solange die App dieselben Daten mitbringt
   * wie beim Nachladen. Kommt eine neue App-Version mit eigenen Daten, sind
   * diese neuer und der nachgeladene Stand entfällt.
   */
  const appAbdruck = textAbdruck(JSON.stringify(legacyCollection ?? {}))
  function standardLesen() {
    try {
      const roh = JSON.parse(storage?.getItem(STANDARD_SCHLUESSEL) ?? 'null')
      if (roh?.daten && roh.appAbdruck === appAbdruck) return roh
      if (roh) storage?.removeItem?.(STANDARD_SCHLUESSEL)
    } catch { /* kaputter Eintrag: App-Daten gelten */ }
    return null
  }
  let standard = standardLesen()
  let builtin = createBuiltinSet(standard?.daten ?? legacyCollection)

  // Korrekturen des mitgelieferten Satzes auch in unveränderte Kopien tragen.
  let abgleich = { geaendert: [] }
  function kopienNachziehen() {
    abgleich = kopienAbgleichen(zustand.sets, builtin)
    if (abgleich.geaendert.length) {
      zustand = { ...zustand, sets: abgleich.sets }
      schreiben(zustand)
    }
  }
  kopienNachziehen()

  const alleSaetze = () => [builtin, ...zustand.sets]

  return {
    sets: alleSaetze,
    builtin: () => builtin,
    /** Disziplinen, deren Zeiten beim Laden aus dem mitgelieferten Satz übernommen wurden. */
    abgeglichen: () => [...abgleich.geaendert],

    /** Woher der mitgelieferte Satz stammt: aus der App oder nachgeladen (mit Datum). */
    standardStand: () => standard ? { quelle: 'nachgeladen', geladenAm: standard.geladenAm } : { quelle: 'app' },

    /**
     * Aktualisiert den mitgelieferten Satz aus Daten im Altformat, etwa der
     * disziplinen.json auf dem Server nach einer Änderung der Sportordnung.
     * Eigene Sätze bleiben unberührt, unveränderte Kopien ziehen nach.
     * @returns {{ neu: string[], geaendert: string[], entfallen: string[], kopien: object[] }}
     */
    standardAktualisieren(daten) {
      if (convertLegacyCollection(daten).length === 0) throw new Error('Keine Disziplinen gefunden.')
      const vorher = builtin
      const nachher = createBuiltinSet(daten)
      const kennung = (d) => d.kind === 'epp' ? d.id : `${d.name}#${zeitAbdruck(d.phases)}`
      const alt = new Map(vorher.disciplines.map(d => [d.id, d]))
      const neuIds = new Set(nachher.disciplines.map(d => d.id))
      const bericht = {
        neu: nachher.disciplines.filter(d => !alt.has(d.id)).map(d => d.name),
        geaendert: nachher.disciplines.filter(d => alt.has(d.id) && kennung(alt.get(d.id)) !== kennung(d)).map(d => d.name),
        entfallen: vorher.disciplines.filter(d => !neuIds.has(d.id)).map(d => d.name),
      }
      if (textAbdruck(JSON.stringify(daten)) === appAbdruck) {
        standard = null
        try { storage?.removeItem?.(STANDARD_SCHLUESSEL) } catch { /* nichts zu tun */ }
      } else {
        standard = { daten, appAbdruck, geladenAm: jetzt() }
        try { storage?.setItem(STANDARD_SCHLUESSEL, JSON.stringify(standard)) } catch { /* gilt bis zum Neuladen */ }
      }
      builtin = nachher
      kopienNachziehen()
      return { ...bericht, kopien: [...abgleich.geaendert] }
    },
    activeSetId: () => zustand.activeSetId,

    activeSet() {
      const satz = alleSaetze().find(s => s.id === zustand.activeSetId) ?? builtin
      // Beim Lesen anreichern: eigene Disziplinen werden schlank gespeichert,
      // bekommen hier aber Kommandofolge, Stellungen und Regeltexte dazu.
      return { ...satz, disciplines: satz.disciplines.map(enrichDiscipline) }
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

    reload() {
      zustand = lesen() ?? { sets: [], activeSetId: builtin.id, favoriten: [] }
      if (!Array.isArray(zustand.favoriten)) zustand.favoriten = []
    },

    // ── Favoriten ───────────────────────────────────────────────────────────
    // Höchstens fünf, damit die Startseite eine Auswahl bleibt und keine
    // zweite Disziplinliste wird. Gespeichert werden Kennungen, nicht Kopien.
    favoriten() { return [...zustand.favoriten] },

    istFavorit(id) { return zustand.favoriten.includes(id) },

    /** Schaltet um. Gibt false zurück, wenn die Höchstzahl erreicht ist. */
    favoritUmschalten(id) {
      const drin = zustand.favoriten.includes(id)
      if (!drin && zustand.favoriten.length >= MAX_FAVORITEN) return false
      const favoriten = drin
        ? zustand.favoriten.filter(x => x !== id)
        : [...zustand.favoriten, id]
      zustand = { ...zustand, favoriten }
      schreiben(zustand)
      return true
    },

    /** Die Favoriten des aktiven Satzes in der gespeicherten Reihenfolge. */
    favoritenDisziplinen() {
      const satz = alleSaetze().find(s => s.id === zustand.activeSetId) ?? builtin
      return zustand.favoriten
        .map(id => satz.disciplines.find(d => d.id === id))
        .filter(Boolean)
        .map(enrichDiscipline)
    },

    /**
     * Ändert eine Disziplin des aktiven Satzes. Ist er schreibgeschützt,
     * entsteht wie beim Anlegen zuerst eine bearbeitbare Kopie; die Kennung
     * der Disziplin bleibt dabei gleich, damit Favoriten weiter stimmen.
     * @param {string} id
     * @param {(d: object) => void} aenderung verändert die übergebene Kopie
     * @returns {{satz, disziplin, kopieAngelegt}|null}
     */
    disziplinAendern(id, aenderung) {
      let satz = alleSaetze().find(s => s.id === zustand.activeSetId) ?? builtin
      if (!satz.disciplines.some(d => d.id === id)) return null
      let kopieAngelegt = false
      if (satz.readonly) {
        satz = duplicateSet(satz, 'Eigene Disziplinen')
        kopieAngelegt = true
      } else {
        satz = structuredClone(satz)
      }
      const disziplin = satz.disciplines.find(d => d.id === id)
      aenderung(disziplin)
      const gesichert = this.save(satz)
      if (!gesichert) return null
      this.setActive(gesichert.id)
      return { satz: gesichert, disziplin: enrichDiscipline(disziplin), kopieAngelegt }
    },

    /**
     * Entwurf für eine neue Disziplin, noch nicht gespeichert. Ist der aktive
     * Satz schreibgeschützt, ist der Entwurf eine Kopie davon. Gespeichert
     * wird erst mit save(), etwa über „Satz sichern“ im Editor. Wer ohne
     * Sichern zurückgeht, hinterlässt nichts.
     * @returns {{satz, disziplin, kopieAngelegt}}
     */
    disziplinAnlegen(name, erzeuger) {
      const aktiv = alleSaetze().find(s => s.id === zustand.activeSetId) ?? builtin
      const kopieAngelegt = !!aktiv.readonly
      const satz = kopieAngelegt ? duplicateSet(aktiv, 'Eigene Disziplinen') : structuredClone(aktiv)
      const disziplin = erzeuger(name)
      satz.disciplines.push(disziplin)
      return { satz, disziplin, kopieAngelegt }
    },
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

/** Rohdaten aus dem Netz, etwa die disziplinen.json für den mitgelieferten Satz. */
export async function fetchDaten(url, fetchImpl = globalThis.fetch) {
  const antwort = await fetchImpl(url, { cache: 'no-store' })
  if (!antwort.ok) throw new Error(`Abruf fehlgeschlagen (${antwort.status}).`)
  try { return JSON.parse(await antwort.text()) } catch { throw new Error('Die Datei ist kein gültiges JSON.') }
}

/** Nachladen aus dem Netz — im Auslieferungszustand die eigene disziplinen.json. */
export async function fetchSet(url, fetchImpl = globalThis.fetch) {
  const antwort = await fetchImpl(url, { cache: 'no-store' })
  if (!antwort.ok) throw new Error(`Abruf fehlgeschlagen (${antwort.status}).`)
  return importSet(await antwort.text(), 'Nachgeladene Disziplinen')
}
