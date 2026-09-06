// Production collision helpers and the production SVG; no browser or saved progress.
const assert=require('assert');
const {setup}=require('./flappy-difficulty.cjs');
const {c,s}=setup(420,720);c.FG.y=.5;let checks=0;
assert.equal(c.FLAP_LOGO_CONTOURS.length,2);assert(c.FLAP_LOGO_CONTOURS.every(p=>p.length>20));
// At every flight pose, broad flat poles touch the actual extreme, and clear it
// when separated by .02 logical pixels. This includes the star, not just the V.
for(const rot of [-.35,-.2,0,.3,.6,.96]){
 c.FG.rot=rot;const b=c.flapLogoContours(.5,rot,s);
 for(const top of [true,false]){
  const edge=top?b.top:b.bottom;
  const g={x:60,widthScale:2,top:top?edge:0,bottom:top?720:edge};
  assert(c.flapCollision(g,s),`visible tangent contact ${rot} ${top}`);
  if(top)g.top-=.02;else g.bottom+=.02;
  assert(!c.flapCollision(g,s),`separated silhouette ${rot} ${top}`);checks+=2;
 }
}
c.FG.rot=0;const logo=c.flapLogoContours(.5,0,s);
assert(logo.contours[0].some(p=>p[1]===logo.top),'star is topmost in upright pose');
assert(logo.contours[1].some(p=>p[1]===logo.bottom),'body reaches bottom in upright pose');
// Open centre of the V stays empty, while an interior gold point is solid.
const k=34/c.VB.h,world=(x,y)=>[420*.24+(x-(c.VB.x+c.VB.w/2))*k,360+(y-(c.VB.y+c.VB.h/2))*k];
const square=(p,r=.03)=>[[p[0]-r,p[1]-r],[p[0]+r,p[1]-r],[p[0]+r,p[1]+r],[p[0]-r,p[1]+r]];
assert(!logo.contours.some(p=>c.flapPolygonsTouch(p,square(world(310,300)))),'V centre is empty');
assert(logo.contours.some(p=>c.flapPolygonsTouch(p,square(world(267,350)))),'V stroke is solid');checks+=2;
// Rounded corners are genuinely absent, rather than invisible square hitboxes.
for(const top of [true,false])for(const len of [7,14,220]){
 const g={x:100,widthScale:1.64,top:len,bottom:720-len},poly=c.flapPolePolygon(g,s,top),edge=top?len:720-len;
 assert(!c.flapPolygonsTouch(square([100.05,edge+(top?-.05:.05)],.01),poly));
 assert(c.flapPolygonsTouch(square([141,edge+(top?-.05:.05)],.01),poly));
 assert(poly.length>20,'rounded ends need a continuous sampled contour');
 assert(poly.every(p=>p[0]>=100-1e-9&&p[0]<=182+1e-9&&p[1]>=-1e-9&&p[1]<=720+1e-9));
 const face=poly.filter(p=>Math.abs(p[1]-edge)<1e-9);
 assert(face.length>=2,'rounded end retains a flat central contact face');checks+=5;
}
// Crossing edges, collinear tangency, containment, disjoint polygons.
assert(c.flapPolygonsTouch([[0,0],[4,0],[4,1],[0,1]],[[1,-1],[2,-1],[2,2],[1,2]]));
assert(c.flapPolygonsTouch(square([0,0],1),square([2,0],1)));
assert(!c.flapPolygonsTouch(square([0,0],1),square([2.001,0],1)));
assert(c.flapPolygonsTouch(square([0,0],1),square([0,0],.1)));checks+=4;
// Repeated identical pose reuses cached contour storage; broad-phase far poles miss.
const cached=c.flapLogoContours(.5,0,s);assert.strictEqual(cached,c.flapLogoContours(.5,0,s));
assert(!c.flapCollision({x:400,widthScale:1,top:350,bottom:370},s));checks+=2;
// Every finite rail is the shared render/collision polygon. Its mouth stays
// open, its interior is solid, and the surrounding fullscreen space stays safe.
let finitePoses=0,apertureSamples=0;
for(const [w,h] of [[320,507],[375,667],[667,375],[1440,594]])for(const score of [25,50,75,99]){
 const {c,s}=setup(w,h);c.FG.score=score;c.flapSpawn(s);const g=c.FG.gates[0];
 Object.assign(g,{y:360,baseY:360,target:360,locked:true,reveal:1,opening:g.finalOpening});c.flapGateUpdate(g,s,0);
 g.x=s.w*.24-c.flapGateWidth(g,s)/2;
 const rails=c.flapHazardPolygons(g,s);assert.equal(rails.length,2);
 for(const rail of rails){assert(rail.length>=4);assert(rail.every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])));assert(rail.every(p=>p[1]>0&&p[1]<s.h),'finite rail must not extend to viewport edge');}
 for(const rot of [-.35,0,.3,.96]){
  c.FG.rot=rot;c.FG.y=.5;assert(!c.flapCollision(g,s),'channel centre is an actual opening');
  for(const y of [35,685]){c.FG.y=y/s.h;assert(!c.flapCollision(g,s),'finite rail has no invisible exterior walls');}
  const a=c.flapAperture(g,s,.5);for(const y of [a.top-12,a.bottom+12]){c.FG.y=y/s.h;assert(c.flapCollision(g,s),'real rail interior hits actual V');}finitePoses++;
 }
 // A presented pose must translate the same polygons, without changing shape.
 const pose={x:g.x+7,y:g.y+11,top:g.top+11,bottom:g.bottom+11,opening:g.opening};
 const shifted=c.flapHazardPolygons(g,s,pose);
 rails.forEach((poly,i)=>poly.forEach((p,j)=>{assert(Math.abs(shifted[i][j][0]-p[0]-7)<1e-8);assert(Math.abs(shifted[i][j][1]-p[1]-11)<1e-8);}));
 // Center aperture agrees with polygon surfaces at every authored cross-section.
 for(const u of g.kind==='IRIS'?c.flapAperture.irisProfile.map(k=>k[0]):[0,.22,.78,1]){const a=c.flapAperture(g,s,u),x=g.x+u*c.flapGateWidth(g,s);assert(rails[0].some(p=>Math.abs(p[0]-x)<1e-8&&Math.abs(p[1]-a.top)<1e-8));assert(rails[1].some(p=>Math.abs(p[0]-x)<1e-8&&Math.abs(p[1]-a.bottom)<1e-8));}
 // Independent linear interpolation of polygon vertices must equal the
 // aperture everywhere, including the new iris tooth and mouth-flare knots.
 const face=g.kind==='IRIS'?rails[0].length-2:rails[0].length/2;
 for(let n=0;n<=1000;n++){
  const u=n/1000,x=g.x+u*c.flapGateWidth(g,s),a=c.flapAperture(g,s,u);
  let j=0;while(j<face-2&&x>rails[0][j+1][0])j++;
  for(const side of [0,1]){const p=rails[side][j],q=rails[side][j+1],y=p[1]+(q[1]-p[1])*(x-p[0])/(q[0]-p[0]);assert(Math.abs(y-(side?a.bottom:a.top))<1e-8,'every collision edge matches aperture');}
  assert(a.bottom-a.top>=g.opening-1e-8,'fangs preserve authored minimum passage');apertureSamples++;
 }
 if(g.kind==='IRIS'){
  for(const u of [.34,.66]){const a=c.flapAperture(g,s,u);assert(Math.abs(a.bottom-a.top-g.opening)<1e-8);}
  const a=c.flapAperture(g,s,.5);assert(Math.abs(a.bottom-a.top-g.opening-48)<1e-8);
  assert.equal(face,29,'sampled rounded lobes match the shared aperture');
  for(const rail of rails){const back=rail.slice(face);assert.equal(back.length,2,'straight solid outer jaw back');}
 }
 checks+=12;
}
console.log(JSON.stringify({checks,finitePoses,apertureSamples,contours:c.FLAP_LOGO_CONTOURS.map(p=>p.length),flatteningBoundLogicalPixels:.5*34/357.7,result:'pass'}));
