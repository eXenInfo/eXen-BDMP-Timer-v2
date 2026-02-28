import { ref } from 'vue'

// ── Module-level singletons ──────────────────────────────────────────────────
// The beforeinstallprompt event fires at most once per session.
// We capture it at module load time so any component can react to it.

const deferredPrompt = ref(null)
const isInstallable  = ref(false)
const isInstalled    = ref(false)

// Chrome / Edge / Android: native install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  isInstallable.value  = true
})

// Fires after a successful install (Add to Home Screen)
window.addEventListener('appinstalled', () => {
  isInstalled.value    = true
  isInstallable.value  = false
  deferredPrompt.value = null
})

// Already running in standalone mode (installed PWA)
if (window.matchMedia('(display-mode: standalone)').matches) {
  isInstalled.value   = true
  isInstallable.value = false
}

// ── Exported composable ──────────────────────────────────────────────────────
export function usePWAInstall() {
  // iOS / iPadOS detection (no beforeinstallprompt, manual Add-to-Home-Screen)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window)

  async function install() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    isInstallable.value  = false
    return outcome // 'accepted' | 'dismissed'
  }

  return { isInstallable, isInstalled, isIOS, install }
}
