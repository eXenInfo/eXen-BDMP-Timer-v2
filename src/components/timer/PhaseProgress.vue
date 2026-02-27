<template>
  <div class="w-full">
    <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-2">Phasen</h3>
    <div class="space-y-1">
      <div
        v-for="(stage, i) in stages"
        :key="i"
        class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
        :class="rowClass(i)"
      >
        <!-- Status-Indikator -->
        <div class="w-2 h-2 rounded-full flex-shrink-0" :class="dotClass(i)" />

        <!-- Phasenname -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{{ stageName(stage) }}</div>
          <div class="text-xs text-gray-500">{{ stageMeta(stage) }}</div>
        </div>

        <!-- Direkt-Start (nur idle) -->
        <button
          v-if="currentIndex !== i && state === 'idle' && !isEpp"
          @click="$emit('startStage', i)"
          class="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded"
        >
          ▶
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stages: { type: Array, default: () => [] },
  currentIndex: { type: Number, default: 0 },
  state: { type: String, default: 'idle' },
  isEpp: { type: Boolean, default: false }
})

defineEmits(['startStage'])

function pad(n) { return String(n).padStart(2, '0') }
function fmtSeconds(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${pad(sec)} min` : `${sec}s`
}

function stageName(stage) {
  if (stage.station) return `${stage.station} — ${stage.anschlag}`
  return stage.name || 'Phase'
}

function stageMeta(stage) {
  if (stage.distanz) return stage.distanz
  const parts = []
  if (stage.duration) parts.push(fmtSeconds(stage.duration))
  if (stage.repetitions > 1) parts.push(`${stage.repetitions}×`)
  return parts.join(' · ')
}

function rowClass(i) {
  if (i === props.currentIndex) return 'bg-gray-700'
  if (i < props.currentIndex) return 'opacity-40'
  return 'opacity-70'
}

function dotClass(i) {
  if (i < props.currentIndex) return 'bg-green-500'
  if (i === props.currentIndex) return 'bg-amber-400 animate-pulse'
  return 'bg-gray-600'
}
</script>
