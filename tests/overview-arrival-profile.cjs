// Repeatable workload comparison, not a physical-iPhone FPS certification.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR,label=process.env.QA_LABEL||'candidate',passes=Number(process.env.QA_PASSES||3);
assert(base&&out);assert(/^[a-z0-9-]+$/.test(label));fs.mkdirSync(out,{recursive:true});const rows=[];
(async()=>{const browser=await chromium.launch();try{for(let pass=1;pass<=passes;pass++){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const response=await page.goto(base,{waitUntil:'load'}),sha256=createHash('sha256').update(await response.body()).digest('hex');
 if(process.env.QA_SOURCE_SHA256)assert.equal(sha256,process.env.QA_SOURCE_SHA256);
 await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert);
 await page.emulateMedia({reducedMotion:'no-preference'});
 const events=[];cdp.on('Tracing.dataCollected',e=>events.push(...e.value));
 await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing',transferMode:'ReportEvents'});
 await page.evaluate(()=>{window.profileFrames=[];window.profilePhase='signup';window.profileRun=true;let previous=performance.now();function sample(t){profileFrames.push({phase:profilePhase,gap:t-previous,moving:__vaultEntryGuide.moving});previous=t;if(profileRun)requestAnimationFrame(sample)}requestAnimationFrame(sample);performance.mark('signup-start')});
 await page.locator('#collectionScrollCue').click();await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='signup');
 await page.evaluate(()=>performance.mark('signup-end'));
 const before=await page.evaluate(()=>({ready:document.querySelectorAll('#plane img.asset-ready').length,total:document.querySelectorAll('#plane img').length}));
 await page.evaluate(()=>{profilePhase='arrival';performance.mark('arrival-start')});
 await page.locator('#vaultScrollCue').click();await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='overview');
 await page.evaluate(()=>{performance.mark('arrival-end');profileRun=false});
 const observed=await page.evaluate(()=>({frames:profileFrames,ready:document.querySelectorAll('#plane img.asset-ready').length,progress:Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))}));
 const done=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');await done;
 const phases={};for(const phase of ['signup','arrival']){
  const begin=events.find(e=>e.name===phase+'-start')?.ts,end=events.find(e=>e.name===phase+'-end')?.ts;assert(begin&&end);
  const counts={};for(const e of events){if(e.ts<begin||e.ts>end||e.ph!=='X'||!/^(FunctionCall|UpdateLayoutTree|PrePaint|Paint|PaintImage|RasterTask|ImageDecodeTask|Decode Image|Layout)$/.test(e.name))continue;const r=counts[e.name]||(counts[e.name]={count:0,ms:0,max:0});r.count++;r.ms+=(e.dur||0)/1000;r.max=Math.max(r.max,(e.dur||0)/1000)}
  const gaps=observed.frames.filter(f=>f.phase===phase&&f.moving).map(f=>f.gap).sort((a,b)=>a-b);
  phases[phase]={frames:gaps.length,p95:gaps[Math.floor(gaps.length*.95)]||0,max:Math.max(...gaps),over33:gaps.filter(n=>n>33.5).length,counts};
 }
 assert.equal(observed.progress,0);assert.deepEqual(errors,[]);
 const row={label,pass,sha256,staticOpening:true,cpuSlowdown:4,dpr:3,before,readyAfter:observed.ready,phases,errors};rows.push(row);
 fs.writeFileSync(path.join(out,label+'-'+pass+'-trace.json'),JSON.stringify({traceEvents:events}));fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(rows,null,2));
 console.log(JSON.stringify({label,pass,before,readyAfter:observed.ready,phases}));await context.close();
 }}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
