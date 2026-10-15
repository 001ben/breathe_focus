import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createController, type TimerPlatform } from '../src/controller.ts';
import { initialState, type State } from '../src/timer.ts';

function fixture() {
  let stored: unknown;
  let now = 1000;
  let alarm: number | null = null;
  let notifications = 0;
  let saveFails = false;
  const platform: TimerPlatform = {
    read: async () => structuredClone(stored), legacy: async () => ({}),
    save: async (state) => { if(saveFails) throw new Error('storage full'); stored = structuredClone(state); },
    schedule: async (time) => {alarm=time;}, badge: async () => {}, clearNotice: async () => {},
    notify: async () => { notifications++; }, now: () => now,
  };
  return { platform, get state() { return stored as State; }, get alarm() { return alarm; }, get notifications() {return notifications;},
    setNow(value:number) {now=value;}, seed(value:State) {stored=value;}, failSave(value:boolean) {saveFails=value;} };
}
test('a new worker recovers a missing alarm from persisted state',async()=>{
  const f=fixture(); f.seed({...initialState(),timer:{status:'running',endsAt:200000}});
  await createController(f.platform).dispatch({type:'read'});
  assert.equal(f.alarm,200000); assert.equal(f.notifications,0);
});
test('overdue recovery and duplicate alarms notify exactly once',async()=>{
  const f=fixture(); f.seed({...initialState(),timer:{status:'running',endsAt:500}});
  const first=createController(f.platform);
  await Promise.all([first.dispatch({type:'read'}),first.dispatch({type:'read'})]);
  await createController(f.platform).dispatch({type:'read'});
  assert.equal(f.state.timer.status,'complete'); assert.equal(f.notifications,1); assert.equal(f.alarm,null);
});
test('two popups starting simultaneously do not extend the timer',async()=>{
  const f=fixture(); const controller=createController(f.platform);
  await Promise.all([controller.dispatch({type:'start'}),controller.dispatch({type:'start'})]);
  assert.deepEqual(f.state.timer,{status:'running',endsAt:1501000});
  f.setNow(1500); await controller.dispatch({type:'pause'}); assert.equal(f.alarm,null);
  f.setNow(5000); await controller.dispatch({type:'resume'}); assert.equal(f.alarm,1504500);
});
test('early or stale alarm delivery cannot finish a future timer',async()=>{
  const f=fixture(); const controller=createController(f.platform);
  await controller.dispatch({type:'start'}); await controller.dispatch({type:'read'});
  assert.equal(f.state.timer.status,'running'); assert.equal(f.notifications,0);
});
test('changing sound at the deadline does not swallow the completion notice',async()=>{
  const f=fixture(); f.seed({...initialState(),timer:{status:'running',endsAt:500}});
  await createController(f.platform).dispatch({type:'sound',enabled:false});
  assert.equal(f.state.timer.status,'complete'); assert.equal(f.state.sound,false); assert.equal(f.notifications,1);
});
test('reset at completion suppresses obsolete notification; queue recovers after storage failure',async()=>{
  const f=fixture(); f.seed({...initialState(),timer:{status:'running',endsAt:500}});
  const controller=createController(f.platform);
  f.failSave(true); await assert.rejects(controller.dispatch({type:'reset'})); assert.equal(f.notifications,0);
  f.failSave(false); await controller.dispatch({type:'reset'});
  assert.equal(f.state.timer.status,'idle'); assert.equal(f.notifications,0);
});
