"""Construye la biblioteca de sprites WZ resuelta y los datos de ítems.
Uso: python3 build_items.py <salida_lib> <Eqp.img/tree.json> <dir_extraido> [<dir_extraido> ...]
Cada <dir_extraido> contiene subcarpetas <ID>/ (salida de wzimg.py con tree.json y PNGs).
- Resuelve los canvas vacíos con 'source' = 'Character/<cat>/<ID>.img/<ruta>' copiando el PNG del nodo destino (mismo .img u otro presente).
- Escribe <salida_lib>/<ID>/ (PNG resueltos + tree.json) y <salida_lib>/missing.txt con lo que sigue sin resolverse."""
import sys, os, json, shutil, re
out, eqp = sys.argv[1], sys.argv[2]
trees, dirs = {}, {}
for base in sys.argv[3:]:
    for d in sorted(os.listdir(base)):
        p = os.path.join(base, d, 'tree.json')
        if d.isdigit() and os.path.exists(p): trees[d] = json.load(open(p)); dirs[d] = os.path.join(base, d)
def node(tree, path):
    n = tree
    for k in [x for x in path.split('/') if x]:
        if not isinstance(n, dict) or k not in n: return None
        n = n[k]
    return n
def target(src, depth=0):
    """devuelve ruta absoluta del PNG real al que apunta 'source' (o None si falta)"""
    m = re.match(r'Character/(?:\w+/)?(\d+)\.img/(.*)$', src)
    if not m or depth > 8: return None
    i, path = m.group(1), m.group(2)
    if i not in trees: return None
    n = node(trees[i], path)
    if not isinstance(n, dict) or n.get('_type') != 'canvas': return None
    if 'source' in n and n['source'] != src:
        t = target(n['source'], depth + 1)
        if t: return t
    f = os.path.join(dirs[i], n['png'])
    return f if os.path.exists(f) else None
def walk(n, path, fn):
    if isinstance(n, dict):
        if n.get('_type') == 'canvas': fn(path, n)
        for k, v in n.items():
            if isinstance(v, dict): walk(v, path + '/' + k, fn)
missing, fixed = [], 0
os.makedirs(out, exist_ok=True)
for i, t in trees.items():
    dst = os.path.join(out, i)
    if os.path.exists(dst): shutil.rmtree(dst)
    shutil.copytree(dirs[i], dst)
    def fix(path, n):
        global fixed
        if 'source' not in n: return
        tg = target(n['source'])
        if tg: shutil.copyfile(tg, os.path.join(dst, n['png'])); fixed += 1
        else: missing.append('%s%s <- %s' % (i, path, n['source']))
    walk(t, '', fix)
    json.dump(t, open(os.path.join(dst, 'tree.json'), 'w'))
open(os.path.join(out, 'missing.txt'), 'w').write('\n'.join(missing))
print('ids', len(trees), 'enlaces resueltos', fixed, 'sin resolver', len(missing))
