'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),pw=require('playwright');
const out=process.env.EVIDENCE_DIR,base=process.env.BASE_URL;assert(out&&base);
const rows=[];
const variants={
 baseline:'',
 retired:'body.next-drop-landed .seamsec *,body.next-drop-landed .seamsec *::before,body.next-drop-landed .seamsec *::after,body.next-vault-open .seamsec *,body.next-vault-open .seamsec *::before,body.next-vault-open .seamsec *::after{animation:none!important}',
 backdrop:'.popup-countdown{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
 logo:'.next-drop-mark,.next-drop-mark *,.next-drop-mark::before,.next-drop-mark::after{animation:none!important;filter:none!important}',
 photoFilters:'.vault-plane img{filter:none!important}',
 photoLayers:'.vault-plane img{will-change:transform}',
 paused:'*,*::before,*::after{animation-play-state:paused!important}'
};
(async()=>{const browser=await pw.webkit.launch();try{
 for(const [variant,css]of Object.entries(variants)){
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await ctx.route('**/formsubmit.co/**',route=>route.abort());
  const p=await ctx.newPage();const row={variant,errors:[],segments:[]};rows.push(row);p.on('pageerror',e=>row.errors.push(e.message));
  try{
   await p.goto(base+'?isolation='+variant,{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert);
   await p.emulateMedia({reducedMotion:'no-preference'});if(css)await p.addStyleTag({content:css});await p.waitForTimeout(500);
   row.animations=await p.evaluate(()=>document.getAnimations().map(a=>{const t=a.effect?.target,r=t?.getBoundingClientRect();return{name:a.animationName,state:a.playState,target:t?.id||t?.className,pseudo:a.effect?.pseudoElement,rect:r?{x:r.x,y:r.y,w:r.width,h:r.height}:null}}));
   for(const stage of ['collection','signup','overview','vault']){
    await p.evaluate(()=>{window.__iso={times:[],last:0,active:true};function sample(t){const q=window.__iso;if(!q.active)return;if(q.last)q.times.push(t-q.last);q.last=t;requestAnimationFrame(sample)}requestAnimationFrame(sample)});
    if(stage!=='collection'){await p.mouse.move(720,650);await p.mouse.wheel(0,1000)}
    await p.waitForTimeout(1300);
    row.segments.push(await p.evaluate(label=>{const q=window.__iso;q.active=false;const a=q.times.sort((a,b)=>a-b);return{label,frames:a.length,p95:a[Math.floor(a.length*.95)]||0,max:a.at(-1)||0,over34:a.filter(x=>x>34).length,target:window.__vaultEntryGuide.target,moving:window.__vaultEntryGuide.moving,phase:window.__guide.phase()}},stage));
    await p.waitForFunction(()=>!window.__vaultEntryGuide.moving,{}, {timeout:10000});
   }
   row.status='PASS';
  }catch(e){row.status='FAIL';row.error=e.stack}
  console.log('ISOLATION',JSON.stringify(row));fs.writeFileSync(path.join(out,'render-isolation.json'),JSON.stringify(rows,null,2));await ctx.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
