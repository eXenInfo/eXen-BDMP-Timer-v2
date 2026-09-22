/**
 * Sprachumschaltung.
 *
 * Nutzt die vorhandene vue-i18n-Einrichtung und merkt sich die Wahl.
 * Neue Sprachen brauchen keinen Codeeingriff: eine weitere Datei unter
 * src/locales/ anlegen, in src/i18n.js registrieren und hier eintragen.
 *
 * Regeltexte aus der Sportordnung sind davon nicht betroffen — sie werden
 * in deutscher Sprache veröffentlicht. Eigene Übersetzungen dafür liegen im
 * Übersetzungsspeicher und lassen sich in der App pflegen.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { saveToStorage } from '../services/storage.js'

export const SPRACHEN = [
  { code: 'de', kurz: 'DE', name: 'Deutsch' },
  { code: 'en', kurz: 'EN', name: 'English' },
]

export function useLocale() {
  const { locale, t } = useI18n()
  const aktuell = computed(() => locale.value)
  const istDeutsch = computed(() => locale.value === 'de')

  function setze(code) {
    if (!SPRACHEN.some(s => s.code === code)) return
    locale.value = code
    try { saveToStorage('LOCALE', code) } catch { /* Speicher gesperrt, egal */ }
  }

  return { locale, aktuell, istDeutsch, setze, sprachen: SPRACHEN, t }
}
