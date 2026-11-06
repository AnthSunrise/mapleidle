"""Convierte el tree.json de un mapa (.img extraído con wzimg.py) en mapdata_<id>.js (footholds, ladders, life).
Uso: python3 map_from_img.py <tree.json> <salida.js> <id_mapa>"""
import sys, json
if len(sys.argv) < 4 or not sys.argv[1].lower().endswith('.json'):
    sys.exit('Uso: python3 map_from_img.py <carpeta_salida>/tree.json <mapdata_nombre.js> <id_mapa>\n(primero: python3 wzimg.py <mapa>.img <carpeta_salida>)')
t = json.load(open(sys.argv[1], encoding='utf-8')); out, mid = sys.argv[2], sys.argv[3]
fh = []
for pg in t['foothold'].values():
    for grp in pg.values():
        for i, f in grp.items(): fh.append({'id': int(i), 'x1': f['x1'], 'y1': f['y1'], 'x2': f['x2'], 'y2': f['y2'], 'prev': f['prev'], 'next': f['next']})
fh.sort(key=lambda f: f['id'])
lad = [{'l': l['l'], 'x': l['x'], 'y1': l['y1'], 'y2': l['y2']} for l in t.get('ladderRope', {}).values()]
life = [{'type': l['type'], 'id': l['id'], 'x': l['x'], 'y': l['y'], 'fh': l['fh'], 'cy': l['cy'], 'rx0': l['rx0'], 'rx1': l['rx1']} for l in t.get('life', {}).values() if l['type'] == 'm']
d = {'footholds': fh, 'ladders': lad, 'life': life}
open(out, 'w', encoding='utf-8').write('// Generado por tools/map_from_img.py a partir de %s.img\nvar MAPDATA_%s = %s;\nif (typeof module !== \'undefined\') module.exports = MAPDATA_%s;\n' % (mid, mid, json.dumps(d, separators=(',', ':')), mid))
print(len(fh), 'footholds', len(lad), 'ladders', len(life), 'mobs')
