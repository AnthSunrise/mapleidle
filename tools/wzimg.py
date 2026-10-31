"""Lector de .img crudos de MapleStory (WZ sin cifrar, IV cero). Uso: python3 wzimg.py archivo.img carpeta_salida
Exporta cada canvas a PNG y un tree.json con la estructura (origin, vectores, enteros, strings)."""
import sys, struct, zlib, json, os
from PIL import Image

class R:
    def __init__(s, d): s.d = d; s.p = 0
    def u8(s): v = s.d[s.p]; s.p += 1; return v
    def i8(s): v = struct.unpack_from('<b', s.d, s.p)[0]; s.p += 1; return v
    def u16(s): v = struct.unpack_from('<H', s.d, s.p)[0]; s.p += 2; return v
    def i32(s): v = struct.unpack_from('<i', s.d, s.p)[0]; s.p += 4; return v
    def u32(s): v = struct.unpack_from('<I', s.d, s.p)[0]; s.p += 4; return v
    def f32(s): v = struct.unpack_from('<f', s.d, s.p)[0]; s.p += 4; return v
    def f64(s): v = struct.unpack_from('<d', s.d, s.p)[0]; s.p += 8; return v
    def cint(s):
        b = s.i8()
        return s.i32() if b == -128 else b
    def wzstr(s):
        ln = s.i8()
        if ln > 0:
            if ln == 127: ln = s.i32()
            out = []; mask = 0xAAAA
            for i in range(ln):
                c = struct.unpack_from('<H', s.d, s.p)[0]; s.p += 2
                out.append(chr(c ^ mask)); mask = (mask + 1) & 0xFFFF
            return ''.join(out)
        if ln == 0: return ''
        if ln == -128: ln = s.i32()
        else: ln = -ln
        out = []; mask = 0xAA
        for i in range(ln):
            out.append(chr(s.d[s.p] ^ mask)); s.p += 1; mask = (mask + 1) & 0xFF
        return ''.join(out)
    def stroff(s, inline, off):
        t = s.u8()
        if t in (0x00, 0x73): return s.wzstr()
        if t in (0x01, 0x1B):
            o = s.i32(); save = s.p; s.p = o; v = s.wzstr(); s.p = save; return v
        raise ValueError('tipo string %x en %d' % (t, s.p))

def decode(fmt, w, h, raw):
    if fmt == 1:
        px = bytearray(w * h * 4)
        for i in range(w * h):
            v = raw[2*i] | (raw[2*i+1] << 8)
            px[4*i] = ((v >> 8) & 15) * 17; px[4*i+1] = ((v >> 4) & 15) * 17; px[4*i+2] = (v & 15) * 17; px[4*i+3] = ((v >> 12) & 15) * 17
        return Image.frombytes('RGBA', (w, h), bytes(px))
    if fmt == 2:
        b = bytearray(raw[:w*h*4])
        for i in range(0, len(b), 4): b[i], b[i+2] = b[i+2], b[i]
        return Image.frombytes('RGBA', (w, h), bytes(b))
    def r565(v): return (((v >> 11) & 31) * 255 // 31, ((v >> 5) & 63) * 255 // 63, (v & 31) * 255 // 31)
    if fmt == 513:
        px = bytearray(w * h * 4)
        for i in range(w * h):
            r, g, b = r565(raw[2*i] | (raw[2*i+1] << 8)); px[4*i:4*i+4] = bytes((r, g, b, 255))
        return Image.frombytes('RGBA', (w, h), bytes(px))
    if fmt == 517:
        im = Image.new('RGBA', (w, h)); bw = w // 16; k = 0
        for by in range(h // 16):
            for bx in range(bw):
                r, g, b = r565(raw[2*k] | (raw[2*k+1] << 8)); k += 1
                im.paste((r, g, b, 255), (bx*16, by*16, bx*16+16, by*16+16))
        return im
    if fmt in (1026, 2050):
        px = bytearray(w * h * 4); bw = (w + 3) // 4; bh = (h + 3) // 4; p = 0
        for by in range(bh):
            for bx in range(bw):
                blk = raw[p:p+16]; p += 16
                if fmt == 1026:
                    al = [((blk[i // 2] >> (4 * (i % 2))) & 15) * 17 for i in range(16)]
                else:
                    a0, a1 = blk[0], blk[1]; bits = int.from_bytes(blk[2:8], 'little')
                    if a0 > a1: tab = [a0, a1] + [((7 - j) * a0 + j * a1) // 7 for j in range(1, 7)]
                    else: tab = [a0, a1] + [((5 - j) * a0 + j * a1) // 5 for j in range(1, 5)] + [0, 255]
                    al = [tab[(bits >> (3 * i)) & 7] for i in range(16)]
                c0, c1 = blk[8] | (blk[9] << 8), blk[10] | (blk[11] << 8); idx = int.from_bytes(blk[12:16], 'little')
                a, b = r565(c0), r565(c1)
                cols = [a, b, tuple((2*a[i] + b[i]) // 3 for i in range(3)), tuple((a[i] + 2*b[i]) // 3 for i in range(3))]
                for i in range(16):
                    x, y = bx*4 + i % 4, by*4 + i // 4
                    if x < w and y < h:
                        c = cols[(idx >> (2*i)) & 3]; o = 4 * (y * w + x); px[o:o+4] = bytes((c[0], c[1], c[2], al[i]))
        return Image.frombytes('RGBA', (w, h), bytes(px))
    return None

def prop_list(r, base, outdir, path, stats):
    n = r.cint(); out = {}
    for _ in range(n):
        name = r.stroff(0, 0).replace('.', 'dot').replace('/', '_'); t = r.u8()
        if t == 0: v = None
        elif t in (2, 11): v = struct.unpack_from('<h', r.d, r.p)[0]; r.p += 2
        elif t == 3: v = r.cint()
        elif t == 4: v = r.f32() if r.u8() == 0x80 else 0.0
        elif t == 5: v = r.f64()
        elif t == 8: v = r.stroff(0, 0)
        elif t == 9:
            size = r.u32(); end = r.p + size; v = extended(r, base, outdir, path + [name], stats); r.p = end
        else: raise ValueError('tipo prop %d en %d (%s)' % (t, r.p, '/'.join(path + [name])))
        out[name] = v
    return out

def extended(r, base, outdir, path, stats):
    kind = r.stroff(0, 0)
    if kind == 'Property':
        r.u16(); return prop_list(r, base, outdir, path, stats)
    if kind == 'Canvas':
        r.u8(); node = {'_type': 'canvas'}
        if r.u8() == 1: r.u16(); node.update(prop_list(r, base, outdir, path, stats))
        w, h, f1, f2 = r.cint(), r.cint(), r.cint(), r.u8(); r.p += 4; ln = r.i32(); r.u8()
        data = bytes(r.d[r.p:r.p + ln - 1]); node['w'] = w; node['h'] = h; fmt = f1 + f2; node['fmt'] = fmt
        try:
            raw = zlib.decompressobj().decompress(data); im = decode(fmt, w, h, raw)
            if im is not None:
                fn = '/'.join(path) + '.png'; fp = os.path.join(outdir, fn); os.makedirs(os.path.dirname(fp), exist_ok=True); im.save(fp); node['png'] = fn; stats['ok'] += 1
            else: stats['fmt'].add(fmt)
        except Exception as e:
            stats['err'] += 1
            if stats['err'] < 4: print('ERR', '/'.join(path), fmt, w, h, ln, bytes(data[:6]).hex(), repr(e))
        return node
    if kind == 'Shape2D#Vector2D': return {'_type': 'vec', 'x': r.cint(), 'y': r.cint()}
    if kind == 'UOL': r.u8(); return {'_type': 'uol', 'v': r.stroff(0, 0)}
    if kind == 'Shape2D#Convex2D':
        n = r.cint(); return {'_type': 'convex', 'n': [extended(r, base, outdir, path, stats) for _ in range(n)]}
    return {'_type': kind}

if __name__ == '__main__':
    d = open(sys.argv[1], 'rb').read(); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    r = R(d); stats = {'ok': 0, 'err': 0, 'fmt': set()}
    assert r.stroff(0, 0) == 'Property'; r.u16()
    tree = prop_list(r, 0, out, [], stats)
    # enlaces (canvas vacíos con 'source'): si apuntan a este mismo .img se copia el PNG real; si apuntan a otro (ej. Basic.img) se avisa
    def find(node, parts):
        for q in parts:
            if not isinstance(node, dict) or q not in node: return None
            node = node[q]
        return node
    me = os.path.basename(sys.argv[1]).split('-', 1)[-1]
    fixed = [0]; ext = {}
    def walk(n):
        if isinstance(n, dict):
            if n.get('_type') == 'canvas' and n.get('source') and n.get('png'):
                src = n['source'].split('/'); tgt = None
                if len(src) > 2 and src[1] == me: tgt = find(tree, src[2:])
                if tgt and tgt.get('png') and tgt['png'] != n['png']:
                    Image.open(os.path.join(out, tgt['png'])).save(os.path.join(out, n['png'])); fixed[0] += 1
                elif len(src) > 2 and src[1] != me and Image.open(os.path.join(out, n['png'])).getextrema()[3][1] == 0:
                    ext[n['source']] = ext.get(n['source'], 0) + 1
            for v in n.values(): walk(v)
    walk(tree)
    if fixed[0]: print('enlaces internos resueltos:', fixed[0])
    if ext: print('enlaces a otros .img (copia el PNG de allí):', len(ext), list(ext)[:5])
    json.dump(tree, open(os.path.join(out, 'tree.json'), 'w'), ensure_ascii=False)
    print(sys.argv[1], 'png', stats['ok'], 'errores', stats['err'], 'formatos sin soporte', sorted(stats['fmt']), 'top:', list(tree.keys())[:40])
