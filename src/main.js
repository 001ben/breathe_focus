import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import moment from 'moment'

// Object.defineProperty(Vue.prototype, '$moment', { value: moment })
// chrome.storage.sync.get(['remainingTime'], function(result) {
// })
console.log(chrome)

createApp(App).mount('#app')

