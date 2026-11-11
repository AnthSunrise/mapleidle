# Guía: agregar equipo (items) nuevo a maple-idle

Un equipo son **3 cosas**: sus **datos** (nombre, nivel, requisitos, stats → `itemdata.js`), su **icono** (`assets/item/<id>.png`) y su **aspecto en el personaje** (`layerdata.js` + `assets/layers/<id>.png`). Los dos primeros salen del `.img` del ítem con un solo comando; el tercero se regenera con `build_layers.py`. Las reglas propias del juego (quién lo usa, drops, tienda) van en `items.js` / `jobs.js`.

> Para importar cientos de equipos a la vez (lista → find_equip → build_items → gen_itemdata → build_layers) ver `07_EQUIPOS_MASIVOS.md`. Las islot de accesorios (Ri, Ae, Pe, Be, Af, Ay, Sh) ya están soportadas.

> `itemdata.js` es **generado**: no lo edites a mano. Los ajustes del juego sobre los datos del WZ van en `items.js` (sección de overrides).

## 1. Datos + icono (atajo, sin regenerar todo)

Necesitas el `.img` del ítem (`01432002.img`, 8 dígitos) y el **String Eqp** ya extraído (`wz_eq/out/Eqp/tree.json`, el de tu servidor: de ahí sale el nombre).

```
python3 tools/add_items.py wz_eq/out/Eqp/tree.json . 01432002.img 01462069.img 01492042.img
```
Por cada `.img` hace: lee `info` (nivel, requisitos STR/DEX/INT/LUK, ATT/MATT/DEF/HP/MP/…, velocidad de ataque, slots), copia el icono a `assets/item/<id>.png` y **fusiona** la entrada en `itemdata.js` (no toca las demás). Imprime `icono OK` o `SIN ICONO`.

- **Tipo de ítem** (`islot` del WZ): `Cp` hat, `Ma`/`MaPn` top (MaPn = overall/longcoat), `Pn` bottom, `So` shoes, `Gv` glove, `Wp`/`WpSi` weapon, `Si` sub (escudo, wristguard), `Sr` cape.
- **Clase**: sale de `reqJob` (1 warrior, 2 mage, 4 archer, 8 thief, 16 pirate). Si el WZ no pone job (0) el ítem es para todas.
- Si dice `SIN ICONO`: el icono está en **otro** `.img` (los ítems comparten imágenes). Pide ese `.img` también y usa la ruta larga (sección 5).

## 2. Que se vea puesto en el personaje

1. Extrae el `.img` a la biblioteca con el id de 8 dígitos como carpeta:
   `python3 tools/wzimg.py 01432002.img wz_lib/01432002`
2. Revisa que no queden imágenes por resolver: si `wzimg` o `missing.txt` dicen `source`, falta otro `.img` (ver sección 5).
3. Regenera las capas con **todos** los ids (el script reescribe `layerdata.js` entero):
   ```
   IDS=$(ls wz_lib | grep -E '^0[0-9]{7}$' | grep -v -E '^(00002000|00012000)$' | tr '\n' ' ')
   python3 tools/build_layers.py wz_lib wz_base/out . 00002000 00012000 $IDS
   ```
4. Copia `layerdata.js` y **toda** `assets/layers/` al juego (los atlas se regeneran juntos).

Poses (`layers.js`, tabla `CHAIN`): cada arma trae solo algunas animaciones (la lanza y la ballesta usan `stand2/walk2`, la pistola `swingP*`…). `MapleLayers.remap` elige sola la primera pose **completa** del arma. Si agregas un tipo de arma nuevo y se ve invisible o a medias en alguna acción, añade esa acción a `ACTIONS` en `tools/build_layers.py` y su alternativa en `CHAIN`. Para ver las acciones de un arma: abre su `tree.json` y mira las claves que no son `info`.

## 3. Reglas del juego (items.js)

| Quiero… | Dónde |
|---|---|
| Cambiar nivel / stats del WZ | `OVERRIDE` en items.js: `'1051204': { lv: 15, stats: { dex: 2 } }` |
| Que solo lo use una clase distinta a la del WZ | `CLS_OVERRIDE` (ej. Maple Sword solo Warrior) |
| Equipo inicial sin requisitos | lista `BEGINNER` |
| Que solo lo use **una rama** de 2º job (arma provisional) | `BRANCH_ONLY = { '1432002': 'spearman', … }` → `it.only`; además no pide STR/DEX/LUK y **no cae como drop** |
| Ver stats ACC/AVOID | solo se muestran en Stat > Detail (no cuentan en combate) |

Stats que **sí** cuentan: STR/DEX/INT/LUK, ATT, MATT, DEF (reduce daño de contacto), HP/MP máximos. Requisitos al equipar: clase, nivel y STR/DEX/INT/LUK **base** (los AP son automáticos, así que un requisito alto de DEX puede ser imposible: ponle `req` 0 con un override).

**Drops:** cualquier equipo con `lv > 0`, `lv <= nivel del personaje + 5`, de una clase del juego y sin `only` puede caer. Para que un ítem NO caiga, márcalo con `only` o ponle `lv: 0`.

**Tienda:** array `SHOP` en items.js: `{ id: 'red_potion', price: 100, cat: 'consumable' }`. `cat` es la tarjeta del menú: `'consumable'` (pociones), `'scroll'` (scroll pieces) o `'enhance'` (cubos). Para cobrar en otro objeto: `currency: 'scroll_piece'`. Precio de venta al NPC: `20 + nivel × 15` para equipo; para un objeto USE se define `ITEMS.<id>.sell = N` (las pociones usan la mitad del precio de compra).

**Poción nueva (ejemplo completo):**
1. Icono 32×32 aprox. en `assets/item/<id>.png`.
2. En items.js: `use('unagi', 'Unagi', 'Recupera 1000 HP. Clic para asignarla como poción de HP del personaje seleccionado.', { hp: 1000 });` (usa `{ mp: N }` para MP).
3. `ITEMS.unagi.sell = 500;`
4. Línea en `SHOP`: `{ id: 'unagi', price: 1000, cat: 'consumable' },`
No hace falta tocar nada más: la poción aparece en la tienda y se puede asignar como poción automática desde la pestaña USE.

## 4. Entregar un ítem al avanzar de job

En `jobs.js`, por rama: `weapon: '1432002'` y opcional `sub: '1092018'`. Se entregan al **inventario EQUIP** (no se equipan solos). Si no hay hueco para todo, el avance se cancela y avisa ("libera N huecos…"): la rama no se asigna y se puede volver a intentar.

## 5. Ítems con imágenes compartidas (icono o capas que faltan)

Muchos `.img` no traen todas sus imágenes: apuntan a otro (`source: Character/Weapon/01452002.img/…`). Para resolverlos:
```
python3 tools/wzimg.py <cada .img> wz_extra/<id>        # uno por cada .img (el pedido y los que faltan)
python3 tools/build_items.py wz_lib wz_eq/out/Eqp/tree.json wz_extra [otros dirs…]   # resuelve enlaces; escribe wz_lib/missing.txt
python3 tools/gen_itemdata.py wz_lib wz_eq/out/Eqp/tree.json . <ids…>                # OJO: regenera itemdata.js SOLO con esos ids; pásalos todos
```
`wz_lib/missing.txt` lista lo que sigue sin resolver: cada línea indica qué `.img` hay que pedir.

## 6. Probar

1. Abre el juego → inventario (**I**): el ítem con su icono y tooltip (nombre, REQ en rojo si no cumples, stats).
2. Equípalo (clic): se ve puesto; prueba parado, caminando, atacando, saltando y en cuerda.
3. Stat (**S**): el ATT/DEF cambia.
4. Tests de Node: `test_items.js` (cuenta de equipos: súbela si agregaste), `test_weapons2.js` (ejemplo de ítems por rama), `test_weaponpose.js` (poses por arma).

**Errores típicos:** cuadro de color en vez de icono → falta `assets/item/<id>.png`; el arma no se ve → no está en `wz_lib` al regenerar capas, o le falta la pose (ver `CHAIN`); "solo para X" al equipar → `cls`/`only`; no se puede equipar por requisito → `req` en un override; cae un ítem que no debía → `only`/`lv`.

---

# Prompt para Gemini (adjunta `items.js`, `jobs.js`, `layers.js` y el `tree.json` del ítem y de String Eqp)

```
Estoy haciendo un juego idle de MapleStory en HTML5 Canvas + JavaScript vanilla (sin librerías).
Te adjunto items.js, jobs.js, layers.js y el tree.json del equipo que quiero agregar (y del String Eqp).

Tarea: agrega el equipo <NOMBRE> (id WZ <ID>) para <CLASE / RAMA>.

Reglas del proyecto:
- Los datos del equipo NO se escriben a mano: itemdata.js lo genera tools/add_items.py desde el .img (nombre, tipo, nivel, requisitos, stats, velocidad) y copia el icono a assets/item/<id>.png. Los ajustes del juego van en items.js: OVERRIDE (nivel/stats), CLS_OVERRIDE (clase), BEGINNER (sin requisitos), BRANCH_ONLY (solo una rama de 2º job; no cae como drop y no pide stats).
- Requisitos al equipar: clase (it.cls), rama (it.only), nivel y STR/DEX/INT/LUK base; los AP son automáticos, así que un requisito de stat muy alto puede ser imposible.
- Si es arma provisional de un 2º job, se entrega desde jobs.js con weapon: '<id>' y opcional sub: '<id>' (al inventario EQUIP; si no hay hueco el avance se cancela).
- Para verse en el personaje, el .img se extrae a wz_lib/<id de 8 dígitos> y se regenera layerdata.js con tools/build_layers.py (ACTIONS = acciones empaquetadas). layers.js elige la pose con la tabla CHAIN si el arma no trae la acción completa.

Dame solo los fragmentos a insertar (archivo y lugar exactos), qué acciones del arma (claves del tree.json que no son info) hay y cuáles faltan en ACTIONS/CHAIN, y qué overrides necesita (requisitos imposibles, clase, rama). No reescribas archivos completos. Si algo del equipo no se puede resolver (imagen compartida con otro .img), dime qué .img hay que pedir.
```
