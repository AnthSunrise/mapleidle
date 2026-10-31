/* Maple Idle - Etapa 1: dibujo, cámara y controles */
(function () {
  'use strict';
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
      world.chars = [];
      list.slice(0, 6).forEach(function (c) {
        var cls = window.MapleItems.CLASSES[c.cls] ? c.cls : 'warrior';
        S.addCharacter(world, { name: String(c.name || 'Personaje').slice(0, 12), cls: cls, mapId: world.zones[c.mapId] ? c.mapId : 'henesys', level: Math.max(1, Math.min(S.MAX_LEVEL, (c.level | 0) || 1)),
          exp: Math.max(0, +c.exp || 0), potions: window.MapleItems.sanitizePotions(c.potions), equip: window.MapleItems.sanitize(null, c.equip, cls).equip, skills: window.MapleSkills.sanitize(c.skills), look: c.look && typeof c.look.hair === 'string' && typeof c.look.face === 'string' ? { hair: c.look.hair, face: c.look.face } : null });
      });
      world.mesos = Math.max(0, +sv.mesos || 0);
      world.inv = window.MapleItems.sanitize(sv.inv, null).inv;
      S.selectChar(world, Math.min(world.chars.length - 1, Math.max(0, sv.selected | 0)));
      hasSave = true;
    }
  } catch (e) {}
  var noSave = !hasSave;   // sin partida (aún no se creó el primer personaje) no se guarda nada; se activa con G.enableSave()
  function enableSave() { noSave = false; }
  function save() {
    if (noSave) return;
    try {
      localStorage.setItem('maple_save', JSON.stringify({ v: 2, mesos: world.mesos, inv: world.inv, selected: world.selected,
        chars: world.chars.map(function (c) { return { name: c.name, cls: c.cls, mapId: c.mapId, level: c.stats.level, exp: c.stats.exp, equip: c.equip, skills: c.skills, potions: c.potions, look: c.look || null }; }) }));
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
  addEventListener('beforeunload', save);
  var A = { chars: { warrior: {}, thief: {} }, mob: {}, bg: null, bgs: {} };
  var zoom = 1, speed = 1, debug = false, cam = { x: 0, y: 0 }, keys = {};

  function loadImg(src) { return new Promise(function (r) { var i = new Image(); i.onload = function () { r(i); }; i.onerror = function () { r(null); }; i.src = src; }); }
  async function loadSeq(base) {
    for (var s = 0; s <= 1; s++) {
      var out = [];
      for (var i = s; i < s + 24; i++) { var im = await loadImg(ASSETS + base + '_' + i + '.png'); if (!im) break; out.push(im); }
      if (out.length) return out;
    }
    var one = await loadImg(ASSETS + base + '.png');
    return one ? [one] : [];
  }
  async function loadAll() {
    for (var mid in MAPS) A.bgs[mid] = await loadImg(ASSETS + MAPS[mid].img);
    A.bg = A.bgs.henesys;
    A.star = [await loadImg(ASSETS + 'skill/star_0.png'), await loadImg(ASSETS + 'skill/star_1.png')];
    A.skill = {};   // efectos de las skills de área: A.skill[id] = { effect: [...], hit: [...] }
    for (var sid in window.MapleSkills.SKILLS) {
      var SKD = window.MapleSkills.SKILLS[sid]; if (SKD.buff || SKD.ranged) continue;
      A.skill[sid] = { effect: [], hit: [] };
      for (var ei = 0; ei < SKD.effect.length; ei++) A.skill[sid].effect.push(await loadImg(SKD.dir + 'effect_' + ei + '.png'));
      for (var hi = 0; hi < SKD.hit.length; hi++) A.skill[sid].hit.push(await loadImg(SKD.dir + 'hit_' + hi + '.png'));
    }
    A.arrow = await loadImg(ASSETS + 'skill/arrow.png');
    var HD = window.MapleSkills.SKILLS.haste; A.buffFx = { haste: [] };
    for (var bi = 0; bi < HD.effect.length; bi++) A.buffFx.haste.push(await loadImg(HD.dir + 'effect_' + bi + '.png'));
    var LSD = window.MapleSkills.SKILLS.luckySeven; A.ls = {};
    for (var tk in LSD.tiers) {
      A.ls[tk] = { effect: [], hit: [] };
      for (var li = 0; li < LSD.tiers[tk].effect.length; li++) A.ls[tk].effect.push(await loadImg(LSD.dir + 'effect_' + tk + '_' + li + '.png'));
      for (var lj = 0; lj < LSD.tiers[tk].hit.length; lj++) A.ls[tk].hit.push(await loadImg(LSD.dir + 'hit_' + tk + '_' + lj + '.png'));
    }
    var names = { stand: 'stand1', walk: 'walk1', jump: 'jump', swingO1: 'swingO1', swingO2: 'swingO2' };
    for (var k in names) A.chars.warrior[k] = await loadSeq('char/warrior/' + names[k]);
    ['swingO1', 'swingO2'].forEach(function (n) {
      var c = world.cfg.attack[n], f = A.chars.warrior[n].length;
      if (f) { c.frames = f; c.hitFrame = Math.min(1, f - 1); }
    });
    // Thief: walk (6 frames), jump, throw (3 frames, lanzar estrellas), alert (4 frames, para lanzar buffs)
    var tn = { stand: 'stand', walk: 'walk', jump: 'jump', throw: 'throw', alert: 'alert' };
    for (var tk in tn) A.chars.thief[tk] = await loadSeq('char/thief/' + tn[tk]);
    if (A.chars.thief.throw.length) { var tc = world.cfg.attack.throw; tc.frames = A.chars.thief.throw.length; tc.hitFrame = Math.min(1, tc.frames - 1); }
    for (var kind of ['snail_blue', 'snail_red', 'blue_mushroom']) {
      var d = { move: await loadSeq('mob/' + kind + '/move') };
      if (!d.move.length) d.move = await loadSeq('mob/' + kind + '/stand');
      if (!d.move.length) d.move = await loadSeq('mob/' + kind + '/stand');
      d.hit = await loadSeq('mob/' + kind + '/hit');
      A.mob[kind] = d;
    }
  }

  function sprite(img, name, x, y, dir, alpha) {
    var f = FRAME_OFFSETS[name] || (name.indexOf('thief:') === 0 ? { dx: 0, dy: 2 } : { dx: 0, dy: 0 });   // los sprites del Thief tienen 2 px de margen bajo los pies
    ctx.save(); ctx.translate(Math.round(x + f.dx), Math.round(y + f.dy));
    if (alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
    if (FACE_LEFT ? dir > 0 : dir < 0) ctx.scale(-1, 1);
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

  function drawPlayer() {
    world.chars.forEach(drawChar);
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3;
    world.chars.forEach(function (c, i) {   // etiqueta de nombre bajo los pies (amarilla = seleccionado)
      ctx.strokeStyle = '#000'; ctx.strokeText(c.name, c.player.x, c.player.y + 14);
      ctx.fillStyle = i === world.selected ? '#ffe45c' : '#fff'; ctx.fillText(c.name, c.player.x, c.player.y + 14);
    });
  }
  function drawTomb(c) {   // lápida con cuenta regresiva mientras el personaje está muerto
    var p = c.player;
    ctx.fillStyle = '#9aa0ad'; ctx.strokeStyle = '#3c4150'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x - 13, p.y); ctx.lineTo(p.x - 13, p.y - 26); ctx.arc(p.x, p.y - 26, 13, Math.PI, 0); ctx.lineTo(p.x + 13, p.y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3c4150'; ctx.fillRect(p.x - 2, p.y - 32, 4, 16); ctx.fillRect(p.x - 7, p.y - 27, 14, 4);
    var t = 'Revive en ' + Math.ceil(c.deadT) + ' s';
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(t, p.x, p.y - 50); ctx.fillStyle = '#ff9a9a'; ctx.fillText(t, p.x, p.y - 50);
  }
  // Personaje por capas (layers.js): acción WZ + fotograma según el estado; devuelve null si aún cargan las imágenes
  function throwAction(cls) { var c = world.cfg.classes[cls]; return (c && c.action) || 'swingO3'; }   // Thief: swingO3 (claw = ataque tipo 7); Archer: shoot1 (arco)
  function atIdx(action, ms) {   // fotograma en bucle según los retardos del WZ
    var d = window.MapleLayers.delays(action), tot = d.reduce(function (a, b) { return a + b; }, 0), t = tot ? ms % tot : 0;
    for (var i = 0; i < d.length; i++) { if (t < d[i]) return i; t -= d[i]; }
    return 0;
  }
  function layeredFrame(ch) {
    var L = window.MapleLayers; if (!L || !L.ready()) return null;
    var p = ch.player, ms = world.t * 1000, act = 'stand1', idx = 0;
    if (p.atk && p.atk.skill && p.atk.skill.buff) { act = 'alert'; idx = Math.floor(p.atk.t / 0.15); }
    else if (p.atk && p.atk.skill && p.atk.skill.ranged) { act = throwAction(ch.cls); idx = Math.floor(p.atk.t / (world.cfg.attack.throw.delay / 1000)); }
    else if (p.atk && p.atk.skill) { var sw = p.atk.t - p.atk.skill.windup; if (sw >= 0) { act = p.atk.skill.action || 'swingO2'; idx = Math.floor(sw / (world.cfg.attack.swingO2.delay / 1000)); } }
    else if (p.atk) { act = p.atk.name === 'throw' ? throwAction(ch.cls) : p.atk.name; idx = Math.floor(p.atk.t / (world.cfg.attack[p.atk.name].delay / 1000)); }
    else if (p.state === 'air') act = 'jump';
    else if (p.state === 'ground' && p.moving) { act = 'walk1'; idx = atIdx(act, ms); }
    else idx = atIdx(act, ms);
    return L.frame(ch, act, idx);
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
      var p = c.player, sk = p.atk && p.atk.skill;
      if (!sk) return;
      if (sk.buff) { var bf = A.buffFx && A.buffFx[sk.id], bj = Math.min(sk.effect.length - 1, Math.floor(p.atk.t * 1000 / sk.effectDelay)); if (bf) fxSprite(bf[bj], sk.effect[bj].ox, sk.effect[bj].oy, p.x, p.y, p.dir); return; }
      if (sk.ranged) {   // Lucky Seven: el efecto depende del nivel del personaje
        var tr = sk.tiers[sk.tierFor(c.stats.level)], tf = A.ls && A.ls[sk.tierFor(c.stats.level)];
        var li2 = Math.min(tr.effect.length - 1, Math.floor(p.atk.t * 1000 / sk.effectDelay));
        if (tf) fxSprite(tf.effect[li2], tr.effect[li2][0], tr.effect[li2][1], p.x, p.y, p.dir); return;
      }
      var i = Math.min(sk.effect.length - 1, Math.floor(p.atk.t * 1000 / sk.effectDelay));
      var sfx = A.skill[sk.id]; if (sfx) fxSprite(sfx.effect[i], sk.effect[i].ox, sk.effect[i].oy, p.x, p.y, p.dir);
    });
    world.proj.forEach(function (q) {   // estrellas (dibujo provisional hasta tener el sprite)
      if (q.wait > 0 || q.hitT >= 0) return;
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
      if (f.kind === 'spark') {   // destello al impactar una estrella
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 0.3); ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 2; var rr = 6 + f.t * 40;
        ctx.beginPath(); for (var d = 0; d < 4; d++) { var an2 = d * Math.PI / 2 + Math.PI / 4; ctx.moveTo(f.x + Math.cos(an2) * rr * 0.4, f.y + Math.sin(an2) * rr * 0.4); ctx.lineTo(f.x + Math.cos(an2) * rr, f.y + Math.sin(an2) * rr); } ctx.stroke(); ctx.restore(); return;
      }
      if (f.kind === 'sk') {   // golpe de Lucky Seven (según nivel del lanzador)
        var LS = window.MapleSkills.SKILLS[f.id], ltr = LS.tiers[f.tier], lf = A.ls && A.ls[f.tier], lj2 = Math.min(ltr.hit.length - 1, Math.floor(f.t * 1000 / LS.hitDelay));
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
    if (f) sprite(f.img, 'mob', m.x, y - bob, m.dir, alpha);
    else { ctx.fillStyle = m.kind === 'snail_red' ? '#d9534f' : '#4aa3df'; ctx.beginPath(); ctx.ellipse(m.x, y - 12, 14, 12, 0, 0, 7); ctx.fill(); }
    if (m.hp < m.maxHp && alpha === 1) { var by = y - (set.move && set.move[0] ? set.move[0].height : 32) - 8; ctx.fillStyle = '#300'; ctx.fillRect(m.x - 16, by, 32, 4); ctx.fillStyle = '#e33'; ctx.fillRect(m.x - 16, by, 32 * Math.max(0, m.hp) / m.maxHp, 4); }
  }

  // Cámara libre: NO sigue al personaje. Se mueve arrastrando con el mouse (o el dedo).
  function updateCam(snap) {
    if (snap) { curMap(); cam.x = world.player.x; cam.y = world.player.y - 80; }
    curMap();
    var vw = cv.width / zoom, vh = cv.height / zoom;
    var w = A.bg ? A.bg.width : IMG_W, h = A.bg ? A.bg.height : IMG_H, L = -off.x, T = -off.y;
    cam.x = w <= vw ? L + w / 2 : Math.max(L + vw / 2, Math.min(L + w - vw / 2, cam.x));
    cam.y = h <= vh ? T + h / 2 : Math.max(T + vh / 2, Math.min(T + h - vh / 2, cam.y));
  }
  var drag = null;
  cv.addEventListener('pointerdown', function (e) { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', function (e) {
    if (!drag || drag.id !== e.pointerId) return;
    drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
    cam.x -= (e.clientX - drag.x) / zoom; cam.y -= (e.clientY - drag.y) / zoom;
    drag.x = e.clientX; drag.y = e.clientY;
  });
  function endDrag(e) { if (drag && drag.id === e.pointerId) { if (drag.moved < 6 && e.type === 'pointerup') pickChar(e.clientX, e.clientY); drag = null; cv.style.cursor = 'grab'; } }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.style.cursor = 'grab';
  // clic (sin arrastrar) sobre un personaje = seleccionarlo
  function pickChar(sx, sy) {
    var wx = (sx - cv.width / 2) / zoom + cam.x, wy = (sy - cv.height / 2) / zoom + cam.y, best = -1, bd = 1e9;
    world.chars.forEach(function (c, i) {
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
    ctx.textAlign = 'left'; ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.font = 'bold 30px sans-serif';
    ctx.strokeText(nm, 16, cv.height - 44); ctx.fillStyle = '#fff'; ctx.fillText(nm, 16, cv.height - 44);
    ctx.font = 'bold 22px sans-serif'; ctx.strokeText(lv, 16, cv.height - 16); ctx.fillStyle = '#ffe45c'; ctx.fillText(lv, 16, cv.height - 16);
    ctx.lineWidth = 3;
  }

  function render() {
    var vw = cv.width / zoom, vh = cv.height / zoom;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#3a66c8'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(zoom, 0, 0, zoom, Math.round(-(cam.x - vw / 2) * zoom), Math.round(-(cam.y - vh / 2) * zoom));
    if (A.bg) ctx.drawImage(A.bg, -off.x, -off.y);
    world.mobs.forEach(drawMob);
    drawPlayer();
    drawSkillFx();
    ctx.textAlign = 'center'; ctx.lineWidth = 3;
    world.texts.forEach(function (t) {
      ctx.font = (t.big ? 'bold 24px' : 'bold 16px') + ' sans-serif';
      ctx.globalAlpha = Math.max(0, 1 - t.t / (t.life || 0.8)); ctx.strokeStyle = '#000'; ctx.strokeText(t.txt, t.x, t.y);
      ctx.fillStyle = t.c || '#ffd23f'; ctx.fillText(t.txt, t.x, t.y);
    });
    ctx.globalAlpha = 1;
    if (debug || !A.bg) drawDebug();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'left'; ctx.font = '14px sans-serif';
    var lines = ['Modo: ' + (world.ai.auto ? 'AUTO (idle)' : 'MANUAL') + '   Kills: ' + world.kills + '   Velocidad x' + speed,
      'Arrastra con el mouse para mover la cámara · rueda zoom · I inventario · E equip · S stat · K skill · P pociones · M mapa · A auto/manual · D debug · F acelerar · Manual: ←→ mover, Espacio saltar, ↑↓ cuerda, Z atacar, X skill principal (Slash Blast / Lucky Seven / Arrow Blow), H Haste'];
    if (debug) lines.push('Offset mapa: x=' + off.x + ' y=' + off.y + '  (I/J/K/L mueven 1px, con Shift 10px)');
    lines.forEach(function (s, i) { ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(s, 10, 20 + i * 18); ctx.fillStyle = '#fff'; ctx.fillText(s, 10, 20 + i * 18); });
    drawHUD();
  }

  function applyManual() {
    var i = world.input;
    i.left = !!keys.ArrowLeft; i.right = !!keys.ArrowRight; i.up = !!keys.ArrowUp; i.down = !!keys.ArrowDown; i.attack = !!(keys.KeyZ || keys.ControlLeft); i.skill = keys.KeyX ? ({ thief: 'luckySeven', archer: 'arrowBlow' }[world.chars[world.selected].cls] || 'slashBlast') : keys.KeyH ? 'haste' : false;
  }
  addEventListener('keydown', function (e) {
    if (e.code.indexOf('Arrow') === 0 || e.code === 'Space') e.preventDefault();
    keys[e.code] = true;
    if (e.code === 'Space') world.input.jump = true;
    if (e.code === 'KeyA') { world.ai.auto = !world.ai.auto; }
    if (e.code === 'KeyD') debug = !debug;
    if (/^Digit[1-9]$/.test(e.code)) { var vis = window.MAPLE_GAME.visible(), vi = +e.code.slice(5) - 1; if (vi < vis.length) { S.selectChar(world, vis[vi]); save(); } }
    if (e.code === 'KeyR' && e.shiftKey) { world.chars = []; S.addCharacter(world, { name: 'Guerrero', cls: 'warrior' }); S.selectChar(world, 0); world.mesos = 0; world.inv = window.MapleItems.newInventory(); save(); }  // Shift+R: reiniciar progreso
    if (e.code === 'KeyF') speed = speed === 1 ? 4 : 1;
    if (debug) {
      var st = e.shiftKey ? 10 : 1, ch = true;
      if (e.code === 'KeyJ') off.x += st; else if (e.code === 'KeyL') off.x -= st;
      else if (e.code === 'KeyI') off.y += st; else if (e.code === 'KeyK') off.y -= st; else ch = false;
      if (ch) try { localStorage.setItem(world.mapId === 'henesys' ? 'maple_off' : 'maple_off_' + world.mapId, JSON.stringify(off)); } catch (x) {}
    }
  });
  addEventListener('keyup', function (e) { keys[e.code] = false; });
  addEventListener('wheel', function (e) { zoom = Math.max(0.5, Math.min(2, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); });
  function resize() { cv.width = innerWidth; cv.height = innerHeight; }
  addEventListener('resize', resize); resize();

  var last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000) * speed; last = now;
    while (acc >= S.STEP) { if (!world.ai.auto) applyManual(); S.step(world, S.STEP); acc -= S.STEP; }
    updateCam(false); render(); requestAnimationFrame(frame);
  }
  window.MAPLE_GAME.focus = function (i) { curMap(); var p = world.chars[i].player; cam.x = p.x; cam.y = p.y - 80; };
  loadAll().then(function () { updateCam(true); requestAnimationFrame(frame); });
})();
