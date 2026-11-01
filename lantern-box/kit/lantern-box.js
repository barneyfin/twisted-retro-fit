/* Lantern Box 0.1 — runtime
   One file, no dependencies. Exposes window.LanternBox. Pair it with lantern-box.css.
   Step 3a, the skeleton: LanternBox.game() takes the game and shows a holding card with its name, set in the
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

  function holdingCard(cfg) {
    const lines = (Array.isArray(cfg.title) ? cfg.title : [cfg.title || 'Lantern Box game']).map(String);
    document.documentElement.lang = document.documentElement.lang || 'en';
    document.title = lines.join(' ');

    const root = el('main', 'lb-holding');
    root.append(el('p', 'lb-holding-kit', 'Lantern Box kit ' + VERSION + ' · Skeleton'));
    const name = el('h1', 'lb-holding-name');
    lines.forEach((line) => name.append(el('span', '', line)));
    root.append(name);
    // the kit's four font files, each named in itself
    const fonts = el('ul', 'lb-holding-fonts');
    [['is-display', 'IM Fell English'], ['', 'Alegreya Sans Regular'], ['is-medium', 'Alegreya Sans Medium'], ['is-bold', 'Alegreya Sans Bold 1120']]
      .forEach(([cls, sample]) => fonts.append(el('li', cls, sample)));
    root.append(fonts);
    root.append(el('p', 'lb-holding-note', 'The game shell comes in step 3b. This card shows the game was built with the kit\'s fonts inside it.'));
    document.body.append(root);
    return { config: cfg, version: VERSION };
  }

  window.LanternBox = {
    version: VERSION,
    game(cfg) {
      if (window.LanternBox.current) throw new Error('Lantern Box: only one LanternBox.game() per page.');
      const boot = () => { window.LanternBox.current = holdingCard(cfg || {}); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
      else boot();
    },
    current: null
  };
})();
