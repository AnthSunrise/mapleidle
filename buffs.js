/* Buffs (efectos con duración). mods.speed = bonus de velocidad de movimiento (0.4 = +40%).
 * party: true = lo reciben todos los personajes que estén en el mismo mapa que quien lo lanza.
 * Valores de Haste PROVISIONALES: ajústalos aquí. El icono se busca en assets/skill/<id>_icon.png (si no existe se dibuja una "H"). */
(function (root) {
  'use strict';
  var BUFFS = {
    magicGuard: { id: 'magicGuard', name: 'Magic Guard', desc: 'Parte del daño recibido se descuenta del MP.', duration: 75, party: false, mods: {}, icon: 'assets/skill/magic_guard_icon.png', letter: 'G', color: '#4a7fd8' },
    dash: { id: 'dash', name: 'Dash', desc: 'Aumenta la velocidad de movimiento.', duration: 8, party: false, mods: {}, icon: 'assets/skill/dash_icon.png', letter: 'D', color: '#d8a43a' },
    weaponBooster: { id: 'weaponBooster', name: 'Weapon Booster', desc: 'Aumenta la velocidad de ataque.', duration: 60, party: false, mods: {}, icon: 'assets/skill/ft_weapon_booster_icon.png', letter: 'B', color: '#d86a3a' },
    rage: { id: 'rage', name: 'Rage', desc: 'Aumenta el ATT de todo el party del mapa.', duration: 60, party: true, mods: {}, icon: 'assets/skill/ft_rage_icon.png', letter: 'R', color: '#d83a3a' },
    ironWill: { id: 'ironWill', name: 'Iron Will', desc: 'Aumenta la DEF de todo el party del mapa.', duration: 60, party: true, mods: {}, icon: 'assets/skill/sp_iron_will_icon.png', letter: 'I', color: '#7a8aa8' },
    hyperBody: { id: 'hyperBody', name: 'Hyper Body', desc: 'Aumenta el HP y MP máximos de todo el party del mapa.', duration: 60, party: true, mods: {}, icon: 'assets/skill/sp_hyper_body_icon.png', letter: 'H', color: '#3ad8a4' },
    meditate: { id: 'meditate', name: 'Meditate', desc: 'Aumenta el ATT mágico de todo el party del mapa.', duration: 60, party: true, mods: {}, icon: 'assets/skill/fp_meditate_icon.png', letter: 'M', color: '#b06ad8' },
    magicBooster: { id: 'magicBooster', name: 'Magic Booster', desc: 'Aumenta la velocidad de ataque.', duration: 60, party: false, mods: {}, icon: 'assets/skill/fp_magic_booster_icon.png', letter: 'B', color: '#6a8ad8' },
    powerGuard: { id: 'powerGuard', name: 'Power Guard', desc: 'Refleja parte del daño recibido al enemigo.', duration: 60, party: false, mods: {}, icon: 'assets/skill/pg_power_guard_icon.png', letter: 'P', color: '#c9a63a' },
    powerReflection: { id: 'powerReflection', name: 'Power Reflection', desc: 'Refleja parte del daño recibido al enemigo.', duration: 60, party: false, mods: {}, icon: 'assets/skill/ft_power_reflection_icon.png', letter: 'P', color: '#c9a63a' },
    haste: { id: 'haste', name: 'Haste', desc: 'Aumenta la velocidad de movimiento del party.', duration: 60, party: true, mods: { speed: 0.4 }, icon: 'assets/skill/haste_icon.png', letter: 'H', color: '#3fa7e0' },
	bowBooster: { id: 'bowBooster', name: 'Bow Booster', desc: 'Aumenta la velocidad de ataque del arco.', duration: 60, party: false, mods: {}, icon: 'assets/skill/ht_bow_booster_icon.png', letter: 'B', color: '#d86a3a' },
	clawBooster: { id: 'clawBooster', name: 'Claw Booster', desc: 'Aumenta la velocidad de ataque con garras.', duration: 60, party: false, mods: {}, icon: 'assets/skill/as_claw_booster_icon.png', letter: 'B', color: '#7a8aa8' },
	knuckleBooster: { id: 'knuckleBooster', name: 'Knuckle Booster', desc: 'Aumenta la velocidad de ataque con nudillos.', duration: 60, party: false, mods: {}, icon: 'assets/skill/bw_knuckle_booster_icon.png', letter: 'B', color: '#8b0000' },
    darkClarity: { id: 'darkClarity', name: 'Dark Clarity', desc: 'Aumenta el Poder de Ataque físico (ATT).', duration: 60, party: false, mods: {}, icon: 'assets/skill/bw_dark_clarity_icon.png', letter: 'C', color: '#4b0082' },
	daggerBooster: { id: 'daggerBooster', name: 'Dagger Booster', desc: 'Aumenta la velocidad de ataque con dagas.', duration: 60, party: false, mods: {}, icon: 'assets/skill/bd_dagger_booster_icon.png', letter: 'B', color: '#8b0000' },
    channelKarma: { id: 'channelKarma', name: 'Channel Karma', desc: 'Aumenta el Poder de Ataque físico (ATT).', duration: 60, party: false, mods: {}, icon: 'assets/skill/bd_channel_karma_icon.png', letter: 'K', color: '#ff6600' },
    stealBuff: { id: 'stealBuff', name: 'Steal (Robo Exitoso)', desc: 'Obtienes +30 ATT temporalmente al robar a un enemigo.', duration: 60, party: false, mods: { att: 30 }, icon: 'assets/skill/bd_steal_icon.png', letter: 'S', color: '#gold' },
	invincible: { id: 'invincible', name: 'Invincible', desc: 'Reduce el daño físico recibido.', duration: 60, party: false, mods: {}, icon: 'assets/skill/cr_invincible_icon.png', letter: 'I', color: '#aaaaaa' },
    bless: { id: 'bless', name: 'Bless', desc: 'Aumenta DEF, EVA, ATT y MATT de todo el party.', duration: 60, party: true, mods: {}, icon: 'assets/skill/cr_bless_icon.png', letter: 'B', color: '#ffddaa' },
	crossbowBooster: { id: 'crossbowBooster', name: 'Crossbow Booster', desc: 'Aumenta la velocidad de ataque de la ballesta.', duration: 60, party: false, mods: {}, icon: 'assets/skill/cb_crossbow_booster_icon.png', letter: 'B', color: '#d86a3a' },
	gunBooster: { id: 'gunBooster', name: 'Gun Booster', desc: 'Aumenta la velocidad de ataque de la pistola.', duration: 60, party: false, mods: {}, icon: 'assets/skill/gs_gun_booster_icon.png', letter: 'B', color: '#d86a3a' }
  };
  var api = { BUFFS: BUFFS };
  root.MapleBuffs = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
