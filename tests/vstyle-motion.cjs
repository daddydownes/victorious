'use strict';
// Focused browser contract for the local Demo 02 motion adaptation. This uses
// the real story card and playable Flappy engine; no form transport is allowed.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.DEMO_URL||'http://127.0.0.1:8922',out=path.resolve(process.argv[2]||'/private/tmp/vctrs-vstyle-motion');
fs.mkdirSync(out,{recursive:true});
const results=[],errors=[];

function approx(actual,expected,tolerance,label){assert(Math.abs(actual-expected)<=tolerance,`${label}: ${actual} != ${expected} ±${tolerance}`)}
function parseInset(value){
 const m=String(value).match(/inset\(\s*(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+round\s+([\d.]+)px)?\s*\)/);
 assert(m,'expected four-sided inset clip, got '+value);return m.slice(1,6).map(Number);
}
async function instrument(context){
 await context.addInitScript(()=>{
 const nativeAnimate=Element.prototype.animate;window.__motionAudit=[];
  window.__escapeAudit=null;addEventListener('keydown',event=>{const overlay=document.getElementById('flapOverlay');if(event.key==='Escape'&&overlay)window.__escapeAudit={clipPath:getComputedStyle(overlay).clipPath,state:window.__flapMotion?.state()}},true);
  Element.prototype.animate=function(keyframes,options){
   const animation=nativeAnimate.call(this,keyframes,options),record={element:this,animation,keyframes,options:typeof options==='number'?{duration:options}:{...(options||{})},created:performance.now()};
   window.__motionAudit.push(record);return animation;
  };
 });
}
async function guard(context){
 await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());if(url.origin===new URL(base).origin&&['GET','HEAD'].includes(request.method()))return route.continue();return route.abort()});
}
async function auditCount(page){return page.evaluate(()=>window.__motionAudit.length)}
async function findMotion(page,start,selector,duration){
 await page.waitForFunction(({start,selector,duration})=>window.__motionAudit.slice(start).some(r=>r.element.matches(selector)&&Math.abs(Number(r.options.duration)-duration)<1),{start,selector,duration});
 return page.evaluate(({start,selector,duration})=>window.__motionAudit.findIndex((r,i)=>i>=start&&r.element.matches(selector)&&Math.abs(Number(r.options.duration)-duration)<1),{start,selector,duration});
}
async function motionInfo(page,index){return page.evaluate(index=>{const r=window.__motionAudit[index],timing=r.animation.effect.getComputedTiming(),frames=r.animation.effect.getKeyframes();return {duration:Number(r.options.duration),delay:Number(r.options.delay||0),playState:r.animation.playState,currentTime:r.animation.currentTime,frames:frames.map(f=>({clipPath:f.clipPath,transform:f.transform,opacity:f.opacity})),timing:{progress:timing.progress}}},index)}
async function waitInFlight(page,index,min=35){await page.waitForFunction(({index,min})=>{const a=window.__motionAudit[index]?.animation,d=Number(window.__motionAudit[index]?.options.duration);return a&&a.playState==='running'&&a.currentTime>min&&a.currentTime<d-70},{index,min})}
async function finishMotion(page,index){await page.evaluate(async index=>{try{await window.__motionAudit[index].animation.finished}catch{}},index)}
async function finishOpen(page,index){await finishMotion(page,index);await page.waitForFunction(()=>window.__flapMotion?.state()==='open')}
async function noOverlayMotion(page){await page.waitForFunction(()=>document.getElementById('flapOverlay').getAnimations().every(a=>a.playState!=='running'))}
async function gotoPlay(page,label){
 await page.goto(base+'/experience/?motion='+encodeURIComponent(label)+'#play',{waitUntil:'domcontentloaded'});
 await page.locator('#flapPlay').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('#play-title img').naturalWidth>0&&document.querySelector('#game-preview').contentWindow.__preview);
}
async function waitArrival(page){const start=0,index=await findMotion(page,start,'.live-game-shell',980);await finishMotion(page,index);return index}
async function openMotion(page,selector){
 const before=await auditCount(page),card=await page.locator('.live-game-shell').boundingBox(),scroll=await page.evaluate(()=>scrollY);
 assert(card&&card.width>100&&card.height>100,'playable card must be visible before entry');
 await page.locator(selector).click();const index=await findMotion(page,before,'#flapOverlay',560),info=await motionInfo(page,index),first=info.frames[0],clip=parseInset(first.clipPath);
 const expected=[Math.max(0,card.y),Math.max(0,(await page.evaluate(()=>innerWidth))-card.x-card.width),Math.max(0,(await page.evaluate(()=>innerHeight))-card.y-card.height),Math.max(0,card.x)];
 expected.forEach((value,i)=>approx(clip[i],value,1.5,'entry clip side '+i));approx(clip[4],8,1,'entry clip radius');
 assert(info.frames.every(frame=>!frame.transform||frame.transform==='none'||/translate3d\(0(?:px)?, 0(?:px)?, 0(?:px)?\) scale\(1\)/.test(frame.transform)),'entry must reveal by clip without scaling the game canvas');
 assert.equal(await page.locator('#flapOverlay').getAttribute('aria-hidden'),'false');assert.equal(await page.locator('main').evaluate(el=>el.inert),true);assert.equal(await page.evaluate(()=>document.activeElement.id),'flap','playable canvas must receive entry focus so Space starts and flaps');assert.equal(await page.evaluate(()=>__flapMotion.state()),'opening');
 return {index,card,scroll,clip};
}
async function closeMotion(page,opener){
 const before=await auditCount(page);await page.locator('#flapExit').click();const index=await findMotion(page,before,'#flapOverlay',430);assert.equal(await page.evaluate(()=>__flapMotion.state()),'closing');await finishMotion(page,index);
 await page.waitForFunction(()=>!document.getElementById('flapOverlay').classList.contains('on'));
 assert.equal(await page.locator('#flapOverlay').getAttribute('aria-hidden'),'true');assert.equal(await page.locator('main').evaluate(el=>el.inert),false);assert.equal(await page.evaluate(()=>document.activeElement.id),opener);assert.equal(await page.evaluate(()=>__flapMotion.state()),'closed');
 return index;
}
async function arrivalAndRealPlay(browser){
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});await instrument(context);await guard(context);
 await context.addInitScript(()=>{const nativeDecode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){if(this.currentSrc.includes('back-to-the-vault-vstyle-v1.svg')||this.src.includes('back-to-the-vault-vstyle-v1.svg'))return new Promise(()=>{});return nativeDecode.call(this)}});
 let releasePlay,releaseVault,playRequested=false,vaultRequested=false,markPlayRequested;const playRequest=new Promise(resolve=>markPlayRequested=resolve);
 await context.route('**/assets/play-the-game-vstyle-v1.svg',async route=>{playRequested=true;markPlayRequested();await new Promise(resolve=>releasePlay=resolve);await route.continue()});
 await context.route('**/assets/back-to-the-vault-vstyle-v1.svg',async route=>{vaultRequested=true;await new Promise(resolve=>releaseVault=resolve);await route.continue()});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/experience/?motion=decoded-arrival#play',{waitUntil:'domcontentloaded'});await page.locator('#flapPlay').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#game-preview').contentWindow.__preview);
  await page.waitForFunction(()=>document.querySelector('#play-title img').getAttribute('src').includes('play-the-game-vstyle-v1.svg'));await playRequest;
  await page.waitForTimeout(150);assert.equal((await page.evaluate(()=>window.__motionAudit.filter(r=>r.element.matches('.live-game-shell')&&Number(r.options.duration)===980).length)),0,'card arrived before its artwork decoded');
  await page.setViewportSize({width:1360,height:820});await page.locator('#flapPlay').scrollIntoViewIfNeeded();await page.waitForTimeout(75);
  assert.equal(await page.evaluate(()=>window.__flapMotion?.arrivalPlayed()),false,'pre-arrival resize consumed the one-shot arrival');assert.equal(await page.evaluate(()=>window.__motionAudit.filter(r=>r.element.matches('.live-game-shell')&&Number(r.options.duration)===980).length),0,'pre-arrival resize started the card before artwork decoded');
  await page.setViewportSize({width:1440,height:900});await page.locator('#flapPlay').scrollIntoViewIfNeeded();
  const titleBefore=await page.locator('#play-title').boundingBox();assert(playRequested,'play title request was not held');releasePlay();
  const arrival=await findMotion(page,0,'.live-game-shell',980),arrivalInfo=await motionInfo(page,arrival);assert.equal(arrivalInfo.delay,90);assert(String(arrivalInfo.frames[0].transform).includes('38px')&&String(arrivalInfo.frames[0].transform).includes('.965'),'card arrival lost its 38px/.965 origin');
  await finishMotion(page,arrival);await page.waitForFunction(()=>window.__flapMotion?.arrivalPlayed());const titleAfter=await page.locator('#play-title').boundingBox();for(const key of ['x','y','width','height'])approx(titleAfter[key],titleBefore[key],.2,'card arrival moved title '+key);
  const decorative=await page.locator('#play-title,#journey-play').evaluateAll(nodes=>nodes.flatMap(node=>node.getAnimations({subtree:true}).map(animation=>({playState:animation.playState,iterations:animation.effect.getComputedTiming().iterations}))));assert(decorative.every(animation=>animation.iterations<=1&&animation.playState!=='running'),'title or arrow retained a looping animation after the one-shot arrival: '+JSON.stringify(decorative));
  const count=await auditCount(page);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.locator('#flapPlay').scrollIntoViewIfNeeded();await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.__motionAudit.filter(r=>r.element.matches('.live-game-shell')&&Number(r.options.duration)===980).length),1,'reverse scroll replayed or erased the completed card arrival');
  assert((await auditCount(page))>=count,'motion audit unexpectedly lost records');
  const preview=page.frameLocator('#game-preview');await preview.locator('#flap').waitFor();await page.waitForFunction(()=>document.querySelector('#game-preview').contentWindow.__preview.active());const previewFrames=await preview.locator('body').evaluate(()=>window.__preview.frames());
  const opened=await openMotion(page,'#flapPlay');await finishOpen(page,opened.index);assert(!await page.evaluate(()=>document.querySelector('#game-preview').contentWindow.__preview.active()),'inline preview kept running behind playable game');await page.keyboard.press('Tab');assert(await page.locator('#flapOverlay').evaluate(el=>el.contains(document.activeElement)),'focus escaped the playable dialog');
  await page.locator('#flapAction').click();await page.waitForFunction(()=>window.__flap.state()==='play'&&window.__flap.dbg().gates.length>0&&window.__flap.dbg().vy>-.45&&!window.__flap.paused());
  await page.evaluate(()=>{window.__pointerWitness=null;document.getElementById('flap').addEventListener('pointerdown',()=>{const before={state:__flap.state(),vy:__flap.dbg().vy,kind:__flap.dbg().gates[0]?.kind};queueMicrotask(()=>window.__pointerWitness={before,after:{state:__flap.state(),vy:__flap.dbg().vy}})},{capture:true,once:true})});
  await page.locator('#flap').click({position:{x:360,y:420}});await page.waitForFunction(()=>window.__pointerWitness?.after);const pointerWitness=await page.evaluate(()=>window.__pointerWitness);assert.equal(pointerWitness.before.state,'play');assert.equal(pointerWitness.before.kind,'PILLAR');assert.equal(pointerWitness.after.state,'play');assert(pointerWitness.after.vy<pointerWitness.before.vy&&pointerWitness.after.vy<=-.6,'real pointer did not apply the flap impulse: '+JSON.stringify(pointerWitness));
  await closeMotion(page,'flapPlay');approx(await page.evaluate(()=>scrollY),opened.scroll,1,'return scroll');await page.waitForFunction(()=>document.querySelector('#game-preview').contentWindow.__preview.active());assert((await preview.locator('body').evaluate(()=>window.__preview.frames()))>=previewFrames);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('#game-preview').contentWindow.__preview.active());await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('#game-preview').contentWindow.__preview.active());
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>!document.querySelector('#game-preview').contentWindow.__preview.active());await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>document.querySelector('#game-preview').contentWindow.__preview.active());
  assert.equal(await page.locator('#flapOverlay iframe').count(),0,'motion substituted an automatic demo for the playable engine');
  results.push({case:'decoded one-shot arrival and real playable entry',arrival:arrivalInfo,previewPausedBehindGame:true,startAndFlap:pointerWitness,vaultRequestHeld:vaultRequested});
 }finally{if(releasePlay)releasePlay();if(releaseVault)releaseVault();await context.close()}
}
async function earlyEscapeAndCycles(browser){
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});await instrument(context);await guard(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  await gotoPlay(page,'early-escape');await waitArrival(page);await page.locator('#journey-play').scrollIntoViewIfNeeded();
  const opened=await openMotion(page,'#journey-play');await waitInFlight(page,opened.index,55);await page.screenshot({path:path.join(out,'desktop-1440x900-entry-midflight.png')});await waitInFlight(page,opened.index,55);
  const before=await auditCount(page);await page.keyboard.press('Escape');const escapeAudit=await page.evaluate(()=>window.__escapeAudit);assert.equal(escapeAudit.state,'opening','Escape was not dispatched during opening');const sampled=parseInset(escapeAudit.clipPath),closing=await findMotion(page,before,'#flapOverlay',430),closeInfo=await motionInfo(page,closing),closeStart=parseInset(closeInfo.frames[0].clipPath);
  sampled.slice(0,4).forEach((value,i)=>approx(closeStart[i],value,2,'early Escape sampled clip '+i));await finishMotion(page,closing);await page.waitForFunction(()=>!document.getElementById('flapOverlay').classList.contains('on'));assert.equal(await page.evaluate(()=>document.activeElement.id),'journey-play');approx(await page.evaluate(()=>scrollY),opened.scroll,1,'early Escape scroll');
  for(const selector of ['#flapPlay','#journey-play','#flapPlay']){
   await page.locator(selector).scrollIntoViewIfNeeded();const next=await openMotion(page,selector);await finishOpen(page,next.index);await closeMotion(page,selector.slice(1));assert.equal(await page.locator('#flapOverlay').evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length),0);
  }
  results.push({case:'early Escape sampled reversal and repeated guards',sampledClip:sampled,closeStart,cycles:3});
 }finally{await context.close()}
}
async function settleRaces(browser){
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});await instrument(context);await guard(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 async function hidden(value){await page.evaluate(value=>{if(value)Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});else delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))},value)}
 async function modify(kind,on){if(kind==='reduced')await page.emulateMedia({reducedMotion:on?'reduce':'no-preference'});else if(kind==='hidden')await hidden(on);else if(kind==='resize')await page.setViewportSize(on?{width:1360,height:820}:{width:1440,height:900})}
 try{
  for(const kind of ['resize','reduced','hidden'])for(const phase of ['opening','closing']){
   await modify('reduced',false);await modify('hidden',false);await page.setViewportSize({width:1440,height:900});await gotoPlay(page,kind+'-'+phase);await waitArrival(page);
   const scroll=await page.evaluate(()=>scrollY),opened=await openMotion(page,'#flapPlay');
   if(phase==='opening'){
    await waitInFlight(page,opened.index);await modify(kind,true);await noOverlayMotion(page);assert.equal(await page.locator('#flapOverlay').evaluate(el=>el.classList.contains('on')),true,kind+' during opening must settle open');assert.equal(await page.locator('main').evaluate(el=>el.inert),true);
    if(kind==='hidden')assert(await page.evaluate(()=>document.hidden));
    await page.locator('#flapExit').click();await page.waitForFunction(()=>!document.getElementById('flapOverlay').classList.contains('on'));
   }else{
    await finishOpen(page,opened.index);const start=await auditCount(page);await page.locator('#flapExit').click();const closing=await findMotion(page,start,'#flapOverlay',430);await waitInFlight(page,closing);await modify(kind,true);await noOverlayMotion(page);await page.waitForFunction(()=>!document.getElementById('flapOverlay').classList.contains('on'));assert.equal(await page.locator('main').evaluate(el=>el.inert),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'flapPlay');approx(await page.evaluate(()=>scrollY),scroll,1,kind+' closing scroll');
   }
   await modify(kind,false);results.push({case:kind+' settles '+phase,result:'PASS'});
  }
 }finally{await context.close()}
}
async function closingInputRace(browser){
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});await instrument(context);await guard(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  await gotoPlay(page,'closing-input-race');await waitArrival(page);const opened=await openMotion(page,'#flapPlay');await finishOpen(page,opened.index);await page.locator('#flapAction').click();await page.waitForFunction(()=>__flap.state()==='play'&&__flap.dbg().gates.length>0);
  const start=await auditCount(page);await page.locator('#flapExit').click();const closing=await findMotion(page,start,'#flapOverlay',430);await waitInFlight(page,closing);
  await page.evaluate(()=>{const canvas=document.getElementById('flap');canvas.focus({preventScroll:true});dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));canvas.dispatchEvent(new PointerEvent('pointerdown',{button:0,isPrimary:true,bubbles:true,cancelable:true}))});assert.equal(await page.evaluate(()=>__flap.paused()),true,'Space or pointer restarted the game loop during close');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.getElementById('flapOverlay').classList.contains('on'));assert.equal(await page.evaluate(()=>__flapMotion.state()),'closed');assert.equal(await page.evaluate(()=>__flap.isOpen()),false);assert.equal(await page.evaluate(()=>__flap.paused()),true);assert.equal(await page.evaluate(()=>document.activeElement.id),'flapPlay');approx(await page.evaluate(()=>scrollY),opened.scroll,1,'closing input-race scroll');
  const stable=await page.evaluate(()=>({game:JSON.stringify(__flap.dbg()),title:document.getElementById('flapTitle').textContent,score:document.getElementById('flapScore').textContent}));await page.waitForTimeout(500);assert.deepEqual(await page.evaluate(()=>({game:JSON.stringify(__flap.dbg()),title:document.getElementById('flapTitle').textContent,score:document.getElementById('flapScore').textContent})),stable,'late game work mutated state after closing settled');
  results.push({case:'closing ignores Space and pointer before reduced-motion settlement',stableAfterMs:500});
 }finally{await context.close()}
}
async function viewportShots(browser,width,height,label){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width===390,reducedMotion:'no-preference'});await instrument(context);await guard(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  await gotoPlay(page,label);await waitArrival(page);await page.screenshot({path:path.join(out,label+'-arrival.png')});const opened=await openMotion(page,'#flapPlay');await waitInFlight(page,opened.index,130);await page.screenshot({path:path.join(out,label+'-entry-midflight.png')});await finishOpen(page,opened.index);
  for(const selector of ['#flapExit','#flapAction']){const r=await page.locator(selector).boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height,selector+' outside '+width+'x'+height)}
  await page.screenshot({path:path.join(out,label+'-open.png')});await closeMotion(page,'flapPlay');results.push({case:label+' responsive motion',width,height});
 }finally{await context.close()}
}

(async()=>{const browser=await chromium.launch({headless:true});try{await arrivalAndRealPlay(browser);await earlyEscapeAndCycles(browser);await settleRaces(browser);await closingInputRace(browser);await viewportShots(browser,390,844,'phone-390x844');await viewportShots(browser,844,390,'landscape-844x390');await viewportShots(browser,540,360,'compact-540x360');assert.deepEqual(errors,[]);const report={checkedAt:new Date().toISOString(),base,results,errors,limits:'Headless Chromium and emulated viewports. Arrival delay uses a local held asset; hidden state is an injected lifecycle fixture. One real-game start/flap is not human playability or physical-device evidence. All nonlocal transport is blocked.'};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:true,cases:results.length,errors:errors.length,artifacts:out}))}finally{await browser.close()}})().catch(error=>{fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:error.stack,results,errors},null,2));console.error(error);process.exitCode=1});
