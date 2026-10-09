// Focused phone-entry regression. A static opening isolates the new native
// scroller; subsequent input uses normal motion and actual Chromium CDP touch.
// This verifies input ownership and lifecycle, not physical iPhone frame rate.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
assert(base&&out,'Set BASE_URL and EVIDENCE_DIR');
fs.mkdirSync(out,{recursive:true});
const cases=['native-forward','cancel-before-zoom','cancel-during-zoom','reverse-during-zoom','outside-second-contact','focus-modal-recovery','toolbar-width-landings'];
const selected=process.env.QA_NATIVE_CASE?cases.filter(name=>name===process.env.QA_NATIVE_CASE):cases;
assert(selected.length,'Unknown QA_NATIVE_CASE');
const rows=[];
const save=()=>fs.writeFileSync(path.join(out,'native-entry.json'),JSON.stringify({base,rows},null,2));

async function state(page){return page.evaluate(()=>{
 const panel=document.getElementById('nextDrop'),section=document.getElementById('vaultInvitation'),vault=document.getElementById('vault'),dive=document.getElementById('dive'),rect=panel.getBoundingClientRect();
 return {phase:__guide.phase(),top:panel.scrollTop,overview:section.getBoundingClientRect().top-rect.top+panel.scrollTop,signup:document.getElementById('collectionSignup').getBoundingClientRect().top-rect.top+panel.scrollTop,height:panel.clientHeight,
  native:__vaultEntryGuide.native===true,moving:__vaultEntryGuide.moving,armed:__vaultEntryGuide.armed,touching:__vaultEntryGuide.touching,entered:__vaultEntryGuide.entered,
  entries:__nativeEntryQA.entries,paints:__nativeEntryQA.paints.length,transitions:__nativeEntryQA.transitions.length,transform:getComputedStyle(dive).transform,
  animations:dive.getAnimations().map(animation=>({playState:animation.playState,currentTime:animation.currentTime,playbackRate:animation.playbackRate,duration:animation.effect.getTiming().duration})),
  parent:vault.parentElement.id||vault.parentElement.tagName,vaultInert:vault.inert,panelInert:panel.inert,worldHidden:document.getElementById('world').hidden,scale:visualViewport?.scale||1};
})}

async function setup(browser,name){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 let submissions=0;
 await context.route('**/formsubmit.co/**',route=>{submissions++;return route.fulfill({json:{success:true}})});
 const page=await context.newPage(),row={name,status:'RUNNING',errors:[]};rows.push(row);save();
 page.setDefaultTimeout(12000);page.on('pageerror',error=>row.errors.push(error.message));
 const response=await page.goto(base,{waitUntil:'load'});
 row.sourceSha256=createHash('sha256').update(await response.body()).digest('hex');
 if(process.env.QA_SOURCE_SHA256)assert.equal(row.sourceSha256,process.env.QA_SOURCE_SHA256,'Source changed during the focused regression');
 await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#collectionScrollCue').click();
 await page.waitForFunction(()=>__vaultEntryGuide.native&&!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='signup');
 await page.evaluate(()=>{
  window.__nativeEntryQA={entries:0,paints:[],transitions:[],inputs:[]};
  const paint=__vaultCamera.paint,transition=__vaultCamera.transition;
  __vaultCamera.paint=function(...args){__nativeEntryQA.paints.push({time:performance.now(),args});return paint.apply(this,args)};
  __vaultCamera.transition=function(...args){const animation=transition.apply(this,args);__nativeEntryQA.transitions.push({time:performance.now(),args,animation:!!animation});return animation};
  document.addEventListener('touchmove',event=>{if(event.target.closest?.('#nextDrop'))__nativeEntryQA.inputs.push({time:performance.now(),y:event.touches[0]?.clientY,cancelable:event.cancelable,prevented:event.defaultPrevented,count:event.touches.length})},{passive:true});
  document.addEventListener('click',event=>{if(event.target.closest?.('#nextVaultHold'))__nativeEntryQA.entries++},{capture:true});
 });
 const cdp=await context.newCDPSession(page);
 async function touch(type,points=[]){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points})}
 async function start(y=740,id=1,x=8){await touch('touchStart',[{x,y,id}])}
 async function move(y,id=1,x=8){await touch('touchMove',[{x,y,id}]);await page.waitForTimeout(22)}
 async function release(){await touch('touchEnd')}
 async function cancel(){await touch('touchCancel')}
 async function swipe(direction=1,{distance=150,steps=8,id=1,end=true}={}){
  const from=direction>0?740:200;await start(from,id);
  for(let i=1;i<=steps;i++)await move(from-direction*distance*i/steps,id);
  if(end)await release();return from-direction*distance;
 }
 async function overview(){
  await page.locator('#vaultScrollCue').click();
  await page.waitForFunction(()=>__vaultEntryGuide.armed&&!__vaultEntryGuide.moving);
  const s=await state(page);assert.equal(s.phase,'film');assert(Math.abs(s.top-s.overview)<=2,'The overview did not settle');return s;
 }
 async function beginZoom(){
  await swipe(1,{distance:100,steps:6});
  await page.waitForFunction(()=>document.getElementById('dive').getAnimations().some(animation=>animation.playState==='running'));
  const s=await state(page);assert.equal(s.entries,0,'Zoom committed before completion');assert.equal(s.parent,'vaultInvitation');return s;
 }
 async function assertOverview(){
  await page.waitForTimeout(850);const s=await state(page);
  assert.equal(s.phase,'film');assert.equal(s.entries,0,'Cancelled/reversed gesture granted entry');assert(!s.entered);
  assert.equal(s.parent,'vaultInvitation','Cancelled entry lost the real photo preview');
  assert.equal(s.animations.length,0,'Cancelled entry left a half-finished camera animation');
  return s;
 }
 return {context,page,row,touch,start,move,release,cancel,swipe,overview,beginZoom,assertOverview,submissions:()=>submissions};
}

(async()=>{
 const browser=await chromium.launch();
 try{for(const name of selected){
  const fixture=await setup(browser,name),{context,page,row,start,move,release,cancel,swipe,overview,beginZoom,assertOverview,touch}=fixture;
  try{
   if(name==='native-forward'){
    // All transport is mocked. The normal focused form must still submit,
    // then release focus when the visitor starts onward navigation beside it.
    await page.locator('#nextDropEmailInput').fill('native-entry@example.com');
    await page.locator('#nextDropEmail button').click();
    await page.waitForFunction(()=>document.getElementById('nextDropResult').textContent.trim().length>0);
    assert.equal(fixture.submissions(),1,'The signup transport was not exercised exactly once');
    const initial=await state(page);assert(initial.native,'Phone entry did not select the native controller');assert.equal(initial.parent,'vaultInvitation');
    const paintBaseline=initial.paints,transitionBaseline=initial.transitions,samples=[];
    await start(780);
    for(let i=1;i<=14;i++){
     const y=780-i*20;await move(y);samples.push({y,...await state(page)});
    }
    const heldStart=await state(page);await page.waitForTimeout(250);const heldEnd=await state(page);
    assert(heldStart.top>initial.top+180,'The native scroller did not follow the finger while held');
    assert(Math.abs(heldStart.top-heldEnd.top)<=2,'A stationary held finger drifted before release');
    assert(samples.every(s=>s.entries===0&&!s.entered),'The approach entered while its finger was still held');
    const followError=Math.max(...samples.slice(2).map(s=>Math.abs((s.top-initial.top)-(780-s.y))));
    assert(followError<=32,'Native finger displacement deviated by '+followError+'px');
    // Continue the same contact with a large upward movement. That contact may
    // reveal/land the overview; it must never grant the separate zoom gesture.
    for(let i=1;i<=10;i++)await move(500-i*45);
    const oversizedHeld=await state(page);assert.equal(oversizedHeld.entries,0);assert.equal(oversizedHeld.transitions,transitionBaseline);
    assert.equal(oversizedHeld.paints,paintBaseline,'The browser-owned held approach called the JS camera painter');
    await release();
    await page.waitForFunction(()=>__vaultEntryGuide.armed&&!__vaultEntryGuide.moving);
    const arrived=await state(page);assert(Math.abs(arrived.top-arrived.overview)<=2);assert.equal(arrived.entries,0,'One approach contact skipped the complete overview');
    assert.equal(arrived.paints,paintBaseline,'The approach landing unnecessarily repainted the prepared camera');
    assert.equal(arrived.transitions,transitionBaseline);
    const inputs=await page.evaluate(()=>__nativeEntryQA.inputs);
    assert(inputs.length>=8,'The browser did not deliver enough native touch events');
    assert(inputs.every(input=>!input.prevented),'The approach prevented native touch scrolling');
    row.approach={initial,samples,hold:{start:heldStart,end:heldEnd},oversizedHeld,arrived,followError,inputs};
    await page.screenshot({path:path.join(out,'native-overview.png')});

    row.zoomStarted=await beginZoom();
    assert(row.zoomStarted.animations.some(animation=>animation.duration===620),'The second swipe did not start the authored WAAPI zoom');
    await start(650,2);await page.waitForTimeout(750);row.zoomHeld=await state(page);
    assert.equal(row.zoomHeld.entries,0,'A new held contact was entered underneath');
    assert(!row.zoomHeld.entered);assert.equal(row.zoomHeld.phase,'film');
    await release();await page.waitForFunction(()=>__guide.phase()==='vault'&&!document.getElementById('vault').inert);
    row.entered=await state(page);assert.equal(row.entered.entries,1,'The completed zoom must enter exactly once');
    assert(row.entered.entered);assert.equal(row.entered.parent,'BODY','The real Vault was not restored before the entry panel retired');
    assert(row.entered.panelInert&&!row.entered.vaultInert);assert.equal(row.entered.animations.length,0,'The committed camera retained a filled animation');
    assert(row.entered.scale<=1.02);await page.screenshot({path:path.join(out,'native-vault.png')});

    await page.locator('#surfaceBtn').click();
    await page.waitForFunction(()=>!document.getElementById('world').hidden&&document.body.classList.contains('world-active'));
    row.surface=await state(page);assert.equal(row.surface.parent,'BODY');assert(row.surface.vaultInert);
    // Invoke the existing return control directly to keep this a short lifecycle
    // check. The unrelated Surface film/game journey is deliberately not run.
    await page.evaluate(()=>document.getElementById('worldReturnVault').click());
    await page.waitForFunction(()=>document.getElementById('world').hidden&&__guide.phase()==='vault'&&!document.getElementById('vault').inert);
    row.returned=await state(page);assert.equal(row.returned.parent,'BODY');assert.equal(row.returned.entries,1);assert(row.returned.worldHidden);
   }else if(name==='toolbar-width-landings'){
    row.before=await state(page);
    await swipe(1,{distance:160,steps:8,end:false});
    // Controlled layout resize stands in for toolbar-height signals. It is
    // evidence of controller continuity, not an emulated iOS address bar.
    await page.setViewportSize({width:390,height:764});await page.waitForTimeout(60);
    row.toolbarHeld=await state(page);assert.equal(row.toolbarHeld.entries,0);assert.equal(row.toolbarHeld.phase,'film');assert(!row.toolbarHeld.entered);
    await release();
    await page.waitForFunction(()=>__vaultEntryGuide.armed&&!__vaultEntryGuide.moving);
    row.toolbarLanding=await state(page);assert(Math.abs(row.toolbarLanding.top-row.toolbarLanding.overview)<=2);assert.equal(row.toolbarLanding.entries,0);
    // Start a return landing and change layout width while its native tween is
    // underway. The new layout must recover to a complete readable stage.
    await swipe(-1,{distance:100,steps:6,id:2});await page.waitForTimeout(25);
    row.widthBefore=await state(page);assert(row.widthBefore.moving,'Width-change fixture missed the native landing');
    await page.setViewportSize({width:430,height:764});
    await page.waitForFunction(()=>!__vaultEntryGuide.moving);
    await page.waitForTimeout(180);row.widthLanding=await state(page);
    assert.equal(row.widthLanding.entries,0);assert.equal(row.widthLanding.phase,'film');assert(!row.widthLanding.entered);assert.equal(row.widthLanding.animations.length,0);
    const s=row.widthLanding,nearest=Math.min(Math.abs(s.top),Math.abs(s.top-s.signup),Math.abs(s.top-s.overview),Math.abs(s.top-(s.overview-s.height)));
    assert(nearest<=3,'Width resize left native entry between readable landings: '+JSON.stringify(s));
   }else{
    row.overview=await overview();
    if(name==='cancel-before-zoom'){
     await swipe(1,{distance:100,steps:6,end:false});await cancel();
     row.after=await assertOverview();assert.equal(row.after.transitions,0,'A cancelled overview swipe started zoom');
     assert(Math.abs(row.after.top-row.after.overview)<=2);
    }else if(name==='cancel-during-zoom'){
     row.zoomStarted=await beginZoom();await start(650,2);await page.waitForTimeout(100);await cancel();
     row.after=await assertOverview();assert(Math.abs(row.after.top-row.after.overview)<=2);
    }else if(name==='reverse-during-zoom'){
     row.zoomStarted=await beginZoom();await page.waitForTimeout(200);
     row.beforeReverse=await state(page);assert.notEqual(row.beforeReverse.transform,row.overview.transform,'Reverse fixture missed the intermediate camera frame');
     await start(200,2);await move(260,2);row.reverseHeld=await state(page);
     assert(row.reverseHeld.animations.some(animation=>animation.playbackRate<0&&animation.currentTime>0),'Reverse input did not reverse the browser camera effect while held');
     assert.notEqual(row.reverseHeld.transform,row.overview.transform,'Reverse input jumped immediately to the resting overview');
     assert.equal(row.reverseHeld.entries,0);assert.equal(row.reverseHeld.phase,'film');
     await release();row.after=await assertOverview();assert(Math.abs(row.after.top-row.after.overview)<=2,'Reversing zoom did not return to the whole overview');
     // Reversal consumes its existing zoom contact. A separate downward swipe
     // is the action that leaves the complete overview for the previous stage.
     await swipe(-1,{distance:100,steps:6,id:3});await page.waitForFunction(()=>!__vaultEntryGuide.moving);
     row.previousStage=await state(page);assert(row.previousStage.top<row.previousStage.overview-20,'A fresh downward swipe could not leave the overview');assert.equal(row.previousStage.entries,0);
    }else if(name==='focus-modal-recovery'){
     row.focusZoom=await beginZoom();
     await page.evaluate(()=>document.getElementById('nextDropEmailInput').focus({preventScroll:true}));
     row.focusCancelled=await assertOverview();
     assert.equal(await page.evaluate(()=>document.activeElement.id),'nextDropEmailInput','Camera cancellation stole retained email focus');
     assert.equal(row.focusCancelled.transform,row.overview.transform,'Form focus left a partial camera');
     const focusedForm=await page.locator('#nextDropEmailInput').evaluate(input=>{const r=input.getBoundingClientRect(),p=document.getElementById('nextDrop').getBoundingClientRect();return {top:r.top,bottom:r.bottom,panelTop:p.top,panelBottom:p.bottom}});
     assert(focusedForm.top>=focusedForm.panelTop-1&&focusedForm.bottom<=focusedForm.panelBottom+1,'Native form focus did not keep the input visible: '+JSON.stringify(focusedForm));
     assert(row.focusCancelled.top<=row.focusCancelled.overview+2,'Native form focus scrolled beyond the complete preview');
     row.focusCancelled.focusedForm=focusedForm;
     // Return with the existing overview control, then test an external modal
     // opening during the effect. These are controlled lifecycle signals.
     await overview();row.modalZoom=await beginZoom();
     await page.evaluate(()=>document.querySelector('.collection-open').click());
     assert(await page.evaluate(()=>document.getElementById('productViewer').open),'The existing product control did not open its modal');
     row.modalCancelled=await assertOverview();assert(Math.abs(row.modalCancelled.top-row.modalCancelled.overview)<=2);
     assert.equal(row.modalCancelled.transform,row.overview.transform,'Opening a modal left a partial camera');
     await page.evaluate(()=>document.getElementById('productViewerClose').click());
     await page.waitForFunction(()=>__vaultEntryGuide.armed&&!__vaultEntryGuide.moving);
     row.after=await state(page);assert.equal(row.after.entries,0);assert.equal(row.after.phase,'film');
    }else{
     row.zoomStarted=await beginZoom();
     // A second physical contact targets a sibling outside the entry panel.
     // Both contacts still belong to the global touch lifecycle.
     await page.evaluate(()=>{const target=document.createElement('div');target.id='nativeOutsideTouch';target.style.cssText='position:fixed;right:0;top:320px;width:30px;height:180px;z-index:2000;background:transparent;touch-action:none';document.body.appendChild(target)});
     await start(650,2);
     await touch('touchStart',[{x:8,y:650,id:2},{x:375,y:400,id:3}]);
     await page.waitForTimeout(750);row.multiHeld=await state(page);assert.equal(row.multiHeld.entries,0,'A second contact allowed pending entry');
     await touch('touchEnd',[{x:8,y:650,id:2}]);await page.waitForTimeout(80);
     assert.equal((await state(page)).entries,0,'Removing only the outside finger committed while another contact remained');
     await release();row.after=await assertOverview();assert(Math.abs(row.after.top-row.after.overview)<=2);
     await page.evaluate(()=>document.getElementById('nativeOutsideTouch').remove());
    }
    assert.equal(row.after.transform,row.overview.transform,'Cancelled/reversed camera did not return to the complete overview transform');
   }
   assert.deepEqual(row.errors,[],'Page script error');row.status='PASS';save();console.log(name+' PASS');
  }catch(error){row.status='FAIL';row.failure=error.message;row.last=await state(page).catch(()=>null);save();throw error}
  finally{await context.close()}
 }}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
