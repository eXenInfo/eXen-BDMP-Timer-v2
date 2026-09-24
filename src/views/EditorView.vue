<script setup>
/**
 * Editor für einen Satz: Disziplinen, Phasen und alle Texte.
 *
 * Drei Ebenen, jede mit einer Navigationsleiste in voller Breite. Der
 * mitgelieferte Satz ist schreibgeschützt; wer ihn ändern will, legt zuerst
 * eine Kopie an. Das verhindert, dass der Auslieferungsstand still verändert
 * wird und niemand mehr weiß, was original war.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createDiscipline, COMMAND_SET_OPTIONS } from '../core/disciplineRules.js'
import { buildAnnouncement, buildEppAnnouncement } from '../core/ansage.js'

const props = defineProps({
  satz: { type: Object, required: true },
})
const emit = defineEmits(['sichern', 'schliessen'])
const { t } = useI18n()

const arbeit = ref(structuredClone(props.satz))
const geaendert = ref(false)
const ebene = ref('disziplinen')      // disziplinen | phasen | phase
const dIndex = ref(0)
const pIndex = ref(0)
const loeschFrage = ref(null)
const dLoeschFrage = ref(null)
const BEFEHLSFOLGEN = COMMAND_SET_OPTIONS

const disziplin = computed(() => arbeit.value.disciplines[dIndex.value] ?? null)
const phase     = computed(() => disziplin.value?.phases[pIndex.value] ?? null)
const istEpp    = computed(() => disziplin.value?.kind === 'epp')

function merken() { geaendert.value = true }
function sichern() { emit('sichern', arbeit.value); geaendert.value = false }

function oeffneDisziplin(i) { dIndex.value = i; ebene.value = 'phasen' }
function oeffnePhase(i)     { pIndex.value = i; ebene.value = 'phase' }

function sekunden(ms) { return Math.round((ms ?? 0) / 1000) }
function setSekunden(feld, wert) {
  const zahl = Math.max(0, Math.round(Number(wert) || 0))
  phase.value[feld] = zahl * 1000
  merken()
}

function ansageAendern(i, wert) { phase.value.roCommands[i] = wert; merken() }
function ansageHinzu()   { (phase.value.roCommands ??= []).push(''); merken() }
function ansageWeg(i)    { phase.value.roCommands.splice(i, 1); merken() }

/**
 * Die Ansage, die der RO vorliest — abgeleitet aus den Feldern der Phase.
 *
 * Sie wird hier immer mitgerechnet, damit sichtbar ist, was ohne eigenen
 * Text herauskommt. Erst wenn jemand in das Feld schreibt, gilt sein Text.
 */
const abgeleiteteAnsage = computed(() => {
  const liste = disziplin.value?.phases ?? []
  if (!liste.length) return ''
  const roh = { ...(liste[pIndex.value] ?? {}) }
  delete roh.ansage                      // die Ableitung, nicht die Übersteuerung
  const ohne = liste.map((p, i) => (i === pIndex.value ? roh : p))
  const a = istEpp.value
    ? buildEppAnnouncement(ohne, pIndex.value)
    : buildAnnouncement(ohne, pIndex.value, disziplin.value)
  return [a.fuehrung, a.detail].filter(Boolean).join('\n')
})

function ansageSetzen(wert) {
  const t = String(wert ?? '')
  if (t.trim()) phase.value.ansage = t
  else delete phase.value.ansage
  merken()
}

// ── Disziplinen ────────────────────────────────────────────────────────────
function disziplinNeu() {
  const d = createDiscipline(t('v3.editor.neueDisziplinName'))
  arbeit.value.disciplines.push(d)
  merken()
  oeffneDisziplin(arbeit.value.disciplines.length - 1)
}
function disziplinDoppeln(i) {
  const kopie = structuredClone(arbeit.value.disciplines[i])
  kopie.id = `eigen-${Date.now().toString(36)}`
  kopie.name = `${kopie.name} (Kopie)`
  kopie.eigen = true
  arbeit.value.disciplines.splice(i + 1, 0, kopie)
  merken()
}
function disziplinLoeschen(i) {
  arbeit.value.disciplines.splice(i, 1)
  dLoeschFrage.value = null
  if (dIndex.value >= arbeit.value.disciplines.length) dIndex.value = 0
  merken()
}
function disziplinVerschieben(i, richtung) {
  const liste = arbeit.value.disciplines
  const ziel = i + richtung
  if (ziel < 0 || ziel >= liste.length) return
  ;[liste[i], liste[ziel]] = [liste[ziel], liste[i]]
  merken()
}

function phaseVerschieben(i, richtung) {
  const liste = disziplin.value.phases
  const ziel = i + richtung
  if (ziel < 0 || ziel >= liste.length) return
  ;[liste[i], liste[ziel]] = [liste[ziel], liste[i]]
  merken()
}
function phaseDoppeln(i) {
  const kopie = structuredClone(disziplin.value.phases[i])
  kopie.name = `${kopie.name} (Kopie)`
  disziplin.value.phases.splice(i + 1, 0, kopie)
  merken()
}
function phaseLoeschen(i) {
  disziplin.value.phases.splice(i, 1)
  loeschFrage.value = null
  merken()
}
function phaseNeu() {
  disziplin.value.phases.push({
    name: t('v3.editor.neuePhase'), description: '', roCommands: [],
    prepMs: 3000, durationMs: 10000, repetitions: 1, repPauseMs: 0,
    soundAtStart: true, soundAtEnd: true, waitAfter: false,
  })
  merken()
  oeffnePhase(disziplin.value.phases.length - 1)
}

/** Weicht eine EPP-Station von der Sportordnung ab? */
const regelAbweichung = computed(() => {
  if (!istEpp.value || !phase.value) return null
  const p = phase.value
  if (p.timeLimitMs > 0 && p.stopSignalAtMs != null &&
      p.stopSignalAtMs + p.stopSignalDurationMs !== p.timeLimitMs) {
    return t('v3.editor.regelWarnung')
  }
  return null
})
</script>

<template>
  <div class="editor">

    <!-- Ebene 1: Disziplinen -->
    <template v-if="ebene === 'disziplinen'">
      <button class="k-nav" @click="emit('schliessen')">{{ t('v3.editor.zurueckZurWahl') }}</button>

      <header class="titel">
        <h2>{{ arbeit.name }}</h2>
        <p v-if="arbeit.readonly" class="schutz">
          {{ t('v3.editor.schutzHinweis') }}
        </p>
        <p v-else class="unterzeile">{{ arbeit.disciplines.length }} {{ t('v3.allgemein.disziplinen') }} · {{ t('v3.allgemein.fassung') }} {{ arbeit.version }}</p>
      </header>

      <div v-for="(d, i) in arbeit.disciplines" :key="d.id" class="karte">
        <button class="zeile blank" @click="oeffneDisziplin(i)">
          <span class="zeile-haupt">{{ d.name }}</span>
          <span class="zeile-neben">
            {{ d.phases.length }} {{ d.kind === 'epp' ? t('v3.allgemein.stationen') : t('v3.allgemein.phasen') }}
            <template v-if="d.kind === 'epp'"> · C.17</template>
            <template v-else-if="d.eigen"> · {{ t('v3.editor.eigeneDisziplin') }}</template>
          </span>
        </button>

        <div class="karten-werkzeug" v-if="!arbeit.readonly">
          <button class="k-zweit schmal" :disabled="i === 0" @click="disziplinVerschieben(i, -1)">{{ t('v3.editor.hoch') }}</button>
          <button class="k-zweit schmal" :disabled="i === arbeit.disciplines.length - 1" @click="disziplinVerschieben(i, 1)">{{ t('v3.editor.runter') }}</button>
          <button class="k-zweit schmal" @click="disziplinDoppeln(i)">{{ t('v3.editor.disziplinDoppeln') }}</button>
          <button class="k-gefahr schmal" @click="dLoeschFrage = i">{{ t('v3.editor.disziplinLoeschen') }}</button>
        </div>

        <div v-if="dLoeschFrage === i" class="rueckfrage">
          <p>{{ t('v3.editor.disziplinLoeschFrage', { name: d.name }) }}</p>
          <div class="k-reihe">
            <button class="k-zweit" @click="dLoeschFrage = null">{{ t('v3.allgemein.behalten') }}</button>
            <button class="k-gefahr" @click="disziplinLoeschen(i)">{{ t('v3.allgemein.endgueltigLoeschen') }}</button>
          </div>
        </div>
      </div>

      <div class="k-spalte abstand" v-if="!arbeit.readonly">
        <button class="k-zweit" @click="disziplinNeu">
          {{ t('v3.editor.neueDisziplin') }}
          <span class="k-unter">{{ t('v3.editor.neueDisziplinUnter') }}</span>
        </button>
        <button class="k-haupt" :disabled="!geaendert" @click="sichern">
          {{ t('v3.editor.satzSichern') }}
          <span class="k-unter">{{ geaendert ? t('v3.allgemein.offeneAenderungen') : t('v3.allgemein.keineAenderungen') }}</span>
        </button>
      </div>
    </template>

    <!-- Ebene 2: Phasen einer Disziplin -->
    <template v-else-if="ebene === 'phasen'">
      <button class="k-nav" @click="ebene = 'disziplinen'">{{ t('v3.editor.zurueckZuDisziplinen') }}</button>

      <header class="titel">
        <h2>{{ disziplin.name }}</h2>
        <p class="unterzeile">{{ istEpp ? t('v3.editor.stationenNachC17') : t('v3.editor.phasenDesAblaufs') }}</p>
      </header>

      <fieldset class="block" :disabled="arbeit.readonly">
        <div class="e-gruppe">
          <label class="e-marke" for="d-name">{{ t('v3.editor.disziplinName') }}</label>
          <input id="d-name" class="e-feld" :value="disziplin.name"
                 @input="e => { disziplin.name = e.target.value; merken() }" />
        </div>
        <div class="e-gruppe">
          <label class="e-marke" for="d-besch">{{ t('v3.editor.disziplinBeschreibung') }}</label>
          <textarea id="d-besch" class="e-feld" rows="2" :value="disziplin.description ?? ''"
                    @input="e => { disziplin.description = e.target.value; merken() }"></textarea>
        </div>
        <div class="e-gruppe" v-if="!istEpp">
          <label class="e-marke" for="d-bef">{{ t('v3.editor.kommandofolge') }}</label>
          <select id="d-bef" class="e-feld" :value="disziplin.commandSetId ?? 'auto'"
                  @change="e => { disziplin.commandSetId = e.target.value; merken() }">
            <option v-for="o in BEFEHLSFOLGEN" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
          <p class="feldhinweis">{{ t('v3.editor.kommandofolgeHinweis') }}</p>
        </div>
      </fieldset>

      <div v-for="(p, i) in disziplin.phases" :key="i" class="karte">
        <button class="zeile blank" @click="oeffnePhase(i)">
          <span class="zeile-haupt">{{ i + 1 }}. {{ p.station ?? p.name }}</span>
          <span class="zeile-neben">
            <template v-if="istEpp">
              {{ p.distance }} · {{ p.position }} ·
              {{ p.timeLimitMs > 0 ? (p.timeLimitMs / 1000) + ' s fest' : 'offen' }}
            </template>
            <template v-else>
              {{ sekunden(p.prepMs) }} s Vorlauf · {{ sekunden(p.durationMs) }} s
              <template v-if="p.repetitions > 1"> × {{ p.repetitions }}</template>
              <template v-if="p.waitAfter"> · Halt danach</template>
            </template>
          </span>
          <span class="zeile-ansage" v-if="p.roCommands?.length">„{{ p.roCommands[0] }}“</span>
        </button>

        <div class="karten-werkzeug" v-if="!arbeit.readonly">
          <button class="k-zweit schmal" :disabled="i === 0" @click="phaseVerschieben(i, -1)">{{ t('v3.editor.hoch') }}</button>
          <button class="k-zweit schmal" :disabled="i === disziplin.phases.length - 1" @click="phaseVerschieben(i, 1)">{{ t('v3.editor.runter') }}</button>
          <button class="k-zweit schmal" @click="phaseDoppeln(i)">{{ t('v3.editor.doppeln') }}</button>
          <button class="k-gefahr schmal" @click="loeschFrage = i">{{ t('v3.bib.loeschen') }}</button>
        </div>

        <div v-if="loeschFrage === i" class="rueckfrage">
          <p>{{ t('v3.editor.loeschFrage', { name: p.station ?? p.name }) }}</p>
          <div class="k-reihe">
            <button class="k-zweit" @click="loeschFrage = null">{{ t('v3.allgemein.behalten') }}</button>
            <button class="k-gefahr" @click="phaseLoeschen(i)">{{ t('v3.allgemein.endgueltigLoeschen') }}</button>
          </div>
        </div>
      </div>

      <div class="k-spalte abstand" v-if="!arbeit.readonly">
        <button class="k-zweit" @click="phaseNeu">{{ t('v3.editor.phaseHinzufuegen') }}</button>
        <button class="k-haupt" :disabled="!geaendert" @click="sichern">
          {{ t('v3.editor.satzSichern') }}
          <span class="k-unter">{{ geaendert ? t('v3.allgemein.offeneAenderungen') : t('v3.allgemein.keineAenderungen') }}</span>
        </button>
      </div>
    </template>

    <!-- Ebene 3: eine Phase -->
    <template v-else>
      <button class="k-nav" @click="ebene = 'phasen'">{{ t('v3.editor.zurueckZu', { name: disziplin.name }) }}</button>

      <header class="titel">
        <h2>{{ phase.station ?? phase.name }}</h2>
        <p class="unterzeile" v-if="phase.ruleRef">{{ t('v3.editor.regelgrundlage', { regel: phase.ruleRef }) }}</p>
      </header>

      <fieldset class="block" :disabled="arbeit.readonly">
        <div class="e-gruppe">
          <label class="e-marke" for="f-name">{{ t('v3.editor.ueberschrift') }}</label>
          <input id="f-name" class="e-feld" :value="phase.station ?? phase.name"
                 @input="e => { istEpp ? phase.station = e.target.value : phase.name = e.target.value; merken() }" />
        </div>

        <div class="e-gruppe">
          <label class="e-marke" for="f-ansage">
            {{ t('v3.editor.schuetzenAnsage') }}
            <span class="e-status" :class="{ eigen: !!phase.ansage }">
              {{ phase.ansage ? t('v3.editor.ansageEigen') : t('v3.editor.ansageAbgeleitet') }}
            </span>
          </label>
          <p class="e-hilfe">{{ t('v3.editor.schuetzenAnsageHilfe') }}</p>
          <textarea id="f-ansage" class="e-feld ansage-feld" rows="2"
                    :value="phase.ansage ?? ''"
                    :placeholder="abgeleiteteAnsage"
                    @input="e => ansageSetzen(e.target.value)"></textarea>
          <p class="e-vorschau" v-if="!phase.ansage">{{ abgeleiteteAnsage }}</p>
          <div class="e-knopfpaar">
            <button class="k-zweit" v-if="!phase.ansage" @click="ansageSetzen(abgeleiteteAnsage)">
              {{ t('v3.editor.ansageUebernehmen') }}
            </button>
            <button class="k-zweit" v-else @click="ansageSetzen('')">
              {{ t('v3.editor.ansageZuruecksetzen') }}
            </button>
          </div>
        </div>

        <div class="e-gruppe">
          <label class="e-marke" for="f-besch">{{ t('v3.editor.beschreibung') }}</label>
          <textarea id="f-besch" class="e-feld" rows="3"
                    :value="istEpp ? (phase.notes ?? []).join('\n') : phase.description"
                    @input="e => { istEpp ? phase.notes = e.target.value.split('\n') : phase.description = e.target.value; merken() }"></textarea>
        </div>

        <div class="e-gruppe">
          <span class="e-marke">{{ t('v3.editor.ansagen') }}</span>
          <div v-for="(a, i) in (phase.roCommands ?? [])" :key="i" class="ansage-zeile">
            <input class="e-feld" :value="a" @input="e => ansageAendern(i, e.target.value)" />
            <button class="k-gefahr schmal" @click="ansageWeg(i)">{{ t('v3.allgemein.weg') }}</button>
          </div>
          <button class="k-zweit" @click="ansageHinzu">{{ t('v3.editor.ansageHinzufuegen') }}</button>
        </div>
      </fieldset>

      <fieldset class="block" :disabled="arbeit.readonly">
        <template v-if="istEpp">
          <div class="e-paar">
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.distanz') }}</label>
              <input class="e-feld" :value="phase.distance" @input="e => { phase.distance = e.target.value; merken() }" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.anschlag') }}</label>
              <input class="e-feld" :value="phase.position" @input="e => { phase.position = e.target.value; merken() }" />
            </div>
          </div>
          <div class="e-paar">
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.zeitlimit') }}</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.timeLimitMs)"
                     @input="e => setSekunden('timeLimitMs', e.target.value)" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.schusszahl') }}</label>
              <input class="e-feld" type="number" min="0" :value="phase.shots"
                     @input="e => { phase.shots = Number(e.target.value) || 0; merken() }" />
            </div>
          </div>
          <div class="e-paar" v-if="phase.timeLimitMs > 0">
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.signalBeginn') }}</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.stopSignalAtMs)"
                     @input="e => setSekunden('stopSignalAtMs', e.target.value)" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.signalDauer') }}</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.stopSignalDurationMs)"
                     @input="e => setSekunden('stopSignalDurationMs', e.target.value)" />
            </div>
          </div>
          <p v-if="regelAbweichung" class="regel-warnung">{{ regelAbweichung }}</p>
        </template>

        <template v-else>
          <div class="e-paar">
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.vorlauf') }}</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.prepMs)"
                     @input="e => setSekunden('prepMs', e.target.value)" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.schiesszeit') }}</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.durationMs)"
                     @input="e => setSekunden('durationMs', e.target.value)" />
            </div>
          </div>
          <div class="e-paar">
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.durchgaenge') }}</label>
              <input class="e-feld" type="number" min="1" :value="phase.repetitions"
                     @input="e => { phase.repetitions = Math.max(1, Number(e.target.value) || 1); merken() }" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">{{ t('v3.editor.pauseDazwischen') }}</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.repPauseMs)"
                     @input="e => setSekunden('repPauseMs', e.target.value)" />
            </div>
          </div>
          <div class="k-spalte">
            <label class="e-schalter">
              <input type="checkbox" :checked="phase.soundAtStart" @change="e => { phase.soundAtStart = e.target.checked; merken() }" />
              {{ t('v3.editor.startsignalAn') }}
            </label>
            <label class="e-schalter">
              <input type="checkbox" :checked="phase.soundAtEnd" @change="e => { phase.soundAtEnd = e.target.checked; merken() }" />
              {{ t('v3.editor.endsignalAn') }}
            </label>
            <label class="e-schalter">
              <input type="checkbox" :checked="phase.waitAfter" @change="e => { phase.waitAfter = e.target.checked; merken() }" />
              {{ t('v3.editor.danachWarten') }}
            </label>
          </div>
        </template>
      </fieldset>

      <div class="k-spalte abstand" v-if="!arbeit.readonly">
        <button class="k-haupt" :disabled="!geaendert" @click="sichern">
          {{ t('v3.editor.satzSichern') }}
          <span class="k-unter">{{ geaendert ? t('v3.allgemein.offeneAenderungen') : t('v3.allgemein.keineAenderungen') }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.editor {
  min-height: calc(100dvh - env(safe-area-inset-top)); background: var(--f-grund); color: var(--f-text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding: 0.75rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.75rem;
  max-width: 44rem; margin: 0 auto;
}
.titel h2 { margin: 0.5rem 0 0.15rem; font-size: 1.35rem; }
.unterzeile { margin: 0; color: var(--f-gedaempft); font-size: 0.85rem; }
.schutz { margin: 0; color: var(--f-akzent); font-size: 0.85rem; line-height: 1.45; }

.zeile {
  width: 100%; text-align: left; background: var(--f-flaeche);
  border: 1px solid var(--f-rand); border-radius: var(--r-mittel);
  padding: 0.85rem 1rem; color: inherit; cursor: pointer;
  display: flex; flex-direction: column; gap: 0.2rem; min-height: 3.75rem;
  font-family: inherit;
}
.zeile.blank { border: none; background: transparent; padding: 0; min-height: 3rem; }
.zeile-haupt { font-size: 1.05rem; font-weight: 600; }
.zeile-neben { color: var(--f-gedaempft); font-size: 0.82rem; }
.zeile-ansage { color: var(--f-akzent); font-size: 0.82rem; margin-top: 0.2rem; }

.karte { background: var(--f-flaeche); border: 1px solid var(--f-rand); border-radius: var(--r-mittel); padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
.karten-werkzeug { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; }
.schmal { min-height: 3rem; font-size: 0.85rem; padding: 0.4rem 0.3rem; }
.rueckfrage { background: #2a0b0b; border: 1px solid #7f1d1d; border-radius: var(--r-klein); padding: 0.75rem; }
.rueckfrage p { margin: 0 0 0.6rem; font-size: 0.9rem; line-height: 1.45; }

.block { border: 1px solid var(--f-rand); border-radius: var(--r-mittel); background: var(--f-flaeche-hoch); padding: 1rem; margin: 0; }
.block:disabled { opacity: 0.55; }
.e-status { float: right; font-weight: 500; text-transform: none; letter-spacing: 0; opacity: 0.7; }
.e-status.eigen { color: var(--f-akzent); opacity: 1; }
.e-hilfe { margin: 0 0 0.4rem; font-size: 0.82rem; line-height: 1.45; opacity: 0.75; }
.ansage-feld { font-size: 1rem; line-height: 1.5; }
.e-vorschau {
  margin: 0.4rem 0 0; padding: 0.5rem 0.7rem; border-radius: 0.5rem;
  background: rgba(59, 130, 246, 0.12); border-left: 3px solid #3b82f6;
  font-size: 0.95rem; line-height: 1.5; white-space: pre-line;
}
.e-knopfpaar { margin-top: 0.5rem; }
.ansage-zeile { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; }
.regel-warnung { margin: 0.25rem 0 0; color: var(--f-akzent); font-size: 0.85rem; line-height: 1.45; }
.abstand { margin-top: 0.5rem; }
.feldhinweis { margin: 0.35rem 0 0; color: var(--f-gedaempft); font-size: 0.8rem; line-height: 1.45; }
select.e-feld { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--f-gedaempft) 50%), linear-gradient(135deg, var(--f-gedaempft) 50%, transparent 50%); background-position: calc(100% - 18px) 1.45rem, calc(100% - 12px) 1.45rem; background-size: 6px 6px, 6px 6px; background-repeat: no-repeat; padding-right: 2.2rem; }
</style>
