'use strict';
// Narrow, fail-closed migration for the September 27 scroll repair.
// This is run in an isolated branch; the ordinary builder remains authoritative.
const fs = require('node:fs'), assert = require('node:assert/strict');
const jsPath = 'tools/guided/journey.js', cssPath = 'tools/guided/journey.css';
let js = fs.readFileSync(jsPath, 'utf8').replace(/\r\n/g, '\n');
let css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');
function replaceOnce(from, to) {
  assert.equal(js.split(from).length, 2, 'Expected one unchanged source anchor: ' + from.slice(0, 100));
  js = js.replace(from, to);
}
if (!js.includes('// Entry geometry changes with layout, not with each scroll frame.')) {
  replaceOnce("const topOf=el=>el.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;\nfunction stops(){\n const height=panel.clientHeight,first=topOf(signup),overview=topOf(invitation),end=Math.max(overview,overview+invitation.offsetHeight-height);", `// Entry geometry changes with layout, not with each scroll frame.
// Sample all rectangles together; never read them after this frame's scroll write.
let entryGeometry=null;
function geometry(){
 if(entryGeometry)return entryGeometry;
 const panelTop=panel.getBoundingClientRect().top,scrollTop=panel.scrollTop,height=panel.clientHeight;
 const first=signup.getBoundingClientRect().top-panelTop+scrollTop,overview=invitation.getBoundingClientRect().top-panelTop+scrollTop,sectionHeight=invitation.offsetHeight;
 const end=Math.max(overview,overview+sectionHeight-height);`);
  replaceOnce(" return list.filter((point,i)=>!i||point.top-list[i-1].top>3);\n}\nfunction eligible()", " entryGeometry={height,first,overview,sectionHeight,points:list.filter((point,i)=>!i||point.top-list[i-1].top>3)};\n return entryGeometry;\n}\nfunction stops(){return geometry().points}\nfunction invalidateGeometry(){entryGeometry=null;queue()}\nfunction eligible()");
  replaceOnce(" const top=panel.scrollTop,section=topOf(invitation),height=panel.clientHeight;\n if(!photosWarmed&&top>=topOf(signup)-2", " const layout=geometry(),top=panel.scrollTop,section=layout.overview,height=layout.height;\n if(!photosWarmed&&top>=layout.first-2");
  replaceOnce("(top-section)/Math.max(1,invitation.offsetHeight-height)", "(top-section)/Math.max(1,layout.sectionHeight-height)");
  replaceOnce("top<section+invitation.offsetHeight&&!panel.inert", "top<section+layout.sectionHeight&&!panel.inert");
  replaceOnce("addEventListener('resize',()=>{\n if(!move&&!touchCount&&eligible())", "addEventListener('resize',()=>{\n entryGeometry=null;\n if(!move&&!touchCount&&eligible())");
  replaceOnce("document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();else queue()});\nnew MutationObserver(()=>{if(panel.inert)reset();queue()}).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});", `document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();else invalidateGeometry()});
new MutationObserver(()=>{entryGeometry=null;if(panel.inert)reset();queue()}).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});
// Font loading, form receipts, keyboard fitting and responsive layout may change
// the landings without a window resize. ResizeObserver refreshes the cache before
// the next paint; scrolling and decorative animation do not invalidate it.
if(window.ResizeObserver){
 const observer=new ResizeObserver(invalidateGeometry);
 [panel,signup,invitation,panel.querySelector('.collection-screen')].filter(Boolean).forEach(el=>observer.observe(el));
}else{
 // Older engines retain the original always-current measurement path.
 panel.addEventListener('scroll',()=>{entryGeometry=null},{passive:true});
}
if(document.fonts){document.fonts.ready.then(invalidateGeometry);document.fonts.addEventListener?.('loadingdone',invalidateGeometry)}
panel.addEventListener('focusin',invalidateGeometry);panel.addEventListener('focusout',invalidateGeometry);`);
  fs.writeFileSync(jsPath, js);
}
const pauseRule = `
/* The retained legacy seam is fully covered throughout the current journey.
   Its scan still animates 'left', causing layout even though nobody can see it.
   Pause only those retired decorations; keep all visible lighting and timing. */
body:is(.next-drop-entering,.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *,
body:is(.next-drop-entering,.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *::before,
body:is(.next-drop-entering,.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *::after{animation-play-state:paused!important}
`;
if (!css.includes('Its scan still animates')) fs.writeFileSync(cssPath, css + pauseRule);
console.log('Prepared bounded geometry cache and covered-legacy animation suspension. No gesture, easing, media, markup or artwork changes.');
