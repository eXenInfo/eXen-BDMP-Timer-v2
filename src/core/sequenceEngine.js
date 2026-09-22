/**
 * Zeitkern für Standard-Disziplinen (alles außer EPP).
 *
 * Gleiches Prinzip wie eppEngine: keine eigene Zeitquelle, kein Framework.
 * Eine Phase besteht aus Vorlauf, Übungsdauer, Wiederholungen und Pausen
 * dazwischen; `waitAfter` hält den Ablauf danach bewusst an, bis der RO
 * weitergibt.
 */

export const SeqState = {
  IDLE:         'idle',
  PREP:         'prep',
  RUNNING:      'running',
  REP_PAUSE:    'repPause',
  WAITING_NEXT: 'waitingNext',   // nach waitAfter: wartet auf den RO
  PAUSED:       'paused',
  FINISHED:     'finished',
}

export const SeqEvent = {
  START_SIGNAL: 'startSignal',
  END_SIGNAL:   'endSignal',
  PHASE_END:    'phaseEnd',
  FINISHED:     'finished',
  STATE_CHANGE: 'stateChange',
}

/** Normalisiert eine Phase; alle Zeiten in Millisekunden. */
export function normalizePhase(p) {
  return {
    name:         p.name ?? 'Unbenannte Phase',
    prepMs:       p.prepMs ?? (p.prepTime ?? 0) * 1000,
    durationMs:   p.durationMs ?? (p.duration ?? 0) * 1000,
    repetitions:  Math.max(1, p.repetitions ?? 1),
    repPauseMs:   p.repPauseMs ?? (p.pauseDuration ?? 0) * 1000,
    soundAtStart: p.soundAtStart ?? true,
    soundAtEnd:   p.soundAtEnd ?? true,
    waitAfter:    p.waitAfter ?? p.pauseAfter ?? false,
  }
}

export function createSequenceEngine({ phases, loop = false } = {}) {
  const list = (phases ?? []).map(normalizePhase)
  if (list.length === 0) throw new Error('sequenceEngine: keine Phasen')

  let state = SeqState.IDLE
  let index = 0
  let repetition = 1
  let segmentStartMs = null
  let accumulatedMs = 0
  let targetMs = 0
  let stateBeforePause = null
  let lastNowMs = 0

  const phase = () => list[index]
  const elapsed = (nowMs) =>
    accumulatedMs + (segmentStartMs === null ? 0 : Math.max(0, nowMs - segmentStartMs))

  function enter(newState, target, nowMs, events) {
    state = newState
    targetMs = target
    accumulatedMs = 0
    segmentStartMs = nowMs
    events.push({ type: SeqEvent.STATE_CHANGE, at: nowMs, state })
  }

  function beginRunning(nowMs, events) {
    const p = phase()
    if (p.soundAtStart) events.push({ type: SeqEvent.START_SIGNAL, at: nowMs, index, repetition })
    enter(SeqState.RUNNING, p.durationMs, nowMs, events)
  }

  function beginPhase(nowMs, events) {
    const p = phase()
    repetition = 1
    if (p.prepMs > 0) enter(SeqState.PREP, p.prepMs, nowMs, events)
    else beginRunning(nowMs, events)
  }

  function advancePhase(nowMs, events) {
    const p = phase()
    events.push({ type: SeqEvent.PHASE_END, at: nowMs, index })
    const isLast = index >= list.length - 1
    if (isLast && !loop) {
      state = SeqState.FINISHED
      segmentStartMs = null
      events.push({ type: SeqEvent.FINISHED, at: nowMs })
      events.push({ type: SeqEvent.STATE_CHANGE, at: nowMs, state })
      return
    }
    index = isLast ? 0 : index + 1
    if (p.waitAfter) {
      state = SeqState.WAITING_NEXT
      segmentStartMs = null
      // Anders als bisher gibt es hier IMMER einen definierten Wartezustand,
      // aus dem `continueNext` wieder herausführt — keine Sackgasse.
      events.push({ type: SeqEvent.STATE_CHANGE, at: nowMs, state })
    } else {
      beginPhase(nowMs, events)
    }
  }

  function completeRunning(nowMs, events) {
    const p = phase()
    if (p.soundAtEnd) events.push({ type: SeqEvent.END_SIGNAL, at: nowMs, index, repetition })
    if (repetition < p.repetitions) {
      repetition += 1
      if (p.repPauseMs > 0) enter(SeqState.REP_PAUSE, p.repPauseMs, nowMs, events)
      else beginRunning(nowMs, events)
    } else {
      advancePhase(nowMs, events)
    }
  }

  return {
    start(nowMs) {
      const events = []
      if (state !== SeqState.IDLE) return events
      lastNowMs = nowMs
      beginPhase(nowMs, events)
      return events
    },

    continueNext(nowMs) {
      const events = []
      if (state !== SeqState.WAITING_NEXT) return events
      lastNowMs = nowMs
      beginPhase(nowMs, events)
      return events
    },

    pause(nowMs) {
      const events = []
      if (![SeqState.PREP, SeqState.RUNNING, SeqState.REP_PAUSE].includes(state)) return events
      lastNowMs = nowMs
      accumulatedMs = elapsed(nowMs)
      segmentStartMs = null
      stateBeforePause = state
      state = SeqState.PAUSED
      events.push({ type: SeqEvent.STATE_CHANGE, at: nowMs, state })
      return events
    },

    resume(nowMs) {
      const events = []
      if (state !== SeqState.PAUSED) return events
      lastNowMs = nowMs
      // Weiter mit der exakten Restzeit, nicht mit der aufgerundeten Anzeige.
      segmentStartMs = nowMs
      state = stateBeforePause
      events.push({ type: SeqEvent.STATE_CHANGE, at: nowMs, state })
      return events
    },

    tick(nowMs) {
      const events = []
      lastNowMs = nowMs
      if (segmentStartMs === null) return events
      if (elapsed(nowMs) < targetMs) return events

      const endAt = segmentStartMs + (targetMs - accumulatedMs)
      if (state === SeqState.PREP)           beginRunning(endAt, events)
      else if (state === SeqState.RUNNING)   completeRunning(endAt, events)
      else if (state === SeqState.REP_PAUSE) beginRunning(endAt, events)
      return events
    },

    goToPhase(i, nowMs) {
      const events = []
      if (i < 0 || i >= list.length) return events
      lastNowMs = nowMs
      index = i
      repetition = 1
      segmentStartMs = null
      accumulatedMs = 0
      state = SeqState.IDLE
      events.push({ type: SeqEvent.STATE_CHANGE, at: nowMs, state })
      return events
    },

    reset(nowMs = 0) {
      state = SeqState.IDLE
      index = 0
      repetition = 1
      segmentStartMs = null
      accumulatedMs = 0
      targetMs = 0
      lastNowMs = nowMs
      return [{ type: SeqEvent.STATE_CHANGE, at: nowMs, state }]
    },

    snapshot(nowMs = lastNowMs) {
      const p = phase()
      const e = elapsed(nowMs)
      return {
        state, index, repetition, phase: p,
        totalPhases: list.length,
        elapsedMs: e,
        remainingMs: segmentStartMs === null && state !== SeqState.PAUSED
          ? null : Math.max(0, targetMs - e),
        isLastPhase: index === list.length - 1,
      }
    },
  }
}
