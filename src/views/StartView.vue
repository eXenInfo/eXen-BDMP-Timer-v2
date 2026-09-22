<script setup>
/**
 * Startseite. Zeigt in einem Blick, womit gearbeitet wird, und führt mit
 * einer Hauptaktion weiter. Der Hinweis unten ist kein Kleingedrucktes,
 * sondern die Kernaussage: Der Timer ist ein Hilfsmittel, entschieden wird
 * nach der Sportordnung.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SprachWahl from '../components/SprachWahl.vue'
import { APP_INFO, DANKESCHOEN } from '../core/legal.js'

const props = defineProps({
  satz:      { type: Object, required: true },
  zuletzt:   { type: Object, default: null },
  favoriten: { type: Array,  default: () => [] },
})
defineEmits(['waehlen', 'weiter', 'saetze', 'hilfe', 'starten', 'erstellen'])
const { t } = useI18n()

const anzahl = computed(() => props.satz.disciplines.length)
</script>

<template>
  <div class="start">
    <header class="kopf">
      <p class="marke">eXen<span class="pipe">|</span></p>
      <h1>{{ APP_INFO.name.replace('eXen ', '') }}</h1>
      <p class="unter">{{ t('v3.start.untertitel') }}</p>
    </header>

    <div class="k-spalte">
      <button class="k-haupt" @click="$emit('waehlen')">
        {{ t('v3.start.disziplinWaehlen') }}
        <span class="k-unter">{{ t('v3.start.disziplinWaehlenUnter', { anzahl, satz: satz.name }) }}</span>
      </button>

      <template v-if="favoriten.length">
        <p class="rubrik">{{ t('v3.start.favoriten') }}</p>
        <button v-for="f in favoriten" :key="f.id" class="k-zweit favorit" @click="$emit('starten', f)">
          {{ f.name }}
          <span class="k-unter">{{ f.phases.length }} {{ f.kind === 'epp' ? t('v3.allgemein.stationen') : t('v3.allgemein.phasen') }}</span>
        </button>
      </template>

      <button v-if="zuletzt" class="k-zweit betont" @click="$emit('weiter')">
        {{ t('v3.start.weiterMit', { name: zuletzt.name }) }}
        <span class="k-unter">{{ t('v3.start.zuletztBenutzt') }}</span>
      </button>

      <button class="k-zweit" @click="$emit('erstellen')">
        {{ t('v3.start.disziplinErstellen') }}
        <span class="k-unter">{{ t('v3.start.disziplinErstellenUnter') }}</span>
      </button>

      <button class="k-zweit" @click="$emit('saetze')">
        {{ t('v3.start.saetze') }}
        <span class="k-unter">{{ t('v3.start.saetzeUnter') }}</span>
      </button>

      <button class="k-zweit" @click="$emit('hilfe')">
        {{ t('v3.start.hilfe') }}
        <span class="k-unter">{{ t('v3.start.hilfeUnter') }}</span>
      </button>
    </div>

    <SprachWahl class="sprache" />

    <p class="hinweis">{{ t('v3.start.hinweisKurz') }}</p>

    <p class="fusszeile">
      © Thomas Köhler ·
      <a :href="DANKESCHOEN.url" target="_blank" rel="noopener noreferrer">{{ DANKESCHOEN.label }}</a>
    </p>
  </div>
</template>

<style scoped>
.start {
  min-height: 100dvh; background: var(--f-grund); color: var(--f-text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding: 2rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 1.25rem; max-width: 40rem; margin: 0 auto;
}
.kopf { text-align: center; }
.marke { margin: 0; font-size: 1.15rem; letter-spacing: 0.02em; color: var(--f-akzent); font-weight: 700; }
.pipe { color: var(--f-text); margin-left: 0.1rem; }
.kopf h1 { margin: 0.2rem 0 0.35rem; font-size: 2rem; line-height: 1.15; }
.unter { margin: 0; color: var(--f-gedaempft); font-size: 0.95rem; line-height: 1.5; }
.sprache { margin-top: 0.5rem; }
.rubrik { margin: 0.4rem 0 -0.2rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--f-gedaempft); }
.favorit { border-left: 3px solid var(--f-akzent); }
.fusszeile { margin: 0.75rem 0 0; text-align: center; font-size: 0.78rem; color: var(--f-gedaempft); }
.fusszeile a { color: var(--f-akzent); }
.hinweis {
  margin: auto 0 0; padding: 0.75rem 0.9rem;
  background: var(--f-flaeche); border: 1px solid var(--f-rand); border-left: 3px solid var(--f-akzent);
  border-radius: var(--r-klein); color: var(--f-gedaempft); font-size: 0.82rem; line-height: 1.55;
}
</style>
