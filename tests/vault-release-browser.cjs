const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const pw=require('playwright');
const base=process.env.DEMO_URL||'http://127.0.0.1:59408/';
const out=path.resolve(process.env.EVIDENCE_DIR||'docs/reviews/vault-photo-release-2026-09-10');fs.mkdirSync(out,{recursive:true});
const configs=[['chromium',1440,900],['chromium',1280,720],['chromium',320,568],['chromium',430,932],['chromium',390,844,'reduce'],['chromium',1440,900,'reduce'],['webkit',390,844],['webkit',844,390],['webkit',1440,900],['firefox',1280,900]];
const paths={webkit:process.env.WEBKIT_EXECUTABLE,firefox:process.env.FIREFOX_EXECUTABLE};
const results=[];
async function run(config){const [engine,width,height,motion='no-preference']=config;const b=await pw[engine].launch({headless:true,...(paths[engine]?{executablePath:paths[engine]}:{})});
try{for(let pass=1;pass<=4;pass++){
 const c=await b.newContext({viewport:{width,height},hasTouch:width<900,reducedMotion:motion,...(engine!=='firefox'?{isMobile:width<900}:{})});
 const p=await c.newPage();p.setDefaultTimeout(30000);const errors=[],bad=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()])});
 await p.route('**/formsubmit.co/**',r=>r.fulfill({json:{success:true}}));
 try{
 await p.goto(base+'?release='+engine+width+motion+pass,{waitUntil:'domcontentloaded'});
 await p.locator('#nextVaultHold').waitFor({state:'visible'});
 await p.waitForFunction(()=>!document.getElementById('nextDrop').inert);
 if(pass===2){await p.locator('#nextVaultHold').focus();await p.keyboard.press('Enter')}else await p.locator('#nextVaultHold').click();
 await p.waitForFunction(()=>window.__guide.phase()==='vault'&&!document.getElementById('vault').inert);
 await p.waitForFunction(()=>[...document.querySelectorAll('#plane img')].every(i=>i.complete&&i.naturalWidth>0&&!i.dataset.src));
 assert.equal(await p.locator('#plane img').count(),32);
 const before=await p.evaluate(()=>__vaultPan.position());
 await p.mouse.move(width*.65,height*.65);await p.mouse.down();await p.mouse.move(width*.35,height*.40,{steps:12});await p.mouse.up();
 if(pass===3){await p.setViewportSize({width:height,height:width});await p.waitForTimeout(300);await p.setViewportSize({width,height});}
 await p.locator('#surfaceBtn').click();
 for(let loop=0;loop<2;loop++){
 await p.waitForFunction(()=>window.__worldJourney?.state==='story'&&!document.getElementById('world').classList.contains('film-waiting'));
 await p.waitForTimeout(1150);
 assert.equal(await p.locator('#world').evaluate(e=>e.scrollTop),0,'story must stay at top');
 await p.locator('#worldNext').click();await p.waitForFunction(()=>__worldJourney.state==='preview');
 await p.locator('#worldArrow').click();await p.waitForFunction(()=>__worldJourney.state==='game');
 await p.locator('#flap').click({position:{x:50,y:70}});await p.waitForTimeout(250);
 await p.locator('#flapExit').click();await p.waitForFunction(()=>__worldJourney.state==='preview');
 if(loop===0){await p.locator('#worldReturnVault').click();await p.waitForFunction(()=>!document.getElementById('vault').inert);await p.locator('#surfaceBtn').click();}
 }
 if(pass===1)await p.screenshot({path:path.join(out,engine+'-'+width+'-'+motion+'.png')});
 await Promise.all([p.waitForEvent('domcontentloaded'),p.locator('#worldRefresh').click()]);
 await p.locator('#nextVaultHold').waitFor({state:'visible'});
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 results.push({engine,width,height,motion,pass,status:'PASS',fullPhotos:32,returnLoops:2,refresh:true,errors,bad});
 console.log('PASS',engine,width,height,motion,pass);
 }catch(e){await p.screenshot({path:path.join(out,'FAIL-'+engine+'-'+width+'-'+pass+'.png')}).catch(()=>{});results.push({engine,width,height,motion,pass,status:'FAIL',error:e.message,errors,bad});throw e;}finally{fs.writeFileSync(path.join(out,'matrix.json'),JSON.stringify({base,time:new Date().toISOString(),results},null,2));await c.close();}
 }}finally{await b.close()}}
(async()=>{let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<configs.length){const c=configs[cursor++];await run(c)}}));console.log('PASS all',results.length,'fresh journeys')})().catch(e=>{console.error(e);process.exit(1)});
