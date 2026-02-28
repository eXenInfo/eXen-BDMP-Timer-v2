<template>
  <div class="bg-gray-800 rounded-xl p-4 space-y-4">
    <!-- Phasenname -->
    <div>
      <label class="text-xs text-gray-400 uppercase tracking-wider">{{ t('phaseEditor.nameLabel') }}</label>
      <textarea
        v-model="local.name"
        rows="2"
        class="w-full mt-1 bg-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
        :placeholder="t('phaseEditor.namePlaceholder')"
      />
    </div>

    <!-- Vorbereitungszeit & Dauer -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs text-gray-400 uppercase tracking-wider">{{ t('phaseEditor.prepTime') }}</label>
        <div class="flex items-center gap-2 mt-1">
          <input
            type="number" min="0" max="60"
            v-model.number="local.prepTime"
            class="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <span class="text-gray-500 text-sm">s</span>
        </div>
      </div>
      <div>
        <label class="text-xs text-gray-400 uppercase tracking-wider">{{ t('phaseEditor.duration') }}</label>
        <div class="flex items-center gap-2 mt-1">
          <input
            type="number" min="1" max="3600"
            v-model.number="local.duration"
            class="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <span class="text-gray-500 text-sm">s</span>
        </div>
        <div class="text-xs text-gray-600 mt-1">= {{ fmtSeconds(local.duration) }}</div>
      </div>
    </div>

    <!-- Wiederholungen & Pause -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs text-gray-400 uppercase tracking-wider">{{ t('phaseEditor.repetitions') }}</label>
        <input
          type="number" min="1" max="99"
          v-model.number="local.repetitions"
          class="w-full mt-1 bg-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>
      <div>
        <label class="text-xs text-gray-400 uppercase tracking-wider">{{ t('phaseEditor.pauseBetween') }}</label>
        <div class="flex items-center gap-2 mt-1">
          <input
            type="number" min="0" max="300"
            v-model.number="local.pauseDuration"
            class="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <span class="text-gray-500 text-sm">s</span>
        </div>
      </div>
    </div>

    <!-- Signale -->
    <div class="grid grid-cols-2 gap-3">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="local.soundAtStart" class="accent-amber-400" />
        <span class="text-sm text-gray-300">{{ t('phaseEditor.signalAtStart') }}</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="local.soundAtEnd" class="accent-amber-400" />
        <span class="text-sm text-gray-300">{{ t('phaseEditor.signalAtEnd') }}</span>
      </label>
    </div>

    <!-- Pause nach Phase -->
    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" v-model="local.pauseAfter" class="accent-amber-400" />
      <span class="text-sm text-gray-300">{{ t('phaseEditor.manualPauseAfter') }}</span>
    </label>

    <!-- Buttons -->
    <div class="flex gap-2 pt-2">
      <button @click="$emit('save', local)" class="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
        {{ t('phaseEditor.save') }}
      </button>
      <button @click="$emit('cancel')" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 rounded-lg text-sm transition-colors">
        {{ t('phaseEditor.cancel') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  phase: {
    type: Object,
    default: () => ({
      name: '', prepTime: 5, duration: 30,
      repetitions: 1, pauseDuration: 0,
      soundAtStart: true, soundAtEnd: true, pauseAfter: false
    })
  }
})

defineEmits(['save', 'cancel'])

const local = reactive({ ...props.phase })

function pad(n) { return String(n).padStart(2, '0') }
function fmtSeconds(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${pad(sec)} min` : `${sec}s`
}
</script>
