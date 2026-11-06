"""Importa un skill de un .img al juego: extrae los PNG con los nombres que espera el cargador y escribe el borrador de skills.js.
Uso:  python3 import_skill.py <archivo.img> <id_skill> <nombre_corto> [carpeta_assets_skill]
Ej.:  python3 import_skill.py 210.img 2101004 fp_flame_arrow
Crea:  assets/skill/<nombre>_icon.png  y  assets/skill/<nombre>/{effect,hit,ball,mob,tile}_N.png
Imprime un borrador para pegar en skills.js (origins, delays y fórmulas ya convertidas). Revisa el tipo (pasiva/buff/ataque) y los nombres."""
import sys, os, json, re, shutil, subprocess, tempfile

def expr(s):   # fórmula del WZ -> JS (x = nivel; d() = floor; u() = ceil)
    s = str(s).strip().replace('d(', 'Math.floor(').replace('u(', 'Math.ceil(')
    return re.sub(r'\bx\b', 'x', s)

def frames(node):   # {'0': canvas, '1': canvas...} -> lista ordenada de canvas
    ks = sorted((k for k in node if k.isdigit() and isinstance(node[k], dict) and node[k].get('_type') == 'canvas'), key=int)
    return [node[k] for k in ks]

def main():
    if len(sys.argv) < 4: sys.exit(__doc__)
    img, sid, name = sys.argv[1], sys.argv[2], sys.argv[3]
    here = os.path.dirname(os.path.abspath(__file__))
    base = sys.argv[4] if len(sys.argv) > 4 else os.path.join(here, '..', 'assets', 'skill')
    tmp = tempfile.mkdtemp(prefix='wzskill_')
    r = subprocess.run([sys.executable, '-I', os.path.join(here, 'wzimg.py'), img, tmp], capture_output=True, text=True)
    if not os.path.exists(os.path.join(tmp, 'tree.json')): sys.exit('wzimg.py falló:\n' + r.stdout + r.stderr)
    t = json.load(open(os.path.join(tmp, 'tree.json'), encoding='utf-8'))
    sk = t.get('skill', {}).get(sid)
    if not sk: sys.exit('El skill %s no está en %s. Skills disponibles: %s' % (sid, img, ', '.join(sorted(t.get('skill', {}).keys()))))
    out = os.path.join(base, name); os.makedirs(out, exist_ok=True); done = []
    def put(canvas, dst):
        if canvas.get('png'): shutil.copy(os.path.join(tmp, canvas['png']), dst); return True
        return False
    if sk.get('icon') and put(sk['icon'], os.path.join(base, name + '_icon.png')): done.append('icono')
    groups = {}   # prefijo -> lista de canvas
    for key in ('effect', 'ball', 'mob'):
        if key in sk and isinstance(sk[key], dict): groups[key] = frames(sk[key])
    for key in sorted(k for k in sk if re.fullmatch(r'effect\d+', k)): groups[key] = frames(sk[key])   # niveles de efecto (effect0, effect1...)
    if isinstance(sk.get('hit'), dict):
        for k in sorted(sk['hit'], key=lambda z: int(z) if z.isdigit() else 99):
            if isinstance(sk['hit'][k], dict) and sk['hit'][k].get('0'): groups['hit' if k == '0' else 'hit%s' % k] = frames(sk['hit'][k])
    if isinstance(sk.get('tile'), dict):
        for k in sorted(sk['tile'], key=lambda z: int(z) if z.isdigit() else 99):
            if isinstance(sk['tile'][k], dict): groups['tile_%s' % k] = frames(sk['tile'][k])
    for g, fr in groups.items():
        for i, c in enumerate(fr): put(c, os.path.join(out, '%s_%d.png' % (g, i)))
        done.append('%s x%d' % (g, len(fr)))
    print('// Copiado en %s: %s' % (out, ', '.join(done)))
    c = sk.get('common', {}); o = lambda fr: '[' + ', '.join('[%d, %d]' % (f['origin']['x'], f['origin']['y']) for f in fr) + ']'
    print('\n// ---- borrador para skills.js (revisa tipo, branches, req, nombre) ----')
    cid = re.sub(r'_(\w)', lambda m: m.group(1).upper(), name)   # fp_flame_arrow -> fpFlameArrow
    print("SKILLS.%s = {   // %s" % (cid, sid))
    print("  id: '%s', cls: '???', branches: ['???'], job: 2, skillId: %s, name: '???', maxLevel: %s," % (cid, sid, c.get('maxLevel', '???')))
    print("  icon: 'assets/skill/%s_icon.png', dir: 'assets/skill/%s/'," % (name, name))
    for k, lab in (('damage', 'damage'), ('mpCon', 'mpCon'), ('prop', 'prop'), ('time', 'duration'), ('mobCount', 'mobCount'), ('attackCount', 'attackCount'), ('bulletCount', 'bulletCount'), ('x', 'x'), ('y', 'y')):
        if k in c:
            v = str(c[k])
            print("  %s: %s," % (lab, ("function (x) { return %s; }" % expr(v)) if re.search(r'[a-z]', v.replace('x', '')) or 'x' in v else v))
    if 'lt' in c and 'rb' in c: print("  range: { x1: %d, x2: %d, y1: %d, y2: %d },   // WZ lt/rb (espejado: frente al personaje)" % (-c['rb']['x'] if c['rb']['x'] < 0 else 0, -c['lt']['x'], c['lt']['y'], c['rb']['y']))
    d = lambda fr: fr[0].get('delay', 100) if fr else 100
    for g in groups:
        fr = groups[g]
        if g == 'ball': print("  ball: { speed: 800, origin: %s, delay: %d, startY: 30 }," % (o(fr), d(fr)))
        elif g == 'mob': print("  mobFx: %s, mobFxDelay: %d," % (o(fr), d(fr)))
        elif g.startswith('tile'): print("  // %s origins: %s" % (g, o(fr)))
        else: print("  %s: %s.map(function (a) { return { ox: a[0], oy: a[1] }; }), %sDelay: %d," % (g, o(fr), 'effect' if g.startswith('effect') else 'hit', d(fr)))
    if 'action' in sk: print("  // action WZ: %s" % ', '.join(str(v) for v in sk['action'].values()))
    print("};")
    print("// y agrega '%s' al array ORDER (al final) de skills.js" % cid)
    shutil.rmtree(tmp, ignore_errors=True)
main()
