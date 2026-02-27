<template>
  <div class="flex flex-col items-center gap-3">
    <!-- Phase-Label -->
    <div class="text-xs font-bold uppercase tracking-widest" :class="labelColor">
      {{ phaseLabel }}
    </div>

    <!-- Kreisring + Zeitanzeige -->
    <div
      class="relative flex items-center justify-center"
      :class="large ? 'w-56 h-56' : 'w-40 h-40'"
    >
      <!-- SVG Ring -->
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <!-- Hintergrund-Ring -->
        <circle cx="50" cy="50" r="44" fill="none" stroke="#1f2937" stroke-width="6"/>
        <!-- Fortschritts-Ring -->
        <circle
          v-if="showProgress"
          cx="50" cy="50" r="44"
          fill="none"
          :stroke="ringColor"
          stroke-width="6"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 50 50)"
          class="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>

      <!-- Zeitanzeige in Ringmitte -->
      <div
        class="timer-display font-bold leading-none transition-colors duration-500 z-10 select-none"
        :class="[timeColor, large ? 'text-5xl' : 'text-3xl']"
      >
        {{ formattedTime }}
      </div>
    </div>

    <!-- Wiederholung -->
    <div v-if="repetition && totalReps > 1" class="text-gray-500 text-sm">
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

// Umfang des Rings bei r=44: 2×π×44 ≈ 276.46
const circumference = 2 * Math.PI * 44

const dashOffset = computed(() => {
  const p = Math.max(0, Math.min(100, props.progress))
  return circumference * (1 - p / 100)
})

const ringColor = computed(() => {
  switch (props.state) {
    case 'prep':
    case 'epp_prep':          return '#3b82f6'  // blue-500
    case 'running':
    case 'epp_running_fixed': return '#22c55e'  // green-500
    case 'epp_running_open':  return '#f59e0b'  // amber-500
    case 'rep_pause':         return '#eab308'  // yellow-500
    case 'epp_paused':        return '#78350f'  // amber-900
    case 'finished':          return '#4b5563'  // gray-600
    default:                  return '#374151'  // gray-700
  }
})

function pad(n) { return String(n).padStart(2, '0') }

const formattedTime = computed(() => {
  const s = Math.max(0, props.seconds)
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
})

const timeColor = computed(() => {
  switch (props.state) {
    case 'prep':
    case 'epp_prep':          return 'text-blue-400'
    case 'running':
    case 'epp_running_fixed': return 'text-green-400'
    case 'epp_running_open':  return 'text-amber-400'
    case 'rep_pause':         return 'text-yellow-400'
    case 'epp_paused':        return 'text-yellow-500'
    case 'finished':          return 'text-gray-500'
    default:                  return 'text-white'
  }
})

const labelColor = computed(() => {
  switch (props.state) {
    case 'prep':
    case 'epp_prep':          return 'text-blue-400'
    case 'running':
    case 'epp_running_fixed': return 'text-green-400'
    case 'epp_running_open':  return 'text-amber-400'
    case 'rep_pause':         return 'text-yellow-400'
    case 'epp_paused':        return 'text-yellow-500'
    case 'finished':          return 'text-gray-500'
    default:                  return 'text-gray-600'
  }
})

const phaseLabel = computed(() => {
  switch (props.state) {
    case 'idle':              return 'Bereit'
    case 'prep':
    case 'epp_prep':          return 'Vorbereitung'
    case 'running':
    case 'epp_running_fixed': return 'Läuft'
    case 'epp_running_open':  return props.countUp ? 'Aktiv' : 'Läuft'
    case 'rep_pause':         return 'Pause'
    case 'epp_paused':        return 'Störung / Pause'
    case 'finished':          return 'Beendet'
    default:                  return ''
  }
})
</script>
