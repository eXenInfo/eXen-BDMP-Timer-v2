/**
 * Gemeinsamer Laufmodus (Aufsicht, Schützenuhr), je Gerät gespeichert.
 *
 * Die Laufansichten schalten die Signalausgabe beim Öffnen stumm, wenn der
 * Modus es verlangt, und beim Verlassen wieder frei. So bleibt zum Beispiel
 * der Probeton unter „Signale und Lautstärke“ immer hörbar.
 */
import { ref } from 'vue'
import { ladeModus, sichereModus, mitTon } from '../core/laufModus.js'
import { ladeSignale } from '../core/signalEinstellungen.js'
import * as audio from '../core/audio.js'

function geraeteSpeicher() {
  try { return window.localStorage } catch { return null }
}

const modus = ref(ladeModus(geraeteSpeicher()))

export function useLaufModus() {
  function setzen(neu) {
    modus.value = sichereModus(geraeteSpeicher(), neu)
  }
  /** Signalausgabe passend zum Modus, `fest` übersteuert den gespeicherten Wert. */
  function tonAnwenden(fest = null) {
    audio.setStumm(!mitTon(fest ?? modus.value))
  }
  function tonFreigeben() { audio.setStumm(false) }
  /** Ob der Ton unter „Signale und Lautstärke“ ausgeschaltet ist. */
  const stummEingestellt = () => ladeSignale(geraeteSpeicher()).stumm
  return { modus, setzen, tonAnwenden, tonFreigeben, stummEingestellt }
}
