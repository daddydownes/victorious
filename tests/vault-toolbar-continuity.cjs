'use strict';
// Entry sections use stable svh while the containing panel uses dynamic dvh.
// Compare the actual controller's camera progress at identical frame times;
// this verifies resize arithmetic, not physical Safari frame throughput.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.env.SOURCE_JS||'tools/guided/journey.js','utf8');
const begin=source.indexOf('// One owner guides'),end=source.indexOf('// Product delivery starts',begin);
assert(begin>=0&&end>begin,'Guided entry controller must be present');

function create(fps){
 let now=0,id=0,height=844,entries=0,progress=0,scroll=0;
 const width=390,svh=844,overview=svh*2,sectionHeight=svh*2;
 const frames=new Map(),timers=new Map(),observers=[],windowEvents={},documentEvents={};
 const listen=(events,key,fn)=>(events[key]||=[]).push(fn);
 const dispatch=(events,type,extra={})=>{const event={type,timeStamp:now,target:panel,cancelable:true,preventDefault(){},stopImmediatePropagation(){},...extra};for(const fn of events[type]||[])fn(event)};
 function classes(){const values=new Set();return {contains:key=>values.has(key),add:(...keys)=>keys.forEach(key=>values.add(key)),remove:(...keys)=>keys.forEach(key=>values.delete(key)),toggle(key,on){if(on===undefined)on=!values.has(key);on?values.add(key):values.delete(key);return on}}}
 function style(){const values={};return {setProperty(key,value){values[key]=String(value)},getPropertyValue:key=>values[key]||'',removeProperty(key){delete values[key]}}}
 function node(name){return {id:name,inert:false,attrs:{},events:{},style:style(),classList:classes(),getAttribute(key){return this.attrs[key]},closest(){return null},contains(el){return el===this},addEventListener(key,fn){listen(this.events,key,fn)},querySelector(){return heading},getBoundingClientRect(){return {top:0,width,height}},focus(){doc.activeElement=this},click(){entries++;dispatch(this.events,'click',{target:this})}}}
 const heading=node('heading'),scene=node('scene'),panel=node('nextDrop'),signup=node('collectionSignup'),invitation=node('vaultInvitation'),form=node('nextDropEmail'),viewer=node('productViewer'),button=node('nextVaultHold'),screen=node('collection-screen');
 // The real root click handler commits paint(1) synchronously, before the
 // guide retires. Its compositor work is outside this controller arithmetic test.
 button.click=()=>{entries++;progress=1;dispatch(button.events,'click',{target:button})};
 Object.defineProperties(panel,{clientHeight:{get:()=>height},clientWidth:{get:()=>width},scrollHeight:{get:()=>svh*4},scrollTop:{get:()=>scroll,set(value){scroll=value}}});
 Object.defineProperties(invitation,{offsetHeight:{get:()=>sectionHeight},offsetTop:{get:()=>svh}});
 Object.defineProperties(signup,{offsetTop:{get:()=>svh},clientHeight:{get:()=>svh*3}});
 signup.getBoundingClientRect=()=>({top:svh-scroll,width,height:svh*3});
 invitation.getBoundingClientRect=()=>({top:overview-scroll,width,height:sectionHeight});
 invitation.querySelector=selector=>selector==='.vault-descent-scene'?scene:heading;panel.querySelector=()=>screen;
 const nodes={nextDrop:panel,collectionSignup:signup,vaultInvitation:invitation,nextDropEmail:form,productViewer:viewer,nextVaultHold:button,collectionScrollCue:node('collectionScrollCue'),vaultScrollCue:node('vaultScrollCue')};
 const root={};Object.defineProperties(root,{clientHeight:{get:()=>height},clientWidth:{get:()=>width}});
 const doc={hidden:false,activeElement:heading,documentElement:root,body:{classList:classes()},getElementById:key=>nodes[key],addEventListener(key,fn){listen(documentEvents,key,fn)}};
 const context={document:doc,performance:{now:()=>now},matchMedia:()=>({matches:false,addEventListener(){}}),ResizeObserver:class{constructor(fn){observers.push(fn)}observe(){}},MutationObserver:class{observe(){}},setTimeout(fn,delay=0){timers.set(++id,{fn,at:now+delay});return id},clearTimeout:key=>timers.delete(key),requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame:key=>frames.delete(key),addEventListener(key,fn){listen(windowEvents,key,fn)},__vaultCamera:{warm(){},warmOverview(){},paint(value){progress=value},cancel(){progress=0}}};
 Object.defineProperties(context,{innerWidth:{get:()=>width},innerHeight:{get:()=>height}});context.window=context;
 vm.runInNewContext(source.slice(begin,end),context);
 function step(){now+=1000/fps;const jobs=[...frames.values()];frames.clear();for(const fn of jobs)fn(now);for(const [key,timer]of [...timers])if(timer.at<=now){timers.delete(key);timer.fn()}}
 function framesFor(count){for(let n=0;n<count;n++)step()}
 function touch(type,y=650){const touches=type==='touchend'?[]:[{identifier:1,clientX:width/2,clientY:y}];dispatch(type==='touchend'?windowEvents:panel.events,type,{touches})}
 function resize(value){height=value;dispatch(windowEvents,'resize');for(const fn of observers)fn()}
 function settle(){for(let n=0;n<fps*3&&context.__vaultEntryGuide.moving;n++)step();assert(!context.__vaultEntryGuide.moving,'Completion must settle')}
 function state(){return {progress,top:scroll,end:overview+sectionHeight-height,moving:context.__vaultEntryGuide.moving,entered:context.__vaultEntryGuide.entered,entries,touching:context.__vaultEntryGuide.touching}}
 // Start from a fully landed overview without granting automatic entry.
 scroll=overview;dispatch(panel.events,'scroll');step();
 return {step,framesFor,touch,resize,settle,state};
}

function released(fps,displacement){
 const h=create(fps);h.touch('touchstart');h.framesFor(2);h.touch('touchmove',650-displacement);h.step();
 // A stopped finger gives identical release timing to every resize variant.
 h.framesFor(Math.ceil(fps*.1));h.touch('touchend');h.framesFor(Math.ceil(fps*.08));
 assert(h.state().progress>0&&h.state().progress<1,'Fixture must be a released partial zoom');
 return h;
}
function exactEntry(h,label){h.settle();let state=h.state();assert.equal(state.progress,1,label+': final camera frame');assert.equal(state.top,state.end,label+': native endpoint');assert.equal(state.entries,1,label+': exactly one entry');assert.equal(state.entered,true,label+': entered');h.framesFor(120);assert.equal(h.state().entries,1,label+': no late duplicate entry')}
const near=(actual,expected,label)=>assert(Math.abs(actual-expected)<1e-10,label+': '+actual+' != '+expected);
let resizeFrames=0,cases=0;
for(const fps of [60,120])for(const displacement of [100,260,420])for(const height of [700,780,900,944]){
 const control=released(fps,displacement),resized=released(fps,displacement),label=fps+'Hz, drag '+displacement+', height '+height;
 near(resized.state().progress,control.state().progress,label+': identical pre-resize state');
 resized.resize(height);
 for(let n=0;n<Math.ceil(fps*.15);n++){
  control.step();resized.step();resizeFrames++;
  near(resized.state().progress,control.state().progress,label+': resize must preserve normalized motion at frame '+n);
 }
 exactEntry(control,label+' control');exactEntry(resized,label);cases++;
}
// Multiple chrome updates cannot accumulate drift or restart the animation.
for(const fps of [60,120]){
 const control=released(fps,260),resized=released(fps,260);
 for(const height of [944,780,900,700,844]){resized.resize(height);control.step();resized.step();resizeFrames++;near(resized.state().progress,control.state().progress,fps+'Hz: repeated toolbar updates')}
 exactEntry(resized,fps+'Hz repeated toolbar updates');cases++;
}
// A second stationary contact pauses completion before it crosses intent slop.
for(const fps of [60,120])for(const height of [700,944]){
 const h=released(fps,260);h.touch('touchstart');const held=h.state().progress;
 h.resize(height);h.framesFor(Math.ceil(fps*.2));let state=h.state();
 near(state.progress,held,fps+'Hz: resize under a new stationary contact cannot move the camera');
 assert.equal(state.entries,0,'A held contact cannot enter');assert.equal(state.touching,1,'Contact remains owned');
 h.touch('touchmove',646);h.framesFor(Math.ceil(fps*.08));near(h.state().progress,held,'Subthreshold contact stays pinned');
 h.touch('touchend');exactEntry(h,fps+'Hz paused contact height '+height);cases++;
}
console.log('Vault toolbar continuity: '+cases+' cases, '+resizeFrames+' normalized frame comparisons passed (stable svh / dynamic dvh; 60/120 Hz).');
