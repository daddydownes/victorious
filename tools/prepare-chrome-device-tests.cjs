// Extend the existing assertion suite; do not weaken its journey checks.
const fs=require('node:fs'),assert=require('node:assert/strict');
const file='tests/entry-scroll-browser.cjs';let s=fs.readFileSync(file,'utf8');
function one(a,b){assert.equal(s.split(a).length,2,'Expected one match: '+a);s=s.replace(a,b)}
one('const configs=process.env.QA_CASE?',"allConfigs.push(['chromium',412,915],['chromium',360,800]);\nconst configs=process.env.QA_CASE?");
one("const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,reducedMotion:motion,", "const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:Number(process.env.QA_DPR||1),hasTouch:mobile,reducedMotion:motion,");
one("const cdp=touch?await context.newCDPSession(page):null;let view={width,height};", "const cdp=engine==='chromium'?await context.newCDPSession(page):null;let view={width,height};\n  if(cdp&&process.env.QA_CPU_RATE)await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.QA_CPU_RATE)});");
one("const x=view.width*.5,start=view.height*(direction>0?.84:.16),end=start-direction*view.height*fraction;", "const start=view.height*(direction>0?.84:.16),end=start-direction*view.height*fraction;\n   // A navigation swipe must not start in the intentionally protected email input.\n   const x=await page.evaluate(({width,y})=>{for(const f of [.5,.08,.92,.02,.98]){const el=document.elementFromPoint(width*f,y);if(el?.closest('#nextDrop')&&!el.closest('input,textarea,select,[contenteditable]'))return width*f}throw Error('No non-editable entry swipe start')},{width:view.width,y:start});");
fs.writeFileSync(file,s);
