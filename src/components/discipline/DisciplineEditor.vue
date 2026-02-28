<template>
  <div class="space-y-4">
    <!-- Disziplinname -->
    <div>
      <label class="text-xs text-gray-400 uppercase tracking-wider">{{ t('editor.nameLabel') }}</label>
      <input
        v-model="name"
        type="text"
        class="w-full mt-1 bg-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        :placeholder="t('editor.namePlaceholder')"
      />
    </div>

    <!-- Phasenliste -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs text-gray-400 uppercase tracking-wider">{{ t('editor.phases', { n: stages.length }) }}</label>
        <button @click="addPhase" class="text-amber-400 text-sm hover:text-amber-300">{{ t('editor.addPhase') }}</button>
      </div>

      <div class="space-y-2">
        <div v-for="(stage, i) in stages" :key="i">
          <!-- Kollabierte Phase -->
          <div
            v-if="editingIndex !== i"
            class="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <span class="text-gray-600 text-sm w-5 text-center">{{ i + 1 }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-white truncate">{{ stage.name || t('editor.newPhase') }}</div>
              <div class="text-xs text-gray-500">{{ stageMeta(stage) }}</div>
            </div>
            <div class="flex gap-1">
              <button @click="editingIndex = i" class="text-gray-400 hover:text-amber-400 px-2">✏️</button>
              <button @click="moveUp(i)" :disabled="i === 0" class="text-gray-400 hover:text-white px-1 disabled:opacity-30">↑</button>
              <button @click="moveDown(i)" :disabled="i === stages.length - 1" class="text-gray-400 hover:text-white px-1 disabled:opacity-30">↓</button>
              <button @click="removePhase(i)" class="text-gray-400 hover:text-red-400 px-2">🗑</button>
            </div>
          </div>

          <!-- Bearbeitungsformular -->
          <PhaseEditor
            v-else
            :phase="stage"
            @save="savePhase(i, $event)"
            @cancel="editingIndex = null"
          />
        </div>

        <div v-if="stages.length === 0" class="text-gray-600 text-sm text-center py-4">
          {{ t('editor.noPhases') }}
        </div>
      </div>
    </div>

    <!-- Speichern -->
    <div class="flex gap-2 pt-2">
      <button
        @click="save"
        :disabled="!name.trim() || stages.length === 0"
        class="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {{ t('editor.save') }}
      </button>
      <button @click="$emit('cancel')" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 rounded-xl transition-colors">
        {{ t('editor.cancel') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import PhaseEditor from './PhaseEditor.vue'

const { t } = useI18n()

const props = defineProps({
  initialName: { type: String, default: '' },
  initialStages: { type: Array, default: () => [] }
})

const emit = defineEmits(['save', 'cancel'])

const name = ref(props.initialName)
const stages = reactive(props.initialStages.map(s => ({ ...s })))
const editingIndex = ref(null)

function defaultPhase() {
  return { name: '', prepTime: 5, duration: 30, repetitions: 1, pauseDuration: 0, soundAtStart: true, soundAtEnd: true, pauseAfter: false }
}

function addPhase() {
  stages.push(defaultPhase())
  editingIndex.value = stages.length - 1
}

function savePhase(i, data) {
  Object.assign(stages[i], data)
  editingIndex.value = null
}

function removePhase(i) {
  stages.splice(i, 1)
  if (editingIndex.value === i) editingIndex.value = null
}

function moveUp(i) {
  if (i === 0) return
  const tmp = stages[i - 1]
  stages[i - 1] = stages[i]
  stages[i] = tmp
}

function moveDown(i) {
  if (i === stages.length - 1) return
  const tmp = stages[i + 1]
  stages[i + 1] = stages[i]
  stages[i] = tmp
}

function save() {
  if (!name.value.trim() || stages.length === 0) return
  emit('save', { name: name.value.trim(), stages: stages.map(s => ({ ...s })) })
}

function pad(n) { return String(n).padStart(2, '0') }
function fmtSeconds(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${pad(sec)} min` : `${sec}s`
}

function stageMeta(s) {
  const parts = [fmtSeconds(s.duration)]
  if (s.repetitions > 1) parts.push(`${s.repetitions}×`)
  if (s.prepTime) parts.push(`${t('editor.prepShort')} ${s.prepTime}s`)
  return parts.join(' · ')
}
</script>
