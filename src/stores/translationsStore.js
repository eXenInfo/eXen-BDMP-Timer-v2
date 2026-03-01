import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadFromStorage, saveToStorage } from '../services/storage.js'

const STORAGE_KEY = 'PHASE_TEXT_MAP'

export const useTranslationsStore = defineStore('translations', () => {
  // textMap: { [originalText: string]: { en?: string } }
  const textMap = ref(loadFromStorage(STORAGE_KEY, {}))

  /**
   * Returns the translated text for the given locale.
   * Falls back to original if no translation is set.
   */
  function translate(original, locale) {
    if (!original) return original
    const entry = textMap.value[original]
    if (!entry) return original
    return entry[locale] || original
  }

  /**
   * Sets a translation for one locale and persists immediately.
   */
  function setTranslation(original, locale, text) {
    if (!original) return
    textMap.value[original] = { ...(textMap.value[original] ?? {}), [locale]: text }
    saveToStorage(STORAGE_KEY, textMap.value)
  }

  /**
   * Clears all translations.
   */
  function reset() {
    textMap.value = {}
    saveToStorage(STORAGE_KEY, {})
  }

  return { textMap, translate, setTranslation, reset }
})
