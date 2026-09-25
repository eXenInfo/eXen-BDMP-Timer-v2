<script setup>
/**
 * Hauptoberfläche der App: Startseite, Disziplinwahl, Lauf, Sätze, Editor, Hilfe.
 * Dieselbe Datei läuft in der installierbaren App und in der Einzeldatei-Vorschau
 * (preview/), damit beide immer denselben Stand zeigen.
 */
import { computed, markRaw, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StartView from './views/StartView.vue'
import HelpView from './views/HelpView.vue'
import SignaleView from './views/SignaleView.vue'
import EppMatchView from './views/EppMatchView.vue'
import SequenceMatchView from './views/SequenceMatchView.vue'
import LibraryView from './views/LibraryView.vue'
import EditorView from './views/EditorView.vue'
import RoTexteView from './views/RoTexteView.vue'
import FreieZeitView from './views/FreieZeitView.vue'
import { freieZeitDisziplin, eppGesamtzeitDisziplin } from './core/laufModus.js'
import { useLaufModus } from './composables/useLaufModus.js'
import { createLibrary, fetchDaten } from './core/library.js'
import { lokalisiereDisziplin } from './core/lokalisierung.js'
import { uebersetze } from './core/textEn.js'
import { EPP_GENERAL_NOTES, EPP_VARIANTEN } from './core/eppRules.js'
import { nominalDurationMs } from './core/legacyImport.js'
import legacy from '../public/disziplinen.json'
import { WEAPON_CLASSES, createDiscipline, enrichDiscipline } from './core/disciplineRules.js'
import PWAUpdateToast from './components/ui/PWAUpdateToast.vue'
import { offeneNeuigkeiten, neuigkeitenGesehen, punkteIn } from './core/neuigkeiten.js'

const { t, locale } = useI18n()

const speicher = (() => {
  try { window.localStorage.setItem('__probe', '1'); window.localStorage.removeItem('__probe'); return window.localStorage }
  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) } }
})()

const bibliothek = createLibrary(speicher, legacy)

/** „Neu in dieser Version“, einmal nach einem Update. */
const neuOffen = ref(offeneNeuigkeiten(speicher))
const neuigkeiten = computed(() => neuOffen.value.map(e => ({ stand: e.stand, punkte: punkteIn(e, locale.value) })))
function neuVerstanden() { neuigkeitenGesehen(speicher); neuOffen.value = [] }
const stand = ref(0)                                   // erzwingt Neuberechnung nach Änderungen
const saetze = computed(() => (stand.value, bibliothek.sets()))
const aktiverId = computed(() => (stand.value, bibliothek.activeSetId()))
const aktiverSatz = computed(() => (stand.value, bibliothek.activeSet()))
const standardStand = computed(() => (stand.value, bibliothek.standardStand()))
/** Läuft eine Disziplin aus einem eigenen Satz? Dann gelten die Zeiten aus dem Editor. */
const laufEigen = computed(() => !aktiverSatz.value.readonly)

const schirm = ref('start')                            // start | wahl | lauf | saetze | editor | hilfe | signale | texte | frei
const zuletzt = ref(null)
const gewaehlt = ref(null)
const laufIndex = ref(0)                               // Phase, bei der der Lauf wieder einsetzt
const laufFest = ref(null)                             // erzwungene Betriebsart (freie Zeit)
const editorSatzId = ref(null)
const editorDisziplinId = ref(null)                    // direkt geöffnete Disziplin, etwa nach „Disziplin erstellen“
/** Ungespeicherter Entwurf nach „Disziplin erstellen“; gespeichert wird erst beim Sichern. */
const editorEntwurf = ref(null)                        // { satz, kopieAngelegt, zurueck }
const editorSatz = computed(() => editorEntwurf.value?.satz ?? saetze.value.find(s => s.id === editorSatzId.value))

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

/** EPP in der Schützenuhr: nur die Gesamtzeit, als eine einzige Serie. */
const { modus: laufModus } = useLaufModus()
const eppAlsSchuetzenuhr = computed(() => gewaehlt.value?.kind === 'epp' && laufModus.value === 'schuetzenuhr')
const eppGesamtzeit = computed(() => eppAlsSchuetzenuhr.value
  ? eppGesamtzeitDisziplin(gewaehltLokal.value, t('v3.modus.eppGesamtzeit')) : null)

function favoritUmschalten(d) {
  if (!bibliothek.favoritUmschalten(d.id)) meldung.value = t('v3.wahl.favoritenVoll')
  else meldung.value = null
  stand.value++
}

/** Öffnet einen Entwurf. Nichts wird gespeichert, bevor im Editor „Satz sichern“ getippt wird. */
function erstellen() {
  const { satz, disziplin, kopieAngelegt } = bibliothek.disziplinAnlegen(
    t('v3.editor.neueDisziplinName'), createDiscipline)
  meldung.value = null
  // markRaw: Der Editor kopiert den Satz mit structuredClone, das geht nur ohne Vue-Proxy.
  editorEntwurf.value = { satz: markRaw(satz), kopieAngelegt, zurueck: schirm.value }
  editorSatzId.value = satz.id
  editorDisziplinId.value = disziplin.id
  schirm.value = 'editor'
  return disziplin
}
function editorSichern(satz) {
  const entwurf = editorEntwurf.value
  const gesichert = bibliothek.save(satz)
  if (entwurf && gesichert) {
    bibliothek.setActive(gesichert.id)
    meldung.value = entwurf.kopieAngelegt ? t('v3.wahl.kopieAngelegt') : null
  }
  editorEntwurf.value = null
  stand.value++
  schirm.value = entwurf ? 'wahl' : 'saetze'
}
function editorSchliessen() {
  const entwurf = editorEntwurf.value
  editorEntwurf.value = null
  schirm.value = entwurf?.zurueck ?? 'saetze'
}

/** Mitgelieferten Satz aus der Datei auf dem Server aktualisieren. */
async function standardAktualisieren(url) {
  const bericht = bibliothek.standardAktualisieren(await fetchDaten(url))
  stand.value++
  return bericht
}

function dauerText(d) {
  if (d.kind === 'epp') return t('v3.wahl.eppKurz')
  const ms = nominalDurationMs(d.phases)
  const m = Math.floor(ms / 60000), s = Math.round((ms % 60000) / 1000)
  const zeit = m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${s} s`
  return `${d.phases.length} ${t('v3.allgemein.phasen')} · ${zeit} ${t('v3.wahl.schiessUndVorlaufzeit')}`
}

function starte(d) {
  gewaehlt.value = d; zuletzt.value = d; meldung.value = null
  laufIndex.value = 0; laufFest.value = null
  schirm.value = 'lauf'
}

/** Freie Zeit: eine Serie, immer als Schützenuhr. */
function freieZeitOeffnen(sekunden) {
  gewaehlt.value = enrichDiscipline(freieZeitDisziplin(sekunden, t('v3.frei.name', { s: sekunden })))
  laufIndex.value = 0; laufFest.value = 'schuetzenuhr'; meldung.value = null
  schirm.value = 'lauf'
}
function laufVerlassen() { schirm.value = laufFest.value ? 'frei' : 'wahl' }

// ── RO-Texte ─────────────────────────────────────────────────────────────
const texteSchreibgeschuetzt = computed(() => !!aktiverSatz.value.readonly)
function texteOeffnen(i) { laufIndex.value = i ?? 0; schirm.value = 'texte' }
function texteSichern({ phasen, commandTexts }) {
  const r = bibliothek.disziplinAendern(gewaehlt.value.id, (d) => {
    d.phases.forEach((p, i) => {
      const neu = phasen[i]
      if (!neu) return
      if (neu.ansage) p.ansage = neu.ansage; else delete p.ansage
      p.roCommands = neu.roCommands
      p.roCommandsEigen = true
    })
    if (commandTexts) d.commandTexts = commandTexts; else delete d.commandTexts
  })
  if (!r) { meldung.value = t('v3.ro.fehler'); return }
  stand.value++
  gewaehlt.value = r.disziplin
  zuletzt.value = r.disziplin
  meldung.value = r.kopieAngelegt ? t('v3.ro.kopieAngelegt') : null
  schirm.value = 'lauf'
}
function sichern(satz) { bibliothek.save(satz); stand.value++ }
function aktivieren(id) { bibliothek.setActive(id); stand.value++ }
function loeschen(id) { bibliothek.remove(id); stand.value++ }
function bearbeiten(id) { editorSatzId.value = id; editorDisziplinId.value = null; schirm.value = 'editor' }
</script>

<template>
  <div class="app">
    <!-- Startseite -->
    <StartView
      v-if="schirm === 'start'"
      :satz="aktiverSatz" :zuletzt="zuletztAnzeige" :favoriten="favoriten" :neuigkeiten="neuigkeiten"
      @verstanden="neuVerstanden"
      @waehlen="schirm = 'wahl'"
      @weiter="starte(zuletzt)"
      @starten="starte"
      @erstellen="erstellen"
      @saetze="schirm = 'saetze'"
      @frei="schirm = 'frei'"
      @signale="schirm = 'signale'"
      @hilfe="schirm = 'hilfe'" />

    <!-- Schützenuhr mit freier Zeit -->
    <FreieZeitView v-else-if="schirm === 'frei'" @oeffnen="freieZeitOeffnen" @schliessen="schirm = 'start'" />

    <!-- RO-Texte der laufenden Disziplin -->
    <RoTexteView
      v-else-if="schirm === 'texte' && gewaehlt"
      :disziplin="gewaehlt" :start-index="laufIndex" :schreibgeschuetzt="texteSchreibgeschuetzt"
      @sichern="texteSichern" @schliessen="schirm = 'lauf'" />

    <!-- Signale und Lautstärke -->
    <SignaleView v-else-if="schirm === 'signale'" @schliessen="schirm = 'start'" />

    <!-- Hilfe und Rechtliches -->
    <HelpView v-else-if="schirm === 'hilfe'" @schliessen="schirm = 'start'" />

    <!-- Disziplinwahl -->
    <div v-else-if="schirm === 'wahl'" class="seite">
      <button class="k-nav" @click="schirm = 'start'">{{ t('v3.hilfe.zurueck') }}</button>
      <header class="kopfzeile">
        <h1>{{ t('v3.wahl.titel') }}</h1>
        <p>{{ t('v3.wahl.satzInBenutzung') }}: <strong>{{ aktiverSatz.name }}</strong></p>
        <p class="tipp">{{ t('v3.wahl.tippenOeffnet') }}</p>
      </header>

      <p v-if="meldung" class="meldung">{{ meldung }}</p>

      <div v-for="d in disziplinen" :key="d.id" class="reihe">
        <button class="k-start karte" @click="starte(d)">
          <span class="k-start-symbol" aria-hidden="true">▶</span>
          <span class="k-start-text">
            <strong>{{ anzeigeName(d) }}</strong>
            <span class="k-unter">{{ dauerText(d) }}</span>
            <span v-if="d.varianten?.length" class="klassen">
              <span v-for="v in d.varianten" :key="v.ruleRef" class="klasse">{{ WEAPON_CLASSES[v.klasse]?.kurz ?? v.klasse }}</span>
            </span>
          </span>
        </button>
        <button
          class="stern" :class="{ an: bibliothek.istFavorit(d.id) }"
          :aria-label="bibliothek.istFavorit(d.id) ? t('v3.wahl.favoritEntfernen') : t('v3.wahl.favoritSetzen')"
          :aria-pressed="bibliothek.istFavorit(d.id)"
          @click="favoritUmschalten(d)">
          <span class="stern-zeichen" aria-hidden="true">{{ bibliothek.istFavorit(d.id) ? '★' : '☆' }}</span>
          <span class="stern-text">{{ t('v3.wahl.favorit') }}</span>
        </button>
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
        <button class="k-nav" @click="laufVerlassen">{{ laufFest ? t('v3.frei.andereZeit') : t('v3.wahl.andereDisziplin') }}</button>
        <p v-if="meldung" class="meldung lauf-meldung">{{ meldung }}</p>
      </div>
      <SequenceMatchView
        v-if="eppAlsSchuetzenuhr" :disziplin="eppGesamtzeit" :bearbeitbar="false" />
      <EppMatchView
        v-else-if="gewaehlt.kind === 'epp'"
        :start-index="laufIndex"
        @texte="texteOeffnen"
        :phases="gewaehltLokal.phases"
        :varianten="eppVarianten"
        :allgemeine-hinweise="eppHinweise"
        :total-time-ms="gewaehltLokal.totalTimeMs ?? 330000"
        :prep-ms="gewaehltLokal.prepMs ?? 3000" :eigene-zeiten="laufEigen" />
      <SequenceMatchView
        v-else :disziplin="gewaehltLokal" :modus-fest="laufFest" :bearbeitbar="!laufFest"
        :eigene-zeiten="laufEigen && !laufFest"
        :start-index="laufIndex" @texte="texteOeffnen" />
    </div>

    <!-- Sätze -->
    <LibraryView
      v-else-if="schirm === 'saetze'"
      :sets="saetze" :active-id="aktiverId"
      :standard-stand="standardStand" :standard-aktualisieren="standardAktualisieren"
      @aktivieren="aktivieren" @sichern="sichern" @loeschen="loeschen"
      @bearbeiten="bearbeiten" @schliessen="schirm = 'start'" />

    <!-- Editor -->
    <EditorView
      v-else-if="schirm === 'editor' && editorSatz"
      :satz="editorSatz" :start-disziplin-id="editorDisziplinId" :entwurf="editorEntwurf ? (editorEntwurf.kopieAngelegt ? 'kopie' : 'satz') : ''"
      @sichern="editorSichern"
      @schliessen="editorSchliessen" />
    <PWAUpdateToast />
  </div>
</template>

<style scoped>
.seite {
  min-height: calc(100dvh - env(safe-area-inset-top)); background: var(--f-grund); color: var(--f-text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding: 1.25rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.5rem; max-width: 44rem; margin: 0 auto;
}
.kopfzeile h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.kopfzeile p { margin: 0 0 0.75rem; color: var(--f-gedaempft); font-size: 0.9rem; }
.kopfzeile strong { color: var(--f-text); }
.kopfzeile .tipp { margin: -0.4rem 0 0.75rem; font-size: 0.82rem; }
.karte { min-height: 4.25rem; }
.reihe { display: grid; grid-template-columns: 1fr 4.5rem; gap: 0.4rem; align-items: stretch; }
.stern {
  font-family: inherit; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem;
  background: var(--f-flaeche); border: 1px solid var(--f-rand); border-radius: var(--r-mittel);
  color: var(--f-gedaempft);
}
.stern-zeichen { font-size: 1.6rem; line-height: 1; }
.stern-text { font-size: 0.68rem; letter-spacing: 0.02em; }
.stern.an { color: var(--f-akzent); border-color: var(--f-akzent); background: rgba(245, 158, 11, 0.10); }
.stern:focus-visible { outline: 2px solid var(--f-akzent); outline-offset: 2px; }
.meldung { margin: 0 0 0.25rem; padding: 0.6rem 0.8rem; background: #3b1d05; border: 1px solid #7c4a08; border-radius: var(--r-klein); color: var(--f-akzent); font-size: 0.85rem; line-height: 1.5; }
.klassen { display: flex; gap: 0.3rem; margin-top: 0.3rem; }
.klasse { background: var(--f-flaeche-hoch); border: 1px solid var(--f-rand); border-radius: 0.35rem; padding: 0.1rem 0.4rem; font-size: 0.68rem; letter-spacing: 0.03em; color: var(--f-akzent); }
.abstand { margin-top: 1rem; }
.lauf { display: flex; flex-direction: column; }
.lauf-meldung { margin: 0.5rem 0 0; }
.navleiste { padding: 0.75rem 0.75rem 0; background: var(--f-grund); max-width: 44rem; margin: 0 auto; width: 100%; box-sizing: border-box; }
</style>
