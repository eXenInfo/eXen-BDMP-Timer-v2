/**
 * „Neu in dieser Version“: kurze Liste für die Startseite.
 *
 * Wer die App schon benutzt hat, sieht nach einem Update einmal, was sich
 * geändert hat, und blendet es mit „Verstanden“ aus. Wer die App zum ersten
 * Mal öffnet, bekommt keine Neuigkeiten, sondern gilt sofort als auf Stand.
 *
 * Neuester Eintrag steht oben. `stand` ist das Veröffentlichungsdatum und
 * dient zugleich als Vergleichswert (ISO-Datum sortiert als Text richtig).
 * Ein zweiter Stand am selben Tag bekommt eine Nummer: '2026-09-24.2'.
 * Die ausführliche Fassung steht in CHANGELOG.md im Repo.
 *
 * Der Speicher wird hereingereicht, damit sich das Modul ohne Browser testen lässt.
 */

export const GESEHEN_SCHLUESSEL = 'exen_neu_gesehen'

/** Schlüssel, an denen man eine bereits benutzte App erkennt. */
export const BESTAND_SCHLUESSEL = ['bdmp.bibliothek.v1', 'exen_signale', 'exen_laufmodus']

export const NEUIGKEITEN = [
  {
    stand: '2026-09-24.2',
    punkte: {
      de: [
        'Durchgänge nach Sportordnung: Nach jedem Durchgang hält der Timer an, bis die Aufsicht weitergibt (PP1 15 m, PP2 Station A, PP3, PP4 und Super Magnum auf den Intervall-Entfernungen).',
        'PP3, PP4 und Super Magnum: Die erste Entfernung ist eine Serie von 100 Sekunden bzw. 2 Minuten für alle 10 Schuss einschließlich Nachladen.',
        'Zeitkontrolle Schütze: Nach 90 Sekunden hält der Timer an, die 165 Sekunden starten erst auf Tipp.',
      ],
      en: [
        'Runs as per the rule book: after each run the timer stops until the range officer continues (PP1 15 m, PP2 station A, PP3, PP4 and Super Magnum on the interval distances).',
        'PP3, PP4 and Super Magnum: the first distance is one string of 100 seconds or 2 minutes for all 10 rounds including the reload.',
        'Shooter time check: after 90 seconds the timer stops, the 165 seconds start only on tap.',
      ],
    },
  },
  {
    stand: '2026-09-24',
    punkte: {
      de: [
        'Vorlauf für alle Disziplinen einstellbar: unter „Signale und Lautstärke“ 0 bis 7 Sekunden oder wie in der Disziplin hinterlegt.',
        'Die Schützenuhr kann jetzt auch mit Vorlauf laufen. Dann beim Kommando „Achtung“ tippen.',
        'Start- und Endsignal klingen jetzt gleich.',
        'iPhone: Die Signale sind auch bei stummgeschaltetem Gerät zu hören (ab iOS 17).',
        'iPhone: Knöpfe und Anzeigen liegen nicht mehr unter Uhrzeit und Dynamic Island.',
      ],
      en: [
        'Lead-in adjustable for all disciplines: under “Signals and volume”, 0 to 7 seconds or as set in the discipline.',
        'The shooter clock can now run with a lead-in. Then tap on the “Stand by” command.',
        'Start and end signal now sound the same.',
        'iPhone: signals can be heard even when the device is muted (iOS 17 and later).',
        'iPhone: buttons and displays no longer sit under the clock and Dynamic Island.',
      ],
    },
  },
]

export const AKTUELLER_STAND = NEUIGKEITEN[0].stand

function lesen(speicher, schluessel) {
  try { return speicher?.getItem(schluessel) ?? null } catch { return null }
}
function schreiben(speicher, wert) {
  try { speicher?.setItem(GESEHEN_SCHLUESSEL, wert) } catch { /* ohne Speicher erscheint der Hinweis erneut */ }
}

/**
 * Einträge, die dieses Gerät noch nicht gesehen hat, neuester zuerst.
 * Beim allerersten Start wird still der aktuelle Stand vermerkt.
 */
export function offeneNeuigkeiten(speicher, liste = NEUIGKEITEN) {
  const gesehen = lesen(speicher, GESEHEN_SCHLUESSEL)
  if (gesehen === null) {
    const bestand = BESTAND_SCHLUESSEL.some(k => lesen(speicher, k) !== null)
    if (!bestand) { schreiben(speicher, liste[0]?.stand ?? ''); return [] }
    return liste
  }
  return liste.filter(e => e.stand > gesehen)
}

/** Nach „Verstanden“: bis zum nächsten Eintrag nichts mehr anzeigen. */
export function neuigkeitenGesehen(speicher, liste = NEUIGKEITEN) {
  schreiben(speicher, liste[0]?.stand ?? '')
}

/** Punkte in der gewählten Sprache, Englisch fällt auf Deutsch zurück. */
export function punkteIn(eintrag, sprache) {
  return eintrag.punkte[sprache] ?? eintrag.punkte.de
}
