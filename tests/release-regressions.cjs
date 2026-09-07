// Focused release regressions for the September 7 root/story fixes. All network
// access is local; signup responses are controlled in-page and never submitted.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.DEMO_URL||'http://127.0.0.1:59408';
const out=path.resolve(process.argv[2]||'/private/tmp/vctrs-release-regressions');
const only=process.env.RELEASE_CASE||'';
fs.mkdirSync(out,{recursive:true});
const results=[];
async function guard(context){await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());return url.origin===new URL(base).origin&&['GET','HEAD'].includes(request.method())?route.continue():route.abort()})}
async function nextDrop(page){
 await page.waitForFunction(()=>window.__guide&&document.getElementById('film'));
 if(await page.evaluate(()=>window.__guide.heroPhase()==='ready'))await page.mouse.wheel(0,300);
 await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed'),null,{timeout:20000});
}
async function bodyAX(page){return page.locator('body').ariaSnapshot()}
async function shortEntry(engine,width,height){
 const browser=await({chromium,webkit})[engine].launch(),context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'no-preference'});await guard(context);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
 try{
  await page.goto(base+'/?regression=short-'+engine+'-'+width,{waitUntil:'domcontentloaded'});await nextDrop(page);
  const geometry=await page.evaluate(()=>{const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}},row=rect('.next-drop-email-row'),input=rect('#nextDropEmailInput'),join=rect('#nextDropEmail button'),button=rect('#nextVaultHold'),card=rect('.next-drop-card');return {innerHeight,row,input,join,button,card,scrollHeight:document.documentElement.scrollHeight}});
  for(const [name,rect] of [['email row',geometry.row],['email input',geometry.input],['email submit',geometry.join],['vault entrance',geometry.button]]){assert(rect.top>=-.5,name+' begins above '+height+': '+JSON.stringify(geometry));assert(rect.bottom<=height+.5,name+' is clipped below '+height+': '+JSON.stringify(geometry));assert(rect.width>0&&rect.height>0,name+' has no hit area: '+JSON.stringify(geometry))}
  assert(geometry.button.height>=44,'entrance retains a 44px touch target: '+JSON.stringify(geometry));
  await page.screenshot({path:path.join(out,`${engine}-${width}x${height}-next-drop.png`)});
  await page.touchscreen.tap(geometry.join.left+geometry.join.width/2,geometry.join.top+geometry.join.height/2);await page.waitForFunction(()=>document.getElementById('nextDropResult').textContent==='CHECK THAT ADDRESS');assert.equal(await page.evaluate(()=>document.activeElement.id),'nextDropEmailInput');
  const tap=await page.locator('#nextVaultHold').boundingBox();await page.touchscreen.tap(tap.x+tap.width/2,tap.y+tap.height/2);await page.waitForFunction(()=>window.__guide.phase()==='vault');await page.locator('#surfaceBtn').waitFor({state:'visible'});
  assert.equal(await page.locator('#stage').evaluate(el=>el.inert),true,'the opening stage stays outside focus/AX while the vault is active');
  assert.deepEqual(errors,[]);results.push({case:'short-entry',engine,width,height,geometry,result:'PASS'});
 }finally{await context.close();await browser.close()}
}
async function reducedFocusAndVault(){
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,reducedMotion:'reduce'});await guard(context);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
 try{
  await page.goto(base+'/?regression=reduced-focus',{waitUntil:'domcontentloaded'});await nextDrop(page);
  assert.equal((await page.locator('#seamRcv').textContent()).trim(),'','receipt text must not exist before signup succeeds');
  assert(!(await bodyAX(page)).includes('RECEIVED. THE VAULT HAS IT.'),'pre-success receipt must be absent from accessibility output');
  await page.locator('#nextDropEmailInput').focus();const sequence=[];
  for(let i=0;i<7;i++){
   sequence.push(await page.evaluate(()=>({id:document.activeElement.id,tag:document.activeElement.tagName,inLegacySeam:document.getElementById('seamGold').contains(document.activeElement),visible:!!document.activeElement.getClientRects().length})));
   await page.keyboard.press('Tab');
  }
  assert(sequence.every(step=>!step.inLegacySeam),'reduced-motion Tab entered the covered legacy seam: '+JSON.stringify(sequence));
  await page.locator('#nextVaultHold').click();await page.waitForFunction(()=>window.__guide.phase()==='vault');await page.locator('#surfaceBtn').waitFor({state:'visible'});
  assert.equal(await page.locator('#stage').evaluate(el=>el.inert),true);assert(!(await bodyAX(page)).includes('VCTRS — scroll to continue'));
  await page.locator('#surfaceBtn').click();await page.waitForURL(base+'/experience/');assert.equal(await page.locator('main').evaluate(el=>el.inert),false);
  await page.locator('.vault-return').click();await page.waitForURL(base+'/#vault');await page.locator('#surfaceBtn').waitFor({state:'visible'});assert.equal(await page.locator('#stage').evaluate(el=>el.inert),true);
  assert.deepEqual(errors,[]);results.push({case:'reduced-focus-vault-return',sequence,result:'PASS'});
 }finally{await context.close();await browser.close()}
}
async function motionToggleDuringEntry(){
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});await guard(context);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
 try{
  await page.goto(base+'/?regression=motion-toggle',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__guide&&document.getElementById('film'));
  const entering=page.waitForFunction(()=>document.body.classList.contains('next-drop-entering'),null,{timeout:20000});
  await page.mouse.wheel(0,300);await entering;await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed'));
  assert.equal(await page.locator('#nextDrop').evaluate(el=>el.inert),false);assert.equal(await page.locator('#nextVaultHold').isEnabled(),true);
  await page.locator('#nextVaultHold').click();await page.waitForFunction(()=>window.__guide.phase()==='vault');assert.deepEqual(errors,[]);
  results.push({case:'motion-toggle-during-entry',result:'PASS'});
 }finally{await context.close();await browser.close()}
}
async function receiptTransport(){
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await guard(context);
 await context.addInitScript(()=>{const originalFetch=window.fetch.bind(window),originalTimeout=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>originalTimeout(fn,ms===12000?120:ms,...args);window.__receiptMock={calls:0,pending:[],settle(index,ok){this.pending[index](new Response(JSON.stringify({success:ok}),{status:ok?200:500,headers:{'Content-Type':'application/json'}}))}};window.fetch=(url,options)=>{if(new URL(url,location.href).hostname!=='formsubmit.co')return originalFetch(url,options);window.__receiptMock.calls++;return new Promise(resolve=>window.__receiptMock.pending.push(resolve))}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
 try{
  await page.goto(base+'/?regression=receipt',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__guide&&document.getElementById('signupForm'));
  assert.equal((await page.locator('#seamRcv').textContent()).trim(),'');assert(!(await bodyAX(page)).includes('RECEIVED. THE VAULT HAS IT.'));
  await page.evaluate(()=>{const seam=document.getElementById('seamGold');seam.inert=false;seam.removeAttribute('aria-hidden')});
  await page.locator('#signupEmail').focus();await page.locator('#signupEmail').fill('timeout@example.invalid');await page.evaluate(()=>document.getElementById('signupForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await page.waitForFunction(()=>window.__receiptMock.calls===1);
  assert.equal(await page.locator('#signup').evaluate(el=>el.classList.contains('done')),false,'pending transport must not expose success');assert.equal((await page.locator('#seamRcv').textContent()).trim(),'');
  await page.waitForFunction(()=>document.querySelector('#signup .err').textContent.includes('NOT SENT'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'signupEmail');assert.equal(await page.locator('#signupForm').getAttribute('aria-busy'),null);
  await page.evaluate(()=>window.__receiptMock.settle(0,true));await page.waitForTimeout(100);
  assert.equal(await page.locator('#signup').evaluate(el=>el.classList.contains('done')),false,'late success after timeout must be ignored');assert.equal((await page.locator('#seamRcv').textContent()).trim(),'');
  await page.locator('#signupEmail').fill('failure@example.invalid');await page.evaluate(()=>document.getElementById('signupForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await page.waitForFunction(()=>window.__receiptMock.calls===2);await page.evaluate(()=>window.__receiptMock.settle(1,false));await page.waitForFunction(()=>document.querySelector('#signup .err').textContent.includes('NOT SENT'));
  assert.equal(await page.locator('#signup').evaluate(el=>el.classList.contains('done')),false);assert.equal((await page.locator('#seamRcv').textContent()).trim(),'');assert.equal(await page.evaluate(()=>document.activeElement.id),'signupEmail');
  await page.locator('#signupEmail').fill('success@example.invalid');await page.evaluate(()=>document.getElementById('signupForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await page.waitForFunction(()=>window.__receiptMock.calls===3);
  assert.equal(await page.locator('#signup').evaluate(el=>el.classList.contains('done')),false);assert.equal((await page.locator('#seamRcv').textContent()).trim(),'');
  await page.evaluate(()=>window.__receiptMock.settle(2,true));await page.waitForFunction(()=>document.getElementById('signup').classList.contains('done'));
  const receipt=(await page.locator('#seamRcv').textContent()).trim();assert.equal(receipt,'RECEIVED. THE VAULT HAS IT.');assert((await bodyAX(page)).includes(receipt));
  await page.screenshot({path:path.join(out,'chromium-receipt-after-mocked-success.png')});assert.deepEqual(errors,[]);results.push({case:'receipt-transport',mockedCalls:3,receipt,paths:['timeout','late-success-ignored','failure','success'],result:'PASS'});
 }finally{await context.close();await browser.close()}
}
async function pendingTitle(){
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'no-preference'});await guard(context);
 await context.addInitScript(()=>{window.__layoutShifts=[];new PerformanceObserver(list=>window.__layoutShifts.push(...list.getEntries().map(entry=>({value:entry.value,hadRecentInput:entry.hadRecentInput})))).observe({type:'layout-shift',buffered:true})});
 const releases=[];for(const asset of ['play-the-game-spray-v1.png','play-arrow-spray-v1.png'])await context.route('**/assets/'+asset,async route=>{await new Promise(resolve=>releases.push(resolve));await route.continue()});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 try{
  await page.goto(base+'/experience/?regression=slow-title',{waitUntil:'domcontentloaded'});await page.locator('#play').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.getElementById('play-title').classList.contains('paint-pending')&&document.getElementById('journey-play').classList.contains('paint-cue-pending'));
  const pending=await page.evaluate(()=>{const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>20&&r.height>20&&s.visibility!=='hidden'&&s.display!=='none'};return {title:rect('play-title'),cue:rect('journey-play'),textVisible:visible(document.querySelector('#play-title .paint-title-text')),cueTextVisible:visible(document.querySelector('#journey-play .sr-only')),artVisibility:getComputedStyle(document.querySelector('#play-title img')).visibility,artComplete:document.querySelector('#play-title img').complete,shiftBaseline:window.__layoutShifts.reduce((sum,e)=>sum+(!e.hadRecentInput?e.value:0),0)}});
  assert.equal(pending.textVisible,true);assert.equal(pending.cueTextVisible,true);assert.equal(pending.artVisibility,'hidden');assert.equal(pending.artComplete,false);
  await page.waitForTimeout(750);assert.equal(await page.locator('#play-title').evaluate(el=>el.classList.contains('paint-pending')),true,'pending fallback must remain until the image completes');
  await page.screenshot({path:path.join(out,'chromium-slow-title-pending.png')});for(const release of releases)release();
  await page.waitForFunction(()=>{const title=document.getElementById('play-title'),cue=document.getElementById('journey-play');return title.querySelector('img').naturalWidth>0&&!title.classList.contains('paint-pending')&&!cue.classList.contains('paint-cue-pending')});
  const complete=await page.evaluate(()=>{const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {title:rect('play-title'),cue:rect('journey-play'),shiftTotal:window.__layoutShifts.reduce((sum,e)=>sum+(!e.hadRecentInput?e.value:0),0)}});
  for(const id of ['title','cue'])for(const key of ['x','y','width','height'])assert(Math.abs(pending[id][key]-complete[id][key])<1,`${id} ${key} shifted while pending art resolved`);
  assert.equal(complete.shiftTotal-pending.shiftBaseline,0,'pending art completion caused layout shift');assert.deepEqual(errors,[]);results.push({case:'slow-title-pending-fallback',pending,complete,result:'PASS'});
 }finally{for(const release of releases)release();await context.close();await browser.close()}
}
(async()=>{if(!only||only==='short')for(const row of [['chromium',480,320],['chromium',540,360],['chromium',568,320],['webkit',540,360]])await shortEntry(...row);if(!only||only==='focus')await reducedFocusAndVault();if(!only||only==='motion-toggle')await motionToggleDuringEntry();if(!only||only==='receipt')await receiptTransport();if(!only||only==='title')await pendingTitle();const report={checkedAt:new Date().toISOString(),results,limits:'Local Chromium/WebKit viewport and accessibility-tree emulation. Media completion is synthetic for short-layout setup; signup transport is mocked; no physical-device or live-form claim.'};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:results.length,results:results.map(r=>r.case),limits:report.limits}))})().catch(error=>{fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:error.stack,results},null,2));console.error(error);process.exitCode=1});
