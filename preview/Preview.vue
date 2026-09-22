<script setup>
/**
 * Vorschau-Hülle: Disziplinwahl, Lauf, Sätze und Editor.
 * In der fertigen App übernimmt das die Navigation der Anwendung.
 */
import { computed, ref } from 'vue'
import EppMatchView from '../src/views/EppMatchView.vue'
import SequenceMatchView from '../src/views/SequenceMatchView.vue'
import LibraryView from '../src/views/LibraryView.vue'
import EditorView from '../src/views/EditorView.vue'
import { createLibrary } from '../src/core/library.js'
import { nominalDurationMs } from '../src/core/legacyImport.js'
import legacy from '../public/disziplinen.json'

const speicher = (() => {
  try { window.localStorage.setItem('__probe', '1'); window.localStorage.removeItem('__probe'); return window.localStorage }
  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) } }
})()

const bibliothek = createLibrary(speicher, legacy)
const stand = ref(0)                                   // erzwingt Neuberechnung nach Änderungen
const saetze = computed(() => (stand.value, bibliothek.sets()))
const aktiverId = computed(() => (stand.value, bibliothek.activeSetId()))
const aktiverSatz = computed(() => (stand.value, bibliothek.activeSet()))

const schirm = ref('wahl')                             // wahl | lauf | saetze | editor
const gewaehlt = ref(null)
const editorSatzId = ref(null)
const editorSatz = computed(() => saetze.value.find(s => s.id === editorSatzId.value))

const disziplinen = computed(() => aktiverSatz.value.disciplines)

function dauerText(d) {
  if (d.kind === 'epp') return '7 Stationen · 50 Schuss · 5:30 Gesamtzeit'
  const ms = nominalDurationMs(d.phases)
  const m = Math.floor(ms / 60000), s = Math.round((ms % 60000) / 1000)
  const zeit = m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${s} s`
  return `${d.phases.length} Phasen · ${zeit} Schieß- und Vorlaufzeit`
}

function starte(d) { gewaehlt.value = d; schirm.value = 'lauf' }
function sichern(satz) { bibliothek.save(satz); stand.value++ }
function aktivieren(id) { bibliothek.setActive(id); stand.value++ }
function loeschen(id) { bibliothek.remove(id); stand.value++ }
function bearbeiten(id) { editorSatzId.value = id; schirm.value = 'editor' }
</script>

<template>
  <!-- Disziplinwahl -->
  <div v-if="schirm === 'wahl'" class="seite">
    <header class="kopfzeile">
      <h1>BDMP Timer</h1>
      <p>Satz in Benutzung: <strong>{{ aktiverSatz.name }}</strong></p>
    </header>

    <button
      v-for="d in disziplinen" :key="d.id"
      class="karte" :class="{ epp: d.kind === 'epp' }"
      @click="starte(d)">
      <strong>{{ d.name }}</strong>
      <span>{{ dauerText(d) }}</span>
    </button>

    <div class="k-spalte abstand">
      <button class="k-zweit" @click="schirm = 'saetze'">
        Sätze und Disziplinen verwalten
        <span class="k-unter">bearbeiten, ausgeben, einlesen, nachladen</span>
      </button>
    </div>
  </div>

  <!-- Lauf -->
  <div v-else-if="schirm === 'lauf'" class="lauf">
    <div class="navleiste">
      <button class="k-nav" @click="schirm = 'wahl'">Andere Disziplin wählen</button>
    </div>
    <EppMatchView
      v-if="gewaehlt.kind === 'epp'"
      :phases="gewaehlt.phases"
      :total-time-ms="gewaehlt.totalTimeMs ?? 330000"
      :prep-ms="gewaehlt.prepMs ?? 3000" />
    <SequenceMatchView v-else :disziplin="gewaehlt" />
  </div>

  <!-- Sätze -->
  <LibraryView
    v-else-if="schirm === 'saetze'"
    :sets="saetze" :active-id="aktiverId"
    @aktivieren="aktivieren" @sichern="sichern" @loeschen="loeschen"
    @bearbeiten="bearbeiten" @schliessen="schirm = 'wahl'" />

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
.karte:active { border-color: var(--f-akzent); }
.abstand { margin-top: 1rem; }
.lauf { display: flex; flex-direction: column; }
.navleiste { padding: 0.75rem 0.75rem 0; background: var(--f-grund); max-width: 44rem; margin: 0 auto; width: 100%; box-sizing: border-box; }
</style>
