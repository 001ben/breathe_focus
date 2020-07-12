import {toRefs, reactive, readonly} from 'vue'
import moment from 'moment'

class TimeStore {
  constructor() {
    this.state = reactive(this.init());
    this.updateStateFromStorage();
  }
  
  init() {
    return {
      pausedRemainingTime: null,
      previousStartingTime: 25*60,
      endTime: null,
      timerStarted: false,
      timerPaused: false
    }
  }
  
  updateStateFromStorage() {
    if (chrome.storage) {
      let st = this.state;
      chrome.storage.sync.get(['endTime', 'pausedRemainingTime', 'timerStarted', 'timerPaused', 'previousStartingTime'], function(result) {
        if (result.endTime)
          st.endTime = moment(result.endTime)
        if (result.pausedRemainingTime)
          st.pausedRemainingTime = result.pausedRemainingTime
        if (result.timerStarted)
          st.timerStarted = result.timerStarted
        if (result.timerPaused)
          st.timerPaused = result.timerPaused
        if (result.previousStartingTime)
          st.previousStartingTime = result.previousStartingTime
      });
    }
  }
  
  pushStateToStore() {
    if (chrome.storage) {
      chrome.storage.sync.set({
        timerPaused: this.state.timerPaused,
        timerStarted: this.state.timerStarted,
        endTime: +this.state.endTime,
        pausedRemainingTime: this.state.pausedRemainingTime,
        previousStartingTime: this.state.previousStartingTime
      });
    }
  }
  
  getState() {
    return toRefs(this.state)
  }
  
  startCountdown(starting_time) {
    let targetTime = null;
    let targetPausedTime = null;
    if(!this.state.timerStarted) {
      targetTime = moment().add(starting_time, 's');
      this.state.previousStartingTime = starting_time;
      this.state.timerStarted = true;
    } else {
      if(this.state.timerPaused) {
        targetTime = moment().add(this.state.pausedRemainingTime, 's');
      } else {
        targetPausedTime = (this.state.endTime - moment())/1000;
      }
      this.state.timerPaused = !this.state.timerPaused;
    }
    this.state.endTime = targetTime;
    this.setAlarm(targetTime);
    this.state.pausedRemainingTime = targetPausedTime;
    this.pushStateToStore();
  }
  
  setAlarm(targetTime) {
    console.log(`alarm being set NOW for ${targetTime}!`);
    if(chrome.alarms) {
      // chrome.alarms.create('breathe_focus', {
      //   when: Date.now()+4000
      // })
      chrome.alarms.clear('breathe_focus');
      chrome.storage.sync.set({backgroundAlarmFired: false, postActionFired: false});
      if (targetTime) {
        console.log('alarm *should* be created');
        chrome.alarms.create('breathe_focus', {
          when: +targetTime
        });
        chrome.alarms.get('breathe_focus', alarm => {
          console.log('this alarm was found:', alarm)
        });
      }
    }
  }
  
  restartCountdown() {
    this.state.timerStarted=false;
    this.state.timerPaused=false;
    this.state.endTime=null;
    this.setAlarm(null);
    this.pushStateToStore();
  }
}

export const timeStore = new TimeStore()
