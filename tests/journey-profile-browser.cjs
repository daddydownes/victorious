// Diagnostic samples only; phone-sized automation is not physical Android QA.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
if(!base||!out)throw Error('Set BASE_URL and EVIDENCE_DIR');fs.mkdirSync(out,{recursive:true});
(async()=>{
for(const mobile of [false,true]){
const browser=await chromium.launch();
try{
const context=await browser.newContext({viewport:{width:mobile?412:1440,height:mobile?915:900},deviceScaleFactor:mobile?2.625:1,hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed'));
await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(1000);
const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');const rows=[];
async function sample(stage){
 const before=(await cdp.send('Performance.getMetrics')).metrics;await page.waitForTimeout(1800);const after=(await cdp.send('Performance.getMetrics')).metrics;
 const state=await page.evaluate(()=>({phase:window.__guide.phase(),world:window.__worldJourney.state,body:document.body.className,animations:document.getAnimations().filter(a=>a.playState==='running').map(a=>({name:a.animationName||'',target:a.effect?.target?.id||String(a.effect?.target?.className)||'',visibility:a.effect?.target instanceof Element?getComputedStyle(a.effect.target).visibility:''}))}));
 const delta={};for(const a of after){const b=before.find(b=>b.name===a.name);if(b&&(/Duration|Count/.test(a.name)))delta[a.name]=+(a.value-b.value).toFixed(6)}
 rows.push({stage,mobile,delta,...state});console.log('PROFILE',JSON.stringify(rows.at(-1)));
 await page.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-'+stage+'.png')});
 fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'.json'),JSON.stringify({browser:browser.version(),staticOpening:true,rows,errors},null,2));
}
await sample('collection');await page.locator('#collectionScrollCue').click();await page.waitForTimeout(800);await sample('signup');
await page.locator('#vaultScrollCue').click();await page.waitForTimeout(850);await sample('overview');
await page.locator('#nextDrop').focus();await page.keyboard.press('End');await page.waitForFunction(()=>window.__guide.phase()==='vault'&&!document.getElementById('vault').inert);await page.waitForTimeout(1000);await sample('vault');
await page.locator('#surfaceBtn').click();await page.waitForFunction(()=>window.__worldJourney.state==='story'&&!document.getElementById('world').classList.contains('film-waiting'),{},{timeout:30000});await sample('surface');
await page.locator('#worldNext').click();await page.waitForFunction(()=>window.__worldJourney.state==='preview');await page.waitForTimeout(1500);await sample('preview');
await page.locator('#worldPlay').click();await page.waitForTimeout(1500);await sample('game-idle');
await page.locator('#flapAction').click();await page.waitForTimeout(250);await sample('game-running');
await page.locator('#flapExit').click();await page.locator('#worldReturnVault').click();await page.waitForTimeout(1000);await sample('return-vault');
if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close()}
}
})().catch(e=>{console.error(e);process.exitCode=1});
