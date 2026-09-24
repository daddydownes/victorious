const assert=require('assert/strict'),path=require('path'),fs=require('fs'),pw=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8924/',out=process.env.EVIDENCE_DIR||process.cwd();
fs.mkdirSync(out,{recursive:true});
(async()=>{for(const [engine,width,height] of [['chromium',1440,900],['webkit',390,844],['firefox',320,568]]){
 const browser=await pw[engine].launch(),page=await browser.newPage({viewport:{width,height}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!nextDrop.inert);
  await page.locator('#collectionScrollCue').click();await page.waitForFunction(()=>getComputedStyle(nextDrop).scrollSnapType==='none');
  const card=await page.locator('.popup-countdown').evaluate(e=>({radius:getComputedStyle(e).borderRadius}));assert(parseFloat(card.radius)>=20);
  await page.screenshot({path:path.join(out,engine+'-'+width+'-glass.png')});
  const approach=await page.evaluate(()=>vaultInvitation.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top+nextDrop.scrollTop);
  await page.evaluate(top=>nextDrop.scrollTo({top:top-nextDrop.clientHeight/2,behavior:'instant'}),approach);
  await page.waitForFunction(()=>vault.classList.contains('vault-previewing')&&Math.abs(vault.getBoundingClientRect().top-nextDrop.clientHeight/2)<3);
  const entering=await page.evaluate(()=>({progress:Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress')),top:vault.getBoundingClientRect().top}));
  assert.equal(entering.progress,0);assert(Math.abs(entering.top-height/2)<3);
  await page.screenshot({path:path.join(out,engine+'-'+width+'-page-entering.png')});
  await page.evaluate(top=>nextDrop.scrollTo({top,behavior:'instant'}),approach);
  await page.waitForFunction(()=>Math.abs(vaultInvitation.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top)<2&&vault.classList.contains('vault-previewing'));
  const scene=await page.evaluate(()=>({top:vaultInvitation.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top+nextDrop.scrollTop,travel:vaultInvitation.offsetHeight-nextDrop.clientHeight}));
  const start=await page.evaluate(()=>({lead:plane.querySelector('.vault-centrepiece').getBoundingClientRect().width,hud:Number(getComputedStyle(vault.querySelector('.vault-hud')).opacity),bg:getComputedStyle(vault).backgroundColor}));
  assert.equal(start.hud,0);assert.equal(start.bg,'rgb(0, 0, 0)');
  await page.screenshot({path:path.join(out,engine+'-'+width+'-camera-start.png')});
  await page.evaluate(({top,travel})=>nextDrop.scrollTo({top:top+travel*.6,behavior:'instant'}),scene);
  await page.waitForFunction(()=>Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))>.55);
  const middle=await page.evaluate(()=>({lead:plane.querySelector('.vault-centrepiece').getBoundingClientRect().width,transform:getComputedStyle(dive).transform}));assert(middle.lead<start.lead);
  await page.screenshot({path:path.join(out,engine+'-'+width+'-camera-middle.png')});
  if(engine==='webkit'){
   const saved=await page.evaluate(()=>Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress')));
   await page.setViewportSize({width:844,height:390});
   await page.waitForFunction(expected=>Math.abs(Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))-expected)<.03,saved);
   await page.setViewportSize({width:390,height:844});
   await page.waitForFunction(expected=>Math.abs(Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))-expected)<.03,saved);
  }
  await page.evaluate(({top,travel})=>nextDrop.scrollTo({top:top+travel*.96,behavior:'instant'}),scene);
  await page.waitForFunction(()=>Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))>.94);
  await page.evaluate(()=>__vaultCamera.paint(1));
  const before=await page.evaluate(()=>{const e=plane.querySelector('.vault-centrepiece');return e.getBoundingClientRect().toJSON()});
  await page.evaluate(({top,travel})=>nextDrop.scrollTo({top:top+travel,behavior:'instant'}),scene);
  await page.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert);
  const after=await page.evaluate(()=>plane.querySelector('.vault-centrepiece').getBoundingClientRect().toJSON());
  for(const axis of ['x','y','width','height'])assert(Math.abs(before[axis]-after[axis])<1.5,axis+' jumped at handoff: '+JSON.stringify({before,after}));
  assert.deepEqual(errors,[]);console.log('PASS actual Vault camera and glass',engine,width,height);
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exitCode=1});
