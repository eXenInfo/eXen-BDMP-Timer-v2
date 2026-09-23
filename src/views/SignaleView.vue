<script setup>
/**
 * Signale und Lautstärke. Vor dem ersten Lauf am Stand einmal abhören:
 * Das Startsignal muss durch Gehörschutz und Umgebungslärm eindeutig sein.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as audio from '../core/audio.js'
import {
  ladeSignale, sichereSignale, wendeSignaleAn,
  LAUTSTAERKE_MIN, LAUTSTAERKE_MAX, START_LAENGEN_MS, START_STANDARD_MS,
} from '../core/signalEinstellungen.js'

defineEmits(['schliessen'])
const { t } = useI18n()

function geraeteSpeicher() {
  try { return window.localStorage } catch { return null }
}
const speicher = geraeteSpeicher()

const werte = ref(ladeSignale(speicher))

function uebernehmen(neu) {
  werte.value = sichereSignale(speicher, { ...werte.value, ...neu })
  wendeSignaleAn(werte.value)
}

async function probe() {
  await audio.arm()
  audio.probeStartSignal(werte.value.startMs)
}

const lauter = () => uebernehmen({ lautstaerke: werte.value.lautstaerke + 10 })
const leiser = () => uebernehmen({ lautstaerke: werte.value.lautstaerke - 10 })
async function laengeWaehlen(ms) { uebernehmen({ startMs: ms }); await probe() }
</script>

<template>
  <div class="signale">
    <button class="k-nav" @click="$emit('schliessen')">{{ t('v3.hilfe.zurueck') }}</button>
    <h1>{{ t('v3.signale.titel') }}</h1>
    <p class="unter">{{ t('v3.signale.untertitel') }}</p>

    <section class="block" aria-labelledby="stumm-titel">
      <h2 id="stumm-titel" class="marke">{{ t('v3.signale.ton') }}</h2>
      <label class="e-schalter stumm-schalter" for="stumm">
        <input id="stumm" type="checkbox" :checked="werte.stumm" @change="uebernehmen({ stumm: $event.target.checked })" />
        <span class="stumm-text">
          <strong>{{ t('v3.signale.stumm') }}</strong>
          <span class="k-unter">{{ t('v3.signale.stummUnter') }}</span>
        </span>
      </label>
      <p v-if="werte.stumm" class="hinweis stumm-an">{{ t('v3.signale.stummAn') }}</p>
    </section>

    <section class="block" aria-labelledby="laut-titel">
      <h2 id="laut-titel" class="marke">{{ t('v3.signale.lautstaerke') }}</h2>
      <div class="laut-reihe">
        <button class="k-zweit stufe" :disabled="werte.lautstaerke <= LAUTSTAERKE_MIN" :aria-label="t('v3.signale.leiser')" @click="leiser">−</button>
        <output class="laut-wert" for="lautstaerke">{{ werte.lautstaerke }} %</output>
        <button class="k-zweit stufe" :disabled="werte.lautstaerke >= LAUTSTAERKE_MAX" :aria-label="t('v3.signale.lauter')" @click="lauter">+</button>
      </div>
      <input
        id="lautstaerke" class="regler" type="range"
        :min="LAUTSTAERKE_MIN" :max="LAUTSTAERKE_MAX" step="5"
        :value="werte.lautstaerke" :aria-label="t('v3.signale.lautstaerke')"
        @input="uebernehmen({ lautstaerke: Number($event.target.value) })" />
      <p class="hinweis">{{ t('v3.signale.minimum') }}</p>
    </section>

    <section class="block" aria-labelledby="laenge-titel">
      <h2 id="laenge-titel" class="marke">{{ t('v3.signale.laenge') }}</h2>
      <div class="laengen">
        <button
          v-for="ms in START_LAENGEN_MS" :key="ms"
          class="laenge" :class="{ aktiv: ms === werte.startMs }" :aria-pressed="ms === werte.startMs"
          @click="laengeWaehlen(ms)">
          {{ ms }} ms
          <span v-if="ms === START_STANDARD_MS" class="standard">{{ t('v3.signale.standard') }}</span>
        </button>
      </div>
      <p class="hinweis">{{ t('v3.epp.signalprobeHinweis') }}</p>
    </section>

    <button class="k-haupt" @click="probe">
      {{ t('v3.signale.probe') }}
      <span class="k-unter">{{ t('v3.signale.probeUnter', { ms: werte.startMs, prozent: werte.lautstaerke }) }}</span>
    </button>

    <p class="geraet">{{ t('v3.signale.geraet') }}</p>
  </div>
</template>

<style scoped>
.signale {
  min-height: 100dvh; background: var(--f-grund); color: var(--f-text);
  padding: 0.75rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.9rem; max-width: 40rem; margin: 0 auto; box-sizing: border-box;
}
h1 { margin: 0.6rem 0 0; font-size: 1.6rem; }
.unter { margin: -0.4rem 0 0; color: var(--f-gedaempft); font-size: 0.9rem; line-height: 1.5; }
.block { background: var(--f-flaeche); border: 1px solid var(--f-rand); border-radius: var(--r-mittel); padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.marke { margin: 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--f-gedaempft); }
.laut-reihe { display: grid; grid-template-columns: 4rem 1fr 4rem; align-items: center; gap: 0.75rem; }
.stufe { font-size: 1.8rem; font-weight: 700; padding: 0; }
.laut-wert { text-align: center; font-size: 2.4rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.regler { width: 100%; height: 2.5rem; accent-color: var(--f-akzent); }
.laengen { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.laenge {
  min-height: 3.5rem; font: inherit; font-size: 1rem; font-variant-numeric: tabular-nums; cursor: pointer;
  background: var(--f-flaeche-hoch); color: var(--f-text); border: 1px solid var(--f-rand); border-radius: var(--r-klein);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.1rem;
}
.laenge.aktiv { background: var(--f-akzent); color: #1a1205; border-color: var(--f-akzent); font-weight: 700; }
.standard { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; }
.laenge:focus-visible { outline: 2px solid var(--f-akzent); outline-offset: 2px; }
.hinweis { margin: 0; color: var(--f-gedaempft); font-size: 0.8rem; line-height: 1.5; }
.stumm-schalter { min-height: 3.75rem; }
.stumm-text { display: flex; flex-direction: column; gap: 0.15rem; }
.stumm-an { color: var(--f-text); }
.geraet { margin: 0; text-align: center; color: var(--f-gedaempft); font-size: 0.8rem; }
</style>
