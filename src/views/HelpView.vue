<script setup>
/**
 * Hilfe, Regelgrundlage und Rechtliches.
 *
 * Aufklappbare Abschnitte statt einer langen Seite — auf dem Telefon ist
 * ein Inhaltsverzeichnis, das man antippt, schneller als Scrollen.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IMPRESSUM, HAFTUNG, DATENSCHUTZ, REGELGRUNDLAGE, SIGNALE, APP_INFO } from '../core/legal.js'

defineEmits(['schliessen'])
const { t, locale } = useI18n()

const offen = ref('bedienung')
const umschalten = (name) => { offen.value = offen.value === name ? null : name }

const bedienung = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6']
const abschnitte = [
  { id: 'bedienung',      titel: 'v3.hilfe.bedienung' },
  { id: 'signale',        titel: 'v3.hilfe.signale' },
  { id: 'regelgrundlage', titel: 'v3.hilfe.regelgrundlage' },
  { id: 'haftung',        titel: 'v3.hilfe.haftung' },
  { id: 'impressum',      titel: 'v3.hilfe.impressum' },
  { id: 'datenschutz',    titel: 'v3.hilfe.datenschutz' },
  { id: 'ueber',          titel: 'v3.hilfe.ueber' },
]
</script>

<template>
  <div class="hilfe">
    <button class="k-nav" @click="$emit('schliessen')">{{ t('v3.hilfe.zurueck') }}</button>
    <h1>{{ t('v3.hilfe.titel') }}</h1>

    <p v-if="locale !== 'de'" class="sprachhinweis">{{ t('v3.hilfe.rechtstexteDeutsch') }}</p>

    <section v-for="a in abschnitte" :key="a.id" class="block">
      <button class="kopfzeile" :aria-expanded="offen === a.id" @click="umschalten(a.id)">
        <span>{{ t(a.titel) }}</span>
        <span class="zeichen">{{ offen === a.id ? '−' : '+' }}</span>
      </button>

      <div v-if="offen === a.id" class="inhalt">

        <template v-if="a.id === 'bedienung'">
          <div v-for="b in bedienung" :key="b" class="eintrag">
            <strong>{{ t('v3.hilfe.' + b) }}</strong>
            <p>{{ t('v3.hilfe.' + b + 't') }}</p>
          </div>
        </template>

        <template v-else-if="a.id === 'signale'">
          <div v-for="s in SIGNALE" :key="s.name" class="eintrag">
            <strong>{{ s.name }}</strong>
            <p>{{ s.beschreibung }}</p>
          </div>
        </template>

        <template v-else-if="a.id === 'regelgrundlage'">
          <p class="zeile"><span class="feld">{{ t('v3.hilfe.quelle') }}</span>{{ REGELGRUNDLAGE.quelle }}</p>
          <p class="zeile"><span class="feld">{{ t('v3.hilfe.stand') }}</span>{{ REGELGRUNDLAGE.stand }}</p>
          <p class="feld abstand">{{ t('v3.hilfe.verwendeteAbschnitte') }}</p>
          <ul class="regelliste">
            <li v-for="r in REGELGRUNDLAGE.abschnitte" :key="r.ref">
              <span class="regel">{{ r.ref }}</span> {{ r.was }}
            </li>
          </ul>
          <p class="quelle">{{ REGELGRUNDLAGE.url }}</p>
        </template>

        <template v-else-if="a.id === 'haftung'">
          <p v-for="(h, i) in HAFTUNG" :key="i" :class="{ betont: i === 0 }">{{ h }}</p>
        </template>

        <template v-else-if="a.id === 'impressum'">
          <p class="feld">{{ t('v3.hilfe.anbieter') }}</p>
          <p class="anschrift"><template v-for="(z, i) in IMPRESSUM.anbieter" :key="i">{{ z }}<br /></template></p>
          <p>{{ IMPRESSUM.geschaeftsbezeichnung }}</p>

          <p class="feld abstand">{{ t('v3.hilfe.kontakt') }}</p>
          <p class="anschrift">
            {{ IMPRESSUM.kontakt.telefon }}<br />
            {{ IMPRESSUM.kontakt.email }}<br />
            {{ IMPRESSUM.kontakt.web }}
          </p>

          <p class="feld abstand">{{ t('v3.hilfe.ustid') }}</p>
          <p class="anschrift">{{ IMPRESSUM.ustIdNr }}</p>

          <p class="feld abstand">{{ t('v3.hilfe.register') }}</p>
          <p>{{ IMPRESSUM.register }}</p>

          <p class="feld abstand">{{ t('v3.hilfe.redaktionell') }}</p>
          <p>{{ IMPRESSUM.redaktionell }}</p>

          <p class="feld abstand">{{ t('v3.hilfe.streit') }}</p>
          <p>{{ IMPRESSUM.streitbeilegung }}</p>
        </template>

        <template v-else-if="a.id === 'datenschutz'">
          <p v-for="(d, i) in DATENSCHUTZ" :key="i">{{ d }}</p>
        </template>

        <template v-else>
          <p class="zeile"><span class="feld">{{ APP_INFO.name }}</span>{{ APP_INFO.zweck }}</p>
          <p class="zeile"><span class="feld">{{ t('v3.hilfe.lizenz') }}</span>{{ APP_INFO.lizenz }}</p>
          <p class="zeile"><span class="feld">{{ t('v3.hilfe.quelltext') }}</span>{{ APP_INFO.repo }}</p>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hilfe {
  min-height: 100dvh; background: var(--f-grund); color: var(--f-text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding: 0.75rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.6rem; max-width: 44rem; margin: 0 auto;
}
h1 { margin: 0.6rem 0 0.2rem; font-size: 1.6rem; }
.sprachhinweis { margin: 0; padding: 0.6rem 0.8rem; background: var(--f-flaeche); border: 1px dashed var(--f-rand); border-radius: var(--r-klein); color: var(--f-gedaempft); font-size: 0.82rem; line-height: 1.5; }
.block { background: var(--f-flaeche); border: 1px solid var(--f-rand); border-radius: var(--r-mittel); overflow: hidden; }
.kopfzeile {
  width: 100%; min-height: 3.5rem; padding: 0.75rem 1rem; background: transparent;
  color: var(--f-text); border: none; font-family: inherit; font-size: 1.05rem; font-weight: 600;
  display: flex; justify-content: space-between; align-items: center; cursor: pointer; text-align: left;
}
.zeichen { color: var(--f-akzent); font-size: 1.4rem; line-height: 1; }
.inhalt { padding: 0 1rem 1rem; }
.inhalt p { margin: 0 0 0.6rem; font-size: 0.88rem; line-height: 1.6; color: #d7dee6; }
.inhalt p.betont { color: var(--f-text); font-weight: 600; }
.eintrag { margin-bottom: 0.9rem; }
.eintrag strong { display: block; font-size: 0.95rem; margin-bottom: 0.2rem; }
.eintrag p { margin: 0; }
.feld { display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--f-gedaempft); margin-bottom: 0.25rem; }
.zeile .feld { display: inline-block; min-width: 9rem; margin: 0; }
.anschrift { font-style: normal; }
.abstand { margin-top: 0.9rem; }
.regelliste { margin: 0.3rem 0 0.6rem; padding-left: 0; list-style: none; }
.regelliste li { margin: 0.35rem 0; font-size: 0.86rem; line-height: 1.5; color: #d7dee6; }
.regel { display: inline-block; min-width: 3.6rem; font-size: 0.72rem; padding: 0.1rem 0.4rem; margin-right: 0.4rem; border: 1px solid var(--f-rand); border-radius: 0.4rem; color: var(--f-gedaempft); }
.quelle { font-size: 0.76rem; word-break: break-all; color: var(--f-gedaempft); }
</style>
