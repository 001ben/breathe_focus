<template>
  <HelloWorld 
    v-bind:remainingTime="remainingTime()" 
    msg="Breathe. Focus."
    v-bind:running="timerStarted && !timerPaused"
    @start="start()"
    @restart="restart()"/>
</template>

<script>
import {ref, reactive, toRefs} from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import {timeStore} from './TimeStore.js'
import moment from 'moment'

var myTimer;

export default {
  name: 'App',
  data() {
    return timeStore.getState()
  },
  components: {
    HelloWorld
  },
  created() {
    this.autoRefresh()
  },
  watch: {
    timerStarted() {
      this.autoRefresh()
    }
  },
  methods: {
    start() {
      timeStore.startCountdown()
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
      if (!this.timerStarted) return 25*60 
      else if (!this.timerPaused) return Math.floor((this.endTime - moment()) / 1000)
      else return Math.floor(this.pausedRemainingTime)
    }
  }
}
</script>
