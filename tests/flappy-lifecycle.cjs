// Extract actual game functions using the deterministic sibling harness.
// No browser automation, real storage, rendering or live reward changes.
const assert=require('assert');
const {setup}=require('./flappy-difficulty.cjs');
let cases=0;
function snapshot(c){return JSON.stringify({y:c.FG.y,vy:c.FG.vy,score:c.FG.score,gates:c.FG.gates,sim:c.fSimTime});}
for(const tier of [0,1,2,3])for(const mode of ['button','hidden','blur','stall']){
 const {c,s,events,time}=setup();c.flapStart();c.FG.gateSerial=tier*25;c.FG.score=tier*25;c.FG.gates=[];c.flapSpawn(s);c.flapGateUpdate(c.FG.gates[0],s,0);
 const before=snapshot(c);
 if(mode==='button')c.flapPauseFn();
 if(mode==='hidden'){c.document.hidden=true;events.visibilitychange();}
 if(mode==='blur')events.blur();
 if(mode==='stall'){time(201);c.flapTick();}
 assert(c.fPaused,mode);time(5000);c.flapTick();assert.equal(snapshot(c),before,'pause must freeze the course');
 c.document.hidden=false;events.visibilitychange();assert(c.fPaused,'foreground must not auto-resume');
 c.flapTap();assert(!c.fPaused);assert.equal(snapshot(c),before,'resume must not also flap');cases++;
}
for(const tier of [0,1,2,3])for(const locked of [false,true]){
 const {c,s,elements}=setup();c.flapStart();c.FG.gateSerial=tier*25;c.FG.score=tier*25;c.FG.gates=[];c.flapSpawn(s);const g=c.FG.gates[0];
 g.x=locked?100:330;c.flapGateUpdate(g,s,0);
 for(const [w,h] of [[667,375],[320,507],[1440,594],[390,844]]){
  elements.flap.clientWidth=w;elements.flap.clientHeight=h;const size=c.flapSize();
  assert(c.fPaused);assert.equal(c.fAccumulator,0);assert(g.top>=0&&g.bottom<=size.h&&g.top<g.bottom);
  const geometry=[g.y,g.opening,g.top,g.bottom];if(g.locked){c.flapGateUpdate(g,size,1/120);assert.deepEqual([g.y,g.opening,g.top,g.bottom],geometry);}
  c.flapTap();assert(!c.fPaused);cases++;
 }
}
// Repeated open/start/close must keep one scheduler each, release both, restore focus.
{
 const {c,elements}=setup();let next=1;const raf=new Set(),iv=new Set();c.flapOpen=false;
 c.requestAnimationFrame=()=>{const id=next++;raf.add(id);return id;};c.cancelAnimationFrame=id=>raf.delete(id);
 c.setInterval=()=>{const id=next++;iv.add(id);return id;};c.clearInterval=id=>iv.delete(id);
 for(let i=0;i<40;i++){
  c.flapOpenFn();c.flapOpenFn();c.startFlapLoop();assert.equal(raf.size,1);assert.equal(iv.size,1);
  c.flapStart();c.flapCloseFn();c.flapCloseFn();assert.equal(raf.size,0);assert.equal(iv.size,0);assert.equal(c.document.activeElement,elements.flapPlay);cases++;
 }
 c.reduced=true;c.flapOpenFn();assert.equal(raf.size,0);assert.equal(iv.size,0);c.flapCloseFn();
}
// A bounded 20-second synthetic run in each tier checks pruning and frame-ring limits.
// Invulnerability isolates allocation/lifecycle rather than claiming a human-valid flight.
for(const tier of [0,1,2,3]){
 const {c,s}=setup(375,667,1,1,'flapDie=function(){};');c.flapStart();c.fWon=true;c.FG.score=tier*25;c.FG.gateSerial=tier*25;
 let maxGates=0;
 for(let i=0;i<2400;i++){
  c.flapStep(1/120,s);maxGates=Math.max(maxGates,c.FG.gates.length);assert(c.fFrames.length<=8);assert(c.fFrameCount<=8);
  for(const f of c.fFrames)assert(f.gates.length<=6);
 }
 assert(maxGates<=6);cases++;
}
// Non-primary/repeated input is ignored; one primary input causes exactly one impulse.
{
 const {c,elements,events}=setup();c.flapStart();c.document.activeElement=elements.flap;c.FG.vy=.3;
 const pointer={button:0,isPrimary:false,preventDefault(){}};elements.flap.events.pointerdown(pointer);assert.equal(c.FG.vy,.3);
 events.keydown({key:' ',repeat:true,preventDefault(){},stopPropagation(){}});assert.equal(c.FG.vy,.3);
 pointer.isPrimary=true;elements.flap.events.pointerdown(pointer);assert.equal(c.FG.vy,-.62);cases++;
}
// Real silhouette remains alive through input, a live gate, resize and resume.
// This exercises a narrow final gap rather than an empty-arena input assignment.
for(const tier of [0,1,2,3])for(const input of ['pointer','keyboard']){
 const {c,s,elements,events}=setup();c.flapStart();c.FG.gateSerial=tier*25;c.FG.score=tier*25;c.FG.gates=[];c.flapSpawn(s);
 const gate=c.FG.gates[0];Object.assign(gate,{x:s.w*.24,locked:true,reveal:1,y:s.h*.5,target:s.h*.5,opening:104,finalOpening:104});
 c.FG.y=.5;c.FG.rot=0;c.FG.vy=.3;c.FG.spawnT=100;c.document.activeElement=elements.flap;
 if(input==='pointer')elements.flap.events.pointerdown({button:0,isPrimary:true,preventDefault(){}});
 else events.keydown({key:' ',repeat:false,preventDefault(){},stopPropagation(){}});
 assert.equal(c.FG.vy,-.62);c.flapAdvance(s,1/60);assert.equal(c.FG.state,'play');
 const physical=()=>JSON.stringify({...c.FG,gates:c.FG.gates.map(g=>({...g,x:Number((g.x/c.FS.w).toFixed(10))}))}),before=physical();elements.flap.clientWidth=667;elements.flap.clientHeight=375;const size=c.flapSize();
 assert(c.fPaused);assert.equal(physical(),before);c.flapTap();assert(!c.fPaused);assert.equal(physical(),before);
 c.flapAdvance(size,1/60);assert.equal(c.FG.state,'play');cases++;
}
// Explicit reward action is immediately usable while canvas retains its tap lockout.
// A size change discovered INSIDE input must pause before applying an impulse.
// Calling flapSize first would hide this ordering regression.
for(const tier of [0,1,2,3]){
 const {c,s,elements}=setup();c.flapStart();c.FG.score=tier*25;c.FG.gates=[];c.flapSpawn(s);c.FG.vy=.3;
 const before={y:c.FG.y,vy:c.FG.vy,score:c.FG.score};
 elements.flap.clientWidth=667;elements.flap.clientHeight=375;c.flapTap();
 assert(c.fPaused,'input-discovered resize pauses');
 assert.deepEqual({y:c.FG.y,vy:c.FG.vy,score:c.FG.score},before,'resize input must not secretly flap or advance');
 assert.equal(c.fAccumulator,0);c.flapTap();assert(!c.fPaused);
 assert.deepEqual({y:c.FG.y,vy:c.FG.vy,score:c.FG.score},before,'explicit resume preserves prior impulse');cases++;
}
{
 const {c,s,elements,storage}=setup();c.flapStart();c.FG.score=100;c.flapWin(s);assert.equal(c.FG.deadT,0);
 c.flapTap();assert.equal(c.FG.state,'won');elements.flapAction.events.click();assert.equal(c.FG.state,'play');assert.equal(c.FG.score,0);assert.equal(storage.get('flapv_won'),'1');assert.equal(storage.get('flapv_best'),'100');cases++;
}
console.log(JSON.stringify({pass:true,cases,checks:['pause/foreground/resume at all tiers','eight resize gate states across four sizes','40 scheduler/focus cycles','reduced-motion open without scheduler','bounded frame and gate storage','primary and repeated input','eight live narrow-gap input/resize/resume survival cases','four input-discovered resize pauses preserve impulse'],limits:'Extracted handlers and stubbed drawing; not browser performance or physical-device testing.'},null,2));
