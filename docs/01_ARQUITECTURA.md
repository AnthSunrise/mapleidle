# Arquitectura

## Archivos (orden de carga en `index.html`)

`mapdata*.js → maps.js → exptable.js → itemdata.js → items.js → jobs.js → skills.js → basiceff.js → buffs.js → sim.js → layerdata.js → layers.js → dmgdata.js → game.js → ui.js → chars.js → worldmap.js → mui.js`

Todos son IIFE que cuelgan de `window` (y de `module.exports` para Node). Sin bundler.

| Archivo | Contenido |
|---|---|
| `mapdata_*.js` | Datos de cada mapa generados por `map_from_img.py`: footholds, escaleras/cuerdas, spawns (`MAPDATA_<idMapa>`) |
| `maps.js` | Registro `MAPLE_MAPS`: nombre, región, nivel, imagen de render (`assets/map/…`), `off` (posición del origen sobre la imagen), `homeFh`, `spawnX`, y la lista `MAPLE_WORLD` del mapa mundial |
| `exptable.js` | Curva de EXP por nivel. Sobre el último nivel: ×1.08 por nivel |
| `itemdata.js` | Equipos reales del WZ (nombre, tipo, nivel, requisitos, stats). Lo genera `gen_itemdata.py`; no se edita a mano |
| `items.js` | `ITEMS` (USE/ETC/equipo), `SHOP`, scrolls, cubos, potenciales, `calcStats`, instancias de equipo (`{id, pot, sc}`), STACK_MAX=9999 |
| `jobs.js` | Ramas del 2º job por clase (`BRANCHES`), armas provisionales que se regalan al avanzar |
| `skills.js` | TODAS las skills (`SKILLS`), `ORDER`, SP por job (`JOB_START=[0,10,30,70,100]`), helpers `passive()`, `cloneJob2()`, `rescale()` |
| `buffs.js` | Definición visual/lógica de los buffs (`buff: 'id'` de una skill apunta aquí) |
| `sim.js` | **Toda la lógica del juego** (sin DOM): mundo, IA de los personajes, combate, mobs, drops, EXP, buffs, offline. Paso fijo `S.STEP = 1/60` |
| `layers.js` + `layerdata.js` | Compositor del personaje por capas (cuerpo, cabeza, cara, pelo, equipo) |
| `game.js` | Canvas: cargar imágenes, dibujar mundo/mobs/skills/HUD, cámara, entrada, guardado, bucle principal, juego en segundo plano |
| `ui.js`, `chars.js`, `worldmap.js` | Panel lateral de personajes, creación/gestor de personajes (tecla C), mapa mundial |
| `mui.js` | Ventanas estilo MapleStory: Inventario (I), Equip (E), Stat (S), Skill (K), Tienda (T), cubos/scrolls, tooltips |

**Regla de oro:** la lógica va en `sim.js` (testeable en Node); dibujar/UI va en `game.js`/`mui.js`. Si una mecánica nueva no se puede probar con un script Node, probablemente está en el sitio equivocado.

## Cómo se prueba (Node)

```js
globalThis.window = globalThis;
MAPDATA = require('../mapdata.js'); MAPDATA_100040300 = require('../mapdata_golem.js');
require('../maps.js'); require('../exptable.js'); require('../itemdata.js'); require('../items.js');
require('../jobs.js'); require('../skills.js'); require('../buffs.js'); require('../basiceff.js');
const S = require('../sim.js');
const w = S.createWorld(MAPDATA, {});
S.addCharacter(w, { name: 'X', cls: 'warrior', level: 30, mapId: 'golem' });
for (let i = 0; i < 600; i++) S.step(w, S.STEP);
```
Mira `tests/test_sp2.js` (skills), `test_scroll.js`, `test_potential.js`, `test_offline.js` como plantillas. Para probar UI se usó Playwright con Chromium (no incluido; son scripts sueltos).

## Modelo de datos importante

- **Mundo** `w`: `w.chars[]` (personajes), `w.selected`, `w.cur` (personaje activo), `w.mapId`, `w.zones[mapId]`, `w.mesos` (global), `w.inv` (`{equip:[128], use:[128]}` compartido), `w.cfg` (configuración: `mobRewards`, `mobTypes`, `mobHpMul`, `elite`, `classes`…).
- **Personaje** `c`: `name, cls, branch, stats{level,exp,hp,mp,maxHp,maxMp}, ap, skills{id:{level,auto}}, buffs[], equip{slot: id|{id,pot,sc}}, potions{hp:{id,pct},mp:{…}}, mapId, zones`.
- **Equipo con instancia:** un item puede ser string `'1302077'` o `{id, pot:{tier,lines}, sc:{slots, ups, prot}}`. Siempre se lee con `idOf()`, `statsOf()`, `nameOf()`, `slotsLeft()` de items.js.
- **mods(c):** suma de pasivas + buffs + potencial. Claves permitidas: `speed hpPct mpPct hpLv mpLv def eva crit critDmg range absorb att pStr pDex pLuk mastery atkSpeed reflect reflectMax pInt matt hpRec mpRec recT physReduce bossPct`. Si una skill nueva necesita un modificador distinto, se añade a `MOD_KEYS` y se usa donde corresponda en `sim.js`.
- **Enemigos:** `mobTypes` (id WZ → nombre corto) y `mobRewards[nombre] = {exp, meso:[min,max], touch, hp, level, hpMul, expMul, undead, boss…}` en `sim.js`. Sprites en `assets/mob/<nombre>/{stand,move,hit,die}_N.png`.
- **Partida:** `localStorage.maple_save` = `{v:2, savedAt, chars, inv, mesos, …}` (ver `save()` en game.js). `maple_off*` guardan calibraciones de mapas. Al cambiar el formato hay que migrar en la carga (ya existen migraciones de equipo→instancias y de skills; sigue ese patrón con `v`).

## Convenciones de combate/skills (resumen)

- Una skill de ataque define `damage(x)` (% del daño base), `mpCon(x)`, `mobCount`, `attackCount`, `range{x1,x2,y1,y2}`, tiempos `windup/hitAt/total`, y la animación (`effect[]` con origins, `effectDelay`, `hit[]`…). Los números salen de `tree.json` del .img de la skill (`common`: `damage`, `mpCon`, `x`, `y`, `time`, `lt/rb`).
- Tipos ya soportados en `skills.js`/`sim.js`: ataque directo, a distancia con proyectil (`ranged`, `ball`), pasivas (`passive({fx})`), buffs de uno/party (`buff`+`mods`+`duration`), debuffs de mobs (`debuff`), invocaciones (`summon`), curación (`healSkill`), veneno/quemadura (`dot`, ignite), Final Attack, Soul Arrow, Steal, MP Eater, Mark, movimiento (Teleport, Flash Jump, Dash, Wings). Mira la skill más parecida y cópiala.
- Para skills de 3º/4º job: `job: 3` / `job: 4`, `branches: ['rama']`, `req: {skillPrevia: nivel}`. El SP de cada job se gasta por separado (120 por rama en el 2º job; `spent()` ignora las `free:true`).
- `rescale(id, oldMax)` ajusta una skill cuando se baja su nivel máximo conservando el valor del máximo anterior.

## Juego en segundo plano / offline

`game.js`: `advance(clamp)` simula lo que pasó mientras la pestaña estaba oculta (Web Worker de 250 ms + `setInterval` de respaldo). Si el hueco supera `BG_GAP=20 s` se aplica el modo offline (`S.offlineGain`): 25% de lo ganado, tope de 4 h de ausencia, SOLO EXP y mesos, nunca sube de nivel.
