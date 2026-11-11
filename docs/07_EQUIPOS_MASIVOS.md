# Equipos reales: flujo completo y reglas (etapas 86–87)

Estado: el juego tiene **1006 equipos con ID real del WZ** (916 elegidos por el dueño + 91 anteriores, algunos coinciden). Los IDs se conservan para poder armar tablas de drop/tienda con los números reales.

## 1. De la lista del dueño al juego (flujo reproducible)

Carpeta de trabajo del dueño: `Character.wz` exportado (una carpeta por categoría), `Eqp.img` de String.wz y los scripts de `tools/`.

1. **Elegir** (en el PC del dueño):
   `python3 find_equip.py <carpeta Character.wz> --lista item_list.txt --copiar <Character.wz> output`
   - `item_list.txt`: líneas `Categoría: nombre, nombre@nivel, …`. `nombre@nivel` elige, entre las variantes con el mismo nombre, la de nivel más cercano. Corrige erratas si hay una sola coincidencia (≥0.9) y sugiere si no. `informe.txt` (se va añadiendo) lista ELEGIDOS (nombre | id | nivel | ATT | MATT) y NO ENCONTRADOS.
   - Ojo: nombre en String ≠ nombre del HandTool a veces (Eligos Bloody Arm Cannon). Usar `-c` (contiene) y buscar por ID.
2. **Extraer** cada `.img`: `python3 tools/wzimg.py <id>.img <dir>/<id>` (env `WZ_NOPNG=1` solo lee datos). Genera `tree.json` + PNGs.
3. **Resolver enlaces**: muchos equipos no traen sus dibujos y apuntan con `source`/`_inlink` a otro `.img` base (`Character/<cat>/<id>.img/…`). `python3 tools/build_items.py <lib_salida> <Eqp/tree.json> <dir_extraido…>` copia los PNG del destino y escribe `missing.txt` con lo que no se pudo resolver. `tools/copy_ids.py` + `ids_faltantes.txt` sirven para pedir al dueño los `.img` base que falten.
   - **Importante**: los `.img` base solo son fuente de sprites. NO deben entrar al juego como ítems (en la etapa 87 se colaron por error; corregido en 87c). El juego usa solo los ids elegidos.
4. **Datos + iconos**: `python3 tools/gen_itemdata.py <lib> <Eqp/tree.json> . <ids…>` REGENERA `itemdata.js` solo con los ids dados (pasa siempre la lista completa) y copia `assets/item/<id>.png`. Lee: nombre (String), tipo (`islot`), nivel, requisitos, stats `inc*`, `bdR`→`boss`, `imdR`→`ied`, velocidad, tuc.
5. **Aspecto en el personaje**: `python3 tools/build_layers.py <lib> <wz_base/out> . 00002000 00012000 <ids de cara/pelo 0002xxxx 0003xxxx> <ids de equipo>` REESCRIBE `layerdata.js` y `assets/layers/` ENTEROS. Si olvidas los ids de cara y pelo, los personajes salen calvos y sin cara (pasó en 87b). Borra a mano de `assets/layers` y `assets/item` lo que ya no esté en uso. Peso actual: `layerdata.js` ≈ 5,5 MB, `assets/layers` ≈ 10 MB.
6. Probar: `bash tests/run_all.sh` y una captura con Playwright (ver `browser_*.js` en el historial; ventana de equipo con la tecla E).

## 2. Reglas del juego sobre los datos (items.js)

- **Slots** (`SLOTS`/`TYPE_SLOTS`): hat, top, bottom, glove, shoes, cape, ring×4, earring, pendant×2, belt, faceacc, eyeacc, shoulder, weapon, sub. Posiciones en la ventana: `SLOTPOS` en `mui.js` (medidas de `assets/ui2/equip_bg.png`).
- **Tipo** por `islot`: Cp hat, Ma/MaPn top (MaPn = overall), Pn bottom, So shoes, Gv glove, Wp/WpSi weapon, Si sub, Sr cape, Ri ring, Ae earring, Pe pendant, Be belt, Af faceacc, Ay eyeacc, Sh shoulder. Debe coincidir con `TYPE` de `gen_itemdata.py`.
- **Clase**: `reqJob` 1/2/4/8/16. `reqJob` 9 (warrior|thief) no está soportado: queda para todas (pocos ítems).
- **Tipo de arma por clase/rama** (`weaponAllowed`, prefijo del id: 130 espada 1M, 131 hacha 1M, 132 maza 1M, 133 daga, 137 wand, 138 staff, 140/141/142 espada/hacha/maza 2M, 143 lanza, 144 polearm, 145 arco, 146 ballesta, 147 claw, 148 knuckle, 149 pistola): Fighter 130/131/140/141; Page 130/132/142; Spearman 143/144; Hunter 145; Crossbowman 146; Assassin 147; Bandit 133; Brawler 148; Gunslinger 149. Sin rama, por clase.
- **Requisitos de stat**: el reparto de AP es automático (solo el stat principal sube). Si un equipo pide más stat que el AP posible a su nivel, el requisito se limita a ese tope (`items.js`, antes de `calcStats`). `tests/test_ap.js` lo vigila.
- **Overall ↔ Bottom**: equipar uno devuelve el otro al inventario. **Arma a dos manos** (140–144) devuelve el escudo (sub) y bloquea equipar uno.
- Mensajes nuevos van con `$t()` y su traducción en `lang_en.js`.

## 3. Tooltips

- Orden: Category, Attack Speed (armas), STR, DEX, INT, LUK, MaxHP, MaxMP, Weapon Attack, Magic Attack, Boss Damage (armas), Ignore Enemy Def (armas), Defense, Magic Def, Acc, Eva, Speed, Jump, Upgrades. (`SORT` en `mui.js`.)
- Etiquetas pixeladas en `assets/ui/tt/`: `wc_<prefijo-100>.png` armas, `ic_<n>.png` otras categorías (`ICAT`). Las faltantes (`ic_pendant/belt/shoulder/overall`, `wc_48`, `wc_49`) se compusieron con las letras de las existentes. Dígitos `can_*/cant_*` (6, 8, 9 se regeneraron: estaban vacíos).
- `boss`/`ied` solo se MUESTRAN; el combate no los usa.

## 4. Capas del personaje (layers.js)

Las capas ocultas por el `vslot` de otro ítem (ej. la cabeza bajo una máscara de Andras/Marbas/Valefor/Amdusias) siguen sirviendo de ancla al colocar las demás; solo se dejan de dibujar. Sin esto las máscaras salían desplazadas.

## 5. Conocido / sin resolver

- No encontrados en el WZ del dueño: dark scarab, timeless rampion, fafnir damascus blade (se cubrió con Fafnir Damascus por id), Corcell Hat.
- El pool de drops (`rollDrop` en `items.js`) incluye ahora CUALQUIER equipo con nivel ≤ nivel+5 de cualquier clase: es provisional hasta que el dueño defina tablas por mob (ver hoja de ruta).
- `ui.js` conserva un `LAYOUT` y un panel de skills viejos ocultos (sin traducir ni actualizar).
