// Held-finger regression: measure real CDP touch input with photos already decoded.
// Static opening setup isolates the scroll mechanism; full journeys run separately.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR,expectFollow=process.env.QA_EXPECT_FOLLOW!=='0';
assert(base&&out,'Set BASE_URL and EVIDENCE_DIR');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch(),rows=[];
 try{
  for(const phase of ['arrival','zoom']){
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(base,{waitUntil:'load'}),sha256=createHash('sha256').update(await response.body()).digest('hex');
   if(process.env.QA_SOURCE_SHA256)assert.equal(sha256,process.env.QA_SOURCE_SHA256);
   await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert);
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.locator('#collectionScrollCue').click();
   await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='signup');
   await page.waitForFunction(()=>document.querySelectorAll('#plane img.asset-ready').length===33);
   await page.evaluate(()=>Promise.all([...document.querySelectorAll('#plane img')].map(img=>img.decode())));
   if(phase==='zoom'){
    await page.locator('#vaultScrollCue').click();
    await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='overview');
   }
   await page.evaluate(()=>{
    const panel=document.getElementById('nextDrop'),section=document.getElementById('vaultInvitation');
    const overview=section.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop,range=section.offsetHeight-panel.clientHeight;
    window.touchFollowQA={origin:panel.scrollTop,overview,range,last:panel.scrollTop,paints:[],inputs:[],entries:0};
    const paint=__vaultCamera.paint;
    __vaultCamera.paint=function(progress,offset){touchFollowQA.last=overview+progress*range-offset;touchFollowQA.paints.push({t:performance.now(),position:touchFollowQA.last});return paint.apply(this,arguments)};
    panel.addEventListener('touchmove',e=>touchFollowQA.inputs.push({y:e.touches[0]?.clientY,cancelable:e.cancelable,prevented:e.defaultPrevented}));
    addEventListener('click',e=>{if(e.target.closest('#nextVaultHold'))touchFollowQA.entries++},{capture:true});
   });
   if(phase==='zoom')await page.screenshot({path:path.join(out,'overview.png')});
   const cdp=await context.newCDPSession(page),samples=[];
   const sample=async(label,y)=>samples.push({label,y,...await page.evaluate(()=>({t:performance.now(),position:touchFollowQA.last,native:document.getElementById('nextDrop').scrollTop,entered:__vaultEntryGuide.entered,deliveredY:touchFollowQA.inputs.at(-1)?.y??650,inputCount:touchFollowQA.inputs.length}))});
   let y=650;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:8,y,id:1}]});
   await sample('start',y);
   for(const [label,count,delta]of [['forward',40,-4],['reverse',30,4],['forward-again',15,-4]]){
    for(let step=0;step<count;step++){
     y+=delta;
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:8,y,id:1}]});
     await page.waitForTimeout(22);await sample(label,y);
    }
   }
   await sample('hold-start',y);await page.waitForTimeout(250);await sample('hold-end',y);
   assert(samples.every(s=>!s.entered),'Held gesture cannot commit entry');
   const metrics={
    maximumStep:Math.max(...samples.slice(1).map((s,i)=>Math.abs(s.position-samples[i].position))),
    // Browsers apply their own initial touch slop before delivering touchmove.
    // Compare camera movement with delivered input, not withheld CDP commands.
    maximumExcessStep:Math.max(...samples.slice(1).map((s,i)=>Math.abs(s.position-samples[i].position)-Math.abs(s.deliveredY-samples[i].deliveredY))),
    heldDrift:Math.abs(samples.at(-1).position-samples.at(-2).position),
    reverseErrors:samples.filter((s,i)=>i>0&&s.label==='reverse'&&s.position>samples[i-1].position+.1).length,
    followError:Math.max(...samples.filter(s=>s.label!=='start').map(s=>Math.abs((s.position-samples[0].position)-(650-s.deliveredY))))
   };
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   // A fresh contact must stop an unfinished completion immediately, before
   // touchmove clears either browser or controller intent slop. Observe the
   // computed photo-camera transform, rather than its mathematical position.
   await page.waitForFunction(()=>__vaultEntryGuide.moving);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:8,y:650,id:2}]});
   const freezeState=()=>page.evaluate(()=>({transform:getComputedStyle(document.getElementById('dive')).transform,native:document.getElementById('nextDrop').scrollTop,phase:__guide.phase(),entered:__vaultEntryGuide.entered,entries:touchFollowQA.entries}));
   const freezeStart=await freezeState();
   await page.waitForTimeout(180);const freezeHeld=await freezeState();
   assert.equal(freezeHeld.transform,freezeStart.transform,phase+': new held contact moved the computed photo transform');
   assert.equal(freezeHeld.native,freezeStart.native,phase+': new held contact moved the entry scroller');
   assert(!freezeHeld.entered,phase+': completion entered while the new finger was held');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:8,y:647,id:2}]});
   await page.waitForTimeout(40);const freezeSlop=await freezeState();
   assert.equal(freezeSlop.transform,freezeStart.transform,phase+': 3px subslop movement restarted the photo transform');
   assert.equal(freezeSlop.native,freezeStart.native,phase+': 3px subslop movement restarted native entry scrolling');
   assert(!freezeSlop.entered,phase+': subslop contact granted entry');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForFunction(()=>!__vaultEntryGuide.moving);
   if(phase==='zoom')await page.waitForFunction(()=>__guide.phase()==='vault');
   else await page.waitForFunction(()=>Math.abs(document.getElementById('nextDrop').scrollTop-touchFollowQA.overview)<3);
   const final=await page.evaluate(()=>({phase:__guide.phase(),entered:__vaultEntryGuide.entered,top:document.getElementById('nextDrop').scrollTop,entries:touchFollowQA.entries}));
   assert.equal(final.entries,phase==='zoom'?1:0,phase+': releasing the new contact must complete its original landing exactly once');
   if(phase==='zoom')await page.screenshot({path:path.join(out,'vault.png')});
   const row={phase,sha256,staticOpening:true,imagesDecodedBeforeInput:true,metrics,samples,errors,freeze:{start:freezeStart,held180ms:freezeHeld,subslop3px:freezeSlop},final,inputs:await page.evaluate(()=>touchFollowQA.inputs)};
   rows.push(row);fs.writeFileSync(path.join(out,'touch-follow.json'),JSON.stringify(rows,null,2));
   if(expectFollow){
    assert(metrics.maximumExcessStep<=1,phase+': camera movement exceeded delivered finger movement by '+metrics.maximumExcessStep);
    assert(metrics.heldDrift<=1,phase+': stationary held finger must hold the camera');
    assert.equal(metrics.reverseErrors,0,phase+': reversing the finger must reverse the camera immediately');
    assert(metrics.followError<=8,phase+': camera must follow finger displacement within intent slop');
   }
   assert.deepEqual(errors,[]);console.log(phase,JSON.stringify(metrics));await context.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
