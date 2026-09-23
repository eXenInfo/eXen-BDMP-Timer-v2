/**
 * Installation als App (PWA).
 *
 * Chrome und Edge melden die Installierbarkeit einmal kurz nach dem Laden
 * über 'beforeinstallprompt'. Das Ereignis muss deshalb schon beim Start
 * abgefangen werden, nicht erst, wenn jemand die Hilfe öffnet.
 * Safari kennt das Ereignis nicht; dort bleibt die Anleitung.
 */
import { ref } from 'vue'

const angebot = ref(null)
const installiert = ref(false)

function laeuftAlsApp() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  } catch { return false }
}

export function installierenVorbereiten() {
  if (typeof window === 'undefined') return
  installiert.value = laeuftAlsApp()
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    angebot.value = e
  })
  window.addEventListener('appinstalled', () => {
    installiert.value = true
    angebot.value = null
  })
}

export function useInstallieren() {
  async function jetztInstallieren() {
    const e = angebot.value
    if (!e) return false
    e.prompt()
    const { outcome } = await e.userChoice
    angebot.value = null
    return outcome === 'accepted'
  }
  return { angebot, installiert, jetztInstallieren }
}
