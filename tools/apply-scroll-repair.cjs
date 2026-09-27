'use strict';
// One-time, guarded maintenance patch. Runtime sources stay in tools/guided/.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),jsPath=path.join(root,'tools/guided/journey.js'),cssPath=path.join(root,'tools/guided/journey.css');
let js=fs.readFileSync(jsPath,'utf8'),css=fs.readFileSync(cssPath,'utf8');
const marker='// Cache entry geometry until layout actually changes, never on scroll alone.';
if(!js.includes(marker)){
 const replace=(oldText,newText)=>{assert.equal(js.split(oldText).length,2,'Expected exactly one source match: '+oldText.slice(0,100));js=js.replace(oldText,newText)};
 replace("const topOf=el=>el.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;\nfunction stops(){\n const height=panel.clientHeight,first=topOf(signup),overview=topOf(invitation),end=Math.max(overview,overview+invitation.offsetHeight-height);",`${marker}
let geometry=null;
function invalidateGeometry(){geometry=null}
function readGeometry(){
 if(geometry)return geometry;
 // Group layout reads before this controller writes scroll position or styles.
 const height=panel.clientHeight,scroll=panel.scrollTop,origin=panel.getBoundingClientRect().top;
 const first=signup.getBoundingClientRect().top-origin+scroll,overview=invitation.getBoundingClientRect().top-origin+scroll;
 const sectionHeight=invitation.offsetHeight,end=Math.max(overview,overview+sectionHeight-height);`);
 replace(" return list.filter((point,i)=>!i||point.top-list[i-1].top>3);\n}\nfunction eligible()", " geometry={height,first,overview,sectionHeight,points:list.filter((point,i)=>!i||point.top-list[i-1].top>3)};\n return geometry;\n}\nfunction stops(){return readGeometry().points}\nfunction eligible()");
 replace(" const top=panel.scrollTop,section=topOf(invitation),height=panel.clientHeight;\n if(!photosWarmed&&top>=topOf(signup)-2", " const {height,first,overview:section,sectionHeight}=readGeometry(),top=panel.scrollTop;\n if(!photosWarmed&&top>=first-2");
 replace("(top-section)/Math.max(1,invitation.offsetHeight-height)","(top-section)/Math.max(1,sectionHeight-height)");
 replace("top<section+invitation.offsetHeight&&!panel.inert", "top<section+sectionHeight&&!panel.inert");
 replace("function reset(){\n if(move){const target=stops()", "function reset(){\n invalidateGeometry();\n if(move){const target=stops()");
 replace("panel.addEventListener('scroll',queue,{passive:true});\naddEventListener('resize',()=>{", "panel.addEventListener('scroll',queue,{passive:true});\nfunction layoutChanged(){invalidateGeometry();queue()}\nif(window.ResizeObserver){\n const layoutObserver=new ResizeObserver(layoutChanged);\n [panel,panel.querySelector('.collection-screen'),signup,invitation].filter(Boolean).forEach(el=>layoutObserver.observe(el));\n}\nif(document.fonts){document.fonts.ready.then(layoutChanged);document.fonts.addEventListener?.('loadingdone',layoutChanged)}\naddEventListener('resize',()=>{\n invalidateGeometry();");
 replace("new MutationObserver(()=>{if(panel.inert)reset();queue()})", "new MutationObserver(()=>{invalidateGeometry();if(panel.inert)reset();queue()})");
}
const cssMarker='/* Retired chapters retain geometry, but no longer run invisible CSS keyframes. */';
if(!css.includes(cssMarker))css+='\n'+cssMarker+`\n:is(.next-drop-entering,.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *,
:is(.next-drop-entering,.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *::before,
:is(.next-drop-entering,.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *::after,
:is(.next-drop-landed,.next-vault-open,.world-active) #stage *,
:is(.next-drop-landed,.next-vault-open,.world-active) #stage *::before,
:is(.next-drop-landed,.next-vault-open,.world-active) #stage *::after{
 animation-play-state:paused!important;
}
`;
fs.writeFileSync(jsPath,js);fs.writeFileSync(cssPath,css);
console.log('Applied scroll layout cache and retired-chapter CSS suspension; no gesture constants, artwork or animation definitions changed.');
