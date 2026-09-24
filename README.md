# eXen-BDMP-Timer

Zeitsteuerung für dynamische Schießdisziplinen nach BDMP-Sportordnung. Web-App (PWA),
läuft im Browser, lässt sich installieren und funktioniert danach offline auf dem Stand.

**Live:** [timer.exenwerk.de](https://timer.exenwerk.de)

## Funktionen

- Mitgelieferter Satz mit den dynamischen BDMP-Disziplinen, dazu eigene Disziplinen und
  Sätze: anlegen, bearbeiten, ausgeben, einlesen, nachladen
- Zwei Betriebsarten: **Aufsicht** (Timer führt den Ablauf mit Vorlauf und Signalen) und
  **Schützenuhr** (zum Mitlaufen im Wettkampf, ohne Ton und Vorlauf)
- EPP-Modus mit festen und offenen Stationen und durchlaufender Gesamtzeit
- Schützenuhr mit frei wählbarer Dauer, ohne Disziplin
- RO-Ansagen je Disziplin, bearbeitbar
- Signale und Lautstärke einstellbar, Startsignal 600 ms, Vibration auf dem Handy
- Favoriten (bis zu fünf), Deutsch und Englisch

Hilfsmittel für Aufsicht und Training. Verbindlich sind die Sportordnung in der gültigen
Fassung auf der BDMP-Seite und die Entscheidungen der Aufsicht.

## Entwicklung

Voraussetzung: Node.js 22 (wie in der CI) und npm.

```bash
npm ci               # Abhängigkeiten installieren
npm run dev          # Entwicklungsserver
npm test             # Tests (vitest)
npm run lint         # ESLint
npm run build        # Produktions-Build nach dist/
npm run build:preview  # ganze App als eine HTML-Datei nach dist-preview/
```

Stack: Vue 3, Vite, vue-i18n, vite-plugin-pwa; Capacitor für Android/iOS
vorbereitet.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/core` | Zeitlogik und Regeln ohne Vue, mit Tests in `test/` |
| `src/composables` | Engine-Uhr, Laufmodus, Sprache, Bildschirm wach halten, Installation |
| `src/views`, `src/components` | Oberfläche |
| `src/locales` | Texte Deutsch und Englisch |
| `public/disziplinen.json` | mitgelieferter Disziplinsatz |
| `test` | Tests |

## Branches und Veröffentlichung

- `zeitkern-neu`: Arbeitsbranch. Jeder Push wird auf GitHub geprüft (Lint, Tests, Build),
  aber nicht veröffentlicht.
- `main`: wird per GitHub Actions auf GitHub Pages veröffentlicht
  (`exeninfo.github.io/eXen-BDMP-Timer-v2/`), `timer.exenwerk.de` leitet dorthin weiter.
  Änderungen kommen nur per Pull Request nach `main`.

## Anbieter

eXenWerk| (Thomas Köhler), [exenwerk.de](https://exenwerk.de). Impressum und Datenschutz
in der App unter „Hilfe und Rechtliches“.
