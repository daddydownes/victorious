'use strict';
// Exercise the real guided entry controller with deterministic browser events.
// This checks transition ownership/cancellation, not physical-device smoothness.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.env.SOURCE_JS||'tools/guided/journey.js','utf8');
const begin=source.indexOf('// One owner guides'),end=source.indexOf('// Product delivery starts');
assert(begin>=0&&end>begin,'The current entry controller must be present');

function create({reduced=false}={}){
 let now=0,id=0,width=390,height=844,entries=0;
 const frames=new Map(),timers=new Map(),observers=[],windowEvents={},documentEvents={};
 const style=()=>{const values={};return {setProperty(k,v){values[k]=String(v)},getPropertyValue(k){return values[k]||''},removeProperty(k){delete values[k]}}};
 const classes=()=>{const set=new Set();return {contains:k=>set.has(k),add:(...keys)=>keys.forEach(k=>set.add(k)),remove:(...keys)=>keys.forEach(k=>set.delete(k)),toggle(k,on){if(on===undefined)on=!set.has(k);on?set.add(k):set.delete(k);return on}}};
 const listen=(events,k,f)=>(events[k]||=[]).push(f);
 function dispatch(events,type,extra={}){const event={type,preventDefault(){this.defaultPrevented=true},stopImmediatePropagation(){},...extra};for(const fn of events[type]||[])fn(event);return event}
 function node(name){return {id:name,inert:false,scrollTop:0,attrs:{},events:{},style:style(),classList:classes(),getAttribute(k){return this.attrs[k]},closest(){return null},contains(el){return el===this},addEventListener(k,f){listen(this.events,k,f)},querySelector(){return heading},getBoundingClientRect(){return {top:0,width,height}},focus(){doc.activeElement=this},click(){entries++;dispatch(this.events,'click',{target:this})},scrollTo({top}){this.scrollTop=top}}}
 const heading=node('heading'),scene=node('scene'),panel=node('nextDrop'),signup=node('collectionSignup'),invitation=node('vaultInvitation'),form=node('nextDropEmail'),viewer=node('productViewer'),button=node('nextVaultHold'),screen=node('collection-screen');
 Object.defineProperties(panel,{clientHeight:{get:()=>height},clientWidth:{get:()=>width},scrollHeight:{get:()=>height*4}});
 Object.defineProperties(invitation,{offsetHeight:{get:()=>height*2},offsetTop:{get:()=>height*2}});
 Object.defineProperties(signup,{offsetTop:{get:()=>height},clientHeight:{get:()=>height}});
 signup.getBoundingClientRect=()=>({top:height-panel.scrollTop,width,height});
 invitation.getBoundingClientRect=()=>({top:height*2-panel.scrollTop,width,height:height*2});
 invitation.querySelector=s=>s==='.vault-descent-scene'?scene:heading;panel.querySelector=()=>screen;
 const nodes={nextDrop:panel,collectionSignup:signup,vaultInvitation:invitation,nextDropEmail:form,productViewer:viewer,nextVaultHold:button,collectionScrollCue:node('collectionScrollCue'),vaultScrollCue:node('vaultScrollCue')};
 const root={};Object.defineProperties(root,{clientHeight:{get:()=>height},clientWidth:{get:()=>width}});
 const doc={hidden:false,activeElement:heading,documentElement:root,body:{classList:classes()},getElementById:k=>nodes[k],addEventListener(k,f){listen(documentEvents,k,f)}};
 const motion={matches:reduced,events:{},addEventListener(k,f){listen(this.events,k,f)}};
 const viewport={scale:1,offsetTop:0,events:{},addEventListener(k,f){listen(this.events,k,f)}};Object.defineProperties(viewport,{height:{get:()=>height},width:{get:()=>width}});
 const ctx={document:doc,performance:{now:()=>now},matchMedia:()=>motion,visualViewport:viewport,
  ResizeObserver:class{constructor(fn){observers.push(fn)}observe(){}},MutationObserver:class{observe(){}},
  setTimeout(fn,delay=0){timers.set(++id,{fn,at:now+delay});return id},clearTimeout:key=>timers.delete(key),
  requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame:key=>frames.delete(key),
  addEventListener(k,f){listen(windowEvents,k,f)},__vaultCamera:{warm(){},warmOverview(){},paint(){},cancel(){}}};
 Object.defineProperties(ctx,{innerWidth:{get:()=>width},innerHeight:{get:()=>height}});ctx.window=ctx;
 vm.runInNewContext(source.slice(begin,end),ctx);
 function advance(ms=1000){const until=now+ms;while(now<until){now+=16;const jobs=[...frames.values()];frames.clear();for(const fn of jobs)fn(now);for(const [key,t]of [...timers])if(t.at<=now){timers.delete(key);t.fn()}}}
 const panelEvent=(type,extra={})=>dispatch(panel.events,type,{target:panel,cancelable:true,...extra});
 function key(key){panelEvent('keydown',{key,repeat:false});advance()}
 function contact(y=650,identifier=1){return {clientX:width/2,clientY:y,identifier}}
 function start(){panelEvent('touchstart',{touches:[contact()]})}
 function move(y=610){panelEvent('touchmove',{touches:[contact(y)]})}
 function release(){dispatch(windowEvents,'touchend',{touches:[]})}
 function swipe(){start();move();release();advance()}
 function overview(){key('PageDown');key('PageDown');assert.equal(panel.scrollTop,height*2,'Fixture must reach the separate full overview');assert.equal(entries,0)}
 function resize(newWidth=width,newHeight=height){width=newWidth;height=newHeight;dispatch(windowEvents,'resize');for(const fn of observers)fn();advance()}
 function state(){return {top:panel.scrollTop,overview:height*2,end:height*3,progress:Number(scene.style.getPropertyValue('--vault-progress')),moving:ctx.__vaultEntryGuide.moving,entered:ctx.__vaultEntryGuide.entered,entries}}
 return {advance,key,start,move,release,swipe,overview,resize,state,
  nativeScroll(progress){panel.scrollTop=height*(2+progress);panelEvent('scroll')},
  cancel(){dispatch(windowEvents,'touchcancel',{touches:[]})},
  multitouch(){panelEvent('touchstart',{touches:[contact(),contact(600,2)]})},
  lifecycle(type){dispatch(windowEvents,type)},
  hidden(value){doc.hidden=value;dispatch(documentEvents,'visibilitychange')},
  motion(value){motion.matches=value;dispatch(motion.events,'change',{matches:value})}};
}

const cases=[];
function test(name,fn){cases.push({name,fn})}
function safeOverview(h,label){const s=h.state();assert.equal(s.entries,0,label+': canceled input must not commit');assert.equal(s.entered,false,label+': entry flag must stay clear');assert.equal(s.moving,false,label+': recovery must finish');assert(Math.abs(s.top-s.overview)<3,label+': canceled zoom must return to the full overview, not park at an inactive Vault frame: '+JSON.stringify(s));assert.equal(s.progress,0,label+': no intermediate camera frame should remain')}
function recover(h,label){h.release();h.swipe();const s=h.state();assert.equal(s.entries,1,label+': a fresh onward swipe must complete once');assert.equal(s.entered,true);assert.equal(s.progress,1);assert.equal(s.moving,false)}

test('a short accepted swipe completes once after release',()=>{const h=create();h.overview();h.swipe();assert.equal(h.state().entries,1);assert.equal(h.state().progress,1);h.advance(2000);assert.equal(h.state().entries,1)});
test('a held swipe waits for release at the exact endpoint',()=>{const h=create();h.overview();h.start();h.move(-300);h.advance();assert.equal(h.state().entries,0);assert.equal(h.state().progress,1);h.release();h.advance();assert.equal(h.state().entries,1)});
for(const at of [96,352,800])test('touchcancel at '+at+' ms returns to overview and allows a fresh swipe',()=>{const h=create();h.overview();h.start();h.move();h.advance(at);h.cancel();h.advance();safeOverview(h,'touchcancel '+at);recover(h,'touchcancel '+at)});
test('a second finger revokes the zoom without an inactive endpoint',()=>{const h=create();h.overview();h.start();h.move();h.advance(352);h.multitouch();h.release();h.advance();safeOverview(h,'multitouch');recover(h,'multitouch')});
for(const event of ['blur','pagehide'])test(event+' retires a near-complete zoom at the overview',()=>{const h=create();h.overview();h.start();h.move(-150);h.advance(352);assert(h.state().progress>.9,'Fixture must reach the near-complete camera');h.lifecycle(event);h.advance();safeOverview(h,event);recover(h,event)});
test('backgrounding and return cannot restore an inactive endpoint',()=>{const h=create();h.overview();h.start();h.move(-150);h.advance(352);assert(h.state().progress>.9,'Fixture must reach the near-complete camera');h.hidden(true);h.advance();h.hidden(false);h.advance();safeOverview(h,'visibility');recover(h,'visibility')});
test('orientation resize returns canceled zoom to the new overview',()=>{const h=create();h.overview();h.start();h.move();h.advance(352);h.resize(844,390);h.release();h.advance();safeOverview(h,'orientation resize');recover(h,'orientation resize')});
test('a redundant resize event cannot strand accepted entry',()=>{const h=create();h.overview();h.start();h.move();h.advance(352);h.resize();h.release();h.advance();const s=h.state();if(s.entries===0){safeOverview(h,'redundant resize');recover(h,'redundant resize')}else assert.equal(s.entries,1)});
test('changing reduced motion during zoom returns to overview then enters without a tween',()=>{const h=create();h.overview();h.start();h.move();h.advance(352);h.motion(true);h.advance();safeOverview(h,'reduced-motion change');recover(h,'reduced-motion change')});
test('reduced motion still waits for touch release and recovers from cancellation',()=>{const h=create({reduced:true});h.overview();h.start();h.move();assert.equal(h.state().entries,0);h.cancel();h.advance();safeOverview(h,'reduced-motion cancel');recover(h,'reduced-motion cancel')});
test('deliberate reversal returns to overview without stale entry',()=>{const h=create();h.overview();h.start();h.move();h.advance(160);h.move(640);h.release();h.advance();safeOverview(h,'reverse');recover(h,'reverse')});
for(const at of [96,352,800])for(const height of [780,900])test('Safari-style height resize to '+height+' at '+at+' ms preserves accepted entry',()=>{
 const h=create();h.overview();h.start();h.move();h.advance(at);const heldProgress=h.state().progress;
 assert(heldProgress>0&&heldProgress<1,'Fixture must hold a partial camera rather than its endpoint');
 h.resize(390,height);let s=h.state();assert.equal(s.entries,0,'Resizing cannot commit while a finger is still held');
 assert.equal(s.progress,heldProgress,'Toolbar resize preserves the held relative camera position');assert.equal(s.top,s.overview,'Hidden native scroller remains at the resized overview');
 h.move(590);h.advance(32);s=h.state();assert(Math.abs(s.progress-heldProgress-20/height)<.00011,'The next finger movement remains one-to-one after geometry rebasing');
 assert.equal(s.entries,0,'Further held movement cannot enter');h.release();h.advance();s=h.state();
 assert.equal(s.entries,1,'Toolbar resize must preserve the accepted short swipe');assert.equal(s.entered,true);assert.equal(s.progress,1);assert.equal(s.top,s.end);
 h.advance(2000);assert.equal(h.state().entries,1,'Late resize/recovery work cannot duplicate entry');
});
for(const progress of [.1,.5,.98,1])test('unowned native scroll at '+progress+' returns to overview after idle',()=>{const h=create();h.overview();h.nativeScroll(progress);h.advance();safeOverview(h,'native scroll '+progress);recover(h,'native scroll '+progress)});
test('native scroll recovery waits for an unaccepted touch to finish',()=>{const h=create();h.overview();h.start();h.nativeScroll(.5);h.advance();assert.equal(h.state().progress,.5,'Do not animate against a held contact');assert.equal(h.state().entries,0);h.release();h.advance();safeOverview(h,'held native scroll');recover(h,'held native scroll')});
test('a fresh forward gesture can take over a canceled return without stale entry',()=>{const h=create();h.overview();h.start();h.move();h.advance(352);h.cancel();h.advance(80);assert.equal(h.state().entries,0);h.swipe();assert.equal(h.state().entries,1);h.advance(3000);assert.equal(h.state().entries,1);assert.equal(h.state().progress,1)});
test('repeated interruption cannot leave pending entry or recovery work',()=>{const h=create();h.overview();for(let i=0;i<3;i++){h.start();h.move();h.advance(240);h.cancel();h.lifecycle('blur');h.cancel();h.advance();safeOverview(h,'repeat '+i)}recover(h,'repeated interruption');h.advance(3000);assert.equal(h.state().entries,1)});

let failed=0;
for(const {name,fn} of cases){try{fn();console.log('PASS',name)}catch(error){failed++;console.error('FAIL',name+'\n'+error.message)}}
assert.equal(failed,0,failed+' of '+cases.length+' entry-settling cases failed');
console.log('PASS',cases.length,'entry-settling cases against the actual controller');
