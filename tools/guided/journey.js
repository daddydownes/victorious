/* One continuous VCTRS journey; native scrolling owns the camera position. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),world=$('world'),story=$('worldStory'),game=$('worldGame'),preview=$('game-preview');
const next=$('worldNext'),play=$('worldPlay'),video=$('worldVideo'),portrait=$('worldPortrait'),tryFlight=$('worldTryFlight'),filmRetry=$('worldFilmRetry');
const copy=story.querySelector('.portrait-copy'),motion=matchMedia('(prefers-reduced-motion: reduce)'),overlay=$('flapOverlay');
let state='entry',previewReady=false,previewLoaded=false,gameVisible=false,navigating=false,navTarget=null,navTimer=0;
let gameReveal=null,gameRevealFrame=0,gameRevealToken=0,flowFrame=0,flowDistance=1,flowHeight=1,gameHeight=1,arrivalMark=null,arrowPainted=false;
let filmToken=0,filmTimer=0,filmGateTimer=0,filmStarting=false,filmUserPaused=false,filmFailed=false,filmRevealed=false;
const animations=new Set();
const vault=$('vault');let vaultGatePending=false,vaultGateSeen=false;
function vaultInputLocked(){return vaultGatePending||document.body.classList.contains('next-vault-opening')}
function gateVault(){if(vaultGateSeen||!document.body.classList.contains('next-vault-open'))return;vaultGateSeen=true;vaultGatePending=true;vault.inert=true;vault.classList.add('vault-settling');vault.setAttribute('aria-busy','true');
 const title=vault.querySelector('.vault-title'),arrival=title?.getAnimations?.({subtree:true})||[];
 Promise.allSettled([window.__vaultImagesReady,window.__vaultTitleReady,...arrival.filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished)]).then(()=>Promise.allSettled([...vault.querySelectorAll('img')].map(img=>img.decode?img.decode():Promise.resolve()))).then(()=>{vaultGatePending=false;vault.classList.remove('vault-settling');vault.removeAttribute('aria-busy');if(state==='entry'){vault.inert=false;vault.focus({preventScroll:true})}});
}
addEventListener('keydown',e=>{if(vaultInputLocked()&&['Tab','Enter',' ','ArrowDown','ArrowUp','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation()}},{capture:true});
addEventListener('wheel',e=>{if(vaultInputLocked()&&!e.ctrlKey){e.preventDefault();e.stopImmediatePropagation()}},{capture:true,passive:false});
function animateMoment(el,frames,options){if(!el||motion.matches||!el.animate)return;const a=el.animate(frames,options);animations.add(a);const done=()=>animations.delete(a);a.addEventListener('finish',done,{once:true});a.addEventListener('cancel',done,{once:true});return a}
function settleArrival(){for(const a of [...animations]){try{a.finish()}catch{a.cancel()}}animations.clear()}
function storyArrival(source,rect){
 if(!source||!rect?.width)return;
 if(arrivalMark)arrivalMark.remove();
 arrivalMark=source.cloneNode(true);arrivalMark.removeAttribute('id');arrivalMark.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));arrivalMark.className='persistent-v';arrivalMark.setAttribute('aria-hidden','true');arrivalMark.style.cssText='';story.append(arrivalMark);
 const destination=arrivalMark.getBoundingClientRect(),dx=rect.x-destination.x,dy=rect.y-destination.y,scale=rect.width/destination.width;
 animateMoment(arrivalMark,[{transform:'translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:1,offset:0},{transform:'translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:1,offset:.12},{transform:'translate(0,0) scale(1)',opacity:1,offset:1}],{duration:1850,easing:'cubic-bezier(.25,.7,.2,1)'});
}
function unlockFilmGate(skipped=false){clearTimeout(filmGateTimer);world.classList.remove('film-waiting');game.inert=false;next.hidden=false;next.querySelector('span').textContent=skipped?'Continue without film':'Scroll down'}
function revealFilm(){clearTimeout(filmGateTimer);if(story.classList.contains('film-ready')){if(motion.matches)unlockFilmGate();return}story.classList.add('film-ready');animateMoment(portrait,[{opacity:0,clipPath:'inset(0 48% 0 48%)'},{opacity:1,clipPath:'inset(0 0% 0 0%)'}],{duration:1200,easing:'cubic-bezier(.25,.7,.2,1)'});animateMoment($('portrait-title'),[{opacity:0},{opacity:1}],{duration:900,delay:250,fill:'backwards',easing:'ease-out'});Promise.allSettled([...animations].map(a=>a.finished)).then(()=>{if(state!=='entry')unlockFilmGate()})}
function measureFlow(){flowDistance=Math.max(1,game.offsetTop);flowHeight=world.clientHeight;gameHeight=game.offsetHeight;queueFlow()}
function renderFlow(){flowFrame=0;if(state==='entry')return;syncChapter();const p=Math.max(0,Math.min(1,world.scrollTop/flowDistance));
 if(motion.matches){portrait.style.transform='';copy.style.transform='';return;}
 if(world.scrollTop>4&&animations.size)settleArrival();
 portrait.style.transform='translate3d(0,'+(p*flowHeight*.09)+'px,0) scale('+(1-p*.035)+')';copy.style.transform='translate3d(0,'+(p*flowHeight*.04)+'px,0)';
}
function queueFlow(){if(!flowFrame)flowFrame=requestAnimationFrame(renderFlow)}
world.addEventListener('scroll',()=>{if(world.classList.contains('film-waiting')){if(world.scrollTop)world.scrollTop=0;return}queueFlow()},{passive:true});
world.addEventListener('wheel',e=>{if(world.classList.contains('film-waiting')&&!e.ctrlKey)e.preventDefault()},{passive:false});
world.addEventListener('touchmove',e=>{if(world.classList.contains('film-waiting')&&e.touches.length===1)e.preventDefault()},{passive:false});
addEventListener('keydown',e=>{if(!world.classList.contains('film-waiting'))return;if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&!(e.key===' '&&e.target.closest?.('button')))e.preventDefault()},{capture:true});
function paintGameArrow(){if(arrowPainted)return;arrowPainted=true;animateMoment(game.querySelector('.spray-arrow-shaft'),[{strokeDasharray:'100',strokeDashoffset:'100'},{strokeDasharray:'100',strokeDashoffset:'0'}],{duration:900,easing:'ease-out'});animateMoment(game.querySelector('.spray-arrow-head'),[{strokeDasharray:'100',strokeDashoffset:'100'},{strokeDasharray:'100',strokeDashoffset:'0'}],{duration:400,delay:550,fill:'backwards',easing:'ease-out'})}
function status(text){$('worldMediaStatus').textContent=text}
function filmAllowed(){return state==='story'&&!document.hidden&&!motion.matches&&!filmUserPaused&&!filmFailed}
function prepareFilm(){if(!video.getAttribute('src')){video.preload='metadata';video.src='assets/hero-film-51129a88918e.mp4'}}
function pauseFilm(){++filmToken;clearTimeout(filmTimer);filmStarting=false;video.pause()}
function failFilm(message){filmFailed=true;pauseFilm();filmRetry.hidden=false;filmRetry.textContent='Retry film';status(message)}
function bufferLimit(){clearTimeout(filmTimer);filmTimer=setTimeout(()=>{if(filmAllowed())status('Film is loading. Holding your place.')},6500)}
async function startFilm(){
 if(!filmAllowed()||filmStarting||(!video.paused&&!video.ended))return;
 prepareFilm();const token=++filmToken;filmStarting=true;bufferLimit();
 try{await video.play();if(token!==filmToken||!filmAllowed()){if(!filmAllowed())video.pause();return;}filmStarting=false;
 }catch(error){if(token!==filmToken)return;filmStarting=false;if(error.name==='NotAllowedError'){filmUserPaused=true;pauseFilm();filmRetry.hidden=false;filmRetry.textContent='Play film';status('Tap Play film to start.')}else failFilm('Film unavailable. Retry while we hold your place.')}
}
function syncFilm(){if(motion.matches&&state!=='entry'){revealFilm();filmRetry.hidden=true}if(filmAllowed())startFilm();else pauseFilm()}
video.addEventListener('playing',()=>{if(!filmAllowed()){video.pause();return;}filmStarting=false;const token=filmToken;
 const show=()=>{if(token!==filmToken||!filmAllowed())return;filmRevealed=true;portrait.classList.add('media-ready');revealFilm();filmRetry.hidden=true;clearTimeout(filmTimer);status('')};
 if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(show);else show();
});
video.addEventListener('waiting',()=>{if(filmAllowed()){status('Film is loading. Holding your place.');bufferLimit()}});
video.addEventListener('error',()=>{if(state==='story')failFilm('Film unavailable. Retry while we hold your place.')});
filmRetry.addEventListener('click',()=>{filmFailed=false;filmUserPaused=false;filmRetry.hidden=true;status('Film is loading.');if(video.error)video.load();syncFilm()});
function syncPreview(){
 tryFlight.disabled=!previewReady||state!=='preview'||!gameVisible||document.hidden||motion.matches;tryFlight.hidden=motion.matches;
 preview.contentWindow?.postMessage({type:'vctrs-preview',active:state!=='entry'&&state!=='game'&&gameVisible&&!document.hidden&&!motion.matches},location.origin);
}
function warm(){if(previewLoaded)return;previewLoaded=true;preview.srcdoc=JSON.parse($('worldPreviewSource').textContent);if(!motion.matches&&!navigator.connection?.saveData)prepareFilm();setTimeout(()=>{if(!previewReady)$('worldGameStatus').textContent='The preview is taking a moment. You can still take control.'},4000)}
function surface(){
 if(state!=='entry')return;const source=document.querySelector('.surface-story-logo'),rect=source?.getBoundingClientRect();settleArrival();state='story';warm();world.hidden=false;document.body.classList.add('world-active');world.classList.add('film-waiting');game.inert=true;next.hidden=true;filmGateTimer=setTimeout(()=>{if(!filmRevealed){next.hidden=false;next.querySelector('span').textContent='Continue without film';status('Film is still loading. Choose Continue without film to go ahead.')}},12000);
 for(const id of ['stage','beyond','nextDrop','vault','seamTrack']){const el=$(id);if(el){el.inert=true;el.setAttribute('aria-hidden','true')}}
 world.scrollTop=0;story.focus({preventScroll:true});measureFlow();renderFlow();storyArrival(source,rect);syncFilm();
}
function navigate(target){if(state==='entry'||state==='game'||(navigating&&navTarget===target))return;settleArrival();navigating=true;navTarget=target;clearTimeout(navTimer);target.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});target.tabIndex=-1;target.focus({preventScroll:true});navTimer=setTimeout(()=>{navigating=false},motion.matches?0:1000)}
function settleGameReveal(){
 ++gameRevealToken;if(gameRevealFrame)cancelAnimationFrame(gameRevealFrame);gameRevealFrame=0;
 if(gameReveal){gameReveal.cancel();gameReveal=null;}overlay.style.removeProperty('clip-path');overlay.style.removeProperty('opacity');
}
function revealGame(){
 settleGameReveal();if(motion.matches||document.hidden||!overlay.animate)return;
 const r=world.querySelector('.live-game-shell').getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)return;
 const from='inset('+Math.max(0,r.top)+'px '+Math.max(0,innerWidth-r.right)+'px '+Math.max(0,innerHeight-r.bottom)+'px '+Math.max(0,r.left)+'px round 0px)';
 const token=gameRevealToken;overlay.style.clipPath=from;
 gameRevealFrame=requestAnimationFrame(()=>{gameRevealFrame=0;if(token!==gameRevealToken||state!=='game')return;
  gameReveal=overlay.animate([{clipPath:from,opacity:.82},{clipPath:'inset(0px 0px 0px 0px round 0px)',opacity:1}],{duration:560,easing:'cubic-bezier(.2,.76,.16,1)',fill:'both'});
  gameReveal.onfinish=()=>{if(token===gameRevealToken)settleGameReveal()};
 });
}

function startGame(){if(state==='entry'||state==='game')return;if(!window.__flap){$('worldGameStatus').textContent='The game could not start. Reload this demo to try again.';return;}window.__flap.open()}
$('worldRefresh').addEventListener('click',()=>{if(state==='entry'||state==='game')return;$('worldRefresh').disabled=true;location.reload()});
next.addEventListener('click',()=>{if(world.classList.contains('film-waiting'))unlockFilmGate(true);navigate(game)});play.addEventListener('click',startGame);$('worldArrow').addEventListener('click',startGame);
tryFlight.addEventListener('click',()=>{if(!tryFlight.disabled)preview.contentWindow?.postMessage({type:'vctrs-preview-flap'},location.origin)});
addEventListener('vctrs:surface',surface);
addEventListener('vctrs:game-open',()=>{settleArrival();revealGame();state='game';pauseFilm();clearTimeout(navTimer);navigating=false;world.inert=true;world.setAttribute('aria-hidden','true');document.body.classList.add('world-game');syncPreview()});
addEventListener('vctrs:game-close',()=>{settleGameReveal();state=gameVisible?'preview':'story';world.inert=false;world.removeAttribute('aria-hidden');document.body.classList.remove('world-game');syncPreview();syncFilm();play.focus({preventScroll:true})});
function syncChapter(){
 const top=world.scrollTop,overlap=Math.max(0,Math.min(top+flowHeight,flowDistance+gameHeight)-Math.max(top,flowDistance));
 const visible=overlap>=Math.min(flowHeight,gameHeight)*.45;
 if(visible===gameVisible)return;gameVisible=visible;
 if(state!=='entry'&&state!=='game')state=gameVisible?'preview':'story';
 if(gameVisible)paintGameArrow();syncFilm();syncPreview();
}
new MutationObserver(()=>{if(document.body.classList.contains('next-vault-open')||document.body.classList.contains('next-drop-landed'))warm();gateVault()}).observe(document.body,{attributes:true,attributeFilter:['class']});gateVault();
addEventListener('message',e=>{if(e.source!==preview.contentWindow||e.origin!==location.origin)return;
 if(e.data?.type==='vctrs-preview-ready'){previewReady=true;preview.classList.add('preview-ready');$('worldGameStatus').textContent='';syncPreview()}
 if(e.data?.type==='vctrs-preview-flapped'&&state==='preview'){animateMoment(tryFlight,[{boxShadow:'inset 0 0 0 1px #d4af5f88'},{boxShadow:'inset 0 0 0 1px #d4af5f00'}],{duration:320,easing:'ease-out'})}
});
preview.addEventListener('load',syncPreview);
const refreshObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&e.intersectionRatio>=.35){e.target.classList.add('refresh-revealed');refreshObserver.unobserve(e.target)}}},{root:world,threshold:.35});
refreshObserver.observe($('worldRefresh'));
function interrupt(){settleArrival();settleGameReveal();pauseFilm();clearTimeout(navTimer);navigating=false;if(flowFrame)cancelAnimationFrame(flowFrame);flowFrame=0}
addEventListener('resize',()=>{settleArrival();settleGameReveal();measureFlow()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();else{measureFlow();syncFilm()}syncPreview()});
motion.addEventListener('change',()=>{settleArrival();settleGameReveal();measureFlow();syncFilm();syncPreview()});
addEventListener('pagehide',()=>{interrupt();preview.contentWindow?.postMessage({type:'vctrs-preview',active:false},location.origin)});
addEventListener('pageshow',()=>{measureFlow();syncFilm();syncPreview()});
addEventListener('online',()=>{if(filmFailed){filmFailed=false;status('');video.load();syncFilm()}});
const art=world.querySelector('.spray-headline');art.addEventListener('error',()=>art.parentElement.classList.add('art-failed'));if(art.complete&&!art.naturalWidth)art.parentElement.classList.add('art-failed');
window.__worldJourney={get state(){return state},get previewReady(){return previewReady},get navigating(){return navigating},get filmRevealed(){return filmRevealed}};
const context=document.modelContext;
if(context?.registerTool){try{Promise.resolve(context.registerTool({name:'start_vctrs_game',title:'Play Fly the V',description:'From the visible game preview, take control of Fly the V.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw Error('Expected an empty object');if(state!=='preview')throw Error('Reach the game preview first');startGame();return{chapter:state}}})).catch(()=>{})}catch{}}
})();
