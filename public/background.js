chrome.alarms.onAlarm.addListener(alarm => {
  console.log(`${alarm.name} was triggered`);
  chrome.storage.sync.set({backgroundAlarmFired: true});
  console.log("sound action playing!");
  (new Audio('sounds/double-open.mp3')).play();
  chrome.browserAction.setBadgeText({text:'!'});
  chrome.notifications.create('breathe_focus_global', {
    type: 'basic',
    iconUrl: "images/flower-icons-for-free128.png",
    title: 'Focus Complete!',
    message: 'Nicely done, get some headspace',
    silent: false
  }, _ => {
    chrome.storage.sync.set({postActionFired: true});
  });
});

chrome.commands.onCommand.addListener(command => {
  console.log('Command:', command);
  // chrome.browserAction
});
