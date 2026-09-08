// Builds the current root journey. Legacy build-experience.cjs is for /experience/.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=path.join(__dirname,'guided');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let chapters=fs.readFileSync(path.join(source,'chapters.html'),'utf8');
const preview=fs.readFileSync(path.join(source,'game-preview.html'),'utf8');
chapters=chapters.replace(/(<script[^>]*id="worldPreviewSource"[^>]*>)[\s\S]*?(<\/script>)/,(_,a,b)=>a+JSON.stringify(preview).replace(/</g,'\\u003c')+b);
fs.writeFileSync(path.join(source,'chapters.html'),chapters);
html=html.replace(/<!-- VCTRS_WORLD_START -->[\s\S]*?<!-- VCTRS_WORLD_END -->/,()=>'<!-- VCTRS_WORLD_START -->\n'+chapters+'\n<!-- VCTRS_WORLD_END -->');
for(const [tag,file]of [['style','journey.css'],['script','journey.js']])html=html.replace(new RegExp('<'+tag+' data-demo="guided-chapters">[\\s\\S]*?<\\/'+tag+'>'),()=>'<'+tag+' data-demo="guided-chapters">'+fs.readFileSync(path.join(source,file),'utf8')+'</'+tag+'>');
for(const [i,m]of [...html.replace(/<!--[\s\S]*?-->/g,'').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())if(m[1].trim())new vm.Script(m[1],{filename:'root-script-'+i});
assert.ok(html.includes("var LIST_URL='https://formsubmit.co/ajax/"));
assert.ok(!/DEMO ONLY|Demo preview · no email|<meta name="robots" content="noindex/.test(html));
assert.ok(html.includes("window.dispatchEvent(new Event('vctrs:surface'))"));
assert.equal(fs.readFileSync(path.join(root,'CNAME'),'utf8').trim(),'vctrsclo.com');
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Guided production build passed: scripts, live signup, indexing, same-document Surface and domain.');
