// Production collision helpers and the production SVG; no browser or saved progress.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const d=html.match(/class="vmark"[^>]*>[\s\S]*?<path d="([^"]+)"/)[1];
const start=html.indexOf('    /* Flatten the actual filled SVG once.');
const end=html.indexOf('    // persistent bests + coupon unlock',start);
const c={Math,_vp:{getAttribute:()=>d},VB:{x:170.4,y:94.8,w:295.5,h:357.7},vh:()=>34,flapGateWidth:g=>50*g.widthScale,FG:{y:.5,rot:0}};
vm.createContext(c);vm.runInContext(html.slice(start,end),c);
const s={w:420,h:720};let checks=0;
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
// Beveled corners are genuinely absent, rather than invisible square hitboxes.
for(const top of [true,false])for(const len of [7,14,220]){
 const g={x:100,widthScale:1.64,top:len,bottom:720-len},poly=c.flapPolePolygon(g,s,top),edge=top?len:720-len;
 assert(!c.flapPolygonsTouch(square([100.05,edge+(top?-.05:.05)],.01),poly));
 assert(c.flapPolygonsTouch(square([141,edge+(top?-.05:.05)],.01),poly));
 const bevel=6*Math.min(1,len/14);
 assert(Math.abs(poly[top?2:2][1]-(edge+(top?-bevel:bevel)))<1e-10);checks+=3;
}
// Crossing edges, collinear tangency, containment, disjoint polygons.
assert(c.flapPolygonsTouch([[0,0],[4,0],[4,1],[0,1]],[[1,-1],[2,-1],[2,2],[1,2]]));
assert(c.flapPolygonsTouch(square([0,0],1),square([2,0],1)));
assert(!c.flapPolygonsTouch(square([0,0],1),square([2.001,0],1)));
assert(c.flapPolygonsTouch(square([0,0],1),square([0,0],.1)));checks+=4;
// Repeated identical pose reuses cached contour storage; broad-phase far poles miss.
const cached=c.flapLogoContours(.5,0,s);assert.strictEqual(cached,c.flapLogoContours(.5,0,s));
assert(!c.flapCollision({x:400,widthScale:1,top:350,bottom:370},s));checks+=2;
console.log(JSON.stringify({checks,contours:c.FLAP_LOGO_CONTOURS.map(p=>p.length),flatteningBoundLogicalPixels:.5*34/357.7,result:'pass'}));
