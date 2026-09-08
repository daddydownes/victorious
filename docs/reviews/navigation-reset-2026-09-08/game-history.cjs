const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base=(process.env.DEMO_URL||'http://127.0.0.1:8922').replace(/\/$/,'');
const out=process.env.AUDIT_OUT||'/private/tmp/vctrs-game-history-final';fs.mkdirSync(out,{recursive:true});

async function snapshot(page,label){return page.evaluate(label=>({label,url:location.href,path:location.pathname,hash:location.hash,scrollY,
  pageshow:window.__pageShows||[],motion:window.__flapMotion?.state(),open:window.__flap?.isOpen?.(),state:window.__flap?.state(),paused:window.__flap?.paused(),
  overlay:{on:document.querySelector('#flapOverlay')?.classList.contains('on'),ariaHidden:document.querySelector('#flapOverlay')?.getAttribute('aria-hidden')},
  bodyLocked:document.body.classList.contains('flap-game-locked'),background:[...document.body.children].filter(el=>el.id!=='flapOverlay'&&!/^(SCRIPT|STYLE)$/.test(el.tagName)).map(el=>({tag:el.tagName,id:el.id,inert:el.inert})),
  focus:document.activeElement?.id||document.activeElement?.tagName,playRect:(()=>{const r=document.querySelector('#journey-play')?.getBoundingClientRect();return r&&{top:r.top,bottom:r.bottom}})()}),label)}

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chromium',args:['--enable-features=BackForwardCache'],ignoreDefaultArgs:['--disable-back-forward-cache']});
  const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.__pageShows=[];addEventListener('pageshow',event=>window.__pageShows.push({persisted:event.persisted,url:location.href,time:performance.now()}))});
  try{
    await page.goto(`${base}/`,{waitUntil:'domcontentloaded',timeout:60000});
    await page.goto(`${base}/experience/#play`,{waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('#journey-play').scrollIntoViewIfNeeded();const cardScroll=await page.evaluate(()=>scrollY);
    await page.waitForFunction(()=>!document.querySelector('#journey-play')?.classList.contains('paint-cue-pending'),null,{timeout:30000}).catch(()=>{});
    await page.locator('#journey-play').click();await page.waitForFunction(()=>window.__flapMotion?.state()==='open');
    await page.locator('#flapAction').click();await page.waitForFunction(()=>window.__flap?.state()==='play'&&!window.__flap.paused());await page.waitForTimeout(180);
    const playing=await snapshot(page,'playing-before-back');assert(playing.open&&!playing.paused&&playing.overlay.on&&playing.bodyLocked);await page.screenshot({path:path.join(out,'01-playing-before-back.png')});

    await page.goBack({waitUntil:'commit',timeout:15000});await page.waitForTimeout(700);
    const back=await snapshot(page,'root-after-back');assert.equal(back.path,'/');assert.equal(back.hash,'');
    await page.goForward({waitUntil:'commit',timeout:15000});await page.waitForTimeout(700);
    const forward=await snapshot(page,'paused-game-after-forward');
    assert.equal(forward.path,'/experience/');assert.equal(forward.hash,'#play');assert.equal(forward.motion,'open');assert(forward.open&&forward.state==='play'&&forward.paused);
    assert(forward.overlay.on&&forward.overlay.ariaHidden==='false'&&forward.bodyLocked);assert(forward.background.length>0&&forward.background.every(item=>item.inert),JSON.stringify(forward.background));
    assert(forward.pageshow.some(event=>event.persisted===true),JSON.stringify(forward.pageshow));await page.screenshot({path:path.join(out,'02-paused-after-forward.png')});

    await page.locator('#flapExit').click();await page.waitForFunction(()=>window.__flapMotion?.state()==='closed'&&!window.__flap.isOpen(),null,{timeout:5000});await page.waitForTimeout(150);
    const exited=await snapshot(page,'after-exit');assert.equal(exited.overlay.on,false);assert.equal(exited.overlay.ariaHidden,'true');assert.equal(exited.bodyLocked,false);
    assert(exited.background.every(item=>!item.inert),JSON.stringify(exited.background));assert.equal(exited.focus,'journey-play');assert(Math.abs(exited.scrollY-cardScroll)<=2,JSON.stringify({cardScroll,exited}));
    await page.screenshot({path:path.join(out,'03-exit-restored-card.png')});assert.deepEqual(errors,[]);
    const report={base,checkedAt:new Date().toISOString(),playing,back,forward,exited,cardScroll,errors,limit:'Full headless Chromium BFCache history traversal via page.goBack/goForward; not a physical browser edge-swipe.'};
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:true,out,forwardPaused:forward.paused,persisted:forward.pageshow.some(e=>e.persisted),focus:exited.focus}));
  }finally{await context.close();await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
