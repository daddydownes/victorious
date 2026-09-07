const {chromium,webkit,firefox}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(process.argv[2]||'film-evidence');fs.mkdirSync(out,{recursive:true});
// Delay real media responses rather than browser interception, which WebKit's
// native media loader can bypass. Forward range headers to the existing server.
const server=http.createServer((req,res)=>{const send=()=>{const upstream=http.get('http://127.0.0.1:59408'+req.url,{headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});upstream.on('error',()=>{res.writeHead(502);res.end()});};if(req.url.includes('story-film.mp4'))setTimeout(send,1800);else send()});
const results=[];
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  async function check(engine,width,height){
    const b=await ({chromium,webkit,firefox})[engine].launch();
    try{const c=await b.newContext({viewport:{width,height},hasTouch:width<500});
      await c.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
      const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
      await p.goto(base+'/experience/');await p.evaluate(()=>{const e=document.getElementById('portrait');scrollTo(0,e.offsetTop+innerHeight*.35)});
      await p.waitForTimeout(250);
      const loading=await p.locator('.film-loading').evaluate(el=>({opacity:getComputedStyle(el).opacity,visibility:getComputedStyle(el).visibility,motion:getComputedStyle(el,'::before').animationPlayState}));
      assert.equal(loading.visibility,'visible');assert.equal(loading.opacity,'1');assert.equal(loading.motion,'running');
      await p.screenshot({path:path.join(out,engine+'-loading.png')});
      await p.waitForFunction(()=>document.querySelector('.film-ready')&&!document.getElementById('story-film').paused);
      await p.waitForTimeout(500);assert.equal(await p.locator('.film-loading').evaluate(el=>getComputedStyle(el).visibility),'hidden');
      const mark=await p.locator('.portrait-backmark').evaluate(e=>({filter:getComputedStyle(e).filter,pathFill:getComputedStyle(e.querySelector('path')).fill}));
      assert.equal(mark.filter,'none');assert(mark.pathFill.includes('story-metal'));assert.equal(await p.locator('.film-toggle').count(),0);
      await p.screenshot({path:path.join(out,engine+'-playing.png')});
      const rate=engine==='webkit'?1:4;
      await p.evaluate(rate=>{const v=document.getElementById('story-film');v.playbackRate=rate;window.__loopCount=0;let last=v.currentTime;v.addEventListener('timeupdate',()=>{if(last>v.duration*.7&&v.currentTime<v.duration*.2)window.__loopCount++;last=v.currentTime})},rate);
      try{await p.waitForFunction(()=>window.__loopCount>=1,null,{timeout:45000})}catch(e){console.log(engine,await p.locator('#story-film').evaluate(v=>({time:v.currentTime,duration:v.duration,paused:v.paused,ended:v.ended,ready:v.readyState,error:v.error?.message,rate:v.playbackRate,loops:window.__loopCount})));throw e}
      try{await p.waitForFunction(()=>{const v=document.getElementById('story-film');return v.loop&&!v.paused&&v.currentTime>.2},null,{timeout:5000})}catch(e){console.log('LOOP RESUME',engine,await p.locator('#story-film').evaluate(v=>({time:v.currentTime,paused:v.paused,ended:v.ended,loop:v.loop,hidden:document.hidden,ready:v.readyState,classes:v.parentElement.className,game:document.querySelector('#flapOverlay').className,rect:v.getBoundingClientRect().toJSON()})));throw e}
      await p.locator('#journey-play').click();await p.waitForFunction(()=>document.querySelector('#flapOverlay.on'));assert.equal(await p.locator('#story-film').evaluate(v=>v.paused),true);
      await p.keyboard.press('Escape');await p.locator('.story-cue').click();await p.waitForFunction(()=>!document.getElementById('story-film').paused);
      await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.getElementById('story-film').paused);
      assert.deepEqual(errors,[]);results.push({engine,width,height,loading,mark,nativeLoops:1,playbackRate:rate,errors});console.log('PASS '+engine);
    }finally{await b.close()}
  }
  try{const configurations=[['chromium',1280,900],['webkit',390,844],['firefox',1280,900]].filter(c=>!process.env.FILM_ENGINE||c[0]===process.env.FILM_ENGINE);const runs=await Promise.allSettled(configurations.map(c=>check(...c)));for(const r of runs)if(r.status==='rejected')throw r.reason;}
  finally{server.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({at:new Date().toISOString(),results,limits:'Real delayed HTTP media and native loop: WebKit at normal speed, Chromium/Firefox at4x. Viewport/engine checks, not physical devices. All external transport blocked.'},null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
