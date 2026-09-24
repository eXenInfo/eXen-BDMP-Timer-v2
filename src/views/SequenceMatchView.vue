<script setup>
/**
 * Wettkampfmodus für die Standard-Disziplinen (PP1–PP4, NPA, BDMP 1020/1500 …).
 *
 * Gleiche Gestaltungsregel wie beim EPP: pro Zustand genau eine große Aktion.
 * Der Unterschied liegt im Ablauf — hier gibt es Vorläufe, Wiederholungen mit
 * Pausen dazwischen und Haltepunkte, an denen der RO weitergibt.
 */
import { useI18n } from 'vue-i18n'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createSequenceEngine, SeqState, SeqEvent } from '../core/sequenceEngine.js'
import { buildAnnouncement } from '../core/ansage.js'
import { phasenFuerSchuetzenuhr, phasenMitVorlauf, vorlaufMs, neutraleAnzeige, hatSchuetzenuhr } from '../core/laufModus.js'
import { useEngineClock, now } from '../composables/useEngineClock.js'
import { useLaufModus } from '../composables/useLaufModus.js'
import { useWachHalten } from '../composables/useWachHalten.js'
import ModusWahl from '../components/ModusWahl.vue'
import * as audio from '../core/audio.js'

const { t, locale } = useI18n()

const props = defineProps({
  /** Angereicherte Disziplin: Phasen, Kommandofolge, Stellungen, Regeltexte. */
  disziplin: { type: Object, required: true },
  /** Erzwingt eine Betriebsart, etwa 'schuetzenuhr' für die freie Zeit. */
  modusFest: { type: String, default: null },
  /** Ob der Knopf „RO-Texte bearbeiten“ erscheint. */
  bearbeitbar: { type: Boolean, default: true },
  /** Phase, bei der der Lauf einsetzt, etwa nach dem Bearbeiten der Texte. */
  startIndex: { type: Number, default: 0 },
})
defineEmits(['texte'])

const { modus, setzen: modusSetzen, tonAnwenden, tonFreigeben, stummEingestellt: stummLesen, vorlaufEingestellt } = useLaufModus()
/** Ohne lange Serie gibt es keine Schützenuhr, dann läuft immer die Aufsicht. */
const schuetzenuhrMoeglich = computed(() => hatSchuetzenuhr(props.disziplin))
const effektiv = computed(() => props.modusFest ??
  (modus.value === 'schuetzenuhr' && !schuetzenuhrMoeglich.value ? 'aufsicht' : modus.value))
const schuetzenuhr = computed(() => effektiv.value === 'schuetzenuhr')
const neutral = computed(() => neutraleAnzeige(effektiv.value))
useWachHalten()
/** Ob der Ton unter „Signale und Lautstärke“ ausgeschaltet ist (vor dem Lauf gelesen). */
const stummEingestellt = ref(stummLesen())
/** Vorlauf aus „Signale und Lautstärke“, `null` heißt „wie Disziplin“ (vor dem Lauf gelesen). */
const vorlaufS = ref(vorlaufEingestellt())
/** Vorlauf der Schützenuhr in Sekunden; 0 heißt Tipp beim Startsignal. */
const uhrVorlaufS = computed(() => vorlaufMs(0, vorlaufS.value, 'schuetzenuhr') / 1000)

const hinweiseOffen = ref(false)
const name   = computed(() => props.disziplin.name)
/**
 * Im Modus Schützenuhr: nur die langen Serien, jede einzeln, Start per Tipp.
 * Freie Zeit und EPP-Gesamtzeit haben genau eine selbst gewählte Serie.
 * Vorlauf laut Einstellung.
 */
const phases = computed(() => schuetzenuhr.value
  ? phasenFuerSchuetzenuhr(props.disziplin.phases, vorlaufS.value,
      { alle: !!(props.disziplin.freieZeit || props.disziplin.eppGesamtzeit) })
  : phasenMitVorlauf(props.disziplin.phases, vorlaufS.value))
const befehle = computed(() => props.disziplin.commandSet ?? null)

/**
 * Zusätzliche Kommandos der Phase. Gibt es eine amtliche Kommandofolge,
 * erscheinen nur selbst gepflegte Zeilen: Die aus dem Altbestand übernommenen
 * Bruchstücke wiederholen sonst nur die Folge in älterer Fassung.
 */
const zusatzKommandos = computed(() =>
  befehle.value && !phase.value?.roCommandsEigen ? [] : (phase.value?.roCommands ?? []))

const clock = useEngineClock({
  onEvents(events) {
    for (const e of events) {
      if (e.type === SeqEvent.START_SIGNAL) audio.playStartSignal()
      if (e.type === SeqEvent.END_SIGNAL)   audio.playEndSignal()
      if (e.type === SeqEvent.FINISHED)     audio.playFinishSignal()
    }
  },
})

function neuAufsetzen() {
  clock.setEngine(createSequenceEngine({ phases: phases.value }))
}
onMounted(() => {
  tonAnwenden(props.modusFest); neuAufsetzen(); clock.start()
  if (props.startIndex > 0 && !schuetzenuhr.value) clock.call('goToPhase', props.startIndex, now())
})
onBeforeUnmount(tonFreigeben)
watch(() => props.disziplin, neuAufsetzen)
watch(effektiv, () => { tonAnwenden(props.modusFest); neuAufsetzen() })

const s = clock.snapshot
const zustand = computed(() => s.value?.state ?? SeqState.IDLE)
/**
 * Die laufende Phase mit allen Feldern. Der Zeitkern gibt nur die normierten
 * Zeitwerte zurück; Beschreibung, Distanz, Stellungen und Kommandos der
 * Phase kommen aus der Disziplin selbst.
 */
const phase = computed(() => {
  const roh = phases.value[s.value?.index ?? 0]
  const kern = s.value?.phase
  return roh || kern ? { ...(roh ?? {}), ...(kern ?? {}) } : null
})

const sek = (ms) => ms == null ? '—' : String(Math.ceil(ms / 1000))
function mmss(ms) {
  if (ms == null) return '—:—'
  const g = Math.ceil(ms / 1000)
  return `${String(Math.floor(g / 60)).padStart(2, '0')}:${String(g % 60).padStart(2, '0')}`
}

/** Unter einer Minute in Sekunden, darüber mm:ss — so liest es sich am schnellsten. */
const anzeige = computed(() => {
  const r = s.value?.remainingMs
  if (zustand.value === SeqState.IDLE)         return mmss(phase.value?.durationMs)
  if (zustand.value === SeqState.WAITING_NEXT) return mmss(phase.value?.durationMs)
  if (zustand.value === SeqState.FINISHED)     return '00:00'
  if (r == null) return '—:—'
  return r < 60_000 ? sek(r) : mmss(r)
})

const beschriftung = computed(() => ({
  [SeqState.IDLE]:         t('v3.seq.bereit'),
  [SeqState.PREP]:         t('v3.seq.achtung'),
  [SeqState.RUNNING]:      t('v3.seq.schiesszeit'),
  [SeqState.REP_PAUSE]:    t('v3.seq.pauseDazwischen'),
  [SeqState.WAITING_NEXT]: t('v3.seq.wartetAufAufsicht'),
  [SeqState.PAUSED]:       t('v3.seq.angehalten'),
  [SeqState.FINISHED]:     t('v3.seq.beendet'),
}[zustand.value] ?? ''))

const laeuft = computed(() =>
  [SeqState.PREP, SeqState.RUNNING, SeqState.REP_PAUSE].includes(zustand.value))

/** Die Betriebsart lässt sich nur vor dem Lauf und nach dem Ende wechseln. */
const modusWaehlbar = computed(() => !props.modusFest && schuetzenuhrMoeglich.value &&
  [SeqState.IDLE, SeqState.FINISHED].includes(zustand.value))

const hauptaktion = computed(() => {
  if (schuetzenuhr.value) return hauptaktionSchuetzenuhr()
  switch (zustand.value) {
    case SeqState.IDLE:
      return { text: t('v3.seq.starten'), unter: phase.value?.name ?? '', fn: starten, klasse: 'gruen' }
    case SeqState.WAITING_NEXT:
      return { text: t('v3.seq.weiter'), unter: phase.value?.name ?? '', fn: weiter, klasse: 'gruen' }
    case SeqState.PAUSED:
      return { text: t('v3.seq.fortsetzen'), unter: t('v3.seq.nochSekunden', { s: sek(s.value?.remainingMs) }), fn: fortsetzen, klasse: 'gruen' }
    case SeqState.RUNNING:
    case SeqState.PREP:
    case SeqState.REP_PAUSE:
      return { text: t('v3.seq.anhalten'), unter: t('v3.seq.zeitStopptSofort'), fn: anhalten, klasse: 'gelb' }
    case SeqState.FINISHED:
      return { text: t('v3.seq.neuerDurchgang'), unter: name.value, fn: zuruecksetzen, klasse: 'grau' }
    default: return null
  }
})

/** Schützenuhr: gleiche Knöpfe, aber einheitlich neutral und mit Worten für den Schützen. */
function hauptaktionSchuetzenuhr() {
  const tippText = uhrVorlaufS.value > 0 ? t('v3.modus.startBeiAchtung') : t('v3.modus.startBeimSignal')
  switch (zustand.value) {
    case SeqState.IDLE:
      return { text: tippText, unter: phase.value?.name ?? '', fn: starten, klasse: 'neutral' }
    case SeqState.WAITING_NEXT:
      return { text: tippText, unter: phase.value?.name ?? '', fn: weiter, klasse: 'neutral' }
    case SeqState.PAUSED:
      return { text: t('v3.seq.fortsetzen'), unter: t('v3.seq.nochSekunden', { s: sek(s.value?.remainingMs) }), fn: fortsetzen, klasse: 'neutral' }
    case SeqState.PREP:
    case SeqState.RUNNING:
      return { text: t('v3.seq.anhalten'), unter: t('v3.seq.zeitStopptSofort'), fn: anhalten, klasse: 'neutral' }
    case SeqState.FINISHED:
      return { text: t('v3.seq.neuerDurchgang'), unter: name.value, fn: zuruecksetzen, klasse: 'neutral' }
    default: return null
  }
}

async function starten()     { await audio.arm(); clock.call('start', now()) }
function weiter()            { clock.call('continueNext', now()) }
function anhalten()          { clock.call('pause', now()) }
function fortsetzen()        { clock.call('resume', now()) }
function zuruecksetzen()     { clock.call('reset', now()) }
async function zuPhase(i)    { await audio.arm(); clock.call('goToPhase', i, now()) }

/**
 * Der Ablauf, wie der RO ihn den Schützen ansagt.
 *
 * Steht bewusst vor der Kommandofolge und in lesbarer Größe: Der RO liest
 * ihn laut vor, bevor er das erste Kommando gibt. Klein und grau am
 * Bildschirmrand wäre er dafür unbrauchbar.
 */
const ansage = computed(() => {
  const phasen = props.disziplin?.phases ?? []
  if (!phasen.length) return null
  const a = buildAnnouncement(phasen, s.value?.index ?? 0, props.disziplin, locale.value)
  if (!a.detail) return null
  // Pausen zwischen den Durchgängen gehören in die Ansage, weil die Schützen
  // sonst nicht wissen, ob sie die Waffe absetzen dürfen.
  const p = phase.value
  const zusatz = p?.repPauseMs
    ? t('v3.seq.mitPause', { pause: Math.round(p.repPauseMs / 1000) }).trim()
    : null
  return { ...a, zusatz }
})

const wiederholungen = computed(() => {
  const p = phase.value
  if (!p || p.repetitions <= 1) return null
  return `${s.value?.repetition ?? 1} / ${p.repetitions}`
})
</script>

<template>
  <div class="schirm" :class="{ neutral }">
    <header class="kopf">
      <div class="kopf-block">
        <span class="kopf-marke">{{ t('v3.seq.disziplin') }}</span>
        <strong class="kopf-wert name">{{ name }}</strong>
      </div>
      <div class="kopf-block rechts">
        <span class="kopf-marke">{{ t('v3.seq.phase') }}</span>
        <strong class="kopf-wert">{{ (s?.index ?? 0) + 1 }}<span class="von">/{{ phases.length }}</span></strong>
      </div>
    </header>

    <ModusWahl v-if="modusWaehlbar" :modus="effektiv" :stumm="stummEingestellt" :vorlauf-s="uhrVorlaufS"
      :epp="!!disziplin.eppGesamtzeit" @wahl="modusSetzen" />

    <main class="mitte-block">
      <p class="phase-zeile">
        <strong>{{ phase?.name }}</strong>
        <span v-if="phase?.distance" class="distanz">{{ phase.distance }}</span>
      </p>
      <p v-if="phase?.description && laeuft" class="beschreibung">{{ phase.description }}</p>

      <div class="uhr" :class="{ gross: zustand === 'prep' || (s?.remainingMs ?? 0) < 60000 }">{{ anzeige }}</div>
      <p class="uhr-marke">{{ beschriftung }}</p>

      <p v-if="wiederholungen" class="wdh">{{ t('v3.seq.durchgang') }} {{ wiederholungen }}</p>
      <p v-if="phase?.repetitions > 1 && zustand === 'idle'" class="wdh-plan">
        {{ t('v3.seq.durchgangPlan', { anzahl: phase.repetitions, dauer: Math.round(phase.durationMs / 1000) }) }}<span
          v-if="phase.repPauseMs">{{ t('v3.seq.mitPause', { pause: Math.round(phase.repPauseMs / 1000) }) }}</span>
      </p>
    </main>

    <!-- Ablauf zum Vorlesen — steht vor den Kommandos -->
    <section v-if="!schuetzenuhr && ansage && (zustand === 'idle' || zustand === 'waitingNext')" class="ansage">
      <p class="ansage-marke">{{ t('v3.seq.ansage') }}<span class="ansage-unter">{{ t('v3.seq.ansageUnter') }}</span></p>
      <p v-if="ansage.fuehrung" class="ansage-fuehrung">{{ ansage.fuehrung }}</p>
      <p class="ansage-zeile">{{ ansage.detail }}</p>
      <p v-if="ansage.zusatz" class="ansage-kopf">{{ ansage.zusatz }}</p>
    </section>

    <!-- Kommandofolge vor der Serie -->
    <section v-if="!schuetzenuhr && (zustand === 'idle' || zustand === 'waitingNext')" class="kommandos">
      <p class="kommando-marke" v-if="befehle">
        {{ t('v3.seq.kommandofolge', { regel: befehle.ruleRef }) }}
      </p>
      <ol class="kommando-liste" v-if="befehle">
        <li v-for="(k, i) in [...befehle.vorher, ...befehle.start]" :key="i">
          <span class="kommando">„{{ k.de }}“</span>
          <span class="kommando-en">{{ k.en }}</span>
          <span class="kommando-hinweis" v-if="k.hinweis">{{ k.hinweis }}</span>
        </li>
      </ol>
      <p v-for="(k, i) in zusatzKommandos" :key="'e' + i" class="kommando eigen">„{{ k }}“</p>
    </section>

    <!-- Kommandofolge nach der Serie -->
    <section v-else-if="!schuetzenuhr && zustand === 'finished' && befehle" class="kommandos nachher">
      <p class="kommando-marke">{{ t('v3.seq.nachSerie', { regel: befehle.ruleRef }) }}</p>
      <ol class="kommando-liste">
        <li v-for="(k, i) in befehle.nachher" :key="i">
          <span class="kommando">„{{ k.de }}“</span>
          <span class="kommando-en">{{ k.en }}</span>
        </li>
      </ol>
    </section>

    <!-- Abbruchkommando, solange geschossen wird -->
    <section v-else-if="!schuetzenuhr && laeuft && befehle?.abbruch?.length" class="kommandos abbruch">
      <p class="kommando-marke">{{ t('v3.seq.abbruch') }}</p>
      <p class="kommando">„{{ befehle.abbruch[0].de }}“ <span class="kommando-en">{{ befehle.abbruch[0].en }}</span></p>
      <p class="kommando-hinweis">{{ befehle.abbruch[0].hinweis }}</p>
    </section>

    <!-- RO-Texte ändern: direkt dort, wo sie gebraucht werden -->
    <div v-if="bearbeitbar && !schuetzenuhr && zustand === 'idle'" class="k-liste">
      <button class="k-menue" @click="$emit('texte', s?.index ?? 0)">
        <span class="k-menue-text">{{ t('v3.ro.bearbeiten') }}
          <span class="k-unter">{{ t('v3.ro.bearbeitenUnter') }}</span></span>
        <span class="k-menue-pfeil" aria-hidden="true">›</span>
      </button>
    </div>

    <!-- Stellungen, Fertigstellung, Ablauf und Hinweise -->
    <section v-if="!laeuft && !schuetzenuhr" class="hinweise">
      <button class="k-aufklapp" :aria-expanded="hinweiseOffen" @click="hinweiseOffen = !hinweiseOffen">
        <span class="k-aufklapp-text">
          {{ hinweiseOffen ? t('v3.seq.regeltexteVerbergen') : t('v3.seq.regeltexteZeigen') }}
          <span class="regel" v-if="disziplin.ruleRef">{{ disziplin.ruleRef }}</span>
        </span>
      </button>

      <div v-if="hinweiseOffen" class="hinweis-liste">
        <template v-if="disziplin.abweichung">
          <p class="warnung">{{ disziplin.abweichung }}</p>
        </template>

        <template v-if="disziplin.varianten?.length">
          <p class="hinweis-titel">{{ t('v3.seq.variantenTitel') }}</p>
          <p class="fliess klein">{{ disziplin.varianten.length > 1 ? t('v3.seq.gleicheZeiten') : t('v3.seq.eigenerSatz') }}</p>
          <div v-for="v in disziplin.varianten" :key="v.ruleRef" class="variante">
            <strong>{{ v.label }} <span class="regel">{{ v.ruleRef }}</span></strong>
            <ul v-if="v.hinweise?.length"><li v-for="(h, i) in v.hinweise" :key="i">{{ h }}</li></ul>
          </div>
        </template>

        <template v-if="phase?.positions?.length">
          <p class="hinweis-titel">{{ t('v3.seq.stellungenDieserPhase') }}</p>
          <div v-for="st in phase.positions" :key="st.name" class="stellung">
            <strong>{{ st.name }} <span class="regel">{{ st.ruleRef }}</span></strong>
            <p>{{ st.text }}</p>
          </div>
        </template>

        <template v-if="phase?.positionChangeNotes?.length">
          <p class="hinweis-titel">{{ t('v3.seq.beimStellungswechsel') }}</p>
          <ul><li v-for="(n, i) in phase.positionChangeNotes" :key="i">{{ n }}</li></ul>
        </template>

        <template v-if="disziplin.readiness">
          <p class="hinweis-titel">{{ t('v3.seq.fertigstellung') }} <span class="regel">{{ disziplin.readiness.ruleRef }}</span></p>
          <p class="fliess">{{ disziplin.readiness.text }}</p>
        </template>

        <template v-if="disziplin.ablauf?.length">
          <p class="hinweis-titel">{{ t('v3.seq.ablaufLautSpo') }}</p>
          <ul><li v-for="(a, i) in disziplin.ablauf" :key="i">{{ a }}</li></ul>
        </template>

        <template v-if="disziplin.hinweise?.length">
          <p class="hinweis-titel">{{ t('v3.seq.weitereRegeln') }}</p>
          <ul><li v-for="(h, i) in disziplin.hinweise" :key="i">{{ h }}</li></ul>
        </template>

        <template v-if="befehle?.hinweise?.length">
          <p class="hinweis-titel">{{ t('v3.seq.entladenVorzeigen') }}</p>
          <ul><li v-for="(h, i) in befehle.hinweise" :key="i">{{ h }}</li></ul>
        </template>

        <p class="quelle" v-if="disziplin.ammo || disziplin.target">
          <template v-if="disziplin.ammo">{{ t('v3.seq.munition') }}: {{ disziplin.ammo }}. </template>
          <template v-if="disziplin.target">{{ t('v3.seq.scheibe') }}: {{ disziplin.target }}.</template>
        </p>
      </div>
    </section>

    <footer class="fuss">
      <button v-if="hauptaktion" class="haupt" :class="hauptaktion.klasse" @click="hauptaktion.fn">
        <span class="haupt-text">{{ hauptaktion.text }}</span>
        <span class="haupt-unter">{{ hauptaktion.unter }}</span>
      </button>

      <div class="neben" v-if="laeuft || zustand === 'paused'">
        <button class="klein" @click="zuruecksetzen">{{ t('v3.allgemein.abbrechen') }}</button>
      </div>

      <nav class="phasen" v-if="!laeuft">
        <button
          v-for="(p, i) in phases" :key="i"
          class="phase-knopf"
          :class="{ aktiv: i === s?.index, erledigt: i < (s?.index ?? 0) }"
          :title="p.name"
          @click="zuPhase(i)">{{ i + 1 }}</button>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.schirm {
  --grund: #0b0d10; --flaeche: #15191f; --rand: #262c35;
  --text: #f2f5f8; --gedaempft: #9aa6b4; --akzent: #f59e0b; --gruen: #16a34a;
  min-height: calc(100dvh - env(safe-area-inset-top)); display: flex; flex-direction: column; gap: 0.75rem;
  padding: 0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom));
  background: var(--grund); color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}
.kopf { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
.kopf-block { background: var(--flaeche); border: 1px solid var(--rand); border-radius: 0.75rem; padding: 0.5rem 0.75rem; min-width: 0; }
.kopf-block.rechts { text-align: right; }
.kopf-marke { display: block; font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gedaempft); }
.kopf-wert { display: block; font-size: 1.6rem; font-variant-numeric: tabular-nums; line-height: 1.2; }
.kopf-wert.name { font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.von { font-size: 1rem; color: var(--gedaempft); }

.mitte-block { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.15rem; }
.phase-zeile { font-size: 1.2rem; margin: 0; display: flex; flex-direction: column; gap: 0.15rem; }
.distanz { color: var(--akzent); font-size: 0.95rem; }
.beschreibung { margin: 0.35rem 0 0; color: var(--gedaempft); font-size: 0.9rem; line-height: 1.45; white-space: pre-line; max-width: 34rem; }
.uhr { font-size: clamp(4rem, 22vw, 8rem); font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; margin: 0.5rem 0 0; }
.uhr.gross { font-size: clamp(4.5rem, 26vw, 12rem); color: var(--akzent); }
.uhr-marke { margin: 0.2rem 0 0; color: var(--gedaempft); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; }
.wdh { margin: 0.4rem 0 0; font-size: 1.1rem; color: var(--akzent); font-variant-numeric: tabular-nums; }
.wdh-plan { margin: 0.3rem 0 0; color: var(--gedaempft); font-size: 0.85rem; }

.ansage {
  background: #1b2029; border: 1px solid var(--rand); border-left: 4px solid #3b82f6;
  border-radius: 0.75rem; padding: 0.85rem 1rem;
}
.ansage-marke {
  margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--gedaempft); display: flex; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;
}
.ansage-unter { text-transform: none; letter-spacing: 0; font-style: italic; }
.ansage-kopf { margin: 0 0 0.4rem; font-size: 1rem; color: #93c5fd; font-variant-numeric: tabular-nums; }
.ansage-fuehrung { margin: 0 0 0.35rem; font-size: 1.35rem; font-weight: 700; line-height: 1.35; color: var(--text); }
.ansage-zeile { margin: 0.25rem 0; font-size: 1.15rem; line-height: 1.5; color: var(--text); }

.kommandos { background: var(--flaeche); border: 1px solid var(--rand); border-left: 4px solid var(--akzent); border-radius: 0.75rem; padding: 0.8rem 1rem; }
.kommandos.nachher { border-left-color: var(--gruen); }
.kommandos.abbruch { border-left-color: #dc2626; }
.kommando-marke { margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--gedaempft); }
.kommando-liste { margin: 0; padding-left: 1.3rem; display: flex; flex-direction: column; gap: 0.6rem; }
.kommando-liste li::marker { color: var(--akzent); font-weight: 700; }
.kommando { display: block; margin: 0; font-size: 1.12rem; font-weight: 600; line-height: 1.35; }
.kommando.eigen { margin-top: 0.6rem; color: var(--akzent); }
.kommando-en { display: block; font-size: 0.82rem; font-weight: 400; color: var(--gedaempft); font-style: italic; }
.kommando-hinweis { display: block; margin-top: 0.25rem; font-size: 0.82rem; color: var(--gedaempft); line-height: 1.45; }

.hinweise { display: flex; flex-direction: column; gap: 0.5rem; }
.regel { font-size: 0.7rem; padding: 0.1rem 0.4rem; border: 1px solid var(--rand); border-radius: 0.4rem; color: var(--gedaempft); font-weight: 400; }
.hinweis-liste { background: var(--flaeche); border: 1px solid var(--rand); border-radius: 0.75rem; padding: 0.85rem 1rem; max-height: 50vh; overflow-y: auto; }
.hinweis-liste ul { margin: 0.3rem 0 0.6rem; padding-left: 1.1rem; }
.hinweis-liste li { margin: 0.35rem 0; font-size: 0.88rem; line-height: 1.5; color: #d7dee6; }
.hinweis-titel { margin: 0.9rem 0 0.2rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gedaempft); }
.hinweis-titel:first-child { margin-top: 0; }
.fliess { margin: 0.3rem 0 0.6rem; font-size: 0.88rem; line-height: 1.5; color: #d7dee6; }
.variante { margin: 0.4rem 0 0.7rem; }
.variante strong { display: block; font-size: 0.95rem; margin-bottom: 0.2rem; }
.variante ul { margin: 0.25rem 0 0; }
.fliess.klein { font-size: 0.82rem; color: var(--gedaempft); }
.stellung { margin: 0.4rem 0 0.7rem; }
.stellung strong { display: block; font-size: 0.95rem; margin-bottom: 0.2rem; }
.stellung p { margin: 0; font-size: 0.86rem; line-height: 1.5; color: #d7dee6; }
.warnung { margin: 0 0 0.8rem; padding: 0.6rem 0.8rem; background: #3b1d05; border: 1px solid #7c4a08; border-radius: 0.5rem; color: var(--akzent); font-size: 0.86rem; line-height: 1.5; }
.sprachhinweis { margin: 0 0 0.8rem; padding: 0.55rem 0.75rem; background: var(--flaeche); border: 1px dashed var(--rand); border-radius: 0.5rem; color: var(--gedaempft); font-size: 0.8rem; line-height: 1.5; }
.quelle { margin: 0.8rem 0 0; font-size: 0.8rem; color: var(--gedaempft); line-height: 1.5; }

.fuss { display: flex; flex-direction: column; gap: 0.5rem; }
.haupt { width: 100%; min-height: 5.5rem; border: none; border-radius: 1rem; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem; cursor: pointer; }
.haupt-text { font-size: 1.6rem; font-weight: 700; }
.haupt-unter { font-size: 0.8rem; opacity: 0.85; font-weight: 400; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.haupt.gruen { background: var(--gruen); }
.haupt.gelb { background: var(--akzent); color: #1a1205; }
.haupt.grau { background: #374151; }
.haupt:active { filter: brightness(0.9); }
.neben { display: flex; gap: 0.5rem; }
.klein { flex: 1; min-height: 3rem; background: var(--flaeche); color: var(--text); border: 1px solid var(--rand); border-radius: 0.75rem; font-size: 1rem; cursor: pointer; }

.phasen { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.phase-knopf { flex: 1 1 2.5rem; min-height: 2.75rem; background: var(--flaeche); color: var(--gedaempft); border: 1px solid var(--rand); border-radius: 0.6rem; font-size: 0.9rem; cursor: pointer; }
.phase-knopf.aktiv { background: var(--akzent); color: #1a1205; border-color: var(--akzent); font-weight: 700; }
.phase-knopf.erledigt { color: var(--gruen); border-color: #1f4030; }

/* Schützenuhr: eine Farbe für alles, damit sich nichts sichtbar umfärbt. */
.schirm.neutral { --akzent: var(--text); --gruen: var(--gedaempft); }
.neutral .uhr.gross { color: var(--text); }
.haupt.neutral { background: var(--flaeche); color: var(--text); border: 2px solid var(--gedaempft); }
.neutral .phase-knopf.aktiv { background: var(--text); color: var(--grund); border-color: var(--text); }
.neutral .phase-knopf.erledigt { color: var(--gedaempft); border-color: var(--rand); }
</style>
