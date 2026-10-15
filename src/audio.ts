const chime = new Audio(chrome.runtime.getURL('sounds/double-open.mp3'));
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || message?.target !== 'audio' || message?.type !== 'play') return false;
  chime.currentTime = 0;
  void chime.play().then(() => respond({ ok: true }), () => respond({ ok: false }));
  // AUDIO_PLAYBACK expires this document after 30 seconds of silence.
  return true;
});
