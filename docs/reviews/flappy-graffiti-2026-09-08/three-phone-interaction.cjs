const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webkit } = require('playwright');

const base = process.env.DEMO_URL || 'http://127.0.0.1:8922';
const out = process.env.AUDIT_OUT || '/private/tmp/vctrs-vstyle-mobile/graffiti-final';
fs.mkdirSync(out, {recursive:true});
async function tap(page, selector) {
  const box=await page.locator(selector).boundingBox(); assert(box,`missing ${selector}`);
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
}
async function stageFixture(page, score, kind) {
  await page.evaluate(value=>{const g=__flap.dbg();g.score=value;g.gates=[];g.spawnT=0;g.y=.48;g.vy=0},score);
  await page.waitForFunction(expected=>__flap.dbg().gates[0]?.kind===expected,kind,{timeout:3000});
  await page.evaluate(()=>{const game=__flap.dbg(),gate=game.gates[0],s={w:720*innerWidth/innerHeight,h:720};gate.x=s.w*.68;gate.y=s.h*.49;gate.baseY=gate.target=gate.y;gate.opening=gate.finalOpening;gate.reveal=1;gate.locked=true;game.y=.49;game.vy=0});
  await page.waitForTimeout(30);
}
async function run(width,height) {
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width,height},hasTouch:true});
  const page=await context.newPage(),name=`webkit-${width}x${height}`,errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message)); page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
  try {
    const response=await page.goto(`${base}/experience/?graffiti=${width}x${height}`,{waitUntil:'domcontentloaded',timeout:60000}); assert.equal(response?.status(),200);
    await page.locator('#journey-play').scrollIntoViewIfNeeded(); await tap(page,'#journey-play'); await page.waitForFunction(()=>__flapMotion.state()==='open');
    await tap(page,'#flapAction'); await page.waitForFunction(()=>__flap.state()==='play'); await page.touchscreen.tap(width*.42,height*.45);
    await stageFixture(page,0,'PILLAR'); await page.screenshot({path:path.join(out,`${name}-pillar-stage0.png`)});
    await tap(page,'#flapPause'); await page.waitForFunction(()=>__flap.paused()); await tap(page,'#flapPause'); await page.waitForFunction(()=>!__flap.paused());
    await stageFixture(page,25,'ARCH'); await page.screenshot({path:path.join(out,`${name}-arch-stage25-fixture.png`)});
    const visual=await page.evaluate(()=>({state:__flap.state(),score:__flap.score(),gate:__flap.dbg().gates[0]?.kind,overflow:document.documentElement.scrollWidth>innerWidth+1}));
    await tap(page,'#flapExit'); await page.waitForFunction(()=>__flapMotion.state()==='closed'&&!__flap.isOpen(),null,{timeout:3000}); assert.equal(await page.evaluate(()=>document.activeElement.id),'journey-play');
    assert.equal(visual.state,'play');assert.equal(visual.score,25);assert.equal(visual.gate,'ARCH');assert.equal(visual.overflow,false);assert.deepEqual(errors,[]);
    const unexpected=failed.filter(item=>!(/story-film-.*\.mp4/.test(item.url)&&item.error==='cancelled'));assert.deepEqual(unexpected,[]);
    return {name,status:response?.status(),visual,interactions:['touch launch','touch Start','touch flap','touch pause','touch resume','touch Exit'],focusReturn:'journey-play',errors,failed};
  } finally {await context.close();await browser.close();}
}
(async()=>{const rows=[];for(const v of [[320,568],[390,844],[844,390]])rows.push(await run(...v));const report={base,checkedAt:new Date().toISOString(),rows,limits:'Headless WebKit touch/viewport emulation. Stage 0 and 25 are fixture-positioned visual witnesses; no physical-device certification.'};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,rows:rows.map(r=>({name:r.name,visual:r.visual,interactions:r.interactions}))}))})().catch(e=>{console.error(e);process.exitCode=1});
