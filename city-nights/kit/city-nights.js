/* City Nights 0.1 — runtime
   One file, no dependencies. Exposes window.CityNights. Pair it with city-nights.css.
   Step 3a, the skeleton: CityNights.game() takes the game and shows a holding card with its name, set in the
   kit's fonts, so a built game shows its fonts are inside it. Step 3b brings the game shell (copied from
   Retro Kit's and restyled) and step 3c the drawing tools; until then the game's start, update and draw
   are kept but not run. */
(function () {
  'use strict';

  const VERSION = '0.1.0';

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // The kit's five font files, each named in itself: [class, sample, font name]
  const FONTS = [
    ['display', 'Antonio', ''],
    ['', 'IBM Plex Sans Condensed', ''],
    ['ui-600', 'Semibold', ''],
    ['zh-serif', '的士', 'Noto Serif TC'],
    ['zh-sans', '旺角', 'Noto Sans TC']
  ];

  function holdingCard(cfg) {
    const lines = (Array.isArray(cfg.title) ? cfg.title : [cfg.title || 'City Nights game']).map(String);
    document.documentElement.lang = document.documentElement.lang || 'en';
    document.title = lines.join(' ');

    const root = el('main', 'cn-holding');
    root.append(el('p', 'cn-holding-kit', 'City Nights kit ' + VERSION + ' · Skeleton'));
    const name = el('h1', 'cn-holding-name');
    lines.forEach((line, i) => name.append(el('span', i === lines.length - 1 ? 'main' : 'top', line)));
    root.append(name);
    const fonts = el('p', 'cn-holding-fonts');
    FONTS.forEach(([cls, sample, label]) => {
      const item = el('span');
      const b = el('b', cls, sample);
      if (cls.indexOf('zh') === 0) b.lang = 'zh-Hant';
      item.append(b);
      if (label) item.append(' ' + label);
      fonts.append(item);
    });
    root.append(fonts);
    root.append(el('p', 'cn-holding-note', 'The game shell comes in step 3b. This card shows the game was built with the kit\'s fonts inside it.'));
    document.body.append(root);
    return { config: cfg, version: VERSION };
  }

  window.CityNights = {
    version: VERSION,
    game(cfg) {
      if (window.CityNights.current) throw new Error('City Nights: only one CityNights.game() per page.');
      const boot = () => { window.CityNights.current = holdingCard(cfg || {}); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
      else boot();
    },
    current: null
  };
})();
