const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:59530/',out=path.resolve(process.env.EVIDENCE_DIR||'collection-rebound-qa'),rows=[];
fs.mkdirSync(out,{recursive:true});const save=()=>fs.writeFileSync(path.join(out,'rebound.json'),JSON.stringify({time:new Date().toISOString(),rows},null,2));
(async()=>{for(const engine of ['chromium','webkit','firefox']){
 const b=await pw[engine].launch(),p=await b.newPage({viewport:{width:390,height:844}}),errors=[];let calls=0;
 p.on('pageerror',e=>errors.push(e.message));await p.route('**/formsubmit.co/**',r=>{calls++;return r.fulfill({json:{success:true}})});
 try{
  await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!nextDrop.inert);
  assert.equal(await p.locator('#nextDrop').evaluate(e=>getComputedStyle(e).scrollSnapType),'y mandatory');
  await p.mouse.move(20,400);await p.mouse.wheel(0,700);await p.waitForFunction(()=>Math.abs(collectionSignup.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top)<2);
  await p.mouse.wheel(0,-700);await p.waitForFunction(()=>nextDrop.scrollTop<2);
  await p.locator('#collectionScrollCue').click();await p.waitForFunction(()=>Math.abs(collectionSignup.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top)<2);
  const backdrop=await p.evaluate(()=>({color:getComputedStyle(nextDrop).backgroundColor,decorations:document.querySelectorAll('.collection-atmosphere,.collection-stars,.invite-upglow').length}));
  assert.deepEqual(backdrop,{color:'rgb(0, 0, 0)',decorations:0});
  await p.locator('#nextDropEmailInput').fill('qa@example.invalid');await p.waitForFunction(()=>getComputedStyle(nextDrop).scrollSnapType==='none');
  await p.locator('.collection-signup h2').focus();await p.waitForFunction(()=>getComputedStyle(nextDrop).scrollSnapType==='y mandatory');
  await p.mouse.move(20,740);await p.mouse.wheel(0,300);
  await p.waitForFunction(()=>document.querySelector('.next-drop-card').getAnimations().some(a=>a.effect.getTiming().duration===520));
  const animation=await p.locator('.next-drop-card').evaluate(e=>{const a=e.getAnimations().find(a=>a.effect.getTiming().duration===520);return{duration:a.effect.getTiming().duration,easing:a.effect.getTiming().easing,frames:a.effect.getKeyframes().map(f=>f.transform)}});
  assert(animation.frames.includes('translateY(-16px)'));assert.equal(animation.easing,'cubic-bezier(0.22, 0.65, 0.3, 1)');
  const join=p.locator('#nextDropEmail button'),r=await join.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();
  const down=await join.boundingBox();await p.waitForTimeout(220);const held=await join.boundingBox();assert(Math.abs(down.y-held.y)<=1.01,'Rebound stays within one CSS-pixel rounding during pointer hold: '+JSON.stringify({down,held}));
  assert(await p.evaluate(r=>document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===document.querySelector('#nextDropEmail button'),r),'The original press point still targets JOIN');
  await p.mouse.up();await p.waitForFunction(()=>nextDropResult.textContent.includes("YOU'RE IN"));assert.equal(calls,1);
  await p.locator('#nextVaultHold').click();await p.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert);assert.deepEqual(errors,[]);
  rows.push({engine,status:'PASS',backdrop,animation,heldMovement:Math.abs(down.y-held.y),samePointerTarget:true,wheelSnapBothDirections:true,vaultEntered:true,errors});console.log('PASS rebound/black-background/press',engine);
 }catch(e){rows.push({engine,status:'FAIL',error:e.stack,errors});throw e}finally{save();await b.close()}
}})().catch(e=>{save();console.error(e);process.exitCode=1});
