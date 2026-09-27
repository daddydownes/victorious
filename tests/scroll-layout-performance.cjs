'use strict';
// A/B browser-engine measurements. Narrow WebKit is a desktop engine viewport,
// not physical iPhone touch. Full-film/CDP-touch journeys are tested separately.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),pw=require('playwright');
const out=process.env.EVIDENCE_DIR,base=process.env.BASELINE_URL,candidate=process.env.BASE_URL;
assert(out&&base&&candidate);fs.mkdirSync(out,{recursive:true});
const rows=[];const save=()=>fs.writeFileSync(path.join(out,'layout-comparison.json'),JSON.stringify(rows,null,2));
function instrument(){
 const raf=window.requestAnimationFrame.bind(window),rect=Element.prototype.getBoundingClientRect;
 window.__layoutQA={active:false,rects:0,rectMs:0,frames:[],last:0,callbacks:{}};
 Element.prototype.getBoundingClientRect=function(...args){const q=__layoutQA,t=performance.now();const result=rect.apply(this,args);if(q.active){q.rects++;q.rectMs+=performance.now()-t}return result};
 window.requestAnimationFrame=fn=>raf(function(t){const start=performance.now();try{return fn(t)}finally{const q=__layoutQA;if(q.active){const k=fn.name||'anonymous',r=q.callbacks[k]||(q.callbacks[k]={count:0,ms:0});r.count++;r.ms+=performance.now()-start}}});
 function sample(t){const q=__layoutQA;if(q.active&&q.last)q.frames.push(t-q.last);q.last=q.active?t:0;raf(sample)}raf(sample);
}
async function state(page){return page.evaluate(()=>{
 const p=document.getElementById('nextDrop'),s=document.getElementById('collectionSignup'),v=document.getElementById('vaultInvitation'),g=window.__vaultEntryGuide,r=p.getBoundingClientRect();
 return {top:p.scrollTop,height:p.clientHeight,signup:s.getBoundingClientRect().top-r.top+p.scrollTop,overview:v.getBoundingClientRect().top-r.top+p.scrollTop,target:g.target,moving:g.moving,entered:g.entered,phase:__guide.phase(),camera:document.getElementById('dive').style.transform,clip:document.getElementById('vault').style.clipPath,vaultInert:document.getElementById('vault').inert};
})}
(async()=>{
 for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch();
 try{for(const [width,height]of [[390,844],[1440,900]])for(let pass=1;pass<=2;pass++)for(const version of (pass%2?['baseline','candidate']:['candidate','baseline'])){
  const tag=`${engine}-${width}-${pass}-${version}`,row={tag,engine,width,height,pass,version,input:'wheel; static opening then normal motion',segments:[],errors:[]};rows.push(row);
  const context=await browser.newContext({viewport:{width,height},isMobile:false,hasTouch:false,reducedMotion:'reduce'});
  await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));await context.addInitScript(instrument);
  const page=await context.newPage();page.on('pageerror',e=>row.errors.push(e.message));
  try{
   const response=await page.goto((version==='baseline'?base:candidate)+`?layout-qa=${tag}&vaultPan=native`,{waitUntil:'domcontentloaded'});
   row.sha256=createHash('sha256').update(await response.body()).digest('hex');
   await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert,{}, {timeout:45000});
   await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(600);
   const cdp=engine==='chromium'?await context.newCDPSession(page):null;if(cdp)await cdp.send('Performance.enable');
   async function metrics(){if(!cdp)return null;return Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]))}
   async function segment(label,direction=0){
    const before=await state(page),old=await metrics();
    await page.evaluate(()=>Object.assign(__layoutQA,{active:true,rects:0,rectMs:0,frames:[],last:0,callbacks:{}}));
    if(direction){await page.mouse.move(width*.5,height*.72);await page.mouse.wheel(0,direction*height)}
    await page.waitForTimeout(900);
    const stats=await page.evaluate(()=>{const q=__layoutQA;q.active=false;const a=q.frames.sort((x,y)=>x-y);return {rects:q.rects,rectMs:q.rectMs,callbacks:q.callbacks,frames:a.length,p95:a[Math.floor(a.length*.95)]||0,over34:a.filter(x=>x>34).length,max:a.at(-1)||0}});
    const current=await metrics();if(old)stats.chromium=Object.fromEntries(['LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration'].map(k=>[k,current[k]-old[k]]));
    await page.waitForFunction(()=>!__vaultEntryGuide.moving,{}, {timeout:15000});
    row.segments.push({label,before,after:await state(page),...stats});save();
   }
   async function shot(label){
    if(pass!==1)return;
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#nextDrop img')].filter(x=>x.currentSrc).map(x=>x.decode().catch(()=>{})))});
    await page.screenshot({path:path.join(out,tag+'-'+label+'.png'),animations:'disabled'});
   }
   await segment('collection-idle');await shot('collection');
   await segment('collection-to-signup',1);let s=await state(page);assert(Math.abs(s.top-s.signup)<4);
   await segment('signup-idle');await shot('signup');
   row.animations=await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.closest?.('#seamGold')).map(a=>({name:a.animationName,state:a.playState})));
   if(version==='candidate')assert(row.animations.every(a=>a.state!=='running'),'Hidden seam still animates');
   for(let i=0;i<5&&(await state(page)).target!=='overview';i++)await segment('approach-'+i,1);
   s=await state(page);assert.equal(s.target,'overview');assert(Math.abs(s.top-s.overview)<4);assert(!s.entered);
   await segment('overview-idle');await shot('overview');
   await segment('reverse-to-signup',-1);assert.equal((await state(page)).entered,false);
   for(let i=0;i<5&&(await state(page)).target!=='overview';i++)await segment('return-overview-'+i,1);
   await segment('overview-to-vault',1);
   await page.waitForFunction(()=>__guide.phase()==='vault'&&!document.getElementById('vault').inert,{}, {timeout:15000});
   await segment('vault-idle');await segment('vault-pan',1);await shot('vault');
   assert.deepEqual(row.errors,[]);row.status='PASS';
  }catch(error){row.status='FAIL';row.error=error.stack;await page.screenshot({path:path.join(out,tag+'-FAIL.png')}).catch(()=>{})}
  finally{console.log(JSON.stringify(row));save();await context.close()}
 }}finally{await browser.close()}
 }
 assert(rows.every(r=>r.status==='PASS'),'A/B browser journey failed; inspect evidence');
 const paired=rows.filter(r=>r.version==='candidate').map(r=>{
  const b=rows.find(x=>x.engine===r.engine&&x.width===r.width&&x.pass===r.pass&&x.version==='baseline');
  return {engine:r.engine,width:r.width,pass:r.pass,segments:r.segments.map(c=>{const a=b.segments.find(x=>x.label===c.label);return {label:c.label,baselineRects:a?.rects,candidateRects:c.rects,baselineLayouts:a?.chromium?.LayoutCount,candidateLayouts:c.chromium?.LayoutCount,baselineP95:a?.p95,candidateP95:c.p95}})};
 });
 fs.writeFileSync(path.join(out,'layout-summary.json'),JSON.stringify(paired,null,2));
 const chrome=paired.filter(x=>x.engine==='chromium').flatMap(x=>x.segments);
 assert(chrome.filter(x=>['collection-to-signup','approach-0'].includes(x.label)).every(x=>x.candidateRects<x.baselineRects/2),'Geometry-read regression');
 assert(chrome.filter(x=>['signup-idle','overview-idle'].includes(x.label)).every(x=>x.candidateLayouts<x.baselineLayouts),'Hidden-layout regression');
 console.log('PASS A/B journeys, hidden-animation pause and reduced layout work.');
})().catch(e=>{save();console.error(e);process.exitCode=1});
