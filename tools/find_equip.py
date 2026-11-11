"""Busca equipos por NOMBRE en String.wz/Eqp.img y lista TODOS los IDs que comparten ese nombre (variantes).
Uso: python3 find_equip.py <Eqp.img | Eqp_tree.json> "Nombre 1" "Nombre 2" ...      (búsqueda exacta, sin distinguir mayúsculas)
     python3 find_equip.py <Eqp.img> -c "Nombre"                                   (contiene el texto)
     python3 find_equip.py <Eqp.img> "Nombre" --info [--solo-sugerida]               (con --copiar)
       Con --info puedes indicar el nivel que quieres para esa arma con @: "Asianic Bow@55" -> sugiere la variante cuyo nivel esté más cerca de 55
       (si empatan, la de menor ATT). Sin @ sugiere la de mayor nivel.
       --info muestra nivel, ATT/MATT y requisitos de cada variante (necesita --copiar <carpeta> para leer los .img) y marca la SUGERIDA:
       la de mayor nivel requerido (si empatan, mayor ATT). --solo-sugerida copia únicamente esa en vez de todas.
     python3 find_equip.py <Eqp.img> "Nombre" --copiar <carpeta Character.wz exportada> <carpeta_salida>
       copia a <carpeta_salida>/<Categoría>/ los .img de TODAS las variantes que existan en tu exportación (para que yo elija la buena)."""
import sys, os, json, shutil, tempfile, subprocess, collections
a = sys.argv[1:]
if len(a) < 2: sys.exit(__doc__)
src = a.pop(0); sub = '-c' in a
copy = None
if '--copiar' in a:
    k = a.index('--copiar'); copy = (a[k + 1], a[k + 2]); a = a[:k]
info = '--info' in a; solo = '--solo-sugerida' in a
a = [x for x in a if x not in ('-c', '--info', '--solo-sugerida')]
wz = []
if src.lower().endswith('.img'):
    wz = [p for p in (os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wzimg.py'), os.path.join(os.getcwd(), 'wzimg.py')) if os.path.exists(p)]
    if not wz: sys.exit('Falta wzimg.py: copia wzimg.py (de la carpeta tools del proyecto) junto a find_equip.py.')
    d = tempfile.mkdtemp(prefix='eqp_'); subprocess.run([sys.executable, wz[0], src, d], check=True, stdout=subprocess.DEVNULL); src = os.path.join(d, 'tree.json')
E = json.load(open(src, encoding='utf-8')); names = collections.defaultdict(list)
def walk(n, path):
    for k, v in n.items():
        if not isinstance(v, dict): continue
        if k.isdigit() and 'name' in v: names[v['name']].append((k, path[-1] if path else '?'))
        else: walk(v, path + [k])
walk(E, [])
idx = {}
def read_info(f):
    d = tempfile.mkdtemp(prefix='eqpi_'); env = dict(os.environ, WZ_NOPNG='1')
    subprocess.run([sys.executable, wz[0] if wz else 'wzimg.py', f, d], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
    try: inf = json.load(open(os.path.join(d, 'tree.json'), encoding='utf-8')).get('info', {})
    except Exception: inf = {}
    shutil.rmtree(d, ignore_errors=True)
    g = lambda k: inf.get(k) if not isinstance(inf.get(k), dict) else None
    return {'lv': int(g('reqLevel') or 0), 'att': int(g('incPAD') or 0), 'matt': int(g('incMAD') or 0), 'req': ' '.join('%s %s' % (k[3:], g(k)) for k in ('reqSTR', 'reqDEX', 'reqINT', 'reqLUK') if g(k)), 'tuc': g('tuc')}
if copy:
    for r, _, fs in os.walk(copy[0]):
        for f in fs: idx[f] = os.path.join(r, f)
if not wz: wz = [p for p in (os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wzimg.py'), os.path.join(os.getcwd(), 'wzimg.py')) if os.path.exists(p)]
if info and not copy: sys.exit('--info necesita --copiar <carpeta_Character.wz> <carpeta_salida> para leer los .img.')
if info and not wz: sys.exit('Falta wzimg.py junto a find_equip.py.')
def do_copy(f):
    rel = os.path.relpath(os.path.dirname(f), copy[0]); od = os.path.join(copy[1], rel); os.makedirs(od, exist_ok=True); shutil.copyfile(f, os.path.join(od, os.path.basename(f)))
for q in a:
    target = None
    if '@' in q:
        q, t = q.rsplit('@', 1); target = int(t)
    hits = [n for n in names if (q.lower() in n.lower() if sub else q.lower() == n.lower())]
    if not hits: print('%s: no encontrado' % q); continue
    for n in hits:
        v = sorted(names[n]); print('%s: %d variante(s)' % (n, len(v)))
        rows = []
        for i, cat in v:
            f = idx.get('%s.img' % i.zfill(8)) if copy else None
            rows.append((i, cat, f, read_info(f) if (info and f) else None))
        best = None
        if info:
            ok = [r for r in rows if r[3]]
            if ok: best = (min(ok, key=lambda r: (abs(r[3]['lv'] - target), r[3]['att'] + r[3]['matt'])) if target is not None else max(ok, key=lambda r: (r[3]['lv'], r[3]['att'] + r[3]['matt'])))[0]
        for i, cat, f, d in rows:
            ex = ''
            if copy and not f: ex = '  (no está en tu exportación)'
            elif d: ex = '  Lv%d  ATT %d  MATT %d  req %s%s%s' % (d['lv'], d['att'], d['matt'], d['req'] or '-', '  <- SUGERIDA' if i == best else '', '')
            if f and (not solo or i == best or best is None): do_copy(f); ex += '  -> copiado'
            print('   %s  [%s]%s' % (i.zfill(8), cat, ex))
