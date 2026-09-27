const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const base='fa03b08cecfc65a6ea73e29fbc44bc123fb0a429';
const old=p=>cp.execFileSync('git',['show',base+':'+p],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const generated=s=>s.replace(/<(style|script) data-demo="guided-chapters">[\s\S]*?<\/\1>/g,'<guided-source>');
let root=generated(read('index.html'));
root=root.replace('      if(fPaused) stopFlapLoop(); else startFlapLoop();\n','')
 .replace('if(!flapOpen || reduced || document.hidden || fPaused) return;','if(!flapOpen || reduced || document.hidden) return;')
 .replace('if(!flapOpen || reduced || document.hidden || fPaused)return;','if(!flapOpen || reduced || document.hidden)return;')
 .replace("if(FG.state==='play'){ fPaused=true; stopFlapLoop(); }","if(FG.state==='play') fPaused=true;")
 .replace('if(fPaused || reduced){ stopFlapLoop(); return; } // paused scenes need no scheduled frames','if(fPaused || reduced) return; // no layout reads while the world is paused')
 .replace('if(fPaused || reduced){ stopFlapLoop(); return; } // also retire a resize/stall-induced loop','if(fPaused || reduced) return; // paused world is unchanged; no full-canvas redraw')
 .replace('fAccumulator=0;flapDraw(flapSize());stopFlapLoop();}});','fAccumulator=0;flapDraw(flapSize());}});');
assert.equal(root,generated(old('index.html')),'Unexpected root change outside scheduler gates');
const added=" // Collection and signup are wholly above the viewport at the overview.\n // Pause their shared light cycle together; resume before reverse reveal.\n panel.classList.toggle('entry-content-offscreen',top>=section);\n";
assert.equal(read('tools/guided/journey.js').replace(added,''),old('tools/guided/journey.js'),'Entry timing, input, Surface and preview controllers must remain unchanged');
const css=read('tools/guided/journey.css'),original=old('tools/guided/journey.css');assert(css.startsWith(original),'Existing visual CSS changed');
assert.equal((css.slice(original.length).match(/animation-play-state:paused!important/g)||[]).length,2);
assert(!/(?:filter|color|transform|duration)\s*:/.test(css.slice(original.length)),'Performance extension must not retune visible effects');
for(const p of ['CNAME','.nojekyll','google303d59fed389923f.html','tools/guided/collection.html','tools/guided/chapters.html','tools/guided/game-preview.html','assets/delivery/game-preview.html'])assert.equal(read(p),old(p),p+' changed');
const media=cp.execFileSync('git',['diff','--name-only',base,'--','assets','photos','*.mp4'],{encoding:'utf8'}).trim();assert.equal(media,'','Media bytes must not change');
console.log('PASS: only scheduler gates and fully invisible animation suspension changed; visible CSS, media, markup, physics and scroll timing preserved.');
