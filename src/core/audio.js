/**
 * Signalausgabe über Web Audio — ohne Tone.js.
 *
 * Zwei Gründe für den Verzicht auf die Bibliothek:
 *   1. Tone.js wurde per dynamischem import() erst beim ersten Ton geladen.
 *      Dadurch lief die Uhr bereits, während der Ton noch auf das Modul
 *      wartete — der Schütze hörte das Startsignal nach dem Zeitbeginn.
 *   2. Der gemeinsame Synth war monophon: überlappende Signale schnitten
 *      einander ab.
 *
 * Hier bekommt jeder Ton seinen eigenen Oszillator, und `arm()` macht die
 * Ausgabe beim ersten Antippen scharf, lange bevor das erste Signal fällt.
 *
 * Das zweite Signal nach C.17.14 ist ein DURCHGEHENDER Ton definierter
 * Länge, kein Piepen: "ein zweites Signal, das zwei Sekunden anhält".
 * Sein Ende markiert das Ende der Schießzeit.
 */

let ctx = null
let master = null
let volume = 0.8

/**
 * Stumm: kein einziger Ton, auch kein Warn- oder Abschlusston.
 *
 * Zwei Quellen, beide getrennt geführt:
 *   stummEinstellung  vom Nutzer unter „Signale und Lautstärke“ gewählt,
 *                     etwa im Training, um andere nicht zu stören;
 *   stummLauf         von der Schützenuhr erzwungen, die im Wettkampf nur
 *                     mitlaufen darf, wenn sie keine Töne von sich gibt.
 * Der Probeton unter „Signale und Lautstärke“ ist ausgenommen: Er wird
 * ausdrücklich angetippt und dient genau dem Abhören.
 */
let stummEinstellung = false
let stummLauf = false
export function setStummEinstellung(wert) { stummEinstellung = !!wert }
export function setStumm(wert) { stummLauf = !!wert }
export function isStumm() { return stummEinstellung || stummLauf }

/**
 * Dauer der Signale in Millisekunden.
 *
 * Für das Startsignal macht die Sportordnung keine Vorgabe — sie sagt nur,
 * dass die Zeit "mit dem Startsignal" beginnt. Auf dem Stand muss es aber
 * über Umgebungslärm und durch Gehörschutz hindurch eindeutig als Beginn
 * erkennbar sein; zu kurz wirkt wie ein Klicken. Der Wert ist deshalb
 * einstellbar und wird über die Signalprobe nach Gehör festgelegt.
 *
 * Das Stoppsignal ist NICHT einstellbar: seine Dauer steht in C.17.14 und
 * kommt je Station aus den Regeldaten.
 */
let startSignalMs = 600
let endSignalMs   = 600

function ensureContext() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = volume
  master.connect(ctx.destination)
  return ctx
}

/** Beim ersten Antippen aufrufen. Ohne Benutzergeste bleibt Audio stumm. */
export async function arm() {
  const c = ensureContext()
  if (!c) return false
  if (c.state === 'suspended') {
    try { await c.resume() } catch { return false }
  }
  return c.state === 'running'
}

export function isArmed() {
  return !!ctx && ctx.state === 'running'
}

export function setVolume(prozent) {
  volume = Math.max(0, Math.min(100, prozent)) / 100
  if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.01)
}

export function getVolume() {
  return Math.round(volume * 100)
}

/**
 * Einzelner Ton. Anstieg und Abfall sind kurz gehalten, damit die Länge
 * hörbar der Vorgabe entspricht und das Ende scharf markiert ist.
 */
export function playTone({ freqHz = 880, durationMs = 400, delayMs = 0, probe = false } = {}) {
  if (!probe && isStumm()) return false
  const c = ensureContext()
  if (!c || c.state !== 'running') return false

  const start = c.currentTime + delayMs / 1000
  const dauer = durationMs / 1000
  const rampe = 0.004

  const osc = c.createOscillator()
  osc.type = 'square'           // schneidend, auf dem Stand auch ohne Kopfhörer hörbar
  osc.frequency.value = freqHz

  const hk = c.createGain()
  hk.gain.setValueAtTime(0, start)
  hk.gain.linearRampToValueAtTime(1, start + rampe)
  hk.gain.setValueAtTime(1, start + dauer - rampe)
  hk.gain.linearRampToValueAtTime(0, start + dauer)

  osc.connect(hk).connect(master)
  osc.start(start)
  osc.stop(start + dauer + 0.02)
  return true
}

export function setStartSignalMs(ms) {
  startSignalMs = Math.max(100, Math.min(3000, Math.round(ms)))
}
export function getStartSignalMs() { return startSignalMs }

export function setEndSignalMs(ms) {
  endSignalMs = Math.max(100, Math.min(3000, Math.round(ms)))
}
export function getEndSignalMs() { return endSignalMs }

/** Startsignal der Station bzw. Phase. */
export function playStartSignal() {
  return playTone({ freqHz: 880, durationMs: startSignalMs })
}

/**
 * Zweites Signal (Stoppsignal), C.17.14. Durchgehend über die volle Dauer;
 * sein Ende ist die Grenze der gewerteten Schusszeit.
 */
export function playStopSignal(durationMs = 2000) {
  return playTone({ freqHz: 880, durationMs })
}

/** Ende einer Übung ohne eigenes Stoppsignal. */
export function playEndSignal() {
  return playTone({ freqHz: 660, durationMs: endSignalMs })
}

/** Abschluss des gesamten Ablaufs: zwei Töne. */
export function playFinishSignal() {
  playTone({ freqHz: 880, durationMs: 300 })
  playTone({ freqHz: 880, durationMs: 300, delayMs: 450 })
}

/** Warnton für Fehlbedienung oder Ausschluss. */
export function playAlert() {
  playTone({ freqHz: 330, durationMs: 700 })
}

/** Signalprobe: spielt das Startsignal in einer bestimmten Länge. */
export function probeStartSignal(durationMs = startSignalMs) {
  return playTone({ freqHz: 880, durationMs, probe: true })
}
