// Exercise the current native-scroll descent, visible Surface control and
// archive-only pinch lifecycle. Use a preview whose root has been verified.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
assert(base&&out,'Set BASE_URL and an EVIDENCE_DIR outside the checkout');
fs.mkdirSync(out,{recursive:true});
const rows=[];
const configs=[['chromium',390,844],['chromium',320,568],['webkit',390,844],['webkit',844,390],['firefox',320,568],['chromium',390,844,'reduce'],['chromium',1440,900],['chromium',1440,900,'reduce']]
 .filter(config=>!process.env.QA_CASE||config.join('-')===process.env.QA_CASE);
const passes=Number(process.env.QA_PASSES||1);
assert(Number.isInteger(passes)&&passes>=1&&passes<=10,'QA_PASSES must be 1–10');

async function run([engine,width,height,motion='no-preference'],pass=1){
 const browser=await pw[engine].launch();
 const mobile=width<900;
 const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,reducedMotion:motion,...(engine!=='firefox'?{isMobile:mobile}:{})});
 const page=await context.newPage();page.setDefaultTimeout(45000);
 const forcedNative=mobile&&engine==='webkit'&&motion==='no-preference'; // desktop WebKit emulation reports a fine pointer
 const tag=[engine,width+'x'+height,motion==='reduce'?'reduce':null,passes>1?'pass'+pass:null].filter(Boolean).join('-');
 const row={engine,width,height,motion,pass,forcedNative,errors:[],status:'RUNNING'};rows.push(row);
 page.on('pageerror',error=>row.errors.push(error.message));
 await context.route('**/formsubmit.co/**',route=>route.fulfill({json:{success:true}}));
 const frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 async function scrollToProgress(progress){
  await page.evaluate(p=>{const panel=nextDrop,section=vaultInvitation;
   const top=section.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;
   panel.scrollTo({top:top+(section.offsetHeight-panel.clientHeight)*p,behavior:'instant'});
  },progress);
 }
 try{
  await page.goto(base+(forcedNative?'?vaultPan=native':''),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!nextDrop.inert);
  await page.locator('#collectionScrollCue').click();
  await page.waitForFunction(()=>getComputedStyle(nextDrop).scrollSnapType==='none');
  await scrollToProgress(.45);
  await page.waitForFunction(()=>vault.classList.contains('vault-previewing'));
  row.descent=await page.evaluate(()=>{
   const scene=document.querySelector('.vault-descent-scene'),target=document.elementFromPoint(innerWidth/2,innerHeight/2);
   return {touchAction:getComputedStyle(scene).touchAction,centerInScene:scene.contains(target)};
  });
  assert.equal(row.descent.touchAction,motion==='reduce'?'pan-y pinch-zoom':'pan-y');
  assert(row.descent.centerInScene,'photo descent does not cover viewport center');
  if(engine==='chromium'&&mobile&&motion!=='reduce'){
   const cdp=await context.newCDPSession(page);
   await cdp.send('Input.synthesizePinchGesture',{x:width/2,y:height/2,scaleFactor:1.45,relativeSpeed:800,gestureSourceType:'touch'});
   await page.waitForTimeout(200);
   row.descent.pageScale=await page.evaluate(()=>visualViewport.scale);
   assert(row.descent.pageScale<=1.02,'pinch during photo descent zoomed the page');
   const start=await page.locator('#nextDrop').evaluate(el=>el.scrollTop);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y:height/2+100,id:1}]});
   for(const dy of [50,0,-50,-100]){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2,y:height/2+dy,id:1}]});await page.waitForTimeout(30)}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(450);
   row.descent.fingerScroll=await page.locator('#nextDrop').evaluate((el,previous)=>el.scrollTop-previous,start);
   assert(row.descent.fingerScroll>100,'finger scroll did not move photo descent: '+JSON.stringify(row.descent));
  }

  // A height change and finger movement in the same display frame must retain
  // the fresh movement instead of restoring the preceding camera progress.
  const resize=await page.evaluate(()=>{const panel=nextDrop,start=panel.scrollTop;
   panel.style.height=(panel.clientHeight-48)+'px';
   panel.scrollTop=start+35;dispatchEvent(new Event('resize'));
   return {target:start+35};
  });
  await frames();
  resize.actual=await page.locator('#nextDrop').evaluate(el=>el.scrollTop);
  assert(Math.abs(resize.actual-resize.target)<2,'native movement lost during height change: '+JSON.stringify(resize));
  await page.evaluate(()=>{nextDrop.style.height='';dispatchEvent(new Event('resize'))});
  await frames();

  await scrollToProgress(1);
  await page.waitForFunction(()=>window.__guide.phase()==='vault'&&!vault.inert);
  await page.waitForFunction(()=>Number(getComputedStyle(vault.querySelector('.vault-hud')).opacity)>.98);
  row.surface=await page.evaluate(()=>{
   const el=surfaceBtn,r=el.getBoundingClientRect(),v=visualViewport;
   return {rect:r.toJSON(),viewport:{left:v.offsetLeft,top:v.offsetTop,width:v.width,height:v.height,scale:v.scale},
    hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),nativePan:__vaultPan.active,
    touchAction:getComputedStyle(dive).touchAction,vaultTouchAction:getComputedStyle(vault).touchAction,
    label:el.textContent.trim(),ariaLabel:el.getAttribute('aria-label')};
  });
  const {rect,viewport,hit}=row.surface;
  assert(hit,'Surface centre is not hit-testable');
  assert.equal(row.surface.label,'Surface');
  assert.equal(row.surface.ariaLabel,null);
  assert(rect.height>=44&&rect.height<=56&&rect.width<160,'Surface is not a compact touch target: '+JSON.stringify(rect));
  assert(Math.abs(rect.height-(width>height&&height<=520?46:52))<1,'Surface height did not follow the compact sizing');
  assert(rect.left>=viewport.left+12&&rect.top>=viewport.top+12&&
   rect.right<=viewport.left+viewport.width-12&&rect.bottom<=viewport.top+viewport.height-12,
   'Surface clips the visible viewport: '+JSON.stringify(row.surface));
  if(row.surface.nativePan)assert.equal(row.surface.touchAction,'pan-x pan-y');
  if(motion==='reduce'){assert.equal(row.surface.nativePan,false);assert.equal(row.surface.vaultTouchAction,'pinch-zoom')}
  await page.screenshot({path:path.join(out,tag+'-vault.png')});

  if(engine==='chromium'&&mobile&&row.surface.nativePan){
   const before=await page.evaluate(()=>({pageScale:visualViewport.scale,archiveZoom:__vaultPan.zoom}));
   const cdp=await context.newCDPSession(page);
   await cdp.send('Input.synthesizePinchGesture',{x:width/2,y:height/2,scaleFactor:1.45,relativeSpeed:800,gestureSourceType:'touch'});
   await page.waitForTimeout(200);
   row.pinchGesture=await page.evaluate(()=>({pageScale:visualViewport.scale,archiveZoom:__vaultPan.zoom}));
   assert(row.pinchGesture.pageScale<=before.pageScale+.02,'pinch zoomed the page instead of the archive');
   assert(row.pinchGesture.archiveZoom>before.archiveZoom+.1,'pinch did not zoom the archive');
  }

  if(mobile&&engine!=='firefox'&&row.surface.nativePan){
   row.pinch=await page.evaluate(async()=>{
    // WebKit's automation build disallows constructing Touch directly. These
    // events exercise the page's real handlers without claiming OS gesture QA.
    const t=(identifier,target,clientX,clientY)=>({identifier,target,clientX,clientY});
    const send=(target,type,touches,changed)=>{const event=new Event(type,{bubbles:true,cancelable:true});
     Object.defineProperties(event,{touches:{value:touches},targetTouches:{value:touches},changedTouches:{value:changed}});
     return target.dispatchEvent(event);
    };
    const outside=t(1,surfaceBtn,60,80),inside=t(2,dive,170,370);
    send(surfaceBtn,'touchstart',[outside],[outside]);
    send(dive,'touchstart',[outside,inside],[inside]);
    const mixed=__vaultPan.pinching;
    send(surfaceBtn,'touchend',[inside],[outside]);
    const a=t(3,dive,140,370),b=t(4,dive,220,370);
    send(dive,'touchstart',[a],[a]);send(dive,'touchstart',[a,b],[b]);
    const started=__vaultPan.pinching;
    const spread=t(4,dive,260,370);
    send(dive,'touchmove',[a,spread],[spread]);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const zoom=__vaultPan.zoom;
    send(document.body,'touchend',[a],[spread]);
    const ended=!__vaultPan.pinching;
    send(document.body,'touchend',[],[a]);
    return {mixed,started,zoom,ended};
   });
   assert.equal(row.pinch.mixed,false,'HUD touch started archive pinch');
   assert.equal(row.pinch.started,true,'two archive touches did not start pinch');
   assert(row.pinch.zoom>1.1,'archive did not zoom');
   assert.equal(row.pinch.ended,true,'release outside archive left pinch active');
  }

  if(mobile){const r=row.surface.rect;await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2)}
  else await page.locator('#surfaceBtn').click();
  await page.waitForFunction(()=>window.__worldJourney?.state==='story');
  assert.deepEqual(row.errors,[]);
  row.resize=resize;row.status='PASS';console.log('PASS Vault polish',engine,width,height,motion,'pass',pass);
 }catch(error){row.status='FAIL';row.error=error.stack;await page.screenshot({path:path.join(out,tag+'-FAIL.png')}).catch(()=>{});throw error}
 finally{fs.writeFileSync(path.join(out,'matrix.json'),JSON.stringify({base,rows},null,2));await browser.close()}
}
(async()=>{for(const config of configs)for(let pass=1;pass<=passes;pass++)await run(config,pass)})().catch(error=>{console.error(error);process.exitCode=1});
