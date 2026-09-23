import { createApp } from 'vue'
import { i18n } from '../src/i18n.js'
import '../src/styles/bedienung.css'
import App from '../src/App.vue'

createApp(App).use(i18n).mount('#app')
