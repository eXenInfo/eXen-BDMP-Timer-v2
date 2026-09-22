<script setup>
/**
 * Wettkampfmodus für die Standard-Disziplinen (PP1–PP4, NPA, BDMP 1020/1500 …).
 *
 * Gleiche Gestaltungsregel wie beim EPP: pro Zustand genau eine große Aktion.
 * Der Unterschied liegt im Ablauf — hier gibt es Vorläufe, Wiederholungen mit
 * Pausen dazwischen und Haltepunkte, an denen der RO weitergibt.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { createSequenceEngine, SeqState, SeqEvent } from '../core/sequenceEngine.js'
import { useEngineClock, now } from '../composables/useEngineClock.js'
import * as audio from '../core/audio.js'

const props = defineProps({
  name:   { type: String, default: 'Disziplin' },
  phases: { type: Array, required: true },
})

const hinweiseOffen = ref(false)

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
  clock.setEngine(createSequenceEngine({ phases: props.phases }))
}
onMounted(() => { neuAufsetzen(); clock.start() })
watch(() => props.phases, neuAufsetzen)

const s = clock.snapshot
const zustand = computed(() => s.value?.state ?? SeqState.IDLE)
const phase   = computed(() => s.value?.phase ?? null)

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
  [SeqState.IDLE]:         'Bereit',
  [SeqState.PREP]:         'Achtung — Startsignal folgt',
  [SeqState.RUNNING]:      'Schießzeit läuft',
  [SeqState.REP_PAUSE]:    'Pause zwischen den Durchgängen',
  [SeqState.WAITING_NEXT]: 'Wartet auf die Aufsicht',
  [SeqState.PAUSED]:       'Angehalten',
  [SeqState.FINISHED]:     'Ablauf beendet',
}[zustand.value] ?? ''))

const laeuft = computed(() =>
  [SeqState.PREP, SeqState.RUNNING, SeqState.REP_PAUSE].includes(zustand.value))

const hauptaktion = computed(() => {
  switch (zustand.value) {
    case SeqState.IDLE:
      return { text: 'Starten', unter: phase.value?.name ?? '', fn: starten, klasse: 'gruen' }
    case SeqState.WAITING_NEXT:
      return { text: 'Weiter', unter: phase.value?.name ?? '', fn: weiter, klasse: 'gruen' }
    case SeqState.PAUSED:
      return { text: 'Fortsetzen', unter: `noch ${sek(s.value?.remainingMs)} s`, fn: fortsetzen, klasse: 'gruen' }
    case SeqState.RUNNING:
    case SeqState.PREP:
    case SeqState.REP_PAUSE:
      return { text: 'Anhalten', unter: 'Zeit stoppt sofort', fn: anhalten, klasse: 'gelb' }
    case SeqState.FINISHED:
      return { text: 'Neuer Durchgang', unter: props.name, fn: zuruecksetzen, klasse: 'grau' }
    default: return null
  }
})

async function starten()     { await audio.arm(); clock.call('start', now()) }
function weiter()            { clock.call('continueNext', now()) }
function anhalten()          { clock.call('pause', now()) }
function fortsetzen()        { clock.call('resume', now()) }
function zuruecksetzen()     { clock.call('reset', now()) }
async function zuPhase(i)    { await audio.arm(); clock.call('goToPhase', i, now()) }

const wiederholungen = computed(() => {
  const p = phase.value
  if (!p || p.repetitions <= 1) return null
  return `${s.value?.repetition ?? 1} / ${p.repetitions}`
})
</script>

<template>
  <div class="schirm">
    <header class="kopf">
      <div class="kopf-block">
        <span class="kopf-marke">Disziplin</span>
        <strong class="kopf-wert klein">{{ name }}</strong>
      </div>
      <div class="kopf-block rechts">
        <span class="kopf-marke">Phase</span>
        <strong class="kopf-wert">{{ (s?.index ?? 0) + 1 }}<span class="von">/{{ phases.length }}</span></strong>
      </div>
    </header>

    <main class="mitte-block">
      <p class="phase-zeile">
        <strong>{{ phase?.name }}</strong>
        <span v-if="phase?.distance" class="distanz">{{ phase.distance }}</span>
      </p>
      <p v-if="phase?.description" class="beschreibung">{{ phase.description }}</p>

      <div class="uhr" :class="{ gross: zustand === 'prep' || (s?.remainingMs ?? 0) < 60000 }">{{ anzeige }}</div>
      <p class="uhr-marke">{{ beschriftung }}</p>

      <p v-if="wiederholungen" class="wdh">Durchgang {{ wiederholungen }}</p>
      <p v-if="phase?.repetitions > 1 && zustand === 'idle'" class="wdh-plan">
        {{ phase.repetitions }} × {{ Math.round(phase.durationMs / 1000) }} s<span
          v-if="phase.repPauseMs"> mit {{ Math.round(phase.repPauseMs / 1000) }} s Pause</span>
      </p>
    </main>

    <section v-if="phase?.roCommands?.length && (zustand === 'idle' || zustand === 'waitingNext')" class="kommandos">
      <p v-for="(k, i) in phase.roCommands" :key="i" class="kommando">„{{ k }}“</p>
    </section>

    <footer class="fuss">
      <button v-if="hauptaktion" class="haupt" :class="hauptaktion.klasse" @click="hauptaktion.fn">
        <span class="haupt-text">{{ hauptaktion.text }}</span>
        <span class="haupt-unter">{{ hauptaktion.unter }}</span>
      </button>

      <div class="neben" v-if="laeuft || zustand === 'paused'">
        <button class="klein" @click="zuruecksetzen">Abbrechen</button>
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
  min-height: 100dvh; display: flex; flex-direction: column; gap: 0.75rem;
  padding: 0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom));
  background: var(--grund); color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}
.kopf { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
.kopf-block { background: var(--flaeche); border: 1px solid var(--rand); border-radius: 0.75rem; padding: 0.5rem 0.75rem; min-width: 0; }
.kopf-block.rechts { text-align: right; }
.kopf-marke { display: block; font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gedaempft); }
.kopf-wert { display: block; font-size: 1.6rem; font-variant-numeric: tabular-nums; line-height: 1.2; }
.kopf-wert.klein { font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.von { font-size: 1rem; color: var(--gedaempft); }

.mitte-block { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.15rem; }
.phase-zeile { font-size: 1.2rem; margin: 0; display: flex; flex-direction: column; gap: 0.15rem; }
.distanz { color: var(--akzent); font-size: 0.95rem; }
.beschreibung { margin: 0.35rem 0 0; color: var(--gedaempft); font-size: 0.9rem; line-height: 1.45; white-space: pre-line; max-width: 34rem; }
.uhr { font-size: clamp(4rem, 22vw, 8rem); font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; margin: 0.5rem 0 0; }
.uhr.gross { font-size: clamp(5.5rem, 34vw, 12rem); color: var(--akzent); }
.uhr-marke { margin: 0.2rem 0 0; color: var(--gedaempft); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; }
.wdh { margin: 0.4rem 0 0; font-size: 1.1rem; color: var(--akzent); font-variant-numeric: tabular-nums; }
.wdh-plan { margin: 0.3rem 0 0; color: var(--gedaempft); font-size: 0.85rem; }

.kommandos { background: var(--flaeche); border: 1px solid var(--rand); border-left: 4px solid var(--akzent); border-radius: 0.75rem; padding: 0.7rem 1rem; }
.kommando { margin: 0.15rem 0; font-size: 1.1rem; font-weight: 600; }

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
</style>
