const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const photos=JSON.parse(html.match(/var PHOTOS=(\[.*?\]);/s)[1]);
const heights=vm.runInNewContext(html.match(/var PHOTO_NH=(\[.*?\]);/s)[1]);
const plane=JSON.parse(html.match(/var PLANE=(\{.*?\});/s)[1]);
const original=JSON.parse(cp.execFileSync('git',['show','7d1ee6ea276215e4020b0b069c136264e5e08f60:index.html'],{cwd:root,maxBuffer:5e6}).toString().match(/var PHOTOS=(\[.*?\]);/s)[1]);
assert.equal(photos.length,32);assert.equal(heights.length,32);
for(let i=0;i<17;i++)for(const key of ['x','y','w','rot','z'])assert.equal(photos[i][key],original[i][key],`Original slot ${i} ${key}`);
const boxes=photos.map((p,i)=>{const w=p.w+2,h=p.w*heights[i]/620+2,a=p.rot*Math.PI/180;const rw=Math.abs(w*Math.cos(a))+Math.abs(h*Math.sin(a)),rh=Math.abs(h*Math.cos(a))+Math.abs(w*Math.sin(a));return {left:p.x+w/2-rw/2,right:p.x+w/2+rw/2,top:p.y+h/2-rh/2,bottom:p.y+h/2+rh/2};});
const gap=(a,b)=>Math.hypot(Math.max(0,a.left-b.right,b.left-a.right),Math.max(0,a.top-b.bottom,b.top-a.bottom));
const nearest=[];
for(let i=17;i<32;i++){
 const b=boxes[i];assert(b.left>=0&&b.top>=0&&b.right<=plane.w&&b.bottom<=plane.h,'Rotated added photo stays inside pan bounds');
 for(let j=0;j<i;j++)assert(gap(b,boxes[j])>=40,`Unwanted overlap/tight gap ${i}/${j}: ${gap(b,boxes[j])}`);
 const d=Math.min(...boxes.slice(0,17).map(a=>gap(a,b)));assert(d<=300,`Photo ${i} is too far from original collection: ${d}`);nearest.push(Math.round(d));
}
const visited=new Set([0]);let more=true;while(more){more=false;for(let i=0;i<32;i++)if(!visited.has(i)&&[...visited].some(j=>gap(boxes[i],boxes[j])<=300)){visited.add(i);more=true;}}
assert.equal(visited.size,32,'Every tile belongs to one connected collection');
assert(photos.slice(17).some(p=>p.x<420)&&photos.slice(17).some(p=>p.x>3400)&&photos.slice(17).some(p=>p.y<420)&&photos.slice(17).some(p=>p.y>3150),'Additions surround all four sides');
assert(html.includes('px=(vw-3781*S)/2')&&html.includes('py=(vh-3557*S)/2'),'Original start centre retained on both axes');
console.log('PASS: original17 fixed;15 additions surround all sides; no added overlap; single connected collection; nearest original gaps '+nearest.join(',')+'px; bounds '+plane.w+'x'+plane.h);
