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

const props = defineProps({
  satz: { type: Object, required: true },
})
const emit = defineEmits(['sichern', 'schliessen'])

const arbeit = ref(structuredClone(props.satz))
const geaendert = ref(false)
const ebene = ref('disziplinen')      // disziplinen | phasen | phase
const dIndex = ref(0)
const pIndex = ref(0)
const loeschFrage = ref(null)

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
    name: 'Neue Phase', description: '', roCommands: [],
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
    return 'Das zweite Signal endet nicht mit der Schießzeit. C.17.14 verlangt, dass sein Ende die Wertungsgrenze markiert.'
  }
  return null
})
</script>

<template>
  <div class="editor">

    <!-- Ebene 1: Disziplinen -->
    <template v-if="ebene === 'disziplinen'">
      <button class="k-nav" @click="emit('schliessen')">Zurück zur Disziplinwahl</button>

      <header class="titel">
        <h2>{{ arbeit.name }}</h2>
        <p v-if="arbeit.readonly" class="schutz">
          Mitgelieferter Satz — schreibgeschützt. Für eigene Ansagen zuerst eine Kopie anlegen.
        </p>
        <p v-else class="unterzeile">{{ arbeit.disciplines.length }} Disziplinen · Fassung {{ arbeit.version }}</p>
      </header>

      <button
        v-for="(d, i) in arbeit.disciplines" :key="d.id"
        class="zeile" @click="oeffneDisziplin(i)">
        <span class="zeile-haupt">{{ d.name }}</span>
        <span class="zeile-neben">
          {{ d.phases.length }} {{ d.kind === 'epp' ? 'Stationen' : 'Phasen' }}
          <template v-if="d.kind === 'epp'"> · C.17</template>
        </span>
      </button>

      <div class="k-spalte abstand" v-if="!arbeit.readonly">
        <button class="k-haupt" :disabled="!geaendert" @click="sichern">
          Satz sichern
          <span class="k-unter">{{ geaendert ? 'Es gibt ungesicherte Änderungen' : 'Keine Änderungen offen' }}</span>
        </button>
      </div>
    </template>

    <!-- Ebene 2: Phasen einer Disziplin -->
    <template v-else-if="ebene === 'phasen'">
      <button class="k-nav" @click="ebene = 'disziplinen'">Zurück zu den Disziplinen</button>

      <header class="titel">
        <h2>{{ disziplin.name }}</h2>
        <p class="unterzeile">{{ istEpp ? 'Stationen nach C.17' : 'Phasen des Ablaufs' }}</p>
      </header>

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
          <button class="k-zweit schmal" :disabled="i === 0" @click="phaseVerschieben(i, -1)">Hoch</button>
          <button class="k-zweit schmal" :disabled="i === disziplin.phases.length - 1" @click="phaseVerschieben(i, 1)">Runter</button>
          <button class="k-zweit schmal" @click="phaseDoppeln(i)">Doppeln</button>
          <button class="k-gefahr schmal" @click="loeschFrage = i">Löschen</button>
        </div>

        <div v-if="loeschFrage === i" class="rueckfrage">
          <p>„{{ p.station ?? p.name }}“ wirklich löschen? Das lässt sich nicht rückgängig machen.</p>
          <div class="k-reihe">
            <button class="k-zweit" @click="loeschFrage = null">Behalten</button>
            <button class="k-gefahr" @click="phaseLoeschen(i)">Endgültig löschen</button>
          </div>
        </div>
      </div>

      <div class="k-spalte abstand" v-if="!arbeit.readonly">
        <button class="k-zweit" @click="phaseNeu">Phase hinzufügen</button>
        <button class="k-haupt" :disabled="!geaendert" @click="sichern">
          Satz sichern
          <span class="k-unter">{{ geaendert ? 'Es gibt ungesicherte Änderungen' : 'Keine Änderungen offen' }}</span>
        </button>
      </div>
    </template>

    <!-- Ebene 3: eine Phase -->
    <template v-else>
      <button class="k-nav" @click="ebene = 'phasen'">Zurück zu {{ disziplin.name }}</button>

      <header class="titel">
        <h2>{{ phase.station ?? phase.name }}</h2>
        <p class="unterzeile" v-if="phase.ruleRef">Regelgrundlage {{ phase.ruleRef }}</p>
      </header>

      <fieldset class="block" :disabled="arbeit.readonly">
        <div class="e-gruppe">
          <label class="e-marke" for="f-name">Überschrift</label>
          <input id="f-name" class="e-feld" :value="phase.station ?? phase.name"
                 @input="e => { istEpp ? phase.station = e.target.value : phase.name = e.target.value; merken() }" />
        </div>

        <div class="e-gruppe">
          <label class="e-marke" for="f-besch">Beschreibung für den Schützen</label>
          <textarea id="f-besch" class="e-feld" rows="3"
                    :value="istEpp ? (phase.notes ?? []).join('\n') : phase.description"
                    @input="e => { istEpp ? phase.notes = e.target.value.split('\n') : phase.description = e.target.value; merken() }"></textarea>
        </div>

        <div class="e-gruppe">
          <span class="e-marke">Ansagen der Aufsicht</span>
          <div v-for="(a, i) in (phase.roCommands ?? [])" :key="i" class="ansage-zeile">
            <input class="e-feld" :value="a" @input="e => ansageAendern(i, e.target.value)" />
            <button class="k-gefahr schmal" @click="ansageWeg(i)">Weg</button>
          </div>
          <button class="k-zweit" @click="ansageHinzu">Ansage hinzufügen</button>
        </div>
      </fieldset>

      <fieldset class="block" :disabled="arbeit.readonly">
        <template v-if="istEpp">
          <div class="e-paar">
            <div class="e-gruppe">
              <label class="e-marke">Distanz</label>
              <input class="e-feld" :value="phase.distance" @input="e => { phase.distance = e.target.value; merken() }" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">Anschlag</label>
              <input class="e-feld" :value="phase.position" @input="e => { phase.position = e.target.value; merken() }" />
            </div>
          </div>
          <div class="e-paar">
            <div class="e-gruppe">
              <label class="e-marke">Zeitlimit in Sekunden (0 = offen)</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.timeLimitMs)"
                     @input="e => setSekunden('timeLimitMs', e.target.value)" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">Schusszahl</label>
              <input class="e-feld" type="number" min="0" :value="phase.shots"
                     @input="e => { phase.shots = Number(e.target.value) || 0; merken() }" />
            </div>
          </div>
          <div class="e-paar" v-if="phase.timeLimitMs > 0">
            <div class="e-gruppe">
              <label class="e-marke">Zweites Signal beginnt bei Sekunde</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.stopSignalAtMs)"
                     @input="e => setSekunden('stopSignalAtMs', e.target.value)" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">Dauer des Signals in Sekunden</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.stopSignalDurationMs)"
                     @input="e => setSekunden('stopSignalDurationMs', e.target.value)" />
            </div>
          </div>
          <p v-if="regelAbweichung" class="regel-warnung">{{ regelAbweichung }}</p>
        </template>

        <template v-else>
          <div class="e-paar">
            <div class="e-gruppe">
              <label class="e-marke">Vorlauf in Sekunden</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.prepMs)"
                     @input="e => setSekunden('prepMs', e.target.value)" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">Schießzeit in Sekunden</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.durationMs)"
                     @input="e => setSekunden('durationMs', e.target.value)" />
            </div>
          </div>
          <div class="e-paar">
            <div class="e-gruppe">
              <label class="e-marke">Durchgänge</label>
              <input class="e-feld" type="number" min="1" :value="phase.repetitions"
                     @input="e => { phase.repetitions = Math.max(1, Number(e.target.value) || 1); merken() }" />
            </div>
            <div class="e-gruppe">
              <label class="e-marke">Pause dazwischen in Sekunden</label>
              <input class="e-feld" type="number" min="0" :value="sekunden(phase.repPauseMs)"
                     @input="e => setSekunden('repPauseMs', e.target.value)" />
            </div>
          </div>
          <div class="k-spalte">
            <label class="e-schalter">
              <input type="checkbox" :checked="phase.soundAtStart" @change="e => { phase.soundAtStart = e.target.checked; merken() }" />
              Startsignal am Beginn der Schießzeit
            </label>
            <label class="e-schalter">
              <input type="checkbox" :checked="phase.soundAtEnd" @change="e => { phase.soundAtEnd = e.target.checked; merken() }" />
              Endsignal am Ablauf der Schießzeit
            </label>
            <label class="e-schalter">
              <input type="checkbox" :checked="phase.waitAfter" @change="e => { phase.waitAfter = e.target.checked; merken() }" />
              Danach auf die Aufsicht warten
            </label>
          </div>
        </template>
      </fieldset>

      <div class="k-spalte abstand" v-if="!arbeit.readonly">
        <button class="k-haupt" :disabled="!geaendert" @click="sichern">
          Satz sichern
          <span class="k-unter">{{ geaendert ? 'Es gibt ungesicherte Änderungen' : 'Keine Änderungen offen' }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.editor {
  min-height: 100dvh; background: var(--f-grund); color: var(--f-text);
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
.ansage-zeile { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; }
.regel-warnung { margin: 0.25rem 0 0; color: var(--f-akzent); font-size: 0.85rem; line-height: 1.45; }
.abstand { margin-top: 0.5rem; }
</style>
