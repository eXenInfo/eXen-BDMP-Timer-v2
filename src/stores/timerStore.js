import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Timer-Zustände für normale Disziplinen:
//   idle | prep | running | paused | rep_pause | finished
// EPP-Zustände:
//   idle | epp_prep | epp_running_fixed | epp_running_open | epp_paused | finished

export const useTimerStore = defineStore('timer', () => {
  const state = ref('idle')
  const timeLeft = ref(0)
  const currentStageIndex = ref(0)
  const currentRepetition = ref(1)

  // EPP-spezifisch
  const eppGesamtzeit = ref(330)

  const isIdle     = computed(() => state.value === 'idle')
  const isRunning  = computed(() => ['running', 'prep', 'rep_pause',
                                     'epp_running_fixed', 'epp_running_open', 'epp_prep'].includes(state.value))
  const isPaused   = computed(() => state.value === 'paused' || state.value === 'epp_paused')
  const isFinished = computed(() => state.value === 'finished')
  const isEppState = computed(() => state.value.startsWith('epp_'))

  function setState(s)        { state.value = s }
  function setTimeLeft(t)     { timeLeft.value = t }
  function setStageIndex(i)   { currentStageIndex.value = i }
  function setRepetition(r)   { currentRepetition.value = r }
  function setEppGesamtzeit(t){ eppGesamtzeit.value = t }

  function reset() {
    state.value           = 'idle'
    timeLeft.value        = 0
    currentStageIndex.value = 0
    currentRepetition.value = 1
    eppGesamtzeit.value   = 330
  }

  return {
    state, timeLeft, currentStageIndex, currentRepetition, eppGesamtzeit,
    isIdle, isRunning, isPaused, isFinished, isEppState,
    setState, setTimeLeft, setStageIndex, setRepetition, setEppGesamtzeit, reset
  }
})
