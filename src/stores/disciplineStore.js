import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadFromStorage, saveToStorage } from '../services/storage.js'
import { DEFAULT_DISCIPLINES, EPP_DISCIPLINE } from '../services/defaultDisciplines.js'

export const useDisciplineStore = defineStore('disciplines', () => {
  // Alle Disziplinen: { name: stages[] } für normale, EPP separat als { name: eppObject }
  const disciplines = ref(loadFromStorage('DISCIPLINES', { ...DEFAULT_DISCIPLINES }))
  const activeDisciplineName = ref(loadFromStorage('ACTIVE_DISCIPLINE', null))

  // EPP ist immer verfügbar, wird nicht in disciplines gespeichert
  const eppDiscipline = EPP_DISCIPLINE

  const disciplineNames = computed(() => Object.keys(disciplines.value))

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
