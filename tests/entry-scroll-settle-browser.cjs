// Focused browser recovery checks. Static opening setup, then normal motion;
// lifecycle signals are controlled fixtures, not physical iPhone app switching.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
assert(base&&out,'Set BASE_URL and EVIDENCE_DIR');fs.mkdirSync(out,{recursive:true});
const rows=[];
const state=page=>page.evaluate(()=>({phase:__guide.phase(),moving:__vaultEntryGuide.moving,target:__vaultEntryGuide.target,progress:Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress')),inert:document.getElementById('vault').inert,entries:window.entryCount}));
async function run(engine){
 const browser=await pw[engine].launch();
 try{for(const scenario of ['toolbar','orientation','blur','native-idle',...(engine==='chromium'?['touchcancel','held-toolbar']:[])]){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:engine==='chromium',deviceScaleFactor:3,reducedMotion:'reduce'});
  const page=await context.newPage(),row={engine,scenario,staticOpening:true,errors:[]};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
  await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
  try{
   const response=await page.goto(base,{waitUntil:'load'});
   row.sha256=require('node:crypto').createHash('sha256').update(await response.body()).digest('hex');
   if(process.env.QA_SOURCE_SHA256)assert.equal(row.sha256,process.env.QA_SOURCE_SHA256);
   await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert);
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.locator('#collectionScrollCue').click();await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='signup');
   await page.locator('#vaultScrollCue').click();await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='overview');
   await page.locator('#nextDrop').focus();
   await page.evaluate(()=>{window.entryCount=0;let open=false;new MutationObserver(()=>{const next=document.body.classList.contains('next-vault-open');if(next&&!open)entryCount++;open=next}).observe(document.body,{attributes:true,attributeFilter:['class']})});
   if(scenario==='native-idle'){
    await page.evaluate(()=>{const p=document.getElementById('nextDrop'),v=document.getElementById('vaultInvitation');p.scrollTop=v.getBoundingClientRect().top-p.getBoundingClientRect().top+p.scrollTop+(v.offsetHeight-p.clientHeight)*.7});
   }else if(scenario==='touchcancel'||scenario==='held-toolbar'){
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:8,y:650,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:8,y:590,id:1}]});
    await page.waitForFunction(()=>Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))>.9);
    if(scenario==='held-toolbar'){
     await page.setViewportSize({width:390,height:780});
     await page.waitForTimeout(650);assert.equal((await state(page)).phase,'film','Held contact entered early');
    }
    await cdp.send('Input.dispatchTouchEvent',{type:scenario==='touchcancel'?'touchCancel':'touchEnd',touchPoints:[]});
   }else{
    await page.keyboard.press('PageDown');
    await page.waitForFunction(()=>__vaultEntryGuide.moving&&Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))>.15);
    if(scenario==='toolbar')await page.setViewportSize({width:390,height:780});
    if(scenario==='orientation')await page.setViewportSize({width:844,height:390});
    if(scenario==='blur')await page.evaluate(()=>dispatchEvent(new Event('blur')));
   }
   if(scenario!=='toolbar'&&scenario!=='held-toolbar'){
    await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='overview'&&Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))<.005);
    row.recovery=await state(page);assert.equal(row.recovery.phase,'film');assert.equal(row.recovery.entries,0);
    await page.screenshot({path:path.join(out,engine+'-'+scenario+'-recovered.png')});
    await page.locator('#nextDrop').focus();await page.keyboard.press('PageDown');
   }
   await page.waitForFunction(()=>__guide.phase()==='vault'&&!document.getElementById('vault').inert);
   row.final=await state(page);assert.equal(row.final.entries,1);assert.deepEqual(row.errors,[]);
   await page.screenshot({path:path.join(out,engine+'-'+scenario+'-entered.png')});
   row.status='PASS';console.log('PASS',engine,scenario);
  }catch(e){row.status='FAIL';row.error=e.stack;row.last=await state(page).catch(()=>null);throw e}
  finally{fs.writeFileSync(path.join(out,'settle-'+engine+'.json'),JSON.stringify(rows,null,2));await context.close()}
 }}finally{await browser.close()}
}
(async()=>{for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit']))await run(engine)})().catch(e=>{console.error(e);process.exitCode=1});
