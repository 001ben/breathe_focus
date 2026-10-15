import { createController, STORAGE_KEY } from './controller.ts';
import { isCommand, type State } from './timer.ts';
const ALARM = 'breathe_focus';
const NOTICE = 'breathe_focus_global';
async function playChime() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [chrome.runtime.getURL('offscreen.html')] });
  if (!contexts.length) await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK], justification: 'Play the bundled completion chime after a focus session.' });
  await chrome.runtime.sendMessage({ target: 'audio', type: 'play' });
}
const controller = createController({
  now: () => Date.now(),
  read: async () => (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY],
  legacy: () => chrome.storage.sync.get(['endTime', 'pausedRemainingTime', 'timerStarted', 'timerPaused', 'previousStartingTime']),
  save: (state) => chrome.storage.local.set({ [STORAGE_KEY]: state }),
  async schedule(endsAt) {
    if (endsAt === null) { await chrome.alarms.clear(ALARM); return; }
    const alarm = await chrome.alarms.get(ALARM);
    if (!alarm || alarm.scheduledTime !== endsAt) await chrome.alarms.create(ALARM, { when: endsAt });
  },
  async badge(state) {
    await chrome.action.setBadgeBackgroundColor({ color: '#254D3D' });
    await chrome.action.setBadgeText({ text: ({ idle: '', running: '•', paused: 'Ⅱ', complete: '✓' })[state.timer.status] });
    await chrome.action.setTitle({ title: `Breathe Focus · ${state.timer.status}` });
  },
  async notify(state: State) {
    // A blocked notification or audio device must not undo a completed timer.
    await Promise.allSettled([
      chrome.notifications.create(NOTICE, { type: 'basic', iconUrl: 'images/flower-icons-for-free128.png', title: state.mode === 'focus' ? 'A little focus, well spent.' : 'Ready when you are.', message: state.mode === 'focus' ? 'Your session is complete. Take a breath and enjoy a break.' : 'Your break is complete. Ease back into what matters.', silent: true }),
      ...(state.sound ? [playChime()] : []),
    ]);
  },
  clearNotice: async () => { await chrome.notifications.clear(NOTICE); },
});
function recover() { void controller.dispatch({ type: 'read' }).catch(console.error); }
chrome.runtime.onInstalled.addListener(recover);
chrome.runtime.onStartup.addListener(recover);
chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === ALARM) recover(); });
chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('index.html')) return false;
  if (!message || typeof message !== 'object' || !('target' in message) || message.target !== 'timer') return false;
  if (!('command' in message) || !isCommand(message.command)) { respond({ ok: false, error: 'Invalid timer command.' }); return false; }
  void controller.dispatch(message.command).then(
    (state) => respond({ ok: true, state }),
    () => respond({ ok: false, error: 'Could not save your timer. Please try again.' }),
  );
  return true;
});
// Register listeners synchronously, then restore any alarm lost on worker restart.
void chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).then(recover).catch(console.error);
