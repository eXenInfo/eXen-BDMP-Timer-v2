import { computed } from 'vue'
import { useTimerStore } from '../stores/timerStore.js'
import { useAudio } from './useAudio.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

async function vibrate() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }) } catch (_e) { /* not available outside native */ }
}

export function useTimer() {
  const timerStore = useTimerStore()
  const settingsStore = useSettingsStore()
  const { playSignal } = useAudio(computed(() => settingsStore.volume))

  let interval = null
  let stages = []
  let singleStageMode = false
  let singleStageIndex = 0

  function load(disciplineStages) {
    stages = JSON.parse(JSON.stringify(disciplineStages))
    timerStore.reset()
  }

  function start() {
    if (timerStore.state !== 'idle') return
    singleStageMode = false
    _startPrep()
  }

  /** Startet nur ein einzelnes Match — nach Abschluss zurück zu diesem Match */
  function startSingleStage(index) {
    _clearInterval()
    singleStageMode = true
    singleStageIndex = index
    timerStore.setStageIndex(index)
    timerStore.setRepetition(1)
    timerStore.setState('idle')
    _startPrep()
  }

  function _currentStage() {
    return stages[timerStore.currentStageIndex]
  }

  function _startPrep() {
    const stage = _currentStage()
    if (!stage) { _finish(); return }

    if (stage.prepTime > 0) {
      timerStore.setState('prep')
      timerStore.setTimeLeft(stage.prepTime)
      interval = setInterval(() => {
        timerStore.setTimeLeft(timerStore.timeLeft - 1)
        if (timerStore.timeLeft <= 0) {
          _clearInterval()
          _startRunning()
        }
      }, 1000)
    } else {
      _startRunning()
    }
  }

  function _startRunning() {
    const stage = _currentStage()
    timerStore.setState('running')
    timerStore.setTimeLeft(stage.duration)
    if (stage.soundAtStart) { playSignal(1); vibrate() }
    interval = setInterval(() => {
      timerStore.setTimeLeft(timerStore.timeLeft - 1)
      if (timerStore.timeLeft <= 0) {
        _clearInterval()
        _onStageComplete()
      }
    }, 1000)
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
        interval = setInterval(() => {
          timerStore.setTimeLeft(timerStore.timeLeft - 1)
          if (timerStore.timeLeft <= 0) { _clearInterval(); _startRunning() }
        }, 1000)
      } else {
        _startRunning()
      }
    } else {
      // Alle Wiederholungen done — weiter oder finish
      if (singleStageMode) {
        _finish()
      } else if (stage.pauseAfter) {
        timerStore.setState('idle')
        timerStore.setRepetition(1)
        const nextIndex = timerStore.currentStageIndex + 1
        if (nextIndex < stages.length) timerStore.setStageIndex(nextIndex)
        else _finish()
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

  function pause() {
    if (timerStore.state !== 'running') return
    _clearInterval()
    timerStore.setState('idle')
  }

  function reset() {
    _clearInterval()
    singleStageMode = false
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
    timerStore.setState('finished')
    playSignal(2)
    vibrate()
  }

  function _clearInterval() {
    clearInterval(interval)
    interval = null
  }

  const currentStage = computed(() => stages[timerStore.currentStageIndex] ?? null)
  const nextStage = computed(() => stages[timerStore.currentStageIndex + 1] ?? null)
  const totalStages = computed(() => stages.length)
  const isSingleMode = computed(() => singleStageMode)
  const progressPercent = computed(() => {
    const stage = currentStage.value
    if (!stage) return 0
    if (timerStore.state === 'running') {
      return Math.round((1 - timerStore.timeLeft / stage.duration) * 100)
    }
    return 0
  })

  return {
    currentStage, nextStage, totalStages, progressPercent, isSingleMode,
    start, pause, reset, load, startStage, startSingleStage, resetToSingleStage
  }
}
