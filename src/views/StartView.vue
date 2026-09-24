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
  /** Noch nicht gesehene Neuigkeiten: [{ stand, punkte: [Text] }], neueste zuerst. */
  neuigkeiten: { type: Array, default: () => [] },
})
defineEmits(['verstanden', 'waehlen', 'weiter', 'saetze', 'frei', 'signale', 'hilfe', 'starten', 'erstellen'])
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

    <!-- Einmal nach einem Update: was sich geändert hat -->
    <section v-if="neuigkeiten.length" class="neu" aria-labelledby="neu-titel" role="status">
      <h2 id="neu-titel" class="neu-kopf">{{ t('v3.neu.titel') }}</h2>
      <ul class="neu-liste">
        <template v-for="e in neuigkeiten" :key="e.stand">
          <li v-for="(p, i) in e.punkte" :key="e.stand + i">{{ p }}</li>
        </template>
      </ul>
      <button class="k-zweit neu-ok" @click="$emit('verstanden')">{{ t('v3.neu.verstanden') }}</button>
    </section>

    <button class="k-haupt" @click="$emit('waehlen')">
      {{ t('v3.start.disziplinWaehlen') }}
      <span class="k-unter">{{ t('v3.start.disziplinWaehlenUnter', { anzahl, satz: satz.name }) }}</span>
    </button>

    <!-- Direktstart: alles hier beginnt sofort eine Disziplin -->
    <section class="favoriten" aria-labelledby="favoriten-titel">
      <h2 id="favoriten-titel" class="favoriten-kopf">
        <span class="favoriten-stern" aria-hidden="true">★</span>
        {{ t('v3.start.favoriten') }}
        <span v-if="favoriten.length" class="favoriten-zahl">{{ favoriten.length }}/5</span>
      </h2>
      <p class="favoriten-hinweis">
        {{ favoriten.length ? t('v3.start.favoritenHinweis') : t('v3.start.keineFavoriten') }}
      </p>
      <div v-if="favoriten.length" class="favoriten-liste">
        <button v-for="f in favoriten" :key="f.id" class="k-start" @click="$emit('starten', f)">
          <span class="k-start-symbol" aria-hidden="true">▶</span>
          <span class="k-start-text">
            <strong>{{ f.name }}</strong>
            <span class="k-unter">{{ f.phases.length }} {{ f.kind === 'epp' ? t('v3.allgemein.stationen') : t('v3.allgemein.phasen') }}</span>
          </span>
        </button>
      </div>
    </section>

    <button v-if="zuletzt" class="k-start zuletzt" @click="$emit('weiter')">
      <span class="k-start-symbol" aria-hidden="true">▶</span>
      <span class="k-start-text">
        <strong>{{ t('v3.start.weiterMit', { name: zuletzt.name }) }}</strong>
        <span class="k-unter">{{ t('v3.start.zuletztBenutzt') }}</span>
      </span>
    </button>

    <!-- Menü: alles hier öffnet einen anderen Bildschirm -->
    <nav :aria-label="t('v3.start.menue')">
      <p class="rubrik">{{ t('v3.start.menue') }}</p>
      <div class="k-liste">
        <button class="k-menue" @click="$emit('erstellen')">
          <span class="k-menue-text">{{ t('v3.start.disziplinErstellen') }}
            <span class="k-unter">{{ t('v3.start.disziplinErstellenUnter') }}</span></span>
          <span class="k-menue-pfeil" aria-hidden="true">›</span>
        </button>
        <button class="k-menue" @click="$emit('saetze')">
          <span class="k-menue-text">{{ t('v3.start.saetze') }}
            <span class="k-unter">{{ t('v3.start.saetzeUnter') }}</span></span>
          <span class="k-menue-pfeil" aria-hidden="true">›</span>
        </button>
        <button class="k-menue" @click="$emit('frei')">
          <span class="k-menue-text">{{ t('v3.start.frei') }}
            <span class="k-unter">{{ t('v3.start.freiUnter') }}</span></span>
          <span class="k-menue-pfeil" aria-hidden="true">›</span>
        </button>
        <button class="k-menue" @click="$emit('signale')">
          <span class="k-menue-text">{{ t('v3.start.signale') }}
            <span class="k-unter">{{ t('v3.start.signaleUnter') }}</span></span>
          <span class="k-menue-pfeil" aria-hidden="true">›</span>
        </button>
        <button class="k-menue" @click="$emit('hilfe')">
          <span class="k-menue-text">{{ t('v3.start.hilfe') }}
            <span class="k-unter">{{ t('v3.start.hilfeUnter') }}</span></span>
          <span class="k-menue-pfeil" aria-hidden="true">›</span>
        </button>
      </div>
    </nav>

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
  min-height: calc(100dvh - env(safe-area-inset-top)); background: var(--f-grund); color: var(--f-text);
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
.rubrik { margin: 0 0 0.4rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--f-gedaempft); }

/* Neu in dieser Version */
.neu {
  background: var(--f-flaeche); border: 1px solid var(--f-gruen); border-radius: var(--r-gross);
  padding: 0.85rem 0.9rem 0.9rem; display: flex; flex-direction: column; gap: 0.6rem;
}
.neu-kopf { margin: 0; font-size: 1.1rem; font-weight: 700; }
.neu-liste { margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem; line-height: 1.45; }
.neu-ok { width: 100%; }

/* Favoriten: eigener, klar umgrenzter Block */
.favoriten {
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.10), rgba(245, 158, 11, 0.03));
  border: 1px solid rgba(245, 158, 11, 0.55); border-radius: var(--r-gross);
  padding: 0.85rem 0.75rem 0.75rem;
}
.favoriten-kopf { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 700; }
.favoriten-stern { color: var(--f-akzent); font-size: 1.25rem; line-height: 1; }
.favoriten-zahl { margin-left: auto; font-size: 0.78rem; font-weight: 600; color: var(--f-akzent); font-variant-numeric: tabular-nums; }
.favoriten-hinweis { margin: 0.2rem 0 0.7rem; font-size: 0.82rem; color: var(--f-gedaempft); line-height: 1.45; }
.favoriten-liste { display: flex; flex-direction: column; gap: 0.5rem; }
.zuletzt .k-start-symbol { background: transparent; border: 2px solid var(--f-gruen); color: var(--f-gruen); }
.fusszeile { margin: 0.75rem 0 0; text-align: center; font-size: 0.78rem; color: var(--f-gedaempft); }
.fusszeile a { color: var(--f-akzent); }
.hinweis {
  margin: auto 0 0; padding: 0.75rem 0.9rem;
  background: var(--f-flaeche); border: 1px solid var(--f-rand); border-left: 3px solid var(--f-akzent);
  border-radius: var(--r-klein); color: var(--f-gedaempft); font-size: 0.82rem; line-height: 1.55;
}
</style>
