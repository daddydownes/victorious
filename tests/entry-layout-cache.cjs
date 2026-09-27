'use strict';
// Run the actual old/new entry controllers against identical gesture timelines.
// This checks choreography and invalidation, not device rendering performance.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const original=process.env.ENTRY_BASELINE_PATH?fs.readFileSync(process.env.ENTRY_BASELINE_PATH,'utf8'):cp.execFileSync('git',['show','bac0b908e9814487c4c7fa8d7f8f05c43cfaba1a:tools/guided/journey.js'],{cwd:root,encoding:'utf8'});
const candidate=fs.readFileSync(path.join(root,'tools/guided/journey.js'),'utf8');
const start='// One owner guides',end='// Product delivery starts';
const extract=s=>s.slice(s.indexOf(start),s.indexOf(end));
assert.equal(candidate.slice(0,candidate.indexOf(start)),original.slice(0,original.indexOf(start)),'Keyboard fitting changed');
assert.equal(candidate.slice(candidate.indexOf(end)),original.slice(original.indexOf(end)),'Downstream product/Surface/game controller changed');
function simulate(source,initialHeight,oversized=false,hasResizeObserver=true){
 let now=0,serial=0,height=initialHeight,signupTop=height,overviewTop=height*(oversized?3.3:2),rects=0,writes=0,entries=0;
 const frames=new Map(),timers=new Map(),resizers=[],mutations=[],snapshots=[];
 class Target{
  constructor(){this.events={};this.inert=false;this.attrs={};this.children={};this.open=false;this.scrollTop=0;const values=new Map();this.style={setProperty(k,v){writes++;values.set(k,v)},getPropertyValue:k=>values.get(k)||''};const tokens=new Set();this.classList={contains:k=>tokens.has(k),add:k=>tokens.add(k),remove:k=>tokens.delete(k),toggle(k,on){if(on)tokens.add(k);else tokens.delete(k)}};}
  addEventListener(type,fn){(this.events[type]||=[]).push(fn)}
  dispatch(type,data={}){const e={target:this,preventDefault(){},stopImmediatePropagation(){},cancelable:true,...data};for(const fn of this.events[type]||[])fn(e)}
  getAttribute(k){return this.attrs[k]||'false'}
  querySelector(k){return this.children[k]||null}
  getBoundingClientRect(){rects++;return {top:0}}
  closest(){return null}
  contains(el){return el===this}
  focus(){doc.activeElement=this}
  click(){entries++;this.dispatch('click')}
 }
 const globalEvents=new Target(),doc=new Target(),panel=new Target(),signup=new Target(),invitation=new Target(),scene=new Target(),collection=new Target(),form=new Target(),button=new Target(),viewer=new Target(),heading=new Target(),cue=new Target(),vaultCue=new Target(),motion=new Target();
 motion.matches=false;doc.hidden=false;doc.body={classList:new Target().classList};doc.activeElement=panel;
 const fonts=new Target();fonts.ready={then(){}};doc.fonts=fonts;
 const nodes={nextDrop:panel,collectionSignup:signup,vaultInvitation:invitation,nextVaultHold:button,nextDropEmail:form,productViewer:viewer,collectionScrollCue:cue,vaultScrollCue:vaultCue};
 doc.getElementById=id=>nodes[id];signup.children.h2=heading;invitation.children.h2=heading;invitation.children['.vault-descent-scene']=scene;panel.children['.collection-screen']=collection;
 Object.defineProperty(panel,'clientHeight',{get:()=>height});Object.defineProperty(invitation,'offsetHeight',{get:()=>height*2});
 signup.getBoundingClientRect=()=>{rects++;return {top:signupTop-panel.scrollTop}};
 invitation.getBoundingClientRect=()=>{rects++;return {top:overviewTop-panel.scrollTop}};
 const ctx={document:doc,performance:{now:()=>now},matchMedia:()=>motion,requestAnimationFrame(fn){const id=++serial;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,at:now+delay});return id},clearTimeout:id=>timers.delete(id),addEventListener:globalEvents.addEventListener.bind(globalEvents),MutationObserver:class{constructor(fn){mutations.push(fn)}observe(){}},console};
 if(hasResizeObserver)ctx.ResizeObserver=class{constructor(fn){resizers.push(fn)}observe(){}};
 ctx.window=ctx;ctx.__vaultCamera={warm(){},warmOverview(){},paint(){},cancel(){}};
 vm.createContext(ctx);vm.runInContext(extract(source),ctx);
 function snapshot(){const g=ctx.__vaultEntryGuide;snapshots.push({top:Math.round(panel.scrollTop*1e6)/1e6,progress:scene.style.getPropertyValue('--vault-progress'),target:g.target,moving:g.moving,touching:g.touching,entered:g.entered,entries})}
 function advance(ms){const stop=now+ms;while(now<stop){now=Math.min(stop,now+16);for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn()}const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(now);snapshot()}}
 const wheel=delta=>panel.dispatch('wheel',{deltaY:delta,deltaX:0,ctrlKey:false});
 const next=()=>{wheel(900);advance(800)};
 advance(32);wheel(900);advance(192);wheel(900);advance(608);
 wheel(-900);advance(128);wheel(900);advance(800);
 wheel(-900);advance(800);next();
 overviewTop+=height*.31;for(const fn of resizers)fn();fonts.dispatch('loadingdone');panel.dispatch('scroll');advance(32);
 for(let i=0;i<8&&ctx.__vaultEntryGuide.target!=='overview';i++)next();
 assert.equal(ctx.__vaultEntryGuide.target,'overview');
 wheel(900);advance(112);wheel(-900);advance(800);
 assert.equal(entries,0);
 height=Math.max(300,Math.round(initialHeight*.75));signupTop=height;overviewTop=height*(oversized?3.3:2);globalEvents.dispatch('resize');for(const fn of resizers)fn();advance(32);
 for(let i=0;i<8&&ctx.__vaultEntryGuide.target!=='overview';i++)next();
 const touch=(id,y)=>({identifier:id,clientY:y,target:panel});
 panel.dispatch('touchstart',{touches:[touch(1,500)]});panel.dispatch('touchmove',{touches:[touch(1,400)]});advance(112);
 panel.dispatch('touchstart',{touches:[touch(1,400),touch(2,450)]});globalEvents.dispatch('touchend',{touches:[]});advance(800);
 assert.equal(entries,0,'Multi-contact cancellation entered the Vault');
 next();assert.equal(entries,1,'Fresh intent must recover after cancellation');
 return {snapshots,rects,writes};
}
for(const [height,tall]of [[844,false],[568,false],[390,true],[900,false]])for(const observer of [true,false]){
 const a=simulate(original,height,tall,observer),b=simulate(candidate,height,tall,observer);
 assert.deepEqual(b.snapshots,a.snapshots,'Motion/landing changed at '+height+' ResizeObserver='+observer);
 if(observer)assert(b.rects<a.rects*.1,'Geometry reads were not substantially reduced');
 assert(b.writes<=a.writes,'CSS writes increased');
 console.log('PASS',height,'ResizeObserver='+observer,JSON.stringify({frames:b.snapshots.length,baselineReads:a.rects,candidateReads:b.rects,baselineWrites:a.writes,candidateWrites:b.writes}));
}
