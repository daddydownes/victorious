// Real HTTP failures and held responses exercise the shipped controller.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pw=require('playwright'),root=path.resolve(__dirname,'..');
const out=path.resolve(process.env.EVIDENCE_DIR||path.join(root,'surface-recovery-evidence'));
fs.mkdirSync(out,{recursive:true});
const results=[];let activeBrowser;
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({timestamp:new Date().toISOString(),root,results},null,2));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function run(engine){
 const {server}=require('../tools/serve-demo.cjs').createDemoServer(root),normal=server.listeners('request')[0];
 let mode='503',requests=[],pending=[];
 server.removeAllListeners('request');
 server.on('request',(req,res)=>{
  if(req.url.split('?')[0]!=='/assets/story-party-cut.mp4'){normal(req,res);return}
  const row={at:new Date().toISOString(),mode,closed:false};requests.push(row);
  res.on('close',()=>{row.closed=true});
  if(mode==='503'){res.writeHead(503,{'Cache-Control':'no-store'}).end('Test-only media failure');return}
  if(mode==='pending'){pending.push({req,res,row});return}
  normal(req,res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const bytes=Buffer.from(await(await fetch(base)).arrayBuffer());
 assert(bytes.equals(fs.readFileSync(path.join(root,'index.html'))),'Explicit preview root must match');
 results.push({case:'preview-proof',engine,root,base,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 const b=activeBrowser=await pw[engine].launch();
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,...(engine!=='firefox'?{isMobile:true}:{})});
 await c.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(25000);
 async function snapshot(){return p.evaluate(()=>({state:__worldJourney.state,phase:__guide.phase(),gate:world.classList.contains('film-waiting'),gameInert:worldGame.inert,nextHidden:worldNext.hidden,backHidden:worldStoryReturnVault.hidden,retryHidden:worldFilmRetry.hidden,active:document.activeElement.id,videoSrc:worldVideo.getAttribute('src'),videoTime:worldVideo.currentTime,ready:worldVideo.readyState,filmReady:worldStory.classList.contains('film-ready'),vaultInert:vault.inert,worldHidden:world.hidden,scroll:world.scrollTop}))}
 async function surface(){await p.locator('#surfaceBtn').click();await p.waitForFunction(()=>__worldJourney.state==='story')}
 async function escape(keyboard=false){
  const geometry=await p.locator('#worldStoryReturnVault').evaluate(e=>{const r=e.getBoundingClientRect();return{visible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e}});
  assert(geometry.visible&&geometry.hit,'Back must be visible and hit-testable while scrolling is locked');
  if(keyboard){for(let i=0;i<12&&await p.evaluate(()=>document.activeElement.id)!=='worldStoryReturnVault';i++)await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'worldStoryReturnVault');await p.keyboard.press('Enter')}
  else await p.locator('#worldStoryReturnVault').tap();
  await p.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert&&__worldJourney.state==='entry');
  const s=await snapshot();assert(s.worldHidden&&!s.gate&&!s.gameInert&&s.videoSrc===null);assert.equal(s.active,'vault');return s;
 }
 async function playing(){await p.waitForFunction(()=>__worldJourney.state==='story'&&!world.classList.contains('film-waiting')&&worldVideo.currentTime>.3);const s=await snapshot();assert(!s.gameInert&&!s.nextHidden&&s.backHidden);return s}
 async function backFromEnd(){await p.locator('#worldNext').click();await p.waitForFunction(()=>__worldJourney.state==='preview');await p.locator('#worldReturnVault').click();await p.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert)}
 try{
  await p.goto(base+'?surface-recovery='+engine+'#vault',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert);
  await surface();await p.locator('#worldFilmRetry').waitFor({state:'visible'});
  assert(requests.some(r=>r.mode==='503'));
  const initial=await snapshot();assert(initial.gate&&initial.gameInert);
  await p.screenshot({path:path.join(out,engine+'-503-escape.png')});
  await p.locator('#worldFilmRetry').tap();
  const restoredVault=await escape(true);
  results.push({case:'503-retry-then-keyboard-escape',engine,status:'PASS',initial,restoredVault});
  await surface();await p.locator('#worldFilmRetry').waitFor({state:'visible'});mode='normal';
  for(let i=0;i<12&&await p.evaluate(()=>document.activeElement.id)!=='worldFilmRetry';i++)await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(()=>document.activeElement.id),'worldFilmRetry');await p.keyboard.press('Enter');
  const restoredFilm=await playing();assert.equal(restoredFilm.active,'worldNext');
  results.push({case:'restore-and-retry',engine,status:'PASS',restoredFilm});await backFromEnd();

  mode='pending';await surface();
  await p.waitForFunction(()=>worldVideo.networkState===2);
  const duringLoad=await snapshot();assert(duringLoad.gate&&duringLoad.retryHidden);
  await escape();const abandoned=pending.splice(0);
  assert(abandoned.length>0,'Server must have a genuinely pending media request');
  await surface(); // A new visit is still waiting when the abandoned response completes.
  for(const old of abandoned){if(!old.res.destroyed)normal(old.req,old.res)}
  await p.waitForTimeout(7000);
  const afterLate=await snapshot();assert(afterLate.gate&&afterLate.gameInert&&!afterLate.filmReady&&!afterLate.backHidden&&!afterLate.retryHidden);
  await p.screenshot({path:path.join(out,engine+'-pending-escape.png')});
  await p.locator('#worldFilmRetry').tap();const afterRetryEscape=await escape();
  results.push({case:'pending-immediate-escape-late-response-new-visit-retry-escape',engine,status:'PASS',duringLoad,afterLate,afterRetryEscape,abandoned:abandoned.map(x=>x.row)});
  mode='normal';await surface();
  await p.waitForFunction(()=>worldStory.classList.contains('film-ready')&&world.classList.contains('film-waiting'));
  await escape();mode='pending';await surface();await p.waitForTimeout(2300);
  const afterAnimation=await snapshot();assert(afterAnimation.gate&&afterAnimation.gameInert&&!afterAnimation.filmReady);
  mode='normal';await p.locator('#worldFilmRetry').waitFor({state:'visible'});await p.locator('#worldFilmRetry').tap();await playing();await backFromEnd();
  results.push({case:'escape-during-reveal-then-fresh-visit',engine,status:'PASS',afterAnimation});
  mode='pending';await p.setViewportSize({width:320,height:568});await surface();
  for(let i=0;i<12&&await p.evaluate(()=>document.activeElement.id)!=='worldStoryReturnVault';i++)await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(()=>document.activeElement.id),'worldStoryReturnVault');
  for(const size of [{width:320,height:568},{width:844,height:390}]){
   await p.setViewportSize(size);
   assert(await p.locator('#worldStoryReturnVault').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e}),'Escape remains reachable after rotation');
  }
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>!world.classList.contains('film-waiting'));
  const reduced=await snapshot();assert(reduced.filmReady&&reduced.backHidden&&!reduced.gameInert);assert.equal(reduced.active,'worldNext');
  await p.emulateMedia({reducedMotion:'no-preference'});assert.equal((await snapshot()).gate,false);await backFromEnd();
  results.push({case:'loading-narrow-rotation-motion-change-focus',engine,status:'PASS',reduced});
  assert.deepEqual(errors,[]);
 }catch(e){results.push({case:'failure',engine,status:'FAIL',error:e.stack,errors,state:await snapshot().catch(()=>null)});await p.screenshot({path:path.join(out,engine+'-FAIL.png')}).catch(()=>{});throw e}
 finally{results.push({case:'http-requests',engine,requests,errors});save();await c.close();await b.close();activeBrowser=null;server.closeAllConnections();await new Promise(r=>server.close(r))}
}
(async()=>{for(const engine of (process.env.TEST_ENGINES||'chromium,webkit,firefox').split(',')){await run(engine);console.log('PASS Surface recovery',engine)}})().catch(async e=>{console.error(e);save();await activeBrowser?.close();process.exitCode=1});
