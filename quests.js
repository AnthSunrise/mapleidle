/* Misiones de bienvenida (ventana "Misiones", tecla Q): se completan haciendo lo que explica el tutorial y dan regalos.
 * El progreso vive en world.quests {done, claimed} y se guarda en la partida (game.js).
 * Añadir una misión: agrega un objeto a QUESTS ({id, title, desc, test(world) o event, reward}) y nada más. */
(function (root) {
  'use strict';
  // test(w): condición que se revisa sola cada medio segundo; event: nombre del evento que la completa (MAPLE_Q.event('potion'))
  var QUESTS = [
    { id: 'zone', title: 'Zona de farmeo', obj: 'Zona asignada', desc: 'Abre Personajes (C) y asigna una zona a un personaje con el botón «Zona».',
      test: function (w) { return w.chars.some(function (c) { return c.zones && Object.keys(c.zones).length > 0; }); }, reward: { mesos: 1000 } },
    { id: 'leader', title: 'Líder del party', obj: 'Líder elegido', desc: 'Haz clic derecho sobre un personaje de la lista de la izquierda para nombrarlo líder (♛).',
      test: function (w) { return !!w.leader; }, reward: { items: [['red_potion', 20]] } },
    { id: 'potions', title: 'Pociones automáticas', obj: 'Pociones configuradas', desc: 'Abre Pociones (P) y cambia el porcentaje de una poción, o asigna otra desde el inventario (pestaña USE).',
      event: 'potion', reward: { items: [['red_potion', 20], ['blue_potion', 20]] } },
    { id: 'level10', title: 'Nivel 10', obj: 'Nivel más alto', prog: function (w) { return [Math.min(10, Math.max.apply(null, w.chars.map(function (c) { return c.stats.level; }).concat([1]))), 10]; }, desc: 'Lleva a un personaje hasta el nivel 10 (desbloquea las skills de 1er job y todos los mapas).',
      test: function (w) { return w.chars.some(function (c) { return c.stats.level >= 10; }); }, reward: { mesos: 3000 } },
    { id: 'shop', title: 'De compras', obj: 'Compras en la tienda', desc: 'Compra algo en la tienda (T).',
      event: 'shop', reward: { items: [['red_potion', 30], ['blue_potion', 30]] } },
    { id: 'travel', title: 'De viaje', obj: 'Personaje en otro mapa', desc: 'Abre el Mapa (M) y mueve un personaje a otro mapa (requiere nivel 10).',
      test: function (w) { return w.chars.some(function (c) { return c.mapId !== 'henesys'; }); }, reward: { mesos: 2000 } },
    { id: 'all', title: '¡Todo listo!', obj: 'Misiones completadas', prog: function (w) { return [QUESTS.filter(function (q) { return !q.bonus && w.quests.done[q.id]; }).length, QUESTS.length - 1]; }, desc: 'Completa las seis misiones anteriores.', bonus: true,
      test: function (w) { return QUESTS.every(function (q) { return q.bonus || w.quests.done[q.id]; }); }, reward: { mesos: 3000, items: [['red_potion', 30], ['blue_potion', 30]] } }
  ];

  function normalize(w) {
    var q = w.quests && typeof w.quests === 'object' ? w.quests : {}, o = { done: {}, claimed: {} };
    QUESTS.forEach(function (d) { if (q.done && q.done[d.id] === true) o.done[d.id] = true; if (q.claimed && q.claimed[d.id] === true) { o.claimed[d.id] = true; o.done[d.id] = true; } });
    w.quests = o; return o;
  }
  // devuelve los ids de misiones que se acaban de completar
  function tick(w) {
    normalize(w); var out = [];
    QUESTS.forEach(function (q) { if (!w.quests.done[q.id] && q.test && q.test(w)) { w.quests.done[q.id] = true; out.push(q.id); } });
    return out;
  }
  function event(w, name) {
    normalize(w); var out = [];
    QUESTS.forEach(function (q) { if (q.event === name && !w.quests.done[q.id]) { w.quests.done[q.id] = true; out.push(q.id); } });
    return out;
  }
  // entrega el regalo; devuelve {ok, msg}. I = MapleItems
  function claim(w, id, I) {
    normalize(w); var q = QUESTS.filter(function (d) { return d.id === id; })[0];
    if (!q || !w.quests.done[id] || w.quests.claimed[id]) return { ok: false, msg: 'No disponible' };
    var items = (q.reward.items || []), probe = { equip: w.inv.equip.slice(), use: w.inv.use.map(function (s) { return s && { id: s.id, count: s.count }; }) };
    for (var i = 0; i < items.length; i++) if (!I.addItem(probe, items[i][0], items[i][1])) return { ok: false, msg: 'Inventario lleno: libera espacio en USE' };
    items.forEach(function (it) { I.addItem(w.inv, it[0], it[1]); });
    if (q.reward.mesos) w.mesos += q.reward.mesos;
    w.quests.claimed[id] = true; return { ok: true, msg: '' };
  }
  // progreso [actual, total] para mostrar "n/m"; por defecto 0/1 o 1/1 según esté hecha
  function progress(w, q) { if (w.quests.done[q.id]) return [q.prog ? q.prog(w)[1] : 1, q.prog ? q.prog(w)[1] : 1]; return q.prog ? q.prog(w) : [0, 1]; }
  function rewardText(q, I) {
    var T = root.$t || function (x) { return x; }, p = []; if (q.reward.mesos) p.push(q.reward.mesos.toLocaleString('en-US') + ' ' + T('mesos'));
    (q.reward.items || []).forEach(function (it) { p.push(it[1] + '× ' + (I && I.ITEMS[it[0]] ? I.ITEMS[it[0]].name : it[0])); });
    return p.join(' · ');
  }
  var api = { QUESTS: QUESTS, normalize: normalize, tick: tick, event: event, claim: claim, rewardText: rewardText, progress: progress };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  /* ---------- interfaz: ventana pequeña "Quest Helper" (sprites de UIWindow2/QuestAlarm) ---------- */
  var G = root.MAPLE_GAME, I = root.MapleItems;
  if (!G || !I) return;
  var $t = root.$t || function (x) { return x; };
  var world = G.world; normalize(world);
  var A = 'assets/ui2/qh/', SC = 1; try { var us = parseFloat(localStorage.getItem('maple_uiscale')); if (us >= 0.5 && us <= 3) SC = us; } catch (e) {}
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  var css = document.createElement('style');
  css.textContent =
    '.qs-btn{display:none}' +
    '#qh{position:fixed;z-index:9;width:180px;font:11px Tahoma,Arial,sans-serif;color:#ddd;user-select:none;transform-origin:0 0;display:none}' +
    '#qh .qh-top{position:relative;height:25px;background:url(' + A + 'bg_max.png);cursor:move}#qh.min .qh-top{height:20px;background-image:url(' + A + 'bg_min.png)}' +
    '#qh .qh-body{background:url(' + A + 'bg_center.png) repeat-y;padding:2px 9px 0 9px;min-height:18px}#qh.min .qh-body,#qh.min .qh-bot{display:none}' +
    '#qh .qh-bot{height:5px;background:url(' + A + 'bg_bottom.png)}' +
    '#qh .qh-t{position:absolute;left:21px;top:5px;font:bold 11px Tahoma,Arial;color:#fff;text-shadow:1px 1px 0 #000;white-space:nowrap;pointer-events:none}' +
    '#qh .qh-b{position:absolute;display:block;padding:0;border:0;background:none;cursor:pointer}#qh .qh-b img{display:block;image-rendering:pixelated;pointer-events:none}' +
    '#qh .qh-q{padding:3px 0 5px;cursor:pointer}#qh .qh-n{font:bold 12px Tahoma,Arial;color:#fff;text-shadow:1px 1px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:15px;line-height:15px}' +
    '#qh .qh-o{height:15px;line-height:15px;color:#c8ccd4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:1px 1px 0 #000}#qh .qh-o u{text-decoration:none;color:#fff}#qh .qh-o u.ok{color:#2fd8a4}' +
    '#qh .qh-g{color:#ffe45c;font-weight:bold}#qh .qh-d{margin-top:2px;color:#aeb6c8;line-height:13px;white-space:normal;text-shadow:1px 1px 0 #000}#qh .qh-d b{color:#ffe9a8}' +
    '.qs-toast{position:fixed;left:50%;top:110px;transform:translateX(-50%);z-index:2147482100;background:rgba(14,18,34,.95);color:#fff;border:1px solid #ffe45c;border-radius:6px;padding:8px 14px;font:bold 13px sans-serif;pointer-events:none}' +
    '#mc-hb.qs-dot::after{content:"";position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:#e33;border:2px solid #fff}';
  document.head.appendChild(css);
  var btn = el('button', 'mi-btn qs-btn', 'Misiones (Q)'); document.body.appendChild(btn);   // oculto: lo acciona el menú ☰ (mui.js)
  var box = el('div'); box.id = 'qh'; document.body.appendChild(box);
  var top = el('div', 'qh-top'), title = el('div', 'qh-t'), body = el('div', 'qh-body'), bot = el('div', 'qh-bot');
  box.appendChild(top); box.appendChild(body); box.appendChild(bot); top.appendChild(title);
  function ibtn(name, x, y, tip, fn) {   // botón con estados normal/mouseOver/pressed
    var b = el('button', 'qh-b'), im = el('img'); b.style.left = x + 'px'; b.style.top = y + 'px'; b.title = tip; im.draggable = false; im.src = A + name + '_normal.png'; b.appendChild(im);
    b.addEventListener('mouseenter', function () { im.src = A + name + '_mouseOver.png'; }); b.addEventListener('mouseleave', function () { im.src = A + name + '_normal.png'; });
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); im.src = A + name + '_pressed.png'; }); b.addEventListener('click', function (e) { e.stopPropagation(); im.src = A + name + '_mouseOver.png'; fn(); });
    top.appendChild(b); b.img = im; return b;
  }
  var qIc = ibtn('q', 4, 4, $t('Misiones'), function () { setMin(false); });
  var bAuto = ibtn('auto', 118, 4, $t('Reclamar todos los regalos disponibles'), function () { claimAll(); });
  var bMin = ibtn('min', 150, 4, $t('Minimizar'), function () { setMin(!box.classList.contains('min')); });
  var bX = ibtn('close', 165, 6, $t('Cerrar (se vuelve a abrir con Q)'), function () { setHidden(true); });
  var minimized = ls('maple_qmin') === '1', hidden = ls('maple_qh') === '1', open = {}, sig = '', info = '', pos;
  try { pos = JSON.parse(ls('maple_qpos')); } catch (e) {}
  if (!pos || !isFinite(pos.x) || !isFinite(pos.y)) pos = { x: -1, y: 64 };   // x<0: pegada al borde derecho
  function place() {
    box.style.transform = 'scale(' + SC + ')';
    var w = 180 * SC, x = pos.x < 0 ? innerWidth - w - 12 : pos.x; x = Math.max(0, Math.min(innerWidth - w, x));
    box.style.left = x + 'px'; box.style.top = Math.max(0, Math.min(innerHeight - 30, pos.y)) + 'px';
  }
  addEventListener('resize', place);
  function setMin(v) { minimized = v; ls('maple_qmin', v ? '1' : '0'); sig = ''; render(); }
  function setHidden(v) { hidden = v; ls('maple_qh', v ? '1' : '0'); sig = ''; render(); }
  var d = null;
  top.addEventListener('pointerdown', function (e) { d = { px: e.clientX, py: e.clientY, x: box.offsetLeft, y: box.offsetTop }; top.setPointerCapture(e.pointerId); });
  top.addEventListener('pointermove', function (e) { if (!d) return; pos = { x: d.x + (e.clientX - d.px), y: d.y + (e.clientY - d.py) }; place(); });
  top.addEventListener('pointerup', function () { if (d) { ls('maple_qpos', JSON.stringify(pos)); d = null; } });
  box.addEventListener('wheel', function (e) { e.stopPropagation(); });
  // el botón oculto "Misiones (Q)" y la tecla Q muestran/ocultan la ventana
  function toggle() { if (allClaimed()) { toast($t('¡Ya reclamaste todas las misiones de bienvenida!')); return; } if (hidden) { setHidden(false); if (minimized) setMin(false); } else setHidden(true); }
  btn.addEventListener('click', toggle);
  addEventListener('keydown', function (e) {
    if (e.code !== 'KeyQ' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '') || (G.isDebug && G.isDebug())) return;
    toggle();
  });
  function toast(t) { var x = el('div', 'qs-toast', t); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3500); }
  function allClaimed() { return QUESTS.every(function (q) { return world.quests.claimed[q.id]; }); }
  function claimable() { return QUESTS.filter(function (q) { return world.quests.done[q.id] && !world.quests.claimed[q.id]; }); }
  function doClaim(q) { var r = claim(world, q.id, I); if (r.ok) { toast($t('¡Regalo recibido!  ') + rewardText(q, I)); G.save(); } else toast($t(r.msg)); sig = ''; render(); return r.ok; }
  function claimAll() { var l = claimable(); if (!l.length) { toast($t('No hay regalos por reclamar')); return; } var got = 0; l.forEach(function (q) { if (claim(world, q.id, I).ok) got++; }); if (got) { toast($t('¡Regalos recibidos: {0}!', got)); G.save(); } else toast($t('Inventario lleno: libera espacio en USE')); sig = ''; render(); }
  function render() {
    var list = QUESTS.filter(function (q) { return !world.quests.claimed[q.id]; }), n = QUESTS.filter(function (q) { return !q.bonus && world.quests.claimed[q.id]; }).length;
    var vis = !hidden && world.chars.length > 0 && list.length > 0;
    box.style.display = vis ? 'block' : 'none';
    if (!vis) return;
    var s = JSON.stringify([minimized, world.quests, open, world.chars.map(function (c) { return c.stats.level; })]);
    if (s === sig) return; sig = s;
    box.classList.toggle('min', minimized); title.textContent = $t('Misiones ({0}/{1})', n, QUESTS.length - 1);
    bMin.style.display = minimized ? 'none' : 'block'; if (minimized) { if (!top.querySelector('.qh-max')) { var mx = ibtn('max', 150, 4, $t('Restaurar'), function () { setMin(false); }); mx.className += ' qh-max'; } } else { var m2 = top.querySelector('.qh-max'); if (m2) m2.remove(); }
    body.innerHTML = '';
    list.forEach(function (q) {
      var done = world.quests.done[q.id], pr = progress(world, q), r = el('div', 'qh-q');
      r.appendChild(el('div', 'qh-n', $t(q.title)));
      var o = el('div', 'qh-o'); o.appendChild(document.createTextNode($t(q.obj) + '  ')); o.appendChild(el('u', done ? 'ok' : '', pr[0] + '/' + pr[1]));
      if (done) { var g = el('span', 'qh-g', '  ' + $t('¡Reclamar!')); o.appendChild(g); }
      r.appendChild(o);
      if (open[q.id]) { var dd = el('div', 'qh-d'); dd.appendChild(document.createTextNode($t(q.desc) + ' ')); dd.appendChild(el('b', '', $t('Regalo: ') + rewardText(q, I))); r.appendChild(dd); }
      r.title = $t(q.desc) + '\n' + $t('Regalo: ') + rewardText(q, I);
      r.addEventListener('click', function () { if (world.quests.done[q.id]) doClaim(q); else { open[q.id] = !open[q.id]; sig = ''; render(); } });
      body.appendChild(r);
    });
    place();
  }
  function done(ids) {
    ids.forEach(function (id) { var q = QUESTS.filter(function (x) { return x.id === id; })[0]; if (q) toast($t('Misión completada: {0} — ¡reclama tu regalo!', $t(q.title))); });
    if (ids.length) { if (hidden && !allClaimed()) { hidden = false; ls('maple_qh', '0'); } G.save(); sig = ''; }
  }
  root.MAPLE_Q = { event: function (name) { done(event(world, name)); }, toggle: toggle };
  place();
  var qa = 0;
  setInterval(function () {
    if (world.chars.length) done(tick(world));
    var cl = claimable().length > 0, hb = document.getElementById('mc-hb'); if (hb) hb.classList.toggle('qs-dot', cl);
    qa++; qIc.img.src = A + (cl && qa % 2 ? 'q_ani1.png' : 'q_normal.png');   // la Q parpadea si hay regalos
    render();
  }, 500);
})(typeof window !== 'undefined' ? window : globalThis);
