"""Native Safari on a hosted Mac; not a physical iPhone test. No form submissions."""
import base64, json, os, pathlib, time, urllib.request
OUT=pathlib.Path(os.environ['EVIDENCE_DIR']);OUT.mkdir(parents=True,exist_ok=True)
ROOT='http://127.0.0.1:4444';SID=None

def request(method,path,data=None):
    req=urllib.request.Request(ROOT+path,data=None if data is None else json.dumps(data).encode(),method=method,headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=100) as r: result=json.load(r)['value']
    if isinstance(result,dict) and 'error' in result: raise RuntimeError(result)
    return result

def execute(script,*args): return request('POST','/session/'+SID+'/execute/sync',{'script':script,'args':list(args)})
def wait(script,seconds=70):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        value=execute(script)
        if value: return value
        time.sleep(.2)
    raise RuntimeError('Timed out: '+script)

def key(value):
    request('POST','/session/'+SID+'/actions',{'actions':[{'type':'key','id':'keyboard','actions':[{'type':'keyDown','value':value},{'type':'keyUp','value':value}]}]})

rows=[]
try:
    result=request('POST','/session',{'capabilities':{'alwaysMatch':{'browserName':'safari'}}});SID=result['sessionId']
    (OUT/'safari-capabilities.json').write_text(json.dumps(result,indent=2))
    request('POST','/session/'+SID+'/window/rect',{'width':1440,'height':1000})
    for variant,css in [('baseline',''),('retired','.seamsec *,.seamsec *::before,.seamsec *::after{animation:none!important}'),('backdrop','.popup-countdown{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}')]:
        request('POST','/session/'+SID+'/url',{'url':os.environ['BASE_URL']+'?native-safari='+variant})
        wait("return document.body.classList.contains('next-drop-landed')&&!document.getElementById('nextDrop').inert")
        row={'variant':variant,'segments':[],'hero':execute("const v=document.getElementById('film');return {time:v.currentTime,duration:v.duration,ended:v.ended,error:v.error?.code||null}"),'viewport':execute('return {width:innerWidth,height:innerHeight,ua:navigator.userAgent}')};rows.append(row)
        if css: execute("const s=document.createElement('style');s.textContent=arguments[0];document.head.appendChild(s)",css)
        execute("document.getElementById('nextDrop').focus({preventScroll:true})")
        for stage in ['collection-idle','signup','signup-idle','overview','overview-idle','vault']:
            execute("window.__np={active:true,last:0,times:[]};function sample(t){const q=window.__np;if(!q.active)return;if(q.last)q.times.push(t-q.last);q.last=t;requestAnimationFrame(sample)}requestAnimationFrame(sample)")
            if not stage.endswith('idle'): key('\ue00f')
            time.sleep(1.2)
            stats=execute("const q=window.__np;q.active=false;const a=q.times.sort((a,b)=>a-b);return {frames:a.length,p95:a[Math.floor(a.length*.95)]||0,max:a.at(-1)||0,over34:a.filter(x=>x>34).length,target:window.__vaultEntryGuide.target,moving:window.__vaultEntryGuide.moving,phase:window.__guide.phase(),top:document.getElementById('nextDrop').scrollTop}")
            stats['stage']=stage;row['segments'].append(stats)
            wait('return !window.__vaultEntryGuide.moving',15)
            if variant=='baseline':
                image=request('GET','/session/'+SID+'/screenshot');(OUT/('safari-'+stage+'.png')).write_bytes(base64.b64decode(image))
        print('NATIVE_SAFARI',json.dumps(row),flush=True)
        (OUT/'safari-native.json').write_text(json.dumps(rows,indent=2))
except Exception as error:
    (OUT/'safari-error.txt').write_text(str(error));raise
finally:
    if SID: request('DELETE','/session/'+SID)
