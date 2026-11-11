/* Buffs (efectos con duración). mods.speed = bonus de velocidad de movimiento (0.4 = +40%).
 * party: true = lo reciben todos los personajes que estén en el mismo mapa que quien lo lanza.
 * Valores de Haste PROVISIONALES: ajústalos aquí. El icono se busca en assets/skill/<id>_icon.png (si no existe se dibuja una "H"). */
(function (root) {
  function $t(x) { var a = arguments, f = root.$t; if (f) return f.apply(null, a); return String(x).replace(/\{(\d+)\}/g, function (m, i) { return a[+i + 1] !== undefined ? a[+i + 1] : m; }); }
  'use strict';
  var BUFFS = {
    magicGuard: { id: 'magicGuard', name: 'Magic Guard', desc: $t('Parte del daño recibido se descuenta del MP.'), duration: 75, party: false, mods: {}, icon: 'assets/skill/magic_guard_icon.png', letter: 'G', color: '#4a7fd8' },
    dash: { id: 'dash', name: 'Dash', desc: $t('Aumenta la velocidad de movimiento.'), duration: 8, party: false, mods: {}, icon: 'assets/skill/dash_icon.png', letter: 'D', color: '#d8a43a' },
    weaponBooster: { id: 'weaponBooster', name: 'Weapon Booster', desc: $t('Aumenta la velocidad de ataque.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/ft_weapon_booster_icon.png', letter: 'B', color: '#d86a3a' },
    rage: { id: 'rage', name: 'Rage', desc: $t('Aumenta el ATT de todo el party del mapa.'), duration: 60, party: true, mods: {}, icon: 'assets/skill/ft_rage_icon.png', letter: 'R', color: '#d83a3a' },
    ironWill: { id: 'ironWill', name: 'Iron Will', desc: $t('Aumenta la DEF de todo el party del mapa.'), duration: 60, party: true, mods: {}, icon: 'assets/skill/sp_iron_will_icon.png', letter: 'I', color: '#7a8aa8' },
    hyperBody: { id: 'hyperBody', name: 'Hyper Body', desc: $t('Aumenta el HP y MP máximos de todo el party del mapa.'), duration: 60, party: true, mods: {}, icon: 'assets/skill/sp_hyper_body_icon.png', letter: 'H', color: '#3ad8a4' },
    meditate: { id: 'meditate', name: 'Meditate', desc: $t('Aumenta el ATT mágico de todo el party del mapa.'), duration: 60, party: true, mods: {}, icon: 'assets/skill/fp_meditate_icon.png', letter: 'M', color: '#b06ad8' },
    magicBooster: { id: 'magicBooster', name: 'Magic Booster', desc: $t('Aumenta la velocidad de ataque.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/fp_magic_booster_icon.png', letter: 'B', color: '#6a8ad8' },
    powerGuard: { id: 'powerGuard', name: 'Power Guard', desc: $t('Refleja parte del daño recibido al enemigo.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/pg_power_guard_icon.png', letter: 'P', color: '#c9a63a' },
    powerReflection: { id: 'powerReflection', name: 'Power Reflection', desc: $t('Refleja parte del daño recibido al enemigo.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/ft_power_reflection_icon.png', letter: 'P', color: '#c9a63a' },
    haste: { id: 'haste', name: 'Haste', desc: $t('Aumenta la velocidad de movimiento del party.'), duration: 60, party: true, mods: { speed: 0.4 }, icon: 'assets/skill/haste_icon.png', letter: 'H', color: '#3fa7e0' },
	bowBooster: { id: 'bowBooster', name: 'Bow Booster', desc: $t('Aumenta la velocidad de ataque del arco.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/ht_bow_booster_icon.png', letter: 'B', color: '#d86a3a' },
	clawBooster: { id: 'clawBooster', name: 'Claw Booster', desc: $t('Aumenta la velocidad de ataque con garras.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/as_claw_booster_icon.png', letter: 'B', color: '#7a8aa8' },
    bless: { id: 'bless', name: 'Bless', desc: $t('Aumenta la DEF, EVA y ATT de todo el party del mapa.'), duration: 60, party: true, mods: {}, icon: 'assets/skill/cr_bless_icon.png', letter: 'B', color: '#f2d95a' },
    channelKarma: { id: 'channelKarma', name: 'Channel Karma', desc: $t('Aumenta el ATT.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/bd_channel_karma_icon.png', letter: 'K', color: '#7a8aa8' },
    crossbowBooster: { id: 'crossbowBooster', name: 'Crossbow Booster', desc: $t('Aumenta la velocidad de ataque de la ballesta.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/cb_crossbow_booster_icon.png', letter: 'B', color: '#d86a3a' },
    daggerBooster: { id: 'daggerBooster', name: 'Dagger Booster', desc: $t('Aumenta la velocidad de ataque con dagas.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/bd_dagger_booster_icon.png', letter: 'B', color: '#7a8aa8' },
    darkClarity: { id: 'darkClarity', name: 'Dark Clarity', desc: $t('Aumenta el ATT.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/bw_dark_clarity_icon.png', letter: 'C', color: '#8a6ad8' },
    gunBooster: { id: 'gunBooster', name: 'Gun Booster', desc: $t('Aumenta la velocidad de ataque con pistolas.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/gs_gun_booster_icon.png', letter: 'B', color: '#d86a3a' },
    invincible: { id: 'invincible', name: 'Invincible', desc: $t('Reduce el daño físico recibido.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/cr_invincible_icon.png', letter: 'I', color: '#e8e8f0' },
    knuckleBooster: { id: 'knuckleBooster', name: 'Knuckle Booster', desc: $t('Aumenta la velocidad de ataque con nudillos.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/bw_knuckle_booster_icon.png', letter: 'B', color: '#d86a3a' },
    stealBuff: { id: 'stealBuff', name: 'Steal', desc: $t('Aumenta el ATT tras un robo exitoso.'), duration: 60, party: false, mods: {}, icon: 'assets/skill/as_steal_icon.png', letter: 'S', color: '#c9a63a' },
  };
  var api = { BUFFS: BUFFS };
  root.MapleBuffs = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
