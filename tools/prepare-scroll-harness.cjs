'use strict';
// Test-only corrections; no application or asset changes.
const fs=require('node:fs'),assert=require('node:assert/strict');
let perf=fs.readFileSync('tests/scroll-layout-performance.cjs','utf8');
// Playwright's animations:disabled mutates CSS animations during screenshots.
// Never use it inside a running performance experiment.
perf=perf.replace("animations:'disabled'","animations:'allow'");
perf=perf.replace("assert(chrome.filter(x=>['signup-idle','overview-idle'].includes(x.label)).every(x=>x.candidateLayouts<x.baselineLayouts),'Hidden-layout regression');", "const idle=chrome.filter(x=>['signup-idle','overview-idle'].includes(x.label));\n assert(idle.reduce((n,x)=>n+x.candidateLayouts,0)<idle.reduce((n,x)=>n+x.baselineLayouts,0)/2,'Hidden-layout regression');");
fs.writeFileSync('tests/scroll-layout-performance.cjs',perf);
let entry=fs.readFileSync('tests/entry-scroll-browser.cjs','utf8');
const old='const x=view.width*.5,start=view.height*(direction>0?.84:.16),end=start-direction*view.height*fraction;';
assert(entry.includes(old));
entry=entry.replace(old,`// Keep the original centre gesture, including the receipt-area regression.
   // QA_SAFE_TOUCH=1 is an explicit baseline-only isolation probe.
   const start=view.height*(direction>0?.84:.16),end=start-direction*view.height*fraction;
   let x=view.width*.5;
   const hit=await page.evaluate(({x,y})=>{const e=document.elementFromPoint(x,y);return {id:e?.id,tag:e?.tagName,editable:!!e?.closest('input,textarea,select,[contenteditable]'),form:!!e?.closest('form')}},{x,y:start});
   if(process.env.QA_SAFE_TOUCH==='1'&&view.width>view.height)x=view.width*.08;
   const actual=await page.evaluate(({x,y})=>{const e=document.elementFromPoint(x,y);return {id:e?.id,tag:e?.tagName,editable:!!e?.closest('input,textarea,select,[contenteditable]'),form:!!e?.closest('form')}},{x,y:start});
   (row.touchStarts||(row.touchStarts=[])).push({direction,x,y:start,original:hit,actual});save();`);
fs.writeFileSync('tests/entry-scroll-browser.cjs',entry);
console.log('Prepared screenshot isolation and recorded original touch-start targets.');
