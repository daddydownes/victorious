// The entry-scroll correction must not alter the hero, archive, Surface or game.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const base='07fb1502c05cf3d4507ed6bdbfe381a4c111d1ab';
const original=file=>cp.execFileSync('git',['show',base+':'+file],{cwd:root,encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const current=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
function outsideEntry(html){
 return html.replace(/<(style|script) data-demo="guided-chapters">[\s\S]*?<\/\1>/g,'<guided-source>')
 .replace(/<section class="next-drop"[\s\S]*?(?=<section class="after seamsec">)/,'<collection>');
}
assert.equal(outsideEntry(current('index.html')),outsideEntry(original('index.html')),'Only generated entry sources may change in root');
const delivery=js=>js.slice(js.indexOf('// Product delivery starts'));
assert.equal(delivery(current('tools/guided/journey.js')),delivery(original('tools/guided/journey.js')),'Product, world, Surface and game controllers must stay byte-identical');
assert.equal(current('tools/guided/collection.html'),original('tools/guided/collection.html'),'Collection, signup and invitation markup must stay unchanged');
assert.equal(current('tools/guided/chapters.html'),original('tools/guided/chapters.html'),'Surface/story/game markup must stay unchanged');
for(const file of ['CNAME','.nojekyll','google303d59fed389923f.html','tools/guided/game-preview.html'])assert.equal(current(file),original(file),file+' changed');
console.log('PASS: hero, root archive, Surface, story/game, signup transport, media paths and hosting preserved exactly outside entry sources.');
