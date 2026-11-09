/* Objetos, equipo e inventario.
 * IMPORTANTE: los nombres y valores del catálogo son de EJEMPLO (inventados para probar el sistema).
 * Reemplázalos con los datos reales de tu servidor. Los iconos se cargan solos desde
 * assets/item/<id>.png (ej: assets/item/sword_1.png); si no existe, se ve un cuadro de color. */
(function (root) {
  'use strict';
  var SLOTS = ['hat', 'top', 'bottom', 'glove', 'shoes', 'cape', 'ring1', 'ring2', 'ring3', 'ring4', 'earring', 'weapon', 'sub'];
  var SLOT_LABEL = { hat: 'Hat', top: 'Top', bottom: 'Bottom', glove: 'Glove', shoes: 'Shoes', cape: 'Cape', ring1: 'Ring', ring2: 'Ring', ring3: 'Ring', ring4: 'Ring', earring: 'Earring', weapon: 'Weapon', sub: 'Sub' };
  var TYPE_SLOTS = { hat: ['hat'], top: ['top'], bottom: ['bottom'], glove: ['glove'], shoes: ['shoes'], cape: ['cape'], ring: ['ring1', 'ring2', 'ring3', 'ring4'], earring: ['earring'], weapon: ['weapon'], sub: ['sub'] };
  var INV_SIZE = 128, STACK_MAX = 9999, BARE_ATT = 10;
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
  //  - Explorer's Lumati (1051204): en el WZ es nivel 30 con DEX +4; aquí es la opción del Archer para nivel 15 con DEX +2 (decisión del autor).
  var OVERRIDE = { '1051204': { lv: 15, stats: { dex: 2 } } };
  Object.keys(OVERRIDE).forEach(function (id) {
    var it = ITEMS[id], o = OVERRIDE[id]; if (!it) return;
    if (o.lv !== undefined) it.lv = o.lv;
    if (o.stats) for (var k in o.stats) it.stats[k] = o.stats[k];
  });
  //  - Armas PROVISIONALES del 2º job (jobs.js las entrega al avanzar): solo las usa esa rama, no caen como drop y no piden STR/DEX/LUK (el reparto de AP es automático).
  //    Reef Claw (1332012) y Seclusion Wristguard (1092018) para Bandit; Forked Spear (1432002) Spearman; Maple Crow (1462069) Crossbowman; Maple Gun (1492042) Gunslinger.
  var BRANCH_ONLY = { '1432002': 'spearman', '1462069': 'crossbowman', '1492042': 'gunslinger', '1332012': 'bandit', '1092018': 'bandit' };
  Object.keys(BRANCH_ONLY).forEach(function (id) { var it = ITEMS[id]; if (!it) return; it.only = BRANCH_ONLY[id]; it.req = [0, 0, 0, 0]; });
  // ids de las pruebas/guardados anteriores -> equipo real equivalente
  var ALIAS = { sword_1: '1302077', sword_2: '1302183', sword_3: '1302043', sword_4: '1302211', claw_1: '1472061', claw_2: '1472003', claw_3: '1472006', claw_4: '1472093' };
  function startEquip(cls) { var c = CLASSES[cls || 'warrior']; return { top: '1052646', shoes: '1072850', weapon: c.weapon }; }
  use('red_potion', 'Red Potion', 'Recupera 100 HP. Clic para asignarla como poción de HP del personaje seleccionado.', { hp: 100 });
  use('blue_potion', 'Blue Potion', 'Recupera 100 MP. Clic para asignarla como poción de MP del personaje seleccionado.', { mp: 100 });
  use('white_potion', 'White Potion', 'Recupera 500 HP. Clic para asignarla como poción de HP del personaje seleccionado.', { hp: 500 });
  use('mana_elixir', 'Mana Elixir', 'Recupera 300 MP. Clic para asignarla como poción de MP del personaje seleccionado.', { mp: 300 });
  use('unagi', 'Unagi', 'Recupera 1000 HP. Clic para asignarla como poción de HP del personaje seleccionado.', { hp: 1000 });
  use('pure_water', 'Pure Water', 'Recupera 800 MP. Clic para asignarla como poción de MP del personaje seleccionado.', { mp: 800 });
  use('ice_cream_pop', 'Ice Cream Pop', 'Recupera 1500 HP. Clic para asignarla como poción de HP del personaje seleccionado.', { hp: 1500 });
  use('red_bean_sundae', 'Red Bean Sundae', 'Recupera 1500 MP. Clic para asignarla como poción de MP del personaje seleccionado.', { mp: 1500 });
  use('melting_cheese', 'Melting Cheese', 'Recupera 2000 HP. Clic para asignarla como poción de HP del personaje seleccionado.', { hp: 2000 });
  use('sunrise_dew', 'Sunrise Dew', 'Recupera 2000 MP. Clic para asignarla como poción de MP del personaje seleccionado.', { mp: 2000 });
  use('scroll_piece', 'Scroll Piece', 'Se canjea por scrolls en la tienda.');

  // Precio de venta al NPC (provisional salvo las pociones): pociones 50% del precio de compra; equipo según nivel
  ITEMS.red_potion.sell = 50; ITEMS.blue_potion.sell = 25; ITEMS.scroll_piece.sell = 20;
  ITEMS.white_potion.sell = 175; ITEMS.mana_elixir.sell = 310; ITEMS.unagi.sell = 500; ITEMS.pure_water.sell = 560; ITEMS.ice_cream_pop.sell = 750; ITEMS.red_bean_sundae.sell = 1125; ITEMS.melting_cheese.sell = 1000; ITEMS.sunrise_dew.sell = 1500;
  Object.keys(ITEMS).forEach(function (k) { if (ITEMS[k].kind === 'equip') ITEMS[k].sell = 20 + ITEMS[k].lv * 15; });
  // Tienda: price en mesos, o en otro objeto con currency (ej. scroll pieces). Precios de scrolls PROVISIONALES.
  var SHOP = [
    { id: 'red_potion', price: 100, cat: 'consumable' },   // cat: 'consumable' | 'scroll' | 'enhance' (pestaña de la tienda)
    { id: 'blue_potion', price: 50, cat: 'consumable' },
    { id: 'white_potion', price: 350, cat: 'consumable' },
    { id: 'mana_elixir', price: 620, cat: 'consumable' },
    { id: 'unagi', price: 1000, cat: 'consumable' },
    { id: 'pure_water', price: 1120, cat: 'consumable' },
    { id: 'ice_cream_pop', price: 1500, cat: 'consumable' },
    { id: 'red_bean_sundae', price: 2250, cat: 'consumable' },
    { id: 'melting_cheese', price: 2000, cat: 'consumable' },
    { id: 'sunrise_dew', price: 3000, cat: 'consumable' }
  ];

  // Clase: stat principal/secundario y reparto automático por nivel (AP). Propuesta mía: ajústala.
  var GS_MULT = 5.58;   // Gunslinger (DEX principal, STR secundario)
  // mult recalibrado al rediseñar los AP (etapa 46): el daño sin equipo a Lv30 queda igual que antes (~1.0x) aunque ahora el stat principal sea menor.
  var CLASSES = {
    // Calibrado con las capturas de Stat de tu servidor (Lv30 con los 100 AP libres puestos en el stat principal).
    // Stats: todos empiezan en 4; hasta el Lv10 (Beginner) +6 al stat principal por nivel; desde el Lv11 reparto por clase (post, por nivel).
    // cal = ajuste del ATT del arma para que el daño del arma base coincida con tu servidor; minR = daño mínimo / máximo
    warrior: { label: 'Warrior', weapon: '1302077', mult: 6.185, cal: 1.24, minR: 0.2, main: 'str', sub: 'dex', post: { str: 9, dex: 1, int: 0, luk: 0 } },
    // Mage (magia): INT principal, LUK secundario; el daño sale del ATT MÁGICO (matt) del arma
    mage: { label: 'Mage', weapon: '1382100', mult: 4.02, cal: 1.334, minR: 0.25, magic: true, main: 'int', sub: 'luk', post: { str: 4, dex: 1, int: 5, luk: 0 }, defMul: 0.72 },
    archer: { label: 'Archer', weapon: '1452051', mult: 4.36, cal: 1.663, minR: 0.15, main: 'dex', sub: 'str', post: { str: 4, dex: 6, int: 0, luk: 0 } },
    pirate: { label: 'Pirate', weapon: '1482000', mult: 10.88, cal: 1.238, minR: 0.2, main: 'str', sub: 'dex', post: { str: 9, dex: 1, int: 0, luk: 0 } },
    thief: { label: 'Thief', weapon: '1472061', mult: 3.74, cal: 2.16, minR: 0.15, starAtt: 15, main: 'luk', sub: 'dex', post: { str: 4, dex: 1, int: 0, luk: 5 } }
  };


  // AP: stats al crear el personaje (AP automáticos) y +5 AP por nivel al stat principal. El Gunslinger intercambia STR y DEX al avanzar de job.
  var AP_START = { warrior: [12, 5, 4, 4], mage: [4, 4, 12, 5], archer: [5, 12, 4, 4], thief: [4, 5, 4, 12], pirate: [12, 5, 4, 4] }, AP_PER_LEVEL = 5, STATK = ['str', 'dex', 'int', 'luk'];
  function apStats(level, cls, branch) {
    var c = CLASSES[cls || 'warrior'], st = AP_START[cls || 'warrior'], o = {};
    STATK.forEach(function (k, i) { o[k] = st[i] + (k === c.main ? AP_PER_LEVEL * Math.max(0, level - 1) : 0); });
    if (cls === 'pirate' && branch === 'gunslinger') { var t0 = o.str; o.str = o.dex; o.dex = t0; }
    return o;
  }
  function calcStats(level, equip, cls, branch, bonus) {
    var c = CLASSES[cls || 'warrior'], s = { str: 0, dex: 0, int: 0, luk: 0, att: 0, matt: 0, def: 0, mhp: 0, mmp: 0, acc: 0, eva: 0 };
    var ap = apStats(level, cls, branch); s.ap = { str: ap.str, dex: ap.dex, int: ap.int, luk: ap.luk };   // AP (inicial + por nivel); el resto del total es externo (equipo, pasivas, buffs)
    STATK.forEach(function (k) { s[k] = ap[k]; });
    // DEF de arma: usa la curva de STR antigua (con la que se calibró contra tu servidor) para no cambiar la supervivencia al rediseñar los AP
    s.baseStr = 4 + (c.main === 'str' ? 6 * Math.min(level - 1, 9) : 0) + Math.floor(c.post.str * Math.max(0, level - 10) + 1e-9);
    if (bonus) { s.str += bonus.str || 0; s.dex += bonus.dex || 0; s.int += bonus.int || 0; s.luk += bonus.luk || 0; s.matt += bonus.matt || 0; }   // pasivas (Physical Training...); el STR/DEX base de la DEF no cambia
    // Pirate Gunslinger: stat principal DEX (los AP de STR pasan a DEX) y secundario STR; mult de pistola provisional
    if (cls === 'pirate' && branch === 'gunslinger') c = Object.assign({}, c, { main: 'dex', sub: 'str', mult: GS_MULT });   // los AP ya vienen intercambiados (apStats)
    SLOTS.forEach(function (sl) {
      var it = ITEMS[idOf(equip && equip[sl])]; if (!it) return; var est = statsOf(equip[sl]);   // base + scrolls
      for (var k in est) s[k] = (s[k] || 0) + est[k];
    });
    var PT = potTotals(equip);   // potencial del equipo: stats planos, % de stats / All Stats / ATT, HP plano (HP %, crítico y Boss entran por las bonificaciones de sim.js)
    PSTATS.forEach(function (k) { s[k] += PT[k]; }); s.mhp = (s.mhp || 0) + PT.hpF;
    if (!equip || !equip.weapon) { if (c.magic) s.matt += BARE_ATT; else s.att += BARE_ATT; }
    PSTATS.forEach(function (k) { var pc = PT[k + 'P'] + PT.allP; if (pc) s[k] = Math.floor(s[k] * (1 + pc / 100)); });
    if (PT.attP) s.att = Math.round(s.att * (1 + PT.attP / 100)); if (PT.mattP) s.matt = Math.round(s.matt * (1 + PT.mattP / 100));
    if (!(cls === 'thief' && branch === 'bandit')) s.att += c.starAtt || 0;   // Thief: ATT PROVISIONAL de las estrellas (cuando sean el arma secundaria saldrá de ellas)
    // fórmula tipo MapleStory (aproximada): (principal*4 + secundario) * ATT / 100
    if (bonus && bonus.att) { if (c.magic) s.matt += bonus.att; else s.att += bonus.att; }   // buffs de ATT (Rage...)
    var A = (c.magic ? s.matt : s.att) * c.cal;   // el Mage usa el ATT mágico
    var max = Math.round((s[c.main] * c.mult + s[c.sub]) * A / 100);
    s.max = Math.max(1, max); s.min = Math.max(1, Math.min(Math.round(s.max * Math.max(c.minR, (bonus && bonus.mastery) || 0)), s.max));
    // DEF de arma (Weapon DEF) como en tu servidor: 1.104*STR + 3.95*nivel - 13 (el Mage tiene 0.72 de eso) + la del equipo
    s.def += Math.max(0, Math.round((1.104 * s.baseStr + 3.95 * level - 13) * (c.defMul || 1)));
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
    var it = ITEMS[idOf(id)], i; if (!it) return false;
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
  /* Un equipo del inventario o puesto es un id (texto) o una INSTANCIA { id, pot?, sc? } con datos propios (potencial, scrolls).
   * idOf() devuelve siempre el id base; un equipo sin datos propios sigue guardándose como texto (las partidas anteriores valen tal cual). */
  function idOf(x) { return x && typeof x === 'object' ? x.id : x; }
  function cleanInst(x) {   // valida y normaliza una entrada de equipo (texto, instancia o alias antiguo); null si no es un equipo válido
    var id = ALIAS[idOf(x)] || idOf(x); if (!id || !ITEMS[id] || ITEMS[id].kind !== 'equip') return null;
    if (x && typeof x === 'object') { var o = { id: id }, pt = x.pot && potEligible(id) ? cleanPot(x.pot) : null, cs = x.sc ? cleanSc(x.sc, id) : null; if (pt) o.pot = pt; if (cs) o.sc = cs; if (o.pot || o.sc) return o; }
    return id;
  }
  function toInst(x) { return x && typeof x === 'object' ? x : { id: x }; }   // instancia editable (convierte el texto en objeto)
  // Equipar: clase, nivel y stats base (sin equipo) mínimos. Un overall (Longcoat) ocupa Top y Bottom: al equiparlo el Bottom vuelve al inventario y al revés.
  function equipItem(inv, equip, level, idx, cls, branch) {
    var inst = inv.equip[idx], id = idOf(inst), it = ITEMS[id];
    if (!it) return { ok: false, msg: 'Slot vacío' };
    if (it.cls && cls && it.cls !== cls) return { ok: false, msg: it.name + ': solo para ' + (CLASSES[it.cls] ? CLASSES[it.cls].label : it.cls) };
    if (it.only && branch !== it.only) return { ok: false, msg: it.name + ': solo para ' + it.only.charAt(0).toUpperCase() + it.only.slice(1) };
    if (level < it.lv) return { ok: false, msg: it.name + ': requiere nivel ' + it.lv };
    var base = calcStats(level, {}, cls || 'warrior');
    for (var r = 0; r < 4; r++) { var k = STAT_NAME[r].toLowerCase(); if (it.req && it.req[r] > base[k]) return { ok: false, msg: it.name + ': requiere ' + STAT_NAME[r] + ' ' + it.req[r] }; }
    var cands = TYPE_SLOTS[it.type], slot = null;
    for (var i = 0; i < cands.length; i++) if (!equip[cands[i]]) { slot = cands[i]; break; }
    if (!slot) slot = cands[0];
    var snapI = inv.equip.slice(), snapE = {}; for (var q in equip) snapE[q] = equip[q];
    var old = equip[slot] || null;
    equip[slot] = inst; inv.equip[idx] = old;
    var extra = null;   // pieza que choca con un overall
    if (it.overall && equip.bottom) { extra = equip.bottom; delete equip.bottom; }
    else if (it.type === 'bottom' && equip.top && ITEMS[idOf(equip.top)] && ITEMS[idOf(equip.top)].overall) { extra = equip.top; delete equip.top; }
    if (extra) {
      var f = inv.equip.indexOf(null);
      if (f < 0) { inv.equip = snapI; for (var z in equip) delete equip[z]; for (var y in snapE) equip[y] = snapE[y]; return { ok: false, msg: 'Inventario lleno' }; }
      inv.equip[f] = extra;
    }
    return { ok: true, slot: slot, msg: 'Equipado: ' + it.name + (extra ? ' (se quitó ' + ITEMS[idOf(extra)].name + ')' : '') };
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
    if (rnd() < 0.07) out.push({ id: 'red_potion', n: 1 });
    if (rnd() < 0.045) out.push({ id: 'blue_potion', n: 1 });
    if (rnd() < 0.01) out.push({ id: 'scroll_piece', n: 1 });
    if (rnd() < 0.012) {
      var pool = Object.keys(ITEMS).filter(function (k) { var it = ITEMS[k]; return it.kind === 'equip' && it.lv > 0 && !it.only && it.lv <= level + 5 && (!it.cls || CLASSES[it.cls]); });
      if (pool.length) { var eid = pool[Math.floor(rnd() * pool.length)], pt = potDropTier(rnd), d = { id: eid, n: 1 }; if (pt >= 0) d.inst = potNew(eid, pt, rnd); out.push(d); }
    }
    if (rnd() < DROP_CUBE) out.push({ id: 'cube_miracle', n: 1 });   // Miracle Cube: drop global de todos los enemigos, muy bajo
    return out;
  }

  function sanitize(inv, equip, cls) {
    var out = newInventory(), eqo = {}, i;
    if (inv && Array.isArray(inv.equip)) for (i = 0; i < INV_SIZE; i++) { var ce = cleanInst(inv.equip[i]); if (ce) out.equip[i] = ce; }
    if (inv && Array.isArray(inv.use)) for (i = 0; i < INV_SIZE; i++) {
      var s = inv.use[i];
      if (s && ITEMS[s.id] && ITEMS[s.id].kind === 'use') out.use[i] = { id: s.id, count: Math.max(1, Math.min(STACK_MAX, s.count | 0)) };
    }
    if (equip) SLOTS.forEach(function (sl) {
      var e = cleanInst(equip[sl]);
      if (e && TYPE_SLOTS[ITEMS[idOf(e)].type].indexOf(sl) >= 0) eqo[sl] = e;
    }); else eqo = startEquip(cls);
    return { inv: out, equip: eqo };
  }


  /* ---------- POTENCIAL ----------
   * Cada equipo (con nivel > 0 y que no sea el equipo inicial / provisional de rama) puede tener potencial: { tier: 0..3 (Rare, Epic, Unique, Legendary), lines: [3 líneas] }.
   * Línea 1 siempre del rango del equipo; las líneas 2 y 3 son del rango del equipo con probabilidad p2/p3 según el cubo y, si no, del rango inferior.
   * Valores y probabilidades basados en MapleStory (sin las líneas "basura": DEF, MP, velocidad, evasión, etc.). */
  var POT_TIERS = ['Rare', 'Epic', 'Unique', 'Legendary'], POT_COLORS = ['#66ccff', '#bb77ff', '#ffcc00', '#66ff66'];
  var BAND_PCT = { stat: [[1, 2, 3, 4], [2, 4, 6, 7], [3, 6, 9, 10], [6, 9, 12, 13]] };   // %, por rango [Rare..Legendary] y por tramo de nivel del equipo [0-30, 31-70, 71-150, 151+]
  function band(lv) { return lv <= 30 ? 0 : lv <= 70 ? 1 : lv <= 150 ? 2 : 3; }
  function flatStat(lv) { return lv <= 20 ? 1 : lv <= 40 ? 2 : lv <= 50 ? 3 : lv <= 70 ? 4 : lv <= 90 ? 5 : 6; }
  function flatHp(lv) { return Math.min(60, 5 * (Math.floor((Math.max(1, lv) - 1) / 10) + 1)); }
  var PSTATS = ['str', 'dex', 'int', 'luk'];
  // valor de una línea según el rango "de valor" v (0..3), el tipo y el nivel del equipo
  function potValue(k, v, lv) {
    var b = band(lv);
    switch (k) {
      case 'statP': case 'hpP': case 'attP': case 'mattP': return BAND_PCT.stat[v][b];
      case 'allP': return v >= 1 ? BAND_PCT.stat[v - 1][b] : 0;   // All Stats % va un rango por debajo
      case 'crit': return [2, 4, 6, 8][v];
      case 'critDmg': return [1, 3, 5, 8][v];
      case 'boss': return v >= 2 ? (v === 2 ? 30 : 40) : 0;
      case 'statF': return flatStat(lv);
      case 'hpF': return flatHp(lv);
    }
    return 0;
  }
  // líneas posibles (tipo, stat, peso) para un valor de rango v; v = -1 es el grupo "no prime" del Rare (planos)
  function potPool(it, v) {
    var P = [], weap = it.type === 'weapon', glove = it.type === 'glove';
    if (v < 0) { PSTATS.forEach(function (st) { P.push({ k: 'statF', s: st, w: 6.25 }); }); P.push({ k: 'hpF', w: 9.375 }); return P; }
    var W = [[5.56, 8.33, 0], [7.41, 11.11, 3.70], [6.90, 10.34, 3.45], [5.56, 8.33, 5.56]][v];
    PSTATS.forEach(function (st) { P.push({ k: 'statP', s: st, w: W[0] }); });
    P.push({ k: 'hpP', w: W[1] }); if (W[2]) P.push({ k: 'allP', w: W[2] });
    if (weap) { P.push({ k: it.cls === 'mage' ? 'mattP' : 'attP', w: 8 }); P.push({ k: 'crit', w: 5 }); if (v >= 2) P.push({ k: 'boss', w: 6 }); }
    if (glove) { P.push({ k: 'crit', w: 5 }); if (v >= 1) P.push({ k: 'critDmg', w: v >= 2 ? 4 : 3 }); }
    return P;
  }
  function potEligible(id) { var it = ITEMS[id]; return !!(it && it.kind === 'equip' && it.lv > 0 && !it.only); }
  function pickLine(it, v, taken, rnd) {
    var pool = potPool(it, v).filter(function (l) { return !taken.some(function (t) { return t.k === l.k && t.s === l.s; }); }), tot = 0; if (!pool.length) return null;
    pool.forEach(function (l) { tot += l.w; }); var r = rnd() * tot, c = null;
    for (var i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) { c = pool[i]; break; } } c = c || pool[pool.length - 1];
    var o = { k: c.k, v: potValue(c.k, v < 0 ? 0 : v, it.lv), pr: v }; if (c.s) o.s = c.s; return o;
  }
  // 3 líneas para un equipo del rango `tier`; p2/p3 = probabilidad de que la línea 2/3 sea del rango del equipo
  function rollLines(id, tier, p2, p3, rnd) {
    rnd = rnd || Math.random; var it = ITEMS[id], lines = [], i, pr;
    for (i = 0; i < 3; i++) {
      pr = i === 0 ? 1 : rnd() < (i === 1 ? p2 : p3) ? 1 : 0;
      var l = pickLine(it, pr ? tier : tier - 1, lines, rnd) || pickLine(it, tier, lines, rnd); if (l) lines.push(l);
    }
    return lines;
  }
  function potNew(id, tier, rnd) {   // instancia con potencial recién generado (tienda: Rare; drops: ver potDropTier)
    if (!potEligible(id)) return id; return { id: id, pot: { tier: tier, lines: rollLines(id, tier, 0.1, 0.01, rnd) } };
  }
  // potencial de un equipo que cae de un enemigo: -1 = sin potencial. Rare decente, Epic raro, Unique muy raro
  var DROP_CUBE = 0.0025;
  var DROP_POT = { rare: 0.28, epic: 0.06, unique: 0.01 };
  function potDropTier(rnd) {
    rnd = rnd || Math.random; var r = rnd(); return r < DROP_POT.unique ? 2 : r < DROP_POT.unique + DROP_POT.epic ? 1 : r < DROP_POT.unique + DROP_POT.epic + DROP_POT.rare ? 0 : -1;
  }
  // cubos: up[t] = probabilidad de subir del rango t al t+1; p2/p3 = probabilidad de línea prime en la 2ª/3ª línea; compare = muestra el resultado y se puede conservar el anterior
  var CUBES = {
    cube_miracle: { up: [0.118, 0.038, 0], p2: 0.10, p3: 0.01 },
    cube_super: { up: [0.141, 0.06, 0.024], p2: 0.10, p3: 0.01 },
    cube_black: { up: [0.16, 0.11, 0.05], p2: 0.20, p3: 0.05, compare: true }
  };
  use('cube_miracle', 'Miracle Cube', 'Reinicia el potencial de un equipo (o le da un potencial Rare si no tiene). Puede subir el rango: Rare→Epic 11.8%, Epic→Unique 3.8%.');
  use('cube_super', 'Super Miracle Cube', 'Reinicia el potencial de un equipo. Rare→Epic 14.1%, Epic→Unique 6%, Unique→Legendary 2.4%.');
  use('cube_black', 'Black Cube', 'Reinicia el potencial y te deja ELEGIR entre el nuevo y el anterior. Rare→Epic 16%, Epic→Unique 11%, Unique→Legendary 5%; más probabilidad de líneas de rango alto.');
  ITEMS.cube_miracle.sell = 500; ITEMS.cube_super.sell = 2500; ITEMS.cube_black.sell = 6000;
  SHOP.push({ id: 'cube_miracle', price: 30000, cat: 'enhance' });   // precio PROVISIONAL
  // usa un cubo sobre un equipo (id o instancia). Devuelve { inst: instancia nueva, from: rango anterior (-1 = sin potencial), to: rango nuevo, up: ¿subió? }
  function cubeCheck(cubeId, inst) {   // los cubos solo funcionan en equipos que YA tienen potencial; el Miracle Cube no sirve con potencial Legendary
    var cb = CUBES[cubeId], id = idOf(inst); if (!cb || !potEligible(id)) return false;
    var pot = inst && typeof inst === 'object' && inst.pot; if (!pot) return false;
    return !(cubeId === 'cube_miracle' && pot.tier >= 3);
  }
  function cubeUse(inst, cubeId, rnd) {
    rnd = rnd || Math.random; var cb = CUBES[cubeId], id = idOf(inst); if (!cubeCheck(cubeId, inst)) return null;
    var old = inst && typeof inst === 'object' && inst.pot ? inst.pot : null, from = old ? old.tier : -1, to = from < 0 ? 0 : from;
    if (from >= 0 && from < 3 && rnd() < cb.up[from]) to = from + 1;
    var out = toInst(inst); out = Object.assign({}, out); out.pot = { tier: to, lines: rollLines(id, to, cb.p2, cb.p3, rnd) };
    return { inst: out, from: from, to: to, up: to > from && from >= 0 };
  }
  var PNAME = { str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK' };
  function lineText(l) {
    switch (l.k) {
      case 'statP': return PNAME[l.s] + ' : +' + l.v + '%';
      case 'statF': return PNAME[l.s] + ' : +' + l.v;
      case 'allP': return 'All Stats : +' + l.v + '%';
      case 'hpP': return 'Max HP : +' + l.v + '%';
      case 'hpF': return 'Max HP : +' + l.v;
      case 'attP': return 'ATT : +' + l.v + '%';
      case 'mattP': return 'MATT : +' + l.v + '%';
      case 'crit': return 'Critical Rate : +' + l.v + '%';
      case 'critDmg': return 'Critical Damage : +' + l.v + '%';
      case 'boss': return 'Boss Monster Damage : +' + l.v + '%';
    }
    return '';
  }
  // suma de las líneas de potencial de todo el equipo puesto
  function potTotals(equip) {
    var t = { str: 0, dex: 0, int: 0, luk: 0, strP: 0, dexP: 0, intP: 0, lukP: 0, allP: 0, hpP: 0, hpF: 0, attP: 0, mattP: 0, crit: 0, critDmg: 0, boss: 0 };
    if (!equip) return t;
    for (var sl in equip) { var e = equip[sl]; if (!e || typeof e !== 'object' || !e.pot) continue;
      e.pot.lines.forEach(function (l) {
        if (l.k === 'statF') t[l.s] += l.v; else if (l.k === 'statP') t[l.s + 'P'] += l.v; else if (l.k === 'allP') t.allP += l.v; else if (l.k === 'hpP') t.hpP += l.v; else if (l.k === 'hpF') t.hpF += l.v;
        else if (l.k === 'attP') t.attP += l.v; else if (l.k === 'mattP') t.mattP += l.v; else if (l.k === 'crit') t.crit += l.v; else if (l.k === 'critDmg') t.critDmg += l.v; else if (l.k === 'boss') t.boss += l.v;
      }); }
    return t;
  }
  // valida un potencial guardado (de partidas antiguas o editadas a mano)
  function cleanPot(p) {
    if (!p || typeof p !== 'object' || !(p.tier >= 0 && p.tier <= 3) || !Array.isArray(p.lines)) return null;
    var lines = p.lines.filter(function (l) { return l && typeof l.k === 'string' && isFinite(l.v) && lineText(l); }).slice(0, 3).map(function (l) { var o = { k: l.k, v: +l.v, pr: l.pr | 0 }; if (l.s) o.s = l.s; return o; });
    return lines.length ? { tier: p.tier | 0, lines: lines } : null;
  }

  /* ---------- SCROLLS ----------
   * Cada equipo tiene `tuc` mejoras (slots). Un scroll gasta 1 slot: si acierta suma sus stats y el nombre muestra "(+X)"; si falla pierde el slot (salvo White Scroll).
   * La instancia guarda sc = { s: aciertos, f: slots perdidos por fallos, w: protección del White Scroll, d: { stat: bonus acumulado } }. */
  var SC_STATS = ['str', 'dex', 'int', 'luk', 'att', 'matt', 'def', 'mhp', 'mmp'];
  var SC_ARMOR = ['hat', 'top', 'bottom', 'cape', 'shoes'], SC_ACC = ['ring', 'earring', 'belt', 'shoulder', 'pendant', 'faceacc', 'eyeacc'];
  var WCAT = { 130: ['One-Handed Sword', 'str'], 133: ['Dagger', 'luk'], 137: ['Wand', 'int', 1], 138: ['Staff', 'int', 1], 143: ['Spear', 'str'], 145: ['Bow', 'dex'], 146: ['Crossbow', 'dex'], 147: ['Claw', 'luk'], 148: ['Knuckler', 'str'], 149: ['Gun', 'dex'] };
  var CHAOS_RATE = 0.6, CLEAN_RATE = 1;   // Clean Slate: PROVISIONAL (100%)
  function wprefix(id) { return Math.floor(+id / 10000); }
  function addScroll(id, name, icon, sc, desc, sell, pieces) {
    use(id, name, desc); var it = ITEMS[id]; it.icon = icon; it.scroll = sc; it.sell = sell;
    if (pieces) SHOP.push({ id: id, price: pieces, currency: 'scroll_piece', cat: 'scroll' });   // precios en Scroll Pieces PROVISIONALES
  }
  function gainTxt(g) { return Object.keys(g).map(function (k) { return (k === 'att' ? 'ATT' : k === 'matt' ? 'MATT' : k.toUpperCase()) + ' +' + g[k]; }).join(', '); }
  var SC_PIECES = { 100: 5, 60: 10, 10: 20 }, SC_SELL = { 100: 20, 60: 50, 10: 100 };
  [100, 60, 10].forEach(function (r) {
    var STR = ['str', 'dex', 'int', 'luk'], n = { 100: 1, 60: 2, 10: 3 }[r], rate = r / 100, desc = function (g, extra) { return 'Mejora el equipo: ' + gainTxt(g) + '. Éxito ' + r + '%. Gasta 1 mejora (si falla, también).' + (extra || ''); };
    var g = { att: n }; addScroll('scroll_glove_att' + r, 'Scroll for Glove for ATT ' + r + '%', 'scroll_' + r, { t: 'stat', g: 'glove', rate: rate, gain: g }, desc(g), SC_SELL[r], SC_PIECES[r]);
    Object.keys(WCAT).forEach(function (p) {
      if (!Object.keys(ITEMS).some(function (k) { return ITEMS[k].type === 'weapon' && wprefix(k) === +p; })) return;   // solo tipos de arma que existen en el juego
      var wc = WCAT[p], mg = wc[2], gain = {}, ak = mg ? 'matt' : 'att';
      if (r === 100) gain[ak] = 1; else if (r === 60) { gain[ak] = 2; gain[wc[1]] = 1; } else { gain[ak] = 5; gain[wc[1]] = 3; }
      addScroll('scroll_w' + p + '_' + ak + r, 'Scroll for ' + wc[0] + ' for ' + (mg ? 'Magic Attack' : 'ATT') + ' ' + r + '%', 'scroll_' + r, { t: 'stat', g: 'weapon', wp: +p, rate: rate, gain: gain }, desc(gain), SC_SELL[r], SC_PIECES[r]);
    });
    STR.forEach(function (st) {
      var ga = {}; ga[st] = n; addScroll('scroll_armor_' + st + r, 'Scroll for Armor for ' + st.toUpperCase() + ' ' + r + '%', 'scroll_' + r, { t: 'stat', g: 'armor', rate: rate, gain: ga }, desc(ga, ' Sirve para sombrero, top/overall, bottom, capa y zapatos.'), SC_SELL[r], SC_PIECES[r]);
      var gc = {}; gc[st] = n; addScroll('scroll_acc_' + st + r, 'Scroll for Accessory for ' + st.toUpperCase() + ' ' + r + '%', 'scroll_' + r, { t: 'stat', g: 'acc', rate: rate, gain: gc }, desc(gc, ' Sirve para anillos, pendientes, cinturón, hombreras, pendant y accesorios de cara/ojos.'), SC_SELL[r], 0);   // sin accesorios aún: no se venden
    });
  });
  addScroll('scroll_chaos', 'Chaos Scroll 60%', 'scroll_chaos', { t: 'chaos', rate: CHAOS_RATE }, 'Éxito 60%: cambia al azar entre -5 y +5 los stats que el equipo YA tiene (a veces todos, a veces solo algunos). Gasta 1 mejora; si acierta cuenta como (+1).', 200, 30);
  addScroll('scroll_clean', 'Clean Slate Scroll', 'scroll_clean', { t: 'clean', rate: CLEAN_RATE }, 'Recupera 1 mejora gastada por un fallo (no las de scrolls que acertaron).', 150, 25);
  addScroll('scroll_white', 'White Scroll', 'scroll_white', { t: 'white' }, 'Protege el equipo: el próximo scroll que uses en él NO gastará la mejora si falla. La protección se consume con ese scroll, acierte o falle.', 400, 50);

  function cleanSc(x, id) {
    if (!x || typeof x !== 'object') return null; var it = ITEMS[id], tuc = (it && it.tuc) || 0, o = { s: Math.max(0, x.s | 0), f: Math.max(0, x.f | 0), w: !!x.w, d: {} };
    if (o.s > tuc) o.s = tuc; if (o.s + o.f > tuc) o.f = tuc - o.s;
    if (x.d && typeof x.d === 'object') SC_STATS.forEach(function (k) { var v = x.d[k]; if (isFinite(v) && Math.round(v) !== 0) o.d[k] = Math.round(v); });
    return o.s || o.f || o.w || Object.keys(o.d).length ? o : null;
  }
  function scOf(x) { return x && typeof x === 'object' && x.sc ? x.sc : null; }
  function slotsLeft(x) { var it = ITEMS[idOf(x)], sc = scOf(x); return Math.max(0, ((it && it.tuc) || 0) - (sc ? sc.s + sc.f : 0)); }
  // stats efectivos de un equipo = base del WZ + lo que sumaron los scrolls (nunca por debajo de 0)
  function statsOf(x) {
    var it = ITEMS[idOf(x)], out = {}, sc = scOf(x), k; if (!it) return out;
    for (k in it.stats) out[k] = it.stats[k];
    if (sc) for (k in sc.d) out[k] = Math.max(0, (out[k] || 0) + sc.d[k]);
    return out;
  }
  function nameOf(x) { var it = ITEMS[idOf(x)], sc = scOf(x); return it ? it.name + (sc && sc.s ? ' (+' + sc.s + ')' : '') : ''; }
  // ¿sirve este scroll para este equipo y por qué no?
  function scrollCheck(scrollId, x) {
    var S = ITEMS[scrollId] && ITEMS[scrollId].scroll, id = idOf(x), it = ITEMS[id], sc = scOf(x); if (!S || !it || it.kind !== 'equip') return { ok: false, msg: 'No sirve para este objeto' };
    if (!((it.tuc || 0) > 0)) return { ok: false, msg: 'Este equipo no tiene mejoras' };
    if (S.t === 'clean') return sc && sc.f > 0 ? { ok: true } : { ok: false, msg: 'No hay mejoras perdidas por fallos' };
    if (slotsLeft(x) < 1) return { ok: false, msg: 'Sin mejoras disponibles' };
    if (S.t === 'white') return sc && sc.w ? { ok: false, msg: 'Ya tiene la protección activa' } : { ok: true };
    if (S.t === 'stat') {
      var fit = S.g === 'glove' ? it.type === 'glove' : S.g === 'weapon' ? it.type === 'weapon' && wprefix(id) === S.wp : S.g === 'armor' ? SC_ARMOR.indexOf(it.type) >= 0 : SC_ACC.indexOf(it.type) >= 0;
      if (!fit) return { ok: false, msg: 'No sirve para este tipo de equipo' };
    }
    if (S.t === 'chaos' && !Object.keys(statsOf(x)).some(function (k) { return statsOf(x)[k] > 0; })) return { ok: false, msg: 'No tiene stats que cambiar' };
    return { ok: true };
  }
  // usa un scroll sobre un equipo (id o instancia). Devuelve { ok, inst, success, msg, changes, protectedSlot }. No modifica la instancia original.
  function scrollUse(inst, scrollId, rnd) {
    rnd = rnd || Math.random; var chk = scrollCheck(scrollId, inst); if (!chk.ok) return { ok: false, msg: chk.msg };
    var S = ITEMS[scrollId].scroll, id = idOf(inst), out = Object.assign({}, toInst(inst)), sc0 = scOf(inst) || { s: 0, f: 0, w: false, d: {} }, sc = { s: sc0.s, f: sc0.f, w: sc0.w, d: Object.assign({}, sc0.d) }, res = { ok: true, success: true, changes: {}, msg: '' }, k;
    if (S.t === 'white') { sc.w = true; res.msg = 'Protección activa: el próximo scroll no gastará la mejora si falla.'; }
    else if (S.t === 'clean') { if (rnd() < S.rate) { sc.f--; res.msg = 'Recuperaste 1 mejora.'; } else { res.success = false; res.msg = 'El Clean Slate falló.'; } }
    else {
      var hit = rnd() < S.rate, prot = sc.w; sc.w = false;   // la protección se consume con cualquier scroll
      if (hit) {
        sc.s++; var ch = {};
        if (S.t === 'stat') ch = Object.assign({}, S.gain);
        else {   // Chaos: solo los stats que ya tiene; cuántos y cuáles es al azar; cada uno cambia entre -5 y +5
          var cur = statsOf(inst), ks = SC_STATS.filter(function (q) { return cur[q] > 0; }), n = 1 + Math.floor(rnd() * ks.length), pick = [];
          while (pick.length < n && ks.length) pick.push(ks.splice(Math.floor(rnd() * ks.length), 1)[0]);
          pick.forEach(function (q) { var dl = Math.floor(rnd() * 11) - 5; if (q === 'mhp' || q === 'mmp') dl *= 5; if (cur[q] + dl < 0) dl = -cur[q]; if (dl) ch[q] = dl; });
        }
        for (k in ch) sc.d[k] = (sc.d[k] || 0) + ch[k]; res.changes = ch;
        res.msg = '¡Éxito!' + (Object.keys(ch).length ? ' ' + Object.keys(ch).map(function (q) { return (q === 'att' ? 'ATT' : q === 'matt' ? 'MATT' : q === 'mhp' ? 'MaxHP' : q === 'mmp' ? 'MaxMP' : q.toUpperCase()) + ' ' + (ch[q] > 0 ? '+' : '') + ch[q]; }).join(', ') : ' (sin cambios)');
        if (prot) res.msg += ' La protección se consumió.';
      } else {
        res.success = false;
        if (prot) { res.protectedSlot = true; res.msg = 'Falló, pero la protección evitó perder la mejora.'; } else { sc.f++; res.msg = 'Falló: se perdió 1 mejora.'; }
      }
    }
    var cs = cleanSc(sc, id); if (cs) out.sc = cs; else delete out.sc; res.inst = out.pot || out.sc ? out : id; return res;
  }

  var api = { scrollUse: scrollUse, scrollCheck: scrollCheck, statsOf: statsOf, nameOf: nameOf, slotsLeft: slotsLeft, POT_TIERS: POT_TIERS, POT_COLORS: POT_COLORS, CUBES: CUBES, potEligible: potEligible, cubeCheck: cubeCheck, potNew: potNew, potDropTier: potDropTier, cubeUse: cubeUse, lineText: lineText, potTotals: potTotals, rollLines: rollLines, idOf: idOf, toInst: toInst, cleanInst: cleanInst, CLASSES: CLASSES, SLOTS: SLOTS, SLOT_LABEL: SLOT_LABEL, TYPE_SLOTS: TYPE_SLOTS, ITEMS: ITEMS, INV_SIZE: INV_SIZE, STACK_MAX: STACK_MAX,
    SHOP: SHOP, countItem: countItem, removeItem: removeItem, canAdd: canAdd, calcStats: calcStats, newInventory: newInventory, addItem: addItem, equipItem: equipItem, unequipSlot: unequipSlot, rollDrop: rollDrop, sanitize: sanitize, newPotions: newPotions, startEquip: startEquip, BEGINNER: BEGINNER, sanitizePotions: sanitizePotions };
  root.MapleItems = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
