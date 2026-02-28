import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadFromStorage, saveToStorage } from '../services/storage.js'
import { i18n } from '../i18n.js'

function detectLocale() {
  const stored = loadFromStorage('LOCALE', null)
  if (stored) return stored
  return (navigator.language || '').startsWith('de') ? 'de' : 'en'
}

export const useSettingsStore = defineStore('settings', () => {
  const volume = ref(loadFromStorage('VOLUME', 80))
  const onboardingDone = ref(loadFromStorage('ONBOARDING_DONE', false))
  const locale = ref(detectLocale())

  function setVolume(val) {
    volume.value = Math.max(0, Math.min(100, val))
    saveToStorage('VOLUME', volume.value)
  }

  function setLocale(val) {
    locale.value = val
    saveToStorage('LOCALE', val)
    i18n.global.locale.value = val
  }

  function completeOnboarding() {
    onboardingDone.value = true
    saveToStorage('ONBOARDING_DONE', true)
  }

  function resetOnboarding() {
    onboardingDone.value = false
    saveToStorage('ONBOARDING_DONE', false)
  }

  return { volume, onboardingDone, locale, setVolume, setLocale, completeOnboarding, resetOnboarding }
})
