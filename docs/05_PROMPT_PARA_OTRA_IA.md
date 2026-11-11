# Prompt para empezar con otro asistente

Pega esto al abrir la conversación y adjunta el proyecto (la carpeta `maple-idle` completa, o el zip, con `docs/` dentro).

---

Voy a continuar un proyecto existente: un idle game 2D estilo MapleStory hecho en HTML5 Canvas + JavaScript puro (sin librerías ni compilación), en la carpeta `maple-idle/`. Está terminado hasta la "Etapa 87e". Léete en este orden: `docs/00_EMPEZAR_AQUI.md`, `docs/01_ARQUITECTURA.md`, `docs/03_REGLAS_DE_DISENO.md`, `docs/04_HOJA_DE_RUTA.md` (empieza por «PENDIENTES ACTUALES»), `docs/07_EQUIPOS_MASIVOS.md` y el final de `LEEME.txt` (historial de etapas). Las guías `docs/GUIA_AGREGAR_*.md` explican cómo agregar items, skills y mapas.

Reglas de trabajo:
- Respóndeme en español, conciso. Soy el dueño de un servidor privado de MapleStory (Swordie); sé extraer sprites de los WZ con HaRepacker y los paso como `.img` crudos. Edito archivos a mano, así que mis archivos mandan: vuelve a leer el archivo antes de editarlo.
- Entrega por etapas pequeñas: solo los archivos que cambien, en un zip `maple-idle-etapaNN-cambios.zip` (rutas `maple-idle/...`), con una lista corta de cambios, y anota la etapa al final de `LEEME.txt`. Las tareas grandes se parten; no hagas todo de una vez.
- La lógica va en `sim.js` (sin DOM, probable con Node); la interfaz en `game.js`/`mui.js`. Toda mecánica nueva lleva una prueba en `tests/test_*.js` y debes correr `tests/run_all.sh` antes de entregar (`test_assassin.js` y `test_page.js` fallan alguna vez por azar).
- No vuelvas a preguntar decisiones ya tomadas: están en `docs/03_REGLAS_DE_DISENO.md`.
- Para lo gráfico, verifica con capturas (Chromium + Playwright) antes de decir que algo está listo. Sé honesto sobre lo que no pudiste probar.
- Para sprites nuevos usa `tools/wzimg.py` y `tools/import_*.py`; si un sprite viene vacío o falta, dímelo en vez de inventarlo.

Primera tarea: confirma que entiendes la estructura corriendo las pruebas y resumiéndome en 10 líneas cómo se define una skill nueva de 3er job. Luego seguimos con el siguiente punto de la hoja de ruta.

---
