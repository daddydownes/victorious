const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),norm=s=>s.replace(/\r\n/g,'\n'),read=p=>norm(fs.readFileSync(path.join(root,p),'utf8'));
const html=read('index.html'),script=html.replace(/<script type="application\/json"[^>]*>[\s\S]*?<\/script>/g,'');
const before=norm(cp.execFileSync('git',['show','973cb2f3faeb4ef09907ff6c33a0631a40b6fdff:index.html'],{cwd:root,encoding:'utf8',maxBuffer:5e6}));
const openingVideo=s=>s.match(/<video id="film"[^>]*\bsrc="([^"]+)"/)[1];
assert.equal(openingVideo(html),openingVideo(before),'Original opening video source preserved');
function section(s,a,b){const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start);return s.slice(start,end)}
assert.equal(section(script,'  var VWHITE=','  function lock()'),section(before,'  var VWHITE=','  function lock()'),'Opening timeline preserved');
assert.equal(section(script,'  var LIST_URL=','  function captureReceipt'),section(before,'  var LIST_URL=','  function captureReceipt'),'Live signup transport preserved');
const photos=s=>JSON.parse(s.match(/var PHOTOS=(\[[^\r\n]*\]);/)[1]).map(({preview,...p})=>p);
const selected=photos(script),liveSlots=photos(before);
assert.equal(selected.length,32,'All selected photographs included');
assert.equal(new Set(selected.map(p=>p.src)).size,32,'No duplicate replacement paths');
assert.equal(new Set(selected.map(p=>p.name)).size,32,'No duplicate source photographs');
selected.forEach(p=>{
 assert.ok(Number.isInteger(p.slot)&&p.slot>=0&&p.slot<17);
 assert.equal(typeof p.added,'boolean');
 const b=liveSlots[p.slot];
 for(const key of ['w','rot','z'])assert.equal(p[key],b[key],'Live tile '+key+' retained');
 if(!p.added){assert.equal(p.x,b.x,'Original horizontal position retained');assert.equal(p.y,b.y,'Original vertical position retained');}
 assert.ok(fs.existsSync(path.join(root,p.src)),'Replacement photograph exists');
});
assert.deepEqual(selected.filter(p=>!p.added).map(p=>p.slot),Array.from({length:17},(_,i)=>i),'Every original slot is preserved');
for(const [a,b]of [['    function flapStep(','    // Cosmetic work'],['    function flapTap(){','    function flapTick(){']])assert.equal(section(script,a,b),section(before,a,b),'Original gameplay preserved');
for(const match of before.matchAll(/<meta property="(?:og:|twitter:)[^>]*>/g))assert.ok(html.includes(match[0]),'Share metadata preserved');
assert.equal(read('CNAME').trim(),'vctrsclo.com');for(const file of ['.nojekyll','google303d59fed389923f.html','robots.txt','sitemap.xml'])assert.ok(fs.existsSync(path.join(root,file)));
assert.ok(!/<meta name="robots" content="noindex|DEMO ONLY|Demo preview · no email|flapDrawPaintBackdrop/.test(html));
const preview=read('tools/guided/game-preview.html');assert.equal(JSON.parse(html.match(/<script[^>]*id="worldPreviewSource"[^>]*>([\s\S]*?)<\/script>/)[1]),preview);
assert.equal(section(html,'<script data-demo="guided-chapters">','</script>').slice('<script data-demo="guided-chapters">'.length),read('tools/guided/journey.js'));
let assets=0;
for(const doc of [html,preview])for(const m of doc.matchAll(/<(?:img|video|source|script|link|image)\b[^>]*?\b(?:src|href)="([^"]+)"/g)){
 const ref=m[1];if(/^(?:https?:|data:|#|about:)/.test(ref))continue;const relative=decodeURIComponent(ref.split(/[?#]/)[0]);let current=root;
 for(const bit of relative.split('/').filter(Boolean)){assert.ok(fs.readdirSync(current).includes(bit),'Case-sensitive asset missing: '+ref);current=path.join(current,bit)}assert.ok(fs.statSync(current).isFile());assets++;
}
console.log('guided source PASS: original opening, signup, physics, 32 selected photos in preserved live slots, metadata, hosting files, embedded source and '+assets+' asset references.');
