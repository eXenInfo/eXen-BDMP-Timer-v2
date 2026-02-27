<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900 px-4">
    <h1 class="text-xl font-bold text-white pt-6 pb-6">Einstellungen</h1>

    <!-- Lautstärke -->
    <section class="mb-6">
      <div class="text-xs uppercase tracking-widest text-gray-500 mb-3">Audio</div>
      <div class="bg-gray-800 rounded-xl p-4 space-y-4">
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-300">Lautstärke</span>
            <span class="text-amber-400 font-bold text-sm">{{ settingsStore.volume }}%</span>
          </div>
          <input
            type="range" min="0" max="100" step="5"
            :value="settingsStore.volume"
            @input="settingsStore.setVolume(+$event.target.value)"
            class="w-full accent-amber-400"
          />
        </div>
        <button
          @click="testSound"
          class="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          🔊 Ton testen
        </button>
      </div>
    </section>

    <!-- Disziplinen -->
    <section class="mb-6">
      <div class="text-xs uppercase tracking-widest text-gray-500 mb-3">Disziplinen</div>
      <div class="bg-gray-800 rounded-xl overflow-hidden">
        <button
          @click="confirmReset"
          class="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-gray-700 transition-colors"
        >
          <span class="text-xl">🔄</span>
          <div>
            <div class="text-sm font-medium text-white">Standard-Disziplinen zurücksetzen</div>
            <div class="text-xs text-gray-500">Eigene Disziplinen bleiben erhalten</div>
          </div>
        </button>
      </div>
    </section>

    <!-- Onboarding -->
    <section class="mb-6">
      <div class="text-xs uppercase tracking-widest text-gray-500 mb-3">Einführung</div>
      <div class="bg-gray-800 rounded-xl overflow-hidden">
        <button
          @click="resetOnboarding"
          class="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-gray-700 transition-colors"
        >
          <span class="text-xl">📖</span>
          <div>
            <div class="text-sm font-medium text-white">Einführungs-Tutorial zurücksetzen</div>
            <div class="text-xs text-gray-500">Beim nächsten Start neu anzeigen</div>
          </div>
        </button>
      </div>
    </section>

    <!-- Info -->
    <section>
      <div class="text-xs uppercase tracking-widest text-gray-500 mb-3">App-Info</div>
      <div class="bg-gray-800 rounded-xl px-4 py-4 space-y-2">
        <div class="flex justify-between">
          <span class="text-sm text-gray-400">Version</span>
          <span class="text-sm text-gray-300">2.0.0</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-400">Entwickler</span>
          <span class="text-sm text-gray-300">Thomas Köhler · eXen.Info</span>
        </div>
      </div>
    </section>

    <!-- Reset-Confirm Dialog -->
    <Teleport to="body">
      <div v-if="showResetConfirm" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div class="bg-gray-800 rounded-2xl p-6 w-full max-w-xs text-center">
          <div class="text-4xl mb-3">⚠️</div>
          <h3 class="text-white font-bold mb-2">Standard-Disziplinen zurücksetzen?</h3>
          <p class="text-gray-400 text-sm mb-4">Die eingebauten Disziplinen werden auf den Originalstand zurückgesetzt. Eigene Disziplinen bleiben erhalten.</p>
          <div class="flex gap-2">
            <button @click="showResetConfirm = false" class="flex-1 bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl">Abbrechen</button>
            <button @click="doReset" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl">Zurücksetzen</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toast" class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
        {{ toast }}
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from '../stores/settingsStore.js'
import { useDisciplineStore } from '../stores/disciplineStore.js'
import { useAudio } from '../composables/useAudio.js'

const settingsStore = useSettingsStore()
const disciplineStore = useDisciplineStore()

const showResetConfirm = ref(false)
const toast = ref('')

const { playSignal, ensureReady } = useAudio(computed(() => settingsStore.volume))

async function testSound() {
  await ensureReady()
  playSignal(1)
}

function confirmReset() { showResetConfirm.value = true }

function doReset() {
  disciplineStore.resetToDefaults()
  showResetConfirm.value = false
  showToast('Standard-Disziplinen zurückgesetzt')
}

function resetOnboarding() {
  settingsStore.resetOnboarding()
  showToast('Tutorial wird beim nächsten Start angezeigt')
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => toast.value = '', 2500)
}
</script>
