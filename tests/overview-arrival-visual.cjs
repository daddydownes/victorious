// Compare the new opaque-section occlusion with the former clipping mask in
// the same settled frame after static opening. No production lifecycle changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('playwright'),{PNG}=require('pngjs');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;assert(base&&out);fs.mkdirSync(out,{recursive:true});const rows=[];
async function settledScreenshot(page){let previous;for(let attempt=0;attempt<6;attempt++){const current=await page.screenshot();if(previous&&current.equals(previous))return current;previous=current;await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}throw new Error('Static comparison frame did not settle')}
const configs=[['chromium',390,844,3],['chromium',320,568,3],['chromium',430,932,3],['chromium',844,390,2],['webkit',390,844,2],['webkit',844,390,2],['chromium',1440,900,1],['webkit',390,844,2,'reduce']];
(async()=>{for(const [engine,width,height,dpr,motion='no-preference'] of configs){
 if(process.env.QA_CASE&&process.env.QA_CASE!==[engine,width,height,motion].join('-'))continue;
 const browser=await pw[engine].launch(),context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:width<900,reducedMotion:'reduce'}),page=await context.newPage();
 const row={engine,width,height,dpr,motion,checks:[],errors:[]};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
  await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
  // Freeze only wall-clock date reads so countdown digits cannot change
  // between the two pictures; timers and transition clocks keep running.
  await page.clock.setFixedTime(new Date('2026-10-09T06:00:00Z'));
 try{
  await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert);
  await page.emulateMedia({reducedMotion:motion});
  await page.locator('#collectionScrollCue').click();await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='signup');
  await page.waitForFunction(()=>document.querySelectorAll('#plane img.asset-ready').length===33);
  // This is a static composition comparison; performance has its own harness.
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('#plane img')].map(img=>img.decode())));
  await page.addStyleTag({content:'*{animation-play-state:paused!important;transition:none!important}'});
  for(const fraction of [.96,.501,.13,0]){
   await page.evaluate(fraction=>{const p=document.getElementById('nextDrop'),v=document.getElementById('vaultInvitation'),top=v.getBoundingClientRect().top-p.getBoundingClientRect().top+p.scrollTop;p.scrollTop=top-p.clientHeight*fraction},fraction);
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.waitForFunction(()=>document.getElementById('vault').classList.contains('vault-previewing'));
   const state=await page.evaluate(()=>{const p=document.getElementById('nextDrop'),v=document.getElementById('vaultInvitation'),s=document.querySelector('.signup-landing'),vault=document.getElementById('vault');return {panelTop:p.scrollTop,panelInert:p.inert,target:__vaultEntryGuide.target,offset:v.getBoundingClientRect().top-p.getBoundingClientRect().top,signupBottom:s.getBoundingClientRect().bottom-p.getBoundingClientRect().top,signupBackground:getComputedStyle(s).backgroundColor,clip:vault.style.clipPath,transform:vault.style.transform,phase:__guide.phase(),preview:vault.classList.contains('vault-previewing'),zPanel:Number(getComputedStyle(p).zIndex),zVault:Number(getComputedStyle(vault).zIndex)}});
   assert(state.preview,JSON.stringify(state));assert.equal(state.phase,'film');assert.equal(state.clip,'');assert.equal(state.transform,'');assert.equal(state.signupBackground,'rgb(0, 0, 0)');assert(state.zPanel>state.zVault);assert(Math.abs(state.signupBottom-state.offset)<1);
   const without=await settledScreenshot(page);
   await page.evaluate(offset=>{document.getElementById('vault').style.clipPath=offset>0?'inset('+offset.toFixed(3)+'px 0 0)':''},state.offset);
   const withClip=await settledScreenshot(page);
   await page.evaluate(()=>document.getElementById('vault').style.clipPath='');
   const a=PNG.sync.read(without),b=PNG.sync.read(withClip);assert.equal(a.width,b.width);assert.equal(a.height,b.height);
   let pixels=0,max=0,total=0,nonEdgeMax=0;const edge=Math.floor(state.offset*dpr);for(let i=0;i<a.data.length;i+=4){let delta=0;for(let c=0;c<3;c++)delta=Math.max(delta,Math.abs(a.data[i+c]-b.data[i+c]));if(delta){pixels++;max=Math.max(max,delta);total+=delta;if(Math.floor(i/4/a.width)!==edge)nonEdgeMax=Math.max(nonEdgeMax,delta)}}
   const check={fraction,offset:state.offset,pixels,max,nonEdgeMax,mean:total/(a.width*a.height)};row.checks.push(check);
   // WebKit rounds photo compositing by one color level and antialiases
   // the fractional clip edge by up to three levels on its single pixel row.
   // Bound both separately so missing photos or uncovered regions fail.
   const equivalent=max<=3&&nonEdgeMax<=1;
   if(!equivalent){fs.writeFileSync(path.join(out,engine+'-'+width+'-'+fraction+'-without.png'),without);fs.writeFileSync(path.join(out,engine+'-'+width+'-'+fraction+'-with.png'),withClip)}
   assert(equivalent,'Clipping changed visible content beyond compositor rounding: '+JSON.stringify(check));
   if(fraction===.501)fs.writeFileSync(path.join(out,engine+'-'+width+'-'+height+'-'+motion+'-arrival.png'),without);
  }
  assert.deepEqual(row.errors,[]);row.status='PASS';console.log('PASS visual occlusion',engine,width,height,motion,JSON.stringify(row.checks));
 }catch(e){row.status='FAIL';row.error=e.stack;throw e}
 finally{fs.writeFileSync(path.join(out,'visual.json'),JSON.stringify(rows,null,2));await browser.close()}
}})().catch(e=>{console.error(e);process.exitCode=1});
