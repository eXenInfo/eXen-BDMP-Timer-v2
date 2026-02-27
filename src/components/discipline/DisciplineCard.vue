<template>
  <div
    class="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer active:bg-gray-700 transition-colors"
    :class="{ 'ring-2 ring-amber-400': isActive }"
    @click="$emit('select')"
  >
    <!-- Icon -->
    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
         :class="isEpp ? 'bg-indigo-900' : 'bg-gray-700'">
      <span class="text-xl">{{ isEpp ? '🎯' : '⏱️' }}</span>
    </div>

    <!-- Infos -->
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-white truncate">{{ name }}</div>
      <div class="text-xs text-gray-400 mt-0.5">
        {{ isEpp ? '7 Stationen · EPP' : `${stageCount} Phase${stageCount !== 1 ? 'n' : ''}` }}
      </div>
    </div>

    <!-- Aktiv Badge -->
    <div v-if="isActive" class="text-amber-400 text-xs font-bold flex-shrink-0">Aktiv</div>

    <!-- Aktions-Menü -->
    <button
      v-if="!isEpp && !isDefault"
      @click.stop="$emit('menu')"
      class="text-gray-500 hover:text-gray-300 px-1 flex-shrink-0"
    >
      ···
    </button>
  </div>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  stageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  isEpp: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false }
})

defineEmits(['select', 'menu'])
</script>
