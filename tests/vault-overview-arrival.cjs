'use strict';
// Exercise the real arrival controller and camera without network or a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=process.env.VAULT_CANDIDATE_ROOT||path.resolve(__dirname,'..');
const current=fs.readFileSync(path.join(root,'tools/guided/journey.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const baseline=process.env.VAULT_BASELINE||'3fae18e';
const oldFile=name=>cp.execFileSync('git',['show',baseline+':'+name],{cwd:root,encoding:'utf8'});
const original=oldFile('tools/guided/journey.js');
const oldHtml=oldFile('index.html');
function controller(source){
 const start=source.indexOf('// One owner guides'),end=source.indexOf('// Product delivery starts',start);
 assert(start>=0&&end>start,'Guided entry controller must be present');
 return source.slice(start,end);
}
assert(html.includes(controller(current)),'Built homepage must contain the tested controller');

function create(source,{height:initialHeight=844,width=390,extra:initialExtra=0,reduced=false,hidden=false,inert=false}={}){
 let now=0,id=0,height=initialHeight,extra=initialExtra;
 const frames=new Map(),timers=new Map(),observers=[],events={},calls=[];
 const classes=()=>{const values=new Set();return {contains:k=>values.has(k),add:k=>values.add(k),remove:k=>values.delete(k),toggle(k,on){on?values.add(k):values.delete(k)}}};
 const style=()=>{const values={};return {setProperty(k,v){values[k]=v},getPropertyValue:k=>values[k]||''}};
 function node(name){return {id:name,inert:false,scrollTop:0,attrs:{},events:{},style:style(),classList:classes(),getAttribute(k){return this.attrs[k]},closest(){return null},contains(el){return el===this},addEventListener(k,fn){(this.events[k]||=[]).push(fn)},querySelector(){return heading},getBoundingClientRect(){return {top:0}},click(){emit(this,'click',{})},focus(){doc.activeElement=this}}}
 const heading=node('heading'),scene=node('scene'),panel=node('nextDrop'),signup=node('collectionSignup'),invitation=node('vaultInvitation'),form=node('nextDropEmail'),viewer=node('productViewer'),button=node('nextVaultHold'),screen=node('collection-screen');
 panel.inert=inert;
 Object.defineProperty(panel,'clientHeight',{get:()=>height});
 Object.defineProperty(invitation,'offsetHeight',{get:()=>height*2});
 signup.getBoundingClientRect=()=>({top:height-panel.scrollTop});
 invitation.getBoundingClientRect=()=>({top:height*2+extra-panel.scrollTop});
 invitation.querySelector=selector=>selector==='.vault-descent-scene'?scene:heading;
 panel.querySelector=()=>screen;
 const nodes={nextDrop:panel,collectionSignup:signup,vaultInvitation:invitation,nextDropEmail:form,productViewer:viewer,nextVaultHold:button,collectionScrollCue:node('collectionScrollCue'),vaultScrollCue:node('vaultScrollCue')};
 const doc={hidden,activeElement:heading,body:{classList:classes()},getElementById:key=>nodes[key],addEventListener(key,fn){(events[key]||=[]).push(fn)}};
 const record=(kind,args=[])=>calls.push({kind,top:panel.scrollTop,height,first:height,overview:height*2+extra,time:now,args});
 const camera={warm(){record('warm')},warmOverview(){record('overview')},paint(...args){record('paint',args)},cancel(){record('cancel')}};
 const context={document:doc,innerWidth:width,innerHeight:height,performance:{now:()=>now},matchMedia:()=>({matches:reduced,addEventListener(){}}),ResizeObserver:class{constructor(fn){observers.push(fn)}observe(){}},MutationObserver:class{observe(){}},setTimeout(fn,delay){timers.set(++id,{fn,at:now+delay});return id},clearTimeout:key=>timers.delete(key),requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame:key=>frames.delete(key),addEventListener(key,fn){(events[key]||=[]).push(fn)},__vaultCamera:camera};
 context.window=context;
 function emit(target,event,value){for(const fn of target.events[event]||[])fn(value)}
 function global(event,value={}){for(const fn of events[event]||[])fn(value)}
 vm.runInNewContext(controller(source),context);
 function step(){
  now+=16;const jobs=[...frames.values()];frames.clear();for(const fn of jobs)fn(now);
  for(const [key,timer]of [...timers])if(timer.at<=now){timers.delete(key);timer.fn()}
 }
 function framesFor(count){for(let n=0;n<count;n++)step()}
 function wheel(delta=600){emit(panel,'wheel',{target:panel,deltaX:0,deltaY:delta,preventDefault(){}})}
 function scroll(top){panel.scrollTop=top;emit(panel,'scroll',{})}
 function resize(nextHeight){height=nextHeight;context.innerHeight=height;global('resize');for(const fn of observers)fn()}
 function reflow(amount){extra=amount;for(const fn of observers)fn()}
 function touch(kind,y=600){
  const touches=kind==='end'?[]:[{identifier:1,clientY:y}];
  const event={target:panel,touches,cancelable:true,preventDefault(){}};
  if(kind==='end')global('touchend',event);else emit(panel,'touch'+kind,event);
 }
 function state(){return JSON.parse(JSON.stringify({top:panel.scrollTop,target:context.__vaultEntryGuide.target,moving:context.__vaultEntryGuide.moving,entered:context.__vaultEntryGuide.entered,touching:context.__vaultEntryGuide.touching,progress:scene.style.getPropertyValue('--vault-progress'),title:scene.style.getPropertyValue('--vault-title-opacity'),visible:panel.classList.contains('vault-camera-active')}))}
 return {step,framesFor,wheel,scroll,resize,reflow,touch,state,calls,panel,doc,global,context};
}

// Opening and the resting collection must not start archive network/decode work.
const resting=create(current,{hidden:true,inert:true});
resting.framesFor(8);assert.equal(resting.calls.filter(c=>c.kind==='warm'||c.kind==='overview').length,0);
resting.doc.hidden=false;resting.panel.inert=false;resting.resize(780);resting.framesFor(8);
assert.equal(resting.calls.filter(c=>c.kind==='warm'||c.kind==='overview').length,0,'Showing/resizing the collection must not request Vault photos');
resting.scroll(1);resting.framesFor(2);
assert.equal(resting.calls.filter(c=>c.kind==='warm'||c.kind==='overview').length,0,'A tiny collection scroll must not start archive work');

let matched=0;
for(const [name,options]of [['phone',{height:844,width:390}],['small phone',{height:568,width:320}],['landscape',{height:390,width:844,extra:340}]]){
 const test=create(current,options);
 test.framesFor(4);test.wheel();test.framesFor(44);
 const warm=test.calls.filter(c=>c.kind==='warm'),overview=test.calls.filter(c=>c.kind==='overview');
 assert.equal(warm.length,1,name+': landing warm must run once');
 assert.equal(overview.length,1,name+': full overview warm must run once');
 for(const call of [warm[0],overview[0]]){
  assert(call.top>0&&call.top<call.first,name+': loading must start during the approach to the dates');
  assert(call.top+call.height<call.overview,name+': photo loading must start before any Vault frame is visible');
 }
 assert(!test.calls.some(c=>c.kind==='paint'),name+': signup arrival must not reveal the archive');
 test.wheel(-600);test.framesFor(44);test.wheel(600);test.framesFor(44);
 test.reflow(options.extra||0);test.framesFor(4);
 assert.equal(test.calls.filter(c=>c.kind==='warm').length,1,name+': reverse/reapproach/reflow must reuse landing warm');
 assert.equal(test.calls.filter(c=>c.kind==='overview').length,1,name+': reverse/reapproach/reflow must reuse overview warm');
 for(let n=0;n<5&&!test.state().entered;n++){test.wheel(600);test.framesFor(44)}
 assert(test.state().entered,name+': guided entry must still reach the interactive handoff');
 const firstPaint=test.calls.find(c=>c.kind==='paint');
 assert(firstPaint&&overview[0].time<firstPaint.time,name+': overview preparation must precede first paint');
 assert.equal(test.calls.filter(c=>c.kind==='warm').length,1);
 assert.equal(test.calls.filter(c=>c.kind==='overview').length,1);
 console.log('PASS',name,'covered approach warms once; reversal/reflow reuse preparation; final entry retained');
}

// Identical frame-by-frame positions and state prove the scheduling change does
// not alter ordinary accepted gestures, reversal, reduced motion or handoff.
const journeys=[
 {name:'wheel',actions:[[2,'wheel',600],[48,'wheel',600],[94,'wheel',600]]},
 {name:'coalesced and reverse wheel',actions:[[2,'wheel',600],[4,'wheel',600],[12,'wheel',-30],[48,'wheel',600],[94,'wheel',600],[140,'wheel',600]]},
 {name:'single touch',actions:[[2,'touch',['start',600]],[3,'touch',['move',550]],[10,'touch',['end']],[48,'touch',['start',600]],[49,'touch',['move',550]],[56,'touch',['end']],[94,'touch',['start',600]],[95,'touch',['move',550]],[102,'touch',['end']]]},
 {name:'reduced motion',reduced:true,actions:[[2,'wheel',600],[48,'wheel',600],[94,'wheel',600]]}
];
for(const journey of journeys){
 const a=create(original,{reduced:journey.reduced}),b=create(current,{reduced:journey.reduced});
 for(let frame=0;frame<190;frame++){
  for(const [at,kind,value]of journey.actions)if(at===frame){const args=Array.isArray(value)?value:[value];a[kind](...args);b[kind](...args)}
  a.step();b.step();assert.deepEqual(b.state(),a.state(),journey.name+', frame '+frame+': arrival position or entry behavior changed');matched++;
 }
 assert(b.state().entered,journey.name+': journey must enter');
}

function camera(source,reduced,width,height){
 const start=source.indexOf('  function paintVaultCamera('),end=source.indexOf('  function cancelVaultCamera(',start);
 assert(start>=0&&end>start,'Root camera implementation must be present');
 const writes=[],vaultStyle=new Proxy({clipPath:''},{set(object,key,value){writes.push([key,value]);object[key]=value;return true}});
 const context={Math,reduced,vw:width,vh:height,PW:4100,PH:4200,S:.45,px:-570,py:-380,vaultCameraActive:true,vaultCameraZoom:1,vault:{style:vaultStyle},dive:{style:{}},prepareVaultCamera(){throw Error('Prepared camera should not restart')}};
 vm.createContext(context);vm.runInContext(source.slice(start,end),context);
 return {context,writes,paint:(progress,offset)=>context.paintVaultCamera(progress,offset)};
}
let cameraFrames=0;
for(const reduced of [false,true])for(const [width,height]of [[390,844],[844,390]]){
 const a=camera(oldHtml,reduced,width,height),b=camera(html,reduced,width,height);
 for(const [progress,offset]of [[0,height-.375],[0,height*.5],[0,.375],[0,0],[.25,0],[.75,0],[1,0],[0,height*.35]]){
  a.paint(progress,offset);b.paint(progress,offset);
  assert.equal(b.context.dive.style.transform,a.context.dive.style.transform,'Photo composition/motion must match the published camera');
  assert.equal(b.context.vaultCameraZoom,a.context.vaultCameraZoom,'Image-resolution demand must match camera magnification');
  assert.equal(b.context.vault.style.clipPath,'','Arrival must not animate a clip over the filtered archive');cameraFrames++;
 }
 assert(!b.writes.some(([key])=>key==='clipPath'),'Repeated camera paints must not write a dynamic clipping mask');
}
console.log('PASS:',matched,'published-controller frame states and',cameraFrames,'published-camera transforms unchanged; dynamic arrival clipping removed.');

const stripGuide=s=>s.replace(/<script data-demo="guided-chapters">[\s\S]*?<\/script>/,'<guided-script>');
const paint=s=>s.slice(s.indexOf('  function paintVaultCamera('),s.indexOf('  function cancelVaultCamera('));
assert.equal(stripGuide(html).replace(paint(html),paint(oldHtml)),stripGuide(oldHtml),'Root changes outside the camera and generated guide');
const beforeGuide=s=>s.slice(0,s.indexOf('// One owner guides'));
const afterGuide=s=>s.slice(s.indexOf('// Product delivery starts'));
assert.equal(beforeGuide(current),beforeGuide(original),'Signup controller changed');assert.equal(afterGuide(current),afterGuide(original),'Surface/game controllers changed');
for(const file of ['tools/guided/journey.css','tools/guided/collection.html','tools/guided/chapters.html','tools/guided/game-preview.html','assets/delivery/game-preview.html','CNAME','.nojekyll','google303d59fed389923f.html'])assert.equal(fs.readFileSync(path.join(root,file),'utf8'),oldFile(file),file+' changed');
assert.equal(cp.execFileSync('git',['diff','--name-only',baseline,'--','assets','photos','*.mp4'],{cwd:root,encoding:'utf8'}).trim(),'','Media changed');
console.log('PASS: CSS, image quality, media, signup, archive, Surface, game and hosting preserved.');
