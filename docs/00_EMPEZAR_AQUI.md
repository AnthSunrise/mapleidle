# maple-idle — empieza aquí

Juego idle 2D estilo MapleStory (HTML5 Canvas + JavaScript puro, sin librerías ni compilación). Corre abriendo `index.html` (incluso desde `file://`) y también desde GitHub Pages. Guarda la partida en `localStorage` (`maple_save`).

## Mapa de documentos

| Archivo | Para qué sirve |
|---|---|
| `00_EMPEZAR_AQUI.md` | Este índice y los comandos básicos |
| `01_ARQUITECTURA.md` | Qué hace cada archivo, orden de carga, formato de datos y de la partida |
| `02_UI_Y_SPRITES.md` | Cómo se construyen las ventanas (Equip, Inventario, Stat, Skill, Tienda) con sprites de los .img |
| `03_REGLAS_DE_DISENO.md` | Decisiones de diseño ya tomadas (no hay que volver a preguntarlas) |
| `04_HOJA_DE_RUTA.md` | Lo que falta, ordenado, con el plan paso a paso de lo más difícil |
| `05_PROMPT_PARA_OTRA_IA.md` | Texto para pegar al empezar con otro asistente |
| `06_IDIOMAS.md` | Cómo funciona ES/EN (`$t`, `lang_en.js`) |
| `07_EQUIPOS_MASIVOS.md` | Flujo lista → equipos del juego, reglas de equipo, tooltips, pendientes |
| `GUIA_AGREGAR_ITEMS.md` / `_SKILLS.md` / `_MAPAS.md` | Guías manuales (equipo, skills, mapas+enemigos) |
| `../LEEME.txt` | Historial de TODAS las etapas (qué se cambió y por qué). Léelo de abajo hacia arriba para ver lo último |

## Comandos

```bash
# Probar el juego: abre index.html en el navegador (Brave/Chrome).
# Correr las pruebas (Node 18+; sim.js no usa DOM, por eso se prueba sin navegador):
cd tests && ./run_all.sh          # todas, ~5 min; imprime "ok" o "FALLA" por archivo
node tests/test_items.js          # una sola; busca líneas "FALLA"
```

Una prueba que imprime solo líneas `OK` está bien. `test_assassin.js` es intermitente (falla alguna vez por azar; repítela).

## Herramientas (carpeta `tools/`, necesitan Python 3 + Pillow)

| Herramienta | Uso |
|---|---|
| `wzimg.py archivo.img carpeta` | Extrae un .img crudo de MapleStory: PNG de cada canvas + `tree.json` (origin, tamaño). Es la base de todo lo demás |
| `import_skill.py` | .img de skill → PNG con los nombres del juego + borrador para `skills.js` |
| `import_mob.py` | .img de enemigo → sprites + líneas para `mobTypes`/`mobRewards` de `sim.js` |
| `map_from_img.py` | .img de mapa → `mapdata_<id>.js` (footholds, escaleras, spawns) |
| `add_items.py`, `build_items.py`, `gen_itemdata.py`, `build_layers.py` | Equipo: iconos, `itemdata.js` y capas del personaje (`layerdata.js`) |

Semántica de origen en WZ: un canvas se dibuja en `(-origin.x, -origin.y)` respecto a la esquina de la ventana (origin negativo = posición positiva).

## Entrega por etapas (preferencia del dueño)

El dueño recibe SOLO los archivos cambiados de cada etapa en un zip (`maple-idle-etapaNN-cambios.zip`, con rutas `maple-idle/xxx.js`) más una lista corta de cambios, y la etapa se anota al final de `LEEME.txt`. Sus archivos mandan: si él editó un archivo, vuelve a leerlo antes de tocarlo (hay que sincronizar, no pisar).
