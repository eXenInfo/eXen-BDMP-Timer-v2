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

  async function playSignal(durationSeconds = 1) {
    await ensureReady()
    if (!synth) return
    _setVolume()
    synth.triggerAttackRelease('880', durationSeconds)
  }

  async function playWarningSignal() {
    await ensureReady()
    if (!synth) return
    _setVolume()
    // Doppelton als Warnung
    synth.triggerAttackRelease('660', 0.3)
    setTimeout(() => synth.triggerAttackRelease('660', 0.3), 400)
  }

  return { playSignal, playWarningSignal, ensureReady, audioReady }
}
