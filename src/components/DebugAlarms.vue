<template>
  <p class="text-red-300 text-lg">{{ currentAlarm }}</p>
  <p class="text-red-300 text-lg">{{ backgroundAlarmFired }}</p>
  <p class="text-red-300 text-lg">{{ postActionFired }}</p>
</template>

<script>
export default {
  name: 'DebugAlarms',
  created() {
    this.refreshAlarm();
    this.refreshNotify();
  },
  data() {
    return {
      currentAlarm: 'none',
      backgroundAlarmFired: false,
      postActionFired: false
    }
  },
  methods: {
    refreshAlarm() {
      var obj = this;
      if(chrome.alarms)
        chrome.alarms.get('breathe_focus', alarm => {
          let n = alarm ? alarm.name : 'none';
          obj.currentAlarm = n;
        });
    },
    refreshNotify() {
      var obj = this;
      if(chrome.storage)
        chrome.storage.sync.get(['backgroundAlarmFired', 'postActionFired'], res => {
          obj.backgroundAlarmFired = res.backgroundAlarmFired;
          obj.postActionFired = res.postActionFired;
        });
    }
  }
}
</script>
