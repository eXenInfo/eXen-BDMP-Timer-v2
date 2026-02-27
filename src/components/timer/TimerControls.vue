<template>
  <div class="flex flex-col gap-3 w-full max-w-sm">
    <!-- Start-Button (idle / nach Pause) -->
    <button
      v-if="showStart"
      @click="$emit('start')"
      class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md bg-green-600 active:bg-green-700"
    >
      {{ startLabel }}
    </button>

    <!-- Pause (nur normale Disziplin im running-State) -->
    <button
      v-if="showPause"
      @click="$emit('pause')"
      class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md bg-yellow-600 active:bg-yellow-700"
    >
      Unterbrechen
    </button>

    <!-- EPP: Nächste Station (nur open-state) -->
    <button
      v-if="showEppNext"
      @click="$emit('eppNext')"
      class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md bg-blue-600 active:bg-blue-700"
    >
      {{ eppNextLabel }}
    </button>

    <!-- EPP: Störung / Pause toggle -->
    <button
      v-if="showEppPause"
      @click="$emit('eppPause')"
      class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md"
      :class="isPaused ? 'bg-green-600 active:bg-green-700' : 'bg-yellow-600 active:bg-yellow-700'"
    >
      {{ isPaused ? 'Fortsetzen' : 'Störung / Pause' }}
    </button>

    <!-- Reset -->
    <button
      v-if="showReset"
      @click="$emit('reset')"
      class="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-150 active:scale-95 shadow-md bg-gray-700 active:bg-gray-600 text-gray-300"
    >
      Zurücksetzen
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: { type: String, default: 'idle' },
  isEpp: { type: Boolean, default: false },
  isPausable: { type: Boolean, default: false },
  isLastStation: { type: Boolean, default: false }
})

defineEmits(['start', 'pause', 'reset', 'eppNext', 'eppPause'])

const isPaused = computed(() => props.state === 'epp_paused')

const showStart = computed(() =>
  props.state === 'idle' || props.state === 'finished'
)
const showPause = computed(() =>
  !props.isEpp && props.state === 'running'
)
const showEppNext = computed(() =>
  props.isEpp && props.state === 'epp_running_open'
)
const showEppPause = computed(() =>
  props.isEpp && props.isPausable &&
  (props.state === 'epp_running_open' || props.state === 'epp_paused')
)
const showReset = computed(() =>
  props.state !== 'idle' || props.isEpp
)

const startLabel = computed(() => {
  if (props.state === 'finished') return 'Neu starten'
  if (props.isEpp) return 'Achtung... (Start)'
  return 'Start'
})

const eppNextLabel = computed(() =>
  props.isLastStation ? 'Match beenden' : 'Station beenden'
)
</script>
