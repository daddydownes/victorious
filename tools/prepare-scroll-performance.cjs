'use strict';
// One-time migration used by isolated validation, never loaded by the website.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const accepted={'tools/guided/journey.js':['31130232cfe20650c7c5537059cec6a0aebc5efd73c1180ab0951ecb2ce9950b','10b880293017eea17827c623ba32f24b60901a28751369ff7e86cfa1439d5d6f'],'tools/guided/journey.css':['42e0b92bfdd0b200c669ad9ae7ec4954f211a637d37ede4a13437de69c827117']};
function edit(file,expected,changes){
 let text=fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
 assert(hash(text)===expected||accepted[file].includes(hash(text)),'Unexpected source; review concurrent edits before applying '+file);
 for(const [before,after] of changes){if(text.includes(after))continue;assert.equal(text.split(before).length-1,1,'Patch anchor is not unique: '+before);text=text.replace(before,after)}
 assert.equal(hash(text),accepted[file].at(-1),'Prepared candidate differs from the reviewed final source');
 fs.writeFileSync(path.join(root,file),text);
}
edit('tools/guided/journey.js','b28c333fb6e56c169dca5ee38fd0ed0a1acfac804677b62e66ba94a72a455d5e',[
 ["form.addEventListener('pointerdown',e=>{pointer=e.pointerId;panel.classList.add('email-editing')},{passive:true});",
 "// Only real controls need keyboard/press protection. The receipt and form gaps\n// are chapter-scroll surfaces, not an editing session.\nform.addEventListener('pointerdown',e=>{if(!e.target.closest('input,button,select,textarea,[contenteditable]'))return;pointer=e.pointerId;panel.classList.add('email-editing')},{passive:true});"],
 [`const topOf=el=>el.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;
function stops(){
 const height=panel.clientHeight,first=topOf(signup),overview=topOf(invitation),end=Math.max(overview,overview+invitation.offsetHeight-height);`,
 `// Scroll changes the viewport position, not the chapter offsets. Read their
// geometry together before writes, then reuse it until layout really changes.
// In engines without ResizeObserver keep the original live-measure fallback.
let entryGeometry=null;
const entryResizeObserver=window.ResizeObserver?new ResizeObserver(()=>{entryGeometry=null;queue()}):null;
function geometry(){
 if(entryGeometry&&entryResizeObserver)return entryGeometry;
 const panelTop=panel.getBoundingClientRect().top,top=panel.scrollTop;
 return entryGeometry={height:panel.clientHeight,first:signup.getBoundingClientRect().top-panelTop+top,
  overview:invitation.getBoundingClientRect().top-panelTop+top,size:invitation.offsetHeight};
}
function invalidateGeometry(){entryGeometry=null}
function stops(){
 const {height,first,overview,size}=geometry(),end=Math.max(overview,overview+size-height);`],
 [` const top=panel.scrollTop,section=topOf(invitation),height=panel.clientHeight;
 if(!photosWarmed&&top>=topOf(signup)-2&&window.__vaultCamera){photosWarmed=true;window.__vaultCamera.warm()}`,
 ` const {height,first,overview:section,size}=geometry(),top=panel.scrollTop;
 if(!photosWarmed&&top>=first-2&&window.__vaultCamera){photosWarmed=true;window.__vaultCamera.warm()}`],
 ['(top-section)/Math.max(1,invitation.offsetHeight-height)','(top-section)/Math.max(1,size-height)'],
 ['top<section+invitation.offsetHeight&&!panel.inert','top<section+size&&!panel.inert'],
 [`addEventListener('resize',()=>{
 if(!move&&!touchCount&&eligible()){const point=stops().find(point=>point.key===lastStop);if(point)panel.scrollTop=point.top}`,
 `addEventListener('resize',()=>{
 invalidateGeometry();
 if(!move&&!touchCount&&eligible()){const point=stops().find(point=>point.key===lastStop);if(point)panel.scrollTop=point.top}`],
 [`document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();else queue()});
new MutationObserver(()=>{if(panel.inert)reset();queue()}).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});`,
 `document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();else{invalidateGeometry();queue()}});
new MutationObserver(()=>{invalidateGeometry();if(panel.inert)reset();queue()}).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});
if(entryResizeObserver){
 // The collection precedes signup; a size change there shifts every stop.
 for(const el of [panel,panel.querySelector('.collection-screen'),signup,invitation])if(el)entryResizeObserver.observe(el);
}
if(document.fonts)document.fonts.addEventListener('loadingdone',()=>{invalidateGeometry();queue()});`]
]);
edit('tools/guided/journey.css','a91e48c621679cb28d999034bbcac1690fd9bc21ea3afc0f66d0df6a6610b7c7',[
 ['/* The collection and invitation share one native scroller, including keyboard fit. */',
 `/* The retired seam remains in the document for its geometry and return path.
   Its invisible left/blur/shine animations must not keep laying out and painting
   beneath the active chapter. Visible artwork and its shared clock are untouched. */
#seamGold[aria-hidden="true"],
#seamGold[aria-hidden="true"] *,
#seamGold[aria-hidden="true"] *::before,
#seamGold[aria-hidden="true"] *::after{animation-play-state:paused!important}
/* The collection and invitation share one native scroller, including keyboard fit. */`]
]);
console.log('Prepared hidden-animation, scroll-geometry and receipt-gesture fixes; build and validation required.');
