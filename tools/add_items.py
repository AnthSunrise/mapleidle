"""Añade equipo nuevo a itemdata.js SIN regenerar todo. Uso:
  python3 tools/add_items.py <String Eqp tree.json> <juego_dir> <archivo01432002.img> [<otro.img> ...]
Extrae cada .img con wzimg.py, lee info (nivel, requisitos, stats, velocidad), copia el icono a assets/item/<id>.png y fusiona la entrada en itemdata.js.
(Los iconos que dependen de otro .img no se resuelven aquí: usa build_items.py + gen_itemdata.py.)"""
import sys, os, json, re, shutil, subprocess, tempfile
eqp, game = sys.argv[1:3]; imgs = sys.argv[3:]
here = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(eqp))
def name_of(i):
    def f(n):
        if isinstance(n, dict):
            if i in n and isinstance(n[i], dict) and 'name' in n[i]: return n[i]['name']
            for v in n.values():
                r = f(v)
                if r: return r
    return f(E)
TYPE = {'Cp': 'hat', 'Ma': 'top', 'MaPn': 'top', 'Pn': 'bottom', 'So': 'shoes', 'Gv': 'glove', 'Wp': 'weapon', 'WpSi': 'weapon', 'Si': 'sub', 'Sr': 'cape'}
JOB = {1: 'warrior', 2: 'mage', 4: 'archer', 8: 'thief', 16: 'pirate'}
INC = {'incSTR': 'str', 'incDEX': 'dex', 'incINT': 'int', 'incLUK': 'luk', 'incPAD': 'att', 'incMAD': 'matt', 'incPDD': 'def', 'incMDD': 'mdef', 'incMHP': 'mhp', 'incMMP': 'mmp', 'incACC': 'acc', 'incEVA': 'eva', 'incSpeed': 'speed', 'incJump': 'jump'}
p = os.path.join(game, 'itemdata.js'); src = open(p, encoding='utf8').read()
m = re.search(r'root\.MapleItemData = (\{.*?\n\});', src, re.S); data = json.loads(m.group(1))
for f in imgs:
    d = re.sub(r'\D', '', os.path.basename(f).split('.')[0].split('-')[-1]).zfill(8); i = str(int(d))
    tmp = tempfile.mkdtemp(); subprocess.run([sys.executable, '-I', os.path.join(here, 'wzimg.py'), f, tmp], check=True, capture_output=True)
    info = json.load(open(os.path.join(tmp, 'tree.json')))['info']; st = {}
    for k, v in info.items():
        if k in INC and not isinstance(v, dict):
            try: n = int(v)
            except Exception: continue
            if n: st[INC[k]] = n
    isl = info.get('islot', '')
    data[i] = {'n': name_of(i) or i, 't': TYPE.get(isl, 'weapon'), 'ov': isl == 'MaPn', 'lv': int(info.get('reqLevel', 0)), 'cls': JOB.get(int(info.get('reqJob', 0))),
               'req': [int(info.get('req' + s, 0)) for s in ('STR', 'DEX', 'INT', 'LUK')], 'st': st, 'as': int(info.get('attackSpeed', 0)), 'tuc': int(info.get('tuc', 0))}
    ic = info.get('icon'); ok = False
    if isinstance(ic, dict) and 'png' in ic and os.path.exists(os.path.join(tmp, ic['png'])):
        from PIL import Image
        if Image.open(os.path.join(tmp, ic['png'])).convert('RGBA').split()[3].getbbox():
            shutil.copyfile(os.path.join(tmp, ic['png']), os.path.join(game, 'assets/item', i + '.png')); ok = True
    print(i, data[i]['n'], 'icono OK' if ok else 'SIN ICONO', data[i]['st'])
body = '{\n' + ',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v, ensure_ascii=False)) for k, v in data.items()) + '\n}'
open(p, 'w', encoding='utf8').write(src[:m.start(1)] + body + src[m.end(1):])
