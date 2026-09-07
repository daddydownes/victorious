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
// Keep the playable game on the production 25-clear course progression. The
// automatic card may cycle the four looks faster, but that preview-only cadence
// must never change the game opened by either Play control.
function tuneGameStages(js) {
  return replace(js, "var FLAP_LAYERS=['FALLING PINS','PINS + SWAY','FINAL LOCK / PINS + SWAY + SQUEEZE'];", "var FLAP_LAYERS=['GOLD ARCHES','SLALOM','FINAL LOCK'];");
}
function tunePreviewStages(js) {
  js = replace(js, "var FLAP_LAYERS=['FALLING PINS','PINS + SWAY','FINAL LOCK / PINS + SWAY + SQUEEZE'];", "var FLAP_LAYERS=['PILLARS','GOLD ARCHES','SLALOM','FINAL LOCK'];");
  js = replace(js, 'function flapLevel(score){return Math.min(3,Math.floor(Math.max(0,score)/25));}', 'function flapLevel(score){return Math.floor(Math.max(0,score)/10)%4;}\n    function flapDifficultyLevel(score){return Math.min(3,Math.floor(Math.max(0,score)/25));}');
  js = replace(js, 'function flapCourseProgress(serial){return Math.min(1,Math.max(0,(serial%25)/24));}', 'function flapCourseProgress(serial){return Math.min(1,Math.max(0,(serial%10)/9));}\n    function flapDifficultyProgress(serial){return Math.min(1,Math.max(0,(serial%25)/24));}');
  js = replace(js, 'var level=flapLevel(score), t=score>=100?1:flapCourseProgress(score);', 'var level=flapDifficultyLevel(score), t=score>=100?1:flapDifficultyProgress(score);');
  js = replace(js, 'var level=flapLevel(serial), t=serial>=100?1:flapCourseProgress(serial);', 'var level=flapDifficultyLevel(serial), t=serial>=100?1:flapDifficultyProgress(serial);');
  js = replace(js, 'var progress=ordinal>=100?1:flapCourseProgress(ordinal);', 'var progress=flapCourseProgress(ordinal);');
  js = replace(js, 'for(var segment=0;segment<4;segment++)', 'for(var segment=0;segment<10;segment++)');
  js = replace(js, '(FG.score-segment*25)/25', '(FG.score-segment*10)/10');
  js = replace(js, "if(FG.score%25===0 && FG.score<=100){", 'if(FG.score%10===0){');
  js = replace(js, "FG.notice=FG.score<100?FLAP_LAYERS[unlocked-1]+' / NOW ACTIVE':'100 CLEARED / FINAL LOCK CONTINUES';", "FG.notice=FLAP_LAYERS[unlocked]+' / NEXT';");
  return js.replaceAll('A new challenge every 25.', 'A new style every 10.');
}
function tunePreviewMarkup(html) {
  html = html.replace(/<div class="flap-progress" aria-hidden="true">[\s\S]*?<\/div>/, '<div class="flap-progress" aria-hidden="true">'+Array.from({length:10},(_,i)=>'<i id="flapProgress'+i+'"></i>').join('')+'</div>');
  html = html.replace(/<div class="flap-milestones" aria-hidden="true">[\s\S]*?<\/div>/, '<div class="flap-milestones" aria-hidden="true">'+Array.from({length:11},(_,i)=>'<span>'+i*10+'</span>').join('')+'</div>');
  return html.replaceAll('A new challenge every 25.', 'A new style every 10.');
}
const rawCore = between(snapshot, '  var COUPON_THRESHOLD=100;', '\n  measure(); updateScroll();');
function removeTrail(js) {
  const start = js.indexOf("      if(FG.state==='play' && !reduced){\n        fctx.strokeStyle='rgba(240,212,146,.20)'");
  const end = js.indexOf('      flapDrawV(s.w*0.24',start);
  if(start<0||end<start)throw Error('V trail renderer anchor missing');
  return js.slice(0,start)+js.slice(end);
}
const core = removeTrail(tuneGameStages(rawCore));
const gameplay = core.slice(0, core.indexOf('    /* ---- overlay open/close:'));
const previewCore = removeTrail(tunePreviewStages(rawCore));
const previewGameplay = previewCore.slice(0, previewCore.indexOf('    /* ---- overlay open/close:'));
const css = between(snapshot, '  /* ---- FLAPPY-V:', '  /* ---- closed + email ---- */');
const markup = between(snapshot, '<div class="flap-overlay"', '<div class="guide-cue');
const previewMarkup = tunePreviewMarkup(markup);
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
// Adapt the host lifecycle separately from the shared course rules above.
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Flappy V automatic preview</title>
<style>${css}${palette}
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}
#flapPlay,.flap-top,.flap-bottom,.flap-panel{display:none!important}
.flap-overlay{display:block!important;position:absolute;pointer-events:none}
</style></head><body><button id="flapPlay" type="button" hidden></button>
${previewMarkup}<span class="flap-source-mark" aria-hidden="true">${logo}</span>
<script>(()=>{
${motion}
// PRODUCTION_GAMEPLAY_START
${previewGameplay}
// PRODUCTION_GAMEPLAY_END
    var requested=false,previewFrames=0,previewFrame=0,previewLast=0,previewAccumulator=0;
    var previewHops=0;
    function previewSpawn(s){
      flapSpawn(s);
      var gate=FG.gates[FG.gates.length-1],route=[.48,.47,.48,.50,.49,.47,.48,.51,.50,.48];
      gate.target=gate.baseY=gate.y=s.h*route[gate.serial%route.length];
      gate.anchor=s.h*route[Math.max(0,gate.serial-1)%route.length];
      // Present the complete shape in the card. The real game's warning/entry
      // motion starts outside the screen and can crop finite jaws in a teaser.
      gate.finalOpening=Math.max(148,gate.finalOpening);
      gate.opening=gate.finalOpening;gate.reveal=1;gate.locked=true;
      flapGateUpdate(gate,s,0);
    }
    function previewReset(){
      FG=flapNewState();FG.state='play';FG.score=0;fWon=true;
      var s=flapSize();previewSpawn(s);previewSpawn(s);
      FG.gates[0].x=s.w*.57;FG.gates[1].x=s.w*.98;
      FG.gates.forEach(function(g){flapGateUpdate(g,s,0)});
      FG.y=FG.gates[0].y/s.h+.035;FG.vy=-.62;
      flapResetFrames();flapDraw(s);
    }
    function previewStep(dt,s){
      FG.speed+=(flapPace(FG.score)-FG.speed)*(1-Math.exp(-dt/.65));
      var dx=FG.speed*s.w*dt;
      FG.gates.forEach(function(g){g.x-=dx;flapGateUpdate(g,s,dt);if(!g.counted&&g.x+flapGateWidth(g,s)<s.w*.24){g.counted=true;FG.score++;}});
      FG.gates=FG.gates.filter(function(g){return g.x+flapGateWidth(g,s)>-10});
      if(!FG.gates.length||FG.gates[FG.gates.length-1].x<s.w*.6)previewSpawn(s);
      var next=FG.gates.find(function(g){return g.x+flapGateWidth(g,s)>s.w*.24-FLAP_LOGO_RADIUS;});
      var target=next?next.y/s.h:.48;
      // Steer only by choosing when to tap. Position is never pulled toward a
      // gate or reset at the bottom of an arc: every hop uses game physics.
      if(FG.vy>=0&&FG.y>target+.035){FG.vy=-.62;previewHops++;}
      FG.vy=Math.min(.70,FG.vy+2.60*dt);FG.y+=FG.vy*dt;
      var rotation=-.35+(FG.vy+.62)/1.32*1.31;
      FG.rot+=Math.max(-.35,Math.min(.35,(rotation-FG.rot)*Math.min(1,10*dt)));
      fSimTime+=dt;flapSaveFrame();
    }
    function previewDraw(now){
      previewFrame=0;if(!requested||document.hidden||reduced)return;
      var dt=previewLast?Math.min(.04,(now-previewLast)/1000):0;previewLast=now;
      var s=flapSize();previewAccumulator+=dt;
      while(previewAccumulator+1e-10>=1/120){previewStep(1/120,s);previewAccumulator=Math.max(0,previewAccumulator-1/120);}
      flapEffects(dt,s);flapDraw(s,previewAccumulator*120);previewFrames++;
      previewFrame=requestAnimationFrame(previewDraw);
    }
    function previewSync(){
      var run=requested&&!document.hidden&&!reduced;
      if(!run){if(previewFrame)cancelAnimationFrame(previewFrame);previewFrame=0;previewLast=0;previewAccumulator=0;return;}
      if(!previewFrame)previewFrame=requestAnimationFrame(previewDraw);
    }
    addEventListener('message',function(e){if(e.source===parent&&e.origin===location.origin&&e.data&&e.data.type==='vctrs-preview'){requested=e.data.active===true;previewSync()}});
    document.addEventListener('visibilitychange',previewSync);
    refreshGameMotion=previewSync;
    addEventListener('resize',function(){if(FG)flapDraw(flapSize())});
    window.__flap={state:function(){return FG&&FG.state},score:function(){return FG&&FG.score},dbg:function(){return FG}};
    window.__preview={active:function(){return !!previewFrame},frames:function(){return previewFrames},hops:function(){return previewHops}};
    previewReset();parent.postMessage({type:'vctrs-preview-ready'},location.origin);
  }
})();</script></body></html>`;
}
module.exports = { integrate, preview, core, gameplay, previewGameplay, storyCore, css, markup, tuneGameStages, tunePreviewStages, removeTrail, tunePage:html=>removeTrail(tuneGameStages(html)) };
