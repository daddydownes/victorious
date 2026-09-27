'use strict';
// Normal touch, keyboard, reversal and resize on original and repaired pages.
// WebKit starts via the reduced-motion opening: pre-entry regression only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto'),pw=require('playwright');
const [engine,widthText,heightText,motion='no-preference']=process.env.QA_CASE.split('-'),width=+widthText,height=+heightText,out=process.env.EVIDENCE_DIR;
assert(engine&&width&&height&&out&&process.env.BASE_URL);fs.mkdirSync(out,{recursive:true});const rows=[];
const write=()=>fs.writeFileSync(path.join(out,'journeys.json'),JSON.stringify(rows,null,2));
(async()=>{const browser=await pw[engine].launch();try{for(let pass=1;pass<=4;pass++){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 await context.route('**/formsubmit.co/**',r=>r.abort());const page=await context.newPage();page.setDefaultTimeout(15000);
 const row={pass,engine,width,height,motion,source:process.env.VARIANT,errors:[],stops:[],input:engine==='chromium'?'CDP touch':'WebKit keyboard; not physical touch',opening:'static reduced-motion opening'};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 try{
  const response=await page.goto(process.env.BASE_URL+'?preserved='+pass,{waitUntil:'domcontentloaded'});row.sha256=createHash('sha256').update(await response.body()).digest('hex');
  await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert);
  if(motion!=='reduce')await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForTimeout(200);
  const cdp=engine==='chromium'?await context.newCDPSession(page):null;
  async function state(){return page.evaluate(()=>({top:nextDrop.scrollTop,height:nextDrop.clientHeight,target:__vaultEntryGuide.target,moving:__vaultEntryGuide.moving,entered:__vaultEntryGuide.entered,phase:__guide.phase(),scale:visualViewport.scale,transform:vault.style.transform}))}
  async function gesture(direction){
   if(cdp){
    // Stay in the panel's side gutter, not inside an editable form element.
    const size=page.viewportSize(),x=12,y=size.height*(direction>0?.76:.24),distance=size.height*.48;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-direction*distance*i/6,id:1}]});await page.waitForTimeout(18)}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{await page.locator('#nextDrop').focus();await page.keyboard.press(direction>0?'PageDown':'PageUp')}
   await page.waitForTimeout(700);await page.waitForFunction(()=>!__vaultEntryGuide.moving);const s=await state();row.stops.push(s);return s;
  }
  let s=await gesture(1);assert.equal(s.target,'signup');assert.equal(s.phase,'film');
  s=await gesture(-1);assert.equal(s.target,'collection');
  s=await gesture(1);assert.equal(s.target,'signup');
  if(pass===2){await page.setViewportSize({width:height,height:width});await page.waitForTimeout(400);s=await state();assert.equal(s.phase,'film');assert.equal(s.target,'signup')}
  if(pass===3){await page.locator('#nextDropEmailInput').focus();s=await gesture(1);assert.equal(s.phase,'film');assert(s.target!=='signup','Onward noneditable gesture did not release form focus')}
  for(let i=0;i<8&&s.target!=='overview';i++){s=await gesture(1);assert.equal(s.phase,'film','Overview skipped')}
  assert.equal(s.target,'overview');assert.equal(s.entered,false);assert(s.scale<=1.02);assert.equal(s.transform,'');
  if(pass===1)await page.screenshot({path:path.join(out,'overview.png')});
  if(pass===4){s=await gesture(-1);assert.equal(s.phase,'film');assert.notEqual(s.target,'overview');for(let i=0;i<8&&s.target!=='overview';i++){s=await gesture(1);assert.equal(s.phase,'film')}}
  s=await gesture(1);await page.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert);s=await state();assert.equal(s.phase,'vault');assert(s.entered);assert.equal(s.transform,'');
  if(pass===1)await page.screenshot({path:path.join(out,'vault.png')});
  assert.deepEqual(row.errors,[]);row.status='PASS';console.log('PASS',process.env.VARIANT,process.env.QA_CASE,pass);
 }catch(e){row.status='FAIL';row.error=e.stack;await page.screenshot({path:path.join(out,'failure-'+pass+'.png')}).catch(()=>{});throw e}
 finally{write();await context.close()}
}}finally{await browser.close()}})().catch(e=>{write();console.error(e);process.exitCode=1});
