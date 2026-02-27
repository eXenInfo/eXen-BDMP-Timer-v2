import { ref } from 'vue'

let synth = null
let toneLoaded = false

async function initTone() {
  if (toneLoaded) return
  const Tone = await import('tone')
  synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.3 }
  }).toDestination()
  toneLoaded = true
  return Tone
}

export function useAudio(volumeRef) {
  const audioReady = ref(false)

  async function ensureReady() {
    if (audioReady.value) return
    const Tone = await initTone()
    await Tone.start()
    audioReady.value = true
  }

  async function playSignal(durationSeconds = 1) {
    await ensureReady()
    if (!synth) return
    const vol = (volumeRef?.value ?? 80) / 100
    synth.volume.value = 20 * Math.log10(Math.max(0.001, vol))
    synth.triggerAttackRelease('880', durationSeconds)
  }

  async function playWarningSignal() {
    await ensureReady()
    if (!synth) return
    const vol = (volumeRef?.value ?? 80) / 100
    synth.volume.value = 20 * Math.log10(Math.max(0.001, vol))
    // Doppelton als Warnung
    synth.triggerAttackRelease('660', 0.3)
    setTimeout(() => synth.triggerAttackRelease('660', 0.3), 400)
  }

  return { playSignal, playWarningSignal, ensureReady, audioReady }
}
