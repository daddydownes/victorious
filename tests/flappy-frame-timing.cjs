// Chromium diagnostic for warmed active play. Boundary screenshots use spawned
// production gates; the timing run keeps a synthetic survivor centred so death
// and screenshots do not contaminate the measured frame interval window.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.DEMO_URL||'http://127.0.0.1:59408';
const out=path.resolve(process.argv[2]||'/private/tmp/vctrs-flappy-frame-timing');
fs.mkdirSync(out,{recursive:true});
function summarize(rows){
 const gaps=rows.slice(1).map((t,i)=>t-rows[i]).sort((a,b)=>a-b),pick=q=>gaps[Math.min(gaps.length-1,Math.floor(gaps.length*q))];
 return {frames:rows.length,meanMs:gaps.reduce((a,b)=>a+b,0)/gaps.length,p50Ms:pick(.5),p95Ms:pick(.95),maxMs:gaps.at(-1),over25ms:gaps.filter(v=>v>25).length,over50ms:gaps.filter(v=>v>50).length};
}
async function run(){
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'no-preference'}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await context.route('**/*',route=>{const u=new URL(route.request().url());return u.origin===base&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort()});
 try{
  await page.goto(base+'/');await page.waitForFunction(()=>window.__flap);
  // Put the existing root-page crew controller on screen before opening the
  // overlay, matching a visitor who starts the game from the surfaced page.
  await page.evaluate(()=>{document.body.classList.add('surfaced');document.getElementById('crew').scrollIntoView({block:'center'})});
  await page.waitForFunction(()=>document.getElementById('crewStrip').style.transform,{timeout:5000});
  await page.evaluate(()=>__flap.open());await page.locator('#flapAction').click();await page.waitForFunction(()=>__flap.state()==='play');
  const stages=[];
  for(const [score,kind] of [[25,'ARCH'],[50,'SLANT'],[75,'IRIS']]){
   await page.evaluate(score=>{const g=__flap.dbg();g.score=score;g.gates=[];g.spawnT=0;g.y=.5;g.vy=0},score);
   await page.waitForFunction(kind=>__flap.dbg().gates[0]?.kind===kind,kind);
   const row=await page.evaluate(()=>{const state=__flap.dbg(),gate=state.gates[0],canvas=document.getElementById('flap'),w=720*canvas.clientWidth/canvas.clientHeight;Object.assign(gate,{x:w*.55,y:360,baseY:360,target:360,opening:gate.finalOpening,reveal:1,locked:true,top:360-gate.finalOpening/2,bottom:360+gate.finalOpening/2});state.y=.5;state.vy=0;return {score:state.score,kind:gate.kind,level:gate.level,opening:gate.finalOpening,widthScale:gate.widthScale}});
   assert.equal(row.kind,kind);stages.push(row);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.screenshot({path:path.join(out,`chromium-active-${score}-${kind.toLowerCase()}.png`)});
  }
  async function measure(label){
   const sample=await page.evaluate(()=>new Promise(resolve=>{
    const rows=[],crew=[],longTasks=[];let start=0;
    const observer='PerformanceObserver' in window?new PerformanceObserver(list=>list.getEntries().forEach(e=>longTasks.push({start:e.startTime,duration:e.duration}))):null;
    try{observer?.observe({type:'longtask',buffered:true})}catch(_e){}
    function frame(t){
     const state=__flap.dbg(),canvas=document.getElementById('flap'),w=720*canvas.clientWidth/canvas.clientHeight;
     if(state.state==='play'){
      state.y=.5;state.vy=0;
      state.gates.forEach(g=>Object.assign(g,{y:360,baseY:360,target:360,opening:g.finalOpening,reveal:1,locked:true,top:360-g.finalOpening/2,bottom:360+g.finalOpening/2}));
      if(!state.gates.length){state.spawnT=0;}
     }
     if(!start)start=t;
     if(t-start>=750){rows.push(t);crew.push(document.getElementById('crewStrip').style.transform)}
     if(t-start<3750)requestAnimationFrame(frame);else{observer?.disconnect();resolve({rows,crew,longTasks,state:state.state,score:state.score,width:w})}
    }
    requestAnimationFrame(frame);
   }));
   assert.equal(sample.state,'play');assert(sample.rows.length>=60,'warmed active play produced too few presented frames');
   return {label,...summarize(sample.rows),crewTransformChanges:new Set(sample.crew).size,longTasks:sample.longTasks.filter(task=>task.start>=sample.rows[0]&&task.start<=sample.rows.at(-1)),score:sample.score};
  }
  const backgroundCrewVisible=await measure('root overlay with crew intersecting behind it');
  await page.evaluate(()=>{document.getElementById('crew').style.display='none'});await page.waitForTimeout(250);
  const backgroundCrewHidden=await measure('root overlay after crew leaves rendering');
  await page.screenshot({path:path.join(out,'chromium-active-warmed-final.png')});
  assert.deepEqual(errors,[]);
  const report={browser:'Playwright Chromium',viewport:{width:1280,height:900},warmupMs:750,measuredMs:3000,stages,backgroundCrewVisible,backgroundCrewHidden,limits:'Desktop headless Chromium on a shared machine. A synthetic centred-gate survivor changes positions while retaining the production physics and draw loops; this is not a representative route, human playability, physical-device, GPU-memory or universal smoothness result.'};
  fs.writeFileSync(path.join(out,'frame-timing.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await context.close();await browser.close()}
}
run().catch(error=>{console.error(error);process.exitCode=1});
