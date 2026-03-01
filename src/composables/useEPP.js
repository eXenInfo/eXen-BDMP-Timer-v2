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
  let stationInterval    = null
  let gesamtzeitInterval = null

  let _gesamtzeitStartTime  = 0
  let _gesamtzeitStartValue = 330

  const currentPhase = computed(() => phases.value[timerStore.currentStageIndex] ?? null)

  function load(eppDiscipline) {
    phases.value = eppDiscipline.phases
    timerStore.reset()
  }

  // ── Starten ──────────────────────────────────────────────────────────────────
  // Station 0 → 3s Countdown dann Station starten
  // Station > 0 → direkt starten (kein Countdown, RO hat entschieden)
  function start() {
    if (timerStore.state !== 'idle') return
    if (timerStore.currentStageIndex === 0) {
      _startPrep()
    } else {
      _startStation()
    }
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

    // stoppSignalDauer = Anzahl Töne (1 = offen, 2 = fixe Zeit)
    playSignal(phase.stoppSignalDauer ?? 1)
    vibrate()

    if (phase.zeitLimit > 0) {
      // ── Fixe Station: läuft automatisch runter ──────────────────────────────
      timerStore.setState('epp_running_fixed')
      timerStore.setTimeLeft(phase.zeitLimit)
      _startGesamtzeitInterval()

      const startTime = Date.now()
      const totalMs   = phase.zeitLimit * 1000
      let warnPlayed  = false

      stationInterval = setInterval(() => {
        const elapsed   = Date.now() - startTime
        const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
        timerStore.setTimeLeft(remaining)

        if (!warnPlayed && phase.warnAtSecondsLeft && remaining <= phase.warnAtSecondsLeft && remaining > 0) {
          warnPlayed = true
          playWarningSignal()
        }

        if (elapsed >= totalMs) {
          _clearStationInterval()
          timerStore.setTimeLeft(0)
          _advanceToNext()             // UI sofort auf nächste Station setzen
          playSignal(2)                // Stoppsignal asynchron: 2 Töne = Zeit abgelaufen
        }
      }, 100)

    } else {
      // ── Offene Station: zählt hoch, RO stoppt manuell ───────────────────────
      timerStore.setState('epp_running_open')
      timerStore.setTimeLeft(0)
      _startGesamtzeitInterval()

      const stationStart = Date.now()
      stationInterval = setInterval(() => {
        timerStore.setTimeLeft(Math.floor((Date.now() - stationStart) / 1000))
      }, 100)
    }
  }

  // ── Gesamtzeit ──────────────────────────────────────────────────────────────
  function _startGesamtzeitInterval() {
    if (gesamtzeitInterval) return  // bereits laufend — nicht neu starten
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

  // ── Nächste Station ──────────────────────────────────────────────────────────
  // Gerufen per Button (offene Station) — setzt State auf idle, Gesamtzeit läuft weiter
  function nextStation() {
    _clearStationInterval()
    _advanceToNext()
  }

  function _advanceToNext() {
    const nextIndex = timerStore.currentStageIndex + 1
    if (nextIndex >= phases.value.length) {
      _finish()
    } else {
      timerStore.setStageIndex(nextIndex)
      timerStore.setState('idle')
      // STOPP — warten bis RO "Nächste Station starten" drückt
    }
  }

  // ── Störung / Pause (nur pausable stations) ──────────────────────────────────
  function togglePause() {
    const phase = currentPhase.value
    if (!phase?.pausable) return

    if (timerStore.state === 'epp_running_open') {
      _clearStationInterval()
      _clearGesamtzeitInterval()   // Störung: auch Gesamtzeit stoppen
      timerStore.setState('epp_paused')
    } else if (timerStore.state === 'epp_paused') {
      timerStore.setState('epp_running_open')
      _startGesamtzeitInterval()   // Gesamtzeit ab aktuellem Wert neu starten

      const stationBase  = timerStore.timeLeft
      const stationStart = Date.now()
      stationInterval = setInterval(() => {
        timerStore.setTimeLeft(stationBase + Math.floor((Date.now() - stationStart) / 1000))
      }, 100)
    }
  }

  // ── Reset / Finish ────────────────────────────────────────────────────────────
  function reset() {
    _clearStationInterval()
    _clearGesamtzeitInterval()
    timerStore.reset()
  }

  function _finish() {
    _clearStationInterval()
    _clearGesamtzeitInterval()
    timerStore.setState('finished')
    playSignal(2)   // 2 Töne = EPP vollständig beendet
    vibrate()
  }

  onUnmounted(() => {
    _clearStationInterval()
    _clearGesamtzeitInterval()
  })

  return { phases, currentPhase, start, nextStation, togglePause, reset, load }
}
