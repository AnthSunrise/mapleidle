/* Registro de mapas. off = posición del origen del mundo dentro de la imagen del render (se calibra con D + I/J/K/L).
 * Los datos de enemigos (hp/exp/mesos/daño) están en sim.js (mobRewards). */
(function (root) {
  var M = {};
  M.henesys = { name: 'Henesys Hunting Ground', region: 'Henesys', lv: 1, img: 'map/henesys.png', off: { x: 479, y: 1465 }, data: root.MAPDATA };
  if (root.MAPDATA_100020300) M.mushroom = { name: 'Mushroom Forest', region: 'Henesys', lv: 15, img: 'map/mushroom_forest.png', off: { x: 5092, y: 1837 }, data: root.MAPDATA_100020300, homeFh: 24, spawnX: -4300 };
  root.MAPLE_MAPS = M;
  // zonas del mapa mundial (las que no tienen mapa jugable aparecen bloqueadas): [región, nivel, nombre]
  root.MAPLE_WORLD = [['Henesys', 1, 'Henesys'], ['Kerning Subway', 30, 'Kerning Subway'], ['Perion', 40, 'Perion'], ['Ludibrium', 50, 'Ludibrium'], ['Orbis', 60, 'Orbis'],
    ['El Nath', 70, 'El Nath'], ['Ariant & Magatia', 80, 'Ariant & Magatia'], ['Leafre', 100, 'Leafre'], ['Lionheart Castle', 120, 'Lionheart Castle (party)'], ['Mu Lung', 120, 'Mu Lung'],
    ['Temple of Time', 140, 'Temple of Time'], ['Gate to the Future', 160, 'Gate to the Future'], ['Twilight Perion', 180, 'Twilight Perion']];
})(typeof window !== 'undefined' ? window : globalThis);
