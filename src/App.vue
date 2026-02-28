<template>
  <div class="min-h-screen bg-gray-900">
    <RouterView />
    <!-- BottomNav nur außerhalb der HomeView anzeigen -->
    <BottomNav v-if="!isHome" />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from './stores/settingsStore.js'
import BottomNav from './components/ui/BottomNav.vue'

const router        = useRouter()
const route         = useRoute()
const settingsStore = useSettingsStore()

// Beim Erststart (Willkommens-Screen noch nicht gesehen) → HomeView
if (!settingsStore.onboardingDone) {
  router.replace('/home')
}

// Wenn onboarding per Settings zurückgesetzt wird → sofort zur HomeView
watch(() => settingsStore.onboardingDone, (done) => {
  if (!done) router.replace('/home')
})

// BottomNav auf HomeView ausblenden
const isHome = computed(() => route.path === '/home')
</script>
