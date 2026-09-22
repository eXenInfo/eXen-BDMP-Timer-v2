/**
 * Rechtliche Angaben und Regelgrundlage.
 *
 * An einer Stelle gebündelt, damit eine Änderung nicht durch mehrere
 * Ansichten gesucht werden muss. Die Angaben sind aus dem Impressum von
 * exenwerk.de übernommen und stimmen damit mit dem überein, was dort bereits
 * veröffentlicht ist.
 *
 * Rechtstexte bleiben deutsch. Eine selbst gefertigte Übersetzung wäre im
 * Streitfall nicht belastbar; maßgeblich ist die deutsche Fassung.
 */

export const IMPRESSUM = {
  anbieter: [
    'Thomas Köhler',
    'Thomas Köhler – Unternehmensberatung',
    'Max-Samson-Str. 5',
    '33165 Lichtenau',
    'Deutschland',
  ],
  geschaeftsbezeichnung:
    'eXenWerk| ist die Geschäftsbezeichnung, unter der Thomas Köhler seine freiberufliche Tätigkeit als Unternehmensberater führt.',
  kontakt: {
    telefon: '+49 5292 319310',
    email: 'info@exenwerk.de',
    web: 'exenwerk.de',
  },
  ustIdNr: 'DE368843640',
  register: 'Als freiberuflich Tätiger nicht im Handelsregister eingetragen.',
  redaktionell:
    'Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV: Thomas Köhler, Max-Samson-Str. 5, 33165 Lichtenau.',
  streitbeilegung:
    'Es besteht weder Bereitschaft noch Verpflichtung, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
}

/**
 * Der wichtigste Abschnitt dieser App. Ein Timer ist ein Hilfsmittel; über
 * Zeiten, Wertung und Ablauf entscheidet die Aufsicht nach der Sportordnung.
 */
export const HAFTUNG = [
  'Diese App ist ein Hilfsmittel für Aufsicht und Training. Verbindlich sind allein die Sportordnung des BDMP in ihrer jeweils gültigen Fassung und die Entscheidungen der eingesetzten Range Officers.',
  'Über Zeiten, Wertung, Störungen und Ausschluss entscheidet die Aufsicht, nicht das Programm. Bei Abweichungen zwischen der Anzeige und der Sportordnung gilt die Sportordnung.',
  'Die hinterlegten Abläufe und Texte wurden sorgfältig aus der Sportordnung übernommen. Für Richtigkeit, Vollständigkeit und Aktualität wird keine Gewähr übernommen; maßgeblich ist stets die amtliche Fassung des BDMP.',
  'Für Wettkämpfe ist vor dem Einsatz zu prüfen, ob die verwendeten Disziplinen dem Stand der Ausschreibung entsprechen.',
]

export const DATENSCHUTZ = [
  'Die App verarbeitet keine personenbezogenen Daten auf einem Server. Disziplinen, eigene Sätze, Lautstärke und Sprachwahl werden ausschließlich im Speicher des benutzten Browsers abgelegt und verlassen das Gerät nicht.',
  'Es werden keine Cookies zu Analysezwecken gesetzt, es findet keine Reichweitenmessung statt, und es sind keine Dienste Dritter eingebunden.',
  'Beim Abruf der Seite fallen beim Hoster technisch bedingt Zugriffsdaten an, darunter die IP-Adresse. Auf deren Verarbeitung hat der Anbieter dieser App keinen Einfluss; sie richtet sich nach den Bestimmungen des jeweiligen Hosters.',
  'Wer die gespeicherten Daten entfernen will, löscht die Websitedaten im Browser. Damit gehen eigene Sätze verloren — vorher ausgeben und sichern.',
]

export const REGELGRUNDLAGE = {
  quelle: 'BDMP-Handbuch Sportordnung, Teil C: Kurzwaffen-Disziplinen und Teil D: Langwaffen-Disziplinen',
  stand: 'Fassung vom 24.02.2026',
  // Bewusst nur die Verbandsseite: Der Ablageort der einzelnen Register
  // ändert sich mit jeder Fassung, die Startseite bleibt.
  url: 'https://www.bdmp.de',
  wegweiser: 'Die jeweils gültige Fassung steht auf der Seite des BDMP.',
  abschnitte: [
    { ref: 'C.6.10', was: 'Kommandos des Leitenden für Police Pistol, NPA Service Pistol und Super Magnum' },
    { ref: 'C.8.2',  was: 'Ablauf BDMP 1500 (PPC)' },
    { ref: 'C.8.4',  was: 'Stellungen und Stellungswechsel' },
    { ref: 'C.8.5',  was: 'Kommandos des Leitenden für BDMP 1500 und 1020' },
    { ref: 'C.8.7',  was: 'Fertigstellung' },
    { ref: 'C.15A',  was: 'Dynamisches Kleinkaliberschießen 1 – 1020 (DKS 1 – 1020)' },
    { ref: 'C.17',   was: 'Europäischer Präzisions Parcours (EPP)' },
    { ref: 'C.21',   was: 'BDMP 1020 Wettkampfarten' },
    { ref: 'D.22.A', was: 'Dynamisches Kleinkaliberschießen 2 – 1020 (Langwaffe)' },
    { ref: 'D.25',   was: 'Europäischer Präzisions Parcours .223 Rem. — EPP Rifle und EPP Carbine' },
    { ref: 'D.26',   was: 'Sports Carbine PP1' },
    { ref: 'D.27',   was: 'Sports Carbine NPA' },
    { ref: 'D.36',   was: 'Sports Carbine PP2' },
    { ref: 'D.37',   was: 'BDMP 1500 Carbine' },
  ],
}

export const SIGNALE = [
  { name: 'Startsignal', beschreibung: 'Ein Ton, 880 Hz. Markiert den Beginn der Schießzeit. Länge einstellbar, Standard 600 ms.' },
  { name: 'Zweites Signal', beschreibung: 'Ein durchgehender Ton über die in der Sportordnung festgelegte Dauer. Beim EPP beginnt er an Station 1 nach 13 Sekunden und an Station 5b nach 8 Sekunden und läuft jeweils 2 Sekunden. Sein Ende ist die Grenze der gewerteten Schüsse (C.17.14). Die Dauer ist nicht einstellbar.' },
  { name: 'Endsignal', beschreibung: 'Ein Ton, 660 Hz, am Ablauf der Schießzeit bei Disziplinen ohne eigenes zweites Signal.' },
  { name: 'Abschluss', beschreibung: 'Zwei kurze Töne am Ende des gesamten Ablaufs.' },
  { name: 'Warnton', beschreibung: 'Ein tiefer Ton bei Ausschluss nach der zweiten Störung.' },
]

/**
 * Freiwilliges Dankeschön. Bewusst kein Bezahlvorgang in der App: Der
 * Verweis führt nach außen, es werden keine Zahlungsdaten verarbeitet.
 */
export const DANKESCHOEN = {
  text: 'Der Timer ist kostenlos und werbefrei. Wer die Arbeit daran unterstützen möchte, kann ein Dankeschön senden.',
  url: 'https://paypal.me/exen',
  label: 'Ein Dankeschön senden (PayPal)',
}

export const APP_INFO = {
  name: 'eXen BDMP Timer',
  zweck: 'Zeitsteuerung für dynamische Schießdisziplinen des BDMP',
  lizenz: 'MIT',
  repo: 'github.com/eXenInfo/eXen-BDMP-Timer-v2',
}
