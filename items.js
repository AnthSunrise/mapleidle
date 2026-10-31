/* Objetos, equipo e inventario.
 * IMPORTANTE: los nombres y valores del catálogo son de EJEMPLO (inventados para probar el sistema).
 * Reemplázalos con los datos reales de tu servidor. Los iconos se cargan solos desde
 * assets/item/<id>.png (ej: assets/item/sword_1.png); si no existe, se ve un cuadro de color. */
(function (root) {
  'use strict';
  var SLOTS = ['hat', 'top', 'bottom', 'glove', 'shoes', 'cape', 'ring1', 'ring2', 'ring3', 'ring4', 'earring', 'weapon', 'sub'];
  var SLOT_LABEL = { hat: 'Hat', top: 'Top', bottom: 'Bottom', glove: 'Glove', shoes: 'Shoes', cape: 'Cape', ring1: 'Ring', ring2: 'Ring', ring3: 'Ring', ring4: 'Ring', earring: 'Earring', weapon: 'Weapon', sub: 'Sub' };
  var TYPE_SLOTS = { hat: ['hat'], top: ['top'], bottom: ['bottom'], glove: ['glove'], shoes: ['shoes'], cape: ['cape'], ring: ['ring1', 'ring2', 'ring3', 'ring4'], earring: ['earring'], weapon: ['weapon'], sub: ['sub'] };
  var INV_SIZE = 128, STACK_MAX = 100, BARE_ATT = 10;
  var ITEMS = {};
  function eq(id, name, type, lv, st, cls) { ITEMS[id] = { id: id, name: name, kind: 'equip', type: type, lv: lv, stats: st, cls: cls || null }; }   // cls = clase que puede usarlo (null = todas)
  function use(id, name, desc, heal) { ITEMS[id] = { id: id, name: name, kind: 'use', desc: desc, heal: heal || null }; }

  // Equipos REALES: nombre, nivel, requisitos y stats salen de los .img del WZ (itemdata.js, generado por tools/gen_itemdata.py).
  // Ajustes de este juego sobre los datos del WZ:
  //  - Los 5 "Beginner ..." (equipo inicial) no piden nivel ni stats, para poder reequiparlos desde el nivel 1.
  //  - Maple Sword (1302211) es solo para Warrior (en el WZ no tiene requisito de job).
  var BEGINNER = ['1302077', '1382100', '1452051', '1472061', '1482000'];
  var CLS_OVERRIDE = { '1302211': 'warrior' };
  var DATA = root.MapleItemData || {};
  Object.keys(DATA).forEach(function (id) {
    var d = DATA[id], beg = BEGINNER.indexOf(id) >= 0;
    ITEMS[id] = { id: id, name: d.n, kind: 'equip', type: d.t, overall: !!d.ov, lv: beg ? 0 : d.lv, req: beg ? [0, 0, 0, 0] : d.req, stats: d.st, cls: CLS_OVERRIDE[id] || d.cls || null, speed: d.as || 0, tuc: d.tuc || 0 };
  });
  // ids de las pruebas/guardados anteriores -> equipo real equivalente
  var ALIAS = { sword_1: '1302077', sword_2: '1302183', sword_3: '1302043', sword_4: '1302211', claw_1: '1472061', claw_2: '1472003', claw_3: '1472006', claw_4: '1472093' };
  function startEquip(cls) { var c = CLASSES[cls || 'warrior']; return { top: '1052646', shoes: '1072850', weapon: c.weapon }; }
  use('red_potion', 'Red Potion', 'Recupera 100 HP. Clic para asignarla como poción de HP del personaje seleccionado.', { hp: 100 });
  use('blue_potion', 'Blue Potion', 'Recupera 100 MP. Clic para asignarla como poción de MP del personaje seleccionado.', { mp: 100 });
  use('scroll_piece', 'Scroll Piece', 'Se canjea por scrolls en la tienda.');
  use('scroll_glove_att60', 'Scroll for Glove for ATT 60%', 'PLACEHOLDER: aún sin efecto (los scrolls y potenciales vendrán en una etapa posterior).');

  // Precio de venta al NPC (provisional salvo las pociones): pociones 50% del precio de compra; equipo según nivel
  ITEMS.red_potion.sell = 50; ITEMS.blue_potion.sell = 25; ITEMS.scroll_piece.sell = 20; ITEMS.scroll_glove_att60.sell = 100;
  Object.keys(ITEMS).forEach(function (k) { if (ITEMS[k].kind === 'equip') ITEMS[k].sell = 20 + ITEMS[k].lv * 15; });
  // Tienda: price en mesos, o en otro objeto con currency (ej. scroll pieces). Precios de scrolls PROVISIONALES.
  var SHOP = [
    { id: 'red_potion', price: 100 },
    { id: 'blue_potion', price: 50 },
    { id: 'scroll_glove_att60', price: 10, currency: 'scroll_piece' }
  ];

  // Clase: stat principal/secundario y reparto automático por nivel (AP). Propuesta mía: ajústala.
  var CLASSES = {
    warrior: { label: 'Warrior', weapon: '1302077', mult: 4, main: 'str', sub: 'dex', base: { str: 12, dex: 5, int: 4, luk: 4 }, perLevel: { str: 4, dex: 1, int: 0, luk: 0 } },
    // Thief (Assassin, a distancia): LUK principal, DEX secundario. Valores propuestos (provisionales)
    // Archer (a distancia, arco): DEX principal, STR secundario. Valores propuestos (provisionales)
    archer: { label: 'Archer', weapon: '1452051', mult: 3.4, main: 'dex', sub: 'str', base: { str: 5, dex: 12, int: 4, luk: 4 }, perLevel: { str: 1, dex: 4, int: 0, luk: 0 } },
    thief: { label: 'Thief', weapon: '1472061', mult: 3.6, starAtt: 15, main: 'luk', sub: 'dex', base: { str: 4, dex: 5, int: 4, luk: 12 }, perLevel: { str: 0, dex: 1, int: 0, luk: 4 } }
  };

  function calcStats(level, equip, cls) {
    var c = CLASSES[cls || 'warrior'], s = { str: 0, dex: 0, int: 0, luk: 0, att: 0, matt: 0, def: 0, mhp: 0, mmp: 0, acc: 0, eva: 0 };
    ['str', 'dex', 'int', 'luk'].forEach(function (k) { s[k] = c.base[k] + (level - 1) * c.perLevel[k]; });
    SLOTS.forEach(function (sl) {
      var it = ITEMS[equip && equip[sl]]; if (!it) return;
      for (var k in it.stats) s[k] = (s[k] || 0) + it.stats[k];
    });
    if (!equip || !equip.weapon) s.att += BARE_ATT;
    s.att += c.starAtt || 0;   // Thief: ATT PROVISIONAL de las estrellas (cuando sean el arma secundaria saldrá de ellas)
    // fórmula tipo MapleStory (aproximada): (principal*4 + secundario) * ATT / 100
    var max = Math.floor((s[c.main] * c.mult + s[c.sub]) * s.att / 100);
    var min = Math.floor((s[c.main] * c.mult * 0.9 * 0.6 + s[c.sub]) * s.att / 100);
    s.max = Math.max(1, max); s.min = Math.max(1, Math.min(min, s.max));
    return s;
  }

  // Pociones automáticas por personaje: qué poción usa y a qué % de HP/MP la toma (se consumen del inventario compartido)
  function newPotions() { return { hp: { id: 'red_potion', pct: 50 }, mp: { id: 'blue_potion', pct: 30 } }; }
  function sanitizePotions(p) {
    var o = newPotions();
    ['hp', 'mp'].forEach(function (k) {
      var s = p && p[k]; if (!s) return;
      var it = ITEMS[s.id];
      if (it && it.heal && it.heal[k]) o[k].id = s.id; else if (s.id === null) o[k].id = null;
      o[k].pct = Math.max(1, Math.min(99, (s.pct | 0) || o[k].pct));
    });
    return o;
  }

  function newInventory() { return { equip: new Array(INV_SIZE).fill(null), use: new Array(INV_SIZE).fill(null) }; }

  function addItem(inv, id, n) {
    var it = ITEMS[id], i; if (!it) return false;
    if (it.kind === 'equip') { i = inv.equip.indexOf(null); if (i < 0) return false; inv.equip[i] = id; return true; }
    var rem = n || 1, a;
    for (i = 0; i < INV_SIZE && rem > 0; i++) {
      var s = inv.use[i];
      if (s && s.id === id && s.count < STACK_MAX) { a = Math.min(rem, STACK_MAX - s.count); s.count += a; rem -= a; }
    }
    while (rem > 0) {
      var j = inv.use.indexOf(null); if (j < 0) return false;
      a = Math.min(rem, STACK_MAX); inv.use[j] = { id: id, count: a }; rem -= a;
    }
    return true;
  }

  function countItem(inv, id) { var n = 0; inv.use.forEach(function (s) { if (s && s.id === id) n += s.count; }); return n; }
  function removeItem(inv, id, n) {
    for (var i = 0; i < inv.use.length && n > 0; i++) { var s = inv.use[i]; if (s && s.id === id) { var t = Math.min(n, s.count); s.count -= t; n -= t; if (s.count <= 0) inv.use[i] = null; } }
    return n === 0;
  }
  function canAdd(inv, id, n) { var c = { equip: inv.equip.slice(), use: inv.use.map(function (s) { return s && { id: s.id, count: s.count }; }) }; return addItem(c, id, n); }
  var STAT_NAME = ['STR', 'DEX', 'INT', 'LUK'];
  // Equipar: clase, nivel y stats base (sin equipo) mínimos. Un overall (Longcoat) ocupa Top y Bottom: al equiparlo el Bottom vuelve al inventario y al revés.
  function equipItem(inv, equip, level, idx, cls) {
    var id = inv.equip[idx], it = ITEMS[id];
    if (!it) return { ok: false, msg: 'Slot vacío' };
    if (it.cls && cls && it.cls !== cls) return { ok: false, msg: it.name + ': solo para ' + (CLASSES[it.cls] ? CLASSES[it.cls].label : it.cls) };
    if (level < it.lv) return { ok: false, msg: it.name + ': requiere nivel ' + it.lv };
    var base = calcStats(level, {}, cls || 'warrior');
    for (var r = 0; r < 4; r++) { var k = STAT_NAME[r].toLowerCase(); if (it.req && it.req[r] > base[k]) return { ok: false, msg: it.name + ': requiere ' + STAT_NAME[r] + ' ' + it.req[r] }; }
    var cands = TYPE_SLOTS[it.type], slot = null;
    for (var i = 0; i < cands.length; i++) if (!equip[cands[i]]) { slot = cands[i]; break; }
    if (!slot) slot = cands[0];
    var snapI = inv.equip.slice(), snapE = {}; for (var q in equip) snapE[q] = equip[q];
    var old = equip[slot] || null;
    equip[slot] = id; inv.equip[idx] = old;
    var extra = null;   // pieza que choca con un overall
    if (it.overall && equip.bottom) { extra = equip.bottom; delete equip.bottom; }
    else if (it.type === 'bottom' && equip.top && ITEMS[equip.top] && ITEMS[equip.top].overall) { extra = equip.top; delete equip.top; }
    if (extra) {
      var f = inv.equip.indexOf(null);
      if (f < 0) { inv.equip = snapI; for (var z in equip) delete equip[z]; for (var y in snapE) equip[y] = snapE[y]; return { ok: false, msg: 'Inventario lleno' }; }
      inv.equip[f] = extra;
    }
    return { ok: true, slot: slot, msg: 'Equipado: ' + it.name + (extra ? ' (se quitó ' + ITEMS[extra].name + ')' : '') };
  }

  function unequipSlot(inv, equip, slot) {
    if (!equip[slot]) return { ok: false, msg: '' };
    var i = inv.equip.indexOf(null);
    if (i < 0) return { ok: false, msg: 'Inventario lleno' };
    inv.equip[i] = equip[slot]; delete equip[slot];
    return { ok: true, msg: 'Desequipado' };
  }

  // Drops por kill (ajustables)
  function rollDrop(level, rnd) {
    rnd = rnd || Math.random; var out = [];
    if (rnd() < 0.25) out.push({ id: 'red_potion', n: 1 });
    if (rnd() < 0.15) out.push({ id: 'blue_potion', n: 1 });
    if (rnd() < 0.05) out.push({ id: 'scroll_piece', n: 1 });
    if (rnd() < 0.06) {
      var pool = Object.keys(ITEMS).filter(function (k) { var it = ITEMS[k]; return it.kind === 'equip' && it.lv > 0 && it.lv <= level + 5 && (!it.cls || CLASSES[it.cls]); });
      if (pool.length) out.push({ id: pool[Math.floor(rnd() * pool.length)], n: 1 });
    }
    return out;
  }

  function sanitize(inv, equip, cls) {
    var out = newInventory(), eqo = {}, i;
    if (inv && Array.isArray(inv.equip)) for (i = 0; i < INV_SIZE; i++) { var id = ALIAS[inv.equip[i]] || inv.equip[i]; if (id && ITEMS[id] && ITEMS[id].kind === 'equip') out.equip[i] = id; }
    if (inv && Array.isArray(inv.use)) for (i = 0; i < INV_SIZE; i++) {
      var s = inv.use[i];
      if (s && ITEMS[s.id] && ITEMS[s.id].kind === 'use') out.use[i] = { id: s.id, count: Math.max(1, Math.min(STACK_MAX, s.count | 0)) };
    }
    if (equip) SLOTS.forEach(function (sl) {
      var e = ALIAS[equip[sl]] || equip[sl];
      if (e && ITEMS[e] && ITEMS[e].kind === 'equip' && TYPE_SLOTS[ITEMS[e].type].indexOf(sl) >= 0) eqo[sl] = e;
    }); else eqo = startEquip(cls);
    return { inv: out, equip: eqo };
  }

  var api = { CLASSES: CLASSES, SLOTS: SLOTS, SLOT_LABEL: SLOT_LABEL, TYPE_SLOTS: TYPE_SLOTS, ITEMS: ITEMS, INV_SIZE: INV_SIZE, STACK_MAX: STACK_MAX,
    SHOP: SHOP, countItem: countItem, removeItem: removeItem, canAdd: canAdd, calcStats: calcStats, newInventory: newInventory, addItem: addItem, equipItem: equipItem, unequipSlot: unequipSlot, rollDrop: rollDrop, sanitize: sanitize, newPotions: newPotions, startEquip: startEquip, BEGINNER: BEGINNER, sanitizePotions: sanitizePotions };
  root.MapleItems = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
