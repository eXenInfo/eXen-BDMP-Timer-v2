import { useTranslationsStore } from '../stores/translationsStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'

/**
 * Composable for translating phase/station texts.
 *
 * Usage:
 *   const { phaseText } = usePhaseText()
 *   // In template: {{ phaseText(stage.name) }}
 *
 * Returns the translation for the current locale, or the original text
 * if no translation is stored.
 */
export function usePhaseText() {
  const translationsStore = useTranslationsStore()
  const settingsStore     = useSettingsStore()

  function phaseText(original) {
    return translationsStore.translate(original, settingsStore.locale)
  }

  return { phaseText }
}
