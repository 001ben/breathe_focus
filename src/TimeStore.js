import {toRefs, reactive, readonly} from 'vue'

class TimeStore {
  constructor() {
    this.state = reactive(this.init())
    this.updateStateFromStorage()
    console.log(`on construction: ${this.state.remainingTime}`)
  }
  
  init() {
    return {
      remainingTime: 25*60,
      timerStarted: false
    }
  }
  
  updateStateFromStorage() {
    if (chrome.storage) {
      let t1 = new Date()
      let st = this.state
      chrome.storage.sync.get(['remainingTime'], function(result) {
        st.remainingTime = result.remainingTime
        console.log(this.state)
        console.log(`initial storage time sync: ${(new Date()) - t1}`)
      })
    }
  }
  
  getState() {
    return toRefs(this.state)
  }
  
  countdown1() {
    if (this.state.timerStarted) {
      let newtime = this.state.remainingTime - 1
      if (chrome.storage) {
        chrome.storage.sync.set({remainingTime: newtime})
      }
      this.state.remainingTime = newtime
      setTimeout(_ => this.countdown1(), 1000)
    }
  }
  
  startCountdown() {
    this.state.timerStarted = true
    setTimeout(_ => this.countdown1(), 1000)
  }

  restartCountdown() {
    this.state.remainingTime = 25*60
  }
}

export const timeStore = new TimeStore()
