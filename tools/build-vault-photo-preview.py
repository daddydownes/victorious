from pathlib import Path
from PIL import Image,ImageOps
import json,re,subprocess,hashlib,base64,io,sys

repo=Path(__file__).resolve().parent.parent
root=repo.parent
if len(sys.argv) not in (2,3):raise SystemExit('Usage: python tools/build-vault-photo-preview.py SELECTED_PHOTO_DIRECTORY [--recreate-pinned-baseline]')
source=Path(sys.argv[1]).resolve()
revision='7d1ee6ea276215e4020b0b069c136264e5e08f60'
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
if head!=revision and sys.argv[2:]!=['--recreate-pinned-baseline']:
    raise SystemExit('Historical recreation replaces index.html from its pinned baseline. Use the normal tools/build-guided.cjs for ongoing work, or explicitly pass --recreate-pinned-baseline to recreate this approved archive.')
baseline=subprocess.check_output(['git','show',revision+':index.html'],cwd=repo).decode('utf-8')
captured=root/'evidence/current-live/index.html'
if captured.exists():assert baseline==captured.read_text(encoding='utf-8')
(repo/'baseline.html').write_text(baseline,encoding='utf-8')
old=json.loads(re.search(r'var PHOTOS=(\[.*?\]);',baseline,re.S)[1])
nh=[826,826,826,826,826,826,826,826,826,814,1102,826,826,1102,826,1102,620*4/3]
assert len(old)==len(nh)==17
assert json.loads(re.search(r'var PLANE=(\{.*?\});',baseline)[1])=={'w':3781,'h':3557}
files=sorted(p for p in source.iterdir() if p.suffix.lower() in ['.jpg','.jpeg','.png','.heic'])
assert len(files)==32,'Selection changed; update assignment explicitly before rebuilding'
(repo/'photos').mkdir(exist_ok=True)
manifest=[]
for i,p in enumerate(files):
    out=repo/'photos'/f'{i+1:02d}-{p.stem.split(" (")[0]}.jpg'
    if p.suffix.lower()=='.heic':
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(p),'-frames:v','1','-update','1',str(out)],check=True)
        im=Image.open(out)
    else:im=Image.open(p)
    im=ImageOps.exif_transpose(im).convert('RGB')
    dims=im.size
    im.thumbnail((1800,1800),Image.Resampling.LANCZOS)
    im.save(out,quality=90,optimize=True)
    thumb=im.copy();thumb.thumbnail((40,40));buf=io.BytesIO();thumb.save(buf,format='JPEG',quality=65)
    manifest.append({'name':p.name,'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'src':'photos/'+out.name,'dimensions':dims,'preview':'data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()})
# Keep all 17 approved live positions. Extend their surrounding edges with
# nearby neighbours on every side, using the same existing tile dimensions.
slots=list(range(17))+list(range(14))+[16]
extra_positions=[
    (2830,480),(450,110),(650,3280),(3060,3310),(1560,40),
    (25,2900),(30,930),(3500,1130),(3500,1820),(3550,2490),
    (35,1635),(40,2320),(2410,3220),(2220,170),(1460,3100)
]
order=[0,1,11,21,8,16,24,13,6,22,3,30,15,27,29,5,19,18,12,23,7,28,17,20,10,4,25,14,31,9,2,26]
assert sorted(order)==list(range(32))
layout=[]; heights=[]
for i,(slot,photo) in enumerate(zip(slots,order)):
    p={**old[slot],**manifest[photo]}
    x,y=(old[slot]['x'],old[slot]['y']) if i<17 else extra_positions[i-17]
    p.update(x=x,y=y,slot=slot,added=i>=17)
    layout.append(p);heights.append(nh[slot])
text=re.sub(r'var PHOTOS=\[.*?\];','var PHOTOS='+json.dumps(layout,ensure_ascii=False)+';',baseline,count=1,flags=re.S)
text=re.sub(r'var PHOTO_NH=\[.*?\];','var PHOTO_NH='+json.dumps(heights)+';',text,count=1)
text=text.replace('var PLANE={"w":3781,"h":3557}','var PLANE={"w":4100,"h":4200}')
text=text.replace("img.style.width=p.w+'px';","img.style.width=p.w+'px';\n      img.style.height=(p.w*PHOTO_NH[i]/620)+'px';\n      img.style.objectPosition='50% 50%';\n      img.dataset.photo=p.name; img.alt=p.name;\n      if(p.slot===16) img.classList.add('vault-centrepiece');")
text=text.replace('#vaultDJ{filter:none;border:0;box-shadow:none}','#vaultDJ,.vault-plane img.vault-centrepiece{filter:none;border:0;box-shadow:none}')
decode_queue="""  // Bound concurrent decode work for the expanded archive; retain the existing
  // low-resolution preview and failed-download behavior for every photograph.
  var vaultDecodeActive=0, vaultDecodeQueue=[];
  function decodeVaultImage(image){
    return new Promise(function(resolve,reject){
      function run(){
        vaultDecodeActive++;
        var ready=image.decode?image.decode():Promise.resolve();
        // A loaded image can transiently lose a decode request while many
        // archive images are promoted together. Retry once on the next task.
        if(image.decode) ready=ready.catch(function(){
          return new Promise(function(done){setTimeout(done,50);}).then(function(){return image.decode();});
        });
        var deadline;
        ready=Promise.race([ready,new Promise(function(done,fail){
          deadline=setTimeout(function(){fail(new Error('Vault image decode timeout'));},2000);
        })]);
        ready.then(resolve,reject).finally(function(){
          clearTimeout(deadline);
          vaultDecodeActive--;
          if(vaultDecodeQueue.length) vaultDecodeQueue.shift()();
        });
      }
      if(vaultDecodeActive<4) run(); else vaultDecodeQueue.push(run);
    });
  }
"""
text=text.replace('  var vaultImageJobs=new WeakMap();',decode_queue+'  var vaultImageJobs=new WeakMap();')
text=text.replace('var ready=full.decode?full.decode():Promise.resolve();','var ready=decodeVaultImage(full);')
# Keep the live opening composition. Only the pan extent grows; scale,
# drag/touch handlers, clamps, media and all entry choreography stay intact.
assert text.count('(vw-PW*S)/2')==3
text=text.replace('px=(vw-PW*S)/2','px=(vw-3781*S)/2')
text=text.replace('py=(vh-PH*S)/2','py=(vh-3557*S)/2')
navigation=json.loads((repo/'tools/vault-navigation-fix.json').read_text(encoding='utf-8-sig'))
assert text.count(navigation['before'])==1,'Navigation baseline changed'
text=text.replace(navigation['before'],navigation['after'])
(repo/'index.html').write_text(text,encoding='utf-8')
proof=root/'evidence/current'
proof.mkdir(exist_ok=True)
(proof/'photo-manifest.json').write_text(json.dumps([{k:v for k,v in p.items() if k!='preview'} for p in manifest],indent=2),encoding='utf-8')
(proof/'layout.json').write_text(json.dumps([{**{k:v for k,v in p.items() if k!='preview'},'h':p['w']*heights[i]/620} for i,p in enumerate(layout)],indent=2),encoding='utf-8')
(proof/'baseline-layout.json').write_text(json.dumps([{**{k:v for k,v in p.items() if k!='preview'},'h':p['w']*nh[i]/620} for i,p in enumerate(old)],indent=2),encoding='utf-8')
print('Built from deployed GitHub commit:',revision,'; selected',len(manifest),'; rendered',len(layout))
