# Guía: agregar un mapa nuevo a mano (maple-idle)

Un mapa son **3 cosas**: sus datos físicos (`mapdata_<id>.js`, generado del .img), su imagen (`assets/map/<nombre>.png`) y sus enemigos (sprites + stats). Se registran en 4 archivos: **`index.html`**, **`maps.js`**, **`sim.js`** y **`game.js`**.

## 1. Datos del mapa (.img → mapdata)

```
python3 tools/wzimg.py 103030200.img salida/          # crea salida/tree.json (y PNGs)
python3 tools/map_from_img.py salida/tree.json mapdata_swamp.js 103030200
```
Crea `mapdata_swamp.js` con `var MAPDATA_103030200 = {footholds, ladders, life}`. `life` solo trae los enemigos (`type: 'm'`) con su `id` de mob; los NPC se ignoran.
Copia el archivo a la carpeta del juego y agrégalo en **`index.html`**, junto a los demás `mapdata_*.js` y **antes de `maps.js`**:
```html
<script src="mapdata_swamp.js"></script>
```

> **Mapas de v83 (u otras versiones antiguas):** `tools/wzimg.py` ya los lee solo; detecta si los strings vienen cifrados (GMS v83, SEA) o no (los .img de tu servidor) y lo muestra: `cifrado: GMS/v83`. Si dice "No pude descifrar", prueba con otro IV: `WZ_IV=B97D63E9 python3 wzimg.py ...` (en Windows: `set WZ_IV=B97D63E9`). Ojo: los ids de mobs de v83 llevan cero adelante (`'0210100'`); en `mobTypes` de `sim.js` la clave debe ser **idéntica** (`'0210100': 'pig'`). Como usas mobs actuales, solo mapeas esos ids al mob que quieras en su lugar (ej. `'0210100': 'wild_boar'`) y le pones sus stats en `mobRewards`.

## 2. Imagen del mapa

Un render del mapa completo (PNG) en `assets/map/<nombre>.png`. Si viene con fondo transparente, ponle un cielo/color detrás (se hizo con Golem Temple). No hace falta recortar el PNG: el desfase se calibra en el paso 3.

## 3. Registrar en `maps.js`

Agrega una línea (copia la de Kerning Swamp) antes de `root.MAPLE_MAPS = M;`:
```js
if (root.MAPDATA_103030200) M.swamp = { name: 'Kerning Swamp', region: 'Kerning Subway', lv: 45, img: 'map/swamp.png', off: { x: 1620, y: 628 }, data: root.MAPDATA_103030200, homeFh: 59, spawnX: 0 };
```
- `swamp` = id interno (úsalo siempre igual en todo el código).
- `region`: debe existir en `root.MAPLE_WORLD` (mapa mundial) para que aparezca desbloqueada según el nivel.
- `lv`: nivel recomendado.
- `homeFh`: **id de un foothold** de la plataforma donde aparecen los personajes (mira `footholds` en el mapdata; elige uno largo y plano). `spawnX`: posición X inicial.
- `off`: dónde cae el origen del mundo dentro del PNG. Primero pon `{ x: 0, y: 0 }`, abre el juego, entra al mapa, pulsa **D** (debug: dibuja los footholds en verde) y mueve la imagen con **I/J/K/L** (Shift = 10 px) hasta que los footholds coincidan con el render. Lo calibrado se guarda en el navegador; cuando quede bien, copia el `x, y` que muestra el texto "Offset mapa" a `maps.js`.

## 4. Enemigos

**Atajo:** `python3 tools/import_mob.py 5130103.img swamp` copia los sprites con los nombres correctos a `assets/mob/swamp/` e imprime las líneas de `mobTypes` / `mobRewards` (hp, exp, daño, nivel ya sacados del .img; solo falta el `meso`). Abajo, el detalle manual.

**Sprites.** Del .img del mob (`python3 tools/wzimg.py 5130103.img salida/`) copia los fotogramas a `assets/mob/<nombre>/` con esta convención (el cargador lee `_0`, `_1`… hasta que falte uno):
`stand_0.png…`, `move_0.png…`, `hit_0.png…`, `die_0.png…`
Si el mob no tiene `move`, usa `stand`. `<nombre>` es el que tú inventes (ej. `swamp`).

**`game.js`** — agrega el nombre a la lista de sprites (cerca de `for (var kind of [...])`):
```js
for (var kind of ['snail_blue', ..., 'octopus', 'swamp'])
```

**`sim.js`** — dos tablas dentro de `DEFAULT_CFG`:
```js
mobTypes: { ..., '5130103': 'swamp' },                       // id del WZ → nombre
mobRewards: { ..., swamp: { exp: 143, meso: [90, 200], touch: 242, hp: 5280, level: 47 } },
```
Del .img del mob (`info`): `maxHP` → `hp`, `exp` → `exp`, `PADamage` → `touch` (daño de contacto), `level` → `level`. `meso` no viene en el WZ: pon un rango provisional (≈ nivel × 1.5 a nivel × 3). Si falta un id en `mobTypes`, el mob sale como caracol azul: es la señal de que se te olvidó.
Regla del proyecto: los mobs van **idénticos al WZ** (hp, exp, daño) salvo los que ya se ajustaron a mano (Golem, Octopus). El EXP lo multiplica `expMul` global (1.4), no lo toques por mob.

## 5. Probar

1. Abre `index.html` → mapa mundial (**M**) → el mapa debe aparecer con su región y nivel.
2. Entra: personajes sobre la plataforma, enemigos con su sprite, footholds alineados (**D**).
3. Deja a un personaje en Auto un minuto: debe moverse, saltar entre plataformas y matar.
4. Tests de Node (opcional): copia `test_swamp.js`, cambia el id/mapa y agrega el `mapdata_*.js` al `require` de los demás tests.

**Errores típicos:** mapa que no aparece → falta el `<script>` en `index.html` o va después de `maps.js`; personajes cayendo al vacío → `homeFh`/`spawnX` mal; imagen corrida → `off`; enemigos como caracol azul → falta el id en `mobTypes`; enemigos invisibles → nombre de la carpeta de sprites ≠ nombre en `mobTypes`/lista de `game.js`.

---

# Prompt para Gemini (copiar y pegar, adjuntando `maps.js`, `sim.js` (solo `DEFAULT_CFG`), `game.js` y el `tree.json` del mob y del mapa)

```
Estoy haciendo un juego idle de MapleStory en HTML5 Canvas + JavaScript vanilla (sin librerías).
Te adjunto maps.js, el bloque DEFAULT_CFG de sim.js, game.js y el tree.json del mapa y del enemigo que quiero agregar.

Tarea: agrega el mapa <NOMBRE> (id WZ <ID_MAPA>) con el enemigo <NOMBRE_MOB> (id WZ <ID_MOB>).

Reglas del proyecto:
- Los datos del mapa los genera tools/map_from_img.py (mapdata_<nombre>.js, variable MAPDATA_<id>); se carga con un <script> en index.html ANTES de maps.js.
- En maps.js cada mapa es: M.<id> = { name, region, lv, img: 'map/<archivo>.png', off: {x,y}, data: root.MAPDATA_<id>, homeFh, spawnX }. homeFh es el id de un foothold largo y plano donde aparecen los personajes (búscalo en footholds del mapdata). off lo calibro yo a mano, déjalo en {x:0,y:0}. region debe existir en MAPLE_WORLD.
- En sim.js DEFAULT_CFG hay dos tablas: mobTypes { 'idWZ': 'nombre' } y mobRewards { nombre: { exp, meso: [min,max], touch, hp, level } }. Del info del mob: maxHP → hp, exp → exp, PADamage → touch, level → level. Los mobs van idénticos al WZ; meso es provisional (rango ≈ nivel*1.5 a nivel*3).
- En game.js la lista `for (var kind of [...])` carga los sprites de assets/mob/<nombre>/ (stand_N, move_N, hit_N, die_N).

Dame solo los fragmentos a insertar (archivo y lugar exactos), la lista de PNG a copiar con su ruta destino, y el homeFh/spawnX que propones y por qué. No reescribas archivos completos. Si algo del mapa necesita una mecánica que no existe (portales, NPC, plataformas móviles, enemigos que disparan), dímelo antes de inventarla.
```
