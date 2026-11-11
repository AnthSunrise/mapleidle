# Decisiones de diseño ya tomadas

Resumen de lo que el dueño decidió. No volver a preguntarlo; si algo cambia, que lo diga él.

## Personajes y progreso
- Clases base: Warrior, Mage, Archer, Thief, Pirate. Jobs: 1º (Lv1; las skills de 1st job se desbloquean a Lv10, 60 SP), 2º (Lv30, 120 SP por rama), 3º (Lv70), 4º (Lv100). 3 SP por nivel. Nivel máximo 200.
- Al llegar a Lv30 elige rama (character cards). Armas provisionales al avanzar: Spearman Forked Spear 1432002, Crossbowman Maple Crow 1462069, Gunslinger Maple Gun 1492042, Bandit Cass 1332012 + Seclusion Wristguard 1092018. Si el inventario no tiene hueco para todas, el avance se cancela.
- AP iniciales: fighter/pirate 12/5/4/4 (STR/DEX/INT/LUK), mage 4/4/12/5, archer 5/12/4/4, thief 4/5/4/12; +5 AP por nivel al stat principal. Gunslinger intercambia STR y DEX al avanzar. Stat se muestra como "STR 400 (AP + extra)".
- Multi-personaje: inventario EQUIP/USE y mesos compartidos; SP, nivel, HP, MP y equipo puesto por personaje. Party (mismo mapa): quien mata recibe 100% de EXP, el resto 50%; no aplica con ~25 niveles de diferencia. Pendiente: bono de EXP en party (~10% por miembro) y límite de personajes por mapa (`CharLimit`, ya existe `mapLimit`).
- Líder de party: clic derecho; los seguidores atacan el objetivo del líder.
- Muerte: pierde 5% de EXP (nunca baja de nivel), revive a los 10 s.

## Combate
- Acierto solo por diferencia de nivel: −5% por nivel de menos, 100% si el nivel es igual o mayor. DEX/LUK no influyen. (Por eso las "accuracy" de la ventana Stat no existen.)
- Esquiva: `eva/(eva+600)`, una sola para todo tipo de ataque.
- DEF del equipo reduce el daño recibido: `def/(def+100)`.
- Velocidad de ataque fiel a MapleStory (etapas de arma; Booster = 2 etapas; magos fijos salvo Booster; el Pirate es el rápido de forma natural).
- Penalización de EXP por nivel: desde 21 niveles por encima del mob −10%, y −1% por nivel extra, hasta −60%. Solo enemigos normales (no field boss ni boss).
- Elite enemies: tras matar cierta cantidad aparece una versión gigante (~x15 HP) con mucha EXP y mesos. Field bosses por mapa (p. ej. Mushmom) con respawn largo y buenos drops.
- Mobs idénticos al WZ salvo ajustes con `hpMul`/`expMul` por enemigo (los personajes pegan fuerte por powercreep del 2º job).
- Ritmo deseado: ~2 h de juego activo a velocidad normal para llegar a Lv30 con una party de 5. x4 de velocidad es solo herramienta de depuración.

## Offline y segundo plano
- Offline = 25% de lo ganado, tope 4 h de ausencia (=1 h de farmeo activo), mínimo 60 s. Solo EXP y mesos, sin objetos, nunca sube de nivel.
- En PC la pestaña oculta sigue progresando (Worker + respaldo). Pendiente opcional: tope de horas de juego activo en segundo plano (el dueño no ha respondido).

## Equipo, potenciales, cubos y scrolls
- Potencial: 4 rangos (Rare, Epic, Unique, Legendary) con color, 3 líneas (1 principal + 2), líneas útiles (STR/DEX/INT/LUK %, ATT/MATT %, Crit %, Crit Dmg %, Boss %, All Stats %, HP %); casi sin líneas basura. Todos los equipos menos el equipo inicial.
- Cubos: solo funcionan en equipo que YA tiene potencial. Miracle Cube sube como máximo a Unique; Super Miracle puede llegar a Legendary; Black Cube con UI de comparar antes/después. Tienda de mesos (Enhance) + drops: áreas de party dan Super Miracle (común), jefes mezclan Black + Super Miracle. Black Cubes también por misiones diarias (pendiente).
- Scrolls: 100/60/10% dan +1/+2/+3 (guante ATT; armas stat principal + ATT/MATT; armadura/accesorios STR/DEX/INT/LUK); Chaos 60% −5..+5 solo en stats que ya tiene; cada intento gasta 1 slot y el nombre muestra "(+X)" = aciertos; Clean Slate devuelve un slot perdido; White Scroll protege el slot del siguiente intento ("Upgrade count protection active."). Los scroll pieces se canjean en la tienda.
- Flujo de uso (como MapleStory): clic en el cubo/scroll en USE → se abre la pestaña Equip con los objetos no válidos atenuados → elegir equipo → ventana de confirmación → cubo abre su UI original; scroll muestra el resultado en la misma confirmación.
- Stacks USE hasta 9999.

## Tienda
- Menú con 3 tarjetas: **Consumibles** (pociones), **Scrolls** (scroll pieces), **Enhance** (cubos). Cada ítem de `SHOP` lleva `cat`. El dueño diseñará sus propios botones/tarjetas.
- Venta al NPC: pociones 50% del precio de compra; equipo `20 + nivel*15`. Clic derecho en un objeto = vender al instante.
- Pendiente: equipos en la tienda (se compra 1 unidad, con potencial Rare al 100%), con su propia lista editable por categorías.

## Interfaz
- UI fiel a MapleStory con los sprites de sus .img. Barra inferior original (la de StatusBar2 se rechazó). Nombre y nivel grandes abajo a la izquierda.
- Futuro: "chat log" (resultados de scrolls, drops raros), cambio de idioma ES/EN, optimización móvil.
- El dueño corre un servidor Swordie y puede extraer cualquier sprite de los WZ; prefiere renders de mapa completos (en vez de tiles sueltos).
