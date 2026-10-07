/* Retro Kit 1.1 — runtime
   One file, no dependencies. Exposes window.RetroKit. Pair it with retro-kit.css.
   It owns everything every game shares: the pixel canvas and its scaling, the game loop, keyboard and
   touch input, every screen outside play (title, mode choice, pause, game over, initials, high scores,
   settings, rotate), the HUD, sprites, backdrops, glow, pop-ups, banners, screen shake, sound, music
   and saved data.
   A game supplies only its own rules and art: see .claude/skills/retro-kit/SKILL.md. */
(function () {
  'use strict';

  const VERSION = '1.1.0';
  const W = 320;
  const H = 180;
  const STEP = 1 / 60;

  /* ---------- Small helpers ---------- */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const fmt = (v) => (typeof v === 'number' && isFinite(v) ? Math.round(v).toLocaleString('en-GB') : String(v));
  const camel = (t) => t.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const titleCase = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
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

  function seeded(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexRgb(hex) {
    let h = String(hex).trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
  function mixHex(a, b, t) {
    const x = hexRgb(a), y = hexRgb(b);
    return '#' + x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join('');
  }

  /* ---------- Icons (24 viewBox, 2px stroke, currentColor) ---------- */
  const SVG = (body, sw) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  const ICON = {
    play: SVG('<polygon points="7,5 19,12 7,19"/>'),
    sliders: SVG('<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.5"/><circle cx="15" cy="17" r="2.5"/>'),
    trophy: SVG('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4"/><path d="M16 6h3a3 3 0 0 1-3 4"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="8" y1="20" x2="16" y2="20"/>'),
    sound: SVG('<polygon points="4,9 8,9 13,5 13,19 8,15 4,15"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>'),
    soundOff: SVG('<polygon points="4,9 8,9 13,5 13,19 8,15 4,15"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/>'),
    gear: SVG('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
    pause: SVG('<line x1="9" y1="6" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="18"/>', 2.5),
    restart: SVG('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><polyline points="4,4 4,9 9,9"/>'),
    exit: SVG('<path d="M14 4h5v16h-5"/><polyline points="9,8 5,12 9,16"/><line x1="5" y1="12" x2="15" y2="12"/>'),
    drag: SVG('<path d="M4 12h16M7 8l-4 4 4 4M17 8l4 4-4 4"/>'),
    rotate: SVG('<rect x="7" y="2" width="10" height="16" rx="2"/><path d="M3 15a9 9 0 0 0 9 7"/><polyline points="9,19 12,22 9,24"/>'),
    chevUp: '<svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3,8 8,3 13,8"/></svg>',
    chevDown: '<svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3,2 8,7 13,2"/></svg>',
    dart: '<svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6 L7 1 L21 6 L7 11 Z" style="fill:var(--aqua)"/></svg>'
  };

  /* ---------- Colour tokens ---------- */
  const TOKENS = ['ink', 'sky-0', 'sky-1', 'sky-2', 'sky-3', 'sky-4', 'sky-5', 'sky-6', 'hill-far', 'hill-near',
    'chrome-100', 'chrome-200', 'chrome-300', 'chrome-400', 'sun-100', 'aqua', 'aqua-light', 'aqua-dark',
    'red', 'red-light', 'red-dark', 'amber', 'amber-light', 'amber-dark', 'heat', 'heat-light', 'heat-dark'];
  const RAMPS = {
    aqua: ['aqua-light', 'aqua', 'aqua-dark'],
    red: ['red-light', 'red', 'red-dark'],
    amber: ['amber-light', 'amber', 'amber-dark'],
    heat: ['heat-light', 'heat', 'heat-dark'],
    chrome: ['chrome-200', 'chrome-300', 'chrome-400']
  };
  /* Sprite legend: lowercase = light tone, uppercase = base, a separate capital = dark tone. */
  const LEGEND = {
    k: 'ink', W: 'chrome-100', L: 'chrome-200', M: 'chrome-300', D: 'chrome-400', S: 'sun-100',
    a: 'aqua-light', A: 'aqua', Q: 'aqua-dark',
    r: 'red-light', R: 'red', X: 'red-dark',
    y: 'amber-light', Y: 'amber', O: 'amber-dark',
    h: 'heat-light', H: 'heat', E: 'heat-dark',
    f: 'hill-far', n: 'hill-near',
    0: 'sky-0', 1: 'sky-1', 2: 'sky-2', 3: 'sky-3', 4: 'sky-4', 5: 'sky-5', 6: 'sky-6'
  };

  function readColours() {
    const cs = getComputedStyle(document.documentElement);
    const C = {};
    let missing = false;
    TOKENS.forEach((t) => {
      let v = cs.getPropertyValue('--' + t).trim();
      if (!v) { v = '#ff00ff'; missing = true; }
      C[t] = v;
      C[camel(t)] = v;
    });
    if (missing) console.error('Retro Kit: retro-kit.css is not loaded, so colours show as magenta. Link it before retro-kit.js.');
    return C;
  }

  /* ---------- Sprites ---------- */
  function makeSprite(C, def, name) {
    let frames;
    let legend = LEGEND;
    let outline = true;
    if (Array.isArray(def)) frames = typeof def[0] === 'string' ? [def] : def;
    else {
      frames = def.frames || [def.map];
      if (def.legend) legend = Object.assign({}, LEGEND, def.legend);
      if (def.outline === false) outline = false;
    }
    const h = frames[0].length;
    const w = Math.max.apply(null, frames[0].map((r) => r.length));
    const pad = outline ? 1 : 0;
    const ink = hexRgb(C.ink);
    const white = hexRgb(C['chrome-100']);
    const warned = {};
    const flashes = [];
    const canvases = frames.map((rows) => {
      const c = document.createElement('canvas');
      c.width = w + pad * 2;
      c.height = h + pad * 2;
      const g = c.getContext('2d');
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch === '.' || ch === ' ') continue;
          const tok = legend[ch];
          if (!tok || !C[tok]) {
            if (!warned[ch]) { console.warn('Retro Kit: sprite "' + name + '" uses "' + ch + '", which is not in the legend.'); warned[ch] = 1; }
            continue;
          }
          g.fillStyle = C[tok];
          g.fillRect(x + pad, y + pad, 1, 1);
        }
      });
      const cw = c.width;
      const chh = c.height;
      const img = g.getImageData(0, 0, cw, chh);
      const d = img.data;
      const solid = new Uint8Array(cw * chh);
      for (let i = 0; i < cw * chh; i++) solid[i] = d[i * 4 + 3] > 0 ? 1 : 0;
      /* The hit-flash version: the same shape in chrome-100 */
      const fc = document.createElement('canvas');
      fc.width = cw; fc.height = chh;
      const fg = fc.getContext('2d');
      const fimg = fg.createImageData(cw, chh);
      const fd = fimg.data;
      for (let i = 0; i < cw * chh; i++) {
        if (solid[i]) { fd[i * 4] = white[0]; fd[i * 4 + 1] = white[1]; fd[i * 4 + 2] = white[2]; fd[i * 4 + 3] = 255; }
      }
      if (outline) {
        for (let y = 0; y < chh; y++) {
          for (let x = 0; x < cw; x++) {
            const i = y * cw + x;
            if (solid[i]) continue;
            if ((x > 0 && solid[i - 1]) || (x < cw - 1 && solid[i + 1]) || (y > 0 && solid[i - cw]) || (y < chh - 1 && solid[i + cw])) {
              d[i * 4] = fd[i * 4] = ink[0]; d[i * 4 + 1] = fd[i * 4 + 1] = ink[1]; d[i * 4 + 2] = fd[i * 4 + 2] = ink[2]; d[i * 4 + 3] = fd[i * 4 + 3] = 255;
            }
          }
        }
        g.putImageData(img, 0, 0);
      }
      fg.putImageData(fimg, 0, 0);
      flashes.push(fc);
      return c;
    });
    return { name: name, w: w, h: h, pad: pad, frames: canvases, flashes: flashes, flipped: [], flippedFlash: [] };
  }

  function flippedFrame(spr, i, flash) {
    const cache = flash ? spr.flippedFlash : spr.flipped;
    if (!cache[i]) {
      const s = (flash ? spr.flashes : spr.frames)[i];
      const c = document.createElement('canvas');
      c.width = s.width; c.height = s.height;
      const g = c.getContext('2d');
      g.translate(s.width, 0); g.scale(-1, 1); g.drawImage(s, 0, 0);
      cache[i] = c;
    }
    return cache[i];
  }

  /* ---------- Backdrop geometry (game pixels) ---------- */
  const DUSK_BANDS = [[0, 'sky-0'], [50, 'sky-1'], [79, 'sky-2'], [101, 'sky-3'], [117, 'sky-4'], [130, 'sky-5'], [139, 'sky-6']];
  const SPACE_BANDS = [[0, 'ink'], [61, 'sky-0'], [97, 'sky-1'], [126, 'sky-2']];
  const FAR_RIDGE = [[0, 30], [20, 20], [40, 27], [63, 10], [87, 23], [107, 17], [133, 30], [157, 13], [180, 27], [203, 18], [230, 28], [253, 12], [280, 25], [300, 17], [320, 30]];
  const NEAR_RIDGE = [[0, 50], [27, 40], [50, 47], [77, 33], [100, 43], [127, 37], [153, 50], [180, 38], [207, 47], [233, 35], [260, 45], [287, 40], [320, 50]];
  const DUSK_STARS = [[20, 23, 'chrome-200'], [50, 43, 'chrome-400'], [77, 17, 'chrome-300'], [103, 53, 'chrome-400'], [233, 19, 'chrome-200'], [260, 50, 'chrome-400'], [287, 27, 'chrome-300'], [303, 60, 'chrome-400'], [13, 67, 'chrome-400'], [207, 63, 'chrome-400'], [127, 37, 'chrome-300'], [187, 15, 'chrome-200']];

  function makeSteps(seed, minW, maxW, minH, maxH) {
    const r = seeded(seed);
    const steps = [];
    let x = 0;
    while (x < 640) {
      const w = Math.round(lerp(minW, maxW, r()));
      steps.push([x, w, Math.round(lerp(minH, maxH, r()))]);
      x += w;
    }
    return { steps: steps, period: x };
  }
  const FAR_STEPS = makeSteps(7, 14, 30, 14, 30);
  const NEAR_STEPS = makeSteps(11, 18, 40, 6, 16);
  const SPACE_STARS = (function () {
    const r = seeded(3);
    const list = [];
    const cols = ['chrome-200', 'chrome-300', 'chrome-400', 'chrome-400'];
    for (let i = 0; i < 22; i++) list.push([Math.floor(r() * W), Math.floor(r() * 140), cols[Math.floor(r() * cols.length)]]);
    return list;
  })();

  /* ---------- Sound (synthesised; no audio files) ---------- */
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
     Plays on a loop during play, through the same AudioContext as the sound effects. It stops for the
     pause menu and picks up where it left off, starts again from the top with each new game, fades out
     when the game ends, and follows the Volume setting and the sound on/off button. */
  function makeMusic(audio, settings, opts) {
    const share = opts.level == null ? 0.35 : clamp(+opts.level || 0, 0, 1);   // against the sound effects; 1 = the file's full level
    const m = { state: 'idle', buf: null, out: null, src: null, voice: null, t0: 0, offset: 0, loopStart: 0, loopEnd: 0, level: -1 };
    const fail = () => {
      m.state = 'none';
      console.warn('Retro Kit: the music could not be loaded, so the game plays without it.');
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

  /* ---------- Menu navigation (keyboard + pointer) ---------- */
  function makeNav(items, opts, sfx) {
    opts = opts || {};
    let i = 0;
    const nav = {
      items: items,
      select(n, quiet) {
        if (!items.length) return;
        n = ((n % items.length) + items.length) % items.length;
        let guard = 0;
        while (items[n].disabled && guard++ < items.length) n = (n + 1) % items.length;
        if (n !== i && !quiet) sfx('select');
        i = n;
        items.forEach((it, k) => it.el.classList.toggle('is-selected', k === i));
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
      throw new Error('Retro Kit: RetroKit.game() needs start(), update() and draw() functions.');
    }
    const gameId = slug(cfg.id || cfg.title || 'game');
    const title = String(cfg.title || 'UNTITLED').toUpperCase();
    const tagline = String(cfg.tagline || 'A RETRO KIT GAME').toUpperCase();
    const startLives = cfg.lives == null ? 3 : cfg.lives;
    const keysHint = cfg.keys || [['←', '→', '↑', '↓', 'Move'], ['Space', 'Fire'], ['P', 'Pause']];
    const touchHint = cfg.touch || 'Drag to move · Tap to fire';
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const mqPortrait = window.matchMedia('(orientation: portrait)');

    /* Settings, shared by every Retro Kit game on this device */
    const settings = Object.assign({
      volume: 80,
      muted: false,
      effects: true,
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      solid: window.matchMedia('(prefers-reduced-transparency: reduce)').matches
    }, store.get('retrokit.settings', {}));
    const audio = makeAudio(settings);
    function sfx(name) {
      const cue = audio.cues[name];
      if (cue) cue(); else console.warn('Retro Kit: no sound called "' + name + '".');
    }
    sfx.tone = (o) => audio.tone(o || {});
    sfx.noise = (o) => audio.noise(o || {});
    const music = cfg.music ? makeMusic(audio, settings, cfg.music) : null;

    /* Game modes (optional). The player picks one after Start game; the kit remembers it, hands it to
       the game as rk.mode, and keeps a separate high-score table for each. */
    const modes = (Array.isArray(cfg.modes) ? cfg.modes : []).map((m) => {
      const o = typeof m === 'string' ? { id: m } : Object.assign({}, m);
      o.id = slug(o.id || o.label || '');
      o.label = String(o.label || titleCase(o.id));
      return o;
    }).filter((m, i, list) => m.id && list.findIndex((x) => x.id === m.id) === i);
    if (cfg.modes && modes.length < 2) {
      console.warn('Retro Kit: modes needs two or more entries, each with its own id. This game runs without modes.');
      modes.length = 0;
    }
    const modeKey = 'retrokit.mode.' + gameId;
    const modeLabel = (id) => { const m = modes.find((x) => x.id === id); return m ? m.label : ''; };
    function setMode(id) {
      state.mode = id;
      store.set(modeKey, id);
    }

    /* High scores, per game (and per mode, in a game with modes) */
    const scoreKey = (mode) => 'retrokit.scores.' + gameId + (modes.length ? '.' + (mode || state.mode) : '');
    const readScores = (mode) => store.get(scoreKey(mode), []).filter((r) => r && typeof r.s === 'number').sort((a, b) => b.s - a.s).slice(0, 10);
    const bestScore = (mode) => { const t = readScores(mode); return t.length ? t[0].s : 0; };
    if (modes.length && store.get(scoreKey(modes[0].id), null) == null) {
      // Scores saved before this game had modes go to its first mode
      const old = store.get('retrokit.scores.' + gameId, null);
      if (Array.isArray(old) && old.length) store.set(scoreKey(modes[0].id), old);
    }

    /* ----- DOM ----- */
    document.documentElement.lang = document.documentElement.lang || 'en';
    document.title = title.split(/\s+/).filter(Boolean).map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    const root = el('div', 'rk-root rk-ui rk-loading' + (touch ? ' rk-touch' : ''));
    const viewport = el('div', 'rk-viewport');
    const stage = el('div', 'rk-stage');
    const canvas = el('canvas', 'rk-canvas');
    canvas.width = W; canvas.height = H;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', title);
    const fx = el('canvas', 'rk-fxcanvas');
    const world = el('div', 'rk-world');
    stage.append(canvas, fx, world);
    viewport.append(stage);
    const hintEl = el('div', 'rk-chip is-compact rk-hint rk-touch-hint', ICON.drag + '<span></span>');
    hintEl.querySelector('span').textContent = touchHint;
    hintEl.hidden = true;
    if (touch) viewport.append(hintEl);
    const barSlot = el('div', 'rk-bar-slot');
    const titleScreen = el('div', 'rk-screen rk-title-screen');
    const dialogLayer = el('div', 'rk-dialog-layer');
    dialogLayer.hidden = true;
    const rotateEl = el('div', 'rk-rotate', '<div class="rk-panel">' + ICON.rotate + '<h2 class="rk-heading">Rotate your phone</h2><p class="rk-body"></p></div>');
    rotateEl.querySelector('p').textContent = 'This game plays in landscape.';
    const errorEl = el('div', 'rk-chip is-compact rk-hint');
    errorEl.style.cssText = 'position:absolute;left:50%;top:12px;transform:translateX(-50%);background:var(--red);color:var(--ink);border-color:var(--red);display:none;z-index:5;white-space:normal;max-width:90%';
    root.append(viewport, barSlot, titleScreen, dialogLayer, rotateEl, errorEl);
    document.body.append(root);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const fxctx = fx.getContext('2d');
    const C = readColours();

    /* ----- Drawing ----- */
    const warnedColours = {};
    function col(c) {
      if (C[c]) return C[c];
      if (!warnedColours[c]) { console.warn('Retro Kit: "' + c + '" is not a colour token. Use a token name such as "aqua" or "chrome-300".'); warnedColours[c] = 1; }
      return c;
    }
    function rect(x, y, w, h, colour, alpha) {
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.fillStyle = col(colour);
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      ctx.globalAlpha = 1;
    }
    function px(x, y, colour) { rect(x, y, 1, 1, colour); }
    function circle(cx, cy, r, colour) {
      ctx.fillStyle = col(colour);
      cx = Math.round(cx); cy = Math.round(cy); r = Math.max(1, Math.round(r));
      for (let y = 0; y < r * 2; y++) {
        const yy = y + 0.5 - r;
        const half = Math.sqrt(Math.max(0, r * r - yy * yy));
        const x0 = Math.round(cx - half);
        const x1 = Math.round(cx + half);
        if (x1 > x0) ctx.fillRect(x0, cy - r + y, x1 - x0, 1);
      }
    }
    function block(x, y, w, h, ramp) {
      const r = RAMPS[ramp] || RAMPS.chrome;
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      ctx.fillStyle = C.ink;
      ctx.fillRect(x + 1, y, w - 2, 1);
      ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
      ctx.fillRect(x, y + 1, 1, h - 2);
      ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
      ctx.fillStyle = C[r[1]]; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = C[r[0]]; ctx.fillRect(x + 1, y + 1, w - 2, 1);
      ctx.fillStyle = C[r[2]]; ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
    }

    const sprites = {};
    function sprite(name) {
      if (typeof name !== 'string') return name;
      const s = sprites[name];
      if (!s) throw new Error('Retro Kit: no sprite called "' + name + '". Add it to the game\'s sprites.');
      return s;
    }
    function draw(nameOrSprite, x, y, frame, opts) {
      const s = sprite(nameOrSprite);
      const i = (frame || 0) % s.frames.length;
      const flash = !!(opts && opts.flash);
      const img = opts && opts.flip ? flippedFrame(s, i, flash) : (flash ? s.flashes : s.frames)[i];
      if (opts && opts.alpha != null) ctx.globalAlpha = opts.alpha;
      ctx.drawImage(img, Math.round(x) - s.pad, Math.round(y) - s.pad);
      ctx.globalAlpha = 1;
    }
    function frameAt(nameOrSprite, fps, t) {
      const s = sprite(nameOrSprite);
      const time = t != null ? t : state.inGame ? state.time : state.t;
      return Math.floor(time * (fps || 8)) % s.frames.length;
    }

    /* Backdrops */
    function bands(list) {
      for (let i = 0; i < list.length; i++) {
        const y0 = list[i][0];
        const y1 = i + 1 < list.length ? list[i + 1][0] : H;
        ctx.fillStyle = C[list[i][1]];
        ctx.fillRect(0, y0, W, y1 - y0);
      }
    }
    function ridge(points, base, colour, offset) {
      const period = points[points.length - 1][0];
      ctx.fillStyle = C[colour];
      for (let x = 0; x < W; x++) {
        const p = (((x + offset) % period) + period) % period;
        let i = 0;
        while (i < points.length - 2 && points[i + 1][0] <= p) i++;
        const a = points[i];
        const b = points[i + 1];
        const y = Math.round(base + a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0]));
        ctx.fillRect(x, y, 1, H - y);
      }
    }
    function steps(t, colour, offset) {
      ctx.fillStyle = C[colour];
      const off = ((offset % t.period) + t.period) % t.period;
      for (let rep = 0; rep <= 1; rep++) {
        for (const s of t.steps) {
          const x = Math.round(s[0] - off + rep * t.period);
          if (x + s[1] < 0 || x > W) continue;
          ctx.fillRect(x, H - s[2], s[1], s[2]);
        }
      }
    }
    let planetCanvas = null;
    function planet() {
      if (planetCanvas) return planetCanvas;
      const r = 25;
      const d = r * 2 + 2;
      const c = document.createElement('canvas');
      c.width = d; c.height = d;
      const g = c.getContext('2d');
      const stops = [[0.14, 'sun-100'], [0.38, 'amber'], [0.64, 'sky-6'], [0.84, 'sky-5'], [1.01, 'sky-4']];
      const dir = [Math.sin(160 * Math.PI / 180), -Math.cos(160 * Math.PI / 180)];
      const len = 2 * r * (Math.abs(dir[0]) + Math.abs(dir[1]));
      for (let y = 0; y < d; y++) {
        for (let x = 0; x < d; x++) {
          const dx = x + 0.5 - d / 2;
          const dy = y + 0.5 - d / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > r + 1) continue;
          if (dist > r) { g.fillStyle = C.ink; g.fillRect(x, y, 1, 1); continue; }
          const t = 0.5 + (dx * dir[0] + dy * dir[1]) / len;
          let colour = stops[stops.length - 1][1];
          for (const s of stops) { if (t < s[0]) { colour = s[1]; break; } }
          const sx = dx + 10;
          const sy = dy + 5;
          const shade = Math.sqrt(sx * sx + sy * sy) > r;
          g.fillStyle = shade ? mixHex(C[colour], C.ink, 0.5) : C[colour];
          g.fillRect(x, y, 1, 1);
        }
      }
      planetCanvas = c;
      return c;
    }
    const backdrop = {
      dusk(o) {
        o = o || {};
        const scroll = o.scroll || 0;
        bands(DUSK_BANDS);
        for (const s of DUSK_STARS) { ctx.fillStyle = C[s[2]]; ctx.fillRect(s[0], s[1], 1, 1); }
        if (o.sun !== false) {
          const cx = 160, cy = 129, r = 30;
          for (let y = 0; y < r * 2; y++) {
            const yy = y + 0.5 - r;
            const half = Math.sqrt(r * r - yy * yy);
            const f = y / (r * 2);
            ctx.fillStyle = C[f < 0.16 ? 'sun-100' : f < 0.5 ? 'amber' : 'sky-6'];
            const x0 = Math.round(cx - half);
            ctx.fillRect(x0, cy - r + y, Math.round(cx + half) - x0, 1);
          }
          glow(cx, cy, 52, 'amber', 0.3);
        }
        ridge(FAR_RIDGE, 110, 'hill-far', scroll * 0.25);
        ridge(NEAR_RIDGE, 110, 'hill-near', scroll * 0.5);
        ctx.fillStyle = C.ink;
        ctx.fillRect(0, 166, W, H - 166);
      },
      space(o) {
        o = o || {};
        const scroll = o.scroll || 0;
        bands(SPACE_BANDS);
        for (const s of SPACE_STARS) {
          ctx.fillStyle = C[s[2]];
          ctx.fillRect(((Math.round(s[0] - scroll * 0.1) % W) + W) % W, s[1], 1, 1);
        }
        if (o.planet !== false) {
          const p = planet();
          const x = Math.round(257 - scroll * 0.03);
          ctx.drawImage(p, ((x + p.width) % (W + p.width) + W + p.width) % (W + p.width) - p.width, 15);
        }
        if (o.terrain !== false) {
          steps(FAR_STEPS, 'sky-1', scroll * 0.25);
          steps(NEAR_STEPS, 'sky-0', scroll * 0.5);
        }
      }
    };

    /* Glow: soft halos on a full-resolution layer above the pixels (Effects setting) */
    const glowQueue = [];
    function glow(x, y, r, colour, alpha) {
      if (!settings.effects) return;
      glowQueue.push([x, y, r, col(colour || 'aqua'), alpha == null ? 0.45 : alpha]);
    }
    function flushGlow(sx, sy) {
      fxctx.setTransform(1, 0, 0, 1, 0, 0);
      fxctx.clearRect(0, 0, fx.width, fx.height);
      if (!glowQueue.length) return;
      const k = fx.width / W;
      for (const g of glowQueue) {
        const gx = (g[0] + sx) * k;
        const gy = (g[1] + sy) * k;
        const gr = Math.max(1, g[2] * k);
        const grad = fxctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        grad.addColorStop(0, rgba(g[3], g[4]));
        grad.addColorStop(1, rgba(g[3], 0));
        fxctx.fillStyle = grad;
        fxctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
      glowQueue.length = 0;
    }

    /* Pop-ups and banners (World layer, as DOM over the canvas so text stays crisp) */
    function popup(text, x, y, colour) {
      const p = el('div', 'rk-popup');
      p.textContent = text;
      p.style.left = (x / W * 100) + '%';
      p.style.top = (y / H * 100) + '%';
      p.style.color = 'var(--' + (C[colour] ? colour : 'aqua') + ')';
      world.append(p);
      p.addEventListener('animationend', () => p.remove());
      setTimeout(() => p.remove(), 30000);
    }
    function banner(text, seconds) {
      const b = el('div', 'rk-banner', '<div class="rk-banner-wrap"><div class="rk-logo"><span></span></div></div>');
      b.querySelector('span').textContent = String(text).toUpperCase();
      world.append(b);
      after(seconds == null ? 1.5 : seconds, () => b.remove());
      return b;
    }

    /* ----- Game state ----- */
    const state = {
      screen: 'title',   // title | modes | play | paused | over | initials | scores | settings
      inGame: false,
      game: null,
      mode: modes.length ? (modes.find((m) => m.id === store.get(modeKey, null)) || modes[0]).id : null,   // the mode in play, or the one last picked
      score: 0,
      lives: startLives,
      time: 0,
      t: 0,
      ending: false,
      timers: [],
      shakeAmt: 0,
      shakeT: 0,
      errored: false
    };
    function after(seconds, fn) { state.timers.push({ at: state.time + seconds, fn: fn }); }
    function shake(amount, seconds) {
      if (settings.reduceMotion) return;
      state.shakeAmt = Math.min(4, Math.max(state.shakeAmt, amount == null ? 2 : amount));
      state.shakeT = Math.min(0.25, Math.max(state.shakeT, seconds == null ? 0.2 : seconds));
    }

    /* ----- Input ----- */
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
    const pointer = { x: W / 2, y: H / 2, down: false, pressed: false, released: false, moved: false, dx: 0, dy: 0, id: null, sx: 0, sy: 0, st: 0 };
    let tapPending = false;
    const input = {
      left: false, right: false, up: false, down: false, fire: false, alt: false,
      pressed: { left: false, right: false, up: false, down: false, fire: false, alt: false },
      pointer: pointer,
      tap: false,
      any: false,
      key: (code) => keys.has(code),
      keyPressed: (code) => justKeys.has(code)
    };
    function prepareInput() {
      for (const name in KEYMAP) {
        input[name] = KEYMAP[name].some((c) => keys.has(c));
        input.pressed[name] = KEYMAP[name].some((c) => justKeys.has(c));
      }
      input.tap = tapPending;
      input.any = justKeys.size > 0 || tapPending || pointer.pressed;
    }
    function endTickInput() {
      justKeys.clear();
      pointer.pressed = false;
      pointer.released = false;
      pointer.moved = false;
      pointer.dx = 0;
      pointer.dy = 0;
      tapPending = false;
    }
    function resetInput() {
      keys.clear();
      stale = new Set(physical);
      endTickInput();
      pointer.down = false;
      pointer.id = null;
    }
    let stageRect = null;
    function setPointer(e) {
      if (!stageRect) stageRect = stage.getBoundingClientRect();
      const nx = (e.clientX - stageRect.left) / stageRect.width * W;
      const ny = (e.clientY - stageRect.top) / stageRect.height * H;
      pointer.dx += nx - pointer.x;
      pointer.dy += ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
      pointer.moved = true;
    }
    viewport.addEventListener('pointerdown', (e) => {
      audio.unlock();
      if (state.screen !== 'play') return;
      e.preventDefault();
      try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      pointer.id = e.pointerId;
      setPointer(e);
      pointer.dx = 0; pointer.dy = 0;
      pointer.down = true;
      pointer.pressed = true;
      pointer.sx = e.clientX; pointer.sy = e.clientY; pointer.st = performance.now();
      hintEl.hidden = true;
    });
    viewport.addEventListener('pointermove', (e) => {
      if (state.screen !== 'play') return;
      if (pointer.down && e.pointerId !== pointer.id) return;
      setPointer(e);
    });
    const pointerEnd = (e) => {
      if (e.pointerId !== pointer.id) return;
      pointer.down = false;
      pointer.released = true;
      pointer.id = null;
      if (state.screen !== 'play') return;
      const moved = Math.hypot(e.clientX - pointer.sx, e.clientY - pointer.sy);
      if (moved < 10 && performance.now() - pointer.st < 300) tapPending = true;
    };
    viewport.addEventListener('pointerup', pointerEnd);
    viewport.addEventListener('pointercancel', pointerEnd);
    // Sound may only start from a key press or a tap (on some phones, only as the finger lifts). A phone
    // can also put sound to sleep (a call, switching apps): the next tap or key wakes it.
    ['pointerdown', 'touchend'].forEach((type) => window.addEventListener(type, () => audio.unlock(), true));

    /* ----- HUD ----- */
    const BUILTIN = {
      score: { label: 'Score', type: 'num' },
      best: { label: 'Best', type: 'num' },
      lives: { label: 'Lives', type: 'lives' },
      stage: { label: 'Stage', type: 'text' },
      level: { label: 'Level', type: 'num' },
      wave: { label: 'Wave', type: 'num' },
      round: { label: 'Round', type: 'num' },
      time: { label: 'Time', type: 'num' }
    };
    const hudItems = (cfg.hud || ['score', 'best', 'lives']).map((it) => {
      const o = typeof it === 'string' ? { id: it } : Object.assign({}, it);
      return Object.assign({ label: titleCase(o.id), type: 'num' }, BUILTIN[o.id] || {}, o);
    });
    const hudVals = {};
    const hudNodes = {};
    hudItems.forEach((it) => { hudVals[it.id] = it.value != null ? it.value : (it.type === 'meter' ? 0 : it.type === 'text' ? '' : 0); });

    function statNode(it, compact) {
      if (it.type === 'lives') {
        const n = el('div', compact ? 'rk-tb-lives' : 'rk-stat is-lives');
        if (!compact) n.append(el('span', 'rk-label', it.label));
        const l = el('div', 'rk-lives');
        l.setAttribute('aria-label', it.label);
        n.append(l);
        return { root: n, lives: l };
      }
      if (it.type === 'meter') {
        const n = el('div', compact ? 'rk-tb-cell is-mid' : 'rk-stat is-meter');
        n.append(el('span', 'rk-label', it.label));
        const row = el('div', 'rk-meter-row');
        const m = el('div', 'rk-meter');
        m.style.width = (compact ? 96 : (it.width || 160)) + 'px';
        m.setAttribute('role', 'meter');
        m.setAttribute('aria-label', it.label);
        m.setAttribute('aria-valuemin', '0');
        m.setAttribute('aria-valuemax', '100');
        const fill = el('i');
        m.append(fill);
        const num = el('span', 'rk-num');
        row.append(m, num);
        n.append(row);
        return { root: n, meter: m, fill: fill, num: num };
      }
      const n = el('div', compact ? 'rk-tb-cell' : 'rk-stat');
      n.append(el('span', 'rk-label', it.label));
      const num = el('span', 'rk-num');
      n.append(num);
      return { root: n, num: num };
    }
    function pauseButton() {
      const b = el('button', 'rk-ibtn', ICON.pause);
      b.setAttribute('aria-label', 'Pause');
      b.addEventListener('click', () => pause());
      return b;
    }
    function buildHud() {
      barSlot.innerHTML = '';
      if (!touch) {
        const hud = el('div', 'rk-hud');
        const panel = el('div', 'rk-panel');
        hudItems.forEach((it, k) => {
          if (k > 0) panel.append(el('div', 'rk-sep'));
          const n = statNode(it, false);
          if (k === 0) n.root.style.minWidth = '88px';
          hudNodes[it.id] = n;
          panel.append(n.root);
        });
        panel.append(pauseButton());
        hud.append(panel);
        barSlot.append(hud);
      } else {
        const bar = el('div', 'rk-topbar');
        const panel = el('div', 'rk-panel');
        const first = hudItems.find((it) => it.id === 'score') || hudItems.find((it) => it.type === 'num' && it.id !== 'best');
        const mid = cfg.phoneMid ? hudItems.find((it) => it.id === cfg.phoneMid)
          : hudItems.find((it) => ['stage', 'level', 'wave', 'round'].indexOf(it.id) >= 0)
            || hudItems.find((it) => it !== first && ['best', 'lives'].indexOf(it.id) < 0);
        const lives = hudItems.find((it) => it.type === 'lives');
        const c1 = first ? statNode(first, true) : { root: el('div', 'rk-tb-cell') };
        const c2 = mid ? statNode(mid, true) : { root: el('div', 'rk-tb-cell') };
        c2.root.classList.add('is-mid');
        const c3 = el('div', 'rk-tb-cell is-end');
        if (first) hudNodes[first.id] = c1;
        if (mid) hudNodes[mid.id] = c2;
        if (lives) { const ln = statNode(lives, true); hudNodes[lives.id] = ln; c3.append(ln.lives); }
        c3.append(pauseButton());
        panel.append(c1.root, c2.root, c3);
        bar.append(panel);
        barSlot.append(bar);
      }
      hudItems.forEach((it) => renderHud(it.id));
    }
    function renderHud(id) {
      const n = hudNodes[id];
      if (!n) return;
      const it = hudItems.find((h) => h.id === id);
      const v = hudVals[id];
      if (it.type === 'lives') {
        const count = Math.max(0, v | 0);
        const shown = Math.min(count, 5);
        let html = '';
        for (let i = 0; i < shown; i++) html += touch || cfg.livesIcon === 'dot' ? '<span class="rk-dot"></span>' : ICON.dart;
        if (count > shown) html += '<span class="rk-num" style="font-size:13px">+' + (count - shown) + '</span>';
        n.lives.innerHTML = html;
        n.lives.setAttribute('aria-label', count + ' ' + (count === 1 ? 'life' : 'lives'));
      } else if (it.type === 'meter') {
        const f = clamp(+v || 0, 0, 1);
        n.fill.style.width = (f * 100) + '%';
        n.meter.classList.toggle('is-full', f >= 1);
        n.meter.classList.toggle('is-low', it.low != null && f < it.low);
        n.meter.setAttribute('aria-valuenow', String(Math.round(f * 100)));
        n.num.textContent = f >= 1 ? (it.full || 'Ready') : Math.round(f * 100) + '%';
      } else {
        n.num.textContent = fmt(v);
      }
    }
    const hud = {
      set(id, value) {
        if (!(id in hudVals)) { console.warn('Retro Kit: HUD has no "' + id + '". Add it to hud in the game config.'); return; }
        if (hudVals[id] === value) return;
        hudVals[id] = value;
        renderHud(id);
      },
      get: (id) => hudVals[id]
    };
    function syncBuiltins() {
      if ('score' in hudVals) hud.set('score', state.score);
      if ('best' in hudVals) hud.set('best', Math.max(bestScore(), state.score));
      if ('lives' in hudVals) hud.set('lives', state.lives);
    }

    /* ----- Layout: whole-number scaling in screen pixels ----- */
    function layout() {
      barSlot.style.display = state.inGame ? '' : 'none';
      titleScreen.hidden = state.inGame;
      root.classList.toggle('rk-in-game', state.inGame);
      const r = viewport.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const k = Math.max(1, Math.floor(Math.min(r.width * dpr / W, r.height * dpr / H)));
      const cw = W * k / dpr;
      const ch = H * k / dpr;
      stage.style.width = cw + 'px';
      stage.style.height = ch + 'px';
      root.style.setProperty('--rk-sw', cw + 'px');
      const fw = Math.round(cw * dpr);
      const fh = Math.round(ch * dpr);
      if (fx.width !== fw || fx.height !== fh) { fx.width = fw; fx.height = fh; }
      stageRect = null;
    }
    if (window.ResizeObserver) new ResizeObserver(layout).observe(viewport);
    window.addEventListener('resize', layout);

    /* ----- Settings ----- */
    function applySettings() {
      root.classList.toggle('rk-fx', !!settings.effects);
      root.classList.toggle('rk-solid', !!settings.solid);
      root.classList.toggle('rk-reduce-motion', !!settings.reduceMotion);
      audio.apply();
      store.set('retrokit.settings', settings);
      const sb = titleScreen.querySelector('[data-act="sound"]');
      if (sb) {
        sb.innerHTML = settings.muted ? ICON.soundOff : ICON.sound;
        sb.setAttribute('aria-label', settings.muted ? 'Sound off' : 'Sound on');
        sb.setAttribute('aria-pressed', settings.muted ? 'true' : 'false');
      }
    }

    /* ----- Dialogs ----- */
    let nav = null;
    let titleNav = null;
    function openDialog(panel, items, opts) {
      dialogLayer.innerHTML = '';
      dialogLayer.append(el('div', 'rk-scrim'), panel);
      dialogLayer.hidden = false;
      nav = makeNav(items, opts, sfx);
    }
    function closeDialog() {
      dialogLayer.hidden = true;
      dialogLayer.innerHTML = '';
      nav = state.inGame ? null : titleNav;
    }
    function dialogPanel(labelId, cls) {
      const p = el('div', 'rk-panel rk-dialog' + (cls ? ' ' + cls : ''));
      p.setAttribute('role', 'dialog');
      p.setAttribute('aria-modal', 'true');
      p.setAttribute('aria-labelledby', labelId);
      return p;
    }
    function menuItem(icon, label, kbd, note) {
      const b = el('button', 'rk-item' + (note ? ' has-note' : ''), icon + '<span></span>' + (kbd ? '<span class="rk-kbd"></span>' : ''));
      b.querySelector('span').textContent = label;
      if (note) {   // a second, smaller line under the label
        const n = el('span', 'rk-item-note');
        n.textContent = note;
        b.querySelector('span').append(n);
      }
      if (kbd) b.querySelector('.rk-kbd').textContent = kbd;
      return b;
    }
    function button(label, primary, kbd) {
      const b = el('button', 'rk-btn' + (primary ? ' is-primary' : ''), '<span></span>' + (kbd && !touch ? '<span class="rk-kbd"></span>' : ''));
      b.querySelector('span').textContent = label;
      if (kbd && !touch) b.querySelector('.rk-kbd').textContent = kbd;
      return b;
    }

    function openPause() {
      const p = dialogPanel('rk-pause-title');
      p.style.width = '340px';
      p.append(el('h2', 'rk-heading', 'Paused'));
      p.firstChild.id = 'rk-pause-title';
      const m = el('div', 'rk-menu');
      const items = [
        { el: menuItem(ICON.play, 'Resume', 'Esc'), activate: resume },
        { el: menuItem(ICON.restart, 'Restart'), activate: () => { sfx('confirm'); closeDialog(); startGame(); } },
        { el: menuItem(ICON.gear, 'Settings'), activate: () => openSettings('paused') },
        { el: menuItem(ICON.exit, 'Quit to menu'), activate: () => { sfx('back'); quitToTitle(); } }
      ];
      items.forEach((it) => m.append(it.el));
      p.append(m);
      openDialog(p, items, { back: resume });
    }

    function openSettings(from) {
      const prev = state.screen;
      state.screen = 'settings';
      sfx('confirm');
      const p = dialogPanel('rk-set-title');
      p.style.width = '420px';
      const h = el('h2', 'rk-heading', 'Settings');
      h.id = 'rk-set-title';
      p.append(h);
      const rows = [];
      // Volume
      const vol = el('div', 'rk-setting-row');
      vol.style.flexDirection = 'column';
      vol.style.alignItems = 'stretch';
      vol.style.gap = '8px';
      vol.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline"><label class="rk-setting" for="rk-vol">Volume</label><span class="rk-num" style="font-size:13px"></span></div><input class="rk-slider" id="rk-vol" type="range" min="0" max="100" step="5">';
      const slider = vol.querySelector('input');
      const volNum = vol.querySelector('.rk-num');
      const showVol = () => { slider.value = settings.volume; volNum.textContent = settings.muted ? 'Muted' : settings.volume + '%'; };
      const setVol = (v) => { settings.volume = clamp(v, 0, 100); settings.muted = false; applySettings(); showVol(); sfx('blip'); };
      slider.addEventListener('input', () => setVol(+slider.value));
      showVol();
      rows.push({ el: vol, left: () => setVol(settings.volume - 10), right: () => setVol(settings.volume + 10), click: () => {} });
      const toggles = [
        ['effects', 'Effects', 'Glow and halos around bright objects.'],
        ['reduceMotion', 'Reduce motion', 'No screen shake. Follows your device setting.'],
        ['solid', 'Solid panels', 'Replaces glass with solid panels. Faster on older phones.']
      ];
      toggles.forEach((t) => {
        const row = el('div', 'rk-setting-row', '<div><div class="rk-setting"></div><p class="rk-body"></p></div><button class="rk-toggle" role="switch"></button>');
        row.querySelector('.rk-setting').textContent = t[1];
        row.querySelector('.rk-setting').id = 'rk-set-' + t[0];
        row.querySelector('.rk-body').textContent = t[2];
        const sw = row.querySelector('.rk-toggle');
        sw.setAttribute('aria-labelledby', 'rk-set-' + t[0]);
        const show = () => sw.setAttribute('aria-checked', settings[t[0]] ? 'true' : 'false');
        show();
        const flip = () => { settings[t[0]] = !settings[t[0]]; applySettings(); show(); sfx('blip'); };
        rows.push({ el: row, activate: flip, left: flip, right: flip });
      });
      rows.forEach((r) => p.append(r.el));
      const done = button('Done', true, 'Esc');
      p.append(done);
      const close = () => {
        sfx('back');
        if (from === 'paused') { state.screen = 'paused'; openPause(); }
        else { state.screen = prev === 'settings' ? 'title' : prev; closeDialog(); }
      };
      rows.push({ el: done, activate: close });
      openDialog(p, rows, { back: close });
    }

    /* Choosing a mode: opens from Start game in a game with modes */
    function openModes() {
      state.screen = 'modes';
      const p = dialogPanel('rk-mode-title');
      p.style.width = '420px';
      const h = el('h2', 'rk-heading', 'Choose a mode');
      h.id = 'rk-mode-title';
      const m = el('div', 'rk-menu');
      const items = modes.map((mode) => {
        const b = menuItem(ICON.play, mode.label, 'Enter', mode.description);
        m.append(b);
        return { el: b, activate: () => { sfx('confirm'); setMode(mode.id); startGame(); } };
      });
      const row = el('div', 'rk-dialog-buttons');
      const back = button('Back', false, 'Esc');
      row.append(back);
      const close = () => { sfx('back'); state.screen = 'title'; closeDialog(); };
      items.push({ el: back, activate: close });
      p.append(h, m, row);
      openDialog(p, items, { back: close, start: Math.max(0, modes.findIndex((x) => x.id === state.mode)) });
    }

    function scoreTable(highlight, mode) {
      const table = readScores(mode);
      if (!table.length) return el('p', 'rk-body rk-scores-empty', 'No scores yet. Be the first.');
      const t = el('table', 'rk-scores');
      table.forEach((r, i) => {
        const tr = el('tr', i === highlight ? 'is-new' : '');
        const a = el('td'); a.textContent = String(i + 1);
        const b = el('td'); b.textContent = r.i || '---';
        const c = el('td'); c.textContent = fmt(r.s);
        tr.append(a, b, c);
        t.append(tr);
      });
      return t;
    }

    function openScores(highlight, afterGame) {
      state.screen = 'scores';
      const p = dialogPanel('rk-hs-title');
      p.style.width = '360px';
      const h = el('h2', 'rk-heading', 'High scores');
      h.id = 'rk-hs-title';
      let table = scoreTable(highlight);
      let stepMode = null;
      if (modes.length && afterGame) {
        // After a game: the table for the mode just played, with its name beside the heading
        const head = el('div', 'rk-dialog-row');
        head.style.cssText = 'justify-content:space-between;align-items:baseline';
        const lab = el('span', 'rk-label');
        lab.textContent = modeLabel(state.mode);
        head.append(h, lab);
        p.append(head, table);
      } else if (modes.length) {
        // From the title: a tab for each mode's table (left and right arrows, or a tap)
        let view = state.mode;
        const bar = el('div', 'rk-tabs');
        const list = el('div', 'rk-tablist');
        list.setAttribute('role', 'tablist');
        list.setAttribute('aria-label', 'Mode');
        const tabs = modes.map((mode) => {
          const b = el('button', 'rk-tab');
          b.textContent = mode.label;
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
        const hint = (k) => { const s = el('span', 'rk-kbd'); s.textContent = k; return s; };
        if (touch) bar.append(list);
        else bar.append(hint('←'), list, hint('→'));
        p.append(h, bar, table);
      } else p.append(h, table);
      const row = el('div', 'rk-dialog-buttons');
      let items;
      if (afterGame) {
        const again = button('Play again', true, 'Enter');
        const menu = button('Menu');
        row.append(again, menu);
        items = [{ el: again, activate: () => { sfx('confirm'); closeDialog(); startGame(); } }, { el: menu, activate: () => { sfx('back'); quitToTitle(); } }];
        openDialog(p, items, { back: () => { sfx('back'); quitToTitle(); } });
      } else {
        const back = button('Back', true, 'Esc');
        row.append(back);
        const close = () => { sfx('back'); state.screen = 'title'; closeDialog(); };
        items = [{ el: back, activate: close }];
        if (stepMode) { items[0].left = () => stepMode(-1); items[0].right = () => stepMode(1); }
        p.append(row);
        openDialog(p, items, { back: close });
        return;
      }
      p.append(row);
    }

    function showGameOver() {
      state.screen = 'over';
      state.ending = false;
      sfx('gameOver');
      const table = readScores();
      const prevBest = table.length ? table[0].s : 0;
      const score = state.score;
      const newBest = score > 0 && score > prevBest;
      const qualifies = score > 0 && (table.length < 10 || score > table[table.length - 1].s);
      if (newBest) setTimeout(() => sfx('newBest'), 650);
      const p = dialogPanel('rk-go-title', 'rk-dialog-center');
      p.style.width = '360px';
      const head = el('div', 'rk-dialog-row');
      const h = el('h2', 'rk-heading', 'Game over');
      h.id = 'rk-go-title';
      head.append(h);
      if (newBest) head.append(el('span', 'rk-badge', ICON.trophy.replace('<svg ', '<svg width="14" height="14" ') + 'New best'));
      const big = el('div', 'rk-num');
      big.style.cssText = 'font-size:44px;line-height:48px';
      big.textContent = fmt(score);
      p.append(head, big);
      if (prevBest > 0) {
        const line = el('div', 'rk-dialog-row');
        line.style.alignItems = 'baseline';
        line.append(el('span', 'rk-label', newBest ? 'Previous best' : 'Best'));
        const v = el('span', 'rk-num'); v.style.fontSize = '15px'; v.textContent = fmt(prevBest);
        line.append(v);
        p.append(line);
      }
      const row = el('div', 'rk-dialog-buttons');
      let items;
      if (qualifies) {
        const cont = button('Continue', true, 'Enter');
        row.append(cont);
        items = [{ el: cont, activate: () => { sfx('confirm'); openInitials(newBest); } }];
      } else {
        const again = button('Play again', true, 'Enter');
        const menu = button('Menu');
        row.append(again, menu);
        items = [{ el: again, activate: () => { sfx('confirm'); closeDialog(); startGame(); } }, { el: menu, activate: () => { sfx('back'); quitToTitle(); } }];
      }
      p.append(row);
      openDialog(p, items, qualifies ? {} : { back: () => { sfx('back'); quitToTitle(); } });
    }

    /* Initials entry: its own key handling */
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.';
    let initials = null;
    function openInitials(newBest) {
      state.screen = 'initials';
      nav = null;
      const last = String(store.get('retrokit.initials', 'AAA')).toUpperCase();
      initials = { letters: [0, 1, 2].map((i) => (CHARS.indexOf(last[i]) >= 0 ? last[i] : 'A')), sel: 0, slots: [] };
      const p = dialogPanel('rk-ne-title', 'rk-dialog-center');
      p.style.width = '380px';
      const h = el('h2', 'rk-heading', newBest ? 'New best' : 'High score');
      h.id = 'rk-ne-title';
      p.append(h, el('p', 'rk-body', 'Enter your initials'));
      const slots = el('div', 'rk-slots');
      slots.setAttribute('role', 'group');
      slots.setAttribute('aria-label', 'Initials');
      const field = el('input', 'rk-hidden-input');
      field.setAttribute('maxlength', '1');
      field.setAttribute('autocapitalize', 'characters');
      field.setAttribute('autocomplete', 'off');
      field.setAttribute('aria-label', 'Letter');
      [0, 1, 2].forEach((i) => {
        const colEl = el('div', 'rk-slot-col');
        const up = el('div', 'rk-chev', ICON.chevUp);
        const s = el('button', 'rk-slot');
        s.setAttribute('aria-label', 'Letter ' + (i + 1));
        const down = el('div', 'rk-chev', ICON.chevDown);
        colEl.append(up, s, down);
        s.addEventListener('click', () => {
          initials.sel = i;
          renderInitials();
          if (touch) { field.value = ''; field.focus(); }
        });
        slots.append(colEl);
        initials.slots.push(colEl);
      });
      field.addEventListener('input', () => {
        const ch = field.value.slice(-1).toUpperCase();
        field.value = '';
        if (CHARS.indexOf(ch) >= 0) typeChar(ch);
      });
      p.append(slots, field);
      if (!touch) {
        p.append(el('div', 'rk-hints rk-hint', '<span class="rk-kbd">↑</span><span class="rk-kbd">↓</span><span class="rk-gap">Letter</span><span class="rk-kbd">←</span><span class="rk-kbd">→</span><span class="rk-gap">Move</span><span class="rk-kbd">Enter</span><span>Save</span>'));
      }
      const save = button('Save', true, touch ? null : 'Enter');
      save.addEventListener('click', saveInitials);
      p.append(save);
      initials.field = field;
      dialogLayer.innerHTML = '';
      dialogLayer.append(el('div', 'rk-scrim'), p);
      dialogLayer.hidden = false;
      renderInitials();
    }
    function renderInitials() {
      initials.slots.forEach((c, i) => {
        c.classList.toggle('is-selected', i === initials.sel);
        const s = c.querySelector('.rk-slot');
        s.classList.toggle('is-selected', i === initials.sel);
        s.textContent = initials.letters[i] === '.' ? '·' : initials.letters[i];
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
        const d = e.code === 'ArrowUp' ? 1 : -1;
        L[i] = CHARS[(CHARS.indexOf(L[i]) + d + CHARS.length) % CHARS.length];
        sfx('blip');
        renderInitials();
      } else if (e.code === 'ArrowLeft' || e.code === 'Backspace') {
        e.preventDefault();
        initials.sel = Math.max(0, i - 1); sfx('select'); renderInitials();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        initials.sel = Math.min(2, i + 1); sfx('select'); renderInitials();
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
      const name = initials.letters.join('');
      if (initials.field) initials.field.blur();
      initials = null;
      store.set('retrokit.initials', name);
      const table = readScores();
      const entry = { i: name, s: state.score, d: new Date().toISOString().slice(0, 10) };
      table.push(entry);
      table.sort((a, b) => b.s - a.s);
      const kept = table.slice(0, 10);
      store.set(scoreKey(), kept);
      sfx('confirm');
      openScores(kept.indexOf(entry), true);
    }

    /* ----- Title screen ----- */
    function buildTitle() {
      const best = bestScore();
      titleScreen.innerHTML = '';
      const top = el('div', 'rk-title-top');
      const chip = el('div', 'rk-chip', ICON.trophy.replace('<svg ', '<svg width="16" height="16" style="color:var(--amber)" ') + '<span class="rk-label">Best</span><span class="rk-num" style="font-size:15px"></span>');
      if (modes.length) chip.querySelector('.rk-label').textContent = modeLabel(state.mode) + ' best';
      chip.querySelector('.rk-num').textContent = fmt(best);
      chip.style.visibility = best > 0 ? 'visible' : 'hidden';
      const actions = el('div', 'rk-title-actions');
      const soundBtn = el('button', 'rk-ibtn');
      soundBtn.dataset.act = 'sound';
      soundBtn.addEventListener('click', () => { settings.muted = !settings.muted; applySettings(); audio.unlock(); sfx('blip'); });
      const gearBtn = el('button', 'rk-ibtn', ICON.gear);
      gearBtn.setAttribute('aria-label', 'Settings');
      gearBtn.addEventListener('click', () => openSettings('title'));
      actions.append(soundBtn, gearBtn);
      top.append(chip, actions);

      const center = el('div', 'rk-title-center');
      const lockup = el('div', 'rk-lockup' + (title.replace(/\n/g, '').length > 12 && title.indexOf('\n') < 0 ? ' is-long' : ''), '<div class="rk-logo"><span></span></div><div class="rk-tagline"></div>');
      lockup.querySelector('.rk-logo span').textContent = title;
      lockup.querySelector('.rk-tagline').textContent = tagline;
      const menu = el('nav', 'rk-panel is-strong rk-menu rk-title-menu');
      menu.setAttribute('aria-label', 'Main menu');
      const items = [
        { el: menuItem(ICON.play, 'Start game', 'Enter'), activate: () => { sfx('confirm'); if (modes.length) openModes(); else startGame(); } },
        { el: menuItem(ICON.sliders, 'Settings', 'Enter'), activate: () => openSettings('title') },
        { el: menuItem(ICON.trophy, 'High scores', 'Enter'), activate: () => { sfx('confirm'); openScores(-1, false); } }
      ];
      items.forEach((it) => menu.append(it.el));
      center.append(lockup, menu);

      const bottom = el('div', 'rk-title-bottom');
      const hints = el('div', 'rk-hints rk-hint');
      keysHint.forEach((group, gi) => {
        group.slice(0, -1).forEach((k) => { const s = el('span', 'rk-kbd'); s.textContent = k; hints.append(s); });
        const lab = el('span', gi < keysHint.length - 1 ? 'rk-gap' : '');
        lab.textContent = group[group.length - 1];
        hints.append(lab);
      });
      bottom.append(hints, el('span', 'rk-hint', 'Made with Retro Kit'));
      titleScreen.append(top, center, bottom);
      titleNav = makeNav(items, {}, sfx);
      applySettings();
    }

    /* ----- Flow ----- */
    function startGame() {
      audio.unlock();
      if (music) music.rewind();
      dialogLayer.hidden = true;
      dialogLayer.innerHTML = '';
      world.innerHTML = '';
      nav = null;
      state.inGame = true;
      state.screen = 'play';
      state.score = 0;
      state.lives = startLives;
      state.time = 0;
      state.timers = [];
      state.ending = false;
      state.shakeAmt = 0;
      state.shakeT = 0;
      hudItems.forEach((it) => { hudVals[it.id] = it.value != null ? it.value : (it.type === 'text' ? '' : 0); });
      buildHud();
      syncBuiltins();
      layout();
      resetInput();
      try { state.game = cfg.start(api) || {}; } catch (e) { reportError(e); state.game = {}; }
      if (touch) hintEl.hidden = false;
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
      closeDialog();
      world.innerHTML = '';
      state.inGame = false;
      state.screen = 'title';
      state.game = null;
      hintEl.hidden = true;
      buildTitle();
      nav = titleNav;
      layout();
      resetInput();
    }
    function addScore(n, x, y, colour) {
      state.score = Math.max(0, state.score + (n | 0));
      syncBuiltins();
      if (x != null && y != null && n) popup(fmt(n), x, y, colour);
    }
    function loseLife() {
      if (state.ending || state.screen !== 'play') return state.lives;
      state.lives = Math.max(0, state.lives - 1);
      sfx('lifeLost');
      syncBuiltins();
      if (state.lives <= 0) gameOver();
      else if (touch) hintEl.hidden = false;
      return state.lives;
    }
    function addLife(n) {
      state.lives += n == null ? 1 : n;
      sfx('pickup');
      syncBuiltins();
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
      errorEl.style.display = 'inline-flex';
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

    /* ----- Loop ----- */
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
      if (state.shakeT > 0) { state.shakeT -= STEP; if (state.shakeT <= 0) state.shakeAmt = 0; }
    }
    function render() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.ink;
      ctx.fillRect(0, 0, W, H);
      let sx = 0;
      let sy = 0;
      if (state.shakeT > 0 && state.shakeAmt > 0 && !settings.reduceMotion) {
        sx = randInt(-state.shakeAmt, state.shakeAmt);
        sy = randInt(-state.shakeAmt, state.shakeAmt);
        ctx.setTransform(1, 0, 0, 1, sx, sy);
      }
      try {
        if (state.inGame && state.game) cfg.draw(ctx, state.game, api);
        else if (cfg.drawTitle) cfg.drawTitle(ctx, api);
        else backdrop.dusk();
      } catch (e) { reportError(e); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      flushGlow(sx, sy);
    }
    let speed = 1;
    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000)) * speed;
      lastFrame = now;
      state.t += dt;
      root.classList.toggle('rk-paused', state.inGame && state.screen !== 'play');
      if (state.screen === 'play') {
        acc += dt;
        while (acc >= STEP) { tick(); acc -= STEP; }
      } else acc = 0;
      if (music) music.sync(state.inGame, state.screen, state.ending);
      render();
    }

    /* ----- Public API handed to the game ----- */
    const api = {
      W: W, H: H, C: C, version: VERSION, touch: touch, input: input, hud: hud, sfx: sfx, backdrop: backdrop,
      get settings() { return Object.assign({}, settings); },
      get screen() { return state.screen; },
      get time() { return state.time; },
      get t() { return state.t; },
      get score() { return state.score; },
      get lives() { return state.lives; },
      get ending() { return state.ending; },
      get mode() { return state.mode; },
      get best() { return Math.max(bestScore(), state.score); },
      addScore: addScore, loseLife: loseLife, addLife: addLife, gameOver: gameOver,
      sprite: sprite, draw: draw, frame: frameAt,
      makeSprite: (def, name) => { const s = makeSprite(C, def, name || 'sprite'); if (name) sprites[name] = s; return s; },
      rect: rect, px: px, circle: circle, block: block,
      glow: glow, popup: popup, banner: banner, shake: shake, after: after,
      rand: rand, randInt: randInt, pick: pick, clamp: clamp, lerp: lerp, hit: hit,
      ramps: RAMPS, legend: LEGEND
    };

    /* ----- Boot ----- */
    if (cfg.sprites) {
      for (const name in cfg.sprites) {
        try { sprites[name] = makeSprite(C, cfg.sprites[name], name); } catch (e) { reportError(e); }
      }
    }
    buildTitle();
    nav = titleNav;
    layout();
    if (cfg.init) { try { cfg.init(api); } catch (e) { reportError(e); } }
    if (music && !settings.muted) setTimeout(music.load, 300);   // get the track ready behind the title screen
    const fontLoads = ['400 20px Bungee', '600 12px "Chakra Petch"', '400 18px DotGothic16', '400 14px Geist', '500 14px Geist', '600 14px Geist', '500 14px "Geist Mono"', '600 14px "Geist Mono"']
      .map((f) => (document.fonts && document.fonts.load ? document.fonts.load(f) : Promise.resolve()));
    const reveal = () => { root.classList.remove('rk-loading'); layout(); };
    Promise.race([Promise.all(fontLoads), new Promise((r) => setTimeout(r, 2500))]).then(reveal, reveal);
    requestAnimationFrame(frame);

    /* Test hook: lets automated checks drive the shell (see the skill's reference, Testing). Not for games. */
    api._debug = {
      state: state,
      get game() { return state.game; },
      get speed() { return speed; },
      set speed(v) { speed = clamp(+v || 1, 0.1, 20); },
      start: (mode) => { if (modes.some((m) => m.id === mode)) setMode(mode); startGame(); },
      pause: pause, resume: resume, quit: quitToTitle,
      showGameOver: showGameOver, openSettings: openSettings, openScores: openScores, openModes: openModes,
      music: music
    };
    return api;
  }

  window.RetroKit = {
    version: VERSION,
    W: W,
    H: H,
    game(cfg) {
      if (window.RetroKit.current) throw new Error('Retro Kit: only one RetroKit.game() per page.');
      const boot = () => { window.RetroKit.current = createGame(cfg); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
      else boot();
    },
    current: null
  };
})();
