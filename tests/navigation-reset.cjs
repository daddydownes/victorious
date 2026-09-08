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
  const listeners=new Map(),documentListeners=new Map(),returnLinkListeners=new Map(),posts=[],childReplaces=[],historyCalls=[],scrollCalls=[],rafTasks=new Map(),timerTasks=new Map(),motionListeners=[];
  let now=0,nextRaf=1,nextTimer=1,scrollY=0,sectionTop=0,sectionHeight=844,documentHeight=844;
  const section={classList:classList(),getBoundingClientRect:()=>{const top=sectionTop-scrollY;return {top,bottom:top+sectionHeight,height:sectionHeight}}};
  const child={postMessage:(data,origin)=>posts.push({data,origin}),location:{replace:href=>childReplaces.push(String(href))}};
  const frame={contentWindow:child,dataset:{src:'../vault-embed.html?embed=vault&cycle=0'},tabIndex:-1,attrs:new Map([['inert',''],['aria-hidden','true']]),addEventListener(){},toggleAttribute(name,on){if(on)this.attrs.set(name,'');else this.attrs.delete(name)},setAttribute(name,value){this.attrs.set(name,String(value))},removeAttribute(name){this.attrs.delete(name)},blur(){}};
  const overlay={classList:classList()};
  const startCue={focus(){document.activeElement=startCue}},startHeading={focus(options){document.activeElement=startHeading;this.focusOptions=options}};
  const returnLink={tagName:'A',addEventListener:(name,fn)=>{const list=returnLinkListeners.get(name)||[];list.push(fn);returnLinkListeners.set(name,list)}};
  const body={classList:classList()};
  const document={
    body,documentElement:{get scrollHeight(){return documentHeight}},hidden:false,activeElement:null,
    getElementById:id=>id==='brand-title'?startHeading:id==='story-vault'?section:id==='story-vault-frame'?frame:id==='flapOverlay'?overlay:id==='story-return'?{}:null,
    querySelector:selector=>selector==='.story-cue'?startCue:selector==='.story-return-link'?returnLink:null,
    addEventListener:(name,fn)=>{const list=documentListeners.get(name)||[];list.push(fn);documentListeners.set(name,list)}
  };
  const location={origin:'https://vctrsclo.com',href:'https://vctrsclo.com/experience/',hash:'',reload(){throw new Error('parent controller must not reload')}};
  const history={state:{journey:'kept'},replaceState:(state,title,href)=>historyCalls.push({state,title,href:String(href)})};
  const motion={matches:false,addEventListener:(name,fn)=>{if(name==='change')motionListeners.push(fn)},removeEventListener:(name,fn)=>{if(name==='change'){const at=motionListeners.indexOf(fn);if(at>=0)motionListeners.splice(at,1)}}};
  const context={URL,document,location,history,innerHeight:844,performance:{now:()=>now},matchMedia:()=>motion,
    scrollTo(...args){scrollCalls.push(args);const value=typeof args[0]==='object'?args[0].top:args[1];if(Number.isFinite(value))scrollY=value},
    requestAnimationFrame(fn){const id=nextRaf++;rafTasks.set(id,fn);return id},cancelAnimationFrame:id=>rafTasks.delete(id),
    setTimeout(fn,delay=0){const id=nextTimer++;timerTasks.set(id,{fn,due:now+Math.max(0,delay)});return id},clearTimeout:id=>timerTasks.delete(id),
    MutationObserver:class MutationObserver{observe(){}},addEventListener:(name,fn)=>{const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list)}};
  Object.defineProperty(context,'scrollY',{get:()=>scrollY,set:value=>{scrollY=value}});
  context.window=context;
  vm.runInNewContext(script,context);
  const step=(ms=16)=>{now+=ms;const pending=[...rafTasks.values()];rafTasks.clear();for(const fn of pending)fn(now);for(const [id,task] of [...timerTasks])if(task.due<=now){timerTasks.delete(id);task.fn()}};
  const flush=(limit=80)=>{let frames=0;while(rafTasks.size){assert(frames++<limit,'controller rAF did not settle');step(16)}};
  const dispatch=(name,event,settle=true)=>{for(const listener of listeners.get(name)||[])listener(event);if(settle)flush()};
  const dispatchDocument=(name,event,settle=true)=>{for(const listener of documentListeners.get(name)||[])listener(event);if(settle)flush()};
  const dispatchLink=(name,event,settle=true)=>{for(const listener of returnLinkListeners.get(name)||[])listener(event);if(settle)flush()};
  const setReduced=matches=>{motion.matches=matches;for(const fn of [...motionListeners])fn({matches});flush()};
  const setGeometry=({top=sectionTop-scrollY,height=sectionHeight,scrollHeight=Math.max(documentHeight,scrollY+top+height)}={})=>{sectionTop=scrollY+top;sectionHeight=height;documentHeight=scrollHeight};
  const setScroll=value=>{scrollY=value};
  const setViewport=height=>{context.innerHeight=height};
  const setHidden=hidden=>{document.hidden=hidden;dispatchDocument('visibilitychange',{})};
  flush();
  return {context,section,frame,child,startHeading,posts,childReplaces,historyCalls,scrollCalls,dispatch,dispatchDocument,dispatchLink,documentListeners,motion,setReduced,setGeometry,setScroll,setViewport,setHidden,step,flush,rafTasks,timerTasks};
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
  const sync=plain(run.messages.pop());
  assert.deepEqual({type:sync.data.type,cycle:sync.data.cycle,active:sync.data.active,origin:sync.origin},{type:'vctrs-vault-sync',cycle:'7',active:false,origin:run.location.origin});
  run.dispatch('message',{origin:run.location.origin,source:run.parent,data:{type:'vctrs-vault-visibility',cycle:'7',active:true}});
  assert.equal(run.context.__vctrsVaultEmbedActive,true);
  const before=run.messages.length;
  run.dispatch('pageshow',{persisted:true});
  assert.equal(run.context.__vctrsVaultEmbedActive,false);
  assert.deepEqual(plain(run.messages.slice(before).map(item=>({type:item.data.type,cycle:item.data.cycle,active:item.data.active}))),[
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

test('A Surface handoff lost to pagehide resumes the ordinary parent reset loop',()=>{
  const childRun=runEmbedBridge(bridge,{cycle:'7'});
  childRun.dispatch('message',{origin:childRun.location.origin,source:childRun.parent,data:{type:'vctrs-vault-visibility',cycle:'7',active:true}});
  childRun.messages.length=0;
  assert.equal(childRun.context.__vctrsVaultEmbedSurface(),true);
  assert(childRun.messages.some(item=>item.data.type==='vctrs-vault-surface'),'child did not emit the original Surface handoff');
  // Model pagehide dropping that message before the parent observes it.
  childRun.messages.length=0;
  childRun.dispatch('pageshow',{persisted:true});
  const recovered=plain(childRun.messages.find(item=>item.data.type==='vctrs-vault-sync'));
  assert(recovered,'restored child did not resynchronize');
  assert.deepEqual(recovered.data,{type:'vctrs-vault-sync',cycle:'7',active:false,surfaceSent:true});

  const parentRun=runStoryController(controller),send=data=>parentRun.dispatch('message',{source:parentRun.child,origin:'https://vctrsclo.com',data});
  send({type:'vctrs-vault-ready',cycle:0});
  assert.equal(parentRun.context.__storyVault.active,true);
  parentRun.dispatch('pageshow',{persisted:true});
  assert.equal(parentRun.context.__storyVault.active,false);assert.equal(parentRun.context.__storyVault.resetting,false);
  const resetsBefore=parentRun.posts.filter(item=>item.data.type==='vctrs-vault-reset').length;
  send({type:'vctrs-vault-sync',cycle:0,active:false,surfaceSent:true});
  assert.equal(parentRun.context.__storyVault.resetting,true);assert.equal(parentRun.context.__storyVault.pendingCycle,1);assert.equal(parentRun.context.__storyVault.loaded,false);
  const resets=parentRun.posts.filter(item=>item.data.type==='vctrs-vault-reset');
  assert.equal(resets.length,resetsBefore+1,'recovered Surface should begin one normal reset');
  assert.deepEqual(plain(resets.at(-1).data),{type:'vctrs-vault-reset',cycle:0,nextCycle:1});
  assert.equal(parentRun.historyCalls.length,1);assert(parentRun.scrollCalls.length>=2);
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

function inputEvent(properties={}){
  return {isTrusted:true,target:{tagName:'BODY',closest:()=>null},defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...properties};
}

function partialVault({top=660,height=844,loaded=true}={}){
  const run=runStoryController(controller);
  run.setGeometry({top,height,scrollHeight:top+height});
  run.dispatch('scroll',{});
  if(loaded)run.dispatch('message',{source:run.child,origin:'https://vctrsclo.com',data:{type:'vctrs-vault-ready',cycle:0}});
  assert.equal(run.context.__storyVault.active,false);
  return run;
}

test('Entry waits for the threshold and reverse, pinch, touch cancellation, or resize cannot create a commitment',()=>{
  let run=partialVault({top:660});
  const forward=inputEvent({deltaY:1});run.dispatch('wheel',forward);
  assert.equal(forward.defaultPrevented,false);assert.equal(run.context.__storyVault.entryPending,false);assert.equal(run.context.__storyVault.settling,false);
  run.setScroll(40);const reverse=inputEvent({deltaY:-80});run.dispatch('wheel',reverse);run.dispatch('scroll',{});
  assert.equal(reverse.defaultPrevented,false);assert.equal(run.context.__storyVault.entryPending,false);assert.equal(run.context.__storyVault.settling,false);

  run=partialVault({top:660});run.dispatch('wheel',inputEvent({deltaY:120}));
  run.setViewport(1000);run.dispatch('resize',{});
  assert.equal(run.context.__storyVault.entryPending,false,'resize reused an old forward intent');assert.equal(run.context.__storyVault.settling,false);

  run=partialVault({top:620});
  run.dispatch('touchstart',inputEvent({touches:[{clientY:520},{clientY:500}]}));
  run.dispatch('touchmove',inputEvent({touches:[{clientY:280},{clientY:260}]}));run.dispatch('touchend',inputEvent({touches:[]}));
  assert.equal(run.context.__storyVault.entryPending,false,'pinch was mistaken for a forward swipe');assert.equal(run.context.__storyVault.settling,false);

  run=partialVault({top:620});
  run.dispatch('touchstart',inputEvent({touches:[{clientY:520}]}));
  run.dispatch('touchmove',inputEvent({touches:[{clientY:280}]}));
  assert.equal(run.context.__storyVault.entryPending,true);assert.equal(run.context.__storyVault.settling,false,'touch committed before release');
  run.dispatch('touchcancel',inputEvent({touches:[]}));
  assert.equal(run.context.__storyVault.entryPending,false);assert.equal(run.context.__storyVault.settling,false);assert.equal(run.section.classList.contains('is-committing'),false);

  run=partialVault({top:620});
  run.dispatch('touchstart',inputEvent({touches:[{clientY:520}]}));run.dispatch('touchmove',inputEvent({touches:[{clientY:280}]}));
  assert.equal(run.context.__storyVault.entryPending,true);run.step(1000);
  run.dispatch('touchend',inputEvent({touches:[]}));
  assert(Math.abs(run.section.getBoundingClientRect().top)<=.001,'a deliberate long hold lost its pending entry');assert.equal(run.context.__storyVault.active,true);
});

test('Committed entry lands on the exact active viewport and suppresses only onward input during travel',()=>{
  const run=partialVault({top:620}),forward=inputEvent({deltaY:120});
  run.dispatch('wheel',forward,false);run.step();
  assert.equal(run.context.__storyVault.settling,true);assert.equal(run.section.classList.contains('is-committing'),true);assert.equal(forward.defaultPrevented,true);
  const onward=inputEvent({deltaY:80});run.dispatch('wheel',onward,false);
  assert.equal(onward.defaultPrevented,true);
  run.step(450);const mid=run.context.scrollY;assert(mid>0&&mid<620,'entry did not produce a bounded midpoint');
  run.step(500);run.flush();
  const rect=run.section.getBoundingClientRect();
  assert(Math.abs(rect.top)<=.001);assert.equal(run.context.__storyVault.entryPending,false);assert.equal(run.context.__storyVault.settling,false);assert.equal(run.context.__storyVault.active,true);
  assert.equal(run.section.classList.contains('is-committing'),false);assert.equal(run.frame.attrs.has('inert'),false);assert.deepEqual(run.historyCalls,[]);
});

test('A huge wheel step owns the full approach and preserves the landing quiet window',()=>{
  const run=partialVault({top:700}),first=inputEvent({deltaY:5000,cancelable:true});
  run.dispatch('wheel',first,false);run.step();
  assert.equal(first.defaultPrevented,true,'a single top-to-bottom wheel step escaped to native scrolling');
  assert.equal(run.context.__storyVault.settling,true);assert.equal(run.context.__storyVault.active,false);
  run.step(870);
  const onward=inputEvent({deltaY:5000,cancelable:true});run.dispatch('wheel',onward,false);
  assert.equal(onward.defaultPrevented,true,'onward momentum escaped during committed travel');
  run.step(20);
  assert(Math.abs(run.section.getBoundingClientRect().top)<=.001);assert.equal(run.context.__storyVault.landing,true);
  assert.equal(run.context.__storyVault.active,false,'fullView bypassed the input quiet window');
  run.dispatch('scroll',{});assert.equal(run.context.__storyVault.active,false);
  run.step(119);assert.equal(run.context.__storyVault.active,false);
  run.step(2);run.flush();assert.equal(run.context.__storyVault.settling,false);assert.equal(run.context.__storyVault.active,true);
});

test('A native huge-wheel jump waits at full view for a delayed child and quiet handoff',()=>{
  const run=partialVault({top:700,loaded:false}),wheel=inputEvent({deltaY:5000,cancelable:false});
  run.dispatch('wheel',wheel,false);assert.equal(wheel.defaultPrevented,false);
  run.setScroll(700);run.dispatch('scroll',{});
  assert.equal(run.context.__storyVault.entryPending,true,'the direct full-view jump lost its recent forward intent');
  assert.equal(run.context.__storyVault.settling,false);assert.equal(run.context.__storyVault.active,false);
  run.dispatch('message',{source:run.child,origin:'https://vctrsclo.com',data:{type:'vctrs-vault-ready',cycle:0}});
  assert.equal(run.context.__storyVault.settling,true);assert.equal(run.context.__storyVault.landing,true);assert.equal(run.context.__storyVault.active,false);
  run.step(139);assert.equal(run.context.__storyVault.active,false);
  run.step(2);run.flush();assert.equal(run.context.__storyVault.settling,false);assert.equal(run.context.__storyVault.active,true);
});

test('A native End jump at full view observes the same quiet handoff',()=>{
  const run=partialVault({top:700}),end=inputEvent({key:'End'});
  run.dispatch('keydown',end,false);assert.equal(end.defaultPrevented,false);
  run.setScroll(700);run.dispatch('scroll',{});
  assert.equal(run.context.__storyVault.settling,true);assert.equal(run.context.__storyVault.landing,true);assert.equal(run.context.__storyVault.active,false);
  run.step(139);assert.equal(run.context.__storyVault.active,false);
  run.step(2);run.flush();assert.equal(run.context.__storyVault.settling,false);assert.equal(run.context.__storyVault.active,true);
});

test('Sustained forward input and touch input cannot pull back or activate a half-settled Vault',()=>{
  const run=partialVault({top:620}),samples=[];
  run.dispatch('wheel',inputEvent({deltaY:120}),false);run.step();assert.equal(run.context.__storyVault.settling,true);
  // Model native momentum escaping between animation frames. The committed
  // trajectory may advance from that position, but must never pull backward.
  for(let index=0;index<5;index++){
    run.context.scrollY+=index===0?45:22;const before=run.context.scrollY;
    const onward=inputEvent({deltaY:90});run.dispatch('wheel',onward,false);assert.equal(onward.defaultPrevented,true);
    run.step(150);samples.push({before,after:run.context.scrollY});assert(run.context.scrollY>=before,'settle frame reversed escaped forward momentum');
  }
  const start=inputEvent({touches:[{clientY:520}],cancelable:true});run.dispatch('touchstart',start,false);
  assert.equal(run.context.__storyVault.settling,true,'new single touch cancelled a committed entry');
  let move=inputEvent({touches:[{clientY:360}],cancelable:true});run.dispatch('touchmove',move,false);assert.equal(move.defaultPrevented,true);
  run.step(150);assert.equal(run.context.__storyVault.settling,true);assert.equal(run.context.__storyVault.active,false);
  move=inputEvent({touches:[{clientY:280}],cancelable:true});run.dispatch('touchmove',move,false);assert.equal(move.defaultPrevented,true);
  run.step(100);
  assert(Math.abs(run.section.getBoundingClientRect().top)<=.001,'committed travel did not reach the exact Vault viewport');
  assert.equal(run.context.__storyVault.settling,true,'Vault activated before held touch and quiet window cleared');assert.equal(run.context.__storyVault.active,false);
  run.dispatch('touchend',inputEvent({touches:[],cancelable:true}),false);
  run.step(139);assert.equal(run.context.__storyVault.settling,true);assert.equal(run.context.__storyVault.active,false);
  run.step(2);run.flush();
  assert.equal(run.context.__storyVault.settling,false);assert.equal(run.context.__storyVault.active,true);assert.equal(run.section.classList.contains('is-committing'),false);assert.equal(run.frame.attrs.has('inert'),false);
  assert.deepEqual(run.historyCalls,[]);assert(samples.length===5&&samples.every(sample=>sample.after>=sample.before));
});

test('A late initial pageshow preserves entry while a persisted restore cancels and resynchronizes',()=>{
  let run=partialVault({top:620});run.dispatch('wheel',inputEvent({deltaY:120}),false);run.step();run.step(200);
  const before=run.context.scrollY,syncBefore=run.posts.filter(item=>item.data.type==='vctrs-vault-sync').length;
  run.dispatch('pageshow',{persisted:false},false);
  assert.equal(run.context.__storyVault.settling,true,'ordinary initial pageshow cancelled a live entry');
  assert.equal(run.context.__storyVault.entryPending,false);assert.equal(run.posts.filter(item=>item.data.type==='vctrs-vault-sync').length,syncBefore);
  run.step(700);run.flush();assert(run.context.scrollY>=before);assert(Math.abs(run.section.getBoundingClientRect().top)<=.001);assert.equal(run.context.__storyVault.active,true);

  run=partialVault({top:620});run.dispatch('wheel',inputEvent({deltaY:120}),false);run.step();run.step(200);
  const persistedSyncs=run.posts.filter(item=>item.data.type==='vctrs-vault-sync').length;
  run.dispatch('pageshow',{persisted:true},false);
  assert.equal(run.context.__storyVault.settling,false);assert.equal(run.context.__storyVault.entryPending,false);assert.equal(run.context.__storyVault.loaded,false);assert.equal(run.context.__storyVault.active,false);
  assert.equal(run.section.classList.contains('is-committing'),false);assert.equal(run.rafTasks.size,1,'persisted restore should retain only its queued measurement');
  assert.equal(run.posts.filter(item=>item.data.type==='vctrs-vault-sync').length,persistedSyncs+1);
});

test('Reverse and lifecycle changes cancel cleanly while reduced motion and resize settle to the current target',()=>{
  let run=partialVault({top:620});run.dispatch('wheel',inputEvent({deltaY:100}),false);run.step();run.step(300);
  const beforeReverse=run.context.scrollY,reverse=inputEvent({deltaY:-60});run.dispatch('wheel',reverse);
  assert.equal(reverse.defaultPrevented,false);assert.equal(run.context.__storyVault.settling,false);assert.equal(run.section.classList.contains('is-committing'),false);assert.equal(run.rafTasks.size,0);assert.equal(run.context.scrollY,beforeReverse);

  run=partialVault({top:620});run.dispatch('wheel',inputEvent({deltaY:100}),false);run.step();run.step(250);run.setHidden(true);
  assert.equal(run.context.__storyVault.settling,false);assert.equal(run.context.__storyVault.entryPending,false);assert.equal(run.section.classList.contains('is-committing'),false);assert.equal(run.rafTasks.size,0);
  run.setHidden(false);run.dispatch('wheel',inputEvent({deltaY:100}),false);run.step();assert.equal(run.context.__storyVault.settling,true,'visibility restoration did not rearm entry');
  run.dispatch('pagehide',{});assert.equal(run.context.__storyVault.settling,false);assert.equal(run.rafTasks.size,0);

  run=partialVault({top:620});run.dispatch('wheel',inputEvent({deltaY:100}),false);run.step();run.step(250);run.setReduced(true);
  assert(Math.abs(run.section.getBoundingClientRect().top)<=.001);assert.equal(run.context.__storyVault.active,true);assert.equal(run.context.__storyVault.settling,false);

  run=partialVault({top:620});run.dispatch('wheel',inputEvent({deltaY:100}),false);run.step();run.step(250);
  const newTop=700;run.setViewport(700);run.setGeometry({top:newTop-run.context.scrollY,height:700,scrollHeight:1400});run.dispatch('resize',{},false);run.step(700);run.flush();
  assert(Math.abs(run.section.getBoundingClientRect().top)<=.001);assert.equal(run.context.__storyVault.active,true);assert.equal(run.context.__storyVault.settling,false);
});

test('Surface reset clears entry state and the next story loop can commit again',()=>{
  const run=partialVault({top:620}),send=data=>run.dispatch('message',{source:run.child,origin:'https://vctrsclo.com',data});
  run.dispatch('wheel',inputEvent({deltaY:100}),false);run.step();run.step(950);run.flush();assert.equal(run.context.__storyVault.active,true);
  send({type:'vctrs-vault-surface',cycle:0});
  assert.equal(run.context.__storyVault.resetting,true);assert.equal(run.context.__storyVault.pendingCycle,1);assert.equal(run.context.__storyVault.entryPending,false);assert.equal(run.context.__storyVault.settling,false);
  send({type:'vctrs-vault-ready',cycle:1});
  assert.equal(run.context.__storyVault.cycle,1);assert.equal(run.context.__storyVault.resetting,false);
  assert.equal(run.context.document.activeElement,run.startHeading,'Surface returns focus to the opening heading, leaving Scroll unselected');
  assert.equal(run.startHeading.focusOptions.preventScroll,true,'focus must not move the restored opening');
  assert.match(story,/<h1 id="brand-title" class="sr-only" tabindex="-1">/);
  run.setScroll(80);run.dispatch('scroll',{});
  assert.equal(run.context.__storyVault.entryPending,false,'Surface carried the previous loop intent into the rebuilt story');
  assert.equal(run.context.__storyVault.settling,false);
  run.setScroll(30);run.dispatch('scroll',{});run.dispatch('wheel',inputEvent({deltaY:100}),false);run.step();
  assert.equal(run.context.__storyVault.settling,true,'second loop did not rearm the entry commitment');
  run.step(950);run.flush();assert.equal(run.context.__storyVault.active,true);assert.equal(run.context.__storyVault.cycle,1);
});

console.log(JSON.stringify({passed,limits:'Focused VM/static navigation lifecycle checks; browser history journey is separate. No form transport.'}));
