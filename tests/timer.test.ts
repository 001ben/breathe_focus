import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, isCommand, migrateLegacy, parseDuration, formatTime, remaining, restoreState, settle, transition } from '../src/timer.ts';

test('custom durations are unambiguous and bounded', () => {
  for (const [input, expected] of [['25',1500],[' 5:30 ',330],['0:01',1],['180:00',10800]] as const) assert.equal(parseDuration(input),expected);
  for (const input of ['0','0:00','181','5:99','1:5','-1','1.5','Infinity','<script>','999:59','1e2']) assert.equal(parseDuration(input),null,input);
});
test('pause and resume preserve subsecond time across popup lifetimes', () => {
  const started = transition(initialState(),{type:'start'},1000);
  const paused = transition(started,{type:'pause'},2234);
  assert.equal(remaining(paused,1e7),1498.766);
  const resumed = transition(restoreState(JSON.parse(JSON.stringify(paused))),{type:'resume'},1e7);
  assert.equal(remaining(resumed,1e7+500),1498.266);
});
test('elapsed timers complete once and never display negative time', () => {
  const started = transition(initialState(),{type:'start'},1000);
  const complete = settle(started,1501000);
  assert.equal(complete.timer.status,'complete');
  assert.equal(settle(complete,1e8),complete);
  assert.equal(remaining(started,1e8),0);
  assert.equal(formatTime(-30),'00:00');
  assert.equal(formatTime(0.01),'00:01');
});
test('running and paused sessions cannot be silently replaced by a preset', () => {
  const running = transition(initialState(),{type:'start'},0);
  assert.equal(transition(running,{type:'select',mode:'short',duration:300},100),running);
  const paused = transition(running,{type:'pause'},100);
  assert.equal(transition(paused,{type:'select',mode:'short',duration:300},100),paused);
  assert.equal(transition(transition(paused,{type:'reset'},100),{type:'select',mode:'short',duration:300},100).duration,300);
});
test('legacy storage migration respects false flags and preserves valid sessions', () => {
  assert.equal(migrateLegacy({timerStarted:false,timerPaused:true,previousStartingTime:300,endTime:999}).timer.status,'idle');
  assert.deepEqual(migrateLegacy({timerStarted:true,timerPaused:true,pausedRemainingTime:3.5}).timer,{status:'paused',remaining:3.5});
  assert.deepEqual(migrateLegacy({timerStarted:true,timerPaused:false,endTime:2000}).timer,{status:'running',endsAt:2000});
  assert.equal(migrateLegacy({previousStartingTime:-100}).duration,1500);
});
test('invalid persisted data and untrusted command payloads fail safely', () => {
  for (const raw of [null,{}, {version:1,mode:'focus',duration:Infinity}]) assert.deepEqual(restoreState(raw),initialState());
  assert.equal(restoreState({...initialState(),timer:{status:'running',endsAt:'tomorrow'}}).timer.status,'idle');
  assert.equal(restoreState({...initialState(),timer:{status:'paused',remaining:2000}}).timer.status,'idle');
  for (const raw of [null,{type:'select',mode:'focus',duration:0},{type:'sound',enabled:'yes'},{type:'inject'}]) assert.equal(isCommand(raw),false);
  assert.equal(isCommand({type:'select',mode:'short',duration:300}),true);
});
