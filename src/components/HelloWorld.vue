<template>
  <div class="flex flex-col items-center p-3">
    <h1 class="flex-auto text-xl text-center leading-tight">{{ msg }}</h1>
    <p class="text-3xl font-bold leading-normal mb-2" 
      v-bind:class="{
        'text-red-500': remainingTime < 0,
        'text-green-500': remainingTime >= 0 
      }"
      v-if="timerStarted">
      {{ remainingTimeText() }}
    </p>
    <div class="flex flex-row" v-if="!timerStarted">
      <form ref="timeEntry" @submit.prevent="startSubmit">
        <input ref="timeinput" class="appearance-none font-bold text-center text-blue-500 text-3xl mb-2 w-20" id="time" v-bind:value="remainingTimeText()" type="text" name="time">
      </form>
      <div class="flex flex-col">
        <button @click="setTime('25:00')" class="border text-xs rounded-full ml-2 px-1">25m</button>
        <button @click="setTime('5:00')" class="border text-xs rounded-full ml-2 px-1">5m</button>
      </div>
    </div>
    <!-- <div class="items-center m-3" v-if"!running"> -->
    <!-- </div> -->
    <div class="flex flex-row">
      <button @click="startSubmit" class="flex-auto border rounded-full px-2 mx-1">{{!running ? "Start" : "Pause"}}</button>
      <button @click="$emit('restart')" class="flex-auto border rounded-full px-2 mx-1">Restart</button>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
export default {
  name: 'HelloWorld',
  props: {
    msg: String,
    remainingTime: Number,
    timerStarted: Boolean,
    running: Boolean
  },
  methods: {
    startSubmit() {
      if(!this.timerStarted) {
        let match = /^(\d{1,3})(?::(\d{1,2}))?$/.exec(this.$refs.timeinput.value)
        if(match) {
          let totalSecs = parseInt(match[1])*60 + parseInt(match[2]||"0")
          this.$emit('start', totalSecs)
        } else {
          window.alert('please enter MM:SS or just SS format')
        }
      } else {
          this.$emit('start', this.remainingTime)
      }
    },
    remainingTimeText() {
      let prefix = this.remainingTime >= 0 ? "" : "-"
      let timeval = Math.abs(this.remainingTime)
      return prefix + ("" + Math.floor(timeval/60)).padStart(2, '0') + ":" + ("" + timeval % 60).padStart(2, '0');
    },
    setTime(val) {
      this.$refs.timeinput.value = val
    }
  },
  emits: ['start', 'restart']
}
</script>
