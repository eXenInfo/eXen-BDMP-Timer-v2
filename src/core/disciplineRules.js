/**
 * Regeltexte zu den Standard-Disziplinen.
 * BDMP-Handbuch Sportordnung Teil C, Stand 24.02.2026.
 *
 * Die Sportordnung kennt zwei Kommandofolgen, die sich im Wortlaut
 * unterscheiden und nicht vermischt werden dürfen:
 *   C.6.10  Police Pistol 1–4, NPA Service Pistol, Super Magnum
 *   C.8.5   BDMP 1500 (PPC) — gilt über C.21 auch für BDMP 1020
 *
 * Englisch steht daneben, weil die Sportordnung beide Fassungen führt und
 * die App zweisprachig ist.
 */

/**
 * Waffenarten. Eine Disziplin kann in mehreren gefochten werden; wo die
 * Zeiten übereinstimmen, beschreibt ein Satz beide Varianten, wo sie
 * abweichen, braucht jede Variante ihren eigenen.
 */
export const WEAPON_CLASSES = {
  kurzwaffe:   { id: 'kurzwaffe',   kurz: 'KW',    label: 'Kurzwaffe' },
  kkKurzwaffe: { id: 'kkKurzwaffe', kurz: 'KK-KW', label: 'Kleinkaliber-Kurzwaffe' },
  langwaffe:   { id: 'langwaffe',   kurz: 'LW',    label: 'Langwaffe' },
  kkLangwaffe: { id: 'kkLangwaffe', kurz: 'KK-LW', label: 'Kleinkaliber-Langwaffe' },
}

export const COMMAND_SETS = {
  policePistol: {
    id: 'policePistol',
    ruleRef: 'C.6.10',
    label: 'Police Pistol, NPA Service Pistol, Super Magnum',
    vorher: [
      { de: 'Laden und fertigmachen!', en: 'Load and make ready!' },
      { de: 'Ist jemand nicht fertig?', en: 'Anyone not ready?',
        hinweis: 'Wer nicht fertig ist, meldet das klar und deutlich. Dann lautet das Kommando „Nicht fertig!“ („Not ready!“).' },
    ],
    start: [
      { de: 'Achtung – Feuer!', en: 'Attention – fire!',
        hinweis: 'Ersatzweise ein Signal, oder die Scheiben werden weggedreht und nach etwa 5 Sekunden zum Start der Serie wieder hergedreht.' },
    ],
    nachher: [
      { de: 'Waffe entladen und vorzeigen!', en: 'Unload and show clear!' },
      { de: 'Sicherheit! Gibt es irgendwelche Proteste?', en: 'All clear, are there any protests?' },
      { de: 'Keine Proteste! Scheiben drehen, Trefferaufnahme!', en: 'No protests, show targets, advance and score!' },
    ],
    hinweise: [
      'Revolver werden mit ausgeklappter Trommel vorgezeigt, dazu die zuletzt in der Trommel befindlichen Hülsen.',
      'Halbautomatische Pistolen werden mit offenem Verschluss vorgezeigt, dazu das zuletzt benutzte Magazin.',
      'Erst nach Bestätigung durch die Aufsicht wird geholstert.',
      'Der Stand wird erst freigegeben, wenn alle Schützen entladen und geholstert haben.',
      'Es gibt keine anerkannten Waffen- und Munitionsfehler; Versager und Fehlfunktionen gehen zu Lasten des Schützen (C.6.8).',
    ],
  },

  ppc1500: {
    id: 'ppc1500',
    ruleRef: 'C.8.5',
    label: 'BDMP 1500 (PPC) und BDMP 1020',
    vorher: [
      { de: 'Laden und holstern!', en: 'Load and holster!',
        hinweis: 'Die Waffe wird aus dem Holster genommen, geladen und wieder geholstert. Halbautomatische Pistolen werden grundsätzlich unterladen geholstert und erst zu Beginn der Serie fertiggeladen.' },
      { de: 'Sind die Schützen fertig?', en: 'Is the line ready?',
        hinweis: 'Wer nicht fertig ist, zeigt das klar und deutlich an. Dann lautet das Kommando „Nicht fertig!“ („The line is not ready“).' },
    ],
    start: [
      { de: 'Achtung!', en: 'Stand by!',
        hinweis: 'Kann durch ein anderes Signal ersetzt werden, etwa das Wegdrehen der Scheiben. Die Serie beginnt mit dem Herdrehen oder einem anderen Startsignal.' },
    ],
    abbruch: [
      { de: 'Schießen einstellen!', en: 'Cease firing!',
        hinweis: 'Auch ein langanhaltender Pfiff. Das Schießen wird augenblicklich eingestellt.' },
    ],
    nachher: [
      { de: 'Schießen einstellen – Waffe entladen und vorzeigen!', en: 'Cease firing – unload and show clear!' },
      { de: 'Sicherheit', en: 'The line is clear.' },
    ],
    hinweise: [
      'Die Mündung zeigt beim Vorzeigen immer in Richtung Geschossfang.',
      'Revolver mit ausgeklappter Trommel und den zuletzt enthaltenen Hülsen vorzeigen.',
      'Halbautomatische Pistolen mit offenem Verschluss und dem zuletzt benutzten Magazin vorzeigen.',
      'Der Stand wird erst freigegeben, wenn alle Schützen entladen und geholstert haben.',
      'Ein Verstoß gegen grundlegende Sicherheitsbestimmungen führt zur sofortigen Disqualifikation.',
    ],
  },
}

/** Stellungen nach C.8.4 — auch für 1020 verbindlich (C.21 verweist darauf). */
export const POSITIONS = {
  stehendFrei: {
    name: 'Stehend frei', ruleRef: 'C.8.4',
    text: 'Die Waffe wird mit einer oder beiden Händen gehalten. Unterstützende Hilfsmittel sind untersagt.',
  },
  stehendPfosten: {
    name: 'Stehend am Pfosten', ruleRef: 'C.8.4',
    text: 'Der Pfosten ist als Unterstützung zu benutzen, die Waffe selbst darf ihn nicht berühren. Der Schütze steht rechts hinter dem Pfosten, wenn er links schießt, und umgekehrt. Die gedachte oder markierte Linie an der Schussseite des Balkens darf nicht übertreten werden. Das Schießen am Pfosten beginnt mit der linken Hand; abgezogen wird mit einem Finger derselben Hand. Nur der Abzugsfinger befindet sich im Abzugsbügel, die schießende Hand darf durch die andere unterstützt werden.',
  },
  kniendFrei: {
    name: 'Kniend frei', ruleRef: 'C.8.4',
    text: 'Kniend auf einem Knie, das andere der Scheibe zugewandt. Die Gesäßbacken können auf den Absätzen oder seitlich auf dem Fuß aufliegen, dürfen den Boden aber nicht berühren. Der Arm darf durch das zur Scheibe zeigende Knie stabilisiert werden, die Waffe selbst nicht. Alternativ kniend auf beiden Knien, dann deutlich vom Boden entfernt und ohne weitere Unterstützung.',
  },
  kniendPfosten: {
    name: 'Kniend mit Pfosten', ruleRef: 'C.8.4',
    text: 'Nur für die 40- und 48-Schuss-Matches. Der Pfosten ist zu benutzen, die Waffe darf ihn nicht berühren. Der Schütze kniet links hinter dem Pfosten, wenn er rechts schießt, und umgekehrt.',
  },
  sitzend: {
    name: 'Sitzend', ruleRef: 'C.8.4',
    text: 'Beide Gesäßbacken auf dem Boden, der Körper den Scheiben zugewandt. Eine Hand kann stützen, der Ellenbogen darf den Boden nicht berühren, der Rücken ebenfalls nicht. Ein oder beide Knie dürfen angewinkelt sein. Die Waffe darf nicht durch einen Fuß unterstützt werden. Der Pfosten darf nicht benutzt werden.',
  },
  liegend: {
    name: 'Liegend', ruleRef: 'C.8.4',
    text: 'Der Körper liegt ausgestreckt in Sichtlinie, den Kopf zum Ziel; schräges Liegen ist zulässig, solange die Linie gewahrt bleibt und niemand gestört wird. Die Waffe darf durch eine oder beide am Boden aufliegende Hände unterstützt werden, darf aber selbst keinen Bodenkontakt haben. Der Pfosten darf nicht benutzt werden.',
  },
}

/** Beim Stellungswechsel — der Punkt, an dem auf dem Stand am meisten schiefgeht. */
export const POSITION_CHANGE_NOTES = [
  'Beim Einnehmen aller Stellungen zeigt die Mündung immer in Richtung Geschossfang.',
  'Beim Wechsel von kniend in stehend, sitzend in liegend und liegend in stehend muss die halbautomatische Pistole mit zurückgezogenem Schlitten und entferntem Magazin geführt werden, der Revolver mit geöffneter Trommel und entfernten Hülsen.',
  'Der Abzugsfinger befindet sich dabei deutlich erkennbar außerhalb des Abzugsbügels.',
  'Nachgeladen wird erst nach dem Wechsel der Schießstellung.',
  'Beim Wechsel von sitzend in liegend muss die Waffe nach vorn in Richtung Geschossfang zeigen.',
]

/** Fertigstellung — wie der Schütze vor dem Startsignal steht. */
export const READINESS = {
  abgesenkt45: {
    ruleRef: 'C.6A.6', 
    text: 'Die Waffe wird mit ausgestreckten Armen auf 45 Grad abgesenkt, die Mündung zielt auf den Boden.',
  },
  npaWaagerecht: {
    ruleRef: 'C.7.6',
    text: 'Die Waffe wird waagerecht zum Boden gehalten. Die Ellenbogen liegen am Körper an, Ober- und Unterarm bilden einen Winkel von 90 Grad. Die Mündung zielt auf die Scheibe.',
  },
  ppZweiGemischt: {
    ruleRef: 'C.6B',
    text: 'Station A: Die Waffe wird mit ausgestreckten Armen auf 45 Grad abgesenkt, die Mündung zielt auf den Boden. Stationen B und C: Die Waffe ist geholstert, halbautomatische Pistolen unterladen.',
  },
  geholstert: {
    ruleRef: 'C.8.7',
    text: 'Der Schütze steht aufrecht, die geladene Waffe im Holster; halbautomatische Pistolen unterladen. Arme und Hände hängen zwanglos herab und berühren weder Waffe noch Holster, bis sich die Scheiben herdrehen oder ein anderes Startsignal gegeben wird. Eine abweichende Handposition zum Starten eines Timers am Arm oder Pfosten ist zulässig.',
  },
}

/**
 * Zuordnung Disziplin → Regelwerk. Der Schlüssel ist ein Muster auf den
 * Namen, weil die Sammlung Varianten wie „(A-B-OS)“ oder „(LAR)“ führt.
 */
export const DISCIPLINE_RULES = [
  /*
   * Die Reihenfolge entscheidet: findDisciplineRules nimmt den ersten
   * Treffer. Die Sonderfassungen der Police Pistol 1 stehen deshalb vor
   * der allgemeinen Regel, sonst würde „Police Pistol 1 (SM)“ als PP1
   * gelesen und bekäme den falschen Ablauf.
   */
  {
    match: /^Police Pistol 1 \(SM\)|^Super Magnum|^SM\b/i,
    ruleRef: 'C.6C', commandSet: 'policePistol', readiness: 'abgesenkt45',
    varianten: [{ klasse: 'kurzwaffe', ruleRef: 'C.6C', label: 'Super Magnum' }],
    ammo: '30 Patronen, mindestens 1200 Joule', target: 'PP-1-Scheibe',
    ablauf: [
      '25 m: 2 × 5 Schüsse in 2 Minuten einschließlich eines eventuellen Nachladens.',
      '15 m: 2 × 5 Schüsse in Intervallen. Die Scheibe zeigt sich fünfmal für je 3 Sekunden, dabei jeweils 1 Schuss.',
      '10 m: 2 × 5 Schüsse in Intervallen. Die Scheibe zeigt sich fünfmal für je 2 Sekunden, dabei jeweils 1 Schuss.',
    ],
    hinweise: [
      'Die Geschossenergie muss bei einer E2-Messung mindestens 1200 Joule erreichen.',
      'Die Sammlung führt die Disziplin als „Police Pistol 1 (SM)“; der Ablauf ist der der Super Magnum nach C.6C, nicht der der Police Pistol 1.',
    ],
  },
  {
    match: /^Police Pistol 1 \(LAR\)/i,
    ruleRef: null, commandSet: 'policePistol', readiness: null,
    varianten: [{ klasse: 'langwaffe', ruleRef: null, label: 'Police Pistol 1 (LAR)' }],
    ammo: '30 Patronen', target: 'PP-1-Scheibe',
    ablauf: [
      '25 m: 12 Schüsse in 2 Minuten einschließlich eines eventuellen Nachladens.',
      '15 m: 2 × 6 Schüsse in Intervallen. Die Scheibe zeigt sich sechsmal für je 2 Sekunden, dabei jeweils 1 Schuss. Danach Nachladen und erneuter Durchgang.',
      '10 m: 3 × 2 Schüsse in Intervallen. Die Scheibe zeigt sich dreimal für je 3 Sekunden, dabei jeweils 2 Schüsse.',
    ],
    hinweise: [
      'Langwaffenfassung mit Unterhebelrepetierer. Weicht von der Kurzwaffen-PP1 auf 10 m ab: 3 statt 2 Sekunden je Intervall. Deshalb ein eigener Satz.',
    ],
  },
  {
    match: /^Police Pistol 1 \(30M1 ?[–-] ?SpCb\)|^Police Pistol 1 \(SpCb\)/i,
    ruleRef: null, commandSet: 'policePistol', readiness: null,
    varianten: [{ klasse: 'langwaffe', ruleRef: null, label: 'Police Pistol 1 (Sports Carbine)' }],
    ammo: '30 Patronen', target: 'PP-1-Scheibe',
    ablauf: [
      '25 m: 12 Schüsse in 2 Minuten einschließlich eines eventuellen Nachladens.',
      '15 m: 2 × 6 Schüsse in Intervallen. Die Scheibe zeigt sich sechsmal für je 3 Sekunden, dabei jeweils 1 Schuss. Danach Nachladen und erneuter Durchgang.',
      '10 m: 3 × 2 Schüsse in Intervallen. Die Scheibe zeigt sich dreimal für je 3 Sekunden, dabei jeweils 2 Schüsse.',
    ],
    hinweise: [
      'Langwaffenfassung mit Sports Carbine. Weicht von der Kurzwaffen-PP1 auf 15 m und 10 m ab: 3 statt 2 Sekunden je Intervall. Deshalb ein eigener Satz.',
    ],
  },
  {
    match: /^Zeitkontrolle/i,
    ruleRef: null, commandSet: null, readiness: null, ohneAnsage: true,
    ammo: null, target: null,
    ablauf: [],
    hinweise: ['Hilfsmittel zum Training, keine Wettkampfdisziplin: eine reine Uhr über 90 und 165 Sekunden. Deshalb ohne Kommandofolge und ohne Ansage.'],
  },
  {
    match: /^Police Pistol 1\b/i, ruleRef: 'C.6A', commandSet: 'policePistol', readiness: 'abgesenkt45',
    varianten: [{ klasse: 'kurzwaffe', ruleRef: 'C.6A', label: 'Police Pistol 1' }],
    ammo: '30 Patronen', target: 'PP-1-Scheibe',
    ablauf: [
      '25 m: 12 Schüsse in 2 Minuten einschließlich eines eventuellen Nachladens. Jetloader und Speedloader sind erlaubt.',
      '15 m: 2 × 6 Schüsse in Intervallen. Die Scheibe zeigt sich sechsmal für je 2 Sekunden, dabei jeweils 1 Schuss. Danach Nachladen und erneuter Durchgang.',
      '10 m: 6 Schüsse in Intervallen. Die Scheibe zeigt sich dreimal für je 2 Sekunden, dabei jeweils 2 Schüsse.',
    ],
    hinweise: ['Probeschüsse sind nicht erlaubt (C.6.6).', 'Stellung stehend frei, beidhändiges Halten ist erlaubt (C.6.5).'],
  },
  {
    match: /^Police Pistol 2\b/i, ruleRef: 'C.6B', commandSet: 'policePistol', readiness: 'ppZweiGemischt',
    varianten: [{ klasse: 'kurzwaffe', ruleRef: 'C.6B', label: 'Police Pistol 2' }],
    ammo: '60 Patronen, dazu 6 Probeschüsse', target: 'PP-1-Scheibe',
    ablauf: [
      'Station A, 10 m: zweimal 6 Schüsse in 5 Sekunden, stehend frei, ein- oder beidhändig.',
      'Station B, 50 m: 6 Schüsse liegend, 6 kniend oder sitzend, 6 stehend linke Hand am Pfosten links, 6 stehend rechte Hand am Pfosten rechts. Gesamtzeit 3 Minuten.',
      'Station C, 25 m: 6 Schüsse stehend frei, 6 kniend oder sitzend, 6 stehend rechte Hand am Pfosten rechts, 6 stehend linke Hand am Pfosten links. Gesamtzeit 2 Minuten.',
    ],
    hinweise: [
      'Probeschüsse nur auf Station B: 6 Schüsse in 2 Minuten.',
      'Fertigstellung Station A: Waffe mit ausgestreckten Armen auf 45 Grad abgesenkt. Stationen B und C: Waffe geholstert.',
      'Auf den Stationen B und C ist die gesamte Munition am Schützen mitzuführen. Geladen werden darf nur ein Reservemagazin bzw. ein Speedloader mit je 6 Patronen, die restlichen 12 Patronen lose in Tasche, Patronenhalter oder am Gürtel.',
      'Nachladen aus einer Shooter’s Box am Boden ist während der Serie nicht erlaubt.',
      'Beim Nachladen muss die Pistole geholstert sein — Verschluss hinten oder geschlossen und abgeschlagen. Der Revolver wird direkt in die Trommel nachgeladen.',
      'Die Begrenzungslinien rechts und links sind zu beachten.',
    ],
  },
  {
    match: /^Police Pistol 3\b|Carry Gun/i, ruleRef: 'C.6D', commandSet: 'policePistol', readiness: 'abgesenkt45',
    ammo: '30 Patronen, keine Wadcutter', target: 'PP-1-Scheibe',
    ablauf: [
      '20 m: 2 × 5 Schüsse in 100 Sekunden einschließlich eigenständigem Nachladen.',
      '15 m: 2 × 5 Schüsse in Intervallen. Die Scheibe zeigt sich fünfmal für je 2 Sekunden, dabei jeweils 1 Schuss.',
      '10 m: 2 × 5 Schüsse in Intervallen. Die Scheibe zeigt sich dreimal für je 2 Sekunden, dabei höchstens 2 Schüsse je Intervall (2-2-1, 2-1-2 oder 1-2-2).',
    ],
    hinweise: ['Nur serienmäßige, unveränderte Waffen. Mündungsbremsen sind ausdrücklich verboten.'],
  },
  {
    match: /^Police Pistol 4\b|Pocket Gun/i, ruleRef: 'C.6E', commandSet: 'policePistol', readiness: 'abgesenkt45',
    ammo: '30 Patronen, keine Wadcutter', target: 'PP-1-Scheibe',
    ablauf: [
      '15 m: 2 × 5 Schüsse in 100 Sekunden einschließlich eigenständigem Nachladen.',
      '10 m: 2 × 5 Schüsse in Intervallen. Die Scheibe zeigt sich fünfmal für je 2 Sekunden, dabei jeweils 1 Schuss.',
      '7 m: 2 × 5 Schüsse in Intervallen. Die Scheibe zeigt sich dreimal für je 2 Sekunden, dabei höchstens 2 Schüsse je Intervall (2-2-1, 2-1-2 oder 1-2-2).',
    ],
    hinweise: ['Nur serienmäßige, unveränderte Waffen. Mündungsbremsen sind ausdrücklich verboten.'],
  },
  {
    match: /^NPA Service Pistole? \(30M1\)|^NPA Service Pistole? \(A-B/i, ruleRef: 'C.7', commandSet: 'policePistol', readiness: 'npaWaagerecht',
    ammo: '24 Patronen Großkaliber', target: 'zwei NPA-Service-Pistol-Scheiben',
    ablauf: [
      '25 m: 6 Schüsse in 15 Sekunden auf die linke Scheibe.',
      '20 m: 6 Schüsse in 10 Sekunden, davon 3 auf jede Scheibe.',
      '15 m: 6 Schüsse in Intervallen auf die rechte Scheibe. Die Scheibe zeigt sich dreimal für je 3 Sekunden, dabei jeweils 2 Schüsse.',
      '10 m: 6 Schüsse in 6 Sekunden, davon 3 auf jede Scheibe.',
    ],
    hinweise: [],
  },
  {
    match: /^NPA Service Pistole? \(SpCb\)/i, ruleRef: 'C.7C', commandSet: 'policePistol', readiness: 'npaWaagerecht',
    ammo: '24 Patronen Großkaliber', target: 'eine oder zwei NPA-Service-Pistol-Scheiben',
    ablauf: [
      '25 m: 6 Schüsse in 15 Sekunden.',
      '20 m: 6 Schüsse in 10 Sekunden.',
      '15 m: 3 × 2 Schüsse in Intervallen. Die Scheibe zeigt sich dreimal für je 3 Sekunden, dabei jeweils 2 Schüsse.',
      '10 m: 6 Schüsse in 8 Sekunden.',
    ],
    hinweise: [
      'Bei zwei Scheiben: Station 1 und 3 auf die linke, Station 2 und 4 auf die rechte Scheibe.',
      'Weicht von der Kurzwaffenfassung nach C.7 nur auf Station 4 ab: 8 statt 6 Sekunden.',
    ],
  },
  {
    match: /^NPA Service Pistole? \(LAR\)/i, ruleRef: 'C.7C', commandSet: 'policePistol', readiness: 'npaWaagerecht',
    ammo: '24 Patronen Großkaliber', target: 'eine oder zwei NPA-Service-Pistol-Scheiben',
    ablauf: [
      '25 m: 6 Schüsse in 15 Sekunden.',
      '20 m: 6 Schüsse in 10 Sekunden.',
      '15 m: 3 × 2 Schüsse in Intervallen. Die Scheibe zeigt sich dreimal für je 3 Sekunden, dabei jeweils 2 Schüsse.',
      '10 m: 6 Schüsse in 8 Sekunden.',
    ],
    hinweise: ['Weicht von der Kurzwaffenfassung nach C.7 nur auf Station 4 ab: 8 statt 6 Sekunden.'],
  },
  {
    match: /^BDMP 1500/i, ruleRef: 'C.8.2', commandSet: 'ppc1500', readiness: 'geholstert',
    varianten: [
      { klasse: 'kurzwaffe', ruleRef: 'C.8.2', label: 'BDMP 1500 (PPC)' },
      { klasse: 'langwaffe', ruleRef: 'D.37', label: 'BDMP 1500 Carbine',
        hinweise: ['Gleicher Ablauf und gleiche Zeiten wie die Kurzwaffenfassung.',
                   'Zu keinem Zeitpunkt dürfen Waffe, Speedloader oder Magazin mit mehr als sechs Patronen geladen sein.'] },
    ],
    ammo: '150 Schuss auf fünf Matches verteilt', target: 'BDMP-1500-Scheibe je Schütze und Match',
    ablauf: [
      'Match 1: 7 m — 20 Sekunden — nur double action — 12 Schüsse stehend frei. Danach 15 m, 20 Sekunden, 12 Schüsse stehend frei.',
      'Match 2: 25 m — 90 Sekunden — nur double action — 6 kniend frei, 6 stehend linke Hand Pfosten links, 6 stehend rechte Hand Pfosten rechts.',
      'Match 3: 50 m — 165 Sekunden — auch single action — 6 sitzend, 6 liegend, 6 stehend linke Hand Pfosten links, 6 stehend rechte Hand Pfosten rechts.',
      'Match 4: 25 m — 35 Sekunden — nur double action — 12 Schüsse stehend frei, danach Wiederholung.',
      'Match 5, 60 Schuss: Station 1 bei 7 m in 20 s, Station 2 bei 25 m in 90 s, Station 3 bei 50 m in 165 s, Station 4 bei 25 m in 12 s mit 6 Schüssen stehend frei.',
    ],
    hinweise: [
      'Die Reihenfolge der Matches und Stationen ist einzuhalten.',
      '„Double action“ gilt nicht beim Gebrauch halbautomatischer Pistolen.',
      'Ist ein Stand für 7 m nicht zugelassen, darf stattdessen auf 10 m geschossen werden.',
      'Der Veranstalter kann ein Warm-Up von 2:45 Minuten auf 50 m und 1:30 Minuten auf 25 m anbieten; auf Landes- und Deutschen Meisterschaften ist es verpflichtend.',
    ],
  },
  {
    match: /^BDMP 1020/i, ruleRef: 'C.21', commandSet: 'ppc1500', readiness: 'geholstert',
    ammo: 'nach Wettkampfart', target: 'mindestens eine BDMP-1500-Scheibe je Schütze und Match',
    ablauf: [
      'Match 1: 7 m — 20 Sekunden — nur double action — 2 × 6 Schüsse stehend frei. Danach 15 m, 20 Sekunden, 2 × 6 Schüsse stehend frei.',
      'Match 2: 25 m — 90 Sekunden — nur double action — 6 kniend frei, 6 stehend linke Hand Pfosten links, 6 stehend rechte Hand Pfosten rechts.',
      'Match 3: 25 m — 35 Sekunden — nur double action — 2 × 6 Schüsse stehend frei, danach Wiederholung.',
      'Match 4: 25 m — 165 Sekunden — nur double action — 6 sitzend, 6 kniend frei, 6 stehend linke Hand Pfosten links, 6 stehend rechte Hand Pfosten rechts.',
      'Match 5: 25 m — 12 Sekunden — nur double action — 6 Schüsse stehend frei, danach ein zweiter Durchgang mit 6 Schüssen stehend frei.',
    ],
    hinweise: [
      'Die Reihenfolge der Matches und Stationen ist einzuhalten.',
      'Scheibenentfernungen wahlweise 7 m, 15 m oder 25 m mit den Toleranzen nach C.21.',
      'Probeschüsse liegen im Ermessen des Veranstalters.',
      'Die Beobachtung der Wertungsschüsse durch den Schützen ist nicht erlaubt; Fremdbeobachtung und Coaching sind unzulässig.',
      'Es gibt keine anerkannten Waffen- oder Munitionsfehler.',
      'Die Kleinkaliber-Variante DKS 1 – 1020 (C.15A) hat denselben Ablauf; dort wird Match 1 auf 10 m geschossen, die Scheibenentfernungen sind wahlweise 10 m, 15 m oder 25 m. Die Kommandos laufen ebenfalls nach C.8.5.',
    ],
  },
  {
    match: /^DKS 1\s*[–-]\s*1020|^DKS 1020|Dynamisches Kleinkaliberschie(ß|ss)en 1 1020/i,
    ruleRef: 'C.15A', commandSet: 'ppc1500', readiness: 'geholstert',
    varianten: [
      { klasse: 'kkKurzwaffe', ruleRef: 'C.15A',  label: 'DKS 1 – 1020' },
      { klasse: 'kkLangwaffe', ruleRef: 'D.22.A', label: 'DKS 2 – 1020',
        hinweise: ['Gleiche Distanzen und gleiche Zeiten wie die Kurzwaffenfassung.',
                   'Es dürfen nur sechs Patronen ins Magazin geladen werden.',
                   'Scheibe: mindestens eine BDMP 1500 reduziert je Schütze und Match.'] },
    ],
    ammo: 'Kleinkaliber .22 lr', target: 'mindestens eine BDMP-1500-Scheibe je Schütze und Match',
    ablauf: [
      'Match 1: 10 m — 20 Sekunden — nur double action — 2 × 6 Schüsse stehend frei. Danach 15 m, 20 Sekunden, 2 × 6 Schüsse stehend frei.',
      'Match 2: 25 m — 90 Sekunden — nur double action — 6 kniend frei, 6 stehend linke Hand Pfosten links, 6 stehend rechte Hand Pfosten rechts.',
      'Match 3: 25 m — 35 Sekunden — nur double action — 2 × 6 Schüsse stehend frei, danach Wiederholung.',
      'Match 4: 25 m — 165 Sekunden — nur double action — 6 sitzend, 6 kniend frei, 6 stehend linke Hand Pfosten links, 6 stehend rechte Hand Pfosten rechts.',
      'Match 5: 25 m — 12 Sekunden — nur double action — 6 Schüsse stehend frei, danach ein zweiter Durchgang mit 6 Schüssen stehend frei.',
    ],
    hinweise: [
      'Kleinkaliber-Fassung der 1020, durchgeführt in Anlehnung an die Regeln der NASRPC Ireland.',
      'Scheibenentfernung wahlweise 10 m, 15 m oder 25 m mit den Toleranzen nach C.15A.5.',
      'Double Action gilt nicht beim Gebrauch von Selbstladepistolen.',
      'Die Reihenfolge der Matches und Stationen ist einzuhalten.',
      'Stellungen und Fertigstellung nach C.8.4 beziehungsweise C.8.7.',
      'Die Beobachtung der Wertungsschüsse durch den Schützen ist nicht erlaubt; Fremdbeobachtung und Coaching sind unzulässig.',
      'Es gibt keine anerkannten Waffen- oder Munitionsfehler.',
    ],
  },
  {
    match: /^Sports Carbine PP ?2|^Police Pistol 2 \(SpCb\)/i,
    ruleRef: 'D.36', commandSet: 'policePistol', readiness: 'geholstert',
    ammo: 'höchstens sechs Patronen in Waffe, Speedloader oder Magazin',
    target: 'PP-1-Scheibe; auf 10 m und 25 m auf 50 % verkleinert',
    varianten: [{ klasse: 'langwaffe', ruleRef: 'D.36', label: 'Sports Carbine PP2' }],
    ablauf: [
      'Station A, 10 m: zweimal 6 Schuss stehend freihändig in je 7 Sekunden.',
      'Station B, 50 m: 140 Sekunden, auch single action — 6 liegend, 6 kniend, 6 stehend linke Hand Pfosten links, 6 stehend rechte Hand Pfosten rechts.',
      'Station C, 25 m: 90 Sekunden, auch single action — 6 stehend frei, 6 kniend, 6 stehend rechte Hand Pfosten rechts, 6 stehend linke Hand Pfosten links.',
    ],
    hinweise: [
      'Weicht von der Kurzwaffen-PP2 ab: Station A 7 statt 5 Sekunden, Station B 140 statt 180 Sekunden, Station C 90 statt 120 Sekunden. Deshalb ein eigener Satz.',
      'Zu keinem Zeitpunkt dürfen Waffe, Speedloader oder Magazin mit mehr als sechs Patronen geladen sein.',
      'Der Stellungswechsel darf ausschließlich mit leerer Waffe erfolgen: Magazin entfernt und Verschluss offen, beziehungsweise Trommel leer und ausgeschwenkt.',
      'Die Entfernungen können wahlweise in Metern oder Yards geschossen werden; das ist in der Ausschreibung bekanntzugeben.',
    ],
  },
]

/** Findet das Regelwerk zu einem Disziplinnamen. */
export function findDisciplineRules(name) {
  return DISCIPLINE_RULES.find(r => r.match.test(String(name ?? ''))) ?? null
}

/**
 * Erkennt die in einer Phase vorkommenden Stellungen.
 *
 * Der Text wird zuerst in Abschnitte zerlegt — an Zeilenumbrüchen und vor
 * jeder neuen Schusszahl. Sonst verschmelzen „6 Schuss kniend“ und
 * „6 Schuss stehend am Pfosten“ zu einer einzigen, falschen Stellung.
 */
export function detectPositions(text) {
  const abschnitte = String(text ?? '')
    .split(/\n|,\s*(?=\d)|;\s*/)
    .map(a => a.trim().toLowerCase())
    .filter(Boolean)

  const treffer = []
  for (const a of abschnitte) {
    const pfosten = /pfosten/.test(a)
    if (/kniend/.test(a))  treffer.push(pfosten ? 'kniendPfosten' : 'kniendFrei')
    else if (pfosten)      treffer.push('stehendPfosten')
    if (/sitzend/.test(a)) treffer.push('sitzend')
    if (/liegend/.test(a)) treffer.push('liegend')
    if (/stehend frei/.test(a)) treffer.push('stehendFrei')
  }
  return [...new Set(treffer)]
}

/** Auswahl für eigene Disziplinen im Editor. */
export const COMMAND_SET_OPTIONS = [
  { id: 'auto',         label: 'Nach Name erkennen' },
  { id: 'policePistol', label: 'Police Pistol / NPA / SM (C.6.10)' },
  { id: 'ppc1500',      label: 'BDMP 1500 / 1020 (C.8.5)' },
  { id: 'keine',        label: 'Keine Kommandofolge' },
]

function mitStellungen(phasen) {
  return (phasen ?? []).map(p => {
    const quelle = [p.name, p.description, ...(p.roCommands ?? [])].join(' ')
    const stellungen = detectPositions(quelle).map(k => POSITIONS[k]).filter(Boolean)
    return { ...p, positions: stellungen,
             positionChangeNotes: stellungen.length > 1 ? POSITION_CHANGE_NOTES : [] }
  })
}

/**
 * Hängt die Regeltexte an eine Disziplin.
 *
 * Zeiten und Abläufe bleiben unangetastet — die kommen aus der gepflegten
 * Disziplinendatei oder vom Nutzer und sind dort verbindlich.
 *
 * Eine selbst angelegte Disziplin trägt keinen Namen, den die Sportordnung
 * kennt. Damit sie trotzdem die amtlichen Kommandos führen kann, lässt sich
 * die Kommandofolge über `commandSetId` ausdrücklich festlegen; ohne Angabe
 * wird sie wie bisher am Namen erkannt.
 */
export function enrichDiscipline(disziplin) {
  const regeln = findDisciplineRules(disziplin.name)
  const wahl = disziplin.commandSetId ?? 'auto'
  const befehleId = wahl === 'auto' ? regeln?.commandSet : (wahl === 'keine' ? null : wahl)
  const amtlich = befehleId ? COMMAND_SETS[befehleId] ?? null : null
  const befehle = mitEigenenKommandos(amtlich, disziplin.commandTexts)

  return {
    ...disziplin,
    ruleRef:    disziplin.ruleRef ?? regeln?.ruleRef ?? null,
    commandSet: befehle,
    readiness:  READINESS[regeln?.readiness] ?? null,
    ammo:       disziplin.ammo ?? regeln?.ammo ?? null,
    target:     disziplin.target ?? regeln?.target ?? null,
    ablauf:     regeln?.ablauf ?? [],
    hinweise:   regeln?.hinweise ?? [],
    abweichung: regeln?.abweichung ?? null,
    ohneAnsage: disziplin.ohneAnsage ?? regeln?.ohneAnsage ?? false,
    varianten:  disziplin.varianten ?? regeln?.varianten ?? [],
    phases:     mitStellungen(disziplin.phases),
  }
}

/** Die vier Gruppen einer Kommandofolge, in der Reihenfolge auf dem Stand. */
export const KOMMANDO_GRUPPEN = ['vorher', 'start', 'abbruch', 'nachher']

/**
 * Legt eigene Kommandotexte über die amtliche Kommandofolge.
 *
 * Gespeichert werden nur die geänderten Gruppen; was fehlt, kommt weiter aus
 * der Sportordnung. Leere Zeilen fallen weg. Die Kennung `eigen` zeigt der
 * Oberfläche, dass die Folge vom Original abweicht.
 */
export function mitEigenenKommandos(amtlich, eigene) {
  if (!amtlich || !eigene) return amtlich
  const raus = { ...amtlich, eigen: false }
  for (const g of KOMMANDO_GRUPPEN) {
    if (!Array.isArray(eigene[g])) continue
    raus[g] = eigene[g]
      .map(k => ({ de: String(k?.de ?? '').trim(), en: String(k?.en ?? '').trim(), hinweis: String(k?.hinweis ?? '').trim() || undefined }))
      .filter(k => k.de || k.en)
    raus.eigen = true
  }
  return raus
}

/**
 * Leerer Schritt: alle Zeiten 0, keine Töne, kein Halt. Bewusst ohne
 * Vorgaben, damit jeder Wert selbst eingetragen wird und nichts Fremdes
 * unbemerkt mitläuft.
 */
export function leererSchritt(name = 'Schritt 1') {
  return {
    name, description: '', roCommands: [],
    prepMs: 0, durationMs: 0, repetitions: 1, repPauseMs: 0,
    soundAtStart: false, soundAtEnd: false, waitAfter: false,
  }
}

/** Leere Disziplin mit einem ersten, leeren Schritt. */
export function createDiscipline(name = 'Neue Disziplin') {
  return {
    id: `eigen-${Date.now().toString(36)}`,
    name,
    kind: 'sequence',
    eigen: true,
    commandSetId: 'auto',
    description: '',
    phases: [leererSchritt()],
  }
}


/**
 * Disziplinen, die sich vollständig aus der Sportordnung ergeben und in der
 * gepflegten Disziplinendatei nicht enthalten sind.
 *
 * DKS 1 – 1020 ist die Kleinkaliber-Fassung der 1020 (C.15A). Der Ablauf ist
 * derselbe, Match 1 wird jedoch auf 10 m geschossen.
 */
const dks = (name, beschreibung, sekunden, letzte = false) => ({
  name,
  description: beschreibung,
  roCommands: [],
  distance: (name.match(/(\d+)\s*m/) ?? [])[0] ?? null,
  prepMs: 3000,
  durationMs: sekunden * 1000,
  repetitions: 1,
  repPauseMs: 0,
  soundAtStart: true,
  soundAtEnd: true,
  waitAfter: !letzte,
})

const scp = (name, beschreibung, sekunden, letzte = false) => ({
  name, description: beschreibung, roCommands: [],
  distance: (name.match(/(\d+)\s*m/) ?? [])[0] ?? null,
  prepMs: 5000, durationMs: sekunden * 1000, repetitions: 1, repPauseMs: 0,
  soundAtStart: true, soundAtEnd: true, waitAfter: !letzte,
})

export const GENERATED_DISCIPLINES = [
  {
    id: 'sports-carbine-pp2',
    name: 'Sports Carbine PP2 (Langwaffe)',
    kind: 'sequence',
    varianten: [{ klasse: 'langwaffe', ruleRef: 'D.36', label: 'Sports Carbine PP2' }],
    phases: [
      { ...scp('Station A — 10 m, 1. Durchgang', '6 Schuss stehend freihändig.', 7) },
      { ...scp('Station A — 10 m, 2. Durchgang', '6 Schuss stehend freihändig.', 7) },
      { ...scp('Station B — 50 m', '6 Schuss liegend\n6 Schuss kniend\n6 Schuss stehend, linke Hand, Pfosten links\n6 Schuss stehend, rechte Hand, Pfosten rechts\nAuch single action erlaubt.', 140) },
      { ...scp('Station C — 25 m', '6 Schuss stehend frei\n6 Schuss kniend\n6 Schuss stehend, rechte Hand, Pfosten rechts\n6 Schuss stehend, linke Hand, Pfosten links\nAuch single action erlaubt.', 90, true) },
    ],
  },
  {
    id: 'dks-1-1020',
    name: 'DKS 1 – 1020 (Kleinkaliber)',
    kind: 'sequence',
    phases: [
      dks('Match 1 — 10 m', '2 × 6 Schüsse stehend frei, nur double action.', 20),
      dks('Match 1 — 15 m', '2 × 6 Schüsse stehend frei, nur double action.', 20),
      dks('Match 2 — 25 m', '6 Schüsse kniend frei\n6 Schüsse stehend, linke Hand, Pfosten links\n6 Schüsse stehend, rechte Hand, Pfosten rechts', 90),
      dks('Match 3 — 25 m, 1. Durchgang', '2 × 6 Schüsse stehend frei, nur double action.', 35),
      dks('Match 3 — 25 m, 2. Durchgang', '2 × 6 Schüsse stehend frei.', 35),
      dks('Match 4 — 25 m', '6 Schüsse sitzend\n6 Schüsse kniend frei\n6 Schüsse stehend, linke Hand, Pfosten links\n6 Schüsse stehend, rechte Hand, Pfosten rechts', 165),
      dks('Match 5 — 25 m, 1. Durchgang', '6 Schüsse stehend frei, nur double action.', 12),
      dks('Match 5 — 25 m, 2. Durchgang', '6 Schüsse stehend frei, nur double action.', 12, true),
    ],
  },
]
