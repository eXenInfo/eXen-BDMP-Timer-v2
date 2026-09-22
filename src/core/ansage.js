/**
 * Die Ansage, die der RO den Schützen vorliest.
 *
 * Zwei Zeilen, weil der RO zwei verschiedene Dinge sagt:
 *
 *   Wir gehen auf 7 Meter
 *   Match 1 Stage 1: 7 m — 20 Sekunden — nur double action — 2 × 6 Schüsse stehend frei
 *
 * Die erste ist die Führungsansage — wohin die Schützen gehen. Sie ergibt
 * sich aus der Entfernung der Phase im Vergleich zur vorigen, nicht aus dem
 * Wortlaut des Namens: so heißt es überall gleich, auch dort, wo die
 * Sammlung den Satz gar nicht mitbringt.
 *
 * Die zweite nennt den Ablauf vollständig und in fester Reihenfolge:
 * Bezeichnung, Distanz, Zeit, Modus, Schusszahl mit Anschlag. Jeder dieser
 * Teile wird genau einmal gesagt — Distanz, Zeit und Modus werden deshalb
 * aus der Beschreibung entfernt, bevor sie angehängt wird.
 *
 * Die Sprache steckt vollständig in den Wortpaketen unten. Der Aufbau der
 * Zeile ist in allen Sprachen derselbe; eine weitere Sprache braucht nur
 * ein weiteres Paket.
 *
 * Wo die Ableitung nicht trifft, überschreibt das Feld `ansage` der Phase
 * sie vollständig — der Editor bietet es an, damit niemand auf die
 * Heuristik angewiesen ist.
 */

/* ── Wortpakete ──────────────────────────────────────────────────────────── */

const DE = {
  gehenAuf:    (m) => `Wir gehen auf ${m} Meter`,
  bleibenAuf:  (m) => `Wir bleiben auf ${m} Meter`,
  sekunden:    (n) => `${n} Sekunden`,
  minuten:     (n) => `${n} Minuten`,
  durchgang:   (n) => `${n}. Durchgang`,
  stage:       (g, n) => `${g} Stage ${n}`,
  durchgaenge: (n) => `${n} Durchgänge`,
  ausGesamtzeit: 'aus der Gesamtzeit',
  schuss:      (n) => `${n} Schuss`,
  wiederholung: /wiederholung/i,
  // Erkennung der Bausteine, die genau einmal gesagt werden.
  distanz: /(\d+)\s*(?:m\b|meter(?:\/yards)?\b|yards\b)/i,
  zeit:    /\b(?:in\s+)?(?<![x×]\s?\d{0,3}\s?)\d+(?:[.,]\d+)?\s*(?:s\b|sek\.?|sekunden|min\.?|minuten)\b\.?/gi,
  intervall: /(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(s\b|sek\.?|sekunden)/gi,
  modi: [
    { muster: /nur\s+double\s+action/i,                  text: 'nur double action' },
    { muster: /auch\s+single\s+action(?:\s+erlaubt)?/i,  text: 'auch single action' },
  ],
  durchgangZiffer: /(\d+)\.\s*Durchgang/i,
  stationImRest:   /^(Station\s+\S+?)[:.]?\s*$/i,
  mehrzahl: (text) => text.replace(/(?<![\d-])(\d+)(\s*)Schuss\b/g,
    (_, n, sp) => `${n}${sp}${Number(n) === 1 ? 'Schuss' : 'Schüsse'}`),
}

const EN = {
  gehenAuf:    (m) => `We move to ${m} metres`,
  bleibenAuf:  (m) => `We stay at ${m} metres`,
  sekunden:    (n) => `${n} seconds`,
  minuten:     (n) => `${n} minutes`,
  durchgang:   (n) => `run ${n}`,
  stage:       (g, n) => `${g} Stage ${n}`,
  durchgaenge: (n) => `${n} runs`,
  ausGesamtzeit: 'from the total time',
  schuss:      (n) => `${n} round${Number(n) === 1 ? '' : 's'}`,
  wiederholung: /repeat/i,
  distanz: /(\d+)\s*(?:m\b|met(?:re|er)s?(?:\/yards)?\b|yards\b)/i,
  zeit:    /\b(?:in\s+)?(?<![x×]\s?\d{0,3}\s?)\d+(?:[.,]\d+)?\s*(?:s\b|sec\.?|seconds?|min\.?|minutes?)\b\.?/gi,
  intervall: /(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(s\b|sec\.?|seconds?)/gi,
  modi: [
    { muster: /double\s+action\s+only/i,                       text: 'double action only' },
    { muster: /single\s+action\s+(?:also\s+)?permitted/i,      text: 'single action also permitted' },
  ],
  durchgangZiffer: /run\s+(\d+)|(\d+)(?:st|nd|rd|th)\s+run/i,
  stationImRest:   /^(Station\s+\S+?)[:.]?\s*$/i,
  mehrzahl: (text) => text.replace(/(?<![\d-])(\d+)(\s*)rounds?\b/g,
    (_, n, sp) => `${n}${sp}${Number(n) === 1 ? 'round' : 'rounds'}`),
}

export const WORTPAKETE = { de: DE, en: EN }

/** Wortpaket zur Sprache; unbekannte Sprachen fallen auf Deutsch zurück. */
export function wortpaket(locale) {
  return WORTPAKETE[String(locale ?? 'de').slice(0, 2)] ?? DE
}

/* ── Zerlegung der Phasennamen ───────────────────────────────────────────── */

/** "Match 1: Wir gehen auf 7 Meter" → { gruppe: 'Match 1', rest: 'Wir gehen…' } */
export function trennePhasenname(name) {
  const m = String(name ?? '').match(/^\s*(Match\s*\d+|Stage\s*\d+|Station\s*\S+?)\s*[:–—-]\s*(.*)$/i)
  if (!m) return { gruppe: null, rest: String(name ?? '').trim() }
  return { gruppe: m[1].replace(/\s+/g, ' ').trim(), rest: m[2].trim() }
}

/**
 * Gruppe der Phase — steht sie nicht im Namen, wird die erste
 * Beschreibungszeile gelesen. Der Datensatz führt die Wiederholung des
 * BDMP 1500 als eigene Phase mit dem Namen „Wiederholung“ und dem
 * Match-Kopf erst in der zweiten Zeile.
 */
function gruppeDerPhase(p) {
  const ausName = trennePhasenname(p?.name)
  if (ausName.gruppe) return ausName
  const ersteZeile = String(p?.description ?? '').split('\n')[0] ?? ''
  const ausText = trennePhasenname(ersteZeile)
  return ausText.gruppe ? { gruppe: ausText.gruppe, rest: '' } : ausName
}

/** Wievielte Stage innerhalb derselben Match-Gruppe ist diese Phase? */
export function stageNummer(phasen, index) {
  const { gruppe } = gruppeDerPhase(phasen[index])
  if (!gruppe) return null
  let n = 0
  for (let i = 0; i <= index; i++) {
    if (gruppeDerPhase(phasen[i]).gruppe === gruppe) n++
  }
  const gesamt = phasen.filter(p => gruppeDerPhase(p).gruppe === gruppe).length
  return gesamt > 1 ? n : null
}

/** „1. Durchgang“ / „2. Durchgang“ — steht mal im Namen, mal in der Beschreibung. */
export function durchgangNummer(phase, locale = 'de') {
  const w = wortpaket(locale)
  const quelle = [phase?.name, phase?.description, ...(phase?.roCommands ?? [])].join('\n')
  const m = quelle.match(w.durchgangZiffer)
  if (m) return Number(m[1] ?? m[2])
  // „Wiederholung“ ohne Ziffer ist der zweite Durchgang.
  return w.wiederholung.test(String(phase?.name ?? '')) ? 2 : null
}

/**
 * Durchgang der Phase innerhalb ihrer Gruppe.
 *
 * Der Datensatz markiert mal beide Durchgänge („1. Durchgang“, „2. Durchgang“),
 * mal nur den zweiten („Wiederholung“). Trägt irgendeine Phase der Gruppe
 * einen Vermerk, wird die ganze Gruppe durchgezählt — sonst hieße dieselbe
 * Serie einmal „Stage 1“ und einmal „2. Durchgang“.
 */
export function durchgangInGruppe(phasen, index, locale = 'de') {
  const gruppe = gruppeDerPhase(phasen[index]).gruppe
  if (!gruppe) return durchgangNummer(phasen[index], locale)

  const inGruppe = []
  for (let i = 0; i < phasen.length; i++) {
    if (gruppeDerPhase(phasen[i]).gruppe === gruppe) inGruppe.push(i)
  }
  if (!inGruppe.some(i => durchgangNummer(phasen[i], locale) !== null)) return null
  return inGruppe.indexOf(index) + 1
}

/* ── Bausteine der Detailzeile ───────────────────────────────────────────── */

/** Distanz der Phase — fehlt sie, gilt die der vorigen Phase. */
function distanz(phasen, index, w) {
  for (let i = index; i >= 0; i--) {
    const p = phasen[i]
    const treffer = p?.distance ?? [p?.name, p?.description].join(' ')
    const m = String(treffer).match(w.distanz)
    if (m) return { text: `${m[1]} m`, meter: m[1] }
  }
  return null
}

/** Unter zwei Minuten Sekunden, darüber nur bei vollen Minuten Minuten. */
export function zeitText(ms, locale = 'de') {
  const w = wortpaket(locale)
  if (!ms) return null
  const s = Math.round(ms / 1000)
  // „165 Sekunden“ sagt der RO auf dem Stand, nicht „2:45 Minuten“.
  if (s >= 120 && s % 60 === 0) return w.minuten(s / 60)
  return w.sekunden(s)
}

/** Schießmodus aus Phasentext oder Regelablauf — wird genau einmal gesagt. */
export function modus(phase, gruppe, ablauf, w) {
  const ausPhase = [phase?.name, phase?.description].join(' ')
  for (const m of w.modi) if (m.muster.test(ausPhase)) return m.text

  if (!gruppe || !Array.isArray(ablauf)) return null
  const nr = (gruppe.match(/\d+/) ?? [])[0]
  if (!nr) return null
  const zeile = ablauf.find(a => new RegExp(`^\\s*(?:Match|Stage|Station)\\s*${nr}\\b`, 'i').test(a))
  if (!zeile) return null
  for (const m of w.modi) if (m.muster.test(zeile)) return m.text
  return null
}

/**
 * Die Beschreibung, bereinigt um alles, was in der Zeile schon steht.
 *
 * Zeilen, die nur Distanz, Zeit und Modus wiederholen, fallen ganz weg —
 * der Datensatz des BDMP 1500 führt genau solche Kopfzeilen mit.
 */
export function beschreibungBereinigt(text, w = DE) {
  const zeilen = String(text ?? '').split('\n').map(z => z.trim()).filter(Boolean)

  const entkernt = (z) => {
    let r = z
    for (const m of w.modi) r = r.replace(new RegExp(m.muster.source, 'gi'), '')
    r = r.replace(new RegExp(w.distanz.source, 'gi'), '')
    r = r.replace(new RegExp(w.zeit.source, w.zeit.flags), '')
    return r.replace(/[-–—:,.\s]/g, '')
  }

  const inhalt = zeilen
    // Der führende Match-, Stage- oder Stationskopf derselben Phase.
    .map(z => z.replace(/^\s*(?:Match|Stage|Station)\s*\S+\s*[:–—-]\s*/i, ''))
    // Reine Kopfzeilen wie „7 Meter/Yards - 20 Sekunden - nur double action“.
    .filter(z => entkernt(z).length > 0)
    // Ein alleinstehender Durchgangsvermerk steht schon in der Bezeichnung.
    .filter(z => !/^\s*(\d+\.\s*)?(Durchgang|run \d+|repeat)\s*[:.]?\s*$/i.test(z))
    .map(z => {
      let r = z
      for (const m of w.modi) r = r.replace(new RegExp(m.muster.source, 'gi'), '')
      // Intervalle wie „in 3x 2s“ bleiben, sie beschreiben den Serienablauf.
      r = r.replace(new RegExp(w.zeit.source, w.zeit.flags), '')
      r = r.replace(new RegExp(w.intervall.source, w.intervall.flags), '$1 × $2 $3')
      return r
    })
    .join(', ')

  const roh = inhalt
    // Aufzählungsstriche und Gedankenstriche zu Kommas — Ziffernfolgen wie
    // „2-2-1“ bleiben dabei unangetastet, sie sind die Schussfolge.
    .replace(/^\s*[-–—]\s+/gm, '')
    .replace(/\s+[-–—]\s+|\s+[-–—](?!\d)|(?<!\d)[-–—]\s+/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/,(?:\s*,)+/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/\(\s*,?\s*/g, '(')
    .replace(/\s*,?\s*\)/g, ')')
    .replace(/\(\s*\)/g, '')
    .replace(/^[,\s.]+|[,\s.]+$/g, '')
    .replace(/(\d)\s*[x×]\s*(?=[\d(])/gi, '$1 × ')

  // Mehrzahl erst zum Schluss: „6 × 1 Schuss“ bleibt Einzahl.
  return w.mehrzahl(roh).replace(/\s{2,}/g, ' ').trim()
}

/** Wiederholungen nur dort, wo sie nicht schon im Text stehen. */
function wiederholungsText(p, beschreibung, w) {
  const n = p?.repetitions ?? 1
  if (n < 2) return null
  const quelle = `${p.description ?? ''} ${beschreibung}`
  // „2x (5x 1 Schuss)“ oder „mit 3 Wiederholungen“ — dann nicht doppeln.
  if (/\d\s*[x×]/i.test(quelle) || w.wiederholung.test(quelle)) return null
  return w.durchgaenge(n)
}

/* ── Aufbau der Ansage ───────────────────────────────────────────────────── */

function eigeneAnsage(p) {
  if (!p?.ansage || !String(p.ansage).trim()) return null
  const zeilen = String(p.ansage).split('\n').map(z => z.trim()).filter(Boolean)
  return {
    fuehrung: zeilen.length > 1 ? zeilen[0] : null,
    detail:   zeilen.length > 1 ? zeilen.slice(1).join(' ') : zeilen[0],
    eigen:    true,
  }
}

/**
 * Baut die zweizeilige Ansage für eine Phase.
 * @returns {{ fuehrung: string|null, detail: string, eigen: boolean }}
 */
export function buildAnnouncement(phasen, index, disziplin = {}, locale = 'de') {
  const w = wortpaket(locale)
  const p = phasen?.[index]
  if (!p) return { fuehrung: null, detail: '', eigen: false }

  const eigen = eigeneAnsage(p)
  if (eigen) return eigen

  // Eine reine Uhr bekommt keine Ansage.
  if (disziplin.ohneAnsage) return { fuehrung: null, detail: '', eigen: false }

  const { gruppe, rest } = gruppeDerPhase(p)
  const durchgang = durchgangInGruppe(phasen, index, locale)
  const station = rest.match(w.stationImRest)

  let bezeichnung = gruppe ?? p.name
  if (gruppe && station)        bezeichnung = `${gruppe} ${station[1]}`
  else if (gruppe && durchgang) bezeichnung = `${gruppe}, ${w.durchgang(durchgang)}`
  else {
    const stage = stageNummer(phasen, index)
    if (gruppe && stage && /^Match/i.test(gruppe)) bezeichnung = w.stage(gruppe, stage)
  }

  const d = distanz(phasen, index, w)
  const vorher = index > 0 ? distanz(phasen, index - 1, w) : null
  const beschreibung = beschreibungBereinigt(p.description, w)

  const teile = [
    d?.text,
    zeitText(p.durationMs, locale),
    modus(p, gruppe, disziplin.ablauf, w),
    beschreibung,
    wiederholungsText(p, beschreibung, w),
  ].filter(Boolean)

  return {
    fuehrung: d ? (vorher && vorher.meter === d.meter ? w.bleibenAuf(d.meter) : w.gehenAuf(d.meter)) : null,
    detail:   `${bezeichnung}: ${teile.join(' — ')}`,
    eigen:    false,
  }
}

/**
 * Dieselbe Ansage für die EPP-Stationen.
 *
 * Deren Phasen sind schon strukturiert — Distanz, Anschlag, Schusszahl,
 * Zeitlimit stehen in eigenen Feldern. Der Aufbau der Zeile bleibt der
 * gleiche, damit der RO überall dieselbe Reihenfolge hört.
 */
export function buildEppAnnouncement(phasen, index, locale = 'de') {
  const w = wortpaket(locale)
  const p = phasen?.[index]
  if (!p) return { fuehrung: null, detail: '', eigen: false }

  const eigen = eigeneAnsage(p)
  if (eigen) return eigen

  const vorher = index > 0 ? phasen[index - 1]?.distance : null
  const zahl = String(p.distance ?? '').match(/(\d+)/)
  const fuehrung = p.distance && zahl
    ? (p.distance === vorher ? w.bleibenAuf(zahl[1]) : w.gehenAuf(zahl[1]))
    : null

  const schuss = p.shots
    ? `${w.schuss(p.shots)}${p.shotsNote ? `, ${p.shotsNote}` : ''}`
    : null

  const teile = [
    p.distance,
    // Stationen ohne eigenes Limit laufen aus dem Gesamtzeitkonto — das
    // muss der RO ansagen, sonst warten die Schützen auf ein Zeitsignal.
    p.timeLimitMs > 0 ? w.sekunden(Math.round(p.timeLimitMs / 1000)) : w.ausGesamtzeit,
    schuss,
    p.position,
  ].filter(Boolean)

  return { fuehrung, detail: `${p.station ?? p.name ?? ''}: ${teile.join(' — ')}`, eigen: false }
}
