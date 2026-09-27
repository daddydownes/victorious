'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const current=fs.readFileSync('tools/guided/journey.js','utf8');
const original=process.env.BASELINE_JS?fs.readFileSync(process.env.BASELINE_JS,'utf8'):cp.execFileSync('git',['show','bac0b908e9814487c4c7fa8d7f8f05c43cfaba1a:tools/guided/journey.js'],{encoding:'utf8'});
const extract=s=>s.slice(s.indexOf('// One owner guides'),s.indexOf('// Product delivery starts'));
function create(source){
 let now=0,id=0,rects=0,height=844,extra=0;const frames=new Map(),timers=new Map(),observers=[],events={};
 const style=()=>{const values={};return {setProperty(k,v){values[k]=v},getPropertyValue(k){return values[k]||''}}};
 const classes=()=>{const set=new Set();return {contains:k=>set.has(k),add:k=>set.add(k),remove:k=>set.delete(k),toggle(k,on){on?set.add(k):set.delete(k)}}};
 function node(name){return {id:name,inert:false,scrollTop:0,attrs:{},events:{},style:style(),classList:classes(),getAttribute(k){return this.attrs[k]},closest(){return null},contains(el){return el===this},addEventListener(k,f){(this.events[k]||=[]).push(f)},querySelector(){return heading},getBoundingClientRect(){rects++;return {top:0}},click(){for(const f of this.events.click||[])f({})},focus(){doc.activeElement=this}}}
 const heading=node('heading'),scene=node('scene'),panel=node('nextDrop'),signup=node('collectionSignup'),invitation=node('vaultInvitation'),form=node('nextDropEmail'),viewer=node('productViewer'),button=node('nextVaultHold'),screen=node('collection-screen');
 Object.defineProperty(panel,'clientHeight',{get:()=>height});Object.defineProperty(invitation,'offsetHeight',{get:()=>height*2});
 signup.getBoundingClientRect=()=>{rects++;return {top:height-panel.scrollTop}};
 invitation.getBoundingClientRect=()=>{rects++;return {top:height*2+extra-panel.scrollTop}};
 invitation.querySelector=s=>s==='.vault-descent-scene'?scene:heading;panel.querySelector=()=>screen;
 const nodes={nextDrop:panel,collectionSignup:signup,vaultInvitation:invitation,nextDropEmail:form,productViewer:viewer,nextVaultHold:button,collectionScrollCue:node('collectionScrollCue'),vaultScrollCue:node('vaultScrollCue')};
 const doc={hidden:false,activeElement:heading,body:{classList:classes()},getElementById:k=>nodes[k],addEventListener(k,f){(events[k]||=[]).push(f)}};
 const ctx={document:doc,performance:{now:()=>now},matchMedia:()=>({matches:false,addEventListener(){}}),ResizeObserver:class{constructor(fn){observers.push(fn)}observe(){}},MutationObserver:class{observe(){}},setTimeout(fn,delay){timers.set(++id,{fn,at:now+delay});return id},clearTimeout:id=>timers.delete(id),requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),addEventListener(k,f){(events[k]||=[]).push(f)},__vaultCamera:{warm(){},warmOverview(){},paint(){},cancel(){}}};ctx.window=ctx;
 vm.runInNewContext(extract(source),ctx);
 function step(){now+=16;const jobs=[...frames.values()];frames.clear();for(const fn of jobs)fn(now);for(const [key,t]of [...timers])if(t.at<=now){timers.delete(key);t.fn()}}
 function wheel(delta){for(const f of panel.events.wheel)f({target:panel,deltaX:0,deltaY:delta,preventDefault(){}})}
 function resize(h){height=h;for(const fn of events.resize||[])fn();for(const fn of observers)fn()}
 function reflow(x){extra=x;for(const fn of observers)fn()}
 function state(){return JSON.parse(JSON.stringify({top:panel.scrollTop,target:ctx.__vaultEntryGuide.target,moving:ctx.__vaultEntryGuide.moving,entered:ctx.__vaultEntryGuide.entered,progress:scene.style.getPropertyValue('--vault-progress')}))}
 return {step,wheel,resize,reflow,state,reads:()=>rects};
}
const cases=[
 {name:'normal',actions:[[2,'wheel',600],[48,'wheel',600],[94,'wheel',600]]},
 {name:'forward coalescing',actions:[[2,'wheel',600],[4,'wheel',600],[8,'wheel',600],[50,'wheel',600],[98,'wheel',600]]},
 {name:'reverse during motion',actions:[[2,'wheel',600],[12,'wheel',-30],[52,'wheel',600],[98,'wheel',600]]},
 {name:'resize during motion',actions:[[2,'wheel',600],[12,'resize',650],[52,'wheel',600],[98,'wheel',600]]},
 {name:'content reflow',actions:[[2,'wheel',600],[12,'reflow',60],[52,'wheel',600],[98,'wheel',600]]}
];
for(const test of cases){
 const a=create(original),b=create(current);for(let frame=0;frame<145;frame++){
  for(const [at,kind,value]of test.actions)if(at===frame){a[kind](value);b[kind](value)}
  a.step();b.step();assert.deepEqual(b.state(),a.state(),`${test.name}, frame ${frame}: timing/position/entry changed`);
 }
 assert(b.reads()<a.reads()/5,'Geometry reads were not substantially reduced');
 console.log('PASS',test.name,'145 identical frame states; geometry reads',a.reads(),'->',b.reads());
}
console.log('PASS: 725 baseline-matched controller frames; unchanged easing, targets, reversal, resize and entry permission.');
