'use strict';
// Exercise the real entry controller with recorded finger positions. Images,
// network and rendering throughput cannot explain a failure in these cases.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(process.env.GUIDED_SOURCE||path.join(root,'tools/guided/journey.js'),'utf8');
function extract(text){
 const start=text.indexOf('// One owner guides'),end=text.indexOf('// Product delivery starts',start);
 assert(start>=0&&end>start,'Guided entry controller missing');return text.slice(start,end);
}
function create({code=source,height=844,width=390,extra=0,quantum=1,fps=60,reduced=false}={}){
 let now=0,id=0,stored=0,scrollPending=false,clicks=0,paint=null;
 const frames=new Map(),timers=new Map(),events={},writes=[],paints=[];
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
 const context={document:doc,innerWidth:width,innerHeight:height,performance:{now:()=>now},matchMedia:()=>({matches:reduced,addEventListener(){}}),ResizeObserver:class{observe(){}},MutationObserver:class{observe(){}},setTimeout(fn,delay){timers.set(++id,{fn,at:now+delay});return id},clearTimeout:key=>timers.delete(key),requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame:key=>frames.delete(key),addEventListener(key,fn){(events[key]||=[]).push(fn)},__vaultCamera:{warm(){},warmOverview(){},paint(progress,offset){paint={time:now,progress,offset,position:height*2+extra+(progress?progress*height:-offset)};paints.push(paint)},cancel(){paint=null}}};
 context.window=context;
 function emit(target,event,value){for(const fn of target.events[event]||[])fn(value)}
 function global(event,value={}){for(const fn of events[event]||[])fn(value)}
 vm.runInNewContext(extract(code),context);
 function step(){
  now+=1000/fps;
  if(scrollPending){scrollPending=false;emit(panel,'scroll',{})}
  const jobs=[...frames.values()];frames.clear();for(const fn of jobs)fn(now);
  for(const [key,timer]of [...timers])if(timer.at<=now){timers.delete(key);timer.fn()}
 }
 function framesFor(count){for(let n=0;n<count;n++)step()}
 function until(condition,label){for(let n=0;n<240;n++){if(condition())return;step()}assert.fail('Timed out: '+label)}
 function touch(kind,y=600,{count=1,cancelable=true}={}){
  const touches=kind==='end'||kind==='cancel'?[]:Array.from({length:count},(_,i)=>({identifier:i+1,clientY:y+i*10}));
  const event={target:panel,touches,cancelable,defaultPrevented:false,preventDefault(){assert(this.cancelable,'Must not cancel a browser-owned move');this.defaultPrevented=true}};
  if(kind==='end'||kind==='cancel')global('touch'+kind,event);else emit(panel,'touch'+kind,event);return event;
 }
 function scroll(top){panel.scrollTop=top;emit(panel,'scroll',{})}
 function wheel(delta=600){emit(panel,'wheel',{target:panel,deltaX:0,deltaY:delta,preventDefault(){}})}
 function key(key='PageDown'){emit(panel,'keydown',{target:panel,key,repeat:false,preventDefault(){}})}
 const state=()=>({top:panel.scrollTop,target:context.__vaultEntryGuide.target,moving:context.__vaultEntryGuide.moving,entered:context.__vaultEntryGuide.entered,touching:context.__vaultEntryGuide.touching});
 return {step,framesFor,until,touch,scroll,wheel,key,state,global,doc,writes,paints,activateButton(){button.click()},get position(){return paint?.position??panel.scrollTop},get clicks(){return clicks},get overview(){return height*2+extra},get endpoint(){return height*3+extra},get signup(){return height}};
}
const near=(actual,expected,label)=>assert(Math.abs(actual-expected)<1e-6,label+': '+actual+' != '+expected);
function begin(test,top){test.framesFor(4);test.scroll(top);test.step();test.writes.length=0}
function drag(test,y,frames=1,options){const event=test.touch('move',y,options);test.framesFor(frames);return event}

let paths=0;
for(const fps of [60,120])for(const quantum of [0,1/3,1])for(const phase of ['approach','zoom'])for(const delay of [1,9]){
 const test=create({fps,quantum}),from=phase==='approach'?test.signup:test.overview;
 begin(test,from);test.touch('start',650);drag(test,590,delay);
 let previousY=590,previousPosition=test.position;
 assert(previousPosition>from&&previousPosition<from+120,'First accepted drag remains close to the finger');
 for(const y of [550,515,525,530,490,520,575]){
  drag(test,y,delay);
  near(test.position-previousPosition,previousY-y,phase+': every held movement follows the finger, including small reversals');
  previousPosition=test.position;previousY=y;
 }
 test.framesFor(Math.ceil(fps*.8));near(test.position,previousPosition,phase+': a stationary held finger cannot keep animating');
 assert.equal(test.clicks,0,'Held movement cannot hand off the Vault');paths++;
}
console.log('PASS',paths,'slow/fast held up/down paths at60/120Hz with fractional/integer scroll getters; stationary fingers stay still');

for(const phase of ['approach','zoom']){
 const test=create(),from=phase==='approach'?test.signup:test.overview,target=from+844;
 begin(test,from);test.touch('start',650);drag(test,600);const released=test.position;
 test.touch('end');test.until(()=>!test.state().moving,phase+' short swipe completion');
 near(test.position,target,phase+': released short swipe reaches its full landing');
 assert(released<target,'Fixture must release before the endpoint');
 assert.equal(test.clicks,phase==='zoom'?1:0,'Only the second swipe may enter');
 test.framesFor(90);assert.equal(test.clicks,phase==='zoom'?1:0,'No duplicate late handoff');
}
for(const phase of ['approach','zoom']){
 const test=create(),from=phase==='approach'?test.signup:test.overview,target=from+844;
 begin(test,from);test.touch('start',650);drag(test,-650);test.framesFor(60);
 near(test.position,target,'Oversized held drag stops at one stage');assert.equal(test.clicks,0,'Held endpoint waits for release');
 drag(test,-850);near(test.position,target,'More input from the same touch cannot skip another stage');
 test.touch('end');test.until(()=>!test.state().moving,'oversized release');assert.equal(test.clicks,phase==='zoom'?1:0);
}
console.log('PASS short releases finish automatically once; oversized/held gestures retain one-stage and release gates');

const reverse=create();begin(reverse,reverse.overview);reverse.touch('start',650);drag(reverse,440);
const forward=reverse.position;drag(reverse,450);near(reverse.position,forward-10,'Reversal starts from the displayed camera');
drag(reverse,600);assert(reverse.position>=reverse.overview,'Reversal cannot jump behind the overview');
reverse.touch('end');reverse.until(()=>!reverse.state().moving,'reverse recovery');near(reverse.position,reverse.overview,'Reversed zoom returns to full overview');assert.equal(reverse.clicks,0);

for(const reason of ['cancel','multiple','blur','pagehide','hidden']){
 const test=create();begin(test,test.overview);test.touch('start',650);drag(test,490);assert(test.position>test.overview);
 if(reason==='cancel')test.touch('cancel');
 else if(reason==='multiple'){test.touch('start',490,{count:2});const paused=test.position;test.framesFor(20);near(test.position,paused,'Multitouch holds the displayed camera');test.touch('end')}
 else if(reason==='hidden'){test.doc.hidden=true;test.global('visibilitychange')}
 else test.global(reason);
 test.framesFor(90);near(test.position,test.overview,reason+': interruption recovers the whole overview');assert.equal(test.clicks,0,reason+': interruption cannot enter');
}
console.log('PASS continuous reversal and cancellation, multitouch, blur, pagehide and background recovery');

for(const phase of ['approach','zoom']){
 const test=create(),from=phase==='approach'?test.signup:test.overview;
 begin(test,from);test.touch('start',650);drag(test,570);test.touch('end');test.framesFor(5);
 const displayed=test.position;assert(test.state().moving,'Fixture must catch the unfinished release animation');
 test.touch('start',650);drag(test,590);const accepted=test.position;assert(accepted>=displayed&&accepted<=displayed+61,'Fresh drag continues without returning to its parked native anchor');
 test.framesFor(12);near(test.position,accepted,phase+': fresh accepted contact pauses at the displayed position');
 drag(test,580);near(test.position-accepted,10,'Fresh drag follows its new finger origin');
 test.touch('end');test.until(()=>!test.state().moving,'fresh release completion');near(test.position,from+844,'Fresh takeover completes the same stage');
 assert.equal(test.clicks,phase==='zoom'?1:0);
}
console.log('PASS fresh touch takes over an unfinished release from its displayed position');

for(const phase of ['approach','zoom']){
 const test=create(),from=phase==='approach'?test.signup:test.overview;
 begin(test,from);test.touch('start',650);drag(test,630);assert(test.position>from&&test.position<from+28,'A small drag previews directly without committing a chapter');
 test.touch('end');test.until(()=>!test.state().moving,'small preview return');near(test.position,from,'A subthreshold preview returns to its starting landing');assert.equal(test.clicks,0);
}
console.log('PASS a small uncommitted preview returns to its starting landing');

// The event card can leave a readable intermediate stop only25px away. Gesture
// intent must still work when the visible displacement hits that narrow bound.
for(const extra of [25,28,29]){
 const test=create({extra}),shortLanding=test.signup+extra;
 begin(test,test.signup);test.touch('start',650);drag(test,450);near(test.position,shortLanding,'A full swipe stops at the short email landing');
 test.framesFor(30);near(test.position,shortLanding,'Holding a short stage cannot skip it');assert.equal(test.clicks,0);
 test.touch('end');test.until(()=>!test.state().moving,'short-stage release');near(test.position,shortLanding,'A released full swipe accepts the short stage instead of returning');
 test.framesFor(60);near(test.position,shortLanding,'A short-stage release cannot queue another chapter');
 test.touch('start',650);drag(test,550);test.touch('end');test.until(()=>!test.state().moving,'overview after short stage');
 near(test.position,test.overview,'A fresh next gesture reaches the overview');assert.equal(test.clicks,0,'The intermediate stage cannot skip into the Vault');
 for(const interruption of ['reverse','cancel']){
  const interrupted=create({extra});begin(interrupted,interrupted.signup);interrupted.touch('start',650);drag(interrupted,450);
  near(interrupted.position,interrupted.signup+extra,'Interruption fixture must reach its short-stage bound');
  if(interruption==='reverse'){drag(interrupted,650);interrupted.touch('end')}else interrupted.touch('cancel');
  interrupted.until(()=>!interrupted.state().moving,interruption+' short-stage recovery');near(interrupted.position,interrupted.signup,interruption+': short-stage recovery returns to its origin');assert.equal(interrupted.clicks,0);
  interrupted.touch('start',650);drag(interrupted,450);interrupted.touch('end');interrupted.until(()=>!interrupted.state().moving,'fresh short stage');
  near(interrupted.position,interrupted.signup+extra,'A fresh gesture still accepts the recovered short stage');assert.equal(interrupted.clicks,0);
 }
}
console.log('PASS 25/28/29px intermediate stages accept full gestures once and preserve reversal/cancellation recovery');

for(const phase of ['approach','zoom'])for(const accepted of [false,true]){
 const test=create(),from=phase==='approach'?test.signup:test.overview;
 begin(test,from);test.touch('start',650);if(accepted)drag(test,590);
 const event=drag(test,540,1,{cancelable:false});assert.equal(event.defaultPrevented,false,'Browser-owned input must remain uncancelled');
 const native=from+(phase==='zoom'?110:140);test.scroll(native);test.step();
 test.framesFor(20);near(test.position,native,'Native takeover cannot be pulled back by a custom animation');
 // Once this contact belongs to the browser, a later event cannot reclaim it.
 drag(test,480,4);near(test.position,native,'A later move in the native-owned contact cannot restart custom scrolling');
 assert.equal(test.clicks,0,'Browser-owned input cannot grant entry');test.touch('end');test.framesFor(90);
 near(test.position,phase==='zoom'?test.overview:native,'Native partial zoom recovers; native approach remains browser-owned');assert.equal(test.clicks,0);
}
const nativeApproach=create();begin(nativeApproach,nativeApproach.signup);nativeApproach.touch('start',650);drag(nativeApproach,570);nativeApproach.touch('end');nativeApproach.framesFor(5);
assert(nativeApproach.state().moving);nativeApproach.scroll(nativeApproach.signup+90);nativeApproach.framesFor(60);
near(nativeApproach.position,nativeApproach.signup+90,'Native movement during approach completion must cancel RAF ownership');assert.equal(nativeApproach.clicks,0);
for(const phase of ['approach','zoom']){
 const test=create(),from=phase==='approach'?test.signup:test.overview;
 begin(test,from);test.touch('start',650);drag(test,570);test.scroll(from+120);test.framesFor(20);
 near(test.position,from+120,'Actual native scrolling also supersedes a held custom drag');drag(test,450,4);
 near(test.position,from+120,'Native scroll ownership persists for the rest of that contact');test.touch('end');test.framesFor(90);assert.equal(test.clicks,0);
 near(test.position,phase==='zoom'?test.overview:from+120,'Native-owned contact cannot resurrect its former release destination');
}
console.log('PASS first/later noncancelable touch moves and native takeover during approach do not fight browser scrolling');

const reduced=create({reduced:true});begin(reduced,reduced.overview);reduced.touch('start',650);drag(reduced,590);
assert.equal(reduced.clicks,0,'Reduced motion retains the touch release gate');reduced.touch('end');reduced.step();
near(reduced.position,reduced.endpoint,'Reduced motion reaches the accepted endpoint immediately');assert(!reduced.state().moving,'Reduced motion does not start a completion tween');
reduced.until(()=>reduced.state().entered,'reduced-motion quiet release');assert.equal(reduced.clicks,1);
console.log('PASS reduced motion retains release gating and skips the completion animation');

const buttonEntry=create();begin(buttonEntry,buttonEntry.overview);buttonEntry.touch('start',650);drag(buttonEntry,590);
assert(buttonEntry.state().moving,'Fixture must have an owned held drag');buttonEntry.activateButton();
assert(buttonEntry.state().entered,'The existing entry button can still activate the Vault');assert(!buttonEntry.state().moving,'Explicit button entry retires its held drag owner');
buttonEntry.touch('end');buttonEntry.framesFor(90);assert.equal(buttonEntry.clicks,1,'A late touch release cannot duplicate button entry');assert(!buttonEntry.state().moving);
console.log('PASS explicit button entry retires a held drag without late duplicate entry');

// A touch-only repair must retain the previously published wheel trajectory.
const baseline=execFileSync('git',['show','9bb78db:tools/guided/journey.js'],{cwd:root,encoding:'utf8'});
let wheelFrames=0;
for(const phase of ['approach','zoom'])for(const pattern of ['normal','reverse','burst']){
 const before=create({code:baseline}),after=create();
 for(const test of [before,after]){begin(test,phase==='approach'?test.signup:test.overview);test.wheel()}
 for(let frame=0;frame<90;frame++){
  if(pattern==='reverse'&&frame===8){before.wheel(-30);after.wheel(-30)}
  if(pattern==='burst'&&frame<35){before.wheel();after.wheel()}
  before.step();after.step();near(after.position,before.position,'Wheel '+phase+'/'+pattern+' frame'+frame);assert.deepEqual(after.state(),before.state());assert.equal(after.clicks,before.clicks);wheelFrames++;
 }
}
console.log('PASS',wheelFrames,'published wheel frames unchanged across forward, reversal and repeated bursts');
