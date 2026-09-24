<script setup>
/**
 * Schützenuhr mit frei gewählter Zeit — der Ersatz für den Küchentimer.
 * Immer ohne Ton und ohne Farbwechsel, damit sie im Wettkampf mitlaufen darf.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['oeffnen', 'schliessen'])
const { t } = useI18n()

const VORSCHLAEGE = [12, 20, 35, 90, 150, 165]
const sekunden = ref(165)

function oeffnen() {
  const s = Math.max(1, Math.min(3600, Math.round(Number(sekunden.value) || 0)))
  emit('oeffnen', s)
}
function mmss(s) {
  const n = Math.max(0, Math.round(Number(s) || 0))
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')} min`
}
</script>

<template>
  <div class="frei">
    <button class="k-nav" @click="emit('schliessen')">{{ t('v3.hilfe.zurueck') }}</button>
    <h1>{{ t('v3.frei.titel') }}</h1>
    <p class="unter">{{ t('v3.frei.untertitel') }}</p>

    <section class="block">
      <label class="e-marke" for="frei-sekunden">{{ t('v3.frei.dauer') }}</label>
      <div class="eingabe">
        <input id="frei-sekunden" class="e-feld zahl" type="number" inputmode="numeric" min="1" max="3600" v-model="sekunden" />
        <span class="einheit">s</span>
      </div>
      <p class="umrechnung">= {{ mmss(sekunden) }}</p>
      <div class="vorschlaege">
        <button
          v-for="v in VORSCHLAEGE" :key="v"
          class="vorschlag" :class="{ aktiv: Number(sekunden) === v }" :aria-pressed="Number(sekunden) === v"
          @click="sekunden = v">{{ v }} s</button>
      </div>
    </section>

    <button class="k-haupt" :disabled="!(Number(sekunden) > 0)" @click="oeffnen">
      {{ t('v3.frei.oeffnen') }}
      <span class="k-unter">{{ t('v3.frei.oeffnenUnter') }}</span>
    </button>

    <p class="regel">{{ t('v3.frei.regel') }}</p>
  </div>
</template>

<style scoped>
.frei {
  min-height: calc(100dvh - env(safe-area-inset-top)); background: var(--f-grund); color: var(--f-text); box-sizing: border-box;
  padding: 0.75rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.9rem; max-width: 40rem; margin: 0 auto;
}
h1 { margin: 0.6rem 0 0; font-size: 1.6rem; }
.unter { margin: -0.4rem 0 0; color: var(--f-gedaempft); font-size: 0.9rem; line-height: 1.5; }
.block { background: var(--f-flaeche); border: 1px solid var(--f-rand); border-radius: var(--r-mittel); padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
.eingabe { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0.6rem; }
.zahl { font-size: 2.2rem; font-weight: 700; text-align: center; font-variant-numeric: tabular-nums; min-height: 4rem; }
.einheit { font-size: 1.4rem; color: var(--f-gedaempft); }
.umrechnung { margin: 0; text-align: center; color: var(--f-gedaempft); font-variant-numeric: tabular-nums; }
.vorschlaege { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.vorschlag {
  min-height: 3.25rem; font: inherit; font-size: 1rem; font-variant-numeric: tabular-nums; cursor: pointer;
  background: var(--f-flaeche-hoch); color: var(--f-text); border: 1px solid var(--f-rand); border-radius: var(--r-klein);
}
.vorschlag.aktiv { background: var(--f-text); color: var(--f-grund); border-color: var(--f-text); font-weight: 700; }
.vorschlag:focus-visible { outline: 2px solid var(--f-akzent); outline-offset: 2px; }
.regel { margin: 0; font-size: 0.82rem; line-height: 1.5; color: var(--f-gedaempft); }
</style>
