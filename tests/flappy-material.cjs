'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let gradients = 0;
function spyContext(actions, images) {
  const gradient = { addColorStop() {} };
  let alpha = 1, clipped = false;
  let matrix=[1,0,0,1,0,0];
  const stack = [];
  return {
    save() { stack.push({alpha, clipped, matrix:matrix.slice()}); actions?.push('save'); }, restore() { const state=stack.pop();if(state){alpha=state.alpha;clipped=state.clipped;matrix=state.matrix}actions?.push('restore'); },
    beginPath() { actions?.push('begin'); }, closePath() {},
    moveTo() {}, lineTo() {}, clip() { clipped=true;actions?.push('clip'); }, stroke() { actions?.push('paint'); },
    fill() { actions?.push('paint'); }, fillRect() { actions?.push('paint'); }, drawImage(...args) { actions?.push('paint');if(images&&args.length===9){const [a,b,c,d,e,f]=matrix,x=args[5],y=args[6],w=args[7],h=args[8],points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([px,py])=>[a*px+c*py+e,b*px+d*py+f]),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);images.push({alpha,clipped,sx:args[1],sy:args[2],sw:args[3],sh:args[4],x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)})} },
    scale(x,y) { matrix=[matrix[0]*x,matrix[1]*x,matrix[2]*y,matrix[3]*y,matrix[4],matrix[5]]; }, translate(x,y) { matrix=[matrix[0],matrix[1],matrix[2],matrix[3],matrix[4]+matrix[0]*x+matrix[2]*y,matrix[5]+matrix[1]*x+matrix[3]*y]; }, rotate(angle){const [a,b,c,d,e,f]=matrix,cos=Math.cos(angle),sin=Math.sin(angle);matrix=[a*cos+c*sin,b*cos+d*sin,c*cos-a*sin,d*cos-b*sin,e,f]}, createLinearGradient() { gradients++; return gradient; },
    set fillStyle(v) { actions?.push('fill:'+v); }, set strokeStyle(v) { actions?.push('stroke:'+v); }, set lineWidth(v) {},
    set globalAlpha(v) { alpha=v;actions?.push('alpha:'+v); },
    set lineJoin(v) {}, set lineCap(v) {}
  };
}
const document = { createElement() {
  return { width: 0, height: 0, getContext() { return spyContext(); } };
} };
let randomCalls=0;const safeMath=Object.create(Math);safeMath.random=()=>{randomCalls++;return .5};
class TestPath2D { constructor(d){this.d=d} }
const motifAspects=[.83,2.7,6.8,6.3,5.45];
const sandbox = { document, Math:safeMath, Path2D:TestPath2D, VB:{x:0,y:0,w:100,h:100}, FLAP_LOGO_CONTOURS:[[[45,0],[55,0],[55,10],[45,10]],[[10,20],[35,20],[50,80],[65,20],[90,20],[62,100],[38,100]]], FLAPPY_GRAFFITI_ART:{viewBox:[0,0,100,36],motifs:motifAspects.map((aspect,i)=>({id:'motif-'+i,aspect,paths:[{d:'M0 0H100V36H0Z',opacity:i?0.8:1}]}))} };
vm.createContext(sandbox);
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const begin = html.indexOf('/* FLAPPY METAL BEGIN */');
const end = html.indexOf('/* FLAPPY METAL END */');
assert.ok(begin >= 0 && end > begin, 'embedded Flappy metal renderer markers missing');
vm.runInContext(html.slice(begin + '/* FLAPPY METAL BEGIN */'.length, end), sandbox);
const draw = sandbox.flapDrawMetal;
const top = [[10, 0], [70, 0], [70, 80], [61, 92], [19, 92], [10, 80]];

const actions = [];
draw(spyContext(actions), top, { d: 2 }, 'pillar', 0, .1);
assert.equal(actions[0], 'save');
assert.ok(actions.indexOf('clip') >= 0);
assert.ok(actions.slice(0, actions.indexOf('clip')).every(x => x !== 'paint'));
assert.ok(actions.includes('fill:#f0d492'),'face mark uses canonical V gold');
assert.ok(actions.includes('stroke:#f0d492'),'rounded drips use canonical V gold');
assert.equal(actions.at(-1), 'restore');
const firstGradients = gradients;

// Translation, height and phase changes reuse the same width/type material tile.
draw(spyContext([]), top.map(([x, y]) => [x + 100, y + 23]), { d: 2 }, 'pillar', 0, .8);
draw(spyContext([]), [[10, 0], [70, 0], [70, 150], [61, 162], [19, 162], [10, 150]], { d: 2 }, 'pillar', 0, .3);
assert.equal(gradients, firstGradients);

// Angled passage edges are selected for rails on both halves.
assert.ok(draw.passageSegmentCount(top, 0) >= 2);
const bottom = [[19, 100], [61, 100], [70, 112], [70, 220], [10, 220], [10, 112]];
assert.ok(draw.passageSegmentCount(bottom, 1) >= 2);

// Tall pillars distribute all five deterministic marks across their faces. The
// destination rectangles stay inside the already-applied collision clip and
// leave the passage clear on both halves.
const tallTop=[[10,0],[70,0],[70,360],[61,372],[19,372],[10,360]],tallBottom=[[19,100],[61,100],[70,112],[70,472],[10,472],[10,112]],firstMarks=[],secondMarks=[];
draw(spyContext([],firstMarks),tallTop,{d:2,h:720,cssH:720},'pillar',0,.1);draw(spyContext([],firstMarks),tallBottom,{d:2,h:720,cssH:720},'pillar',1,.1);
const graffiti=firstMarks.filter(mark=>mark.alpha===.64);assert.equal(graffiti.length,5);assert(graffiti.every(mark=>mark.clipped),'graffiti escaped the collision-polygon clip');
const upper=graffiti.slice(0,3),lower=graffiti.slice(3),upperCentres=upper.map(mark=>mark.y+mark.h/2);assert(Math.max(...upperCentres)-Math.min(...upperCentres)>tallTop.at(-1)[1]*.4,'upper-pole paint is not distributed across the tall face');assert(upper.every(mark=>mark.y+mark.h<=344),'upper tag entered the 16-unit passage clear strip');assert(lower.every(mark=>mark.y>=128),'lower tag entered the 16-unit passage clear strip');
draw(spyContext([],secondMarks),tallTop,{d:2,h:720,cssH:720},'pillar',0,.9);draw(spyContext([],secondMarks),tallBottom,{d:2,h:720,cssH:720},'pillar',1,.9);assert.deepEqual(secondMarks.filter(mark=>mark.alpha===.64),graffiti,'paint placement changed with animation phase');assert.equal(randomCalls,0,'obstacle decoration consumed random state');

// Degenerate input does not touch canvas state.
const untouched = [];
draw(spyContext(untouched), [[0, 0], [1, 1]], { d: 1 }, 'pillar', 0, 0);
assert.deepEqual(untouched, []);

// Many widths/types remain strictly bounded.
for (let i = 0; i < 90; i++) {
  const w = 20 + i * 3;
  draw(spyContext([]), [[0, 0], [w, 0], [w, 90], [0, 90]], { d: 1 }, i % 2 ? 'arch' : 'slant', 0, 0);
}
assert.equal(draw.cacheSize(), 64);
assert.ok(draw.cacheBytes() <= 16 * 1024 * 1024);
for(const d of [1,1.2,1.5,1.8,2.2])draw(spyContext([]),tallTop,{d,h:720,cssH:720},'pillar',0,0);
assert.equal(draw.graffitiCacheSize(),4);assert.ok(draw.graffitiCacheBytes()<=4*1024*1024);
draw.clearCache();
assert.equal(draw.cacheSize(), 0);
assert.equal(draw.cacheBytes(), 0);
assert.equal(draw.graffitiCacheSize(),0);assert.equal(draw.graffitiCacheBytes(),0);
const backdrop=[];sandbox.flapDrawPaintBackdrop(spyContext(backdrop),420,720);
const backdropAlpha=Number(backdrop.find(value=>value.startsWith('alpha:')).slice(6));assert(backdropAlpha>.02&&backdropAlpha<.08,'backdrop remains a quiet accent');assert.ok(backdrop.includes('fill:#f0d492'));assert.ok(backdrop.includes('stroke:#f0d492'));
console.log('flappy material: clipped canonical paint/drips, backdrop, angled rails and 64-entry cache passed');
