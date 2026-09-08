const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const base=(process.env.DEMO_URL||'http://127.0.0.1:8922').replace(/\/$/,'');
const out=process.env.AUDIT_OUT||'/private/tmp/vctrs-refresh-history-final';
fs.mkdirSync(out,{recursive:true});

const contexts={
  desktop:{name:'desktop-1280x720',options:{viewport:{width:1280,height:720}}},
  mobile:{name:'mobile-390x844',options:{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2}},
  mobileReduced:{name:'mobile-reduced-390x844',options:{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,reducedMotion:'reduce'}},
};

async function installEvidence(page){
  await page.addInitScript(()=>{
    window.__historyEvidence=[];
    addEventListener('pageshow',event=>window.__historyEvidence.push({event:'pageshow',persisted:event.persisted,time:performance.now(),url:location.href}));
    addEventListener('pagehide',event=>window.__historyEvidence.push({event:'pagehide',persisted:event.persisted,time:performance.now(),url:location.href}));
  });
}

async function state(page,label){
  return page.evaluate(label=>{
    const vault=document.querySelector('#vault'),overlay=document.querySelector('#flapOverlay'),embed=document.querySelector('#story-vault-frame'),film=document.querySelector('#film');
    const vaultStyle=vault&&getComputedStyle(vault),nav=performance.getEntriesByType('navigation')[0];
    return {label,url:location.href,path:location.pathname,hash:location.hash,scrollY,
      navType:nav?.type||null,events:window.__historyEvidence||[],focus:document.activeElement?.id||document.activeElement?.className||document.activeElement?.tagName,
      bodyClass:document.body.className,root:{present:!!vault,open:!!vault&&(document.body.classList.contains('next-vault-open')||vaultStyle.visibility==='visible'&&parseFloat(vaultStyle.opacity||'0')>.5),pan:window.__vaultPan?.position?.()||null},
      storage:{best:localStorage.getItem('flapv_best'),won:localStorage.getItem('flapv_won')},
      film:film?{display:getComputedStyle(film).display,visibility:getComputedStyle(film).visibility,paused:film.paused,src:film.currentSrc||film.getAttribute('src')||''}:null,
      story:{present:!!document.querySelector('#story-return'),gameOpen:!!window.__flap?.isOpen?.(),motion:window.__flapMotion?.state?.()||null,
        embedActive:window.__storyVault?.active??null,embedLoaded:window.__storyVault?.loaded??null,embedCycle:window.__storyVault?.cycle??null,
        frameInert:embed?.inert??null,frameHidden:embed?.getAttribute('aria-hidden')??null,overlayClass:overlay?.className||null}}
  },label);
}

async function settle(page,ms=900){await page.waitForFunction(()=>document.readyState!=='loading',null,{timeout:5000});await page.waitForTimeout(ms)}
async function reload(page){await page.reload({waitUntil:'domcontentloaded',timeout:60000});await settle(page)}
function assertRootBeginning(s){
  assert.equal(s.path,'/');assert.equal(s.hash,'');assert(Math.abs(s.scrollY)<=2,JSON.stringify(s));
  assert.equal(s.root.present,true);assert.equal(s.root.open,false);assert.equal(s.story.present,false);assert.equal(s.story.gameOpen,false);
}

async function waitRootVault(page){
  await page.waitForFunction(()=>{const v=document.querySelector('#vault');if(!v)return false;const s=getComputedStyle(v);return document.body.classList.contains('next-vault-open')||(s.visibility==='visible'&&parseFloat(s.opacity||'0')>.5)},null,{timeout:20000});
}
async function waitStoryGame(page){
  await page.locator('#journey-play').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>!document.querySelector('#journey-play')?.classList.contains('paint-cue-pending'),null,{timeout:30000}).catch(()=>{});
  await page.locator('#journey-play').click({timeout:10000});
  await page.waitForFunction(()=>window.__flapMotion?.state()==='open'&&window.__flap?.isOpen(),null,{timeout:10000});
}
async function waitEmbeddedVault(page){
  await page.locator('#story-vault').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>window.__storyVault?.active===true,null,{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('#story-vault-frame')?.contentDocument?.body.classList.contains('next-vault-open'),null,{timeout:15000});
}

async function scenario(page,name,run){
  const errors=[],navigations=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations.push({url:frame.url(),at:Date.now()})});
  try{return {name,ok:true,...await run(),errors,navigations}}
  catch(error){return {name,ok:false,error:String(error.stack||error),last:await state(page,'failure').catch(()=>null),errors,navigations}}
}

async function refreshRootVault(page,prefix){
  await page.goto(`${base}/#vault`,{waitUntil:'domcontentloaded',timeout:60000});await waitRootVault(page);
  const before=await state(page,'before-reload-root-vault');await reload(page);const after=await state(page,'after-reload-root-vault');
  assertRootBeginning(after);await page.screenshot({path:path.join(out,`${prefix}-root-opening-after-refresh.png`)});
  return {before,after};
}
async function refreshStoryGame(page){
  await page.goto(`${base}/experience/#play`,{waitUntil:'domcontentloaded',timeout:60000});await waitStoryGame(page);
  await page.evaluate(()=>{localStorage.setItem('flapv_best','37');localStorage.setItem('flapv_won','1')});
  const before=await state(page,'before-reload-story-game');await reload(page);const after=await state(page,'after-reload-story-game');
  assertRootBeginning(after);assert.equal(after.storage.best,'37');assert.equal(after.storage.won,'1');
  return {before,after};
}
async function refreshEmbeddedVault(page,_prefix,reduced=false){
  await page.goto(`${base}/experience/#story-return`,{waitUntil:'domcontentloaded',timeout:60000});await waitEmbeddedVault(page);
  const before=await state(page,'before-reload-embedded-vault');await reload(page);const after=await state(page,'after-reload-embedded-vault');
  assertRootBeginning(after);
  if(reduced&&after.film)assert(after.film.paused&&(after.film.display==='none'||after.film.visibility==='hidden'||!after.film.src),JSON.stringify(after.film));
  return {before,after};
}
async function rootSurfaceHistory(page,touch,prefix,requireBFCache=false){
  await page.goto(`${base}/#vault`,{waitUntil:'domcontentloaded',timeout:60000});await waitRootVault(page);
  const root=await state(page,'root-vault-before-surface');
  if(touch)await page.locator('#surfaceBtn').tap({timeout:10000});else await page.locator('#surfaceBtn').click({timeout:10000});
  await page.waitForURL(url=>url.pathname.endsWith('/experience/'),{timeout:15000});await settle(page);
  const story=await state(page,'story-after-surface');
  const backResponse=await page.goBack({waitUntil:'commit',timeout:15000});await settle(page);
  const back=await state(page,'after-goBack');
  assert.equal(back.path,'/');assert.equal(back.hash,'#vault');
  if(requireBFCache){await page.screenshot({path:path.join(out,`${prefix}-bfcache-vault-after-back.png`)});assert(back.events.some(event=>event.event==='pageshow'&&event.persisted===true),JSON.stringify(back.events))}
  const forwardResponse=await page.goForward({waitUntil:'commit',timeout:15000});await settle(page);
  const forward=await state(page,'after-goForward');
  assert.equal(forward.path,'/experience/');assert.equal(forward.hash,'');
  if(requireBFCache){await page.screenshot({path:path.join(out,`${prefix}-bfcache-story-after-forward.png`)});assert(forward.events.some(event=>event.event==='pageshow'&&event.persisted===true),JSON.stringify(forward.events))}
  return {root,story,back,forward,responses:{back:backResponse?.status()??null,forward:forwardResponse?.status()??null},
    limitation:'Playwright page.goBack/goForward exercise browser history traversal; this is not a physical edge-swipe gesture.'};
}

async function embeddedResetHistoryRace(page){
  await page.goto(`${base}/`,{waitUntil:'domcontentloaded',timeout:60000});
  await page.goto(`${base}/experience/#story-return`,{waitUntil:'domcontentloaded',timeout:60000});await waitEmbeddedVault(page);
  const active=await state(page,'embedded-active-before-surface-back-race');
  const priorCycle=active.story.embedCycle;
  const child=page.frames().find(frame=>frame.url().includes('/vault-embed.html'));assert(child,'missing embedded Vault');
  await child.locator('#surfaceBtn').click({timeout:10000});
  const backResponse=await page.goBack({waitUntil:'commit',timeout:15000});await settle(page);
  const back=await state(page,'race-after-goBack');assert.equal(back.path,'/');assert.equal(back.hash,'');
  const forwardResponse=await page.goForward({waitUntil:'commit',timeout:15000});await settle(page);
  const forward=await state(page,'race-after-goForward');assert.equal(forward.path,'/experience/');assert(['','#story-return'].includes(forward.hash));assert.equal(forward.story.gameOpen,false);
  // The original 2050ms Surface motion may resume and finish after BFCache restoration.
  // If it was intentionally cancelled, prove the restored Vault remains usable by completing Surface once more.
  let resumedOriginal=true;
  try{await page.waitForFunction(c=>window.__storyVault?.cycle>c&&!window.__storyVault.resetting&&scrollY<=2,priorCycle,{timeout:5000})}
  catch(_error){
    resumedOriginal=false;await waitEmbeddedVault(page);
    const restoredChild=page.frames().find(frame=>frame.url().includes('/vault-embed.html'));assert(restoredChild,'restored embedded Vault missing');
    await restoredChild.locator('#surfaceBtn').click({timeout:10000});
    await page.waitForFunction(c=>window.__storyVault?.cycle>c&&!window.__storyVault.resetting&&scrollY<=2,priorCycle,{timeout:10000});
  }
  await settle(page,200);const loopComplete=await state(page,'race-loop-complete');assert.equal(loopComplete.path,'/experience/');assert.equal(loopComplete.hash,'');
  assert.equal(loopComplete.story.embedActive,false);assert(Math.abs(loopComplete.scrollY)<=2,JSON.stringify(loopComplete));
  assert.equal(await page.locator('#story-vault-frame').count(),1);const nested=await page.locator('#story-vault-frame').evaluate(frame=>!!frame.contentDocument?.querySelector('#story-vault-frame'));
  assert.equal(nested,false);return{active,back,forward,resumedOriginal,loopComplete,responses:{back:backResponse?.status()??null,forward:forwardResponse?.status()??null},nested};
}

async function runContext(browser,engine,config,selected,requireBFCache=false){
  const result={engine,context:config.name,options:config.options,scenarios:[]};
  const refreshes={root:['refresh-root-vault',refreshRootVault],game:['refresh-story-game',refreshStoryGame],embed:['refresh-embedded-vault',refreshEmbeddedVault]};
  for(const key of selected.filter(key=>refreshes[key])){const [name,fn]=refreshes[key];
    const context=await browser.newContext(config.options),page=await context.newPage();await installEvidence(page);
    const prefix=`${engine}-${config.name}`;
    result.scenarios.push(await scenario(page,name,()=>fn(page,prefix,config.options.reducedMotion==='reduce')));await context.close();
  }
  if(selected.includes('history')){const context=await browser.newContext(config.options),page=await context.newPage();await installEvidence(page);
    result.scenarios.push(await scenario(page,'root-surface-back-forward',()=>rootSurfaceHistory(page,!!config.options.hasTouch,`${engine}-${config.name}`,false)));await context.close()}
  if(selected.includes('bfcache')){const context=await browser.newContext(config.options),page=await context.newPage();await installEvidence(page);
    result.scenarios.push(await scenario(page,'root-surface-bfcache-witness',()=>rootSurfaceHistory(page,!!config.options.hasTouch,`${engine}-${config.name}`,requireBFCache)));await context.close()}
  if(selected.includes('race')){const context=await browser.newContext(config.options),page=await context.newPage();await installEvidence(page);
    result.scenarios.push(await scenario(page,'embedded-surface-back-forward-race',()=>embeddedResetHistoryRace(page)));await context.close()}
  return result;
}

(async()=>{
  const results=[];
  const plan={webkit:[['desktop',['root','game','embed','history']],['mobileReduced',['embed','history']]],chromium:[['desktop',['game','history','bfcache']],['mobile',['root','embed']]]};
  for(const [engine,type] of [['webkit',webkit],['chromium',chromium]]){
    const launch=engine==='chromium'?{headless:true,channel:'chromium',args:['--enable-features=BackForwardCache'],ignoreDefaultArgs:['--disable-back-forward-cache']}:{headless:true};
    const browser=await type.launch(launch);
    try{for(const [contextName,selected] of plan[engine])results.push(await runContext(browser,engine,contexts[contextName],selected,engine==='chromium'&&contextName==='desktop'))}finally{await browser.close()}
  }
  const report={base,checkedAt:new Date().toISOString(),results,limits:['Headless WebKit/Chromium emulation; no physical-device or edge-swipe claim.','Chromium launched without Playwright’s --disable-back-forward-cache default argument; persisted pageshow is required for its desktop Back/Forward witness.']};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
  const scenarioStatus=results.flatMap(r=>r.scenarios.map(s=>[`${r.engine}-${r.context}-${s.name}`,s.ok]));
  console.log(JSON.stringify({out,contexts:results.map(r=>`${r.engine}-${r.context}`),scenarioStatus}));
  if(scenarioStatus.some(([,ok])=>!ok))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
