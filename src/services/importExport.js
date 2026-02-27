/**
 * Exportiert alle Disziplinen als JSON-String in die Zwischenablage
 */
export async function exportDisciplines(disciplines) {
  const json = JSON.stringify(disciplines, null, 2)
  await navigator.clipboard.writeText(json)
  return json
}

/**
 * Importiert Disziplinen aus einem JSON-String.
 * Gibt das geparste Objekt zurück oder wirft einen Fehler.
 */
export function importDisciplines(jsonString) {
  const parsed = JSON.parse(jsonString)
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Ungültiges Format: Erwartet ein JSON-Objekt.')
  }
  return parsed
}

/**
 * Exportiert eine einzelne Disziplin
 */
export async function exportSingleDiscipline(name, discipline) {
  const json = JSON.stringify({ [name]: discipline }, null, 2)
  await navigator.clipboard.writeText(json)
  return json
}
