"""Genera itemdata.js (nombres, tipo, requisitos y stats) e iconos assets/item/<id>.png a partir de la biblioteca resuelta (build_items.py) y String Eqp.img.
Uso: python3 gen_itemdata.py <wz_lib> <Eqp/tree.json> <juego_dir> <id> [<id> ...]"""
import sys, os, json, shutil
lib, eqp, game = sys.argv[1:4]; ids = sys.argv[4:]
E = json.load(open(eqp))
def name_of(i):
    def f(n):
        if isinstance(n, dict):
            if i in n and isinstance(n[i], dict) and 'name' in n[i]: return n[i]['name']
            for v in n.values():
                r = f(v)
                if r: return r
    return f(E)
TYPE = {'Cp': 'hat', 'Ma': 'top', 'MaPn': 'top', 'Pn': 'bottom', 'So': 'shoes', 'Gv': 'glove', 'Wp': 'weapon', 'WpSi': 'weapon', 'Si': 'sub', 'Sr': 'cape', 'Ri': 'ring', 'Ae': 'earring', 'Pe': 'pendant', 'Be': 'belt', 'Af': 'faceacc', 'Ay': 'eyeacc', 'Sh': 'shoulder'}
JOB = {1: 'warrior', 2: 'mage', 4: 'archer', 8: 'thief', 16: 'pirate'}
INC = {'incSTR': 'str', 'incDEX': 'dex', 'incINT': 'int', 'incLUK': 'luk', 'incPAD': 'att', 'incMAD': 'matt', 'incPDD': 'def', 'incMDD': 'mdef', 'incMHP': 'mhp', 'incMMP': 'mmp', 'incACC': 'acc', 'incEVA': 'eva', 'incSpeed': 'speed', 'incJump': 'jump', 'bdR': 'boss', 'imdR': 'ied'}
os.makedirs(os.path.join(game, 'assets/item'), exist_ok=True)
out = {}
for d in ids:
    info = json.load(open(os.path.join(lib, d, 'tree.json')))['info']
    i = str(int(d)); st = {}
    for k, v in info.items():
        if k in INC and not isinstance(v, dict):
            try: n = int(v)
            except Exception: continue
            if n: st[INC[k]] = n
    isl = info.get('islot', '')
    out[i] = {'n': name_of(i) or i, 't': TYPE.get(isl, 'weapon'), 'ov': isl == 'MaPn', 'lv': int(info.get('reqLevel', 0)), 'cls': JOB.get(int(info.get('reqJob', 0))),
              'req': [int(info.get('req' + s, 0)) for s in ('STR', 'DEX', 'INT', 'LUK')], 'st': st, 'as': int(info.get('attackSpeed', 0)), 'tuc': int(info.get('tuc', 0))}
    ic = info.get('icon')
    if ic:
        src = os.path.join(lib, d, ic['png'])
        if os.path.exists(src):
            from PIL import Image
            im = Image.open(src).convert('RGBA')
            if im.split()[3].getbbox(): shutil.copyfile(src, os.path.join(game, 'assets/item', i + '.png'))
            else: print('icono vacío:', d)
open(os.path.join(game, 'itemdata.js'), 'w', encoding='utf8').write('/* GENERADO por tools/gen_itemdata.py a partir de los .img del WZ. No editar a mano: edita los overrides en items.js. */\n(function (root) {\n  root.MapleItemData = ' + '{\n' + ',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v, ensure_ascii=False)) for k, v in out.items()) + '\n}' + ';\n  if (typeof module !== "undefined" && module.exports) module.exports = root.MapleItemData;\n})(typeof window !== "undefined" ? window : globalThis);\n')
print(len(out), 'ítems')
