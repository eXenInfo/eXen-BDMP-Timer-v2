/**
 * Stumm, Lautstärke, Länge des Startsignals und Vorlauf, gespeichert je Gerät.
 *
 * Die Werte werden beim App-Start geladen und an die Signalausgabe
 * übergeben. Der Speicher wird hereingereicht (wie bei library.js), damit
 * sich das Modul ohne Browser testen lässt.
 *
 * Untergrenze Lautstärke 10 %: Ein versehentlich unhörbares Startsignal
 * wäre auf dem Stand gefährlicher als ein zu lautes. Ganz ohne Ton geht es
 * nur bewusst über den Schalter „Stumm“ (Feld `stumm`).
 */
import * as audio from './audio.js'

export const SCHLUESSEL = 'exen_signale'
export const LAUTSTAERKE_MIN = 10
export const LAUTSTAERKE_MAX = 100
export const LAUTSTAERKE_STANDARD = 80
export const START_STANDARD_MS = 600
export const START_LAENGEN_MS = [400, 600, 800, 1000, 1200, 1500]

/**
 * Vorlauf in Sekunden für alle Disziplinen. `null` heißt „wie Disziplin“:
 * Jede Phase behält ihren eigenen Vorlauf aus den Disziplindaten.
 */
export const VORLAUF_MAX_S = 7
export const VORLAUF_WERTE_S = [null, 0, 1, 2, 3, 4, 5, 6, 7]

export function begrenzeVorlauf(wert) {
  if (wert === null || wert === undefined || wert === '') return null
  const n = Number(wert)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(VORLAUF_MAX_S, Math.round(n)))
}

export function begrenzeLautstaerke(wert) {
  const n = Number(wert)
  if (!Number.isFinite(n)) return LAUTSTAERKE_STANDARD
  return Math.max(LAUTSTAERKE_MIN, Math.min(LAUTSTAERKE_MAX, Math.round(n)))
}

export function begrenzeStartLaenge(wert) {
  const n = Number(wert)
  return START_LAENGEN_MS.includes(n) ? n : START_STANDARD_MS
}

function lesen(speicher) {
  try { return JSON.parse(speicher?.getItem(SCHLUESSEL) ?? 'null') } catch { return null }
}

/** Liest die gespeicherten Werte; fehlende oder kaputte Einträge ergeben die Standardwerte. */
export function ladeSignale(speicher) {
  const roh = lesen(speicher)
  return {
    lautstaerke: begrenzeLautstaerke(roh?.lautstaerke ?? LAUTSTAERKE_STANDARD),
    startMs:     begrenzeStartLaenge(roh?.startMs ?? START_STANDARD_MS),
    stumm:       roh?.stumm === true,
    vorlaufS:    begrenzeVorlauf(roh?.vorlaufS),
  }
}

/** Speichert die Werte (begrenzt) und gibt zurück, was tatsächlich gilt. */
export function sichereSignale(speicher, werte) {
  const gueltig = {
    lautstaerke: begrenzeLautstaerke(werte.lautstaerke),
    startMs:     begrenzeStartLaenge(werte.startMs),
    stumm:       werte.stumm === true,
    vorlaufS:    begrenzeVorlauf(werte.vorlaufS),
  }
  try { speicher?.setItem(SCHLUESSEL, JSON.stringify(gueltig)) } catch { /* ohne Speicher gilt der Wert bis zum Neuladen */ }
  return gueltig
}

/** Überträgt die Werte auf die Signalausgabe. */
export function wendeSignaleAn(werte) {
  audio.setVolume(werte.lautstaerke)
  audio.setStartSignalMs(werte.startMs)
  audio.setStummEinstellung(werte.stumm)
}
