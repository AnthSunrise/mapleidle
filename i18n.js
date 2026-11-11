/* Idiomas (ES/EN). $t('texto en español', arg0, arg1...) devuelve el texto en el idioma elegido; {0}, {1}... se sustituyen por los argumentos.
 * El texto en español ES la clave: si no hay traducción en MAPLE_EN (lang_en.js) se muestra tal cual. Así se traduce por etapas sin romper nada.
 * El idioma se guarda en localStorage 'maple_lang' y se pregunta una sola vez al entrar; se cambia en Ajustes (recarga la página).
 * Regla: las etiquetas de botones ocultos (Personajes (C), Pociones (P), Mapa (M), Misiones (Q)) se quedan en español: el menú ☰ las busca por ese texto. */
(function (root) {
  'use strict';
  var lang = null;
  try { var l = localStorage.getItem('maple_lang'); if (l === 'es' || l === 'en') lang = l; } catch (e) {}
  var chosen = lang !== null;
  function t(s) {
    var out = lang === 'en' && root.MAPLE_EN && Object.prototype.hasOwnProperty.call(root.MAPLE_EN, s) ? root.MAPLE_EN[s] : s, a = arguments;
    if (a.length > 1) out = out.replace(/\{(\d+)\}/g, function (m, i) { return a[+i + 1] !== undefined ? a[+i + 1] : m; });
    return out;
  }
  function setLang(l) {
    if (l !== 'es' && l !== 'en') return;
    try { localStorage.setItem('maple_lang', l); } catch (e) {}
    if (root.MAPLE_GAME && root.MAPLE_GAME.save) { try { root.MAPLE_GAME.save(); } catch (e) {} }
    if (typeof location !== 'undefined') location.reload();
  }
  root.$t = t;
  root.MAPLE_I18N = { lang: function () { return lang || 'es'; }, set: setLang, chosen: function () { return chosen; }, t: t };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MAPLE_I18N;
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang || 'es';
  if (chosen) return;
  // primera vez: elegir idioma (una sola vez)
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:rgba(6,10,22,.92);display:flex;align-items:center;justify-content:center;font-family:Tahoma,Arial,sans-serif';
  var box = document.createElement('div');
  box.style.cssText = 'background:#16213f;border:2px solid #8a96c8;border-radius:12px;padding:26px 30px;text-align:center;color:#fff;box-shadow:0 8px 30px #000a;max-width:calc(100vw - 24px)';
  var h = document.createElement('div'); h.textContent = 'MapleIdle'; h.style.cssText = 'font:bold 26px Tahoma,Arial;color:#ffe9a8;margin-bottom:6px';
  var q = document.createElement('div'); q.textContent = 'Elige tu idioma / Choose your language'; q.style.cssText = 'font-size:14px;color:#cfd8ff;margin-bottom:18px';
  var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:14px;justify-content:center;flex-wrap:wrap';
  [['es', 'Español'], ['en', 'English']].forEach(function (p) {
    var b = document.createElement('button'); b.textContent = p[1];
    b.style.cssText = 'min-width:140px;padding:12px 20px;font:bold 16px Tahoma,Arial;color:#fff;background:#3a5bd0;border:1px solid #9fb4ff;border-radius:8px;cursor:pointer';
    b.addEventListener('click', function () { setLang(p[0]); }); row.appendChild(b);
  });
  var n = document.createElement('div'); n.textContent = 'Podrás cambiarlo en Ajustes / You can change it later in Settings'; n.style.cssText = 'font-size:11px;color:#8d99bd;margin-top:16px';
  box.appendChild(h); box.appendChild(q); box.appendChild(row); box.appendChild(n); ov.appendChild(box); document.body.appendChild(ov);
})(typeof window !== 'undefined' ? window : globalThis);
