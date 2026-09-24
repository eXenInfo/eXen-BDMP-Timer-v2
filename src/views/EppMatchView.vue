<script setup>
/**
 * Wettkampfmodus EPP — Ansicht für die Aufsicht auf dem Stand.
 *
 * Gestaltungsregel: In jedem Zustand gibt es genau eine große, naheliegende
 * Aktion. Alles Weitere ist kleiner und nachgeordnet. Restzeit und
 * Störungszähler bleiben dauerhaft sichtbar, weil beide wertungsrelevant sind.
 */
import { useI18n } from 'vue-i18n'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createEppEngine, EppState, EppEvent } from '../core/eppEngine.js'
import { EPP_PHASES, EPP_TOTAL_TIME_MS, EPP_GENERAL_NOTES, EPP_VARIANTEN } from '../core/eppRules.js'
import { buildEppAnnouncement } from '../core/ansage.js'
import { useEngineClock, now } from '../composables/useEngineClock.js'
import * as audio from '../core/audio.js'
import { vorlaufMs } from '../core/laufModus.js'
import { useLaufModus } from '../composables/useLaufModus.js'
import { useWachHalten } from '../composables/useWachHalten.js'
import ModusWahl from '../components/ModusWahl.vue'

const { t, locale } = useI18n()

const props = defineProps({
  phases:      { type: Array,  default: () => EPP_PHASES },
  totalTimeMs: { type: Number, default: EPP_TOTAL_TIME_MS },
  prepMs:      { type: Number, default: 3000 },
  varianten:   { type: Array,  default: () => EPP_VARIANTEN },
  allgemeineHinweise: { type: Array, default: () => EPP_GENERAL_NOTES },
  bearbeitbar: { type: Boolean, default: true },
  startIndex: { type: Number, default: 0 },
})
defineEmits(['texte'])

const { modus, setzen: modusSetzen, tonAnwenden, tonFreigeben, stummEingestellt: stummLesen, vorlaufEingestellt } = useLaufModus()
useWachHalten()
/** Ob der Ton unter „Signale und Lautstärke“ ausgeschaltet ist (vor dem Lauf gelesen). */
const stummEingestellt = ref(stummLesen())
/** Vorlauf aus „Signale und Lautstärke“, `null` heißt „wie Disziplin“ (vor dem Lauf gelesen). */
const vorlaufS = ref(vorlaufEingestellt())

const signalLaeuft = ref(false)
const hinweiseOffen = ref(false)

const clock = useEngineClock({
  onEvents(events) {
    for (const e of events) {
      if (e.type === EppEvent.START_SIGNAL) audio.playStartSignal()
      if (e.type === EppEvent.STOP_SIGNAL) {
        audio.playStopSignal(e.durationMs)
        signalLaeuft.value = true
        setTimeout(() => { signalLaeuft.value = false }, e.durationMs)
      }
      if (e.type === EppEvent.FINISHED) audio.playFinishSignal()
      if (e.type === EppEvent.EXCLUDED) audio.playAlert()
    }
  },
})

function neuAufsetzen() {
  // Vorlauf laut Einstellung, sonst der der Disziplin. Die Schützenuhr des
  // EPP ist eine eigene Ansicht (nur Gesamtzeit), siehe App.vue.
  clock.setEngine(createEppEngine({
    phases: props.phases, totalTimeMs: props.totalTimeMs,
    prepMs: vorlaufMs(props.prepMs, vorlaufS.value, 'aufsicht'),
  }))
}
onMounted(() => {
  tonAnwenden(); neuAufsetzen(); clock.start()
  if (props.startIndex > 0) clock.call('goToStation', props.startIndex, now())
})
onBeforeUnmount(tonFreigeben)
watch(modus, () => { tonAnwenden(); neuAufsetzen() })

const s = clock.snapshot
const zustand = computed(() => s.value?.state ?? EppState.IDLE)
const phase   = computed(() => s.value?.phase ?? null)

function mmss(ms) {
  if (ms == null) return '—:—'
  const g = Math.ceil(ms / 1000)
  return `${String(Math.floor(g / 60)).padStart(2, '0')}:${String(g % 60).padStart(2, '0')}`
}
function sek(ms) {
  if (ms == null) return '—'
  return String(Math.ceil(ms / 1000))
}

/** Die große Zahl in der Mitte — je nach Zustand etwas anderes. */
const grosseZahl = computed(() => {
  if (!s.value) return '—'
  switch (zustand.value) {
    case EppState.PREP:          return sek(s.value.prepRemainingMs)
    case EppState.RUNNING_FIXED: return sek(s.value.stationRemainingMs)
    case EppState.RUNNING_OPEN:
    case EppState.MALFUNCTION:   return mmss(s.value.stationElapsedMs)
    case EppState.FINISHED:      return mmss(s.value.totalRemainingMs)
    default:                     return phase.value?.timeLimitMs > 0 ? sek(phase.value.timeLimitMs) : '00:00'
  }
})

const zahlBeschriftung = computed(() => ({
  [EppState.PREP]:          t('v3.epp.achtung'),
  [EppState.RUNNING_FIXED]: t('v3.epp.sekundenVerbleibend'),
  [EppState.RUNNING_OPEN]:  t('v3.epp.stationLaeuft'),
  [EppState.MALFUNCTION]:   t('v3.epp.stoerungZeitSteht'),
  [EppState.FINISHED]:      t('v3.epp.restzeitKarte'),
  [EppState.EXCLUDED]:      t('v3.epp.ausschluss'),
}[zustand.value] ?? t('v3.epp.bereit')))

const istOffen = computed(() => zustand.value === EppState.RUNNING_OPEN)
const istFest  = computed(() => zustand.value === EppState.RUNNING_FIXED)
const laeuft   = computed(() => istOffen.value || istFest.value)

const modusWaehlbar = computed(() =>
  [EppState.IDLE, EppState.FINISHED, EppState.EXCLUDED].includes(zustand.value) && (s.value?.stationIndex ?? 0) === 0)

/** Genau eine Hauptaktion je Zustand. */
const hauptaktion = computed(() => hauptaktionRoh())
function hauptaktionRoh() {
  switch (zustand.value) {
    case EppState.IDLE:
      return { text: t('v3.epp.stationStarten', { station: phase.value?.station ?? t('v3.epp.station') }),
               unter: t('v3.epp.startsignalAusloesen'), fn: starten, klasse: 'gruen' }
    case EppState.RUNNING_OPEN:
      return { text: t('v3.epp.stationBeenden'), unter: t('v3.epp.nachHolstern'), fn: beenden, klasse: 'gruen' }
    case EppState.RUNNING_FIXED:
      return { text: t('v3.epp.stoerung'), unter: t('v3.epp.zeitAnhalten'), fn: stoerung, klasse: 'gelb' }
    case EppState.MALFUNCTION:
      return { text: t('v3.epp.weiter'), unter: t('v3.epp.zeitLaeuftWeiter'), fn: weiter, klasse: 'gruen' }
    case EppState.FINISHED:
    case EppState.EXCLUDED:
      return { text: t('v3.epp.neuerDurchgang'), unter: t('v3.epp.parcoursZuruecksetzen'), fn: zuruecksetzen, klasse: 'grau' }
    default:
      return null
  }
}

async function starten() {
  await audio.arm()
  clock.call('start', now())
}
function beenden()      { clock.call('stopStation', now()) }
function stoerung()     { clock.call('reportMalfunction', now()) }
function weiter()       { clock.call('resumeAfterMalfunction', now()) }
function zuruecksetzen() { clock.call('reset', now()) }
function zuStation(i)   { clock.call('goToStation', i, now()) }

/** Der Ablauf der Station, wie ihn der RO vorliest. */
const ansage = computed(() => {
  const phasen = props.phases ?? []
  if (!phasen.length) return null
  const a = buildEppAnnouncement(phasen, s.value?.stationIndex ?? 0, locale.value)
  return a.detail ? a : null
})

const stoerungen = computed(() => s.value?.malfunctionCount ?? 0)
const restknapp  = computed(() => {
  const r = s.value?.totalRemainingMs
  return r != null && r <= 60_000
})
</script>

<template>
  <div class="schirm" :class="{ signal: signalLaeuft, gesperrt: zustand === 'excluded' }">

    <!-- Kopfzeile: dauerhaft sichtbare, wertungsrelevante Werte -->
    <header class="kopf">
      <div class="kopf-block">
        <span class="kopf-marke">{{ t('v3.epp.restzeitGesamt') }}</span>
        <strong class="kopf-wert" :class="{ knapp: restknapp }">{{ mmss(s?.totalRemainingMs) }}</strong>
      </div>
      <div class="kopf-block mitte">
        <span class="kopf-marke">{{ t('v3.epp.station') }}</span>
        <strong class="kopf-wert">{{ (s?.stationIndex ?? 0) + 1 }}<span class="von">/{{ phases.length }}</span></strong>
      </div>
      <div class="kopf-block rechts">
        <span class="kopf-marke">{{ t('v3.epp.stoerungen') }}</span>
        <strong class="kopf-wert">
          <span class="punkt" :class="{ an: stoerungen >= 1 }"></span>
          <span class="punkt" :class="{ an: stoerungen >= 2 }"></span>
        </strong>
      </div>
    </header>

    <ModusWahl v-if="modusWaehlbar" :modus="modus" :stumm="stummEingestellt" epp @wahl="modusSetzen" />

    <!-- Restzeitansage vor Station 6, C.17.8 -->
    <div v-if="phase?.announceRemainingBeforeStart && zustand === 'idle'" class="ansage">
      <span class="ansage-marke">{{ t('v3.epp.ansagen') }}</span>
      <strong class="ansage-wert">{{ t('v3.epp.restzeit') }} {{ mmss(s?.totalRemainingMs) }}</strong>
    </div>

    <!-- Station und Uhr -->
    <main class="mitte-block">
      <p class="station-zeile">
        <strong>{{ phase?.station }}</strong>
        <span v-if="phase?.distance"> · {{ phase.distance }}</span>
        <span v-if="phase?.position"> · {{ phase.position }}</span>
      </p>
      <p class="schuss-zeile" v-if="phase?.shots">
        {{ phase.shots }} {{ t('v3.epp.schuss') }}<span v-if="phase.shotsNote"> — {{ phase.shotsNote }}</span>
      </p>

      <div class="uhr" :class="{ gross: zustand === 'prep' || istFest }">{{ grosseZahl }}</div>
      <p class="uhr-marke">{{ zahlBeschriftung }}</p>

      <p v-if="istFest && phase?.stopSignalAtMs != null" class="signal-hinweis">
        {{ t('v3.epp.signalHinweis', { beginn: phase.stopSignalAtMs / 1000, dauer: phase.stopSignalDurationMs / 1000 }) }}
      </p>
    </main>

    <!-- Ablauf zum Vorlesen — steht vor den Kommandos -->
    <section v-if="ansage && zustand === 'idle'" class="ansage-block">
      <p class="ansage-marke2">{{ t('v3.epp.ansage') }}<span class="ansage-unter">{{ t('v3.epp.ansageUnter') }}</span></p>
      <p v-if="ansage.fuehrung" class="ansage-fuehrung">{{ ansage.fuehrung }}</p>
      <p class="ansage-zeile2">{{ ansage.detail }}</p>
    </section>

    <!-- RO-Kommandos der laufenden Station -->
    <section v-if="phase?.roCommands?.length && zustand === 'idle'" class="kommandos">
      <p v-for="(k, i) in phase.roCommands" :key="i" class="kommando">„{{ k }}“</p>
    </section>

    <!-- RO-Texte ändern -->
    <div v-if="bearbeitbar && zustand === 'idle'" class="k-liste">
      <button class="k-menue" @click="$emit('texte', s?.stationIndex ?? 0)">
        <span class="k-menue-text">{{ t('v3.ro.bearbeiten') }}
          <span class="k-unter">{{ t('v3.ro.bearbeitenUnter') }}</span></span>
        <span class="k-menue-pfeil" aria-hidden="true">›</span>
      </button>
    </div>

    <!-- Ablauf und Hinweise -->
    <section v-if="phase && (phase.notes?.length || phase.afterStation?.length)" class="hinweise">
      <button class="k-aufklapp" :aria-expanded="hinweiseOffen" @click="hinweiseOffen = !hinweiseOffen">
        <span class="k-aufklapp-text">
          {{ hinweiseOffen ? t('v3.epp.hinweiseVerbergen') : t('v3.epp.hinweiseZeigen') }}
          <span class="regel">{{ phase.ruleRef }}</span>
        </span>
      </button>
      <div v-if="hinweiseOffen" class="hinweis-liste">
        <template v-if="varianten.length">
          <p class="hinweis-titel">{{ t('v3.epp.variantenTitel') }}</p>
          <p class="variante-zeile">{{ t('v3.epp.gleicheZeiten') }}</p>
          <div v-for="v in varianten" :key="v.ruleRef" class="variante">
            <strong>{{ v.label }} <span class="regel">{{ v.ruleRef }}</span></strong>
            <ul v-if="v.hinweise?.length"><li v-for="(h, i) in v.hinweise" :key="i">{{ h }}</li></ul>
          </div>
        </template>
        <p class="hinweis-titel">{{ t('v3.epp.hinweiseZeigen') }}</p>
        <ul>
          <li v-for="(n, i) in phase.notes" :key="'n' + i">{{ n }}</li>
        </ul>
        <template v-if="phase.afterStation?.length">
          <p class="hinweis-titel">{{ t('v3.epp.nachStation') }}</p>
          <ul>
            <li v-for="(n, i) in phase.afterStation" :key="'a' + i">{{ n }}</li>
          </ul>
        </template>
        <p class="hinweis-titel">{{ t('v3.epp.immerGueltig') }}</p>
        <ul>
          <li v-for="(n, i) in allgemeineHinweise" :key="'g' + i">{{ n }}</li>
        </ul>
      </div>
    </section>

    <!-- Aktionen -->
    <footer class="fuss">
      <button v-if="hauptaktion" class="haupt" :class="hauptaktion.klasse" @click="hauptaktion.fn">
        <span class="haupt-text">{{ hauptaktion.text }}</span>
        <span class="haupt-unter">{{ hauptaktion.unter }}</span>
      </button>

      <div class="neben">
        <button v-if="istOffen" class="klein warn" @click="stoerung">{{ t('v3.epp.stoerung') }}</button>
        <button v-if="laeuft || zustand === 'malfunction'" class="klein" @click="zuruecksetzen">{{ t('v3.allgemein.abbrechen') }}</button>
      </div>

      <!-- Stationswahl: im Wettkampf selten, im Training ständig -->
      <nav class="stationen" v-if="!laeuft">
        <button
          v-for="(p, i) in phases" :key="p.id"
          class="station-knopf"
          :class="{ aktiv: i === s?.stationIndex, erledigt: i < (s?.stationIndex ?? 0) }"
          @click="zuStation(i)">
          {{ p.station.replace('Station ', '') }}
        </button>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.schirm {
  --grund: #0b0d10;
  --flaeche: #15191f;
  --rand: #262c35;
  --text: #f2f5f8;
  --gedaempft: #9aa6b4;
  --akzent: #f59e0b;
  --gruen: #16a34a;
  --rot: #dc2626;
  min-height: calc(100dvh - env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom));
  background: var(--grund);
  color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  transition: background 120ms linear;
}
.schirm.signal { background: #3b1d05; }
.schirm.gesperrt { background: #2a0b0b; }

.kopf { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.5rem; }
.kopf-block { background: var(--flaeche); border: 1px solid var(--rand); border-radius: 0.75rem; padding: 0.5rem 0.75rem; }
.kopf-block.mitte { text-align: center; }
.kopf-block.rechts { text-align: right; }
.kopf-marke { display: block; font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gedaempft); }
.kopf-wert { display: block; font-size: 1.6rem; font-variant-numeric: tabular-nums; line-height: 1.2; }
.kopf-wert.knapp { color: var(--akzent); }
.von { font-size: 1rem; color: var(--gedaempft); }
.punkt { display: inline-block; width: 0.85rem; height: 0.85rem; border-radius: 50%; border: 2px solid var(--gedaempft); margin-left: 0.3rem; }
.punkt.an { background: var(--rot); border-color: var(--rot); }

.ansage { background: var(--akzent); color: #1a1205; border-radius: 0.75rem; padding: 0.6rem 0.9rem; }
.ansage-marke { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.8; }
.ansage-wert { font-size: 1.5rem; font-variant-numeric: tabular-nums; }

.mitte-block { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.15rem; }
.station-zeile { font-size: 1.25rem; margin: 0; }
.schuss-zeile { margin: 0; color: var(--gedaempft); font-size: 0.95rem; }
.uhr { font-size: clamp(4.5rem, 26vw, 9rem); font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; margin: 0.4rem 0 0; }
.uhr.gross { font-size: clamp(6rem, 38vw, 13rem); color: var(--akzent); }
.uhr-marke { margin: 0.2rem 0 0; color: var(--gedaempft); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; }
.signal-hinweis { margin: 0.6rem 0 0; max-width: 28rem; color: var(--gedaempft); font-size: 0.8rem; line-height: 1.4; }

.ansage-block {
  background: #1b2029; border: 1px solid var(--rand); border-left: 4px solid #3b82f6;
  border-radius: 0.75rem; padding: 0.85rem 1rem; max-height: 38vh; overflow-y: auto;
}
.ansage-marke2 {
  margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--gedaempft); display: flex; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;
}
.ansage-unter { text-transform: none; letter-spacing: 0; font-style: italic; }
.ansage-kopf { margin: 0 0 0.4rem; font-size: 1rem; color: #93c5fd; font-variant-numeric: tabular-nums; }
.ansage-fuehrung { margin: 0 0 0.35rem; font-size: 1.35rem; font-weight: 700; line-height: 1.35; color: var(--text); }
.ansage-zeile2 { margin: 0.3rem 0; font-size: 1.1rem; line-height: 1.5; color: var(--text); }

.kommandos { background: var(--flaeche); border: 1px solid var(--rand); border-left: 4px solid var(--akzent); border-radius: 0.75rem; padding: 0.75rem 1rem; }
.kommando { margin: 0.15rem 0; font-size: 1.15rem; font-weight: 600; }

.hinweise { }
.regel { font-size: 0.7rem; padding: 0.1rem 0.4rem; border: 1px solid var(--rand); border-radius: 0.4rem; }
.hinweis-liste { margin-top: 0.5rem; background: var(--flaeche); border: 1px solid var(--rand); border-radius: 0.75rem; padding: 0.75rem 1rem; max-height: 40vh; overflow-y: auto; }
.hinweis-liste ul { margin: 0.25rem 0 0.5rem; padding-left: 1.1rem; }
.hinweis-liste li { margin: 0.3rem 0; font-size: 0.9rem; line-height: 1.45; color: #d7dee6; }
.variante { margin: 0.4rem 0 0.7rem; }
.variante strong { display: block; font-size: 0.95rem; margin-bottom: 0.2rem; }
.variante-zeile { margin: 0 0 0.4rem; font-size: 0.82rem; color: var(--gedaempft); line-height: 1.5; }
.regel { font-size: 0.7rem; padding: 0.1rem 0.4rem; border: 1px solid var(--rand); border-radius: 0.4rem; color: var(--gedaempft); font-weight: 400; }
.hinweis-titel { margin: 0.6rem 0 0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gedaempft); }

.fuss { display: flex; flex-direction: column; gap: 0.5rem; }
.haupt { width: 100%; min-height: 5.5rem; border: none; border-radius: 1rem; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem; cursor: pointer; }
.haupt-text { font-size: 1.6rem; font-weight: 700; }
.haupt-unter { font-size: 0.8rem; opacity: 0.85; font-weight: 400; }
.haupt.gruen { background: var(--gruen); }
.haupt.gelb  { background: var(--akzent); color: #1a1205; }
.haupt.grau  { background: #374151; }
.haupt:active { filter: brightness(0.9); }

.neben { display: flex; gap: 0.5rem; }
.klein { flex: 1; min-height: 3rem; background: var(--flaeche); color: var(--text); border: 1px solid var(--rand); border-radius: 0.75rem; font-size: 1rem; cursor: pointer; }
.klein.warn { border-color: var(--akzent); color: var(--akzent); }


.stationen { display: flex; gap: 0.3rem; }
.station-knopf { flex: 1; min-height: 2.75rem; background: var(--flaeche); color: var(--gedaempft); border: 1px solid var(--rand); border-radius: 0.6rem; font-size: 0.85rem; cursor: pointer; }
.station-knopf.aktiv { background: var(--akzent); color: #1a1205; border-color: var(--akzent); font-weight: 700; }
.station-knopf.erledigt { color: var(--gruen); border-color: #1f4030; }

@media (min-width: 40rem) {
  .uhr { font-size: clamp(6rem, 18vw, 11rem); }
  .haupt { min-height: 6.5rem; }
}
</style>
