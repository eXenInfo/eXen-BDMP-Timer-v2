<template>
  <div class="flex flex-col min-h-screen pb-20 bg-gray-900">

    <!-- Header -->
    <div class="px-4 pt-6 pb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-white">{{ t('disciplines.title') }}</h1>
      <button @click="openNew" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
        {{ t('disciplines.new') }}
      </button>
    </div>

    <!-- Suche -->
    <div class="px-4 mb-4">
      <input
        v-model="search"
        type="text"
        :placeholder="t('disciplines.search')"
        class="w-full bg-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>

    <!-- EPP immer oben -->
    <div class="px-4 mb-2">
      <div class="text-xs uppercase tracking-widest text-gray-600 mb-2">{{ t('disciplines.specialSection') }}</div>
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
      <div class="text-xs uppercase tracking-widest text-gray-600 mb-2 mt-4">{{ t('disciplines.section') }}</div>
      <div class="space-y-2">
        <DisciplineCard
          v-for="n in filteredNames"
          :key="n"
          :name="n"
          :stage-count="disciplineStore.disciplines[n]?.length ?? 0"
          :is-active="disciplineStore.activeDisciplineName === n"
          :is-default="isDefault(n)"
          @select="select(n)"
          @menu="openMenu(n)"
        />
        <div v-if="filteredNames.length === 0" class="text-gray-600 text-sm text-center py-8">
          {{ t('disciplines.notFound') }}
        </div>
      </div>
    </div>

    <!-- Import/Export -->
    <div class="px-4 py-4 border-t border-gray-800 flex gap-2">
      <button @click="doExport" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
        {{ t('disciplines.export') }}
      </button>
      <button @click="showImport = true" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
        {{ t('disciplines.import') }}
      </button>
    </div>

    <!-- Disziplin-Editor Modal -->
    <Teleport to="body">
      <div v-if="showEditor" class="fixed inset-0 bg-black/80 z-50 flex items-end">
        <div class="bg-gray-900 w-full max-h-[90vh] overflow-y-auto rounded-t-2xl p-4">
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-lg font-bold text-white">{{ editorTitle() }}</h2>
            <button @click="closeEditor" class="text-gray-500 hover:text-white text-2xl leading-none">×</button>
          </div>
          <!-- Hinweis bei Standard-Disziplinen -->
          <p v-if="editingName && isDefault(editingName)" class="text-xs text-amber-400/80 mb-3">
            {{ t('disciplines.defaultHint') }}
          </p>
          <div v-else class="mb-3"></div>
          <DisciplineEditor
            :key="editorKey"
            :initial-name="editorInitialName"
            :initial-stages="editorInitialStages"
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
            <h2 class="text-lg font-bold text-white">{{ t('disciplines.importTitle') }}</h2>
            <button @click="showImport = false" class="text-gray-500 hover:text-white text-2xl">×</button>
          </div>
          <p class="text-sm text-gray-400 mb-3">{{ t('disciplines.importHint') }}</p>
          <textarea
            v-model="importText"
            rows="6"
            class="w-full bg-gray-800 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <div v-if="importError" class="text-red-400 text-xs mt-2">{{ importError }}</div>
          <button @click="doImport" class="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">
            {{ t('disciplines.import') }}
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Kontextmenü -->
    <Teleport to="body">
      <div v-if="menuName" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click="menuName = null">
        <div class="bg-gray-800 w-full rounded-t-2xl p-4 space-y-2" @click.stop>
          <div class="text-white font-bold mb-3 truncate">{{ menuName }}</div>

          <!-- Bearbeiten -->
          <button
            @click="editDiscipline(menuName)"
            class="w-full text-left px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
            </svg>
            <span>{{ t('disciplines.menuEdit') }}</span>
            <span v-if="isDefault(menuName)" class="ml-auto text-xs text-gray-500">{{ t('disciplines.menuEditHint') }}</span>
          </button>

          <!-- Als Vorlage verwenden -->
          <button
            @click="useAsTemplate(menuName)"
            class="w-full text-left px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"/>
            </svg>
            <span>{{ t('disciplines.menuTemplate') }}</span>
          </button>

          <!-- Löschen — nur für eigene (nicht Standard-)Disziplinen -->
          <button
            v-if="!isDefault(menuName)"
            @click="deleteDiscipline(menuName)"
            class="w-full text-left px-4 py-3 rounded-xl bg-red-900/30 hover:bg-red-900/60 text-red-400 flex items-center gap-3"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
            </svg>
            <span>{{ t('disciplines.menuDelete') }}</span>
          </button>

          <button @click="menuName = null" class="w-full text-center px-4 py-3 rounded-xl bg-gray-700/50 text-gray-400">
            {{ t('disciplines.cancel') }}
          </button>
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
import { useI18n } from 'vue-i18n'
import { useDisciplineStore } from '../stores/disciplineStore.js'
import { exportDisciplines, importDisciplines } from '../services/importExport.js'
import { DEFAULT_DISCIPLINES } from '../services/defaultDisciplines.js'
import DisciplineCard from '../components/discipline/DisciplineCard.vue'
import DisciplineEditor from '../components/discipline/DisciplineEditor.vue'

const { t } = useI18n()
const disciplineStore = useDisciplineStore()
const router = useRouter()

const search = ref('')
const showEditor = ref(false)
const showImport = ref(false)
const editingName = ref(null)      // gesetzt → Bearbeiten-Modus
const templateFromName = ref(null) // gesetzt → Vorlage-Modus (Original bleibt erhalten)
const menuName = ref(null)
const importText = ref('')
const importError = ref('')
const toast = ref('')
// Schlüssel um DisciplineEditor bei Moduswechsel neu zu initialisieren
const editorKey = ref(0)

const filteredNames = computed(() => {
  const q = search.value.toLowerCase()
  return disciplineStore.disciplineNames.filter(n => n.toLowerCase().includes(q))
})

// --- Editor-Hilfswerte ---
function editorTitle() {
  if (editingName.value) return t('disciplines.editTitle')
  if (templateFromName.value) return t('disciplines.newFromTemplate')
  return t('disciplines.newTitle')
}

const editorInitialName = computed(() => {
  if (editingName.value) return editingName.value
  if (templateFromName.value) return t('disciplines.copyPrefix') + templateFromName.value
  return ''
})

const editorInitialStages = computed(() => {
  const src = editingName.value ?? templateFromName.value
  if (!src) return []
  return (disciplineStore.disciplines[src] ?? []).map(s => ({ ...s }))
})

// --- Aktionen ---
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

function openNew() {
  editingName.value = null
  templateFromName.value = null
  editorKey.value++
  showEditor.value = true
}

function editDiscipline(name) {
  editingName.value = name
  templateFromName.value = null
  menuName.value = null
  editorKey.value++
  showEditor.value = true
}

function useAsTemplate(name) {
  templateFromName.value = name
  editingName.value = null
  menuName.value = null
  editorKey.value++
  showEditor.value = true
}

function deleteDiscipline(name) {
  disciplineStore.deleteDiscipline(name)
  menuName.value = null
  showToast(t('disciplines.toastDeleted'))
}

function closeEditor() {
  showEditor.value = false
  editingName.value = null
  templateFromName.value = null
}

function saveDiscipline({ name, stages }) {
  // Nur umbenennen (alten Eintrag löschen) wenn keine Standard-Disziplin
  if (editingName.value && editingName.value !== name && !isDefault(editingName.value)) {
    disciplineStore.deleteDiscipline(editingName.value)
  }
  disciplineStore.saveDiscipline(name, stages)
  closeEditor()
  showToast(t('disciplines.toastSaved'))
}

async function doExport() {
  await exportDisciplines(disciplineStore.disciplines)
  showToast(t('disciplines.toastCopied'))
}

function doImport() {
  importError.value = ''
  try {
    const data = importDisciplines(importText.value)
    disciplineStore.importDisciplines(data)
    showImport.value = false
    importText.value = ''
    showToast(t('disciplines.toastImported', { n: Object.keys(data).length }))
  } catch (e) {
    importError.value = t('disciplines.importError', { msg: e.message })
  }
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => toast.value = '', 2500)
}
</script>
