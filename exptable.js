/* EXP necesaria para subir de nivel (índice 0 = Lv 1 -> 2).
 * Lv 1-30: valores de MapleStory (de memoria, pueden tener algún error).
 * Del Lv 31 en adelante sigue una fórmula aproximada (x1.08 por nivel) en sim.js.
 * Para usar la tabla real de tu servidor Swordie, reemplaza este arreglo completo
 * (hasta el nivel 199) y la fórmula deja de usarse. */
(function (r) {
  r.EXPTABLE = [
    15, 34, 57, 92, 135, 372, 560, 840, 1242, 1144,
    1573, 2144, 2800, 3640, 4700, 5893, 7360, 9144, 11120, 13477,
    16268, 19320, 22880, 27008, 31477, 36600, 42444, 48720, 55813, 63800
  ];
})(typeof window !== 'undefined' ? window : globalThis);
