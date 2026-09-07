const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit, firefox } = require('playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:59408';
const out = process.argv[2] && path.resolve(process.argv[2]);
const results = [];
const configurations = [
  ['chromium',320,568,false],
  ['chromium',1280,900,false], ['chromium',390,844,false],
  ['webkit',390,844,false], ['webkit',844,390,false], ['firefox',1280,900,false],
  ['chromium',390,844,true], ['webkit',1440,900,true]
];
async function localOnly(context) {
  // This blanket guard is installed before any page exists. Form fixtures below
  // replace fetch in-page; even a broken fixture cannot submit to a real endpoint.
  await context.route('**/*', route => {
    const request = route.request();
    return new URL(request.url()).origin === new URL(base).origin && ['GET','HEAD'].includes(request.method())
      ? route.continue() : route.abort();
  });
}
async function snapshot(page, selector) {
  return page.locator(selector).evaluate(el => {
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return {x:r.x,y:r.y,width:r.width,height:r.height,fill:el.querySelector('path')?getComputedStyle(el.querySelector('path')).fill:null,
      color:s.color,filter:s.filter,opacity:s.opacity,visibility:s.visibility,font:s.fontFamily,radius:s.borderRadius};
  });
}
async function capture(page, name) {
  if(out) await page.screenshot({path:path.join(out,name+'.png')});
}
function sameRect(a,b,label) {
  for(const key of ['x','y','width','height']) assert(Math.abs(a[key]-b[key])<.25,`${label} ${key}: ${a[key]} -> ${b[key]}`);
}
async function handoff(engine,width,height,reduce) {
  const browser=await({chromium,webkit,firefox})[engine].launch({headless:true});
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,reducedMotion:reduce?'reduce':'no-preference'});
  await localOnly(context);
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    // Repeat the core return loop four times, including fresh documents each time.
    for(let pass=1;pass<=4;pass++) {
      await page.goto(base+'/#vault');await page.locator('#surfaceBtn').click();
      let before;
      if(!reduce) {
        await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.surface-story-logo')).opacity)>.995);
        before={logo:await snapshot(page,'.surface-story-logo'),cue:await snapshot(page,'.surface-story-cue')};
        if(pass===1)await capture(page,`${engine}-${width}-${height}-surface`);
      }
      await page.waitForURL(base+'/experience/');
      const after={logo:await snapshot(page,'.brand-logo'),cue:await snapshot(page,'.story-cue')};
      assert.equal(after.logo.fill,'rgb(240, 212, 146)');
      if(before){sameRect(before.logo,after.logo,'Surface V');sameRect(before.cue,after.cue,'Scroll cue');assert.equal(before.logo.filter,after.logo.filter);}
      if(pass===1)await capture(page,`${engine}-${width}-${height}-${reduce?'reduced-':''}landed`);
      await page.locator('.story-cue').click();
      assert.equal(await page.evaluate(()=>document.activeElement.id),'portrait-title');
      const opener=pass%2?'#journey-play':'#flapPlay';
      await page.locator(opener).focus();await page.keyboard.press('Enter');
      await page.waitForFunction(()=>document.getElementById('flapOverlay').classList.contains('on'));
      await page.waitForTimeout(reduce?50:550);
      const exit=await snapshot(page,'#flapExit');
      assert(exit.height>=44);assert(exit.x>=0&&exit.y>=0&&exit.x+exit.width<=width+.5);
      assert.equal(exit.radius,'4px');assert(exit.font.includes('Consolas'));
      if(pass===1)await capture(page,`${engine}-${width}-${height}-game`);
      const score=await snapshot(page,'#flapScore');
      assert(score.x+score.width<=exit.x-4,'Original score and Exit must not overlap');
      assert.equal(await page.locator('#flapTitle').innerText(),reduce?'MOTION IS OFF':'FLAPPY V');
      assert.equal(await page.locator('#flapAction').innerText(),reduce?'EXIT GAME':'START RUN');
      if(pass%2)await page.keyboard.press('Escape');else await page.locator('#flapExit').click();
      await page.waitForFunction(()=>!document.getElementById('flapOverlay').classList.contains('on'));
      assert.equal(await page.evaluate(()=>document.activeElement.id),opener.slice(1));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.locator('.vault-return').click();
      await page.locator('#surfaceBtn').waitFor({state:'visible'});
      assert.equal(new URL(page.url()).hash,'#vault');
      await page.reload();await page.locator('#surfaceBtn').waitFor({state:'visible'});
      await page.goBack();await page.waitForURL(base+'/experience/');
      await page.goForward();await page.locator('#surfaceBtn').waitFor({state:'visible'});
      results.push({engine,width,height,reduce,pass,before,after,exit,score,returnedToVault:true});
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close()}
}
async function formFixtures(engine) {
  const browser=await({chromium,webkit,firefox})[engine].launch({headless:true});
  try {
    for(const kind of ['root','story'])for(const response of ['success','failure','moved-focus','edited-email']) {
      const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
      await localOnly(context);
      await context.addInitScript(() => {
        const original=window.fetch.bind(window);
        window.__formFixture={calls:0,settle:null};
        window.fetch=(url,options) => {
          if(new URL(url,location.href).hostname!=='formsubmit.co')return original(url,options);
          window.__formFixture.calls++;
          return new Promise((resolve,reject)=>{
            options.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
            window.__formFixture.settle=ok=>resolve(new Response(JSON.stringify({success:ok}),{status:ok?200:500,headers:{'Content-Type':'application/json'}}));
          });
        };
      });
      const page=await context.newPage();page.setDefaultTimeout(15000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+(kind==='story'?'/experience/':'/'));
      const form=page.locator(kind==='story'?'#signup-form':'#nextDropEmail');
      const input=form.locator('input'),button=form.locator('button');
      await input.fill('fixture@example.invalid');await button.focus();await page.keyboard.press('Enter');
      await page.waitForFunction(()=>window.__formFixture.calls===1);
      const pending=await button.evaluate(el=>({focused:document.activeElement===el,disabled:el.disabled,ariaDisabled:el.getAttribute('aria-disabled'),opacity:getComputedStyle(el).opacity}));
      assert.equal(pending.focused,true);assert.equal(pending.disabled,false);assert.equal(pending.ariaDisabled,'true');assert.equal(pending.opacity,'1');
      await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.__formFixture.calls),1);
      if(response==='moved-focus')await input.focus();
      if(response==='edited-email')await input.fill('changed@example.invalid');
      await page.evaluate(ok=>window.__formFixture.settle(ok),response!=='failure');
      await page.waitForFunction(()=>!document.querySelector('form[aria-busy="true"]'));
      assert.equal(await button.getAttribute('aria-disabled'),null);
      const focus=await page.evaluate(()=>document.activeElement.id||document.activeElement.tagName);
      if(response==='moved-focus'||response==='edited-email')assert.equal(focus,kind==='story'?'signup-email':'nextDropEmailInput');
      else assert.equal(await button.evaluate(el=>document.activeElement===el),true);
      assert.equal(await input.inputValue(),response==='failure'?'fixture@example.invalid':response==='edited-email'?'changed@example.invalid':'');
      const status=await page.locator(kind==='story'?'#signup-result':'#nextDropResult').textContent();
      if(response==='failure')assert.match(status,/not sent/i);else if(response!=='edited-email')assert.match(status,/on the list/i);
      if(response==='edited-email')assert.equal(status,'','An older request must not describe the newly edited address');
      assert.deepEqual(errors,[]);
      results.push({form:kind,engine,response,pending,focus,status,mockedCalls:await page.evaluate(()=>window.__formFixture.calls)});
      if(response==='success'&&kind==='story')await capture(page,engine+'-signup-success');
      await context.close();
    }
  }finally{await browser.close()}
}
(async()=>{
  if(out)fs.mkdirSync(out,{recursive:true});
  if(!process.argv.includes('--forms-only'))for(const c of configurations)await handoff(...c);
  for(const engine of ['chromium','webkit','firefox'])await formFixtures(engine);
  const report={checkedAt:new Date().toISOString(),results,limits:'Browser engines with viewport/touch emulation, not physical devices. All nonlocal transport blocked; signup responses supplied by an in-page fetch fixture.'};
  if(out)fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:results.length,handoffLoops:results.filter(r=>r.returnedToVault).length,formCases:24,limits:report.limits}));
})().catch(error=>{if(out)fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:error.stack,results},null,2));console.error(error);process.exitCode=1});
