'use strict';
// Actual guided controller with a quantizing scroll surface. No browser, image
// downloads or signup transport is needed to expose the camera's frame sequence.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.env.GUIDED_SOURCE||path.join(__dirname,'../tools/guided/journey.js'),'utf8');
const start=source.indexOf('// One owner guides'),end=source.indexOf('// Product delivery starts',start);
assert(start>=0&&end>start,'Guided entry controller missing');
const controller=source.slice(start,end);
function create({height:initialHeight=844,width=390,extra:initialExtra=0,quantum=1,fps=60,reduced=false}={}){
 let now=0,id=0,height=initialHeight,extra=initialExtra,stored=0,scrollPending=false,clicks=0;
 const frames=new Map(),timers=new Map(),observers=[],events={},paints=[],writes=[];
 const classes=()=>{const values=new Set();return {contains:k=>values.has(k),add:k=>values.add(k),remove:k=>values.delete(k),toggle(k,on){on?values.add(k):values.delete(k)}}};
 const style=()=>{const values={};return {setProperty(k,v){values[k]=v},getPropertyValue:k=>values[k]||''}};
 function node(name){return {id:name,inert:false,attrs:{},events:{},style:style(),classList:classes(),getAttribute(k){return this.attrs[k]},closest(){return null},contains(el){return el===this},addEventListener(k,fn){(this.events[k]||=[]).push(fn)},querySelector(){return heading},getBoundingClientRect(){return {top:0}},click(){clicks++;emit(this,'click',{})},focus(){doc.activeElement=this}}}
 const heading=node('heading'),scene=node('scene'),panel=node('nextDrop'),signup=node('collectionSignup'),invitation=node('vaultInvitation'),form=node('nextDropEmail'),viewer=node('productViewer'),button=node('nextVaultHold'),screen=node('collection-screen');
 Object.defineProperty(panel,'scrollTop',{get:()=>stored,set(value){writes.push({time:now,value});const next=quantum?Math.round(value/quantum)*quantum:value;if(next!==stored)scrollPending=true;stored=next}});
 Object.defineProperty(panel,'clientHeight',{get:()=>height});
 Object.defineProperty(invitation,'offsetHeight',{get:()=>height*2});
 signup.getBoundingClientRect=()=>({top:height-panel.scrollTop});
 invitation.getBoundingClientRect=()=>({top:height*2+extra-panel.scrollTop});
 invitation.querySelector=selector=>selector==='.vault-descent-scene'?scene:heading;panel.querySelector=()=>screen;
 const nodes={nextDrop:panel,collectionSignup:signup,vaultInvitation:invitation,nextDropEmail:form,productViewer:viewer,nextVaultHold:button,collectionScrollCue:node('collectionScrollCue'),vaultScrollCue:node('vaultScrollCue')};
 const doc={hidden:false,activeElement:heading,body:{classList:classes()},getElementById:key=>nodes[key],addEventListener(key,fn){(events[key]||=[]).push(fn)}};
 const context={document:doc,innerWidth:width,innerHeight:height,performance:{now:()=>now},matchMedia:()=>({matches:reduced,addEventListener(){}}),ResizeObserver:class{constructor(fn){observers.push(fn)}observe(){}},MutationObserver:class{observe(){}},setTimeout(fn,delay){timers.set(++id,{fn,at:now+delay});return id},clearTimeout:key=>timers.delete(key),requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame:key=>frames.delete(key),addEventListener(key,fn){(events[key]||=[]).push(fn)},__vaultCamera:{warm(){},warmOverview(){},paint(progress,offset){paints.push({time:now,progress,offset,position:height*2+extra+(progress?progress*height:-offset),scroll:panel.scrollTop})},cancel(){}}};
 context.window=context;
 function emit(target,event,value){for(const fn of target.events[event]||[])fn(value)}
 function global(event,value={}){for(const fn of events[event]||[])fn(value)}
 vm.runInNewContext(controller,context);
 function step(){
  now+=1000/fps;
  // Browser scroll events notify the controller after a programmatic scroll.
  if(scrollPending){scrollPending=false;emit(panel,'scroll',{})}
  const jobs=[...frames.values()];frames.clear();for(const fn of jobs)fn(now);
  for(const [key,timer]of [...timers])if(timer.at<=now){timers.delete(key);timer.fn()}
 }
 function framesFor(count){for(let n=0;n<count;n++)step()}
 function until(condition,label='condition'){for(let n=0;n<300;n++){if(condition())return;step()}assert.fail('Timed out: '+label)}
 function wheel(delta=600){emit(panel,'wheel',{target:panel,deltaX:0,deltaY:delta,preventDefault(){}})}
 function key(key='PageDown',repeat=false){emit(panel,'keydown',{target:panel,key,repeat,preventDefault(){}})}
 function scroll(top){panel.scrollTop=top;emit(panel,'scroll',{})}
 function touch(kind,y=600,count=1){
  const touches=kind==='end'||kind==='cancel'?[]:Array.from({length:count},(_,i)=>({identifier:i+1,clientY:y+i*10}));
  const event={target:panel,touches,cancelable:true,preventDefault(){}};
  if(kind==='end'||kind==='cancel')global('touch'+kind,event);else emit(panel,'touch'+kind,event);
 }
 function reflow(amount){extra=amount;for(const fn of observers)fn()}
 const state=()=>({top:panel.scrollTop,target:context.__vaultEntryGuide.target,moving:context.__vaultEntryGuide.moving,entered:context.__vaultEntryGuide.entered,touching:context.__vaultEntryGuide.touching});
 return {step,framesFor,until,wheel,key,scroll,touch,reflow,state,paints,writes,panel,doc,global,notifyScroll(){emit(panel,'scroll',{})},get now(){return now},get clicks(){return clicks},get overview(){return height*2+extra},get endpoint(){return height*3+extra},get lastPaint(){return paints.at(-1)}};
}
const near=(actual,expected,label)=>assert(Math.abs(actual-expected)<1e-7,label+': '+actual+' != '+expected);
const begin=(test,top)=>{test.framesFor(4);test.scroll(top);test.step();test.paints.length=0};

let checkedFrames=0,continuousQuantizedFrames=0;
for(const fps of [60,120])for(const quantum of [0,1/3,1])for(const phase of ['approach','zoom']){
 const test=create({fps,quantum}),from=phase==='approach'?844:test.overview,target=from+844;
 begin(test,from);test.writes.length=0;test.wheel();const started=test.now;let previous,frames=0;
 while(test.state().moving){
  assert(++frames<200,'Accepted move must finish within its bounded duration');
  test.step();const paint=test.lastPaint,p=Math.min(1,(test.now-started)/530),ideal=from+844*(1-Math.pow(1-p,3));
  const expected=Math.abs(target-ideal)<.25||p>=1?target:ideal;
  near(paint.position,expected,'Camera must follow authored easing independently of scroll rounding');
  if(previous){
   assert(paint.position>=previous.position,'Forward camera cannot reverse');
   if(paint.scroll===previous.scroll&&paint.position>previous.position)continuousQuantizedFrames++;
  }
  previous=paint;checkedFrames++;
  if(!test.state().moving)assert(target-ideal<.25,'Endpoint must not add the former three-pixel kick');
  if(phase==='zoom'&&test.state().moving)assert.equal(test.writes.length,0,'Owned zoom must not move the hidden native scroller');
 }
 near(test.lastPaint.position,target,'Exact final camera position');
 if(phase==='zoom'){assert.equal(test.clicks,1,'Zoom handoff fires exactly once');assert.equal(test.writes.length,1,'Native zoom endpoint synchronizes once')}
 else assert.equal(test.clicks,0,'Approach stops at overview');
}
assert(continuousQuantizedFrames>0,'Subpixel camera motion must continue across repeated integer scroll readings');
console.log('PASS',checkedFrames,'continuous approach/zoom frames at60/120Hz; zero native writes during zoom; one endpoint sync; subpixel completion');

// Fractional native scroll targets may round down while a finger is still held.
// They must remain visibly at the exact final frame without granting entry early.
const held=create({extra:.4});begin(held,held.overview);
held.touch('start',600);held.touch('move',550);held.until(()=>!held.state().moving,'held zoom completion');
assert.equal(held.clicks,0);assert.equal(held.state().touching,1);near(held.lastPaint.progress,1,'Held final frame');
held.framesFor(3);near(held.lastPaint.progress,1,'Scroll notification must not pull final frame backward');
held.touch('end');held.framesFor(3);assert.equal(held.clicks,1,'Release commits once');
console.log('PASS fractional endpoint remains exact through delayed scroll events and touch release');

function nearTail(test){test.until(()=>test.state().moving&&test.overview-test.lastPaint?.position<3&&test.overview-test.lastPaint.position>.25,'old three-pixel tail')}
for(const input of ['touch','wheel','key']){
 const test=create();begin(test,844);
 if(input==='touch'){test.touch('start',600);test.touch('move',550);test.touch('end')}
 else test[input]();
 nearTail(test);const before=test.lastPaint.position;
 if(input==='touch'){test.touch('start',600);test.touch('move',550)}else test[input]();
 assert.equal(test.state().target,'vault',input+': a fresh gesture in the former completion tail must continue');
 assert(test.state().moving);near(test.lastPaint.position,test.overview,'Prior landing is completed before continuation');
 assert(before<test.overview);if(input==='touch')test.touch('end');
 test.until(()=>test.state().entered,input+' continued entry');assert.equal(test.clicks,1);
}
const ongoing=create();begin(ongoing,844);ongoing.touch('start',600);ongoing.touch('move',550);nearTail(ongoing);
ongoing.touch('move',350);assert.equal(ongoing.state().target,'overview','Ongoing contact must not consume the next chapter');
ongoing.touch('end');ongoing.until(()=>!ongoing.state().moving);assert.equal(ongoing.clicks,0);
const burst=create();begin(burst,844);burst.wheel();
for(let n=0;!(burst.state().moving&&burst.overview-burst.lastPaint?.position<3);n++){assert(n<100,'Wheel fixture must reach the completion tail');burst.step();burst.wheel()}
burst.wheel();assert.equal(burst.state().target,'overview','Ongoing wheel burst must remain coalesced');
burst.until(()=>!burst.state().moving);assert.equal(burst.clicks,0);
console.log('PASS fresh touch/wheel/key continues in near-end tail; held touch and wheel burst remain coalesced');

// Reverse from the last displayed subpixel position, not rounded scrollTop.
const reverse=create();begin(reverse,reverse.overview);reverse.wheel();reverse.framesFor(8);
const reversalStart=reverse.lastPaint.position;
assert(Math.abs(reversalStart-reverse.state().top)>.01,'Fixture must have nonintegral displayed position');
reverse.writes.length=0;reverse.wheel(-30);assert.equal(reverse.state().target,'overview');
const reverseStarted=reverse.now,reverseDuration=Math.min(640,Math.max(420,360+(reversalStart-reverse.overview)/844*170));
reverse.step();
near(reverse.lastPaint.position,reversalStart+(reverse.overview-reversalStart)*(1-Math.pow(1-(reverse.now-reverseStarted)/reverseDuration,3)),'Reversal starts at displayed position');
assert.equal(reverse.writes.length,0,'Camera reversal must not move the hidden scroller');
reverse.until(()=>!reverse.state().moving);near(reverse.lastPaint.position,reverse.overview,'Reversed landing');assert.equal(reverse.clicks,0);assert.equal(reverse.writes.length,1,'Reversal synchronizes the overview once');
const cancelled=create();begin(cancelled,cancelled.overview);cancelled.touch('start',600);cancelled.touch('move',550);cancelled.framesFor(9);
cancelled.touch('cancel');cancelled.until(()=>!cancelled.state().moving);near(cancelled.lastPaint.position,cancelled.overview,'Cancelled zoom recovers');assert.equal(cancelled.clicks,0);
cancelled.touch('start',600);cancelled.touch('move',550);cancelled.touch('end');cancelled.until(()=>cancelled.state().entered);assert.equal(cancelled.clicks,1);
const multiple=create();begin(multiple,multiple.overview);multiple.touch('start',600);multiple.touch('move',550);multiple.framesFor(9);
const interruptedPosition=multiple.lastPaint.position;multiple.writes.length=0;
multiple.touch('start',500,2);assert(!multiple.state().moving);
// A queued native notification must not replace the held camera with its fixed
// scroller's overview position while the second contact is still down.
multiple.scroll(multiple.state().top);multiple.step();near(multiple.lastPaint.position,interruptedPosition,'Multitouch holds the displayed camera');
multiple.writes.length=0;multiple.framesFor(4);assert.equal(multiple.clicks,0);
multiple.touch('end');multiple.until(()=>!multiple.state().moving);near(multiple.lastPaint.position,multiple.overview,'Multiple-contact recovery');assert.equal(multiple.clicks,0);assert.equal(multiple.writes.length,1,'Deferred recovery synchronizes once');
for(const event of ['blur','pagehide']){
 const test=create();begin(test,test.overview);test.touch('start',600);test.touch('move',550);test.framesFor(8);test.writes.length=0;
 assert(test.lastPaint.progress>0&&test.state().top===test.overview,'Fixture must have a moving camera above a stationary native scroller');
 test.global(event);near(test.state().top,test.overview,event+': native cleanup stays at overview');test.step();near(test.lastPaint.progress,0,event+': immediate camera cleanup');
 assert(!test.state().moving);assert.equal(test.clicks,0);assert.equal(test.writes.length,1,event+': cleanup synchronizes once');
 test.framesFor(40);assert.equal(test.clicks,0,'No stale entry after '+event);
}
console.log('PASS subpixel reversal; cancellation/multitouch recovery; fresh entry after cancellation');

const unowned=create();begin(unowned,unowned.overview);unowned.scroll(unowned.overview+200.4);unowned.step();
near(unowned.lastPaint.position,unowned.state().top,'Unowned scroll uses actual native scroll position');
unowned.framesFor(60);near(unowned.lastPaint.position,unowned.overview,'Unowned partial zoom settles back');assert.equal(unowned.clicks,0);
const small=create({reduced:true,extra:.4});begin(small,small.overview);small.touch('start',600);small.touch('move',550);
assert(!small.state().moving);near(small.lastPaint.progress,1,'Reduced-motion exact endpoint');assert.equal(small.clicks,0);
small.touch('end');small.until(()=>small.state().entered);assert.equal(small.clicks,1);
const changed=create();begin(changed,844);changed.wheel();changed.framesFor(8);changed.reflow(60);
changed.until(()=>!changed.state().moving);near(changed.lastPaint.position,changed.overview,'Existing reflow updates destination');assert.equal(changed.clicks,0);
console.log('PASS native/restored scroll ownership, reduced-motion release, remeasured destination');

// Real scroll movement must supersede a camera whose native anchor is parked.
// Notifications of the unchanged anchor are not fresh native movement.
const backward=create();begin(backward,backward.overview);backward.wheel();backward.framesFor(8);
backward.scroll(backward.overview-120);assert(!backward.state().moving,'Native scroll before overview cancels the owned zoom');
backward.step();near(backward.lastPaint.progress,0,'Native backward takeover renders the approach');near(backward.lastPaint.offset,120,'Signup edge follows actual native scroll');
backward.framesFor(45);near(backward.state().top,backward.overview-120,'Backward native position is not pulled back into the camera');assert.equal(backward.clicks,0);
backward.key();backward.until(()=>!backward.state().moving);near(backward.lastPaint.position,backward.overview,'Fresh gesture recovers overview');
backward.key();backward.until(()=>backward.state().entered);assert.equal(backward.clicks,1,'Fresh gestures still enter after native takeover');

const partial=create();begin(partial,partial.overview);partial.wheel();partial.framesFor(8);
partial.scroll(partial.overview+220);assert(!partial.state().moving,'Native partial zoom cancels the owned camera');partial.step();
near(partial.lastPaint.position,partial.state().top,'Partial takeover immediately reflects actual native scroll');
partial.until(()=>!partial.state().moving&&partial.lastPaint.progress===0,'Unowned partial zoom settles to overview');
near(partial.state().top,partial.overview,'Partial native takeover synchronizes recovered overview');assert.equal(partial.clicks,0,'Native takeover cannot grant entry');
partial.key();partial.until(()=>partial.state().entered);assert.equal(partial.clicks,1);

const delayed=create();begin(delayed,delayed.overview);delayed.touch('start',600);delayed.touch('move',550);delayed.framesFor(8);
const delayedPosition=delayed.lastPaint.position;
delayed.notifyScroll();assert(delayed.state().moving,'Delayed own-anchor notification must retain accepted intent');delayed.step();
assert(delayed.lastPaint.position>delayedPosition,'Owned camera continues after a delayed notification');
delayed.until(()=>!delayed.state().moving);assert.equal(delayed.clicks,0,'Held contact retains endpoint release gate');delayed.touch('end');assert.equal(delayed.clicks,1);

const relayout=create();begin(relayout,relayout.overview);relayout.touch('start',600);relayout.touch('move',550);relayout.framesFor(8);
relayout.reflow(60);relayout.scroll(relayout.overview);
assert(relayout.state().moving,'Layout invalidation plus native anchoring must retain the accepted zoom');
relayout.step();relayout.notifyScroll();assert(relayout.state().moving,'Delayed correction notification must use the updated native anchor');
relayout.until(()=>!relayout.state().moving);near(relayout.lastPaint.position,relayout.endpoint,'Remeasured camera reaches the updated endpoint');assert.equal(relayout.clicks,0);
relayout.touch('end');assert.equal(relayout.clicks,1,'Resized accepted zoom still enters on release');
console.log('PASS native backward/partial takeover and fresh recovery; delayed own notifications and layout anchoring preserve intent');

for(const delta of [-120,220]){
 const paused=create();begin(paused,paused.overview);paused.touch('start',600);paused.touch('move',550);paused.framesFor(8);
 paused.touch('start',500,2);assert(!paused.state().moving,'Second contact pauses recovery');
 paused.scroll(paused.overview+delta);paused.step();
 near(paused.lastPaint.position,paused.state().top,'Native takeover during deferred recovery replaces the held camera');
 paused.touch('end');
 if(delta>0)paused.until(()=>!paused.state().moving&&paused.lastPaint.progress===0,'Native partial takeover after deferred recovery');
 else{paused.framesFor(45);near(paused.state().top,paused.overview+delta,'Release must not resume stale recovery over native signup')}
 assert.equal(paused.clicks,0,'Deferred recovery takeover cannot grant entry');
 if(delta<0){paused.key();paused.until(()=>!paused.state().moving)}
 paused.key();paused.until(()=>paused.state().entered);assert.equal(paused.clicks,1,'Fresh gesture recovers after deferred native takeover');
}
console.log('PASS native takeover during deferred multitouch recovery discards stale camera ownership');

const invalidated=create();begin(invalidated,invalidated.overview);invalidated.wheel();invalidated.framesFor(8);
invalidated.reflow(0);invalidated.scroll(invalidated.overview-120);invalidated.step();
assert(!invalidated.state().moving,'Unchanged geometry after invalidation must not hide actual native takeover');
near(invalidated.lastPaint.position,invalidated.state().top,'Deferred native takeover uses remeasured actual scroll');
invalidated.framesFor(40);assert.equal(invalidated.clicks,0);
console.log('PASS native takeover survives a coincident no-op layout invalidation');
