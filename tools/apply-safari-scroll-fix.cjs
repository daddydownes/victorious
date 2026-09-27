'use strict';
// Idempotent maintenance migration; never modifies media or input tuning.
const fs=require('node:fs'),assert=require('node:assert/strict');
const jsFile='tools/guided/journey.js',cssFile='tools/guided/journey.css';
let js=fs.readFileSync(jsFile,'utf8').replace(/\r\n/g,'\n');
function replace(from,to){assert.equal(js.split(from).length,2,'Patch anchor changed: '+from.slice(0,90));js=js.replace(from,()=>to)}
if(!js.includes('const canObserveLayout=')){
replace("const topOf=el=>el.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;\nfunction stops(){\n const height=panel.clientHeight,first=topOf(signup),overview=topOf(invitation),end=Math.max(overview,overview+invitation.offsetHeight-height);",`// Section offsets do not change when this panel scrolls. Read them together,
// only after layout changes, rather than forcing geometry reads in every frame.
let layout=null;
const canObserveLayout=typeof ResizeObserver==='function';
function invalidateLayout(){layout=null;queue()}
function geometry(){
 if(layout&&canObserveLayout)return layout;
 const panelTop=panel.getBoundingClientRect().top,scroll=panel.scrollTop,height=panel.clientHeight;
 const first=signup.getBoundingClientRect().top-panelTop+scroll;
 const overview=invitation.getBoundingClientRect().top-panelTop+scroll,sectionHeight=invitation.offsetHeight;
 const end=Math.max(overview,overview+sectionHeight-height);`);
replace(" return list.filter((point,i)=>!i||point.top-list[i-1].top>3);\n}\nfunction eligible()",` layout={height,first,overview,sectionHeight,end,points:list.filter((point,i)=>!i||point.top-list[i-1].top>3)};
 return layout;
}
function stops(){return geometry().points}
function eligible()`);
replace(" const top=panel.scrollTop,section=topOf(invitation),height=panel.clientHeight;\n if(!photosWarmed&&top>=topOf(signup)-2&&window.__vaultCamera)"," const top=panel.scrollTop,{overview:section,height,first,sectionHeight}=geometry();\n if(!photosWarmed&&top>=first-2&&window.__vaultCamera)");
replace(" const progress=Math.max(0,Math.min(1,(top-section)/Math.max(1,invitation.offsetHeight-height)));"," const progress=Math.max(0,Math.min(1,(top-section)/Math.max(1,sectionHeight-height)));");
replace(" const visible=top+height>section&&top<section+invitation.offsetHeight&&!panel.inert", " const visible=top+height>section&&top<section+sectionHeight&&!panel.inert");
replace("panel.addEventListener('scroll',queue,{passive:true});\naddEventListener('resize',()=>{\n if(!move", "panel.addEventListener('scroll',queue,{passive:true});\naddEventListener('resize',()=>{\n layout=null;\n if(!move");
replace("document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();else queue()});", "document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();else invalidateLayout()});");
replace("new MutationObserver(()=>{if(panel.inert)reset();queue()}).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});", "new MutationObserver(()=>{layout=null;if(panel.inert)reset();queue()}).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});");
replace("motionPreference.addEventListener('change',()=>{reset();queue()});\nwindow.__vaultEntryGuide", `motionPreference.addEventListener('change',()=>{layout=null;reset();queue()});
// ResizeObserver covers rotation, keyboard fit, late fonts, image sizing and
// changed signup receipts. Scroll/transform-only frames do not invalidate it.
if(canObserveLayout){
 const observer=new ResizeObserver(invalidateLayout);
 for(const element of [panel,panel.querySelector('.collection-screen'),signup,invitation])if(element)observer.observe(element);
}
if(document.fonts){document.fonts.ready.then(invalidateLayout);document.fonts.addEventListener?.('loadingdone',invalidateLayout)}
window.__vaultEntryGuide`);
fs.writeFileSync(jsFile,js);
}
let css=fs.readFileSync(cssFile,'utf8').replace(/\r\n/g,'\n');
if(!css.includes('Retired seam animation work')){
css+=`\n/* Retired seam animation work must not compete with the visible journey.
   This legacy chapter is explicitly aria-hidden while collection/Vault owns
   the screen. Keep its artwork/layout; pause only its inaccessible animations. */
.seam-gold[aria-hidden="true"],
.seam-gold[aria-hidden="true"] *,
.seam-gold[aria-hidden="true"]::before,
.seam-gold[aria-hidden="true"]::after,
.seam-gold[aria-hidden="true"] *::before,
.seam-gold[aria-hidden="true"] *::after{animation-play-state:paused!important}
`;
fs.writeFileSync(cssFile,css);
}
// Test-only corrections: never let screenshot capture resume CSS-paused clocks,
// and keep landscape navigation swipes away from an editable control's hit area.
const perfPath='tests/safari-scroll-performance.cjs';
if(fs.existsSync(perfPath)){
 const before=fs.readFileSync(perfPath,'utf8');
 fs.writeFileSync(perfPath,before.replace(",animations:'disabled'",''));
}
const entryPath='tests/entry-scroll-browser.cjs';
if(fs.existsSync(entryPath)){
 const before=fs.readFileSync(entryPath,'utf8');
 fs.writeFileSync(entryPath,before.replace('const x=view.width*.5,start=view.height*(direction>0?.84:.16)',
  'const x=view.width*(view.width>view.height?.08:.5),start=view.height*(direction>0?.84:.16)'));
}
console.log('Applied geometry caching and retired-seam animation pause; original input thresholds/easing retained.');
