<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900 px-4">
    <h1 class="text-xl font-bold text-white pt-6 pb-6">Hilfe</h1>

    <div class="space-y-4">

      <details v-for="item in faqItems" :key="item.q" class="bg-gray-800 rounded-xl overflow-hidden">
        <summary class="px-4 py-4 cursor-pointer text-sm font-medium text-white flex items-center justify-between list-none">
          {{ item.q }}
          <span class="text-gray-500 ml-2">›</span>
        </summary>
        <div class="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-700 pt-3">
          {{ item.a }}
        </div>
      </details>

      <!-- Schnellstart -->
      <div class="bg-gray-800 rounded-xl p-4 mt-4">
        <h2 class="text-white font-bold mb-3">Schnellstart</h2>
        <ol class="space-y-2 text-sm text-gray-300">
          <li class="flex gap-3">
            <span class="text-amber-400 font-bold flex-shrink-0">1.</span>
            <span>Unter "Disziplinen" eine Disziplin auswählen oder neu erstellen</span>
          </li>
          <li class="flex gap-3">
            <span class="text-amber-400 font-bold flex-shrink-0">2.</span>
            <span>Zum "Timer"-Reiter wechseln</span>
          </li>
          <li class="flex gap-3">
            <span class="text-amber-400 font-bold flex-shrink-0">3.</span>
            <span>"Start" drücken — Audiosignal ertönt bei Phasenstart und -ende</span>
          </li>
          <li class="flex gap-3">
            <span class="text-amber-400 font-bold flex-shrink-0">4.</span>
            <span>Bei EPP: Feste Stationen laufen automatisch, offene Stationen manuell beenden</span>
          </li>
        </ol>
      </div>

      <!-- EPP Erklärung -->
      <div class="bg-gray-800 rounded-xl p-4">
        <h2 class="text-white font-bold mb-3">EPP — Besonderheiten</h2>
        <div class="space-y-2 text-sm text-gray-400">
          <p><span class="text-blue-400 font-medium">Fixe Stationen</span> (1, 5b): Timer läuft automatisch, Warnsignal ertönt kurz vor Ablauf.</p>
          <p><span class="text-amber-400 font-medium">Offene Stationen</span> (2, 3, 4, 5a, 6): Zeit zählt aufwärts, Range Officer stoppt manuell über "Station beenden".</p>
          <p><span class="text-yellow-400 font-medium">Störung/Pause</span>: Stoppt bei offenen Stationen den Stations- UND Gesamttimer gleichzeitig.</p>
          <p>Die <span class="text-gray-200 font-medium">EPP Gesamtzeit</span> zählt von 5:30 (330 Sek.) herunter und läuft stationsübergreifend.</p>
        </div>
      </div>

      <!-- Audio Hinweis -->
      <div class="bg-amber-900/30 border border-amber-800 rounded-xl p-4">
        <div class="flex gap-3">
          <span class="text-2xl flex-shrink-0">🔊</span>
          <div class="text-sm text-amber-200">
            <strong>Tipp:</strong> Für Schießstand-Einsatz empfehlen wir einen externen Lautsprecher oder Kopfhörer. Das interne Smartphone-Lautsprecher kann in lauter Umgebung zu leise sein.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const faqItems = [
  {
    q: 'Warum ertönt kein Ton?',
    a: 'Der Browser aktiviert Audio erst nach einer Benutzerinteraktion. Tippe zunächst auf "Start" oder einen anderen Button. Für zuverlässigen Ton empfehlen wir einen externen Lautsprecher.'
  },
  {
    q: 'Wie erstelle ich eine eigene Disziplin?',
    a: 'Unter "Disziplinen" auf "+ Neu" tippen. Gib einen Namen ein und füge beliebig viele Phasen hinzu. Jede Phase hat Vorlaufzeit, Dauer, Wiederholungen und Audiosignale.'
  },
  {
    q: 'Wie exportiere / importiere ich Disziplinen?',
    a: 'Unter "Disziplinen" am unteren Rand "Exportieren" — der JSON-Text wird in die Zwischenablage kopiert. Zum Importieren auf "Importieren" tippen und den Text einfügen.'
  },
  {
    q: 'Funktioniert die App offline?',
    a: 'Ja. Die App wird als PWA installiert und funktioniert vollständig offline — auch ohne Internetzugang auf dem Schießstand.'
  },
  {
    q: 'Kann ich den Timer unterbrechen?',
    a: 'Bei normalen Disziplinen: "Unterbrechen" drücken. Bei EPP: Nur bei offenen Stationen (RO-gestoppt) über "Störung / Pause" — dieser stoppt auch die Gesamtzeit.'
  }
]
</script>
