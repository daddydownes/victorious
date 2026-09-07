const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const scrollCue = '<span class="scroll-label">Scroll</span><span class="scroll-line" aria-hidden="true"></span>';
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r\n/g, '\n');
function replace(source, from, to) {
  if (!source.includes(from)) throw new Error('Missing source anchor: ' + from.slice(0, 90));
  return source.replace(from, to);
}

let vault = read('vault-source.html');
const exactLogo = read('experience-source.html').match(/class="brand-logo[\s\S]*?(<svg[\s\S]*?<\/svg>)/)[1];
const exactV = vault.match(/class="film-logo"[\s\S]*?(<svg[\s\S]*?<\/svg>)/)[1];
// One finish for the returning V and its destination, sourced from the original brand token.
const logoGold = vault.match(/--gold-hot:\s*(#[\da-fA-F]{6})/)[1];
const logoRGB = logoGold.slice(1).match(/../g).map(v=>parseInt(v,16)).join(',');
const logoFinish = `color:${logoGold};filter:drop-shadow(0 0 3.5px rgba(${logoRGB},.30))`;
vault = replace(vault, '<div class="stage" id="stage"', '<div class="surface-story" aria-hidden="true"><div class="surface-story-logo">'+exactV+'</div><div class="surface-story-invitation"><div class="surface-story-cue">'+scrollCue+'</div></div></div><div class="stage" id="stage"');
vault = replace(vault, '</style>', `
.surface-story{position:fixed;inset:0;z-index:20;display:none;place-items:center;pointer-events:none;background:#000;color:#d4af5f}
body.surfaced .surface-story{display:grid}.surface-story-logo{width:min(72vw,1020px,135svh);aspect-ratio:766/285;opacity:0;filter:drop-shadow(0 0 28px rgba(212,175,95,.22))}.surface-story-logo svg{width:100%;height:100%;display:block}
.surface-story-invitation{position:absolute;left:6%;right:6%;bottom:max(7svh,env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:18px;font:12px/1.5 Arial,sans-serif;letter-spacing:.12em;opacity:0}.surface-story-invitation p{margin:0;letter-spacing:.17em;text-transform:uppercase}.surface-story-invitation span{display:flex;align-items:center;min-height:44px;padding:8px 20px;text-decoration:underline;text-underline-offset:7px;text-decoration-color:#d4af5f70}
.surface-story-invitation{gap:34px}.surface-story-invitation p{transform:translateY(-12px)}.surface-story-invitation svg{width:24px;height:46px}.surface-story-invitation .scroll-wheel{animation:scroll-stroke 2.4s cubic-bezier(.22,.61,.36,1) infinite}
@keyframes scroll-stroke{0%,12%{transform:translateY(0);opacity:0}25%{opacity:1}65%{transform:translateY(10px);opacity:0}100%{transform:translateY(10px);opacity:0}}
@media(prefers-reduced-motion:reduce){.surface-story-invitation .scroll-wheel{animation:none}}
@media(max-width:700px){.surface-story-logo{width:min(82vw,135svh)}.surface-story-invitation{bottom:max(8svh,env(safe-area-inset-bottom));gap:10px}.surface-story-invitation p{font-size:11px;letter-spacing:.12em}}
@media(max-height:500px){.surface-story{padding-bottom:45px}.surface-story-logo{width:min(56vw,105svh)}.surface-story-invitation{bottom:max(3svh,env(safe-area-inset-bottom));gap:0}.surface-story-invitation p{font-size:10px}.surface-story-invitation span{min-height:38px;font-size:11px}}
.surface-story-cue{display:flex;flex-direction:column;align-items:center;gap:14px}.surface-story-cue .scroll-label{padding:0;min-height:0;font:10px/1.5 Arial,sans-serif;letter-spacing:.23em;text-transform:uppercase;text-decoration:none}.surface-story-cue .scroll-line{position:relative;display:block;width:1px;height:34px;min-height:0;padding:0;overflow:hidden;background:#d4af5f26}.surface-story-cue .scroll-line:after{content:'';position:absolute;inset:0;background:linear-gradient(transparent,#d4af5f);animation:scroll-travel 2.2s cubic-bezier(.65,0,.35,1) infinite}
@keyframes scroll-travel{0%{transform:translateY(-105%)}65%,100%{transform:translateY(105%)}}
@media(prefers-reduced-motion:reduce){.surface-story-cue .scroll-line:after{animation:none}}
.surface-story-logo{width:min(27vw,240px,35svh);aspect-ratio:295.5/357.7;${logoFinish}}
.surface-story-logo svg{color:inherit;filter:none;margin:0}
@media(max-width:700px){.surface-story-logo{width:min(44vw,210px,35svh)}}
@media(max-height:500px){.surface-story-logo{width:min(23vw,27svh)}}
.surface-story-cue .scroll-line{display:none}.surface-story-cue .scroll-label{animation:scroll-word 2.2s ease-in-out infinite}
@keyframes scroll-word{0%,100%{transform:translateY(0);opacity:.55}50%{transform:translateY(4px);opacity:1}}
@media(prefers-reduced-motion:reduce){.surface-story-cue .scroll-label{animation:none}}
/* Match the destination's complete hit area, not only its text baseline. */
.surface-story-cue{box-sizing:border-box;justify-content:center;width:70px;min-height:64px;padding:4px 12px}
.surface-story-cue .scroll-label{animation:none;opacity:.55}
</style>`);
// Keep a pending signup focused and readable, while still preventing duplicate sends.
vault = replace(vault, 'if(button.disabled) return;\n    button.disabled=true; nextDropEmail.setAttribute', "if(nextDropEmail.getAttribute('aria-busy')==='true') return;\n    button.setAttribute('aria-disabled','true'); nextDropEmail.setAttribute");
vault = replace(vault, "button.disabled=false; nextDropEmail.removeAttribute('aria-busy');", "button.removeAttribute('aria-disabled'); nextDropEmail.removeAttribute('aria-busy');");
vault = replace(vault, "var incoming=smooth((t-.32)/.48), settle=1-smooth((t-.32)/.68);", "document.querySelector('.surface-story-logo').style.opacity=smooth((t-.26)/.5);\n      document.querySelector('.surface-story-invitation').style.opacity=smooth((t-.52)/.35);\n      var incoming=smooth((t-.32)/.48), settle=1-smooth((t-.32)/.68);");
vault = replace(vault, "var phase='ready'", "var directVault=location.hash==='#vault';\n  var phase='ready'");
vault = replace(vault, 'if(!reduced){\n    vMeasure();', 'if(!reduced&&!directVault){\n    vMeasure();');
vault = replace(vault, '} else {\n    reveal(wordmark);', '} else if(!directVault) {\n    reveal(wordmark);');
vault = replace(vault, "function enterVaultFromNext(){", "function enterVaultFromNext(immediate){");
vault = replace(vault, 'if(reduced||!movingImg||!movingImg.animate){ land(); return; }', 'if(immediate===true||reduced||!movingImg||!movingImg.animate){ land(); return; }');
// Only the normal boot branch is gated; preference handling elsewhere is intact.
vault = replace(vault, "if(reduced){\n    phase='done'; stage.classList.add('done','cardend');", "if(reduced&&!directVault){\n    phase='done'; stage.classList.add('done','cardend');");
vault = replace(vault, '} else {\n    lock();', '} else if(!directVault) {\n    lock();');
const surfaceStart = vault.indexOf('  function finishSurface(){');
const surfaceEnd = vault.indexOf('  function armVaultClose(){', surfaceStart);
let surface = vault.slice(surfaceStart, surfaceEnd);
surface = replace(surface, "    showCue('Scroll <span class=\"g-chev\">▼</span>');", "    try{history.replaceState(history.state,'',location.pathname+location.search+'#vault');}catch(_history){}\n    location.assign(new URL('experience/', location.href).href);");
vault = vault.slice(0, surfaceStart) + surface + vault.slice(surfaceEnd);
vault = replace(vault, '  measure(); updateScroll();\n})();', `  measure(); updateScroll();
  if(directVault){
    // Reuse the original entry's complete landing/focus/pan lifecycle.
    phase='done'; playWanted=false; resumeFilm=false; film.pause();
    introVHalo.style.opacity='0'; stage.classList.remove('playing');
    stage.classList.add('done','cardend'); showFilmLogo(true);
    // Retain #vault so reload and browser Forward reconstruct the same destination.
    var enterReturnedVault=function(){
      if(document.hidden)return;
      document.removeEventListener('visibilitychange',enterReturnedVault);
      enterVaultFromNext(true);
    };
    document.addEventListener('visibilitychange',enterReturnedVault);
    enterReturnedVault();
  }
  // A cached document may contain the completed Surface frame; rebuild the vault on return.
  addEventListener('pageshow',function(e){if(e.persisted&&location.hash==='#vault')location.reload();});
})();`);

let story = read('experience-source.html');
story = replace(story, exactLogo, exactV);
story = replace(story, 'The original VCTRS brand logo in gold', 'The original V and star brand mark in gold');
story = story.replaceAll('../assets/', 'assets/');
story = replace(story, '<title>VCTRS — For the ones who were there</title>', '<title>VCTRS — For the ones who were there</title><meta name="description" content="A Canberra clothing brand. Drops, pop-ups, music and good food."><link rel="preload" href="assets/cinzel.woff2" as="font" type="font/woff2" crossorigin>');
story = replace(story, '<div class="intro-line">For the ones who were there</div>', '<div class="opening-invitation"><a class="story-cue" href="#portrait" aria-label="Scroll to the story">'+scrollCue+'</a></div>');
story = story.replace(/<figure class="portrait-photo"[\s\S]*?<\/figure>/, '<div class="portrait-photo story-film-wrap"><video id="story-film" muted playsinline preload="none" aria-hidden="true" data-src="assets/story-film.mp4"></video></div><button class="film-toggle" type="button" hidden>Replay film</button>');
story = replace(story, '<h2 id="portrait-title">', '<h2 id="portrait-title" tabindex="-1">');
story = story.replace(/logo\.style\.setProperty\('--logo-y',[^;]+;/, '').replace(/logo\.style\.setProperty\('--logo-scale',[^;]+;/, '');
story = replace(story, "$('.intro-line').style.setProperty('--rule-scale',1-p0*.7);", '');
// Keep the accepted Portrait Depth progress, media geometry and backmark motion intact.
story = replace(story, "portrait.style.setProperty('--portrait-zoom',1+q*.025);", `portrait.style.setProperty('--portrait-zoom',1+q*.025);
const fw=m?90:84,fh=m?76:84,sx=mix(m?66:38,fw,q)/fw,sy=mix(m?59:76,fh,q)/fh,filmW=portrait.clientWidth,cover=Math.max(filmW*fw*sx/1280,h*fh*sy/720)/Math.max(filmW*fw/1280,h*fh/720)*(1+q*.025),filmWrap=portrait.querySelector('.story-film-wrap');
filmWrap.style.width=fw+'%';filmWrap.style.height=fh+'%';filmWrap.style.transform='translate3d('+(filmW*mix(m?28:55,m?5:8,q)/100)+'px,'+(h*mix(m?17:15,m?12:9,q)/100)+'px,0) scale('+sx+','+sy+')';
filmWrap.querySelector('video').style.transform='translateZ(0) scale('+(cover/sx)+','+(cover/sy)+')';`);
story = replace(story, '<button type="button" class="action vault-return" data-vault>Back to the vault</button>', '<a class="action vault-return" href="../#vault">Back to the vault</a>');
story = replace(story, '<a href="./" id="restart-page">', '<a href="../" id="restart-page">');
story = story.replace(/<section class="play-section"[\s\S]*?<\/section>/, `<section class="play-section journey-section" id="play" aria-labelledby="play-title"><div class="play-copy"><h2 id="play-title" data-reveal style="--reveal-delay:90ms">Fly<br>the V.</h2><button id="journey-play" class="journey-button play-cue" type="button" data-reveal style="--reveal-delay:180ms"><span>Play the game</span><svg class="play-cue-arrow" viewBox="0 0 96 64" width="96" height="64" aria-hidden="true" focusable="false"><path class="cue-right" d="M8 47C30 12 56 14 84 28M72 14L84 28L68 32"/><path class="cue-down" d="M24 9C59 6 64 32 47 55M36 50L47 55L55 43"/></svg></button></div><div class="game-shell live-game-shell" data-reveal style="--reveal-delay:140ms"><iframe id="game-preview" title="Automatic Fly the V demonstration" src="game-preview.html" loading="lazy" tabindex="-1" aria-hidden="true"></iframe><button id="flapPlay" class="preview-play" type="button" aria-label="Play Fly the V"></button></div></section>`);
story = replace(story, '>Fly<br>the V.</h2>', '><span class="paint-title-text">Play the game.</span><img class="spray-headline" src="assets/play-the-game-spray-v1.png" alt="" width="1536" height="1024" loading="lazy" decoding="async"></h2>');
story = replace(story, '<span>Play the game</span>', '<span class="sr-only">Play the game</span>');
story = replace(story, 'id="play-title" data-reveal style="--reveal-delay:90ms"', 'id="play-title"');
// Real aerosol pigment, revealed along the shaft and then the two arrowhead strokes.
story = story.replace(/<svg class="play-cue-arrow"[\s\S]*?<\/svg>/, `<span class="play-cue-arrow" aria-hidden="true"><svg class="spray-arrow-art" viewBox="0 0 1280 1280" width="1280" height="1280" focusable="false"><defs><mask id="play-arrow-paint" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="1280"><path class="spray-arrow-shaft" pathLength="100" d="M155 160C580 135 1060 420 795 1090"/><path class="spray-arrow-head" pathLength="100" d="M620 860L795 1090L1010 880"/></mask></defs><image href="assets/play-arrow-spray-v1.png" width="1280" height="1280" mask="url(#play-arrow-paint)"/></svg></span>`);
story = replace(story, "if(reduce.matches){const note=document.createElement('p');note.style.cssText='font:12px/1.6 Arial,sans-serif';note.textContent='Motion is reduced. Playing the game starts movement.';$('#play .play-copy').append(note);}", '');
story = story.replace(/<section class="vault-invite"[\s\S]*?<\/section>/, `<section class="vault-invite journey-section" id="vault-invite" aria-labelledby="vault-title"><div class="vault-story"><h2 id="vault-title"><span class="paint-title-text">Back to the vault</span><img class="spray-headline" src="assets/back-to-the-vault-spray-v1.png" alt="" width="1536" height="1024" loading="lazy" decoding="async"></h2></div><div class="vault-action-group"><a class="action vault-return" href="../#vault"><span>Enter the vault</span><span class="cta-arrow" aria-hidden="true">↗</span></a></div></section>`);
story = replace(story, '<h2 id="ending-title">— and the ones<br>who\'ll say they were.</h2>', '<h2 id="ending-title" class="sr-only">VCTRS — in the vault</h2>');
story = replace(story, 'Back to the beginning ↑</a>', 'Start again <span aria-hidden="true">↺</span></a>');
// Routing to a new document always resets the original journey; storage is optional.
story = story.replace(/document\.getElementById\('restart-page'\)\.addEventListener\('click',[\s\S]*?\}\);window\.__gameInvitation=/,
  "document.getElementById('restart-page').addEventListener('click',e=>{e.preventDefault();window.__vctrsRestarting=true;try{sessionStorage.removeItem('vctrs-live-position');sessionStorage.removeItem('vctrs-manual-restart')}catch{}history.scrollRestoration='manual';const url=new URL('../',location.href);url.hash='';url.search='';location.assign(url.href)});window.__gameInvitation=");
story = replace(story, "const data=await r.json();if(version===null)", "const data=await r.json();if(!Number.isFinite(data.version))return;if(version===null)");
story = replace(story, "setInterval(check,1200);check();window.__vctrsLive", "if(['127.0.0.1','localhost','[::1]'].includes(location.hostname)){setInterval(check,1200);check()}window.__vctrsLive");
story = replace(story, 'pending=false,busy=false;async function check()', 'pending=false,busy=false,lastScroll=0;addEventListener(\'scroll\',()=>{lastScroll=Date.now()},{passive:true});async function check()');
story = replace(story, 'if(pending&&!window.__vctrsRestarting', "if(pending&&Date.now()-lastScroll>1500&&document.getElementById('story-film').paused&&!window.__vctrsRestarting");
story = replace(story, 'visible=entries[0].isIntersecting;', 'visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.12;');
// Scale the complete game surface out of the card instead of clipping away its V.
story = replace(story, "overlay.animate([{clipPath:'inset('+top+'px '+right+'px '+bottom+'px '+left+'px round 4px)'},{clipPath:'inset(0px 0px 0px 0px round 0px)'}],{duration:620,easing:'cubic-bezier(.22,.8,.18,1)'});", "overlay.animate([{transform:'translate('+(r.left+r.width/2-innerWidth/2)+'px,'+(r.top+r.height/2-innerHeight/2)+'px) scale('+(r.width/innerWidth)+','+(r.height/innerHeight)+')'},{transform:'none'}],{duration:480,easing:'cubic-bezier(.22,.8,.18,1)'});");
const entryStart=story.indexOf('let entryRect=null;'),entryEnd=story.indexOf("document.getElementById('restart-page').addEventListener",entryStart);
if(entryStart<0||entryEnd<0)throw new Error('Game entry animation anchors missing');
story=story.slice(0,entryStart)+`[button,document.getElementById('journey-play')].forEach(entry=>{let entryRect=null;entry.addEventListener('click',()=>{entryRect=card.getBoundingClientRect()},{capture:true});entry.addEventListener('click',()=>{overlay.getAnimations().forEach(a=>a.cancel());if(reduce.matches||!entryRect)return;const r=entryRect;overlay.animate([{transform:'translate('+(r.left+r.width/2-innerWidth/2)+'px,'+(r.top+r.height/2-innerHeight/2)+'px) scale('+(r.width/innerWidth)+','+(r.height/innerHeight)+')'},{transform:'none'}],{duration:480,easing:'cubic-bezier(.22,.8,.18,1)'});});});\n`+story.slice(entryEnd);
const css = `
/* Keep the Surface composition aligned, including on systems with classic scrollbars. */
html{scrollbar-gutter:stable}
/* The accepted identity, with a calm opening and a typographic second scene. */
.opening{height:100svh}.opening .brand-stage{position:relative;height:100svh;min-height:0}
.brand-logo.gold-lockup{width:min(72vw,1020px,135svh);transform:none;will-change:auto}
.opening-invitation{position:absolute;left:6%;right:6%;bottom:max(7svh,env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:18px}
.opening-invitation .intro-line{position:static;margin:0;font-size:12px;letter-spacing:.17em;text-align:center}
.story-cue{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 20px;font:12px/1.5 Arial,sans-serif;letter-spacing:.12em;text-underline-offset:7px;text-decoration-color:#d4af5f70}
.story-cue:hover{text-decoration-color:#f0d492;color:#f0d492}
.story-cue{width:48px;height:62px;padding:8px;text-decoration:none}.story-cue svg{width:24px;height:46px}.story-cue .scroll-wheel{animation:scroll-stroke 2.4s cubic-bezier(.22,.61,.36,1) infinite;will-change:transform,opacity}.opening-invitation{gap:34px}.opening-invitation .intro-line{line-height:1.65;transform:translateY(-12px)}
@keyframes scroll-stroke{0%,12%{transform:translateY(0);opacity:0}25%{opacity:1}65%{transform:translateY(10px);opacity:0}100%{transform:translateY(10px);opacity:0}}
@media(prefers-reduced-motion:reduce){.story-cue .scroll-wheel{animation:none}}
.portrait-track{height:220svh}.portrait-stage{display:flex;align-items:center;padding:7vw 6%;isolation:isolate}
.portrait-copy{position:relative;left:auto;top:auto;bottom:auto;width:100%;text-shadow:none;transform:none}
.portrait-copy h2{font-size:clamp(38px,6vw,88px);line-height:1.18;letter-spacing:-.045em}
.portrait-copy h2 span{opacity:1;transform:none}.portrait-copy h2:focus{outline:none}
.story-film-wrap{position:absolute;inset:0;z-index:0;overflow:hidden;clip-path:inset(14% 12%);opacity:.7}.story-film-wrap video{width:100%;height:100%;object-fit:cover;filter:brightness(.62);display:block}.portrait-stage:after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,#000a,#0003 65%),linear-gradient(0deg,#000 0%,transparent 27%,transparent 74%,#000 100%)}
.film-toggle{position:absolute;right:6%;bottom:5%;z-index:6;min-height:44px;padding:8px 14px;border:1px solid #d4af5f55;background:#0009;color:var(--gold);font:12px/1.5 Arial,sans-serif;cursor:pointer}
.film-toggle[hidden]{display:none}
.live-game-shell{transform:none}.play-section{gap:5vw}.preview-play span{font-size:12px;padding:15px 24px}
.vault-return{font-size:12px}.ending-grid img{width:100%;height:100%}
@media(max-width:700px){.brand-logo.gold-lockup{width:min(82vw,135svh)}.opening-invitation{bottom:max(8svh,env(safe-area-inset-bottom));gap:10px}.opening-invitation .intro-line{font-size:11px;letter-spacing:.12em}.portrait-track{height:225svh}.portrait-copy h2{font-size:clamp(24px,7.6vw,47px);line-height:1.25}.preview-play span{font-size:11px}.play-copy h2{max-width:none}}
@media(max-height:500px){.brand-logo.gold-lockup{width:min(56vw,105svh)}.brand-stage{padding-bottom:45px}.opening-invitation{bottom:max(3svh,env(safe-area-inset-bottom));gap:0}.opening-invitation .intro-line{font-size:10px}.story-cue{min-height:38px;font-size:11px}.portrait-track{height:215svh}.portrait-copy h2{font-size:min(5.1vw,9svh);line-height:1.16}}
@media(prefers-reduced-motion:reduce){.portrait-track{height:auto}.portrait-copy h2 span{transform:none!important;opacity:1!important}.portrait-stage{min-height:80svh}.preview-play span{transform:none!important}.vault-return:active{transform:none}.story-film-wrap,.film-toggle{display:none}}
/* Restore the exact accepted Portrait Depth composition; only its medium changes. */
.portrait-track{height:240svh}.portrait-stage{display:block;padding:0}.portrait-stage:after{content:none}
.portrait-copy{position:absolute;left:6%;top:auto;bottom:11%;width:86%;transform:none;text-shadow:0 3px 24px #000}
.portrait-copy h2{font-size:clamp(38px,5.2vw,78px);line-height:1.12;letter-spacing:-.045em}
.story-film-wrap{inset:auto;left:var(--px,55%);top:var(--py,15%);width:var(--pw,38%);height:var(--ph,76%);z-index:2;opacity:1;clip-path:none}
.story-film-wrap video{object-position:50% 50%;filter:none;transform:scale(var(--portrait-zoom,1));transform-origin:50% 0%}
@media(max-width:700px){.portrait-track{height:215svh}.portrait-copy{width:88%;bottom:12%}.portrait-copy h2{font-size:clamp(24px,7.6vw,47px);line-height:1.2}.story-film-wrap{left:var(--px,28%);top:var(--py,17%);width:var(--pw,66%);height:var(--ph,59%)}}
@media(max-height:500px) and (min-width:600px){.portrait-copy{bottom:13%}.portrait-copy h2{font-size:clamp(22px,3.9vw,36px);line-height:1.1}}
@media(prefers-reduced-motion:reduce){.portrait-track{height:auto}.story-film-wrap video{transform:none!important}}
/* Fixed video texture; transform-only panel motion avoids decode-surface resizing. */
.story-film-wrap{left:0;top:0;transform-origin:0 0;will-change:transform;backface-visibility:hidden}
.story-film-wrap video{transform-origin:50% 50%;will-change:transform;backface-visibility:hidden}
.story-cue{display:flex;flex-direction:column;align-items:center;gap:14px;width:70px;height:auto;min-height:64px;padding:4px 12px;font:10px/1.5 Arial,sans-serif;letter-spacing:.23em;text-transform:uppercase}.scroll-line{position:relative;display:block;width:1px;height:34px;overflow:hidden;background:#d4af5f26}.scroll-line:after{content:'';position:absolute;inset:0;background:linear-gradient(transparent,#d4af5f);animation:scroll-travel 2.2s cubic-bezier(.65,0,.35,1) infinite}
@keyframes scroll-travel{0%{transform:translateY(-105%)}65%,100%{transform:translateY(105%)}}
@media(prefers-reduced-motion:reduce){.scroll-line:after{animation:none}}
.brand-logo.gold-lockup{width:min(27vw,240px,35svh);aspect-ratio:295.5/357.7;${logoFinish}}
.brand-logo.gold-lockup svg{color:inherit;filter:none;margin:0}
@media(max-width:700px){.brand-logo.gold-lockup{width:min(44vw,210px,35svh)}}
@media(max-height:500px){.brand-logo.gold-lockup{width:min(23vw,27svh)}}
.play-section{min-height:110svh;padding:100px 7vw 125px;gap:6vw;grid-template-columns:.82fr 1.18fr;background:radial-gradient(ellipse at 78% 52%,#d4af5f09,transparent 54%),#000;isolation:isolate}
.play-copy{max-width:440px}.play-copy .eyebrow{color:#d4af5fa6;margin:0 0 22px}.play-copy h2{font-size:clamp(66px,8.2vw,124px);line-height:.96;letter-spacing:-.055em}.play-copy .game-invitation{font:14px/1.8 Arial,sans-serif;color:#e8dfca;max-width:330px;margin:25px 0 27px}.game-challenge{display:flex;align-items:center;gap:21px;margin:0 0 31px}.game-challenge strong{font:500 clamp(43px,4.8vw,69px)/1 Cinzel,Georgia,serif;letter-spacing:-.07em}.play-copy .game-challenge p{font:12px/1.7 Arial,sans-serif;color:#d4af5fac;margin:0;max-width:190px}
.journey-button{display:inline-flex;align-items:center;justify-content:space-between;gap:36px;min-width:242px;min-height:58px;padding:12px 17px 12px 25px;border:1px solid #d4af5f;border-radius:999px;background:#d4af5f;color:#100d06;font:11px/1.4 Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase;cursor:pointer;transition:background .25s,box-shadow .25s}.cta-arrow{display:grid;place-items:center;flex:none;width:31px;height:31px;border-radius:50%;background:#0000000f;font:20px/1 Arial,sans-serif;transition:transform .3s}.journey-button:hover{background:#e6c878;box-shadow:0 8px 35px #d4af5f16}.journey-button:hover .cta-arrow,.vault-return:hover .cta-arrow{transform:translate(2px,-2px)}
.live-game-shell{aspect-ratio:1.13;overflow:hidden;border-radius:8px;box-shadow:0 0 0 1px #d4af5f20!important}.preview-play span{display:flex;align-items:center;gap:28px;border-radius:999px;border-color:#d4af5f5c;background:#080706df;padding:12px 21px;font-size:10px;backdrop-filter:blur(8px)}.preview-play i{font:18px/1 Arial,sans-serif;font-style:normal}.journey-thread{position:absolute;bottom:0;left:50%;height:72px;width:1px;background:linear-gradient(transparent,#d4af5f65);transform-origin:top;transition:transform 1.2s ease,opacity 1s}
.vault-invite{position:relative;min-height:78svh;padding:115px 9vw 140px;grid-template-columns:1.12fr .88fr;gap:8vw;background:radial-gradient(ellipse at 25% 65%,#d4af5f08,transparent 60%);isolation:isolate}.vault-invite .eyebrow{color:#d4af5f99;margin-bottom:25px}.vault-invite h2{font-size:clamp(48px,6.2vw,90px);line-height:1.03;letter-spacing:-.055em}.vault-invite .vault-description{font:14px/1.85 Arial,sans-serif;color:#ded6c6b0;margin-top:25px}.vault-action-group{align-self:center}.vault-return{display:flex;justify-content:space-between;gap:20px;width:100%;min-width:0;min-height:68px;border:1px solid #d4af5f80;border-radius:999px;padding:13px 18px 13px 29px;font:11px/1.5 Arial,sans-serif;letter-spacing:.14em;background:#d4af5f08;box-shadow:none}.vault-return .cta-arrow{width:39px;height:39px;background:#d4af5f14}.vault-return:hover{background:#d4af5f;color:#080604;border-color:#d4af5f;box-shadow:0 6px 35px #d4af5f16}.vault-action-group>p{text-align:center;font:11px/1.6 Arial,sans-serif!important;color:#d4af5f73!important;margin-top:16px!important}.vault-memory-cue{position:absolute;left:9%;right:9%;bottom:35px;display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid #d4af5f26;font:10px/1.5 Arial,sans-serif;letter-spacing:.15em;text-transform:uppercase;color:#d4af5f92}.vault-memory-cue>span:last-child{font-size:21px}
.journey-motion [data-reveal]{opacity:0;transform:translate3d(0,32px,0);transition:opacity .85s ease,transform .95s cubic-bezier(.22,.8,.18,1);transition-delay:var(--reveal-delay,0ms)}.journey-motion.journey-visible [data-reveal],.journey-motion:focus-within [data-reveal]{opacity:1;transform:none}.journey-motion .journey-thread{opacity:0;transform:scaleY(0)}.journey-motion.journey-visible .journey-thread{opacity:1;transform:scaleY(1)}
@media(max-width:700px){.play-section{min-height:0;padding:80px 7vw 100px;grid-template-columns:1fr;gap:42px}.play-copy{max-width:none}.play-copy h2{font-size:clamp(57px,16vw,90px)}.play-copy h2 br{display:none}.play-copy .game-invitation{margin:20px 0}.game-challenge{margin-bottom:24px}.journey-button{min-height:56px}.live-game-shell{margin:0;aspect-ratio:1.13}.journey-thread{height:46px}.vault-invite{min-height:0;padding:80px 7vw 120px;grid-template-columns:1fr;gap:34px}.vault-invite h2{font-size:clamp(48px,13vw,76px)}.vault-action-group{width:100%;max-width:400px}.vault-return{min-height:62px}.vault-memory-cue{left:7%;right:7%;bottom:25px;font-size:9px}}
@media(max-height:500px) and (min-width:701px){.play-section{padding:65px 6vw 80px;grid-template-columns:1fr 1fr}.play-copy h2{font-size:54px}.game-challenge{margin-bottom:20px}.vault-invite{padding:75px 7vw 110px;min-height:100svh}.vault-invite h2{font-size:54px}}
@media(prefers-reduced-motion:reduce){.journey-motion [data-reveal]{opacity:1;transform:none;transition:none}.journey-thread{transition:none!important;transform:none!important;opacity:1!important}.cta-arrow{transition:none}}
.memory-passage{position:relative;height:165svh;background:#000}.memory-stage{position:sticky;top:0;min-height:0;height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;isolation:isolate}.memory-overline{font:10px/1.5 Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#d4af5f80;margin:0 0 38px}.memory-lines{text-align:center;position:relative;z-index:2}.memory-lines p{font:600 clamp(38px,6.5vw,95px)/1.16 Cinzel,Georgia,serif;letter-spacing:-.055em;margin:0;transform:translate3d(var(--word-x,0px),var(--word-y,0px),0);opacity:var(--word-alpha,1);will-change:transform,opacity}.memory-lines p:nth-child(2){padding:4px 0}.memory-glow{position:absolute;z-index:0;inset:5% 12%;background:radial-gradient(ellipse,#d4af5f10,transparent 64%);transform:scale(var(--memory-glow,1));pointer-events:none}.memory-rule{height:1px;width:min(65vw,780px);margin:42px 0 32px;background:linear-gradient(90deg,transparent,#d4af5f80,transparent);transform:scaleX(var(--memory-rule,.14));transform-origin:center}.memory-next{display:flex;align-items:center;gap:20px;font:10px/1.5 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;color:#d4af5f90;min-height:44px}.memory-next span{font-size:21px;transition:transform .3s}.memory-next:hover span{transform:translateY(4px)}
@media(max-width:700px){.memory-passage{height:145svh}.memory-lines p{font-size:clamp(34px,9.3vw,62px)}.memory-overline{font-size:9px;margin-bottom:30px}.memory-rule{width:78vw;margin:34px 0 24px}.memory-next{font-size:9px}}
@media(max-height:500px){.memory-overline{margin-bottom:18px}.memory-lines p{font-size:min(5.5vw,12svh)}.memory-rule{margin:20px 0 12px}}
@media(prefers-reduced-motion:reduce){.memory-passage{height:auto}.memory-stage{position:relative;min-height:75svh;height:auto;padding:70px 5vw}.memory-lines p{transform:none!important;opacity:1!important;will-change:auto}.memory-glow,.memory-rule{transform:none!important}}
/* Bold matte typography for the new chapters; painted artwork is a real asset. */
.spray-defs{position:absolute;pointer-events:none}.play-section,.vault-invite{background:#000}.memory-glow{display:none}.journey-button:hover,.vault-return:hover,.vault-return:focus-visible{box-shadow:none}
.play-copy h2,.vault-invite h2{font-family:Impact,'Arial Black',sans-serif;font-weight:900;letter-spacing:.005em;line-height:.98;text-transform:uppercase;filter:none}.game-challenge strong{font-family:Impact,'Arial Black',sans-serif;letter-spacing:.01em;filter:none}
.memory-lines{transform:rotate(-3deg)}.memory-lines p{font-family:Impact,'Arial Black',sans-serif;font-weight:900;line-height:1.06;letter-spacing:.015em;text-transform:uppercase;filter:none}.memory-lines:after{content:'';display:block;width:92%;height:13px;margin:22px 0 0 3%;background:#d4af5f;clip-path:polygon(0 39%,15% 16%,37% 28%,61% 0,83% 18%,100% 7%,96% 48%,80% 59%,64% 100%,45% 69%,23% 95%,4% 76%);filter:none;transform:scaleX(var(--memory-rule,.14));transform-origin:left}.memory-rule{background:#d4af5f50;height:1px}.memory-overline{font-weight:700;letter-spacing:.17em;color:#d4af5fa6}
.play-copy h2:after,.vault-invite h2:after{content:'';display:block;width:42%;max-width:185px;height:7px;margin-top:15px;background:#d4af5f;clip-path:polygon(0 35%,24% 10%,59% 25%,100% 0,95% 63%,70% 85%,37% 67%,3% 100%);transform:rotate(-2deg)}
/* Decorative rules and distressed-font simulation removed by user direction. */
.journey-thread,.memory-rule,.scroll-line{display:none!important}.memory-lines:after,.play-copy h2:after,.vault-invite h2:after{content:none}.vault-memory-cue{border:0}.play-copy h2,.vault-invite h2,.game-challenge strong,.memory-lines p{filter:none}.scroll-label{animation:scroll-word 2.2s ease-in-out infinite}
@keyframes scroll-word{0%,100%{transform:translateY(0);opacity:.55}50%{transform:translateY(4px);opacity:1}}
@media(prefers-reduced-motion:reduce){.scroll-label{animation:none}}
.paint-title-text{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}.play-copy #play-title{font-size:0;line-height:0;max-width:420px}.spray-headline{display:block;width:100%;height:auto;filter:none;box-shadow:none;transform:rotate(-3deg)}.memory-next{margin-top:38px}
/* The invitation sits around the painted title, with a single stable paint surface. */
.play-copy{width:100%;max-width:440px;justify-self:center;display:flex;flex-direction:column;align-items:center;text-align:center}
.play-copy #play-title{position:relative;width:100%;margin:0 auto;transform:rotate(-3deg)}
.spray-headline{transform:none}.spray-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.paint-active .spray-headline{visibility:hidden}.game-challenge{justify-content:center}.play-copy .game-challenge p{text-align:left}
.live-game-shell{width:100%;max-width:680px;justify-self:center}.journey-button{max-width:100%}
@media(max-width:860px){.play-section{min-height:0;padding:72px 7vw 96px;grid-template-columns:1fr;gap:36px}.play-copy{max-width:440px}.play-copy #play-title{max-width:350px}.play-copy .eyebrow{margin-bottom:16px}.play-copy .game-invitation{margin:20px 0}.game-challenge{margin-bottom:24px}.live-game-shell{margin:0;max-width:580px}}
@media(prefers-reduced-motion:reduce){.paint-active .spray-headline{visibility:visible}.spray-canvas{display:none}}
/* One quiet, clickable direction into the game; the arrow follows the layout. */
.play-copy .play-cue{min-width:0;min-height:56px;margin-top:18px;padding:4px 10px;gap:8px;border:0;border-radius:0;background:transparent;color:#d4af5f;box-shadow:none;font-weight:600;justify-content:center}
.play-copy .play-cue:hover{background:transparent;color:#f0d492;box-shadow:none}
.play-copy .play-cue:focus-visible{outline:1px solid #d4af5f;outline-offset:5px}
.play-cue-arrow{flex:none;width:84px;height:56px;fill:none;stroke:currentColor;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round;animation:point-to-game 2.4s ease-in-out infinite;animation-play-state:paused}
.journey-visible .play-cue-arrow{animation-play-state:running}.cue-down{display:none}
@keyframes point-to-game{0%,100%{transform:translateX(0);opacity:.7}50%{transform:translateX(7px);opacity:1}}
@keyframes point-down-to-game{0%,100%{transform:translateY(0);opacity:.7}50%{transform:translateY(6px);opacity:1}}
@media(max-width:860px){.play-section{gap:24px}.play-copy .play-cue{flex-direction:column;gap:0;margin-top:14px;padding:6px 16px}.play-cue-arrow{width:72px;height:48px;animation-name:point-down-to-game}.cue-right{display:none}.cue-down{display:block}}
@media(prefers-reduced-motion:reduce){.play-cue-arrow{animation:none!important;opacity:1}}
/* The raster retains genuine overspray and drips; the invisible mask only reveals it. */
.play-cue-arrow{display:block;width:96px;height:96px;stroke:none;fill:none;overflow:visible}
.spray-arrow-art{display:block;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}
.spray-arrow-art mask path{fill:none;stroke:#fff;stroke-width:350;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:100;stroke-dashoffset:0}
.journey-motion .spray-arrow-art mask path{stroke-dashoffset:100}
.journey-visible .spray-arrow-shaft{animation:spray-arrow-on 1.05s .25s ease-out both}
.journey-visible .spray-arrow-head{animation:spray-arrow-on .5s 1.15s ease-out both}
@keyframes spray-arrow-on{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
.play-copy:focus-within .spray-arrow-art mask path{animation:none;stroke-dashoffset:0}
@media(max-width:860px){.play-cue-arrow{width:94px;height:94px}.spray-arrow-art{transform:none}}
@media(prefers-reduced-motion:reduce){.spray-arrow-art mask path{animation:none!important;stroke-dashoffset:0!important}.play-cue-arrow{animation:none!important;opacity:1}}
/* The ending uses the same pigment and one deliberate action, without filler. */
.vault-invite{min-height:66svh;padding-top:85px;padding-bottom:85px}
.vault-story #vault-title{position:relative;width:100%;max-width:490px;font-size:0;line-height:0;transform:rotate(-2deg)}
.vault-return{transition:background-color .2s,color .2s,border-color .2s,transform .16s;touch-action:manipulation}
.vault-return:active{transform:scale(.985);opacity:1}
.vault-return .cta-arrow{transition:transform .2s;background:transparent}
.vault-return:hover .cta-arrow{transform:translate(2px,-2px)}
.ending-copy{justify-content:flex-end}
.ending-copy #restart-page{display:inline-flex;align-items:center;gap:14px;min-height:48px;padding:12px 20px;border:1px solid #d4af5f60;border-radius:999px;font:600 12px/1.5 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;background:#000b;transition:background-color .2s,color .2s,transform .16s;touch-action:manipulation}
.ending-copy #restart-page:hover{background:#d4af5f;color:#000}
.ending-copy #restart-page:active{transform:scale(.985);opacity:1}
.nav a,.closing-footer a{display:inline-flex;align-items:center;min-height:44px}
.story-cue,.film-toggle,.play-cue,.preview-play,#flapClose,.signup-footer button{touch-action:manipulation}
.film-toggle:active,.signup-footer button:active{transform:scale(.985);opacity:1}
.paint-failed .spray-headline{display:none}
.paint-failed .paint-title-text{position:static;width:auto;height:auto;margin:0;overflow:visible;clip-path:none;white-space:normal;display:block;font:900 clamp(34px,6vw,72px)/1.06 Impact,'Arial Black',sans-serif;letter-spacing:.01em;text-transform:uppercase;color:#d4af5f}
.paint-cue-failed .sr-only{position:static;width:auto;height:auto;margin:0;clip-path:none;overflow:visible;font:600 12px/1.5 Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase}
.paint-cue-failed .play-cue-arrow{display:none}
@media(max-width:700px){.vault-invite{min-height:0;padding:58px 7vw 68px;gap:20px}.vault-story #vault-title{max-width:440px}.ending-copy #restart-page{margin-top:0}.nav{top:12px}}
@media(prefers-reduced-motion:reduce){.vault-return,.vault-return .cta-arrow,.ending-copy #restart-page{transition:none}.vault-return:active,.vault-return:hover .cta-arrow,.ending-copy #restart-page:active,.film-toggle:active,.signup-footer button:active{transform:none}}
/* Secondary controls share the vault's quiet gold pill treatment. */
.film-toggle,.signup-footer .action{border-radius:999px;border-color:#d4af5f80;background:#000;color:var(--gold);font:11px/1.5 Arial,sans-serif;letter-spacing:.12em;box-shadow:none;transition:background .2s,color .2s,border-color .2s,transform .15s}
.film-toggle{min-height:48px;padding:12px 18px;touch-action:manipulation}
.film-toggle:hover,.signup-footer .action:hover{background:var(--gold);border-color:var(--gold);color:#000}
.film-toggle:focus-visible,.signup-footer .action:focus-visible{outline:1px solid #f0d492;outline-offset:4px}

.signup-footer .action[aria-disabled=true]{cursor:progress;opacity:1}
@media(prefers-reduced-motion:reduce){.film-toggle,.signup-footer .action{transition:none}}
`;
story = replace(story, '</style></head>', css + '</style></head>');
story = replace(story, 'if(!form.reportValidity()||button.disabled)return;', "if(form.getAttribute('aria-busy')==='true'||!form.reportValidity())return;");
story = replace(story, 'button.disabled=true;', "button.setAttribute('aria-disabled','true');");
story = replace(story, 'button.disabled=false;', "button.removeAttribute('aria-disabled');");
story = replace(story, 'status.textContent="You\'re on the list.";if(input.value.trim()===email)input.value=\'\';', 'if(input.value.trim()===email){status.textContent="You\'re on the list.";input.value=\'\';}else status.textContent=\'\';');
story = replace(story, "catch{status.textContent='Not sent. Please try again.';}", "catch{status.textContent=input.value.trim()===email?'Not sent. Please try again.':'';}");
story = replace(story, "new IntersectionObserver(entries=>", "new IntersectionObserver(entries=>");
story = replace(story, '</body></html>', `<script>(()=>{document.querySelector('.story-cue').addEventListener('click',e=>{e.preventDefault();const h=document.getElementById('portrait-title');document.getElementById('portrait').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});h.focus({preventScroll:true})});
const film=document.getElementById('story-film'),scene=document.getElementById('portrait'),toggle=document.querySelector('.film-toggle'),motion=matchMedia('(prefers-reduced-motion: reduce)'),game=document.getElementById('flapOverlay');let visible=false,finished=false;
const wanted=()=>visible&&!finished&&!motion.matches&&!document.hidden&&!game.classList.contains('on');
function sync(){if(wanted()){if(!film.src)film.src=film.dataset.src;const p=film.play();if(p)p.then(()=>{if(!wanted())film.pause()}).catch(()=>{})}else film.pause()}
toggle.addEventListener('click',()=>{if(!finished)return;film.currentTime=0;finished=false;toggle.hidden=true;sync()});film.addEventListener('ended',()=>{finished=true;toggle.hidden=false});
scene.addEventListener('pointerdown',()=>{if(!finished&&film.paused)sync()},{passive:true});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()}).observe(scene);document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);new MutationObserver(sync).observe(game,{attributes:true,attributeFilter:['class']});
const journeySections=[...document.querySelectorAll('.journey-section')];
const arrowAsset=new Image();arrowAsset.onerror=()=>document.getElementById('journey-play').classList.add('paint-cue-failed');arrowAsset.src='assets/play-arrow-spray-v1.png';
// PAINT_REVEAL_START: trace the original raster lettering, without replacing its texture.
function paintTitle(titleId,sectionId,strokes,brushWidth){
  // Keep paint's per-frame preference reads separate from the film's change listener.
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const title=document.getElementById(titleId),source=title.querySelector('.spray-headline');
  const failed=()=>{title.classList.remove('paint-active');title.classList.add('paint-failed');title.querySelector('.spray-canvas')?.remove()};
  source.addEventListener('error',failed,{once:true});
  if(source.complete&&!source.naturalWidth){failed();return}
  const canvas=document.createElement('canvas'),mask=document.createElement('canvas');
  const ctx=canvas.getContext('2d'),brush=mask.getContext('2d');
  if(!ctx||!brush)return;
  canvas.className='spray-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.width=mask.width=1024;canvas.height=mask.height=683;
  // Each path follows an actual stroke in the supplied 1536 x 1024 artwork.
  const lengths=strokes.map(points=>points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0));
  const total=lengths.reduce((a,b)=>a+b,0);let ready=false,finished=false,progress=0,target=0,frame=0,last=0,paintedAt=0;
  function finish(){finished=true;progress=target=1;title.dataset.paintProgress='1.000';title.classList.remove('paint-active');canvas.remove();if(frame)cancelAnimationFrame(frame);frame=0}
  function desired(){const top=title.getBoundingClientRect().top;return Math.max(0,Math.min(1,(innerHeight*.87-top)/(innerHeight*.55)))}
  function render(p,mist){
    brush.setTransform(1,0,0,1,0,0);brush.clearRect(0,0,1024,683);brush.setTransform(1024/1536,0,0,683/1024,0,0);
    brush.strokeStyle='#fff';brush.lineWidth=brushWidth;brush.lineCap='round';brush.lineJoin='round';brush.shadowColor='#fff';brush.shadowBlur=12;
    let remaining=p*total,tip=null;
    for(let n=0;n<strokes.length&&remaining>0;n++){
      const points=strokes[n];let travel=Math.min(remaining,lengths[n]);brush.beginPath();brush.moveTo(...points[0]);
      for(let i=1;i<points.length&&travel>0;i++){
        const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),f=Math.min(1,travel/length);
        tip=[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];brush.lineTo(...tip);travel-=length;
      }brush.stroke();remaining-=lengths[n];
    }
    // Settle the finest outer speckles before replacing the canvas with the exact PNG.
    if(p>.92){const tail=Math.min(1,(p-.92)/.08);brush.setTransform(1,0,0,1,0,0);brush.globalAlpha=tail*tail*(3-2*tail);brush.fillStyle='#fff';brush.fillRect(0,0,1024,683);brush.globalAlpha=1}
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1024,683);ctx.globalCompositeOperation='source-over';ctx.drawImage(source,0,0,1024,683);
    ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-over';
    // Small matte droplets at the nozzle position; no bloom or decorative rules.
    if(tip&&mist>0){ctx.setTransform(1024/1536,0,0,683/1024,0,0);for(let i=0;i<72;i++){
      const seed=Math.sin(i*127.1+Math.floor(p*350)*17.3)*43758.5453,random=seed-Math.floor(seed),angle=i*2.39996,radius=18+random*83;
      ctx.globalAlpha=mist*(.14+random*.42);ctx.fillStyle='#d4af5f';ctx.beginPath();ctx.arc(tip[0]+Math.cos(angle)*radius,tip[1]+Math.sin(angle)*radius,1+random*2.2,0,Math.PI*2);ctx.fill();
    }ctx.globalAlpha=1}
    title.dataset.paintProgress=p.toFixed(3);
  }
  function tick(now){frame=0;if(finished||!ready)return;if(motion.matches){finish();return}if(game.classList.contains('on')||document.hidden){last=0;return}
    target=Math.max(target,desired());const dt=last?Math.min(40,now-last):16;last=now;
    if(progress<target){progress=Math.min(target,progress+dt*.00085);paintedAt=now}
    if(progress>=.999){finish();return}
    const mist=Math.max(0,1-(now-paintedAt)/220);render(progress,mist);
    if(progress<target||mist>0)frame=requestAnimationFrame(tick);else last=0;
  }
  function queue(){if(ready&&!finished&&!frame)frame=requestAnimationFrame(tick)}
  function start(){if(ready||finished||!source.naturalWidth)return;ready=true;if(motion.matches||desired()>=1){finish();return}title.append(canvas);title.classList.add('paint-active');render(0,0);queue()}
  source.addEventListener('load',start,{once:true});source.addEventListener('error',finish,{once:true});if(source.complete)start();
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);document.addEventListener('visibilitychange',queue);
  motion.addEventListener('change',()=>{if(motion.matches)finish();else queue()});
  document.getElementById(sectionId).addEventListener('focusin',finish);new MutationObserver(queue).observe(game,{attributes:true,attributeFilter:['class']});
}
paintTitle('play-title','play',[[[305,175],[320,445]],[[302,160],[428,153],[474,205],[453,266],[315,306]],
  [[583,154],[565,441],[698,409]],[[806,429],[882,153],[1035,500]],[[838,326],[947,299]],
  [[1063,168],[1154,290],[1248,151]],[[1154,290],[1145,446]],
  [[90,631],[265,604]],[[174,620],[188,868]],[[317,618],[320,864]],[[320,757],[418,728]],[[421,616],[424,862]],
  [[590,612],[500,625],[475,865],[604,835]],[[490,741],[570,710]],
  [[835,631],[816,606],[760,660],[715,785],[726,851],[827,862],[878,806],[877,752],[800,777]],
  [[932,851],[1013,610],[1053,841]],[[969,766],[1046,754]],
  [[1130,846],[1133,631],[1191,739],[1251,630],[1233,850]],
  [[1453,611],[1345,621],[1325,872],[1452,831]],[[1335,742],[1439,714]]],190);
paintTitle('vault-title','vault-invite',[
  [[256,217],[204,433]],[[270,211],[406,204],[431,243],[379,288],[240,316]],[[249,313],[385,304],[423,351],[386,407],[222,444]],
  [[425,455],[531,200],[622,455]],[[465,364],[594,342]],
  [[823,217],[759,208],[696,269],[663,374],[700,435],[796,398]],
  [[898,211],[864,439]],[[1033,207],[882,341],[1023,459]],
  [[1070,203],[1243,193]],[[1147,215],[1114,441]],
  [[1394,210],[1312,218],[1234,317],[1237,412],[1321,431],[1401,366],[1449,267],[1394,210]],
  [[41,581],[201,568]],[[116,583],[101,821]],
  [[258,569],[234,825]],[[251,712],[348,679]],[[367,563],[339,823]],
  [[527,565],[438,580],[403,833],[525,799]],[[422,705],[506,685]],
  [[617,558],[650,826],[779,551]],
  [[790,822],[908,552],[956,825]],[[831,747],[933,721]],
  [[1048,563],[1013,757],[1034,812],[1096,821],[1158,775],[1204,564]],
  [[1284,560],[1231,818],[1370,787]],
  [[1391,562],[1514,551]],[[1445,567],[1409,812]]
],150);
// PAINT_REVEAL_END
if(!motion.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('journey-visible');observer.unobserve(entry.target)}}),{rootMargin:'0px 0px -10% 0px',threshold:.12});journeySections.forEach(section=>{section.classList.add('journey-motion');section.addEventListener('focusin',()=>section.classList.add('journey-visible'));observer.observe(section)});motion.addEventListener('change',()=>{if(motion.matches){journeySections.forEach(section=>section.classList.add('journey-visible'));observer.disconnect()}})}
})();</script></body></html>`);

const productionGame = require('./production-game.cjs');
story = productionGame.integrate(story);
const preview = productionGame.preview();
// Content-derived versions make identical builds byte-for-byte reproducible.
const version = parseInt(crypto.createHash('sha256').update(story).update(preview).digest('hex').slice(0,12),16);
story = story.replace(/let version=\d+,pending=false,busy=false/, 'let version='+version+',pending=false,busy=false');
fs.writeFileSync(path.join(root, 'index.html'), vault);
fs.writeFileSync(path.join(root, 'experience/index.html'), story);
fs.writeFileSync(path.join(root, 'experience/game-preview.html'), preview);
fs.writeFileSync(path.join(root, 'experience/state.json'), JSON.stringify({version,stage:'Complete VCTRS experience'}));
console.log('Built original vault and integrated animated story.');
