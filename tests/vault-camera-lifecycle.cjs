// Run the real camera and measurement functions without media/network work.
// These checks cover lifecycle and position continuity; they do not measure a
// physical iPhone's compositor frame rate.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.VAULT_SOURCE||path.join(__dirname,'../index.html'),'utf8');
const guide=fs.readFileSync(path.join(__dirname,'../tools/guided/journey.js'),'utf8');
const only=process.env.QA_CASE||'all';
assert(['all','camera','toolbar','guide','native'].includes(only),'Unknown QA_CASE');
function actualFunction(source,name,indent='  '){
 const first=source.indexOf(indent+'function '+name+'(');
 assert(first>=0,'Missing source function '+name);
 const firstLineEnd=source.indexOf('\n',first),firstLine=source.slice(first,firstLineEnd);
 if(/}\s*$/.test(firstLine))return firstLine;
 const last=source.indexOf('\n'+indent+'}',first);
 assert(last>first,'Missing source function end '+name);
 return source.slice(first,last+indent.length+2);
}
function classes(){const values=new Set();return {contains:key=>values.has(key),add(...keys){keys.forEach(key=>values.add(key))},remove(...keys){keys.forEach(key=>values.delete(key))},toggle(key,on){if(on)values.add(key);else values.delete(key);return on}}}
function style(){
 const data={},key=name=>name.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
 data.setProperty=(name,value)=>{data[key(name)]=value};
 data.removeProperty=name=>{delete data[key(name)]};
 data.getPropertyValue=name=>data[key(name)]||'';
 return data;
}
function node(){return {style:style(),classList:classes(),attrs:{},inert:false,setAttribute(name,value){this.attrs[name]=value},removeAttribute(name){delete this.attrs[name]},getAttribute(name){return this.attrs[name]},focus(){}}}
function root(){
 let now=1000,id=0;const timers=new Map(),calls={warm:0,overview:0,flush:0,measure:0};
 const vault=node(),dive=node(),plane=node(),next=node(),space=node(),stage=node(),seamGold=node();
 const c={Math,isFinite,Date:{now:()=>now},window:{},vault,dive,plane,vaultPanSpace:space,stage,seamGold,
  vaultCameraActive:false,vaultCameraZoom:1,vaultCameraHeight:0,vaultCameraMeasurePending:false,vaultActive:false,vaultCameraSettleUntil:0,
  vw:390,vh:844,innerHeight:844,PW:4100,PH:4200,S:.45,baseScale:.45,userZoom:1,
  px:(390-3781*.45)/2,py:(844-3557*.45)/2,rawX:0,rawY:0,
  nativeVaultEligible:true,nativePanActive:false,nativePanScrolling:false,nativePanPointerDown:false,nativePanInputArmed:false,
  nativePanUserMoved:false,nativeTravel:0,nativeScrollEpoch:0,nativePadX:0,nativePadY:0,nativeFracX:0,nativeFracY:0,
  nativeExpectedX:null,nativeExpectedY:null,motionPanPending:false,dragging:false,dragId:null,samples:[],followHot:false,
  reduced:false,needCenter:false,logoShown:false,descent:{offsetTop:2500},seamTrack:{getBoundingClientRect:()=>({top:844,height:2000})},seamWords:[{}],scrollY:0,
  guidePhase:'film',entryGen:0,vaultArming:false,surfacing:false,vaultRevealed:false,
  document:{documentElement:{clientWidth:390,scrollHeight:4500,classList:classes()},body:{classList:classes()},getElementById:name=>name==='nextDrop'?next:null,querySelectorAll:()=>[]},
  setHot(){},setNextDropInert(element,value){element.inert=value},warmVaultOverview(){calls.overview++},warmVaultImages(){calls.warm++},flushVaultImageUpgrades(){calls.flush++},queueMeasure(){calls.measure++},
  stopInertia(){},hideCue(){},vaultY:()=>731,unlock(){},revealVaultTitle(){c.vaultRevealed=true},
  finishNextDropVaultHandoff(){c.document.body.classList.add('next-vault-open')},scrollTo(){},
  setTimeout(fn,delay){timers.set(++id,{fn,at:now+delay});return id},clearTimeout(key){timers.delete(key)}};
 vm.createContext(c);
 for(const name of ['calcScale','clampAxis','clampPan','sizeNativeSpace','applyPan','activateNativePan','measure','prepareVaultCamera','paintVaultCamera','cancelVaultCamera','commitVaultCamera'])vm.runInContext(actualFunction(html,name),c);
 const api=html.match(/^  window\.__vaultCamera=([^\n]+);$/m);assert(api,'Missing public camera API');
 vm.runInContext('window.__vaultCamera='+api[1],c);
 function advance(ms){const end=now+ms;let count=0;while(true){const job=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!job)break;assert(++count<20,'Timer loop');now=job[1].at;timers.delete(job[0]);job[1].fn()}now=end}
 return {c,calls,advance,next};
}
if(['all','camera','toolbar'].includes(only)){
const prepared=root(),c=prepared.c;
if(only!=='toolbar')assert.equal(typeof c.window.__vaultCamera.prepare,'function','Guide must be able to prepare the camera before first reveal');
c.prepareVaultCamera();
assert(c.vaultCameraActive);assert(c.vault.inert);assert.equal(c.vault.style.visibility,'visible');assert.equal(c.vault.style.pointerEvents,'none');
assert.equal(c.dive.style.willChange,'transform');assert.equal(prepared.calls.overview,1);
for(let i=0;i<12;i++){c.prepareVaultCamera();c.paintVaultCamera(0,844);c.paintVaultCamera(0,844-((i%2)?1:-1))}
assert.equal(prepared.calls.overview,1,'Repeated preparation/approach painting must not rebuild the camera');
assert.equal(prepared.calls.flush,0,'Covered approach/reversal must not release queued photo upgrades');
c.paintVaultCamera(.4,0);const before=c.dive.style.transform,oldX=c.px,oldY=c.py;
c.innerHeight=780;c.measure();
assert.equal(c.vh,780,'Root records actual toolbar layout height');
assert.equal(c.px,oldX,'Same-width toolbar change retains authored camera horizontal focus');
assert.equal(c.py,oldY,'Same-width toolbar change retains authored camera vertical focus');
c.paintVaultCamera(.4,0);
assert.equal(c.dive.style.transform,before,'Toolbar height change cannot move a stationary preview frame');
c.document.documentElement.clientWidth=430;c.measure();c.paintVaultCamera(.4,0);
assert.equal(c.vw,430,'Actual width changes still remeasure');
assert.notEqual(c.dive.style.transform,before,'Actual width changes update the camera geometry');
c.paintVaultCamera(1,0);assert.equal(c.dive.style.transform,'scale(1)','Last preview frame is exact native identity');
c.cancelVaultCamera();assert(!c.vaultCameraActive);assert.equal(c.vault.style.visibility,'hidden');assert.equal(prepared.calls.flush,1);
assert.equal(prepared.calls.measure,1,'Leaving a resized preview resumes its deferred full measurement');
c.cancelVaultCamera();assert.equal(prepared.calls.flush,1,'Cancellation retires one preparation once');
console.log('PASS real camera preparation is idempotent; covered reversals retain preparation; toolbar-only measurement preserves preview focus; real width changes remain measured');
}

// Execute the actual guide renderer against the actual root camera. Small
// reversals on either side of the first visible edge must not retire/reprepare
// the scene or resume queued image upgrades.
if(['all','guide'].includes(only)){
const approach=root(),g=approach.c,panel=node(),signup=node(),invitation=node(),scene=node();
panel.clientHeight=844;panel.scrollTop=0;panel.getBoundingClientRect=()=>({top:0});
signup.getBoundingClientRect=()=>({top:844-panel.scrollTop});
invitation.getBoundingClientRect=()=>({top:1688-panel.scrollTop});invitation.offsetHeight=1688;
Object.assign(g,{panel,signup,invitation,scene,innerWidth:390,innerHeight:844});
const declarationStart=guide.indexOf('let frame=0,move='),declarationEnd=guide.indexOf('function invalidateGeometry()',declarationStart);
assert(declarationStart>0&&declarationEnd>declarationStart);
vm.runInContext(guide.slice(declarationStart,declarationEnd),g);
for(const name of ['invalidateGeometry','readGeometry','stops','currentPosition','render'])vm.runInContext(actualFunction(guide,name,''),g);
g.render(500);assert(g.vaultCameraActive,'Approach prepares the Vault while signup still covers it');
assert(approach.calls.overview>=1,'Early guide preparation requests the overview');
const preparedCount=approach.calls.overview;
for(const top of [843,844,845,844,843,845,843,844,846,842,844,845]){panel.scrollTop=top;g.render(top)}
assert(g.vaultCameraActive,'Oscillating across the reveal boundary retains the prepared camera');
assert.equal(approach.calls.overview,preparedCount,'Reveal-edge reversals cannot repeat root preparation');
assert.equal(approach.calls.flush,0,'Reveal-edge reversals cannot restart photo upgrades');
panel.inert=true;g.render(845);assert(!g.vaultCameraActive,'Leaving the active chapter retires the covered preview');
console.log('PASS actual guide prepares behind signup; repeated reveal-edge reversals retain one preparation; inactive chapter retires it');
}

if(['all','native'].includes(only)){
const handoff=root();handoff.c.prepareVaultCamera();handoff.c.paintVaultCamera(.8,0);handoff.c.commitVaultCamera();
assert.equal(handoff.c.guidePhase,'vault');assert(handoff.c.nativePanActive);assert(handoff.c.vaultActive);assert.equal(handoff.c.dive.style.transform,'scale(1)');
assert.equal(handoff.c.dive.style.willChange,'transform','Native activation retains the entering camera layer during settlement');
handoff.advance(699);assert.equal(handoff.c.dive.style.willChange,'transform','Native handoff cannot demote the camera before its settlement deadline');
handoff.advance(1);assert.equal(handoff.c.dive.style.willChange,'auto','Settled native panning releases the temporary camera promotion');
assert.equal(handoff.calls.warm,1,'Settlement resumes normal photo demand once');
const shown=handoff.c.vault.style.visibility;handoff.c.cancelVaultCamera();assert.equal(handoff.c.vault.style.visibility,shown,'Preview cancellation cannot hide the interactive Vault');
console.log('PASS native handoff keeps the camera promotion through 699ms, releases it at 700ms, and preserves the active Vault');
}
