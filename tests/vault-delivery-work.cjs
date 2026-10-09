// Exercise real photo scheduling and decorative work at the camera handoff.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.VAULT_SOURCE||path.join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('  var vaultImageJobs='),end=html.indexOf('  /* gold dust',start);
assert(start>0&&end>start);
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function photo(width=640,ready=true){
 const classes=new Set(ready?['asset-ready']:[]),writes=[];
 const img={dataset:{original:'photos/archive.jpg',delivery:'assets/delivery/archive',tileWidth:620},style:{left:'0px',top:'0px',width:'620px',height:'826px'},naturalWidth:width,
  classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},
  writes,source:ready?'https://example.com/assets/delivery/archive-'+(width===640?'640':'1280')+'.webp':'https://example.com/preview.jpg'};
 if(!ready)img.dataset.src=img.dataset.original;
 Object.defineProperty(img,'src',{get(){return this.source},set(value){writes.push(value);this.source=new URL(value,'https://example.com/').href;this.naturalWidth=value.endsWith('archive.jpg')?1800:value.endsWith('-1280.webp')?1200:640}});
 return img;
}
function scheduler(images){
 const downloads=[],timers=new Map(),events={};let timerId=0,active=0,peak=0,decodes=0,now=1000,intersect;
 class Image{
  constructor(){downloads.push(this)}
  set src(value){this.url=value;active++;peak=Math.max(peak,active)}
  get src(){return this.url}
  finish(failed=false){active--;const callback=failed?this.onerror:this.onload;assert.equal(typeof callback,'function');callback()}
  removeAttribute(){active--}
 }
 const c={Promise,Image,WeakMap,Math,Date:{now:()=>now},innerWidth:390,innerHeight:844,devicePixelRatio:3,S:.675,vaultCameraZoom:1,vaultCameraActive:false,vaultCameraSettleUntil:0,px:0,py:0,
  IntersectionObserver:class{constructor(fn){intersect=fn}observe(){}},
  setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms,at:now+ms});return id},clearTimeout(id){timers.delete(id)},requestAnimationFrame(fn){fn()},
  plane:{querySelectorAll(selector){return images.filter(img=>selector==='img.asset-ready'?img.classList.contains('asset-ready'):selector==='img[data-src]'?!!img.dataset.src:true)}},
  decodeVaultImage(){decodes++;return Promise.resolve()},window:{addEventListener(name,fn){events[name]=fn}}};
 vm.createContext(c);vm.runInContext(html.slice(start,end),c);
 async function advance(ms){
  const target=now+ms;let runs=0;
  while(true){const next=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;
   assert(++runs<100,'Timer loop must make progress');now=next[1].at;timers.delete(next[0]);next[1].fn();await flush();
  }
  now=target;await flush();
 }
 return {c,downloads,timers,advance,intersect(){intersect([{isIntersecting:true}])},event(name){events[name]()},get now(){return now},get peak(){return peak},get decodes(){return decodes}};
}
function cameraLifecycle(test){
 const c=test.c,noop=()=>{},events=[];
 const record=(kind,...values)=>events.push({kind,values});
 function classes(name,initial=[]){const values=new Set(initial);return {contains:value=>values.has(value),add(...items){record(name+'.add',...items);items.forEach(value=>values.add(value))},remove(...items){record(name+'.remove',...items);items.forEach(value=>values.delete(value))}}}
 const style=name=>new Proxy({removeProperty(key){record(name+'.removeProperty',key)}},{set(object,key,value){record(name+'.style',key,value);object[key]=value;return true}});
 c.plane.style=style('plane');
 const next={attrs:{},setAttribute(key,value){record('next.attribute',key,value);this.attrs[key]=value}},button={disabled:false};
 const sibling={},host={},originalParent={
  insertBefore(node,before){assert.equal(before,sibling);record('restore');node.parentNode=this},
  appendChild(node){record('restore');node.parentNode=this}
 };sibling.parentNode=originalParent;
 Object.assign(c,{vaultActive:false,vaultCameraMeasurePending:false,nativePanActive:false,queueMeasure:noop,reduced:false,vault:{style:style('vault'),classList:classes('vault',['vault-previewing']),setAttribute:noop,removeAttribute:noop,focus(options){record('focus',options)}},dive:{style:style('dive')},guidePhase:'film',entryGen:0,
  paintVaultCamera(){record('paint')},hideCue:noop,setNextDropInert(node,value){if(node===next&&value)assert.notEqual(c.vault.parentNode,host,'The collection cannot make its mounted Vault inert');record('inert',node===next?'next':node===c.vault?'vault':'other',value);node.inert=value},stage:{setAttribute:noop},seamGold:{setAttribute:noop},stopInertia:noop,
  activateNativePan(){record('native')},unlock(){record('unlock');c.document.documentElement.classList.add('gutter');c.document.body.classList.remove('locked')},scrollTo(...values){record('scroll',...values)},vaultY(){assert.equal(c.vault.parentNode,originalParent,'Restore the original fixed Vault before measuring its landing');record('landing');return 731},
  vaultRevealed:false,revealVaultTitle:noop,document:{getElementById:id=>id==='nextDrop'?next:id==='nextVaultHold'?button:null,
   documentElement:{classList:classes('html')},body:{classList:classes('body',['locked','next-drop-landed','guiding'])}}});
 const handoffStart=html.indexOf('  function finishNextDropVaultHandoff('),handoffEnd=html.indexOf('  function flyIn(',handoffStart);
 assert(handoffStart>0&&handoffEnd>handoffStart);vm.runInContext(html.slice(handoffStart,handoffEnd),c);
 c.vault.parentNode=originalParent;
 const variables=html.match(/^  var vaultCameraAnimation=[^\n]+;$/m);assert(variables,'Missing camera animation ownership declarations');vm.runInContext(variables[0],c);
 const helpersStart=html.indexOf('  function restoreVaultPreview('),helpersEnd=html.indexOf('  function mountVaultPreview(',helpersStart);
 assert(helpersStart>0&&helpersEnd>helpersStart);vm.runInContext(html.slice(helpersStart,helpersEnd),c);
 const first=html.indexOf('  function cancelVaultCamera('),last=html.indexOf('  window.__vaultCamera=',first);
 assert(first>0&&last>first);vm.runInContext(html.slice(first,last),c);
 test.lifecycle={events,next,button,mountPreview(){c.vaultPreviewParent=originalParent;c.vaultPreviewNext=sibling;c.vault.parentNode=host;c.vault.classList.add('vault-inline-preview')},record};
}
const watchdog=setTimeout(()=>{console.error('FAIL: photo scheduler test left a readiness promise unresolved');process.exitCode=1},5000);
(async()=>{
 const img=photo(1200),a=scheduler([img]);
 assert.equal(a.c.vaultPhotoPixels(img),1255.5);
 for(let i=0;i<5;i++){const ready=a.c.warmVaultImages();assert.equal(a.downloads.length,0,'Same-URL demand must not schedule another request');await ready}
 assert.equal(a.downloads.length,0,'A 1200px non-upscaled 1280 derivative must not reload its own URL at 1255px demand');

 const small=photo(),b=scheduler([small]);
 const promotion=b.c.warmVaultImages();
 assert.equal(b.downloads.length,1);assert.equal(b.downloads[0].url,'assets/delivery/archive-1280.webp');
 b.downloads[0].finish();await promotion;await flush();
 assert.equal(small.naturalWidth,1200);assert.equal(b.decodes,1);
 for(let i=0;i<5;i++){const ready=b.c.warmVaultImages();assert.equal(b.downloads.length,1,'A settled derivative must not reload');await ready}
 assert.equal(b.downloads.length,1,'Promotion to the smaller-than-labelled derivative completes once');
 b.c.S=.8;
 const original=b.c.warmVaultImages();assert.equal(b.downloads[1].url,'photos/archive.jpg','Greater demand still chooses the original');
 b.downloads[1].finish(true);await original;await flush();
 assert(small.classList.contains('asset-failed'));assert.equal(small.naturalWidth,1200,'Failure retains the decoded derivative');
 const retry=b.c.warmVaultImages();assert.equal(b.downloads[2].url,'photos/archive.jpg','Failed promotions remain retryable');
 b.downloads[2].finish();await retry;await flush();
 assert(small.src.endsWith('photos/archive.jpg'));assert.equal(b.decodes,2);assert(!small.classList.contains('asset-failed'));
 b.c.S=3;await b.c.warmVaultImages();assert.equal(b.downloads.length,3,'Originals are not needlessly decoded again at higher zoom');

 const batch=Array.from({length:9},()=>{const img=photo();img.dataset.src=img.dataset.original;return img}),c=scheduler(batch);
 const ready=c.c.warmVaultImages();assert.equal(c.downloads.length,4);assert.equal(c.peak,4);
 for(let cursor=0;cursor<c.downloads.length;cursor++){c.downloads[cursor].finish();await flush()}
 await ready;assert.equal(c.downloads.length,9);assert.equal(c.peak,4);assert.equal(c.c.vaultNetworkActive,0,'Every request slot is released');

 // Intersection and viewport callbacks must not bypass the camera/settling gate.
 const movingPhoto=photo(),moving=scheduler([movingPhoto]);
 moving.c.S=.45;moving.c.vaultCameraZoom=.8;moving.c.vaultCameraActive=true;moving.c.vaultOverviewRequested=true;
 assert.equal(moving.c.vaultPhotoPixels(movingPhoto),669.6,'The fixture must need a genuine resolution upgrade');
 await moving.c.warmVaultImages();moving.intersect();moving.event('resize');await flush();
 assert.equal(moving.downloads.length,0,'Preview observer/resize demand cannot begin a resolution upgrade');
 moving.c.vaultCameraActive=false;moving.c.vaultCameraSettleUntil=moving.now+700;
 await moving.c.warmVaultImages();await moving.advance(699);moving.intersect();
 assert.equal(moving.downloads.length,0,'An unlocked archive still defers upgrades through the settling deadline');
 await moving.advance(1);const afterSettle=moving.c.warmVaultImages();
 assert.equal(moving.downloads.length,1);assert(moving.downloads[0].url.endsWith('-1280.webp'));
 moving.downloads[0].finish();await afterSettle;await flush();assert.equal(movingPhoto.writes.length,1);

 // In-flight upgrades release their slots while queued upgrades stay paused.
 // New initial deliveries must pass the paused queue rather than starve.
 const inflightPhotos=Array.from({length:9},()=>photo()),inflight=scheduler(inflightPhotos);cameraLifecycle(inflight);
 const inFlightReady=inflight.c.warmVaultImages();assert.equal(inflight.downloads.length,4);
 inflight.c.vaultCameraActive=true;
 for(let cursor=0;cursor<inflight.downloads.length;cursor++){inflight.downloads[cursor].finish();await flush()}
 assert.equal(inflight.downloads.length,4,'Queued upgrades must not start when an in-flight upgrade releases its slot');
 assert.equal(inflight.peak,4);assert.equal(inflight.c.vaultNetworkActive,0);assert.equal(inflight.c.vaultNetworkQueue.length,5);
 assert.equal(inflight.c.vaultPendingUpgrades.size,4);assert(inflightPhotos.every(img=>img.naturalWidth===640&&img.writes.length===0));
 await inflight.c.warmVaultImages();inflight.intersect();await flush();
 assert.equal(inflight.downloads.length,4,'Pending presentation must retain its resolved job and prevent duplicate fetching');
 let boundedReady=false;inFlightReady.then(()=>{boundedReady=true});await flush();assert.equal(boundedReady,false);
 await inflight.advance(8000);assert.equal(boundedReady,true,'The existing readiness fallback remains bounded while queued upgrades wait');
 assert.equal(inflight.downloads.length,4);assert.equal(inflight.c.vaultNetworkQueue.length,5,'Readiness fallback cannot start paused upgrade jobs');
 const initialBehindQueue=[photo(40,false),photo(40,false)];inflightPhotos.push(...initialBehindQueue);
 const initialBehindReady=inflight.c.warmVaultImages();assert.equal(inflight.downloads.length,6,'Initial photos bypass paused upgrades without exceeding four active downloads');
 inflight.downloads[4].finish();inflight.downloads[5].finish();await initialBehindReady;await flush();
 assert(initialBehindQueue.every(img=>img.writes.length===1));assert.equal(inflight.c.vaultNetworkQueue.length,5);assert.equal(inflight.c.vaultNetworkActive,0);
 const cancelGeneration=inflight.c.vaultCameraAnimationGeneration;
 inflight.c.cancelVaultCamera();
 assert.equal(inflight.c.vaultCameraAnimation,null,'Cancellation without a Web Animation leaves no owner');
 assert.equal(inflight.c.vaultCameraAnimationGeneration,cancelGeneration+1,'Cancellation still invalidates stale completion when no effect exists');
 assert.equal(inflight.c.vaultPendingUpgrades.size,0,'Leaving the preview flushes deferred presentation');
 assert.equal(inflight.downloads.length,10,'Cancellation also restarts queued upgrades');
 for(let cursor=6;cursor<inflight.downloads.length;cursor++){inflight.downloads[cursor].finish();await flush()}
 await inFlightReady;assert.equal(inflight.downloads.length,11);assert.equal(inflight.c.vaultNetworkActive,0);assert.equal(inflight.c.vaultNetworkQueue.length,0);
 assert(inflightPhotos.every(img=>img.naturalWidth===1200&&img.writes.length===1&&!img.dataset.src));
 inflight.c.flushVaultImageUpgrades();assert(inflightPhotos.every(img=>img.writes.length===1),'A second flush cannot apply a photo twice');

 // Initial delivery, including an initial retry, remains available during the
 // camera preview; the gate cannot strand an embedded thumbnail indefinitely.
 const firstPhotos=Array.from({length:5},()=>photo(40,false)),first=scheduler(firstPhotos);
 first.c.vaultCameraActive=true;first.c.vaultCameraZoom=.2;first.c.vaultOverviewRequested=true;
 const firstReady=first.c.warmVaultImages();assert.equal(first.downloads.length,4);
 first.downloads[0].finish(true);await flush();
 for(let cursor=1;cursor<first.downloads.length;cursor++){first.downloads[cursor].finish();await flush()}
 await firstReady;assert.equal(first.c.vaultPendingUpgrades.size,0);
 assert.equal(first.c.vaultNetworkActive,0);assert(firstPhotos.slice(1).every(img=>img.classList.contains('asset-ready')&&img.writes.length===1));
 const firstRetry=first.c.warmVaultImages();assert.equal(first.downloads.length,6,'Failed initial delivery must retry even while the camera is active');
 first.downloads[5].finish();await firstRetry;await flush();assert(firstPhotos.every(img=>img.classList.contains('asset-ready')));

 // The actual handoff function must flush held sources and request a remaining
 // nearby upgrade at its own deadline, without relying on a future observer.
 const heldPhoto=photo(),laterPhoto=photo(1200),handoff=scheduler([heldPhoto,laterPhoto]);cameraLifecycle(handoff);
 const heldReady=handoff.c.warmVaultImages();assert.equal(handoff.downloads.length,1);
 handoff.c.vaultCameraActive=true;handoff.downloads[0].finish();await heldReady;await flush();
 laterPhoto.naturalWidth=640;laterPhoto.source='https://example.com/assets/delivery/archive-640.webp';
 handoff.lifecycle.mountPreview();
 handoff.c.vaultCameraAnimation={cancel(){handoff.lifecycle.record('animation.cancel')}};
 handoff.lifecycle.events.length=0;
 handoff.c.commitVaultCamera();
 assert.equal(handoff.c.guidePhase,'vault');assert.equal(handoff.c.vaultCameraActive,false);
 const order=handoff.lifecycle.events,at=kind=>order.findIndex(event=>event.kind===kind);
 assert.equal(order[0].kind,'restore','The inline archive returns to its original parent before the handoff');
 assert(at('restore')<at('landing'),'Document landing measurement follows the required preview restoration');
 assert(at('animation.cancel')<at('landing'),'Retire the filled effect before measuring the restored Vault');
 assert(at('landing')<at('paint')&&at('landing')<at('inert')&&at('landing')<at('native'),'The landing is measured before camera painting, chapter hiding or native geometry writes');
 assert.equal(handoff.c.vaultCameraAnimation,null,'Commit clears the finished effect owner');
 const finalClass=order.findIndex(event=>event.kind==='body.add'&&event.values.includes('next-vault-open'));
 assert(finalClass>0&&finalClass<at('native'),'Final handoff chapter classes precede native activation');
 assert(at('next.attribute')<at('native'));assert(handoff.lifecycle.next.inert);assert.equal(handoff.lifecycle.next.attrs['aria-hidden'],'true');assert(handoff.lifecycle.button.disabled);
 assert(at('unlock')<at('native'),'The native scroller measures after the document is unlocked');
 assert(at('focus')>at('native')&&at('focus')>at('scroll'),'Focus follows native activation and the document scroll');
 assert.deepEqual(order.find(event=>event.kind==='scroll').values,[0,731],'The measured landing is reused without a late second layout read');
 assert.equal(order.filter(event=>event.kind==='landing').length,1);assert.equal(order.filter(event=>event.kind==='focus').length,1);
 assert.equal(order.find(event=>event.kind==='focus').values[0].preventScroll,true);
 assert.equal(heldPhoto.writes.length,0);assert.equal(handoff.downloads.length,1);
 await handoff.advance(699);assert.equal(heldPhoto.writes.length,0);assert.equal(handoff.downloads.length,1);
 await handoff.advance(1);assert.equal(heldPhoto.writes.length,1);assert.equal(handoff.c.vaultPendingUpgrades.size,0);
 assert.equal(handoff.downloads.length,2,'Handoff schedules remaining upgrades even without an observer event');
 handoff.downloads[1].finish();await flush();assert.equal(laterPhoto.writes.length,1);assert.equal(handoff.c.vaultNetworkActive,0);

 // Legacy helper callers retain automatic focus; the new explicit opt-out
 // changes only its caller's focus timing and leaves final styles identical.
 for(const deferred of [false,true]){
  const legacy=scheduler([]);cameraLifecycle(legacy);legacy.c.document.body.classList.add('next-vault-opening');legacy.lifecycle.events.length=0;
  if(deferred)legacy.c.finishNextDropVaultHandoff(true);else legacy.c.finishNextDropVaultHandoff();
  assert(legacy.c.document.body.classList.contains('next-vault-open'));assert(legacy.lifecycle.next.inert);assert(legacy.lifecycle.button.disabled);
  assert.equal(legacy.lifecycle.events.filter(event=>event.kind==='focus').length,deferred?0:1,'The helper only defers focus when explicitly requested');
 }
 const fallback=scheduler([]);cameraLifecycle(fallback);fallback.c.document.body.classList.add('next-vault-opening');let focusAttempts=0;
 fallback.c.vault.focus=options=>{focusAttempts++;if(options)throw Error('Unsupported focus options')};
 fallback.c.finishNextDropVaultHandoff();assert.equal(focusAttempts,2,'Legacy focus preserves its browser fallback');

 // If every active upgrade failed, no presentation is pending. A queue alone
 // must still resume at handoff and leave all failed promotions retryable.
 const queuedPhotos=Array.from({length:5},()=>photo()),queueOnly=scheduler(queuedPhotos);cameraLifecycle(queueOnly);
 const queueOnlyReady=queueOnly.c.warmVaultImages();queueOnly.c.vaultCameraActive=true;
 for(let i=0;i<4;i++){queueOnly.downloads[i].finish(true);await flush()}
 assert.equal(queueOnly.c.vaultPendingUpgrades.size,0);assert.equal(queueOnly.c.vaultNetworkQueue.length,1);assert.equal(queueOnly.c.vaultNetworkActive,0);
 queueOnly.c.commitVaultCamera();await queueOnly.advance(699);assert.equal(queueOnly.downloads.length,4);
 await queueOnly.advance(1);assert.equal(queueOnly.downloads.length,8,'A queue with no pending presentation must restart at the deadline, alongside bounded retries');
 for(let cursor=4;cursor<queueOnly.downloads.length;cursor++){queueOnly.downloads[cursor].finish();await flush()}
 await queueOnlyReady;assert.equal(queueOnly.downloads.length,9);assert.equal(queueOnly.peak,4);
 assert.equal(queueOnly.c.vaultNetworkQueue.length,0);assert.equal(queueOnly.c.vaultNetworkActive,0);assert(queuedPhotos.every(img=>img.naturalWidth===1200&&img.writes.length===1));

 // Failed upgrades still carry data-src. That retry path must obey the same
 // motion gate as a newly requested promotion, while preserving retry later.
 const retryPhoto=photo(),failedUpgrade=scheduler([retryPhoto]);
 const failedReady=failedUpgrade.c.warmVaultImages();failedUpgrade.downloads[0].finish(true);await failedReady;await flush();
 failedUpgrade.c.vaultCameraActive=true;
 await failedUpgrade.c.warmVaultImages();failedUpgrade.intersect();failedUpgrade.event('resize');await flush();
 assert.equal(failedUpgrade.downloads.length,1,'A failed promotion must not bypass the motion gate through retained data-src');
 failedUpgrade.c.vaultCameraActive=false;const deferredRetry=failedUpgrade.c.warmVaultImages();
 assert.equal(failedUpgrade.downloads.length,2,'A failed promotion remains retryable after motion');
 failedUpgrade.downloads[1].finish();await deferredRetry;await flush();assert.equal(retryPhoto.naturalWidth,1200);

 // Exercise the real root resize registration: visual-only Safari changes
 // during preview are no-ops, while actual layout changes remain measured.
 const resizeStart=html.indexOf("  addEventListener('resize',queueMeasure);"),resizeEnd=html.indexOf('  setInterval(',resizeStart);
 assert(resizeStart>0&&resizeEnd>resizeStart);let rootResize,visualResize,measureCalls=0;
 const viewport={addEventListener(name,fn){assert.equal(name,'resize');visualResize=fn}},resizeContext={window:{visualViewport:viewport},visualViewport:viewport,
  document:{documentElement:{clientWidth:390}},innerHeight:844,vw:390,vh:844,vaultCameraActive:true,queueMeasure(){measureCalls++},addEventListener(name,fn){assert.equal(name,'resize');rootResize=fn}};
 vm.createContext(resizeContext);vm.runInContext(html.slice(resizeStart,resizeEnd),resizeContext);
 visualResize();visualResize();assert.equal(measureCalls,0,'Visual viewport-only changes cannot rebuild an unchanged preview');
 resizeContext.innerHeight=780;visualResize();assert.equal(measureCalls,1,'A real layout height change still remeasures during preview');
 resizeContext.innerHeight=844;resizeContext.document.documentElement.clientWidth=430;visualResize();assert.equal(measureCalls,2,'A real layout width change still remeasures during preview');
 resizeContext.document.documentElement.clientWidth=390;resizeContext.vaultCameraActive=false;visualResize();assert.equal(measureCalls,3,'Outside preview the original visual-viewport behavior remains');
 resizeContext.vaultCameraActive=true;rootResize();assert.equal(measureCalls,4,'The root resize event retains its own measurement path');

 const dustStart=html.indexOf("  var dust=document.getElementById('dust')",end),dustEnd=html.indexOf('  /* hover lift',dustStart);
 assert(dustStart>0&&dustEnd>dustStart);let tick,paints=0,arcs=0;
 const canvas={width:0,height:0,getContext(){return {clearRect(){paints++},beginPath(){},arc(){arcs++},fill(){}}}},
  d={Math,parseFloat,document:{hidden:false,getElementById:()=>canvas},vault:{style:{opacity:'1'}},
   reduced:false,vaultCameraActive:true,dragging:false,inertia:null,nativePanScrolling:false,nativePanPointerDown:false,nativePanInputArmed:false,
   vw:390,vh:844,devicePixelRatio:3,setInterval(fn,ms){assert.equal(ms,50);tick=fn}};
 vm.createContext(d);vm.runInContext(html.slice(dustStart,dustEnd),d);
 tick();assert.equal(paints,0,'The photographic zoom must not repaint the decorative canvas');
 d.vaultCameraActive=false;tick();assert.equal(paints,1);assert.equal(arcs,24);assert.equal(canvas.width,780);assert.equal(canvas.height,1688);
 d.nativePanScrolling=true;tick();assert.equal(paints,1);d.nativePanScrolling=false;
 d.document.hidden=true;tick();assert.equal(paints,1);d.document.hidden=false;
 d.reduced=true;tick();assert.equal(paints,1);d.reduced=false;
 tick();assert.equal(paints,2,'Settled visible Vault dust resumes');
 console.log('PASS: same-URL deduplication; camera/settling upgrade gate; in-flight queue release and cancel flush; initial loading/retry; timed handoff promotion; handoff measurement/style/native/focus order; legacy focus fallback; failed upgrade retry gate; visual-only versus layout resize; four-request limit; decorative camera pause.');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>clearTimeout(watchdog));
