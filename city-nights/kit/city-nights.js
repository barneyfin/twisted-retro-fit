/* City Nights 0.3 — runtime
   One file, no dependencies. Exposes window.CityNights. Pair it with city-nights.css.
   The shell is copied from Retro Kit's runtime (kit/retro-kit.js) and restyled to the City Nights design system;
   the street is the City Nights speed test's (city-nights/speed-test/src).
   It owns everything every game shares: the World (the street drawn with WebGL2 into a 540-line picture that fills
   the window, its people and its life, the taxi and its motion, traffic and power-ups where the game puts them,
   glow, grain and fog, the meter and the district caption, the crash pop), the game loop, keyboard and touch input
   (up to two fingers at once), every screen outside play (title, mode choice, pause, game over, initials, high
   scores, settings, rotate), the WebGL2 check, full screen, the way back to the arcade, sound, music and saved data.
   The tools draw; a game decides what happens: see city-nights/kit/template.html. */
(function () {
  'use strict';

  const VERSION = '0.3.0';
  const STEP = 1 / 60;
  const PICTURE_H = 540;            // picture-height: the street is drawn for a 540-line picture
  const ASPECT = [4 / 3, 2.4];      // the picture's width follows the window's shape between these; beyond, letterbox
  const MAX_SHARP = 1.5;            // canvas pixels per picture pixel at most (the speed test's sharpness)
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

  /* ---------- The street: the drawing tools ----------
     The World layer: the street drawn with WebGL2 (the City Nights speed test's, city-nights/speed-test/src), the meter
     and the district caption on their own small canvas, and the crash pop over the picture. makeStreet is given the
     canvases, the WebGL2 context and the kit's colours, and hands back the tools the shell and the game use. */
  function makeStreet(env) {
    /* ================================================================ the street, from the City Nights speed test (round 9, signed off 28 October 2026):
       helpers, the signs and words, the look, the track and its buildings, people, traffic, and the sign, figure and vehicle
       drawing done once with the 2D canvas. Unchanged but for the Reduce motion setting and the scene each frame draws. */
    /* ---------------- from the round 9 mock-up, unchanged ---------------- */
    let reduceMotion = false;   // the Reduce motion setting, kept up to date by the shell
    function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function hash3(a,b,c){ let h = Math.imul(a|0, 374761393) ^ Math.imul(b|0, 668265263) ^ Math.imul(c|0, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
    const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
    const lerp = (a,b,t) => a + (b - a) * t;
    const smooth = t => t * t * (3 - 2 * t);
    function mk(w,h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
    function rgbOf(hex){ const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    function hexA(hex, a){ const c = rgbOf(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
    function mixHex(a, b, t){ const x = rgbOf(a), y = rgbOf(b); return '#' + [0,1,2].map(i => Math.round(lerp(x[i], y[i], t)).toString(16).padStart(2,'0')).join(''); }
    function shade(hex, amt){ return amt >= 0 ? mixHex(hex, '#ffffff', amt) : mixHex(hex, '#000000', -amt); }
    function rrAdd(g, x, y, w, h, r){ r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
    function rr(g, x, y, w, h, r){ g.beginPath(); rrAdd(g, x, y, w, h, r); }
    function quad(g, ax, ay, bx, by, cx, cy, dx, dy){ g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(cx, cy); g.lineTo(dx, dy); g.closePath(); }
    const F = {
      zhSerif: '"Noto Serif TC","Noto Serif CJK TC","Noto Serif CJK HK","Songti TC","PMingLiU",serif',
      zhSans: '"Noto Sans TC","Noto Sans CJK TC","Noto Sans CJK HK","PingFang HK","Microsoft JhengHei",sans-serif',
      cond: '"Antonio","Arial Narrow","Roboto Condensed",sans-serif',
      plex: '"IBM Plex Sans Condensed","Arial Narrow","Roboto Condensed",sans-serif'
    };

    /* ================================================================ content */
    const SIGNS = [
      {id:'cafe',   type:'box',  zh:'好運茶餐廳', en:'LUCKY CAFE', w:2300, h:700, face:'cream', ink:'red'},
      {id:'hotel',  type:'neon', zh:'明月酒店', en:'BRIGHT MOON HOTEL', w:2200, h:760, tube:'teal', tube2:'red'},
      {id:'congee', type:'vert', zh:'祥記粥麵', w:600, h:2100, face:'yellow', ink:'red'},
      {id:'pawn',   type:'pawn', zh:'永發', w:820, h:1500},
      {id:'exch',   type:'box',  zh:'利源找換', en:'MONEY EXCHANGE', w:2100, h:640, face:'white', ink:'blue'},
      {id:'sauna',  type:'neon', zh:'原子桑拿', en:'ATOMIC SAUNA', w:2100, h:760, tube:'pink', tube2:'violet', flicker:true},
      {id:'herb',   type:'vert', zh:'長春藥行', w:600, h:2000, tube:'green'},
      {id:'watch',  type:'box',  zh:'金城鐘錶', en:'GOLDEN CITY WATCH CO.', w:2200, h:680, face:'red', ink:'yellow'},
      {id:'noodle', type:'neon', zh:'好味麵家', en:'HO MEI NOODLE', w:2150, h:740, tube:'yellow', tube2:'red'},
      {id:'laundry',type:'box',  zh:'新潔洗衣', en:'LAUNDRY', w:1600, h:600, face:'teal', ink:'white'},
      {id:'park',   type:'park', zh:'停車場', w:900, h:1250},
      {id:'foot',   type:'vert', zh:'火箭足療', w:580, h:2000, tube:'blue'},
      {id:'bbq',    type:'neon', zh:'新興燒味', en:'SAN HING BBQ', w:2100, h:720, tube:'red', tube2:'yellow'},
      {id:'ice',    type:'box',  zh:'星光冰室', en:'STARLIGHT ICE CAFE', w:2150, h:680, face:'green', ink:'cream'},
      {id:'tea',    type:'vert', zh:'涼茶', w:520, h:1150, face:'yellow', ink:'black'},
      {id:'gold',   type:'neon', zh:'金滿金行', en:'GOLDSMITH', w:2000, h:720, tube:'yellow', tube2:'yellow'},
      {id:'optical',type:'box',  zh:'明亮眼鏡', en:'OPTICAL', w:1900, h:640, face:'white', ink:'red'},
      {id:'pharm',  type:'neon', zh:'健康藥房', en:'PHARMACY', w:2000, h:720, tube:'green', tube2:'teal'},
      {id:'fashion',type:'box',  zh:'時裝', en:'FASHION', w:1400, h:620, face:'yellow', ink:'black'},
      {id:'f_store', type:'box', zh:'便利店', en:'24 HOURS', w:1500, h:420, face:'white', ink:'blue', special:true},
      {id:'f_market',type:'box', zh:'街市', en:'MARKET', w:1300, h:420, face:'green', ink:'cream', special:true},
      {id:'f_mall',  type:'box', zh:'商場', en:'ARCADE', w:1300, h:420, face:'cream', ink:'red', special:true},
      {id:'f_police',type:'box', zh:'警署', en:'POLICE STATION', w:2300, h:500, face:'blue', ink:'white', special:true}
    ];
    const POOL = SIGNS.filter(s => !s.special);
    const HSIGNS = SIGNS.filter(s => (s.type === 'box' || s.type === 'neon') && !s.special);
    const DISTRICTS = [
      {zh:'尖沙咀', en:'Tsim Sha Tsui', t:0.5,  mix:{tower:.25, block:.25, tile:.22, tenement:.16, low:.12}},
      {zh:'佐敦',   en:'Jordan',        t:0.1,  mix:{tile:.3, block:.18, tenement:.26, scaffold:.1, low:.16}},
      {zh:'油麻地', en:'Yau Ma Tei',    t:0.65, mix:{tenement:.4, tile:.2, scaffold:.1, block:.1, low:.2}},
      {zh:'旺角',   en:'Mong Kok',      t:1.0,  mix:{tile:.35, tenement:.25, block:.2, low:.1, scaffold:.05, tower:.05}}
    ];
    // on-screen grain levels at 100% overall, from Barney's marked-up screenshot (round 4)
    const ZONES = { white: 60, sky: 40, signSome: 15, cabSome: 15, cars: 15 };
    const MAXL = 100;
    const PLATES = ['KX 2075','LT 6612','MH 309','RB 8841','GD 1257','TP 4470','JV 6038','PE 5192','FN 7730'];

    /* ================================================================ the look (direction A, with C's meter) */
    const LOOK = {
      pal:{
        face:{cream:'#fff1cc', white:'#fffaf0', yellow:'#ffd23a', red:'#d82a1c', teal:'#12a89a', green:'#138a50', blue:'#1c5fd4'},
        ink:{red:'#a8140c', blue:'#0f3a9c', yellow:'#ffe04a', white:'#ffffff', cream:'#fff3d2', black:'#0c0804'},
        tube:{teal:'#3ff2df', red:'#ff3324', pink:'#ff45a8', violet:'#b65cff', green:'#3fec6a', yellow:'#ffd52e', blue:'#4a86ff'}
      },
      sky:['#040403','#17120c','#3a2c1c'],
      skyline:{body:'#110d09', win:'#d9a456', winP:0.16},
      road:{near:'#30291c', far:'#4a3a26', lane:'#cdbf9e', yellow:'#cfa13a', pave:'#3a2f22', paveFar:'#4b3b29', kerb:'#6e5c40', cross:'#bdb39a'},
      shop:['#f3d49a','#c9ad78','#a3dccc','#f2b56b','#e8c27c','#c9e3a8'], shutter:'#2e2a24',
      awning:'#1c140d', win:'#e9b862', winWhite:'#d6e4dc', winBlue:'#93aee6', winDim:'#1f1810',
      lamp:'#ffb84d', poolA:0.34, pole:'#16110c',
      fog:{c:'#3c2d1d', a:0.55, spread:0.16},
      bloom:{a:0.8, b:0.5}, vignette:0.55,
      sign:{glow:0.27},
      reflect:0.34,
      grain:[{tile:'mottle', blend:'overlay', a:0.95},{tile:'sparkle', blend:'screen', a:0.85}],
      swatches:[['Night black','#060504'],['Kerb brown','#3a2f22'],['Sodium amber','#ffb84d'],['Lightbox cream','#f4e6c0'],['Taxi red','#c4241c'],['Meter red','#ff3b26'],['Neon teal','#3fe6d4'],['Neon pink','#ff4fa8']]
    };
    const BT = {
      low:      { h:[2000, 3000], floor:1000, pitch:3, winW:2, win:0.5, ac:0.4, cols:['#4a3d2e','#3e3a33','#51402f','#463a30'], signY:[1250, 1500], fsign:0.5, roof:0.75, len:[4,8] },
      tenement: { h:[3500, 6800], floor:1000, pitch:3, winW:2, win:0.55, ac:0.55, balcony:true, tank:true, cols:['#5b4a35','#3d4a3f','#563c37','#3a4350','#5a5040','#4e3f30'], signY:[1250, 2300], fsign:0.6, len:[5,9] },
      tile:     { h:[6500, 12000], floor:950, pitch:2, winW:1, win:0.42, ac:0.6, cols:['#3e3d39','#4a3524','#544739','#3b3f3c','#463c34'], signY:[1300, 3600], fsign:0.4, roof:0.3, len:[7,13] },
      block:    { h:[9500, 15000], floor:1000, ribbon:true, win:0.4, ac:0.3, cols:['#35373b','#413a33','#3a3328','#3c3a36'], signY:[1500, 4200], fsign:0.3, roof:0.25, len:[9,15] },
      tower:    { h:[17000, 26000], floor:1100, glass:true, win:0.22, cols:['#1a1f27','#20262c','#1d2220'], signY:[2000, 5000], fsign:0.15, len:[12,20] },
      scaffold: { h:[5000, 10000], floor:1000, scaffold:true, cols:['#2c3a33'], signY:[1300, 2600], fsign:0, len:[6,11] },
      police:   { h:[5400, 7200], floor:1000, pitch:2, winW:1, win:0.5, ac:0, cols:['#5e656c','#646a6f'], signY:[99999, 0], fsign:0, len:[12,15] }
    };

    /* ================================================================ world */
    const ROAD = 2000, PAVE = 700, BLD = ROAD + PAVE, UPM = 400;
    const SEG = 200, N_SEG = 1120, TRACK = SEG * N_SEG, DRAW = 175;
    const CAM_H = 950, DEPTH = 1 / Math.tan(50 * Math.PI / 180), PLAYER_Z = CAM_H * DEPTH;
    const HZ = 0.40, CAB_Y = 0.9, SHOP_H = 1000;
    const LANES = [-0.667, 0, 0.667];
    const DIST_LEN = N_SEG / DISTRICTS.length;
    let segs = [], buildings = [];

    // what fills the ground floor, by district: Tsim Sha Tsui, Jordan, Yau Ma Tei, Mong Kok
    const FRONT_MIX = [
      {store:.16, electro:.14, mall:.12, cafe:.1, shop:.2, seafood:.06, shutter:.06, carpark:.06, roast:.05, stair:.05},
      {cafe:.2, shop:.2, roast:.12, store:.1, shutter:.1, seafood:.1, electro:.06, carpark:.06, stair:.06},
      {market:.24, shop:.16, roast:.16, cafe:.12, shutter:.14, stair:.1, store:.05, seafood:.03},
      {electro:.22, shop:.24, store:.12, cafe:.1, shutter:.1, market:.06, carpark:.06, mall:.05, stair:.05}
    ];
    const FRONT_OK = { tower:['mall','store','electro','shop'], scaffold:['shutter','shop','stair','carpark'], low:['shop','cafe','roast','market','seafood','store','shutter'] };
    const FRONT_SIGN = { store:'f_store', market:'f_market', mall:'f_mall', police:'f_police' };
    function pickFront(r, d, btype){
      const mix = FRONT_MIX[d], ok = FRONT_OK[btype];
      for (let tries = 0; tries < 6; tries++){
        let x = r(), acc = 0, pick = 'shop';
        for (const k in mix){ acc += mix[k]; if (x <= acc){ pick = k; break; } }
        if (!ok || ok.includes(pick)) return pick;
      }
      return ok ? ok[0] : 'shop';
    }
    function pickType(r, d){
      const mix = DISTRICTS[d].mix; let x = r(), acc = 0;
      for (const k in mix){ acc += mix[k]; if (x <= acc) return k; }
      return 'tile';
    }
    function buildTrack(){
      const r = rng(1979);
      const plan = [[90,0],[60,2.4],[70,0],[80,-3.2],[90,0],[50,1.6],[80,-1.8],[70,0],[60,3],[100,0],[70,-2.6],[60,0],[50,1.2],[70,-1.2],[120,0]];
      const curves = [];
      plan.forEach(([n, c]) => { for (let k = 0; k < n; k++) curves.push(c ? c * Math.sin(Math.PI * k / n) : 0); });
      while (curves.length < N_SEG) curves.push(0);
      curves.length = N_SEG;
      segs = curves.map((c, i) => ({ i, curve: c, signs: [], lamp: 0, people: [], cable: 0, wall: [null, null], junc: false, cross: false, lights: 0 }));
      // side streets
      for (let i = 60; i < N_SEG - 12; i += 120 + Math.floor(r() * 50)){
        for (let k = 0; k < 7; k++) segs[i + k].junc = true;
        segs[i - 7].cross = true; segs[i].lights = r() < 0.5 ? 1 : 2;
      }
      // buildings along each side
      buildings = []; let policeDone = false;
      [0, 1].forEach(side => {
        let i = 0;
        while (i < N_SEG){
          if (segs[i].junc){ i++; continue; }
          const d = Math.floor(i / DIST_LEN);
          // one police station a lap, on the right in Jordan
          let type = pickType(r, d);
          if (side === 1 && d === 1 && !policeDone && i > DIST_LEN * 1.35){ type = 'police'; policeDone = true; }
          const T = BT[type];
          let len = T.len[0] + Math.floor(r() * (T.len[1] - T.len[0] + 1));
          let k = 0; while (k < len && i + k < N_SEG && !segs[i + k].junc) k++;
          len = k; if (!len){ i++; continue; }
          const bl = { id: buildings.length, type, T, h: lerp(T.h[0], T.h[1], r()), col: T.cols[Math.floor(r() * T.cols.length)], shop: Math.floor(r() * 6), shut: r() < 0.2, gv: r(), start: i, len, side, fsigns: [] };
          // first floor: iron window grilles, a wide lit window with blinds, or plain
          bl.f1 = type === 'police' ? 'grille' : (type === 'tenement' || type === 'tile' || type === 'low') ? (r() < 0.3 ? 'grille' : r() < 0.35 ? 'wide' : 'plain') : 'plain';
          // the ground floor, split into shop units
          bl.units = [];
          if (type === 'police') bl.units.push({ k0: 0, len, type: 'police', seed: Math.floor(r() * 997) });
          else {
            let k0 = 0;
            if ((type === 'tenement' || type === 'tile') && len >= 5 && r() < 0.55){ bl.units.push({ k0: 0, len: 1, type: 'stair', seed: Math.floor(r() * 997) }); k0 = 1; }
            while (k0 < len){
              let ul = Math.min(len - k0, 4 + Math.floor(r() * 5));
              if (len - k0 - ul < 3) ul = len - k0;
              bl.units.push({ k0, len: ul, type: pickFront(r, d, type), seed: Math.floor(r() * 997) });
              k0 += ul;
            }
          }
          bl.unitAt = new Array(len);
          bl.units.forEach(u => {
            for (let q = 0; q < u.len; q++) bl.unitAt[u.k0 + q] = u;
            const sid = FRONT_SIGN[u.type];
            if (sid && u.len >= 3 && (u.type === 'police' || r() < 0.75)){
              const t = SIGNS.find(x => x.id === sid);
              const fl = clamp(Math.round(t.w / t.h * 380 / SEG), 2, u.len), w = fl * SEG, h = t.h * w / t.w;
              bl.fsigns.push({ t, w, h, len: fl, k0: u.k0 + Math.floor((u.len - fl) / 2), y: SHOP_H + 10 });
            }
          });
          if (T.fsign && r() < T.fsign && len >= 4){
            const t = HSIGNS[Math.floor(r() * HSIGNS.length)];
            const fl = Math.max(3, Math.min(len - 1, Math.round(t.w / SEG)));
            const w = fl * SEG, h = t.h * w / t.w;
            const ymax = Math.min(type === 'tenement' ? 2300 : type === 'low' ? 1500 : 3000, bl.h - h - 200);
            if (ymax > 1550) bl.fsigns.push({ t, w, h, len: fl, k0: Math.floor(r() * (len - fl + 1)), y: 1550 + r() * (ymax - 1550) });
          }
          buildings.push(bl);
          for (let q = 0; q < len; q++) segs[i + q].wall[side] = { b: bl, k: q };
          if (T.roof && bl.h < 12500 && r() < T.roof){
            const t = HSIGNS[Math.floor(r() * HSIGNS.length)];
            const big = type === 'low' ? 1.5 : 1.25, s = side ? 1 : -1, w = t.w * big, h = t.h * big;
            segs[i + len - 1].signs.push({ t, side: s, w, h, x: s * (BLD + 400 + w / 2), y: bl.h + 120, roof: true });
          }
          i += len;
        }
      });
      // hanging signs: their height suits the building they hang from
      for (let i = 4; i < N_SEG; ){
        const add = s => {
          const wd = segs[i].wall[s > 0 ? 1 : 0]; if (!wd) return;
          if (wd.b.type === 'police') return;
          const t = POOL[Math.floor(r() * POOL.length)];
          let w = t.w, h = t.h; const maxW = BLD - 120 - 450;
          if (w > maxW){ h *= maxW / w; w = maxW; }
          const T = wd.b.T, vertical = t.type === 'vert' || t.type === 'pawn' || t.type === 'park';
          const lo = vertical ? Math.max(1200, T.signY[0] - 50) : T.signY[0];
          const hi = Math.min(T.signY[1], wd.b.h - h - 250);
          if (hi < lo) return;
          segs[i].signs.push({ t, side: s, w, h, x: s * (BLD - 120 - w / 2), y: lo + r() * (hi - lo) });
        };
        const side = r() < 0.5 ? -1 : 1;
        add(side); if (r() < 0.35) add(-side);
        i += 2 + Math.floor(r() * 3);
      }
      // signs hung across the road from a frame, only where both buildings are tall enough
      for (let i = 18; i < N_SEG; i += 24 + Math.floor(r() * 16)){
        const L = segs[i].wall[0], R = segs[i].wall[1]; if (!L || !R || L.b.type === 'police' || R.b.type === 'police') continue;
        const t = HSIGNS[Math.floor(r() * HSIGNS.length)];
        const w = t.w * 1.35, h = t.h * 1.35, y = 3300 + r() * 1200;
        if (Math.min(L.b.h, R.b.h) < y + h + 700) continue;
        segs[i].signs.push({ t, side: 0, w, h, x: (r() - 0.5) * 1400, y, span: true });
      }
      for (let i = 6; i < N_SEG; i += 14) if (!segs[i].junc) segs[i].lamp = (Math.floor(i / 14) % 2) ? 1 : -1;
      for (let i = 3; i < N_SEG; i += 9 + Math.floor(r() * 5)){ const L = segs[i].wall[0], R = segs[i].wall[1]; const lo = Math.min(L ? L.b.h : 9000, R ? R.b.h : 9000); if (lo > 4600) segs[i].cable = 4300 + r() * Math.min(1200, lo - 4500); }
    }

    // people walking along the pavements, and small groups waiting at the crossings
    let peds = [];
    function buildPeople(){
      const r = rng(515); peds = [];
      for (let i = 0; i < N_SEG; i++){
        if (segs[i].junc) continue;
        const d = Math.floor(i / DIST_LEN), busy = [0.22, 0.2, 0.5, 0.55][d];
        if (r() < busy){
          const walking = r() < 0.78;
          peds.push({ z: i * SEG + r() * SEG, side: r() < 0.5 ? -1 : 1, off: 200 + r() * 440, v: Math.floor(r() * 6), hs: 0.9 + r() * 0.18, dir: r() < 0.5 ? 1 : -1, speed: walking ? 420 + r() * 260 : 0, phase: r() * 4 });
        }
        if (segs[i].cross) for (let q = 0; q < 5; q++) peds.push({ z: i * SEG - 250 + r() * 350, side: q % 2 ? 1 : -1, off: 80 + r() * 300, v: Math.floor(r() * 6), hs: 0.9 + r() * 0.18, dir: 1, speed: 0, phase: 0 });
      }
    }

    let cars = [];
    const TONES = { taxi:1, sedan:3, van:3, minibus:2 };
    function buildCars(){
      const r = rng(808); cars = [];
      for (let k = 0; k < 16; k++){
        const p = r(), kind = p < 0.4 ? 'taxi' : p < 0.65 ? 'sedan' : p < 0.85 ? 'van' : 'minibus';
        cars.push({ z: (k / 16) * TRACK + r() * 2000, x: LANES[k % 3], speed: 2600 + r() * 2400, kind, tone: Math.floor(r() * TONES[kind]) });
      }
    }
    function districtAt(pos){
      const s = ((pos / SEG) % N_SEG + N_SEG) % N_SEG, d = Math.floor(s / DIST_LEN), f = (s % DIST_LEN) / DIST_LEN, edge = 0.12;
      let t = DISTRICTS[d].t;
      if (f < edge){ const p = DISTRICTS[(d + 3) % 4].t; t = lerp(p, t, smooth(0.5 + f / edge / 2)); }
      else if (f > 1 - edge){ const n = DISTRICTS[(d + 1) % 4].t; t = lerp(t, n, smooth((f - (1 - edge)) / edge / 2)); }
      return { d, t };
    }
    const lerpR = (r, t) => lerp(r[0], r[1], clamp(t, 0, 1));
    /* ================================================================ grain tiles */
    const tiles = {};
    function valueNoise(size, cell, r){
      const n = size / cell, grid = new Float32Array(n * n);
      for (let i = 0; i < grid.length; i++) grid[i] = r();
      const out = new Float32Array(size * size);
      for (let y = 0; y < size; y++){
        const gy = y / cell, y0 = Math.floor(gy), fy = smooth(gy - y0), y1 = (y0 + 1) % n;
        for (let x = 0; x < size; x++){
          const gx = x / cell, x0 = Math.floor(gx), fx = smooth(gx - x0), x1 = (x0 + 1) % n;
          out[y * size + x] = lerp(lerp(grid[y0 * n + x0], grid[y0 * n + x1], fx), lerp(grid[y1 * n + x0], grid[y1 * n + x1], fx), fy);
        }
      }
      return out;
    }
    function makeTiles(){
      const S = 256, r = rng(4242);
      { const c = mk(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data;
        const n2 = valueNoise(S, 2, r), n4 = valueNoise(S, 4, r), n16 = valueNoise(S, 16, r);
        for (let i = 0; i < S * S; i++){
          let v = n4[i] * 0.5 + n2[i] * 0.3 + n16[i] * 0.2 - 0.5;
          v = Math.sign(v) * Math.pow(Math.abs(v) * 2, 0.65) / 2;
          const p = 128 + v * 150 + (r() - 0.5) * 30;
          d[i*4] = clamp(p + 6, 0, 255); d[i*4+1] = clamp(p, 0, 255); d[i*4+2] = clamp(p - 10, 0, 255); d[i*4+3] = 255;
        }
        g.putImageData(im, 0, 0); tiles.mottle = c; }
      { const c = mk(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data;
        const m4 = valueNoise(S, 4, r), m8 = valueNoise(S, 8, r);
        for (let i = 0; i < S * S; i++){ const v = Math.max(0, m4[i] * 0.6 + m8[i] * 0.4 - 0.42) * 95; d[i*4] = v * 1.08; d[i*4+1] = v; d[i*4+2] = v * 0.82; d[i*4+3] = 255; }
        g.putImageData(im, 0, 0);
        const cols = ['#ff4a3a','#4ade6a','#ffd040','#4fd0ff','#fff4dc','#ff70c0','#ffa040'];
        for (let k = 0; k < 1500; k++){ g.globalAlpha = 0.4 + r() * 0.6; g.fillStyle = cols[Math.floor(r() * cols.length)]; const s = r() < 0.85 ? 1 : 2; g.fillRect(Math.floor(r() * S), Math.floor(r() * S), s, s); }
        g.globalAlpha = 0.25; g.fillStyle = '#c8b090';
        for (let k = 0; k < 18; k++){ g.fillRect(Math.floor(r() * S), Math.floor(r() * S), 1, 6 + r() * 30); }
        g.globalAlpha = 1; tiles.sparkle = c; }
    }
    /* ================================================================ signs */
    const SPX = 0.2;
    function fitFont(g, text, weight, family, maxW, maxH){ let size = maxH; g.font = weight + ' ' + size + 'px ' + family; const w = g.measureText(text).width; if (w > maxW) size = size * maxW / w; return Math.max(4, size); }
    function tubeText(g, txt, x, y, size, weight, family, col, spacing){
      const S = LOOK.sign;
      g.save(); g.font = weight + ' ' + size + 'px ' + family; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g && spacing) g.letterSpacing = spacing + 'px';
      g.shadowColor = col; g.shadowBlur = size * S.glow * 2.4; g.fillStyle = col; g.globalAlpha = 0.9; g.fillText(txt, x, y);
      g.shadowBlur = size * S.glow * 0.8; g.globalAlpha = 1; g.fillText(txt, x, y); g.shadowBlur = 0;
      g.fillStyle = mixHex(col, '#ffffff', 0.8); g.fillText(txt, x, y);
      g.strokeStyle = col; g.lineWidth = Math.max(1, size * 0.05); g.lineJoin = 'round'; g.strokeText(txt, x, y);
      g.restore();
    }
    function lightText(g, txt, x, y, size, weight, family, col, spacing){
      g.save(); g.font = weight + ' ' + size + 'px ' + family; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g && spacing) g.letterSpacing = spacing + 'px';
      g.fillStyle = col; g.fillText(txt, x, y); g.restore();
    }
    function lightboxFace(g, x, y, w, h, f, radius){
      g.save(); g.shadowColor = hexA(f, 0.95); g.shadowBlur = Math.min(w, h) * LOOK.sign.glow * 2.2;
      g.fillStyle = '#070504'; rr(g, x, y, w, h, radius); g.fill(); g.restore();
      const m = Math.min(w, h) * 0.06;
      const gr = g.createLinearGradient(x, y + m, x, y + h - m);
      gr.addColorStop(0, shade(f, -0.06)); gr.addColorStop(0.45, shade(f, 0.22)); gr.addColorStop(1, shade(f, -0.1));
      g.fillStyle = gr; rr(g, x + m, y + m, w - 2 * m, h - 2 * m, radius * 0.6); g.fill();
      const rg = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.2, x + w / 2, y + h / 2, Math.max(w, h) * 0.62);
      rg.addColorStop(0, 'rgba(255,255,255,0.16)'); rg.addColorStop(1, 'rgba(0,0,0,0.08)');
      g.fillStyle = rg; rr(g, x + m, y + m, w - 2 * m, h - 2 * m, radius * 0.6); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = Math.max(1, m * 0.25); rr(g, x + m * 1.2, y + m * 1.2, w - 2.4 * m, h - 2.4 * m, radius * 0.5); g.stroke();
    }
    function neonBoard(g, x, y, w, h, col, radius){
      g.fillStyle = 'rgba(5,3,5,0.96)'; rr(g, x, y, w, h, radius); g.fill();
      const inset = Math.min(w, h) * 0.07;
      g.save(); g.strokeStyle = col; g.lineWidth = Math.max(1.5, Math.min(w, h) * 0.022); g.shadowColor = col; g.shadowBlur = Math.min(w, h) * LOOK.sign.glow;
      rr(g, x + inset, y + inset, w - 2 * inset, h - 2 * inset, radius * 0.5); g.stroke(); g.restore();
    }
    function drawSign(g, t, w, h){
      const P = LOOK.pal, r = Math.min(w, h) * 0.06, zh = F.zhSerif;
      if (t.type === 'box'){
        lightboxFace(g, 0, 0, w, h, P.face[t.face], r);
        const ink = P.ink[t.ink];
        lightText(g, t.zh, w / 2, h * 0.4, fitFont(g, t.zh, 900, zh, w * 0.84, h * 0.5), 900, zh, ink);
        const es = fitFont(g, t.en, 700, F.cond, w * 0.8, h * 0.17);
        lightText(g, t.en, w / 2, h * 0.79, es, 700, F.cond, ink, es * 0.08);
      } else if (t.type === 'neon'){
        const col = P.tube[t.tube], col2 = P.tube[t.tube2];
        neonBoard(g, 0, 0, w, h, col, r);
        tubeText(g, t.zh, w / 2, h * 0.41, fitFont(g, t.zh, 700, F.zhSans, w * 0.8, h * 0.46), 700, F.zhSans, col);
        const es = fitFont(g, t.en, 700, F.cond, w * 0.76, h * 0.16);
        tubeText(g, t.en, w / 2, h * 0.79, es, 700, F.cond, col2, es * 0.1);
      } else if (t.type === 'vert'){
        const chars = Array.from(t.zh);
        if (t.face){
          lightboxFace(g, 0, 0, w, h, P.face[t.face], r);
          const cs = Math.min(w * 0.72, (h * 0.9) / chars.length);
          chars.forEach((ch, k) => lightText(g, ch, w / 2, h * 0.05 + cs * (k + 0.5) + (h * 0.9 - cs * chars.length) / 2, cs * 0.92, 900, zh, P.ink[t.ink]));
        } else {
          const col = P.tube[t.tube]; neonBoard(g, 0, 0, w, h, col, r);
          const cs = Math.min(w * 0.66, (h * 0.86) / chars.length);
          chars.forEach((ch, k) => tubeText(g, ch, w / 2, h * 0.07 + cs * (k + 0.5) + (h * 0.86 - cs * chars.length) / 2, cs * 0.9, 700, F.zhSans, col));
        }
      } else if (t.type === 'pawn'){
        g.save(); g.shadowColor = 'rgba(255,90,60,0.6)'; g.shadowBlur = w * LOOK.sign.glow; g.fillStyle = '#5c120d'; rr(g, 0, 0, w, h, r); g.fill(); g.restore();
        lightText(g, t.zh, w / 2, h * 0.17, Math.min(w * 0.36, h * 0.15), 900, zh, '#f6e6c2');
        g.save(); g.strokeStyle = '#f6e6c2'; g.lineWidth = w * 0.045; g.beginPath(); g.arc(w / 2, h * 0.62, w * 0.36, 0, Math.PI * 2); g.stroke(); g.restore();
        lightText(g, '押', w / 2, h * 0.63, w * 0.5, 900, zh, '#f6e6c2');
      } else if (t.type === 'park'){
        lightboxFace(g, 0, 0, w, h * 0.58, P.face.blue, r);
        lightText(g, 'P', w / 2, h * 0.24, h * 0.32, 700, F.cond, '#ffffff');
        lightText(g, t.zh, w / 2, h * 0.47, w * 0.2, 900, F.zhSans, '#ffffff');
        neonBoard(g, 0, h * 0.62, w, h * 0.38, P.tube.red, r);
        tubeText(g, 'FULL', w / 2, h * 0.81, h * 0.17, 700, F.cond, P.tube.red, 4);
      }
    }
    function signColour(t){
      const P = LOOK.pal;
      if (t.type === 'neon' || (t.type === 'vert' && t.tube)) return P.tube[t.tube];
      if (t.type === 'pawn') return '#ff5a3a';
      if (t.type === 'park') return P.face.blue;
      return P.face[t.face];
    }
    function makeSign(t, w, h){
      const pad = Math.max(w, h) * 0.18 + 160;
      const c = mk((w + pad * 2) * SPX, (h + pad * 2) * SPX), g = c.getContext('2d');
      g.translate(pad * SPX, pad * SPX);
      // a soft dark halo on the wall behind the sign, as tone-mapping darkens round bright lights
      const fw = w * SPX, fh = h * SPX, e = Math.min(fw, fh) * 0.12;
      g.save(); g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = Math.min(fw, fh) * 0.45; g.fillStyle = 'rgba(0,0,0,0.6)'; rr(g, -e, -e, fw + e * 2, fh + e * 2, e); g.fill(); g.restore();
      drawSign(g, t, fw, fh);
      // extra light on top for punch, baked in once rather than drawn every frame
      const tmp = mk(c.width, c.height); tmp.getContext('2d').drawImage(c, 0, 0);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.24; g.drawImage(tmp, 0, 0);
      return { c, ww: w + pad * 2, wh: h + pad * 2, pad, col: signColour(t) };
    }

    const VEH = {
      taxi:   { W:1.69, L:4.6,  bot:0.30, belt:0.93, roof:1.48, cab:[0.95,1.42,3.0,3.6],  cabW:[0.80,0.70], wheel:[0.31,0.85,3.55], cols:['#b8211b'], upper:'#c4c1b7' },
      sedan:  { W:1.80, L:4.85, bot:0.28, belt:0.88, roof:1.43, cab:[1.15,1.78,3.0,3.75], cabW:[0.83,0.66], wheel:[0.33,0.95,3.8], cols:['#9ba0a6','#202227','#5a1c1c'] },
      van:    { W:1.70, L:4.7,  bot:0.26, roof:1.98, wheel:[0.33,0.8,3.4], cols:['#dedcd4','#b3b6b6','#2c2f35'] },
      minibus:{ W:2.0,  L:7.0,  bot:0.32, roof:2.62, wheel:[0.40,1.25,5.1], cols:['#e7ddc4'], band:['#1f7a4c','#b3241c'] }
    };
    const OFFS = [-2.6, -1.3, 0, 1.3, 2.6];
    const WARM = '#ffcf8a';
    function V3(t){
      const { g, P, cam } = t;
      const vis = (n, p) => n[0] * (cam[0] - p[0]) + n[1] * (cam[1] - p[1]) + n[2] * (cam[2] - p[2]) > 0;
      const path = list => { g.beginPath(); list.forEach((q, i) => { const s = P(q[0], q[1], q[2]); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); g.closePath(); };
      const bounds = list => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; list.forEach(q => { const s = P(q[0], q[1], q[2]); x0 = Math.min(x0, s[0]); x1 = Math.max(x1, s[0]); y0 = Math.min(y0, s[1]); y1 = Math.max(y1, s[1]); }); return { x0, x1, y0, y1 }; };
      const vg = (list, c0, c1, c2) => { const b = bounds(list); const gr = g.createLinearGradient(0, b.y0, 0, Math.max(b.y1, b.y0 + 0.5)); gr.addColorStop(0, c0); if (c2){ gr.addColorStop(0.5, c1); gr.addColorStop(1, c2); } else gr.addColorStop(1, c1); return gr; };
      const face = (list, n, style) => { if (n && !vis(n, list[0])) return false; path(list); g.fillStyle = typeof style === 'function' ? style(list) : style; g.fill(); return true; };
      const qX = (x, y0, y1, z0, z1) => [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]];
      const qZ = (z, x0, x1, y0, y1) => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
      const qY = (y, x0, x1, z0, z1) => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
      return { vis, path, bounds, vg, face, qX, qZ, qY };
    }
    function shadow3(t){ const h = V3(t); for (let k = 3; k >= 1; k--){ const m = 0.07 * k; h.path(h.qY(0.004, -t.hw - m, t.hw + m, -0.18 - m, t.V.L + m)); t.g.fillStyle = 'rgba(0,0,0,0.24)'; t.g.fill(); } }
    function tyreBacks(t){ const h = V3(t), hw = t.hw, [r, z1] = t.V.wheel; h.face(h.qZ(z1 - r * 0.92, -hw + 0.02, -hw + 0.26, 0, r * 1.15), null, '#0c0c0d'); h.face(h.qZ(z1 - r * 0.92, hw - 0.26, hw - 0.02, 0, r * 1.15), null, '#0c0c0d'); }
    function wheels3(t, s){
      const { g, P, hw, V } = t, h = V3(t), r = V.wheel[0];
      for (const zc of [V.wheel[1], V.wheel[2]]){
        const x = s * (hw + 0.004);
        if (!h.vis([s, 0, 0], [x, r, zc])) continue;
        const circ = (rad, xx) => { g.beginPath(); for (let k = 0; k <= 18; k++){ const a = k / 18 * Math.PI * 2; const p = P(xx, r + rad * Math.sin(a), zc + rad * Math.cos(a)); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.closePath(); };
        circ(r * 1.14, x); g.fillStyle = '#080809'; g.fill();
        circ(r, x + s * 0.02); g.fillStyle = '#151517'; g.fill();
        circ(r * 0.6, x + s * 0.03); g.fillStyle = '#82817c'; g.fill();
        circ(r * 0.24, x + s * 0.035); g.fillStyle = '#3a3a3a'; g.fill();
      }
    }
    function glass3(t, list, seed, n, inner){
      const { g } = t, h = V3(t);
      if (n && !h.vis(n, list[0])) return false;
      if (t.hero && inner){ g.save(); g.globalAlpha = 0.6; h.path(list); g.fillStyle = h.vg(list, '#3b352f', '#11151a', '#07090c'); g.fill(); g.restore(); }
      else { h.path(list); g.fillStyle = h.vg(list, '#3b352f', '#11151a', '#07090c'); g.fill(); }
      g.save(); h.path(list); g.clip();
      const b = h.bounds(list), w = b.x1 - b.x0, ht = b.y1 - b.y0;
      if (inner) inner();
      const cols = ['#3fe6d4', '#ff4fa8', '#ffd23a', '#ff3b2e', '#7fa8ff'], r = rng(seed);
      g.globalCompositeOperation = 'screen';
      for (let k = 0; k < 3; k++){
        g.globalAlpha = 0.07 + r() * 0.12; g.fillStyle = cols[Math.floor(r() * cols.length)];
        const x = b.x0 + r() * w, sk = w * 0.22, bw = Math.max(1, w * (0.03 + r() * 0.06));
        g.beginPath(); g.moveTo(x, b.y0); g.lineTo(x + bw, b.y0); g.lineTo(x + bw - sk, b.y1); g.lineTo(x - sk, b.y1); g.closePath(); g.fill();
      }
      g.globalAlpha = 1; const hl = g.createLinearGradient(0, b.y0, 0, b.y0 + ht * 0.45); hl.addColorStop(0, 'rgba(255,220,170,0.16)'); hl.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = hl; g.fillRect(b.x0, b.y0, w, ht * 0.45);
      g.restore(); return true;
    }
    function tailLamp(t, s, x0, x1, y0, y1, split){
      const { g, pxW } = t, h = V3(t);
      const X0 = s * x0, X1 = s * x1, e = s * 0.01;
      h.face(h.qZ(-0.003, X0, X1, y0, y1), null, '#2a0605');
      const ry0 = split ? y0 + (y1 - y0) * split : y0;
      g.save(); g.shadowColor = 'rgba(255,40,20,0.95)'; g.shadowBlur = Math.max(2, pxW * 0.06);
      h.face(h.qZ(-0.004, X0 + e, X1 - e, ry0 + 0.01, y1 - 0.01), null, '#ff2a18'); g.restore();
      h.face(h.qZ(-0.005, X0 + s * 0.035, X1 - s * 0.035, (ry0 + y1) / 2 - 0.012, (ry0 + y1) / 2 + 0.012), null, '#ffc6b4');
      if (split){
        h.face(h.qZ(-0.004, X0 + e, X1 - e, y0 + (ry0 - y0) * 0.5 + 0.005, ry0 - 0.01), null, '#a65c12');
        h.face(h.qZ(-0.004, X0 + e, X1 - e, y0 + 0.01, y0 + (ry0 - y0) * 0.5 - 0.005), null, '#bdb7ab');
      }
      if (t.hero){
        const red = h.qZ(-0.004, X0 + e, X1 - e, ry0 + 0.01, y1 - 0.01), rb = h.bounds(red);
        g.strokeStyle = 'rgba(70,0,0,0.5)'; g.lineWidth = Math.max(0.5, pxW * 0.0035);
        for (let k = 1; k < 4; k++){ const xx = s * (x0 + (x1 - x0) * k / 4), p0 = t.P(xx, ry0 + 0.012, -0.005), p1 = t.P(xx, y1 - 0.012, -0.005); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
        g.strokeStyle = 'rgba(215,210,200,0.6)'; g.lineWidth = Math.max(0.7, pxW * 0.005); h.path(h.qZ(-0.004, X0, X1, y0, y1)); g.stroke();
        onLayer(t, t.litG, hl => { t.g.save(); t.g.shadowColor = 'rgba(255,70,40,1)'; t.g.shadowBlur = Math.max(3, pxW * 0.05); hl.face(red, null, '#ff7a58'); t.g.restore(); });
        t.lamps.push({ x: (rb.x0 + rb.x1) / 2, y: (rb.y0 + rb.y1) / 2, w: rb.x1 - rb.x0, h: rb.y1 - rb.y0 });
      }
    }
    function bumperPlate(t, bz){
      const { g, hw, V } = t, h = V3(t), b = V.bot;
      h.face(h.qZ(bz, -hw - 0.015, hw + 0.015, b - 0.05, b + 0.21), null, l => h.vg(l, '#4a4a4f', '#141416'));
      h.face(h.qY(b + 0.21, -hw - 0.015, hw + 0.015, bz, 0.01), [0, 1, 0], '#5c5c62');
      const pl = h.qZ(bz - 0.003, -0.26, 0.26, b - 0.01, b + 0.15);
      h.face(pl, null, '#f2c230');
      const pb = h.bounds(pl), ph = pb.y1 - pb.y0;
      g.save(); g.strokeStyle = '#1a1a1a'; g.lineWidth = Math.max(0.6, ph * 0.06); h.path(pl); g.stroke(); g.restore();
      if (ph > 4){ g.fillStyle = '#121212'; g.font = '700 ' + (ph * 0.72) + 'px ' + F.cond; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.plate, (pb.x0 + pb.x1) / 2, (pb.y0 + pb.y1) / 2 + 0.5); }
    }
    // the player's cab gets extra parts and extra layers: wheels and shadow on their own (they stay on the
    // road while the body moves), a lit copy of the lamps for braking, and masks saying where the street's light lands
    function onLayer(t, lg, fn){ const g0 = t.g; t.g = lg; try { fn(V3(t)); } finally { t.g = g0; } }
    function heroShadow(t){ const h = V3(t); for (let k = 8; k >= 1; k--){ const m = 0.028 * k; h.path(h.qY(0.004, -t.hw - m + 0.06, t.hw + m - 0.06, -0.1 - m, t.V.L + m)); t.g.fillStyle = 'rgba(0,0,0,0.1)'; t.g.fill(); } }
    function heroTyres(t){
      // seen under the bumper corners: a cheat, since a camera this high would hide them, but they ground the car
      const { g, hw, V } = t, h = V3(t), r = V.wheel[0], zt = 0.2;
      for (const s of [-1, 1]){
        const x0 = s < 0 ? -hw + 0.03 : hw - 0.27, x1 = x0 + 0.24, b = h.bounds(h.qZ(zt, x0, x1, 0, r * 1.2));
        const w = b.x1 - b.x0, ht = b.y1 - b.y0, gr = g.createLinearGradient(0, b.y0, 0, b.y1);
        gr.addColorStop(0, '#0a0a0b'); gr.addColorStop(0.7, '#1d1d1f'); gr.addColorStop(1, '#0c0c0d');
        g.fillStyle = gr; rr(g, b.x0, b.y0, w, ht, w * 0.3); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.55)'; for (let k = 1; k < 7; k++){ const yy = b.y0 + ht * k / 7; g.fillRect(b.x0 + w * 0.12, yy - 0.6, w * 0.76, 1.2); }
        g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(s < 0 ? b.x0 + w * 0.04 : b.x1 - w * 0.12, b.y0 + ht * 0.1, w * 0.08, ht * 0.8);
      }
      h.face(h.qZ(0.26, -hw + 0.27, hw - 0.27, 0.1, 0.34), null, '#060607');
    }
    function heroBumper(t){
      const { g, hw, V, pxW } = t, h = V3(t), b = V.bot, bz = -0.07, y0 = b - 0.06, y1 = b + 0.21;
      for (const s of [-1, 1]) h.face(h.qX(s * (hw + 0.015), y0, y1, bz, 0.42), [s, 0, 0], l => h.vg(l, '#3a3a3f', '#0e0e10'));
      h.face(h.qZ(bz, -hw - 0.015, hw + 0.015, y0, y1), null, l => h.vg(l, '#505056', '#2a2a2e', '#0f0f11'));
      h.face(h.qY(y1, -hw - 0.015, hw + 0.015, bz, 0.01), [0, 1, 0], '#6c6c72');
      // rubbing strip with its highlight, and red reflectors at the corners
      h.face(h.qZ(bz - 0.002, -hw - 0.01, hw + 0.01, b + 0.075, b + 0.12), null, '#09090a');
      h.face(h.qZ(bz - 0.003, -hw - 0.01, hw + 0.01, b + 0.117, b + 0.126), null, 'rgba(255,255,255,0.16)');
      for (const s of [-1, 1]) h.face(h.qZ(bz - 0.003, s < 0 ? -hw + 0.04 : hw - 0.2, s < 0 ? -hw + 0.2 : hw - 0.04, b + 0.15, b + 0.185), null, '#8a140c');
      // number plate in a recess, two plate lamps above it
      h.face(h.qZ(bz - 0.001, -0.29, 0.29, b - 0.035, b + 0.175), null, '#08080a');
      const pl = h.qZ(bz - 0.003, -0.26, 0.26, b - 0.01, b + 0.15);
      h.face(pl, null, '#f2c230');
      const pb = h.bounds(pl), ph = pb.y1 - pb.y0;
      g.save(); g.strokeStyle = '#1a1a1a'; g.lineWidth = Math.max(0.6, ph * 0.06); h.path(pl); g.stroke(); g.restore();
      if (ph > 4){ g.fillStyle = '#121212'; g.font = '700 ' + (ph * 0.72) + 'px ' + F.cond; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.plate, (pb.x0 + pb.x1) / 2, (pb.y0 + pb.y1) / 2 + 0.5); }
      const lg = g.createLinearGradient(0, pb.y0, 0, pb.y0 + ph * 0.5); lg.addColorStop(0, 'rgba(255,240,200,0.35)'); lg.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = lg; g.fillRect(pb.x0, pb.y0, pb.x1 - pb.x0, ph * 0.5);
      for (const s of [-1, 1]) h.face(h.qZ(bz - 0.004, s * 0.13 - 0.035, s * 0.13 + 0.035, b + 0.152, b + 0.168), null, '#fff2c8');
      // exhaust tip, low on the left
      const ec = P => { g.beginPath(); for (let k = 0; k <= 14; k++){ const a = k / 14 * Math.PI * 2, q = P(a); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.closePath(); };
      ec(a => t.P(-0.5 + 0.04 * Math.cos(a), 0.17 + 0.03 * Math.sin(a), -0.03)); g.fillStyle = '#5e5c58'; g.fill();
      ec(a => t.P(-0.5 + 0.028 * Math.cos(a), 0.17 + 0.02 * Math.sin(a), -0.031)); g.fillStyle = '#050505'; g.fill();
    }
    function grime(t, list, seed, k){
      // road dirt on the lower panels: a darkening upward from the bottom and a scatter of specks
      const { g } = t, h = V3(t), b = h.bounds(list), w = b.x1 - b.x0, ht = b.y1 - b.y0;
      if (w < 4) return;
      g.save(); h.path(list); g.clip();
      const gr = g.createLinearGradient(0, b.y1, 0, b.y0); gr.addColorStop(0, 'rgba(38,28,16,' + (0.5 * k) + ')'); gr.addColorStop(0.65, 'rgba(38,28,16,0)');
      g.fillStyle = gr; g.fillRect(b.x0, b.y0, w, ht);
      const r = rng(seed);
      for (let n = 0; n < 110 * k; n++){ const yy = b.y0 + ht * (0.3 + 0.7 * Math.sqrt(r())), sz = 0.5 + r() * 1.5; g.fillStyle = r() < 0.6 ? 'rgba(28,20,12,' + (0.08 + r() * 0.14) + ')' : 'rgba(170,150,120,' + (0.04 + r() * 0.08) + ')'; g.fillRect(b.x0 + r() * w, yy, sz, sz); }
      g.restore();
    }
    function heroMasks(t, rg, rl, rr2){
      // where the street's light lands. Reflection: weakest on the upright rear panel, strongest on glass and chrome.
      // Rim: the sides and the outer edges of the back, one mask per side so each takes its own side of the street.
      const V = t.V, hw = t.hw, b = V.bot, belt = V.belt, roof = V.roof, [zr0, zr1, zr2, zr3] = V.cab, [cw0, cw1] = V.cabW, Lz = V.L;
      const W1 = a => 'rgba(255,255,255,' + a + ')';
      const zAt = y => zr0 + (zr1 - zr0) * (y - belt) / (roof - belt) - 0.003, xw = y => (cw0 + (cw1 - cw0) * (y - belt) / (roof - belt)) - 0.12;
      const gy0 = belt + 0.05, gy1 = roof - 0.05, rn = [0, zr1 - zr0, -(roof - belt)];
      onLayer(t, rg, h => {
        for (const s of [-1, 1]){ h.face(h.qX(s * hw, b, belt, 0, Lz), [s, 0, 0], W1(0.3)); h.face([[s * cw0, belt, zr0], [s * cw1, roof, zr1], [s * cw1, roof, zr2], [s * cw0, belt, zr3]], [s * (roof - belt), (cw0 - cw1), 0], W1(0.45)); }
        h.face(h.qZ(-0.001, -hw, hw, b + 0.2, belt), null, W1(0.14));
        h.face(h.qY(belt + 0.001, -hw, hw, 0, zr0), [0, 1, 0], W1(0.5));
        h.face(h.qY(b + 0.211, -hw - 0.015, hw + 0.015, -0.07, 0.01), [0, 1, 0], W1(0.25));
        h.face([[-cw0, belt, zr0], [cw0, belt, zr0], [cw1, roof, zr1], [-cw1, roof, zr1]], rn, W1(0.4));
        h.face(h.qY(roof + 0.001, -cw1, cw1, zr1, zr2), [0, 1, 0], W1(0.7));
      });
      onLayer(t, t.reflGG, h => {
        h.face([[-xw(gy0), gy0, zAt(gy0)], [xw(gy0), gy0, zAt(gy0)], [xw(gy1), gy1, zAt(gy1)], [-xw(gy1), gy1, zAt(gy1)]], null, W1(0.8));
        h.face(h.qZ(-0.003, -0.56, 0.56, b + 0.36, b + 0.40), null, W1(0.9));
        for (const s of [-1, 1]) h.face(h.qZ(-0.005, s * 0.6, s * 0.84, b + 0.3, belt - 0.03), null, W1(0.35));
      });
      for (const [lg, s] of [[rl, -1], [rr2, 1]]) onLayer(t, lg, h => {
        h.face(h.qX(s * hw, b, belt, 0, Lz), [s, 0, 0], W1(1));
        h.face([[s * cw0, belt, zr0], [s * cw1, roof, zr1], [s * cw1, roof, zr2], [s * cw0, belt, zr3]], [s * (roof - belt), (cw0 - cw1), 0], W1(0.7));
        h.face(h.qX(s * (hw + 0.015), b - 0.06, b + 0.21, -0.07, 0.42), [s, 0, 0], W1(0.8));
        for (const [a0, a1, al] of [[0, 0.06, 0.85], [0.06, 0.14, 0.4], [0.14, 0.26, 0.14]]){
          h.face(h.qZ(-0.006, s * (hw - a1), s * (hw - a0), b + 0.2, belt), null, W1(al));
          h.face(h.qZ(-0.075, s * (hw + 0.015 - a1), s * (hw + 0.015 - a0), b - 0.06, b + 0.21), null, W1(al * 0.7));
        }
      });
    }
    function paintFX(t, list, seed){
      // rounded edges (darker at the sides) and soft neon reflections in the paint
      const { g } = t, h = V3(t), b = h.bounds(list);
      if (b.x1 - b.x0 < 2) return;
      g.save(); h.path(list); g.clip();
      const eg = g.createLinearGradient(b.x0, 0, b.x1, 0);
      eg.addColorStop(0, 'rgba(0,0,0,0.38)'); eg.addColorStop(0.14, 'rgba(0,0,0,0)'); eg.addColorStop(0.86, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(0,0,0,0.38)');
      g.fillStyle = eg; g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      g.globalCompositeOperation = 'screen';
      const r = rng(seed * 13 + t.tone + t.kind.length), cols = ['#3fe6d4', '#ff4fa8', '#ffd23a', '#ffb84d'];
      for (let k = 0; k < 2; k++){
        const x = b.x0 + (0.15 + r() * 0.7) * (b.x1 - b.x0), w = (b.x1 - b.x0) * (0.06 + r() * 0.08);
        const gr = g.createLinearGradient(x - w, 0, x + w, 0); const c = cols[Math.floor(r() * cols.length)];
        gr.addColorStop(0, hexA(c, 0)); gr.addColorStop(0.5, hexA(c, 0.22)); gr.addColorStop(1, hexA(c, 0));
        g.fillStyle = gr; g.fillRect(x - w, b.y0, w * 2, b.y1 - b.y0);
      }
      g.restore();
    }
    const VDRAW = {};
    VDRAW.saloon = t => {
      const { g, P, V, hw, tone, kind, pxW } = t, h = V3(t);
      const taxi = kind === 'taxi', body = V.cols[tone % V.cols.length], upper = taxi ? V.upper : body;
      const [zr0, zr1, zr2, zr3] = V.cab, [cw0, cw1] = V.cabW, b = V.bot, belt = V.belt, roof = V.roof, Lz = V.L;
      if (t.hero) onLayer(t, t.lowG, () => { heroShadow(t); heroTyres(t); });
      else { shadow3(t); tyreBacks(t); }
      for (const s of [-1, 1]){
        if (h.face(h.qX(s * hw, b, belt, 0, Lz), [s, 0, 0], l => h.vg(l, shade(body, -0.05), shade(body, -0.55)))){
          h.face(h.qX(s * (hw + 0.002), belt - 0.08, belt - 0.045, 0.04, Lz - 0.06), null, hexA(shade(body, 0.4), 0.6));
          g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = Math.max(0.6, pxW * 0.004);
          for (const zz of [zr0 + 0.15, (zr0 + zr3) / 2 + 0.1, zr3 - 0.05]){ const p0 = P(s * (hw + 0.003), b + 0.08, zz), p1 = P(s * (hw + 0.003), belt - 0.02, zz); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
          wheels3(t, s);
          if (t.hero){
            const r0 = V.wheel[0];
            g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = Math.max(0.8, pxW * 0.006);
            for (const zc of [V.wheel[1], V.wheel[2]]){ g.beginPath(); for (let k = 0; k <= 12; k++){ const a = Math.PI * k / 12, q = P(s * (hw + 0.005), r0 + r0 * 1.28 * Math.sin(a), zc + r0 * 1.28 * Math.cos(a)); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); }
            for (const zz of [zr0 + 0.55, (zr0 + zr3) / 2 + 0.45]) h.face(h.qX(s * (hw + 0.005), belt - 0.15, belt - 0.11, zz, zz + 0.16), null, '#bdb9ae');
            grime(t, h.qX(s * (hw + 0.004), b, belt, 0, Lz), 61 + s, 0.8);
          }
        }
      }
      h.face(h.qY(belt, -hw, hw, 0, Lz), [0, 1, 0], l => h.vg(l, shade(body, -0.12), mixHex(body, WARM, 0.22)));
      h.face(h.qY(belt + 0.001, -hw + 0.02, hw - 0.02, 0, 0.05), null, hexA(mixHex(body, '#ffffff', 0.45), 0.7));
      h.face(h.qZ(0, -hw, hw, b + 0.2, belt), [0, 0, -1], l => h.vg(l, shade(body, 0.12), shade(body, -0.5)));
      paintFX(t, h.qZ(-0.0005, -hw, hw, b + 0.2, belt), 3);
      paintFX(t, h.qY(belt + 0.0005, -hw, hw, 0, zr0), 5);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = Math.max(0.6, pxW * 0.004);
      h.path([[-0.56, belt - 0.004, -0.001], [-0.56, b + 0.27, -0.001], [0.56, b + 0.27, -0.001], [0.56, belt - 0.004, -0.001]]); g.stroke();
      h.face(h.qZ(-0.002, -0.56, 0.56, b + 0.36, b + 0.40), null, taxi ? '#c2c0b8' : '#6d6f72');
      if (t.hero){ grime(t, h.qZ(-0.0009, -hw, hw, b + 0.2, belt), 71, 1); h.face(h.qZ(-0.0015, -0.04, 0.04, b + 0.47, b + 0.51), null, '#a8a59c'); }
      for (const s of [-1, 1]){ if (taxi) tailLamp(t, s, 0.60, 0.84, b + 0.30, belt - 0.03, 0.4); else tailLamp(t, s, 0.32, 0.88, b + 0.42, belt - 0.05, 0); }
      if (t.hero){ heroBumper(t); grime(t, h.qZ(-0.0705, -hw - 0.015, hw + 0.015, b - 0.06, b + 0.21), 73, 0.9); }
      else bumperPlate(t, -0.07);
      const sideN = s => [s * (roof - belt), (cw0 - cw1), 0];
      for (const s of [-1, 1]){
        const side = [[s * cw0, belt, zr0], [s * cw1, roof, zr1], [s * cw1, roof, zr2], [s * cw0, belt, zr3]];
        if (h.face(side, sideN(s), l => h.vg(l, shade(upper, -0.12), shade(upper, -0.5)))){
          const xAt = y => s * (cw0 + (cw1 - cw0) * (y - belt) / (roof - belt)) + s * 0.003;
          const y0 = belt + 0.07, y1 = roof - 0.06;
          const zb0 = zr0 + 0.28, zb1 = zr3 - 0.3, zt0 = zr1 + 0.12, zt1 = zr2 - 0.05, zp = (zb0 + zb1) / 2 + 0.1;
          glass3(t, [[xAt(y0), y0, zb0], [xAt(y1), y1, zt0], [xAt(y1), y1, zp - 0.05], [xAt(y0), y0, zp - 0.05]], 11 + s);
          glass3(t, [[xAt(y0), y0, zp + 0.05], [xAt(y1), y1, zp + 0.05], [xAt(y1), y1, zt1], [xAt(y0), y0, zb1]], 13 + s);
        }
      }
      const rn = [0, zr1 - zr0, -(roof - belt)];
      h.face([[-cw0, belt, zr0], [cw0, belt, zr0], [cw1, roof, zr1], [-cw1, roof, zr1]], rn, l => h.vg(l, shade(upper, 0.12), shade(upper, -0.25)));
      const gy0 = belt + 0.05, gy1 = roof - 0.05;
      const zAt = y => zr0 + (zr1 - zr0) * (y - belt) / (roof - belt) - 0.003;
      const xw = y => (cw0 + (cw1 - cw0) * (y - belt) / (roof - belt)) - 0.12;
      glass3(t, [[-xw(gy0), gy0, zAt(gy0)], [xw(gy0), gy0, zAt(gy0)], [xw(gy1), gy1, zAt(gy1)], [-xw(gy1), gy1, zAt(gy1)]], 7 + tone * 3 + kind.length, rn, taxi ? () => {
        if (t.hero){
          // through the rear window and out of the windscreen: the dashboard and pillars frame the street ahead
          const ink = '#0b0a09';
          h.face([[-cw0 + 0.04, belt + 0.02, zr3 - 0.05], [cw0 - 0.04, belt + 0.02, zr3 - 0.05], [cw0 - 0.06, belt + 0.14, zr3 - 0.45], [-cw0 + 0.06, belt + 0.14, zr3 - 0.45]], null, ink);
          for (const s of [-1, 1]) h.face([[s * (cw0 - 0.02), belt, zr3], [s * (cw0 - 0.13), belt, zr3], [s * (cw1 - 0.1), roof, zr2], [s * (cw1 - 0.01), roof, zr2]], null, ink);
          h.face(h.qZ(zr2 - 0.02, -cw1, cw1, roof - 0.07, roof), null, ink);
          // the driver's head, then the front seats and headrests in front of it, lit from behind by the street ahead
          const d0 = P(0.38, 1.2, 2.62), d1 = P(0.48, 1.2, 2.62), dr = Math.abs(d1[0] - d0[0]);
          g.fillStyle = 'rgba(16,13,11,0.97)'; g.beginPath(); g.ellipse(d0[0], d0[1], dr, dr * 1.2, 0, 0, Math.PI * 2); g.fill();
          for (const s of [-1, 1]){
            const sb = h.bounds(h.qZ(2.5, s * 0.38 - 0.22, s * 0.38 + 0.22, 0.6, 0.97)), hr = h.bounds(h.qZ(2.5, s * 0.38 - 0.1, s * 0.38 + 0.1, 0.99, 1.15));
            g.fillStyle = 'rgba(14,12,10,0.96)';
            rr(g, sb.x0, sb.y0, sb.x1 - sb.x0, sb.y1 - sb.y0, (sb.x1 - sb.x0) * 0.22); g.fill();
            rr(g, hr.x0, hr.y0, hr.x1 - hr.x0, hr.y1 - hr.y0, (hr.x1 - hr.x0) * 0.3); g.fill();
            g.fillStyle = 'rgba(255,200,150,0.16)';
            g.fillRect(sb.x0 + (sb.x1 - sb.x0) * 0.12, sb.y0, (sb.x1 - sb.x0) * 0.76, Math.max(1, (sb.y1 - sb.y0) * 0.06));
            g.fillRect(hr.x0 + (hr.x1 - hr.x0) * 0.18, hr.y0, (hr.x1 - hr.x0) * 0.64, Math.max(1, (hr.y1 - hr.y0) * 0.12));
          }
        }
        // the driver sits on the right: Hong Kong drives on the left
        const c0 = P(0.36, 1.22, 2.35), c1 = P(0.47, 1.22, 2.35), rad = Math.abs(c1[0] - c0[0]);
        if (!t.hero){ g.fillStyle = 'rgba(80,68,58,0.6)'; g.beginPath(); g.ellipse(c0[0], c0[1], rad, rad * 1.25, 0, 0, Math.PI * 2); g.fill(); }
        const c2 = P(-0.36, 1.1, 1.95); g.fillStyle = t.hero ? 'rgba(20,16,13,0.95)' : 'rgba(46,40,34,0.55)'; g.beginPath(); g.ellipse(c2[0], c2[1], rad * 0.95, rad * 0.8, 0, 0, Math.PI * 2); g.fill();
        if (t.hero){
          for (const s of [-1, 1]){ const q = h.bounds(h.qZ(1.6, s * 0.42 - 0.13, s * 0.42 + 0.13, 0.98, 1.14)); g.fillStyle = 'rgba(22,18,15,0.95)'; rr(g, q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0, (q.x1 - q.x0) * 0.3); g.fill(); g.fillStyle = 'rgba(255,190,140,0.14)'; g.fillRect(q.x0 + (q.x1 - q.x0) * 0.15, q.y0, (q.x1 - q.x0) * 0.7, Math.max(1, (q.y1 - q.y0) * 0.12)); }
          h.face(h.qY(belt + 0.04, -0.72, 0.72, zr0 - 0.02, zr0 + 0.42), null, '#0a0908');
          const hy0 = roof - 0.085, hy1 = roof - 0.055, hz = zAt(roof - 0.07) + 0.03, hm = h.qZ(hz, -0.14, 0.14, hy0, hy1), hb = h.bounds(hm);
          h.face(hm, null, '#3a0806');
          onLayer(t, t.litHMG, hl => { t.g.save(); t.g.shadowColor = 'rgba(255,60,30,1)'; t.g.shadowBlur = Math.max(3, pxW * 0.04); hl.face(hm, null, '#ff5a3a'); t.g.restore(); });
          t.lamps.push({ x: (hb.x0 + hb.x1) / 2, y: (hb.y0 + hb.y1) / 2, w: hb.x1 - hb.x0, h: hb.y1 - hb.y0, hm: true });
          g.strokeStyle = 'rgba(255,170,110,0.13)'; g.lineWidth = Math.max(0.5, pxW * 0.0025);
          for (let k = 1; k < 7; k++){ const yy = gy0 + (gy1 - gy0) * k / 8, q0 = P(-xw(yy) + 0.04, yy, zAt(yy)), q1 = P(xw(yy) - 0.04, yy, zAt(yy)); g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke(); }
        }
      } : null);
      if (t.hero){ g.strokeStyle = 'rgba(210,205,195,0.6)'; g.lineWidth = Math.max(0.8, pxW * 0.006); h.path([[-xw(gy0), gy0, zAt(gy0)], [xw(gy0), gy0, zAt(gy0)], [xw(gy1), gy1, zAt(gy1)], [-xw(gy1), gy1, zAt(gy1)]]); g.stroke(); }
      h.face(h.qY(roof, -cw1, cw1, zr1, zr2), [0, 1, 0], l => h.vg(l, shade(upper, -0.08), mixHex(upper, WARM, 0.18)));
      paintFX(t, h.qY(roof + 0.0005, -cw1, cw1, zr1, zr2), 7);
      for (const s of [-1, 1]) h.face(h.qZ(zr3 - 0.45, s > 0 ? cw0 - 0.02 : -cw0 - 0.17, s > 0 ? cw0 + 0.17 : -cw0 + 0.02, belt + 0.06, belt + 0.19), [0, 0, -1], shade(upper, -0.35));
      if (taxi){
        const sx = 0.25, sy0 = roof, sy1 = roof + 0.22, sz0 = 2.0, sz1 = 2.28;
        if (t.hero) h.face(h.qZ(sz0 - 0.01, -sx - 0.04, sx + 0.04, roof, roof + 0.035), null, '#1e1b18');
        for (const s of [-1, 1]) h.face(h.qX(s * sx, sy0, sy1, sz0, sz1), [s, 0, 0], '#cfc4a6');
        h.face(h.qY(sy1, -sx, sx, sz0, sz1), [0, 1, 0], '#f3ead2');
        const rs = h.qZ(sz0, -sx, sx, sy0, sy1);
        g.save(); g.shadowColor = 'rgba(255,232,190,0.9)'; g.shadowBlur = Math.max(2, pxW * 0.05); h.face(rs, [0, 0, -1], '#f8efd6'); g.restore();
        const rb = h.bounds(rs);
        if (rb.y1 - rb.y0 > 3){ g.fillStyle = '#c4241c'; g.font = '700 ' + ((rb.y1 - rb.y0) * 0.8) + 'px ' + F.cond; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TAXI', (rb.x0 + rb.x1) / 2, (rb.y0 + rb.y1) / 2 + 0.5); }
        const a0 = P(0.55, roof, zr1 + 0.12), a1 = P(0.62, roof + 0.45, zr1 - 0.02);
        g.strokeStyle = '#141414'; g.lineWidth = Math.max(0.6, pxW * 0.004); g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.stroke();
      }
    };
    VDRAW.van = t => {
      const { g, V, hw, tone, pxW } = t, h = V3(t);
      const body = V.cols[tone % V.cols.length], b = V.bot, roof = V.roof, Lz = V.L, rt = roof - 0.08;
      shadow3(t); tyreBacks(t);
      for (const s of [-1, 1]){
        if (h.face(h.qX(s * hw, b, rt, 0, Lz - 0.5), [s, 0, 0], l => h.vg(l, shade(body, -0.1), shade(body, -0.55)))){
          glass3(t, h.qX(s * (hw + 0.003), 1.18, roof - 0.22, 0.45, Lz - 1.65), 21 + s);
          glass3(t, h.qX(s * (hw + 0.003), 1.18, roof - 0.22, Lz - 1.5, Lz - 0.75), 23 + s);
          h.face(h.qX(s * (hw + 0.002), 0.9, 0.94, 0.05, Lz - 0.55), null, hexA(shade(body, -0.4), 0.5));
          wheels3(t, s);
        }
        h.face([[s * hw, rt, 0], [s * hw, rt, Lz - 0.5], [s * (hw - 0.08), roof, Lz - 0.5], [s * (hw - 0.08), roof, 0]], [s, 1, 0], shade(body, -0.04));
      }
      h.face(h.qY(roof, -hw + 0.08, hw - 0.08, 0, Lz - 0.5), [0, 1, 0], l => h.vg(l, shade(body, -0.18), mixHex(body, WARM, 0.15)));
      h.face(h.qZ(0, -hw, hw, b + 0.2, rt), [0, 0, -1], l => h.vg(l, shade(body, 0.08), shade(body, -0.45)));
      h.face([[-hw, rt, 0], [hw, rt, 0], [hw - 0.08, roof, 0.03], [-hw + 0.08, roof, 0.03]], [0, 1, -1], shade(body, 0.12));
      glass3(t, h.qZ(-0.002, -0.7, 0.7, 1.2, roof - 0.17), 25 + tone, [0, 0, -1]);
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = Math.max(0.6, pxW * 0.004); h.path(h.qZ(-0.002, -0.79, 0.79, b + 0.24, roof - 0.12)); g.stroke();
      h.face(h.qZ(-0.003, -0.1, 0.1, 1.02, 1.07), null, '#3a3a3a');
      for (const s of [-1, 1]) tailLamp(t, s, 0.71, 0.84, 0.6, 1.12, 0.45);
      bumperPlate(t, -0.07);
    };
    VDRAW.minibus = t => {
      const { g, V, hw, tone, pxW } = t, h = V3(t);
      const body = V.cols[0], band = V.band[tone % 2], b = V.bot, roof = V.roof, Lz = V.L, rt = roof - 0.12;
      shadow3(t); tyreBacks(t);
      for (const s of [-1, 1]){
        if (h.face(h.qX(s * hw, b, rt, 0, Lz), [s, 0, 0], l => h.vg(l, shade(body, -0.12), shade(body, -0.55)))){
          h.face(h.qX(s * (hw + 0.002), roof - 0.42, rt, 0, Lz), null, shade(band, -0.3));
          for (let z = 0.45; z < Lz - 1.0; z += 1.05) glass3(t, h.qX(s * (hw + 0.003), 1.32, roof - 0.5, z, z + 0.9), 31 + Math.round(z * 3) + s);
          h.face(h.qX(s * (hw + 0.002), 0.95, 1.01, 0.1, Lz - 0.1), null, shade(band, -0.25));
          wheels3(t, s);
        }
        h.face([[s * hw, rt, 0], [s * hw, rt, Lz], [s * (hw - 0.14), roof, Lz], [s * (hw - 0.14), roof, 0]], [s, 1, 0], shade(band, -0.1));
      }
      h.face(h.qY(roof, -hw + 0.14, hw - 0.14, 0, Lz), [0, 1, 0], l => h.vg(l, shade('#d8d2c0', -0.25), mixHex('#d8d2c0', WARM, 0.2)));
      h.face(h.qZ(0, -hw, hw, b + 0.2, rt), [0, 0, -1], l => h.vg(l, shade(body, 0.06), shade(body, -0.45)));
      h.face(h.qZ(-0.001, -hw, hw, roof - 0.42, rt), null, band);
      h.face([[-hw, rt, 0], [hw, rt, 0], [hw - 0.14, roof, 0.05], [-hw + 0.14, roof, 0.05]], [0, 1, -1], shade(band, 0.1));
      h.face(h.qZ(-0.001, -hw, hw, 0.95, 1.01), null, band);
      glass3(t, h.qZ(-0.002, -0.82, 0.82, 1.42, roof - 0.52), 41 + tone, [0, 0, -1]);
      h.face(h.qZ(-0.003, -0.03, 0.03, 1.42, roof - 0.52), null, shade(body, -0.2));
      for (const s of [-1, 1]) tailLamp(t, s, 0.82, 0.96, 0.55, 1.3, 0.45);
      bumperPlate(t, -0.08);
    };
    function bakeVehicle(kind, tone, off, camD, camH, pxW, plate, hero){
      const V = VEH[kind], hw = V.W / 2;
      const raw = (x, y, z) => { const dz = z + camD; return [(x + off) / dz, -(y - camH) / dz]; };
      const top = V.roof + (kind === 'taxi' ? 0.3 : 0.1);
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (const x of [-hw - 0.3, hw + 0.3]) for (const y of [0, top]) for (const z of [-0.35, V.L + 0.3]){ const p = raw(x, y, z); minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
      const S = pxW * camD / V.W, pad = Math.ceil(pxW * 0.1);
      const c = mk((maxx - minx) * S + pad * 2, (maxy - miny) * S + pad * 2), g = c.getContext('2d');
      const P = (x, y, z) => { const p = raw(x, y, z); return [(p[0] - minx) * S + pad, (p[1] - miny) * S + pad]; };
      const t = { g, P, S, pxW, camD, cam: [-off, camH, -camD], V, hw, tone, kind, plate, hero };
      const layer = () => mk(c.width, c.height);
      let low, lit, litHM;
      if (hero){ low = layer(); lit = layer(); litHM = layer(); t.lowG = low.getContext('2d'); t.litG = lit.getContext('2d'); t.litHMG = litHM.getContext('2d'); t.lamps = []; }
      VDRAW[kind === 'taxi' || kind === 'sedan' ? 'saloon' : kind](t);
      const a = P(0, 0, 0), out = { c, ax: a[0], ay: a[1], pxW, Wm: V.W };
      if (hero){
        const refl = layer(), reflG = layer(), rimL = layer(), rimR = layer(); t.reflGG = reflG.getContext('2d');
        heroMasks(t, refl.getContext('2d'), rimL.getContext('2d'), rimR.getContext('2d'));
        Object.assign(out, { low, lit, litHM, refl, reflG, rimL, rimR, lamps: t.lamps });
      }
      return out;
    }
    /* ================================================================ other sprites */
    let sprites = null;
    function makeGlow(col, size){
      const c = mk(size, size), g = c.getContext('2d');
      const rg = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      rg.addColorStop(0, '#fff6e0'); rg.addColorStop(0.12, col); rg.addColorStop(0.4, hexA(col, 0.35)); rg.addColorStop(1, hexA(col, 0));
      g.fillStyle = rg; g.fillRect(0, 0, size, size); return c;
    }
    function makeHalo(){
      // a soft dark patch the size of a sign face (the inner 120x60), so a sign stands out from the wall behind it
      const c = mk(200, 140), g = c.getContext('2d');
      g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = 26; g.fillStyle = 'rgba(0,0,0,0.9)'; rr(g, 40, 40, 120, 60, 8); g.fill();
      return c;
    }
    function makeStreak(col){
      const c = mk(16, 128), g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, hexA(col, 1)); gr.addColorStop(0.35, hexA(col, 0.45)); gr.addColorStop(1, hexA(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 16, 128);
      const gx = g.createLinearGradient(0, 0, 16, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 16, 128); return c;
    }
    function makePool(col, a){
      const c = mk(256, 256), g = c.getContext('2d');
      const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, hexA(col, a)); rg.addColorStop(0.5, hexA(col, a * 0.45)); rg.addColorStop(1, hexA(col, 0));
      g.fillStyle = rg; g.fillRect(0, 0, 256, 256); return c;
    }
    // A person is a dark silhouette, backlit with a warm rim from the shop windows, and ghosted the way
    // HDR merging ghosts anyone who moves: a sideways smear and red/cyan fringes baked in here, and fading
    // copies along their path added when they are drawn. Kinds: 0 plain, 1 skirt, 2 backpack, 3 umbrella,
    // 4 shopping bag, 5 phone. Frames 0-3 are a walking stride, frame 4 is standing.
    function drawFigure(g, v, f){
      const cx = 60, foot = 242, Ht = 196, top = foot - Ht;
      const sw = f < 4 ? Math.sin(f / 4 * Math.PI * 2) : 0, lift = f < 4 ? Math.cos(f / 4 * Math.PI * 2) : 0;
      const wide = v === 1 ? 0.86 : 1;
      g.fillStyle = '#0b0806'; g.strokeStyle = '#0b0806'; g.lineCap = 'round'; g.lineJoin = 'round';
      const limb = (x0, y0, len, ang, w0, w1) => {
        const x1 = x0 + Math.sin(ang) * len, y1 = y0 + Math.cos(ang) * len, nx = Math.cos(ang), ny = -Math.sin(ang);
        g.beginPath(); g.moveTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.lineTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2);
        g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); g.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); g.closePath(); g.fill();
        g.beginPath(); g.arc(x1, y1, w1 / 2, 0, Math.PI * 2); g.fill();
        return [x1, y1];
      };
      // legs: a scissor stride, the back foot lifting
      const hipY = top + 100;
      for (const sgn of [-1, 1]){
        const up = Math.max(0, sgn * lift) * 9, legL = foot - hipY - 5 - up;
        const [fx, fy] = limb(cx + sgn * 6 * wide, hipY, legL, sgn * sw * 0.32, 16 * wide, 7);
        g.beginPath(); g.ellipse(fx + 4, fy + 1, 8, 4, 0, 0, Math.PI * 2); g.fill();
      }
      // torso, with a coat that flares a little at the hem
      const sh = 46 * wide, wa = 32 * wide, hp = 36 * wide, shY = top + 30;
      if (v === 2){ g.beginPath(); rrAdd(g, cx - 33, shY + 4, 28, 56, 11); g.fill(); }
      g.beginPath(); g.moveTo(cx - sh / 2, shY + 4); g.quadraticCurveTo(cx - sh / 2 + 2, shY - 3, cx, shY - 4); g.quadraticCurveTo(cx + sh / 2 - 2, shY - 3, cx + sh / 2, shY + 4);
      g.lineTo(cx + wa / 2, top + 86); g.lineTo(cx + hp / 2 + 2, hipY + 8); g.lineTo(cx - hp / 2 - 2, hipY + 8); g.lineTo(cx - wa / 2, top + 86); g.closePath(); g.fill();
      if (v === 1){ g.beginPath(); g.moveTo(cx - 15, top + 86); g.lineTo(cx + 15, top + 86); g.lineTo(cx + 24 + Math.abs(sw) * 5, top + 140); g.lineTo(cx - 24 - Math.abs(sw) * 5, top + 140); g.closePath(); g.fill(); }
      // head and neck
      g.fillRect(cx - 5, top + 18, 10, 14);
      g.beginPath(); g.ellipse(cx + 1, top + 10, 11, 13.5, 0, 0, Math.PI * 2); g.fill();
      if (v === 1){ g.beginPath(); g.ellipse(cx - 4, top + 20, 10, 14, 0.2, 0, Math.PI * 2); g.fill(); }
      // arms
      const shX = sh / 2 - 4;
      let hand = null, phone = null, grip = null;
      for (const sgn of [-1, 1]){
        if (v === 3 && sgn === 1){ const [ex, ey] = limb(cx + shX, shY + 5, 34, 0.35, 10, 9); grip = limb(ex, ey, 28, Math.PI - 0.5, 9, 8); continue; }
        if (v === 5 && sgn === 1){ const [ex, ey] = limb(cx + shX, shY + 5, 34, 0.1, 10, 9); const h = limb(ex, ey, 21, Math.PI - 1.0, 9, 8); phone = [h[0] - 3, h[1] - 10]; continue; }
        const h = limb(cx + sgn * shX, shY + 5, 70, -sgn * sw * 0.3 + sgn * 0.07, 10.5, 7.5);
        if (sgn === 1) hand = h;
      }
      if (v === 3 && grip){ // umbrella: shaft from the hand, canopy over the head
        const ux = cx + 6, uy = top - 10;
        g.lineWidth = 3; g.beginPath(); g.moveTo(grip[0], grip[1] + 6); g.lineTo(ux, uy); g.stroke();
        g.beginPath(); g.moveTo(ux - 44, uy + 12);
        g.quadraticCurveTo(ux - 40, uy - 26, ux, uy - 30); g.quadraticCurveTo(ux + 40, uy - 26, ux + 44, uy + 12);
        for (let q = 3; q >= 0; q--){ const xa = ux - 44 + (q + 1) * 22, xb = ux - 44 + q * 22; g.quadraticCurveTo((xa + xb) / 2, uy + 4, xb, uy + 12); }
        g.closePath(); g.fill();
      }
      if (v === 4 && hand){ g.beginPath(); rrAdd(g, hand[0] - 10, hand[1] - 2, 22, 28, 3); g.fill(); g.lineWidth = 2; g.beginPath(); g.moveTo(hand[0] - 5, hand[1]); g.lineTo(hand[0], hand[1] - 8); g.lineTo(hand[0] + 6, hand[1]); g.stroke(); }
      return phone;
    }
    function tintOf(src, col){ const c = mk(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; }
    function makePed(v, f, flip){
      const PW = 120, PH = 250;
      const sil = mk(PW, PH), sg = sil.getContext('2d');
      if (flip){ sg.translate(PW, 0); sg.scale(-1, 1); }
      if (f < 4){ sg.translate(60, 242); sg.rotate(0.05); sg.translate(-60, -242); }
      let phone = drawFigure(sg, v, f);
      if (phone && f < 4){ const a = 0.05, dx = phone[0] - 60, dy = phone[1] - 242; phone = [60 + dx * Math.cos(a) - dy * Math.sin(a), 242 + dx * Math.sin(a) + dy * Math.cos(a)]; }
      if (phone && flip) phone = [PW - phone[0] - 7, phone[1]];
      const c = mk(PW, PH), g = c.getContext('2d');
      const rim = tintOf(sil, '#ffc27a'), red = tintOf(sil, '#ff3048'), cyan = tintOf(sil, '#30d8ff');
      // the HDR merge ghosts a moving figure: a sideways smear, then red and cyan fringes either side
      g.globalAlpha = 0.09; for (const dx of [-10, -6, 6, 10]) g.drawImage(sil, dx, 0);
      g.globalAlpha = 0.42; g.drawImage(red, -4.5, 0); g.drawImage(cyan, 4.5, 0);
      g.globalAlpha = 0.7; g.drawImage(rim, flip ? -2 : 2, -1.5);
      g.globalAlpha = 1; g.drawImage(sil, 0, 0);
      if (phone){
        // the screen, and its cold light spilling up onto the face
        const gr = g.createRadialGradient(phone[0] + 3, phone[1] - 8, 0, phone[0] + 3, phone[1] - 8, 30);
        gr.addColorStop(0, 'rgba(140,230,255,0.55)'); gr.addColorStop(1, 'rgba(140,230,255,0)');
        g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(phone[0] - 30, phone[1] - 40, 66, 66);
        const fx = flip ? PW - 69 : 69, gf = g.createRadialGradient(fx, 58, 0, fx, 58, 13);
        gf.addColorStop(0, 'rgba(140,230,255,0.3)'); gf.addColorStop(1, 'rgba(140,230,255,0)'); g.fillStyle = gf; g.fillRect(fx - 14, 44, 28, 28);
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#d8f8ff'; g.shadowColor = '#7fe4ff'; g.shadowBlur = 10; g.fillRect(phone[0], phone[1], 7, 10); g.shadowBlur = 0;
      }
      return c;
    }
    function makeSkyline(){
      const sw = Math.round(W * 2 * RS), sh = Math.round(H * 0.32 * RS);
      const c = mk(sw, sh), g = c.getContext('2d'), r = rng(77);
      let x = 0;
      while (x < sw){
        const bw = (14 + r() * 40) * RS, bh = (0.2 + r() * 0.8) * sh;
        g.fillStyle = LOOK.skyline.body; g.fillRect(x, sh - bh, bw, bh);
        g.fillStyle = LOOK.skyline.win;
        for (let yy = sh - bh + 4 * RS; yy < sh - 3 * RS; yy += 4 * RS)
          for (let xx = x + 2 * RS; xx < x + bw - 2 * RS; xx += 3.5 * RS)
            if (r() < LOOK.skyline.winP){ g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(xx, yy, 1.4 * RS, 1.6 * RS); }
        g.globalAlpha = 1;
        x += bw + r() * 6 * RS;
      }
      return c;
    }
    function cabGeometry(){
      // place the cab where the road says it should be: its rear on the ground at CAB_Y of the screen height
      const gy = H * CAB_Y, zc = DEPTH * CAM_H * K / (gy - H * HZ);
      return { gy, zc, rw: DEPTH / zc * VEH.taxi.W * UPM * K };
    }
    // seven angles, from a little to the left round to a little to the right; close enough together to switch without a jump
    const CAB_OFFS = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75];
    function cabView(st){
      const n = CAB_OFFS.length, u = (clamp(st.lean, -1, 1) + 1) / 2 * (n - 1);
      return { near: Math.round(u) };
    }
    function cabMotion(st){
      // suspension: a slow float over the road, a quicker patter, and a little vibration; the body rolls to the
      // outside of a lane change, lifts at the back under braking and squats as it pulls away
      // Reduce motion: no roll, and the float, pitch and vibration eased right down
      const p = st.pos, on = st.moving ? 1 : 0, calm = reduceMotion ? 0.35 : 1;
      const bob = on * calm * (Math.sin(p * 0.0021) * 0.75 + Math.sin(p * 0.0063 + 1.3) * 0.4 + Math.sin(p * 0.031) * 0.14);
      return { bob, roll: reduceMotion ? 0 : -clamp(st.lean, -1, 1) * 0.05, pitch: (-st.brake * 1.8 + st.accel * 0.9) * calm, vib: on * calm * Math.sin(p * 0.05) * 0.12 };
    }
    /* ================================================================ the projection table, and the grain */
    let grainAmt = 0.75, midLevel = 15;   // grain-overall, and the grain level on the road round the taxi
    const B = []; for (let n = 0; n <= DRAW + 7; n++) B.push({ z: 0, scale: 0, sx: 0, sy: 0, ok: false });

    /* ================================================================ render: the street */
    function project(st){
      const base = Math.floor(st.pos / SEG) % N_SEG, pct = (st.pos % SEG) / SEG;
      let dx = -(segs[base].curve * pct), x = 0;
      const camX = st.x * ROAD;
      for (let n = 0; n < B.length; n++){
        const i = base + n, seg = segs[i % N_SEG], z = i * SEG - st.pos, b = B[n];
        b.seg = seg; b.z = z; b.ok = z > 80;
        if (b.ok){ b.scale = DEPTH / z; b.sx = W / 2 + b.scale * (x - camX) * K; b.sy = H * HZ + b.scale * CAM_H * K; }
        x += dx; dx += seg.curve;
      }
    }
    const edgeX = (b, wx) => b.sx + b.scale * wx * K;
    const yAt = (b, wy) => b.sy - b.scale * wy * K;
    const PROD = ['#c42a1f','#1f5fd4','#e8c23a','#3a9a5a','#e87a2a','#d84a9a','#f2ead8','#6a4a2a'];
    const pickOf = (arr, a, b, c) => arr[Math.floor(hash3(a, b, c) * arr.length) % arr.length];
    function seg7(g, str, x, y, hgt, on, off){
      const w = hgt * 0.52, t = hgt * 0.12, gap = hgt * 0.16;
      const M = { '0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg','-':'g',' ':'' };
      const segP = s => { const h2 = hgt / 2; g.beginPath();
        switch (s){ case 'a': g.rect(t * 0.8, 0, w - t * 1.6, t); break; case 'b': g.rect(w - t, t * 0.8, t, h2 - t * 1.2); break; case 'c': g.rect(w - t, h2 + t * 0.4, t, h2 - t * 1.2); break;
          case 'd': g.rect(t * 0.8, hgt - t, w - t * 1.6, t); break; case 'e': g.rect(0, h2 + t * 0.4, t, h2 - t * 1.2); break; case 'f': g.rect(0, t * 0.8, t, h2 - t * 1.2); break; case 'g': g.rect(t * 0.8, h2 - t / 2, w - t * 1.6, t); break; } };
      let cx = x;
      for (const ch of str){
        if (ch === '.'){ g.fillStyle = on; g.fillRect(cx - gap * 0.35, y + hgt - t, t, t); cx += t + gap * 0.25; continue; }
        g.save(); g.translate(cx, y); g.transform(1, 0, -0.08, 1, 0, 0);
        for (const s of 'abcdefg'){ segP(s); g.fillStyle = (M[ch] || '').includes(s) ? on : off; g.fill(); }
        g.restore(); cx += w + gap;
      }
      return cx;
    }
    function seg7w(str, hgt){ let w = 0; for (const ch of str) w += ch === '.' ? hgt * 0.12 + hgt * 0.04 : hgt * 0.68; return w; }
    function hudText(g, txt, x, y, size, weight, family, col, align, spacing){
      g.font = weight + ' ' + size + 'px ' + family; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic';
      if ('letterSpacing' in g) g.letterSpacing = (spacing || 0) + 'px';
      g.fillStyle = col; g.fillText(txt, x, y);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    }

    /* ================================================================ WebGL2: the street drawn on the graphics chip
       The street is built once into four buffers held on the graphics chip: the road, the buildings (with every
       pole and light fitting), the light pools and reflections on the wet road, and the hanging signs. Each corner
       is stored as (segment, how far along it, across, up), and the vertex shader projects it from a small table
       of where each segment ahead of the camera sits on screen, so only that table changes from frame to frame.
       People, traffic and the cab are drawn on top each frame from small batches. */
    const canvas = env.canvas, hudC = env.hud, hctx = hudC.getContext('2d');
    let W = 960, H = 540, RS = 1, PW = 960, PH = 540, K = 480;
    const gl = env.gl;
    const cabGrain = true, cabRefl = true;
    const Z = { white: ZONES.white, sky: ZONES.sky, sign: 0, cars: ZONES.cars, cab: ZONES.cabSome };

    // ---- vertex flags (byte 3 of the info attribute) and texture slots (byte 1)
    const FL = { ADD: 1, LEV: 2, GND: 4, FLICK: 8, SH1: 16, SH2: 32, STREAK: 48, LEVONLY: 64, LINE: 128 };
    const NOTEX = 255, TEX2D = 250, GRAD_PAVE = 253, GRAD_ROAD = 254;

    const colCache = new Map();
    function rgba(str){
      let c = colCache.get(str);
      if (!c){
        if (str[0] === '#'){ let h = str.slice(1); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); c = [n >> 16, (n >> 8) & 255, n & 255, 255]; }
        else { const m = str.slice(str.indexOf('(') + 1, str.indexOf(')')).split(',').map(Number); c = [m[0], m[1], m[2], Math.round((m.length > 3 ? m[3] : 1) * 255)]; }
        colCache.set(str, c);
      }
      return c;
    }
    // a style: colour, texture slot, grain level, flags, furthest segment it is drawn at, atlas rectangle
    function S(col, o){ const c = rgba(col); return { c: o && o.a !== undefined ? [c[0], c[1], c[2], Math.round(c[3] * o.a)] : c, ly: o && o.ly !== undefined ? o.ly : NOTEX, lv: o && o.lv !== undefined ? o.lv : 0, fl: o && o.fl || 0, mx: o && o.mx !== undefined ? o.mx : 255, uv: o && o.uv }; }

    /* ---- recorders: interleaved 32-byte vertices
       0  pos   4 x float   (segment, t, across, up) for the street; (x, y, depth, -) on screen for the batches
       16 uv    2 x uint16  normalised
       20 col   4 x uint8   normalised, straight alpha
       24 info  4 x uint8   integer: texture slot, level (or line minimum width x10), flags, furthest segment
       28 off   2 x int16   line half-width offset, in quarter world units */
    class Rec {
      constructor(cap){ this.cap = cap || 4096; this.buf = new ArrayBuffer(this.cap * 32); this.views(); this.nv = 0; this.idx = new Uint32Array(this.cap * 2); this.ni = 0; this.segStart = new Int32Array(N_SEG); }
      views(){ this.f32 = new Float32Array(this.buf); this.u16 = new Uint16Array(this.buf); this.u8 = new Uint8Array(this.buf); this.i16 = new Int16Array(this.buf); }
      need(nv, ni){
        if (this.nv + nv > this.cap){ let c = this.cap; while (this.nv + nv > c) c *= 2; const nb = new ArrayBuffer(c * 32); new Uint8Array(nb).set(this.u8); this.buf = nb; this.cap = c; this.views(); }
        if (this.ni + ni > this.idx.length){ let n = this.idx.length; while (this.ni + ni > n) n *= 2; const a = new Uint32Array(n); a.set(this.idx); this.idx = a; }
      }
      v(a, b, c, d, u, w, s, ox, oy){
        const k = this.nv++, f = k * 8, h = k * 16, y = k * 32, col = s.c;
        this.f32[f] = a; this.f32[f + 1] = b; this.f32[f + 2] = c; this.f32[f + 3] = d;
        this.u16[h + 8] = Math.round(clamp(u, 0, 1) * 65535); this.u16[h + 9] = Math.round(clamp(w, 0, 1) * 65535);
        this.u8[y + 20] = col[0]; this.u8[y + 21] = col[1]; this.u8[y + 22] = col[2]; this.u8[y + 23] = col[3];
        this.u8[y + 24] = s.ly; this.u8[y + 25] = s.lv; this.u8[y + 26] = s.fl; this.u8[y + 27] = s.mx;
        this.i16[h + 14] = ox || 0; this.i16[h + 15] = oy || 0;
        return k;
      }
      begin(i){ this.seg = i; this.segStart[i] = this.ni; }
      // four corners, each [t, across, up], in order round the edge; texture from s.uv (top-left, top-right, bottom-right, bottom-left) or uvs
      quad(P, s, uvs){
        this.need(4, 6);
        const r = s.uv, U = uvs || (r ? [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]] : null), k = this.nv;
        for (let q = 0; q < 4; q++) this.v(this.seg, P[q][0], P[q][1], P[q][2], U ? U[q][0] : 0, U ? U[q][1] : 0, s);
        const I = this.idx, n = this.ni; I[n] = k; I[n + 1] = k + 1; I[n + 2] = k + 2; I[n + 3] = k; I[n + 4] = k + 2; I[n + 5] = k + 3; this.ni += 6;
      }
      // a polygon, filled from its centre
      fan(P, s){
        const m = P.length; this.need(m + 1, m * 3);
        let ct = 0, cx = 0, cy = 0; for (const p of P){ ct += p[0]; cx += p[1]; cy += p[2]; }
        const k = this.nv; this.v(this.seg, ct / m, cx / m, cy / m, 0, 0, s);
        for (const p of P) this.v(this.seg, p[0], p[1], p[2], 0, 0, s);
        for (let q = 0; q < m; q++){ const n = this.ni; this.idx[n] = k; this.idx[n + 1] = k + 1 + q; this.idx[n + 2] = k + 1 + (q + 1) % m; this.ni += 3; }
      }
      // a stroked line through points [across, up] at t = 0, half-width hw in world units, never thinner than minPx on screen
      line(pts, hw, minPx, s0){
        const s = Object.assign({}, s0, { fl: s0.fl | FL.LINE, lv: Math.round(minPx * 10) });
        for (let q = 0; q + 1 < pts.length; q++){
          const [x0, y0] = pts[q], [x1, y1] = pts[q + 1], L = Math.hypot(x1 - x0, y1 - y0) || 1;
          const nx = -(y1 - y0) / L * hw * 4, ny = (x1 - x0) / L * hw * 4;
          this.need(4, 6); const k = this.nv;
          this.v(this.seg, 0, x0, y0, 0, 0, s, Math.round(nx), Math.round(ny)); this.v(this.seg, 0, x1, y1, 0, 0, s, Math.round(nx), Math.round(ny));
          this.v(this.seg, 0, x1, y1, 0, 0, s, -Math.round(nx), -Math.round(ny)); this.v(this.seg, 0, x0, y0, 0, 0, s, -Math.round(nx), -Math.round(ny));
          const I = this.idx, n = this.ni; I[n] = k; I[n + 1] = k + 1; I[n + 2] = k + 2; I[n + 3] = k; I[n + 4] = k + 2; I[n + 5] = k + 3; this.ni += 6;
        }
      }
      // a sprite facing the camera, centred on (t, across, up), half-size hx by hy in world units
      sprite(t, x, y, hx, hy, s){ this.quad([[t, x - hx, y + hy], [t, x + hx, y + hy], [t, x + hx, y - hy], [t, x - hx, y - hy]], s); }
    }

    /* ================================================================ the texture atlas
       Every sign, figure, car and glow is drawn once with the 2D canvas, trimmed to what it actually covers and
       packed into layers of one 2048 x 2048 texture array, with smaller copies for distance. */
    const ATL = 2048, GUT = 6;
    const atlas = { items: new Map(), tex: null, layers: 0, list: [] };
    function trim(c){
      const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++){ const row = y * w * 4; for (let x = 0; x < w; x++) if (d[row + x * 4 + 3] > 2){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; } }
      if (x1 < 0) return { c: mk(1, 1), ox: 0, oy: 0 };
      x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(w - 1, x1 + 1); y1 = Math.min(h - 1, y1 + 1);
      const o = mk(x1 - x0 + 1, y1 - y0 + 1); o.getContext('2d').drawImage(c, -x0, -y0);
      return { c: o, ox: x0, oy: y0 };
    }
    function atlasAdd(key, c, doTrim, extra){
      const t = doTrim ? trim(c) : { c, ox: 0, oy: 0 };
      const it = Object.assign({ key, c: t.c, ox: t.ox, oy: t.oy, w: t.c.width, h: t.c.height, sw: c.width, sh: c.height }, extra || {});
      atlas.items.set(key, it); atlas.list.push(it); return it;
    }
    function atlasPack(){
      const L = atlas.list.slice().sort((a, b) => b.h - a.h);
      const layers = []; let cur = null;
      const newLayer = () => { cur = { x: GUT, y: GUT, rowH: 0 }; layers.push(cur); };
      newLayer();
      for (const it of L){
        if (it.w + GUT * 2 > ATL || it.h + GUT * 2 > ATL) throw new Error('sprite too large: ' + it.key);
        let placed = false;
        for (let li = 0; li < layers.length && !placed; li++){
          const ly = layers[li];
          if (ly.x + it.w + GUT <= ATL && ly.y + it.h + GUT <= ATL){ placed = true; }
          else if (ly.y + ly.rowH + GUT + it.h + GUT <= ATL){ ly.x = GUT; ly.y += ly.rowH + GUT; ly.rowH = 0; placed = true; }
          if (placed){ it.layer = li; it.x = ly.x; it.y = ly.y; ly.x += it.w + GUT; ly.rowH = Math.max(ly.rowH, it.h); }
        }
        if (!placed){ newLayer(); it.layer = layers.length - 1; it.x = cur.x; it.y = cur.y; cur.x += it.w + GUT; cur.rowH = it.h; }
        it.uv = [it.x / ATL, it.y / ATL, (it.x + it.w) / ATL, (it.y + it.h) / ATL];
      }
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 7, gl.RGBA8, ATL, ATL, layers.length);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      for (const it of L) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, it.x, it.y, it.layer, it.w, it.h, 1, gl.RGBA, gl.UNSIGNED_BYTE, it.c);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAX_LEVEL, 6);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const an = gl.getExtension('EXT_texture_filter_anisotropic');
      if (an) gl.texParameterf(gl.TEXTURE_2D_ARRAY, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      atlas.tex = tex; atlas.layers = layers.length;
      for (const it of L) it.c = null;
    }
    // the texture position of a pixel of an item's original (untrimmed) canvas
    const atlasUV = (it, px, py) => [(it.x + px - it.ox) / ATL, (it.y + py - it.oy) / ATL];
    const AS = (key, col, o) => { const it = atlas.items.get(key); return S(col || '#ffffff', Object.assign({ ly: it.layer, uv: it.uv }, o || {})); };

    // signs: one picture per sign, at the largest size it's hung at, scaled for the rest (every copy of a sign keeps its shape)
    const signTex = {};
    function makeDisc(){ const c = mk(64, 64), g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill(); return c; }
    function makeWhiteStreak(){ return makeStreak('#ffffff'); }
    function buildAtlas(){
      atlas.items.clear(); atlas.list.length = 0;
      const big = new Map();
      const note = (t, w, h) => { const m = big.get(t.id); if (!m || w > m.w) big.set(t.id, { t, w, h }); };
      for (const s of segs) for (const g of s.signs) note(g.t, g.w, g.h);
      for (const b of buildings) for (const f of b.fsigns) note(f.t, f.w, f.h);
      for (const { t, w, h } of big.values()){
        const spr = makeSign(t, w, h);
        const it = atlasAdd('sign:' + t.id, spr.c, true);
        signTex[t.id] = { it, wc: w, hc: h, padPx: spr.pad * SPX, col: spr.col };
      }
      sprites.peds.forEach((byV, fl) => byV.forEach((frames, v) => frames.forEach((c, f) => atlasAdd('ped:' + fl + ':' + v + ':' + f, c, true))));
      for (const kind in sprites.cars) sprites.cars[kind].forEach((views, tone) => views.forEach((spr, vi) => atlasAdd('car:' + kind + ':' + tone + ':' + vi, spr.c, true, { ax: spr.ax, ay: spr.ay, pxW: spr.pxW })));
      atlasAdd('glow:lamp', sprites.lamp); atlasAdd('glow:red', sprites.red); atlasAdd('glow:green', sprites.green); atlasAdd('glow:blue', sprites.blue);
      atlasAdd('glow:redGlow', makeGlow('#ff3a20', 64)); atlasAdd('pool', sprites.pool); atlasAdd('streak', makeWhiteStreak()); atlasAdd('disc', makeDisc());
      addTokens();
      atlasPack();
    }

    /* ================================================================ building the street, once */
    const R = {};
    function band(Rq, wx, y0, y1, s, t0 = 0, t1 = 1){ Rq.quad([[t0, wx, y0], [t1, wx, y0], [t1, wx, y1], [t0, wx, y1]], s); }
    function emitRoad(Rd, Dc, i){
      const seg = segs[i], white = { lv: Z.white, fl: FL.LEV | FL.GND };
      const strip = (a, b, col, ly) => Rd.quad([[0, a, 0], [1, a, 0], [1, b, 0], [0, b, 0]], S(col, Object.assign({ ly }, white)));
      strip(-BLD, -ROAD, '#ffffff', GRAD_PAVE); strip(ROAD, BLD, '#ffffff', GRAD_PAVE);
      strip(-ROAD, ROAD, '#ffffff', GRAD_ROAD);
      strip(-ROAD, -ROAD + 70, LOOK.road.kerb); strip(ROAD - 70, ROAD, LOOK.road.kerb);
      strip(-ROAD + 110, -ROAD + 150, LOOK.road.yellow); strip(-ROAD + 190, -ROAD + 230, LOOK.road.yellow); strip(ROAD - 150, ROAD - 110, LOOK.road.yellow);
      if (!(Math.floor(i / 3) % 2) && !seg.junc) for (const lx of [-ROAD / 3, ROAD / 3]) strip(lx - 30, lx + 30, LOOK.road.lane);
      let cross = false; for (let k = 0; k < 6; k++) if (segs[(i - k + N_SEG) % N_SEG].cross) cross = true;
      if (cross) for (let x = -ROAD + 260; x < ROAD - 300; x += 520) strip(x, x + 270, LOOK.road.cross);
      // the wet road: a pool under each lamp, and every sign's colour run down the tarmac towards you
      if (seg.lamp){ const lx = seg.lamp * (ROAD - 350); Dc.sprite(0, lx, 0, 2600, 728, AS('pool', '#ffffff', { fl: FL.ADD })); }
      for (const s of seg.signs){
        if (s.roof) continue;
        const len = 2.2 * s.h + 0.6 * s.y, hw = 0.28 * s.w;
        Dc.quad([[0, s.x - hw, 0], [0, s.x + hw, 0], [0, s.x + hw, -len], [0, s.x - hw, -len]], AS('streak', signColour(s.t), { a: LOOK.reflect * (s.span ? 0.6 : 1), fl: FL.ADD | FL.STREAK, mx: 120 }));
      }
    }
    function emitJunction(Bq, i){
      const back = 4200, wh = { lv: Z.white, fl: FL.LEV };
      for (const s of [-1, 1]){
        const a = s * BLD, f = s * (BLD + back);
        Bq.quad([[0, a, 0], [0, f, 0], [1, f, 0], [1, a, 0]], S(LOOK.road.paveFar, { lv: Z.white, fl: FL.LEV | FL.GND }));
        band(Bq, f, 0, 9000, S('#2a221a', { lv: Z.white, fl: FL.LEV | FL.SH1 }));
        band(Bq, f, 0, SHOP_H, S(LOOK.shop[(i + (s > 0 ? 2 : 0)) % LOOK.shop.length], wh));
        const win = S(LOOK.win, Object.assign({ mx: 100 }, wh));
        for (let fy = SHOP_H + 300, fl = 0; fy < 8600; fy += 1000, fl++){ if (hash3(i, fl, s + 5) > 0.45) continue; band(Bq, f, fy, fy + 500, win); }
      }
    }
    function emitEndFace(Bq, s, bl){
      const x1 = s * BLD, x2 = s * (BLD + 4200), wh = { lv: Z.white, fl: FL.LEV };
      const rect = (xa, xb, ya, yb, st) => Bq.quad([[0, xa, yb], [0, xb, yb], [0, xb, ya], [0, xa, ya]], st);
      rect(x1, x2, 0, bl.h, S(shade(bl.col, -0.2), wh));
      rect(x1, x2, 0, SHOP_H, S(LOOK.shop[bl.shop], wh));
      const win = S(LOOK.win, wh), fh = bl.T.floor;
      for (let fy = SHOP_H + 250, fl = 0; fy < bl.h - 300; fy += fh, fl++)
        for (let c = 0; c < 6; c++){ if (hash3(bl.id, fl, c + 70) > (bl.T.win || 0.4)) continue; const u0 = lerp(x1, x2, 0.08 + c * 0.15), u1 = lerp(x1, x2, 0.17 + c * 0.15); rect(Math.min(u0, u1), Math.max(u0, u1), fy + 260, fy + 260 + fh * 0.5, win); }
    }
    // the ground floor of one slice of a building: the same shop fronts as the mock-up, recorded instead of drawn
    function emitFront(E, u, ku, k, bl){
      const sd = u.seed, band = E.band, poly = E.poly;
      const det = () => { E.mx = 130; };
      switch (u.type){
      case 'shop': {
        const base = LOOK.shop[sd % LOOK.shop.length];
        band(0, SHOP_H, base); det();
        band(0, 260, shade(base, -0.35));
        for (const y of [300, 520, 740]){
          band(y, y + 26, 'rgba(30,20,12,0.45)');
          band(y + 26, y + 150, pickOf(PROD, k, y, sd), 0.1, 0.45);
          band(y + 26, y + 120, pickOf(PROD, k, y + 1, sd), 0.55, 0.9);
        }
        band(SHOP_H - 110, SHOP_H, shade(base, 0.2));
        if (ku === 0) band(0, SHOP_H, 'rgba(20,14,9,0.8)', 0, 0.14);
        break; }
      case 'cafe': {
        band(0, SHOP_H, '#f0c27a'); det();
        band(0, 330, '#4a2c16');
        if (ku % 2 === 0){ band(330, 380, '#2a1a0e', 0.12, 0.88); band(240, 330, 'rgba(20,12,6,0.7)', 0.42, 0.58); }
        band(730, 900, '#d8c08e', 0.06, 0.94); band(780, 796, '#c42a1f', 0.12, 0.88); band(830, 846, '#c42a1f', 0.12, 0.62);
        band(SHOP_H - 80, SHOP_H, '#e8c886');
        if (ku % 2 === 0) band(0, SHOP_H, 'rgba(20,14,9,0.7)', 0, 0.07);
        break; }
      case 'roast': {
        band(0, SHOP_H, '#f2a050'); det();
        band(0, 380, '#8f7f62'); band(185, 195, 'rgba(0,0,0,0.15)');
        band(860, 880, '#2a1a0e');
        // roast geese hung by the neck from the rail, and strips of char siu between them
        const duck = [], glaze = [], siu = [], hook = [];
        for (const [t0, t1] of [[0.06, 0.38], [0.6, 0.92]]){
          const tm = (t0 + t1) / 2, dr = (hash3(k, t0 * 10, sd) - 0.5) * 60, w = t1 - t0;
          hook.push([[tm - 0.006, 860], [tm + 0.006, 860], [tm + 0.006, 830], [tm - 0.006, 830]]);
          duck.push([[tm - 0.02, 832], [tm + 0.02, 832], [tm + 0.025, 760 + dr], [t1 - w * 0.08, 700 + dr], [t1, 620 + dr], [t1 - w * 0.2, 545 + dr], [tm + 0.02, 520 + dr], [tm - 0.02, 520 + dr], [t0 + w * 0.2, 545 + dr], [t0, 620 + dr], [t0 + w * 0.08, 700 + dr], [tm - 0.025, 760 + dr]]);
          glaze.push([[tm + 0.01, 740 + dr], [t1 - w * 0.12, 690 + dr], [t1 - w * 0.1, 630 + dr], [tm + 0.03, 600 + dr]]);
        }
        if (hash3(k, 3, sd) < 0.6) siu.push([[0.45, 850], [0.53, 850], [0.535, 640], [0.445, 650]]);
        for (const p of hook) poly(p, '#3a2a1a');
        for (const p of duck) poly(p, '#7a2c10');
        for (const p of siu) poly(p, '#b02414');
        for (const p of glaze) poly(p, 'rgba(255,200,120,0.45)');
        break; }
      case 'electro': {
        band(0, SHOP_H, '#8e948a'); det();
        band(0, 300, '#2a2f36');
        band(SHOP_H - 60, SHOP_H, 'rgba(40,28,14,0.3)');
        const scr = ['#2f7bd8','#18b8a8','#d84a9a','#3ab04a','#e8a020','#6a5ad8'];
        for (const [y0, y1] of [[380, 600], [640, 860]]) for (const [t0, t1] of [[0.08, 0.46], [0.54, 0.92]]){
          band(y0, y1, '#14171c', t0, t1);
          band(y0 + 18, y1 - 18, pickOf(scr, k, y0 + t0 * 100, sd), t0 + 0.04, t1 - 0.04);
        }
        break; }
      case 'store': {
        band(0, SHOP_H, '#a9ad88'); det();
        band(0, 220, '#6c705e'); band(0, 90, 'rgba(40,28,14,0.35)');
        for (const y of [330, 560]){ band(y, y + 22, '#86887a'); band(y + 22, y + 170, pickOf(PROD, k, y, sd), 0.1, 0.9); }
        band(860, 920, '#2a58ac'); band(920, 960, '#b8301e');
        if (ku === 0 || ku === u.len - 1) band(0, 860, 'rgba(40,46,54,0.75)', 0, 0.1);
        break; }
      case 'shutter': {
        band(0, SHOP_H, LOOK.shutter); det();
        const half = hash3(sd, 1, 2) < 0.4;
        if (half) band(0, 220, '#e8b870');
        for (let yy = half ? 240 : 60; yy < SHOP_H - 40; yy += 70) band(yy, yy + 12, 'rgba(0,0,0,0.35)');
        break; }
      case 'stair': {
        band(0, SHOP_H, '#2a221a'); det();
        band(0, 880, '#0c0907', 0.12, 0.88);
        band(840, 878, '#cfe6d8', 0.22, 0.78);
        band(300, 420, '#3a3530', 0.62, 0.84);
        for (const t of [0.2, 0.34, 0.48, 0.62, 0.76]) band(0, 820, 'rgba(130,128,118,0.55)', t, t + 0.025);
        break; }
      case 'market': {
        band(0, SHOP_H, '#3a2816'); det();
        const fr = ['#f08a1c','#e8c23a','#5aa83a','#d8362a','#f2d8a0'];
        band(0, 120, '#5a3a1c');
        band(120, 300, pickOf(fr, k, 1, sd), 0.05, 0.48); band(120, 280, pickOf(fr, k, 2, sd), 0.52, 0.95);
        band(300, 330, '#5a3a1c');
        band(420, 560, pickOf(fr, k, 3, sd), 0.1, 0.9);
        band(760, 800, '#fff1c0', 0.44, 0.56);
        E.glow('glow:lamp', 0.5, 780, 200, 0.7);
        band(860, SHOP_H, k % 2 ? '#c42a1f' : '#d2c29c');
        break; }
      case 'seafood': {
        band(0, SHOP_H, '#e8b870'); det();
        band(0, 230, '#3a2a1a');
        band(250, 700, '#1d6fb8', 0.06, 0.94); band(250, 290, '#0d3a66', 0.06, 0.94); band(660, 700, '#7fd0ff', 0.06, 0.94);
        for (const [t, y] of [[0.3, 420], [0.62, 520], [0.45, 600]]) band(y, y + 18, 'rgba(220,245,255,0.8)', t, t + 0.04);
        band(760, 900, '#c42a1f', 0.04, 0.96);
        break; }
      case 'mall': {
        band(0, SHOP_H, '#c7a066'); det();
        const e0 = 120 + 640 * (ku / u.len), e1 = 120 + 640 * ((ku + 1) / u.len);
        poly([[0, e0], [1, e1], [1, e1 + 90], [0, e0 + 90]], '#5a5a60');
        if (ku % 2 === 0) band(0, SHOP_H, 'rgba(110,110,116,0.8)', 0, 0.05);
        band(SHOP_H - 60, SHOP_H, '#dcbc80'); band(0, 90, 'rgba(40,28,14,0.3)');
        break; }
      case 'carpark': {
        band(0, SHOP_H, '#2a241c'); det();
        band(0, 820, '#0b0907', 0.06, 0.94);
        band(330, 370, ku % 2 ? '#f2c230' : '#141210', 0.06, 0.94);
        band(780, 818, '#cfe6d8', 0.2, 0.8);
        break; }
      case 'police': {
        const mid = Math.floor(u.len / 2), door = Math.abs(ku - mid) <= 1;
        band(0, SHOP_H, door ? '#f6f1dc' : '#c9d3da'); det();
        if (door){
          // the lit lobby: glass doors in dark frames, a counter, steps up from the pavement
          for (let st2 = 0; st2 < 4; st2++) band(st2 * 40, st2 * 40 + 22, '#9aa3aa');
          band(160, 200, '#3a4248');
          for (const t of [0.02, 0.5, 0.96]) band(200, 900, '#2a3238', t, t + 0.04);
          band(880, 920, '#2a3238');
          band(380, 520, '#7a6a52', 0.15, 0.85);
          band(920, SHOP_H, '#cfd7dd');
        } else {
          band(0, 140, '#6a7076');
          for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) band(140, 700, '#2c3a36', t, t + 0.04);
          band(660, 700, '#2c3a36');
          band(700, SHOP_H, '#8a949c');
        }
        if (ku === mid){
          // the blue lamp over the door
          band(SHOP_H + 560, SHOP_H + 690, '#3a6ae8', 0.3, 0.7);
          E.glow('glow:blue', 0.5, SHOP_H + 620, 450, 1);
          E.levDisc(0.5, SHOP_H + 620, 225);
        }
        band(SHOP_H, SHOP_H + 130, '#565c62');
        return; }
      }
      band(SHOP_H, SHOP_H + 130, LOOK.awning);
    }
    function emitSlice(Bq, i, side){
      const s = side ? 1 : -1, wd = segs[i].wall[side];
      if (!wd) return;
      const bl = wd.b, T = bl.T, k = wd.k, WX = s * BLD;
      const E = { mx: 255 };
      E.band = (y0, y1, col, t0 = 0, t1 = 1, fl = 0) => band(Bq, WX, y0, y1, S(col, { lv: Z.white, fl: FL.LEV | fl, mx: E.mx }), t0, t1);
      E.poly = (pts, col) => Bq.fan(pts.map(([t, y]) => [t, WX, y]), S(col, { lv: Z.white, fl: FL.LEV, mx: E.mx }));
      E.glow = (key, t, y, r, a) => Bq.sprite(t, WX, y, r, r, AS(key, '#ffffff', { a, fl: FL.ADD, mx: E.mx }));
      E.levDisc = (t, y, r) => Bq.sprite(t, WX, y, r, r, AS('disc', '#ffffff', { lv: Z.sign, fl: FL.LEVONLY, mx: E.mx }));
      E.band(0, bl.h, bl.col, 0, 1, FL.SH1);
      const u = bl.unitAt[k] || { type: 'shop', k0: 0, len: bl.len, seed: 0 };
      emitFront(E, u, k - u.k0, k, bl);
      if (!T.scaffold){
        E.mx = 105;
        const P = { lit: [], white: [], blue: [], dim: [], ac: [], rail: [], line: [], bars: [], slat: [] };
        const add = (p, y0, y1, t0, t1) => p.push([y0, y1, t0, t1]);
        for (let fy = SHOP_H + 250, fl = 0; fy + T.floor * 0.55 < bl.h - 160; fy += T.floor, fl++){
          if (T.glass){
            const on = hash3(bl.id, fl, 7) < T.win;
            add(on ? P.white : P.dim, fy + 120, fy + T.floor - 150, 0, 1);
            add(P.line, fy - 10, fy + 25, 0, 1);
            continue;
          }
          if (T.ribbon){
            const on = hash3(bl.id, fl, Math.floor(k / 3)) < T.win, pick = hash3(bl.id, fl, 99);
            add(on ? (pick < 0.25 ? P.white : P.lit) : P.dim, fy + 280, fy + 720, 0, 1);
            if (k % 2 === 0 && hash3(bl.id, fl, k) < T.ac) add(P.ac, fy + 150, fy + 260, 0.25, 0.85);
            continue;
          }
          if (fl === 0 && bl.f1 === 'wide'){
            add(hash3(bl.id, 5, 5) < 0.5 ? P.white : P.lit, fy + 150, fy + 780, 0, 1);
            for (let yy = fy + 230; yy < fy + 760; yy += 85) add(P.slat, yy, yy + 16, 0, 1);
            if (k % 3 === 0) add(P.slat, fy + 150, fy + 780, 0, 0.08);
            continue;
          }
          const col = k % T.pitch;
          if (col < T.winW){
            const wid = Math.floor(k / T.pitch), on = hash3(bl.id, fl, wid) < T.win, pick = hash3(bl.id, wid, fl + 50);
            const t0 = col === 0 ? 0.18 : 0, t1 = col === T.winW - 1 ? 0.82 : 1;
            add(on ? (pick < 0.22 ? P.white : pick < 0.3 ? P.blue : P.lit) : P.dim, fy + 260, fy + 260 + T.floor * 0.5, t0, t1);
            if (col === 0 && hash3(bl.id, fl, wid + 300) < T.ac) add(P.ac, fy + 110, fy + 245, 0.25, 1);
            if (bl.f1 === 'grille' && fl < (bl.type === 'police' ? 9 : 2)){ for (const tb of [0.3, 0.55, 0.8]) add(P.bars, fy + 240, fy + 280 + T.floor * 0.5, tb - 0.02, tb + 0.01); add(P.bars, fy + 240 + T.floor * 0.25, fy + 255 + T.floor * 0.25, t0, t1); }
          }
          if (T.balcony) add(P.rail, fy + 40, fy + 110, 0, 1);
        }
        for (const [list, col] of [[P.dim, LOOK.winDim], [P.lit, LOOK.win], [P.white, LOOK.winWhite], [P.blue, LOOK.winBlue], [P.ac, '#857e6e'], [P.rail, 'rgba(150,128,95,0.55)'], [P.line, 'rgba(70,80,92,0.6)'], [P.bars, 'rgba(18,14,10,0.85)'], [P.slat, 'rgba(60,46,30,0.55)']])
          for (const q of list) E.band(q[0], q[1], col, q[2], q[3]);
      }
      E.mx = 130;
      if (T.scaffold){
        E.band(SHOP_H + 140, bl.h, '#2b5a48');
        for (let fy = SHOP_H + 140; fy < bl.h; fy += 1000) E.band(fy, fy + 45, '#9a7f55');
        if (k % 2 === 0) E.band(SHOP_H + 140, bl.h, '#9a7f55', 0, 0.07);
      }
      if (k === 0) E.band(0, bl.h, 'rgba(0,0,0,0.32)', 0, 0.09);
      E.mx = 255;
      E.band(bl.h - 130, bl.h, bl.col, 0, 1, FL.SH2);
      if (T.tank && k % 5 === 2){ E.mx = 115; E.band(bl.h, bl.h + 430, '#15110c', 0.12, 0.92); }
      for (const f of bl.fsigns) if (k >= f.k0 && k < f.k0 + f.len) emitFacade(Bq, s, f, k);
    }
    function emitFacade(Bq, s, f, k){
      // a sign painted across the face of a building, one slice per segment, mapped in true perspective
      const sg = signTex[f.t.id], it = sg.it, j = k - f.k0, len = f.len;
      const uN = s < 0 ? j / len : (len - j) / len, uF = s < 0 ? (j + 1) / len : (len - j - 1) / len;
      const px = u => sg.padPx + u * sg.wc * SPX, py0 = sg.padPx, py1 = sg.padPx + sg.hc * SPX;
      const wx = s * (BLD - 25), yT = f.y + f.h, yB = f.y;
      Bq.quad([[0, wx, yT], [1, wx, yT], [1, wx, yB], [0, wx, yB]], S('#ffffff', { ly: it.layer, lv: Z.sign, fl: FL.LEV, mx: 140 }),
        [atlasUV(it, px(uN), py0), atlasUV(it, px(uF), py0), atlasUV(it, px(uF), py1), atlasUV(it, px(uN), py1)]);
    }
    function emitLights(Bq, Tq, i){
      const red = segs[i].lights === 1, pole = S(LOOK.pole);
      for (const s of [-1, 1]){
        const px = s * (ROAD + 260), cy = red ? 3000 - 0.2 * 820 : 3000 - 0.8 * 820;
        Bq.line([[px, 0], [px, 2180]], 40, 1, pole);
        Bq.quad([[0, px - 150, 3000], [0, px + 150, 3000], [0, px + 150, 2180], [0, px - 150, 2180]], S('#0d0b09'));
        Bq.sprite(0, px, cy, 90 * 32 / 30, 90 * 32 / 30, AS('disc', red ? '#ff3020' : '#30ff9a'));
        Tq.sprite(0, px, cy, 550, 550, AS(red ? 'glow:red' : 'glow:green', '#ffffff', { fl: FL.ADD }));
        Tq.quad([[0, px - 300, 3150], [0, px + 300, 3150], [0, px + 300, 2030], [0, px - 300, 2030]], S('#ffffff', { lv: Z.sign, fl: FL.LEVONLY }));
      }
    }
    function emitLamp(Bq, Tq, i){
      const s = segs[i].lamp, poleX = s * (ROAD + 140), headX = s * (ROAD - 350);
      Bq.line([[poleX, 0], [poleX, 2900], [headX, 2800]], 35, 1, S(LOOK.pole));
      Tq.sprite(0, headX, 2800, 750, 750, AS('glow:lamp', '#ffffff', { fl: FL.ADD }));
      Tq.sprite(0, headX, 2800, 450 * 32 / 30, 450 * 32 / 30, AS('disc', '#ffffff', { lv: Z.sign, fl: FL.LEVONLY }));
    }
    function emitSign(Tq, s){
      const sg = signTex[s.t.id], it = sg.it, pole = S(LOOK.pole);
      if (s.span){
        const ty = s.y + s.h + 500;
        Tq.line([[-BLD, ty], [BLD, ty]], 25, 1, pole);
        for (const fx of [-0.35, 0.35]) Tq.line([[s.x + s.w * fx, ty], [s.x + s.w * fx, s.y + s.h]], 25, 1, pole);
      } else if (s.roof){
        for (const fx of [-0.35, 0, 0.35]) Tq.line([[s.x + s.w * fx, s.y], [s.x + s.w * fx, s.y - 120]], 22.5, 1, pole);
      } else {
        const ay = s.y + s.h * 0.85;
        Tq.line([[s.side * BLD, ay], [s.x, ay]], 20, 1, pole);
      }
      const kk = (s.w / sg.wc) / SPX, X = px => s.x - s.w / 2 + (px - sg.padPx) * kk, Y = py => s.y + s.h - (py - sg.padPx) * kk;
      const x0 = X(it.ox), x1 = X(it.ox + it.w), y0 = Y(it.oy), y1 = Y(it.oy + it.h);
      Tq.quad([[0, x0, y0], [0, x1, y0], [0, x1, y1], [0, x0, y1]], S('#ffffff', { ly: it.layer, uv: it.uv, fl: s.t.flicker ? FL.FLICK : 0 }));
      Tq.quad([[0, s.x - s.w * 0.58, s.y + s.h * 1.08], [0, s.x + s.w * 0.58, s.y + s.h * 1.08], [0, s.x + s.w * 0.58, s.y - s.h * 0.08], [0, s.x - s.w * 0.58, s.y - s.h * 0.08]], S('#ffffff', { lv: Z.sign, fl: FL.LEVONLY }));
    }
    function emitCable(Tq, i){
      const c = segs[i].cable, pts = [];
      for (let q = 0; q <= 20; q++){ const u = q / 20, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; pts.push([a * -BLD + d * BLD, a * c + b * (c - 380) + d * (c + 120)]); }
      Tq.line(pts, 11, 0.6, S(LOOK.pole, { mx: 140 }));
    }
    function buildStreet(){
      R.road = new Rec(1 << 15); R.decal = new Rec(1 << 12); R.bld = new Rec(1 << 18); R.tr = new Rec(1 << 15);
      for (let i = N_SEG - 1; i >= 0; i--){
        for (const k in R) R[k].begin(i);
        const seg = segs[i];
        emitRoad(R.road, R.decal, i);
        if (seg.junc) emitJunction(R.bld, i);
        for (let side = 0; side < 2; side++){ const wd = seg.wall[side]; if (wd && wd.k === 0 && segs[(i + N_SEG - 1) % N_SEG].junc) emitEndFace(R.bld, side ? 1 : -1, wd.b); }
        emitSlice(R.bld, i, 0); emitSlice(R.bld, i, 1);
        if (seg.lights) emitLights(R.bld, R.tr, i);
        if (seg.lamp) emitLamp(R.bld, R.tr, i);
        for (const s of seg.signs) emitSign(R.tr, s);
        if (seg.cable) emitCable(R.tr, i);
      }
      for (const k in R){
        const r = R[k];
        r.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, r.vbo); gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(r.buf, 0, r.nv * 32), gl.STATIC_DRAW);
        r.ibo = gl.createBuffer(); r.vao = makeVAO(r.vbo, r.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, r.idx.subarray(0, r.ni), gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        r.buf = null; r.views = null; r.f32 = r.u16 = r.u8 = r.i16 = null; r.idx = null;
      }
    }
    function makeVAO(vbo, ibo){
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.UNSIGNED_SHORT, true, 32, 16);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 32, 20);
      gl.enableVertexAttribArray(3); gl.vertexAttribIPointer(3, 4, gl.UNSIGNED_BYTE, 32, 24);
      gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 2, gl.SHORT, false, 32, 28);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      return vao;
    }

    /* ================================================================ shaders */
    const VS_WORLD = `#version 300 es
    precision highp float; precision highp int; precision highp sampler2D;
    layout(location=0) in vec4 aPos; layout(location=1) in vec2 aUV; layout(location=2) in vec4 aCol;
    layout(location=3) in uvec4 aInfo; layout(location=4) in vec2 aOff;
    uniform sampler2D uB; uniform int uBase; uniform vec2 uView; uniform float uK;
    out vec2 vUV; out vec4 vCol; flat out uvec4 vInfo;
    const int NSEG = ${N_SEG}, DRAWN = ${DRAW};
    void main(){
      int n = int(aPos.x + 0.5) - uBase; if (n < 0) n += NSEG;
      vec4 b = texelFetch(uB, ivec2(min(n, DRAWN), 0), 0);
      if (n >= DRAWN || n >= int(aInfo.w) || b.w < 0.5){ gl_Position = vec4(0.0, 0.0, -2.0, 1.0); vUV = vec2(0.0); vCol = vec4(0.0); vInfo = uvec4(0u); return; }
      vec4 nb = texelFetch(uB, ivec2(n + 1, 0), 0);
      float t = aPos.y, sc = mix(b.x, nb.x, t);
      float x = mix(b.y + b.x * aPos.z * uK, nb.y + nb.x * aPos.z * uK, t);
      float y = mix(b.z - b.x * aPos.w * uK, nb.z - nb.x * aPos.w * uK, t);
      uint fl = aInfo.z, sh = (fl >> 4u) & 3u;
      if ((fl & 128u) != 0u){
        vec2 o = aOff * 0.25 * sc * uK; float hw = length(o), mn = float(aInfo.y) * 0.05;
        if (hw > 0.0 && hw < mn) o *= mn / hw;
        x += o.x; y -= o.y;
      }
      if (sh == 3u && aPos.w < 0.0) y = min(y, uView.y + 10.0);
      float w = mix(1.0 / b.x, 1.0 / nb.x, t) * 0.0001;
      float d = (float(n) + t) / float(DRAWN + 2) * 2.0 - 1.0;
      gl_Position = vec4((x / uView.x * 2.0 - 1.0) * w, (1.0 - y / uView.y * 2.0) * w, d * w, w);
      vec4 c = aCol;
      if (sh == 1u || sh == 2u){ float ft = float(n) / float(DRAWN), amt = sh == 1u ? -0.28 * ft : 0.14 - 0.3 * ft; c.rgb = amt >= 0.0 ? mix(c.rgb, vec3(1.0), amt) : c.rgb * (1.0 + amt); }
      vCol = c; vUV = aUV; vInfo = aInfo;
    }`;
    const VS_DYN = `#version 300 es
    precision highp float; precision highp int;
    layout(location=0) in vec4 aPos; layout(location=1) in vec2 aUV; layout(location=2) in vec4 aCol;
    layout(location=3) in uvec4 aInfo;
    uniform vec2 uView;
    out vec2 vUV; out vec4 vCol; flat out uvec4 vInfo;
    void main(){ gl_Position = vec4(aPos.x / uView.x * 2.0 - 1.0, 1.0 - aPos.y / uView.y * 2.0, aPos.z * 2.0 - 1.0, 1.0); vCol = aCol; vUV = aUV; vInfo = aInfo; }`;
    const FS_MAIN = (mrt, world) => `#version 300 es
    precision highp float; precision highp int; precision highp sampler2DArray; precision highp sampler2D;
    uniform sampler2DArray uAtlas; uniform sampler2D uTex;
    uniform float uFlick, uCarLev; uniform int uMode;
    uniform vec3 uRoad0, uRoad1, uPave0, uPave1;
    uniform vec2 uView; uniform float uRS, uPH, uHz;
    in vec2 vUV; in vec4 vCol; flat in uvec4 vInfo;
    layout(location=0) out vec4 oCol;
    ${mrt ? 'layout(location=1) out vec4 oLev;' : ''}
    void main(){
      uint ly = vInfo.x, fl = vInfo.z;
      vec4 ta = texture(uAtlas, vec3(vUV, float(min(ly, 249u)))), t2 = ${world ? 'vec4(1.0)' : 'texture(uTex, vUV)'};
      vec4 tx = ly < 250u ? ta : ly == 250u ? t2 : vec4(1.0);
      vec3 rgb = vCol.rgb;
      if (ly == 253u || ly == 254u){
        float yl = (uPH - gl_FragCoord.y) / uRS, g = clamp((uView.y - yl) / (uView.y - uHz), 0.0, 1.0);
        rgb = ly == 254u ? mix(uRoad0, uRoad1, g) : mix(uPave0, uPave1, g);
      }
      float a = vCol.a; if ((fl & 8u) != 0u) a *= uFlick;
      float cov = tx.a * a;
      oCol = (fl & 64u) != 0u ? vec4(0.0) : vec4(rgb * tx.rgb * a, (fl & 1u) != 0u ? 0.0 : cov);
      ${mrt ? `if (uMode == 1) oLev = vec4(uCarLev * tx.a, 0.0, cov, tx.a);
      else if ((fl & 66u) != 0u && (fl & 128u) == 0u) oLev = vec4(float(vInfo.y) * 0.01, (fl & 4u) != 0u ? 1.0 : 0.0, 0.0, 1.0) * cov;
      else oLev = vec4(0.0);` : ''}
    }`;
    const VS_FULL = `#version 300 es
    out vec2 vUV;
    void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUV = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
    // bloom, step 1: a quarter-size copy (each pixel the average of 4 x 4), leaving out the other vehicles, which are drawn after the glow
    const FS_QUARTER = `#version 300 es
    precision highp float;
    uniform sampler2D uSrc, uLev; uniform vec2 uTexel;
    in vec2 vUV; out vec4 o;
    void main(){
      vec3 s = vec3(0.0);
      for (int k = 0; k < 4; k++){
        vec2 uv = vUV + vec2((k & 1) == 1 ? 1.0 : -1.0, (k & 2) == 2 ? 1.0 : -1.0) * uTexel;
        s += texture(uSrc, uv).rgb * (1.0 - texture(uLev, uv).b);
      }
      o = vec4(s * 0.25, 1.0);
    }`;
    // bloom, step 2: a twelfth-size copy of the quarter copy multiplied by itself twice, so only the brightest lights are left
    const FS_CUBE = `#version 300 es
    precision highp float;
    uniform sampler2D uSrc;
    out vec4 o;
    void main(){
      ivec2 sz = textureSize(uSrc, 0) - 1, b = ivec2(gl_FragCoord.xy) * 3;
      vec3 s = vec3(0.0);
      for (int j = 0; j < 3; j++) for (int i = 0; i < 3; i++){ vec3 c = texelFetch(uSrc, min(b + ivec2(i, j), sz), 0).rgb; s += c * c * c; }
      o = vec4(s / 9.0, 1.0);
    }`;
    const FS_DOWN = `#version 300 es
    precision highp float;
    uniform sampler2D uSrc; uniform vec2 uTexel;
    in vec2 vUV; out vec4 o;
    void main(){
      vec3 s = vec3(0.0);
      for (int k = 0; k < 4; k++) s += texture(uSrc, vUV + vec2((k & 1) == 1 ? 0.6 : -0.6, (k & 2) == 2 ? 0.6 : -0.6) * uTexel).rgb;
      o = vec4(s * 0.25, 1.0);
    }`;
    const GLSL_CUBIC = `
    vec4 cubicW(float v){ vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v, s = n * n * n; float x = s.x, y = s.y - 4.0 * s.x, z = s.z - 4.0 * s.y + 6.0 * s.x; return vec4(x, y, z, 6.0 - x - y - z) * (1.0 / 6.0); }
    vec3 bicubic(sampler2D t, vec2 uv){
      vec2 sz = vec2(textureSize(t, 0)), p = uv * sz - 0.5, f = fract(p); p -= f;
      vec4 xc = cubicW(f.x), yc = cubicW(f.y), c = p.xxyy + vec2(-0.5, 1.5).xyxy;
      vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw), off = (c + vec4(xc.yw, yc.yw) / s) / sz.xxyy;
      vec3 a = texture(t, off.xz).rgb, b = texture(t, off.yz).rgb, d = texture(t, off.xw).rgb, e = texture(t, off.yw).rgb;
      float sx = s.x / (s.x + s.y), sy = s.z / (s.z + s.w);
      return mix(mix(e, d, sx), mix(b, a, sx), sy);
    }`;
    const GLSL_GRAIN = `
    vec3 overlayB(vec3 b, vec3 s){ return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b)); }
    vec3 grain(vec3 x, vec2 lp, float k){
      vec2 tuv = lp / 256.0;
      vec3 m = texture(uMottle, tuv).rgb, s = texture(uSparkle, tuv).rgb;
      for (float a = k * 0.95; a > 0.001; a -= 1.0) x = mix(x, overlayB(x, m), min(a, 1.0));
      for (float a = k * 0.85; a > 0.001; a -= 1.0) x = mix(x, x + s - x * s, min(a, 1.0));
      return x;
    }`;
    // the picture: glow added with a screen blend, the vignette, then the grain, set per pixel by the level each surface wrote
    const FS_COMP = `#version 300 es
    precision highp float;
    uniform sampler2D uScene, uLev, uS2, uS3, uMottle, uSparkle;
    uniform vec2 uView; uniform float uRS, uPH, uBloomA, uBloomB, uVig, uGrain;
    uniform vec3 uZone; uniform vec3 uCab;
    out vec4 o;
    ${GLSL_CUBIC}
    ${GLSL_GRAIN}
    float redZone(vec2 lp){
      float rx = 0.42 * uView.x, ry = 0.8 * uView.y, d = length(vec2(lp.x - uCab.x, (lp.y - uView.y) * rx / ry)) / rx;
      float r = d < 0.45 ? 1.0 : d < 0.6 ? mix(1.0, 0.85, (d - 0.45) / 0.15) : d < 0.75 ? mix(0.85, 0.5, (d - 0.6) / 0.15) : d < 0.9 ? mix(0.5, 0.15, (d - 0.75) / 0.15) : d < 1.0 ? mix(0.15, 0.0, (d - 0.9) / 0.1) : 0.0;
      return r * clamp((lp.y - uCab.y) / (uCab.z - uCab.y), 0.0, 1.0);
    }
    void main(){
      ivec2 fp = ivec2(gl_FragCoord.xy); vec2 uv = gl_FragCoord.xy / vec2(textureSize(uScene, 0));
      vec3 c = texelFetch(uScene, fp, 0).rgb; vec4 lv = texelFetch(uLev, fp, 0);
      vec3 x = 1.0 - (1.0 - c) * (1.0 - uBloomA * bicubic(uS2, uv));
      x = 1.0 - (1.0 - x) * (1.0 - uBloomB * bicubic(uS3, uv));
      vec2 lp = vec2(gl_FragCoord.x / uRS, (uPH - gl_FragCoord.y) / uRS);
      float r = length(lp - vec2(uView.x * 0.5, uView.y * 0.55));
      x *= 1.0 - clamp((r - uView.y * 0.35) / (uView.x * 0.72 - uView.y * 0.35), 0.0, 1.0) * uVig;
      x = mix(x, c, clamp(lv.b, 0.0, 1.0));
      float L = lv.r * 100.0;
      if (lv.g > 0.002) L -= lv.g * redZone(lp) * (uZone.x - uZone.y);
      o = vec4(grain(x, lp, max(L, 0.0) * 0.01 * uGrain), 1.0);
    }`;
    // your taxi: its own picture, lit by the street (neon from the glow copies, shop light from the quarter copy) and grained at 15%
    const VS_CAB = `#version 300 es
    layout(location=0) in vec4 aP;
    uniform vec2 uView; out vec2 vUV;
    void main(){ vUV = aP.zw; gl_Position = vec4(aP.x / uView.x * 2.0 - 1.0, 1.0 - aP.y / uView.y * 2.0, 0.0, 1.0); }`;
    const FS_CAB = `#version 300 es
    precision highp float;
    uniform sampler2D uBody, uMask, uLit, uHM, uS1t, uS2, uMottle, uSparkle;
    uniform vec4 uRM, uRL, uRH, uEnv, uRimX, uAmt; uniform vec2 uSpr, uRimY, uRimOn;
    uniform float uGrain; uniform int uLow;
    uniform vec2 uView; uniform float uRS, uPH;
    in vec2 vUV; out vec4 o;
    ${GLSL_GRAIN}
    vec4 sub(sampler2D t, vec4 r, vec2 px){ vec2 q = (px - r.xy) / r.zw; return (q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) ? vec4(0.0) : texture(t, q); }
    vec2 scr(vec2 lp){ return vec2(lp.x / uView.x, 1.0 - lp.y / uView.y); }
    void main(){
      vec4 c = texture(uBody, vUV);
      if (uLow == 0){
        vec2 px = vUV * uSpr;
        vec4 m = sub(uMask, uRM, px);
        if (uAmt.z > 0.5){
          vec2 e = scr(vec2(mix(uEnv.x, uEnv.y, vUV.x), mix(uEnv.w, uEnv.z, vUV.y)));
          vec3 e2 = texture(uS2, e).rgb, e1 = texture(uS1t, e).rgb; e1 = e1 * e1 * e1;
          c.rgb += 0.7 * m.r * e2 * (c.a - c.rgb);
          c.rgb += 0.75 * m.g * e1 * (c.a - c.rgb);
        }
        if (uAmt.w > 0.5){
          float ry = mix(uRimY.x, uRimY.y, vUV.y);
          vec3 rl = texture(uS1t, scr(vec2(mix(uRimX.x, uRimX.y, vUV.x), ry))).rgb, rr = texture(uS1t, scr(vec2(mix(uRimX.z, uRimX.w, vUV.x), ry))).rgb;
          float al = 0.6 * m.b * uRimOn.x, ar = 0.6 * m.a * uRimOn.y;
          c.rgb += al * rl + ar * rr; c.a = min(1.0, c.a + al + ar);
        }
        vec4 lt = sub(uLit, uRL, px), hm = sub(uHM, uRH, px);
        c.rgb += uAmt.x * lt.rgb + uAmt.y * hm.rgb; c.a = min(1.0, c.a + uAmt.x * lt.a + uAmt.y * hm.a);
        c.rgb = min(c.rgb, vec3(c.a));
      }
      if (uGrain > 0.0 && c.a > 0.004){
        vec2 lp = vec2(gl_FragCoord.x / uRS, (uPH - gl_FragCoord.y) / uRS);
        c.rgb = grain(c.rgb / c.a, lp, uGrain) * c.a;
      }
      o = c;
    }`;

    /* ================================================================ GL objects */
    function compile(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l, k) => (k + 1) + ': ' + l).join('\n')); return s; }
    function program(vs, fs){
      const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let k = 0; k < n; k++){ const a = gl.getActiveUniform(p, k); u[a.name] = gl.getUniformLocation(p, a.name); }
      return { p, u };
    }
    const P = {}, T = {};
    let quadIBO, dynVBO, dynVAO, cabVBO, cabVAO, fullVAO, texB, msFBO, msRB = [], resFBO = [], postFBO = {}, samples = 4, smoothing = 4, maxSamples = 0;
    const Bf = new Float32Array((DRAW + 8) * 4);
    function tex2D(w, h, filter, wrap){ const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap || gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap || gl.CLAMP_TO_EDGE); return t; }
    function texFrom(src, premult, wrap, mip){
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!premult);
      if (src instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, src.w, src.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap || gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap || gl.CLAMP_TO_EDGE);
      if (mip) gl.generateMipmap(gl.TEXTURE_2D);
      return t;
    }
    function initGL(){
      P.world = program(VS_WORLD, FS_MAIN(true, true)); P.dyn = program(VS_DYN, FS_MAIN(true)); P.dyn1 = program(VS_DYN, FS_MAIN(false));
      P.quarter = program(VS_FULL, FS_QUARTER); P.cube = program(VS_FULL, FS_CUBE); P.down = program(VS_FULL, FS_DOWN);
      P.comp = program(VS_FULL, FS_COMP); P.cab = program(VS_CAB, FS_CAB);
      // one index buffer of quads shared by the batches
      const MAXQ = 16384, qi = new Uint32Array(MAXQ * 6);
      for (let q = 0; q < MAXQ; q++){ const k = q * 4, n = q * 6; qi[n] = k; qi[n + 1] = k + 1; qi[n + 2] = k + 2; qi[n + 3] = k; qi[n + 4] = k + 2; qi[n + 5] = k + 3; }
      quadIBO = gl.createBuffer(); dynVBO = gl.createBuffer(); dynVAO = makeVAO(dynVBO, quadIBO); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, qi, gl.STATIC_DRAW); gl.bindVertexArray(null);
      cabVBO = gl.createBuffer(); cabVAO = gl.createVertexArray(); gl.bindVertexArray(cabVAO); gl.bindBuffer(gl.ARRAY_BUFFER, cabVBO); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIBO); gl.bindVertexArray(null);
      fullVAO = gl.createVertexArray();
      texB = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texB); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, DRAW + 8, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      T.mottle = texFrom(tiles.mottle, false, gl.REPEAT); T.sparkle = texFrom(tiles.sparkle, false, gl.REPEAT);
      maxSamples = gl.getParameter(gl.MAX_SAMPLES) || 0; samples = Math.min(smoothing, maxSamples);
    }
    function makeTargets(){
      if (msFBO){ gl.deleteFramebuffer(msFBO); msRB.forEach(r => gl.deleteRenderbuffer(r)); resFBO.forEach(f => gl.deleteFramebuffer(f)); for (const k in postFBO){ gl.deleteFramebuffer(postFBO[k].f); gl.deleteTexture(postFBO[k].t); } ['scene', 'lev'].forEach(k => T[k] && gl.deleteTexture(T[k])); }
      msFBO = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, msFBO); msRB = [];
      for (const [fmt, att] of [[gl.RGBA8, gl.COLOR_ATTACHMENT0], [gl.RGBA8, gl.COLOR_ATTACHMENT1], [gl.DEPTH_COMPONENT24, gl.DEPTH_ATTACHMENT]]){
        const rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
        if (samples > 0) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, fmt, PW, PH); else gl.renderbufferStorage(gl.RENDERBUFFER, fmt, PW, PH);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, att, gl.RENDERBUFFER, rb); msRB.push(rb);
      }
      T.scene = tex2D(PW, PH, gl.LINEAR); T.lev = tex2D(PW, PH, gl.LINEAR);
      resFBO = [T.scene, T.lev].map(t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; });
      postFBO = {};
      for (const [k, d] of [['q', 4], ['s2', 12], ['s3', 28]]){
        const w = Math.max(1, Math.round(PW / d)), h = Math.max(1, Math.round(PH / d)), t = tex2D(w, h, gl.LINEAR), f = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        postFBO[k] = { f, t, w, h };
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (T.extra){ gl.deleteFramebuffer(T.extra.f); gl.deleteTexture(T.extra.t); T.extra = null; }
    }

    /* ================================================================ the batches drawn each frame (in screen units) */
    const dyn = new Rec(8192), ranges = {};
    function dynBegin(name){ ranges[name] = [dyn.nv / 4, 0]; }
    function dynEnd(name){ ranges[name][1] = dyn.nv / 4 - ranges[name][0]; }
    // a rectangle on screen; corner colours optional (top, bottom) for gradients
    function dq(x, y, w, h, d, s, uv, cTop, cBot){
      dyn.need(4, 0);
      const r = uv || s.uv || [0, 0, 1, 1], st = cTop ? Object.assign({}, s, { c: cTop }) : s, sb = cBot ? Object.assign({}, s, { c: cBot }) : st;
      dyn.v(x, y, d, 0, r[0], r[1], st); dyn.v(x + w, y, d, 0, r[2], r[1], st); dyn.v(x + w, y + h, d, 0, r[2], r[3], sb); dyn.v(x, y + h, d, 0, r[0], r[3], sb);
    }
    // an item from the atlas drawn where its whole (untrimmed) canvas would go
    function dItem(it, x, y, w, h, d, s){ const kx = w / it.sw, ky = h / it.sh; dq(x + it.ox * kx, y + it.oy * ky, it.w * kx, it.h * ky, d, s, it.uv); }
    function projectZ2(st, z){
      const rel = (z - st.pos + TRACK) % TRACK, n = Math.floor((rel + (st.pos % SEG)) / SEG);
      if (n < 0 || n >= DRAW) return null;
      const b = B[n], nb = B[n + 1]; if (!b.ok || !nb.ok) return null;
      const t = ((z % SEG) + SEG) % SEG / SEG;
      return { scale: lerp(b.scale, nb.scale, t), sx: lerp(b.sx, nb.sx, t), sy: lerp(b.sy, nb.sy, t), d: (n + t) / (DRAW + 2) };
    }
    const pedList = [], carList = [], tokList = [], runs = [];
    const NEAR_CAR = 1000;   // vehicles and power-ups are drawn from 2.5 m ahead of the camera, so one beside the taxi stays in view
    const sway = st => reduceMotion ? 0 : st.lean * 5;
    function buildDynamic(st){
      dyn.nv = 0;
      const hzY = H * HZ;
      // sky and the distant skyline
      dynBegin('sky');
      const sky = LOOK.sky.map(c => rgba(c)), y6 = (hzY + 40) * 0.6, none = S('#ffffff');
      dq(0, 0, W, y6, 0, none, null, sky[0], sky[1]); dq(0, y6, W, hzY + 40 - y6, 0, none, null, sky[1], sky[2]);
      const skw = T.skylineW / RS, skh = T.skylineH / RS, ox = ((st.sky * W) % skw + skw) % skw, sl = S('#ffffff', { ly: TEX2D });
      dq(-ox, hzY - skh + 2, skw, skh, 0, sl, [0, 0, 1, 1]); dq(-ox + skw, hzY - skh + 2, skw, skh, 0, sl, [0, 0, 1, 1]);
      dynEnd('sky');
      // traffic: tail-light streaks on the road now, the cars themselves after the glow
      carList.length = 0;
      for (const c of st.cars){
        const rel = (c.z - st.pos + TRACK) % TRACK;
        if (rel < NEAR_CAR || rel > DRAW * SEG) continue;
        const n = Math.floor((rel + (st.pos % SEG)) / SEG); if (n >= DRAW || !B[n].ok || !B[n + 1].ok) continue;
        carList.push({ c, rel, n, t: ((c.z % SEG) + SEG) % SEG / SEG });
      }
      carList.sort((a, b) => b.rel - a.rel);
      dynBegin('streaks');
      const streak = atlas.items.get('streak');
      for (const it of carList){
        const b = B[it.n], nb = B[it.n + 1], c = it.c, scale = lerp(b.scale, nb.scale, it.t), sx = lerp(b.sx, nb.sx, it.t) + scale * c.x * ROAD * K, sy = lerp(b.sy, nb.sy, it.t);
        const rw = VEH[c.kind].W * UPM * scale * K, s = S('#ff2a18', { ly: streak.layer, uv: streak.uv, a: LOOK.reflect, fl: FL.ADD });
        dq(sx - rw * 0.46, sy, rw * 0.16, rw * 0.7, 0, s); dq(sx + rw * 0.3, sy, rw * 0.16, rw * 0.7, 0, s);
        it.sx = sx; it.sy = sy; it.scale = scale;
      }
      // each power-up's pool of light on the wet road beneath it, in its own face colour
      tokList.length = 0;
      for (const tk of st.tokens){ const q = tokenAt(st, tk); if (!q) continue; q.tk = tk; tokList.push(q); }
      const poolW = atlas.items.get('pool:white');
      for (const q of tokList) dq(q.x - q.s * 0.62, q.y - q.s * 0.14, q.s * 1.25, q.s * 0.28, 0, S(col(TOKEN[q.tk.kind].face), { ly: poolW.layer, uv: poolW.uv, a: 0.9 * q.a, fl: FL.ADD }));
      dynEnd('streaks');
      // people, far to near, each with the ghost copies the long exposure leaves
      pedList.length = 0;
      for (const p of peds){ const rel = (p.z - st.pos + TRACK) % TRACK; if (rel < 1800 || rel > 95 * SEG) continue; pedList.push(p); p._rel = rel; }
      pedList.sort((a, b) => b._rel - a._rel);
      dynBegin('peds');
      for (const p of pedList){
        const flip = p.speed ? p.side * p.dir > 0 : p.v % 2 === 1, wx = p.side * (ROAD + p.off), hW = 690 * p.hs, fk = 'ped:' + (flip ? 1 : 0) + ':' + p.v + ':';
        const put = (z, f, a, dx) => {
          const q = projectZ2(st, z); if (!q) return;
          const ph = q.scale * hW * K, ds = ph / 196, x = q.sx + q.scale * (wx + dx) * K, it = atlas.items.get(fk + f);
          dItem(it, x - 60 * ds, q.sy - 242 * ds, 120 * ds, 250 * ds, q.d - 0.75 / (DRAW + 2), S('#ffffff', { ly: it.layer, a }));
        };
        const near = projectZ2(st, p.z), small = !near || near.scale * hW * K < 26;
        if (p.speed){
          const f = Math.floor(p.phase) % 4;
          if (!small) for (let k = 3; k >= 1; k--) put(p.z - p.dir * k * 190, (f + 4 - k) % 4, [0, 0.36, 0.22, 0.11][k], 0);
          put(p.z, f, 0.84, 0);
        } else {
          if (!small) put(p.z, 4, 0.3, (p.v % 2 ? 1 : -1) * 70);
          put(p.z, 4, 0.88, 0);
        }
      }
      dynEnd('peds');
      // your cab's reflection and tail-light streaks on the wet road
      const cg = cabGeometry(), view = cabView(st), cab = T.cab[view.near], ds = cg.rw / cab.pxW, cx = W / 2 + sway(st), cy = cg.gy;
      dynBegin('mirror');
      dq(cx - cab.ax * ds, cy - 1, cab.mirW * ds, cab.mirH * ds, 0, S('#ffffff', { ly: TEX2D, a: 0.32 }), [0, 0, 1, 1]);
      dynEnd('mirror');
      dynBegin('cabAdd');
      const s1 = S('#ff2a18', { ly: streak.layer, uv: streak.uv, a: Math.min(1, LOOK.reflect * (0.9 + 0.9 * st.brake)), fl: FL.ADD });
      dq(cx - cg.rw * 0.46, cy, cg.rw * 0.15, (H - cy) + 10, 0, s1); dq(cx + cg.rw * 0.31, cy, cg.rw * 0.15, (H - cy) + 10, 0, s1);
      if (st.brake > 0.02){ const gs = cg.rw * 1.5, rg = atlas.items.get('glow:redGlow'); dq(cx - gs / 2, cy - gs * 0.12, gs, gs * 0.45, 0, S('#ffffff', { ly: rg.layer, uv: rg.uv, a: 0.4 * st.brake, fl: FL.ADD })); }
      dynEnd('cabAdd');
      // haze over the far end of the street
      dynBegin('fog');
      const f = LOOK.fog, fc = rgba(f.c), f0 = [fc[0], fc[1], fc[2], 0], f1 = [fc[0], fc[1], fc[2], Math.round(f.a * 255)];
      dq(0, hzY - f.spread * H, W, f.spread * H, 0, none, null, f0, f1); dq(0, hzY, W, f.spread * H, 0, none, null, f1, f0);
      dynEnd('fog');
      // the other vehicles and the power-ups, far to near: the vehicles in runs kept out of the glow, the power-ups lit like signs
      runs.length = 0;
      const order = carList.map(it => ({ car: it, rel: it.rel })).concat(tokList.map(q => ({ tok: q, rel: q.rel }))).sort((a, b) => b.rel - a.rel);
      const soft = atlas.items.get('glow:soft');
      for (const o of order){
        const mode = o.car ? 1 : 0, last = runs[runs.length - 1];
        if (!last || last[2] !== mode) runs.push([dyn.nv / 4, 0, mode]);
        if (o.car){
          const it = o.car, c = it.c, offM = (it.sx - W / 2) / (it.scale * K * UPM);
          let vi = 0, best = 1e9; OFFS.forEach((ov, i) => { const d = Math.abs(ov - offM); if (d < best){ best = d; vi = i; } });
          const spr = atlas.items.get('car:' + c.kind + ':' + c.tone + ':' + vi), dsc = VEH[c.kind].W * UPM * it.scale * K / spr.pxW;
          const a = clamp(1 - (1 / it.scale - 26000) / 30000, 0.35, 1);
          dItem(spr, it.sx - spr.ax * dsc, it.sy - spr.ay * dsc, spr.sw * dsc, spr.sh * dsc, (it.n + it.t - 0.5) / (DRAW + 2), S('#ffffff', { ly: spr.layer, a }));
        } else {
          // a glow of its own face colour round it, then the sign, hung a third of its height above the road
          const q = o.tok, tk = TOKEN[q.tk.kind], it = atlas.items.get('token:' + q.tk.kind), d = (q.n + q.t - 0.5) / (DRAW + 2), top = q.y - q.s / 3 - q.s - q.bob, gs = q.s * 1.7;
          dq(q.x - gs / 2, top + q.s / 2 - gs / 2, gs, gs, d, S(col(tk.face), { ly: soft.layer, uv: soft.uv, a: 0.8 * q.a, fl: FL.ADD }));
          dItem(it, q.x - q.s / 2, top, q.s, q.s, d, S('#ffffff', { ly: it.layer, a: q.a, lv: Z.sign, fl: FL.LEV }));
        }
        runs[runs.length - 1][1] = dyn.nv / 4 - runs[runs.length - 1][0];
      }
      // the glow round your cab's lamps, which go on after its grain
      dynBegin('glows');
      const m = cabMotion(st), k = cg.rw / 200, py = cy - cg.rw * 0.22, ox2 = cx - cab.ax * ds, oy2 = cy - cab.ay * ds, rg = atlas.items.get('glow:redGlow');
      const cs = Math.cos(m.roll), sn = Math.sin(m.roll), ty = py + (m.bob + m.pitch) * k;
      for (const lp of cab.lamps){
        const a = (lp.hm ? 0 : 0.16) + 0.55 * st.brake; if (a < 0.01) continue;
        const gs = Math.max(lp.w, lp.h) * ds * (2.2 + 1.4 * st.brake), lx = ox2 + lp.x * ds - cx, ly = oy2 + lp.y * ds - py;
        const X = cx + lx * cs - ly * sn, Y = ty + lx * sn + ly * cs;
        dq(X - gs / 2, Y - gs / 2, gs, gs, 0, S('#ffffff', { ly: rg.layer, uv: rg.uv, a, fl: FL.ADD }));
      }
      dynEnd('glows');
      gl.bindBuffer(gl.ARRAY_BUFFER, dynVBO); gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(dyn.buf, 0, dyn.nv * 32), gl.DYNAMIC_DRAW);
    }

    /* ================================================================ your cab's pictures: seven angles, each split into the parts the shader needs */
    function cropCanvas(c){ const t = trim(c); return { c: t.c, r: [t.ox, t.oy, t.c.width, t.c.height] }; }
    function packMasks(s){
      // the four light masks (neon on paint, neon on glass and chrome, shop light left, right) as the four channels of one texture
      const w = s.c.width, h = s.c.height, out = new Uint8Array(w * h * 4);
      [s.refl, s.reflG, s.rimL, s.rimR].forEach((m, ch) => { const d = m.getContext('2d').getImageData(0, 0, w, h).data; for (let p = 0; p < w * h; p++) out[p * 4 + ch] = d[p * 4 + 3]; });
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const p = (y * w + x) * 4; if (out[p] | out[p + 1] | out[p + 2] | out[p + 3]){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; } }
      if (x1 < 0){ x0 = y0 = 0; x1 = y1 = 0; }
      const cw = x1 - x0 + 1, chh = y1 - y0 + 1, crop = new Uint8Array(cw * chh * 4);
      for (let y = 0; y < chh; y++) crop.set(out.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + cw) * 4), y * cw * 4);
      crop.w = cw; crop.h = chh;
      return { data: crop, r: [x0, y0, cw, chh] };
    }
    function makeMirrorSmall(s){
      // the cab's reflection in the wet road: flipped, squashed, blurred and fading out (kept at quarter size and stretched when drawn)
      const w = s.c.width, hgt = Math.max(1, Math.ceil(s.ay * 0.6)), q = mk(Math.ceil(w / 4), Math.ceil(hgt / 4)), qg = q.getContext('2d');
      qg.setTransform(0.25, 0, 0, -0.15, 0, s.ay * 0.15); qg.drawImage(s.c, 0, 0);
      qg.setTransform(1, 0, 0, 1, 0, 0); qg.globalCompositeOperation = 'destination-in';
      const gr = qg.createLinearGradient(0, 0, 0, q.height); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      qg.fillStyle = gr; qg.fillRect(0, 0, q.width, q.height);
      return { q, w, hgt };
    }
    function bakeCab(){
      if (T.cab) for (const v of T.cab) for (const k of ['body', 'low', 'mask', 'lit', 'hm', 'mirror']) gl.deleteTexture(v[k]);
      const cg = cabGeometry();
      T.cab = CAB_OFFS.map(off => {
        const s = bakeVehicle('taxi', 0, off, cg.zc / UPM, CAM_H / UPM, Math.round(cg.rw * RS * 1.1), 'NW 4183', true);
        const low = cropCanvas(s.low), lit = cropCanvas(s.lit), hm = cropCanvas(s.litHM), mk2 = packMasks(s), mir = makeMirrorSmall(s);
        return { pxW: s.pxW, ax: s.ax, ay: s.ay, w: s.c.width, h: s.c.height, lamps: s.lamps,
          body: texFrom(s.c, true), low: texFrom(low.c, true), lowR: low.r, lit: texFrom(lit.c, true), litR: lit.r, hm: texFrom(hm.c, true), hmR: hm.r,
          mask: texFrom(mk2.data, false), maskR: mk2.r, mirror: texFrom(mir.q, true), mirW: mir.w, mirH: mir.hgt };
      });
    }
    function makeSkylineTex(){
      if (T.skyline) gl.deleteTexture(T.skyline);
      let c = makeSkyline(); const mx = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (c.width > mx){ const d = mk(mx, Math.round(c.height * mx / c.width)); d.getContext('2d').drawImage(c, 0, 0, d.width, d.height); c = d; }
      T.skyline = texFrom(c, true); T.skylineW = Math.round(W * 2 * RS); T.skylineH = Math.round(H * 0.32 * RS);
    }

    /* ================================================================ a frame */
    function useWorld(st, base){
      const p = P.world; gl.useProgram(p.p);
      gl.uniform1i(p.u.uB, 1); gl.uniform1i(p.u.uBase, base); gl.uniform2f(p.u.uView, W, H); gl.uniform1f(p.u.uK, K);
      setMainUniforms(p, st);
    }
    const GRAD = [LOOK.road.near, LOOK.road.far, LOOK.road.pave, LOOK.road.paveFar].map(h => new Float32Array(rgba(h).slice(0, 3).map(v => v / 255)));
    function setMainUniforms(p, st){
      gl.uniform1i(p.u.uAtlas, 0); gl.uniform1i(p.u.uTex, 2); gl.uniform1f(p.u.uFlick, amb.flick.on ? 1 : 0.5); gl.uniform1f(p.u.uCarLev, Z.cars / MAXL); gl.uniform1i(p.u.uMode, 0);
      gl.uniform3fv(p.u.uRoad0, GRAD[0]); gl.uniform3fv(p.u.uRoad1, GRAD[1]); gl.uniform3fv(p.u.uPave0, GRAD[2]); gl.uniform3fv(p.u.uPave1, GRAD[3]);
      gl.uniform2f(p.u.uView, W, H); gl.uniform1f(p.u.uRS, RS); gl.uniform1f(p.u.uPH, PH); gl.uniform1f(p.u.uHz, H * HZ);
    }
    function drawStatic(r, base){
      gl.bindVertexArray(r.vao);
      const segEnd = i => i > 0 ? r.segStart[i - 1] : r.ni, hi = base + DRAW - 1;
      const draw = (a, b) => { if (b > a) gl.drawElements(gl.TRIANGLES, b - a, gl.UNSIGNED_INT, a * 4); };
      if (hi < N_SEG) draw(r.segStart[hi], segEnd(base));
      else { draw(r.segStart[hi - N_SEG], r.ni); draw(0, segEnd(base)); }
    }
    function drawDyn(name){ const [q0, nq] = ranges[name]; if (nq) gl.drawElements(gl.TRIANGLES, nq * 6, gl.UNSIGNED_INT, q0 * 24); }
    function drawRuns(p){ for (const [q0, nq, mode] of runs){ if (!nq) continue; gl.uniform1i(p.u.uMode, mode); gl.drawElements(gl.TRIANGLES, nq * 6, gl.UNSIGNED_INT, q0 * 24); } gl.uniform1i(p.u.uMode, 0); }
    function bindT(unit, target, t){ gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(target, t); }
    function fullscreen(p, fbo, w, h){ gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, w, h); gl.useProgram(p.p); gl.bindVertexArray(fullVAO); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    // out: the framebuffer the finished picture goes to (the screen when left out; an off-screen copy while timing a frame)
    function renderGL(st, out){
      project(st);
      const base = Math.floor(st.pos / SEG) % N_SEG;
      for (let n = 0; n < DRAW + 8; n++){ const b = B[n], o = n * 4; Bf[o] = b.ok ? b.scale : 0; Bf[o + 1] = b.sx; Bf[o + 2] = b.sy; Bf[o + 3] = b.ok ? 1 : 0; }
      bindT(1, gl.TEXTURE_2D, texB); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, DRAW + 8, 1, gl.RGBA, gl.FLOAT, Bf);
      buildDynamic(st);
      // the street, into the multisampled buffers: colour, and the grain level each surface asks for
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFBO); gl.viewport(0, 0, PW, PH);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.depthMask(true); gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 1]); gl.clearBufferfv(gl.COLOR, 1, [Z.sky / MAXL, 0, 0, 1]); gl.clearBufferfv(gl.DEPTH, 0, [1]);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.ALWAYS); gl.depthMask(false);
      bindT(0, gl.TEXTURE_2D_ARRAY, atlas.tex); bindT(2, gl.TEXTURE_2D, T.skyline);
      const pd = P.dyn; gl.useProgram(pd.p); setMainUniforms(pd, st); gl.bindVertexArray(dynVAO); drawDyn('sky');
      gl.depthMask(true); useWorld(st, base); drawStatic(R.road, base);
      gl.depthMask(false); drawStatic(R.decal, base);
      gl.useProgram(pd.p); gl.bindVertexArray(dynVAO); drawDyn('streaks');
      gl.depthMask(true); gl.useProgram(P.world.p); drawStatic(R.bld, base);
      gl.depthMask(false); gl.depthFunc(gl.LEQUAL);
      gl.useProgram(pd.p); gl.bindVertexArray(dynVAO); drawDyn('peds');
      gl.useProgram(P.world.p); drawStatic(R.tr, base);
      gl.depthFunc(gl.ALWAYS); gl.useProgram(pd.p); gl.bindVertexArray(dynVAO);
      bindT(2, gl.TEXTURE_2D, T.cab[cabView(st).near].mirror);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]); gl.blendFunc(gl.ONE_MINUS_DST_COLOR, gl.ONE); drawDyn('mirror');
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      drawDyn('cabAdd'); drawDyn('fog');
      gl.depthFunc(gl.LEQUAL); drawRuns(pd);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      // settle the multisampled buffers into plain textures
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFBO);
      for (let k = 0; k < 2; k++){
        gl.readBuffer(gl.COLOR_ATTACHMENT0 + k); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resFBO[k]); gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.blitFramebuffer(0, 0, PW, PH, 0, 0, PW, PH, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      }
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      // glow: quarter copy, the bright twelfth, and a softer twenty-eighth
      bindT(0, gl.TEXTURE_2D, T.scene); bindT(1, gl.TEXTURE_2D, T.lev);
      gl.useProgram(P.quarter.p); gl.uniform1i(P.quarter.u.uSrc, 0); gl.uniform1i(P.quarter.u.uLev, 1); gl.uniform2f(P.quarter.u.uTexel, 1 / PW, 1 / PH);
      fullscreen(P.quarter, postFBO.q.f, postFBO.q.w, postFBO.q.h);
      bindT(0, gl.TEXTURE_2D, postFBO.q.t); gl.useProgram(P.cube.p); gl.uniform1i(P.cube.u.uSrc, 0); fullscreen(P.cube, postFBO.s2.f, postFBO.s2.w, postFBO.s2.h);
      bindT(0, gl.TEXTURE_2D, postFBO.s2.t); gl.useProgram(P.down.p); gl.uniform1i(P.down.u.uSrc, 0); gl.uniform2f(P.down.u.uTexel, 1 / postFBO.s2.w, 1 / postFBO.s2.h); fullscreen(P.down, postFBO.s3.f, postFBO.s3.w, postFBO.s3.h);
      // the picture on screen
      const pc = P.comp; gl.useProgram(pc.p);
      bindT(0, gl.TEXTURE_2D, T.scene); bindT(1, gl.TEXTURE_2D, T.lev); bindT(2, gl.TEXTURE_2D, postFBO.s2.t); bindT(3, gl.TEXTURE_2D, postFBO.s3.t); bindT(4, gl.TEXTURE_2D, T.mottle); bindT(5, gl.TEXTURE_2D, T.sparkle);
      gl.uniform1i(pc.u.uScene, 0); gl.uniform1i(pc.u.uLev, 1); gl.uniform1i(pc.u.uS2, 2); gl.uniform1i(pc.u.uS3, 3); gl.uniform1i(pc.u.uMottle, 4); gl.uniform1i(pc.u.uSparkle, 5);
      gl.uniform2f(pc.u.uView, W, H); gl.uniform1f(pc.u.uRS, RS); gl.uniform1f(pc.u.uPH, PH);
      gl.uniform1f(pc.u.uBloomA, effects ? LOOK.bloom.a : 0); gl.uniform1f(pc.u.uBloomB, effects ? LOOK.bloom.b : 0); gl.uniform1f(pc.u.uVig, LOOK.vignette); gl.uniform1f(pc.u.uGrain, grainAmt);
      gl.uniform3f(pc.u.uZone, Z.white, midLevel, 0);
      const yAtZ = zm => H * HZ + DEPTH / (zm * UPM) * CAM_H * K;
      gl.uniform3f(pc.u.uCab, W / 2 + sway(st), yAtZ(18), yAtZ(13));
      fullscreen(pc, out || null, PW, PH);
      drawCabGL(st);
    }
    function drawCabGL(st){
      const cg = cabGeometry(), view = cabView(st), m = cabMotion(st), k = cg.rw / 200, x = W / 2 + sway(st), y = cg.gy, N = T.cab[view.near];
      const ds = cg.rw / N.pxW, ox = x - N.ax * ds, oy = y - N.ay * ds, w = N.w * ds, h = N.h * ds;
      // wheels and shadow stay on the road; the body floats, pitches and rolls above them
      const lr = N.lowR, lx = ox + lr[0] * ds, ly = oy + m.vib * k + lr[1] * ds, lw = lr[2] * ds, lh = lr[3] * ds;
      const py = y - cg.rw * 0.22, ty = py + (m.bob + m.pitch) * k, cs = Math.cos(m.roll), sn = Math.sin(m.roll);
      const tf = (px, pyy) => { const dx = px - x, dy = pyy - py; return [x + dx * cs - dy * sn, ty + dx * sn + dy * cs]; };
      const c0 = tf(ox, oy), c1 = tf(ox + w, oy), c2 = tf(ox + w, oy + h), c3 = tf(ox, oy + h);
      const v = new Float32Array([lx, ly, 0, 0, lx + lw, ly, 1, 0, lx + lw, ly + lh, 1, 1, lx, ly + lh, 0, 1,
        c0[0], c0[1], 0, 0, c1[0], c1[1], 1, 0, c2[0], c2[1], 1, 1, c3[0], c3[1], 0, 1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, cabVBO); gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW);
      const p = P.cab; gl.useProgram(p.p); gl.bindVertexArray(cabVAO);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      bindT(0, gl.TEXTURE_2D, N.low); bindT(1, gl.TEXTURE_2D, N.mask); bindT(2, gl.TEXTURE_2D, N.lit); bindT(3, gl.TEXTURE_2D, N.hm);
      bindT(4, gl.TEXTURE_2D, postFBO.q.t); bindT(5, gl.TEXTURE_2D, postFBO.s2.t); bindT(6, gl.TEXTURE_2D, T.mottle); bindT(7, gl.TEXTURE_2D, T.sparkle);
      ['uBody', 'uMask', 'uLit', 'uHM', 'uS1t', 'uS2', 'uMottle', 'uSparkle'].forEach((n, i) => gl.uniform1i(p.u[n], i));
      gl.uniform2f(p.u.uView, W, H); gl.uniform1f(p.u.uRS, RS); gl.uniform1f(p.u.uPH, PH);
      gl.uniform1f(p.u.uGrain, cabGrain ? grainAmt * Z.cab / MAXL : 0);
      gl.uniform1i(p.u.uLow, 1); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
      bindT(0, gl.TEXTURE_2D, N.body); gl.uniform1i(p.u.uLow, 0);
      gl.uniform2f(p.u.uSpr, N.w, N.h);
      gl.uniform4fv(p.u.uRM, N.maskR); gl.uniform4fv(p.u.uRL, N.litR); gl.uniform4fv(p.u.uRH, N.hmR);
      gl.uniform4f(p.u.uEnv, Math.max(0, x - cg.rw * 1.7), Math.min(W, x + cg.rw * 1.7), H * 0.02, H * (HZ + 0.12));
      const yy0 = H * HZ + (y - H * HZ) * 0.15, aL1 = x - cg.rw * 0.55, aR0 = x + cg.rw * 0.55;
      gl.uniform4f(p.u.uRimX, 0, aL1, aR0, W); gl.uniform2f(p.u.uRimY, yy0, y); gl.uniform2f(p.u.uRimOn, aL1 >= 4 ? 1 : 0, W - aR0 >= 4 ? 1 : 0);
      gl.uniform4f(p.u.uAmt, 0.12 + 0.88 * st.brake, st.brake > 0.02 ? st.brake : 0, cabRefl ? 1 : 0, 1);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 24);
      // the lamps' glow
      const p1 = P.dyn1; gl.useProgram(p1.p); setMainUniforms(p1, st); gl.bindVertexArray(dynVAO); bindT(0, gl.TEXTURE_2D_ARRAY, atlas.tex);
      drawDyn('glows');
      gl.disable(gl.BLEND);
    }

    /* ================================================================ sprites, drawn once with the 2D canvas */
    function buildSprites(){
      const sp = { cars: {} };
      let pi = 0;
      for (const kind in VEH){ sp.cars[kind] = []; for (let tone = 0; tone < TONES[kind]; tone++){ const plate = PLATES[pi++ % PLATES.length]; sp.cars[kind][tone] = OFFS.map(off => bakeVehicle(kind, tone, off, 14, CAM_H / UPM, 190, plate)); } }
      sp.lamp = makeGlow(LOOK.lamp, 128);
      sp.red = makeGlow('#ff3020', 64); sp.green = makeGlow('#30ff9a', 64); sp.blue = makeGlow('#4a7dff', 96);
      sp.pool = makePool(LOOK.lamp, LOOK.poolA);
      sp.peds = [false, true].map(fl => [0, 1, 2, 3, 4, 5].map(v => [0, 1, 2, 3, 4].map(f => makePed(v, f, fl))));
      sprites = sp;
    }

    /* ================================================================ the meter: its own small canvas over the corner, redrawn only when a number changes */
    const HUDY = 200, HUDW = 300, HUDC = { red: '#ff3b26', off: '#2b0e08', lab: '#d9c7a3' };
    // the meter is drawn at 82.5% of its round 9 size (Barney, 28 October: 75%, then 10% larger than that), shrunk towards its bottom-left corner; the district name keeps its size
    const MS = 0.825, meterT = g => g.setTransform(RS * MS, 0, 0, RS * MS, RS * 14 * (1 - MS), RS * ((H - 14) * (1 - MS) - HUDY));
    let hudBase = null, hudKey = '', labK = 1;
    const glyphs = new Map();
    function hudLayout(){
      hudC.width = Math.round(HUDW * RS); hudC.height = Math.round((H - HUDY) * RS);
      hudC.style.top = (HUDY / H * 100) + '%'; hudC.style.width = (HUDW / W * 100) + '%'; hudC.style.height = ((H - HUDY) / H * 100) + '%';
      // on phones the row labels grow to at least phone-label-min, 10 CSS px; the meter keeps its place and size
      labK = env.touch ? Math.max(1, 10 / (11 * MS * env.cssScale())) : 1;
      hudBase = null; hudKey = ''; glyphs.clear();
    }
    function hudGeom(){ const w = 210, rowH = [80, 50, 50], faceH = rowH[0] + rowH[1] + rowH[2] + 10, head = 34, border = 9, outerW = w + border * 2, outerH = faceH + head + border * 2, ox = 14, oy = H - 14 - outerH; return { w, rowH, faceH, outerW, outerH, ox, oy, x: ox + border, y: oy + border + head }; }
    function drawHudBase(){
      const c = mk(hudC.width, hudC.height), g = c.getContext('2d'), G = hudGeom();
      meterT(g);
      // the meter set into a lightbox sign, like the shop signs
      g.save(); g.shadowColor = 'rgba(255,226,170,0.8)'; g.shadowBlur = 20 * MS; g.fillStyle = '#070504'; rr(g, G.ox - 4, G.oy - 4, G.outerW + 8, G.outerH + 8, 10); g.fill(); g.restore();
      const gr = g.createLinearGradient(0, G.oy, 0, G.oy + G.outerH); gr.addColorStop(0, '#f6e5ba'); gr.addColorStop(0.35, '#fff4d8'); gr.addColorStop(1, '#ead39f');
      g.fillStyle = gr; rr(g, G.ox, G.oy, G.outerW, G.outerH, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; rr(g, G.ox + 2.5, G.oy + 2.5, G.outerW - 5, G.outerH - 5, 6); g.stroke();
      hudText(g, '的士', G.ox + 14, G.oy + 27, 23, 900, F.zhSerif, '#a8140c');
      hudText(g, 'TAXI METER', G.ox + G.outerW - 14, G.oy + 25, 16, 700, F.cond, '#a8140c', 'right', 2.5);
      g.fillStyle = 'rgba(8,5,3,0.96)'; rr(g, G.x, G.y, G.w, G.faceH, 4); g.fill();
      const L0 = G.x + 18, lab = HUDC.lab;
      const label = (yy, zh, en) => { hudText(g, zh, L0, yy, 13 * labK, 700, F.zhSans, lab); hudText(g, en, L0 + zh.length * 14 * labK + 6, yy - 1, 11 * labK, 600, F.plex, lab, 'left', labK); };
      const rule = yy => { g.fillStyle = '#2a1d12'; g.fillRect(G.x + 14, yy, G.w - 28, 1); };
      let yy = G.y + 8;
      label(yy + 18, '車資', 'FARE  HK$'); yy += G.rowH[0]; rule(yy);
      label(yy + 30, '時間', 'TIME'); yy += G.rowH[1]; rule(yy);
      label(yy + 30, '速度', 'KM/H');
      hudBase = c;
    }
    function glyph(ch, dh){
      const key = ch + '|' + dh; let e = glyphs.get(key); if (e) return e;
      const M = 14, k = RS * MS, c = mk((dh * 0.75 + M * 2) * k, (dh + M * 2) * k), g = c.getContext('2d');
      g.setTransform(k, 0, 0, k, M * k, M * k); g.shadowColor = 'rgba(255,59,38,0.7)'; g.shadowBlur = 10 * MS;
      seg7(g, ch, 0, 0, dh, HUDC.red, HUDC.off);
      e = { c, m: M }; glyphs.set(key, e); return e;
    }
    function hudDigits(g, val, R0, y, dh){
      let cx = R0 - seg7w(val, dh);
      for (const ch of val){ const e = glyph(ch, dh); g.drawImage(e.c, cx - e.m, y - e.m, e.c.width / (RS * MS), e.c.height / (RS * MS)); cx += ch === '.' ? dh * 0.12 + dh * 0.04 : dh * 0.68; }
    }
    // m: the fare (HK$), the time and the km/h (numbers, or null for unlit places), the district, and the caption's fade (0 to 1)
    function drawHUD(m){
      const dist = DISTRICTS[m.d], a = clamp(m.a, 0, 1);
      const fare = (Math.round((+m.fare || 0) * 100) / 100).toFixed(2);
      const time = m.time == null ? '  ' : String(clamp(Math.ceil(m.time), 0, 99)).padStart(2, '0'), kmh = m.kmh == null ? '   ' : String(clamp(Math.round(m.kmh), 0, 999));
      const key = fare + '|' + time + '|' + kmh + '|' + m.d + '|' + a.toFixed(2);
      if (key === hudKey) return;
      hudKey = key;
      if (!hudBase) drawHudBase();
      const g = hctx, G = hudGeom();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, hudC.width, hudC.height); g.drawImage(hudBase, 0, 0);
      meterT(g);
      const R0 = G.x + G.w - 18; let yy = G.y + 8;
      hudDigits(g, fare.padStart(6, ' '), R0, yy + 28, 40); yy += G.rowH[0];
      hudDigits(g, time, R0, yy + 11, 28); yy += G.rowH[1];
      hudDigits(g, kmh.padStart(3, ' '), R0, yy + 11, 28);
      // the district, Chinese over English, as a film subtitle
      g.setTransform(RS, 0, 0, RS, 0, -HUDY * RS);
      g.save(); g.globalAlpha = a; g.lineJoin = 'round'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      const cy = H - 14 - G.outerH * MS - 14;
      g.font = '700 28px ' + F.zhSans; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.lineWidth = 5; g.strokeText(dist.zh, G.ox + 2, cy - 24); g.fillStyle = '#fff1c4'; g.fillText(dist.zh, G.ox + 2, cy - 24);
      g.font = '500 18px ' + F.plex; g.strokeText(dist.en, G.ox + 2, cy); g.fillText(dist.en, G.ox + 2, cy);
      g.restore();
    }

    /* ================================================================ City Nights: the street as tools a game calls
       Everything above is the speed test's street. What follows turns it into the kit's World layer: the title's slow
       drive, the run a game sets up (its taxi, its traffic and its power-ups, in metres), the taxi's sway and brake
       lights worked out from how the game moves it, the power-up signs, the crash pop, the meter and the caption.
       The tools draw; the game decides what happens. */
    const col = name => env.colours[name];
    let effects = true, built = false;

    // the people, the flickering sign and the grain's clock: the street's own life, whatever the game does
    const amb = { flick: { on: 1, next: 0.6 }, grainT: 0, t: 0 };
    function ambientStep(dt){
      for (const p of peds) if (p.speed){ p.z = (p.z + p.dir * p.speed * dt + TRACK) % TRACK; p.phase = (p.phase + p.speed * dt / 240) % 4; }
      if (!reduceMotion){
        amb.flick.next -= dt;
        if (amb.flick.next <= 0){ if (amb.flick.on){ amb.flick.on = 0; amb.flick.next = 0.07 + Math.random() * 0.06; } else { amb.flick.on = 1; amb.flick.next = 0.45 + Math.random() * 1.8; } }
      } else amb.flick.on = 1;
      amb.grainT += dt; amb.t += dt;
    }

    // traffic spread along the street, each car in a lane at its own speed (the speed test's, in street units)
    function makeTraffic(n, seed){
      const r = rng(seed || 808), list = [];
      for (let k = 0; k < n; k++){
        const p = r(), kind = p < 0.4 ? 'taxi' : p < 0.65 ? 'sedan' : p < 0.85 ? 'van' : 'minibus';
        list.push({ z: (k / n) * TRACK + r() * 2000, x: LANES[k % 3], speed: 2600 + r() * 2400, kind, tone: Math.floor(r() * TONES[kind]) });
      }
      return list;
    }

    /* ---- the title's street: the speed test's drive, eased off to about 38 km/h, steering round the traffic itself */
    const DEMO_SPEED = 4200;
    const demo = { pos: 30 * SEG, x: 0, tx: 0, speed: DEMO_SPEED, brake: 0, accel: 0, hold: 0, sky: 0, lean: 0, moving: true, cars: [], tokens: [] };
    function demoStep(dt){
      const st = demo, cars = st.cars;
      st.pos = (st.pos + st.speed * dt) % TRACK;
      for (const c of cars) c.z = (c.z + c.speed * dt) % TRACK;
      const pz = st.pos + PLAYER_Z;
      if (st.hold > 0) st.hold -= dt;
      else {
        const near = lane => { let best = 1e9; for (const c of cars){ if (Math.abs(c.x - lane) > 0.3) continue; const d = (c.z - pz + TRACK) % TRACK; if (d > 200 && d < best) best = d; } return best; };
        const cur = LANES.reduce((a, b) => Math.abs(b - st.tx) < Math.abs(a - st.tx) ? b : a);
        if (near(cur) < 5200){ let bestL = cur, bestD = near(cur); for (const l of LANES){ const d = near(l); if (d > bestD + 800){ bestD = d; bestL = l; } } st.tx = bestL; }
      }
      // ease off behind slower traffic (the brake lights show) before pulling out round it
      let gap = 1e9, gapSpeed = 0;
      for (const c of cars){ if (Math.abs(c.x - st.x) > 0.35) continue; const d = (c.z - pz + TRACK) % TRACK; if (d > 200 && d < gap){ gap = d; gapSpeed = c.speed; } }
      let target = DEMO_SPEED;
      if (gap < 7500) target = lerp(gapSpeed + 300, DEMO_SPEED, clamp((gap - 2600) / 4900, 0, 1));
      const prevSpeed = st.speed;
      st.speed += (target - st.speed) * Math.min(1, dt * (target < st.speed ? 1.8 : 0.7));
      const dec = (prevSpeed - st.speed) / Math.max(dt, 0.001);
      st.brake = lerp(st.brake, clamp((dec - 350) / 2000, 0, 1), Math.min(1, dt * 10));
      st.accel = lerp(st.accel, clamp(-dec / 1500, 0, 1), Math.min(1, dt * 4));
      const px = st.x;
      st.x += (st.tx - st.x) * Math.min(1, dt * 2.6);
      st.lean = lerp(st.lean, clamp((st.x - px) / Math.max(dt, 0.001) * 0.6, -1, 1), Math.min(1, dt * 6));
      st.sky -= segs[Math.floor(st.pos / SEG) % N_SEG].curve * st.speed * dt * 0.0000016;
    }

    /* ---- the run: what the game sets (cn.street, in metres) and what the kit works out from it */
    const wrapU = u => (u % TRACK + TRACK) % TRACK;
    const api = {
      taxi: { z: 0, x: 0, speed: 0 }, cars: [], tokens: [],
      lanes: LANES.slice(), length: TRACK / UPM,
      traffic: (n, seed) => makeTraffic(n == null ? 16 : n, seed).map(c => ({ z: c.z / UPM, x: c.x, speed: c.speed / UPM, kind: c.kind, tone: c.tone })),
      gap: (from, to) => { const L = TRACK / UPM; return (((to - from) % L) + L) % L; },
      size: kind => { const v = VEH[kind] || VEH.taxi; return { width: v.W, length: v.L }; },
      district: z => { const d = DISTRICTS[Math.floor(wrapU(z * UPM) / SEG / DIST_LEN) % DISTRICTS.length], i = DISTRICTS.indexOf(d); return { index: i, zh: d.zh, en: d.en }; },
      crash: (z, x) => { popAsk = { z: z * UPM, x: clamp(+x || 0, -1.2, 1.2) }; }
    };
    const meter = { time: null, speed: null };
    const run = { x: 0, speed: 0, brake: 0, accel: 0, lean: 0, sky: 0, moving: false, cars: [], tokens: [], pos: 0, cap: { d: -1, t: 0 } };
    function reset(){
      api.taxi = { z: 0, x: 0, speed: 0 }; api.cars = []; api.tokens = [];
      meter.time = null; meter.speed = null;
      Object.assign(run, { x: 0, speed: 0, brake: 0, accel: 0, lean: 0, sky: 0, moving: false, cap: { d: -1, t: 0 } });
      pop = null; popAsk = null; popLast = '';
      hudKey = ''; clearPop();
    }
    // one step of play, after the game's own: the street's life, then the taxi's motion from how the game moved it
    function step(dt){
      ambientStep(dt);
      const tx = api.taxi || {}, v = (+tx.speed || 0) * UPM, x = clamp(+tx.x || 0, -1.2, 1.2), zu = wrapU((+tx.z || 0) * UPM);
      const dec = (run.speed - v) / dt;
      const want = tx.brake == null || tx.brake === false ? clamp((dec - 350) / 2000, 0, 1) : clamp(tx.brake === true ? 1 : +tx.brake || 0, 0, 1);
      run.brake = lerp(run.brake, want, Math.min(1, dt * 10));
      run.accel = lerp(run.accel, clamp(-dec / 1500, 0, 1), Math.min(1, dt * 4));
      run.lean = lerp(run.lean, clamp((x - run.x) / dt * 0.6, -1, 1), Math.min(1, dt * 6));
      run.x = x; run.speed = v; run.moving = v > 40;
      run.sky -= segs[Math.floor(zu / SEG) % N_SEG].curve * v * dt * 0.0000016;
      // the district caption fades in over 0.6 s when the taxi enters a district, and stays
      const d = Math.floor(zu / SEG / DIST_LEN) % DISTRICTS.length;
      if (d !== run.cap.d){ run.cap.d = d; run.cap.t = 0; }
      run.cap.t += dt;
      if (pop) pop.t += dt;
    }
    const toUnits = (list, out) => {
      out.length = 0;
      if (Array.isArray(list)) for (const c of list) if (c) out.push({ z: wrapU((+c.z || 0) * UPM), x: +c.x || 0, kind: c.kind, tone: c.tone | 0 });
      return out;
    };
    function runScene(){
      // the camera sits behind the taxi, which is drawn with its rear on the road at CAB_Y of the picture
      run.pos = wrapU((+api.taxi.z || 0) * UPM - cabGeometry().zc);
      toUnits(api.cars, run.cars); toUnits(api.tokens, run.tokens);
      for (const c of run.cars){ if (!VEH[c.kind]) c.kind = 'sedan'; c.tone = ((c.tone % TONES[c.kind]) + TONES[c.kind]) % TONES[c.kind]; }
      return run;
    }

    /* ---- power-ups: small lightbox signs, each a face with its ink and one character (PowerUp) */
    const TOKEN = {
      time:   { zh: '時', face: 'face-green',  ink: 'ink-cream' },
      fare:   { zh: '錢', face: 'face-yellow', ink: 'ink-black' },
      speed:  { zh: '快', face: 'face-red',    ink: 'ink-yellow' },
      shield: { zh: '保', face: 'face-blue',   ink: 'ink-white' },
      double: { zh: '雙', face: 'face-cream',  ink: 'ink-red' }
    };
    const TOKEN_M = 1.1;   // a token's size in metres (as the PowerUp preview's road shows them): hung a third of that above the road, scaled with distance like the cars
    function makeToken(t){
      const s = 192, c = mk(s, s), g = c.getContext('2d'), rim = s * 0.037, fw = s - rim * 2, fr = s * 0.06;
      g.fillStyle = col('case'); rr(g, 0, 0, s, s, s * 0.088); g.fill();
      g.fillStyle = col(t.face); rr(g, rim, rim, fw, fw, fr); g.fill();
      const gr = g.createLinearGradient(0, rim, 0, rim + fw);
      gr.addColorStop(0, 'rgba(0,0,0,0.06)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0.1)');
      g.fillStyle = gr; rr(g, rim, rim, fw, fw, fr); g.fill();
      const li = s * 0.035; g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1.5; rr(g, rim + li, rim + li, fw - li * 2, fw - li * 2, fr * 0.7); g.stroke();
      lightText(g, t.zh, s / 2, s / 2 + s * 0.02, s * 0.59, 900, F.zhSerif, col(t.ink));
      return c;
    }
    function makeSoft(size){
      const c = mk(size, size), g = c.getContext('2d'), rg = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      rg.addColorStop(0, 'rgba(255,255,255,0.9)'); rg.addColorStop(0.45, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.fillRect(0, 0, size, size); return c;
    }
    function addTokens(){
      for (const k in TOKEN) atlasAdd('token:' + k, makeToken(TOKEN[k]), true);
      atlasAdd('glow:soft', makeSoft(64)); atlasAdd('pool:white', makePool('#ffffff', 0.75));
    }
    // where a token sits on screen this frame, or null
    function tokenAt(st, tk){
      const rel = (tk.z - st.pos + TRACK) % TRACK;
      if (rel < NEAR_CAR || rel > 60 * SEG || !TOKEN[tk.kind]) return null;
      const n = Math.floor((rel + (st.pos % SEG)) / SEG); if (n >= DRAW || !B[n].ok || !B[n + 1].ok) return null;
      const b = B[n], nb = B[n + 1], t = ((tk.z % SEG) + SEG) % SEG / SEG, scale = lerp(b.scale, nb.scale, t);
      const s = TOKEN_M * UPM * scale * K, bob = reduceMotion ? 0 : s * 0.06 * (0.5 - 0.5 * Math.cos(amb.t * Math.PI / 1.6));
      return { n, t, rel, scale, s, x: lerp(b.sx, nb.sx, t) + scale * tk.x * ROAD * K, y: lerp(b.sy, nb.sy, t), bob, a: clamp(1 - (1 / scale - 26000) / 30000, 0.35, 1) };
    }

    /* ---- the crash pop: CRASH!, SMASH! or BANG! lit as a neon burst right over the crash, gone within a second (CrashPop) */
    const POPS = {
      crash: { word: 'Crash!', tag: '轟', c1: 'tube-red', k1: 'tube-core-red', c2: 'tube-yellow', k2: 'tube-core-yellow', tilt: -5, size: 108, ls: 0.02, tagAt: [422, 34],
        d: 'M236.5 26.7L264 60.4L299.2 27.7L299.9 61.9L345.2 38.5L335 78.8L407 59.8L367.1 97.3L447.1 93.9L391.8 124.2L436.7 138.5L396 153.3L438.7 163.1L399.1 175.8L438 200.9L371.3 201.8L389.1 230.1L346.3 216.9L350.2 259.6L309.6 236.4L298.9 271L258.4 246.4L245.5 281.6L216 247.7L177.7 270.1L169.8 231L122.4 264.4L139.9 223.8L82.4 242L102.5 199.6L49.4 198.2L84.5 175.2L31.3 167.4L73 146.6L24.9 131.4L81.8 126.8L34.2 90L111.6 97.3L74.1 63.7L130.3 81.5L126.5 49L165.3 63L175.3 31.2L214.6 52.4Z' },
      smash: { word: 'Smash!', tag: '啪', c1: 'tube-yellow', k1: 'tube-core-yellow', c2: 'tube-red', k2: 'tube-core-red', tilt: 4, size: 108, ls: 0.02, tagAt: [62, 42], miter: true,
        d: 'M227.1 24.8L330.9 35.7L394.3 89.1L452.5 118.6L422.6 185.1L355.1 251.4L272.4 272L189 260.3L88.8 247.6L39.2 195.7L58.7 131.9L76.8 71.7L147.7 54.1Z',
        cracks: 'M330.9 35.7L324.2 56.7L305.5 67.7M422.6 185.1L391 185.2L371.5 175.2M88.8 247.6L104 229L131.2 220.3M76.8 71.7L105.7 77.7L122.5 93.6' },
      bang: { word: 'Bang!', tag: '砰', c1: 'tube-teal', k1: 'tube-core-teal', c2: 'tube-pink', k2: 'tube-core-pink', tilt: -3, size: 112, ls: 0.03, tagAt: [408, 50],
        d: 'M238.9 40A63.5 63.5 0 0 1 332.3 53A55.3 55.3 0 0 1 406.8 92.2A29.5 29.5 0 0 1 434.5 136.3A37.7 37.7 0 0 1 423.2 189.1A48.8 48.8 0 0 1 368.4 233.1A50.6 50.6 0 0 1 294.1 255.7A65.4 65.4 0 0 1 192.8 256.8A51.7 51.7 0 0 1 107.8 231.2A39.5 39.5 0 0 1 54.4 185.4A28.2 28.2 0 0 1 44.5 142.1A34.8 34.8 0 0 1 76.1 89.7A42.8 42.8 0 0 1 140.5 55.2A59.1 59.1 0 0 1 238.9 40Z' }
    };
    const POP_TIME = 1;   // pop-time
    let pop = null, popAsk = null, popLast = '', popDrawn = false;
    // CSS's ease-out, cubic-bezier(0, 0, 0.58, 1), as the design system's keyframes use it
    function easeOut(u){
      // the curve's x is 1.74 s²(1 - s) + s³ and its y 3 s²(1 - s) + s³: find s for x = u by halving, then give y
      let a = 0, b = 1, s = u;
      for (let k = 0; k < 20; k++){ s = (a + b) / 2; if (1.74 * s * s * (1 - s) + s * s * s < u) a = s; else b = s; }
      return 3 * s * s * (1 - s) + s * s * s;
    }
    const keyed = (f, ks) => { for (let i = 1; i < ks.length; i++) if (f <= ks[i][0]){ const a = ks[i - 1], b = ks[i], u = (f - a[0]) / Math.max(1e-6, b[0] - a[0]); return lerp(a[1], b[1], easeOut(clamp(u, 0, 1))); } return ks[ks.length - 1][1]; };
    // the design system's cn-pop keyframes: springs in, holds, dips once like a tube catching, and fades; under Reduce motion it only fades
    const POP_SCALE = [[0, 0.55], [0.12, 1.08], [0.2, 1], [1, 1]];
    const POP_ALPHA = [[0, 0], [0.12, 1], [0.68, 1], [0.74, 0.5], [0.8, 1], [1, 0]];
    const POP_FADE = [[0, 0], [0.12, 1], [0.7, 1], [1, 0]];
    function startPop(st){
      const ask = popAsk; popAsk = null;
      const names = Object.keys(POPS).filter(n => n !== popLast), name = names[Math.floor(Math.random() * names.length)];
      popLast = name;
      // right over the point where the two vehicles meet, about 0.8 m up; the taxi's own spot if that point is not ahead
      const cg = cabGeometry(); let x = W / 2 + sway(st), y = cg.gy - cg.rw * 0.4;
      const q = projectZ2(st, ask.z);
      if (q){ x = q.sx + q.scale * ask.x * ROAD * K; y = q.sy - q.scale * 0.8 * UPM * K; }
      pop = { name, t: 0, x, y };
    }
    function clearPop(){ if (popDrawn){ const g = env.pop.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, env.pop.width, env.pop.height); popDrawn = false; } }
    function drawPop(){
      clearPop();
      if (!pop) return;
      const f = pop.t / POP_TIME;
      if (f >= 1){ pop = null; return; }
      const P = POPS[pop.name], cv = env.pop, g = cv.getContext('2d'), k = cv.width / W;
      const alpha = keyed(f, reduceMotion ? POP_FADE : POP_ALPHA), sc = reduceMotion ? 1 : keyed(f, POP_SCALE);
      // 480 x 300 on a 720-line window: 0.75 of a picture pixel per pop unit; a little smaller on phones (about 0.54 of the picture's height wide)
      const u = (env.touch ? 0.54 * H / 480 : 0.75), bw = 480 * u, bh = 300 * u;
      const cx = clamp(pop.x, bw / 2, W - bw / 2), cy = clamp(pop.y, bh / 2, H - bh / 2), s = u * sc * k;
      g.save(); g.globalAlpha = alpha;
      g.setTransform(1, 0, 0, 1, cx * k, cy * k); g.rotate(P.tilt * Math.PI / 180); g.scale(s, s); g.translate(-240, -150);
      const path = new Path2D(P.d), c1 = col(P.c1), c2 = col(P.c2), k1 = col(P.k1), k2 = col(P.k2);
      g.lineJoin = P.miter ? 'miter' : 'round'; g.miterLimit = 8;
      g.fillStyle = col('neon-board'); g.fill(path);
      for (const blur of [24, 8]){ g.shadowColor = c1; g.shadowBlur = blur * s; g.strokeStyle = c1; g.lineWidth = 6; g.stroke(path); }
      g.shadowBlur = 0; g.strokeStyle = k1; g.lineWidth = 2; g.stroke(path);
      if (P.cracks){ const cr = new Path2D(P.cracks); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = c1; g.shadowBlur = 8 * s; g.strokeStyle = c1; g.lineWidth = 4; g.stroke(cr); g.shadowBlur = 0; g.strokeStyle = k1; g.lineWidth = 1.5; g.stroke(cr); }
      // the word: Antonio, skewed, glowing, with a hard comic drop beneath
      g.save(); g.translate(240, 150); g.transform(1, 0, Math.tan(-8 * Math.PI / 180), 1, 0, 0);
      g.font = '700 ' + P.size + 'px ' + F.cond; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g) g.letterSpacing = (P.size * P.ls) + 'px';
      const word = P.word.toUpperCase();
      g.fillStyle = col('case'); g.fillText(word, 0, 6);
      for (const blur of [40, 18, 6]){ g.shadowColor = c2; g.shadowBlur = blur * s; g.fillStyle = c2; g.fillText(word, 0, 0); }
      g.shadowBlur = 0; g.fillStyle = k2; g.fillText(word, 0, 0);
      g.strokeStyle = c2; g.lineWidth = 2; g.lineJoin = 'round'; g.strokeText(word, 0, 0);
      g.restore();
      // its Chinese sound-word on a small round tag
      const [tx, ty] = P.tagAt;
      g.beginPath(); g.arc(tx, ty, 30.5, 0, Math.PI * 2); g.fillStyle = col('neon-board'); g.fill();
      g.shadowColor = c2; g.shadowBlur = 10 * s; g.strokeStyle = c2; g.lineWidth = 3; g.stroke();
      g.font = '700 34px ' + F.zhSans; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      for (const blur of [14, 6]){ g.shadowBlur = blur * s; g.fillStyle = c2; g.fillText(P.tag, tx, ty + 1); }
      g.shadowBlur = 0; g.fillStyle = k2; g.fillText(P.tag, tx, ty + 1);
      g.restore();
      popDrawn = true;
    }

    /* ---- sizes and settings */
    // w: the picture's width (540 lines tall, its width following the window); rs: canvas pixels per picture pixel
    function resize(w, rs){
      const nPW = Math.round(w * rs), nPH = Math.round(H * rs), changed = w !== W || nPW !== PW || nPH !== PH;
      W = w; K = W / 2; RS = rs; PW = nPW; PH = nPH;
      if (!changed) return false;
      canvas.width = PW; canvas.height = PH; hudLayout();
      const pk = Math.min(window.devicePixelRatio || 1, 2) * env.cssScale();
      env.pop.width = Math.max(1, Math.round(W * pk)); env.pop.height = Math.max(1, Math.round(H * pk)); popDrawn = true;
      if (built){ makeTargets(); makeSkylineTex(); bakeCab(); }
      return true;
    }
    // Picture: edge smoothing (4 for Best, 0 for Faster and Fastest)
    function setSmoothing(n){
      smoothing = n; if (!built) return;
      const s = Math.min(n, maxSamples); if (s === samples) return;
      samples = s; makeTargets();
    }
    function build(){
      buildTrack(); buildPeople(); makeTiles();
      demo.cars = makeTraffic(16).map(c => Object.assign(c, { speed: c.speed * DEMO_SPEED / 7600 }));
      buildSprites(); initGL(); buildAtlas(); buildStreet(); makeTargets(); makeSkylineTex(); bakeCab();
      built = true;
    }
    // the meter's numbers this frame, and the caption's district and fade
    function meterNow(fare){
      return { fare, time: meter.time, kmh: meter.speed != null ? meter.speed : run.speed / UPM * 3.6, d: Math.max(0, run.cap.d), a: run.cap.t / 0.6 };
    }
    return {
      get ready(){ return built; },
      build, resize, setSmoothing,
      setEffects(on){ effects = !!on; },
      setReduceMotion(on){ reduceMotion = !!on; },
      // the title's street: its own life and the slow drive, then the picture
      title(dt){ ambientStep(dt); demoStep(dt); renderGL(demo); clearPop(); },
      reset, step,
      // the run as it stands: the street, then the meter, the caption and the crash pop over it
      draw(fare){ const st = runScene(); if (popAsk) startPop(st); renderGL(st); drawHUD(meterNow(fare)); drawPop(); },
      api, meter
    };
  }

  /* ---------- The game shell ---------- */
  function createGame(cfg) {
    if (!cfg || typeof cfg.start !== 'function' || typeof cfg.update !== 'function' || (cfg.draw != null && typeof cfg.draw !== 'function')) {
      throw new Error('City Nights: CityNights.game() needs start() and update() functions (draw() is optional).');
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
    const hudCanvas = el('canvas', 'cn-hud');      // the meter and the district caption, redrawn when a number changes
    const popCanvas = el('canvas', 'cn-popc');     // the crash pop, over the picture
    hudCanvas.setAttribute('aria-hidden', 'true');
    popCanvas.setAttribute('aria-hidden', 'true');
    const playUi = el('div', 'cn-play');
    const hintEl = el('div', 'cn-touch-hint', ICON.drag);
    hintEl.append(txt('span', '', touchHint));
    hintEl.hidden = true;
    const meterSr = el('div', 'cn-sr');            // the meter's numbers and the district, for screen readers
    meterSr.setAttribute('aria-live', 'polite');
    const titleScreen = el('div', 'cn-title-screen');
    stage.append(canvas, hudCanvas, popCanvas, playUi, titleScreen);
    const dialogLayer = el('div', 'cn-dialog-layer');
    dialogLayer.hidden = true;
    const rotateEl = el('div', 'cn-rotate');
    const errorEl = el('div', 'cn-plaque cn-error');
    errorEl.hidden = true;
    root.append(stage, dialogLayer, rotateEl, errorEl);
    document.body.append(root);

    /* The street is drawn with WebGL2. A browser without it gets a clear message and no game. */
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

    /* ----- The World: the street and its tools ----- */
    // the kit's named colours the street draws with (power-ups, the crash pop), read from city-nights.css
    const rootStyle = getComputedStyle(document.documentElement);
    const colours = {};
    ['case', 'neon-board', 'tube-red', 'tube-core-red', 'tube-yellow', 'tube-core-yellow', 'tube-teal', 'tube-core-teal', 'tube-pink', 'tube-core-pink',
      'face-green', 'face-yellow', 'face-red', 'face-blue', 'face-cream', 'ink-cream', 'ink-black', 'ink-yellow', 'ink-white', 'ink-red']
      .forEach((t) => { colours[t] = rootStyle.getPropertyValue('--' + t).trim(); });
    const street = makeStreet({ canvas: canvas, gl: gl, hud: hudCanvas, pop: popCanvas, colours: colours, touch: touch, cssScale: () => V.k });
    let dirty = true;          // the picture needs drawing again while play is stopped (a setting changed, or the window)
    let pendingStart = false;  // Start game pressed before the street was built
    let lost = false;          // the browser took the graphics chip back
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      lost = true;
      errorEl.textContent = 'The graphics chip was reset by the browser. Reload the page to carry on.';
      errorEl.hidden = false;
    });
    // Picture: Best is 4x edge smoothing at full sharpness, Faster has no smoothing, Fastest also ordinary sharpness.
    // Automatic starts as Best; timing the first seconds of play and stepping down comes in step 3d.
    const pictureSmoothing = () => (own.picture === 'faster' || own.picture === 'fastest' ? 0 : 4);
    const pictureSharp = () => (own.picture === 'fastest' ? 1 : MAX_SHARP);

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
      playUi.append(tiles, hintEl, meterSr);
      srDistrict = -1;
    }

    /* ----- Layout: the picture fills the window. The canvas holds it at up to 1.5 canvas pixels per picture pixel
       (the speed test's sharpness; ordinary under Picture: Fastest). Once the street is built, a new size takes
       effect a moment after the window stops changing, since the taxi's pictures are made again for it. ----- */
    let sizeT = 0;
    function applySize() {
      sizeT = 0;
      const rs = clamp((window.devicePixelRatio || 1) * V.k, 1, pictureSharp());
      if (street.resize(V.W, Math.round(rs * 1000) / 1000)) dirty = true;
    }
    function layout() {
      const vw = root.clientWidth || window.innerWidth;
      const vh = root.clientHeight || window.innerHeight;
      V.W = Math.round(PICTURE_H * clamp(vw / vh, ASPECT[0], ASPECT[1]));
      V.k = Math.min(vw / V.W, vh / V.H);
      stage.style.width = (V.W * V.k) + 'px';
      stage.style.height = (V.H * V.k) + 'px';
      root.style.setProperty('--cn-k', String(V.k));
      clearTimeout(sizeT);
      if (street.ready) sizeT = setTimeout(applySize, 150); else applySize();
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
      // Effects: the glow round lights and signs; Reduce motion: the taxi's sway and roll; Picture: smoothing and sharpness
      street.setEffects(settings.effects);
      street.setReduceMotion(settings.reduceMotion);
      street.setSmoothing(pictureSmoothing());
      if (street.ready && !sizeT) applySize();
      dirty = true;
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
      if (!street.ready) { pendingStart = true; return; }   // the street is still being built: start as soon as it is
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
      street.reset();   // the taxi at the start of Tsim Sha Tsui, no traffic or power-ups, the meter blank: the game sets them
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
      street.step(STEP);   // the street's own life, and the taxi's sway and brake lights from how the game moved it
    }
    // The picture: the title's street drives on behind the menu; in a run it is drawn every frame of play, and once
    // more when something changes while play is stopped (the last frame stays on screen under a dialog)
    function render(dt) {
      if (lost) return;
      if (!street.ready) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(night[0], night[1], night[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }
      if (!state.inGame) { street.title(Math.min(dt, 0.05)); return; }
      if (state.screen !== 'play' && !dirty) return;
      dirty = false;
      if (cfg.draw && state.game) { try { cfg.draw(state.game, api); } catch (e) { reportError(e); } }
      try { street.draw(state.cents / 100); } catch (e) { reportError(e); }
      // the district is announced to screen readers when the taxi enters it, as the caption shows it
      const d = street.api.district(+street.api.taxi.z || 0);
      if (d.index !== srDistrict) { srDistrict = d.index; meterSr.textContent = d.en; }
    }
    let srDistrict = -1;
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
      render(dt);
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
      money: money, rand: rand, randInt: randInt, pick: pick, clamp: clamp, lerp: lerp, hit: hit,
      /* The World. The kit draws the street every frame; the game moves what is on it (distances in metres):
         street.taxi     { z, x, speed, brake }: how far along the street (z), across it (x: -1 the left kerb, 1 the right;
                         the lanes are street.lanes), speed in metres a second, and brake (0 to 1; leave it out and the
                         brake lights come on when the taxi slows). The kit adds its sway, roll and suspension.
         street.cars     [{ z, x, kind, tone }]: other traffic; kind is 'taxi', 'sedan', 'van' or 'minibus'
         street.tokens   [{ z, x, kind }]: power-ups; kind is 'time', 'fare', 'speed', 'shield' or 'double'
         street.traffic(n, seed)  n cars spread along the street, each with a speed (metres a second) for the game to use
         street.length   one lap of the street in metres (560: Tsim Sha Tsui, Jordan, Yau Ma Tei, Mong Kok); z wraps round
         street.gap(from, to)     metres forward from z = from to z = to, round the lap
         street.size(kind)        { width, length } of a vehicle in metres; z is its rear
         street.district(z)       { index, zh, en } of the district at z; the caption follows the taxi by itself
         street.crash(z, x)       lights the crash pop (CRASH!, SMASH! or BANG!) over the point where two vehicles meet
         meter.time, meter.speed  the meter's TIME (two places) and KM/H (left as null: the taxi's own speed); FARE is the fare */
      street: street.api,
      meter: street.meter
    };

    /* ----- Boot ----- */
    buildRotate();
    buildTitle();
    nav = titleNav;
    layout();
    if (cfg.init) { try { cfg.init(api); } catch (e) { reportError(e); } }
    if (music && !settings.muted) setTimeout(music.load, 300);   // get the track ready behind the title screen
    // The street's signs, people and vehicles are drawn once with the kit's fonts, so it is built when they are in,
    // a moment after the title shows. Start game pressed in that moment starts as soon as it is built.
    whenFontsReady(() => {
      root.classList.remove('cn-loading');
      layout();
      setTimeout(() => {
        try { street.build(); } catch (e) { reportError(e); return; }
        applySettings();
        applySize();
        if (pendingStart) { pendingStart = false; startGame(); }
      }, 30);
    });
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
      layout: layout, music: music, view: V, street: street,
      get dirty() { return dirty; }, set dirty(v) { dirty = !!v; }
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
