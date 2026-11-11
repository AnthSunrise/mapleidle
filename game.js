/* Maple Idle - Etapa 1: dibujo, cámara y controles */
(function () {
  'use strict';
  var $t = window.$t || function (x) { return x; }, LOC = window.MAPLE_I18N && window.MAPLE_I18N.lang() === 'en' ? 'en-US' : 'es';
  var S = window.MapleSim, DATA = window.MAPDATA;
  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var ASSETS = 'assets/';
  var FACE_LEFT = true;                 // los sprites de MapleStory miran a la izquierda
  var DELAY = { walk: 130, stand: 400, mob: 220 };
  // Ajuste fino por frame { dx, dy } en píxeles (dy positivo = bajar el sprite).
  // swingO2_2: la espada apunta hacia abajo y la imagen mide 99 px (los demás ~78), así que al
  // anclar por el borde inferior el cuerpo subía 21 px. Se compensa para que la cabeza quede a la misma altura.
  var FRAME_OFFSETS = { 'swingO2_2': { dx: 0, dy: 21 } };
  var IMG_W = 2218, IMG_H = 1870;
  var MAPS = window.MAPLE_MAPS || {};
  var OFFS = {};                        // por mapa: posición del origen del mundo dentro de la imagen del render
  Object.keys(MAPS).forEach(function (id) {
    OFFS[id] = { x: MAPS[id].off.x, y: MAPS[id].off.y };
    try { var o = JSON.parse(localStorage.getItem(id === 'henesys' ? 'maple_off' : 'maple_off_' + id)); if (o && isFinite(o.x) && isFinite(o.y)) OFFS[id] = o; } catch (e) {}
  });
  var off = OFFS.henesys;               // offset del mapa que se está viendo (se actualiza en curMap())
  function curMap() { off = OFFS[world.mapId] || OFFS.henesys; A.bg = A.bgs[world.mapId] || null; }

  var world = S.createWorld(DATA, {});
  // progreso guardado en este navegador (v2: cuenta con varios personajes, inventario y mesos compartidos)
  var hasSave = false;
  try {
    var sv = JSON.parse(localStorage.getItem('maple_save'));
    var list = sv && (sv.chars || (sv.level >= 1 ? [{ name: 'Guerrero', cls: 'warrior', level: sv.level, exp: sv.exp, equip: sv.equip, skills: sv.skills }] : null));   // v1 = guardado de las etapas 1-4
    if (list && list.length) {
      world.chars = []; world.leader = null;
      list.slice(0, 6).forEach(function (c) {
        var cls = window.MapleItems.CLASSES[c.cls] ? c.cls : 'warrior';
        S.addCharacter(world, { name: String(c.name || 'Personaje').slice(0, 12), cls: cls, mapId: world.zones[c.mapId] ? c.mapId : 'henesys', level: Math.max(1, Math.min(S.MAX_LEVEL, (c.level | 0) || 1)),
          exp: Math.max(0, +c.exp || 0), potions: window.MapleItems.sanitizePotions(c.potions), branch: window.MapleJobs && window.MapleJobs.valid(cls, c.branch) ? c.branch : null, equip: window.MapleItems.sanitize(null, c.equip, cls).equip, skills: window.MapleSkills.sanitize(c.skills), look: c.look && typeof c.look.hair === 'string' && typeof c.look.face === 'string' ? { hair: c.look.hair, face: c.look.face } : null, zones: S.sanitizeZones(c.zones), helpBoss: !!c.helpBoss });
      });
      world.mesos = Math.max(0, +sv.mesos || 0);
      list.slice(0, 6).forEach(function (c, i) { var ch = world.chars[i]; if (ch && isFinite(c.farmExp) && c.farmExp > 0) { ch.farmExp = +c.farmExp; ch.farmN = Math.max(1, c.farmN | 0); } });   // ritmo de farmeo medido (progreso offline)
      if (sv.farm && isFinite(sv.farm.mesos)) { world.farm = { n: Math.max(1, sv.farm.n | 0), mesos: Math.max(0, +sv.farm.mesos), items: {} }; Object.keys(sv.farm.items || {}).forEach(function (k) { if (isFinite(sv.farm.items[k]) && sv.farm.items[k] > 0) world.farm.items[k] = +sv.farm.items[k]; }); }
      world.inv = window.MapleItems.sanitize(sv.inv, null).inv;
      S.selectChar(world, Math.min(world.chars.length - 1, Math.max(0, sv.selected | 0)));
      if (sv.leader !== undefined && sv.leader !== null && world.chars[sv.leader | 0]) world.leader = world.chars[sv.leader | 0];
      world.quests = sv.quests || null;   // quests.js lo normaliza
      hasSave = true;
    }
  } catch (e) {}
  var lastRun = Date.now(), lastSv = lastRun, BG_GAP = 20;   // lastRun: último instante en que la simulación avanzó (el progreso offline mide los huecos de más de BG_GAP s)
  var noSave = !hasSave;   // sin partida (aún no se creó el primer personaje) no se guarda nada; se activa con G.enableSave()
  function enableSave() { noSave = false; }
  function save() {
    if (noSave) return;
    try {
      localStorage.setItem('maple_save', JSON.stringify({ v: 2, savedAt: lastRun, quests: world.quests || null, farm: world.farm || null, leader: world.leader ? world.chars.indexOf(world.leader) : null, mesos: world.mesos, inv: world.inv, selected: world.selected,
        chars: world.chars.map(function (c) { return { name: c.name, cls: c.cls, mapId: c.mapId, branch: c.branch || null, level: c.stats.level, exp: c.stats.exp, equip: c.equip, skills: c.skills, potions: c.potions, look: c.look || null, zones: c.zones || {}, helpBoss: !!c.helpBoss, farmExp: Math.round((c.farmExp || 0) * 1e4) / 1e4, farmN: c.farmN || 0 }; }) }));
    } catch (e) {}
  }
  function resetGame() {   // borra la partida (y las posiciones de cámara) y recarga
    noSave = true;   // bloquea el autoguardado hasta que se cree un personaje nuevo
    try { Object.keys(localStorage).forEach(function (k) { if (k === 'maple_save' || k.indexOf('maple_off') === 0) localStorage.removeItem(k); }); } catch (e) {}
    location.reload();
  }
  window.MAPLE_GAME = { world: world, save: save, reset: resetGame, enableSave: enableSave, hasSave: hasSave, isDebug: function () { return debug; },
    visible: function () { var m = world.chars[world.selected].mapId, o = []; world.chars.forEach(function (c, i) { if (c.mapId === m) o.push(i); }); return o; } };
  setInterval(save, 5000);
  addEventListener('beforeunload', save); addEventListener('pagehide', save); document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });

  var A = { chars: { warrior: {}, thief: {} }, mob: {}, bg: null, bgs: {} };
  var zoom = 1, speed = 1, debug = false, cam = { x: 0, y: 0 }, keys = {};

  function loadImg(src) { return new Promise(function (r) { var i = new Image(); i.onload = function () { r(i); }; i.onerror = function () { r(null); }; i.src = src; }); }
  // Secuencias de frames (base_0.png, base_1.png...): al cargar por primera vez se sondea hasta el primer hueco (esos 404 finales son normales); el número
  // de frames se guarda en localStorage y las siguientes cargas piden sólo los archivos que existen (sin errores en consola y en paralelo).
  // Si cambias/añades frames de un sprite existente, sube ASSET_VER o abre el juego con ?nocache en la dirección.
  var ASSET_VER = '1', SEQ_KEY = 'maple_seq:' + location.pathname, SEQ = {}, seqDirty = false;
  try { SEQ = JSON.parse(localStorage.getItem(SEQ_KEY)) || {}; } catch (e) { SEQ = {}; }
  if (SEQ.v !== ASSET_VER || /[?&]nocache/.test(location.search)) SEQ = { v: ASSET_VER };
  function seqSave() { if (seqDirty) { seqDirty = false; try { localStorage.setItem(SEQ_KEY, JSON.stringify(SEQ)); } catch (e) { } } }
  // los archivos declarados en skills.js que no existen se recuerdan (SEQ.miss) y no se vuelven a pedir
  function loadMany(list) {
    var miss = SEQ.miss || (SEQ.miss = {});
    return Promise.all(list.map(function (u) {
      if (miss[u]) return null;
      return loadImg(u).then(function (im) { if (!im) { miss[u] = 1; seqDirty = true; } return im; });
    }));
  }
  async function loadSeq(base) {
    var c = SEQ[base];
    if (c) {
      if (!c.n) return [];
      var arr = await loadMany(c.one ? [ASSETS + base + '.png'] : Array.apply(null, Array(c.n)).map(function (_, i) { return ASSETS + base + '_' + (c.s + i) + '.png'; }));
      if (arr.every(Boolean)) return arr;   // los archivos cambiaron: se vuelve a sondear
    }
    for (var s = 0; s <= 1; s++) {
      var out = [];
      for (var i = s; i < s + 24; i++) { var im = await loadImg(ASSETS + base + '_' + i + '.png'); if (!im) break; out.push(im); }
      if (out.length) { SEQ[base] = { s: s, n: out.length }; seqDirty = true; return out; }
    }
    var one = await loadImg(ASSETS + base + '.png');
    SEQ[base] = one ? { one: 1, n: 1 } : { n: 0 }; seqDirty = true;
    return one ? [one] : [];
  }
  async function loadAll() {
    var mids = Object.keys(MAPS), bgl = await loadMany(mids.map(function (m) { return ASSETS + MAPS[m].img; }));
    mids.forEach(function (m, i) { A.bgs[m] = bgl[i]; });
    A.bg = A.bgs.henesys;
    A.backs = {};   // fondos por mapa (backdata_*.js): capas con parallax, repetición y animación
    var BK = window.MAPLE_BACKS || {};
    await Promise.all(Object.keys(BK).map(async function (mid) {
      var L = BK[mid]; if (!L) return;
      A.backs[mid] = await Promise.all(L.map(async function (l) {
        var imgs = await loadMany(l.frames.map(function (f) { return ASSETS + f.src; }));
        return { l: l, imgs: imgs };
      }));
    }));
    A.star = [await loadImg(ASSETS + 'skill/star_0.png'), await loadImg(ASSETS + 'skill/star_1.png')];
    A.skill = {};   // efectos de las skills de área: A.skill[id] = { effect: [...], hit: [...] }
    var SKS = window.MapleSkills.SKILLS;
    await Promise.all(Object.keys(SKS).map(async function (sid) {
      var SKD = SKS[sid], dir = SKD.dir, R = function (pre, n) { var l = []; for (var q = 0; q < n; q++) l.push(dir + pre + q + '.png'); return loadMany(l); };
      if (SKD.passiveSkill && SKD.hit && SKD.dir) {
        A.skill[sid] = { effect: [], hit: await R('hit_', SKD.hit.length), effect0: [] };
        if (SKD.effect) A.skill[sid].effect = await R('effect_', SKD.effect.length);
        if (SKD.effect0) A.skill[sid].effect0 = await R('effect0_', SKD.effect0.length);
        return;
      }
      if (SKD.teleportSkill) { if (SKD.effect && SKD.dir) A.skill[sid] = { effect: await R('effect_', SKD.effect.length), hit: [] }; return; }   // Flash Jump / Wings: solo el efecto
      if (SKD.buff || SKD.debuff || (SKD.ranged && !SKD.ball) || SKD.passiveSkill) return;   // ranged con `ball` (Triple Shot) sí carga efecto y golpe
      A.skill[sid] = { effect: await R('effect_', SKD.effect.length), hit: await R('hit_', SKD.hit.length) };
    }));
    A.arrow = await loadImg(ASSETS + 'skill/arrow.png');
    A.basic = {}; var BF = window.MapleBasicFx || {};   // animaciones de BasicEff.img: Teleport, SoulRush, Flying, LevelUp, JobChanged
    await Promise.all(Object.keys(BF).map(async function (k) { A.basic[k] = await loadMany(BF[k].frames.map(function (_, i) { return ASSETS + 'basic/' + k + '/' + i + '.png'; })); }));
    var IG = window.MapleSkills.SKILLS.fpIgnite; A.ignite = await Promise.all(IG.tiles.map(function (t, is) { return loadMany(t.map(function (_, ifr) { return IG.dir + 'tile_' + is + '_' + ifr + '.png'; })); }));   // fuego en el suelo de Ignite: 3 tamaños x 7 frames
    A.mobDebuff = {}; A.buffFx = {}; A.ball = {};
    var jobs = [];
    Object.keys(SKS).forEach(function (k) {
      var D2 = SKS[k], dir = D2.dir;
      // marca sobre los enemigos debilitados (Threaten) / objetos multinivel (Freezing Crush)
      if (D2.mobFx) {
        if (Array.isArray(D2.mobFx[0]) && typeof D2.mobFx[0][0] === 'object') {
          A.mobDebuff[k] = [];
          D2.mobFx.forEach(function (lv, st) { jobs.push(loadMany(lv.map(function (_, dn) { return dir + 'mob/' + st + '/' + dn + '.png'; })).then(function (l) { A.mobDebuff[k][st] = l; })); });
        } else jobs.push(loadMany(D2.mobFx.map(function (_, dn) { return dir + 'mob_' + dn + '.png'; })).then(function (l) { A.mobDebuff[k] = l; }));
      }
      // efectos de los buffs con sprites: haste, Magic Guard, Dash
      if ((D2.buff || D2.debuff) && D2.effect && dir) jobs.push(loadMany(D2.effect.map(function (_, bi) { return dir + 'effect_' + bi + '.png'; })).then(function (l) { A.buffFx[k] = l; }));
      // proyectil de las skills con `ball` (Arrow Blow)
      if (D2.ball) jobs.push(loadMany(D2.ball.origin.map(function (_, bn) { return dir + 'ball_' + bn + '.png'; })).then(function (l) { A.ball[k] = l; }));
    });
    var LSD = SKS.luckySeven; A.ls = {};
    Object.keys(LSD.tiers).forEach(function (tk) {
      A.ls[tk] = { effect: [], hit: [] };
      jobs.push(loadMany(LSD.tiers[tk].effect.map(function (_, li) { return LSD.dir + 'effect_' + tk + '_' + li + '.png'; })).then(function (l) { A.ls[tk].effect = l; }));
      jobs.push(loadMany(LSD.tiers[tk].hit.map(function (_, lj) { return LSD.dir + 'hit_' + tk + '_' + lj + '.png'; })).then(function (l) { A.ls[tk].hit = l; }));
    });
    await Promise.all(jobs);
    // Sprites antiguos de assets/char: sólo se cargan si el motor de capas (layers.js) no está disponible; con capas ya no se usan
    var LY = window.MapleLayers;
    if (!LY || !LY.ready()) {
      var names = { stand: 'stand1', walk: 'walk1', jump: 'jump', swingO1: 'swingO1', swingO2: 'swingO2' };
      for (var k in names) A.chars.warrior[k] = await loadSeq('char/warrior/' + names[k]);
      ['swingO1', 'swingO2'].forEach(function (n) {
        var c = world.cfg.attack[n], f = A.chars.warrior[n].length;
        if (f) { c.frames = f; c.hitFrame = Math.min(1, f - 1); }
      });
      var tn = { stand: 'stand', walk: 'walk', jump: 'jump', throw: 'throw', alert: 'alert' };
      for (var tk in tn) A.chars.thief[tk] = await loadSeq('char/thief/' + tn[tk]);
      if (A.chars.thief.throw.length) { var tc = world.cfg.attack.throw; tc.frames = A.chars.thief.throw.length; tc.hitFrame = Math.min(1, tc.frames - 1); }
    } else {
      ['warrior', 'thief'].forEach(function (cl) { ['stand', 'walk', 'jump', 'swingO1', 'swingO2', 'throw', 'alert'].forEach(function (k) { A.chars[cl][k] = []; }); });
    }
    await loadNums();
    await Promise.all(['mushmom', 'snail_blue', 'snail_red', 'blue_mushroom', 'golem', 'wraith', 'swamp', 'octopus', 'orange_mushroom', 'pig', 'slime', 'wild_boar'].map(async function (kind) {
      var d = { move: await loadSeq('mob/' + kind + '/move') };
      if (!d.move.length) d.move = await loadSeq('mob/' + kind + '/stand');
      d.hit = await loadSeq('mob/' + kind + '/hit');
      A.mob[kind] = d;
    }));
    seqSave();
  }

  // Números de daño de MapleStory: el primer dígito es del set "1" (más grande) y el resto del set "0". red = daño causado, cri = crítico, violet = daño recibido.
  var NUM = { red: ['NoRed1', 'NoRed0'], cri: ['NoCri1', 'NoCri0'], violet: ['NoViolet1', 'NoViolet0'] };
  async function loadNums() {
    var D = window.MAPLE_DMG; if (!D) return; A.num = {};
    var jb = []; for (var set in D) { A.num[set] = {}; Object.keys(D[set]).forEach(function (d) { var st = set; jb.push(loadImg('assets/dmg/' + st + '/' + d + '.png').then(function (im) { A.num[st][d] = im; })); }); }
    await Promise.all(jb);
  }
  function drawNum(t) {
    if (t.num === 'miss') {   // sprite "Miss" de MapleStory (NoViolet0/Miss)
      var mi = A.num && A.num.NoViolet0 && A.num.NoViolet0.Miss, mm = window.MAPLE_DMG && window.MAPLE_DMG.NoViolet0.Miss; if (!mi || !mm) return false;
      var lf = t.life || 0.8, al = Math.max(0, Math.min(1, (lf - t.t) / (lf * 0.35)));
      ctx.save(); ctx.globalAlpha = al; ctx.drawImage(mi, Math.round(t.x - mm[2] * 0.7), Math.round(t.y - mm[3] * 0.7), Math.round(mm[0] * 0.7), Math.round(mm[1] * 0.7)); ctx.restore(); return true;
    }
    var D = window.MAPLE_DMG, S = NUM[t.num], digs = String(t.txt).replace(/\D/g, '');
    if (!D || !A.num || !S || !digs) return false;
    var items = [], total = 0, ADV = 3, i;
    var ce = t.num === 'cri' && A.num && A.num.NoCri1 && A.num.NoCri1.effect, cm = D.NoCri1 && D.NoCri1.effect;
    for (i = 0; i < digs.length; i++) {
      var set = S[i === 0 ? 0 : 1], im = A.num[set] && A.num[set][digs[i]], m = D[set][digs[i]]; if (!im) return false;
      items.push({ im: im, m: m, set: set }); total += m[0] - ADV;
    }
    var life = t.life || 0.8, a = Math.max(0, Math.min(1, (life - t.t) / (life * 0.35))), x = t.x - total / 2, sc = t.num === 'violet' ? 0.9 : 1, pop = t.t < 0.08 ? 1 + (0.08 - t.t) * 5 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(t.x, t.y); ctx.scale(sc * pop, sc * pop); ctx.translate(-t.x, -t.y);
    for (i = 0; i < items.length; i++) { ctx.drawImage(items[i].im, Math.round(x), Math.round(t.y - items[i].m[3])); x += items[i].m[0] - ADV; }
    if (ce && cm) { ctx.globalAlpha = a * (t.t < 0.25 ? 1 : 0.6); ctx.drawImage(ce, Math.round(t.x - total / 2 - cm[2] + 8), Math.round(t.y - cm[3] + 6)); }   // "effect" del crítico (NoCri1/effect)
    ctx.restore(); return true;
  }

  function sprite(img, name, x, y, dir, alpha, sc) {
    var f = FRAME_OFFSETS[name] || (name.indexOf('thief:') === 0 ? { dx: 0, dy: 2 } : { dx: 0, dy: 0 });   // los sprites del Thief tienen 2 px de margen bajo los pies
    ctx.save(); ctx.translate(Math.round(x + f.dx), Math.round(y + f.dy));
    if (alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
    if (FACE_LEFT ? dir > 0 : dir < 0) ctx.scale(-1, 1);
    if (sc && sc !== 1) ctx.scale(sc, sc);
    ctx.drawImage(img, -Math.round(img.width / 2), -img.height);
    ctx.restore();
  }

  function pick(list, idx) { return list && list.length ? { img: list[Math.min(idx, list.length - 1)], i: Math.min(idx, list.length - 1) } : null; }
  function playerFrame(ch) {
    var p = ch.player, c = A.chars[ch.cls] || A.chars.warrior, ms = world.t * 1000, key = 'stand', idx = 0;
    if (p.atk && p.atk.skill && p.atk.skill.buff) { key = 'alert'; idx = Math.floor(p.atk.t / 0.15); }   // buff: pose alert
    else if (p.atk && p.atk.skill && p.atk.skill.ranged) { key = 'throw'; idx = Math.floor(p.atk.t / (world.cfg.attack.throw.delay / 1000)); }
    else if (p.atk && p.atk.skill) {
      // skill: carga parado hasta el frame 5 del efecto, luego swingO2
      var sw = p.atk.t - p.atk.skill.windup;
      if (sw < 0) { key = 'stand'; idx = 0; } else { key = 'swingO2'; idx = Math.floor(sw / (world.cfg.attack.swingO2.delay / 1000)); }
    }
    else if (p.atk) { key = p.atk.name; idx = Math.floor(p.atk.t / (world.cfg.attack[key].delay / 1000)); }
    else if (p.state === 'air') key = 'jump';
    else if (p.state === 'ground' && p.moving) { key = 'walk'; idx = Math.floor(ms / DELAY.walk) % Math.max(1, c.walk.length); }
    else idx = Math.floor(ms / DELAY.stand) % Math.max(1, c.stand.length);
    var f = pick(c[key], idx) || pick(c.stand, 0);
    return f ? { img: f.img, name: (ch.cls === 'thief' ? 'thief:' : '') + key + '_' + f.i } : null;
  }

  var summonCache = {};
  function drawSummon(c) {
    if (!c.summon) return;
    var sm = c.summon, sk = sm.sk;
    var animData = sk.summonAnim ? sk.summonAnim[sm.state] : null;
    if (!animData) return;
    
    var frameIdx = 0;
    if (sm.state === 'attack') {
      var elapsed = 0.8 - sm.frameT;
      frameIdx = (elapsed < 0.1) ? 0 : 1; 
    } else {
      frameIdx = Math.floor((world.t * 1000) / sk.animDelay) % animData.length;
    }
    
    var path = sk.dir + sm.state + '_' + frameIdx + '.png';
    var frame = animData[frameIdx];
    
    if (!summonCache[path]) {
      summonCache[path] = new Image();
      // En cuanto la imagen cargue, forzamos un dibujado (solo la 1ra vez)
      summonCache[path].onload = function() {
        if (c.summon && c.summon.state === sm.state) {
            // Este bloque vacío asegura que la memoria la reconozca instantáneamente
        }
      };
      summonCache[path].src = path;
    }
    
    var img = summonCache[path];
    
    // CORRECCIÓN: Si ya está en memoria (complete), la dibujamos
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(Math.round(sm.x), Math.round(sm.y));
      if (FACE_LEFT ? sm.dir > 0 : sm.dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -frame.ox, -frame.oy);
      ctx.restore();
    }
  }

  function drawPlayer() {
    world.chars.forEach(function (c) { 
      if (c.mapId === world.mapId) {
        drawChar(c);
        drawSummon(c); // <-- Dibuja el halcón justo después del personaje
      }
    });
    // etiqueta de nombre como en MapleStory: caja negra (66% opaca) con las esquinas cortadas 1px y texto blanco sin borde, bajo los pies
    ctx.font = '12px Tahoma, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    world.chars.forEach(function (c, i) {
      if (c.mapId !== world.mapId) return;
      var tw = Math.ceil(ctx.measureText(c.name).width), w = tw + 9, h = 16, x = Math.round(c.player.x - w / 2), y = Math.round(c.player.y + 2);
      ctx.fillStyle = 'rgba(0,0,0,0.66)';
      ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + w - 1, y); ctx.lineTo(x + w, y + 1); ctx.lineTo(x + w, y + h - 1); ctx.lineTo(x + w - 1, y + h); ctx.lineTo(x + 1, y + h); ctx.lineTo(x, y + h - 1); ctx.lineTo(x, y + 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = i === world.selected ? '#ffe45c' : '#fff'; ctx.fillText(c.name, Math.round(c.player.x), y + 12);
    });
  }
  function drawTomb(c) {   // lápida con cuenta regresiva mientras el personaje está muerto
    var p = c.player;
    ctx.fillStyle = '#9aa0ad'; ctx.strokeStyle = '#3c4150'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x - 13, p.y); ctx.lineTo(p.x - 13, p.y - 26); ctx.arc(p.x, p.y - 26, 13, Math.PI, 0); ctx.lineTo(p.x + 13, p.y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3c4150'; ctx.fillRect(p.x - 2, p.y - 32, 4, 16); ctx.fillRect(p.x - 7, p.y - 27, 14, 4);
    var t = $t('Revive en {0} s', Math.ceil(c.deadT));
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(t, p.x, p.y - 50); ctx.fillStyle = '#ff9a9a'; ctx.fillText(t, p.x, p.y - 50);
  }
  // Personaje por capas (layers.js): acción WZ + fotograma según el estado; devuelve null si aún cargan las imágenes
  function throwAction(cls, br) { if (cls === 'pirate' && br === 'gunslinger') return 'shot'; var c = world.cfg.classes[cls]; return (c && c.action) || 'swingO3'; }   // Thief: swingO3 (claw = ataque tipo 7); Archer: shoot1 (arco)
  function atIdx(action, ms) {   // fotograma en bucle según los retardos del WZ
    var d = window.MapleLayers.delays(action), tot = d.reduce(function (a, b) { return a + b; }, 0), t = tot ? ms % tot : 0;
    for (var i = 0; i < d.length; i++) { if (t < d[i]) return i; t -= d[i]; }
    return 0;
  }
  function layeredFrame(ch) {
    var L = window.MapleLayers; if (!L || !L.ready()) return null;
    // el motor de capas solo necesita ids (texto): los equipos con potencial/scrolls son objetos { id, pot, sc }, así que se le pasa una vista con los ids planos
    var MI = window.MapleItems, pe = {}; for (var sl in ch.equip) if (ch.equip[sl]) pe[sl] = MI ? MI.idOf(ch.equip[sl]) : ch.equip[sl];
    var ch0 = ch; ch = { cls: ch0.cls, branch: ch0.branch, look: ch0.look || (ch0.look = L.defaultLook(ch0.cls)), equip: pe };
    var p = ch0.player, ms = world.t * 1000, act = 'stand1', fi = 0, loop = true, fixed = null;
    var tdel = world.cfg.attack.throw.delay / 1000;
    // CORRECCIÓN BRAWLER & ASSASSIN: Manejo de animaciones avanzadas
    var rawAct = p.atk && p.atk.skill ? p.atk.skill.action : null;
    if (rawAct === 'shurikenBurst' || rawAct === 'windTalisman' || rawAct === 'screw' || rawAct === 'tornadoUpper') {
      // Si el motor de capas no reconoce 'screw' o 'tornadoUpper', obligamos a usar puñetazo (stabO1) para evitar el error del arma fantasma
      act = (ch.cls === 'pirate') ? 'stabO1' : throwAction(ch.cls); fi = p.atk.t / tdel; loop = false;
    }
    else if (p.atk && p.atk.skill && p.atk.skill.buff) { act = 'alert'; fi = p.atk.t / 0.15; loop = false; }
    else if (p.atk && p.atk.skill && p.atk.skill.ranged) { act = p.atk.skill.action || throwAction(ch.cls); fi = p.atk.t / tdel; loop = false; }
    else if (p.atk && p.atk.skill) { var sw = p.atk.t - p.atk.skill.windup; loop = false; if (sw >= 0) { act = p.atk.skill.action || 'swingO2'; fi = act === 'somersault' ? 1 + sw / 0.12 : sw / (world.cfg.attack.swingO2.delay / 1000); loop = false; } }
    else if (p.atk) { act = p.atk.name === 'throw' ? throwAction(ch.cls, ch.branch) : (ch.cls === 'pirate' ? 'stabO1' : p.atk.name); fi = p.atk.t / (world.cfg.attack[p.atk.name].delay / 1000); loop = false; }
    else if (p.state === 'climb' && p.ladder) {
      act = p.ladder.l ? 'ladder' : 'rope'; loop = false;
      if (p.moving) ch0._cI = Math.floor(world.t * 1000 / 250) % 2; fixed = ch0._cI || 0;
    }
    else if (p.state === 'air') { act = 'jump'; loop = false; }
    else if (p.state === 'ground' && (p.dropT > 0 || (p.mv && p.mv.k === 'dash' && p.mv.t < p.mv.wind))) { act = 'prone'; loop = false; fi = 0; }
    else if (p.state === 'ground' && p.moving) act = 'walk1';
    // pose según el arma equipada (lanza/ballesta: stand2, walk2, swingP/T, shoot2; pistola: swingP). El progreso se reescala si la pose tiene otro nº de fotogramas.
    var a2 = L.remap ? L.remap(ch, act) : act, idx;
    if (fixed !== null) idx = fixed;
    else if (loop) idx = atIdx(a2, ms);
    else { var n1 = L.frames(act), n2 = L.frames(a2); idx = Math.floor(a2 !== act && n1 > 0 && n2 > 0 ? fi * n2 / n1 : fi); }
    return L.frame(ch, a2, idx);
  }
  function drawChar(c) {
    var p = c.player;
    if (p.state === 'dead') { drawTomb(c); return; }
    var lf = layeredFrame(c);
    if (lf) {
      ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y));
      if (c.stats.inv > 0 && Math.floor(world.t * 10) % 2) ctx.globalAlpha = 0.45;   // parpadea al ser golpeado
      if (FACE_LEFT ? p.dir > 0 : p.dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(lf.cv, -lf.rx, -lf.ry); ctx.restore(); return;
    }
    var f = playerFrame(c);
    if (f) sprite(f.img, f.name, p.x, p.y, p.dir, c.stats.inv > 0 && Math.floor(world.t * 10) % 2 ? 0.45 : 1);   // parpadea al ser golpeado
    else { ctx.fillStyle = '#3b6fd8'; ctx.fillRect(p.x - 14, p.y - 52, 28, 52); ctx.fillStyle = '#fff'; ctx.fillRect(p.x + p.dir * 8 - 3, p.y - 44, 6, 6); }
  }
  // efectos de skill: el punto "origin" del frame se coloca sobre el personaje (o sobre el enemigo golpeado)
  function fxSprite(img, ox, oy, x, y, dir) {
    if (!img) return;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y));
    if (dir !== undefined && (FACE_LEFT ? dir > 0 : dir < 0)) ctx.scale(-1, 1);
    ctx.drawImage(img, -ox, -oy); ctx.restore();
  }
  function drawSkillFx() {
    if (!A.skill) return;
    world.chars.forEach(function (c) {
      if (c.mapId !== world.mapId) return;
      var p = c.player, sk = p.atk && p.atk.skill;
      if (!sk) return;
      if (sk.buff || sk.debuff) { if (!sk.effect) return; var bf = A.buffFx && A.buffFx[sk.id], bj = Math.min(sk.effect.length - 1, Math.floor(p.atk.t * 1000 / sk.effectDelay)); if (bf) fxSprite(bf[bj], sk.effect[bj].ox, sk.effect[bj].oy, p.x, p.y, p.dir); return; }
      if (sk.ranged && sk.tiers && sk.tierFor) {   // Lucky Seven: el efecto depende del nivel del personaje
        var tr = sk.tiers[sk.tierFor(c.stats.level)], tf = A.ls && A.ls[sk.tierFor(c.stats.level)];
        var li2 = Math.min(tr.effect.length - 1, Math.floor(p.atk.t * 1000 / sk.effectDelay));
        if (tf) fxSprite(tf.effect[li2], tr.effect[li2][0], tr.effect[li2][1], p.x, p.y, p.dir); return;
      }
      var vs = window.MapleSkills.view(sk, c.stats.level), i = Math.min(vs.effect.length - 1, Math.floor(p.atk.t * 1000 / vs.effectDelay));
      var fxOffY = vs.fxOffsetY || 0;
      var fxOffX = vs.fxOffsetX || 0;
      var sfx = A.skill[vs.id]; if (sfx) fxSprite(sfx.effect[i], vs.effect[i].ox, vs.effect[i].oy, p.x + (p.dir * fxOffX), p.y + fxOffY, p.dir);
    });
    world.proj.forEach(function (q) {   // estrellas (dibujo provisional hasta tener el sprite)
      if (q.wait > 0 || q.hitT >= 0) return;
      if (q.kind === 'ball' && A.ball && A.ball[q.ballId]) {   // flecha verde de Arrow Blow (nodo ball del WZ)
        var BS = window.MapleSkills.SKILLS[q.ballId], bfr = Math.floor(world.t * 1000 / BS.ball.delay) % BS.ball.origin.length;
        fxSprite(A.ball[q.ballId][bfr], BS.ball.origin[bfr][0], BS.ball.origin[bfr][1], q.x, q.y, q.dir); return;
      }
      if (q.kind === 'arrow' && A.arrow) {   // flecha del Archer (sprite 02060000, mira a la izquierda)
        ctx.save(); ctx.translate(Math.round(q.x), Math.round(q.y)); if (FACE_LEFT ? q.dir > 0 : q.dir < 0) ctx.scale(-1, 1);
        ctx.drawImage(A.arrow, -14, -1); ctx.restore(); return;
      }
      var sf = A.star && A.star[Math.floor(world.t * 18) % 2];
      if (sf) { ctx.drawImage(sf, Math.round(q.x - sf.width / 2), Math.round(q.y - sf.height / 2)); return; }
      ctx.save(); ctx.translate(Math.round(q.x), Math.round(q.y)); ctx.rotate(q.rot); ctx.fillStyle = '#e8eef5'; ctx.strokeStyle = '#2a3140'; ctx.lineWidth = 1.5;
      ctx.beginPath(); for (var a = 0; a < 8; a++) { var r = a % 2 ? 3 : 9, an = a * Math.PI / 4; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    });
    world.fx.forEach(function (f) {
      if (f.follow) { f.x = f.follow.x; f.y = f.follow.y; }
      if (f.kind === 'be') {   // animación de BasicEff
        var BE = window.MapleBasicFx && window.MapleBasicFx[f.name], bi = A.basic && A.basic[f.name]; if (!BE || !bi || f.t < 0) return;
        var bms = f.t * 1000 * (f.rate || 1), bj = 0; while (bj < BE.frames.length - 1 && bms >= BE.frames[bj][2]) { bms -= BE.frames[bj][2]; bj++; }
        fxSprite(bi[bj], BE.frames[bj][0], BE.frames[bj][1], f.x, f.y, f.dir); return;
      }
      if (f.kind === 'spark') {   // destello al impactar una estrella
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 0.3); ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 2; var rr = 6 + f.t * 40;
        ctx.beginPath(); for (var d = 0; d < 4; d++) { var an2 = d * Math.PI / 2 + Math.PI / 4; ctx.moveTo(f.x + Math.cos(an2) * rr * 0.4, f.y + Math.sin(an2) * rr * 0.4); ctx.lineTo(f.x + Math.cos(an2) * rr, f.y + Math.sin(an2) * rr); } ctx.stroke(); ctx.restore(); return;
      }
      if (f.kind === 'leap') {   // Warrior Leap: estela de polvo (provisional)
        var lp = Math.min(1, f.t / 0.4); ctx.save(); ctx.globalAlpha = 0.7 * (1 - lp); ctx.fillStyle = '#e8dcc0';
        for (var lk = 0; lk < 5; lk++) { ctx.beginPath(); ctx.ellipse(f.x - lk * 10 * (f.dir || 1), f.y + 26 - lp * 8, 10 + lp * 10, 4 + lp * 4, 0, 0, 7); ctx.fill(); } ctx.restore(); return;
      }
      if (f.kind === 'tele') {   // Teleport: anillo y destello (provisional hasta tener el sprite del WZ)
        var tp = Math.min(1, f.t / 0.35); ctx.save(); ctx.globalAlpha = 1 - tp;
        var gr = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, 14 + tp * 34); gr.addColorStop(0, 'rgba(220,235,255,.95)'); gr.addColorStop(0.5, 'rgba(120,150,255,.55)'); gr.addColorStop(1, 'rgba(120,150,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, 14 + tp * 34, 0, 7); ctx.fill(); ctx.restore(); return;
      }
      if (f.kind === 'ignite') {   // Ignite: fuego en el suelo (se desvanece al final)
        var IT = window.MapleSkills.SKILLS.fpIgnite, tl = A.ignite && A.ignite[f.size], ti = Math.floor(f.t * 1000 / IT.tileDelay) % IT.tiles[f.size].length;
        if (tl) { ctx.save(); if (f.life - f.t < 0.5) ctx.globalAlpha = Math.max(0, (f.life - f.t) / 0.5); fxSprite(tl[ti], IT.tiles[f.size][ti][0], IT.tiles[f.size][ti][1], f.x, f.y); ctx.restore(); } return;
      }
	  // NUEVO: Dibujar el efecto en el lanzador (Steal)
      if (f.kind === 'effect') {
        var SE = window.MapleSkills.SKILLS[f.id], he = A.skill[SE.id];
        var j2 = Math.min(SE.effect.length - 1, Math.floor(f.t * 1000 / (SE.effectDelay || 90)));
        var j0 = SE.effect0 ? Math.min(SE.effect0.length - 1, Math.floor(f.t * 1000 / (SE.effectDelay || 90))) : 0;
        
        // Se dibuja primero effect0 (para que quede detrás) y luego effect
        if (he && he.effect0 && he.effect0[j0]) fxSprite(he.effect0[j0], SE.effect0[j0].ox, SE.effect0[j0].oy, f.x, f.y, f.dir);
        if (he && he.effect && he.effect[j2]) fxSprite(he.effect[j2], SE.effect[j2].ox, SE.effect[j2].oy, f.x, f.y, f.dir);
        return;
      }
      if (f.kind === 'sk') {   // golpe de Lucky Seven (según nivel del lanzador)
        var LS = window.MapleSkills.SKILLS[f.id];
        if (!LS || !LS.tiers || !LS.tierFor) return;   // solo skills con tiers (Lucky Seven)
        var ltr = LS.tiers[f.tier], lf = A.ls && A.ls[f.tier];
        if (!ltr || !lf) return;
        var lj2 = Math.min(ltr.hit.length - 1, Math.floor(f.t * 1000 / LS.hitDelay));
        if (lf) fxSprite(lf.hit[lj2], ltr.hit[lj2][0], ltr.hit[lj2][1], f.x, f.y); return;
      }
      var SD = window.MapleSkills.SKILLS[f.id || 'slashBlast'], hf = A.skill[SD.id];
      var j = Math.min(SD.hit.length - 1, Math.floor(f.t * 1000 / SD.hitDelay));
      if (hf) fxSprite(hf.hit[j], SD.hit[j].ox, SD.hit[j].oy, f.x, f.y);
    });
  }

  function drawMob(m) {
    if (m.state === 'dead') return;
    var set = A.mob[m.kind] || {}, list = m.state === 'hit' && set.hit && set.hit.length ? set.hit : set.move;
    var alpha = m.state === 'dying' ? 1 - m.t / 0.5 : 1, y = m.y - (m.state === 'dying' ? m.t * 30 : 0);
    var bob = m.state === 'move' ? Math.abs(Math.sin(world.t * 6 + m.spawnX)) * 2 : 0;
    var f = pick(list, Math.floor(world.t * 1000 / DELAY.mob) % Math.max(1, list ? list.length : 1));
    
    var isFrozen = m.freeze && m.freeze.t > 0, esc = m.elite ? ((world.cfg.elite && world.cfg.elite.scale) || S.ELITE.scale) : 1;   // élite: 150% de tamaño con aura roja
    
    if (f) {
       // NUEVO: Filtro visual azul gélido si el monstruo está congelado
       if (isFrozen) ctx.filter = 'sepia(1) hue-rotate(180deg) saturate(2.5) brightness(0.9)';
       if (m.elite && !isFrozen) ctx.filter = 'drop-shadow(0 0 6px #ff3b3b) saturate(1.3)';
       sprite(f.img, 'mob', m.x, y - bob, m.dir, alpha, esc);
       if (m.elite && !isFrozen) ctx.filter = 'none';
       if (isFrozen) ctx.filter = 'none'; // Restaurar el filtro
    } else { 
       ctx.fillStyle = m.kind === 'snail_red' ? '#d9534f' : '#4aa3df'; ctx.beginPath(); ctx.ellipse(m.x, y - 12, 14, 12, 0, 0, 7); ctx.fill(); 
    }
    
    [m.debuff, m.poison, m.mark, m.stun].filter(function (db) { return db && alpha === 1 && A.mobDebuff && A.mobDebuff[db.id]; }).forEach(function (db, ix, arr) {
      var DS = window.MapleSkills.SKILLS[db.id], DF = A.mobDebuff[db.id], di = Math.floor(world.t * 1000 / DS.mobFxDelay) % DF.length;
      fxSprite(DF[di], DS.mobFx[di][0], DS.mobFx[di][1], m.x + (ix - (arr.length - 1) / 2) * 26, y - (set.move && set.move[0] ? set.move[0].height : 32) - 14, 1);
    });
    
    // NUEVO: Dibujar el número de cargas (Stacks) de hielo sobre el enemigo
    if (m.freezeStack && alpha === 1 && A.mobDebuff['ilFreezingCrush']) {
       var lvl = Math.min(4, m.freezeStack.count - 1);
       var DF = A.mobDebuff['ilFreezingCrush'][lvl];
       var DS = window.MapleSkills.SKILLS['ilFreezingCrush'];
       if (DF && DF.length) {
          var di = Math.floor(world.t * 1000 / DS.mobFxDelay) % DF.length;
          fxSprite(DF[di], DS.mobFx[lvl][di].ox, DS.mobFx[lvl][di].oy, m.x, y - (set.move && set.move[0] ? set.move[0].height : 32) - 20);
       }
    }
    
    if ((m.hp < m.maxHp || m.elite || m.boss) && alpha === 1) {
      var ek = m.elite ? esc : 1, bw = 32 * (m.boss ? 3 : m.elite ? 1.8 : 1), by = y - (set.move && set.move[0] ? set.move[0].height : 32) * ek - 8;
      mobBar(m.x, by, m.boss ? 150 : m.elite ? 90 : 50, m.hp / m.maxHp);
      if (m.boss) { ctx.save(); ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; var bn = m.kind.toUpperCase() + ' (JEFE)'; ctx.strokeText(bn, m.x, by - 4); ctx.fillStyle = '#ffd23f'; ctx.fillText(bn, m.x, by - 4); ctx.restore(); }
      if (m.elite) { ctx.save(); ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText($t('ÉLITE'), m.x, by - 4); ctx.fillStyle = '#ff6b6b'; ctx.fillText($t('ÉLITE'), m.x, by - 4); ctx.restore(); }
    }
  }

  // Cámara libre: NO sigue al personaje. Se mueve arrastrando con el mouse (o el dedo).
  function updateCam(snap) {
    if (snap) { curMap(); cam.x = world.player.x; cam.y = world.player.y - 80; }
    curMap();
    var vw = cv.width / zoom, vh = cv.height / zoom;
    var w = A.bg ? A.bg.width : IMG_W, h = A.bg ? A.bg.height : IMG_H, L = -off.x, T = -off.y;
	
	// AÑADIDO: Expande el límite superior y la altura total para engañar a la cámara
    T -= 250; 
    h += 250;
	
    cam.x = w <= vw ? L + w / 2 : Math.max(L + vw / 2, Math.min(L + w - vw / 2, cam.x));
    cam.y = h <= vh ? T + h / 2 : Math.max(T + vh / 2, Math.min(T + h - vh / 2, cam.y));
  }
  var drag = null, mouse = { x: 0, y: 0, in: false };
  // Depuración: coordenadas del personaje seleccionado y del cursor, con el foothold (fh) bajo ellos (para colocar spawns en los mapas)
  function fhAt(x, y, node) {
    var best = null, m = world.map; if (!m) return null;
    m.segs.forEach(function (sg) {
      if (sg.x1 === sg.x2 || x < sg.x1 || x > sg.x2 || (node && m.nodeOfSeg[sg.id] !== node)) return;
      var ys = sg.y1 + (sg.y2 - sg.y1) * ((x - sg.x1) / (sg.x2 - sg.x1)), d = Math.abs(ys - y);
      if (!best || d < best.d) best = { fh: sg.id, d: d };
    });
    return best && best.fh;
  }
  function dbgPlayer() { var p = world.player; return { x: Math.round(p.x), y: Math.round(p.y), fh: fhAt(p.x, p.y, p.node) }; }
  function dbgCursor() { var w = toWorld({ clientX: mouse.x, clientY: mouse.y }); return { x: Math.round(w.x), y: Math.round(w.y), fh: fhAt(w.x, w.y + 6, null) }; }
  function dbgText(o) { return 'x: ' + o.x + ', y: ' + o.y + ', fh: ' + o.fh; }
  function copyText(t) {
    function fallback() { var a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e2) {} a.remove(); }
    try { navigator.clipboard.writeText(t).catch(fallback); } catch (e) { fallback(); }
    if (window.MAPLE_GAME.toast) window.MAPLE_GAME.toast('Copiado: ' + t);
  }
  cv.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = true; });
  cv.addEventListener('pointerleave', function () { mouse.in = false; });
  // ---- zonas de farmeo: modo dibujo (arrastrar un cuadro sobre el mapa para el personaje elegido) ----
  var dbgFlip = null;
  var zdraw = null, showZones = true, ZCOL = ['#ffe45c', '#5cf0ff', '#ff7ad9', '#8dff6a', '#ffa14d', '#b08cff'];
  function toWorld(e) { var r = cv.getBoundingClientRect(), sx = (e.clientX - r.left) * (cv.width / r.width), sy = (e.clientY - r.top) * (cv.height / r.height); return { x: (sx - cv.width / 2) / zoom + cam.x, y: (sy - cv.height / 2) / zoom + cam.y }; }
  // mientras se dibuja la zona se oculta toda la interfaz (clase zone-draw, ver mui.js) y queda un botón para cancelar (en móvil no hay Esc)
  var zcBtn = document.createElement('button'); zcBtn.textContent = $t('Cancelar zona'); zcBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147482600;display:none;padding:12px 16px;font:bold 15px Arial;color:#fff;background:#7a2430;border:2px solid #cfd8ee;border-radius:5px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.6)'; document.body.appendChild(zcBtn);
  zcBtn.addEventListener('click', function (e) { e.stopPropagation(); window.MAPLE_GAME.cancelZone(); });
  window.MAPLE_GAME.startZone = function (i) { S.selectChar(world, i); zdraw = { ci: i, a: null, b: null, msg: '' }; cv.style.cursor = 'crosshair'; document.body.classList.add('zone-draw'); zcBtn.style.display = 'block'; };
  window.MAPLE_GAME.clearZone = function (i) { var c = world.chars[i]; S.setZone(c, c.mapId, null); save(); };
  window.MAPLE_GAME.cancelZone = function () { zdraw = null; cv.style.cursor = 'grab'; document.body.classList.remove('zone-draw'); zcBtn.style.display = 'none'; };
  window.MAPLE_GAME.zoneDrawing = function () { return !!zdraw; };
  window.MAPLE_GAME.showZones = function (v) { if (v !== undefined) showZones = !!v; return showZones; };
  function focusCam(i) { var c = world.chars[i]; if (c) { cam.x = c.player.x; cam.y = c.player.y - 80; } }
  addEventListener('keydown', function (e) { if (e.code === 'Escape' && zdraw) { window.MAPLE_GAME.cancelZone(); e.preventDefault(); } });
  function drawZones() {
    if (!showZones && !zdraw) return;
    ctx.save(); ctx.lineWidth = 2 / zoom; ctx.font = 'bold ' + Math.round(14 / zoom) + 'px sans-serif'; ctx.textAlign = 'left';
    world.chars.forEach(function (c, i) {
      var z = c.mapId === world.mapId && c.zones && c.zones[c.mapId]; if (!z) return;
      var col = ZCOL[i % ZCOL.length], sel = zdraw && zdraw.ci === i;
      ctx.fillStyle = col; ctx.globalAlpha = i === world.selected ? 0.16 : 0.09; ctx.fillRect(z.x1, z.y1, z.x2 - z.x1, z.y2 - z.y1);
      ctx.globalAlpha = 0.9; ctx.strokeStyle = col; ctx.setLineDash([8 / zoom, 6 / zoom]); ctx.strokeRect(z.x1, z.y1, z.x2 - z.x1, z.y2 - z.y1); ctx.setLineDash([]);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3 / zoom; ctx.strokeText(c.name, z.x1 + 4, z.y1 + 16 / zoom); ctx.fillStyle = col; ctx.fillText(c.name, z.x1 + 4, z.y1 + 16 / zoom); ctx.lineWidth = 2 / zoom;
    });
    if (zdraw && zdraw.a && zdraw.b) {
      var col2 = ZCOL[zdraw.ci % ZCOL.length], x = Math.min(zdraw.a.x, zdraw.b.x), y = Math.min(zdraw.a.y, zdraw.b.y), w = Math.abs(zdraw.a.x - zdraw.b.x), h = Math.abs(zdraw.a.y - zdraw.b.y);
      ctx.globalAlpha = 0.25; ctx.fillStyle = col2; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; ctx.strokeStyle = col2; ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
  }
  function drawZoneBanner() {
    if (!zdraw) return; var c = world.chars[zdraw.ci], t = cv.width < 700 ? (zdraw.msg || $t('Zona de {0}: arrastra un cuadro', c.name)) : $t('Zona de {0}: arrastra un cuadro sobre el mapa (Esc o botón cancelan)', c.name) + (zdraw.msg ? '  —  ' + zdraw.msg : '');
    ctx.save(); ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; var tw = ctx.measureText(t).width + 30; ctx.fillStyle = 'rgba(10,14,30,.85)'; ctx.fillRect(cv.width / 2 - tw / 2, 70, tw, 30);
    ctx.fillStyle = '#ffe45c'; ctx.fillText(t, cv.width / 2, 91); ctx.restore();
  }
  // zoom con dos dedos (pellizco): con dos punteros activos se cancela el arrastre de cámara y se escala el zoom alrededor del punto medio
  var pts = {}, pinch = null;
  function npts() { return Object.keys(pts).length; }
  function pinchDist() { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; }
  function pinchMid() { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]], r = cv.getBoundingClientRect(); return { x: ((a.x + b.x) / 2 - r.left) * (cv.width / r.width), y: ((a.y + b.y) / 2 - r.top) * (cv.height / r.height) }; }
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' || zdraw) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (npts() === 2) { pinch = { d0: pinchDist(), z0: zoom }; drag = null; cv.style.cursor = 'grab'; }
  }, true);
  cv.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (!pinch || npts() < 2) return;
    var m = pinchMid(), wx = (m.x - cv.width / 2) / zoom + cam.x, wy = (m.y - cv.height / 2) / zoom + cam.y;
    zoom = Math.max(0.4, Math.min(3, pinch.z0 * pinchDist() / pinch.d0));
    cam.x = wx - (m.x - cv.width / 2) / zoom; cam.y = wy - (m.y - cv.height / 2) / zoom;
  }, true);
  function pinchEnd(e) { delete pts[e.pointerId]; if (npts() < 2) pinch = null; }
  cv.addEventListener('pointerup', pinchEnd, true); cv.addEventListener('pointercancel', pinchEnd, true);
  cv.addEventListener('pointerdown', function (e) {
    if (pinch) return;
    if (zdraw) { var p0 = toWorld(e); zdraw.a = p0; zdraw.b = p0; zdraw.cx = e.clientX; zdraw.cy = e.clientY; zdraw.msg = ''; zdraw.id = e.pointerId; cv.setPointerCapture(e.pointerId); return; }
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', function (e) { if (zdraw && zdraw.a && zdraw.id === e.pointerId) { zdraw.cx = e.clientX; zdraw.cy = e.clientY; zdraw.b = toWorld(e); } });
  function zoneUp(e) {
    if (!zdraw || !zdraw.a || zdraw.id !== e.pointerId) return; zdraw.b = toWorld(e); var c = world.chars[zdraw.ci];
    if (S.setZone(c, c.mapId, { x1: zdraw.a.x, y1: zdraw.a.y, x2: zdraw.b.x, y2: zdraw.b.y })) { save(); window.MAPLE_GAME.cancelZone(); if (window.MAPLE_GAME.onZone) window.MAPLE_GAME.onZone(); }
    else { zdraw.a = zdraw.b = null; zdraw.msg = $t('muy pequeño, prueba otra vez'); }
  }
  cv.addEventListener('pointerup', zoneUp);
  cv.addEventListener('pointermove', function (e) {
    if (pinch || !drag || drag.id !== e.pointerId) return;
    drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
    cam.x -= (e.clientX - drag.x) / zoom; cam.y -= (e.clientY - drag.y) / zoom;
    drag.x = e.clientX; drag.y = e.clientY;
  });
  function endDrag(e) { if (drag && drag.id === e.pointerId) { if (drag.moved < 6 && e.type === 'pointerup' && !zdraw) pickChar(e.clientX, e.clientY); drag = null; cv.style.cursor = 'grab'; } }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.style.cursor = 'grab';
  // clic (sin arrastrar) sobre un personaje = seleccionarlo
  function pickChar(sx, sy) {
    var wx = (sx - cv.width / 2) / zoom + cam.x, wy = (sy - cv.height / 2) / zoom + cam.y, best = -1, bd = 1e9;
    world.chars.forEach(function (c, i) {
      if (c.mapId !== world.mapId) return;
      var p = c.player, d = Math.abs(p.x - wx) + Math.abs(p.y - 40 - wy);
      if (Math.abs(p.x - wx) < 30 && wy > p.y - 85 && wy < p.y + 20 && d < bd) { bd = d; best = i; }
    });
    if (best >= 0) { S.selectChar(world, best); save(); }
  }

  function drawDebug() {
    var m = world.map;
    ctx.lineWidth = 2; ctx.strokeStyle = '#2f2';
    m.segs.forEach(function (s) { ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); });
    ctx.strokeStyle = '#ff0';
    m.ladders.forEach(function (l) { ctx.beginPath(); ctx.moveTo(l.x, l.y1); ctx.lineTo(l.x, l.y2); ctx.stroke(); });
    ctx.fillStyle = '#f0f'; world.mobs.forEach(function (mb) { ctx.fillRect(mb.spawnX - 2, mb.y - 2, 4, 4); });
  }

  function fmt(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function drawHUD() {
    var s = world.stats, need = S.expToNext(s.level), maxed = s.level >= S.MAX_LEVEL, pct = maxed ? 1 : Math.min(1, s.exp / need);
    var w = Math.min(520, cv.width - 40), x = Math.round((cv.width - w) / 2), y = cv.height - 30;
    ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x - 10, y - 38, w + 20, 64);
    var hw = Math.floor(w / 2) - 4, by = y - 28;   // barras de HP y MP
    ctx.fillStyle = '#2a1010'; ctx.fillRect(x, by, hw, 16); ctx.fillStyle = '#d63a3a'; ctx.fillRect(x, by, Math.round(hw * Math.max(0, s.hp) / s.maxHp), 16);
    ctx.fillStyle = '#101a2a'; ctx.fillRect(x + hw + 8, by, hw, 16); ctx.fillStyle = '#3a7bd6'; ctx.fillRect(x + hw + 8, by, Math.round(hw * s.mp / s.maxMp), 16);
    ctx.fillStyle = '#222'; ctx.fillRect(x, y, w, 16);
    ctx.fillStyle = '#3fc95a'; ctx.fillRect(x, y, Math.round(w * pct), 16);   // EXP en verde
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.fillText('HP ' + Math.ceil(s.hp) + ' / ' + s.maxHp, x + hw / 2, by + 12); ctx.fillText('MP ' + Math.floor(s.mp) + ' / ' + s.maxMp, x + hw + 8 + hw / 2, by + 12);
    var t = maxed ? 'MAX' : fmt(s.exp) + ' / ' + fmt(need) + '  (' + (pct * 100).toFixed(1) + '%)';
    ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(t, x + w / 2, y + 12); ctx.fillStyle = '#fff'; ctx.fillText(t, x + w / 2, y + 12);
    // nombre y nivel del personaje seleccionado: esquina inferior izquierda, fuente grande
    var nm = world.chars[world.selected].name, lv = 'Lv. ' + s.level;
    if (cv.width < 700) {   // móvil: "Nombre - Lv. 53" centrado sobre las barras, sin tapar el HP/MP
      var mt = nm + ' - ' + lv; ctx.textAlign = 'center'; ctx.font = 'bold 15px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
      ctx.strokeText(mt, x + w / 2, y - 44); ctx.fillStyle = '#ffe45c'; ctx.fillText(mt, x + w / 2, y - 44); ctx.lineWidth = 3; return;
    }
    ctx.textAlign = 'left'; ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.font = 'bold 30px sans-serif';
    ctx.strokeText(nm, 16, cv.height - 44); ctx.fillStyle = '#fff'; ctx.fillText(nm, 16, cv.height - 44);
    ctx.font = 'bold 22px sans-serif'; ctx.strokeText(lv, 16, cv.height - 16); ctx.fillStyle = '#ffe45c'; ctx.fillText(lv, 16, cv.height - 16);
    ctx.lineWidth = 3;
  }

  function zonePan() {   // al dibujar una zona, acercar el cursor al borde de la pantalla mueve la cámara
    if (!zdraw || !zdraw.a || zdraw.cx === undefined) return;
    var r = cv.getBoundingClientRect(), M = 60, v = 12 / zoom, dx = 0, dy = 0;
    if (zdraw.cx < r.left + M) dx = -v; else if (zdraw.cx > r.right - M) dx = v;
    if (zdraw.cy < r.top + M) dy = -v; else if (zdraw.cy > r.bottom - M) dy = v;
    if (dx || dy) { cam.x += dx; cam.y += dy; updateCam(false); zdraw.b = toWorld({ clientX: zdraw.cx, clientY: zdraw.cy }); }
  }
  // Fondos de mapa (como MapleStory): posición = x + (rx+100)*cam/100; type 1/3/4/6 repiten en X, 2/3/5/7 en Y, 4-7 se desplazan solos; capas con ani cambian de frame
  function drawBack(front) {
    var L = A.backs && A.backs[world.mapId]; if (!L) return;
    var vw = cv.width / zoom, vh = cv.height / zoom, vl = cam.x - vw / 2, vt = cam.y - vh / 2, vr = vl + vw, vb = vt + vh, now = performance.now();
    L.forEach(function (e) {
      var l = e.l; if ((l.front ? 1 : 0) !== front) return;
      var fi = 0, fr = l.frames;
      if (fr.length > 1) { var tot = 0, k; fr.forEach(function (f) { tot += f.delay || 100; }); var tt = now % tot; for (k = 0; k < fr.length; k++) { tt -= fr[k].delay || 100; if (tt < 0) break; } fi = Math.min(k, fr.length - 1); }
      var img = e.imgs[fi], f = fr[fi]; if (!img) return;
      var ty = l.type, htile = ty === 1 || ty === 3 || ty === 4 || ty === 6, vtile = ty === 2 || ty === 3 || ty === 5 || ty === 7;
      var sx = (ty === 4 || ty === 6) ? l.rx * 3.75 * now / 1000 : 0, sy = (ty === 5 || ty === 7) ? l.ry * 3.75 * now / 1000 : 0;
      var cxs = l.cx > 0 ? l.cx : f.w, cys = l.cy > 0 ? l.cy : f.h;
      var px = l.x + (l.rx + 100) * cam.x / 100 + sx - (l.f ? f.w - f.ox : f.ox), py = l.y + (l.ry + 100) * cam.y / 100 + sy - f.oy;
      var x0 = px, y0 = py;
      if (htile) x0 = px + Math.floor((vl - px) / cxs) * cxs;
      if (vtile) y0 = py + Math.floor((vt - py) / cys) * cys;
      ctx.save(); if (l.a < 255) ctx.globalAlpha = l.a / 255;
      for (var yy = y0; ; yy += cys) {
        for (var xx = x0; ; xx += cxs) {
          if (l.f) { ctx.save(); ctx.translate(xx + f.w, yy); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); } else ctx.drawImage(img, xx, yy);
          if (!htile || xx + cxs > vr) break;
        }
        if (!vtile || yy + cys > vb) break;
      }
      ctx.restore();
    });
  }
  function render() {
    zonePan();
    var vw = cv.width / zoom, vh = cv.height / zoom;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(zoom, 0, 0, zoom, Math.round(-(cam.x - vw / 2) * zoom), Math.round(-(cam.y - vh / 2) * zoom));
    drawBack(0);
    if (A.bg) ctx.drawImage(A.bg, -off.x, -off.y);
    drawZones();
    world.mobs.forEach(drawMob);
    drawPlayer();
    drawSkillFx();
    drawBack(1);
    ctx.textAlign = 'center'; ctx.lineWidth = 3;
    world.texts.forEach(function (t) {
      if (t.num && drawNum(t)) return;   // números de daño con los sprites de MapleStory (si faltan, cae al texto)
      ctx.font = (t.big ? 'bold 24px' : 'bold 16px') + ' sans-serif';
      ctx.globalAlpha = Math.max(0, 1 - t.t / (t.life || 0.8)); ctx.strokeStyle = '#000'; ctx.strokeText(t.txt, t.x, t.y);
      ctx.fillStyle = t.c || '#ffd23f'; ctx.fillText(t.txt, t.x, t.y);
    });
    ctx.globalAlpha = 1;
    if (debug || !A.bg) drawDebug();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'left'; ctx.font = '14px sans-serif';
    var lines = ['Modo: ' + (world.ai.auto ? 'AUTO (idle)' : 'MANUAL') + '   Kills: ' + world.kills + '   Velocidad x' + speed,
      'Arrastra con el mouse para mover la cámara · rueda zoom · I inventario · E equip · S stat · K skill · P pociones · M mapa · A auto/manual · D debug · F acelerar · Manual: ←→ mover, Espacio saltar, ↑↓ cuerda, Z atacar, X skill principal (Slash Blast / Lucky Seven / Arrow Blow / Magic Claw), H Haste'];
    if (debug) {
      lines.push('Offset mapa: x=' + off.x + ' y=' + off.y + '  (I/J/K/L mueven 1px, con Shift 10px)');
      lines.push('Personaje: ' + dbgText(dbgPlayer()) + '   [B = copiar]');
      (function () {   // diagnóstico de la IA: estado, plan (arista) y objetivo del personaje seleccionado, y cuántas veces cambia de dirección por segundo
        var P = world.player, A = world.ai || {}, e = A.edge, t = A.target, now = performance.now();
        dbgFlip = dbgFlip || { d: P.dir, n: 0, t0: now, rate: 0 };
        if (P.dir !== dbgFlip.d) { dbgFlip.d = P.dir; dbgFlip.n++; }
        if (now - dbgFlip.t0 > 1000) { dbgFlip.rate = dbgFlip.n; dbgFlip.n = 0; dbgFlip.t0 = now; }
        lines.push('IA: ' + P.state + (P.atk ? '+atk' : '') + (P.dropT > 0 ? '+prone' : '') + '  plan=' + (e ? e.type + '→n' + e.to + (e.takeoffX !== undefined ? ' x' + Math.round(e.takeoffX) : '') : (t ? 'objetivo' : 'idle')) + '  nodo=n' + (P.node ? P.node.i : '?') + '  objetivo=' + (t ? 'n' + (t.node ? t.node.i : '?') + ' x' + Math.round(t.x) : '-') + '  giros/s=' + dbgFlip.rate);
      })();
      if (mouse.in) lines.push('Cursor: ' + dbgText(dbgCursor()) + '   [N = copiar]');
    }
    if (!debug) { lines = speed > 1 ? ['Velocidad x' + speed] : []; if (!world.ai.auto) lines.push('MANUAL (A para volver a auto)'); }   // el texto de ayuda/debug solo se muestra con D
    lines.forEach(function (s, i) { ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(s, 10, 20 + i * 18); ctx.fillStyle = '#fff'; ctx.fillText(s, 10, 20 + i * 18); });
    if (!zdraw) drawHUD();
    drawZoneBanner();
  }

  function applyManual() {
    var i = world.input;
    i.left = !!keys.ArrowLeft; i.right = !!keys.ArrowRight; i.up = !!keys.ArrowUp; i.down = !!keys.ArrowDown; i.attack = !!(keys.KeyZ || keys.ControlLeft); i.skill = keys.KeyX ? ({ thief: 'luckySeven', archer: 'arrowBlow', mage: 'magicClaw', pirate: 'somersaultKick' }[world.chars[world.selected].cls] || 'slashBlast') : keys.KeyH ? 'haste' : false;
  }
  addEventListener('keydown', function (e) {
    if (e.code.indexOf('Arrow') === 0 || e.code === 'Space') e.preventDefault();
    keys[e.code] = true;
    if (e.code === 'Space') world.input.jump = true;
    if (e.code === 'KeyA') { world.ai.auto = !world.ai.auto; }
    if (e.code === 'KeyD') debug = !debug;
    if (debug && e.code === 'KeyB') copyText(dbgText(dbgPlayer()));
    if (debug && e.code === 'KeyN' && mouse.in) copyText(dbgText(dbgCursor()));
    if (/^Digit[1-9]$/.test(e.code)) { var vis = window.MAPLE_GAME.visible(), vi = +e.code.slice(5) - 1; if (vi < vis.length) { S.selectChar(world, vis[vi]); save(); } }
    if (e.code === 'KeyR' && e.shiftKey) { world.chars = []; world.leader = null; S.addCharacter(world, { name: $t('Guerrero'), cls: 'warrior' }); S.selectChar(world, 0); world.mesos = 0; world.inv = window.MapleItems.newInventory(); save(); }  // Shift+R: reiniciar progreso
    if (e.code === 'KeyF') speed = speed === 1 ? 4 : 1;
    if (debug) {
      var st = e.shiftKey ? 10 : 1, ch = true;
      if (e.code === 'KeyJ') off.x += st; else if (e.code === 'KeyL') off.x -= st;
      else if (e.code === 'KeyI') off.y += st; else if (e.code === 'KeyK') off.y -= st; else ch = false;
      if (ch) try { localStorage.setItem(world.mapId === 'henesys' ? 'maple_off' : 'maple_off_' + world.mapId, JSON.stringify(off)); } catch (x) {}
    }
  });
  addEventListener('keyup', function (e) { keys[e.code] = false; });
  addEventListener('wheel', function (e) { zoom = Math.max(0.4, Math.min(3, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); });
  function resize() { cv.width = innerWidth; cv.height = innerHeight; }
  addEventListener('resize', resize); resize();

  /* La simulación NO depende de que la pestaña esté a la vista: en segundo plano la mueve un temporizador de Web Worker (no se frena como los de la página).
     Si el navegador congela la pestaña (móvil, ahorro de memoria, suspensión del equipo) aparece un hueco > BG_GAP s y se cuenta como ausencia (progreso offline). */
  var acc = 0, ready = false;
  function advance(clamp) {
    var t = Date.now(), gap = (t - lastRun) / 1000; lastRun = t;
    if (gap > BG_GAP) { acc = 0; applyOffline(gap); return; }
    acc += (clamp ? Math.min(0.1, gap) : gap) * speed;
    while (acc >= S.STEP) { if (!world.ai.auto) applyManual(); S.step(world, S.STEP); acc -= S.STEP; }
    if (t - lastSv > 10000) { lastSv = t; save(); }   // también en segundo plano: así savedAt es reciente si el navegador mata la pestaña
  }
  // barra de vida de enemigos (borde blanco + negro, vacío rojo oscuro, lleno verde) — 8 px de alto
  function mobBar(cx, y, w, f) {
    var x = Math.round(cx - w / 2), yy = Math.round(y); f = Math.max(0, Math.min(1, f));
    ctx.fillStyle = '#fff'; ctx.fillRect(x, yy, w, 8); ctx.fillStyle = '#150000'; ctx.fillRect(x + 1, yy + 1, w - 2, 6);
    var iw = w - 4, gw = f > 0 ? Math.max(1, Math.round(iw * f)) : 0, cols = ['#46060c', '#56060a', '#530805', '#360206'], gc = ['#32d838', '#11f718', '#2edb1d', '#1a8a14'];
    for (var i = 0; i < 4; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(x + 2, yy + 2 + i, iw, 1); if (gw) { ctx.fillStyle = gc[i]; ctx.fillRect(x + 2, yy + 2 + i, gw, 1); } }
  }
  function frame() { advance(true); updateCam(false); render(); requestAnimationFrame(frame); }
  function bgTick() { if (ready && document.hidden) advance(false); }
  setInterval(bgTick, 1000);
  try { var wk = new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(1)},250)'], { type: 'text/javascript' }))); wk.onmessage = bgTick; wk.onerror = function () {}; } catch (e) {}
  window.MAPLE_GAME.focus = function (i) { curMap(); var p = world.chars[i].player; cam.x = p.x; cam.y = p.y - 80; };
  // progreso offline: 25% de lo ganado durante la ausencia (máx. 4 h de ausencia = 1 h de farmeo activo)
  function fmtT(sec) { var h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60); if (m === 60) { h++; m = 0; } return h ? h + ' h' + (m ? ' ' + m + ' min' : '') : m + ' min'; }
  function showOffline(r) {
    if (!r || (!r.chars.length && !r.mesos && !r.items.length)) return;
    var MI = window.MapleItems, st = document.getElementById('off-css');
    if (!st) { st = document.createElement('style'); st.id = 'off-css'; st.textContent = '#off-ov{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}#off-ov .b{box-sizing:border-box;width:min(380px,calc(100vw - 20px));max-height:calc(100vh - 20px);overflow:auto;background:#10172c;border:1px solid #ffd23f;border-radius:10px;padding:16px;color:#e8ecf5;box-shadow:0 8px 30px #000a}#off-ov h3{margin:0 0 4px;color:#ffe45c;font-size:17px}#off-ov .s{font-size:12px;color:#9fb0d0;margin-bottom:10px}#off-ov .r{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid #ffffff14;font-size:13px}#off-ov .r b{color:#8fdcff;font-weight:600;white-space:nowrap}#off-ov button{margin-top:12px;width:100%;padding:9px;border-radius:7px;border:1px solid #ffd23f;background:#26304f;color:#ffe45c;font-size:14px;cursor:pointer}'; document.head.appendChild(st); }
    var ov = document.createElement('div'); ov.id = 'off-ov'; var h = '<div class="b"><h3>' + $t('¡Bienvenido de vuelta!') + '</h3><div class="s">' + $t('Ausente {0}', fmtT(r.absent)) + (r.absent > 14400 ? ' ' + $t('(tope 4 h)') : '') + ' → ' + $t('equivale a {0} de farmeo activo (25%)', fmtT(r.eff)) + '</div>';
    r.chars.forEach(function (c) { h += '<div class="r"><span>' + c.name.replace(/[<>&]/g, '') + '</span><b>+' + c.exp.toLocaleString(LOC) + ' EXP' + (c.l1 > c.l0 ? ' · Lv ' + c.l0 + '→' + c.l1 : '') + '</b></div>'; });
    if (r.mesos) h += '<div class="r"><span>' + $t('Mesos') + '</span><b>+' + r.mesos.toLocaleString(LOC) + '</b></div>';
    r.items.forEach(function (i) { var it = MI && MI.ITEMS[i.id]; h += '<div class="r"><span>' + (it ? it.name : i.id) + '</span><b>x' + i.n + '</b></div>'; });
    if (r.lost) h += '<div class="r"><span style="color:#ff8a8a">' + $t('Inventario lleno') + '</span><b style="color:#ff8a8a">' + $t('{0} perdidos', r.lost) + '</b></div>';
    ov.innerHTML = h + '<button>' + $t('Aceptar') + '</button></div>'; document.body.appendChild(ov);
    var close = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); removeEventListener('keydown', onk, true); }, onk = function (e) { if (e.key === 'Escape' || e.key === 'Enter') { e.stopPropagation(); close(); } };
    ov.querySelector('button').onclick = close; ov.addEventListener('click', function (e) { if (e.target === ov) close(); }); addEventListener('keydown', onk, true);
  }
  function applyOffline(sec) {
    if (noSave) return; var r = S.offlineGain(world, sec); if (!r) return;
    world.texts.length = 0; save(); showOffline(r);
  }
  window.MAPLE_GAME.applyOffline = applyOffline;
  loadAll().then(function () { updateCam(true); if (hasSave && sv && sv.savedAt) applyOffline((Date.now() - sv.savedAt) / 1000); lastRun = Date.now(); ready = true; requestAnimationFrame(frame); });
})();
