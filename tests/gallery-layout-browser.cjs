// Responsive layout and delivery geometry; emulation, not physical devices.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:59530/',out=path.resolve(process.env.EVIDENCE_DIR||'gallery-layout-qa'),rows=[];
fs.mkdirSync(out,{recursive:true});const save=()=>fs.writeFileSync(path.join(out,'layout.json'),JSON.stringify({time:new Date().toISOString(),base,rows},null,2));
(async()=>{for(const engine of ['chromium','webkit','firefox']){
 const browser=await pw[engine].launch(),p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
 try{await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!nextDrop.inert);
 for(const [width,height]of [[1920,1080],[1440,900],[1280,720],[1024,768],[768,1024],[390,844],[430,932],[320,568],[844,390],[667,375]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(180);
  await p.waitForFunction(()=>[...document.querySelectorAll('.collection-piece img')].every(i=>i.complete&&i.naturalWidth>0&&i.sizes===Math.ceil(i.getBoundingClientRect().width)+'px'));
  const geometry=await p.evaluate(()=>{const rect=e=>e.getBoundingClientRect().toJSON(),screen=document.querySelector('.collection-screen'),grid=document.querySelector('.collection-grid');return{screen:rect(screen),signup:rect(document.querySelector('.collection-signup')),overflow:nextDrop.scrollWidth>nextDrop.clientWidth,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,photos:[...grid.querySelectorAll('img')].map(i=>({rect:rect(i),sizes:i.sizes,currentSrc:i.currentSrc})),labels:[...document.querySelectorAll('.next-drop-kicker,.collection-header h2')].map(i=>({rect:rect(i),fontSize:getComputedStyle(i).fontSize,align:getComputedStyle(i).textAlign,animation:getComputedStyle(i).animationName}))}});
  assert.equal(geometry.overflow,false);assert(Math.abs(geometry.screen.height-height)<2,'Collection fits one viewport');assert(Math.abs(geometry.signup.top-height)<2,'Signup starts on the next screen');assert(geometry.signup.height>=height-1);
  assert.equal(geometry.screen.x,0,'Collection stays at the left edge after rotation');assert.equal(geometry.screen.width,width,'Collection fills available width after rotation');assert.equal(geometry.signup.width,width,'Signup fills available width');
  assert.equal(geometry.columns,width<=900&&height>=width?2:4);
  assert(geometry.photos.every(i=>i.rect.top>=0&&i.rect.bottom<=height&&i.rect.left>=0&&i.rect.right<=width),'All products visible inside first screen');
  const cue=await p.locator('#collectionScrollCue').boundingBox();assert(cue&&cue.y+cue.height<=height&&cue.y>Math.max(...geometry.photos.map(i=>i.rect.bottom)),'Scroll cue stays below products and within the first screen');
  assert(geometry.labels.every(l=>l.align==='center'&&l.animation==='none'&&parseFloat(l.fontSize)>=11));
  await p.screenshot({path:path.join(out,engine+'-'+width+'x'+height+'.png')});rows.push({engine,width,height,status:'PASS',geometry});save();console.log('PASS layout',engine,width,height);
 }
 await p.setViewportSize({width:390,height:844});await p.emulateMedia({reducedMotion:'no-preference'});
 await p.evaluate(()=>{window.__cueSamples=[];nextDrop.addEventListener('scroll',()=>__cueSamples.push(nextDrop.scrollTop),{passive:true})});
 await p.locator('#collectionScrollCue').click();
 await p.waitForFunction(()=>Math.abs(document.querySelector('#collectionSignup').getBoundingClientRect().top-nextDrop.getBoundingClientRect().top)<2);
 const glide=await p.evaluate(()=>({samples:__cueSamples,focused:document.activeElement.textContent,activeTag:document.activeElement.tagName,scroll:nextDrop.scrollTop}));
 assert(glide.samples.some(y=>y>1&&y<glide.scroll-1),'Cue glides through intermediate positions');assert.equal(glide.activeTag,'H2');
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('.collection-intro').scrollIntoViewIfNeeded();await p.locator('#collectionScrollCue').focus();await p.keyboard.press('Enter');
 await p.waitForFunction(()=>Math.abs(document.querySelector('#collectionSignup').getBoundingClientRect().top-nextDrop.getBoundingClientRect().top)<2);
 rows.push({engine,status:'PASS',cue:'smooth pointer and immediate reduced-motion keyboard',glide});save();
 assert.deepEqual(errors,[]);
 }catch(e){rows.push({engine,status:'FAIL',error:e.stack,errors});throw e}finally{save();await browser.close()}
}console.log('PASS',rows.length,'responsive layouts')})().catch(e=>{save();console.error(e);process.exitCode=1});
