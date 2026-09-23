<script setup>
/**
 * RO-Texte einer Disziplin ändern: Ansage zum Vorlesen, Kommandos je Phase
 * und die Kommandofolge. Erreichbar direkt aus dem Lauf, damit die Aufsicht
 * einen Text dort anpasst, wo sie ihn liest, ohne den Satz-Editor zu kennen.
 *
 * Gearbeitet wird an einer Kopie; erst „Sichern“ schreibt in die Bibliothek.
 * Der mitgelieferte Satz bleibt dabei unangetastet (Kopie, siehe App).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildAnnouncement, buildEppAnnouncement } from '../core/ansage.js'
import { enrichDiscipline, KOMMANDO_GRUPPEN } from '../core/disciplineRules.js'

const props = defineProps({
  disziplin:  { type: Object,  required: true },
  startIndex: { type: Number,  default: 0 },
  schreibgeschuetzt: { type: Boolean, default: false },
})
const emit = defineEmits(['sichern', 'schliessen'])
const { t } = useI18n()

const istEpp = computed(() => props.disziplin.kind === 'epp')

/**
 * Arbeitskopie nur der Felder, die hier bearbeitet werden. Die Liste der
 * Zusatzkommandos zeigt genau das, was auch im Lauf erscheint (siehe
 * SequenceMatchView): bei amtlicher Folge nur selbst gepflegte Zeilen.
 */
const mitFolge = !!props.disziplin.commandSet
const phasen = ref((props.disziplin.phases ?? []).map(p => ({
  ansage: p.ansage ?? '',
  roCommands: mitFolge && !p.roCommandsEigen ? [] : [...(p.roCommands ?? [])],
})))
const amtlich = computed(() => enrichDiscipline({ ...props.disziplin, commandTexts: undefined }).commandSet)
const kopie = (liste) => (liste ?? []).map(k => ({ de: k.de ?? '', en: k.en ?? '', hinweis: k.hinweis ?? '' }))
function folgeAus(quelle) {
  return quelle ? Object.fromEntries(KOMMANDO_GRUPPEN.map(g => [g, kopie(quelle[g])])) : null
}
const folge = ref(folgeAus(props.disziplin.commandSet))
const folgeEigen = ref(!!props.disziplin.commandTexts)

const index = ref(Math.min(props.startIndex, Math.max(0, phasen.value.length - 1)))
const aktuell = computed(() => phasen.value[index.value])
const phaseRoh = computed(() => props.disziplin.phases[index.value])
const geaendert = ref(false)
const verwerfenFrage = ref(false)
const resetFrage = ref(false)
const merken = () => { geaendert.value = true }

function phasenLabel(p, i) {
  return istEpp.value ? String(p.station ?? i + 1).replace('Station ', '') : String(i + 1)
}

/** Was ohne eigenen Text angesagt würde — als Platzhalter und Vorschlag. */
const automatisch = computed(() => {
  const ohne = props.disziplin.phases.map((p, i) => (i === index.value ? { ...p, ansage: undefined } : p))
  const a = istEpp.value
    ? buildEppAnnouncement(ohne, index.value)
    : buildAnnouncement(ohne, index.value, props.disziplin)
  return [a.fuehrung, a.detail].filter(Boolean).join('\n')
})
function vorschlagUebernehmen() { aktuell.value.ansage = automatisch.value; merken() }
function ansageLeeren() { aktuell.value.ansage = ''; merken() }

function kommandoHinzu() { aktuell.value.roCommands.push(''); merken() }
function kommandoWeg(i)  { aktuell.value.roCommands.splice(i, 1); merken() }

function folgeZeileHinzu(g) { folge.value[g].push({ de: '', en: '', hinweis: '' }); folgeEigen.value = true; merken() }
function folgeZeileWeg(g, i) { folge.value[g].splice(i, 1); folgeEigen.value = true; merken() }
const folgeGeaendert = () => { folgeEigen.value = true; merken() }
function folgeZuruecksetzen() {
  folge.value = folgeAus(amtlich.value)
  folgeEigen.value = false
  resetFrage.value = false
  merken()
}

function sichern() {
  emit('sichern', {
    phasen: phasen.value.map(p => ({
      ansage: String(p.ansage ?? '').trim() ? String(p.ansage).trim() : null,
      roCommands: p.roCommands.map(k => String(k).trim()).filter(Boolean),
    })),
    commandTexts: folge.value && folgeEigen.value ? folge.value : null,
  })
  geaendert.value = false
}
function zurueck() {
  if (geaendert.value) verwerfenFrage.value = true
  else emit('schliessen')
}
</script>

<template>
  <div class="ro">
    <button class="k-nav" @click="zurueck">{{ t('v3.ro.zurueck') }}</button>

    <div v-if="verwerfenFrage" class="rueckfrage" role="alertdialog">
      <p>{{ t('v3.ro.verwerfenFrage') }}</p>
      <div class="k-reihe">
        <button class="k-zweit" @click="verwerfenFrage = false">{{ t('v3.ro.weiterBearbeiten') }}</button>
        <button class="k-gefahr" @click="emit('schliessen')">{{ t('v3.ro.verwerfen') }}</button>
      </div>
    </div>

    <header>
      <h1>{{ t('v3.ro.titel') }}</h1>
      <p class="unter">{{ disziplin.name }}</p>
      <p v-if="schreibgeschuetzt" class="hinweis">{{ t('v3.ro.kopieHinweis') }}</p>
    </header>

    <!-- Phase oder Station wählen -->
    <nav class="phasen" :aria-label="istEpp ? t('v3.epp.station') : t('v3.seq.phase')">
      <button
        v-for="(p, i) in disziplin.phases" :key="i"
        class="phase-knopf" :class="{ aktiv: i === index }" :aria-pressed="i === index"
        @click="index = i">{{ phasenLabel(p, i) }}</button>
    </nav>
    <p class="phase-name">{{ istEpp ? phaseRoh?.station : phaseRoh?.name }}</p>

    <!-- Ansage -->
    <section class="block">
      <h2 class="marke">{{ t('v3.ro.ansage') }}</h2>
      <p class="erklaerung">{{ t('v3.ro.ansageErklaerung') }}</p>
      <label class="e-marke" for="ro-ansage">{{ t('v3.ro.ansageFeld') }}</label>
      <textarea
        id="ro-ansage" class="e-feld ansage-feld" rows="4"
        :placeholder="automatisch" v-model="aktuell.ansage" @input="merken"></textarea>
      <div class="k-reihe">
        <button class="k-zweit" @click="vorschlagUebernehmen">{{ t('v3.ro.vorschlag') }}</button>
        <button class="k-zweit" :disabled="!aktuell.ansage" @click="ansageLeeren">{{ t('v3.ro.automatisch') }}</button>
      </div>
      <p class="stand">{{ aktuell.ansage?.trim() ? t('v3.ro.standEigen') : t('v3.ro.standAutomatisch') }}</p>
    </section>

    <!-- Zusätzliche Kommandos dieser Phase -->
    <section class="block">
      <h2 class="marke">{{ istEpp ? t('v3.ro.kommandosStation') : t('v3.ro.kommandosPhase') }}</h2>
      <p class="erklaerung">{{ istEpp ? t('v3.ro.kommandosStationErklaerung') : t('v3.ro.kommandosPhaseErklaerung') }}</p>
      <div v-for="(k, i) in aktuell.roCommands" :key="i" class="zeile">
        <input :id="`ro-kommando-${i}`" class="e-feld" v-model="aktuell.roCommands[i]" :aria-label="t('v3.ro.kommando') + ' ' + (i + 1)" @input="merken" />
        <button class="k-gefahr weg" :aria-label="t('v3.ro.entfernen')" @click="kommandoWeg(i)">✕</button>
      </div>
      <button class="k-zweit" @click="kommandoHinzu">{{ t('v3.ro.kommandoHinzu') }}</button>
    </section>

    <!-- Kommandofolge der Disziplin -->
    <section v-if="folge" class="block">
      <h2 class="marke">{{ t('v3.ro.folge', { regel: amtlich?.ruleRef ?? '' }) }}</h2>
      <p class="erklaerung">{{ t('v3.ro.folgeErklaerung') }}</p>
      <p class="stand">{{ folgeEigen ? t('v3.ro.folgeEigen') : t('v3.ro.folgeAmtlich') }}</p>

      <div v-for="g in ['vorher', 'start', 'abbruch', 'nachher']" :key="g" class="gruppe">
        <template v-if="folge[g].length || amtlich?.[g]?.length">
          <h3 class="gruppe-titel">{{ t('v3.ro.gruppe.' + g) }}</h3>
          <div v-for="(k, i) in folge[g]" :key="i" class="befehl">
            <label class="e-marke" :for="`ro-${g}-${i}-de`">{{ t('v3.ro.deutsch') }}</label>
            <input :id="`ro-${g}-${i}-de`" class="e-feld" v-model="k.de" @input="folgeGeaendert" />
            <label class="e-marke" :for="`ro-${g}-${i}-en`">{{ t('v3.ro.englisch') }}</label>
            <input :id="`ro-${g}-${i}-en`" class="e-feld" v-model="k.en" @input="folgeGeaendert" />
            <label class="e-marke" :for="`ro-${g}-${i}-h`">{{ t('v3.ro.hinweis') }}</label>
            <textarea :id="`ro-${g}-${i}-h`" class="e-feld klein" rows="2" v-model="k.hinweis" @input="folgeGeaendert"></textarea>
            <button class="k-gefahr" @click="folgeZeileWeg(g, i)">{{ t('v3.ro.kommandoEntfernen') }}</button>
          </div>
          <button class="k-zweit" @click="folgeZeileHinzu(g)">{{ t('v3.ro.kommandoHinzu') }}</button>
        </template>
      </div>

      <template v-if="folgeEigen">
        <button v-if="!resetFrage" class="k-zweit" @click="resetFrage = true">{{ t('v3.ro.zuruecksetzen') }}</button>
        <div v-else class="rueckfrage">
          <p>{{ t('v3.ro.zuruecksetzenFrage') }}</p>
          <div class="k-reihe">
            <button class="k-zweit" @click="resetFrage = false">{{ t('v3.allgemein.behalten') }}</button>
            <button class="k-gefahr" @click="folgeZuruecksetzen">{{ t('v3.ro.zuruecksetzenJa') }}</button>
          </div>
        </div>
      </template>
    </section>

    <button class="k-haupt" :disabled="!geaendert" @click="sichern">
      {{ t('v3.ro.sichern') }}
      <span class="k-unter">{{ geaendert ? t('v3.ro.sichernUnter') : t('v3.ro.nichtsGeaendert') }}</span>
    </button>
  </div>
</template>

<style scoped>
.ro {
  min-height: 100dvh; background: var(--f-grund); color: var(--f-text); box-sizing: border-box;
  padding: 0.75rem 0.75rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 0.9rem; max-width: 44rem; margin: 0 auto;
}
h1 { margin: 0.4rem 0 0; font-size: 1.6rem; }
.unter { margin: 0.1rem 0 0; color: var(--f-gedaempft); font-size: 0.95rem; }
.hinweis { margin: 0.6rem 0 0; padding: 0.6rem 0.8rem; background: var(--f-flaeche); border: 1px dashed var(--f-rand); border-radius: var(--r-klein); font-size: 0.84rem; line-height: 1.5; color: var(--f-gedaempft); }
.phasen { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.phase-knopf {
  flex: 1 1 2.75rem; min-height: 3rem; font: inherit; font-size: 0.95rem; cursor: pointer;
  background: var(--f-flaeche); color: var(--f-text); border: 1px solid var(--f-rand); border-radius: var(--r-klein);
}
.phase-knopf.aktiv { background: var(--f-akzent); color: #1a1205; border-color: var(--f-akzent); font-weight: 700; }
.phase-knopf:focus-visible { outline: 2px solid var(--f-akzent); outline-offset: 2px; }
.phase-name { margin: -0.3rem 0 0; font-weight: 600; font-size: 1.05rem; }
.block { background: var(--f-flaeche); border: 1px solid var(--f-rand); border-radius: var(--r-mittel); padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
.marke { margin: 0; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--f-gedaempft); }
.erklaerung { margin: 0; font-size: 0.84rem; line-height: 1.5; color: var(--f-gedaempft); }
.stand { margin: 0; font-size: 0.8rem; color: var(--f-akzent); }
.ansage-feld { min-height: 7rem; font-size: 1.05rem; line-height: 1.5; }
.ansage-feld::placeholder { color: #6b7684; }
.zeile { display: grid; grid-template-columns: 1fr 3.25rem; gap: 0.5rem; }
.weg { min-height: 3.25rem; padding: 0; font-size: 1.1rem; }
.gruppe { display: flex; flex-direction: column; gap: 0.5rem; }
.gruppe-titel { margin: 0.4rem 0 0; font-size: 0.95rem; }
.befehl { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.75rem; background: var(--f-flaeche-hoch); border: 1px solid var(--f-rand); border-radius: var(--r-klein); }
.befehl .e-marke { margin: 0.2rem 0 0; }
.befehl .k-gefahr { margin-top: 0.4rem; min-height: 3rem; }
.e-feld.klein { min-height: 4rem; font-size: 0.92rem; }
.rueckfrage { background: #2a0b0b; border: 1px solid #7f1d1d; border-radius: var(--r-klein); padding: 0.75rem; }
.rueckfrage p { margin: 0 0 0.6rem; line-height: 1.5; }
</style>
