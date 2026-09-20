// Race regressions execute the shipped guided functions with controlled completion.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync(path.join(__dirname,'../tools/guided/journey.js'),'utf8');
function section(a,b){const start=js.indexOf(a),end=js.indexOf(b,start);assert(start>=0&&end>start);return js.slice(start,end)}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
(async()=>{
 const classes=new Set(),pending=[],animations=new Set();
 const c={state:'story',storyVisit:1,motion:{matches:false},story:{classList:{contains:n=>classes.has(n),add:n=>classes.add(n)}},
  portrait:{},$:()=>({}),animations,Promise,unlocks:0,unlockFilmGate(){c.unlocks++},
  animateMoment(){const d=deferred(),a={finished:d.promise};pending.push(d);animations.add(a);return a}};
 vm.createContext(c);vm.runInContext(section('function revealFilm(){','function measureFlow()'),c);
 c.revealFilm();const old=pending.splice(0);assert.equal(c.unlocks,0);
 // Abandon the first visit, begin a new one, then deliver old completion.
 c.storyVisit++;c.state='entry';classes.clear();animations.clear();c.storyVisit++;c.state='story';c.revealFilm();
 old.forEach(d=>d.resolve());await flush();assert.equal(c.unlocks,0,'Abandoned reveal cannot unlock the new loading gate');
 pending.splice(0).forEach(d=>d.resolve());await flush();assert.equal(c.unlocks,1,'Current reveal unlocks');
 // Same-visit media token changes must not discard a legitimate arrival.
 classes.clear();animations.clear();c.revealFilm();c.filmToken=99;pending.splice(0).forEach(d=>d.resolve());await flush();assert.equal(c.unlocks,2);

 const handlers={},frames=new Map(),cancelled=[];let frameId=0;
 const v={addEventListener(n,fn){handlers[n]=fn},cancelVideoFrameCallback(id){cancelled.push(id)},requestVideoFrameCallback(fn){frames.set(++frameId,fn);return frameId},pause(){v.pauses=(v.pauses||0)+1}};
 const media={video:v,filmToken:1,filmFrame:0,filmTimer:17,filmStarting:true,filmRevealed:false,portrait:{classList:{add(){media.painted=true}}},
  clearTimeout(id){media.cleared=id},filmAllowed:()=>true,revealFilm(){media.reveals=(media.reveals||0)+1},hideFilmRetry(){},status(){}};
 vm.createContext(media);vm.runInContext(section('function cancelFilmFrame(){','function failFilm('),media);
 vm.runInContext(section("video.addEventListener('playing',","video.addEventListener('waiting',"),media);
 handlers.playing();const oldFrame=media.filmFrame;media.pauseFilm();handlers.playing();
 frames.get(oldFrame)();assert.equal(media.filmRevealed,false,'A delivered obsolete frame cannot reveal after retry/return');
 assert(cancelled.includes(oldFrame));assert.equal(media.cleared,17);
 frames.get(media.filmFrame)();assert(media.filmRevealed&&media.painted);assert.equal(media.reveals,1);

 const plays=[];const start={filmToken:0,filmStarting:false,video:{paused:true,ended:false,play(){const d=deferred();plays.push(d);return d.promise},pause(){throw Error('Old play completion paused current playback')}},
  filmAllowed:()=>true,prepareFilm(){},bufferLimit(){},pauseFilm(){},failFilm(){throw Error('Unexpected failure')}};
 vm.createContext(start);vm.runInContext(section('async function startFilm(){','function syncFilm()'),start);
 const first=start.startFilm();start.filmToken++;start.filmStarting=false;const second=start.startFilm();
 plays[0].resolve();await first;assert(start.filmStarting,'Obsolete play completion must not clear a new pending play');
 plays[1].resolve();await second;assert.equal(start.filmStarting,false);
 console.log('PASS: obsolete reveal, media frame and play completion are isolated; current visit still reveals.');
})().catch(e=>{console.error(e);process.exitCode=1});
