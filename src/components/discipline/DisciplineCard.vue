<template>
  <div
    class="rounded-xl flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 active:scale-[0.98]"
    :class="isActive
      ? 'bg-amber-500/10 ring-1 ring-amber-500/50'
      : 'bg-gray-800 active:bg-gray-700'"
    @click="$emit('select')"
  >
    <!-- Icon -->
    <div
      class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      :class="isEpp ? 'bg-indigo-500/20' : (isActive ? 'bg-amber-500/20' : 'bg-gray-700/80')"
    >
      <svg
        class="w-5 h-5"
        :class="isEpp ? 'text-indigo-400' : (isActive ? 'text-amber-400' : 'text-gray-400')"
        fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"
      >
        <!-- EPP: Parcours/Map icon -->
        <path v-if="isEpp" stroke-linecap="round" stroke-linejoin="round"
          d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"/>
        <!-- Normal: Clock icon -->
        <path v-else stroke-linecap="round" stroke-linejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
      </svg>
    </div>

    <!-- Infos -->
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-sm leading-snug truncate" :class="isActive ? 'text-white' : 'text-gray-200'">
        {{ name }}
      </div>
      <div class="text-xs text-gray-500 mt-0.5">
        {{ isEpp ? '7 Stationen · EPP' : `${stageCount} ${stageCount === 1 ? 'Match' : 'Matches'}` }}
      </div>
    </div>

    <!-- Rechts: Aktiv-Dot oder Menü -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <div v-if="isActive" class="w-2 h-2 rounded-full bg-amber-400"></div>

      <button
        v-if="!isEpp && !isDefault"
        @click.stop="$emit('menu')"
        class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
        </svg>
      </button>
    </div>
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
