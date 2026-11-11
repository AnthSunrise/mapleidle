/* Mapa mundial (botón "Mapa", tecla M): eliges un mapa y con "Mover personajes..." marcas cuáles viajan allí. */
(function () {
  'use strict';
  var $t = window.$t || function (x) { return x; };
  var G = window.MAPLE_GAME, S = window.MapleSim, MAPS = window.MAPLE_MAPS || {}, WORLD = window.MAPLE_WORLD || [];
  if (!G || !S) return;
  var world = G.world, sel = null, isOpen = false, msg = '';
  var css = document.createElement('style');
  css.textContent =
    '.wm-btn{position:fixed;top:10px;right:150px;z-index:10;background:#23305a;color:#fff;border:1px solid #6b7bb5;border-radius:6px;padding:8px 12px;font:bold 13px sans-serif;cursor:pointer}' +
    '.wm-win{position:fixed;top:52px;right:10px;z-index:10;width:min(560px,calc(100vw - 20px));max-height:calc(100vh - 130px);overflow:auto;background:rgba(18,22,40,.96);color:#eee;font:13px sans-serif;border:1px solid #556;border-radius:8px;padding:10px;display:none}' +
    '.wm-h{font-weight:bold;color:#ffe9a8;margin-bottom:8px}.wm-body{display:flex;gap:12px;flex-wrap:wrap}.wm-list{flex:1;min-width:210px;display:flex;flex-direction:column;gap:3px}' +
    '.wm-row{display:flex;justify-content:space-between;gap:8px;padding:6px 8px;border:1px solid #334;border-radius:5px;background:#141830;cursor:pointer;color:#eee;font:13px sans-serif;text-align:left}' +
    '.wm-row.on{border-color:#ffe45c;background:#2d3a70}.wm-row.lock{opacity:.4;cursor:default}.wm-sub{padding-left:22px}.wm-det{flex:1;min-width:190px;font-size:12px;line-height:1.6;color:#dfe6ff}' +
    '.wm-go{margin-top:8px;padding:8px 12px;border-radius:6px;border:1px solid #8a96c8;background:#2d3a70;color:#fff;cursor:pointer;font:bold 13px sans-serif}.wm-go:disabled{opacity:.4;cursor:default}' +
    '.wm-ov{position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}.wm-box{background:#161a30;color:#eee;border:1px solid #8a96c8;border-radius:10px;padding:16px;width:min(360px,92vw);font:14px sans-serif}' +
    '.wm-chk{display:flex;gap:8px;align-items:center;padding:6px 4px;border-bottom:1px solid #2a2f50}.wm-chk.dis{opacity:.45}.wm-act{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}';
  document.head.appendChild(css);
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  var btn = el('button', 'wm-btn', 'Mapa (M)'), win = el('div', 'wm-win');
  document.body.appendChild(btn); document.body.appendChild(win);
  win.addEventListener('wheel', function (e) { e.stopPropagation(); });

  function where(id) { return world.chars.filter(function (c) { return c.mapId === id; }); }
  function mobLine(id) {
    var z = world.zones[id], seen = {}, out = [];
    z.mobs.forEach(function (m) { seen[m.kind] = (seen[m.kind] || 0) + 1; });
    Object.keys(seen).forEach(function (k) { var r = world.cfg.mobRewards[k] || {}; out.push(k.replace(/_/g, ' ') + ' ×' + seen[k] + (r.level ? ' (Lv ' + r.level + ')' : '')); });
    return out.join(', ');
  }
  function render() {
    win.innerHTML = ''; win.appendChild(el('div', 'wm-h', $t('Mapa mundial')));
    var body = el('div', 'wm-body'), list = el('div', 'wm-list'), det = el('div', 'wm-det');
    WORLD.forEach(function (r) {
      var maps = Object.keys(MAPS).filter(function (id) { return MAPS[id].region === r[0]; });
      var row = el('div', 'wm-row' + (maps.length ? '' : ' lock')); row.appendChild(el('span', '', r[2])); row.appendChild(el('span', '', 'Lv ' + r[1] + (maps.length ? '' : ' 🔒')));
      row.style.cursor = maps.length ? 'default' : ''; list.appendChild(row);
      maps.forEach(function (id) {
        var m = el('div', 'wm-row wm-sub' + (sel === id ? ' on' : '')); m.appendChild(el('span', '', MAPS[id].name)); m.appendChild(el('span', '', where(id).length + ' 👤'));
        m.addEventListener('click', function () { sel = id; msg = ''; render(); }); list.appendChild(m);
      });
    });
    if (sel) {
      var M = MAPS[sel], ch = where(sel);
      det.appendChild(el('div', 'wm-h', M.name));
      det.appendChild(el('div', '', $t('Nivel recomendado: {0}  ·  Capacidad: {1} / {2}', M.lv, S.mapCount(world, sel), S.mapLimit(sel))));
      det.appendChild(el('div', '', $t('Enemigos: {0}', mobLine(sel))));
      det.appendChild(el('div', '', $t('Personajes aquí: {0}', ch.length ? ch.map(function (c) { return c.name; }).join(', ') : $t('ninguno'))));
      var go = el('button', 'wm-go', $t('Mover personajes...')); go.addEventListener('click', function () { openMove(sel); }); det.appendChild(go);
      if (msg) det.appendChild(el('div', '', msg));
    } else det.appendChild(el('div', '', $t('Elige un mapa de la lista para ver sus datos y mover personajes allí.')));
    body.appendChild(list); body.appendChild(det); win.appendChild(body);
  }
  function openMove(id) {
    var ov = el('div', 'wm-ov'), box = el('div', 'wm-box'), checks = [];
    box.appendChild(el('div', 'wm-h', $t('Mover a {0}', MAPS[id].name)));
    var lim = S.mapLimit(id); box.appendChild(el('div', '', $t('Capacidad: {0} / {1} personajes', S.mapCount(world, id), lim)));
    world.chars.forEach(function (c, i) {
      var dead = c.player.state === 'dead', here = c.mapId === id, low = c.stats.level < 10 && id !== 'henesys', row = el('label', 'wm-chk' + (dead || here || low ? ' dis' : '')), cb = document.createElement('input'); cb.type = 'checkbox';
      cb.disabled = dead || here || low; cb.checked = !cb.disabled && i === world.selected; checks.push(cb);
      row.appendChild(cb); row.appendChild(el('span', '', c.name + '  Lv ' + c.stats.level + '  · ' + MAPS[c.mapId].name + (dead ? ' (' + $t('muerto') + ')' : here ? ' (' + $t('ya está aquí') + ')' : low ? ' (' + $t('necesita Lv 10') + ')' : ''))); box.appendChild(row);
    });
    var act = el('div', 'wm-act'), no = el('button', 'wm-go', $t('Cancelar')), ok = el('button', 'wm-go', $t('Mover'));
    no.addEventListener('click', function () { ov.remove(); });
    ok.addEventListener('click', function () {
      var moved = [], focusSel = false;
      var full = 0;
      checks.forEach(function (cb, i) { if (!cb.checked) return; if (S.travel(world, world.chars[i], id)) { moved.push(world.chars[i].name); if (i === world.selected) focusSel = true; } else if (S.mapCount(world, id) >= lim) full++; });
      msg = (moved.length ? $t('Movidos: {0}', moved.join(', ')) : $t('No se movió a nadie.')) + (full ? ' · ' + $t('Mapa lleno (máx. {0})', lim) : '');
      if (focusSel) G.focus(world.selected);
      G.save(); ov.remove(); render();
    });
    act.appendChild(no); act.appendChild(ok); box.appendChild(act); ov.appendChild(box); document.body.appendChild(ov);
  }
  (window.MAPLE_PANELS = window.MAPLE_PANELS || {}).map = { isOpen: function () { return isOpen; }, close: function () { if (isOpen) toggle(); } };
  function closeOthers(n) { var P = window.MAPLE_PANELS; for (var k in P) if (k !== n && P[k].isOpen()) P[k].close(); }   // Mapa, Pociones y Personajes: solo uno abierto
  function toggle() { isOpen = !isOpen; win.style.display = isOpen ? 'block' : 'none'; if (isOpen) { closeOthers('map'); window.MAPLE_PANELS.map.t = performance.now(); if (!sel) sel = world.chars[world.selected].mapId; render(); } }
  btn.addEventListener('click', toggle);
  addEventListener('keydown', function (e) { if (e.code === 'KeyM' && !e.repeat && !/INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) toggle(); });
  setInterval(function () { if (isOpen && !document.querySelector('.wm-ov')) render(); }, 1000);
})();
