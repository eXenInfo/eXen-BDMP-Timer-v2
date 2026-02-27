<template>
  <div class="flex flex-col items-center gap-2">
    <!-- Phase-Label -->
    <div class="text-sm font-medium uppercase tracking-widest" :class="labelColor">
      {{ phaseLabel }}
    </div>

    <!-- Haupt-Zeitanzeige -->
    <div
      class="timer-display font-bold leading-none transition-colors duration-500"
      :class="[timeColor, sizeClass]"
    >
      {{ formattedTime }}
    </div>

    <!-- Fortschrittsbalken -->
    <div v-if="showProgress" class="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-1000 ease-linear"
        :class="progressColor"
        :style="{ width: progress + '%' }"
      />
    </div>

    <!-- Wiederholung -->
    <div v-if="repetition && totalReps > 1" class="text-gray-400 text-sm">
      Durchgang {{ repetition }} / {{ totalReps }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  seconds: { type: Number, default: 0 },
  state: { type: String, default: 'idle' },
  progress: { type: Number, default: 0 },
  showProgress: { type: Boolean, default: true },
  repetition: { type: Number, default: null },
  totalReps: { type: Number, default: 1 },
  countUp: { type: Boolean, default: false },
  large: { type: Boolean, default: false }
})

function pad(n) { return String(n).padStart(2, '0') }

const formattedTime = computed(() => {
  const s = Math.max(0, props.seconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${pad(m)}:${pad(sec)}`
})

const sizeClass = computed(() => props.large ? 'text-8xl' : 'text-7xl')

const timeColor = computed(() => {
  switch (props.state) {
    case 'prep':
    case 'epp_prep': return 'text-blue-400'
    case 'running':
    case 'epp_running_fixed': return 'text-green-400'
    case 'epp_running_open': return 'text-amber-400'
    case 'rep_pause': return 'text-yellow-400'
    case 'epp_paused': return 'text-yellow-500'
    case 'finished': return 'text-gray-500'
    default: return 'text-white'
  }
})

const labelColor = computed(() => {
  switch (props.state) {
    case 'prep':
    case 'epp_prep': return 'text-blue-500'
    case 'running':
    case 'epp_running_fixed': return 'text-green-500'
    case 'epp_running_open': return 'text-amber-500'
    case 'rep_pause': return 'text-yellow-500'
    case 'epp_paused': return 'text-yellow-600'
    case 'finished': return 'text-gray-500'
    default: return 'text-gray-400'
  }
})

const progressColor = computed(() => {
  switch (props.state) {
    case 'running':
    case 'epp_running_fixed': return 'bg-green-500'
    case 'prep':
    case 'epp_prep': return 'bg-blue-500'
    case 'rep_pause': return 'bg-yellow-500'
    default: return 'bg-amber-500'
  }
})

const phaseLabel = computed(() => {
  switch (props.state) {
    case 'idle': return 'Bereit'
    case 'prep':
    case 'epp_prep': return 'Vorbereitung'
    case 'running':
    case 'epp_running_fixed': return 'Läuft'
    case 'epp_running_open': return props.countUp ? 'Aktiv' : 'Läuft'
    case 'rep_pause': return 'Pause'
    case 'epp_paused': return 'Störung / Pause'
    case 'finished': return 'Beendet'
    default: return ''
  }
})
</script>
