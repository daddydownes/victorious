// Fresh complete journeys. Form transport is always intercepted.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:59530/';
const out=path.resolve(process.env.EVIDENCE_DIR||'gallery-qa');fs.mkdirSync(out,{recursive:true});
const rows=[],configs=[
 ['chromium',1440,900],['chromium',1280,720],['chromium',390,844],
 ['chromium',320,568],['chromium',430,932],['chromium',844,390],
 ['chromium',390,844,'reduce'],['chromium',1440,900,'reduce'],
 ['webkit',390,844],['webkit',844,390],['webkit',1280,720],['firefox',1280,720]
].filter(c=>!process.env.QA_CASE||c.join('-')===process.env.QA_CASE);
const save=()=>fs.writeFileSync(path.join(out,'journeys.json'),JSON.stringify({time:new Date().toISOString(),base,rows},null,2));
async function run(config){
 const [engine,width,height,motion='no-preference']=config,key=config.join('-'),b=await pw[engine].launch();
 try{for(let pass=1;pass<=4;pass++){
  const mobile=width<900,c=await b.newContext({viewport:{width,height},deviceScaleFactor:width<500?3:1,hasTouch:mobile,reducedMotion:motion,...(engine!=='firefox'?{isMobile:mobile}:{})});
  const p=await c.newPage(),errors=[],bad=[],requests=[];p.setDefaultTimeout(30000);
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()])});p.on('request',r=>requests.push(r.url()));
  let submissions=0;await c.route('**/formsubmit.co/**',r=>{submissions++;return r.fulfill({json:{success:true}})});
  try{
   await p.goto(base+'?gallery-qa='+encodeURIComponent(key+'-'+pass),{waitUntil:'domcontentloaded'});
   assert(await p.evaluate(()=>!document.querySelector('#nextDrop').inert||!document.querySelector('.collection-piece img[src]')),'Products do not compete with the hero while it is active');
   await p.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!nextDrop.inert);
   assert.equal(requests.filter(u=>/\/photos\/|\/delivery\/\d\d-/.test(u)).length,0,'No archive photograph downloads before intent');
   assert.equal(requests.filter(u=>u.endsWith('/game-preview.html')).length,0,'No game preview download before Surface');
   assert.equal(await p.locator('.collection-piece img').count(),4);
   await p.locator('.collection-piece').last().scrollIntoViewIfNeeded();
   await p.waitForFunction(()=>[...document.querySelectorAll('.collection-piece img')].every(i=>i.complete&&i.naturalWidth>0));
   const layout=await p.evaluate(()=>({overflow:nextDrop.scrollWidth>nextDrop.clientWidth,labels:[...document.querySelectorAll('.next-drop-kicker,.collection-header h2')].map(e=>({text:e.textContent,align:getComputedStyle(e).textAlign,animation:getComputedStyle(e).animationName})),marks:document.querySelectorAll('.collection-intro .vctrs-glyph').length}));
   assert.equal(layout.overflow,false);assert.equal(layout.marks,1);assert(layout.labels.every(l=>l.align==='center'));
   if(motion==='reduce')assert(layout.labels.every(l=>l.animation==='none'));
   if(pass===1){await p.locator('.collection-intro').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,key+'-collection.png')})}
   if(pass===1){await p.locator('#nextDropEmailInput').fill('a@b..com');await p.locator('#nextDropEmail button').click();assert.equal(submissions,0);await p.locator('#nextDropEmailInput').fill('qa@example.invalid');await p.locator('#nextDropEmail button').click();await p.waitForFunction(()=>nextDropResult.textContent.includes("YOU'RE IN"));assert.equal(submissions,1)}
   await p.evaluate(()=>{window.__fadeSamples=[];window.__fadeObserver=setInterval(()=>{if(document.body.classList.contains('next-vault-opening'))__fadeSamples.push({next:Number(getComputedStyle(nextDrop).opacity),vault:Number(getComputedStyle(vault).opacity),moving:document.querySelectorAll('.vault-entry-mark,.vault-brand-live').length,title:getComputedStyle(document.querySelector('.vault-title')).display,transform:getComputedStyle(document.querySelector('#dive')).transform})},16)});
   if(pass===2){await p.locator('#nextVaultHold').focus();await p.keyboard.press('Enter')}else if(pass===3&&mobile)await p.locator('#nextVaultHold').tap();else await p.locator('#nextVaultHold').click();
   await p.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert);
   const samples=await p.evaluate(()=>{clearInterval(__fadeObserver);return __fadeSamples});
   assert(samples.every(s=>s.moving===0&&s.title==='none'),'No travelling or expanding logo');
   if(motion!=='reduce'){assert(samples.some(s=>s.next>0&&s.next<1&&s.vault>0&&s.vault<1),'Intermediate fade frames');assert(samples.every(s=>s.transform==='none'||s.transform==='matrix(1, 0, 0, 1, 0, 0)'),'Archive remains at final size')}
   assert.equal(await p.locator('.collection-intro .vctrs-glyph').count(),1,'Original logo remains in masthead');
   assert.equal(await p.locator('#plane img').count(),33);await p.waitForFunction(()=>document.querySelector('#plane img.asset-ready'));
   const readyAtEntry=await p.locator('#plane img.asset-ready').count();assert(readyAtEntry<33,'Distant photos stay deferred');
   await p.mouse.move(width*.7,height*.6);await p.mouse.down();await p.mouse.move(width*.3,height*.45,{steps:10});await p.mouse.up();
   if(pass===1)await p.screenshot({path:path.join(out,key+'-vault.png')});
   await p.locator('#surfaceBtn').click();await p.waitForFunction(()=>__worldJourney.state==='story'&&!world.classList.contains('film-waiting'));
   if(motion!=='reduce')await p.waitForFunction(()=>worldVideo.videoWidth>0&&worldVideo.currentTime>0);
   await p.locator('#worldNext').click();await p.waitForFunction(()=>__worldJourney.state==='preview'&&__worldJourney.previewReady);
   await p.locator('#worldArrow').click();await p.waitForFunction(()=>__worldJourney.state==='game');await p.locator('#flap').click({position:{x:50,y:70}});
   await p.locator('#flapExit').click();await p.waitForFunction(()=>__worldJourney.state==='preview');await p.locator('#worldReturnVault').click();await p.waitForFunction(()=>!vault.inert&&__worldJourney.state==='entry');
   assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);rows.push({engine,width,height,motion,pass,status:'PASS',layout,readyAtEntry,samples,errors,bad});console.log('PASS',key,pass);
  }catch(e){rows.push({engine,width,height,motion,pass,status:'FAIL',error:e.stack,errors,bad});await p.screenshot({path:path.join(out,'FAIL-'+key+'-'+pass+'.png')}).catch(()=>{});throw e}
  finally{save();await c.close()}
 }}finally{await b.close()}
}
(async()=>{let cursor=0;const results=await Promise.allSettled(Array.from({length:2},async()=>{while(cursor<configs.length)await run(configs[cursor++])}));for(const r of results)if(r.status==='rejected')throw r.reason;console.log('PASS',rows.length,'fresh complete journeys')})().catch(e=>{save();console.error(e);process.exitCode=1});
