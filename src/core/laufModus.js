/**
 * Betriebsarten des Laufs.
 *
 *   aufsicht      Der Timer führt den Ablauf mit Vorlauf und Signalen.
 *                 Ob dabei Töne erklingen, regelt der Schalter „Stumm“
 *                 unter „Signale und Lautstärke“ (signalEinstellungen.js).
 *   schuetzenuhr  Uhr für den Schützen, die im Wettkampf mitläuft, nur für
 *                 lange Serien (ab 60 s). Kurze Intervalle regelt auf dem Stand
 *                 die Drehscheibe, dafür schaut niemand auf eine Uhr. Beim EPP
 *                 läuft nur die Gesamtzeit. Kein Ton, kein Farbwechsel. Ohne Vorlauf tippt der Schütze beim
 *                 Startsignal der Aufsicht; mit eingestelltem Vorlauf schon
 *                 beim Kommando „Achtung“. Jede Serie wartet auf diesen Tipp,
 *                 so bleibt die Uhr nie vor oder hinter dem Stand.
 *
 * Die Umformung der Phasen ist eine reine Funktion. Der Zeitkern
 * (sequenceEngine) bleibt unverändert und wird nur anders gefüttert.
 */

export const MODI = ['aufsicht', 'schuetzenuhr']
export const MODUS_STANDARD = 'aufsicht'
export const MODUS_SCHLUESSEL = 'exen_laufmodus'

export function begrenzeModus(wert) {
  return MODI.includes(wert) ? wert : MODUS_STANDARD
}

export function ladeModus(speicher) {
  try { return begrenzeModus(JSON.parse(speicher?.getItem(MODUS_SCHLUESSEL) ?? 'null')) }
  catch { return MODUS_STANDARD }
}

export function sichereModus(speicher, modus) {
  const gueltig = begrenzeModus(modus)
  try { speicher?.setItem(MODUS_SCHLUESSEL, JSON.stringify(gueltig)) } catch { /* gilt bis zum Neuladen */ }
  return gueltig
}

/** Ob in diesem Modus überhaupt ein Ton erklingen darf (die Einstellung „Stumm“ gilt zusätzlich). */
export const mitTon = (modus) => begrenzeModus(modus) === 'aufsicht'

/** Ob die Anzeige neutral bleiben muss (keine Farbwechsel). */
export const neutraleAnzeige = (modus) => begrenzeModus(modus) === 'schuetzenuhr'

/**
 * Vorlauf einer Phase in Millisekunden.
 *
 * Ein unter „Signale und Lautstärke“ eingestellter Vorlauf (0 bis 7 s) gilt
 * für alle Disziplinen und beide Betriebsarten. Steht er auf „wie Disziplin“
 * (`null`), behält die Aufsicht den Vorlauf der Phase, die Schützenuhr
 * startet ohne Vorlauf beim Startsignal.
 */
export function vorlaufMs(phasenMs, vorlaufS, modus = MODUS_STANDARD) {
  if (vorlaufS != null) return Math.max(0, Math.round(vorlaufS)) * 1000
  return begrenzeModus(modus) === 'schuetzenuhr' ? 0 : Math.max(0, phasenMs ?? 0)
}

const phasenVorlauf = (p) => p.prepMs ?? (p.prepTime ?? 0) * 1000
const phasenDauer = (p) => p.durationMs ?? (p.duration ?? 0) * 1000

/** Kürzeste Serie, für die die Schützenuhr angeboten wird. */
export const SCHUETZENUHR_MIN_MS = 60_000

/** Nur die langen Serien, für die ein Schütze mitlaufen lässt. */
export function langeSerien(phasen) {
  return (phasen ?? []).filter(p => phasenDauer(p) >= SCHUETZENUHR_MIN_MS)
}

/**
 * Ob die Schützenuhr für diese Disziplin angeboten wird: beim EPP immer
 * (Gesamtzeit), bei der freien Zeit immer, sonst nur mit mindestens einer
 * langen Serie.
 */
export function hatSchuetzenuhr(disziplin) {
  if (!disziplin) return false
  if (disziplin.kind === 'epp' || disziplin.freieZeit || disziplin.eppGesamtzeit) return true
  return langeSerien(disziplin.phases).length > 0
}

/**
 * Schützenuhr beim EPP: eine einzige Serie über die Gesamtzeit (C.17, 5:30).
 * Getippt wird beim ersten Startsignal, die Stationen zählen nicht einzeln.
 */
export function eppGesamtzeitDisziplin(epp, phasenName) {
  const ms = epp?.totalTimeMs ?? 330_000
  return {
    id: `${epp?.id ?? 'epp'}-gesamtzeit`,
    name: epp?.name ?? 'EPP',
    kind: 'sequence',
    eppGesamtzeit: true,
    phases: [{
      name: phasenName ?? 'Gesamtzeit', description: '', roCommands: [],
      prepMs: 0, durationMs: ms, repetitions: 1, repPauseMs: 0,
      soundAtStart: false, soundAtEnd: false, waitAfter: false,
    }],
  }
}

/** Phasen für die Aufsicht mit dem eingestellten Vorlauf. Ohne Einstellung unverändert. */
export function phasenMitVorlauf(phasen, vorlaufS) {
  if (vorlaufS == null) return phasen ?? []
  const ms = vorlaufMs(0, vorlaufS)
  return (phasen ?? []).map(p => ({ ...p, prepMs: ms, prepTime: ms / 1000 }))
}

/**
 * Phasen für die Schützenuhr.
 *
 * Nur lange Serien (langeSerien), außer bei freier Zeit und EPP-Gesamtzeit,
 * die genau eine selbst gewählte Serie haben. Jede Wiederholung wird eine
 * eigene Serie, jede Serie startet erst auf Tipp,
 * danach mit dem eingestellten Vorlauf (siehe vorlaufMs). Pausen zwischen
 * Durchgängen entfallen, weil sie auf dem Stand die Aufsicht bestimmt, nicht
 * die Uhr.
 */
export function phasenFuerSchuetzenuhr(phasen, vorlaufS = null, { alle = false } = {}) {
  const raus = []
  for (const p of alle ? (phasen ?? []) : langeSerien(phasen)) {
    const n = Math.max(1, Math.round(p.repetitions ?? 1))
    const prepMs = vorlaufMs(phasenVorlauf(p), vorlaufS, 'schuetzenuhr')
    for (let i = 1; i <= n; i++) {
      raus.push({
        ...p,
        name: n > 1 ? `${p.name} (${i}/${n})` : p.name,
        prepMs, prepTime: prepMs / 1000,
        repetitions: 1, repPauseMs: 0, pauseDuration: 0,
        soundAtStart: false, soundAtEnd: false,
        waitAfter: true,
      })
    }
  }
  return raus
}

/** Schlichte Disziplin mit einer einzigen Serie frei gewählter Länge. */
export function freieZeitDisziplin(sekunden, name) {
  const s = Math.max(1, Math.min(3600, Math.round(Number(sekunden) || 0)))
  return {
    id: `freie-zeit-${s}`,
    name: name ?? `${s} s`,
    kind: 'sequence',
    freieZeit: true,
    phases: [{
      name: name ?? `${s} s`, description: '', roCommands: [],
      prepMs: 0, durationMs: s * 1000, repetitions: 1, repPauseMs: 0,
      soundAtStart: false, soundAtEnd: false, waitAfter: false,
    }],
  }
}
