// Exercise the actual game pause paths with counted scheduler handles.
const assert=require('node:assert/strict');
const {setup}=require('./flappy-difficulty.cjs');
for(const mode of ['button','keyboard','blur','hidden','resize','stall','motion']){
 const {c,elements,events,time}=setup();let serial=0;
 const frames=new Set(),timers=new Set();
 c.requestAnimationFrame=()=>{const id=++serial;frames.add(id);return id};
 c.cancelAnimationFrame=id=>frames.delete(id);
 c.setInterval=()=>{const id=++serial;timers.add(id);return id};
 c.clearInterval=id=>timers.delete(id);
 c.flapStart();c.startFlapLoop();assert.equal(frames.size,1);assert.equal(timers.size,1);
 if(mode==='button')c.flapPauseFn();
 if(mode==='keyboard')events.keydown({key:'p',repeat:false,preventDefault(){}});
 if(mode==='blur')events.blur();
 if(mode==='hidden'){c.document.hidden=true;events.visibilitychange();c.document.hidden=false;events.visibilitychange()}
 if(mode==='resize'){elements.flap.clientWidth=667;elements.flap.clientHeight=375;c.flapSize()}
 if(mode==='stall'){time(240);c.flapTick()}
 if(mode==='motion'){c.reduced=true;c.refreshGameMotion();c.reduced=false;c.refreshGameMotion()}
 assert(c.fPaused,mode+' must pause the run');
 assert.equal(frames.size,0,mode+': paused game schedules no animation frame');
 assert.equal(timers.size,0,mode+': paused game schedules no watchdog');
 const before=JSON.stringify(c.FG);time(5000);c.flapTap();
 assert(!c.fPaused,mode+': explicit resume restores play');assert.equal(JSON.stringify(c.FG),before,mode+': resume is not an extra flap');
 assert.equal(frames.size,1);assert.equal(timers.size,1);
 c.startFlapLoop();assert.equal(frames.size,1);assert.equal(timers.size,1);
 c.flapCloseFn();assert.equal(frames.size,0);assert.equal(timers.size,0);
 console.log('PASS',mode,'pause: 0 frames + 0 timers; explicit resume: 1 + 1; close: 0 + 0');
}
