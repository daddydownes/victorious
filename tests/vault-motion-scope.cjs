// Protect the production design and downstream journeys around the motion fix.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const baseline='d1820a1',old=name=>cp.execFileSync('git',['show',baseline+':'+name],{encoding:'utf8'}),read=name=>fs.readFileSync(name,'utf8');
const html=read('index.html'),prior=old('index.html'),guide=read('tools/guided/journey.js'),oldGuide=old('tools/guided/journey.js');
const guideStart='// One owner guides',guideEnd='// Product delivery starts';
assert.equal(guide.slice(0,guide.indexOf(guideStart)),oldGuide.slice(0,oldGuide.indexOf(guideStart)),'Signup controller changed');
assert.equal(guide.slice(guide.indexOf(guideEnd)),oldGuide.slice(oldGuide.indexOf(guideEnd)),'Downstream journey changed');
assert(html.includes(guide),'Generated controller is stale');
function without(s,start,end){const a=s.indexOf(start),b=s.indexOf(end,a);assert(a>=0&&b>a,start);return s.slice(0,a)+'<allowed change>'+s.slice(b)}
function preserved(s){
 s=s.replace(/<script data-demo="guided-chapters">[\s\S]*?<\/script>/,'<guided-script>');
 s=without(s,"  if(window.visualViewport) visualViewport.addEventListener('resize',",'  /* measure() forces layout');
 s=without(s,'  var vaultImageJobs=','  /* gold dust');
 s=without(s,'  function finishNextDropVaultHandoff(', '  function flyIn(');
 s=without(s,'  function cancelVaultCamera(','  window.__vaultCamera=');
 return s;
}
assert.equal(preserved(html),preserved(prior),'Unrelated root code or design changed');
for(const file of ['tools/guided/journey.css','tools/guided/collection.html','tools/guided/chapters.html','tools/guided/game-preview.html','assets/delivery/game-preview.html','CNAME','.nojekyll','google303d59fed389923f.html'])assert.equal(read(file),old(file),file+' changed');
assert.equal(cp.execFileSync('git',['diff','--name-only',baseline,'--','assets','photos','*.mp4'],{encoding:'utf8'}).trim(),'','Media changed');
console.log('PASS motion scope: camera geometry, markup, CSS, photo quality, media, signup, archive pan, Surface, game and hosting unchanged.');
