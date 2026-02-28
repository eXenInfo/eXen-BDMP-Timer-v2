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
            {{ t('onboarding.back') }}
          </button>
          <button
            @click="next"
            class="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl"
          >
            {{ isLast ? t('onboarding.start') : t('onboarding.next') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['done'])

const steps = computed(() => [
  {
    icon: '📋',
    title: t('onboarding.step1Title'),
    text: t('onboarding.step1Text')
  },
  {
    icon: '⏱️',
    title: t('onboarding.step2Title'),
    text: t('onboarding.step2Text')
  },
  {
    icon: '🔊',
    title: t('onboarding.step3Title'),
    text: t('onboarding.step3Text')
  }
])

const step = ref(0)
const currentStep = computed(() => steps.value[step.value])
const isLast = computed(() => step.value === steps.value.length - 1)

function next() {
  if (isLast.value) emit('done')
  else step.value++
}
</script>
