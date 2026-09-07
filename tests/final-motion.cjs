const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit, firefox } = require('playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:59408';
const evidence = process.argv[2] && path.resolve(process.argv[2]);
const results = [];
const configurations = [['chromium',1280,900],['chromium',320,568],['chromium',390,844],['webkit',390,844],['webkit',844,390],['webkit',1280,900],['firefox',1280,900]];
async function at(page,selector,fraction) {
  await page.evaluate(({selector,fraction}) => {
    const top = document.querySelector(selector).getBoundingClientRect().top;
    scrollTo({top:scrollY+top-innerHeight*fraction,behavior:'instant'});
  },{selector,fraction});
}
async function shot(page,name) { if(evidence) await page.screenshot({path:path.join(evidence,name+'.png')}); }
(async()=>{
  if(evidence)fs.mkdirSync(evidence,{recursive:true});
  for(const [engine,width,height] of configurations){
    const browser=await ({chromium,webkit,firefox})[engine].launch({headless:true});
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<500});
    // No external form or analytics requests may leave these checks.
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const name=engine+'-'+width;
    try{
      await page.goto(base+'/experience/?final-motion='+name);
      await at(page,'#play-title',.62);
      await page.waitForFunction(()=>document.querySelector('#play-title img').naturalWidth>0);
      // Jump through and back across the invitation, without waiting for any reveal.
      const fast=[];
      for(const fraction of [.62,.15,-.6,.45,.06]){
        await at(page,'#play-title',fraction);
        const state=await page.locator('#play-title').evaluate(el=>{
          const image=el.querySelector('img'),style=getComputedStyle(image);
          return {canvas:!!el.querySelector('canvas'),visibility:style.visibility,opacity:style.opacity,paintActive:el.classList.contains('paint-active'),loaded:image.naturalWidth>0};
        });
        assert.deepEqual(state,{canvas:false,visibility:'visible',opacity:'1',paintActive:false,loaded:true});fast.push(state);
      }
      await at(page,'#play',.8);await page.waitForTimeout(100);
      const early=await page.locator('.live-game-shell').evaluate(el=>({transform:getComputedStyle(el).transform,opacity:Number(getComputedStyle(el).opacity)}));
      await shot(page,name+'-arrival');
      await at(page,'#play',.08);await page.waitForTimeout(100);
      const settled=await page.locator('.live-game-shell').evaluate(el=>({transform:getComputedStyle(el).transform,opacity:Number(getComputedStyle(el).opacity)}));
      assert(settled.opacity>early.opacity&&settled.opacity===1);assert.notEqual(early.transform,settled.transform);
      await shot(page,name+'-game');
      const titleBox=await page.locator('#play-title').boundingBox();
      const titleLightBefore=await page.locator('#play-title img').evaluate(el=>getComputedStyle(el).filter);
      await page.waitForTimeout(700);
      assert.deepEqual(await page.locator('#play-title').boundingBox(),titleBox,'Light must not move the title');
      assert.notEqual(await page.locator('#play-title img').evaluate(el=>getComputedStyle(el).filter),titleLightBefore);
      // Open the real game and ensure decorative motion stops behind it.
      await page.locator('#journey-play').focus();await page.keyboard.press('Enter');
      await page.waitForFunction(()=>document.querySelector('#flapOverlay.on'));
      assert.equal(await page.locator('#play-title img').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
      await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#flapOverlay.on'));
      assert.equal(await page.evaluate(()=>document.activeElement.id),'journey-play');
      // The fast-skip test can legitimately finish the monotonic vault reveal.
      // Start a fresh visit to inspect its first partial arrival.
      await page.goto(base+'/experience/?vault-motion='+name);
      await at(page,'#vault-title',.68);
      await page.waitForFunction(()=>document.querySelector('#vault-title img').naturalWidth>0);
      await at(page,'#vault-title',.68);await page.waitForTimeout(500);
      const paint=Number(await page.locator('#vault-title').getAttribute('data-paint-progress'));
      assert(paint>0&&paint<1,'Vault keeps its partial paint reveal');
      await shot(page,name+'-vault-paint');
      await at(page,'#vault-title',.08);await page.waitForFunction(()=>document.querySelector('#vault-title').dataset.paintProgress==='1.000');
      assert.equal(await page.locator('#play-title img').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
      await shot(page,name+'-vault');
      const buttons=[];
      for(const selector of ['.vault-return','#restart-page','.signup-footer .action']){
        const el=page.locator(selector);await el.scrollIntoViewIfNeeded();await el.focus();
        await page.waitForFunction(selector=>getComputedStyle(document.querySelector(selector),'::before').animationPlayState==='running',selector);
        const lightTime=await el.evaluate(el=>el.getAnimations({subtree:true}).find(a=>a.animationName==='button-light').currentTime);
        await page.waitForTimeout(120);
        assert((await el.evaluate(el=>el.getAnimations({subtree:true}).find(a=>a.animationName==='button-light').currentTime))>lightTime,'Visible button highlight must advance');
        const rect=await el.boundingBox();assert(rect.height>=44);
        await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
        const pressed=await el.evaluate(el=>({opacity:getComputedStyle(el).opacity,visibility:getComputedStyle(el).visibility,text:el.textContent.trim(),height:el.getBoundingClientRect().height}));
        assert.equal(pressed.opacity,'1');assert.equal(pressed.visibility,'visible');assert(pressed.text.length>8);assert(pressed.height>=44);
        await page.mouse.move(0,0);await page.mouse.up();buttons.push({selector,pressed});
      }
      await page.waitForTimeout(1000);await shot(page,name+'-signup');
      assert.equal((await page.locator('#signup-title').innerText()).toLowerCase(),'be there\nnext time.');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      // Lifecycle fixture: exercise the actual visibility handler without
      // claiming an emulated hidden property is a physical app-switch test.
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
      assert.equal(await page.locator('.signup-footer .action').evaluate(el=>getComputedStyle(el,'::before').animationPlayState),'paused');
      await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
      // Dynamically turning on reduced motion settles all new movement.
      await page.emulateMedia({reducedMotion:'reduce'});await at(page,'#play',.55);await page.waitForTimeout(100);
      assert.equal(await page.locator('#play-title img').evaluate(el=>getComputedStyle(el).animationName),'none');
      assert.equal(await page.locator('.live-game-shell').evaluate(el=>getComputedStyle(el).transform),'none');
      assert.equal(await page.locator('.vault-return').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
      assert.deepEqual(errors,[]);
      results.push({engine,width,height,fastFrames:fast.length,early,settled,paint,buttons,hiddenLifecycleFixture:true,errors});
      console.log('PASS '+name);
    }catch(error){await shot(page,name+'-failure');throw error}finally{await browser.close()}
  }
  const report={timestamp:new Date().toISOString(),results,limits:'Local browser engines and touch viewports, not physical devices. External transport blocked; dedicated handoff suite checks mocked signup and navigation.'};
  if(evidence)fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:results.length}));
})().catch(error=>{console.error(error);process.exitCode=1});
