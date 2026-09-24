# Changelog

Änderungen für Nutzer, neueste oben. Das Datum ist der Stand auf `zeitkern-neu`; live unter
timer.exenwerk.de erst nach dem Merge nach `main`. Die Kurzfassung für die App steht in
`src/core/neuigkeiten.js` und erscheint nach einem Update einmal auf der Startseite.

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
