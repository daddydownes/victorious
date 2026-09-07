// Actual production game functions, deterministic browser/storage stubs; no live progress is touched.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const defaultPage=process.env.VCTRS_GAME_PAGE||'index.html';
const games=new Map();
function loadGame(page=defaultPage){
 if(games.has(page))return games.get(page);
 const html=fs.readFileSync(path.join(__dirname,'..',page),'utf8');
 const logoPath=html.match(/class="vmark"[^>]*>[\s\S]*?<path d="([^"]+)"/)[1];
 const previewEnd=html.includes('// PRODUCTION_GAMEPLAY_END'),end=html.includes('// PRODUCTION_GAME_CORE_END')?'\n// PRODUCTION_GAME_CORE_END':previewEnd?'\n// PRODUCTION_GAMEPLAY_END':'\n  measure(); updateScroll();';
 let source=html.slice(html.indexOf('  var COUPON_THRESHOLD=100;'),html.indexOf(end,html.indexOf('  var COUPON_THRESHOLD=100;')));
 // The preview replaces the normal overlay lifecycle inside the same enclosing
 // game block, so the gameplay marker appears before that block's final brace.
 if(previewEnd)source+='\n  }';
 assert(source.includes('function flapGateUpdate'));
 const game={html,logoPath,source};games.set(page,game);return game;
}
const html=loadGame().html;
function setup(w=375,h=667,seed=1,dpr=1,inject='',page=defaultPage){
 const {logoPath,source}=loadGame(page);
 const elements={},storage=new Map(),events={};let now=0;
 const math=Object.create(Math); math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const ctx={textAlign:'center'};
 const el=id=>elements[id]??=( {id,clientWidth:w,clientHeight:h,style:{setProperty(k,v){this[k]=v}},classList:{add(){},remove(){}},events:{},addEventListener(n,f){this.events[n]=f},focus(){c.document.activeElement=this},getClientRects(){return[{}]},getContext(){return ctx},tagName:id==='flap'?'CANVAS':'BUTTON'} );
 const c={Path2D:class{constructor(d){this.d=d}},Math:math,devicePixelRatio:dpr,reduced:false,motionQuery:{matches:false},performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{getElementById:el,querySelector:selector=>selector==='.vmark path'?{getAttribute:()=>logoPath}:null,body:el('body'),hidden:false,addEventListener(n,f){events[n]=f}},window:{scrollY:0,scrollTo(){}},addEventListener(n,f){events[n]=f},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setInterval:()=>1,clearInterval(){},refreshMotionPreference(){}};
 c.storyGameLock=function(){}; // Host inert/focus integration is exercised in real browsers.
 vm.createContext(c);vm.runInContext(source.replace(/\n  }\s*$/, '\n    flapDraw=function(){}; flapBurst=function(){};'+inject+'\n  }'),c);
 c.FG=c.flapNewState();c.flapOpen=true;
 return {c,s:c.flapSize(),storage,elements,events,time(t){now=t}};
}
module.exports={setup,html};
if(require.main===module){
const sizes=[[320,507],[375,667],[667,375],[1440,594],[390,844]];
const kinds=['PILLAR','ARCH','SLANT','IRIS'];
let gates=0,minLead=Infinity,minClearance=Infinity,minSpace=Infinity;
for(const [w,h] of sizes)for(let seed=1;seed<=20;seed++){
 const {c,s}=setup(w,h,seed);const W=s.w,H=s.h;
 assert(Math.abs(W/H-w/h)<1e-12);assert.equal(H,720);assert.equal(c.vh(s),34);
 for(let ordinal=0;ordinal<125;ordinal++){
  c.FG.score=ordinal;c.FG.gates.forEach(g=>g.counted=true);
  c.flapSpawn(s);const g=c.FG.gates.at(-1),level=Math.min(3,Math.floor(ordinal/25));
  assert.equal(g.ordinal,ordinal);assert.equal(g.serial,ordinal);assert.equal(g.level,level);assert.equal(g.kind,kinds[level]);
  assert(g.finalOpening>=104);assert.equal(g.reveal,level?0:1);assert(Math.abs(g.opening-g.finalOpening-(level===3?26:0))<1e-10);
  if(level<2)assert.equal(g.baseY,g.target);else assert.equal(Math.abs(g.tilt),18);
  let locked=null;
  while(g.x>W*.24-c.flapGateWidth(g,s)-c.vh(s)){
   g.x-=c.FLAP_MAX_SPEED*W/120;c.flapGateUpdate(g,s,1/120);
   assert(g.top>=-1e-7&&g.bottom<=H+1e-7&&g.bottom>g.top);
   if(g.locked&&!locked){locked=[g.y,g.opening,g.top,g.bottom];const lead=(g.x-W*.24-c.FLAP_LOGO_RADIUS)/(c.FLAP_MAX_SPEED*W);minLead=Math.min(minLead,lead);assert(lead>=.69-1e-7);}
   if(locked)assert.deepEqual([g.y,g.opening,g.top,g.bottom],locked);
  }
  assert(locked);assert.equal(g.reveal,1);
  const clearance=g.opening-2*c.FLAP_LOGO_RADIUS;minClearance=Math.min(minClearance,clearance);
  assert(clearance>H*.074,'narrowest opening accommodates the steady flap vertical excursion');
  const spacing=c.flapInterval(ordinal)*c.flapPace(Math.max(0,ordinal-2))*W-c.flapGateWidth(g,s)-2*c.FLAP_LOGO_RADIUS;
  minSpace=Math.min(minSpace,spacing);assert(spacing>0,'adjacent nominal contact windows do not overlap');
  assert(Math.abs(g.y-g.anchor)<=H*.20+1e-7);c.FG.gates=[g];gates++;
 }
}
for(const n of [-1,0,9,10,19,20,24,25,49,50,74,75,99,100,100000]){const {c}=setup();assert.equal(c.flapLevel(n),Math.min(3,Math.floor(Math.max(0,n)/25)));assert(c.flapPace(n)<=c.FLAP_MAX_SPEED);}
{const {c}=setup();for(let score=1;score<=150;score++){assert(c.flapPace(score)>=c.flapPace(score-1));assert(c.flapInterval(score)<=c.flapInterval(score-1));}}
for(const boundary of [25,50,75]){
 const before=setup(375,667,boundary),after=setup(375,667,boundary);
 before.c.FG.score=boundary-1;before.c.flapSpawn(before.s);
 after.c.FG.score=boundary;after.c.flapSpawn(after.s);
 const oldGate=before.c.FG.gates[0],newGate=after.c.FG.gates[0];
 assert(newGate.finalOpening<oldGate.finalOpening,'each 25-clear section tightens the opening');
 assert(after.c.flapGateWidth(newGate,after.s)>before.c.flapGateWidth(oldGate,before.s),'each 25-clear section widens the obstacle');
 assert(after.c.flapPace(boundary)>before.c.flapPace(boundary-1),'each 25-clear section raises the pace');
}
// Follow the aperture with zero-time geometric samples. This verifies collision
// and scoring topology; it is not an automated player's physics reachability proof.
function placeGate(c,s,score){
 c.FG=c.flapNewState();c.FG.state='play';c.FG.score=score;c.FG.spawnT=100;c.flapSpawn(s);
 const g=c.FG.gates[0];Object.assign(g,{locked:true,reveal:1,y:360,baseY:360,target:360});
 g.opening=g.finalOpening;c.flapGateUpdate(g,s,0);return g;
}
function crossGate(c,s,g,bypass=0){
 const vx=s.w*.24,width=c.flapGateWidth(g,s),start=vx+c.FLAP_LOGO_RADIUS+1,end=vx-width-c.FLAP_LOGO_RADIUS-1;
 for(let x=start;x>end;x-=1){g.x=x;const a=c.flapAperture(g,s,(vx-x)/width);c.FG.y=bypass?bypass/s.h:(a.top+a.bottom)/2/s.h;c.FG.rot=0;c.flapStep(0,s);}
 g.x=end;c.flapStep(0,s);
}
let traversals=0;
for(const [w,h] of sizes)for(const score of [0,25,50,75,99]){
 const {c,s}=setup(w,h);const g=placeGate(c,s,score);crossGate(c,s,g);
 assert.equal(c.FG.score,score+1,'traversing an open channel awards exactly one');assert.equal(c.FG.state,score===99?'won':'play');
 c.flapStep(0,s);assert.equal(c.FG.score,score+1);traversals++;
 if(score){for(const bypass of [35,685]){const t=setup(w,h);const other=placeGate(t.c,t.s,score);crossGate(t.c,t.s,other,bypass);assert.equal(t.c.FG.state,'dying','missing a mandatory opening ends the run');assert.equal(t.c.FG.score,score,'bypass earns no score');assert(other.missed&&!other.counted);traversals++;}}
}
// Real play advances obstacle family and difficulty section at each completed
// 25-clear boundary. Scores 10 and 20 are preview-only style beats; the game's
// intentional within-section pace ramp remains continuous.
for(const score of [9,19]){
 const {c,s}=setup();const g=placeGate(c,s,score),kind=g.kind,level=g.level,pace=c.flapPace(score);
 crossGate(c,s,g);
 assert.equal(c.FG.score,score+1);assert.equal(g.kind,kind);assert.equal(g.level,level);
 assert.equal(c.flapLevel(c.FG.score),level);assert.equal(c.FG.noticeT,0,'active play must not announce a ten-clear preview beat');
 c.flapSpawn(s);const next=c.FG.gates.at(-1);assert.equal(next.kind,kind);assert.equal(next.level,level);
 assert(c.flapPace(c.FG.score)>=pace);traversals++;
}
for(const [score,beforeKind,afterKind] of [[24,'PILLAR','ARCH'],[49,'ARCH','SLANT'],[74,'SLANT','IRIS']]){
 const {c,s}=setup();const g=placeGate(c,s,score);
 assert.equal(g.kind,beforeKind);assert.equal(g.level,c.flapLevel(score));
 crossGate(c,s,g);
 assert.equal(c.FG.score,score+1);assert.equal(c.flapLevel(c.FG.score),g.level+1);
 assert.equal(c.FG.noticeT,3,'active play announces the completed 25-clear section');
 c.flapSpawn(s);const next=c.FG.gates.at(-1);
 assert.equal(next.kind,afterKind);assert.equal(next.level,g.level+1);traversals++;
}
// The mandatory-route rule triggers at the mouth, not during approach.
for(const score of [25,50,75])for(const y of [35,685]){
 const {c,s}=setup();const g=placeGate(c,s,score);c.FG.y=y/s.h;
 g.x=s.w*.24+.01;c.flapStep(0,s);
 assert.equal(c.FG.state,'play','outside approach is still recoverable');
 g.x=s.w*.24;c.flapStep(0,s);
 assert.equal(c.FG.state,'dying','outside mouth crossing ends flight immediately');
 assert.equal(c.FG.score,score);assert(!g.counted);traversals++;
}
// Skips do not grant higher tiers, while already spawned geometry is immutable.
{const {c,s}=setup();c.FG.score=24;c.flapSpawn(s);const first=c.FG.gates[0];c.flapSpawn(s);assert.equal(first.level,0);assert.equal(c.FG.gates[1].level,1);c.FG.gates.forEach(g=>g.missed=true);c.flapSpawn(s);assert.equal(c.FG.gates.at(-1).level,0);assert.equal(first.kind,'PILLAR');}
// Actual contact with an interior rail kills before any reward check.
for(const score of [0,25,50,75]){const {c,s}=setup();const g=placeGate(c,s,score);g.x=s.w*.24-c.flapGateWidth(g,s)/2;const a=c.flapAperture(g,s,.5);c.FG.y=(a.top-10)/s.h;c.flapStep(0,s);assert.equal(c.FG.state,'dying');assert.equal(c.FG.score,score);}
// Reward once at 100; explicit retry and canvas lockout preserve storage.
{const {c,s,storage,time}=setup();const g=placeGate(c,s,99);crossGate(c,s,g);assert.equal(storage.get('flapv_won'),'1');assert.equal(storage.get('flapv_best'),'100');c.flapStep(.61,s);time(1000);c.flapTap();assert.equal(c.FG.state,'play');assert.equal(c.FG.score,0);assert.equal(c.FG.gates[0].level,0);assert(c.fWon);c.flapDie(s);assert.equal(storage.get('flapv_best'),'100');c.FG.state='dead';c.FG.deadT=0;c.flapTap();assert.equal(c.FG.state,'dead');}
// Resize preserves normalized horizontal course progress and vertical geometry.
{const {c,elements}=setup();c.flapStart();c.FG.state='dead';elements.flapAction.events.click();assert.equal(c.FG.state,'play');const oldW=c.FS.w,before=c.FG.gates.map(g=>[g.x/oldW,g.y,g.target,g.opening,g.kind]);elements.flap.clientWidth=667;elements.flap.clientHeight=375;const s=c.flapSize();assert(c.fPaused);assert.equal(c.fAccumulator,0);c.FG.gates.forEach((g,i)=>{assert(Math.abs(g.x/s.w-before[i][0])<1e-12);assert.deepEqual([g.y,g.target,g.opening,g.kind],before[i].slice(1));});const y=c.FG.y;c.flapTap();assert(!c.fPaused);assert.equal(c.FG.y,y);}
{const {c,elements}=setup();for(const [score,tier] of [[0,'01 / THE VAULT'],[10,'01 / THE VAULT'],[20,'01 / THE VAULT'],[25,'02 / GOLD ARCHES'],[49,'02 / GOLD ARCHES'],[50,'03 / SLALOM'],[74,'03 / SLALOM'],[75,'04 / FINAL LOCK'],[100,'04 / FINAL LOCK']]){c.FG.score=score;c.flapPanels();assert(elements.flapScore.innerHTML.includes(String(score)));assert.equal(elements.flapTier.textContent,tier);}assert.equal(elements.flapProgress0.style['--fill'],1);assert.equal(elements.flapProgress3.style['--fill'],1);assert.equal(elements.flapProgress4,undefined,'active HUD keeps four 25-clear sections');for(const state of ['idle','play','dead','won']){c.FG.state=state;c.flapPanels();assert.equal(elements.flapPanel.hidden,state==='play');}}
const cadence=[];for(const hz of [30,60,90,120,144]){const {c,s}=setup();c.flapStart();for(let i=0;i<hz*.5;i++)c.flapAdvance(s,1/hz);cadence.push([c.FG.y,c.FG.vy,c.FG.gates[0].x,c.fSimTime,c.FG.rot]);}for(const row of cadence)row.forEach((v,i)=>assert(Math.abs(v-cadence[0][i])<1e-9));
{const {c,time}=setup();c.flapStart();const y=c.FG.y;time(500);c.flapTick();assert(c.fPaused);assert.equal(c.FG.y,y);c.fPaused=false;c.reduced=true;c.flapTap();assert.equal(c.FG.y,y);}
// Same seed preserves vertical routes and passage duration across full-screen
// aspect ratios; pixel density changes raster detail only.
let reference;for(const [w,h] of sizes)for(const dpr of [1,2,3]){const {c,s}=setup(w,h,19,dpr),course=[];for(let n=0;n<100;n++){c.flapSpawn(s);const g=c.FG.gates.at(-1);course.push([g.target,g.finalOpening,g.kind,g.tilt,c.flapGateWidth(g,s)/(c.flapPace(n)*s.w)]);}if(reference)course.forEach((row,i)=>row.forEach((v,j)=>typeof v==='number'?assert(Math.abs(v-reference[i][j])<1e-10):assert.equal(v,reference[i][j])));else reference=course;}
{const a=setup(375,667,77),b=setup(375,667,77);for(let n=0;n<100;n++){for(let j=0;j<n%13;j++)b.c.Math.random();a.c.flapSpawn(a.s);b.c.flapSpawn(b.s);}assert.equal(JSON.stringify(a.c.FG.gates),JSON.stringify(b.c.FG.gates));}
console.log(JSON.stringify({pass:true,seededCourses:100,uniqueSeeds:20,gates,sizes,traversals,minLockedWarningSeconds:minLead,minGapHitboxClearancePx:minClearance,minAdjacentHitboxSpacePx:minSpace,checks:['25-clear active-play topology boundaries','10/20 remain inside the first active section','finite passage clear and fatal bypass','collision before scoring','skips do not advance stage','settled warning','reward persistence','fullscreen responsive timing','resize pause','30–144Hz cadence','suspend/reduced motion'],limitation:'Aperture-following samples verify geometry/scoring, not human playability.'},null,2));
}
