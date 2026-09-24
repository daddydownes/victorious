// A real Chromium touch sequence from signup through the Vault handoff.
// Run against an explicit-root preview with BASE_URL and EVIDENCE_DIR set.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
assert(base&&out,'Set BASE_URL and EVIDENCE_DIR');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await pw.chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!nextDrop.inert);
  await page.locator('#collectionScrollCue').click();
  await page.waitForFunction(()=>Math.abs(nextDrop.scrollTop-collectionSignup.offsetTop)<3);
  const cdp=await page.context().newCDPSession(page);
  async function swipe(){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:700}]});
   for(let i=1;i<=16;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:700-i*35}]});
    await page.waitForTimeout(14);
   }
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(650);
  }
  const states=[];
  for(let i=0;i<2;i++){
   await swipe();
   const state=await page.evaluate(()=>({phase:__guide.phase(),top:nextDrop.scrollTop,scene:vaultInvitation.getBoundingClientRect().top-nextDrop.getBoundingClientRect().top,progress:Number(document.querySelector('.vault-descent-scene').style.getPropertyValue('--vault-progress')),clip:vault.style.clipPath,transform:vault.style.transform}));
   states.push(state);await page.screenshot({path:path.join(out,`touch-swipe-${i+1}.png`)});
   if(state.phase==='vault')break;
  }
  assert.equal(states.at(-1).phase,'vault','two full phone swipes should reach the interactive Vault: '+JSON.stringify(states));
  assert(states.every(s=>!s.transform),'the fixed Vault should never slide as a rectangle: '+JSON.stringify(states));
  await page.waitForFunction(()=>!vault.inert);
  await page.locator('#surfaceBtn').click();
  await page.waitForFunction(()=>document.body.classList.contains('world-active'));
  await page.waitForTimeout(1300);
  const film=await page.evaluate(()=>({top:worldPortrait.getBoundingClientRect().top,height:worldPortrait.getBoundingClientRect().height,screen:innerHeight}));
  await page.screenshot({path:path.join(out,'surface-film-start.png')});
  assert(film.top>film.screen*.07&&film.top<film.screen*.12,'film should start slightly below the top edge: '+JSON.stringify(film));
  assert.deepEqual(errors,[]);
  console.log('PASS two guided phone swipes, stationary Vault reveal and lowered Surface film',JSON.stringify({states,film}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
