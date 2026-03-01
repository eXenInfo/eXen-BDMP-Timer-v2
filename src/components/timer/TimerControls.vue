<template>
  <div class="flex flex-col gap-3 w-full max-w-sm">

    <!-- ── EPP-Buttons ─────────────────────────────────────────────────────── -->
    <template v-if="isEpp">

      <!-- Start (idle: erste Station oder Nächste Station) -->
      <button
        v-if="state === 'idle'"
        @click="$emit('start')"
        class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md"
        style="background-color: #1d7a74"
      >
        {{ isFirstStation ? t('timer.startEpp') : t('timer.startNextStation') }}
      </button>

      <!-- Neustart (finished) -->
      <button
        v-if="state === 'finished'"
        @click="$emit('start')"
        class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md"
        style="background-color: #1d7a74"
      >
        {{ t('timer.restart') }}
      </button>

      <!-- Station beenden (open station läuft) -->
      <button
        v-if="state === 'epp_running_open'"
        @click="$emit('eppNext')"
        class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md bg-blue-600 active:bg-blue-700"
      >
        {{ isLastStation ? t('timer.endMatch') : t('timer.endStation') }}
      </button>

      <!-- Störung / Weiter (nur bei pausable open stations) -->
      <button
        v-if="isPausable && (state === 'epp_running_open' || state === 'epp_paused')"
        @click="$emit('eppPause')"
        class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md"
        :class="state === 'epp_paused' ? 'bg-green-700 active:bg-green-600' : 'bg-yellow-600 active:bg-yellow-700'"
      >
        {{ state === 'epp_paused' ? t('timer.resume') : t('timer.interrupt') }}
      </button>

      <!-- Abbrechen (aktiver Zustand oder zwischen Stationen) -->
      <button
        v-if="state !== 'idle' || !isFirstStation"
        @click="$emit('reset')"
        class="w-full py-3 px-6 rounded-xl font-medium text-sm text-gray-400 bg-gray-800 active:bg-gray-700 transition-colors"
      >
        {{ state === 'finished' ? t('timer.reset') : t('timer.abort') }}
      </button>

    </template>

    <!-- ── Normale Disziplin-Buttons ────────────────────────────────────────── -->
    <template v-else>

      <!-- Start (idle) -->
      <button
        v-if="state === 'idle' || state === 'finished'"
        @click="$emit('start')"
        class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md bg-green-600 active:bg-green-700"
      >
        {{ state === 'finished' ? t('timer.restart') : t('timer.start') }}
      </button>

      <!-- Unterbrechen (running) -->
      <button
        v-if="state === 'running'"
        @click="$emit('pause')"
        class="w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-95 shadow-md bg-yellow-600 active:bg-yellow-700"
      >
        {{ t('timer.pause_btn') }}
      </button>

      <!-- Zurücksetzen -->
      <button
        v-if="state !== 'idle'"
        @click="$emit('reset')"
        class="w-full py-3 px-6 rounded-xl font-medium text-sm text-gray-400 bg-gray-800 active:bg-gray-700 transition-colors"
      >
        {{ t('timer.reset') }}
      </button>

    </template>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  state:          { type: String,  default: 'idle' },
  isEpp:          { type: Boolean, default: false },
  isFirstStation: { type: Boolean, default: true },
  isPausable:     { type: Boolean, default: false },
  isLastStation:  { type: Boolean, default: false }
})

defineEmits(['start', 'pause', 'reset', 'eppNext', 'eppPause'])
</script>
