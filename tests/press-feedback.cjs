// Exercise the actual input handlers: visual origin must not change activation.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.slice(html.indexOf('  var nextEntryButton='),html.indexOf('  /* ================= descent:'));
assert(source.length>1000);
function setup(){
 const page={},buttonEvents={},style=new Map();let entered=0;
 const button={style:{setProperty:(k,v)=>style.set(k,v),removeProperty:k=>style.delete(k)},getBoundingClientRect:()=>({left:100,top:200,right:560,bottom:278,width:460,height:78}),addEventListener:(n,f)=>buttonEvents[n]=f};
 const c={document:{getElementById:()=>button,addEventListener(){},hidden:false},addEventListener:(n,f)=>(page[n]??=[]).push(f),enterVaultFromNext:()=>entered++};
 vm.runInNewContext(source,c);
 function event(name,props={},target=false){const e={pointerId:1,isPrimary:true,button:0,pointerType:'mouse',clientX:130,clientY:220,detail:1,preventDefault(){},...props};if(target)buttonEvents[name]?.(e);else for(const f of page[name]||[])f(e);return e}
 function down(props={}){event('pointerdown',props);event('pointerdown',props,true)}
 return {c,style,event,down,count:()=>entered};
}
for(let run=0;run<4;run++){
 let s=setup();s.down();assert.equal(s.style.get('--press-x'),'30px');assert.equal(s.style.get('--press-y'),'20px');s.event('pointerup');s.event('click',{},true);assert.equal(s.count(),1);
 s=setup();s.down();s.event('pointermove',{clientX:190});s.event('pointerup',{clientX:190});s.event('click',{},true);assert.equal(s.count(),0);
 s=setup();s.down();s.event('pointercancel');s.event('click',{},true);assert.equal(s.count(),0);
 s=setup();s.down();s.event('pointerdown',{pointerId:2,isPrimary:false});s.event('pointerup');s.event('click',{},true);assert.equal(s.count(),0);
 s=setup();s.down({pointerType:'touch'});s.event('pointerup',{pointerType:'touch'});assert.equal(s.count(),1);
 s=setup();s.down();s.event('keydown',{key:'Enter'},true);assert.equal(s.style.size,0);s.event('click',{detail:0},true);assert.equal(s.count(),1);
 s=setup();s.down();s.event('pointercancel');s.event('click',{detail:0},true);assert.equal(s.style.size,0);assert.equal(s.count(),1);
 s=setup();s.c.setNextPressOrigin(-20,1000);assert.equal(s.style.get('--press-x'),'0px');assert.equal(s.style.get('--press-y'),'78px');
}
console.log('PASS x4: press location, clamping, keyboard centering, tap entry, swipe/cancel/multiple-contact rejection');
