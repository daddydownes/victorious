// Controlled viewport animation in touch WebKit; not a physical OS keyboard test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{webkit}=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR;
if(!base||!out)throw Error('Set BASE_URL to the verified preview and EVIDENCE_DIR outside the checkout.');
fs.mkdirSync(out,{recursive:true});
const report={timestamp:new Date().toISOString(),base,method:'WebKit touch emulation with controlled visualViewport heights; all signup transport mocked',rows:[],errors:[]};
const save=()=>fs.writeFileSync(path.join(out,'signup-keyboard-motion.json'),JSON.stringify(report,null,2));
(async()=>{
 const browser=await webkit.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'no-preference'});
  let submissions=0;
  await context.route('**/formsubmit.co/**',route=>{submissions++;return route.fulfill({json:{success:true}})});
  await context.addInitScript(()=>{
   const actual=window.visualViewport,viewport=new EventTarget();let height=null;
   Object.defineProperties(viewport,{height:{get:()=>height===null?actual.height:height},width:{get:()=>actual.width},offsetTop:{get:()=>0},offsetLeft:{get:()=>0},scale:{get:()=>1}});
   Object.defineProperty(window,'visualViewport',{value:viewport});
   window.__keyboardHeight=value=>{height=value;viewport.dispatchEvent(new Event('resize'))};
  });
  const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!nextDrop.inert);
  await page.locator('#collectionScrollCue').tap();
  await page.waitForFunction(()=>Math.abs(nextDrop.scrollTop-collectionSignup.offsetTop)<2);
  await page.waitForTimeout(1000);
  await page.locator('#nextDropEmailInput').tap();
  await page.waitForTimeout(100);
  report.rows=await page.evaluate(async()=>{
   const rows=[];
   for(const height of [844,840,300,180,240,300,360,844]){
    window.__keyboardHeight(height);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    // WebKit can queue its own focused-control scroll after the resize frame.
    await new Promise(resolve=>setTimeout(resolve,80));
    rows.push({height,inputTop:nextDropEmailInput.getBoundingClientRect().top,receiptBottom:nextDropResult.getBoundingClientRect().bottom,scroll:nextDrop.scrollTop,active:document.activeElement.id});
   }
   return rows;
  });
  const rows=report.rows,initial=rows[0];
  assert(Math.abs(rows[1].inputTop-initial.inputTop)<1,'A four-pixel keyboard onset must not jump the email row');
  assert(Math.abs(rows[2].inputTop-initial.inputTop)<1,'The email row should stay still while it fits');
  for(const row of rows){
   assert(row.inputTop>=-1,'Email input must remain inside the reported viewport');
   assert(row.receiptBottom<=row.height+1,'Signup receipt must remain above the simulated keyboard');
   assert.equal(row.active,'nextDropEmailInput','Viewport changes must retain email focus');
  }
  assert(rows[3].scroll>initial.scroll,'The short viewport must exercise temporary keyboard scrolling');
  for(const index of [4,5,6]){
   const previous=rows[index-1],current=rows[index],recovery=previous.scroll-current.scroll;
   assert(recovery>=-1&&recovery<=current.height-previous.height+1,'Scroll recovery must follow the newly available space');
   if(previous.scroll>initial.scroll+1)assert(recovery>0,'Scroll must recover during keyboard expansion');
  }
  assert(Math.abs(rows[6].inputTop-initial.inputTop)<1,'Email position should recover before the keyboard fully closes');
  assert(Math.abs(rows[7].inputTop-rows[6].inputTop)<1,'Keyboard close must not add a final position jump');
  assert.equal(submissions,0,'Motion checks must not submit the form');assert.deepEqual(report.errors,[]);
  report.status='PASS';save();console.log(JSON.stringify({status:report.status,frames:rows.length,evidence:path.join(out,'signup-keyboard-motion.json')}));
 }catch(error){report.status='FAIL';report.error=error.stack;save();throw error}
 finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
