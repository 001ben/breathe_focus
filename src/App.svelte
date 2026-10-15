<script lang="ts">
  import { onMount } from 'svelte';
  import { isExtension, send, subscribe } from './client.ts';
  const isPopup = isExtension || new URLSearchParams(location.search).get('view') === 'popup';
  import { formatTime, initialState, parseDuration, PRESETS, remaining, type Command, type Mode } from './timer.ts';
  let session = $state(initialState());
  let now = $state(Date.now());
  let loading = $state(true);
  let busy = $state(false);
  let error = $state('');
  let customOpen = $state(false);
  let customTime = $state('25');
  let inputError = $state('');
  const modes: { id: Mode; label: string }[] = [{ id: 'focus', label: 'Focus' }, { id: 'short', label: 'Short break' }, { id: 'long', label: 'Long break' }];
  const locked = $derived(session.timer.status === 'running' || session.timer.status === 'paused');
  const seconds = $derived(remaining(session, now));
  const progress = $derived(Math.min(1, Math.max(0, seconds / session.duration)));
  const status = $derived(session.timer.status);
  const heading = $derived(status === 'complete' ? 'A moment, well spent.' : status === 'paused' ? 'Take your time.' : session.mode === 'focus' ? 'One thing at a time.' : 'Make room to breathe.');
  const caption = $derived(status === 'complete' ? 'Let your mind wander for a little while.' : status === 'paused' ? 'Your session will be here when you are.' : session.mode === 'focus' ? 'Settle in. The rest can wait.' : 'Step away. Come back a little lighter.');
  const actionLabel = $derived(status === 'running' ? 'Pause session' : status === 'paused' ? 'Resume session' : status === 'complete' ? 'Start again' : session.mode === 'focus' ? 'Begin focus' : 'Begin break');
  const endLabel = $derived(status === 'running' ? new Date(now + seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '');

  async function act(command: Command) {
    if (busy) return;
    busy = true;
    error = '';
    try { session = await send(command); now = Date.now(); }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'; }
    finally { busy = false; loading = false; }
  }
  function primary() {
    void act({ type: status === 'running' ? 'pause' : status === 'paused' ? 'resume' : 'start' });
  }
  function choose(mode: Mode) { customOpen = false; inputError = ''; void act({ type: 'select', mode, duration: PRESETS[mode] }); }
  function applyCustom(event: SubmitEvent) {
    event.preventDefault();
    const duration = parseDuration(customTime);
    if (duration === null) { inputError = 'Use minutes or MM:SS, from 0:01 to 180:00.'; return; }
    inputError = ''; customOpen = false;
    void act({ type: 'select', mode: session.mode, duration });
  }
  function keyboard(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (event.code === 'Space' && !event.repeat && !loading && !busy && !target.closest('button, input, summary, a')) {
      event.preventDefault(); primary();
    }
  }
  onMount(() => {
    document.body.classList.toggle('extension', isPopup);
    const unsubscribe = subscribe((next) => { session = next; now = Date.now(); });
    void act({ type: 'read' });
    let settling = false;
    const tick = setInterval(() => {
      now = Date.now();
      if (session.timer.status === 'running' && seconds <= 0 && !busy && !settling) {
        settling = true;
        void act({ type: 'read' }).finally(() => { settling = false; });
      }
    }, 250);
    const visible = () => { if (!document.hidden) void act({ type: 'read' }); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(tick); unsubscribe(); document.removeEventListener('visibilitychange', visible); };
  });
</script>

<svelte:window onkeydown={keyboard} />
<svelte:head><title>{status === 'running' ? `${formatTime(seconds)} · ` : ''}Breathe Focus</title></svelte:head>

<div class="page">
  {#if !isPopup}<div class="preview-label">A SMALL RITUAL. A CLEARER MIND.</div>{/if}
  <main class="shell" aria-busy={loading}>
    <header>
      <a class="brand" href="./index.html" aria-label="Breathe Focus home">
        <svg class="flower" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 20C3-2 37-2 20 20C42 3 42 37 20 20C37 42 3 42 20 20C-2 37-2 3 20 20Z" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg>
        <span>breathe<span class="brand-dot">.</span><small>FOCUS, GENTLY.</small></span>
      </a>
      <button class="sound-button" aria-label={session.sound ? 'Mute completion chime' : 'Enable completion chime'} aria-pressed={session.sound} disabled={loading || busy} onclick={() => act({ type: 'sound', enabled: !session.sound })} title={session.sound ? 'Completion chime on' : 'Completion chime off'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/>{#if session.sound}<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>{:else}<path d="m16 9 6 6m0-6-6 6"/>{/if}</svg>
      </button>
    </header>

    <div class="intro"><span class="eyebrow">YOUR TIME, RECLAIMED</span><h1>{heading}</h1><p>{caption}</p></div>

    <div class="modes" role="group" aria-label="Session type">
      {#each modes as mode}<button class:chosen={session.mode === mode.id} aria-pressed={session.mode === mode.id} disabled={loading || busy || locked} onclick={() => choose(mode.id)}>{mode.label}</button>{/each}
    </div>

    <div class="timer-wrap" class:paused={status === 'paused'} class:complete={status === 'complete'}>
      <svg class="timer-ring" viewBox="0 0 260 260" aria-hidden="true">
        <circle class="ring-guide" cx="130" cy="130" r="123" />
        <circle class="ring-track" cx="130" cy="130" r="111" />
        <circle class="ring-progress" cx="130" cy="130" r="111" pathLength="100" stroke-dasharray="100" stroke-dashoffset={(1 - progress) * 100} />
        <circle class="ring-inner" cx="130" cy="130" r="98" />
      </svg>
      <div class="timer-content">
        <span class="timer-kicker" aria-live="polite">{loading ? 'SETTLING IN' : status === 'complete' ? 'SESSION COMPLETE' : status === 'paused' ? 'ON A LITTLE PAUSE' : session.mode === 'focus' ? 'TIME TO FOCUS' : 'TIME TO REST'}</span>
        <span class="time" role="timer" aria-label={`${formatTime(seconds)} remaining`} aria-live="off">{formatTime(seconds)}</span>
        <span class="timer-detail">{status === 'complete' ? 'Nicely done.' : status === 'running' ? `Until ${endLabel}` : status === 'paused' ? 'No rush.' : 'A fresh start.'}</span>
      </div>
    </div>

    <div class="duration-area">
      {#if locked}<p class="quiet-note">{status === 'paused' ? 'A breath is part of the process.' : 'Nothing to do but be here.'}</p>
      {:else}<button class="custom-toggle" aria-expanded={customOpen} aria-controls="custom-duration" onclick={() => { customOpen = !customOpen; customTime = formatTime(session.duration); }} disabled={loading || busy}> {session.duration !== PRESETS[session.mode] ? 'Custom session' : 'Make it your own'} <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg></button>{/if}
      {#if customOpen && !locked}<form id="custom-duration" onsubmit={applyCustom}>
        <label for="duration">Duration <span>(minutes or MM:SS)</span></label>
        <div class="custom-row"><input id="duration" bind:value={customTime} aria-invalid={Boolean(inputError)} aria-describedby={inputError ? 'duration-error' : undefined} autocomplete="off" maxlength="6" /><button class="apply" type="submit" disabled={busy}>Set time</button></div>
        {#if inputError}<p class="error" id="duration-error" role="alert">{inputError}</p>{/if}
      </form>{/if}
    </div>

    <div class="actions"><button class="primary" onclick={primary} disabled={loading || busy}>
      {#if status === 'running'}<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="3" height="10" rx="1"/><rect x="10" y="3" width="3" height="10" rx="1"/></svg>{:else}<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="m5 3 8 5-8 5Z"/></svg>{/if}
      {loading ? 'Opening…' : actionLabel}
    </button>
    {#if status === 'complete' && session.mode === 'focus'}<button class="take-break" onclick={() => choose('short')}>Take a 5-minute breather <span aria-hidden="true">↗</span></button>
    {:else if status !== 'idle'}<button class="reset" onclick={() => act({ type: 'reset' })} disabled={busy}>Reset session</button>{:else}<span class="keyboard-hint"><kbd>space</kbd> to begin</span>{/if}</div>
    {#if error}<div class="error recovery" role="alert">{error}<button onclick={() => act({ type: 'read' })} disabled={busy}>Try again</button></div>{/if}
    <footer><span class="little-spark" aria-hidden="true">✳</span><p>A little space for what matters.</p><span class="footer-dot" aria-hidden="true"></span><span class="private">Just for you.</span></footer>
  </main>
  {#if !isPopup}<p class="preview-note">Breathe Focus <span>—</span> a quieter corner of your browser.<br/><small>Browser preview · Keep this page open for completion alerts.</small></p>{/if}
</div>
