/**
 * Übersetzt eine angereicherte Disziplin in die gewählte Sprache.
 *
 * Getrennt von enrichDiscipline, weil die Bibliothek sprachneutral bleibt:
 * gespeichert wird immer der deutsche Originaltext, übersetzt wird erst
 * beim Anzeigen. So ändert ein Sprachwechsel nichts an den Daten, und ein
 * Export trägt weiterhin die Fassung, die der Nutzer eingegeben hat.
 *
 * Die Kommandos selbst sind davon ausgenommen: sie führen ihre deutsche und
 * englische Fassung nebeneinander und werden auf dem Stand auch so gezeigt.
 * Übersetzt wird hier nur der erklärende Hinweis dazu.
 */

import { uebersetze, uebersetzeListe } from './textEn.js'

const t  = (x, l) => uebersetze(x, l)
const tl = (x, l) => uebersetzeListe(x, l)

function lokalisierePhase(p, locale) {
  if (!p) return p
  return {
    ...p,
    name:        t(p.name, locale),
    description: t(p.description, locale),
    roCommands:  tl(p.roCommands, locale),
    // Felder der EPP-Stationen.
    station:     t(p.station, locale),
    position:    t(p.position, locale),
    shotsNote:   t(p.shotsNote, locale),
    notes:        tl(p.notes, locale),
    afterStation: tl(p.afterStation, locale),
    positions: (p.positions ?? []).map(s => ({
      ...s, name: t(s.name, locale), text: t(s.text, locale),
    })),
    positionChangeNotes: tl(p.positionChangeNotes, locale),
  }
}

function lokalisiereKommandos(satz, locale) {
  if (!satz) return satz
  const zeile = (k) => ({ ...k, hinweis: t(k.hinweis, locale) })
  return {
    ...satz,
    label:    t(satz.label, locale),
    hinweise: tl(satz.hinweise, locale),
    vorher:  (satz.vorher  ?? []).map(zeile),
    start:   (satz.start   ?? []).map(zeile),
    nachher: (satz.nachher ?? []).map(zeile),
    abbruch: (satz.abbruch ?? []).map(zeile),
  }
}

/**
 * @param {object} disziplin angereicherte Disziplin aus enrichDiscipline
 * @param {string} locale    'de' lässt alles unverändert
 */
export function lokalisiereDisziplin(disziplin, locale = 'de') {
  if (!disziplin || locale === 'de') return disziplin
  return {
    ...disziplin,
    name:       t(disziplin.name, locale),
    ammo:       t(disziplin.ammo, locale),
    target:     t(disziplin.target, locale),
    ablauf:     tl(disziplin.ablauf, locale),
    hinweise:   tl(disziplin.hinweise, locale),
    abweichung: t(disziplin.abweichung, locale),
    varianten: (disziplin.varianten ?? []).map(v => ({
      ...v, label: t(v.label, locale), hinweise: tl(v.hinweise, locale),
    })),
    readiness: disziplin.readiness
      ? { ...disziplin.readiness, text: t(disziplin.readiness.text, locale) }
      : disziplin.readiness,
    commandSet: lokalisiereKommandos(disziplin.commandSet, locale),
    phases: (disziplin.phases ?? []).map(p => lokalisierePhase(p, locale)),
  }
}

/** Kurzform für Listen, in denen nur der Name erscheint. */
export function lokalisiereNamen(disziplinen, locale = 'de') {
  if (locale === 'de') return disziplinen
  return (disziplinen ?? []).map(d => ({ ...d, name: t(d.name, locale) }))
}
