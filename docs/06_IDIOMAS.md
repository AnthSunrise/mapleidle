# Idiomas (ES/EN)

- `i18n.js` define `$t('texto en español', arg0, arg1…)`. El texto en español **es la clave**; `lang_en.js` (`window.MAPLE_EN`) trae el inglés. Sin traducción se muestra el español (por eso se puede traducir por etapas).
- `{0}`, `{1}`… se sustituyen por los argumentos. Los `[negritas]` del tutorial y los saltos de párrafo deben ser idénticos en ambos idiomas (`tests/test_i18n.js` lo comprueba).
- El idioma se pregunta una sola vez al entrar (`localStorage maple_lang`) y se cambia en Ajustes (recarga la página).
- Nombre global `$t` (no `t`) para no chocar con variables locales llamadas `t`.
- Los botones ocultos que el menú ☰ busca por texto (Personajes (C), Pociones (P), Mapa (M), Misiones (Q)) se quedan en español.
- Para traducir un archivo: envolver cada texto visible con `$t(...)` (en el módulo: `var $t = window.$t || function (x) { return x; };`) y añadir la pareja a `lang_en.js`. Textos construidos con concatenación → convertirlos a plantilla con `{0}`.
- Estado: TODO traducido (etapas 80-85). Solo quedan el skillsPanel antiguo de ui.js y textos de debug.
