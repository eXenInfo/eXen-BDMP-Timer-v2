/**
 * EPP-Zeitkern — Europäischer Präzisions Parcours
 *
 * Reiner Zustandsautomat ohne Framework- und ohne Zeitquellen-Abhängigkeit.
 * Jede Zeitangabe kommt von außen als `nowMs` herein. Dadurch ist der Ablauf
 * in Tests in Millisekunden durchrechenbar und im Browser unabhängig von der
 * Taktgenauigkeit von setInterval.
 *
 * Regelgrundlage: BDMP-Handbuch Sportordnung Teil C, C.17 (Stand 24.02.2026).
 *
 *   C.17.8  "50 Schüsse in der Gesamtzeit von 5:30 Minuten. Die Zeit startet
 *            jeweils mit dem Startsignal und stoppt nach dem Holstern der
 *            geladenen Waffe."
 *            → Die Gesamtzeit summiert AUSSCHLIESSLICH Stationszeit.
 *              Wege, Trefferaufnahme und Abkleben zählen nicht mit.
 *
 *   C.17.14 "Die Zeit beginnt mit dem Startsignal. Nach 13 Sekunden ertönt ein
 *            zweites Signal, das zwei Sekunden anhält. Jeder Schuss nach Ende
 *            des zweiten Signals ist außerhalb der Zeit abgegeben."
 *            → Das zweite Signal ist das Stoppsignal. Es beginnt bei 13 s,
 *              dauert 2 s und endet exakt mit dem Zeitlimit von 15 s.
 *              Station 5b analog: 8 s / 2 s / 10 s.
 *
 *   C.17.11 "Bei einer Störung ... Die Zeit wird gestoppt. Nach Beseitigung der
 *            Störung startet die Zeit wieder mit dem nächsten Schuss. Bei der
 *            zweiten Störung wird der Schütze vom weiteren Wettkampf
 *            ausgeschlossen."
 */

export const EppState = {
  IDLE:          'idle',          // Station gewählt, Startsignal noch nicht gegeben
  PREP:          'prep',          // Vorlauf vor dem Startsignal (keine Regelvorgabe)
  RUNNING_FIXED: 'runningFixed',  // Station mit festem Zeitlimit, zählt ab
  RUNNING_OPEN:  'runningOpen',   // offene Station, zählt auf, RO stoppt
  MALFUNCTION:   'malfunction',   // Störung gemeldet, Zeit steht (C.17.11)
  FINISHED:      'finished',      // Parcours regulär beendet
  EXCLUDED:      'excluded',      // zweite Störung → Ausschluss (C.17.11)
}

export const EppEvent = {
  START_SIGNAL:  'startSignal',   // Startsignal der Station
  STOP_SIGNAL:   'stopSignal',    // zweites Signal, Dauer in durationMs
  STATION_END:   'stationEnd',
  TOTAL_EXPIRED: 'totalExpired',  // 5:30 aufgebraucht
  FINISHED:      'finished',
  EXCLUDED:      'excluded',
  STATE_CHANGE:  'stateChange',
}

const DEFAULT_TOTAL_MS = 330_000   // 5:30 (C.17.8)
const DEFAULT_PREP_MS  = 3_000     // freie Gestaltung, keine Regelvorgabe

/**
 * @param {object}  options
 * @param {Array}   options.phases        Stationen (siehe eppRules.js)
 * @param {?number} options.totalTimeMs   Gesamtzeit; null = ohne Gesamtzeit
 *                                        (Training einzelner Stationen)
 * @param {number}  options.prepMs        Vorlauf je Station
 */
export function createEppEngine({
  phases,
  totalTimeMs = DEFAULT_TOTAL_MS,
  prepMs = DEFAULT_PREP_MS,
} = {}) {
  if (!Array.isArray(phases) || phases.length === 0) {
    throw new Error('eppEngine: phases muss eine nicht-leere Liste sein')
  }

  let state            = EppState.IDLE
  let stationIndex     = 0
  let malfunctionCount = 0

  // Zeitverrechnung: Was abgeschlossen ist, liegt in den accumulated-Werten.
  // Was gerade läuft, wird aus segmentStartMs gegen nowMs gerechnet.
  let segmentStartMs      = null
  let accumulatedStationMs = 0
  let accumulatedTotalMs   = 0
  let prepStartMs          = null

  let stopSignalFired = false
  let totalExpiredFired = false
  let lastKnownNowMs = 0

  const phase = () => phases[stationIndex] ?? null

  function runningElapsed(nowMs) {
    return segmentStartMs === null ? 0 : Math.max(0, nowMs - segmentStartMs)
  }

  function isClockRunning() {
    return state === EppState.RUNNING_FIXED || state === EppState.RUNNING_OPEN
  }

  function freezeClock(nowMs) {
    if (segmentStartMs === null) return
    const delta = Math.max(0, nowMs - segmentStartMs)
    accumulatedStationMs += delta
    accumulatedTotalMs   += delta
    segmentStartMs = null
  }

  function stationElapsedMs(nowMs) {
    return accumulatedStationMs + (isClockRunning() ? runningElapsed(nowMs) : 0)
  }

  function totalElapsedMs(nowMs) {
    return accumulatedTotalMs + (isClockRunning() ? runningElapsed(nowMs) : 0)
  }

  function beginStation(nowMs, events) {
    const p = phase()
    accumulatedStationMs = 0
    stopSignalFired = false
    segmentStartMs = nowMs
    state = p.timeLimitMs > 0 ? EppState.RUNNING_FIXED : EppState.RUNNING_OPEN
    events.push({ type: EppEvent.START_SIGNAL, at: nowMs, stationIndex })
    events.push({ type: EppEvent.STATE_CHANGE, at: nowMs, state })
  }

  function endStation(nowMs, events) {
    freezeClock(nowMs)
    events.push({ type: EppEvent.STATION_END, at: nowMs, stationIndex })
    if (stationIndex >= phases.length - 1) {
      state = EppState.FINISHED
      events.push({ type: EppEvent.FINISHED, at: nowMs })
    } else {
      stationIndex += 1
      accumulatedStationMs = 0
      stopSignalFired = false
      state = EppState.IDLE
      // Gesamtzeit steht jetzt still — C.17.8: sie läuft erst mit dem
      // nächsten Startsignal wieder an.
    }
    events.push({ type: EppEvent.STATE_CHANGE, at: nowMs, state })
  }

  return {
    /** Startsignal geben (bzw. Vorlauf einleiten). */
    start(nowMs) {
      const events = []
      if (state !== EppState.IDLE) return events
      lastKnownNowMs = nowMs
      if (prepMs > 0) {
        state = EppState.PREP
        prepStartMs = nowMs
        events.push({ type: EppEvent.STATE_CHANGE, at: nowMs, state })
      } else {
        beginStation(nowMs, events)
      }
      return events
    },

    /** Offene Station beenden — der RO stoppt nach dem Holstern (C.17.8). */
    stopStation(nowMs) {
      const events = []
      if (state !== EppState.RUNNING_OPEN && state !== EppState.RUNNING_FIXED) return events
      lastKnownNowMs = nowMs
      endStation(nowMs, events)
      return events
    },

    /** Störung melden — Zeit stoppt sofort (C.17.11). */
    reportMalfunction(nowMs) {
      const events = []
      if (!isClockRunning()) return events
      lastKnownNowMs = nowMs
      freezeClock(nowMs)
      malfunctionCount += 1
      if (malfunctionCount >= 2) {
        state = EppState.EXCLUDED
        events.push({ type: EppEvent.EXCLUDED, at: nowMs, malfunctionCount })
      } else {
        state = EppState.MALFUNCTION
      }
      events.push({ type: EppEvent.STATE_CHANGE, at: nowMs, state })
      return events
    },

    /** Nach Beseitigung: Zeit läuft mit dem nächsten Schuss weiter (C.17.11). */
    resumeAfterMalfunction(nowMs) {
      const events = []
      if (state !== EppState.MALFUNCTION) return events
      lastKnownNowMs = nowMs
      const p = phase()
      segmentStartMs = nowMs
      state = p.timeLimitMs > 0 ? EppState.RUNNING_FIXED : EppState.RUNNING_OPEN
      events.push({ type: EppEvent.STATE_CHANGE, at: nowMs, state })
      return events
    },

    /** Taktgeber. Muss regelmäßig gerufen werden; Frequenz ist unerheblich. */
    tick(nowMs) {
      const events = []
      lastKnownNowMs = nowMs

      if (state === EppState.PREP && nowMs - prepStartMs >= prepMs) {
        beginStation(prepStartMs + prepMs, events)
      }

      if (state === EppState.RUNNING_FIXED) {
        const p = phase()
        const elapsed = stationElapsedMs(nowMs)

        // Zweites Signal (Stoppsignal) — beginnt bei signalAtMs, dauert
        // signalDurationMs und endet mit dem Zeitlimit. C.17.14
        if (!stopSignalFired && p.stopSignalAtMs != null && elapsed >= p.stopSignalAtMs) {
          stopSignalFired = true
          events.push({
            type: EppEvent.STOP_SIGNAL,
            at: nowMs,
            stationIndex,
            durationMs: p.stopSignalDurationMs ?? (p.timeLimitMs - p.stopSignalAtMs),
          })
        }

        if (elapsed >= p.timeLimitMs) {
          // Exakt auf das Limit einrasten, nicht auf den Tickzeitpunkt.
          const endAt = (segmentStartMs ?? nowMs) + (p.timeLimitMs - accumulatedStationMs)
          endStation(endAt, events)
        }
      }

      if (totalTimeMs != null && !totalExpiredFired && totalElapsedMs(nowMs) >= totalTimeMs) {
        totalExpiredFired = true
        events.push({ type: EppEvent.TOTAL_EXPIRED, at: nowMs })
      }
      return events
    },

    /** Station überspringen bzw. gezielt anspringen (Training). */
    goToStation(index, nowMs) {
      const events = []
      if (index < 0 || index >= phases.length) return events
      lastKnownNowMs = nowMs
      freezeClock(nowMs)
      stationIndex = index
      accumulatedStationMs = 0
      stopSignalFired = false
      state = EppState.IDLE
      events.push({ type: EppEvent.STATE_CHANGE, at: nowMs, state })
      return events
    },

    reset(nowMs = 0) {
      state = EppState.IDLE
      stationIndex = 0
      malfunctionCount = 0
      segmentStartMs = null
      accumulatedStationMs = 0
      accumulatedTotalMs = 0
      prepStartMs = null
      stopSignalFired = false
      totalExpiredFired = false
      lastKnownNowMs = nowMs
      return [{ type: EppEvent.STATE_CHANGE, at: nowMs, state }]
    },

    snapshot(nowMs = lastKnownNowMs) {
      const p = phase()
      const stElapsed = stationElapsedMs(nowMs)
      const toElapsed = totalElapsedMs(nowMs)
      return {
        state,
        stationIndex,
        phase: p,
        malfunctionCount,
        stationElapsedMs:   stElapsed,
        stationRemainingMs: p && p.timeLimitMs > 0 ? Math.max(0, p.timeLimitMs - stElapsed) : null,
        totalElapsedMs:     toElapsed,
        totalRemainingMs:   totalTimeMs == null ? null : Math.max(0, totalTimeMs - toElapsed),
        prepRemainingMs:    state === EppState.PREP ? Math.max(0, prepMs - (nowMs - prepStartMs)) : null,
        stopSignalActive:   state === EppState.RUNNING_FIXED && stopSignalFired,
        isLastStation:      stationIndex === phases.length - 1,
      }
    },
  }
}
