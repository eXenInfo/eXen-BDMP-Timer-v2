<script setup>
/**
 * Sätze verwalten: auswählen, kopieren, ausgeben, einlesen, nachladen.
 *
 * Der mitgelieferte Satz bleibt immer erhalten und unverändert. Alles, was
 * der Nutzer ändert, lebt in eigenen Sätzen daneben.
 */
import { ref, computed } from 'vue'
import { duplicateSet, exportSet, exportSetLegacy, importSet, mergeSet, fetchSet } from '../core/library.js'

const props = defineProps({
  sets:     { type: Array,  required: true },
  activeId: { type: String, required: true },
})
const emit = defineEmits(['aktivieren', 'sichern', 'loeschen', 'bearbeiten', 'schliessen'])

const ansicht = ref('liste')     // liste | ausgeben | einlesen | nachladen
const arbeitsSatz = ref(null)
const ausgabeText = ref('')
const ausgabeArt = ref('eigen')
const eingabeText = ref('')
const meldung = ref(null)
const fehler = ref(null)
const nachladeUrl = ref('./disziplinen.json')
const nachladeStrategie = ref('nurNeue')
const loeschFrage = ref(null)

const aktiverSatz = computed(() => props.sets.find(s => s.id === props.activeId))

function kopieAnlegen(satz) {
  const kopie = duplicateSet(satz, `${satz.name} — eigene Fassung`)
  emit('sichern', kopie)
  meldung.value = `„${kopie.name}“ angelegt. Sie ist jetzt bearbeitbar.`
  fehler.value = null
}

function ausgeben(satz) {
  arbeitsSatz.value = satz
  ausgabeArt.value = 'eigen'
  ausgabeText.value = exportSet(satz)
  ansicht.value = 'ausgeben'
}
function ausgabeUmschalten(art) {
  ausgabeArt.value = art
  ausgabeText.value = art === 'eigen' ? exportSet(arbeitsSatz.value) : exportSetLegacy(arbeitsSatz.value)
}
async function inZwischenablage() {
  try {
    await navigator.clipboard.writeText(ausgabeText.value)
    meldung.value = 'In die Zwischenablage kopiert.'
    fehler.value = null
  } catch {
    fehler.value = 'Die Zwischenablage ist hier gesperrt. Text unten markieren und selbst kopieren.'
  }
}
function alsDateiSichern() {
  try {
    const name = `${arbeitsSatz.value.name.replace(/[^\w-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
    const url = URL.createObjectURL(new Blob([ausgabeText.value], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
    meldung.value = `Als ${name} gesichert.`
    fehler.value = null
  } catch {
    fehler.value = 'Das Sichern als Datei ist hier gesperrt. Nimm die Zwischenablage.'
  }
}

function einlesen() {
  try {
    const satz = importSet(eingabeText.value, 'Eingelesener Satz')
    emit('sichern', satz)
    meldung.value = `„${satz.name}“ mit ${satz.disciplines.length} Disziplinen eingelesen.`
    fehler.value = null
    eingabeText.value = ''
    ansicht.value = 'liste'
  } catch (e) {
    fehler.value = e.message
    meldung.value = null
  }
}

async function nachladen() {
  fehler.value = null; meldung.value = null
  const ziel = aktiverSatz.value
  if (!ziel || ziel.readonly) {
    fehler.value = 'Nachladen geht nur in einen eigenen Satz. Lege zuerst eine Kopie an.'
    return
  }
  try {
    const quelle = await fetchSet(nachladeUrl.value)
    const { satz, neu, aktualisiert, behalten } = mergeSet(ziel, quelle, nachladeStrategie.value)
    emit('sichern', satz)
    meldung.value = [
      neu.length ? `${neu.length} neu: ${neu.join(', ')}` : null,
      aktualisiert.length ? `${aktualisiert.length} aufgefrischt` : null,
      behalten.length ? `${behalten.length} unverändert gelassen` : null,
    ].filter(Boolean).join(' · ') || 'Nichts zu tun, alles war bereits vorhanden.'
    ansicht.value = 'liste'
  } catch (e) {
    fehler.value = e.message
  }
}
</script>

<template>
  <div class="bibliothek">
    <button class="k-nav" @click="ansicht === 'liste' ? emit('schliessen') : (ansicht = 'liste')">
      {{ ansicht === 'liste' ? 'Zurück zur Disziplinwahl' : 'Zurück zur Satzliste' }}
    </button>

    <p v-if="meldung" class="meldung gut">{{ meldung }}</p>
    <p v-if="fehler" class="meldung schlecht">{{ fehler }}</p>

    <!-- Liste der Sätze -->
    <template v-if="ansicht === 'liste'">
      <header class="titel">
        <h2>Sätze</h2>
        <p class="unterzeile">Ein Satz bündelt Disziplinen samt Ansagen und Beschreibungen.</p>
      </header>

      <div v-for="s in sets" :key="s.id" class="karte" :class="{ aktiv: s.id === activeId }">
        <div class="kopf">
          <div>
            <strong class="satz-name">{{ s.name }}</strong>
            <span class="satz-neben">
              {{ s.disciplines.length }} Disziplinen · Fassung {{ s.version }}
              <template v-if="s.readonly"> · schreibgeschützt</template>
            </span>
          </div>
          <span v-if="s.id === activeId" class="marke">in Benutzung</span>
        </div>

        <div class="k-spalte">
          <button v-if="s.id !== activeId" class="k-zweit betont" @click="emit('aktivieren', s.id)">
            Diesen Satz benutzen
          </button>
          <div class="k-reihe">
            <button class="k-zweit" @click="emit('bearbeiten', s.id)">
              {{ s.readonly ? 'Ansehen' : 'Bearbeiten' }}
            </button>
            <button class="k-zweit" @click="kopieAnlegen(s)">Kopie anlegen</button>
          </div>
          <div class="k-reihe">
            <button class="k-zweit" @click="ausgeben(s)">Ausgeben</button>
            <button v-if="!s.readonly" class="k-gefahr" @click="loeschFrage = s.id">Löschen</button>
          </div>
        </div>

        <div v-if="loeschFrage === s.id" class="rueckfrage">
          <p>„{{ s.name }}“ mit allen Änderungen löschen? Das lässt sich nicht rückgängig machen.</p>
          <div class="k-reihe">
            <button class="k-zweit" @click="loeschFrage = null">Behalten</button>
            <button class="k-gefahr" @click="emit('loeschen', s.id); loeschFrage = null">Endgültig löschen</button>
          </div>
        </div>
      </div>

      <div class="k-spalte abstand">
        <button class="k-zweit" @click="ansicht = 'einlesen'">Satz einlesen</button>
        <button class="k-zweit" @click="ansicht = 'nachladen'">Neue Disziplinen nachladen</button>
      </div>
    </template>

    <!-- Ausgeben -->
    <template v-else-if="ansicht === 'ausgeben'">
      <header class="titel">
        <h2>{{ arbeitsSatz.name }} ausgeben</h2>
      </header>
      <div class="k-reihe">
        <button class="k-zweit" :class="{ betont: ausgabeArt === 'eigen' }" @click="ausgabeUmschalten('eigen')">
          Vollständig
          <span class="k-unter">mit allen Texten</span>
        </button>
        <button class="k-zweit" :class="{ betont: ausgabeArt === 'alt' }" @click="ausgabeUmschalten('alt')">
          Altformat
          <span class="k-unter">für den alten Timer</span>
        </button>
      </div>
      <div class="k-spalte">
        <button class="k-haupt" @click="inZwischenablage">
          In die Zwischenablage
          <span class="k-unter">zum Weitergeben oder Sichern</span>
        </button>
        <button class="k-zweit" @click="alsDateiSichern">Als Datei sichern</button>
      </div>
      <textarea class="e-feld ausgabe" readonly :value="ausgabeText"></textarea>
    </template>

    <!-- Einlesen -->
    <template v-else-if="ansicht === 'einlesen'">
      <header class="titel">
        <h2>Satz einlesen</h2>
        <p class="unterzeile">
          Nimmt das vollständige Format ebenso an wie die Sammlung aus dem alten Timer.
        </p>
      </header>
      <textarea class="e-feld eingabe" v-model="eingabeText" placeholder="JSON hier einfügen"></textarea>
      <button class="k-haupt" :disabled="!eingabeText.trim()" @click="einlesen">
        Einlesen
        <span class="k-unter">legt einen neuen Satz an, vorhandene bleiben unberührt</span>
      </button>
    </template>

    <!-- Nachladen -->
    <template v-else>
      <header class="titel">
        <h2>Neue Disziplinen nachladen</h2>
        <p class="unterzeile">
          Holt eine Sammlung und ergänzt damit den Satz, der gerade in Benutzung ist:
          <strong>{{ aktiverSatz?.name }}</strong>
        </p>
      </header>

      <div class="e-gruppe">
        <label class="e-marke" for="url">Quelle</label>
        <input id="url" class="e-feld" v-model="nachladeUrl" />
      </div>

      <div class="k-spalte">
        <button class="k-zweit" :class="{ betont: nachladeStrategie === 'nurNeue' }" @click="nachladeStrategie = 'nurNeue'">
          Nur neue aufnehmen
          <span class="k-unter">eigene Änderungen bleiben unangetastet</span>
        </button>
        <button class="k-zweit" :class="{ betont: nachladeStrategie === 'auffrischen' }" @click="nachladeStrategie = 'auffrischen'">
          Auch bekannte auffrischen
          <span class="k-unter">überschreibt eigene Änderungen an bekannten Disziplinen</span>
        </button>
      </div>

      <button class="k-haupt abstand" @click="nachladen">
        Jetzt nachladen
        <span class="k-unter">{{ nachladeStrategie === 'nurNeue' ? 'ergänzt nur, was fehlt' : 'ersetzt bekannte Disziplinen' }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.bibliothek {
  min-height: 100dvh; background: var(--f-grund); color: var(--f-text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding: 0.75rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.75rem; max-width: 44rem; margin: 0 auto;
}
.titel h2 { margin: 0.5rem 0 0.15rem; font-size: 1.35rem; }
.unterzeile { margin: 0; color: var(--f-gedaempft); font-size: 0.85rem; line-height: 1.5; }
.karte { background: var(--f-flaeche); border: 1px solid var(--f-rand); border-radius: var(--r-mittel); padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.karte.aktiv { border-color: var(--f-akzent); }
.kopf { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
.satz-name { display: block; font-size: 1.1rem; }
.satz-neben { display: block; color: var(--f-gedaempft); font-size: 0.8rem; margin-top: 0.15rem; }
.marke { flex-shrink: 0; background: var(--f-akzent); color: #1a1205; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; }
.meldung { margin: 0; padding: 0.7rem 0.9rem; border-radius: var(--r-klein); font-size: 0.9rem; line-height: 1.45; }
.meldung.gut { background: #0f2e1c; border: 1px solid #1f4030; color: #86efac; }
.meldung.schlecht { background: #2a0b0b; border: 1px solid #7f1d1d; color: #fca5a5; }
.rueckfrage { background: #2a0b0b; border: 1px solid #7f1d1d; border-radius: var(--r-klein); padding: 0.75rem; }
.rueckfrage p { margin: 0 0 0.6rem; font-size: 0.9rem; line-height: 1.45; }
.ausgabe, .eingabe { min-height: 14rem; font-family: ui-monospace, monospace; font-size: 0.78rem; }
.abstand { margin-top: 0.5rem; }
</style>
