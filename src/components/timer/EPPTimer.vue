<template>
  <div class="flex flex-col items-center gap-4 w-full">

    <!-- ── Gesamtzeit (Master Timer) ──────────────────────────────────────── -->
    <div class="w-full bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
      <div>
        <div class="text-xs uppercase tracking-widest text-gray-500 mb-0.5">{{ t('epp.totalTime') }}</div>
        <div class="timer-display text-2xl font-bold" :class="gesamtzeitColor">
          {{ formattedGesamtzeit }}
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs text-gray-500 mb-0.5">{{ t('epp.station') }}</div>
        <div class="text-xl font-bold text-white">{{ currentIndex + 1 }} / {{ totalStations }}</div>
      </div>
    </div>

    <!-- ── Aktuelle Station ────────────────────────────────────────────────── -->
    <div v-if="phase" class="w-full bg-gray-800 rounded-xl px-4 py-3 space-y-2">

      <!-- Stationsname + Badge -->
      <div class="flex items-start justify-between gap-2">
        <div class="font-bold text-lg" style="color: #78b638">{{ phase.station }}</div>
        <span
          class="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 mt-0.5"
          :class="isFixed
            ? 'bg-red-900/60 text-red-300 border border-red-700/50'
            : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'"
        >
          {{ isFixed ? t('epp.fixedTime') : t('epp.roStop') }}
        </span>
      </div>

      <!-- Anschlag + Distanz -->
      <div class="text-gray-300 text-sm font-medium">
        {{ phase.anschlag }} · {{ phase.distanz }}
      </div>

      <!-- Beschreibung direkt aus den Disziplindaten (immer Deutsch, kein i18n) -->
      <div class="text-gray-400 text-xs leading-relaxed border-t border-gray-700 pt-2">
        {{ phase.beschreibung }}
      </div>
    </div>

    <!-- ── Stations-Timer ──────────────────────────────────────────────────── -->
    <TimerDisplay
      :seconds="timeLeft"
      :state="state"
      :count-up="state === 'epp_running_open'"
      :show-progress="isFixed"
      :progress="stationProgress"
      :large="true"
    />

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TimerDisplay from './TimerDisplay.vue'

const { t } = useI18n()

const props = defineProps({
  phase:          { type: Object, default: null },
  currentIndex:   { type: Number, default: 0 },
  totalStations:  { type: Number, default: 7 },
  timeLeft:       { type: Number, default: 0 },
  eppGesamtzeit:  { type: Number, default: 330 },
  state:          { type: String, default: 'idle' }
})

const isFixed = computed(() => (props.phase?.zeitLimit ?? 0) > 0)

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
