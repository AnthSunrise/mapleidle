/* Skills de 1st Job (datos tomados de 100.img.xml). Cada nivel de personaje da 3 SP; cada nivel de skill cuesta 1 SP. */
(function (root) {
  'use strict';
  var SKILLS = {
    slashBlast: {
      id: 'slashBlast', cls: 'warrior', skillId: 1001005, name: 'Slash Blast', maxLevel: 20,
      icon: 'assets/skill/slash_blast_icon.png', dir: 'assets/skill/slash_blast/',
      // XML: damage "175+8*x" (% del daño base), mpCon "3+d(x/6)", mobCount 6, attackCount 1, lt(-200,-113) rb(-10,0)
      damage: function (x) { return 175 + 8 * x; },
      mpCon: function (x) { return 3 + Math.floor(x / 6); },
      mobCount: 6, attackCount: 1,
      range: { x1: 10, x2: 200, y1: -113, y2: 0 },      // hacia donde mira el personaje (lt/rb del XML espejados)
      // Animación: frames 0-4 del efecto = carga (personaje parado), frame 5+ = swingO2 (decisión tuya)
      windup: 0.45, hitAt: 0.59, total: 0.9,
      // origin = punto del frame que se coloca sobre el personaje; delay en ms (del XML)
      effect: [
        { ox: 107, oy: 129 }, { ox: 100, oy: 123 }, { ox: 87, oy: 113 }, { ox: 71, oy: 100 }, { ox: 51, oy: 83 },
        { ox: 225, oy: 167 }, { ox: 228, oy: 91 }, { ox: 222, oy: 41 }, { ox: 213, oy: 23 }, { ox: 205, oy: -1 }
      ],
      effectDelay: 90,
      hit: [{ ox: 80, oy: 58 }, { ox: 86, oy: 65 }, { ox: 76, oy: 57 }, { ox: 57, oy: 6 }],   // grupo hit/2 del XML
      hitDelay: 120
    }
  };
  // Arrow Blow (Archer, 13001020 de 1300.img; nombre provisional). Del WZ: damage "80+2*x", mpCon "17+d(x/4)", attackCount 3, mobCount 5,
  // alcance lt(-300,-90) rb(0,10), maxLevel 20, acción "WBbreezeArrow" (no existe en el arco: se usa shoot1 tras cargar de pie, como Slash Blast).
  SKILLS.arrowBlow = {
    id: 'arrowBlow', cls: 'archer', skillId: 13001020, name: 'Arrow Blow', maxLevel: 20, action: 'shoot1',
    icon: 'assets/skill/arrow_blow_icon.png', dir: 'assets/skill/arrow_blow/',
    damage: function (x) { return 80 + 2 * x; },
    mpCon: function (x) { return 17 + Math.floor(x / 4); },
    mobCount: 5, attackCount: 3,
    range: { x1: 10, x2: 300, y1: -90, y2: 10 },
    // frames 0-4 del efecto = carga (personaje parado, 5 x 90 ms); desde el 5 sale la ráfaga y el personaje dispara (shoot1)
    windup: 0.45, hitAt: 0.59, total: 0.9,
    effect: [
      { ox: 76, oy: 65 }, { ox: 71, oy: 61 }, { ox: 70, oy: 59 }, { ox: 68, oy: 55 }, { ox: 68, oy: 50 },
      { ox: 292, oy: 88 }, { ox: 333, oy: 82 }, { ox: 360, oy: 76 }, { ox: 373, oy: 71 }, { ox: 378, oy: 64 }
    ],
    effectDelay: 90,
    hit: [{ ox: 68, oy: 47 }, { ox: 70, oy: 52 }, { ox: 68, oy: 53 }, { ox: 70, oy: 53 }, { ox: 67, oy: 54 }, { ox: 53, oy: 42 }],
    hitDelay: 90
  };
  // Haste (Thief). Del XML (Decent Haste, solo nivel 1): mpCon 5, time 200, speed 20, jump 10, acción alert2.
  // Escalado PROVISIONAL a 20 niveles: velocidad 20% (nivel 1) -> 40% (nivel 20); duración 200 s -> 390 s; MP 5 -> 10.
  SKILLS.haste = {
    id: 'haste', cls: 'thief', skillId: 4001003, name: 'Haste', maxLevel: 20, buff: 'haste',
    icon: 'assets/skill/haste_icon.png', dir: 'assets/skill/haste/',
    speed: function (x) { return 0.20 + 0.20 * (x - 1) / 19; },
    duration: function (x) { return 190 + 10 * x; },
    mpCon: function (x) { return 5 + Math.floor(x / 4); },
    renewAt: 10,                      // el auto farm la vuelve a lanzar cuando a alguien le quedan menos de 10 s
    hitAt: 0.25, total: 0.6,          // pose "alert" (4 frames de 150 ms); el buff se aplica a los 0.25 s
    effectDelay: 66,                  // 9 frames (XML: 90 ms) acortados para que el efecto dure lo que la pose
    effect: [{ ox: 23, oy: 12 }, { ox: 20, oy: 12 }, { ox: 68, oy: 59 }, { ox: 67, oy: 59 }, { ox: 59, oy: 64 },
             { ox: 57, oy: 64 }, { ox: 35, oy: 64 }, { ox: 34, oy: 63 }, { ox: -30, oy: 44 }]
  };
  var ORDER = ['slashBlast', 'haste', 'luckySeven', 'arrowBlow'];
  // Lucky Seven (Thief, 4001344). Del 400.img: damage "110+4*x", mpCon "8+2*d(x/6)", bulletCount 2, maxLevel 20.
  // Efectos (lanzamiento y golpe) cambian con el nivel del personaje: base, 10, 15, 20 y 25.
  var LS_TIERS = {
    0: { effect: [[105, 51], [104, 47], [111, 45], [109, 36], [108, 35]], hit: [[22, 21], [23, 21], [27, 24], [26, 22]] },
    10: { effect: [[93, 78], [84, 66], [110, 48], [103, 49], [103, 49], [101, 49]], hit: [[33, 35], [37, 34], [36, 34], [34, 35]] },
    15: { effect: [[93, 78], [84, 66], [110, 48], [103, 49], [103, 49], [101, 49]], hit: [[33, 39], [39, 34], [39, 35], [37, 35]] },
    20: { effect: [[93, 78], [84, 66], [110, 48], [103, 49], [103, 49], [101, 49]], hit: [[32, 38], [38, 33], [38, 34], [36, 34]] },
    25: { effect: [[94, 79], [84, 66], [112, 49], [103, 49], [103, 49], [101, 49]], hit: [[32, 38], [38, 33], [38, 34], [36, 34]] }
  };
  SKILLS.luckySeven = {
    id: 'luckySeven', cls: 'thief', skillId: 4001344, name: 'Lucky Seven', maxLevel: 20, ranged: true,
    icon: 'assets/skill/lucky_seven_icon.png', dir: 'assets/skill/lucky_seven/',
    damage: function (x) { return 110 + 4 * x; },
    mpCon: function (x) { return 8 + 2 * Math.floor(x / 6); },
    bulletCount: 2, mobCount: 1, attackCount: 1, starGap: 0.09, speed: 700,
    range: { x1: 0, x2: 230, y1: -60, y2: 10 },
    // misma cadencia que el ataque normal (3 fotogramas x 140 ms); el lanzamiento sale en el fotograma 1
    windup: 0, hitAt: 0.14, total: 0.42,
    tiers: LS_TIERS, effectDelay: 70, hitDelay: 70,
    tierFor: function (lv) { return lv >= 25 ? 25 : lv >= 20 ? 20 : lv >= 15 ? 15 : lv >= 10 ? 10 : 0; }
  };

  var SP_PER_LEVEL = 3;

  function newSkills() { var o = {}; ORDER.forEach(function (id) { o[id] = { level: 0, auto: true }; }); return o; }
  function sanitize(sv) {
    var o = newSkills();
    if (sv) ORDER.forEach(function (id) {
      var s = sv[id]; if (!s) return;
      o[id].level = Math.max(0, Math.min(SKILLS[id].maxLevel, s.level | 0)); o[id].auto = s.auto !== false;
    });
    return o;
  }
  function spent(world) { return ORDER.reduce(function (n, id) { return n + world.skills[id].level; }, 0); }
  function spAvailable(world) { return Math.max(0, SP_PER_LEVEL * world.stats.level - spent(world)); }
  function learn(world, id) {
    var sk = SKILLS[id], st = world.skills[id];
    if (!sk || spAvailable(world) < 1 || st.level >= sk.maxLevel) return false;
    st.level++; return true;
  }

  var api = { SKILLS: SKILLS, ORDER: ORDER, SP_PER_LEVEL: SP_PER_LEVEL, newSkills: newSkills, sanitize: sanitize, spAvailable: spAvailable, learn: learn };
  root.MapleSkills = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
