<template>
  <div class="flex flex-col content-center p-3">
    <h1 class="flex-auto text-xl text-center leading-tight">{{ msg }}</h1>
    <p class="text-5xl text-green-500 leading-normal" 
      v-bind:class="{
        'text-red-500': remainingTime < 0,
        'text-green-500': remainingTime >= 0 }">
      {{ ("" + Math.floor(remainingTime/60)).padStart(2, '0') }}:{{ ("" + remainingTime % 60).padStart(2, '0') }}
    </p>
    <div class="flex flex-row">
      <button @click="$emit('start')" class="flex-auto border rounded-full px-2 mx-1">{{!running ? "Start" : "Pause"}}</button>
      <button @click="$emit('restart')" class="flex-auto border rounded-full px-2 mx-1">Restart</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String,
    remainingTime: Number,
    running: Boolean
  },
  emits: ['start', 'restart']
}
</script>
