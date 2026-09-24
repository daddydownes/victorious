/* One continuous VCTRS journey; native scrolling owns the camera position. */
// Keep the signup's own scroller inside a reported keyboard viewport. No UA
// assumptions: ordinary layout resizing retains the existing CSS fallback.
(()=>{
'use strict';
const panel=document.getElementById('nextDrop'),form=document.getElementById('nextDropEmail');
if(!panel||!form)return;
const row=form.querySelector('.next-drop-email-row'),result=document.getElementById('nextDropResult'),viewport=window.visualViewport;
let frame=0,engaged=false,fitted=false,savedScroll=0,pointer=null;
function available(){return !panel.inert&&panel.getAttribute('aria-hidden')!=='true'&&!document.body.classList.contains('next-vault-opening')&&!document.body.classList.contains('next-vault-open')}
function restore(){
 if(fitted){const signup=document.getElementById('collectionSignup'),leftSignup=signup&&panel.scrollTop>signup.offsetTop+signup.clientHeight/2;panel.classList.remove('email-viewport');panel.style.removeProperty('--email-top');panel.style.removeProperty('--email-height');if(!leftSignup)panel.scrollTop=savedScroll;fitted=false}
}
function update(){
 frame=0;
 if(!available()){engaged=false;pointer=null;panel.classList.remove('email-editing');restore();return}
 // Keyboard recovery can precede pointerup/click. Keep JOIN under the finger
 // for the whole gesture; its click runs before the queued layout update.
 if(pointer!==null)return;
 const focused=form.contains(document.activeElement);
 panel.classList.toggle('email-editing',focused);
 if(focused)engaged=true;
 // Pinching is browser-owned. Hold the last layout rather than chase zoom.
 if(viewport&&Number.isFinite(viewport.scale)&&Math.abs(viewport.scale-1)>.01)return;
 const height=viewport?viewport.height:innerHeight,top=viewport?viewport.offsetTop:0;
 if(!Number.isFinite(height)||height<=0||!Number.isFinite(top)||top<0){restore();return}
 const contracted=height<document.documentElement.clientHeight-1;
 if(!focused&&!contracted)engaged=false;
 if(engaged&&contracted){
  if(!fitted){savedScroll=panel.scrollTop;fitted=true}
  panel.style.setProperty('--email-top',top+'px');panel.style.setProperty('--email-height',height+'px');panel.classList.add('email-viewport');
 }else restore();
 if(!focused&&!fitted)return;
 // Scroll only this panel, without moving focus, selection or the document.
 const bounds=panel.getBoundingClientRect(),input=row.getBoundingClientRect(),receipt=result.getBoundingClientRect();
 const start=input.top-12,end=receipt.bottom+12,room=bounds.height;
 if(end-start>room||start<bounds.top)panel.scrollTop+=start-bounds.top;
 else if(end>bounds.bottom)panel.scrollTop+=end-bounds.bottom;
}
function queue(){if(!frame)frame=requestAnimationFrame(update)}
panel.addEventListener('focusin',queue);panel.addEventListener('focusout',queue);
form.addEventListener('pointerdown',e=>{pointer=e.pointerId;panel.classList.add('email-editing')},{passive:true});
function releasePointer(e){if(e&&e.pointerId!==pointer)return;pointer=null;queue()}
addEventListener('pointerup',releasePointer,{passive:true});addEventListener('pointercancel',releasePointer,{passive:true});
addEventListener('blur',()=>releasePointer());
addEventListener('resize',queue);
if(viewport){viewport.addEventListener('resize',queue);viewport.addEventListener('scroll',queue)}
// Attribute changes are delivered after entry samples the logo's source rect.
new MutationObserver(queue).observe(panel,{attributes:true,attributeFilter:['inert','aria-hidden']});
if(window.ResizeObserver)new ResizeObserver(queue).observe(result);
})();
// One snap lands on signup; native scroll then drives the photographic descent.
(()=>{
'use strict';
const panel=document.getElementById('nextDrop'),signup=document.getElementById('collectionSignup'),invitation=document.getElementById('vaultInvitation');
if(!panel||!signup||!invitation)return;
const scene=invitation.querySelector('.vault-descent-scene'),button=document.getElementById('nextVaultHold'),form=document.getElementById('nextDropEmail'),viewer=document.getElementById('productViewer'),motion=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0,lastTop=panel.scrollTop,lastHeight=panel.clientHeight,lastProgress=0,lastEntranceFraction=0,cameraWasVisible=false,entered=false,photosWarmed=false;
function eligible(){return !entered&&!document.hidden&&!panel.inert&&panel.getAttribute('aria-hidden')!=='true'&&!panel.classList.contains('email-viewport')&&!form.contains(document.activeElement)&&!viewer?.open&&!document.body.classList.contains('next-vault-opening')&&!document.body.classList.contains('next-vault-open')}
function enterIfReady(){if(Number(scene.style.getPropertyValue('--vault-progress'))>=.985&&eligible()){entered=true;button.click()}}
function update(){
 frame=0;
 let top=panel.scrollTop;
 const resized=panel.clientHeight!==lastHeight;
 if(resized&&cameraWasVisible&&!panel.inert){
  const section=invitation.getBoundingClientRect().top-panel.getBoundingClientRect().top+top;
  panel.scrollTop=lastEntranceFraction>0?section-lastEntranceFraction*panel.clientHeight:section+lastProgress*Math.max(1,invitation.offsetHeight-panel.clientHeight);
  top=panel.scrollTop;
 }
 const down=!resized&&top>lastTop+1;
 lastTop=top;lastHeight=panel.clientHeight;
 panel.classList.toggle('collection-free-scroll',top>=signup.offsetTop-2);
 if(!photosWarmed&&top>=signup.offsetTop-2&&window.__vaultCamera){photosWarmed=true;window.__vaultCamera.warm();}
 const sectionTop=invitation.getBoundingClientRect().top-panel.getBoundingClientRect().top+top;
 const range=Math.max(1,invitation.offsetHeight-panel.clientHeight),progress=Math.max(0,Math.min(1,(top-sectionTop)/range));
 const entranceOffset=Math.max(0,Math.min(panel.clientHeight,sectionTop-top));
 if(progress>.05&&!panel.classList.contains('email-viewport')&&form.contains(document.activeElement))document.activeElement.blur();
 scene.style.setProperty('--vault-progress',progress.toFixed(4));
 scene.style.setProperty('--vault-title-opacity',Math.max(0,1-progress*1.7).toFixed(4));
 const cameraVisible=top+panel.clientHeight>sectionTop&&top<sectionTop+invitation.offsetHeight&&!panel.inert&&panel.getAttribute('aria-hidden')!=='true';
 cameraWasVisible=cameraVisible;lastProgress=progress;lastEntranceFraction=entranceOffset/panel.clientHeight;
 panel.classList.toggle('vault-camera-active',cameraVisible);
 if(cameraVisible&&window.__vaultCamera)window.__vaultCamera.paint(progress,entranceOffset);
 else if(!panel.inert&&window.__vaultCamera)window.__vaultCamera.cancel();
 if(down)enterIfReady();
}
function queue(){if(!frame)frame=requestAnimationFrame(update)}
panel.addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);queue();
panel.addEventListener('wheel',e=>{if(e.deltaY>0&&!e.ctrlKey)enterIfReady()},{passive:true});
let touchY=null;
panel.addEventListener('touchstart',e=>{touchY=e.touches.length===1?e.touches[0].clientY:null},{passive:true});
panel.addEventListener('touchmove',e=>{if(touchY!==null&&e.touches.length===1){const y=e.touches[0].clientY;if(touchY-y>3)enterIfReady();touchY=y}},{passive:true});
panel.addEventListener('touchend',()=>{touchY=null},{passive:true});
panel.addEventListener('touchcancel',()=>{touchY=null},{passive:true});
panel.addEventListener('keydown',e=>{if(['ArrowDown','PageDown','End',' '].includes(e.key))enterIfReady()});
// A keyboard user can activate the discreet fallback, while page scroll uses
// the same guarded entry lifecycle as the former button.
button.addEventListener('click',()=>{entered=true});
if(motion.addEventListener)motion.addEventListener('change',queue);
})();
// Product delivery starts only when the post-film collection is revealed.
(()=>{
'use strict';
const panel=document.getElementById('nextDrop');
if(!panel)return;
const photos=[...panel.querySelectorAll('[data-product]')];
const cue=document.getElementById('collectionScrollCue'),signup=document.getElementById('collectionSignup');
const vaultCue=document.getElementById('vaultScrollCue'),invitation=document.getElementById('vaultInvitation'),motion=matchMedia('(prefers-reduced-motion: reduce)');
if(cue&&signup)cue.addEventListener('click',()=>{
 if(panel.inert||panel.getAttribute('aria-hidden')==='true')return;
 const top=signup.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;
 // The same native chapter scroll used by Surface; form editing suspends snap.
 panel.scrollTo({top,behavior:motion.matches?'instant':'smooth'});
 const heading=signup.querySelector('h2');if(heading)heading.focus({preventScroll:true});
});
if(vaultCue&&invitation)vaultCue.addEventListener('click',()=>{
 if(panel.inert||panel.getAttribute('aria-hidden')==='true')return;
 const top=invitation.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop;
 panel.scrollTo({top,behavior:motion.matches?'instant':'smooth'});
 const heading=invitation.querySelector('h2');if(heading)heading.focus({preventScroll:true});
});
let started=false,observer=null;
function size(img){const width=Math.ceil(img.getBoundingClientRect().width);if(width>0&&img.sizes!==width+'px')img.sizes=width+'px'}
function load(img){
 const name=img.dataset.product;
 if(!name)return;
 size(img);
 const largeWidth=Math.min(1280,Number(img.getAttribute('width'))||1280);
 img.srcset='assets/products/'+name+'-640.webp 640w, assets/products/'+name+'-1280.webp '+largeWidth+'w';
 img.src='assets/products/'+name+'-1280.webp';
 delete img.dataset.product;
}
function start(){
 if(started||panel.getAttribute('aria-hidden')==='true')return;
 started=true;
 // Match delivery to the actual two-/four-column tiles, including rotation.
 if(window.ResizeObserver){const sizing=new ResizeObserver(entries=>{for(const entry of entries)if(!entry.target.dataset.product)size(entry.target)});photos.forEach(img=>sizing.observe(img))}
 if(window.IntersectionObserver){
  observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){load(entry.target);observer.unobserve(entry.target)}},{root:panel,rootMargin:'320px 0px'});
  photos.forEach(img=>observer.observe(img));
 }else photos.forEach(load);
}
const visibility=new MutationObserver(()=>{start();if(started)visibility.disconnect()});
visibility.observe(panel,{attributes:true,attributeFilter:['aria-hidden']});
start();
})();
// Open the owner-supplied originals over black without leaving the collection.
(()=>{
'use strict';
const panel=document.getElementById('nextDrop'),viewer=document.getElementById('productViewer');
if(!panel||!viewer)return;
const image=document.getElementById('productViewerImage'),caption=document.getElementById('productViewerCaption'),close=document.getElementById('productViewerClose');
const names={'zip-hoodie':'Zip hoodie','spray-tee':'Spray T-shirt','canberra-tee':'Canberra T-shirt','black-tee':'Black V and star T-shirt'};
let trigger=null,savedScroll=0,request=0;
function restore(){++request;panel.classList.remove('product-viewing');panel.scrollTop=savedScroll;if(trigger){trigger.focus({preventScroll:true});trigger=null}}
function dismiss(){if(viewer.close)viewer.close();else{viewer.removeAttribute('open');restore()}}
for(const button of panel.querySelectorAll('.collection-open'))button.addEventListener('click',()=>{
 const name=button.dataset.viewProduct;if(!Object.prototype.hasOwnProperty.call(names,name)||viewer.open)return;
 const thumb=button.querySelector('img');if(!thumb)return;
 trigger=button;savedScroll=panel.scrollTop;const token=++request;
 image.width=Number(thumb.getAttribute('width'))||1080;image.height=Number(thumb.getAttribute('height'))||1432;
 image.alt=thumb.alt;image.src=thumb.currentSrc||thumb.src||'assets/products/full/'+name+'.jpg';caption.textContent=names[name];
 panel.classList.add('product-viewing');
 if(viewer.showModal)viewer.showModal();else viewer.setAttribute('open','');
 close.focus({preventScroll:true});
 const original=new Image();original.src='assets/products/full/'+name+'.jpg';
 original.decode().then(()=>{if(request===token&&viewer.open)image.src=original.src}).catch(()=>{});
});
close.addEventListener('click',dismiss);
viewer.addEventListener('click',event=>{if(event.target===viewer)dismiss()});
viewer.addEventListener('close',restore);
viewer.addEventListener('keydown',event=>{if(event.key==='Escape'&&!viewer.close){event.preventDefault();dismiss()}});
})();
(()=>{
'use strict';
const $=id=>document.getElementById(id),world=$('world'),story=$('worldStory'),game=$('worldGame'),preview=$('game-preview');
const next=$('worldNext'),play=$('worldPlay'),video=$('worldVideo'),portrait=$('worldPortrait'),tryFlight=$('worldTryFlight'),filmRetry=$('worldFilmRetry'),storyBack=$('worldStoryReturnVault');
const copy=story.querySelector('.portrait-copy'),motion=matchMedia('(prefers-reduced-motion: reduce)'),overlay=$('flapOverlay');
let state='entry',previewReady=false,previewLoaded=false,gameVisible=false,navigating=false,navTarget=null,navTimer=0;
let gameReveal=null,gameRevealFrame=0,gameRevealToken=0,flowFrame=0,flowDistance=1,flowHeight=1,gameHeight=1,arrivalMark=null,arrowPainted=false;
let storyVisit=0,filmToken=0,filmFrame=0,filmTimer=0,filmStarting=false,filmUserPaused=false,filmFailed=false,filmRevealed=false;
const animations=new Set();
const vault=$('vault');let vaultGatePending=false,vaultGateSeen=false,vaultGateGeneration=0;
function vaultInputLocked(){return vaultGatePending||document.body.classList.contains('next-vault-opening')}
function gateVault(){if(vaultGateSeen||!document.body.classList.contains('next-vault-open'))return;const generation=++vaultGateGeneration;vaultGateSeen=true;vaultGatePending=true;vault.inert=true;vault.classList.add('vault-settling');vault.setAttribute('aria-busy','true');
 // Originals are decoded before promotion. A second DOM decode can hang on a
 // pending download and must never hold the navigation lock indefinitely.
 Promise.allSettled([window.__vaultImagesReady,window.__vaultInteractiveReady||window.__vaultTitleReady]).then(()=>{if(generation!==vaultGateGeneration)return;vaultGatePending=false;vault.classList.remove('vault-settling');vault.removeAttribute('aria-busy');if(state==='entry'){vault.inert=false;vault.focus({preventScroll:true})}});
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
function unlockFilmGate(){world.classList.remove('film-waiting','film-failed');game.inert=false;next.hidden=false;if(document.activeElement===storyBack||document.activeElement===story)next.focus({preventScroll:true});storyBack.hidden=true}
function revealFilm(){if(story.classList.contains('film-ready')){if(motion.matches)unlockFilmGate();return}const visit=storyVisit;story.classList.add('film-ready');animateMoment(portrait,[{opacity:0,clipPath:'inset(0 48% 0 48%)'},{opacity:1,clipPath:'inset(0 0% 0 0%)'}],{duration:1200,easing:'cubic-bezier(.25,.7,.2,1)'});animateMoment($('portrait-title'),[{opacity:0},{opacity:1}],{duration:900,delay:250,fill:'backwards',easing:'ease-out'});Promise.allSettled([...animations].map(a=>a.finished)).then(()=>{if(visit===storyVisit&&state!=='entry')unlockFilmGate()})}
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

// A single restrained end-stop cue; scrolling itself remains native.
let endBounce=null,endTouchY=null;
function stopEndBounce(){if(endBounce){endBounce.forEach(a=>a.cancel());endBounce=null}}
function atWorldEnd(){return state==='preview'&&!navigating&&!world.classList.contains('film-waiting')&&world.scrollTop+world.clientHeight>=world.scrollHeight-2}
function bounceAtEnd(){if(motion.matches||document.hidden||endBounce||!game.animate)return;const group=[...game.children].map(el=>el.animate([{transform:'translateY(0)'},{transform:'translateY(-16px)',offset:.32},{transform:'translateY(0)'}],{duration:520,easing:'cubic-bezier(.22,.65,.3,1)'}));endBounce=group;Promise.allSettled(group.map(a=>a.finished)).then(()=>{if(endBounce===group)endBounce=null})}
world.addEventListener('wheel',e=>{if(e.ctrlKey||e.deltaY<=0){stopEndBounce();return}if(atWorldEnd()){e.preventDefault();bounceAtEnd()}},{passive:false});
world.addEventListener('touchstart',e=>{endTouchY=e.touches.length===1?e.touches[0].clientY:null;if(e.touches.length!==1)stopEndBounce()},{passive:true});
world.addEventListener('touchmove',e=>{if(e.touches.length!==1||endTouchY===null)return;const y=e.touches[0].clientY,delta=endTouchY-y;endTouchY=y;if(delta<0){stopEndBounce();return}if(delta>0&&atWorldEnd()&&e.cancelable){e.preventDefault();bounceAtEnd()}},{passive:false});
world.addEventListener('touchend',()=>{endTouchY=null},{passive:true});
world.addEventListener('touchcancel',()=>{endTouchY=null;stopEndBounce()},{passive:true});
world.addEventListener('scroll',()=>{if(!atWorldEnd())stopEndBounce()},{passive:true});

function paintGameArrow(){if(arrowPainted)return;arrowPainted=true;animateMoment(game.querySelector('.spray-arrow-shaft'),[{strokeDasharray:'100',strokeDashoffset:'100'},{strokeDasharray:'100',strokeDashoffset:'0'}],{duration:900,easing:'ease-out'});animateMoment(game.querySelector('.spray-arrow-head'),[{strokeDasharray:'100',strokeDashoffset:'100'},{strokeDasharray:'100',strokeDashoffset:'0'}],{duration:400,delay:550,fill:'backwards',easing:'ease-out'})}
function status(text){$('worldMediaStatus').textContent=text}
function hideFilmRetry(){if(state!=='entry'&&document.activeElement===filmRetry)(world.classList.contains('film-waiting')?story:next).focus({preventScroll:true});filmRetry.hidden=true}
function filmAllowed(){return state==='story'&&!document.hidden&&!motion.matches&&!filmUserPaused&&!filmFailed}
function prepareFilm(){if(!video.getAttribute('src')){video.preload='metadata';video.src='assets/delivery/surface-720.mp4'}}
function cancelFilmFrame(){if(filmFrame&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(filmFrame);filmFrame=0}
function pauseFilm(){++filmToken;clearTimeout(filmTimer);cancelFilmFrame();filmStarting=false;video.pause()}
function failFilm(message){filmFailed=true;pauseFilm();storyBack.hidden=false;world.classList.add('film-failed');filmRetry.hidden=false;filmRetry.textContent='Retry film';status(message)}
function bufferLimit(){clearTimeout(filmTimer);filmTimer=setTimeout(()=>{if(filmAllowed()){filmRetry.hidden=false;filmRetry.textContent='Retry film';status('Film is loading. You can retry while we hold your place.')}},6500)}
async function startFilm(){
 if(!filmAllowed()||filmStarting||(!video.paused&&!video.ended))return;
 prepareFilm();const token=++filmToken;filmStarting=true;bufferLimit();
 try{await video.play();if(token!==filmToken||!filmAllowed()){if(!filmAllowed())video.pause();return;}filmStarting=false;
 }catch(error){if(token!==filmToken)return;filmStarting=false;if(error.name==='NotAllowedError'){filmUserPaused=true;pauseFilm();filmRetry.hidden=false;filmRetry.textContent='Play film';status('Tap Play film to start.')}else failFilm('Film unavailable. Retry while we hold your place.')}
}
function syncFilm(){if(motion.matches&&state!=='entry'){revealFilm();hideFilmRetry()}if(filmAllowed())startFilm();else pauseFilm()}
video.addEventListener('playing',()=>{if(!filmAllowed()){video.pause();return;}filmStarting=false;cancelFilmFrame();const token=filmToken;
 const show=()=>{if(token!==filmToken||!filmAllowed())return;filmFrame=0;filmRevealed=true;portrait.classList.add('media-ready');revealFilm();hideFilmRetry();clearTimeout(filmTimer);status('')};
 if(video.requestVideoFrameCallback)filmFrame=video.requestVideoFrameCallback(show);else show();
});
video.addEventListener('waiting',()=>{if(filmAllowed()){status('Film is loading. Holding your place.');bufferLimit()}});
video.addEventListener('error',()=>{if(state==='story'&&video.error)failFilm('Film unavailable. Retry while we hold your place.')});
filmRetry.addEventListener('click',()=>{if(state!=='story')return;pauseFilm();filmFailed=false;filmUserPaused=false;storyBack.hidden=true;world.classList.remove('film-failed');hideFilmRetry();status('Film is loading.');video.load();syncFilm()});
function syncPreview(){
 game.classList.toggle('play-light-active',state==='preview'&&gameVisible&&!document.hidden&&!motion.matches);
 tryFlight.disabled=state!=='preview'||!gameVisible||document.hidden;
 preview.contentWindow?.postMessage({type:'vctrs-preview',active:state!=='entry'&&state!=='game'&&gameVisible&&!document.hidden&&!motion.matches},location.origin);
}
function warm(){if(previewLoaded)return;previewLoaded=true;preview.src=JSON.parse($('worldPreviewSource').textContent);setTimeout(()=>{if(!previewReady)$('worldGameStatus').textContent='The preview is taking a moment. You can still take control.'},4000)}
function surface(){
 if(state!=='entry')return;++storyVisit;const source=document.querySelector('.surface-story-logo'),rect=source?.getBoundingClientRect();settleArrival();state='story';warm();world.hidden=false;document.body.classList.add('world-active');
 // Reset while world is scrollable: overflow:clip in the film gate masks its saved snap position.
 world.scrollTo({top:0,left:0,behavior:'instant'});world.classList.add('film-waiting');world.classList.remove('film-failed');game.inert=true;next.hidden=true;storyBack.hidden=true;
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
function returnToVault(){
 if(state==='entry'||state==='game')return;
 // Invalidate reveal completion before settling animations or resetting media.
 ++storyVisit;state='entry';interrupt();gameVisible=false;navTarget=null;endTouchY=null;
 filmUserPaused=false;filmFailed=false;filmRevealed=false;filmRetry.hidden=true;status('');
 story.classList.remove('film-ready');portrait.classList.remove('media-ready');portrait.style.transform='';copy.style.transform='';
 video.removeAttribute('src');video.load();
 if(arrivalMark){arrivalMark.remove();arrivalMark=null}
 world.classList.remove('film-waiting','film-failed');world.hidden=true;world.inert=false;world.removeAttribute('aria-hidden');next.hidden=true;storyBack.hidden=true;game.inert=false;
 document.body.classList.remove('world-active','world-game');
 for(const id of ['stage','beyond','nextDrop','vault','seamTrack']){const el=$(id);if(el){el.inert=false;el.removeAttribute('aria-hidden')}}
 vaultGateSeen=false;vaultGatePending=false;vault.classList.remove('vault-settling');vault.removeAttribute('aria-busy');
 syncPreview();window.dispatchEvent(new Event('vctrs:return-vault'));gateVault();
}
$('worldReturnVault').addEventListener('click',returnToVault);
storyBack.addEventListener('click',returnToVault);
$('worldRefresh').addEventListener('click',()=>{if(state==='entry'||state==='game')return;$('worldRefresh').disabled=true;location.reload()});
next.addEventListener('click',()=>{if(world.classList.contains('film-waiting'))return;navigate(game)});play.addEventListener('click',startGame);$('worldArrow').addEventListener('click',startGame);
tryFlight.addEventListener('click',()=>{if(!tryFlight.disabled)startGame()});
addEventListener('vctrs:surface',surface);
addEventListener('vctrs:game-open',()=>{stopEndBounce();settleArrival();revealGame();state='game';pauseFilm();clearTimeout(navTimer);navigating=false;world.inert=true;world.setAttribute('aria-hidden','true');document.body.classList.add('world-game');syncPreview()});
addEventListener('vctrs:game-close',()=>{settleGameReveal();state=gameVisible?'preview':'story';world.inert=false;world.removeAttribute('aria-hidden');document.body.classList.remove('world-game');syncPreview();syncFilm();play.focus({preventScroll:true})});
function syncChapter(){
 const top=world.scrollTop,overlap=Math.max(0,Math.min(top+flowHeight,flowDistance+gameHeight)-Math.max(top,flowDistance));
 const visible=overlap>=Math.min(flowHeight,gameHeight)*.45;
 if(visible===gameVisible)return;gameVisible=visible;
 if(state!=='entry'&&state!=='game')state=gameVisible?'preview':'story';
 if(gameVisible)paintGameArrow();syncFilm();syncPreview();
}
new MutationObserver(()=>{gateVault()}).observe(document.body,{attributes:true,attributeFilter:['class']});gateVault();
addEventListener('message',e=>{if(e.source!==preview.contentWindow||e.origin!==location.origin)return;
 if(e.data?.type==='vctrs-preview-ready'){previewReady=true;preview.classList.add('preview-ready');$('worldGameStatus').textContent='';syncPreview()}
 if(e.data?.type==='vctrs-preview-flapped'&&state==='preview'){animateMoment(tryFlight,[{boxShadow:'inset 0 0 0 1px #d4af5f88'},{boxShadow:'inset 0 0 0 1px #d4af5f00'}],{duration:320,easing:'ease-out'})}
});
preview.addEventListener('load',syncPreview);
const refreshObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&e.intersectionRatio>=.35){e.target.classList.add('refresh-revealed');refreshObserver.unobserve(e.target)}}},{root:world,threshold:.35});
refreshObserver.observe($('worldRefresh'));
function interrupt(){stopEndBounce();settleArrival();settleGameReveal();pauseFilm();clearTimeout(navTimer);navigating=false;if(flowFrame)cancelAnimationFrame(flowFrame);flowFrame=0}
addEventListener('resize',()=>{stopEndBounce();settleArrival();settleGameReveal();measureFlow()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();else{measureFlow();syncFilm()}syncPreview()});
motion.addEventListener('change',()=>{stopEndBounce();settleArrival();settleGameReveal();measureFlow();syncFilm();syncPreview()});
addEventListener('pagehide',()=>{interrupt();preview.contentWindow?.postMessage({type:'vctrs-preview',active:false},location.origin)});
addEventListener('pageshow',()=>{measureFlow();syncFilm();syncPreview()});
addEventListener('online',()=>{if(filmFailed){filmFailed=false;status('');video.load();syncFilm()}});
const art=world.querySelector('.spray-headline');art.addEventListener('error',()=>art.parentElement.classList.add('art-failed'));if(art.complete&&!art.naturalWidth)art.parentElement.classList.add('art-failed');
window.__worldJourney={get state(){return state},get previewReady(){return previewReady},get navigating(){return navigating},get filmRevealed(){return filmRevealed}};
const context=document.modelContext;
if(context?.registerTool){try{Promise.resolve(context.registerTool({name:'start_vctrs_game',title:'Play Fly the V',description:'From the visible game preview, take control of Fly the V.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw Error('Expected an empty object');if(state!=='preview')throw Error('Reach the game preview first');startGame();return{chapter:state}}})).catch(()=>{})}catch{}}
})();

// Use the listed Canberra event start, with an explicit timezone offset.
(()=>{
 const clock=document.getElementById('popupClock'),started=document.getElementById('popupStarted'),panel=document.getElementById('nextDrop');
 if(!clock||!started||!panel)return;
 const target=Date.parse(clock.dataset.start),end=Date.parse(clock.dataset.end),units=['days','hours','minutes','seconds'];let timer;
 function render(){
  const remaining=Math.max(0,Math.ceil((target-Date.now())/1000));
  clock.hidden=remaining===0;started.hidden=remaining>0;
  started.textContent=Date.now()<end?'On now · Until 10 PM':'This pop-up has finished.';
  const values=[Math.floor(remaining/86400),Math.floor(remaining/3600)%24,Math.floor(remaining/60)%60,remaining%60];
  units.forEach((unit,i)=>{clock.querySelector('[data-time="'+unit+'"]').textContent=String(values[i]).padStart(2,'0')});
  if(Date.now()>=end)clearInterval(timer);
 }
 function sync(){clearInterval(timer);render();if(!document.hidden&&!panel.inert&&Date.now()<end)timer=setInterval(render,1000)}
 document.addEventListener('visibilitychange',sync);
 new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['inert']});
 sync();
})();
