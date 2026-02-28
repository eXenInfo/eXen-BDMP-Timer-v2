import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import { loadFromStorage } from './services/storage.js'

function detectLocale() {
  const stored = loadFromStorage('LOCALE', null)
  if (stored) return stored
  return (navigator.language || '').startsWith('de') ? 'de' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { de, en }
})
