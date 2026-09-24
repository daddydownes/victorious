// Exercise the real pre-game journey with phone swipes and desktop wheel bursts.
// BASE_URL must point at the verified explicit-root preview; no forms submit.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR,passes=Number(process.env.QA_PASSES||2);
assert(base&&out&&Number.isInteger(passes)&&passes>=1&&passes<=5,'Set BASE_URL, EVIDENCE_DIR and optional QA_PASSES (1–5)');
fs.mkdirSync(out,{recursive:true});const rows=[];
const state=page=>page.evaluate(()=>({phase:__guide.phase(),top:nextDrop.scrollTop,scene:vaultInvitation.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top,progress:Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress')),clip:vault.style.clipPath,rootTransform:vault.style.transform,scale:visualViewport.scale}));
async function phone(browser,width,height,pattern,pass){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const tag=`phone-${width}x${height}-${pattern}-${pass}`;
 try{
  await page.goto(base+'?scroll-qa='+tag,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!nextDrop.inert&&document.body.classList.contains('next-drop-landed'));
  await page.evaluate(()=>{window.__vaultOpenCount=0;new MutationObserver(()=>{if(document.body.classList.contains('next-vault-open')&&!window.__vaultWasOpen){window.__vaultOpenCount++;window.__vaultWasOpen=true}}).observe(document.body,{attributes:true,attributeFilter:['class']})});
  const cdp=await context.newCDPSession(page);
  async function swipe(direction=1,fraction=.66,steps=16){
   const start=direction>0?height*.82:height*.18,travel=height*fraction;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.5,y:start,id:1}]});
   for(let i=1;i<=steps;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.5,y:start-direction*travel*i/steps,id:1}]});
    await page.waitForTimeout(steps<10?10:14);
   }
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(650);
  }
  // Start at the opening hero, follow its automatic handoff, then scroll
  // from Previous Drops to signup with a finger on the actual page.
  await swipe();
  await page.waitForFunction(()=>Math.abs(nextDrop.scrollTop-collectionSignup.offsetTop)<4);
  const signup=await state(page);
  assert.equal(signup.phase,'film');
  await swipe(1,pattern==='oversized'?.82:.66,pattern==='oversized'?8:16);
  // Short landscape viewports keep the signup readable, so its first swipe
  // can still be inside the signup chapter before the overview appears.
  if(width>height&&(await state(page)).scene>3)await swipe();
  const overview=await state(page);
  assert.equal(overview.phase,'film','one approach swipe skipped the full overview: '+JSON.stringify(overview));
  assert.equal(overview.progress,0,'overview did not settle at its full bird-eye view: '+JSON.stringify(overview));
  assert(Math.abs(overview.scene)<3,'overview top did not align with viewport: '+JSON.stringify(overview));
  assert.equal(overview.rootTransform,'','fixed Vault layer slid as a rectangle');
  if(pattern==='reverse'){
   // Begin a real zoom, then reverse out. A stale entry-ready flag used to
   // reopen the Vault on the next forward gesture.
   await swipe(1,.25);
   assert.equal((await state(page)).phase,'film','partial zoom opened the Vault');
   await swipe(-1,.62);
   const reverse=await state(page);
   assert.equal(reverse.phase,'film','reverse swipe entered the Vault');
   assert(reverse.progress===0,'reverse swipe zoomed forward: '+JSON.stringify(reverse));
   await swipe();
   assert.equal((await state(page)).phase,'film','first forward recovery swipe skipped the overview');
  }
  await swipe();
  const landed=await state(page);
  assert.equal(landed.phase,'vault','guided second swipe did not enter: '+JSON.stringify({signup,overview,landed}));
  await page.waitForFunction(()=>!vault.inert);
  assert.equal(await page.evaluate(()=>window.__vaultOpenCount),1,'Vault opened more than once');
  assert(landed.scale<=1.02,'phone page zoom changed during entry');
  if(pass===1)await page.screenshot({path:path.join(out,tag+'-vault.png')});
  await page.locator('#surfaceBtn').tap();
  await page.waitForFunction(()=>document.body.classList.contains('world-active'));
  await page.waitForTimeout(1100);
  const film=await page.evaluate(()=>({top:worldPortrait.getBoundingClientRect().top,screen:innerHeight}));
  assert(film.top/film.screen>.07&&film.top/film.screen<.12,'Surface film starts too high: '+JSON.stringify(film));
  assert.deepEqual(errors,[]);
  rows.push({tag,status:'PASS',signup,overview,landed,film});console.log('PASS',tag);
 }catch(error){rows.push({tag,status:'FAIL',error:error.stack});await page.screenshot({path:path.join(out,tag+'-FAIL.png')}).catch(()=>{});throw error}
 finally{fs.writeFileSync(path.join(out,'scroll-stress.json'),JSON.stringify(rows,null,2));await context.close()}
}
async function wheel(browser,pattern,pass){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const tag=`wheel-${pattern}-${pass}`;
 try{
  await page.goto(base+'?scroll-qa='+tag,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!nextDrop.inert);
  await page.locator('#collectionScrollCue').click();await page.waitForFunction(()=>Math.abs(nextDrop.scrollTop-collectionSignup.offsetTop)<4&&getComputedStyle(nextDrop).scrollSnapType==='none');
  // Chromium needs a compositor frame after the final snap class is removed.
  await page.waitForTimeout(60);
  await page.mouse.move(720,700);
  async function burst(){if(pattern==='spam'){for(let i=0;i<4;i++){await page.mouse.wheel(0,1050);await page.waitForTimeout(35)}}else await page.mouse.wheel(0,2800);await page.waitForTimeout(650)}
  await burst();const overview=await state(page);
  assert.equal(overview.phase,'film','one wheel burst skipped overview: '+JSON.stringify(overview));
  assert.equal(overview.progress,0);assert(Math.abs(overview.scene)<3,'wheel overview did not settle: '+JSON.stringify(overview));
  if(pattern==='reverse'){
   await page.mouse.wheel(0,-900);await page.waitForTimeout(300);
   await page.mouse.wheel(0,100);await page.waitForTimeout(300);
   const recovery=await state(page);
   assert.equal(recovery.phase,'film','reverse wheel reentered the Vault: '+JSON.stringify(recovery));
   assert(recovery.top<overview.top-100,'reverse wheel popped forward: '+JSON.stringify(recovery));
   await burst();
   assert.equal((await state(page)).phase,'film','recovery wheel burst skipped overview');
  }
  await burst();const landed=await state(page);
  assert.equal(landed.phase,'vault','second wheel burst did not enter: '+JSON.stringify(landed));
  assert.deepEqual(errors,[]);rows.push({tag,status:'PASS',overview,landed});console.log('PASS',tag);
 }catch(error){rows.push({tag,status:'FAIL',error:error.stack});await page.screenshot({path:path.join(out,tag+'-FAIL.png')}).catch(()=>{});throw error}
 finally{fs.writeFileSync(path.join(out,'scroll-stress.json'),JSON.stringify(rows,null,2));await page.close()}
}
(async()=>{
 const browser=await pw.chromium.launch();
 try{
  if(process.env.QA_KIND!=='wheel')for(let pass=1;pass<=passes;pass++)for(const [w,h] of [[390,844],[320,568],[844,390]])for(const pattern of ['normal','oversized','reverse'])await phone(browser,w,h,pattern,pass);
  if(process.env.QA_KIND!=='phone')for(let pass=1;pass<=passes*2;pass++)for(const pattern of ['single','spam','reverse'])await wheel(browser,pattern,pass);
  console.log('PASS',rows.length,'full pre-game scroll stress journeys');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
