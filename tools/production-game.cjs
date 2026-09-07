// The production snapshot is the sole source of the playable game, including
// physics, four courses, collision silhouettes, materials, panels and rewards.
const fs = require('node:fs');
const path = require('node:path');
const snapshot = fs.readFileSync(path.join(__dirname, 'vault-source.html'), 'utf8').replace(/\r\n/g, '\n');
function between(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw Error('Production game source anchor missing: ' + start);
  return text.slice(a, b);
}
function replace(text, from, to) {
  if (!text.includes(from)) throw Error('Production game adapter anchor missing: ' + from);
  return text.replace(from, to);
}
const core = between(snapshot, '  var COUPON_THRESHOLD=100;', '\n  measure(); updateScroll();');
const gameplay = core.slice(0, core.indexOf('    /* ---- overlay open/close:'));
const css = between(snapshot, '  /* ---- FLAPPY-V:', '  /* ---- closed + email ---- */');
const markup = between(snapshot, '<div class="flap-overlay"', '<div class="guide-cue');
const logo = snapshot.match(/class="film-logo"[\s\S]*?(<svg[\s\S]*?<\/svg>)/)[1];
const palette = `.flap-overlay{--ink:#0b0a08;--bone:#efe9dc;--bone-dim:#b9b0a0;--gold:#d4af5f;--gold-hot:#f0d492;--line:rgba(212,175,95,.25);z-index:10000}
body.flap-game-locked{overflow:hidden!important}
.flap-overlay,.flap-overlay *{box-sizing:border-box}
.flap-overlay button{touch-action:manipulation}
.flap-source-mark{position:absolute;width:0;height:0;overflow:hidden;pointer-events:none}`;
const motion = `var motionQuery=matchMedia('(prefers-reduced-motion: reduce)'),reduced=motionQuery.matches;
var refreshGameMotion=function(){};
function refreshMotionPreference(){reduced=motionQuery.matches;refreshGameMotion();}
motionQuery.addEventListener('change',refreshMotionPreference);`;
// Adapt only the host lifecycle. The gameplay block above stays byte-identical.
function storyCore() {
  let js = replace(core, 'function flapOpenFn(){', 'function flapOpenFn(event){');
  js = replace(js, 'flapFocus=flapPlay;', 'flapFocus=event&&event.currentTarget||flapPlay;');
  js = replace(js, "document.body.classList.add('locked');", "document.body.classList.add('flap-game-locked'); storyGameLock(true);");
  js = replace(js, "document.body.classList.remove('locked');", "document.body.classList.remove('flap-game-locked'); storyGameLock(false);");
  js = replace(js, "flapPlay.addEventListener('click',flapOpenFn);", "flapPlay.addEventListener('click',flapOpenFn);\n    document.getElementById('journey-play').addEventListener('click',flapOpenFn);");
  js = replace(js, 'paused:function(){return fPaused;}', 'paused:function(){return fPaused;}, isOpen:function(){return flapOpen;}');
  return js;
}
const lifecycle = `var storyGameBackground=[];
function storyGameLock(locked){
  flapOverlay.setAttribute('aria-hidden',String(!locked));
  if(locked){
    storyGameBackground=Array.from(document.body.children).filter(function(el){return el!==flapOverlay&&!/^(SCRIPT|STYLE)$/.test(el.tagName)}).map(function(el){return [el,el.inert]});
    storyGameBackground.forEach(function(item){item[0].inert=true});
  }else{
    flapOverlay.getAnimations().forEach(function(animation){animation.cancel()});
    storyGameBackground.forEach(function(item){item[0].inert=item[1]});storyGameBackground=[];
  }
}`;
function storyGame() {
  return `<!-- PRODUCTION_GAME_START: extracted from the pinned production vault source -->
<style>${css}${palette}</style>
${markup.replace('aria-modal="true"', 'aria-modal="true" aria-hidden="true"')}
<span class="flap-source-mark" aria-hidden="true">${logo}</span>
<script>(()=>{
${motion}
${lifecycle}
// PRODUCTION_GAME_CORE_START
${storyCore()}
// PRODUCTION_GAME_CORE_END
})();</script>
<!-- PRODUCTION_GAME_END -->`;
}
function integrate(story) {
  const start = story.indexOf('<!-- Actual FLAPPY-V extracted');
  const end = story.indexOf('</script>', start) + '</script>'.length;
  if(start < 0 || end < start) throw Error('Obsolete story game not found');
  return story.slice(0,start) + storyGame() + story.slice(end);
}
// The non-interactive card shares the actual renderer and authored portal data.
// Its small visual pilot never writes best scores or runs the playable lifecycle.
function preview() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flappy V automatic preview</title>
<style>${css}${palette}
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}
#flapPlay,.flap-top,.flap-bottom,.flap-panel{display:none!important}
.flap-overlay{display:block!important;position:absolute;pointer-events:none}
</style></head><body><button id="flapPlay" type="button" hidden></button>
${markup}<span class="flap-source-mark" aria-hidden="true">${logo}</span>
<script>(()=>{
${motion}
// PRODUCTION_GAMEPLAY_START
${gameplay}
// PRODUCTION_GAMEPLAY_END
    var requested=false,previewFrames=0,previewTime=0,previewFrame=0,previewLast=0;
    function previewReset(){
      FG=flapNewState();FG.state='play';FG.score=0;fWon=true;
      var s=flapSize();flapSpawn(s);flapSpawn(s);
      FG.gates[0].x=s.w*.57;FG.gates[1].x=s.w*.98;
      FG.gates.forEach(function(g){flapGateUpdate(g,s,0)});
      FG.y=FG.gates[0].y/s.h;flapResetFrames();flapDraw(s);
    }
    function previewDraw(now){
      previewFrame=0;if(!requested||document.hidden||reduced)return;
      var dt=previewLast?Math.min(.04,(now-previewLast)/1000):0;previewLast=now;previewTime+=dt;
      var s=flapSize(),dx=flapPace(FG.score)*s.w*dt;
      FG.gates.forEach(function(g){g.x-=dx;flapGateUpdate(g,s,dt);if(!g.counted&&g.x+flapGateWidth(g,s)<s.w*.24){g.counted=true;FG.score++;}});
      FG.gates=FG.gates.filter(function(g){return g.x+flapGateWidth(g,s)>-10});
      if(!FG.gates.length||FG.gates[FG.gates.length-1].x<s.w*.6)flapSpawn(s);
      var next=FG.gates.find(function(g){return !g.counted}),target=next?next.y/s.h:.45;
      FG.y+=(target-FG.y)*(1-Math.exp(-dt*4));FG.rot=Math.sin(previewTime*5)*.12;
      flapEffects(dt,s);flapDraw(s);previewFrames++;
      if(FG.score>=100)previewReset();
      previewFrame=requestAnimationFrame(previewDraw);
    }
    function previewSync(){
      var run=requested&&!document.hidden&&!reduced;
      if(!run){if(previewFrame)cancelAnimationFrame(previewFrame);previewFrame=0;previewLast=0;return;}
      if(!previewFrame)previewFrame=requestAnimationFrame(previewDraw);
    }
    addEventListener('message',function(e){if(e.source===parent&&e.origin===location.origin&&e.data&&e.data.type==='vctrs-preview'){requested=e.data.active===true;previewSync()}});
    document.addEventListener('visibilitychange',previewSync);
    refreshGameMotion=previewSync;
    addEventListener('resize',function(){if(FG)flapDraw(flapSize())});
    window.__flap={state:function(){return FG&&FG.state},score:function(){return FG&&FG.score},dbg:function(){return FG}};
    window.__preview={active:function(){return !!previewFrame},frames:function(){return previewFrames}};
    previewReset();parent.postMessage({type:'vctrs-preview-ready'},location.origin);
  }
})();</script></body></html>`;
}
module.exports = { integrate, preview, core, gameplay, storyCore, css, markup };
