// Controlled foreground recovery: decoded photos must stay painted throughout
// the preview, then retain their geometry at the interactive Vault handoff.
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
assert(base&&out,'Set BASE_URL to the verified preview and EVIDENCE_DIR outside the checkout');
fs.mkdirSync(out,{recursive:true});
const rows=[];
const save=()=>fs.writeFileSync(path.join(out,'vault-preview-resume.json'),JSON.stringify({base,time:new Date().toISOString(),rows},null,2));
async function run(engine){
 const browser=await pw[engine].launch(),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();
 const row={engine,samples:[],errors:[],status:'RUNNING'};rows.push(row);page.setDefaultTimeout(30000);
 page.on('pageerror',e=>row.errors.push(e.message));
 await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
 async function geometry(){return page.evaluate(()=>({top:vaultInvitation.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top+nextDrop.scrollTop,travel:vaultInvitation.offsetHeight-nextDrop.clientHeight}));}
 async function scroll(progress){await page.evaluate(({top,travel,progress})=>nextDrop.scrollTo({top:top+travel*progress,behavior:'instant'}),{...await geometry(),progress});await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))-p)<.005,progress);}
 async function sample(label){
  // Two frames allow the real event handlers and their queued layout work to run.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const result=await page.evaluate(()=>{const image=plane.querySelector('.vault-centrepiece'),r=image.getBoundingClientRect(),style=getComputedStyle(vault);return {visibility:style.visibility,opacity:Number(style.opacity),preview:vault.classList.contains('vault-previewing'),decoded:image.complete&&image.naturalWidth>0,imageVisibility:getComputedStyle(image).visibility,rect:r.toJSON(),progress:Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress')),viewport:{width:innerWidth,height:innerHeight}}});
  row.samples.push({label,...result});save();
  assert.equal(result.visibility,'visible',label+': Vault hidden');assert.equal(result.opacity,1,label+': Vault transparent');
  assert.equal(result.decoded,true,label+': lead photo not decoded');assert.equal(result.imageVisibility,'visible',label+': lead photo hidden');
  assert(result.rect.width>0&&result.rect.height>0&&result.rect.bottom>0&&result.rect.right>0&&result.rect.top<result.viewport.height&&result.rect.left<result.viewport.width,label+': lead photo outside view');
  return result;
 }
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!nextDrop.inert);
  await page.locator('#collectionScrollCue').click();await page.waitForFunction(()=>getComputedStyle(nextDrop).scrollSnapType==='none');
  for(const progress of [0,.5]){
   await scroll(progress);await page.waitForFunction(()=>vault.classList.contains('vault-previewing'));
   await page.waitForFunction(()=>{const image=plane.querySelector('.vault-centrepiece');return image.complete&&image.naturalWidth>0});
   await sample('before recovery '+progress);
   // This exercises the foreground handler; it does not claim physical app switching.
   await page.evaluate(()=>window.dispatchEvent(new Event('visibilitychange')));
   await sample('after foreground handler '+progress);
   await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
   await sample('after resize handler '+progress);
   await page.setViewportSize({width:390,height:784});
   await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))-p)<.01,progress);
   await sample('after viewport contraction '+progress);
   await page.setViewportSize({width:390,height:844});
   await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))-p)<.01,progress);
   await sample('after viewport restoration '+progress);
  }
  await scroll(.96);await page.evaluate(()=>__vaultCamera.paint(1));
  const before=await sample('final camera frame');
  await scroll(1);await page.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert);
  const after=await sample('interactive handoff');
  for(const axis of ['x','y','width','height'])assert(Math.abs(before.rect[axis]-after.rect[axis])<1.5,axis+' changed at camera handoff');
  assert.equal(after.preview,false);assert.deepEqual(row.errors,[]);
  row.status='PASS';console.log('PASS Vault preview foreground/resize and handoff',engine);
 }catch(error){row.status='FAIL';row.error=error.stack;await page.screenshot({path:path.join(out,engine+'-vault-preview-resume-FAIL.png')}).catch(()=>{});throw error;}
 finally{save();await browser.close();}
}
(async()=>{const results=await Promise.allSettled(['chromium','webkit'].map(run));for(const result of results)if(result.status==='rejected')throw result.reason;})().catch(error=>{console.error(error);process.exitCode=1});
