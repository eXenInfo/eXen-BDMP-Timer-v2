<script setup>
/**
 * Wahl der Betriebsart direkt über dem Lauf. Drei gleich große Knöpfe,
 * darunter ein Satz, der sagt, was die gewählte Art bewirkt.
 */
import { useI18n } from 'vue-i18n'
import { MODI } from '../core/laufModus.js'

defineProps({
  modus: { type: String, required: true },
  /** Ton unter „Signale und Lautstärke“ ausgeschaltet. */
  stumm: { type: Boolean, default: false },
})
defineEmits(['wahl'])
const { t } = useI18n()
</script>

<template>
  <div class="modus" role="radiogroup" :aria-label="t('v3.modus.titel')">
    <div class="modus-reihe">
      <button
        v-for="m in MODI" :key="m"
        class="modus-knopf" :class="{ an: m === modus }"
        role="radio" :aria-checked="m === modus"
        @click="$emit('wahl', m)">
        {{ t('v3.modus.' + m) }}
      </button>
    </div>
    <p class="modus-text">{{ t('v3.modus.' + modus + 'Text') }}</p>
    <p v-if="stumm && modus === 'aufsicht'" class="modus-text stumm">{{ t('v3.modus.stummHinweis') }}</p>
  </div>
</template>

<style scoped>
.modus { display: flex; flex-direction: column; gap: 0.4rem; }
.modus-reihe { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem; }
.modus-knopf {
  min-height: 3rem; padding: 0.3rem 0.4rem; font: inherit; font-size: 0.92rem; font-weight: 600; cursor: pointer;
  background: var(--f-flaeche); color: var(--f-gedaempft); border: 1px solid var(--f-rand); border-radius: var(--r-klein);
  line-height: 1.2;
}
.modus-knopf.an { background: var(--f-text); color: var(--f-grund); border-color: var(--f-text); }
.modus-knopf:focus-visible { outline: 2px solid var(--f-akzent); outline-offset: 2px; }
.modus-text { margin: 0; font-size: 0.8rem; line-height: 1.45; color: var(--f-gedaempft); }
.modus-text.stumm { color: var(--f-text); font-weight: 600; }
</style>
