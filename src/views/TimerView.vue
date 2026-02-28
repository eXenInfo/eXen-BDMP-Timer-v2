<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900 overflow-y-auto">

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
        <div class="px-4">
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

        <!-- Timer-Anzeige (nur wenn läuft oder fertig) -->
        <div v-if="timerStore.state !== 'idle'" class="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <TimerDisplay
            :seconds="timerStore.timeLeft"
            :state="timerStore.state"
            :progress="timer.progressPercent.value"
            :repetition="timerStore.currentRepetition"
            :total-reps="timer.currentStage.value?.repetitions ?? 1"
            :large="true"
          />

          <!-- Aktuelle Phase Info (erste Zeile des Namens) -->
          <div v-if="timer.currentStage.value" class="text-center px-4">
            <div class="text-gray-200 font-medium leading-snug">
              {{ firstLine(timer.currentStage.value.name) }}
            </div>
            <div v-if="!isSingleMode && timer.nextStage.value" class="text-xs text-gray-500 mt-1">
              Nächstes: {{ firstLine(timer.nextStage.value.name) }}
            </div>
          </div>
        </div>

        <!-- Steuerung -->
        <div class="px-4 py-4">
          <!-- Start-Button mit Match-Anzeige (im Idle-Modus) -->
          <div v-if="timerStore.state === 'idle'" class="flex flex-col gap-3 w-full max-w-sm mx-auto">
            <!-- RO-Beschreibung für gewähltes Match -->
            <div class="bg-gray-800 rounded-xl px-4 py-4">
              <div class="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-2">
                {{ disciplineStore.activeDisciplineName }}
              </div>

              <div v-if="selectedStage" class="space-y-0.5 mb-3">
                <div
                  v-for="(line, i) in stageNameLines(selectedStage)"
                  :key="i"
                  :class="i === 0 ? 'text-white font-semibold text-sm leading-snug' : 'text-gray-300 text-xs leading-snug'"
                >{{ line }}</div>
              </div>
              <div v-else class="text-gray-500 text-sm mb-3">–</div>

              <div v-if="selectedStage" class="border-t border-gray-700 pt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span
                  v-for="item in stageInfoItems(selectedStage)"
                  :key="item"
                  class="text-xs text-gray-400"
                >{{ item }}</span>
              </div>
            </div>

            <!-- Start Button -->
            <button
              @click="handleStart"
              class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-green-600 active:bg-green-700 transition-all active:scale-95 shadow-md"
            >
              Match starten
            </button>

            <!-- Zurücksetzen (nur wenn nicht am Anfang) -->
            <button
              v-if="selectedMatchIndex !== 0"
              @click="selectedMatchIndex = 0"
              class="w-full py-3 px-6 rounded-xl font-medium text-sm text-gray-400 bg-gray-800 active:bg-gray-700 transition-colors"
            >
              Zum ersten Match
            </button>
          </div>

          <!-- Laufender Timer: Unterbrechen/Reset -->
          <div v-else class="flex flex-col gap-3 w-full max-w-sm mx-auto">
            <button
              v-if="timerStore.state === 'running'"
              @click="timer.pause()"
              class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-yellow-600 active:bg-yellow-700 transition-all active:scale-95 shadow-md"
            >
              Unterbrechen
            </button>

            <button
              v-if="timerStore.state === 'finished'"
              @click="handleRestart"
              class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-green-600 active:bg-green-700 transition-all active:scale-95 shadow-md"
            >
              Nochmal
            </button>

            <button
              @click="handleReset"
              class="w-full py-3 px-6 rounded-xl font-medium text-sm text-gray-400 bg-gray-800 active:bg-gray-700 transition-colors"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        <!-- Matchliste mit Auswahl -->
        <div class="px-4 pb-4">
          <PhaseProgress
            :stages="discipline"
            :current-index="timerStore.currentStageIndex"
            :selected-index="selectedMatchIndex"
            :state="timerStore.state"
            :is-epp="false"
            @select-stage="selectMatch"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
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

// Ausgewähltes Match (Index) — Standard: 0 (erstes Match)
const selectedMatchIndex = ref(0)

const discipline = computed(() => disciplineStore.activeDiscipline)
const isEpp = computed(() => disciplineStore.isEppActive)
const isSingleMode = computed(() => timer.isSingleMode.value)

const selectedStage = computed(() => {
  const d = discipline.value
  if (!d || d.isEpp) return null
  return d[selectedMatchIndex.value] ?? null
})

function pad(n) { return String(n).padStart(2, '0') }
function fmtSeconds(s) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${pad(sec)} min` : `${sec}s`
}

function firstLine(name) {
  return (name ?? '').split('\n')[0]
}

function stageNameLines(stage) {
  return (stage?.name ?? '').split('\n').map(l => l.trim()).filter(l => l)
}

function stageInfoItems(stage) {
  if (!stage) return []
  const items = []
  if (stage.prepTime > 0) items.push(`Vorbereitung: ${stage.prepTime}s`)
  items.push(`Zeitlimit: ${fmtSeconds(stage.duration)}`)
  if (stage.repetitions > 1) {
    items.push(`${stage.repetitions}x Wiederholung`)
    if (stage.pauseDuration > 0) items.push(`Pause: ${stage.pauseDuration}s`)
  }
  const signals = []
  if (stage.soundAtStart) signals.push('Start')
  if (stage.soundAtEnd) signals.push('Ende')
  if (signals.length) items.push(`Signal: ${signals.join(' & ')}`)
  if (stage.pauseAfter) items.push('RO startet weiter')
  return items
}

// Disziplin laden wenn sie sich ändert
watch(() => disciplineStore.activeDiscipline, (d) => {
  if (!d) return
  selectedMatchIndex.value = 0
  timerStore.reset()
  if (d.isEpp) {
    eppComposable.load(d)
  } else {
    timer.load(d)
  }
}, { immediate: true })

function selectMatch(index) {
  if (timerStore.state !== 'idle') return
  selectedMatchIndex.value = index
}

function handleStart() {
  ensureReady()
  timer.startSingleStage(selectedMatchIndex.value)
}

function handleRestart() {
  // Nochmal dasselbe Match
  timer.resetToSingleStage()
}

function handleReset() {
  timer.reset()
  timerStore.setStageIndex(selectedMatchIndex.value)
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
