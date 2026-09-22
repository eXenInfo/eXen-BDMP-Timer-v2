<script setup>
/** Sprachumschalter. Große Flächen, aktive Sprache klar markiert. */
import { useLocale } from '../composables/useLocale.js'
const { aktuell, setze, sprachen, t } = useLocale()
</script>

<template>
  <div class="sprachwahl">
    <span class="marke">{{ t('v3.allgemein.sprache') }}</span>
    <div class="k-reihe">
      <button
        v-for="s in sprachen" :key="s.code"
        class="k-zweit" :class="{ betont: s.code === aktuell }"
        :aria-pressed="s.code === aktuell"
        @click="setze(s.code)">
        {{ s.kurz }}
        <span class="k-unter">{{ s.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sprachwahl { display: flex; flex-direction: column; gap: 0.4rem; }
.marke { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--f-gedaempft); }
</style>
