<template>
  <div class="min-h-screen flex flex-col bg-gray-900 select-none overflow-hidden">

    <!-- eXen Markenstreifen oben -->
    <div class="h-1 w-full flex-shrink-0" style="background: linear-gradient(90deg, #155f5b 0%, #30922b 50%, #78b638 100%)"></div>

    <!-- Hauptinhalt -->
    <div class="flex-1 flex flex-col items-center justify-center px-8 gap-8 py-10 min-h-0">

      <!-- ── eXen Wordmark ──────────────────────────────────────────── -->
      <div class="text-center">
        <div class="flex items-baseline justify-center">
          <span class="text-3xl font-black text-white tracking-tight">eX</span>
          <span class="text-3xl font-black tracking-tight" style="color: #78b638">en</span>
          <span class="text-2xl font-black text-gray-500 ml-0.5 leading-none">|</span>
        </div>
        <p class="text-xs text-gray-500 tracking-widest uppercase mt-0.5 font-medium">eXen.Info</p>
      </div>

      <!-- ── App-Titel & Tagline ────────────────────────────────────── -->
      <div class="text-center">
        <h1 class="text-5xl font-black text-white tracking-tight leading-none">BDMP</h1>
        <h1 class="text-5xl font-black tracking-tight leading-none mt-0.5" style="color: #78b638">Timer</h1>
        <p class="text-gray-400 text-sm mt-4 leading-relaxed max-w-xs mx-auto">
          {{ t('home.tagline') }}
        </p>
      </div>

      <!-- ── Feature-Übersicht ──────────────────────────────────────── -->
      <div class="w-full max-w-xs space-y-3">
        <div v-for="feat in features" :key="feat.key" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
               style="background-color: rgba(48,146,43,0.15)">
            {{ feat.icon }}
          </div>
          <span class="text-gray-300 text-sm leading-snug">{{ feat.text }}</span>
        </div>
      </div>

      <!-- ── Sprachauswahl ──────────────────────────────────────────── -->
      <div class="flex gap-2 bg-gray-800 rounded-xl p-1 w-full max-w-xs">
        <button
          @click="settingsStore.setLocale('de')"
          class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors"
          :class="settingsStore.locale === 'de' ? 'text-white' : 'text-gray-500'"
          :style="settingsStore.locale === 'de' ? 'background-color: #30922b' : ''"
        >
          🇩🇪 Deutsch
        </button>
        <button
          @click="settingsStore.setLocale('en')"
          class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors"
          :class="settingsStore.locale === 'en' ? 'text-white' : 'text-gray-500'"
          :style="settingsStore.locale === 'en' ? 'background-color: #30922b' : ''"
        >
          🇬🇧 English
        </button>
      </div>

      <!-- ── CTA: Zur App ───────────────────────────────────────────── -->
      <div class="w-full max-w-xs space-y-3">
        <button
          @click="enter"
          class="w-full py-5 rounded-2xl font-black text-xl text-white shadow-lg transition-transform active:scale-95"
          style="background-color: #30922b"
        >
          {{ t('home.cta') }} →
        </button>

        <!-- Install-Banner: Chrome/Edge/Android -->
        <button
          v-if="isInstallable"
          @click="install"
          class="w-full py-3 rounded-2xl font-bold text-sm text-white border border-green-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
          style="background-color: rgba(48,146,43,0.15)"
        >
          <span>📲</span>
          <span>{{ t('pwa.installBtn') }}</span>
        </button>

        <!-- Install-Hinweis: iOS / Safari -->
        <div
          v-else-if="isIOS && !isInstalled"
          class="w-full px-4 py-3 rounded-2xl text-xs text-gray-400 text-center border border-gray-700"
        >
          {{ t('pwa.iosHint') }}
        </div>

        <!-- Bereits installiert -->
        <div
          v-else-if="isInstalled"
          class="text-center text-xs font-medium"
          style="color: #78b638"
        >
          {{ t('pwa.alreadyInstalled') }}
        </div>
      </div>

    </div>

    <!-- ── Footer ────────────────────────────────────────────────────── -->
    <div class="pb-safe-bottom pb-8 text-center flex-shrink-0">
      <div class="w-10 h-0.5 mx-auto mb-3 rounded-full" style="background-color: #155f5b"></div>
      <p class="text-gray-600 text-xs">v2.0 · Thomas Köhler · eXen.Info</p>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settingsStore.js'
import { usePWAInstall } from '../composables/usePWAInstall.js'

const { t } = useI18n()
const router        = useRouter()
const settingsStore = useSettingsStore()
const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()

const features = computed(() => [
  { key: 'f1', icon: '🎯', text: t('home.feature1') },
  { key: 'f2', icon: '📻', text: t('home.feature2') },
  { key: 'f3', icon: '🔁', text: t('home.feature3') },
  { key: 'f4', icon: '🔊', text: t('home.feature4') },
  { key: 'f5', icon: '📶', text: t('home.feature5') },
])

function enter() {
  settingsStore.completeOnboarding()
  router.replace('/timer')
}
</script>
