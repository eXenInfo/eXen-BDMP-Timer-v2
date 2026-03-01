<template>
  <div class="flex flex-col gap-4">

    <!-- Stationen -->
    <div
      v-for="(phase, i) in localPhases"
      :key="i"
      class="bg-gray-800 rounded-xl overflow-hidden"
    >
      <!-- Station Header -->
      <button
        class="w-full flex items-center justify-between px-4 py-3 text-left"
        @click="toggle(i)"
      >
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm" style="color: #78b638">{{ phase.station }}</span>
          <span
            class="text-xs px-2 py-0.5 rounded-full font-bold"
            :class="phase.zeitLimit > 0
              ? 'bg-red-900/60 text-red-300 border border-red-700/50'
              : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'"
          >
            {{ phase.zeitLimit > 0 ? t('epp.fixedTime') : t('epp.roStop') }}
          </span>
        </div>
        <svg
          class="w-4 h-4 text-gray-500 transition-transform duration-150"
          :class="openIndex === i ? 'rotate-180' : ''"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7"/>
        </svg>
      </button>

      <!-- Station Body (collapsible) -->
      <div v-if="openIndex === i" class="px-4 pb-4 space-y-3 border-t border-gray-700">

        <!-- Anschlag + Distanz -->
        <div class="flex gap-2 pt-3">
          <div class="flex-1">
            <label class="text-xs text-gray-500 mb-1 block">{{ t('epp.editor.anschlag') }}</label>
            <input
              v-model="phase.anschlag"
              type="text"
              class="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div class="w-24">
            <label class="text-xs text-gray-500 mb-1 block">{{ t('epp.editor.distanz') }}</label>
            <input
              v-model="phase.distanz"
              type="text"
              class="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <!-- Beschreibung / Kommandos -->
        <div>
          <label class="text-xs text-gray-500 mb-1 block">{{ t('epp.editor.beschreibung') }}</label>
          <textarea
            v-model="phase.beschreibung"
            rows="3"
            class="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
          />
        </div>

        <!-- Zeiteinstellungen (nur wenn zeitLimit > 0 oder als optionale Section) -->
        <details class="group">
          <summary class="text-xs text-gray-500 cursor-pointer select-none flex items-center gap-1 list-none">
            <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/>
            </svg>
            {{ t('epp.editor.timings') }}
          </summary>
          <div class="mt-2 space-y-2 pl-2">

            <!-- Zeitlimit -->
            <div class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-36">{{ t('epp.editor.zeitLimit') }}</label>
              <input
                v-model.number="phase.zeitLimit"
                type="number" min="0" step="1"
                class="w-20 bg-gray-700 text-white text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 text-right"
              />
              <span class="text-xs text-gray-600">s</span>
            </div>

            <!-- Warnsignal bei -->
            <div v-if="phase.zeitLimit > 0" class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-36">{{ t('epp.editor.warnAt') }}</label>
              <input
                v-model.number="phase.warnAtSecondsLeft"
                type="number" min="0" step="1"
                class="w-20 bg-gray-700 text-white text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 text-right"
              />
              <span class="text-xs text-gray-600">s</span>
            </div>

            <!-- Startsignal Töne -->
            <div class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-36">{{ t('epp.editor.signalCount') }}</label>
              <input
                v-model.number="phase.stoppSignalDauer"
                type="number" min="1" max="5" step="1"
                class="w-20 bg-gray-700 text-white text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 text-right"
              />
              <span class="text-xs text-gray-600">{{ t('epp.editor.tones') }}</span>
            </div>

            <!-- Störung möglich -->
            <div class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-36">{{ t('epp.editor.pausable') }}</label>
              <button
                @click="phase.pausable = !phase.pausable"
                class="w-10 h-6 rounded-full transition-colors relative"
                :class="phase.pausable ? 'bg-amber-500' : 'bg-gray-600'"
              >
                <span
                  class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  :class="phase.pausable ? 'left-4' : 'left-0.5'"
                />
              </button>
            </div>

          </div>
        </details>
      </div>
    </div>

    <!-- Aktions-Buttons -->
    <div class="flex flex-col gap-2 pt-2">
      <button
        @click="save"
        class="w-full py-3 rounded-xl font-bold text-white text-base"
        style="background-color: #1d7a74"
      >
        {{ t('epp.editor.save') }}
      </button>
      <button
        @click="confirmReset"
        class="w-full py-3 rounded-xl font-medium text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30"
      >
        {{ t('epp.editor.reset') }}
      </button>
      <button
        @click="$emit('cancel')"
        class="w-full py-3 rounded-xl font-medium text-sm text-gray-400 bg-gray-800"
      >
        {{ t('disciplines.cancel') }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  phases: { type: Array, required: true }
})

const emit = defineEmits(['save', 'reset', 'cancel'])

// Deep copy für lokale Bearbeitung
const localPhases = ref(props.phases.map(p => ({ ...p })))
const openIndex = ref(0)   // erste Station standardmäßig offen

function toggle(i) {
  openIndex.value = openIndex.value === i ? null : i
}

function save() {
  emit('save', localPhases.value)
}

function confirmReset() {
  emit('reset')
}
</script>
