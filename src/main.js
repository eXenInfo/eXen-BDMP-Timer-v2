import { createApp } from 'vue'
import './styles/bedienung.css'
import App from './App.vue'
import { i18n } from './i18n.js'
import { ladeSignale, wendeSignaleAn } from './core/signalEinstellungen.js'
import { installierenVorbereiten } from './composables/useInstallieren.js'

/** Gespeicherte Lautstärke und Signallänge gelten ab dem ersten Ton. */
function geraeteSpeicher() {
  try { return window.localStorage } catch { return null }
}
wendeSignaleAn(ladeSignale(geraeteSpeicher()))
installierenVorbereiten()

createApp(App)
  .use(i18n)
  .mount('#app')
