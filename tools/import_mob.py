"""Importa un enemigo de un .img: extrae sus sprites con los nombres del juego y escribe las líneas de sim.js.
Uso:  python3 import_mob.py <archivo.img> <nombre_corto> [carpeta_assets_mob]
Ej.:  python3 import_mob.py 5150003.img golem
Crea assets/mob/<nombre>/{stand,move,hit,die}_N.png. Imprime las líneas para mobTypes / mobRewards (sim.js) y el nombre para la lista de game.js."""
import sys, os, json, re, shutil, subprocess, tempfile
if len(sys.argv) < 3: sys.exit(__doc__)
img, name = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
base = sys.argv[3] if len(sys.argv) > 3 else os.path.join(here, '..', 'assets', 'mob')
tmp = tempfile.mkdtemp(prefix='wzmob_')
r = subprocess.run([sys.executable, '-I', os.path.join(here, 'wzimg.py'), img, tmp], capture_output=True, text=True)
if not os.path.exists(os.path.join(tmp, 'tree.json')): sys.exit('wzimg.py falló:\n' + r.stdout + r.stderr)
t = json.load(open(os.path.join(tmp, 'tree.json'), encoding='utf-8'))
def frames(node):
    if not isinstance(node, dict): return []
    return [node[k] for k in sorted((k for k in node if k.isdigit() and isinstance(node[k], dict) and node[k].get('png')), key=int)]
pick = lambda *ks: next((frames(t[k]) for k in ks if k in t and frames(t[k])), [])
sets = {'stand': pick('stand'), 'move': pick('move', 'fly', 'walk'), 'hit': pick('hit', 'hit1'), 'die': pick('die', 'die1')}
out = os.path.join(base, name); os.makedirs(out, exist_ok=True)
for k, fr in sets.items():
    for i, c in enumerate(fr): shutil.copy(os.path.join(tmp, c['png']), os.path.join(out, '%s_%d.png' % (k, i)))
print('// Copiado en %s: %s' % (out, ', '.join('%s x%d' % (k, len(v)) for k, v in sets.items())))
if not sets['move']: print('// AVISO: sin move/fly; el juego usará stand')
i = t.get('info', {}); mid = re.sub(r'\D', '', os.path.basename(img).split('-', 1)[-1]) or '???'
print("\n// ---- sim.js (DEFAULT_CFG) ----")
print("// mobTypes:    '%s': '%s'   (si el mapa trae el id con cero delante, usa esa clave exacta, ej. '0%s')" % (mid.lstrip('0'), name, mid.lstrip('0')))
print("// mobRewards:  %s: { exp: %s, meso: [?, ?], touch: %s, hp: %s, level: %s }   // meso: provisional (≈ nivel*1.5 a nivel*3). Añade hpMul/expMul si quieres ajustarlo" % (name, i.get('exp', '?'), i.get('PADamage', '?'), i.get('maxHP', '?'), i.get('level', '?')))
print("// info extra: PDDamage %s, MDDamage %s, maxMP %s, acc %s, eva %s, speed %s" % (i.get('PDDamage'), i.get('MDDamage'), i.get('maxMP'), i.get('acc'), i.get('eva'), i.get('speed')))
print("// game.js: agrega '%s' a la lista  for (var kind of [...])" % name)
shutil.rmtree(tmp, ignore_errors=True)
