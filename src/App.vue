<template>
  <div class="min-h-screen bg-gray-900">
    <RouterView />
    <BottomNav />
    <OnboardingModal v-if="showOnboarding" @done="completeOnboarding" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from './stores/settingsStore.js'
import BottomNav from './components/ui/BottomNav.vue'
import OnboardingModal from './components/ui/OnboardingModal.vue'

const settingsStore = useSettingsStore()
const showOnboarding = computed(() => !settingsStore.onboardingDone)

function completeOnboarding() {
  settingsStore.completeOnboarding()
}
</script>
