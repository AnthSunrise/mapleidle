/* Lista de personajes (izquierda) y ventana de creación (nombre + clase). */
(function () {
  'use strict';
  var G = window.MAPLE_GAME, S = window.MapleSim;
  if (!G || !S) return;
  var world = G.world, MAXC = 6, sig = '';

  var css = document.createElement('style');
  css.textContent =
    '.mc-list{position:fixed;left:10px;top:84px;z-index:9;display:flex;flex-direction:column;gap:4px;font:13px sans-serif}' +
    '.mc-btn{background:rgba(18,22,40,.88);color:#eee;border:1px solid #556;border-radius:6px;padding:6px 10px;text-align:left;cursor:pointer;font:13px sans-serif}' +
    '.mc-btn.on{border-color:#ffe45c;color:#ffe45c}.mc-add{color:#9fb4ff}.mc-bf{display:flex;gap:4px;margin-top:3px}.mc-bw{display:flex;flex-direction:column;align-items:center}.mc-bi{display:inline-flex;align-items:center;justify-content:center;border-radius:3px;color:#fff;font:bold 11px sans-serif;overflow:hidden}.mc-bt{font:9px sans-serif;color:#cfe}' +
    '.mc-ov{position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}' +
    '.mc-box{background:#161a30;color:#eee;border:1px solid #8a96c8;border-radius:10px;padding:18px;width:min(360px,92vw);font:14px sans-serif}' +
    '.mc-t{font-weight:bold;font-size:16px;color:#ffe9a8;margin-bottom:12px}.mc-box input[type=text]{width:100%;box-sizing:border-box;padding:8px;border-radius:6px;border:1px solid #556;background:#0d1020;color:#fff;font:15px sans-serif}' +
    '.mc-cls{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.mc-c{padding:6px 10px;border-radius:6px;border:1px solid #445;background:#141830;color:#eee;cursor:pointer;font:13px sans-serif}' +
    '.mc-c.on{border-color:#ffe45c;background:#2d3a70}.mc-c:disabled{opacity:.4;cursor:not-allowed}' +
    '.mc-act{display:flex;gap:8px;justify-content:flex-end}.mc-go{padding:8px 16px;border-radius:6px;border:1px solid #8a96c8;background:#2d3a70;color:#fff;cursor:pointer;font:bold 14px sans-serif}.mc-go:disabled{opacity:.4}' +
    '.mc-no{padding:8px 12px;border-radius:6px;border:1px solid #556;background:transparent;color:#ccc;cursor:pointer;font:14px sans-serif}.mc-hint{font-size:11px;color:#9aa3c7;margin-top:6px}';
  document.head.appendChild(css);

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  var list = el('div', 'mc-list'); document.body.appendChild(list);
  var MAPS = window.MAPLE_MAPS || {};
  var BUFFS = (window.MapleBuffs || {}).BUFFS || {};
  function buffIcon(id, size) {
    var B = BUFFS[id] || { letter: '?', color: '#888' }, box = el('span', 'mc-bi'); box.style.width = box.style.height = size + 'px';
    var im = new Image(); im.draggable = false; im.onerror = function () { im.remove(); box.style.background = B.color || '#888'; box.textContent = B.letter || '?'; box.style.fontSize = Math.round(size * 0.6) + 'px'; };
    im.src = B.icon || ''; im.style.cssText = 'width:100%;height:100%;image-rendering:pixelated'; box.appendChild(im); box.title = (B.name || id) + (B.desc ? ' — ' + B.desc : ''); return box;
  }
  function buffRow(c, size) {
    var row = el('div', 'mc-bf');
    c.buffs.forEach(function (b) { var w = el('span', 'mc-bw'); w.appendChild(buffIcon(b.id, size)); var t = el('span', 'mc-bt'); t.dataset.c = world.chars.indexOf(c); t.dataset.b = b.id; t.textContent = Math.ceil(b.t) + 's'; w.appendChild(t); row.appendChild(w); });
    return row;
  }
  // La lista lateral muestra solo a los personajes del mapa que estás viendo (con sus buffs). El manager (C) lista a todos.
  function render() {
    var vis = G.visible(), s = JSON.stringify([vis.map(function (i) { var c = world.chars[i]; return [c.name, c.stats.level, c.buffs.map(function (b) { return b.id; })]; }), world.selected]);
    if (s === sig) { tick(); return; } sig = s; list.innerHTML = '';
    vis.forEach(function (i, n) {
      var c = world.chars[i], b = el('div', 'mc-btn' + (i === world.selected ? ' on' : ''));
      b.appendChild(el('div', '', (n + 1) + '  ' + c.name + '   Lv ' + c.stats.level)); if (c.buffs.length) b.appendChild(buffRow(c, 18));
      b.addEventListener('click', function () { S.selectChar(world, i); G.focus(i); G.save(); });
      list.appendChild(b);
    });
  }
  function tick() { document.querySelectorAll('.mc-bt').forEach(function (t) { var c = world.chars[t.dataset.c], b = c && c.buffs.filter(function (x) { return x.id === t.dataset.b; })[0]; if (b) t.textContent = Math.ceil(b.t) + 's'; }); }

  /* ---- Manager de personajes (C) ---- */
  var mgr = el('div', 'wm-win'), mgrOpen = false, msig = '', MAPS = window.MAPLE_MAPS || {};
  mgr.style.width = 'min(520px,calc(100vw - 20px))'; document.body.appendChild(mgr); mgr.addEventListener('wheel', function (e) { e.stopPropagation(); });
  var mbtn = el('button', 'mi-btn', 'Personajes (C)'); mbtn.addEventListener('click', toggleMgr); document.body.appendChild(mbtn);
  function toggleMgr() { mgrOpen = !mgrOpen; mgr.style.display = mgrOpen ? 'block' : 'none'; msig = ''; renderMgr(); }
  addEventListener('keydown', function (e) { if (e.code === 'KeyC' && !e.repeat && !/INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) toggleMgr(); });
  function renderMgr() {
    if (!mgrOpen) return;
    var s = JSON.stringify([world.chars.map(function (c) { return [c.name, c.stats.level, c.mapId, c.player.state, c.buffs.map(function (b) { return b.id; })]; }), world.selected]);
    if (s === msig) { tick(); return; } msig = s; mgr.innerHTML = '';
    var h = el('div', 'wm-h', 'Personajes (' + world.chars.length + ' / ' + MAXC + ')'); mgr.appendChild(h);
    var tb = el('div'); tb.style.cssText = 'max-height:calc(100vh - 230px);overflow-y:auto;display:flex;flex-direction:column;gap:3px';
    world.chars.forEach(function (c, i) {
      var r = el('div', 'wm-row' + (i === world.selected ? ' on' : '')); r.style.alignItems = 'center';
      var left = el('div'); left.appendChild(el('div', '', c.name + '  ·  ' + (window.MapleItems.CLASSES[c.cls] || {}).label + ' Lv ' + c.stats.level)); var sub = el('div', '', (MAPS[c.mapId] ? MAPS[c.mapId].name : c.mapId) + (c.player.state === 'dead' ? '  ·  muerto' : '')); sub.style.cssText = 'font-size:11px;color:#9aa3c7'; left.appendChild(sub);
      r.appendChild(left); if (c.buffs.length) r.appendChild(buffRow(c, 22));
      r.addEventListener('click', function () { S.selectChar(world, i); G.focus(i); G.save(); msig = ''; renderMgr(); });
      tb.appendChild(r);
    });
    mgr.appendChild(tb);
    var add = el('button', 'wm-go', '+ Nuevo personaje'); add.disabled = world.chars.length >= MAXC; add.addEventListener('click', function () { openCreate(false); }); mgr.appendChild(add);
  }
  setInterval(renderMgr, 400);

  function openCreate(first) {
    var ov = el('div', 'mc-ov'), box = el('div', 'mc-box');
    box.appendChild(el('div', 'mc-t', first ? 'Crea tu primer personaje' : 'Nuevo personaje'));
    var inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 12; inp.placeholder = 'Nombre (máx. 12)';
    inp.value = first ? '' : 'Guerrero' + (world.chars.length + 1);
    ['keydown', 'keyup', 'keypress'].forEach(function (ev) { inp.addEventListener(ev, function (e) { e.stopPropagation(); }); });   // que las teclas del juego no se activen al escribir
    box.appendChild(inp);
    var cls = el('div', 'mc-cls');
    var chosen = 'warrior', cbs = {};
    [['warrior', 'Warrior', true], ['mage', 'Mage', false], ['thief', 'Thief', true], ['archer', 'Archer', true], ['pirate', 'Pirate', false]].forEach(function (c) {
      var b = el('button', 'mc-c' + (c[0] === chosen ? ' on' : ''), c[1]); b.disabled = !c[2]; cbs[c[0]] = b;
      if (!c[2]) b.title = 'Próximamente: faltan sprites y stats de la clase';
      else b.addEventListener('click', function () { chosen = c[0]; for (var k in cbs) cbs[k].className = 'mc-c' + (k === chosen ? ' on' : ''); if (!first && /^(Guerrero|Ladr[oó]n|Arquero)\d+$/.test(inp.value)) inp.value = (chosen === 'thief' ? 'Ladrón' : chosen === 'archer' ? 'Arquero' : 'Guerrero') + (world.chars.length + 1); });
      cls.appendChild(b);
    });
    box.appendChild(cls);
    box.appendChild(el('div', 'mc-hint', 'Warrior (cuerpo a cuerpo), Thief (estrellas) y Archer (arco). Mage y Pirate se activan cuando haya sus sprites y datos.'));
    var act = el('div', 'mc-act'), go = el('button', 'mc-go', 'Crear');
    if (!first) { var no = el('button', 'mc-no', 'Cancelar'); no.addEventListener('click', function () { ov.remove(); }); act.appendChild(no); }
    function sync() { go.disabled = !inp.value.trim(); }
    inp.addEventListener('input', sync); sync();
    go.addEventListener('click', function () {
      var name = inp.value.trim().slice(0, 12); if (!name) return;
      if (first) { world.chars = []; S.addCharacter(world, { name: name, cls: chosen }); S.selectChar(world, 0); G.focus(0); }
      else { S.addCharacter(world, { name: name, cls: chosen }); S.selectChar(world, world.chars.length - 1); G.focus(world.selected); }
      G.enableSave(); G.save(); sig = ''; msig = ''; render(); ov.remove();
    });
    act.appendChild(go); box.appendChild(act); ov.appendChild(box); document.body.appendChild(ov);
    setTimeout(function () { inp.focus(); }, 50);
  }

  render(); setInterval(render, 300);
  if (!G.hasSave) openCreate(true);
})();
