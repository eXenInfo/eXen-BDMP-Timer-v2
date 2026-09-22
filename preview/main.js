import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '../src/i18n.js'
import '../src/styles/bedienung.css'
import Preview from './Preview.vue'

createApp(Preview).use(createPinia()).use(i18n).mount('#app')
