import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadFromStorage, saveToStorage } from '../services/storage.js'
import { DEFAULT_DISCIPLINES, EPP_DISCIPLINE } from '../services/defaultDisciplines.js'

// Version der Standard-Disziplinen — erhöhen wenn sich Defaults ändern
const DEFAULTS_VERSION = 2

export const useDisciplineStore = defineStore('disciplines', () => {
  // Standard-Disziplinen aktualisieren wenn neue Version vorhanden
  const storedVersion = loadFromStorage('DISCIPLINES_VERSION', 0)
  let initialDisciplines = loadFromStorage('DISCIPLINES', null)
  if (!initialDisciplines || storedVersion < DEFAULTS_VERSION) {
    initialDisciplines = { ...DEFAULT_DISCIPLINES }
    saveToStorage('DISCIPLINES', initialDisciplines)
    saveToStorage('DISCIPLINES_VERSION', DEFAULTS_VERSION)
  }

  const disciplines = ref(initialDisciplines)
  const activeDisciplineName = ref(loadFromStorage('ACTIVE_DISCIPLINE', null))

  // EPP ist immer verfügbar, wird nicht in disciplines gespeichert
  const eppDiscipline = EPP_DISCIPLINE

  const disciplineNames = computed(() =>
    Object.keys(disciplines.value).sort((a, b) => a.localeCompare(b, 'de'))
  )

  const activeDiscipline = computed(() => {
    if (!activeDisciplineName.value) return null
    if (activeDisciplineName.value === eppDiscipline.name) return eppDiscipline
    return disciplines.value[activeDisciplineName.value] ?? null
  })

  const isEppActive = computed(() => {
    return activeDiscipline.value?.isEpp === true
  })

  function setActive(name) {
    activeDisciplineName.value = name
    saveToStorage('ACTIVE_DISCIPLINE', name)
  }

  function saveDiscipline(name, stages) {
    disciplines.value[name] = stages
    _persist()
  }

  function deleteDiscipline(name) {
    delete disciplines.value[name]
    if (activeDisciplineName.value === name) {
      activeDisciplineName.value = null
      saveToStorage('ACTIVE_DISCIPLINE', null)
    }
    _persist()
  }

  function renameDiscipline(oldName, newName) {
    if (oldName === newName || !disciplines.value[oldName]) return
    disciplines.value[newName] = disciplines.value[oldName]
    delete disciplines.value[oldName]
    if (activeDisciplineName.value === oldName) {
      activeDisciplineName.value = newName
      saveToStorage('ACTIVE_DISCIPLINE', newName)
    }
    _persist()
  }

  function importDisciplines(incoming) {
    disciplines.value = { ...disciplines.value, ...incoming }
    _persist()
  }

  function resetToDefaults() {
    disciplines.value = { ...DEFAULT_DISCIPLINES }
    _persist()
  }

  function _persist() {
    saveToStorage('DISCIPLINES', disciplines.value)
  }

  return {
    disciplines, activeDisciplineName, activeDiscipline,
    eppDiscipline, disciplineNames, isEppActive,
    setActive, saveDiscipline, deleteDiscipline,
    renameDiscipline, importDisciplines, resetToDefaults
  }
})
