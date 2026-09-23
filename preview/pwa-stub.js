/**
 * Ersatz für 'virtual:pwa-register/vue' in der Einzeldatei-Vorschau.
 * Die Vorschau hat keinen Service Worker, also gibt es nie ein Update.
 */
import { ref } from 'vue'

export function useRegisterSW() {
  return { needRefresh: ref(false), offlineReady: ref(false), updateServiceWorker: () => {} }
}
