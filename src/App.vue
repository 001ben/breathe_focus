<template>
  <!-- <DebugAlarms /> -->
  <HelloWorld 
    v-bind:remainingTime="remainingTime()" 
    msg="Breathe. Focus."
    v-bind:timerStarted="timerStarted"
    v-bind:running="timerStarted && !timerPaused"
    @start="start"
    @restart="restart"/>
</template>

<script>
import {ref, reactive, toRefs} from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import DebugAlarms from './components/DebugAlarms.vue'
import {timeStore} from './TimeStore.js'
import moment from 'moment'

var myTimer;

export default {
  name: 'App',
  data() {
    return timeStore.getState()
  },
  components: {
    HelloWorld,
    DebugAlarms
  },
  created() {
    this.autoRefresh()
    if(chrome.browserAction) 
      chrome.browserAction.setBadgeText({text:''});
    if(chrome.notifications)
      chrome.notifications.clear('breathe_focus_global');
  },
  watch: {
    timerStarted() {
      this.autoRefresh()
    }
  },
  methods: {
    start(x) {
      timeStore.startCountdown(x)
      this.autoRefresh()
    },
    autoRefresh() {
      if(this.timerStarted && !this.timerPaused) {
        this.$forceUpdate()
        clearTimeout(myTimer)
        myTimer = setTimeout(this.autoRefresh, 500)
      }
    },
    restart() {
      timeStore.restartCountdown()
    },
    remainingTime() {
      if (!this.timerStarted) return this.previousStartingTime || 25*60
      else if (!this.timerPaused) return Math.round((this.endTime - moment()) / 1000)
      else return Math.floor(this.pausedRemainingTime)
    }
  }
}
</script>
