/* Ventana de inventario / equipo / stats (HTML encima del canvas). Tecla E o botón. */
(function () {
  'use strict';
  var G = window.MAPLE_GAME, I = window.MapleItems;
  if (!G || !I) return;
  var world = G.world, tab = 'equip', isOpen = false, sig = '', info = '';
  var COLORS = { weapon: '#b8453f', sub: '#7d5aa8', hat: '#3f78b8', top: '#3fa5b8', bottom: '#3f8fb8', glove: '#d98a3a', shoes: '#7da83f', cape: '#a8453f', ring: '#c9a806', earring: '#c9a806', use: '#6f7480' };
  var LAYOUT = ['ring1', 'hat', 'earring', 'ring2', 'weapon', 'top', 'cape', 'sub', 'glove', 'bottom', 'shoes', 'ring3', 'ring4', null, null, null];

  var css = document.createElement('style');
  css.textContent =
    '.mi-btn{position:fixed;top:10px;right:10px;z-index:10;background:#23305a;color:#fff;border:1px solid #6b7bb5;border-radius:6px;padding:8px 12px;font:bold 13px sans-serif;cursor:pointer}' +
    '.mi-win{position:fixed;top:52px;right:10px;z-index:10;max-width:calc(100vw - 20px);max-height:calc(100vh - 130px);overflow:auto;background:rgba(18,22,40,.96);color:#eee;font:13px sans-serif;border:1px solid #556;border-radius:8px;padding:10px;display:none}' +
    '.mi-row{display:flex;gap:16px;flex-wrap:wrap}.mi-h{font-weight:bold;margin-bottom:6px;color:#ffe9a8}' +
    '.mi-eq{display:grid;grid-template-columns:repeat(4,42px);gap:4px}' +
    '.mi-inv{display:grid;grid-template-columns:repeat(8,36px);gap:3px;max-height:290px;overflow-y:auto;padding-right:4px}' +
    '.mi-cell{box-sizing:border-box;width:36px;height:36px;background:#0d1020;border:1px solid #334;border-radius:4px;position:relative;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;cursor:pointer;user-select:none;background-repeat:no-repeat;background-size:auto;background-position:center;image-rendering:pixelated;text-align:center;line-height:1}' +
    '.mi-eq .mi-cell{width:42px;height:42px}.mi-cell.empty{color:#556;font-size:9px}.mi-cell.item{border-color:#8a96c8}' +
    '.mi-cnt{position:absolute;right:2px;bottom:0;font-size:10px;text-shadow:0 0 3px #000,0 0 3px #000}' +
    '.mi-tabs{display:flex;gap:4px;margin-bottom:6px}.mi-tab{padding:4px 10px;border:1px solid #445;border-radius:4px;cursor:pointer;background:#141830}.mi-tab.on{background:#2d3a70;border-color:#8a96c8}' +
    '.mi-stats{margin-top:8px;font-size:12px;line-height:1.5;color:#dfe6ff}.mi-info{margin-top:8px;min-height:34px;font-size:12px;color:#cfd8ff;max-width:520px}' +
    '.mi-skills{width:330px}.mi-skill{display:flex;gap:8px;align-items:center;margin:8px 0 2px}.mi-sktxt{flex:1;font-size:12px;line-height:1.4}' +
    '.mi-plus{width:30px;height:30px;font:bold 16px sans-serif;cursor:pointer;background:#2d3a70;color:#fff;border:1px solid #8a96c8;border-radius:4px}.mi-plus:disabled{opacity:.35;cursor:default}' +
    '.mi-pots{margin-top:10px}.mi-pot{display:flex;align-items:center;gap:6px;margin:4px 0;font-size:12px;flex-wrap:wrap}.mi-pn{width:46px}.mi-pot input[type=range]{width:90px}.mi-auto{display:block;font-size:12px;color:#cfd8ff;margin-left:44px}';
  document.head.appendChild(css);

  var icons = {};   // id -> 'ok' | 'no' | 'loading' (evita pedir iconos que no existen una y otra vez)
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  var btn = el('button', 'mi-btn', 'Pociones (P)'), win = el('div', 'mi-win');
  document.body.appendChild(btn); document.body.appendChild(win);
  win.addEventListener('wheel', function (e) { e.stopPropagation(); });

  function fmtStats(st) {
    var o = [], names = { str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK', att: 'ATT', matt: 'MATT' };
    for (var k in st) if (st[k]) o.push(names[k] + ' +' + st[k]);
    return o.join(' ');
  }
  function describe(it) {
    if (!it) return '';
    if (it.kind === 'use') return it.name + ' — ' + it.desc;
    return it.name + ' · ' + (I.SLOT_LABEL[I.TYPE_SLOTS[it.type][0]]) + ' · Req. Lv ' + it.lv + ' · ' + fmtStats(it.stats);
  }
  function setInfo(t) { info = t; var d = win.querySelector('.mi-info'); if (d) d.textContent = t; }

  function cell(it, count, label) {
    var c = el('div', 'mi-cell ' + (it ? 'item' : 'empty'));
    if (!it) { c.textContent = label || ''; return c; }
    c.style.backgroundColor = COLORS[it.kind === 'use' ? 'use' : it.type] || '#555';
    c.textContent = it.name.slice(0, 3);
    var url = 'assets/item/' + it.id + '.png';
    if (icons[it.id] === 'ok') { c.style.backgroundImage = 'url(' + url + ')'; c.style.backgroundColor = ''; c.textContent = ''; }
    else if (!icons[it.id]) {
      var im = new Image();
      im.onload = function () { icons[it.id] = 'ok'; c.style.backgroundImage = 'url(' + url + ')'; c.style.backgroundColor = ''; c.textContent = ''; if (count > 1) addCount(c, count); };
      im.onerror = function () { icons[it.id] = 'no'; };
      icons[it.id] = 'loading'; im.src = url;
    }
    if (count > 1) addCount(c, count);
    c.title = describe(it);
    c.addEventListener('mouseenter', function () { setInfo(describe(it)); });
    return c;
  }
  function addCount(c, n) { if (!c.querySelector('.mi-cnt')) c.appendChild(el('span', 'mi-cnt', String(n))); }

  function skillsPanel() {
    var SK = window.MapleSkills, box = el('div', 'mi-skills');
    box.appendChild(el('div', 'mi-h', 'SP disponible: ' + SK.spAvailable(world, 1) + '   (3 SP por nivel, del Lv10 al 29)'));
    SK.ORDER.forEach(function (id) {
      var sk = SK.SKILLS[id], st = world.skills[id], lv = st.level, row = el('div', 'mi-skill');
      var ic = el('div', 'mi-cell item'); ic.style.backgroundImage = 'url(' + sk.icon + ')';
      var txt = el('div', 'mi-sktxt');
      if (sk.info) txt.innerHTML = '<b>' + sk.name + '</b> &nbsp;Lv ' + lv + ' / ' + sk.maxLevel + '<br>' + (lv > 0 ? sk.info(lv) : sk.info(1)); else
      txt.innerHTML = '<b>' + sk.name + '</b> &nbsp;Lv ' + lv + ' / ' + sk.maxLevel + '<br>' +
        (lv > 0 ? 'Daño ' + sk.damage(lv) + '% · MP ' + sk.mpCon(lv) + '<br>' : '') +
        (lv < sk.maxLevel ? 'Siguiente: ' + sk.damage(lv + 1) + '% · MP ' + sk.mpCon(lv + 1) : 'Nivel máximo') + '<br>' +
        (sk.ranged ? sk.bulletCount + ' estrellas a 1 enemigo (' + sk.range.x2 + ' px)' : 'Hasta ' + sk.mobCount + ' enemigos al frente (200 px)');
      var plus = el('button', 'mi-plus', '+'); plus.disabled = SK.spAvailable(world, SK.jobOf(sk)) < 1 || lv >= sk.maxLevel;
      plus.addEventListener('click', function () { if (SK.learn(world, id)) { G.save(); sig = ''; render(); } });
      row.appendChild(ic); row.appendChild(txt); row.appendChild(plus); box.appendChild(row);
      var lab = el('label', 'mi-auto'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = st.auto;
      cb.addEventListener('change', function () { st.auto = cb.checked; G.save(); });
      lab.appendChild(cb); lab.appendChild(document.createTextNode(' Auto farm (usarla sola al atacar)')); if (!sk.passiveSkill) box.appendChild(lab);
    });
    box.appendChild(el('div', 'mi-stats', 'Modo manual: tecla X lanza Slash Blast.'));
    return box;
  }

  function potionsPanel() {
    var ch = world.chars[world.selected], box = el('div', 'mi-pots');
    box.appendChild(el('div', 'mi-h', 'Pociones automáticas'));
    ['hp', 'mp'].forEach(function (k) {
      var slot = ch.potions[k], it = I.ITEMS[slot.id], row = el('div', 'mi-pot'), have = 0;
      if (it) world.inv.use.forEach(function (s) { if (s && s.id === it.id) have += s.count; });
      var ic = cell(it, 0, k.toUpperCase());
      if (it) ic.addEventListener('click', function () { slot.id = null; info = 'Poción de ' + k.toUpperCase() + ' quitada.'; G.save(); sig = ''; render(); });
      row.appendChild(ic);
      row.appendChild(el('span', '', it ? it.name + ' x' + have + ' · usar al' : 'Sin poción: haz clic en una en la pestaña USE'));
      if (it) {
        var num = document.createElement('input'), rng = document.createElement('input');
        num.type = 'number'; num.min = 1; num.max = 99; num.value = slot.pct; num.className = 'mi-pn';
        rng.type = 'range'; rng.min = 1; rng.max = 99; rng.value = slot.pct;
        ['keydown', 'keyup', 'keypress'].forEach(function (ev) { num.addEventListener(ev, function (e) { e.stopPropagation(); }); });
        num.addEventListener('input', function () { if (num.value === '') return; var v = Math.max(1, Math.min(99, num.value | 0)); slot.pct = v; rng.value = v; G.save(); });
        num.addEventListener('change', function () { num.value = slot.pct; });
        rng.addEventListener('input', function () { slot.pct = rng.value | 0; num.value = slot.pct; G.save(); });
        row.appendChild(num); row.appendChild(el('span', '', '%')); row.appendChild(rng);
      }
      box.appendChild(row);
    });
    return box;
  }

  function build() {
    var st = world.stats, inv = world.inv, eqp = world.equip, stt = I.calcStats(st.level, eqp);
    win.innerHTML = '';
    var head = el('div', 'mi-h', world.chars[world.selected].name + ' — ' + I.CLASSES[world.chars[world.selected].cls].label + ' Lv. ' + st.level);
    var row = el('div', 'mi-row'), left = el('div'), right = el('div');
    left.appendChild(potionsPanel());

    row.appendChild(left); row.appendChild(right);
    win.appendChild(head); win.appendChild(row);
    var inf = el('div', 'mi-info', info); win.appendChild(inf);
  }

  function render() {
    if (!isOpen) return;
    var s = JSON.stringify([world.selected, world.stats.level, world.inv, world.equip, tab, world.skills, world.chars[world.selected].potions.hp.id, world.chars[world.selected].potions.mp.id]);
    if (s === sig) return;
    sig = s; build();
  }
  (window.MAPLE_PANELS = window.MAPLE_PANELS || {}).pots = { isOpen: function () { return isOpen; }, close: function () { if (isOpen) toggle(); } };
  function toggle() { isOpen = !isOpen; win.style.display = isOpen ? 'block' : 'none'; sig = ''; if (isOpen) { var P = window.MAPLE_PANELS; for (var k in P) if (k !== 'pots' && P[k].isOpen()) P[k].close(); P.pots.t = performance.now(); } render(); }
  btn.addEventListener('click', toggle);
  addEventListener('keydown', function (e) { if (e.code === 'KeyP' && !e.repeat) toggle(); });
  setInterval(render, 400);
})();
