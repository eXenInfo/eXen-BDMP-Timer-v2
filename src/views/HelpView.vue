<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900 px-4">
    <h1 class="text-xl font-bold text-white pt-6 pb-6">{{ t('help.title') }}</h1>

    <div class="space-y-4">

      <details v-for="item in faqItems" :key="item.q" class="bg-gray-800 rounded-xl overflow-hidden">
        <summary class="px-4 py-4 cursor-pointer text-sm font-medium text-white flex items-center justify-between list-none">
          {{ item.q }}
          <span class="text-gray-500 ml-2">›</span>
        </summary>
        <div class="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-700 pt-3">
          {{ item.a }}
        </div>
      </details>

      <!-- Schnellstart -->
      <div class="bg-gray-800 rounded-xl p-4 mt-4">
        <h2 class="text-white font-bold mb-3">{{ t('help.quickstartSection') }}</h2>
        <ol class="space-y-2 text-sm text-gray-300">
          <li class="flex gap-3">
            <span class="text-amber-400 font-bold flex-shrink-0">1.</span>
            <span>{{ t('help.quickstart1') }}</span>
          </li>
          <li class="flex gap-3">
            <span class="text-amber-400 font-bold flex-shrink-0">2.</span>
            <span>{{ t('help.quickstart2') }}</span>
          </li>
          <li class="flex gap-3">
            <span class="text-amber-400 font-bold flex-shrink-0">3.</span>
            <span>{{ t('help.quickstart3') }}</span>
          </li>
          <li class="flex gap-3">
            <span class="text-amber-400 font-bold flex-shrink-0">4.</span>
            <span>{{ t('help.quickstart4') }}</span>
          </li>
        </ol>
      </div>

      <!-- EPP Erklärung -->
      <div class="bg-gray-800 rounded-xl p-4">
        <h2 class="text-white font-bold mb-3">{{ t('help.eppSection') }}</h2>
        <div class="space-y-2 text-sm text-gray-400">
          <p><span class="text-blue-400 font-medium">{{ t('help.eppFixed') }}</span> {{ t('help.eppFixedDesc') }}</p>
          <p><span class="text-amber-400 font-medium">{{ t('help.eppOpen') }}</span> {{ t('help.eppOpenDesc') }}</p>
          <p><span class="text-yellow-400 font-medium">{{ t('help.eppPause') }}</span>{{ t('help.eppPauseDesc') }}</p>
          <p>{{ t('help.eppTotal') }} <span class="text-gray-200 font-medium">{{ t('help.eppTotalDesc') }}</span></p>
        </div>
      </div>

      <!-- Audio Hinweis -->
      <div class="bg-amber-900/30 border border-amber-800 rounded-xl p-4">
        <div class="flex gap-3">
          <span class="text-2xl flex-shrink-0">🔊</span>
          <div class="text-sm text-amber-200">
            <strong>{{ t('help.audioSection') }}:</strong> {{ t('help.audioTip') }}
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

const faqItems = computed(() => [
  { q: t('help.faq1q'), a: t('help.faq1a') },
  { q: t('help.faq2q'), a: t('help.faq2a') },
  { q: t('help.faq3q'), a: t('help.faq3a') },
  { q: t('help.faq4q'), a: t('help.faq4a') },
  { q: t('help.faq5q'), a: t('help.faq5a') }
])
</script>
