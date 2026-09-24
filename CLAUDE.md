# eXen-BDMP-Timer-v2

Web-App (PWA) für BDMP-Disziplinen, Anbieter eXenWerk| (Thomas Köhler), Impressum in
src/core/legal.js. Live unter timer.exenwerk.de (302-Weiterleitung bei IONOS auf
exeninfo.github.io/eXen-BDMP-Timer-v2/, GitHub Pages aus main). Gemeinsam gebaut mit
Claude. Sachlich, knapp, Du-Anrede, Deutsch.

## Repos und Grenzen
- Arbeitsrepo: eXenInfo/eXen-BDMP-Timer-v2, Arbeitsbranch zeitkern-neu.
- eXenInfo/eXen-BDMP-Timer ist der Produktivstand und wird nie angefasst, auch nicht
  per PR, Issue oder Einstellung. eXen-Timer ist der Vorgänger, ebenfalls nicht anfassen.
- Nie auf main pushen, nie force-pushen, keine Tags, keine Releases. Änderungen nach
  main nur über einen Pull Request von zeitkern-neu.
- Mergen darf Claude, aber nur nach ausdrücklichem Go von Thomas für genau diesen PR.
  Vorher: PR-Nummer, enthaltene Commits und CI-Status nennen. Merge immer als
  Merge-Commit (gh pr merge <nr> --merge), kein Squash, kein Rebase, Branch nicht löschen.
  Ein Merge nach main geht sofort live auf timer.exenwerk.de.
- Nach dem Merge: Deploy-Lauf abwarten und melden, ob die Seite den neuen Stand zeigt.
- Keine Inhalte aus Claude_Projekte (Privat-Ablage) oder COMPLUS übernehmen.

## Arbeitsweise lokal
- Klon: ~/Developer/eXen-BDMP-Timer-v2, Remote origin (Anmeldung über den
  macOS-Schlüsselbund). Kein Token, kein weiteres Remote, Git-Konfiguration nicht ändern.
- Bei Sessionstart: git fetch origin, dann Branch und Status melden. Weicht der lokale
  Stand von origin/zeitkern-neu ab, stoppen und nachfragen.
- Fehlt node_modules oder hat sich package-lock.json geändert: npm ci.
- Push nur so: git push origin zeitkern-neu. Scheitert er mit 401/403: melden, nicht
  umgehen.

## Ablauf je Änderung
1. Vor der Umsetzung kurz den Plan nennen (2 bis 3 Sätze), bei echter Unklarheit eine
   gezielte Frage.
2. Vollständig umsetzen, keine Minimal-MVPs. Zeitlogik nur mit Tests ändern; jede
   Korrektur an Zeiten bekommt einen Test, der den Fehler vorher zeigt.
3. Merkt der Nutzer die Änderung, CHANGELOG.md (ausführlich) und src/core/neuigkeiten.js
   (Kurzfassung für die Startseite, Deutsch und Englisch, neuer Eintrag oben) nachführen.
4. Vor jedem Commit: npm test, npm run lint (0 Fehler), npm run build. Scheitert einer,
   nicht committen.
5. Commit-Nachricht auf Deutsch im Stil der Historie (kurze Zeile, was sich für den
   Nutzer ändert). Autor laut Repo-Konfig: Thomas Köhler <thomas@exen.info>.
   Trailer Co-Authored-By für Claude.
6. Vor jedem Push: git log origin/zeitkern-neu..HEAD --oneline und git diff --stat
   origin/zeitkern-neu zeigen und das Go von Thomas abwarten.
7. Nach dem Push: Commit-Hash nennen.

## Befehle
- npm ci | npm run dev | npm test | npm run lint | npm run build
- Vorschau als Einzeldatei: npm run build:preview
  (Ausgabe dist-preview/index.html, nicht im Repo)

## Aufbau
- src/core: reine Logik ohne Vue (sequenceEngine, eppEngine, laufModus, ansage, audio,
  disciplineRules, eppRules, library, legacyImport, lokalisierung, signalEinstellungen,
  legal, textEn). Hier liegt die Zeitlogik, hier gehören Tests hin (test/*.test.js, vitest).
- src/composables: useEngineClock, useLaufModus, useLocale, useWachHalten, useInstallieren
- src/services/storage.js: Speicherzugriff; library.js bekommt den Speicher hereingereicht
- src/views, src/components: Oberfläche; Knopf-System in src/styles/bedienung.css
- src/locales: de.json, en.json
- public/disziplinen.json: mitgelieferter Disziplinsatz; Regeln je Disziplin in
  src/core/disciplineRules.js

## Fachliche Leitplanken
- Regelgrundlage BDMP-Handbuch Sportordnung (Teil C Kurzwaffen, Teil D Langwaffen, EPP in
  C.17). In der App nur die BDMP-Seite verlinken, keinen Deeplink auf die PDF, Hinweis:
  gültige Fassung steht auf der BDMP-Seite.
- Startsignal 600 ms. Buttons groß, logisch, verwechslungssicher.
- Zeitkritisches nie an setTimeout-Ketten hängen, sondern an die Engine-Uhr.
- Neue Disziplin: Daten in public/disziplinen.json plus Regel in disciplineRules.js plus Test.
- Texte in de.json und en.json immer beide pflegen; locales.test.js muss grün bleiben.
- base in vite.config.js ist /eXen-BDMP-Timer-v2/, nicht ändern.
