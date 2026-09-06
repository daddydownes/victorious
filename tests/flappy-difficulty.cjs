// Actual production game functions, deterministic browser/storage stubs; no live progress is touched.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.slice(html.indexOf('  var COUPON_THRESHOLD=100;'),html.indexOf('\n  measure(); updateScroll();',html.indexOf('  var COUPON_THRESHOLD=100;')));
assert(source.includes('function flapGateUpdate'));
function setup(w=375,h=667,seed=1){
 const elements={},storage=new Map(),events={};let now=0;
 const math=Object.create(Math); math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const ctx={textAlign:'center'};
 const el=id=>elements[id]??=( {id,clientWidth:w,clientHeight:h,style:{},classList:{add(){},remove(){}},events:{},addEventListener(n,f){this.events[n]=f},focus(){c.document.activeElement=this},getClientRects(){return[{}]},getContext(){return ctx},tagName:id==='flap'?'CANVAS':'BUTTON'} );
 const c={Math:math,devicePixelRatio:1,reduced:false,motionQuery:{matches:false},performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{getElementById:el,querySelector:()=>null,body:el('body'),hidden:false,addEventListener(n,f){events[n]=f}},window:{scrollY:0,scrollTo(){}},addEventListener(n,f){events[n]=f},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setInterval:()=>1,clearInterval(){},refreshMotionPreference(){}};
 vm.createContext(c);vm.runInContext(source.replace(/\n  }\s*$/, '\n    flapDraw=function(){}; flapBurst=function(){};\n  }'),c);
 c.FG=c.flapNewState();c.flapOpen=true;
 return {c,s:c.flapSize(),storage,elements,events,time(t){now=t}};
}
const sizes=[[320,507],[375,667],[667,375],[1440,594],[390,844]];
let gates=0,minLead=Infinity,minClearance=Infinity,minSpace=Infinity;
for(const [w,h] of sizes)for(let seed=1;seed<=20;seed++){
 const {c,s}=setup(w,h,seed);
 for(let serial=0;serial<125;serial++){
  c.flapSpawn(s);const g=c.FG.gates.at(-1),level=Math.min(3,Math.floor(serial/25));
  assert.equal(g.serial,serial);assert.equal(g.level,level);assert.equal(g.widthScale,level===3?1.2:1);
  const previous=c.FG.gates.at(-2);assert(Math.abs(g.baseY-g.anchor)<=h*.16+1e-8);
  let locked=null;
  while(g.x>w*.24-c.flapGateWidth(g,s)-c.vh(s)){
   g.x-=c.FLAP_MAX_SPEED*w/120;c.flapGateUpdate(g,s,1/120);
   assert(g.top>=-1e-7&&g.bottom<=h+1e-7&&g.bottom>g.top);
   if(level===3)assert(g.opening>=c.gapH(s)*.74-1e-7&&g.opening<=c.gapH(s)*.90+1e-7);
   if(g.locked&&!locked){locked=[g.y,g.opening,g.top,g.bottom];const lead=(g.x-w*.24-c.vh(s)*.32)/(c.FLAP_MAX_SPEED*w);minLead=Math.min(minLead,lead);assert(lead>=.65-1/120-1e-7);}
   if(locked)assert.deepEqual([g.y,g.opening,g.top,g.bottom],locked);
  }
  assert(locked);assert.equal(g.reveal,1);
  const clearance=g.opening-2*c.vh(s)*.32;minClearance=Math.min(minClearance,clearance);
  // A repeated full flap has <.074H vertical excursion, even at the narrowest final opening.
  assert(clearance>h*.074,'final gap must fit a complete steady flap arc');
  const spacing=.96*c.flapPace(Math.max(0,serial-2))*w-c.flapGateWidth(g,s)-2*c.vh(s)*.32;
  minSpace=Math.min(minSpace,spacing);assert(spacing>0,'adjacent hitbox windows must not overlap');
  if(previous)assert(Math.abs(g.y-g.anchor)<=h*.20+1e-7);
  c.FG.gates=[g];gates++;
 }
}
for(const n of [-1,0,24,25,49,50,74,75,99,100,100000]){const {c}=setup();assert.equal(c.flapLevel(n),Math.min(3,Math.floor(Math.max(0,n)/25)));assert(c.flapPace(n)<=.72);}
// Place a locked gate at the hitbox: touching the edge is safe; crossing it dies.
for(const [w,h] of sizes)for(const edge of ['top','bottom'])for(const outside of [false,true]){
 const {c,s}=setup(w,h);c.FG.state='play';c.FG.spawnT=100;c.flapSpawn(s);const g=c.FG.gates[0];
 g.x=w*.24;g.locked=true;g.reveal=1;c.flapGateUpdate(g,s,0);
 const rr=c.vh(s)*.32;c.FG.y=(edge==='top'?g.top+rr:g.bottom-rr)/h;
 c.FG.y+=(outside?(edge==='top'?-1:1)*.001:0)/h;
 c.flapStep(0,s);assert.equal(c.FG.state,outside?'dying':'play',`${w} ${edge} ${outside}`);
}
// Reward is issued once at 100; restarting preserves best/reward but resets course and tiers.
{
 const {c,s,storage,time}=setup();c.FG.state='play';c.FG.score=99;c.FG.spawnT=100;c.flapSpawn(s);
 const g=c.FG.gates[0];g.x=s.w*.24-c.vh(s)*.4-c.flapGateWidth(g,s)-1;
 c.flapStep(0,s);assert.equal(c.FG.score,100);assert.equal(c.FG.state,'won');assert.equal(storage.get('flapv_won'),'1');assert.equal(storage.get('flapv_best'),'100');
 c.flapStep(.61,s);time(1000);c.flapTap();assert.equal(c.FG.state,'play');assert.equal(c.FG.score,0);assert.equal(c.FG.gates[0].level,0);assert.equal(c.FG.gateSerial,1);assert(c.fWon);
 c.flapDie(s);assert.equal(storage.get('flapv_best'),'100');
 c.FG.state='dead';c.FG.deadT=0;c.flapTap();assert.equal(c.FG.state,'dead');// canvas accidental-tap guard
}
// Explicit retry works immediately; portrait/landscape resize preserves geometry and pauses.
{
 const {c,elements}=setup();c.flapStart();c.FG.state='dead';c.FG.deadT=0;
 elements.flapAction.events.click();assert.equal(c.FG.state,'play');
 elements.flap.clientWidth=667;elements.flap.clientHeight=375;
 const s=c.flapSize();assert(c.fPaused);assert.equal(c.fAccumulator,0);
 for(const g of c.FG.gates){assert(g.top>=0&&g.bottom<=s.h);assert(g.opening>c.vh(s)*.64);}
 const y=c.FG.y;c.flapTap();assert(!c.fPaused);assert.equal(c.FG.y,y);
 c.FG.score=100;c.fWon=true;c.FG.spawnT=100;c.FG.gates=[];c.flapSpawn(s);
 const g=c.FG.gates[0];g.x=s.w*.24-c.vh(s)*.4-c.flapGateWidth(g,s)-1;
 c.flapStep(0,s);assert.equal(c.FG.state,'play');assert.equal(c.FG.score,101);
}
// Fixed simulation gives the same trajectory and gate position at 30/60/90/120/144Hz.
const cadence=[];
for(const hz of [30,60,90,120,144]){
 const {c,s}=setup();c.flapStart();for(let i=0;i<hz*.5;i++)c.flapAdvance(s,1/hz);
 cadence.push([c.FG.y,c.FG.vy,c.FG.gates[0].x,c.fSimTime]);
}
for(const row of cadence)row.forEach((v,i)=>assert(Math.abs(v-cadence[0][i])<1e-9));
// Long interruptions pause, and reduced motion ignores taps.
{
 const {c,time}=setup();c.flapStart();const y=c.FG.y;time(500);c.flapTick();assert(c.fPaused);assert.equal(c.FG.y,y);
 c.fPaused=false;c.reduced=true;c.flapTap();assert.equal(c.FG.y,y);
}
console.log(JSON.stringify({pass:true,seededCourses:100,gates,sizes,minLockedWarningSeconds:minLead,minGapHitboxClearancePx:minClearance,minAdjacentHitboxSpacePx:minSpace,checks:['25/50/75 course boundaries','cumulative tiers and bounded pace','settled geometry before contact','non-overlapping obstacles','gap fits steady flap arc','collision edges','reward/retry persistence','resize pauses with valid geometry','continued flight after prior reward','30–144Hz cadence','suspend/reduced motion']},null,2));
