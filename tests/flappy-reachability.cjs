// Bounded search supplies executable witness flights; failure would be inconclusive.
// The course uses the production spawn/update/score schedule at 120 Hz. Search taps
// at 60 Hz using a circumscribed radius valid at every rotation, then replays
// against the actual rotating V/star silhouette, finite hazard polygons and traversal scoring.
// Radius constraints may reject valid flights, but cannot certify a colliding one.
const assert=require('assert');
const {setup}=require('./flappy-difficulty.cjs');
const dt=1/120;
function witness(w,h,seed){
 const cssW=w,cssH=h;
 // Inject only into the geometry-planning world; replay uses untouched handlers.
 const ghost='flapDie=function(){}; flapTraversal=function(g,s){if(!g.counted&&g.x+flapGateWidth(g,s)<s.w*.24-FLAP_LOGO_RADIUS){g.entered=true;g.checkpassed=true;g.counted=true;return true;}return false;};';
 const {c,s}=setup(cssW,cssH,seed,1,ghost);w=s.w;h=s.h;c.fWon=true;c.flapStart();
 const frames=[];let nearest=.45,minHitboxSpace=Infinity;
 while(c.FG.score<100 && frames.length<18000){
  c.flapStep(dt,s);
  const rr=c.FLAP_LOGO_RADIUS+3, vx=w*.24;
  for(let i=1;i<c.FG.gates.length;i++){const before=c.FG.gates[i-1],after=c.FG.gates[i];const space=after.x-before.x-c.flapGateWidth(before,s)-2*rr;minHitboxSpace=Math.min(minHitboxSpace,space);assert(space>0,'actual adjacent hitbox windows overlap');}
  let lo=rr/h,hi=1-rr/h;
  for(const g of c.FG.gates)if(vx+rr>g.x && vx-rr<g.x+c.flapGateWidth(g,s)){
   const gw=c.flapGateWidth(g,s),left=Math.max(0,(vx-rr-g.x)/gw),right=Math.min(1,(vx+rr-g.x)/gw);
   const knots=c.flapHazardPolygons(g,s)[0].map(point=>(point[0]-g.x)/gw).filter(u=>u>left&&u<right);
   for(const u of [left,right,...knots]){
    const edge=c.flapAperture(g,s,u);lo=Math.max(lo,(edge.top+rr)/h);hi=Math.min(hi,(edge.bottom-rr)/h);
   }
  }
  const next=c.FG.gates.find(g=>g.x+c.flapGateWidth(g,s)>vx-rr);
  nearest=next?next.y/h:nearest;
  frames.push({lo,hi,target:nearest});
 }
 assert.equal(c.FG.score,100);
 let states=[{y:.45,v:-.62,id:0}],parents=[-1],actions=[0],peak=0;
 for(let frame=0;frame<frames.length;frame+=2){
  const candidates=new Map();
  for(const prev of states)for(let tap=0;tap<=1;tap++){
   let y=prev.y,v=tap?-.62:prev.v,valid=true;
   for(let sub=0;sub<2&&frame+sub<frames.length;sub++){
    v=Math.min(.70,v+2.60*dt);y+=v*dt;
    // Conservative radius excludes the ceiling/floor before any clamp is needed.
    const f=frames[frame+sub];if(y<f.lo-1e-12||y>f.hi+1e-12){valid=false;break;}
   }
   if(!valid)continue;
   const key=Math.round(y*800)+','+Math.round(v*120/2.6);
   const cost=Math.abs(y-frames[Math.min(frame+18,frames.length-1)].target)+Math.abs(v)*.035;
   const old=candidates.get(key);
   if(!old||cost<old.cost)candidates.set(key,{y,v,parent:prev.id,tap,cost});
  }
  states=[...candidates.values()].sort((a,b)=>a.cost-b.cost).slice(0,500);
  if(!states.length)return {w,h,seed,found:false,frame,scoreAtEnd:c.FG.score};
  for(const st of states){st.id=parents.length;parents.push(st.parent);actions.push(st.tap);}
  peak=Math.max(peak,states.length);
 }
 const taps=[];let id=states[0].id;while(id){taps.push(actions[id]);id=parents[id];}taps.reverse();
 const replay=setup(cssW,cssH,seed);replay.c.fWon=true;replay.c.flapStart();
 let steps=0,tapCount=0;const cleared=new Set(),kindClears={PILLAR:0,ARCH:0,SLANT:0,IRIS:0};
 for(const tap of taps){if(tap){replay.c.FG.vy=-.62;tapCount++;}for(let sub=0;sub<2&&steps<frames.length;sub++,steps++){replay.c.flapStep(dt,replay.s);for(const g of replay.c.FG.gates){assert(!g.missed,'witness must pass every aperture rather than bypass');if(g.counted&&!cleared.has(g.serial)){cleared.add(g.serial);kindClears[g.kind]++;assert(g.entered&&g.checkpassed,'real traversal flags required');}}}assert.equal(replay.c.FG.state,'play','witness must survive real collision code');}
 assert.equal(replay.c.FG.score,100);assert.deepEqual(kindClears,{PILLAR:25,ARCH:25,SLANT:25,IRIS:25});
 // Perturb the successful script, without repairing it using future knowledge.
 // These are sensitivity probes, not human players or estimated human win rates.
 const imperfect=[];
 for(const mode of ['one-frame-delay','50ms-delay','miss-every-25th']){
  const probe=setup(cssW,cssH,seed);probe.c.fWon=true;probe.c.flapStart();let count=0;
  const delayed=new Set();taps.forEach((tap,i)=>{if(tap){count++;if(mode==='miss-every-25th'&&count%25===0)return;delayed.add(i*2+(mode==='one-frame-delay'?2:mode==='50ms-delay'?6:0));}});
  for(let step=0;step<frames.length&&probe.c.FG.state==='play';step++){if(delayed.has(step))probe.c.FG.vy=-.62;probe.c.flapStep(dt,probe.s);}
  imperfect.push({mode,score:probe.c.FG.score,state:probe.c.FG.state});
 }
 return {w,h,seed,found:true,score:100,kindClears,minActualHitboxSpacePx:minHitboxSpace,imperfect,seconds:Number((frames.length/120).toFixed(2)),tapCount,peakSearchStates:peak};
}
const results=[];
for(const size of [[375,667],[1440,900],[667,375]])for(let seed=1;seed<=4;seed++){
 const result=witness(...size,seed);results.push(result);console.log(JSON.stringify(result));
}
assert(results.every(r=>r.found),'Bounded search did not find all witnesses; investigate, not proof of impossibility.');
const sensitivity=['one-frame-delay','50ms-delay','miss-every-25th'].map(mode=>{const scores=results.map(r=>r.imperfect.find(p=>p.mode===mode).score).sort((a,b)=>a-b);return {mode,min:scores[0],median:scores[Math.floor(scores.length/2)],max:scores.at(-1)};});
console.log(JSON.stringify({pass:true,sensitivity,courses:results.length,clears:results.length*100,limits:'Seeded executable physics witnesses, not human difficulty, exhaustive reachability, rendering or physical-device testing.'}));
