import { createApp } from 'vue'
import { i18n } from '../src/i18n.js'
import '../src/styles/bedienung.css'
import App from '../src/App.vue'
import { ladeSignale, wendeSignaleAn } from '../src/core/signalEinstellungen.js'
import { installierenVorbereiten } from '../src/composables/useInstallieren.js'

function geraeteSpeicher() {
  try { return window.localStorage } catch { return null }
}
wendeSignaleAn(ladeSignale(geraeteSpeicher()))
installierenVorbereiten()

createApp(App).use(i18n).mount('#app')
