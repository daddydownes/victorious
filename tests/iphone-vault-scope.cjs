// Preserve the current production design around the two targeted runtime fixes.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const base='4058137';
const old=p=>cp.execFileSync('git',['show',base+':'+p],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const withoutGuide=s=>s.replace(/<script data-demo="guided-chapters">[\s\S]*?<\/script>/,'<guided-script>');
const root=withoutGuide(read('index.html'))
 .replace('      // A derivative may be narrower than its filename because small originals\n      // are never upscaled. Do not re-decode the same selected URL on each pan.\n','')
 .replace('&&!img.src.endsWith(vaultDelivery(img))','')
 .replace('if(vaultCameraActive || dragging || inertia','if(dragging || inertia')
 .replace('critical zoom/pan/coast path','critical pan/coast path');
assert.equal(root,withoutGuide(old('index.html')),'Root changes must be limited to entry, duplicate delivery and dust work');
const prefix=s=>s.slice(0,s.indexOf('// One owner guides'));
const suffix=s=>s.slice(s.indexOf('// Product delivery starts'));
for(const part of [prefix,suffix])assert.equal(part(read('tools/guided/journey.js')),part(old('tools/guided/journey.js')),'Signup, Surface and game controllers changed');
for(const p of ['tools/guided/journey.css','tools/guided/collection.html','tools/guided/chapters.html','tools/guided/game-preview.html','assets/delivery/game-preview.html','CNAME','.nojekyll','google303d59fed389923f.html'])assert.equal(read(p),old(p),p+' changed');
assert.equal(cp.execFileSync('git',['diff','--name-only',base,'--','assets','photos','*.mp4'],{encoding:'utf8'}).trim(),'','Media must remain unchanged');
console.log('PASS: production markup, CSS, artwork, media, signup, archive geometry, Surface, game and hosting preserved.');
