import { createController, STORAGE_KEY } from './controller.ts';
import { restoreState, type Command, type State } from './timer.ts';
export const isExtension = typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
const subscribers = new Set<(state: State) => void>();
// Preview uses the same timer domain, without pretending to test extension APIs.
const demo = isExtension ? null : createController({
  now: () => Date.now(),
  read: async () => { const raw = localStorage.getItem(STORAGE_KEY); try { return raw ? JSON.parse(raw) : undefined; } catch { return undefined; } },
  legacy: async () => ({}),
  save: async (state) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); subscribers.forEach((listener) => listener(state)); },
  schedule: async () => {}, badge: async () => {}, clearNotice: async () => {},
  notify: async (state) => { if (state.sound) { try { await new Audio('./sounds/double-open.mp3').play(); } catch { /* Autoplay may be blocked in preview. */ } } },
});
export async function send(command: Command): Promise<State> {
  if (demo) return demo.dispatch(command);
  const result = await chrome.runtime.sendMessage({ target: 'timer', command });
  if (!result?.ok) throw new Error(result?.error ?? 'Could not reach the timer. Reopen Breathe Focus and try again.');
  return restoreState(result.state);
}
export function subscribe(listener: (state: State) => void): () => void {
  subscribers.add(listener);
  const changed = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes[STORAGE_KEY]) listener(restoreState(changes[STORAGE_KEY].newValue));
  };
  const storage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) void send({ type: 'read' }).then(listener).catch(console.error); };
  if (isExtension) chrome.storage.onChanged.addListener(changed);
  else window.addEventListener('storage', storage);
  return () => { subscribers.delete(listener); if (isExtension) chrome.storage.onChanged.removeListener(changed); else window.removeEventListener('storage', storage); };
}
