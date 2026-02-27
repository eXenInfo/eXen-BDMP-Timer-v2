<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900">

    <!-- Header -->
    <div class="px-4 pt-6 pb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-white">Disziplinen</h1>
      <button @click="showEditor = true" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
        + Neu
      </button>
    </div>

    <!-- Suche -->
    <div class="px-4 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Suchen..."
        class="w-full bg-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>

    <!-- EPP immer oben -->
    <div class="px-4 mb-2">
      <div class="text-xs uppercase tracking-widest text-gray-600 mb-2">Sonder-Disziplinen</div>
      <DisciplineCard
        :name="disciplineStore.eppDiscipline.name"
        :is-active="disciplineStore.activeDisciplineName === disciplineStore.eppDiscipline.name"
        :is-epp="true"
        :is-default="true"
        @select="select(disciplineStore.eppDiscipline.name)"
      />
    </div>

    <!-- Normale Disziplinen -->
    <div class="px-4 flex-1 overflow-y-auto">
      <div class="text-xs uppercase tracking-widest text-gray-600 mb-2 mt-4">Disziplinen</div>
      <div class="space-y-2">
        <DisciplineCard
          v-for="name in filteredNames"
          :key="name"
          :name="name"
          :stage-count="disciplineStore.disciplines[name]?.length ?? 0"
          :is-active="disciplineStore.activeDisciplineName === name"
          :is-default="isDefault(name)"
          @select="select(name)"
          @menu="openMenu(name)"
        />
        <div v-if="filteredNames.length === 0" class="text-gray-600 text-sm text-center py-8">
          Keine Disziplinen gefunden.
        </div>
      </div>
    </div>

    <!-- Import/Export -->
    <div class="px-4 py-4 border-t border-gray-800 flex gap-2">
      <button @click="doExport" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
        Exportieren
      </button>
      <button @click="showImport = true" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
        Importieren
      </button>
    </div>

    <!-- Disziplin-Editor Modal -->
    <Teleport to="body">
      <div v-if="showEditor" class="fixed inset-0 bg-black/80 z-50 flex items-end">
        <div class="bg-gray-900 w-full max-h-[90vh] overflow-y-auto rounded-t-2xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-white">{{ editingName ? 'Bearbeiten' : 'Neue Disziplin' }}</h2>
            <button @click="closeEditor" class="text-gray-500 hover:text-white text-2xl">×</button>
          </div>
          <DisciplineEditor
            :initial-name="editingName ?? ''"
            :initial-stages="editingName ? [...(disciplineStore.disciplines[editingName] ?? [])] : []"
            @save="saveDiscipline"
            @cancel="closeEditor"
          />
        </div>
      </div>
    </Teleport>

    <!-- Import Modal -->
    <Teleport to="body">
      <div v-if="showImport" class="fixed inset-0 bg-black/80 z-50 flex items-end">
        <div class="bg-gray-900 w-full rounded-t-2xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-white">Importieren</h2>
            <button @click="showImport = false" class="text-gray-500 hover:text-white text-2xl">×</button>
          </div>
          <p class="text-sm text-gray-400 mb-3">Füge den exportierten JSON-Text ein:</p>
          <textarea
            v-model="importText"
            rows="6"
            class="w-full bg-gray-800 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <div v-if="importError" class="text-red-400 text-xs mt-2">{{ importError }}</div>
          <button @click="doImport" class="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">
            Importieren
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Kontextmenü -->
    <Teleport to="body">
      <div v-if="menuName" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click="menuName = null">
        <div class="bg-gray-800 w-full rounded-t-2xl p-4 space-y-2" @click.stop>
          <div class="text-white font-bold mb-3 truncate">{{ menuName }}</div>
          <button @click="editDiscipline(menuName)" class="w-full text-left px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white">✏️ Bearbeiten</button>
          <button @click="deleteDiscipline(menuName)" class="w-full text-left px-4 py-3 rounded-xl bg-red-900/50 hover:bg-red-900 text-red-400">🗑 Löschen</button>
          <button @click="menuName = null" class="w-full text-center px-4 py-3 rounded-xl bg-gray-700 text-gray-400 mt-2">Abbrechen</button>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <div
        v-if="toast"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50"
      >
        {{ toast }}
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisciplineStore } from '../stores/disciplineStore.js'
import { exportDisciplines, importDisciplines } from '../services/importExport.js'
import { DEFAULT_DISCIPLINES } from '../services/defaultDisciplines.js'
import DisciplineCard from '../components/discipline/DisciplineCard.vue'
import DisciplineEditor from '../components/discipline/DisciplineEditor.vue'

const disciplineStore = useDisciplineStore()
const router = useRouter()

const search = ref('')
const showEditor = ref(false)
const showImport = ref(false)
const editingName = ref(null)
const menuName = ref(null)
const importText = ref('')
const importError = ref('')
const toast = ref('')

const filteredNames = computed(() => {
  const q = search.value.toLowerCase()
  return disciplineStore.disciplineNames.filter(n => n.toLowerCase().includes(q))
})

function isDefault(name) {
  return Object.keys(DEFAULT_DISCIPLINES).includes(name)
}

function select(name) {
  disciplineStore.setActive(name)
  router.push('/timer')
}

function openMenu(name) {
  menuName.value = name
}

function editDiscipline(name) {
  editingName.value = name
  menuName.value = null
  showEditor.value = true
}

function deleteDiscipline(name) {
  disciplineStore.deleteDiscipline(name)
  menuName.value = null
  showToast('Disziplin gelöscht')
}

function closeEditor() {
  showEditor.value = false
  editingName.value = null
}

function saveDiscipline({ name, stages }) {
  if (editingName.value && editingName.value !== name) {
    disciplineStore.deleteDiscipline(editingName.value)
  }
  disciplineStore.saveDiscipline(name, stages)
  closeEditor()
  showToast('Gespeichert')
}

async function doExport() {
  await exportDisciplines(disciplineStore.disciplines)
  showToast('In Zwischenablage kopiert')
}

function doImport() {
  importError.value = ''
  try {
    const data = importDisciplines(importText.value)
    disciplineStore.importDisciplines(data)
    showImport.value = false
    importText.value = ''
    showToast(`${Object.keys(data).length} Disziplin(en) importiert`)
  } catch (e) {
    importError.value = 'Fehler: ' + e.message
  }
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => toast.value = '', 2500)
}
</script>
