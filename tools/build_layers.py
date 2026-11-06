"""Empaqueta las capas del personaje (cuerpo, cabeza, cara, pelo y equipos) para el compositor del juego (layers.js).
Uso: python3 build_layers.py <wz_lib> <wz_base_out> <juego_dir> <id_cuerpo> <id_cabeza> <ids...>
- Resuelve los nodos 'uol' (referencias relativas dentro del mismo .img) y descarta los frames que no se usan.
- Escribe assets/layers/<id>.png (atlas, sin duplicados) y layerdata.js (zmap, smap, y por ítem: islot, vslot, acciones -> frames -> capas)."""
import sys, os, json, hashlib
from PIL import Image
lib, base, game, body, head = sys.argv[1:6]; ids = [body, head] + sys.argv[6:]
ACTIONS = ['stand1', 'walk1', 'jump', 'alert', 'swingO1', 'swingO2', 'swingO3', 'stabO1', 'shoot1', 'swingP1', 'swingP2', 'swingPF', 'swingT2', 'stabT2', 'ladder', 'rope',
           'stand2', 'walk2', 'swingT1', 'swingT3', 'stabT1', 'stabO2', 'shoot2', 'swingOF', 'prone']   # (etapa 42: poses de lanza, ballesta, pistola y daga)
zm = json.load(open(os.path.join(base, 'zmap/tree.json'))); sm = json.load(open(os.path.join(base, 'smap/tree.json')))
zlist = list(zm.keys())            # de delante hacia atrás
os.makedirs(os.path.join(game, 'assets/layers'), exist_ok=True)

def get(tree, path):
    n = tree
    for k in path:
        if not isinstance(n, dict) or k not in n: return None
        n = n[k]
    return n
def resolve(tree, path, node, depth=0):
    """node en 'path' (lista de claves); sigue uol hasta un canvas"""
    while isinstance(node, dict) and node.get('_type') == 'uol' and depth < 10:
        base_p = list(path[:-1])
        for seg in node['v'].split('/'):
            if seg == '..': base_p.pop()
            elif seg: base_p.append(seg)
        path = base_p; node = get(tree, path); depth += 1
    return path, node

out_items = {}
for i in ids:
    d = os.path.join(lib, i); tree = json.load(open(os.path.join(d, 'tree.json'))); info = tree.get('info', {})
    layers_img = []; imgs = {}            # hash -> (index, PIL)
    def add_img(png):
        im = Image.open(os.path.join(d, png)).convert('RGBA'); h = hashlib.md5(im.tobytes() + bytes(im.size)).hexdigest()
        if h not in imgs: imgs[h] = (len(imgs), im)
        return imgs[h][0]
    def layer(path, n, name):
        if not isinstance(n, dict) or n.get('_type') != 'canvas' or 'png' not in n: return None
        o = n.get('origin', {}); m = {k: [v['x'], v['y']] for k, v in n.get('map', {}).items() if isinstance(v, dict)}
        return {'p': name, 'z': n.get('z', name), 'o': [o.get('x', 0), o.get('y', 0)], 'm': m, 'i': add_img(n['png'])}
    item = {'islot': info.get('islot', ''), 'vslot': info.get('vslot', ''), 'a': {}}
    def frame_layers(frame_node, fpath):
        res = []
        for pname, pn in frame_node.items():
            if pname in ('delay', 'face') or not isinstance(pn, dict): continue
            pp, n = resolve(tree, fpath + [pname], pn)
            L = layer(pp, n, pname)
            if L: res.append(L)
        return res
    if i == head:   # cabeza: front (y back si hace falta)
        for a in ACTIONS:
            at = tree.get(a)
            if not at: continue
            fr = []
            for k in sorted([k for k in at if k.isdigit()], key=int): fr.append(frame_layers(at[k], [a, k]))
            item['a'][a] = fr
    if i != head:
        if i.startswith('0002'):    # cara (ids 20000-29999): expresión default
            dflt = tree.get('default') or {}
            item['face'] = [L for L in (layer(['default', k], v, k) for k, v in dflt.items() if isinstance(v, dict)) if L]
        elif i.startswith('0003'):                             # pelo: default (cara de frente) y backDefault
            for key, nm in (('default', 'front'), ('backDefault', 'back')):
                dflt = tree.get(key) or {}
                item[nm] = [L for L in (layer([key, k], v, k) for k, v in dflt.items() if isinstance(v, dict)) if L]
        else:
            for a in ACTIONS:
                at = tree.get(a)
                if not at: continue
                fr = []
                nf = max([int(k) for k in at if k.isdigit()] + [-1]) + 1
                for k in range(nf):
                    fn = at.get(str(k))
                    if not isinstance(fn, dict): fr.append([]); continue
                    if i == body:
                        fl = frame_layers(fn, [a, str(k)]); fr.append({'l': fl, 'd': fn.get('delay', 100), 'f': fn.get('face', 1) if not isinstance(fn.get('face'), dict) else 1})
                    else: fr.append(frame_layers(fn, [a, str(k)]))
                item['a'][a] = fr
            if not item['a'] and tree.get('default'):          # gorros: capa única 'default'
                dflt = tree['default']
                item['static'] = [L for L in (layer(['default', k], v, k) for k, v in dflt.items() if isinstance(v, dict)) if L]
    if i == body:   # acciones compuestas: cada fotograma referencia otra acción (+ desplazamiento y rotación); somersault y poses de disparo (shot = shoot2 + stabO1)
        item['comp'] = {}
        for cname in ('somersault', 'shot', 'triplefire', 'doublefire', 'rapidfire', 'handgun'):
            if not isinstance(tree.get(cname), dict): continue
            comp = []
            for k in sorted([k for k in tree[cname] if k.isdigit()], key=int):
                fn = tree[cname][k]; mv = fn.get('move') or {}
                d = abs(fn.get('delay', 0))
                if cname != 'somersault' and d == 0: continue    # fotograma final de retorno (delay 0)
                comp.append({'a': fn.get('action'), 'f': fn.get('frame', 0), 'd': d, 'mv': [mv.get('x', 0), mv.get('y', 0)], 'rot': fn.get('rotate', 0)})
            item['comp'][cname] = comp
    # atlas
    items = sorted(imgs.values(), key=lambda x: -x[1].height); W = 1024; x = y = rowh = 0; rects = {}
    for idx, im in items:
        w, h = im.size
        if x + w > W: x = 0; y += rowh + 1; rowh = 0
        rects[idx] = [x, y, w, h]; x += w + 1; rowh = max(rowh, h)
    H = y + rowh + 1
    if imgs:
        atlas = Image.new('RGBA', (W, max(H, 1)), (0, 0, 0, 0))
        for idx, im in items: atlas.paste(im, tuple(rects[idx][:2]))
        atlas.save(os.path.join(game, 'assets/layers/%s.png' % i), optimize=True)
    def fix(o):
        if isinstance(o, dict):
            if 'i' in o and 'p' in o: o['r'] = rects[o.pop('i')]
            for v in o.values(): fix(v)
        elif isinstance(o, list):
            for v in o: fix(v)
    fix(item); item['atlas'] = bool(imgs); out_items[i] = item
    print(i, 'imgs', len(imgs), 'acciones', list(item['a'].keys())[:3], 'static' in item, 'face' in item, 'front' in item)
data = {'zmap': zlist, 'smap': {k: v for k, v in sm.items() if isinstance(v, str)}, 'items': out_items}
open(os.path.join(game, 'layerdata.js'), 'w').write('/* GENERADO por tools/build_layers.py */\n(function (r) { r.MapleLayerData = ' + json.dumps(data, separators=(',', ':')) + '; })(typeof window !== "undefined" ? window : globalThis);\n')
print('layerdata.js', os.path.getsize(os.path.join(game, 'layerdata.js')) // 1024, 'KB')
