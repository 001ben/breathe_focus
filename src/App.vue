<template>
  <HelloWorld v-bind:remainingTime="remainingTime" msg="Breathe. Focus." />
</template>

<script>
import {ref, reactive, toRefs} from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import {timeStore} from './TimeStore.js'

export default {
  name: 'App',
  data() {
    return timeStore.getState()
  },
  mounted() {
    timeStore.startCountdown()
  },
  components: {
    HelloWorld
  }
}
</script>
