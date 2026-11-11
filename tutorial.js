/* Tutorial: ayudas paso a paso que no bloquean el juego. Se inicia al crear el primer personaje (evento 'maple:firstchar'),
 * se puede saltar y se repite con el botón «Tutorial» de Ajustes. Para añadir un paso: agrega un objeto a STEPS (title, text, target opcional). */
(function () {
  'use strict';
  var $t = window.$t || function (x) { return x; };
  var KEY = 'maple_tut';   // 'done' cuando se terminó o se saltó
  // show: ventana que se abre en ese paso (ver MAPLE_UI.show); target: 'css:selector', 'btn:texto' o 'menu:Entrada' (resaltado); la tarjeta se coloca junto al objetivo; noring: no dibujar el recuadro
  // En el texto, [así] sale en negrita y una línea en blanco separa párrafos. img: imagen de muestra en assets/tutorial/
  var STEPS = [
    { title: '¡Bienvenido a MapleIdle!',
      text: 'Has creado tu nuevo personaje, ¡enhorabuena! Parece que no nos hemos presentado, soy la [Maple Admin!], vamos a tomar un par de minutos para explicarte cómo funciona el juego.' },
    { title: '¿Cómo funciona el juego?',
      text: 'En [MapleIdle] los personajes tienen un sistema de ataque automatizado, podrás ver a tus personajes actuar por sí mismos atacando al enemigo más cercano para obtener experiencia y objetos.' },
    { title: 'Sistema de Party', target: 'css:.mc-list', img: 'party_sample.png',
      text: 'En este juego podrás crear varios personajes los cuales podrán formar parte de una party, ayudándose mutuamente con buffs y experiencia compartida para todos los personajes en el mismo mapa.' },
    { title: 'Sistema de Combate', show: 'menu', target: 'menu:Personajes',
      text: 'En la opción de [Personajes] (C) en el menú, podrás ver todos los personajes que tienes creados junto a su nivel y clase.' },
    { title: 'Sistema de Combate', show: 'chars', target: 'btn:Zona',
      text: 'Con la opción [Zona] podrás asignar una zona para tu personaje, haciendo que solo busque enemigos en dicha área, ayudándote a optimizar tus áreas de farmeo.\n\nHaciendo clic derecho en uno de tus personajes, podrás también asignar a un miembro de tu grupo como [Party Leader], marcado con una corona (♛). Esto hará que todos tus personajes ataquen al mismo enemigo que su líder, ignorando por completo sus zonas de farmeo, lo cual es útil para ayudar en áreas con Jefes.' },
    { title: 'Sistema de Skills', show: 'menu', target: 'menu:Skill', img: 'skill_sample.png',
      text: 'A partir de nivel 10, tus personajes podrán ganar [Skill Points (SP)] que podrás usar para subir de nivel tus habilidades en el menú de Skills (K).\n\nCada skill de ataque tiene una casilla [Auto]: si está marcada, se usa sola cuando sale de enfriamiento. Los buffs se renuevan solos al estar marcados con [Auto].' },
    { title: 'Sistema de Stats', show: 'menu', target: 'menu:Stat', img: 'stats_sample.png',
      text: 'Cada nivel, tus personajes ganan [Ability Points (AP)], lo cual los ayuda a ganar daño y stats adicionales. Por defecto, todos los personajes ganan 5 de AP tras cada nivel, asignados a su stat principal. En la ventana de Stats (S) puedes ver toda esta información en detalle.' },
    { title: 'Sistema de Pociones', show: 'pots', target: 'css:.mi-pots',
      text: 'En este juego, para curar a tus personajes puedes usar pociones de [HP] y [MP], las cuales se consumen según el porcentaje que coloques en esta ventana. Cabe destacar que [la configuración de pociones es distinta para cada personaje], así que tendrás que configurar todas por separado.\n\nPara elegir qué poción usar, abre tu inventario (I), ve a la pestaña [USE] y haz clic en la poción que quieras asignar.' },
    { title: 'Mapa Mundial', show: 'map',
      text: 'En esta opción puedes ver todas las áreas del juego y su respectivo nivel. A partir de nivel 10 podrás navegar libremente a cualquier mapa del juego; sin embargo, ¡ten en cuenta que algunos enemigos pueden ser muy duros para tu nivel!\n\nAlgunos mapas tienen mecánicas distintas, como mayor EXP por cada miembro del party, enemigos fuertes para matar con un party entero y obtener mejores recompensas, e incluso limitaciones de cuántos personajes pueden estar en el mismo mapa.' },
    { title: 'Tienda', show: 'shop', target: 'shop:', noring: true,
      text: 'Cada vez que derrotes enemigos te darán [Mesos] y [Scroll Pieces]. Puedes usar ambos en la tienda (T) para comprar pociones para tus personajes, o comprar scrolls y cubos para mejorar los objetos de tus personajes.' },
    { title: '¡Diviértete!', show: 'menu', target: 'menu:Ajustes', last: true,
      text: 'Con esto deberías poder valerte por ti mismo. Si necesitas ayuda, siempre puedes volver a consultar el tutorial con el botón [Tutorial] en los Ajustes del juego.\n\nPor cierto: en [Misiones] (Q) tienes unas misiones de bienvenida con regalos para empezar.' }
  ];

  var css = document.createElement('style');
  css.textContent =
    '.tu-card{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147482400;width:min(500px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;background:rgba(18,22,40,.97);color:#eee;font:13px/1.5 sans-serif;border:1px solid #8a96c8;border-radius:10px;padding:14px 16px;box-shadow:0 6px 24px rgba(0,0,0,.5)}' +
    '.tu-h{font:bold 15px sans-serif;color:#ffe9a8;margin-bottom:6px;display:flex;justify-content:space-between;align-items:baseline}.tu-n{font:11px sans-serif;color:#9aa6d0}' +
    '.tu-act{display:flex;gap:8px;justify-content:space-between;margin-top:12px}.tu-act button{background:#23305a;color:#fff;border:1px solid #6b7bb5;border-radius:6px;padding:6px 12px;font:bold 12px sans-serif;cursor:pointer}' +
    '.tu-act button.tu-go{background:#3a5bd0;border-color:#9fb4ff}.tu-act button.tu-skip{background:none;border-color:#445;color:#9aa6d0}' +
    '.tu-card.bot{top:auto;bottom:16px;transform:translateX(-50%)}.tu-card p{margin:0 0 8px}.tu-card img.tu-img{display:block;max-width:100%;max-height:260px;object-fit:contain;margin:8px auto 0;border:1px solid #445;border-radius:6px}' +
    '.tu-ring{position:fixed;z-index:2147482300;pointer-events:none;border:3px solid #ffe45c;border-radius:8px;box-shadow:0 0 0 2000px rgba(0,0,0,.28),0 0 14px 4px rgba(255,228,92,.8);animation:tupulse 1.1s ease-in-out infinite}' +
    '@keyframes tupulse{50%{box-shadow:0 0 0 2000px rgba(0,0,0,.28),0 0 22px 8px rgba(255,228,92,.45)}}' +
    '';
  document.head.appendChild(css);

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function put(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* sin almacenamiento: el tutorial se ofrece de nuevo */ } }

  var card = null, ring = null, idx = 0, timer = null;

  function findTarget(t) {
    if (!t) return null;
    if (t.indexOf('css:') === 0) return document.querySelector(t.slice(4));
    if (t === 'shop:') return window.MAPLE_UI ? window.MAPLE_UI.shopMenu() : null;
    if (t.indexOf('menu:') === 0) return window.MAPLE_UI ? window.MAPLE_UI.entry(t.slice(5)) : null;
    var txt = $t(t.replace(/^btn:/, '')), bs = document.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) if (bs[i].textContent.trim().indexOf(txt) === 0 && bs[i].offsetParent !== null) return bs[i];
    return null;
  }
  function fixedAncestor(e) { while (e && e !== document.body) { if (getComputedStyle(e).position === 'fixed') return e; e = e.parentElement; } return e; }
  // coloca la tarjeta junto al elemento resaltado (o su ventana): a su izquierda/derecha, o debajo si está centrado; sin objetivo queda centrada
  function layout(t) {
    if (!card) return;
    card.style.left = card.style.top = card.style.right = card.style.bottom = card.style.transform = '';
    if (!t || innerWidth < 700) { if (t) { card.style.top = 'auto'; card.style.bottom = '12px'; card.style.left = '50%'; card.style.transform = 'translateX(-50%)'; } return; }
    var a = fixedAncestor(t), r = (a || t).getBoundingClientRect(), tr = t.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight, gap = 14, x, y;
    var cx = (r.left + r.right) / 2;
    if (Math.abs(cx - innerWidth / 2) < innerWidth * 0.2) { x = cx - w / 2; y = r.bottom + gap; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - gap); }
    else if (cx > innerWidth / 2) { x = r.left - w - gap; y = tr.top; }
    else { x = r.right + gap; y = tr.top; }
    if (x < 8 || x + w > innerWidth - 8) { x = Math.max(8, Math.min(innerWidth - w - 8, x)); y = Math.min(r.bottom + gap, innerHeight - h - 8); }
    card.style.left = Math.round(Math.max(8, x)) + 'px'; card.style.top = Math.round(Math.max(8, Math.min(innerHeight - h - 8, y))) + 'px'; card.style.transform = 'none';
  }
  function place() {
    var s = STEPS[idx], t = findTarget(s && s.target);
    layout(t);
    if (!t || s.noring) { if (ring) ring.style.display = 'none'; return; }
    var r = t.getBoundingClientRect();
    if (!r.width) { if (ring) ring.style.display = 'none'; return; }
    if (!ring) { ring = el('div', 'tu-ring'); document.body.appendChild(ring); }
    ring.style.display = 'block';
    ring.style.left = (r.left - 4) + 'px'; ring.style.top = (r.top - 4) + 'px'; ring.style.width = (r.width + 2) + 'px'; ring.style.height = (r.height + 2) + 'px';
  }
  function close(done) {
    if (card) { card.remove(); card = null; }
    if (ring) { ring.remove(); ring = null; }
    clearInterval(timer); timer = null;
    if (window.MAPLE_UI) window.MAPLE_UI.closeAll();
    if (done) put('done');
  }
  // texto con [negritas] y párrafos separados por línea en blanco
  function fill(box, text) {
    text.split('\n\n').forEach(function (par) {
      var p = el('p');
      par.split(/\[([^\]]+)\]/).forEach(function (seg, i) { if (!seg) return; if (i % 2) p.appendChild(el('b', '', seg)); else p.appendChild(document.createTextNode(seg)); });
      box.appendChild(p);
    });
  }
  function show() {
    var s = STEPS[idx];
    if (card) card.remove();
    if (window.MAPLE_UI) { window.MAPLE_UI.closeAll(); if (s.show) window.MAPLE_UI.show(s.show); }
    card = el('div', 'tu-card');
    var h = el('div', 'tu-h'); h.appendChild(el('span', '', $t(s.title))); if (!s.last) h.appendChild(el('span', 'tu-n', (idx + 1) + ' / ' + (STEPS.length - 1))); card.appendChild(h);
    fill(card, $t(s.text));
    if (s.img) { var im = el('img', 'tu-img'); im.src = 'assets/tutorial/' + s.img; im.alt = ''; card.appendChild(im); }
    var act = el('div', 'tu-act'), skip = el('button', 'tu-skip', $t('Saltar tutorial')); skip.addEventListener('click', function () { close(true); });
    var right = el('div'); right.style.cssText = 'display:flex;gap:8px';
    if (idx > 0) { var pv = el('button', '', $t('Anterior')); pv.addEventListener('click', function () { idx--; show(); }); right.appendChild(pv); }
    var nx = el('button', 'tu-go', s.last ? $t('Entendido') : $t('Siguiente'));
    nx.addEventListener('click', function () { if (s.last) close(true); else { idx++; show(); } });
    right.appendChild(nx); act.appendChild(skip); act.appendChild(right); card.appendChild(act);
    ['keydown', 'wheel'].forEach(function (ev) { card.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    document.body.appendChild(card);
    place();
    if (!timer) timer = setInterval(place, 250);   // los botones/paneles se mueven al redimensionar
  }
  function start() { idx = 0; show(); }

  addEventListener('maple:firstchar', function () { if (get() !== 'done') setTimeout(start, 400); });
  window.MAPLE_TUTORIAL = { start: start, close: close, STEPS: STEPS };
})();
