<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex safe-bottom">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 transition-colors"
      activeClass="text-amber-400"
    >
      <span class="text-2xl leading-none">{{ item.icon }}</span>
      <span class="text-xs font-medium">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
const items = [
  { to: '/timer',       icon: '⏱',  label: 'Timer' },
  { to: '/disciplines', icon: '📋',  label: 'Disziplinen' },
  { to: '/settings',    icon: '⚙️',  label: 'Einstellungen' },
  { to: '/help',        icon: '❓',  label: 'Hilfe' }
]
</script>

<style scoped>
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
