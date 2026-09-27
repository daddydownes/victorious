// One-time candidate assembly; excluded from the clean release.
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
let html=fs.readFileSync('index.html','utf8');
assert.equal(hash(html),'bfef4d4b086834c074274d12bc2e97d93004b99c619ac2dc2c6e13c1e04ce67e','Unexpected baseline; do not overwrite other work');
function one(s,a,b){assert.equal(s.split(a).length,2,'Expected one match: '+a);return s.replace(a,b)}
const pairs=[
["      flapDraw(flapSize());\n      (fPaused?fAction:flapCv).focus({preventScroll:true});","      flapDraw(flapSize());\n      if(fPaused) stopFlapLoop(); else startFlapLoop();\n      (fPaused?fAction:flapCv).focus({preventScroll:true});"],
["      if(!flapOpen || reduced || document.hidden) return;\n      flapRaf=requestAnimationFrame(flapLoop);","      if(!flapOpen || reduced || document.hidden || fPaused) return;\n      flapRaf=requestAnimationFrame(flapLoop);"],
["      if(!flapOpen || reduced || document.hidden)return;\n      if(!flapRaf) flapRaf=requestAnimationFrame(flapLoop);","      if(!flapOpen || reduced || document.hidden || fPaused)return;\n      if(!flapRaf) flapRaf=requestAnimationFrame(flapLoop);"],
["        if(FG.state==='play') fPaused=true;","        if(FG.state==='play'){ fPaused=true; stopFlapLoop(); }"],
["      if(fPaused || reduced) return; // no layout reads while the world is paused","      if(fPaused || reduced){ stopFlapLoop(); return; } // paused scenes need no scheduled frames"],
["      if(fPaused || reduced) return; // paused world is unchanged; no full-canvas redraw","      if(fPaused || reduced){ stopFlapLoop(); return; } // also retire a resize/stall-induced loop"],
["addEventListener('blur',function(){if(flapOpen && FG.state==='play'){fPaused=true;fAccumulator=0;flapDraw(flapSize());}});","addEventListener('blur',function(){if(flapOpen && FG.state==='play'){fPaused=true;fAccumulator=0;flapDraw(flapSize());stopFlapLoop();}});"]
];
for(const [a,b] of pairs)html=one(html,a,b);fs.writeFileSync('index.html',html);
let js=fs.readFileSync('tools/guided/journey.js','utf8');
js=one(js," const entranceOffset=Math.max(0,Math.min(height,section-top));\n scene.style.setProperty"," const entranceOffset=Math.max(0,Math.min(height,section-top));\n // Collection and signup are wholly above the viewport at the overview.\n // Pause their shared light cycle together; resume before reverse reveal.\n panel.classList.toggle('entry-content-offscreen',top>=section);\n scene.style.setProperty");
fs.writeFileSync('tools/guided/journey.js',js);
fs.appendFileSync('tools/guided/journey.css',`\n/* The archive hint is not visible before entry or behind Surface/the game.
   Keep its original keyframes and resume them only in the visible archive. */
body:not(.next-vault-open) #vault .drag-label,
body.world-active #vault .drag-label{
 animation-play-state:paused!important;
}

/* The first two chapters are fully clipped once the overview reaches the top.
   Pause both together so their shared logo/button lighting stays synchronized. */
.entry-content-offscreen :is(.collection-screen,.collection-signup),
.entry-content-offscreen :is(.collection-screen,.collection-signup) *,
.entry-content-offscreen :is(.collection-screen,.collection-signup) *::before,
.entry-content-offscreen :is(.collection-screen,.collection-signup) *::after{
 animation-play-state:paused!important;
}
`);
cp.execFileSync(process.execPath,['tools/build-guided.cjs'],{stdio:'inherit'});
assert.equal(hash(fs.readFileSync('index.html')),'1d459dc30e4a3ced0ec3101e7da23178b4e34ab3e423c98d9cfc1ac554837c95','Candidate differs from reviewed local source');
console.log('Exact reviewed candidate assembled; media, layout and physics unchanged.');
