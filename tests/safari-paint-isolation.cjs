'use strict';
// Temporary CSS ablations are confined to this browser test, never the site.
// Narrow desktop WebKit uses supported wheel input, not an emulated iPhone swipe.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
assert(base&&out);fs.mkdirSync(out,{recursive:true});
const variants={
 baseline:'',
 'hidden-legacy':'.seamsec *,.seamsec *::before,.seamsec *::after{animation-play-state:paused!important}',
 'promote-mark':'.next-drop-mark::before,.next-drop-mark::after,.next-drop-mark .vctrs-glyph{will-change:transform}',
 'promote-card':'.popup-countdown{will-change:transform}',
 'promote-photos':'.vault-plane img{will-change:transform}',
 'no-filters-diagnostic':'*,*::before,*::after{filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
 'no-animations-diagnostic':'*,*::before,*::after{animation-play-state:paused!important}',
 'baseline-repeat':''
};
const rows=[];
function save(){fs.writeFileSync(path.join(out,'paint-isolation.json'),JSON.stringify(rows,null,2))}
function instrument(){
 const raw=requestAnimationFrame.bind(window);window.__paintQA={on:false,last:0,gaps:[],calls:0,scriptMs:0};
 window.requestAnimationFrame=fn=>raw(t=>{const start=performance.now();try{return fn(t)}finally{const q=window.__paintQA;if(q.on){q.calls++;q.scriptMs+=performance.now()-start}}});
 function sample(t){const q=window.__paintQA;if(q.on&&q.last)q.gaps.push(t-q.last);q.last=q.on?t:0;raw(sample)}raw(sample);
}
(async()=>{
 const browser=await pw.webkit.launch();
 try{for(const [width,height] of [[1440,900],[390,844]])for(const [variant,css]of Object.entries(variants)){
 const row={variant,width,height,platform:process.platform,engine:'Playwright WebKit',input:'wheel; static opening then normal motion',segments:[],errors:[]};rows.push(row);
 const ctx=await browser.newContext({viewport:{width,height},isMobile:false,hasTouch:false,reducedMotion:'reduce'});
 await ctx.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));await ctx.addInitScript(instrument);
 const page=await ctx.newPage();page.on('pageerror',e=>row.errors.push(e.message));
 try{
  await page.goto(base+'?paint='+variant+'&vaultPan=native',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!nextDrop.inert,{}, {timeout:45000});
  if(css)await page.addStyleTag({content:css});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(1000);
  row.animations=await page.evaluate(()=>document.getAnimations().map(a=>({name:a.animationName,state:a.playState,target:a.effect?.target?.id||a.effect?.target?.className,pseudo:a.effect?.pseudoElement})).filter(a=>a.state==='running'));
  async function sample(label,direction=0){
   await page.evaluate(()=>Object.assign(__paintQA,{on:true,last:0,gaps:[],calls:0,scriptMs:0}));
   if(direction){await page.mouse.move(width*.45,height*.75);await page.mouse.wheel(0,height*direction)}
   await page.waitForTimeout(1250);
   const metrics=await page.evaluate(()=>{const q=__paintQA;q.on=false;const g=q.gaps.sort((a,b)=>a-b);return {frames:g.length,p95:g[Math.floor(g.length*.95)]||0,max:g.at(-1)||0,over34:g.filter(x=>x>34).length,calls:q.calls,scriptMs:q.scriptMs,top:nextDrop.scrollTop,moving:__vaultEntryGuide.moving,target:__vaultEntryGuide.target,phase:__guide.phase(),panTop:dive.scrollTop,panMode:__vaultPan.mode}});
   row.segments.push({label,...metrics});
  }
  await sample('collection-idle');await sample('signup',1);assert.equal(row.segments.at(-1).target,'signup');
  for(let i=0;i<5&&await page.evaluate(()=>__vaultEntryGuide.target!=='overview');i++)await sample('approach',1);
  await page.waitForFunction(()=>!__vaultEntryGuide.moving,{}, {timeout:15000});
  await sample('overview-idle');await sample('zoom',1);
  await page.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert,{}, {timeout:15000});
  await sample('pan',1);
  row.status='PASS';assert.deepEqual(row.errors,[]);
 }catch(e){row.status='FAIL';row.error=String(e)}finally{console.log(JSON.stringify(row));save();await ctx.close()}
 }}finally{await browser.close()}
 if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
})().catch(e=>{console.error(e);save();process.exitCode=1});
