<script setup>
/**
 * Vorschau-Hülle: Disziplin wählen, dann in den Wettkampfmodus.
 * Dient zum Abnehmen der Oberfläche; in der fertigen App übernimmt das
 * die Navigation der Anwendung.
 */
import { computed, ref } from 'vue'
import EppMatchView from '../src/views/EppMatchView.vue'
import SequenceMatchView from '../src/views/SequenceMatchView.vue'
import { convertLegacyCollection, nominalDurationMs } from '../src/core/legacyImport.js'
import { EPP_PHASES, EPP_TOTAL_TIME_MS } from '../src/core/eppRules.js'
import legacy from '../public/disziplinen.json'

const sequenzen = convertLegacyCollection(legacy)
  .filter(d => d.kind === 'sequence')
  .sort((a, b) => a.name.localeCompare(b.name, 'de'))

const gewaehlt = ref(null)

const dauerText = (phases) => {
  const ms = nominalDurationMs(phases)
  const m = Math.floor(ms / 60000), s = Math.round((ms % 60000) / 1000)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${s} s`
}
const aktuell = computed(() => gewaehlt.value)
</script>

<template>
  <div v-if="!aktuell" class="wahl">
    <header class="kopfzeile">
      <h1>Wettkampfmodus</h1>
      <p>Disziplin wählen. Die Zeiten laufen auf dem neuen, regelgeprüften Kern.</p>
    </header>

    <button class="karte epp" @click="gewaehlt = { kind: 'epp' }">
      <strong>Europäischer Präzisions Parcours</strong>
      <span>7 Stationen · 50 Schuss · 5:30 Gesamtzeit · C.17</span>
    </button>

    <p class="rubrik">Standard-Disziplinen</p>
    <button v-for="d in sequenzen" :key="d.name" class="karte" @click="gewaehlt = { kind: 'seq', d }">
      <strong>{{ d.name }}</strong>
      <span>{{ d.phases.length }} Phasen · {{ dauerText(d.phases) }} Schieß- und Vorlaufzeit</span>
    </button>
  </div>

  <div v-else class="lauf">
    <button class="zurueck" @click="gewaehlt = null">← Andere Disziplin</button>
    <EppMatchView v-if="aktuell.kind === 'epp'" :phases="EPP_PHASES" :total-time-ms="EPP_TOTAL_TIME_MS" />
    <SequenceMatchView v-else :name="aktuell.d.name" :phases="aktuell.d.phases" />
  </div>
</template>

<style scoped>
.wahl {
  min-height: 100dvh; background: #0b0d10; color: #f2f5f8;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding: 1.25rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.5rem; max-width: 42rem; margin: 0 auto;
}
.kopfzeile h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.kopfzeile p { margin: 0 0 0.75rem; color: #9aa6b4; font-size: 0.9rem; line-height: 1.5; }
.rubrik { margin: 1rem 0 0.25rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #9aa6b4; }
.karte {
  width: 100%; text-align: left; background: #15191f; border: 1px solid #262c35;
  border-radius: 0.85rem; padding: 0.85rem 1rem; color: inherit; cursor: pointer;
  display: flex; flex-direction: column; gap: 0.2rem; min-height: 3.75rem;
}
.karte strong { font-size: 1.05rem; }
.karte span { color: #9aa6b4; font-size: 0.82rem; }
.karte:active { border-color: #f59e0b; }
.karte.epp { border-left: 4px solid #f59e0b; }
.lauf { position: relative; }
.zurueck {
  position: absolute; top: 0.4rem; left: 50%; transform: translateX(-50%); z-index: 5;
  background: rgba(21,25,31,0.9); color: #9aa6b4; border: 1px solid #262c35;
  border-radius: 999px; padding: 0.25rem 0.8rem; font-size: 0.75rem; cursor: pointer;
}
</style>
