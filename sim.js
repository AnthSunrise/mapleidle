/* Maple Idle - Etapa 1: lógica del juego (sin DOM, se puede probar en Node) */
(function (root) {
  'use strict';

  var C = {
    WALK: 140, JUMP_V: -600, G: 1800, CLIMB: 90,
    MOB_SPEED: 26, MOB_HP: 14, RESPAWN: 6,
    ATK_NEAR: 50, HIT_RANGE: 85, HIT_H: 45,
    STEP: 1 / 60
  };

  var DEFAULT_CFG = {
    attack: {
      swingO1: { frames: 3, delay: 140, hitFrame: 1 },
      swingO2: { frames: 3, delay: 140, hitFrame: 1 },
      throw: { frames: 3, delay: 140, hitFrame: 1 }   // misma velocidad que el ataque del Warrior (3 x 140 ms)
    },
    // clases a distancia: range (px), stars = proyectiles por volea, hits = golpes por proyectil, hitMul = fracción del daño base por golpe
    classes: {
      thief: { ranged: true, range: 230, stars: 2, hits: 2, hitMul: 0.35, speed: 700, starGap: 0.09, action: 'swingO3' },
      // Archer: 1 flecha por ataque que golpea 1 vez; misma cadencia que el Thief (3 x 140 ms + 0.12 s). Animación del arco: shoot1
      archer: { ranged: true, range: 280, stars: 1, hits: 1, hitMul: 1.0, speed: 900, starGap: 0, action: 'shoot1', proj: 'arrow' }
    },
    // id de mob del XML -> carpeta de sprites
    mobTypes: { '9010028': 'snail_blue', '9010029': 'snail_red', '9010032': 'snail_blue', '2220100': 'blue_mushroom', '2220110': 'blue_mushroom' },
    // EXP por kill y rango de mesos [min, max] (ajustables; ponlos con los valores reales de tus mobs)
    mobRewards: {
      snail_blue: { exp: 3, meso: [4, 10], touch: 8 },
      snail_red: { exp: 4, meso: [5, 12], touch: 12 },
      // Blue Mushroom (2220100 / 2220110 Crying): hp, exp, PADamage y nivel del Mob.wz; los mesos son provisionales
      blue_mushroom: { exp: 26, meso: [15, 35], touch: 63, hp: 250, level: 15 }
    }
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sign(v) { return v < 0 ? -1 : 1; }
  // velocidad de movimiento del personaje enlazado (base + buffs)
  function spd(w) { var m = 0; (w.cur.buffs || []).forEach(function (b) { m += (b.mods && b.mods.speed) || 0; }); return C.WALK * (1 + m); }
  function alive(m) { return m.state === 'move' || m.state === 'stand' || m.state === 'hit'; }

  /* ---------- EXP, niveles y mesos ---------- */
  var MAX_LEVEL = 200;
  function maxHp(lv) { return 50 + (lv - 1) * 22; }   // valores provisionales
  // HP/MP máximos = base por nivel + bonus del equipo (incMHP / incMMP del WZ)
  function gear(ch) { var MI = root.MapleItems; return MI && ch.equip ? MI.calcStats(ch.stats.level, ch.equip, ch.cls) : { def: 0, mhp: 0, mmp: 0 }; }
  function maxHpOf(ch) { return maxHp(ch.stats.level) + gear(ch).mhp; }
  function maxMpOf(ch) { return 10 + (ch.stats.level - 1) * 3 + gear(ch).mmp; }
  var DEF_K = 100;   // reducción de daño por DEF = def / (def + DEF_K)  (provisional)
  function expToNext(lv) {
    var T = root.EXPTABLE || [1000];
    if (lv - 1 < T.length) return T[lv - 1];
    return Math.round(T[T.length - 1] * Math.pow(1.08, lv - T.length));
  }
  function gainExp(w, amt, ch) {
    ch = ch || w.cur;
    var s = ch.stats;
    if (s.level >= MAX_LEVEL) return;
    s.exp += amt;
    while (s.level < MAX_LEVEL && s.exp >= expToNext(s.level)) {
      s.exp -= expToNext(s.level); s.level++;
      s.maxHp = maxHpOf(ch); s.hp = s.maxHp; s.maxMp = maxMpOf(ch); s.mp = s.maxMp;   // al subir de nivel se recupera HP y MP
      w.texts.push({ x: ch.player.x, y: ch.player.y - 90, txt: 'LEVEL UP!  Lv. ' + s.level, c: '#ffe45c', big: true, life: 1.8, t: 0 });
    }
    if (s.level >= MAX_LEVEL) s.exp = 0;
  }
  function dropLoot(w, m) {
    var MI = root.MapleItems; if (!MI || !w.inv) return;
    MI.rollDrop(w.stats.level).forEach(function (d, i) {
      var it = MI.ITEMS[d.id], ok = MI.addItem(w.inv, d.id, d.n);
      w.texts.push({ x: m.x, y: m.y - 80 - i * 18, txt: ok ? it.name : it.name + ' (inventario lleno)', c: ok ? (it.kind === 'equip' ? '#9dff8a' : '#e6e6e6') : '#ff8a8a', t: 0, life: 1.3 });
    });
  }
  function reward(w, m) {
    var r = w.cfg.mobRewards[m.kind]; if (!r) return;
    gainExp(w, r.exp, w.cur);
    w.chars.forEach(function (c) {   // party: los demás reciben 50% si la diferencia de nivel es menor a 25
      if (c !== w.cur && c.mapId === w.cur.mapId && c.player.state !== 'dead' && Math.abs(c.stats.level - w.cur.stats.level) < 25) gainExp(w, r.exp * 0.5, c);
    });
    var meso = r.meso[0] + Math.floor(Math.random() * (r.meso[1] - r.meso[0] + 1));
    w.mesos += meso;
    w.texts.push({ x: m.x, y: m.y - 62, txt: '+' + r.exp + ' EXP   +' + meso + ' mesos', c: '#8fdcff', t: 0 });
    dropLoot(w, m);
  }

  /* ---------- mapa: plataformas, aristas y navegación ---------- */
  function buildMap(data) {
    var segs = data.footholds.map(function (f) {
      var a = f.x1 <= f.x2 ? [f.x1, f.y1, f.x2, f.y2] : [f.x2, f.y2, f.x1, f.y1];
      return { id: f.id, x1: a[0], y1: a[1], x2: a[2], y2: a[3], prev: f.prev, next: f.next };
    });
    var walk = segs.filter(function (s) { return s.x1 !== s.x2; }); // los verticales son solo borde de tiles
    var segY = function (s, x) { return s.y1 + (s.y2 - s.y1) * ((x - s.x1) / (s.x2 - s.x1)); };

    // plataforma = cadena conectada de footholds caminables
    var byId = {}; walk.forEach(function (s) { byId[s.id] = s; });
    var parent = {}; walk.forEach(function (s) { parent[s.id] = s.id; });
    var find = function (a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    walk.forEach(function (s) {
      [s.prev, s.next].forEach(function (n) { if (byId[n]) parent[find(s.id)] = find(n); });
    });
    var groups = {};
    walk.forEach(function (s) { var r = find(s.id); (groups[r] = groups[r] || []).push(s); });

    var nodes = [], nodeOfSeg = {};
    Object.keys(groups).forEach(function (k) {
      var list = groups[k].sort(function (a, b) { return a.x1 - b.x1; });
      var node = { i: nodes.length, segs: list, minX: list[0].x1, maxX: Math.max.apply(null, list.map(function (s) { return s.x2; })) };
      nodes.push(node);
      list.forEach(function (s) { nodeOfSeg[s.id] = node; });
    });

    var yAt = function (n, x) {
      for (var i = 0; i < n.segs.length; i++) { var s = n.segs[i]; if (x >= s.x1 && x <= s.x2) return segY(s, x); }
      return x < n.minX ? n.segs[0].y1 : n.segs[n.segs.length - 1].y2;
    };
    var below = function (x, y, tol) {
      var best = null;
      for (var i = 0; i < walk.length; i++) {
        var s = walk[i]; if (x < s.x1 || x > s.x2) continue;
        var ys = segY(s, x);
        if (ys >= y + tol && (!best || ys < best.ys)) best = { ys: ys, node: nodeOfSeg[s.id] };
      }
      return best;
    };
    var landing = function (x, y0, y1) {
      var best = null;
      for (var i = 0; i < walk.length; i++) {
        var s = walk[i]; if (x < s.x1 || x > s.x2) continue;
        var ys = segY(s, x);
        if (ys >= y0 - 0.5 && ys <= y1 + 0.5 && (!best || ys < best.ys)) best = { ys: ys, node: nodeOfSeg[s.id] };
      }
      return best;
    };

    var ladders = data.ladders.map(function (l, i) {
      var L = { i: i, l: l.l, x: l.x, y1: l.y1, y2: l.y2, top: null };
      nodes.forEach(function (n) {
        if (L.x >= n.minX - 1 && L.x <= n.maxX + 1 && Math.abs(yAt(n, L.x) - L.y1) <= 8) L.top = n;
      });
      return L;
    });

    var edges = nodes.map(function () { return []; });
    // caer por un borde
    nodes.forEach(function (A) {
      [-1, 1].forEach(function (dir) {
        var exitX = dir < 0 ? A.minX : A.maxX;
        var b = below(exitX + dir * 2, yAt(A, exitX), 3);
        if (b && b.node !== A) edges[A.i].push({ type: 'fall', to: b.node.i, dir: dir, exitX: exitX });
      });
    });
    // saltar hacia arriba (máx. ~88 px)
    nodes.forEach(function (A) {
      nodes.forEach(function (B) {
        if (A === B) return;
        var best = null, cB = (B.minX + B.maxX) / 2;
        for (var x = B.minX; x <= B.maxX; x += 10) {
          var xa = clamp(x, A.minX, A.maxX);
          if (Math.abs(xa - x) > 45) continue;
          var dy = yAt(A, xa) - yAt(B, x);
          if (dy < 6 || dy > 88) continue;
          var score = Math.abs(xa - x) * 10 + Math.abs(x - cB) * 0.001;
          if (!best || score < best.score) best = { score: score, xa: xa, x: x };
        }
        if (best) edges[A.i].push({ type: 'jump', to: B.i, takeoffX: best.xa, landX: best.x, dir: sign(best.x - best.xa) });
      });
    });
    // cuerdas y escaleras
    ladders.forEach(function (L) {
      if (!L.top) return;
      nodes.forEach(function (N) {
        if (N === L.top) return;
        if (L.x < N.minX - 1 || L.x > N.maxX + 1) return;
        var ys = yAt(N, L.x);
        if (ys < L.y1 - 8 || ys > L.y2 + 88) return;
        edges[N.i].push({ type: 'climb', dir: 'up', to: L.top.i, ladder: L, ys: ys });
        edges[L.top.i].push({ type: 'climb', dir: 'down', to: N.i, ladder: L, ys: ys });
      });
    });

    var minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    walk.forEach(function (s) { minX = Math.min(minX, s.x1); maxX = Math.max(maxX, s.x2); maxY = Math.max(maxY, s.y1, s.y2); });
    return { nodes: nodes, edges: edges, ladders: ladders, segs: segs, nodeOfSeg: nodeOfSeg, yAt: yAt, below: below, landing: landing, minX: minX, maxX: maxX, maxY: maxY };
  }

  function bfs(map, s) {
    var n = map.nodes.length, dist = [], first = [];
    for (var i = 0; i < n; i++) { dist.push(Infinity); first.push(null); }
    dist[s] = 0; var q = [s];
    while (q.length) {
      var u = q.shift();
      map.edges[u].forEach(function (e) {
        if (dist[e.to] === Infinity) { dist[e.to] = dist[u] + 1; first[e.to] = u === s ? e : first[u]; q.push(e.to); }
      });
    }
    return { dist: dist, first: first };
  }

  /* ---------- personajes (varios en el mismo mundo) ----------
   * Cada personaje tiene su propio estado (player, stats, equip, skills, input, ai).
   * Las funciones de la simulación trabajan sobre w.player / w.stats / w.equip / w.skills / w.input / w.ai,
   * que se "enlazan" al personaje que se está procesando (bind). Al terminar cada paso queda enlazado
   * el personaje seleccionado, que es el que ven la interfaz y los controles manuales. */
  function bindZone(w, z) { w.zone = z; w.mapId = z.id; w.map = z.map; w.home = z.home; w.mobs = z.mobs; w.fx = z.fx; w.texts = z.texts; w.proj = z.proj; }
  function bind(w, c) { bindZone(w, w.zones[c.mapId]); w.cur = c; w.player = c.player; w.stats = c.stats; w.equip = c.equip; w.skills = c.skills; w.input = c.input; w.ai = c.ai; }
  function addCharacter(w, o) {
    var cl = o.cls || 'warrior', CL = root.MapleItems && root.MapleItems.CLASSES[cl], z = w.zones[o.mapId || 'henesys'], n = w.chars.length, x = z.spawnX + n * 24, lv = Math.max(1, o.level || 1), maxMp = 10 + (lv - 1) * 3;
    var c = {
      name: o.name || 'Personaje', mapId: z.id, cls: cl, look: o.look || null,
      player: { x: x, y: z.map.yAt(z.home, x), vx: 0, vy: 0, state: 'ground', node: z.home, dir: 1, atk: null, cd: 0, ladder: null, moving: false },
      stats: { level: lv, exp: o.exp || 0, mp: maxMp, maxMp: maxMp, hp: maxHp(lv), maxHp: maxHp(lv), inv: 0 },
      potions: o.potions || (root.MapleItems ? root.MapleItems.newPotions() : { hp: { id: null, pct: 50 }, mp: { id: null, pct: 30 } }), potCd: { hp: 0, mp: 0 }, deadT: 0, buffs: [],
      equip: o.equip || (root.MapleItems ? root.MapleItems.startEquip(cl) : {}),
      skills: o.skills || (root.MapleSkills ? root.MapleSkills.newSkills() : {}),
      input: { left: false, right: false, up: false, down: false, jump: false, attack: false, skill: false },
      ai: { auto: true, edge: null, target: null, avoid: null, avoidT: 0, key: null, keyT: 0, lastX: 0 }
    };
    c.stats.maxHp = maxHpOf(c); c.stats.maxMp = maxMpOf(c); if (o.hp === undefined) { c.stats.hp = c.stats.maxHp; c.stats.mp = c.stats.maxMp; }
    w.chars.push(c); return c;
  }
  function selectChar(w, i) { w.selected = clamp(i, 0, w.chars.length - 1); bind(w, w.chars[w.selected]); }

  /* ---------- mundo ---------- */
  function buildZone(w, id, data, o) {
    var map = buildMap(data), home = o.homeFh && map.nodeOfSeg[o.homeFh];
    if (!home) home = map.nodes.slice().sort(function (a, b) { return (b.maxX - b.minX) - (a.maxX - a.minX); })[0];
    var z = { id: id, proj: [], map: map, home: home, spawnX: o.spawnX !== undefined ? o.spawnX : Math.round((home.minX + home.maxX) / 2), mobs: [], fx: [], texts: [] };
    data.life.forEach(function (l) {
      if (l.type !== 'm') return;
      var node = map.nodeOfSeg[l.fh]; if (!node) return;
      var x = clamp(l.x, node.minX + 10, node.maxX - 10), kind = w.cfg.mobTypes[l.id] || 'snail_blue', r = w.cfg.mobRewards[kind] || {}, hp = r.hp || C.MOB_HP;
      z.mobs.push({
        id: l.id, kind: kind, spawnX: x, x: x, y: map.yAt(node, x), node: node,
        dir: Math.random() < 0.5 ? -1 : 1, hp: hp, maxHp: hp, state: 'move', t: Math.random() * 2
      });
    });
    w.zones[id] = z; return z;
  }
  // mapas: { id: { data, homeFh, spawnX } }. El primero ('henesys') se crea con `data`; los demás vienen de cfg.maps o de MAPLE_MAPS
  function createWorld(data, cfg) {
    var w = {
      zones: {}, cfg: Object.assign({}, DEFAULT_CFG, cfg || {}), t: 0, kills: 0,
      input: { left: false, right: false, up: false, down: false, jump: false, attack: false },
      ai: { auto: true, edge: null, target: null, avoid: null, avoidT: 0, key: null, keyT: 0, lastX: 0 },
      atkToggle: 0, killsByNode: {}, stats: { level: 1, exp: 0, mesos: 0, mp: 10, maxMp: 10 }
    };
    var MI = root.MapleItems;
    w.inv = MI ? MI.newInventory() : null;
    w.equip = root.MapleItems ? root.MapleItems.startEquip('warrior') : {};
    w.skills = root.MapleSkills ? root.MapleSkills.newSkills() : {};
    var reg = (cfg && cfg.maps) || root.MAPLE_MAPS || {};
    buildZone(w, 'henesys', data, { homeFh: 137, spawnX: 300 });
    Object.keys(reg).forEach(function (id) { if (id !== 'henesys') buildZone(w, id, reg[id].data, reg[id]); });
    w.chars = []; w.selected = 0; w.mesos = 0;
    addCharacter(w, { name: 'Guerrero', cls: 'warrior' });
    bind(w, w.chars[0]);
    return w;
  }
  // lanza un buff: party = todos los personajes vivos del mismo mapa que quien lo lanza; si ya lo tienen, se renueva la duración
  function applyBuff(w, caster, id, o) {
    o = o || {};
    var B = root.MapleBuffs && root.MapleBuffs.BUFFS[id]; if (!B) return 0;
    var n = 0;
    w.chars.forEach(function (c) {
      if (c.player.state === 'dead' || (B.party ? c.mapId !== caster.mapId : c !== caster)) return;
      var cur = c.buffs.filter(function (b) { return b.id === id; })[0];
      var dur = o.duration || B.duration, mods = o.mods || B.mods;
      if (cur) { cur.t = dur; cur.dur = dur; cur.mods = mods; }
      else c.buffs.push({ id: id, name: B.name, t: dur, dur: dur, mods: mods });
      n++;
    });
    return n;
  }
  function stepBuffs(w, dt) { var c = w.cur; if (!c.buffs.length) return; c.buffs.forEach(function (b) { b.t -= dt; }); c.buffs = c.buffs.filter(function (b) { return b.t > 0; }); }
  // mueve a un personaje a otro mapa (aparece en el punto de inicio de ese mapa)
  function travel(w, c, mapId) {
    var z = w.zones[mapId]; if (!z || c.mapId === mapId || c.player.state === 'dead') return false;
    var p = c.player, x = z.spawnX + w.chars.indexOf(c) * 24;
    c.mapId = mapId; p.node = z.home; p.x = x; p.y = z.map.yAt(z.home, x); p.state = 'ground'; p.vx = p.vy = 0; p.atk = null; p.cd = 0; p.ladder = null;
    c.ai.edge = c.ai.target = c.ai.avoid = null; c.ai.avoidT = 0;
    if (c.stats.hp <= 0) c.stats.hp = 1;
    bind(w, w.chars[w.selected]); return true;
  }

  /* ---------- jugador ---------- */
  function tryAttach(w, inp) {
    var p = w.player;
    if (!(inp.up || inp.down)) return false;
    for (var i = 0; i < w.map.ladders.length; i++) {
      var L = w.map.ladders[i];
      if (Math.abs(p.x - L.x) > 8) continue;
      var ok;
      if (p.state === 'air') ok = inp.up && p.y >= L.y1 && p.y <= L.y2;
      else ok = (inp.up && p.y > L.y1 + 8 && p.y <= L.y2 + 20) || (inp.down && p.y >= L.y1 - 10 && p.y <= L.y1 + 10);
      if (ok) {
        p.state = 'climb'; p.ladder = L; p.x = L.x; p.y = clamp(p.y, L.y1, L.y2);
        p.vx = p.vy = 0; p.atk = null; return true;
      }
    }
    return false;
  }

  function rangedCfg(w) { var c = w.cfg.classes && w.cfg.classes[w.cur.cls]; return c && c.ranged ? c : null; }
  function startAttack(w) {
    var p = w.player;
    w.atkToggle = 1 - w.atkToggle;
    var rc = rangedCfg(w), name = rc ? 'throw' : (w.atkToggle ? 'swingO1' : 'swingO2'), c = w.cfg.attack[name];
    p.atk = { name: name, t: 0, hit: false };
    p.cd = c.frames * c.delay / 1000 + 0.12;   // Thief y Warrior: mismo ritmo (0.54 s por ataque)
    w.input.attack = false;
  }

  function damageMob(w, m, dmg, color) {
    var p = w.player;
    m.hp -= dmg; w.texts.push({ x: m.x, y: m.y - 40, txt: String(dmg), c: color, t: 0 });
    if (m.hp <= 0) { m.state = 'dying'; m.t = 0; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; }
    else { m.state = 'hit'; m.t = 0.3; m.x = clamp(m.x + p.dir * 6, m.node.minX + 10, m.node.maxX - 10); }
  }
  // ataque normal: golpea a UN solo enemigo (el más cercano al frente); para varios están las skills
  function doHit(w) {
    var p = w.player, st = root.MapleItems ? root.MapleItems.calcStats(w.stats.level, w.equip, w.cur.cls) : null, best = null, bd = 1e9;
    w.mobs.forEach(function (m) {
      if (!alive(m)) return;
      var dx = (m.x - p.x) * p.dir;
      if (dx < -20 || dx > C.HIT_RANGE || Math.abs(m.y - p.y) > C.HIT_H) return;
      if (Math.abs(dx) < bd) { bd = Math.abs(dx); best = m; }
    });
    if (best) damageMob(w, best, st ? st.min + Math.floor(Math.random() * (st.max - st.min + 1)) : 7 + Math.floor(Math.random() * 7));
  }

  // ataque a distancia: lanza `stars` proyectiles hacia el enemigo más cercano al frente; cada uno pega `hits` veces (un solo objetivo)
  function doThrow(w) {
    var rc = rangedCfg(w), p = w.player, c = w.cur, st = root.MapleItems.calcStats(w.stats.level, w.equip, c.cls), best = null, bd = 1e9;
    w.mobs.forEach(function (m) {
      if (!alive(m)) return;
      var dx = (m.x - p.x) * p.dir;
      if (dx < -20 || dx > rc.range || Math.abs(m.y - p.y) > C.HIT_H) return;
      if (Math.abs(dx) < bd) { bd = Math.abs(dx); best = m; }
    });
    if (!best) return;
    for (var i = 0; i < rc.stars; i++) {
      var dmg = []; for (var k = 0; k < rc.hits; k++) dmg.push(Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * rc.hitMul)));
      w.proj.push({ x: p.x + p.dir * 18, y: p.y - 30, dir: p.dir, speed: rc.speed, wait: i * rc.starGap, target: best, owner: c, dmg: dmg, hitT: -1, life: 1.2, rot: 0, kind: rc.proj || 'star' });
    }
  }
  function stepProj(w, dt) {
    var keep = [];
    w.proj.forEach(function (q) {
      q.life -= dt; if (q.life <= 0 || q.owner.mapId !== w.mapId) return;
      if (q.wait > 0) { q.wait -= dt; keep.push(q); return; }
      if (q.hitT < 0) {
        q.x += q.dir * q.speed * dt; q.rot += dt * 25;
        var m = q.target, ty = m.y - 20; q.y += (ty - q.y) * Math.min(1, dt * 8);
        if (!alive(m)) return;   // el enemigo ya murió: la estrella se pierde
        if ((q.x - m.x) * q.dir >= -6) { q.hitT = 0; q.next = 0; q.x = m.x - q.dir * 6; }
        else { keep.push(q); return; }
      }
      // en el objetivo: aplica los golpes escalonados
      q.hitT += dt;
      while (q.next < q.dmg.length && q.hitT >= q.next * 0.08) {
        var m2 = q.target;
        if (!alive(m2)) { q.next = q.dmg.length; break; }
        bind(w, q.owner);   // la EXP y los drops van a quien lanzó la estrella
        w.texts.push({ x: m2.x + (q.next ? 8 : -8), y: m2.y - 40 - q.next * 14, txt: String(q.dmg[q.next]), c: q.skillFx ? '#ffb347' : '#ffd23f', t: 0 });
        if (q.skillFx) w.fx.push({ kind: 'sk', id: q.skillFx, tier: q.tier, x: m2.x, y: m2.y - 18, t: 0 }); else w.fx.push({ kind: 'spark', x: m2.x, y: m2.y - 18, t: 0 });
        m2.hp -= q.dmg[q.next]; q.next++;
        if (m2.hp <= 0) { m2.state = 'dying'; m2.t = 0; w.kills++; reward(w, m2); w.killsByNode[m2.node.i] = (w.killsByNode[m2.node.i] || 0) + 1; }
        else { m2.state = 'hit'; m2.t = 0.3; m2.x = clamp(m2.x + q.dir * 3, m2.node.minX + 10, m2.node.maxX - 10); }
      }
      if (q.next < q.dmg.length) keep.push(q);
    });
    w.proj = keep;
  }

  /* ---------- skills ---------- */
  // enemigos dentro del área de la skill (hacia donde mira dir), del más cercano al más lejano
  function skillTargets(w, sk, dir) {
    var p = w.player, out = [];
    w.mobs.forEach(function (m) {
      if (!alive(m)) return;
      var dx = (m.x - p.x) * dir;
      if (dx < sk.range.x1 - 15 || dx > sk.range.x2 + 15) return;
      if (m.y < p.y + sk.range.y1 || m.y - 34 > p.y + sk.range.y2) return;
      out.push({ m: m, dx: dx });
    });
    out.sort(function (a, b) { return a.dx - b.dx; });
    return out;
  }
  // skill aprendida, con "auto farm" activo, MP suficiente y al menos un enemigo en su área
  function readySkill(w, dir) {
    var SK = root.MapleSkills; if (!SK) return null;
    for (var i = 0; i < SK.ORDER.length; i++) {
      var id = SK.ORDER[i], sk = SK.SKILLS[id], st = w.skills[id];
      if (sk.buff || !st || st.level < 1 || !st.auto || (sk.cls && sk.cls !== w.cur.cls) || w.stats.mp < sk.mpCon(st.level)) continue;
      if (skillTargets(w, sk, dir).length) return id;
    }
    return null;
  }
  // skill de buff aprendida, en auto, con MP, y alguien vivo del mapa sin el buff (o a punto de perderlo)
  function readyBuff(w) {
    var SK = root.MapleSkills; if (!SK) return null;
    for (var i = 0; i < SK.ORDER.length; i++) {
      var id = SK.ORDER[i], sk = SK.SKILLS[id], st = w.skills[id];
      if (!sk.buff || !st || st.level < 1 || !st.auto || sk.cls !== w.cur.cls || w.stats.mp < sk.mpCon(st.level)) continue;
      var need = w.chars.some(function (c) {
        if (c.mapId !== w.cur.mapId || c.player.state === 'dead') return false;
        var b = c.buffs.filter(function (x) { return x.id === sk.buff; })[0];
        return !b || b.t < sk.renewAt;
      });
      if (need) return id;
    }
    return null;
  }
  function doBuffCast(w, atk) {
    var sk = atk.skill;
    applyBuff(w, w.cur, sk.buff, { duration: sk.duration(atk.level), mods: { speed: sk.speed(atk.level) } });
  }
  function startSkill(w, id) {
    var SK = root.MapleSkills, sk = SK && SK.SKILLS[id], st = sk && w.skills[id], p = w.player;
    if (!st || st.level < 1 || p.atk || (sk.cls && sk.cls !== w.cur.cls)) return false;
    var mp = sk.mpCon(st.level); if (w.stats.mp < mp) return false;
    w.stats.mp -= mp;
    p.atk = { skill: sk, level: st.level, name: id, t: 0, hit: false };
    p.cd = sk.total + 0.1; w.input.skill = false;
    return true;
  }
  // skill a distancia (Lucky Seven): lanza bulletCount estrellas al enemigo más cercano al frente; cada una pega damage(x)% del daño base
  function doRangedSkill(w, atk) {
    var p = w.player, sk = atk.skill, c = w.cur, st = root.MapleItems.calcStats(w.stats.level, w.equip, c.cls);
    var t = skillTargets(w, sk, p.dir)[0]; if (!t) return;
    for (var i = 0; i < sk.bulletCount; i++) {
      var base = st.min + Math.floor(Math.random() * (st.max - st.min + 1));
      w.proj.push({ x: p.x + p.dir * 18, y: p.y - 30, dir: p.dir, speed: sk.speed || 700, wait: i * (sk.starGap || 0.09), target: t.m, owner: c, dmg: [Math.max(1, Math.round(base * sk.damage(atk.level) / 100))], hitT: -1, life: 1.2, rot: 0, skillFx: sk.id, tier: sk.tierFor(w.stats.level) });
    }
  }
  function doSkillHit(w, atk) {
    var p = w.player, sk = atk.skill, st = root.MapleItems.calcStats(w.stats.level, w.equip, w.cur.cls);
    skillTargets(w, sk, p.dir).slice(0, sk.mobCount).forEach(function (c) {
      var m = c.m;
      for (var k = 0; k < sk.attackCount; k++) {
        var base = st.min + Math.floor(Math.random() * (st.max - st.min + 1));
        var dmg = Math.max(1, Math.round(base * sk.damage(atk.level) / 100));
        m.hp -= dmg;
        w.texts.push({ x: m.x, y: m.y - 40 - k * 14, txt: String(dmg), c: '#ffb347', t: 0 });
      }
      w.fx.push({ kind: 'hit', id: sk.id, life: sk.hit.length * sk.hitDelay / 1000, x: m.x, y: m.y - 18, t: 0 });
      if (m.hp <= 0) { m.state = 'dying'; m.t = 0; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; }
      else { m.state = 'hit'; m.t = 0.3; m.x = clamp(m.x + p.dir * 6, m.node.minX + 10, m.node.maxX - 10); }
    });
  }
  // MP (valores provisionales: máx 10 + 3 por nivel; regenera 3% del máximo por segundo) y efectos visuales
  function stepExtras(w, dt) {
    var s = w.stats, c = w.cur, MI = root.MapleItems;
    s.maxMp = maxMpOf(c); s.maxHp = maxHpOf(c);
    s.mp = Math.min(s.maxMp, s.mp + Math.max(0.3, s.maxMp * 0.03) * dt);
    s.hp = Math.min(s.maxHp, s.hp + Math.max(0.2, s.maxHp * 0.003) * dt);
    if (!MI || !w.inv) return;
    ['hp', 'mp'].forEach(function (k) {   // pociones automáticas: usa la asignada cuando el % baja del umbral
      c.potCd[k] = Math.max(0, c.potCd[k] - dt);
      var slot = c.potions[k], it = slot && MI.ITEMS[slot.id];
      if (c.potCd[k] > 0 || !it || !it.heal || !it.heal[k]) return;
      if ((k === 'hp' ? s.hp / s.maxHp : s.mp / s.maxMp) * 100 > slot.pct) return;
      for (var i = 0; i < w.inv.use.length; i++) {
        var stack = w.inv.use[i];
        if (!stack || stack.id !== slot.id) continue;
        stack.count--; if (stack.count <= 0) w.inv.use[i] = null;
        if (k === 'hp') s.hp = Math.min(s.maxHp, s.hp + it.heal.hp); else s.mp = Math.min(s.maxMp, s.mp + it.heal.mp);
        c.potCd[k] = 1;
        w.texts.push({ x: w.player.x, y: w.player.y - 70, txt: '+' + it.heal[k] + ' ' + k.toUpperCase(), c: k === 'hp' ? '#ff9a9a' : '#8fc8ff', t: 0 });
        break;
      }
    });
  }
  // daño por contacto: los enemigos que se mueven o están quietos dañan al tocar; luego 2 s de invulnerabilidad
  function stepTouch(w, dt) {
    var p = w.player, s = w.stats;
    s.inv = Math.max(0, s.inv - dt);
    if (s.inv > 0) return;
    for (var i = 0; i < w.mobs.length; i++) {
      var m = w.mobs[i], r = w.cfg.mobRewards[m.kind];
      if ((m.state !== 'move' && m.state !== 'stand') || !r || !r.touch) continue;
      if (Math.abs(m.x - p.x) > 26 || p.y < m.y - 34 || p.y - 70 > m.y) continue;
      var def = gear(w.cur).def, dmg = Math.max(1, Math.round(r.touch * (0.85 + Math.random() * 0.3) * (1 - def / (def + DEF_K))));   // la DEF del equipo reduce el daño
      s.hp -= dmg; s.inv = 2;
      w.texts.push({ x: p.x, y: p.y - 75, txt: '-' + dmg, c: '#ff6b6b', t: 0, life: 1 });
      if (s.hp <= 0) killChar(w);
      return;
    }
  }
  // al morir: pierde el 5% de la EXP necesaria para el siguiente nivel (nunca baja de nivel ni de 0) y revive a los 10 s
  function killChar(w) {
    var p = w.player, s = w.stats, loss = Math.min(s.exp, 0.05 * expToNext(s.level));
    s.hp = 0; s.exp -= loss; w.cur.deadT = 10; w.cur.buffs = [];
    p.state = 'dead'; p.atk = null; p.ladder = null; p.vx = p.vy = 0; p.moving = false;
    w.texts.push({ x: p.x, y: p.y - 80, txt: 'Has muerto  -' + Math.round(loss * 10) / 10 + ' EXP', c: '#ff9a9a', t: 0, life: 2, big: true });
  }
  function stepDead(w, dt) {
    var c = w.cur, p = w.player, s = w.stats;
    c.deadT -= dt;
    if (c.deadT > 0) return;
    var x = w.zone.spawnX + w.chars.indexOf(c) * 24;   // revive en el punto de inicio del mapa con el HP completo
    p.node = w.home; p.x = x; p.y = w.map.yAt(w.home, x); p.state = 'ground'; p.vx = p.vy = 0; p.atk = null; p.cd = 0;
    w.ai.edge = null; w.ai.key = null; w.ai.avoid = null;
    s.hp = s.maxHp; s.inv = 2;
    w.texts.push({ x: p.x, y: p.y - 80, txt: 'Reviviste', c: '#9dff8a', t: 0, life: 1.2 });
  }
  function stepFx(w, dt) {
    w.fx.forEach(function (f) { f.t += dt; });
    w.fx = w.fx.filter(function (f) { return f.t < (f.life || 0.48); });
  }

  function respawnPlayer(w) {
    var p = w.player; p.node = w.home; p.x = w.zone.spawnX; p.y = w.map.yAt(w.home, p.x);
    p.state = 'ground'; p.vx = p.vy = 0; p.atk = null; p.ladder = null;
  }

  function stepPlayer(w, dt) {
    var p = w.player, inp = w.input, map = w.map;
    var mv = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    p.cd = Math.max(0, p.cd - dt);
    p.moving = false;

    if (p.atk) {
      var hitAt, total, sk = p.atk.skill, c;
      if (sk) { hitAt = sk.hitAt; total = sk.total; }
      else { c = w.cfg.attack[p.atk.name]; hitAt = c.hitFrame * c.delay / 1000; total = c.frames * c.delay / 1000; }
      p.atk.t += dt;
      if (!p.atk.hit && p.atk.t >= hitAt) { p.atk.hit = true; if (sk && sk.buff) doBuffCast(w, p.atk); else if (sk && sk.ranged) doRangedSkill(w, p.atk); else if (sk) doSkillHit(w, p.atk); else if (rangedCfg(w)) doThrow(w); else doHit(w); }
      if (p.atk.t >= total) p.atk = null;
    }

    if (p.state === 'ground') {
      if (!p.atk) {
        if (inp.jump) {
          p.state = 'air'; p.vy = C.JUMP_V; p.vx = mv * spd(w); if (mv) p.dir = mv;
        } else if (tryAttach(w, inp)) {
          // agarrado a cuerda/escalera
        } else {
          if (mv) {
            p.dir = mv; p.moving = true;
            var nx = p.x + mv * spd(w) * dt;
            if (nx < p.node.minX || nx > p.node.maxX) {
              if (map.below(nx, p.y, 3)) { p.x = nx; p.state = 'air'; p.vy = 0; }
              else { p.x = clamp(nx, p.node.minX, p.node.maxX); p.moving = false; }
            } else p.x = nx;
          }
          if (p.state === 'ground') {
            p.y = map.yAt(p.node, p.x);
            if (inp.skill && p.cd <= 0 && startSkill(w, inp.skill)) { /* lanzó la skill */ }
            else if (inp.attack && p.cd <= 0) startAttack(w);
          }
        }
      }
    } else if (p.state === 'air') {
      p.vx = mv * spd(w); if (mv) p.dir = mv;
      p.vy += C.G * dt;
      var oy = p.y;
      p.x = clamp(p.x + p.vx * dt, map.minX, map.maxX);
      p.y += p.vy * dt;
      if (!tryAttach(w, inp) && p.vy > 0) {
        var l = map.landing(p.x, oy, p.y);
        if (l) { p.y = l.ys; p.node = l.node; p.state = 'ground'; p.vx = p.vy = 0; }
      }
      if (p.y > map.maxY + 600) respawnPlayer(w);
    } else { // climb
      var L = p.ladder, dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      p.x = L.x; p.y += dy * C.CLIMB * dt; p.moving = dy !== 0;
      if (inp.jump) {
        p.state = 'air'; p.ladder = null; p.vx = mv * spd(w); p.vy = mv ? -300 : 0; if (mv) p.dir = mv;
      } else if (inp.up && p.y <= L.y1 + 6 && L.top) {
        p.node = L.top; p.y = map.yAt(L.top, L.x); p.state = 'ground'; p.ladder = null;
      } else p.y = clamp(p.y, L.y1, L.y2);
    }
    inp.jump = false;
  }

  /* ---------- IA idle: busca el enemigo más cercano (incluso en otro piso) y lo ataca ---------- */
  function stepAI(w, dt) {
    var p = w.player, inp = w.input, a = w.ai, map = w.map;
    inp.left = inp.right = inp.up = inp.down = inp.jump = inp.attack = inp.skill = false;
    var walkTo = function (x, tol) {
      var d = x - p.x;
      if (Math.abs(d) <= tol) return true;
      if (d > 0) inp.right = true; else inp.left = true;
      return false;
    };
    if (a.avoidT > 0) { a.avoidT -= dt; if (a.avoidT <= 0) a.avoid = null; }
    if (p.atk) return;

    var e = a.edge;
    if (p.state === 'air') {
      if (!e) return;
      if (e.type === 'jump') walkTo(e.landX, 3);
      else if (e.type === 'climb' && e.dir === 'up') inp.up = true;
      else if (e.type === 'fall' && Math.abs(p.x - e.exitX) < 6) { if (e.dir > 0) inp.right = true; else inp.left = true; }
      return;
    }
    if (p.state === 'climb') {
      var L = p.ladder;
      if (e && e.type === 'climb' && e.dir === 'down') {
        if (p.y >= Math.min(e.ys, L.y2) - 3) inp.jump = true; else inp.down = true;
      } else inp.up = true;
      return;
    }

    // en el suelo: primero renovar buffs del party, luego elegir objetivo
    if (p.cd <= 0) { var bk = readyBuff(w); if (bk) { inp.skill = bk; return; } }
    var r = bfs(map, p.node.i), t = null, best = Infinity;
    w.mobs.forEach(function (m) {
      if (!alive(m) || m === a.avoid) return;
      var d = r.dist[m.node.i]; if (d === Infinity) return;
      var s = d * 10000 + Math.abs(m.x - p.x);
      if (s < best) { best = s; t = m; }
    });
    a.target = t; a.edge = null;
    if (!t) { a.key = null; return; }

    var key = 'same';
    if (t.node === p.node) {
      var dx = t.x - p.x;
      var skId = readySkill(w, dx >= 0 ? 1 : -1);
      if (skId) { p.dir = dx >= 0 ? 1 : -1; if (p.cd <= 0) inp.skill = skId; }   // auto farm: usa la skill si hay enemigos en su área
      else if (Math.abs(dx) > (rangedCfg(w) ? rangedCfg(w).range * 0.8 : C.ATK_NEAR)) { if (dx > 0) inp.right = true; else inp.left = true; }
      else { p.dir = dx >= 0 ? 1 : -1; if (p.cd <= 0) inp.attack = true; }
    } else {
      e = r.first[t.node.i]; a.edge = e; key = e;
      if (e.type === 'fall') walkTo(e.exitX + e.dir * 8, 0);
      else if (e.type === 'jump') { if (walkTo(e.takeoffX, 2.5)) inp.jump = true; }
      else if (e.type === 'climb') {
        var Lr = e.ladder;
        if (walkTo(Lr.x, 2.5)) {
          if (e.dir === 'up') {
            if (p.y <= Lr.y2 + 20 && p.y > Lr.y1 + 8) inp.up = true; else { inp.up = true; inp.jump = true; }
          } else inp.down = true;
        }
      }
    }
    // anti-atasco: si el mismo plan dura demasiado, ignorar ese objetivo un rato
    if (key === a.key && key !== 'same') { a.keyT += dt; if (a.keyT > 12) { a.avoid = t; a.avoidT = 10; a.keyT = 0; } }
    else { a.key = key; a.keyT = 0; }
  }

  /* ---------- enemigos ---------- */
  function stepMobs(w, dt) {
    w.mobs.forEach(function (m) {
      switch (m.state) {
        case 'dying': m.t += dt; if (m.t >= 0.5) { m.state = 'dead'; m.t = C.RESPAWN; } break;
        case 'dead':
          m.t -= dt;
          if (m.t <= 0) { m.state = 'move'; m.hp = m.maxHp; m.x = m.spawnX; m.t = 1 + Math.random() * 2; m.dir = Math.random() < 0.5 ? -1 : 1; }
          break;
        case 'hit': m.t -= dt; if (m.t <= 0) { m.state = 'move'; m.t = 1 + Math.random() * 2; } break;
        default:
          m.t -= dt;
          if (m.t <= 0) {
            m.state = Math.random() < 0.7 ? 'move' : 'stand';
            if (m.state === 'move') m.dir = Math.random() < 0.5 ? -1 : 1;
            m.t = 1.5 + Math.random() * 2.5;
          }
          if (m.state === 'move') {
            m.x += m.dir * C.MOB_SPEED * dt;
            if (m.x < m.node.minX + 10) { m.x = m.node.minX + 10; m.dir = 1; }
            else if (m.x > m.node.maxX - 10) { m.x = m.node.maxX - 10; m.dir = -1; }
          }
      }
      m.y = w.map.yAt(m.node, m.x);
    });
    w.texts.forEach(function (tx) { tx.t += dt; tx.y -= 40 * dt; });
    w.texts = w.texts.filter(function (tx) { return tx.t < (tx.life || 0.8); });
  }

  function step(w, dt) {
    w.t += dt;
    w.chars.forEach(function (c) {
      bind(w, c);
      if (w.player.state === 'dead') { stepDead(w, dt); return; }
      stepBuffs(w, dt);
      if (w.ai.auto) stepAI(w, dt);
      stepPlayer(w, dt);
      stepTouch(w, dt);
      if (w.player.state === 'dead') return;   // murió en este paso: sin regeneración ni pociones
      stepExtras(w, dt);
    });
    Object.keys(w.zones).forEach(function (id) {
      var z = w.zones[id]; bindZone(w, z);
      stepMobs(w, dt); stepFx(w, dt);
      z.fx = w.fx; z.texts = w.texts;
      stepProj(w, dt);
      z.fx = w.fx; z.texts = w.texts; z.proj = w.proj;   // stepFx/stepMobs reasignan los arreglos filtrados
    });
    bind(w, w.chars[w.selected]);
  }

  var api = { C: C, createWorld: createWorld, step: step, STEP: C.STEP, bfs: bfs, alive: alive, expToNext: expToNext, maxHp: maxHp, MAX_LEVEL: MAX_LEVEL, addCharacter: addCharacter, selectChar: selectChar, travel: travel, applyBuff: applyBuff };
  root.MapleSim = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
