const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const{chromium}=require('playwright');
const base=(process.env.DEMO_URL||'http://127.0.0.1:8922').replace(/\/$/,'');const out=process.env.AUDIT_OUT||'/private/tmp/vctrs-embedded-history-race-final';fs.mkdirSync(out,{recursive:true});
async function waitActive(page){
  await page.locator('#story-vault').scrollIntoViewIfNeeded();await page.waitForFunction(()=>window.__storyVault?.active===true,null,{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('#story-vault-frame')?.contentDocument?.body.classList.contains('next-vault-open'),null,{timeout:15000});
}
async function clickSurface(page){const target=await page.evaluate(()=>{const f=document.querySelector('#story-vault-frame'),d=f.contentDocument,w=f.contentWindow,b=d.querySelector('#surfaceBtn'),r=b.getBoundingClientRect(),fr=f.getBoundingClientRect();return{x:fr.left+r.x+r.width/2,y:fr.top+r.y+r.height/2,width:r.width,height:r.height,active:w.__vctrsVaultEmbedActive,inert:d.documentElement.inert,bodyInert:d.body.inert,url:w.location.href}});console.log('SURFACE_TARGET',JSON.stringify(target));assert(target.active&&!target.inert&&!target.bodyInert&&target.width>0&&target.height>0);await page.mouse.click(target.x,target.y)}
async function snap(page,label){return page.evaluate(label=>{const frame=document.querySelector('#story-vault-frame');return{label,url:location.href,path:location.pathname,hash:location.hash,scrollY,
  pageshow:window.__pageShows||[],vault:{active:window.__storyVault?.active,loaded:window.__storyVault?.loaded,resetting:window.__storyVault?.resetting,cycle:window.__storyVault?.cycle,pending:window.__storyVault?.pendingCycle},
  frame:{count:document.querySelectorAll('#story-vault-frame').length,inert:frame?.inert,hidden:frame?.getAttribute('aria-hidden'),url:frame?.contentWindow?.location.href,nested:!!frame?.contentDocument?.querySelector('#story-vault-frame')}}},label)}
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chromium',args:['--enable-features=BackForwardCache'],ignoreDefaultArgs:['--disable-back-forward-cache']});const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__pageShows=[];addEventListener('pageshow',e=>window.__pageShows.push({persisted:e.persisted,url:location.href,time:performance.now()}))});
  try{
    await page.goto(`${base}/`,{waitUntil:'domcontentloaded',timeout:60000});await page.goto(`${base}/experience/#story-return`,{waitUntil:'domcontentloaded',timeout:60000});await waitActive(page);
    const active=await snap(page,'active-before-surface-back');const priorCycle=active.vault.cycle;assert(active.frame.url.includes('/vault-embed.html')&&!active.frame.nested);
    await clickSurface(page);
    await page.goBack({waitUntil:'commit',timeout:15000});await page.waitForTimeout(700);const back=await snap(page,'root-after-immediate-back');assert.equal(back.path,'/');assert.equal(back.hash,'');
    await page.goForward({waitUntil:'commit',timeout:15000});await page.waitForTimeout(700);const forward=await snap(page,'story-after-forward');assert.equal(forward.path,'/experience/');assert(['','#story-return'].includes(forward.hash));
    await page.screenshot({path:path.join(out,'01-story-restored-after-forward.png')});let resumedOriginal=true;
    try{await page.waitForFunction(c=>window.__storyVault?.cycle>c&&!window.__storyVault.resetting&&scrollY<=2,priorCycle,{timeout:5000})}
    catch(_error){resumedOriginal=false;await waitActive(page);await clickSurface(page);await page.waitForFunction(c=>window.__storyVault?.cycle>c&&!window.__storyVault.resetting&&scrollY<=2,priorCycle,{timeout:10000})}
    await page.waitForTimeout(200);const complete=await snap(page,'surface-loop-complete');assert.equal(complete.path,'/experience/');assert.equal(complete.hash,'');assert(Math.abs(complete.scrollY)<=2);assert.equal(complete.vault.active,false);assert.equal(complete.frame.count,1);assert.equal(complete.frame.nested,false);assert(complete.frame.url.includes('/vault-embed.html'));assert.deepEqual(errors,[]);
    await page.screenshot({path:path.join(out,'02-loop-complete.png')});const report={base,checkedAt:new Date().toISOString(),active,back,forward,resumedOriginal,complete,errors,limit:'Full headless Chromium BFCache traversal via page.goBack/goForward; not a physical edge-swipe.'};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:true,out,resumedOriginal,cycle:[priorCycle,complete.vault.cycle],forwardPersisted:forward.pageshow.some(e=>e.persisted)}));
  }finally{await context.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
