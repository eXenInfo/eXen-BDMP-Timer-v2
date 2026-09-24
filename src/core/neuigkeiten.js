/**
 * „Neu in dieser Version“: kurze Liste für die Startseite.
 *
 * Wer die App schon benutzt hat, sieht nach einem Update einmal, was sich
 * geändert hat, und blendet es mit „Verstanden“ aus. Wer die App zum ersten
 * Mal öffnet, bekommt keine Neuigkeiten, sondern gilt sofort als auf Stand.
 *
 * Neuester Eintrag steht oben. `stand` ist das Veröffentlichungsdatum und
 * dient zugleich als Vergleichswert (ISO-Datum sortiert als Text richtig).
 * Die ausführliche Fassung steht in CHANGELOG.md im Repo.
 *
 * Der Speicher wird hereingereicht, damit sich das Modul ohne Browser testen lässt.
 */

export const GESEHEN_SCHLUESSEL = 'exen_neu_gesehen'

/** Schlüssel, an denen man eine bereits benutzte App erkennt. */
export const BESTAND_SCHLUESSEL = ['bdmp.bibliothek.v1', 'exen_signale', 'exen_laufmodus']

export const NEUIGKEITEN = [
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
