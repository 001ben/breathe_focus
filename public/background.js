chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({remainingTime: 25*60});
});
