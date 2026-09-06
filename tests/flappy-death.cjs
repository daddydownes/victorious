'use strict';
const assert=require('node:assert/strict');
const {setup}=require('./flappy-difficulty.cjs');
for(const y of [.05,.5,.98])for(const hz of [30,60,120,144]){
 const {c,s,time}=setup();c.flapStart();c.FG.y=y;c.FG.gates=[];c.FG.spawnT=100;
 c.flapDie(s);assert.equal(c.FG.state,'dying');assert.equal(c.FG.flash,0);
 const start=c.FG.y;
 c.flapAdvance(s,.05);assert(c.FG.y<start,'small continuous recoil');
 time(1000);c.flapTap();assert.equal(c.FG.state,'dying','hit input cannot restart');
 for(let i=0;i<Math.ceil(.8*hz);i++)c.flapAdvance(s,1/hz);
 assert.equal(c.FG.state,'dead','bounded ending at every height/cadence');
 assert(c.FG.deadT>=.78);assert.equal(c.FG.score,0);
 c.flapTap();assert.equal(c.FG.state,'play','retry works after ending');
}
console.log('PASS: death recoil, bounded duration, input lock and retry across 12 height/cadence cases');
