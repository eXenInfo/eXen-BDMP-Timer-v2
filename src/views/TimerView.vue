<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900 overflow-y-auto">

    <!-- Kein Disziplin gewählt -->
    <div v-if="!discipline" class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div class="text-6xl">⏱️</div>
      <h2 class="text-xl font-bold text-white">{{ t('timer.noDiscipline') }}</h2>
      <p class="text-gray-400 text-sm">{{ t('timer.noDisciplineHint') }}</p>
      <RouterLink to="/disciplines"
        class="mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
      >
        {{ t('timer.goToDisciplines') }}
      </RouterLink>
    </div>

    <!-- Timer-Ansicht -->
    <template v-else>

      <!-- Header: Disziplinname -->
      <div class="px-4 pt-6 pb-2">
        <div class="text-xs uppercase tracking-widest text-gray-500 mb-1">{{ t('timer.activeDiscipline') }}</div>
        <h1 class="text-lg font-bold text-amber-400 leading-tight">{{ disciplineStore.activeDisciplineName }}</h1>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- EPP-Ansicht                                              -->
      <!-- ══════════════════════════════════════════════════════════ -->
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
            :is-first-station="timerStore.currentStageIndex === 0"
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

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- Normale Disziplin                                        -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <template v-else>

        <!-- ── RO-Pause zwischen Matches (Alle-Matches-Modus) ───────── -->
        <div v-if="timer.waitingForContinue.value" class="px-4">
          <div class="bg-gray-800 rounded-xl px-4 py-5 mb-3 border border-amber-500/40">
            <!-- Banner -->
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">⏸️</span>
              <span class="text-amber-400 font-bold text-sm uppercase tracking-wide">
                {{ t('timer.roWaiting') }}
              </span>
            </div>
            <!-- Nächstes Match Preview -->
            <div v-if="timer.currentStage.value" class="space-y-0.5 mb-4">
              <div
                v-for="(line, i) in stageNameLines(timer.currentStage.value)"
                :key="i"
                :class="i === 0 ? 'text-white font-semibold text-sm leading-snug' : 'text-gray-300 text-xs leading-snug'"
              >{{ line }}</div>
            </div>
            <!-- Buttons -->
            <div class="flex gap-2">
              <button
                @click="handleContinueNext"
                class="flex-1 py-3 px-4 rounded-xl font-bold text-base text-white bg-green-600 active:bg-green-700 transition-all active:scale-95 shadow-md"
              >
                {{ t('timer.continueNext') }}
              </button>
              <button
                @click="handleStopAll"
                class="py-3 px-4 rounded-xl font-medium text-sm text-gray-400 bg-gray-700 active:bg-gray-600 transition-colors"
              >
                {{ t('timer.abortAll') }}
              </button>
            </div>
          </div>

          <!-- Matchliste (auch im Warte-Modus sichtbar) -->
          <PhaseProgress
            :stages="discipline"
            :current-index="timerStore.currentStageIndex"
            :selected-index="timerStore.currentStageIndex"
            :state="timerStore.state"
            :is-epp="false"
          />
        </div>

        <!-- ── Timer läuft oder pausiert ────────────────────────────── -->
        <template v-else-if="timerStore.state !== 'idle'">

          <!-- Timer-Anzeige (auch bei paused sichtbar!) -->
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
            <div v-if="timer.currentStage.value" class="text-center px-4">
              <div class="text-gray-200 font-medium leading-snug">
                {{ firstLine(timer.currentStage.value.name) }}
              </div>
              <div v-if="!isSingleMode && timer.nextStage.value" class="text-xs text-gray-500 mt-1">
                {{ t('timer.nextStage', { name: firstLine(timer.nextStage.value.name) }) }}
              </div>
            </div>
          </div>

          <!-- Steuerung: Pause / Resume / Nochmal / Reset -->
          <div class="px-4 py-4">
            <div class="flex flex-col gap-3 w-full max-w-sm mx-auto">
              <!-- Resume (pausiert) -->
              <button
                v-if="timerStore.state === 'paused'"
                @click="timer.resume()"
                class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-green-600 active:bg-green-700 transition-all active:scale-95 shadow-md"
              >
                {{ t('timer.resume') }}
              </button>

              <!-- Unterbrechen (läuft) -->
              <button
                v-if="timerStore.state === 'running'"
                @click="timer.pause()"
                class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-yellow-600 active:bg-yellow-700 transition-all active:scale-95 shadow-md"
              >
                {{ t('timer.pause_btn') }}
              </button>

              <!-- Nochmal (fertig) -->
              <button
                v-if="timerStore.state === 'finished'"
                @click="handleRestart"
                class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-green-600 active:bg-green-700 transition-all active:scale-95 shadow-md"
              >
                {{ t('timer.again') }}
              </button>

              <!-- Zurücksetzen -->
              <button
                @click="handleReset"
                class="w-full py-3 px-6 rounded-xl font-medium text-sm text-gray-400 bg-gray-800 active:bg-gray-700 transition-colors"
              >
                {{ t('timer.reset') }}
              </button>
            </div>
          </div>
        </template>

        <!-- ── Idle: Match auswählen & starten ───────────────────────── -->
        <template v-else>
          <div class="px-4 py-2">
            <div class="flex flex-col gap-3 w-full max-w-sm mx-auto">

              <!-- Match-Info-Box -->
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

              <!-- Alle Matches starten (primär) -->
              <button
                @click="handleStartAll"
                class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-green-600 active:bg-green-700 transition-all active:scale-95 shadow-md"
              >
                {{ t('timer.startAll') }}
              </button>

              <!-- Nur dieses Match (sekundär) -->
              <button
                @click="handleStart"
                class="w-full py-3 px-6 rounded-xl font-medium text-base text-gray-200 bg-gray-700 active:bg-gray-600 transition-colors"
              >
                {{ t('timer.matchStart') }}
              </button>

              <!-- Zum ersten Match (nur sichtbar wenn nicht erstes Match gewählt) -->
              <button
                v-if="selectedMatchIndex !== 0"
                @click="selectedMatchIndex = 0"
                class="w-full py-2.5 px-6 rounded-xl font-medium text-sm text-gray-500 bg-gray-800 active:bg-gray-700 transition-colors"
              >
                {{ t('timer.firstMatch') }}
              </button>
            </div>
          </div>
        </template>

        <!-- Matchliste (immer sichtbar, außer im Warte-Modus — der hat eigene) -->
        <div v-if="!timer.waitingForContinue.value" class="px-4 pb-4 mt-2">
          <PhaseProgress
            :stages="discipline"
            :current-index="timerStore.currentStageIndex"
            :selected-index="timerStore.state === 'idle' ? selectedMatchIndex : timerStore.currentStageIndex"
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
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { usePhaseText } from '../composables/usePhaseText.js'

const { t } = useI18n()
const { phaseText } = usePhaseText()
const disciplineStore = useDisciplineStore()
const timerStore      = useTimerStore()
const settingsStore   = useSettingsStore()

const timer        = useTimer()
const eppComposable = useEPP()
const { ensureReady } = useAudio(computed(() => settingsStore.volume))

// ── Wake Lock ─────────────────────────────────────────────────────────────────
let wakeLock = null

async function requestWakeLock() {
  if (!('wakeLock' in navigator) || wakeLock) return
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => { wakeLock = null })
  } catch (_) { /* nicht verfügbar oder abgelehnt */ }
}

function releaseWakeLock() {
  if (wakeLock) { wakeLock.release(); wakeLock = null }
}

// Wake Lock aktivieren wenn Timer läuft, freigeben wenn idle/finished/paused
const ACTIVE_STATES = ['running', 'prep', 'rep_pause',
                       'epp_running_fixed', 'epp_running_open', 'epp_prep']
watch(() => timerStore.state, (newState) => {
  if (ACTIVE_STATES.includes(newState)) {
    requestWakeLock()
  } else {
    releaseWakeLock()
  }
})

onUnmounted(() => releaseWakeLock())

// ── Match-Auswahl ─────────────────────────────────────────────────────────────
const selectedMatchIndex = ref(0)

const discipline = computed(() => disciplineStore.activeDiscipline)
const isEpp      = computed(() => disciplineStore.isEppActive)
const isSingleMode = computed(() => timer.isSingleMode.value)

const selectedStage = computed(() => {
  const d = discipline.value
  if (!d || d.isEpp) return null
  return d[selectedMatchIndex.value] ?? null
})

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0') }
function fmtSeconds(s) {
  if (!s) return ''
  const m   = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${pad(sec)} min` : `${sec}s`
}

function firstLine(name) {
  return phaseText(name ?? '').split('\n')[0]
}

function stageNameLines(stage) {
  return phaseText(stage?.name ?? '').split('\n').map(l => l.trim()).filter(l => l)
}

function stageInfoItems(stage) {
  if (!stage) return []
  const items = []
  if (stage.prepTime > 0)   items.push(t('timer.prepTime', { sec: stage.prepTime }))
  items.push(t('timer.timeLimit', { time: fmtSeconds(stage.duration) }))
  if (stage.repetitions > 1) {
    items.push(t('timer.repetition', { n: stage.repetitions }))
    if (stage.pauseDuration > 0) items.push(t('timer.pause', { sec: stage.pauseDuration }))
  }
  const signals = []
  if (stage.soundAtStart) signals.push(t('timer.signalStart'))
  if (stage.soundAtEnd)   signals.push(t('timer.signalEnd'))
  if (signals.length)     items.push(t('timer.signal', { signals: signals.join(' & ') }))
  if (stage.pauseAfter)   items.push(t('timer.roStart'))
  return items
}

// ── Disziplin laden wenn sie sich ändert ─────────────────────────────────────
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

// Im "Alle Matches"-Modus: selectedMatchIndex mit aktuellem Stage synchronisieren
watch(() => timer.waitingForContinue.value, (val) => {
  if (val) selectedMatchIndex.value = timerStore.currentStageIndex
})

// ── Handler ───────────────────────────────────────────────────────────────────
function selectMatch(index) {
  if (timerStore.state !== 'idle') return
  selectedMatchIndex.value = index
}

/** Einzelnes Match starten */
function handleStart() {
  ensureReady()
  timer.startSingleStage(selectedMatchIndex.value)
}

/** Alle Matches ab dem gewählten starten */
function handleStartAll() {
  ensureReady()
  timer.startAll(selectedMatchIndex.value)
}

/** Nächstes Match im "Alle Matches"-Modus */
function handleContinueNext() {
  ensureReady()
  timer.continueToNextMatch()
}

/** Durchlauf abbrechen */
function handleStopAll() {
  timer.stopAllMatches()
  selectedMatchIndex.value = 0
}

/** Nochmal dasselbe Match (nach Finish im Single-Modus) */
function handleRestart() {
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
