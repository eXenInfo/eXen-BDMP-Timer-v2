import { ref } from 'vue'

// Module-level singletons — shared across all useAudio() instances
let synth = null
let toneLoaded = false
let toneStarted = false  // Tone.start() darf nur einmal pro Browser-Session aufgerufen werden

async function loadTone() {
  // Immer das Tone-Modul zurückgeben (aus Cache nach erstem Import)
  const Tone = await import('tone')
  if (!toneLoaded) {
    synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.3 }
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
   * Spielt `count` kurze Töne (je 0.15 s) mit 400 ms Abstand.
   * count = 1 → ein Ton  (offene Station, Phase-Start/-Ende)
   * count = 2 → zwei Töne (fixe Station, EPP-Finish)
   */
  async function playSignal(count = 1) {
    await ensureReady()
    if (!synth) return
    _setVolume()
    for (let i = 0; i < Math.max(1, count); i++) {
      synth.triggerAttackRelease('880', 0.15)
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 400))
      }
    }
  }

  /**
   * Warnsignal: zwei kurze Töne bei niedrigerer Frequenz.
   * Signalisiert "wenige Sekunden verbleiben" (EPP 2 s Restzeit).
   */
  async function playWarningSignal() {
    await ensureReady()
    if (!synth) return
    _setVolume()
    synth.triggerAttackRelease('660', 0.2)
    setTimeout(() => synth.triggerAttackRelease('660', 0.2), 350)
  }

  return { playSignal, playWarningSignal, ensureReady, audioReady }
}
