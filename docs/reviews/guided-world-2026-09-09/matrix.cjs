const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE || 'playwright'),fs=require('fs'),assert=require('assert/strict');
const out='docs/reviews/guided-world-2026-09-09',base=''+(process.env.BASE_URL||'http://127.0.0.1:4173')+'',results=[];
const lanes=[['chrome-large',chromium,1440,900,false],['chrome-laptop',chromium,1280,720,false],['webkit-desktop',webkit,1280,900,false],['webkit-phone',webkit,390,844,false],['webkit-landscape',webkit,844,390,false],['webkit-short-landscape',webkit,667,375,false],['webkit-narrow',webkit,320,568,false],['webkit-large-phone',webkit,430,932,false],['webkit-reduced-phone',webkit,390,844,true],['chrome-reduced-desktop',chromium,1280,900,true]];
async function runLane([name,engine,width,height,reduce]){
const b=await engine.launch();
for(let run=1;run<=4;run++){
 const p=await b.newPage({viewport:{width,height},isMobile:width<900,hasTouch:width<900,reducedMotion:reduce?'reduce':'no-preference'}),errors=[],missing=[],posts=[];let docs=0;
 p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))missing.push({url:r.url(),status:r.status()})});
 p.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===p.mainFrame())docs++});
 await p.route('https://formsubmit.co/**',async r=>{posts.push(r.request().postDataJSON());await new Promise(done=>setTimeout(done,180));await r.fulfill({status:200,contentType:'application/json',body:'{"success":true}'})});
 const start=Date.now(),url=base+'/?qa='+name+'-'+run;
 try{
 await p.goto(url,{waitUntil:'domcontentloaded'});assert.equal(await p.evaluate(()=>scrollY),0);assert.equal(await p.locator('meta[name=robots]').count(),0);
 await p.locator('body.next-drop-landed').waitFor({timeout:35000});
 await p.locator('#nextDropEmailInput').fill(['','bad','a@.b','a@b.'][run-1]);await p.locator('#nextDropEmail button').click();assert.equal(await p.locator('#nextDropResult').innerText(),'CHECK THAT ADDRESS');
 await p.locator('#nextDropEmailInput').fill('release-check@example.test');await p.locator('#nextDropEmail button').click();
 await p.waitForFunction(()=>document.querySelector('#nextDropResult').textContent==="YOU'RE ON THE LIST");assert.equal(posts.length,1);assert.equal(posts[0].email,'release-check@example.test');
 await p.locator('#nextVaultHold').click();await p.locator('body.next-vault-open').waitFor();assert.equal(await p.locator('.vault-brand-live').count(),1);await p.locator('#surfaceBtn').click();await p.locator('body.world-active').waitFor();
 assert.equal(p.url(),url);assert.equal(docs,1);assert.equal(await p.locator('.persistent-v').count(),1);assert.equal(await p.locator('.persistent-v').evaluate(e=>e.parentElement.id),'worldStory');
 await p.locator('#worldNext').click();await p.waitForFunction(()=>__worldJourney.state==='preview'&&__worldJourney.previewReady);await p.waitForTimeout(1050);
 assert.equal(await p.locator('#worldVideo').evaluate(e=>e.paused),true);const frame=p.frames().find(f=>f.url()==='about:srcdoc');assert.ok(frame);
 if(!reduce){assert.ok(await p.locator('#worldTryFlight').isEnabled());const inputs=await frame.evaluate(()=>__preview.inputs());await p.locator('#worldTryFlight').click();await p.waitForTimeout(150);assert.ok(await frame.evaluate(()=>__preview.inputs())>inputs)}
 assert.equal(await p.locator('#world').evaluate(e=>e.scrollWidth>e.clientWidth),false);
 const v=await p.locator('.persistent-v').boundingBox();assert.ok(v.y+v.height<=1,'Story V must leave game viewport');
 if(run===4)await p.screenshot({path:out+'/'+name+'-preview.png'});
 await p.locator('#worldPlay').click();await p.locator('#flapOverlay.on').waitFor();
 if(!reduce){await p.locator('#flapAction').click();await p.waitForFunction(()=>__flap.state()==='play');await p.locator('#flapPause').click();assert.ok(await p.evaluate(()=>__flap.paused()));await p.locator('#flapAction').click();assert.equal(await p.evaluate(()=>__flap.paused()),false)}
 else assert.equal(await p.locator('#flapTitle').innerText(),'MOTION IS OFF');
 await p.locator('#flapExit').click();assert.equal(await p.evaluate(()=>document.activeElement.id),'worldPlay');assert.equal(p.url(),url);assert.equal(docs,1);
 await Promise.all([p.waitForNavigation({waitUntil:'domcontentloaded'}),p.locator('#worldRefresh').click()]);await p.waitForFunction(()=>window.__vctrsReloadOpening&&window.__worldJourney);assert.equal(p.url(),base+'/');assert.equal(docs,2);assert.equal(await p.evaluate(()=>__worldJourney.state),'entry');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);results.push({name,run,width,height,reduce,status:'PASS',ms:Date.now()-start,documents:docs,signupRequests:posts.length,errors,missing});console.log(name,run,'PASS');
 }catch(e){results.push({name,run,status:'FAIL',error:e.stack,errors,missing});await p.screenshot({path:out+'/'+name+'-'+run+'-FAIL.png'}).catch(()=>{});console.log(name,run,'FAIL',e.message);await p.close();break;}
 await p.close();
}await b.close();fs.writeFileSync(out+'/matrix.json',JSON.stringify({at:new Date().toISOString(),results,limits:['Browser engines on Windows; no physical iPhone or macOS Safari','Signup transport mocked; no real addresses submitted']},null,2));}
(async()=>{let next=0;await Promise.all([0,1].map(async()=>{while(next<lanes.length)await runLane(lanes[next++])}));assert.equal(results.length,40);assert.ok(results.every(r=>r.status==='PASS'));console.log('40/40 fresh end-to-end journeys passed.');})().catch(e=>{console.error(e.message);process.exit(1)});
