/* Ventanas con el estilo y los sprites originales de MapleStory (UIWindow.img): Item Inventory (I) y Equipment Inventory (E).
 * Los sprites están en assets/ui/ (extraídos con tools/wzimg.py). */
(function () {
  'use strict';
  var G = window.MAPLE_GAME, S = window.MapleSim, I = window.MapleItems;
  if (!G || !S || !I) return;
  var world = G.world, A = 'assets/ui/', ICON = 'assets/item/';
  var SC = 1; try { var us = parseFloat(localStorage.getItem('maple_uiscale')); if (us >= 0.5 && us <= 3) SC = us; } catch (e) {}   // escala de las ventanas (1 = tamaño original del sprite; cámbiala con localStorage 'maple_uiscale')
  var X0 = innerWidth > 270 + 2 * (175 * SC) + 40 ? 270 : 8, z = 30, tipEl, toastEl, toastT = 0;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function save() { try { localStorage.setItem('maple_win', JSON.stringify(pos)); } catch (e) {} }
  var pos = {}; try { pos = JSON.parse(localStorage.getItem('maple_win')) || {}; } catch (e) {}

  var css = document.createElement('style');
  css.textContent =
    '#mc-bar{position:fixed;top:10px;right:10px;z-index:10;display:flex;gap:6px}#mc-bar .mi-btn,#mc-bar .wm-btn{position:static}' +
    '.mw{position:fixed;display:none;user-select:none;-webkit-user-select:none;touch-action:none}.mw-in{position:relative;transform-origin:0 0;image-rendering:pixelated;font:11px Tahoma,Arial,sans-serif;color:#000}' +
    '.mw-bg{position:absolute;left:0;top:0;image-rendering:pixelated;pointer-events:none}.mw-drag{position:absolute;left:0;top:0;right:0;height:24px;cursor:move}' +
    '.mw-x{position:absolute;top:7px;right:9px;width:11px;height:11px;line-height:10px;text-align:center;font:bold 10px Arial;color:#345;cursor:pointer;border:1px solid #89a;border-radius:2px;background:#e8eef6}' +
    '.mw-c{position:absolute;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer}.mw-c img{image-rendering:pixelated;pointer-events:none;max-width:32px;max-height:32px}' +
    '.mw-c.sel,.mw-c:hover{outline:1px solid #f5c518;outline-offset:-1px;background:rgba(255,230,120,.22)}' +
    '.mw-n{position:absolute;left:0;bottom:0;display:flex;pointer-events:none}.mw-n img{image-rendering:pixelated;display:block}' +
    '.mw-tab{position:absolute;width:42px;cursor:pointer;display:flex;align-items:center;justify-content:center;font:bold 9px Arial;letter-spacing:.3px}.mw-tab img{position:absolute;left:0;top:0}.mw-tab span{position:relative;color:#7b7b7b;text-shadow:0 1px 0 #fff}.mw-tab.on span{color:#fff;text-shadow:1px 0 #8a4a00,-1px 0 #8a4a00,0 1px #8a4a00}' +
    '.mw-tab img{image-rendering:pixelated}.mw-view{position:absolute;left:11px;top:51px;width:144px;height:210px;overflow-y:scroll;scrollbar-width:none}.mw-view::-webkit-scrollbar{display:none}' +
    '.mw-sbar{position:absolute;left:157px;top:51px;width:7px;height:210px;background:rgba(80,100,130,.18);border-radius:4px}.mw-thumb{position:absolute;left:0;width:7px;border-radius:4px;background:linear-gradient(90deg,#6f8fb8,#46689a);cursor:pointer}' +
    '.mw-meso{position:absolute;left:53px;top:268px;width:70px;height:13px;text-align:right;font:bold 11px Tahoma,Arial;line-height:13px;color:#222}' +
    '.mw-name{position:absolute;left:10px;top:272px;font:bold 10px Arial;color:#2d4565}' +
    '#mw-tip{position:fixed;z-index:2147483000;display:none;pointer-events:none;max-width:260px;background:rgba(24,31,62,.97);border:1px solid #dfe6ff;border-radius:4px;box-shadow:0 0 0 1px #0a0f24;color:#fff;font:12px Tahoma,Arial,sans-serif;padding:6px 8px;line-height:1.45}' +
    '.tt{min-width:214px;image-rendering:pixelated}.tt-name{font:bold 12px Tahoma,Arial;text-align:center;color:#fff;padding:2px 0 6px}.tt-sep{border-top:1px dotted #7d8ac0;margin:5px 0}' +
    '.tt-row{display:flex;gap:8px;align-items:flex-start}.tt-icon{width:66px;height:66px;flex:none;border-radius:6px;background:radial-gradient(#4a5aa8,#262f63);border:1px solid #6c7abf;display:flex;align-items:center;justify-content:center}.tt-icon img{width:64px;height:64px;object-fit:contain;image-rendering:pixelated}' +
    '.tt-reqs{display:flex;flex-direction:column;gap:5px;padding-top:2px}.tt-req{height:7px;display:flex;align-items:center;gap:1px;white-space:nowrap}.tt-req img,.tt-jobs img,.tt-line img{image-rendering:pixelated;vertical-align:middle}' +
    '.tt-jobs{display:flex;gap:2px;flex-wrap:wrap;margin-top:6px}.tt-line{font:11px Tahoma,Arial;color:#fff;margin:2px 0;white-space:nowrap}.tt-txt{font:bold 10px Tahoma,Arial;color:#fff}.tt-desc{font:11px Tahoma,Arial;color:#fff;max-width:170px}' +
    '#mw-tip b{color:#ffe9a8}#mw-toast{position:fixed;left:50%;top:60px;transform:translateX(-50%);z-index:70;background:rgba(14,18,34,.92);color:#fff;border:1px solid #8a96c8;border-radius:6px;padding:6px 12px;font:13px sans-serif;display:none;pointer-events:none}';
  document.head.appendChild(css);
  tipEl = el('div'); tipEl.id = 'mw-tip'; toastEl = el('div'); toastEl.id = 'mw-toast'; document.body.appendChild(tipEl); document.body.appendChild(toastEl);
  function toast(t, ms) { toastEl.textContent = t; toastEl.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(function () { toastEl.style.display = 'none'; }, ms || 1800); }
  window.MAPLE_GAME.toast = function (t) { toast(t, 4500); };   // avisos largos (ej. inventario lleno al avanzar de job)
  // tooltips: con ratón siguen al cursor; con el dedo se colocan ENCIMA del punto tocado (no tapan lo que tocas), se ocultan solos a los 2,5 s,
  // al tocar en otro sitio, al cerrar la ventana y al subir un skill / equipar
  var ptype = 'mouse', tipTimer = 0;
  document.addEventListener('pointerdown', function (e) { ptype = e.pointerType || 'mouse'; if (ptype !== 'mouse') hideTip(); }, true);
  document.addEventListener('pointermove', function (e) { ptype = e.pointerType || 'mouse'; }, true);
  function showTip(e, html, ms) {
    tipEl.innerHTML = html; tipEl.style.display = 'block';
    var touch = ptype !== 'mouse', x = Math.max(4, Math.min(innerWidth - tipEl.offsetWidth - 6, e.clientX + (touch ? -tipEl.offsetWidth / 2 : 14)));
    var y = touch ? Math.max(4, e.clientY - tipEl.offsetHeight - 30) : Math.min(innerHeight - tipEl.offsetHeight - 6, e.clientY + 14);
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
    clearTimeout(tipTimer); if (touch) tipTimer = setTimeout(hideTip, ms || 2500);
  }
  function hideTip() { clearTimeout(tipTimer); tipEl.style.display = 'none'; }
  // inventario con el dedo: 1 toque = tooltip, 2 toques seguidos sobre el mismo objeto = equipar/asignar, mantener pulsado = tirar. Con ratón: clic = acción, clic derecho = tirar.
  var armed = { k: '', t: 0 };
  function itemTouch(c, key, id, act, drop, inst) {
    var lpT = 0, lp = false;
    function clr() { clearTimeout(lpT); }
    c.addEventListener('pointerdown', function (e) { lp = false; clr(); if (e.pointerType === 'mouse') return; lpT = setTimeout(function () { lp = true; armed.k = ''; hideTip(); drop(); }, 650); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { c.addEventListener(n, clr); });
    c.addEventListener('click', function (e) {
      if (ptype === 'mouse') { act(); return; }
      if (lp) { lp = false; return; }
      if (armed.k === key && performance.now() - armed.t < 3500) { armed.k = ''; hideTip(); act(); }
      else { armed.k = key; armed.t = performance.now(); showTip(e, tipOf(id, inst), 3500); }
    });
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); if (ptype === 'mouse') drop(); });
  }
  var NAMES = { str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK', att: 'ATT', matt: 'MATT', def: 'DEF', mdef: 'MDEF', mhp: 'HP', mmp: 'MP', acc: 'ACC', eva: 'AVOID', speed: 'Speed', jump: 'Jump' };
  var SORT = ['att', 'matt', 'str', 'dex', 'int', 'luk', 'def', 'mdef', 'mhp', 'mmp', 'acc', 'eva', 'speed', 'jump'];
  /* Tooltip de ítem al estilo MapleStory: etiquetas pixeladas reales de UIWindow.img/ToolTip (REQ LEV, clases, categorías) + marco azul oscuro.
     (El marco original está en UIToolTip.img, que no tenemos: se imita con CSS.) */
  var TT = 'assets/ui/tt/', JOBS = ['beginner', 'warrior', 'magician', 'bowman', 'thief', 'pirate'], JOBCLS = { warrior: 'warrior', mage: 'magician', archer: 'bowman', thief: 'thief', pirate: 'pirate' };
  var ICAT = { 100: 1, 101: 2, 102: 3, 103: 4, 104: 5, 105: 21, 106: 6, 107: 7, 108: 8, 109: 10, 110: 9, 111: 12 };
  var STATTXT = { str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK', att: 'WEAPON ATTACK', matt: 'MAGIC ATTACK', def: 'WEAPON DEFENSE', mdef: 'MAGIC DEFENSE', mhp: 'MaxHP', mmp: 'MaxMP', acc: 'ACCURACY', eva: 'AVOIDABILITY', speed: 'SPEED', jump: 'JUMP' };
  function ttImg(n) { return '<img src="' + TT + n + '.png" draggable="false">'; }
  function ttNum(v, ok) { return String(v).split('').map(function (d) { return ttImg((ok ? 'can_' : 'cant_') + d); }).join(''); }
  function tipOf(id, inst) {
    var it = I.ITEMS[id]; if (!it) return '';
    var ic = '<div class="tt-icon"><img src="assets/item/' + (it.icon || id) + '.png" draggable="false" onerror="this.style.display=\'none\'"></div>';
    if (it.kind === 'use') return '<div class="tt"><div class="tt-name">' + it.name + '</div><div class="tt-sep"></div><div class="tt-row">' + ic + '<div class="tt-desc">' + it.desc + '</div></div></div>';
    var ch = world.chars[world.selected], base = I.calcStats(ch.stats.level, {}, ch.cls, ch.branch), lv = ch.stats.level;
    var reqs = [['LEV', it.lv, lv >= it.lv], ['STR', it.req[0], base.str >= it.req[0]], ['DEX', it.req[1], base.dex >= it.req[1]], ['INT', it.req[2], base.int >= it.req[2]], ['LUK', it.req[3], base.luk >= it.req[3]]];
    var rq = reqs.map(function (r) { return '<div class="tt-req">' + ttImg((r[2] ? 'can_req' : 'cant_req') + r[0]) + ttNum(r[1], r[2]) + '</div>'; }).join('');
    var jobs = JOBS.map(function (j) { var ok = !it.cls || JOBCLS[it.cls] === j || (j === 'beginner' && false); return ttImg((ok ? 'can_' : 'can0_') + j); }).join('');
    var pre = Math.floor(+id / 10000), cat = '';
    if (it.type === 'weapon') cat = '<img src="' + TT + 'wc_' + (pre - 100) + '.png" onerror="this.outerHTML=\'<span class=tt-txt>' + (pre === 148 ? 'KNUCKLER' : 'WEAPON') + '</span>\'" draggable="false">';
    else cat = ttImg('ic_' + (ICAT[pre] || 1));
    var tot = I.statsOf(inst || id), lines = SORT.filter(function (k) { return tot[k] || it.stats[k]; }).map(function (k) {
      var d = (tot[k] || 0) - (it.stats[k] || 0);   // lo que sumaron los scrolls
      return '<div class="tt-line">' + STATTXT[k] + ' : +' + (tot[k] || 0) + (d ? ' (' + (it.stats[k] || 0) + ' <span style="color:' + (d > 0 ? '#7fd0ff' : '#ff8a8a') + '">' + (d > 0 ? '+' : '') + d + '</span>)' : '') + '</div>';
    }).join('');
    var spd = it.type === 'weapon' && it.speed >= 2 && it.speed <= 8 ? '<div class="tt-line">ATTACK SPEED : ' + ttImg('sp_' + (it.speed - 2)) + '</div>' : '';
    return '<div class="tt"><div class="tt-name">' + I.nameOf(inst || id) + '</div><div class="tt-row">' + ic + '<div class="tt-reqs">' + rq + '</div></div><div class="tt-jobs">' + jobs + '</div><div class="tt-sep"></div>' +
      '<div class="tt-line">CATEGORY : ' + cat + (it.overall ? ' <span class="tt-txt">(Overall)</span>' : '') + '</div>' + spd + lines + (it.tuc ? '<div class="tt-line">UPGRADES AVAILABLE : ' + I.slotsLeft(inst || id) + '</div>' : '') + (inst && inst.sc && inst.sc.w ? '<div class="tt-line" style="color:#ffe45c">Upgrade count protection active.</div>' : '') + potTip(inst) + '</div>';
  }

  // ventana arrastrable: w/h en px del sprite, bg = imagen de fondo
  function makeWin(id, bg, w, h, dx, dy) {
    var o = el('div', 'mw'), inn = el('div', 'mw-in'), img = el('img', 'mw-bg'); img.src = A + bg; img.draggable = false;
    inn.style.width = w + 'px'; inn.style.height = h + 'px';
    var p = pos[id] || { x: dx, y: dy }, W = { id: id, root: o, inn: inn, open: false, sc: SC };
    // escala efectiva: en pantallas pequeñas la ventana se reduce para que quepa entera (así siempre se ve su ✕)
    W.fit = function () {
      W.sc = Math.min(SC, (innerWidth - 8) / w, (innerHeight - 8) / h);
      inn.style.transform = 'scale(' + W.sc + ')'; o.style.width = w * W.sc + 'px'; o.style.height = h * W.sc + 'px';
      o.style.left = Math.max(0, Math.min(innerWidth - w * W.sc - 4, o.offsetLeft || p.x)) + 'px'; o.style.top = Math.max(0, Math.min(innerHeight - h * W.sc - 4, o.offsetTop || p.y)) + 'px';
    };
    o.style.left = p.x + 'px'; o.style.top = p.y + 'px'; W.fit();
    inn.appendChild(img); o.appendChild(inn); document.body.appendChild(o);
    var drag = el('div', 'mw-drag'), x = el('div', 'mw-x', '×'); inn.appendChild(drag); inn.appendChild(x);
    W.set = function (v) { W.open = v; if (v) W.t = performance.now(); o.style.display = v ? 'block' : 'none'; if (!v) hideTip(); if (v) { W.fit(); o.style.zIndex = ++z; W.refresh && W.refresh(true); } };
    addEventListener('resize', W.fit);
    W.toggle = function () { W.set(!W.open); };
    o.addEventListener('pointerdown', function () { o.style.zIndex = ++z; });
    x.addEventListener('click', function () { W.set(false); });
    var d = null;
    drag.addEventListener('pointerdown', function (e) { d = { px: e.clientX, py: e.clientY, x: o.offsetLeft, y: o.offsetTop, id: e.pointerId }; drag.setPointerCapture(e.pointerId); });
    drag.addEventListener('pointermove', function (e) { if (!d) return; o.style.left = Math.max(0, Math.min(innerWidth - 60, d.x + e.clientX - d.px)) + 'px'; o.style.top = Math.max(0, Math.min(innerHeight - 40, d.y + e.clientY - d.py)) + 'px'; });
    drag.addEventListener('pointerup', function () { if (d) { pos[id] = { x: o.offsetLeft, y: o.offsetTop }; save(); d = null; } });
    o.addEventListener('wheel', function (e) { e.stopPropagation(); });
    return W;
  }
  // bloque de potencial del tooltip (como en MapleStory: rango con su color y las 3 líneas)
  function potTip(inst) {
    if (!inst || typeof inst !== 'object' || !inst.pot) return '';
    var col = I.POT_COLORS[inst.pot.tier];
    return '<div class="tt-sep"></div><div class="tt-line" style="color:' + col + ';font-weight:bold">Potential (' + I.POT_TIERS[inst.pot.tier] + ')</div>' + inst.pot.lines.map(function (l) { return '<div class="tt-line">' + I.lineText(l) + '</div>'; }).join('');
  }
  function cellEl(parent, x, y, id, count, inst) {
    var c = el('div', 'mw-c'); c.style.left = x + 'px'; c.style.top = y + 'px';
    if (inst && typeof inst === 'object' && inst.pot) { var pc = I.POT_COLORS[inst.pot.tier]; c.style.boxShadow = 'inset 0 0 0 1px ' + pc; c.style.borderRadius = '3px'; }
    if (id) {
      var im = el('img'); im.src = ICON + ((I.ITEMS[id] || {}).icon || id) + '.png'; im.draggable = false; im.onerror = function () { im.remove(); c.style.cssText += ';background:linear-gradient(#8a9bc8,#5a6b98);border:1px solid #2d3a60;box-sizing:border-box;border-radius:3px;color:#fff;font:bold 8px Arial;text-align:center;line-height:1.1;overflow:hidden;word-break:break-all'; c.textContent = I.ITEMS[id].name.slice(0, 10); };
      c.appendChild(im);
      if (count > 1) { var nn = el('span', 'mw-n'); String(count).split('').forEach(function (d) { var di = el('img'); di.src = 'assets/ui2/no/' + d + '.png'; di.draggable = false; nn.appendChild(di); }); c.appendChild(nn); }
      c.addEventListener('mouseenter', function (e) { showTip(e, tipOf(id, inst)); }); c.addEventListener('mousemove', function (e) { showTip(e, tipOf(id, inst)); }); c.addEventListener('mouseleave', hideTip);
    }
    parent.appendChild(c); return c;
  }

  /* ---------- Item Inventory (I) ---------- */
  var pickSig = function () { return pick ? pick.id : ''; };
  var IW = makeWin('item', '../ui2/item_bg.png', 172, 335, X0, 46), tab = 'equip', view, thumb, bar, mesoEl, tabEls = {}, isig = '';
  (function () {
    var inn = IW.inn;
    [['equip', 'EQUIP'], ['use', 'USE']].forEach(function (t, i) {
      var b = el('div', 'mw-tab'); b.style.left = 9 + i * 43 + 'px';
      var on = el('img'), off = el('img'); on.src = 'assets/ui2/tab_on.png'; off.src = 'assets/ui2/tab_off.png'; on.draggable = off.draggable = false; tabEls[t[0]] = { b: b, on: on, off: off, lbl: t[1] };
      b.addEventListener('click', function () { tab = t[0]; isig = ''; IW.refresh(); }); inn.appendChild(b);
    });
    view = el('div', 'mw-view'); bar = el('div', 'mw-sbar'); thumb = el('div', 'mw-thumb'); bar.appendChild(thumb);
    mesoEl = el('div', 'mw-meso');
    inn.appendChild(view); inn.appendChild(bar); inn.appendChild(mesoEl);
    function syncThumb() {
      var max = view.scrollHeight - view.clientHeight, h = Math.max(24, 210 * view.clientHeight / view.scrollHeight);
      thumb.style.height = h + 'px'; thumb.style.top = (max > 0 ? (210 - h) * view.scrollTop / max : 0) + 'px';
    }
    var ROW = 35, snapT = null;   // el fondo del inventario tiene la cuadrícula fija: el contenido se mueve de fila en fila para que siempre coincida con los cuadros
    function snap() { var t = Math.round(view.scrollTop / ROW) * ROW; if (Math.abs(t - view.scrollTop) > 0.5) view.scrollTop = t; }
    view.addEventListener('scroll', function () { syncThumb(); clearTimeout(snapT); snapT = setTimeout(snap, 90); });
    view.addEventListener('wheel', function (e) { e.preventDefault(); e.stopPropagation(); view.scrollTop = Math.round(view.scrollTop / ROW) * ROW + (e.deltaY > 0 ? ROW : -ROW); }, { passive: false });
    IW.syncThumb = syncThumb;
    var td = null;
    thumb.addEventListener('pointerdown', function (e) { td = { y: e.clientY, s: view.scrollTop }; thumb.setPointerCapture(e.pointerId); });
    thumb.addEventListener('pointermove', function (e) { if (!td) return; var max = view.scrollHeight - view.clientHeight, h = parseFloat(thumb.style.height); view.scrollTop = Math.round((td.s + (e.clientY - td.y) / IW.sc * max / (210 - h)) / ROW) * ROW; });
    thumb.addEventListener('pointerup', function () { td = null; });
    bar.addEventListener('pointerdown', function (e) { if (e.target === bar) { var r = bar.getBoundingClientRect(); view.scrollTop = Math.round(((e.clientY - r.top) / r.height * view.scrollHeight - view.clientHeight / 2) / ROW) * ROW; } });
  })();
  IW.refresh = function (force) {
    if (!IW.open) return;
    var ch = world.chars[world.selected], s = JSON.stringify([tab, world.inv, world.equip, world.stats.level, ch.potions.hp.id, ch.potions.mp.id, world.mesos, pickSig()]);
    if (!force && s === isig) return; isig = s;
    for (var k in tabEls) { var on = k === tab; tabEls[k].b.className = 'mw-tab' + (on ? ' on' : ''); tabEls[k].b.style.top = (on ? 26 : 28) + 'px'; tabEls[k].b.style.height = (on ? 19 : 17) + 'px'; tabEls[k].b.innerHTML = ''; tabEls[k].b.appendChild(on ? tabEls[k].on : tabEls[k].off); tabEls[k].b.appendChild(el('span', '', tabEls[k].lbl)); }
    var keep = view.scrollTop; view.innerHTML = ''; var rows = Math.ceil(I.INV_SIZE / 4), full = el('div'); full.style.cssText = 'position:relative;height:' + rows * 35 + 'px';
    for (var i = 0; i < I.INV_SIZE; i++) (function (idx) {
      var x = 36 * (idx % 4), y = 35 * Math.floor(idx / 4), c;
      if (tab === 'equip') {
        var inst = world.inv.equip[idx], id = I.idOf(inst); c = cellEl(full, x, y, id, 1, inst);
        if (pick) { var okp = id && pickEligible(inst); c.classList.add(okp ? 'pk-ok' : 'pk-no'); if (okp) c.addEventListener('click', function () { chooseTarget({ where: 'inv', idx: idx }); }); }
        else if (id) {
          itemTouch(c, 'e' + idx, id, function () { var r = I.equipItem(world.inv, world.equip, world.stats.level, idx, world.chars[world.selected].cls, world.chars[world.selected].branch); toast(r.msg); G.save(); isig = ''; hideTip(); IW.refresh(); EW.refresh(true); },
            function () { toast('Descartado: ' + I.ITEMS[id].name); world.inv.equip[idx] = null; G.save(); isig = ''; hideTip(); IW.refresh(); }, inst);
        }
      } else {
        var sl = world.inv.use[idx]; c = cellEl(full, x, y, sl && sl.id, sl ? sl.count : 0);
        if (sl) {
          itemTouch(c, 'u' + idx, sl.id, function () {
            var it = I.ITEMS[sl.id], cc = world.chars[world.selected];
            if (it.heal) { var k2 = it.heal.hp ? 'hp' : 'mp'; cc.potions[k2].id = it.id; toast(it.name + ' asignada a ' + cc.name + ' (' + cc.potions[k2].pct + '% de ' + k2.toUpperCase() + ')'); G.save(); isig = ''; IW.refresh(); }
            else if (I.CUBES[it.id] || it.scroll) startPick(it.id);
            else toast(it.name);
          }, function () { toast('Descartado: ' + I.ITEMS[sl.id].name + ' x' + sl.count); world.inv.use[idx] = null; G.save(); isig = ''; hideTip(); IW.refresh(); });
        }
      }
    })(i);
    view.appendChild(full); view.scrollTop = keep; mesoEl.textContent = String(Math.floor(world.mesos)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); IW.syncThumb();
  };

  /* ---------- Equipment Inventory (E) ---------- */
  var EW = makeWin('equip', '../ui2/equip_bg.png', 232, 348, X0 + 175 * SC + 16, 46);
  // posición (x,y) de cada ranura en la ventana de 232x348 (UIWindow4 Equip; celdas de 40x39, paso 41)
  var SLOTPOS = { hat: [96, 50], top: [96, 173], bottom: [96, 214], glove: [137, 214], shoes: [96, 255], cape: [178, 214], ring1: [14, 50], ring2: [14, 91], ring3: [14, 132], ring4: [14, 173], earring: [137, 132], weapon: [55, 173], sub: [178, 173] };
  var esig = '', ename = el('div', 'mw-name'); EW.inn.appendChild(ename);
  EW.refresh = function (force) {
    if (!EW.open) return;
    var ch = world.chars[world.selected], s = JSON.stringify([world.equip, world.selected, ch.name]);
    if (!force && s === esig) return; esig = s;
    EW.inn.querySelectorAll('.mw-c').forEach(function (n) { n.remove(); });
    I.SLOTS.forEach(function (sl) {
      var p = SLOTPOS[sl], id = I.idOf(world.equip[sl]), c = cellEl(EW.inn, p[0] + 4, p[1] + 4, id, 1, world.equip[sl]);
      if (pick) { var okq = id && pickEligible(world.equip[sl]); c.classList.add(okq ? 'pk-ok' : 'pk-no'); if (okq) c.addEventListener('click', function () { chooseTarget({ where: 'eq', slot: sl }); }); }
      else if (id) c.addEventListener('click', function () { var r = I.unequipSlot(world.inv, world.equip, sl); toast(r.ok ? 'Desequipado: ' + I.ITEMS[id].name : r.msg); G.save(); esig = ''; isig = ''; hideTip(); EW.refresh(); IW.refresh(); });
    });
    ename.textContent = ch.name + ' · Lv ' + world.stats.level;
  };
  EW.inn.style.overflow = 'visible'; ename.style.cssText = 'position:absolute;left:12px;top:318px;font:bold 11px Arial;color:#2d4565;width:150px;white-space:nowrap';

  /* ---------- Character Stat (S) ---------- */
  var SW = makeWin('stat', '../ui2/stat_bg.png', 212, 284, innerWidth - 424 * SC - 8, 46), ssig = '', sfields = {}, sdet = null, sdetOpen = false;
  (function () {
    // campos de texto sobre los cuadros blancos del sprite (x 69..198); top = y del cuadro
    function fld(parent, k, left, top, w) {
      var f = el('div'); f.style.cssText = 'position:absolute;left:' + left + 'px;top:' + top + 'px;width:' + w + 'px;height:13px;line-height:13px;font:11px Tahoma,Arial;color:#222;white-space:nowrap;overflow:hidden;text-align:right;padding-right:4px;box-sizing:border-box';
      parent.appendChild(f); sfields[k] = f;
    }
    [['name', 32], ['job', 49], ['level', 68], ['damage', 86], ['hp', 104], ['mp', 122], ['str', 173], ['dex', 190], ['int', 209], ['luk', 227]].forEach(function (r) { fld(SW.inn, r[0], 69, r[1], 129); });
    var bd = el('div'); bd.style.cssText = 'position:absolute;left:132px;top:254px;width:68px;height:15px;cursor:pointer'; SW.inn.appendChild(bd);
    sdet = el('div'); sdet.style.cssText = 'position:absolute;left:212px;top:0;width:212px;height:218px;display:none';
    var dbg = el('img', 'mw-bg'); dbg.src = 'assets/ui2/stat_det.png'; sdet.appendChild(dbg); SW.inn.appendChild(sdet);
    // detalle: filas completas x 69..197 y mitades (BOSS ATT | IGNORE DEF, WEAPON ATT | MAGIC ATT) en x 70..101 y 166..197
    [['dmg', 41, 69, 129], ['crit', 59, 69, 129], ['critdmg', 77, 69, 129], ['boss', 95, 70, 32], ['ied', 95, 166, 32], ['att', 113, 70, 32], ['matt', 113, 166, 32], ['wdef', 131, 69, 129], ['avoid', 149, 69, 129], ['aspd', 167, 69, 129], ['speed', 185, 69, 129]].forEach(function (r) { fld(sdet, r[0], r[2], r[1], r[3]); });
    bd.addEventListener('click', function () { sdetOpen = !sdetOpen; sdet.style.display = sdetOpen ? 'block' : 'none'; });
  })();
  SW.refresh = function (force) {
    if (!SW.open) return;
    var ch = world.chars[world.selected], st = world.stats, t = S.cstatsOf(ch), need = S.expToNext(st.level), s = JSON.stringify([ch.name, st, world.equip, world.selected, sdetOpen, ch.skills, ch.buffs.map(function (b) { return b.id; })]);
    if (!force && s === ssig) return; ssig = s;
    var pct = st.level >= S.MAX_LEVEL ? 100 : st.exp / need * 100;
    function setv(k, v) { sfields[k].textContent = v; }
    var md = S.mods(ch), crit = ((world.cfg.baseCrit !== undefined ? world.cfg.baseCrit : 0.05) + md.crit) * 100, critDmg = ((world.cfg.critMul || 1.5) + md.critDmg) * 100;
    setv('name', ch.name); setv('job', I.CLASSES[ch.cls].label); setv('level', st.level + (st.level >= S.MAX_LEVEL ? '  (MAX)' : '  (' + pct.toFixed(1) + '%)'));
    setv('damage', t.min + ' ~ ' + t.max); setv('hp', Math.ceil(st.hp) + ' / ' + st.maxHp); setv('mp', Math.floor(st.mp) + ' / ' + st.maxMp);
    ['str', 'dex', 'int', 'luk'].forEach(function (k) { setv(k, t[k] + ' (' + t.ap[k] + ' + ' + (t[k] - t.ap[k]) + ')'); });   // total (AP + externos: equipo, skills, buffs) como MapleStory
    setv('dmg', t.min + ' ~ ' + t.max); setv('crit', Math.round(crit) + '%'); setv('critdmg', Math.round(critDmg) + '%');
    setv('boss', Math.round(md.bossPct * 100) + '%'); setv('ied', '0%'); setv('att', t.att); setv('matt', t.matt);
    setv('wdef', t.def + (md.physReduce > 0 ? '  (-' + md.physReduce + '% dmg)' : ''));
    setv('avoid', md.eva + '  (' + Math.round(md.eva / (md.eva + 600) * 100) + '%)');   // solo cuenta la esquiva de skills/buffs (así la usa el combate)
    var stg = S.weaponStage(world), nm = stg <= 3 ? 'Fastest' : stg === 4 ? 'Faster' : stg === 5 ? 'Fast' : stg === 6 ? 'Normal' : stg === 7 ? 'Slow' : 'Slower';
    setv('aspd', nm + ' (' + stg + ')'); setv('speed', Math.round((1 + md.speed) * 100) + '%');
  };

  /* ---------- Skill Inventory (K) ---------- */
  var KW = makeWin('skill', '../ui2/skill_bg.png', 174, 299, X0 + 60, 70), ksig = '', klist, kjob, ksp, ktab = -1, ktabs = [];   // ktab: 0 = Beginner, 1..4 = 1er..4to job (-1 = elegir según el personaje)
  (function () {
    ['Beginner', '1er job', '2do job', '3er job', '4to job'].forEach(function (nm, i) {   // pestañas (sprites UIWindow2 Skill/Tab): Beginner, 1er, 2do, 3er y 4to job
      var tb = el('div'); tb.style.cssText = 'position:absolute;left:' + (10 + i * 31) + 'px;width:30px;cursor:pointer'; tb.title = nm;
      var im = el('img'); im.draggable = false; im.style.cssText = 'display:block;image-rendering:pixelated'; tb.appendChild(im); tb._img = im;
      tb.addEventListener('click', function () { ktab = i; KW.refresh(true); }); KW.inn.appendChild(tb); ktabs.push(tb);
    });
    kjob = el('div'); kjob.style.cssText = 'position:absolute;left:50px;top:61px;width:108px;font:bold 11px Tahoma,Arial;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:1px 1px 0 #0b3a5a'; KW.inn.appendChild(kjob);
    klist = el('div'); klist.style.cssText = 'position:absolute;left:11px;top:91px;width:150px;height:157px;overflow-x:hidden;overflow-y:auto;scrollbar-width:thin'; klist.addEventListener('wheel', function (e) { e.stopPropagation(); }); KW.inn.appendChild(klist);
    ksp = el('div'); ksp.style.cssText = 'position:absolute;left:137px;top:257px;width:25px;height:14px;text-align:center;font:bold 11px Tahoma,Arial;line-height:14px;color:#222'; KW.inn.appendChild(ksp);
  })();
  /* Tooltip de skill al estilo MapleStory: icono, [Master Level], descripción, skill requerida, [Current Level], [Next Level] y [Required] */
  function skTip(sk, lv) {
    var SK = window.MapleSkills, esc = function (t) { return String(t).replace(/</g, '&lt;'); };
    function det(x) {
      try {
        var t = [];
        if (sk.info) t.push(sk.info(x)); else if (sk.damage) t.push('Damage: ' + sk.damage(x) + '%' + (sk.attackCount > 1 ? ' x ' + sk.attackCount : '') + (sk.mobCount > 1 ? ', Max targets: ' + sk.mobCount : ''));
        if (sk.mpCon && !sk.passiveSkill && sk.mpCon(x)) t.push('MP Cost: ' + sk.mpCon(x));
        if (sk.buff && sk.duration && (!sk.info || sk.info(x).indexOf(' s') < 0)) t.push('Duration: ' + sk.duration(x) + ' s');
        return t.join('<br>');
      } catch (er) { return ''; }
    }
    var BF = window.MapleBuffs && window.MapleBuffs.BUFFS[sk.buff];
    var desc = sk.desc || (sk.passiveSkill ? 'Skill pasiva: siempre activa.' : sk.buff ? (BF && BF.party ? 'Buff para todo el party del mapa.' : 'Buff propio.') + ' Con Auto se renueva sola.' : sk.teleportSkill ? 'Movimiento rápido; con Auto se usa para seguir al líder y subir plataformas.' : sk.debuff ? 'Debilita a los enemigos cercanos.' : sk.summon ? 'Invoca un aliado que ataca solo.' : 'Ataca a ' + (sk.mobCount > 1 ? 'hasta ' + sk.mobCount + ' enemigos' : 'un enemigo') + ' frente al personaje.');
    var reqs = sk.req ? Object.keys(sk.req).filter(function (k) { return SK.SKILLS[k]; }) : [];
    var reqTxt = reqs.map(function (k) { var ok = (world.skills[k] ? world.skills[k].level : 0) >= sk.req[k]; return '<span style="color:' + (ok ? '#9dff8a' : '#ffa64a') + '">Required Skill: ' + esc(SK.SKILLS[k].name) + ' Lv. ' + sk.req[k] + '</span>'; }).join('<br>');
    var h = '<div style="width:236px"><div style="font:bold 12px Tahoma,Arial;color:#fff;padding-bottom:4px"><span style="color:#7fe3d0">&bull;</span> ' + esc(sk.name) + '</div>' +
      '<div class="tt-row"><div class="tt-icon" style="width:44px;height:44px"><img style="width:32px;height:32px" src="' + sk.icon + '"></div><div style="font:11px Tahoma,Arial;color:#fff;flex:1">[Master Level: ' + sk.maxLevel + ']<br>' + esc(desc) + (reqTxt ? '<br>' + reqTxt : '') + '</div></div><div class="tt-sep"></div>';
    if (lv > 0) h += '<div style="font:11px Tahoma,Arial">[Current Level ' + lv + ']<br>' + det(lv) + '</div>';
    if (lv < sk.maxLevel) h += '<div style="font:11px Tahoma,Arial;margin-top:' + (lv > 0 ? 4 : 0) + 'px">[Next Level ' + (lv + 1) + ']<br>' + det(lv + 1) + '</div>';
    if (reqs.length) h += '<div class="tt-sep"></div><div style="font:11px Tahoma,Arial">[Required]</div>' + reqs.map(function (k) { var q = SK.SKILLS[k]; return '<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><img src="' + q.icon + '" style="width:28px;height:28px;image-rendering:pixelated"><div style="font:11px Tahoma,Arial">' + esc(q.name) + '<br>Level : ' + sk.req[k] + '</div></div>'; }).join('');
    return h + '</div>';
  }
  KW.refresh = function (force) {
    if (!KW.open) return;
    var SK = window.MapleSkills, s = JSON.stringify([world.selected, world.skills, world.stats.level, world.chars[world.selected].branch, ktab]);
    if (!force && s === ksig) return; ksig = s;
    klist.innerHTML = ''; var cl = world.chars[world.selected].cls; var chb = world.chars[world.selected].branch, jb = chb && window.MapleJobs && window.MapleJobs.get(chb); kjob.textContent = I.CLASSES[cl].label + (jb ? ' · ' + jb.name : ' · 1st job'); var tabNow = ktab < 0 ? (chb ? 2 : 1) : ktab; ksp.textContent = tabNow >= 1 ? SK.spAvailable(world, tabNow) : 0; ktabs.forEach(function (tb, i) { var on = i === tabNow; tb._img.src = 'assets/ui2/sktab' + i + (on ? '_on' : '_off') + '.png'; tb.style.top = (on ? 27 : 29) + 'px'; });
    var mine = SK.ORDER.filter(function (id) { var q = SK.SKILLS[id]; return (!q.cls || q.cls === cl) && SK.jobOf(q) === tabNow && (SK.jobOf(q) < 2 || (chb && q.branches && q.branches.indexOf(chb) >= 0)); });   // cada pestaña muestra los skills de su job (2do job: solo los de su rama)
    if (!mine.length) { var ne = el('div', '', tabNow === 0 ? 'Sin skills de Beginner.' : tabNow === 2 && !chb ? 'Avanza de job a Lv30 (botón en Personajes, C) para ver los skills del 2do job.' : tabNow >= 3 ? 'Aún no disponible.' : 'Sin skills en esta pestaña.'); ne.style.cssText = 'font:11px Tahoma,Arial;color:#567;padding:8px'; klist.appendChild(ne); }
    mine.forEach(function (id, i) {
      var sk = SK.SKILLS[id], st = world.skills[id], lv = st.level, off0 = !window.MapleSim.skillAllowed(world.chars[world.selected], sk), row = el('div'), canUp = SK.canLearn(world, id);
      row.style.cssText = 'position:absolute;left:0;top:' + (i * 35) + 'px;width:140px;height:35px;background:url(assets/ui2/skrow' + (lv && !off0 ? 0 : 1) + '.png)';
      var ic = el('img'); ic.src = sk.icon; ic.draggable = false; ic.style.cssText = 'position:absolute;left:1px;top:2px;width:32px;height:32px;image-rendering:pixelated' + (lv && !off0 ? '' : ';filter:grayscale(1) opacity(.55)'); row.appendChild(ic);
      var nm = el('div', '', sk.name); nm.style.cssText = 'position:absolute;left:39px;top:3px;width:82px;overflow:hidden;text-overflow:ellipsis;font:bold 10px Tahoma,Arial;color:#222;white-space:nowrap'; row.appendChild(nm);
      var off = !window.MapleSim.skillAllowed(world.chars[world.selected], sk), lvl = el('div', '', 'Lv. ' + lv + '/' + sk.maxLevel); lvl.style.cssText = 'position:absolute;left:39px;top:20px;font:10px Tahoma,Arial;color:#444;white-space:nowrap'; row.appendChild(lvl);
      var up = el('img'); up.src = A + 'spup_' + (canUp ? 'normal' : 'disabled') + '.png'; up.draggable = false; up.style.cssText = 'position:absolute;left:125px;top:4px;image-rendering:pixelated;cursor:' + (canUp ? 'pointer' : 'default'); row.appendChild(up);
      if (canUp) { up.addEventListener('mouseenter', function () { up.src = A + 'spup_mouseOver.png'; }); up.addEventListener('mouseleave', function () { up.src = A + 'spup_normal.png'; });
        up.addEventListener('click', function () { hideTip(); if (SK.learn(world, id)) { G.save(); ksig = ''; KW.refresh(); } }); }
      var lab = el('label'); lab.style.cssText = 'position:absolute;left:100px;top:21px;font:9px Tahoma,Arial;color:#335;cursor:pointer;white-space:nowrap'; var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!st.auto; cb.style.cssText = 'margin:0 2px 0 0;vertical-align:middle;width:9px;height:9px';
      cb.addEventListener('change', function () { st.auto = cb.checked; G.save(); }); lab.appendChild(cb); lab.appendChild(document.createTextNode('Auto')); if (!sk.passiveSkill) row.appendChild(lab);   // las pasivas no llevan Auto
      row.addEventListener('mouseenter', function (e) { showTip(e, skTip(sk, lv)); });
      row.addEventListener('mousemove', function (e) { showTip(e, tipEl.innerHTML); }); row.addEventListener('mouseleave', hideTip);
      klist.appendChild(row);
    });
    klist.style.overflowY = 'auto';
  };

  /* ---------- Tienda (T) ---------- */
  var HW = makeWin('shop', '../ui2/shop_bg.png', 465, 328, Math.max(0, (innerWidth - 463) / 2), 40), hsel = null, hrow = null, htab = 'equip', hcat = 'consumable', hsig = '', hcap, hnote, hbuy, hsell, hmeso, hL, hR;
  function bt(name, x, y, fn) {
    var b = el('img'); b.draggable = false; b.src = 'assets/ui2/' + name + '_normal.png'; b.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;cursor:pointer;image-rendering:pixelated'; b.dataset.n = name;
    b.addEventListener('mouseenter', function () { if (!b.dataset.dis) b.src = 'assets/ui2/' + name + '_mouseOver.png'; }); b.addEventListener('mouseleave', function () { b.src = 'assets/ui2/' + name + (b.dataset.dis ? '_disabled' : '_normal') + '.png'; });
    b.addEventListener('pointerdown', function () { if (!b.dataset.dis) b.src = 'assets/ui2/' + name + '_pressed.png'; }); b.addEventListener('click', function () { if (!b.dataset.dis) fn(); });
    b.setEnabled = function (v) { if (v) delete b.dataset.dis; else b.dataset.dis = '1'; b.src = 'assets/ui2/' + name + (v ? '_normal' : '_disabled') + '.png'; b.style.cursor = v ? 'pointer' : 'default'; };
    HW.inn.appendChild(b); return b;
  }
  function askQty(title, max, cb) {
    var ov = el('div', 'wm-ov'), box = el('div', 'wm-box'); ov.style.zIndex = 80;
    box.appendChild(el('div', 'wm-h', title)); var inp = document.createElement('input'); inp.type = 'number'; inp.min = 1; inp.max = max; inp.value = 1; inp.style.cssText = 'width:100%;box-sizing:border-box;padding:8px;font:15px sans-serif;border-radius:6px;border:1px solid #556;background:#0d1020;color:#fff';
    ['keydown', 'keyup', 'keypress'].forEach(function (ev) { inp.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    box.appendChild(inp); box.appendChild(el('div', '', 'Máximo: ' + max)); var act = el('div', 'wm-act'), no = el('button', 'wm-go', 'Cancelar'), ok = el('button', 'wm-go', 'Aceptar');
    no.addEventListener('click', function () { ov.remove(); }); ok.addEventListener('click', function () { var n = Math.max(1, Math.min(max, inp.value | 0)); ov.remove(); cb(n); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ok.click(); });
    act.appendChild(no); act.appendChild(ok); box.appendChild(act); ov.appendChild(box); document.body.appendChild(ov); setTimeout(function () { inp.focus(); inp.select(); }, 30);
  }
  function fm(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  (function () {
    var H = HW.inn;
    var t1 = el('div'), i1 = el('img'); i1.src = 'assets/ui2/shop_tab0_on.png'; i1.draggable = false; i1.style.imageRendering = 'pixelated'; t1.style.cssText = 'position:absolute;left:10px;top:91px'; t1.appendChild(i1); H.appendChild(t1);   // pestaña ALL (compra)
    [['equip', 1], ['use', 2]].forEach(function (t, i) {   // pestañas de venta: EQUIP / USE
      var b = el('div'); b.style.cssText = 'position:absolute;left:' + (241 + i * 43) + 'px;width:42px;cursor:pointer'; b.dataset.t = t[0]; b.dataset.k = t[1]; H.appendChild(b);
      b.addEventListener('click', function () { htab = t[0]; hsel = null; hsig = ''; HW.refresh(); });
    });
    var cap = el('div', '', 'Tienda'); hcap = cap; cap.style.cssText = 'position:absolute;left:14px;top:14px;width:100px;font:bold 12px Tahoma,Arial;color:#345'; H.appendChild(cap);
    var nt = el('div', '', ''); hnote = nt; nt.style.cssText = 'position:absolute;left:14px;top:32px;width:98px;font:10px Tahoma,Arial;color:#456;line-height:1.35'; H.appendChild(nt);
    hL = el('div'); hL.style.cssText = 'position:absolute;left:11px;top:115px;width:215px;height:210px;overflow-y:scroll;scrollbar-width:thin'; H.appendChild(hL);
    hR = el('div'); hR.style.cssText = 'position:absolute;left:242px;top:115px;width:215px;height:210px;overflow-y:scroll;scrollbar-width:thin'; H.appendChild(hR);
    [hL, hR].forEach(function (v) {   // el fondo tiene la cuadrícula fija: el contenido se mueve de fila en fila (42 px)
      var tm = null; function snap() { var t = Math.round(v.scrollTop / 42) * 42; if (Math.abs(t - v.scrollTop) > 0.5) v.scrollTop = t; }
      v.addEventListener('scroll', function () { clearTimeout(tm); tm = setTimeout(snap, 90); });
      v.addEventListener('wheel', function (e) { e.preventDefault(); e.stopPropagation(); v.scrollTop = Math.round(v.scrollTop / 42) * 42 + (e.deltaY > 0 ? 42 : -42); }, { passive: false });
    });
    var sa = el('div', '', 'Vender todo'); sa.style.cssText = 'position:absolute;left:350px;top:26px;width:104px;font:10px Tahoma,Arial;color:#345;text-align:right;cursor:pointer;text-decoration:underline'; sa.title = 'Vende todo lo de esta pestaña (clic derecho en un objeto = vender al instante)'; sa.addEventListener('click', sellAllTab); H.appendChild(sa);
    hmeso = el('div'); hmeso.style.cssText = 'position:absolute;left:373px;top:65px;width:78px;height:13px;text-align:right;font:bold 11px Tahoma,Arial;line-height:13px;color:#222'; H.appendChild(hmeso);
    hbuy = bt('btbuy', 158, 45, function () { doBuy(); }); hsell = bt('btsell', 390, 45, function () { doSell(); });
    bt('btexit', 158, 25, function () { HW.set(false); });
    var back = el('div', '', '◀ Categorías'); back.style.cssText = 'position:absolute;left:14px;top:72px;font:10px Tahoma,Arial;color:#345;cursor:pointer;text-decoration:underline'; back.addEventListener('click', function () { HW.set(false); SM.set(true); }); H.appendChild(back);
  })();

  /* ---------- Usar cubos y scrolls ----------
     Flujo (como en MapleStory): usar el objeto en el inventario → pestaña Equip en "modo elegir equipo" (los válidos brillan) → clic en un equipo →
     cuadro de confirmación → cubo: ventana animada (Cube_Black / Cube_InGame1 de UIWindow2.img) · scroll: resultado en el mismo cuadro. */
  var CUBEUI = {"b": {"w": 196, "h": 355, "n": [[10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62]], "u": [[10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62]], "g": [[10, 26], [10, 26], [10, 26], [10, 26], [3, 26], [5, 26], [7, 26], [10, 26], [10, 26], [10, 26], [10, 62], [10, 62]], "before": [10, 151, 176, 82], "after": [10, 236, 176, 82], "more": [31, 326, 133, 16]}, "r": {"w": 196, "h": 270, "n": [[10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62]], "u": [[10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62], [10, 62]], "g": [[10, 26], [10, 26], [10, 26], [10, 26], [10, 26], [10, 26], [10, 26], [10, 26], [10, 26], [10, 26], [10, 62], [10, 62]], "ok": [146, 241, 40, 16], "more": [10, 241, 133, 16]}};
  function toolCss() {
    if (document.getElementById('cube-css')) return; var st = document.createElement('style'); st.id = 'cube-css';
    st.textContent = '#cube-ov{position:fixed;inset:0;z-index:2147482000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-family:Tahoma,Arial,sans-serif}' +
      '#cube-ov .b{box-sizing:border-box;width:min(340px,calc(100vw - 16px));background:#10172c;border:1px solid #8fdcff;border-radius:10px;padding:14px;color:#e8ecf5;box-shadow:0 8px 30px #000a;font-size:13px;line-height:1.4}#cube-ov .b b{color:#ffe45c}' +
      '#cube-ov .row{display:flex;gap:8px;margin-top:12px}#cube-ov button{flex:1;padding:9px;border-radius:7px;border:1px solid #8fdcff;background:#26304f;color:#cfeeff;font-size:13px;cursor:pointer}#cube-ov .x{border-color:#ffd23f;color:#ffe45c}' +
      '#pick-bar{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147481000;display:flex;gap:10px;align-items:center;max-width:calc(100vw - 16px);box-sizing:border-box;padding:7px 12px;background:#10172cf2;border:1px solid #ffd23f;border-radius:9px;color:#e8ecf5;font:13px Tahoma,Arial,sans-serif;box-shadow:0 4px 18px #000a}#pick-bar b{color:#ffe45c}#pick-bar button{padding:5px 10px;border-radius:6px;border:1px solid #ffd23f;background:#26304f;color:#ffe45c;cursor:pointer}' +
      '.mw-c.pk-no{opacity:.3;cursor:default}' +
      '.cu-ov{position:fixed;inset:0;z-index:2147482000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none}.cu-box{position:relative}.cu{position:absolute;left:0;top:0;transform-origin:0 0;image-rendering:pixelated;font:11px Tahoma,Arial,sans-serif}' +
      '.cu img{position:absolute;image-rendering:pixelated;pointer-events:none}.cu .tx{position:absolute;color:#fff;line-height:13px;overflow:hidden;white-space:nowrap}.cu .tx i{display:block;text-align:center;font-style:normal;font-weight:bold}.cu .hit{position:absolute;cursor:pointer}.cu .hit.off{cursor:default}';
    document.head.appendChild(st);
  }
  var pick = null, pickBar = null;
  function getT(t) { return t.where === 'inv' ? world.inv.equip[t.idx] : world.equip[t.slot]; }
  function putT(t, v) { if (t.where === 'inv') world.inv.equip[t.idx] = v; else world.equip[t.slot] = v; }
  function pickEligible(inst) { return !!(pick && inst && (pick.kind === 'cube' ? I.cubeCheck(pick.id, inst) : I.scrollCheck(pick.id, inst).ok)); }
  function refreshAll() { isig = ''; esig = ''; hideTip(); IW.refresh(true); EW.refresh(true); }
  function onPickKey(e) { if (e.key === 'Escape' && pick && !document.getElementById('cube-ov')) { e.stopPropagation(); cancelPick(); } }
  function cancelPick() {
    if (!pick) return; pick = null; if (pickBar) { pickBar.remove(); pickBar = null; } removeEventListener('keydown', onPickKey, true); refreshAll();
  }
  function startPick(itemId) {
    toolCss(); var it = I.ITEMS[itemId];
    if (I.countItem(world.inv, itemId) < 1) return;
    var prev = pick; pick = { id: itemId, kind: I.CUBES[itemId] ? 'cube' : 'scroll' };
    var any = world.inv.equip.some(function (x) { return pickEligible(x); }) || I.SLOTS.some(function (sl) { return pickEligible(world.equip[sl]); });
    if (!any) { pick = prev; toast('No tienes ningún equipo al que se pueda aplicar ' + it.name + '.', 3000); return; }
    if (pickBar) pickBar.remove(); else addEventListener('keydown', onPickKey, true);
    pickBar = el('div'); pickBar.id = 'pick-bar'; pickBar.innerHTML = 'Elige el equipo para usar <b>' + it.name + '</b>'; var cb = el('button', '', 'Cancelar'); cb.onclick = cancelPick; pickBar.appendChild(cb); document.body.appendChild(pickBar);
    tab = 'equip'; IW.set(true); refreshAll();
  }
  function confirmBox(html, onYes) {   // cuadro Sí / No
    var ov = el('div'); ov.id = 'cube-ov'; ov.innerHTML = '<div class="b"><div class="m">' + html + '</div><div class="row"><button class="y">Sí</button><button class="x n">No</button></div></div>'; document.body.appendChild(ov);
    function close() { ov.remove(); removeEventListener('keydown', onk, true); }
    function onk(e) { if (e.key === 'Escape') { e.stopPropagation(); e.stopImmediatePropagation(); close(); } else if (e.key === 'Enter') { e.stopPropagation(); ov.querySelector('.y').click(); } }
    addEventListener('keydown', onk, true);
    ov.querySelector('.n').onclick = close; ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.y').onclick = function () { removeEventListener('keydown', onk, true); onYes(ov); };
  }
  function chooseTarget(t) {
    if (!pick) return; var x = getT(t), id = pick.id, kind = pick.kind, it = I.ITEMS[id]; if (!x || !pickEligible(x)) return;
    confirmBox('¿Quieres usar <b>' + it.name + '</b> en <b>' + I.nameOf(x) + '</b>?', function (ov) {
      if (!I.removeItem(world.inv, id, 1)) { ov.remove(); cancelPick(); return; }
      if (kind === 'cube') { ov.remove(); cancelPick(); openCubeUI(id, t); return; }
      var r = I.scrollUse(x, id), col, msg;
      if (!r.ok) { I.addItem(world.inv, id, 1); col = '#ff9a9a'; msg = r.msg; }
      else { putT(t, r.inst); col = r.success ? '#9dff8a' : '#ff9a9a'; msg = r.msg; G.save(); }
      cancelPick();
      var nm = I.nameOf(r.ok ? r.inst : x);
      ov.querySelector('.b').innerHTML = '<div class="m"><b>' + it.name + '</b> → ' + nm + '</div><div class="m" style="margin-top:8px;font-size:15px;color:' + col + '">' + msg + '</div>' + (r.ok && r.inst.sc && r.inst.sc.w ? '<div class="m" style="color:#ffe45c;margin-top:4px">Upgrade count protection active.</div>' : '') + '<div class="row"><button class="x ok">OK</button></div>';
      function close() { ov.remove(); removeEventListener('keydown', onk, true); }
      function onk(e) { if (e.key === 'Escape' || e.key === 'Enter') { e.stopPropagation(); e.stopImmediatePropagation(); close(); } }
      addEventListener('keydown', onk, true); ov.querySelector('.ok').onclick = close;
    });
  }
  function potHtml(inst) {
    var pot = inst && typeof inst === 'object' && inst.pot;
    if (!pot) return '<i style="color:#9fb0d0">No potential</i>';
    return '<i style="color:' + I.POT_COLORS[pot.tier] + '">' + I.POT_TIERS[pot.tier] + '</i>' + pot.lines.map(function (l) { return '<div style="overflow:hidden;text-overflow:ellipsis">' + I.lineText(l) + '</div>'; }).join('');
  }
  function openCubeUI(cubeId, t) {
    toolCss(); var CB = I.CUBES[cubeId], skin = CB.compare ? 'b' : 'r', M = CUBEUI[skin], P = 'assets/ui/cube/' + skin + '_';
    var ov = el('div', 'cu-ov'), box = el('div', 'cu-box'), W = el('div', 'cu'); W.style.width = M.w + 'px'; W.style.height = M.h + 'px'; box.appendChild(W); ov.appendChild(box); document.body.appendChild(ov);
    function fit() { var sc = Math.min(Math.max(SC, 1), (innerWidth - 8) / M.w, (innerHeight - 8) / M.h); W.style.transform = 'scale(' + sc + ')'; box.style.width = M.w * sc + 'px'; box.style.height = M.h * sc + 'px'; }
    fit(); addEventListener('resize', fit);
    function im(src, x, y) { var i = el('img'); i.src = src; i.draggable = false; i.style.left = x + 'px'; i.style.top = y + 'px'; W.appendChild(i); return i; }
    im(P + 'base.png', 0, -1);
    var fx = im(P + 'n0.png', M.n[0][0], M.n[0][1]);
    var item = I.idOf(getT(t)), ic = im('assets/item/' + ((I.ITEMS[item] || {}).icon || item) + '.png', 82, 98); ic.style.maxWidth = '32px'; ic.style.maxHeight = '32px';
    function txt(x, y, w, h) { var d = el('div', 'tx'); d.style.cssText += ';left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px'; W.appendChild(d); return d; }
    var btns = {};   // botones: sprite por estado + zona de clic
    function btn(name, r, hit, fn) {
      var i = im(P + name + '_normal.png', r[0], r[1]), h = el('div', 'hit'); h.style.cssText += ';left:' + hit[0] + 'px;top:' + hit[1] + 'px;width:' + hit[2] + 'px;height:' + hit[3] + 'px'; W.appendChild(h);
      var b = { i: i, h: h, name: name, on: true, over: false, down: false };
      b.paint = function () { i.src = P + name + '_' + (!b.on ? 'disabled' : b.down ? 'pressed' : b.over ? 'mouseOver' : 'normal') + '.png'; h.className = 'hit' + (b.on ? '' : ' off'); };
      h.addEventListener('pointerenter', function () { b.over = true; b.paint(); }); h.addEventListener('pointerleave', function () { b.over = b.down = false; b.paint(); });
      h.addEventListener('pointerdown', function () { if (b.on) { b.down = true; b.paint(); } });
      h.addEventListener('click', function () { b.down = false; b.paint(); if (b.on) fn(); });
      btns[name] = b; return b;
    }
    var pend = null, anim = null, idle = 0, closed = false, tBefore, tAfter, tRes;
    if (skin === 'b') {
      var B = M.before, A2 = M.after;
      btn('before', B, [B[0] + 126, B[1] + 2, 44, 16], function () { finish(false); });
      btn('after', A2, [A2[0] + 126, A2[1] + 2, 44, 16], function () { finish(true); });
      btn('more', M.more, M.more, function () { roll(); });
      tBefore = txt(B[0] + 5, B[1] + 22, 166, 56); tAfter = txt(A2[0] + 5, A2[1] + 22, 166, 56);
    } else {
      btn('ok', M.ok, M.ok, function () { close(); });
      btn('more', M.more, M.more, function () { roll(); });
      tRes = txt(15, 173, 166, 56);
    }
    function paint() {
      var busy = !!anim, n = I.countItem(world.inv, cubeId);
      if (skin === 'b') {
        tBefore.innerHTML = busy ? '' : potHtml(getT(t)); tAfter.innerHTML = busy || !pend ? '' : potHtml(pend);
        btns.before.on = !busy; btns.after.on = !busy && !!pend; btns.before.i.style.display = btns.after.i.style.display = '';
      } else { tRes.innerHTML = busy ? '' : potHtml(getT(t)); btns.ok.on = !busy; }
      btns.more.on = !busy && n > 0 && I.cubeCheck(cubeId, getT(t)); btns.more.h.title = 'Cubos restantes: ' + n;
      for (var k in btns) btns[k].paint();
    }
    function place(kind, i) { var o = M[kind][i]; fx.style.left = o[0] + 'px'; fx.style.top = o[1] + 'px'; fx.src = P + kind + i + '.png'; }
    var tm = setInterval(function () {
      if (closed) return;
      if (anim) { anim.f++; if (anim.f >= 12) { anim = null; idle = 0; place('n', 0); paint(); } else place(anim.k, anim.f); }
      else { idle = (idle + 1) % 12; if (idle % 1 === 0) place('n', idle); }
    }, 100);
    function roll() {
      var inst = getT(t); if (!inst || !I.removeItem(world.inv, cubeId, 1)) return;
      var res = I.cubeUse(inst, cubeId); if (!res) { I.addItem(world.inv, cubeId, 1); return; }
      if (CB.compare) pend = res.inst; else { putT(t, res.inst); G.save(); }
      anim = { k: res.up ? 'g' : 'u', f: 0 }; place(anim.k, 0); paint(); refreshAll();
    }
    function finish(takeNew) {
      if (takeNew && pend) { putT(t, pend); toast('Potencial nuevo aplicado.'); } else if (pend) toast('Conservaste el potencial actual.');
      pend = null; G.save(); close();
    }
    function close() { if (closed) return; closed = true; clearInterval(tm); ov.remove(); removeEventListener('keydown', onk, true); removeEventListener('resize', fit); G.save(); refreshAll(); }
    function onk(e) { if (e.key === 'Escape') { e.stopPropagation(); if (anim) return; if (skin === 'b') finish(false); else close(); } }
    addEventListener('keydown', onk, true);
    ov.addEventListener('pointerdown', function (e) { if (e.target === ov && !anim) { if (skin === 'b') finish(false); else close(); } });
    paint(); roll();
  }
  var tabImgs = {};
  function rowEl(parent, i, id, sub, onclick, selected, extra, onright, inst) {
    var it = I.ITEMS[id], r = el('div'); r.style.cssText = 'position:absolute;left:0;top:' + i * 42 + 'px;width:212px;height:35px;cursor:pointer';
    if (selected) { var sl = el('img'); sl.src = 'assets/ui2/shop_sel.png'; sl.style.cssText = 'position:absolute;left:36px;top:0;image-rendering:pixelated'; r.appendChild(sl); }
    var im = el('img'); im.src = ICON + ((I.ITEMS[id] || {}).icon || id) + '.png'; im.draggable = false; im.style.cssText = 'position:absolute;left:1px;top:2px;max-width:32px;max-height:32px;image-rendering:pixelated'; im.onerror = function () { im.remove(); r.insertAdjacentHTML('afterbegin', '<div style="position:absolute;left:3px;top:3px;width:30px;height:30px;background:#5a6b98;border-radius:3px"></div>'); };
    r.appendChild(im);
    var nm = el('div', '', it.name); nm.style.cssText = 'position:absolute;left:40px;top:2px;width:158px;font:bold 11px Tahoma,Arial;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; r.appendChild(nm);
    var sb = el('div', '', sub); sb.style.cssText = 'position:absolute;left:40px;top:19px;font:10px Tahoma,Arial;color:#345;white-space:nowrap'; r.appendChild(sb);
    if (extra) { var nn = el('span', 'mw-n'); nn.style.left = '1px'; nn.style.bottom = '1px'; String(extra).replace(/\D/g, '').split('').forEach(function (d) { var di = el('img'); di.src = 'assets/ui2/no/' + d + '.png'; di.draggable = false; nn.appendChild(di); }); r.appendChild(nn); }
    r.addEventListener('click', onclick); if (onright) r.addEventListener('contextmenu', function (e) { e.preventDefault(); hideTip(); onright(); }); r.addEventListener('mouseenter', function (e) { showTip(e, tipOf(id, inst)); }); r.addEventListener('mousemove', function (e) { showTip(e, tipOf(id, inst)); }); r.addEventListener('mouseleave', hideTip); parent.appendChild(r);
  }
  function priceTxt(e) { return e.currency ? e.price + ' × ' + I.ITEMS[e.currency].name : fm(e.price) + ' mesos'; }
  function doBuy() {
    if (hsel === null) return toast('Elige un objeto de la lista de la izquierda');
    var e = I.SHOP[hsel], it = I.ITEMS[e.id], have = e.currency ? I.countItem(world.inv, e.currency) : world.mesos, max = Math.min(999, Math.floor(have / e.price));
    if (max < 1) return toast(e.currency ? 'No tienes suficientes ' + I.ITEMS[e.currency].name : 'No tienes suficientes mesos');
    askQty('Comprar ' + it.name + ' (' + priceTxt(e) + ' c/u)', max, function (n) {
      if (!I.canAdd(world.inv, e.id, n)) return toast('Inventario lleno');
      if (e.currency) I.removeItem(world.inv, e.currency, e.price * n); else world.mesos -= e.price * n;
      I.addItem(world.inv, e.id, n); toast('Comprado: ' + it.name + ' ×' + n); G.save(); hsig = ''; HW.refresh(); IW.refresh();
    });
  }
  function doSell() {
    if (!hrow) return toast('Elige un objeto de tu inventario (lista de la derecha)');
    var r = hrow, it = I.ITEMS[r.id], cnt = r.kind === 'equip' ? 1 : I.countItem(world.inv, r.id);
    function fin(n) {
      if (r.kind === 'equip') world.inv.equip[r.idx] = null; else I.removeItem(world.inv, r.id, n);
      world.mesos += it.sell * n; toast('Vendido: ' + it.name + (n > 1 ? ' ×' + n : '') + '  +' + fm(it.sell * n) + ' mesos'); hrow = null; G.save(); hsig = ''; HW.refresh(); IW.refresh();
    }
    if (cnt > 1) askQty('Vender ' + it.name + ' (' + it.sell + ' mesos c/u)', cnt, fin); else fin(1);
  }
  // venta rápida (clic derecho): equipo = 1 pieza; objeto USE = toda la pila
  function quickSell(r) {
    var it = I.ITEMS[r.id], n = r.kind === 'equip' ? 1 : I.countItem(world.inv, r.id); if (!n) return;
    if (r.kind === 'equip') world.inv.equip[r.idx] = null; else I.removeItem(world.inv, r.id, n);
    world.mesos += (it.sell || 0) * n; toast('Vendido: ' + it.name + (n > 1 ? ' ×' + n : '') + '  +' + fm((it.sell || 0) * n) + ' mesos'); if (hrow && hrow.id === r.id) hrow = null; G.save(); hsig = ''; HW.refresh(); IW.refresh();
  }
  function sellAllTab() {
    var items = [], total = 0;
    if (htab === 'equip') world.inv.equip.forEach(function (inst, idx) { if (inst) items.push({ id: I.idOf(inst), inst: inst, idx: idx, kind: 'equip' }); });
    else world.inv.use.forEach(function (sl, idx) { if (sl && sl.id !== 'red_potion' && sl.id !== 'blue_potion' && !items.some(function (x) { return x.id === sl.id; })) items.push({ id: sl.id, idx: idx, kind: 'use' }); });
    if (!items.length) return toast(htab === 'equip' ? 'No hay equipo para vender' : 'No hay objetos para vender (las pociones no se venden en bloque)');
    items.forEach(function (r) { total += (I.ITEMS[r.id].sell || 0) * (r.kind === 'equip' ? 1 : I.countItem(world.inv, r.id)); });
    if (!confirm('¿Vender TODO ' + (htab === 'equip' ? 'el equipo del inventario' : 'lo de la pestaña USE (menos pociones)') + ' por ' + fm(total) + ' mesos?')) return;
    items.forEach(function (r) { if (r.kind === 'equip') world.inv.equip[r.idx] = null; else I.removeItem(world.inv, r.id, I.countItem(world.inv, r.id)); });
    world.mesos += total; hrow = null; toast('Vendido todo: +' + fm(total) + ' mesos'); G.save(); hsig = ''; HW.refresh(); IW.refresh();
  }
  var SHOPCATS = {
    consumable: { name: 'Consumibles', note: 'Pociones y otros consumibles, a cambio de mesos.', icon: function () { return ICON + ((I.ITEMS.red_potion || {}).icon || 'red_potion') + '.png'; } },
    scroll: { name: 'Scrolls', note: 'Canjea Scroll Pieces por scrolls de equipo.', icon: function () { var k = Object.keys(I.ITEMS).filter(function (i) { return I.ITEMS[i].scroll; })[0]; return k && ICON + (I.ITEMS[k].icon || k) + '.png'; } },
    enhance: { name: 'Enhance', note: 'Cubos para reiniciar el potencial del equipo.', icon: function () { return ICON + ((I.ITEMS.cube_miracle || {}).icon || 'cube_miracle') + '.png'; } }
  };
  function shopCat(e) { return e.cat || (I.ITEMS[e.id] && I.ITEMS[e.id].scroll ? 'scroll' : /^cube_/.test(e.id) ? 'enhance' : 'consumable'); }
  // menú de categorías de la tienda (T): 3 tarjetas; fáciles de reemplazar por botones con tu arte
  var SM = { id: 'shopmenu', open: false, t: 0 };
  (function () {
    var o = el('div'); o.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);display:none;z-index:70;background:rgba(14,18,34,.96);border:1px solid #556;border-radius:10px;padding:14px 16px 16px;box-shadow:0 8px 30px #000a;font-family:Tahoma,Arial,sans-serif';
    var hd = el('div', '', 'Tienda'); hd.style.cssText = 'color:#fff;font:bold 14px Tahoma,Arial;margin-bottom:10px;display:flex;justify-content:space-between'; var xx = el('span', '', '✕'); xx.style.cssText = 'cursor:pointer;color:#aab'; xx.addEventListener('click', function () { SM.set(false); }); hd.appendChild(xx); o.appendChild(hd);
    var row = el('div'); row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center'; o.appendChild(row);
    Object.keys(SHOPCATS).forEach(function (k) {
      var c = el('div'); c.style.cssText = 'width:118px;padding:12px 8px;border:1px solid #445;border-radius:8px;background:#1b2140;text-align:center;cursor:pointer;color:#fff'; c.dataset.cat = k;
      var ic = el('img'); ic.style.cssText = 'width:32px;height:32px;image-rendering:pixelated;display:block;margin:0 auto 8px'; ic.draggable = false; c._ic = ic; c.appendChild(ic);
      c.appendChild(el('div', '', SHOPCATS[k].name)); c.firstChild.nextSibling.style.cssText = 'font:bold 13px Tahoma,Arial'; var nt = el('div', '', SHOPCATS[k].note); nt.style.cssText = 'font:10px Tahoma,Arial;color:#aab;margin-top:4px;line-height:1.3'; c.appendChild(nt);
      c.addEventListener('mouseenter', function () { c.style.background = '#2a3466'; }); c.addEventListener('mouseleave', function () { c.style.background = '#1b2140'; });
      c.addEventListener('click', function () { hcat = k; hsel = null; hsig = ''; SM.set(false); HW.set(true); }); row.appendChild(c);
    });
    document.body.appendChild(o); SM.root = o;
    SM.set = function (v) { SM.open = v; if (v) { SM.t = performance.now(); o.style.zIndex = ++z; Array.prototype.forEach.call(row.children, function (c) { var src = SHOPCATS[c.dataset.cat].icon(); if (src) c._ic.src = src; }); } o.style.display = v ? 'block' : 'none'; };
  })();
  function shopToggle() { if (HW.open) HW.set(false); else SM.set(!SM.open); }
  HW.refresh = function (force) {
    if (!HW.open) return;
    var s = JSON.stringify([world.inv, world.mesos, hsel, hrow && hrow.id + hrow.idx, htab, hcat]);
    if (!force && s === hsig) return; hsig = s;
    var kl = hL.scrollTop, kr = hR.scrollTop; hL.innerHTML = ''; hR.innerHTML = '';
    var CATI = SHOPCATS[hcat]; hcap.textContent = CATI.name; hnote.textContent = CATI.note;
    var shown = [];   // la lista de compra solo muestra la categoría elegida; hsel sigue siendo el índice en I.SHOP
    I.SHOP.forEach(function (e, i) { if (shopCat(e) === hcat) shown.push([e, i]); });
    shown.forEach(function (x, k) { var e = x[0], i = x[1]; rowEl(hL, k, e.id, priceTxt(e), function () { hsel = i; hsig = ''; HW.refresh(); }, hsel === i); });
    var list = [];
    if (htab === 'equip') world.inv.equip.forEach(function (inst, idx) { if (inst) list.push({ id: I.idOf(inst), inst: inst, idx: idx, kind: 'equip' }); });
    else world.inv.use.forEach(function (sl, idx) { if (sl && !list.some(function (x) { return x.id === sl.id; })) list.push({ id: sl.id, idx: idx, kind: 'use' }); });
    list.forEach(function (r, i) { rowEl(hR, i, r.id, (I.ITEMS[r.id].sell || 0) + ' mesos', function () { hrow = r; hsig = ''; HW.refresh(); }, hrow && hrow.id === r.id && hrow.idx === r.idx, r.kind === 'use' ? '×' + I.countItem(world.inv, r.id) : '', function () { quickSell(r); }, r.inst); });
    var h1 = el('div'); h1.style.cssText = 'height:' + Math.max(210, shown.length * 42) + 'px;width:1px'; hL.appendChild(h1);
    var h2 = el('div'); h2.style.cssText = 'height:' + Math.max(210, list.length * 42) + 'px;width:1px'; hR.appendChild(h2);
    hL.scrollTop = kl; hR.scrollTop = kr;
    HW.inn.querySelectorAll('[data-t]').forEach(function (b) { var on = b.dataset.t === htab; b.style.top = (on ? 91 : 93) + 'px'; b.innerHTML = ''; var im = el('img'); im.src = 'assets/ui2/shop_tab' + b.dataset.k + (on ? '_on' : '_off') + '.png'; im.draggable = false; im.style.cssText = 'display:block;image-rendering:pixelated'; b.appendChild(im); });
    hmeso.textContent = fm(world.mesos);
    hbuy.setEnabled(hsel !== null); hsell.setEnabled(!!hrow);
  };

  /* ---------- barra de botones y teclas ---------- */
  /* ---------- menú hamburguesa (3x3 con iconos) ---------- */
  var oldBtns = [].slice.call(document.querySelectorAll('.wm-btn, .mi-btn'));   // Mapa, Pociones y Personajes (sus módulos los crean): se ocultan y el menú los acciona
  oldBtns.forEach(function (b) { b.style.display = 'none'; });
  function oldBtn(re) { return oldBtns.filter(function (b) { return re.test(b.textContent); })[0]; }
  var mcss = document.createElement('style');
  mcss.textContent =
    '#mc-hb{position:fixed;top:10px;right:10px;z-index:11;width:46px;height:46px;border:2px solid #cfd8ee;border-radius:5px;background:#16213f;cursor:pointer;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,.6)}' +
    '#mc-hb span{display:block;width:26px;height:3px;background:#fff;border-radius:1px}#mc-hb.on{background:#26376b}' +
    '#mc-menu{position:fixed;top:64px;right:10px;z-index:11;display:none;flex-direction:column;gap:0;width:190px;padding:0;overflow:hidden;background:#0b1226;border:2px solid #5b7bb5;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.75)}' +
    '#mc-menu.on{display:flex}#mc-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:5px 12px;background:transparent;border:0;border-bottom:1px solid #26365e;border-radius:0;color:#b9c4dc;cursor:pointer;font:bold 13px Tahoma,Arial;text-align:left}#mc-menu button:last-child{border-bottom:0}' +
    '#mc-menu button:hover,#mc-menu button:active{background:#12315a;color:#fff}#mc-menu img{width:26px;height:26px;image-rendering:pixelated;pointer-events:none;flex:none}' +
    '#mc-menu button.on{background:#0d4a7a;color:#fff}#mc-menu button i{margin-left:auto;font:normal 11px Tahoma,Arial;color:#6f7f9f}#mc-menu button hr{display:none}' +
    '.wm-win,.mi-win{box-sizing:border-box}' +
    'body.zone-draw #mc-hb,body.zone-draw #mc-close,body.zone-draw #mc-menu,body.zone-draw #mc-set,body.zone-draw .mw,body.zone-draw .wm-win,body.zone-draw .mi-win,body.zone-draw .mc-list,body.zone-draw #mw-tip{display:none !important}' +
    '#mc-close{position:fixed;top:10px;right:68px;z-index:2147482500;display:none;width:46px;height:46px;border:2px solid #cfd8ee;border-radius:5px;background:#7a2430;color:#fff;font:bold 22px Arial;cursor:pointer;padding:0;box-shadow:0 2px 8px rgba(0,0,0,.6)}' +
    '@media (max-width:700px){#mc-close.on{display:block}#mc-close{width:52px;height:52px;right:72px}#mc-hb{width:52px;height:52px}#mc-menu{top:70px;width:min(250px,calc(100vw - 20px))}#mc-menu button{padding:9px 12px;font-size:15px}#mc-menu img{width:32px;height:32px}#mc-menu button i{display:none}}' +
    '#mc-set{position:fixed;top:64px;right:10px;z-index:12;display:none;min-width:240px;padding:12px 14px;background:#f4f1e6;border:2px solid #6b7da8;border-radius:6px;font:12px Tahoma,Arial;color:#222;box-shadow:0 4px 16px rgba(0,0,0,.6)}#mc-set.on{display:block}' +
    '#mc-set h4{margin:0 0 8px;font-size:13px}#mc-set label{display:block;margin:6px 0;cursor:pointer}#mc-set button{margin-top:8px;padding:6px 12px;font:bold 12px Tahoma,Arial;border:1px solid #333;border-radius:4px;color:#fff;background:#c0392b;cursor:pointer}';
  document.head.appendChild(mcss);
  var hb = el('button'); hb.id = 'mc-hb'; hb.title = 'Menú'; hb.innerHTML = '<span></span><span></span><span></span>'; document.body.appendChild(hb);
  var menu = el('div'); menu.id = 'mc-menu'; document.body.appendChild(menu);
  var setp = el('div'); setp.id = 'mc-set'; document.body.appendChild(setp);
  function menuOpen(v) { menu.classList.toggle('on', v); hb.classList.toggle('on', v); if (v) setp.classList.remove('on'); }
  function setOpen(v) { setp.classList.toggle('on', v); if (v) menuOpen(false); }
  function viaOld(re) { return function () { var b = oldBtn(re); if (b) b.click(); }; }
  var ENTRIES = [['Personajes', 'char', viaOld(/Personajes/), 'C'], ['Inventario', 'items', function () { IW.toggle(); }, 'I'], ['Tienda', 'shop', function () { shopToggle(); }, 'T'],
    ['Equip', 'equips', function () { EW.toggle(); }, 'E'], ['Stat', 'stats', function () { SW.toggle(); }, 'S'], ['Skill', 'skills', function () { KW.toggle(); }, 'K'],
    ['Mapa', 'maps', viaOld(/Mapa/), 'M'], ['Pociones', 'pots', viaOld(/Pociones/), 'P'], ['Ajustes', 'settings', function () { setOpen(true); }, '']];
  ENTRIES.forEach(function (en) {
    var b = el('button'); b.title = en[0]; var im = el('img'); im.src = 'assets/ui/menu/' + en[1] + '.png'; b.appendChild(im); b.appendChild(el('span', '', en[0])); if (en[3]) b.appendChild(el('i', '', en[3]));
    b.addEventListener('click', function (e) { e.stopPropagation(); en[2](); if (en[0] !== 'Ajustes') menuOpen(false); }); menu.appendChild(b);
  });
  hb.addEventListener('click', function (e) { e.stopPropagation(); setp.classList.remove('on'); menuOpen(!menu.classList.contains('on')); });
  document.addEventListener('pointerdown', function (e) { if (!menu.contains(e.target) && !hb.contains(e.target)) menuOpen(false); if (!setp.contains(e.target) && !hb.contains(e.target) && !menu.contains(e.target)) setp.classList.remove('on'); }, true);
  // Esc: cierra primero el menú/ajustes y luego, de uno en uno, la ventana abierta más reciente (Mapa, Pociones, Personajes, Equip, Inventario, Stat, Skill, Tienda)
  // cierra lo último que se abrió: primero menú/ajustes, luego la ventana o panel más reciente; devuelve false si no había nada
  function closeTop() {
    if (menu.classList.contains('on') || setp.classList.contains('on')) { menuOpen(false); setp.classList.remove('on'); return true; }
    var best = null, bt = -1;
    [IW, EW, SW, KW, HW, SM].forEach(function (W) { if (W.open && (W.t || 0) >= bt) { bt = W.t || 0; best = function () { W.set(false); }; } });
    var P = window.MAPLE_PANELS || {}; Object.keys(P).forEach(function (k) { if (P[k].isOpen() && (P[k].t || 0) >= bt) { bt = P[k].t || 0; best = function () { P[k].close(); }; } });
    if (best) { best(); return true; }
    return false;
  }
  addEventListener('keydown', function (e) {
    if (e.code !== 'Escape' || e.repeat || (G.zoneDrawing && G.zoneDrawing()) || resetOpen) return;
    closeTop();
  });
  // botón ✕ flotante (sólo móvil): cierra la ventana o panel abierto más reciente, junto al botón del menú
  var cx = el('button', '', '✕'); cx.id = 'mc-close'; document.body.appendChild(cx);
  cx.addEventListener('click', function (e) { e.stopPropagation(); closeTop(); });
  function anyOpen() { var P = window.MAPLE_PANELS || {}; return [IW, EW, SW, KW, HW, SM].some(function (W) { return W.open; }) || Object.keys(P).some(function (k) { return P[k].isOpen(); }); }
  setInterval(function () { cx.classList.toggle('on', anyOpen()); }, 150);
  // Ajustes: zonas de farmeo y reinicio de partida
  setp.appendChild(el('h4', '', 'Ajustes'));
  var zl = el('label'), zc = document.createElement('input'); zc.type = 'checkbox'; zc.checked = G.showZones(); zc.addEventListener('change', function () { G.showZones(zc.checked); }); zl.appendChild(zc); zl.appendChild(document.createTextNode(' Mostrar zonas de farmeo')); setp.appendChild(zl);
  var rb = el('button', '', 'Reiniciar partida…'); rb.addEventListener('click', function () { setp.classList.remove('on'); askReset(); }); setp.appendChild(rb);
  // Reiniciar partida: tecla | (a la izquierda del 1) -> ventana de confirmación
  var resetOpen = null;
  function askReset() {
    if (resetOpen) return;
    var ov = el('div'); ov.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:2147482000;display:flex;align-items:center;justify-content:center';
    var bx = el('div'); bx.style.cssText = 'background:#f4f1e6;border:2px solid #6b7da8;border-radius:6px;padding:16px 20px;font:12px Tahoma,Arial;color:#222;text-align:center;box-shadow:0 4px 18px rgba(0,0,0,.6);min-width:240px';
    var t = el('div', '', '¿Quieres reiniciar la partida?'); t.style.cssText = 'font-weight:bold;font-size:13px;margin-bottom:6px';
    var d = el('div', '', 'Se borrarán personajes, inventario y mesos.'); d.style.cssText = 'color:#555;margin-bottom:12px';
    function btn(txt, bg) { var b = el('button', '', txt); b.style.cssText = 'margin:0 6px;padding:5px 22px;font:bold 12px Tahoma,Arial;border:1px solid #333;border-radius:4px;cursor:pointer;color:#fff;background:' + bg; return b; }
    var yes = btn('Sí', '#c0392b'), no = btn('No', '#4a6fa5');
    function close() { resetOpen = null; ov.remove(); removeEventListener('keydown', onKey, true); }
    function onKey(e) { if (e.code === 'Escape' || e.code === 'KeyN') { e.preventDefault(); e.stopPropagation(); close(); } else if (e.code === 'Enter' || e.code === 'KeyY') { e.preventDefault(); G.reset(); } }
    yes.addEventListener('click', function () { G.reset(); }); no.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    bx.appendChild(t); bx.appendChild(d); bx.appendChild(yes); bx.appendChild(no); ov.appendChild(bx); document.body.appendChild(ov);
    addEventListener('keydown', onKey, true); resetOpen = ov; no.focus();
  }
  addEventListener('keydown', function (e) {
    if (e.repeat || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '') || (G.isDebug && G.isDebug())) return;
    if (e.code === 'Backquote' || e.key === '|') { e.preventDefault(); askReset(); return; }
    if (e.code === 'KeyI') IW.toggle(); else if (e.code === 'KeyE') EW.toggle(); else if (e.code === 'KeyS') SW.toggle(); else if (e.code === 'KeyK') KW.toggle(); else if (e.code === 'KeyT') shopToggle();
  });
  setInterval(function () { IW.refresh(); EW.refresh(); SW.refresh(); KW.refresh(); HW.refresh(); }, 300);
})();
