const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webkit } = require('playwright');

const base=process.env.DEMO_URL||'http://127.0.0.1:8922';
const out=process.env.AUDIT_OUT||'/private/tmp/vctrs-graffiti-random-layout';
fs.mkdirSync(out,{recursive:true});

async function activate(page,selector,touch){
  const box=await page.locator(selector).boundingBox();assert(box,`missing ${selector}`);
  if(touch)await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  else await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
}
async function fixture(page){
  await page.evaluate(()=>{const game=__flap.dbg();game.score=0;game.gates=[];game.spawnT=0;game.y=.49;game.vy=0});
  await page.waitForFunction(()=>__flap.dbg().gates[0]?.kind==='PILLAR',null,{timeout:3000});
  return page.evaluate(()=>{
    const game=__flap.dbg(),base=game.gates[0],w=720*innerWidth/innerHeight,serials=[0,1,2],phases=[.2,2.3,5.1],xs=[.42,.64,.86];
    game.speed=0;game.gates=serials.map((serial,i)=>Object.assign({},base,{serial,ordinal:serial,phase:phases[i],x:w*xs[i],y:720*.49,baseY:720*.49,target:720*.49,kind:'PILLAR',level:0,opening:156,finalOpening:156,reveal:1,locked:true,counted:false,entered:false,missed:false,checkpassed:false,age:2}));
    game.spawnT=30;game.y=.49;game.vy=0;
    return {w,identities:game.gates.map(g=>({serial:g.serial,phase:g.phase,x:g.x}))};
  });
}
async function snapshotState(page){return page.evaluate(()=>({state:__flap.state(),score:__flap.score(),paused:__flap.paused(),gates:__flap.dbg().gates.map(g=>({serial:g.serial,phase:g.phase,x:g.x,kind:g.kind})),overflow:document.documentElement.scrollWidth>innerWidth+1}))}
async function run(width,height,touch){
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch});
  const page=await context.newPage(),name=`webkit-${width}x${height}`,errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
  try{
    const response=await page.goto(`${base}/experience/?graffiti-layout=${width}x${height}`,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response?.status(),200);
    await page.locator('#journey-play').scrollIntoViewIfNeeded();await activate(page,'#journey-play',touch);await page.waitForFunction(()=>__flapMotion.state()==='open');
    await activate(page,'#flapAction',touch);await page.waitForFunction(()=>__flap.state()==='play');
    if(touch)await page.touchscreen.tap(width*.30,height*.48);else await page.mouse.click(width*.30,height*.48);
    await activate(page,'#flapPause',touch);await page.waitForFunction(()=>__flap.paused());await activate(page,'#flapPause',touch);await page.waitForFunction(()=>!__flap.paused());
    const seeded=await fixture(page);await page.waitForTimeout(40);const before=await snapshotState(page);
    await page.screenshot({path:path.join(out,`${name}-serials-0-1-2-before.png`)});
    await page.evaluate(()=>{const game=__flap.dbg();game.gates.forEach(g=>g.x-=Math.max(18,(720*innerWidth/innerHeight)*.045));game.y=.49;game.vy=0});
    await page.waitForTimeout(40);const after=await snapshotState(page);
    await page.screenshot({path:path.join(out,`${name}-serials-0-1-2-after-shift.png`)});
    assert.deepEqual(after.gates.map(g=>[g.serial,g.phase,g.kind]),before.gates.map(g=>[g.serial,g.phase,g.kind]));
    assert(before.gates.every((g,i)=>g.serial===i&&g.phase===[.2,2.3,5.1][i]&&g.kind==='PILLAR'));assert.equal(before.overflow,false);assert.equal(after.overflow,false);
    await activate(page,'#flapExit',touch);await page.waitForFunction(()=>__flapMotion.state()==='closed'&&!__flap.isOpen(),null,{timeout:3000});assert.equal(await page.evaluate(()=>document.activeElement.id),'journey-play');
    assert.deepEqual(errors,[]);const unexpected=failed.filter(item=>!(/story-film-.*\.mp4/.test(item.url)&&item.error==='cancelled'));assert.deepEqual(unexpected,[]);
    return{name,status:response?.status(),touch,seeded,before,after,interactions:[`${touch?'touch':'mouse'} launch`,'Start','flap','pause','resume','Exit'],focusReturn:'journey-play',errors,failed};
  }finally{await context.close();await browser.close()}
}
(async()=>{const rows=[await run(390,844,true),await run(1280,720,false)];const report={base,checkedAt:new Date().toISOString(),rows,limits:'Headless WebKit fixture: fixed serial/phase values demonstrate controlled visual variation and stable identity while translated; no rule/difficulty changes or physical-device claim.'};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,rows:rows.map(r=>({name:r.name,before:r.before.gates,after:r.after.gates}))}))})().catch(e=>{console.error(e);process.exitCode=1});
