/**
 * Bindeglied zwischen dem reinen Zeitkern und Vue.
 *
 * Der Kern rechnet nicht selbst — hier wird er getaktet und sein
 * Ereignisstrom in Ton und Anzeige übersetzt. Getaktet wird über
 * requestAnimationFrame; wird der Tab gedrosselt, korrigiert sich der Kern
 * beim nächsten Takt von selbst, weil er gegen die übergebene Zeit rechnet
 * und nicht gegen die Anzahl der Takte.
 */
import { ref, shallowRef, onUnmounted } from 'vue'

export const now = () => performance.now()

export function useEngineClock({ onEvents } = {}) {
  const engine   = shallowRef(null)
  const snapshot = ref(null)
  const laeuft   = ref(false)

  let rafId = null
  let wakeLock = null

  function refresh() {
    if (engine.value) snapshot.value = engine.value.snapshot(now())
  }

  function handle(events) {
    if (events?.length && onEvents) onEvents(events)
    refresh()
  }

  function frame() {
    if (!engine.value) return
    handle(engine.value.tick(now()))
    rafId = requestAnimationFrame(frame)
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen')
        wakeLock.addEventListener('release', () => { wakeLock = null })
      }
    } catch { /* nicht überall verfügbar, kein Grund zum Abbruch */ }
  }

  function releaseWakeLock() {
    try { wakeLock?.release() } catch { /* egal */ }
    wakeLock = null
  }

  function start() {
    if (laeuft.value) return
    laeuft.value = true
    requestWakeLock()
    rafId = requestAnimationFrame(frame)
  }

  function stop() {
    laeuft.value = false
    releaseWakeLock()
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }

  /** Ruft eine Kernfunktion auf und verarbeitet ihre Ereignisse. */
  function call(name, ...args) {
    if (!engine.value?.[name]) return
    handle(engine.value[name](...args, ))
  }

  function setEngine(e) {
    engine.value = e
    refresh()
  }

  // Kommt der Tab aus dem Hintergrund zurück, sofort nachrechnen.
  const onVisible = () => { if (document.visibilityState === 'visible' && engine.value) handle(engine.value.tick(now())) }
  document.addEventListener('visibilitychange', onVisible)

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisible)
  })

  return { engine, snapshot, laeuft, setEngine, start, stop, call, refresh }
}
