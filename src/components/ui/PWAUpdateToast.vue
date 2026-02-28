<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="needRefresh"
        class="fixed bottom-24 left-4 right-4 z-50 bg-gray-800 border border-green-700 rounded-2xl shadow-xl p-4 flex items-center gap-3"
      >
        <!-- Icon -->
        <span class="text-2xl shrink-0">🔄</span>

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-white">{{ t('pwa.updateAvailable') }}</div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-2 shrink-0">
          <button
            @click="needRefresh = false"
            class="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded-lg transition-colors"
          >
            {{ t('pwa.dismiss') }}
          </button>
          <button
            @click="updateServiceWorker()"
            class="text-xs font-bold bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {{ t('pwa.reload') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { needRefresh, updateServiceWorker } = useRegisterSW({
  // Called when a new SW is waiting — needRefresh becomes true automatically
  onNeedRefresh() {},
  onOfflineReady() {}
})
</script>
