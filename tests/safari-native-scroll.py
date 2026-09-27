"""Actual macOS Safari diagnostics using Apple's WebDriver, no third-party client.
Temporary CSS ablations are measurements only, never production changes.
No signup submission, navigation shortcut, or physical-iPhone claim.
"""
import base64
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request
import urllib.error

OUT = Path(os.environ['EVIDENCE_DIR'])
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ['BASE_URL']
HOST = 'http://127.0.0.1:4444'
rows = []
sid = None


def request(method, path, value=None):
    data = None if value is None else json.dumps(value).encode()
    req = urllib.request.Request(HOST + path, data=data, method=method,
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=100) as response:
            body = json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(error.read().decode()) from error
    result = body.get('value')
    if isinstance(result, dict) and result.get('error'):
        raise RuntimeError(str(result))
    return result


def command(path, value=None, method='POST'):
    return request(method, '/session/' + sid + path, value)


def js(script, *args):
    return command('/execute/sync', {'script': script, 'args': list(args)})


def wait(script, timeout=20):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if js('return (' + script + ')'):
            return
        time.sleep(.2)
    raise TimeoutError(script)


def click(selector):
    element = command('/element', {'using': 'css selector', 'value': selector})
    command('/element/' + next(iter(element.values())) + '/click', {})


def key(value):
    command('/actions', {'actions': [{'type': 'key', 'id': 'keys', 'actions': [
        {'type': 'keyDown', 'value': value}, {'type': 'keyUp', 'value': value}]}]})


def state():
    return js("const p=document.getElementById('nextDrop'),g=window.__vaultEntryGuide;return {top:p.scrollTop,height:p.clientHeight,phase:window.__guide.phase(),target:g.target,moving:g.moving,entered:g.entered,viewport:[innerWidth,innerHeight],ua:navigator.userAgent}")


def screenshot(name):
    image = command('/screenshot', method='GET')
    (OUT / (name + '.png')).write_bytes(base64.b64decode(image))


def measure(name, action=None):
    js("const p=window.__nativePerf;p.active=true;p.frames=[];p.last=0;p.rects=0;p.rectMs=0")
    if action:
        action()
    time.sleep(1.15)
    result = js("const p=window.__nativePerf;p.active=false;const s=p.frames.sort((a,b)=>a-b);return {frames:s.length,p95:s[Math.floor(s.length*.95)]||0,max:s.at(-1)||0,over34:s.filter(x=>x>34).length,rects:p.rects,rectMs:p.rectMs}")
    result.update(name=name, state=state())
    rows.append(result)
    (OUT / 'native-safari.json').write_text(json.dumps(rows, indent=2))
    print(json.dumps(result), flush=True)
    return result


server = None
try:
    subprocess.run(['/usr/bin/safaridriver', '--version'], check=True)
    server = subprocess.Popen(['/usr/bin/safaridriver', '-p', '4444'], stdout=open(OUT / 'safaridriver.log', 'w'), stderr=subprocess.STDOUT)
    for _ in range(40):
        try:
            request('GET', '/status')
            break
        except Exception:
            time.sleep(.25)
    session = request('POST', '/session', {'capabilities': {'alwaysMatch': {'browserName': 'safari'}}})
    sid = session['sessionId']
    command('/timeouts', {'pageLoad': 60000, 'script': 20000, 'implicit': 0})
    command('/window/rect', {'width': 1440, 'height': 1000})
    command('/url', {'url': BASE + '?native-safari-audit=1'})
    wait("document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert", 75)
    hero = js("const v=document.getElementById('film');return {time:v.currentTime,duration:v.duration,ended:v.ended,error:v.error&&v.error.code}")
    rows.append({'hero': hero, 'session': session['capabilities'], 'state': state()})
    js("""
      const raw=requestAnimationFrame.bind(window);
      window.__nativePerf={active:false,frames:[],last:0,rects:0,rectMs:0};
      const rect=Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect=function(...args){const start=performance.now(),result=rect.apply(this,args),p=window.__nativePerf;if(p.active){p.rects++;p.rectMs+=performance.now()-start}return result};
      function sample(now){const p=window.__nativePerf;if(p.active&&p.last)p.frames.push(now-p.last);p.last=p.active?now:0;raw(sample)}raw(sample);
      const css=document.createElement('style');css.id='qa-ablation';document.head.append(css);
    """)
    variants = {
      'baseline': '',
      'no-backdrop': '.popup-countdown{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
      'pause-covered': 'body.next-drop-landed #stage,body.next-drop-landed .seamsec{visibility:hidden!important}body.next-drop-landed .seamsec *,body.next-drop-landed .seamsec *::before,body.next-drop-landed .seamsec *::after{animation-play-state:paused!important}',
      'promote-mark': '.next-drop-mark{transform:translateZ(0)!important;will-change:transform}',
      'pause-css-diagnostic-only': '#nextDrop *,#nextDrop *::before,#nextDrop *::after{animation-play-state:paused!important}',
    }
    for variant, css in variants.items():
        js("document.getElementById('qa-ablation').textContent=arguments[0]", css)
        time.sleep(.4)
        measure(variant + '-collection-idle')
        if variant == 'baseline':
            screenshot('native-baseline-collection')
        result = measure(variant + '-to-signup', lambda: click('#collectionScrollCue'))
        assert result['state']['target'] == 'signup' and not result['state']['moving']
        measure(variant + '-signup-idle')
        if variant in ['baseline', 'no-backdrop']:
            screenshot('native-' + variant + '-signup')
        key('\ue011')  # Home is a real keyboard event in the current panel.
        wait("window.__vaultEntryGuide.target==='collection'&&!window.__vaultEntryGuide.moving")
    js("document.getElementById('qa-ablation').textContent=''")
    measure('final-baseline-to-signup', lambda: click('#collectionScrollCue'))
    measure('final-baseline-to-overview', lambda: click('#vaultScrollCue'))
    measure('final-baseline-zoom', lambda: key('\ue00f'))  # Page Down
    wait("window.__guide.phase()==='vault'&&!document.getElementById('vault').inert")
    screenshot('native-baseline-vault')
    rows.append({'status': 'PASS', 'state': state()})
except Exception as error:
    rows.append({'status': 'FAIL', 'error': repr(error)})
    print('NATIVE_SAFARI_FAILURE', repr(error), flush=True)
    raise
finally:
    (OUT / 'native-safari.json').write_text(json.dumps(rows, indent=2))
    if sid:
        try:
            request('DELETE', '/session/' + sid)
        except Exception:
            pass
    if server:
        server.terminate()
