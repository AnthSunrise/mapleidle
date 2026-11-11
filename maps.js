/* Registro de mapas. off = posición del origen del mundo dentro de la imagen del render (se calibra con D + I/J/K/L).
 * Los datos de enemigos (hp/exp/mesos/daño) están en sim.js (mobRewards). */
(function (root) {
  var M = {};
  M.henesys = { name: 'Henesys Hunting Ground', region: 'Henesys', lv: 1, img: 'map/henesys.png', off: { x: 479, y: 1120 }, data: root.MAPDATA };
  if (root.MAPDATA_100020300) M.mushroom = { name: 'Mushroom Forest', region: 'Henesys', lv: 15, img: 'map/mushroom_forest.png', off: { x: 5092, y: 1837 }, data: root.MAPDATA_100020300, homeFh: 24, spawnX: -4300 };
  if (root.MAPDATA_100040300) M.golem = { name: 'Golem Temple', region: 'Henesys', lv: 20, img: 'map/golem_temple.png', off: { x: 225, y: 530 }, data: root.MAPDATA_100040300, homeFh: 56, spawnX: 90 };
  if (root.MAPDATA_103010000) M.octopus = { name: 'Construction Site', region: 'Kerning Subway', lv: 35, img: 'map/construction_site.png', off: { x: 3011, y: -173 }, data: root.MAPDATA_103010000, homeFh: 1, spawnX: 0 };
  if (root.MAPDATA_103020300) M.kerning = { name: 'Kerning Subway', region: 'Kerning Subway', lv: 40, img: 'map/kerning_subway.png', off: { x: 2, y: 479 }, data: root.MAPDATA_103020300, homeFh: 124, spawnX: 500 };
  if (root.MAPDATA_103030200) M.swamp = { name: 'Kerning Swamp', region: 'Kerning Subway', lv: 45, img: 'map/swamp.png', off: { x: 1620, y: 628 }, data: root.MAPDATA_103030200, homeFh: 59, spawnX: 0 };
  if (root.MAPDATA_104020000) M.mushroom = { name: 'Forest West of Henesys', region: 'Henesys', lv: 15, img: 'map/forest.png', off: { x: 2480, y: 1410 }, data: root.MAPDATA_104020000, homeFh: 31, spawnX: 45 };
  if (root.MAPDATA_102030000) M.boars = { name: 'Wild Boar Land', region: 'Perion', lv: 50, img: 'map/boars.png', off: { x: 1182, y: -713 }, data: root.MAPDATA_102030000, homeFh: 1, spawnX: -45 };

  root.MAPLE_MAPS = M;
  // zonas del mapa mundial (las que no tienen mapa jugable aparecen bloqueadas): [región, nivel, nombre]
  root.MAPLE_WORLD = [['Henesys', 1, 'Henesys'], ['Kerning Subway', 30, 'Kerning Subway'], ['Perion', 40, 'Perion'], ['Ludibrium', 50, 'Ludibrium'], ['Orbis', 60, 'Orbis'],
    ['El Nath', 70, 'El Nath'], ['Ariant & Magatia', 80, 'Ariant & Magatia'], ['Leafre', 100, 'Leafre'], ['Lionheart Castle', 120, 'Lionheart Castle (party)'], ['Mu Lung', 120, 'Mu Lung'],
    ['Temple of Time', 140, 'Temple of Time'], ['Gate to the Future', 160, 'Gate to the Future'], ['Twilight Perion', 180, 'Twilight Perion']];
})(typeof window !== 'undefined' ? window : globalThis);