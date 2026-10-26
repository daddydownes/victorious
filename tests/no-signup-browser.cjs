const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
assert(base&&out,'Set BASE_URL and EVIDENCE_DIR');fs.mkdirSync(out,{recursive:true});
(async()=>{
 for(const [engine,width,height,mobile,motion] of [['chromium',1440,900,false,'no-preference'],['chromium',390,844,true,'no-preference'],['webkit',844,390,true,'no-preference'],['firefox',320,568,false,'reduce']]){
  const browser=await pw[engine].launch();
  try{for(let pass=1;pass<=Number(process.env.QA_PASSES||4);pass++){
   const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,...(engine!=='firefox'?{isMobile:mobile}:{}),reducedMotion:motion});
   let submissions=0;await context.route('**/formsubmit.co/**',r=>{submissions++;return r.abort()});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+"?qa=no-email-"+engine+"-"+width+"-"+pass);await page.waitForFunction(()=>!document.getElementById('nextDrop').inert);
   assert.equal(await page.locator('input[type=email],form').count(),0);
   await page.getByRole('button',{name:'Scroll to next pop-up',exact:true}).click();
   await page.waitForFunction(()=>!__vaultEntryGuide.moving&&__vaultEntryGuide.target==='signup');
   await page.locator('.popup-name').waitFor({state:'visible'});
   assert.equal((await page.locator('.popup-name').innerText()).replace(/\s+/g,' ').trim(),'VCTRS × MHC POP-UP');
   const link=page.locator('.popup-countdown');
   assert.match(await link.getAttribute('href'),/Civic\+Skate\+Park\+Canberra/);
   assert.equal(await page.locator('.popup-date').innerText(),'Civic Skate Park · 8 November · 1–5 PM');
   assert.match(await page.locator('.popup-details').innerText(),/Featuring Intrepid, Losninos & Regime/);
   assert.equal(await page.locator('#popupClock').getAttribute('data-start'),'2026-11-08T13:00:00+11:00');
   await page.evaluate(()=>{window.__eventClicks=0;document.querySelector('.popup-countdown').addEventListener('click',e=>{e.preventDefault();window.__eventClicks++})});
   await page.locator('.popup-name').click();await link.focus();await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>window.__eventClicks),2);
   const card=await page.locator('.popup-countdown').boundingBox();assert(card.x>=0&&card.x+card.width<=width+1);
   if(pass===1)await page.screenshot({path:path.join(out,`${engine}-${width}-${height}.png`)});
   await page.locator('#vaultScrollCue').click();
   await page.locator('#nextVaultHold').focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>__guide.phase()==='vault'&&!document.getElementById('vault').inert);
   await page.locator('#surfaceBtn').click();await page.waitForFunction(()=>__worldJourney.state==='story');
   assert.equal(await page.locator('input[type=email],form').count(),0);assert.equal(submissions,0);assert.deepEqual(errors,[]);
   console.log('PASS no signup, event, Vault entry and Surface',engine,width,height,motion,pass);
   await context.close();
  }}finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
