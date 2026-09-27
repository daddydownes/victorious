'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const pw=require('playwright');
const base=process.env.BASE_URL,out=process.env.EVIDENCE_DIR,passes=Number(process.env.QA_PASSES||4);
assert(base&&out);fs.mkdirSync(out,{recursive:true});
const oldHTML=cp.execFileSync('git',['show','bac0b908e9814487c4c7fa8d7f8f05c43cfaba1a:index.html'],{encoding:'utf8',maxBuffer:5e6}).replace(/\r\n/g,'\n');
const newHTML=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),rows=[];
const save=()=>fs.writeFileSync(path.join(out,'comparison.json'),JSON.stringify({platform:process.platform,baseline:hash(oldHTML),candidate:hash(newHTML),rows},null,2));
function instrument(){
 const raw=requestAnimationFrame.bind(window);window.__audit={active:false,rects:0,ids:{},raf:{},samples:[],last:0};
 window.requestAnimationFrame=callback=>raw(function(now){const p=__audit,t=performance.now();try{return callback(now)}finally{if(p.active){const k=callback.name||'anonymous',r=p.raf[k]||(p.raf[k]={calls:0,ms:0,max:0}),dt=performance.now()-t;r.calls++;r.ms+=dt;r.max=Math.max(r.max,dt)}}});
 const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(...args){if(__audit.active){__audit.rects++;const k=this.id||this.tagName;__audit.ids[k]=(__audit.ids[k]||0)+1}return rect.apply(this,args)};
 function sample(now){const p=__audit;if(p.active&&p.last)p.samples.push(now-p.last);p.last=p.active?now:0;raw(sample)}raw(sample);
}
const state=page=>page.evaluate(()=>{const p=document.getElementById('nextDrop'),v=window.__vaultEntryGuide;return{top:p.scrollTop,height:p.clientHeight,target:v.target,moving:v.moving,entered:v.entered,phase:__guide.phase(),vaultInert:document.getElementById('vault').inert,native:window.__vaultPan.active,worldHidden:document.getElementById('world').hidden}});
async function animations(page){return page.evaluate(()=>document.getAnimations().map(a=>{const e=a.effect?.target;if(!e?.getBoundingClientRect)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{name:a.animationName||a.constructor.name,target:e.id||e.className?.baseVal||String(e.className),playState:a.playState,retired:!!e.closest('.seamsec,#stage'),visible:s.visibility==='visible'&&Number(s.opacity)>0&&r.bottom>0&&r.top<innerHeight,properties:[...new Set(a.effect.getKeyframes().flatMap(k=>Object.keys(k)))].filter(k=>!['offset','easing','composite','computedOffset'].includes(k))}}).filter(Boolean))}
async function frozenShot(page,file){
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await Promise.all([...document.images].filter(i=>i.currentSrc&&i.complete).map(i=>i.decode().catch(()=>{})));
  window.__shotAnimations=document.getAnimations().map(a=>({a,time:a.currentTime,state:a.playState}));
  for(const {a}of __shotAnimations){try{a.pause();a.currentTime=1200}catch{}}
  const dust=document.getElementById('dust');window.__shotDust=dust?.style.visibility;if(dust)dust.style.visibility='hidden';
 });
 await page.screenshot({path:file});
 await page.evaluate(()=>{for(const {a,time,state}of __shotAnimations){try{a.currentTime=time;if(state==='running')a.play()}catch{}}const dust=document.getElementById('dust');if(dust)dust.style.visibility=__shotDust;delete window.__shotAnimations});
}
async function run(browser,engine,width,height,variant,pass){
 const mobile=width<900,tag=[engine,`${width}x${height}`,variant,pass].join('-');
 const row={tag,variant,engine,width,height,pass,input:engine==='chromium'&&mobile?'CDP native touch':'wheel (WebKit narrow viewport is desktop engine)',errors:[],segments:[],status:'RUNNING'};rows.push(row);save();
 const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile&&engine==='chromium',reducedMotion:'reduce'});
 await context.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
 if(variant==='baseline')await context.route(url=>url.pathname==='/'&&url.searchParams.has('scroll-comparison'),r=>r.fulfill({contentType:'text/html',body:oldHTML}));
 await context.addInitScript(instrument);const page=await context.newPage();page.on('pageerror',e=>row.errors.push(e.message));page.setDefaultTimeout(15000);
 const cdp=engine==='chromium'?await context.newCDPSession(page):null;if(cdp)await cdp.send('Performance.enable');
 const metrics=async()=>cdp?Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value])):null;
 async function move(direction=1){
  if(cdp&&mobile){const x=width*.5,start=height*.82,end=start-direction*Math.min(height*.55,350);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start,id:1}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start+(end-start)*i/8,id:1}]});await page.waitForTimeout(16)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  else {await page.mouse.move(width*.5,height*.72);await page.mouse.wheel(0,direction*height*1.1)}
 }
 async function settled(){await page.waitForFunction(()=>!__vaultEntryGuide.moving)}
 async function segment(label,direction=0){
  const before=await state(page),m=await metrics();
  await page.evaluate(()=>Object.assign(__audit,{active:true,rects:0,ids:{},raf:{},samples:[],last:0}));
  if(direction)await move(direction);await page.waitForTimeout(900);
  const stats=await page.evaluate(()=>{const p=__audit;p.active=false;const s=[...p.samples].sort((a,b)=>a-b);return{rects:p.rects,ids:p.ids,raf:p.raf,frames:s.length,frameP95:s[Math.floor(s.length*.95)]||0,over34:s.filter(x=>x>34).length,frameMax:s.at(-1)||0}});
  const n=await metrics();if(m)stats.chromium=Object.fromEntries(['LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration'].map(k=>[k,n[k]-m[k]]));
  row.segments.push({label,before,after:await state(page),...stats});save();await settled();
 }
 async function shot(label){if(pass!==1)return;await frozenShot(page,path.join(out,tag+'-'+label+'.png'))}
 try{
  const response=await page.goto(base+'?scroll-comparison='+tag+(mobile?'&vaultPan=native':''),{waitUntil:'domcontentloaded'});
  row.source=hash(await response.text());assert.equal(row.source,hash(variant==='baseline'?oldHTML:newHTML));row.browser=await page.evaluate(()=>navigator.userAgent);
  await page.waitForFunction(()=>document.body.classList.contains('next-drop-landed')&&!nextDrop.inert,{}, {timeout:45000});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(600);
  row.animations=await animations(page);
  await segment('collection-idle');await shot('collection');
  await segment('collection-to-signup',1);assert.equal((await state(page)).target,'signup');
  await segment('signup-idle');await shot('signup');
  if(pass===2){await move(-1);await settled();assert.equal((await state(page)).target,'collection');await page.waitForTimeout(200);await move(1);await settled();assert.equal((await state(page)).target,'signup')}
  if(pass===4){await page.setViewportSize({width,height:height-48});await page.waitForTimeout(150);await page.setViewportSize({width,height});await page.waitForTimeout(150);const s=await state(page);assert.equal(s.entered,false);assert.equal(s.target,'signup')}
  for(let i=0;i<7&&(await state(page)).target!=='overview';i++)await segment('approach-'+i,1);
  assert.equal((await state(page)).target,'overview');assert.equal((await state(page)).entered,false);
  await segment('overview-idle');await shot('overview');
  await segment('overview-to-vault',1);await page.waitForFunction(()=>__guide.phase()==='vault'&&!vault.inert,{}, {timeout:15000});
  await segment('vault-idle');await shot('vault');await segment('vault-pan',1);
  row.final=await state(page);row.finalAnimations=await animations(page);assert.deepEqual(row.errors,[]);row.status='PASS';
  console.log(tag,'PASS',JSON.stringify(row.segments.map(s=>({label:s.label,rects:s.rects,layouts:s.chromium?.LayoutCount,p95:s.frameP95}))));
 }catch(error){row.status='FAIL';row.error=error.stack;row.debug=await state(page).catch(()=>null);console.error(tag,error);await page.screenshot({path:path.join(out,tag+'-FAIL.png')}).catch(()=>{})}
 finally{save();await context.close()}
}
(async()=>{
 for(const engine of(process.env.ENGINES||'webkit,chromium').split(',')){
  const browser=await pw[engine].launch();try{
   for(const [width,height]of[[390,844],[844,390],[1440,900],[320,568]]){
    await run(browser,engine,width,height,'baseline',1);
    for(let pass=1;pass<=passes;pass++)await run(browser,engine,width,height,'candidate',pass);
   }
  }finally{await browser.close()}
 }
 if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
})();
