const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const {chromium,webkit,firefox}=require('playwright');
const root=path.resolve(__dirname,'..'),base=process.env.DEMO_URL||'http://127.0.0.1:59408';
const out=process.argv[2]&&path.resolve(process.argv[2]);
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const production=read('tools/vault-source.html');
const {tuneGameStages,tunePreviewStages,removeTrail}=require('../tools/production-game.cjs');
const canonical=cp.execFileSync('git',['show','e972c19:index.html'],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
assert.equal(hash(production),hash(canonical),'Pinned source must match the actual production commit');
const extract=html=>html.slice(html.indexOf('  var COUPON_THRESHOLD=100;'),html.indexOf('    /* ---- overlay open/close:'));
const story=read('experience/index.html'),preview=read('experience/game-preview.html');
assert.equal(hash(extract(story)),hash(removeTrail(tuneGameStages(extract(production)))),'The played engine must keep the production 25-clear stage progression');
assert.equal(hash(preview.slice(preview.indexOf('  var COUPON_THRESHOLD=100;'),preview.indexOf('// PRODUCTION_GAMEPLAY_END')).trimEnd()),hash(removeTrail(tunePreviewStages(extract(production))).trimEnd()),'Only the automatic preview receives ten-clear style cycling');
const old=cp.execFileSync('git',['show','52db4cb:experience/index.html'],{cwd:root,encoding:'utf8'});
assert(!old.includes('id="flapPause"')&&!old.includes('COUPON_THRESHOLD=100'),'Negative control: previous demo really had the obsolete game');
const results=[];
const configurations=[['chromium',1280,900],['chromium',320,568],['chromium',390,844],['webkit',390,844],['webkit',844,390],['firefox',1280,900]];
async function capture(page,name){if(out){
  await page.waitForFunction(()=>{const panel=document.querySelector('#flapPanel');return !panel||panel.hidden||!panel.getClientRects().length||Number(getComputedStyle(panel).opacity)>.999;},null,{timeout:2000});
  await page.screenshot({path:path.join(out,name+'.png')});
}}
async function checkToolbar(page,width,height){
  const boxes=await page.locator('.flap-top').evaluate(top=>Array.from(top.children).filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return {id:el.id||el.className,x:r.x,y:r.y,w:r.width,h:r.height}}));
  for(let i=0;i<boxes.length;i++){const b=boxes[i];assert(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=height,JSON.stringify(boxes));if(i)assert(boxes[i-1].x+boxes[i-1].w<=b.x,JSON.stringify(boxes));}
  for(const button of ['#flapExit','#flapPause']){if(await page.locator(button).isVisible()){const box=await page.locator(button).boundingBox();assert(box.width>=44&&box.height>=44);}}
  return boxes;
}
async function journey(engine,width,height){
  const browser=await({chromium,webkit,firefox})[engine].launch();
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,reducedMotion:'no-preference'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'/experience/');
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('#flapPlay').scrollIntoViewIfNeeded();
    const frame=page.frameLocator('#game-preview');
    await frame.locator('#flap').waitFor();
    await page.waitForFunction(()=>document.querySelector('#game-preview').contentWindow.__preview?.frames()>3);
    assert.equal(await page.evaluate(()=>localStorage.getItem('flapv_best')),null,'Preview never awards progress');
    await page.waitForTimeout(1800);
    await capture(page,`${engine}-${width}-painted-invitation`);
    // Capture the actual activation position, after any browser scroll needed
    // to bring a pointer target fully into view (particularly in WebKit).
    await page.locator('#flapPlay').evaluate(el=>el.addEventListener('click',()=>{window.__testGameEntryY=scrollY},{capture:true,once:true}));
    await page.locator('#flapPlay').click();
    const scroll=await page.evaluate(()=>window.__testGameEntryY);
    await page.waitForTimeout(550);
    assert.equal(await page.locator('#flapTitle').innerText(),'FLAPPY V');
    assert(await page.evaluate(()=>document.querySelector('main').inert));
    assert(await page.evaluate(()=>document.querySelector('#story-film').paused));
    assert(!await page.evaluate(()=>document.querySelector('#game-preview').contentWindow.__preview.active()));
    await capture(page,`${engine}-${width}-original-start`);
    await page.locator('#flapAction').click();
    await page.waitForFunction(()=>__flap.state()==='play');
    assert.equal(await page.evaluate(()=>__flap.dbg().gates[0].kind),'PILLAR');
    await capture(page,`${engine}-${width}-original-playing`);
    await page.locator('#flap').click({position:{x:width*.3,y:height*.4}});
    await page.locator('#flapPause').click();
    assert.equal(await page.locator('#flapTitle').innerText(),'PAUSED');
    const freeze=await page.evaluate(()=>JSON.stringify(__flap.dbg()));
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>JSON.stringify(__flap.dbg())),freeze,'Pause freezes the whole world');
    const toolbar=await checkToolbar(page,width,height);
    await capture(page,`${engine}-${width}-original-paused`);
    await page.locator('#flapAction').click();
    assert(!await page.evaluate(()=>__flap.paused()));
    await page.evaluate(()=>dispatchEvent(new Event('blur')));
    assert(await page.evaluate(()=>__flap.paused()));
    await page.locator('#flapAction').click();
    await page.waitForFunction(()=>__flap.state()==='dead',null,{timeout:8000});
    assert.equal(await page.locator('#flapTitle').innerText(),'RUN ENDED');
    await capture(page,`${engine}-${width}-original-retry`);
    await page.locator('#flapAction').click();
    assert.equal(await page.evaluate(()=>__flap.score()),0);
    await page.locator('#flapPause').click();
    const beforeResize=await page.evaluate(()=>__flap.dbg().gates.map(g=>({y:g.y,opening:g.opening})));
    await page.setViewportSize({width:height,height:width});
    await page.waitForTimeout(150);
    assert(await page.evaluate(()=>__flap.paused()));
    assert.deepEqual(await page.evaluate(()=>__flap.dbg().gates.map(g=>({y:g.y,opening:g.opening}))),beforeResize);
    await checkToolbar(page,height,width);
    await page.setViewportSize({width,height});
    await page.waitForTimeout(100);
    // Boundary fixtures exercise real spawning, rendering and HUD updates, not
    // a claim that a human completed 100 obstacles during this browser journey.
    const stages=[];
    for(const [score,kind,tier] of [[9,'PILLAR','01 / THE VAULT'],[10,'PILLAR','01 / THE VAULT'],[20,'PILLAR','01 / THE VAULT'],[24,'PILLAR','01 / THE VAULT'],[25,'ARCH','02 / GOLD ARCHES'],[49,'ARCH','02 / GOLD ARCHES'],[50,'SLANT','03 / SLALOM'],[74,'SLANT','03 / SLALOM'],[75,'IRIS','04 / FINAL LOCK']]){
      await page.evaluate(score=>{const g=__flap.dbg();g.score=score;g.gates=[];g.spawnT=0;g.y=.45;g.vy=0;},score);
      await page.locator('#flapAction').click();
      await page.waitForFunction(kind=>__flap.dbg().gates[0]?.kind===kind,kind);
      await page.locator('#flapPause').click();
      assert.equal(await page.locator('#flapTier').innerText(),tier);
      stages.push({score,kind:await page.evaluate(()=>__flap.dbg().gates[0].kind),tier});
    }
    await page.locator('#flapAction').click();
    await page.evaluate(()=>{__flap.dbg().score=100;__flap.win()});
    await page.waitForFunction(()=>document.querySelector('#flapTitle').textContent==='VAULT UNLOCKED');
    assert((await page.locator('#flapHint').innerText()).includes('VAULT-100'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('flapv_won')),'1');
    await capture(page,`${engine}-${width}-original-reward`);
    await page.locator('#flapExit').click();
    assert(!await page.evaluate(()=>__flap.isOpen()));
    assert.equal(await page.evaluate(()=>document.activeElement.id),'flapPlay');
    const returnedY=await page.evaluate(()=>scrollY);
    assert(Math.abs(returnedY-scroll)<2,`Exact return scroll after resize: ${scroll} -> ${returnedY}`);
    assert(!await page.evaluate(()=>document.querySelector('main').inert));
    // Escape during the expanding animation cancels it and restores arrow focus.
    await page.locator('#journey-play').focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'journey-play');
    assert.equal(await page.locator('#flapOverlay').evaluate(el=>el.getAnimations().length),0);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#journey-play').click();
    assert.equal(await page.locator('#flapTitle').innerText(),'MOTION IS OFF');
    await page.locator('#flapAction').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'journey-play');
    await page.locator('.vault-return').click();
    await page.locator('#surfaceBtn').waitFor({state:'visible'});
    assert.equal(new URL(page.url()).hash,'#vault');
    assert.deepEqual(errors,[]);
    results.push({engine,width,height,stages,toolbar,startPauseResumeRetry:true,resize:true,rewardFixture:true,exitFocusScroll:true,reducedMotion:true,vaultReturn:true,errors});
    console.log('PASS original game journey',engine,width,height);
  }catch(error){
    if(out){await page.screenshot({path:path.join(out,`${engine}-${width}-failure.png`)});fs.writeFileSync(path.join(out,`${engine}-${width}-failure.json`),JSON.stringify({engine,width,height,message:error.message,errors,scroll:await page.evaluate(()=>({current:scrollY,entry:window.__testGameEntryY}))},null,2));}
    throw error;
  }finally{await browser.close()}
}
(async()=>{
  if(out)fs.mkdirSync(out,{recursive:true});
  for(const args of configurations)await journey(...args);
  const report={time:new Date().toISOString(),productionCommit:'e972c19',sourceSHA256:hash(production),gameplaySHA256:hash(removeTrail(tuneGameStages(extract(production)))),negativeControl:'52db4cb fails production identity',results,limits:'Browser engines and viewport emulation; stage/reward setup uses explicit fixtures; not physical-device certification or a human 100-clear run. All nonlocal transport blocked.'};
  if(out)fs.writeFileSync(path.join(out,'production-game-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:results.length,gameplaySHA256:report.gameplaySHA256}));
})().catch(e=>{console.error(e);process.exitCode=1});
