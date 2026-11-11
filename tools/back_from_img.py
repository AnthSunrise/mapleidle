"""Fondos de mapa. Uso (todo desde la carpeta tools/ del proyecto, junto a wzimg.py):
  python3 back_from_img.py <mapa>.img <clave_mapa> <Back1>.img [<Back2>.img ...]
Ejemplo (Golem Temple, que usa por ejemplo los sets de fondo "goldenTemple" y "goldenTemple2"; mira el campo bS de las capas del mapa):
  python3 back_from_img.py 100040300.img golem goldenTemple.img goldenTemple2.img
  - <clave_mapa> es la clave del mapa en maps.js (golem, boars, kerning...).
  - El nombre de cada Back .img (sin .img) tiene que coincidir con el bS que pide el mapa. El script avisa de los que falten.
  - También acepta lo ya extraído: <mapa_tree.json> y bS=<carpeta_wzimg>.
Copia a assets/back/<bS>/ solo los sprites usados por el mapa (estáticos: back/<no>.png; animados: ani/<no>/<frame>.png)
y escribe backdata_<clave_mapa>.js con las capas (x, y, rx, ry, type, cx, cy, alpha, front, flip, ani)."""
import sys, json, os, shutil
if len(sys.argv) < 4: sys.exit(__doc__)
import subprocess, tempfile
here = os.path.dirname(os.path.abspath(__file__))
def extract(img):
    d = tempfile.mkdtemp(prefix='wzimg_'); subprocess.run([sys.executable, os.path.join(here, 'wzimg.py'), img, d], check=True, stdout=subprocess.DEVNULL); return d
if sys.argv[1].lower().endswith('.img'): sys.argv[1] = os.path.join(extract(sys.argv[1]), 'tree.json')
tree = json.load(open(sys.argv[1], encoding='utf-8')); key = sys.argv[2]
dirs = {}
for a in sys.argv[3:]:
    if '=' in a: k, v = a.split('=', 1)
    else: k, v = os.path.splitext(os.path.basename(a))[0], extract(a)
    dirs[k] = v
used = sorted(set(b['bS'] for b in tree['back'].values())); print('Sets de fondo que usa el mapa:', ', '.join(used))
for k in list(dirs):   # tolera nombres con prefijo (ej. 0f386bf0-dryRock.img)
    if k not in used:
        m = [u for u in used if k.lower().endswith(u.lower()) and u not in dirs]
        if m: dirs[m[0]] = dirs.pop(k)
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); out = os.path.join(root, 'assets', 'back')
cache = {}
def bs_tree(bs):
    if bs not in cache: cache[bs] = json.load(open(os.path.join(dirs[bs], 'tree.json'), encoding='utf-8'))
    return cache[bs]
def put(bs, src_rel):
    dst = os.path.join(out, bs, src_rel.replace('/', '_')); os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(os.path.join(dirs[bs], src_rel), dst); return 'back/%s/%s' % (bs, src_rel.replace('/', '_'))
def frame(bs, node):
    o = node.get('origin', {}); return {'src': put(bs, node['png']), 'ox': o.get('x', 0), 'oy': o.get('y', 0), 'w': node['w'], 'h': node['h'], 'delay': node.get('delay', 100)}
layers = []
for k in sorted(tree['back'], key=lambda s: int(s)):
    b = tree['back'][k]; bs = b['bS']
    if bs not in dirs: print('FALTA', bs, '(capa', k, ')'); continue
    bt = bs_tree(bs); no = str(b['no']); fr = []
    if b.get('ani'):
        node = bt.get('ani', {}).get(no)
        if not node: print('FALTA ani', bs, no); continue
        fr = [frame(bs, node[f]) for f in sorted((f for f in node if isinstance(node[f], dict) and node[f].get('_type') == 'canvas'), key=int)]
    else:
        node = bt.get('back', {}).get(no)
        if not node: print('FALTA back', bs, no); continue
        fr = [frame(bs, node)]
    layers.append({'x': b['x'], 'y': b['y'], 'rx': b['rx'], 'ry': b['ry'], 'type': b['type'], 'cx': b.get('cx', 0), 'cy': b.get('cy', 0), 'a': b.get('a', 255), 'front': b.get('front', 0), 'f': b.get('f', 0), 'frames': fr})
f = os.path.join(root, 'backdata_%s.js' % key)
open(f, 'w', encoding='utf-8').write("// Generado por tools/back_from_img.py\nwindow.MAPLE_BACKS = window.MAPLE_BACKS || {};\nwindow.MAPLE_BACKS[%s] = %s;\n" % (json.dumps(key), json.dumps(layers, separators=(',', ':'))))
print(len(layers), 'capas ->', f)
