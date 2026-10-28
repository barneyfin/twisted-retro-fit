
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
let hudBase = null, hudKey = '';
const glyphs = new Map();
function hudLayout(){
  hudC.width = Math.round(HUDW * RS); hudC.height = Math.round((H - HUDY) * RS);
  hudC.style.top = (HUDY / H * 100) + '%'; hudC.style.width = (HUDW / W * 100) + '%'; hudC.style.height = ((H - HUDY) / H * 100) + '%';
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
  const label = (yy, zh, en) => { hudText(g, zh, L0, yy, 13, 700, F.zhSans, lab); hudText(g, en, L0 + zh.length * 14 + 6, yy - 1, 11, 600, F.plex, lab, 'left', 1); };
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
function drawHUD(st){
  const di = districtAt(st.pos), dist = DISTRICTS[di.d];
  const fare = st.fare.toFixed(2), time = String(Math.ceil(st.time)).padStart(2, '0'), kmh = String(Math.round(st.speed / 88));
  if (st.caption.d !== di.d){ st.caption.d = di.d; st.caption.t = 0; }
  const a = clamp(st.caption.t / 0.6, 0, 1), key = fare + '|' + time + '|' + kmh + '|' + di.d + '|' + a.toFixed(2);
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

/* ================================================================ size: the street fills the screen; phones held sideways get the wider picture */
let ready = false, laidOut = false;
const OPT = { smooth: /smooth0/.test(location.hash) ? 0 : /smooth2/.test(location.hash) ? 2 : 4, res1: /res1/.test(location.hash) };
function layout(){
  const wrap = document.querySelector('.wrap'), cs = getComputedStyle(wrap);
  const avW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), avH = Math.max(180, window.innerHeight - 20);
  const nW = avW / avH > 1.9 ? 1170 : 960;
  let cw = avW; if (cw * H / nW > avH) cw = avH * nW / H;
  cw = Math.floor(cw);
  screenEl.style.width = cw + 'px'; screenEl.style.aspectRatio = nW + ' / ' + H;
  const nRS = clamp((window.devicePixelRatio || 1) * cw / nW, 1, OPT.res1 ? 1 : 1.5), nPW = Math.round(nW * nRS), nPH = Math.round(H * nRS);
  const changed = !laidOut || nW !== W || nPW !== PW || nPH !== PH;
  laidOut = true;
  W = nW; K = W / 2; RS = nRS; PW = nPW; PH = nPH;
  if (changed){
    canvas.width = PW; canvas.height = PH; hudLayout();
    if (ready){ makeTargets(); makeSkylineTex(); bakeCab(); }
  }
  return changed;
}

/* ================================================================ measuring */
const fmt = (v, d = 0) => Number.isFinite(v) ? v.toFixed(d) : '–';
const median = a => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
let last = 0, raf = 0, visible = true, frameNo = 0, fpsAcc = 0, fpsN = 0, fps = 0, cpuAcc = 0, cpuN = 0, cpuMs = 0, gpuShow = NaN;
// The test has two parts. First the street runs normally and every gap between frames is recorded (the frame rate).
// Then each frame is drawn eight times over, seven of them off screen, so the device can't keep up with the screen;
// the gap between screen updates then shows the real cost, and dividing by eight gives the time to draw one frame.
// (Waiting for the graphics chip to finish a single frame doesn't work: browsers make that wait for the screen's next refresh.)
const LOADN = 8;
const test = { on: false, t: 0, warm: 0.7, fpsDur: 3.5, settle: 0.4, loadDur: 2.5, phase: '', frames: [], load: [], cpu: [], gpu: [], done: null };
let rendererName = '';
function readGpu(){
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  rendererName = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).replace(/\s+/g, ' ').trim();
  $('#rGpu').textContent = rendererName || 'not reported';
}
function browserName(){
  const u = navigator.userAgent;
  const b = /Silk\/([\d.]+)/.exec(u) ? 'Silk ' + /Silk\/(\d+)/.exec(u)[1] : /Edg\/(\d+)/.exec(u) ? 'Edge ' + /Edg\/(\d+)/.exec(u)[1] : /CriOS\/(\d+)/.exec(u) ? 'Chrome ' + /CriOS\/(\d+)/.exec(u)[1] : /Chrome\/(\d+)/.exec(u) ? 'Chrome ' + /Chrome\/(\d+)/.exec(u)[1] : /Firefox\/(\d+)/.exec(u) ? 'Firefox ' + /Firefox\/(\d+)/.exec(u)[1] : /Version\/([\d.]+).*Safari/.exec(u) ? 'Safari ' + /Version\/([\d.]+)/.exec(u)[1] : 'browser';
  const os = /Android [\d.]+/.exec(u) ? /Android [\d.]+/.exec(u)[0] : /iPhone OS ([\d_]+)/.exec(u) ? 'iOS ' + /iPhone OS ([\d_]+)/.exec(u)[1].replace(/_/g, '.') : /iPad/.test(u) ? 'iPadOS' : /Windows NT/.test(u) ? 'Windows' : /Mac OS X/.test(u) ? 'macOS' : /CrOS/.test(u) ? 'ChromeOS' : /Linux/.test(u) ? 'Linux' : '';
  return b + (os ? ' on ' + os : '');
}
function updateReadout(){
  const d = DISTRICTS[districtAt(state.pos).d], done = test.done, gpuTxt = Number.isFinite(gpuShow) ? ', graphics chip ' + fmt(gpuShow, 1) + ' ms by its own timer' : '';
  $('#fpsBig').textContent = playing ? (fps || '…') + ' fps' : 'paused';
  $('#fpsSmall').textContent = test.on ? (test.phase === 'load' ? 'timing a frame…' : 'measuring…') : !playing ? 'press Play' : done ? 'frame drawn in ' + (done.about === 'under ' ? 'under ' : '') + fmt(done.cost, 1) + ' ms' : Number.isFinite(gpuShow) ? 'graphics chip ' + fmt(gpuShow, 1) + ' ms' : 'run the test to time a frame';
  $('#rFps').textContent = playing ? (fps || '…') + ' frames a second' + (test.on && test.phase === 'load' ? ' (slowed on purpose to time a frame)' : '') : 'paused';
  $('#rCost').textContent = (done ? (done.about === 'under ' ? 'under ' : '') + fmt(done.cost, 1) + ' ms in the Mong Kok test; now ' : 'run the test for this; now ') + 'processor ' + fmt(cpuMs, 1) + ' ms' + gpuTxt;
  $('#rWhere').innerHTML = '<span class="zh" lang="zh-Hant">' + d.zh + '</span> ' + d.en;
  $('#rPic').textContent = PW + ' × ' + PH + ' pixels (' + W + ' × ' + H + ' at ' + fmt(RS, 2) + '×), ' + (samples ? samples + '× edge smoothing' : 'no edge smoothing');
}
function startTest(){
  if (!ready) return;
  if (!playing) setPlaying(true);
  state.pos = (3 * DIST_LEN + 2) * SEG; state.speed = 7600; state.caption.d = -1;
  Object.assign(test, { on: true, t: 0, phase: 'warm', frames: [], load: [], cpu: [], gpu: [], done: null });
  if (timer) gpuMs = gpuN = 0;
  $('#run').disabled = true; $('#run').textContent = 'Testing…';
  $('#testState').textContent = 'Driving through Mong Kok and measuring every frame. Leave the page alone for about 7 seconds; for the last 3 the picture slows down on purpose while it times a frame.';
  $('#verdict').hidden = true; $('#sendme').hidden = true; $('#sendHead').hidden = true; $('#copy').hidden = true;
}
function finishTest(){
  test.on = false;
  const tot = test.frames.reduce((a, b) => a + b, 0), avg = test.frames.length / (tot / 1000), slow = pct(test.frames, 0.95), cost = median(test.load) / LOADN, cpu = median(test.cpu), gpu = test.gpu.length ? median(test.gpu) : NaN;
  // if the device kept up with the screen even while drawing each frame eight times, the true time is shorter still
  const sat = median(test.load) > median(test.frames) * 1.3, about = sat ? 'about ' : 'under ';
  const phoneOk = avg >= 29.5 && cost <= 25, pcOk = avg >= 58;
  test.done = { avg, slow, cost, cpu, gpu, about }; test.phase = '';
  $('#run').disabled = false; $('#run').textContent = 'Run the Mong Kok test again';
  $('#testState').innerHTML = '<strong>' + fmt(avg) + ' fps</strong> on average through Mong Kok. Each frame took ' + about + '<strong>' + fmt(cost, 1) + ' ms</strong> to draw' + (sat ? '' : ' (it kept up with the screen even when drawing every frame eight times)') + '; the slowest 1 in 20 came ' + fmt(slow, 0) + ' ms apart.';
  const set = (id, ok) => { const e = $('#' + id); e.textContent = ok ? 'pass' : 'below'; e.className = 'pill ' + (ok ? 'pass' : 'miss'); };
  set('pPhone', phoneOk); set('pPc', pcOk);
  $('#verdict').hidden = false;
  const line = 'City Nights speed test 2 · Mong Kok · ' + fmt(avg) + ' fps · frame drawn in ' + (sat ? '' : 'under ') + fmt(cost, 1) + ' ms (processor ' + fmt(cpu, 1) + (Number.isFinite(gpu) ? ', chip timer ' + fmt(gpu, 1) : '') + ') · slowest 5% ' + fmt(slow) + ' ms apart · ' + PW + '×' + PH + ' ' + samples + '× smoothing · ' + browserName() + ' · ' + (rendererName || 'unknown chip');
  $('#sendme').textContent = line; $('#sendme').hidden = false; $('#sendHead').hidden = false; $('#copy').hidden = false;
}

/* ================================================================ the loop */
function frame(now){
  raf = 0;
  const real = last ? (now - last) / 1000 : 0.016, dt = Math.min(0.05, real); last = now;
  if (playing) update(dt);
  state.caption.t += dt;
  const loading = test.on && test.phase === 'load';
  if (loading){ const fb = extraTarget(); for (let k = 1; k < LOADN; k++) renderGL(state, fb); }
  const t0 = performance.now();
  renderGL(state);
  const t1 = performance.now();
  if (!loading){ cpuAcc += t1 - t0; cpuN++; if (test.on && test.phase === 'fps') test.cpu.push(t1 - t0); }
  drawHUD(state);
  frameNo++;
  if (playing){
    fpsAcc += real; fpsN++;
    if (test.on){
      // the gap recorded belongs to the frame drawn before it, so each one is filed under the part that frame was drawn in
      if (test.prev === 'fps') test.frames.push(real * 1000);
      else if (test.prev === 'load') test.load.push(real * 1000);
      test.prev = test.phase;
      test.t += real;
      const T1 = test.warm, T2 = T1 + test.fpsDur, T3 = T2 + test.settle, T4 = T3 + test.loadDur;
      test.phase = test.t < T1 ? 'warm' : test.t < T2 ? 'fps' : test.t < T3 ? 'settle' : (test.t < T4 || test.load.length < 4) && test.t < T4 + 6 ? 'load' : 'end';
      if (test.phase === 'end'){ test.prev = ''; finishTest(); }
    }
  }
  if (fpsAcc > 0.5){
    fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0;
    if (cpuN){ cpuMs = cpuAcc / cpuN; cpuAcc = 0; cpuN = 0; }
    if (gpuN){ gpuShow = gpuMs / gpuN; gpuMs = 0; gpuN = 0; if (test.on && test.phase === 'fps') test.gpu.push(gpuShow); }
    updateReadout();
  }
  if ((playing || state.keys) && visible) raf = requestAnimationFrame(frame);
}
function kick(){ if (!raf && visible && ready){ last = 0; raf = requestAnimationFrame(frame); } }
function drawStill(){ if (!raf && ready) requestAnimationFrame(() => { renderGL(state); drawHUD(state); updateReadout(); }); }
function setPlaying(on){
  playing = on; const b = $('#play'); b.textContent = playing ? 'Pause' : 'Play'; b.setAttribute('aria-pressed', String(playing));
  if (playing) kick(); else { if (test.on){ test.on = false; $('#run').disabled = false; $('#run').textContent = 'Run the Mong Kok test'; $('#testState').textContent = 'The test stopped because the street was paused. Press Run to try again.'; } updateReadout(); }
}

/* ================================================================ page */
$('#play').addEventListener('click', () => setPlaying(!playing));
$('#run').addEventListener('click', startTest);
$('#copy').addEventListener('click', () => {
  const txt = $('#sendme').textContent, sel = () => { const r = document.createRange(); r.selectNodeContents($('#sendme')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
  try { navigator.clipboard.writeText(txt).then(() => { $('#copy').textContent = 'Copied'; }, () => { sel(); $('#copy').textContent = 'Selected: copy it now'; }); } catch (e){ sel(); }
});
const keyDir = { ArrowLeft: -1, ArrowRight: 1, a: -1, d: 1 }, held = new Set();
const brakeKeys = new Set(['ArrowDown', 's']);
canvas.addEventListener('keydown', e => { if (brakeKeys.has(e.key)){ e.preventDefault(); state.brakeKey = true; kick(); } });
canvas.addEventListener('keyup', e => { if (brakeKeys.has(e.key)) state.brakeKey = false; });
canvas.addEventListener('keydown', e => { if (keyDir[e.key] !== undefined){ e.preventDefault(); held.add(e.key); state.keys = [...held].reduce((s, k) => s + keyDir[k], 0); kick(); } });
canvas.addEventListener('keyup', e => { if (keyDir[e.key] !== undefined){ held.delete(e.key); state.keys = [...held].reduce((s, k) => s + keyDir[k], 0); } });
canvas.addEventListener('blur', () => { held.clear(); state.keys = 0; state.brakeKey = false; });
let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; drag.x = e.clientX; state.tx = clamp(state.tx + dx / canvas.clientWidth * 2.4, -0.85, 0.85); state.hold = 3; if (!playing){ state.x = state.tx; drawStill(); } });
const endDrag = () => { drag = null; canvas.style.cursor = 'grab'; };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting && !document.hidden; if (visible && playing) kick(); }).observe(screenEl);
document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible && playing) kick(); });
let rT = 0;
window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { layout(); if (!playing) drawStill(); }, 200); });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ready = false; showNotice('The graphics chip was reset by the browser. Reload the page to carry on.'); });
function showNotice(msg){ const n = $('#notice'); n.textContent = msg; n.hidden = false; }
function fontsReady(){
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const loads = ['900 40px "Noto Serif TC"', '700 40px "Noto Sans TC"', '900 40px "Noto Sans TC"'].map(f => document.fonts.load(f, ZH_ALL));
  ['700 20px "Antonio"', '600 20px "IBM Plex Sans Condensed"', '500 20px "IBM Plex Sans Condensed"'].forEach(f => loads.push(document.fonts.load(f, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$.')));
  return Promise.race([Promise.all(loads), new Promise(r => setTimeout(r, 5000))]).catch(() => {});
}
async function start(){
  if (!gl){ showNotice('This test needs WebGL2, which this browser does not offer. Try a current version of Chrome, Safari, Edge or Firefox.'); $('#run').disabled = true; return; }
  try {
    buildTrack(); buildPeople(); buildCars(); makeTiles();
    layout();
    await fontsReady();
    showNotice('Building the street…');
    await new Promise(r => setTimeout(r, 30));
    const tb = performance.now();
    buildSprites(); initGL(); buildAtlas(); buildStreet(); makeTargets(); makeSkylineTex(); bakeCab();
    window.__stBuild = performance.now() - tb;
    readGpu(); ready = true; $('#notice').hidden = true;
    if (reduceMotion){ setPlaying(false); $('#testState').innerHTML = 'Your device asks for reduced motion, so the street starts paused. Press <em>Run the Mong Kok test</em> when you are ready; it moves for 7 seconds.'; }
    updateReadout();
    if (playing) kick(); else drawStill();
  } catch (err){
    showNotice('The street could not be drawn: ' + (err && err.message ? err.message.split('\n')[0] : err));
    console.error(err);
  }
}
window.__st = { state, render: () => { renderGL(state); drawHUD(state); }, info: () => ({ W, H, RS, PW, PH, samples, layers: atlas.layers, verts: Object.fromEntries(Object.entries(R).map(([k, r]) => [k, r.nv])), tris: Object.fromEntries(Object.entries(R).map(([k, r]) => [k, r.ni / 3])), build: window.__stBuild, renderer: rendererName }), setPlaying, test };
start();
})();
</script>
