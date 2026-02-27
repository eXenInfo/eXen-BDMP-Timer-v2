<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden">

        <!-- Fortschrittsbalken -->
        <div class="h-1 bg-gray-700">
          <div
            class="h-full bg-amber-400 transition-all duration-500"
            :style="{ width: ((step + 1) / steps.length * 100) + '%' }"
          />
        </div>

        <!-- Inhalt -->
        <div class="p-6 text-center">
          <div class="text-5xl mb-4">{{ currentStep.icon }}</div>
          <h2 class="text-xl font-bold text-white mb-2">{{ currentStep.title }}</h2>
          <p class="text-gray-400 text-sm leading-relaxed">{{ currentStep.text }}</p>
        </div>

        <!-- Navigation -->
        <div class="px-6 pb-6 flex gap-3">
          <button
            v-if="step > 0"
            @click="step--"
            class="flex-1 bg-gray-700 text-gray-300 font-bold py-3 rounded-xl"
          >
            Zurück
          </button>
          <button
            @click="next"
            class="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl"
          >
            {{ isLast ? 'Los gehts!' : 'Weiter' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['done'])

const steps = [
  {
    icon: '📋',
    title: 'Disziplin wählen',
    text: 'Wähle unter "Disziplinen" eine vorhandene Disziplin oder erstelle deine eigene.'
  },
  {
    icon: '⏱️',
    title: 'Timer starten',
    text: 'Drücke "Start" auf dem Timer-Bildschirm. Der Timer führt dich automatisch durch alle Phasen.'
  },
  {
    icon: '🔊',
    title: 'Audiosignale',
    text: 'Akustische Signale zeigen Start und Ende jeder Phase an. Nutze einen externen Lautsprecher für den besten Klang.'
  }
]

const step = ref(0)
const currentStep = computed(() => steps[step.value])
const isLast = computed(() => step.value === steps.length - 1)

function next() {
  if (isLast.value) emit('done')
  else step.value++
}
</script>
