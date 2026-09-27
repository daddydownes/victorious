'use strict';
// Idempotent, fail-closed migration of the existing guided sources only.
const fs=require('node:fs'),assert=require('node:assert/strict');
const file='tools/guided/journey.js';
let js=fs.readFileSync(file,'utf8');
function replace(old,next){assert.equal(js.split(old).length,2,'Unexpected source around '+old.slice(0,80));js=js.replace(old,()=>next)}
if(!js.includes('function entryGeometry(){')){
replace(`const topOf=el=>el.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;
function stops(){
 const height=panel.clientHeight,first=topOf(signup),overview=topOf(invitation),end=Math.max(overview,overview+invitation.offsetHeight-height);`,
`// Scroll offsets change every frame; section geometry does not. Sample before
// painting and invalidate on actual layout changes, not on each scroll event.
let geometry=null;
function entryGeometry(){
 if(geometry)return geometry;
 const origin=panel.getBoundingClientRect().top,top=panel.scrollTop,height=panel.clientHeight;
 const first=signup.getBoundingClientRect().top-origin+top,overview=invitation.getBoundingClientRect().top-origin+top,length=invitation.offsetHeight;
 const end=Math.max(overview,overview+length-height);`);
replace(` return list.filter((point,i)=>!i||point.top-list[i-1].top>3);
}
function eligible()`,
` geometry={height,first,overview,length,points:list.filter((point,i)=>!i||point.top-list[i-1].top>3)};
 return geometry;
}
function stops(){return entryGeometry().points}
function invalidateGeometry(){geometry=null;queue()}
function eligible()`);
replace(` const top=panel.scrollTop,section=topOf(invitation),height=panel.clientHeight;
 if(!photosWarmed&&top>=topOf(signup)-2&&window.__vaultCamera)`,
` const {overview:section,height,first,length}=entryGeometry(),top=panel.scrollTop;
 if(!photosWarmed&&top>=first-2&&window.__vaultCamera)`);
replace(`(top-section)/Math.max(1,invitation.offsetHeight-height)`,`(top-section)/Math.max(1,length-height)`);
replace(` scene.style.setProperty('--vault-progress',progress.toFixed(4));scene.style.setProperty('--vault-title-opacity',Math.max(0,1-progress*1.7).toFixed(4));`,
` const progressValue=progress.toFixed(4),titleValue=Math.max(0,1-progress*1.7).toFixed(4);
 if(scene.style.getPropertyValue('--vault-progress')!==progressValue)scene.style.setProperty('--vault-progress',progressValue);
 if(scene.style.getPropertyValue('--vault-title-opacity')!==titleValue)scene.style.setProperty('--vault-title-opacity',titleValue);`);
replace(`top<section+invitation.offsetHeight&&!panel.inert`,`top<section+length&&!panel.inert`);
replace(`panel.addEventListener('scroll',queue,{passive:true});
addEventListener('resize',()=>{
 if(!move`,
`panel.addEventListener('scroll',queue,{passive:true});
// Content, font, keyboard and orientation changes can move the named stops.
// ResizeObserver is deliberately not attached to the scrolling photo plane.
if(window.ResizeObserver){
 const geometryObserver=new ResizeObserver(invalidateGeometry);
 for(const element of [panel,signup,invitation,panel.querySelector('.collection-screen')])if(element)geometryObserver.observe(element);
}
if(window.visualViewport)window.visualViewport.addEventListener('resize',invalidateGeometry);
if(document.fonts)document.fonts.ready.then(invalidateGeometry);
addEventListener('resize',()=>{
 geometry=null;
 if(!move`);
replace(`new MutationObserver(()=>{if(panel.inert)reset();queue()}).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});`,
`new MutationObserver(()=>{geometry=null;if(panel.inert)reset();queue()}).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});`);
fs.writeFileSync(file,js);
}
const cssFile='tools/guided/journey.css';let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('Park the covered legacy seam')){
css+=`\n/* Park the covered legacy seam, not the visible collection/Vault effects.
   Its left/background/filter animations otherwise keep doing layout and paint
   underneath the fixed current journey. Geometry and artwork stay untouched. */
body:is(.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *,
body:is(.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *::before,
body:is(.next-drop-landed,.next-vault-opening,.next-vault-open,.world-active) .seamsec *::after{animation-play-state:paused!important}\n`;
fs.writeFileSync(cssFile,css);
}
console.log('Applied scoped scroll performance migration; timing and artwork unchanged.');
