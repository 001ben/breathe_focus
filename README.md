# Breathe Focus

A small Chrome extension for focused work and restorative breaks. Rebuilt with Svelte 5 runes, strict TypeScript, Vite 8, and Manifest V3.

## Use it

Choose Focus (25 minutes), Short break (5), or Long break (15). “Make it your own” accepts minutes or MM:SS, from one second to three hours. Start, pause, resume, or reset; Space also starts/pauses when focus is outside an interactive control. A completed session offers a short break. The sound button toggles the original bundled double-knock chime.

The popup can close while a session runs. A service worker owns state and Chrome's alarm; timestamps keep the countdown accurate across popup closure, worker suspension, and browser restart. Chrome may deliver alarms late during sleep or suspension; the timer completes when Chrome next runs. Notification display depends on browser and OS notification settings. No website blocking is included.

## Develop and install

Node 24+ and npm:

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run build
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/`. The build emits all scripts, styles, icons and audio locally. No development server is needed by the extension. Reload it after rebuilding. The keyboard shortcut is Ctrl+Shift+J if available; configure conflicts at `chrome://extensions/shortcuts`.

`npm run dev` serves an interactive browser preview. `npm run preview` serves the production build. Add `?view=popup` to inspect the compact popup layout. Preview uses the same domain/controller with localStorage instead of extension APIs; keep its page open for completion. A preview does **not** verify service-worker wakeups, native notifications, or offscreen audio.

## Privacy and security

No accounts, telemetry, remote code, remote fonts, requests, host access, tab access, or content scripts. Permissions are storage (local timer), alarms (completion), notifications (completion notice), and offscreen (play the existing audio without a background tab). CSP blocks network connections and dynamic script evaluation; inline styles support Svelte's SVG progress attribute. Scripts load only from the extension.

The worker accepts validated timer messages only from its own popup/options page. A serial command queue prevents two popups or an alarm racing over state. Completion is persisted before alerts to prevent replay; an OS crash between persistence and delivery can lose that alert. Timers live in local storage instead of syncing active countdowns across devices. On an in-place update with the same extension ID, old sync timer keys are imported once; a fresh unpacked installation has its own ID and cannot access a store installation's data. The old sync keys remain untouched.

Pinned dependencies and `package-lock.json` replace the old Yarn lockfile. Run `npm audit` for the current dependency-advisory result. An audit result is not a guarantee of security. CI checks types, behavioral tests, the production package, and known dependency vulnerabilities.

## Architecture

- `src/timer.ts`: validated data, legacy migration, timestamp arithmetic, pure state transitions.
- `src/controller.ts`: serialized persistence and timer effects, tested with a simulated clock.
- `src/background.ts`: Chrome alarms, notifications, badge, trusted messaging and worker recovery.
- `src/App.svelte`: accessible popup; Svelte 5 `$state`/`$derived`, scoped workflow, responsive CSS.
- `src/audio.ts`: short-lived offscreen audio document.

## Release verification

Automated checks cover elapsed-time accuracy, pause/resume, invalid input, old-state migration, duplicated commands/alarms, worker reconstruction, storage failure recovery, package assets, and CSP. Before a store release, load `dist/` into Chrome and verify popup-close completion, OS sound/notification delivery, restart recovery, and an in-place upgrade from 0.0.7. Browser preview alone cannot prove these.

Publishing an update to the Chrome Web Store and merging a PR are separate release steps. Existing update PRs based on the old Vue/Yarn tree should be reviewed for closure after this replacement merges.
