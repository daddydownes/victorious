'use strict';
// Performance diagnostic, not a physical-iPhone or completed-hero certificate.
// Static opening, restored normal motion, then real wheel input. WebKit uses a
// phone-sized desktop viewport because its mobile mode cannot inject wheel.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto');
const pw = require('playwright'), base = process.env.BASE_URL, out = process.env.EVIDENCE_DIR;
assert(base && out, 'Set BASE_URL and EVIDENCE_DIR');
fs.mkdirSync(out, { recursive: true });
const rows = [], save = () => fs.writeFileSync(path.join(out, 'scroll-performance.json'), JSON.stringify(rows, null, 2));
function instrumentation() {
  const rawRAF = window.requestAnimationFrame.bind(window);
  window.__scrollPerf = { active: false, raf: {}, rects: 0, rectMs: 0, samples: [], last: 0 };
  window.requestAnimationFrame = callback => rawRAF(function (now) {
    const p = window.__scrollPerf, start = performance.now();
    try { return callback(now); }
    finally {
      if (p.active) {
        const key = callback.name || 'anonymous', row = p.raf[key] || (p.raf[key] = { calls: 0, ms: 0, maxMs: 0 });
        const elapsed = performance.now() - start;
        row.calls++; row.ms += elapsed; row.maxMs = Math.max(row.maxMs, elapsed);
      }
    }
  });
  const rect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (...args) {
    const p = window.__scrollPerf, start = performance.now(), result = rect.apply(this, args);
    if (p.active) { p.rects++; p.rectMs += performance.now() - start; }
    return result;
  };
  function sample(now) {
    const p = window.__scrollPerf;
    if (p.active && p.last) p.samples.push(now - p.last);
    p.last = p.active ? now : 0;
    rawRAF(sample);
  }
  rawRAF(sample);
}
async function state(page) {
  return page.evaluate(() => {
    const p = document.getElementById('nextDrop'), guide = window.__vaultEntryGuide;
    const legacy = document.querySelector('.seamsec');
    return { top: p.scrollTop, height: p.clientHeight, phase: window.__guide.phase(), target: guide.target,
      moving: guide.moving, entered: guide.entered, vaultInert: document.getElementById('vault').inert,
      camera: document.getElementById('dive').style.transform, clip: document.getElementById('vault').style.clipPath,
      panMode: window.__vaultPan.mode, worldHidden: document.getElementById('world').hidden,
      legacyAnimations: legacy.getAnimations({subtree:true}).map(a => ({name:a.animationName,state:a.playState})),
      scrollCue: getComputedStyle(document.querySelector('.collection-scroll-cue span')).animationName,
      logoAnimation: getComputedStyle(document.querySelector('.next-drop-mark .vctrs-glyph')).animationName };
  });
}
async function run(engine, width, height, pass) {
  const tag = `${engine}-${width}x${height}-${pass}`;
  const row = { tag, engine, width, height, pass, os:process.platform, setup:'static opening then normal motion; wheel input; forced native archive only at phone size', errors:[], segments:[] };
  rows.push(row); save();
  const browser = await pw[engine].launch();
  try {
    const context = await browser.newContext({ viewport:{width,height}, hasTouch:width<900, isMobile:engine==='chromium'&&width<900, reducedMotion:'reduce' });
    await context.route('**/formsubmit.co/**', route => route.fulfill({json:{success:true}}));
    await context.addInitScript(instrumentation);
    const page = await context.newPage();
    page.on('pageerror', error => row.errors.push(error.message));
    const response = await page.goto(`${base}?scroll-audit=${tag}${width<900?'&vaultPan=native':''}`, {waitUntil:'domcontentloaded'});
    row.sourceSha256 = createHash('sha256').update(await response.body()).digest('hex');
    row.browser = await page.evaluate(() => navigator.userAgent);
    await page.waitForFunction(() => document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert, {}, {timeout:45000});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForTimeout(600);
    const cdp = engine==='chromium' ? await context.newCDPSession(page) : null;
    if(cdp) await cdp.send('Performance.enable');
    async function metrics() {
      if(!cdp) return null;
      const reply = await cdp.send('Performance.getMetrics');
      return Object.fromEntries(reply.metrics.map(m=>[m.name,m.value]));
    }
    async function segment(label,wheel) {
      const before = await state(page), old = await metrics();
      await page.evaluate(() => {const p=window.__scrollPerf;p.raf={};p.rects=0;p.rectMs=0;p.samples=[];p.last=0;p.active=true});
      if(wheel){await page.mouse.move(width*.5,height*.72);await page.mouse.wheel(0,wheel*height)}
      await page.waitForTimeout(1100);
      const stats = await page.evaluate(() => {
        const p=window.__scrollPerf;p.active=false;const sorted=[...p.samples].sort((a,b)=>a-b);
        return {rects:p.rects,rectMs:p.rectMs,raf:p.raf,frameCount:sorted.length,frameP95:sorted[Math.floor(sorted.length*.95)]||0,framesOver34ms:sorted.filter(x=>x>34).length,frameMax:sorted.at(-1)||0};
      });
      const current=await metrics();
      if(old) stats.chromium=Object.fromEntries(['LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration'].map(k=>[k,current[k]-old[k]]));
      row.segments.push({label,before,after:await state(page),...stats});save();
    }
    async function shot(label) {
      if(pass!==1)return;
      await page.screenshot({path:path.join(out,`${tag}-${label}.png`),animations:'disabled'});
    }
    await segment('collection-idle',0);await shot('collection');
    await segment('collection-to-signup',1.1);assert.equal((await state(page)).target,'signup');
    await segment('signup-idle',0);await shot('signup');
    for(let i=0;i<5&&(await state(page)).target!=='overview';i++)await segment(`approach-${i}`,1.1);
    assert.equal((await state(page)).target,'overview');assert.equal((await state(page)).entered,false);
    await segment('overview-idle',0);await shot('overview');
    await segment('overview-to-vault',1.1);
    await page.waitForFunction(()=>window.__guide.phase()==='vault'&&!document.getElementById('vault').inert, {}, {timeout:15000});
    await segment('vault-idle',0);await segment('vault-pan',1);await shot('vault');
    assert.deepEqual(row.errors,[]);row.status='PASS';console.log(JSON.stringify(row));
    await context.close();
  }catch(error){row.status='FAIL';row.error=error.stack;console.error(tag,error)}
  finally{save();await browser.close()}
}
(async()=>{
  for(const engine of ['webkit','chromium'])for(const [width,height]of [[390,844],[1440,900]])for(let pass=1;pass<=Number(process.env.QA_PASSES||2);pass++)await run(engine,width,height,pass);
  if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
})();
