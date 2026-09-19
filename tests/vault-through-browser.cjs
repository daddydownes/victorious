const{chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
const out=require('path').resolve(process.env.EVIDENCE_DIR||'docs/reviews/optimized-03-motion');fs.mkdirSync(out,{recursive:true});const base=process.env.DEMO_URL||'http://127.0.0.1:8770/';const results=[];
(async()=>{const b=await chromium.launch();for(const[width,height]of[[1440,900],[390,844],[844,390],[320,568]]){
 const p=await b.newPage({viewport:{width,height}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'?motion-proof='+width,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!document.getElementById('nextDrop').inert);
 await p.evaluate(()=>{window.motionSamples=[];window.motionWatch=setInterval(()=>{const title=document.querySelector('.vault-title'),mark=document.querySelector('.vault-entry-mark')||title.querySelector('.vault-brand-live');if(!mark)return;const r=mark.getBoundingClientRect(),s=getComputedStyle(title);if(document.querySelector('.vault-entry-mark')||title.classList.contains('gone'))motionSamples.push({x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,opacity:Number(s.opacity),phase:title.classList.contains('gone')?'fade':'arrival',time:performance.now(),color:getComputedStyle(mark).backgroundColor})},16)});
 await p.locator('#nextVaultHold').click();await p.waitForFunction(()=>document.querySelector('.vault-title').classList.contains('gone'));
 const fade=await p.evaluate(()=>{const a=document.querySelector('.vault-title').getAnimations().find(a=>a.animationName==='vaultThrough');if(!a)throw Error('Missing approved 03 animation');a.pause();a.currentTime=500;return{duration:a.effect.getTiming().duration,keyframes:a.effect.getKeyframes().map(k=>({opacity:k.opacity,transform:k.transform,filter:k.filter}))}});
 await p.screenshot({path:out+'/fade-'+width+'.png'});
 await p.evaluate(()=>document.querySelector('.vault-title').getAnimations().forEach(a=>a.play()));
 await p.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.vault-title')).opacity)===0);await p.evaluate(()=>clearInterval(motionWatch));
 const samples=await p.evaluate(()=>motionSamples),arrival=samples.filter(s=>s.phase==='arrival'),fading=samples.filter(s=>s.phase==='fade');
 assert(arrival.length>5);assert(fading.length>5);assert(Math.max(...samples.map(s=>Math.abs(s.x-width/2)))<1.1,'Mark remains horizontally centred');
  assert(fading.some(s=>s.opacity>0&&s.opacity<1),'Fade contains visible translucent frames');const unscaled=await p.locator('.vault-title').evaluate(e=>e.offsetWidth);assert(fading.at(-1).w>unscaled*4,'Mark expands toward viewer from its untransformed size');
 assert.equal(fade.duration,1250);assert.equal(fading.at(-1).color,'rgb(240, 212, 146)');assert.deepEqual(errors,[]);
 await p.waitForFunction(()=>!document.getElementById('vault').inert);results.push({width,height,status:'PASS',fade,centreDeviation:Math.max(...samples.map(s=>Math.abs(s.x-width/2))),samples});console.log('PASS centred forward fade',width,height);await p.close();
 }await b.close();fs.writeFileSync(out+'/motion.json',JSON.stringify(results,null,2));})().catch(e=>{console.error(e);fs.writeFileSync(out+'/motion-failure.txt',e.stack);process.exit(1)});
