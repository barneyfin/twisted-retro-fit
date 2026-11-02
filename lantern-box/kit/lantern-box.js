/* Lantern Box 0.5 — runtime
   One file, no dependencies. Exposes window.LanternBox. Pair it with lantern-box.css.
   Copied from Retro Kit's shell and restyled to the design system (lantern-box/design-system/); the two soundtracks and
   the way settings are saved come from City Nights' copy of it. It owns everything every game shares: the picture
   (a 2D canvas 540 lines tall that fills the window; its width follows the window), the game loop, keyboard and touch
   input, every screen outside play (title, pause, settings, game over, initials, high scores, rotate), the HUD, full
   screen, sound, music, saved data and the tools that draw the World (lb.world). Public API: see `api` below. */
(function () {
  'use strict';

  const VERSION = '0.5.3';
  const H = 540;              // the picture's height in lines, whatever the window
  const STEP = 1 / 60;
  const PHONE_H = 520;        // a window shorter than this, or narrower than PHONE_W, gets the phone layouts
  const PHONE_W = 760;
  const MAX_DPR = 2;          // Picture, Best: above this the picture is drawn at 2x and enlarged smoothly
  const BEST_LINES = 1440;    // Picture, Best: never more lines than this, however large the screen (the layers' memory grows with it)
  const PLAIN_LINES = 810;    // Picture, Faster and Fastest: one picture pixel per screen point, and never more lines than this
  const TITLE_PACE = 40;      // lines a second the place moves behind the title arch

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

  /* ---------- The World: the drawing code ----------
     Everything from "helpers" to "the sample strip" is the drawing code of the signed-off look, the Gloam Hallow directions
     page at round 12 (design-system/components/bundle.js), word for word, so it stays as it was drawn. The changes are the
     speed test's switches (speed-test/build.py), which draw the same shapes at different moments, and the Effects switch (FX).
     "the kit way" is the speed test's way of drawing; "the tools" at the end are what a game calls, as lb.world. */
  const World = (function () {
  "use strict";
/* ============================== helpers ============================== */
const LH = 540;                       // logical height of the picture
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const posmod=(a,n)=>((a%n)+n)%n;
function rng32(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function hsh(){let h=2166136261>>>0;for(let i=0;i<arguments.length;i++){h^=(arguments[i]|0);h=Math.imul(h,16777619)>>>0;}h^=h>>>15;h=Math.imul(h,2246822507)>>>0;h^=h>>>13;return h>>>0;}
function hx(c){const n=parseInt(c.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function mixc(c1,c2,t){const a=hx(c1),b=hx(c2);return"rgb("+Math.round(lerp(a[0],b[0],t))+","+Math.round(lerp(a[1],b[1],t))+","+Math.round(lerp(a[2],b[2],t))+")";}
function rgba(c,al){const a=hx(c);return"rgba("+a[0]+","+a[1]+","+a[2]+","+al+")";}
function mk(w,h){const c=document.createElement("canvas");c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;}
function range(n){return Array.from({length:n},(_,i)=>i);}
function qpts(a,c,b,n){const out=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;out.push([u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]]);}return out;}
const INK="#060508";

/* ============================== Lantern Box ============================== */
const SKY={night:["#1b0f2e","#57284f","#c06844","#eea05c"],storm:["#0f0507","#370c14","#74201f","#9c3a28"],
  dawn:["#0a1530","#22406c","#6a8cb8","#c2cfe0"],mist:["#55654f","#81907a","#aab59a","#ccd3b8"]};
const AIR={night:"#b8644e",storm:"#6e1f1f",dawn:"#6a82a8",mist:"#a6b195"};
const HAZE={night:"#ffb066",storm:"#ff5a3a",dawn:"#d2e0f4",mist:"#e8eed6"};
const MOON={x:0.64,y:0.36,r:80,col:"#ffe2a6",halo:"#ffae63"};
const TINTS=[0.52,0.45,0.31,0.14];
/* each level is a different place: its own sky, light, air, mist, flyers, and what fills each layer and the path */
const LV={
  night:{name:"Night",place:"the graveyard at the edge of the village",set:"village",tints:[0.856,0.702,0.394,0.24],lift:60,cw4:760,back:0.16,light:"moon",fly:"bats",litP:0.18,edge:"rgba(255,231,184,0.9)",vig:0.5,crest:0.5,mist:null,
    desc:"walks a black path through the graveyard at the edge of the village, past graves, a ruined wall and a crooked manor, chapel or cottage, under a detailed moon in an amber-to-violet sky"},
  storm:{name:"Blood-red rain",place:"the old town",set:"town",tints:[0.9,0.76,0.48,0.14],lift:70,light:"moon",fly:"bats",litP:0.26,edge:"rgba(255,206,184,0.85)",vig:0.5,crest:0.32,mist:null,
    desc:"walks the old town's street in blood-red rain, past street lamps, barrels, a well, a gate arch and a tavern or a tall townhouse, with crowded rooftops behind"},
  dawn:{name:"Dawn",place:"the open moor",set:"moor",tints:[0.82,0.64,0.4,0.22],lift:30,light:"setmoon",fly:"crows",litP:0.06,edge:"rgba(214,228,255,0.9)",vig:0.42,crest:0.42,
    mist:null,hollows:{col:"#dfe8f6",a:[0,0,0.62,0.475,0.323],F:[0,0,378,412,448]},
    desc:"crosses the open moor in cold blue dawn light, past standing stones, cairns, dry-stone walls and a dolmen, with a pale moon setting on the right and daybreak glowing on the left"},
  mist:{name:"Mist",place:"the wind-bent forest",set:"forest",tints:[0.9,0.77,0.57,0.42],lift:35,cw4:520,back:0.26,light:"sun",fly:"fewcrows",litP:0.1,edge:"rgba(236,242,214,0.85)",vig:0.3,crest:0,
    mist:{col:"#eef2dc",bands:[[0,104,1,4],[1,378,1,5],[2,424,0.9,8],[3,456,0.55,11]]},
    desc:"walks a green forest at midday in thick mist, every tree bent the same way by the wind, the sun a pale disc, past stumps, ferns, a fallen trunk, a candlelit shrine and a woodcutter's hut"}
};
const EMBER={danger:"#ff7a3a",glow:"#ff5a1f"};
const WITCH={core:"#d2f29a",mid:"#a6d862",glow:"#86c94a"}; // witch-light: kept only for menacing things at ground level
const SPLASH_COL={green:WITCH,amber:{core:"#ffd99a",mid:"#ffb04e",glow:"#ff9a2e"},blue:{core:"#a8d4ff",mid:"#5a92ff",glow:"#2f62ff"}};
let SP=WITCH,SPI=0; // the colour, and how intense the glow is (0 normal, 1 intense)
const SPLASH={village5:[150,790,1535],town:[120,620,1545],moor:[345,770,1680],forest:[455,790,1540]};
const MON_BOX={hatmaw:[-46,-86,45,8],ghoul:[-54,-97,38,10],bat:[-29,-23,28,18],thorns:[-53,-51,69,18],
  crawler:[-36,-36,35,14],bat2:[-34,-40,33,15],ghoul2:[-49,-103,26,9],walker:[-43,-203,45,9]}; // where each monster can reach, with room to move
const GOLD_LIGHT="#ffcf6a",POTION="#e0473c";

/* ============================== drawing tapered limbs ============================== */
function taper(x,s){
  const x1=s[0],y1=s[1],x2=s[2],y2=s[3],w1=s[4],w2=s[5],dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  x.beginPath();x.moveTo(x1+nx*w1/2,y1+ny*w1/2);x.lineTo(x2+nx*w2/2,y2+ny*w2/2);x.lineTo(x2-nx*w2/2,y2-ny*w2/2);x.lineTo(x1-nx*w1/2,y1-ny*w1/2);x.closePath();x.fill();
  x.beginPath();x.arc(x2,y2,w2/2,0,Math.PI*2);x.fill();
  if(w1>3){x.beginPath();x.arc(x1,y1,w1/2,0,Math.PI*2);x.fill();}
}
function geomSprite(g,sc){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const s of g.segs){const m=Math.max(s[4],s[5])/2+1;x0=Math.min(x0,s[0]-m,s[2]-m);x1=Math.max(x1,s[0]+m,s[2]+m);y0=Math.min(y0,s[1]-m,s[3]-m);y1=Math.max(y1,s[1]+m,s[3]+m);}
  for(const b of g.blobs){const m=Math.max(b[2],b[3])+1;x0=Math.min(x0,b[0]-m);x1=Math.max(x1,b[0]+m);y0=Math.min(y0,b[1]-m);y1=Math.max(y1,b[1]+m);}
  x0-=2;y0-=2;x1+=2;y1+=2;
  const w=x1-x0,h=y1-y0,c=mk(w*sc,h*sc),x=c.getContext("2d");
  x.setTransform(sc,0,0,sc,-x0*sc,-y0*sc);x.fillStyle=INK;x.strokeStyle=INK;x.lineCap="round";x.lineJoin="round";
  for(const s of g.segs)taper(x,s);
  for(const b of g.blobs){x.beginPath();x.ellipse(b[0],b[1],b[2],b[3],b[4]||0,0,Math.PI*2);x.fill();}
  return{c,ox:-x0,oy:-y0,w,h,eye:g.eye};
}
/* ============================== pollard trees ============================== */
/* the base you liked: a thick flared foot, gripping roots, a trunk that kinks near the ground, a knuckle of burrs */
function pollardBase(r,h,opt,T,blobs){
  const B=h*(opt.B||(0.13+r()*0.04));
  T(0,3,0,-B*0.85,B*1.5,B*0.98);
  const nr=3+Math.floor(r()*3);
  for(let i=0;i<nr;i++){const s=i%2?1:-1,sx=s*B*(0.15+r()*0.15),mx=s*B*(0.5+r()*0.35),my=-B*(0.1+r()*0.12),ex=s*B*(0.85+r()*0.9);
    T(sx,-B*0.35,mx,my,B*0.42,B*0.2);T(mx,my,ex,3,B*0.2,B*0.05);}
  const Hb=h*(0.24+r()*0.14),lean=(r()-0.5)*0.3,k1=(r()<0.5?-1:1)*(0.28+r()*0.32);
  const parts=[[0.32,lean+k1,B,B*0.9],[0.36,lean-k1*(1.05+r()*0.45),B*0.9,B*0.8],[0.32,lean+(r()-0.5)*0.2,B*0.8,B*0.72]];
  let x=0,y=-B*0.3,a=lean;
  for(const p of parts){const nx=x+Math.sin(p[1])*Hb*p[0],ny=y-Math.cos(p[1])*Hb*p[0];T(x,y,nx,ny,p[2],p[3]);
    if(r()<0.45)blobs.push([lerp(x,nx,0.5)+(r()-0.5)*B*0.3,lerp(y,ny,0.5),B*(0.22+r()*0.16),B*(0.18+r()*0.14),r()]);
    x=nx;y=ny;a=p[1];}
  const nk=3+Math.floor(r()*3),kn=opt.kn||1;
  for(let i=0;i<nk;i++)blobs.push([x+(r()-0.5)*B*0.7,y+(r()-0.3)*B*0.45,B*(0.36+r()*0.24)*kn,B*(0.28+r()*0.2)*kn,r()*3]);
  return{x,y,a,B};
}
function tips(r,T,opt,h,x,y,ang,w,sl){
  if(opt.claw!==false){let ka=ang,kx=x,ky=y,kl=sl*0.5;const dir=r()<0.5?-1:1;
    for(let j=0;j<3;j++){ka+=dir*0.75;const nx=kx+Math.sin(ka)*kl,ny=ky-Math.cos(ka)*kl,ww=Math.max(0.6,w*(0.8-j*0.15));T(kx,ky,nx,ny,w,ww);w=ww;kx=nx;ky=ny;kl*=0.72;}}
  if(opt.twigs!==false){for(let k=0;k<2;k++){let ta=ang+(r()-0.5)*1.5,tx=x,ty=y;const tl=h*(0.02+r()*0.025);
    for(let j=0;j<2;j++){ta+=(r()-0.5)*0.7;const nx=tx+Math.sin(ta)*tl,ny=ty-Math.cos(ta)*tl;T(tx,ty,nx,ny,0.75,0.55);tx=nx;ty=ny;}}}
}
/* round 2's limbs, kept for the comparison */
function limbGrow2(r,T,opt,h,x,y,ang,len,w,d,cand){
  const n=3+Math.floor(r()*2),sl=len/n;let elb=r()<0.5?-1:1;
  for(let s=0;s<n;s++){
    let turn;
    if(cand&&s===1)turn=-Math.sign(ang)*(0.75+r()*0.5);
    else if(r()<0.42){turn=elb*(0.42+r()*0.45);elb=-elb;}
    else turn=(r()-0.5)*0.22;
    ang=clamp(ang+turn,-2.2,2.2);
    const nx=x+Math.sin(ang)*sl,ny=y-Math.cos(ang)*sl,w2=Math.max(0.7,w*(0.7+r()*0.1));
    T(x,y,nx,ny,w,w2);
    if(d>0&&s>=1&&r()<0.55)limbGrow2(r,T,opt,h,nx,ny,ang+(r()<0.5?-1:1)*(0.5+r()*0.6),len*(0.42+r()*0.2),w2*0.6,d-1,false);
    x=nx;y=ny;w=w2;
  }
  tips(r,T,opt,h,x,y,ang,w,sl);
}
/* round 3's limbs: fewer, thicker, spread apart, each bending sharply. The first elbow turns outward, so crowns open out instead of bunching */
function limbGrow3(r,T,opt,h,x,y,ang,len,w,d,cand){
  const n=3+(r()<0.5?1:0),sl=len/n,late=r()<0.6;let out=Math.sign(ang)||(r()<0.5?-1:1);
  for(let s=0;s<n;s++){
    let turn;
    if(cand&&s===1)turn=-Math.sign(ang)*(0.85+r()*0.45);
    else if(s===1||(late&&s===n-1)){turn=out*(0.45+r()*0.4);out=-out;}
    else turn=(r()-0.5)*0.16;
    ang=clamp(ang+turn,-2.0,2.0);
    const nx=x+Math.sin(ang)*sl,ny=y-Math.cos(ang)*sl,w2=Math.max(0.8,w*(0.77+r()*0.07));
    T(x,y,nx,ny,w,w2);
    if(d>0&&s>=1&&s<n-1&&r()<0.5)limbGrow3(r,T,opt,h,nx,ny,ang+out*(0.55+r()*0.5),len*(0.4+r()*0.15),w2*0.62,d-1,false);
    x=nx;y=ny;w=w2;
  }
  tips(r,T,opt,h,x,y,ang,w,sl);
}
function pollardGeom(r,h,opt,ver){
  opt=opt||{};
  const segs=[],blobs=[],T=(a,b,c,d,e,f)=>segs.push([a,b,c,d,e,f]),k=pollardBase(r,h,opt,T,blobs),lw=opt.lw||1;
  if(ver===2){
    const nl=opt.limbs||(5+Math.floor(r()*4)),sub=opt.sub===undefined?2:opt.sub;
    for(let i=0;i<nl;i++){const u=(i+0.5)/nl,ang=k.a+lerp(-1.35,1.35,u)+(r()-0.5)*0.35,cand=Math.abs(ang)>0.85&&r()<0.6;
      limbGrow2(r,T,opt,h,k.x+(r()-0.5)*k.B*0.4,k.y+(r()-0.5)*k.B*0.2,cand?Math.sign(ang)*(1.25+r()*0.25):ang,h*(0.3+r()*0.2),k.B*(0.3+r()*0.12)*lw,sub,cand);}
  }else{
    const nl=opt.limbs3||(4+Math.floor(r()*3)),sub=opt.sub===undefined?1:opt.sub;
    for(let i=0;i<nl;i++){const u=nl>1?i/(nl-1):0.5,ang=k.a+lerp(-1.4,1.4,u)+(r()-0.5)*0.24,cand=Math.abs(ang)>0.9&&r()<0.55;
      limbGrow3(r,T,opt,h,k.x+lerp(-k.B*0.3,k.B*0.3,u),k.y+(r()-0.5)*k.B*0.2,cand?Math.sign(ang)*(1.3+r()*0.2):ang,h*(0.3+r()*0.16),k.B*(0.36+r()*0.12)*lw,sub,cand);}
  }
  return{segs,blobs};
}
function overhangGeom(r,ver){ // a great limb reaching in from the top corner
  const segs=[],blobs=[],T=(a,b,c,d,e,f)=>segs.push([a,b,c,d,e,f]),G=ver===2?limbGrow2:limbGrow3;
  blobs.push([0,-8,26,20,0.3]);
  G(r,T,{},300,6,0,2.05+r()*0.2,290,30,ver===2?2:1,false);
  G(r,T,{},300,0,6,1.6+r()*0.2,220,24,ver===2?2:1,false);
  return{segs,blobs};
}
/* ============================== wind-bent trees: the forest in your photo ============================== */
/* A constant wind off the sea, blowing left to right. Trunks lean and bend away from it, every limb is swept
   the same way, and the windward side is left with short broken stubs. */
function windLimb(r,T,opt,h,x,y,ang,len,w,d){
  const n=3+(r()<0.5?1:0),sl=len/n,target=1.25+r()*0.35;
  for(let s=0;s<n;s++){
    let turn=(target-ang)*(0.35+r()*0.2);
    if(r()<0.35)turn+=(r()<0.5?-1:1)*(0.3+r()*0.25); // an angular kink
    ang=clamp(ang+turn,-0.6,2.1);
    const nx=x+Math.sin(ang)*sl,ny=y-Math.cos(ang)*sl,w2=Math.max(0.7,w*(0.74+r()*0.08));
    T(x,y,nx,ny,w,w2);
    if(d>0&&s>=1&&s<n-1&&r()<0.6)windLimb(r,T,opt,h,nx,ny,ang-0.5-r()*0.4,len*(0.45+r()*0.15),w2*0.6,d-1);
    x=nx;y=ny;w=w2;
  }
  tips(r,T,opt,h,x,y,ang,w,sl);
}
function windGeom(r,h,opt){
  opt=opt||{};
  const segs=[],blobs=[],T=(a,b,c,d,e,f)=>segs.push([a,b,c,d,e,f]),B=h*(opt.B||(0.11+r()*0.03));
  T(0,3,0,-B*0.7,B*1.45,B*0.95);
  const nr=3+Math.floor(r()*2); // roots: longer on the windward side, bracing against the wind
  for(let i=0;i<nr;i++){const sd=i%2?1:-1,ex=sd*B*(sd<0?1.2+r()*0.9:0.7+r()*0.5),mx=sd*B*(0.5+r()*0.3),my=-B*(0.1+r()*0.1);
    T(sd*B*0.2,-B*0.35,mx,my,B*0.4,B*0.18);T(mx,my,ex,3,B*0.18,B*0.05);}
  const lean=opt.lean===undefined?0.55+r()*0.35:opt.lean,Hs=h*(0.5+r()*0.12),pts=[];
  let x=0,y=-B*0.4,a=-0.08+(r()-0.5)*0.1,w=B;
  for(let i=0;i<4;i++){ // the trunk leans further with height
    a=clamp(a+lean*(0.25+r()*0.18)+(r()<0.4?(r()-0.5)*0.5:0),-0.3,1.45);
    const sl=Hs/4*(1-i*0.08),nx=x+Math.sin(a)*sl,ny=y-Math.cos(a)*sl,w2=w*(0.8+r()*0.06);
    T(x,y,nx,ny,w,w2);pts.push([nx,ny,a,w2]);
    if(r()<0.4)blobs.push([lerp(x,nx,0.5),lerp(y,ny,0.5),w*0.32,w*0.26,r()*3]);
    x=nx;y=ny;w=w2;
  }
  const nl=opt.limbs||(4+Math.floor(r()*3)),sub=opt.sub===undefined?1:opt.sub;
  for(let i=0;i<nl;i++){const p=pts[1+Math.floor(r()*(pts.length-1))];windLimb(r,T,opt,h,p[0],p[1],0.2+r()*0.9,h*(0.28+r()*0.2),p[3]*(0.45+r()*0.15),sub);}
  windLimb(r,T,opt,h,x,y,a,h*(0.32+r()*0.15),w*0.8,sub); // the crown carries on from the top of the trunk
  for(let i=0;i<2;i++){const p=pts[1+Math.floor(r()*(pts.length-1))],sa=-0.7-r()*0.6,L2=h*(0.04+r()*0.05);T(p[0],p[1],p[0]+Math.sin(sa)*L2,p[1]-Math.cos(sa)*L2,p[3]*0.35,p[3]*0.18);}
  const ep=pts[0];return{segs,blobs,eye:[ep[0],ep[1],ep[3]]};
}
/* tall broken trees: dead trunks snapped off high up, with a few stubs, leaning a little with the wind */
function snagGeom(r,h){
  const segs=[],blobs=[],T=(a,b,c,d,e,f)=>segs.push([a,b,c,d,e,f]),B=h*(0.075+r()*0.02);
  T(0,3,0,-B*0.6,B*1.5,B);
  for(let i=0;i<3;i++){const sd=i%2?1:-1,ex=sd*B*(0.9+r()*0.8);T(sd*B*0.2,-B*0.3,ex*0.55,-B*0.08,B*0.38,B*0.16);T(ex*0.55,-B*0.08,ex,3,B*0.16,B*0.05);}
  let x=0,y=-B*0.4,a=(r()-0.3)*0.12,w=B;const n=5,Hs=h*(0.82+r()*0.12),pts=[];
  for(let i=0;i<n;i++){a=clamp(a+0.05+(r()-0.45)*0.14,-0.25,0.45);const sl=Hs/n,nx=x+Math.sin(a)*sl,ny=y-Math.cos(a)*sl,w2=w*(0.88+r()*0.05);T(x,y,nx,ny,w,w2);pts.push([nx,ny,a,w2]);
    if(r()<0.3)blobs.push([lerp(x,nx,0.5)+(r()<0.5?-1:1)*w*0.3,lerp(y,ny,0.5),w*0.28,w*0.22,r()*3]);x=nx;y=ny;w=w2;}
  for(let i=0;i<4;i++){const sa=a+(i-1.5)*0.35+(r()-0.5)*0.2,L2=w*(0.6+r()*1.4);T(x+(i-1.5)*w*0.22,y+w*0.15,x+(i-1.5)*w*0.22+Math.sin(sa)*L2,y-Math.cos(sa)*L2,w*0.3,0.6);} // the splintered top
  const ns=1+Math.floor(r()*3);
  for(let i=0;i<ns;i++){const p=pts[1+Math.floor(r()*(n-2))],sa=r()<0.7?0.9+r()*0.6:-0.9-r()*0.4,L2=h*(0.06+r()*0.12);windLimb(r,T,{claw:false,twigs:false},h,p[0],p[1],sa,L2,p[3]*0.4,0);}
  return{segs,blobs,eye:[pts[0][0],pts[0][1],pts[0][3]]};
}
function windOverhangGeom(r){ // a wind-bent limb reaching in from the top corner
  const segs=[],blobs=[],T=(a,b,c,d,e,f)=>segs.push([a,b,c,d,e,f]);
  blobs.push([0,-8,26,20,0.3]);
  windLimb(r,T,{},300,6,0,1.95,330,30,1);windLimb(r,T,{},300,0,6,1.55,250,22,1);
  return{segs,blobs};
}
function windGrassSprite(r,sc){ // a clump of tall grass, combed flat by the wind, with seed heads
  const W=150,H=96,c=mk(W*sc,H*sc),x=c.getContext("2d");x.setTransform(sc,0,0,sc,0,0);x.strokeStyle=INK;x.fillStyle=INK;x.lineCap="round";
  const n=34+Math.floor(r()*10);
  for(let i=0;i<n;i++){const bx=36+(r()-0.5)*44,by=H,len=34+r()*52,bend=0.45+r()*0.5,ex=bx+len*bend*(0.8+r()*0.4),ey=by-len*(1-bend*0.55),cx=bx+len*0.12,cy=by-len*0.7;
    x.lineWidth=0.9+r()*1.5;x.beginPath();x.moveTo(bx,by);x.quadraticCurveTo(cx,cy,ex,ey);x.stroke();
    if(r()<0.3){x.beginPath();x.ellipse(ex+2,ey+0.5,3.2,1.2,0.35,0,Math.PI*2);x.fill();}}
  x.beginPath();x.ellipse(36,H,24,6,0,Math.PI,0);x.fill();
  return{c,ox:36,oy:H,w:W,h:H};
}
function fernSprite(r,sc){
  const W=120,H=64,c=mk(W*sc,H*sc),x=c.getContext("2d");x.setTransform(sc,0,0,sc,0,0);x.strokeStyle=INK;x.lineCap="round";
  for(let f=0;f<3;f++){const bx=20+f*38+r()*10,by=H;
    for(let j=0;j<3;j++){const a=-1.0+j*0.9+(r()-0.5)*0.3,L=30+r()*24,ex=bx+Math.sin(a)*L,ey=by-Math.cos(a)*L*0.85,cx=bx+Math.sin(a)*L*0.35,cy=by-L*0.95;
      x.lineWidth=2;x.beginPath();x.moveTo(bx,by);x.quadraticCurveTo(cx,cy,ex,ey);x.stroke();
      for(let q=1;q<8;q++){const u=q/8,v=1-u,px=v*v*bx+2*v*u*cx+u*u*ex,py=v*v*by+2*v*u*cy+u*u*ey,lw=(1-u)*7+1.5;x.lineWidth=1.3;x.beginPath();x.moveTo(px-lw,py+lw*0.6);x.lineTo(px,py);x.lineTo(px+lw,py+lw*0.6);x.stroke();}}}
  return{c,ox:0,oy:H,w:W,h:H};
}
/* ============================== round 3's houses (one pattern, varied), kept for the comparison ============================== */
function winShape(kind,cx,cy,ww,wh,sk,r){
  const L=cx-ww/2,R=cx+ww/2,T=cy-wh/2,Bt=cy+wh/2;
  if(kind==="round"){const out=[];for(let i=0;i<14;i++){const a=i/14*Math.PI*2;out.push([cx+Math.cos(a)*ww*0.55,cy+Math.sin(a)*ww*0.55]);}return out;}
  if(kind==="crooked"){const j=()=>(r()-0.5)*ww*0.22;return[[L+j(),Bt+j()*0.5],[L+sk+j(),T+j()],[R+sk+j(),T+j()],[R+j(),Bt+j()*0.5]];}
  if(kind==="lancet"){const sp=T+ww*0.75;return[[L,Bt],[L+sk*0.6,sp]].concat(qpts([L+sk*0.6,sp],[L+sk*0.8,T+ww*0.15],[cx+sk,T],5).slice(1),qpts([cx+sk,T],[R+sk*0.8,T+ww*0.15],[R+sk*0.6,sp],5).slice(1),[[R,Bt]]);}
  const out=[[L,Bt],[L+sk*0.7,T+ww/2]];for(let i=1;i<10;i++){const a=Math.PI+i/10*Math.PI;out.push([cx+sk+Math.cos(a)*ww/2,T+ww/2+Math.sin(a)*ww/2]);}out.push([R+sk*0.7,T+ww/2],[R,Bt]);return out;
}
function crowShape(cx,cy,f){
  const p=[[-6,0],[-2,-2.5],[3,-2.5],[5,-4.5],[7.5,-3.8],[6,-2],[4,0.5],[-1,1.5],[-6.5,2.5],[-9.5,3.6],[-7,1]];
  return p.map(q=>[cx+q[0]*f,cy+q[1]]);
}
function houseV3(r,o,sc){
  const ops=[],B={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9},det=o.detail===undefined?1:o.detail,holes=[];
  const P=p=>{if(p[0]<B.x0)B.x0=p[0];if(p[0]>B.x1)B.x1=p[0];if(p[1]<B.y0)B.y0=p[1];if(p[1]>B.y1)B.y1=p[1];};
  const path=(c,pts)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();};
  const fill=pts=>{pts.forEach(P);ops.push(c=>{path(c,pts);c.fill();});};
  const cut=pts=>ops.push(c=>{c.save();c.globalCompositeOperation="destination-out";path(c,pts);c.fill();c.restore();});
  const line=(pts,lw)=>{pts.forEach(P);ops.push(c=>{c.lineWidth=lw;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();});};
  const w=o.w,h=o.h,storeys=o.storeys||(h>85?2:1),sh=h/storeys,lean=(r()<0.5?-1:1)*(0.035+r()*0.07);
  /* storeys, each jutting out over the one below, leaning, the sides bulging */
  let xl=0,xr=w,y=0;const walls=[];
  for(let i=0;i<storeys;i++){
    const jet=i?w*(0.03+r()*0.035):0,bl=xl-jet,br=xr+jet,top=y-sh,shift=lean*sh;
    const tl=bl+shift+w*(r()-0.5)*0.03,tr=br+shift+w*(r()-0.5)*0.03,bul=w*(0.015+r()*0.03);
    fill(qpts([bl,y],[Math.min(bl,tl)-bul,(y+top)/2],[tl,top],6).concat(qpts([tr,top],[Math.max(br,tr)+bul,(y+top)/2],[br,y],6)));
    if(i)fill([[bl-2,y+2.5],[br+2,y+2.5],[br+2,y-1],[bl-2,y-1]]);
    walls.push({bl,br,tl,tr,y0:y,y1:top});xl=tl;xr=tr;y=top;
  }
  /* a lower wing with a railed rooftop walk (the path house: the mouth-hat perches there) */
  let perch=null,anchor=null,wingWall=null;
  if(o.wing){
    const wb=walls[0],wx0=wb.br-2,ww2=w*0.46,wh2=sh*(0.95+r()*0.1),wt=-wh2,ls=lean*wh2*0.3;
    fill([[wx0,2],[wx0+ls,wt],[wx0+ww2+ls,wt],[wx0+ww2,2]]);
    const rx0=wx0+ls+2,rx1=wx0+ww2+ls-2;
    line([[rx0,wt-9],[rx1,wt-9]],1.4);
    for(let px=rx0;px<=rx1+0.1;px+=6.5){line([[px,wt],[px,wt-12]],1.3);fill([[px-1.6,wt-11],[px,wt-15.5],[px+1.6,wt-11]]);}
    perch={x:(rx0+rx1)/2,y:wt};anchor=[rx1,wt-12];wingWall={bl:wx0,br:wx0+ww2,tl:wx0+ls,tr:wx0+ww2+ls,y0:0,y1:wt};
  }
  /* a steep sagging roof with flicked-up eaves */
  const ov=w*0.07,eL=[xl-ov,y+1],eR=[xr+ov,y+1],pkx=lerp(xl,xr,0.36+r()*0.28)+lean*w*0.4,rh=(xr-xl)*(w>120?0.6+r()*0.3:0.8+r()*0.45),pk=[pkx,y-rh],sag=rh*(0.08+r()*0.08);
  const sL=qpts(eL,[lerp(eL[0],pk[0],0.55),lerp(eL[1],pk[1],0.45)+sag],pk,8),sR=qpts(pk,[lerp(pk[0],eR[0],0.45),lerp(pk[1],eR[1],0.55)+sag],eR,8);
  fill([[eL[0]-3,eL[1]-4]].concat(sL,sR.slice(1),[[eR[0]+3,eR[1]-4],[eR[0]-1,eR[1]+2],[eL[0]+1,eL[1]+2]]));
  if(!anchor)anchor=[eR[0],eR[1]];
  /* a smaller cross-gable breaking up the roof */
  let gable=null;
  if(det>=2||(det>=1&&w>80&&r()<0.5)){
    const gw=(xr-xl)*(0.38+r()*0.12),onR=pkx<(xl+xr)/2,gx0=onR?xr-gw*0.85:xl-gw*0.15,gx1=gx0+gw,gh=gw*(0.9+r()*0.3),gpk=[lerp(gx0,gx1,0.5)+lean*gw*0.3,y-gh],gs=gh*0.1;
    fill([[gx0-4,y-2]].concat(qpts([gx0-2,y+1],[lerp(gx0,gpk[0],0.55),lerp(y,gpk[1],0.45)+gs],gpk,6),qpts(gpk,[lerp(gpk[0],gx1,0.45),lerp(gpk[1],y,0.55)+gs],[gx1+2,y+1],6).slice(1),[[gx1+4,y-2],[gx1,y+3],[gx0,y+3]]));
    line([gpk,[gpk[0],gpk[1]-10]],1.6);fill([[gpk[0]-2,gpk[1]-8],[gpk[0],gpk[1]-14],[gpk[0]+2,gpk[1]-8]]);
    gable={cx:gpk[0],cy:y-gh*0.42,ww:gw*0.26};
  }
  /* an oriel: an overhanging bay turret on the upper storey, on a corbel */
  let oriel=null;
  if(walls.length>1&&(det>=2||(det>=1&&r()<0.4))){
    const wl=walls[walls.length-1],onLeft=!(o.towerSide<0),ow=w*0.17,oh=sh*0.72,oy=lerp(wl.y0,wl.y1,0.15),ox=onLeft?lerp(wl.bl,wl.tl,0.2)-ow*0.55:lerp(wl.br,wl.tr,0.2)-ow*0.45;
    fill([[ox,oy],[ox+ow*0.5,oy+ow*0.7],[ox+ow,oy]]);
    fill([[ox,oy],[ox,oy-oh],[ox+ow,oy-oh],[ox+ow,oy]]);
    fill([[ox-3,oy-oh]].concat(qpts([ox-3,oy-oh],[ox+ow*0.32,oy-oh-ow*0.6],[ox+ow*0.5+lean*20,oy-oh-ow*1.3],5),qpts([ox+ow*0.5+lean*20,oy-oh-ow*1.3],[ox+ow*0.7,oy-oh-ow*0.55],[ox+ow+3,oy-oh],5).slice(1)));
    oriel={cx:ox+ow/2,cy:oy-oh*0.5,ww:ow*0.48,wh:oh*0.62};
  }
  /* a dormer */
  let dormer=null;
  if(det>=1&&r()<0.55){const side=r()<0.5?sL:sR,b=side[4],dw=w*0.15,dh=dw*0.85,dx=b[0]-dw/2,dy=b[1]+dh*0.35;
    fill([[dx,dy],[dx,dy-dh],[dx+dw/2,dy-dh-dw*0.7],[dx+dw,dy-dh],[dx+dw,dy]]);dormer={cx:dx+dw/2,cy:dy-dh*0.45,ww:dw*0.48,wh:dh*0.75};}
  /* crooked chimneys */
  const nc=o.chapel?0:(r()<0.75?1:0)+(det>=1&&r()<0.35?1:0);
  for(let i=0;i<nc;i++){const side=i?sL:sR,b=side[5+Math.floor(r()*2)],ch=Math.min(rh*(0.18+r()*0.14),12+w*0.12),cl=(r()-0.5)*7,cw2=Math.max(7,w*0.06)+r()*3;
    fill([[b[0]-cw2/2,b[1]+6],[b[0]-cw2/2+cl,b[1]-ch],[b[0]+cw2/2+cl,b[1]-ch],[b[0]+cw2/2,b[1]+6]]);
    fill([[b[0]-cw2/2-2+cl,b[1]-ch],[b[0]-cw2/2-2+cl,b[1]-ch-3],[b[0]+cw2/2+2+cl,b[1]-ch-3],[b[0]+cw2/2+2+cl,b[1]-ch]]);}
  /* a finial on the peak */
  if(r()<0.5)line(qpts(pk,[pk[0]+6,pk[1]-12],[pk[0]+12,pk[1]-8],6),2);
  else{line([pk,[pk[0],pk[1]-13]],1.8);fill([[pk[0]-2.5,pk[1]-10],[pk[0],pk[1]-17],[pk[0]+2.5,pk[1]-10]]);}
  /* a leaning tower: top-heavy turret, bent spire, a crow on the tip */
  let tRange=null,tWin=[];
  const hasT=o.chapel||(o.tower!==undefined?o.tower:r()<0.55);
  if(hasT){
    const tw=w*(o.chapel?0.3:0.21+r()*0.08),left=o.towerSide!==undefined?o.towerSide<0:r()<0.5,tx=left?-tw*0.45:w-tw*0.55,th=h*(o.chapel?2.2:1.45+r()*0.55),tl=(r()-0.5)*tw*0.8;
    const c0=-th*0.8,cw2=tw*0.2;
    fill([[tx,2],[tx+tw,2],[tx+tw+tl,c0],[tx+tl,c0]]);
    fill([[tx+tl,c0],[tx+tl-cw2,c0-tw*0.3],[tx+tl-cw2,-th],[tx+tw+tl+cw2,-th],[tx+tw+tl+cw2,c0-tw*0.3],[tx+tw+tl,c0]]);
    const sb=tw*1.6,sx0=tx+tl+tw/2-sb/2,sx1=sx0+sb,sp=th*(0.5+r()*0.35),bend=(r()<0.5?-1:1)*tw*(0.35+r()*0.6),tip=[tx+tl+tw/2+bend,-th-sp];
    fill([[sx0-2,-th+2]].concat(qpts([sx0,-th],[sx0+sb*0.3,-th-sp*0.55],tip,8),qpts(tip,[sx1-sb*0.25,-th-sp*0.5],[sx1,-th],8).slice(1),[[sx1+2,-th+2]]));
    if(det>=1&&r()<0.65){line([tip,[tip[0],tip[1]-9]],1.2);fill(crowShape(tip[0],tip[1]-11,r()<0.5?1:-1));}
    else line([tip,[tip[0]+bend*0.15,tip[1]-8]],1.6);
    tRange=[Math.min(tx,tx+tl)-cw2-4,Math.max(tx+tw,tx+tw+tl)+cw2+4];
    const lw2=tw*0.36,lh=lw2*2.3,ly=-th*0.48,lx=lerp(tx,tx+tl,0.6)+tw/2;
    tWin.push(["lancet",lx,ly,lw2,lh,tl*0.15]);
    tWin.push(["round",tx+tl+tw/2,(c0-tw*0.3-th)/2,tw*(o.chapel?0.6:0.45),0,0]);
  }
  /* timber props holding up a leaning wall */
  if(det>=1&&r()<0.5){const wb=walls[0],onLeft=lean>0;
    if(onLeft)line([[wb.bl-w*0.22,2],[lerp(wb.bl,wb.tl,0.65)+1,-sh*0.65]],3.4);
    else line([[wb.br+w*0.22,2],[lerp(wb.br,wb.tr,0.65)-1,-sh*0.65]],3.4);}
  /* a hanging sign */
  if(o.sign){const wb=walls[walls.length>1?1:0],sx=wb.bl-1,sy=lerp(wb.y0,wb.y1,0.3);
    line([[sx,sy],[sx-18,sy]],2.2);line([[sx-15,sy],[sx-15,sy+5]],1);line([[sx-4,sy],[sx-4,sy+5]],1);
    fill([[sx-18,sy+5],[sx-2,sy+4],[sx-2.5,sy+14],[sx-17,sy+15]]);}
  /* windows: scattered, mixed shapes, some boarded up or smashed */
  const doorFx=o.door?0.42+(r()-0.5)*0.12:null;let door=null,lampAt=null;
  const winOn=(wl,n,fx0)=>{
    const ww=clamp(w*(0.075+r()*0.035),4,15);
    for(let k=0;k<n;k++){
      const fx=fx0!==undefined?fx0:(k+0.5)/n+(r()-0.5)*0.2/n;
      if(doorFx!==null&&wl===walls[0]&&Math.abs(fx-doorFx)<0.18)continue;
      const wh=ww*(1.35+r()*0.8),cy=lerp(wl.y0,wl.y1,0.52+(r()-0.5)*0.14),t=(cy-wl.y0)/(wl.y1-wl.y0),cx=lerp(lerp(wl.bl,wl.tl,t),lerp(wl.br,wl.tr,t),fx),sk=lean*wh;
      if(tRange&&cx>tRange[0]-ww&&cx<tRange[1]+ww)continue;
      if(oriel&&wl===walls[walls.length-1]&&Math.abs(cx-oriel.cx)<w*0.17)continue;
      const kr=r(),kind=kr<0.45?"lancet":kr<0.7?"arch":kr<0.88?"crooked":"round",pts=winShape(kind,cx,cy,ww,wh,sk,r),tp=r();
      if(tp<0.2&&det>=1){cut(pts);const L=cx-ww/2-1,R=cx+ww/2+1;line([[L,cy-wh*0.18],[R+sk*0.3,cy-wh*0.26]],ww*0.28);line([[L+sk*0.2,cy+wh*0.2],[R,cy+wh*0.12]],ww*0.28);if(r()<0.5)line([[L,cy+wh*0.4],[R+sk*0.5,cy-wh*0.42]],ww*0.24);}
      else if(tp<0.3&&det>=1){const j=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2,rr=(i%2?0.28:0.5)*ww*(0.8+r()*0.4);j.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*1.3]);}cut(j);}
      else{cut(pts);holes.push({pts,kind,cx,cy,ww,wh,sk});}
    }
  };
  if(o.door){const wb=walls[0],dw=clamp(w*0.13,6,22),dh=Math.min(sh*0.62,dw*2.1),dcx=lerp(wb.bl,wb.br,doorFx)+lean*dh*0.4;
    const pts=winShape("lancet",dcx,-dh/2,dw,dh,lean*dh*0.5,r);cut(pts);door={pts,kind:"door",cx:dcx,cy:-dh/2,ww:dw,wh:dh,sk:0};lampAt=[dcx+dw*0.85,-dh*0.95];}
  for(const wl of walls){const swd=wl.br-wl.bl;winOn(wl,1+Math.floor(r()*(swd>110?3:swd>60?2:1)));}
  if(wingWall)winOn(wingWall,1,0.5);
  if(dormer){const pts=winShape("lancet",dormer.cx,dormer.cy,dormer.ww,dormer.wh,0,r);cut(pts);holes.push({pts,kind:"lancet",cx:dormer.cx,cy:dormer.cy,ww:dormer.ww,wh:dormer.wh,sk:0});}
  if(gable){const pts=winShape("round",gable.cx,gable.cy,gable.ww,gable.ww,0,r);cut(pts);holes.push({pts,kind:"round",cx:gable.cx,cy:gable.cy,ww:gable.ww,wh:gable.ww,sk:0});}
  if(oriel){const pts=winShape("lancet",oriel.cx,oriel.cy,oriel.ww,oriel.wh,0,r);cut(pts);holes.push({pts,kind:"lancet",cx:oriel.cx,cy:oriel.cy,ww:oriel.ww,wh:oriel.wh,sk:0});}
  for(const tw2 of tWin){const pts=winShape(tw2[0],tw2[1],tw2[2],tw2[3],tw2[4]||tw2[3],tw2[5],r);cut(pts);holes.push({pts,kind:tw2[0],cx:tw2[1],cy:tw2[2],ww:tw2[3],wh:tw2[4]||tw2[3],sk:tw2[5]});}
  if(door)holes.push(door);
  /* gaps where roof tiles are missing */
  if(det>=1){const nh=1+Math.floor(r()*2);for(let i=0;i<nh;i++){const side=r()<0.5?sL:sR,b=side[2+Math.floor(r()*5)],cx=lerp(b[0],(eL[0]+eR[0])/2,0.22),cy=b[1]+rh*0.12,s2=2.5+r()*3;
    cut([[cx-s2,cy],[cx-s2*0.3,cy-s2*0.8],[cx+s2,cy-s2*0.3],[cx+s2*0.4,cy+s2*0.7]]);}}
  /* assemble */
  const m=4,x0=B.x0-m,y0=B.y0-m,x1=B.x1+m,y1=Math.max(B.y1,4)+m,W=x1-x0,H=y1-y0,c=mk(W*sc,H*sc),x=c.getContext("2d");
  x.setTransform(sc,0,0,sc,-x0*sc,-y0*sc);x.fillStyle=INK;x.strokeStyle=INK;x.lineCap="round";x.lineJoin="round";
  for(const op of ops)op(x);
  return{v:3,c,ox:-x0,oy:-y0,w:W,h:H,holes,perch,anchor,lampAt};
}
/* ============================== round 4's buildings: nine kinds ============================== */
function pathPts(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();}
class Bld{ // records a building's parts; windows, doors and gaps are cut after every solid part
  constructor(r,o){this.r=r;this.o=o||{};this.det=this.o.detail===undefined?1:this.o.detail;this.ops=[];this.wq=[];this.holes=[];this.blocks=[];this.B={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};this.perch=null;this.anchor=null;this.lampAt=null;this.lit=1;}
  P(p){const B=this.B;if(p[0]<B.x0)B.x0=p[0];if(p[0]>B.x1)B.x1=p[0];if(p[1]<B.y0)B.y0=p[1];if(p[1]>B.y1)B.y1=p[1];}
  fill(pts){pts.forEach(p=>this.P(p));this.ops.push(c=>{pathPts(c,pts);c.fill();});}
  line(pts,lw){pts.forEach(p=>this.P(p));this.ops.push(c=>{c.lineWidth=lw;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();});}
  cutNow(pts){this.ops.push(c=>{c.save();c.globalCompositeOperation="destination-out";pathPts(c,pts);c.fill();c.restore();});}
  cut(pts){this.wq.push(()=>this.cutNow(pts));}
  block(x0,x1,y0,y1){this.blocks.push([x0,x1,y0,y1]);}
  win(kind,cx,cy,ww,wh,sk,mode,force){
    this.wq.push(()=>{
      const r=this.r;if(!force&&this.blocks.some(b=>cx>b[0]&&cx<b[1]&&cy>b[2]&&cy<b[3]))return;
      const pts=winShape(kind,cx,cy,ww,wh||ww,sk,r);let m=mode;
      if(!m){const t=r();m=this.det<1?"glass":t<0.2?"boarded":t<0.3?"broken":"glass";}
      if(m==="glass"||m==="beacon"){this.cutNow(pts);this.holes.push({pts,kind,cx,cy,ww,wh:wh||ww,sk,always:m==="beacon"});}
      else if(m==="empty")this.cutNow(pts);
      else if(m==="boarded"){this.cutNow(pts);const L=cx-ww/2-1,R=cx+ww/2+1;this.line([[L,cy-wh*0.18],[R+sk*0.3,cy-wh*0.26]],ww*0.28);this.line([[L+sk*0.2,cy+wh*0.2],[R,cy+wh*0.12]],ww*0.28);if(r()<0.5)this.line([[L,cy+wh*0.4],[R+sk*0.5,cy-wh*0.42]],ww*0.24);}
      else{const j=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2,rr=(i%2?0.28:0.5)*ww*(0.8+r()*0.4);j.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*1.3]);}this.cutNow(j);}
    });
  }
  door(cx,dw,dh,sk,kind,base){base=base||0;this.wq.push(()=>{const pts=winShape(kind||"lancet",cx,base-dh/2,dw,dh,sk,this.r);this.cutNow(pts);this.holes.push({pts,kind:"door",cx,cy:base-dh/2,base,ww:dw,wh:dh,sk:0});});
    this.lampAt=[cx+dw*0.85,base-dh*0.95];this.block(cx-dw,cx+dw,base-dh-8,8);}
  done(sc){
    for(const q of this.wq)q();
    const B=this.B,m=4,x0=B.x0-m,y0=B.y0-m,x1=B.x1+m,y1=Math.max(B.y1,4)+m,W=x1-x0,H=y1-y0,c=mk(W*sc,H*sc),x=c.getContext("2d");
    x.setTransform(sc,0,0,sc,-x0*sc,-y0*sc);x.fillStyle=INK;x.strokeStyle=INK;x.lineCap="round";x.lineJoin="round";
    for(const op of this.ops)op(x);
    return{v:4,c,ox:-x0,oy:-y0,w:W,h:H,holes:this.holes,perch:this.perch,anchor:this.anchor,lampAt:this.lampAt,lit:this.lit};
  }
}
/* shared parts */
function bStoreys(b,x0,w,h,n,lean,jm){
  const r=b.r,sh=h/n;let xl=x0,xr=x0+w,y=0;const walls=[];
  for(let i=0;i<n;i++){
    const jet=i?w*(0.025+r()*(jm||0.035)):0,bl=xl-jet,br=xr+jet,top=y-sh,shift=lean*sh;
    const tl=bl+shift+w*(r()-0.5)*0.03,tr=br+shift+w*(r()-0.5)*0.03,bul=w*(0.015+r()*0.03);
    b.fill(qpts([bl,y],[Math.min(bl,tl)-bul,(y+top)/2],[tl,top],6).concat(qpts([tr,top],[Math.max(br,tr)+bul,(y+top)/2],[br,y],6)));
    if(i)b.fill([[bl-2,y+2.5],[br+2,y+2.5],[br+2,y-1],[bl-2,y-1]]);
    walls.push({bl,br,tl,tr,y0:y,y1:top});xl=tl;xr=tr;y=top;
  }
  return{walls,xl,xr,y,sh};
}
function bRoof(b,xl,xr,y,rh,lean,opt){
  opt=opt||{};const r=b.r,w=xr-xl,ov=opt.ov!==undefined?opt.ov:w*0.07,drop=opt.drop||0;
  const eL=[xl-ov,y+1+drop],eR=[xr+ov,y+1+drop],pk=[lerp(xl,xr,0.36+r()*0.28)+lean*w*0.4,y-rh],sag=rh*(opt.sag||(0.08+r()*0.08));
  const sL=qpts(eL,[lerp(eL[0],pk[0],0.55),lerp(eL[1],pk[1],0.45)+sag],pk,8),sR=qpts(pk,[lerp(pk[0],eR[0],0.45),lerp(pk[1],eR[1],0.55)+sag],eR,8);
  let bottom;
  if(opt.thatch){bottom=[];const n=Math.max(6,Math.round((eR[0]-eL[0])/7));for(let i=n;i>=0;i--)bottom.push([lerp(eL[0],eR[0],i/n),lerp(eL[1],eR[1],i/n)+(i%2?3+r()*4:0)]);}
  else bottom=[[eR[0]+3,eR[1]-4],[eR[0]-1,eR[1]+2],[eL[0]+1,eL[1]+2],[eL[0]-3,eL[1]-4]];
  b.fill(sL.concat(sR.slice(1),bottom));
  return{sL,sR,pk,eL,eR,rh};
}
function bFinial(b,pk){
  if(b.r()<0.5)b.line(qpts(pk,[pk[0]+6,pk[1]-12],[pk[0]+12,pk[1]-8],6),2);
  else{b.line([pk,[pk[0],pk[1]-13]],1.8);b.fill([[pk[0]-2.5,pk[1]-10],[pk[0],pk[1]-17],[pk[0]+2.5,pk[1]-10]]);}
}
function bChimneys(b,rf,n,w){
  const r=b.r;
  for(let i=0;i<n;i++){const side=i%2?rf.sL:rf.sR,pt=side[i<2?5+Math.floor(r()*2):2+Math.floor(r()*2)],ch=Math.min(rf.rh*(0.18+r()*0.14),12+w*0.12),cl=(r()-0.5)*7,cw=Math.max(7,w*0.06)+r()*3;
    b.fill([[pt[0]-cw/2,pt[1]+6],[pt[0]-cw/2+cl,pt[1]-ch],[pt[0]+cw/2+cl,pt[1]-ch],[pt[0]+cw/2,pt[1]+6]]);
    b.fill([[pt[0]-cw/2-2+cl,pt[1]-ch],[pt[0]-cw/2-2+cl,pt[1]-ch-3],[pt[0]+cw/2+2+cl,pt[1]-ch-3],[pt[0]+cw/2+2+cl,pt[1]-ch]]);}
}
function bSpire(b,cx,by,sb,sp,bend){
  const sx0=cx-sb/2,sx1=cx+sb/2,tip=[cx+bend,by-sp];
  b.fill([[sx0-2,by+2]].concat(qpts([sx0,by],[sx0+sb*0.3,by-sp*0.55],tip,8),qpts(tip,[sx1-sb*0.25,by-sp*0.5],[sx1,by],8).slice(1),[[sx1+2,by+2]]));
  return tip;
}
function bTip(b,tip,lean){
  if(b.det>=1&&b.r()<0.6){b.line([tip,[tip[0],tip[1]-9]],1.2);b.fill(crowShape(tip[0],tip[1]-11,b.r()<0.5?1:-1));}
  else b.line([tip,[tip[0]+lean,tip[1]-8]],1.6);
}
function bTower(b,tx,tw,th,tl,opt){
  opt=opt||{};const r=b.r,c0=-th*0.8,cw=tw*0.2;
  b.fill([[tx,2],[tx+tw,2],[tx+tw+tl,c0],[tx+tl,c0]]);
  b.block(Math.min(tx,tx+tl)-cw-4,Math.max(tx+tw,tx+tw+tl)+cw+4,-1e9,1e9);
  if(opt.broken){ // a shattered top, no spire
    const top=[];for(let i=0;i<=6;i++)top.push([lerp(tx+tl,tx+tw+tl,i/6),c0-(i%2?tw*0.1:tw*(0.25+r()*0.4))]);
    b.fill([[tx+tl,c0+2]].concat(top,[[tx+tw+tl,c0+2]]));
    b.win("lancet",tx+tl+tw/2,c0+tw*0.5,tw*0.34,tw*0.9,0,"empty",true);
    return[tx+tl+tw/2,c0-tw*0.1];
  }
  b.fill([[tx+tl,c0],[tx+tl-cw,c0-tw*0.3],[tx+tl-cw,-th],[tx+tw+tl+cw,-th],[tx+tw+tl+cw,c0-tw*0.3],[tx+tw+tl,c0]]);
  const bend=(r()<0.5?-1:1)*tw*(0.35+r()*0.6),tip=bSpire(b,tx+tl+tw/2,-th,tw*1.6,th*(0.5+r()*0.35),bend);
  bTip(b,tip,bend*0.15);
  b.win("lancet",lerp(tx,tx+tl,0.6)+tw/2,-th*0.48,tw*0.36,tw*0.36*2.3,tl*0.15,undefined,true);
  b.win("round",tx+tl+tw/2,(c0-tw*0.3-th)/2,tw*(opt.rose?0.6:0.45),0,0,undefined,true);
  return tip;
}
function bWing(b,wx0,ww2,wh2,lean){ // a lower wing with a railed rooftop walk: the mouth-hat's perch
  const ls=lean*wh2*0.3,wt=-wh2;
  b.fill([[wx0,2],[wx0+ls,wt],[wx0+ww2+ls,wt],[wx0+ww2,2]]);
  const rx0=wx0+ls+2,rx1=wx0+ww2+ls-2;
  b.line([[rx0,wt-9],[rx1,wt-9]],1.4);
  for(let px=rx0;px<=rx1+0.1;px+=6.5){b.line([[px,wt],[px,wt-12]],1.3);b.fill([[px-1.6,wt-11],[px,wt-15.5],[px+1.6,wt-11]]);}
  b.perch={x:(rx0+rx1)/2,y:wt};b.anchor=[rx1,wt-12];
  const ww=Math.min(13,ww2*0.18);b.win("arch",wx0+ww2*0.5+ls*0.5,wt*0.5,ww,ww*1.7,0,"glass",true);
}
function bCrossGable(b,S,rf,lean){
  const xl=S.xl,xr=S.xr,y=S.y,gw=(xr-xl)*(0.38+b.r()*0.12),onR=rf.pk[0]<(xl+xr)/2,gx0=onR?xr-gw*0.85:xl-gw*0.15,gx1=gx0+gw,gh=gw*(0.9+b.r()*0.3),gpk=[lerp(gx0,gx1,0.5)+lean*gw*0.3,y-gh],gs=gh*0.1;
  b.fill([[gx0-4,y-2]].concat(qpts([gx0-2,y+1],[lerp(gx0,gpk[0],0.55),lerp(y,gpk[1],0.45)+gs],gpk,6),qpts(gpk,[lerp(gpk[0],gx1,0.45),lerp(gpk[1],y,0.55)+gs],[gx1+2,y+1],6).slice(1),[[gx1+4,y-2],[gx1,y+3],[gx0,y+3]]));
  b.line([gpk,[gpk[0],gpk[1]-10]],1.6);b.fill([[gpk[0]-2,gpk[1]-8],[gpk[0],gpk[1]-14],[gpk[0]+2,gpk[1]-8]]);
  b.win("round",gpk[0],y-gh*0.42,gw*0.26,0,0,undefined,true);
}
function bOriel(b,S,lean,onLeft,w){
  const wl=S.walls[S.walls.length-1],ow=w*0.17,oh=S.sh*0.72,oy=lerp(wl.y0,wl.y1,0.15),ox=onLeft?lerp(wl.bl,wl.tl,0.2)-ow*0.55:lerp(wl.br,wl.tr,0.2)-ow*0.45;
  b.fill([[ox,oy],[ox+ow*0.5,oy+ow*0.7],[ox+ow,oy]]);b.fill([[ox,oy],[ox,oy-oh],[ox+ow,oy-oh],[ox+ow,oy]]);
  b.fill([[ox-3,oy-oh]].concat(qpts([ox-3,oy-oh],[ox+ow*0.32,oy-oh-ow*0.6],[ox+ow*0.5+lean*20,oy-oh-ow*1.3],5),qpts([ox+ow*0.5+lean*20,oy-oh-ow*1.3],[ox+ow*0.7,oy-oh-ow*0.55],[ox+ow+3,oy-oh],5).slice(1)));
  b.block(ox-6,ox+ow+6,oy-oh,oy+2);
  b.win("lancet",ox+ow/2,oy-oh*0.5,ow*0.48,oh*0.62,0,undefined,true);
}
function bDormer(b,rf,w){
  const side=b.r()<0.5?rf.sL:rf.sR,pt=side[4],dw=w*0.15,dh=dw*0.85,dx=pt[0]-dw/2,dy=pt[1]+dh*0.35;
  b.fill([[dx,dy],[dx,dy-dh],[dx+dw/2,dy-dh-dw*0.7],[dx+dw,dy-dh],[dx+dw,dy]]);
  b.win("lancet",dx+dw/2,dy-dh*0.45,dw*0.48,dh*0.75,0,undefined,true);
}
function bProp(b,S,lean,w){
  const wb=S.walls[0];
  if(lean>0)b.line([[wb.bl-w*0.22,2],[lerp(wb.bl,wb.tl,0.65)+1,-S.sh*0.65]],3.4);
  else b.line([[wb.br+w*0.22,2],[lerp(wb.br,wb.tr,0.65)-1,-S.sh*0.65]],3.4);
}
function bTiles(b,rf){ // gaps where tiles are missing
  if(b.det<1)return;const r=b.r,nh=1+Math.floor(r()*2);
  for(let i=0;i<nh;i++){const side=r()<0.5?rf.sL:rf.sR,pt=side[2+Math.floor(r()*5)],cx=lerp(pt[0],(rf.eL[0]+rf.eR[0])/2,0.22),cy=pt[1]+rf.rh*0.12,s2=2.5+r()*3;
    b.cut([[cx-s2,cy],[cx-s2*0.3,cy-s2*0.8],[cx+s2,cy-s2*0.3],[cx+s2*0.4,cy+s2*0.7]]);}
}
function bDoorOn(b,wl,fx,w,sh,lean){
  const dw=clamp(w*0.13,b.det>=2?15:6,22),dh=Math.min(sh*0.66,dw*2.1),cx=lerp(wl.bl,wl.br,fx)+lean*dh*0.4;b.door(cx,dw,dh,lean*dh*0.5);
}
function wallWins(b,wl,n,opt){
  opt=opt||{};const r=b.r,w=wl.br-wl.bl,ww=clamp(opt.ww||Math.max(5,(b.o.w||w)*(0.075+r()*0.035)),4,15);
  for(let k=0;k<n;k++){
    const fx=(k+0.5)/n+(r()-0.5)*0.2/n,wh=ww*(1.35+r()*0.8),cy=lerp(wl.y0,wl.y1,0.52+(r()-0.5)*0.14),t=(cy-wl.y0)/(wl.y1-wl.y0),cx=lerp(lerp(wl.bl,wl.tl,t),lerp(wl.br,wl.tr,t),fx);
    const kr=r(),kind=opt.kinds?opt.kinds[Math.floor(r()*opt.kinds.length)]:kr<0.45?"lancet":kr<0.7?"arch":kr<0.88?"crooked":"round";
    b.win(kind,cx,cy,ww,wh,(opt.lean||0)*wh,opt.mode);
  }
}
function bSign(b,sx,sy,big){
  const L=big?26:18,bw=big?24:15,bh=big?16:10;
  b.line([[sx,sy],[sx-L,sy]],big?2.6:2.2);b.line([[sx-L+3,sy],[sx-L+3,sy+5]],1);b.line([[sx-L+3+bw-4,sy],[sx-L+3+bw-4,sy+5]],1);
  b.fill([[sx-L,sy+5],[sx-L+bw+1,sy+4],[sx-L+bw+0.5,sy+5+bh],[sx-L+1,sy+6+bh]]);
  return[sx-L,sy+5,bw,bh];
}
/* the nine kinds */
function aManor(b){
  const o=b.o,r=b.r,w=o.w,h=o.h,lean=(r()<0.5?-1:1)*(0.035+r()*0.07),S=bStoreys(b,0,w,h,o.storeys||2,lean);
  if(o.wing)bWing(b,S.walls[0].br-2,Math.max(w*0.46,68),S.sh*(0.95+r()*0.1),lean);
  const rf=bRoof(b,S.xl,S.xr,S.y,(S.xr-S.xl)*(w>120?0.6+r()*0.3:0.8+r()*0.35),lean);
  if(!b.anchor)b.anchor=[rf.eR[0],rf.eR[1]];
  bCrossGable(b,S,rf,lean);
  if(S.walls.length>1)bOriel(b,S,lean,!(o.towerSide<0),w);
  if(r()<0.5)bDormer(b,rf,w);
  bChimneys(b,rf,1+(r()<0.5?1:0),w);bFinial(b,rf.pk);
  const tw=w*(0.21+r()*0.08),tx=(o.towerSide<0||(o.towerSide===undefined&&r()<0.5))?-tw*0.45:w-tw*0.55;bTower(b,tx,tw,h*(1.45+r()*0.55),(r()-0.5)*tw*0.8);
  if(b.det>=1&&r()<0.5)bProp(b,S,lean,w);
  if(o.sign){const wl=S.walls[S.walls.length-1];bSign(b,wl.bl-1,lerp(wl.y0,wl.y1,0.3));}
  if(o.door)bDoorOn(b,S.walls[0],0.42+(r()-0.5)*0.12,w,S.sh,lean);
  for(const wl of S.walls)wallWins(b,wl,1+Math.floor(r()*3),{lean});
  bTiles(b,rf);
}
function aTownhouse(b){ // tall and narrow, every storey jutting further out
  const o=b.o,r=b.r,w=o.w,h=o.h,n=o.storeys||(3+(r()<0.5?1:0)),lean=(r()<0.5?-1:1)*(0.06+r()*0.05),S=bStoreys(b,0,w,h,n,lean,0.06);
  if(o.wing)bWing(b,S.walls[0].br-2,Math.max(w*0.9,68),S.sh*(1.05+r()*0.1),lean);
  const rf=bRoof(b,S.xl,S.xr,S.y,(S.xr-S.xl)*(1.1+r()*0.4),lean,{ov:w*0.1});
  if(!b.anchor)b.anchor=[rf.eR[0],rf.eR[1]];
  if(r()<0.6)bDormer(b,rf,w);
  const cp=(r()<0.5?rf.sL:rf.sR)[5],cw=Math.max(10,w*0.22),ch=Math.min(rf.rh*0.3,20);
  b.fill([[cp[0]-cw/2,cp[1]+6],[cp[0]-cw/2+lean*10,cp[1]-ch],[cp[0]+cw/2+lean*10,cp[1]-ch],[cp[0]+cw/2,cp[1]+6]]);
  for(const k of [-0.25,0.2])b.fill([[cp[0]+cw*k-2+lean*10,cp[1]-ch],[cp[0]+cw*k-2.5+lean*12,cp[1]-ch-6],[cp[0]+cw*k+2.5+lean*12,cp[1]-ch-6],[cp[0]+cw*k+2+lean*10,cp[1]-ch]]);
  bFinial(b,rf.pk);
  if(n>=3&&r()<0.6){const wl=S.walls[1],by=wl.y0-1,bx0=wl.bl-6,bx1=wl.br+6;b.fill([[bx0,by],[bx1,by],[bx1-2,by+3],[bx0+2,by+3]]);b.line([[bx0,by-9],[bx1,by-9+lean*20]],1.2);for(let px=bx0;px<=bx1;px+=5)b.line([[px,by],[px+lean*4,by-9]],1);}
  if(o.door)bDoorOn(b,S.walls[0],0.5,w,S.sh,lean);
  for(const wl of S.walls)wallWins(b,wl,1+(w>60&&r()<0.4?1:0),{lean,kinds:["lancet","arch","crooked"]});
  bTiles(b,rf);
}
function aCottage(b){ // squat, under a huge sagging roof with ragged eaves
  const o=b.o,r=b.r,w=o.w,h=o.h,lean=(r()<0.5?-1:1)*(0.02+r()*0.04),S=bStoreys(b,0,w,h,1,lean);
  if(o.wing)bWing(b,S.walls[0].br-2,Math.max(w*0.5,68),h*1.05,lean);
  if(o.logs){ // a stacked log pile under a plank: the mouth-hat's perch at the woodcutter's hut
    const lx0=S.walls[0].br+2,lr=Math.max(6,w*0.055),cols=4;let topY=0;
    for(let row=0;row<3;row++)for(let c=0;c<cols-row;c++){const cx=lx0+lr+c*lr*2.05+row*lr,cy=-lr-row*lr*1.8;b.fill(circPts(cx,cy,lr,lr,12,0,Math.PI*2));b.cut(circPts(cx,cy,lr*0.14,lr*0.14,6,0,Math.PI*2));topY=cy-lr;}
    const pw=lr*2*cols+4;b.fill([[lx0-2,topY+1],[lx0+pw,topY+1],[lx0+pw,topY-3],[lx0-2,topY-3]]);
    b.perch={x:lx0+pw*0.45,y:topY-3};b.anchor=[lx0+pw,topY-3];
  }
  const rf=bRoof(b,S.xl,S.xr,S.y,w*(0.62+r()*0.25),lean,{ov:w*0.12,drop:h*0.42,thatch:true,sag:0.14});
  if(!b.anchor)b.anchor=[rf.eR[0],rf.eR[1]];
  const cp=rf.sR[4+Math.floor(r()*2)],cw=Math.max(8,w*0.09),ch=Math.min(rf.rh*0.28,18),cl=(r()-0.5)*8;
  b.fill([[cp[0]-cw/2,cp[1]+6],[cp[0]-cw/2+cl,cp[1]-ch],[cp[0]+cw/2+cl,cp[1]-ch],[cp[0]+cw/2,cp[1]+6]]);
  b.fill([[cp[0]-cw/2-2+cl,cp[1]-ch],[cp[0]-cw/2-2+cl,cp[1]-ch-3],[cp[0]+cw/2+2+cl,cp[1]-ch-3],[cp[0]+cw/2+2+cl,cp[1]-ch]]);
  const ep=rf.sL[5];b.win("round",lerp(ep[0],rf.pk[0],0.15)+6,ep[1]+rf.rh*0.2,Math.max(5,w*0.07),0,0,undefined,true);
  const dw=clamp(w*0.14,b.det>=2?15:6,18),dh=Math.min(h*0.72,dw*1.7);b.door(lerp(S.walls[0].bl,S.walls[0].br,0.3),dw,dh,0,"arch");
  const nw=1+(r()<0.5?1:0),ww=clamp(w*0.08,5,11);for(let i=0;i<nw;i++)b.win(r()<0.5?"crooked":"arch",lerp(S.walls[0].bl,S.walls[0].br,0.58+i*0.24),-h*0.3,ww,ww*1.15,0);
  bFinial(b,rf.pk);
}
function aRuin(b){ // a ruined chapel: half a roof, bare rafters, empty lancets, a shattered tower
  const o=b.o,r=b.r,w=o.w,h=o.h,lean=(r()<0.5?-1:1)*(0.01+r()*0.03),S=bStoreys(b,0,w,h,1,lean),wl=S.walls[0];
  for(let i=1;i<4;i++){const x=lerp(wl.bl,wl.br,i/4);b.fill([[x-3,2],[x-3,-h*0.8],[x+1,-h*0.85],[x+7,2]]);}
  const rh=w*(0.45+r()*0.15),eL=[S.xl-w*0.05,S.y+1],pk=[lerp(S.xl,S.xr,0.42),S.y-rh],brk=0.35+r()*0.25,bx=lerp(pk[0],S.xr,brk),byTop=lerp(pk[1],S.y,brk);
  const jag=[];for(let i=0;i<=5;i++)jag.push([bx-(i%2?4+r()*6:0)-i*2,lerp(byTop,S.y,i/5)]);
  b.fill(qpts(eL,[lerp(eL[0],pk[0],0.55),lerp(eL[1],pk[1],0.45)+rh*0.06],pk,7).concat([[bx,byTop]],jag,[[eL[0]+2,S.y+2]]));
  for(let i=0;i<4;i++){const t=(i+1)/5,x0=lerp(bx,S.xr,t*0.9),y0=lerp(byTop,S.y,t*0.9);b.line([[x0-6,y0+8],[x0,y0]],1.6);}
  b.fill([[S.xr-6,S.y+2],[S.xr,S.y+2],[S.xr-2,S.y-rh*0.35],[S.xr-7,S.y-rh*0.2]]);
  const tw=w*0.26,tx=r()<0.5?-tw*0.4:w-tw*0.6,top=bTower(b,tx,tw,h*(1.8+r()*0.4),(r()-0.5)*tw*0.4,{broken:true});
  if(r()<0.7)b.fill(crowShape(top[0],top[1]-4,1));
  for(let i=0;i<4;i++){const ww=Math.max(5,w*0.07);b.win("lancet",lerp(wl.bl,wl.br,(i+0.5)/4),-h*0.5,ww,ww*2.6,0,i===2?"broken":"empty");}
}
function aWindmill(b){ // a tapering mill with a sagging cap and broken sails
  const o=b.o,r=b.r,w=o.w,h=o.h,lean=(r()-0.5)*0.06,tw=w*0.55,ls=lean*h,cx=w/2+ls,top=-h;
  b.fill(qpts([0,2],[-w*0.04,-h*0.5],[(w-tw)/2+ls,top],5).concat(qpts([(w+tw)/2+ls,top],[w*1.04,-h*0.5],[w,2],5)));
  b.fill([[(w-tw)/2+ls-5,top+2]].concat(qpts([(w-tw)/2+ls-5,top],[cx-tw*0.3,top-tw*0.7],[cx+tw*0.08,top-tw*0.62],5).slice(1),qpts([cx+tw*0.08,top-tw*0.62],[cx+tw*0.45,top-tw*0.5],[(w+tw)/2+ls+5,top],5).slice(1),[[(w+tw)/2+ls+5,top+2]]));
  const hub=[cx+tw*0.12,top+tw*0.15],L=h*(0.7+r()*0.12),a0=0.25+r()*0.5,broke=Math.floor(r()*4);
  for(let k=0;k<4;k++){
    const a=a0+k*Math.PI/2,len=k===broke?L*(0.4+r()*0.15):L,ca=Math.cos(a),sa=Math.sin(a),px=-sa,py=ca,sw=L*0.19;
    const end=[hub[0]+ca*len,hub[1]+sa*len];b.line([hub,end],2.6);
    const p0=[hub[0]+ca*len*0.26,hub[1]+sa*len*0.26],p1=end,q0=[p0[0]+px*sw,p0[1]+py*sw],q1=[p1[0]+px*sw,p1[1]+py*sw];
    if(k===broke)b.line([p0,q0,[q0[0]+ca*len*0.4+px*4,q0[1]+sa*len*0.4+py*7]],1.2);
    else{b.line([q0,q1],1.3);b.line([p1,q1],1.3);b.line([p0,q0],1.3);for(let i=1;i<5;i++){const t=i/5;b.line([[lerp(p0[0],p1[0],t),lerp(p0[1],p1[1],t)],[lerp(q0[0],q1[0],t),lerp(q0[1],q1[1],t)]],1);}}
  }
  b.fill([[hub[0]-3.5,hub[1]-3.5],[hub[0]+3.5,hub[1]-3.5],[hub[0]+3.5,hub[1]+3.5],[hub[0]-3.5,hub[1]+3.5]]);
  const dw=clamp(w*0.2,7,16);b.door(w/2,dw,dw*1.8,0,"arch");
  const ww=Math.max(5,w*0.09);b.win("lancet",cx-ls*0.45,-h*0.56,ww,ww*2,lean*10);
  b.anchor=[w,-h*0.5];
}
function aWatchtower(b){ // tall and lean, an overhanging gallery, a beacon, arrow slits
  const o=b.o,r=b.r,w=o.w,h=o.h,lean=(r()<0.5?-1:1)*(0.02+r()*0.04),ls=lean*h;
  b.fill(qpts([0,2],[-w*0.06,-h*0.5],[w*0.1+ls,-h],5).concat(qpts([w*0.9+ls,-h],[w*1.06,-h*0.5],[w,2],5)));
  const gx0=w*0.1+ls-w*0.22,gx1=w*0.9+ls+w*0.22,gy=-h,gh=Math.max(10,w*0.35);
  for(let i=0;i<4;i++){const x=lerp(gx0+3,gx1-3,i/3);b.fill([[x-3,gy],[x+3,gy],[x,gy+7]]);}
  b.fill([[gx0,gy],[gx1,gy],[gx1,gy-gh],[gx0,gy-gh]]);
  if(r()<0.6){const tip=bSpire(b,(gx0+gx1)/2,gy-gh,gx1-gx0+8,w*(1.2+r()*0.5),(r()-0.5)*w*0.5);bTip(b,tip,0);}
  else{for(let x=gx0;x<gx1-3;x+=7){if(r()<0.25)continue;const mh=4+r()*7;b.fill([[x,gy-gh],[x+4.5,gy-gh],[x+4.5,gy-gh-mh],[x,gy-gh-mh]]);}
    const fx=(gx0+gx1)/2,fy=gy-gh;b.line([[fx,fy],[fx,fy-26]],1.4);b.fill([[fx,fy-26],[fx+16,fy-23],[fx+12,fy-21],[fx+17,fy-18],[fx,fy-17]]);}
  b.win("arch",(gx0+gx1)/2,gy-gh*0.5,Math.min(12,(gx1-gx0)*0.35),gh*0.7,0,r()<0.6?"beacon":"glass",true);
  const sw=Math.max(3,w*0.12);for(let i=0;i<3;i++){const t=0.28+i*0.22;b.win("lancet",w/2+ls*t,-h*t,sw,sw*3,0,i===1?"empty":"glass",true);}
  const dw=clamp(w*0.36,6,14);b.door(w/2,dw,dw*1.9,0,"lancet");
  b.anchor=[gx1,gy];
}
function aCrypt(b){ // a small mausoleum: steps, a pediment, pinnacles (one fallen), columns
  const o=b.o,r=b.r,w=o.w,h=o.h;
  b.fill([[-w*0.1,2],[w*1.1,2],[w*1.1,-4],[-w*0.1,-4]]);b.fill([[-w*0.03,-4],[w*1.03,-4],[w*1.03,-8],[-w*0.03,-8]]);
  b.fill([[w*0.06,-8],[w*0.94,-8],[w*0.95,-h],[w*0.05,-h]]);b.fill([[-2,-h],[w+2,-h],[w+2,-h-4],[-2,-h-4]]);
  const pk=[w/2,-h-4-w*0.34];
  b.fill([[-3,-h-4]].concat(qpts([-3,-h-4],[w*0.25,-h-4-w*0.2],pk,5).slice(1),qpts(pk,[w*0.75,-h-4-w*0.2],[w+3,-h-4],5).slice(1)));
  const fallen=Math.floor(r()*3);
  for(let i=0;i<2;i++){if(i===fallen)continue;const x=i?w-3:3;b.fill([[x-3,-h-4],[x+3,-h-4],[x+3,-h-12],[x,-h-22],[x-3,-h-12]]);}
  if(r()<0.5){b.line([pk,[pk[0],pk[1]-14]],2);b.line([[pk[0]-5,pk[1]-9],[pk[0]+5,pk[1]-9]],2);}
  else b.fill([[pk[0]-4,pk[1]],[pk[0]+4,pk[1]],[pk[0]+5,pk[1]-6],[pk[0]+2,pk[1]-10],[pk[0]-2,pk[1]-10],[pk[0]-5,pk[1]-6]]);
  for(const fx of [0.2,0.8]){const x=w*fx;b.cut([[x-1,-9],[x+1,-9],[x+1,-h+3],[x-1,-h+3]]);}
  const dw=clamp(w*0.28,7,16);b.door(w/2,dw,Math.min(h*0.7,dw*2),0,"lancet",-8);
  b.anchor=[w,-h];
}
function aTavern(b){ // two storeys, many chimneys, a porch, a big sign with a tankard cut out of it
  const o=b.o,r=b.r,w=o.w,h=o.h,lean=(r()<0.5?-1:1)*(0.03+r()*0.05),S=bStoreys(b,0,w,h,2,lean,0.05);
  if(o.wing)bWing(b,S.walls[0].br-2,Math.max(w*0.42,68),S.sh*(0.95+r()*0.1),lean);
  const rf=bRoof(b,S.xl,S.xr,S.y,(S.xr-S.xl)*(0.55+r()*0.2),lean);
  if(!b.anchor)b.anchor=[rf.eR[0],rf.eR[1]];
  bCrossGable(b,S,rf,lean);bChimneys(b,rf,2+(r()<0.4?1:0),w);bFinial(b,rf.pk);
  const wl=S.walls[0],dw=clamp(w*0.13,8,22),dh=Math.min(S.sh*0.66,dw*2),dcx=lerp(wl.bl,wl.br,0.36);
  b.fill([[dcx-dw*1.1,-dh-4],[dcx+dw*1.1,-dh-4],[dcx+dw*1.3,-dh-9],[dcx-dw*1.3,-dh-9]]);
  b.line([[dcx-dw,-dh-4],[dcx-dw-4,-dh+6]],1.4);b.line([[dcx+dw,-dh-4],[dcx+dw+4,-dh+6]],1.4);
  b.door(dcx,dw,dh,lean*dh*0.4,"arch");b.block(dcx-dw*1.4,dcx+dw*1.4,-dh-12,6);
  const sw2=S.walls[1],sg=bSign(b,sw2.bl-1,lerp(sw2.y0,sw2.y1,0.35),true),tx=sg[0]+6,ty=sg[1]+3;
  b.cut([[tx,ty],[tx+8,ty],[tx+8,ty+10],[tx,ty+10]]);
  const hc=[tx+8,ty+5],ring=[];for(let i=0;i<=8;i++){const a=-Math.PI/2+i/8*Math.PI;ring.push([hc[0]+Math.cos(a)*4,hc[1]+Math.sin(a)*4]);}for(let i=8;i>=0;i--){const a=-Math.PI/2+i/8*Math.PI;ring.push([hc[0]+Math.cos(a)*2.2,hc[1]+Math.sin(a)*2.2]);}b.cut(ring);
  for(const w2 of S.walls)wallWins(b,w2,2+Math.floor(r()*2),{lean});
  b.lit=2.2;bTiles(b,rf);
}
function aChapel(b){ // buttressed nave, tall bent spire, a rose window
  const o=b.o,r=b.r,w=o.w,h=o.h,lean=(r()-0.5)*0.04,S=bStoreys(b,0,w,h,1,lean),wl=S.walls[0];
  for(let i=1;i<4;i++){const x=lerp(wl.bl,wl.br,i/4);b.fill([[x-3,2],[x-3,-h*0.8],[x+1,-h*0.85],[x+7,2]]);}
  const rf=bRoof(b,S.xl,S.xr,S.y,w*(0.42+r()*0.12),lean,{ov:w*0.04});
  b.anchor=[rf.eR[0],rf.eR[1]];bFinial(b,rf.pk);
  const tw=w*0.28,tx=(o.wing?true:r()<0.5)?-tw*0.4:w-tw*0.6;bTower(b,tx,tw,h*(2+r()*0.3),(r()-0.5)*tw*0.5,{rose:true});
  if(o.wing)bWing(b,wl.br-2,Math.max(w*0.46,68),h*0.95,lean);
  if(o.door){const dw=clamp(w*0.14,15,22);b.door(lerp(wl.bl,wl.br,0.5),dw,Math.min(h*0.72,dw*2.1),0,"lancet");}
  for(let i=0;i<4;i++){const ww=Math.max(5,w*0.065);b.win("lancet",lerp(wl.bl,wl.br,(i+0.5)/4),-h*0.5,ww,ww*2.6,0);}
}
function circPts(cx,cy,rx,ry,n,a0,a1){const out=[];for(let i=0;i<=n;i++){const a=lerp(a0,a1,i/n);out.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]);}return out;}
function aDolmen(b){ // three standing stones under a tilted capstone: the mouth-hat's perch on the moor
  const o=b.o,r=b.r,w=o.w,h=o.h,j=()=>(r()-0.5)*4;
  const stone=(x0,x1,top,lean)=>b.fill([[x0-2,3],[x0+j(),-top*0.5],[x0+lean+2+j(),-top],[x1+lean-2+j(),-top-2+j()],[x1+j(),-top*0.45],[x1+2,3]]);
  stone(0,w*0.22,h,-2);stone(w*0.4,w*0.6,h*0.92,1);stone(w*0.78,w,h*1.04,3);
  const tilt=(r()-0.5)*8,cy=-h-2,th=h*0.28;
  b.fill([[-w*0.12,cy+tilt*0.6],[-w*0.06,cy-th*0.8],[w*0.3,cy-th-3],[w*0.75,cy-th+1],[w*1.1,cy-th*0.6-tilt*0.6],[w*1.14,cy-tilt*0.6],[w*0.7,cy+3],[w*0.2,cy+2]]);
  if(o.crack)b.cut([[w*0.62,cy-th-4],[w*0.66,cy-th*0.5],[w*0.6,cy+4],[w*0.57,cy-th*0.4]]);
  if(o.fallen)b.fill([[w*1.2,3],[w*1.22,-h*0.2],[w*1.58,-h*0.24],[w*1.66,3]]);
  b.perch={x:w*0.48,y:cy-th-2};b.anchor=[w*1.1,cy-th*0.6];
}
function aStump(b){ // a great broken trunk with gripping roots, bracket fungi and a hollow
  const o=b.o,r=b.r,w=o.w,h=o.h,top=[];
  for(let i=0;i<=8;i++){const u=i/8;top.push([lerp(w*0.08,w*0.92,u),-h-(i%2?r()*h*0.1:h*0.04+r()*h*0.22)]);}
  top[3][1]=top[4][1]=top[5][1]=-h;
  b.fill([[-w*0.2,3]].concat(qpts([-w*0.2,3],[w*0.02,-h*0.15],[w*0.06,-h*0.5],5).slice(1),[[w*0.08,-h]],top.slice(1,8),[[w*0.92,-h],[w*0.94,-h*0.5]],qpts([w*0.94,-h*0.5],[w*0.98,-h*0.15],[w*1.2,3],5).slice(1)));
  for(const sd of [-1,1])for(let i=0;i<2;i++){const sx=sd<0?w*0.1:w*0.9,ex=sx+sd*w*(0.35+r()*0.3+i*0.15);b.fill([[sx-sd*6,-h*0.18],[ex,3],[ex-sd*10,3],[sx-sd*16,-h*0.02]]);}
  b.fill([[w*0.85,-h*0.62],[w*1.25,-h*0.8],[w*1.28,-h*0.74],[w*0.9,-h*0.5]]);
  for(let i=0;i<3;i++){const fy=-h*(0.3+i*0.14),right=i%2===0,fx=right?w*0.935-2:w*0.065+2;b.fill(circPts(fx,fy,10,3.8,8,right?-Math.PI/2:Math.PI/2,right?Math.PI/2:Math.PI*1.5));}
  b.cut(circPts(w*0.5,-h*0.42,w*0.12,h*0.14,14,0,Math.PI*2));
  b.perch={x:w*0.5,y:-h};b.anchor=[w*0.5,-h];
}
const KINDS={manor:aManor,townhouse:aTownhouse,cottage:aCottage,ruin:aRuin,windmill:aWindmill,watchtower:aWatchtower,crypt:aCrypt,tavern:aTavern,chapel:aChapel,dolmen:aDolmen,stump:aStump};
const SIZE={townhouse:[44,58,120,150],cottage:[90,120,36,46],ruin:[100,120,58,70],windmill:[56,66,110,130],watchtower:[32,40,140,170],crypt:[48,58,38,46],tavern:[120,140,84,96],manor:[110,130,90,110],chapel:[90,110,56,66]};
function building(kind,r,o,sc){const b=new Bld(r,o);KINDS[kind](b);return b.done(sc);}

/* each building as it's drawn: lit windows glow, the rest are dark recesses; light under the door on the path */
function fillHoles(x,sp,X,Y,k,rnd,o2){
  const boost=sp.lit||1;
  for(const hl of sp.holes){
    x.beginPath();hl.pts.forEach((p,i)=>{const px=X+p[0]*k,py=Y+p[1]*k;i?x.lineTo(px,py):x.moveTo(px,py);});x.closePath();
    if(hl.kind!=="door"&&(hl.always||rnd()<o2.litP*boost)){
      x.save();x.fillStyle=rgba(o2.win,o2.a);x.shadowColor=o2.win;x.shadowBlur=FX?7:0;x.fill();x.restore();
      const cx=X+(hl.cx+hl.sk*0.3)*k,cy=Y+hl.cy*k,hw=hl.ww*k/2,hh=hl.wh*k/2;
      x.strokeStyle=o2.bar;x.lineWidth=Math.max(0.7,hl.ww*k*0.15);x.beginPath();
      if(hl.kind==="round"){x.moveTo(cx,cy-hw*1.1);x.lineTo(cx,cy+hw*1.1);x.moveTo(cx-hw*1.1,cy);x.lineTo(cx+hw*1.1,cy);}
      else{x.moveTo(cx,cy-hh*0.8);x.lineTo(X+hl.cx*k,cy+hh);x.moveTo(X+hl.cx*k-hw,cy+hh*0.12);x.lineTo(X+hl.cx*k+hw+hl.sk*k*0.3,cy+hh*0.06);}
      x.stroke();
    }else{x.fillStyle=o2.dark;x.fill();}
    if(hl.kind==="door"&&o2.crack){const by=Y+(hl.base||0)*k;x.save();x.fillStyle="rgba(255,207,106,0.9)";x.shadowColor="#ffcf6a";x.shadowBlur=FX?6:0;x.fillRect(X+(hl.cx-hl.ww*0.38)*k,by-1.4*k,hl.ww*0.76*k,1.4*k);x.restore();}
  }
}
function grassSprite(r,wind,sc,short){
  const W=90,H=46,c=mk(W*sc,H*sc),x=c.getContext("2d");x.setTransform(sc,0,0,sc,0,0);x.strokeStyle=INK;x.lineCap="round";
  for(let i=0;i<(short?34:22);i++){const bx=6+r()*78,len=short?8+r()*14:14+r()*30,lean=wind*14+(r()-0.5)*14;x.lineWidth=1+r()*2;x.beginPath();x.moveTo(bx,H);x.quadraticCurveTo(bx+lean*0.3,H-len*0.6,bx+lean,H-len);x.stroke();}
  return{c,ox:0,oy:H,w:W,h:H};
}
function drawSprite(x,sp,X,Y,k,flip){
  if(!flip){x.drawImage(sp.c,X-sp.ox*k,Y-sp.oy*k,sp.w*k,sp.h*k);return;}
  x.save();x.translate(X,Y);x.scale(-1,1);x.drawImage(sp.c,-sp.ox*k,-sp.oy*k,sp.w*k,sp.h*k);x.restore();
}
/* ============================== pools ============================== */
class Pools{
  constructor(ver,sc){
    this.ver=ver;this.sc=sc;
    const tree=(id,i,h,opt)=>geomSprite(pollardGeom(rng32(hsh(31,id,i,2)),h,opt,ver),sc);
    this.tf=range(4).map(i=>tree(1,i,70,{limbs:4,limbs3:3+(i%2),sub:0,twigs:false}));
    this.t2=range(3).map(i=>tree(2,i,150,{sub:1}));
    this.t3=range(6).map(i=>tree(3,i,250,{sub:1,limbs3:4+(i%2)}));
    this.t4=range(4).map(i=>tree(4,i,420,{sub:1,limbs3:5+(i%2)}));
    if(ver===3){
      const H3=(id,i,w,h,extra)=>houseV3(rng32(hsh(41,id,i,3)),Object.assign({w,h},extra||{}),sc);
      this.h2=range(6).map(i=>{const r=rng32(hsh(51,i,3));return H3(2,i,50+r()*40,44+r()*36,{detail:1});});
      this.ch=[H3(5,0,64,60,{chapel:true,detail:1,storeys:1})];
      this.h3=range(3).map(i=>{const r=rng32(hsh(52,i,3));return H3(3,i,90+r()*40,84+r()*28,{detail:1});});
      this.ph=range(3).map(i=>H3(6,i,150,124,{storeys:2,door:true,wing:true,detail:2,sign:true,tower:true,towerSide:-1}));
    }else{ // nine kinds, ordered so that neighbours never match
      const mkB=(kind,i,scale,extra)=>{const r=rng32(hsh(41,i,kind.length,4)),z=SIZE[kind];return building(kind,r,Object.assign({w:lerp(z[0],z[1],r())*scale,h:lerp(z[2],z[3],r())*scale,detail:1},extra||{}),sc);};
      this.h3=["ruin","townhouse","windmill","tavern","cottage","crypt","watchtower","manor","chapel"].map((k,i)=>mkB(k,i,1));
      this.h2=["townhouse","cottage","chapel","windmill","watchtower","manor","crypt","tavern","ruin","townhouse","cottage","watchtower"].map((k,i)=>mkB(k,i+20,0.62));
      this.ph=[building("manor",rng32(hsh(6,0,4)),{w:150,h:124,storeys:2,door:true,wing:true,detail:2,sign:true,towerSide:-1},sc),
               ver===4?building("tavern",rng32(hsh(6,1,4)),{w:150,h:108,door:true,wing:true,detail:2},sc):building("chapel",rng32(hsh(6,1,5)),{w:128,h:78,door:true,wing:true,detail:2},sc),
               ver===4?building("townhouse",rng32(hsh(6,2,4)),{w:74,h:156,storeys:3,door:true,wing:true,detail:2},sc):building("cottage",rng32(hsh(6,2,5)),{w:132,h:58,wing:true,detail:2},sc)];
    }
    this.fgb=range(2).map(i=>geomSprite(overhangGeom(rng32(hsh(61,i,7)),3),sc));
    this.tuft=range(4).map(i=>grassSprite(rng32(hsh(71,i)),0.16,sc));
  }
  get(name){ // the pools for the other places, built the first time a level needs them
    const key="_"+name;if(this[key])return this[key];
    const sc=this.sc,mkB=(kind,i,scale,extra)=>{const r=rng32(hsh(43,i,kind.length,name.length)),z=SIZE[kind];return building(kind,r,Object.assign({w:lerp(z[0],z[1],r())*scale,h:lerp(z[2],z[3],r())*scale,detail:1},extra||{}),sc);};
    let S;
    if(name==="wind"){const wt=(id,i,h,opt)=>geomSprite(windGeom(rng32(hsh(33,id,i)),h,opt),sc);
      S={w1:range(5).map(i=>wt(1,i,70,{limbs:3,sub:0,twigs:false})),w2:range(4).map(i=>wt(2,i,150,{})),w3:range(6).map(i=>wt(3,i,250,{})),w4:range(4).map(i=>wt(4,i,420,{limbs:5})),
         fo:range(2).map(i=>geomSprite(windOverhangGeom(rng32(hsh(63,i))),sc)),
         s2:range(3).map(i=>geomSprite(snagGeom(rng32(hsh(34,2,i)),190),sc)),s3:range(3).map(i=>geomSprite(snagGeom(rng32(hsh(34,3,i)),290),sc)),s4:range(2).map(i=>geomSprite(snagGeom(rng32(hsh(34,4,i)),430),sc)),
         wgrass:range(4).map(i=>windGrassSprite(rng32(hsh(77,i)),sc)),fern:range(3).map(i=>fernSprite(rng32(hsh(73,i)),sc)),heather:range(4).map(i=>grassSprite(rng32(hsh(75,i)),0.3,sc,true))};}
    else if(name==="town")S={
      h2:["townhouse","tavern","townhouse","manor","chapel","townhouse","watchtower","townhouse","tavern","manor","townhouse"].map((k,i)=>mkB(k,i,0.62)),
      h3:["townhouse","tavern","manor","townhouse","chapel","townhouse","watchtower","tavern","townhouse"].map((k,i)=>mkB(k,i+30,1)),
      ph:[building("tavern",rng32(hsh(6,1,4)),{w:150,h:108,door:true,wing:true,detail:2},sc),
          building("townhouse",rng32(hsh(6,2,4)),{w:74,h:156,storeys:3,door:true,wing:true,detail:2},sc),
          building("townhouse",rng32(hsh(6,3,4)),{w:82,h:178,storeys:4,door:true,wing:true,detail:2},sc)]};
    else if(name==="moor")S={
      h2:["windmill","ruin","watchtower","crypt","chapel","ruin","windmill"].map((k,i)=>mkB(k,i,0.62)),
      h3:["ruin","crypt","windmill","chapel","watchtower","cottage","ruin"].map((k,i)=>mkB(k,i+30,1)),
      ph:[building("dolmen",rng32(hsh(6,4,1)),{w:124,h:62,detail:2},sc),
          building("dolmen",rng32(hsh(6,5,1)),{w:112,h:70,detail:2,crack:true},sc),
          building("dolmen",rng32(hsh(6,6,1)),{w:120,h:58,detail:2,fallen:true},sc)]};
    else if(name==="forest")S={
      ph:[building("cottage",rng32(hsh(6,7,5)),{w:118,h:56,logs:true,detail:2},sc),
          building("stump",rng32(hsh(6,8,1)),{w:92,h:98,detail:2},sc),
          building("cottage",rng32(hsh(6,9,5)),{w:126,h:60,logs:true,detail:2},sc)]};
    this[key]=S;return S;
  }
}
/* ============================== ground lines ============================== */
const ridgeY=x=>370+46*Math.sin(x*0.0027+0.3)+24*Math.sin(x*0.0069+1.7)+10*Math.sin(x*0.017+0.5)+4*Math.sin(x*0.041);
const l2Y=x=>447+7*Math.sin(x*0.0062+2)+4*Math.sin(x*0.017);
const l3Y=x=>460+6*Math.sin(x*0.0051+0.7)+3*Math.sin(x*0.019+1);
const l4Y=x=>474+5*Math.sin(x*0.0047+2.4);
const gY=x=>468+6*Math.sin(x*0.0035+1)+4*Math.sin(x*0.0091+2);
const RIDGE={village:ridgeY,town:x=>362+30*Math.sin(x*0.0024+0.3)+16*Math.sin(x*0.0071+1.7)+6*Math.sin(x*0.019),
  moor:x=>334+24*Math.sin(x*0.0016+0.8)+12*Math.sin(x*0.0047+2.1)+5*Math.sin(x*0.013)+2*Math.sin(x*0.037),
  forest:x=>394+12*Math.sin(x*0.0021)+6*Math.sin(x*0.009+1)};
const MOORY=[RIDGE.moor,x=>372+28*Math.sin(x*0.0042+1.1)+13*Math.sin(x*0.011+0.4)+5*Math.sin(x*0.027),
  x=>408+25*Math.sin(x*0.0037+2.3)+11*Math.sin(x*0.0093+1.2)+4*Math.sin(x*0.024),x=>442+18*Math.sin(x*0.0031+0.6)+8*Math.sin(x*0.0081+2.6)];
const groundAt=(fn,x0,x1)=>{let m=-1e9;for(let q=x0;q<=x1;q+=6)m=Math.max(m,fn(q));return Math.max(m,fn(x1));}; // the lowest ground under a footprint, so nothing hangs in the air
const CW={village:[0,520,420,520,640],town:[0,420,300,330,560],moor:[0,600,560,620,800],forest:[0,300,240,280,400]};

/* ============================== the play strip (repeats every 1900) ============================== */
const P=1900,POST_X=1480;
const SET=[
  {k:"grave",x:250,v:0},{k:"fence",x:420,w:110},{k:"grave",x:690,v:1},{k:"candle",x:703},
  {k:"wall",x:930,w:140,h:58},{k:"potion",x:1000},
  {k:"bat",x:1070,y:300},
  {k:"house",x:1120},{k:"hatmaw"},
  {k:"thorns",x:1300,w:62},{k:"ghoul",x:1385},
  {k:"post",x:POST_X},{k:"grave",x:1600,v:2},{k:"grave",x:1650,v:0},{k:"fence",x:1700,w:120}
];
const SET5=[
  {k:"grave",x:235,v:3},{k:"grave",x:330,v:4},{k:"fence",x:420,w:110},{k:"grave",x:585,v:5},{k:"grave",x:690,v:1},{k:"candle",x:712},
  {k:"wall",x:930,w:140,h:58},{k:"potion",x:1000},
  {k:"bat",x:1070,y:300},{k:"house",x:1120},{k:"hatmaw"},{k:"thorns",x:1300,w:62},{k:"ghoul",x:1385},
  {k:"post",x:POST_X},{k:"grave",x:1585,v:2},{k:"grave",x:1655,v:0},{k:"fence",x:1720,w:110}
];
const MID=[{k:"bat",x:1070,y:300},{k:"house",x:1120},{k:"hatmaw"},{k:"thorns",x:1300,w:62},{k:"ghoul",x:1385},{k:"post",x:POST_X}];
const SETS={
  village:{items:SET,wallH:58,string:true},
  village5:{items:SET5,wallH:58,string:true},
  town:{items:[{k:"lamp",x:200},{k:"barrels",x:290},{k:"crates",x:345},{k:"fence",x:460,w:120},{k:"well",x:700},{k:"wall",x:930,w:140,h:58},{k:"potion",x:1000}].concat(MID,[{k:"barrels",x:1600},{k:"fence",x:1680,w:140}]),wallH:58,string:true},
  moor:{items:[{k:"grass",x:120},{k:"menhir",x:220,v:0},{k:"grass",x:300},{k:"cairn",x:400},{k:"grass",x:490},{k:"fallen",x:580},{k:"menhir",x:690,v:1},{k:"candle",x:712},{k:"grass",x:820},{k:"stonewall",x:930,w:150,h:46},{k:"potion",x:1005}].concat(MID,[{k:"grass",x:1255},{k:"grass",x:1545},{k:"menhir",x:1620,v:2},{k:"cairn",x:1720},{k:"grass",x:1800}]),wallH:46,string:false,potionGround:true},
  forest:{items:[{k:"bigstump",x:210,v:0},{k:"ferns",x:330,w:120},{k:"bigstump",x:540,v:1},{k:"shrine",x:690},{k:"log",x:900,w:190,h:30},{k:"potion",x:1000}].concat(MID,[{k:"bigstump",x:1600,v:2},{k:"ferns",x:1680,w:150},{k:"stump",x:1840,v:1}]),wallH:30,string:false,potionGround:true}
};

/* ============================== a scene ============================== */
class Scene{
  constructor(ver,sc){this.ver=ver;this.sc=sc;this.pools=new Pools(ver,sc);this.cache={};}
  ensure(W,s,lv){
    const key=Math.round(W)+"@"+s.toFixed(3)+lv;
    if(this.cache.key===key)return;
    this.cache={key};const cs=Math.min(s,1.25),L=LV[lv];
    if(lv!=="mist"){this.cache.cl0=renderCutClouds(W*2,cs,lv,0,hsh(91,1));this.cache.cl1=renderCutClouds(W*2,cs,lv,1,hsh(91,2));}
    if(L.light!=="sun")this.cache.moon=this.ver===3?moonSprite(Math.min(2,s),lv==="storm"):moonSprite4(Math.min(2,s),lv);
    if(L.mist)this.cache.mist=L.mist.bands.map((b,i)=>renderMist(W*2,cs,L.mist.col,hsh(93,i,lv.length)));
  }
  render(ctx,off,s,W,t,camX,o){
    const lv=o.level,rm=o.rm,L=LV[lv],tn=this.ver<5?TINTS:L.tints;
    // the place's lift: the picture as if the camera had risen L.lift lines, slid back up so the path keeps its height. at(k) places a
    // part that slides at parallax k: the sky and its light at 0, the clouds, mist, backdrop layers and flyers at their own rates, so
    // their feet spread apart; the path, the rain, the fore layer and the vignette at 1, where the lift leaves them where they were
    const lift=this.ver>=5&&L.lift||0,at=k=>ctx.setTransform(s,0,0,s,0,Math.round(-lift*(1-k)*s));
    this.ensure(W,s,lv);
    at(0);
    const sk=SKY[lv],g=ctx.createLinearGradient(0,0,0,470);
    g.addColorStop(0,sk[0]);g.addColorStop(0.45,sk[1]);g.addColorStop(0.8,sk[2]);g.addColorStop(1,sk[3]);
    ctx.fillStyle=g;ctx.fillRect(0,0,W,LH);
    if(L.light==="moon")drawMoon(ctx,W,lv,this.cache.moon);
    else if(L.light==="setmoon"){drawStars(ctx,W);drawDaybreak(ctx,W);drawSetMoon(ctx,W,this.cache.moon);}
    else drawSun(ctx,W);
    const W2=W*2;
    const mb=after=>{if(!L.mist)return;at([0.03,0.12,0.28,0.5][after]);L.mist.bands.forEach((b,i)=>{if(b[0]!==after)return;const cv=this.cache.mist[i],k=[0.03,0.12,0.28,0.5][after]*(rm?0.4:1),ox=posmod(t*b[3]*(rm?0.4:1)+camX*k,W2);
      ctx.save();ctx.globalAlpha=b[2];ctx.drawImage(cv,-ox,b[1]-100,W2,200);ctx.drawImage(cv,-ox+W2,b[1]-100,W2,200);ctx.restore();});};
    if(this.cache.cl0)for(const d of [0,1]){const cv=this.cache["cl"+d],sp=(d?11:5)*(rm?0.4:1),k=d?0.06:0.03,ox=posmod(t*sp+camX*k,W2);at(k);ctx.drawImage(cv,-ox,0,W2,LH);ctx.drawImage(cv,-ox+W2,0,W2,LH);}
    at(0);
    if(lv==="storm"){
      const st=lightning(t);
      if(st.bolt>0)drawBolt(ctx,W,st);
      if(st.swell>0){ctx.save();ctx.globalCompositeOperation="screen";ctx.fillStyle=rgba("#ffb39a",0.32*st.swell);ctx.fillRect(0,0,W,440);ctx.restore();}
    }
    mb(0);
    if(this.ver>=5&&L.light==="sun"){at(0.05);drawFarRanges(ctx,W,camX,rm,lv);}
    const f=k=>rm?k*0.4:k;
    at(0.12);this.layer(ctx,off,s,W,t,camX*f(0.12),1,tn[0],o);mb(1);
    if(lv==="storm"){at(1);drawRain(ctx,W,t,0,rm);}
    at(0.28);this.layer(ctx,off,s,W,t,camX*f(0.28),2,tn[1],o);mb(2);
    if(L.light==="sun"){at(0);drawRays(ctx,W,t,rm);}
    at(0.34);
    if(L.fly==="bats")drawSwarm(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9));
    else drawCrows(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9),L.fly==="crows"?7:3,false);
    at(0.5);this.layer(ctx,off,s,W,t,camX*f(0.5),3,tn[2],o);mb(3);
    at(0.62);
    if(L.fly==="bats")drawBigBats(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.7));
    else if(L.fly==="crows")drawCrows(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.7),0,true);
    at(0.76);this.layer(ctx,off,s,W,t,camX*f(0.76),4,tn[3],o);
    at(1);this.play(ctx,s,W,t,camX,o);
    if(lv==="storm")drawRain(ctx,W,t,1,rm);
    this.fore(ctx,s,W,t,camX*(rm?1.08:1.35),o);
    const vg=ctx.createRadialGradient(W/2,LH*0.45,LH*0.35,W/2,LH*0.5,W*0.72);
    vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,"+(this.ver<5?0.5:L.vig)+")");ctx.fillStyle=vg;ctx.fillRect(0,0,W,LH);
    if(o.hud)drawHUD(ctx,W);
  }
  layer(ctx,off,s,W,t,lx,L,tint,o){
    const Pp=this.pools,x=off.getContext("2d"),air=AIR[o.level],haze=HAZE[o.level];
    x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,off.width,off.height);x.setTransform(s,0,0,s,0,0);
    x.fillStyle=INK;
    const houses=[],fairies=[],set=this.ver<5?"village":LV[o.level].set;
    const yfn=set==="moor"?MOORY[L-1]:L===1?RIDGE[set]:L===2?l2Y:L===3?l3Y:l4Y,eyes=[];
    x.beginPath();x.moveTo(-10,LH+10);for(let sx=-10;sx<=W+10;sx+=6)x.lineTo(sx,yfn(sx+lx));x.lineTo(W+10,LH+10);x.closePath();x.fill();
    const cw=(L===4&&this.ver>=5&&LV[o.level].cw4)||CW[set][L],k0=Math.floor((lx-260)/cw),k1=Math.floor((lx+W+260)/cw);
    for(let k=k0;k<=k1;k++){
      const r=rng32(set==="village"?hsh(17,L,k):hsh(17,L,k,set.length)),bx=k*cw;
      if(set!=="village")this.content(set,x,L,k,r,bx,cw,lx,yfn,houses,fairies,eyes);
      else if(L===1){
        const n=1+Math.floor(r()*3);
        for(let i=0;i<n;i++){const px=bx+r()*cw,X=px-lx,Y=yfn(px)+2;
          if(r()<0.45)drawSpireCluster(x,X,Y,r);else drawSprite(x,Pp.tf[Math.floor(r()*4)],X,Y+3,0.5+r()*0.35,r()<0.5);}
      }else if(L===2){
        const n=1+Math.floor(r()*2);
        for(let i=0;i<n;i++){const px=bx+(i+0.15+r()*0.6)*(cw/n),X=px-lx,Y=l2Y(px)+4;
          if(r()<0.3)drawSprite(x,Pp.t2[Math.floor(r()*3)],X,Y,0.75+r()*0.4,false);
          else{const r1=r(),r2=r(),sp=this.ver>=4?Pp.h2[posmod(k*2+i,Pp.h2.length)]:(r1<0.14?Pp.ch[0]:Pp.h2[Math.floor(r2*6)]),k2=0.9+r()*0.35;drawSprite(x,sp,X,Y,k2,false);houses.push({sp,X,Y,k:k2,seed:hsh(19,L,k,i),a:0.55});}
        }
      }else if(L===3){
        const px=bx+r()*cw*0.8,X=px-lx;
        if(r()<0.5){const ri=r(),sp=this.ver>=4?Pp.h3[posmod(k,Pp.h3.length)]:Pp.h3[Math.floor(ri*3)],k2=0.9+r()*0.25,hx2=bx+((px-bx+cw*0.45)%cw);drawSprite(x,sp,hx2-lx,l3Y(hx2)+5,k2,false);houses.push({sp,X:hx2-lx,Y:l3Y(hx2)+5,k:k2,seed:hsh(19,L,k),a:0.75});}
        drawSprite(x,Pp.t3[Math.floor(r()*6)],X,l3Y(px)+6,0.85+r()*0.3,r()<0.5);
        if(r()<0.45){const gx=bx+r()*cw;for(let j=0;j<3;j++){const v=Math.floor(r()*3);if(this.ver>=5)drawGrave5(x,gx-lx+j*18,l3Y(gx+j*18)+3,0.42,(v*2+j)%6);else drawGrave(x,gx-lx+j*16,l3Y(gx+j*16)+3,0.6,v);}}
      }else{
        const px=bx+cw*0.15+r()*cw*0.7,X=px-lx;
        drawSprite(x,Pp.t4[Math.floor(r()*4)],X,l4Y(px)+10,0.85+r()*0.3,r()<0.5);
        if(r()<0.55){const ax=X+40,ay=l4Y(px)-230,bx2=X+260+r()*120,by=l4Y(px+250)-170,qx=(ax+bx2)/2,qy=Math.max(ay,by)+38;fairies.push([ax,ay,qx,qy,bx2,by,k]);
          x.lineWidth=1;x.strokeStyle=INK;x.beginPath();x.moveTo(ax,ay);x.quadraticCurveTo(qx,qy,bx2,by);x.stroke();
          x.fillRect(bx2-2,by,4,l4Y(px+250)-by+8);}
      }
    }
    const tinted=mixc(INK,air,tint);
    x.globalCompositeOperation="source-atop";x.fillStyle=tinted;x.fillRect(-20,-20,W+40,LH+40);x.globalCompositeOperation="source-over";
    const crest=this.ver<5?(o.level==="storm"?0.32:0.5):LV[o.level].crest;
    if(L===1&&crest>0){x.strokeStyle=rgba(haze,crest);x.lineWidth=1.4;x.beginPath();for(let sx=-10;sx<=W+10;sx+=4){const yy=yfn(sx+lx);sx<=-10?x.moveTo(sx,yy):x.lineTo(sx,yy);}x.stroke();}
    const dark=mixc(INK,air,tint*0.55);
    // doors and windows end at the ground line: each building stands a little into its ground, and its holes must not show on the hill
    x.save();x.beginPath();x.moveTo(-10,-20);x.lineTo(W+10,-20);for(let sx=W+10;sx>-14;sx-=4)x.lineTo(sx,yfn(sx+lx));x.closePath();x.clip();
    for(const hs of houses)fillHoles(x,hs.sp,hs.X,hs.Y,hs.k,rng32(hs.seed),{litP:o.litP,win:o.win,a:hs.a,bar:tinted,dark,crack:false});
    x.restore();
    if(this.collect){this.collect.fairies.push(...fairies);this.collect.eyes.push(...eyes);}
    else{for(const fl of fairies)drawFairy(x,fl,t,o.level);
    if(eyes.length)drawTreeEyes(x,eyes,t,L,o.rm);}
    if(set==="moor"&&L>=2){ // a faint lit edge along each lower hill, so the rises and dips read
      ctx.strokeStyle=rgba(haze,[0,0,0.42,0.32,0.22][L]);ctx.lineWidth=2.6;ctx.beginPath();for(let sx=-10;sx<=W+10;sx+=4){const yy=yfn(sx+lx);sx<=-10?ctx.moveTo(sx,yy):ctx.lineTo(sx,yy);}ctx.stroke();}
    ctx.save();ctx.setTransform(1,0,0,1,0,ctx.getTransform().f); // the layer keeps the lift it was given
    if(L>=2){ctx.shadowColor=rgba(haze,L===4?0.55:0.4);ctx.shadowBlur=(L===4?14:9)*s;}
    ctx.drawImage(off,0,0);ctx.restore();
    const HL=this.ver>=5&&LV[o.level].hollows;
    if(HL&&HL.a[L]>0){ // mist lying in the dips of this layer, not in flat bands
      const F=HL.F[L],g=ctx.createLinearGradient(0,F-6,0,F+34);g.addColorStop(0,rgba(HL.col,0));g.addColorStop(1,rgba(HL.col,HL.a[L]));
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-10,F-6);for(let sx=-10;sx<=W+10;sx+=6)ctx.lineTo(sx,Math.max(F-6,yfn(sx+lx)+4));ctx.lineTo(W+10,F-6);ctx.closePath();ctx.fill();}
    const bk=this.ver>=5&&LV[o.level].back;
    if(L===4&&bk){ // a soft haze rising from the ground just behind the path, to lift the trees behind the action
      const g=ctx.createLinearGradient(0,360,0,472);g.addColorStop(0,rgba(haze,0));g.addColorStop(1,rgba(haze,bk));ctx.fillStyle=g;ctx.fillRect(0,360,W,LH-360);}
    if(L<=3&&!(HL&&L>=2)){
      const base=L===1?(set==="moor"?342:400):L===2?452:462,gr=ctx.createLinearGradient(0,base-70,0,base+40);
      gr.addColorStop(0,rgba(haze,0));gr.addColorStop(0.65,rgba(haze,L===1?0.22:0.15));gr.addColorStop(1,rgba(haze,0));
      ctx.fillStyle=gr;ctx.fillRect(0,base-70,W,110);
    }
  }
  content(set,x,L,k,r,bx,cw,lx,yfn,houses,fairies,eyes){ // what fills each layer in the old town, on the moor and in the forest
    const Pp=this.pools,Wd=Pp.get("wind"),S=set==="forest"?null:Pp.get(set),pick=a=>a[Math.floor(r()*a.length)];
    if(set==="town"){
      if(L===1){const n=2+Math.floor(r()*2);for(let i=0;i<n;i++){const px=bx+(i/n)*cw+r()*30;drawRoofline(x,px-lx,yfn(px)+3,r);}}
      else if(L===2){const n=2+Math.floor(r()*2);
        for(let i=0;i<n;i++){const px=bx+(i+0.1+r()*0.5)*(cw/n),X=px-lx,Y=l2Y(px)+4;
          if(r()<0.1)drawSprite(x,pick(Pp.t2),X,Y,0.7+r()*0.3,false);
          else{const sp=S.h2[posmod(k*3+i,S.h2.length)],k2=0.95+r()*0.3;drawSprite(x,sp,X,Y,k2,false);houses.push({sp,X,Y,k:k2,seed:hsh(19,L,k,i,7),a:0.55});}}}
      else if(L===3){const n=1+(r()<0.6?1:0);
        for(let i=0;i<n;i++){const px=bx+(i+0.1+r()*0.5)*(cw/n),X=px-lx,Y=l3Y(px)+5,sp=S.h3[posmod(k*2+i,S.h3.length)],k2=0.9+r()*0.2;drawSprite(x,sp,X,Y,k2,false);houses.push({sp,X,Y,k:k2,seed:hsh(19,L,k,i,7),a:0.75});}
        if(r()<0.3){const px=bx+r()*cw;drawSprite(x,pick(Pp.t3),px-lx,l3Y(px)+6,0.7+r()*0.2,r()<0.5);}}
      else{ // lamp posts with lights strung between them, and the odd big tree
        const px=bx+cw*0.2+r()*cw*0.5,X=px-lx;
        if(r()<0.3)drawSprite(x,pick(Pp.t4),X,l4Y(px)+10,0.8+r()*0.25,r()<0.5);
        const ax=X-120,ay=l4Y(px-120)-160,bx2=X+200+r()*80,by=l4Y(px+200)-160,qx=(ax+bx2)/2,qy=Math.max(ay,by)+40;
        fairies.push([ax,ay,qx,qy,bx2,by,k]);x.lineWidth=1;x.strokeStyle=INK;x.beginPath();x.moveTo(ax,ay);x.quadraticCurveTo(qx,qy,bx2,by);x.stroke();
        for(const q of [[ax,ay],[bx2,by]])x.fillRect(q[0]-2,q[1],4,l4Y(q[0]+lx)-q[1]+8);}
    }else if(set==="moor"){
      const Y2=MOORY[1],Y3=MOORY[2],Y4=MOORY[3],foot=(sp,px,kk,fn)=>groundAt(fn,px-sp.ox*kk*0.35,px+(sp.w-sp.ox)*kk*0.75);
      // a house's spot between lo and hi: the flattest, highest ground under its whole width, near px, so no wall is buried in the slope
      const level=(sp,px,kk,fn,lo,hi)=>{let best=px,bs=1e9,top=1e9;for(let c=lo;c<=hi;c+=8)top=Math.min(top,fn(c));
        for(let c=lo;c<=hi;c+=8){let mn=1e9,mx=-1e9;for(let q=c-sp.ox*kk;q<=c+(sp.w-sp.ox)*kk;q+=6){const y=fn(q);if(y<mn)mn=y;if(y>mx)mx=y;}const sc=(mx-mn)+0.25*(mx-top)+0.01*Math.abs(c-px);if(sc<bs){bs=sc;best=c;}}
        return best;};
      if(L===1){const n=1+Math.floor(r()*2);
        for(let i=0;i<n;i++){const px=bx+r()*cw,X=px-lx,q=r();
          if(q<0.5)drawTor(x,X,groundAt(yfn,px-8,px+30)+2,r);else if(q<0.75){const sp=pick(Wd.w1),kk=0.45+r()*0.25;drawSprite(x,sp,X,groundAt(yfn,px-10,px+10)+3,kk,false);}else drawMenhir(x,X,yfn(px)+1,0.3,Math.floor(r()*3));}}
      else if(L===2){const q=r(),px=bx+cw*(0.15+r()*0.7),X=px-lx;
        if(q<0.35){const sp=S.h2[posmod(k,S.h2.length)],k2=0.9+r()*0.3,hx=level(sp,px,k2,Y2,Math.max(bx+cw*0.08,px-cw*0.35),Math.min(bx+cw*0.92,px+cw*0.35)),Y=foot(sp,hx,k2,Y2)+4;drawSprite(x,sp,hx-lx,Y,k2,false);houses.push({sp,X:hx-lx,Y,k:k2,seed:hsh(19,L,k,9),a:0.55});}
        else if(q<0.8)drawStoneCircle(x,X,0.7+r()*0.25,r,Y2,lx);
        else{const sp=pick(Wd.w2),kk=0.5+r()*0.2;drawSprite(x,sp,X,groundAt(Y2,px-14,px+14)+4,kk,false);}}
      else if(L===3){const px=bx+r()*cw*0.8,X=px-lx;
        if(r()<0.35){const sp=S.h3[posmod(k,S.h3.length)],k2=0.85+r()*0.2,h0=bx+((px-bx+cw*0.45)%cw),hx2=level(sp,h0,k2,Y3,Math.max(bx+cw*0.05,h0-cw*0.2),Math.min(bx+cw*0.95,h0+cw*0.2)),Y=foot(sp,hx2,k2,Y3)+5;drawSprite(x,sp,hx2-lx,Y,k2,false);houses.push({sp,X:hx2-lx,Y,k:k2,seed:hsh(19,L,k,9),a:0.75});}
        else if(r()<0.65){const cx2=bx+cw*(0.2+r()*0.6);drawStoneCircle(x,cx2-lx,1.05+r()*0.35,r,Y3,lx);}
        if(r()<0.6){const sp=pick(Wd.w3),kk=0.5+r()*0.25;drawSprite(x,sp,X,groundAt(Y3,px-18,px+18)+6,kk,false);}
        if(r()<0.5){const wx0=bx+r()*cw*0.5;drawFieldWall(x,wx0-lx,120+r()*160,Y3,lx,r);}
        for(let i=0;i<2;i++){const gx=bx+r()*cw;drawSprite(x,pick(Wd.wgrass),gx-lx,groundAt(Y3,gx-12,gx+12)+5,0.35+r()*0.2,false);}}
      else{const q=r(),px=bx+cw*0.15+r()*cw*0.7,X=px-lx;
        if(q<0.3){const sp=pick(Wd.w4),kk=0.6+r()*0.2;drawSprite(x,sp,X,groundAt(Y4,px-24,px+24)+10,kk,false);}
        else if(q<0.6)drawMenhir(x,X,groundAt(Y4,px-18,px+18)+6,1.9+r()*0.6,Math.floor(r()*3));
        for(let i=0;i<3;i++){const gx=bx+r()*cw;drawSprite(x,pick(Wd.wgrass),gx-lx,groundAt(Y4,gx-16,gx+16)+6,0.55+r()*0.3,false);}}
    }else{ // the wind-bent forest, with tall broken trees among the living ones; some trunks have eyes
      const tree=(sp,X,Y,kk)=>{drawSprite(x,sp,X,Y,kk,false);if(sp.eye&&r()<0.32)eyes.push({X:X+sp.eye[0]*kk,Y:Y+sp.eye[1]*kk,s:sp.eye[2]*kk,seed:hsh(23,L,k,Math.round(X+lx))});};
      if(L===1){for(let i=0;i<5;i++){const px=bx+(i+r()*0.8)*(cw/5);drawSprite(x,pick(Wd.w1),px-lx,yfn(px)+4,0.55+r()*0.35,false);}}
      else if(L===2){const n=2+Math.floor(r()*2);for(let i=0;i<n;i++){const px=bx+(i+r()*0.7)*(cw/n);tree(r()<0.3?pick(Wd.s2):pick(Wd.w2),px-lx,l2Y(px)+5,0.75+r()*0.35);}}
      else if(L===3){const n=1+(r()<0.6?1:0);for(let i=0;i<n;i++){const px=bx+(i+r()*0.7)*(cw/n);tree(r()<0.3?pick(Wd.s3):pick(Wd.w3),px-lx,l3Y(px)+6,0.8+r()*0.3);}
        if(r()<0.6){const fx=bx+r()*cw*0.6;drawFerns(x,fx-lx,fx,80+r()*80,k,l3Y);}}
      else{const px=bx+cw*0.1+r()*cw*0.6,q=r();tree(q<0.1?pick(Pp.t4):q<0.3?pick(Wd.s4):pick(Wd.w4),px-lx,l4Y(px)+10,0.8+r()*0.3);}
    }
  }
  play(ctx,s,W,t,camX,o){
    const Pp=this.pools,x=ctx,set=this.ver<5?"village":LV[o.level].set,SD=SETS[set==="village"&&this.ver>=5?"village5":set],PH=set==="village"?Pp.ph:Pp.get(set).ph;
    const st=this.pass!=="live",lv=this.pass!=="static";
    if(st){x.fillStyle=INK;
    x.beginPath();x.moveTo(-10,LH+10);for(let sx=-10;sx<=W+10;sx+=6)x.lineTo(sx,gY(sx+camX));x.lineTo(W+10,LH+10);x.closePath();x.fill();}
    const p0=Math.floor((camX-400)/P),p1=Math.floor((camX+W+400)/P),monsters=[];
    for(let p=p0;p<=p1;p++){
      const base=p*P,hv=posmod(p,3),wallTop=gY(base+930)-SD.wallH,hs=PH[hv],hX=base+1120-camX,hY=gY(base+1120)+6;
      for(const it of SD.items){
        if(it.k==="hatmaw"){if(lv&&hX>-400&&hX<W+400)monsters.push({kind:"hatmaw",X:hX+hs.perch.x,Y:hY+hs.perch.y,ph:p*1.7});continue;}
        const wx=base+it.x,X=wx-camX;
        if(X<-340||X>W+340)continue;
        const Y=gY(wx);
        switch(it.k){
          case "grave":if(st){if(this.ver>=5)drawGrave5(x,X,Y+4,1.45,it.v);else drawGrave(x,X,Y+4,1,it.v);}break;
          case "fence":if(st){drawFence(x,X,wx,it.w);}break;
          case "wall":if(st){drawWall(x,X,Y,it.w,it.h,p);}break;
          case "potion":if(lv){drawPotion(x,X,SD.potionGround?Y-SD.wallH+1:wallTop,t,o.rm);}break;
          case "house":{if(st){drawSprite(x,hs,X,hY,1,false);
            const hr=rng32(hsh(29,p));
            fillHoles(x,hs,X,hY,1,hr,{litP:0.34,win:o.win,a:0.95,bar:INK,dark:"#1a1218",crack:true});}
            if(lv&&hs.lampAt)drawWallLamp(x,X+hs.lampAt[0],hY+hs.lampAt[1],t,o.rm);
            if(SD.string){const ax=X+hs.anchor[0],ay=hY+hs.anchor[1],bx=base+POST_X-camX+2,by=gY(base+POST_X)-104,qx=(ax+bx)/2,qy=Math.max(ay,by)+34;
              if(st){x.lineWidth=1;x.strokeStyle=INK;x.beginPath();x.moveTo(ax,ay);x.quadraticCurveTo(qx,qy,bx,by);x.stroke();}if(lv){if(this.kit)drawFairyKit(x,[ax,ay,qx,qy,bx,by,p+7],t,o.level,s);else drawFairy(x,[ax,ay,qx,qy,bx,by,p+7],t,o.level);}}
            break;}
          case "thorns":if(lv){monsters.push(this.ver>=5?{kind:"crawler",X,Y:Y+3,ph:p}:{kind:"thorns",X,Y:Y+3,w:it.w,ph:p});}break;
          case "ghoul":if(lv){monsters.push({kind:this.ver>=5?"ghoul2":"ghoul",X,Y:Y+2,ph:p*2.3});}break;
          case "bat":if(lv){monsters.push({kind:this.ver>=5?"bat2":"bat",X:X+Math.sin(t*0.9+p)*30,Y:it.y+Math.sin(t*1.7+p)*16,ph:p});}break;
          case "post":if(st){if(set==="town")drawStreetLamp(x,X,Y,o.win);else drawPost(x,X,Y,true,o.win);}break;
          case "candle":if(lv){drawCandle(x,X,Y+4,t,o.rm);}break;
          case "lamp":if(st){drawStreetLamp(x,X,Y,o.win);}break;
          case "barrels":if(st){drawBarrels(x,X,Y);}break;
          case "crates":if(st){drawCrates(x,X,Y);}break;
          case "well":if(st){drawWell(x,X,Y);}break;
          case "menhir":if(st){drawMenhir(x,X,Y+2,1,it.v);}break;
          case "cairn":if(st){drawCairn(x,X,Y,1);}break;
          case "fallen":if(st){drawFallen(x,X,wx);}break;
          case "stonewall":if(st){drawStoneWall(x,X,wx,it.w,it.h,p);}break;
          case "stump":if(st){drawStumpProp(x,X,Y,1,it.v);}break;
          case "bigstump":if(st){drawBigStump(x,X,Y,it.v,p);}break;
          case "grass":if(st){drawSprite(x,Pp.get("wind").wgrass[posmod(p+Math.round(it.x/100),4)],X,Y+5,0.62,false);}break;
          case "ferns":if(st){drawFerns(x,X,wx,it.w,p);}break;
          case "shrine":if(lv){drawShrine(x,X,Y+2,t,o.rm);}break;
          case "log":if(st){drawLog(x,X,wx,it.w,it.h,p);}break;
        }
      }
    }
    if(!lv)return;
    const spk=set==="village"?"village5":set;
    if(this.ver>=5&&o.splash!=="none"&&SPLASH[spk])for(let p=p0;p<=p1;p++)SPLASH[spk].forEach((sx,i)=>{const wx=p*P+sx,X=wx-camX;if(X<-80||X>W+80)return;drawSplash(ctx,spk,o.splash,X,gY(wx)+3,t,o.rm,p*3+i,"green","intense");});
    if(!o.sample)return;
    for(const m of monsters)if(m.X>-160&&m.X<W+160)this.monster(ctx,s,m,t,o);
    const px=W*0.28;drawWanderer(ctx,px,gY(camX+px)+1,t,o.walking,o.facing,o.rm,this.ver<5?null:LV[o.level].edge);
  }
  monsterInto(c,s,m,t,o,dx,dy,H){ // a monster with its rim, glow and ember details, drawn into canvas c with its origin at (dx+130s, dy+230s)
    H=H||this;if(!H.tmp||H.tmpS!==s){H.tmp=mk(260*s,250*s);H.tmpS=s;}
    const T=H.tmp,tc=T.getContext("2d");
    tc.setTransform(1,0,0,1,0,0);tc.globalCompositeOperation="source-over";tc.clearRect(0,0,T.width,T.height);tc.setTransform(s,0,0,s,130*s,230*s);
    tc.fillStyle=INK;tc.strokeStyle=INK;tc.lineCap="round";tc.lineJoin="round";
    const det=MONSTER[m.kind](tc,t,m,o.rm);
    c.save();c.setTransform(1,0,0,1,0,0);
    const bb=MON_BOX[m.kind]||[-128,-228,128,18],sx=Math.max(0,Math.floor((130+bb[0])*s)),sy=Math.max(0,Math.floor((230+bb[1])*s)),sw=Math.min(T.width-sx,Math.ceil((bb[2]-bb[0])*s)),sh=Math.min(T.height-sy,Math.ceil((bb[3]-bb[1])*s));
    const put=()=>c.drawImage(T,sx,sy,sw,sh,dx+sx,dy+sy,sw,sh);
    if(FX){c.shadowColor=rgba(o.dcol,0.95);c.shadowBlur=2.5*s;put();   // the rim
    c.shadowColor=rgba(o.dglow,0.6);c.shadowBlur=11*s;put();}    // the glow
    else hardRim(c,rgba(o.dcol,0.95),s,put);
    c.shadowColor="transparent";c.shadowBlur=0;put();
    c.setTransform(s,0,0,s,dx+130*s,dy+230*s);det(c,o);
    c.restore();
  }
  monster(ctx,s,m,t,o){
    if(!this.kit){this.monsterInto(ctx,s,m,t,o,Math.round((m.X-130)*s),Math.round((m.Y-230)*s));return;}
    const bb=MON_BOX[m.kind]||[-128,-228,128,18],G=18,id=m.id||(m.kind+"|"+m.ph),r=POSE_RATE[m.kind];
    const step=(r&&!o.rm)?Math.floor((r*t+m.ph)*8):-KIT.frame;
    let E=this.poses.get(id);
    if(!E){E={cv:mk((bb[2]-bb[0]+2*G)*s,(bb[3]-bb[1]+2*G)*s),step:null};this.poses.set(id,E);}
    if(E.step!==step){const c=E.cv.getContext("2d");c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,E.cv.width,E.cv.height);
      this.monsterInto(c,s,m,t,o,Math.round((G-130-bb[0])*s),Math.round((G-230-bb[1])*s));E.step=step;KIT.poses++;}
    E.used=KIT.frame;
    ctx.drawImage(E.cv,Math.round((m.X+bb[0]-G)*s)/s,Math.round((m.Y+bb[1]-G)*s)/s,E.cv.width/s,E.cv.height/s);
  }
  fore(ctx,s,W,t,lx,o){
    const Pp=this.pools,cw=900,k0=Math.floor((lx-200)/cw),k1=Math.floor((lx+W+200)/cw),set=this.ver<5?"village":LV[o.level].set;
    if(set==="moor"||set==="forest"){const Wd=Pp.get("wind"),moor=set==="moor";
      for(let k=k0;k<=k1;k++){const r=rng32(hsh(37,k,set.length));
        for(let i=0;i<5;i++){const X=k*cw+i*180+r()*80-lx;this.fs(ctx,'g',moor?Wd.heather[Math.floor(r()*4)]:Wd.fern[Math.floor(r()*3)],X,LH+4,0.9+r()*0.5,r()<0.5);}
        if(moor)for(let i=0;i<2;i++){const X=k*cw+i*450+r()*300-lx;this.fs(ctx,'g',Wd.wgrass[Math.floor(r()*4)],X,LH+8,0.9+r()*0.4,false);}
        if(!moor&&r()<0.5){const X=k*cw+r()*cw-lx;this.fs(ctx,'t',Wd.fo[Math.floor(r()*2)],X,-6,0.9,false);}}
      return;}
    for(let k=k0;k<=k1;k++){
      const r=rng32(hsh(37,k));
      for(let i=0;i<5;i++){const X=k*cw+i*180+r()*80-lx;this.fs(ctx,'g',Pp.tuft[Math.floor(r()*4)],X,LH+4,0.9+r()*0.5,false);}
      if(r()<0.4){const X=k*cw+r()*cw-lx,j=Math.floor(r()*2);this.fs(ctx,'t',Pp.fgb[j],X,-6,0.9,r()<0.5);}
    }
  }
}

/* ============================== the kit way: draw once, slide every frame ==============================
   The mock-up rebuilds every backdrop layer, shape by shape, on every frame. The kit way draws each layer once,
   in tiles as the camera reaches them, and then only slides the tiles. Things that move are drawn fresh over the
   top: lights that twinkle, eyes that blink, flames, splashes, monsters and the wanderer. A puppet monster changes
   pose only in steps (8 a second at its own pace), so each pose is painted once and reused until the next step. */
const TWP=1024,TMP=840;                    // a tile's width, and the margin drawn round it so glows and wide shapes join up (device pixels)
const POSE_RATE={crawler:1.3,bat2:1.6,ghoul2:1,walker:0.6}; // the pace of each puppet monster's steps (see pz)
const KIT={frame:0,built:false,builds:0,buildMs:0,poses:0,bytes:0};
let FX=true;                               // the Effects setting: glow round lights, eyes and splashes
const BOSS_HZ=20;                          // a boss is repainted 20 times a second: its slow glows and the witch's fire still move smoothly
const FLY_BOX={bat:[-22,-16,22,12],crow:[-20,-14,14,11]},FLY_REF=1.2;
function drawFlyerKit(x,kind,X,Y,k,ph,col){ // bats and crows: each wing position painted once, 17 positions from up to down
  const s=KIT.fly,q=Math.round((Math.sin(ph)+1)*8),key=kind+col+q,bb=FLY_BOX[kind];
  if(!KIT.fc||KIT.fcS!==s){KIT.fc=new Map();KIT.fcS=s;}
  let cv=KIT.fc.get(key);
  if(!cv){const R=FLY_REF*s;cv=mk((bb[2]-bb[0])*R,(bb[3]-bb[1])*R);const c=cv.getContext("2d");c.setTransform(R,0,0,R,-bb[0]*R,-bb[1]*R);
    KIT.fly=null;(kind==="bat"?drawBat:drawCrow)(c,0,0,1,Math.asin(q/8-1),col);KIT.fly=s;KIT.fc.set(key,cv);}
  x.drawImage(cv,X+bb[0]*k,Y+bb[1]*k,(bb[2]-bb[0])*k,(bb[3]-bb[1])*k);
}
function fairySprite(lv,s){ // one light on a string, with its glow, painted once (the glow is in screen pixels, as in the mock-up)
  const key=lv+"@"+s+"@"+FX;if(KIT.fs&&KIT.fs.key===key)return KIT.fs;
  const h=Math.ceil(1.8*s+15),cv=mk(2*h,2*h),c=cv.getContext("2d");
  c.setTransform(s,0,0,s,h,h);c.fillStyle=lv==="storm"?"rgb(255,201,168)":"rgb(255,241,200)";c.shadowColor="#ffd27a";c.shadowBlur=FX?8:0;
  c.beginPath();c.arc(0,0,1.8,0,Math.PI*2);c.fill();
  return KIT.fs={key,cv,h};
}
function drawFairyKit(x,fl,t,lv,s){ // as drawFairy, but each light is the painted sprite, faded by its twinkle
  const sp=fairySprite(lv,s),hw=sp.h/s,ax=fl[0],ay=fl[1],qx=fl[2],qy=fl[3],bx=fl[4],by=fl[5],seed=fl[6],n=10;
  for(let i=1;i<n;i++){const u=i/n,v=1-u,px=v*v*ax+2*v*u*qx+u*u*bx,py=v*v*ay+2*v*u*qy+u*u*by;
    x.globalAlpha=0.7+0.3*Math.sin(t*1.1+i*1.7+seed);x.drawImage(sp.cv,px-hw,py-hw,2*hw,2*hw);}
  x.globalAlpha=1;
}
Object.assign(Scene.prototype,{
  kitReset(key){this.kitKey=key;this.tiles={};this.poses=new Map();this.sky=null;this.vig=null;this.scr=null;this.bossC=null;},
  scratch(s){ // two working canvases, a tile plus its margins wide
    const w=TWP+2*TMP,h=Math.ceil(LH*s);
    if(!this.scr||this.scr.w!==w||this.scr.h!==h)this.scr={w,h,a:mk(w,h),b:mk(w,h)};
    return this.scr;
  },
  tileStart(sc,s){const b=sc.b.getContext("2d");b.setTransform(1,0,0,1,0,0);b.globalCompositeOperation="source-over";b.globalAlpha=1;b.shadowBlur=0;b.shadowColor="transparent";b.clearRect(0,0,sc.w,sc.h);b.setTransform(s,0,0,s,0,0);return b;},
  tileFinish(sc,i,t0,extra){ // keep the middle of the working canvas: that's the tile
    const cv=mk(TWP,sc.h);cv.getContext("2d").drawImage(sc.b,TMP,0,TWP,sc.h,0,0,TWP,sc.h);
    KIT.builds++;KIT.buildMs+=performance.now()-t0;KIT.built=true;
    return Object.assign({cv,i,bytes:TWP*sc.h*4,fairies:[],eyes:[]},extra||{});
  },
  buildLayerTile(L,i,s,t,tint,o){
    const t0=performance.now(),sc=this.scratch(s),TW=TWP/s,TM=TMP/s,Ws=TW+2*TM,lx=i*TW-TM,b=this.tileStart(sc,s);
    this.collect={fairies:[],eyes:[]};
    this.layer(b,sc.a,s,Ws,t,lx,L,tint,o);
    const col=this.collect;this.collect=null;
    const x0=i*TW,x1=x0+TW; // the lights and eyes this tile owns, kept in world positions
    const fairies=col.fairies.map(f=>[f[0]+lx,f[1],f[2]+lx,f[3],f[4]+lx,f[5],f[6]]).filter(f=>f[0]>=x0&&f[0]<x1);
    const eyes=col.eyes.map(e=>Object.assign({},e,{X:e.X+lx})).filter(e=>e.X>=x0&&e.X<x1);
    return this.tileFinish(sc,i,t0,{fairies,eyes});
  },
  buildPlayTile(i,s,t,o){
    const t0=performance.now(),sc=this.scratch(s),TW=TWP/s,TM=TMP/s,b=this.tileStart(sc,s);
    this.pass="static";this.play(b,s,TW+2*TM,t,i*TW-TM,o);this.pass=null;
    return this.tileFinish(sc,i,t0);
  },
  fs(ctx,kind,sp,X,Y,k,flip){if(!this.forePass||this.forePass===kind)drawSprite(ctx,sp,X,Y,k,flip);}, // a front-layer sprite: 'g' ground plants, 't' branches from the top
  buildForeTile(i,s,t,o,kind){
    const t0=performance.now(),sc=this.scratch(s),TW=TWP/s,TM=TMP/s,b=this.tileStart(sc,s);
    this.forePass=kind;this.fore(b,s,TW+2*TM,t,i*TW-TM,o);this.forePass=null;
    return this.tileFinish(sc,i,t0);
  },
  kitTiles(key,lx,W,s,build){ // the tiles on screen, built if missing; one more is built ahead when the frame has room
    const st=this.tiles[key]||(this.tiles[key]=new Map()),TW=TWP/s,i0=Math.floor(lx/TW),i1=Math.floor((lx+W)/TW),out=[];
    for(let i=i0;i<=i1;i++){let tl=st.get(i);if(!tl){tl=build(i);st.set(i,tl);}out.push(tl);}
    if(!KIT.built&&!st.has(i1+1))st.set(i1+1,build(i1+1));
    for(const k of st.keys())if(k<i0-1||k>i1+1)st.delete(k);
    return out;
  },
  drawTiles(ctx,tiles,lx,s,dy){
    ctx.setTransform(1,0,0,1,0,dy);
    for(const tl of tiles)ctx.drawImage(tl.cv,Math.round(tl.i*TWP-lx*s),0);
  },
  kitLayer(ctx,s,W,t,lx,L,tint,o,dy){
    const tiles=this.kitTiles("L"+L,lx,W,s,i=>this.buildLayerTile(L,i,s,t,tint,o));
    this.drawTiles(ctx,tiles,lx,s,dy);
    ctx.setTransform(s,0,0,s,0,dy);
    for(const tl of tiles){
      for(const f of tl.fairies)drawFairyKit(ctx,[f[0]-lx,f[1],f[2]-lx,f[3],f[4]-lx,f[5],f[6]],t,o.level,s);
      if(tl.eyes.length)drawTreeEyes(ctx,tl.eyes.map(e=>Object.assign({},e,{X:e.X-lx})),t,L,o.rm);
    }
  },
  bossAt(ctx,s,lv,t,o,bx,by){
    if(!this.kit){bossInto(ctx,s,lv,t,o,Math.round((bx-230)*s),Math.round((by-300)*s)+(this.dyS||0));return;}
    const step=o.rm?-KIT.frame:Math.floor(t*BOSS_HZ);let E=this.bossC;
    if(!E||E.lv!==lv||E.s!==s)E=this.bossC={cv:mk(460*s,330*s),lv,s,step:null};
    if(E.step!==step){const c=E.cv.getContext("2d");c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,E.cv.width,E.cv.height);bossInto(c,s,lv,t,o,0,0);E.step=step;}
    ctx.drawImage(E.cv,Math.round((bx-230)*s)/s,Math.round((by-300)*s)/s,E.cv.width/s,E.cv.height/s);
  },
  kitBegin(ctx,s,W,t,camX,camY,o){ // everything behind the wanderer and the monsters
    const lv=o.level,rm=o.rm,L=LV[lv],tn=L.tints,W2=W*2,key=lv+"@"+s.toFixed(4)+"@"+Math.round(W*s)+"@"+FX;
    KIT.frame++;KIT.built=false;this.kit=true;
    this.ensure(W,s,lv);
    if(this.kitKey!==key)this.kitReset(key);
    // off(k, p): the camera's rise at rate k, and the place's lift at the full parallax p (as Scene.render), whatever Reduce motion does to k
    const up=p=>(L.lift||0)*(1-p),off=(k,p)=>Math.round((camY*k-up(p==null?k:p))*s),at=(k,p)=>ctx.setTransform(s,0,0,s,0,off(k,p)),f=k=>rm?k*0.4:k;
    if(!this.sky){ // the sky and its light: drawn once
      this.sky=mk(Math.ceil(W*s),Math.ceil(LH*s));const c=this.sky.getContext("2d");c.setTransform(s,0,0,s,0,0);
      const sk=SKY[lv],g=c.createLinearGradient(0,0,0,470);g.addColorStop(0,sk[0]);g.addColorStop(0.45,sk[1]);g.addColorStop(0.8,sk[2]);g.addColorStop(1,sk[3]);
      c.fillStyle=g;c.fillRect(0,0,W,LH);
      if(L.light==="moon")drawMoon(c,W,lv,this.cache.moon);
      else if(L.light==="setmoon"){drawStars(c,W);drawDaybreak(c,W);drawSetMoon(c,W,this.cache.moon);}
      else drawSun(c,W);
    }
    if(!this.vig){ // the dark edges: drawn once
      this.vig=mk(Math.ceil(W*s),Math.ceil(LH*s));const c=this.vig.getContext("2d");c.setTransform(s,0,0,s,0,0);
      const vg=c.createRadialGradient(W/2,LH*0.45,LH*0.35,W/2,LH*0.5,W*0.72);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,"+L.vig+")");c.fillStyle=vg;c.fillRect(0,0,W,LH);
    }
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.drawImage(this.sky,0,off(0));
    const mb=after=>{if(!L.mist)return;L.mist.bands.forEach((b,i)=>{if(b[0]!==after)return;const cv=this.cache.mist[i],k=[0.03,0.12,0.28,0.5][after]*(rm?0.4:1),ox=posmod(t*b[3]*(rm?0.4:1)+camX*k,W2);
      at(k,[0.03,0.12,0.28,0.5][after]);ctx.save();ctx.globalAlpha=b[2];ctx.drawImage(cv,-ox,b[1]-100,W2,200);ctx.drawImage(cv,-ox+W2,b[1]-100,W2,200);ctx.restore();});};
    if(this.cache.cl0)for(const d of [0,1]){const cv=this.cache["cl"+d],sp=(d?11:5)*(rm?0.4:1),k=d?0.06:0.03,ox=posmod(t*sp+camX*k,W2);at(k);ctx.drawImage(cv,-ox,0,W2,LH);ctx.drawImage(cv,-ox+W2,0,W2,LH);}
    at(0);
    if(lv==="storm"){
      const st=lightning(t);
      if(st.bolt>0)drawBolt(ctx,W,st);
      if(st.swell>0){ctx.save();ctx.globalCompositeOperation="screen";ctx.fillStyle=rgba("#ffb39a",0.32*st.swell);ctx.fillRect(0,0,W,440);ctx.restore();}
    }
    mb(0);
    if(L.light==="sun"){at(f(0.05),0.05);drawFarRanges(ctx,W,camX,rm,lv);}
    this.kitLayer(ctx,s,W,t,camX*f(0.12),1,tn[0],o,off(f(0.12),0.12));mb(1);
    if(lv==="storm"){at(0,1);drawRain(ctx,W,t,0,rm);}   // the rain stays put
    this.kitLayer(ctx,s,W,t,camX*f(0.28),2,tn[1],o,off(f(0.28),0.28));mb(2);
    if(L.light==="sun"){at(0);drawRays(ctx,W,t,rm);}
    at(f(0.34),0.34);KIT.fly=s;
    if(L.fly==="bats")drawSwarm(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9));
    else drawCrows(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9),L.fly==="crows"?7:3,false);
    KIT.fly=null;this.kitLayer(ctx,s,W,t,camX*f(0.5),3,tn[2],o,off(f(0.5),0.5));mb(3);KIT.fly=s;
    at(f(0.62),0.62);
    if(L.fly==="bats")drawBigBats(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.7));
    else if(L.fly==="crows")drawCrows(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.7),0,true);
    KIT.fly=null;
    this.kitLayer(ctx,s,W,t,camX*f(0.76),4,tn[3],o,off(f(0.76),0.76));
    // the path: its still parts from tiles, then everything that moves on it
    this.drawTiles(ctx,this.kitTiles("play",camX,W,s,i=>this.buildPlayTile(i,s,t,o)),camX,s,off(1));
    at(1);this.dyS=off(1);this.pass="live";this.play(ctx,s,W,t,camX,o);this.pass=null;this.dyS=0;
  },
  kitEnd(ctx,s,W,t,camX,camY,o){ // everything in front of them
    const lv=o.level,rm=o.rm,off=k=>Math.round(camY*k*s),at=k=>ctx.setTransform(s,0,0,s,0,off(k));
    if(lv==="storm"){at(0);drawRain(ctx,W,t,1,rm);}
    const fk=rm?1.08:1.35;
    this.drawTiles(ctx,this.kitTiles("fore",camX*fk,W,s,i=>this.buildForeTile(i,s,t,o,"g")),camX*fk,s,off(fk));
    this.drawTiles(ctx,this.kitTiles("foreTop",camX*fk,W,s,i=>this.buildForeTile(i,s,t,o,"t")),camX*fk,s,0); // branches stay hung from the top edge
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.vig,0,0);
    // tidy: forget poses not used for a while; count the memory the tiles hold
    if(this.poses.size>60)for(const [k,E] of this.poses)if(E.used<KIT.frame-120)this.poses.delete(k);
    let by=0;for(const k in this.tiles)for(const tl of this.tiles[k].values())by+=tl.bytes;KIT.bytes=by;
  }
});
function hardRim(c,col,s,put){ // Effects off: a cut-out's rim as a thin hard line, its silhouette stamped round itself in the rim's colour
  const r=Math.max(1,1.2*s);c.shadowColor=col;c.shadowBlur=0;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.shadowOffsetX=Math.cos(a)*r;c.shadowOffsetY=Math.sin(a)*r;put();}
  c.shadowOffsetX=0;c.shadowOffsetY=0;c.shadowColor="transparent";
}

/* ============================== sky ============================== */
function moonSprite(sc,storm){ // the detailed moon: seas, craters, rays, grain, a darker edge
  const R=MOON.r,RR=R+3,S=Math.ceil(RR*2*sc),c=mk(S,S),x=c.getContext("2d");
  x.setTransform(sc,0,0,sc,RR*sc,RR*sc);
  const hi=storm?"#f6c2a0":"#fff2cf",base=storm?"#e8a07c":"#ffe2a6",edge=storm?"#b9644a":"#dcae74",deep=storm?"#9c4a36":"#c99460";
  let g=x.createRadialGradient(-R*0.3,-R*0.3,R*0.05,0,0,R);g.addColorStop(0,hi);g.addColorStop(0.65,base);g.addColorStop(1,edge);
  x.fillStyle=g;x.beginPath();x.arc(0,0,R,0,Math.PI*2);x.fill();
  x.save();x.beginPath();x.arc(0,0,R,0,Math.PI*2);x.clip();
  const r=rng32(777);
  for(let i=0;i<8;i++){const cx=(r()-0.5)*R*1.4,cy=(r()-0.5)*R*1.3,rr=R*(0.14+r()*0.26),n=16;x.fillStyle=rgba(deep,0.3+r()*0.16);x.beginPath();
    for(let k=0;k<n;k++){const a=k/n*Math.PI*2,q=rr*(0.7+r()*0.5),px=cx+Math.cos(a)*q,py=cy+Math.sin(a)*q*0.85;k?x.lineTo(px,py):x.moveTo(px,py);}x.closePath();x.fill();}
  for(let i=0;i<16;i++){const cr=R*(i<3?0.07+r()*0.06:0.02+r()*0.045),a=r()*Math.PI*2,d=Math.sqrt(r())*R*0.85,cx=Math.cos(a)*d,cy=Math.sin(a)*d;
    x.fillStyle=rgba(deep,0.4);x.beginPath();x.ellipse(cx,cy,cr,cr*0.88,0,0,Math.PI*2);x.fill();
    x.fillStyle=rgba(deep,0.35);x.beginPath();x.ellipse(cx-cr*0.25,cy-cr*0.25,cr*0.62,cr*0.55,0,0,Math.PI*2);x.fill();
    x.strokeStyle=rgba(hi,0.7);x.lineWidth=Math.max(0.6,cr*0.22);x.beginPath();x.ellipse(cx,cy,cr,cr*0.88,0,Math.PI*0.05,Math.PI*0.95);x.stroke();}
  const bx=R*0.28,by=R*0.42;x.strokeStyle=rgba(hi,0.28);x.lineWidth=1;
  for(let k=0;k<11;k++){const a=k/11*Math.PI*2+r()*0.3,l=R*(0.25+r()*0.4);x.beginPath();x.moveTo(bx,by);x.lineTo(bx+Math.cos(a)*l,by+Math.sin(a)*l);x.stroke();}
  x.fillStyle=hi;x.beginPath();x.arc(bx,by,R*0.045,0,Math.PI*2);x.fill();
  for(let i=0;i<340;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*R,s2=0.4+r()*0.9;x.fillStyle=r()<0.5?rgba(deep,0.12+r()*0.1):rgba(hi,0.1+r()*0.1);x.fillRect(Math.cos(a)*d,Math.sin(a)*d,s2,s2);}
  g=x.createRadialGradient(0,0,R*0.6,0,0,R);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,rgba(deep,0.35));x.fillStyle=g;x.fillRect(-R,-R,R*2,R*2);
  x.restore();
  return{c,R:RR};
}
/* round 4's moon: round 3's seas, same shapes and shades, painted as one layer.
   Where two seas meet, the darker shade wins instead of the two adding up, so overlaps never go darker. */
const MOONPAL={night:["#fff2cf","#ffe2a6","#dcae74","#c99460"],storm:["#f6c2a0","#e8a07c","#b9644a","#9c4a36"],dawn:["#f5f8fc","#dde6f0","#aebcd0","#8e9db5"]};
function moonSprite4(sc,lv){
  const R=MOON.r,RR=R+3,S=Math.ceil(RR*2*sc),c=mk(S,S),x=c.getContext("2d");
  x.setTransform(sc,0,0,sc,RR*sc,RR*sc);
  const P=MOONPAL[lv]||MOONPAL.night,hi=P[0],base=P[1],edge=P[2],deep=P[3];
  let g=x.createRadialGradient(-R*0.3,-R*0.3,R*0.05,0,0,R);g.addColorStop(0,hi);g.addColorStop(0.65,base);g.addColorStop(1,edge);
  x.fillStyle=g;x.beginPath();x.arc(0,0,R,0,Math.PI*2);x.fill();
  // the shade map: grey levels combined with "lighten", which keeps the larger value where shapes meet
  const m=mk(S,S),mx=m.getContext("2d");mx.fillStyle="#000";mx.fillRect(0,0,S,S);
  mx.setTransform(sc,0,0,sc,RR*sc,RR*sc);mx.globalCompositeOperation="lighten";
  const grey=d=>{const v=Math.round(clamp(d,0,1)*255);return"rgb("+v+","+v+","+v+")";};
  const r=rng32(777); // the same seed as round 3, so the seas and craters keep their places
  for(let i=0;i<8;i++){const cx=(r()-0.5)*R*1.4,cy=(r()-0.5)*R*1.3,rr=R*(0.14+r()*0.26),n=16;mx.fillStyle=grey(0.3+r()*0.16);mx.beginPath();
    for(let k=0;k<n;k++){const a=k/n*Math.PI*2,q=rr*(0.7+r()*0.5),px=cx+Math.cos(a)*q,py=cy+Math.sin(a)*q*0.85;k?mx.lineTo(px,py):mx.moveTo(px,py);}mx.closePath();mx.fill();}
  const craters=[];
  for(let i=0;i<16;i++){const cr=R*(i<3?0.07+r()*0.06:0.02+r()*0.045),a=r()*Math.PI*2,dd=Math.sqrt(r())*R*0.85;craters.push([Math.cos(a)*dd,Math.sin(a)*dd,cr]);}
  mx.fillStyle=grey(0.4);for(const k of craters){mx.beginPath();mx.ellipse(k[0],k[1],k[2],k[2]*0.88,0,0,Math.PI*2);mx.fill();} // crater floors join the same layer
  const id=mx.getImageData(0,0,S,S),px=id.data,dc=hx(deep);
  for(let i=0;i<px.length;i+=4){const a=px[i];px[i]=dc[0];px[i+1]=dc[1];px[i+2]=dc[2];px[i+3]=a;}
  mx.setTransform(1,0,0,1,0,0);mx.globalCompositeOperation="source-over";mx.clearRect(0,0,S,S);mx.putImageData(id,0,0);
  x.save();x.beginPath();x.arc(0,0,R,0,Math.PI*2);x.clip();
  x.save();x.setTransform(1,0,0,1,0,0);x.drawImage(m,0,0);x.restore();
  for(const k of craters){const cx=k[0],cy=k[1],cr=k[2]; // a shadowed inner wall and a lit rim
    x.fillStyle=rgba(deep,0.32);x.beginPath();x.arc(cx,cy,cr,Math.PI*0.95,Math.PI*1.95);x.arc(cx+cr*0.2,cy+cr*0.25,cr*0.8,Math.PI*1.95,Math.PI*0.95,true);x.closePath();x.fill();
    x.strokeStyle=rgba(hi,0.7);x.lineWidth=Math.max(0.6,cr*0.22);x.beginPath();x.ellipse(cx,cy,cr,cr*0.88,0,Math.PI*0.05,Math.PI*0.95);x.stroke();}
  const bx=R*0.28,by=R*0.42;x.strokeStyle=rgba(hi,0.28);x.lineWidth=1;
  for(let k=0;k<11;k++){const a=k/11*Math.PI*2+r()*0.3,l=R*(0.25+r()*0.4);x.beginPath();x.moveTo(bx,by);x.lineTo(bx+Math.cos(a)*l,by+Math.sin(a)*l);x.stroke();}
  x.fillStyle=hi;x.beginPath();x.arc(bx,by,R*0.045,0,Math.PI*2);x.fill();
  for(let i=0;i<340;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*R,s2=0.4+r()*0.9;x.fillStyle=r()<0.5?rgba(deep,0.12+r()*0.1):rgba(hi,0.1+r()*0.1);x.fillRect(Math.cos(a)*d,Math.sin(a)*d,s2,s2);}
  g=x.createRadialGradient(0,0,R*0.6,0,0,R);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,rgba(deep,0.35));x.fillStyle=g;x.fillRect(-R,-R,R*2,R*2);
  x.restore();
  return{c,R:RR};
}
function drawMoon(x,W,lv,spr){
  const m=MOON,cx=W*m.x,cy=LH*m.y;
  const g=x.createRadialGradient(cx,cy,m.r*0.6,cx,cy,m.r*3.4);g.addColorStop(0,rgba(m.halo,lv==="storm"?0.32:0.55));g.addColorStop(1,rgba(m.halo,0));
  x.fillStyle=g;x.fillRect(cx-m.r*3.4,cy-m.r*3.4,m.r*6.8,m.r*6.8);
  if(spr){
    const hr=x.createRadialGradient(cx,cy,m.r*1.25,cx,cy,m.r*1.75);hr.addColorStop(0,rgba("#ffd9a0",0));hr.addColorStop(0.5,rgba("#ffd9a0",lv==="storm"?0.06:0.12));hr.addColorStop(1,rgba("#ffd9a0",0));
    x.fillStyle=hr;x.beginPath();x.arc(cx,cy,m.r*1.75,0,Math.PI*2);x.fill();   // a soft lunar halo
    x.drawImage(spr.c,cx-spr.R,cy-spr.R,spr.R*2,spr.R*2);
  }else{ // round 2's moon
    x.fillStyle=lv==="storm"?"#e6a07a":m.col;x.beginPath();x.arc(cx,cy,m.r,0,Math.PI*2);x.fill();
    x.fillStyle=rgba("#d98f5a",0.25);x.beginPath();x.arc(cx-m.r*0.25,cy+m.r*0.15,m.r*0.3,0,Math.PI*2);x.arc(cx+m.r*0.35,cy-m.r*0.3,m.r*0.18,0,Math.PI*2);x.fill();
  }
}
/* dawn: the last stars in the west, daybreak glowing in the east, the moon setting behind the moor */
function drawStars(ctx,W){
  const r=rng32(321);
  for(let i=0;i<70;i++){const x=r()*W,y=r()*250,sz=0.6+r()*1.1,a=0.8*Math.pow(x/W,1.6)*(1-y/270);if(a<0.04)continue;ctx.fillStyle="rgba(235,242,255,"+a.toFixed(3)+")";ctx.fillRect(x,y,sz,sz);}
}
function drawDaybreak(ctx,W){
  const cx=W*0.06,cy=392;
  let g=ctx.createRadialGradient(cx,cy,10,cx,cy,W*0.62);g.addColorStop(0,"rgba(255,208,160,0.8)");g.addColorStop(0.3,"rgba(246,170,146,0.36)");g.addColorStop(1,"rgba(240,160,140,0)");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,LH);
  ctx.save();ctx.translate(W*0.12,338);ctx.scale(4.2,1);
  g=ctx.createRadialGradient(0,0,0,0,0,70);g.addColorStop(0,"rgba(255,230,186,0.6)");g.addColorStop(1,"rgba(255,230,186,0)");
  ctx.fillStyle=g;ctx.fillRect(-70,-70,140,140);ctx.restore();
}
function drawSetMoon(ctx,W,spr){
  const cx=W*0.8,cy=LH*0.58,R=spr.R;
  const g=ctx.createRadialGradient(cx,cy,R*0.9,cx,cy,R*2.6);g.addColorStop(0,"rgba(214,228,248,0.3)");g.addColorStop(1,"rgba(214,228,248,0)");
  ctx.fillStyle=g;ctx.fillRect(cx-R*2.6,cy-R*2.6,R*5.2,R*5.2);
  ctx.drawImage(spr.c,cx-R,cy-R,R*2,R*2);
}
/* mist: the sun a pale disc, banks of mist between the layers, faint shafts of light */
const SUN={x:0.42,y:104,r:30};
function drawSun(ctx,W){
  const cx=W*SUN.x,cy=SUN.y,r=SUN.r;
  const g=ctx.createRadialGradient(cx,cy,r*0.6,cx,cy,r*8);g.addColorStop(0,"rgba(250,247,224,0.45)");g.addColorStop(0.3,"rgba(240,242,212,0.18)");g.addColorStop(1,"rgba(240,242,212,0)");
  ctx.fillStyle=g;ctx.fillRect(cx-r*8,cy-r*8,r*16,r*16);
  ctx.fillStyle="rgba(252,250,234,0.5)";ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
}
function drawFarRanges(ctx,W,camX,rm,lv){ // faint mountains and hills showing through the mist, below the sun
  const M=LV[lv].mist.col,air=AIR[lv],k=rm?0.4:1;
  const tri=u=>1-Math.abs(posmod(u,1)*2-1); // sharp peaks
  const R=[[0.03,0.77,x=>300-(52*Math.pow(tri(x*0.0012+0.2),1.3)+24*tri(x*0.0031+0.7)+5*Math.sin(x*0.019+0.8)),232,330,0.5],
           [0.07,0.74,x=>346+16*Math.sin(x*0.0031+2)+9*Math.sin(x*0.0083+0.6)+3*Math.sin(x*0.021),318,384,0.45]];
  for(const q of R){
    const lx=camX*q[0]*k,fn=q[2];
    ctx.fillStyle=mixc(INK,air,q[1]);ctx.beginPath();ctx.moveTo(-10,LH);for(let sx=-10;sx<=W+10;sx+=5)ctx.lineTo(sx,fn(sx+lx));ctx.lineTo(W+10,LH);ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(HAZE[lv],0.2);ctx.lineWidth=1.2;ctx.beginPath();for(let sx=-10;sx<=W+10;sx+=5){const y=fn(sx+lx);sx<=-10?ctx.moveTo(sx,y):ctx.lineTo(sx,y);}ctx.stroke();
    const g=ctx.createLinearGradient(0,q[3],0,q[4]);g.addColorStop(0,rgba(M,0));g.addColorStop(1,rgba(M,q[5]));ctx.fillStyle=g;ctx.fillRect(0,q[3],W,q[4]-q[3]);
    ctx.fillStyle=rgba(M,q[5]);ctx.fillRect(0,q[4],W,LH-q[4]); // their feet lost in the mist
  }
}
function drawRays(ctx,W,t,rm){
  const cx=W*SUN.x,cy=SUN.y,sw=rm?0:Math.sin(t*0.07)*0.03;
  const RAYS=[[-0.5,0.05,0.07],[-0.22,0.025,0.05],[0.04,0.06,0.08],[0.3,0.03,0.05],[0.47,0.045,0.06]];
  for(const q of RAYS){
    const a=q[0]+sw,L=560,hw=q[1];
    const g=ctx.createLinearGradient(cx,cy,cx+Math.sin(a)*L,cy+Math.cos(a)*L);g.addColorStop(0,"rgba(250,248,226,"+q[2]+")");g.addColorStop(1,"rgba(250,248,226,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.sin(a-hw)*L,cy+Math.cos(a-hw)*L);ctx.lineTo(cx+Math.sin(a+hw)*L,cy+Math.cos(a+hw)*L);ctx.closePath();ctx.fill();
  }
}
function renderMist(W2,s,col,seed){ // a long band of soft mist, drawn once and slid sideways
  const H=200,c=mk(W2*s,H*s),x=c.getContext("2d");x.setTransform(s,0,0,s,0,0);
  const r=rng32(seed),n=Math.round(W2/38);
  for(let i=0;i<n;i++){
    const cx=r()*W2,cy=H/2+(r()-0.5)*H*0.35,rx=70+r()*170,ry=18+r()*30,a=0.25+r()*0.3;
    for(const ox of [-W2,0,W2]){if(cx+ox+rx<0||cx+ox-rx>W2)continue;
      x.save();x.translate(cx+ox,cy);x.scale(rx/ry,1);const g=x.createRadialGradient(0,0,0,0,0,ry);g.addColorStop(0,rgba(col,a));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(-ry,-ry,ry*2,ry*2);x.restore();}
  }
  return c;
}
/* crows: dawn and mist have crows instead of bats */
function drawCrow(x,X,Y,k,ph,col){if(KIT.fly)return drawFlyerKit(x,'crow',X,Y,k,ph,col);
  const fl=Math.sin(ph);x.save();x.translate(X,Y);x.scale(k,k);x.fillStyle=col;
  x.beginPath();
  x.moveTo(-1,0);x.quadraticCurveTo(-8,-4-fl*7,-18,-1-fl*10);x.lineTo(-15,0.5-fl*5);x.lineTo(-17,2.5-fl*4);x.lineTo(-13,2-fl*2.5);x.quadraticCurveTo(-7,2.5,-1,3);
  x.moveTo(1,0);x.quadraticCurveTo(8,-4-fl*7,18,-1-fl*10);x.lineTo(15,0.5-fl*5);x.lineTo(17,2.5-fl*4);x.lineTo(13,2-fl*2.5);x.quadraticCurveTo(7,2.5,1,3);
  x.fill();
  x.beginPath();x.ellipse(0,1.5,6.5,2.6,0,0,Math.PI*2);x.fill();
  x.beginPath();x.arc(6.5,0.4,2.3,0,Math.PI*2);x.fill();
  x.beginPath();x.moveTo(8.2,-0.4);x.lineTo(12,0.9);x.lineTo(8.2,1.9);x.closePath();x.fill();
  x.beginPath();x.moveTo(-5,0.8);x.lineTo(-11.5,-0.8);x.lineTo(-11,4.2);x.closePath();x.fill();
  x.restore();
}
function drawCrows(x,W,t,lx,rm,col,n,big){
  const span=W+760;
  if(big){for(let i=0;i<3;i++){const v=(rm?20:52)+i*12,X=-220+posmod(t*v+i*span*0.41-lx,span),Y=118+i*54+Math.sin(t*0.6+i*1.9)*12;drawCrow(x,X,Y,0.95+i*0.12,t*(rm?2.6:5.5)+i,col);}return;}
  const v=rm?14:34,cx=-360+posmod(t*v-lx,span),cy=176+Math.sin(t*0.3)*14;
  for(let i=0;i<n;i++){const a=hsh(9,i),ox=((a&1023)/1023-0.5)*230,oy=(((a>>>10)&1023)/1023-0.5)*80,k=0.36+((a>>>20)&255)/255*0.2;
    drawCrow(x,cx+ox,cy+oy+Math.sin(t*(rm?0.5:1.1)+i)*(rm?1.5:4),k,t*(rm?3:7)+i*0.9,col);}
}
/* clouds: cut-out card, long, lopsided and torn, with a lit rim and a lighter inner layer */
const CLOUD_PAL={
  night:[{rim:"#f0cb94",body:"#4a2752",lobe:"#5a3360",lobeRim:"#e6b884",under:"#a8583e"},
         {rim:"#e3b37e",body:"#2e1838",lobe:"#3b2045",lobeRim:"#d9a574",under:"#96503a"}],
  storm:[{rim:"#5a1c1c",body:"#2a0d10",lobe:"#350f13",lobeRim:"#5a1c1c",under:"#8a2b22"},
         {rim:"#4a1416",body:"#1a0709",lobe:"#26090c",lobeRim:"#4a1416",under:"#a33a26"}],
  dawn:[{rim:"#8ea3c4",body:"#34476e",lobe:"#3f537a",lobeRim:"#9cb0cd",under:"#f2b9a2"},
        {rim:"#7d92b5",body:"#2b3d62",lobe:"#35486e",lobeRim:"#8ea3c4",under:"#e8a690"}]
};
function billows(r,w,h,n){
  const peak=0.2+r()*0.6,out=[];
  for(let i=0;i<n;i++){const u=clamp((i+0.5+(r()-0.5)*0.6)/n,0.02,0.98),env=Math.exp(-Math.pow((u-peak)/0.3,2)),e=0.2+0.8*env;
    out.push([(u-0.5)*w*0.92,-h*0.15-e*h*0.55+(r()-0.5)*h*0.12,(w/n)*(0.45+r()*0.85)*(0.5+e*0.95)]);}
  return out;
}
function cloudShape(r,w,h,storm){
  const top=billows(r,w,h,Math.max(5,Math.round(w/(storm?24:28))));
  const tat=[],nt=storm?3+Math.floor(r()*4):1+Math.floor(r()*3);
  for(let i=0;i<nt;i++){const tx=(r()-0.5)*w*0.8,tw=6+r()*(storm?14:9);tat.push([tx-tw,tx+tw,tx+(r()-0.5)*8,4+r()*(storm?16:9)]);}
  const ends=[[-w*0.46,-w*0.5-16-r()*40,-h*0.06-r()*h*0.12],[w*0.46,w*0.5+16+r()*40,-h*0.08-r()*h*0.14]];
  const iw=w*(0.42+r()*0.15),ih=h*0.7;
  return{w,h,top,tat,ends,inner:{dx:(r()-0.5)*w*0.25,dy:-h*0.1,cl:{w:iw,h:ih,top:billows(r,iw,ih,Math.max(3,Math.round(iw/30))),tat:[],ends:[]}}};
}
function cloudPath(x,cl,X,Y,dy){
  x.beginPath();
  for(const b of cl.top){x.moveTo(X+b[0]+b[2],Y+b[1]+dy);x.arc(X+b[0],Y+b[1]+dy,b[2],0,Math.PI*2);}
  x.rect(X-cl.w*0.46,Y-cl.h*0.3+dy,cl.w*0.92,cl.h*0.3);
  for(const t of cl.tat){x.moveTo(X+t[1],Y-0.5+dy);x.lineTo(X+t[2],Y+t[3]+dy);x.lineTo(X+t[0],Y-0.5+dy);x.closePath();}
  const L=cl.ends[0],R2=cl.ends[1];
  if(L){x.moveTo(X+L[0],Y+dy);x.lineTo(X+L[1],Y+L[2]+dy);x.lineTo(X+L[0],Y-cl.h*0.3+dy);x.closePath();}
  if(R2){x.moveTo(X+R2[0],Y-cl.h*0.3+dy);x.lineTo(X+R2[1],Y+R2[2]+dy);x.lineTo(X+R2[0],Y+dy);x.closePath();}
}
function drawCutCloud(x,cl,X,Y,p,storm,under){
  x.fillStyle=p.under;cloudPath(x,cl,X,Y,under||(storm?3:1.8));x.fill();
  x.fillStyle=p.rim;cloudPath(x,cl,X,Y,-1.6);x.fill();
  x.fillStyle=p.body;cloudPath(x,cl,X,Y,0);x.fill();
  const I=cl.inner;
  x.fillStyle=p.lobeRim;cloudPath(x,I.cl,X+I.dx,Y+I.dy,-1.3);x.fill();
  x.fillStyle=p.lobe;cloudPath(x,I.cl,X+I.dx,Y+I.dy,0);x.fill();
}
function streakPts(r,w,h){ // a long lens of cloud: a wavering top, a flatter torn underside, tapered ends
  const n=Math.max(16,Math.round(w/14)),top=[],bot=[],ph=r()*6,ph2=r()*6,pk=0.3+r()*0.4;
  for(let i=0;i<=n;i++){const u=i/n,v=u<pk?u/pk*0.5:0.5+(u-pk)/(1-pk)*0.5,env=Math.pow(Math.sin(Math.PI*v),0.8),wave=0.6+0.4*Math.sin(u*9+ph)*Math.sin(u*4.3+ph2);
    top.push([(u-0.5)*w,-h*env*wave]);bot.push([(u-0.5)*w,h*0.22*env+(r()<0.07?h*0.22*env:0)]);}
  return top.concat(bot.reverse());
}
function streakPath(x,pts,X,Y){x.beginPath();pts.forEach((p,i)=>i?x.lineTo(X+p[0],Y+p[1]):x.moveTo(X+p[0],Y+p[1]));x.closePath();}
function renderCutClouds(W2,s,lv,depth,seed){
  const c=mk(W2*s,LH*s),x=c.getContext("2d");x.setTransform(s,0,0,s,0,0);
  const r=rng32(seed),storm=lv==="storm",pal=CLOUD_PAL[lv][depth];
  if(lv==="dawn"){ // long thin streaks, their undersides caught by the daybreak
    const n=depth?3:4;
    for(let i=0;i<n;i++){
      const w=depth?380+r()*300:260+r()*240,h=w*(0.035+r()*0.022),cx=(i+r()*0.8)/n*W2,by=depth?212+r()*44:72+r()*86;
      const A=streakPts(r,w,h),B=streakPts(r,w*(0.38+r()*0.25),h*0.7),bx=(r()-0.5)*w*0.3,bdy=-h*(0.45+r()*0.35);
      for(const ox of [-W2,0,W2]){if(cx+ox+w<-80||cx+ox-w>W2+80)continue;const X=cx+ox;
        x.fillStyle=pal.under;streakPath(x,A,X,by+2.6);x.fill();
        x.fillStyle=pal.rim;streakPath(x,A,X,by-1.2);x.fill();
        x.fillStyle=pal.body;streakPath(x,A,X,by);x.fill();
        x.fillStyle=pal.lobeRim;streakPath(x,B,X+bx,by+bdy-1);x.fill();
        x.fillStyle=pal.lobe;streakPath(x,B,X+bx,by+bdy);x.fill();}
    }
    return c;
  }
  const n=storm?(depth?7:9):(depth?3:4);
  for(let i=0;i<n;i++){
    const w=storm?(depth?340+r()*300:240+r()*240):(depth?280+r()*200:180+r()*160);
    const cx=(i+r()*0.8)/n*W2,by=storm?(depth?125+r()*110:80+r()*100):(depth?262+r()*40:62+r()*60); // at night, clear of the moon's face
    const cl=cloudShape(r,w,w*(storm?0.2+r()*0.06:0.13+r()*0.04),storm);
    for(const ox of [-W2,0,W2]){if(cx+ox+w<-80||cx+ox-w>W2+80)continue;drawCutCloud(x,cl,cx+ox,by,pal,storm);}
  }
  return c;
}
/* lightning: one distant strike every 8.5 s. The bolt fades over 0.6 s; the sky swells up over 0.5 s and down over 1.6 s.
   Only the sky brightens, never the whole picture. */
function lightning(t){
  const per=8.5,n=Math.floor(t/per),ph=t-n*per;
  const bolt=ph<0.6?1-ph/0.6:0,swell=ph<0.5?ph/0.5:ph<2.1?1-(ph-0.5)/1.6:0;
  return{bolt,swell:swell*swell,seed:n};
}
function drawBolt(x,W,st){
  const r=rng32(hsh(77,st.seed));let bx=W*(0.15+r()*0.7),by=170+r()*30;const pts=[[bx,by]];
  while(by<385){bx+=(r()-0.5)*28;by+=12+r()*16;pts.push([bx,by]);}
  x.save();x.globalAlpha=st.bolt;x.strokeStyle="#ffe9f0";x.shadowColor="rgba(255,190,210,0.9)";x.shadowBlur=10;x.lineWidth=1.8;x.lineJoin="round";
  x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();
  const k=Math.min(pts.length-1,2+Math.floor(r()*3));x.lineWidth=1;x.beginPath();x.moveTo(pts[k][0],pts[k][1]);let qx=pts[k][0],qy=pts[k][1];for(let i=0;i<4;i++){qx+=8+r()*12;qy+=10+r()*10;x.lineTo(qx,qy);}x.stroke();
  x.restore();
}
function drawRain(x,W,t,layer,rm){
  const n=layer?Math.round(W*0.11):Math.round(W*0.17),sp=(layer?720:430)*(rm?0.45:1),len=layer?22:12,slant=0.16*(layer?0.32:0.22),col=layer?"#c01b26":"#6a0b11";
  x.save();x.strokeStyle=rgba(col,layer?0.75:0.55);x.lineWidth=layer?1.5:0.9;x.lineCap="round";x.beginPath();
  for(let i=0;i<n;i++){
    const r1=((i*9301+49297)%233280)/233280,r2=((i*4271+7919)%104729)/104729;
    const H=LH+len*2,y=((t*sp*(0.8+r2*0.4)+r1*H*3)%H)-len,span=Math.abs(slant)*LH,x0=((r1*1.7+r2)%1)*(W+120+span)-60-span+slant*y;
    x.moveTo(x0,y);x.lineTo(x0+slant*len,y+len);
  }
  x.stroke();x.restore();
}
/* bats: a swarm of small ones crossing right to left, and a few bigger ones nearer. Scenery: no glow. */
function drawSwarm(x,W,t,lx,rm,col){
  const span=W+760,v=rm?26:68,N=rm?14:28;
  for(let f=0;f<2;f++){
    const cx=W+380-posmod(t*v+f*span*0.55+lx,span),cy=205+f*46+Math.sin(t*0.45+f*2)*18;
    if(cx<-220||cx>W+220)continue;
    for(let i=0;i<N;i++){
      const a=hsh(5,f,i),ox=((a&1023)/1023-0.5)*190,oy=(((a>>>10)&1023)/1023-0.5)*70,k=0.24+((a>>>20)&255)/255*0.2;
      const wob=Math.sin(t*(rm?0.6:1.4)+i)*(rm?2:6);
      drawBat(x,cx+ox+wob*0.5,cy+oy+wob,k,t*(rm?5:12)+i*0.7,col);
    }
  }
}
function drawBigBats(x,W,t,lx,rm,col){
  const span=W+420;
  for(let i=0;i<3;i++){
    const v=(rm?38:96)+i*18,X=W+210-posmod(t*v+i*span*0.37+lx,span),Y=150+i*58+Math.sin(t*0.8+i*1.7)*16;
    drawBat(x,X,Y,0.8+i*0.12,t*(rm?3.5:7)+i,col);
  }
}
/* ============================== props ============================== */
function drawSpireCluster(x,X,Y,r){
  const n=1+Math.floor(r()*3);x.fillStyle=INK;
  for(let i=0;i<n;i++){const w=6+r()*8,h=18+r()*34,bx=X+i*(w+2),bend=(r()-0.5)*w*0.9;x.fillRect(bx,Y-h,w,h+6);x.beginPath();x.moveTo(bx-2,Y-h);x.quadraticCurveTo(bx+w*0.3,Y-h-h*0.4,bx+w/2+bend,Y-h-h*0.7);x.quadraticCurveTo(bx+w*0.7,Y-h-h*0.35,bx+w+2,Y-h);x.closePath();x.fill();}
}
function drawGrave(x,X,Y,k,v){
  x.fillStyle=INK;x.save();x.translate(X,Y);x.scale(k,k);x.rotate((v-1)*0.06);
  if(v===0){x.beginPath();x.moveTo(-9,0);x.lineTo(-9,-22);x.arc(0,-22,9,Math.PI,0);x.lineTo(9,0);x.closePath();x.fill();}
  else if(v===1){x.fillRect(-2.5,-34,5,34);x.fillRect(-10,-26,20,5);}
  else{x.beginPath();x.moveTo(-6,0);x.lineTo(-4,-30);x.lineTo(0,-38);x.lineTo(4,-30);x.lineTo(6,0);x.closePath();x.fill();}
  x.restore();
}
/* round 6's gravestones: bigger and quirkier, like the houses and trees. They lean, crack, sag and bend. */
function drawGrave5(x,X,Y,k,v){
  x.fillStyle=INK;x.strokeStyle=INK;x.save();x.translate(X,Y);x.scale(k,k);
  x.beginPath();x.ellipse(0,1,24,5,0,Math.PI,0);x.fill(); // a mound of earth
  const P=(pts,eo)=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill(eo?"evenodd":"nonzero");};
  switch(v%6){
    case 0:{ // a leaning slab, cracked and chipped
      x.rotate(0.13);x.beginPath();x.moveTo(-14,3);x.quadraticCurveTo(-17,-16,-14,-34);x.quadraticCurveTo(-8,-52,4,-50);x.lineTo(8,-46);x.lineTo(11,-47);x.quadraticCurveTo(16,-40,14,-30);x.quadraticCurveTo(17,-14,14,3);x.closePath();
      x.moveTo(-2,-49);x.lineTo(2,-40);x.lineTo(-1,-33);x.lineTo(3,-23);x.lineTo(0,-22);x.lineTo(-3,-32);x.lineTo(0,-40);x.closePath();x.fill("evenodd");break;}
    case 1:{ // a crooked cross, one arm drooping
      x.rotate(-0.12);P([[-5,3],[-4.5,-29],[-16,-30],[-18,-34],[-16,-38],[-4,-38.5],[-4,-52],[-1,-59],[2,-57],[4,-52],[4.5,-39],[13,-36],[18,-28],[15,-26],[13,-29],[11,-27],[9,-31],[5,-32],[6,3]]);
      P([[-11,3],[-10,-3],[10,-4],[12,3]]);break;}
    case 2:{ // a tall obelisk with a bent tip, like the spires
      x.rotate(0.06);x.fillRect(-12,-8,24,10);P([[-8,-8],[-6,-60],[6,-60],[8,-8]]);
      x.beginPath();x.moveTo(-7,-60);x.quadraticCurveTo(-4,-74,6,-84);x.quadraticCurveTo(2,-72,7,-60);x.closePath();x.fill();break;}
    case 3:{ // a shouldered headstone with curled scrolls, a crow on top
      x.rotate(-0.07);x.beginPath();x.moveTo(-13,3);x.lineTo(-13,-30);x.quadraticCurveTo(-21,-32,-19,-40);x.quadraticCurveTo(-13,-40,-11,-36);x.quadraticCurveTo(-6,-50,0,-56);x.quadraticCurveTo(6,-50,11,-36);x.quadraticCurveTo(13,-40,19,-40);x.quadraticCurveTo(21,-32,13,-30);x.lineTo(13,3);x.closePath();x.fill();
      P(crowShape(1,-62,1));x.lineWidth=1;x.beginPath();x.moveTo(-1,-59.5);x.lineTo(-1,-56);x.moveTo(2,-59.5);x.lineTo(2,-56);x.stroke();break;}
    case 4:{ // a small stone sinking into the ground, tipped well over, its top broken off
      x.rotate(0.38);P([[-11,4],[-12,-16],[-6,-23],[-2,-19],[3,-26],[8,-21],[11,-14],[11,4]]);break;}
    default:{ // a little house-tomb: a crooked roof, a finial, a dark niche
      x.rotate(-0.04);x.beginPath();x.rect(-15,-30,30,32);x.moveTo(-6,0);x.lineTo(-6,-14);x.quadraticCurveTo(0,-22,6,-14);x.lineTo(6,0);x.closePath();x.fill("evenodd");
      P([[-20,-28],[1,-50],[21,-27],[17,-25],[1,-43],[-16,-26]]);P([[-17,-29],[1,-47],[18,-28]]);
      x.lineWidth=1.6;x.beginPath();x.moveTo(1,-50);x.quadraticCurveTo(5,-60,10,-57);x.stroke();}
  }
  x.restore();
}
function drawFence(x,X,wx,w){
  x.fillStyle=INK;x.strokeStyle=INK;x.lineWidth=2;
  for(let i=0;i<=w;i+=9){const y=gY(wx+i);x.beginPath();x.moveTo(X+i-2.5,y-28);x.lineTo(X+i,y-34);x.lineTo(X+i+2.5,y-28);x.closePath();x.fill();x.fillRect(X+i-1,y-28,2,30);}
  x.beginPath();x.moveTo(X,gY(wx)-22);x.lineTo(X+w,gY(wx+w)-22);x.moveTo(X,gY(wx)-9);x.lineTo(X+w,gY(wx+w)-9);x.stroke();
}
function drawWall(x,X,Y,w,h,p){
  const r=rng32(hsh(43,p));x.fillStyle=INK;x.beginPath();x.moveTo(X,Y+6);x.lineTo(X,Y-h);
  for(let i=0;i<=w;i+=14){x.lineTo(X+i,Y-h-(r()<0.5?0:5));x.lineTo(X+i+7,Y-h-(r()<0.3?3:0));}
  x.lineTo(X+w,Y-h+r()*12);x.lineTo(X+w+6,Y-h*0.4);x.lineTo(X+w+2,Y+6);x.closePath();
  const aw=w*0.34,ax=X+w*0.5-aw/2,ah=h*0.66;
  x.moveTo(ax,Y+6);x.lineTo(ax+aw,Y+6);x.lineTo(ax+aw,Y-ah+aw/2);x.arc(ax+aw/2,Y-ah+aw/2,aw/2,0,Math.PI,true);x.closePath();
  x.fill("evenodd");
}
function drawPotion(x,X,Y,t,rm){
  const pulse=0.75+0.25*Math.sin(t*(rm?1.2:3.1));
  if(FX){const g=x.createRadialGradient(X,Y-10,2,X,Y-10,30);g.addColorStop(0,rgba(POTION,0.5*pulse));g.addColorStop(1,rgba(POTION,0));x.fillStyle=g;x.fillRect(X-32,Y-42,64,64);}
  x.fillStyle=INK;x.beginPath();x.arc(X,Y-8,8,0,Math.PI*2);x.fill();x.fillRect(X-2.5,Y-22,5,10);x.fillRect(X-4,Y-24,8,3);
  x.fillStyle=POTION;x.beginPath();x.arc(X,Y-8,6,0.15,Math.PI-0.15);x.closePath();x.fill();
  x.fillStyle="rgba(255,255,255,0.55)";x.beginPath();x.arc(X-2.5,Y-10,1.4,0,Math.PI*2);x.fill();
  for(let i=0;i<3;i++){const ph=((t*(rm?0.2:0.5)+i/3)%1);x.fillStyle=rgba(POTION,0.7*(1-ph));x.beginPath();x.arc(X+Math.sin(ph*6+i)*5,Y-22-ph*26,1.3,0,Math.PI*2);x.fill();}
}
function drawFairy(x,fl,t,lv){
  const ax=fl[0],ay=fl[1],qx=fl[2],qy=fl[3],bx=fl[4],by=fl[5],seed=fl[6],n=10;
  for(let i=1;i<n;i++){const u=i/n,v=1-u,px=v*v*ax+2*v*u*qx+u*u*bx,py=v*v*ay+2*v*u*qy+u*u*by;
    const tw=0.7+0.3*Math.sin(t*1.1+i*1.7+seed);
    x.save();x.fillStyle=lv==="storm"?"rgba(255,201,168,"+tw+")":"rgba(255,241,200,"+tw+")";x.shadowColor="#ffd27a";x.shadowBlur=FX?8:0;x.beginPath();x.arc(px,py,1.8,0,Math.PI*2);x.fill();x.restore();}
}
function drawPost(x,X,Y,lit,col){
  x.fillStyle=INK;x.strokeStyle=INK;x.lineWidth=4;
  x.beginPath();x.moveTo(X,Y+4);x.lineTo(X+2,Y-104);x.stroke();
  x.lineWidth=3;x.beginPath();x.moveTo(X+2,Y-100);x.quadraticCurveTo(X+16,Y-112,X+18,Y-98);x.stroke();
  const lx=X+18,ly=Y-90;
  if(lit&&FX){const g=x.createRadialGradient(lx,ly,2,lx,ly,46);g.addColorStop(0,rgba(col,0.55));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(lx-48,ly-48,96,96);}
  x.fillStyle=INK;x.fillRect(lx-7,ly-10,14,4);x.fillRect(lx-6,ly+8,12,3);
  x.fillStyle=lit?"#ffdf9a":"#16110f";x.fillRect(lx-5.5,ly-6,11,14);
  x.strokeStyle=INK;x.lineWidth=1.2;x.strokeRect(lx-5.5,ly-6,11,14);x.beginPath();x.moveTo(lx-2,ly-6);x.lineTo(lx-2,ly+8);x.moveTo(lx+2,ly-6);x.lineTo(lx+2,ly+8);x.stroke();
}
function drawWallLamp(x,X,Y,t,rm){ // a bracket lantern by the door
  if(FX){const g=x.createRadialGradient(X+9,Y+8,2,X+9,Y+8,42);g.addColorStop(0,"rgba(255,207,106,0.5)");g.addColorStop(1,"rgba(255,207,106,0)");x.fillStyle=g;x.fillRect(X-34,Y-34,86,86);}
  x.strokeStyle=INK;x.fillStyle=INK;x.lineWidth=2.2;x.beginPath();x.moveTo(X,Y-6);x.lineTo(X+10,Y-6);x.lineTo(X+10,Y-1);x.stroke();
  x.fillRect(X+4.5,Y-1,11,2.5);x.fillStyle="#ffdf9a";x.fillRect(X+5.5,Y+1.5,9,11);
  x.strokeStyle=INK;x.lineWidth=1;x.strokeRect(X+5.5,Y+1.5,9,11);x.beginPath();x.moveTo(X+10,Y+1.5);x.lineTo(X+10,Y+12.5);x.stroke();
  x.fillStyle=INK;x.fillRect(X+5,Y+12.5,10,2);
}
function drawCandle(x,X,Y,t,rm){ // a candle at the foot of a grave
  const fl=1+0.12*Math.sin(t*(rm?2:5.3))+0.06*Math.sin(t*(rm?3:8.1));
  if(FX){const g=x.createRadialGradient(X,Y-12,1,X,Y-12,30);g.addColorStop(0,"rgba(255,207,106,0.5)");g.addColorStop(1,"rgba(255,207,106,0)");x.fillStyle=g;x.fillRect(X-32,Y-44,64,64);}
  x.fillStyle=INK;x.fillRect(X-2.4,Y-9,4.8,9);
  x.fillStyle="#ffdf9a";x.beginPath();x.moveTo(X,Y-9-8*fl);x.quadraticCurveTo(X+2.6,Y-12,X,Y-9.5);x.quadraticCurveTo(X-2.6,Y-12,X,Y-9-8*fl);x.fill();
}
/* the old town */
function drawStreetLamp(x,X,Y,col){
  x.fillStyle=INK;x.strokeStyle=INK;
  x.beginPath();x.moveTo(X-7,Y+4);x.lineTo(X-3,Y-14);x.lineTo(X-2,Y-106);x.lineTo(X+2,Y-106);x.lineTo(X+3,Y-14);x.lineTo(X+7,Y+4);x.closePath();x.fill();
  x.fillRect(X-5,Y-20,10,3);x.fillRect(X-4,Y-62,8,2.5);x.lineWidth=1.6;x.beginPath();x.moveTo(X-12,Y-100);x.lineTo(X+12,Y-100);x.stroke();
  const ly=Y-116;if(FX){const g=x.createRadialGradient(X,ly,2,X,ly,52);g.addColorStop(0,rgba(col,0.55));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(X-54,ly-54,108,108);}
  x.fillStyle=INK;x.beginPath();x.moveTo(X-9,ly-7);x.lineTo(X,ly-16);x.lineTo(X+9,ly-7);x.closePath();x.fill();x.fillRect(X-1,ly-21,2,6);
  x.fillStyle="#ffdf9a";x.beginPath();x.moveTo(X-6,ly-7);x.lineTo(X+6,ly-7);x.lineTo(X+4.5,ly+7);x.lineTo(X-4.5,ly+7);x.closePath();x.fill();
  x.strokeStyle=INK;x.lineWidth=1.2;x.stroke();x.beginPath();x.moveTo(X,ly-7);x.lineTo(X,ly+7);x.stroke();x.fillStyle=INK;x.fillRect(X-6,ly+7,12,3);
}
function drawBarrels(x,X,Y){
  x.fillStyle=INK;
  for(const b of [[0,0],[20,0],[10,-24]]){const bx=X+b[0],by=Y+3+b[1];x.beginPath();x.moveTo(bx-8,by);x.quadraticCurveTo(bx-11.5,by-12,bx-8,by-24);x.lineTo(bx+8,by-24);x.quadraticCurveTo(bx+11.5,by-12,bx+8,by);x.closePath();x.fill();}
}
function drawCrates(x,X,Y){x.fillStyle=INK;x.save();x.translate(X,Y+3);x.fillRect(0,-22,24,22);x.fillRect(26,-16,17,16);x.rotate(-0.09);x.fillRect(3,-41,19,18);x.restore();}
function drawWell(x,X,Y){
  x.fillStyle=INK;x.strokeStyle=INK;
  x.beginPath();x.moveTo(X-20,Y+4);x.lineTo(X-19,Y-24);x.quadraticCurveTo(X,Y-29,X+19,Y-24);x.lineTo(X+20,Y+4);x.closePath();x.fill();
  x.fillRect(X-17,Y-62,4,40);x.fillRect(X+13,Y-62,4,40);
  x.beginPath();x.moveTo(X-27,Y-57);x.lineTo(X,Y-79);x.lineTo(X+27,Y-57);x.lineTo(X+23,Y-54);x.lineTo(X,Y-71);x.lineTo(X-23,Y-54);x.closePath();x.fill();
  x.lineWidth=2;x.beginPath();x.moveTo(X-15,Y-50);x.lineTo(X+22,Y-50);x.lineTo(X+22,Y-44);x.stroke();
  x.lineWidth=1;x.beginPath();x.moveTo(X+2,Y-50);x.lineTo(X+2,Y-39);x.stroke();
  x.beginPath();x.moveTo(X-3,Y-39);x.lineTo(X+7,Y-39);x.lineTo(X+5.5,Y-31);x.lineTo(X-1.5,Y-31);x.closePath();x.fill();
}
function drawRoofline(x,X,Y,r){ // distant rooftops and chimneys, with the odd spire
  x.fillStyle=INK;let px=X;const n=3+Math.floor(r()*4);
  for(let i=0;i<n;i++){const w=14+r()*16,h=10+r()*18,rh=8+r()*12;x.beginPath();x.moveTo(px,Y+6);x.lineTo(px,Y-h);x.lineTo(px+w*0.5,Y-h-rh);x.lineTo(px+w,Y-h);x.lineTo(px+w,Y+6);x.closePath();x.fill();
    if(r()<0.5)x.fillRect(px+w*0.68,Y-h-rh*0.9,3,rh*0.6);px+=w-2;}
  if(r()<0.4)drawSpireCluster(x,px+4,Y,r);
}
/* the open moor */
function drawMenhir(x,X,Y,k,v){
  const sh=[[[-9,0],[-11,-30],[-7,-62],[1,-70],[8,-58],[11,-24],[10,0]],[[-12,0],[-10,-24],[-4,-44],[4,-46],[10,-30],[13,0]],[[-7,0],[-9,-40],[-3,-82],[4,-88],[9,-60],[8,0]]][v%3];
  x.fillStyle=INK;x.save();x.translate(X,Y);x.scale(k,k);x.rotate((v%3-1)*0.07);x.beginPath();sh.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.lineTo(sh[sh.length-1][0],4);x.lineTo(sh[0][0],4);x.closePath();x.fill();x.restore();
}
function drawCairn(x,X,Y,k){
  x.fillStyle=INK;x.save();x.translate(X,Y+2);x.scale(k,k);
  for(const q of [[-14,-5,10,6],[0,-6,12,7],[14,-5,9,6],[-7,-15,10,6],[8,-15,9,6],[0,-24,8,5],[1,-31,5,4]]){x.beginPath();x.ellipse(q[0],q[1],q[2],q[3],0,0,Math.PI*2);x.fill();}
  x.fillRect(-22,-4,44,6);x.restore();
}
function drawFallen(x,X,wx){ // stones of a fallen circle
  x.fillStyle=INK;
  for(const q of [[0,26,7,-0.08],[40,18,6,0.12],[72,10,12,0.3]]){const y=gY(wx+q[0]);x.save();x.translate(X+q[0],y+3);x.rotate(q[3]);x.beginPath();x.ellipse(0,-q[2]*0.6,q[1],q[2],0,0,Math.PI*2);x.fill();x.restore();}
}
function drawStoneWall(x,X,wx,w,h,p){ // a dry-stone wall with a tumbled gap
  const r=rng32(hsh(44,p));x.fillStyle=INK;
  const seg=(a,b2,hh)=>{x.beginPath();x.moveTo(X+a,gY(wx+a)+6);x.lineTo(X+a,gY(wx+a)-hh*0.7);let i=a;
    while(i<b2){const sw=7+r()*8,ii=Math.min(b2,i+sw);x.quadraticCurveTo(X+(i+ii)/2,gY(wx+(i+ii)/2)-hh-3-r()*4,X+ii,gY(wx+ii)-hh+r()*2);i=ii;}
    x.lineTo(X+b2,gY(wx+b2)+6);x.closePath();x.fill();};
  seg(0,w*0.72,h);seg(w*0.86,w,h*0.6);
  for(const q of [[0.76,7,4,0.3],[0.81,5,3.5,-0.2],[0.9,6,3.5,0.1]]){x.beginPath();x.ellipse(X+w*q[0],gY(wx+w*q[0])-q[2]+1,q[1],q[2],q[3],0,Math.PI*2);x.fill();}
}
function drawTor(x,X,Y,r){ // weathered rock stacks on the far ridge
  x.fillStyle=INK;const n=2+Math.floor(r()*3);let px=X;
  for(let i=0;i<n;i++){const w=10+r()*14,h=6+r()*10;x.beginPath();x.ellipse(px,Y-h*0.5,w*0.6,h,(r()-0.5)*0.3,0,Math.PI*2);x.fill();if(r()<0.6){x.beginPath();x.ellipse(px+(r()-0.5)*4,Y-h*1.4,w*0.4,h*0.55,0,0,Math.PI*2);x.fill();}px+=w*0.8;}
}
function drawFieldWall(x,X0,w,yfn,lx,r){x.fillStyle=INK;x.beginPath();x.moveTo(X0,yfn(X0+lx)+4);for(let i=0;i<=w;i+=5)x.lineTo(X0+i,yfn(X0+i+lx)-6-r()*2.5);x.lineTo(X0+w,yfn(X0+w+lx)+4);x.closePath();x.fill();}
/* stone circles on the moor, seen from the side: the far stones smaller, a few fallen, sometimes a lintel */
function drawStoneCircle(x,X,k,r,yfn,lx){
  const n=8+Math.floor(r()*5),rx=58*k,ry=11*k,st=[];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r()*0.2,fall=r()<0.18,gone=r()<0.12;if(gone)continue;st.push({a,fall,v:Math.floor(r()*3),s:(0.42+r()*0.18)*k,sz:0.8+r()*0.3});}
  st.sort((p,q)=>Math.sin(p.a)-Math.sin(q.a));
  // a low rise under the ring, as high as its far stones are lifted, so every stone and fallen stone stands on ground
  const R=rx+10*k;x.fillStyle=INK;x.beginPath();for(let d=-R;d<=R;d+=4){const u=d/R;x.lineTo(X+d,yfn(X+d+lx)+2-ry*0.6*Math.sqrt(Math.max(0,1-u*u)));}
  for(let d=R;d>=-R;d-=4)x.lineTo(X+d,yfn(X+d+lx)+6);x.closePath();x.fill();
  for(const q of st){const sx=X+Math.cos(q.a)*rx,depth=Math.sin(q.a),sk=q.s*(0.82+0.18*(depth+1)/2)*q.sz,sy=groundAt(yfn,sx+lx-8*sk,sx+lx+8*sk)+2+depth*ry*0.6;
    if(q.fall){x.fillStyle=INK;x.beginPath();x.ellipse(sx,sy-3*sk,16*sk,4.5*sk,(r()-0.5)*0.3,0,Math.PI*2);x.fill();}
    else drawMenhir(x,sx,sy,sk,q.v);}
  if(r()<0.35){const lx2=X+(r()-0.5)*rx*0.6,tilt=(r()-0.5)*0.12;drawTrilithon(x,lx2,groundAt(yfn,lx2+lx-12*k,lx2+lx+12*k)+2,k,tilt,rng32(hsh(53,Math.round(lx2+lx))));}
}
function drawTrilithon(x,X,Y,k,tilt,q){ // the circle's arch: two rough uprights under a rough lintel, cut like the menhirs, no straight sides
  const j=a=>(q()-0.5)*a;x.fillStyle=INK;
  const up=(cx,h,lean)=>{ // an upright: sides that wander in and out, a worn, uneven top; returns its top in the picture
    const wb=8.5+j(2),wt=wb*(0.8+q()*0.12),pts=[[-wb/2,4],[-wb/2-0.6+j(1.4),-h*0.25],[-wb/2+0.5+j(1.4),-h*0.55],[-wt/2-0.3+j(1.2),-h*0.82],
      [-wt/2+0.9+j(0.6),-h+0.7],[-wt*0.1+j(1.2),-h-0.7+j(0.8)],[wt/2-1+j(0.6),-h+j(0.6)],[wt/2+0.3+j(1.2),-h*0.8],[wb/2+0.6+j(1.4),-h*0.5],[wb/2-0.3+j(1.4),-h*0.22],[wb/2,4]];
    x.save();x.translate(X+cx*k,Y);x.scale(k,k);x.rotate(lean);x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.restore();
    return[X+(cx+Math.sin(lean)*h)*k,Y-Math.cos(lean)*h*k];};
  const a=up(-8.5,48+j(2.4),-0.03+j(0.03)),b=up(8.5,48+j(2.4),0.03+j(0.03));
  // the lintel rests on both tops: a rough slab with an uneven back, its ends worn round
  const ang=Math.atan2(b[1]-a[1],b[0]-a[0])+tilt*0.5,L=17+j(2),R=17+j(2),T=7.5+j(1.5);
  const sl=[[-L,1.5],[-L-0.8+j(1.2),-T*0.4],[-L+1.5+j(1),-T+0.5+j(0.8)],[-L*0.55+j(2),-T-0.4+j(1)],[j(3),-T+0.2+j(0.8)],[R*0.5+j(2),-T-0.6+j(1)],
    [R-1.5+j(1),-T+0.8+j(0.8)],[R+0.8+j(1.2),-T*0.45],[R,1.5],[R*0.5,2.2+j(0.6)],[0,1.6],[-L*0.5,2.2+j(0.6)]];
  x.save();x.translate((a[0]+b[0])/2,(a[1]+b[1])/2);x.rotate(ang);x.scale(k,k);x.beginPath();sl.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.restore();
}
/* the wind-bent forest */
function drawBigStump(x,X,Y,v,p){ // a big broken trunk on the path: splintered top, flared roots, a stub, bracket fungi
  const r=rng32(hsh(47,p,v)),H=[108,74,138][v%3],w=[42,54,34][v%3],lean=[0.08,-0.05,0.14][v%3];
  x.fillStyle=INK;x.beginPath();x.moveTo(X-w*1.3,Y+4);
  x.quadraticCurveTo(X-w*0.55,Y-4,X-w*0.5,Y-H*0.3);x.lineTo(X-w*0.45+lean*H*0.6,Y-H*0.8);
  const tl=X-w*0.42+lean*H,tr=X+w*0.42+lean*H;
  for(let i=0;i<=7;i++){const u=i/7,px=lerp(tl,tr,u),py=Y-H-(i%2?(4+r()*10):(14+r()*26))*(i===2||i===5?1.3:1);x.lineTo(px,py);}
  x.lineTo(X+w*0.45+lean*H*0.6,Y-H*0.8);x.lineTo(X+w*0.5,Y-H*0.3);x.quadraticCurveTo(X+w*0.55,Y-4,X+w*1.4,Y+4);x.closePath();x.fill();
  for(const sd of [-1,1]){x.beginPath();x.moveTo(X+sd*w*0.3,Y-H*0.12);x.quadraticCurveTo(X+sd*w*0.9,Y-H*0.06,X+sd*w*(1.5+r()*0.4),Y+4);x.lineTo(X+sd*w*0.5,Y+4);x.closePath();x.fill();}
  const edge=(sd,hh)=>{const u=clamp((hh-H*0.3)/(H*0.5),0,1);return X+sd*lerp(w*0.5,w*0.45,u)+lean*H*0.6*u;}; // the trunk's side at a given height
  const sh=H*(0.55+r()*0.15),sy=Y-sh,e=edge(1,sh);x.beginPath();x.moveTo(e-7,sy+7);x.lineTo(e+w*0.7,sy-w*0.35);x.lineTo(e+w*0.75,sy-w*0.2);x.lineTo(e-7,sy+14);x.closePath();x.fill();
  for(let i=0;i<2+v%2;i++){const fh=H*(0.32+i*0.16),right=i%2===0,fx=edge(right?1:-1,fh)+(right?-2:2);x.beginPath();x.ellipse(fx,Y-fh,9,3.4,0,right?-Math.PI/2:Math.PI/2,right?Math.PI/2:Math.PI*1.5);x.closePath();x.fill();}
}
function drawTreeEyes(x,eyes,t,L,rm){ // pale, dim eyes in the trees that blink now and then, and slowly come and go
  const a=[0,0.3,0.4,0.5,0.58][L];
  for(const e of eyes){
    const per=4.5+(e.seed%500)/100,ph=(t+(e.seed%997)/61)%per,open=ph<0.18?Math.abs(ph-0.09)/0.09:1;
    const vis=0.6+0.4*Math.sin(t*(rm?0.15:0.3)+(e.seed%13));if(vis<0.3)continue;
    const sz=clamp(e.s*0.11,1.1,4.2),gap=sz*2.4;
    x.save();x.fillStyle=rgba("#eef1dc",a*vis);x.shadowColor="rgba(238,241,220,0.55)";x.shadowBlur=FX?sz*2.2:0;
    for(const sd of [-1,1]){x.beginPath();x.ellipse(e.X+sd*gap/2,e.Y,sz,Math.max(0.2,sz*0.5*open),-sd*0.28,0,Math.PI*2);x.fill();}
    x.restore();
  }
}
function drawStumpProp(x,X,Y,k,v){
  x.fillStyle=INK;x.save();x.translate(X,Y+2);x.scale(k,k);
  x.beginPath();x.moveTo(-24,4);x.quadraticCurveTo(-12,-2,-11,-14);x.lineTo(-11,-30);x.lineTo(-6,-25);x.lineTo(-2,-36);x.lineTo(3,-26);x.lineTo(8,-31);x.lineTo(11,-23);x.lineTo(11,-12);x.quadraticCurveTo(13,-2,26,4);x.closePath();x.fill();
  if(v){x.beginPath();x.ellipse(12,-15,7,2.8,0,-Math.PI/2,Math.PI/2);x.fill();x.beginPath();x.ellipse(12,-9,5,2.2,0,-Math.PI/2,Math.PI/2);x.fill();}
  x.restore();
}
function drawFerns(x,X,wx,w,p,yfn){
  yfn=yfn||gY;const r=rng32(hsh(46,p));x.strokeStyle=INK;x.lineCap="round";
  for(let i=0;i<w;i+=16+r()*10){const bx=X+i,by=yfn(wx+i)+3,n=2+Math.floor(r()*2);
    for(let j=0;j<n;j++){const a=-0.9+j*0.8+(r()-0.5)*0.3,L=22+r()*16,ex=bx+Math.sin(a)*L,ey=by-Math.cos(a)*L*0.8,cx=bx+Math.sin(a)*L*0.4,cy=by-L*0.9;
      x.lineWidth=1.6;x.beginPath();x.moveTo(bx,by);x.quadraticCurveTo(cx,cy,ex,ey);x.stroke();
      for(let q=1;q<7;q++){const u=q/7,v=1-u,px=v*v*bx+2*v*u*cx+u*u*ex,py=v*v*by+2*v*u*cy+u*u*ey,lw=(1-u)*6+1.5;x.lineWidth=1.1;x.beginPath();x.moveTo(px-lw,py+lw*0.5);x.lineTo(px,py);x.lineTo(px+lw,py+lw*0.5);x.stroke();}}}
}
function drawLog(x,X,wx,w,h,p){ // a fallen trunk, its root plate torn up
  const r=rng32(hsh(45,p)),y0=gY(wx),y1=gY(wx+w);x.fillStyle=INK;x.strokeStyle=INK;
  x.beginPath();x.moveTo(X,y0+4);x.lineTo(X+4,y0-h*0.95);x.quadraticCurveTo(X+w*0.5,(y0+y1)/2-h*1.12,X+w-6,y1-h*0.75);x.lineTo(X+w,y1-h*0.4);x.lineTo(X+w-4,y1+4);x.closePath();x.fill();
  x.beginPath();x.moveTo(X+6,y0+4);for(let i=0;i<=10;i++){const a=Math.PI*0.5+i/10*Math.PI,rr=h*(0.9+r()*0.7);x.lineTo(X+6+Math.cos(a)*rr*0.7,y0-h*0.5+Math.sin(a)*rr);}x.closePath();x.fill();
  for(const u of [0.22,0.7,0.86]){const bx=X+w*u,by=lerp(y0,y1,u)-h*0.95;x.lineWidth=2.6;x.beginPath();x.moveTo(bx,by+4);x.lineTo(bx+6+r()*8,by-12-r()*14);x.stroke();}
}
function drawShrine(x,X,Y,t,rm){ // a wayside shrine on a post, with a candle inside
  x.fillStyle=INK;x.strokeStyle=INK;x.fillRect(X-2.5,Y-48,5,52);
  x.fillRect(X-12,Y-64,24,3);x.fillRect(X-12,Y-50,24,3);x.fillRect(X-12,Y-64,3,16);x.fillRect(X+9,Y-64,3,16);
  x.beginPath();x.moveTo(X-16,Y-63);x.lineTo(X,Y-78);x.lineTo(X+16,Y-63);x.closePath();x.fill();
  x.lineWidth=1.6;x.beginPath();x.moveTo(X,Y-78);x.lineTo(X,Y-87);x.moveTo(X-3.5,Y-83.5);x.lineTo(X+3.5,Y-83.5);x.stroke();
  x.save();x.translate(X,Y-50);x.scale(0.62,0.62);drawCandle(x,0,0,t,rm);x.restore();
}
/* ============================== the splash of colour: menacing things at ground level, lit from within by witch-light ============================== */
function witchGlow(x,cx,cy,r,a){if(!FX)return;x.save();r*=1+0.4*SPI;a=Math.min(0.85,a*(1+0.9*SPI));const g=x.createRadialGradient(cx,cy,1,cx,cy,r);g.addColorStop(0,rgba(SP.glow,a));g.addColorStop(1,rgba(SP.glow,0));x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);x.restore();}
function witchPool(x,cx,cy,w,a){if(!FX)return;x.save();w*=1+0.3*SPI;a=Math.min(0.8,a*(1+0.9*SPI));x.translate(cx,cy);x.scale(w/14,1);const g=x.createRadialGradient(0,0,0,0,0,14);g.addColorStop(0,rgba(SP.glow,a));g.addColorStop(1,rgba(SP.glow,0));x.fillStyle=g;x.fillRect(-14,-14,28,28);x.restore();}
function lit(x,pts,f){x.save();x.fillStyle=rgba(SPI?"#ecffc4":SP.core,Math.min(1,0.92*f*(1+0.15*SPI)));x.shadowColor=SP.glow;x.shadowBlur=FX?6+7*SPI:0;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();
  if(SPI){x.globalCompositeOperation="lighter";x.globalAlpha=0.35;x.fill();}x.restore();}
function slitEye(cx,cy,w,h,tilt){return[[cx-w/2,cy+tilt],[cx,cy-h/2],[cx+w/2,cy-tilt],[cx,cy+h/2]];}
function grin(cx,cy,w,h,n){const top=[],bot=[];for(let i=0;i<=n;i++){const u=i/n,x0=cx-w/2+u*w,curve=-Math.sin(u*Math.PI)*h*0.5;top.push([x0,cy+curve*0.4+(i%2?h*0.35:0)]);bot.push([x0,cy+curve+h*0.5-(i%2?0:h*0.35)]);}return top.concat(bot.reverse());}
function drawSplash(x,set,idea,X,Y,t,rm,seed,col,spi){
  SP=SPLASH_COL[col]||WITCH;SPI=spi==="intense"?1:0;
  const f=rm?0.92:0.86+0.1*Math.sin(t*2.3+seed)+0.04*Math.sin(t*5.7+seed*2); // a slow, small flicker
  const key={village5:"village5-lantern",town:"town-grotesque",moor:"moor-a",forest:"forest-b"}[set],sc=1; // the chosen one for each place
  x.save();x.translate(X,Y);x.scale(sc,sc);x.fillStyle=INK;x.strokeStyle=INK;x.lineCap="round";x.lineJoin="round";
  const P=pts=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();};
  if(key==="village5-lantern"){ // a pierced tin grave lantern: a ring on top, a short peaked cap, a face and a band of holes punched in it
    witchPool(x,0,2,22,0.34*f);witchGlow(x,0,-18,36,0.34*f);
    x.rotate(-0.05);
    P([[-9.5,3],[-8.5,-2],[8.5,-2],[9.5,3]]);
    P([[-8,-2],[-8.8,-25],[8.8,-25],[8,-2]]);
    for(const sd of [-1,1])P([[sd*8,-1],[sd*10.4,-1],[sd*10.6,-26],[sd*8.6,-26]]); // corner posts
    P([[-12.5,-24],[-10,-27.5],[-3,-33],[0,-37.5],[3,-33],[10,-27.5],[12.5,-24]]);
    x.lineWidth=1.8;x.beginPath();x.moveTo(0,-37);x.lineTo(0,-40);x.stroke();x.lineWidth=1.6;x.beginPath();x.arc(0,-43,3,0,Math.PI*2);x.stroke();
    lit(x,[[-6.8,-19.5],[-1.6,-16.4],[-2,-15.2],[-6.4,-17]],f);lit(x,[[6.8,-19.5],[1.6,-16.4],[2,-15.2],[6.4,-17]],f);
    lit(x,[[-6,-11],[-3,-9.8],[0,-9.4],[3,-9.8],[6,-11],[4.8,-7],[1.8,-5],[-1.8,-5],[-4.8,-7]],f);
    P([[-4.4,-10.3],[-3.5,-7.6],[-2.6,-10]]);P([[2.6,-10],[3.5,-7.6],[4.4,-10.3]]);P([[-1.3,-5.2],[-0.5,-7.1],[0.3,-5.1]]);
    x.save();x.fillStyle=rgba(SP.core,0.8*f);for(let i=-3;i<=3;i++){x.beginPath();x.arc(i*2.2,-22.6,0.7,0,Math.PI*2);x.fill();x.beginPath();x.arc(i*2.2,-3.2,0.6,0,Math.PI*2);x.fill();}x.restore();
  }else if(key==="town-grotesque"){ // a grotesque on a moulded post: curling horns, a heavy brow, slit eyes, a fanged maw
    witchPool(x,0,2,24,0.32*f);witchGlow(x,0,-28,38,0.32*f);
    P([[-7,3],[-6,-12],[-8.5,-14],[-8.5,-17],[8.5,-17],[8.5,-14],[6,-12],[7,3]]);
    x.beginPath();x.moveTo(-9,-17);x.quadraticCurveTo(-13,-23,-11,-30);x.quadraticCurveTo(-15,-34,-17,-42);x.quadraticCurveTo(-11,-39,-8.5,-35);
    x.quadraticCurveTo(-4,-38,0,-36.5);x.quadraticCurveTo(4,-38,8.5,-35);x.quadraticCurveTo(11,-39,17,-42);x.quadraticCurveTo(15,-34,11,-30);x.quadraticCurveTo(13,-23,9,-17);x.closePath();x.fill();
    for(const sd of [-1,1]){x.beginPath();x.moveTo(sd*11.5,-27);x.lineTo(sd*15.5,-30);x.lineTo(sd*12,-24);x.closePath();x.fill();} // pointed ears
    lit(x,[[-8.5,-31],[-2.5,-28.4],[-3,-27.2],[-8,-29.4]],f);lit(x,[[8.5,-31],[2.5,-28.4],[3,-27.2],[8,-29.4]],f);
    lit(x,[[-6.5,-24.5],[0,-26],[6.5,-24.5],[5.5,-20],[0,-17.8],[-5.5,-20]],f);
    P([[-5,-24.6],[-4,-21.4],[-3,-25]]);P([[3,-25],[4,-21.4],[5,-24.6]]);P([[-2.6,-18.3],[-1.6,-21],[-0.6,-18.1]]);P([[0.6,-18.1],[1.6,-21],[2.6,-18.3]]);
    P([[-1.2,-28.6],[1.2,-28.6],[0.8,-25.4],[-0.8,-25.4]]); // the bridge of the snout

  }else if(key==="village5-a"){ // a pierced iron grave lantern: the holes make a leering face
    witchPool(x,0,2,34,0.35*f);witchGlow(x,0,-30,52,0.32*f);
    P([[-16,3],[-15,-8],[15,-8],[16,3]]);P([[-12,-8],[-13,-42],[13,-42],[12,-8]]);
    P([[-16,-41],[0,-58],[16,-41]]);x.lineWidth=2;x.beginPath();x.arc(0,-61,3.4,0,Math.PI*2);x.stroke();
    lit(x,slitEye(-6,-32,8,4.5,1.8),f);lit(x,slitEye(6,-32,8,4.5,-1.8),f);lit(x,grin(0,-21,17,7,6),f);
    for(const q of [[-9,-38],[9,-38],[0,-38],[-10,-13],[10,-13]]){x.save();x.fillStyle=rgba(SP.core,0.8*f);x.beginPath();x.arc(q[0],q[1],1.1,0,Math.PI*2);x.fill();x.restore();}
  }else if(key==="village5-b"){ // a watching stone: a tall leaning slab with slit eyes and a split for a mouth
    witchPool(x,0,2,34,0.3*f);witchGlow(x,0,-30,46,0.3*f);
    x.rotate(0.14);P([[-13,4],[-15,-28],[-11,-50],[-3,-58],[6,-55],[12,-44],[14,-20],[13,4]]);
    x.beginPath();x.ellipse(-9,-50,6,3.4,-0.6,0,Math.PI*2);x.fill();
    lit(x,slitEye(-5,-38,9,3.2,2.4),f);lit(x,slitEye(6,-37,8,3,-2.2),f);
    lit(x,[[0,-30],[2,-26],[-1,-22],[3,-17],[0,-12],[2,-6],[-1,-6],[-2,-12],[-4,-17],[-2,-22],[-3,-26]],f);
  }else if(key==="town-a"){ // a cellar grate: hot light from below, a hand gripping the bars
    witchGlow(x,0,-10,62,0.36*f);
    P([[-34,4],[-32,-24],[32,-24],[34,4]]);
    lit(x,[[-26,-2],[-25,-19],[25,-19],[26,-2]],f);
    for(let i=-18;i<=18;i+=9)x.fillRect(i-1.8,-20,3.6,19);x.fillRect(-27,-11,54,2.6);
    for(const q of [[-6,0],[-1,-1.5],[4,-1],[9,0.5]]){x.beginPath();x.moveTo(q[0]-2.2,-17);x.quadraticCurveTo(q[0]-2.6,-26+q[1],q[0]+0.8,-28+q[1]);x.quadraticCurveTo(q[0]+4.2,-27+q[1],q[0]+3.4,-22+q[1]);x.lineTo(q[0]+2.2,-17);x.closePath();x.fill();
      x.beginPath();x.moveTo(q[0]+3.2,-22+q[1]);x.lineTo(q[0]+4.6,-19.5+q[1]);x.lineTo(q[0]+2.4,-21+q[1]);x.closePath();x.fill();}
    x.beginPath();x.moveTo(-10,-14);x.quadraticCurveTo(-15,-17,-13,-23);x.quadraticCurveTo(-10,-22,-7,-17);x.closePath();x.fill();
    x.beginPath();x.moveTo(-8,-12);x.lineTo(13,-12);x.lineTo(12,-17);x.lineTo(-7,-17);x.closePath();x.fill(); // the back of the hand behind the bars
  }else if(key==="town-b"){ // a grotesque carved post: light in its eyes and gaping mouth
    witchPool(x,0,2,34,0.32*f);witchGlow(x,0,-26,50,0.3*f);
    P([[-15,4],[-14,-38],[14,-38],[15,4]]);P([[-18,-38],[-18,-44],[18,-44],[18,-38]]);
    P([[-14,-36],[-20,-48],[-11,-40]]);P([[14,-36],[20,-48],[11,-40]]); // horns
    P([[-16,-30],[16,-30],[13,-25],[-13,-25]]); // a heavy brow
    lit(x,slitEye(-7,-22,8,4,1.5),f);lit(x,slitEye(7,-22,8,4,-1.5),f);
    lit(x,[[-9,-14],[0,-17],[9,-14],[10,-6],[0,-2],[-10,-6]],f);
    P([[-7,-14.5],[-5,-9],[-3,-15.5]]);P([[3,-15.5],[5,-9],[7,-14.5]]);P([[-4,-3],[-2,-8],[0,-2.5]]);P([[1,-2.5],[3,-8],[5,-3.5]]); // fangs
  }else if(key==="moor-a"){ // an iron fire basket on three legs: its straps make a snarling face, witch-fire inside
    witchPool(x,0,2,26,0.34*f);witchGlow(x,0,-26,40,0.36*f);
    const fl=rm?0:Math.sin(t*3.1+seed)*1.4;
    lit(x,[[-9,-30],[-6.5,-38-fl],[-4,-33],[-1.5,-43+fl],[1.5,-34],[4,-41-fl],[6.5,-33],[9,-30]],f);
    x.lineWidth=1.9;x.beginPath();x.moveTo(-6,-15);x.lineTo(-10.5,3);x.moveTo(6,-15);x.lineTo(10.5,3);x.moveTo(0,-14);x.lineTo(0,3);x.stroke();
    x.lineWidth=1.3;x.beginPath();x.moveTo(-8.6,-5);x.lineTo(8.6,-5);x.stroke();x.fillRect(-12,2,4,1.6);x.fillRect(8,2,4,1.6);x.fillRect(-1.6,2,3.2,1.6);
    x.beginPath();x.moveTo(-12.5,-30);x.quadraticCurveTo(-12,-19,-6,-14);x.lineTo(6,-14);x.quadraticCurveTo(12,-19,12.5,-30);x.closePath();x.fill();
    x.fillRect(-13.5,-31.5,27,2.6);
    lit(x,[[-8.5,-27],[-3,-24],[-3.4,-22.8],[-8,-24.8]],f);lit(x,[[8.5,-27],[3,-24],[3.4,-22.8],[8,-24.8]],f);
    lit(x,[[-7,-20.6],[-3.6,-19.4],[0,-19.8],[3.6,-19.4],[7,-20.6],[5.2,-16.6],[0,-15.6],[-5.2,-16.6]],f);
    P([[-5.6,-20.2],[-4.6,-17.6],[-3.6,-19.8]]);P([[3.6,-19.8],[4.6,-17.6],[5.6,-20.2]]);P([[-1.6,-15.9],[-0.6,-18.2],[0.4,-15.8]]);P([[1.4,-16],[2.4,-18],[3.2,-16.3]]);
    if(!rm)for(let i=0;i<2;i++){const ph=((t*0.6+i*0.5+seed*0.13)%1);x.save();x.fillStyle=rgba(SP.core,0.8*(1-ph));x.beginPath();x.arc(Math.sin(ph*5+i*2)*4,-36-ph*20,0.9,0,Math.PI*2);x.fill();x.restore();}
  }else if(key==="moor-b"){ // a small iron cage hanging from a crooked post, eyes glowing between the bars
    witchPool(x,8,2,22,0.3*f);
    x.lineWidth=3;x.beginPath();x.moveTo(0,3);x.quadraticCurveTo(-3,-18,-1,-30);x.quadraticCurveTo(1,-40,-2,-48);x.stroke();
    x.lineWidth=2.4;x.beginPath();x.moveTo(-2,-46);x.quadraticCurveTo(6,-50,14,-47);x.lineTo(14,-44);x.stroke();
    x.save();x.translate(14,-44);x.rotate(rm?0:Math.sin(t*0.9+seed)*0.06);
    x.lineWidth=1;x.beginPath();x.moveTo(0,0);x.lineTo(0,5);x.stroke();
    witchGlow(x,0,16,30,0.4*f);
    lit(x,circPts(0,16,7,9,14,0,Math.PI*2),f*0.3);
    lit(x,[[-6.4,12.6],[-1.2,15.2],[-1.6,16.8],[-6,15]],f);lit(x,[[6.4,12.6],[1.2,15.2],[1.6,16.8],[6,15]],f);
    x.beginPath();x.moveTo(-8,8);x.quadraticCurveTo(-8,4,0,4);x.quadraticCurveTo(8,4,8,8);x.closePath();x.fill();
    x.beginPath();x.ellipse(0,26,8.5,2,0,0,Math.PI*2);x.fill();x.fillRect(-1.4,26,2.8,3);
    x.lineWidth=1.1;for(const i of [-2,-1,0,1,2]){const bx=i*3.6;x.beginPath();x.moveTo(bx*1.05,7);x.quadraticCurveTo(bx*1.22,16,bx,26);x.stroke();}
    x.beginPath();x.moveTo(-8.4,17);x.quadraticCurveTo(0,18.2,8.4,17);x.stroke();
    for(const q of [[2.6,0],[3.6,-0.6],[4.6,0.2]]){x.beginPath();x.moveTo(q[0],21+q[1]);x.quadraticCurveTo(q[0]+0.8,18.6+q[1],q[0]+1.8,19.6+q[1]);x.stroke();} // bony fingers on a bar
    x.restore();
  }else if(key==="forest-a"){ // a carved wooden idol: a long grim face cut into an old post, half swallowed by roots
    witchPool(x,0,2,24,0.3*f);witchGlow(x,0,-26,36,0.32*f);
    x.rotate(0.07);
    x.beginPath();x.moveTo(-7,3);x.quadraticCurveTo(-8.5,-20,-7.5,-40);x.lineTo(-5,-44);x.lineTo(-2,-41);x.lineTo(0,-47);x.lineTo(2.5,-42);x.lineTo(5,-45);x.lineTo(7.5,-40);x.quadraticCurveTo(8.5,-20,7,3);x.closePath();x.fill();
    lit(x,[[-5.6,-33],[-1.2,-29.6],[-1.6,-28.4],[-5.2,-30.8]],f);lit(x,[[5.6,-33],[1.2,-29.6],[1.6,-28.4],[5.2,-30.8]],f);
    lit(x,[[-0.6,-28],[0.6,-28],[0.9,-21],[-0.9,-21]],f*0.55);
    lit(x,[[-4.5,-17],[0,-18.5],[4.5,-17],[3.8,-14.6],[0,-13.2],[-3.8,-14.6]],f);
    lit(x,[[-5,-37],[5,-37],[4.6,-35.8],[-4.6,-35.8]],f*0.5);
    P([[-15,4],[-9,-1],[-8,-7],[-5,-10],[-2,-9],[-6,-5],[-7,0],[-4,4]]);
    P([[14,4],[9,-2],[8,-9],[5,-14],[1,-12.5],[6,-8],[6.5,-2],[5,4]]);
    x.lineWidth=2.2;x.beginPath();x.moveTo(-8,-3);x.quadraticCurveTo(-1,-10,7,-6);x.moveTo(-9,2);x.quadraticCurveTo(0,-3,9,1);x.stroke();
  }else{ // forest-b: a mask nailed to a stump, light glaring through its eye-holes from behind
    witchPool(x,0,2,26,0.3*f);
    P([[-16,4],[-10,-1],[-10,-17],[-6,-14],[-3,-21],[1,-15],[5,-20],[10,-15],[10,-1],[16,4]]);
    witchGlow(x,0,-26,30,0.42*f);
    x.save();x.shadowColor=SP.glow;x.shadowBlur=FX?8+6*SPI:0;x.beginPath();
    x.moveTo(0,-41);x.quadraticCurveTo(9,-41,10,-32);x.quadraticCurveTo(10,-26,8,-23);x.quadraticCurveTo(7,-15,0,-10);x.quadraticCurveTo(-7,-15,-8,-23);x.quadraticCurveTo(-10,-26,-10,-32);x.quadraticCurveTo(-9,-41,0,-41);x.closePath();x.fill();x.restore();
    for(const sd of [-1,1]){x.beginPath();x.moveTo(sd*7,-38);x.quadraticCurveTo(sd*12,-44,sd*11,-49);x.quadraticCurveTo(sd*9,-43,sd*4,-40);x.closePath();x.fill();} // horns on the mask
    lit(x,[[-7.4,-32],[-2,-29],[-2.4,-27.4],[-6.6,-28.8]],f);lit(x,[[7.4,-32],[2,-29],[2.4,-27.4],[6.6,-28.8]],f);
    lit(x,[[-4,-19.6],[0,-21],[4,-19.6],[3,-16.6],[0,-15.4],[-3,-16.6]],f);
    P([[-2.8,-19.9],[-2,-17.6],[-1.2,-20.4]]);P([[1.2,-20.4],[2,-17.6],[2.8,-19.9]]);
    x.save();x.fillStyle="#2a2620";x.beginPath();x.arc(0,-37.4,1.2,0,Math.PI*2);x.fill();x.restore(); // the nail
  }
  x.restore();
}
/* ============================== the wanderer: hood, lantern, red scarf, a thin moonlit edge ============================== */
function lanternXform(x,p,t,walking,rm){
  const sw=walking?Math.sin(p+0.6)*(rm?0.12:0.32):Math.sin(t*1.1)*0.06;
  x.translate(-9.5,-33.5);x.rotate(sw);
}
function wandererSil(x,t,walking,rm){
  const p=walking?t*7:0,bob=walking?Math.abs(Math.sin(p))*1.1:0,s1=Math.sin(p)*7;
  x.lineCap="round";x.lineJoin="round";
  for(const lg of [[-2,s1],[2.2,-s1]]){
    const hx2=lg[0],s=lg[1],kx=hx2+s*0.45,ky=-12.5+Math.abs(s)*0.15,fx=hx2+s;
    x.lineWidth=4.4;x.beginPath();x.moveTo(hx2,-25-bob);x.lineTo(kx,ky);x.lineTo(fx,-3);x.stroke();
    x.beginPath();x.moveTo(fx-2.6,-5.5);x.lineTo(fx+2.2,-5.5);x.lineTo(fx+5.6,-1.4);x.lineTo(fx+5.6,0.6);x.lineTo(fx-3,0.6);x.closePath();x.fill();
  }
  x.save();x.translate(0,-bob);
  const sw=Math.sin(t*(rm?1.4:3))*(rm?0.6:1.8),bil=walking?(rm?2:4.5)+Math.sin(p*0.5)*(rm?0.4:1.2):1;
  x.beginPath();x.moveTo(-8.5,-56);x.lineTo(8.5,-56);x.quadraticCurveTo(12.5,-38,11.5+sw*0.4,-20);
  const hem=[[8,-16.5],[5,-20.5],[1.5,-16],[-2,-20],[-5.5,-15.5],[-9,-19.5],[-12-bil,-15],[-15-bil,-19.5]];
  for(const h of hem)x.lineTo(h[0],h[1]+(walking?Math.sin(p*1.3+h[0]*0.25)*(rm?0.3:0.9):0));
  x.quadraticCurveTo(-14-bil*0.6,-36,-8.5,-56);x.closePath();x.fill();
  x.beginPath();x.moveTo(-10,-58);x.lineTo(10,-58);x.lineTo(12.5,-48);x.lineTo(9,-45);x.lineTo(6.5,-47.5);x.lineTo(3,-44);x.lineTo(0,-47);x.lineTo(-3.5,-43.5);x.lineTo(-7,-46.5);x.lineTo(-10.5-bil*0.3,-44);x.lineTo(-13-bil*0.4,-47);x.closePath();x.fill();
  const tip=walking?Math.sin(p)*0.8:2.5;
  x.beginPath();x.moveTo(-7,-55);x.quadraticCurveTo(-11,-64,-8.5,-71);
  x.quadraticCurveTo(-14-bil*0.5,-73,-19-bil,-66+tip);x.quadraticCurveTo(-13-bil*0.4,-70.5,-6.5,-75.5);
  x.quadraticCurveTo(1,-81,7,-75);x.quadraticCurveTo(10.5,-71,10,-65);x.quadraticCurveTo(9.4,-61,7.2,-60.5);x.quadraticCurveTo(8,-57.5,6.5,-55);x.closePath();x.fill();
  x.lineWidth=3.8;x.beginPath();x.moveTo(5,-52);x.lineTo(12,-44);x.lineTo(17,-37.5);x.stroke();
  x.lineWidth=2.4;x.beginPath();x.moveTo(14.6,-41.6);x.lineTo(20.2,-32.6);x.stroke();
  x.beginPath();x.arc(14.2,-38.8,1.9,0,Math.PI*2);x.fill();
  taper(x,[18.6,-36.2,49,-21,2.8,0.5]);
  x.lineWidth=3.6;x.beginPath();x.moveTo(-5,-51);x.lineTo(-8.5,-42);x.lineTo(-9.5,-34.5);x.stroke();
  x.save();lanternXform(x,p,t,walking,rm);
  x.lineWidth=1.1;x.beginPath();x.arc(0,1.2,1.4,0,Math.PI*2);x.stroke();x.beginPath();x.moveTo(0,2.6);x.lineTo(0,5);x.stroke();
  x.beginPath();x.moveTo(-3.2,5);x.lineTo(3.2,5);x.lineTo(4.4,7.2);x.lineTo(-4.4,7.2);x.closePath();x.fill();
  x.lineWidth=1.2;x.strokeRect(-3.8,7.2,7.6,8.8);x.fillRect(-4.4,16,8.8,1.8);
  x.restore();
  x.restore();
}
function wandererDetail(x,t,walking,rm){
  const p=walking?t*7:0,bob=walking?Math.abs(Math.sin(p))*1.1:0;
  x.save();x.translate(0,-bob);
  x.fillStyle="#b3261e";
  x.beginPath();x.moveTo(-7.5,-58.5);x.lineTo(7,-58.5);x.lineTo(6.5,-55);x.lineTo(-8,-55);x.closePath();x.fill();
  const L=walking?30:20,amp=walking?(rm?1.4:3.6):(rm?0.6:1.2),fq=rm?2.5:7;
  for(let k=0;k<2;k++){
    const top=[],bot=[];
    for(let i=0;i<=7;i++){const u=i/7,px=-6-u*(L-k*7)*(walking?1:0.5),py=-56.5+k*2.6+u*(walking?4:17)+Math.sin(t*fq+u*5+k*1.3)*u*amp,hw=1.7-u*0.8;top.push([px,py-hw]);bot.push([px,py+hw]);}
    x.beginPath();x.moveTo(top[0][0],top[0][1]);for(const q of top)x.lineTo(q[0],q[1]);for(let i=bot.length-1;i>=0;i--)x.lineTo(bot[i][0],bot[i][1]);x.closePath();x.fill();
  }
  x.strokeStyle="rgba(255,231,184,0.8)";x.lineWidth=0.8;x.beginPath();x.moveTo(20,-36.7);x.lineTo(48.4,-21.6);x.stroke();
  x.save();lanternXform(x,p,t,walking,rm);
  x.fillStyle="#ffdf9a";x.shadowColor="#ffc35a";x.shadowBlur=FX?9:0;x.fillRect(-3.2,7.8,6.4,7.6);x.shadowBlur=0;
  x.strokeStyle=INK;x.lineWidth=0.9;x.beginPath();x.moveTo(-1.1,7.8);x.lineTo(-1.1,15.4);x.moveTo(1.1,7.8);x.lineTo(1.1,15.4);x.stroke();
  x.restore();
  x.restore();
}
function drawWanderer(x,X,Y,t,walking,facing,rm,edge){
  const S=1.32,f=facing||1,p=walking?t*7:0,bob=walking?Math.abs(Math.sin(p))*1.1:0;
  const lx=X+f*(-9.5)*S,ly=Y+(-33.5+12-bob)*S;
  let g;if(FX){g=x.createRadialGradient(lx,ly,2,lx,ly,74);g.addColorStop(0,"rgba(255,201,106,0.42)");g.addColorStop(1,"rgba(255,201,106,0)");x.fillStyle=g;x.fillRect(lx-76,ly-76,152,152);}
  x.save();x.translate(X+1.3,Y-1.3);x.scale(f*S,S);x.fillStyle=x.strokeStyle=edge||"rgba(255,231,184,0.9)";wandererSil(x,t,walking,rm);x.restore();
  x.save();x.translate(X,Y);x.scale(f*S,S);x.fillStyle=x.strokeStyle=INK;wandererSil(x,t,walking,rm);wandererDetail(x,t,walking,rm);x.restore();
  if(FX){g=x.createRadialGradient(X,Y+1,1,X,Y+1,30);g.addColorStop(0,"rgba(255,201,106,0.2)");g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(X-32,Y-6,64,14);}
}
/* ============================== monsters (silhouette, then details) ============================== */
const MONSTER={
  hatmaw(x,t,m,rm){
    const hop=Math.max(0,Math.sin(t*(rm?1.4:2.6)+m.ph)),dy=-hop*(rm?3:9),sq=1-hop*0.06;
    x.save();x.translate(0,dy);x.scale(1/sq,sq);
    x.beginPath();x.ellipse(0,-7,34,6.5,0,0,Math.PI*2);x.fill();
    x.beginPath();x.moveTo(-21,-9);x.bezierCurveTo(-25,-34,-11,-52,4,-66);x.bezierCurveTo(12,-75,27,-73,24,-61);x.bezierCurveTo(21,-55,13,-58,15,-63);
    x.bezierCurveTo(10,-52,23,-31,21,-9);x.closePath();x.fill();
    x.restore();
    return (c,o)=>{c.save();c.translate(0,dy);c.scale(1/sq,sq);
      if(o.emberMouth)emberMouth(c,[[-22,-30],[-16,-34],[-10,-34.2],[-4,-32],[1,-29],[-2,-23],[-8,-17],[-14,-15.8],[-21,-17]],-11,-23,14);
      else{c.fillStyle="#4a0a12";c.beginPath();c.moveTo(-22,-30);c.quadraticCurveTo(-10,-38,1,-29);c.quadraticCurveTo(-8,-14,-21,-17);c.closePath();c.fill();}
      c.fillStyle="#d8ccb6";
      for(let i=0;i<4;i++){const tx=-19+i*5;c.beginPath();c.moveTo(tx,-31+i*0.6);c.lineTo(tx+2,-25.5);c.lineTo(tx+4,-31.6+i*0.6);c.closePath();c.fill();}
      for(let i=0;i<3;i++){const tx=-18+i*5.5;c.beginPath();c.moveTo(tx,-17.5);c.lineTo(tx+2.2,-23);c.lineTo(tx+4.4,-17.2);c.closePath();c.fill();}
      c.fillStyle=o.emberMouth?"#3a0806":"#6b1420";c.beginPath();c.ellipse(-10,-20,5,2.2,0.3,0,Math.PI*2);c.fill();
      c.strokeStyle="#c9a25a";c.lineWidth=1.4;c.strokeRect(-6,-15,9,6);
      eyes(c,o,[[-13,-41,0.35],[-5,-43,0.15]],3.4,1.4);
      c.restore();};
  },
  ghoul(x,t,m,rm){
    const c1=Math.sin(t*(rm?1.2:2.4)+m.ph),bob=Math.abs(c1)*(rm?0.8:2);
    x.save();x.translate(0,-bob);
    x.lineWidth=4.6;
    x.beginPath();x.moveTo(12,-36);x.lineTo(3,-19+c1);x.lineTo(10,-5);x.lineTo(3+c1*3,bob);x.stroke();
    x.beginPath();x.moveTo(16,-36);x.lineTo(9,-18-c1);x.lineTo(18,-5);x.lineTo(13-c1*3,bob);x.stroke();
    x.beginPath();x.moveTo(19,-34);x.bezierCurveTo(28,-58,12,-80,-10,-76);x.quadraticCurveTo(-20,-72,-22,-64);x.quadraticCurveTo(-4,-58,7,-34);x.closePath();x.fill();
    for(let i=0;i<6;i++){const u=i/5,bx=lerp(22,-8,u),by=lerp(-50,-77,u)-Math.sin(u*Math.PI)*8,a=-0.6-u*0.9;
      x.beginPath();x.moveTo(bx-3,by+2);x.lineTo(bx+Math.cos(a)*9,by+Math.sin(a)*9);x.lineTo(bx+3,by+1);x.closePath();x.fill();}
    x.beginPath();x.ellipse(-26,-61,8.5,7,0.45,0,Math.PI*2);x.fill();
    x.beginPath();x.moveTo(-29,-58);x.lineTo(-41,-50);x.lineTo(-27,-54);x.closePath();x.fill();
    x.lineWidth=3.6;
    x.beginPath();x.moveTo(-10,-67);x.quadraticCurveTo(-34,-50,-36+c1*3,-6);x.stroke();
    x.beginPath();x.moveTo(-3,-65);x.quadraticCurveTo(-25,-45,-23-c1*3,-8);x.stroke();
    x.lineWidth=1.5;
    for(const hx2 of [-36+c1*3,-23-c1*3])for(let i=0;i<3;i++){x.beginPath();x.moveTo(hx2,-7);x.lineTo(hx2-5+i*2.5,bob+1);x.stroke();}
    x.restore();
    return (c,o)=>{c.save();c.translate(0,-bob);eyes(c,o,[[-30,-63,0.4],[-24,-64,0.4]],2.6,1.5);c.restore();};
  },
  bat(x,t,m,rm){drawBat(x,0,0,1,t*(rm?4:9)+m.ph,INK);return (c,o)=>{eyes(c,o,[[-2.5,-1.5,0],[2.5,-1.5,0]],1.3,1.3);};},
  thorns(x,t,m){
    const r=rng32(hsh(57,Math.round(m.ph))),w=m.w;
    x.lineWidth=3;
    for(let i=0;i<6;i++){const sx=-w/2+r()*w,len=16+r()*22,a=-1.1-r()*0.9;let px=sx,py=2,ca=a;x.beginPath();x.moveTo(px,py);
      for(let j=0;j<5;j++){ca+=(r()-0.5)*0.9+0.18;const nx=px+Math.cos(ca)*len/4.5,ny=py+Math.sin(ca)*len/4.5;x.lineTo(nx,ny);
        x.save();x.translate(nx,ny);x.rotate(ca+(j%2?1.4:-1.4));x.fillRect(0,-0.8,5,1.6);x.restore();px=nx;py=ny;}
      x.stroke();}
    x.beginPath();x.ellipse(0,0,w/2,5,0,Math.PI,0);x.fill();
    return ()=>{};
  }
};
/* ============================== round 11's sample monsters: black silhouettes, ember eyes, outline and inner detail,
   card-puppet joints that move in steps, long angular limbs like the trees ============================== */
const BONE="#d8ccb6";
const pz=(t,rm)=>rm?t*0.5:Math.floor(t*8)/8; // puppet time: poses change in steps, like card puppets
function limb(x,ax,ay,segs){let px=ax,py=ay;for(const g of segs){const nx=px+Math.sin(g[1])*g[0],ny=py+Math.cos(g[1])*g[0];taper(x,[px,py,nx,ny,g[2],g[3]]);px=nx;py=ny;}return[px,py];}
function emberMouth(c,pts,cx,cy,r){ // a glowing throat: hot at the back, dark red at the lips
  c.save();const g=c.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,"#ffc27a");g.addColorStop(0.45,EMBER.danger);g.addColorStop(1,"#5a0c08");
  c.fillStyle=g;c.shadowColor=EMBER.glow;c.shadowBlur=FX?6:0;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.restore();}
function teeth(c,list){c.save();c.fillStyle=BONE;for(const q of list){c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[2],q[3]);c.lineTo(q[4],q[5]);c.closePath();c.fill();}c.restore();}
function seam(c,pts,w){c.save();c.strokeStyle=rgba(EMBER.danger,0.9);c.shadowColor=EMBER.glow;c.shadowBlur=FX?5:0;c.lineWidth=w||1.1;c.lineCap="round";c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.restore();}
Object.assign(MONSTER,{
  crawler(x,t,m,rm){ // small: a low, many-legged thing that scuttles in jerks
    const tq=pz(t*1.3+m.ph,rm),w=Math.sin(tq*6);
    for(let i=0;i<3;i++){const bx=-8+i*9,ph=i%2?w:-w,fw=i<1||(i===1&&ph>0);
      limb(x,bx,-12,[[10,(fw?-2.35:2.35)+ph*0.22,2.6,1.7],[20,(fw?-0.22:0.22)+ph*0.16,1.7,0.6]]);}
    x.beginPath();x.moveTo(-14,-11);x.quadraticCurveTo(-6,-24,6,-22);x.lineTo(9,-27);x.lineTo(11,-21.5);x.lineTo(15,-25);x.lineTo(16,-18.5);x.quadraticCurveTo(21,-12,14,-8);x.quadraticCurveTo(0,-5,-14,-11);x.closePath();x.fill();
    x.beginPath();x.moveTo(-12,-15);x.quadraticCurveTo(-20,-19,-27,-15);x.lineTo(-25,-10);x.quadraticCurveTo(-19,-7,-12,-9);x.closePath();x.fill();
    for(let i=0;i<3;i++){const bx=-6+i*9,ph=i%2?-w:w,fw=i<1||(i===1&&ph>0);
      limb(x,bx,-10,[[9,(fw?-2.2:2.2)+ph*0.22,2.8,1.8],[19,(fw?-0.3:0.3)+ph*0.16,1.8,0.6]]);}
    return (c,o)=>{emberMouth(c,[[-26.5,-13.2],[-19,-12.6],[-14,-12],[-19,-10.4],[-25.4,-11]],-17,-12,8);
      teeth(c,[[-25,-13],[-24,-11.4],[-23,-13],[-21,-12.8],[-20.2,-11.2],[-19.4,-12.7]]);
      seam(c,[[-2,-19],[3,-17],[7,-19]],0.9);eyes(c,o,[[-21,-16.2,0.2],[-17.5,-17.2,0.2]],1.5,1);};
  },
  bat2(x,t,m,rm){ // small flyer: card wings on jointed bones, flapping in steps
    const tq=pz(t*1.6+m.ph,rm),fl=Math.sin(tq*7);
    for(const sd of [-1,1]){
      const a1=sd*(1.95-fl*0.55),e=[sd*3+Math.sin(a1)*9,-2+Math.cos(a1)*9],a2=a1+sd*(0.55+fl*0.35),wr=[e[0]+Math.sin(a2)*8,e[1]+Math.cos(a2)*8];
      const tips=[0,1,2].map(k=>{const a=a2+sd*(0.35+k*0.45),L=[14,12,9][k];return[wr[0]+Math.sin(a)*L,wr[1]+Math.cos(a)*L];});
      const mem=[[sd*2,-3],e,wr,tips[0]];for(let k=1;k<3;k++){const p0=tips[k-1],p1=tips[k];mem.push([(p0[0]+p1[0])/2*0.82+wr[0]*0.18,(p0[1]+p1[1])/2*0.82+wr[1]*0.18],p1);}
      mem.push([sd*5,4],[sd*2,3]);
      x.beginPath();mem.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();
      x.lineWidth=1.4;x.beginPath();x.moveTo(sd*3,-2);x.lineTo(e[0],e[1]);x.lineTo(wr[0],wr[1]);for(const tp of tips){x.moveTo(wr[0],wr[1]);x.lineTo(tp[0],tp[1]);}x.stroke();}
    x.beginPath();x.ellipse(0,0,3.6,6.5,0,0,Math.PI*2);x.fill();x.beginPath();x.ellipse(0,-6.5,3.2,3,0,0,Math.PI*2);x.fill();
    x.beginPath();x.moveTo(-3,-8);x.lineTo(-3.6,-13);x.lineTo(-0.8,-9);x.moveTo(3,-8);x.lineTo(3.6,-13);x.lineTo(0.8,-9);x.fill();
    return (c,o)=>{emberMouth(c,[[-1.8,-4.6],[1.8,-4.6],[1.2,-2.6],[0,-2],[-1.2,-2.6]],0,-4,3);teeth(c,[[-1.6,-4.6],[-1.1,-3],[-0.6,-4.6],[0.6,-4.6],[1.1,-3],[1.6,-4.6]]);
      eyes(c,o,[[-1.6,-7.2,0.3],[1.6,-7.2,-0.3]],1.1,0.8);};
  },
  ghoul2(x,t,m,rm){ // medium: a hunched thing on angled legs, arms that reach the ground, a long jaw hanging open
    const tq=pz(t+m.ph,rm),s1=Math.sin(tq*3),bob=Math.abs(s1)*2,op=3+Math.max(0,Math.sin(tq*1.7))*3;
    x.save();x.translate(0,-bob);
    for(const q of [[s1,5],[-s1,11]])limb(x,q[1],-48,[[21,-0.45+q[0]*0.25,6.5,4.2],[19,0.65-q[0]*0.2,4.2,3],[11,-0.25,3,1.4]]);
    x.beginPath();x.moveTo(15,-50);x.quadraticCurveTo(18,-72,-2,-86);x.quadraticCurveTo(-12,-91,-20,-84);x.quadraticCurveTo(-6,-76,2,-47);x.closePath();x.fill();
    for(let i=0;i<5;i++){const u=i/4,bx=lerp(15,-6,u),by=lerp(-58,-86,u)-Math.sin(u*Math.PI)*5;x.beginPath();x.moveTo(bx-2.4,by+1.6);x.lineTo(bx+3+u*2,by-6);x.lineTo(bx+2.4,by+1.4);x.closePath();x.fill();}
    x.beginPath();x.moveTo(-15,-87);x.lineTo(-30,-89);x.lineTo(-40,-84);x.lineTo(-39,-80);x.lineTo(-18,-79);x.closePath();x.fill();
    x.beginPath();x.moveTo(-18,-78);x.lineTo(-37,-79+op);x.lineTo(-35,-75+op);x.lineTo(-17,-73);x.closePath();x.fill();
    for(const q of [[-s1,-8],[s1,-14]]){const h=limb(x,q[1],-82,[[25,-0.4+q[0]*0.22,4.6,3.4],[27,-0.08-q[0]*0.25,3.4,2.2]]);
      x.lineWidth=1.4;for(let k=0;k<3;k++){x.beginPath();x.moveTo(h[0],h[1]);x.lineTo(h[0]-5+k*2.6,h[1]+5.5);x.lineTo(h[0]-7+k*2.6,h[1]+6.5);x.stroke();}}
    x.restore();
    return (c,o)=>{c.save();c.translate(0,-bob);
      emberMouth(c,[[-18,-78.6],[-38,-79.4],[-36,-77.6+op],[-18,-73.6]],-22,-77,12);
      teeth(c,[[-35,-79.2],[-33.6,-76.4],[-32.2,-79.1],[-30,-78.9],[-28.8,-76],[-27.4,-78.8],[-25,-78.7],[-24,-76.2],[-23,-78.6],
               [-34,-76.4+op],[-32.8,-78.8+op*0.6],[-31.6,-76.2+op],[-28.6,-75.8+op*0.8],[-27.6,-78.2+op*0.4],[-26.6,-75.6+op*0.8]]);
      seam(c,[[10,-62],[7,-66],[9,-70]],1);seam(c,[[2,-74],[-1,-78]],1);
      eyes(c,o,[[-33,-85,0.3],[-27,-86,0.3]],2.2,1.2);c.restore();};
  },
  walker(x,t,m,rm){ // large: a tall stilted tree-thing with a hollow chest glowing inside, branch arms and a crown of twigs
    const tq=pz(t*0.6+m.ph,rm),s1=Math.sin(tq*2.4);
    x.save();x.scale(1.15,1); // 15% wider
    for(const q of [[s1,-3],[-s1,5]])limb(x,q[1],-112,[[44,-0.2+q[0]*0.18,8,6],[46,0.32-q[0]*0.16,6,4],[20,-0.12,4,2]]);
    x.beginPath();x.moveTo(-8,-108);x.quadraticCurveTo(-12,-140,-6,-168);x.lineTo(8,-168);x.quadraticCurveTo(14,-140,10,-108);x.closePath();x.fill();
    x.save();x.globalCompositeOperation="destination-out";x.beginPath();x.ellipse(1,-140,5.5,13,0.05,0,Math.PI*2);x.fill();x.restore();
    x.beginPath();x.moveTo(-5,-168);x.quadraticCurveTo(-4,-178,1,-182);x.quadraticCurveTo(7,-178,7,-168);x.closePath();x.fill();
    for(const q of [[-1,-180,-2.6],[3,-181,-0.4],[5,-179,0.9]]){limb(x,q[0],q[1],[[10,q[2]+Math.PI,2.2,1.2],[7,q[2]+Math.PI+(q[2]<0?-0.7:0.7),1.2,0.5]]);}
    for(const q of [[-s1,-6,-1],[s1,8,1]]){const sh=[q[1],-164],h=limb(x,sh[0],sh[1],[[30,q[2]*0.5+q[0]*0.2,4.4,3.2],[34,q[2]*0.12-q[0]*0.2,3.2,2],[14,q[2]*-0.3,2,1]]);
      limb(x,h[0],h[1],[[8,q[2]*0.8,1.2,0.5]]);limb(x,h[0],h[1],[[9,-q[2]*0.4,1.2,0.5]]);limb(x,(sh[0]+h[0])/2,(sh[1]+h[1])/2+8,[[10,q[2]*1.3,1.6,0.6]]);}
    x.restore();
    return (c,o)=>{c.save();c.scale(1.15,1);
      c.save();const g=c.createRadialGradient(1,-138,0,1,-140,14);g.addColorStop(0,"#ffc27a");g.addColorStop(0.5,EMBER.danger);g.addColorStop(1,"#5a0c08");
      c.fillStyle=g;c.shadowColor=EMBER.glow;c.shadowBlur=FX?8:0;c.beginPath();c.ellipse(1,-140,5.5,13,0.05,0,Math.PI*2);c.fill();c.restore();
      c.fillStyle=INK;for(let i=0;i<4;i++){const y=-150+i*6;c.beginPath();c.moveTo(-6,y);c.quadraticCurveTo(1,y-2.2,8,y);c.lineTo(8,y+1.6);c.quadraticCurveTo(1,y-0.6,-6,y+1.6);c.closePath();c.fill();}
      emberMouth(c,[[-3,-171.5],[4,-171.5],[3,-170],[-2,-170]],0.5,-171,4);
      seam(c,[[-4,-120],[-2,-126],[-4,-131]],1.1);
      eyes(c,o,[[-2,-175.5,0.2],[3,-175.5,-0.2]],1.6,1);c.restore();};
  }
});
function eyes(c,o,list,rx,ry){
  c.save();c.fillStyle=o.dcol;c.shadowColor=o.dglow;c.shadowBlur=FX?7:0;
  for(const e of list){c.beginPath();c.ellipse(e[0],e[1],rx,ry,e[2],0,Math.PI*2);c.fill();}
  c.restore();
}
function drawBat(x,X,Y,k,ph,col){if(KIT.fly)return drawFlyerKit(x,'bat',X,Y,k,ph,col);
  const fl=Math.sin(ph);x.save();x.translate(X,Y);x.scale(k,k);x.fillStyle=col;
  x.beginPath();x.moveTo(0,-3);x.quadraticCurveTo(-10,-6-fl*8,-20,-2-fl*12);x.quadraticCurveTo(-16,0,-14,4-fl*4);x.quadraticCurveTo(-10,2,-6,5);x.quadraticCurveTo(-3,3,0,6);
  x.quadraticCurveTo(3,3,6,5);x.quadraticCurveTo(10,2,14,4-fl*4);x.quadraticCurveTo(16,0,20,-2-fl*12);x.quadraticCurveTo(10,-6-fl*8,0,-3);x.fill();
  x.beginPath();x.ellipse(0,0,3.5,5,0,0,Math.PI*2);x.fill();x.beginPath();x.moveTo(-3,-3);x.lineTo(-2.5,-8);x.lineTo(-0.5,-4);x.moveTo(3,-3);x.lineTo(2.5,-8);x.lineTo(0.5,-4);x.fill();
  x.restore();
}
/* ============================== health, mana, score (sketch): Gale's bars in Lantern Box's brass plaque ============================== */
function heart(x,cx,cy,r){x.beginPath();x.moveTo(cx,cy+r*0.9);x.bezierCurveTo(cx-r*1.4,cy-r*0.1,cx-r*0.6,cy-r*1.2,cx,cy-r*0.4);x.bezierCurveTo(cx+r*0.6,cy-r*1.2,cx+r*1.4,cy-r*0.1,cx,cy+r*0.9);x.closePath();}
function flame(x,cx,cy,r){x.beginPath();x.moveTo(cx,cy-r*1.2);x.quadraticCurveTo(cx+r*1.1,cy,cx+r*0.5,cy+r*0.8);x.quadraticCurveTo(cx,cy+r*1.1,cx-r*0.5,cy+r*0.8);x.quadraticCurveTo(cx-r*1.1,cy,cx,cy-r*1.2);x.closePath();}
function plaque(x,X,Y,w,h,n){x.beginPath();x.moveTo(X+n,Y);x.lineTo(X+w-n,Y);x.lineTo(X+w,Y+n);x.lineTo(X+w,Y+h-n);x.lineTo(X+w-n,Y+h);x.lineTo(X+n,Y+h);x.lineTo(X,Y+h-n);x.lineTo(X,Y+n);x.closePath();}
function drawHUD(x,W){
  const b="#c9a25a",hp=4/5,mp=3/4,L=46,Wb=184;x.save();x.textBaseline="middle";
  plaque(x,14,14,232,52,8);x.fillStyle="rgba(12,7,9,0.74)";x.fill();x.strokeStyle=b;x.lineWidth=1.5;x.stroke();
  x.fillStyle=b;heart(x,31,30,5.5);x.fill();flame(x,31,50,5);x.fill();
  x.strokeStyle="rgba(201,162,90,0.35)";x.lineWidth=1;x.beginPath();x.moveTo(L,36.5);x.lineTo(L+Wb,36.5);x.moveTo(L,50);x.lineTo(L+Wb,50);x.stroke();
  x.fillStyle="#b3261e";x.beginPath();x.moveTo(L,25);const hw=L+hp*Wb;x.lineTo(hw,25);for(let i=0;i<6;i++)x.lineTo(hw-(i%2?6:0),25+i*2.2);x.lineTo(L,36);x.closePath();x.fill();
  x.strokeStyle="#3fc7b4";x.lineWidth=3;x.lineCap="round";x.beginPath();x.moveTo(L+1,50);x.lineTo(L+mp*Wb,50);x.stroke();
  plaque(x,W-124,14,110,44,8);x.fillStyle="rgba(12,7,9,0.74)";x.fill();x.strokeStyle=b;x.lineWidth=1.5;x.stroke();
  x.fillStyle=b;x.textAlign="center";x.font='11px "Alegreya Sans",sans-serif';x.fillText("SOULS",W-69,26);
  x.font='24px "IM Fell English",Georgia,serif';x.fillText("0450",W-69,45);
  x.restore();
}

/* ============================== the bosses: one per place, painted in washed-out colours taken from the level,
   with ember eyes, mouths and seams and a thin ember outline. Same puppet steps and angular shapes as the others. ============================== */
const BOSS_PAL={ // stronger colours, still taken from each level
  night:{veilTop:"#dcbfe4",veilBot:"#f6cfae",coreTop:"#f4e2f2",coreBot:"#ffe2c6",shade:"#a882ad",deep:"#6c4a78",claw:"#f1dcea",clawShade:"#b991b6",aura:"#f0c9e0"},
  storm:{bone:"#e8bcb9",boneShade:"#b0717a",boneDeep:"#5e2232",socket:"#22070e",tent:"#b4566f",tentLight:"#ef9fb1",tentShade:"#6a2640",sucker:"#f6c6cf"},
  dawn:{robe:"#6b84bb",robeShade:"#3e5288",robeLight:"#a9bbe0",skin:"#b4d0d6",skinShade:"#7c9ea8",hat:"#3d4d80",hatShade:"#283460",band:"#eaa58b",hair:"#1b2034",iron:"#232b40",ironLight:"#56638a",straw:"#e8c69f",strawShade:"#b48c68",handle:"#4a3a2c"},
  mist:{bark:"#707b60",barkShade:"#434b38",barkDeep:"#232a1d",barkLight:"#a9b48f",moss:"#9fbb52"}};
const BOSS_NAME={night:"the veiled ghost",storm:"the tentacled skull",dawn:"the cauldron witch",mist:"the gaping tree"};
function fillP(x,col,pts){x.fillStyle=col;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();}
function strokeP(x,col,w,pts){x.strokeStyle=col;x.lineWidth=w;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();}
function cLimb(x,col,ax,ay,segs){x.fillStyle=col;return limb(x,ax,ay,segs);}
function emberGlow(c,cx,cy,r,a){if(!FX)return;c.save();const g=c.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,rgba("#ffc27a",a));g.addColorStop(0.5,rgba(EMBER.danger,a*0.8));g.addColorStop(1,rgba(EMBER.glow,0));c.fillStyle=g;c.fillRect(cx-r,cy-r,r*2,r*2);c.restore();}
function emberEye(c,cx,cy,rx,ry,rot){c.save();c.fillStyle=EMBER.danger;c.shadowColor=EMBER.glow;c.shadowBlur=FX?8:0;c.beginPath();c.ellipse(cx,cy,rx,ry,rot,0,Math.PI*2);c.fill();c.fillStyle="#ffd9a0";c.beginPath();c.ellipse(cx,cy,rx*0.45,ry*0.45,rot,0,Math.PI*2);c.fill();c.restore();}
function raggedEdge(x0,y0,x1,y1,n,amp,r){const out=[];for(let i=0;i<=n;i++){const u=i/n,j=i%2?amp*(0.5+r()*0.8):-amp*0.2*r();out.push([lerp(x0,x1,u),lerp(y0,y1,u)+j]);}return out;}
function claws(x,col,hx,hy,base,spread,len,sd){ // long curling claws: three joints each, the last a hook
  for(let k=0;k<4;k++){const a0=base+(k-1.5)*spread;let px=hx,py=hy,a=a0,w=2.8;
    for(let j=0;j<3;j++){const L=len*(j===0?0.45:j===1?0.35:0.3),nx=px+Math.sin(a)*L,ny=py+Math.cos(a)*L,w2=j===2?0.4:w*0.75;x.fillStyle=col;taper(x,[px,py,nx,ny,w,w2]);px=nx;py=ny;w=w2;a+=sd*0.55;}}
}
const BOSS={
  night(x,t,rm){ // the veiled ghost: thin, its body bending one way then another, arms set low and angled down, coloured like the night sky
    const P=BOSS_PAL.night,tq=pz(t*0.7,rm),hv=8+Math.sin(tq*2)*4,k1=Math.sin(tq*1.3)*5,k2=Math.sin(tq*1.3+2)*5,a1=Math.sin(tq*1.7)*0.14,a2=Math.sin(tq*1.7+1.4)*0.14;
    x.save();x.translate(0,-hv);
    const sp=[[0,-2],[-9+k1*0.4,-56],[8+k2*0.5,-108],[-4+k1*0.4,-152],[-1,-180]],wd=[22,18,15,12,10];
    const side=(sd,extra)=>sp.map((p,i)=>{const q=sp[Math.min(i+1,sp.length-1)],o=sp[Math.max(i-1,0)],dx=q[0]-o[0],dy=q[1]-o[1],L=Math.hypot(dx,dy)||1;return[p[0]-dy/L*(wd[i]+extra)*sd,p[1]+dx/L*(wd[i]+extra)*sd];});
    const grad=(top,bot)=>{const g=x.createLinearGradient(0,-200,0,0);g.addColorStop(0,top);g.addColorStop(1,bot);return g;};
    const L0=side(-1,0),R0=side(1,0);
    x.fillStyle=grad(P.coreTop,P.coreBot);x.beginPath();L0.concat(R0.slice().reverse()).forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();
    x.fillStyle=rgba(P.shade,0.7);x.beginPath();R0.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));for(let i=sp.length-1;i>=0;i--)x.lineTo(lerp(sp[i][0],R0[i][0],0.35),lerp(sp[i][1],R0[i][1],0.35));x.closePath();x.fill();
    for(let i=1;i<sp.length-1;i++)strokeP(x,rgba(P.deep,0.5),1.2,[L0[i],[sp[i][0],sp[i][1]-2],R0[i]]); // seams at every bend
    // the veils follow the bends, wider than the body, ragged at the hem
    const veil=(alpha,extra,seed,sway)=>{const rr=rng32(seed),Lv=side(-1,extra),Rv=side(1,extra),w0=Lv[0][0],w1=Rv[0][0],hem=raggedEdge(w1+6,8,w0-6,8,12,8,rr).map((q,i)=>[q[0],q[1]+Math.sin(tq*3+i)*sway]);
      x.save();x.globalAlpha=alpha;x.fillStyle=grad(P.veilTop,P.veilBot);x.beginPath();x.moveTo(sp[4][0],sp[4][1]-26);
      for(let i=sp.length-1;i>=1;i--)x.lineTo(Rv[i][0],Rv[i][1]);hem.forEach(q=>x.lineTo(q[0],q[1]));for(let i=1;i<sp.length;i++)x.lineTo(Lv[i][0],Lv[i][1]);x.closePath();x.fill();x.restore();};
    veil(0.5,16,71,2.2);veil(0.42,9,72,1.4);
    x.save();x.globalAlpha=0.5;for(let i=1;i<sp.length-1;i++){strokeP(x,P.shade,1.2,[[sp[i+1][0]-6,sp[i+1][1]],[sp[i][0]-10,sp[i][1]],[sp[i-1][0]-12,sp[i-1][1]]]);strokeP(x,"#fff4ec",1.3,[[sp[i+1][0]+5,sp[i+1][1]],[sp[i][0]+7,sp[i][1]],[sp[i-1][0]+9,sp[i-1][1]]]);}x.restore();
    // low-set arms, angled down, hands low and mean
    const shL=[lerp(sp[2][0],L0[2][0],0.9),sp[2][1]+8],shR=[lerp(sp[2][0],R0[2][0],0.6),sp[2][1]+12],sw2=a1*1.6; // both arms reach the same way, swinging together
    const HR=cLimb(x,P.claw,shR[0],shR[1],[[26,-0.55+a1,6,5],[24,-1.05+sw2,5,3.6],[8,-0.6+a1,3.6,3]]);
    const HL=cLimb(x,P.claw,shL[0],shL[1],[[26,-0.7+a1,6,5],[24,-1.2+sw2,5,3.6],[8,-0.75+a1,3.6,3]]);
    x.fillStyle=P.claw;x.beginPath();x.ellipse(HL[0],HL[1],4.6,3.6,0,0,Math.PI*2);x.ellipse(HR[0],HR[1],4.6,3.6,0,0,Math.PI*2);x.fill();
    claws(x,P.claw,HL[0],HL[1],-0.55,0.28,24,1);claws(x,P.claw,HR[0],HR[1],-0.45,0.28,22,1);
    claws(x,P.clawShade,HL[0]+1,HL[1]+1,-0.3,0.26,11,1);claws(x,P.clawShade,HR[0]+1,HR[1]+1,-0.25,0.26,10,1);
    // the hood, tilted along the top of the body, a shadow round the eyes
    const hx=sp[4][0],hy=sp[4][1]-6; // a bigger hood and face
    fillP(x,grad(P.veilTop,P.veilBot),[[hx-21,hy+20],[hx-16,hy-8],[hx+2,hy-26],[hx+17,hy-6],[hx+21,hy+22],[hx,hy+32]]);
    x.save();x.beginPath();[[hx-21,hy+20],[hx-16,hy-8],[hx+2,hy-26],[hx+17,hy-6],[hx+21,hy+22],[hx,hy+32]].forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.clip();
    const fg=x.createRadialGradient(hx,hy+8,1,hx,hy+10,20);fg.addColorStop(0,rgba(P.deep,0.95));fg.addColorStop(0.55,rgba(P.deep,0.6));fg.addColorStop(1,rgba(P.shade,0));x.fillStyle=fg;x.fillRect(hx-24,hy-26,48,60);x.restore(); // darkness deepening behind the eyes
    x.restore();
    return (c,o)=>{c.save();c.translate(0,-hv);emberGlow(c,hx,hy+8,24,0.55);emberEye(c,hx-6,hy+8,4.2,2.8,0.3);emberEye(c,hx+6,hy+8,4,2.7,-0.3);c.restore();};
  },
  storm(x,t,rm){ // the tentacled skull: an angry skull with a working jaw, on a mass of banded, suckered tentacles
    const P=BOSS_PAL.storm,tq=pz(t*0.8,rm),op=4+Math.max(0,Math.sin(tq*1.4))*6;
    const tent=(ax,ay,a0,curl,n,w0,ph)=>{let x0=ax,y0=ay,a=a0,w=w0;const pts=[];
      for(let i=0;i<n;i++){const kink=(i%3===1)?(i%2?1:-1)*(0.55+0.2*Math.sin(ph+i)):0; // sharp elbows every few segments
        a+=curl*(1+i*0.06)*1.6+kink+Math.sin(tq*2+ph+i*0.5)*0.12;const L=(n-i)*0.8+6,nx=x0+Math.sin(a)*L,ny=y0+Math.cos(a)*L,w2=Math.max(1.4,w*0.9);
        x.fillStyle=mixc(P.tentShade,P.tentLight,0.25+0.6*(0.5+0.5*Math.sin(i*0.95+ph*1.7)));taper(x,[x0,y0,nx,ny,w,w2]);pts.push([x0,y0,nx,ny,a,w,w2]);x0=nx;y0=ny;w=w2;}
      pts.forEach((q,i)=>{if(i%3!==2||q[5]<5)return;const al=0.5+0.5*Math.sin(t*(rm?0.3:0.7)+ph*2.1+i*1.3);if(al<0.05)return; // a patch that slowly glows and fades
        x.save();x.globalAlpha=al*0.85;x.fillStyle="#ff9cbf";x.beginPath();x.ellipse((q[0]+q[2])/2,(q[1]+q[3])/2,q[5]*0.55,q[5]*0.32,q[4],0,Math.PI*2);x.fill();x.restore();});
      for(const q of pts){const nx=Math.cos(q[4]),ny=-Math.sin(q[4]),mx=(q[0]+q[2])/2,my=(q[1]+q[3])/2;
        fillP(x,P.tentShade,[[q[0]-nx*q[5]*0.5,q[1]-ny*q[5]*0.5],[q[2]-nx*q[6]*0.5,q[3]-ny*q[6]*0.5],[mx-nx*q[5]*0.15,my-ny*q[5]*0.15]]); // a shaded underside
        fillP(x,P.tentLight,[[q[0]+nx*q[5]*0.42,q[1]+ny*q[5]*0.42],[mx+nx*q[5]*0.05,my+ny*q[5]*0.05],[q[2]+nx*q[6]*0.42,q[3]+ny*q[6]*0.42]]); // the zigzag band
        if(q[5]>4){x.fillStyle=P.sucker;x.beginPath();x.arc(mx-nx*q[5]*0.3,my-ny*q[5]*0.3,q[5]*0.16,0,Math.PI*2);x.fill();x.fillStyle=P.tentShade;x.beginPath();x.arc(mx-nx*q[5]*0.3,my-ny*q[5]*0.3,q[5]*0.07,0,Math.PI*2);x.fill();}}};
    tent(18,-70,-3.0,0.12,13,22,0.4);tent(-26,-40,-1.6,-0.07,12,21,1.2);tent(30,-30,1.9,0.06,13,21,2.1);
    { // the body: a webbed skirt between the tentacle roots, mottled, the colour fading in and out across it
      const web=[[-44,-62],[-58,-30],[-40,-10],[-18,-22],[-6,-4],[12,-18],[30,-6],[48,-24],[58,-48],[42,-66]];
      x.beginPath();x.moveTo(web[0][0],web[0][1]);for(let i=1;i<=web.length;i++){const p0=web[i-1],p1=web[i%web.length],mx=(p0[0]+p1[0])/2,my=(p0[1]+p1[1])/2;x.quadraticCurveTo(mx*0.82,my*0.82-8,p1[0],p1[1]);}x.closePath();
      const g=x.createRadialGradient(-4,-46,4,0,-36,64);g.addColorStop(0,P.tentLight);g.addColorStop(0.45,P.tent);g.addColorStop(1,P.tentShade);x.fillStyle=g;x.fill();
      x.save();x.clip();
      for(let i=0;i<14;i++){const rr=rng32(hsh(88,i)),cx=-50+rr()*100,cy=-64+rr()*58,r0=4+rr()*9,al=0.18+0.22*(0.5+0.5*Math.sin(t*(rm?0.25:0.6)+i*1.7));
        x.fillStyle=rgba(i%3?P.tentShade:P.tentLight,al);x.beginPath();x.ellipse(cx,cy,r0,r0*0.7,rr()*3,0,Math.PI*2);x.fill();}
      for(const q of [[-30,-56,-40,-20],[-10,-58,-12,-14],[12,-58,22,-14],[30,-58,44,-22]])strokeP(x,rgba(P.tentShade,0.65),2,[[q[0],q[1]],[(q[0]+q[2])/2+(q[2]>q[0]?-4:4),(q[1]+q[3])/2],[q[2],q[3]]]);
      x.restore();}
    // the skull
    fillP(x,P.bone,[[-46,-102],[-44,-118],[-34,-132],[-16,-142],[14,-142],[34,-132],[44,-118],[48,-102],[44,-86],[40,-74],[32,-64],[22,-58],[-22,-58],[-32,-64],[-40,-74],[-44,-86]]);
    fillP(x,P.boneShade,[[22,-140],[34,-132],[44,-118],[48,-102],[44,-86],[40,-74],[32,-64],[22,-58],[26,-80],[32,-104],[28,-126]]);
    fillP(x,"#f6d4d0",[[-38,-124],[-18,-138],[-4,-139],[-22,-130],[-40,-110]]);
    { // the same mottling as the body and tentacles, fading in and out across the skull
      x.save();x.beginPath();[[-46,-102],[-44,-118],[-34,-132],[-16,-142],[14,-142],[34,-132],[44,-118],[48,-102],[44,-86],[40,-74],[32,-64],[22,-58],[-22,-58],[-32,-64],[-40,-74],[-44,-86]].forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.clip();
      const sg=x.createLinearGradient(0,-142,0,-58);sg.addColorStop(0,rgba(P.tentLight,0));sg.addColorStop(1,rgba(P.tent,0.55));x.fillStyle=sg;x.fillRect(-50,-145,100,90);
      for(let i=0;i<12;i++){const rr=rng32(hsh(89,i)),cx=-44+rr()*88,cy=-140+rr()*80,r0=4+rr()*8,al=0.16+0.2*(0.5+0.5*Math.sin(t*(rm?0.25:0.6)+i*1.9));
        x.fillStyle=rgba(i%3?P.tent:P.tentLight,al);x.beginPath();x.ellipse(cx,cy,r0,r0*0.7,rr()*3,0,Math.PI*2);x.fill();}
      x.restore();}
    fillP(x,P.boneShade,[[-46,-92],[-40,-90],[-38,-74],[-44,-80]]);fillP(x,P.boneShade,[[46,-92],[40,-90],[38,-74],[44,-80]]); // temples
    fillP(x,P.boneDeep,[[-38,-104],[-6,-96],[-4,-92],[-36,-98]]);fillP(x,P.boneDeep,[[38,-104],[6,-96],[4,-92],[36,-98]]); // angry brow ridges
    fillP(x,P.socket,[[-34,-96],[-8,-91],[-8,-80],[-16,-72],[-30,-76],[-36,-86]]);fillP(x,P.socket,[[34,-96],[8,-91],[8,-80],[16,-72],[30,-76],[36,-86]]);
    fillP(x,P.socket,[[0,-76],[5,-68],[3,-62],[0,-64],[-3,-62],[-5,-68]]);
    fillP(x,P.boneShade,[[-30,-70],[-14,-66],[-24,-62]]);fillP(x,P.boneShade,[[30,-70],[14,-66],[24,-62]]); // cheekbones
    fillP(x,P.bone,[[-26,-58],[26,-58],[24,-50+op],[10,-44+op],[-10,-44+op],[-24,-50+op]]);
    fillP(x,P.boneShade,[[12,-58],[26,-58],[24,-50+op],[10,-44+op]]);
    fillP(x,P.socket,[[-20,-58],[20,-58],[18,-52+op*0.6],[-18,-52+op*0.6]]);
    x.fillStyle="#fbf0e6";for(let i=0;i<6;i++){fillP(x,"#f5e2dc",[[-19+i*6.4,-59],[-14.6+i*6.4,-59],[-15.4+i*6.4,-53],[-18.2+i*6.4,-53]]);fillP(x,"#ecd2cc",[[-16+i*5.6,-53+op*0.6],[-12+i*5.6,-53+op*0.6],[-12.6+i*5.6,-48+op*0.6],[-15.4+i*5.6,-48+op*0.6]]);}
    strokeP(x,P.boneDeep,1.4,[[-8,-141],[-12,-128],[-6,-120],[-11,-108]]);strokeP(x,P.boneDeep,1.2,[[24,-136],[28,-124],[24,-116]]);strokeP(x,P.boneDeep,1,[[-12,-128],[-20,-124]]);
    tent(-36,-40,-2.2,0.03,12,22,3.0);tent(8,-34,-0.5,-0.1,11,20,4.2);
    return (c,o)=>{emberGlow(c,-20,-84,18,0.55);emberGlow(c,20,-84,18,0.55);emberEye(c,-20,-84,4.4,3.2,0.3);emberEye(c,20,-84,4.4,3.2,-0.3);
      emberMouth(c,[[-18,-52],[18,-52],[16,-50+op*0.5],[-16,-50+op*0.5]],0,-51,18);
      seam(c,[[-11,-108],[-14,-100]],1.2);seam(c,[[24,-116],[22,-108]],1.1);};
  },
  dawn(x,t,rm){ // the cauldron witch: tattered robe, crumpled hat, hooked profile, stirring a cauldron painted with flames
    const P=BOSS_PAL.dawn,tq=pz(t*0.8,rm),st=tq*2.2,hx=Math.cos(st)*6,hy=Math.sin(st)*3,lift=Math.sin(tq*1.3)*0.15,r=rng32(3131);
    // the broom, leaning on the cauldron
    strokeP(x,P.handle,3.2,[[-4,-4],[-22,-92]]);
    fillP(x,P.straw,[[-10,2],[6,2],[2,-26],[-4,-30],[-10,-26]]);fillP(x,P.strawShade,[[-2,2],[6,2],[2,-26],[-1,-28]]);
    for(let i=0;i<5;i++)strokeP(x,P.strawShade,0.8,[[-8+i*3,1],[-5+i*1.5,-24]]);fillP(x,P.handle,[[-6,-27],[3,-27],[3,-31],[-6,-31]]);
    // the robe: long and tattered
    const hem=raggedEdge(70,4,-14,4,14,8,r);
    fillP(x,P.robe,[[18,-122],[34,-118],[52,-80],[64,-30]].concat(hem,[[-12,-36],[-6,-90],[2,-118]]));
    fillP(x,P.robeShade,[[34,-118],[52,-80],[66,-24],[60,4],[46,4],[40,-60],[28,-108]]);
    for(const q of [[10,-110,4,2],[22,-100,24,0],[-2,-80,-6,0]])strokeP(x,P.robeShade,1.6,[[q[0],q[1]],[(q[0]+q[2])/2+3,(q[1]+q[3])/2],[q[2],q[3]]]);
    strokeP(x,P.robeLight,1.4,[[4,-112],[-4,-60],[-8,-20]]);
    // hair, straggling over the shoulders
    fillP(x,P.hair,[[-6,-152],[10,-150],[16,-130],[20,-110],[12,-114],[10,-100],[4,-112],[0,-104],[-2,-120],[-8,-130]]);
    // the face, in profile: hooked nose, jutting chin, a wart
    fillP(x,P.skin,[[2,-152],[-6,-152],[-10,-148],[-14,-146],[-24,-139],[-26,-136],[-16,-134],[-13,-130],[-19,-124],[-17,-120],[-10,-121],[-4,-116],[4,-120],[8,-134]]);
    fillP(x,P.skinShade,[[4,-152],[8,-134],[4,-120],[-1,-126],[2,-142]]);
    strokeP(x,P.skinShade,0.9,[[-10,-140],[-6,-138]]);strokeP(x,P.skinShade,0.9,[[-12,-134],[-8,-131]]);
    x.fillStyle=P.skinShade;x.beginPath();x.arc(-20,-137,1.4,0,Math.PI*2);x.fill();
    // the hat: tall, crumpled, bent over at the tip, with a buckled band
    x.save();x.translate(-2,-153);x.rotate(-0.12);
    fillP(x,P.hat,[[-32,2],[-27,-4],[0,-6],[27,-5],[34,1],[22,5],[-22,6]]);fillP(x,P.hatShade,[[8,-5],[27,-5],[34,1],[22,5],[10,4]]);
    fillP(x,P.hat,[[-14,-3],[-10,-20],[-4,-30],[-6,-38],[2,-46],[10,-54],[22,-54],[26,-48],[16,-48],[12,-42],[10,-34],[13,-18],[15,-3]]);
    fillP(x,P.hatShade,[[4,-36],[10,-34],[13,-18],[15,-3],[6,-3],[8,-20]]);
    strokeP(x,P.hatShade,1.2,[[-8,-26],[0,-28]]);
    fillP(x,P.band,[[-13.6,-3],[14.8,-3],[13.6,-9],[-12.4,-9]]);x.strokeStyle=P.hatShade;x.lineWidth=1.4;x.strokeRect(-3,-9.2,6,6);
    x.restore();
    // arms: one stirring, one clawed hand raised
    const sq=pz(t*1.1,rm),sx2=Math.cos(sq*2.6)*0.22,sy2=Math.sin(sq*2.6)*0.18;
    const H1=cLimb(x,P.robe,-2,-112,[[20,-1.55+sx2,9,7],[16,-0.25+sy2,7,6],[12,-1.1+sx2*0.6,6,5]]);
    fillP(x,P.robeShade,[[H1[0]-6,H1[1]-6],[H1[0]+5,H1[1]-8],[H1[0]+4,H1[1]+2],[H1[0]-2,H1[1]+6],[H1[0]-8,H1[1]+1]]);
    x.fillStyle=P.skin;taper(x,[H1[0],H1[1],H1[0]-3,H1[1]+4,5,4]);
    strokeP(x,P.handle,2.6,[[H1[0]-2+hx*0.3,H1[1]-6],[-42+hx,-62+hy]]);
    const H2=cLimb(x,P.robe,10,-114,[[24,-1.3-lift*0.5,8,6.5],[18,-2.4-lift*1.6,6.5,5],[10,-1.7-lift,5,4]]);
    fillP(x,P.robeShade,[[H2[0]-6,H2[1]+8],[H2[0]+6,H2[1]+8],[H2[0]+4,H2[1]-2],[H2[0]-4,H2[1]-4]]);
    claws(x,P.skin,H2[0],H2[1],-0.9-lift,0.32,15,1);
    // the cauldron: three legs, a heavy rim, flames painted round it, an eyeball on the lip
    for(const q of [[-62,2,-58,-12],[-26,2,-30,-12],[-44,4,-44,-12]])fillP(x,P.iron,[[q[0]-3,q[1]],[q[0]+3,q[1]],[q[2]+3,q[3]],[q[2]-3,q[3]]]);
    x.fillStyle=P.iron;x.beginPath();x.ellipse(-44,-34,35,27,0,0,Math.PI*2);x.fill();
    x.fillStyle=P.ironLight;x.beginPath();x.ellipse(-56,-40,8,14,0.3,0,Math.PI*2);x.fill();
    x.fillStyle=P.iron;x.beginPath();x.ellipse(-44,-58,34,8,0,0,Math.PI*2);x.fill();
    x.strokeStyle=P.ironLight;x.lineWidth=1.6;x.beginPath();x.ellipse(-44,-58,33,7,0,Math.PI*1.05,Math.PI*1.95);x.stroke();
    return (c,o)=>{emberEye(c,-8,-142,2.3,1.6,0.2);emberMouth(c,[[-17,-128],[-8,-129],[-6,-126],[-13,-124]],-10,-127,5);teeth(c,[[-15,-128.4],[-14,-126],[-13,-128.6],[-11,-128.8],[-10.2,-126.4],[-9.4,-128.8]]);
      c.save();const g=c.createRadialGradient(-44,-58,0,-44,-58,30);g.addColorStop(0,"#ffc27a");g.addColorStop(0.6,EMBER.danger);g.addColorStop(1,"#5a0c08");c.fillStyle=g;c.shadowColor=EMBER.glow;c.shadowBlur=FX?10:0;c.beginPath();c.ellipse(-44,-58,29,5.2,0,0,Math.PI*2);c.fill();c.restore();
      c.save();c.fillStyle=rgba(EMBER.danger,0.85);c.shadowColor=EMBER.glow;c.shadowBlur=FX?5:0;c.beginPath(); // flames painted on the pot
      c.moveTo(-74,-20);for(let i=0;i<=9;i++){const u=i/9,fx=lerp(-74,-14,u),fy=-20-(i%2?14+Math.sin(i*1.7)*4:2);c.lineTo(fx,fy);}c.lineTo(-14,-14);c.quadraticCurveTo(-44,-4,-74,-14);c.closePath();c.fill();c.restore();
      c.save();c.fillStyle=BONE;c.beginPath();c.arc(-22,-63,4,0,Math.PI*2);c.fill();c.fillStyle=EMBER.danger;c.shadowColor=EMBER.glow;c.shadowBlur=FX?4:0;c.beginPath();c.arc(-23.4,-63.4,1.9,0,Math.PI*2);c.fill();c.fillStyle=INK;c.beginPath();c.arc(-23.8,-63.6,0.8,0,Math.PI*2);c.fill();c.restore();
      for(let i=0;i<3;i++){ // curling ribbons of steam, rising in steps
        const ph=((pz(t*0.35,rm)+i/3)%1),bx=-52+i*8,al=Math.sin(ph*Math.PI)*0.55;if(al<0.03)continue;
        const pts=[];for(let k=0;k<=5;k++){const u=k/5;pts.push([bx+(k%2?1:-1)*(3+u*7)*(i%2?1:-1)+Math.sin(ph*3+i)*3,-62-ph*12-u*(20+ph*10)]);}
        c.save();c.strokeStyle=rgba("#e2e9f7",al);c.lineCap="round";c.lineJoin="round";
        for(let k=0;k<5;k++){c.lineWidth=(1-k/5)*9+2;c.beginPath();c.moveTo(pts[k][0],pts[k][1]);c.lineTo(pts[k+1][0],pts[k+1][1]);c.stroke();}c.restore();}
      const fs=rm?0.3:1;c.save();c.shadowColor=EMBER.glow;c.shadowBlur=FX?8:0; // the fire flickers: each tongue rises and falls on its own
      for(const layer of [[EMBER.danger,1],["#ffc27a",0.55]]){c.fillStyle=layer[0];c.beginPath();c.moveTo(-66,-6);
        for(let i=0;i<=8;i++){const u=i/8,h=i%2?(7+8*(0.5+0.5*Math.sin(t*6.1*fs+i*1.9))+3*Math.sin(t*9.7*fs+i))*layer[1]:2;c.lineTo(lerp(-66,-22,u)+(i%2?Math.sin(t*4.3*fs+i)*1.5:0),-6-h);}
        c.lineTo(-22,-6);c.closePath();c.fill();}
      c.restore();
      emberGlow(c,-44,-12,32,0.34+0.06*Math.sin(t*2.1*fs));};
  },
  mist(x,t,rm){ // the gaping tree: windswept like the forest, leaning and streaming downwind, standing on root legs, with gnarled hands
    const P=BOSS_PAL.mist,tq=pz(t*0.6,rm),a1=Math.sin(tq*1.5)*0.14,a2=Math.sin(tq*1.5+1.7)*0.12,stp=Math.sin(tq*1.1),op=Math.sin(tq*1.2)*4,sw=Math.sin(tq*0.9)*0.04;
    const seg=(x0,y0,x1,y1,w0,w1)=>{x.fillStyle=P.bark;taper(x,[x0,y0,x1,y1,w0,w1]);const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
      x.fillStyle=P.barkShade;taper(x,[x0-nx*w0*0.28,y0-ny*w0*0.28,x1-nx*w1*0.28,y1-ny*w1*0.28,w0*0.42,w1*0.4]);
      strokeP(x,rgba(P.barkDeep,0.7),1,[[x0+nx*w0*0.1,y0+ny*w0*0.1],[(x0+x1)/2+nx*2,(y0+y1)/2+ny*2],[x1+nx*w1*0.1,y1+ny*w1*0.1]]);
      strokeP(x,rgba(P.barkLight,0.6),1,[[x0+nx*w0*0.36,y0+ny*w0*0.36],[x1+nx*w1*0.36,y1+ny*w1*0.36]]);};
    const hand=(hx,hy,a,sd)=>{x.fillStyle=P.bark;x.beginPath();x.ellipse(hx,hy,6,4.6,a,0,Math.PI*2);x.fill(); // a knot of a palm and four long, jointed twig fingers
      for(let k=0;k<4;k++){let px=hx,py=hy,fa=a+(k-1.5)*0.42,w=2.8;for(let j=0;j<3;j++){fa+=sd*(j?0.5:0.15);const L=[10,8,6][j],nx=px+Math.sin(fa)*L,ny=py-Math.cos(fa)*L;x.fillStyle=P.bark;taper(x,[px,py,nx,ny,w,w*0.7]);px=nx;py=ny;w*=0.7;}}};
    // rooted: a flared foot with roots gripping the ground
    const hip=[0,-4];
    fillP(x,P.barkShade,[[-40,2],[-24,-14],[-16,-34],[18,-34],[26,-14],[44,2]]);
    for(const q of [[-1,1.35,34],[-1,1.0,24],[1,1.25,36],[1,0.85,22]]){const sd=q[0];let rx=sd*10,ry=-14,ra=sd*q[1],w=12;for(let k=0;k<3;k++){ra+=sd*(k===1?0.35:-0.15);const L=q[2]*[0.45,0.35,0.25][k],nx=rx+Math.sin(ra)*L,ny=Math.min(3,ry+Math.cos(ra)*L*0.55+3);seg(rx,ry,nx,ny,w,w*0.6);rx=nx;ry=ny;w*=0.6;}}
    // the trunk leans further downwind as it climbs, kinking on the way
    const segs=[[0.18+sw,46,50,46],[0.55+sw,40,46,40],[0.34+sw,34,40,34],[0.85+sw,28,34,28],[1.15+sw,22,28,20]];
    let px=hip[0],py=hip[1]+4;const J=[[px,py]];
    for(const g of segs){const nx=px+Math.sin(g[0])*g[1],ny=py-Math.cos(g[0])*g[1];seg(px,py,nx,ny,g[2],g[3]);px=nx;py=ny;J.push([px,py]);}
    for(let i=1;i<J.length-1;i++){x.fillStyle=P.bark;x.beginPath();x.ellipse(J[i][0],J[i][1],segs[i][2]*0.4,segs[i][2]*0.3,0.6,0,Math.PI*2);x.fill();}
    for(const q of [[3,-1.2,8],[4,-1.4,7]]){const j=J[q[0]];seg(j[0]-12,j[1],j[0]-12+Math.sin(q[1])*q[2],j[1]-Math.cos(q[1])*q[2],5,2);} // broken stubs on the windward side
    // the crown streams downwind
    const top=J[J.length-1];
    for(const q of [[1.1,72,12,31],[1.4,84,11,32],[0.8,60,10,33],[1.7,58,9,34],[1.25,50,8,35]]){let cx=top[0],cy=top[1],ca=q[0]+sw,cw=q[2];
      for(let k=0;k<3;k++){ca+=(1.55-ca)*0.45+(k===1?-0.3:0.2);const L=q[1]*[0.42,0.34,0.24][k],nx=cx+Math.sin(ca)*L,ny=cy-Math.cos(ca)*L,w2=cw*0.7;seg(cx,cy,nx,ny,cw,w2);if(k===1)cLimb(x,P.bark,nx,ny,[[9,ca-0.5,w2*0.5,1]]);cx=nx;cy=ny;cw=w2;}
      for(let c2=0;c2<2;c2++)cLimb(x,P.bark,cx,cy,[[7,ca+(c2?0.6:-0.4),1.8,0.5]]);}
    // two sturdy arms: one reaching for you, bent back at the elbow by the wind; one swept downwind
    const branchArm=(ax,ay,a,turns,lens,w,sd)=>{for(let k=0;k<turns.length;k++){a+=turns[k];const L=lens[k],nx=ax+Math.sin(a)*L,ny=ay-Math.cos(a)*L,w2=w*0.66;seg(ax,ay,nx,ny,w,w2);
        if(k>=1){const sa=a+sd*(0.7+k*0.1);let bx2=nx,by2=ny,bw=w2*0.55;for(let j=0;j<2;j++){const bl=[12,8][j],ex=bx2+Math.sin(sa+j*sd*0.5)*bl,ey=by2-Math.cos(sa+j*sd*0.5)*bl;x.fillStyle=P.bark;taper(x,[bx2,by2,ex,ey,bw,bw*0.55]);bx2=ex;by2=ey;bw*=0.55;}}
        ax=nx;ay=ny;w=w2;}
      for(let c2=0;c2<3;c2++){let tx=ax,ty=ay,ta=a+(c2-1)*0.5,tw=w*0.8;for(let j=0;j<2;j++){ta+=sd*0.45;const L=[9,6][j],nx=tx+Math.sin(ta)*L,ny=ty-Math.cos(ta)*L;x.fillStyle=P.bark;taper(x,[tx,ty,nx,ny,tw,tw*0.5]);tx=nx;ty=ny;tw*=0.5;}}};
    const armL=()=>branchArm(J[3][0]-12,J[3][1]+2,-1.2+a1,[0,1.0,-0.45,0.55],[26,22,16,12],15,1); // reaching for you, but bent back by the wind
    const armR=()=>branchArm(J[4][0]+10,J[4][1]+4,1.5-a2,[0,-0.7,0.55,-0.3],[26,22,16,12],14,1);
    armR();armL();
    // the face, low on the trunk: heavy brows, ember eyes, a gaping mouth with splinter teeth
    const fx=lerp(J[1][0],J[2][0],0.85),fy=lerp(J[1][1],J[2][1],0.85)-6; // the face, higher up the trunk
    fillP(x,P.barkDeep,[[fx-19,fy+2],[fx-6,fy+8],[fx-6,fy+15],[fx-17,fy+15]]);fillP(x,P.barkDeep,[[fx+4,fy+6],[fx+16,fy],[fx+16,fy+11],[fx+6,fy+15]]);
    fillP(x,P.barkShade,[[fx-22,fy-2],[fx-4,fy+6],[fx-3,fy+10],[fx-20,fy+4]]);fillP(x,P.barkShade,[[fx+2,fy+4],[fx+19,fy-4],[fx+18,fy+2],[fx+3,fy+9]]);
    const mx=fx-2,my=fy+24;
    fillP(x,P.barkDeep,[[mx-17,my],[mx-4,my-4],[mx+11,my-6],[mx+17,my+5],[mx+13,my+26+op],[mx,my+34+op],[mx-11,my+31+op],[mx-19,my+17]]);
    for(const q of [[-14,1,-11,10,-8,-1],[-6,-3,-3,8,0,-4],[3,-5,6,6,9,-5],[10,-4,12,5,15,2],[-16,19,-12,11,-9,24],[-4,31,-1,21,3,32],[7,29,10,19,13,26]])fillP(x,P.barkLight,[[mx+q[0],my+q[1]+(q[1]>15?op:0)],[mx+q[2],my+q[3]+(q[1]>15?op*0.5:0)],[mx+q[4],my+q[5]+(q[1]>15?op:0)]]);
    return (c,o)=>{emberEye(c,fx-11,fy+10,3.3,2.2,-0.3);emberEye(c,fx+10,fy+7,3.1,2.1,0.4);
      c.save();const g=c.createRadialGradient(mx,my+15,0,mx,my+14,24);g.addColorStop(0,rgba("#ffc27a",0.95));g.addColorStop(0.45,rgba(EMBER.danger,0.75));g.addColorStop(1,rgba("#5a0c08",0));c.fillStyle=g;
      c.beginPath();c.moveTo(mx-14,my+2);c.lineTo(mx+13,my-2);c.lineTo(mx+11,my+26+op);c.lineTo(mx-11,my+27+op);c.closePath();c.fill();c.restore();
      seam(c,[[J[0][0]+12,J[0][1]-6],[J[0][0]+16,J[0][1]-18]],1.2);seam(c,[[J[4][0]+2,J[4][1]+10],[J[4][0]+6,J[4][1]]],1.1);};
  }
};
const BH={};
const BOSS_AURA={night:["#f0c9e0",-110,125,0.48],storm:["#ff8fa6",-80,130,0.45],dawn:["#bcd2ff",-100,130,0.48],mist:["#f8ffc8",-110,150,0.62]}; // 50% stronger; the tree's is brighter so it shows against the pale mist // a glow round each boss, in its level's colour
const BOSS_RIM={night:true,storm:true,dawn:false,mist:false};
function bossInto(c,s,lv,t,o,dx,dy,noAura){ // a boss painted into its own canvas, wrapped in its glow
  if(!BH.tmp||BH.tmpS!==s){BH.tmp=mk(460*s,330*s);BH.tmpS=s;}
  const T=BH.tmp,tc=T.getContext("2d");tc.setTransform(1,0,0,1,0,0);tc.clearRect(0,0,T.width,T.height);tc.setTransform(s,0,0,s,230*s,300*s);tc.lineCap="round";tc.lineJoin="round";
  const det=BOSS[lv](tc,t,o.rm),A=BOSS_AURA[lv];
  c.save();c.setTransform(s,0,0,s,dx+230*s,dy+300*s);
  if(!noAura&&FX){const ag=c.createRadialGradient(0,A[1],10,0,A[1],A[2]);ag.addColorStop(0,rgba(A[0],A[3]));ag.addColorStop(1,rgba(A[0],0));c.fillStyle=ag;c.fillRect(-A[2],A[1]-A[2],A[2]*2,A[2]*2);}
  c.setTransform(1,0,0,1,0,0);
  if(BOSS_RIM[lv]){if(FX){c.shadowColor=rgba(EMBER.danger,0.85);c.shadowBlur=2.2*s;c.drawImage(T,dx,dy);c.shadowColor=rgba(EMBER.glow,0.35);c.shadowBlur=9*s;c.drawImage(T,dx,dy);c.shadowColor="transparent";c.shadowBlur=0;}else hardRim(c,rgba(EMBER.danger,0.85),s,()=>c.drawImage(T,dx,dy));}
  c.drawImage(T,dx,dy);
  c.setTransform(s,0,0,s,dx+230*s,dy+300*s);det(c,o);c.restore();
}
const BOSS_BOX=[-110,-235,170,12],BOSS_CYCLE=7.5;
function bossDefeat(c,M,s,X,Y,u,seed){ // the boss falls apart into card pieces, and a large golden wisp rises
  const ox=X-230,oy=Y-300,x0=X+BOSS_BOX[0],y0=Y+BOSS_BOX[1],w=BOSS_BOX[2]-BOSS_BOX[0],h=BOSS_BOX[3]-BOSS_BOX[1];
  if(!BH.pieces){const r=rng32(seed),cols=4,rows=3,pts=[];for(let j=0;j<=rows;j++){pts.push([]);for(let i=0;i<=cols;i++){const jx=(i>0&&i<cols)?(r()-0.5)*0.14:0,jy=(j>0&&j<rows)?(r()-0.5)*0.18:0;pts[j].push([i/cols+jx,j/rows+jy]);}}
    BH.pieces=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)BH.pieces.push({poly:[pts[j][i],pts[j][i+1],pts[j+1][i+1],pts[j+1][i]],vx:(i-1.5)*0.7+(r()-0.5)*0.6,vy:-0.5-r()*0.9,spin:(r()-0.5)*4});}
  for(const pc of BH.pieces){const cx=x0+w*(pc.poly[0][0]+pc.poly[2][0])/2,cy=y0+h*(pc.poly[0][1]+pc.poly[2][1])/2,tx=pc.vx*u*90,ty=pc.vy*u*70+u*u*320,al=u<0.5?1:Math.max(0,1-(u-0.5)/0.5);
    c.save();c.globalAlpha=al;c.translate(cx+tx,cy+ty);c.rotate(pc.spin*u);c.translate(-cx,-cy);c.beginPath();pc.poly.forEach((q,i)=>{const px=x0+q[0]*w,py=y0+q[1]*h;i?c.lineTo(px,py):c.moveTo(px,py);});c.closePath();c.clip();c.drawImage(M,ox,oy,M.width/s,M.height/s);c.restore();}
  const wu=(u-0.2)/0.8;if(wu>0){const cx=X+Math.sin(wu*3)*10,cy=Y-110-wu*160,a=Math.sin(Math.min(1,wu*1.2)*Math.PI)*0.95;
    c.save();if(FX){const g=c.createRadialGradient(cx,cy,0,cx,cy,60);g.addColorStop(0,rgba("#ffe7a8",a*0.9));g.addColorStop(0.4,rgba("#ffcf6a",a*0.45));g.addColorStop(1,rgba("#ffb84a",0));c.fillStyle=g;c.fillRect(cx-60,cy-60,120,120);}
    c.fillStyle=rgba("#fff3d0",a);c.shadowColor="#ffcf6a";c.shadowBlur=FX?14:0;c.beginPath();c.moveTo(cx-9,cy);c.quadraticCurveTo(cx,cy-18,cx+9,cy);c.quadraticCurveTo(cx+7,cy+22,cx-10,cy+46);c.quadraticCurveTo(cx-2,cy+20,cx-9,cy);c.fill();c.restore();}
}
const BOSS_H=320,BOSS_GROUND=292;
function renderBossStrip(cv,t,o){
  const c=cv.getContext("2d"),s=cv.height/BOSS_H,SW=cv.width/s,lv=o.level,sk=SKY[lv];
  c.setTransform(s,0,0,s,0,0);
  const g=c.createLinearGradient(0,0,0,BOSS_GROUND);g.addColorStop(0,sk[0]);g.addColorStop(0.45,sk[1]);g.addColorStop(0.8,sk[2]);g.addColorStop(1,sk[3]);c.fillStyle=g;c.fillRect(0,0,SW,BOSS_H);
  c.fillStyle=mixc(INK,AIR[lv],0.55);c.beginPath();c.moveTo(0,BOSS_H);for(let x=0;x<=SW;x+=8)c.lineTo(x,236+12*Math.sin(x*0.009)+6*Math.sin(x*0.023+1));c.lineTo(SW,BOSS_H);c.closePath();c.fill();
  c.fillStyle=mixc(INK,AIR[lv],0.3);c.beginPath();c.moveTo(0,BOSS_H);for(let x=0;x<=SW;x+=8)c.lineTo(x,268+6*Math.sin(x*0.015+2));c.lineTo(SW,BOSS_H);c.closePath();c.fill();
  c.fillStyle=INK;c.fillRect(0,BOSS_GROUND,SW,BOSS_H-BOSS_GROUND);
  const wx=SW*0.16;drawWanderer(c,wx,BOSS_GROUND+1,t,false,1,o.rm,LV[lv].edge);
  const bx=SW*0.62,by=BOSS_GROUND+2,ph=t%BOSS_CYCLE;
  if(ph<4.8)bossInto(c,s,lv,t,o,Math.round((bx-230)*s),Math.round((by-300)*s));
  else{ // defeated on a loop: card pieces and a large golden wisp, then back again
    if(!BH.M||BH.Ms!==s){BH.M=mk(460*s,330*s);BH.Ms=s;}
    const mc=BH.M.getContext("2d");mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,BH.M.width,BH.M.height);bossInto(mc,s,lv,t,o,0,0,true);
    const A=BOSS_AURA[lv],fade=ph<7?Math.max(0,1-(ph-4.8)/0.8):(ph-7)/0.5; // the glow fades as it falls apart, and returns with it
    if(fade>0){c.save();const ag=c.createRadialGradient(bx,by+A[1],10,bx,by+A[1],A[2]);ag.addColorStop(0,rgba(A[0],A[3]*fade));ag.addColorStop(1,rgba(A[0],0));c.fillStyle=ag;c.fillRect(bx-A[2],by+A[1]-A[2],A[2]*2,A[2]*2);c.restore();}
    if(ph<7)bossDefeat(c,BH.M,s,bx,by,(ph-4.8)/2.2,77);
    else{c.save();c.globalAlpha=(ph-7)/0.5;c.drawImage(BH.M,bx-230,by-300,BH.M.width/s,BH.M.height/s);c.restore();}}
  c.textAlign="center";c.textBaseline="top";c.font='12px "Alegreya Sans",sans-serif';c.fillStyle="#c9a25a";
  c.fillText("the wanderer",wx,BOSS_GROUND+10);c.fillText("boss: "+BOSS_NAME[lv],bx,BOSS_GROUND+10);
}
/* ============================== the sample strip: the monsters side by side, defeated one at a time ============================== */
const SHEET_H=300,SHEET_GROUND=262,DEFEAT_CYCLE=3.6;
const SHEET_CAST=[{kind:"crawler",u:0.17,label:"small: crawler"},{kind:"bat2",u:0.33,label:"small: flyer",fly:150},{kind:"hatmaw",u:0.5,label:"medium: mouth-hat"},{kind:"ghoul2",u:0.67,label:"medium: ghoul"},{kind:"walker",u:0.86,label:"large: walker"}];
const SH={};
function sheetPieces(r){ // jagged card pieces covering a monster's box (in 0..1 units)
  const cols=3,rows=2,pts=[];for(let j=0;j<=rows;j++){pts.push([]);for(let i=0;i<=cols;i++){const jx=(i>0&&i<cols)?(r()-0.5)*0.18:0,jy=(j>0&&j<rows)?(r()-0.5)*0.22:0;pts[j].push([i/cols+jx,j/rows+jy]);}}
  const out=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)out.push({poly:[pts[j][i],pts[j][i+1],pts[j+1][i+1],pts[j+1][i]],vx:(i-1)*0.9+(r()-0.5)*0.8,vy:-0.6-r()*0.8,spin:(r()-0.5)*5});
  return out;
}
function drawDefeat(c,M,s,X,Y,bb,u,eff,seed){ // M: the monster drawn into its own canvas, origin at (130s, 230s)
  const ox=X-130,oy=Y-230,x0=X+bb[0],y0=Y+bb[1],w=bb[2]-bb[0],h=bb[3]-bb[1],r=rng32(seed);
  if(eff==="ash"){ // crumbles from the top down into ash, a few ember sparks, then a pale soul-wisp rises
    const cut=y0+h*Math.min(1,u*1.5);
    if(cut<y0+h){c.save();c.beginPath();c.moveTo(x0-20,y0+h+20);c.lineTo(x0-20,cut);for(let i=0;i<=10;i++)c.lineTo(x0+i*w/10,cut+(i%2?3:-2));c.lineTo(x0+w+20,cut);c.lineTo(x0+w+20,y0+h+20);c.closePath();c.clip();c.drawImage(M,ox,oy,M.width/s,M.height/s);c.restore();}
    for(let i=0;i<26;i++){const st=r()*0.55,lu=(u-st)/0.45;if(lu<0||lu>1)continue;const px=x0+r()*w,py=y0+r()*h*Math.min(1,st*1.6+0.1)+lu*lu*60;c.fillStyle=rgba("#3a3238",0.85*(1-lu));c.save();c.translate(px+Math.sin(lu*6+i)*4,py);c.rotate(lu*3+i);c.fillRect(-1.6,-1,3.2,2);c.restore();}
    for(let i=0;i<7;i++){const st=r()*0.5,lu=(u-st)/0.5;if(lu<0||lu>1)continue;const px=x0+w*0.2+r()*w*0.6,py=y0+h*(0.3+r()*0.6)-lu*40;c.save();c.fillStyle=rgba(EMBER.danger,0.9*(1-lu));c.shadowColor=EMBER.glow;c.shadowBlur=4;c.beginPath();c.arc(px+Math.sin(lu*5+i)*5,py,1.1,0,Math.PI*2);c.fill();c.restore();}
    const wu=(u-0.5)/0.5;if(wu>0){const cx=lerp(x0+w/2,X+120,wu*wu),cy=lerp(y0+h*0.4,y0-120,wu),a=Math.sin(wu*Math.PI)*0.85;
      c.save();if(FX){const g=c.createRadialGradient(cx,cy,0,cx,cy,14);g.addColorStop(0,rgba("#eef3ff",a));g.addColorStop(1,rgba("#c8d6ff",0));c.fillStyle=g;c.fillRect(cx-14,cy-14,28,28);}
      c.fillStyle=rgba("#f4f7ff",a);c.beginPath();c.moveTo(cx-3,cy);c.quadraticCurveTo(cx,cy-6,cx+3,cy);c.quadraticCurveTo(cx+2,cy+8,cx-4,cy+16);c.quadraticCurveTo(cx-1,cy+7,cx-3,cy);c.fill();c.restore();}
  }else if(eff==="card"||eff==="cardwisp"){ // falls apart into its card pieces, which tumble away (and, chosen: a soul-wisp rises)
    if(!SH.pieces)SH.pieces=sheetPieces(rng32(911));
    for(const pc of SH.pieces){const cx=x0+w*(pc.poly[0][0]+pc.poly[2][0])/2,cy=y0+h*(pc.poly[0][1]+pc.poly[2][1])/2,tx=pc.vx*u*70,ty=pc.vy*u*60+u*u*260,rot=pc.spin*u,al=u<0.55?1:Math.max(0,1-(u-0.55)/0.45);
      c.save();c.globalAlpha=al;c.translate(cx+tx,cy+ty);c.rotate(rot);c.translate(-cx,-cy);
      c.beginPath();pc.poly.forEach((q,i)=>{const px=x0+q[0]*w,py=y0+q[1]*h;i?c.lineTo(px,py):c.moveTo(px,py);});c.closePath();c.save();c.clip();c.drawImage(M,ox,oy,M.width/s,M.height/s);c.restore();
      c.restore();}
    if(eff==="cardwisp"){const wu=(u-0.35)/0.65;if(wu>0){const cx=lerp(x0+w/2,X+120,wu*wu),cy=lerp(y0+h*0.4,y0-120,wu),a=Math.sin(wu*Math.PI)*0.85;
      c.save();if(FX){const g=c.createRadialGradient(cx,cy,0,cx,cy,14);g.addColorStop(0,rgba("#eef3ff",a));g.addColorStop(1,rgba("#c8d6ff",0));c.fillStyle=g;c.fillRect(cx-14,cy-14,28,28);}
      c.fillStyle=rgba("#f4f7ff",a);c.beginPath();c.moveTo(cx-3,cy);c.quadraticCurveTo(cx,cy-6,cx+3,cy);c.quadraticCurveTo(cx+2,cy+8,cx-4,cy+16);c.quadraticCurveTo(cx-1,cy+7,cx-3,cy);c.fill();c.restore();}}
  }else{ // fades away into dark smoke
    c.save();c.globalAlpha=Math.max(0,1-u*1.4);c.drawImage(M,ox,oy,M.width/s,M.height/s);c.restore();
    for(let i=0;i<9;i++){const st=r()*0.3,lu=(u-st)/0.7;if(lu<0||lu>1)continue;const px=x0+w*(0.15+r()*0.7)+Math.sin(lu*3+i)*8,py=y0+h*(0.25+r()*0.65)-lu*50,rr=8+lu*30*(0.6+r()*0.6),a=Math.sin(Math.min(1,lu*1.4)*Math.PI)*0.55;
      const g=c.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,rgba("#241c26",a));g.addColorStop(1,rgba("#241c26",0));c.fillStyle=g;c.fillRect(px-rr,py-rr,rr*2,rr*2);}
  }
}
function renderSheet(cv,t,o,scene){
  const c=cv.getContext("2d"),s=cv.height/SHEET_H,SW=cv.width/s,lv=o.level,sk=SKY[lv];
  c.setTransform(s,0,0,s,0,0);
  const g=c.createLinearGradient(0,0,0,SHEET_GROUND);g.addColorStop(0,sk[1]);g.addColorStop(0.7,sk[2]);g.addColorStop(1,sk[3]);c.fillStyle=g;c.fillRect(0,0,SW,SHEET_H);
  c.fillStyle=mixc(INK,AIR[lv],0.5);c.beginPath();c.moveTo(0,SHEET_H);for(let x=0;x<=SW;x+=8)c.lineTo(x,214+10*Math.sin(x*0.011)+6*Math.sin(x*0.027+1));c.lineTo(SW,SHEET_H);c.closePath();c.fill();
  c.fillStyle=mixc(INK,AIR[lv],0.28);c.beginPath();c.moveTo(0,SHEET_H);for(let x=0;x<=SW;x+=8)c.lineTo(x,240+6*Math.sin(x*0.017+2));c.lineTo(SW,SHEET_H);c.closePath();c.fill();
  c.fillStyle=INK;c.fillRect(0,SHEET_GROUND,SW,SHEET_H-SHEET_GROUND);
  drawWanderer(c,SW*0.05+14,SHEET_GROUND+1,t,false,1,o.rm,LV[lv].edge);
  c.textAlign="center";c.textBaseline="top";c.font='12px "Alegreya Sans",sans-serif';c.fillStyle="#c9a25a";c.fillText("the wanderer",SW*0.05+14,SHEET_GROUND+12);
  if(!SH.M||SH.s!==s){SH.M=mk(260*s,250*s);SH.s=s;SH.H={};}
  const M=SH.M,mc=M.getContext("2d"),cyc=Math.floor(t/DEFEAT_CYCLE),ph=t-cyc*DEFEAT_CYCLE,who=posmod(cyc,SHEET_CAST.length);
  SHEET_CAST.forEach((cm,i)=>{
    const X=SW*cm.u,Y=cm.fly?cm.fly+Math.sin(t*1.7+i)*8:SHEET_GROUND+(cm.kind==="crawler"?3:cm.kind==="ghoul2"?2:0),m={kind:cm.kind,X,Y,ph:i*1.3};
    mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,M.width,M.height);scene.monsterInto(mc,s,m,t,o,0,0,SH.H);
    const bb=MON_BOX[cm.kind];
    if(i!==who||ph>3.2)c.drawImage(M,X-130,Y-230,M.width/s,M.height/s);
    else if(ph<1.6)drawDefeat(c,M,s,X,Y,bb,ph/1.6,o.defeat,hsh(cyc,i));
    else if(ph>2.6){c.save();c.globalAlpha=(ph-2.6)/0.6;c.drawImage(M,X-130,Y-230,M.width/s,M.height/s);c.restore();}
    c.fillStyle="#c9a25a";c.fillText(cm.label,X,SHEET_GROUND+12);
  });
}


/* ============================== the tools: what a game calls, as lb.world ==============================
   The tools draw; games decide what happens. A frame is world.begin(ctx, { place, camX, rise }), then the things on the path
   in the order they should overlap, then world.end(). Things on the path are placed by x, along the path, and y, in picture
   lines before the camera rises; y left out means standing on the ground at x. */
function makeTools(env){
  const PLACE_SET={night:"village5",storm:"town",dawn:"moor",mist:"forest"};
  const STAND={crawler:3,ghoul2:2};          // how far a monster's feet sit below the ground line, as on the directions page
  let scene=null,sceneScale=0,F=null;        // F: the frame being drawn
  function sceneFor(S){ // one Scene, for the picture's sharpness in quarter steps; its sprites are painted for that sharpness
    const sc=Math.min(2,Math.max(0.5,Math.round(S*4)/4));
    if(sc!==sceneScale){scene=new Scene(5,sc);sceneScale=sc;}
    return scene;
  }
  function frame(what){
    if(!F)throw new Error("Lantern Box: world."+what+"() goes between world.begin() and world.end().");
    F.ctx.setTransform(F.s,0,0,F.s,0,Math.round(F.camY*F.s));
    F.ctx.globalAlpha=1;
    return F;
  }
  function defeatCanvas(key,w,h,s){ // a working canvas a piece for defeats, the same as the directions page's
    const name="def"+key;
    if(!scene[name]||scene[name+"S"]!==s){scene[name]=mk(w*s,h*s);scene[name+"S"]=s;}
    const M=scene[name],c=M.getContext("2d");
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,M.width,M.height);
    return{M,c};
  }
  return{
    PLACES:["night","storm","dawn","mist"],
    places:LV,
    bossNames:BOSS_NAME,
    MONSTERS:["crawler","bat2","hatmaw","ghoul2","walker"],
    ground:gY,
    begin(ctx,o){
      o=o||{};
      const S=env.k(),level=o.place||"night";
      FX=env.fx();
      const rm=env.rm(),t=o.t==null?env.t():o.t,sc=sceneFor(S);
      const opt={level,rm,walking:true,facing:1,hud:false,splash:"on",emberMouth:true,defeat:"cardwisp",dcol:EMBER.danger,dglow:EMBER.glow,win:GOLD_LIGHT,litP:LV[level].litP,sample:!!o.sample};
      F={ctx,s:S,W:env.W(),t,rm,level,camX:o.camX||0,camY:o.rise||0,opt};
      sc.kitBegin(ctx,S,F.W,t,F.camX,F.camY,opt);
      frame("begin");
    },
    end(){
      frame("end");
      scene.kitEnd(F.ctx,F.s,F.W,F.t,F.camX,F.camY,F.opt);
      F.ctx.setTransform(1,0,0,1,0,0);
      F=null;
    },
    wanderer(x,o){ // o: y, walking (true), facing (1 or -1)
      const f=frame("wanderer");o=o||{};
      drawWanderer(f.ctx,x-f.camX,o.y==null?gY(x)+1:o.y,f.t,o.walking!==false,o.facing||1,f.rm,LV[f.level].edge);
    },
    monster(o){ // o: kind, x, y, ph (its pace, so neighbours differ), id (a monster's own name), defeat (0 to 1, over 1.6 s), seed
      const f=frame("monster"),s=f.s;
      if(!MON_BOX[o.kind])throw new Error('Lantern Box: no monster called "'+o.kind+'".');
      const X=o.x-f.camX,Y=o.y==null?gY(o.x)+(STAND[o.kind]||0):o.y,m={kind:o.kind,X,Y,ph:o.ph||0,id:o.id};
      if(o.defeat==null){scene.monster(f.ctx,s,m,f.t,f.opt);return;}
      const d=defeatCanvas("M",260,250,s);
      scene.monsterInto(d.c,s,m,f.t,f.opt,0,0);
      drawDefeat(f.ctx,d.M,s,X,Y,MON_BOX[o.kind],clamp(o.defeat,0,1),"cardwisp",o.seed||0);
    },
    boss(o){ // o: x, y, defeat (0 to 1, over 2.2 s). The boss is the place's own.
      const f=frame("boss"),s=f.s,lv=f.level;
      const X=o.x-f.camX,Y=o.y==null?gY(o.x)+2:o.y;
      if(o.defeat==null){scene.bossAt(f.ctx,s,lv,f.t,f.opt,X,Y);return;}
      const u=clamp(o.defeat,0,1),d=defeatCanvas("B",460,330,s);
      bossInto(d.c,s,lv,f.t,f.opt,0,0,true);
      const A=BOSS_AURA[lv],fade=Math.max(0,1-u*2.2/0.8); // the glow fades as it falls apart
      if(fade>0&&FX){const c=f.ctx;c.save();const ag=c.createRadialGradient(X,Y+A[1],10,X,Y+A[1],A[2]);ag.addColorStop(0,rgba(A[0],A[3]*fade));ag.addColorStop(1,rgba(A[0],0));c.fillStyle=ag;c.fillRect(X-A[2],Y+A[1]-A[2],A[2]*2,A[2]*2);c.restore();}
      bossDefeat(f.ctx,d.M,s,X,Y,u,77);
    },
    splash(x,o){ // o: y, seed. The place's own splash of colour.
      const f=frame("splash");o=o||{};
      drawSplash(f.ctx,PLACE_SET[f.level],"on",x-f.camX,(o.y==null?gY(x):o.y)+3,f.t,f.rm,o.seed||0,"green","intense");
    },
    candle(x,y){const f=frame("candle");drawCandle(f.ctx,x-f.camX,(y==null?gY(x):y)+4,f.t,f.rm);},
    wallLamp(x,y){const f=frame("wallLamp");drawWallLamp(f.ctx,x-f.camX,y,f.t,f.rm);},
    post(x,y,lit){const f=frame("post");drawPost(f.ctx,x-f.camX,y==null?gY(x):y,lit!==false,GOLD_LIGHT);},
    streetLamp(x,y){const f=frame("streetLamp");drawStreetLamp(f.ctx,x-f.camX,y==null?gY(x):y,GOLD_LIGHT);},
    shrine(x,y){const f=frame("shrine");drawShrine(f.ctx,x-f.camX,(y==null?gY(x):y)+2,f.t,f.rm);},
    potion(x,y){const f=frame("potion");drawPotion(f.ctx,x-f.camX,y==null?gY(x):y,f.t,f.rm);},
    stringLights(ax,ay,qx,qy,bx,by,seed){ // lights along a curve from (ax, ay) to (bx, by), its string drawn by whatever holds it up
      const f=frame("stringLights");
      drawFairyKit(f.ctx,[ax-f.camX,ay,qx-f.camX,qy,bx-f.camX,by,seed||0],f.t,f.level,f.s);
    },
    // for the test page's readout
    get stats(){return{tileBytes:KIT.bytes,poses:KIT.poses,builds:KIT.builds};}
  };
}
  return { makeTools: makeTools };
  })();

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

    /* ----- Picture: Best is the device's sharpness, Faster ordinary sharpness, Fastest that with the glows off whatever the
       Effects setting says. Automatic starts at Best and times the first seconds of play, once a visit: after a second to
       settle, two seconds of frames. While they come more than 25 ms apart on average (fewer than 40 a second) it steps down
       a level and times again. ----- */
    const LEVELS = ['best', 'faster', 'fastest'];
    const AUTO_LIMIT = 0.025;
    const auto = { level: 0, phase: 'wait', t: 0, n: 0, sum: 0 };   // phase: wait (for play), settle, time, done
    const pictureLevel = () => (own.picture === 'auto' ? LEVELS[auto.level] : own.picture);
    // gap: seconds since the last frame
    function timePicture(gap) {
      if (own.picture !== 'auto' || auto.phase === 'done' || state.screen !== 'play') return;
      if (auto.phase === 'wait') { Object.assign(auto, { phase: 'settle', t: 0 }); return; }
      if (gap > 0.25) return;   // a hitch (the window resized, the tab hidden), not the drawing
      auto.t += gap;
      if (auto.phase === 'settle') {
        if (auto.t >= 1) Object.assign(auto, { phase: 'time', t: 0, n: 0, sum: 0 });
        return;
      }
      auto.n++;
      auto.sum += gap;
      if (auto.t < 2) return;
      if (auto.sum / auto.n > AUTO_LIMIT && auto.level < LEVELS.length - 1) {
        auto.level++;
        Object.assign(auto, { phase: auto.level < LEVELS.length - 1 ? 'settle' : 'done', t: 0 });
        layout();
      } else auto.phase = 'done';
    }

    /* ----- The picture: 540 lines tall, its width following the window ----- */
    const V = { W: 960, k: 1, w: 0, h: 0, phone: false };
    function layout() {
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (!w || !h) return;
      const q = pictureLevel() === 'best' ? Math.min(window.devicePixelRatio || 1, MAX_DPR, BEST_LINES / h) : Math.min(1, PLAIN_LINES / h);
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
        if (id === 'auto') Object.assign(auto, { level: 0, phase: 'wait', t: 0 });   // it times again from the top
        applySettings();
        layout();
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
    let shaking = false;
    function render() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colour('ink');
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Shake moves the whole picture, which keeps the World's drawing and the HUD out of it
      if (state.shakeT > 0 && state.shakeAmt > 0 && state.screen === 'play' && !settings.reduceMotion) {
        const px = V.h / H;
        canvas.style.transform = 'translate(' + Math.round(rand(-state.shakeAmt, state.shakeAmt) * px) + 'px,' + Math.round(rand(-state.shakeAmt, state.shakeAmt) * px) + 'px)';
        shaking = true;
      } else if (shaking) {
        canvas.style.transform = '';
        shaking = false;
      }
      ctx.setTransform(V.k, 0, 0, V.k, 0, 0);
      try {
        if (state.inGame && state.game) cfg.draw(ctx, state.game, api);
        else if (!state.inGame && cfg.drawTitle) cfg.drawTitle(ctx, api);
        else if (!state.inGame) {   // the first place runs on slowly behind the arch, at walking pace
          world.begin(ctx, { place: cfg.place || 'night', camX: state.t * TITLE_PACE });
          world.end();
        }
      } catch (e) { reportError(e); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    let speed = 1;
    let forceRotate = false;   // the test page shows the rotate notice on any screen
    function frame(now) {
      requestAnimationFrame(frame);
      const gap = Math.max(0, (now - lastFrame) / 1000);
      const dt = Math.min(0.25, gap) * speed;
      lastFrame = now;
      timePicture(gap);
      state.t += dt;
      if (root.clientWidth !== V.w || root.clientHeight !== V.h) layout();
      // checked every frame as well as on the event, in case a turn's event never comes
      if ((upright() || forceRotate) === rotateEl.hidden) {
        rotateEl.hidden = !(upright() || forceRotate);
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
    // The kit's named colours (design-system/tokens.json): games name them instead of writing colour codes
    const colours = {};
    function colour(name) {
      if (colours[name] == null) {
        colours[name] = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
        if (!colours[name]) console.warn('Lantern Box: no colour called "' + name + '". The names are in the design system\'s tokens.json.');
      }
      return colours[name];
    }
    if (!colour('ink')) console.error('Lantern Box: lantern-box.css is not loaded. Link it before lantern-box.js.');
    const world = World.makeTools({
      k: () => V.k,
      W: () => V.W,
      t: () => (state.inGame ? state.time : state.t),
      rm: () => !!settings.reduceMotion,
      fx: () => !!settings.effects && pictureLevel() !== 'fastest'
    });

    /* ----- Public API handed to the game -----
       lb.W, lb.H: the picture's size in lines (H is always 540; W follows the window). lb.touch: a touch device.
       lb.input: left, right, up, down, fire, alt (held), input.pressed.* (just pressed), input.tap, input.any, input.key(code),
         input.keyPressed(code), and two fingers: input.pointer and input.pointer2 (x, y in lines; down, pressed, released, dx, dy).
       lb.addWisps(n), lb.wisps, lb.best: the score, in whole wisps. lb.gameOver(delay): ends the run (game over, then the
         initials if it makes the top ten). lb.hud.health(0..1), lb.hud.mana(0..1): the bars; mana: false in the config leaves
         the mana bar out. lb.sfx('name'), sfx.tone(o), sfx.noise(o). lb.music(0 or 1): the soundtrack to play.
       lb.shake(lines, seconds): the picture only, never under Reduce motion. lb.after(seconds, fn): a timer in game time.
       lb.settings: effects, reduceMotion, picture and the rest (read only). lb.screen, lb.time, lb.t.
       lb.picture: the Picture level in use ('best', 'faster' or 'fastest') and the picture's width, height and sharpness.
       lb.rand, lb.randInt, lb.pick, lb.clamp, lb.lerp. lb.color('ember'): a named colour from the design system's tokens.
       lb.world draws the World. A frame: world.begin(ctx, { place: 'night', 'storm', 'dawn' or 'mist', camX, rise }), then the
         things on the path in the order they overlap, then world.end(). camX is the path's position at the picture's left
         edge; rise lifts the camera, in lines, above the place's own lift, and each layer rises by its own rate. Things are placed by x along the path;
         y left out stands them on the ground (world.ground(x)):
         world.wanderer(x, { y, walking, facing }), world.monster({ kind, x, y, ph, id, defeat, seed }) (kinds in
         world.MONSTERS; give each monster its own id; defeat 0 to 1 breaks it into card pieces and a wisp, over 1.6 s),
         world.boss({ x, y, defeat }) (the place's own; defeat over 2.2 s), world.splash(x, { y, seed }), world.candle(x, y),
         world.wallLamp(x, y), world.post(x, y, lit), world.streetLamp(x, y), world.shrine(x, y), world.potion(x, y),
         world.stringLights(ax, ay, qx, qy, bx, by, seed). begin({ sample: true }) adds the directions page's monsters and
         wanderer to the path. The path's scenery is the directions page's sample strip until levels are laid out.
       In the game's config: id, title (a string, or its two lines), start, update, draw(ctx, g, lb), place (the place behind
       the title, 'night' if left out), drawTitle(ctx, lb) (to draw the title's picture itself), mana, music, init(lb), onPause(g, lb). */
    const api = {
      H: H, version: VERSION, touch: touch, input: input, hud: hud, sfx: sfx, world: world, color: colour,
      get W() { return V.W; },
      get settings() { return Object.assign({}, settings, { picture: own.picture }); },
      get picture() { return { level: pictureLevel(), width: canvas.width, height: canvas.height, sharpness: V.k }; },
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
      auto: auto,
      music: music,
      rotate: (on) => { forceRotate = !!on; },
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
