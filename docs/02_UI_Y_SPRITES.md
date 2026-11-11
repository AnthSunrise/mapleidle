# UI con sprites de MapleStory

Las ventanas (`mui.js`) son HTML sobre el canvas, con un fondo que es un PNG compuesto a partir de un .img de MapleStory. Todo el arte nuevo está en `assets/ui2/`.

## Flujo para rehacer una ventana con otro .img

1. Extraer: `python3 tools/wzimg.py UIWindow4.img /tmp/uw4` → `tree.json` + PNG.
2. En `tree.json` buscar el nodo (p. ej. `Equip`, `Stat/main`, `Skill/main`, `Shop`, `Item`). Cada canvas trae `origin{x,y}`, `w`, `h`, `png`.
3. Componer el fondo con Pillow: pegar `backgrnd`, `backgrnd2`, `backgrnd3`… en `(-origin.x, -origin.y)` sobre un lienzo transparente del tamaño de la ventana y guardarlo en `assets/ui2/<nombre>_bg.png`.
4. Medir dónde están los cuadros blancos de texto/ranuras (en el PNG compuesto: recorrer una columna/fila y buscar tramos de píxeles ≥250) y colocar sobre ellos `div`s absolutos con el texto.
5. Pestañas y botones se guardan por estado (`_normal`, `_pressed`, `_disabled`, `_mouseOver`).

Trampas encontradas:
- Algunos sprites vienen **vacíos** (alfa 0) en los .img recortados: pestañas apagadas del Item y de la tienda de venta, y el botón `BtSpUp`. Se resolvió generándolos a partir de los encendidos (gris) o conservando el sprite antiguo (`assets/ui/spup_*.png`).
- Hay canvases que son enlaces a otro .img (campo `source`); `build_items.py` los resuelve para equipo, pero en UI hay que pedir ese .img.
- El fondo de `Stat/detail` es un degradado horizontal: para tapar una fila sobrante hay que copiar píxeles de una fila limpia, no rellenar con un color plano.

## Andamiaje en `mui.js`

- `makeWin(id, bg, w, h, x, y)` crea una ventana arrastrable con `.mw` (raíz), `.mw-in` (contenido escalado por `SC`), `.mw-bg` (imagen), `.mw-x` (cerrar). Devuelve `{inn, open, set(), toggle(), refresh()}`.
- Escala de las ventanas: `SC` (localStorage `maple_uiscale`).
- Atajos: `I` inventario, `E` equip, `S` stat, `K` skill, `T` tienda (abre el menú de 3 categorías), `C` personajes, `Esc` cancela la selección de cubo/scroll.
- `cellEl(parent, x, y, id, count, inst)` dibuja una casilla de 32 px con el icono, el borde del potencial y la cantidad con los dígitos `assets/ui2/no/0-9.png` (`ItemNo` de Basic.img, abajo a la izquierda).
- Cada ventana tiene `refresh()` con una "firma" (`isig`, `esig`, `ssig`, `hsig`) para no redibujar si nada cambió.

## Geometría de cada ventana (coordenadas dentro de la ventana, en px)

| Ventana | Tamaño / fondo | Datos clave |
|---|---|---|
| Inventario (IW) | 172×335, `item_bg.png` (UIWindow2 `Item`) | Casillas desde (11,51), paso 36 en x y 35 en y, 4 columnas, 6 filas visibles (la lista tiene 128 casillas con scroll de fila en fila: rueda, arrastre y barra en x=157). Pestañas EQUIP/USE en y=26 (activa) / 28 (inactiva). Mesos en (53,268) |
| Equip (EW) | 232×348, `equip_bg.png` (UIWindow4 `Equip`) | Ranuras de 40×39, paso 41; el icono va en (x+4,y+4). Ver `SLOTPOS` en mui.js. Pestañas CASH/PET/AD y SLOT+/VESSEL son decorativas |
| Stat (SW) | 212×284, `stat_bg.png`; Detail 212×218 `stat_det.png` | Imágenes diseñadas por el dueño. Cuadros blancos: x 69..198; filas principales en y = 32, 49, 68, 86, 104, 122 (NAME, CLASS, LV, DAMAGE, HP, MP) y 173, 190, 209, 227 (STR/DEX/INT/LUK); Detail: 41, 59, 77, 95 (mitades 70 y 166), 113, 131, 149, 167, 185. Botón DETAIL en (132,254) |
| Skill (KW) | 174×299, `skill_bg.png` (UIWindow2 `Skill/main`) | Pestañas de 30 px en x=10+31i (y 27 activa / 29 inactiva). Cabecera azul con el nombre del job en (50,61). Lista en (11,91) de 150×157; filas de 140×35 (`skrow0.png` activa, `skrow1.png` apagada). SP en (137,257) |
| Tienda (HW) | 465×328, `shop_bg.png` (UIWindow2 `Shop`) | Panel izquierdo (compra) en x=11, derecho (venta) en x=242, ambos en y=115, 5 filas de 42 px de alto (fila 34 px + hueco), iconos en (+1,+2), texto desde x=40. Botones: LEAVE (158,25), BUY (158,45), SELL (390,45). Mesos (373,65) |
| Misiones (Quest Helper) | 180 px de ancho: cabecera 25, filas repetibles, base 5 (`assets/ui2/qh/`, UIWindow2 `QuestAlarm`) | Q en (4,4), AUTO (118,4), minimizar (150,4), cerrar (165,6); lógica en `quests.js` |
| Cubos (Black/Miracle) | `assets/ui/cube/*` | Animaciones 'u','g','n' a 100 ms/frame; el icono del item va en (82,98) |

Si el dueño rediseña un fondo, solo hay que reemplazar el PNG y reajustar las coordenadas de esta tabla.

## Barra de estado

Se probó la de `StatusBar2.img` (etapa 68) y el dueño **no la quiso**; se revirtió. El HUD actual dibuja HP/MP/EXP con canvas en `drawHUD()` (game.js). La barra de vida de los enemigos es `mobBar()` (game.js): borde blanco y negro, vacío rojo oscuro, lleno verde, 8 px de alto (50 normal, 90 élite, 150 jefe).

## Fondos de mapa (Etapa 82)
backdata_<mapa>.js (window.MAPLE_BACKS.<clave>) + assets/back/<bS>/. Se generan con tools/back_from_img.py. game.js drawBack(front). El mapa (render PNG) debe tener transparencia, si no tapa el fondo.
