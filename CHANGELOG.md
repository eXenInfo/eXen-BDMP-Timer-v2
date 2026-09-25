# Changelog

Änderungen für Nutzer, neueste oben. Das Datum ist der Stand auf `zeitkern-neu`; live unter
timer.exenwerk.de erst nach dem Merge nach `main`. Die Kurzfassung für die App steht in
`src/core/neuigkeiten.js` und erscheint nach einem Update einmal auf der Startseite.

## 2026-09-25

### Geändert
- **Editor mit allen Schritten auf einer Seite.** Jeder Schritt ist direkt bearbeitbar: Name,
  Vorlauf, Laufzeit, Wiederholungen ohne Halt, Pause dazwischen, Start- und Endton, danach Halt
  oder direkt weiter. Darunter steht in einem Satz, wie der Schritt abläuft. Texte (Beschreibung,
  Ansage, RO-Kommandos) liegen auf einer eigenen Seite je Schritt. EPP-Stationen wie bisher.
- **Keine Vorgaben mehr.** Neue Disziplinen und neue Schritte starten mit 0 Sekunden, ohne Töne
  und ohne Halt.
- **„Disziplin erstellen“ öffnet die neue Disziplin direkt** im Editor.
- **Vorlauf in eigenen Sätzen.** Dort gilt der Vorlauf aus dem Editor. Der globale Vorlauf unter
  „Signale und Lautstärke“ gilt nur für den mitgelieferten Satz und für die Schützenuhr.

## 2026-09-24 (dritter Stand)

### Geändert
- **Schützenuhr nur für lange Serien.** Sie zeigt nur noch Serien ab 60 Sekunden, zum Beispiel
  PP1, PP3, PP4 und Super Magnum auf der ersten Entfernung, PP2 Station B und C, 1020 und 1500
  mit 90 und 165 Sekunden. Kurze Intervalle regelt auf dem Stand die Drehscheibe.
- **Keine Schützenuhr ohne lange Serie.** Bei Disziplinen wie der NPA gibt es nur „Aufsicht“.
- **EPP: nur Gesamtzeit.** Die Schützenuhr beim EPP ist eine einzige Serie über 5:30, getippt
  beim ersten Startsignal.
- Die Schützenuhr mit freier Zeit bleibt unverändert, auch unter 60 Sekunden.

## 2026-09-24 (zweiter Stand)

Durchgänge und Zeiten gegen die Sportordnung (Fassung 24.02.2026) geprüft, ausgelöst durch einen
Tester-Hinweis zu PP1.

### Behoben
- **Halt nach jedem Durchgang.** „Dann erfolgt das Nachladen und ein erneuter Durchgang“
  (C.6A.5, C.6C.5, C.6D.5, C.6E.5): Der Timer lief bisher ohne Halt in den nächsten Durchgang.
  Jetzt wartet er, bis die Aufsicht die Kommandofolge neu gegeben hat.
  - PP1 (A-B-OS), 15 m: nach dem 1. Durchgang (LAR und Sports Carbine waren schon richtig)
  - PP2, Station A: zwischen den beiden Serien zu 6 Schuss in 5 Sekunden statt 10 s Pause
  - PP3 und PP4, Intervall-Entfernungen: je zwei Durchgänge zu 5 bzw. 3 Intervallen
  - Super Magnum, 15 m und 10 m: je zwei Durchgänge zu 5 Intervallen
- **Erste Entfernung als eine Serie.** PP3 (20 m), PP4 (15 m) und Super Magnum (25 m):
  „2 mal 5 Schüsse in 100 Sekunden (2 Minuten) einschließlich Nachladen“ ist eine Serie für alle
  10 Schuss. Bisher liefen zwei Serien zu je 100 s bzw. 2 Minuten mit 10 s Pause.
- **Zeitkontrolle Schütze:** Nach 90 s hält der Timer an, die 165 s starten erst auf Tipp.

Geprüft und unverändert: NPA Service Pistol (alle Fassungen), BDMP 1020, BDMP 1500, DKS 1020,
Sports Carbine PP2.

Hinweis: Eigene Kopien des mitgelieferten Satzes (Sätze und Disziplinen) behalten ihren alten
Ablauf. Der mitgelieferte Satz „BDMP Standard“ ist korrigiert.

## 2026-09-24

Erste Rückmeldungen der Tester.

### Neu
- **Vorlauf für alle Disziplinen einstellbar.** Unter „Signale und Lautstärke“: „Wie Disziplin“
  (Standard, bisheriges Verhalten) oder 0 bis 7 Sekunden. Gilt für alle Disziplinen, auch EPP,
  und wird pro Gerät gespeichert.
- **Schützenuhr mit Vorlauf.** Ist ein Vorlauf eingestellt, heißt der Knopf „Start bei
  „Achtung““: beim Kommando tippen, der Vorlauf läuft still ab, dann die Zeit. Jede Serie beginnt
  wieder mit Vorlauf. Bei „Wie Disziplin“ bleibt es beim Tipp auf das Startsignal.
- **Hinweis „Neu in dieser Version“** auf der Startseite, einmal nach einem Update.

### Geändert
- **Endsignal klingt wie das Startsignal:** gleiche Tonhöhe (880 Hz), gleiche einstellbare
  Länge. Vorher war es tiefer (660 Hz) und wurde als Fehler wahrgenommen. Das EPP-Stoppsignal
  bleibt bei 2 Sekunden nach C.17.14.
- **iPhone: Ton trotz Stummschalter** (ab iOS 17). Die Signale laufen als Wiedergabe, nicht als
  Umgebungston. Musik aus anderen Apps pausiert, solange der Timer Ton abgibt.

### Behoben
- **iPhone: Anzeige unter Statusleiste und Dynamic Island.** In der installierten App lagen
  Zurück-Knopf und Kopfzeile unter der Uhrzeit. Die App hält jetzt oben und im Querformat
  seitlich den sicheren Rand ein.

## 2026-09-23 und früher

Neue Oberfläche mit Favoriten, Betriebsarten Aufsicht und Schützenuhr, Stumm-Schalter,
Lautstärke und Länge des Startsignals, RO-Texte bearbeitbar, Englisch vollständig, neue Version
erst auf Knopfdruck. Einzelheiten in der Git-Historie.
