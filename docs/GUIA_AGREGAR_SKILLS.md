# Guía: agregar un skill a mano (maple-idle)

Sirve para skills de 2do job en adelante. Todo vive en 4 sitios: **`skills.js`** (datos), **`buffs.js`** (solo si es un buff), **`sim.js`** (solo si hace algo nuevo) y **`assets/skill/`** (imágenes).
La mayoría de skills (pasivas, buffs de stats, ataques de área) se agregan **solo en `skills.js` + assets**, sin tocar `sim.js`.

## 0. Atajo: importador automático (hace los pasos 1 y 2 solo)

```
python3 tools/import_skill.py 210.img 2101004 fp_flame_arrow
```
Extrae el .img, copia **icono, effect, hit, ball, mob y tile** con los nombres correctos a `assets/skill/` y te imprime un **borrador de `skills.js`** con origins, delays y fórmulas ya convertidas (`d()`/`u()` → `Math.floor/ceil`). Solo completas `cls`, `branches`, `name`, `req` y el tipo, lo pegas antes de `ORDER` y agregas el id al final de `ORDER`. Si el .img es de v83 u otra región, el script lo descifra solo. Los pasos de abajo siguen sirviendo para entender qué hace cada campo.

## 1. Sacar los datos del .img

```
python3 tools/wzimg.py 110.img salida/
```
Crea `salida/tree.json` y los PNG. En `tree.json`, dentro de `skill → <id>`:
- `common`: fórmulas (`mpCon`, `damage`, `time`, `x`, `y`, `prop`, `mobCount`, `lt`/`rb` = alcance, `maxLevel`).
- `effect`: fotogramas del efecto al lanzar (cada uno con `origin` x,y y `delay` en ms).
- `hit/0`: fotogramas del golpe sobre el enemigo.
- `req`: skills requeridas y nivel.
- `icon.png`: icono.

Fórmulas del WZ: `x` = nivel, `u()` = redondear arriba, `d()` = redondear abajo. En JS: `10 + 2 * x`, `Math.ceil(x / 10)`, `Math.floor(x / 2)`.
Si el nivel máximo del juego es distinto al del WZ: `eq(x, maxWZ, maxJuego)` = `x * maxWZ / maxJuego` (en `skills.js` ya existe `eq`).

## 2. Copiar imágenes

Convención (la usa el cargador del juego, no la cambies):
- Icono: `assets/skill/<nombre>_icon.png`
- Efecto de lanzamiento: `assets/skill/<nombre>/effect_0.png`, `effect_1.png`...
- Golpe sobre enemigo: `assets/skill/<nombre>/hit_0.png`...
Los números siguen el orden del WZ. Los `origin` (x,y) van en el JS, no en el nombre.

## 3. Elegir el tipo y copiar la plantilla en `skills.js`

Pon la definición **antes** de la línea `var ORDER = [...]` y agrega el id al final de `ORDER`.
Campos comunes: `id` (único, camelCase), `cls`, `branches: ['fighter']`, `job: 2`, `skillId`, `name`, `maxLevel`, `icon`, `req: { otraSkill: 3 }` (opcional).

### A) Pasiva con stats
```js
SKILLS.miPasiva = passive({
  id: 'miPasiva', cls: 'warrior', branches: ['fighter'], job: 2, skillId: 1100000, name: 'Mi pasiva', maxLevel: 20,
  icon: 'assets/skill/mi_pasiva_icon.png',
  fx: function (x) { return { def: 5 * x }; },        // claves posibles abajo
  info: function (x) { return 'DEF +' + 5 * x; }
});
```
Claves de `fx`/`mods`: `speed` (0.1 = +10%), `hpPct`, `mpPct`, `hpLv`, `mpLv` (por nivel del personaje), `def`, `eva`, `crit` (0.05 = 5%), `critDmg`, `range`, `absorb`, `att` (ATT plano), `pStr`, `pDex`, `mastery` (daño mínimo/máximo), `atkSpeed` (0.25 = +25%), `reflect` (% reflejado), `reflectMax`.

### B) Buff (self o party)
```js
SKILLS.miBuff = {
  id: 'miBuff', cls: 'warrior', branches: ['fighter'], job: 2, skillId: 1101006, name: 'Mi buff', maxLevel: 20,
  buff: 'miBuff',                                   // id en buffs.js
  icon: 'assets/skill/mi_buff_icon.png', dir: 'assets/skill/mi_buff/',
  mods: function (x) { return { att: 10 + x }; },
  duration: function (x) { return 55 + 5 * x; },    // segundos
  mpCon: function (x) { return 10 + x; }, renewAt: 8,
  info: function (x) { return 'ATT +' + (10 + x); },
  hitAt: 0.3, total: 0.84, effectDelay: 60,         // pose alert2; ms por fotograma del efecto
  effect: [[30, 43], [42, 73]].map(function (a) { return { ox: a[0], oy: a[1] }; })   // origin de cada fotograma
};
```
Y en `buffs.js` agrega la entrada (copia la de `rage`; `party: true` si lo reciben todos los del mapa):
```js
miBuff: { id: 'miBuff', name: 'Mi buff', desc: '...', duration: 60, party: false, mods: {}, icon: 'assets/skill/mi_buff_icon.png', letter: 'M', color: '#d83a3a' },
```

### C) Ataque de área (como Ground Smash)
Copia `SKILLS.ftGroundSmash` y cambia: `damage` (% del daño base), `mpCon`, `mobCount`, `range` (`x1,x2,y1,y2` en px frente al personaje, del `lt`/`rb` del WZ espejado), `effect` y `hit` con sus origin, `windup` / `hitAt` / `total` en segundos, `action` (animación del personaje: `swingO1`, `swingO2`...).

### D) Movimiento (Teleport / Leap)
Copia `SKILLS.ftWarriorLeap`: `teleportSkill: true`, `dist(x)`, `vert(x)`, `cooldown`, `mpCon`.

## 4. Si hace algo nuevo
Un skill con un efecto que no existe (veneno, aturdir, curar...) necesita código en `sim.js`. Mira cómo se hizo con lo existente:
- Reflejar daño: `stepTouch` (busca `reflect`).
- Debuff a enemigos: `doDebuffCast` / `m.debuff` (Threaten).
- Golpe extra tras ataque normal: `doHit` + `finalAttackSkill`.
- Stats nuevos: agrégalos a `MOD_KEYS` y úsalos donde corresponda (`cstats`, `atkSpeed`...).

## 5. Comprobar
```
node test_fighter.js        # ejemplo de test de un job
node test_sp.js && node test_firstjob.js
```
Un test mínimo: crear un personaje, `S.advanceJob(w, c, 'fighter')`, poner `w.skills.miSkill.level = 20`, avanzar `S.step(w, S.STEP)` unos segundos y comprobar `S.mods(c)` o los buffs `c.buffs`. Abre `index.html` y revisa la pestaña II de la ventana de skills (K).

**Reglas:** los SP del 2do job deben sumar **120** por rama (3 SP × Lv30–69). Con `eq()` el nivel máximo del juego siempre da el valor vanilla del WZ.

---

# Prompt para Gemini (copiar y pegar, adjuntando `skills.js` y el `tree.json` del .img)

```
Estoy haciendo un juego idle de MapleStory en HTML5 Canvas + JavaScript vanilla (sin librerías).
Te adjunto skills.js (definiciones de skills) y el tree.json de un .img del WZ con el skill que quiero agregar.

Tarea: agrega el skill <NOMBRE> (id <ID_WZ>) para la rama <RAMA> del 2do job.

Reglas del proyecto:
- Cada skill es un objeto en SKILLS con: id, cls, branches, job: 2, skillId, name, maxLevel, icon, req.
- Las pasivas usan passive({...}) con fx(x) que devuelve claves como def, speed, crit, att, pStr, pDex, mastery, atkSpeed, reflect.
- Los buffs llevan buff:'<id>', mods(x), duration(x), mpCon(x), effect[{ox,oy}] y una entrada en buffs.js.
- Los ataques de área llevan damage(x), mpCon(x), mobCount, range{x1,x2,y1,y2}, effect[], hit[], windup/hitAt/total.
- Las fórmulas del WZ usan x como nivel, u() = Math.ceil, d() = Math.floor. Si el nivel máximo del juego difiere del WZ, usa eq(x, maxWZ, maxJuego).
- Agrega el id al final del array ORDER, antes de cerrarlo.
- Los PNG van en assets/skill/<nombre>_icon.png, assets/skill/<nombre>/effect_N.png y hit_N.png.

Dame solo los fragmentos de código a insertar (con el archivo y el lugar exactos), la lista de PNG a copiar con sus rutas, y cualquier cambio necesario en buffs.js. No reescribas los archivos completos. Si el skill necesita una mecánica nueva que no existe, dímelo antes de inventarla.
```
