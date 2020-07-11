chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({
    pausedRemainingTime: null,
    endTime: null,
    timerStarted: false,
    timerPaused: false});
  
  chrome.alarms.onAlarm.addListener(alarm => {
    console.log(alarm)
    chrome.notifications.create('breathe_focus_global', {
      type: 'basic',
      iconUrl: "images/get_started16.png",
      title: 'Focus Complete!',
      message: 'Nicely done, get some headspace',
      silent: true
    }, _ => {
      (new Audio('sounds/open-up.mp3')).play()
      // (new Audio('sounds/juntos.mp3')).play()
    })
  })
});
