import { migrateLegacy, restoreState, settle, STORAGE_KEY, transition, type Command, type State } from './timer.ts';
export interface TimerPlatform {
  read(): Promise<unknown>; legacy(): Promise<Record<string, unknown>>; save(state: State): Promise<void>;
  schedule(endsAt: number | null): Promise<void>; badge(state: State): Promise<void>;
  notify(state: State): Promise<void>; clearNotice(): Promise<void>; now(): number;
}
/** One writer serializes popup commands, startup recovery, and alarm delivery. */
export function createController(platform: TimerPlatform) {
  let queue: Promise<unknown> = Promise.resolve();
  async function execute(command: Command): Promise<State> {
    const stored = await platform.read();
    const before = stored === undefined ? migrateLegacy(await platform.legacy()) : restoreState(stored);
    const now = platform.now();
    const settled = settle(before, now);
    const completed = settled !== before;
    const next = transition(settled, command, now);
    // Persist completion before side effects: an alarm replay cannot alert twice.
    await platform.save(next);
    await platform.schedule(next.timer.status === 'running' ? next.timer.endsAt : null);
    await platform.badge(next);
    if (command.type !== 'read') await platform.clearNotice();
    if (completed && !['reset', 'start', 'select'].includes(command.type)) await platform.notify(next);
    return next;
  }
  return { dispatch(command: Command): Promise<State> {
    const result = queue.then(() => execute(command));
    queue = result.catch(() => undefined);
    return result;
  } };
}
export { STORAGE_KEY };
