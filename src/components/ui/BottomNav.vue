<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800/80 flex safe-bottom">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 transition-colors"
      activeClass="text-amber-400"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path
          v-for="(d, i) in item.paths"
          :key="i"
          stroke-linecap="round"
          stroke-linejoin="round"
          :d="d"
        />
      </svg>
      <span class="text-xs font-medium">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
const items = [
  {
    to: '/timer',
    label: 'Timer',
    paths: ['M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
  },
  {
    to: '/disciplines',
    label: 'Disziplinen',
    paths: ['M3.75 12h16.5m-16.5 5.25h16.5m-16.5-10.5h16.5'],
  },
  {
    to: '/settings',
    label: 'Einstellungen',
    paths: ['M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75'],
  },
  {
    to: '/help',
    label: 'Hilfe',
    paths: [
      'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'M12 17.25h.008v.008H12v-.008Z',
    ],
  },
]
</script>

<style scoped>
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
