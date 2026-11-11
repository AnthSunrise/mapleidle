# Hoja de ruta

Estado: Etapa 87e entregada (ver `07_EQUIPOS_MASIVOS.md`: 1006 equipos reales, ranuras nuevas, tooltips, reglas de equipo). Traducción ES/EN completa (salvo el panel de skills viejo oculto de ui.js). Antes: etapa 85. Hecho hasta aquí: tutorial de 10 pasos y misiones de bienvenida, 5 clases base, 12 ramas de 2º job con skills, equipo real del WZ con capas, potenciales + cubos + scrolls (con UI original), 7 mapas jugables (Henesys → Wild Boar Land), élites y field bosses, offline/segundo plano, penalización de EXP, ventanas rediseñadas (Equip, Inventario, Stat, Skill, Tienda con 3 categorías y 8 pociones nuevas).

## PENDIENTES ACTUALES (etapa 87e, en orden sugerido)

1. **Fórmula de daño por tipo de arma**: hoy `CLASSES` en `items.js` usa un multiplicador por clase calibrado con el arma inicial (Pirate 6.185 + starAtt 13.6). Pasar a multiplicador por tipo de arma (tabla moderna: espada 1M 1.24, knuckle 1.70, etc.) calibrando con capturas Stat del servidor del dueño a varios niveles (arma/ATT incluidos). Revisar los rangos por clase: el Brawler quedaba ~40% sobre el Warrior.
2. **Tablas de drop por enemigo** (sustituir el pool global provisional de `rollDrop`): `mobRewards[nombre].drops = [{id,p,min,max}]` con los IDs reales (el dueño las organiza con otra IA). Incluir jefes y Black Cubes.
3. **Bono de EXP de party** (~10% por miembro; el tutorial ya lo promete; ya existe `charLimit` por mapa).
4. **Boss/party areas** (hoja 3), **tienda de equipos de boss** (hoja 5), **chat log** y **Black Cubes por misiones diarias** (hoja 7), tope opcional de juego en segundo plano.
5. **Efectos de boss/ied en combate** (hoy solo se muestran en el tooltip) y defensa de mobs (Ignore DEF).
6. **3er y 4to job**: lo está haciendo el dueño (hoja 1 sigue siendo el procedimiento).
7. **Menores**: `reqJob` 9 sin soporte; Corcell Hat y 3 equipos no encontrados; limpiar `ui.js` antiguo; medir rendimiento móvil (layerdata 5,5 MB); fondos animados de Kerning (falta metroSubway2.img).

Ordenado de lo más pesado a lo más ligero.

## 1. 3er y 4to job (lo más grande)

Ramas de 2º job existentes → líneas completas:

| Clase | Rama (2º) | 3º | 4º |
|---|---|---|---|
| Warrior | Fighter | Crusader | Hero |
| Warrior | Page | White Knight | Paladin |
| Warrior | Spearman | Dragon Knight | Dark Knight |
| Mage | Wizard F/P | Mage F/P | Arch Mage F/P |
| Mage | Wizard I/L | Mage I/L | Arch Mage I/L |
| Mage | Cleric | Priest | Bishop |
| Archer | Hunter | Ranger | Bow Master |
| Archer | Crossbowman | Sniper | Marksman |
| Thief | Assassin | Hermit | Night Lord |
| Thief | Bandit | Chief Bandit | Shadower |
| Pirate | Brawler | Marauder | Buccaneer |
| Pirate | Gunslinger | Outlaw | Corsair |

(Los nombres y skills exactos salen de los .img de skills del servidor del dueño; él puede usar un asistente para el listado y las fórmulas.)

Alcance: ~24 jobs × 8–12 skills ≈ 250 skills. Muchas son clones/variantes de skills ya hechas; las nuevas que necesitan mecánica propia son lo difícil (invocaciones nuevas, estados nuevos, skills de transformación, Hyper Body/Maple Warrior de party, Heal/Bless, stances, Shadow Partner, Sharp Eyes, Final Attack, etc.).

Procedimiento por rama (hacer UNA rama completa y probarla antes de la siguiente):
1. Pedir al dueño: `.img` de las skills de esa rama y del 3er job (ej. `1110.img`), y los sprites de equipo si hay arma/ropa nueva. `python3 tools/wzimg.py 1110.img /tmp/x`.
2. Importar con `tools/import_skill.py archivo.img <idSkill> <nombre_corto>` por cada skill: copia PNG y da un borrador. Pegarlo en `skills.js` ANTES de `var ORDER` con `job: 3`, `branches: ['fighter']` (la rama sigue siendo la del 2º job; no hace falta otra rama), `req` de las previas.
3. Añadir el id al final de `ORDER`.
4. Si es un buff nuevo: entrada en `buffs.js`. Si es mecánica nueva: función en `sim.js` (ver `doBuffCast`, `doSkillHit`, `stepExtras`); añadir claves a `MOD_KEYS` si hace falta.
5. Escribir `tests/test_<rama>3.js` (copiar `test_sp2.js`): que se pueda aprender con el SP disponible, que la fórmula dé los valores del WZ, y un combate corto que use la skill.
6. SP: el 3er job reparte 3 SP × (Lv70–99) y el 4º 3 SP × (Lv100–200) (`JOB_START`). Si las skills de la rama suman más de lo que da el presupuesto, usar `maxLevel` reducido con `rescale()` (conserva el valor del máximo anterior) y `free:true` para skills regaladas — ya se hizo así en el 2º job (etapas 66–67).
7. Decidir con el dueño el momento y forma de avanzar a 3º/4º (automático al nivel o con una carta/misión). La pestaña III/IV del Skill ya existe vacía.
8. Equilibrar daño: el 2º job ya causa powercreep; ajustar con `hpMul` de los mobs de las zonas altas, no con las skills.

Riesgo principal: volumen. Mitigación: entregar por rama y empezar por las clases con menos mecánica nueva (Hunter→Ranger→Bow Master, Fighter→Crusader→Hero).

## 2. Zonas Lv70–200 con sus mobs, drops y balance

- El dueño rippea mapas y enemigos del juego (v83 para layout y render, mobs de versiones actuales). Flujo en `GUIA_AGREGAR_MAPAS.md` (`map_from_img.py` + `import_mob.py` + entrada en `maps.js`).
- Lo que no es dato: curva de EXP y daño del Lv70 al 200 (`exptable.js`, `mobRewards`, `hpMul/expMul`), y que la penalización de EXP (−10% desde 21 niveles) no rompa el ritmo.
- Mapas altos/custom pueden traer footholds raros o enemigos voladores: probar la IA (`stepAI`) con un test de `test_maps.js`/`test_floors.js` antes de entregar.

## 3. Bosses y áreas de party

- Menú "Bosses" con lista de desbloqueados, party asignada, cooldown tras fallar/derrotar, recompensa por daño hecho o por matar.
- Cada boss: patrón de ataques y fases (hoy solo existe el field boss con HP alto), tabla de drop con cubos: jefes = mezcla Black + Super Miracle, áreas de party = Super Miracle común.
- Depende de (1) para el balance y de (4) para los drops.

## 4. Tablas de drop por enemigo

Hoy los drops son globales (`dropLoot` en sim.js). Pasar a `drops: [{id, p, min, max}]` dentro de `mobRewards[nombre]`; los scroll pieces, equipo y cubos se reparten por zona. Lo laborioso son los datos, no el código. Hacerlo junto con (2).

## 5. Tienda: equipos + lista editable

- Añadir a `SHOP` entradas `{id, price, cat:'equip'}` (nueva categoría y tarjeta); al comprar, 1 unidad con instancia `{id, pot:{tier:1,…}}` (Rare al 100%).
- Mover `SHOP` a su propio archivo de datos (`shopdata.js`) con categorías para que el dueño la edite sin tocar `items.js`.

## 6. Cambio de idioma ES/EN (base hecha en etapa 80: ver docs/06_IDIOMAS.md; faltan los textos del resto de archivos)

Extraer todos los textos de `mui.js`, `game.js`, `ui.js`, `chars.js`, `worldmap.js`, `items.js` (descripciones, tooltips) a un diccionario `T.es`/`T.en` con una función `t('clave')`. Hacerlo cuanto antes: cada etapa nueva añade más texto. Los nombres de skills/items ya están en inglés.

## 7. Menores

- Chat log (scroll con resultados de scrolls y drops raros).
- Black Cubes por misiones diarias (y misiones diarias en general: mesos, equipos, cupones).
- Bono de EXP de party (~10% por miembro) y límite de personajes por mapa (`CharLimit`).
- Tope opcional de horas de juego en segundo plano en PC.
- Optimización móvil (el dueño la pidió; no se ha medido).
- Stats de la ventana Detail sin sistema: Ignore DEF (los mobs no tienen defensa) — decidir si añadir defensa a los mobs.
- Pendiente de verificar: equipo con potencial invisible en el personaje (etapa 65 puso una corrección defensiva; si reaparece, pedir captura y los ids).

## Orden recomendado

(7: compra de equipos + chat log) → (4+2: drops y zonas con lo que ya existe) → (6: idioma) → (1: 3er job rama por rama, probando cada una) → (3: bosses) → 4º job.
