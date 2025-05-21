const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// Function to check if an offscreen document is currently active
async function hasOffscreenDocument(path = OFFSCREEN_DOCUMENT_PATH) {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(path)]
  });
  return contexts.length > 0;
}

// Function to play audio using the offscreen document
let creatingOffscreenDocument; // Prevent multiple creation attempts
async function playAudioOffscreen({ sound }) {
  if (await hasOffscreenDocument()) {
    chrome.runtime.sendMessage({ action: 'playSound', sound });
    return;
  }

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument; // Wait for the existing creation attempt to finish
  } else {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Playing notification sounds',
    });
    await creatingOffscreenDocument;
    creatingOffscreenDocument = null; // Reset the guard
  }
  // Send message to offscreen document to play the sound
  // This might need a slight delay if the document was just created
  // However, runtime.sendMessage should queue if the receiver isn't ready yet.
  chrome.runtime.sendMessage({ action: 'playSound', sound });
}

chrome.alarms.onAlarm.addListener(async alarm => {
  console.log(`${alarm.name} was triggered`);
  chrome.storage.sync.set({backgroundAlarmFired: true});
  console.log("sound action playing!");
  await playAudioOffscreen({ sound: 'sounds/double-open.mp3' });
  chrome.action.setBadgeText({text:'!'});
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
