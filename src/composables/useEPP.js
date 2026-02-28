import { ref, computed, onUnmounted } from 'vue'
import { useTimerStore } from '../stores/timerStore.js'
import { useAudio } from './useAudio.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

async function vibrate() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }) } catch (_e) { /* not available outside native */ }
}

export function useEPP() {
  const timerStore    = useTimerStore()
  const settingsStore = useSettingsStore()
  const { playSignal, playWarningSignal } = useAudio(computed(() => settingsStore.volume))

  const phases = ref([])
  let stationInterval   = null
  let gesamtzeitInterval = null

  // Zeitpunkt des letzten Gesamtzeit-Starts und zugehöriger Startwert
  let _gesamtzeitStartTime  = 0
  let _gesamtzeitStartValue = 330

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
    const startTime = Date.now()
    const totalMs   = 3000
    stationInterval = setInterval(() => {
      const elapsed   = Date.now() - startTime
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
      timerStore.setTimeLeft(remaining)
      if (elapsed >= totalMs) {
        _clearStationInterval()
        _startStation()
      }
    }, 100)
  }

  function _startStation() {
    const phase = currentPhase.value
    if (!phase) { _finish(); return }

    playSignal(phase.stoppSignalDauer ?? 1)
    vibrate()

    if (phase.zeitLimit > 0) {
      // ── Fixe Station: zählt runter, läuft automatisch ──────────────────
      timerStore.setState('epp_running_fixed')
      timerStore.setTimeLeft(phase.zeitLimit)
      _startGesamtzeitInterval()

      const startTime = Date.now()
      const totalMs   = phase.zeitLimit * 1000
      // warnAtSecondsLeft = Sekunden Restzeit bei denen das Warnsignal ertönt
      let warnPlayed  = false

      stationInterval = setInterval(() => {
        const elapsed   = Date.now() - startTime
        const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
        timerStore.setTimeLeft(remaining)

        // Warnsignal genau bei konfigurierter Restzeit (einmalig)
        if (!warnPlayed && phase.warnAtSecondsLeft && remaining <= phase.warnAtSecondsLeft && remaining > 0) {
          warnPlayed = true
          playWarningSignal()
        }

        if (elapsed >= totalMs) {
          nextStation(true)
        }
      }, 100)

    } else {
      // ── Offene Station: zählt hoch, RO stoppt manuell ──────────────────
      timerStore.setState('epp_running_open')
      timerStore.setTimeLeft(0)
      _startGesamtzeitInterval()

      const stationStart = Date.now()
      stationInterval = setInterval(() => {
        timerStore.setTimeLeft(Math.floor((Date.now() - stationStart) / 1000))
      }, 100)
    }
  }

  function _startGesamtzeitInterval() {
    if (gesamtzeitInterval) return
    _gesamtzeitStartValue = timerStore.eppGesamtzeit
    _gesamtzeitStartTime  = Date.now()

    gesamtzeitInterval = setInterval(() => {
      const elapsed   = Math.floor((Date.now() - _gesamtzeitStartTime) / 1000)
      const remaining = Math.max(0, _gesamtzeitStartValue - elapsed)
      timerStore.setEppGesamtzeit(remaining)
    }, 100)
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
      // Gesamtzeit: neue Basis ab aktuellem Wert
      timerStore.setState('epp_running_open')
      _startGesamtzeitInterval()
      const stationBase = timerStore.timeLeft
      const stationStart = Date.now()
      stationInterval = setInterval(() => {
        timerStore.setTimeLeft(stationBase + Math.floor((Date.now() - stationStart) / 1000))
      }, 100)
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

  // Cleanup bei Unmount — verhindert Geister-Intervalle bei Tab-Wechsel
  onUnmounted(() => {
    _clearStationInterval()
    _clearGesamtzeitInterval()
  })

  return {
    phases, currentPhase,
    start, nextStation, togglePause, reset, load
  }
}
