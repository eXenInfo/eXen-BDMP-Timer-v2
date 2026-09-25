/**
 * Korrekturen des mitgelieferten Satzes auch in eigenen Kopien.
 *
 * Eine Kopie („Eigene Disziplinen“ oder ein eingelesener Satz) friert die
 * Zeiten vom Tag der Kopie ein. Wird der mitgelieferte Satz später
 * korrigiert, kämen die Korrekturen dort nie an.
 *
 * Deshalb beim Laden: Stimmen die Zeiten einer kopierten Disziplin genau mit
 * einem früheren Auslieferungsstand derselben Disziplin überein, hat
 * niemand sie verändert. Dann übernimmt sie die Zeiten des aktuellen Stands.
 * Hat jemand auch nur einen Wert selbst geändert, bleibt alles, wie es ist.
 * Eigene RO-Texte und Ansagen werden je Schritt mitgenommen, soweit der
 * Schritt im neuen Stand unter gleichem Namen weiter besteht.
 *
 * FRUEHERE_STAENDE enthält je Disziplin alle ausgelieferten Zeitabdrücke.
 * Ändern sich die Daten, schlägt test/kopienAbgleich.test.js fehl, bis der
 * neue Abdruck ergänzt ist. Alte Abdrücke nie entfernen.
 */

/** Zeitrelevante Felder eines Schritts, in fester Reihenfolge. */
function schrittAbdruck(p) {
  const prep = p.prepMs ?? (p.prepTime ?? 0) * 1000
  const dauer = p.durationMs ?? (p.duration ?? 0) * 1000
  const wdh = Math.max(1, p.repetitions ?? 1)
  const pause = p.repPauseMs ?? (p.pauseDuration ?? 0) * 1000
  const halt = p.waitAfter ?? p.pauseAfter ?? false
  return [prep / 1000, dauer / 1000, wdh, pause / 1000, p.soundAtStart ? 1 : 0, p.soundAtEnd ? 1 : 0, halt ? 1 : 0].join('/')
}

/** Kurzform aller Zeiten einer Disziplin, z. B. „5/100/1/0/1/1/1|5/2/5/5/1/1/1“. */
export function zeitAbdruck(phasen) {
  return (phasen ?? []).map(schrittAbdruck).join('|')
}

/** Texte, die ein Nutzer je Schritt selbst gepflegt haben kann. */
const EIGENE_TEXTE = ['ansage', 'roCommands', 'roCommandsEigen']

function mitEigenenTexten(neu, alt) {
  return neu.map(np => {
    const ap = alt.find(p => p.name === np.name)
    if (!ap || !(ap.roCommandsEigen || ap.ansage)) return np
    const kopie = { ...np }
    for (const f of EIGENE_TEXTE) if (f in ap) kopie[f] = structuredClone(ap[f])
    return kopie
  })
}

/**
 * Gleicht alle eigenen Sätze mit dem mitgelieferten ab.
 * @returns {{ sets: object[], geaendert: Array<{ satz: string, disziplin: string }> }}
 */
export function kopienAbgleichen(sets, builtin, frueher = FRUEHERE_STAENDE) {
  const geaendert = []
  const neu = (sets ?? []).map(satz => {
    if (satz.readonly) return satz
    let anders = false
    const disciplines = (satz.disciplines ?? []).map(d => {
      if (d.kind === 'epp') return d
      const vorlage = builtin.disciplines.find(v => v.id === d.id && v.kind !== 'epp')
      if (!vorlage) return d
      const jetzt = zeitAbdruck(d.phases)
      if (jetzt === zeitAbdruck(vorlage.phases)) return d
      if (!(frueher[d.id] ?? []).includes(jetzt)) return d      // selbst geändert: nicht anfassen
      anders = true
      geaendert.push({ satz: satz.name, disziplin: d.name })
      return { ...d, phases: mitEigenenTexten(structuredClone(vorlage.phases), d.phases) }
    })
    return anders ? { ...satz, disciplines } : satz
  })
  return { sets: neu, geaendert }
}

export const FRUEHERE_STAENDE = {
  'bdmp-1020': [
    '3/20/1/0/1/1/1|3/20/1/0/1/1/1|3/90/1/0/1/1/1|3/35/1/0/1/1/1|3/35/1/0/1/1/1|3/165/1/0/1/1/1|3/12/1/0/1/1/1|3/12/1/0/1/1/0',
  ],
  'bdmp-1500-matches-1-5-c-8-2': [
    '3/20/1/0/1/1/1|3/20/1/0/1/1/1|3/90/1/0/1/1/1|3/165/1/0/1/1/1|3/35/1/0/1/1/1|3/35/1/0/1/1/1|3/20/1/0/1/1/1|3/90/1/0/1/1/1|3/165/1/0/1/1/1',
    '3/20/1/0/1/1/1|3/20/1/0/1/1/1|3/90/1/0/1/1/1|3/165/1/0/1/1/1|3/35/1/0/1/1/1|3/35/1/0/1/1/1|3/20/1/0/1/1/1|3/90/1/0/1/1/1|3/165/1/0/1/1/1|3/12/1/0/1/1/0',
  ],
  'dks-1-1020': [
    '3/20/1/0/1/1/1|3/20/1/0/1/1/1|3/90/1/0/1/1/1|3/35/1/0/1/1/1|3/35/1/0/1/1/1|3/165/1/0/1/1/1|3/12/1/0/1/1/1|3/12/1/0/1/1/0',
  ],
  'npa-service-pistol-30m1': [
    '3/15/1/0/1/1/1|3/10/1/0/1/1/1|3/3/3/5/1/1/1|3/6/1/0/1/1/0',
  ],
  'npa-service-pistol-lar': [
    '3/15/1/0/1/1/1|3/10/1/0/1/1/1|3/3/3/5/1/1/1|3/8/1/0/1/1/0',
  ],
  'npa-service-pistol-spcb': [
    '3/15/1/0/1/1/1|3/10/1/0/1/1/1|3/3/3/5/1/1/1|3/8/1/0/1/1/0',
  ],
  'npa-service-pistole-a-b-os': [
    '3/15/1/0/1/1/1|3/10/1/0/1/1/1|3/3/3/7/1/1/1|3/6/1/0/1/1/0',
  ],
  'police-pistol-1-30m1-spcb': [
    '5/120/1/0/1/1/1|5/3/6/5/1/1/1|5/3/6/5/1/1/1|5/3/3/5/1/1/0',
  ],
  'police-pistol-1-a-b-os': [
    '5/120/1/0/1/1/1|5/2/6/5/1/1/0|5/2/6/5/1/1/1|5/2/3/5/1/1/0',
    '5/120/1/0/1/1/1|5/2/6/5/1/1/1|5/2/6/5/1/1/1|5/2/3/5/1/1/0',
  ],
  'police-pistol-1-lar': [
    '5/120/1/0/1/1/1|5/2/6/5/1/1/1|5/2/6/5/1/1/1|5/3/3/5/1/1/0',
  ],
  'police-pistol-1-sm': [
    '5/120/2/10/1/1/1|5/3/10/5/1/1/1|5/2/10/5/1/1/0',
    '5/120/1/0/1/1/1|5/3/5/5/1/1/1|5/3/5/5/1/1/1|5/2/5/5/1/1/1|5/2/5/5/1/1/0',
  ],
  'police-pistol-2-pp2': [
    '5/5/2/10/1/1/1|5/180/1/0/1/1/1|5/120/1/0/1/1/0',
    '5/5/1/0/1/1/1|5/5/1/0/1/1/1|5/180/1/0/1/1/1|5/120/1/0/1/1/0',
  ],
  'police-pistol-3-carry-gun': [
    '5/100/2/10/1/1/1|5/2/10/5/1/1/1|5/2/6/5/1/1/0',
    '5/100/1/0/1/1/1|5/2/5/5/1/1/1|5/2/5/5/1/1/1|5/2/3/5/1/1/1|5/2/3/5/1/1/0',
  ],
  'police-pistol-4-pocket-gun': [
    '5/100/2/10/1/1/1|5/2/10/5/1/1/1|5/2/6/5/1/1/0',
    '5/100/1/0/1/1/1|5/2/5/5/1/1/1|5/2/5/5/1/1/1|5/2/3/5/1/1/1|5/2/3/5/1/1/0',
  ],
  'sports-carbine-pp2': [
    '5/7/1/0/1/1/1|5/7/1/0/1/1/1|5/140/1/0/1/1/1|5/90/1/0/1/1/0',
  ],
  'zeitkontrolle-schuetze': [
    '0/90/1/0/0/0/0|0/165/1/0/0/0/0',
    '0/90/1/0/0/0/1|0/165/1/0/0/0/0',
  ],
}
