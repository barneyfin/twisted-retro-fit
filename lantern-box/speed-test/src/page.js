/* ============================== the page: the speed test ============================== */
const HASH=location.hash.toLowerCase(),FLAG=f=>HASH.indexOf(f)>=0;
const state={level:"night",way:"kit",crowd:!FLAG("crowd0"),rise:!FLAG("rise0"),rm:false,screen:"wide",paused:false};
try{state.rm=matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
const stage=document.getElementById("stage"),box=document.getElementById("stageBox"),readout=document.getElementById("readout"),badge=document.getElementById("badge"),ovStat=document.getElementById("ovStat");
const ctx=stage.getContext("2d");let off=mk(10,10);
const scenes={};let sceneScale=0,W=960,S=1,camX=600,camY=0,last=0,t0=performance.now();
function sceneFor(ver){const sc=Math.min(2,Math.max(0.5,Math.round(S*4)/4));if(sc!==sceneScale){for(const k in scenes)delete scenes[k];sceneScale=sc;}if(!scenes[ver])scenes[ver]=new Scene(ver,sc);return scenes[ver];}
function resize(){
  const r=box.getBoundingClientRect(),dpr=FLAG("res1")?1:Math.min(2,window.devicePixelRatio||1);
  const cw=Math.max(200,Math.round(r.width*dpr)),ch=Math.max(100,Math.round(r.height*dpr));
  if(stage.width===cw&&stage.height===ch)return;
  stage.width=cw;stage.height=ch;S=ch/LH;W=cw/S;off=mk(cw,ch);
}
function opts(){
  return{level:state.level,rm:state.rm,walking:true,facing:1,hud:true,splash:"on",emberMouth:true,defeat:"cardwisp",dcol:EMBER.danger,dglow:EMBER.glow,win:GOLD_LIGHT,litP:LV[state.level].litP,crowd:state.crowd};
}
function draw(t){
  const sc=sceneFor(5),o=opts();
  if(state.way==="kit")sc.renderKit(ctx,S,W,t,camX,camY,o);
  else{sc.kit=false;sc.dyS=0;sc.render(ctx,off,S,W,t,camX,o);}
}

/* ---------- the readout ---------- */
const DEV=(()=>{ // the browser, the system and the graphics chip, as far as the browser says
  const ua=navigator.userAgent;let br="a browser";
  const m=ua.match(/Silk\/([\d.]+)/)||ua.match(/Edg\/([\d.]+)/)||ua.match(/Firefox\/([\d.]+)/)||ua.match(/Chrome\/([\d.]+)/)||ua.match(/Version\/([\d.]+).*Safari/);
  if(m){const name=/Silk/.test(m[0])?"Silk":/Edg/.test(m[0])?"Edge":/Firefox/.test(m[0])?"Firefox":/Chrome/.test(m[0])?"Chrome":"Safari";br=name+" "+m[1].split(".")[0];}
  const os=/Android ([\d.]+)/.test(ua)?"Android "+RegExp.$1:/iPhone|iPad/.test(ua)?"iOS":/Windows/.test(ua)?"Windows":/Mac OS X/.test(ua)?"macOS":/Linux/.test(ua)?"Linux":"";
  let gpu="";
  try{const c=document.createElement("canvas"),g=c.getContext("webgl");if(g){const e=g.getExtension("WEBGL_debug_renderer_info");gpu=e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);const l=g.getExtension("WEBGL_lose_context");if(l)l.loseContext();}}catch(e){}
  return{br,os,gpu:String(gpu||"").replace(/\s+/g," ").slice(0,90)};
})();
const MB=b=>Math.round(b/1048576);
function size(){return stage.width+" × "+stage.height+" ("+Math.round(W)+" × "+LH+" at "+S.toFixed(2)+"×)";}
let fpsN=0,fpsT=0,cpuSum=0;
function badgeTick(now,cpu){
  fpsN++;cpuSum+=cpu;
  if(now-fpsT<500)return;
  const fps=fpsN*1000/(now-fpsT),c=cpuSum/fpsN;fpsN=0;cpuSum=0;fpsT=now;
  badge.textContent=Math.round(fps)+" fps";
  if(!test)readout.textContent=LV[state.level].name+": "+LV[state.level].place+" · "+(state.way==="kit"?"the kit way":"the mock-up way")+" · "+size()+" · processor "+c.toFixed(1)+" ms a frame"+(state.way==="kit"?" · layer pictures "+MB(KIT.bytes)+" MB":"");
}

/* ---------- the test: each place in turn ---------- */
const PLACES=["night","storm","dawn","mist"],WARM=1.5,RUN=4,X8=2.5;
let test=null;
function startTest(){
  if(test)return;
  test={i:0,phase:"warm",t0:performance.now(),res:[],cur:null};
  setPlace(PLACES[0]);lock(true);
  document.getElementById("results").hidden=true;
}
function lock(on){for(const b of document.querySelectorAll("[data-lock]"))b.disabled=on;}
function pct(a,p){if(!a.length)return 0;const b=a.slice().sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.floor(p*b.length))];}
function testStep(now,dtMs,cpu){
  const T=test,el=(now-T.t0)/1000,lv=PLACES[T.i];
  if(T.phase==="warm"){if(el>=WARM){T.phase="run";T.t0=now;T.cur={lv,iv:[],cpu:[],x8n:0,x8t:0};}}
  else if(T.phase==="run"){T.cur.iv.push(dtMs);T.cur.cpu.push(cpu);if(el>=RUN){T.phase="x8";T.t0=now;T.x8start=null;}}
  else if(T.phase==="x8"){if(T.x8start===null){T.x8start=now;T.x8f=0;}else T.x8f++;
    if(el>=X8){const c=T.cur,n=c.iv.length,sum=c.iv.reduce((a,b)=>a+b,0);
      c.fps=n*1000/sum;c.slow=pct(c.iv,0.95);c.max=Math.max(...c.iv);c.cpuAvg=c.cpu.reduce((a,b)=>a+b,0)/Math.max(1,c.cpu.length);
      const gap=(now-T.x8start)/Math.max(1,T.x8f);c.drawn=gap/8;c.keptUp=gap<18;
      T.res.push(c);T.i++;
      if(T.i>=PLACES.length){finishTest();return;}
      T.phase="warm";T.t0=now;setPlace(PLACES[T.i]);}}
  readout.textContent="Testing "+LV[lv].name+" ("+(T.i+1)+" of "+PLACES.length+"): "+(T.phase==="warm"?"getting ready":T.phase==="run"?"measuring the frame rate":"drawing each frame eight times to time it")+"…";
  ovStat.textContent="Testing "+LV[lv].name+", "+(T.i+1)+" of "+PLACES.length+"…";
}
function fmtMs(c){return (c.keptUp?"under ":"")+c.drawn.toFixed(1)+" ms";}
function finishTest(){
  const R=test.res;test=null;lock(false);
  const worstMax=Math.max(...R.map(r=>r.max)),worstFps=Math.min(...R.map(r=>r.fps)),worstDrawn=Math.max(...R.map(r=>r.drawn)),worstSlow=Math.max(...R.map(r=>r.slow));
  const phone=R.every(r=>r.fps>=29.5&&r.drawn<=25),computer=R.every(r=>r.fps>=58);
  const rows=R.map(r=>"<tr><th scope=\"row\">"+LV[r.lv].name+"</th><td>"+Math.round(r.fps)+"</td><td>"+fmtMs(r)+"</td><td>"+Math.round(r.slow)+" ms</td><td>"+Math.round(r.max)+" ms</td><td>"+r.cpuAvg.toFixed(1)+" ms</td></tr>").join("");
  document.getElementById("resTable").innerHTML="<thead><tr><th scope=\"col\">Place</th><th scope=\"col\">Frames a second</th><th scope=\"col\">A frame drawn in</th><th scope=\"col\">Slowest 5% of frames</th><th scope=\"col\">Longest frame</th><th scope=\"col\">Processor per frame</th></tr></thead><tbody>"+rows+"</tbody>";
  document.getElementById("verdict").innerHTML=
    "<li><b>Phone target</b> (at least 30 fps, each frame drawn in 25 ms or less, in every place): "+(phone?"passes":"<em>doesn't pass</em>")+"</li>"+
    "<li><b>Computer target</b> (60 fps in every place): "+(computer?"passes":"<em>doesn't pass</em>")+"</li>";
  const line="Lantern Box speed test 1 · "+(state.way==="kit"?"kit way":"mock-up way")+" · "+DEV.br+(DEV.os?" on "+DEV.os:"")+(DEV.gpu?" · "+DEV.gpu:"")+" · "+size()+" · "+
    R.map(r=>LV[r.lv].name.replace("Blood-red rain","Rain")+" "+Math.round(r.fps)+" fps / "+fmtMs(r)).join(" · ")+" · slowest 5% "+Math.round(worstSlow)+" ms · longest "+Math.round(worstMax)+" ms · layer pictures "+MB(KIT.bytes)+" MB · crowd "+(state.crowd?"on":"off")+" · rise "+(state.rise&&state.way==="kit"?"on":"off")+(state.rm?" · reduce motion":"")+(FLAG("res1")?" · #res1":"");
  document.getElementById("resLine").textContent=line;
  document.getElementById("results").hidden=false;ovStat.textContent="";
  if(isFull()){exitFull();setTimeout(()=>{try{document.getElementById("results").scrollIntoView({block:"start"});}catch(e){}},300);}
  readout.textContent="Test finished: lowest "+Math.round(worstFps)+" fps, slowest frame drawn in "+worstDrawn.toFixed(1)+" ms.";
}

/* ---------- the frame loop ---------- */
function frame(now){
  if(state.paused){last=now;requestAnimationFrame(frame);return;}
  const dtMs=last?now-last:16.7,dt=Math.min(0.05,dtMs/1000),t=(now-t0)/1000;last=now;
  camX+=60*dt;
  // timing a frame: draw eight frames in a row, each 1/60 s on from the last, so poses, tiles and the boss change as often as in play
  const reps=test&&test.phase==="x8"?8:1,x0=camX,c0=performance.now();
  for(let r=0;r<reps;r++){const tr=t+r/60;camX=x0+r;camY=state.rise&&state.way==="kit"?RISE*(0.5-0.5*Math.cos(2*Math.PI*tr/RISE_PER)):0;draw(tr);}
  camX=x0;
  const cpu=(performance.now()-c0)/reps;
  badgeTick(now,cpu);
  if(test)testStep(now,dtMs,cpu);
  requestAnimationFrame(frame);
}

/* ---------- the switches ---------- */
function press(ids,on){ids.forEach(id=>document.getElementById(id).setAttribute("aria-pressed",String(id===on)));}
const LVB={night:"lvNight",storm:"lvStorm",dawn:"lvDawn",mist:"lvMist"};
function setPlace(lv){state.level=lv;press(Object.values(LVB),LVB[lv]);setLabel();}
function setLabel(){stage.setAttribute("aria-label","Speed test: Gloam Hallow's "+LV[state.level].name+" scene, "+LV[state.level].place+", drawn "+(state.way==="kit"?"the kit way":"the mock-up way")+(state.crowd?", with a crowd of monsters and a boss":"")+".");}
for(const lv in LVB)document.getElementById(LVB[lv]).onclick=()=>setPlace(lv);
document.getElementById("wayKit").onclick=()=>{state.way="kit";press(["wayKit","wayMock"],"wayKit");setLabel();};
document.getElementById("wayMock").onclick=()=>{state.way="mock";press(["wayKit","wayMock"],"wayMock");setLabel();};
const crowdBtn=document.getElementById("crowdBtn"),riseBtn=document.getElementById("riseBtn");
crowdBtn.onclick=()=>{state.crowd=!state.crowd;crowdBtn.setAttribute("aria-pressed",String(state.crowd));setLabel();};
riseBtn.onclick=()=>{state.rise=!state.rise;riseBtn.setAttribute("aria-pressed",String(state.rise));};
crowdBtn.setAttribute("aria-pressed",String(state.crowd));riseBtn.setAttribute("aria-pressed",String(state.rise));
document.getElementById("scWide").onclick=()=>{press(["scWide","scPhone"],"scWide");box.classList.remove("phone");};
document.getElementById("scPhone").onclick=()=>{press(["scWide","scPhone"],"scPhone");box.classList.add("phone");};
document.getElementById("runBtn").onclick=startTest;
/* Full screen: the real thing where the browser allows it. Inside the Claude app the page sits in a frame that may not
   be allowed to take over the screen, so then the picture fills the whole frame instead, with its own buttons on top. */
const realFull=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
function setFill(on){box.classList.toggle("fill",on);document.documentElement.classList.toggle("noscroll",on);}
async function enterFull(){
  const f=box.requestFullscreen||box.webkitRequestFullscreen,ok=document.fullscreenEnabled||document.webkitFullscreenEnabled;
  if(f&&ok){try{await f.call(box);if(realFull())return;}catch(e){}}
  setFill(true);
}
function exitFull(){
  if(realFull()){try{const x=(document.exitFullscreen||document.webkitExitFullscreen).call(document);if(x&&x.catch)x.catch(()=>{});}catch(e){}}
  setFill(false);
}
const isFull=()=>realFull()||box.classList.contains("fill");
document.getElementById("fsBtn").onclick=enterFull;
document.getElementById("exitBtn").onclick=exitFull;
document.getElementById("runIn").onclick=startTest;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&box.classList.contains("fill"))setFill(false);});
document.getElementById("copyBtn").onclick=async()=>{const t=document.getElementById("resLine").textContent,msg=document.getElementById("copyMsg");
  try{await navigator.clipboard.writeText(t);msg.textContent="Copied.";}catch(e){const r=document.createRange();r.selectNodeContents(document.getElementById("resLine"));const sl=getSelection();sl.removeAllRanges();sl.addRange(r);msg.textContent="Selected: copy it with your device's copy command.";}};
document.addEventListener("visibilitychange",()=>{state.paused=document.hidden;});
new ResizeObserver(()=>resize()).observe(box);

window.GH={fill:setFill,isFull,state,scene:()=>sceneFor(5),setCam:(x,y)=>{camX=x;if(y!==undefined)camY=y;},renderAt:(t,x,y)=>{camX=x;camY=y||0;draw(t);},kit:KIT,setPlace,startTest,result:()=>document.getElementById("resLine").textContent};
resize();setLabel();
const go=()=>requestAnimationFrame(frame);
if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('24px "IM Fell English"'),document.fonts.load('11px "Alegreya Sans"')]).catch(()=>{}).then(go);}else go();
})();
</script>
