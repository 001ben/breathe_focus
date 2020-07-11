<template>
  <div class="flex flex-col p-6">
    <h1 class="flex-auto text-xl leading-tight">{{ msg }}</h1>
    <p class="text-5xl text-green-500 leading-normal">{{ ("" + Math.floor(remainingTime/60)).padStart(2, '0') }}:{{ ("" + remainingTime % 60).padStart(2, '0') }}</p>
    <div class="flex-row p-2">
    <button class="border rounded-full px-2 mx-1">Start</button>
    <button class="border rounded-full px-2 mx-1">Stop</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String,
    remainingTime: Number
  }
}
</script>
