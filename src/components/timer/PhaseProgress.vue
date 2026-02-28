<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-xs uppercase tracking-widest text-gray-500">
        {{ isEpp ? t('phases.stations') : t('phases.matches') }}
      </h3>
      <span v-if="!isEpp && selectedIndex !== null" class="text-xs text-amber-400">
        {{ t('phases.matchSelected', { n: selectedIndex + 1 }) }}
      </span>
    </div>

    <div class="space-y-1">
      <div
        v-for="(stage, i) in stages"
        :key="i"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
        :class="rowClass(i)"
        @click="!isEpp && isIdle && $emit('selectStage', i)"
      >
        <!-- Status-Indikator / Auswahl-Indikator -->
        <div class="w-3 h-3 rounded-full flex-shrink-0 transition-colors" :class="dotClass(i)" />

        <!-- Phasenname -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium leading-snug" :class="i === selectedIndex && isIdle ? 'text-white' : 'text-gray-300'">
            {{ stageName(stage) }}
          </div>
          <div class="text-xs text-gray-500 mt-0.5">{{ stageMeta(stage) }}</div>
        </div>

        <!-- Auswahl-Icon (idle, nicht EPP) -->
        <div v-if="!isEpp && isIdle" class="flex-shrink-0">
          <div
            v-if="i === selectedIndex"
            class="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
          >
            <span class="text-xs text-white font-bold">▶</span>
          </div>
          <div v-else class="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center">
            <span class="text-xs text-gray-600">▶</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  stages: { type: Array, default: () => [] },
  currentIndex: { type: Number, default: 0 },
  selectedIndex: { type: Number, default: null },
  state: { type: String, default: 'idle' },
  isEpp: { type: Boolean, default: false }
})

defineEmits(['selectStage'])

const isIdle = computed(() => props.state === 'idle')

function pad(n) { return String(n).padStart(2, '0') }
function fmtSeconds(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${pad(sec)} min` : `${sec}s`
}

function stageName(stage) {
  if (stage.station) return `${stage.station} — ${stage.anschlag}`
  // Erste Zeile des Namens (mehrzeilige Namen kürzen)
  return (stage.name || 'Phase').split('\n')[0]
}

function stageMeta(stage) {
  if (stage.distanz) return stage.distanz
  const parts = []
  if (stage.duration) parts.push(fmtSeconds(stage.duration))
  if (stage.repetitions > 1) parts.push(`${stage.repetitions}×`)
  return parts.join(' · ')
}

function rowClass(i) {
  const isSelected = i === props.selectedIndex && props.isIdle && !props.isEpp
  const isActive = i === props.currentIndex && !props.isIdle
  if (isActive) return 'bg-gray-700 cursor-default'
  if (isSelected) return 'bg-gray-800 ring-1 ring-amber-500 cursor-pointer'
  if (i < props.currentIndex && !props.isIdle) return 'opacity-40 cursor-default'
  return props.isEpp || !props.isIdle ? 'opacity-60 cursor-default' : 'hover:bg-gray-800 cursor-pointer opacity-70'
}

function dotClass(i) {
  const isActive = i === props.currentIndex && !props.isIdle
  const isSelected = i === props.selectedIndex && props.isIdle && !props.isEpp
  const isDone = i < props.currentIndex && !props.isIdle

  if (isDone) return 'bg-green-500'
  if (isActive) return 'bg-amber-400 animate-pulse'
  if (isSelected) return 'bg-amber-500'
  return 'bg-gray-600'
}
</script>
