// Preview trajectory regression: real impulses, no position correction, all
// portal silhouettes visible. Browser fixtures use isolated local storage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {setup}=require('./flappy-difficulty.cjs');
const {chromium,webkit,firefox}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.argv[2]&&path.resolve(process.argv[2]);
const base=process.env.DEMO_URL||'http://127.0.0.1:59408';
const preview=fs.readFileSync(path.join(root,'experience/game-preview.html'),'utf8');
function adapter(html){return html.slice(html.indexOf('    var requested=false,previewFrames=0'),html.indexOf('\n  }\n})();',html.indexOf('    var requested=false,previewFrames=0')));}
function pilot(html,w,h,seed){const t=setup(w,h,seed);t.c.parent={postMessage(){}};t.c.location={origin:base};t.c.flapDraw=()=>{};vm.runInContext(adapter(html),t.c);return t;}
function ballisticStep(c,s){
  const y=c.FG.y,vy=c.FG.vy,hops=c.previewHops,rot=c.FG.rot,dt=1/120;
  c.previewStep(dt,s);
  assert(Math.abs(c.FG.y-(y+c.FG.vy*dt))<1e-12,'Preview must never snap, clamp or guide its Y position');
  assert(Math.abs(c.FG.vy-Math.min(.70,(c.previewHops>hops?-.62:vy)+2.6*dt))<1e-12,'Only tap impulses and gravity change velocity');
  assert(Math.abs(c.FG.rot-rot)<=.35,'Rotation remains continuous across a tap');
}
const trajectories=[];
for(const [w,h] of [[1280,900],[390,280],[320,280]])for(const seed of [1,7,19]){
  const {c,s,storage}=pilot(preview,w,h,seed),stored=Array.from(storage),kinds=new Set();let steps=0,minY=1,maxY=0,minInset=Infinity;
  while(c.FG.score<200){
    ballisticStep(c,s);steps++;assert(steps<60000,'Preview must continue through repeated courses');
    minY=Math.min(minY,c.FG.y);maxY=Math.max(maxY,c.FG.y);
    for(const g of c.FG.gates){
      kinds.add(g.kind);assert(!c.flapCollision(g,s),'Pilot must visibly clear '+g.kind+' at '+g.serial);
      if(g.kind!=='PILLAR')for(const poly of c.flapHazardPolygons(g,s))for(const p of poly){minInset=Math.min(minInset,p[1],s.h-p[1]);assert(p[1]>12&&p[1]<s.h-12,'Finite portals must fit fully inside the preview');}
    }
  }
  assert.equal(kinds.size,4);assert(c.previewHops>300);assert(maxY-minY>.07,'Flaps have a visible vertical arc');assert.deepEqual(Array.from(storage),stored);
  trajectories.push({w,h,seed,clears:c.FG.score,hops:c.previewHops,steps,minY,maxY,minInset});
}
// Optional frozen old candidate proves that the regression rejects the guide.
if(process.env.PREVIEW_BEFORE){const t=pilot(fs.readFileSync(process.env.PREVIEW_BEFORE,'utf8'),1280,900,1);assert.throws(()=>{for(let i=0;i<1000;i++)ballisticStep(t.c,t.s)},/snap, clamp or guide|tap impulses/);}
for(const file of ['index.html','experience/index.html','experience/game-preview.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert(html.includes('var COUPON_THRESHOLD=100;'));assert(!html.includes("fctx.strokeStyle='rgba(240,212,146,.20)'"),'V trail removed');assert(html.includes('function flapSaveFrame'),'Interpolation history remains');
}
console.log('PASS nine physics-only preview routes: 1,800 clears, no forced positions, contact or clipped portals');
async function journey(engine,width,height){
  const browser=await({chromium,webkit,firefox})[engine].launch();
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,reducedMotion:'no-preference',...(out&&engine==='chromium'?{recordVideo:{dir:out,size:{width:960,height:675}}}:{})});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'/experience/');await page.locator('#game-preview').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('#game-preview').contentWindow.__preview?.frames()>4);
    const frame=page.frames().find(f=>f.url().includes('game-preview.html'));
    const samples=await frame.evaluate(()=>new Promise(resolve=>{const rows=[],start=performance.now();function sample(t){const g=__flap.dbg();rows.push({t,y:g.y,vy:g.vy,rot:g.rot,hops:__preview.hops(),score:g.score});if(t-start<5500)requestAnimationFrame(sample);else resolve(rows)}requestAnimationFrame(sample)}));
    assert(samples.some(p=>p.vy<-.5));assert(samples.some(p=>p.vy>.35));assert(samples.at(-1).hops-samples[0].hops>=7);
    // Explicit score fixtures only shorten the screenshot wait; the natural
    // 200-clear simulations above verify the entire actual stage sequence.
    const stages=[];
    for(const [score,kind] of [[10,'ARCH'],[20,'SLANT'],[30,'IRIS'],[40,'PILLAR']]){
      await frame.evaluate(score=>{const g=__flap.dbg();g.score=score;g.gates=[]},score);
      await frame.waitForFunction(kind=>{const g=__flap.dbg().gates[0];return g?.kind===kind&&g.x<document.querySelector('#flap').clientWidth/document.querySelector('#flap').clientHeight*720*.55},kind);
      stages.push(kind);if(out)await page.screenshot({path:path.join(out,`${engine}-${width}-${kind}.png`)});
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('flapv_best')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('flapv_won')),null);
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);assert(!await frame.evaluate(()=>__preview.active()));
    const before=await frame.evaluate(()=>JSON.stringify(__flap.dbg()));await page.waitForTimeout(250);assert.equal(await frame.evaluate(()=>JSON.stringify(__flap.dbg())),before);
    await page.emulateMedia({reducedMotion:'no-preference'});await frame.waitForFunction(()=>__preview.active());
    await page.locator('#flapPlay').click();assert(!await frame.evaluate(()=>__preview.active()));await page.locator('#flapExit').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'flapPlay');assert.deepEqual(errors,[]);
    if(out)fs.writeFileSync(path.join(out,`${engine}-${width}-motion.json`),JSON.stringify(samples,null,2));
    console.log('PASS rendered preview',engine,width,height);return {engine,width,height,frames:samples.length,stages,pauseResume:true,playExit:true,errors};
  }finally{await context.close();await browser.close()}
}
(async()=>{if(out)fs.mkdirSync(out,{recursive:true});const browsers=[];for(const row of [['chromium',1280,900],['webkit',390,844],['firefox',1280,900]])browsers.push(await journey(...row));const report={time:new Date().toISOString(),trajectories,browsers,limits:'Browser engines and viewport emulation; no physical-device certification. Stage screenshot fixtures are separate from the full deterministic route simulations. External transport blocked.'};if(out)fs.writeFileSync(path.join(out,'hop-cycle-results.json'),JSON.stringify(report,null,2));})().catch(e=>{console.error(e);process.exitCode=1});
