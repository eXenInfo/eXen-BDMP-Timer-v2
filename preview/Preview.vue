<script setup>
/**
 * Vorschau-Hülle: Disziplinwahl, Lauf, Sätze und Editor.
 * In der fertigen App übernimmt das die Navigation der Anwendung.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StartView from '../src/views/StartView.vue'
import HelpView from '../src/views/HelpView.vue'
import EppMatchView from '../src/views/EppMatchView.vue'
import SequenceMatchView from '../src/views/SequenceMatchView.vue'
import LibraryView from '../src/views/LibraryView.vue'
import EditorView from '../src/views/EditorView.vue'
import { createLibrary } from '../src/core/library.js'
import { lokalisiereDisziplin } from '../src/core/lokalisierung.js'
import { uebersetze } from '../src/core/textEn.js'
import { EPP_GENERAL_NOTES, EPP_VARIANTEN } from '../src/core/eppRules.js'
import { nominalDurationMs } from '../src/core/legacyImport.js'
import legacy from '../public/disziplinen.json'
import { WEAPON_CLASSES, createDiscipline } from '../src/core/disciplineRules.js'

const { t, locale } = useI18n()

const speicher = (() => {
  try { window.localStorage.setItem('__probe', '1'); window.localStorage.removeItem('__probe'); return window.localStorage }
  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) } }
})()

const bibliothek = createLibrary(speicher, legacy)
const stand = ref(0)                                   // erzwingt Neuberechnung nach Änderungen
const saetze = computed(() => (stand.value, bibliothek.sets()))
const aktiverId = computed(() => (stand.value, bibliothek.activeSetId()))
const aktiverSatz = computed(() => (stand.value, bibliothek.activeSet()))

const schirm = ref('start')                            // start | wahl | lauf | saetze | editor | hilfe
const zuletzt = ref(null)
const gewaehlt = ref(null)
const editorSatzId = ref(null)
const editorSatz = computed(() => saetze.value.find(s => s.id === editorSatzId.value))

const disziplinen = computed(() => aktiverSatz.value.disciplines)
/** Name in der gewählten Sprache — die Bibliothek selbst bleibt deutsch. */
const anzeigeName = (d) => uebersetze(d?.name, locale.value)
/** Die laufende Disziplin vollständig in der gewählten Sprache. */
const gewaehltLokal = computed(() => lokalisiereDisziplin(gewaehlt.value, locale.value))
const eppHinweise = computed(() => (EPP_GENERAL_NOTES).map(h => uebersetze(h, locale.value)))
const eppVarianten = computed(() => EPP_VARIANTEN.map(v => ({
  ...v, label: uebersetze(v.label, locale.value),
  hinweise: (v.hinweise ?? []).map(h => uebersetze(h, locale.value)),
})))
const favoriten = computed(() => (stand.value, bibliothek.favoritenDisziplinen())
  .map(d => ({ ...d, name: uebersetze(d.name, locale.value) })))
/** Zuletzt gelaufene Disziplin mit übersetztem Namen für die Startseite. */
const zuletztAnzeige = computed(() => zuletzt.value
  ? { ...zuletzt.value, name: uebersetze(zuletzt.value.name, locale.value) } : null)
const meldung = ref(null)

function favoritUmschalten(d) {
  if (!bibliothek.favoritUmschalten(d.id)) meldung.value = t('v3.wahl.favoritenVoll')
  else meldung.value = null
  stand.value++
}

function erstellen() {
  const { disziplin, kopieAngelegt } = bibliothek.disziplinAnlegen(
    t('v3.editor.neueDisziplinName'), createDiscipline)
  stand.value++
  meldung.value = kopieAngelegt ? t('v3.wahl.kopieAngelegt') : null
  editorSatzId.value = bibliothek.activeSetId()
  schirm.value = 'editor'
  return disziplin
}

function dauerText(d) {
  if (d.kind === 'epp') return t('v3.wahl.eppKurz')
  const ms = nominalDurationMs(d.phases)
  const m = Math.floor(ms / 60000), s = Math.round((ms % 60000) / 1000)
  const zeit = m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${s} s`
  return `${d.phases.length} ${t('v3.allgemein.phasen')} · ${zeit} ${t('v3.wahl.schiessUndVorlaufzeit')}`
}

function starte(d) { gewaehlt.value = d; zuletzt.value = d; schirm.value = 'lauf' }
function sichern(satz) { bibliothek.save(satz); stand.value++ }
function aktivieren(id) { bibliothek.setActive(id); stand.value++ }
function loeschen(id) { bibliothek.remove(id); stand.value++ }
function bearbeiten(id) { editorSatzId.value = id; schirm.value = 'editor' }
</script>

<template>
  <!-- Startseite -->
  <StartView
    v-if="schirm === 'start'"
    :satz="aktiverSatz" :zuletzt="zuletztAnzeige" :favoriten="favoriten"
    @waehlen="schirm = 'wahl'"
    @weiter="starte(zuletzt)"
    @starten="starte"
    @erstellen="erstellen"
    @saetze="schirm = 'saetze'"
    @hilfe="schirm = 'hilfe'" />

  <!-- Hilfe und Rechtliches -->
  <HelpView v-else-if="schirm === 'hilfe'" @schliessen="schirm = 'start'" />

  <!-- Disziplinwahl -->
  <div v-else-if="schirm === 'wahl'" class="seite">
    <button class="k-nav" @click="schirm = 'start'">{{ t('v3.hilfe.zurueck') }}</button>
    <header class="kopfzeile">
      <h1>{{ t('v3.wahl.titel') }}</h1>
      <p>{{ t('v3.wahl.satzInBenutzung') }}: <strong>{{ aktiverSatz.name }}</strong></p>
    </header>

    <p v-if="meldung" class="meldung">{{ meldung }}</p>

    <div v-for="d in disziplinen" :key="d.id" class="reihe">
      <button class="karte" :class="{ epp: d.kind === 'epp' }" @click="starte(d)">
        <strong>{{ anzeigeName(d) }}</strong>
        <span>{{ dauerText(d) }}</span>
        <span v-if="d.varianten?.length" class="klassen">
          <span v-for="v in d.varianten" :key="v.ruleRef" class="klasse">{{ WEAPON_CLASSES[v.klasse]?.kurz ?? v.klasse }}</span>
        </span>
      </button>
      <button
        class="stern" :class="{ an: bibliothek.istFavorit(d.id) }"
        :title="bibliothek.istFavorit(d.id) ? t('v3.wahl.favoritEntfernen') : t('v3.wahl.favoritSetzen')"
        :aria-pressed="bibliothek.istFavorit(d.id)"
        @click="favoritUmschalten(d)">★</button>
    </div>

    <div class="k-spalte abstand">
      <button class="k-zweit" @click="erstellen">
        {{ t('v3.wahl.disziplinErstellen') }}
        <span class="k-unter">{{ t('v3.wahl.disziplinErstellenUnter') }}</span>
      </button>
      <button class="k-zweit" @click="schirm = 'saetze'">
        {{ t('v3.wahl.verwalten') }}
        <span class="k-unter">{{ t('v3.wahl.verwaltenUnter') }}</span>
      </button>
    </div>
  </div>

  <!-- Lauf -->
  <div v-else-if="schirm === 'lauf'" class="lauf">
    <div class="navleiste">
      <button class="k-nav" @click="schirm = 'wahl'">{{ t('v3.wahl.andereDisziplin') }}</button>
    </div>
    <EppMatchView
      v-if="gewaehlt.kind === 'epp'"
      :phases="gewaehltLokal.phases"
      :varianten="eppVarianten"
      :allgemeine-hinweise="eppHinweise"
      :total-time-ms="gewaehltLokal.totalTimeMs ?? 330000"
      :prep-ms="gewaehltLokal.prepMs ?? 3000" />
    <SequenceMatchView v-else :disziplin="gewaehltLokal" />
  </div>

  <!-- Sätze -->
  <LibraryView
    v-else-if="schirm === 'saetze'"
    :sets="saetze" :active-id="aktiverId"
    @aktivieren="aktivieren" @sichern="sichern" @loeschen="loeschen"
    @bearbeiten="bearbeiten" @schliessen="schirm = 'start'" />

  <!-- Editor -->
  <EditorView
    v-else-if="schirm === 'editor' && editorSatz"
    :satz="editorSatz"
    @sichern="s => { sichern(s); schirm = 'saetze' }"
    @schliessen="schirm = 'saetze'" />
</template>

<style scoped>
.seite {
  min-height: 100dvh; background: var(--f-grund); color: var(--f-text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding: 1.25rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.5rem; max-width: 44rem; margin: 0 auto;
}
.kopfzeile h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.kopfzeile p { margin: 0 0 0.75rem; color: var(--f-gedaempft); font-size: 0.9rem; }
.kopfzeile strong { color: var(--f-text); }
.karte {
  width: 100%; text-align: left; background: var(--f-flaeche); border: 1px solid var(--f-rand);
  border-radius: var(--r-mittel); padding: 0.9rem 1rem; color: inherit; cursor: pointer;
  display: flex; flex-direction: column; gap: 0.2rem; min-height: 3.9rem; font-family: inherit;
}
.karte strong { font-size: 1.05rem; }
.karte span { color: var(--f-gedaempft); font-size: 0.82rem; }
.karte.epp { border-left: 4px solid var(--f-akzent); }
.reihe { display: grid; grid-template-columns: 1fr auto; gap: 0.4rem; align-items: stretch; }
.stern {
  min-width: 3.25rem; background: var(--f-flaeche); border: 1px solid var(--f-rand);
  border-radius: var(--r-mittel); color: #3d4653; font-size: 1.5rem; cursor: pointer; line-height: 1;
}
.stern.an { color: var(--f-akzent); border-color: var(--f-akzent); }
.meldung { margin: 0 0 0.25rem; padding: 0.6rem 0.8rem; background: #3b1d05; border: 1px solid #7c4a08; border-radius: var(--r-klein); color: var(--f-akzent); font-size: 0.85rem; line-height: 1.5; }
.klassen { display: flex; gap: 0.3rem; margin-top: 0.3rem; }
.klasse { background: var(--f-flaeche-hoch); border: 1px solid var(--f-rand); border-radius: 0.35rem; padding: 0.1rem 0.4rem; font-size: 0.68rem; letter-spacing: 0.03em; color: var(--f-akzent); }
.karte:active { border-color: var(--f-akzent); }
.abstand { margin-top: 1rem; }
.lauf { display: flex; flex-direction: column; }
.navleiste { padding: 0.75rem 0.75rem 0; background: var(--f-grund); max-width: 44rem; margin: 0 auto; width: 100%; box-sizing: border-box; }
</style>
