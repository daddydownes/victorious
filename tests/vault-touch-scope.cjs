// This correction changes touch ownership, not presentation or downstream flows.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const baseline='9bb78db',read=p=>fs.readFileSync(p,'utf8'),old=p=>cp.execFileSync('git',['show',baseline+':'+p],{encoding:'utf8'});
const guide=read('tools/guided/journey.js'),prior=old('tools/guided/journey.js'),html=read('index.html');
const start='// One owner guides',end='// Product delivery starts';
assert.equal(guide.slice(0,guide.indexOf(start)),prior.slice(0,prior.indexOf(start)),'Signup/keyboard controller changed');
assert.equal(guide.slice(guide.indexOf(end)),prior.slice(prior.indexOf(end)),'Product, Surface or game flow changed');
assert(html.includes(guide),'Generated guide is stale');
const strip=s=>s.replace(/<script data-demo="guided-chapters">[\s\S]*?<\/script>/,'<guided-script>');
assert.equal(strip(html),strip(old('index.html')),'Root camera, image delivery, markup or presentation changed');
for(const p of ['tools/guided/journey.css','tools/guided/collection.html','tools/guided/chapters.html','tools/guided/game-preview.html','assets/delivery/game-preview.html','CNAME','.nojekyll','google303d59fed389923f.html'])assert.equal(read(p),old(p),p+' changed');
assert.equal(cp.execFileSync('git',['diff','--name-only',baseline,'--','assets','photos','*.mp4'],{encoding:'utf8'}).trim(),'','Media changed');
console.log('PASS touch scope: only entry controller changes; presentation, camera, media, image loader, signup, archive, Surface, game and hosting preserved.');
