// Exercise the actual archive scheduler, including hung requests and retry.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('  var vaultImageJobs='),end=html.indexOf('  /* gold dust',start);
assert(start>0&&end>start);
const timers=new Map(),downloads=[],images=Array.from({length:9},(_,i)=>({
 dataset:{src:'original-'+i},style:{},classList:{add(){},remove(){}},
 getBoundingClientRect:()=>({left:i*100,top:0,width:100,height:100})
}));
let timerId=0,active=0,peak=0;
class Image {
 constructor(){downloads.push(this)}
 set src(value){this.url=value;active++;peak=Math.max(peak,active)}
 get src(){return this.url}
 removeAttribute(){active--}
 finish(fail=false){active--;const callback=fail?this.onerror:this.onload;callback()}
}
const c={Promise,Image,WeakMap,Math,innerWidth:100,innerHeight:100,
 setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},
 plane:{querySelectorAll:()=>images.filter(i=>i.dataset.src)},decodeVaultImage:()=>Promise.resolve(),
 window:{addEventListener(){}}
};vm.createContext(c);vm.runInContext(html.slice(start,end),c);
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve()};
(async()=>{
 const ready=c.warmVaultImages();assert.equal(downloads.length,4);assert.equal(peak,4);
 assert.equal(downloads[0].url,'original-0','Nearest photograph loads first');
 c.warmVaultImages();assert.equal(downloads.length,4,'Repeated entry does not duplicate jobs');
 for(const t of [...timers.values()])if(t.ms===8000)t.fn();await ready;
 assert.equal(downloads.length,4,'Input readiness timeout does not start more network requests');
 downloads[0].finish(true);await flush();assert.equal(downloads.length,5);
 // Simulate a truly hung request releasing its slot, retaining its retry source.
 const deadline=[...timers.values()].find(t=>t.ms===120000);deadline.fn();await flush();assert.equal(downloads.length,6);
 let cursor=2;while(cursor<downloads.length){downloads[cursor++].finish();await flush()}
 assert.equal(active,0);assert.equal(peak,4);
 assert(images.slice(2).every(i=>!i.dataset.src&&i.src.startsWith('original-')));
 const retry=c.warmVaultImages();assert.equal(downloads.length,11);downloads[9].finish();downloads[10].finish();await retry;await flush();
 assert(images.every(i=>!i.dataset.src));assert.equal(c.vaultNetworkActive,0);
 console.log('PASS: four concurrent original downloads; nearest first; bounded entry wait; timeout/error slot release; full-quality retry; no duplicate requests.');
})().catch(e=>{console.error(e);process.exit(1)});
