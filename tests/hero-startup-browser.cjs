// Actual media startup, plus an injected cold-start delay; no media seeks.
// Rendering-engine checks do not establish physical iPhone timing.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const pw=require('playwright'),{createHash}=require('node:crypto');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR,engine=process.env.QA_HERO_ENGINE||'chromium';
assert(base&&out,'Set BASE_URL and EVIDENCE_DIR');fs.mkdirSync(out,{recursive:true});
const rows=[],save=()=>fs.writeFileSync(path.join(out,'hero-'+engine+'.json'),JSON.stringify(rows,null,2));
(async()=>{
 const browser=await pw[engine].launch();
 try{for(const delay of [0,900]){
  const row={engine,delay,status:'RUNNING',errors:[]};rows.push(row);save();
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await context.route('**/formsubmit.co/**',route=>route.fulfill({json:{success:true}}));
  await context.addInitScript(({delay})=>{
   const q=window.__heroQA={calls:[],pauses:[],frames:[],samples:[]},nativePlay=HTMLMediaElement.prototype.play,nativePause=HTMLMediaElement.prototype.pause;
   HTMLMediaElement.prototype.play=function(){
    if(this.id!=='film')return nativePlay.call(this);
    const call=q.calls.length+1;q.calls.push({call,now:performance.now(),time:this.currentTime});
    if(call===2&&delay)return new Promise((resolve,reject)=>setTimeout(()=>nativePlay.call(this).then(resolve,reject),delay));
    return nativePlay.call(this);
   };
   HTMLMediaElement.prototype.pause=function(){if(this.id==='film')q.pauses.push({now:performance.now(),time:this.currentTime});return nativePause.call(this)};
   const frame=HTMLVideoElement.prototype.requestVideoFrameCallback;
   if(frame)HTMLVideoElement.prototype.requestVideoFrameCallback=function(callback){
    const call=q.calls.length;
    return frame.call(this,(now,meta)=>{if(this.id==='film')q.frames.push({now,call,time:meta.mediaTime,visible:document.getElementById('stage').classList.contains('playing')});callback(now,meta)});
   };
   function sample(){
    const stage=document.getElementById('stage'),slot=document.getElementById('vslot');
    if(stage&&slot&&q.calls.length>=2&&!document.body.classList.contains('next-drop-entering'))q.samples.push({now:performance.now(),visible:stage.classList.contains('playing'),crossfade:stage.classList.contains('opening-crossfade'),v:Number(getComputedStyle(slot).opacity)});
    if(!document.body?.classList.contains('next-drop-entering'))requestAnimationFrame(sample);
   }
   addEventListener('DOMContentLoaded',sample);
  },{delay});
  const page=await context.newPage();page.on('pageerror',error=>row.errors.push(error.message));page.setDefaultTimeout(20000);
  try{
   const response=await page.goto(base,{waitUntil:'domcontentloaded'});
   row.sha256=createHash('sha256').update(await response.body()).digest('hex');
   if(process.env.QA_SOURCE_SHA256)assert.equal(row.sha256,process.env.QA_SOURCE_SHA256);
   await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert);
   row.media=await page.locator('#film').evaluate(f=>({time:f.currentTime,duration:f.duration,ended:f.ended,error:f.error?.message||null}));
   row.startup=await page.evaluate(()=>__heroQA);
   assert.equal(row.startup.calls.length,2,'One preparation and one real playback expected');
   assert(row.startup.calls[0].now<row.startup.calls[1].now-1800,'Preparation did not run under the intro');
   assert.equal(row.startup.calls[1].time,0,'Actual film must start at zero');
   assert(row.media.ended&&row.media.time>=row.media.duration-.05,'Complete film did not play: '+JSON.stringify(row.media));
   assert(row.startup.frames.some(f=>f.call===1),'Hidden preparation did not deliver a frame');
   const visible=row.startup.samples.find(s=>s.visible);
   assert(visible,'Film never became visible');
   const firstReal=row.startup.frames.find(f=>f.call===2);
   assert(firstReal&&visible.now>=firstReal.now-20,'V was retired before a real frame');
   const waiting=row.startup.samples.filter(s=>!s.visible);
   assert(waiting.every(s=>s.v>.99),'V faded while waiting for actual playback');
   if(delay)assert(visible.now-row.startup.calls[1].now>=delay-20,'Cold-start delay was not exercised');
   assert(row.startup.samples.some(s=>s.visible&&s.crossfade&&s.v>0&&s.v<1),'Original fade did not overlap moving film');
   if(!delay){
    await page.locator('#collectionScrollCue').click();
    await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='signup');
    await page.locator('#vaultScrollCue').click();
    await page.waitForFunction(()=>!__vaultEntryGuide.moving);
    await page.locator('#nextVaultHold').focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>__guide.phase()==='vault'&&!document.getElementById('vault').inert);
    await page.locator('#surfaceBtn').click();
    await page.waitForFunction(()=>__worldJourney.state==='story'&&!document.getElementById('world').classList.contains('film-waiting'));
    await page.keyboard.press('Tab');await page.locator('#worldNext').focus();
    row.cue=await page.locator('#worldNext').evaluate(el=>{
     const s=getComputedStyle(el),label=getComputedStyle(el.firstElementChild);
     return {outline:s.outlineStyle,border:s.borderWidth,shadow:s.boxShadow,appearance:s.appearance,keyboard:el.matches(':focus-visible'),label:label.textDecorationLine};
    });
    assert.equal(row.cue.outline,'none');assert.equal(row.cue.border,'0px');assert.equal(row.cue.shadow,'none');assert.equal(row.cue.appearance,'none');
    assert(row.cue.keyboard&&row.cue.label.includes('underline'),'Keyboard cue is no longer indicated');
    await page.screenshot({path:path.join(out,engine+'-surface-cue.png')});
    await page.locator('#worldNext').click();await page.waitForFunction(()=>__worldJourney.state==='preview');
   }
   assert.deepEqual(row.errors,[]);row.status='PASS';console.log('PASS',engine,delay?'cold startup':'warm startup and Surface cue');
  }catch(error){row.status='FAIL';row.error=error.stack;row.media=await page.locator('#film').evaluate(f=>({time:f.currentTime,duration:f.duration,ended:f.ended,error:f.error?.message||null})).catch(()=>null);throw error}
  finally{save();await context.close()}
 }}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
