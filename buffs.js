/* Buffs (efectos con duración). mods.speed = bonus de velocidad de movimiento (0.4 = +40%).
 * party: true = lo reciben todos los personajes que estén en el mismo mapa que quien lo lanza.
 * Valores de Haste PROVISIONALES: ajústalos aquí. El icono se busca en assets/skill/<id>_icon.png (si no existe se dibuja una "H"). */
(function (root) {
  'use strict';
  var BUFFS = {
    haste: { id: 'haste', name: 'Haste', desc: 'Aumenta la velocidad de movimiento del party.', duration: 60, party: true, mods: { speed: 0.4 }, icon: 'assets/skill/haste_icon.png', letter: 'H', color: '#3fa7e0' }
  };
  var api = { BUFFS: BUFFS };
  root.MapleBuffs = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
