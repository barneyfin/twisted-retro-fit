/* City Nights 0.2 — runtime
   One file, no dependencies. Exposes window.CityNights. Pair it with city-nights.css.
   Copied from Retro Kit's runtime (kit/retro-kit.js) and restyled to the City Nights design system.
   It owns everything every game shares: the picture (540 lines tall, its width following the window, drawn with
   WebGL2), the game loop, keyboard and touch input (up to two fingers at once), every screen outside play (title,
   mode choice, pause, game over, initials, high scores, settings, rotate), the WebGL2 check, full screen, the way
   back to the arcade, sound, music and saved data.
   Step 3b: the shell, over a plain dark backdrop. The drawing tools (the street, the meter) come in step 3c.
   A game supplies only its own rules: see city-nights/kit/template.html. */
(function () {
  'use strict';

  const VERSION = '0.2.0';
  const STEP = 1 / 60;
  const PICTURE_H = 540;            // picture-height: the street is drawn for a 540-line picture
  const ASPECT = [4 / 3, 2.4];      // the picture's width follows the window's shape between these; beyond, letterbox
  const MAX_SHARP = 1.5;            // canvas pixels per CSS pixel at most (the speed test's sharpness)
  const LOGO_MAX = 760;             // the logo's widest, CSS px: a longer name steps its main line down from 116px to 88px
  const GL_OPTIONS = { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
  const PICTURES = [['auto', 'Automatic'], ['best', 'Best'], ['faster', 'Faster'], ['fastest', 'Fastest']];

  /* ---------- Small helpers ---------- */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const titleCase = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const asObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function txt(tag, cls, text) {
    const e = el(tag, cls);
    e.textContent = text;
    return e;
  }
  function zhSpan(cls, text) {
    const s = txt('span', cls, text);
    s.lang = 'zh-Hant';
    return s;
  }

  const store = {
    get(key, fallback) {
      try {
        const v = window.localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    }
  };

  /* ---------- Fares ----------
     The score is the fare. It is kept in whole cents (HK$412.80 is 41280), as it is saved in the high scores. */
  const toCents = (hk) => Math.max(0, Math.round((+hk || 0) * 100));
  // As text: HK$412.80, with comma thousands from HK$1,000.00
  const money = (hk) => 'HK$' + (toCents(hk) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // As the meter shows it: padded with spaces (unlit 8s) to 6 places, ' 23.40'
  function fare(hk) {
    let s = (toCents(hk) / 100).toFixed(2);
    while (s.length < 6) s = ' ' + s;
    return s;
  }

  /* ---------- Seven-segment digits, as HTML (from the design system's bundle.js) ----------
     Each place is 0.52 x height wide, segments 0.12 x height thick, places 0.68 x height apart, slanted 0.08,
     unlit segments always shown. */
  const LIT = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '' };
  const r1 = (v) => Math.round(v * 10) / 10;
  function segBox(s, h) {
    const w = h * 0.52, t = h * 0.12, h2 = h / 2;
    switch (s) {
      case 'a': return [t * 0.8, 0, w - t * 1.6, t];
      case 'b': return [w - t, t * 0.8, t, h2 - t * 1.2];
      case 'c': return [w - t, h2 + t * 0.4, t, h2 - t * 1.2];
      case 'd': return [t * 0.8, h - t, w - t * 1.6, t];
      case 'e': return [0, h2 + t * 0.4, t, h2 - t * 1.2];
      case 'f': return [0, t * 0.8, t, h2 - t * 1.2];
      default: return [t * 0.8, h2 - t / 2, w - t * 1.6, t];
    }
  }
  function seg(parent, q, on) {
    const e = el('i', on ? 'cn-seg is-on' : 'cn-seg');
    e.style.left = r1(q[0]) + 'px'; e.style.top = r1(q[1]) + 'px';
    e.style.width = r1(q[2]) + 'px'; e.style.height = r1(q[3]) + 'px';
    parent.appendChild(e);
  }
  // digits(element, text, height): fills the element with the digits of text (0-9, '.', '-', ' ') at height px.
  // A space is an unlit place, so pad with spaces to keep a fixed width.
  function digits(target, text, height) {
    const h = height || 30, t = h * 0.12, gap = h * 0.16, str = String(text);
    target.textContent = '';
    target.classList.add('cn-digits');
    target.setAttribute('aria-hidden', 'true');
    target.style.setProperty('--glow', r1(h * 0.18) + 'px');
    for (const ch of str) {
      const d = el('span', 'cn-digit');
      d.style.height = r1(h) + 'px';
      if (ch === '.') {
        d.style.width = r1(t + gap * 0.25) + 'px';
        seg(d, [-gap * 0.35, h - t, t, t], true);
      } else {
        d.style.width = r1(h * 0.52 + gap) + 'px';
        const lit = LIT[ch] || '';
        for (const s of 'abcdefg') seg(d, segBox(s, h), lit.indexOf(s) >= 0);
      }
      target.appendChild(d);
    }
    return target;
  }

  /* ---------- Icons (24 viewBox, 2px stroke, round caps and joins, currentColor; from the design system) ---------- */
  const SVG = (body, sw) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  const ICON = {
    play: SVG('<path d="M8 5.5v13l11-6.5z"/>'),
    trophy: SVG('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4"/><path d="M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4"/><path d="M8.5 20h7"/>'),
    sliders: SVG('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
    sound: SVG('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    soundOff: SVG('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    fullscreen: SVG('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'),
    fullscreenExit: SVG('<path d="M9 4v5H4M15 4v5h5M15 20v-5h5M9 20v-5H4"/>'),
    pause: SVG('<path d="M9 5.5v13M15 5.5v13"/>', 2.4),
    restart: SVG('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>'),
    quit: SVG('<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/>'),
    back: SVG('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    drag: SVG('<path d="M3 12h18"/><path d="M6.5 8.5L3 12l3.5 3.5"/><path d="M17.5 8.5L21 12l-3.5 3.5"/>'),
    rotate: '<svg class="cn-rotate-pic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="5" width="16" height="29" rx="3"/><path d="M13 30h4"/><rect x="19" y="27" width="25" height="15" rx="3" stroke-dasharray="3 3"/><path d="M29 7.5a12 12 0 0 1 10 11"/><path d="M41.5 15l-2.3 4.4-4.5-2.1"/></svg>',
    chevUp: '<svg class="chev" viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l6-6 6 6"/></svg>',
    chevDown: '<svg class="chev" viewBox="0 0 20 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5l6 6 6-6"/></svg>'
  };

  /* ---------- Sound (synthesised; no audio files). Retro Kit's set, unchanged. ---------- */
  function makeAudio(settings) {
    const a = { ctx: null, master: null, noiseBuf: null };
    a.unlock = function () {
      if (!a.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        a.ctx = new AC();
        a.master = a.ctx.createGain();
        a.master.connect(a.ctx.destination);
        a.apply();
      }
      if (a.ctx.state !== 'running') {
        const job = a.ctx.resume();
        if (job && job.catch) job.catch(() => {});
      }
    };
    a.apply = function () {
      if (a.master) a.master.gain.value = settings.muted ? 0 : (settings.volume / 100) * 0.5;
    };
    const ready = () => a.ctx && a.ctx.state === 'running' && !settings.muted && settings.volume > 0;
    a.tone = function (o) {
      if (!ready()) return;
      const type = o.type || 'square';
      const dur = o.dur || 0.1;
      const vol = o.vol == null ? 0.25 : o.vol;
      const t0 = a.ctx.currentTime + (o.delay || 0);
      const osc = a.ctx.createOscillator();
      const g = a.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(o.f || 440, t0);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(a.master);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    };
    a.noise = function (o) {
      if (!ready()) return;
      const dur = o.dur || 0.3;
      const t0 = a.ctx.currentTime + (o.delay || 0);
      if (!a.noiseBuf) {
        a.noiseBuf = a.ctx.createBuffer(1, a.ctx.sampleRate, a.ctx.sampleRate);
        const ch = a.noiseBuf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      }
      const src = a.ctx.createBufferSource();
      src.buffer = a.noiseBuf;
      const f = a.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.from || 2400, t0);
      f.frequency.exponentialRampToValueAtTime(o.to || 120, t0 + dur);
      const g = a.ctx.createGain();
      g.gain.setValueAtTime(o.vol == null ? 0.35 : o.vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(a.master);
      src.start(t0); src.stop(t0 + dur + 0.02);
    };
    const seq = (notes, step, o) => notes.forEach((f, i) => a.tone(Object.assign({ f: f, dur: step * 1.1, delay: i * step }, o)));
    a.cues = {
      select: () => a.tone({ f: 880, dur: 0.04, vol: 0.12 }),
      confirm: () => seq([660, 990], 0.06, { vol: 0.16 }),
      back: () => seq([660, 440], 0.06, { vol: 0.14 }),
      pause: () => a.tone({ type: 'triangle', f: 520, to: 390, dur: 0.12, vol: 0.18 }),
      blip: () => a.tone({ f: 520, dur: 0.035, vol: 0.14 }),
      bounce: () => a.tone({ type: 'square', f: 300, to: 360, dur: 0.05, vol: 0.14 }),
      shot: () => a.tone({ f: 1250, to: 520, dur: 0.08, vol: 0.1 }),
      hit: () => { a.tone({ f: 240, to: 110, dur: 0.09, vol: 0.18 }); a.noise({ dur: 0.08, vol: 0.12, from: 3000, to: 600 }); },
      explosion: () => a.noise({ dur: 0.45, vol: 0.36, from: 2200, to: 90 }),
      pickup: () => seq([523, 659, 784, 1047], 0.05, { type: 'triangle', vol: 0.2 }),
      lifeLost: () => seq([784, 659, 523, 392], 0.09, { vol: 0.16 }),
      gameOver: () => seq([392, 330, 262], 0.2, { type: 'triangle', vol: 0.24 }),
      newBest: () => { seq([523, 659, 784], 0.09, { vol: 0.16 }); a.tone({ f: 1047, dur: 0.45, vol: 0.18, delay: 0.27 }); }
    };
    return a;
  }

  /* ---------- Music (optional: one looping track, given as MP3 text in the game's config) ----------
     Retro Kit's, unchanged: it plays on a loop during play, stops for the pause menu and picks up where it left
     off, starts again from the top with each new game, fades out when the game ends, and follows the Volume
     setting and the sound tile. */
  function makeMusic(audio, settings, opts) {
    const share = opts.level == null ? 0.35 : clamp(+opts.level || 0, 0, 1);   // against the sound effects; 1 = the file's full level
    const m = { state: 'idle', buf: null, out: null, src: null, voice: null, t0: 0, offset: 0, loopStart: 0, loopEnd: 0, level: -1 };
    const fail = () => {
      m.state = 'none';
      console.warn('City Nights: the music could not be loaded, so the game plays without it.');
    };
    function ready(buf) {
      // MP3 files carry a moment of silence at each end. Loop between the first and last real sound.
      const ch = buf.getChannelData(0);
      let a = 0;
      let b = buf.length - 1;
      while (a < b && Math.abs(ch[a]) < 0.004) a++;
      while (b > a && Math.abs(ch[b]) < 0.004) b--;
      const whole = b - a < buf.sampleRate;
      m.loopStart = whole ? 0 : a / buf.sampleRate;
      m.loopEnd = whole ? buf.duration : (b + 1) / buf.sampleRate;
      m.buf = buf;
      m.state = 'ready';
    }
    // Decodes the track, once. Unlike playing, this needs no key press or tap, so it can run behind the title screen.
    m.load = function () {
      if (m.state !== 'idle') return;
      const Decoder = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!Decoder || typeof opts.data !== 'string' || !opts.data) { fail(); return; }
      m.state = 'loading';
      try {
        const bin = atob(opts.data);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const job = new Decoder(2, 1, 44100).decodeAudioData(bytes.buffer, ready, fail);
        if (job && job.catch) job.catch(() => {});
      } catch (e) { fail(); }
    };
    function start() {
      const ctx = audio.ctx;
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = m.buf;
      src.loop = true;
      src.loopStart = m.loopStart;
      src.loopEnd = m.loopEnd;
      const voice = ctx.createGain();
      voice.gain.setValueAtTime(0, now);
      voice.gain.linearRampToValueAtTime(1, now + 0.3);
      src.connect(voice);
      voice.connect(m.out);
      src.start(now, m.offset);
      m.src = src;
      m.voice = voice;
      m.t0 = now - m.offset;
    }
    // Fades out over `fade` seconds and remembers the place in the track.
    m.stop = function (fade) {
      if (!m.src) return;
      const now = audio.ctx.currentTime;
      const at = now - m.t0;
      m.offset = at < m.loopEnd ? at : m.loopStart + (at - m.loopStart) % (m.loopEnd - m.loopStart);
      const gain = m.voice.gain;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(0, now + fade);
      m.src.stop(now + fade + 0.02);
      m.src = null;
      m.voice = null;
    };
    // A new game: back to the top of the track.
    m.rewind = function () {
      m.stop(0.08);
      m.offset = 0;
    };
    // Called every frame: makes the music match the screen the player is on and the sound settings.
    m.sync = function (inGame, screen, ending) {
      const level = settings.muted ? 0 : (settings.volume / 100) * share;
      const playing = inGame && screen === 'play' && !ending;
      const keepPlace = playing || (inGame && (screen === 'paused' || screen === 'settings'));
      if (!m.out && audio.ctx) {
        // Its own volume control, beside the sound effects' one, so `level` is measured against the file itself
        m.out = audio.ctx.createGain();
        m.out.gain.value = 0;
        m.out.connect(audio.ctx.destination);
        m.level = 0;
      }
      if (m.out && level !== m.level) {
        m.level = level;
        m.out.gain.setTargetAtTime(level, audio.ctx.currentTime, 0.04);
      }
      if (playing && level > 0) {
        if (m.state === 'idle') m.load();
        if (!m.src && m.buf && m.out && audio.ctx.state === 'running') start();
      } else if (m.src) m.stop(ending ? 0.7 : 0.08);
      if (!keepPlace) m.offset = 0;
    };
    return m;
  }

  /* ---------- Menu navigation (keyboard + pointer) ----------
     One item is selected: arrows move it, Enter or a tap confirms, Esc goes back. Keyboard focus follows the
     selection (and a Tab press moves both), and a selected row inside a scrolling part is scrolled into view. */
  function scrollToShow(item) {
    const box = item.closest('.cn-scroll');
    if (!box) return;
    const r = item.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (r.top < b.top) box.scrollTop -= b.top - r.top + 8;
    else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom + 8;
  }
  function makeNav(items, opts, sfx) {
    opts = opts || {};
    let i = 0;
    const target = (it) => it.focusEl || it.el;
    const owns = (node) => !!node && items.some((it) => it.el === node || it.el.contains(node));
    const nav = {
      items: items,
      select(n, quiet, fromFocus) {
        if (!items.length) return;
        n = ((n % items.length) + items.length) % items.length;
        let guard = 0;
        while (items[n].disabled && guard++ < items.length) n = (n + 1) % items.length;
        if (n !== i && !quiet) sfx('select');
        const hadFocus = owns(document.activeElement);
        i = n;
        items.forEach((it, k) => {
          it.el.classList.toggle('is-selected', k === i);
          if (k === i) it.el.setAttribute('aria-current', 'true');
          else it.el.removeAttribute('aria-current');
        });
        scrollToShow(items[i].el);
        if (!fromFocus && hadFocus) nav.focus();
      },
      focus() {
        const t = items[i] && target(items[i]);
        if (t && t.focus && document.activeElement !== t) t.focus({ preventScroll: true });
      },
      activate(n) {
        const it = items[n == null ? i : n];
        if (it && !it.disabled && it.activate) it.activate();
      },
      key(e) {
        const it = items[i];
        switch (e.code) {
          case 'ArrowUp': case 'KeyW': nav.select(i - 1); return true;
          case 'ArrowDown': case 'KeyS': nav.select(i + 1); return true;
          case 'ArrowLeft': case 'KeyA':
            if (it && it.left) it.left(); else nav.select(i - 1);
            return true;
          case 'ArrowRight': case 'KeyD':
            if (it && it.right) it.right(); else nav.select(i + 1);
            return true;
          case 'Enter': case 'NumpadEnter': case 'Space':
            if (e.repeat) return true;
            nav.activate();
            return true;
          case 'Escape': case 'Backspace':
            if (opts.back) { opts.back(); return true; }
            return false;
          default: return false;
        }
      }
    };
    items.forEach((it, k) => {
      it.el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') nav.select(k); });
      it.el.addEventListener('focusin', () => { if (i !== k) nav.select(k, true, true); });
      it.el.addEventListener('click', (e) => {
        if (it.click) { it.click(e); return; }
        nav.select(k, true);
        nav.activate(k);
      });
    });
    nav.select(opts.start || 0, true);
    return nav;
  }

  /* ---------- The game shell ---------- */
  function createGame(cfg) {
    if (!cfg || typeof cfg.start !== 'function' || typeof cfg.update !== 'function' || typeof cfg.draw !== 'function') {
      throw new Error('City Nights: CityNights.game() needs start(), update() and draw() functions.');
    }
    // The name in two lines for the neon logo (a short first line, then the main line); in a sentence it is one
    const lines = (Array.isArray(cfg.title) ? cfg.title : [cfg.title || 'Untitled']).map(String).filter(Boolean).slice(0, 2);
    const name = lines.join(' ');
    const gameId = slug(cfg.id || name || 'game');
    const zhName = Array.from(String(cfg.zh || ''));
    if (zhName.length && (zhName.length < 2 || zhName.length > 4)) console.warn('City Nights: zh, the Chinese name for the title\'s vertical sign, should be 2 to 4 characters.');
    const keysHint = cfg.keys || [['←', '→', 'Steer'], ['↓', 'Brake'], ['Esc', 'Pause']];
    const touchHint = cfg.touch || 'Drag to steer';
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const mqPortrait = window.matchMedia('(orientation: portrait)');

    /* Settings. Volume, Effects and Reduce motion are shared by every game in the arcade (retrokit.settings);
       City Nights writes back the whole object, so the ones it does not show (Solid panels) stay as they were.
       Picture is City Nights' own (citynights.settings), so Retro Kit games never see it. */
    const SHARED_KEY = 'retrokit.settings';
    const OWN_KEY = 'citynights.settings';
    const SHARED = ['volume', 'muted', 'effects', 'reduceMotion'];
    const settings = Object.assign({
      volume: 80,
      muted: false,
      effects: true,
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }, asObject(store.get(SHARED_KEY, {})));
    const own = Object.assign({ picture: 'auto' }, asObject(store.get(OWN_KEY, {})));
    if (!PICTURES.some((p) => p[0] === own.picture)) own.picture = 'auto';
    function saveSettings() {
      const shared = asObject(store.get(SHARED_KEY, {}));
      SHARED.forEach((k) => { shared[k] = settings[k]; });
      store.set(SHARED_KEY, shared);
      store.set(OWN_KEY, own);
    }
    const audio = makeAudio(settings);
    function sfx(name) {
      const cue = audio.cues[name];
      if (cue) cue(); else console.warn('City Nights: no sound called "' + name + '".');
    }
    sfx.tone = (o) => audio.tone(o || {});
    sfx.noise = (o) => audio.noise(o || {});
    const music = cfg.music ? makeMusic(audio, settings, cfg.music) : null;

    /* Game modes (optional). The player picks one after Start game; the kit remembers it, hands it to
       the game as cn.mode, and keeps a separate high-score table for each. */
    const modes = (Array.isArray(cfg.modes) ? cfg.modes : []).map((m) => {
      const o = typeof m === 'string' ? { id: m } : Object.assign({}, m);
      o.id = slug(o.id || o.label || '');
      o.label = String(o.label || titleCase(o.id));
      return o;
    }).filter((m, i, list) => m.id && list.findIndex((x) => x.id === m.id) === i);
    if (cfg.modes && modes.length < 2) {
      console.warn('City Nights: modes needs two or more entries, each with its own id. This game runs without modes.');
      modes.length = 0;
    }
    const modeKey = 'citynights.mode.' + gameId;
    function setMode(id) {
      state.mode = id;
      store.set(modeKey, id);
    }

    /* High scores, per game (and per mode), in the arcade's format: a top-ten list of {s, i} under
       retrokit.scores.<game>, where the arcade website looks (Barney, 29 October 2026). s is the fare in cents. */
    const scoreKey = (mode) => 'retrokit.scores.' + gameId + (modes.length ? '.' + (mode || state.mode) : '');
    const readScores = (mode) => {
      const t = store.get(scoreKey(mode), []);
      return (Array.isArray(t) ? t : []).filter((r) => r && typeof r.s === 'number').sort((a, b) => b.s - a.s).slice(0, 10);
    };
    const bestScore = (mode) => { const t = readScores(mode); return t.length ? t[0].s : 0; };

    /* ----- DOM ----- */
    document.documentElement.lang = document.documentElement.lang || 'en';
    document.title = name;
    const root = el('div', 'cn-root cn-ui cn-loading' + (touch ? ' cn-touch' : ''));
    root.tabIndex = -1;   // where keyboard focus goes back to when a dialog closes during play
    const stage = el('div', 'cn-stage');
    const canvas = el('canvas', 'cn-world');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', name);
    const playUi = el('div', 'cn-play');
    const hintEl = el('div', 'cn-touch-hint', ICON.drag);
    hintEl.append(txt('span', '', touchHint));
    hintEl.hidden = true;
    const titleScreen = el('div', 'cn-title-screen');
    stage.append(canvas, playUi, titleScreen);
    const dialogLayer = el('div', 'cn-dialog-layer');
    dialogLayer.hidden = true;
    const rotateEl = el('div', 'cn-rotate');
    const errorEl = el('div', 'cn-plaque cn-error');
    errorEl.hidden = true;
    root.append(stage, dialogLayer, rotateEl, errorEl);
    document.body.append(root);

    /* The street is drawn with WebGL2 (from step 3c). A browser without it gets a clear message and no game. */
    const gl = canvas.getContext('webgl2', GL_OPTIONS);
    const night = (function () {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--night-black').trim();
      const m = /^#([0-9a-f]{6})$/i.exec(v);
      if (!m) { console.error('City Nights: city-nights.css is not loaded. Link it before city-nights.js.'); return [0, 0, 0]; }
      const n = parseInt(m[1], 16);
      return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    })();

    /* ----- The neon logo: the title screen's, and the no-WebGL2 screen's ----- */
    function neonLogo() {
      const logo = el('div', 'cn-logo');
      if (zhName.length) {
        const sign = el('div', 'cn-neon cn-vsign', '<span class="cn-tube is-teal"></span>');
        sign.setAttribute('aria-hidden', 'true');
        zhName.forEach((c) => sign.append(zhSpan('cn-lit-teal', c)));
        logo.append(sign);
      }
      const board = el('div', 'cn-neon cn-logo-board', '<span class="cn-tube is-pink" aria-hidden="true"></span>');
      const h = el('h1', 'cn-logo-name cn-lit-pink');
      if (lines.length > 1) h.append(txt('span', 'top', lines[0]));
      h.append(txt('span', 'main', lines[lines.length - 1]));
      board.append(h);
      logo.append(board);
      return logo;
    }
    // If the main line is too long for 116px, it drops in steps to 88px rather than squeezing the letters
    function fitLogo(logo) {
      const main = logo.querySelector('.main');
      main.style.fontSize = '';
      for (const size of [116, 108, 100, 94, 88]) {
        main.style.fontSize = size + 'px';
        main.style.lineHeight = Math.round(size * 108 / 116) + 'px';
        if (logo.scrollWidth <= LOGO_MAX) break;
      }
    }
    // Shrinks a logo (by zoom) to fit the room left in a column: a phone held sideways is about 390px tall
    function zoomLogo(logo, room, width) {
      logo.style.zoom = '';
      const z = clamp(Math.min(room / logo.offsetHeight, width / logo.offsetWidth), 0.3, 1);
      if (z < 1) logo.style.zoom = String(Math.floor(z * 100) / 100);
    }
    const padOf = (node) => { const cs = getComputedStyle(node); return { t: parseFloat(cs.paddingTop), b: parseFloat(cs.paddingBottom), l: parseFloat(cs.paddingLeft), r: parseFloat(cs.paddingRight) }; };

    if (!gl) {
      // No WebGL2: the neon logo and one line, and nothing else runs
      stage.hidden = true;
      const box = el('div', 'cn-nogl');
      const logo = neonLogo();
      box.append(logo, txt('p', 'cn-nogl-msg', name + ' needs a newer browser. Try a current version of Chrome, Safari, Edge or Firefox.'));
      root.append(box);
      const fitNoGL = () => {
        fitLogo(logo);
        const p = padOf(box);
        zoomLogo(logo, box.clientHeight - p.t - p.b - box.lastChild.offsetHeight - (parseFloat(getComputedStyle(box).rowGap) || 0), box.clientWidth - p.l - p.r);
      };
      whenFontsReady(() => { root.classList.remove('cn-loading'); fitNoGL(); });
      window.addEventListener('resize', fitNoGL);
      return { version: VERSION, touch: touch, get screen() { return 'nogl'; } };
    }

    /* ----- Game state ----- */
    const state = {
      screen: 'title',   // title | modes | play | paused | settings | over | initials | scores
      inGame: false,
      game: null,
      mode: modes.length ? (modes.find((m) => m.id === store.get(modeKey, null)) || modes[0]).id : null,   // the mode in play, or the one last picked
      cents: 0,          // the fare, in whole cents
      time: 0,
      t: 0,
      ending: false,
      timers: [],
      errored: false
    };
    function after(seconds, fn) { state.timers.push({ at: state.time + seconds, fn: fn }); }

    /* ----- Input (picture pixels: the picture is cn.W x cn.H, 540 lines tall) ----- */
    const KEYMAP = {
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      up: ['ArrowUp', 'KeyW'],
      down: ['ArrowDown', 'KeyS'],
      fire: ['Space', 'KeyZ', 'KeyJ', 'Enter', 'NumpadEnter'],
      alt: ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyK']
    };
    const GAME_CODES = new Set([].concat.apply([], Object.keys(KEYMAP).map((k) => KEYMAP[k])));
    const keys = new Set();
    const justKeys = new Set();
    const physical = new Set();   // keys physically down right now, whatever the screen
    let stale = new Set();        // keys held over from a menu: ignored until released
    const V = { W: 960, H: PICTURE_H, k: 1, q: 1 };   // the picture's size, CSS px per picture px, canvas px per CSS px
    const pointer = { x: V.W / 2, y: V.H / 2, down: false, pressed: false, released: false, moved: false, dx: 0, dy: 0, id: null, sx: 0, sy: 0, st: 0 };
    // A second finger, down while the first one is: it never moves `pointer`, so one thumb can steer
    // while the other taps or holds. A quick tap with it counts as `tap`, like the first finger's.
    const pointer2 = { x: V.W / 2, y: V.H / 2, down: false, pressed: false, released: false, id: null, sx: 0, sy: 0, st: 0 };
    let tapPending = false;
    const input = {
      left: false, right: false, up: false, down: false, fire: false, alt: false,
      pressed: { left: false, right: false, up: false, down: false, fire: false, alt: false },
      pointer: pointer,
      pointer2: pointer2,
      tap: false,
      any: false,
      key: (code) => keys.has(code),
      keyPressed: (code) => justKeys.has(code)
    };
    function prepareInput() {
      for (const k in KEYMAP) {
        input[k] = KEYMAP[k].some((c) => keys.has(c));
        input.pressed[k] = KEYMAP[k].some((c) => justKeys.has(c));
      }
      input.tap = tapPending;
      input.any = justKeys.size > 0 || tapPending || pointer.pressed || pointer2.pressed;
    }
    function endTickInput() {
      justKeys.clear();
      pointer.pressed = false;
      pointer.released = false;
      pointer.moved = false;
      pointer.dx = 0;
      pointer.dy = 0;
      pointer2.pressed = false;
      pointer2.released = false;
      tapPending = false;
    }
    function resetInput() {
      keys.clear();
      stale = new Set(physical);
      endTickInput();
      pointer.down = false;
      pointer.id = null;
      pointer2.down = false;
      pointer2.id = null;
    }
    let stageRect = null;
    const picX = (e) => { if (!stageRect) stageRect = stage.getBoundingClientRect(); return (e.clientX - stageRect.left) / stageRect.width * V.W; };
    const picY = (e) => { if (!stageRect) stageRect = stage.getBoundingClientRect(); return (e.clientY - stageRect.top) / stageRect.height * V.H; };
    function setPointer(e) {
      const nx = picX(e);
      const ny = picY(e);
      pointer.dx += nx - pointer.x;
      pointer.dy += ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
      pointer.moved = true;
    }
    // A touch that ends short and still is a tap, whichever finger made it.
    const isTap = (p, e) => Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 10 && performance.now() - p.st < 300;
    stage.addEventListener('pointerdown', (e) => {
      audio.unlock();
      if (state.screen !== 'play' || e.target.closest('button, a')) return;   // the tiles are buttons, not play
      e.preventDefault();
      if (pointer.down && e.pointerId !== pointer.id) {   // a second finger: the first keeps steering
        if (pointer2.down) return;                        // a third is ignored
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        pointer2.id = e.pointerId;
        pointer2.x = picX(e); pointer2.y = picY(e);
        pointer2.down = true;
        pointer2.pressed = true;
        pointer2.sx = e.clientX; pointer2.sy = e.clientY; pointer2.st = performance.now();
        hintEl.hidden = true;
        return;
      }
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      pointer.id = e.pointerId;
      setPointer(e);
      pointer.dx = 0; pointer.dy = 0;
      pointer.down = true;
      pointer.pressed = true;
      pointer.sx = e.clientX; pointer.sy = e.clientY; pointer.st = performance.now();
      hintEl.hidden = true;
    });
    stage.addEventListener('pointermove', (e) => {
      if (state.screen !== 'play') return;
      if (pointer2.down && e.pointerId === pointer2.id) { pointer2.x = picX(e); pointer2.y = picY(e); return; }
      if (pointer.down && e.pointerId !== pointer.id) return;
      setPointer(e);
    });
    const pointerEnd = (e) => {
      if (pointer2.down && e.pointerId === pointer2.id) {
        pointer2.down = false;
        pointer2.released = true;
        pointer2.id = null;
        if (state.screen === 'play' && isTap(pointer2, e)) tapPending = true;
        return;
      }
      if (e.pointerId !== pointer.id) return;
      pointer.down = false;
      pointer.released = true;
      pointer.id = null;
      if (state.screen !== 'play') return;
      if (isTap(pointer, e)) tapPending = true;
    };
    stage.addEventListener('pointerup', pointerEnd);
    stage.addEventListener('pointercancel', pointerEnd);
    // Sound may only start from a key press or a tap (on some phones, only as the finger lifts). A phone
    // can also put sound to sleep (a call, switching apps): the next tap or key wakes it.
    ['pointerdown', 'touchend'].forEach((type) => window.addEventListener(type, () => audio.unlock(), true));

    /* ----- Tiles ----- */
    function tile(icon, label, neon) {
      const b = el('button', 'cn-tile' + (neon ? ' is-neon' : ''), '<span>' + icon + '</span>');
      b.type = 'button';
      b.setAttribute('aria-label', label);
      return b;
    }
    /* Full screen: hides the browser's bars, where the browser allows it */
    const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
    const fsAllowed = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    const mqFilled = window.matchMedia('(display-mode: fullscreen)');   // an installed app (or F11) already fills the screen
    function toggleFullscreen() {
      if (fsElement()) {
        Promise.resolve((document.exitFullscreen || document.webkitExitFullscreen).call(document)).catch(() => {});
        return;
      }
      const r = document.documentElement;
      Promise.resolve(r.requestFullscreen ? r.requestFullscreen({ navigationUI: 'hide' }) : r.webkitRequestFullscreen()).then(() => {
        // Hold a phone's game sideways while it fills the screen (browsers allow this only in full screen)
        if (touch && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
      }, () => {});
    }
    function syncFullscreenButton(b) {
      const on = !!fsElement();
      b.hidden = !on && (!fsAllowed || mqFilled.matches);   // never a tile that cannot work
      b.firstChild.innerHTML = on ? ICON.fullscreenExit : ICON.fullscreen;
      b.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    function fullscreenTile(neon) {
      const b = tile(ICON.fullscreen, 'Full screen', neon);
      b.dataset.act = 'fullscreen';
      b.addEventListener('click', () => { toggleFullscreen(); b.blur(); });   // blur: Space and Enter belong to the game
      syncFullscreenButton(b);
      return b;
    }
    const syncFullscreen = () => root.querySelectorAll('[data-act="fullscreen"]').forEach(syncFullscreenButton);
    const onFullscreenChange = () => {
      syncFullscreen();
      if (!fsElement() && state.screen === 'play') pause();   // left full screen mid-play: the jump in size never costs the run
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    if (mqFilled.addEventListener) mqFilled.addEventListener('change', syncFullscreen);
    else if (mqFilled.addListener) mqFilled.addListener(syncFullscreen);

    /* ----- Play: full screen, then pause at the edge; the touch hint on phones ----- */
    function buildPlay() {
      playUi.innerHTML = '';
      const tiles = el('div', 'cn-tiles cn-play-tiles');
      const p = tile(ICON.pause, 'Pause', false);
      p.addEventListener('click', () => { pause(); });
      tiles.append(fullscreenTile(false), p);
      playUi.append(tiles, hintEl);
    }

    /* ----- Layout: the picture fills the window; the canvas holds its real screen pixels ----- */
    function layout() {
      const vw = root.clientWidth || window.innerWidth;
      const vh = root.clientHeight || window.innerHeight;
      V.W = Math.round(PICTURE_H * clamp(vw / vh, ASPECT[0], ASPECT[1]));
      V.k = Math.min(vw / V.W, vh / V.H);
      const cw = V.W * V.k;
      const ch = V.H * V.k;
      stage.style.width = cw + 'px';
      stage.style.height = ch + 'px';
      root.style.setProperty('--cn-k', String(V.k));
      V.q = Math.min(window.devicePixelRatio || 1, MAX_SHARP);
      const bw = Math.max(1, Math.round(cw * V.q));
      const bh = Math.max(1, Math.round(ch * V.q));
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      stageRect = null;
      root.classList.toggle('cn-in-game', state.inGame);
      titleScreen.hidden = state.inGame;
      playUi.hidden = !state.inGame;
      layoutTitle();
    }
    if (window.ResizeObserver) new ResizeObserver(layout).observe(root);
    window.addEventListener('resize', layout);

    /* ----- Settings ----- */
    function applySettings() {
      root.classList.toggle('cn-fx', !!settings.effects);
      root.classList.toggle('cn-reduce-motion', !!settings.reduceMotion);
      audio.apply();
      const sb = titleScreen.querySelector('[data-act="sound"]');
      if (sb) {
        sb.firstChild.innerHTML = settings.muted ? ICON.soundOff : ICON.sound;
        sb.setAttribute('aria-label', settings.muted ? 'Sound off' : 'Sound on');
        sb.setAttribute('aria-pressed', settings.muted ? 'false' : 'true');
      }
    }
    function changeSettings() {
      applySettings();
      saveSettings();
    }

    /* ----- Dialogs: lightboxes on the scrim ----- */
    let nav = null;
    let titleNav = null;
    function lightbox(id, zh, en, width, centred) {
      const panel = el('div', 'cn-lightbox');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.style.width = width + 'px';
      const face = el('div', 'cn-face' + (centred ? ' is-centred' : '') + (zh ? '' : ' is-headless'));
      if (zh) {
        const h = el('h2', 'cn-header');
        h.id = id;
        h.append(zhSpan('zh', zh), txt('span', 'en', en));
        face.append(h);
        panel.setAttribute('aria-labelledby', id);
      }
      panel.append(face);
      return { panel: panel, face: face };
    }
    function openDialog(panel, items, opts) {
      dialogLayer.innerHTML = '';
      dialogLayer.append(el('div', 'cn-scrim'), panel);
      dialogLayer.hidden = false;
      nav = items ? makeNav(items, opts, sfx) : null;
      if (nav) nav.focus();
    }
    function closeDialog() {
      dialogLayer.hidden = true;
      dialogLayer.innerHTML = '';
      nav = state.inGame ? null : titleNav;
      if (nav) nav.focus();
      else root.focus({ preventScroll: true });
    }
    function menuItem(icon, label, kbd, note) {
      const b = el('button', 'cn-item' + (note ? ' has-note' : ''), icon);
      b.type = 'button';
      if (note) {   // a one-line note under the label (a mode's description)
        const t = el('span', 'cn-item-text');
        t.append(txt('span', '', label), txt('span', 'cn-note', note));
        b.append(t);
      } else b.append(label);
      if (kbd) b.append(txt('span', 'cn-kbd', kbd));
      return b;
    }
    function button(label, primary, kbd) {
      const b = el('button', 'cn-btn' + (primary ? ' is-primary' : ''));
      b.type = 'button';
      b.append(label);
      if (kbd) b.append(txt('span', 'cn-kbd', kbd));
      return b;
    }
    const scroller = () => el('div', 'cn-scroll');

    function openPause() {
      const { panel, face } = lightbox('cn-pause-title', '暫停', 'Paused', 380);
      const m = el('div', 'cn-menu');
      m.setAttribute('role', 'menu');
      m.setAttribute('aria-label', 'Paused');
      const items = [
        { el: menuItem(ICON.play, 'Resume', 'Esc'), activate: resume },
        { el: menuItem(ICON.restart, 'Restart', 'Enter'), activate: () => { sfx('confirm'); closeDialog(); startGame(); } },
        { el: menuItem(ICON.sliders, 'Settings', 'Enter'), activate: () => openSettings('paused') },
        { el: menuItem(ICON.quit, 'Quit to menu', 'Enter'), activate: () => { sfx('back'); quitToTitle(); } }
      ];
      items.forEach((it) => m.append(it.el));
      const s = scroller();
      s.append(m);
      face.append(s);
      openDialog(panel, items, { back: resume });
    }

    function openSettings(from) {
      const prev = state.screen;
      state.screen = 'settings';
      sfx('confirm');
      const { panel, face } = lightbox('cn-set-title', '設定', 'Settings', 480);
      face.style.gap = '16px';
      const s = scroller();
      const rows = [];
      // Volume: a slider with its percentage (0 mutes)
      const vol = el('div', 'cn-row cn-vol', '<div class="top"><label class="cn-setting-name" for="cn-vol">Volume</label><span class="cn-value"></span></div><input class="cn-slider" id="cn-vol" type="range" min="0" max="100" step="5">');
      const slider = vol.querySelector('input');
      const volNum = vol.querySelector('.cn-value');
      const showVol = () => {
        slider.value = settings.volume;
        slider.style.setProperty('--v', settings.volume + '%');
        volNum.textContent = settings.muted ? 'Muted' : settings.volume + '%';
      };
      const setVol = (v) => { settings.volume = clamp(v, 0, 100); settings.muted = false; changeSettings(); showVol(); sfx('blip'); };
      slider.addEventListener('input', () => setVol(+slider.value));
      showVol();
      rows.push({ el: vol, focusEl: slider, left: () => setVol(settings.volume - 10), right: () => setVol(settings.volume + 10), click: () => {} });
      // Effects and Reduce motion: switches, the whole row a target
      [
        ['effects', 'Effects', 'Glow around lights and signs.'],
        ['reduceMotion', 'Reduce motion', 'Less sway and roll from the taxi on corners.']
      ].forEach((t) => {
        const row = el('div', 'cn-row cn-setting', '<div><div class="cn-setting-name"></div><p class="cn-note"></p></div><button class="cn-switch" type="button" role="switch"></button>');
        const label = row.querySelector('.cn-setting-name');
        label.textContent = t[1];
        label.id = 'cn-set-' + t[0];
        row.querySelector('.cn-note').textContent = t[2];
        const sw = row.querySelector('.cn-switch');
        sw.setAttribute('aria-labelledby', label.id);
        const show = () => sw.setAttribute('aria-checked', settings[t[0]] ? 'true' : 'false');
        show();
        const flip = () => { settings[t[0]] = !settings[t[0]]; changeSettings(); show(); sfx('blip'); };
        rows.push({ el: row, focusEl: sw, activate: flip, left: flip, right: flip });
      });
      // Picture: Automatic, Best, Faster, Fastest (City Nights' own; used by the drawing tools from step 3c)
      const pic = el('div', 'cn-row cn-pic', '<div><div class="cn-setting-name" id="cn-pic-l">Picture</div><p class="cn-note">Automatic picks the most detail your device can run smoothly.</p></div><div class="cn-segments" role="group" aria-labelledby="cn-pic-l"></div>');
      const segs = pic.querySelector('.cn-segments');
      const picItem = { el: pic };
      const picBtns = PICTURES.map((p) => {
        const b = txt('button', '', p[1]);
        b.type = 'button';
        b.dataset.v = p[0];
        segs.append(b);
        return b;
      });
      const showPic = () => picBtns.forEach((b) => {
        const on = b.dataset.v === own.picture;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) picItem.focusEl = b;
      });
      const setPic = (v, focus) => {
        if (v === own.picture) return;
        own.picture = v;
        changeSettings();
        showPic();
        sfx('blip');
        if (focus && nav) nav.focus();
      };
      const stepPic = (d) => {
        const n = PICTURES.findIndex((p) => p[0] === own.picture);
        setPic(PICTURES[clamp(n + d, 0, PICTURES.length - 1)][0], true);
      };
      showPic();
      Object.assign(picItem, {
        left: () => stepPic(-1),
        right: () => stepPic(1),
        activate: () => setPic(PICTURES[(PICTURES.findIndex((p) => p[0] === own.picture) + 1) % PICTURES.length][0], true),
        click: (e) => { const b = e.target.closest('button'); if (b) setPic(b.dataset.v); }
      });
      rows.push(picItem);
      rows.forEach((r) => s.append(r.el));
      const done = button('Done', true, 'Esc');
      face.append(s, done);
      const close = () => {
        sfx('back');
        if (from === 'paused') { state.screen = 'paused'; openPause(); }
        else { state.screen = prev === 'settings' ? 'title' : prev; closeDialog(); }
      };
      rows.push({ el: done, activate: close });
      openDialog(panel, rows, { back: close });
    }

    /* Choosing a mode: opens from Start game in a game with modes. A lightbox menu with a note per mode. */
    function openModes() {
      state.screen = 'modes';
      const { panel, face } = lightbox('cn-mode-title', '', '', 420);
      panel.setAttribute('aria-label', 'Choose a mode');
      const m = el('div', 'cn-menu');
      m.setAttribute('role', 'menu');
      m.setAttribute('aria-label', 'Modes');
      const items = modes.map((mode) => {
        const b = menuItem(ICON.play, mode.label, 'Enter', mode.description);
        m.append(b);
        return { el: b, activate: () => { sfx('confirm'); setMode(mode.id); startGame(); } };
      });
      const s = scroller();
      s.append(m);
      const back = button('Back', false, 'Esc');
      const close = () => { sfx('back'); state.screen = 'title'; closeDialog(); };
      items.push({ el: back, activate: close });
      face.append(s, back);
      openDialog(panel, items, { back: close, start: Math.max(0, modes.findIndex((x) => x.id === state.mode)) });
    }

    function scoreTable(highlight, mode) {
      const wrap = el('div', 'cn-scores-wrap');
      const table = readScores(mode);
      if (!table.length) { wrap.append(txt('p', 'cn-scores-empty', 'No fares yet. Be the first.')); return wrap; }
      const t = el('table', 'cn-scores');
      t.append(txt('caption', 'cn-sr', 'Top ten fares' + (highlight >= 0 ? ', newest lit' : '')));
      const body = el('tbody');
      table.forEach((r, i) => {
        const tr = el('tr', i === highlight ? 'is-new' : '');
        const rank = txt('td', 'rank', String(i + 1));
        const who = txt('td', 'who', String(r.i || '---').slice(0, 3));
        const f = el('td', 'fare');
        f.append(txt('span', 'cn-sr', money(r.s / 100)), digits(el('div'), fare(r.s / 100), 18));
        tr.append(rank, who, f);
        body.append(tr);
      });
      t.append(body);
      wrap.append(t);
      return wrap;
    }

    function openScores(highlight, afterGame) {
      state.screen = 'scores';
      const { panel, face } = lightbox('cn-hs-title', '高分榜', 'High scores', 420);
      face.style.gap = '12px';
      const s = scroller();
      let table = scoreTable(highlight);
      let stepMode = null;
      if (modes.length && afterGame) {
        // After a game: the table for the mode just played, named above it
        const lab = txt('span', 'cn-label', modes.find((x) => x.id === state.mode).label);
        face.append(lab);
      } else if (modes.length) {
        // From the title: a tab for each mode's table (left and right arrows, or a tap)
        let view = state.mode;
        const list = el('div', 'cn-segments cn-tabs');
        list.setAttribute('role', 'tablist');
        list.setAttribute('aria-label', 'Mode');
        const tabs = modes.map((mode) => {
          const b = txt('button', '', mode.label);
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.addEventListener('click', () => show(mode.id));
          list.append(b);
          return b;
        });
        const mark = () => tabs.forEach((b, k) => b.setAttribute('aria-selected', modes[k].id === view ? 'true' : 'false'));
        const show = (id) => {
          if (id === view) return;
          view = id;
          sfx('select');
          mark();
          const next = scoreTable(-1, view);
          table.replaceWith(next);
          table = next;
        };
        stepMode = (d) => show(modes[(modes.findIndex((x) => x.id === view) + d + modes.length) % modes.length].id);
        mark();
        face.append(list);
      }
      s.append(table);
      face.append(s);
      if (afterGame) {
        const row = el('div', 'cn-btns');
        const again = button('Play again', true, 'Enter');
        const menu = button('Menu');
        row.append(again, menu);
        face.append(row);
        const items = [{ el: again, activate: () => { sfx('confirm'); closeDialog(); startGame(); } }, { el: menu, activate: () => { sfx('back'); quitToTitle(); } }];
        openDialog(panel, items, { back: () => { sfx('back'); quitToTitle(); } });
      } else {
        const back = button('Back', true, 'Esc');
        face.append(back);
        const close = () => { sfx('back'); state.screen = 'title'; closeDialog(); };
        const items = [{ el: back, activate: close }];
        if (stepMode) { items[0].left = () => stepMode(-1); items[0].right = () => stepMode(1); }
        openDialog(panel, items, { back: close });
      }
    }

    function showGameOver() {
      state.screen = 'over';
      state.ending = false;
      sfx('gameOver');
      const table = readScores();
      const prevBest = table.length ? table[0].s : 0;
      const score = state.cents;
      const newBest = score > 0 && score > prevBest;
      const qualifies = score > 0 && (table.length < 10 || score > table[table.length - 1].s);
      if (newBest) setTimeout(() => sfx('newBest'), 650);
      const { panel, face } = lightbox('cn-go-title', '遊戲結束', 'Game over', 420);
      const s = scroller();
      if (newBest) {
        const badge = el('div', 'cn-badge');
        badge.append(zhSpan('zh', '新紀錄'), txt('span', 'en', 'New best'));
        s.append(badge);
      }
      const inset = el('div', 'cn-inset');
      const lab = el('div', 'cn-inset-label');
      lab.append(zhSpan('zh', '車資'), txt('span', 'en', 'FARE  HK$'));
      inset.append(lab, digits(el('div'), fare(score / 100), 64), txt('span', 'cn-sr', 'Final fare ' + money(score / 100)));
      s.append(inset);
      if (prevBest > 0) {
        const line = el('div', 'cn-best-line');
        line.append(txt('span', 'cn-label', newBest ? 'Previous best' : 'Best'), txt('span', 'cn-value', money(prevBest / 100)));
        s.append(line);
      }
      face.append(s);
      let items;
      if (qualifies) {
        const cont = button('Continue', true, 'Enter');
        face.append(cont);
        items = [{ el: cont, activate: () => { sfx('confirm'); openInitials(); } }];
      } else {
        const row = el('div', 'cn-btns');
        const again = button('Play again', true, 'Enter');
        const menu = button('Menu');
        row.append(again, menu);
        face.append(row);
        items = [{ el: again, activate: () => { sfx('confirm'); closeDialog(); startGame(); } }, { el: menu, activate: () => { sfx('back'); quitToTitle(); } }];
      }
      openDialog(panel, items, qualifies ? {} : { back: () => { sfx('back'); quitToTitle(); } });
    }

    /* Initials, after a fare that makes the top ten: its own key handling. Letters are A-Z, 0-9 and a dot;
       the last initials entered are filled in, and an empty slot shows a dim dot. */
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.';
    let initials = null;
    function openInitials() {
      state.screen = 'initials';
      const last = String(store.get('retrokit.initials', '') || '').toUpperCase();
      initials = { letters: [0, 1, 2].map((i) => (last[i] && CHARS.indexOf(last[i]) >= 0 ? last[i] : '')), sel: 0, slots: [] };
      const { panel, face } = lightbox('cn-ne-title', '新紀錄', 'New best', 400, true);
      const slots = el('div', 'cn-slots');
      slots.setAttribute('role', 'group');
      slots.setAttribute('aria-label', 'Initials');
      const field = el('input', 'cn-hidden-input');
      field.setAttribute('maxlength', '1');
      field.setAttribute('autocapitalize', 'characters');
      field.setAttribute('autocomplete', 'off');
      field.setAttribute('enterkeyhint', 'done');
      field.setAttribute('aria-label', 'Letter');
      [0, 1, 2].forEach((i) => {
        const col = el('div', 'cn-slot-col', ICON.chevUp);
        const slot = el('button', 'cn-slot');
        slot.type = 'button';
        slot.setAttribute('aria-label', 'Letter ' + (i + 1));
        col.append(slot);
        col.insertAdjacentHTML('beforeend', ICON.chevDown);
        slot.addEventListener('click', () => {
          initials.sel = i;
          renderInitials();
          if (touch) { field.value = ''; field.focus(); }
        });
        slots.append(col);
        initials.slots.push(col);
      });
      field.addEventListener('input', () => {
        const ch = field.value.slice(-1).toUpperCase();
        field.value = '';
        if (ch && CHARS.indexOf(ch) >= 0) typeChar(ch);
      });
      field.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveInitials(); } });
      face.append(txt('p', 'cn-body', 'Enter your initials'), slots, field);
      if (touch) {
        // No Enter key on a phone until its keyboard is open: Save is a button
        const save = button('Save', true);
        save.addEventListener('click', saveInitials);
        face.append(save);
      } else {
        face.append(el('div', 'cn-keys', '<span class="cn-kbd">↑</span><span class="cn-kbd">↓</span><span class="act">Letter</span><span class="cn-kbd">←</span><span class="cn-kbd">→</span><span class="act">Move</span><span class="cn-kbd">Enter</span><span class="act">Save</span>'));
      }
      initials.field = field;
      openDialog(panel, null);
      renderInitials();
    }
    function renderInitials() {
      initials.slots.forEach((c, i) => {
        c.classList.toggle('is-selected', i === initials.sel);
        if (i === initials.sel) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
        const s = c.querySelector('.cn-slot');
        const ch = initials.letters[i];
        s.classList.toggle('is-empty', !ch);
        s.textContent = !ch || ch === '.' ? '·' : ch;
        s.setAttribute('aria-label', 'Letter ' + (i + 1) + ': ' + (!ch ? 'empty' : ch === '.' ? 'dot' : ch));
      });
    }
    function typeChar(ch) {
      initials.letters[initials.sel] = ch;
      initials.sel = Math.min(2, initials.sel + 1);
      sfx('blip');
      renderInitials();
    }
    function initialsKey(e) {
      const L = initials.letters;
      const i = initials.sel;
      if (e.target === initials.field) return;
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        const n = CHARS.length;
        const at = CHARS.indexOf(L[i] || '-');   // -1 for an empty slot
        L[i] = e.code === 'ArrowUp' ? CHARS[(at + 1) % n] : CHARS[at < 0 ? n - 1 : (at - 1 + n) % n];
        sfx('blip');
        renderInitials();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        initials.sel = Math.max(0, i - 1); sfx('select'); renderInitials();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        initials.sel = Math.min(2, i + 1); sfx('select'); renderInitials();
      } else if (e.code === 'Backspace') {
        // Clears the letter, or the one before it if this slot is already empty
        e.preventDefault();
        if (!L[i] && i > 0) initials.sel = i - 1;
        L[initials.sel] = '';
        sfx('select');
        renderInitials();
      } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (!e.repeat) saveInitials();
      } else if (e.key && e.key.length === 1 && CHARS.indexOf(e.key.toUpperCase()) >= 0) {
        e.preventDefault();
        typeChar(e.key.toUpperCase());
      }
    }
    function saveInitials() {
      if (!initials) return;
      const who = initials.letters.join('');   // empty slots are left out
      if (initials.field) initials.field.blur();
      initials = null;
      store.set('retrokit.initials', who);
      const table = readScores();
      const entry = { i: who, s: state.cents, d: new Date().toISOString().slice(0, 10) };
      table.push(entry);
      table.sort((a, b) => b.s - a.s);
      const kept = table.slice(0, 10);
      store.set(scoreKey(), kept);
      sfx('confirm');
      openScores(kept.indexOf(entry), true);
    }

    /* ----- Title screen: the shade, the neon logo, the neon menu and the best fare; neon tiles; key hints ----- */
    // The arcade website marks each game page it serves with its own address; a game file opened on its own has none
    const arcadeMeta = document.querySelector('meta[name="retrokit-arcade"]');
    const arcadeHref = arcadeMeta ? arcadeMeta.getAttribute('content') : '';
    let titleParts = null;
    function buildTitle() {
      titleScreen.innerHTML = '';
      titleScreen.classList.toggle('has-back', !!arcadeHref);
      const col = el('div', 'cn-title-col');
      const logo = neonLogo();
      const menu = el('nav', 'cn-neon cn-title-menu', '<span class="cn-tube" aria-hidden="true"></span>');
      menu.setAttribute('aria-label', 'Main menu');
      const items = [
        { el: titleItem(ICON.play, 'Start game'), activate: () => { sfx('confirm'); if (modes.length) openModes(); else startGame(); } },
        { el: titleItem(ICON.trophy, 'High scores'), activate: () => { sfx('confirm'); openScores(-1, false); } },
        { el: titleItem(ICON.sliders, 'Settings'), activate: () => openSettings('title') }
      ];
      items.forEach((it) => menu.append(it.el));
      const row = el('div', 'cn-title-row');
      row.append(menu);
      const best = bestScore();
      if (best > 0) {
        const plaque = el('div', 'cn-best');
        const lab = el('div', 'lab');
        lab.append(zhSpan('zh', '最佳'), txt('span', 'en', 'BEST  HK$'));
        plaque.append(lab, digits(el('div'), fare(best / 100), 30), txt('span', 'cn-sr', 'Best fare ' + money(best / 100)));
        row.append(plaque);
      }
      col.append(logo, row);

      const tiles = el('div', 'cn-tiles cn-title-tiles');
      const sound = tile(ICON.sound, 'Sound on', true);
      sound.dataset.act = 'sound';
      sound.addEventListener('click', () => { settings.muted = !settings.muted; changeSettings(); audio.unlock(); sfx('blip'); sound.blur(); });
      tiles.append(sound, fullscreenTile(true));
      titleScreen.append(el('div', 'cn-title-shade'), col, tiles);
      if (arcadeHref) {
        const back = el('a', 'cn-tile is-neon cn-title-back', '<span>' + ICON.back + '</span>');
        back.href = arcadeHref;
        back.setAttribute('aria-label', 'Back to arcade');
        titleScreen.append(back);
      }
      const hints = el('div', 'cn-plaque cn-keys cn-title-hints');
      keysHint.forEach((group) => {
        group.slice(0, -1).forEach((k) => hints.append(txt('span', 'cn-kbd', k)));
        hints.append(txt('span', 'act', group[group.length - 1]));
      });
      if (!touch) titleScreen.append(hints);
      titleParts = { col: col, logo: logo, row: row, hints: touch ? null : hints, fitted: false };
      titleNav = makeNav(items, {}, sfx);
      applySettings();
      layoutTitle();
    }
    function titleItem(icon, label) {
      const b = el('button', 'cn-titem', icon);
      b.type = 'button';
      b.append(label, txt('span', 'cn-kbd', 'Enter'));
      return b;
    }
    // Full layout when the column fits the window; compact (smaller logo, best fare beside the menu) when it does not
    function layoutTitle() {
      if (state.inGame || !titleParts || root.classList.contains('cn-loading')) return;
      const { col, logo, row, hints } = titleParts;
      if (!titleParts.fitted) { fitLogo(logo); titleParts.fitted = true; }
      titleScreen.classList.remove('is-compact');
      logo.style.zoom = '';
      const p = padOf(titleScreen);
      const bottom = hints ? titleScreen.clientHeight - hints.offsetTop + 14 : p.b;
      const room = titleScreen.clientHeight - p.t - bottom;
      const width = titleScreen.clientWidth - p.l - p.r;
      if (col.offsetHeight <= room && logo.offsetWidth <= width) return;
      titleScreen.classList.add('is-compact');
      zoomLogo(logo, room - row.offsetHeight - (parseFloat(getComputedStyle(col).rowGap) || 0), width);
    }

    /* The rotate notice: a phone held upright. Play pauses; turning the phone back shows the pause menu. */
    function buildRotate() {
      const { panel, face } = lightbox('cn-rot-title', '橫放手機', 'Rotate', 326, true);
      panel.removeAttribute('aria-modal');
      face.insertAdjacentHTML('beforeend', ICON.rotate);
      face.append(txt('p', 'cn-rotate-title', 'Rotate your phone'), txt('p', 'cn-note', name + ' plays with the phone held sideways.'));
      rotateEl.append(el('div', 'cn-scrim'), panel);
    }

    /* ----- Flow ----- */
    function startGame() {
      audio.unlock();
      if (music) music.rewind();
      dialogLayer.hidden = true;
      dialogLayer.innerHTML = '';
      nav = null;
      initials = null;
      state.inGame = true;
      state.screen = 'play';
      state.cents = 0;
      state.time = 0;
      state.timers = [];
      state.ending = false;
      buildPlay();
      layout();
      resetInput();
      root.focus({ preventScroll: true });
      try { state.game = cfg.start(api) || {}; } catch (e) { reportError(e); state.game = {}; }
      hintEl.hidden = !touch;
      lastFrame = performance.now();
      acc = 0;
    }
    function pause() {
      if (state.screen !== 'play') return;
      state.screen = 'paused';
      resetInput();
      sfx('pause');
      openPause();
      if (cfg.onPause) cfg.onPause(state.game, api);
    }
    function resume() {
      if (touch && mqPortrait.matches) return;
      sfx('confirm');
      closeDialog();
      state.screen = 'play';
      resetInput();
      lastFrame = performance.now();
      acc = 0;
    }
    function quitToTitle() {
      dialogLayer.hidden = true;
      dialogLayer.innerHTML = '';
      playUi.innerHTML = '';
      state.inGame = false;
      state.screen = 'title';
      state.game = null;
      state.ending = false;
      hintEl.hidden = true;
      buildTitle();
      nav = titleNav;
      layout();
      resetInput();
      nav.focus();
    }
    function addFare(hk) {
      if (state.ending) return;
      state.cents = Math.max(0, state.cents + Math.round((+hk || 0) * 100));
    }
    function setFare(hk) {
      if (state.ending) return;
      state.cents = toCents(hk);
    }
    function gameOver(delay) {
      if (state.ending || !state.inGame) return;
      state.ending = true;
      after(delay == null ? 1 : delay, showGameOver);
    }

    function reportError(e) {
      if (state.errored) return;
      state.errored = true;
      console.error(e);
      errorEl.textContent = 'Game error: ' + (e && e.message ? e.message : e) + ' (press F12 for details)';
      errorEl.hidden = false;
    }

    /* ----- Keyboard ----- */
    document.addEventListener('keydown', (e) => {
      audio.unlock();
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      physical.add(e.code);
      if (state.screen === 'initials' && initials) { initialsKey(e); return; }
      if (state.screen === 'play') {
        if (GAME_CODES.has(e.code) || e.code.indexOf('Arrow') === 0) e.preventDefault();
        if (stale.has(e.code)) return;
        if (e.code === 'KeyP' || e.code === 'Escape') { e.preventDefault(); if (!e.repeat) pause(); return; }
        if (!e.repeat && !keys.has(e.code)) justKeys.add(e.code);
        keys.add(e.code);
        if (touch) hintEl.hidden = true;
        return;
      }
      if (e.code === 'Tab') return;   // Tab moves keyboard focus, and the selection follows it
      const active = state.inGame ? nav : (dialogLayer.hidden ? titleNav : nav);
      if (active && active.key(e)) e.preventDefault();
    });
    document.addEventListener('keyup', (e) => { keys.delete(e.code); physical.delete(e.code); stale.delete(e.code); });
    window.addEventListener('blur', () => { keys.clear(); physical.clear(); stale.clear(); if (state.screen === 'play') pause(); });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      if (state.screen === 'play') pause();
      if (music) music.stop(0.08);   // a hidden tab stops drawing, so stop the music here rather than on the next frame
    });
    const onOrientation = () => { if (touch && mqPortrait.matches && state.screen === 'play') pause(); };
    if (mqPortrait.addEventListener) mqPortrait.addEventListener('change', onOrientation);
    else if (mqPortrait.addListener) mqPortrait.addListener(onOrientation);

    /* ----- Loop: the rules 60 times a second, the picture every frame ----- */
    let lastFrame = performance.now();
    let acc = 0;
    function tick() {
      state.time += STEP;
      if (state.timers.length) {
        const due = state.timers.filter((t) => t.at <= state.time);
        if (due.length) {
          state.timers = state.timers.filter((t) => t.at > state.time);
          due.forEach((t) => { try { t.fn(); } catch (e) { reportError(e); } });
        }
      }
      if (state.screen !== 'play') return;
      prepareInput();
      try { cfg.update(state.game, api); } catch (e) { reportError(e); }
      endTickInput();
    }
    function render() {
      // Step 3b: a plain dark backdrop. The street is drawn here from step 3c.
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(night[0], night[1], night[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (state.inGame && state.game) {
        try { cfg.draw(state.game, api); } catch (e) { reportError(e); }
      }
    }
    let speed = 1;
    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000)) * speed;
      lastFrame = now;
      state.t += dt;
      root.classList.toggle('cn-paused', state.inGame && state.screen !== 'play');
      if (state.screen === 'play' && touch && mqPortrait.matches) pause();   // also checked here, in case the turn's event never came
      if (state.screen === 'play') {
        acc += dt;
        while (acc >= STEP) { tick(); acc -= STEP; }
      } else acc = 0;
      if (music) music.sync(state.inGame, state.screen, state.ending);
      render();
    }

    /* ----- Public API handed to the game ----- */
    const api = {
      version: VERSION, touch: touch, input: input, sfx: sfx,
      get W() { return V.W; },
      get H() { return V.H; },
      get settings() { return { volume: settings.volume, muted: settings.muted, effects: settings.effects, reduceMotion: settings.reduceMotion, picture: own.picture }; },
      get screen() { return state.screen; },
      get time() { return state.time; },
      get t() { return state.t; },
      get fare() { return state.cents / 100; },
      get best() { return Math.max(bestScore(), state.cents) / 100; },
      get mode() { return state.mode; },
      get ending() { return state.ending; },
      addFare: addFare, setFare: setFare, gameOver: gameOver, after: after,
      money: money, rand: rand, randInt: randInt, pick: pick, clamp: clamp, lerp: lerp, hit: hit
    };

    /* ----- Boot ----- */
    buildRotate();
    buildTitle();
    nav = titleNav;
    layout();
    if (cfg.init) { try { cfg.init(api); } catch (e) { reportError(e); } }
    if (music && !settings.muted) setTimeout(music.load, 300);   // get the track ready behind the title screen
    whenFontsReady(() => { root.classList.remove('cn-loading'); layout(); });
    requestAnimationFrame(frame);

    /* Test hook: lets automated checks drive the shell. Not for games. */
    api._debug = {
      state: state,
      get game() { return state.game; },
      get speed() { return speed; },
      set speed(v) { speed = clamp(+v || 1, 0.1, 20); },
      start: (mode) => { if (modes.some((m) => m.id === mode)) setMode(mode); startGame(); },
      setFare: (hk) => { state.cents = toCents(hk); },
      pause: pause, resume: resume, quit: quitToTitle,
      showGameOver: showGameOver, openSettings: openSettings, openScores: openScores, openModes: openModes,
      layout: layout, music: music, view: V
    };
    return api;
  }

  // The kit's five font files, loaded before anything shows (or after 2.5 s, whichever is first)
  function whenFontsReady(fn) {
    const faces = [['700 20px Antonio', 'GRUNGE'], ['500 20px "IBM Plex Sans Condensed"', 'Plex'], ['600 20px "IBM Plex Sans Condensed"', 'Plex'],
      ['700 20px "Noto Sans TC"', '最佳車資'], ['900 20px "Noto Serif TC"', '暫停設定']];
    const loads = faces.map((f) => (document.fonts && document.fonts.load ? document.fonts.load(f[0], f[1]) : Promise.resolve()));
    let done = false;
    const go = () => { if (!done) { done = true; fn(); } };
    Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]).then(go, go);
  }

  window.CityNights = {
    version: VERSION,
    game(cfg) {
      if (window.CityNights.current) throw new Error('City Nights: only one CityNights.game() per page.');
      const boot = () => { window.CityNights.current = createGame(cfg); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
      else boot();
    },
    digits: digits,
    fare: fare,
    money: money,
    current: null
  };
})();
