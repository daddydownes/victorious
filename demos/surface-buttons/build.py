from pathlib import Path
import base64
root=Path(__file__).resolve().parents[2]
template=(Path(__file__).parent/'template.html').read_text()
for i,name in enumerate(['archive-01-58e7ac2e3a3b.jpg','archive-07-eb013a1343bd.jpg','archive-12-89f848d6f748.jpg'],1):
 template=template.replace('{{PHOTO'+str(i)+'}}','data:image/jpeg;base64,'+base64.b64encode((root/'assets'/name).read_bytes()).decode())
(Path(__file__).parent/'index.html').write_text(template)
print('Built three standalone Surface studies')
