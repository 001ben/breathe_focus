import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, initialState } from '../src/timer.ts';

test('worker wiring rejects untrusted messages, completes without a popup, and opens audio only when enabled', async () => {
  type Listener = (...args: any[]) => any;
  const handlers: Record<string, Listener> = {};
  let stored: Record<string, unknown> = {};
  let notices = 0, documents = 0, audioMessages = 0;
  const event = (name:string) => ({addListener(fn:Listener) {handlers[name]=fn;}});
  const api = {
    runtime: { id:'test-id', getURL:(file:string)=>`chrome-extension://test-id/${file}`,
      getContexts:async()=>[], sendMessage:async()=>{audioMessages++;},
      onInstalled:event('install'),onStartup:event('startup'),onMessage:event('message') },
    storage: { local:{ get:async()=>structuredClone(stored), set:async(value:Record<string,unknown>)=>{stored={...stored,...structuredClone(value)};},setAccessLevel:async()=>{} },sync:{get:async()=>({})} },
    alarms:{onAlarm:event('alarm'),get:async()=>undefined,create:async()=>{},clear:async()=>{}},
    action:{setBadgeBackgroundColor:async()=>{},setBadgeText:async()=>{},setTitle:async()=>{}},
    notifications:{create:async()=>{notices++;},clear:async()=>{}},
    offscreen:{Reason:{AUDIO_PLAYBACK:'AUDIO_PLAYBACK'},createDocument:async()=>{documents++;}},
  };
  Object.assign(globalThis,{chrome:api});
  try {
    await import('../src/background.ts');
    const trusted={id:'test-id',url:api.runtime.getURL('index.html')};
    const request=(command:unknown)=>new Promise<any>((resolve)=>handlers.message({target:'timer',command},trusted,resolve));
    await request({type:'read'});
    let responded=false;
    assert.equal(handlers.message({target:'timer',command:{type:'start'}},{id:'test-id',url:'https://example.com'},()=>{responded=true;}),false);
    assert.equal(responded,false);
    assert.equal((await request({type:'select',mode:'focus',duration:-1})).ok,false);
    stored[STORAGE_KEY]={...initialState(),timer:{status:'running',endsAt:Date.now()-1000}};
    handlers.alarm({name:'unrelated'});
    await new Promise(setImmediate);
    assert.equal(notices,0);
    handlers.alarm({name:'breathe_focus'});
    await new Promise(setImmediate);
    assert.equal(notices,1); assert.equal(documents,1); assert.equal(audioMessages,1);
    handlers.alarm({name:'breathe_focus'});
    await request({type:'read'});
    assert.equal(notices,1);
    stored[STORAGE_KEY]={...initialState(),sound:false,timer:{status:'running',endsAt:Date.now()-1000}};
    handlers.alarm({name:'breathe_focus'});
    await request({type:'read'});
    assert.equal(notices,2); assert.equal(documents,1);
  } finally { Reflect.deleteProperty(globalThis,'chrome'); }
});
