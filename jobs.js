/* Ramas del 2do job. Al llegar a Lv30 el personaje elige una (character card) y deja de ser "1st job".
 * card: imagen opcional assets/ui/cards/<id>.png (si no existe se dibuja una carta provisional con CSS).
 * weapon / sub: ids de armas provisionales de Lv30 que se entregan al inventario al avanzar (null = nada). Si el inventario EQUIP no tiene hueco para todas, el avance se cancela. */
(function (root) {
  function $t(x) { var a = arguments, f = root.$t; if (f) return f.apply(null, a); return String(x).replace(/\{(\d+)\}/g, function (m, i) { return a[+i + 1] !== undefined ? a[+i + 1] : m; }); }
  var UNLOCK = 30;
  var B = {
    warrior: [
      { id: 'fighter', name: 'Fighter', desc: $t('Maestro de espadas y hachas a una mano. Daño alto y constante.'), weapon: null },
      { id: 'page', name: 'Page', desc: $t('Guerrero de armas contundentes y elementos. Resistente y versátil.'), weapon: null },
      { id: 'spearman', name: 'Spearman', desc: $t('Lancero de largo alcance con buffs defensivos. Recibe una lanza provisional.'), weapon: '1432002' }
    ],
    mage: [
      { id: 'wizardFP', name: 'Wizard (Fire/Poison)', desc: $t('Magia de fuego y veneno: daño en área y daño continuo.'), weapon: null },
      { id: 'wizardIL', name: 'Wizard (Ice/Lightning)', desc: $t('Magia de hielo y rayo: ralentiza y golpea a varios.'), weapon: null },
      { id: 'cleric', name: 'Cleric', desc: $t('Sanador de la party. Magia sagrada y buffs.'), weapon: null }
    ],
    archer: [
      { id: 'hunter', name: 'Hunter', desc: $t('Arquero de arco: flechas rápidas y lluvia de proyectiles.'), weapon: null },
      { id: 'crossbowman', name: 'Crossbowman', desc: $t('Ballestero: disparos potentes y precisos. Recibe una ballesta provisional.'), weapon: '1462069' }
    ],
    thief: [
      { id: 'assassin', name: 'Assassin', desc: $t('Maestro del claw y las estrellas. Conserva Lucky Seven.'), weapon: null },
      { id: 'bandit', name: 'Bandit', desc: $t('Combate cercano con daga (Savage Blow). Recibe una daga y un wristguard provisionales.'), weapon: '1332012', sub: '1092018' }
    ],
    pirate: [
      { id: 'brawler', name: 'Brawler', desc: $t('Peleador de nudillos. Conserva Somersault Kick.'), weapon: null },
      { id: 'gunslinger', name: 'Gunslinger', desc: $t('Pistolero (Rapid Blast). Recibe una pistola provisional.'), weapon: '1492042' }
    ]
  };
  function list(cls) { return B[cls] || []; }
  function get(id) { for (var c in B) for (var i = 0; i < B[c].length; i++) if (B[c][i].id === id) return B[c][i]; return null; }
  function valid(cls, id) { return list(cls).some(function (b) { return b.id === id; }); }
  function canAdvance(c) { return !!c && !c.branch && c.stats.level >= UNLOCK && list(c.cls).length > 0; }
  function gifts(b) { return b ? [b.weapon, b.sub].filter(Boolean) : []; }   // ids que entrega esta rama
  var api = { gifts: gifts, UNLOCK: UNLOCK, BRANCHES: B, list: list, get: get, valid: valid, canAdvance: canAdvance };
  root.MapleJobs = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
