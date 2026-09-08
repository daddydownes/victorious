'use strict';

const HTML_OPEN = '<html lang="en-AU">';
const BODY_OPEN = '<body class="locked">';
const FILM_TAG = '<video id="film" muted playsinline preload="auto" aria-hidden="true" src="assets/hero-film-51129a88918e.mp4" poster="assets/hero-poster-311ec34583b0.jpg"></video>';
const SURFACE_ASSIGN = "    location.assign(new URL('experience/', location.href).href);";
const MOTION_SCHEDULE = '    if(motionRaf||document.hidden) return;';
const MOTION_WAKE = '    if(document.hidden||!motionHasWork()||motionRaf) return;';
const MOTION_WATCHDOG = '    if(document.hidden||!motionHasWork()||Date.now()-motionRafSeen<=200) return;';
const DUST_GUARD = '      if(document.hidden || reduced) return;';
const VAULT_FOCUS = "    try{ vault.focus({preventScroll:true}); }catch(_e){ vault.focus(); }";
const VISIBILITY_LISTENER = "    scheduleMotion();\n  }\n  addEventListener('visibilitychange',function(){\n";
const MARKER = 'VCTRS_VAULT_EMBED_BRIDGE';

function replaceOnce(html, anchor, replacement, label) {
  const first = html.indexOf(anchor);
  if (first < 0 || html.indexOf(anchor, first + anchor.length) >= 0) {
    throw new Error(`Vault embed build expected exactly one ${label} anchor`);
  }
  return html.slice(0, first) + replacement + html.slice(first + anchor.length);
}

const BRIDGE = `<meta name="robots" content="noindex,nofollow">
<style>
html[data-vctrs-vault-embed-paused],
html[data-vctrs-vault-embed-paused] *,
html[data-vctrs-vault-embed-paused] *::before,
html[data-vctrs-vault-embed-paused] *::after{animation-play-state:paused!important}
</style>
<script>
/* ${MARKER} */
(function(){
  'use strict';
  var root=document.documentElement, params=new URLSearchParams(location.search), parentOrigin='', embedded=false;
  try{
    parentOrigin=parent.location.origin;
    embedded=params.get('embed')==='vault' && parent!==window && parentOrigin===location.origin;
  }catch(_originError){}
  window.__vctrsVaultEmbedActive=!embedded;
  if(!embedded){
    root.removeAttribute('inert'); root.removeAttribute('data-vctrs-vault-embed-paused');
    var releaseBody=function(){ if(document.body)document.body.removeAttribute('inert'); };
    if(document.readyState==='loading')addEventListener('DOMContentLoaded',releaseBody,{once:true}); else releaseBody();
    return;
  }

  var cycle=params.get('cycle')||'0', active=false, resetting=false, surfaceSent=false, pausedAnimations=[];
  function sameCycle(value){ return value!==undefined && String(value)===cycle; }
  function blurInside(){
    var focused=document.activeElement;
    if(focused && focused!==document.body && focused!==root && focused.blur){
      try{ focused.blur(); }catch(_blurError){}
    }
  }
  function pauseAnimations(){
    if(!document.getAnimations)return;
    document.getAnimations().forEach(function(animation){
      if(animation.playState==='running'){
        try{ animation.pause(); pausedAnimations.push(animation); }catch(_pauseError){}
      }
    });
  }
  function syncInert(paused){
    root.toggleAttribute('inert',paused);
    root.toggleAttribute('data-vctrs-vault-embed-paused',paused);
    if(document.body)document.body.toggleAttribute('inert',paused);
  }
  function setActive(next){
    next=next===true;
    if(next===active){ syncInert(!next); return; }
    if(!next){ blurInside(); pauseAnimations(); }
    active=next; window.__vctrsVaultEmbedActive=next; syncInert(!next);
    if(next){
      var resume=pausedAnimations; pausedAnimations=[];
      resume.forEach(function(animation){ if(animation.playState==='paused')try{animation.play();}catch(_playError){} });
      var vault=document.getElementById('vault');
      if(vault)try{vault.focus({preventScroll:true});}catch(_focusError){vault.focus();}
    }
    dispatchEvent(new CustomEvent('vctrs-vault-visibility',{detail:{active:next,cycle:cycle}}));
  }
  function post(type){ parent.postMessage({type:type,cycle:cycle},parentOrigin); }

  syncInert(true);
  window.__vctrsVaultEmbedSurface=function(){
    if(surfaceSent||resetting)return true;
    surfaceSent=true; setActive(false); post('vctrs-vault-surface'); return true;
  };
  addEventListener('message',function(event){
    var data=event.data;
    if(event.origin!==parentOrigin || event.source!==parent || !data || typeof data!=='object' || !sameCycle(data.cycle))return;
    if(data.type==='vctrs-vault-visibility' && typeof data.active==='boolean'){
      if(data.active && surfaceSent)return;
      setActive(data.active);
      return;
    }
    if(data.type==='vctrs-vault-reset'){
      if(resetting)return;
      var next=data.nextCycle;
      if((typeof next!=='string' && typeof next!=='number') || !/^[A-Za-z0-9._-]{1,64}$/.test(String(next)))return;
      resetting=true; setActive(false);
      var target=new URL(location.href);
      target.search=''; target.searchParams.set('embed','vault'); target.searchParams.set('cycle',String(next)); target.hash='vault';
      if(target.href===location.href)location.reload(); else location.replace(target.href);
    }
  });
  function ready(){ syncInert(!active); post('vctrs-vault-ready'); }
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',ready,{once:true}); else ready();
})();
</script>`;

function buildVaultEmbed(rootHtml) {
  if (typeof rootHtml !== 'string') throw new TypeError('buildVaultEmbed expects built root HTML');
  if (rootHtml.includes(MARKER)) throw new Error('Vault embed bridge is already installed');

  const prefix = rootHtml.slice(0, 2048);
  const headMatch = /<head(?:\s[^>]*)?>/i.exec(prefix);
  let html = replaceOnce(
    rootHtml,
    HTML_OPEN,
    '<html lang="en-AU" inert data-vctrs-vault-embed-paused>' + (headMatch ? '' : '\n<head>\n' + BRIDGE),
    'document opening'
  );
  if (headMatch) html = html.replace(headMatch[0], headMatch[0] + '\n' + BRIDGE);
  html = replaceOnce(
    html,
    BODY_OPEN,
    (headMatch ? '' : '</head>\n') + '<body class="locked" inert>',
    'body opening'
  );
  html = replaceOnce(
    html,
    FILM_TAG,
    '<video id="film" muted playsinline preload="none" aria-hidden="true"></video>',
    'intro film'
  );
  html = replaceOnce(
    html,
    SURFACE_ASSIGN,
    "    if(window.__vctrsVaultEmbedSurface&&window.__vctrsVaultEmbedSurface()) return;\n" + SURFACE_ASSIGN,
    'Surface destination'
  );
  html = replaceOnce(
    html,
    VAULT_FOCUS,
    "    if(window.__vctrsVaultEmbedActive!==false){\n" + VAULT_FOCUS + '\n    }',
    'Vault focus'
  );
  html = replaceOnce(
    html,
    MOTION_SCHEDULE,
    '    if(motionRaf||document.hidden||window.__vctrsVaultEmbedActive===false) return;',
    'motion scheduler'
  );
  html = replaceOnce(
    html,
    MOTION_WAKE,
    '    if(document.hidden||window.__vctrsVaultEmbedActive===false||!motionHasWork()||motionRaf) return;',
    'motion wake'
  );
  html = replaceOnce(
    html,
    MOTION_WATCHDOG,
    '    if(document.hidden||window.__vctrsVaultEmbedActive===false||!motionHasWork()||Date.now()-motionRafSeen<=200) return;',
    'motion watchdog'
  );
  html = replaceOnce(
    html,
    DUST_GUARD,
    '      if(document.hidden || window.__vctrsVaultEmbedActive===false || reduced) return;',
    'Vault dust visibility'
  );
  html = replaceOnce(
    html,
    VISIBILITY_LISTENER,
    "    scheduleMotion();\n  }\n  addEventListener('vctrs-vault-visibility',function(event){\n" +
      "    if(!event.detail||event.detail.active!==true){ motionSleep(); return; }\n" +
      "    motionLast=motionNow(); measure(); updateScroll(); wakeMotion();\n" +
      "  });\n" +
      "  addEventListener('visibilitychange',function(){\n",
    'shared motion visibility hook'
  );
  return html;
}

module.exports = { buildVaultEmbed };
