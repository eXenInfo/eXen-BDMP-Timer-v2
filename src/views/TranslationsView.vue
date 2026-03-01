<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900">

    <!-- Header -->
    <div class="px-4 pt-6 pb-4 flex items-center gap-3">
      <button
        @click="$router.back()"
        class="text-gray-400 hover:text-white transition-colors p-1 -ml-1 flex-shrink-0"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
        </svg>
      </button>
      <h1 class="text-xl font-bold text-white">{{ t('translations.title') }}</h1>
    </div>

    <!-- Search -->
    <div class="px-4 mb-4">
      <input
        v-model="filter"
        type="search"
        :placeholder="t('translations.search')"
        class="w-full bg-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-500"
      />
    </div>

    <!-- Column headers -->
    <div class="px-4 mb-2 grid grid-cols-2 gap-2">
      <div class="text-xs uppercase tracking-widest text-gray-500">🇩🇪 {{ t('translations.colDe') }}</div>
      <div class="text-xs uppercase tracking-widest text-gray-500">🇬🇧 {{ t('translations.colEn') }}</div>
    </div>

    <!-- Empty state -->
    <div
      v-if="filteredTexts.length === 0"
      class="flex-1 flex items-center justify-center text-gray-600 text-sm py-16 px-4 text-center"
    >
      {{ filter ? t('translations.noResults') : t('translations.empty') }}
    </div>

    <!-- Translation rows -->
    <div v-else class="px-4 space-y-2">
      <div
        v-for="original in filteredTexts"
        :key="original"
        class="bg-gray-800 rounded-xl p-3 grid grid-cols-2 gap-2"
      >
        <!-- Deutsch (read-only, für Referenz) -->
        <textarea
          :value="original"
          readonly
          rows="3"
          class="w-full bg-gray-700/50 text-gray-400 text-xs rounded-lg px-3 py-2 resize-none focus:outline-none leading-snug cursor-default"
        />

        <!-- Englisch (editierbar) -->
        <textarea
          :value="enValue(original)"
          @input="onInput(original, 'en', $event.target.value)"
          rows="3"
          :placeholder="t('translations.enPlaceholder')"
          class="w-full bg-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 leading-snug placeholder-gray-600"
        />
      </div>
    </div>

    <!-- Reset button -->
    <div class="px-4 mt-6">
      <button
        @click="showConfirm = true"
        class="w-full bg-gray-800 hover:bg-gray-700 text-red-400 font-medium py-3 rounded-xl text-sm transition-colors"
      >
        {{ t('translations.resetAll') }}
      </button>
    </div>

    <!-- Confirm Reset Dialog -->
    <Teleport to="body">
      <div v-if="showConfirm" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
        <div class="bg-gray-800 rounded-2xl p-6 w-full max-w-xs text-center">
          <div class="text-4xl mb-3">⚠️</div>
          <h3 class="text-white font-bold mb-2">{{ t('translations.resetConfirmTitle') }}</h3>
          <p class="text-gray-400 text-sm mb-5">{{ t('translations.resetConfirmText') }}</p>
          <div class="flex gap-2">
            <button
              @click="showConfirm = false"
              class="flex-1 bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl text-sm"
            >
              {{ t('settings.cancel') }}
            </button>
            <button
              @click="doReset"
              class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {{ t('settings.reset') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <div
        v-if="toast"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50"
      >
        {{ toast }}
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisciplineStore } from '../stores/disciplineStore.js'
import { useTranslationsStore } from '../stores/translationsStore.js'

const { t } = useI18n()
const disciplineStore   = useDisciplineStore()
const translationsStore = useTranslationsStore()

const filter      = ref('')
const showConfirm = ref(false)
const toast       = ref('')

// ── Collect all unique translatable texts ─────────────────────────────────────
const allTexts = computed(() => {
  const set = new Set()

  // All phase names from all normal disciplines
  for (const stages of Object.values(disciplineStore.disciplines)) {
    if (!Array.isArray(stages)) continue
    for (const stage of stages) {
      if (stage.name) set.add(stage.name)
    }
  }

  // EPP station texts (anschlag + beschreibung; station/distanz are structural)
  for (const phase of disciplineStore.eppPhases) {
    if (phase.anschlag)     set.add(phase.anschlag)
    if (phase.beschreibung) set.add(phase.beschreibung)
  }

  return [...set].sort((a, b) => a.localeCompare(b, 'de'))
})

const filteredTexts = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return allTexts.value
  return allTexts.value.filter(text => text.toLowerCase().includes(q))
})

// ── Read helpers ──────────────────────────────────────────────────────────────
function enValue(original) {
  return translationsStore.textMap[original]?.en ?? ''
}

// ── Debounced input handler ───────────────────────────────────────────────────
const _timers = {}

function onInput(original, locale, value) {
  clearTimeout(_timers[original + locale])
  _timers[original + locale] = setTimeout(() => {
    translationsStore.setTranslation(original, locale, value)
  }, 400)
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function doReset() {
  translationsStore.reset()
  showConfirm.value = false
  showToast(t('translations.toastReset'))
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2500)
}
</script>
