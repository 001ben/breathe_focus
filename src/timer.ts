export const STORAGE_KEY = 'breatheFocus.v1';
export const MAX_SECONDS = 180 * 60;
export type Mode = 'focus' | 'short' | 'long';
export const PRESETS: Record<Mode, number> = { focus: 1500, short: 300, long: 900 };
export type Timer = { status: 'idle' } | { status: 'running'; endsAt: number }
  | { status: 'paused'; remaining: number } | { status: 'complete' };
export interface State { version: 1; mode: Mode; duration: number; sound: boolean; timer: Timer }
export type Command = { type: 'start' | 'pause' | 'resume' | 'reset' | 'read' }
  | { type: 'select'; mode: Mode; duration: number } | { type: 'sound'; enabled: boolean };
export function initialState(): State {
  return { version: 1, mode: 'focus', duration: PRESETS.focus, sound: true, timer: { status: 'idle' } };
}
export function validDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_SECONDS;
}
export function parseDuration(input: string): number | null {
  const match = /^(\d{1,3})(?::([0-5]\d))?$/.exec(input.trim());
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2] ?? 0);
  return validDuration(seconds) ? seconds : null;
}
export function formatTime(seconds: number): string {
  const value = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
export function remaining(state: State, now: number): number {
  switch (state.timer.status) {
    case 'running': return Math.max(0, (state.timer.endsAt - now) / 1000);
    case 'paused': return state.timer.remaining;
    case 'complete': return 0;
    case 'idle': return state.duration;
  }
}
export function restoreState(value: unknown): State {
  const fallback = initialState();
  if (!value || typeof value !== 'object') return fallback;
  const data = value as Partial<State>;
  if (data.version !== 1 || !validDuration(data.duration) || !['focus', 'short', 'long'].includes(data.mode ?? '')) return fallback;
  const state: State = { ...fallback, mode: data.mode!, duration: data.duration, sound: typeof data.sound === 'boolean' ? data.sound : true };
  const timer = data.timer;
  if (timer?.status === 'running' && Number.isFinite(timer.endsAt) && timer.endsAt > 0) state.timer = { status: 'running', endsAt: timer.endsAt };
  if (timer?.status === 'paused' && Number.isFinite(timer.remaining) && timer.remaining > 0 && timer.remaining <= state.duration) state.timer = { status: 'paused', remaining: timer.remaining };
  if (timer?.status === 'complete') state.timer = { status: 'complete' };
  return state;
}
/** Import old sync keys once; running timers are device-local from then on. */
export function migrateLegacy(data: Record<string, unknown>): State {
  const state = initialState();
  if (validDuration(data.previousStartingTime)) state.duration = data.previousStartingTime;
  if (data.timerStarted === true) {
    if (data.timerPaused === true && typeof data.pausedRemainingTime === 'number' && data.pausedRemainingTime > 0 && data.pausedRemainingTime <= state.duration) {
      state.timer = { status: 'paused', remaining: data.pausedRemainingTime };
    } else if (data.timerPaused !== true && typeof data.endTime === 'number' && Number.isFinite(data.endTime) && data.endTime > 0) {
      state.timer = { status: 'running', endsAt: data.endTime };
    }
  }
  return state;
}
export function isCommand(value: unknown): value is Command {
  if (!value || typeof value !== 'object') return false;
  const command = value as Record<string, unknown>;
  if (['start', 'pause', 'resume', 'reset', 'read'].includes(String(command.type))) return true;
  if (command.type === 'sound') return typeof command.enabled === 'boolean';
  return command.type === 'select' && ['focus', 'short', 'long'].includes(String(command.mode)) && validDuration(command.duration);
}
/** Pure transitions: a timestamp, never a ticking counter, owns elapsed time. */
export function transition(state: State, command: Command, now: number): State {
  switch (command.type) {
    case 'start': return state.timer.status === 'idle' || state.timer.status === 'complete'
      ? { ...state, timer: { status: 'running', endsAt: now + state.duration * 1000 } } : state;
    case 'pause': return state.timer.status === 'running' && remaining(state, now) > 0
      ? { ...state, timer: { status: 'paused', remaining: remaining(state, now) } } : state;
    case 'resume': return state.timer.status === 'paused'
      ? { ...state, timer: { status: 'running', endsAt: now + state.timer.remaining * 1000 } } : state;
    case 'reset': return { ...state, timer: { status: 'idle' } };
    case 'sound': return { ...state, sound: command.enabled };
    case 'select': return state.timer.status === 'running' || state.timer.status === 'paused'
      ? state : { ...state, mode: command.mode, duration: command.duration, timer: { status: 'idle' } };
    case 'read': return state;
  }
}
export function settle(state: State, now: number): State {
  return state.timer.status === 'running' && state.timer.endsAt <= now
    ? { ...state, timer: { status: 'complete' } } : state;
}
