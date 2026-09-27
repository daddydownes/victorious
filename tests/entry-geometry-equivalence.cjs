'use strict';
// Deterministic handler equivalence, not a rendered-browser or physical-device test.
// Keep the authored trajectories and entry gates while removing repeated reads.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const current=fs.readFileSync(path.join(root,'tools/guided/journey.js'),'utf8');
const original=cp.execFileSync('git',['show','bac0b908e9814487c4c7fa8d7f8f05c43cfaba1a:tools/guided/journey.js'],{cwd:root,encoding:'utf8'});
const extract=s=>s.slice(s.indexOf('// One owner guides'),s.indexOf('// Product delivery starts'));
function env(source,viewport,tall,reduced=false,useRO=true){
 let time=0,serial=0,reads=0,frames=new Map(),timers=new Map(),resize=[],mutations=[],scroll=0,entered=0,lastPaint=null;
 let layout={height:viewport,first:viewport,overview:viewport*2+(tall?700:0),sectionHeight:viewport*2};
 const events=new Map();
 function el(id){
  const listeners=new Map(),set=new Set();const e={id,inert:false,style:{setProperty(k,v){this[k]=v}},
   classList:{contains:k=>set.has(k),add:(...ks)=>ks.forEach(k=>set.add(k)),remove:(...ks)=>ks.forEach(k=>set.delete(k)),toggle(k,v){if(v===undefined)v=!set.has(k);if(v)set.add(k);else set.delete(k);return v}},
   getAttribute(){return null},addEventListener(k,f){if(!listeners.has(k))listeners.set(k,[]);listeners.get(k).push(f)},
   emit(k,detail={}){const ev={target:e,preventDefault(){},stopImmediatePropagation(){},...detail};for(const f of listeners.get(k)||[])f(ev)},
   getBoundingClientRect(){reads++;return {top:id==='nextDrop'?0:(id==='collectionSignup'?layout.first:layout.overview)-scroll}},
   closest(){return null},contains(x){return id==='nextDropEmail'&&x===input},focus(){document.activeElement=e},querySelector(k){return k==='h2'?heading:k==='.collection-screen'?collection:scene},click(){entered++;e.emit('click')}
  };return e;
 }
 const panel=el('nextDrop'),signup=el('collectionSignup'),invitation=el('vaultInvitation'),scene=el('scene'),button=el('nextVaultHold'),form=el('nextDropEmail'),viewer={open:false},collection=el('collection'),heading=el('heading'),input=el('input');
 Object.defineProperty(panel,'scrollTop',{get:()=>scroll,set:v=>{if(v!==scroll){scroll=v;panel.emit('scroll')}}});
 Object.defineProperty(panel,'clientHeight',{get:()=>layout.height});Object.defineProperty(invitation,'offsetHeight',{get:()=>layout.sectionHeight});
 const all={nextDrop:panel,collectionSignup:signup,vaultInvitation:invitation,nextVaultHold:button,nextDropEmail:form,productViewer:viewer,collectionScrollCue:el('collectionScrollCue'),vaultScrollCue:el('vaultScrollCue')};
 const body=el('body'),document={body,hidden:false,activeElement:null,getElementById:k=>all[k],addEventListener(k,f){if(!events.has(k))events.set(k,[]);events.get(k).push(f)}};
 const motion={matches:reduced,addEventListener(){}};
 const ctx={document,performance:{now:()=>time},matchMedia:()=>motion,requestAnimationFrame:f=>{frames.set(++serial,f);return serial},cancelAnimationFrame:i=>frames.delete(i),setTimeout:(f,n)=>{timers.set(++serial,{f,at:time+n});return serial},clearTimeout:i=>timers.delete(i),addEventListener:document.addEventListener,
 MutationObserver:class{constructor(f){mutations.push(f)}observe(){}},ResizeObserver:useRO?class{constructor(f){resize.push(f)}observe(){}}:undefined,
 __vaultCamera:{paint(p,o){lastPaint=[p,o]},warm(){},warmOverview(){},cancel(){lastPaint=null}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(extract(source),ctx);
 function snapshot(){const g=ctx.__vaultEntryGuide;return JSON.stringify({scroll,target:g.target,moving:g.moving,touching:g.touching,entered:g.entered,clicks:entered,progress:scene.style['--vault-progress'],paint:lastPaint})}
 const trace=[];
 function step(n=1){for(let i=0;i<n;i++){time+=1000/60;for(const [k,t] of [...timers])if(t.at<=time){timers.delete(k);t.f()}const q=[...frames];frames.clear();for(const [_,f] of q)f(time);trace.push(snapshot())}}
 return {step,trace,get reads(){return reads},get snapshot(){return snapshot()},wheel(d){panel.emit('wheel',{deltaX:0,deltaY:d,ctrlKey:false})},key(k){panel.emit('keydown',{key:k,repeat:false})},touch(y){panel.emit('touchstart',{touches:[{identifier:1,clientY:y}]})},move(y){panel.emit('touchmove',{cancelable:true,touches:[{identifier:1,clientY:y}]})},release(cancel=false){for(const f of events.get(cancel?'touchcancel':'touchend')||[])f({touches:[]})},resize(h){layout={height:h,first:h,overview:h*2+(tall?700:0),sectionHeight:h*2};for(const f of resize)f();for(const f of events.get('resize')||[])f()},reflow(extra){layout.overview+=extra;for(const f of resize)f()},hidden(v){document.hidden=v;for(const f of events.get('visibilitychange')||[])f()},focus(){document.activeElement=input;panel.emit('focusin')},blur(){document.activeElement=heading;panel.emit('focusout')}};
}
let cases=0;const counts=[];
for(const height of [390,568,844,900])for(const tall of [false,true])for(const reduced of [false,true])for(const kind of ['wheel','touch','cancel-resize','reflow','focus'])for(const useRO of [true,false]){
 const a=env(original,height,tall,reduced,useRO),b=env(current,height,tall,reduced,useRO);
 const both=(f,...args)=>{a[f](...args);b[f](...args)};
 both('step',3);
 if(kind==='touch'){
  both('touch',height*.9);both('move',height*.3);both('step',4);both('move',height*.5);both('step',40);both('release');both('step',20);
 }else{both('wheel',120);both('step',10);both('wheel',120);both('step',50)}
 if(kind==='cancel-resize'){both('touch',height*.9);both('move',height*.3);both('step',5);both('release',true);both('resize',height+60);both('step',50)}
 if(kind==='reflow'){both('reflow',93);both('step',1)}
 if(kind==='focus'){both('focus');both('step',2);both('wheel',120);both('step',50)}
 both('wheel',120);both('step',10);both('wheel',-120);both('step',50);
 both('hidden',true);both('step',5);both('hidden',false);both('step',5);
 for(let i=0;i<7;i++){both('key','PageDown');both('step',50)}
 assert.deepEqual(b.trace,a.trace,JSON.stringify({height,tall,reduced,kind,useRO}));cases++;
 if(!reduced&&!tall&&kind==='wheel'&&useRO)counts.push({height,baseline:a.reads,candidate:b.reads});
}
console.log(JSON.stringify({pass:true,cases,comparison:'Every sampled scroll position, camera progress/offset, target, movement, and entry state match baseline in deterministic handler tests; not rendered-browser evidence.',counts},null,2));
