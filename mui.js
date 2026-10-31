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
    '.mw-n{position:absolute;right:1px;bottom:0;font:bold 10px Arial;color:#fff;text-shadow:1px 0 #000,-1px 0 #000,0 1px #000,0 -1px #000;pointer-events:none}' +
    '.mw-tab{position:absolute;top:26px;height:14px;border-radius:3px 3px 0 0;cursor:pointer;background:#9aa6b6;display:flex;align-items:center;justify-content:center}.mw-tab.on{background:linear-gradient(#5b86b8,#3f6794)}' +
    '.mw-tab img{image-rendering:pixelated}.mw-view{position:absolute;left:8px;top:50px;width:148px;height:202px;overflow-y:scroll;scrollbar-width:none}.mw-view::-webkit-scrollbar{display:none}' +
    '.mw-sbar{position:absolute;left:158px;top:50px;width:9px;height:202px;background:rgba(80,100,130,.18);border-radius:4px}.mw-thumb{position:absolute;left:0;width:9px;border-radius:4px;background:linear-gradient(90deg,#6f8fb8,#46689a);cursor:pointer}' +
    '.mw-meso{position:absolute;left:28px;top:268px;width:108px;height:13px;text-align:right;font:bold 11px Tahoma,Arial;line-height:13px;color:#222}' +
    '.mw-name{position:absolute;left:10px;top:272px;font:bold 10px Arial;color:#2d4565}' +
    '#mw-tip{position:fixed;z-index:2147483000;display:none;pointer-events:none;max-width:260px;background:rgba(24,31,62,.97);border:1px solid #dfe6ff;border-radius:4px;box-shadow:0 0 0 1px #0a0f24;color:#fff;font:12px Tahoma,Arial,sans-serif;padding:6px 8px;line-height:1.45}' +
    '.tt{min-width:214px;image-rendering:pixelated}.tt-name{font:bold 12px Tahoma,Arial;text-align:center;color:#fff;padding:2px 0 6px}.tt-sep{border-top:1px dotted #7d8ac0;margin:5px 0}' +
    '.tt-row{display:flex;gap:8px;align-items:flex-start}.tt-icon{width:66px;height:66px;flex:none;border-radius:6px;background:radial-gradient(#4a5aa8,#262f63);border:1px solid #6c7abf;display:flex;align-items:center;justify-content:center}.tt-icon img{width:64px;height:64px;object-fit:contain;image-rendering:pixelated}' +
    '.tt-reqs{display:flex;flex-direction:column;gap:5px;padding-top:2px}.tt-req{height:7px;display:flex;align-items:center;gap:1px;white-space:nowrap}.tt-req img,.tt-jobs img,.tt-line img{image-rendering:pixelated;vertical-align:middle}' +
    '.tt-jobs{display:flex;gap:2px;flex-wrap:wrap;margin-top:6px}.tt-line{font:11px Tahoma,Arial;color:#fff;margin:2px 0;white-space:nowrap}.tt-txt{font:bold 10px Tahoma,Arial;color:#fff}.tt-desc{font:11px Tahoma,Arial;color:#fff;max-width:170px}' +
    '#mw-tip b{color:#ffe9a8}#mw-toast{position:fixed;left:50%;top:60px;transform:translateX(-50%);z-index:70;background:rgba(14,18,34,.92);color:#fff;border:1px solid #8a96c8;border-radius:6px;padding:6px 12px;font:13px sans-serif;display:none;pointer-events:none}';
  document.head.appendChild(css);
  tipEl = el('div'); tipEl.id = 'mw-tip'; toastEl = el('div'); toastEl.id = 'mw-toast'; document.body.appendChild(tipEl); document.body.appendChild(toastEl);
  function toast(t) { toastEl.textContent = t; toastEl.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(function () { toastEl.style.display = 'none'; }, 1800); }
  function showTip(e, html) { tipEl.innerHTML = html; tipEl.style.display = 'block'; var x = Math.min(innerWidth - tipEl.offsetWidth - 6, e.clientX + 14), y = Math.min(innerHeight - tipEl.offsetHeight - 6, e.clientY + 14); tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; }
  function hideTip() { tipEl.style.display = 'none'; }
  var NAMES = { str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK', att: 'ATT', matt: 'MATT', def: 'DEF', mdef: 'MDEF', mhp: 'HP', mmp: 'MP', acc: 'ACC', eva: 'AVOID', speed: 'Speed', jump: 'Jump' };
  var SORT = ['att', 'matt', 'str', 'dex', 'int', 'luk', 'def', 'mdef', 'mhp', 'mmp', 'acc', 'eva', 'speed', 'jump'];
  /* Tooltip de ítem al estilo MapleStory: etiquetas pixeladas reales de UIWindow.img/ToolTip (REQ LEV, clases, categorías) + marco azul oscuro.
     (El marco original está en UIToolTip.img, que no tenemos: se imita con CSS.) */
  var TT = 'assets/ui/tt/', JOBS = ['beginner', 'warrior', 'magician', 'bowman', 'thief', 'pirate'], JOBCLS = { warrior: 'warrior', mage: 'magician', archer: 'bowman', thief: 'thief', pirate: 'pirate' };
  var ICAT = { 100: 1, 101: 2, 102: 3, 103: 4, 104: 5, 105: 21, 106: 6, 107: 7, 108: 8, 109: 10, 110: 9, 111: 12 };
  var STATTXT = { str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK', att: 'WEAPON ATTACK', matt: 'MAGIC ATTACK', def: 'WEAPON DEFENSE', mdef: 'MAGIC DEFENSE', mhp: 'MaxHP', mmp: 'MaxMP', acc: 'ACCURACY', eva: 'AVOIDABILITY', speed: 'SPEED', jump: 'JUMP' };
  function ttImg(n) { return '<img src="' + TT + n + '.png" draggable="false">'; }
  function ttNum(v, ok) { return String(v).split('').map(function (d) { return ttImg((ok ? 'can_' : 'cant_') + d); }).join(''); }
  function tipOf(id) {
    var it = I.ITEMS[id]; if (!it) return '';
    var ic = '<div class="tt-icon"><img src="assets/item/' + id + '.png" draggable="false" onerror="this.style.display=\'none\'"></div>';
    if (it.kind === 'use') return '<div class="tt"><div class="tt-name">' + it.name + '</div><div class="tt-sep"></div><div class="tt-row">' + ic + '<div class="tt-desc">' + it.desc + '</div></div></div>';
    var ch = world.chars[world.selected], base = I.calcStats(ch.stats.level, {}, ch.cls), lv = ch.stats.level;
    var reqs = [['LEV', it.lv, lv >= it.lv], ['STR', it.req[0], base.str >= it.req[0]], ['DEX', it.req[1], base.dex >= it.req[1]], ['INT', it.req[2], base.int >= it.req[2]], ['LUK', it.req[3], base.luk >= it.req[3]]];
    var rq = reqs.map(function (r) { return '<div class="tt-req">' + ttImg((r[2] ? 'can_req' : 'cant_req') + r[0]) + ttNum(r[1], r[2]) + '</div>'; }).join('');
    var jobs = JOBS.map(function (j) { var ok = !it.cls || JOBCLS[it.cls] === j || (j === 'beginner' && false); return ttImg((ok ? 'can_' : 'can0_') + j); }).join('');
    var pre = Math.floor(+id / 10000), cat = '';
    if (it.type === 'weapon') cat = '<img src="' + TT + 'wc_' + (pre - 100) + '.png" onerror="this.outerHTML=\'<span class=tt-txt>' + (pre === 148 ? 'KNUCKLER' : 'WEAPON') + '</span>\'" draggable="false">';
    else cat = ttImg('ic_' + (ICAT[pre] || 1));
    var lines = SORT.filter(function (k) { return it.stats[k]; }).map(function (k) { return '<div class="tt-line">' + STATTXT[k] + ' : +' + it.stats[k] + '</div>'; }).join('');
    var spd = it.type === 'weapon' && it.speed >= 2 && it.speed <= 8 ? '<div class="tt-line">ATTACK SPEED : ' + ttImg('sp_' + (it.speed - 2)) + '</div>' : '';
    return '<div class="tt"><div class="tt-name">' + it.name + '</div><div class="tt-row">' + ic + '<div class="tt-reqs">' + rq + '</div></div><div class="tt-jobs">' + jobs + '</div><div class="tt-sep"></div>' +
      '<div class="tt-line">CATEGORY : ' + cat + (it.overall ? ' <span class="tt-txt">(Overall)</span>' : '') + '</div>' + spd + lines + (it.tuc ? '<div class="tt-line">UPGRADES AVAILABLE : ' + it.tuc + '</div>' : '') + '</div>';
  }

  // ventana arrastrable: w/h en px del sprite, bg = imagen de fondo
  function makeWin(id, bg, w, h, dx, dy) {
    var o = el('div', 'mw'), inn = el('div', 'mw-in'), img = el('img', 'mw-bg'); img.src = A + bg; img.draggable = false;
    inn.style.width = w + 'px'; inn.style.height = h + 'px'; inn.style.transform = 'scale(' + SC + ')';
    o.style.width = w * SC + 'px'; o.style.height = h * SC + 'px';
    var p = pos[id] || { x: dx, y: dy }; o.style.left = Math.max(0, Math.min(innerWidth - w * SC - 4, p.x)) + 'px'; o.style.top = Math.max(0, Math.min(innerHeight - Math.min(h * SC, innerHeight - 4), p.y)) + 'px';
    inn.appendChild(img); o.appendChild(inn); document.body.appendChild(o);
    var drag = el('div', 'mw-drag'), x = el('div', 'mw-x', '×'); inn.appendChild(drag); inn.appendChild(x);
    var W = { id: id, root: o, inn: inn, open: false };
    W.set = function (v) { W.open = v; o.style.display = v ? 'block' : 'none'; if (v) { o.style.zIndex = ++z; W.refresh && W.refresh(true); } };
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
  function cellEl(parent, x, y, id, count) {
    var c = el('div', 'mw-c'); c.style.left = x + 'px'; c.style.top = y + 'px';
    if (id) {
      var im = el('img'); im.src = ICON + id + '.png'; im.draggable = false; im.onerror = function () { im.remove(); c.style.cssText += ';background:linear-gradient(#8a9bc8,#5a6b98);border:1px solid #2d3a60;box-sizing:border-box;border-radius:3px;color:#fff;font:bold 8px Arial;text-align:center;line-height:1.1;overflow:hidden;word-break:break-all'; c.textContent = I.ITEMS[id].name.slice(0, 10); };
      c.appendChild(im);
      if (count > 1) c.appendChild(el('span', 'mw-n', String(count)));
      c.addEventListener('mouseenter', function (e) { showTip(e, tipOf(id)); }); c.addEventListener('mousemove', function (e) { showTip(e, tipOf(id)); }); c.addEventListener('mouseleave', hideTip);
    }
    parent.appendChild(c); return c;
  }

  /* ---------- Item Inventory (I) ---------- */
  var IW = makeWin('item', 'item_bg.png', 175, 289, X0, 46), tab = 'equip', view, thumb, bar, mesoEl, tabEls = {}, isig = '';
  (function () {
    var inn = IW.inn;
    [['equip', 0], ['use', 1]].forEach(function (t, i) {
      var b = el('div', 'mw-tab'); b.style.left = 10 + i * 46 + 'px'; b.style.width = '42px';
      var on = el('img'), off = el('img'); on.src = A + 'tab_on_' + t[1] + '.png'; off.src = A + 'tab_off_' + t[1] + '.png'; b.appendChild(on); tabEls[t[0]] = { b: b, on: on, off: off };
      b.addEventListener('click', function () { tab = t[0]; isig = ''; IW.refresh(); }); inn.appendChild(b);
    });
    view = el('div', 'mw-view'); bar = el('div', 'mw-sbar'); thumb = el('div', 'mw-thumb'); bar.appendChild(thumb);
    mesoEl = el('div', 'mw-meso');
    inn.appendChild(view); inn.appendChild(bar); inn.appendChild(mesoEl);
    function syncThumb() {
      var max = view.scrollHeight - view.clientHeight, h = Math.max(24, 202 * view.clientHeight / view.scrollHeight);
      thumb.style.height = h + 'px'; thumb.style.top = (max > 0 ? (202 - h) * view.scrollTop / max : 0) + 'px';
    }
    var ROW = 34, snapT = null;   // el fondo del inventario tiene la cuadrícula fija: el contenido se mueve de fila en fila para que siempre coincida con los cuadros
    function snap() { var t = Math.round(view.scrollTop / ROW) * ROW; if (Math.abs(t - view.scrollTop) > 0.5) view.scrollTop = t; }
    view.addEventListener('scroll', function () { syncThumb(); clearTimeout(snapT); snapT = setTimeout(snap, 90); });
    view.addEventListener('wheel', function (e) { e.preventDefault(); e.stopPropagation(); view.scrollTop = Math.round(view.scrollTop / ROW) * ROW + (e.deltaY > 0 ? ROW : -ROW); }, { passive: false });
    IW.syncThumb = syncThumb;
    var td = null;
    thumb.addEventListener('pointerdown', function (e) { td = { y: e.clientY, s: view.scrollTop }; thumb.setPointerCapture(e.pointerId); });
    thumb.addEventListener('pointermove', function (e) { if (!td) return; var max = view.scrollHeight - view.clientHeight, h = parseFloat(thumb.style.height); view.scrollTop = Math.round((td.s + (e.clientY - td.y) / SC * max / (202 - h)) / ROW) * ROW; });
    thumb.addEventListener('pointerup', function () { td = null; });
    bar.addEventListener('pointerdown', function (e) { if (e.target === bar) { var r = bar.getBoundingClientRect(); view.scrollTop = Math.round(((e.clientY - r.top) / r.height * view.scrollHeight - view.clientHeight / 2) / ROW) * ROW; } });
  })();
  IW.refresh = function (force) {
    if (!IW.open) return;
    var ch = world.chars[world.selected], s = JSON.stringify([tab, world.inv, world.equip, world.stats.level, ch.potions.hp.id, ch.potions.mp.id, world.mesos]);
    if (!force && s === isig) return; isig = s;
    for (var k in tabEls) { var on = k === tab; tabEls[k].b.className = 'mw-tab' + (on ? ' on' : ''); tabEls[k].b.innerHTML = ''; tabEls[k].b.appendChild(on ? tabEls[k].on : tabEls[k].off); }
    var keep = view.scrollTop; view.innerHTML = ''; var rows = Math.ceil(I.INV_SIZE / 4), full = el('div'); full.style.cssText = 'position:relative;height:' + rows * 34 + 'px';
    for (var i = 0; i < I.INV_SIZE; i++) (function (idx) {
      var x = 36 * (idx % 4), y = 34 * Math.floor(idx / 4), c;
      if (tab === 'equip') {
        var id = world.inv.equip[idx]; c = cellEl(full, x, y, id, 1);
        if (id) {
          c.addEventListener('click', function () { var r = I.equipItem(world.inv, world.equip, world.stats.level, idx, world.chars[world.selected].cls); toast(r.msg); G.save(); isig = ''; hideTip(); IW.refresh(); EW.refresh(true); });
          c.addEventListener('contextmenu', function (e) { e.preventDefault(); toast('Descartado: ' + I.ITEMS[id].name); world.inv.equip[idx] = null; G.save(); isig = ''; hideTip(); IW.refresh(); });
        }
      } else {
        var sl = world.inv.use[idx]; c = cellEl(full, x, y, sl && sl.id, sl ? sl.count : 0);
        if (sl) {
          c.addEventListener('click', function () {
            var it = I.ITEMS[sl.id], cc = world.chars[world.selected];
            if (it.heal) { var k2 = it.heal.hp ? 'hp' : 'mp'; cc.potions[k2].id = it.id; toast(it.name + ' asignada a ' + cc.name + ' (' + cc.potions[k2].pct + '% de ' + k2.toUpperCase() + ')'); G.save(); isig = ''; IW.refresh(); }
            else toast(it.name);
          });
          c.addEventListener('contextmenu', function (e) { e.preventDefault(); toast('Descartado: ' + I.ITEMS[sl.id].name + ' x' + sl.count); world.inv.use[idx] = null; G.save(); isig = ''; hideTip(); IW.refresh(); });
        }
      }
    })(i);
    view.appendChild(full); view.scrollTop = keep; mesoEl.textContent = String(Math.floor(world.mesos)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); IW.syncThumb();
  };

  /* ---------- Equipment Inventory (E) ---------- */
  var EW = makeWin('equip', 'equip_bg.png', 175, 291, X0 + 175 * SC + 16, 46);
  var SLOTPOS = { hat: [1, 0], top: [1, 3], bottom: [1, 4], glove: [0, 4], shoes: [2, 5], cape: [0, 3], ring1: [3, 1], ring2: [4, 1], ring3: [3, 4], ring4: [4, 4], earring: [3, 2], weapon: [3, 3], sub: [4, 3] };
  var esig = '', ename = el('div', 'mw-name'); EW.inn.appendChild(ename);
  EW.refresh = function (force) {
    if (!EW.open) return;
    var ch = world.chars[world.selected], s = JSON.stringify([world.equip, world.selected, ch.name]);
    if (!force && s === esig) return; esig = s;
    EW.inn.querySelectorAll('.mw-c').forEach(function (n) { n.remove(); });
    I.SLOTS.forEach(function (sl) {
      var p = SLOTPOS[sl], id = world.equip[sl], c = cellEl(EW.inn, 5 + 33 * p[0], 35 + 33 * p[1], id, 1);
      if (id) c.addEventListener('click', function () { var r = I.unequipSlot(world.inv, world.equip, sl); toast(r.ok ? 'Desequipado: ' + I.ITEMS[id].name : r.msg); G.save(); esig = ''; isig = ''; hideTip(); EW.refresh(); IW.refresh(); });
    });
    ename.textContent = ch.name + ' · Lv ' + world.stats.level;
  };
  EW.inn.style.overflow = 'visible'; ename.style.cssText = 'position:absolute;left:8px;top:274px;font:bold 10px Arial;color:#2d4565;width:120px;white-space:nowrap';

  /* ---------- Character Stat (S) ---------- */
  var SW = makeWin('stat', 'stat_bg.png', 175, 347, innerWidth - 352 * SC - 8, 46), ssig = '', sfields = {}, sdet = null, sdetOpen = false;
  (function () {
    var rows = { name: 40, job: 58, level: 86, guild: 104, hp: 122, mp: 140, exp: 158, fame: 176, ap: 222, str: 252, dex: 270, int: 288, luk: 306 };
    Object.keys(rows).forEach(function (k) {
      var f = el('div'); f.style.cssText = 'position:absolute;left:62px;top:' + (rows[k] - 7) + 'px;width:' + (k === 'ap' ? 26 : 101) + 'px;height:14px;line-height:14px;font:11px Tahoma,Arial;color:#222;white-space:nowrap;overflow:hidden;text-align:' + (k === 'ap' ? 'center' : 'right');
      if (k === 'ap') f.style.left = '62px'; SW.inn.appendChild(f); sfields[k] = f;
    });
    var bd = el('img'); bd.src = A + 'bt_detail.png'; bd.draggable = false; bd.style.cssText = 'position:absolute;left:122px;top:323px;cursor:pointer;image-rendering:pixelated'; SW.inn.appendChild(bd);
    sdet = el('div'); sdet.style.cssText = 'position:absolute;left:175px;top:0;width:177px;height:203px;display:none';
    var dbg = el('img', 'mw-bg'); dbg.src = A + 'stat_bg2.png'; sdet.appendChild(dbg); SW.inn.appendChild(sdet);
    ['atk', 'wdef', 'matk', 'mdef', 'acc', 'avoid', 'hands', 'speed', 'jump'].forEach(function (k, i) {
      var f = el('div'); f.style.cssText = 'position:absolute;left:62px;top:' + (i * 18 + 7) + 'px;width:107px;height:14px;line-height:14px;font:11px Tahoma,Arial;color:#222;text-align:right;white-space:nowrap'; sdet.appendChild(f); sfields[k] = f;
    });
    bd.addEventListener('click', function () { sdetOpen = !sdetOpen; sdet.style.display = sdetOpen ? 'block' : 'none'; });
  })();
  SW.refresh = function (force) {
    if (!SW.open) return;
    var ch = world.chars[world.selected], st = world.stats, t = I.calcStats(st.level, world.equip, ch.cls), need = S.expToNext(st.level), s = JSON.stringify([ch.name, st, world.equip, world.selected, sdetOpen]);
    if (!force && s === ssig) return; ssig = s;
    var pct = st.level >= S.MAX_LEVEL ? 100 : st.exp / need * 100;
    function setv(k, v) { sfields[k].textContent = v; }
    setv('name', ch.name); setv('job', I.CLASSES[ch.cls].label); setv('level', st.level); setv('guild', '-'); setv('hp', Math.ceil(st.hp) + ' / ' + st.maxHp); setv('mp', Math.floor(st.mp) + ' / ' + st.maxMp);
    setv('exp', st.level >= S.MAX_LEVEL ? 'MAX' : Math.floor(st.exp) + ' (' + pct.toFixed(1) + '%)'); setv('fame', 0); setv('ap', 0);
    ['str', 'dex', 'int', 'luk'].forEach(function (k) { setv(k, t[k]); });
    setv('atk', t.min + ' ~ ' + t.max); setv('wdef', t.def); setv('matk', t.int + t.matt); setv('mdef', t.mdef || 0); setv('acc', t.dex + t.acc); setv('avoid', t.eva); setv('hands', 0); setv('speed', '100%'); setv('jump', '100%');
  };

  /* ---------- Skill Inventory (K) ---------- */
  var KW = makeWin('skill', 'skill_bg.png', 175, 289, X0 + 60, 70), ksig = '', klist, kjob, ksp;
  (function () {
    var tb = el('div', 'mw-tab on'); tb.style.cssText += ';left:10px;width:30px'; var ti = el('img'); ti.src = A + 'sktab_on.png'; tb.appendChild(ti); KW.inn.appendChild(tb);
    kjob = el('div'); kjob.style.cssText = 'position:absolute;left:44px;top:64px;font:bold 11px Tahoma,Arial;color:#fff;white-space:nowrap'; KW.inn.appendChild(kjob);
    klist = el('div'); klist.style.cssText = 'position:absolute;left:8px;top:96px;width:150px;height:162px;overflow:hidden'; KW.inn.appendChild(klist);
    ksp = el('div'); ksp.style.cssText = 'position:absolute;left:83px;top:267px;width:30px;height:12px;text-align:center;font:bold 11px Tahoma,Arial;line-height:12px;color:#222'; KW.inn.appendChild(ksp);
  })();
  KW.refresh = function (force) {
    if (!KW.open) return;
    var SK = window.MapleSkills, s = JSON.stringify([world.selected, world.skills, world.stats.level]);
    if (!force && s === ksig) return; ksig = s;
    klist.innerHTML = ''; var cl = world.chars[world.selected].cls; kjob.textContent = I.CLASSES[cl].label + ' · 1st job'; ksp.textContent = SK.spAvailable(world);
    var mine = SK.ORDER.filter(function (id) { return !SK.SKILLS[id].cls || SK.SKILLS[id].cls === cl; });
    if (!mine.length) { var ne = el('div', '', 'Esta clase aún no tiene skills (Haste y más vendrán pronto).'); ne.style.cssText = 'font:11px Tahoma,Arial;color:#567;padding:8px'; klist.appendChild(ne); }
    mine.forEach(function (id, i) {
      var sk = SK.SKILLS[id], st = world.skills[id], lv = st.level, row = el('div'), canUp = SK.spAvailable(world) >= 1 && lv < sk.maxLevel;
      row.style.cssText = 'position:absolute;left:0;top:' + i * 35 + 'px;width:141px;height:35px;background:url(' + A + (i % 2 ? 'skill1' : 'skill0') + '.png)';
      var ic = el('img'); ic.src = sk.icon; ic.draggable = false; ic.style.cssText = 'position:absolute;left:2px;top:2px;width:32px;height:32px;image-rendering:pixelated' + (lv ? '' : ';filter:grayscale(1) opacity(.55)'); row.appendChild(ic);
      var nm = el('div', '', sk.name); nm.style.cssText = 'position:absolute;left:38px;top:4px;font:bold 10px Tahoma,Arial;color:#222;white-space:nowrap'; row.appendChild(nm);
      var lvl = el('div', '', 'Lv. ' + lv + ' / ' + sk.maxLevel); lvl.style.cssText = 'position:absolute;left:38px;top:17px;font:10px Tahoma,Arial;color:#444'; row.appendChild(lvl);
      var up = el('img'); up.src = A + 'spup_' + (canUp ? 'normal' : 'disabled') + '.png'; up.draggable = false; up.style.cssText = 'position:absolute;left:127px;top:5px;image-rendering:pixelated;cursor:' + (canUp ? 'pointer' : 'default'); row.appendChild(up);
      if (canUp) { up.addEventListener('mouseenter', function () { up.src = A + 'spup_mouseOver.png'; }); up.addEventListener('mouseleave', function () { up.src = A + 'spup_normal.png'; });
        up.addEventListener('click', function () { if (SK.learn(world, id)) { G.save(); ksig = ''; KW.refresh(); } }); }
      var lab = el('label'); lab.style.cssText = 'position:absolute;left:98px;top:21px;font:9px Tahoma,Arial;color:#335;cursor:pointer;white-space:nowrap'; var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!st.auto; cb.style.cssText = 'margin:0 2px 0 0;vertical-align:middle;width:9px;height:9px';
      cb.addEventListener('change', function () { st.auto = cb.checked; G.save(); }); lab.appendChild(cb); lab.appendChild(document.createTextNode('Auto')); row.appendChild(lab);
      row.addEventListener('mouseenter', function (e) { if (sk.buff) { showTip(e, '<b>' + sk.name + '</b> Lv. ' + lv + '<br>' + (lv > 0 ? 'Velocidad +' + Math.round(sk.speed(lv) * 100) + '% · ' + sk.duration(lv) + ' s · MP ' + sk.mpCon(lv) + '<br>' : '') + (lv < sk.maxLevel ? 'Siguiente: +' + Math.round(sk.speed(lv + 1) * 100) + '% · ' + sk.duration(lv + 1) + ' s · MP ' + sk.mpCon(lv + 1) + '<br>' : 'Nivel máximo<br>') + 'Buff para todo el party del mapa<br>Auto: la renueva sola antes de que expire (tecla H en manual)'); return; }
      showTip(e, '<b>' + sk.name + '</b> Lv. ' + lv + '<br>' + (lv > 0 ? 'Daño ' + sk.damage(lv) + '%' + (sk.attackCount > 1 ? ' × ' + sk.attackCount + ' golpes' : '') + ' · MP ' + sk.mpCon(lv) + '<br>' : '') + (lv < sk.maxLevel ? 'Siguiente: ' + sk.damage(lv + 1) + '% · MP ' + sk.mpCon(lv + 1) + '<br>' : 'Nivel máximo<br>') + (sk.ranged ? sk.bulletCount + ' estrellas a 1 enemigo al frente (' + sk.range.x2 + ' px), cada una pega ' + (lv > 0 ? sk.damage(lv) : sk.damage(1)) + '%' : 'Hasta ' + sk.mobCount + ' enemigos al frente') + '<br>Auto: la usa sola al atacar (tecla X en manual)'); });
      row.addEventListener('mousemove', function (e) { showTip(e, tipEl.innerHTML); }); row.addEventListener('mouseleave', hideTip);
      klist.appendChild(row);
    });
  };

  /* ---------- Tienda (T) ---------- */
  var HW = makeWin('shop', 'shop_bg.png', 463, 339, Math.max(0, (innerWidth - 463) / 2), 40), hsel = null, hrow = null, htab = 'equip', hsig = '', hbuy, hsell, hmeso, hL, hR;
  function bt(name, x, y, fn) {
    var b = el('img'); b.draggable = false; b.src = A + name + '_normal.png'; b.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;cursor:pointer;image-rendering:pixelated'; b.dataset.n = name;
    b.addEventListener('mouseenter', function () { if (!b.dataset.dis) b.src = A + name + '_mouseOver.png'; }); b.addEventListener('mouseleave', function () { b.src = A + name + (b.dataset.dis ? '_disabled' : '_normal') + '.png'; });
    b.addEventListener('pointerdown', function () { if (!b.dataset.dis) b.src = A + name + '_pressed.png'; }); b.addEventListener('click', function () { if (!b.dataset.dis) fn(); });
    b.setEnabled = function (v) { if (v) delete b.dataset.dis; else b.dataset.dis = '1'; b.src = A + name + (v ? '_normal' : '_disabled') + '.png'; b.style.cursor = v ? 'pointer' : 'default'; };
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
    var t1 = el('div', 'mw-tab on'), i1 = el('img'); i1.src = A + 'shop_tabbuy.png'; t1.style.cssText += ';left:10px;top:99px;width:44px'; t1.appendChild(i1); H.appendChild(t1);
    [['equip', 0], ['use', 1]].forEach(function (t, i) {
      var b = el('div', 'mw-tab'); b.style.cssText += ';left:' + (242 + i * 46) + 'px;top:99px;width:42px'; b.dataset.t = t[0]; H.appendChild(b);
      b.addEventListener('click', function () { htab = t[0]; hsel = null; hsig = ''; HW.refresh(); }); t[2] = b;
    });
    var cap = el('div', '', 'Tienda'); cap.style.cssText = 'position:absolute;left:12px;top:22px;font:bold 14px Tahoma,Arial;color:#345'; H.appendChild(cap);
    var nt = el('div', '', 'Compra pociones con mesos y canjea scroll pieces por scrolls.'); nt.style.cssText = 'position:absolute;left:12px;top:42px;width:200px;font:11px Tahoma,Arial;color:#456;line-height:1.4'; H.appendChild(nt);
    hL = el('div'); hL.style.cssText = 'position:absolute;left:6px;top:127px;width:216px;height:200px;overflow-y:scroll;scrollbar-width:thin'; H.appendChild(hL);
    hR = el('div'); hR.style.cssText = 'position:absolute;left:238px;top:127px;width:216px;height:200px;overflow-y:scroll;scrollbar-width:thin'; H.appendChild(hR);
    hmeso = el('div'); hmeso.style.cssText = 'position:absolute;left:366px;top:65px;width:82px;height:13px;text-align:right;font:bold 11px Tahoma,Arial;line-height:13px;color:#222'; H.appendChild(hmeso);
    hbuy = bt('btbuy', 140, 96, function () { doBuy(); }); hsell = bt('btsell', 372, 96, function () { doSell(); }); hbuy.style.left = '138px'; hsell.style.left = '370px'; hbuy.style.top = hsell.style.top = '97px';
    bt('btexit', 372, 40, function () { HW.set(false); }).style.top = '38px';
  })();
  var tabImgs = {};
  function rowEl(parent, i, id, sub, onclick, selected, extra) {
    var it = I.ITEMS[id], r = el('div'); r.style.cssText = 'position:absolute;left:0;top:' + i * 40 + 'px;width:210px;height:36px;cursor:pointer';
    if (selected) { var sl = el('img'); sl.src = A + 'shop_sel.png'; sl.style.cssText = 'position:absolute;left:37px;top:0;image-rendering:pixelated'; r.appendChild(sl); }
    var im = el('img'); im.src = ICON + id + '.png'; im.draggable = false; im.style.cssText = 'position:absolute;left:3px;top:2px;max-width:32px;max-height:32px;image-rendering:pixelated'; im.onerror = function () { im.remove(); r.insertAdjacentHTML('afterbegin', '<div style="position:absolute;left:3px;top:3px;width:30px;height:30px;background:#5a6b98;border-radius:3px"></div>'); };
    r.appendChild(im);
    var nm = el('div', '', it.name); nm.style.cssText = 'position:absolute;left:46px;top:4px;width:160px;font:bold 11px Tahoma,Arial;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; r.appendChild(nm);
    var sb = el('div', '', sub); sb.style.cssText = 'position:absolute;left:46px;top:19px;font:10px Tahoma,Arial;color:#345;white-space:nowrap'; r.appendChild(sb);
    if (extra) { var ex = el('div', '', extra); ex.style.cssText = 'position:absolute;right:6px;top:4px;font:bold 10px Arial;color:#fff;text-shadow:1px 0 #000,-1px 0 #000,0 1px #000,0 -1px #000'; r.appendChild(ex); }
    r.addEventListener('click', onclick); r.addEventListener('mouseenter', function (e) { showTip(e, tipOf(id)); }); r.addEventListener('mousemove', function (e) { showTip(e, tipOf(id)); }); r.addEventListener('mouseleave', hideTip); parent.appendChild(r);
  }
  function priceTxt(e) { return e.currency ? e.price + ' × ' + I.ITEMS[e.currency].name : fm(e.price) + ' mesos'; }
  function doBuy() {
    if (hsel === null) return toast('Elige un objeto de la lista de la izquierda');
    var e = I.SHOP[hsel], it = I.ITEMS[e.id], have = e.currency ? I.countItem(world.inv, e.currency) : world.mesos, max = Math.min(99, Math.floor(have / e.price));
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
  HW.refresh = function (force) {
    if (!HW.open) return;
    var s = JSON.stringify([world.inv, world.mesos, hsel, hrow && hrow.id + hrow.idx, htab]);
    if (!force && s === hsig) return; hsig = s;
    var kl = hL.scrollTop, kr = hR.scrollTop; hL.innerHTML = ''; hR.innerHTML = '';
    I.SHOP.forEach(function (e, i) { rowEl(hL, i, e.id, priceTxt(e), function () { hsel = i; hsig = ''; HW.refresh(); }, hsel === i); });
    var list = [];
    if (htab === 'equip') world.inv.equip.forEach(function (id, idx) { if (id) list.push({ id: id, idx: idx, kind: 'equip' }); });
    else world.inv.use.forEach(function (sl, idx) { if (sl && !list.some(function (x) { return x.id === sl.id; })) list.push({ id: sl.id, idx: idx, kind: 'use' }); });
    list.forEach(function (r, i) { rowEl(hR, i, r.id, (I.ITEMS[r.id].sell || 0) + ' mesos', function () { hrow = r; hsig = ''; HW.refresh(); }, hrow && hrow.id === r.id && hrow.idx === r.idx, r.kind === 'use' ? '×' + I.countItem(world.inv, r.id) : ''); });
    var h1 = el('div'); h1.style.cssText = 'height:' + Math.max(200, I.SHOP.length * 40) + 'px;width:1px'; hL.appendChild(h1);
    var h2 = el('div'); h2.style.cssText = 'height:' + Math.max(200, list.length * 40) + 'px;width:1px'; hR.appendChild(h2);
    hL.scrollTop = kl; hR.scrollTop = kr;
    HW.inn.querySelectorAll('.mw-tab[data-t]').forEach(function (b, i) { var on = b.dataset.t === htab; b.className = 'mw-tab' + (on ? ' on' : ''); b.innerHTML = ''; var im = el('img'); im.src = A + 'tab_' + (on ? 'on' : 'off') + '_' + i + '.png'; b.appendChild(im); });
    hmeso.textContent = fm(world.mesos);
    hbuy.setEnabled(hsel !== null); hsell.setEnabled(!!hrow);
  };

  /* ---------- barra de botones y teclas ---------- */
  var bar2 = el('div'); bar2.id = 'mc-bar'; document.body.appendChild(bar2);
  function tb(txt, w) { var b = el('button', 'mi-btn', txt); b.addEventListener('click', function () { w.toggle(); }); return b; }
  var oldBtns = [].slice.call(document.querySelectorAll('.wm-btn, .mi-btn'));
  bar2.appendChild(tb('Equip (E)', EW)); bar2.appendChild(tb('Inventario (I)', IW)); bar2.appendChild(tb('Stat (S)', SW)); bar2.appendChild(tb('Skill (K)', KW)); bar2.appendChild(tb('Tienda (T)', HW));
  oldBtns.sort(function (a, b) { return a.classList.contains('wm-btn') ? -1 : 1; }).forEach(function (b) { bar2.appendChild(b); });   // Mapa (M), Personaje (C)
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
    function onKey(e) { if (e.code === 'Escape' || e.code === 'KeyN') { e.preventDefault(); close(); } else if (e.code === 'Enter' || e.code === 'KeyY') { e.preventDefault(); G.reset(); } }
    yes.addEventListener('click', function () { G.reset(); }); no.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    bx.appendChild(t); bx.appendChild(d); bx.appendChild(yes); bx.appendChild(no); ov.appendChild(bx); document.body.appendChild(ov);
    addEventListener('keydown', onKey, true); resetOpen = ov; no.focus();
  }
  addEventListener('keydown', function (e) {
    if (e.repeat || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '') || (G.isDebug && G.isDebug())) return;
    if (e.code === 'Backquote' || e.key === '|') { e.preventDefault(); askReset(); return; }
    if (e.code === 'KeyI') IW.toggle(); else if (e.code === 'KeyE') EW.toggle(); else if (e.code === 'KeyS') SW.toggle(); else if (e.code === 'KeyK') KW.toggle(); else if (e.code === 'KeyT') HW.toggle();
  });
  setInterval(function () { IW.refresh(); EW.refresh(); SW.refresh(); KW.refresh(); HW.refresh(); }, 300);
})();
