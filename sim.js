/* Maple Idle - Etapa 1: lógica del juego (sin DOM, se puede probar en Node) */
(function (root) {
  'use strict';

  var C = {
    WALK: 140, JUMP_V: -600, G: 1800, DROP_MAX: 350, DROP_PRONE: 0.22, DROP_HOP: -170, DASH_WIND: 0.12, DASH_DUR: 0.24, CLIMB: 90,
    MOB_SPEED: 26, MOB_HP: 14, RESPAWN: 6,
    ATK_NEAR: 50, HIT_RANGE: 85, HIT_H: 45,
    STEP: 1 / 60
  };

  var DEFAULT_CFG = {
    aim: { ratio: 0.2, minMargin: 40, pad: 40 },
    attack: {
      swingO1: { frames: 3, delay: 140, hitFrame: 1 },
      swingO2: { frames: 3, delay: 140, hitFrame: 1 },
      throw: { frames: 3, delay: 140, hitFrame: 1 }
    },
    classes: {
      thief: { ranged: true, range: 230, stars: 2, hits: 1, hitMul: 0.35, speed: 700, starGap: 0.09, action: 'swingO3' },
      mage: { hitRange: 115, near: 80 },
      archer: { ranged: true, range: 280, stars: 1, hits: 1, hitMul: 1.0, speed: 900, starGap: 0, action: 'shoot1', proj: 'arrow' },
      pirate: {}
    },
    // Agregamos el ID 2230100 para el Octopus
    // Field bosses: un solo punto de aparición fijo por mapa (x, fh = coordenadas del mapa; respawn en segundos de juego). expMul/hpMul/meso se ajustan en mobRewards del jefe.
    fieldBosses: { mushroom: [{ id: '6130101', kind: 'mushmom', x: 97, fh: 124, respawn: 900, drops: 10 }] },
    mobTypes: { '6130101': 'mushmom', '9010028': 'snail_blue', '9010029': 'snail_red', '9010032': 'snail_blue', '2220100': 'blue_mushroom', '2220110': 'blue_mushroom', '5150003': 'golem', '3230101': 'wraith', '5130103': 'swamp', '1120100': 'octopus', '1210102': 'orange_mushroom', '0210100': 'pig', '1210100': 'slime', '2230102': 'wild_boar', '2230112': 'wild_boar'},
    expMul: 1.4,
    // por mob puedes añadir hpMul (multiplica su vida) y expMul (multiplica su EXP); 1 por defecto. Ej.: swamp: { ..., hpMul: 2, expMul: 2 }
    mobRewards: {
      snail_blue: { exp: 3, meso: [4, 10], touch: 8 },
      snail_red: { exp: 4, meso: [5, 12], touch: 12 },
      blue_mushroom: { exp: 26, meso: [15, 35], touch: 63, hp: 250, level: 15 },
      golem: { exp: 47, meso: [30, 70], touch: 84, hp: 650, level: 26 },
      wraith: { exp: 131, meso: [60, 140], touch: 214, hp: 4600, level: 44, undead: true },
      swamp: { exp: 200, meso: [90, 200], touch: 242, hp: 5280, level: 47, hpMul: 2.7 },
      octopus: { exp: 95, meso: [50, 120], touch: 130, hp: 2800, level: 35 },
	  orange_mushroom: { exp: 26, meso: [15, 30], touch: 63, hp: 250, level: 15 },
      pig: { exp: 20, meso: [10, 21], touch: 25, hp: 150, level: 12 },
      slime: { exp: 12, meso: [10, 21], touch: 25, hp: 80, level: 7 },
	  mushmom: { exp: 280, meso: [600, 1200], touch: 123, hp: 2500, level: 18, hpMul: 4, expMul: 3 },   // field boss
	  wild_boar: { exp: 267, meso: [82, 165], touch: 346, hp: 8000, level: 55, hpMul: 2.0}
    }
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sign(v) { return v < 0 ? -1 : 1; }
  // velocidad de movimiento del personaje enlazado (base + buffs)
  // bonos de un personaje: pasivas aprendidas + buffs activos. speed/hpPct/mpPct/crit/critDmg en fracción; def en puntos; eva en puntos; range en px; absorb = fracción del daño que paga el MP
  var MOD_KEYS = ['speed', 'hpPct', 'mpPct', 'hpLv', 'mpLv', 'def', 'eva', 'crit', 'critDmg', 'range', 'absorb', 'att', 'pStr', 'pDex', 'pLuk', 'mastery', 'atkSpeed', 'reflect', 'reflectMax', 'pInt', 'matt', 'hpRec', 'mpRec', 'recT', 'physReduce'];
  function mods(c) {
    var r = {}, SK = root.MapleSkills; MOD_KEYS.forEach(function (k) { r[k] = 0; });
    if (SK && c.skills) SK.ORDER.forEach(function (id) {
      var sk = SK.SKILLS[id], st = c.skills[id];
      if (!sk || !sk.passiveSkill || !st || st.level < 1 || !skillAllowed(c, sk)) return;
      var f = sk.fx ? sk.fx(st.level) : {}; MOD_KEYS.forEach(function (k) { r[k] += f[k] || 0; });
    });
    (c.buffs || []).forEach(function (b) { if (b.mods) MOD_KEYS.forEach(function (k) { r[k] += b.mods[k] || 0; }); });
    return r;
  }
  function spd(w) { return C.WALK * (1 + mods(w.cur).speed); }
  var DMG_STEP = 34;   // separación vertical entre los números de golpes consecutivos de una misma skill
  function alive(m) { return m.state === 'move' || m.state === 'stand' || m.state === 'hit'; }

  /* ---------- EXP, niveles y mesos ---------- */
  var MAX_LEVEL = 200;
  // HP/MP por nivel de Swordie (GameConstants.INC_HP_MP): Lv1 = 50 HP / 5 MP; hasta el Lv10 (Beginner) +16 HP / +12 MP por nivel; desde el Lv11 los de la clase.
  // HP = máximo de la columna de HP por nivel (como el servidor); MP = columna oficial de MP por nivel. Lv30: Warrior 1554/233, Mage 474/593, Archer y Thief 674/433, Pirate 714/553.
  var INC = { beginner: [16, 12], warrior: [68, 6], mage: [14, 24], archer: [24, 16], thief: [24, 16], pirate: [26, 22] };
  function baseHp(lv, cls) { var g = INC[cls] || INC.beginner; return 50 + 16 * (Math.min(lv, 10) - 1) + g[0] * Math.max(0, lv - 10); }
  function baseMp(lv, cls) { var g = INC[cls] || INC.beginner; return 5 + 12 * (Math.min(lv, 10) - 1) + g[1] * Math.max(0, lv - 10); }
  function maxHp(lv, cls) { return baseHp(lv, cls); }
  // HP/MP máximos = base por nivel + bonus del equipo (incMHP / incMMP del WZ)
  // stats de combate del personaje activo: equipo + rama + bonos de pasivas/buffs (ATT, STR/DEX, maestría)
  function cstatsOf(c) { var m = mods(c); return root.MapleItems.calcStats(c.stats.level, c.equip, c.cls, c.branch, { att: m.att, matt: m.matt, int: m.pInt, str: m.pStr, dex: m.pDex, luk: m.pLuk, mastery: m.mastery }); }   // stats con pasivas y buffs (la ventana de stats usa lo mismo que el combate)
  function cstats(w) { return cstatsOf(w.cur); }
  function gear(ch) { var MI = root.MapleItems; return MI && ch.equip ? MI.calcStats(ch.stats.level, ch.equip, ch.cls, ch.branch) : { def: 0, mhp: 0, mmp: 0 }; }
  function maxHpOf(ch) { var m = mods(ch); return Math.round((baseHp(ch.stats.level, ch.cls) + gear(ch).mhp + m.hpLv * ch.stats.level) * (1 + m.hpPct)); }   // hpLv = lv2mhp (HP por nivel del personaje), hpPct = mhpR
  function maxMpOf(ch) { var m = mods(ch); return Math.round((baseMp(ch.stats.level, ch.cls) + gear(ch).mmp + m.mpLv * ch.stats.level) * (1 + m.mpPct)); }
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
      if (ch.mapId === w.mapId && ch.player) beFx(w, 'LevelUp', { x: ch.player.x, y: ch.player.y, follow: ch.player });
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
  // Enemigos ÉLITE: tras `kills` muertes en un mapa, el siguiente respawn de esa muerte sale como élite (mismo mob, más grande, mucho más HP/EXP/mesos/daño y más drops)
  var ELITE = { kills: 75, hpMul: 15, expMul: 20, mesoMul: 20, dmgMul: 2, scale: 1.5, drops: 5 };
  function eliteCfg(w) { return Object.assign({}, ELITE, w.cfg.elite || {}); }
  var PARTY_BONUS = 0.10;   // +10% de EXP por cada compañero de party en el mapa
  function reward(w, m) {
    var r = w.cfg.mobRewards[m.kind]; if (!r) return;
    var EL = eliteCfg(w), isElite = !!m.elite, isBoss = !!m.boss;
    var xp = r.exp * (r.expMul || 1) * (w.cfg.expMul || 1) * (isElite ? EL.expMul : 1);   // expMul: multiplicador global de EXP (ajusta el ritmo: ~2 h hasta Lv30 con un party de 5)
    // party: los demás reciben 50% si la diferencia de nivel es menor a 25; bono de EXP de party: +PARTY_BONUS por cada miembro extra (para todos)
    var mates = w.chars.filter(function (c) { return c !== w.cur && c.mapId === w.cur.mapId && c.player.state !== 'dead' && Math.abs(c.stats.level - w.cur.stats.level) < 25; });
    xp *= 1 + (w.cfg.partyBonus !== undefined ? w.cfg.partyBonus : PARTY_BONUS) * mates.length;
    gainExp(w, xp, w.cur);
    mates.forEach(function (c) { gainExp(w, xp * 0.5, c); });
    var meso = (r.meso[0] + Math.floor(Math.random() * (r.meso[1] - r.meso[0] + 1))) * (isElite ? EL.mesoMul : 1);
    w.mesos += meso;
    w.texts.push({ x: m.x, y: m.y - 62, txt: '+' + Math.round(xp) + ' EXP   +' + meso + ' mesos', c: isElite || isBoss ? '#ffd23f' : '#8fdcff', t: 0, big: isElite || isBoss });
    for (var di = 0; di < (isBoss ? (m.boss.drops || 10) : isElite ? EL.drops : 1); di++) dropLoot(w, m);
    var z = w.zone;   // contador de élites por mapa: solo cuentan los enemigos normales
    if (z && w.cfg.elite !== false && !isElite && !isBoss) {
      z.eliteCount = (z.eliteCount || 0) + 1;
      if (z.eliteCount >= EL.kills && !z.mobs.some(function (o) { return o.elite || o.eliteNext; })) { z.eliteCount = 0; m.eliteNext = true; }
    }
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
    // bajar de plataforma agachándose + salto (como en el juego): a una plataforma situada justo debajo, hasta DROP_MAX px
    nodes.forEach(function (A) {
      var seen = {};
      for (var x = A.minX; x <= A.maxX + 0.01; x += 8) {
        var ya = yAt(A, x), b = below(x, ya, 6);
        if (!b || b.node === A || b.ys - ya > C.DROP_MAX) continue;
        var B = b.node, m = (B.maxX - B.minX) >= 40 ? 16 : (B.maxX - B.minX) / 2, cB = (B.minX + B.maxX) / 2;
        if (x < A.minX + 8 || x > A.maxX - 8 || x < B.minX + m || x > B.maxX - m) continue;
        var sc = Math.abs(x - cB);
        if (!seen[B.i] || sc < seen[B.i].sc) seen[B.i] = { sc: sc, x: x };
      }
      Object.keys(seen).forEach(function (k) { edges[A.i].unshift({ type: 'drop', to: +k, takeoffX: seen[k].x, landX: seen[k].x, dir: 0 }); });
    });
    // saltar hacia arriba (máx. ~88 px)
    nodes.forEach(function (A) {
      nodes.forEach(function (B) {
        if (A === B) return;
        var best = null, cB = (B.minX + B.maxX) / 2;
        // el punto de aterrizaje queda al menos 16 px dentro de la plataforma: pegado al borde (o a una pared) el personaje saltaba en vertical y caía fuera
        var m = (B.maxX - B.minX) >= 40 ? 16 : (B.maxX - B.minX) / 2;
        for (var x = B.minX + m; x <= B.maxX - m + 0.01; x += 10) {
          var xa = clamp(x, A.minX, A.maxX);
          if (Math.abs(xa - x) > 45) continue;
          var dy = yAt(A, xa) - yAt(B, x);
          if (dy < 6 || dy > 88) continue;
          // otra plataforma entre el vértice del salto y B en ese x: el personaje caería sobre ella y no llegaría a B
          var apex = yAt(A, xa) - 95, yB = yAt(B, x), blocked = false;
          for (var wi = 0; wi < walk.length && !blocked; wi++) { var sg = walk[wi]; if (nodeOfSeg[sg.id] === B || x < sg.x1 || x > sg.x2) continue; var ys2 = segY(sg, x); if (ys2 > apex && ys2 < yB - 2) blocked = true; }
          if (blocked) continue;
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

  function bfs(map, s, extra) {
    var n = map.nodes.length, dist = [], first = [];
    for (var i = 0; i < n; i++) { dist.push(Infinity); first.push(null); }
    dist[s] = 0; var q = [s];
    while (q.length) {
      var u = q.shift();
      (extra && extra[u] ? extra[u].concat(map.edges[u]) : map.edges[u]).forEach(function (e) {
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
    var cl = o.cls || 'warrior', CL = root.MapleItems && root.MapleItems.CLASSES[cl], z = w.zones[o.mapId || 'henesys'], n = w.chars.length, x = z.spawnX + n * 24, lv = Math.max(1, o.level || 1), maxMp = baseMp(lv, cl);
    var c = {
      name: o.name || 'Personaje', mapId: z.id, cls: cl, look: o.look || null,
      player: { x: x, y: z.map.yAt(z.home, x), vx: 0, vy: 0, state: 'ground', node: z.home, dir: 1, atk: null, cd: 0, ladder: null, moving: false },
      stats: { level: lv, exp: o.exp || 0, mp: maxMp, maxMp: maxMp, hp: maxHp(lv, cl), maxHp: maxHp(lv, cl), inv: 0 },
      potions: o.potions || (root.MapleItems ? root.MapleItems.newPotions() : { hp: { id: null, pct: 50 }, mp: { id: null, pct: 30 } }), potCd: { hp: 0, mp: 0 }, deadT: 0, buffs: [],
	  skillCd: {},
      equip: o.equip || (root.MapleItems ? root.MapleItems.startEquip(cl) : {}),
      skills: o.skills || (root.MapleSkills ? root.MapleSkills.newSkills() : {}),
      input: { left: false, right: false, up: false, down: false, jump: false, attack: false, skill: false },
      ai: { auto: true, edge: null, target: null, avoid: null, avoidT: 0, key: null, keyT: 0, lastX: 0 },
      branch: o.branch || null,   // rama del 2do job (null = aún no avanzó)
      helpBoss: !!o.helpBoss,   // ayudar contra field bosses: ignora su zona de farmeo mientras haya un jefe vivo en el mapa
      zones: o.zones || {}   // zona de farmeo por mapa: { mapId: {x1, y1, x2, y2} } (coordenadas del mapa); sin zona = todo el mapa
    };
    c.stats.maxHp = maxHpOf(c); c.stats.maxMp = maxMpOf(c); if (o.hp === undefined) { c.stats.hp = c.stats.maxHp; c.stats.mp = c.stats.maxMp; }
    w.chars.push(c); return c;
  }
  // una skill con `cls` solo la usa esa clase; con `branches` solo esas ramas del 2do job (un personaje sin rama aún las puede usar)
  function skillAllowed(c, sk) { return (!sk.cls || sk.cls === c.cls) && (!sk.branches || !c.branch || sk.branches.indexOf(c.branch) >= 0); }
  // avance de job (Lv30): elige rama y recibe su arma provisional (si está definida)
  // ¿se puede avanzar? Si la rama entrega armas, el inventario EQUIP necesita hueco para todas (si no, se cancela y el personaje sigue pudiendo avanzar)
  function advanceCheck(w, c, id) {
    var J = root.MapleJobs, MI = root.MapleItems; if (!J || !J.canAdvance(c) || !J.valid(c.cls, id)) return { ok: false, msg: 'No puede avanzar a esa rama' };
    var need = J.gifts(J.get(id)).filter(function (g) { return MI && MI.ITEMS && MI.ITEMS[g]; }).length;
    var free = w.inv.equip.filter(function (x) { return !x; }).length;
    if (free < need) return { ok: false, full: true, need: need, free: free, msg: 'Inventario EQUIP lleno: libera ' + (need - free) + ' hueco' + (need - free > 1 ? 's' : '') + ' y vuelve a avanzar de job' };
    return { ok: true, need: need, free: free };
  }
  function advanceJob(w, c, id) {
    var J = root.MapleJobs; if (!advanceCheck(w, c, id).ok) return false;
    c.branch = id; var b = J.get(id), MI = root.MapleItems;
    if (c.mapId === w.mapId && c.player) beFx(w, 'JobChanged', { x: c.player.x, y: c.player.y, follow: c.player });
    J.gifts(b).forEach(function (g) { if (MI && MI.ITEMS && MI.ITEMS[g]) MI.addItem(w.inv, g, 1); });
    
    // Auto-aprender Assassin's Mark al avanzar de clase
    if (id === 'assassin') {
      if (!c.skills) c.skills = {};
      c.skills.asMark = { level: 1, auto: true };
    }
	// NUEVO: Auto-aprender Freezing Crush al avanzar a I/L
    if (id === 'wizardIL') {
      if (!c.skills) c.skills = {};
      c.skills.ilFreezingCrush = { level: 1, auto: true };
    }
    return true;
  }
  // líder del party: clic derecho en la lista. Solo hay uno; volver a elegirlo lo quita
  function setLeader(w, c) { w.leader = (w.leader === c || !c) ? null : c; return w.leader; }
  function selectChar(w, i) { w.selected = clamp(i, 0, w.chars.length - 1); bind(w, w.chars[w.selected]); }

  /* ---------- mundo ---------- */
  function buildZone(w, id, data, o) {
    var map = buildMap(data), home = o.homeFh && map.nodeOfSeg[o.homeFh];
    if (!home) home = map.nodes.slice().sort(function (a, b) { return (b.maxX - b.minX) - (a.maxX - a.minX); })[0];
    var z = { id: id, proj: [], map: map, home: home, spawnX: o.spawnX !== undefined ? o.spawnX : Math.round((home.minX + home.maxX) / 2), mobs: [], fx: [], texts: [] };
    data.life.forEach(function (l) {
      if (l.type !== 'm') return;
      var node = map.nodeOfSeg[l.fh]; if (!node) return;
      var x = clamp(l.x, node.minX + 10, node.maxX - 10), kind = w.cfg.mobTypes[l.id] || 'snail_blue', r = w.cfg.mobRewards[kind] || {}, hp = Math.round((r.hp || C.MOB_HP) * (r.hpMul || 1) * (w.cfg.mobHpMul || 1));   // mobHpMul: multiplicador global de vida de los enemigos (1 = datos del WZ)
      z.mobs.push({
        id: l.id, kind: kind, spawnX: x, x: x, y: map.yAt(node, x), node: node,
        dir: Math.random() < 0.5 ? -1 : 1, hp: hp, maxHp: hp, state: 'move', t: Math.random() * 2
      });
    });
    (w.cfg.fieldBosses && w.cfg.fieldBosses[id] || []).forEach(function (b) {   // field bosses: spawn fijo, respawn largo, no cuentan para los élites
      var node = map.nodeOfSeg[b.fh]; if (!node) return;
      var x = clamp(b.x, node.minX + 10, node.maxX - 10), r = w.cfg.mobRewards[b.kind] || {}, hp = Math.round((r.hp || C.MOB_HP) * (r.hpMul || 1) * (w.cfg.mobHpMul || 1));
      z.mobs.push({ id: b.id, kind: b.kind, spawnX: x, x: x, y: map.yAt(node, x), node: node, dir: Math.random() < 0.5 ? -1 : 1, hp: hp, maxHp: hp, state: 'move', t: Math.random() * 2, boss: b });
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
  function mapLimit(mapId) { var M = root.MAPLE_MAPS && root.MAPLE_MAPS[mapId]; return (M && M.charLimit) || 6; }   // personajes máximos por mapa (charLimit en maps.js; por defecto 6)
  function mapCount(w, mapId) { return w.chars.filter(function (c) { return c.mapId === mapId; }).length; }
  function travel(w, c, mapId) {
    var z = w.zones[mapId]; if (!z || c.mapId === mapId || c.player.state === 'dead') return false;
    if (mapCount(w, mapId) >= mapLimit(mapId)) { w.travelMsg = 'full'; return false; }
    if (c.stats.level < 10 && mapId !== 'henesys') return false;   // hasta el Lv10 solo se puede farmear en Henesys Hunting Ground
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

  function meleeRange(w) { var c = w.cfg.classes && w.cfg.classes[w.cur.cls]; return (c && c.hitRange) || C.HIT_RANGE; }
  function meleeNear(w) { var c = w.cfg.classes && w.cfg.classes[w.cur.cls]; return (c && c.near) || C.ATK_NEAR; }
  var GS_BASIC = { ranged: true, range: 300, stars: 1, hits: 1, hitMul: 1.0, speed: 1000, starGap: 0, action: 'shot', proj: 'ball', ballId: 'gsTripleShot' };
  function rangedCfg(w) { 
    // CORRECCIÓN: Si el personaje es un Bandit (usa daga), desactivamos el modo de ataque a distancia
    if (w.cur.cls === 'thief' && w.cur.branch === 'bandit') return null;
    
    // Gunslinger: el ataque normal es un disparo (bala ball_0 de Triple Shot), no un golpe cuerpo a cuerpo
    var c = (w.cur.cls === 'pirate' && w.cur.branch === 'gunslinger') ? GS_BASIC : (w.cfg.classes && w.cfg.classes[w.cur.cls]); 
    if (!c || !c.ranged) return null; 
    var rg = mods(w.cur).range; 
    if (!rg) return c; 
    var o = {}; 
    for (var k in c) o[k] = c[k]; 
    o.range = c.range + rg; 
    return o; 
  }
  // Velocidad de ataque fiel a MapleStory: cada arma trae una etapa (it.speed: 2 = muy rápida ... 9 = muy lenta) y cada etapa es un tiempo fijo por ataque;
  // el Booster correspondiente sube 2 etapas (mods.atkSpeed > 0). Los hechizos del Mage van fijos en etapa 6 (810 ms) con cualquier bastón.
  var STAGE_MS = [510, 570, 600, 660, 720, 750, 810, 870, 900, 960, 1020, 1020, 1020];
  function boosted(w) { return mods(w.cur).atkSpeed > 0; }
  function weaponStage(w) {
    var it = root.MapleItems && w.cur.equip && w.cur.equip.weapon && root.MapleItems.ITEMS[w.cur.equip.weapon], s = (it && it.speed) || 6;
    return Math.max(1, Math.min(12, s - (boosted(w) ? 2 : 0)));
  }
  function attackTime(w) { return STAGE_MS[weaponStage(w)] / 1000; }   // segundos por ataque normal
  function skillMult(w, sk) {   // multiplicador de duración de una skill: escala con la etapa (ref. 810 ms) pero nunca dura menos que un ataque normal
    if (sk.buff || sk.debuff || sk.summon || sk.teleportSkill || sk.passiveSkill) return 1;
    var st = w.cur.cls === 'mage' ? Math.max(1, 6 - (boosted(w) ? 2 : 0)) : weaponStage(w), tot = skTotal(sk);
    return Math.max(tot * STAGE_MS[st] / 810, STAGE_MS[st] / 1000) / tot;
  }
  function skTotal(sk) {   // la skill nunca dura menos que su animación de efecto (antes Channel Karma y otros se cortaban)
    if (sk._tot === undefined) { var ef = sk.effect && sk.effectDelay ? sk.effect.length * sk.effectDelay / 1000 : 0; sk._tot = Math.max(sk.total || 0, ef); }
    return sk._tot;
  }
  function startAttack(w) {
    var p = w.player;
    w.atkToggle = 1 - w.atkToggle;
    var rc = rangedCfg(w), name = rc ? 'throw' : (w.atkToggle ? 'swingO1' : 'swingO2'), c = w.cfg.attack[name];
    var D = attackTime(w), base = c.frames * c.delay / 1000;
    p.atk = { name: name, t: 0, hit: false, spd: base / D };   // la animación (base s) se estira/encoge para durar D s
    p.cd = D;
    w.input.attack = false;
  }

  // crítico: probabilidad = mods.crit; daño x(critMul + critDmg). Devuelve [daño, esCrítico]
  function rollCrit(w, c, dmg) {
    var m = mods(c); if (Math.random() < (w.cfg.baseCrit !== undefined ? w.cfg.baseCrit : 0.05) + m.crit) return [Math.max(1, Math.round(dmg * ((w.cfg.critMul || 1.5) + m.critDmg))), true];
    return [dmg, false];
  }
  function damageMob(w, m, dmg, color) {
    var p = w.player, cr = rollCrit(w, w.cur, dmg); dmg = cr[0];
    m.hp -= dmg; w.texts.push({ x: m.x, y: m.y - 40, txt: String(dmg), c: color, t: 0, num: cr[1] ? 'cri' : 'red' });
    if (m.hp <= 0) { m.state = 'dying'; m.t = 0; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; }
    else { m.state = 'hit'; m.t = 0.3; m.x = clamp(m.x + p.dir * 6, m.node.minX + 10, m.node.maxX - 10); }
  }
  // ataque normal: golpea a UN solo enemigo (el más cercano al frente); para varios están las skills
  function doHit(w) {
    var p = w.player, st = root.MapleItems ? cstats(w) : null, best = null, bd = 1e9;
    w.mobs.forEach(function (m) {
      if (!alive(m)) return;
      var dx = (m.x - p.x) * p.dir;
      if (dx < -20 || dx > meleeRange(w) + aimCfg(w).pad * 0.5 || Math.abs(m.y - p.y) > C.HIT_H) return;
      if (Math.abs(dx) < bd) { bd = Math.abs(dx); best = m; }
    });
    if (best) {
      damageMob(w, best, st ? st.min + Math.floor(Math.random() * (st.max - st.min + 1)) : 7 + Math.floor(Math.random() * 7));
	  tryStealHit(w, [best], w.cur);
	  tryGrenade(w, best);
      var FA = finalAttackSkill(w);   // Final Attack (Fighter...): prob 2*x % de un golpe extra al mismo enemigo
      if (FA && st && alive(best) && Math.random() * 100 < FA.sk.prop(FA.lv)) {
        damageMob(w, best, Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * FA.sk.damage(FA.lv) / 100)));
        w.fx.push({ kind: 'hit', id: FA.sk.id, life: FA.sk.hit.length * FA.sk.hitDelay / 1000, x: best.x, y: best.y - 18, t: 0 });
      }
    }
  }
  function finalAttackSkill(w) {
    var SK = root.MapleSkills; if (!SK) return null;
    for (var i = 0; i < SK.ORDER.length; i++) { var sk = SK.SKILLS[SK.ORDER[i]], st = w.skills[sk.id]; if (sk.finalAttack && st && st.level >= 1 && skillAllowed(w.cur, sk)) return { sk: sk, lv: st.level }; }
    return null;
  }
  function soulArrowSkill(w) {
    var SK = root.MapleSkills; if (!SK) return null;
    for (var i = 0; i < SK.ORDER.length; i++) { 
      var sk = SK.SKILLS[SK.ORDER[i]], st = w.skills[sk.id]; 
      if (sk.soulArrow && st && st.level >= 1 && skillAllowed(w.cur, sk)) return { sk: sk, lv: st.level }; 
    }
    return null;
  }
  function triggerSoulArrow(w) {
    var SA = soulArrowSkill(w);
    if (!SA || Math.random() * 100 >= SA.sk.prop(SA.lv)) return;
    
    var p = w.player, c = w.cur, st = cstats(w), pad = aimCfg(w).pad;
    var rc = rangedCfg(w) || { range: 400 }; 
    var targets = skillTargets(w, { range: { x1: 0, x2: rc.range + pad, y1: -100, y2: 100 } }, p.dir, pad, pad);
    
    targets.slice(0, SA.sk.mobCount).forEach(function(tg, ti) {
      var saDmg = Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * SA.sk.damage(SA.lv) / 100));
      w.proj.push({ 
        x: p.x + p.dir * 18, y: p.y - 30, dir: p.dir, speed: 1000, wait: 0.1 * ti, target: tg.m, owner: c, 
        dmg: [saDmg], hitT: -1, life: 1.2, rot: 0, kind: 'ball', ballId: SA.sk.id, hitFx: null, skillId: SA.sk.id, lv: SA.lv, maxDmg: st.max 
      });
    });
  }

  // ataque a distancia: lanza `stars` proyectiles hacia el enemigo más cercano al frente; cada uno pega `hits` veces (un solo objetivo)
  function doThrow(w) {
    var rc = rangedCfg(w), p = w.player, c = w.cur, st = cstats(w), best = null, bd = 1e9;
    w.mobs.forEach(function (m) {
      if (!alive(m)) return;
      var dx = (m.x - p.x) * p.dir;
      if (dx < -20 || dx > rc.range + aimCfg(w).pad || Math.abs(m.y - p.y) > C.HIT_H) return;
      if (Math.abs(dx) < bd) { bd = Math.abs(dx); best = m; }
    });
    if (!best) return;
    
    for (var i = 0; i < rc.stars; i++) {
      var dmg = []; for (var k = 0; k < rc.hits; k++) dmg.push(Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * rc.hitMul)));
      w.proj.push({ x: p.x + p.dir * 18, y: p.y - 30, dir: p.dir, speed: rc.speed, wait: i * rc.starGap, stack: i * rc.hits, target: best, owner: c, dmg: dmg, hitT: -1, life: 1.2, rot: 0, kind: rc.proj || 'star', ballId: rc.ballId });
    }

    var FA = finalAttackSkill(w);
    if (FA && st && alive(best) && Math.random() * 100 < FA.sk.prop(FA.lv)) {
      var faDmg = Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * FA.sk.damage(FA.lv) / 100));
      w.proj.push({ x: p.x + p.dir * 18, y: p.y - 30, dir: p.dir, speed: rc.speed, wait: rc.stars * rc.starGap + 0.1, target: best, owner: c, dmg: [faDmg], hitT: -1, life: 1.2, rot: 0, kind: rc.proj || 'star' });
      if (FA.sk.hitDelay) w.fx.push({ kind: 'hit', id: FA.sk.id, life: FA.sk.hit.length * FA.sk.hitDelay / 1000, x: best.x, y: best.y - 18, t: 0 });
    }
	
	tryGrenade(w, best);
    triggerSoulArrow(w); // <-- Ahora se llama aquí
  }
  // MP Eater (Wizard): al golpear con magia, prob x % de absorber u(x/2) % del MP del enemigo (su MP: dato `mp` del mob o nivel*10)
  function mpEat(w, m, owner) {
    var SK = root.MapleSkills; if (!SK || !owner || owner.cls !== 'mage') return;
    var sk = SK.SKILLS.fpMpEater, st = owner.skills.fpMpEater; if (!st || st.level < 1 || !skillAllowed(owner, sk)) return;
    if (Math.random() * 100 >= sk.prop(st.level)) return;
    var r = w.cfg.mobRewards[m.kind] || {}, mob = r.mp || (r.level || 10) * 10, gain = Math.max(1, Math.round(mob * sk.pct(st.level) / 100));
    owner.stats.mp = Math.min(owner.stats.maxMp, owner.stats.mp + gain);
    w.texts.push({ x: m.x, y: m.y - 70, txt: '+' + gain + ' MP', c: '#8fc8ff', t: 0 });
  }
  // Assassin's Mark: los ataques del Assassin marcan (40 %) a un enemigo; golpear a uno marcado detona la marca y dispara bulletCount estrellas
  // a los mobCount enemigos más cercanos (incluido el marcado). No requiere aprender nada: la tiene toda la rama Assassin.
  function markHit(w, m, owner, noMark) {
    var AM = root.MapleSkills && root.MapleSkills.SKILLS.asMark;
    if (noMark || !AM || !owner || owner.cls !== 'thief' || owner.branch !== 'assassin' || m.hp <= 0 || !alive(m)) return;
    if (!m.mark) { if (Math.random() * 100 < AM.prop(1)) m.mark = { t: AM.markTime, arm: AM.armTime, id: 'asMark' }; return; }
    if (m.mark.arm > 0) return;   // recién marcado: aún no se puede detonar (evita que las estrellas del mismo ataque la consuman)
    m.mark = null;
    bind(w, owner);
    var st = cstats(w), p = w.player, near = [];
    w.mobs.forEach(function (em) { if (alive(em) && em.node === m.node && Math.abs(em.x - m.x) <= AM.range) near.push({ m: em, d: Math.abs(em.x - m.x) }); });
    near.sort(function (a, b) { return a.d - b.d; });
    near = near.slice(0, AM.mobCount);
    for (var i = 0; i < AM.bulletCount; i++) {
      var tg = near[i % near.length].m, dmg = Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * AM.damage(1) / 100));
      w.proj.push({ x: p.x + p.dir * 18, y: p.y - 30, dir: tg.x >= p.x ? 1 : -1, speed: 800, wait: i * 0.12, target: tg, owner: owner, dmg: [dmg], hitT: -1, life: 1.5, rot: 0, kind: 'star', maxDmg: st.max, noMark: true });
    }
  }

    // Bandit's Steal (Pasiva): 30% de ejecutar un ataque extra (una vez por habilidad) con salpicadura
  function tryStealHit(w, tgArray, owner) {
    var BD = root.MapleSkills && root.MapleSkills.SKILLS.bdSteal;
    if (!BD || !owner || owner.cls !== 'thief' || owner.branch !== 'bandit' || !tgArray || !tgArray.length) return;
    var st = owner.skills.bdSteal;
    if (!st || st.level < 1) return;

    if (Math.random() * 100 < BD.prop(st.level)) {
       var maxFrames = Math.max(BD.effect.length, BD.effect0 ? BD.effect0.length : 0);
       w.fx.push({ kind: 'effect', id: 'bdSteal', life: maxFrames * (BD.effectDelay || 90) / 1000, x: owner.player.x, y: owner.player.y, dir: owner.player.dir, t: 0 });
       var stStats = cstats(w);
       var successRob = false;
       var targetsToHit = tgArray.slice(0, BD.mobCount || 4);
       targetsToHit.forEach(function(c) {
           var m = c.m ? c.m : c;
           if (!alive(m)) return;
           var dmg = Math.max(1, Math.round((stStats.min + Math.floor(Math.random() * (stStats.max - stStats.min + 1))) * BD.damage(st.level) / 100));
           var cr = rollCrit(w, owner, dmg);
           dmg = cr[0];
           m.hp -= dmg;
           w.texts.push({ x: m.x, y: m.y - 70, txt: String(dmg), c: '#ffdd00', t: 0, num: cr[1] ? 'cri' : 'red' });
           w.fx.push({ kind: 'hit', id: 'bdSteal', life: BD.hit.length * (BD.hitDelay || 90) / 1000, x: m.x, y: m.y - 18, t: 0 });
           if (m.hp <= 0) { m.state = 'dying'; m.t = 0; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; }
           else { m.state = 'hit'; m.t = 0.3; }

           // SPLASH: golpea a los enemigos cercanos al objetivo
           if (BD.splash) {
             var n = 1;
             w.mobs.forEach(function(em) {
               if (em === m || !alive(em) || em.node !== m.node) return;
               if (n >= (BD.splashCount || 3)) return;
               var dx = em.x - m.x, dy = em.y - m.y;
               if (dx < BD.splashRange.x1 || dx > BD.splashRange.x2 || dy < BD.splashRange.y1 || dy > BD.splashRange.y2) return;
               n++;
               var sdmg = Math.max(1, Math.round((stStats.min + Math.floor(Math.random() * (stStats.max - stStats.min + 1))) * BD.damage(st.level) / 100 * (BD.splashFalloff || 0.7)));
               var scr = rollCrit(w, owner, sdmg); sdmg = scr[0];
               em.hp -= sdmg;
               w.texts.push({ x: em.x, y: em.y - 70, txt: String(sdmg), c: '#ffdd00', t: 0, num: scr[1] ? 'cri' : 'red' });
               w.fx.push({ kind: 'hit', id: 'bdSteal', life: BD.hit.length * (BD.hitDelay || 90) / 1000, x: em.x, y: em.y - 18, t: 0 });
               if (em.hp <= 0) { em.state = 'dying'; em.t = 0; w.kills++; reward(w, em); w.killsByNode[em.node.i] = (w.killsByNode[em.node.i] || 0) + 1; }
               else { em.state = 'hit'; em.t = 0.3; }
             });
           }

           if (Math.random() * 100 < 30) successRob = true;
       });

       if (successRob) {
           applyBuff(w, owner, 'stealBuff', { duration: 60, mods: { att: 30 } });
           w.texts.push({ x: owner.player.x, y: owner.player.y - 80, txt: '¡ROBO EXITOSO!', c: '#ffdd00', t: 0 });
       }
    }
  }

  // Gust Charm: viento perforante; golpea (una vez) a los mobCount primeros enemigos que atraviesa y los empuja con una animación suave
  function stepPierce(w, q, dt) {
    var sk = root.MapleSkills.SKILLS[q.skillId];
    q.x += q.dir * q.speed * dt;
    w.mobs.forEach(function (m) {
      if (q.hits.length >= sk.mobCount || q.hits.indexOf(m) >= 0 || !alive(m)) return;
      var dx = (m.x - q.x0) * q.dir;
      if (dx < sk.range.x1 - 15 || dx > sk.range.x2 + 15 || (q.x - m.x) * q.dir < -6) return;
      if (m.y < q.py + sk.range.y1 || m.y - 34 > q.py + sk.range.y2) return;
      q.hits.push(m); bind(w, q.owner);
      var st = cstats(w), dmg = Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * sk.damage(q.lv) / 100)), cr = rollCrit(w, q.owner, dmg); dmg = cr[0];
      m.hp -= dmg; mpEat(w, m, q.owner);
      w.texts.push({ x: m.x, y: m.y - 40, txt: String(dmg), c: '#ffb347', t: 0, num: cr[1] ? 'cri' : 'red' });
      w.fx.push({ kind: 'hit', id: sk.id, life: sk.hit.length * sk.hitDelay / 1000, x: m.x, y: m.y - 18, t: 0 });
      if (m.hp <= 0) { m.state = 'dying'; m.t = 0; m.knock = null; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; return; }
      m.state = 'hit'; m.t = sk.pushTime || 0.3;
      if (sk.pushTime && sk.pushDist) {
        m.knock = { t: 0, dur: sk.pushTime, from: m.x, to: clamp(m.x + q.dir * sk.pushDist, m.node.minX + 10, m.node.maxX - 10) };
      }
      markHit(w, m, q.owner);
    });
    return q.hits.length < sk.mobCount && Math.abs(q.x - q.x0) < sk.range.x2 + 30;
  }

  // veneno (Poison Breath): daño por segundo = dot % del daño máximo del lanzador; no se acumula, solo se renueva
  function applyPoison(w, m, q) {
    var sk = root.MapleSkills.SKILLS[q.skillId]; if (!sk || !sk.dot) return;
    m.poison = { t: sk.dotTime(q.lv), acc: 0, dmg: Math.max(1, Math.round(q.maxDmg * sk.dot(q.lv) / 100)), owner: q.owner, id: sk.id };
  }
  // Ignite (Wizard F/P): al impactar una skill de fuego, prob prop % de dejar fuego en el suelo; quema a los enemigos del área cada `tick` s
  function igniteSpawn(w, m, owner) {
    var SK = root.MapleSkills, sk = SK.SKILLS.fpIgnite, st = owner && owner.skills.fpIgnite;
    if (!st || st.level < 1 || !skillAllowed(owner, sk) || Math.random() * 100 >= sk.prop(st.level)) return;
    if (w.fx.filter(function (f) { return f.kind === 'ignite'; }).length >= 12) return;
    w.fx.push({ kind: 'ignite', id: sk.id, x: m.x, y: m.y, t: 0, life: sk.time(st.level), lv: st.level, owner: owner, size: st.level <= 3 ? 0 : st.level <= 7 ? 1 : 2, nextTick: 0.3 });
  }
  function stepIgnite(w) {
    if (!root.MapleSkills || !w.fx.some(function (f) { return f.kind === 'ignite'; })) return;
    var sk = root.MapleSkills.SKILLS.fpIgnite;
    w.fx.slice().forEach(function (f) {
      if (f.kind !== 'ignite' || f.t < f.nextTick) return;
      f.nextTick += sk.tick; bind(w, f.owner);
      var st = cstats(w), n = 0;
      w.mobs.forEach(function (m) {
        if (n >= sk.mobCount || !alive(m)) return;
        var dx = m.x - f.x, dy = m.y - f.y;
        if (dx < sk.area.x1 - 12 || dx > sk.area.x2 + 12 || dy < sk.area.y1 - 20 || dy > sk.area.y2 + 20) return;
        n++;
        var dmg = Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * sk.damage(f.lv) / 100)), cr = rollCrit(w, f.owner, dmg); dmg = cr[0];
        m.hp -= dmg;
        w.texts.push({ x: m.x, y: m.y - 40, txt: String(dmg), c: '#ff9a4a', t: 0, num: cr[1] ? 'cri' : 'red' });
        w.fx.push({ kind: 'hit', id: sk.id, life: sk.hit.length * sk.hitDelay / 1000, x: m.x, y: m.y - 18, t: 0 });
        if (m.hp <= 0) { m.state = 'dying'; m.t = 0; m.knock = null; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; }
      });
    });
  }
  function stepProj(w, dt) {
    var keep = [], src = w.proj.slice();
    src.forEach(function (q) {
      q.life -= dt; if (q.life <= 0 || q.owner.mapId !== w.mapId) return;
      if (q.wait > 0) { q.wait -= dt; keep.push(q); return; }
      if (q.pierce) { if (stepPierce(w, q, dt)) keep.push(q); return; }
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
        var cr2 = rollCrit(w, q.owner, q.dmg[q.next]); q.dmg[q.next] = cr2[0];
        w.texts.push({ x: m2.x + (((q.stack || 0) + q.next) % 2 ? 6 : -6), y: m2.y - 40 - ((q.stack || 0) + q.next) * DMG_STEP, txt: String(q.dmg[q.next]), c: q.skillFx ? '#ffb347' : '#ffd23f', t: 0, num: cr2[1] ? 'cri' : 'red' });
        if (q.skillFx) w.fx.push({ kind: 'sk', id: q.skillFx, tier: q.tier, x: m2.x, y: m2.y - 18, t: 0 }); else if (q.hitFx) { var HS = root.MapleSkills.SKILLS[q.hitFx]; w.fx.push({ kind: 'hit', id: q.hitFx, life: HS.hit.length * HS.hitDelay / 1000, x: m2.x, y: m2.y - 18, t: 0 }); } else w.fx.push({ kind: 'spark', x: m2.x, y: m2.y - 18, t: 0 });
        m2.hp -= q.dmg[q.next]; q.next++;
        if (alive(m2) || m2.hp <= 0) mpEat(w, m2, q.owner);
		
        
        var SK = root.MapleSkills, skProj = q.skillId ? SK.SKILLS[q.skillId] : null;
        
        if (skProj && skProj.stunProp && Math.random() * 100 < skProj.stunProp(q.lv)) {
          m2.stun = { t: skProj.stunTime(q.lv), id: skProj.id };
        }
        
        if (skProj && skProj.splash && q.next === 1) { 
           var hitCount = 1;
           w.mobs.forEach(function(em) {
             if (em !== m2 && alive(em) && em.node === m2.node && hitCount < skProj.splashCount) {
               var dx = em.x - m2.x, dy = em.y - m2.y;
               if (dx >= skProj.splashRange.x1 && dx <= skProj.splashRange.x2 && dy >= skProj.splashRange.y1 && dy <= skProj.splashRange.y2) {
                 hitCount++;
                 var splashMul = q.noSplashFalloff ? 1.0 : 0.8;
                 var crS = rollCrit(w, q.owner, Math.max(1, Math.round((q.maxDmg * splashMul) * skProj.damage(q.lv) / 100)));
                 var bdmg = crS[0]; em.hp -= bdmg;
                 w.texts.push({ x: em.x, y: em.y - 40, txt: String(bdmg), c: '#ffb347', t: 0, num: crS[1] ? 'cri' : 'red' });
				 markHit(w, em, q.owner, q.noMark);
                 if (skProj.stunProp && Math.random() * 100 < skProj.stunProp(q.lv)) em.stun = { t: skProj.stunTime(q.lv), id: skProj.id };
                 if (em.hp <= 0) { em.state = 'dying'; em.t = 0; w.kills++; reward(w, em); w.killsByNode[em.node.i] = (w.killsByNode[em.node.i] || 0) + 1; }
                 else { em.state = 'hit'; em.t = 0.3; em.x = clamp(em.x + (em.x > m2.x ? 3 : -3), em.node.minX + 10, em.node.maxX - 10); }
               }
             }
           });
        }
        if (skProj && m2.hp > 0 && !skProj.splash) applyPoison(w, m2, q);
        if (skProj && skProj.fire) igniteSpawn(w, m2, q.owner);
        markHit(w, m2, q.owner, q.noMark);
        if (m2.hp <= 0) { m2.state = 'dying'; m2.t = 0; w.kills++; reward(w, m2); w.killsByNode[m2.node.i] = (w.killsByNode[m2.node.i] || 0) + 1; }
        else { m2.state = 'hit'; m2.t = 0.3; m2.x = clamp(m2.x + q.dir * 3, m2.node.minX + 10, m2.node.maxX - 10); }
      }
      if (q.next < q.dmg.length) keep.push(q);
    });
    var zp = w.zone ? w.zone.proj : w.proj;   // proyectiles creados durante el recorrido (estrellas de Assassin's Mark) se conservan
    zp.forEach(function (z) { if (src.indexOf(z) < 0 && keep.indexOf(z) < 0) keep.push(z); });
    w.proj = keep; if (w.zone) w.zone.proj = keep;
  }

  /* ---------- skills ---------- */
  // enemigos dentro del área de la skill (hacia donde mira dir), del más cercano al más lejano
  function aimCfg(w) { var a = w.cfg.aim || {}; return { ratio: a.ratio !== undefined ? a.ratio : 0.2, minMargin: a.minMargin !== undefined ? a.minMargin : 40, pad: a.pad !== undefined ? a.pad : 40 }; }
  // distancia máxima (px) a la que la IA lanza la skill: el borde del alcance menos un margen de seguridad
  function comfortX(w, sk) { var a = aimCfg(w); return sk.range.x2 - Math.max(a.minMargin, a.ratio * (sk.range.x2 - sk.range.x1)); }
  // padLo / padHi: tolerancia (px) antes del inicio y después del final del alcance (negativa = exigir estar más adentro)
  function skillTargets(w, sk, dir, padLo, padHi) {
    var p = w.player, out = [];
    if (padLo === undefined) padLo = 15; if (padHi === undefined) padHi = 15;
    w.mobs.forEach(function (m) {
      if (!alive(m)) return;
      var dx = (m.x - p.x) * dir;
      if (dx < sk.range.x1 - padLo || dx > sk.range.x2 + padHi) return;
      if (m.y < p.y + sk.range.y1 || m.y - 34 > p.y + sk.range.y2) return;
      out.push({ m: m, dx: dx });
    });
    out.sort(function (a, b) { return a.dx - b.dx; });
    return out;
  }
  // skill aprendida, con "auto farm" activo, MP suficiente y al menos un enemigo en su área
  function readySkill(w, dir) {
    var SK = root.MapleSkills; if (!SK) return null;
    
    // SISTEMA DE COMBO PARA BRAWLER
    if (w.cur.cls === 'pirate' && w.cur.branch === 'brawler') {
      var somersault = w.skills['somersaultKick'];
      var corkscrew = w.skills['bwCorkscrewBlow'];
      var tornado = w.skills['bwTornadoUppercut'];
      
      if (somersault && somersault.level > 0 && somersault.auto &&
          corkscrew && corkscrew.level > 0 && corkscrew.auto &&
          tornado && tornado.level > 0 && tornado.auto) {
          
          var targs = skillTargets(w, SK.SKILLS['somersaultKick'], dir, 15, -20);
          if (targs.length > 0) {
              return 'MACRO_BRAWLER';
          }
      }
    }
	
    // PRIORIDAD CROSSBOWMAN: Net Toss primero si está disponible
    if (w.cur.cls === 'archer' && w.cur.branch === 'crossbowman') {
      var nt = w.skills['cbNetToss'];
      if (nt && nt.level > 0 && nt.auto && !(w.cur.skillCd['cbNetToss'] > 0) && w.stats.mp >= SK.SKILLS['cbNetToss'].mpCon(nt.level)) {
        var ntTargets = skillTargets(w, SK.SKILLS['cbNetToss'], dir, 15, -(SK.SKILLS['cbNetToss'].range.x2 - comfortX(w, SK.SKILLS['cbNetToss'])));
        if (ntTargets.length) return 'cbNetToss';
      }
    }
	
    for (var i = 0; i < SK.ORDER.length; i++) {
      var id = SK.ORDER[i], sk = SK.SKILLS[id], st = w.skills[id];
      // CORRECCIÓN: Se agregó sk.comboOnly para que la IA no las dispare solas
      if (sk.buff || sk.debuff || sk.passiveSkill || sk.teleportSkill || sk.summon || sk.comboOnly || !st || st.level < 1 || !st.auto || !skillAllowed(w.cur, sk) || w.stats.mp < sk.mpCon(st.level)) continue;
      if (sk.cooldown && (w.cur.skillCd[id] || 0) > 0) continue;
      
      // NUEVO: Si es Heal, la IA solo lo usa para atacar si hay algún Undead en el área
      var targets = skillTargets(w, sk, dir, 15, -(sk.range.x2 - comfortX(w, sk)));
      if (sk.healSkill) {
         if (targets.some(function(t) { return w.cfg.mobRewards[t.m.kind] && w.cfg.mobRewards[t.m.kind].undead; })) return id;
         continue; // Si no hay undeads, lo omite como ataque
      }
      if (targets.length) return id;
	  
      if (skillTargets(w, sk, dir, 15, -(sk.range.x2 - comfortX(w, sk))).length) return id;
    }
    return null;
  }

  // distancia a la que conviene quedar para usar la skill auto que aún se puede lanzar
  function wantSkillDist(w) {
    var SK = root.MapleSkills; if (!SK) return null; var best = null;
    for (var i = 0; i < SK.ORDER.length; i++) {
      var id = SK.ORDER[i], sk = SK.SKILLS[id], st = w.skills[id];
      // CORRECCIÓN: Se agregó sk.comboOnly para que no mida distancias usando Tornado Uppercut
      if (sk.buff || sk.debuff || sk.passiveSkill || sk.teleportSkill || sk.summon || sk.comboOnly || !st || st.level < 1 || !st.auto || !skillAllowed(w.cur, sk) || w.stats.mp < sk.mpCon(st.level)) continue;
	  if (sk.cooldown && (w.cur.skillCd[id] || 0) > 0) continue;
      var d = comfortX(w, sk); if (best === null || d < best) best = d;
    }
    return best;
  }
  // skill de buff aprendida, en auto, con MP, y alguien vivo del mapa sin el buff (o a punto de perderlo)
  function readyBuff(w) {
    var SK = root.MapleSkills; if (!SK) return null;
    for (var i = 0; i < SK.ORDER.length; i++) {
      var id = SK.ORDER[i], sk = SK.SKILLS[id], st = w.skills[id];
      if (!sk.buff && !sk.summon && !sk.healSkill) continue;
      if (!st || st.level < 1 || !st.auto || !skillAllowed(w.cur, sk) || w.stats.mp < sk.mpCon(st.level)) continue;
      
      // NUEVO: La IA usa Heal si ALGUIEN en el mapa baja del 75% de HP
      if (sk.healSkill) {
         var partyNeedsHeal = w.chars.some(function(ch) {
            // Revisa si el personaje está en el mismo mapa, está vivo, y su HP es menor al 75%
            return ch.mapId === w.cur.mapId && 
                   ch.player.state !== 'dead' && 
                   (ch.stats.hp / ch.stats.maxHp) < 0.30; // <-- Aquí manejas el porcentaje
         });
         
         if (partyNeedsHeal) return id;
         continue; 
      }
      
      if (sk.summon) {
        if (!w.cur.summon) return id; // Invocamos si no existe
        continue;
      }

      var need = w.chars.some(function (c) {
        var B = root.MapleBuffs.BUFFS[sk.buff];
        if (c.mapId !== w.cur.mapId || c.player.state === 'dead' || (B && !B.party && c !== w.cur)) return false;
        var b = c.buffs.filter(function (x) { return x.id === sk.buff; })[0];
        return !b || b.t < sk.renewAt;
      });
      if (need) return id;
    }
    return null;
  }
  function doBuffCast(w, atk) {
    var sk = atk.skill;
    applyBuff(w, w.cur, sk.buff, { duration: sk.duration(atk.level), mods: sk.mods(atk.level) });
  }
  function doSummonCast(w, atk) {
    var sk = atk.skill;
    w.cur.summon = {
      id: sk.id, sk: sk, lv: atk.level,
      x: w.player.x, y: w.player.y, dir: w.player.dir, // <-- Altura corregida al nivel del piso
      t: sk.duration(atk.level), atkCd: 0, state: 'fly', frameT: 0
    };
  }

  function stepSummon(w, c, dt) {
    if (!c.summon || c.mapId !== w.mapId || c.player.state === 'dead') { c.summon = null; return; }
    var sm = c.summon, p = c.player;
    sm.t -= dt; if (sm.t <= 0) { c.summon = null; return; }
    sm.atkCd -= dt;

    if (sm.state === 'attack') {
      sm.frameT -= dt;
      if (sm.frameT <= 0) sm.state = 'fly';
      return;
    }

    // Movimiento: Se eliminaron los -80px extra. El 'origin' de la imagen hará el resto
    var dx = p.x - sm.x, dy = p.y - sm.y; 
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 500) { sm.x = p.x; sm.y = p.y; } 
    else if (dist > 40) {
      sm.x += (dx / dist) * 160 * dt;
      sm.y += (dy / dist) * 160 * dt;
      sm.dir = dx > 0 ? 1 : -1;
      sm.state = 'fly';
    } else {
      sm.state = 'stand';
    }

    // Combate Automático
    if (sm.atkCd <= 0) {
      var best = null, bd = sm.sk.range.x2;
      w.mobs.forEach(function(m) {
        if (!alive(m)) return;
        var mdx = Math.abs(m.x - sm.x), mdy = Math.abs(m.y - sm.y);
        if (mdx <= sm.sk.range.x2 && mdy <= sm.sk.range.y2 && mdx < bd) { bd = mdx; best = m; }
      });
      if (best) {
        sm.state = 'attack'; sm.frameT = 0.8; sm.atkCd = 3.0;
        sm.dir = best.x >= sm.x ? 1 : -1;
        var st = cstats(w), hitCount = 0;
        
        w.mobs.forEach(function(m) {
          if (!alive(m) || hitCount >= sm.sk.mobCount) return;
          var mdx = Math.abs(m.x - sm.x), mdy = Math.abs(m.y - sm.y);
          if (mdx <= sm.sk.range.x2 && mdy <= sm.sk.range.y2) {
            hitCount++;
            var dmg = Math.max(1, Math.round((st.min + Math.floor(Math.random() * (st.max - st.min + 1))) * sm.sk.damage(sm.lv) / 100));
            var cr = rollCrit(w, c, dmg); dmg = cr[0];
            m.hp -= dmg;
            w.texts.push({ x: m.x, y: m.y - 40, txt: String(dmg), c: '#ffb347', t: 0, num: cr[1] ? 'cri' : 'red' });
            if (sm.sk.prop && Math.random() * 100 < sm.sk.prop(sm.lv)) m.stun = { t: 3, id: sm.sk.id };
            if (sm.sk.hitDelay) w.fx.push({ kind: 'hit', id: sm.sk.id, life: sm.sk.hit.length * sm.sk.hitDelay / 1000, x: m.x, y: m.y - 18, t: 0 });
            if (m.hp <= 0) { m.state = 'dying'; m.t = 0; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; }
            else { m.state = 'hit'; m.t = 0.3; m.x = clamp(m.x + sm.dir * 3, m.node.minX + 10, m.node.maxX - 10); }
          }
        });
      }
    }
  }
  // Threaten (Page): debilita a los enemigos del área (prob prop %): su daño de contacto baja durante `duration` s
  function doDebuffCast(w, atk) {
    var sk = atk.skill, p = w.player;
    skillTargets(w, sk, p.dir, 0, 0).slice(0, sk.mobCount).forEach(function (c) {
      if (Math.random() * 100 < sk.prop(atk.level)) c.m.debuff = { t: sk.duration(atk.level), dmg: sk.dmgDown(atk.level) / 100, id: sk.id };
    });
  }
  // skill de debuff aprendida, en auto, con MP y al menos un enemigo cercano sin el efecto
  function readyDebuff(w) {
    var SK = root.MapleSkills; if (!SK) return null;
    for (var i = 0; i < SK.ORDER.length; i++) {
      var id = SK.ORDER[i], sk = SK.SKILLS[id], st = w.skills[id];
      if (!sk.debuff || !st || st.level < 1 || !st.auto || !skillAllowed(w.cur, sk) || w.stats.mp < sk.mpCon(st.level)) continue;
      if (skillTargets(w, sk, w.player.dir, -20, -20).some(function (c) { return !c.m.debuff; })) return id;
    }
    return null;
  }
  function startSkill(w, id) {
    var SK = root.MapleSkills, sk = SK && SK.SKILLS[id], st = sk && w.skills[id], p = w.player;
    if (!st || st.level < 1 || p.atk || !skillAllowed(w.cur, sk)) return false;
    if (sk.cooldown && (w.cur.skillCd[id] || 0) > 0) return false;   // <-- NUEVO
    var mp = sk.mpCon(st.level); if (w.stats.mp < mp) return false;
    w.stats.mp -= mp;
    if (sk.cooldown) w.cur.skillCd[id] = sk.cooldown;                // <-- NUEVO
    var mult = skillMult(w, sk);
    p.atk = { skill: sk, level: st.level, name: id, t: 0, hit: false, spd: 1 / mult };
    if (!sk.buff && !sk.debuff) p.atk.watch = skillTargets(w, sk, p.dir).map(function (c) { return c.m; });   // objetivos al empezar (para distinguir fallos de puntería de enemigos ya muertos)
    p.cd = skTotal(sk) * mult + 0.05; w.input.skill = false;
    return true;
  }
  // la skill no encontró a nadie al soltarse: se devuelve el MP y se anota el fallo (w.missCount)
  function missed(w, atk) {
    var c = w.cur, near = (atk.watch || []).some(alive);   // ¿alguno de los objetivos originales sigue vivo? entonces falló la puntería; si no, murió o se fue
    if (near) c.missNear = (c.missNear || 0) + 1; else c.missGone = (c.missGone || 0) + 1;
    w.missCount = (w.missCount || 0) + 1; c.missCount = (c.missCount || 0) + 1; w.stats.mp = Math.min(w.stats.maxMp, w.stats.mp + atk.skill.mpCon(atk.level)); }
    // skill a distancia (Lucky Seven): lanza bulletCount estrellas al enemigo más cercano al frente; cada una pega damage(x)% del daño base
  function doRangedSkill(w, atk) {
    var p = w.player, sk = atk.skill, c = w.cur, st = cstats(w);
    var pad = aimCfg(w).pad, t = skillTargets(w, sk, p.dir, pad, pad)[0];
    if (!t) { missed(w, atk); return; }
    var tierVal = (sk.tiers && sk.tierFor) ? sk.tierFor(w.stats.level) : undefined;
    for (var i = 0; i < sk.bulletCount; i++) {
      var base = st.min + Math.floor(Math.random() * (st.max - st.min + 1));
      var bdmg = Math.max(1, Math.round(base * sk.damage(atk.level) / 100));
      if (sk.ball) w.proj.push({ x: p.x + p.dir * 18, y: p.y - (sk.ball.startY || 30), dir: p.dir, speed: sk.ball.speed || sk.speed || 700, stack: i, wait: i * (sk.starGap || 0.09), target: t.m, owner: c, dmg: [bdmg], hitT: -1, life: 1.2, rot: 0, kind: 'ball', ballId: sk.id, hitFx: sk.id, skillId: sk.id, lv: atk.level, maxDmg: st.max });   // bala propia de la skill (Triple Shot: ball_0), no la estrella del Thief
      else w.proj.push({ x: p.x + p.dir * 18, y: p.y - 30, dir: p.dir, speed: sk.speed || 700, stack: i, wait: i * (sk.starGap || 0.09), target: t.m, owner: c, dmg: [bdmg], hitT: -1, life: 1.2, rot: 0, skillFx: sk.id, tier: tierVal, ballId: sk.id, lv: atk.level, maxDmg: st.max });
    }
    triggerSoulArrow(w);
  }
  function doSkillHit(w, atk) {
    var p = w.player, sk = atk.skill, st = cstats(w);
    var pad = aimCfg(w).pad, tg = skillTargets(w, sk, p.dir, pad, pad).slice(0, sk.mobCount);
    if (!tg.length) missed(w, atk);
    if (sk.pierce) {
      if (tg.length) w.proj.push({ pierce: true, kind: 'ball', ballId: sk.id, skillId: sk.id, lv: atk.level, owner: w.cur, x: p.x + p.dir * 24, x0: p.x, py: p.y, y: p.y - sk.ball.startY, dir: p.dir, speed: sk.ball.speed, wait: 0, hitT: -1, life: 1.6, rot: 0, hits: [], dmg: [0] });
      triggerSoulArrow(w); return;
    }
    if (sk.ball || sk.viewFor) {   // la flecha/proyectil sale en el golpe, viaja hasta el enemigo y recién ahí hace daño (ver stepProj); el arte depende del nivel (view)
      var vw = root.MapleSkills.view(sk, w.stats.level);
      tg.forEach(function (c, ti) {
        for (var k = 0; k < sk.attackCount; k++) {
          var bs = st.min + Math.floor(Math.random() * (st.max - st.min + 1)), bd = Math.max(1, Math.round(bs * sk.damage(atk.level) / 100));
          w.proj.push({ x: p.x + p.dir * 24, y: p.y - vw.ball.startY, dir: p.dir, speed: vw.ball.speed, stack: k, wait: ti * 0.06 + k * 0.1, target: c.m, owner: w.cur, dmg: [bd], hitT: -1, life: 1.6, rot: 0, kind: 'ball', ballId: vw.id, hitFx: vw.id, skillId: sk.id, lv: atk.level, maxDmg: st.max });
        }
      });
      triggerSoulArrow(w); // <-- SE AGREGÓ AQUÍ (para skills con proyectil)
      return;
    }
	// NUEVO: Lógica de curación de Heal (afecta a todo el party en el mapa)
    if (sk.healSkill) {
       var hpPct = sk.hpHeal(atk.level) / 100;
       w.chars.forEach(function(ch) {
           if (ch.mapId === w.mapId && ch.player.state !== 'dead') {
               var missing = ch.stats.maxHp - ch.stats.hp;
               if (missing > 0) {
                   var amt = Math.min(missing, Math.floor(ch.stats.maxHp * hpPct));
                   ch.stats.hp += amt;
                   w.texts.push({ x: ch.player.x, y: ch.player.y - 70, txt: '+' + amt, c: '#ff9a9a', t: 0 });
               }
           }
       });
    }
    tg.forEach(function (c) {
      var m = c.m;
      // NUEVO: Heal solo inflige daño a monstruos Undead
      var isUndead = w.cfg.mobRewards[m.kind] && w.cfg.mobRewards[m.kind].undead;
      if (sk.healSkill && !isUndead) return;
      
      for (var k = 0; k < sk.attackCount; k++) {
        var base = st.min + Math.floor(Math.random() * (st.max - st.min + 1));
        var dmg = Math.max(1, Math.round(base * sk.damage(atk.level) / 100));
        
        // NUEVO: Rayo consume cargas de hielo para infligir daño crítico masivo (+8% por carga, máx +40%)
        if (sk.elemAttr === 'l' && m.freezeStack && w.cur.skills.ilFreezingCrush && w.cur.skills.ilFreezingCrush.level > 0) {
            dmg = Math.round(dmg * (1 + 0.08 * m.freezeStack.count)); 
            if (k === sk.attackCount - 1) m.freezeStack = null; // El rayo consume la carga en el último golpe
        }

        var cr3 = rollCrit(w, w.cur, dmg); dmg = cr3[0];
        m.hp -= dmg; mpEat(w, m, w.cur); markHit(w, m, w.cur);
        w.texts.push({ x: m.x, y: m.y - 40 - k * DMG_STEP, txt: String(dmg), c: '#ffb347', t: 0, num: cr3[1] ? 'cri' : 'red' });
      }
      
      // NUEVO: Aplicar el estado de Freeze y Acumular marcas con skills de Hielo
      if (sk.elemAttr === 'i' && m.hp > 0) {
         m.freeze = { t: sk.freezeTime ? sk.freezeTime(atk.level) : 8 }; // Congela y detiene
         if (w.cur.skills.ilFreezingCrush && w.cur.skills.ilFreezingCrush.level > 0) {
            if (!m.freezeStack) m.freezeStack = { count: 0, t: 8 };
            m.freezeStack.count = Math.min(5, m.freezeStack.count + 1); // Acumula hasta 5
            m.freezeStack.t = 8; // Renueva el timer de la marca
         }
      }
      
      w.fx.push({ kind: 'hit', id: sk.id, life: sk.hit.length * sk.hitDelay / 1000, x: m.x, y: m.y - 18, t: 0 });
	        if (sk.stunProp && Math.random() * 100 < sk.stunProp(atk.level)) m.stun = { t: sk.stunTime(atk.level), id: sk.id };
      if (m.hp <= 0) { m.state = 'dying'; m.t = 0; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; }
      else { 
        m.state = 'hit'; m.t = 0.3; 
        var pushDist = sk.pushTarget ? 150 : 6; 
        m.x = clamp(m.x + p.dir * pushDist, m.node.minX + 10, m.node.maxX - 10); 
      }
    });
	// NUEVO: Movimiento del lanzador (Corkscrew Blow dash)
    if (sk.casterMove && sk.pushDist) {
       p.x = clamp(p.x + p.dir * (sk.pushDist * 0.7), p.node.minX + 10, p.node.maxX - 10);
    }
	    if (tg.length) tryGrenade(w, tg[0].m);
	tryStealHit(w, tg, w.cur);
    triggerSoulArrow(w); // <-- SE AGREGÓ AQUÍ (para skills de daño instantáneo)
  }
  // MP (valores provisionales: máx 10 + 3 por nivel; sin regeneración natural) y efectos visuales
  function stepExtras(w, dt) {
    var s = w.stats, c = w.cur, MI = root.MapleItems;
    s.maxMp = maxMpOf(c); s.maxHp = maxHpOf(c);
    
    // NUEVO: Bonus de recuperación de Perseverance
    var m = mods(c);
    var hpRegen = Math.max(0.2, s.maxHp * 0.003);
    // sin regeneración natural de MP: hay que usar pociones
    s.hp = Math.min(s.maxHp, s.hp + hpRegen * dt);
    if (m.recT > 0 && c.player.state !== 'dead') {   // Perseverance: cada recT s recupera hpRec% / mpRec% del máximo
      c.recClock = (c.recClock || 0) + dt;
      if (c.recClock >= m.recT) { c.recClock = 0; s.hp = Math.min(s.maxHp, s.hp + s.maxHp * (m.hpRec || 0) / 100); s.mp = Math.min(s.maxMp, s.mp + s.maxMp * (m.mpRec || 0) / 100); }
    } else c.recClock = 0;
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
      var esc = m.elite ? eliteCfg(w).scale : 1;
      if (Math.abs(m.x - p.x) > 26 * esc || p.y < m.y - 34 * esc || p.y - 70 > m.y) continue;
      var md = mods(w.cur), def = gear(w.cur).def + md.def, dmg = Math.max(1, Math.round(r.touch * (m.elite ? eliteCfg(w).dmgMul : 1) * (m.debuff ? 1 - m.debuff.dmg : 1) * (0.97 + Math.random() * 0.06) - 0.14 * def));   // daño recibido = PAD del mob - 0.14*DEF (ajustado con capturas de tu servidor)
	  if (md.physReduce > 0) {
         dmg = Math.max(1, Math.round(dmg * (1 - (md.physReduce / 100))));
      }
      if (md.eva > 0 && Math.random() < md.eva / (md.eva + 600)) { s.inv = 1; w.texts.push({ x: p.x, y: p.y - 75, txt: 'MISS', c: '#c9a6ff', t: 0, life: 0.8, num: 'miss' }); continue; }   // esquiva (evasión)
      if (md.absorb > 0 && s.mp > 0) { var pay = Math.min(s.mp, Math.round(dmg * Math.min(0.95, md.absorb))); s.mp -= pay; dmg -= pay; }   // Magic Guard
      s.hp -= dmg; s.inv = 2;
      if (md.reflect > 0 && dmg > 0) {   // Power Reflection: devuelve parte del daño al enemigo
        var rd = Math.max(1, Math.min(Math.round(dmg * md.reflect / 100), md.reflectMax || 1e9)); m.hp -= rd;
        w.texts.push({ x: m.x, y: m.y - 40, txt: String(rd), c: '#ffb347', t: 0, num: 'red' });
        if (m.hp <= 0) { m.state = 'dying'; m.t = 0; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; } else { m.state = 'hit'; m.t = 0.3; }
      }
      w.texts.push({ x: p.x, y: p.y - 75, txt: '-' + dmg, c: '#ff6b6b', t: 0, life: 1, num: 'violet' });
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
    stepIgnite(w);
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
      if (sk) { hitAt = sk.hitAt; total = skTotal(sk); }
      else { c = w.cfg.attack[p.atk.name]; hitAt = c.hitFrame * c.delay / 1000; total = c.frames * c.delay / 1000; }
      p.atk.t += dt * (p.atk.spd || 1);
      
      if (!p.atk.hit && p.atk.t >= hitAt) { 
        p.atk.hit = true; 
        if (sk && sk.buff) doBuffCast(w, p.atk); 
        else if (sk && sk.debuff) doDebuffCast(w, p.atk); 
        else if (sk && sk.summon) doSummonCast(w, p.atk); 
        else if (sk && sk.ranged) doRangedSkill(w, p.atk); 
        else if (sk) doSkillHit(w, p.atk); 
        else if (rangedCfg(w)) doThrow(w); 
        else doHit(w); 
      }
      
      // SISTEMA DE COMBO MEJORADO
      var isCombo = p.atk.comboQueue && p.atk.comboQueue.length > 0;
      var comboEnd = isCombo ? (hitAt + 0.1) : total; // Si hay habilidades en cola, cancela rápido
      
      if (p.atk.t >= comboEnd) {
         if (isCombo) {
            // Saca la siguiente habilidad de la cola y la lanza
            var nextSkill = p.atk.comboQueue.shift();
            var savedQueue = p.atk.comboQueue; // Guardamos la cola restante
            
            p.atk = null; // Limpiamos estado anterior
            if (startSkill(w, nextSkill)) {
               w.player.atk.comboQueue = savedQueue; // Restauramos la cola a la nueva habilidad
            } else {
               p.cd = 0.5; // Si falla por MP o distancia, termina el combo
            }
         } else {
            p.atk = null;
         }
      }
    }

    if (p.mv && (p.mv.k === 'dash' ? p.state !== 'ground' || p.atk : p.state !== 'air')) p.mv = null;
    if (p.mv && p.mv.k === 'dash') {
      // Warrior Leap / Soul Rush: agachado un instante y luego empujón por el suelo
      var dm = p.mv; dm.t += dt; p.vx = 0; p.moving = false; p.dir = dm.dir;
      if (dm.t >= dm.wind) {
        var dnx = p.x + dm.dir * dm.v * dt; p.moving = true;
        if (dnx < p.node.minX || dnx > p.node.maxX) {
          if (map.below(dnx, p.y, 3)) { p.x = dnx; p.state = 'air'; p.vy = 0; p.mv = null; }
          else { p.x = clamp(dnx, p.node.minX, p.node.maxX); p.mv = null; }
        } else p.x = dnx;
        if (p.state === 'ground') p.y = map.yAt(p.node, p.x);
        if (p.mv && dm.t >= dm.wind + dm.dur) p.mv = null;
      }
    } else if (p.state === 'ground') {
      if (!p.atk) {
        var dropB = inp.down && inp.jump && !(p.dropT > 0) ? map.below(p.x, p.y, 6) : null;
        if (p.dropT > 0) {
          // agachado antes de dejarse caer a la plataforma inferior
          p.dropT -= dt; p.moving = false; p.vx = 0;
          if (p.dropT <= 0) { p.dropT = 0; p.state = 'air'; p.vy = C.DROP_HOP; p.vx = 0; p.ignoreNode = p.node; p.ignoreY = p.y; }
        } else if (dropB && dropB.ys - p.y <= C.DROP_MAX) {
          p.dropT = C.DROP_PRONE; p.moving = false;
        } else if (inp.jump) {
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
            if (inp.skill && p.cd <= 0) {
               // INICIO MACRO BRAWLER
               if (inp.skill === 'MACRO_BRAWLER') {
                  if (startSkill(w, 'somersaultKick')) {
                     // Cola de combos: después del Kick, va el Corkscrew, luego el Tornado
                     w.player.atk.comboQueue = ['bwCorkscrewBlow', 'bwTornadoUppercut'];
                  }
               } else if (startSkill(w, inp.skill)) { }
            }
            else if (inp.attack && p.cd <= 0) startAttack(w);
          }
        }
      }
    } else if (p.state === 'air') {
      if (p.mv && p.mv.k === 'flash') {   // Flash Jump: impulso horizontal fijo mientras dura
        var fm = p.mv; fm.t += dt; p.dir = fm.dir; p.vx = fm.dir * fm.v; if (fm.t >= fm.dur) p.mv = null;
      } else { p.vx = mv * spd(w); if (mv) p.dir = mv; }
      p.vy += C.G * dt;
      var oy = p.y;
      p.x = clamp(p.x + p.vx * dt, map.minX, map.maxX);
      p.y += p.vy * dt;
      if (!tryAttach(w, inp) && p.vy > 0) {
        var l = map.landing(p.x, oy, p.y);
        if (p.ignoreNode) { if (p.y > p.ignoreY + 30) p.ignoreNode = null; else if (l && l.node === p.ignoreNode) l = null; }
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

  /* ---------- zonas de farmeo (rectángulo por personaje y mapa) ---------- */
  function zoneOf(c, mapId) { var z = c && c.zones && c.zones[mapId]; return z && z.x2 > z.x1 && z.y2 > z.y1 ? z : null; }
  function inZone(z, x, y) { return x >= z.x1 && x <= z.x2 && y >= z.y1 - 6 && y <= z.y2 + 6; }
  // plataforma dentro de la zona más cercana (en saltos) y punto central donde esperar; null si el cuadro no toca ninguna plataforma
  function zoneSpot(w, z, p) {
    var r = bfs(w.map, p.node.i, teleEdges(w)), best = null, bd = Infinity, cx = (z.x1 + z.x2) / 2;
    w.map.nodes.forEach(function (nd) {
      var lo = Math.max(nd.minX + 10, z.x1), hi = Math.min(nd.maxX - 10, z.x2); if (hi < lo || r.dist[nd.i] === Infinity) return;
      var x = Math.max(lo, Math.min(hi, cx)), y = w.map.yAt(nd, x); if (!inZone(z, x, y)) return;
      var d = r.dist[nd.i] * 10000 + Math.abs(x - p.x); if (d < bd) { bd = d; best = { node: nd, x: x, y: y }; }
    });
    return best;
  }
  function setZone(c, mapId, z) {
    if (!c.zones) c.zones = {};
    if (!z) { delete c.zones[mapId]; return true; }
    var o = { x1: Math.round(Math.min(z.x1, z.x2)), x2: Math.round(Math.max(z.x1, z.x2)), y1: Math.round(Math.min(z.y1, z.y2)), y2: Math.round(Math.max(z.y1, z.y2)) };
    if (o.x2 - o.x1 < 40 || o.y2 - o.y1 < 20) return false;
    c.zones[mapId] = o; return true;
  }
  function sanitizeZones(zs) {
    var out = {}; if (!zs || typeof zs !== 'object') return out;
    Object.keys(zs).forEach(function (k) { var z = zs[k]; if (z && isFinite(z.x1) && isFinite(z.x2) && isFinite(z.y1) && isFinite(z.y2) && z.x2 - z.x1 >= 40 && z.y2 - z.y1 >= 20) out[k] = { x1: +z.x1, y1: +z.y1, x2: +z.x2, y2: +z.y2 }; });
    return out;
  }

  /* ---------- IA idle: busca el enemigo más cercano (incluso en otro piso) y lo ataca ---------- */
  // Teleport (Mage) como medio de transporte: aristas extra del grafo (a plataformas dentro de dist px en horizontal y vert px en vertical, arriba o abajo)
  // tipo de movimiento: 'tele' (instantáneo, Mage), 'dash' (empujón desde el suelo, Warrior Leap/Soul Rush), 'flash' (salto + impulso en el aire), 'wings' (vuelo vertical a la plataforma de arriba)
  function moveKind(sk) { return sk.move || (sk.vertical ? 'wings' : /FlashJump/.test(sk.id) ? 'flash' : /WarriorLeap/.test(sk.id) ? 'dash' : 'tele'); }
  function teleSkill(w) {
    var SK = root.MapleSkills; if (!SK) return null;   // la primera skill de movimiento aprendida, en auto y permitida
    for (var i = 0; i < SK.ORDER.length; i++) { var sk = SK.SKILLS[SK.ORDER[i]], st = w.skills[sk.id]; if (sk.teleportSkill && st && st.level >= 1 && st.auto && skillAllowed(w.cur, sk)) return { sk: sk, lv: st.level, kind: moveKind(sk) }; }
    return null;
  }
  // MP suficiente y fuera de enfriamiento (reserve: deja un 20% de MP para las skills de ataque)
  function mvReady(w, ts, reserve) {
    var c = w.cur; return w.stats.mp >= ts.sk.mpCon(ts.lv) + (reserve ? w.stats.maxMp * 0.2 : 0) && !(c.tpT !== undefined && w.t - c.tpT < ts.sk.cooldown);
  }
  function fjParams(ts) { var dur = ts.sk.fjDur || 0.25, reach = ts.sk.dist(ts.lv); return { dur: dur, lift: ts.sk.fjLift || -300, reach: reach, v: reach / dur }; }
  function beFx(w, name, o) {   // animación de BasicEff.img
    var B = root.MapleBasicFx && root.MapleBasicFx[name], ms = 0, rate = (o && o.rate) || 1, f = { kind: 'be', name: name, t: 0, rate: rate };
    if (B) B.frames.forEach(function (fr) { ms += fr[2]; }); else ms = 800;
    f.life = ms / rate / 1000; for (var k in o) f[k] = o[k]; if (o && o.delay) { f.t = -o.delay; f.life += o.delay; } w.fx.push(f); return f;
  }
  // vuelo del Flash Jump (misma física que el motor): salta, al llegar casi al punto más alto da el impulso y después se dirige a tx. Devuelve el aterrizaje o null
  function flashFly(w, ts, node, xa, dir, tx) {
    var map = w.map, F = fjParams(ts), x = xa, y = map.yAt(node, xa), vy = C.JUMP_V, s = spd(w), dt = C.STEP, flashed = false, ft = 0;
    for (var n = 0; n < 150; n++) {
      if (!flashed && vy >= -60) { flashed = true; vy = Math.min(vy, F.lift); }
      var vx = !flashed ? dir * s : ft < F.dur ? dir * F.v : (Math.abs(tx - x) > 3 ? (tx > x ? s : -s) : 0);
      if (flashed && ft < F.dur) ft += dt;
      vy += C.G * dt; var oy = y; x = clamp(x + vx * dt, map.minX, map.maxX); y += vy * dt;
      if (vy > 0) { var l = map.landing(x, oy, y); if (l) return l; }
    }
    return null;
  }
  function teleEdges(w) {
    var ts = teleSkill(w); if (!ts || ts.kind === 'dash') return null;
    var c = w.cur, key = w.mapId + '|' + ts.sk.id + ts.lv; if (c._te && c._te.key === key) return c._te.edges;
    var map = w.map, dist = ts.sk.dist(ts.lv), vert = ts.sk.vert(ts.lv), edges = map.nodes.map(function () { return []; });
    if (ts.kind === 'flash') {
      var reach = fjParams(ts).reach;
      map.nodes.forEach(function (A) {
        map.nodes.forEach(function (B) {
          if (A === B || A.maxX + reach + 160 < B.minX || B.maxX + reach + 160 < A.minX) return;
          if (map.edges[A.i].some(function (e) { return e.to === B.i && e.type !== 'fall' && e.type !== 'drop'; })) return;   // ya se llega con un salto normal
          var m = (B.maxX - B.minX) >= 40 ? 16 : (B.maxX - B.minX) / 2, best = null;
          for (var xa = A.minX; xa <= A.maxX + 0.01; xa += 20) {
            [-1, 1].forEach(function (dir) {
              [40, 100, 160, 230].forEach(function (d) {
                var tx = clamp(xa + dir * d, B.minX + m, B.maxX - m), l = flashFly(w, ts, A, xa, dir, tx);
                if (l && l.node === B) { var sc = Math.abs(tx - xa); if (!best || sc < best.sc) best = { sc: sc, xa: xa, xb: tx, dir: dir }; }
              });
            });
          }
          if (best) edges[A.i].push({ type: 'tele', to: B.i, takeoffX: best.xa, landX: best.xb, dir: best.dir });
        });
      });
      c._te = { key: key, edges: edges }; return edges;
    }
    map.nodes.forEach(function (A) {
      map.nodes.forEach(function (B) {
        if (A === B || A.maxX + dist < B.minX || B.maxX + dist < A.minX) return;
        var m = (B.maxX - B.minX) >= 40 ? 16 : (B.maxX - B.minX) / 2, best = null, cB = (B.minX + B.maxX) / 2;
        for (var xa = A.minX; xa <= A.maxX + 0.01; xa += 20) {
          var xb = clamp(xa, B.minX + m, B.maxX - m), dxx = Math.abs(xa - xb), dy = map.yAt(A, xa) - map.yAt(B, xb);
          if (dxx > dist || Math.abs(dy) > vert || Math.abs(dy) < 20 && dxx < 10) continue;
          if (ts.kind === 'wings' && dy <= 20) continue;   // Wings: solo hacia la plataforma de arriba
          var sc = dxx + Math.abs(xb - cB) * 0.001;
          if (!best || sc < best.sc) best = { sc: sc, xa: xa, xb: xb };
        }
        if (best) edges[A.i].push({ type: 'tele', to: B.i, takeoffX: best.xa, landX: best.xb, dir: sign(best.xb - best.xa) });
      });
    });
    c._te = { key: key, edges: edges }; return edges;
  }
  function payMove(w, ts) { var c = w.cur; w.stats.mp -= ts.sk.mpCon(ts.lv); c.tpT = w.t; }
  // Teleport: instantáneo, con la animación de BasicEff
  function doTeleport(w, x, node) {
    var ts = teleSkill(w), p = w.player; if (!ts || ts.kind !== 'tele') return false;
    if (p.state !== 'ground' || p.atk || p.mv || !mvReady(w, ts, false)) return false;
    payMove(w, ts); beFx(w, 'Teleport', { x: p.x, y: p.y, dir: p.dir });
    p.dir = x >= p.x ? 1 : -1; p.node = node; p.x = x; p.y = w.map.yAt(node, x); p.vx = p.vy = 0; p.state = 'ground'; p.ladder = null;
    beFx(w, 'Teleport', { x: p.x, y: p.y, dir: p.dir }); return true;
  }
  // Warrior Leap / Soul Rush: se agacha un instante y sale empujado por el suelo hacia el frente
  function doDash(w, dir, dist) {
    var ts = teleSkill(w), p = w.player; if (!ts || ts.kind !== 'dash') return false;
    if (p.state !== 'ground' || p.atk || p.mv || !mvReady(w, ts, false)) return false;
    payMove(w, ts); p.dir = dir; p.moving = false;
    p.mv = { k: 'dash', t: 0, wind: C.DASH_WIND, dur: C.DASH_DUR, dir: dir, v: dist / C.DASH_DUR };
    beFx(w, 'SoulRush', { x: p.x, y: p.y, dir: dir, rate: 1.6, delay: C.DASH_WIND }); return true;
  }
  // Flash Jump: en el aire (tras saltar), cerca del punto más alto
  function doFlash(w, dir) {
    var ts = teleSkill(w), p = w.player; if (!ts || ts.kind !== 'flash') return false;
    if (p.state !== 'air' || p.mv || !mvReady(w, ts, false)) return false;
    var F = fjParams(ts); payMove(w, ts); p.dir = dir; p.vy = Math.min(p.vy, F.lift); p.mv = { k: 'flash', t: 0, dur: F.dur, dir: dir, v: F.v };
    var sk = ts.sk;
    if (sk.cls === 'thief') beFx(w, 'Flying', { x: p.x, y: p.y, dir: dir, follow: p, rate: 1.6 });
    else if (sk.effect) w.fx.push({ kind: 'effect', id: sk.id, life: sk.effect.length * (sk.effectDelay || 90) / 1000, x: p.x, y: p.y, dir: dir, t: 0, follow: p });
    return true;
  }
  // Wings: sube volando hasta la plataforma de arriba
  function doWings(w, e) {
    var ts = teleSkill(w), p = w.player; if (!ts || ts.kind !== 'wings') return false;
    if (p.state !== 'ground' || p.atk || !mvReady(w, ts, false)) return false;
    var B = w.map.nodes[e.to], dy = p.y - w.map.yAt(B, e.landX); if (dy <= 0) return false;
    payMove(w, ts); p.state = 'air'; p.ladder = null; p.vx = 0; p.vy = -Math.sqrt(2 * C.G * (dy + 34));
    var sk = ts.sk; if (sk.effect) w.fx.push({ kind: 'effect', id: sk.id, life: sk.effect.length * (sk.effectDelay || 90) / 1000, x: p.x, y: p.y, dir: p.dir, t: 0, follow: p });
    return true;
  }
  // salta e iniciará el Flash Jump al llegar arriba (la IA lo termina en el aire)
  function startFlash(w, dir, tx) {
    var ts = teleSkill(w), a = w.ai, inp = w.input, p = w.player; if (!ts || ts.kind !== 'flash' || p.state !== 'ground' || p.atk || !mvReady(w, ts, false)) return false;
    a.fj = { dir: dir || 1, tx: tx }; inp.jump = true; inp.left = inp.right = false; if (a.fj.dir > 0) inp.right = true; else inp.left = true; return true;
  }
  // avanzar en el suelo hacia dx px (con signo) usando la skill de movimiento, dejando "margin" px para andar. true si se inició
  function boost(w, dx, margin) {
    var ts = teleSkill(w), p = w.player; if (!ts || ts.kind === 'wings' || p.state !== 'ground' || p.atk || p.mv) return false;
    if (!mvReady(w, ts, true)) return false;
    var dir = dx >= 0 ? 1 : -1, ad = Math.abs(dx) - (margin || 0);
    if (ts.kind === 'tele') { var d1 = Math.min(ts.sk.dist(ts.lv), ad); if (d1 < 60) return false; return doTeleport(w, clamp(p.x + dir * d1, p.node.minX + 10, p.node.maxX - 10), p.node); }
    if (ts.kind === 'dash') { var d2 = Math.min(ts.sk.dist(ts.lv), ad); if (d2 < 70) return false; return doDash(w, dir, d2); }
    var R = fjParams(ts).reach;   // flash: el salto + impulso recorre ~R+90 px; no se usa si se pasaría del borde de la plataforma
    if (ad < R * 0.5 + 90 || p.x + dir * (R + 60) > p.node.maxX - 8 || p.x + dir * (R + 60) < p.node.minX + 8) return false;
    return startFlash(w, dir, p.x + dir * ad);
  }
  function tryTeleport(w, dx) { return boost(w, dx, 90); }
  function stepAI(w, dt) {
    var p = w.player, inp = w.input, a = w.ai, map = w.map;
    inp.left = inp.right = inp.up = inp.down = inp.jump = inp.attack = inp.skill = false;
    var walkTo = function (x, tol) {
      var d = x - p.x;
      if (Math.abs(d) <= tol) return true;
      if (p.state === 'ground' && Math.abs(d) > 110 && boost(w, d, tol + 4)) return false;   // skill de movimiento: se usa constantemente al desplazarse
      if (d > 0) inp.right = true; else inp.left = true;
      return false;
    };
    if (p.mv && p.mv.k === 'dash') return;   // empujón en curso
    if (a.avoidT > 0) { a.avoidT -= dt; if (a.avoidT <= 0) a.avoid = null; }
    if (p.atk) return;

    var e = a.edge;
    if (p.state === 'air') {
      if (a.fj) {   // Flash Jump: tras saltar, impulso al llegar casi arriba
        if (!p.mv && p.vy >= -60) { doFlash(w, a.fj.dir); a.fjTx = a.fj.tx; a.fj = null; }
        else { if (a.fj.dir > 0) inp.right = true; else inp.left = true; return; }
      }
      if (!e) { if (a.fjTx !== undefined) walkTo(a.fjTx, 6); return; }
      if (e.type === 'jump' || e.type === 'tele') walkTo(e.landX, 3);
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
    a.fj = null; a.fjTx = undefined;
    var ts0 = teleSkill(w);   // sin MP no se planifican rutas con la skill de movimiento (histéresis para no oscilar)
    if (ts0) { var mc0 = ts0.sk.mpCon(ts0.lv); if (w.stats.mp < mc0) a.mvOff = true; else if (w.stats.mp >= mc0 * 2) a.mvOff = false; } else a.mvOff = false;
    if (p.cd <= 0) { var bk = readyBuff(w) || readyDebuff(w); if (bk) { inp.skill = bk; return; } }
    var r = bfs(map, p.node.i, a.mvOff ? null : teleEdges(w)), t = null, best = Infinity, zn = zoneOf(w.cur, w.mapId), idle = false;
    // party leader / assist: los demás personajes del mapa siguen al líder y atacan a su mismo objetivo (ignoran su zona de farmeo)
    var lead = w.leader, follow = lead && lead !== w.cur && lead.mapId === w.cur.mapId && lead.player.state !== 'dead';
    if (follow) {
      zn = null; var lt = lead.ai.target;
      if (lt && alive(lt) && r.dist[lt.node.i] !== Infinity) t = lt;
      else { var lp = lead.player, off = (w.chars.indexOf(w.cur) - w.chars.indexOf(lead)) * 22; t = { x: lp.x + off, y: lp.y, node: lp.node }; idle = true; }
      // rezagado (otra plataforma o muy lejos): prioridad a alcanzar al líder, sin pelear con enemigos del camino
      var lq = lead.player;
      if (!idle && (lq.node !== p.node || Math.abs(lq.x - p.x) > 260)) { t = { x: lq.x + (w.chars.indexOf(w.cur) - w.chars.indexOf(lead)) * 22, y: lq.y, node: lq.node }; idle = true; }
    }
    var help = !!w.cur.helpBoss;
    var lastS = Infinity;
    if (!follow) w.mobs.forEach(function (m) {
      if (!alive(m) || m === a.avoid) return;
      if (zn && !inZone(zn, m.x, m.y) && !(help && m.boss)) return;   // con zona asignada solo busca enemigos dentro del cuadro (salvo el jefe si "ayudar jefes" está activo)
      var d = r.dist[m.node.i]; if (d === Infinity) return;
      var s = d * 10000 + Math.abs(m.x - p.x);
      if (m.boss && help) s -= 2e9; else if (m.elite) s -= 1e9;   // prioridad: jefe (si ayuda) > élite > resto
      if (m === a.last) lastS = s;
      if (s < best) { best = s; t = m; }
    });
    // histéresis: se mantiene el objetivo anterior salvo que otro esté claramente mejor (un salto menos o mucho más cerca); evita el vaivén entre dos enemigos casi equidistantes
    if (t && a.last && t !== a.last && lastS < Infinity && best > lastS - 4000) t = a.last;
    a.last = t && !idle ? t : (t ? a.last : null);
    if (!t && zn && !follow) {
      // sin enemigos en la zona: defenderse de uno pegado fuera del cuadro, o volver al centro de la zona y esperar
      w.mobs.forEach(function (m) { if (alive(m) && m.node === p.node && Math.abs(m.x - p.x) < 70 && Math.abs(m.x - p.x) < best) { best = Math.abs(m.x - p.x); t = m; } });
      if (!t) { t = zoneSpot(w, zn, p); idle = !!t; }
    }
    a.target = idle ? null : t; a.edge = null;
    if (!t) { a.key = null; return; }

    var key = 'same';
    if (idle && t.node === p.node) { if (follow && Math.abs(t.x - p.x) > 130 && tryTeleport(w, t.x - p.x)) return; walkTo(t.x, follow ? 20 : 8); return; }
    if (t.node === p.node) {
      var dx = t.x - p.x;
      var skId = readySkill(w, dx >= 0 ? 1 : -1);
      var wd = skId ? null : wantSkillDist(w);
      if (skId) { p.dir = dx >= 0 ? 1 : -1; if (p.cd <= 0) inp.skill = skId; }   // auto farm: usa la skill si hay enemigos bien dentro de su área
      else if (Math.abs(dx) > (wd !== null ? wd : (rangedCfg(w) ? rangedCfg(w).range * 0.8 : meleeNear(w))) + 60 && boost(w, dx, wd !== null ? wd : (rangedCfg(w) ? rangedCfg(w).range * 0.8 : meleeNear(w)))) { /* skill de movimiento: ya se inició */ }
      else if (wd !== null && Math.abs(dx) > wd) { if (dx > 0) inp.right = true; else inp.left = true; }   // hay skill disponible: acercarse al rango cómodo en vez de lanzarla al borde
      else if (Math.abs(dx) > (rangedCfg(w) ? rangedCfg(w).range * 0.8 : meleeNear(w))) { if (dx > 0) inp.right = true; else inp.left = true; }
      else { p.dir = dx >= 0 ? 1 : -1; if (p.cd <= 0) inp.attack = true; }
    } else {
      e = r.first[t.node.i]; a.edge = e; key = e;
      if (follow && e.type !== 'climb') { var tx0 = e.type === 'fall' ? e.exitX : e.takeoffX; if (Math.abs(tx0 - p.x) > 150 && tryTeleport(w, tx0 - p.x)) return; }   // el seguidor con Teleport lo usa para mantener el paso
      if (e.type === 'fall') walkTo(e.exitX + e.dir * 8, 0);
      else if (e.type === 'drop') {
        if (walkTo(e.takeoffX, 2.5)) { inp.down = true; inp.jump = true; inp.left = inp.right = false; }
      }
      else if (e.type === 'jump') {
        if (walkTo(e.takeoffX, 2.5)) {   // salta ya avanzando hacia el punto de aterrizaje: con impulso horizontal desde el despegue
          inp.jump = true; inp.left = inp.right = false;
          if (e.landX > p.x + 3) inp.right = true; else if (e.landX < p.x - 3) inp.left = true;
          var tsj = teleSkill(w);   // salto largo con Flash Jump: se impulsa en el aire
          if (tsj && tsj.kind === 'flash' && Math.abs(e.landX - p.x) > fjParams(tsj).reach + 40 && mvReady(w, tsj, true)) a.fj = { dir: e.landX > p.x ? 1 : -1, tx: e.landX };
        }
      }
      else if (e.type === 'tele') {
        if (walkTo(e.takeoffX, 3)) {   // sin MP o en enfriamiento espera aquí
          var tk = ts0 && ts0.kind;
          if (tk === 'flash') startFlash(w, e.dir || 1, e.landX); else if (tk === 'wings') doWings(w, e); else doTeleport(w, e.landX, w.map.nodes[e.to]);
        }
      }
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
      if (m.poison) {
        var pz = m.poison; pz.t -= dt; pz.acc += dt;
        if (m.state === 'dying' || m.state === 'dead') m.poison = null;
        else while (pz.acc >= 1 && m.poison) {
          pz.acc -= 1; bind(w, pz.owner); m.hp -= pz.dmg; w.texts.push({ x: m.x, y: m.y - 40, txt: String(pz.dmg), c: '#7ddc5a', t: 0, num: 'red' });
          if (m.hp <= 0) { m.state = 'dying'; m.t = 0; w.kills++; reward(w, m); w.killsByNode[m.node.i] = (w.killsByNode[m.node.i] || 0) + 1; m.poison = null; }
        }
        if (m.poison && pz.t <= 0) m.poison = null;
      }
      if (m.debuff) { m.debuff.t -= dt; if (m.debuff.t <= 0 || m.state === 'dying' || m.state === 'dead') m.debuff = null; }
	  if (m.stun) { m.stun.t -= dt; if (m.stun.t <= 0 || m.state === 'dying' || m.state === 'dead') m.stun = null; }
	  if (m.freeze) { m.freeze.t -= dt; if (m.freeze.t <= 0 || m.state === 'dying' || m.state === 'dead') m.freeze = null; }
	  if (m.freezeStack) { m.freezeStack.t -= dt; if (m.freezeStack.t <= 0 || m.state === 'dying' || m.state === 'dead') m.freezeStack = null; }
	  if (m.knock) { if (m.state === 'dying' || m.state === 'dead') m.knock = null; else { m.knock.t += dt; var kk = Math.min(1, m.knock.t / m.knock.dur); m.x = m.knock.from + (m.knock.to - m.knock.from) * (1 - (1 - kk) * (1 - kk)); if (kk >= 1) m.knock = null; } }
	  if (m.mark && m.mark.arm > 0) m.mark.arm -= dt;
	  if (m.mark) { m.mark.t -= dt; if (m.mark.t <= 0 || m.state === 'dying' || m.state === 'dead') m.mark = null; }
      switch (m.state) {
        case 'dying': m.t += dt; if (m.t >= 0.5) { m.state = 'dead'; m.t = m.boss ? m.boss.respawn : C.RESPAWN; } break;
        case 'dead':
          m.t -= dt;
          if (m.t <= 0) {
            if (m.elite && !m.eliteNext) { m.elite = false; m.maxHp = m.baseHp; }   // el élite derrotado vuelve a ser un enemigo normal
            if (m.eliteNext) {   // aparece el élite
              var EL2 = eliteCfg(w); m.eliteNext = false; m.elite = true; m.baseHp = m.baseHp || m.maxHp; m.maxHp = Math.round(m.baseHp * EL2.hpMul);
              w.texts.push({ x: m.spawnX, y: m.y - 110, txt: '¡Un enemigo ÉLITE ha aparecido!', c: '#ff5c5c', t: 0, life: 3, big: true });
            }
          }
          if (m.t <= 0 && m.boss) w.texts.push({ x: m.spawnX, y: m.y - 130, txt: '¡Ha aparecido ' + (m.kind.charAt(0).toUpperCase() + m.kind.slice(1)) + '!', c: '#ffd23f', t: 0, life: 3, big: true });
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
          if (m.state === 'move' && !m.stun && !m.freeze) {
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
	  if (w.cur.skillCd) for (var k in w.cur.skillCd) if (w.cur.skillCd[k] > 0) w.cur.skillCd[k] -= dt;
      if (w.player.state === 'dead') { stepDead(w, dt); return; }
      stepBuffs(w, dt);
      if (w.ai.auto) stepAI(w, dt);
      stepPlayer(w, dt);
      stepTouch(w, dt);
      if (w.player.state === 'dead') return;   // murió en este paso: sin regeneración ni pociones
      stepExtras(w, dt);
	  if (c.summon) stepSummon(w, c, dt);
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

    // Grenade pasiva (Gunslinger): al atacar, 30% de chance de lanzar una granada que explota en área
  function tryGrenade(w, targetMob) {
    var SK = root.MapleSkills; if (!SK) return;
    var sk = SK.SKILLS.gsGrenade, st = w.skills.gsGrenade;
    if (!sk || !st || st.level < 1 || !skillAllowed(w.cur, sk)) return;
    if (Math.random() * 100 >= sk.prop(st.level)) return;
    var sts = cstats(w), p = w.player;
    var dmg = Math.max(1, Math.round((sts.min + Math.floor(Math.random() * (sts.max - sts.min + 1))) * sk.damage(st.level) / 100));
    var target = targetMob;
    if (!target) {
      var cands = skillTargets(w, sk, p.dir, 15, 15);
      if (cands.length) target = cands[0].m;
    }
    if (!target) return;
    w.proj.push({
      x: p.x + p.dir * 18, y: p.y - 30, dir: p.dir, speed: sk.ball.speed, stack: 0, wait: 0,
      target: target, owner: w.cur, dmg: [dmg], hitT: -1, life: 1.5, rot: 0,
      kind: 'ball', ballId: sk.id, hitFx: sk.id, skillId: sk.id, lv: st.level, maxDmg: sts.max,
      splash: true, splashCount: sk.splashCount, splashRange: sk.splashRange, noSplashFalloff: true
    });
  }

  var api = { ELITE: ELITE, mapLimit: mapLimit, mapCount: mapCount, PARTY_BONUS: PARTY_BONUS, cstatsOf: cstatsOf, C: C, createWorld: createWorld, step: step, STEP: C.STEP, bfs: bfs, alive: alive, expToNext: expToNext, maxHp: maxHp, MAX_LEVEL: MAX_LEVEL, addCharacter: addCharacter, setLeader: setLeader, mods: mods, advanceJob: advanceJob, advanceCheck: advanceCheck, skillAllowed: skillAllowed, selectChar: selectChar, travel: travel, applyBuff: applyBuff, setZone: setZone, zoneOf: zoneOf, sanitizeZones: sanitizeZones };
  root.MapleSim = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
