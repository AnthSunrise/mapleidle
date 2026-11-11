require('../exptable.js');
require('../itemdata.js');
const I = require('../items.js');
const S = require('../sim.js');
const DATA = require('../mapdata.js');
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA'), m); if (!c) process.exitCode = 1; };

ok(Object.keys(I.ITEMS).filter(k => I.ITEMS[k].kind === 'equip').length >= 91, '91 equipos reales cargados del WZ');
ok(I.ITEMS['1302077'].name === "Beginner Warrior's Sword" && I.ITEMS['1302077'].stats.att === 30, 'Beginner Warrior\'s Sword: nombre y ATT 30 del WZ');
ok(I.ITEMS['1302211'].cls === 'warrior', 'Maple Sword solo Warrior (override)');
ok(I.ITEMS['1052646'].overall && !I.ITEMS['1040009'].overall, 'Longcoat es overall; Coat no');

// stats y daño
const sw = I.startEquip('warrior');
ok(sw.top === '1052646' && sw.shoes === '1072850' && sw.weapon === '1302077', 'equipo inicial: Adventure Suit, Adventure Shoes y arma de la clase');
ok(I.startEquip('thief').weapon === '1472061', 'Thief empieza con Beginner Thief Wrist Guards');
const s1 = I.calcStats(1, sw, 'warrior');
ok(s1.def === 7 && s1.att === 30, 'DEF 5+2 y ATT 30 del equipo inicial');
const a = I.calcStats(30, { weapon: '1302183' }, 'warrior'), b = I.calcStats(30, { weapon: '1302043' }, 'warrior');
ok(b.max > a.max && b.str === a.str + 5, 'Gladius (ATT 57, STR +5) pega más que Sabre');
ok(I.calcStats(1, {}, 'warrior').max >= 1, 'sin arma el daño es >= 1');

// equipar con requisitos
const inv = I.newInventory(), eq = I.startEquip('warrior');
['1302183', '1002002', '1002007', '1002126', '1302211'].forEach(id => I.addItem(inv, id, 1));
let r = I.equipItem(inv, eq, 1, 0, 'warrior');
ok(!r.ok && /nivel 15/.test(r.msg) && eq.weapon === '1302077', 'Sabre bloqueado a nivel 1: ' + r.msg);
r = I.equipItem(inv, eq, 15, 0, 'warrior');
ok(r.ok && eq.weapon === '1302183' && inv.equip[0] === '1302077', 'Sabre a nivel 15: equipa y la vieja vuelve al inventario');
r = I.equipItem(inv, eq, 20, 1, 'warrior'); ok(r.ok && eq.hat === '1002002', 'Metal Coif (Lv 10) se equipa');
r = I.equipItem(inv, eq, 15, 2, 'warrior'); ok(r.ok && eq.hat === '1002007', 'Steel Full Helm (STR 45): a Lv15 el Warrior ya tiene STR de sobra');
r = I.equipItem(inv, eq, 20, 3, 'warrior'); ok(!r.ok && /solo para Thief/.test(r.msg), 'gorro de Thief bloqueado para Warrior: ' + r.msg);
r = I.equipItem(inv, eq, 40, 4, 'thief'); ok(!r.ok && /solo para Warrior/.test(r.msg), 'Maple Sword bloqueada para Thief');
r = I.equipItem(inv, eq, 40, 4, 'warrior'); ok(r.ok && eq.weapon === '1302211', 'Maple Sword para Warrior');

// overall: Longcoat ocupa Top y Bottom
const inv2 = I.newInventory(), eq2 = { top: '1040015', bottom: '1060008', weapon: '1302077' };
I.addItem(inv2, '1052646', 1);
r = I.equipItem(inv2, eq2, 20, 0, 'warrior');
ok(r.ok && eq2.top === '1052646' && !eq2.bottom && inv2.equip.includes('1060008') && inv2.equip.includes('1040015'), 'equipar Longcoat devuelve Coat y Pants al inventario');
I.addItem(inv2, '1060009', 1);
r = I.equipItem(inv2, eq2, 20, inv2.equip.indexOf('1060009'), 'warrior');
ok(r.ok && eq2.bottom === '1060009' && !eq2.top && inv2.equip.includes('1052646'), 'equipar Pants devuelve el Longcoat');
const inv3 = I.newInventory(); for (let i = 0; i < 128; i++) I.addItem(inv3, '1002002', 1); inv3.equip[5] = '1052646';
const eq3 = { top: '1040015', bottom: '1060008' }; r = I.equipItem(inv3, eq3, 20, 5, 'warrior');
ok(!r.ok && eq3.top === '1040015' && eq3.bottom === '1060008' && inv3.equip[5] === '1052646', 'Longcoat con inventario lleno: se cancela sin perder nada');

// inventario lleno
const full = I.newInventory();
for (let i = 0; i < 128; i++) I.addItem(full, '1002002', 1);
ok(I.addItem(full, '1002002', 1) === false, 'inventario EQUIP lleno rechaza más (128 slots)');
ok(I.unequipSlot(full, { hat: '1002007' }, 'hat').ok === false, 'no se puede desequipar con inventario lleno');
const u = I.newInventory(); I.addItem(u, 'red_potion', 10050);
ok(u.use[0].count === 9999 && u.use[1].count === 51, 'pociones: stack de 9999 + 51');

// sanitize: guardados viejos
const sa = I.sanitize(undefined, undefined, 'thief');
ok(sa.equip.weapon === '1472061' && sa.equip.top === '1052646' && sa.inv.equip.length === 128, 'personaje nuevo arranca con el equipo inicial');
const sb = I.sanitize({ equip: ['fake_item', 'sword_2', '1002002'], use: [{ id: 'sword_1', count: 5 }] }, { hat: 'sword_1', weapon: 'sword_1', top: 'hat_1' }, 'warrior');
ok(sb.inv.equip[0] === null && sb.inv.equip[1] === '1302183' && sb.inv.equip[2] === '1002002' && sb.inv.use[0] === null && !sb.equip.hat && sb.equip.weapon === '1302077' && !sb.equip.top, 'ids viejos: se convierten (sword_2 -> Sabre) o se descartan');

// DEF reduce el daño de contacto
function touchDmg(def) {
  const w = S.createWorld(DATA, {}); const c = w.chars[0]; c.ai.auto = false; c.equip = def ? { top: '1040009', bottom: '1060009', shoes: '1072051', hat: '1002011', glove: '1082005', weapon: '1302077' } : { weapon: '1302077' };
  c.stats.level = 60; const m = w.mobs[0]; m.state = 'move'; m.x = c.player.x; m.y = c.player.y; m.node = c.player.node; m.kind = 'snail_blue';
  w.cfg.mobRewards.snail_blue.touch = 600; let tot = 0, n = 0;
  for (let k = 0; k < 40; k++) { c.stats.inv = 0; c.stats.hp = 1300; const h0 = 1300; S.step(w, S.STEP); if (c.stats.hp < h0) { tot += h0 - c.stats.hp; n++; } m.state = 'move'; m.x = c.player.x; m.y = c.player.y; m.node = c.player.node; }
  return n ? tot / n : 0;
}
const d0 = touchDmg(false), d1 = touchDmg(true);
console.log('  daño de contacto medio: sin equipo', d0.toFixed(1), 'con equipo', d1.toFixed(1));
ok(d0 > 100 && d1 < d0 - 5 && d1 > 0, 'la DEF del equipo reduce el daño recibido');

// HP/MP del equipo y simulación
const w = S.createWorld(DATA, {}); w.chars[0].equip = { top: '1040009', weapon: '1302077' }; S.step(w, S.STEP);
ok(w.stats.maxHp === 50 + 10, 'Steel Corporal da +10 HP máximo');
for (let i = 0; i < 600 * 60; i++) S.step(w, S.STEP);
const eqCount = w.inv.equip.filter(Boolean).length, useCount = w.inv.use.filter(Boolean).reduce((n, s) => n + s.count, 0);
console.log(`10 min: nivel ${w.stats.level}, kills ${w.kills}, equipos dropeados ${eqCount}, pociones+scroll pieces ${useCount}`);
ok(useCount > 0, 'los enemigos sueltan objetos USE');
