/* Personaje por capas: arma cada fotograma a partir de cuerpo + cabeza + cara + pelo + equipos (datos de layerdata.js, atlas en assets/layers/).
 * Algoritmo (como el cliente de MapleStory): cada capa tiene un "origin" y puntos "map" (neck, navel, hand, brow...). El cuerpo se coloca en los pies;
 * cada capa se engancha al punto que comparte con las ya colocadas; se ordenan por zmap; se ocultan las que tapa un equipo de mayor prioridad (vslot/smap).
 * Los fotogramas ya armados se guardan en caché (por apariencia + equipo + acción + frame). */
(function (root) {
  'use strict';
  var D = root.MapleLayerData; if (!D) return;
  var BODY = '00002000', HEAD = '00012000';
  var LOOKS = { warrior: { hair: '00036787', face: '00023100' }, thief: { hair: '00036794', face: '00023301' }, archer: { hair: '00037783', face: '00021195' }, pirate: { hair: '00031862', face: '00024432' }, mage: { hair: '00037775', face: '00021101' } };
  var ZI = {}; D.zmap.forEach(function (z, i) { ZI[z] = i; });
  var BASE_SLOT = {}; BASE_SLOT[BODY] = 'Bd'; BASE_SLOT[HEAD] = 'Hd';
  var imgs = {}, cache = {}, cacheN = 0;
  function pad(id) { return ('00000000' + id).slice(-8); }
  function toks(s) { var o = []; for (var i = 0; i + 1 < (s || '').length; i += 2) o.push(s.substr(i, 2)); return o; }
  function slotOf(id) { var it = D.items[id]; return BASE_SLOT[id] || (it && it.islot ? it.islot.slice(0, 2) : ''); }
  function prio(slot) { return ZI[slot] === undefined ? 9999 : ZI[slot]; }
  function ensure(id) {
    var it = D.items[id]; if (!it || !it.atlas) return true;
    var e = imgs[id]; if (e) return e.ok;
    var im = new Image(); e = imgs[id] = { im: im, ok: false }; im.onload = function () { e.ok = true; }; im.onerror = function () { e.ok = true; e.fail = true; };
    im.src = 'assets/layers/' + id + '.png'; return false;
  }
  function defaultLook(cls) { var l = LOOKS[cls] || LOOKS.warrior; return { hair: l.hair, face: l.face }; }
  function compOf(action) { var c = D.items[BODY].comp; return c && c[action]; }
  function frames(action) { var cp = compOf(action); if (cp) return cp.length; var b = D.items[BODY].a[action]; return b ? b.length : 0; }
  function delays(action) { var cp = compOf(action); if (cp) return cp.map(function (f) { return f.d || 100; }); var b = D.items[BODY].a[action]; return b ? b.map(function (f) { return f.d || 100; }) : []; }

  // lista de capas {id, L} de un fotograma
  function gather(look, ids, action, f) {
    var out = [], bf = D.items[BODY].a[action] && D.items[BODY].a[action][f]; if (!bf) return null;
    function push(id, arr) { (arr || []).forEach(function (L) { out.push({ id: id, L: L }); }); }
    push(BODY, bf.l);
    var h = D.items[HEAD].a[action]; push(HEAD, h && (h[f] || h[0]));
    var face = bf.f !== 0;
    if (face && D.items[look.face]) push(look.face, D.items[look.face].face);
    if (D.items[look.hair]) push(look.hair, face ? D.items[look.hair].front : D.items[look.hair].back);
    ids.forEach(function (id) { var it = D.items[id]; if (!it) return; var a = it.a[action]; if (a) push(id, a[f]); else if (it.static) push(id, it.static); });
    return out;
  }
  function compose(look, ids, action, f) {
    var list = gather(look, ids, action, f); if (!list) return null;
    var present = [BODY, HEAD, look.face, look.hair].concat(ids).filter(function (id) { return D.items[id]; });
    // ocultar capas tapadas por un ítem de mayor prioridad (vslot de otro ítem ∩ smap de la capa)
    // (las capas ocultas siguen sirviendo de ancla: p.ej. una máscara que oculta la cabeza se engancha al 'brow' de la cabeza oculta)
    function visible(e) {
      var t = toks(D.smap[e.L.z]), mine = prio(slotOf(e.id)); if (!t.length) return true;
      for (var i = 0; i < present.length; i++) {
        var y = present[i]; if (y === e.id || prio(slotOf(y)) >= mine) continue;
        var v = toks(D.items[y].vslot); for (var k = 0; k < v.length; k++) if (t.indexOf(v[k]) >= 0) return false;
      }
      return true;
    }
    // colocar: cada capa se engancha a un punto ya definido
    var anchors = {}, placed = [], pend = list.slice(), progress = true;
    function define(e, ox, oy) { placed.push({ e: e, x: ox, y: oy }); for (var n in e.L.m) if (!anchors[n]) anchors[n] = [ox + e.L.m[n][0], oy + e.L.m[n][1]]; }
    while (pend.length && progress) {
      progress = false;
      for (var i = 0; i < pend.length; i++) {
        var e = pend[i], m = e.L.m, o = null;
        if (e.id === BODY && e.L.p === 'body') o = [0, 0];
        else { for (var n in m) if (anchors[n]) { o = [anchors[n][0] - m[n][0], anchors[n][1] - m[n][1]]; break; }
          if (!o && m.handMove && anchors.hand) o = [anchors.hand[0] - m.handMove[0], anchors.hand[1] - m.handMove[1]]; }
        if (o) { define(e, o[0], o[1]); pend.splice(i, 1); i--; progress = true; }
      }
    }
    pend.forEach(function (e) { define(e, 0, 0); });
    placed = placed.filter(function (p) { return visible(p.e); });
    placed.sort(function (a, b) { var za = ZI[a.e.L.z], zb = ZI[b.e.L.z]; return (zb === undefined ? 0 : zb) - (za === undefined ? 0 : za); });   // atrás -> adelante
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    placed.forEach(function (p) { var L = p.e.L, dx = p.x - L.o[0], dy = p.y - L.o[1]; p.dx = dx; p.dy = dy; x0 = Math.min(x0, dx); y0 = Math.min(y0, dy); x1 = Math.max(x1, dx + L.r[2]); y1 = Math.max(y1, dy + L.r[3]); });
    var cv = document.createElement('canvas'); cv.width = Math.max(1, x1 - x0); cv.height = Math.max(1, y1 - y0); var cx = cv.getContext('2d');
    placed.forEach(function (p) { var im = imgs[p.e.id]; if (!im || im.fail) return; var r = p.e.L.r; cx.drawImage(im.im, r[0], r[1], r[2], r[3], p.dx - x0, p.dy - y0, r[2], r[3]); });
    return { cv: cv, rx: -x0, ry: -y0 };
  }
  // fotograma listo para dibujar (null si aún se cargan las imágenes)
  function frame(ch, action, f) {
    var look = ch.look || (ch.look = defaultLook(ch.cls)), ids = [], eq = ch.equip || {};
    Object.keys(eq).sort().forEach(function (s) { if (eq[s]) ids.push(pad(eq[s] && typeof eq[s] === 'object' ? eq[s].id : eq[s])); });
    var ready = ensure(BODY) & ensure(HEAD) & ensure(look.face) & ensure(look.hair); ids.forEach(function (id) { ready &= ensure(id); });
    var cp = compOf(action);
    if (cp) {   // acción compuesta (somersault): fotograma de otra acción, girado alrededor del origen y desplazado
      if (!ready) return null;
      f = Math.max(0, Math.min(cp.length - 1, f)); var cf = cp[f], base = frame(ch, cf.a, cf.f); if (!base) return null;
      var ck = 'C' + look.hair + look.face + ids.join(',') + '|' + action + '|' + f, cc = cache[ck];
      if (!cc) {
        var th = (cf.rot || 0) * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th), w = base.cv.width, h = base.cv.height;
        var pts = [[-base.rx, -base.ry], [w - base.rx, -base.ry], [w - base.rx, h - base.ry], [-base.rx, h - base.ry]].map(function (q) { return [q[0] * cs - q[1] * sn, q[0] * sn + q[1] * cs]; });
        var xs = pts.map(function (q) { return q[0]; }), ys = pts.map(function (q) { return q[1]; });
        var x0 = Math.floor(Math.min.apply(null, xs)), y0 = Math.floor(Math.min.apply(null, ys)), x1 = Math.ceil(Math.max.apply(null, xs)), y1 = Math.ceil(Math.max.apply(null, ys));
        var cv = document.createElement('canvas'); cv.width = Math.max(1, x1 - x0); cv.height = Math.max(1, y1 - y0); var cx = cv.getContext('2d');
        cx.translate(-x0, -y0); cx.rotate(th); cx.drawImage(base.cv, -base.rx, -base.ry);
        cc = cache[ck] = { cv: cv, rx: -x0 - cf.mv[0], ry: -y0 - cf.mv[1] }; cacheN++;
      }
      return cc;
    }
    if (!ready || !D.items[BODY].a[action]) return null;
    f = Math.max(0, Math.min(frames(action) - 1, f));
    var key = look.hair + look.face + ids.join(',') + '|' + action + '|' + f, c = cache[key];
    if (!c) { if (cacheN > 600) { cache = {}; cacheN = 0; } c = cache[key] = compose(look, ids, action, f); cacheN++; }
    return c;
  }
  // Poses según el arma: lanza y ballesta usan stand2/walk2 y sus propios golpes; la pistola usa swingP*. Si el arma equipada no trae la acción completa
  // (le faltan fotogramas respecto al cuerpo) se busca la primera alternativa que sí tenga todos; si no hay, se deja la acción original (armas anteriores no cambian).
  var CHAIN = { stand1: ['stand2'], walk1: ['walk2'], swingO1: ['swingP1', 'swingT1', 'swingT2'], swingO2: ['swingP2', 'swingT2', 'swingT1'], swingO3: ['swingPF', 'swingT3', 'swingT1'],
    stabO1: ['swingP1', 'stabT1', 'swingT1'], stabO2: ['stabT2', 'swingP2'], shoot1: ['shoot2', 'swingP1'] };
  function weaponFull(it, action) { var a = it.a && it.a[action], n = frames(action); return !!a && a.length >= n && n > 0; }
  // acciones de skill que el cuerpo no empaqueta (nombres del cliente) -> pose parecida que sí existe (la pistola las dibuja con swingP*)
  var ALIAS = { gatlingshot: 'rapidfire' };
  function remap(ch, action) {
    if (ALIAS[action]) action = ALIAS[action];
    var r = remap0(ch, action);
    return D.items[BODY].a[r] || compOf(r) ? r : 'swingO2';   // nunca una acción desconocida (si no, el juego dibujaba el sprite viejo de assets/char)
  }
  function remap0(ch, action) {
    var w = ch && ch.equip && ch.equip.weapon, it = w && D.items[pad(typeof w === 'object' ? w.id : w)], ch2 = CHAIN[action];
    if (!it || !it.atlas || !ch2 || weaponFull(it, action)) return action;
    for (var i = 0; i < ch2.length; i++) if (weaponFull(it, ch2[i]) && D.items[BODY].a[ch2[i]]) return ch2[i];
    return action;
  }
  var api = { remap: remap, frame: frame, frames: frames, delays: delays, defaultLook: defaultLook, ready: function () { return !!D; } };
  root.MapleLayers = api;
})(typeof window !== 'undefined' ? window : globalThis);
