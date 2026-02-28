import { ref, computed, onUnmounted } from 'vue'
import { useTimerStore } from '../stores/timerStore.js'
import { useAudio } from './useAudio.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

async function vibrate() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }) } catch (_e) { /* not available outside native */ }
}

export function useTimer() {
  const timerStore    = useTimerStore()
  const settingsStore = useSettingsStore()
  const { playSignal } = useAudio(computed(() => settingsStore.volume))

  let interval         = null
  let stages           = []
  let singleStageMode  = false
  let singleStageIndex = 0

  // "Alle Matches"-Modus: läuft alle Stages sequenziell durch
  const allMatchesMode     = ref(false)
  // true wenn nach pauseAfter auf den nächsten Match gewartet wird
  const waitingForContinue = ref(false)

  // ── Laden ──────────────────────────────────────────────────────────────────
  function load(disciplineStages) {
    stages = JSON.parse(JSON.stringify(disciplineStages))
    allMatchesMode.value     = false
    waitingForContinue.value = false
    timerStore.reset()
  }

  // ── Starten ────────────────────────────────────────────────────────────────
  /** Startet alle Stages ab fromIndex sequenziell */
  function startAll(fromIndex = 0) {
    _clearInterval()
    singleStageMode          = false
    allMatchesMode.value     = true
    waitingForContinue.value = false
    timerStore.setStageIndex(fromIndex)
    timerStore.setRepetition(1)
    timerStore.setState('idle')
    _startPrep()
  }

  /** Startet nur ein einzelnes Match — nach Abschluss zurück zu diesem Match */
  function startSingleStage(index) {
    _clearInterval()
    singleStageMode          = true
    singleStageIndex         = index
    allMatchesMode.value     = false
    waitingForContinue.value = false
    timerStore.setStageIndex(index)
    timerStore.setRepetition(1)
    timerStore.setState('idle')
    _startPrep()
  }

  /** Im "Alle Matches"-Modus: nächstes Match starten (nach pauseAfter-Wartepause) */
  function continueToNextMatch() {
    waitingForContinue.value = false
    _startPrep()
  }

  /** "Alle Matches"-Modus abbrechen */
  function stopAllMatches() {
    _clearInterval()
    allMatchesMode.value     = false
    waitingForContinue.value = false
    timerStore.reset()
  }

  // ── Interne Timer-Logik ────────────────────────────────────────────────────
  function _currentStage() {
    return stages[timerStore.currentStageIndex]
  }

  function _startPrep() {
    const stage = _currentStage()
    if (!stage) { _finish(); return }

    if (stage.prepTime > 0) {
      timerStore.setState('prep')
      timerStore.setTimeLeft(stage.prepTime)
      const startTime = Date.now()
      const totalMs   = stage.prepTime * 1000
      interval = setInterval(() => {
        const elapsed   = Date.now() - startTime
        const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
        timerStore.setTimeLeft(remaining)
        if (elapsed >= totalMs) { _clearInterval(); _startRunning() }
      }, 100)
    } else {
      _startRunning()
    }
  }

  function _startRunning() {
    const stage = _currentStage()
    timerStore.setState('running')
    timerStore.setTimeLeft(stage.duration)
    if (stage.soundAtStart) { playSignal(1); vibrate() }

    const startTime = Date.now()
    const totalMs   = stage.duration * 1000
    interval = setInterval(() => {
      const elapsed   = Date.now() - startTime
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
      timerStore.setTimeLeft(remaining)
      if (elapsed >= totalMs) { _clearInterval(); _onStageComplete() }
    }, 100)
  }

  function _resumeRunning(remainingSeconds) {
    timerStore.setState('running')
    const startTime  = Date.now()
    const totalMs    = remainingSeconds * 1000
    interval = setInterval(() => {
      const elapsed   = Date.now() - startTime
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
      timerStore.setTimeLeft(remaining)
      if (elapsed >= totalMs) { _clearInterval(); _onStageComplete() }
    }, 100)
  }

  function _onStageComplete() {
    const stage = _currentStage()
    if (stage.soundAtEnd) { playSignal(1); vibrate() }

    const hasMoreReps = timerStore.currentRepetition < stage.repetitions
    if (hasMoreReps) {
      timerStore.setRepetition(timerStore.currentRepetition + 1)
      if (stage.pauseDuration > 0) {
        timerStore.setState('rep_pause')
        timerStore.setTimeLeft(stage.pauseDuration)
        const startTime = Date.now()
        const totalMs   = stage.pauseDuration * 1000
        interval = setInterval(() => {
          const elapsed   = Date.now() - startTime
          const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
          timerStore.setTimeLeft(remaining)
          if (elapsed >= totalMs) { _clearInterval(); _startRunning() }
        }, 100)
      } else {
        _startRunning()
      }
    } else {
      // Alle Wiederholungen fertig
      if (singleStageMode) {
        _finish()
      } else if (stage.pauseAfter) {
        timerStore.setRepetition(1)
        const nextIndex = timerStore.currentStageIndex + 1
        if (nextIndex < stages.length) {
          timerStore.setStageIndex(nextIndex)
          timerStore.setState('idle')
          if (allMatchesMode.value) {
            // Im "Alle Matches"-Modus: warte auf RO-Bestätigung
            waitingForContinue.value = true
          }
        } else {
          _finish()
        }
      } else {
        _advanceStage()
      }
    }
  }

  function _advanceStage() {
    timerStore.setRepetition(1)
    const nextIndex = timerStore.currentStageIndex + 1
    if (nextIndex >= stages.length) {
      _finish()
    } else {
      timerStore.setStageIndex(nextIndex)
      _startPrep()
    }
  }

  // ── Pause / Resume ─────────────────────────────────────────────────────────
  function pause() {
    if (timerStore.state !== 'running') return
    _clearInterval()
    timerStore.setState('paused')   // Echter Pause-State (nicht 'idle')
  }

  function resume() {
    if (timerStore.state !== 'paused') return
    _resumeRunning(timerStore.timeLeft)
  }

  // ── Reset / Fertig ─────────────────────────────────────────────────────────
  function reset() {
    _clearInterval()
    singleStageMode          = false
    allMatchesMode.value     = false
    waitingForContinue.value = false
    timerStore.reset()
  }

  /** Nach Finish im Einzelmodus zurück zum trainierten Match */
  function resetToSingleStage() {
    _clearInterval()
    timerStore.setStageIndex(singleStageIndex)
    timerStore.setRepetition(1)
    timerStore.setState('idle')
    timerStore.setTimeLeft(0)
  }

  /** Normales startStage (für Komplett-Modus ab einer Phase) */
  function startStage(index) {
    _clearInterval()
    singleStageMode = false
    timerStore.setStageIndex(index)
    timerStore.setRepetition(1)
    timerStore.setState('idle')
    _startPrep()
  }

  function _finish() {
    allMatchesMode.value     = false
    waitingForContinue.value = false
    timerStore.setState('finished')
    playSignal(2)
    vibrate()
  }

  function _clearInterval() {
    clearInterval(interval)
    interval = null
  }

  // Cleanup bei Component-Unmount → kein Geister-Interval
  onUnmounted(() => _clearInterval())

  // ── Computed ───────────────────────────────────────────────────────────────
  const currentStage   = computed(() => stages[timerStore.currentStageIndex] ?? null)
  const nextStage      = computed(() => stages[timerStore.currentStageIndex + 1] ?? null)
  const totalStages    = computed(() => stages.length)
  const isSingleMode   = computed(() => singleStageMode)
  const progressPercent = computed(() => {
    const stage = currentStage.value
    if (!stage || !stage.duration) return 0
    if (timerStore.state === 'running' || timerStore.state === 'paused') {
      return Math.round((1 - timerStore.timeLeft / stage.duration) * 100)
    }
    return 0
  })

  return {
    currentStage, nextStage, totalStages, progressPercent, isSingleMode,
    allMatchesMode, waitingForContinue,
    load, startSingleStage, startAll, continueToNextMatch, stopAllMatches,
    pause, resume, reset, startStage, resetToSingleStage
  }
}
