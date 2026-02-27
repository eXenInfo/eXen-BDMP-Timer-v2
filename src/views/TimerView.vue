<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900">

    <!-- Kein Disziplin gewählt -->
    <div v-if="!discipline" class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div class="text-6xl">⏱️</div>
      <h2 class="text-xl font-bold text-white">Keine Disziplin gewählt</h2>
      <p class="text-gray-400 text-sm">Wähle zunächst eine Disziplin unter "Disziplinen".</p>
      <RouterLink to="/disciplines"
        class="mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
      >
        Zur Disziplinauswahl
      </RouterLink>
    </div>

    <!-- Timer-Ansicht -->
    <template v-else>

      <!-- Header: Disziplinname -->
      <div class="px-4 pt-6 pb-2">
        <div class="text-xs uppercase tracking-widest text-gray-500 mb-1">Aktive Disziplin</div>
        <h1 class="text-lg font-bold text-amber-400 leading-tight">{{ disciplineStore.activeDisciplineName }}</h1>
      </div>

      <!-- EPP-Ansicht -->
      <template v-if="isEpp">
        <div class="px-4 flex-1">
          <EPPTimer
            :phase="eppComposable.currentPhase.value"
            :current-index="timerStore.currentStageIndex"
            :total-stations="eppComposable.phases.value.length"
            :time-left="timerStore.timeLeft"
            :epp-gesamtzeit="timerStore.eppGesamtzeit"
            :state="timerStore.state"
          />
        </div>

        <div class="px-4 py-4 space-y-3">
          <TimerControls
            :state="timerStore.state"
            :is-epp="true"
            :is-pausable="eppComposable.currentPhase.value?.pausable"
            :is-last-station="timerStore.currentStageIndex >= eppComposable.phases.value.length - 1"
            @start="handleEppStart"
            @epp-next="eppComposable.nextStation()"
            @epp-pause="eppComposable.togglePause()"
            @reset="handleEppReset"
          />
        </div>

        <!-- Stationsliste EPP -->
        <div class="px-4 pb-4">
          <PhaseProgress
            :stages="eppComposable.phases.value"
            :current-index="timerStore.currentStageIndex"
            :state="timerStore.state"
            :is-epp="true"
          />
        </div>
      </template>

      <!-- Normale Disziplin -->
      <template v-else>
        <!-- Timer-Anzeige -->
        <div class="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <TimerDisplay
            :seconds="timerStore.timeLeft"
            :state="timerStore.state"
            :progress="timer.progressPercent.value"
            :repetition="timerStore.currentRepetition"
            :total-reps="timer.currentStage.value?.repetitions ?? 1"
            :large="true"
          />

          <!-- Aktuelle Phase Info -->
          <div v-if="timer.currentStage.value" class="text-center">
            <div class="text-gray-200 font-medium">{{ timer.currentStage.value.name }}</div>
            <div v-if="timer.nextStage.value" class="text-xs text-gray-500 mt-1">
              Nächste: {{ timer.nextStage.value.name }}
            </div>
          </div>
        </div>

        <!-- Steuerung -->
        <div class="px-4 py-4">
          <TimerControls
            :state="timerStore.state"
            :is-epp="false"
            @start="handleStart"
            @pause="timer.pause()"
            @reset="timer.reset()"
          />
        </div>

        <!-- Phasenliste -->
        <div class="px-4 pb-4">
          <PhaseProgress
            :stages="discipline"
            :current-index="timerStore.currentStageIndex"
            :state="timerStore.state"
            :is-epp="false"
            @start-stage="timer.startStage($event)"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useDisciplineStore } from '../stores/disciplineStore.js'
import { useTimerStore } from '../stores/timerStore.js'
import { useTimer } from '../composables/useTimer.js'
import { useEPP } from '../composables/useEPP.js'
import { useAudio } from '../composables/useAudio.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import TimerDisplay from '../components/timer/TimerDisplay.vue'
import TimerControls from '../components/timer/TimerControls.vue'
import PhaseProgress from '../components/timer/PhaseProgress.vue'
import EPPTimer from '../components/timer/EPPTimer.vue'

const disciplineStore = useDisciplineStore()
const timerStore = useTimerStore()
const settingsStore = useSettingsStore()

const timer = useTimer()
const eppComposable = useEPP()
const { ensureReady } = useAudio(computed(() => settingsStore.volume))

const discipline = computed(() => {
  const d = disciplineStore.activeDiscipline
  if (!d || d.isEpp) return d
  return d
})
const isEpp = computed(() => disciplineStore.isEppActive)

// Disziplin laden wenn sie sich ändert
watch(() => disciplineStore.activeDiscipline, (d) => {
  if (!d) return
  timerStore.reset()
  if (d.isEpp) {
    eppComposable.load(d)
  } else {
    timer.load(d)
  }
}, { immediate: true })

function handleStart() {
  ensureReady()
  if (timerStore.state === 'finished') {
    timerStore.reset()
    timer.load(disciplineStore.activeDiscipline)
  }
  timer.start()
}

function handleEppStart() {
  ensureReady()
  if (timerStore.state === 'finished') {
    eppComposable.reset()
    eppComposable.load(disciplineStore.activeDiscipline)
  }
  eppComposable.start()
}

function handleEppReset() {
  eppComposable.reset()
  eppComposable.load(disciplineStore.activeDiscipline)
}
</script>
