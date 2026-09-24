// The snap lands on signup, then the actual Vault plane owns the scroll camera.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8924/',out=path.resolve(process.env.EVIDENCE_DIR||'vault-camera-qa'),rows=[];
fs.mkdirSync(out,{recursive:true});
const save=()=>fs.writeFileSync(path.join(out,'camera.json'),JSON.stringify({time:new Date().toISOString(),rows},null,2));
(async()=>{for(const engine of ['chromium','webkit','firefox']){
 const browser=await pw[engine].launch(),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!nextDrop.inert);
  assert.equal(await page.locator('#nextDrop').evaluate(e=>getComputedStyle(e).scrollSnapType),'y mandatory');
  await page.locator('#collectionScrollCue').click();
  await page.waitForFunction(()=>Math.abs(collectionSignup.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top)<2&&getComputedStyle(nextDrop).scrollSnapType==='none');
  await page.locator('#vaultScrollCue').click();
  await page.waitForFunction(()=>Math.abs(vaultInvitation.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top)<2&&vault.classList.contains('vault-previewing'));
  const scene=await page.evaluate(()=>({top:vaultInvitation.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top+nextDrop.scrollTop,travel:vaultInvitation.offsetHeight-nextDrop.clientHeight}));
  const start=await page.evaluate(()=>({preview:vault.classList.contains('vault-previewing'),photos:plane.querySelectorAll('img').length,lead:plane.querySelector('.vault-centrepiece')?.getBoundingClientRect().toJSON(),vaultVisible:getComputedStyle(vault).visibility,background:getComputedStyle(document.querySelector('.vault-descent-scene')).backgroundColor}));
  assert(start.preview);assert(start.photos>=30);assert(start.lead.width>300);assert.equal(start.vaultVisible,'visible');
  await page.screenshot({path:path.join(out,engine+'-real-vault-start.png')});
  await page.evaluate(({top,travel})=>nextDrop.scrollTo({top:top+travel*.55,behavior:'instant'}),scene);
  await page.waitForFunction(()=>Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))>.5);
  const middle=await page.evaluate(()=>({transform:getComputedStyle(dive).transform,lead:plane.querySelector('.vault-centrepiece').getBoundingClientRect().toJSON()}));
  assert(middle.lead.width<start.lead.width);
  await page.screenshot({path:path.join(out,engine+'-real-vault-middle.png')});
  await page.evaluate(({top,travel})=>nextDrop.scrollTo({top:top+travel*.97,behavior:'instant'}),scene);
  await page.waitForFunction(()=>Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress'))>.95);
  const before=await page.evaluate(()=>{__vaultCamera.paint(1);return [...plane.querySelectorAll('img')].slice(0,5).map(e=>e.getBoundingClientRect().toJSON())});
  await page.evaluate(({top,travel})=>nextDrop.scrollTo({top:top+travel,behavior:'instant'}),scene);
  await page.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert);
  const after=await page.evaluate(()=>[...plane.querySelectorAll('img')].slice(0,5).map(e=>e.getBoundingClientRect().toJSON()));
  for(let i=0;i<before.length;i++)for(const axis of ['x','y','width','height'])assert(Math.abs(before[i][axis]-after[i][axis])<1.5,engine+' '+axis+' jumped');
  assert.deepEqual(errors,[]);rows.push({engine,status:'PASS',start,middle,geometryMatched:true,errors});console.log('PASS real Vault camera and identity handoff',engine);
 }catch(e){rows.push({engine,status:'FAIL',error:e.stack,errors});throw e}finally{save();await browser.close()}
}})().catch(e=>{save();console.error(e);process.exitCode=1});
