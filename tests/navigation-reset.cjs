const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}

function scriptContaining(html,token){
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(match[1].includes(token))return match[1];
  throw new Error('Missing script containing '+token);
}

function runBoot(script,{href,type,topLevel=true}){
  const calls={replace:[],history:[],scroll:[],storage:[]};
  const url=new URL(href);
  const location={
    get href(){return url.href},get pathname(){return url.pathname},get search(){return url.search},get hash(){return url.hash},
    replace(next){calls.replace.push(String(next));const value=new URL(next,url);url.href=value.href}
  };
  const history={state:{journey:'kept'},scrollRestoration:'auto',replaceState(state,title,next){calls.history.push([state,title,String(next)]);const value=new URL(next,url);url.href=value.href}};
  const stored=new Map([['flapv_best','75'],['flapv_won','1']]);
  const localStorage={
    getItem:key=>stored.get(key)??null,
    setItem:(key,value)=>{calls.storage.push(['set',key,String(value)]);stored.set(key,String(value))},
    removeItem:key=>{calls.storage.push(['remove',key]);stored.delete(key)},
    clear:()=>{calls.storage.push(['clear']);stored.clear()}
  };
  const context={URL,location,history,localStorage,performance:{getEntriesByType:name=>name==='navigation'?[{type}]:[],navigation:{type:type==='reload'?1:0}},scrollTo:(...args)=>calls.scroll.push(args)};
  context.window=context;context.top=topLevel?context:{};
  vm.runInNewContext(script,context);
  return {calls,context,url,stored};
}

function attributes(){
  const values=new Set();
  return {
    has:name=>values.has(name),
    removeAttribute:name=>values.delete(name),
    toggleAttribute(name,on){if(on)values.add(name);else values.delete(name)}
  };
}

function runEmbedBridge(script,{cycle='7'}={}){
  const listeners=new Map(),messages=[],events=[],replacements=[],reloads=[];
  const rootAttrs=attributes(),bodyAttrs=attributes();
  const parent={location:{origin:'https://vctrsclo.com'},postMessage:(data,origin)=>messages.push({data,origin})};
  const location={origin:'https://vctrsclo.com',search:'?embed=vault&cycle='+cycle,href:'https://vctrsclo.com/vault-embed.html?embed=vault&cycle='+cycle,replace:href=>replacements.push(String(href)),reload:()=>reloads.push(true)};
  const document={
    documentElement:rootAttrs,body:bodyAttrs,readyState:'complete',activeElement:null,
    getAnimations:()=>[],getElementById:()=>null
  };
  const context={URL,URLSearchParams,location,parent,document,CustomEvent:class CustomEvent{constructor(type,init){this.type=type;this.detail=init&&init.detail}},dispatchEvent:event=>events.push(event),addEventListener:(name,fn)=>{const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list)}};
  context.window=context;context.top=parent;
  vm.runInNewContext(script,context);
  const dispatch=(name,event)=>{for(const listener of listeners.get(name)||[])listener(event)};
  return {context,parent,location,document,messages,events,replacements,reloads,dispatch,rootAttrs,bodyAttrs};
}

function classList(initial=[]){
  const names=new Set(initial);
  return {contains:name=>names.has(name),toggle(name,on){if(on)names.add(name);else names.delete(name)},add:(...items)=>items.forEach(item=>names.add(item)),remove:(...items)=>items.forEach(item=>names.delete(item))};
}

function runStoryController(script){
  const listeners=new Map(),documentListeners=new Map(),posts=[],childReplaces=[],historyCalls=[],scrollCalls=[];
  const section={classList:classList(),getBoundingClientRect:()=>({top:0,bottom:844})};
  const child={postMessage:(data,origin)=>posts.push({data,origin}),location:{replace:href=>childReplaces.push(String(href))}};
  const frame={contentWindow:child,dataset:{src:'../vault-embed.html?embed=vault&cycle=0'},tabIndex:-1,attrs:new Map([['inert',''],['aria-hidden','true']]),addEventListener(){},toggleAttribute(name,on){if(on)this.attrs.set(name,'');else this.attrs.delete(name)},setAttribute(name,value){this.attrs.set(name,String(value))},removeAttribute(name){this.attrs.delete(name)},blur(){}};
  const overlay={classList:classList()};
  const startCue={focus(){}};
  const body={classList:classList()};
  const document={
    body,hidden:false,activeElement:null,
    getElementById:id=>id==='story-vault'?section:id==='story-vault-frame'?frame:id==='flapOverlay'?overlay:id==='story-return'?{}:null,
    querySelector:selector=>selector==='.story-cue'?startCue:null,
    addEventListener:(name,fn)=>{const list=documentListeners.get(name)||[];list.push(fn);documentListeners.set(name,list)}
  };
  const location={origin:'https://vctrsclo.com',href:'https://vctrsclo.com/experience/',hash:'',reload(){throw new Error('parent controller must not reload')}};
  const history={state:{journey:'kept'},replaceState:(state,title,href)=>historyCalls.push({state,title,href:String(href)})};
  const context={URL,document,location,history,innerHeight:844,scrollTo:(...args)=>scrollCalls.push(args),requestAnimationFrame:fn=>{fn();return 1},MutationObserver:class MutationObserver{observe(){}},addEventListener:(name,fn)=>{const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list)}};
  context.window=context;
  vm.runInNewContext(script,context);
  const dispatch=(name,event)=>{for(const listener of listeners.get(name)||[])listener(event)};
  return {context,section,frame,child,posts,childReplaces,historyCalls,scrollCalls,dispatch,documentListeners};
}

const original=read('index.html');
const story=read('experience/index.html');
const embed=read('vault-embed.html');
const rootBoot=scriptContaining(original,'__vctrsReloadOpening');
const storyBoot=scriptContaining(story,"new URL('../',location.href)");
const bridge=scriptContaining(embed,'VCTRS_VAULT_EMBED_BRIDGE');
const controller=scriptContaining(story,'window.__storyVault');

test('Top-level reloads restart at the root opening without touching saved game state',()=>{
  for(const href of ['https://vctrsclo.com/#vault','https://vctrsclo.com/?from=game#anything']){
    const result=runBoot(rootBoot,{href,type:'reload'});
    assert.equal(result.url.href,'https://vctrsclo.com/');
    assert.equal(result.context.__vctrsReloadOpening,true);
    assert.equal(result.stored.get('flapv_best'),'75');assert.equal(result.stored.get('flapv_won'),'1');assert.deepEqual(result.calls.storage,[]);
  }
  for(const href of ['https://vctrsclo.com/experience/','https://vctrsclo.com/experience/#play']){
    const result=runBoot(storyBoot,{href,type:'reload'});
    assert.deepEqual(result.calls.replace,['https://vctrsclo.com/']);
    assert.equal(result.stored.get('flapv_best'),'75');assert.equal(result.stored.get('flapv_won'),'1');assert.deepEqual(result.calls.storage,[]);
  }
});

test('Navigate and Back/Forward entries are not mistaken for manual refresh',()=>{
  for(const type of ['navigate','back_forward'])for(const [script,href] of [[rootBoot,'https://vctrsclo.com/#vault'],[storyBoot,'https://vctrsclo.com/experience/#play']]){
    const result=runBoot(script,{href,type});
    assert.deepEqual(result.calls.replace,[]);assert.deepEqual(result.calls.history,[]);assert.deepEqual(result.calls.scroll,[]);assert.equal(result.context.__vctrsReloadOpening,undefined);
  }
  const child=runBoot(rootBoot,{href:'https://vctrsclo.com/vault-embed.html?embed=vault&cycle=8',type:'reload',topLevel:false});
  assert.deepEqual(child.calls.replace,[]);assert.deepEqual(child.calls.history,[]);assert.equal(child.url.pathname,'/vault-embed.html');
});

test('Root BFCache restoration rebuilds the returned Vault in place',()=>{
  const begin=original.indexOf('  function restoreReturnedVault(){'),end=original.indexOf('\n})();',begin),source=original.slice(begin,end);
  assert(begin>=0&&end>begin,'missing returned Vault restoration');
  assert.match(source,/addEventListener\('pageshow',[\s\S]*e\.persisted[\s\S]*restoreReturnedVault\(\)/);
  assert(!source.includes('location.reload('),'BFCache restoration must not become a network reload');
  assert(!source.includes('localStorage.clear(')&&!source.includes('localStorage.removeItem('));
});

test('Embedded clone authenticates sync, reports its actual cycle, and keeps resets inside the child',()=>{
  const run=runEmbedBridge(bridge,{cycle:'7'});
  run.messages.length=0;
  run.dispatch('message',{origin:'https://attacker.example',source:run.parent,data:{type:'vctrs-vault-sync',cycle:'99'}});
  run.dispatch('message',{origin:run.location.origin,source:{},data:{type:'vctrs-vault-sync',cycle:'99'}});
  assert.deepEqual(run.messages,[]);
  run.dispatch('message',{origin:run.location.origin,source:run.parent,data:{type:'vctrs-vault-sync',cycle:'99'}});
  assert.deepEqual(plain(run.messages.pop()),{data:{type:'vctrs-vault-sync',cycle:'7',active:false},origin:run.location.origin});
  run.dispatch('message',{origin:run.location.origin,source:run.parent,data:{type:'vctrs-vault-visibility',cycle:'7',active:true}});
  assert.equal(run.context.__vctrsVaultEmbedActive,true);
  const before=run.messages.length;
  run.dispatch('pageshow',{persisted:true});
  assert.equal(run.context.__vctrsVaultEmbedActive,false);
  assert.deepEqual(plain(run.messages.slice(before).map(item=>item.data)),[
    {type:'vctrs-vault-sync',cycle:'7',active:false},
    {type:'vctrs-vault-ready',cycle:'7'}
  ]);
  assert.deepEqual(run.reloads,[]);assert.deepEqual(run.replacements,[]);
  run.dispatch('message',{origin:run.location.origin,source:run.parent,data:{type:'vctrs-vault-reset',cycle:'7',nextCycle:8}});
  assert.deepEqual(run.reloads,[]);assert.equal(run.replacements.length,1);
  const target=new URL(run.replacements[0]);assert.equal(target.origin,run.location.origin);assert.equal(target.pathname,'/vault-embed.html');assert.equal(target.search,'?embed=vault&cycle=8');assert.equal(target.hash,'');
  // If BFCache restores the old child while that navigation was pending, the
  // parent's authenticated retry must be allowed to issue the same replace.
  const beforeRetry=run.replacements.length;
  run.dispatch('pageshow',{persisted:true});
  run.dispatch('message',{origin:run.location.origin,source:run.parent,data:{type:'vctrs-vault-reset',cycle:'7',nextCycle:8}});
  assert.equal(run.replacements.length,beforeRetry+1,'persisted old child ignored the parent reset retry');
  assert.equal(new URL(run.replacements.at(-1)).search,'?embed=vault&cycle=8');
});

test('Parent keeps a pending reset until the authenticated child reaches that cycle',()=>{
  const run=runStoryController(controller),send=(source,origin,data)=>run.dispatch('message',{source,origin,data});
  send(run.child,'https://vctrsclo.com',{type:'vctrs-vault-ready',cycle:0});
  assert.equal(run.context.__storyVault.loaded,true);assert.equal(run.context.__storyVault.active,true);
  send(run.child,'https://vctrsclo.com',{type:'vctrs-vault-surface',cycle:0});
  assert.equal(run.context.__storyVault.resetting,true);assert.equal(run.context.__storyVault.pendingCycle,1);assert.equal(run.context.__storyVault.loaded,false);
  send({},'https://vctrsclo.com',{type:'vctrs-vault-ready',cycle:1});
  send(run.child,'https://attacker.example',{type:'vctrs-vault-ready',cycle:1});
  assert.equal(run.context.__storyVault.resetting,true);assert.equal(run.context.__storyVault.pendingCycle,1);
  const resetCount=run.posts.filter(item=>item.data.type==='vctrs-vault-reset').length;
  send(run.child,'https://vctrsclo.com',{type:'vctrs-vault-ready',cycle:0});
  assert.equal(run.context.__storyVault.resetting,true);assert.equal(run.context.__storyVault.pendingCycle,1);assert.equal(run.context.__storyVault.loaded,false);
  assert.equal(run.posts.filter(item=>item.data.type==='vctrs-vault-reset').length,resetCount+1,'stale ready should retry the pending child reset');
  send(run.child,'https://vctrsclo.com',{type:'vctrs-vault-sync',cycle:1,active:false});
  assert.equal(run.context.__storyVault.resetting,false);assert.equal(run.context.__storyVault.pendingCycle,null);assert.equal(run.context.__storyVault.cycle,1);assert.equal(run.context.__storyVault.loaded,true);
});

test('Parent BFCache restore probes the child without reload or cycle loss',()=>{
  const run=runStoryController(controller),send=data=>run.dispatch('message',{source:run.child,origin:'https://vctrsclo.com',data});
  send({type:'vctrs-vault-ready',cycle:0});assert.equal(run.context.__storyVault.loaded,true);
  const before=run.posts.length;run.dispatch('pageshow',{persisted:true});
  assert.equal(run.context.__storyVault.loaded,false);assert.equal(run.context.__storyVault.cycle,0);assert.equal(run.context.__storyVault.active,false);
  assert.deepEqual(plain(run.posts.slice(before).map(item=>item.data.type)),['vctrs-vault-visibility','vctrs-vault-sync']);
  send({type:'vctrs-vault-sync',cycle:0,active:false});
  assert.equal(run.context.__storyVault.loaded,true);assert.equal(run.context.__storyVault.cycle,0);
});

console.log(JSON.stringify({passed,limits:'Focused VM/static navigation lifecycle checks; browser history journey is separate. No form transport.'}));
