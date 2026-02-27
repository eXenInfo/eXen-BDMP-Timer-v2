import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadFromStorage, saveToStorage } from '../services/storage.js'

export const useSettingsStore = defineStore('settings', () => {
  const volume = ref(loadFromStorage('VOLUME', 80))
  const onboardingDone = ref(loadFromStorage('ONBOARDING_DONE', false))

  function setVolume(val) {
    volume.value = Math.max(0, Math.min(100, val))
    saveToStorage('VOLUME', volume.value)
  }

  function completeOnboarding() {
    onboardingDone.value = true
    saveToStorage('ONBOARDING_DONE', true)
  }

  function resetOnboarding() {
    onboardingDone.value = false
    saveToStorage('ONBOARDING_DONE', false)
  }

  return { volume, onboardingDone, setVolume, completeOnboarding, resetOnboarding }
})
