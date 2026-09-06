const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const source=html.slice(html.indexOf('  function startNextDrop(){'),html.indexOf("  film.addEventListener('ended'"));
for(const reduced of [false,true])for(let run=0;run<4;run++){
 const classes=new Set(),listeners=new Map(),tasks=[];
 const button={addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:(n,f)=>{if(listeners.get(n)===f)listeners.delete(n)}};
 const destination={setAttribute(){}};
 const context={reduced,scrollTo(){},lock(){},setNextDropInert(){},filmLogo:{getBoundingClientRect:()=>({width:0,height:0})},afterMotion:(ms,f)=>tasks.push([ms,f]),document:{body:{classList:{contains:n=>classes.has(n),add:n=>classes.add(n)}},documentElement:{classList:{add(){}}},getElementById:id=>id==='nextVaultHold'?button:destination,querySelector:()=>null}};
 vm.runInNewContext(source+';startNextDrop()',context);
 assert(!classes.has('next-drop-landed'));
 if(reduced){assert.equal(tasks[0][0],50);tasks[0][1]();assert(!listeners.size)}else{
  assert.equal(tasks.length,0);
  const end=listeners.get('animationend');
  end({target:{},animationName:'nextDropSettle'});assert(!classes.has('next-drop-landed'));
  end({target:button,animationName:'other'});assert(!classes.has('next-drop-landed'));
  end({target:button,animationName:'nextDropSettle'});assert.equal(listeners.size,0);
 }
 assert(classes.has('next-drop-landed'));
}
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
for(const [,script]of scripts)new vm.Script(script);
console.log('PASS: normal/reduced motion x4, unrelated animation events ignored, listener cleaned up, embedded JS syntax valid');
