// Exercise real photo scheduling and decorative work at the camera handoff.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.VAULT_SOURCE||path.join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('  var vaultImageJobs='),end=html.indexOf('  /* gold dust',start);
assert(start>0&&end>start);
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function photo(width=640){
 const classes=new Set(['asset-ready']);
 const img={dataset:{original:'photos/archive.jpg',delivery:'assets/delivery/archive',tileWidth:620},style:{left:'0px',top:'0px',width:'620px',height:'826px'},naturalWidth:width,
  classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},
  source:'https://example.com/assets/delivery/archive-'+(width===640?'640':'1280')+'.webp'};
 Object.defineProperty(img,'src',{get(){return this.source},set(value){this.source=new URL(value,'https://example.com/').href;this.naturalWidth=value.endsWith('archive.jpg')?1800:value.endsWith('-1280.webp')?1200:640}});
 return img;
}
function scheduler(images){
 const downloads=[],timers=new Map();let timerId=0,active=0,peak=0,decodes=0;
 class Image{
  constructor(){downloads.push(this)}
  set src(value){this.url=value;active++;peak=Math.max(peak,active)}
  get src(){return this.url}
  finish(failed=false){active--;const callback=failed?this.onerror:this.onload;assert.equal(typeof callback,'function');callback()}
  removeAttribute(){active--}
 }
 const c={Promise,Image,WeakMap,Math,innerWidth:390,innerHeight:844,devicePixelRatio:3,S:.675,vaultCameraZoom:1,px:0,py:0,
  setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},
  plane:{querySelectorAll(selector){return images.filter(img=>selector==='img.asset-ready'?img.classList.contains('asset-ready'):selector==='img[data-src]'?!!img.dataset.src:true)}},
  decodeVaultImage(){decodes++;return Promise.resolve()},window:{addEventListener(){}}};
 vm.createContext(c);vm.runInContext(html.slice(start,end),c);
 return {c,downloads,timers,get peak(){return peak},get decodes(){return decodes}};
}
(async()=>{
 const img=photo(1200),a=scheduler([img]);
 assert.equal(a.c.vaultPhotoPixels(img),1255.5);
 for(let i=0;i<5;i++){const ready=a.c.warmVaultImages();assert.equal(a.downloads.length,0,'Same-URL demand must not schedule another request');await ready}
 assert.equal(a.downloads.length,0,'A 1200px non-upscaled 1280 derivative must not reload its own URL at 1255px demand');

 const small=photo(),b=scheduler([small]);
 const promotion=b.c.warmVaultImages();
 assert.equal(b.downloads.length,1);assert.equal(b.downloads[0].url,'assets/delivery/archive-1280.webp');
 b.downloads[0].finish();await promotion;await flush();
 assert.equal(small.naturalWidth,1200);assert.equal(b.decodes,1);
 for(let i=0;i<5;i++){const ready=b.c.warmVaultImages();assert.equal(b.downloads.length,1,'A settled derivative must not reload');await ready}
 assert.equal(b.downloads.length,1,'Promotion to the smaller-than-labelled derivative completes once');
 b.c.S=.8;
 const original=b.c.warmVaultImages();assert.equal(b.downloads[1].url,'photos/archive.jpg','Greater demand still chooses the original');
 b.downloads[1].finish(true);await original;await flush();
 assert(small.classList.contains('asset-failed'));assert.equal(small.naturalWidth,1200,'Failure retains the decoded derivative');
 const retry=b.c.warmVaultImages();assert.equal(b.downloads[2].url,'photos/archive.jpg','Failed promotions remain retryable');
 b.downloads[2].finish();await retry;await flush();
 assert(small.src.endsWith('photos/archive.jpg'));assert.equal(b.decodes,2);assert(!small.classList.contains('asset-failed'));
 b.c.S=3;await b.c.warmVaultImages();assert.equal(b.downloads.length,3,'Originals are not needlessly decoded again at higher zoom');

 const batch=Array.from({length:9},()=>{const img=photo();img.dataset.src=img.dataset.original;return img}),c=scheduler(batch);
 const ready=c.c.warmVaultImages();assert.equal(c.downloads.length,4);assert.equal(c.peak,4);
 for(let cursor=0;cursor<c.downloads.length;cursor++){c.downloads[cursor].finish();await flush()}
 await ready;assert.equal(c.downloads.length,9);assert.equal(c.peak,4);assert.equal(c.c.vaultNetworkActive,0,'Every request slot is released');

 const dustStart=html.indexOf("  var dust=document.getElementById('dust')",end),dustEnd=html.indexOf('  /* hover lift',dustStart);
 assert(dustStart>0&&dustEnd>dustStart);let tick,paints=0,arcs=0;
 const canvas={width:0,height:0,getContext(){return {clearRect(){paints++},beginPath(){},arc(){arcs++},fill(){}}}},
  d={Math,parseFloat,document:{hidden:false,getElementById:()=>canvas},vault:{style:{opacity:'1'}},
   reduced:false,vaultCameraActive:true,dragging:false,inertia:null,nativePanScrolling:false,nativePanPointerDown:false,nativePanInputArmed:false,
   vw:390,vh:844,devicePixelRatio:3,setInterval(fn,ms){assert.equal(ms,50);tick=fn}};
 vm.createContext(d);vm.runInContext(html.slice(dustStart,dustEnd),d);
 tick();assert.equal(paints,0,'The photographic zoom must not repaint the decorative canvas');
 d.vaultCameraActive=false;tick();assert.equal(paints,1);assert.equal(arcs,24);assert.equal(canvas.width,780);assert.equal(canvas.height,1688);
 d.nativePanScrolling=true;tick();assert.equal(paints,1);d.nativePanScrolling=false;
 d.document.hidden=true;tick();assert.equal(paints,1);d.document.hidden=false;
 d.reduced=true;tick();assert.equal(paints,1);d.reduced=false;
 tick();assert.equal(paints,2,'Settled visible Vault dust resumes');
 console.log('PASS: repeated same-URL decode prevented; thumbnail/original promotion and failed retry preserved; four-request limit; decorative canvas sleeps during descent and resumes after handoff.');
})().catch(error=>{console.error(error);process.exitCode=1});
