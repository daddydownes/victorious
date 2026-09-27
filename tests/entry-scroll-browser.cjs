// Completed hero -> Previous Drops -> signup/event -> overview/zoom -> Vault.
// Navigation uses actual input; no media seeks, guide calls or scrollTop writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('playwright');
const {createHash}=require('node:crypto');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR,passes=Number(process.env.QA_PASSES||4);
const patterns=['normal','reverse-jitter','spam','cancel-resize'];
assert(base&&out,'Set BASE_URL and EVIDENCE_DIR outside the checkout');
assert(Number.isInteger(passes)&&passes>=1&&passes<=8,'QA_PASSES must be 1–8');
assert(!process.env.QA_PATTERN||[...patterns,'focus'].includes(process.env.QA_PATTERN),'Unknown QA_PATTERN');
fs.mkdirSync(out,{recursive:true});const rows=[];
const allConfigs=[['chromium',390,844],['chromium',320,568],['chromium',844,390],['chromium',1440,900],['chromium',430,932],['chromium',1280,720],['chromium',390,844,'reduce'],['chromium',1440,900,'reduce'],['webkit',390,844],['webkit',844,390],['firefox',1440,900]];
allConfigs.push(['chromium',412,915],['chromium',360,800]);
const configs=process.env.QA_CASE?allConfigs.filter(c=>c.join('-')===process.env.QA_CASE):allConfigs.slice(0,4);
assert(configs.length,'Unknown QA_CASE');
const save=()=>fs.writeFileSync(path.join(out,'entry-scroll.json'),JSON.stringify({base,updated:new Date().toISOString(),rows},null,2));
const state=page=>page.evaluate(()=>{
 const p=document.getElementById('nextDrop'),v=document.getElementById('vaultInvitation'),s=document.querySelector('.signup-landing'),r=p.getBoundingClientRect();
 return {phase:window.__guide.phase(),top:p.scrollTop,height:p.clientHeight,max:p.scrollHeight-p.clientHeight,
  signup:s.getBoundingClientRect().top-r.top+p.scrollTop,overview:v.getBoundingClientRect().top-r.top+p.scrollTop,
  progress:Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress')),
  snap:getComputedStyle(p).scrollSnapType,inert:p.inert,vaultInert:document.getElementById('vault').inert,
  transform:document.getElementById('vault').style.transform,scale:visualViewport?.scale||1,
  entries:window.__entryQA?.entries||0,overviewFrames:window.__entryQA?.overviewFrames||0,
  focused:document.activeElement?.id,worldHidden:document.getElementById('world').hidden,
  guide:window.__vaultEntryGuide?{moving:window.__vaultEntryGuide.moving,target:window.__vaultEntryGuide.target,touching:window.__vaultEntryGuide.touching,entered:window.__vaultEntryGuide.entered}:null};
});

async function run(config){
 const [engine,width,height,motion='no-preference']=config,browser=await pw[engine].launch();
 try{for(let pass=1;pass<=passes;pass++){
  const mobile=width<900,touch=engine==='chromium'&&mobile,pattern=process.env.QA_PATTERN||patterns[(pass-1)%4];
  const tag=config.join('-')+'-'+pattern+'-'+pass,row={tag,engine,width,height,motion,pattern,pass,input:touch?'CDP native touch':'wheel',status:'RUNNING',errors:[]};
  rows.push(row);save();
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:Number(process.env.QA_DPR||1),hasTouch:mobile,reducedMotion:motion,...(engine!=='firefox'?{isMobile:mobile}:{})});
  const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',error=>row.errors.push(error.message));
  await context.route('**/formsubmit.co/**',route=>route.fulfill({json:{success:true}}));
  const cdp=engine==='chromium'?await context.newCDPSession(page):null;let view={width,height};
  if(cdp&&process.env.QA_CPU_RATE)await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.QA_CPU_RATE)});
  const mark=stage=>{row.stage=stage;save()};
  const pause=ms=>page.waitForTimeout(ms);
  async function finger(direction=1,{fraction=.66,steps=16,gap=14,settle=850,cancel=false,jitter=0,reverse=false}={}){
   // Keep short-landscape gestures well clear of Chromium's near-input touch
   // adjustment. No extra browser round trips may slow a rapid input pair.
   const x=view.width*(view.width>view.height?.08:.5),start=view.height*(direction>0?.84:.16),end=start-direction*view.height*fraction;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start,id:1}]});
   for(let i=1;i<=steps;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start+(end-start)*i/steps,id:1}]});await pause(gap);
   }
   if(jitter)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:end+jitter,id:1}]});
   if(reverse){
    row.midReverse=await state(page);assert.equal(row.midReverse.phase,'film','Archive entered while finger was held');
    const reverseSteps=Math.ceil(view.height*.28/7);
    for(let i=1;i<=reverseSteps;i++){
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:end+view.height*.28*i/reverseSteps,id:1}]});await pause(18);
    }
   }
   await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await pause(settle);
  }
  async function move(direction=1,options={}){
   if(touch)return finger(direction,options);
   await page.mouse.move(view.width*.5,view.height*.7);
   await page.mouse.wheel(0,direction*view.height*(options.fraction||1.1));await pause(options.settle??850);
  }
  async function overview(){
   for(let attempt=0;attempt<6;attempt++){
    const s=await state(page);
    assert.equal(s.phase,'film','Passed the overview into Vault before a separate zoom: '+JSON.stringify(s));
    if(Math.abs(s.top-s.overview)<3&&s.progress<.005)return s;
    await move(1);
   }
   assert.fail('Six forward gestures did not reach a complete overview: '+JSON.stringify(await state(page)));
  }
  async function toVault(options={}){
   if((await state(page)).phase==='vault')return state(page);
   await move(1,options);await pause(500);
   const s=await state(page);
   assert.equal(s.phase,'vault','A fresh swipe from the settled overview did not finish Vault entry: '+JSON.stringify(s));
   return s;
  }
  async function rapidPair(){
   if(touch){
    const begin=await page.evaluate(()=>window.__entryQA.touchTargets.length);
    for(let i=0;i<2;i++)await finger(1,{fraction:.74,steps:2,gap:0,settle:10});
    const observed=await page.evaluate(n=>window.__entryQA.touchTargets.slice(n),begin);
    assert.equal(observed.length,2);
    assert(observed[1].moving,'Rapid-pair fixture did not arrive during the transition: '+JSON.stringify(observed));
    (row.rapidPairs||=[]).push(observed);
   }
   else{await page.mouse.move(view.width*.5,view.height*.7);for(let i=0;i<8;i++){await page.mouse.wheel(0,view.height*.7);await pause(20)}}
   await pause(1000);
  }
  try{
   mark('complete original hero');const url=new URL(base);url.searchParams.set('entry-qa',tag);
   const response=await page.goto(url.href,{waitUntil:'domcontentloaded'});
   row.sourceSha256=createHash('sha256').update(await response.body()).digest('hex');
   if(process.env.QA_SOURCE_SHA256)assert.equal(row.sourceSha256,process.env.QA_SOURCE_SHA256,'Preview changed during the verified test run');
   // Wait for the actual untouched automatic film sequence. No skip input.
   await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert,{},{timeout:65000});
   row.hero=await page.locator('#film').evaluate(el=>({time:el.currentTime,duration:el.duration,ended:el.ended}));
   if(motion!=='reduce')assert(row.hero.duration>0&&row.hero.time>=row.hero.duration-.15,'The original hero did not finish before entry QA: '+JSON.stringify(row.hero));
   await page.evaluate(()=>{
    const p=document.getElementById('nextDrop');window.__entryQA={entries:0,wasOpen:false,overviewFrames:0,touchTargets:[]};
    addEventListener('touchstart',e=>{window.__entryQA.touchTargets.push({phase:window.__guide.phase(),target:e.target.id||e.target.tagName,editable:!!e.target.closest('input,textarea,select,[contenteditable]'),moving:window.__vaultEntryGuide.moving,time:performance.now()})},{capture:true,passive:true});
    p.addEventListener('scroll',()=>{
     const section=document.getElementById('vaultInvitation'),relative=section.getBoundingClientRect().top-p.getBoundingClientRect().top;
     if(Math.abs(relative)<5)window.__entryQA.overviewFrames++;
    },{passive:true});
    new MutationObserver(()=>{const q=window.__entryQA,open=document.body.classList.contains('next-vault-open');if(open&&!q.wasOpen)q.entries++;q.wasOpen=open}).observe(document.body,{attributes:true,attributeFilter:['class']});
   });
   row.start=await state(page);assert(row.start.top<3,'Collection did not start at its top');
   mark('signup stop');if(pattern==='spam')await rapidPair();else await move(1);
   row.signup=await state(page);
   assert.equal(row.signup.phase,'film','First gesture skipped signup into Vault');
   assert(Math.abs(row.signup.top-row.signup.signup)<4,'First gesture did not stop clearly at signup: '+JSON.stringify(row.signup));
   if(pass===1)await page.screenshot({path:path.join(out,tag+'-signup.png')});
   if((pass===1&&pattern==='normal')||pattern==='focus'){
    mark('focused form onward');row.focusedOnward=[];
    for(const {selector,keyboardClose=false} of [{selector:'#nextDropEmailInput'},{selector:'#nextDropEmail button'},{selector:'#nextDropEmailInput',keyboardClose:true}]){
     for(let i=0;i<5;i++){const s=await state(page);if(Math.abs(s.top-s.signup)<4)break;await move(-1)}
     const before=await state(page);assert(Math.abs(before.top-before.signup)<4,'Could not return to signup for focus check');
     await page.locator(selector).focus();
     if(keyboardClose){
      // Controlled VisualViewport signals exercise the retained-focus close
      // path. This is not an OS keyboard or physical-device test.
      await page.evaluate(()=>{
       const v=visualViewport;window.__entryQA.viewportHeightDescriptor=Object.getOwnPropertyDescriptor(v,'height');
       Object.defineProperty(v,'height',{configurable:true,value:Math.max(180,innerHeight*.48)});v.dispatchEvent(new Event('resize'));
      });
      await page.waitForFunction(()=>document.getElementById('nextDrop').classList.contains('email-viewport'));
      await page.evaluate(()=>{
       const v=visualViewport,descriptor=window.__entryQA.viewportHeightDescriptor;
       if(descriptor)Object.defineProperty(v,'height',descriptor);else delete v.height;
       v.dispatchEvent(new Event('resize'));
      });
      await page.waitForFunction(()=>!document.getElementById('nextDrop').classList.contains('email-viewport'));
      assert.equal(await page.evaluate(()=>document.activeElement.id),'nextDropEmailInput','Keyboard-close probe lost email focus before onward input');
     }
     // Emulated browsers have no software keyboard: focus remains inside the
     // form, and the following actual swipe/wheel is the only onward action.
     await move(1);
     const after=await state(page);row.focusedOnward.push({selector,keyboardClose,before:before.top,after});
     assert(after.top>before.top+20,'Focused form consumed onward input without a keyboard: '+JSON.stringify(row.focusedOnward.at(-1)));
     assert.equal(after.phase,'film','Focused form navigation skipped the guided overview');
    }
   }
   mark('overview');
   if(pattern==='spam'){
    await rapidPair();row.rapid=await state(page);
    assert.equal(row.rapid.phase,'film','Two rapid approach swipes skipped the overview into Vault');
    assert(row.rapid.progress<.005,'Repeated approach input stranded the camera halfway through zoom: '+JSON.stringify(row.rapid));
    if(row.rapid.overview-row.rapid.signup<=row.rapid.height+4)assert(Math.abs(row.rapid.top-row.rapid.overview)<4,'Rapid approach did not settle at overview: '+JSON.stringify(row.rapid));
   }
   row.overview=await overview();
   assert.equal(row.overview.transform,'','Fixed Vault root slides as a rectangle');
   assert(row.overview.scale<=1.02,'Scroll changed browser page zoom');
   if(pass===1)await page.screenshot({path:path.join(out,tag+'-overview.png')});

   if(pattern==='reverse-jitter'){
    mark('reverse partial zoom');
    if(touch)await finger(1,{fraction:.32,steps:20,gap:22,reverse:true});
    else{await page.mouse.wheel(0,view.height*.24);await pause(40);await page.mouse.wheel(0,-view.height*.4);await pause(700)}
    row.reverse=await state(page);assert.equal(row.reverse.phase,'film','Reverse intent completed stale Vault entry');
    await move(-1);row.back=await state(page);
    assert.equal(row.back.phase,'film');assert(row.back.top<row.back.overview-50,'Reverse gesture could not leave overview');
    await overview();
   }
   if(pattern==='cancel-resize'){
    mark('cancel and resize');
    if(touch)await finger(1,{fraction:.18,steps:18,gap:22,cancel:true});
    else{await page.mouse.wheel(0,view.height*.18);await pause(40);await page.mouse.wheel(0,-view.height*.18);await pause(650)}
    row.cancel=await state(page);assert.equal(row.cancel.phase,'film','Cancelled input entered Vault');
    view=mobile?{width:height,height:width}:{width,height:height-100};await page.setViewportSize(view);await pause(700);
    row.resize=await state(page);assert.equal(row.resize.phase,'film','Resize alone entered Vault');
    await move(-1);assert.equal((await state(page)).phase,'film');await overview();
   }
   if(!touch){
    mark('keyboard reverse');await page.locator('#nextDrop').focus();await page.keyboard.press('PageUp');await pause(700);
    row.keyboardReverse=await state(page);assert.equal(row.keyboardReverse.phase,'film');
    assert(row.keyboardReverse.top<row.keyboardReverse.overview-20,'PageUp did not move toward signup');
    await overview();
   }
   mark('zoom and handoff');
   if(pattern==='spam'){
    if(touch)for(let i=0;i<3;i++)await finger(1,{fraction:.74,steps:2,gap:0,settle:10});
    else for(let i=0;i<20;i++){await page.mouse.wheel(0,view.height*.2);await pause(25)}
    await pause(1000);
   }
   if(!touch&&pass%2===0){await page.locator('#nextDrop').focus();await page.keyboard.press('End');await pause(750)}
   row.vault=await toVault(pattern==='reverse-jitter'&&touch?{jitter:4}:{});
   await page.waitForFunction(()=>window.__guide.phase()==='vault'&&!document.getElementById('vault').inert);
   row.vault=await state(page);assert.equal(row.vault.entries,1,'Vault handoff did not run exactly once');
   assert.equal(row.vault.transform,'','Handoff moved the fixed Vault rectangle');assert(row.vault.worldHidden,'Surface opened without activation');
   if(pass===1){
    await page.screenshot({path:path.join(out,tag+'-vault.png')});
    mark('unchanged Surface smoke');if(touch)await page.locator('#surfaceBtn').tap();else await page.locator('#surfaceBtn').click();
    await page.waitForFunction(()=>window.__worldJourney.state==='story'&&!document.getElementById('world').classList.contains('film-waiting'));
    assert.equal(await page.locator('#world').evaluate(el=>el.parentElement.id),'','Story was moved inside the entry scroller');
    await page.locator('#worldNext').click();await page.waitForFunction(()=>window.__worldJourney.state==='preview');
    await page.locator('#worldPlay').click();await page.waitForFunction(()=>document.getElementById('flapOverlay').classList.contains('on'));
    await page.locator('#flapExit').click();await page.waitForFunction(()=>window.__worldJourney.state==='preview');
    await page.locator('#worldReturnVault').click();await page.waitForFunction(()=>window.__guide.phase()==='vault'&&!document.getElementById('vault').inert);
   }
   row.touchTargets=await page.evaluate(()=>window.__entryQA.touchTargets);
   assert(!row.touchTargets.some(t=>t.phase==='film'&&t.editable),'Navigation fixture delivered an editing gesture: '+JSON.stringify(row.touchTargets));
   assert.deepEqual(row.errors,[]);row.status='PASS';console.log('PASS',tag,row.input);
  }catch(error){row.status='FAIL';row.error=error.stack;row.last=await state(page).catch(()=>null);row.touchTargets=await page.evaluate(()=>window.__entryQA?.touchTargets).catch(()=>null);await page.screenshot({path:path.join(out,tag+'-FAIL.png')}).catch(()=>{});throw error}
  finally{save();await context.close()}
 }}finally{await browser.close()}
}
(async()=>{for(const config of configs)await run(config);console.log('PASS',rows.length,'entry journeys:',rows.filter(row=>row.motion!=='reduce').length,'completed hero,',rows.filter(row=>row.motion==='reduce').length,'reduced motion')})().catch(error=>{save();console.error(error);process.exitCode=1});
