// Actual production game functions, deterministic browser/storage stubs; no live progress is touched.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const logoPath=html.match(/class="vmark"[^>]*>[\s\S]*?<path d="([^"]+)"/)[1];
const source=html.slice(html.indexOf('  var COUPON_THRESHOLD=100;'),html.indexOf('\n  measure(); updateScroll();',html.indexOf('  var COUPON_THRESHOLD=100;')));
assert(source.includes('function flapGateUpdate'));
function setup(w=375,h=667,seed=1,dpr=1){
 const elements={},storage=new Map(),events={};let now=0;
 const math=Object.create(Math); math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const ctx={textAlign:'center'};
 const el=id=>elements[id]??=( {id,clientWidth:w,clientHeight:h,style:{setProperty(k,v){this[k]=v}},classList:{add(){},remove(){}},events:{},addEventListener(n,f){this.events[n]=f},focus(){c.document.activeElement=this},getClientRects(){return[{}]},getContext(){return ctx},tagName:id==='flap'?'CANVAS':'BUTTON'} );
 const c={Path2D:class{constructor(d){this.d=d}},Math:math,devicePixelRatio:dpr,reduced:false,motionQuery:{matches:false},performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{getElementById:el,querySelector:selector=>selector==='.vmark path'?{getAttribute:()=>logoPath}:null,body:el('body'),hidden:false,addEventListener(n,f){events[n]=f}},window:{scrollY:0,scrollTo(){}},addEventListener(n,f){events[n]=f},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setInterval:()=>1,clearInterval(){},refreshMotionPreference(){}};
 vm.createContext(c);vm.runInContext(source.replace(/\n  }\s*$/, '\n    flapDraw=function(){}; flapBurst=function(){};\n  }'),c);
 c.FG=c.flapNewState();c.flapOpen=true;
 return {c,s:c.flapSize(),storage,elements,events,time(t){now=t}};
}
const sizes=[[320,507],[375,667],[667,375],[1440,594],[390,844]];
let gates=0,minLead=Infinity,minClearance=Infinity,minSpace=Infinity;
for(const [w,h] of sizes)for(let seed=1;seed<=20;seed++){
 const {c,s}=setup(w,h,seed);
 const W=s.w,H=s.h;assert.equal(W,420);assert.equal(H,720);assert.equal(c.vh(s),34);
 for(let serial=0;serial<125;serial++){
  c.flapSpawn(s);const g=c.FG.gates.at(-1),level=Math.min(3,Math.floor(serial/25));
  assert.equal(g.serial,serial);assert.equal(g.level,level);assert(c.flapGateWidth(g,s)>=50&&c.flapGateWidth(g,s)<=82);assert(g.finalOpening>=104);
  assert.equal(g.reveal,level?0:1);assert.equal(g.opening-g.finalOpening,level===3?26:0);if(level<2)assert.equal(g.baseY,g.target);
  const previous=c.FG.gates.at(-2);assert(Math.abs(g.baseY-g.anchor)<=H*.22+1e-8);
  let locked=null;
  while(g.x>W*.24-c.flapGateWidth(g,s)-c.vh(s)){
   g.x-=c.FLAP_MAX_SPEED*W/120;c.flapGateUpdate(g,s,1/120);
   assert(g.top>=-1e-7&&g.bottom<=H+1e-7&&g.bottom>g.top);
   if(level===3)assert(g.opening>=104-1e-7&&g.opening<=142+1e-7);
   if(g.locked&&!locked){locked=[g.y,g.opening,g.top,g.bottom];const lead=(g.x-W*.24-c.FLAP_LOGO_RADIUS)/(c.FLAP_MAX_SPEED*W);minLead=Math.min(minLead,lead);assert(lead>=.69-1e-7);}
   if(locked)assert.deepEqual([g.y,g.opening,g.top,g.bottom],locked);
  }
  assert(locked);assert.equal(g.reveal,1);
  const clearance=g.opening-2*c.FLAP_LOGO_RADIUS;minClearance=Math.min(minClearance,clearance);
  // A repeated full flap has <.074H vertical excursion, even at the narrowest final opening.
  assert(clearance>H*.074,'final gap must fit a complete steady flap arc');
  const spacing=c.flapInterval(serial)*c.flapPace(Math.max(0,serial-2))*W-c.flapGateWidth(g,s)-2*c.FLAP_LOGO_RADIUS;
  minSpace=Math.min(minSpace,spacing);assert(spacing>0,'adjacent hitbox windows must not overlap');
  if(previous)assert(Math.abs(g.y-g.anchor)<=H*.20+1e-7);
  c.FG.gates=[g];gates++;
 }
}
for(const n of [-1,0,24,25,49,50,74,75,99,100,100000]){const {c}=setup();assert.equal(c.flapLevel(n),Math.min(3,Math.floor(Math.max(0,n)/25)));assert(c.flapPace(n)<=260/420);}
{const {c}=setup();for(let score=1;score<=150;score++){assert(c.flapPace(score)>=c.flapPace(score-1));assert(c.flapInterval(score)<=c.flapInterval(score-1));}}
// Broad flat poles touch the actual rotated silhouette. Tangency is a hit;
// a .02 logical-pixel separation is safe. The independent collision suite also
// checks beveled corners, the V's open centre, and star contacts.
for(const [w,h] of sizes)for(const rot of [-.35,0,.3,.96])for(const edge of ['top','bottom'])for(const touching of [false,true]){
 const {c,s}=setup(w,h);c.FG.state='play';c.FG.spawnT=100;c.FG.rot=rot;c.FG.y=.5;
 const bounds=c.flapLogoContours(c.FG.y,rot,s),boundary=edge==='top'?bounds.top:bounds.bottom;
 const g={x:50,widthScale:3,top:edge==='top'?boundary:0,bottom:edge==='bottom'?boundary:720};
 if(!touching){if(edge==='top')g.top-=.02;else g.bottom+=.02;}
 assert.equal(c.flapCollision(g,s),touching,`${w} ${rot} ${edge} ${touching}`);
}
// A clear is recorded only after the pole's trailing face passes the current
// silhouette's leftmost point, including the rotation and separate star.
for(const rot of [-.35,0,.3,.96]){
 const {c,s}=setup();c.flapStart();c.FG.rot=rot;c.FG.y=.5;c.FG.spawnT=100;
 const g=c.FG.gates[0],left=c.flapLogoContours(.5,rot,s).left;
 Object.assign(g,{locked:true,reveal:1,y:360,opening:400,target:360,finalOpening:400});
 g.x=left-c.flapGateWidth(g,s);c.flapStep(0,s);assert.equal(c.FG.score,0,'trailing-face tangency must not score');
 g.x-=.001;c.flapStep(0,s);assert.equal(c.FG.score,1,'fully cleared silhouette scores');
}
// Reward is issued once at 100; restarting preserves best/reward but resets course and tiers.
{
 const {c,s,storage,time}=setup();c.FG.state='play';c.FG.score=99;c.FG.spawnT=100;c.flapSpawn(s);
 const g=c.FG.gates[0];g.x=s.w*.24-c.FLAP_LOGO_RADIUS-c.flapGateWidth(g,s)-1;
 c.flapStep(0,s);assert.equal(c.FG.score,100);assert.equal(c.FG.state,'won');assert.equal(storage.get('flapv_won'),'1');assert.equal(storage.get('flapv_best'),'100');
 c.flapStep(.61,s);time(1000);c.flapTap();assert.equal(c.FG.state,'play');assert.equal(c.FG.score,0);assert.equal(c.FG.gates[0].level,0);assert.equal(c.FG.gateSerial,1);assert(c.fWon);
 c.flapDie(s);assert.equal(storage.get('flapv_best'),'100');
 c.FG.state='dead';c.FG.deadT=0;c.flapTap();assert.equal(c.FG.state,'dead');// canvas accidental-tap guard
}
// Explicit retry works immediately; portrait/landscape resize preserves geometry and pauses.
{
 const {c,elements}=setup();c.flapStart();c.FG.state='dead';c.FG.deadT=0;
 elements.flapAction.events.click();assert.equal(c.FG.state,'play');
 const before=JSON.stringify([c.FG.y,c.FG.vy,c.FG.gates]);
 elements.flap.clientWidth=667;elements.flap.clientHeight=375;
 const s=c.flapSize();assert(c.fPaused);assert.equal(c.fAccumulator,0);assert.equal(JSON.stringify([c.FG.y,c.FG.vy,c.FG.gates]),before);
 for(const g of c.FG.gates){assert(g.top>=0&&g.bottom<=s.h);assert(g.opening>2*c.FLAP_LOGO_RADIUS);}
 const y=c.FG.y;c.flapTap();assert(!c.fPaused);assert.equal(c.FG.y,y);
 c.FG.score=100;c.fWon=true;c.FG.spawnT=100;c.FG.gates=[];c.flapSpawn(s);
 const g=c.FG.gates[0];g.x=s.w*.24-c.FLAP_LOGO_RADIUS-c.flapGateWidth(g,s)-1;
 c.flapStep(0,s);assert.equal(c.FG.state,'play');assert.equal(c.FG.score,101);
}
// Panels update their progress and show state-specific controls without errors.
{const {c,elements}=setup();for(const score of [0,25,50,75,100]){c.FG.score=score;c.flapPanels();assert(elements.flapScore.innerHTML.includes(String(score)));}for(const state of ['idle','play','dead','won']){c.FG.state=state;c.flapPanels();assert.equal(elements.flapPanel.hidden,state==='play');}}
// Fixed simulation gives the same trajectory and gate position at 30/60/90/120/144Hz.
const cadence=[];
for(const hz of [30,60,90,120,144]){
 const {c,s}=setup();c.flapStart();for(let i=0;i<hz*.5;i++)c.flapAdvance(s,1/hz);
 cadence.push([c.FG.y,c.FG.vy,c.FG.gates[0].x,c.fSimTime,c.FG.rot]);
}
for(const row of cadence)row.forEach((v,i)=>assert(Math.abs(v-cadence[0][i])<1e-9));
// Long interruptions pause, and reduced motion ignores taps.
{
 const {c,time}=setup();c.flapStart();const y=c.FG.y;time(500);c.flapTick();assert(c.fPaused);assert.equal(c.FG.y,y);
 c.fPaused=false;c.reduced=true;c.flapTap();assert.equal(c.FG.y,y);
}
// Course and physical geometry are invariant across CSS sizes and pixel densities.
let courseReference;for(const [w,h] of sizes)for(const dpr of [1,2,3]){const {c,s}=setup(w,h,19,dpr);for(let n=0;n<100;n++){c.flapSpawn(s);c.flapGateUpdate(c.FG.gates.at(-1),s,0);}const course=JSON.stringify(c.FG.gates);if(courseReference)assert.equal(course,courseReference);else courseReference=course;}
// Cosmetic random draws cannot steer a run already created.
{const a=setup(375,667,77),b=setup(375,667,77);for(let n=0;n<100;n++){for(let j=0;j<n%13;j++)b.c.Math.random();a.c.flapSpawn(a.s);b.c.flapSpawn(b.s);}assert.equal(JSON.stringify(a.c.FG.gates),JSON.stringify(b.c.FG.gates));}
console.log(JSON.stringify({pass:true,seededCourses:100,uniqueSeeds:20,gates,sizes,minLockedWarningSeconds:minLead,minGapHitboxClearancePx:minClearance,minAdjacentHitboxSpacePx:minSpace,checks:['25/50/75 course boundaries','cumulative tiers and monotonically harder pace/spacing','cosmetic RNG does not change course','settled geometry before contact','non-overlapping obstacles','gap fits steady flap arc','rotated V/star tangency and separation','no premature score before silhouette clears','reward/retry persistence','CSS size and DPR preserve identical logical course','resize pauses without changing geometry','continued flight after prior reward','30–144Hz cadence','suspend/reduced motion']},null,2));
