const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR,engine=process.env.QA_ENGINE||'chromium',passes=Number(process.env.QA_PASSES||4);
assert(base&&out);fs.mkdirSync(out,{recursive:true});const rows=[];
(async()=>{
const browser=await pw[engine].launch();
try{for(let pass=1;pass<=passes;pass++){
 const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2.625,reducedMotion:'reduce'});
 await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
 const page=await context.newPage(),errors=[],row={engine,pass,staticOpening:true};rows.push(row);page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed'));
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(700);
 const label=()=>page.locator('#vault .drag-label').evaluate(el=>getComputedStyle(el).animationPlayState);
 assert.equal(await label(),'paused','Hidden Vault instruction must sleep');
 await page.locator('#collectionScrollCue').click();await page.waitForTimeout(750);
 assert.equal(await page.locator('#nextDrop').evaluate(el=>el.classList.contains('entry-content-offscreen')),false);
 await page.locator('#vaultScrollCue').click();await page.waitForFunction(()=>!window.__vaultEntryGuide.moving&&window.__vaultEntryGuide.target==='overview');
 assert(await page.locator('#nextDrop').evaluate(el=>el.classList.contains('entry-content-offscreen')));
 row.overviewRunning=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest?.('.collection-screen,.collection-signup')).length);
 assert.equal(row.overviewRunning,0,'Fully clipped chapters must not animate');
 await page.locator('#nextDrop').focus();await page.keyboard.press('PageUp');await page.waitForFunction(()=>!window.__vaultEntryGuide.moving&&window.__vaultEntryGuide.target!=='overview');
 assert.equal(await page.locator('#nextDrop').evaluate(el=>el.classList.contains('entry-content-offscreen')),false,'Reverse must wake before reveal');
 row.reversedRunning=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest?.('.collection-screen,.collection-signup')).length);
 assert(row.reversedRunning>0,'Shared light cycle failed to resume');
 await page.keyboard.press('PageDown');
 // A fixed delay can expire before an automation runner presents its last frame.
 // The next gesture belongs to a separate settled chapter, not the current move.
 await page.waitForFunction(()=>!window.__vaultEntryGuide.moving&&window.__vaultEntryGuide.target==='overview');
 await page.keyboard.press('End');
 await page.waitForFunction(()=>window.__guide.phase()==='vault'&&!document.getElementById('vault').inert);
 assert.equal(await label(),'running');
 await page.locator('#surfaceBtn').tap();await page.waitForFunction(()=>window.__worldJourney.state==='story'&&!document.getElementById('world').classList.contains('film-waiting'),{},{timeout:30000});
 assert.equal(await label(),'paused');
 await page.locator('#worldNext').click();await page.waitForFunction(()=>window.__worldJourney.state==='preview');
 await page.locator('#worldPlay').click();await page.waitForTimeout(700);await page.locator('#flapAction').click();await page.keyboard.press('p');
 await page.waitForFunction(()=>window.__flap.paused());await page.waitForTimeout(700);
 const state=()=>page.evaluate(()=>({y:window.__flap.dbg().y,vy:window.__flap.dbg().vy,score:window.__flap.score(),gates:window.__flap.dbg().gates}));
 const before=await state();await page.waitForTimeout(700);assert.deepEqual(await state(),before,'Paused world moved');
 if(engine==='chromium'){
  const cdp=await context.newCDPSession(page),events=[];cdp.on('Tracing.dataCollected',e=>events.push(...e.value));
  await cdp.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReportEvents'});await page.waitForTimeout(1200);
  const done=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');await done;
  row.pausedAnimationFrames=events.filter(e=>e.name==='FireAnimationFrame').length;
  assert.equal(row.pausedAnimationFrames,0,'Paused game still schedules browser animation frames');
 }
 if(pass===1)await page.screenshot({path:path.join(out,engine+'-paused-game.png')});
 await page.locator('#flapAction').click();await page.waitForFunction(()=>!window.__flap.paused());
 await page.locator('#flapExit').click();await page.locator('#worldReturnVault').click();await page.waitForFunction(()=>window.__guide.phase()==='vault'&&!document.getElementById('vault').inert);
 assert.equal(await label(),'running','Return must restore visible Vault motion');
 assert.deepEqual(errors,[]);row.status='PASS';console.log('PASS',JSON.stringify(row));
 }catch(e){row.status='FAIL';row.error=e.stack;row.last=await page.evaluate(()=>({phase:window.__guide?.phase(),moving:window.__vaultEntryGuide?.moving,target:window.__vaultEntryGuide?.target,top:document.getElementById('nextDrop')?.scrollTop,focus:document.activeElement?.id})).catch(()=>null);await page.screenshot({path:path.join(out,engine+'-'+pass+'-FAIL.png')}).catch(()=>{});throw e}
 finally{fs.writeFileSync(path.join(out,'performance-lifecycle-'+engine+'.json'),JSON.stringify({browser:browser.version(),rows},null,2));await context.close()}
}}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
