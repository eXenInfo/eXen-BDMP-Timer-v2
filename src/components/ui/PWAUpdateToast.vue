<template>
  <Teleport to="body">
    <div v-if="needRefresh" class="toast" role="status">
      <p class="toast-text">{{ t('pwa.updateAvailable') }}</p>
      <div class="toast-knoepfe">
        <button class="toast-spaeter" @click="needRefresh = false">{{ t('pwa.dismiss') }}</button>
        <button class="toast-laden" @click="updateServiceWorker()">{{ t('pwa.reload') }}</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * Meldet eine neue App-Version. Aktualisiert wird erst auf Knopfdruck,
 * damit kein Neuladen mitten in einem Lauf passiert.
 */
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<style scoped>
.toast {
  position: fixed; left: 0.75rem; right: 0.75rem; z-index: 50;
  bottom: calc(0.75rem + env(safe-area-inset-bottom));
  max-width: 40rem; margin: 0 auto;
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  padding: 0.85rem 1rem; border-radius: var(--r-mittel);
  background: var(--f-flaeche-hoch); border: 1px solid var(--f-gruen); color: var(--f-text);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
.toast-text { margin: 0; flex: 1 1 12rem; font-weight: 600; }
.toast-knoepfe { display: flex; gap: 0.75rem; }
.toast-knoepfe button { min-height: 3rem; padding: 0 1rem; border-radius: var(--r-klein); font: inherit; cursor: pointer; }
.toast-spaeter { background: transparent; color: var(--f-gedaempft); border: 1px solid var(--f-rand); }
.toast-laden { background: var(--f-gruen); color: #fff; border: none; font-weight: 700; }
</style>
