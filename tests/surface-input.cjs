const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.slice(html.indexOf("  var surfaceBtn=document.getElementById('surfaceBtn');"),html.indexOf('  /* ================= THE NIGHT'));
const trap=html.slice(html.indexOf('  // same trap for the keyboard:'),html.indexOf('  /* Post-Surface scrolling:'));
function setup(){let calls=0;const buttonListeners={},page={},vaultListeners={};const button={addEventListener:(n,f)=>buttonListeners[n]=f,getBoundingClientRect:()=>({left:10,top:10,right:145,bottom:58}),focus(){c.document.activeElement=button}};const vault={addEventListener:(n,f)=>vaultListeners[n]=f,focus(){c.document.activeElement=vault}};
 const c={document:{getElementById:()=>button,activeElement:vault},vault,vaultActive:true,vaultClosing:false,guidePhase:'vault',armVaultClose:()=>calls++,addEventListener:(n,f)=>(page[n]??=[]).push(f)};vm.runInNewContext(source+trap,c);
 function event(n,p={},where='button'){const e={pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientX:35,clientY:30,prevented:false,target:button,preventDefault(){this.prevented=true},...p};if(where==='page')for(const f of page[n]||[])f(e);else (where==='vault'?vaultListeners:buttonListeners)[n]?.(e);return e}return{c,button,vault,event,count:()=>calls};}
for(let i=0;i<50;i++){
 let s=setup();s.event('pointerdown');assert(s.event('pointerup').prevented);assert.equal(s.count(),1);
 for(const end of ['pointercancel','lostpointercapture']){s=setup();s.event('pointerdown');s.event(end);s.event('pointerup');assert.equal(s.count(),0)}
 s=setup();s.event('pointerdown');s.event('pointermove',{clientX:80});s.event('pointerup',{clientX:80});assert.equal(s.count(),0);
 s=setup();s.event('pointerdown');s.event('pointerup',{clientX:5});assert.equal(s.count(),0);
 s=setup();assert(!s.event('keydown',{key:' '},'page').prevented);s.event('click');assert.equal(s.count(),1);assert(s.event('keydown',{key:' ',target:s.vault},'page').prevented);
 s.c.vaultClosing=true;assert(s.event('keydown',{key:' '},'page').prevented);
 s=setup();s.event('keydown',{key:'Tab'},'vault');assert.equal(s.c.document.activeElement,s.button);s.event('keydown',{key:'Tab'},'vault');assert.equal(s.c.document.activeElement,s.vault);
 s=setup();s.event('keydown',{key:'Escape'},'vault');assert.equal(s.count(),1);
}
console.log('PASS x50: Surface tap, cancel, drag, outside release, Space native activation, closing lock, Tab cycle and Escape');
