// Exercise the static site at an HTTPS-shaped origin, fulfilling every site
// request from the local server. No request reaches a public form or website.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit,firefox}=require('playwright');
const root=path.resolve(__dirname,'..'),local=process.env.DEMO_URL||'http://127.0.0.1:59408';
const origin='https://release.vctrs.test',out=path.resolve(process.argv[2]||path.join(root,'../../work/com-ready-027/production-origin'));
fs.mkdirSync(out,{recursive:true});
const results=[];
function exactAsset(relative){
  const resolved=path.resolve(root,relative);assert(resolved.startsWith(root+path.sep),'Asset escapes site');
  let directory=root;
  for(const segment of path.relative(root,resolved).split(path.sep)){assert(fs.readdirSync(directory).includes(segment),'Case-sensitive production path missing: '+relative);directory=path.join(directory,segment)}
  assert(fs.statSync(directory).isFile());
}
let assets=0;
for(const file of ['index.html','experience/index.html','experience/game-preview.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of html.matchAll(/<(?:script|link|img|video|iframe|source|image)\b[^>]*?(?:src|data-src|href)=["']([^"']+)["']/g)){
    const ref=match[1];if(/^(?:https?:|data:|#)/.test(ref))continue;exactAsset(path.join(path.dirname(file),ref.split(/[?#]/)[0]));assets++;
  }
}
assert.equal(fs.readFileSync(path.join(root,'CNAME'),'utf8').trim(),'vctrsclo.com');exactAsset('.nojekyll');exactAsset('google303d59fed389923f.html');exactAsset('assets/share-v-20260906.png');
async function isolated(browser,viewport,siteOrigin=origin){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<500});const missing=[],external=[],requests=[];
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==siteOrigin||!['GET','HEAD'].includes(request.method())){external.push(url.origin);return route.abort()}
    requests.push(url.pathname);
    if(siteOrigin===local)return route.continue();
    const response=await context.request.get(local+url.pathname+url.search,{headers:request.headers().range?{Range:request.headers().range}:{}});
    if(response.status()>=400)missing.push({path:url.pathname,status:response.status()});
    return route.fulfill({response});
  });return {context,missing,external,requests};
}
async function capture(page,name){await page.screenshot({path:path.join(out,name+'.png')})}
async function metadata(engine,width,height){
  const browser=await({chromium,webkit,firefox})[engine].launch();
  try{const {context,missing,external,requests}=await isolated(browser,{width,height}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/experience/');await page.waitForTimeout(1300);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://vctrsclo.com/experience/');
    assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'),'https://vctrsclo.com/assets/share-v-20260906.png');
    assert(!requests.some(p=>p.endsWith('state.json')),'Production must not poll the demo reload endpoint');
    assert(!requests.some(p=>p.endsWith('story-film.mp4')),'Story video waits for its scene');
    const initial=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>({path:new URL(e.name).pathname,bytes:e.encodedBodySize})));
    await page.locator('#ending').scrollIntoViewIfNeeded();await page.waitForFunction(()=>Array.from(document.querySelectorAll('.end-photo img')).every(img=>img.complete&&img.naturalWidth>0));
    for(const selector of ['#vault-title','.vault-action-group','.end-mark']){
      const centred=await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {centre:r.x+r.width/2,expected:document.querySelector('main').getBoundingClientRect().width/2}});
      assert(Math.abs(centred.centre-centred.expected)<1,'Centred vault element: '+selector+' '+JSON.stringify(centred));
    }
    await capture(page,`${engine}-${width}-gallery`);
    await page.locator('#vault-invite').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('#vault-title img').naturalWidth>0);await page.waitForTimeout(1400);await capture(page,`${engine}-${width}-centred-vault`);
    await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#vault-title').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>!document.getElementById('vault-title').classList.contains('paint-active'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(missing,[]);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
    results.push({kind:'production-origin',engine,width,height,initial,requests:requests.length,missing,external,errors});await context.close();
    console.log('PASS production-origin assets, metadata, gallery and reduced motion',engine,width,height);
  }finally{await browser.close()}
}
async function natural(engine,width,height){
  // WebKit's native media loader cannot use Playwright's fulfilled fake host.
  // Exercise its natural media journey on the real loopback server instead;
  // the separate WebKit metadata audit still covers the production hostname path.
  const siteOrigin=engine==='webkit'?local:origin;
  const browser=await({chromium,webkit})[engine].launch();
  try{for(let pass=1;pass<=4;pass++){
    const {context,missing,external}=await isolated(browser,{width,height},siteOrigin),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
    const row={kind:'natural-full-journey',engine,width,height,pass,origin:siteOrigin,startedAt:new Date().toISOString()};
    try{
      await page.goto(siteOrigin+'/?release='+engine+pass);assert.equal(await page.evaluate(()=>scrollY),0);
      await page.mouse.wheel(0,150);await page.waitForFunction(()=>document.getElementById('film').currentTime>0);
      await page.locator('#nextVaultHold').click({timeout:60000});await page.locator('#surfaceBtn').waitFor({state:'visible'});
      await page.locator('#surfaceBtn').click();await page.waitForURL(siteOrigin+'/experience/');
      assert.equal(await page.locator('.brand-logo path').evaluate(el=>getComputedStyle(el).fill),'rgb(240, 212, 146)');
      await page.locator('.story-cue').click();await page.waitForFunction(()=>!document.getElementById('story-film').paused);
      // Observe actual completion and replay, without seeking or faking ended.
      await page.waitForFunction(()=>document.getElementById('story-film').ended,null,{timeout:45000});
      assert(await page.locator('.film-toggle').isVisible());if(pass===1)await capture(page,engine+'-film-ended');
      await page.locator('.film-toggle').click();await page.waitForFunction(()=>!document.getElementById('story-film').paused);
      assert(!await page.locator('.film-toggle').isVisible());
      const opener=pass%2?'#journey-play':'#flapPlay';await page.locator(opener).click();
      await page.waitForTimeout(550);await page.locator('#flapAction').click();
      await page.waitForFunction(()=>__flap.state()==='dead',null,{timeout:10000});await page.locator('#flapAction').click();
      assert.equal(await page.evaluate(()=>__flap.state()),'play');await page.locator('#flapExit').click();
      assert.equal(await page.evaluate(()=>document.activeElement.id),opener.slice(1));
      await page.locator('.vault-return').click();await page.locator('#surfaceBtn').waitFor({state:'visible'});
      await page.goBack();await page.waitForURL(siteOrigin+'/experience/');await page.goForward();await page.locator('#surfaceBtn').waitFor({state:'visible'});
      await page.locator('#surfaceBtn').click();await page.waitForURL(siteOrigin+'/experience/');await page.locator('#restart-page').click();
      await page.waitForURL(siteOrigin+'/');assert.equal(await page.evaluate(()=>scrollY),0);
      assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.deepEqual(external,[]);
      Object.assign(row,{result:'PASS',finishedAt:new Date().toISOString(),missing,external,errors});results.push(row);console.log('PASS natural full journey',engine,pass);
    }catch(e){row.result='FAIL';row.error=e.stack;row.media=await page.locator('video').evaluateAll(vs=>vs.map(v=>({src:v.currentSrc,time:v.currentTime,ready:v.readyState,error:v.error?.message})));results.push(row);await capture(page,engine+'-'+pass+'-failure');throw e}
    finally{await context.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({assets,results,limits:'Local HTTPS-origin interception and headless engine/viewport emulation. Actual playback and UI input; no forced media time or game state. Not live-domain or physical-device certification.'},null,2))}
  }}finally{await browser.close()}
}
(async()=>{for(const args of [['chromium',1280,720],['webkit',390,844],['firefox',1280,900]])await metadata(...args);const runs=await Promise.allSettled([natural('chromium',1280,900),natural('webkit',390,844)]);for(const r of runs)if(r.status==='rejected')throw r.reason;console.log('PASS release candidate: eight uninterrupted full journeys and three production-origin audits')})().catch(e=>{console.error(e);process.exitCode=1});
