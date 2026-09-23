/**
 * Hält den Bildschirm wach, solange ein Lauf geöffnet ist.
 * Wird die Sperre verweigert (Browser, Energiesparmodus), läuft alles normal
 * weiter; das Telefon kann dann nur selbst abdunkeln.
 */
import { onMounted, onBeforeUnmount } from 'vue'

export function useWachHalten() {
  let sperre = null

  async function anfordern() {
    try {
      if (document.visibilityState !== 'visible' || !navigator.wakeLock) return
      sperre = await navigator.wakeLock.request('screen')
    } catch { sperre = null }
  }
  const beiSichtbarkeit = () => { if (document.visibilityState === 'visible') anfordern() }

  onMounted(() => {
    anfordern()
    document.addEventListener('visibilitychange', beiSichtbarkeit)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', beiSichtbarkeit)
    try { sperre?.release() } catch { /* bereits frei */ }
    sperre = null
  })
}
