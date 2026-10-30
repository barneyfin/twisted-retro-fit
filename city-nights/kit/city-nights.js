/* City Nights 0.9.1 — runtime
   One file, no dependencies. Exposes window.CityNights. Pair it with city-nights.css.
   The shell is copied from Retro Kit's runtime (kit/retro-kit.js) and restyled to the City Nights design system;
   the street is the City Nights speed test's (city-nights/speed-test/src).
   It owns everything every game shares: the World (the street drawn with WebGL2 into a 540-line picture that fills
   the window, its people and its life, the taxi and its motion, traffic, power-ups, obstacles, animals, passengers and
   the stop bay where the game puts them,
   glow, grain and fog, the meter and the district caption, the crash pop, the Picture setting's timing), the game
   loop, keyboard and touch input (up to two fingers at once), every screen outside play (title, mode choice, pause,
   game over, initials, high scores, settings, rotate), the WebGL2 check, full screen, the way back to the arcade,
   sound, music and saved data.
   The tools draw; a game decides what happens: see city-nights/kit/template.html. */
(function () {
  'use strict';

  const VERSION = '0.9.1';
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
      if (ch === '.' || ch === ',') {   // a comma is an unlit decimal point: ' ,  ' is a tip row with no passenger aboard
        d.style.width = r1(t + gap * 0.25) + 'px';
        seg(d, [-gap * 0.35, h - t, t, t], ch === '.');
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

  /* What the kit puts on the graphics chip, for the test page: every buffer, texture and render buffer the context is
     given, in bytes, worked out from the sizes asked for (mipmaps add a third). It watches the context's own calls, so
     nothing the kit allocates is missed; it is a count of what was asked for, not what the driver really uses. */
  function countGPU(gl) {
    const sizes = { buffer: new Map(), texture: new Map(), renderbuffer: new Map() };
    const bound = { array: null, vao: null, unit: 0, rb: null }, vaoElem = new Map(), unitTex = [];
    const BPP = { [gl.RGBA8]: 4, [gl.RGBA]: 4, [gl.RGBA16F]: 8, [gl.RGBA32F]: 16, [gl.R8]: 1, [gl.RG8]: 2, [gl.R16F]: 2, [gl.R32F]: 4, [gl.DEPTH_COMPONENT24]: 4, [gl.DEPTH24_STENCIL8]: 4, [gl.DEPTH_COMPONENT16]: 2 };
    const bpp = (f) => BPP[f] || 4;
    const texOf = (target) => (unitTex[bound.unit] || {})[target] || null;
    const watch = (name, fn) => { const f = gl[name]; gl[name] = function () { fn.apply(null, arguments); return f.apply(gl, arguments); }; };
    watch('bindBuffer', (t, b) => { if (t === gl.ARRAY_BUFFER) bound.array = b; else if (t === gl.ELEMENT_ARRAY_BUFFER) vaoElem.set(bound.vao, b); });
    watch('bindVertexArray', (v) => { bound.vao = v; });
    watch('bufferData', (t, d) => {
      const b = t === gl.ARRAY_BUFFER ? bound.array : t === gl.ELEMENT_ARRAY_BUFFER ? vaoElem.get(bound.vao) : null;
      if (b) sizes.buffer.set(b, typeof d === 'number' ? d : (d && d.byteLength) || 0);
    });
    watch('deleteBuffer', (b) => { sizes.buffer.delete(b); });
    watch('activeTexture', (u) => { bound.unit = u - gl.TEXTURE0; });
    watch('bindTexture', (t, x) => { (unitTex[bound.unit] = unitTex[bound.unit] || {})[t] = x; });
    watch('texStorage2D', (t, lv, f, w, h) => { const x = texOf(t); if (x) sizes.texture.set(x, w * h * bpp(f) * (lv > 1 ? 4 / 3 : 1)); });
    watch('texStorage3D', (t, lv, f, w, h, d) => { const x = texOf(t); if (x) sizes.texture.set(x, w * h * d * bpp(f) * (lv > 1 ? 4 / 3 : 1)); });
    watch('texImage2D', function (t, level, f) {
      const a = arguments, x = texOf(t); if (!x || level) return;
      const src = a.length === 6 ? a[5] : null, w = src ? src.width : a[3], h = src ? src.height : a[4];
      sizes.texture.set(x, (w || 0) * (h || 0) * bpp(f));
    });
    watch('generateMipmap', (t) => { const x = texOf(t); if (x && sizes.texture.has(x)) sizes.texture.set(x, sizes.texture.get(x) * 4 / 3); });
    watch('deleteTexture', (x) => { sizes.texture.delete(x); });
    watch('bindRenderbuffer', (t, r) => { bound.rb = r; });
    watch('renderbufferStorage', (t, f, w, h) => { if (bound.rb) sizes.renderbuffer.set(bound.rb, w * h * bpp(f)); });
    watch('renderbufferStorageMultisample', (t, s, f, w, h) => { if (bound.rb) sizes.renderbuffer.set(bound.rb, w * h * bpp(f) * Math.max(1, s)); });
    watch('deleteRenderbuffer', (r) => { sizes.renderbuffer.delete(r); });
    const mb = (m, only) => { let n = 0; m.forEach((v, k) => { if (!only || only.has(k)) n += v; }); return n / 1048576; };
    // megabytes: buffers, textures and render buffers in all, and of the buffers those in `street` (the street's shapes)
    return { mb: (street) => ({ buffers: mb(sizes.buffer), textures: mb(sizes.texture), renderbuffers: mb(sizes.renderbuffer), street: street ? mb(sizes.buffer, street) : 0 }) };
  }

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
    // each district is district-length, 3.7 km (Barney, 30 October 2026): 7,400 segments of half a metre, the street 14.8 km
    const SEG = 200, DIST_M = 3700, DIST_LEN = DIST_M * UPM / SEG, N_SEG = DIST_LEN * DISTRICTS.length, TRACK = SEG * N_SEG, DRAW = 175;
    // the street is planned whole when it is built, but its shapes are made a piece at a time as the taxi drives: CHUNK
    // segments (25 m) to a piece, NCH pieces kept on the graphics chip, from the camera on (DRAW needs 5 of them at most)
    const CHUNK = 50, NCH = 8, N_CHUNK = Math.ceil(N_SEG / CHUNK);
    const TRAFFIC_SPAN = 560 * UPM;   // the stretch round the taxi that street.traffic and street.recycle keep the traffic in: the old street's lap
    const CAM_H = 950, DEPTH = 1 / Math.tan(50 * Math.PI / 180), PLAYER_Z = CAM_H * DEPTH;
    const HZ = 0.40, CAB_Y = 0.9, SHOP_H = 1000;
    const LANES = [-0.667, 0, 0.667];
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
      // the first 560 m bend as the old street did; after that the same bends again and again, each one a little
      // sharper or gentler and to either side (from a stream of its own, so the rest of the street is picked as before)
      const rc = rng(1980);
      for (let lap = 0; curves.length < N_SEG; lap++) plan.forEach(([n, c]) => {
        const k1 = lap && c ? (0.7 + 0.5 * rc()) * (rc() < 0.5 ? -1 : 1) : 1;
        for (let k = 0; k < n; k++) curves.push(c ? c * k1 * Math.sin(Math.PI * k / n) : 0);
      });
      curves.length = N_SEG;
      segs = curves.map((c, i) => ({ i, curve: c, signs: [], lamp: 0, cable: 0, wall: [null, null], junc: false, cross: false, lights: 0 }));
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
    let peds = [], viewPos = 0;   // viewPos: where the last picture was drawn from
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
      // on a 15 km street only the people near the camera walk and are drawn: each keeps to the 30 m either side of
      // where it started (z0), so they can be found by that, in order along the street
      for (const p of peds){ p.z = (p.z + TRACK) % TRACK; p.z0 = p.z; }
      peds.sort((a, b) => a.z0 - b.z0);
    }
    const PED_ROAM = 30 * UPM;
    // fn(p) for each person who may be between from and to (street units, round the lap)
    function pedsNear(from, to, fn){
      const at = z => { let lo = 0, hi = peds.length; while (lo < hi){ const m = (lo + hi) >> 1; if (peds[m].z0 < z) lo = m + 1; else hi = m; } return lo; };
      from -= PED_ROAM; to += PED_ROAM;
      if (to - from >= TRACK){ for (const p of peds) fn(p); return; }
      const a = ((from % TRACK) + TRACK) % TRACK, b = a + (to - from);
      if (b <= TRACK){ for (let k = at(a), e = at(b); k < e; k++) fn(peds[k]); }
      else { for (let k = at(a); k < peds.length; k++) fn(peds[k]); for (let k = 0, e = at(b - TRACK); k < e; k++) fn(peds[k]); }
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
        const rs = h.qZ(sz0, -sx, sx, sy0, sy1), rb = h.bounds(rs);
        // the player's taxi also gets a copy of its picture with the sign out, for while it is hired (TaxiMarks: the face
        // about 86% of the way to case, TAXI only just showing, no glow): the picture so far, then the sign without its glow
        const hiredG = t.hero ? (t.hiredC = mk(g.canvas.width, g.canvas.height)).getContext('2d') : null;
        if (hiredG) hiredG.drawImage(g.canvas, 0, 0);
        g.save(); g.shadowColor = 'rgba(255,232,190,0.9)'; g.shadowBlur = Math.max(2, pxW * 0.05); h.face(rs, [0, 0, -1], '#f8efd6'); g.restore();
        const lettering = gg => { if (rb.y1 - rb.y0 > 3){ gg.fillStyle = '#c4241c'; gg.font = '700 ' + ((rb.y1 - rb.y0) * 0.8) + 'px ' + F.cond; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText('TAXI', (rb.x0 + rb.x1) / 2, (rb.y0 + rb.y1) / 2 + 0.5); } };
        lettering(g);
        if (hiredG) onLayer(t, hiredG, hh => { hh.face(rs, [0, 0, -1], '#f8efd6'); lettering(hiredG); hh.path(rs); hiredG.fillStyle = hexA(col('case'), 0.86); hiredG.fill(); });
        const a0 = P(0.55, roof, zr1 + 0.12), a1 = P(0.62, roof + 0.45, zr1 - 0.02);
        for (const gg of hiredG ? [g, hiredG] : [g]){ gg.strokeStyle = '#141414'; gg.lineWidth = Math.max(0.6, pxW * 0.004); gg.beginPath(); gg.moveTo(a0[0], a0[1]); gg.lineTo(a1[0], a1[1]); gg.stroke(); }
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
      if (t.hiredC) out.hired = t.hiredC;
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
      const p = st.trip || 0, on = st.moving ? 1 : 0, calm = reduceMotion ? 0.35 : 1;   // trip: how far it has driven, so a jump along the street doesn't jolt it
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
        if (ch === '.' || ch === ','){ g.fillStyle = ch === '.' ? on : off; g.fillRect(cx - gap * 0.35, y + hgt - t, t, t); cx += t + gap * 0.25; continue; }   // a comma: an unlit point
        g.save(); g.translate(cx, y); g.transform(1, 0, -0.08, 1, 0, 0);
        for (const s of 'abcdefg'){ segP(s); g.fillStyle = (M[ch] || '').includes(s) ? on : off; g.fill(); }
        g.restore(); cx += w + gap;
      }
      return cx;
    }
    function seg7w(str, hgt){ let w = 0; for (const ch of str) w += ch === '.' || ch === ',' ? hgt * 0.12 + hgt * 0.04 : hgt * 0.68; return w; }
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
    const gpu = countGPU(gl);
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
    // A recorder holds one piece of the street (CHUNK segments from segment c0): each vertex carries its segment's place
    // in the piece, and segStart where each segment's triangles begin (the piece is recorded far to near)
    class Rec {
      constructor(cap){ this.cap = cap || 4096; this.buf = new ArrayBuffer(this.cap * 32); this.views(); this.nv = 0; this.idx = new Uint32Array(this.cap * 2); this.ni = 0; this.c0 = 0; this.segStart = new Int32Array(CHUNK); }
      reset(c0){ this.nv = 0; this.ni = 0; this.c0 = c0; this.segStart.fill(0); }
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
      begin(i){ this.seg = i - this.c0; this.segStart[this.seg] = this.ni; }
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
      addTokens(); addPieces();
      atlasPack();
    }

    /* ================================================================ building the street, a piece at a time */
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
    // one segment's shapes, into the recorders R (the road, the decals on it, the buildings, and the signs, lamps and cables)
    function emitSeg(R, i){
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
    /* The street's shapes, a piece at a time. A street 15 km long, made whole, would need about 275 MB of the graphics
       chip, so only NCH pieces of CHUNK segments are kept there: the stretch from the camera on. The next piece ahead is
       recorded a millisecond a frame while the taxi drives; a piece the picture needs at once (the first ones, or after
       a jump) is recorded there and then. Each piece has its own buffers for the four kinds of shape. */
    const REC_KEYS = ['road', 'decal', 'bld', 'tr'], PIECE_MS = 1;
    const pieces = [];                          // NCH slots: { c: the piece's number along the street (-1: none), and per kind { vbo, ibo, vao, segStart, ni } }
    const maker = { c: -1, i: 0, R: null };    // the piece being recorded, and its next segment (recorded far to near)
    const streetBufs = new Set();               // the pieces' buffers, for the test page's count of graphics memory
    const streetCost = { buildMs: 0, planMs: 0, firstMs: 0, readyAt: 0, shownAt: 0, pieceMs: 0, pieces: 0 };
    function buildStreet(){
      pieces.length = 0; streetBufs.clear();
      for (let s = 0; s < NCH; s++){
        const p = { c: -1 };
        for (const k of REC_KEYS){
          const vbo = gl.createBuffer(), ibo = gl.createBuffer();
          p[k] = { vbo, ibo, vao: makeVAO(vbo, ibo), segStart: new Int32Array(CHUNK), ni: 0 };
          gl.bindVertexArray(null); streetBufs.add(vbo); streetBufs.add(ibo);
        }
        pieces.push(p);
      }
      maker.R = { road: new Rec(1 << 11), decal: new Rec(1 << 9), bld: new Rec(1 << 14), tr: new Rec(1 << 11) };
      maker.c = -1;
    }
    const pieceAt = c => { for (const p of pieces) if (p.c === c) return p; return null; };
    const pieceLen = c => Math.min(CHUNK, N_SEG - c * CHUNK);
    function startPiece(c){ maker.c = c; maker.i = c * CHUNK + pieceLen(c) - 1; for (const k of REC_KEYS) maker.R[k].reset(c * CHUNK); }
    // records the piece under way until performance.now() passes `until`; once it is whole, it goes to the graphics chip
    // in a slot whose piece is not wanted (keep(c): whether piece c is one of those from the camera on)
    function recordPiece(until, keep){
      const c0 = maker.c * CHUNK, t0 = performance.now();
      while (maker.i >= c0){ emitSeg(maker.R, maker.i--); if (performance.now() > until) break; }
      streetCost.pieceMs += performance.now() - t0;
      if (maker.i >= c0) return;
      const slot = pieces.find(p => p.c < 0) || pieces.find(p => !keep(p.c)) || pieces[0];
      for (const k of REC_KEYS){
        const r = maker.R[k], d = slot[k];
        gl.bindBuffer(gl.ARRAY_BUFFER, d.vbo); gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(r.buf, 0, r.nv * 32), gl.DYNAMIC_DRAW);
        gl.bindVertexArray(d.vao); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, r.idx.subarray(0, r.ni), gl.DYNAMIC_DRAW); gl.bindVertexArray(null);
        d.segStart.set(r.segStart); d.ni = r.ni;
      }
      slot.c = maker.c; maker.c = -1; streetCost.pieces++;
    }
    // before a picture from segment `base`: the pieces it needs, made now if they are missing; then, once a frame
    // (ahead: the picture on screen), a millisecond of the next piece ahead that is not made yet
    function streetPieces(base, ahead){
      const c0 = Math.floor(base / CHUNK), need = Math.floor((base + DRAW - 1) / CHUNK) - c0 + 1;
      const keep = c => ((c - c0) % N_CHUNK + N_CHUNK) % N_CHUNK < NCH;
      for (let j = 0; j < need; j++){
        const c = (c0 + j) % N_CHUNK; if (pieceAt(c)) continue;
        if (maker.c !== c) startPiece(c);
        recordPiece(Infinity, keep);
      }
      if (!ahead) return;
      if (maker.c >= 0 && !keep(maker.c)) maker.c = -1;
      if (maker.c < 0) for (let j = need; j < NCH; j++){ const c = (c0 + j) % N_CHUNK; if (!pieceAt(c)){ startPiece(c); break; } }
      if (maker.c >= 0) recordPiece(performance.now() + PIECE_MS, keep);
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
    // the bay's ring, a picture made once per colour, laid on the finished street before the taxi and faded by uA
    const FS_RING = `#version 300 es
    precision mediump float; uniform sampler2D uTex; uniform float uA; in vec2 vUV; out vec4 o;
    void main(){ o = texture(uTex, vUV) * uA; }`;
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
      P.comp = program(VS_FULL, FS_COMP); P.cab = program(VS_CAB, FS_CAB); P.ring = program(VS_CAB, FS_RING);
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
      if (T.zone){ gl.deleteFramebuffer(T.zone.f); gl.deleteTexture(T.zone.t); T.zone = null; if (zone) zone.snap = false; }
    }
    // an off-screen copy of the picture, for the extra drawings while the test page times a frame
    function extraTarget(){
      if (!T.extra){ const t = tex2D(PW, PH, gl.LINEAR), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); T.extra = { t, f }; }
      return T.extra.f;
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
      // the street's pieces: what lies on the road now, far to near; what stands in it goes with the traffic below
      collectPieces(st);
      groundList.sort((a, b) => b.rel - a.rel);
      dynBegin('ground'); for (const e of groundList) e.emit(); dynEnd('ground');
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
      pedsNear(st.pos, st.pos + 95 * SEG, p => { const rel = (p.z - st.pos + TRACK) % TRACK; if (rel < 1800 || rel > 95 * SEG) return; pedList.push(p); p._rel = rel; });
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
      // the other vehicles, the power-ups and the standing pieces, far to near: the vehicles (and the pieces like them) in runs
      // kept out of the glow, the power-ups lit like signs
      runs.length = 0;
      const order = carList.map(it => ({ car: it, rel: it.rel })).concat(tokList.map(q => ({ tok: q, rel: q.rel })), pieceList.map(e => ({ piece: e, rel: e.rel }))).sort((a, b) => b.rel - a.rel);
      const soft = atlas.items.get('glow:soft');
      for (const o of order){
        const mode = o.car ? 1 : o.piece ? o.piece.mode : 0, last = runs[runs.length - 1];
        if (!last || last[2] !== mode) runs.push([dyn.nv / 4, 0, mode]);
        if (o.piece){
          const e = o.piece, p = spot(st, e.z, e.xm, 0);
          if (p) e.emit(p);
        } else if (o.car){
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
      if (T.cab) for (const v of T.cab) for (const k of ['body', 'bodyHired', 'low', 'mask', 'lit', 'hm', 'mirror']) if (v[k]) gl.deleteTexture(v[k]);
      for (const k in rings){ gl.deleteTexture(rings[k].tex); delete rings[k]; }   // the bay's ring follows the taxi's size
      const cg = cabGeometry();
      T.cab = CAB_OFFS.map(off => {
        const s = bakeVehicle('taxi', 0, off, cg.zc / UPM, CAM_H / UPM, Math.round(cg.rw * RS * 1.1), 'NW 4183', true);
        const low = cropCanvas(s.low), lit = cropCanvas(s.lit), hm = cropCanvas(s.litHM), mk2 = packMasks(s), mir = makeMirrorSmall(s);
        return { pxW: s.pxW, ax: s.ax, ay: s.ay, w: s.c.width, h: s.c.height, lamps: s.lamps,
          body: texFrom(s.c, true), bodyHired: s.hired ? texFrom(s.hired, true) : null, low: texFrom(low.c, true), lowR: low.r, lit: texFrom(lit.c, true), litR: lit.r, hm: texFrom(hm.c, true), hmR: hm.r,
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
    // one kind of shape (k: 'road', 'decal', 'bld' or 'tr') for the DRAW segments from `base` on, piece by piece, far to
    // near; uBase tells the vertex shader where each piece starts against the camera
    function drawStatic(k, base){
      const c0 = Math.floor(base / CHUNK), last = base + DRAW - 1;
      for (let j = Math.floor(last / CHUNK) - c0; j >= 0; j--){
        const cu = c0 + j, p = pieceAt(cu % N_CHUNK); if (!p) continue;
        const r = p[k], start = cu * CHUNK, a = Math.max(0, base - start), b = Math.min(pieceLen(cu % N_CHUNK) - 1, last - start);
        const s0 = r.segStart[b], s1 = a > 0 ? r.segStart[a - 1] : r.ni;
        if (b < a || s1 <= s0) continue;
        gl.uniform1i(P.world.u.uBase, base - start);
        gl.bindVertexArray(r.vao); gl.drawElements(gl.TRIANGLES, s1 - s0, gl.UNSIGNED_INT, s0 * 4);
      }
    }
    function drawDyn(name){ const [q0, nq] = ranges[name]; if (nq) gl.drawElements(gl.TRIANGLES, nq * 6, gl.UNSIGNED_INT, q0 * 24); }
    function drawRuns(p){ for (const [q0, nq, mode] of runs){ if (!nq) continue; gl.uniform1i(p.u.uMode, mode); gl.drawElements(gl.TRIANGLES, nq * 6, gl.UNSIGNED_INT, q0 * 24); } gl.uniform1i(p.u.uMode, 0); }
    function bindT(unit, target, t){ gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(target, t); }
    function fullscreen(p, fbo, w, h){ gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, w, h); gl.useProgram(p.p); gl.bindVertexArray(fullVAO); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    // out: the framebuffer the finished picture goes to (the screen when left out; an off-screen copy while timing a frame)
    function renderGL(st, out){
      const base = Math.floor(st.pos / SEG) % N_SEG;
      streetPieces(base, !out);
      if (!out) viewPos = st.pos;
      project(st);
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
      gl.depthMask(true); useWorld(st, base); drawStatic('road', base);
      gl.depthMask(false); drawStatic('decal', base);
      gl.useProgram(pd.p); gl.bindVertexArray(dynVAO); drawDyn('ground'); drawDyn('streaks');
      gl.depthMask(true); gl.useProgram(P.world.p); drawStatic('bld', base);
      gl.depthMask(false); gl.depthFunc(gl.LEQUAL);
      gl.useProgram(pd.p); gl.bindVertexArray(dynVAO); drawDyn('peds');
      gl.useProgram(P.world.p); drawStatic('tr', base);
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
      drawBayRing(st);
      drawShieldRing(st);
      drawCabGL(st);
    }
    /* 保's ring (TaxiMarks, design system v11): while 保 is held, the design system's hud.shieldRing, drawn once into a
       picture (again after a resize) and laid on the road before the taxi each frame, as the bay's ring is, so the taxi
       hides its middle and its rear bumper and number plate stay clear. It steps aside while the bay's ring shows. */
    function drawShieldRing(st){
      const c = st.carry;
      if (!c || !c.shield || !(st.ringA < 1)) return;
      const cg = cabGeometry();
      if (!rings.shield){
        // canvas pixels: s per metre at the taxi's rear; the ring's middle, as shieldRing places it, in the picture's middle
        const s = cg.rw / VEH.taxi.W * RS, half = 0.9 * s, rx = half * 1.75, ry = half * 0.75, cy = -half * 1.05 + ry, pad = 4;
        const cv = mk(2 * rx + 2 * pad, 2 * ry + 2 * pad), g = cv.getContext('2d'), ax = rx + pad, ay = ry + pad - cy;
        hud.shieldRing(g, ax, ay, s);
        rings.shield = { tex: texFrom(cv, true), x0: -ax / RS, y0: -ay / RS, w: cv.width / RS, h: cv.height / RS };
      }
      const r = rings.shield, x0 = W / 2 + sway(st) + r.x0, y0 = cg.gy + r.y0;
      gl.bindBuffer(gl.ARRAY_BUFFER, cabVBO); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, 0, 0, x0 + r.w, y0, 1, 0, x0 + r.w, y0 + r.h, 1, 1, x0, y0 + r.h, 0, 1]), gl.DYNAMIC_DRAW);
      const p = P.ring; gl.useProgram(p.p); gl.bindVertexArray(cabVAO);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      bindT(0, gl.TEXTURE_2D, r.tex); gl.uniform1i(p.u.uTex, 0); gl.uniform2f(p.u.uView, W, H); gl.uniform1f(p.u.uA, 1 - st.ringA);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
      gl.disable(gl.BLEND);
    }
    /* The bay's ring (StopZone): once three-quarters of the taxi is in the bay, a ring of the bay's light on the road round
       the taxi. The design system's hud.bayRing draws it, with three soft blurs, so it is drawn once per colour (and again
       after a resize) into a picture of the road round the taxi, then laid on the finished street each frame before the
       taxi, so the taxi hides what is under it. It is light, so it takes no grain; it moves with the taxi's sway. */
    const rings = {};   // per tube colour: { tex, x0, y0, w, h } in picture pixels, x0 from the taxi's middle
    function bakeRing(tube){
      // the street's pt(d, x, y) round the taxi: d metres ahead of its rear bumper, x metres across from its middle, y up
      const cg = cabGeometry(), pt = (d, x, y) => { const s = DEPTH / (cg.zc + d * UPM); return { x: s * x * UPM * K, y: H * HZ + s * (CAM_H - y * UPM) * K }; };
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (let i = 0; i < 48; i++){ const a = i / 48 * Math.PI * 2, q = pt(2.3 + Math.sin(a) * 3.4, Math.cos(a) * 1.45, 0); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
      x0 -= 40; y0 -= 40; x1 += 40; y1 += 40;   // room for the widest blur
      const c = mk((x1 - x0) * RS, (y1 - y0) * RS), g = c.getContext('2d');
      g.setTransform(RS, 0, 0, RS, -x0 * RS, -y0 * RS);
      hud.bayRing(g, pt, 0, tube, 1);   // laneX 0: round the taxi's middle, wherever it is across the road
      return { tex: texFrom(c, true), x0, y0, w: x1 - x0, h: y1 - y0 };
    }
    function drawBayRing(st){
      if (!(st.ringA > 0.001)) return;
      const tube = st.ringKind === 'dropoff' ? 'tube-pink' : 'tube-teal', r = rings[tube] || (rings[tube] = bakeRing(tube));
      const x = W / 2 + sway(st) + r.x0, y = r.y0;
      gl.bindBuffer(gl.ARRAY_BUFFER, cabVBO); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x, y, 0, 0, x + r.w, y, 1, 0, x + r.w, y + r.h, 1, 1, x, y + r.h, 0, 1]), gl.DYNAMIC_DRAW);
      const p = P.ring; gl.useProgram(p.p); gl.bindVertexArray(cabVAO);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      bindT(0, gl.TEXTURE_2D, r.tex); gl.uniform1i(p.u.uTex, 0); gl.uniform2f(p.u.uView, W, H); gl.uniform1f(p.u.uA, st.ringA);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
      gl.disable(gl.BLEND);
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
      bindT(0, gl.TEXTURE_2D, st.hired && N.bodyHired ? N.bodyHired : N.body); gl.uniform1i(p.u.uLow, 0);   // hired: the roof sign out
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
    // The canvas reaches 390 picture pixels up from the picture's foot (HUDY = 150): room over the meter for the caption's
    // round line and the receipt slip at their phone sizes, where their smallest lettering makes them taller
    const HUDY = 150, HUDW = 300, HUDC = { red: '#ff3b26', off: '#2b0e08', lab: '#d9c7a3' };
    // the meter is drawn at 82.5% of its round 9 size (Barney, 28 October: 75%, then 10% larger than that), shrunk towards its bottom-left corner; the district name keeps its size
    const MS = 0.825, meterT = g => g.setTransform(RS * MS, 0, 0, RS * MS, RS * 14 * (1 - MS), RS * ((H - 14) * (1 - MS) - HUDY));
    let hudBase = null, hudBaseLives = false, hudKey = '', labK = 1;
    const glyphs = new Map();
    function hudLayout(){
      hudC.width = Math.round(HUDW * RS); hudC.height = Math.round((H - HUDY) * RS);
      hudC.style.top = (HUDY / H * 100) + '%'; hudC.style.width = (HUDW / W * 100) + '%'; hudC.style.height = ((H - HUDY) / H * 100) + '%';
      // on phones the row labels grow to at least phone-label-min, 10 CSS px; the meter keeps its place and size
      labK = env.touch ? Math.max(1, 10 / (11 * MS * env.cssScale())) : 1;
      hudBase = null; hudKey = ''; glyphs.clear();
    }
    // lives: Grunge City Rider's meter (Meter: has-lives), 16 wider, with lives in the heading and the tip sharing the time's row
    function hudGeom(lives){ const w = lives ? 226 : 210, rowH = [80, 50, 50], faceH = rowH[0] + rowH[1] + rowH[2] + 10, head = 34, border = 9, outerW = w + border * 2, outerH = faceH + head + border * 2, ox = 14, oy = H - 14 - outerH; return { w, rowH, faceH, outerW, outerH, ox, oy, x: ox + border, y: oy + border + head }; }
    const PAIR = { label: 16, digits: 24.65, h: 21.8 };   // the shared row: each label's baseline, then its digits' top and height, from the row's top
    function drawHudBase(lives){
      const c = mk(hudC.width, hudC.height), g = c.getContext('2d'), G = hudGeom(lives);
      meterT(g);
      // the meter set into a lightbox sign, like the shop signs
      g.save(); g.shadowColor = 'rgba(255,226,170,0.8)'; g.shadowBlur = 20 * MS; g.fillStyle = '#070504'; rr(g, G.ox - 4, G.oy - 4, G.outerW + 8, G.outerH + 8, 10); g.fill(); g.restore();
      const gr = g.createLinearGradient(0, G.oy, 0, G.oy + G.outerH); gr.addColorStop(0, '#f6e5ba'); gr.addColorStop(0.35, '#fff4d8'); gr.addColorStop(1, '#ead39f');
      g.fillStyle = gr; rr(g, G.ox, G.oy, G.outerW, G.outerH, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; rr(g, G.ox + 2.5, G.oy + 2.5, G.outerW - 5, G.outerH - 5, 6); g.stroke();
      hudText(g, '的士', G.ox + 14, G.oy + 27, 23, 900, F.zhSerif, '#a8140c');
      // with lives, 的士 and TAXI METER sit together on the left, 8 apart, and the lives take the right (drawn with the numbers)
      if (lives) hudText(g, 'TAXI METER', G.ox + 14 + g.measureText('的士').width + 8, G.oy + 25, 16, 700, F.cond, '#a8140c', 'left', 2.5);
      else hudText(g, 'TAXI METER', G.ox + G.outerW - 14, G.oy + 25, 16, 700, F.cond, '#a8140c', 'right', 2.5);
      g.fillStyle = 'rgba(8,5,3,0.96)'; rr(g, G.x, G.y, G.w, G.faceH, 4); g.fill();
      const L0 = G.x + 18, R0 = G.x + G.w - 18, lab = HUDC.lab;
      const label = (yy, zh, en) => { hudText(g, zh, L0, yy, 13 * labK, 700, F.zhSans, lab); hudText(g, en, L0 + zh.length * 14 * labK + 6, yy - 1, 11 * labK, 600, F.plex, lab, 'left', labK); };
      const labelEnd = (yy, zh, en) => { hudText(g, en, R0, yy - 1, 11 * labK, 600, F.plex, lab, 'right', labK); const ew = g.measureText(en).width; hudText(g, zh, R0 - ew - 6 * labK, yy, 13 * labK, 700, F.zhSans, lab, 'right'); };   // the gap grows with the labels, as the Meter's CSS has it
      const rule = yy => { g.fillStyle = '#2a1d12'; g.fillRect(G.x + 14, yy, G.w - 28, 1); };
      let yy = G.y + 8;
      label(yy + 18, '車資', 'FARE  HK$'); yy += G.rowH[0]; rule(yy);
      if (lives){ label(yy + PAIR.label, '小費', 'TIP'); labelEnd(yy + PAIR.label, '時間', 'TIME'); }
      else label(yy + 30, '時間', 'TIME');
      yy += G.rowH[1]; rule(yy);
      label(yy + 30, '速度', 'KM/H');
      hudBase = c; hudBaseLives = lives;
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
      for (const ch of val){ const e = glyph(ch, dh); g.drawImage(e.c, cx - e.m, y - e.m, e.c.width / (RS * MS), e.c.height / (RS * MS)); cx += ch === '.' || ch === ',' ? dh * 0.12 + dh * 0.04 : dh * 0.68; }
    }
    /* m: the fare (HK$), the time and the km/h (numbers, or null for unlit places), the district and the caption's fade
       (0 to 1); and for Grunge City Rider's meter, lives (0 to 3; null for today's meter), the tip (HK$; null unlit, 'lost'
       dashes), the round and the fares done in this zone, and the receipt slip { id, o, show, a } or null */
    function drawHUD(m){
      const dist = DISTRICTS[m.d], a = clamp(m.a, 0, 1), lives = m.lives != null, rc = m.receipt;
      // six places, so the meter holds at 999.99 (a seventh place is for a game's rules to decide: the Meter README)
      const fare = Math.min(999.99, Math.round((+m.fare || 0) * 100) / 100).toFixed(2);
      const time = m.time == null ? '  ' : String(clamp(Math.ceil(m.time), 0, 99)).padStart(2, '0'), kmh = m.kmh == null ? '   ' : String(clamp(Math.round(m.kmh), 0, 999));
      // the tip, four places: unlit with no passenger aboard (a comma is an unlit point), dashes once it is lost
      const tip = m.tip === 'lost' ? '-.--' : m.tip == null ? ' ,  ' : clamp(+m.tip || 0, 0, 9.99).toFixed(2);
      const show = rc ? clamp(rc.show, 0, 1) : 0, ra = rc ? clamp(rc.a, 0, 1) : 0;
      const key = [fare, time, kmh, m.d, a.toFixed(2), lives ? clamp(m.lives | 0, 0, 3) : '', tip, m.round, m.fares, rc ? rc.id : '', show.toFixed(3), ra.toFixed(2)].join('|');
      if (key === hudKey) return;
      hudKey = key;
      if (!hudBase || hudBaseLives !== lives) drawHudBase(lives);
      const g = hctx, G = hudGeom(lives);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, hudC.width, hudC.height); g.drawImage(hudBase, 0, 0);
      meterT(g);
      const L0 = G.x + 18, R0 = G.x + G.w - 18; let yy = G.y + 8;
      hudDigits(g, fare.padStart(6, ' '), R0, yy + 28, 40); yy += G.rowH[0];
      if (lives){
        // lives at the heading's right, 14 in, as the Meter preview has them; then TIP on the left and TIME on the right
        const lw = 3 * 15.5 * 1.3 + 2 * 15.5 * 0.22;
        hud.lives(g, G.ox + G.outerW - 14 - lw, G.oy + 21 - 15.5 / 2, 15.5, clamp(m.lives | 0, 0, 3));
        hudDigits(g, tip, L0 + seg7w(tip, PAIR.h), yy + PAIR.digits, PAIR.h);
        hudDigits(g, time, R0, yy + PAIR.digits, PAIR.h);
      } else hudDigits(g, time, R0, yy + 11, 28);
      yy += G.rowH[1];
      hudDigits(g, kmh.padStart(3, ' '), R0, yy + 11, 28);
      // the caption (the design system's, with the round line when there is a round), stepping aside while a receipt shows;
      // then the receipt slip printed up out of the meter. k: canvas pixels per 720-line pixel; mm: canvas pixels per CSS pixel
      g.setTransform(1, 0, 0, 1, 0, 0);
      const k = RS * 0.75, mm = RS / env.cssScale(), top = (H - 14 - G.outerH * MS - HUDY) * RS;
      hud.caption(g, (G.ox + 2) * RS, top, k, mm, { zh: dist.zh, en: dist.en, round: m.round == null ? null : m.round, fares: clamp(m.fares | 0, 0, 5), a: a * (1 - show * ra) });
      if (rc && show > 0 && ra > 0){ g.globalAlpha = ra; hud.receipt(g, G.ox * RS + 24 * k, top - 4 * k, k, mm, rc.o, show); g.globalAlpha = 1; }
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
      // the people walk where the camera can see them (from the last picture drawn), turning back 30 m from where they started
      pedsNear(viewPos - 60 * UPM, viewPos + (DRAW + 40) * SEG, p => {
        if (!p.speed) return;
        p.z = (p.z + p.dir * p.speed * dt + TRACK) % TRACK; p.phase = (p.phase + p.speed * dt / 240) % 4;
        const off = ((p.z - p.z0) % TRACK + TRACK * 1.5) % TRACK - TRACK / 2;
        if (off * p.dir > PED_ROAM) p.dir = -p.dir;
      });
      if (!reduceMotion){
        amb.flick.next -= dt;
        if (amb.flick.next <= 0){ if (amb.flick.on){ amb.flick.on = 0; amb.flick.next = 0.07 + Math.random() * 0.06; } else { amb.flick.on = 1; amb.flick.next = 0.45 + Math.random() * 1.8; } }
      } else amb.flick.on = 1;
      amb.grainT += dt; amb.t += dt;
    }

    // traffic spread over the TRAFFIC_SPAN from z0 (street units), each car in a lane at its own speed (the speed test's)
    function makeTraffic(n, seed, z0){
      const r = rng(seed || 808), list = [];
      for (let k = 0; k < n; k++){
        const p = r(), kind = p < 0.4 ? 'taxi' : p < 0.65 ? 'sedan' : p < 0.85 ? 'van' : 'minibus';
        list.push({ z: ((z0 || 0) + (k / n) * TRAFFIC_SPAN + r() * 2000) % TRACK, x: LANES[k % 3], speed: 2600 + r() * 2400, kind, tone: Math.floor(r() * TONES[kind]) });
      }
      return list;
    }
    // keeps traffic in the TRAFFIC_SPAN round `at` (street units): a car more than an eighth of it behind goes round to the
    // far end, and one beyond the far end comes back, as the old 560 m street's lap did
    function recycle(list, at, unit){
      const span = TRAFFIC_SPAN / unit, track = TRACK / unit, back = span / 8;
      for (const c of list){
        if (!c) continue;
        const rel = (((+c.z || 0) - at) % track + track * 1.5) % track - track / 2;
        if (rel < -back) c.z = (+c.z + span) % track; else if (rel > span - back) c.z = ((+c.z - span) % track + track) % track;
      }
      return list;
    }

    /* ---- the title's street: the speed test's drive, eased off to about 38 km/h, steering round the traffic itself */
    const DEMO_SPEED = 4200;
    const demo = { pos: 30 * SEG, trip: 0, x: 0, tx: 0, speed: DEMO_SPEED, brake: 0, accel: 0, hold: 0, sky: 0, lean: 0, moving: true, cars: [], tokens: [] };
    function demoStep(dt){
      const st = demo, cars = st.cars;
      st.pos = (st.pos + st.speed * dt) % TRACK; st.trip += st.speed * dt;
      for (const c of cars) c.z = (c.z + c.speed * dt) % TRACK;
      recycle(cars, st.pos, 1);
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
      taxi: { z: 0, x: 0, speed: 0 }, cars: [], tokens: [], obstacles: [], animals: [], stop: null, pin: null,
      lanes: LANES.slice(), length: TRACK / UPM, width: ROAD * 2 / UPM,
      districts: DISTRICTS.map((d, i) => ({ index: i, zh: d.zh, en: d.en, z: i * DIST_M, length: DIST_M })),
      traffic: (n, seed) => makeTraffic(n == null ? 16 : n, seed, wrapU((+api.taxi.z || 0) * UPM)).map(c => ({ z: c.z / UPM, x: c.x, speed: c.speed / UPM, kind: c.kind, tone: c.tone })),
      recycle: list => recycle(Array.isArray(list) ? list : [], +api.taxi.z || 0, UPM),
      place: o => { o = o || {}; if (o.z != null) api.taxi.z = +o.z || 0; if (o.x != null){ api.taxi.x = +o.x || 0; placed = true; } },
      gap: (from, to) => { const L = TRACK / UPM; return (((to - from) % L) + L) % L; },
      size: kind => { const p = PIECE_SIZE[kind]; if (p) return { width: p[0], length: p[1] }; const v = VEH[kind] || VEH.taxi; return { width: v.W, length: v.L }; },
      district: z => { const d = DISTRICTS[Math.floor(wrapU(z * UPM) / SEG / DIST_LEN) % DISTRICTS.length], i = DISTRICTS.indexOf(d); return { index: i, zh: d.zh, en: d.en }; },
      crash: (z, x) => { popAsk = { z: z * UPM, x: clamp(+x || 0, -1.2, 1.2) }; },
      safe: (z, x) => { safeAsk = { z: z * UPM, x: clamp(+x || 0, -1.2, 1.2) }; },
      // the signs beside the street from z0 to z1 (metres, round the lap), to name a destination after: [{ zh, en, z, side }]
      signs: (z0, z1) => {
        const out = [], a = Math.floor(wrapU((+z0 || 0) * UPM) / SEG), n = clamp(Math.ceil(((+z1 || 0) - (+z0 || 0)) * UPM / SEG), 0, N_SEG - 1);
        for (let k = 0; k <= n; k++){
          const i = (a + k) % N_SEG, sg = segs[i], z = i * SEG / UPM;
          for (const s of sg.signs) out.push({ zh: s.t.zh, en: s.t.en || '', z, side: s.side });
          for (let side = 0; side < 2; side++){
            const wd = sg.wall[side]; if (!wd) continue;
            for (const f of wd.b.fsigns) if (f.k0 === wd.k) out.push({ zh: f.t.zh, en: f.t.en || '', z, side: side ? 1 : -1 });
          }
        }
        return out;
      }
    };
    // lives, tip, round and fares: Grunge City Rider's meter and caption (left as they are, today's meter and caption)
    const meter = { time: null, speed: null, lives: null, tip: null, round: null, fares: 0 };
    const run = { x: 0, speed: 0, brake: 0, accel: 0, lean: 0, sky: 0, trip: 0, moving: false, cars: [], tokens: [], pos: 0, cap: { d: -1, t: 0 }, ringA: 0, ringKind: 'pickup', hired: false, carry: null };
    let placed = false;   // street.place moved the taxi across: no lean from it
    // the receipt slip: what it says (o), how long it has been out (t), and a number for each new one (id)
    let slip = null, slipN = 0;
    // receipt-time: up, held, back in (seconds; hud is defined further down, so read when needed)
    const SLIP = { get in(){ return hud.times.receiptIn; }, get hold(){ return hud.times.receiptHold; }, get out(){ return hud.times.receiptOut; } };
    function receipt(o){
      if (!o || !Array.isArray(o.lines)) return;
      // a new slip replaces the one showing: one already out stays out and holds again
      const out = slip && slip.t >= SLIP.in && slip.t < SLIP.in + SLIP.hold;
      // a game names the red line by its colour, 'receipt-red' (the build forbids bare colour names in games); the design
      // system's receipt() calls the style 'red'
      slip = { o: { head: o.head, lines: o.lines.map(l => { const c = l.slice(); if (c[3] === 'receipt-red') c[3] = 'red'; return c; }) }, t: out ? SLIP.in : 0, id: ++slipN };
    }
    // how far the slip is out (0 to 1) and its opacity; under Reduce motion it fades in and out where it stands
    function slipNow(){
      if (!slip) return null;
      const t = slip.t, e = u => u * u * (3 - 2 * u);
      const f = t < SLIP.in ? e(t / SLIP.in) : t < SLIP.in + SLIP.hold ? 1 : 1 - e(clamp((t - SLIP.in - SLIP.hold) / SLIP.out, 0, 1));
      return reduceMotion ? { id: slip.id, o: slip.o, show: 1, a: f } : { id: slip.id, o: slip.o, show: f, a: 1 };
    }
    function reset(){
      api.taxi = { z: 0, x: 0, speed: 0 }; api.cars = []; api.tokens = []; api.obstacles = []; api.animals = []; api.stop = null; api.pin = null;
      meter.time = null; meter.speed = null; meter.lives = null; meter.tip = null; meter.round = null; meter.fares = 0; placed = false;
      Object.assign(run, { x: 0, speed: 0, brake: 0, accel: 0, lean: 0, sky: 0, trip: 0, moving: false, cap: { d: -1, t: 0 }, ringA: 0, ringKind: 'pickup', hired: false, carry: null });
      pop = null; popAsk = null; popLast = ''; slip = null; safe = null; safeAsk = null; zone = null;
      hudKey = ''; clearPop(); clearMarks();
    }
    // one step of play, after the game's own: the street's life, then the taxi's motion from how the game moved it
    function step(dt){
      ambientStep(dt);
      const tx = api.taxi || {}, v = (+tx.speed || 0) * UPM, x = clamp(+tx.x || 0, -1.2, 1.2), zu = wrapU((+tx.z || 0) * UPM);
      const dec = (run.speed - v) / dt;
      const want = tx.brake == null || tx.brake === false ? clamp((dec - 350) / 2000, 0, 1) : clamp(tx.brake === true ? 1 : +tx.brake || 0, 0, 1);
      run.brake = lerp(run.brake, want, Math.min(1, dt * 10));
      run.accel = lerp(run.accel, clamp(-dec / 1500, 0, 1), Math.min(1, dt * 4));
      if (placed){ run.x = x; placed = false; }
      run.lean = lerp(run.lean, clamp((x - run.x) / dt * 0.6, -1, 1), Math.min(1, dt * 6));
      run.x = x; run.speed = v; run.moving = v > 40; run.trip += v * dt;
      run.sky -= segs[Math.floor(zu / SEG) % N_SEG].curve * v * dt * 0.0000016;
      // the district caption fades in over 0.6 s when the taxi enters a district, and stays
      const d = Math.floor(zu / SEG / DIST_LEN) % DISTRICTS.length;
      if (d !== run.cap.d){ run.cap.d = d; run.cap.t = 0; }
      run.cap.t += dt;
      if (pop) pop.t += dt;
      if (safe) safe.t += dt;
      if (zone) zoneStep(dt);
      if (slip){ slip.t += dt; if (slip.t >= SLIP.in + SLIP.hold + SLIP.out) slip = null; }
      // the bay's ring fades in while the game says the taxi is in the bay (stop.ring), and out once it says not (ring-fade)
      const sp = api.stop && typeof api.stop === 'object' ? api.stop : null;
      run.ringA = clamp(run.ringA + (sp && sp.ring ? 1 : -1) * dt / hud.times.ringFade, 0, 1);
      if (sp && (sp.kind === 'pickup' || sp.kind === 'dropoff')) run.ringKind = sp.kind;
      boltStep(dt);
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
      run.obstacles = Array.isArray(api.obstacles) ? api.obstacles : [];
      run.animals = Array.isArray(api.animals) ? api.animals : [];
      run.stop = api.stop && typeof api.stop === 'object' ? api.stop : null;
      run.hired = !!api.taxi.hired; run.carry = api.taxi.carry && typeof api.taxi.carry === 'object' ? api.taxi.carry : null;
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

    /* ---- the crash pop: CRASH!, SMASH! or BANG! lit on a cloud of smoke right over the crash, gone within a second (CrashPop)
       The drawings (POP) and the code that draws them (drawCrashPop) are the design system's (components/bundle.js),
       copied unchanged but for popCol, so the game shows what the design system's preview shows. They are slow to draw
       (13 to 18 layers, up to 15 glows), so each word is drawn once into its own canvas at the window's size, when the
       street is built (while the title screen shows) and after a resize; a pop is then that canvas drawn with a scale
       and an opacity. */
    /* ---- Crash pop: the smoke cloud (Barney, 29 October 2026) ----
       crashPop holds the three drawings as layers: units are pixels on a 720-line window, the origin is the pop's centre,
       colours are token names. drawCrashPop draws one with Canvas 2D: no image files, the fonts must already be loaded
       (Bangers 400, Noto Sans TC 700). Draw each word once into its own canvas at the size needed and reuse it. */
    var POP = {"about":"City Nights crash pop, the smoke cloud (Barney, 29 October 2026). Units are pixels on a 720-line window; the origin is the pop's centre. Colours are token names.","box":[-540,-350,1080,700],"glow":[4,13],"words":{"crash":{"word":"CRASH!","layers":[{"k":"halo","cx":0,"cy":0,"rx":430,"ry":290,"color":"sodium","alpha":0.34},{"k":"smoke","d":"M-16 -190A83 83 0 0 1 124 -167A70 70 0 0 1 218 -136A69 69 0 0 1 283 -49A44 44 0 0 1 279 19A39 39 0 0 1 259 78A76 76 0 0 1 158 141A69 69 0 0 1 45 175A51 51 0 0 1 -45 170A108 108 0 0 1 -197 146A55 55 0 0 1 -266 84A37 37 0 0 1 -280 32A52 52 0 0 1 -262 -54A71 71 0 0 1 -199 -131A51 51 0 0 1 -140 -173A85 85 0 0 1 -16 -190 Z","grad":{"cx":1.5,"cy":-25.75,"rx":337.8,"ry":219}},{"k":"tube","color":"face-cream","core":"ink-white","width":8,"coreWidth":2,"paths":["M-16 -190A83 83 0 0 1 124 -167A70 70 0 0 1 218 -136A69 69 0 0 1 283 -49A44 44 0 0 1 279 19A39 39 0 0 1 259 78A76 76 0 0 1 158 141A69 69 0 0 1 45 175A51 51 0 0 1 -45 170A108 108 0 0 1 -197 146A55 55 0 0 1 -266 84A37 37 0 0 1 -280 32A52 52 0 0 1 -262 -54A71 71 0 0 1 -199 -131A51 51 0 0 1 -140 -173A85 85 0 0 1 -16 -190 Z"],"box":[-341,-283,360,286]},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-170 -110A40 40 0 0 1 -100 -128","M120 -140A44 44 0 0 1 190 -110","M-190 110A38 38 0 0 0 -128 138","M150 138A40 40 0 0 0 210 102"],"box":[-232,-188,254,182]},{"k":"smoke","d":"M-317 -106A22 22 0 0 1 -283 -98A17 17 0 0 1 -278 -76A15 15 0 0 1 -295 -55A19 19 0 0 1 -329 -54A22 22 0 0 1 -350 -75A14 14 0 0 1 -344 -97A17 17 0 0 1 -317 -106 ZM323 -120A28 28 0 0 1 362 -112A16 16 0 0 1 371 -85A16 16 0 0 1 348 -66A30 30 0 0 1 304 -66A24 24 0 0 1 279 -87A18 18 0 0 1 293 -108A24 24 0 0 1 323 -120 ZM-288 122A20 20 0 0 1 -259 136A15 15 0 0 1 -258 159A25 25 0 0 1 -290 168A20 20 0 0 1 -318 157A15 15 0 0 1 -319 133A20 20 0 0 1 -288 122 ZM290 154A24 24 0 0 1 322 164A16 16 0 0 1 325 187A15 15 0 0 1 303 203A16 16 0 0 1 276 202A16 16 0 0 1 256 185A14 14 0 0 1 260 165A23 23 0 0 1 290 154 ZM0 -248A24 24 0 0 1 33 -236A16 16 0 0 1 33 -212A25 25 0 0 1 0 -200A22 22 0 0 1 -33 -212A17 17 0 0 1 -30 -235A19 19 0 0 1 0 -248 Z","grad":{"cx":10.5,"cy":-45.05,"rx":432.6,"ry":270.6}},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-317 -106A22 22 0 0 1 -283 -98A17 17 0 0 1 -278 -76A15 15 0 0 1 -295 -55A19 19 0 0 1 -329 -54A22 22 0 0 1 -350 -75A14 14 0 0 1 -344 -97A17 17 0 0 1 -317 -106 ZM323 -120A28 28 0 0 1 362 -112A16 16 0 0 1 371 -85A16 16 0 0 1 348 -66A30 30 0 0 1 304 -66A24 24 0 0 1 279 -87A18 18 0 0 1 293 -108A24 24 0 0 1 323 -120 ZM-288 122A20 20 0 0 1 -259 136A15 15 0 0 1 -258 159A25 25 0 0 1 -290 168A20 20 0 0 1 -318 157A15 15 0 0 1 -319 133A20 20 0 0 1 -288 122 ZM290 154A24 24 0 0 1 322 164A16 16 0 0 1 325 187A15 15 0 0 1 303 203A16 16 0 0 1 276 202A16 16 0 0 1 256 185A14 14 0 0 1 260 165A23 23 0 0 1 290 154 ZM0 -248A24 24 0 0 1 33 -236A16 16 0 0 1 33 -212A25 25 0 0 1 0 -200A22 22 0 0 1 -33 -212A17 17 0 0 1 -30 -235A19 19 0 0 1 0 -248 Z"],"box":[-376,-276,394,223]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":5,"coreWidth":2,"paths":["M350 -204 A50 50 0 1 0 450 -204 A50 50 0 1 0 350 -204 Z","M378 -204 A22 22 0 1 0 422 -204 A22 22 0 1 0 378 -204 Z","M394 -204 A6 6 0 1 0 406 -204 A6 6 0 1 0 394 -204 Z","M450 -204L460 -204","M443 -179L452 -174","M425 -161L430 -152","M400 -154L400 -144","M375 -161L370 -152","M357 -179L348 -174","M350 -204L340 -204","M357 -229L348 -234","M375 -247L370 -256","M400 -254L400 -264","M425 -247L430 -256","M443 -229L452 -234","M421 -197L442 -191","M400 -182L401 -160","M379 -197L358 -190","M387 -222L374 -239","M413 -222L425 -240"],"box":[295,-269,505,-139]},{"k":"tube","color":"face-cream","core":"ink-white","width":3,"coreWidth":1,"paths":["M338 -158L290 -126","M352 -136L308 -106","M328 -178L280 -152","M-400 -148L-350 -124","M-408 -114L-360 -96","M370 60L326 52","M374 88L330 84","M-378 110L-338 96","M-372 138L-334 130"],"box":[-411,-181,377,141]},{"k":"tube","color":"tube-teal","core":"tube-core-teal","width":5,"coreWidth":2,"paths":["M-454 -214L-433 -204L-466 -194L-427 -184L-460 -174L-421 -164L-454 -154L-415 -144L-448 -134L-409 -124L-442 -114L-403 -104"],"box":[-471,-219,-398,-99]},{"k":"tube","color":"tube-pink","core":"tube-core-pink","width":4,"coreWidth":1,"paths":["M435 80 L416 97 L391 90 L385 64 L404 47 L429 54 Z","M400 72 A10 10 0 1 0 420 72 A10 10 0 1 0 400 72 Z","M-382 112 L-395 130 L-417 128 L-426 108 L-413 90 L-391 92 Z","M-412 110 A8 8 0 1 0 -396 110 A8 8 0 1 0 -412 110 Z","M231 -254 L220 -248 L210 -254 L209 -266 L220 -272 L230 -266 Z","M215.5 -260 A4.5 4.5 0 1 0 224.5 -260 A4.5 4.5 0 1 0 215.5 -260 Z"],"box":[-430,-276,439,134]},{"k":"tube","color":"tube-teal","core":"tube-core-teal","width":5,"coreWidth":2,"paths":["M-430 218L-372 190","M-378 178L-364 204","M-414 211L-408 223M-400 204L-394 216M-386 197L-380 209"],"box":[-435,173,-359,228]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":4,"coreWidth":1,"paths":["M-212 -276 L-210 -263 L-198 -260 L-209 -254 L-209 -242 L-218 -251 L-229 -246 L-224 -257 L-232 -267 L-219 -265 Z","M462 -70 L469 -58 L483 -60 L474 -49 L481 -36 L468 -42 L458 -32 L459 -46 L446 -52 L460 -56 Z","M-68 215 L-68 227 L-58 231 L-69 234 L-70 246 L-77 236 L-88 238 L-81 229 L-86 220 L-76 223 Z"],"box":[-236,-280,487,250]},{"k":"tag","x":240,"y":-160,"r":34,"ring":"tube-red","core":"tube-core-red","width":4,"coreWidth":1,"char":"轟","size":38,"baseline":13,"charStroke":1.2,"box":[202,-198,278,-122]},{"k":"letters","outline":18,"outlineColor":"case","depth":[9,11],"face":["pop-crash-light","tube-yellow","pop-crash-deep"],"faceStops":[0,0.5,1],"faceBox":[-0.883,0.181],"edge":"tube-red","edgeWidth":3,"edgeCore":"tube-core-red","edgeCoreWidth":1,"letters":[{"ch":"C","x":-223,"y":106,"rotate":-12,"size":184},{"ch":"R","x":-155,"y":95,"rotate":-12,"size":194},{"ch":"A","x":-77,"y":85,"rotate":-11,"size":204},{"ch":"S","x":2,"y":77,"rotate":-10,"size":214},{"ch":"H","x":85,"y":70,"rotate":-10,"size":226},{"ch":"!","x":175,"y":64,"rotate":-9,"size":238}],"box":[-263,-214,393.5,210.4]}]},"smash":{"word":"SMASH!","layers":[{"k":"halo","cx":0,"cy":0,"rx":430,"ry":290,"color":"sodium","alpha":0.34},{"k":"smoke","d":"M-6 -160A76 76 0 0 1 110 -168A90 90 0 0 1 228 -119A45 45 0 0 1 282 -58A46 46 0 0 1 313 13A47 47 0 0 1 288 81A63 63 0 0 1 205 134A47 47 0 0 1 127 154A95 95 0 0 1 -11 171A80 80 0 0 1 -128 168A52 52 0 0 1 -212 143A55 55 0 0 1 -292 89A60 60 0 0 1 -296 -3A40 40 0 0 1 -292 -69A45 45 0 0 1 -238 -112A66 66 0 0 1 -144 -160A84 84 0 0 1 -6 -160 Z","grad":{"cx":8.5,"cy":-15.45,"rx":365.4,"ry":203.4}},{"k":"tube","color":"face-cream","core":"ink-white","width":8,"coreWidth":2,"paths":["M-6 -160A76 76 0 0 1 110 -168A90 90 0 0 1 228 -119A45 45 0 0 1 282 -58A46 46 0 0 1 313 13A47 47 0 0 1 288 81A63 63 0 0 1 205 134A47 47 0 0 1 127 154A95 95 0 0 1 -11 171A80 80 0 0 1 -128 168A52 52 0 0 1 -212 143A55 55 0 0 1 -292 89A60 60 0 0 1 -296 -3A40 40 0 0 1 -292 -69A45 45 0 0 1 -238 -112A66 66 0 0 1 -144 -160A84 84 0 0 1 -6 -160 Z"],"box":[-364,-266,368,274]},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-188 -94A42 42 0 0 1 -114 -110","M136 -122A42 42 0 0 1 202 -92","M-170 120A36 36 0 0 0 -110 142","M130 142A38 38 0 0 0 192 114"],"box":[-234,-168,248,184]},{"k":"smoke","d":"M-335 -29A19 19 0 0 1 -309 -22A16 16 0 0 1 -299 1A17 17 0 0 1 -323 16A18 18 0 0 1 -351 15A18 18 0 0 1 -372 1A12 12 0 0 1 -365 -20A22 22 0 0 1 -335 -29 ZM343 -18A22 22 0 0 1 376 -8A16 16 0 0 1 387 17A21 21 0 0 1 364 35A23 23 0 0 1 331 35A20 20 0 0 1 304 17A15 15 0 0 1 313 -8A21 21 0 0 1 343 -18 ZM-220 -222A19 19 0 0 1 -194 -209A12 12 0 0 1 -194 -191A18 18 0 0 1 -218 -180A18 18 0 0 1 -246 -188A14 14 0 0 1 -246 -213A20 20 0 0 1 -220 -222 ZM229 177A18 18 0 0 1 258 187A16 16 0 0 1 259 210A21 21 0 0 1 231 222A20 20 0 0 1 199 213A17 17 0 0 1 198 190A23 23 0 0 1 229 177 Z","grad":{"cx":7.5,"cy":-22.2,"rx":455.4,"ry":266.4}},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-335 -29A19 19 0 0 1 -309 -22A16 16 0 0 1 -299 1A17 17 0 0 1 -323 16A18 18 0 0 1 -351 15A18 18 0 0 1 -372 1A12 12 0 0 1 -365 -20A22 22 0 0 1 -335 -29 ZM343 -18A22 22 0 0 1 376 -8A16 16 0 0 1 387 17A21 21 0 0 1 364 35A23 23 0 0 1 331 35A20 20 0 0 1 304 17A15 15 0 0 1 313 -8A21 21 0 0 1 343 -18 ZM-220 -222A19 19 0 0 1 -194 -209A12 12 0 0 1 -194 -191A18 18 0 0 1 -218 -180A18 18 0 0 1 -246 -188A14 14 0 0 1 -246 -213A20 20 0 0 1 -220 -222 ZM229 177A18 18 0 0 1 258 187A16 16 0 0 1 259 210A21 21 0 0 1 231 222A20 20 0 0 1 199 213A17 17 0 0 1 198 190A23 23 0 0 1 229 177 Z"],"box":[-394,-246,412,247]},{"k":"tube","color":"face-cream","core":"ink-white","width":3,"coreWidth":1,"paths":["M-234 -114L-249 -134L-271 -143L-304 -160","M233 -115L260 -122L272 -150L292 -160","M299 67L340 67L384 77L429 96","M-255 113L-293 139L-321 147L-349 152","M7 184L14 211L4 230L5 263","M-9 -172L-17 -207L-22 -244L-27 -261","M-317 22L-359 20L-386 15L-430 12"],"box":[-433,-264,432,266]},{"k":"tube","color":"face-cream","core":"ink-white","width":3,"coreWidth":1,"paths":["M320 -154L287 -138","M394 -27L358 -25","M352 137L318 124","M-331 -130L-298 -117","M-402 24L-366 21","M-312 164L-280 147","M107 -218L91 -186","M-105 -212L-89 -179","M282 218L253 196","M481 -151L447 -140"],"box":[-405,-221,484,221]},{"k":"tube","color":"tube-teal","core":"tube-core-teal","width":4,"coreWidth":1,"paths":["M414 -176 L341 -162 L360 -214 Z","M444 3 L397 -25 L469 -45 Z","M359 179 L389 132 L435 159 Z","M-359 -170 L-381 -116 L-417 -165 Z","M-426 50 L-466 24 L-445 1 Z","M-364 208 L-394 171 L-327 159 L-313 189 Z","M152 -245 L108 -231 L110 -271 Z","M-138 -231 L-121 -261 L-93 -232 Z","M321 259 L294 248 L290 220 L334 234 Z","M514 -149 L494 -172 L524 -170 Z"],"box":[-470,-275,528,263]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":5,"coreWidth":2,"paths":["M-472 -210 A40 40 0 1 0 -392 -210 A40 40 0 1 0 -472 -210 Z","M-459 -210 A27 27 0 1 0 -405 -210 A27 27 0 1 0 -459 -210 Z","M-444 -242L-428 -214L-442 -196L-426 -172","M-428 -214L-398 -218"],"box":[-517,-255,-347,-165]},{"k":"tube","color":"ink-white","core":"ink-white","width":2.5,"coreWidth":1,"paths":["M506 -174L506 -146M492 -160L520 -160M500 -166L512 -154M500 -154L512 -166","M-340 78L-340 102M-352 90L-328 90M-345 85L-335 95M-345 95L-335 85","M0 227L0 253M-13 240L13 240M-6 234L6 246M-6 246L6 234","M370 -281L370 -259M359 -270L381 -270M365 -275L375 -265M365 -265L375 -275","M-490 -90L-490 -70M-500 -80L-480 -80M-494 -84L-486 -76M-494 -76L-486 -84"],"box":[-502.5,-283.5,522.5,255.5]},{"k":"tag","x":-240,"y":-148,"r":34,"ring":"tube-yellow","core":"tube-core-yellow","width":4,"coreWidth":1,"char":"啪","size":38,"baseline":13,"charStroke":1.2,"box":[-278,-186,-202,-110]},{"k":"letters","outline":18,"outlineColor":"case","depth":[9,11],"face":["pop-smash-light","tube-red","pop-smash-deep"],"faceStops":[0,0.35,1],"faceBox":[-0.883,0.181],"edge":"tube-yellow","edgeWidth":3,"edgeCore":"tube-core-yellow","edgeCoreWidth":1,"letters":[{"ch":"S","x":-235,"y":108,"rotate":-11,"size":178},{"ch":"M","x":-166,"y":98,"rotate":-10,"size":188},{"ch":"A","x":-62,"y":89,"rotate":-10,"size":198},{"ch":"S","x":15,"y":81,"rotate":-9,"size":208},{"ch":"H","x":96,"y":75,"rotate":-9,"size":220},{"ch":"!","x":183,"y":70,"rotate":-8,"size":236}],"box":[-275,-206,400,210.3]}]},"bang":{"word":"BANG!","layers":[{"k":"halo","cx":0,"cy":0,"rx":440,"ry":300,"color":"sodium","alpha":0.34},{"k":"fill","color":"tube-red","alpha":0.16,"paths":["M-219 -103Q-308 -133 -410 -131Q-329 -83 -243 -46","M-71 -187Q-107 -248 -177 -294Q-163 -222 -137 -156","M124 -163Q159 -231 160 -312Q103 -253 57 -188","M239 -55Q325 -85 395 -147Q301 -136 211 -113","M223 93Q314 118 418 110Q334 62 247 25","M94 173Q128 219 192 247Q179 190 155 138","M-162 133Q-211 186 -229 259Q-165 216 -111 167","M-248 20Q-321 34 -384 82Q-306 86 -231 78"]},{"k":"tube","color":"tube-red","core":"tube-core-red","width":6,"coreWidth":2,"paths":["M-219 -103Q-308 -133 -410 -131Q-329 -83 -243 -46","M-71 -187Q-107 -248 -177 -294Q-163 -222 -137 -156","M124 -163Q159 -231 160 -312Q103 -253 57 -188","M239 -55Q325 -85 395 -147Q301 -136 211 -113","M223 93Q314 118 418 110Q334 62 247 25","M94 173Q128 219 192 247Q179 190 155 138","M-162 133Q-211 186 -229 259Q-165 216 -111 167","M-248 20Q-321 34 -384 82Q-306 86 -231 78"],"box":[-416,-318,424,265]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":4,"coreWidth":1,"paths":["M-225 -88Q-283 -101 -342 -109Q-288 -88 -237 -60","M-87 -179Q-118 -214 -149 -247Q-130 -208 -121 -164","M107 -169Q121 -214 133 -260Q108 -219 74 -182","M232 -70Q282 -95 331 -123Q276 -107 218 -99","M229 76Q288 84 348 91Q293 71 241 42","M109 164Q137 189 167 212Q149 182 140 147","M-150 142Q-174 178 -194 217Q-162 186 -124 158","M-244 34Q-287 50 -329 70Q-283 63 -235 63"],"box":[-346,-264,352,221]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":4,"coreWidth":1,"paths":["M-349 -156A420 280 0 0 1 -155 -260","M204 -267A450 300 0 0 1 384 -157","M367 151A430 288 0 0 1 214 250","M-206 263A446 296 0 0 1 -382 153"],"dash":[26,14],"box":[-832,-571,838,563]},{"k":"halo","cx":0,"cy":0,"rx":430,"ry":290,"color":"sodium","alpha":0.34},{"k":"smoke","d":"M-11 -201A71 71 0 0 1 109 -195A77 77 0 0 1 205 -134A73 73 0 0 1 262 -34A63 63 0 0 1 266 56A54 54 0 0 1 213 122A80 80 0 0 1 111 171A96 96 0 0 1 -21 189A85 85 0 0 1 -142 176A48 48 0 0 1 -190 125A82 82 0 0 1 -275 43A53 53 0 0 1 -270 -38A60 60 0 0 1 -223 -129A98 98 0 0 1 -104 -194A59 59 0 0 1 -11 -201 Z","grad":{"cx":-4.5,"cy":-25.5,"rx":324.6,"ry":234}},{"k":"tube","color":"face-cream","core":"ink-white","width":8,"coreWidth":2,"paths":["M-11 -201A71 71 0 0 1 109 -195A77 77 0 0 1 205 -134A73 73 0 0 1 262 -34A63 63 0 0 1 266 56A54 54 0 0 1 213 122A80 80 0 0 1 111 171A96 96 0 0 1 -21 189A85 85 0 0 1 -142 176A48 48 0 0 1 -190 125A82 82 0 0 1 -275 43A53 53 0 0 1 -270 -38A60 60 0 0 1 -223 -129A98 98 0 0 1 -104 -194A59 59 0 0 1 -11 -201 Z"],"box":[-365,-300,343,293]},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-154 -120A40 40 0 0 1 -84 -140","M108 -144A44 44 0 0 1 176 -114","M-174 110A38 38 0 0 0 -112 136","M132 130A40 40 0 0 0 192 96"],"box":[-216,-192,236,178]},{"k":"smoke","d":"M-287 -135A22 22 0 0 1 -258 -122A15 15 0 0 1 -260 -97A22 22 0 0 1 -289 -86A17 17 0 0 1 -316 -100A13 13 0 0 1 -320 -121A22 22 0 0 1 -287 -135 ZM306 126A19 19 0 0 1 335 134A16 16 0 0 1 341 157A16 16 0 0 1 321 173A23 23 0 0 1 287 175A22 22 0 0 1 264 154A12 12 0 0 1 269 135A22 22 0 0 1 306 126 ZM-312 125A21 21 0 0 1 -283 134A15 15 0 0 1 -275 157A15 15 0 0 1 -294 170A23 23 0 0 1 -328 172A17 17 0 0 1 -345 155A11 11 0 0 1 -337 136A16 16 0 0 1 -312 125 Z","grad":{"cx":-2,"cy":4.5,"rx":411.6,"ry":186}},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-287 -135A22 22 0 0 1 -258 -122A15 15 0 0 1 -260 -97A22 22 0 0 1 -289 -86A17 17 0 0 1 -316 -100A13 13 0 0 1 -320 -121A22 22 0 0 1 -287 -135 ZM306 126A19 19 0 0 1 335 134A16 16 0 0 1 341 157A16 16 0 0 1 321 173A23 23 0 0 1 287 175A22 22 0 0 1 264 154A12 12 0 0 1 269 135A22 22 0 0 1 306 126 ZM-312 125A21 21 0 0 1 -283 134A15 15 0 0 1 -275 157A15 15 0 0 1 -294 170A23 23 0 0 1 -328 172A17 17 0 0 1 -345 155A11 11 0 0 1 -337 136A16 16 0 0 1 -312 125 Z"],"box":[-366,-161,361,202]},{"k":"tube","color":"tube-teal","core":"tube-core-teal","width":5,"coreWidth":2,"paths":["M370 150 A42 42 0 1 0 454 150 A42 42 0 1 0 370 150 Z","M400 150 A12 12 0 1 0 424 150 A12 12 0 1 0 400 150 Z","M425 155L447 165","M414 164L417 188","M401 158L382 173","M399 145L377 135","M410 136L407 112","M423 142L442 127"],"box":[323,103,501,197]},{"k":"tube","color":"face-cream","core":"ink-white","width":3,"coreWidth":1,"paths":["M360 180L320 190","M364 202L326 210","M356 158L318 166"],"box":[315,155,367,213]},{"k":"tube","color":"tube-pink","core":"tube-core-pink","width":4,"coreWidth":1,"paths":["M438 28L479 31","M400 133L448 149","M274 228L299 248","M135 287L151 322","M-73 299L-79 323","M-302 218L-329 237","M-368 152L-412 170","M-440 19L-483 21","M-401 -128L-431 -138","M-255 -234L-276 -254","M-81 -289L-87 -311","M98 -294L105 -314","M286 -228L306 -244","M386 -123L426 -135"],"box":[-487,-318,483,327]},{"k":"tube","color":"tube-pink","core":"tube-core-pink","width":4,"coreWidth":1,"paths":["M-406 -106 L-420 -91 L-439 -95 L-446 -114 L-432 -129 L-413 -125 Z","M-433 -110 A7 7 0 1 0 -419 -110 A7 7 0 1 0 -433 -110 Z","M459 -151 L445 -144 L432 -153 L433 -169 L447 -176 L460 -167 Z","M440 -160 A6 6 0 1 0 452 -160 A6 6 0 1 0 440 -160 Z"],"box":[-450,-180,464,-87]},{"k":"tube","color":"ink-white","core":"ink-white","width":2.5,"coreWidth":1,"paths":["M-380 26L-380 54M-394 40L-366 40M-386 34L-374 46M-386 46L-374 34","M480 -3L480 23M467 10L493 10M474 4L486 16M474 16L486 4","M0 -302L0 -278M-12 -290L12 -290M-5 -295L5 -285M-5 -285L5 -295"],"box":[-396.5,-304.5,495.5,56.5]},{"k":"tag","x":220,"y":-174,"r":34,"ring":"tube-teal","core":"tube-core-teal","width":4,"coreWidth":1,"char":"砰","size":38,"baseline":13,"charStroke":1.2,"box":[182,-212,258,-136]},{"k":"letters","outline":18,"outlineColor":"case","depth":[9,11],"face":["pop-bang-light","tube-pink","pop-bang-deep"],"faceStops":[0,0.4,1],"faceBox":[-0.883,0.181],"edge":"tube-teal","edgeWidth":3,"edgeCore":"tube-core-teal","edgeCoreWidth":1,"letters":[{"ch":"B","x":-204,"y":103,"rotate":-12,"size":200},{"ch":"A","x":-127,"y":91,"rotate":-11,"size":212},{"ch":"N","x":-45,"y":81,"rotate":-11,"size":224},{"ch":"G","x":47,"y":73,"rotate":-10,"size":236},{"ch":"!","x":153,"y":66,"rotate":-9,"size":252}],"box":[-244,-226,382,213]}]}}};
    // the kit's one change: a token name's colour comes from the kit's table (read from city-nights.css at the start), not from CSS
    function popCol(name) {
      if (name.charAt(0) === '#' || name.indexOf('rgb') === 0) return name;
      return col(name);
    }
    function popAlpha(c, a) {
      if (c.charAt(0) !== '#') return c;
      var n = parseInt(c.slice(1), 16);
      return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    var popScratch = null;
    // The neon glow: what draw() paints is copied back with two soft blurs (std. dev. glow[1], then glow[0]) and then sharp.
    // Only the layer's box (plus room for the blur) is copied, which keeps the cost down.
    function popGlow(ctx, scale, color, box, draw) {
      var c = ctx.canvas, m = ctx.getTransform(), pad = Math.ceil(3 * POP.glow[1] * scale) + 2;
      var xs = [], ys = [], k, px, py;
      for (k = 0; k < 4; k++) {
        px = k & 1 ? box[2] : box[0]; py = k & 2 ? box[3] : box[1];
        xs.push(m.a * px + m.c * py + m.e); ys.push(m.b * px + m.d * py + m.f);
      }
      var x0 = Math.max(0, Math.floor(Math.min.apply(null, xs)) - pad), y0 = Math.max(0, Math.floor(Math.min.apply(null, ys)) - pad);
      var x1 = Math.min(c.width, Math.ceil(Math.max.apply(null, xs)) + pad), y1 = Math.min(c.height, Math.ceil(Math.max.apply(null, ys)) + pad);
      if (x1 <= x0 || y1 <= y0) return;
      if (!popScratch) popScratch = document.createElement('canvas');
      if (popScratch.width < c.width || popScratch.height < c.height) { popScratch.width = c.width; popScratch.height = c.height; }
      var l = popScratch.getContext('2d'), w = x1 - x0, h = y1 - y0;
      l.setTransform(1, 0, 0, 1, 0, 0); l.clearRect(x0, y0, w, h);
      l.setTransform(m);
      draw(l);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowColor = color;
      ctx.shadowBlur = 2 * POP.glow[1] * scale; ctx.drawImage(popScratch, x0, y0, w, h, x0, y0, w, h);
      ctx.shadowBlur = 2 * POP.glow[0] * scale; ctx.drawImage(popScratch, x0, y0, w, h, x0, y0, w, h);
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.drawImage(popScratch, x0, y0, w, h, x0, y0, w, h);
      ctx.restore();
    }
    function popStroke(g, paths, color, width, dash) {
      g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash(dash || []);
      for (var i = 0; i < paths.length; i++) g.stroke(paths[i]);
      g.setLineDash([]);
    }
    function popPaths(list) { return list.map(function (d) { return new Path2D(d); }); }

    // drawCrashPop(ctx, word, x, y, scale): draws 'crash', 'smash' or 'bang' with its centre at x, y (canvas pixels)
    // at scale (canvas pixels per 720-line pixel). Its box is POP.box around the centre.
    function drawCrashPop(ctx, word, x, y, scale) {
      var W = POP.words[word];
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
      W.layers.forEach(function (L) {
        var grad, p;
        if (L.k === 'halo') {
          ctx.save(); ctx.translate(L.cx, L.cy); ctx.scale(L.rx, L.ry);
          grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
          grad.addColorStop(0, popAlpha(popCol(L.color), L.alpha)); grad.addColorStop(1, popAlpha(popCol(L.color), 0));
          ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (L.k === 'smoke') {
          p = new Path2D(L.d);
          ctx.fillStyle = popCol('neon-board'); ctx.fill(p);
          ctx.save(); ctx.clip(p); ctx.translate(L.grad.cx, L.grad.cy); ctx.scale(L.grad.rx, L.grad.ry);
          grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
          grad.addColorStop(0, popAlpha(popCol('face-cream'), 0.30)); grad.addColorStop(1, popAlpha(popCol('sodium'), 0.10));
          ctx.fillStyle = grad; ctx.fillRect(-3, -3, 6, 6); ctx.restore();
        } else if (L.k === 'fill') {
          ctx.fillStyle = popAlpha(popCol(L.color), L.alpha);
          popPaths(L.paths).forEach(function (q) { ctx.fill(q); });
        } else if (L.k === 'tube') {
          p = popPaths(L.paths);
          popGlow(ctx, scale, popCol(L.color), L.box, function (g) { popStroke(g, p, popCol(L.color), L.width, L.dash); });
          popStroke(ctx, p, popCol(L.core), L.coreWidth, L.dash);
        } else if (L.k === 'tag') {
          p = [new Path2D('M' + (L.x - L.r) + ' ' + L.y + ' A' + L.r + ' ' + L.r + ' 0 1 0 ' + (L.x + L.r) + ' ' + L.y + ' A' + L.r + ' ' + L.r + ' 0 1 0 ' + (L.x - L.r) + ' ' + L.y + ' Z')];
          ctx.fillStyle = popCol('neon-board'); ctx.fill(p[0]);
          popGlow(ctx, scale, popCol(L.ring), L.box, function (g) { popStroke(g, p, popCol(L.ring), L.width); });
          popStroke(ctx, p, popCol(L.core), L.coreWidth);
          popGlow(ctx, scale, popCol(L.core), L.box, function (g) {
            g.font = '700 ' + L.size + 'px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
            g.fillStyle = popCol(L.core); g.fillText(L.char, L.x, L.y + L.baseline);
            g.strokeStyle = popCol(L.ring); g.lineWidth = L.charStroke; g.lineJoin = 'round'; g.strokeText(L.char, L.x, L.y + L.baseline);
          });
        } else if (L.k === 'letters') {
          var each = function (g, fn) {
            L.letters.forEach(function (t) {
              g.save(); g.translate(t.x, t.y); g.rotate(t.rotate * Math.PI / 180);
              g.font = t.size + 'px Bangers, Impact, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
              fn(g, t); g.restore();
            });
          };
          var ink = popCol(L.outlineColor);
          // the dark extrusion, then the black comic outline
          each(ctx, function (g, t) {
            g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = L.outline; g.lineJoin = 'round';
            g.fillText(t.ch, L.depth[0], L.depth[1]); g.strokeText(t.ch, L.depth[0], L.depth[1]);
          });
          each(ctx, function (g, t) {
            g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = L.outline; g.lineJoin = 'round';
            g.fillText(t.ch, 0, 0); g.strokeText(t.ch, 0, 0);
          });
          // the lit face, light at the top of each letter's box (font ascent) to deep at its foot (descent)
          each(ctx, function (g, t) {
            var lg = g.createLinearGradient(0, L.faceBox[0] * t.size, 0, L.faceBox[1] * t.size);
            for (var i = 0; i < L.face.length; i++) lg.addColorStop(L.faceStops[i], popCol(L.face[i]));
            g.fillStyle = lg; g.fillText(t.ch, 0, 0);
          });
          // a thin glowing tube round each letter, with its core
          popGlow(ctx, scale, popCol(L.edge), L.box, function (g) {
            each(g, function (h, t) { h.strokeStyle = popCol(L.edge); h.lineWidth = L.edgeWidth; h.lineJoin = 'round'; h.strokeText(t.ch, 0, 0); });
          });
          each(ctx, function (g, t) { g.strokeStyle = popCol(L.edgeCore); g.lineWidth = L.edgeCoreWidth; g.lineJoin = 'round'; g.strokeText(t.ch, 0, 0); });
        }
      });
      ctx.restore();
    }

    const POP_TIME = 1;   // pop-time
    let pop = null, popAsk = null, popLast = '', popNext = null, popDrawn = false;
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
    // each word drawn once, into its own canvas; and how long the three took (ms) and their size, the last time they were drawn
    const popWords = {}, popMade = { ms: 0, width: 0, height: 0 };
    function drawPopWords(){
      const t0 = performance.now(), s = env.pop.height / 720;   // canvas pixels per pixel of a 720-line window
      const w = Math.round(POP.box[2] * s), h = Math.round(POP.box[3] * s), probe = mk(1, 1).getContext('2d', { willReadFrequently: true });
      for (const name in POP.words){
        const c = popWords[name] || (popWords[name] = document.createElement('canvas'));
        c.width = w; c.height = h;   // which also clears it
        drawCrashPop(c.getContext('2d'), name, w / 2, h / 2, s);
        probe.drawImage(c, 0, 0, 1, 1);
      }
      // reading a pixel back waits for the graphics chip to finish the drawing, so the time is the whole job
      probe.getImageData(0, 0, 1, 1);
      if (popScratch){ popScratch.width = 1; popScratch.height = 1; }   // the glows' scratch canvas, not needed until the next time
      Object.assign(popMade, { ms: performance.now() - t0, width: w, height: h });
    }
    function startPop(st){
      const ask = popAsk; popAsk = null;
      const names = Object.keys(POP.words).filter(n => n !== popLast);
      const name = POP.words[popNext] ? popNext : names[Math.floor(Math.random() * names.length)];
      popLast = name; popNext = null;
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
      const P = popWords[pop.name], cv = env.pop, g = cv.getContext('2d'), k = cv.width / W;
      if (!P) return;
      const alpha = keyed(f, reduceMotion ? POP_FADE : POP_ALPHA), sc = reduceMotion ? 1 : keyed(f, POP_SCALE);
      // pop-box, 810 x 525 picture pixels (1080 x 700 on a 720-line window), the same on phones as on computers: centred on
      // the crash and moved only as far as it needs to stay inside the picture (centred, in a picture narrower than it)
      const inside = (v, size, room) => (size >= room ? room / 2 : clamp(v, size / 2, room - size / 2));
      const bw = POP.box[2] * H / 720, bh = POP.box[3] * H / 720, w = P.width * sc, h = P.height * sc;
      const cx = inside(pop.x, bw, W) * k, cy = inside(pop.y, bh, H) * k;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = alpha;
      g.drawImage(P, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
      g.globalAlpha = 1;
      popDrawn = true;
    }

    /* ---- the street's pieces: obstacles, animals, the passenger and the stop bay (Obstacle, Animal, Passenger, StopZone)
       The design system's code (components/bundle.js), copied unchanged. It takes colours by token name through popCol, so
       from the kit's colour table. The kit makes its pictures once into the atlas (addPieces) and puts them on the street
       each frame (collectPieces), with the graphics chip. */
    /* ---- The street's pieces: obstacles, animals, passengers and the stop zone (Barney, 29 October 2026) ----
       Two kinds of drawing, both Canvas 2D with colours by token name:
       - pictures made once: the animals, the crate and the passengers (upright, drawn at ppm pixels per metre, with the
         point on the ground they stand on), and the road pictures (oil, pothole, the stop bay, the pool of light), whose top
         edge is the far end;
       - things with depth drawn in the street's own perspective: roadworks, cones and spilt cargo, through pt(d, x, y),
         which the game supplies: d metres ahead, x metres across from the road's centre, y metres up -> { x, y, s }
         in canvas pixels, s being pixels per metre there (null if it is out of sight).
       All true size (Barney, 29 October 2026). */
    var street = (function () {
      var PPM = 160;   // animal pictures: pixels per metre (their shapes are drawn in centimetres, 100 to the metre)
      var col = popCol, rgba = popAlpha;
      function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
      // a token colour lightened (k > 0, towards white) or darkened (k < 0, towards black): faces of a box lit from above
      function shade(name, k) {
        var c = col(name), n = parseInt(c.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
        var f = function (v) { return Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)); };
        return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
      }
      function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
      function blurred(src, px) { var c = mk(src.width, src.height), g = c.getContext('2d'); g.filter = 'blur(' + px + 'px)'; g.drawImage(src, 0, 0); return c; }
      function poly(g, pts) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.closePath(); }

      /* ---------- placing things in the street ---------- */
      // an upright picture standing at (d, x), facing the camera
      function stand(g, pt, spr, d, x, alpha) {
        var p = pt(d, x, 0); if (!p) return null;
        var k = p.s / spr.ppm;
        g.save(); if (alpha != null) g.globalAlpha = alpha;
        g.drawImage(spr.c, p.x - spr.ax * k, p.y - spr.ay * k, spr.c.width * k, spr.c.height * k); g.restore();
        return p;
      }
      // a picture lying flat on the road from d0 (near) to d1 (far), x0 to x1 across; drawn row by row so the perspective is true
      function decal(g, pt, tex, d0, d1, x0, x1, alpha, blend) {
        // rows meet on whole device pixels, so nothing is drawn twice (which would show as stripes in a blended glow)
        var rows = 160, m = g.getTransform(), ky = m.d || 1, oy = m.f || 0, snap = function (y) { return (Math.round(y * ky + oy) - oy) / ky; };
        g.save(); g.globalAlpha = alpha == null ? 1 : alpha; if (blend) g.globalCompositeOperation = blend;
        var start = 0, top = null;
        for (var i = 0; i < rows; i++) {
          var t0 = start / rows, t1 = (i + 1) / rows, da = d1 - (d1 - d0) * t0, db = d1 - (d1 - d0) * t1;
          var pa = pt(da, x0, 0), pb = pt(db, x0, 0), qa = pt(da, x1, 0), qb = pt(db, x1, 0);
          if (!pa || !pb || !qa || !qb) { start = i + 1; continue; }
          var y0 = snap(pa.y), y1 = snap(pb.y);
          if (y1 <= y0) continue;                                   // too thin yet: carry this row into the next
          var xa = (pa.x + pb.x) / 2, xb = (qa.x + qb.x) / 2;
          g.drawImage(tex, 0, tex.height * t0, tex.width, Math.max(1, tex.height * (t1 - t0)), xa, y0, xb - xa, y1 - y0);
          start = i + 1;
        }
        g.restore();
      }
      // a soft contact shadow under something w wide and l long, its near edge at d
      function shadow(g, pt, d, x, w, l, a) {
        for (var k = 3; k >= 1; k--) {
          var m = 0.06 * k, pts = [];
          for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2, p = pt(d + l / 2 + Math.sin(t) * (l / 2 + m), x + Math.cos(t) * (w / 2 + m), 0); if (!p) return; pts.push(p); }
          poly(g, pts); g.fillStyle = rgba(col('case'), (a || 0.3) * 0.33); g.fill();
        }
      }
      // a box: front, the side facing the camera, and the top, lit warm from above. faces = [top, front, side] colours.
      function box(g, pt, d, x, w, l, h, faces, o) {
        o = o || {};
        var x0 = x - w / 2, x1 = x + w / 2, d1 = d + l, cx = o.camX || 0;
        var top = [pt(d, x0, h), pt(d, x1, h), pt(d1, x1, h), pt(d1, x0, h)], front = [pt(d, x0, 0), pt(d, x1, 0), pt(d, x1, h), pt(d, x0, h)];
        if (top.concat(front).some(function (p) { return !p; })) return null;
        if (x0 > cx) { poly(g, [pt(d, x0, 0), pt(d1, x0, 0), pt(d1, x0, h), pt(d, x0, h)]); g.fillStyle = faces[2]; g.fill(); }
        if (x1 < cx) { poly(g, [pt(d, x1, 0), pt(d1, x1, 0), pt(d1, x1, h), pt(d, x1, h)]); g.fillStyle = faces[2]; g.fill(); }
        poly(g, front); g.fillStyle = faces[1]; g.fill(); if (o.front) o.front(front);
        poly(g, top); g.fillStyle = faces[0]; g.fill(); if (o.top) o.top(top);
        return { top: top, front: front };
      }

      /* ---------- ANIMALS: dark shapes lit warm by the shops behind, with the taxi's headlights caught in their eyes.
         Side-on, crossing, head turned to the taxi. run = the bolting stride. They always escape. ---------- */
      function silhouette(w, h, draw, eyes, anchor) {
        var pad = 20, sil = mk(w + pad * 2, h + pad * 2), sg = sil.getContext('2d');
        sg.translate(pad, pad); sg.fillStyle = '#000'; sg.strokeStyle = '#000'; sg.lineCap = 'round'; sg.lineJoin = 'round';
        sg.save(); sg.scale(PPM / 100, PPM / 100); draw(sg); sg.restore();
        var out = mk(sil.width, sil.height), g = out.getContext('2d');
        var tint = function (c) { var t = mk(sil.width, sil.height), tg = t.getContext('2d'); tg.drawImage(sil, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = c; tg.fillRect(0, 0, t.width, t.height); return t; };
        g.globalAlpha = 0.85; g.drawImage(tint(col('figure-rim')), 2, -3);      // rim light from the shops behind and above
        g.globalAlpha = 1; g.drawImage(tint(col('animal-dark')), 0, 0);
        var lit = tint(col('animal-lit')), lg = lit.getContext('2d');           // the taxi's lamps lifting the lower side
        lg.globalCompositeOperation = 'destination-in';
        var gr = lg.createLinearGradient(0, 0, 0, lit.height); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.75)'); lg.fillStyle = gr; lg.fillRect(0, 0, lit.width, lit.height);
        g.drawImage(lit, 0, 0);
        g.save(); g.translate(pad, pad); g.scale(PPM / 100, PPM / 100); eyes(g); g.restore();
        return { c: out, ppm: PPM, ax: pad + anchor[0] * PPM / 100, ay: pad + anchor[1] * PPM / 100 };
      }
      // eyeshine: steady, never flashing
      function eyes(g, pts, r, token) {
        var c = col(token);
        pts.forEach(function (p) {
          var R = r * 9, gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], R);
          gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(0.2, rgba(c, 0.55)); gr.addColorStop(1, rgba(c, 0));
          g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(p[0] - R, p[1] - R, R * 2, R * 2);
          g.globalCompositeOperation = 'source-over'; g.fillStyle = col('ink-white'); g.beginPath(); g.arc(p[0], p[1], r * 1.5, 0, Math.PI * 2); g.fill();
        });
      }
      function leg(g, x0, y0, x1, y1, w0, w1) {
        var a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
        g.beginPath(); g.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); g.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); g.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.closePath(); g.fill();
        g.beginPath(); g.arc(x1, y1, w1 / 2, 0, Math.PI * 2); g.fill();
      }
      // Wild boar: 1.4 m long, 0.9 m at the shoulder; bristly ridge, long snout, small tusks. Amber eyeshine.
      function boar(run) {
        return silhouette(1.85 * PPM, 1.15 * PPM, function (g) {
          g.beginPath(); g.moveTo(20, 52); g.bezierCurveTo(18, 30, 38, 20, 62, 18); g.bezierCurveTo(84, 14, 104, 10, 116, 22);
          g.bezierCurveTo(124, 30, 126, 44, 124, 58); g.bezierCurveTo(118, 70, 96, 72, 70, 70); g.bezierCurveTo(46, 70, 26, 68, 20, 52); g.fill();
          g.lineWidth = 2.2; for (var i = 0; i < 16; i++) { var x = 42 + i * 5, y = 17 - Math.sin(i / 15 * Math.PI) * 4; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 1.5, y - 4 - (i % 3)); g.stroke(); }
          g.beginPath(); g.moveTo(112, 22); g.bezierCurveTo(124, 18, 136, 28, 142, 40); g.lineTo(150, 52); g.bezierCurveTo(152, 58, 146, 62, 138, 60); g.bezierCurveTo(128, 58, 120, 56, 114, 50); g.closePath(); g.fill();
          g.beginPath(); g.ellipse(149, 55, 4.5, 6, 0.2, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.moveTo(118, 22); g.lineTo(122, 8); g.lineTo(128, 22); g.fill();
          g.beginPath(); g.moveTo(126, 25); g.lineTo(134, 13); g.lineTo(136, 28); g.fill();
          var legs = run ? [[34, 64, 14, 88], [48, 64, 58, 90], [100, 64, 82, 90], [114, 62, 138, 84]] : [[34, 64, 32, 92], [50, 66, 52, 92], [100, 66, 98, 92], [114, 64, 118, 92]];
          legs.forEach(function (q) { leg(g, q[0], q[1], q[2], q[3], 12, 6); });
          g.lineWidth = 2; g.beginPath(); g.moveTo(21, 40); g.quadraticCurveTo(10, 44, 12, 56); g.stroke();
        }, function (g) {
          g.fillStyle = col('chicken-light'); g.beginPath(); g.moveTo(139, 59); g.quadraticCurveTo(136, 52, 132, 50); g.lineTo(136, 58); g.fill();   // tusk
          eyes(g, [[131, 37], [138, 38]], 1.6, 'eyeshine-amber');
        }, [82, 92]);
      }
      // Stray dog: a Hong Kong village dog, 1 m long, 0.6 m tall; long muzzle, pricked ears, tail curled over the back.
      function dog(run) {
        return silhouette(1.2 * PPM, 0.8 * PPM, function (g) {
          g.beginPath(); g.moveTo(16, 30); g.bezierCurveTo(18, 22, 40, 22, 60, 21); g.bezierCurveTo(74, 20, 82, 22, 86, 30);
          g.bezierCurveTo(88, 40, 82, 48, 72, 48); g.bezierCurveTo(56, 46, 40, 42, 26, 42); g.bezierCurveTo(18, 41, 15, 37, 16, 30); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(74, 24); g.bezierCurveTo(78, 14, 84, 8, 92, 8); g.bezierCurveTo(98, 8, 101, 11, 104, 15);
          g.lineTo(116, 19); g.bezierCurveTo(119, 21, 118, 25, 114, 26); g.lineTo(100, 27); g.bezierCurveTo(94, 30, 88, 34, 86, 38); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(86, 10); g.lineTo(84, -3); g.lineTo(92, 7); g.fill();
          g.beginPath(); g.moveTo(92, 8); g.lineTo(94, -4); g.lineTo(99, 10); g.fill();
          var legs = run ? [[24, 38, 4, 58], [34, 40, 44, 64], [72, 40, 56, 64], [80, 40, 102, 56]] : [[22, 38, 21, 70], [32, 40, 34, 70], [72, 42, 71, 70], [80, 42, 84, 70]];
          legs.forEach(function (q) { leg(g, q[0], q[1], q[2], q[3], 9, 6); });
          g.lineWidth = 7; g.beginPath(); g.moveTo(18, 28); g.bezierCurveTo(6, 22, 8, 6, 20, 8); g.bezierCurveTo(28, 10, 28, 18, 22, 20); g.stroke();
        }, function (g) { eyes(g, [[94, 14], [100, 15]], 1.3, 'eyeshine-gold'); }, [58, 70]);
      }
      // Street cat: 0.5 m long, low and slim; round head, small ears, long tail held up. Big green eyeshine.
      function cat(run) {
        return silhouette(0.7 * PPM, 0.5 * PPM, function (g) {
          g.beginPath(); g.moveTo(12, 30); g.bezierCurveTo(12, 23, 24, 21, 36, 22); g.bezierCurveTo(44, 22, 48, 25, 48, 29); g.bezierCurveTo(47, 34, 36, 35, 24, 35); g.bezierCurveTo(16, 35, 12, 34, 12, 30); g.fill();
          g.beginPath(); g.arc(52, 22, 7.5, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.moveTo(46.5, 17); g.lineTo(47.5, 10.5); g.lineTo(51.5, 15.5); g.fill();
          g.beginPath(); g.moveTo(53, 15); g.lineTo(57.5, 10.5); g.lineTo(58.5, 18); g.fill();
          var legs = run ? [[16, 31, 5, 40], [21, 33, 25, 42], [40, 31, 33, 42], [45, 30, 55, 37]] : [[16, 32, 16, 43], [21, 33, 22, 43], [40, 32, 40, 43], [44, 31, 45, 43]];
          legs.forEach(function (q) { leg(g, q[0], q[1], q[2], q[3], 4, 3); });
          g.lineWidth = 3; g.beginPath(); g.moveTo(13, 28); g.bezierCurveTo(2, 26, 0, 12, 6, 4); g.bezierCurveTo(8, 1, 11, 2, 11, 5); g.stroke();
        }, function (g) { eyes(g, [[50, 21], [55.5, 21]], 1.1, 'eyeshine-green'); }, [32, 43]);
      }
      // Market chicken: a pale bird the taxi's lamps pick out, red comb. face 1 or -1 turns it round. Placed in threes by a crate.
      function chicken(run, face) {
        var pad = 10, c = mk(0.5 * PPM + pad * 2, 0.5 * PPM + pad * 2), g = c.getContext('2d');
        g.translate(pad, pad); g.scale(PPM / 100, PPM / 100); if (face < 0) { g.translate(50, 0); g.scale(-1, 1); }
        var body = function () { g.beginPath(); g.moveTo(8, 20); g.bezierCurveTo(4, 10, 14, 6, 20, 14); g.bezierCurveTo(26, 18, 32, 18, 34, 14); g.bezierCurveTo(36, 6, 44, 4, 46, 12);
          g.bezierCurveTo(48, 18, 46, 24, 42, 28); g.bezierCurveTo(36, 36, 18, 38, 12, 32); g.bezierCurveTo(8, 28, 8, 24, 8, 20); g.closePath(); };
        g.save(); g.translate(1, -2); body(); g.fillStyle = col('figure-rim'); g.fill(); g.restore();
        body(); var gr = g.createLinearGradient(0, 4, 0, 36); gr.addColorStop(0, col('chicken-light')); gr.addColorStop(1, col('chicken-shade')); g.fillStyle = gr; g.fill();
        g.fillStyle = col('chicken-wing'); g.beginPath(); g.moveTo(10, 22); g.bezierCurveTo(14, 16, 24, 20, 26, 28); g.bezierCurveTo(20, 30, 12, 28, 10, 22); g.fill();
        g.fillStyle = col('face-red'); g.beginPath(); g.moveTo(39, 6); g.lineTo(41, 1); g.lineTo(43, 5); g.lineTo(45, 1); g.lineTo(46, 7); g.closePath(); g.fill();
        g.beginPath(); g.ellipse(46, 17, 1.6, 3, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = col('chicken-beak'); g.beginPath(); g.moveTo(47, 11); g.lineTo(52, 13); g.lineTo(47, 14); g.fill();
        g.strokeStyle = col('chicken-beak'); g.lineWidth = 1.6; g.lineCap = 'round';
        (run ? [[22, 34, 16, 46], [30, 34, 36, 45]] : [[22, 34, 22, 46], [30, 34, 30, 46]]).forEach(function (q) { g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); g.stroke(); });
        g.fillStyle = col('ink-black'); g.beginPath(); g.arc(43.5, 10, 1.1, 0, Math.PI * 2); g.fill();
        return { c: c, ppm: PPM, ax: pad + 25 * PPM / 100, ay: pad + 46 * PPM / 100 };
      }
      // the market crate of split bamboo they came out of, tipped over
      function crate() {
        var w = 0.7 * PPM, h = 0.45 * PPM, c = mk(w + 20, h + 20), g = c.getContext('2d'); g.translate(10, 10);
        g.fillStyle = col('crate-dark'); g.fillRect(0, 0, w, h);
        g.strokeStyle = col('crate-cane'); g.lineWidth = 0.035 * PPM;
        for (var i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i / 8 * w, 0); g.lineTo(i / 8 * w, h); g.stroke(); }
        for (var j = 0; j <= 3; j++) { g.beginPath(); g.moveTo(0, j / 3 * h); g.lineTo(w, j / 3 * h); g.stroke(); }
        g.strokeStyle = col('figure-rim'); g.globalAlpha = 0.7; g.beginPath(); g.moveTo(0, 1); g.lineTo(w, 1); g.stroke();
        return { c: c, ppm: PPM, ax: 10 + w / 2, ay: 10 + h };
      }

      /* ---------- ROAD OBSTACLES ---------- */
      // Oil slick, 2.8 m across and 6.5 m along: darker than the wet road, with the neon caught in a thin rainbow sheen
      function oil(seed) {
        var W = 512, H = 900, c = mk(W, H), g = c.getContext('2d'), r = rnd(seed || 7), R = [];
        for (var i = 0; i < 14; i++) R.push(0.7 + r() * 0.34);
        var blob = function (gg, sc) {
          var n = R.length, pts = [], m = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
          for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; pts.push([W / 2 + Math.cos(t) * W * 0.44 * R[i] * sc, H / 2 + Math.sin(t) * H * 0.44 * R[i] * sc]); }
          gg.beginPath(); var p0 = m(pts[n - 1], pts[0]); gg.moveTo(p0[0], p0[1]);
          for (i = 0; i < n; i++) { var q = m(pts[i], pts[(i + 1) % n]); gg.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); } gg.closePath();
        };
        blob(g, 1); g.fillStyle = rgba(col('oil-dark'), 0.8); g.fill();
        var film = ['tube-pink', 'tube-yellow', 'tube-green', 'tube-blue', 'tube-violet', 'sodium'], lay = mk(W, H), lg = lay.getContext('2d');
        for (var k = 0; k < 12; k++) {
          lg.lineWidth = 26 + (k % 3) * 10; lg.strokeStyle = rgba(col(film[k % film.length]), 0.8);
          var cx = W * (0.3 + r() * 0.4), cy = H * (0.3 + r() * 0.4), rr = W * (0.1 + (k % 5) * 0.06);
          lg.beginPath(); lg.ellipse(cx, cy, rr, rr * (1.5 + r() * 0.8), r() * 3, r() * 2, r() * 2 + Math.PI * 1.3); lg.stroke();
        }
        g.save(); blob(g, 0.96); g.clip(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.6; g.drawImage(blurred(lay, 14), 0, 0); g.restore();
        var mask = mk(W, H), mg = mask.getContext('2d'); mg.filter = 'blur(12px)'; blob(mg, 0.97); mg.fillStyle = '#000'; mg.fill();
        g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, 0, 0); g.globalCompositeOperation = 'source-over';
        return c;
      }
      // Flooded pothole, 1.9 m across and 3.2 m along: a pale broken lip round rainwater that mirrors the lamps and the neon
      function pothole() {
        var W = 400, H = 560, c = mk(W, H), g = c.getContext('2d'), r = rnd(99), E = [];
        for (var i = 0; i < 34; i++) E.push(0.68 + r() * 0.32);
        var edge = function (sc) { g.beginPath(); for (var i = 0; i <= E.length; i++) { var t = i / E.length * Math.PI * 2, k = E[i % E.length]; var x = W / 2 + Math.cos(t) * W * 0.46 * k * sc, y = H / 2 + Math.sin(t) * H * 0.46 * k * sc; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); };
        edge(1.0); g.fillStyle = col('pothole-lip'); g.fill();
        edge(0.9); g.fillStyle = col('pothole-edge'); g.fill();
        edge(0.82); var gr = g.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, col('sodium')); gr.addColorStop(0.35, shade('sodium', -0.4)); gr.addColorStop(0.75, col('road-far')); gr.addColorStop(1, col('night-black'));
        g.fillStyle = gr; g.fill();
        g.save(); edge(0.82); g.clip();
        g.fillStyle = rgba(col('tube-pink'), 0.3); g.fillRect(W * 0.58, 0, W * 0.08, H);
        g.strokeStyle = rgba(col('face-cream'), 0.45); g.lineWidth = 4;
        [[150, 220, 46], [252, 320, 60], [180, 400, 34], [262, 180, 28]].forEach(function (q) { g.beginPath(); g.ellipse(q[0], q[1], q[2], q[2] * 0.75, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(q[0], q[1], q[2] * 0.5, q[2] * 0.38, 0, 0, Math.PI * 2); g.stroke(); });
        g.restore();
        g.fillStyle = shade('pothole-lip', 0.1);
        for (i = 0; i < 16; i++) { var t = r() * Math.PI * 2; g.fillRect(W / 2 + Math.cos(t) * W * 0.52 - 7, H / 2 + Math.sin(t) * H * 0.52 - 5, 12 + r() * 10, 8 + r() * 8); }
        return c;
      }
      // a traffic cone, 0.72 m: orange with two white bands
      function cone(g, pt, d, x) {
        var b0 = pt(d, x - 0.2, 0), b1 = pt(d, x + 0.2, 0), t0 = pt(d, x - 0.035, 0.72), t1 = pt(d, x + 0.035, 0.72);
        if (!b0 || !b1 || !t0 || !t1) return;
        shadow(g, pt, d - 0.2, x, 0.5, 0.4, 0.3);
        var bw = b1.x - b0.x;
        g.fillStyle = col('case'); g.fillRect(b0.x - bw * 0.15, b0.y - bw * 0.12, bw * 1.3, bw * 0.14);
        var gr = g.createLinearGradient(b0.x, 0, b1.x, 0); gr.addColorStop(0, shade('cone-orange', -0.28)); gr.addColorStop(0.45, col('cone-orange')); gr.addColorStop(1, shade('cone-orange', -0.45));
        g.beginPath(); g.moveTo(b0.x, b0.y - bw * 0.1); g.lineTo(b1.x, b1.y - bw * 0.1); g.lineTo(t1.x, t1.y); g.lineTo(t0.x, t0.y); g.closePath(); g.fillStyle = gr; g.fill();
        var L = function (a, b, t) { return a + (b - a) * t; };
        [[0.3, 0.42], [0.58, 0.68]].forEach(function (f) {
          g.beginPath(); g.moveTo(L(b0.x, t0.x, f[0]), L(b0.y, t0.y, f[0])); g.lineTo(L(b1.x, t1.x, f[0]), L(b0.y, t0.y, f[0]));
          g.lineTo(L(b1.x, t1.x, f[1]), L(b0.y, t0.y, f[1])); g.lineTo(L(b0.x, t0.x, f[1]), L(b0.y, t0.y, f[1])); g.closePath(); g.fillStyle = rgba(col('face-white'), 0.92); g.fill();
        });
      }
      // Roadworks closing one lane (lane centre x, barriers at d): four cones leading out from the kerb, three water-filled
      // barriers, red and white, 1.05 m each, with amber lamps, and a 道路工程 ROAD WORKS sign. lampsA: which pair is lit
      // (the lamps take turns, half a second each).
      function roadworks(g, pt, d, x, o) {
        o = o || {};
        var k = x < 0 ? -1 : 1, i;
        for (i = 0; i < 4; i++) cone(g, pt, d - 7 + i * 1.8, x + k * 1.35 - k * i * 0.75);
        var n = 3, bw = 1.05;
        for (i = 0; i < n; i++) {
          var bx = x - (n - 1) / 2 * bw + i * bw, red = i % 2 === 0, base = red ? 'face-red' : 'face-white';
          shadow(g, pt, d, bx, bw, 0.5, 0.35);
          box(g, pt, d, bx, bw - 0.04, 0.5, 0.95, red ? [shade(base, 0.2), col(base), shade(base, -0.3)] : [col(base), shade(base, -0.08), shade(base, -0.3)], { camX: o.camX, front: (function (red) { return function (q) {
            var a = q[0], b = q[1], t = q[3], h = a.y - t.y; g.fillStyle = red ? rgba(col('face-white'), 0.85) : rgba(col('face-red'), 0.9); g.fillRect(t.x + (b.x - a.x) * 0.08, t.y + h * 0.3, (b.x - a.x) * 0.84, h * 0.12);
          }; })(red) });
          var lp = pt(d + 0.25, bx, 1.08); if (!lp) continue;
          var on = o.lampsA === false ? i % 2 === 1 : i % 2 === 0, rad = 0.09 * lp.s, amber = col('lamp-amber');
          g.fillStyle = col('case'); g.fillRect(lp.x - rad * 0.8, lp.y + rad * 0.2, rad * 1.6, rad * 1.6);
          g.fillStyle = on ? shade('lamp-amber', 0.45) : shade('lamp-amber', -0.5); g.beginPath(); g.arc(lp.x, lp.y, rad, 0, Math.PI * 2); g.fill();
          if (on) { var gl = g.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, rad * 7); gl.addColorStop(0, rgba(amber, 0.75)); gl.addColorStop(1, rgba(amber, 0)); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(lp.x - rad * 7, lp.y - rad * 7, rad * 14, rad * 14); g.restore(); }
        }
        // the sign on its stand, ahead of the barriers: 1.45 m by 0.7 m, face-yellow, ink-black lettering
        var sx = x - (n * bw) / 2 + 0.35, sd = d - 1.2, l1 = pt(sd, sx - 0.04, 0), l2 = pt(sd, sx + 0.04, 1.05), r1 = pt(sd, sx + 1.21, 0);
        if (l1 && l2 && r1) { g.fillStyle = col('case'); g.fillRect(l1.x - 1, l2.y, 2, l1.y - l2.y); g.fillRect(r1.x - 1, l2.y, 2, l1.y - l2.y); }
        var tl = pt(sd, sx - 0.1, 1.55), br = pt(sd, sx + 1.35, 0.85);
        if (tl && br) {
          var w = br.x - tl.x, h = br.y - tl.y;
          g.fillStyle = col('case'); g.fillRect(tl.x - w * 0.04, tl.y - h * 0.06, w * 1.08, h * 1.12);
          var sg = g.createLinearGradient(0, tl.y, 0, br.y); sg.addColorStop(0, shade('face-yellow', 0.35)); sg.addColorStop(1, shade('face-yellow', -0.1)); g.fillStyle = sg; g.fillRect(tl.x, tl.y, w, h);
          g.fillStyle = col('ink-black'); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
          g.font = '900 ' + Math.min(h * 0.46, w * 0.88 / 4) + 'px "Noto Serif TC", serif'; g.fillText('道路工程', tl.x + w / 2, tl.y + h * 0.56);   // four characters, never wider than the face
          g.font = '700 ' + h * 0.26 + 'px Antonio, sans-serif'; if ('letterSpacing' in g) g.letterSpacing = (h * 0.03) + 'px'; g.fillText('ROAD WORKS', tl.x + w / 2, tl.y + h * 0.9); if ('letterSpacing' in g) g.letterSpacing = '0px';
          var yl = g.createRadialGradient(tl.x + w / 2, tl.y + h / 2, 0, tl.x + w / 2, tl.y + h / 2, w); yl.addColorStop(0, rgba(col('face-yellow'), 0.28)); yl.addColorStop(1, rgba(col('face-yellow'), 0));
          g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = yl; g.fillRect(tl.x - w / 2, tl.y - w / 2, w * 2, h + w); g.restore();
        }
      }
      // Spilt cargo across about 2.6 m of a lane (centre d, x): cardboard boxes off a lorry, marked 易碎, one burst open, oranges rolling
      function cargo(g, pt, d, x, o) {
        o = o || {};
        var card = [shade('cardboard', 0.22), col('cardboard'), shade('cardboard', -0.25)], red = col('ink-red');
        var label = function (q) { var a = q[0], b = q[1], t = q[3], w = b.x - a.x, h = a.y - t.y; if (w < 6) return;
          g.fillStyle = rgba(red, 0.85); g.font = '900 ' + h * 0.34 + 'px "Noto Serif TC", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('易碎', t.x + w / 2, t.y + h * 0.5);
          g.strokeStyle = rgba(red, 0.7); g.lineWidth = Math.max(0.6, w * 0.02); g.strokeRect(t.x + w * 0.18, t.y + h * 0.22, w * 0.64, h * 0.56); };
        var tape = function (q) { g.strokeStyle = col('parcel-tape'); g.lineWidth = Math.max(0.8, Math.abs(q[1].x - q[0].x) * 0.08); g.beginPath(); g.moveTo((q[0].x + q[1].x) / 2, (q[0].y + q[1].y) / 2); g.lineTo((q[2].x + q[3].x) / 2, (q[2].y + q[3].y) / 2); g.stroke(); };
        var r = rnd(5), i;
        for (i = 0; i < 16; i++) {   // oranges first: they are on the road
          var p = pt(d - 1.6 + r() * 3.2, x - 1.4 + r() * 2.6, 0.05); if (!p) continue; var rad = 0.06 * p.s;
          g.fillStyle = rgba(col('case'), 0.35); g.beginPath(); g.ellipse(p.x, p.y + rad * 0.9, rad * 1.1, rad * 0.35, 0, 0, Math.PI * 2); g.fill();
          var og = g.createRadialGradient(p.x - rad * 0.3, p.y - rad * 0.4, 0, p.x, p.y, rad); og.addColorStop(0, shade('fruit-orange', 0.4)); og.addColorStop(1, shade('fruit-orange', -0.15)); g.fillStyle = og; g.beginPath(); g.arc(p.x, p.y, rad, 0, Math.PI * 2); g.fill();
        }
        var boxes = [[d + 1.2, x + 0.9, 0.6, 0.5, 0.45, true], [d + 0.6, x - 0.7, 0.55, 0.55, 0.5, false], [d - 0.4, x + 0.2, 0.6, 0.6, 0.55, true], [d + 1.6, x - 1.1, 0.5, 0.45, 0.42, false]];
        boxes.sort(function (a, b) { return b[0] - a[0]; });
        boxes.forEach(function (q) { shadow(g, pt, q[0], q[1], q[2], q[3], 0.4); box(g, pt, q[0], q[1], q[2], q[3], q[4], card, { camX: o.camX, front: q[5] ? label : null, top: tape }); });
        var bd = d - 1.2, bx = x - 0.4; shadow(g, pt, bd, bx, 0.7, 0.5, 0.4);
        box(g, pt, bd, bx, 0.7, 0.5, 0.4, card, { camX: o.camX, front: function (q) { var a = q[0], b = q[1], t = q[3]; g.fillStyle = shade('cardboard', -0.7); g.fillRect(t.x + (b.x - a.x) * 0.1, t.y + (a.y - t.y) * 0.12, (b.x - a.x) * 0.8, (a.y - t.y) * 0.76);
          for (var j = 0; j < 3; j++) { g.fillStyle = col('fruit-orange'); g.beginPath(); g.arc(t.x + (b.x - a.x) * (0.3 + j * 0.2), t.y + (a.y - t.y) * 0.72, (b.x - a.x) * 0.09, 0, Math.PI * 2); g.fill(); } } });
        var f0 = pt(bd, bx - 0.35, 0.4), f1 = pt(bd, bx + 0.35, 0.4), f2 = pt(bd - 0.3, bx + 0.42, 0.62), f3 = pt(bd - 0.3, bx - 0.28, 0.62);
        if (f0 && f1 && f2 && f3) { poly(g, [f0, f1, f2, f3]); g.fillStyle = card[0]; g.fill(); }
      }

      /* ---------- THE PASSENGER: the one person in the street drawn sharp and in colour, at the kerb with an arm up ----------
         kind: 'plain' (red coat) | 'case' (blue-grey coat, a suitcase) | 'bags' (olive coat, shopping). pose 0: arm high; 1: waving. */
      var COAT = { plain: 'coat-red', 'case': 'coat-blue', bags: 'coat-olive' };
      function passenger(kind, pose) {
        var ppm = 140, w = 1.4 * ppm, h = 2.35 * ppm, c = mk(w, h), g = c.getContext('2d');
        var cx = w * 0.4, foot = h - 8, Ht = 1.7 * ppm, top = foot - Ht, k = Ht / 196, rimC = col('figure-rim');
        g.save(); g.translate(cx, top); g.scale(k, k); g.translate(-60, 0);
        var limb = function (x0, y0, len, ang, w0, w1, fill) { g.fillStyle = fill; var x1 = x0 + Math.sin(ang) * len, y1 = y0 + Math.cos(ang) * len, nx = Math.cos(ang), ny = -Math.sin(ang);
          g.beginPath(); g.moveTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.lineTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); g.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); g.closePath(); g.fill();
          g.beginPath(); g.arc(x1, y1, w1 / 2, 0, Math.PI * 2); g.fill(); return [x1, y1]; };
        var draw = function (rim) {
          var C = function (t) { return rim ? rimC : col(t); };
          limb(53, 100, 92, 0.02, 15, 9, C('trouser-dark')); limb(67, 100, 92, -0.02, 15, 9, C('trouser-dark'));
          g.fillStyle = C('hair-dark'); g.beginPath(); g.ellipse(52, 194, 9, 4, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(69, 194, 9, 4, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = C(COAT[kind] || 'coat-red'); g.beginPath(); g.moveTo(37, 34); g.quadraticCurveTo(40, 26, 60, 25); g.quadraticCurveTo(80, 26, 83, 34); g.lineTo(86, 140); g.lineTo(34, 140); g.closePath(); g.fill();
          limb(40, 36, 68, 0.08, 11, 8, C(COAT[kind] || 'coat-red')); limb(40, 36 + 68 * Math.cos(0.08), 4, 0.08, 8, 9, C('skin'));
          var a1 = pose ? Math.PI - 1.0 : Math.PI - 0.45, a2 = pose ? Math.PI - 0.35 : Math.PI - 0.1;   // the hailing arm, towards the road
          var e = limb(80, 36, 42, a1, 11, 9, C(COAT[kind] || 'coat-red')); limb(e[0], e[1], 32, a2, 9, 8, C(COAT[kind] || 'coat-red'));
          g.fillStyle = C('skin'); g.beginPath(); g.arc(e[0] + Math.sin(a2) * 35, e[1] + Math.cos(a2) * 35, 6, 0, Math.PI * 2); g.fill();
          g.fillRect(55, 17, 10, 12); g.beginPath(); g.ellipse(60, 11, 10.5, 13, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = C('hair-dark'); g.beginPath(); g.ellipse(60, 5, 11, 8, 0, Math.PI, 0); g.fill(); g.fillRect(49, 3, 4, 12);
          if (kind === 'case') { g.fillStyle = C('suitcase-blue'); g.beginPath(); if (g.roundRect) g.roundRect(8, 128, 26, 56, 4); else g.rect(8, 128, 26, 56); g.fill(); g.fillStyle = C('hair-dark'); g.fillRect(19, 116, 4, 12); g.fillRect(12, 184, 5, 6); g.fillRect(26, 184, 5, 6); }
          if (kind === 'bags') { g.fillStyle = C('bag-paper'); g.fillRect(26, 104, 22, 28); g.fillStyle = C('face-red'); g.fillRect(16, 110, 18, 24); }
        };
        g.save(); g.translate(2.5, -2); g.globalAlpha = 0.8; draw(true); g.restore();   // the shops' light along the edges
        draw(false);
        g.globalCompositeOperation = 'source-atop';                                       // the street's light on the side facing the road
        var gr = g.createLinearGradient(20, 0, 100, 0); gr.addColorStop(0, rgba(col('sodium'), 0)); gr.addColorStop(1, rgba(col('sodium'), 0.28)); g.fillStyle = gr; g.fillRect(0, -20, 120, 230);
        g.restore();
        return { c: c, ppm: ppm, ax: cx, ay: foot };
      }
      // the warm pool of light every passenger stands in, 2.8 m across, drawn on the pavement under them
      function pool() {
        var p = mk(200, 200), pg = p.getContext('2d'), gr = pg.createRadialGradient(100, 100, 0, 100, 100, 100);
        gr.addColorStop(0, rgba(shade('sodium', 0.3), 0.6)); gr.addColorStop(1, rgba(col('sodium'), 0)); pg.fillStyle = gr; pg.fillRect(0, 0, 200, 200);
        return p;
      }

      /* ---------- THE STOP ZONE: a painted bay, 3 m across and 10 m along, in the kerbside lane (Barney, option A) ----------
         kind 'pickup': tube-teal, 上客 PICK-UP; 'dropoff': tube-pink, 落客 DROP-OFF. */
      var BAY = { pickup: ['tube-teal', 'tube-core-teal', '上客', 'PICK-UP'], dropoff: ['tube-pink', 'tube-core-pink', '落客', 'DROP-OFF'] };
      function bay(kind) {
        var b = BAY[kind] || BAY.pickup, c0 = col(b[0]), c1 = col(b[1]);
        var W = 300, H = 1000, c = mk(W, H), g = c.getContext('2d'), lw = 16;   // 100 pixels per metre
        g.fillStyle = rgba(c0, 0.13); g.fillRect(0, 0, W, H);                   // a faint wash of the colour
        g.fillStyle = rgba(c0, 0.95); g.fillRect(0, 0, W, lw); g.fillRect(0, H - lw, W, lw);   // solid ends, dashed sides
        for (var y = 0; y < H; y += 80) { g.fillRect(0, y, lw, 50); g.fillRect(W - lw, y, lw, 50); }
        g.save(); g.translate(W / 2, H * 0.5); g.scale(1, 2.6); g.fillStyle = rgba(c1, 0.92); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '700 92px "Noto Sans TC", sans-serif'; g.fillText(b[2], 0, -40);   // stretched along the road, as road lettering is
        g.font = '700 54px Antonio, sans-serif'; if ('letterSpacing' in g) g.letterSpacing = '4px'; g.fillText(b[3], 0, 40);
        g.restore();
        var spill = mk(200, 200), sg = spill.getContext('2d'), sgr = sg.createRadialGradient(100, 100, 0, 100, 100, 100);   // fades to nothing before its edges
        sgr.addColorStop(0, rgba(c0, 0.35)); sgr.addColorStop(1, rgba(c0, 0)); sg.fillStyle = sgr; sg.fillRect(0, 0, 200, 200);
        return { paint: c, glow: blurred(c, 10), spill: spill };
      }
      // draw a bay made by bay(): its light on the wet road, the paint, then the paint's glow
      function drawBay(g, pt, b, d0, d1, x0, x1) {
        decal(g, pt, b.spill, d0 - 3, d1 + 3, x0 - 1.5, x1 + 1.5, 0.55, 'lighter');
        decal(g, pt, b.paint, d0, d1, x0, x1, 0.88);
        decal(g, pt, b.glow, d0, d1, x0, x1, 0.6, 'lighter');
      }

      return {
        PPM: PPM, stand: stand, decal: decal, shadow: shadow, box: box,
        boar: boar, dog: dog, cat: cat, chicken: chicken, crate: crate,
        oil: oil, pothole: pothole, cone: cone, roadworks: roadworks, cargo: cargo,
        passenger: passenger, pool: pool, bay: bay, drawBay: drawBay,
        // true sizes in metres (Barney, 29 October 2026: true size)
        sizes: { boar: [1.4, 0.9], dog: [1.0, 0.62], cat: [0.5, 0.3], chicken: [0.45, 0.4], crate: [0.7, 0.45], oil: [2.8, 6.5], pothole: [1.9, 3.2],
          barriers: [3.15, 0.95], cone: [0.4, 0.72], cargo: [2.6, 3.2], passenger: [0.6, 1.7], pool: [2.8, 2.8], bay: [3, 10] }
      };
    })();

    /* ---- the play screen's new parts: lives, the fare lamps, the caption's round line, the pin, the power-up badges and
       rings, the bay's ring, the receipt slip, the SAFE! sign, the zone title and the touch zones (design system v10)
       The design system's code (components/bundle.js, CityNights.hud), copied unchanged. It takes colours by token name
       through popCol, so from the kit's colour table. How the kit uses each part is with the play screen, further down. */
    /* ---------------- The play screen's new parts: Grunge City Rider's information and moments ----------------
       Barney, 29 and 30 October 2026 (HUD round 1: C, "where it happens"; round 2: the bay's ring, the passenger
       fading with the roof sign going out, the receipt slip, the SAFE! sign, the film title; the full play screen).
       Screen pieces are drawn for a 720-line window: k is canvas pixels per 720-line pixel, m is canvas pixels per
       CSS pixel (it sets the smallest sizes on phones). Road pieces take the street's pt(d, x, y) like CityNights.street
       and draw in the caller's picture units (540-line picture pixels, the street's own). Colours come by token name. */
    var hud = (function () {
      var col = popCol, rgba = popAlpha;
      var FZH = '"Noto Sans TC", sans-serif', FZS = '"Noto Serif TC", serif', FUI = '"IBM Plex Sans Condensed", sans-serif', FAN = 'Antonio, sans-serif', FCO = 'Bangers, Impact, sans-serif';
      function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
      function mix(c, d, t) {   // two #rrggbb colours mixed, t of the way from c to d, as #rrggbb
        var a = parseInt(col(c).slice(1), 16), b = parseInt(col(d).slice(1), 16), f = function (s) { return Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); };
        return '#' + ((1 << 24) + (f(16) << 16) + (f(8) << 8) + f(0)).toString(16).slice(1);
      }
      function spaced(g, px) { if ('letterSpacing' in g) g.letterSpacing = px + 'px'; }

      // ---- lives: three small taxis seen from behind, as the player's own; a lost one is left as a faint shape.
      // (x, y) is the top left; h the height in the caller's units (15.5 meter units in the meter's heading).
      var BODY = new Path2D('M7.5 1.5 H18.5 L21 8 H24 Q25 8 25 9 V17 Q25 18 24 18 H21 V19.5 H17.5 V18 H8.5 V19.5 H5 V18 H2 Q1 18 1 17 V9 Q1 8 2 8 H5 Z');
      var GLASS = new Path2D('M8.6 3 H17.4 L19.2 7.6 H6.8 Z');
      function lives(g, x, y, h, n) {
        var s = h / 20, step = h * 1.3 + h * 0.22;
        for (var i = 0; i < 3; i++) {
          g.save(); g.translate(x + i * step, y); g.scale(s, s);
          if (i < n) {
            g.fillStyle = col('taxi-red'); g.fill(BODY); g.lineWidth = 1.2; g.strokeStyle = col('case'); g.stroke(BODY);
            g.fillStyle = col('shutter'); g.fill(GLASS);
            g.fillStyle = col('face-cream'); rr(g, 10.5, 0, 5, 2.2, 0.6); g.fill(); g.lineWidth = 0.8; g.stroke();
            g.fillStyle = col('cone-orange'); rr(g, 2.6, 10, 3.6, 2.6, 0.5); g.fill(); rr(g, 19.8, 10, 3.6, 2.6, 0.5); g.fill();
            g.fillStyle = col('face-yellow'); g.fillRect(10, 13.6, 6, 2.4);
          } else { g.fillStyle = col('life-lost'); g.fill(BODY); rr(g, 10.5, 0, 5, 2.2, 0.6); g.fill(); }
          g.restore();
        }
        return 3 * h * 1.3 + 2 * h * 0.22;   // width drawn
      }
      // ---- five fare lamps, lit for each fare done in this zone. (x, cy): the first lamp's left edge and the row's middle; d the lamp's size
      function fareLamps(g, x, cy, d, n) {
        for (var i = 0; i < 5; i++) {
          var cx = x + d / 2 + i * d * 1.4;
          g.save(); g.beginPath(); g.arc(cx, cy, d / 2, 0, Math.PI * 2);
          if (i < n) { g.shadowColor = rgba(col('face-yellow'), 0.95); g.shadowBlur = d * 0.6; g.fillStyle = col('face-yellow'); g.fill(); g.shadowBlur = 0; g.lineWidth = 1; g.strokeStyle = 'rgba(120,70,0,0.5)'; g.stroke(); }
          else { g.fillStyle = col('lamp-unlit'); g.fill(); g.lineWidth = Math.max(1, d * 0.11); g.strokeStyle = col('lamp-unlit-ring'); g.beginPath(); g.arc(cx, cy, d / 2 - g.lineWidth / 2, 0, Math.PI * 2); g.stroke(); }
          g.restore();
        }
        return d * 1.4 * 4 + d;
      }
      // ---- the district caption, now three lines: Chinese, English, then 輪 ROUND n with the zone's five fare lamps.
      // x: its left edge (2 picture pixels right of the meter's); meterTop: the top of the meter's case; a: its fade (0 to 1).
      function caption(g, x, meterTop, k, m, o) {
        var a = o.a == null ? 1 : o.a; if (a <= 0) return;
        var rs = Math.max(18 * k, 11 * m), re = Math.max(17 * k, 11 * m), ld = Math.max(13 * k, 8 * m), pad = 3 * k, rowH = Math.max(rs, ld + 2 * pad);
        var withRound = o.round != null, rowMid = meterTop - 13.7 * k - rowH / 2;
        var enBase = withRound ? rowMid - rowH / 2 - 10 * k : meterTop - 18.67 * k, zhBase = enBase - 32 * k;   // without a round: 14 picture px above the meter
        g.save(); g.globalAlpha = a; g.lineJoin = 'round'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        var out = function (text, xx, yy, f, w) { g.font = f; g.lineWidth = w; g.strokeStyle = col('caption-outline'); g.strokeText(text, xx, yy); g.fillStyle = col('caption'); g.fillText(text, xx, yy); };
        out(o.zh, x, zhBase, '700 ' + 37.3 * k + 'px ' + FZH, 6.67 * k);
        out(o.en, x, enBase, '500 ' + 24 * k + 'px ' + FUI, 6.67 * k);
        if (!withRound) { g.restore(); return; }
        // the round: 輪 ROUND n, its own outline thinner, then the lamps on a small dark pill
        g.textBaseline = 'middle'; var xx = x, ow = Math.max(4 * k, 2.5 * m);
        out('輪', xx, rowMid, '700 ' + rs + 'px ' + FZH, ow); g.font = '700 ' + rs + 'px ' + FZH; xx += g.measureText('輪').width + 6 * k;
        spaced(g, k); out('ROUND ' + o.round, xx, rowMid + re * 0.04, '600 ' + re + 'px ' + FUI, ow); g.font = '600 ' + re + 'px ' + FUI; xx += g.measureText('ROUND ' + o.round).width + 10 * k; spaced(g, 0);
        var pw = ld * 1.4 * 4 + ld + 2 * pad; g.fillStyle = 'rgba(0,0,0,0.55)'; rr(g, xx, rowMid - ld / 2 - pad, pw, ld + 2 * pad, (ld + 2 * pad) / 2); g.fill();
        fareLamps(g, xx + pad, rowMid, ld, o.fares);
        g.restore();
      }
      // ---- the pin over where the taxi is heading: pink 落 over the drop-off with the place's name and the distance,
      // teal 上 over a pick-up with the distance. (x, y): the point 3.2 m above the bay's middle (or above the far end
      // of the drawn road in the bay's lane, until the bay is in view). o: { kind: 'drop' | 'pick', name, metres, bare }
      function pin(g, x, y, k, m, o) {
        var kk = Math.max(k, 0.6 * m), pick = o.kind === 'pick', tube = col(pick ? 'tube-teal' : 'tube-pink'), core = col(pick ? 'tube-core-teal' : 'tube-core-pink');
        var shape = new Path2D('M20 55 C13 41 3 32 3 20 A17 17 0 0 1 37 20 C37 32 27 41 20 55 Z');
        g.save(); g.translate(x - 20 * kk, y - 58 * kk); g.scale(kk, kk);
        g.shadowColor = tube; g.shadowBlur = 10 * kk; g.fillStyle = col('neon-board'); g.fill(shape);
        g.lineWidth = 3.6; g.strokeStyle = tube; g.stroke(shape); g.shadowBlur = 4 * kk; g.stroke(shape); g.shadowBlur = 0;
        g.lineWidth = 1.3; g.strokeStyle = core; g.stroke(shape);
        g.fillStyle = core; g.font = '700 17px ' + FZH; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(pick ? '上' : '落', 20, 27);
        g.restore();
        if (o.bare) return;
        // the tag on the kerb side: the name (drop-offs), then the metres to go
        var fz = Math.max(15 * kk, 11 * m), fa = Math.max(15 * kk, 11 * m), padX = 8 * kk, w = 0, lines = [];
        if (o.name) lines.push({ t: o.name, f: '700 ' + fz + 'px ' + FZH, lh: fz * 1.2, sp: 0 });
        lines.push({ t: o.metres + ' M', f: '700 ' + fa + 'px ' + FAN, lh: fa * 1.15, sp: kk });
        g.save(); lines.forEach(function (l) { g.font = l.f; spaced(g, l.sp); w = Math.max(w, g.measureText(l.t).width); }); spaced(g, 0);
        var bw = w + padX * 2, bh = lines.reduce(function (s, l) { return s + l.lh; }, 0) + 9 * kk, bx = x - 28 * kk - bw, by = y - 56 * kk;
        g.shadowColor = tube; g.shadowBlur = 10 * kk; g.fillStyle = col('neon-board'); rr(g, bx, by, bw, bh, 6 * kk); g.fill();
        g.shadowBlur = 0; g.lineWidth = 2 * kk; g.strokeStyle = tube; rr(g, bx - kk, by - kk, bw + 2 * kk, bh + 2 * kk, 7 * kk); g.stroke();
        g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.fillStyle = core; g.shadowColor = tube; g.shadowBlur = 5 * kk;
        var ty = by + 4 * kk; lines.forEach(function (l) { g.font = l.f; spaced(g, l.sp); ty += l.lh; g.fillText(l.t, bx + bw - padX, ty - l.lh * 0.22); });
        spaced(g, 0); g.restore();
      }
      // ---- the power-ups the taxi carries, as small sign tokens just under its rear bumper: 快 with a ring that empties
      // over its 10 s, 保 while held, the fare boost on (錢 or 雙). (x, y): the taxi's rear on the road. list: [{ kind, left }]
      var FACES = { speed: ['快', 'face-red', 'ink-yellow'], shield: ['保', 'face-blue', 'ink-white'], fare: ['錢', 'face-yellow', 'ink-black'], double: ['雙', 'face-cream', 'ink-red'] };
      function badges(g, x, y, k, m, list) {
        var kk = Math.max(k, 0.68 * m) * 1.15, box = 34 * kk, face = 24 * kk, gap = 5 * kk, n = list.length; if (!n) return;
        var x0 = x - (n * box + (n - 1) * gap) / 2, top = y + 4 * kk;
        list.forEach(function (b, i) {
          var F = FACES[b.kind], cx = x0 + i * (box + gap) + box / 2, cy = top + box / 2;
          g.save();
          if (b.left != null) {   // the ring of time left, from the top, clockwise
            g.lineWidth = 3.4 * kk; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.arc(cx, cy, 15 * kk, 0, Math.PI * 2); g.stroke();
            g.strokeStyle = col(F[1]); g.beginPath(); g.arc(cx, cy, 15 * kk, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, b.left))); g.stroke();
          }
          g.shadowColor = col(F[1]); g.shadowBlur = 9 * kk; g.fillStyle = col('case'); rr(g, cx - face / 2 - 2 * kk, cy - face / 2 - 2 * kk, face + 4 * kk, face + 4 * kk, 6 * kk); g.fill();
          g.shadowBlur = 0; g.fillStyle = col(F[1]); rr(g, cx - face / 2, cy - face / 2, face, face, 4 * kk); g.fill();
          g.fillStyle = col(F[2]); g.font = '900 ' + 16 * kk + 'px ' + FZS; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(F[0], cx, cy + kk);
          g.restore();
        });
      }
      // ---- 保 held: a ring of blue light on the road round the taxi. (x, y): the taxi's rear on the road; s: pixels per metre there.
      // It steps aside while the taxi is in a bay (the bay's own ring shows instead) and comes back as the taxi leaves.
      function shieldRing(g, x, y, s) {
        var half = 0.9 * s, rx = half * 1.75, ry = half * 0.75, cy = y - half * 1.05 + ry, b = col('tube-blue');
        g.save(); g.globalCompositeOperation = 'screen'; g.translate(x, cy); g.scale(1, ry / rx);
        var gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, rgba(b, 0)); gr.addColorStop(0.55, rgba(b, 0.35)); gr.addColorStop(0.82, rgba(mix('tube-blue', '#ffffff', 0.3), 0.75)); gr.addColorStop(1, rgba(b, 0));
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      // ---- the bay's ring: once three-quarters of the taxi is inside a bay, the bay's colour gathers in a ring of light on the
      // road round it (drawn on the road, so the taxi drawn over it hides what is under it). laneX: the taxi's lane centre (m);
      // tube: 'tube-teal' (pick-up) or 'tube-pink' (drop-off); a: 0 to 1 (it fades in, and out once the stop counts).
      function bayRing(g, pt, laneX, tube, a) {
        if (!(a > 0)) return;
        var ell = function (ad, ax) { var p = []; for (var i = 0; i < 48; i++) { var t = i / 48 * Math.PI * 2, q = pt(2.3 + Math.sin(t) * ad, laneX + Math.cos(t) * ax, 0); if (!q) return null; p.push(q); } return p; };
        var path = function (p) { g.beginPath(); p.forEach(function (q, i) { if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }); g.closePath(); };
        var e1 = ell(3.4, 1.45), e0 = ell(3.0, 1.2); if (!e1 || !e0) return;
        var c = col(tube), px = g.getTransform().a || 1;   // canvas pixels per picture pixel, for the blurs
        g.save(); g.globalCompositeOperation = 'lighter';
        g.filter = 'blur(' + (6.6 * px) + 'px)'; path(e1); g.lineWidth = 16; g.strokeStyle = c; g.globalAlpha = 0.55 * a; g.stroke();
        g.filter = 'blur(' + (2 * px) + 'px)'; g.lineWidth = 5; g.globalAlpha = 0.9 * a; g.stroke();
        g.filter = 'none'; g.lineWidth = 1.6; g.strokeStyle = '#ffffff'; g.globalAlpha = 0.7 * a; g.stroke();
        g.filter = 'blur(' + (9.2 * px) + 'px)'; path(e0); g.fillStyle = c; g.globalAlpha = 0.28 * a; g.fill();
        g.restore();
      }
      // ---- the receipt slip: printed out of the top of the meter when a fare is paid, the tip halves or the tip is lost.
      // (x, bottom): its left edge and where it meets the meter's case. o: { head, lines: [[zh, en, value, 'total' | 'red' | 'struck']] }
      // show: 0 to 1, how much of it is out (it prints up out of the meter, holds, and goes back in).
      function receipt(g, x, bottom, k, m, o, show) {
        var s = show == null ? 1 : Math.max(0, Math.min(1, show)); if (!s) return;
        var w = 210 * k, padX = 12 * k, zig = 7 * k;
        var fz = Math.max(14 * k, 10 * m), fe = Math.max(11.5 * k, 9 * m), fv = Math.max(16 * k, 11 * m), ft = Math.max(20 * k, 12 * m), fh = Math.max(14 * k, 10 * m), fhe = Math.max(11 * k, 9 * m);
        var rows = o.lines.map(function (l) { return l[3] === 'total' ? { l: l, h: ft * 1.25 + 9 * k } : { l: l, h: Math.max(fv, fz) * 1.3 }; });
        var h = 6 * k + fh * 1.3 + 5 * k + rows.reduce(function (a, r) { return a + r.h; }, 0) + 10 * k, top = bottom - h;
        g.save(); g.beginPath(); g.rect(x - 20 * k, bottom - (h + zig) * s - 20 * k, w + 40 * k, (h + zig) * s + 20 * k); g.clip();
        g.translate(0, (h + zig) * (1 - s));
        g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 14 * k; g.shadowOffsetY = 6 * k; g.fillStyle = col('receipt-paper');
        g.beginPath(); g.moveTo(x, bottom); g.lineTo(x, top - zig + 3 * k);
        for (var i = 0; i < 21; i++) { g.lineTo(x + (i * 10 + 5) / 210 * w, top - zig); g.lineTo(x + (i * 10 + 10) / 210 * w, top - zig + 3 * k); }
        g.lineTo(x + w, bottom); g.closePath(); g.fill();
        g.shadowColor = 'transparent';
        var yy = top + 6 * k + fh;
        g.textBaseline = 'alphabetic'; g.fillStyle = col('ink-red'); g.textAlign = 'left'; g.font = '900 ' + fh + 'px ' + FZS; g.fillText('的士', x + padX, yy);
        g.textAlign = 'right'; g.font = '600 ' + fhe + 'px ' + FUI; spaced(g, 1.2 * k); g.fillText(o.head || 'TAXI', x + w - padX, yy); spaced(g, 0);
        yy += fh * 0.3 + 5 * k;
        rows.forEach(function (r) {
          var l = r.l, total = l[3] === 'total', red = l[3] === 'red' || l[3] === 'struck';
          if (total) { g.save(); g.strokeStyle = rgba(col('receipt-ink'), 0.5); g.lineWidth = Math.max(1, k); g.setLineDash([3 * k, 2.5 * k]); g.beginPath(); g.moveTo(x + padX, yy + 4 * k); g.lineTo(x + w - padX, yy + 4 * k); g.stroke(); g.restore(); yy += 9 * k; }
          var base = yy + (total ? ft : Math.max(fv, fz)) * 1.0;
          g.textAlign = 'left'; g.fillStyle = col('receipt-ink');
          if (l[0]) { g.font = '700 ' + fz + 'px ' + FZH; g.fillText(l[0], x + padX, base); }
          if (l[1]) { var zw = 0; if (l[0]) { g.font = '700 ' + fz + 'px ' + FZH; zw = g.measureText(l[0]).width + 5 * k; } g.font = '600 ' + fe + 'px ' + FUI; spaced(g, 0.8 * k); g.fillText(l[1], x + padX + zw, base); spaced(g, 0); }
          g.textAlign = 'right'; g.font = '600 ' + (total ? ft : fv) + 'px ' + FUI; g.fillStyle = red ? col('receipt-red') : col('receipt-ink');
          var vx = x + w - padX; g.fillText(l[2], vx, base);
          if (l[3] === 'struck') { var vw = g.measureText(l[2]).width; g.strokeStyle = col('receipt-red'); g.lineWidth = 2 * Math.max(k, 0.5 * m); g.beginPath(); g.moveTo(vx - vw - k, base - fv * 0.32); g.lineTo(vx + k, base - fv * 0.32); g.stroke(); }
          yy += r.h - (total ? 9 * k : 0);
        });
        g.restore();
        return h + zig;
      }
      // ---- the shielded hit: a small neon sign of the crash pop's family, without the smoke: a blue shield with 保 and
      // SAFE! in the pop's comic letters on a curve. (x, y): its middle, over the point of contact. The hit car or barrier
      // is cleared away underneath it. It lives as the crash pop does (pop-time); a: its opacity, sc: the spring scale.
      var SHIELD = new Path2D('M150 62 L208 82 C208 132 186 166 150 186 C114 166 92 132 92 82 Z');
      function shieldSign(g, x, y, k, a, sc) {
        var kk = k * (sc || 1); if (!(a > 0)) return;
        g.save(); g.globalAlpha = a; g.translate(x - 150 * kk, y - 105 * kk); g.scale(kk, kk);
        var blue = col('tube-blue'), core = col('tube-core-blue');
        g.shadowColor = blue; g.shadowBlur = 16 * kk; g.fillStyle = 'rgba(5,3,5,0.92)'; g.fill(SHIELD);
        g.lineWidth = 7; g.strokeStyle = blue; g.stroke(SHIELD); g.shadowBlur = 6 * kk; g.stroke(SHIELD); g.shadowBlur = 0;
        g.lineWidth = 2.2; g.strokeStyle = core; g.stroke(SHIELD);
        g.fillStyle = core; g.font = '900 58px ' + FZS; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('保', 150, 150);
        // SAFE! along the curve from (40, 92) through (150, 18) to (260, 92): each letter at its place on the curve, turned to follow it
        var word = 'SAFE!', P = function (t) { var u = 1 - t; return { x: u * u * 40 + 2 * u * t * 150 + t * t * 260, y: u * u * 92 + 2 * u * t * 18 + t * t * 92 }; };
        var len = [0], prev = P(0), N = 200; for (var i = 1; i <= N; i++) { var q = P(i / N); len.push(len[i - 1] + Math.hypot(q.x - prev.x, q.y - prev.y)); prev = q; }
        var at = function (dist) { for (var j = 1; j <= N; j++) if (len[j] >= dist) { var t = (j - 1 + (dist - len[j - 1]) / (len[j] - len[j - 1])) / N; return t; } return 1; };
        g.font = '62px ' + FCO; var widths = word.split('').map(function (ch) { return g.measureText(ch).width; }), total = widths.reduce(function (s, v) { return s + v; }, 0) + 3 * (word.length - 1);
        var d = len[N] / 2 - total / 2;
        word.split('').forEach(function (ch, idx) {
          var mid = d + widths[idx] / 2, t = at(mid), p = P(t), p2 = P(Math.min(1, t + 0.01)), ang = Math.atan2(p2.y - p.y, p2.x - p.x);
          g.save(); g.translate(p.x, p.y); g.rotate(ang); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
          g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = col('face-blue'); g.strokeText(ch, 0, 0); g.fillStyle = '#ffffff'; g.fillText(ch, 0, 0);
          g.restore(); d += widths[idx] + 3;
        });
        g.restore();
      }
      // ---- the zone change: the caption grows into a big title in the middle, over the street dimmed (zone-shade).
      // o: { zh, en, done: true, take: '51.30' } for the zone just finished; { zh, en, round: '3' } for the next. a: its opacity.
      function zoneTitle(g, cx, cy, k, m, o, a) {
        if (!(a > 0)) return;
        var ow = Math.max(6 * k, 3 * m);
        g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
        var out = function (text, xx, yy, f) { g.font = f; g.lineWidth = ow; g.strokeStyle = col('caption-outline'); g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 12 * k; g.strokeText(text, xx, yy); g.shadowBlur = 0; g.fillStyle = col('caption'); g.fillText(text, xx, yy); };
        if (o.done) {
          out(o.zh, cx, cy - 22 * k, '700 ' + 76 * k + 'px ' + FZH);
          out(o.en, cx, cy + 24 * k, '500 ' + 42 * k + 'px ' + FUI);
          // the five lamps on their pill, then the zone's takings
          var d = 20 * k, pad = 5 * k, pw = d * 1.4 * 4 + d + 2 * pad; g.font = '600 ' + 34 * k + 'px ' + FUI; var tw = g.measureText('HK$' + o.take).width, rowW = pw + 20 * k + tw, rx = cx - rowW / 2, ry = cy + 70 * k;
          g.fillStyle = 'rgba(0,0,0,0.55)'; rr(g, rx, ry - d / 2 - pad, pw, d + 2 * pad, (d + 2 * pad) / 2); g.fill();
          fareLamps(g, rx + pad, ry, d, 5);
          g.textAlign = 'left'; g.textBaseline = 'middle'; out('HK$' + o.take, rx + pw + 20 * k, ry + 2 * k, '600 ' + 34 * k + 'px ' + FUI);
        } else {
          out(o.zh, cx, cy - 26 * k, '700 ' + 92 * k + 'px ' + FZH);
          out(o.en, cx, cy + 28 * k, '500 ' + 48 * k + 'px ' + FUI);
          g.font = '700 ' + 30 * k + 'px ' + FZH; var zw = g.measureText('輪').width; g.font = '600 ' + 30 * k + 'px ' + FUI; spaced(g, k); var ew = g.measureText('ROUND ' + o.round).width;
          var lx = cx - (zw + 10 * k + ew) / 2; g.textAlign = 'left';
          out('輪', lx, cy + 76 * k, '700 ' + 30 * k + 'px ' + FZH); out('ROUND ' + o.round, lx + zw + 10 * k, cy + 76 * k, '600 ' + 30 * k + 'px ' + FUI); spaced(g, 0);
        }
        g.restore();
      }
      // ---- the touch zones on a phone: either thumb, in either zone (drag to steer, hold to brake, a quick tap for the horn).
      // Each runs from the top of the meter's case to the bottom of the screen: one from the left edge to the taxi, one from the
      // taxi to the right edge. A touch that starts in a zone keeps counting wherever it moves. Returns the two rectangles.
      function touchZones(viewW, viewH, meterTop, taxiLeft, taxiRight) {
        return [{ x0: 0, y0: meterTop, x1: taxiLeft, y1: viewH }, { x0: taxiRight, y0: meterTop, x1: viewW, y1: viewH }];
      }
      return { lives: lives, fareLamps: fareLamps, caption: caption, pin: pin, badges: badges, shieldRing: shieldRing, bayRing: bayRing,
        receipt: receipt, shieldSign: shieldSign, zoneTitle: zoneTitle, touchZones: touchZones,
        // how long each moment lasts (seconds); the receipt prints up, holds and goes back in
        times: { receiptIn: 0.25, receiptHold: 2, receiptOut: 0.25, zoneIn: 0.4, zoneHold: 1, zoneSwap: 0.6, zoneOut: 0.4, ringFade: 0.3 } };
    })();

    const LAMP_TIME = 0.5, WAVE_TIME = 0.4;   // lamp-time, wave-time
    const KERB_M = ROAD / UPM;                 // metres from the road's middle to the kerb (x = 1)
    // sizes in metres, across the road and along it (street.size): a piece's z is its near end, its x its middle across
    const PIECE_SIZE = { oil: [2.8, 6.5], pothole: [1.9, 3.2], roadworks: [3.15, 7.5], cargo: [2.6, 3.2],
      boar: [1.4, 0.6], dog: [1.0, 0.45], cat: [0.5, 0.25], chickens: [1.6, 0.8], bay: [3, 10] };
    // how fast an animal bolts, in metres a second, and how far past the kerb it is gone: the kit's, not the design system's
    const BOLT_SPEED = { boar: 5, dog: 5, cat: 5, chickens: 3 }, GONE_X = 1 + 1.2 / KERB_M;
    // contact shadows [wide, long, darkness]: the boar's and the passenger's from the design system's examples, the rest in proportion
    const SHADOWS = { boar: [1.5, 0.6, 0.45], dog: [1.1, 0.45, 0.4], cat: [0.55, 0.25, 0.35], chicken: [0.45, 0.25, 0.3], crate: [0.75, 0.5, 0.35], passenger: [0.6, 0.3, 0.4] };
    // the market chickens round their spot [metres along, metres across, facing], and their tipped crate, which stays put
    const FLOCK = [[0, -0.45, 1], [0.3, -0.05, -1], [-0.2, 0.25, 1]], CRATE_AT = [0.25, 0.65];
    // the bay across the kerbside lane on the left, its kerb edge 0.15 m from the kerb; the passenger 0.6 m in from the kerb
    const PASSENGERS = ['plain', 'case', 'bags'], BAY_X = [-4.85, -1.85], PASS_X = -(KERB_M + 0.6);

    /* ---- made once, into the atlas */
    // things with depth (the roadworks, spilt cargo, a cone) drawn by the design system's code from each of the traffic's
    // viewpoints, the way the traffic is baked: the camera 14 m away and `off` metres to the side. The piece's point
    // (0, 0, 0) is where it is placed. ext: [near, far, left, right, top] in metres, with room for its glows; nearer than
    // `cut` is left out.
    const BAKE_PPM = 100;   // pixels per metre at the piece (the traffic's are about 105)
    function bakePiece(key, draw, ext, off, cut){
      const camD = 14, camH = CAM_H / UPM, f = BAKE_PPM * camD, pad = 8;
      const raw = (d, x, y) => [(x + off) * f / (d + camD), (camH - y) * f / (d + camD)];
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const d of [ext[0], ext[1]]) for (const x of [ext[2], ext[3]]) for (const y of [0, ext[4]]){
        const p = raw(d, x, y); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
      }
      const c = mk(x1 - x0 + pad * 2, y1 - y0 + pad * 2);
      const pt = (d, x, y) => { if ((cut != null && d < cut) || d + camD < 1) return null; const p = raw(d, x, y || 0); return { x: p[0] - x0 + pad, y: p[1] - y0 + pad, s: f / (d + camD) }; };
      draw(c.getContext('2d'), pt, -off);
      const a = pt(0, 0, 0);
      atlasAdd(key, c, true, { ax: a.x, ay: a.y, ppm: BAKE_PPM });
    }
    // a contact shadow seen from above, laid on the road like the road pictures: the design system's shadow(), w wide and l long
    const SH_M = 0.2;   // its soft edge reaches 0.18 m past that
    function shadowPicture(w, l, a){
      const ppm = 100, c = mk((w + SH_M * 2) * ppm, (l + SH_M * 2) * ppm);
      street.shadow(c.getContext('2d'), (d, x) => ({ x: (x + w / 2 + SH_M) * ppm, y: (l + SH_M - d) * ppm, s: ppm }), 0, 0, w, l, a);
      return c;
    }
    function addPieces(){
      const up = (key, p) => atlasAdd(key, p.c, true, { ax: p.ax, ay: p.ay, ppm: p.ppm });
      for (const run of [0, 1]){
        up('pc:boar:' + run, street.boar(!!run)); up('pc:dog:' + run, street.dog(!!run)); up('pc:cat:' + run, street.cat(!!run));
        for (const face of [1, -1]) up('pc:chicken:' + run + ':' + face, street.chicken(!!run, face));
      }
      up('pc:crate', street.crate());
      for (const kind of PASSENGERS) for (const pose of [0, 1]) up('pc:pass:' + kind + ':' + pose, street.passenger(kind, pose));
      // the road pictures are kept whole: their edges are the piece's
      atlasAdd('pc:oil:0', street.oil(7)); atlasAdd('pc:oil:1', street.oil(23));
      atlasAdd('pc:pothole', street.pothole()); atlasAdd('pc:pool', street.pool());
      for (const kind of ['pickup', 'dropoff']){ const b = street.bay(kind); atlasAdd('pc:bay:' + kind, b.paint); atlasAdd('pc:glow:' + kind, b.glow); atlasAdd('pc:spill:' + kind, b.spill); }
      for (const k in SHADOWS) atlasAdd('pc:shadow:' + k, shadowPicture(SHADOWS[k][0], SHADOWS[k][1], SHADOWS[k][2]));
      OFFS.forEach((off, v) => {
        // the barriers and their sign, with each pair of lamps lit; the cones lead out over 7 m, too long for one picture, so they stand on their own
        for (const lit of [0, 1]) bakePiece('pc:works:' + lit + ':' + v, (g, pt, camX) => street.roadworks(g, pt, 0, 0, { camX: camX, lampsA: !!lit }), [-1.4, 1, -3, 3, 2.8], off, -1.4);
        bakePiece('pc:cargo:' + v, (g, pt, camX) => street.cargo(g, pt, 0, 0, { camX: camX }), [-2, 2.4, -1.8, 1.8, 1], off);
        bakePiece('pc:cone:' + v, (g, pt) => street.cone(g, pt, 0, 0), [-0.5, 0.4, -0.45, 0.45, 0.85], off);
      });
    }

    /* ---- each frame: what lies on the road is drawn before the traffic, under it and with the road's grain; what stands
       in the street is drawn with the traffic, far to near, at the traffic's grain (the animals lit like signs, so their
       eyes glow) */
    const groundList = [], pieceList = [], bolts = new WeakMap(), looks = new WeakMap();
    let lookN = 0;
    const relOf = (st, z) => (z - st.pos + TRACK) % TRACK;
    // where a point of the street is on screen: z in street units, x and y in metres (across from the road's middle, and
    // up); s is pixels per metre there, d the depth, a the fade with distance the traffic has
    function spot(st, z, xm, ym){
      const q = projectZ2(st, z); if (!q) return null;
      const s = q.scale * K * UPM;
      return { x: q.sx + s * xm, y: q.sy - s * (ym || 0), s, d: q.d - 0.5 / (DRAW + 2), a: clamp(1 - (1 / q.scale - 26000) / 30000, 0.35, 1) };
    }
    // the design system's decal() done by the graphics chip: a road picture laid flat from z0 (near) to z1 (far), x0 to x1
    // metres across, in rows half a metre long so its perspective is true; the picture's top edge is the far end
    function decalGL(st, key, z0, z1, x0, x1, a, add){
      const it = atlas.items.get(key), u = it.uv, rows = clamp(Math.ceil((z1 - z0) / (UPM / 2)), 4, 48);
      const s = S('#ffffff', { ly: it.layer, a, fl: add ? FL.ADD : 0 });
      let prev = null;
      for (let i = 0; i <= rows; i++){
        const t = i / rows, q = projectZ2(st, wrapU(z1 - (z1 - z0) * t));
        if (!q){ prev = null; continue; }
        const k = q.scale * K * UPM, row = { xa: q.sx + k * x0, xb: q.sx + k * x1, y: q.sy, v: u[1] + (u[3] - u[1]) * t };
        if (prev && row.y <= prev.y) continue;   // too thin yet: carried into the next row
        if (prev){
          dyn.need(4, 0);
          dyn.v(prev.xa, prev.y, 0, 0, u[0], prev.v, s); dyn.v(prev.xb, prev.y, 0, 0, u[2], prev.v, s);
          dyn.v(row.xb, row.y, 0, 0, u[2], row.v, s); dyn.v(row.xa, row.y, 0, 0, u[0], row.v, s);
        }
        prev = row;
      }
    }
    // a picture standing at a spot, feet at p, mirrored when flip; style(it) gives its style
    function standGL(key, p, flip, style){
      const it = atlas.items.get(key), k = p.s / it.ppm, u = it.uv, x0 = p.x - (flip ? it.sw - it.ax : it.ax) * k, y0 = p.y - it.ay * k;
      if (flip) dq(x0 + (it.sw - it.ox - it.w) * k, y0 + it.oy * k, it.w * k, it.h * k, p.d, style(it), [u[2], u[1], u[0], u[3]]);
      else dq(x0 + it.ox * k, y0 + it.oy * k, it.w * k, it.h * k, p.d, style(it), u);
    }
    // a baked piece, from the viewpoint nearest the camera's
    function bakedGL(key, p, style){
      const off = (p.x - W / 2) / p.s; let v = 0, best = 1e9;
      OFFS.forEach((o, i) => { const d = Math.abs(o - off); if (d < best){ best = d; v = i; } });
      standGL(key + v, p, false, style);
    }
    const asTraffic = a => it => S('#ffffff', { ly: it.layer, a });
    const asLit = a => it => S('#ffffff', { ly: it.layer, a, lv: Z.cars, fl: FL.LEV });
    function collectPieces(st){
      groundList.length = 0; pieceList.length = 0;
      if (!st.obstacles) return;   // the title's street has none
      // something on the road from z0, len long (units), seen while any of it is ahead; something standing at z, x (metres)
      const ground = (z0, len, emit) => { const r = relOf(st, wrapU(z0 + len)); if (r <= DRAW * SEG + len) groundList.push({ rel: r - len, emit }); };
      const stand = (z, xm, mode, emit) => { const r = relOf(st, z); if (r >= NEAR_CAR && r <= DRAW * SEG) pieceList.push({ rel: r, z, xm, mode, emit }); };
      const shadow = (z, xm, kind, a) => { const sh = SHADOWS[kind]; ground(z - SH_M * UPM, (sh[1] + SH_M * 2) * UPM, () => decalGL(st, 'pc:shadow:' + kind, z - SH_M * UPM, z + (sh[1] + SH_M) * UPM, xm - sh[0] / 2 - SH_M, xm + sh[0] / 2 + SH_M, a)); };
      const lit = Math.floor(amb.t / LAMP_TIME) % 2 === 0 ? 1 : 0;
      for (const o of st.obstacles){
        if (!o) continue;
        const z = wrapU((+o.z || 0) * UPM), xm = (+o.x || 0) * KERB_M;
        if (o.kind === 'oil'){
          if (!looks.has(o)) looks.set(o, lookN++ % 2);   // two slicks, taken in turn so two together differ
          const key = 'pc:oil:' + looks.get(o);
          ground(z, 6.5 * UPM, () => decalGL(st, key, z, z + 6.5 * UPM, xm - 1.4, xm + 1.4, 0.95));
        } else if (o.kind === 'pothole') ground(z, 3.2 * UPM, () => decalGL(st, 'pc:pothole', z, z + 3.2 * UPM, xm - 0.95, xm + 0.95, 1));
        else if (o.kind === 'roadworks'){
          // four cones lead out from the kerb side over the first 5.4 m, then the barriers and their sign 7 m on, as roadworks() places them
          const k = xm < 0 ? -1 : 1;
          for (let i = 0; i < 4; i++) stand(z + i * 1.8 * UPM, xm + k * 1.35 - k * i * 0.75, 1, p => bakedGL('pc:cone:', p, asTraffic(p.a)));
          stand(z + 7 * UPM, xm, 1, p => bakedGL('pc:works:' + lit + ':', p, asTraffic(p.a)));
        } else if (o.kind === 'cargo') stand(z + 1.6 * UPM, xm, 1, p => bakedGL('pc:cargo:', p, asTraffic(p.a)));
      }
      for (const an of st.animals){
        if (!an || an.gone || !BOLT_SPEED[an.kind]) continue;
        const x = +an.x || 0, z = wrapU((+an.z || 0) * UPM), xm = x * KERB_M, run = an.bolt ? 1 : 0;
        const face = an.bolt ? (an.bolt < 0 ? -1 : 1) : (an.face < 0 ? -1 : 1), fade = clamp((GONE_X - Math.abs(x)) / 0.12, 0, 1);
        if (an.kind === 'chickens'){
          const b = bolts.get(an), cz = z + CRATE_AT[0] * UPM, cx = (b ? b.x0 : x) * KERB_M + CRATE_AT[1];
          shadow(cz, cx, 'crate', 1);
          stand(cz, cx, 0, p => standGL('pc:crate', p, false, asLit(p.a)));
          for (const [dz, dx, f] of FLOCK){
            const qz = z + dz * UPM, qx = xm + dx;
            shadow(qz, qx, 'chicken', fade);
            stand(qz, qx, 0, p => standGL('pc:chicken:' + run + ':' + (run ? face : f), p, false, asLit(p.a * fade)));
          }
        } else {
          shadow(z, xm, an.kind, fade);
          stand(z, xm, 0, p => standGL('pc:' + an.kind + ':' + run, p, face < 0, asLit(p.a * fade)));
        }
      }
      const sp = st.stop;
      if (sp && (sp.kind === 'pickup' || sp.kind === 'dropoff')){
        const z0 = wrapU((+sp.z || 0) * UPM), L = 10 * UPM, x0 = BAY_X[0], x1 = BAY_X[1];
        // drawBay(): the bay's light on the wet road, the paint, then the paint's glow
        ground(z0 - 3 * UPM, L + 6 * UPM, () => {
          decalGL(st, 'pc:spill:' + sp.kind, z0 - 3 * UPM, z0 + L + 3 * UPM, x0 - 1.5, x1 + 1.5, 0.55, true);
          decalGL(st, 'pc:bay:' + sp.kind, z0, z0 + L, x0, x1, 0.88);
          decalGL(st, 'pc:glow:' + sp.kind, z0, z0 + L, x0, x1, 0.6, true);
        });
        // getting in (Passenger): once the game sets stop.boarding, the passenger, their shadow and their pool of light fade
        // out where they stand over BOARD_TIME
        const pf = boardFade(sp);
        if (PASSENGERS.includes(sp.passenger) && pf > 0){
          // level with the middle of the bay: the pool of light first, then the shadow, then the passenger, hailing or waving
          const zp = z0 + 5 * UPM, pose = sp.waiting && !reduceMotion ? Math.floor(amb.t / WAVE_TIME) % 2 : 0, sh = SHADOWS.passenger, zs = zp - 0.1 * UPM;
          ground(zp - 1.4 * UPM, 2.8 * UPM, () => {
            decalGL(st, 'pc:pool', zp - 1.4 * UPM, zp + 1.4 * UPM, PASS_X - 1.4, PASS_X + 1.4, pf, true);
            decalGL(st, 'pc:shadow:passenger', zs - SH_M * UPM, zs + (sh[1] + SH_M) * UPM, PASS_X - sh[0] / 2 - SH_M, PASS_X + sh[0] / 2 + SH_M, pf);
          });
          stand(zp, PASS_X, 1, p => standGL('pc:pass:' + sp.passenger + ':' + pose, p, false, asTraffic(p.a * pf)));
        }
      }
    }
    // the passenger's fade as they get in: 1 until the game sets stop.boarding, then down to 0 over BOARD_TIME (the kit's clock)
    const boards = new WeakMap(), BOARD_TIME = 0.4;
    function boardFade(sp){
      if (!sp.boarding){ boards.delete(sp); return 1; }
      if (!boards.has(sp)) boards.set(sp, amb.t);
      return clamp(1 - (amb.t - boards.get(sp)) / BOARD_TIME, 0, 1);
    }
    // a step of play: animals the game has set bolting run for the kerb, and are gone once past it
    function boltStep(dt){
      if (!Array.isArray(api.animals)) return;
      for (const an of api.animals){
        if (!an) continue;
        if (!an.bolt){ bolts.delete(an); continue; }
        if (an.gone) continue;
        if (!bolts.has(an)) bolts.set(an, { x0: +an.x || 0 });
        an.x = (+an.x || 0) + (an.bolt < 0 ? -1 : 1) * (BOLT_SPEED[an.kind] || 5) * dt / KERB_M;
        if (Math.abs(an.x) >= GONE_X) an.gone = true;
      }
    }

    /* ---- sizes and settings */
    // w: the picture's width (540 lines tall, its width following the window); rs: canvas pixels per picture pixel
    function resize(w, rs){
      const nPW = Math.round(w * rs), nPH = Math.round(H * rs), changed = w !== W || nPW !== PW || nPH !== PH;
      W = w; K = W / 2; RS = rs; PW = nPW; PH = nPH;
      const popped = sizePop();
      if (!changed) return popped;
      canvas.width = PW; canvas.height = PH; hudLayout();
      if (built){ makeTargets(); makeSkylineTex(); bakeCab(); }
      return true;
    }
    // the crash pop's canvas covers the picture at the screen's own sharpness (up to 2 device pixels a CSS pixel); the
    // words' size follows its height, so when that changes they are drawn again
    function sizePop(){
      const pk = Math.min(window.devicePixelRatio || 1, 2) * env.cssScale(), pw = Math.max(1, Math.round(W * pk)), ph = Math.max(1, Math.round(H * pk));
      if (pw === env.pop.width && ph === env.pop.height) return false;
      const taller = ph !== env.pop.height;
      env.pop.width = pw; env.pop.height = ph; popDrawn = false;   // a new size also clears it
      env.marks.width = pw; env.marks.height = ph; marksDrawn = false;
      if (built && taller) drawPopWords();
      return true;
    }
    // Picture: edge smoothing (4 for Best, 0 for Faster and Fastest)
    function setSmoothing(n){
      smoothing = n; if (!built) return;
      const s = Math.min(n, maxSamples); if (s === samples) return;
      samples = s; makeTargets();
    }
    function build(){
      const t0 = performance.now();
      buildTrack(); buildPeople(); streetCost.planMs = performance.now() - t0; makeTiles();
      demo.cars = makeTraffic(16, 808, demo.pos).map(c => Object.assign(c, { speed: c.speed * DEMO_SPEED / 7600 }));
      buildSprites(); initGL(); buildAtlas(); buildStreet(); makeTargets(); makeSkylineTex(); bakeCab();
      streetPieces(Math.floor(demo.pos / SEG) % N_SEG, false);   // the title's first stretch
      streetCost.firstMs = streetCost.pieceMs;
      built = true;
      drawPopWords();
      streetCost.buildMs = performance.now() - t0; streetCost.readyAt = performance.now();
    }
    // the meter's numbers this frame, and the caption's district and fade
    /* ---- the marks that belong to a place in the street, on their own canvas over the picture (PlayScreen: cn-marks): the
       pin over the bay the taxi is heading for (TargetPin), and the power-ups the taxi carries as badges under its rear
       bumper (TaxiMarks), and the SAFE! sign (ShieldSign). The design system's hud draws them, each frame. */
    let marksDrawn = false;
    function clearMarks(){ if (marksDrawn){ const g = env.marks.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, env.marks.width, env.marks.height); marksDrawn = false; } }
    const PIN_UP = 3.2, PIN_FAR = 80 * UPM, BAY_MID = (BAY_X[0] + BAY_X[1]) / 2;
    function drawMarks(st){
      clearMarks();
      // pk: canvas pixels per picture pixel; k: per 720-line pixel; m: per CSS pixel. The badges follow the taxi's sway
      const cv = env.marks, g = cv.getContext('2d'), pk = cv.width / W, k = 0.75 * pk, m = pk / env.cssScale();
      const cg = cabGeometry(), tx = (W / 2 + sway(st)) * pk, ty = cg.gy * pk;
      g.setTransform(1, 0, 0, 1, 0, 0);
      const c = st.carry;
      // (保's ring is on the road under the taxi, drawn with the street: drawShieldRing)
      if (c){
        const list = [];
        if (c.speed != null && c.speed !== false) list.push({ kind: 'speed', left: clamp(+c.speed || 0, 0, 1) });
        if (c.shield) list.push({ kind: 'shield' });
        if (c.fare === 'fare' || c.fare === 'double') list.push({ kind: c.fare });
        if (list.length){ hud.badges(g, tx, ty, k, m, list); marksDrawn = true; }
      }
      // the pin: 3.2 m over the middle of the bay, or over the far end of the drawn road in the bay's lane until it is in view
      const pin = api.pin, sp = st.stop;
      if (pin && sp && (sp.kind === 'pickup' || sp.kind === 'dropoff')){
        let z = wrapU((+sp.z || 0) * UPM + 5 * UPM);
        const rel = relOf(st, z);
        if (rel < TRACK / 2){
          if (rel > PIN_FAR) z = wrapU(st.pos + PIN_FAR);
          const q = spot(st, z, BAY_MID, PIN_UP), pick = sp.kind === 'pickup';
          if (q){
            hud.pin(g, q.x * pk, q.y * pk, k, m, { kind: pick ? 'pick' : 'drop', name: pick ? '' : String(pin.name || ''), metres: String(Math.max(0, Math.round(+pin.metres || 0))), bare: !!pin.bare });
            marksDrawn = true;
          }
        }
      }
      // the SAFE! sign: the design system's drawing, made once at this size, sprung in and faded as the crash pop is
      if (safe){
        const f = safe.t / POP_TIME;
        if (f >= 1) safe = null;
        else {
          const pic = safePicture(k), a = keyed(f, reduceMotion ? POP_FADE : POP_ALPHA), sc = reduceMotion ? 1 : keyed(f, POP_SCALE), w = pic.c.width * sc, h = pic.c.height * sc;
          g.globalAlpha = a; g.drawImage(pic.c, safe.x * pk - w / 2, safe.y * pk - h / 2, w, h); g.globalAlpha = 1; marksDrawn = true;
        }
      }
      // the test page only: the touch zones outlined (nothing marks them in a game)
      if (showZones){
        g.save(); g.strokeStyle = col('tube-teal'); g.lineWidth = Math.max(1, 2 * m); g.setLineDash([8 * m, 6 * m]);
        for (const r of touchZones()) g.strokeRect(r.x0 * pk + m, r.y0 * pk + m, (r.x1 - r.x0) * pk - 2 * m, (r.y1 - r.y0) * pk - 2 * m);
        g.restore(); marksDrawn = true;
      }
    }

    /* ---- the shielded hit (ShieldSign): street.safe(z, x) lights the SAFE! sign over the point of contact, or, when that
       is in the taxi's own lane and so hidden behind it, over its roof: its rear on the road, 2.55 m up. Its life is the
       crash pop's (pop-time), and it is drawn once at the marks canvas's size, then shown with the spring and the fade. */
    let safe = null, safeAsk = null, safePic = null;
    function startSafe(st){
      const ask = safeAsk; safeAsk = null;
      const cg = cabGeometry(), ppm = cg.rw / VEH.taxi.W;
      let x = W / 2 + sway(st), y = cg.gy - ppm * 2.55;
      if (Math.abs(ask.x - st.x) > 0.25){ const q = projectZ2(st, ask.z); if (q){ x = q.sx + q.scale * ask.x * ROAD * K; y = q.sy - q.scale * 0.8 * UPM * K; } }
      safe = { t: 0, x, y };
    }
    function safePicture(k){
      if (safePic && safePic.k === k) return safePic;
      const pad = 30 * k, c = mk(300 * k + pad * 2, 210 * k + pad * 2);   // shield-box, with room for its glow
      hud.shieldSign(c.getContext('2d'), c.width / 2, c.height / 2, k, 1, 1);
      return (safePic = { c, k });
    }

    /* ---- the touch zones (TouchZones), in picture pixels: from the top of the meter's case to the foot of the picture,
       left of the taxi and right of it, at its rear bumper, its widest */
    let showZones = false;
    function touchZones(){
      const cg = cabGeometry(), x = W / 2 + sway(run), G = hudGeom(meter.lives != null);
      return hud.touchZones(W, H, H - 14 - (G.outerH + 4) * MS, x - cg.rw / 2, x + cg.rw / 2);
    }

    /* ---- the zone change (ZoneTitle): cn.zoneChange({ take, round, to }, then). zone-time in all: the street dims and the
       caption grows into a title in the middle, the district just finished with its five lamps and takings; the taxi
       jumps under it (to: its new z, then the game's then()) and the street fades across from the old place, kept as a
       still picture, to the new; the next district and its round; then the title shrinks back into the caption and the
       shade lifts. The game holds still meanwhile: the shell calls no update() and the clock does not run. */
    let zone = null;
    function zoneChange(o, then){
      if (!built || zone) return;
      o = o || {};
      const d = DISTRICTS[Math.floor(wrapU((+api.taxi.z || 0) * UPM) / SEG / DIST_LEN) % DISTRICTS.length];
      const take = typeof o.take === 'number' ? o.take.toFixed(2) : String(o.take == null ? '0.00' : o.take);
      zone = { t: 0, o, then: typeof then === 'function' ? then : null, snap: false, swapped: false, ready: false,
        done: { zh: d.zh, en: d.en, done: true, take }, next: null };
    }
    const zoneTimes = () => { const T = hud.times; return { a1: T.zoneIn, a2: T.zoneIn + T.zoneHold, a3: T.zoneIn + T.zoneHold + T.zoneSwap, a4: T.zoneIn + T.zoneHold * 2 + T.zoneSwap, a5: T.zoneIn + T.zoneHold * 2 + T.zoneSwap + T.zoneOut }; };
    function zoneStep(dt){
      zone.t += dt;
      const Z = zoneTimes();
      // the jump, early in the hold on the finished district, so the new place is made while the old one shows
      if (!zone.swapped && zone.snap && zone.t >= Z.a1 + 0.05){
        zone.swapped = true;
        if (zone.o.to != null) api.place({ z: +zone.o.to });
        if (zone.then){ try { zone.then(); } catch (e) { console.error(e); } }
        const d = DISTRICTS[Math.floor(wrapU((+api.taxi.z || 0) * UPM) / SEG / DIST_LEN) % DISTRICTS.length];
        zone.next = { zh: d.zh, en: d.en, round: String(zone.o.round == null ? '' : zone.o.round) };
      }
      if (zone.t >= Z.a5){ zone = null; run.cap.t = 0.6; }   // the title has shrunk back into the caption: it shows at once
    }
    function zoneTarget(){
      if (!T.zone){ const tx = tex2D(PW, PH, gl.LINEAR), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); T.zone = { t: tx, f }; }
      return T.zone;
    }
    // the old place's still picture over the screen, at opacity a (on its own when the new place is not drawn yet)
    function drawStill(a, alone){
      if (alone){ gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, PW, PH); }
      gl.bindBuffer(gl.ARRAY_BUFFER, cabVBO); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, W, 0, 1, 1, W, H, 1, 0, 0, H, 0, 0]), gl.DYNAMIC_DRAW);
      const p = P.ring; gl.useProgram(p.p); gl.bindVertexArray(cabVAO);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      bindT(0, gl.TEXTURE_2D, zoneTarget().t); gl.uniform1i(p.u.uTex, 0); gl.uniform2f(p.u.uView, W, H); gl.uniform1f(p.u.uA, a);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
      gl.disable(gl.BLEND);
    }
    function drawZone(st, fare){
      const Z = zoneTimes(), t = zone.t, ease = u => u * u * (3 - 2 * u);
      if (!zone.snap){ renderGL(st, zoneTarget().f); zone.snap = true; }
      // after the jump, the new place is drawn once off screen (its pieces made there), then on screen as it fades across
      if (zone.swapped && !zone.ready){ renderGL(st, extraTarget()); zone.ready = true; }
      const across = zone.ready ? clamp((t - Z.a2) / (Z.a3 - Z.a2), 0, 1) : 0;
      if (across > 0) renderGL(st);
      if (across < 1) drawStill(1 - across, across === 0);
      clearMarks();
      drawHUD(Object.assign(meterNow(fare), { a: 0 }));   // the caption has grown into the title
      // the shade and the title over everything, on the crash pop's canvas
      clearPop();
      const cv = env.pop, g = cv.getContext('2d'), pk = cv.width / W, k = 0.75 * pk, m = pk / env.cssScale();
      g.setTransform(1, 0, 0, 1, 0, 0);
      const shade = t < Z.a1 ? t / (Z.a1) : t > Z.a4 ? 1 - (t - Z.a4) / (Z.a5 - Z.a4) : 1;
      g.globalAlpha = clamp(shade, 0, 1); g.fillStyle = col('zone-shade'); g.fillRect(0, 0, cv.width, cv.height); g.globalAlpha = 1;
      // grow: 0 at the caption's place and size, 1 in the middle at full size; under Reduce motion the title only fades
      const grow = t < Z.a1 ? ease(t / Z.a1) : t > Z.a4 ? 1 - ease(clamp((t - Z.a4) / (Z.a5 - Z.a4), 0, 1)) : 1;
      const cx = cv.width / 2, cy = cv.height * 0.45;
      const titles = [[zone.done, 1 - across], [zone.next, across]];
      // the caption's Chinese baseline and middle, where the title grows from and shrinks back into
      const G = hudGeom(meter.lives != null), top = (H - 14 - G.outerH * MS) * pk, round = meter.round != null;
      const zhBase = round ? top - 13.7 * k - Math.max(18 * k, 11 * m, Math.max(13 * k, 8 * m) + 6 * k) - 10 * k - 32 * k : top - 18.67 * k - 32 * k;
      g.font = '700 ' + 37.3 * k + 'px "Noto Sans TC", sans-serif';
      for (const [ti, ta] of titles){
        if (!ti || ta <= 0) continue;
        const big = ti.done ? 76 : 92, s0 = 37.3 / big, capX = (14 + 2) * pk + g.measureText(ti.zh).width / 2, capY = zhBase + (ti.done ? 22 : 26) * k * s0;
        if (reduceMotion){ hud.zoneTitle(g, cx, cy, k, m, ti, ta * grow); continue; }
        const s = lerp(s0, 1, grow);
        g.save(); g.translate(lerp(capX, cx, grow), lerp(capY, cy, grow)); g.scale(s, s);
        hud.zoneTitle(g, 0, 0, k, m, ti, ta);
        g.restore();
      }
      popDrawn = true;
    }
    function meterNow(fare){
      return { fare, time: meter.time, kmh: meter.speed != null ? meter.speed : run.speed / UPM * 3.6, d: Math.max(0, run.cap.d), a: run.cap.t / 0.6,
        lives: meter.lives, tip: meter.tip, round: meter.round, fares: meter.fares, receipt: slipNow() };
    }
    // the graphics chip's name, as the browser reports it (for the test page's speed check)
    let chip = null;
    function chipName(){
      if (chip == null){ const dbg = gl.getExtension('WEBGL_debug_renderer_info'); chip = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).replace(/\s+/g, ' ').trim(); }
      return chip;
    }
    // the test page times a frame the speed test's way: each frame of the run is drawn `repeat` times over (the street
    // off screen, the crash pop over itself), so the device can't keep up with the screen and the gap between frames
    // shows what one costs
    let repeat = 1;
    return {
      get ready(){ return built; },
      build, resize, setSmoothing,
      setEffects(on){ effects = !!on; },
      setReduceMotion(on){ reduceMotion = !!on; },
      get repeat(){ return repeat; },
      set repeat(n){ repeat = clamp(Math.round(+n) || 1, 1, 8); },
      info(){ return { width: PW, height: PH, smoothing: built ? samples : 0, sharpness: RS, chip: built ? chipName() : '' }; },
      // the test page: what is on the graphics chip (MB), and how long the street took (ms; readyAt and shownAt since
      // the page began opening)
      memory(){ return gpu.mb(streetBufs); },
      get cost(){ return Object.assign({}, streetCost); },
      // the test page: how long the crash pop's three words last took to draw, and the word the next pop shows
      get pop(){ return { ms: popMade.ms, width: popMade.width, height: popMade.height }; },
      get nextPop(){ return popNext; },
      set nextPop(w){ popNext = POP.words[w] ? w : null; },
      // the title's street: its own life and the slow drive, then the picture
      title(dt){ ambientStep(dt); demoStep(dt); renderGL(demo); clearPop(); clearMarks(); if (!streetCost.shownAt) streetCost.shownAt = performance.now(); },
      reset, step,
      // the run as it stands: the street, then the meter, the caption and the crash pop over it
      draw(fare){
        const st = runScene(); if (popAsk) startPop(st); if (safeAsk) startSafe(st);
        if (zone){ drawZone(st, fare); return; }
        for (let k = 1; k < repeat; k++){ renderGL(st, extraTarget()); drawPop(); }
        renderGL(st); drawMarks(st); drawHUD(meterNow(fare)); drawPop();
        if (!streetCost.shownAt) streetCost.shownAt = performance.now();
      },
      api, meter, receipt, zoneChange, touchZones,
      get holding(){ return !!zone; },
      get showZones(){ return showZones; }, set showZones(v){ showZones = !!v; }
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
    const marksCanvas = el('canvas', 'cn-marks');  // marks that belong to a place in the street: the pin, the taxi's badges, the SAFE! sign
    hudCanvas.setAttribute('aria-hidden', 'true');
    popCanvas.setAttribute('aria-hidden', 'true');
    marksCanvas.setAttribute('aria-hidden', 'true');
    const playUi = el('div', 'cn-play');
    const hintEl = el('div', 'cn-touch-hint', ICON.drag);
    hintEl.append(txt('span', '', touchHint));
    hintEl.hidden = true;
    const meterSr = el('div', 'cn-sr');            // the meter's numbers and the district, for screen readers
    meterSr.setAttribute('aria-live', 'polite');
    const titleScreen = el('div', 'cn-title-screen');
    stage.append(canvas, marksCanvas, hudCanvas, popCanvas, playUi, titleScreen);
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
      'face-green', 'face-yellow', 'face-red', 'face-blue', 'face-cream', 'ink-cream', 'ink-black', 'ink-yellow', 'ink-white', 'ink-red', 'sodium',
      'pop-crash-light', 'pop-crash-deep', 'pop-smash-light', 'pop-smash-deep', 'pop-bang-light', 'pop-bang-deep',
      'tube-green', 'tube-blue', 'tube-violet', 'face-white', 'night-black', 'road-far', 'figure-rim', 'animal-dark', 'animal-lit',
      'eyeshine-amber', 'eyeshine-gold', 'eyeshine-green', 'chicken-light', 'chicken-shade', 'chicken-wing', 'chicken-beak', 'crate-dark', 'crate-cane',
      'oil-dark', 'pothole-lip', 'pothole-edge', 'lamp-amber', 'cone-orange', 'cardboard', 'parcel-tape', 'fruit-orange',
      'coat-red', 'coat-blue', 'coat-olive', 'skin', 'hair-dark', 'trouser-dark', 'suitcase-blue', 'bag-paper',
      'taxi-red', 'shutter', 'caption', 'caption-outline', 'tube-core-blue', 'lamp-unlit', 'lamp-unlit-ring', 'life-lost',
      'receipt-paper', 'receipt-ink', 'receipt-red', 'zone-shade']
      .forEach((t) => { colours[t] = rootStyle.getPropertyValue('--' + t).trim(); });
    const street = makeStreet({ canvas: canvas, gl: gl, hud: hudCanvas, pop: popCanvas, marks: marksCanvas, colours: colours, touch: touch, cssScale: () => V.k });
    let dirty = true;          // the picture needs drawing again while play is stopped (a setting changed, or the window)
    let pendingStart = false;  // Start game pressed before the street was built
    let lost = false;          // the browser took the graphics chip back
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      lost = true;
      errorEl.textContent = 'The graphics chip was reset by the browser. Reload the page to carry on.';
      errorEl.hidden = false;
    });
    /* Picture: Best is 4x edge smoothing at full sharpness, Faster has no smoothing, Fastest also ordinary sharpness.
       Automatic starts at Best and times the first seconds of play, once a visit: after a second to settle, two
       seconds of frames. If they come more than 17.5 ms apart on average (fewer than about 57 a second; a 60 Hz
       screen's frames are 16.7 ms apart, so a device that keeps up never trips it), edge smoothing goes off and it
       times again; if they are still more than 25 ms apart (fewer than 40 a second), it draws at ordinary sharpness. */
    const LEVELS = ['best', 'faster', 'fastest'];
    const auto = { level: 0, phase: 'wait', t: 0, n: 0, sum: 0 };   // phase: wait (for play), settle, time, done
    const pictureLevel = () => (own.picture === 'auto' ? LEVELS[auto.level] : own.picture);
    const pictureSmoothing = () => (pictureLevel() === 'best' ? 4 : 0);
    const pictureSharp = () => (pictureLevel() === 'fastest' ? 1 : MAX_SHARP);
    function applyPicture() {
      street.setSmoothing(pictureSmoothing());
      if (street.ready && !sizeT) applySize();
      dirty = true;
    }
    // gap: seconds since the last frame
    function timePicture(gap) {
      if (own.picture !== 'auto' || auto.phase === 'done' || state.screen !== 'play' || !street.ready || street.repeat > 1) return;
      if (auto.phase === 'wait') { auto.phase = 'settle'; auto.t = 0; return; }
      if (gap > 0.25) return;   // a hitch (the window resized, the tab hidden), not the drawing
      auto.t += gap;
      if (auto.phase === 'settle') {
        if (auto.t >= 1) Object.assign(auto, { phase: 'time', t: 0, n: 0, sum: 0 });
        return;
      }
      auto.n++;
      auto.sum += gap;
      if (auto.t < 2) return;
      const ms = auto.sum / auto.n * 1000;
      if (ms > (auto.level ? 25 : 17.5) && auto.level < 2) {
        auto.level++;
        Object.assign(auto, { phase: auto.level < 2 ? 'settle' : 'done', t: 0 });
        applyPicture();
      } else auto.phase = 'done';
    }
    // frames a second, counted over each half second of real time
    const fpsCount = { n: 0, t: 0, fps: 0 };

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
    // A second finger, down while the first one is: it never moves `pointer`, so one thumb can steer while the other
    // taps or holds; it has its own movement too (dx, dy, moved), so either thumb can drag. A quick tap with it counts
    // as `tap`, like the first finger's.
    const pointer2 = { x: V.W / 2, y: V.H / 2, down: false, pressed: false, released: false, moved: false, dx: 0, dy: 0, id: null, sx: 0, sy: 0, st: 0 };
    // touchZones (a game's choice; Grunge City Rider's): a touch counts only if it starts in one of the two zones, from the
    // top of the meter's case down, either side of the taxi (TouchZones); once started it counts wherever it moves
    let zonesOn = !!cfg.touchZones;
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
      pointer2.moved = false;
      pointer2.dx = 0;
      pointer2.dy = 0;
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
      if (zonesOn && street.ready) {   // outside the zones a touch does nothing
        const px = picX(e), py = picY(e);
        if (!street.touchZones().some((r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1)) return;
      }
      e.preventDefault();
      if (pointer.down && e.pointerId !== pointer.id) {   // a second finger: the first keeps steering
        if (pointer2.down) return;                        // a third is ignored
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        pointer2.id = e.pointerId;
        pointer2.x = picX(e); pointer2.y = picY(e); pointer2.dx = 0; pointer2.dy = 0;
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
      if (pointer2.down && e.pointerId === pointer2.id) {
        const nx = picX(e), ny = picY(e);
        pointer2.dx += nx - pointer2.x; pointer2.dy += ny - pointer2.y; pointer2.x = nx; pointer2.y = ny; pointer2.moved = true;
        return;
      }
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
      applyPicture();
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
      // the zone change holds the game still: no update(), no clock, no timers; the street's own life goes on
      if (state.screen === 'play' && street.holding) { prepareInput(); endTickInput(); street.step(STEP); return; }
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
      const gap = Math.max(0, (now - lastFrame) / 1000);
      const dt = Math.min(0.25, gap) * speed;
      lastFrame = now;
      fpsCount.n++;
      fpsCount.t += gap;
      if (fpsCount.t >= 0.5) { fpsCount.fps = fpsCount.n / fpsCount.t; fpsCount.n = 0; fpsCount.t = 0; }
      timePicture(gap);
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
      /* receipt({ head, lines }): prints the receipt slip out of the top of the meter for receipt-time (0.25 s up, 2 s held,
         0.25 s back in), the caption stepping aside; a new one replaces the one showing. head is 'RECEIPT' or 'TIP'; each line
         is [Chinese, English, amount, style], style 'total' (a dashed rule above, larger), 'receipt-red' (in receipt-red;
         the design system's code calls it 'red') or 'struck' (red, with a line through) (ReceiptSlip). */
      receipt: (o) => street.receipt(o),
      /* zoneChange({ take, round, to }, then): the zone change's film title (ZoneTitle), zone-time in all. The street dims
         and the caption grows into a title: the district the taxi is in, its five lamps lit and take (HK$, the fares and
         tips earned in it); under it the taxi jumps to z = to (metres) and then() is called, for the game to set up the
         new zone; then the district it is in now and 輪 ROUND round. The game holds still meanwhile: update() is not
         called and cn.time does not run. zoning is true while it shows. */
      zoneChange: (o, then) => street.zoneChange(o, then),
      get zoning() { return street.holding; },
      money: money, rand: rand, randInt: randInt, pick: pick, clamp: clamp, lerp: lerp, hit: hit,
      /* The World. The kit draws the street every frame; the game moves what is on it (distances in metres):
         street.taxi     { z, x, speed, brake }: how far along the street (z), across it (x: -1 the left kerb, 1 the right;
                         the lanes are street.lanes), speed in metres a second, and brake (0 to 1; leave it out and the
                         brake lights come on when the taxi slows). The kit adds its sway, roll and suspension.
         street.cars     [{ z, x, kind, tone }]: other traffic; kind is 'taxi', 'sedan', 'van' or 'minibus'
         street.tokens   [{ z, x, kind }]: power-ups; kind is 'time', 'fare', 'speed', 'shield' or 'double'
         street.obstacles [{ z, x, kind }]: 'oil', 'pothole', 'roadworks' (x a lane: closes it, its cones leading out from
                         the kerb side, the barriers 7 m on) or 'cargo'; z is the near end, x the middle across
         street.animals  [{ z, x, kind, face, bolt }]: 'boar', 'dog', 'cat' or 'chickens' (three, by their crate), crossing,
                         facing right (face: -1 for left). Set bolt to -1 or 1 and the kit runs it for that kerb, moving x,
                         and sets gone once it is off the road. Animals always escape: never call crash() for one.
         street.stop     { z, kind, passenger, waiting } or null: the one stop bay, 10 m from z in the kerbside lane on the
                         left; kind 'pickup' or 'dropoff'; passenger 'plain', 'case', 'bags' or null, at the kerb level with
                         its middle, waving while waiting is true (held still under Reduce motion)
         street.traffic(n, seed)  n cars spread over the 560 m from the taxi on, each with a speed (metres a second) for
                         the game to use
         street.recycle(cars)     keeps a list in the 560 m round the taxi: one more than 70 m behind goes round to the far
                         end (and one past the far end comes back), so moving traffic keeps its density; returns the list
         street.place({ z, x })   moves the taxi at once (to another lane, or to a district's start) with no sway, roll
                         or bounce from the move; either may be left out
         street.length   one lap of the street in metres (14,800: Tsim Sha Tsui, Jordan, Yau Ma Tei, Mong Kok, each
                         3,700 m); z wraps round. The kit makes the street's shapes a piece at a time as the taxi drives
         street.districts         [{ index, zh, en, z, length }]: each district, where it starts (z) and its length, in metres
         street.width    the road's width in metres, kerb to kerb (10: x = -1 to 1)
         street.gap(from, to)     metres forward from z = from to z = to, round the lap
         street.size(kind)        { width, length } in metres of a vehicle (z is its rear), an obstacle, an animal or 'bay'
         street.district(z)       { index, zh, en } of the district at z; the caption follows the taxi by itself
         street.crash(z, x)       lights the crash pop (CRASH!, SMASH! or BANG!) over the point where the taxi meets a
                         vehicle, a roadworks barrier or a cone. Clearing what was hit away under it, and moving the taxi
                         into the open lane (street.place), are the game's
         street.safe(z, x)        lights the SAFE! sign, the shielded hit (ShieldSign), over the point of contact, or over
                         the taxi's roof when that is in its own lane; it lives as the crash pop does
         street.signs(z0, z1)     the signs beside the street from z0 to z1: [{ zh, en, z, side }] (side -1 left, 1 right, 0
                         across the road); a destination is named after one of them (TargetPin)
         meter.time, meter.speed  the meter's TIME (two places) and KM/H (left as null: the taxi's own speed); FARE is the fare
         Grunge City Rider's play screen (design system v10):
         meter.lives     0 to 3: the meter becomes Grunge City Rider's, 16 wider, with three small taxis in its heading (a
                         lost one faint) and the tip sharing the time's row; left null, today's meter
         meter.tip       with lives: the tip in HK$ (four places), null for the row unlit (no passenger aboard), or 'lost' for
                         dashes
         meter.round, meter.fares the caption's third line, 輪 ROUND n, and its five lamps, one lit for each fare done (0 to
                         5); round left null, no third line
         street.taxi.hired        true while a passenger is aboard: the TAXI roof sign goes out
         street.taxi.carry        { speed, shield, fare }: the badges under the taxi's rear bumper. speed: 快's time left, 0
                         to 1 (null: none); shield: true while 保 is held (also its ring of light on the road under the
                         taxi); fare: 'fare' (錢) or 'double' (雙) for the fare boost, or null
         street.stop.ring         true once three-quarters of the taxi is in the bay: the bay's ring fades in (ring-fade),
                         and out once it is false (the stop has counted); 保's ring steps aside meanwhile
         street.stop.boarding     true when the passenger gets in: they fade out where they stand over 0.4 s
         street.pin      { name, metres, bare } or null: the neon pin over street.stop's bay, teal 上 for a pick-up, pink 落
                         with the name for a drop-off, and the metres to go; until the bay is in view it stands over the
                         far end of the drawn road in the bay's lane. bare: no tag (once the taxi is in the bay) */
      street: street.api,
      meter: street.meter,
      /* The picture, for the test page: the Picture setting ('auto', 'best', 'faster' or 'fastest') and the level in
         use (Automatic's choice), whether Automatic is still timing, frames a second (over the last half second), the
         canvas in pixels, edge smoothing (4 or 0), canvas pixels per picture pixel, and the graphics chip's name.
         repeat (1 to 8) draws each frame of a run that many times over, the extra ones off screen, to time a frame.
         pop is { ms, width, height }: how long the crash pop's three words took to draw, the last time they were drawn
         (when the street was built, or after a resize), and each one's size in canvas pixels. nextPop ('crash', 'smash'
         or 'bang') is the word the next crash pop shows, so the test page can show each; a game leaves it to the kit.
         memory is what the kit has put on the graphics chip, in MB: { buffers, textures, renderbuffers, street } (street:
         the street's shapes, part of buffers). opening is { build, plan, first, ready, shown, pieces, pieceMs }: how
         long building the street took (ms), and of that, planning the whole street and making its first pieces; when
         Start game began to work and when the first street picture showed (ms since the page began opening); and how
         many pieces of the street have been made so far and how long they took in all (ms). */
      picture: {
        get setting() { return own.picture; },
        get level() { return pictureLevel(); },
        get deciding() { return own.picture === 'auto' && auto.phase !== 'done'; },
        get fps() { return fpsCount.fps; },
        get width() { return street.info().width; },
        get height() { return street.info().height; },
        get smoothing() { return street.info().smoothing; },
        get sharpness() { return street.info().sharpness; },
        get chip() { return street.info().chip; },
        get repeat() { return street.repeat; },
        set repeat(n) { street.repeat = n; },
        get pop() { return street.pop; },
        get nextPop() { return street.nextPop; },
        set nextPop(w) { street.nextPop = w; },
        get memory() { return street.memory(); },
        // the test page: touch zones on or off whatever the game said, and outlined (nothing marks them in a game)
        get touchZones() { return zonesOn; },
        set touchZones(v) { zonesOn = !!v; },
        get showZones() { return street.showZones; },
        set showZones(v) { street.showZones = v; },
        get opening() { const c = street.cost; return { build: c.buildMs, plan: c.planMs, first: c.firstMs, ready: c.readyAt, shown: c.shownAt, pieces: c.pieces, pieceMs: c.pieceMs }; }
      }
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
      layout: layout, music: music, view: V, street: street, auto: auto,
      get dirty() { return dirty; }, set dirty(v) { dirty = !!v; }
    };
    return api;
  }

  // The kit's six font files, loaded before anything shows (or after 2.5 s, whichever is first); the street, and the
  // crash pop's words (Bangers, with its tag in Noto Sans TC), are drawn once they are in
  function whenFontsReady(fn) {
    const faces = [['700 20px Antonio', 'GRUNGE'], ['500 20px "IBM Plex Sans Condensed"', 'Plex'], ['600 20px "IBM Plex Sans Condensed"', 'Plex'],
      ['700 20px "Noto Sans TC"', '最佳車資'], ['900 20px "Noto Serif TC"', '暫停設定'], ['400 20px Bangers', 'CRASH!']];
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
