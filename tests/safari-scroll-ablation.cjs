'use strict';
// Diagnostic CSS below is temporary browser instrumentation, NOT a site change.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('playwright');
const out=process.env.EVIDENCE_DIR,base=process.env.BASE_URL;
assert(out&&base);fs.mkdirSync(out,{recursive:true});const rows=[];
const save=()=>fs.writeFileSync(path.join(out,'ablation.json'),JSON.stringify(rows,null,2));
const variants=[
 ['baseline',''],
 ['hide-covered-legacy','body.next-drop-landed #stage,body.next-drop-landed .seamsec{visibility:hidden!important}'],
 ['hide-masthead','.next-drop-mark,.collection-intro .next-drop-kicker,.collection-header{visibility:hidden!important}'],
 ['promote-masthead','.next-drop-mark .vctrs-glyph,.next-drop-mark::before,.next-drop-mark::after{will-change:transform}'],
 ['promote-scroller','.next-drop{transform:translateZ(0)}'],
 ['disable-all-animation','*,*::before,*::after{animation:none!important;transition:none!important}']
];
(async()=>{for(const [engine,width,height] of [['webkit',1440,900],['webkit',390,844],['chromium',1440,900]]){
 const browser=await pw[engine].launch();try{
 const c=await browser.newContext({viewport:{width,height},hasTouch:width<900,reducedMotion:'reduce'});
 await c.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));const p=await c.newPage();
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!nextDrop.inert);
 await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(1000);
 for(const [variant,css] of variants){
  const style=await p.addStyleTag({content:css});
  await p.evaluate(()=>{for(const a of document.getAnimations())if(a.playState==='running')a.currentTime=0});
  const result=await p.evaluate(()=>new Promise(resolve=>{
   let last=0;const gaps=[],start=performance.now();
   function sample(now){if(last)gaps.push(now-last);last=now;if(performance.now()-start<3500){requestAnimationFrame(sample);return}
    gaps.sort((a,b)=>a-b);resolve({frames:gaps.length,p95:gaps[Math.floor(gaps.length*.95)]||0,max:gaps.at(-1)||0,over34:gaps.filter(n=>n>34).length,elapsed:performance.now()-start});}
   requestAnimationFrame(sample);
  }));
  rows.push({engine,width,height,variant,...result});save();console.log(JSON.stringify(rows.at(-1)));await style.evaluate(el=>el.remove());
 }
 await c.close();
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exitCode=1});
