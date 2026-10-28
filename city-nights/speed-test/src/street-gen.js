/* ================================================================ street-gen.js
   The City Nights street as signed off in round 9 (28 October 2026), taken unchanged from the round 9
   directions page (https://claude.ai/artifact/Qoj1ttkA8BsZgJRaEDokb8): helpers, the signs and words,
   the look (palette, grain, glow), the track and its buildings, people, traffic, the sign, figure and
   vehicle drawing done once with the 2D canvas, the driving and the meter's seven-segment digits.
   Only the drawing of each frame is new, in gl.js. */
/* ---------------- from the round 9 mock-up, unchanged ---------------- */
const $ = s => document.querySelector(s);
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
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
const WORDS = [
  ['好運茶餐廳','Sign','"Good Luck" Hong Kong-style café (茶餐廳, cha chaan teng). Invented name.'],
  ['明月酒店','Sign','Bright Moon Hotel. Invented.'],
  ['祥記粥麵','Sign','Cheung Kee congee and noodles. 記 is the usual "so-and-so\'s shop" ending. Invented.'],
  ['永發 · 押','Sign','Wing Fat, a pawnbroker. 押 is the pawnshop character that hangs outside. Invented name.'],
  ['利源找換','Sign','Lee Yuen money exchange. Invented.'],
  ['原子桑拿','Sign','Atomic Sauna. Invented, in the spirit of "Cyber Sauna".'],
  ['長春藥行','Sign','Cheung Chun medicine shop. Invented.'],
  ['金城鐘錶','Sign','Golden City watches and clocks. Invented.'],
  ['好味麵家','Sign','Ho Mei ("tasty") noodle house. Invented.'],
  ['新潔洗衣','Sign','San Kit ("fresh and clean") laundry. Invented.'],
  ['停車場','Sign','Car park.'],
  ['火箭足療','Sign','Rocket foot massage (足療, foot therapy). Invented.'],
  ['新興燒味','Sign','San Hing roast meats (燒味, Cantonese roast meats). Invented.'],
  ['星光冰室','Sign','Starlight ice café (冰室, an old-style café). Invented.'],
  ['涼茶','Sign','Herbal tea.'],
  ['金滿金行','Sign','Kam Moon goldsmith (金行, gold shop). Invented.'],
  ['明亮眼鏡','Sign','"Bright" opticians (眼鏡, glasses). Invented.'],
  ['健康藥房','Sign','"Health" pharmacy (藥房). Invented.'],
  ['時裝','Sign','Fashion.'],
  ['便利店','Shopfront','Convenience store.'],
  ['街市','Shopfront','Market (a street or covered food market).'],
  ['商場','Shopfront','Shopping arcade.'],
  ['警署','Shopfront','Police station.'],
  ['的士','Meter','Taxi (the Cantonese word), heading the meter.'],
  ['車資 · 時間 · 速度','Meter','Fare · time · speed.'],
  ['尖沙咀 · 佐敦 · 油麻地 · 旺角','Meter','Tsim Sha Tsui, Jordan, Yau Ma Tei, Mong Kok: real districts, in order up Nathan Road.']
];
const ZH_ALL = SIGNS.map(s => s.zh).join('') + '押' + DISTRICTS.map(d => d.zh).join('') + '車資時間速度的士';
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
  const p = st.pos, on = playing ? 1 : 0;
  const bob = on * (Math.sin(p * 0.0021) * 0.75 + Math.sin(p * 0.0063 + 1.3) * 0.4 + Math.sin(p * 0.031) * 0.14);
  return { bob, roll: -clamp(st.lean, -1, 1) * 0.05, pitch: -st.brake * 1.8 + st.accel * 0.9, vib: on * Math.sin(p * 0.05) * 0.12 };
}
/* ================================================================ state */
const state = { pos: 30 * SEG, x: 0, tx: 0, speed: 7600, brake: 0, accel: 0, brakeKey: false, time: 75, fare: 27, hold: 0, sky: 0, lean: 0, keys: 0, caption: { d: -1, t: 0 }, flick: { on: 1, next: 0.6 }, grainT: 0 };
let playing = !reduceMotion, showMap = false, grainAmt = 0.75, midLevel = 15;
const B = []; for (let n = 0; n <= DRAW + 7; n++) B.push({ z: 0, scale: 0, sx: 0, sy: 0, ok: false });
let maskBld, maskSigns, roadPath, pavePath, deferred;

function update(dt){
  const st = state;
  st.pos = (st.pos + st.speed * dt) % TRACK;
  for (const c of cars) c.z = (c.z + c.speed * dt) % TRACK;
  for (const p of peds) if (p.speed){ p.z = (p.z + p.dir * p.speed * dt + TRACK) % TRACK; p.phase = (p.phase + p.speed * dt / 240) % 4; }
  const pz = st.pos + PLAYER_Z;
  if (st.keys){ st.tx = clamp(st.tx + st.keys * dt * 1.7, -0.85, 0.85); st.hold = 2.5; }
  else if (st.hold > 0) st.hold -= dt;
  else {
    const near = lane => { let best = 1e9; for (const c of cars){ if (Math.abs(c.x - lane) > 0.3) continue; const d = (c.z - pz + TRACK) % TRACK; if (d > 200 && d < best) best = d; } return best; };
    const cur = LANES.reduce((a, b) => Math.abs(b - st.tx) < Math.abs(a - st.tx) ? b : a);
    if (near(cur) < 5200){ let bestL = cur, bestD = near(cur); for (const l of LANES){ const d = near(l); if (d > bestD + 800){ bestD = d; bestL = l; } } st.tx = bestL; }
  }
  // speed: ease off behind slower traffic (the brake lights show) before pulling out round it; ↓ brakes hard
  let gap = 1e9, gapSpeed = 0;
  for (const c of cars){ if (Math.abs(c.x - st.x) > 0.35) continue; const d = (c.z - pz + TRACK) % TRACK; if (d > 200 && d < gap){ gap = d; gapSpeed = c.speed; } }
  let target = 7600;
  if (gap < 7500) target = lerp(gapSpeed + 300, 7600, clamp((gap - 2600) / 4900, 0, 1));
  if (st.brakeKey) target = Math.min(target, 1500);
  const prevSpeed = st.speed;
  st.speed += (target - st.speed) * Math.min(1, dt * (target < st.speed ? 1.8 : 0.7));
  const dec = (prevSpeed - st.speed) / Math.max(dt, 0.001);
  st.brake = lerp(st.brake, clamp((dec - 350) / 2000, 0, 1), Math.min(1, dt * 10));
  st.accel = lerp(st.accel, clamp(-dec / 1500, 0, 1), Math.min(1, dt * 4));
  const px = st.x;
  st.x += (st.tx - st.x) * Math.min(1, dt * 2.6);
  st.lean = lerp(st.lean, clamp((st.x - px) / Math.max(dt, 0.001) * 0.6, -1, 1), Math.min(1, dt * 6));
  st.sky -= segs[Math.floor(st.pos / SEG) % N_SEG].curve * st.speed * dt * 0.0000016;
  st.time -= dt; if (st.time < 0) st.time += 75;
  st.fare += st.speed * dt * 0.00012;
  if (!reduceMotion){
    st.flick.next -= dt;
    if (st.flick.next <= 0){ if (st.flick.on){ st.flick.on = 0; st.flick.next = 0.07 + Math.random() * 0.06; } else { st.flick.on = 1; st.flick.next = 0.45 + Math.random() * 1.8; } }
  }
  st.grainT += dt;
}
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
