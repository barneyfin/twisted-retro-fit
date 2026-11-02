/* Lantern Box 0.2 — runtime
   One file, no dependencies. Exposes window.LanternBox. Pair it with lantern-box.css.
   Copied from Retro Kit's shell and restyled to the design system (lantern-box/design-system/); the two soundtracks and
   the way settings are saved come from City Nights' copy of it. It owns everything every game shares: the picture
   (a 2D canvas 540 lines tall that fills the window; its width follows the window), the game loop, keyboard and touch
   input, every screen outside play (title, pause, settings, game over, initials, high scores, rotate), the HUD, full
   screen, sound, music and saved data. Step 3c adds the drawing tools. Public API: see `api` below. */
(function () {
  'use strict';

  const VERSION = '0.2.0';
  const H = 540;              // the picture's height in lines, whatever the window
  const STEP = 1 / 60;
  const PHONE_H = 520;        // a window shorter than this, or narrower than PHONE_W, gets the phone layouts
  const PHONE_W = 760;
  const MAX_DPR = 2;          // above this the picture is drawn at 2x and enlarged smoothly

  /* ---------- Small helpers ---------- */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pad4 = (v) => String(Math.max(0, Math.round(v))).padStart(4, '0');   // the HUD counter and the title's Best

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
  const asObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

  /* ---------- Icons (the design system's strokes; the colours and widths are in the stylesheet) ---------- */
  const SVG24 = (body) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + body + '</svg>';
  const ICON = {
    sound: SVG24('<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z"/><path d="M16.5 9.5 Q18.5 12 16.5 14.5"/><path d="M19 7 Q22.5 12 19 17"/>'),
    soundOff: SVG24('<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z"/><path d="M16 9 L22 15 M22 9 L16 15"/>'),
    fullscreen: SVG24('<path d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15"/>'),
    fullscreenExit: SVG24('<path d="M9 4 V9 H4 M15 4 V9 H20 M15 20 V15 H20 M9 20 V15 H4"/>'),
    pause: SVG24('<path d="M9 5 V19 M15 5 V19"/>'),
    heart: (s) => '<svg width="' + s + '" height="' + (s - 1) + '" viewBox="0 0 14 13" aria-hidden="true"><path d="M7 12.5 C2 9 0 6.5 0 4 A3.6 3.6 0 0 1 7 2.4 A3.6 3.6 0 0 1 14 4 C14 6.5 12 9 7 12.5 Z"/></svg>',
    flame: (s) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 12 18" aria-hidden="true"><path d="M6 1 C9 6 11 8 11 12 A5 5 0 0 1 1 12 C1 8 3 6 6 1 Z"/></svg>',
    chevUp: '<svg class="lb-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 11 L8 5 L13 11"/></svg>',
    chevDown: '<svg class="lb-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5 L8 11 L13 5"/></svg>',
    rotate: '<svg width="84" height="84" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="14" width="16" height="28" rx="2.5"/><path d="M15 38 H19"/><rect x="22" y="24" width="22" height="13" rx="2.5" stroke-dasharray="3 3"/><path d="M28 8 Q38 8 40 18"/><path d="M37 15 L40 18.5 L43 15"/></svg>'
  };
  // Keycaps: arrows are drawn, because the kit's Alegreya Sans has no left or right arrow
  const KEY_ARROW = {
    up: ['Up arrow', 'M5 8.5 V1.5 M2 4.5 L5 1.5 L8 4.5'],
    down: ['Down arrow', 'M5 1.5 V8.5 M2 5.5 L5 8.5 L8 5.5'],
    left: ['Left arrow', 'M8.5 5 H1.5 M4.5 2 L1.5 5 L4.5 8'],
    right: ['Right arrow', 'M1.5 5 H8.5 M5.5 2 L8.5 5 L5.5 8']
  };
  const kbd = (name) => (KEY_ARROW[name]
    ? '<span class="lb-kbd" aria-label="' + KEY_ARROW[name][0] + '"><svg viewBox="0 0 10 10"><path d="' + KEY_ARROW[name][1] + '"/></svg></span>'
    : '<span class="lb-kbd">' + name + '</span>');
  const RULE = '<div class="lb-rule" aria-hidden="true"><i></i></div>';

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

  /* ---------- Music (optional: a looping track, or two, given as MP3 text in the game's config) ----------
     music: { data } for one, or music: [{ data }, { data }] for two (ARCADE.md); the game switches with lb.music(1).
     It plays on a loop during play, stops for the pause menu and picks up where it left off, starts again from the first
     track with each new game, fades out when the game ends, and follows the Volume setting and the sound tile. On a
     switch the old track fades over 2 s and the new one starts from its beginning. */
  function makeMusic(audio, settings, opts) {
    const list = (Array.isArray(opts) ? opts : [opts]).filter((o) => o && typeof o === 'object').slice(0, 2);
    const lead = list[0] || {};
    const share = lead.level == null ? 0.525 : clamp(+lead.level || 0, 0, 1);   // against the sound effects; 1 = the file's full level
    const tracks = list.map((o) => ({ data: o.data, state: 'idle', buf: null, loopStart: 0, loopEnd: 0, offset: 0, src: null, voice: null, t0: 0 }));
    const m = { out: null, level: -1, cur: 0, want: 0, tracks: tracks };
    const fail = (tr) => {
      tr.state = 'none';
      console.warn('Lantern Box: a soundtrack could not be loaded, so the game plays without it.');
    };
    function ready(tr, buf) {
      // MP3 files carry a moment of silence at each end. Loop between the first and last real sound.
      const ch = buf.getChannelData(0);
      let a = 0;
      let b = buf.length - 1;
      while (a < b && Math.abs(ch[a]) < 0.004) a++;
      while (b > a && Math.abs(ch[b]) < 0.004) b--;
      const whole = b - a < buf.sampleRate;
      tr.loopStart = whole ? 0 : a / buf.sampleRate;
      tr.loopEnd = whole ? buf.duration : (b + 1) / buf.sampleRate;
      tr.buf = buf;
      tr.state = 'ready';
    }
    // Decodes the tracks, once each. Unlike playing, this needs no key press or tap, so it can run behind the title screen.
    m.load = function () {
      const Decoder = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      tracks.forEach((tr) => {
        if (tr.state !== 'idle') return;
        if (!Decoder || typeof tr.data !== 'string' || !tr.data) { fail(tr); return; }
        tr.state = 'loading';
        try {
          const bin = atob(tr.data);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const job = new Decoder(2, 1, 44100).decodeAudioData(bytes.buffer, (buf) => ready(tr, buf), () => fail(tr));
          if (job && job.catch) job.catch(() => {});
        } catch (e) { fail(tr); }
      });
    };
    function start(tr) {
      const ctx = audio.ctx;
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = tr.buf;
      src.loop = true;
      src.loopStart = tr.loopStart;
      src.loopEnd = tr.loopEnd;
      const voice = ctx.createGain();
      voice.gain.setValueAtTime(0, now);
      voice.gain.linearRampToValueAtTime(1, now + 0.3);
      src.connect(voice);
      voice.connect(m.out);
      src.start(now, tr.offset);
      tr.src = src;
      tr.voice = voice;
      tr.t0 = now - tr.offset;
    }
    // Fades a track out over `fade` seconds and remembers its place.
    function stop(tr, fade) {
      if (!tr || !tr.src) return;
      const now = audio.ctx.currentTime;
      const at = now - tr.t0;
      tr.offset = at < tr.loopEnd ? at : tr.loopStart + (at - tr.loopStart) % (tr.loopEnd - tr.loopStart);
      const gain = tr.voice.gain;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(0, now + fade);
      tr.src.stop(now + fade + 0.02);
      tr.src = null;
      tr.voice = null;
    }
    m.stop = function (fade) { stop(tracks[m.cur], fade); };
    // A new game: back to the top of the first track.
    m.rewind = function () {
      tracks.forEach((tr) => { stop(tr, 0.08); tr.offset = 0; });
      m.cur = 0;
      m.want = 0;
    };
    // Called every frame: makes the music match the screen the player is on, the sound settings and the track the game wants.
    m.sync = function (inGame, screen, ending) {
      if (!tracks.length) return;
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
      if (m.want !== m.cur && tracks[m.want]) {
        stop(tracks[m.cur], 2);
        tracks[m.cur].offset = 0;
        m.cur = m.want;
        tracks[m.cur].offset = 0;
      }
      const tr = tracks[m.cur];
      if (playing && level > 0) {
        if (tr.state === 'idle') m.load();
        if (!tr.src && tr.buf && m.out && audio.ctx.state === 'running') start(tr);
      } else if (tr.src) stop(tr, ending ? 0.7 : 0.08);
      if (!keepPlace) tracks.forEach((t) => { t.offset = 0; });
    };
    return m;
  }

  /* ---------- Menu navigation (keyboard + pointer) ----------
     An item is { el, activate, left, right, focus, menu, noClick }. Keyboard focus follows the selection, so the brass band
     (or the arch's glow) is the focus mark; focus() names the element to focus when it is not el. Hover only lightens an
     item's text (the stylesheet); it never moves the selection. */
  function makeNav(items, opts, sfx) {
    opts = opts || {};
    let i = 0;
    const nav = {
      items: items,
      get index() { return i; },
      select(n, quiet) {
        if (!items.length) return;
        n = ((n % items.length) + items.length) % items.length;
        if (n !== i && !quiet) sfx('select');
        i = n;
        items.forEach((it, k) => {
          if (!it.menu) return;
          it.el.classList.toggle('is-selected', k === i);
          if (k === i) it.el.setAttribute('aria-current', 'true');
          else it.el.removeAttribute('aria-current');
        });
        nav.focus();
      },
      focus() {
        const it = items[i];
        const f = it && (it.focus ? it.focus() : it.el);
        if (f && f.focus) f.focus({ preventScroll: true });
      },
      activate(n) {
        const it = items[n == null ? i : n];
        if (it && it.activate) it.activate();
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
      if (it.noClick) return;
      it.el.addEventListener('click', () => {
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
      throw new Error('Lantern Box: LanternBox.game() needs start(), update() and draw() functions.');
    }
    const lines = (Array.isArray(cfg.title) ? cfg.title : [cfg.title || 'Lantern Box game']).map(String);
    const titleText = lines.join(' ');
    const gameId = slug(cfg.id || titleText);
    const hasMana = cfg.mana !== false;
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const mqPortrait = window.matchMedia('(orientation: portrait)');
    const upright = () => touch && mqPortrait.matches;

    /* Settings. Volume, Effects and Reduce motion are shared by every game in the arcade (retrokit.settings); the whole
       object is written back, so the one Lantern Box does not show (Solid panels) stays as it was. Picture is Lantern
       Box's own (lanternbox.settings), so other kits' games never see it. */
    const SHARED_KEY = 'retrokit.settings';
    const OWN_KEY = 'lanternbox.settings';
    const SHARED = ['volume', 'muted', 'effects', 'reduceMotion'];
    const PICTURES = [['auto', 'Automatic'], ['best', 'Best'], ['faster', 'Faster'], ['fastest', 'Fastest']];
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
      if (cue) cue(); else console.warn('Lantern Box: no sound called "' + name + '".');
    }
    sfx.tone = (o) => audio.tone(o || {});
    sfx.noise = (o) => audio.noise(o || {});
    const music = cfg.music ? makeMusic(audio, settings, cfg.music) : null;

    /* High scores, per game: a top-ten array of { s: wisps, i: initials, d: date }, in Retro Kit's format and under its
       key, where the arcade website looks. */
    const scoreKey = () => 'retrokit.scores.' + gameId;
    const readScores = () => {
      const t = store.get(scoreKey(), []);
      return (Array.isArray(t) ? t : []).filter((r) => r && typeof r.s === 'number').sort((a, b) => b.s - a.s).slice(0, 10);
    };
    const bestScore = () => { const t = readScores(); return t.length ? t[0].s : 0; };

    /* ----- DOM ----- */
    document.documentElement.lang = document.documentElement.lang || 'en';
    document.title = titleText;
    const root = el('div', 'lb-root lb-ui lb-loading' + (touch ? ' lb-touch' : ''));
    const canvas = el('canvas', 'lb-canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', titleText);
    const hudLayer = el('div', 'lb-layer');
    const titleScreen = el('div', 'lb-layer');
    const dialogLayer = el('div', 'lb-layer lb-dialog-layer');
    dialogLayer.hidden = true;
    const rotateEl = el('div', 'lb-rotate', '<div class="lb-plaque" role="dialog" aria-labelledby="lb-rot-t" style="width:300px"><div class="lb-face is-centred">' +
      '<span style="color:var(--heading);display:block;height:84px">' + ICON.rotate + '</span><h2 class="lb-heading" id="lb-rot-t">Turn your phone sideways</h2><p></p></div></div>');
    rotateEl.querySelector('p').textContent = titleText + ' is played with the phone held sideways.';
    rotateEl.hidden = true;
    const errorEl = el('div', 'lb-error');
    errorEl.hidden = true;
    root.append(canvas, titleScreen, hudLayer, dialogLayer, rotateEl, errorEl);
    document.body.append(root);
    const ctx = canvas.getContext('2d');

    /* ----- Game state ----- */
    const state = {
      screen: 'title',   // title | play | paused | settings | over | initials | scores
      inGame: false,
      game: null,
      score: 0,
      health: 1,
      mana: 1,
      time: 0,
      t: 0,
      ending: false,
      timers: [],
      shakeAmt: 0,
      shakeT: 0,
      errored: false
    };
    function after(seconds, fn) { state.timers.push({ at: state.time + seconds, fn: fn }); }
    function shake(amount, seconds) {   // the picture only, in its lines; the HUD never moves
      if (settings.reduceMotion) return;
      state.shakeAmt = Math.min(12, Math.max(state.shakeAmt, amount == null ? 6 : amount));
      state.shakeT = Math.min(0.25, Math.max(state.shakeT, seconds == null ? 0.2 : seconds));
    }

    /* ----- The picture: 540 lines tall, its width following the window ----- */
    const V = { W: 960, k: 1, w: 0, h: 0, phone: false };
    function layout() {
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (!w || !h) return;
      const q = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const bw = Math.max(1, Math.round(w * q));
      const bh = Math.max(1, Math.round(h * q));
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      V.k = bh / H;
      V.W = bw / V.k;
      V.w = w;
      V.h = h;
      const phone = h < PHONE_H || w < PHONE_W;
      if (phone !== V.phone) {   // the layouts are built for one size or the other: build the screen on show again
        V.phone = phone;
        if (state.inGame) buildHud();
        else buildTitle();
        if (currentDialog) showDialog(currentDialog, nav ? nav.index : 0);
      }
      fitScreens();
    }
    // Anything bigger than the room it has (a phone's browser bars, a small window) is scaled down to fit
    function fitTo(node, room, roomH) {
      node.style.transform = '';
      const k = Math.min(1, room / node.offsetWidth, roomH / node.offsetHeight);
      if (k < 1) node.style.transform = 'scale(' + k + ')';
    }
    function fitScreens() {
      const plaque = dialogLayer.querySelector('.lb-plaque');
      if (plaque) fitTo(plaque, dialogLayer.clientWidth - 12, dialogLayer.clientHeight - 12);
      const arch = titleScreen.querySelector('.lb-title-arch');
      if (arch) fitTo(arch, titleScreen.clientWidth, titleScreen.clientHeight - arch.offsetTop - 4);
      const rot = rotateEl.querySelector('.lb-plaque');
      if (!rotateEl.hidden) fitTo(rot, root.clientWidth - 12, root.clientHeight - 12);
    }
    if (window.ResizeObserver) new ResizeObserver(layout).observe(root);
    window.addEventListener('resize', layout);

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
    const pointer = { x: 0, y: 0, down: false, pressed: false, released: false, moved: false, dx: 0, dy: 0, id: null, sx: 0, sy: 0, st: 0 };
    // A second finger, down while the first one is: it never moves `pointer`, so one thumb can steer
    // while the other taps or holds. A quick tap with it counts as `tap`, like the first finger's.
    const pointer2 = { x: 0, y: 0, down: false, pressed: false, released: false, id: null, sx: 0, sy: 0, st: 0 };
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
      for (const name in KEYMAP) {
        input[name] = KEYMAP[name].some((c) => keys.has(c));
        input.pressed[name] = KEYMAP[name].some((c) => justKeys.has(c));
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
    const worldX = (e) => e.clientX / (V.w || 1) * V.W;
    const worldY = (e) => e.clientY / (V.h || 1) * H;
    function setPointer(e) {
      const nx = worldX(e);
      const ny = worldY(e);
      pointer.dx += nx - pointer.x;
      pointer.dy += ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
      pointer.moved = true;
    }
    // A touch that ends short and still is a tap, whichever finger made it.
    const isTap = (p, e) => Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 10 && performance.now() - p.st < 300;
    canvas.addEventListener('pointerdown', (e) => {
      audio.unlock();
      if (state.screen !== 'play') return;
      e.preventDefault();
      if (pointer.down && e.pointerId !== pointer.id) {   // a second finger: the first keeps steering
        if (pointer2.down) return;                        // a third is ignored
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        pointer2.id = e.pointerId;
        pointer2.x = worldX(e); pointer2.y = worldY(e);
        pointer2.down = true;
        pointer2.pressed = true;
        pointer2.sx = e.clientX; pointer2.sy = e.clientY; pointer2.st = performance.now();
        return;
      }
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      pointer.id = e.pointerId;
      setPointer(e);
      pointer.dx = 0; pointer.dy = 0;
      pointer.down = true;
      pointer.pressed = true;
      pointer.sx = e.clientX; pointer.sy = e.clientY; pointer.st = performance.now();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (state.screen !== 'play') return;
      if (pointer2.down && e.pointerId === pointer2.id) { pointer2.x = worldX(e); pointer2.y = worldY(e); return; }
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
    canvas.addEventListener('pointerup', pointerEnd);
    canvas.addEventListener('pointercancel', pointerEnd);
    // Sound may only start from a key press or a tap (on some phones, only as the finger lifts). A phone
    // can also put sound to sleep (a call, switching apps): the next tap or key wakes it.
    ['pointerdown', 'touchend'].forEach((type) => window.addEventListener(type, () => audio.unlock(), true));

    /* ----- Full screen: the real thing where the browser allows it. Where it is refused (inside the Claude app, on an
       iPhone) the game fills its frame instead, and the tile says so. ----- */
    const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
    const fsAllowed = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    const mqFilled = window.matchMedia('(display-mode: fullscreen)');   // an installed app (or F11) already fills the screen
    let filled = false;
    function setFilled(on) {
      filled = on;
      root.classList.toggle('lb-filled', on);
      syncFullscreen();
    }
    function toggleFullscreen() {
      if (fsElement()) {
        Promise.resolve((document.exitFullscreen || document.webkitExitFullscreen).call(document)).catch(() => {});
        return;
      }
      if (filled) { setFilled(false); return; }
      const r = document.documentElement;
      const ask = r.requestFullscreen || r.webkitRequestFullscreen;
      if (!ask || !fsAllowed()) { setFilled(true); return; }
      let job;
      try { job = ask.call(r, { navigationUI: 'hide' }); } catch (e) { setFilled(true); return; }
      Promise.resolve(job).then(() => {
        // Hold a phone's game sideways while it fills the screen (browsers allow this only in full screen)
        if (touch && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
      }, () => setFilled(true));
    }
    function syncFullscreenTile(b) {
      const on = !!fsElement() || filled;
      b.hidden = !on && mqFilled.matches;
      const icon = on ? ICON.fullscreenExit : ICON.fullscreen;
      if (b.firstChild && b.firstChild.tagName === 'SPAN') b.firstChild.innerHTML = icon;
      else b.innerHTML = icon;
      b.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    function fullscreenTile(cls, inner) {
      const b = el('button', cls, inner);
      b.type = 'button';
      b.dataset.act = 'fullscreen';
      b.addEventListener('click', () => { toggleFullscreen(); b.blur(); });   // blur: Space and Enter belong to the game
      syncFullscreenTile(b);
      return b;
    }
    function syncFullscreen() {
      root.querySelectorAll('[data-act="fullscreen"]').forEach(syncFullscreenTile);
    }
    const onFullscreenChange = () => {
      syncFullscreen();
      if (!fsElement() && state.screen === 'play') pause();   // left full screen mid-play: the jump in size never costs anything
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    if (mqFilled.addEventListener) mqFilled.addEventListener('change', syncFullscreen);
    else if (mqFilled.addListener) mqFilled.addListener(syncFullscreen);

    /* ----- HUD: health and mana top left; the full-screen tile (computers only), the pause tile and the wisps top right.
       Nothing else goes over the picture in play, and none of it flashes or moves. ----- */
    let hudNodes = null;
    function buildHud() {
      hudLayer.innerHTML = '';
      hudNodes = null;
      if (!state.inGame) return;
      const ph = V.phone ? ' is-phone' : '';
      const hud = el('div', 'lb-hud' + ph);
      const left = el('div', 'lb-hud-left');
      const iconSize = V.phone ? 13 : 14;
      const vitals = el('div', 'lb-plaque is-hud lb-vitals' + ph, '<div class="lb-face"><div class="lb-bar-row">' + ICON.heart(iconSize) + '<div class="lb-bar" data-bar="health"><i></i></div></div>' +
        (hasMana ? '<div class="lb-bar-row">' + ICON.flame(iconSize) + '<div class="lb-bar is-mana" data-bar="mana"><i></i></div></div>' : '') + '</div>');
      vitals.setAttribute('role', 'group');
      left.append(vitals);
      const right = el('div', 'lb-hud-right');
      if (!touch && !V.phone) right.append(fullscreenTile('lb-tile', '<span>' + ICON.fullscreen + '</span>'));
      const pauseTile = el('button', 'lb-tile' + ph, '<span>' + ICON.pause + '</span>');
      pauseTile.type = 'button';
      pauseTile.setAttribute('aria-label', 'Pause');
      pauseTile.addEventListener('click', () => { pauseTile.blur(); pause(); });
      right.append(pauseTile);
      const counter = el('div', 'lb-plaque is-hud lb-counter' + ph, '<div class="lb-face"><span class="lb-counter-label" aria-hidden="true">Wisps</span><span class="lb-counter-num" aria-hidden="true"></span></div>');
      counter.setAttribute('role', 'status');
      right.append(counter);
      hud.append(left, right);
      hudLayer.append(hud);
      hudNodes = { vitals: vitals, health: vitals.querySelector('[data-bar="health"]'), mana: vitals.querySelector('[data-bar="mana"]'), counter: counter, num: counter.querySelector('.lb-counter-num') };
      syncHud();
    }
    function syncHud() {
      if (!hudNodes) return;
      const pc = (f) => Math.round(clamp(f, 0, 1) * 100);
      hudNodes.health.style.setProperty('--v', pc(state.health) + '%');
      if (hudNodes.mana) hudNodes.mana.style.setProperty('--v', pc(state.mana) + '%');
      hudNodes.vitals.setAttribute('aria-label', 'Health ' + pc(state.health) + ' per cent' + (hasMana ? ', mana ' + pc(state.mana) + ' per cent' : ''));
      hudNodes.num.textContent = pad4(state.score);
      hudNodes.counter.setAttribute('aria-label', state.score + ' wisps');
    }
    const hud = {
      health(f) { state.health = clamp(+f || 0, 0, 1); syncHud(); },
      mana(f) { state.mana = clamp(+f || 0, 0, 1); syncHud(); }
    };

    /* ----- Settings ----- */
    function applySettings() {
      root.classList.toggle('lb-fx', !!settings.effects);
      root.classList.toggle('lb-reduce-motion', !!settings.reduceMotion);
      audio.apply();
      saveSettings();
      const sb = titleScreen.querySelector('[data-act="sound"]');
      if (sb) {
        sb.innerHTML = settings.muted ? ICON.soundOff : ICON.sound;
        sb.setAttribute('aria-label', settings.muted ? 'Sound off' : 'Sound on');
        sb.setAttribute('aria-pressed', settings.muted ? 'false' : 'true');
      }
    }

    /* ----- Dialogs: one plaque at a time, centred on the scrim. A dialog is a function that builds its plaque for the
       current layout and returns { panel, items, opts }, so it can be built again if the window changes layout. ----- */
    let nav = null;
    let titleNav = null;
    let currentDialog = null;
    function showDialog(build, start) {
      currentDialog = build;
      const d = build();
      dialogLayer.innerHTML = '';
      dialogLayer.append(el('div', 'lb-scrim'), d.panel);
      dialogLayer.hidden = false;
      titleScreen.hidden = true;
      if (d.items) {
        const opts = Object.assign({}, d.opts);
        if (start != null) opts.start = start;
        nav = makeNav(d.items, opts, sfx);
      } else nav = null;
      fitScreens();
    }
    function closeDialog() {
      currentDialog = null;
      dialogLayer.hidden = true;
      dialogLayer.innerHTML = '';
      titleScreen.hidden = state.inGame;
      nav = state.inGame ? null : titleNav;
      if (nav) nav.focus();
    }
    function plaque(labelId, width, phoneWidth, faceStyle, faceClass) {
      const p = el('div', 'lb-plaque' + (V.phone ? ' is-phone' : ''));
      p.setAttribute('role', 'dialog');
      p.setAttribute('aria-modal', 'true');
      p.setAttribute('aria-labelledby', labelId);
      p.style.width = (V.phone ? phoneWidth : width) + 'px';
      const face = el('div', 'lb-face' + (faceClass ? ' ' + faceClass : ''));
      if (faceStyle) face.style.cssText = faceStyle;
      p.append(face);
      return { panel: p, face: face };
    }
    function heading(id, text) {
      const h = txt('h2', 'lb-heading', text);
      h.id = id;
      return h;
    }
    function menuItem(label, activate) {
      const b = txt('button', 'lb-item', label);
      b.type = 'button';
      return { el: b, menu: true, activate: activate };
    }
    function button(label, primary, diamond) {
      const b = txt('button', 'lb-btn' + (primary ? ' is-primary' : '') + (diamond ? ' has-diamond' : ''), label);
      b.type = 'button';
      return b;
    }
    function menuNav(ariaLabel, items) {
      const m = el('nav', 'lb-menu');
      m.setAttribute('aria-label', ariaLabel);
      items.forEach((it) => m.append(it.el));
      return m;
    }
    const startOver = () => { sfx('confirm'); closeDialog(); startGame(); };
    const toMenu = () => { sfx('back'); quitToTitle(); };

    function pauseDialog() {
      const { panel, face } = plaque('lb-pa-t', 340, 300, V.phone ? '' : 'padding:22px 16px 16px');
      const items = [
        menuItem('Resume', resume),
        menuItem('Restart', startOver),
        menuItem('Settings', () => openSettings('paused')),
        menuItem('Quit to menu', toMenu)
      ];
      face.append(heading('lb-pa-t', 'Paused'), el('div', '', RULE).firstChild, menuNav('Pause menu', items));
      if (!touch && !V.phone) {
        const hint = el('p', 'lb-hint', kbd('Esc') + ' resume');
        hint.style.cssText = 'text-align:center;margin-top:2px';
        face.append(hint);
      }
      return { panel: panel, items: items, opts: { back: resume } };
    }

    function settingsDialog(close) {
      const phone = V.phone;
      const { panel, face } = plaque('lb-se-t', 500, 680, phone ? 'gap:12px;padding:14px 20px 18px' : 'padding:20px 22px 18px');
      const items = [];
      // Volume
      const vol = el('div', 'lb-setting is-first', '<label class="lb-setting-name" for="lb-vol"></label><input class="lb-slider" id="lb-vol" type="range" min="0" max="100"><span class="lb-value"></span>');
      vol.style.height = phone ? '44px' : '40px';
      vol.querySelector('label').textContent = 'Volume';
      vol.querySelector('label').style.width = phone ? '70px' : '140px';
      vol.querySelector('.lb-value').style.width = phone ? '38px' : '44px';
      const slider = vol.querySelector('input');
      const volNum = vol.querySelector('.lb-value');
      const showVol = () => { slider.value = settings.volume; volNum.textContent = (settings.muted ? 0 : settings.volume) + '%'; };
      const setVol = (v) => { settings.volume = clamp(v, 0, 100); settings.muted = false; applySettings(); showVol(); sfx('blip'); };
      slider.addEventListener('input', () => setVol(+slider.value));
      showVol();
      items.push({ el: slider, noClick: true, left: () => setVol(settings.volume - 10), right: () => setVol(settings.volume + 10) });
      // Effects and Reduce motion
      const toggleRow = (key, name, note) => {
        const row = el('div', 'lb-setting', '<div class="lb-setting-text"><span class="lb-setting-name"></span><p class="lb-note"></p></div><button class="lb-toggle" type="button"></button>');
        const nameEl = row.querySelector('.lb-setting-name');
        nameEl.textContent = name;
        nameEl.id = 'lb-set-' + key;
        row.querySelector('.lb-note').textContent = note;
        const sw = row.querySelector('button');
        sw.setAttribute('aria-labelledby', nameEl.id);
        const show = () => { sw.setAttribute('aria-pressed', settings[key] ? 'true' : 'false'); sw.textContent = settings[key] ? 'On' : 'Off'; };
        show();
        const flip = () => { settings[key] = !settings[key]; applySettings(); show(); sfx('blip'); };
        items.push({ el: sw, activate: flip, left: flip, right: flip });
        return row;
      };
      const fxRow = toggleRow('effects', 'Effects', 'Glow round lights, eyes and splashes.');
      const rmRow = toggleRow('reduceMotion', 'Reduce motion', 'Flatter scenery, slower rain, no shaking.');
      // Picture
      const seg = el('div', 'lb-segments' + (phone ? ' is-grid' : ''));
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-labelledby', 'lb-set-pic');
      const segBtns = PICTURES.map((p) => {
        const b = txt('button', '', p[1]);
        b.type = 'button';
        b.addEventListener('click', () => choosePic(p[0]));
        seg.append(b);
        return b;
      });
      const showPic = () => segBtns.forEach((b, i) => b.setAttribute('aria-pressed', PICTURES[i][0] === own.picture ? 'true' : 'false'));
      const choosePic = (id) => {
        own.picture = id;
        applySettings();
        showPic();
        sfx('blip');
        if (nav && nav.items === items) nav.select(items.indexOf(picItem), true);
      };
      const stepPic = (d) => {
        const i = PICTURES.findIndex((p) => p[0] === own.picture);
        choosePic(PICTURES[(i + d + PICTURES.length) % PICTURES.length][0]);
      };
      showPic();
      const picItem = { el: seg, noClick: true, focus: () => segBtns[PICTURES.findIndex((p) => p[0] === own.picture)], left: () => stepPic(-1), right: () => stepPic(1) };
      items.push(picItem);
      const picNote = txt('p', 'lb-note', 'Automatic picks the most detail your device can run smoothly.');
      const picName = txt('span', 'lb-setting-name', 'Picture');
      picName.id = 'lb-set-pic';
      // Done
      const done = button('Done', true);
      items.push({ el: done, activate: close });
      const opts = { back: close, start: items.length - 1 };   // the primary button is focused when a plaque opens

      if (phone) {
        done.style.padding = '0 24px';
        const head = el('div', 'lb-header');
        head.append(heading('lb-se-t', 'Settings'), done);
        const cols = el('div');
        cols.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:26px';
        const a = el('div');
        a.style.cssText = 'display:flex;flex-direction:column;gap:10px';
        a.append(vol, fxRow, rmRow);
        const b = el('div');
        b.style.cssText = 'display:flex;flex-direction:column;gap:10px';
        picName.style.cssText = 'line-height:44px;height:44px';
        b.append(picName, seg, picNote);
        cols.append(a, b);
        face.append(head, cols);
      } else {
        const pic = el('div', 'lb-setting');
        pic.style.cssText = 'flex-direction:column;align-items:stretch;gap:8px';
        const line = el('div');
        line.style.cssText = 'display:flex;align-items:center;gap:14px';
        picName.style.width = '140px';
        seg.style.flexGrow = '1';
        line.append(picName, seg);
        pic.append(line, picNote);
        const foot = el('div', '', '<span class="lb-hint">' + kbd('Esc') + ' done</span>');
        foot.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:12px;padding-top:2px';
        foot.append(done);
        if (touch) foot.firstChild.remove();
        face.append(heading('lb-se-t', 'Settings'), el('div', '', RULE).firstChild, vol, fxRow, rmRow, pic, foot);
      }
      return { panel: panel, items: items, opts: opts };
    }
    function openSettings(from) {
      state.screen = 'settings';
      sfx('confirm');
      const close = () => {
        sfx('back');
        if (from === 'paused') { state.screen = 'paused'; showDialog(pauseDialog); }
        else { state.screen = 'title'; closeDialog(); }
      };
      showDialog(() => settingsDialog(close));
    }

    function scoreRows(table, highlight, from, to) {
      const t = el('table', 'lb-scores', '<thead><tr><th scope="col">No.</th><th scope="col">Name</th><th scope="col">Wisps</th></tr></thead>');
      const body = el('tbody');
      for (let i = from; i < to && i < table.length; i++) {
        const tr = el('tr', i === highlight ? 'is-new' : '');
        tr.append(txt('td', '', String(i + 1)), txt('td', 'who', table[i].i || '---'), txt('td', '', String(table[i].s)));
        body.append(tr);
      }
      t.append(body);
      return t;
    }
    function scoresDialog(highlight, afterGame) {
      const phone = V.phone;
      const { panel, face } = plaque('lb-hs-t', 420, 660, phone ? 'gap:10px;padding:14px 20px 16px' : 'gap:10px;padding:18px 22px 16px');
      const h = heading('lb-hs-t', 'High scores');
      if (!phone) h.style.fontSize = '34px';
      let buttons;
      let items;
      let opts;
      if (afterGame) {
        const again = button('Play again', true, true);
        const menu = button('Menu');
        if (phone) { again.style.padding = '0 18px'; menu.style.padding = '0 20px'; }
        buttons = [again, menu];
        items = [{ el: again, activate: startOver }, { el: menu, activate: toMenu }];
        opts = { back: toMenu };
      } else {
        const back = button('Back', true);
        const close = () => { sfx('back'); state.screen = 'title'; closeDialog(); };
        if (phone) back.style.padding = '0 24px';
        buttons = [back];
        items = [{ el: back, activate: close }];
        opts = { back: close };
      }
      const table = readScores();
      let body;
      if (!table.length) {
        body = txt('p', 'lb-note', 'No scores yet.');
        body.style.textAlign = 'center';
      } else if (phone) {
        body = el('div', 'lb-scores-cols');
        body.append(scoreRows(table, highlight, 0, 5), scoreRows(table, highlight, 5, 10));
      } else body = scoreRows(table, highlight, 0, 10);
      if (phone) {
        const head = el('div', 'lb-header');
        head.append(h, ...buttons);
        face.append(head, body);
      } else {
        const row = el('div', 'lb-btns');
        row.style.paddingTop = '4px';
        row.append(...buttons);
        face.append(h, el('div', '', RULE).firstChild, body, row);
      }
      return { panel: panel, items: items, opts: opts };
    }
    function openScores(highlight, afterGame) {
      state.screen = 'scores';
      showDialog(() => scoresDialog(highlight, afterGame));
    }

    function gameOverDialog(score, newBest, qualifies) {
      const phone = V.phone;
      const { panel, face } = plaque('lb-go-t', 420, 560, phone ? 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:22px;align-items:center;padding:20px' : 'gap:12px;padding:22px 18px 18px');
      const h = heading('lb-go-t', 'Game over');
      const result = el('div', 'lb-result');
      if (phone) {
        result.style.padding = '0';
        h.style.marginBottom = '6px';
        result.append(h);
      }
      if (newBest) result.append(txt('p', 'lb-flag', 'New best'));
      result.append(txt('p', 'lb-num lb-score-xl', String(score)), txt('p', 'lb-unit', 'wisps'));
      if (!phone) face.append(h, el('div', '', RULE).firstChild);
      face.append(result);
      let items;
      let opts = {};
      if (qualifies) {
        const cont = button('Continue', true);
        cont.style.width = '100%';
        face.append(cont);
        items = [{ el: cont, activate: () => { sfx('confirm'); openInitials(); } }];
      } else {
        items = [
          menuItem('Play again', startOver),
          menuItem('High scores', () => { sfx('confirm'); openScores(-1, true); }),
          menuItem('Menu', toMenu)
        ];
        face.append(menuNav('Game over', items));
        opts = { back: toMenu };
      }
      return { panel: panel, items: items, opts: opts };
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
      showDialog(() => gameOverDialog(score, newBest, qualifies));
    }

    /* Initials: its own key handling. A computer has the keys; a phone taps a letter and then the arrows. */
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.';
    let initials = null;
    function stepLetter(d) {
      const L = initials.letters;
      L[initials.sel] = CHARS[(CHARS.indexOf(L[initials.sel]) + d + CHARS.length) % CHARS.length];
      sfx('blip');
      renderInitials();
    }
    function selectLetter(i, quiet) {
      initials.sel = clamp(i, 0, 2);
      if (!quiet) sfx('select');
      renderInitials();
    }
    function renderInitials() {
      if (!initials || !initials.slots) return;
      const phone = V.phone;
      initials.slots.innerHTML = '';
      const names = ['First', 'Second', 'Third'];
      initials.letters.forEach((ch, i) => {
        const on = i === initials.sel;
        const col = el('div', 'lb-slot-col');
        const state2 = on ? ' is-selected' : i > initials.sel ? ' is-unset' : '';
        if (phone) {
          const arrow = (icon, label, d) => {
            const b = el('button', 'lb-arrow-btn', icon);
            b.type = 'button';
            b.setAttribute('aria-label', label);
            b.addEventListener('click', () => stepLetter(d));
            return b;
          };
          const slot = txt('button', 'lb-slot-btn' + state2, ch);
          slot.type = 'button';
          slot.setAttribute('aria-label', names[i] + ' letter, ' + ch + (on ? ', selected' : ''));
          if (on) slot.setAttribute('aria-pressed', 'true');
          slot.addEventListener('click', () => selectLetter(i));
          col.append(on ? arrow(ICON.chevUp, 'Next letter', 1) : el('span', 'lb-arrow-gap'), slot, on ? arrow(ICON.chevDown, 'Previous letter', -1) : el('span', 'lb-arrow-gap'));
        } else {
          const chev = (icon, d) => {
            if (!on) return el('span', 'lb-chev is-blank');
            const holder = el('span', '', icon);
            const svg = holder.firstChild;
            svg.style.cursor = 'pointer';
            svg.addEventListener('click', () => stepLetter(d));
            return svg;
          };
          const slot = txt('span', 'lb-slot' + state2, ch);
          if (on) slot.setAttribute('aria-current', 'true');
          slot.addEventListener('click', () => selectLetter(i));
          col.append(chev(ICON.chevUp, 1), slot, chev(ICON.chevDown, -1));
        }
        initials.slots.append(col);
      });
    }
    function initialsDialog() {
      const phone = V.phone;
      const { panel, face } = plaque('lb-ne-t', 400, 580, phone ? 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:18px;align-items:center;padding:18px 20px' : 'padding:22px 18px 18px', phone ? '' : 'is-centred');
      const h = heading('lb-ne-t', 'New best');
      const slots = el('div', 'lb-slots');
      slots.setAttribute('role', 'group');
      slots.setAttribute('aria-label', 'Initials');
      initials.slots = slots;
      const done = button('Done', true);
      done.style.padding = '0 28px';
      done.addEventListener('click', saveInitials);
      if (phone) {
        slots.style.cssText = 'gap:10px;padding:0';
        const line = el('p', 'lb-hint', '<span class="lb-num" style="font-size:18px">' + state.score + '</span> wisps. Tap a letter, then the arrows to change it.');
        line.style.cssText = 'font-size:16px;line-height:1.35;color:var(--text-2)';
        done.style.marginTop = '6px';
        const left = el('div');
        left.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:10px';
        left.append(h, line, done);
        face.append(left, slots);
      } else {
        const line = el('p', 'lb-hint', '<span class="lb-num" style="font-size:20px">' + state.score + '</span> wisps. Enter your initials.');
        line.style.cssText = 'font-size:17px;color:var(--text-2)';
        face.append(h, el('div', '', RULE).firstChild, line, slots);
        if (!touch) face.append(el('p', 'lb-hint', kbd('up') + ' ' + kbd('down') + ' letter · ' + kbd('left') + ' ' + kbd('right') + ' move · ' + kbd('Enter') + ' done'));
        face.append(done);
      }
      renderInitials();
      setTimeout(() => { if (done.isConnected) done.focus({ preventScroll: true }); }, 0);
      return { panel: panel };
    }
    function openInitials() {
      state.screen = 'initials';
      const last = String(store.get('retrokit.initials', 'AAA')).toUpperCase();
      initials = { letters: [0, 1, 2].map((i) => (CHARS.indexOf(last[i]) >= 0 && last[i] ? last[i] : 'A')), sel: 0, slots: null };
      showDialog(initialsDialog);
    }
    function initialsKey(e) {
      const i = initials.sel;
      if (e.code === 'ArrowUp') { e.preventDefault(); stepLetter(1); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); stepLetter(-1); }
      else if (e.code === 'ArrowLeft' || e.code === 'Backspace') { e.preventDefault(); selectLetter(i - 1); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); selectLetter(i + 1); }
      else if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); if (!e.repeat) saveInitials(); }
      else if (e.code === 'Space') e.preventDefault();   // Done has the focus: Space must not press it
      else if (e.key && e.key.length === 1 && CHARS.indexOf(e.key.toUpperCase()) >= 0) {
        e.preventDefault();
        initials.letters[i] = e.key.toUpperCase();
        sfx('blip');
        selectLetter(i + 1, true);
      }
    }
    function saveInitials() {
      if (!initials) return;
      const name = initials.letters.join('');
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

    /* ----- Title screen: the lancet arch, standing on the left, and its two tiles ----- */
    function buildTitle() {
      const phone = V.phone;
      const ph = phone ? ' is-phone' : '';
      titleScreen.innerHTML = '';
      const scrim = el('div', 'lb-scrim is-title');
      scrim.style.position = 'fixed';
      const wrap = el('div', 'lb-title-arch' + ph);
      const arch = el('div', 'lb-arch' + ph, '<div class="lb-arch-card"></div>');
      const inner = el('div', 'lb-arch-inner');
      const h1 = el('h1', 'lb-title');
      lines.forEach((line, i) => { if (i) h1.append(el('br')); h1.append(line); });
      const rule = el('div', 'lb-rule is-arch', '<i></i>');
      rule.setAttribute('aria-hidden', 'true');
      const menu = el('nav', 'lb-title-menu');
      menu.setAttribute('aria-label', 'Title menu');
      const item = (label, activate) => {
        const b = txt('button', 'lb-title-item', label);
        b.type = 'button';
        menu.append(b);
        return { el: b, menu: true, activate: activate };
      };
      const items = [
        item('Start game', () => { sfx('confirm'); startGame(); }),
        item('High scores', () => { sfx('confirm'); openScores(-1, false); }),
        item('Settings', () => openSettings('title'))
      ];
      const best = el('p', 'lb-best', 'Best <span class="lb-num">' + pad4(bestScore()) + '</span> wisps');
      inner.append(h1, rule, menu, best);
      if (!touch && !phone) inner.append(el('p', 'lb-hint', kbd('up') + ' ' + kbd('down') + ' choose · ' + kbd('Enter') + ' select'));
      arch.append(inner);
      wrap.append(arch);
      const tiles = el('div', 'lb-title-tiles lb-arch-tiles' + ph);
      const sound = el('button', 'lb-arch-tile');
      sound.type = 'button';
      sound.dataset.act = 'sound';
      sound.addEventListener('click', () => { settings.muted = !settings.muted; applySettings(); audio.unlock(); sfx('blip'); sound.blur(); });
      tiles.append(sound, fullscreenTile('lb-arch-tile'));
      titleScreen.append(scrim, wrap, tiles);
      const keep = titleNav ? titleNav.index : 0;
      titleNav = makeNav(items, { start: keep }, sfx);
      if (dialogLayer.hidden) nav = titleNav;
      applySettings();
    }

    /* ----- Flow ----- */
    function startGame() {
      audio.unlock();
      if (music) music.rewind();
      currentDialog = null;
      dialogLayer.hidden = true;
      dialogLayer.innerHTML = '';
      titleScreen.hidden = true;
      nav = null;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      state.inGame = true;
      state.screen = 'play';
      state.score = 0;
      state.health = 1;
      state.mana = 1;
      state.time = 0;
      state.timers = [];
      state.ending = false;
      state.shakeAmt = 0;
      state.shakeT = 0;
      buildHud();
      layout();
      resetInput();
      try { state.game = cfg.start(api) || {}; } catch (e) { reportError(e); state.game = {}; }
      lastFrame = performance.now();
      acc = 0;
    }
    function pause() {
      if (state.screen !== 'play') return;
      state.screen = 'paused';
      resetInput();
      sfx('pause');
      showDialog(pauseDialog);
      if (cfg.onPause) cfg.onPause(state.game, api);
    }
    function resume() {
      if (upright()) return;
      sfx('confirm');
      closeDialog();
      state.screen = 'play';
      resetInput();
      lastFrame = performance.now();
      acc = 0;
    }
    function quitToTitle() {
      closeDialog();
      state.inGame = false;
      state.screen = 'title';
      state.game = null;
      buildHud();
      titleNav = null;
      buildTitle();
      titleScreen.hidden = false;
      nav = titleNav;
      layout();
      resetInput();
    }
    function addWisps(n) {
      state.score = Math.max(0, state.score + (n | 0));
      syncHud();
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
      ctx.fillStyle = inkColour;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let sx = 0;
      let sy = 0;
      if (state.shakeT > 0 && state.shakeAmt > 0 && !settings.reduceMotion) {
        sx = rand(-state.shakeAmt, state.shakeAmt);
        sy = rand(-state.shakeAmt, state.shakeAmt);
      }
      ctx.setTransform(V.k, 0, 0, V.k, Math.round(sx * V.k), Math.round(sy * V.k));
      try {
        if (state.inGame && state.game) cfg.draw(ctx, state.game, api);
        else if (!state.inGame && cfg.drawTitle) cfg.drawTitle(ctx, api);
      } catch (e) { reportError(e); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    let speed = 1;
    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000)) * speed;
      lastFrame = now;
      state.t += dt;
      if (root.clientWidth !== V.w || root.clientHeight !== V.h) layout();
      // checked every frame as well as on the event, in case a turn's event never comes
      if (upright() === rotateEl.hidden) {
        rotateEl.hidden = !upright();
        if (!rotateEl.hidden) fitScreens();
      }
      if (state.screen === 'play' && upright()) pause();
      if (state.screen === 'play') {
        acc += dt;
        while (acc >= STEP) { tick(); acc -= STEP; }
      } else acc = 0;
      if (music) music.sync(state.inGame, state.screen, state.ending);
      render();
    }
    const inkColour = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
    if (!inkColour) console.error('Lantern Box: lantern-box.css is not loaded. Link it before lantern-box.js.');

    /* ----- Public API handed to the game -----
       lb.W, lb.H: the picture's size in lines (H is always 540; W follows the window). lb.touch: a touch device.
       lb.input: left, right, up, down, fire, alt (held), input.pressed.* (just pressed), input.tap, input.any, input.key(code),
         input.keyPressed(code), and two fingers: input.pointer and input.pointer2 (x, y in lines; down, pressed, released, dx, dy).
       lb.addWisps(n), lb.wisps, lb.best: the score, in whole wisps. lb.gameOver(delay): ends the run (game over, then the
         initials if it makes the top ten). lb.hud.health(0..1), lb.hud.mana(0..1): the bars; mana: false in the config leaves
         the mana bar out. lb.sfx('name'), sfx.tone(o), sfx.noise(o). lb.music(0 or 1): the soundtrack to play.
       lb.shake(lines, seconds): the picture only, never under Reduce motion. lb.after(seconds, fn): a timer in game time.
       lb.settings: effects, reduceMotion, picture and the rest (read only). lb.screen, lb.time, lb.t.
       lb.rand, lb.randInt, lb.pick, lb.clamp, lb.lerp.
       In the game's config: id, title (a string, or its two lines), start, update, draw(ctx, g, lb), drawTitle(ctx, lb),
       mana, music, init(lb), onPause(g, lb). */
    const api = {
      H: H, version: VERSION, touch: touch, input: input, hud: hud, sfx: sfx,
      get W() { return V.W; },
      get settings() { return Object.assign({}, settings, { picture: own.picture }); },
      get screen() { return state.screen; },
      get time() { return state.time; },
      get t() { return state.t; },
      get wisps() { return state.score; },
      get ending() { return state.ending; },
      get best() { return Math.max(bestScore(), state.score); },
      addWisps: addWisps, gameOver: gameOver, shake: shake, after: after,
      music: (i) => { if (music && music.tracks[i]) music.want = i; },
      rand: rand, randInt: randInt, pick: pick, clamp: clamp, lerp: lerp
    };

    /* ----- Boot ----- */
    V.w = root.clientWidth;
    V.h = root.clientHeight;
    V.phone = V.h < PHONE_H || V.w < PHONE_W;
    buildTitle();
    nav = titleNav;
    layout();
    if (cfg.init) { try { cfg.init(api); } catch (e) { reportError(e); } }
    if (music && !settings.muted) setTimeout(music.load, 300);   // get the tracks ready behind the title screen
    const fontLoads = ['400 20px "IM Fell English"', '400 14px "Alegreya Sans"', '500 14px "Alegreya Sans"', '700 14px "Alegreya Sans"']
      .map((f) => (document.fonts && document.fonts.load ? document.fonts.load(f) : Promise.resolve()));
    const reveal = () => {
      root.classList.remove('lb-loading');
      layout();
      fitScreens();
      if (nav) nav.focus();   // nothing can take the focus while the page is hidden
    };
    Promise.race([Promise.all(fontLoads), new Promise((r) => setTimeout(r, 2500))]).then(reveal, reveal);
    requestAnimationFrame(frame);

    /* Test hook: lets automated checks drive the shell. Not for games. */
    api._debug = {
      state: state,
      settings: settings,
      own: own,
      view: V,
      music: music,
      get nav() { return nav; },
      get game() { return state.game; },
      get speed() { return speed; },
      set speed(v) { speed = clamp(+v || 1, 0.1, 20); },
      start: startGame, pause: pause, resume: resume, quit: quitToTitle,
      setWisps: (n) => { state.score = n | 0; syncHud(); },
      showGameOver: showGameOver, openSettings: openSettings, openScores: openScores, openInitials: openInitials
    };
    return api;
  }

  window.LanternBox = {
    version: VERSION,
    H: H,
    game(cfg) {
      if (window.LanternBox.current) throw new Error('Lantern Box: only one LanternBox.game() per page.');
      const boot = () => { window.LanternBox.current = createGame(cfg); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
      else boot();
    },
    current: null
  };
})();
