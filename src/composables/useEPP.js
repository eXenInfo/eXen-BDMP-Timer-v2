import { ref, computed } from 'vue'
import { useTimerStore } from '../stores/timerStore.js'
import { useAudio } from './useAudio.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

async function vibrate() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }) } catch (_e) { /* not available outside native */ }
}

export function useEPP() {
  const timerStore = useTimerStore()
  const settingsStore = useSettingsStore()
  const { playSignal, playWarningSignal } = useAudio(computed(() => settingsStore.volume))

  const phases = ref([])
  let stationInterval = null
  let gesamtzeitInterval = null

  // Aktuell aktive Phase
  const currentPhase = computed(() => phases.value[timerStore.currentStageIndex] ?? null)

  function load(eppDiscipline) {
    phases.value = eppDiscipline.phases
    timerStore.reset()
  }

  function start() {
    if (timerStore.state !== 'idle') return
    _startPrep()
  }

  function _startPrep() {
    timerStore.setState('epp_prep')
    timerStore.setTimeLeft(3)
    stationInterval = setInterval(() => {
      timerStore.setTimeLeft(timerStore.timeLeft - 1)
      if (timerStore.timeLeft <= 0) {
        _clearStationInterval()
        _startStation()
      }
    }, 1000)
  }

  function _startStation() {
    const phase = currentPhase.value
    if (!phase) { _finish(); return }

    playSignal(phase.stoppSignalDauer ?? 1)
    vibrate()

    if (phase.zeitLimit > 0) {
      // Fixe Zeit: zählt runter, auto-weiter
      timerStore.setState('epp_running_fixed')
      timerStore.setTimeLeft(phase.zeitLimit)
      _startGesamtzeitInterval()
      stationInterval = setInterval(() => {
        timerStore.setTimeLeft(timerStore.timeLeft - 1)
        // Warnsignal
        if (phase.warnSignal && timerStore.timeLeft === phase.zeitLimit - phase.warnSignal) {
          playWarningSignal()
        }
        if (timerStore.timeLeft <= 0) {
          nextStation(true)
        }
      }, 1000)
    } else {
      // Offene Zeit: zählt hoch, manuell weiter
      timerStore.setState('epp_running_open')
      timerStore.setTimeLeft(0)
      _startGesamtzeitInterval()
      stationInterval = setInterval(() => {
        timerStore.setTimeLeft(timerStore.timeLeft + 1)
      }, 1000)
    }
  }

  function _startGesamtzeitInterval() {
    if (gesamtzeitInterval) return
    gesamtzeitInterval = setInterval(() => {
      if (timerStore.eppGesamtzeit > 0) {
        timerStore.setEppGesamtzeit(timerStore.eppGesamtzeit - 1)
      }
    }, 1000)
  }

  function _clearStationInterval() {
    clearInterval(stationInterval)
    stationInterval = null
  }

  function _clearGesamtzeitInterval() {
    clearInterval(gesamtzeitInterval)
    gesamtzeitInterval = null
  }

  function nextStation(isAutomatic = false) {
    _clearStationInterval()
    _clearGesamtzeitInterval()
    const nextIndex = timerStore.currentStageIndex + 1
    if (nextIndex >= phases.value.length) {
      _finish()
    } else {
      timerStore.setStageIndex(nextIndex)
      timerStore.setState('idle')
      _startStation()
    }
  }

  function togglePause() {
    const phase = currentPhase.value
    if (!phase?.pausable) return

    if (timerStore.state === 'epp_running_open') {
      _clearStationInterval()
      _clearGesamtzeitInterval()
      timerStore.setState('epp_paused')
    } else if (timerStore.state === 'epp_paused') {
      timerStore.setState('epp_running_open')
      _startGesamtzeitInterval()
      stationInterval = setInterval(() => {
        timerStore.setTimeLeft(timerStore.timeLeft + 1)
      }, 1000)
    }
  }

  function reset() {
    _clearStationInterval()
    _clearGesamtzeitInterval()
    timerStore.reset()
  }

  function _finish() {
    _clearStationInterval()
    _clearGesamtzeitInterval()
    timerStore.setState('finished')
    playSignal(2)
    vibrate()
  }

  return {
    phases, currentPhase,
    start, nextStation, togglePause, reset, load
  }
}
