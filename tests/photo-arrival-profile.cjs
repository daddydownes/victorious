'use strict';
// All effect switches are diagnostic only; never written to production CSS.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{webkit}=require('playwright');
const rows=[],out=process.env.EVIDENCE_DIR,base=process.env.BASE_URL;assert(out&&base);fs.mkdirSync(out,{recursive:true});
const save=()=>fs.writeFileSync(path.join(out,'photo-arrival.json'),JSON.stringify(rows,null,2));
(async()=>{const browser=await webkit.launch();try{
for(const variant of ['unchanged','warm-images','promote-images','without-photo-filters'])for(let pass=1;pass<=2;pass++){
 const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await c.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));const page=await c.newPage();
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!nextDrop.inert);
 await page.emulateMedia({reducedMotion:'no-preference'});
 if(variant==='promote-images')await page.addStyleTag({content:'.vault-plane img{will-change:transform}'});
 if(variant==='without-photo-filters')await page.addStyleTag({content:'.vault-plane img{filter:none!important;box-shadow:none!important}'});
 await page.locator('#collectionScrollCue').click();await page.waitForFunction(()=>window.__vaultEntryGuide.target==='signup'&&!window.__vaultEntryGuide.moving);
 if(variant==='warm-images')await page.evaluate(()=>{window.__vaultCamera.warmOverview()});
 await page.waitForTimeout(1200);
 const before=await page.evaluate(()=>({ready:document.querySelectorAll('.vault-plane img.asset-ready').length,all:document.querySelectorAll('.vault-plane img').length}));
 await page.evaluate(()=>{window.__photoFrames=[];window.__photoLast=0;window.__photoStart=performance.now();function tick(t){if(window.__photoLast)window.__photoFrames.push(t-window.__photoLast);window.__photoLast=t;if(performance.now()-window.__photoStart<1600)requestAnimationFrame(tick)}requestAnimationFrame(tick)});
 await page.mouse.move(195,610);await page.mouse.wheel(0,930);await page.waitForTimeout(1700);
 const result=await page.evaluate(()=>{const a=window.__photoFrames.sort((a,b)=>a-b);return {frames:a.length,p95:a[Math.floor(a.length*.95)],max:a.at(-1),over34:a.filter(n=>n>34).length,ready:document.querySelectorAll('.vault-plane img.asset-ready').length,target:window.__vaultEntryGuide.target,moving:window.__vaultEntryGuide.moving}});
 rows.push({variant,pass,before,...result});save();console.log(JSON.stringify(rows.at(-1)));await c.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);save();process.exitCode=1});
