<template>
  <div class="flex flex-col items-center gap-4 w-full">

    <!-- Gesamtzeit (Master Timer) -->
    <div class="w-full bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
      <div>
        <div class="text-xs uppercase tracking-widest text-gray-500">EPP Gesamtzeit</div>
        <div class="timer-display text-2xl font-bold" :class="gesamtzeitColor">
          {{ formattedGesamtzeit }}
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs text-gray-500">Station</div>
        <div class="text-xl font-bold text-white">{{ currentIndex + 1 }} / {{ totalStations }}</div>
      </div>
    </div>

    <!-- Aktuelle Station Info -->
    <div v-if="phase" class="w-full bg-gray-800 rounded-xl px-4 py-3">
      <div class="text-amber-400 font-bold text-lg">{{ phase.station }}</div>
      <div class="text-gray-300 text-sm mt-1">
        {{ phase.anschlag }} · {{ phase.distanz }}
      </div>
      <div class="text-gray-500 text-xs mt-1">{{ phase.beschreibung }}</div>

      <!-- Fix vs. Offen Badge -->
      <div class="mt-2">
        <span
          class="text-xs px-2 py-0.5 rounded-full font-medium"
          :class="phase.zeitLimit > 0 ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'"
        >
          {{ phase.zeitLimit > 0 ? 'Fixe Zeit' : 'RO-gestoppt' }}
        </span>
      </div>
    </div>

    <!-- Stations-Timer -->
    <TimerDisplay
      :seconds="timeLeft"
      :state="state"
      :count-up="state === 'epp_running_open'"
      :show-progress="phase?.zeitLimit > 0"
      :progress="stationProgress"
      :large="true"
    />

  </div>
</template>

<script setup>
import { computed } from 'vue'
import TimerDisplay from './TimerDisplay.vue'

const props = defineProps({
  phase: { type: Object, default: null },
  currentIndex: { type: Number, default: 0 },
  totalStations: { type: Number, default: 7 },
  timeLeft: { type: Number, default: 0 },
  eppGesamtzeit: { type: Number, default: 330 },
  state: { type: String, default: 'idle' }
})

function pad(n) { return String(n).padStart(2, '0') }

const formattedGesamtzeit = computed(() => {
  const s = Math.max(0, props.eppGesamtzeit)
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
})

const gesamtzeitColor = computed(() => {
  if (props.eppGesamtzeit <= 30) return 'text-red-400'
  if (props.eppGesamtzeit <= 60) return 'text-yellow-400'
  return 'text-gray-200'
})

const stationProgress = computed(() => {
  const p = props.phase
  if (!p || p.zeitLimit <= 0) return 0
  return Math.round((1 - props.timeLeft / p.zeitLimit) * 100)
})
</script>
