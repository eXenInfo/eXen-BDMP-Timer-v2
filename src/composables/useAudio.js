import { ref } from 'vue'

// Module-level singletons — shared across all useAudio() instances
let synth = null
let toneLoaded = false
let toneStarted = false  // Tone.start() darf nur einmal pro Browser-Session aufgerufen werden

async function loadTone() {
  // Immer das Tone-Modul zurückgeben (aus Cache nach erstem Import)
  const Tone = await import('tone')
  if (!toneLoaded) {
    // Square-Wave: schneidender, auf Schießstand auch ohne Kopfhörer gut hörbar
    synth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.05, sustain: 1, release: 0.05 }
    }).toDestination()
    toneLoaded = true
  }
  return Tone
}

export function useAudio(volumeRef) {
  const audioReady = ref(toneStarted)  // Initial von Modul-State

  async function ensureReady() {
    if (toneStarted) {
      audioReady.value = true
      return
    }
    const Tone = await loadTone()
    await Tone.start()
    toneStarted = true
    audioReady.value = true
  }

  function _setVolume() {
    if (!synth) return
    const vol = (volumeRef?.value ?? 80) / 100
    synth.volume.value = 20 * Math.log10(Math.max(0.001, vol))
  }

  /**
   * Spielt `count` Töne (je 0.4 s @ 880 Hz) mit 350 ms Pause dazwischen.
   * count = 1 → ein Ton  (offene Station, Phase-Start)
   * count = 2 → zwei Töne (fixe Station-Start, Station-Ende, EPP-Finish)
   */
  async function playSignal(count = 1) {
    await ensureReady()
    if (!synth) return
    _setVolume()
    for (let i = 0; i < Math.max(1, count); i++) {
      synth.triggerAttackRelease('A5', 0.4)   // 880 Hz, 0.4 s — wie Original-App
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 750))
      }
    }
  }

  /**
   * Warnsignal: drei kurze Töne bei niedrigerer Frequenz (440 Hz / A4).
   * Signalisiert "wenige Sekunden verbleiben" (EPP: 2 s Restzeit).
   * Dreifaches Piepen klar vom normalen Startsignal unterscheidbar.
   */
  async function playWarningSignal() {
    await ensureReady()
    if (!synth) return
    _setVolume()
    synth.triggerAttackRelease('A4', 0.2)
    setTimeout(() => synth.triggerAttackRelease('A4', 0.2), 350)
    setTimeout(() => synth.triggerAttackRelease('A4', 0.2), 700)
  }

  return { playSignal, playWarningSignal, ensureReady, audioReady }
}
