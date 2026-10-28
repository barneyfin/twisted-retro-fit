
/* ================================================================ WebGL2: the street drawn on the graphics chip
   The street is built once into four buffers held on the graphics chip: the road, the buildings (with every
   pole and light fitting), the light pools and reflections on the wet road, and the hanging signs. Each corner
   is stored as (segment, how far along it, across, up), and the vertex shader projects it from a small table
   of where each segment ahead of the camera sits on screen, so only that table changes from frame to frame.
   People, traffic and the cab are drawn on top each frame from small batches. */
const canvas = $('#stage'), screenEl = $('#screen'), hudC = $('#hud'), hctx = hudC.getContext('2d');
let W = 960, H = 540, RS = 1, PW = 960, PH = 540, K = 480;
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
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
let quadIBO, dynVBO, dynVAO, cabVBO, cabVAO, fullVAO, texB, msFBO, msRB = [], resFBO = [], postFBO = {}, samples = 4, timer = null;
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
  samples = Math.min(OPT.smooth, gl.getParameter(gl.MAX_SAMPLES) || 0);
  timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
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
// an off-screen picture the size of the screen, used only while timing a frame
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
const pedList = [], carList = [];
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
  for (const c of cars){
    const rel = (c.z - st.pos + TRACK) % TRACK;
    if (rel < PLAYER_Z + 900 || rel > DRAW * SEG) continue;
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
  const cg = cabGeometry(), view = cabView(st), cab = T.cab[view.near], ds = cg.rw / cab.pxW, cx = W / 2 + st.lean * 5, cy = cg.gy;
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
  // the other vehicles, far to near
  dynBegin('cars');
  for (const it of carList){
    const c = it.c, offM = (it.sx - W / 2) / (it.scale * K * UPM);
    let vi = 0, best = 1e9; OFFS.forEach((o, i) => { const d = Math.abs(o - offM); if (d < best){ best = d; vi = i; } });
    const spr = atlas.items.get('car:' + c.kind + ':' + c.tone + ':' + vi), dsc = VEH[c.kind].W * UPM * it.scale * K / spr.pxW;
    const a = clamp(1 - (1 / it.scale - 26000) / 30000, 0.35, 1);
    dItem(spr, it.sx - spr.ax * dsc, it.sy - spr.ay * dsc, spr.sw * dsc, spr.sh * dsc, (it.n + it.t - 0.5) / (DRAW + 2), S('#ffffff', { ly: spr.layer, a }));
  }
  dynEnd('cars');
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
  gl.uniform1i(p.u.uAtlas, 0); gl.uniform1i(p.u.uTex, 2); gl.uniform1f(p.u.uFlick, st.flick.on ? 1 : 0.5); gl.uniform1f(p.u.uCarLev, Z.cars / MAXL); gl.uniform1i(p.u.uMode, 0);
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
function bindT(unit, target, t){ gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(target, t); }
function fullscreen(p, fbo, w, h){ gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, w, h); gl.useProgram(p.p); gl.bindVertexArray(fullVAO); gl.drawArrays(gl.TRIANGLES, 0, 3); }
const qPool = [], qPending = []; let gpuMs = 0, gpuN = 0;
// out: the framebuffer the finished picture goes to (the screen when left out; an off-screen copy while timing a frame)
function renderGL(st, out){
  project(st);
  const base = Math.floor(st.pos / SEG) % N_SEG;
  for (let n = 0; n < DRAW + 8; n++){ const b = B[n], o = n * 4; Bf[o] = b.ok ? b.scale : 0; Bf[o + 1] = b.sx; Bf[o + 2] = b.sy; Bf[o + 3] = b.ok ? 1 : 0; }
  bindT(1, gl.TEXTURE_2D, texB); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, DRAW + 8, 1, gl.RGBA, gl.FLOAT, Bf);
  buildDynamic(st);
  let q = null;
  if (timer && !out){ q = qPool.pop() || gl.createQuery(); gl.beginQuery(timer.TIME_ELAPSED_EXT, q); }
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
  gl.depthFunc(gl.LEQUAL); gl.uniform1i(pd.u.uMode, 1); drawDyn('cars'); gl.uniform1i(pd.u.uMode, 0);
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
  gl.uniform1f(pc.u.uBloomA, LOOK.bloom.a); gl.uniform1f(pc.u.uBloomB, LOOK.bloom.b); gl.uniform1f(pc.u.uVig, LOOK.vignette); gl.uniform1f(pc.u.uGrain, grainAmt);
  gl.uniform3f(pc.u.uZone, Z.white, midLevel, 0);
  const yAtZ = zm => H * HZ + DEPTH / (zm * UPM) * CAM_H * K;
  gl.uniform3f(pc.u.uCab, W / 2 + st.lean * 5, yAtZ(18), yAtZ(13));
  fullscreen(pc, out || null, PW, PH);
  drawCabGL(st);
  if (q){ gl.endQuery(timer.TIME_ELAPSED_EXT); qPending.push(q); }
  pollTimers();
}
function pollTimers(){
  if (!timer) return;
  const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT);
  while (qPending.length && gl.getQueryParameter(qPending[0], gl.QUERY_RESULT_AVAILABLE)){
    const q = qPending.shift();
    if (!disjoint){ const ns = gl.getQueryParameter(q, gl.QUERY_RESULT); gpuMs += ns / 1e6; gpuN++; }
    qPool.push(q);
  }
}
function drawCabGL(st){
  const cg = cabGeometry(), view = cabView(st), m = cabMotion(st), k = cg.rw / 200, x = W / 2 + st.lean * 5, y = cg.gy, N = T.cab[view.near];
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
