/**
 * Die Ansage, die der RO den Schützen vorliest.
 *
 * Zwei Zeilen, weil der RO zwei verschiedene Dinge sagt:
 *
 *   Wir gehen auf 10 Meter
 *   Match 1 Stage 1: 10 m — 20 Sekunden — nur double action — 2 × 6 Schüsse stehend frei
 *
 * Die erste ist die Führungsansage — wohin die Schützen gehen. Die zweite
 * nennt den Ablauf vollständig und in einer festen Reihenfolge: Bezeichnung,
 * Distanz, Zeit, Modus, Schusszahl mit Anschlag.
 *
 * Abgeleitet wird aus den Feldern der Phase. Wo die Ableitung nicht trifft,
 * überschreibt das Feld `ansage` der Phase sie vollständig — der Editor
 * bietet es an, damit niemand auf die Heuristik angewiesen ist.
 */

/** "Match 1: Wir gehen auf 10 Meter" → { gruppe: 'Match 1', rest: 'Wir gehen…' } */
export function trennePhasenname(name) {
  const m = String(name ?? '').match(/^\s*(Match\s*\d+|Stage\s*\d+|Station\s*\S+)\s*[:–—-]\s*(.*)$/i)
  if (!m) return { gruppe: null, rest: String(name ?? '').trim() }
  return { gruppe: m[1].replace(/\s+/g, ' ').trim(), rest: m[2].trim() }
}

/** Wievielte Stage innerhalb derselben Match-Gruppe ist diese Phase? */
export function stageNummer(phasen, index) {
  const { gruppe } = trennePhasenname(phasen[index]?.name)
  if (!gruppe) return null
  let n = 0
  for (let i = 0; i <= index; i++) {
    if (trennePhasenname(phasen[i]?.name).gruppe === gruppe) n++
  }
  const gesamt = phasen.filter(p => trennePhasenname(p.name).gruppe === gruppe).length
  return gesamt > 1 ? n : null
}

/** Entfernt die Zeitangabe aus der Beschreibung — sie steht schon in der Zeile. */
export function beschreibungOhneZeit(text) {
  return String(text ?? '')
    // Der Durchgang steht schon in der Bezeichnung.
    .replace(/^\s*\d+\.\s*Durchgang\s*$/gim, '')
    .replace(/\n+/g, ', ')
    // Die Zeit steht schon in der Zeile. Der Trenner bleibt stehen, damit die
    // Aufzählung nicht zusammenwächst: „stehend frei - in 20 Sek. inkl. Nachladen“
    // soll „stehend frei, inkl. Nachladen“ werden, nicht „stehend frei inkl. Nachladen“.
    .replace(/\bin\s+\d+(?:[.,]\d+)?\s*(Sek\.?|Sekunden|Min\.?|Minuten)\b\.?/gi, '')
    .replace(/\s*[-–—]\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/,(?:\s*,)+/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .replace(/\bx\s*(\d)/gi, '× $1')
    .replace(/(\d)\s*x\s*(\d)/gi, '$1 × $2')
    // Mehrzahl nur, wo wirklich mehrere fallen: „6 × 1 Schuss“ bleibt Einzahl.
    .replace(/(\d+)(\s*)Schuss\b/g, (_, n, sp) => `${n}${sp}${Number(n) === 1 ? 'Schuss' : 'Schüsse'}`)
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Zusatz wie „nur double action“ aus dem Regelablauf derselben Match-Nummer. */
export function modusAusRegeln(gruppe, ablauf) {
  if (!gruppe || !Array.isArray(ablauf)) return null
  const nr = (gruppe.match(/\d+/) ?? [])[0]
  if (!nr) return null
  const zeile = ablauf.find(a => new RegExp(`^\\s*Match\\s*${nr}\\b`, 'i').test(a))
  const m = zeile?.match(/nur double action|auch single action erlaubt/i)
  return m ? m[0].toLowerCase() : null
}

/** „1. Durchgang“ / „2. Durchgang“ — steht mal im Namen, mal in der Beschreibung. */
export function durchgangNummer(phase) {
  const quelle = [phase?.name, phase?.description, ...(phase?.roCommands ?? [])].join('\n')
  const m = quelle.match(/(\d+)\.\s*Durchgang/i)
  return m ? Number(m[1]) : null
}

/**
 * Die Führungsansage — wohin die Schützen gehen.
 * Aus „25m“ wird ein Satz, ein fertiger Satz bleibt stehen.
 */
export function fuehrungsAnsage(rest) {
  const t = String(rest ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (!t) return null
  const nur = t.match(/^(\d+)\s*(m|meter)\.?$/i)
  if (nur) return `Wir gehen auf ${nur[1]} Meter`
  return t
}

function sekundenText(ms) {
  if (!ms) return null
  const s = Math.round(ms / 1000)
  // Bis zwei Minuten sagt der RO die Sekunden — „90 Sekunden“, nicht „1:30 Minuten“.
  if (s < 120) return `${s} Sekunden`
  const min = Math.floor(s / 60), rest = s % 60
  return rest ? `${min}:${String(rest).padStart(2, '0')} Minuten` : `${min} Minuten`
}

/** Distanz der Phase — fehlt sie, gilt die der vorigen Phase derselben Gruppe. */
function distanzMitRuecktrag(phasen, index) {
  const gruppe = trennePhasenname(phasen[index]?.name).gruppe
  for (let i = index; i >= 0; i--) {
    if (phasen[i]?.distance) return phasen[i].distance
    if (i < index && trennePhasenname(phasen[i]?.name).gruppe !== gruppe) break
  }
  return null
}

/** Wiederholungen zeigen, wo sie zur Ansage gehören: „6 × 1 Schuss“. */
function wiederholungsText(p) {
  const n = p?.repetitions ?? 1
  if (n < 2) return null
  // Steht die Zahl schon in der Beschreibung („6 x 1 Schuss“), nicht doppeln.
  if (new RegExp(`\\b${n}\\s*[x×]`, 'i').test(String(p.description ?? ''))) return null
  return `${n} Durchgänge`
}

/**
 * Baut die zweizeilige Ansage für eine Phase.
 * @returns {{ fuehrung: string|null, detail: string, eigen: boolean }}
 */
export function buildAnnouncement(phasen, index, disziplin = {}) {
  const p = phasen?.[index]
  if (!p) return { fuehrung: null, detail: '', eigen: false }

  // Vom Nutzer gesetzte Ansage hat Vorrang und wird unverändert übernommen.
  if (p.ansage && String(p.ansage).trim()) {
    const zeilen = String(p.ansage).split('\n').map(z => z.trim()).filter(Boolean)
    return {
      fuehrung: zeilen.length > 1 ? zeilen[0] : null,
      detail:   zeilen.length > 1 ? zeilen.slice(1).join(' ') : zeilen[0],
      eigen:    true,
    }
  }

  const { gruppe, rest } = trennePhasenname(p.name)
  const durchgang = durchgangNummer(p)
  const stage = stageNummer(phasen, index)

  // Ein wiederholter Durchgang ist keine eigene Stage — die Regel nennt ihn
  // 1. und 2. Durchgang derselben Stage.
  let bezeichnung = gruppe ?? p.name
  if (gruppe && durchgang) bezeichnung = `${gruppe}, ${durchgang}. Durchgang`
  else if (gruppe && stage && /^Match/i.test(gruppe)) bezeichnung = `${gruppe} Stage ${stage}`

  const teile = [
    distanzMitRuecktrag(phasen, index),
    sekundenText(p.durationMs),
    modusAusRegeln(gruppe, disziplin.ablauf),
    beschreibungOhneZeit(p.description),
    wiederholungsText(p),
  ].filter(Boolean)

  return {
    fuehrung: gruppe ? fuehrungsAnsage(rest) : null,
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
export function buildEppAnnouncement(phasen, index) {
  const p = phasen?.[index]
  if (!p) return { fuehrung: null, detail: '', eigen: false }

  if (p.ansage && String(p.ansage).trim()) {
    const zeilen = String(p.ansage).split('\n').map(z => z.trim()).filter(Boolean)
    return {
      fuehrung: zeilen.length > 1 ? zeilen[0] : null,
      detail:   zeilen.length > 1 ? zeilen.slice(1).join(' ') : zeilen[0],
      eigen:    true,
    }
  }

  // Die Führungsansage nur dort, wo die Distanz sich gegenüber der
  // vorigen Station tatsächlich ändert — sonst sagt der RO sie nicht.
  const vorher = index > 0 ? phasen[index - 1]?.distance : null
  const zahl = (p.distance ?? '').match(/(\d+)/)
  const fuehrung = p.distance && p.distance !== vorher && zahl
    ? `Wir gehen auf ${zahl[1]} Meter`
    : null

  const schuss = p.shots
    ? `${p.shots} Schuss${p.shotsNote ? `, ${p.shotsNote}` : ''}`
    : null

  const teile = [
    p.distance,
    // Stationen ohne eigenes Limit laufen aus dem Gesamtzeitkonto — das
    // muss der RO ansagen, sonst warten die Schützen auf ein Zeitsignal.
    p.timeLimitMs > 0 ? `${Math.round(p.timeLimitMs / 1000)} Sekunden` : 'aus der Gesamtzeit',
    schuss,
    p.position,
  ].filter(Boolean)

  return { fuehrung, detail: `${p.station ?? p.name ?? ''}: ${teile.join(' — ')}`, eigen: false }
}
