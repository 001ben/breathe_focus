chrome.runtime.onInstalled.addListener(function() {
  
  chrome.alarms.onAlarm.addListener(alarm => {
    console.log(`${alarm.name} was triggered`);
    chrome.notifications.create('breathe_focus_global', {
      type: 'basic',
      iconUrl: "images/get_started16.png",
      title: 'Focus Complete!',
      message: 'Nicely done, get some headspace',
      silent: true
    }, _ => {
      console.log("sound action playing!");
      (new Audio('sounds/open-up.mp3')).play();
      chrome.browserAction.setBadgeText({text:'!'});
      // (new Audio('sounds/juntos.mp3')).play()
    })
  })
  
  chrome.commands.onCommand.addListener(command => {
    console.log('Command:', command);
    // chrome.browserAction
  })
});
