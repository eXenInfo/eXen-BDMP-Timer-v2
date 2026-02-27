import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/timer' },
  { path: '/timer', component: () => import('./views/TimerView.vue') },
  { path: '/disciplines', component: () => import('./views/DisciplinesView.vue') },
  { path: '/settings', component: () => import('./views/SettingsView.vue') },
  { path: '/help', component: () => import('./views/HelpView.vue') }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
