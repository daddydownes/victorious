'use strict';
// Actual opening helpers with controlled media promises and frame callbacks.
// This checks asynchronous ownership and visual gating, not decoder/GPU speed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.HERO_SOURCE||path.join(__dirname,'../index.html'),'utf8');
function section(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a,'Opening source markers missing: '+start);return html.slice(a,b)}
const helpers=section("  var srcReady=!!film.getAttribute('src'), playWanted=false;","  addEventListener('DOMContentLoaded',function(){");
const lifecycle=section('  var timer=null, started=0, resumeFilm=false, lastFilmTime=0;','  /* Keep the fixed, hidden chapter');
const render=section('  function vRender(te){','  if(!reduced&&!directVault){');
const math=section('  var VWHITE=[255,255,255], VGOLD=[240,212,146];','  var vRect=null');
const preference=section('  function refreshMotionPreference(){','  if(motionQuery.addEventListener)');
function harness({source=true,hidden=false,reduced=false,direct=false,videoFrames=true,noPromise=false,throwPlay=false}={}){
 let clock=100,id=0,time=0;
 const events={},mediaEvents={},frames=new Map(),allFrames=new Map(),intervals=new Map(),requests=[],seeks=[];
 const calls={pause:0,startCam:0,stopCam:0,wake:0,next:0,release:0,logo:0,reload:0};
 const classes=()=>{const set=new Set();return {add(...keys){keys.forEach(k=>set.add(k))},remove(...keys){keys.forEach(k=>set.delete(k))},contains:key=>set.has(key)}};
 const node=()=>({style:{},classList:classes(),hidden:false,addEventListener(){},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})});
 const stage=node(),film={paused:true,ended:false,muted:false,defaultMuted:false,playsInline:false,getAttribute:()=>source?'opening.mp4':'',addEventListener(type,fn){(mediaEvents[type]||=[]).push(fn)},pause(){calls.pause++;this.paused=true},play(){
  if(throwPlay)throw Error('unsupported playback');
  this.paused=false;
  const request={ok:null,bad:null,resolve(){this.ok?.()},reject(){this.bad?.(Error('blocked playback'))}};requests.push(request);
  return noPromise?undefined:{then(ok,bad){request.ok=ok;request.bad=bad}};
 }};
 Object.defineProperty(film,'currentTime',{get:()=>time,set:value=>{time=value;seeks.push(value)}});
 function queue(kind,fn){const key=++id;const entry={kind,fn};frames.set(key,entry);allFrames.set(key,entry);return key}
 if(videoFrames){film.requestVideoFrameCallback=fn=>queue('video',fn);film.cancelVideoFrameCallback=key=>frames.delete(key)}
 const document={hidden,documentElement:{clientWidth:390},body:{appendChild(){},classList:classes()},createElement:node};
 const ctx={film,stage,document,reduced,directVault:direct,phase:'ready',innerHeight:844,logoShown:false,logoTintTask:null,
  motionQuery:{matches:reduced},location:{reload(){calls.reload++}},motionNow:()=>clock,
  startCam(){calls.startCam++},stopCam(){calls.stopCam++},wakeMotion(){calls.wake++},startNextDrop(){calls.next++},releaseFilmScrollCapture(){calls.release++},showFilmLogo(){calls.logo++},cancelMotionTask(){},
  addEventListener(type,fn){(events[type]||=[]).push(fn)},requestAnimationFrame:fn=>queue('raf',fn),cancelAnimationFrame:key=>frames.delete(key),
  setInterval(fn,delay){const key=++id;intervals.set(key,{fn,delay});return key},clearInterval:key=>intervals.delete(key),
  vbase:node(),vpour:node(),vslot:node(),introVHalo:node(),introGlowFront:node(),introGlowTail:node(),glowFrontLast:'',glowTailLast:'',
  vRect:{left:0,top:0,width:100,height:100},vGlowRect:{left:0,top:0,width:100,height:100},glowNeedsPlacement:false,vFired:false};
 vm.runInNewContext(helpers+lifecycle+math+render+preference,ctx,{filename:'actual-opening-startup.js'});
 const emit=(type)=>{for(const fn of events[type]||[])fn()};
 return {ctx,film,stage,calls,requests,seeks,frames,intervals,emit,
  advance(ms){clock+=ms},setTime(value){time=value},playing(){for(const fn of mediaEvents.playing||[])fn()},
  frame(key,{stale=false}={}){const entry=(stale?allFrames:frames).get(key);assert(entry,'Expected pending/captured frame '+key);frames.delete(key);entry.fn(clock,{mediaTime:time})},
  visible(on){document.hidden=!on;emit('visibilitychange')},
  state:()=>({phase:ctx.phase,pending:ctx.filmLaunchPending,playing:stage.classList.contains('playing'),crossfade:ctx.filmCrossfadeActive,prime:ctx.filmPrimeActive,time,paused:film.paused})};
}
let cases=0;
function check(name,run){run();cases++;console.log('PASS '+name)}
for(const videoFrames of [true,false]){
 const label=videoFrames?'decoded-video callback':'RAF fallback';
 check(label+': primer pauses and rewinds only after its first frame',()=>{
  const h=harness({videoFrames});h.ctx.primeOpeningFilm();assert.equal(h.requests.length,1);assert(h.film.muted&&h.film.defaultMuted&&h.film.playsInline);
  h.requests[0].resolve();const key=h.ctx.filmPrimeFrame;assert(key);assert.equal(h.calls.pause,0);
  h.setTime(.08);h.frame(key);assert.equal(h.calls.pause,1);assert.deepEqual(h.seeks,[0]);assert.equal(h.state().prime,false);assert.equal(h.state().phase,'ready');assert(!h.state().playing);
 });
 check(label+': stale preparation frame cannot pause/rewind the real launch',()=>{
  const h=harness({videoFrames});h.ctx.primeOpeningFilm();h.requests[0].resolve();const old=h.ctx.filmPrimeFrame;
  h.ctx.play();h.setTime(.7);const pauses=h.calls.pause,seeks=h.seeks.length;
  h.frame(old,{stale:true});assert.equal(h.calls.pause,pauses);assert.equal(h.seeks.length,seeks);assert.equal(h.film.currentTime,.7);assert.equal(h.ctx.phase,'playing');
 });
 check(label+': launch holds the completed V until playback and a frame are ready',()=>{
  const h=harness({videoFrames});h.ctx.vRender(h.ctx.VI.end+500);assert.equal(h.ctx.phase,'playing');assert.equal(h.ctx.vslot.style.opacity,'1.000');assert(!h.state().playing);assert.equal(h.calls.startCam,0);
  h.playing();assert.equal(h.ctx.filmRevealFrame,0,'playing event cannot reveal before its actual play promise');
  h.requests[0].resolve();const key=h.ctx.filmRevealFrame;assert(key);h.ctx.vRender(h.ctx.VI.end+1000);assert.equal(h.ctx.vslot.style.opacity,'1.000');assert(!h.state().playing);
  h.frame(key);assert(h.state().playing);assert(!h.state().pending);assert.equal(h.calls.startCam,1);assert.equal(h.ctx.filmRevealAt,100);
  h.advance(h.ctx.VI.EXIT/2);h.ctx.vRender(h.ctx.VI.end+2000);assert.equal(h.ctx.vslot.style.opacity,'0.500');
  h.advance(h.ctx.VI.EXIT/2);h.ctx.vRender(h.ctx.VI.end+3000);assert.equal(h.ctx.vslot.style.opacity,'0.000');assert(!h.stage.classList.contains('opening-crossfade'));
 });
}
check('stale primer success and rejection cannot interfere with playback',()=>{
 const h=harness();h.ctx.primeOpeningFilm();const stale=h.requests[0];h.ctx.play();h.setTime(.4);const pauses=h.calls.pause,seeks=h.seeks.length;
 stale.resolve();stale.reject();assert.equal(h.ctx.filmPrimeFrame,0);assert.equal(h.calls.pause,pauses);assert.equal(h.seeks.length,seeks);assert.equal(h.ctx.phase,'playing');assert.equal(h.calls.next,0);
 h.requests[1].resolve();h.frame(h.ctx.filmRevealFrame);assert(h.state().playing);
});
for(const [name,options]of [['source not attached',{source:false}],['hidden document',{hidden:true}],['reduced motion',{reduced:true}],['direct Vault',{direct:true}]]){
 check('preparation eligibility: '+name,()=>{const h=harness(options);h.ctx.primeOpeningFilm();assert.equal(h.requests.length,0);assert.equal(h.ctx.filmPrimeActive,false)});
}
check('source readiness honors a waiting real launch instead of starting preparation',()=>{
 const h=harness({source:false});h.ctx.play();assert(h.ctx.playWanted);assert.equal(h.ctx.phase,'ready');assert.equal(h.requests.length,0);
 h.ctx.filmReady();assert.equal(h.ctx.phase,'playing');assert.equal(h.requests.length,1);assert(!h.ctx.filmPrimeActive);assert(!h.ctx.playWanted);
});
check('a hidden primer is retired; visible readiness starts a fresh preparation',()=>{
 const h=harness();h.ctx.primeOpeningFilm();h.requests[0].resolve();const old=h.ctx.filmPrimeFrame;h.setTime(.3);
 h.visible(false);assert.equal(h.film.currentTime,0);assert(!h.ctx.filmPrimeActive);h.visible(true);assert.equal(h.requests.length,2);const pauses=h.calls.pause;
 h.frame(old,{stale:true});h.requests[0].resolve();assert.equal(h.calls.pause,pauses);assert(h.ctx.filmPrimeActive);
});
check('stale rejected launch cannot fall open after a hidden/visible resume',()=>{
 const h=harness();h.ctx.play();const stale=h.requests[0];h.visible(false);h.visible(true);assert.equal(h.requests.length,2);
 stale.reject();assert.equal(h.ctx.phase,'playing');assert.equal(h.calls.next,0);assert(!h.state().playing);
 h.requests[1].resolve();h.frame(h.ctx.filmRevealFrame);assert(h.state().playing);assert.equal(h.calls.startCam,1);
});
check('hidden launch promise/frame cannot reveal; visible launch gets a fresh frame',()=>{
 const h=harness();h.ctx.play();h.requests[0].resolve();const stale=h.ctx.filmRevealFrame;h.film.pause();h.visible(false);h.frame(stale,{stale:true});assert(!h.state().playing);assert.equal(h.calls.startCam,0);
 h.visible(true);h.requests[1].resolve();const fresh=h.ctx.filmRevealFrame;assert.notEqual(fresh,stale);h.frame(fresh);assert(h.state().playing);
});
check('a completed clip waiting for its handoff does not restart on foreground',()=>{
 const h=harness();h.ctx.play();h.requests[0].resolve();h.frame(h.ctx.filmRevealFrame);h.film.ended=true;h.film.pause();
 const plays=h.requests.length;h.visible(false);assert.equal(h.ctx.resumeFilm,false);h.visible(true);
 assert.equal(h.requests.length,plays);assert(h.film.paused);assert.equal(h.ctx.phase,'playing');assert.equal(h.calls.next,0);
});
check('an already-paused revealed film does not restart on foreground',()=>{
 const h=harness();h.ctx.play();h.requests[0].resolve();h.frame(h.ctx.filmRevealFrame);h.film.pause();
 const plays=h.requests.length;h.visible(false);assert.equal(h.ctx.resumeFilm,false);h.visible(true);
 assert.equal(h.requests.length,plays);assert(h.film.paused);assert.equal(h.ctx.phase,'playing');
});
for(const throwPlay of [false,true]){
 check('actual playback '+(throwPlay?'throws':'rejects')+' safely completes the opening',()=>{
  const h=harness({throwPlay});h.ctx.play();if(!throwPlay)h.requests[0].reject();assert.equal(h.ctx.phase,'done');assert.equal(h.calls.next,1);assert.equal(h.calls.release,1);assert.equal(h.calls.stopCam,1);assert.equal(h.intervals.size,0);assert(!h.ctx.filmLaunchPending);assert(!h.state().playing);
 });
}
check('preparation rejection remains ready and permits the real launch',()=>{
 const h=harness();h.ctx.primeOpeningFilm();h.requests[0].reject();assert.equal(h.ctx.phase,'ready');assert(!h.ctx.filmPrimeActive);assert.equal(h.calls.next,0);
 h.ctx.play();assert.equal(h.requests.length,2);h.requests[1].resolve();h.frame(h.ctx.filmRevealFrame);assert(h.state().playing);
});
check('non-promise playback still waits for a frame before revealing',()=>{
 const h=harness({noPromise:true});h.ctx.play();assert(!h.state().playing);assert(h.ctx.filmRevealFrame);h.frame(h.ctx.filmRevealFrame);assert(h.state().playing);
});
check('finish invalidates a queued reveal and late success/rejection',()=>{
 const h=harness();h.ctx.play();const request=h.requests[0];request.resolve();const old=h.ctx.filmRevealFrame;h.ctx.finish();const pauses=h.calls.pause;
 h.frame(old,{stale:true});request.resolve();request.reject();assert.equal(h.ctx.phase,'done');assert.equal(h.calls.pause,pauses);assert.equal(h.calls.next,1);assert.equal(h.calls.startCam,0);assert(!h.state().playing);
});
check('motion preference change invalidates media owners before the retained restart',()=>{
 const h=harness();h.ctx.play();h.requests[0].resolve();const old=h.ctx.filmRevealFrame;h.ctx.motionQuery.matches=true;h.ctx.refreshMotionPreference();
 assert.equal(h.calls.reload,1);assert(h.film.paused);h.frame(old,{stale:true});h.requests[0].reject();assert.equal(h.calls.next,0);assert(!h.state().playing);
});
console.log('PASS '+cases+' focused opening startup ownership/frame-gating cases. Media callbacks and layout are mocked; physical decoding, compositing and real playback timing are not established.');
