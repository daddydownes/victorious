const fs=require('fs'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const repo=require('path').join(__dirname,'..');
const after=fs.readFileSync(repo+'/index.html','utf8'),before=cp.execFileSync('git',['show','f5b625e:index.html'],{cwd:repo,encoding:'utf8'});
if(after.includes('id="worldGame"')){require('./guided-scroll.cjs');return;} // Current root uses native chapter scrolling.
function setup(html){
 const source=html.slice(html.indexOf('  var postScrollTask='),html.indexOf('  /* ===== ▲ SURFACE'));
 let now=1000,tasks=[],listeners={},selection=false;
 const c={scrollY:0,innerHeight:703,guidePhase:'surfaced',vaultClosing:false,surfacing:false,motionQuery:{matches:false},document:{documentElement:{scrollHeight:5000},activeElement:null,getElementById:()=>null},window:{getSelection:()=>({isCollapsed:!selection})},motionNow:()=>now,addMotionTask:f=>{const task={f};tasks.push(task);return task},cancelMotionTask:t=>tasks=tasks.filter(x=>x!==t),addEventListener:(n,f)=>(listeners[n]??=[]).push(f),scrollTo:(x,y)=>{c.scrollY=Math.round(Math.max(0,Math.min(4297,y)))}};
 vm.createContext(c);vm.runInContext(source,c);
 function tick(ms=16){now+=ms;for(const task of [...tasks])if(task.f(ms,now)===false)tasks=tasks.filter(x=>x!==task)}
 function event(name,props={}){let e={target:null,deltaY:100,deltaMode:0,ctrlKey:false,prevented:false,preventDefault(){this.prevented=true},...props};for(const f of listeners[name]||[])f(e);return e}
 return {c,event,tick,settle:()=>{for(let i=0;i<60;i++)tick()},select:x=>selection=x,time:ms=>now+=ms};
}
function wheelDistance(html){const s=setup(html);s.event('wheel');s.settle();return s.c.scrollY}
function sustained(html){const s=setup(html);for(let i=0;i<60;i++){s.event('wheel');s.tick()}s.settle();return s.c.scrollY}
const results={singleWheel:{before:wheelDistance(before),after:wheelDistance(after)},sustainedWheel:{before:sustained(before),after:sustained(after)}};
assert.equal(results.singleWheel.after,92);assert.equal(results.singleWheel.before,115);assert(results.sustainedWheel.after < results.sustainedWheel.before*0.82);assert(results.sustainedWheel.after > results.sustainedWheel.before*0.78);
assert.equal(after.slice(after.indexOf("  addEventListener('touchstart',function(e){",after.indexOf("  var postScrollTask=")),after.indexOf("  /* ===== ▲ SURFACE")),before.slice(before.indexOf("  addEventListener('touchstart',function(e){",before.indexOf("  var postScrollTask=")),before.indexOf("  /* ===== ▲ SURFACE")));
for(let pass=0;pass<4;pass++){
 let s=setup(after);s.event('wheel',{deltaY:1e6});s.settle();assert(s.c.scrollY<=Math.ceil(703*1.15));
 const bottom=s.c.scrollY;s.event('wheel',{deltaY:-100});s.settle();assert(s.c.scrollY<bottom);
 s=setup(after);s.c.scrollY=4290;s.event('wheel',{deltaY:1e6});s.settle();assert.equal(s.c.scrollY,4297);
 for(const props of [{ctrlKey:true},{target:{closest:()=>true}}]){s=setup(after);assert(!s.event('wheel',props).prevented);s.settle();assert.equal(s.c.scrollY,0)}
 s=setup(after);s.c.motionQuery.matches=true;assert(!s.event('wheel').prevented);
 s=setup(after);s.select(true);assert(!s.event('wheel').prevented);
 s=setup(after);s.c.guidePhase='vault';assert(!s.event('wheel').prevented);
 s=setup(after);s.event('wheel');s.event('keydown');s.settle();assert.equal(s.c.scrollY,0);
 s=setup(after);s.event('touchstart',{touches:[{clientY:500}]});s.time(100);s.event('touchmove',{touches:[{clientY:200}]});assert.equal(s.c.postScrollTarget,300);s.event('touchend');s.settle();assert.equal(s.c.scrollY,500);
 s=setup(after);s.event('touchstart',{touches:[{clientY:500}]});s.time(100);s.event('touchmove',{touches:[{clientY:200}]});s.time(100);s.event('touchend');s.settle();assert.equal(s.c.scrollY,300);
 s=setup(after);s.event('touchstart',{touches:[{clientY:500}]});s.time(100);s.event('touchmove',{touches:[{clientY:200}]});s.event('touchcancel');s.settle();assert.equal(s.c.scrollY,0);
}
for(const [,script]of after.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script);
console.log('PASS x4: single-fling bound, reversal, page edges, zoom, controls, selection, reduced motion, phase gate, keyboard cancellation, finger tracking, coast, paused lift and cancellation');console.log(JSON.stringify(results,null,2));
