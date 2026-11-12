/* Skills de 1st Job (datos tomados de 100.img.xml). Cada nivel de personaje da 3 SP; cada nivel de skill cuesta 1 SP. */
(function (root) {
  function $t(x) { var a = arguments, f = root.$t; if (f) return f.apply(null, a); return String(x).replace(/\{(\d+)\}/g, function (m, i) { return a[+i + 1] !== undefined ? a[+i + 1] : m; }); }
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
  // Magic Claw (Mage, 12001003 de 1200.img; los efectos confirman el nombre). Del WZ: damage "70+3*x", mpCon "10+2*d(x/4)", attackCount 2, mobCount 4,
  // alcance lt(-250,-150) rb(0,0), maxLevel 20. Se lanza con la animación del bastón (swingO2): el tajo del efecto sale desde el inicio y el golpe cae a mitad del movimiento.
  SKILLS.magicClaw = {
    id: 'magicClaw', cls: 'mage', skillId: 12001003, name: 'Magic Claw', maxLevel: 20, action: 'swingO2',
    icon: 'assets/skill/magic_claw_icon.png', dir: 'assets/skill/magic_claw/',
    damage: function (x) { return 70 + 3 * x; },
    mpCon: function (x) { return 10 + 2 * Math.floor(x / 4); },
    mobCount: 4, attackCount: 2,
    range: { x1: 0, x2: 250, y1: -150, y2: 0 },
    windup: 0, hitAt: 0.28, total: 0.72,
    effect: [
      { ox: 109, oy: 80 }, { ox: 124, oy: 95 }, { ox: 127, oy: 95 }, { ox: 125, oy: 73 },
      { ox: 105, oy: 51 }, { ox: 93, oy: -3 }, { ox: 92, oy: 2 }, { ox: 34, oy: 4 }
    ],
    effectDelay: 90,
    hit: [{ ox: 39, oy: 36 }, { ox: 48, oy: 32 }, { ox: 55, oy: 49 }, { ox: 42, oy: 43 }, { ox: 31, oy: 34 }],
    hitDelay: 108   // el WZ usa 120/90/120/90/150 ms por frame (media 114)
  };
  // Arrow Blow (Archer, 3001004 de 300.img). damage "195+5*x", mpCon "5+2*d(x/6)", mobCount 4, range 420, maxLevel 20.
  // Efecto: 9 fotogramas x 90 ms junto al personaje; golpe: 4 fotogramas. Se lanza con la animación shoot1 del arco.
  SKILLS.arrowBlow = {
    id: 'arrowBlow', cls: 'archer', skillId: 3001004, name: 'Arrow Blow', maxLevel: 20,
    icon: 'assets/skill/arrow_blow_icon.png', dir: 'assets/skill/arrow_blow/', action: 'shoot1',
    damage: function (x) { return 195 + 5 * x; },
    mpCon: function (x) { return 5 + 2 * Math.floor(x / 6); },
    mobCount: 4, attackCount: 1,
    range: { x1: 10, x2: 420, y1: -75, y2: 30 },
    windup: 0, hitAt: 0.3, total: 0.7,
    effect: [{ ox: 91, oy: 70 }, { ox: 82, oy: 56 }, { ox: 74, oy: 43 }, { ox: 73, oy: 42 }, { ox: 77, oy: 56 }, { ox: 87, oy: 60 }, { ox: 93, oy: 63 }, { ox: 92, oy: 56 }, { ox: 88, oy: 53 }],
    effectDelay: 70,
    hit: [{ ox: 42, oy: 38 }, { ox: 69, oy: 65 }, { ox: 74, oy: 66 }, { ox: 76, oy: 67 }],
    hitDelay: 90,
    ball: { speed: 1000, origin: [[34, 27], [33, 26], [32, 26]], delay: 90, startY: 30 }   // flecha verde (nodo ball del WZ): sale en el golpe, viaja al enemigo y recién ahí hace daño
  };

  // Haste (Thief). Del XML (Decent Haste, solo nivel 1): mpCon 5, time 200, speed 20, jump 10, acción alert2.
  // Escalado PROVISIONAL a 20 niveles: velocidad 20% (nivel 1) -> 40% (nivel 20); duración 200 s -> 390 s; MP 5 -> 10.
  SKILLS.haste = {
    id: 'haste', cls: 'thief', skillId: 4001003, name: 'Haste', maxLevel: 20, buff: 'haste',
    icon: 'assets/skill/haste_icon.png', dir: 'assets/skill/haste/',
    speed: function (x) { return 0.20 + 0.20 * (x - 1) / 19; },
    mods: function (x) { return { speed: 0.20 + 0.20 * (x - 1) / 19 }; },
    duration: function (x) { return 190 + 10 * x; },
    mpCon: function (x) { return 5 + Math.floor(x / 4); },
    renewAt: 10,                      // el auto farm la vuelve a lanzar cuando a alguien le quedan menos de 10 s
    hitAt: 0.25, total: 0.6,          // pose "alert" (4 frames de 150 ms); el buff se aplica a los 0.25 s
    effectDelay: 66,                  // 9 frames (XML: 90 ms) acortados para que el efecto dure lo que la pose
    effect: [{ ox: 23, oy: 12 }, { ox: 20, oy: 12 }, { ox: 68, oy: 59 }, { ox: 67, oy: 59 }, { ox: 59, oy: 64 },
             { ox: 57, oy: 64 }, { ox: 35, oy: 64 }, { ox: 34, oy: 63 }, { ox: -30, oy: 44 }]
  };
  // Somersault Kick (Pirate, 15001002 de 1500.img). damage 225+4*x, mpCon 8+2*d(x/5), mobCount 6, rango lt(-110,-71) rb(-5,0).
  // Animación 'somersault' del cuerpo: secuencia compuesta de poses (swingPF, swingT2, swingP2 girado 180°, stabT2 girado 270°...) con desplazamiento; ver layers.js. Efecto: 7 fotogramas x 120 ms; golpe: 5 fotogramas.
  SKILLS.somersaultKick = {
    id: 'somersaultKick', cls: 'pirate', branches: ['brawler'], skillId: 15001002, name: 'Somersault Kick', maxLevel: 20, action: 'somersault',
    icon: 'assets/skill/somersault_kick_icon.png', dir: 'assets/skill/somersault_kick/',
    damage: function (x) { return 225 + 4 * x; },
    mpCon: function (x) { return 8 + 2 * Math.floor(x / 5); },
    mobCount: 6, attackCount: 1,
    range: { x1: 5, x2: 110, y1: -71, y2: 0 },
    windup: 0, hitAt: 0.36, total: 0.84,
    effect: [{ ox: 44, oy: 8 }, { ox: 77, oy: 45 }, { ox: 147, oy: 155 }, { ox: 177, oy: 211 }, { ox: 166, oy: 192 }, { ox: 144, oy: 151 }, { ox: 112, oy: 112 }],
    effectDelay: 120,
    hit: [{ ox: 33, oy: 50 }, { ox: 39, oy: 58 }, { ox: 43, oy: 58 }, { ox: 32, oy: 28 }, { ox: 12, oy: 9 }],
    hitDelay: 90
  };

  /* ---------- Skills de 1er job (etapa 27): buffs y pasivas ----------
   * Los datos salen de los .img (100/200/300/400/500). Cuando el nivel máximo del juego es distinto al del WZ, la skill se evalúa en el
   * nivel equivalente (x * maxWZ / maxJuego) para que el nivel máximo dé siempre el valor "vanilla". u() = techo, d() = suelo.
   * Interpretaciones propias (no hay descripción en los .img): DEF de buffs = pdd * 0.25; evasión -> probabilidad de esquivar = eva / (eva + 600);
   * "lv2mhp" del Warrior Mastery = % de HP máximo; la precisión no se usa (los ataques no fallan). Ver LEEME (etapa 27). */
  function u(v) { return Math.ceil(v - 1e-9); } function d(v) { return Math.floor(v + 1e-9); }
  function eq(x, wz, mx) { return x * wz / mx; }
  function passive(o) { o.passiveSkill = true; o.mpCon = function () { return 0; }; return o; }
  SKILLS.ironBody = passive({   // Warrior, 1001003: en versiones recientes es pasiva (pdd 10*x). DEF = pdd * 0.25
    id: 'ironBody', cls: 'warrior', skillId: 1001003, name: 'Iron Body', maxLevel: 20, icon: 'assets/skill/iron_body_icon.png',
    fx: function (x) { return { def: 10 * x * 0.25 }; }, info: function (x) { return 'DEF +' + 10 * x; }
  });
  SKILLS.warriorMastery = passive({   // Warrior, 1000009 (vanilla Lv15): velocidad, HP máx. Las probabilidades de stance no se usan
    id: 'warriorMastery', cls: 'warrior', skillId: 1000009, name: 'Warrior Mastery', maxLevel: 20, icon: 'assets/skill/warrior_mastery_icon.png',
    fx: function (x) { var v = eq(x, 15, 20); return { speed: (2 + u(v / 2)) / 100, hpLv: 5 + v }; },   // lv2mhp = HP máx. por cada nivel del personaje
    info: function (x) { var f = this.fx(x); return $t('Velocidad +{0}% · HP máx. +{1} por nivel', Math.round(f.speed * 100), Math.round(f.hpLv)); }
  });
  SKILLS.magicArmor = passive({   // Mage, 2001003 (vanilla Lv15): pasiva en versiones recientes. DEF = pdd * 0.25
    id: 'magicArmor', cls: 'mage', skillId: 2001003, name: 'Magic Armor', maxLevel: 10, icon: 'assets/skill/magic_armor_icon.png',
    fx: function (x) { return { def: 8 * eq(x, 15, 10) * 0.25 }; }, info: function (x) { return 'DEF +' + Math.round(8 * eq(x, 15, 10)); }
  });
  SKILLS.magicGuard = {   // Mage, 2001002: parte del daño recibido se descuenta del MP
    id: 'magicGuard', cls: 'mage', skillId: 2001002, name: 'Magic Guard', maxLevel: 15, buff: 'magicGuard',
    icon: 'assets/skill/magic_guard_icon.png', dir: 'assets/skill/magic_guard/',
    mods: function (x) { return { absorb: (10 + 5 * x) / 100 }; }, duration: function (x) { return 75 + 35 * x; },
    mpCon: function (x) { return 5 + u(x / 2); }, renewAt: 10, hitAt: 0.25, total: 0.6,
    effectDelay: 50, effect: [{ ox: 16, oy: 118 }, { ox: 16, oy: 124 }, { ox: 21, oy: 120 }, { ox: 26, oy: 124 }, { ox: 25, oy: 118 }, { ox: 27, oy: 122 }, { ox: 27, oy: 116 }, { ox: 30, oy: 122 }, { ox: 28, oy: 118 }, { ox: 25, oy: 124 }, { ox: 24, oy: 120 }, { ox: 24, oy: 124 }],
    info: function (x) { return $t('{0}% del daño recibido se paga con MP · {1} s', 10 + 5 * x, this.duration(x)); }
  };
  SKILLS.teleport = {   // Mage, 2001009: medio de transporte; la IA lo usa para llegar a otras plataformas (a los lados / pisos de arriba y abajo) y para cruzar su plataforma
    id: 'teleport', cls: 'mage', skillId: 2001009, name: 'Teleport', maxLevel: 5, teleportSkill: true,
    icon: 'assets/skill/teleport_icon.png', dir: 'assets/skill/teleport/',
    mpCon: function (x) { return 30 - 2 * x; }, dist: function (x) { return 110 + 12 * x; }, vert: function (x) { return 250 + 5 * x; }, cooldown: 0.5,
    info: function (x) { return $t('Teletransporte: {0} px a los lados, {1} px arriba/abajo · MP {2}', this.dist(x), this.vert(x), this.mpCon(x)); }
  };
  SKILLS.mpBoost = passive({   // Mage, 2000006
    id: 'mpBoost', cls: 'mage', skillId: 2000006, name: 'MP Boost', maxLevel: 10, icon: 'assets/skill/mp_boost_icon.png',
    fx: function (x) { var v = eq(x, 20, 10); return { mpLv: 8.055 * v - 0.0995 * v * v }; },   // calibrado con tu servidor (mago Lv30: nivel 0/10/20 = +0/+2119/+3639 MP): MP máx. por cada nivel del personaje
    info: function (x) { return $t('MP máx. +{0} por nivel', Math.round(this.fx(x).mpLv * 10) / 10); }
  });
  SKILLS.archerMastery = passive({   // Archer, 3000002 (vanilla Lv15): alcance, evasión y velocidad
    id: 'archerMastery', cls: 'archer', skillId: 3000002, name: 'Archer Mastery', maxLevel: 20, icon: 'assets/skill/archer_mastery_icon.png',
    fx: function (x) { var v = eq(x, 15, 20); return { range: 8 * v, eva: 15 * v, speed: Math.min(2 * v, 5 + v) / 100 }; },
    info: function (x) { var f = this.fx(x); return $t('Alcance +{0} px · Evasión {1} · Velocidad +{2}%', Math.round(f.range), Math.round(f.eva), Math.round(f.speed * 100)); }
  });
  SKILLS.criticalShot = passive({   // Archer, 3000001: probabilidad de crítico 2*x %
    id: 'criticalShot', cls: 'archer', skillId: 3000001, name: 'Critical Shot', maxLevel: 20, icon: 'assets/skill/critical_shot_icon.png',
    fx: function (x) { return { crit: 2 * x / 100 }; }, info: function (x) { return $t('Crítico {0}%', 2 * x); }
  });
  SKILLS.nimbleBody = passive({   // Thief, 4000000 (vanilla Lv10): evasión 22*x
    id: 'nimbleBody', cls: 'thief', skillId: 4000000, name: 'Nimble Body', maxLevel: 20, icon: 'assets/skill/nimble_body_icon.png',
    fx: function (x) { return { eva: 22 * eq(x, 10, 20) }; }, info: function (x) { return $t('Evasión +{0}', Math.round(22 * eq(x, 10, 20))); }
  });
  SKILLS.shadowHeart = passive({   // Pirate, 5000007
    id: 'shadowHeart', cls: 'pirate', skillId: 5000007, name: 'Shadow Heart', maxLevel: 10, icon: 'assets/skill/shadow_heart_icon.png',
    fx: function (x) { return { crit: 2 * x / 100, critDmg: x / 100 }; }, info: function (x) { return $t('Crítico {0}% · daño crítico +{1}%', 2 * x, x); }
  });
  SKILLS.bulletTime = passive({   // Pirate, 5000000: velocidad (la precisión y el salto no se usan)
    id: 'bulletTime', cls: 'pirate', skillId: 5000000, name: 'Bullet Time', maxLevel: 10, icon: 'assets/skill/bullet_time_icon.png',
    fx: function (x) { return { speed: 2 * x / 100 }; }, info: function (x) { return $t('Velocidad +{0}%', 2 * x); }
  });
  SKILLS.dash = {   // Pirate, 5001005: buff de velocidad
    id: 'dash', cls: 'pirate', skillId: 5001005, name: 'Dash', maxLevel: 10, buff: 'dash',
    icon: 'assets/skill/dash_icon.png', dir: 'assets/skill/dash/',
    mods: function (x) { return { speed: 5 * x / 100 }; }, duration: function (x) { return 4 * u(x / 2); },
    mpCon: function (x) { return 10 - x; }, renewAt: 3, hitAt: 0.25, total: 0.6,
    effectDelay: 100, effect: [{ ox: 44, oy: 91 }, { ox: 40, oy: 93 }, { ox: 32, oy: 96 }, { ox: 14, oy: 88 }, { ox: -20, oy: 73 }, { ox: -40, oy: 66 }],
    info: function (x) { return $t('Velocidad +{0}% · {1} s', 5 * x, this.duration(x)); }
  };
  SKILLS.hpBoost = passive({   // Pirate, 15000008
    id: 'hpBoost', cls: 'pirate', skillId: 15000008, name: 'HP Boost', maxLevel: 10, icon: 'assets/skill/hp_boost_icon.png',
    fx: function (x) { return { hpPct: 2 * x / 100 }; }, info: function (x) { return $t('HP máx. +{0}%', 2 * x); }
  });
  /* ---------- Skills de 2do job (etapa 31): Fighter (110.img) ----------
   * job: 2 -> usan el fondo de SP del 2do job (Lv30-69 = 120 SP). `branches` = rama que las puede usar. `req` = {skill: nivel mínimo} (nodo req del WZ). */
  var FT = ['fighter'];
  SKILLS.ftWeaponMastery = passive({   // 1100000: maestría = daño mínimo / máximo (10+2x %)
    id: 'ftWeaponMastery', cls: 'warrior', branches: FT, job: 2, skillId: 1100000, name: 'Weapon Mastery', maxLevel: 20, icon: 'assets/skill/ft_weapon_mastery_icon.png',
    fx: function (x) { return { mastery: (10 + 2 * x) / 100 }; }, info: function (x) { return $t('Maestría {0}% (daño mínimo = {0}% del máximo)', 10 + 2 * x); }
  });
  SKILLS.ftFinalAttack = passive({   // 1100002: tras un ataque normal, prob 2*x % de un golpe extra de 100+5*d(x/2) %
    id: 'ftFinalAttack', cls: 'warrior', branches: FT, job: 2, skillId: 1100002, name: 'Final Attack', maxLevel: 20, icon: 'assets/skill/ft_final_attack_icon.png', req: { ftWeaponMastery: 3 },
    finalAttack: true, prop: function (x) { return 2 * x; }, damage: function (x) { return 100 + 5 * Math.floor(x / 2); },
    info: function (x) { return $t('Tras un ataque normal: {0}% de golpe extra de {1}%', this.prop(x), this.damage(x)); },
    dir: 'assets/skill/ft_final_attack/', hit: [{ ox: 83, oy: 46 }, { ox: 74, oy: 51 }, { ox: 92, oy: 41 }], hitDelay: 50
  });
  SKILLS.ftPhysicalTraining = passive({   // 1100009 (WZ máx. 10, aquí 5): STR y DEX +3*x
    id: 'ftPhysicalTraining', cls: 'warrior', branches: FT, job: 2, skillId: 1100009, name: 'Physical Training', maxLevel: 5, icon: 'assets/skill/ft_physical_training_icon.png',
    fx: function (x) { var v = eq(x, 10, 5); return { pStr: 3 * v, pDex: 3 * v }; }, info: function (x) { return $t('STR y DEX +{0}', 3 * eq(x, 10, 5)); }
  });
  SKILLS.ftWeaponBooster = {   // 1101004: velocidad de ataque (-2 etapas) durante 10*x s
    id: 'ftWeaponBooster', cls: 'warrior', branches: FT, job: 2, skillId: 1101004, name: 'Weapon Booster', maxLevel: 20, buff: 'weaponBooster', req: { ftWeaponMastery: 5 },
    icon: 'assets/skill/ft_weapon_booster_icon.png', dir: 'assets/skill/ft_weapon_booster/',
    mods: function () { return { atkSpeed: 0.25 }; }, duration: function (x) { return 10 * x; }, mpCon: function (x) { return 31 - x; }, renewAt: 5,
    info: function (x) { return $t('Velocidad de ataque +25% · {0} s', this.duration(x)); },
    hitAt: 0.25, total: 0.6, effectDelay: 55,
    effect: [[23, 50], [32, 57], [46, 72], [49, 69], [47, 66], [38, 66], [32, 70], [29, 71], [24, 69], [21, 64], [-8, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };
  SKILLS.ftRage = {   // 1101006: ATT +10+x para todo el party del mapa; 55+5*x s
    id: 'ftRage', cls: 'warrior', branches: FT, job: 2, skillId: 1101006, name: 'Rage', maxLevel: 20, buff: 'rage', party: true,
    icon: 'assets/skill/ft_rage_icon.png', dir: 'assets/skill/ft_rage/',
    mods: function (x) { return { att: 10 + x }; }, duration: function (x) { return 55 + 5 * x; }, mpCon: function (x) { return 4 + 8 * u(x / 10); }, renewAt: 8,
    info: function (x) { return $t('ATT +{0} al party · {1} s', 10 + x, this.duration(x)); },
    hitAt: 0.3, total: 0.84, effectDelay: 60,
    effect: [[30, 43], [42, 73], [45, 81], [46, 85], [63, 85], [61, 128], [66, 121], [68, 120], [68, 118], [44, 123], [43, 132], [41, 140], [40, 138], [33, 143]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };
  SKILLS.ftComboFury = {
    id: 'ftComboFury', cls: 'warrior', branches: FT, job: 2, skillId: 1101012, name: 'Combo Fury', maxLevel: 10, action: 'comboForce',
    icon: 'assets/skill/ft_combo_fury_icon.png', dir: 'assets/skill/ft_combo_fury/',
    damage: function (x) { return 110 + 3 * x; },
    mpCon: function (x) { return 10 + 2 * Math.floor(x / 5); },
    mobCount: 6, attackCount: 2,
    range: { x1: 10, x2: 450, y1: -80, y2: 5 },
    windup: 0.35, hitAt: 0.5, total: 0.85,
    cooldown: 3,
    pullTarget: true,
    effect: [[429, 80], [461, 89], [468, 100], [467, 103], [450, 127], [390, 103], [270, 74], [215, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effectDelay: 90,
    hit: [[72, 98], [84, 59], [56, 54], [39, 56], [15, 9]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90
  };
  SKILLS.ftBrandish = {
    id: 'ftBrandish', cls: 'warrior', branches: FT, job: 2, skillId: 1101011, name: 'Brandish', maxLevel: 20,
    icon: 'assets/skill/ft_brandish_icon.png', dir: 'assets/skill/ft_brandish/', action: 'brandishNew2', action1h: 'brandishNew',
    damage: function (x) { return 220 + 3 * x; }, mpCon: function (x) { return 10 + Math.floor(x / 3); },
    mobCount: 6, attackCount: 1, 
    range: { x1: 10, x2: 185, y1: -125, y2: 35 },
    windup: 0, hitAt: 0.36, hitGap: 0.48, total: 0.9,
    effect0Start: 0.24, // Ignora el frame vacío del WZ
    effect0: [[23, 65], [35, 65], [39, 64], [49, 67], [52, 68], [63, 68]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effect0Delay: 120,
    effect: [[8, 65], [167, 122], [164, 116], [153, 115], [143, 121], [202, 123], [209, 121], [207, 116], [204, 83], [205, 13]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effectDelay: 120,
    hit: [[82, 64], [82, 63], [87, 64], [83, 63], [41, 103], [41, 102], [45, 109], [51, 105], [52, 91]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 120
  };
  SKILLS.ftWarriorLeap = {   // 1101010 (WZ máx. 10, aquí 5): impulso horizontal que ayuda al Warrior a moverse (como el Teleport del Mage). Sin datos en el WZ: alcance y enfriamiento propios
    id: 'ftWarriorLeap', cls: 'warrior', branches: FT, job: 2, skillId: 1101010, name: 'Warrior Leap', maxLevel: 5, teleportSkill: true, leap: true,
    icon: 'assets/skill/ft_warrior_leap_icon.png',
    mpCon: function (x) { return 65 - 5 * eq(x, 10, 5); }, dist: function (x) { return 140 + 10 * eq(x, 10, 5); }, vert: function (x) { return 90; }, cooldown: 1.0,
    info: function (x) { return $t('Empujón desde el suelo: {0} px al frente · MP {1}', this.dist(x), this.mpCon(x)); }
  };

  /* ---------- Page (120.img): comparte con el Fighter Weapon Mastery, Final Attack, Physical Training, Weapon Booster, Ground Smash y Warrior Leap
   * (mismos valores y arte en los .img); las propias son Threaten y Power Guard. Se copian con otro id / rama / skillId. */
  function cloneJob2(src, id, branch, skillId, pre, from, extra) {
    var o = Object.assign({}, src, extra || {}); o.id = id; o.branches = [branch]; o.skillId = skillId;
    if (src.req && !(extra && extra.req)) { o.req = {}; for (var k in src.req) o.req[k.replace(from, pre)] = src.req[k]; }
    SKILLS[id] = o; return o;
  }
  cloneJob2(SKILLS.ftWeaponMastery, 'pgWeaponMastery', 'page', 1200000, 'pg', 'ft');
  cloneJob2(SKILLS.ftFinalAttack, 'pgFinalAttack', 'page', 1200002, 'pg', 'ft');
  cloneJob2(SKILLS.ftPhysicalTraining, 'pgPhysicalTraining', 'page', 1200009, 'pg', 'ft');
  cloneJob2(SKILLS.ftWeaponBooster, 'pgWeaponBooster', 'page', 1201004, 'pg', 'ft');
  cloneJob2(SKILLS.ftWarriorLeap, 'pgWarriorLeap', 'page', 1201010, 'pg', 'ft');
  SKILLS.pgFireCharge = {
    id: 'pgFireCharge', cls: 'warrior', branches: ['page'], job: 2, skillId: 1201011, name: 'Fire Charge', maxLevel: 15,
    icon: 'assets/skill/pg_fire_charge_icon.png', action: 'chargeBlow', dir: 'assets/skill/pg_fire_charge/',
    damage: function (x) { return Math.round(100 + 2 * eq(x, 20, 15)); },
    mpCon: function (x) { return Math.round(10 + eq(x, 20, 15)); },
    dot: function (x) { return Math.round(55 + eq(x, 20, 15)); },
    dotTime: function (x) { return 2 + Math.ceil(eq(x, 20, 15) / 5); },
    elemAttr: 'f', fire: true, mobCount: 4, attackCount: 3,
    range: { x1: 0, x2: 350, y1: -100, y2: 30 },
    windup: 0.27, hitAt: 0.45, total: 1.0,
    effectStart: 0.27, effect0Start: 0.27,
    effectDelay: 90, effect0Delay: 90,
    effect: [[133,107],[134,104],[137,108],[141,112],[141,112]].map(function(a){return{ox:a[0],oy:a[1]};}),
    effect: [[78,152],[63,148],[46,137],[327,200],[359,193],[409,160],[411,162],[410,156],[408,158]].map(function(a){return{ox:a[0],oy:a[1]};}),
    hit: [[59,69],[65,85],[70,81],[71,77]].map(function(a){return{ox:a[0],oy:a[1]};}),
    hitDelay: 120,
    viewByWeapon: function(wt) { return wt === 'mace' ? 'pgFireChargeMace' : 'pgFireCharge'; }
  };
  SKILLS.pgThreaten = {   // 1201006: debilita a hasta 6 enemigos (±300 x ±200): prob 40+x %, su daño -(10+x)% durante 40+2*x s
    id: 'pgThreaten', cls: 'warrior', branches: ['page'], job: 2, skillId: 1201006, name: 'Threaten', maxLevel: 20, debuff: true,
    icon: 'assets/skill/pg_threaten_icon.png', dir: 'assets/skill/pg_threaten/',
    mpCon: function (x) { return 12 + 3 * u(x / 5); }, duration: function (x) { return 40 + 2 * x; }, prop: function (x) { return 40 + x; }, dmgDown: function (x) { return 10 + x; },
    mobCount: 6, range: { x1: -300, x2: 300, y1: -200, y2: 200 }, hitAt: 0.25, total: 0.75, effectDelay: 60,
    info: function (x) { return $t('Enemigos cercanos (hasta 6): {0}% de bajarles el daño -{1}% durante {2} s', this.prop(x), this.dmgDown(x), this.duration(x)); },
    effect: [[27, 60], [27, 60], [73, 163], [124, 201], [123, 200], [123, 200], [123, 200], [125, 208], [121, 224], [129, 232], [129, 232], [129, 232]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    mobFx: [[18, 5], [16, 4], [4, 7], [4, 11], [11, 11], [9, 8], [2, 14], [5, 17]], mobFxDelay: 70
  };
  SKILLS.pgIceCharge = {
    id: 'pgIceCharge', cls: 'warrior', branches: ['page'], job: 2, skillId: 1201012, name: 'Ice Charge', maxLevel: 15,
    icon: 'assets/skill/pg_ice_charge_icon.png', action: 'chargeBlow', dir: 'assets/skill/pg_ice_charge/',
    damage: function (x) { return Math.round(100 + 2 * eq(x, 20, 15)); },
    mpCon: function (x) { return Math.round(10 + eq(x, 20, 15)); },
    stunProp: function (x) { return Math.round(30 + 3 * eq(x, 20, 15)); },
    stunTime: function (x) { return 1 + Math.ceil(eq(x, 20, 15) / 4); },
    elemAttr: 'i', ice: true, mobCount: 4, attackCount: 3,
    range: { x1: 0, x2: 350, y1: -100, y2: 30 },
    windup: 0.27, hitAt: 0.45, total: 1.0,
    effectStart: 0.27, effect0Start: 0.27,
    effectDelay: 90, effect0Delay: 90,
    effect0: [[133,107],[134,104],[137,108],[141,112],[140,111]].map(function(a){return{ox:a[0],oy:a[1]};}),
    effect: [[78,154],[63,145],[46,131],[391,191],[400,178],[410,170],[411,172],[410,171],[408,148]].map(function(a){return{ox:a[0],oy:a[1]};}),
    hit: [[60,69],[64,85],[65,81],[65,72],[68,75]].map(function(a){return{ox:a[0],oy:a[1]};}),
    hitDelay: 120,
    viewByWeapon: function(wt) { return wt === 'mace' ? 'pgIceChargeMace' : 'pgIceCharge'; }
  };

  /* ---------- Spearman (130.img): como el Page comparte con el Fighter Ground Smash, Warrior Leap y Physical Training (idénticos); Weapon Mastery,
   * Final Attack y Weapon Booster tienen los mismos valores pero otro icono (y otro golpe en Final Attack). Propias: Iron Will y Hyper Body (buffs de party). */
  cloneJob2(SKILLS.ftWeaponMastery, 'spWeaponMastery', 'spearman', 1300000, 'sp', 'ft', { icon: 'assets/skill/sp_weapon_mastery_icon.png' });
  cloneJob2(SKILLS.ftFinalAttack, 'spFinalAttack', 'spearman', 1300002, 'sp', 'ft', { icon: 'assets/skill/sp_final_attack_icon.png', dir: 'assets/skill/sp_final_attack/', hit: [{ ox: 47, oy: 49 }, { ox: 53, oy: 57 }, { ox: 55, oy: 53 }] });
  cloneJob2(SKILLS.ftPhysicalTraining, 'spPhysicalTraining', 'spearman', 1300009, 'sp', 'ft');
  cloneJob2(SKILLS.ftWeaponBooster, 'spWeaponBooster', 'spearman', 1301004, 'sp', 'ft', { icon: 'assets/skill/sp_weapon_booster_icon.png' });
  cloneJob2(SKILLS.ftWarriorLeap, 'spWarriorLeap', 'spearman', 1301010, 'sp', 'ft');
  SKILLS.spPiercingDrive = {
    id: 'spPiercingDrive', cls: 'warrior', branches: ['spearman'], job: 2, skillId: 1301011, name: 'Piercing Drive', maxLevel: 10,
    icon: 'assets/skill/sp_piercing_drive_icon.png', dir: 'assets/skill/sp_piercing_drive/', action: 'stabT1',
    damage: function (x) { return 161 + 2 * eq(x, 20, 10); },         // Lv10 = 201% (WZ Lv20)
    mpCon: function (x) { return 17 + Math.floor(eq(x, 20, 10) / 6); },
    mobCount: 8, attackCount: 2,
    range: { x1: 10, x2: 350, y1: -100, y2: 5 },
    windup: 0, hitAt: 0.3, total: 0.95,
    effect: [[16, 29], [346, 89], [351, 96], [354, 97], [355, 92], [273, 85], [188, 85], [191, 61]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effectDelay: 90,
    hit: [[99, 70], [108, 66], [112, 75], [115, 83], [118, 86]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 120
  };
  SKILLS.spIronWill = {   // 1301006 (massSpell): DEF del party del mapa. pdd = 15*x -> DEF = pdd * 0.25 (como Iron Body); 40+10*x s
    id: 'spIronWill', cls: 'warrior', branches: ['spearman'], job: 2, skillId: 1301006, name: 'Iron Will', maxLevel: 20, buff: 'ironWill',
    icon: 'assets/skill/sp_iron_will_icon.png', dir: 'assets/skill/sp_iron_will/',
    mods: function (x) { return { def: 15 * x * 0.25 }; }, duration: function (x) { return 40 + 10 * x; }, mpCon: function (x) { return 12 + 3 * u(x / 5); }, renewAt: 10,
    info: function (x) { return $t('DEF +{0} al party · {1} s', Math.round(15 * x * 0.25 * 10) / 10, this.duration(x)); },
    hitAt: 0.3, total: 0.9, effectDelay: 55,
    effect: [[46, 7], [46, 16], [46, 22], [46, 35], [46, 54], [46, 54], [46, 53], [46, 53], [46, 53], [46, 53], [46, 53], [47, 53], [47, 141], [47, 146], [47, 137], [47, 139]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };
  SKILLS.spHyperBody = {   // 1301007 (massSpell, pide Iron Will 3): HP y MP máx. del party +3*x %; 15*x s
    id: 'spHyperBody', cls: 'warrior', branches: ['spearman'], job: 2, skillId: 1301007, name: 'Hyper Body', maxLevel: 20, buff: 'hyperBody', req: { spIronWill: 3 },
    icon: 'assets/skill/sp_hyper_body_icon.png', dir: 'assets/skill/sp_hyper_body/',
    mods: function (x) { return { hpPct: 3 * x / 100, mpPct: 3 * x / 100 }; }, duration: function (x) { return 15 * x; }, mpCon: function (x) { return 20 * u(x / 7); }, renewAt: 10,
    info: function (x) { return $t('HP y MP máx. +{0}% al party · {1} s', 3 * x, this.duration(x)); },
    hitAt: 0.3, total: 0.72, effectDelay: 60,
    effect: [[39, 170], [42, 190], [43, 197], [43, 202], [44, 203], [44, 204], [44, 204], [68, 157], [68, 155], [73, 152], [60, 100], [62, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  /* ---------- Wizard Fire/Poison (210.img) ----------
   * Flame Arrow cambia de efecto/proyectil/golpe según el nivel del personaje (base, 40 y 50): `viewFor(lv)` devuelve el id del "aspecto" a usar
   * (los aspectos 40 y 50 son entradas ocultas de SKILLS, sin SP, que solo guardan el arte). */
  var FP = ['wizardFP'];
  SKILLS.fpMpEater = passive({   // 2100000: al golpear con magia, prob x % de absorber u(x/2) % del MP del enemigo. Pide Spell Mastery 5
    id: 'fpMpEater', cls: 'mage', branches: FP, job: 2, skillId: 2100000, name: 'MP Eater', maxLevel: 20, icon: 'assets/skill/fp_mp_eater_icon.png', req: { fpSpellMastery: 5 },
    mpEater: true, prop: function (x) { return x; }, pct: function (x) { return u(x / 2); }, fx: function () { return {}; },
    info: function (x) { return $t('Al golpear: {0}% de absorber {1}% del MP del enemigo', this.prop(x), this.pct(x)); }
  });
  SKILLS.fpSpellMastery = passive({   // 2100006: maestría 10+2x %
    id: 'fpSpellMastery', cls: 'mage', branches: FP, job: 2, skillId: 2100006, name: 'Spell Mastery', maxLevel: 20, icon: 'assets/skill/fp_spell_mastery_icon.png',
    fx: function (x) { return { mastery: (10 + 2 * x) / 100 }; }, info: function (x) { return $t('Maestría {0}% (daño mínimo = {0}% del máximo)', 10 + 2 * x); }
  });
  SKILLS.fpHighWisdom = passive({   // 2100007: INT +4x
    id: 'fpHighWisdom', cls: 'mage', branches: FP, job: 2, skillId: 2100007, name: 'High Wisdom', maxLevel: 10, icon: 'assets/skill/fp_high_wisdom_icon.png',
    fx: function (x) { return { pInt: 4 * x }; }, info: function (x) { return 'INT +' + 4 * x; }
  });
  SKILLS.fpIgnite = passive({   // 2100010/2101010 (aquí pasiva): al golpear con skills de fuego, prob 10+4x % de dejar fuego en el suelo (x: ±40, y: ±20); quema 4+d(x/4) s, un tick cada 1.5 s de 60+5x % a hasta 8 enemigos
    id: 'fpIgnite', cls: 'mage', branches: FP, job: 2, skillId: 2100010, name: 'Ignite', maxLevel: 10, icon: 'assets/skill/fp_ignite_icon.png',
    prop: function (x) { return 10 + 4 * x; }, damage: function (x) { return 60 + 5 * x; }, time: function (x) { return 4 + Math.floor(x / 4); },
    tick: 1.5, mobCount: 8, area: { x1: -40, x2: 40, y1: -20, y2: 20 }, ignite: true,
    dir: 'assets/skill/fp_ignite/', tiles: [[[16, 50], [16, 50], [16, 48], [16, 49], [16, 51], [16, 51], [16, 52]], [[28, 60], [28, 61], [28, 61], [28, 61], [28, 62], [28, 62], [28, 63]], [[51, 83], [53, 84], [54, 81], [54, 83], [54, 85], [53, 85], [52, 86]]], tileDelay: 120,
    hit: [[53, 126], [49, 92], [49, 96], [47, 95], [45, 94], [40, 91]].map(function (a) { return { ox: a[0], oy: a[1] }; }), hitDelay: 120,
    fx: function () { return {}; },
    info: function (x) { return $t('Con skills de fuego: {0}% de dejar fuego {1} s ({2}% cada 1,5 s)', this.prop(x), this.time(x), this.damage(x)); }
  });
  SKILLS.fpMeditate = {   // 2101001 (massSpell): ATT mágico +10+x al party del mapa; 10*x s. Pide MP Eater 3
    id: 'fpMeditate', cls: 'mage', branches: FP, job: 2, skillId: 2101001, name: 'Meditate', maxLevel: 20, buff: 'meditate', req: { fpMpEater: 3 },
    icon: 'assets/skill/fp_meditate_icon.png', dir: 'assets/skill/fp_meditate/',
    mods: function (x) { return { matt: 10 + x }; }, duration: function (x) { return 10 * x; }, mpCon: function (x) { return 10 + Math.floor(x / 3); }, renewAt: 5,
    info: function (x) { return $t('ATT mágico +{0} al party · {1} s', 10 + x, this.duration(x)); },
    hitAt: 0.3, total: 0.81, effectDelay: 45,
    effect: [[26, 9], [29, 14], [33, 26], [62, 100], [66, 98], [64, 94], [61, 106], [68, 116], [68, 126], [71, 133], [69, 135], [68, 139], [67, 148], [66, 152], [66, 151], [66, 151], [65, 139], [47, 148]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };
  SKILLS.fpMagicBooster = {   // 2101008: velocidad de ataque (-2 etapas); 40+20*x s
    id: 'fpMagicBooster', cls: 'mage', branches: FP, job: 2, skillId: 2101008, name: 'Magic Booster', maxLevel: 10, buff: 'magicBooster',
    icon: 'assets/skill/fp_magic_booster_icon.png', dir: 'assets/skill/fp_magic_booster/',
    mods: function () { return { atkSpeed: 0.25 }; }, duration: function (x) { return 40 + 20 * x; }, mpCon: function (x) { return 60 - 4 * x; }, renewAt: 8,
    info: function (x) { return $t('Velocidad de ataque +25% · {0} s', this.duration(x)); },
    hitAt: 0.3, total: 0.86, effectDelay: 45,
    effect: [[109, 119], [106, 113], [103, 107], [96, 96], [96, 93], [86, 87], [86, 81], [87, 83], [88, 88], [88, 87], [88, 94], [88, 100], [85, 99], [64, 111], [53, 99], [54, 100], [51, 99], [51, 99], [50, 98]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };
  function fa(dir, eff, ball, hit) { return { dir: dir, effect: eff.map(function (a) { return { ox: a[0], oy: a[1] }; }), effectDelay: 70, hit: hit.map(function (a) { return { ox: a[0], oy: a[1] }; }), hitDelay: 110, ball: { speed: 900, origin: ball, delay: 60, startY: 30 } }; }
  SKILLS.fpFlameArrow = Object.assign({   // 2101004: damage 141+8x, mpCon 12+3*d(x/4), 3 enemigos, 2 golpes, alcance 350
    id: 'fpFlameArrow', fire: true, cls: 'mage', branches: FP, job: 2, skillId: 2101004, name: 'Flame Arrow', maxLevel: 20, action: 'shoot1',
    icon: 'assets/skill/fp_flame_arrow_icon.png',
    damage: function (x) { return 141 + 8 * x; }, mpCon: function (x) { return 12 + 3 * Math.floor(x / 4); },
    mobCount: 3, attackCount: 2, range: { x1: 10, x2: 350, y1: -75, y2: 30 }, windup: 0, hitAt: 0.3, total: 0.7,
    viewFor: function (lv) { return lv >= 50 ? 'fpFlameArrow50' : lv >= 40 ? 'fpFlameArrow40' : 'fpFlameArrow'; }
  }, fa('assets/skill/fp_flame_arrow/', [[32, 39], [33, 50], [51, 72], [51, 73], [51, 76], [51, 76], [44, 76], [47, 79], [50, 86], [50, 86]], [[42, 10], [42, 9], [42, 10]], [[27, 26], [26, 45], [29, 50], [24, 41], [24, 33]]));
  SKILLS.fpFlameArrow40 = Object.assign({ id: 'fpFlameArrow40', hidden: true, cls: 'mage' }, fa('assets/skill/fp_flame_arrow_40/', [[42, 44], [44, 50], [50, 73], [57, 109], [63, 107], [74, 109], [79, 108], [83, 100], [89, 99], [56, 97], [51, 95]], [[55, 19], [57, 19], [57, 19], [54, 18]], [[40, 37], [50, 40], [47, 39], [37, 33], [24, 31]]));
  SKILLS.fpFlameArrow50 = Object.assign({ id: 'fpFlameArrow50', hidden: true, cls: 'mage' }, fa('assets/skill/fp_flame_arrow_50/', [[44, 50], [47, 58], [54, 89], [64, 138], [72, 136], [88, 138], [94, 137], [100, 126], [108, 124], [63, 122], [56, 119]], [[70, 24], [72, 24], [71, 23], [68, 23]], [[50, 46], [62, 51], [60, 49], [46, 42], [30, 39]]));
  SKILLS.fpPoisonBreath = {   // 2101005 (WZ máx. 20, aquí 10): damage 140+10v, mpCon 15+3*d(v/4), 6 enemigos; veneno: dot 20+2v % del daño máx. por segundo durante 5+d(v/4) s
    id: 'fpPoisonBreath', cls: 'mage', branches: FP, job: 2, skillId: 2101005, name: 'Poison Breath', maxLevel: 10, action: 'swingO3',
    icon: 'assets/skill/fp_poison_breath_icon.png', dir: 'assets/skill/fp_poison_breath/',
    damage: function (x) { return 140 + 10 * eq(x, 20, 10); }, mpCon: function (x) { return 15 + 3 * Math.floor(eq(x, 20, 10) / 4); },
    dot: function (x) { return 20 + 2 * eq(x, 20, 10); }, dotTime: function (x) { return 5 + Math.floor(eq(x, 20, 10) / 4); },
    mobCount: 6, attackCount: 1, range: { x1: 10, x2: 350, y1: -75, y2: 30 }, windup: 0, hitAt: 0.3, total: 0.7,
    effectDelay: 100, effect: [[56, 92], [56, 91], [56, 89], [57, 88], [35, 66]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hit: [[76, 75], [64, 69], [66, 68], [68, 67], [70, 66], [52, 60]].map(function (a) { return { ox: a[0], oy: a[1] }; }), hitDelay: 110,
    ball: { speed: 800, origin: [[46, 19], [48, 20], [45, 20]], delay: 120, startY: 30 },
    mobFx: [[13, 18], [14, 18], [17, 20], [19, 20], [16, 18]], mobFxDelay: 70
  };

	var HT = ['hunter'];
	  
	  SKILLS.htBowMastery = passive({
		id: 'htBowMastery', cls: 'archer', branches: HT, job: 2, skillId: 3100000, name: 'Bow Mastery', maxLevel: 20, icon: 'assets/skill/ht_bow_mastery_icon.png',
		fx: function (x) { return { mastery: (10 + 2 * x) / 100 }; },
		info: function (x) { return $t('Maestría {0}% (daño mínimo = {0}% del máximo)', 10 + 2 * x); }
	  });

	  SKILLS.htFinalAttack = passive({
		id: 'htFinalAttack', cls: 'archer', branches: HT, job: 2, skillId: 3100001, name: 'Final Attack', maxLevel: 20, icon: 'assets/skill/ht_final_attack_icon.png', req: { htBowMastery: 3 },
		finalAttack: true, prop: function (x) { return 2 * x; }, damage: function (x) { return 100 + 5 * Math.floor(x / 2); },
		info: function (x) { return $t('Tras un ataque normal: {0}% de golpe extra de {1}%', this.prop(x), this.damage(x)); },
		dir: 'assets/skill/ht_final_attack/', hit: [{ ox: 47, oy: 49 }, { ox: 53, oy: 57 }, { ox: 55, oy: 53 }], hitDelay: 50
	  });

	  SKILLS.htPhysicalTraining = passive({
		id: 'htPhysicalTraining', cls: 'archer', branches: HT, job: 2, skillId: 3100006, name: 'Physical Training', maxLevel: 10, icon: 'assets/skill/ht_physical_training_icon.png',
		fx: function (x) { return { pStr: 3 * x, pDex: 3 * x }; },
		info: function (x) { return $t('STR y DEX +{0}', 3 * x); }
	  });

	  SKILLS.htBowBooster = {
		id: 'htBowBooster', cls: 'archer', branches: HT, job: 2, skillId: 3101002, name: 'Bow Booster', maxLevel: 20, buff: 'bowBooster', req: { htBowMastery: 5 },
		icon: 'assets/skill/ht_bow_booster_icon.png', dir: 'assets/skill/ht_bow_booster/',
		mods: function () { return { atkSpeed: 0.25 }; }, duration: function (x) { return 10 * x; }, mpCon: function (x) { return 31 - x; }, renewAt: 5,
		info: function (x) { return $t('Velocidad de ataque +25% · {0} s', this.duration(x)); },
		hitAt: 0.25, total: 0.6, effectDelay: 90,
		effect: [[23, 50], [32, 57], [46, 72], [49, 69], [47, 66], [38, 66], [32, 70], [29, 71], [24, 69], [21, 64], [-8, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; })
	  };

	  SKILLS.htFlashJump = {
		id: 'htFlashJump', cls: 'archer', branches: HT, job: 2, skillId: 3101003, name: 'Flash Jump', maxLevel: 5, teleportSkill: true, leap: true,
		icon: 'assets/skill/ht_flash_jump_icon.png', dir: 'assets/skill/ht_flash_jump/',
		mpCon: function (x) { return 30 - 2 * eq(x, 10, 5); }, dist: function (x) { return 80 + 5 * eq(x, 10, 5); }, vert: function (x) { return 90; }, cooldown: 1.0, fjLift: -480, fjDur: 0.22,   // Flash Jump (arquero): salta y en el aire da el impulso: MÁS ALTURA que alcance
		info: function (x) { return $t('Salta y da un 2º impulso en el aire: +{0} px al frente y mucha altura extra · MP {1}', this.dist(x), this.mpCon(x)); },
		effectDelay: 120,
		effect: [[0, 0], [48, 85], [39, 83], [40, 80], [38, 75], [-37, 59]].map(function (a) { return { ox: a[0], oy: a[1] }; })
	  };
	  
	  SKILLS.htArrowBomb = {
		id: 'htArrowBomb', cls: 'archer', branches: HT, job: 2, skillId: 3101005, name: 'Arrow Bomb', maxLevel: 20, action: 'shoot1', 
		ball: true, splash: true,
		icon: 'assets/skill/ht_arrow_bomb_icon.png', dir: 'assets/skill/ht_arrow_bomb/',
		damage: function (x) { return 260 + 5 * x; }, 
		mpCon: function (x) { return 14 + Math.floor(x / 2); },
		stunProp: function (x) { return 20 + 2 * x; },
		stunTime: function (x) { return 2 + Math.floor(x / 5); },
		mobCount: 1,           
		splashCount: 6,        
		attackCount: 1,
		range: { x1: 10, x2: 400, y1: -75, y2: 30 },
		splashRange: { x1: -150, x2: 150, y1: -100, y2: 100 }, 
		windup: 0, hitAt: 0.3, total: 0.7,
		effect: [{ ox: 0, oy: 0 }],   // <-- Fotograma fantasma para evitar el crash del render
		effectDelay: 700,             // <-- Retraso alto para que cubra toda la animación de disparo
		hit: [[67, 61], [60, 56], [83, 72], [99, 85], [119, 96], [79, 96], [94, 88], [119, 119], [129, 138]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
		hitDelay: 90,
		ball: { speed: 1000, origin: [[29, 5]], delay: 100, startY: 30 },
		mobFx: [[33, 9], [29, 9], [28, 9]], // <-- Arreglo directo de coordenadas para el espiral de Stun
		mobFxDelay: 100
	  };
	  
	  SKILLS.htSoulArrow = passive({
		id: 'htSoulArrow', cls: 'archer', branches: HT, job: 2, skillId: 3101004, name: 'Soul Arrow', maxLevel: 10, 
		icon: 'assets/skill/ht_soul_arrow_icon.png', dir: 'assets/skill/ht_soul_arrow/', // <--- LÍNEA AGREGADA
		req: { htBowBooster: 5 },
		soulArrow: true, 
		prop: function (x) { return Math.floor(10 + x); },
		damage: function (x) { return 120 + 5 * x; },
		mobCount: 4,
		info: function (x) { return $t('Al atacar: {0}% de chance de disparar flechas de alma extra a {1} enemigos ({2}% de daño)', this.prop(x), this.mobCount, this.damage(x)); },
		ball: { speed: 1000, origin: [[34, 13], [31, 13]], delay: 90, startY: 30 }
	  });
	  
	  SKILLS.htHawk = {
		id: 'htHawk', cls: 'archer', branches: HT, job: 2, skillId: 3101007, name: 'Hawk', maxLevel: 15, action: 'alert',
		summon: true,
		icon: 'assets/skill/ht_hawk_icon.png', dir: 'assets/skill/ht_hawk/',
		damage: function (x) { return 150 + 8 * x; },
		mpCon: function (x) { return 20 + 6 * Math.floor(x / 4); },
		duration: function (x) { return 90 + 6 * x; },
		prop: function (x) { return 30 + 4 * x; },
		mobCount: 1, 
		range: { x1: -200, x2: 200, y1: -150, y2: 150 }, 
		windup: 0, hitAt: 0.3, total: 0.7, 
		effect: [{ ox: 0, oy: 0 }], effectDelay: 700, 
		hit: [[24, 56], [21, 32], [29, 38], [21, 41], [1, 109], [4, 84]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
		hitDelay: 90,
		mobFx: [[33, 9], [29, 9], [28, 9]],
		mobFxDelay: 100,
		// NUEVO: Datos para el renderizado visual
		summonAnim: {
		  fly: [[70, 137], [52, 143], [39, 168], [36, 179], [33, 216]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
		  stand: [[65, 143], [47, 144], [33, 165], [30, 177], [27, 221]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
		  attack: [[63, 141], [0, 0]].map(function (a) { return { ox: a[0], oy: a[1] }; })
		},
		animDelay: 90 // ms por fotograma estándar
	  };
	  
	  var AS = ['assassin'];

  SKILLS.asClawMastery = passive({
    id: 'asClawMastery', cls: 'thief', branches: AS, job: 2, skillId: 4100000, name: 'Claw Mastery', maxLevel: 20, icon: 'assets/skill/as_claw_mastery_icon.png',
    fx: function (x) { return { mastery: (10 + 2 * x) / 100 }; },
    info: function (x) { return $t('Maestría {0}% (daño mínimo = {0}% del máximo)', 10 + 2 * x); }
  });

  SKILLS.asCriticalThrow = passive({
    id: 'asCriticalThrow', cls: 'thief', branches: AS, job: 2, skillId: 4100001, name: 'Critical Throw', maxLevel: 30, icon: 'assets/skill/as_critical_throw_icon.png', req: { asClawMastery: 3 },
    fx: function (x) { return { crit: (5 + 3 * Math.floor(x / 2)) / 100, critDmg: Math.ceil(x / 2) / 100 }; },
    info: function (x) { return $t('Probabilidad de crítico +{0}% · Daño crítico +{1}%', 5 + 3 * Math.floor(x / 2), Math.ceil(x / 2)); }
  });

  SKILLS.asPhysicalTraining = passive({
    id: 'asPhysicalTraining', cls: 'thief', branches: AS, job: 2, skillId: 4100007, name: 'Physical Training', maxLevel: 10, icon: 'assets/skill/as_physical_training_icon.png',
    fx: function (x) { return { pLuk: 3 * x, pDex: 3 * x }; },
    info: function (x) { return $t('LUK y DEX +{0}', 3 * x); }
  });

  SKILLS.asClawBooster = {
    id: 'asClawBooster', cls: 'thief', branches: AS, job: 2, skillId: 4101003, name: 'Claw Booster', maxLevel: 20, buff: 'clawBooster', req: { asClawMastery: 5 },
    icon: 'assets/skill/as_claw_booster_icon.png', dir: 'assets/skill/as_claw_booster/',
    mods: function () { return { atkSpeed: 0.25 }; }, duration: function (x) { return 10 * x; }, mpCon: function (x) { return 31 - x; }, renewAt: 5,
    info: function (x) { return $t('Velocidad de ataque +25% · {0} s', this.duration(x)); },
    hitAt: 0.25, total: 0.6, effectDelay: 90,
    effect: [[23, 50], [32, 57], [46, 72], [49, 69], [47, 66], [38, 66], [32, 70], [29, 71], [24, 69], [21, 64], [-8, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  SKILLS.asFlashJump = {
    id: 'asFlashJump', cls: 'thief', branches: AS, job: 2, skillId: 4101009, name: 'Flash Jump', maxLevel: 5, teleportSkill: true, leap: true,
    icon: 'assets/skill/as_flash_jump_icon.png', dir: 'assets/skill/as_flash_jump/', // Usar las imágenes del arquero si no extrajiste las del thief
    mpCon: function (x) { return 42 - 2 * eq(x, 10, 5); }, dist: function (x) { return 140 + 9 * eq(x, 10, 5); }, vert: function (x) { return 90; }, cooldown: 1.0, fjLift: -160, fjDur: 0.28,   // Flash Jump (thief): salta y en el aire da el impulso: MÁS ALCANCE que altura
    info: function (x) { return $t('Salta y se impulsa en el aire: +{0} px al frente · MP {1}', this.dist(x), this.mpCon(x)); }
  };

  SKILLS.asShurikenBurst = {   // 4101008: WZ ball 3 frames + effect 7 frames (origins del WZ)
    id: 'asShurikenBurst', cls: 'thief', branches: AS, job: 2, skillId: 4101008, name: 'Shuriken Burst', maxLevel: 20,
    action: 'shurikenBurst', splash: true,
    icon: 'assets/skill/as_shuriken_burst_icon.png', dir: 'assets/skill/as_shuriken_burst/',
    damage: function (x) { return 200 + 6 * x; },
    mpCon: function (x) { return 12 + Math.floor(x / 3); },
    mobCount: 1, splashCount: 4, attackCount: 1,
    range: { x1: 10, x2: 400, y1: -100, y2: 40 },
    splashRange: { x1: -170, x2: 80, y1: -100, y2: 40 },
    windup: 0, hitAt: 0.14, total: 0.42,
    effect: [[57, 106], [52, 103], [46, 96], [105, 73], [162, 71], [176, 65], [32, 48]].map(function (a) { return { ox: a[0], oy: a[1] }; }), effectDelay: 60,
    hit: [[54, 66], [62, 70], [68, 72], [70, 77], [69, 79], [47, 88]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90,
    ball: { speed: 1000, origin: [[41, 32], [39, 33], [39, 33]], delay: 90, startY: 30 }
  };

  SKILLS.asGustCharm = {   // 4101010: talismán (effect 11 frames) + viento perforante (ball 3 frames) que empuja a los enemigos que atraviesa
    id: 'asGustCharm', cls: 'thief', branches: AS, job: 2, skillId: 4101010, name: 'Gust Charm', maxLevel: 15,
    action: 'windTalisman', pierce: true, pushDist: 150, pushTime: 0.35,
    icon: 'assets/skill/as_gust_charm_icon.png', dir: 'assets/skill/as_gust_charm/',
    damage: function (x) { return 201 + 4 * x; },
    mpCon: function (x) { return 14 + Math.ceil(x / 3); },
    mobCount: 4, attackCount: 1,
    range: { x1: 10, x2: 350, y1: -80, y2: 60 },
    windup: 0, hitAt: 0.42, total: 0.85,
    effect: [[139, 97], [193, 110], [189, 116], [187, 117], [186, 118], [147, 119], [240, 133], [259, 132], [262, 114], [247, 69], [94, 46]].map(function (a) { return { ox: a[0], oy: a[1] }; }), effectDelay: 70,
    ball: { speed: 700, origin: [[64, 54], [62, 57], [60, 58]], delay: 120, startY: 30 },
    hit: [[56, 77], [49, 76], [49, 59], [50, 53], [51, 55]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90
  };

  SKILLS.asMark = passive({
    id: 'asMark', cls: 'thief', branches: AS, job: 2, skillId: 4101011, name: 'Assassin\'s Mark', maxLevel: 1, hidden: true, free: true,
    icon: 'assets/skill/as_mark_icon.png', dir: 'assets/skill/as_mark/',
    prop: function (x) { return 40; }, damage: function (x) { return 30; }, markTime: 20, armTime: 0.4,
    mobCount: 2, bulletCount: 2, range: 1000,
    info: function (x) { return $t('Marca a los enemigos con 40% de chance. Al golpear a un enemigo marcado, dispara {0} estrellas a {1} enemigos cercanos ({2}% daño).', this.bulletCount, this.mobCount, this.damage(x)); },
    mobFx: [[23, 45], [23, 45], [23, 46], [22, 47], [23, 47], [23, 45], [23, 44], [22, 43]],
    mobFxDelay: 90
  });
  
  var BW = ['brawler'];

  SKILLS.bwKnuckleMastery = passive({
    id: 'bwKnuckleMastery', cls: 'pirate', branches: BW, job: 2, skillId: 5100001, name: 'Knuckle Mastery', maxLevel: 20, icon: 'assets/skill/bw_knuckle_mastery_icon.png',
    fx: function (x) { return { mastery: (10 + 2 * x) / 100 }; }, // 10+2*x
    info: function (x) { return $t('Maestría {0}% (daño mínimo = {0}% del máximo)', 10 + 2 * x); }
  });

  SKILLS.bwPhysicalTraining = passive({
    id: 'bwPhysicalTraining', cls: 'pirate', branches: BW, job: 2, skillId: 5100010, name: 'Physical Training', maxLevel: 10, icon: 'assets/skill/bw_physical_training_icon.png',
    fx: function (x) { return { pStr: 3 * x, pDex: 3 * x }; }, // 3*x[cite: 21]
    info: function (x) { return $t('STR y DEX +{0}', 3 * x); }
  });

  SKILLS.bwPerseverance = passive({
    id: 'bwPerseverance', cls: 'pirate', branches: BW, job: 2, skillId: 5100013, name: 'Perseverance', maxLevel: 10, icon: 'assets/skill/bw_perseverance_icon.png',
    // Recupera HP/MP adicional con el tiempo. Lo ligaremos más adelante en stepExtras.
    fx: function (x) { return { hpRec: Math.ceil(x / 2), mpRec: Math.ceil(x / 2), recT: 15 - x }; },   // cada (15-x) s recupera ceil(x/2)% del HP y MP máximos
    info: function (x) { return $t('Recupera +{0}% extra de HP/MP cada {1}s.', Math.ceil(x / 2), 15 - x); }
  });

  SKILLS.bwKnuckleBooster = {
    id: 'bwKnuckleBooster', cls: 'pirate', branches: BW, job: 2, skillId: 5101006, name: 'Knuckle Booster', maxLevel: 20, buff: 'knuckleBooster', req: { bwKnuckleMastery: 5 },
    icon: 'assets/skill/bw_knuckle_booster_icon.png', dir: 'assets/skill/bw_knuckle_booster/',
    mods: function () { return { atkSpeed: 0.25 }; }, duration: function (x) { return 10 * x; }, mpCon: function (x) { return 31 - x; }, renewAt: 5, // 10*x, 31-1*x[cite: 21]
    info: function (x) { return $t('Velocidad de ataque +25% · {0} s', this.duration(x)); },
    hitAt: 0.25, total: 0.6, effectDelay: 90,
    effect: [[23, 50], [32, 57], [46, 72], [49, 69], [47, 66], [38, 66], [32, 70], [29, 71], [24, 69], [21, 64], [-8, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; }) //[cite: 21]
  };

  SKILLS.bwDarkClarity = {
    id: 'bwDarkClarity', cls: 'pirate', branches: BW, job: 2, skillId: 5101011, name: 'Dark Clarity', maxLevel: 20, buff: 'darkClarity',
    icon: 'assets/skill/bw_dark_clarity_icon.png', dir: 'assets/skill/bw_dark_clarity/',
    mods: function (x) { return { att: x + Math.floor(x / 2) }; }, duration: function (x) { return 60 + 6 * x; }, mpCon: function (x) { return 14 + Math.ceil(x / 2); }, renewAt: 5, // x+d(x/2), 60+6*x, 14+u(x/2)[cite: 21]
    info: function (x) { return $t('ATT +{0} · {1} s', x + Math.floor(x / 2), this.duration(x)); },
    hitAt: 0.3, total: 0.7, effectDelay: 120,
    effect: [[79, 134], [92, 134], [96, 133], [95, 129], [91, 117], [80, 103], [57, 84], [31, 62], [81, 114], [70, 102], [72, 102], [73, 99], [74, 93], [58, 88], [55, 86]].map(function (a) { return { ox: a[0], oy: a[1] }; }) //[cite: 21]
  };

  SKILLS.bwCorkscrewBlow = {
    id: 'bwCorkscrewBlow', cls: 'pirate', branches: BW, job: 2, skillId: 5101004, name: 'Corkscrew Blow', maxLevel: 20, action: 'screw',
    casterMove: true, pushTarget: true, pushDist: 200, pushTime: 0.4, 
    comboOnly: true, // <--- PROPIEDAD NUEVA: Exclusivo de combos
    icon: 'assets/skill/bw_corkscrew_blow_icon.png', dir: 'assets/skill/bw_corkscrew_blow/',
    damage: function (x) { return 280 + 4 * x; }, mpCon: function (x) { return 10 + Math.floor(x / 2); }, // 280+4*x, 10+d(x/2)[cite: 21]
    mobCount: 6, attackCount: 1, range: { x1: 5, x2: 200, y1: -50, y2: 0 }, // lt/rb -200,-50[cite: 21]
    windup: 0, hitAt: 0.2, total: 0.6,
    effectDelay: 120, effect: [[191, 70], [191, 67], [192, 68], [191, 62], [191, 58], [191, 37]].map(function (a) { return { ox: a[0], oy: a[1] }; }), //[cite: 21]
    hitDelay: 60, hit: [[88, 65], [118, 48], [70, 50], [70, 51], [68, 52], [34, 5]].map(function (a) { return { ox: a[0], oy: a[1] }; }) //[cite: 21]
  };

  SKILLS.bwTornadoUppercut = {
    id: 'bwTornadoUppercut', cls: 'pirate', branches: BW, job: 2, skillId: 5101012, name: 'Tornado Uppercut', maxLevel: 20, action: 'tornadoUpper',
    pierce: true, pushTarget: true, pushDist: 150, pushTime: 0.35, 
    comboOnly: true, // <--- PROPIEDAD NUEVA: Exclusivo de combos
    icon: 'assets/skill/bw_tornado_uppercut_icon.png', dir: 'assets/skill/bw_tornado_uppercut/',
    damage: function (x) { return 315 + 3 * x; }, mpCon: function (x) { return 16 + 2 * Math.ceil(x / 5); }, 
    mobCount: 6, attackCount: 1, range: { x1: 5, x2: 350, y1: -90, y2: 5 }, 
    windup: 0, hitAt: 0.3, total: 0.7,
    effectDelay: 90, effect: [[64, 91], [64, 95], [54, 97], [45, 97], [28, 48], [23, 48], [77, 125], [74, 130], [65, 132], [-12, 34], [-22, 37], [-29, 24]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90, hit: [[47, 71], [52, 49], [60, 56], [65, 52], [67, 53], [67, 55], [3, 4]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    // CORRECCIÓN: El tornado usa ball pero en modo pierce (avanza empujando, no busca enemigos)
    ball: { speed: 800, origin: [[67, 180], [74, 177], [76, 180]], delay: 90, startY: 0 } 
  };
  
  /* ---------- Thief: Bandit (420.img) ---------- */
  var BD = ['bandit'];

  SKILLS.bdDaggerMastery = passive({
    id: 'bdDaggerMastery', cls: 'thief', branches: BD, job: 2, skillId: 4200000, name: 'Dagger Mastery', maxLevel: 20, icon: 'assets/skill/bd_dagger_mastery_icon.png',
    fx: function (x) { return { mastery: (10 + 2 * x) / 100 }; },
    info: function (x) { return $t('Maestría {0}% (daño mínimo = {0}% del máximo)', 10 + 2 * x); }
  });

  SKILLS.bdPhysicalTraining = passive({
    id: 'bdPhysicalTraining', cls: 'thief', branches: BD, job: 2, skillId: 4200007, name: 'Physical Training', maxLevel: 10, icon: 'assets/skill/bd_physical_training_icon.png',
    fx: function (x) { return { pLuk: 3 * x, pDex: 3 * x }; },
    info: function (x) { return $t('LUK y DEX +{0}', 3 * x); }
  });

  SKILLS.bdShieldMastery = passive({
    id: 'bdShieldMastery', cls: 'thief', branches: BD, job: 2, skillId: 4200010, name: 'Shield Mastery', maxLevel: 10, icon: 'assets/skill/bd_shield_mastery_icon.png',
    fx: function (x) { return { def: 11 * x }; }, 
    info: function (x) { return $t('Al llevar escudo: Defensa (DEF) +{0} (Efecto aplicado de forma permanente por ahora).', 11 * x); }
  });

  SKILLS.bdDaggerBooster = {
    id: 'bdDaggerBooster', cls: 'thief', branches: BD, job: 2, skillId: 4201002, name: 'Dagger Booster', maxLevel: 20, buff: 'daggerBooster', req: { bdDaggerMastery: 5 },
    icon: 'assets/skill/bd_dagger_booster_icon.png', dir: 'assets/skill/bd_dagger_booster/',
    mods: function () { return { atkSpeed: 0.25 }; }, duration: function (x) { return 10 * x; }, mpCon: function (x) { return 30 - x; }, renewAt: 5,
    info: function (x) { return $t('Velocidad de ataque +25% · {0} s', this.duration(x)); },
    hitAt: 0.25, total: 0.6, effectDelay: 90,
    effect: [[23, 50], [32, 57], [46, 72], [49, 69], [47, 66], [38, 66], [32, 70], [29, 71], [24, 69], [21, 64], [-8, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  SKILLS.bdSteal = passive({
    id: 'bdSteal', cls: 'thief', branches: BD, job: 2, skillId: 4201004, name: 'Steal (Pasiva)', maxLevel: 15,
    icon: 'assets/skill/bd_steal_icon.png',
    dir: 'assets/skill/bd_steal/',
    prop: function (x) { return 3 * x; },
    damage: function (x) { return 290 + 4 * x; },
    splash: true, splashCount: 4,
    splashRange: { x1: -100, x2: 100, y1: -80, y2: 80 },
    splashFalloff: 0.7,
    info: function (x) { return $t('Al atacar, hay {0}% de probabilidad de asestar un ataque Steal extra ({1}% daño, con salpicadura a enemigos cercanos). Si acierta el robo (30% chance), obtienes ATT +30 por 60 s.', this.prop(x), this.damage(x)); },
    effectDelay: 110,
    effect: [[5, 37], [-9, 40], [-14, 45], [-14, 47]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effect0: [[25, 62], [41, 59], [197, 49], [271, 59], [272, 58], [272, 58]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90,
    hit: [[76, 47], [66, 49], [60, 46], [39, 8]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  });

  SKILLS.bdFlashJump = {
    id: 'bdFlashJump', cls: 'thief', branches: BD, job: 2, skillId: 4201008, name: 'Flash Jump', maxLevel: 5, teleportSkill: true, leap: true,
    icon: 'assets/skill/bd_flash_jump_icon.png', dir: 'assets/skill/as_flash_jump/', // Usamos los efectos que extrajiste previamente del Assassin
    mpCon: function (x) { return 42 - 2 * x; }, dist: function (x) { return 140 + 9 * eq(x, 10, 5); }, vert: function (x) { return 90; }, cooldown: 1.0, fjLift: -160, fjDur: 0.28,
    info: function (x) { return $t('Salta y se impulsa en el aire: +{0} px al frente · MP {1}', this.dist(x), this.mpCon(x)); }
  };

  SKILLS.bdChannelKarma = {
    id: 'bdChannelKarma', cls: 'thief', branches: BD, job: 2, skillId: 4201009, name: 'Channel Karma', maxLevel: 20, buff: 'channelKarma',
    icon: 'assets/skill/bd_channel_karma_icon.png', dir: 'assets/skill/bd_channel_karma/',
    mods: function (x) { return { att: 30 }; }, // Simplificado para que otorgue +30 ATT (el original escala distinto pero mantendremos este valor fuerte)
    duration: function (x) { return 60 + 6 * x; }, mpCon: function (x) { return 15; }, renewAt: 5,
    info: function (x) { return $t('Poder de Ataque (ATT) +30 · {0} s', this.duration(x)); },
    hitAt: 0.3, total: 0.8, effectDelay: 90,
    effect: [[27, 165], [36, 178], [39, 207], [92, 220], [93, 230], [93, 231], [93, 231], [93, 231], [93, 231], [93, 230], [92, 228], [88, 225], [80, 216], [82, 215], [84, 212], [84, 208], [66, 207], [63, 204], [49, 196], [46, 193], [24, 171]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  SKILLS.bdSavageBlow = {
    id: 'bdSavageBlow', cls: 'thief', branches: BD, job: 2, skillId: 4201012, name: 'Savage Blow', maxLevel: 20, action: 'swingO2',
    icon: 'assets/skill/bd_savage_blow_icon.png', dir: 'assets/skill/bd_savage_blow/',
    damage: function (x) { return 132 + 3 * x; }, mpCon: function (x) { return 25 + Math.floor(x / 4); }, 
    // CORRECCIÓN: Actualizado a los datos del WZ (Ataque de área: 8 enemigos, 3 golpes)
    mobCount: 8, attackCount: 3, 
    range: { x1: 5, x2: 330, y1: -130, y2: 10 }, 
    windup: 0, hitAt: 0.3, total: 0.8,
    effectDelay: 90, effect: [[0, 0], [239, 175], [334, 172], [333, 142], [317, 123], [317, 154], [359, 132], [348, 165], [342, 161], [333, 152], [317, 141]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90, hit: [[52, 69], [68, 60], [68, 56], [63, 53]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };
  
  /* ---------- Mage: Wizard (Ice/Lightning) (220.img) ---------- */
  var IL = ['wizardIL'];
  
  // Clonamos las habilidades compartidas desde el Fire/Poison (fp)
  cloneJob2(SKILLS.fpMpEater, 'ilMpEater', 'wizardIL', 2200000, 'il', 'fp', { icon: 'assets/skill/fp_mp_eater_icon.png' });
  cloneJob2(SKILLS.fpSpellMastery, 'ilSpellMastery', 'wizardIL', 2200006, 'il', 'fp', { icon: 'assets/skill/fp_spell_mastery_icon.png' });
  cloneJob2(SKILLS.fpHighWisdom, 'ilHighWisdom', 'wizardIL', 2200007, 'il', 'fp', { icon: 'assets/skill/fp_high_wisdom_icon.png' });
  cloneJob2(SKILLS.fpMeditate, 'ilMeditate', 'wizardIL', 2201001, 'il', 'fp', { icon: 'assets/skill/fp_meditate_icon.png', dir: 'assets/skill/fp_meditate/' });
  cloneJob2(SKILLS.fpMagicBooster, 'ilMagicBooster', 'wizardIL', 2201010, 'il', 'fp', { icon: 'assets/skill/fp_magic_booster_icon.png', dir: 'assets/skill/fp_magic_booster/' });

  // Pasiva automática de Congelación
  SKILLS.ilFreezingCrush = passive({
    id: 'ilFreezingCrush', cls: 'mage', branches: IL, job: 2, skillId: 2200011, name: 'Freezing Crush', maxLevel: 1, hidden: true, free: true,
    icon: 'assets/skill/il_freezing_crush_icon.png', dir: 'assets/skill/il_freezing_crush/',
    info: function (x) { return $t('Los ataques de hielo aplican marcas. Los ataques de rayo consumen las marcas infligiendo +8% de daño por carga (máx 5).'); },
    mobFxDelay: 120, // Animación a 120ms según el WZ
    mobFx: [
      [[21, 29], [29, 30], [31, 31], [31, 30], [27, 29], [27, 28]].map(function(a){ return {ox: a[0], oy: a[1]}; }), // Carga 1
      [[21, 29], [29, 30], [31, 31], [31, 30], [27, 29], [27, 28]].map(function(a){ return {ox: a[0], oy: a[1]}; }), // Carga 2
      [[21, 29], [29, 30], [31, 31], [31, 30], [27, 29], [27, 28]].map(function(a){ return {ox: a[0], oy: a[1]}; }), // Carga 3
      [[21, 29], [29, 30], [31, 31], [31, 30], [27, 29], [27, 28]].map(function(a){ return {ox: a[0], oy: a[1]}; }), // Carga 4
      [[21, 29], [29, 30], [31, 31], [31, 30], [27, 29], [27, 28]].map(function(a){ return {ox: a[0], oy: a[1]}; })  // Carga 5
    ]
  });

  // Cold Beam: Daño directo y congela
  SKILLS.ilColdBeam = {
    id: 'ilColdBeam', cls: 'mage', branches: IL, job: 2, skillId: 2201008, name: 'Cold Beam', maxLevel: 20, action: 'swingO2', 
    elemAttr: 'i', // <-- ATRIBUTO HIELO
    icon: 'assets/skill/il_cold_beam_icon.png', dir: 'assets/skill/il_cold_beam/',
    damage: function (x) { return 110 + 3 * x; }, mpCon: function (x) { return 12 + 3 * Math.floor(x / 4); }, 
    mobCount: 6, attackCount: 3, range: { x1: 5, x2: 300, y1: -180, y2: 5 }, 
    freezeTime: function (x) { return 8; }, // Congela por 8 segundos
    windup: 0, hitAt: 0.3, total: 0.8,
    effectDelay: 90, effect: [[190, 203], [193, 207], [337, 211], [344, 212], [346, 214], [347, 215], [334, 171], [336, 121], [339, 109], [328, 87], [331, 85], [333, 83], [277, 79]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effect0: [[24, 96], [37, 115], [37, 126], [34, 139], [34, 147], [34, 149], [85, 203], [72, 192], [71, 187], [71, 186], [59, 181]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90, hit: [[87, 84], [66, 84], [59, 88], [67, 90], [71, 88]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  // Thunderbolt: Ataque de área
  SKILLS.ilThunderbolt = {
    id: 'ilThunderbolt', cls: 'mage', branches: IL, job: 2, skillId: 2201005, name: 'Thunderbolt', maxLevel: 20, action: 'alert',
    elemAttr: 'l', // <-- ATRIBUTO RAYO
    icon: 'assets/skill/il_thunderbolt_icon.png', dir: 'assets/skill/il_thunderbolt/',
    damage: function (x) { return 70 + 3 * x; }, mpCon: function (x) { return 20 + 5 * Math.floor(x / 4); }, 
    mobCount: 6, attackCount: 3, range: { x1: -250, x2: 250, y1: -50, y2: 50 }, 
    windup: 0, hitAt: 0.3, total: 0.8,
    effectDelay: 75, effect: [[85, 90], [86, 90], [86, 110], [77, 110], [67, 101], [65, 89], [65, 89]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 70, hit: [[14, 200], [33, 200], [32, 200], [33, 200], [32, 200], [33, 200], [36, 200]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };
  
  /* ---------- Mage: Cleric (230.img) ---------- */
  var CR = ['cleric'];

  // Clonamos las habilidades compartidas desde el Fire/Poison (fp)
  cloneJob2(SKILLS.fpMpEater, 'crMpEater', 'cleric', 2300000, 'cr', 'fp', { icon: 'assets/skill/fp_mp_eater_icon.png' });
  cloneJob2(SKILLS.fpSpellMastery, 'crSpellMastery', 'cleric', 2300006, 'cr', 'fp', { icon: 'assets/skill/fp_spell_mastery_icon.png' });
  cloneJob2(SKILLS.fpHighWisdom, 'crHighWisdom', 'cleric', 2300007, 'cr', 'fp', { icon: 'assets/skill/fp_high_wisdom_icon.png' });
  cloneJob2(SKILLS.fpMagicBooster, 'crMagicBooster', 'cleric', 2301008, 'cr', 'fp', { icon: 'assets/skill/fp_magic_booster_icon.png', dir: 'assets/skill/fp_magic_booster/' });

  // Heal: Cura al party y daña exclusivamente a enemigos Undead
  SKILLS.crHeal = {
    id: 'crHeal', cls: 'mage', branches: CR, job: 2, skillId: 2301002, name: 'Heal', maxLevel: 20, action: 'alert',
    healSkill: true, // <-- Marca especial para la IA
    icon: 'assets/skill/cr_heal_icon.png', dir: 'assets/skill/cr_heal/',
    damage: function (x) { return 250 + 8 * x; }, mpCon: function (x) { return 12 + 6 * Math.ceil(x / 10); },
    hpHeal: function (x) { return 15 * x; }, // Porcentaje del HP máximo a recuperar
    mobCount: 6, attackCount: 1, range: { x1: -300, x2: 300, y1: -200, y2: 200 },
    elemAttr: 'h', // Holy (Sagrado)
    windup: 0, hitAt: 0.3, total: 0.8,
    effectDelay: 120, effect: [[14, 11], [22, 16], [26, 19], [32, 96], [29, 105], [27, 121], [21, 129], [18, 129]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 150, hit: [[41, 44], [36, 33], [40, 33], [46, 38], [50, 41]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  // Invincible: Reduce daño físico
  SKILLS.crInvincible = {
    id: 'crInvincible', cls: 'mage', branches: CR, job: 2, skillId: 2301003, name: 'Invincible', maxLevel: 10, buff: 'invincible', req: { crHeal: 5 },
    icon: 'assets/skill/cr_invincible_icon.png', dir: 'assets/skill/cr_invincible/',
    mods: function (x) { return { physReduce: 5 + x }; }, duration: function (x) { return 20 * x; }, mpCon: function (x) { return 15 + 3 * Math.floor(x / 3); }, renewAt: 10,
    info: function (x) { return $t('Reduce el daño físico recibido un {0}% · {1} s', this.mods(x).physReduce, this.duration(x)); },
    hitAt: 0.3, total: 0.8, effectDelay: 100,
    effect: [[23, 6], [28, 9], [28, 166], [28, 170], [66, 171], [69, 174], [67, 168], [66, 167], [66, 168], [76, 159], [89, 173]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  // Bless: Buff para todo el party (Ajustado a Max Level 10, Stats equivalentes al Lv15)
  SKILLS.crBless = {
    id: 'crBless', cls: 'mage', branches: CR, job: 2, skillId: 2301004, name: 'Bless', maxLevel: 10, buff: 'bless', party: true, req: { crInvincible: 5 },
    icon: 'assets/skill/cr_bless_icon.png', dir: 'assets/skill/cr_bless/',
    // Escalado comprimido en 10 niveles para dar los stats máximos: 15 ATT, 300 DEF, 180 EVA
    mods: function (x) { return { def: 30 * x, eva: 18 * x, att: Math.floor(1.5 * x), matt: Math.floor(1.5 * x) }; }, 
    duration: function (x) { return 24 * x; }, 
    mpCon: function (x) { return 10 + Math.floor(1.5 * x); }, renewAt: 10,
    info: function (x) { return $t('DEF +{0}, EVA +{1}, ATT/MATT +{2} al party · {3} s', 30 * x, 18 * x, Math.floor(1.5 * x), this.duration(x)); },
    hitAt: 0.3, total: 0.8, effectDelay: 120,
    effect: [[18, 11], [26, 16], [32, 22], [31, 24], [70, 191], [65, 191], [59, 189], [49, 184], [48, 133], [48, 123]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  // Holy Arrow: Proyectil base
  SKILLS.crHolyArrow = {
    id: 'crHolyArrow', cls: 'mage', branches: CR, job: 2, skillId: 2301005, name: 'Holy Arrow', maxLevel: 20, action: 'shoot1',
    elemAttr: 'h', ball: true,
    icon: 'assets/skill/cr_holy_arrow_icon.png', dir: 'assets/skill/cr_holy_arrow/',
    damage: function (x) { return 290 + 8 * x; }, mpCon: function (x) { return 12 * Math.ceil(x / 8); },
    mobCount: 3, attackCount: 1, range: { x1: 10, x2: 350, y1: -75, y2: 30 },
    windup: 0, hitAt: 0.3, total: 0.7,
    effectDelay: 100, effect: [[68, 84], [83, 86], [72, 87], [72, 87], [103, 79], [130, 75], [177, 74]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 60, hit: [[52, 60], [54, 63], [55, 64], [50, 59], [50, 59]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    ball: { speed: 800, origin: [[41, 5], [41, 5], [41, 5]], delay: 100, startY: 30 }
  };
  
    /* ---------- Archer: Crossbowman (320.img) ----------
   * Comparte con el Hunter: Final Attack (mismos valores y frames), Physical Training y Flash Jump (idénticos).
   * Propios: Crossbow Mastery, Crossbow Booster, Iron Arrow (piercing) y Net Toss (AoE + stun).
   * `Iron Arrow` usa `pierce: true` (como Gust Charm) con daño completo por enemigo (v83, sin `piercingPenalty`). */
  var CB = ['crossbowman'];

  SKILLS.cbCrossbowMastery = passive({
    id: 'cbCrossbowMastery', cls: 'archer', branches: CB, job: 2, skillId: 3200000, name: 'Crossbow Mastery', maxLevel: 20,
    icon: 'assets/skill/cb_crossbow_mastery_icon.png',
    fx: function (x) { return { mastery: (10 + 2 * x) / 100 }; },
    info: function (x) { return $t('Maestría {0}% (daño mínimo = {0}% del máximo)', 10 + 2 * x); }
  });

  cloneJob2(SKILLS.htFinalAttack, 'cbFinalAttack', 'crossbowman', 3200001, 'cb', 'ht', {
	req: { cbCrossbowMastery: 3 },
    icon: 'assets/skill/cb_final_attack_icon.png',
    dir: 'assets/skill/cb_final_attack/',
    hit: [{ ox: 47, oy: 49 }, { ox: 53, oy: 57 }, { ox: 55, oy: 53 }],
    hitDelay: 50
  });

  cloneJob2(SKILLS.htPhysicalTraining, 'cbPhysicalTraining', 'crossbowman', 3200006, 'cb', 'ht');

  SKILLS.cbCrossbowBooster = {
    id: 'cbCrossbowBooster', cls: 'archer', branches: CB, job: 2, skillId: 3201002, name: 'Crossbow Booster', maxLevel: 20, buff: 'crossbowBooster', req: { cbCrossbowMastery: 5 },
    icon: 'assets/skill/cb_crossbow_booster_icon.png', dir: 'assets/skill/cb_crossbow_booster/',
    mods: function () { return { atkSpeed: 0.25 }; }, duration: function (x) { return 10 * x; }, mpCon: function (x) { return 31 - x; }, renewAt: 5,
    info: function (x) { return $t('Velocidad de ataque +25% · {0} s', this.duration(x)); },
    hitAt: 0.25, total: 0.6, effectDelay: 90,
    effect: [[23, 50], [32, 57], [46, 72], [49, 69], [47, 66], [38, 66], [32, 70], [29, 71], [24, 69], [21, 64], [-8, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  cloneJob2(SKILLS.htFlashJump, 'cbFlashJump', 'crossbowman', 3201003, 'cb', 'ht', {
    dir: 'assets/skill/cb_flash_jump/',
    effect: [[0, 0], [48, 85], [39, 83], [40, 80], [38, 75], [-37, 59]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  });

  SKILLS.cbIronArrow = {
    id: 'cbIronArrow', cls: 'archer', branches: CB, job: 2, skillId: 3201005, name: 'Iron Arrow', maxLevel: 20, action: 'shoot1', pierce: true, ball: true,
    icon: 'assets/skill/cb_iron_arrow_icon.png', dir: 'assets/skill/cb_iron_arrow/',
    damage: function (x) { return 260 + 5 * x; }, mpCon: function (x) { return 18 + 2 * Math.ceil(x / 5); },
    mobCount: 6, attackCount: 1,
    range: { x1: 10, x2: 310, y1: -120, y2: 10 },
    windup: 0, hitAt: 0.3, total: 0.7,
    effect: [[119, 125], [115, 130], [106, 132], [97, 133], [75, 66], [96, 73], [107, 79], [108, 83], [109, 84]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effectDelay: 90,
    hit: [[47, 63], [49, 62], [48, 45], [30, 31]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 100,
    ball: { speed: 900, origin: [[44, 14], [45, 13], [44, 12]], delay: 90, startY: 30 }
  };

  cloneJob2(SKILLS.htHawk, 'cbHawk', 'crossbowman', 3201007, 'cb', 'ht', {
    icon: 'assets/skill/cb_hawk_icon.png',
    dir: 'assets/skill/cb_hawk/',
    summonAnim: {
      fly: [[35, 136], [35, 137], [35, 161], [41, 191], [51, 225]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
      stand: [[68, 146], [48, 146], [44, 165], [43, 177], [42, 221]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
      attack: [[57, 159], [0, 0]].map(function (a) { return { ox: a[0], oy: a[1] }; })
    },
    hit: [[41, 64], [38, 26], [36, 45], [32, 46], [29, 114], [16, 90]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90,
    mobFx: [[33, 9], [29, 9], [28, 9]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    mobFxDelay: 90
  });

  SKILLS.cbNetToss = {
    id: 'cbNetToss', cls: 'archer', branches: CB, job: 2, skillId: 3201008, name: 'Net Toss', maxLevel: 10, action: 'shoot1',
    icon: 'assets/skill/cb_net_toss_icon.png', dir: 'assets/skill/cb_net_toss/',
    damage: function (x) { return 155 + 6 * x; }, mpCon: function (x) { return 12 + 3 * Math.floor(x / 3); },
    stunProp: function () { return 100; }, stunTime: function (x) { return 5 + Math.ceil(x / 2); },
    mobCount: 8, attackCount: 2,
	cooldown: 5,
    range: { x1: 10, x2: 310, y1: -120, y2: 10 },
    windup: 0, hitAt: 0.3, total: 0.8,
    effectDelay: 90,
    effect: [[87, 86], [87, 76], [86, 69], [86, 65], [86, 61], [272, 145], [296, 134], [302, 142], [318, 137], [328, 130], [327, 121]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90,
    hit: [[36, 37], [65, 70], [69, 76], [66, 80], [66, 76]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    mobFx: [[24, 30], [24, 29], [24, 28], [24, 29], [24, 30], [24, 31]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    mobFxDelay: 90
  };
  
    /* ---------- Pirate: Gunslinger (520.img) ----------
   * Comparte con el Brawler: Physical Training (idéntico, clonado).
   * Propios: Gun Mastery, Gun Booster, Triple Shot, Rapid Blast, Wings y Grenade.
   * Cambios personalizados:
   *  - Wings: salto vertical a la plataforma de arriba (cooldown 1 s), en vez de planeo.
   *  - Grenade: pasa a pasiva; 30 % de chance de lanzar granada (140 % daño) al atacar con skill o ataque normal. */
  var GS = ['gunslinger'];

  SKILLS.gsGunMastery = passive({
    id: 'gsGunMastery', cls: 'pirate', branches: GS, job: 2, skillId: 5200000, name: 'Gun Mastery', maxLevel: 20,
    icon: 'assets/skill/gs_gun_mastery_icon.png',
    fx: function (x) { return { mastery: (10 + 2 * x) / 100 }; },
    info: function (x) { return $t('Maestría {0}% (daño mínimo = {0}% del máximo)', 10 + 2 * x); }
  });

  SKILLS.gsGunBooster = {
    id: 'gsGunBooster', cls: 'pirate', branches: GS, job: 2, skillId: 5201003, name: 'Gun Booster', maxLevel: 20, buff: 'gunBooster', req: { gsGunMastery: 5 },
    icon: 'assets/skill/gs_gun_booster_icon.png', dir: 'assets/skill/gs_gun_booster/',
    mods: function () { return { atkSpeed: 0.25 }; }, duration: function (x) { return 10 * x; }, mpCon: function (x) { return 31 - x; }, renewAt: 5,
    info: function (x) { return $t('Velocidad de ataque +25% · {0} s', this.duration(x)); },
    hitAt: 0.25, total: 0.6, effectDelay: 90,
    effect: [[23, 50], [32, 57], [46, 72], [49, 69], [47, 66], [38, 66], [32, 70], [29, 71], [24, 69], [21, 64], [-8, 63]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  cloneJob2(SKILLS.bwPhysicalTraining, 'gsPhysicalTraining', 'gunslinger', 5200009, 'gs', 'bw');

  SKILLS.gsTripleShot = {
    id: 'gsTripleShot', cls: 'pirate', branches: GS, job: 2, skillId: 5200010, name: 'Triple Shot', maxLevel: 20, action: 'triplefire', ranged: true,
    icon: 'assets/skill/gs_triple_shot_icon.png', dir: 'assets/skill/gs_triple_shot/',
    damage: function (x) { return 121 + 3 * x; }, mpCon: function (x) { return 10 + Math.floor(x / 3); },
    bulletCount: 3, mobCount: 1, attackCount: 1, starGap: 0.08, speed: 900,
    range: { x1: 0, x2: 380, y1: -80, y2: 40 },
    windup: 0, hitAt: 0.09, total: 0.9,
    effect: [[50, 50], [96, 38], [63, 47], [96, 49], [63, 47], [96, 49], [63, 47], [66, 53], [64, 50], [0, 0]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effectDelay: 90,
    hit: [[84, 35], [90, 34], [56, 34], [62, 35]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90,
    ball: { speed: 1000, origin: [[16, 8]], delay: 60, startY: 30 },
    fxOffsetY: -24,   // Bajamos de -38 a -24 (sale a la altura del cañón, no de la cara)
    fxOffsetX: 40     // Corremos el effect 10 px hacia donde mira el personaje (hacia la pistola)
  };

  SKILLS.gsRapidBlast = {
    id: 'gsRapidBlast', cls: 'pirate', branches: GS, job: 2, skillId: 5201001, name: 'Rapid Blast', maxLevel: 20, action: 'shot',
    icon: 'assets/skill/gs_rapid_blast_icon.png', dir: 'assets/skill/gs_rapid_blast/',
    damage: function (x) { return 91 + 2 * x; }, mpCon: function (x) { return 8 + 2 * Math.floor(x / 3); },
    mobCount: 4, attackCount: 3,
    range: { x1: 0, x2: 250, y1: -80, y2: 40 },
    windup: 0, hitAt: 0.3, total: 0.8,
    effect: [[161, 79], [128, 80], [113, 81], [102, 81]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    effectDelay: 90,
    hit: [[44, 57], [74, 57], [72, 59], [67, 42], [59, 29], [52, 19]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 90
  };

  SKILLS.gsWings = {
    id: 'gsWings', cls: 'pirate', branches: GS, job: 2, skillId: 5201011, name: 'Wings', maxLevel: 5, teleportSkill: true, leap: true, vertical: true,
    icon: 'assets/skill/gs_wings_icon.png', dir: 'assets/skill/gs_wings/',
    mpCon: function (x) { return 30 - 4 * x; },
    dist: function (x) { return 40; },   // margen horizontal para alinearse con la plataforma de arriba
    vert: function (x) { return 80 * x; },                 // 80 px por nivel → 400 px a nivel 5
    cooldown: 1.0,
    info: function (x) { return $t('Vuela a la plataforma de arriba (hasta {0} px) · MP {1}', this.vert(x), this.mpCon(x)); },
    effectDelay: 90,
    effect: [[16, 29], [54, 27], [50, 27], [56, 27], [52, 27], [54, 27]].map(function (a) { return { ox: a[0], oy: a[1] }; })
  };

  SKILLS.gsPerseverance = Object.assign({}, SKILLS.bwPerseverance, { id: 'gsPerseverance', branches: GS });   // el Gunslinger también recibe Perseverance del Brawler (mismos valores)
  SKILLS.gsGrenade = passive({
    id: 'gsGrenade', cls: 'pirate', branches: GS, job: 2, skillId: 5201002, name: 'Grenade', maxLevel: 15,
    icon: 'assets/skill/gs_grenade_icon.png', dir: 'assets/skill/gs_grenade/',
    grenadePassive: true,
    prop: function (x) { return 2 * x; },                 // 30 % a nivel 15
    damage: function (x) { return 50 + 6 * x; },          // 140 % a nivel 15
    mobCount: 3,
    splash: true, splashCount: 3,
    splashRange: { x1: -50, x2: 50, y1: -50, y2: 20 },
    range: { x1: -50, x2: 50, y1: -50, y2: 20 },
    fx: function () { return {}; },
    info: function (x) { return $t('Al atacar: {0}% de chance de lanzar una granada ({1}% de daño en área a hasta 3 enemigos).', this.prop(x), this.damage(x)); },
    ball: { speed: 700, origin: [[15, 15], [14, 14], [15, 15], [14, 14], [15, 15], [14, 14], [15, 15], [14, 14]], delay: 30, startY: 20 },
    hit: [[25, 23], [35, 29], [41, 34], [49, 39], [33, 39], [39, 35], [46, 44]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    hitDelay: 120,
    special: [[40, 39], [57, 49], [68, 58], [82, 66], [55, 66], [65, 60], [76, 75]].map(function (a) { return { ox: a[0], oy: a[1] }; }),
    specialDelay: 120
  });
  
  /* Skills cuyo nivel máximo se bajó para cuadrar el SP (120 por rama): sus valores se reescalan para que el nivel máximo NUEVO dé lo mismo que daba el máximo ANTERIOR
   * (ej. Invincible Lv10 = lo que antes daba el Lv20). x' = x * (máx. anterior / máx. nuevo) en las fórmulas de valores. */
  function rescale(id, oldMax) {
    var sk = SKILLS[id], K = oldMax / sk.maxLevel;
    ['mods', 'duration', 'mpCon', 'prop', 'damage'].forEach(function (fn) {
      var f = sk[fn]; if (typeof f !== 'function') return;
      sk[fn] = function (x) { var r = f.call(this, x * K); return typeof r === 'number' ? Math.round(r) : r; };
    });
  }
  rescale('crInvincible', 20); rescale('htSoulArrow', 20); rescale('asGustCharm', 20); rescale('bdSteal', 10);

   var ORDER = ['slashBlast', 'ironBody', 'warriorMastery', 'haste', 'luckySeven', 'nimbleBody', 'arrowBlow', 'archerMastery', 'criticalShot', 'magicClaw', 'magicArmor', 'magicGuard', 'teleport', 'mpBoost', 'somersaultKick', 'shadowHeart', 'bulletTime', 'dash', 'hpBoost', 'ftWeaponMastery', 'ftFinalAttack', 'ftPhysicalTraining', 'ftWeaponBooster', 'ftRage', 'ftComboFury', 'ftBrandish', 'ftWarriorLeap', 'pgWeaponMastery', 'pgFinalAttack', 'pgPhysicalTraining', 'pgWeaponBooster', 'pgThreaten', 'pgIceCharge', 'pgFireCharge', 'pgWarriorLeap', 'spWeaponMastery', 'spFinalAttack', 'spPhysicalTraining', 'spWeaponBooster', 'spIronWill', 'spHyperBody', 'spPiercingDrive', 'spWarriorLeap', 'fpSpellMastery', 'fpMpEater', 'fpHighWisdom', 'fpMeditate', 'fpMagicBooster', 'fpFlameArrow', 'fpPoisonBreath', 'fpIgnite', 'htBowMastery', 'htFinalAttack', 'htPhysicalTraining', 'htBowBooster', 'htFlashJump', 'htArrowBomb', 'htSoulArrow', 'htHawk', 'cbCrossbowMastery', 'cbFinalAttack', 'cbPhysicalTraining', 'cbCrossbowBooster', 'cbFlashJump', 'cbIronArrow', 'cbHawk', 'cbNetToss', 'asClawMastery', 'asCriticalThrow', 'asPhysicalTraining', 'asClawBooster', 'asFlashJump', 'asShurikenBurst', 'asGustCharm', 'asMark', 'bwKnuckleMastery', 'bwPhysicalTraining', 'bwPerseverance', 'bwKnuckleBooster', 'bwDarkClarity', 'bwCorkscrewBlow', 'bwTornadoUppercut', 'bdDaggerMastery', 'bdPhysicalTraining', 'bdShieldMastery', 'bdDaggerBooster', 'bdSteal', 'bdFlashJump', 'bdChannelKarma', 'bdSavageBlow', 'ilMpEater', 'ilSpellMastery', 'ilHighWisdom', 'ilMeditate', 'ilMagicBooster', 'ilFreezingCrush', 'ilColdBeam', 'ilThunderbolt', 'crMpEater', 'crSpellMastery', 'crHighWisdom', 'crHeal', 'crInvincible', 'crBless', 'crHolyArrow', 'crMagicBooster', 'gsGunMastery', 'gsGunBooster', 'gsPhysicalTraining', 'gsTripleShot', 'gsRapidBlast', 'gsWings', 'gsGrenade', 'gsPerseverance'];
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
    id: 'luckySeven', cls: 'thief', branches: ['assassin'], skillId: 4001344, name: 'Lucky Seven', maxLevel: 20, ranged: true,
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
  // SP separados por job: cada job tiene su propio fondo de SP. El 1er job empieza en Lv10 y su fondo da 3 SP por nivel hasta Lv29 (20 niveles = 60 SP);
  // los SP ganados desde Lv30 son del 2do job, etc. Antes del Lv10 no hay SP (se farmea con ataques normales).
  var JOB_START = [0, 10, 30, 70, 100];   // índice = job (1..4): nivel al que empieza
  function jobOf(sk) { return (sk && sk.job) || 1; }
  function spTotal(level, job) {
    var a = JOB_START[job], b = JOB_START[job + 1] ? JOB_START[job + 1] - 1 : 200;
    return level < a ? 0 : SP_PER_LEVEL * (Math.min(level, b) - a + 1);
  }
  function spent(world, job) { return ORDER.reduce(function (n, id) { return n + (jobOf(SKILLS[id]) === job && !SKILLS[id].free ? world.skills[id].level : 0); }, 0); }   // las skills 'free' (regaladas al cambiar de job) no gastan SP
  function spAvailable(world, job) { job = job || 1; return Math.max(0, spTotal(world.stats.level, job) - spent(world, job)); }
  // ¿se puede subir un nivel? SP del job, nivel máximo, requisitos de otras skills (req) y, en 2do job, la rama correcta
  function canLearn(world, id) {
    var sk = SKILLS[id], st = world.skills[id];
    if (!sk || !st || spAvailable(world, jobOf(sk)) < 1 || st.level >= sk.maxLevel) return false;
    if (jobOf(sk) >= 2 && sk.branches && !(world.cur && sk.branches.indexOf(world.cur.branch) >= 0)) return false;
    if (sk.req) for (var k in sk.req) if (!world.skills[k] || world.skills[k].level < sk.req[k]) return false;
    return true;
  }
  function learn(world, id) { if (!canLearn(world, id)) return false; world.skills[id].level++; return true; }

  function view(sk, lv, weaponType) {
    if (!sk) return sk;
    if (sk.viewByWeapon && weaponType) return SKILLS[sk.viewByWeapon(weaponType)] || sk;
    if (sk.viewFor) return SKILLS[sk.viewFor(lv)] || sk;
    return sk;
  }
  var api = { view: view, SKILLS: SKILLS, ORDER: ORDER, SP_PER_LEVEL: SP_PER_LEVEL, newSkills: newSkills, sanitize: sanitize, spAvailable: spAvailable, canLearn: canLearn, spTotal: spTotal, jobOf: jobOf, JOB_START: JOB_START, learn: learn };
  root.MapleSkills = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
