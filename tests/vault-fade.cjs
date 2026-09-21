// Exercise cancellation and accessibility handoff using the shipped handler.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('  function enterVaultFromNext(immediate){'),end=html.indexOf('  function finishNextDropVaultHandoff(){',start);
assert(start>0&&end>start);const code=html.slice(start,end);
function fixture(reduced=false){
 const element=()=>({inert:false,style:{setProperty(k,v){this[k]=v}},setAttribute(){},removeAttribute(){}});
 const next=element(),vault=element(),dive=element(),jobs=[],calls={warm:0,finish:0,pan:0},classes=new Set();let time=0;
 const c={guidePhase:'nextDrop',entryGen:0,tapEntryFinish:null,reduced,next,vault,dive,stage:element(),seamGold:element(),vaultArming:false,surfacing:false,vaultActive:false,
  warmVaultImages(){calls.warm++},hideCue(){},setNextDropInert(e,v){e.inert=v},stopInertia(){},revealVaultTitle(){},activateNativePan(){calls.pan++},
  unlock(){},scrollTo(){},vaultY:()=>100,finishNextDropVaultHandoff(){calls.finish++},motionNow:()=>time,
  addMotionTask(step){const job={step,active:true};jobs.push(job);return job},cancelMotionTask(job){job.active=false},
  document:{hidden:false,getElementById:()=>next,documentElement:{classList:{add(){}}},body:{classList:{add(n){classes.add(n)}},appendChild(){throw Error('No moving logo allowed')}}}
 };
 vm.createContext(c);vm.runInContext(code,c);
 return{c,next,vault,dive,jobs,calls,tick(t){time=t;for(const j of [...jobs])if(j.active&&j.step(0,t)===false)j.active=false}};
}
{
 const f=fixture();f.c.enterVaultFromNext();f.c.enterVaultFromNext();assert.equal(f.calls.warm,1);assert.equal(f.jobs.length,1);assert(f.next.inert&&f.vault.inert);
 f.tick(360);assert.equal(f.next.style.opacity,'0.5000');assert.equal(f.vault.style.opacity,'0.5000');assert.equal(f.dive.style.transform,'scale(1)');assert.equal(f.calls.finish,0);
 f.tick(720);assert.equal(f.calls.finish,1);assert.equal(f.c.guidePhase,'vault');assert.equal(f.vault.inert,false);assert.equal(f.c.tapEntryFinish,null);f.tick(1200);assert.equal(f.calls.finish,1);
}
for(const mode of ['reduced','immediate','preference-change']){
 const f=fixture(mode==='reduced');f.c.enterVaultFromNext(mode==='immediate');if(mode==='preference-change'){f.tick(200);f.c.tapEntryFinish()}
 assert.equal(f.c.guidePhase,'vault');assert.equal(f.calls.finish,1);assert.equal(f.vault.inert,false);assert.equal(f.vault.style.opacity,'1');
}
{
 const f=fixture();f.c.enterVaultFromNext();f.tick(180);const opacity=f.vault.style.opacity;f.c.entryGen++;f.c.guidePhase='surfaced';f.tick(900);assert.equal(f.calls.finish,0);assert.equal(f.vault.style.opacity,opacity);assert.equal(f.c.guidePhase,'surfaced');
}
{
 const f=fixture();f.c.enterVaultFromNext();f.c.document.hidden=true;f.c.tapEntryFinish();assert.equal(f.calls.finish,0);f.c.document.hidden=false;f.tick(720);assert.equal(f.calls.finish,1);
}
console.log('PASS: one-shot opacity fade, inert/focus handoff, immediate/reduced/preference change, hidden completion guard, stale generation cancellation.');
