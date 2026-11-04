/* Lantern Box: the World's drawing code, design system version 8 (4 November 2026).
   Everything from "helpers" to "the sample strip" below is the drawing code of the signed-off look, the Gloam Hallow
   directions page at round 12 (1 November 2026), with the places' changes of versions 2 to 5 (made in Claude Code and
   chosen by Barney: among them each place's lift, the layer tints, the moor's stone circles and backdrop doors ending at
   the ground line), and two changes made in version 6, marked where they are:
     - the bosses: round 12's four (washed-out level colours) replaced by the four agreed in the bosses rework: the veiled
       ghost, the tentacled skull, the gaping tree (windswept) and the moor mother (in place of the cauldron witch);
     - the monsters: every card piece of the five monsters in play graded charcoal to ink inside an ink edge (CARD, cardFill,
       cardTaper), as the bosses are.
   Version 7 (3 November 2026) makes both show on a phone: the card blacks' lighter steps raised (CH), and the bosses' glow
   1.2 times larger, 1.6 times stronger and drawn to lighten what is behind it (bossAura, bossGlow).
   Version 8 (4 November 2026, step 4b round 12): the boss names capitalised (they are names); the crows redrawn side on,
   beating their wings, as flocks over the moor and alone nearer (crowSide, drawCrowFlocks, drawCrowsAlone); leaves blowing
   across the Mist (drawLeaves). Everything else from the play-parts rounds is in play.js, beside this file.
   Only the page's own controls are left out. It draws the mock-up way: every layer redrawn every frame. Games draw the same
   shapes the kit's way (layers painted once in tiles and slid, poses painted once per puppet step), as the speed test proved.
   The door at the bottom (LanternBox.world) chooses the approved settings and names the parts. */
window.LanternBox = (function () {
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
      x.save();x.fillStyle=rgba(o2.win,o2.a);x.shadowColor=o2.win;x.shadowBlur=7;x.fill();x.restore();
      const cx=X+(hl.cx+hl.sk*0.3)*k,cy=Y+hl.cy*k,hw=hl.ww*k/2,hh=hl.wh*k/2;
      x.strokeStyle=o2.bar;x.lineWidth=Math.max(0.7,hl.ww*k*0.15);x.beginPath();
      if(hl.kind==="round"){x.moveTo(cx,cy-hw*1.1);x.lineTo(cx,cy+hw*1.1);x.moveTo(cx-hw*1.1,cy);x.lineTo(cx+hw*1.1,cy);}
      else{x.moveTo(cx,cy-hh*0.8);x.lineTo(X+hl.cx*k,cy+hh);x.moveTo(X+hl.cx*k-hw,cy+hh*0.12);x.lineTo(X+hl.cx*k+hw+hl.sk*k*0.3,cy+hh*0.06);}
      x.stroke();
    }else{x.fillStyle=o2.dark;x.fill();}
    if(hl.kind==="door"&&o2.crack){const by=Y+(hl.base||0)*k;x.save();x.fillStyle="rgba(255,207,106,0.9)";x.shadowColor="#ffcf6a";x.shadowBlur=6;x.fillRect(X+(hl.cx-hl.ww*0.38)*k,by-1.4*k,hl.ww*0.76*k,1.4*k);x.restore();}
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
    else if(L.fly==="crows")drawCrowFlocks(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9));else drawCrowsAlone(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9),3,false);if(lv==="mist")drawLeaves(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9),0); /* version 8 */
    at(0.5);this.layer(ctx,off,s,W,t,camX*f(0.5),3,tn[2],o);mb(3);
    at(0.62);
    if(L.fly==="bats")drawBigBats(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.7));
    else if(L.fly==="crows")drawCrowsAlone(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.7),3,true);if(lv==="mist")drawLeaves(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.78),1); /* version 8 */
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
    for(const fl of fairies)drawFairy(x,fl,t,o.level);
    if(eyes.length)drawTreeEyes(x,eyes,t,L,o.rm);
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
    x.fillStyle=INK;
    x.beginPath();x.moveTo(-10,LH+10);for(let sx=-10;sx<=W+10;sx+=6)x.lineTo(sx,gY(sx+camX));x.lineTo(W+10,LH+10);x.closePath();x.fill();
    const p0=Math.floor((camX-400)/P),p1=Math.floor((camX+W+400)/P),monsters=[];
    for(let p=p0;p<=p1;p++){
      const base=p*P,hv=posmod(p,3),wallTop=gY(base+930)-SD.wallH,hs=PH[hv],hX=base+1120-camX,hY=gY(base+1120)+6;
      for(const it of SD.items){
        if(it.k==="hatmaw"){if(hX>-400&&hX<W+400)monsters.push({kind:"hatmaw",X:hX+hs.perch.x,Y:hY+hs.perch.y,ph:p*1.7});continue;}
        const wx=base+it.x,X=wx-camX;
        if(X<-340||X>W+340)continue;
        const Y=gY(wx);
        switch(it.k){
          case "grave":if(this.ver>=5)drawGrave5(x,X,Y+4,1.45,it.v);else drawGrave(x,X,Y+4,1,it.v);break;
          case "fence":drawFence(x,X,wx,it.w);break;
          case "wall":drawWall(x,X,Y,it.w,it.h,p);break;
          case "potion":drawPotion(x,X,SD.potionGround?Y-SD.wallH+1:wallTop,t,o.rm);break;
          case "house":{drawSprite(x,hs,X,hY,1,false);
            const hr=rng32(hsh(29,p));
            fillHoles(x,hs,X,hY,1,hr,{litP:0.34,win:o.win,a:0.95,bar:INK,dark:"#1a1218",crack:true});
            if(hs.lampAt)drawWallLamp(x,X+hs.lampAt[0],hY+hs.lampAt[1],t,o.rm);
            if(SD.string){const ax=X+hs.anchor[0],ay=hY+hs.anchor[1],bx=base+POST_X-camX+2,by=gY(base+POST_X)-104,qx=(ax+bx)/2,qy=Math.max(ay,by)+34;
              x.lineWidth=1;x.strokeStyle=INK;x.beginPath();x.moveTo(ax,ay);x.quadraticCurveTo(qx,qy,bx,by);x.stroke();drawFairy(x,[ax,ay,qx,qy,bx,by,p+7],t,o.level);}
            break;}
          case "thorns":monsters.push(this.ver>=5?{kind:"crawler",X,Y:Y+3,ph:p}:{kind:"thorns",X,Y:Y+3,w:it.w,ph:p});break;
          case "ghoul":monsters.push({kind:this.ver>=5?"ghoul2":"ghoul",X,Y:Y+2,ph:p*2.3});break;
          case "bat":monsters.push({kind:this.ver>=5?"bat2":"bat",X:X+Math.sin(t*0.9+p)*30,Y:it.y+Math.sin(t*1.7+p)*16,ph:p});break;
          case "post":if(set==="town")drawStreetLamp(x,X,Y,o.win);else drawPost(x,X,Y,true,o.win);break;
          case "candle":drawCandle(x,X,Y+4,t,o.rm);break;
          case "lamp":drawStreetLamp(x,X,Y,o.win);break;
          case "barrels":drawBarrels(x,X,Y);break;
          case "crates":drawCrates(x,X,Y);break;
          case "well":drawWell(x,X,Y);break;
          case "menhir":drawMenhir(x,X,Y+2,1,it.v);break;
          case "cairn":drawCairn(x,X,Y,1);break;
          case "fallen":drawFallen(x,X,wx);break;
          case "stonewall":drawStoneWall(x,X,wx,it.w,it.h,p);break;
          case "stump":drawStumpProp(x,X,Y,1,it.v);break;
          case "bigstump":drawBigStump(x,X,Y,it.v,p);break;
          case "grass":drawSprite(x,Pp.get("wind").wgrass[posmod(p+Math.round(it.x/100),4)],X,Y+5,0.62,false);break;
          case "ferns":drawFerns(x,X,wx,it.w,p);break;
          case "shrine":drawShrine(x,X,Y+2,t,o.rm);break;
          case "log":drawLog(x,X,wx,it.w,it.h,p);break;
        }
      }
    }
    const spk=set==="village"?"village5":set;
    if(this.ver>=5&&o.splash!=="none"&&SPLASH[spk])for(let p=p0;p<=p1;p++)SPLASH[spk].forEach((sx,i)=>{const wx=p*P+sx,X=wx-camX;if(X<-80||X>W+80)return;drawSplash(ctx,spk,o.splash,X,gY(wx)+3,t,o.rm,p*3+i,"green","intense");});
    for(const m of monsters)if(m.X>-160&&m.X<W+160)this.monster(ctx,s,m,t,o);
    const px=W*0.28;drawWanderer(ctx,px,gY(camX+px)+1,t,o.walking,o.facing,o.rm,this.ver<5?null:LV[o.level].edge);
  }
  monsterInto(c,s,m,t,o,dx,dy,H){ // a monster with its rim, glow and ember details, drawn into canvas c with its origin at (dx+130s, dy+230s)
    H=H||this;if(!H.tmp||H.tmpS!==s){H.tmp=mk(260*s,250*s);H.tmpS=s;}
    const T=H.tmp,tc=T.getContext("2d");
    tc.setTransform(1,0,0,1,0,0);tc.globalCompositeOperation="source-over";tc.clearRect(0,0,T.width,T.height);tc.setTransform(s,0,0,s,130*s,230*s);
    tc.fillStyle=INK;tc.strokeStyle=INK;tc.lineCap="round";tc.lineJoin="round";
    {const b=MON_BOX[m.kind]||[-128,-228,128,18],w=b[2]-b[0],h=b[3]-b[1];CARD={box:[b[0]+w*0.44,b[1]+h*0.3,Math.max(w,h)*0.62],edge:m.kind==="bat2"||m.kind==="crawler"?1.2:1.7};}
    let det;try{det=MONSTER[m.kind](tc,t,m,o.rm);}finally{CARD=null;} // graded card pieces while the monster draws (version 6)
    c.save();c.setTransform(1,0,0,1,0,0);
    const bb=MON_BOX[m.kind]||[-128,-228,128,18],sx=Math.max(0,Math.floor((130+bb[0])*s)),sy=Math.max(0,Math.floor((230+bb[1])*s)),sw=Math.min(T.width-sx,Math.ceil((bb[2]-bb[0])*s)),sh=Math.min(T.height-sy,Math.ceil((bb[3]-bb[1])*s));
    const put=()=>c.drawImage(T,sx,sy,sw,sh,dx+sx,dy+sy,sw,sh);
    c.shadowColor=rgba(o.dcol,0.95);c.shadowBlur=2.5*s;put();   // the rim
    c.shadowColor=rgba(o.dglow,0.6);c.shadowBlur=11*s;put();    // the glow
    c.shadowColor="transparent";c.shadowBlur=0;put();
    c.setTransform(s,0,0,s,dx+130*s,dy+230*s);det(c,o);
    c.restore();
  }
  monster(ctx,s,m,t,o){this.monsterInto(ctx,s,m,t,o,Math.round((m.X-130)*s),Math.round((m.Y-230)*s));}
  fore(ctx,s,W,t,lx,o){
    const Pp=this.pools,cw=900,k0=Math.floor((lx-200)/cw),k1=Math.floor((lx+W+200)/cw),set=this.ver<5?"village":LV[o.level].set;
    if(set==="moor"||set==="forest"){const Wd=Pp.get("wind"),moor=set==="moor";
      for(let k=k0;k<=k1;k++){const r=rng32(hsh(37,k,set.length));
        for(let i=0;i<5;i++){const X=k*cw+i*180+r()*80-lx;drawSprite(ctx,moor?Wd.heather[Math.floor(r()*4)]:Wd.fern[Math.floor(r()*3)],X,LH+4,0.9+r()*0.5,r()<0.5);}
        if(moor)for(let i=0;i<2;i++){const X=k*cw+i*450+r()*300-lx;drawSprite(ctx,Wd.wgrass[Math.floor(r()*4)],X,LH+8,0.9+r()*0.4,false);}
        if(!moor&&r()<0.5){const X=k*cw+r()*cw-lx;drawSprite(ctx,Wd.fo[Math.floor(r()*2)],X,-6,0.9,false);}}
      return;}
    for(let k=k0;k<=k1;k++){
      const r=rng32(hsh(37,k));
      for(let i=0;i<5;i++){const X=k*cw+i*180+r()*80-lx;drawSprite(ctx,Pp.tuft[Math.floor(r()*4)],X,LH+4,0.9+r()*0.5,false);}
      if(r()<0.4){const X=k*cw+r()*cw-lx,j=Math.floor(r()*2);drawSprite(ctx,Pp.fgb[j],X,-6,0.9,r()<0.5);}
    }
  }
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
function drawCrow(x,X,Y,k,ph,col){
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
/* version 8 (step 4b round 12, Barney, 4 November 2026): the crow redrawn side on, beating its wings as the bats do; the moor's
   flocks; the crows flying alone; the Mist's leaves. The old drawCrow and drawCrows are kept for reference but no longer drawn. */
/* Round 12, the places: the moor's crow flocks (like the night's bat swarm, crossing left to right) beside its solitary crows,
   and the Mist's leaves blowing across from left to right. The design system's scene calls these where it draws its flyers
   (the page's build adds the calls to bundle.js; version 8 makes them part of it). Scenery: tinted as their layer, no glow. */
// a crow side on, flying right, beating its wings as the bats do: a long body, a head with a heavy beak and a fanned tail,
// and long wings with five fingers splayed at the tip. ph: the beat; cos(ph) is the near wing's lift, +1 up, -1 down.
function crowSide(x,X,Y,k,ph,col){x.save();x.translate(X,Y);x.scale(k,k);x.fillStyle=col;const c=Math.cos(ph);
  const wing=(sx,sy,lift)=>{x.save();x.translate(sx,sy);x.rotate(-0.38);x.scale(1,lift);x.beginPath();x.moveTo(4.2,0.6);x.quadraticCurveTo(5,-7,3.4,-9.6);x.lineTo(2.6,-16);x.lineTo(1.7,-12.6);
    x.lineTo(0.8,-16.4);x.lineTo(-0.1,-12.4);x.lineTo(-1.1,-15.6);x.lineTo(-1.8,-11.8);x.lineTo(-3,-14.2);x.lineTo(-3.3,-10.6);x.quadraticCurveTo(-4.6,-5,-3.8,0.6);x.closePath();x.fill();x.restore();};
  const lift=v=>Math.sign(v||1)*Math.max(0.16,Math.abs(v));
  wing(2.2,-1.6,lift(c*0.85+0.22));                                                   // the far wing, behind
  x.beginPath();x.ellipse(0,0,7,2.6,-0.04,0,Math.PI*2);x.fill();                      // body
  x.beginPath();x.arc(7.2,-1.1,2.4,0,Math.PI*2);x.fill();                             // head
  x.beginPath();x.moveTo(9,-2.1);x.lineTo(13.4,-0.7);x.lineTo(9,0.3);x.closePath();x.fill();   // beak
  x.beginPath();x.moveTo(-5.6,-1.3);x.lineTo(-13,-2.6);x.quadraticCurveTo(-14.2,0.6,-12.6,3.8);x.lineTo(-5.6,1.5);x.closePath();x.fill();   // tail
  wing(1,-1,lift(c));x.restore();}                                                    // the near wing
// flocks of crows, as the night's bat swarms are made: two flocks, close and wheeling, every crow beating its wings, crossing left to right
function drawCrowFlocks(x,W,t,lx,rm,col){const span=W+800,v=rm?22:50,N=rm?11:22;
  for(let f=0;f<2;f++){const cx=-400+((t*v+f*span*0.55-lx)%span+span)%span,cy=165+f*50+Math.sin(t*0.4+f*2)*16;
    if(cx<-260||cx>W+260)continue;
    for(let i=0;i<N;i++){const h=(m,q)=>{const r=Math.sin((f*97+i*13.7)*m)*q;return r-Math.floor(r);},a=h(12.9898,43758.5453),b=h(78.233,24658.37),c=h(39.42,9658.1);
      const wob=Math.sin(t*(rm?0.6:1.2)+i)*(rm?2:5),ox=(a-0.5)*230+wob*0.5,oy=(b-0.5)*80+wob,k=0.52+c*0.24;
      crowSide(x,cx+ox,cy+oy,k,t*(rm?4.5:9)+i*0.7,col);}}};
// a leaf: a pointed oval with a short stem, turned and squashed as it tumbles
function leafShape(x,X,Y,k,ang,turn,col){x.save();x.translate(X,Y);x.rotate(ang);x.scale(k,k*Math.max(0.15,Math.abs(Math.cos(turn))));x.fillStyle=col;
  x.beginPath();x.moveTo(-6,0);x.quadraticCurveTo(-1,-3.6,6,0);x.quadraticCurveTo(-1,3.6,-6,0);x.closePath();x.fill();x.fillRect(-8.5,-0.45,3,0.9);x.restore();}
// leaves on the wind: depth 0 far (small, slow, tinted), 1 nearer; gusts come and go
function drawLeaves(x,W,t,lx,rm,col,depth){const N=depth?(rm?4:9):(rm?7:16),sp=depth?(rm?70:190):(rm?40:110),span=W+300,H=420;
  for(let i=0;i<N;i++){const r1=Math.sin((depth*53+i*17.1)*12.9898)*43758.5453,a=r1-Math.floor(r1),r2=Math.sin((depth*29+i*5.7)*78.233)*24658.37,b=r2-Math.floor(r2);
    const gust=1+0.45*Math.sin(t*0.37+i*0.21)+0.25*Math.sin(t*1.1+depth),v=sp*(0.75+a*0.5)*gust;
    const X=-150+(((t*v+a*span*3-lx)%span)+span)%span,Y=(depth?120:90)+b*H*(depth?0.7:0.75)+Math.sin(t*(1.3+a)+i)*(depth?18:10)+X*0.05*(b-0.4);
    const k=depth?(1.3+a*0.7):(0.7+a*0.4),ang=Math.sin(t*(2+a*2)+i)*0.9+t*(depth?2.2:1.2)*(b>0.5?1:-1),turn=t*(3+b*4)+i;
    leafShape(x,X,Y,k,ang,turn,col);}};
// crows flying alone or in a few: the same crow, nearer and bigger (the moor's three near ones; the Mist's three far ones)
function drawCrowsAlone(x,W,t,lx,rm,col,n,big){const span=W+760;
  for(let i=0;i<n;i++){const v=big?(rm?20:52)+i*12:(rm?12:30)+i*6,X=-220+(((t*v+i*span*0.41-lx)%span)+span)%span,Y=(big?118+i*54:170+i*26)+Math.sin(t*0.5+i*1.9)*(big?10:6);
    crowSide(x,X,Y,big?1.15+i*0.14:0.62+i*0.07,t*(rm?3:6)+i*1.3,col);}};

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
  const g=x.createRadialGradient(X,Y-10,2,X,Y-10,30);g.addColorStop(0,rgba(POTION,0.5*pulse));g.addColorStop(1,rgba(POTION,0));x.fillStyle=g;x.fillRect(X-32,Y-42,64,64);
  x.fillStyle=INK;x.beginPath();x.arc(X,Y-8,8,0,Math.PI*2);x.fill();x.fillRect(X-2.5,Y-22,5,10);x.fillRect(X-4,Y-24,8,3);
  x.fillStyle=POTION;x.beginPath();x.arc(X,Y-8,6,0.15,Math.PI-0.15);x.closePath();x.fill();
  x.fillStyle="rgba(255,255,255,0.55)";x.beginPath();x.arc(X-2.5,Y-10,1.4,0,Math.PI*2);x.fill();
  for(let i=0;i<3;i++){const ph=((t*(rm?0.2:0.5)+i/3)%1);x.fillStyle=rgba(POTION,0.7*(1-ph));x.beginPath();x.arc(X+Math.sin(ph*6+i)*5,Y-22-ph*26,1.3,0,Math.PI*2);x.fill();}
}
function drawFairy(x,fl,t,lv){
  const ax=fl[0],ay=fl[1],qx=fl[2],qy=fl[3],bx=fl[4],by=fl[5],seed=fl[6],n=10;
  for(let i=1;i<n;i++){const u=i/n,v=1-u,px=v*v*ax+2*v*u*qx+u*u*bx,py=v*v*ay+2*v*u*qy+u*u*by;
    const tw=0.7+0.3*Math.sin(t*1.1+i*1.7+seed);
    x.save();x.fillStyle=lv==="storm"?"rgba(255,201,168,"+tw+")":"rgba(255,241,200,"+tw+")";x.shadowColor="#ffd27a";x.shadowBlur=8;x.beginPath();x.arc(px,py,1.8,0,Math.PI*2);x.fill();x.restore();}
}
function drawPost(x,X,Y,lit,col){
  x.fillStyle=INK;x.strokeStyle=INK;x.lineWidth=4;
  x.beginPath();x.moveTo(X,Y+4);x.lineTo(X+2,Y-104);x.stroke();
  x.lineWidth=3;x.beginPath();x.moveTo(X+2,Y-100);x.quadraticCurveTo(X+16,Y-112,X+18,Y-98);x.stroke();
  const lx=X+18,ly=Y-90;
  if(lit){const g=x.createRadialGradient(lx,ly,2,lx,ly,46);g.addColorStop(0,rgba(col,0.55));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(lx-48,ly-48,96,96);}
  x.fillStyle=INK;x.fillRect(lx-7,ly-10,14,4);x.fillRect(lx-6,ly+8,12,3);
  x.fillStyle=lit?"#ffdf9a":"#16110f";x.fillRect(lx-5.5,ly-6,11,14);
  x.strokeStyle=INK;x.lineWidth=1.2;x.strokeRect(lx-5.5,ly-6,11,14);x.beginPath();x.moveTo(lx-2,ly-6);x.lineTo(lx-2,ly+8);x.moveTo(lx+2,ly-6);x.lineTo(lx+2,ly+8);x.stroke();
}
function drawWallLamp(x,X,Y,t,rm){ // a bracket lantern by the door
  const g=x.createRadialGradient(X+9,Y+8,2,X+9,Y+8,42);g.addColorStop(0,"rgba(255,207,106,0.5)");g.addColorStop(1,"rgba(255,207,106,0)");x.fillStyle=g;x.fillRect(X-34,Y-34,86,86);
  x.strokeStyle=INK;x.fillStyle=INK;x.lineWidth=2.2;x.beginPath();x.moveTo(X,Y-6);x.lineTo(X+10,Y-6);x.lineTo(X+10,Y-1);x.stroke();
  x.fillRect(X+4.5,Y-1,11,2.5);x.fillStyle="#ffdf9a";x.fillRect(X+5.5,Y+1.5,9,11);
  x.strokeStyle=INK;x.lineWidth=1;x.strokeRect(X+5.5,Y+1.5,9,11);x.beginPath();x.moveTo(X+10,Y+1.5);x.lineTo(X+10,Y+12.5);x.stroke();
  x.fillStyle=INK;x.fillRect(X+5,Y+12.5,10,2);
}
function drawCandle(x,X,Y,t,rm){ // a candle at the foot of a grave
  const fl=1+0.12*Math.sin(t*(rm?2:5.3))+0.06*Math.sin(t*(rm?3:8.1));
  const g=x.createRadialGradient(X,Y-12,1,X,Y-12,30);g.addColorStop(0,"rgba(255,207,106,0.5)");g.addColorStop(1,"rgba(255,207,106,0)");x.fillStyle=g;x.fillRect(X-32,Y-44,64,64);
  x.fillStyle=INK;x.fillRect(X-2.4,Y-9,4.8,9);
  x.fillStyle="#ffdf9a";x.beginPath();x.moveTo(X,Y-9-8*fl);x.quadraticCurveTo(X+2.6,Y-12,X,Y-9.5);x.quadraticCurveTo(X-2.6,Y-12,X,Y-9-8*fl);x.fill();
}
/* the old town */
function drawStreetLamp(x,X,Y,col){
  x.fillStyle=INK;x.strokeStyle=INK;
  x.beginPath();x.moveTo(X-7,Y+4);x.lineTo(X-3,Y-14);x.lineTo(X-2,Y-106);x.lineTo(X+2,Y-106);x.lineTo(X+3,Y-14);x.lineTo(X+7,Y+4);x.closePath();x.fill();
  x.fillRect(X-5,Y-20,10,3);x.fillRect(X-4,Y-62,8,2.5);x.lineWidth=1.6;x.beginPath();x.moveTo(X-12,Y-100);x.lineTo(X+12,Y-100);x.stroke();
  const ly=Y-116,g=x.createRadialGradient(X,ly,2,X,ly,52);g.addColorStop(0,rgba(col,0.55));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(X-54,ly-54,108,108);
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
    x.save();x.fillStyle=rgba("#eef1dc",a*vis);x.shadowColor="rgba(238,241,220,0.55)";x.shadowBlur=sz*2.2;
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
function witchGlow(x,cx,cy,r,a){x.save();r*=1+0.4*SPI;a=Math.min(0.85,a*(1+0.9*SPI));const g=x.createRadialGradient(cx,cy,1,cx,cy,r);g.addColorStop(0,rgba(SP.glow,a));g.addColorStop(1,rgba(SP.glow,0));x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);x.restore();}
function witchPool(x,cx,cy,w,a){x.save();w*=1+0.3*SPI;a=Math.min(0.8,a*(1+0.9*SPI));x.translate(cx,cy);x.scale(w/14,1);const g=x.createRadialGradient(0,0,0,0,0,14);g.addColorStop(0,rgba(SP.glow,a));g.addColorStop(1,rgba(SP.glow,0));x.fillStyle=g;x.fillRect(-14,-14,28,28);x.restore();}
function lit(x,pts,f){x.save();x.fillStyle=rgba(SPI?"#ecffc4":SP.core,Math.min(1,0.92*f*(1+0.15*SPI)));x.shadowColor=SP.glow;x.shadowBlur=6+7*SPI;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();
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
    x.save();x.shadowColor=SP.glow;x.shadowBlur=8+6*SPI;x.beginPath();
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
  x.fillStyle="#ffdf9a";x.shadowColor="#ffc35a";x.shadowBlur=9;x.fillRect(-3.2,7.8,6.4,7.6);x.shadowBlur=0;
  x.strokeStyle=INK;x.lineWidth=0.9;x.beginPath();x.moveTo(-1.1,7.8);x.lineTo(-1.1,15.4);x.moveTo(1.1,7.8);x.lineTo(1.1,15.4);x.stroke();
  x.restore();
  x.restore();
}
function drawWanderer(x,X,Y,t,walking,facing,rm,edge){
  const S=1.32,f=facing||1,p=walking?t*7:0,bob=walking?Math.abs(Math.sin(p))*1.1:0;
  const lx=X+f*(-9.5)*S,ly=Y+(-33.5+12-bob)*S;
  let g=x.createRadialGradient(lx,ly,2,lx,ly,74);g.addColorStop(0,"rgba(255,201,106,0.42)");g.addColorStop(1,"rgba(255,201,106,0)");x.fillStyle=g;x.fillRect(lx-76,ly-76,152,152);
  x.save();x.translate(X+1.3,Y-1.3);x.scale(f*S,S);x.fillStyle=x.strokeStyle=edge||"rgba(255,231,184,0.9)";wandererSil(x,t,walking,rm);x.restore();
  x.save();x.translate(X,Y);x.scale(f*S,S);x.fillStyle=x.strokeStyle=INK;wandererSil(x,t,walking,rm);wandererDetail(x,t,walking,rm);x.restore();
  g=x.createRadialGradient(X,Y+1,1,X,Y+1,30);g.addColorStop(0,"rgba(255,201,106,0.2)");g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(X-32,Y-6,64,14);
}
/* ============================== monsters (silhouette, then details) ============================== */
const MONSTER={
  hatmaw(x,t,m,rm){
    const hop=Math.max(0,Math.sin(t*(rm?1.4:2.6)+m.ph)),dy=-hop*(rm?3:9),sq=1-hop*0.06;
    x.save();x.translate(0,dy);x.scale(1/sq,sq);
    x.beginPath();x.ellipse(0,-7,34,6.5,0,0,Math.PI*2);cardFill(x);
    x.beginPath();x.moveTo(-21,-9);x.bezierCurveTo(-25,-34,-11,-52,4,-66);x.bezierCurveTo(12,-75,27,-73,24,-61);x.bezierCurveTo(21,-55,13,-58,15,-63);
    x.bezierCurveTo(10,-52,23,-31,21,-9);x.closePath();cardFill(x);
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
function limb(x,ax,ay,segs){let px=ax,py=ay;for(const g of segs){const nx=px+Math.sin(g[1])*g[0],ny=py+Math.cos(g[1])*g[0];cardTaper(x,[px,py,nx,ny,g[2],g[3]]);px=nx;py=ny;}return[px,py];}
/* Graded card pieces for the monsters (design system version 6, Barney 2 November: "grade them all"). While monsterInto draws a
   monster, CARD holds where its light sits; every limb segment 3 or more wide is graded across its width (charcoal on its upper
   side, falling to ink), and every body piece is filled charcoal to ink from a point high on the monster, inside an ink edge.
   Hairline claws and the thinnest twigs stay ink. Outside monsterInto, CARD is null and both draw plain ink as before. */
let CARD=null;
function cardTaper(x,s){
  taper(x,s);if(!CARD||s[4]<3)return;
  const dx=s[2]-s[0],dy=s[3]-s[1],L=Math.hypot(dx,dy)||1,nx=dy/L,ny=-dx/L,f=ny<0||(ny===0&&nx<0)?1:-1,w=(s[4]+s[5])/2,mx=(s[0]+s[2])/2,my=(s[1]+s[3])/2,hi=w>=6?CH[4]:CH[3];
  const g=x.createLinearGradient(mx+nx*f*w*0.42,my+ny*f*w*0.42,mx-nx*f*w*0.42,my-ny*f*w*0.42);g.addColorStop(0,CH[2]);g.addColorStop(0.3,hi);g.addColorStop(0.68,CH[2]);g.addColorStop(1,CH[0]);
  x.fillStyle=g;taper(x,[s[0],s[1],s[2],s[3],s[4]*0.7,s[5]*0.7]);x.fillStyle=INK;}
function cardFill(x){
  if(!CARD||x.globalCompositeOperation!=="source-over"){x.fill();return;}
  const b=CARD.box;x.fillStyle=rg(x,b[0],b[1],1,b[2],[[0,CH[4]],[0.5,CH[2]],[1,CH[0]]]);x.fill();
  x.save();x.strokeStyle=INK;x.lineWidth=CARD.edge;x.lineJoin="round";x.stroke();x.restore();x.fillStyle=INK;}
function emberMouth(c,pts,cx,cy,r){ // a glowing throat: hot at the back, dark red at the lips
  c.save();const g=c.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,"#ffc27a");g.addColorStop(0.45,EMBER.danger);g.addColorStop(1,"#5a0c08");
  c.fillStyle=g;c.shadowColor=EMBER.glow;c.shadowBlur=6;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.restore();}
function teeth(c,list){c.save();c.fillStyle=BONE;for(const q of list){c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[2],q[3]);c.lineTo(q[4],q[5]);c.closePath();c.fill();}c.restore();}
function seam(c,pts,w){c.save();c.strokeStyle=rgba(EMBER.danger,0.9);c.shadowColor=EMBER.glow;c.shadowBlur=5;c.lineWidth=w||1.1;c.lineCap="round";c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.restore();}
Object.assign(MONSTER,{
  crawler(x,t,m,rm){ // small: a low, many-legged thing that scuttles in jerks
    const tq=pz(t*1.3+m.ph,rm),w=Math.sin(tq*6);
    for(let i=0;i<3;i++){const bx=-8+i*9,ph=i%2?w:-w,fw=i<1||(i===1&&ph>0);
      limb(x,bx,-12,[[10,(fw?-2.35:2.35)+ph*0.22,2.6,1.7],[20,(fw?-0.22:0.22)+ph*0.16,1.7,0.6]]);}
    x.beginPath();x.moveTo(-14,-11);x.quadraticCurveTo(-6,-24,6,-22);x.lineTo(9,-27);x.lineTo(11,-21.5);x.lineTo(15,-25);x.lineTo(16,-18.5);x.quadraticCurveTo(21,-12,14,-8);x.quadraticCurveTo(0,-5,-14,-11);x.closePath();cardFill(x);
    x.beginPath();x.moveTo(-12,-15);x.quadraticCurveTo(-20,-19,-27,-15);x.lineTo(-25,-10);x.quadraticCurveTo(-19,-7,-12,-9);x.closePath();cardFill(x);
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
      x.beginPath();mem.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();cardFill(x);
      x.lineWidth=1.4;x.beginPath();x.moveTo(sd*3,-2);x.lineTo(e[0],e[1]);x.lineTo(wr[0],wr[1]);for(const tp of tips){x.moveTo(wr[0],wr[1]);x.lineTo(tp[0],tp[1]);}x.stroke();}
    x.beginPath();x.ellipse(0,0,3.6,6.5,0,0,Math.PI*2);cardFill(x);x.beginPath();x.ellipse(0,-6.5,3.2,3,0,0,Math.PI*2);cardFill(x);
    x.beginPath();x.moveTo(-3,-8);x.lineTo(-3.6,-13);x.lineTo(-0.8,-9);x.moveTo(3,-8);x.lineTo(3.6,-13);x.lineTo(0.8,-9);cardFill(x);
    return (c,o)=>{emberMouth(c,[[-1.8,-4.6],[1.8,-4.6],[1.2,-2.6],[0,-2],[-1.2,-2.6]],0,-4,3);teeth(c,[[-1.6,-4.6],[-1.1,-3],[-0.6,-4.6],[0.6,-4.6],[1.1,-3],[1.6,-4.6]]);
      eyes(c,o,[[-1.6,-7.2,0.3],[1.6,-7.2,-0.3]],1.1,0.8);};
  },
  ghoul2(x,t,m,rm){ // medium: a hunched thing on angled legs, arms that reach the ground, a long jaw hanging open
    const tq=pz(t+m.ph,rm),s1=Math.sin(tq*3),bob=Math.abs(s1)*2,op=3+Math.max(0,Math.sin(tq*1.7))*3;
    x.save();x.translate(0,-bob);
    for(const q of [[s1,5],[-s1,11]])limb(x,q[1],-48,[[21,-0.45+q[0]*0.25,6.5,4.2],[19,0.65-q[0]*0.2,4.2,3],[11,-0.25,3,1.4]]);
    x.beginPath();x.moveTo(15,-50);x.quadraticCurveTo(18,-72,-2,-86);x.quadraticCurveTo(-12,-91,-20,-84);x.quadraticCurveTo(-6,-76,2,-47);x.closePath();cardFill(x);
    for(let i=0;i<5;i++){const u=i/4,bx=lerp(15,-6,u),by=lerp(-58,-86,u)-Math.sin(u*Math.PI)*5;x.beginPath();x.moveTo(bx-2.4,by+1.6);x.lineTo(bx+3+u*2,by-6);x.lineTo(bx+2.4,by+1.4);x.closePath();cardFill(x);}
    x.beginPath();x.moveTo(-15,-87);x.lineTo(-30,-89);x.lineTo(-40,-84);x.lineTo(-39,-80);x.lineTo(-18,-79);x.closePath();cardFill(x);
    x.beginPath();x.moveTo(-18,-78);x.lineTo(-37,-79+op);x.lineTo(-35,-75+op);x.lineTo(-17,-73);x.closePath();cardFill(x);
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
    x.beginPath();x.moveTo(-8,-108);x.quadraticCurveTo(-12,-140,-6,-168);x.lineTo(8,-168);x.quadraticCurveTo(14,-140,10,-108);x.closePath();cardFill(x);
    x.save();x.globalCompositeOperation="destination-out";x.beginPath();x.ellipse(1,-140,5.5,13,0.05,0,Math.PI*2);cardFill(x);x.restore();
    x.beginPath();x.moveTo(-5,-168);x.quadraticCurveTo(-4,-178,1,-182);x.quadraticCurveTo(7,-178,7,-168);x.closePath();cardFill(x);
    for(const q of [[-1,-180,-2.6],[3,-181,-0.4],[5,-179,0.9]]){limb(x,q[0],q[1],[[10,q[2]+Math.PI,2.2,1.2],[7,q[2]+Math.PI+(q[2]<0?-0.7:0.7),1.2,0.5]]);}
    for(const q of [[-s1,-6,-1],[s1,8,1]]){const sh=[q[1],-164],h=limb(x,sh[0],sh[1],[[30,q[2]*0.5+q[0]*0.2,4.4,3.2],[34,q[2]*0.12-q[0]*0.2,3.2,2],[14,q[2]*-0.3,2,1]]);
      limb(x,h[0],h[1],[[8,q[2]*0.8,1.2,0.5]]);limb(x,h[0],h[1],[[9,-q[2]*0.4,1.2,0.5]]);limb(x,(sh[0]+h[0])/2,(sh[1]+h[1])/2+8,[[10,q[2]*1.3,1.6,0.6]]);}
    x.restore();
    return (c,o)=>{c.save();c.scale(1.15,1);
      c.save();const g=c.createRadialGradient(1,-138,0,1,-140,14);g.addColorStop(0,"#ffc27a");g.addColorStop(0.5,EMBER.danger);g.addColorStop(1,"#5a0c08");
      c.fillStyle=g;c.shadowColor=EMBER.glow;c.shadowBlur=8;c.beginPath();c.ellipse(1,-140,5.5,13,0.05,0,Math.PI*2);c.fill();c.restore();
      c.fillStyle=INK;for(let i=0;i<4;i++){const y=-150+i*6;c.beginPath();c.moveTo(-6,y);c.quadraticCurveTo(1,y-2.2,8,y);c.lineTo(8,y+1.6);c.quadraticCurveTo(1,y-0.6,-6,y+1.6);c.closePath();c.fill();}
      emberMouth(c,[[-3,-171.5],[4,-171.5],[3,-170],[-2,-170]],0.5,-171,4);
      seam(c,[[-4,-120],[-2,-126],[-4,-131]],1.1);
      eyes(c,o,[[-2,-175.5,0.2],[3,-175.5,-0.2]],1.6,1);c.restore();};
  }
});
function eyes(c,o,list,rx,ry){
  c.save();c.fillStyle=o.dcol;c.shadowColor=o.dglow;c.shadowBlur=7;
  for(const e of list){c.beginPath();c.ellipse(e[0],e[1],rx,ry,e[2],0,Math.PI*2);c.fill();}
  c.restore();
}
function drawBat(x,X,Y,k,ph,col){
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

/* ============================== the bosses: design system version 6 (2 November 2026) ==============================
   Round 12's bosses, painted in washed-out colours taken from each level, were replaced in the bosses rework (Barney, 2 November):
   black card cut-outs like the monsters, blacks graded charcoal to ink inside ink edges, ember eyes, mouths, rim and glow, a few
   lines lit faintly in the level's colour, and the level-coloured glow behind. The helpers just below are round 12's, kept because
   the new bosses use some of them; the bosses themselves follow BOSS_AURA further down. ============================== */
const BOSS_NAME={night:"The Veiled Ghost",storm:"The Tentacled Skull",dawn:"The Moor Mother",mist:"The Gaping Tree"} /* version 8: names, so capitalised (Barney, 4 November 2026) */; // the witch replaced by the moor mother (version 6)
function fillP(x,col,pts){x.fillStyle=col;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();}
function strokeP(x,col,w,pts){x.strokeStyle=col;x.lineWidth=w;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();}
function cLimb(x,col,ax,ay,segs){x.fillStyle=col;return limb(x,ax,ay,segs);}
function emberGlow(c,cx,cy,r,a){c.save();const g=c.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,rgba("#ffc27a",a));g.addColorStop(0.5,rgba(EMBER.danger,a*0.8));g.addColorStop(1,rgba(EMBER.glow,0));c.fillStyle=g;c.fillRect(cx-r,cy-r,r*2,r*2);c.restore();}
function emberEye(c,cx,cy,rx,ry,rot){c.save();c.fillStyle=EMBER.danger;c.shadowColor=EMBER.glow;c.shadowBlur=8;c.beginPath();c.ellipse(cx,cy,rx,ry,rot,0,Math.PI*2);c.fill();c.fillStyle="#ffd9a0";c.beginPath();c.ellipse(cx,cy,rx*0.45,ry*0.45,rot,0,Math.PI*2);c.fill();c.restore();}
function raggedEdge(x0,y0,x1,y1,n,amp,r){const out=[];for(let i=0;i<=n;i++){const u=i/n,j=i%2?amp*(0.5+r()*0.8):-amp*0.2*r();out.push([lerp(x0,x1,u),lerp(y0,y1,u)+j]);}return out;}
function claws(x,col,hx,hy,base,spread,len,sd){ // long curling claws: three joints each, the last a hook
  for(let k=0;k<4;k++){const a0=base+(k-1.5)*spread;let px=hx,py=hy,a=a0,w=2.8;
    for(let j=0;j<3;j++){const L=len*(j===0?0.45:j===1?0.35:0.3),nx=px+Math.sin(a)*L,ny=py+Math.cos(a)*L,w2=j===2?0.4:w*0.75;x.fillStyle=col;taper(x,[px,py,nx,ny,w,w2]);px=nx;py=ny;w=w2;a+=sd*0.55;}}
}
const BOSS_AURA={night:["#f0c9e0",-110,125,0.48],storm:["#ff8fa6",-80,130,0.45],dawn:["#bcd2ff",-100,130,0.48],mist:["#f8ffc8",-110,150,0.62]}; // 50% stronger; the tree's is brighter so it shows against the pale mist // a glow round each boss, in its level's colour
const BOSS_CYCLE=7.5,BOSS_H=320,BOSS_GROUND=292;
/* ============================== bosses, the rework: black card first, like the monsters ==============================
   Each boss is drawn in ink as one cut-out (with holes cut through it), then put down the monster way: an ember rim and an ember
   glow round the whole shape, then its ember details (eyes, mouth, seams, the hollows that glow). The place's colour is only a nod,
   in one of three ways (NOD): "edge" a thin rim of the place's light, "aura" the level-coloured glow behind it, "detail" a few inner
   lines lit faintly in the level's colour. Same size, same stepping, same golden-wisp defeat as before. */
const nd=n=>typeof n==="string"?{edge:n==="edge",aura:n==="aura",detail:n==="detail"}:(n||{}); // the nod: one of edge, aura, detail, or a mix of them
const NOD_COL={night:"#f0c9e0",storm:"#ff8fa6",dawn:"#bcd2ff",mist:"#f8ffc8"}; // the level colour each boss nods to (its old glow)
function cutPath(x,pts){x.save();x.globalCompositeOperation="destination-out";x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.restore();}
function lens(a,b,w){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L*w,ny=dx/L*w,mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
  return [a,[lerp(a[0],mx,0.5)+nx*0.8,lerp(a[1],my,0.5)+ny*0.8],[mx+nx,my+ny],[lerp(mx,b[0],0.5)+nx*0.8,lerp(my,b[1],0.5)+ny*0.8],b,[lerp(mx,b[0],0.5)-nx*0.5,lerp(my,b[1],0.5)-ny*0.5],[mx-nx*0.6,my-ny*0.6],[lerp(a[0],mx,0.5)-nx*0.5,lerp(a[1],my,0.5)-ny*0.5]];}
function hollow(c,pts,cx,cy,r,a){ // a hole through the card, smouldering inside: dark red, hottest at the eyes
  c.save();const g=c.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,rgba(EMBER.danger,a*0.7));g.addColorStop(0.5,rgba("#7a160c",a));g.addColorStop(1,rgba("#240504",a));
  c.fillStyle=g;c.shadowColor=EMBER.glow;c.shadowBlur=7;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.restore();}
function litLines(c,col,a,w,lines){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.lineCap="round";c.lineJoin="round";
  for(const pts of lines){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();}c.restore();}

const CH=["#060508","#17141b","#27232d","#3a3544","#504a5c"]; // ink, then paler blacks to charcoal: graded inside, ink at the edge (version 7: the lighter steps raised so the grading shows on a phone; was 100e13, 19161d, 231f27, 2d2832)
function card(x,look,path,grad,edge){ // one card piece: flat ink (round 1), or graded charcoal inside an ink edge (round 2)
  x.beginPath();path();x.closePath();
  if(look&&look.tone){x.fillStyle=grad();x.fill();x.lineWidth=edge||3;x.strokeStyle=INK;x.lineJoin="miter";x.miterLimit=4;x.stroke();x.lineJoin="round";}
  else{x.fillStyle=INK;x.fill();}
  x.fillStyle=INK;}
function lg(x,x0,y0,x1,y1,stops){const g=x.createLinearGradient(x0,y0,x1,y1);stops.forEach(q=>g.addColorStop(q[0],q[1]));return g;}
function rg(x,cx,cy,r0,r1,stops){const g=x.createRadialGradient(cx,cy,r0,cx,cy,r1);stops.forEach(q=>g.addColorStop(q[0],q[1]));return g;}
function poly(x,pts){pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));}
function horn(base,dirs,lens,w0){ // an angular horn: straight joints, narrowing to a sharp point; returns its outline and its outer edge
  const J=[base],W=[w0];let p=base,w=w0;
  dirs.forEach((d,i)=>{const L=Math.hypot(d[0],d[1]);p=[p[0]+d[0]/L*lens[i],p[1]+d[1]/L*lens[i]];J.push(p);w=i===dirs.length-1?0:w*0.62;W.push(w);});
  const nrm=j=>{const a=J[Math.max(0,j-1)],b=J[Math.min(J.length-1,j+1)],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return[-dy/L,dx/L];};
  const A=[],B=[];J.forEach((q,j)=>{const n=nrm(j);A.push([q[0]+n[0]*W[j]/2,q[1]+n[1]*W[j]/2]);B.push([q[0]-n[0]*W[j]/2,q[1]-n[1]*W[j]/2]);});
  return{pts:A.concat(B.slice(0,-1).reverse()),edgeA:A,edgeB:B};}
const BOSS={
  night(x,t,rm,nod,look){ // the veiled ghost: a tall torn shroud bending one way then another, a pointed hood, long low arms with hooked claws
    const tq=pz(t*0.7,rm),hv=6+Math.sin(tq*2)*3,k1=Math.sin(tq*1.3)*5,k2=Math.sin(tq*1.3+2)*5,a1=Math.sin(tq*1.7)*0.14,sw=a1*1.6,N=nd(nod),GK=1.2; // GK: 20% bigger (Barney, 2 Nov)
    x.save();x.scale(GK,GK);x.translate(0,-hv);
    const sp=[[0,0],[-9+k1*0.4,-48],[8+k2*0.5,-94],[-4+k1*0.4,-132],[-1,-154]],wd=[34,30,24,18,12];
    const side=(sd,e)=>sp.map((p,i)=>{const q=sp[Math.min(i+1,sp.length-1)],o=sp[Math.max(i-1,0)],dx=q[0]-o[0],dy=q[1]-o[1],L=Math.hypot(dx,dy)||1;return[p[0]-dy/L*(wd[i]+e)*sd,p[1]+dx/L*(wd[i]+e)*sd];});
    const L0=side(-1,0),R0=side(1,0),r=rng32(71);
    // the shroud, its hem torn into long tatters that sway in steps
    const n=13,hem=[];for(let i=0;i<=n;i++){const u=i/n,hx0=lerp(R0[0][0]+8,L0[0][0]-8,u),long=i%2===1;hem.push([hx0+(long?Math.sin(tq*3+i)*2.5:0),(long?10+r()*16:-3-r()*5)+Math.sin(tq*2.4+i*0.7)*2]);}
    card(x,look,()=>{x.moveTo(sp[4][0],sp[4][1]-22);for(let i=sp.length-1;i>=1;i--)x.lineTo(R0[i][0],R0[i][1]);hem.forEach(q=>x.lineTo(q[0],q[1]));for(let i=1;i<sp.length;i++)x.lineTo(L0[i][0],L0[i][1]);},
      ()=>lg(x,0,-176,0,24,[[0,CH[1]],[0.4,CH[3]],[1,CH[0]]]),3);
    if(look&&look.tone){ // the shroud's front layer: narrower, paler, its own torn edge
      const Li=side(-1,-15),Ri=side(1,-15),hem2=[];for(let i=0;i<=6;i++){const u=i/6;hem2.push([lerp(Ri[1][0],Li[1][0],u),Ri[1][1]+(i%2?8+r()*6:-2)+Math.sin(tq*2.4+i)*1.5]);}
      card(x,look,()=>{x.moveTo(sp[4][0],sp[4][1]-14);for(let i=sp.length-1;i>=1;i--)x.lineTo(Ri[i][0],Ri[i][1]);hem2.forEach(q=>x.lineTo(q[0],q[1]));for(let i=1;i<sp.length;i++)x.lineTo(Li[i][0],Li[i][1]);},
        ()=>lg(x,0,-160,0,-40,[[0,CH[4]],[1,CH[2]]]),2.4);}
    // long torn slits through the shroud, following its folds
    const at=(i,f,sd)=>{const S=sd>0?R0:L0;return[lerp(sp[i][0],S[i][0],f),lerp(sp[i][1],S[i][1],f)];};
    if(N.detail)litLines(x,NOD_COL.night,0.5,1.3,[[at(4,0.1,1),at(3,0.55,1),at(2,0.75,1),at(1,0.8,1)],[at(3,0.5,-1),at(2,0.7,-1),at(1,0.85,-1),at(0,0.7,-1)],[at(2,0.15,1),at(1,0.3,1),at(0,0.55,1)]]);
    const slits=[[at(1,0.55,1),at(2,0.45,1),2.4],[at(0,0.42,-1),at(1,0.5,-1),2.2],[at(2,0.35,-1),at(3,0.3,-1),1.8],[at(0,0.25,1),at(1,0.12,1),1.6]];
    for(const q of slits)cutPath(x,lens([q[0][0],q[0][1]+2],[q[1][0],q[1][1]-2],q[2]));
    // low-set arms, angled down, both swinging the same way; long hooked claws
    const shL=[lerp(sp[2][0],L0[2][0],0.85),sp[2][1]+10],shR=[lerp(sp[2][0],R0[2][0],0.7),sp[2][1]+14];
    const HR=limb(x,shR[0],shR[1],[[28,0.75+a1,7,5],[26,0.25+sw,5,3.4],[8,0.55+a1,3.4,2.6]]);
    const HL=limb(x,shL[0],shL[1],[[28,-0.7+a1,7,5],[26,-1.2+sw,5,3.4],[8,-0.75+a1,3.4,2.6]]);
    x.beginPath();x.ellipse(HL[0],HL[1],4.4,3.4,0,0,Math.PI*2);x.ellipse(HR[0],HR[1],4.4,3.4,0,0,Math.PI*2);x.fill();
    claws(x,INK,HL[0],HL[1],-0.55,0.3,26,1);claws(x,INK,HR[0],HR[1],0.45,0.3,24,-1);
    // the hood: tall and pointed, tipped forward; the face is a hole through it
    const hx=sp[4][0],hy=sp[4][1]-4;
    const hood=[[hx-22,hy+22],[hx-18,hy-6],[hx-6,hy-24],[hx+6,hy-36],[hx+9,hy-26],[hx+18,hy-6],[hx+22,hy+24],[hx,hy+34]];
    card(x,look,()=>poly(x,hood),()=>rg(x,hx-3,hy-14,4,36,[[0,CH[4]],[0.55,CH[2]],[1,CH[1]]]),3);
    if(N.detail)litLines(x,NOD_COL.night,0.5,1.3,[[hood[1],hood[2],hood[3]]]);
    const face=[[hx-10,hy+19],[hx-12,hy+5],[hx-6,hy-7],[hx+2,hy-11],[hx+9,hy-4],[hx+12,hy+8],[hx+8,hy+20],[hx-1,hy+25]];
    cutPath(x,face);
    x.restore();
    return (c,o)=>{c.save();c.scale(GK,GK);c.translate(0,-hv);
      hollow(c,face,hx,hy+7,16,0.95);emberEye(c,hx-5,hy+6,3.8,2.5,0.35);emberEye(c,hx+5,hy+6,3.6,2.4,-0.3);
      seam(c,[at(2,0.2,-1),[sp[2][0]-3,sp[2][1]+6]],1.1);seam(c,[at(1,0.2,1),[sp[1][0]+3,sp[1][1]+7]],1);
      c.restore();};
  },
  storm(x,t,rm,nod,look){ // the tentacled skull: an angry skull with a working jaw, on a mass of jointed tentacles, suckers cut through them
    const tq=pz(t*0.8,rm),op=4+Math.max(0,Math.sin(tq*1.4))*6,segs=[],N=nd(nod),BA=look&&look.tone?0.36:0.45,SK=1.2; // SK: 20% bigger (Barney, 2 Nov)
    x.save();x.scale(SK,SK);
    const tent=(ax,ay,a0,curl,n,w0,ph)=>{let x0=ax,y0=ay,a=a0,w=w0;
      for(let i=0;i<n;i++){const kink=(i%3===1)?(i%2?1:-1)*(0.55+0.2*Math.sin(ph+i)):0;
        a+=curl*(1+i*0.06)*1.6+kink+Math.sin(tq*2+ph+i*0.5)*0.12;const L=(n-i)*0.8+6,nx=x0+Math.sin(a)*L,ny=y0+Math.cos(a)*L,w2=Math.max(1.4,w*0.9);
        if(look&&look.tone)x.fillStyle=w<5?INK:(i%2?CH[2]:CH[1]);taper(x,[x0,y0,nx,ny,w,w2]);x.fillStyle=INK;
        if(N.detail&&w>=4){const vx=Math.cos(a),vy=-Math.sin(a),mx=(x0+nx)/2,my=(y0+ny)/2;x.save();x.globalAlpha=BA; // the lit band, drawn with its segment
          fillP(x,NOD_COL.storm,[[x0+vx*w*0.42,y0+vy*w*0.42],[mx+vx*w*0.12,my+vy*w*0.12],[nx+vx*w2*0.42,ny+vy*w2*0.42]]);x.restore();x.fillStyle=INK;}
        segs.push([x0,y0,nx,ny,a,w,w2]);x0=nx;y0=ny;w=w2;}};
    const holes=()=>{x.save();x.globalCompositeOperation="destination-out";for(let j=0;j<segs.length;j++){const q=segs[j];if(q[5]<8||j%2)continue;const nx=Math.cos(q[4]),ny=-Math.sin(q[4]),mx=(q[0]+q[2])/2,my=(q[1]+q[3])/2;
      x.beginPath();x.arc(mx-nx*q[5]*0.22,my-ny*q[5]*0.22,q[5]*0.13,0,Math.PI*2);x.fill();}x.restore();};
    tent(18,-70,-3.0,0.12,13,22,0.4);tent(-26,-40,-1.6,-0.07,12,21,1.2);tent(30,-30,1.9,0.06,13,21,2.1);
    // the webbed skirt between the tentacle roots
    const web=[[-44,-62],[-58,-30],[-40,-10],[-18,-22],[-6,-4],[12,-18],[30,-6],[48,-24],[58,-48],[42,-66]];
    card(x,look,()=>{x.moveTo(web[0][0],web[0][1]);for(let i=1;i<=web.length;i++){const p0=web[i-1],p1=web[i%web.length],mx=(p0[0]+p1[0])/2,my=(p0[1]+p1[1])/2;x.quadraticCurveTo(mx*0.82,my*0.82-8,p1[0],p1[1]);}},
      ()=>rg(x,0,-42,2,62,[[0,CH[3]],[1,CH[0]]]),3);
    holes();
    // the skull, with an angry brow cut into its outline, and its jaw a separate card piece
    const skull=[[-46,-102],[-44,-118],[-34,-132],[-16,-142],[14,-142],[34,-132],[44,-118],[48,-102],[44,-86],[40,-74],[32,-64],[22,-58],[-22,-58],[-32,-64],[-40,-74],[-44,-86]];
    const hR=horn([26,-133],[[0.82,-0.57],[0.26,-0.97],[0.66,-0.75]],[19,18,13],13),hL=horn([-26,-133],[[-0.86,-0.5],[-0.3,-0.95],[-0.72,-0.69]],[18,19,12],13);
    if(look&&look.horns){for(const h of [hR,hL])card(x,look,()=>poly(x,h.pts),()=>lg(x,h.edgeA[0][0],h.edgeA[0][1],h.edgeA[3][0],h.edgeA[3][1],[[0,CH[3]],[1,CH[0]]]),2.2);
      if(N.detail)litLines(x,NOD_COL.storm,0.5,1.1,[hR.edgeB.slice(0,3),hL.edgeA.slice(0,3)]);}
    card(x,look,()=>poly(x,skull),()=>rg(x,-12,-122,4,64,[[0,CH[4]],[0.5,CH[2]],[1,CH[0]]]),3);
    card(x,look,()=>poly(x,[[-26,-60],[26,-60],[24,-50+op],[10,-44+op],[-10,-44+op],[-24,-50+op]]),()=>lg(x,0,-60,0,-44+op,[[0,CH[2]],[1,CH[0]]]),2.5);
    if(N.detail)litLines(x,NOD_COL.storm,0.5,1.2,[[[-38,-104],[-6,-96]],[[38,-104],[6,-96]],[[-30,-128],[-14,-138],[2,-139]]]);
    const sockL=[[-34,-98],[-8,-92],[-8,-80],[-16,-72],[-30,-76],[-36,-88]],sockR=sockL.map(p=>[-p[0],p[1]]),nose=[[0,-76],[5,-68],[3,-62],[0,-64],[-3,-62],[-5,-68]];
    cutPath(x,sockL);cutPath(x,sockR);cutPath(x,nose);
    const segs0=segs.length;tent(-36,-40,-2.2,0.03,12,22,3.0);tent(8,-34,-0.5,-0.1,11,20,4.2);
    {const keep=segs.splice(0,segs0);holes();segs.unshift(...keep);}
    x.restore();
    return (c,o)=>{c.save();c.scale(SK,SK);
      hollow(c,sockL,-20,-84,14,0.95);hollow(c,sockR,20,-84,14,0.95);
      emberEye(c,-20,-84,4.2,3,0.3);emberEye(c,20,-84,4.2,3,-0.3);
      emberMouth(c,[[-20,-58],[20,-58],[18,-52+op*0.6],[-18,-52+op*0.6]],0,-55,20);
      {const up=[],lo=[];for(let i=0;i<6;i++){const x0=-18.5+i*6.4;up.push([x0,-58.5,x0+2.1,-53.4,x0+4.2,-58.5]);}
        for(let i=0;i<5;i++){const x0=-15.5+i*6.6,yb=-52+op*0.6;lo.push([x0,yb+0.5,x0+2.1,yb-4,x0+4.2,yb+0.5]);}teeth(c,up.concat(lo));}
      seam(c,[[-8,-141],[-12,-128],[-6,-120],[-11,-108]],1.3);seam(c,[[24,-136],[28,-124],[24,-116]],1.1);c.restore();};
  }
};
const BOSS_CACHE={};
const BOSS_SIZE={night:1.2,storm:1.2}; // the ghost and the skull are drawn 20% bigger (Barney, 2 Nov)
const BOSS_BOXES={night:[-104,-252,98,28],storm:[-208,-212,138,32]}; // what each boss's card pieces cover when it is defeated (measured over a whole stepping cycle)
function bossAura(lv){const A=BOSS_AURA[lv],k=BOSS_SIZE[lv]||1,b=lv==="mist"?[A[0],-150,190,0.55]:[A[0],A[1]*k,A[2]*k,A[3]];return[b[0],b[1]*1.05,b[2]*1.2,Math.min(1,b[3]*1.6)];} // the glow behind, grown with the boss; version 7: 1.2 times larger and 1.6 times stronger, so it shows on a phone
function bossGlow(c,X,Y,lv,fade){ // version 7: the glow behind a boss, in picture units with its feet at (X, Y). Drawn straight onto the scene, before the boss: it lightens
  // what is behind it ("screen"), holding its strength out to about a third of its radius, so it shows against a bright horizon, black scenery and the Mist's pale sky
  const A=bossAura(lv),a=A[3]*(fade==null?1:fade);if(a<=0)return;const cy=Y+A[1],R=A[2];
  c.save();c.globalCompositeOperation="screen";const g=c.createRadialGradient(X,cy,8,X,cy,R);
  g.addColorStop(0,rgba(A[0],a));g.addColorStop(0.35,rgba(A[0],a*0.8));g.addColorStop(0.7,rgba(A[0],a*0.32));g.addColorStop(1,rgba(A[0],0));
  c.fillStyle=g;c.fillRect(X-R,cy-R,R*2,R*2);c.restore();}
function bossDefeat(c,M,s,X,Y,u,seed,lv,K){ // as bossDefeat, over this boss's own box: card pieces tumble, a large golden wisp rises
  const box=BOSS_BOXES[lv],ox=X-230,oy=Y-300,x0=X+box[0],y0=Y+box[1],w=box[2]-box[0],h=box[3]-box[1],k=BOSS_SIZE[lv]||1;
  if(!K.pieces){const r=rng32(seed),cols=4,rows=3,pts=[];for(let j=0;j<=rows;j++){pts.push([]);for(let i=0;i<=cols;i++){const jx=(i>0&&i<cols)?(r()-0.5)*0.14:0,jy=(j>0&&j<rows)?(r()-0.5)*0.18:0;pts[j].push([i/cols+jx,j/rows+jy]);}}
    K.pieces=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)K.pieces.push({poly:[pts[j][i],pts[j][i+1],pts[j+1][i+1],pts[j+1][i]],vx:(i-1.5)*0.7+(r()-0.5)*0.6,vy:-0.5-r()*0.9,spin:(r()-0.5)*4});}
  for(const pc of K.pieces){const cx=x0+w*(pc.poly[0][0]+pc.poly[2][0])/2,cy=y0+h*(pc.poly[0][1]+pc.poly[2][1])/2,tx=pc.vx*u*90,ty=pc.vy*u*70+u*u*320,al=u<0.5?1:Math.max(0,1-(u-0.5)/0.5);
    c.save();c.globalAlpha=al;c.translate(cx+tx,cy+ty);c.rotate(pc.spin*u);c.translate(-cx,-cy);c.beginPath();pc.poly.forEach((q,i)=>{const px=x0+q[0]*w,py=y0+q[1]*h;i?c.lineTo(px,py):c.moveTo(px,py);});c.closePath();c.clip();c.drawImage(M,ox,oy,M.width/s,M.height/s);c.restore();}
  const wu=(u-0.2)/0.8;if(wu>0){const cx=X+Math.sin(wu*3)*10,cy=Y-110*k-wu*160,a=Math.sin(Math.min(1,wu*1.2)*Math.PI)*0.95;
    c.save();let g=c.createRadialGradient(cx,cy,0,cx,cy,60);g.addColorStop(0,rgba("#ffe7a8",a*0.9));g.addColorStop(0.4,rgba("#ffcf6a",a*0.45));g.addColorStop(1,rgba("#ffb84a",0));c.fillStyle=g;c.fillRect(cx-60,cy-60,120,120);
    c.fillStyle=rgba("#fff3d0",a);c.shadowColor="#ffcf6a";c.shadowBlur=14;c.beginPath();c.moveTo(cx-9,cy);c.quadraticCurveTo(cx,cy-18,cx+9,cy);c.quadraticCurveTo(cx+7,cy+22,cx-10,cy+46);c.quadraticCurveTo(cx-2,cy+20,cx-9,cy);c.fill();c.restore();}
}
function bossInto(c,s,lv,t,o,dx,dy,nod,noAura,cache,look){ // a reworked boss: ink cut-out, ember rim and glow, ember details, and its nod to the level's colour
  const K=cache||BOSS_CACHE;if(!K.tmp||K.tmpS!==s){K.tmp=mk(460*s,330*s);K.edge=mk(460*s,330*s);K.tmpS=s;}
  const T=K.tmp,tc=T.getContext("2d");tc.setTransform(1,0,0,1,0,0);tc.globalCompositeOperation="source-over";tc.clearRect(0,0,T.width,T.height);
  tc.setTransform(s,0,0,s,230*s,300*s);tc.fillStyle=INK;tc.strokeStyle=INK;tc.lineCap="round";tc.lineJoin="round";
  const det=BOSS[lv](tc,t,o.rm,nod,look),N=nd(nod);
  c.save();
  if(N.aura&&!noAura){c.setTransform(s,0,0,s,dx+230*s,dy+300*s);bossGlow(c,0,0,lv,1);} // the glow behind (version 7: bossGlow)
  c.setTransform(1,0,0,1,0,0);
  c.shadowColor=rgba(o.dcol,0.95);c.shadowBlur=2.5*s;c.drawImage(T,dx,dy);   // the rim, as a monster's
  c.shadowColor=rgba(o.dglow,0.6);c.shadowBlur=11*s;c.drawImage(T,dx,dy);    // the glow, as a monster's
  c.shadowColor="transparent";c.shadowBlur=0;
  if(N.edge){const E=K.edge,ec=E.getContext("2d");ec.setTransform(1,0,0,1,0,0);ec.globalCompositeOperation="source-over";ec.clearRect(0,0,E.width,E.height);ec.drawImage(T,0,0);
    ec.globalCompositeOperation="source-in";ec.fillStyle=LV[lv].edge;ec.fillRect(0,0,E.width,E.height);c.drawImage(E,dx+2*s,dy-2*s);}
  c.drawImage(T,dx,dy);
  c.setTransform(s,0,0,s,dx+230*s,dy+300*s);det(c,o);c.restore();
}

/* ============================== the gaping tree, rework: an ancient gnarled tree, a skull's face in its bark ==============================
   After Barney's pictures (inspiration only): a huge twisted trunk flaring into buttress roots, thick limbs that twist up and split into
   a dense crown of fine angular twigs, a skull's face formed in the bark (hollow sockets with ember eyes, a gaping maw with splinter
   teeth), strong roots spreading from a contoured base, and two angular side branches set lower than the crown, at different heights
   (round 5, Barney 2 Nov: no nose, no arms, hands or legs).
   Black card with graded blacks, ember rim and glow, a few lit lines in Mist's colour, moss hanging from the limbs.
   look.wind leans the whole tree to the right, as every tree in the wind-bent forest. */
BOSS.mist=function(x,t,rm,nod,look){
  const N=nd(nod),tq=pz(t*0.6,rm),r=rng32(4242),W=look&&look.wind?1:0,TONE=look&&look.tone,LIT=NOD_COL.mist;
  const op=3+Math.max(0,Math.sin(tq*1.3))*7,breathe=Math.sin(tq*1.1)*1.2,TK=0.86; // TK: drawn at 0.86 so the crown stays inside the boss's space
  x.save();x.scale(TK,TK);
  const lean=y=>W*Math.pow(Math.max(0,-y)/150,1.3)*46;
  let segs=[];const moss=[];
  const drawSegs=list=>{for(const s of list){x.fillStyle=INK;taper(x,[s[0],s[1],s[2],s[3],s[4],s[5]]);}
    // round 7 (Barney, 2 Nov: the grading as obvious as the ghost's and skull's): each limb and root graded across its width,
    // charcoal on its upper side falling to ink on the other, inside an ink edge; the thinnest twigs stay ink
    if(TONE)for(const s of list){if(s[4]<4)continue;const dx=s[2]-s[0],dy=s[3]-s[1],L=Math.hypot(dx,dy)||1,nx=dy/L,ny=-dx/L,f=ny<0||(ny===0&&nx<0)?1:-1,w=(s[4]+s[5])/2,mx=(s[0]+s[2])/2,my=(s[1]+s[3])/2,hi=w>=9?CH[4]:CH[3];
      const g=x.createLinearGradient(mx+nx*f*w*0.42,my+ny*f*w*0.42,mx-nx*f*w*0.42,my-ny*f*w*0.42);g.addColorStop(0,CH[2]);g.addColorStop(0.3,hi);g.addColorStop(0.68,CH[2]);g.addColorStop(1,CH[0]);
      x.fillStyle=g;taper(x,[s[0],s[1],s[2],s[3],s[4]*0.78,s[5]*0.78]);}
    if(N.detail){x.save();x.globalAlpha=0.42;x.strokeStyle=LIT;x.lineWidth=1.1;x.lineCap="round";for(const s of list){if(s[4]<(s[6]>=3?8:11)||s[7])continue;const dx=s[2]-s[0],dy=s[3]-s[1],L=Math.hypot(dx,dy)||1,nx=dy/L,ny=-dx/L,f=ny<0?1:-1;
      x.beginPath();x.moveTo(s[0]+nx*f*s[4]*0.36,s[1]+ny*f*s[4]*0.36);x.lineTo(s[2]+nx*f*s[5]*0.36,s[3]+ny*f*s[5]*0.36);x.stroke();}x.restore();}
    x.fillStyle=INK;};
  // a crown branch: angular segments, splitting into finer twigs; the wind pushes every segment to the right
  const br=(P,th,len,w,d,ph)=>{let p=P,a=th;const n=d>=2?3:2;
    for(let i=0;i<n;i++){a+=(i%2?1:-1)*(0.18+r()*0.22)+Math.sin(tq*1.7+ph+i)*0.035*(4-d);
      let dx=Math.cos(a)*len/n,dy=Math.sin(a)*len/n;if(W){dx+=len/n*(0.8-0.1*d);dy*=0.9;}
      const L=Math.hypot(dx,dy),q=[p[0]+dx/L*len/n,p[1]+dy/L*len/n],w2=d===0&&i===n-1?0.6:w*(1-0.18*(i+1)/n);
      segs.push([p[0],p[1],q[0],q[1],w*(1-0.18*i/n),w2,d]);
      if(d>=2&&i===1&&r()<0.6)br(q,a+(r()<0.5?-1:1)*(0.8+r()*0.3),len*0.45,w*0.5,d-2,ph+3);
      if(d>=2&&r()<0.25)moss.push([q[0],q[1],16+r()*16,ph+i]);
      p=q;}
    if(d>0){const m=2+(r()<0.55?1:0);for(let k=0;k<m;k++)br(p,a+(k-(m-1)/2)*(0.62+r()*0.2)+(r()-0.5)*0.25,len*(0.62+r()*0.12),w*0.6,d-1,ph+k*1.7);}};
  // the trunk: a twisted centreline, flaring hard into the roots, narrowing to the fork; its outline knotted
  const cl=[[0,0],[5,-22],[-4,-48],[-8,-74],[3,-100],[6,-124],[0,-146]].map((p,i)=>[p[0]+lean(p[1]),p[1]-(i>3?breathe:0)]);
  const wd=[62,46,38,34,31,32,24];
  const side=sd=>{const pts=[];cl.forEach((p,i)=>{const q=cl[Math.min(i+1,cl.length-1)],o=cl[Math.max(i-1,0)],dx=q[0]-o[0],dy=q[1]-o[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
      pts.push([p[0]+nx*wd[i]*sd,Math.min(1,p[1]+ny*wd[i]*sd)]);
      if(i<cl.length-1){const m=[(p[0]+q[0])/2,(p[1]+q[1])/2],wm=(wd[i]+wd[i+1])/2+(r()-0.3)*7;pts.push([m[0]+nx*wm*sd,Math.min(1,m[1]+ny*wm*sd)]);}});return pts;};
  const Lt=side(-1),Rt=side(1);
  // round 7 (Barney, 2 Nov): the trunk graded across its width like the limbs, charcoal on its upper-left side falling to ink on the
  // other, and darkening to ink towards the base where the roots spread
  const tp=()=>{poly(x,Lt);for(let i=Rt.length-1;i>=0;i--)x.lineTo(Rt[i][0],Rt[i][1]);};
  card(x,look,tp,()=>{const ax=cl[6][0]-cl[0][0],ay=cl[6][1]-cl[0][1],aL=Math.hypot(ax,ay),nx=-ay/aL,ny=ax/aL,M=cl[3],k=44;
      return lg(x,M[0]-nx*k,M[1]-ny*k,M[0]+nx*k,M[1]+ny*k,[[0,CH[2]],[0.3,CH[4]],[0.62,CH[2]],[1,CH[0]]]);},3);
  if(TONE){x.save();x.beginPath();tp();x.closePath();x.clip();x.fillStyle=lg(x,0,-62,0,0,[[0,rgba(CH[0],0)],[1,rgba(CH[0],0.8)]]);x.fillRect(-140,-62,300,64);x.restore();}
  // the bark's twist: dark grooves spiralling up the trunk, the ridges beside them faintly lit
  const at=(f,y)=>{let i=0;while(i<cl.length-2&&cl[i+1][1]>y)i++;const v=(cl[i][1]-y)/((cl[i][1]-cl[i+1][1])||1),c0=[lerp(cl[i][0],cl[i+1][0],v),y],w=lerp(wd[i],wd[i+1],v)*0.9;return[c0[0]+(f*2-1)*w,y];};
  const groove=(f0,f1,y0,y1)=>{const pts=[];for(let k=0;k<=7;k++){const u=k/7;pts.push(at(lerp(f0,f1,u),lerp(y0,y1,u)));}return pts;};
  const gr=[groove(0.22,0.64,-14,-138),groove(0.6,0.95,-18,-120),groove(0.05,0.3,-34,-132)];
  if(TONE){x.save();x.strokeStyle=INK;x.lineWidth=3;x.lineCap="round";x.lineJoin="round";for(const g of gr){x.beginPath();poly(x,g);x.stroke();}x.restore();}
  if(N.detail)litLines(x,LIT,0.38,1.1,gr.map(g=>g.map(p=>[p[0]+3,p[1]])));
  // strong roots spreading from the base: each leaves the trunk high as a buttress, drops steeply, rides over a knuckle and runs out
  // along the ground to a point, with a smaller root splitting off at the knuckle; two shorter roots come forward over the base
  const root=(f,y0,dir,reach,w,hump)=>{const s0=at(f,y0),P=[s0,[s0[0]+dir*reach*0.26,-20-hump],[s0[0]+dir*reach*0.58,-12-hump*0.6],[s0[0]+dir*reach,3]],ws=[w,w*0.74,w*0.46,1.5],rs=[];
    for(let i=0;i<3;i++)rs.push([P[i][0],P[i][1],P[i+1][0],P[i+1][1],ws[i],ws[i+1],3,i>0?1:0]);
    rs.push([P[2][0],P[2][1],P[2][0]+dir*reach*0.2,3.5,w*0.3,0.8,2,1]);
    rs.push([P[1][0],P[1][1],P[1][0]+dir*reach*0.1,4,w*0.36,1,2,1]);
    return rs;};
  drawSegs([...root(0.03,-54,-1,86,30,4),...root(0.97,-50,1,90,30,2),...root(0.1,-30,-1,56,22,0),...root(0.9,-28,1,52,20,1)]);
  const fr=(f,y0,tx,w)=>{const s0=at(f,y0),m=[lerp(s0[0],tx,0.55),-7];return[[s0[0],s0[1],m[0],m[1],w,w*0.55,3],[m[0],m[1],tx,3.5,w*0.55,1,3]];};
  drawSegs([...fr(0.3,-24,at(0.06,-2)[0]-6,17),...fr(0.72,-22,at(0.96,-2)[0]+10,16)]);
  // two angular side branches, lower than the crown and at different heights: sharp elbows, a spur, forked twigs at the end
  const sideBr=(f,y0,dir,e0,len,w,ph)=>{let p=at(f,y0);const off=[0,0.44,-0.3,0.34],Ls=[0.32,0.27,0.23,0.18],ww=[w,w*0.72,w*0.5,w*0.3,1];
    for(let i=0;i<4;i++){const e=e0+off[i]+Math.sin(tq*1.5+ph)*0.04,a=dir<0?Math.PI+e:-e;let dx=Math.cos(a)*len*Ls[i],dy=Math.sin(a)*len*Ls[i];if(W)dx+=len*Ls[i]*(dir<0?0.1:0.35); // the windward branch is not folded back, so it stays a branch
      const q=[p[0]+dx,p[1]+dy];segs.push([p[0],p[1],q[0],q[1],ww[i],ww[i+1],3]);
      if(i<3){const eu=e+(i%2?-0.75:0.95),au=dir<0?Math.PI+eu:-eu;br(q,au,len*(i===1?0.24:0.17),ww[i+1]*0.45,i===1?1:0,ph+5+i);}
      if(i===1)moss.push([q[0],q[1],15,ph]);
      p=q;}};
  sideBr(0.02,-66,-1,0.4+W*0.25,84,15,0.6);
  sideBr(0.98,-94,1,0.52,74,14,2.1);
  drawSegs(segs);segs=[];
  // the crown: three great limbs twisting up from the fork
  const F=cl[6];
  const wa=W*0.2;
  br([F[0]-10,F[1]+12],-Math.PI/2-0.72+wa*0.8,58,22,3,0.3);
  br([F[0]+2,F[1]+6],-Math.PI/2-0.06+wa,64,24,3,1.4);
  br([F[0]+10,F[1]+12],-Math.PI/2+0.66+wa*0.6,56,21,3,2.6);
  drawSegs(segs);segs=[];
  // moss hanging from the limbs, swaying in steps
  for(const m of moss){let px=m[0],py=m[1],a=Math.PI/2+Math.sin(tq*1.4+m[3])*0.12-W*0.7;for(let j=0;j<3;j++){const L=m[2]/3,q=[px+Math.cos(a)*L,py+Math.sin(a)*L];
      x.fillStyle=TONE?mixc(CH[2],"#9fbb52",0.18):INK;taper(x,[px,py,q[0],q[1],2.8-j*0.7,2.1-j*0.6]);px=q[0];py=q[1];a+=0.12;}}
  x.fillStyle=INK;
  // the face, formed in the bark: hollow sockets and a gaping maw
  const fx=lean(-96)+(cl[4][0]-lean(cl[4][1]))*0.5,sockL=[[fx-26,-110],[fx-6,-106],[fx-5,-96],[fx-12,-88],[fx-24,-92],[fx-29,-101]],sockR=sockL.map(p=>[2*fx-p[0],p[1]+2]);
  const maw=[[fx-20,-68],[fx-8,-72],[fx+6,-71],[fx+19,-66],[fx+15,-56+op*0.5],[fx+6,-48+op],[fx-5,-48+op],[fx-16,-55+op*0.5]];
  // round 6 (Barney, 2 Nov): eyes and mouth at half size, each shrunk about its own centre, the eyes drawn a little closer together
  const FS=0.5,EL=[fx-16,-99,fx-12,-98],ER=[fx+16,-97,fx+12,-96],MW=[fx,-60,fx,-63];
  const FC=(cc,k,fn)=>{cc.save();cc.translate(k[2],k[3]);cc.scale(FS,FS);cc.translate(-k[0],-k[1]);fn();cc.restore();};
  FC(x,EL,()=>cutPath(x,sockL));FC(x,ER,()=>cutPath(x,sockR));FC(x,MW,()=>cutPath(x,maw));
  x.restore();
  return (c,o)=>{c.save();c.scale(TK,TK);
    FC(c,EL,()=>{hollow(c,sockL,fx-16,-99,15,0.95);emberEye(c,fx-16,-99,4.2,3,0.35);});FC(c,ER,()=>{hollow(c,sockR,fx+16,-97,15,0.95);emberEye(c,fx+16,-97,4.2,3,-0.35);});
    FC(c,MW,()=>{hollow(c,maw,fx,-60+op*0.4,20,0.95);emberMouth(c,maw.map(p=>[fx+(p[0]-fx)*0.82,-60+op*0.4+(p[1]+60-op*0.4)*0.78]),fx,-60+op*0.4,14);
    const tt=[];for(let i=0;i<5;i++){const x0=fx-16+i*7;tt.push([x0,-69.5+Math.abs(i-2)*0.8,x0+2.6,-62+(i%2)*1.5,x0+5,-69+Math.abs(i-2)*0.8]);}
    for(let i=0;i<4;i++){const x0=fx-12+i*7,yb=-50+op*0.95;tt.push([x0,yb,x0+2.6,yb-6-(i%2)*1.5,x0+5,yb]);}
    teeth(c,tt);});
    c.restore();}; // round 7 (Barney, 2 Nov): the three ember seams on the trunk removed
};
BOSS_SIZE.mist=1;
BOSS_BOXES.mist=[-132,-262,160,12]; // measured over a stepping cycle, upright and windswept

/* ============================== the moor mother: Dawn's boss, in place of the cauldron witch ==============================
   After Barney's own Gemini picture (2 Nov): a gaunt figure in a ragged robe, a crown of smooth curved antlers, a split face (a pale
   dead eye on one half; an ember eye, fangs and a tusk on the beast half), a cluster of small ember eyes on the beast shoulder like a
   spider's, a bony hand on one side and a great serrated scythe claw on the other, and four long spider legs that step out from under
   the robe. No tentacles (the skull keeps those), no purple or green magic: ember and a nod to Dawn's pale blue, like the others.
   Same look as the ghost, skull and tree: graded blacks inside ink edges, ember rim and glow, a few lit lines, the glow behind. */
BOSS.dawn=function(x,t,rm,nod,look){
  const N=nd(nod),TONE=look&&look.tone,LIT=NOD_COL.dawn,tq=pz(t*0.7,rm);
  const hv=Math.sin(tq*2)*3,sw=Math.sin(tq*1.2)*0.16,ht=Math.sin(tq*0.9)*0.06,op=2+Math.max(0,Math.sin(tq*1.4))*4;
  // a limb, antler or leg segment: ink, then graded across its width (charcoal on its upper side falling to ink), then a lit line
  const drawSegs=(list,dark)=>{for(const s of list){x.fillStyle=INK;taper(x,[s[0],s[1],s[2],s[3],s[4],s[5]]);}
    if(TONE)for(const s of list){if(s[4]<3.5)continue;const dx=s[2]-s[0],dy=s[3]-s[1],L=Math.hypot(dx,dy)||1,nx=dy/L,ny=-dx/L,f=ny<0||(ny===0&&nx<0)?1:-1,w=(s[4]+s[5])/2,mx=(s[0]+s[2])/2,my=(s[1]+s[3])/2;
      const hi=dark?CH[2]:(w>=7?CH[4]:CH[3]),g=x.createLinearGradient(mx+nx*f*w*0.42,my+ny*f*w*0.42,mx-nx*f*w*0.42,my-ny*f*w*0.42);
      g.addColorStop(0,dark?CH[1]:CH[2]);g.addColorStop(0.3,hi);g.addColorStop(0.68,dark?CH[1]:CH[2]);g.addColorStop(1,CH[0]);x.fillStyle=g;taper(x,[s[0],s[1],s[2],s[3],s[4]*0.74,s[5]*0.74]);}
    if(N.detail&&!dark){x.save();x.globalAlpha=0.45;x.strokeStyle=LIT;x.lineWidth=1.1;x.lineCap="round";for(const s of list){if(s[4]<6||s[6]===0)continue;const dx=s[2]-s[0],dy=s[3]-s[1],L=Math.hypot(dx,dy)||1,nx=dy/L,ny=-dx/L,f=ny<0?1:-1;
      x.beginPath();x.moveTo(s[0]+nx*f*s[4]*0.34,s[1]+ny*f*s[4]*0.34);x.lineTo(s[2]+nx*f*s[5]*0.34,s[3]+ny*f*s[5]*0.34);x.stroke();}x.restore();}
    x.fillStyle=INK;};
  const rot=(p,o,a)=>{const c=Math.cos(a),s=Math.sin(a),dx=p[0]-o[0],dy=p[1]-o[1];return[o[0]+dx*c-dy*s,o[1]+dx*s+dy*c];};
  // the four spider legs: up to a high knee, down through an angular ankle to a long point; they step in pairs, card-puppet fashion
  const leg=(hip,knee,ankle,foot,ph,dark)=>{const lift=Math.max(0,Math.sin(tq*1.6+ph))*11,H=[hip[0],hip[1]-hv],K=[knee[0],knee[1]-hv*0.6-lift*0.35],A=[ankle[0]-Math.sign(ankle[0])*lift*0.2,ankle[1]-lift*0.7],F=[foot[0]-Math.sign(foot[0])*lift*0.3,foot[1]-lift];
    const sg=[[H[0],H[1],K[0],K[1],11,8.5,1],[K[0],K[1],A[0],A[1],8.5,6,1],[A[0],A[1],F[0],F[1],6,0.8,0]];
    const o=Math.sign(knee[0]);sg.push([K[0],K[1],K[0]+o*4,K[1]-11,4.5,0.6,0]); // a thorn at the knee
    for(const u of [0.35,0.65]){const p=[lerp(K[0],A[0],u),lerp(K[1],A[1],u)];sg.push([p[0],p[1],p[0]+o*6,p[1]-4,3,0.5,0]);} // spines down the shin
    drawSegs(sg,dark);};
  leg([-8,-80],[-94,-120],[-122,-48],[-134,1],Math.PI,true);
  leg([8,-80],[96,-116],[126,-44],[136,1],0,true);
  leg([-14,-72],[-62,-112],[-82,-44],[-94,1],0,false);
  leg([14,-72],[66,-108],[88,-40],[100,1],Math.PI,false);
  // the ragged robe, from the shoulders to a tattered hem that stops above the legs
  const Y=-hv,HY=[-52,-34,-50,-28,-47,-39,-56,-26,-45,-37,-54,-31,-50],hem=[];for(let i=0;i<=12;i++)hem.push([46-i*7.6,HY[i]+Math.sin(tq*1.3+i)*2+Y]);
  const robe=[[-14,-158+Y],[16,-157+Y],[28,-148+Y],[26,-126+Y],[19,-104+Y],[27,-84+Y],[40,-62+Y],...hem,[-40,-62+Y],[-27,-84+Y],[-18,-104+Y],[-22,-126+Y],[-28,-148+Y]];
  card(x,look,()=>poly(x,robe),()=>rg(x,-6,-126+Y,6,96,[[0,CH[4]],[0.45,CH[3]],[0.75,CH[2]],[1,CH[0]]]),3);
  const folds=[[[-8,-140+Y],[-10,-104+Y],[-22,-56+Y]],[[9,-138+Y],[10,-104+Y],[22,-50+Y]],[[0,-112+Y],[1,-84+Y],[-1,-42+Y]]];
  if(TONE){x.save();x.strokeStyle=INK;x.lineWidth=2.4;x.lineCap="round";x.lineJoin="round";for(const f of folds){x.beginPath();poly(x,f);x.stroke();}x.restore();}
  if(N.detail)litLines(x,LIT,0.4,1.1,folds.map(f=>f.map(p=>[p[0]-2.5,p[1]])));
  x.fillStyle=INK;
  // long hair hanging from the human half of the head over the shoulder
  const HC=[2,-170+Y],hr=[];for(let i=0;i<6;i++){const x0=-10+i*2.2,len=34+((i*7)%5)*6,sway=Math.sin(tq*1.1+i)*1.5;hr.push([x0,-182+Y,x0-6+sway,-182+Y+len*0.55,3.2,2.2,0],[x0-6+sway,-182+Y+len*0.55,x0-9+sway*1.6,-182+Y+len,2.2,0.6,0]);}
  drawSegs(hr.map(s=>{const a=rot([s[0],s[1]],HC,ht),b=rot([s[2],s[3]],HC,ht);return[a[0],a[1],b[0],b[1],s[4],s[5],0];}),false);
  // the bony arm, a ragged sleeve over it, and a hand of long claws
  const S0=[-22,-146+Y],E0=[-46,-110+Y],W0=[-50,-82+Y];
  const arm=[[S0[0],S0[1],E0[0],E0[1],6.5,5,1],[E0[0],E0[1],W0[0],W0[1],5,3.8,1]];
  for(let k=0;k<4;k++){let p=W0,a=Math.PI/2+0.55-k*0.3;for(let j=0;j<3;j++){const L=[9,8,7][j],q=[p[0]+Math.cos(a)*L,p[1]+Math.sin(a)*L];arm.push([p[0],p[1],q[0],q[1],[3,2.3,1.6][j],[2.3,1.6,0.4][j],0]);p=q;a-=0.32;}}
  drawSegs(arm,false);
  const sleeve=[[-20,-154+Y],[-32,-142+Y],[-46,-120+Y],[-56,-100+Y+Math.sin(tq*1.3)*2],[-50,-104+Y],[-48,-93+Y],[-43,-104+Y],[-39,-97+Y],[-37,-114+Y],[-28,-132+Y]];
  card(x,look,()=>poly(x,sleeve),()=>lg(x,-24,-148+Y,-50,-100+Y,[[0,CH[3]],[1,CH[0]]]),2.4);
  // the beast shoulder, spiked, with its cluster of eyes
  const sh=[[12,-156],[18,-169],[24,-158],[32,-172],[37,-157],[47,-162],[45,-148],[51,-138],[41,-131],[30,-128],[18,-134],[12,-143]].map(p=>[p[0],p[1]+Y]);
  // the claw arm (round 9, Barney 2 Nov: angular, not a semicircle): armoured plates with a spiked elbow, a knuckled wrist, and a
  // blade of straight facets that juts out, breaks sharply down and hooks back to a point, sawteeth along its inner edge; it swings in steps
  const SO=[28,-142+Y],sr=p=>rot([p[0],p[1]+Y],SO,-sw);
  const E1=sr([60,-124]),W1=sr([74,-92]);
  const nrm=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return[-dy/l,dx/l];};
  const plate=(a,b,w0,w1)=>{const n=nrm(a,b);return[[a[0]+n[0]*w0/2,a[1]+n[1]*w0/2],[b[0]+n[0]*w1/2,b[1]+n[1]*w1/2],[b[0]-n[0]*w1/2,b[1]-n[1]*w1/2],[a[0]-n[0]*w0/2,a[1]-n[1]*w0/2]];};
  const spike=(p,dir,len,w)=>{const n=[-dir[1],dir[0]];return[[p[0]+n[0]*w/2,p[1]+n[1]*w/2],[p[0]+dir[0]*len,p[1]+dir[1]*len],[p[0]-n[0]*w/2,p[1]-n[1]*w/2]];};
  const ua=plate(SO,E1,12,9),fa=plate(E1,W1,9,11);
  const sp=[spike(E1,(()=>{const d=sr([70,-140]);const v=[d[0]-E1[0],d[1]-E1[1]],l=Math.hypot(v[0],v[1]);return[v[0]/l,v[1]/l];})(),13,7)];
  {const n=nrm(E1,W1);for(const u of [0.35,0.72]){const p=[lerp(E1[0],W1[0],u)-n[0]*4.5,lerp(E1[1],W1[1],u)-n[1]*4.5],d=[-n[0]*0.8+(W1[0]-E1[0])/40*-0.25,-n[1]*0.8];const l=Math.hypot(d[0],d[1]);sp.push(spike(p,[d[0]/l,d[1]/l],8,5));}}
  const armG=(a,b)=>()=>lg(x,a[0],a[1],b[0],b[1],[[0,CH[4]],[0.5,CH[2]],[1,CH[0]]]);
  for(const q of sp)card(x,look,()=>poly(x,q),()=>CH[1],1.6);
  card(x,look,()=>poly(x,ua),armG(sr([30,-152]),sr([50,-120])),2.4);
  card(x,look,()=>poly(x,fa),armG(sr([78,-120]),sr([62,-96])),2.4);
  // the blade: a spine of straight facets, outer edge plain, inner edge toothed
  const SP=[[72,-96],[100,-86],[108,-60],[96,-32],[72,-18]].map(sr),BW=[15,14,12,7,0];
  const vn=k=>{const a=SP[Math.max(0,k-1)],b=SP[Math.min(SP.length-1,k+1)];return nrm(a,b);};
  const OUT=SP.map((p,k)=>{const n=vn(k);return[p[0]-n[0]*BW[k]/2,p[1]-n[1]*BW[k]/2];}),IN=SP.map((p,k)=>{const n=vn(k);return[p[0]+n[0]*BW[k]/2,p[1]+n[1]*BW[k]/2];});
  const inner=[];for(let k=IN.length-1;k>0;k--){const a=IN[k],b=IN[k-1],n=nrm(SP[k-1],SP[k]);inner.push(a);if(k>1)for(const u of [0.3,0.65]){const m=[lerp(a[0],b[0],u),lerp(a[1],b[1],u)],tb=[lerp(a[0],b[0],u+0.14),lerp(a[1],b[1],u+0.14)];inner.push([m[0]+n[0]*5.5,m[1]+n[1]*5.5],tb);}}
  inner.push(IN[0]);
  const blade=[...OUT,...inner];
  card(x,look,()=>poly(x,blade),()=>{const a=sr([104,-78]),b=sr([88,-60]);return lg(x,a[0],a[1],b[0],b[1],[[0,CH[4]],[0.45,CH[3]],[0.8,CH[1]],[1,CH[0]]]);},2.4);
  const tal=[[70,-86],[62,-72],[58,-56],[63,-66],[68,-76]].map(sr); // a second, smaller talon of straight facets
  card(x,look,()=>poly(x,tal),()=>{const a=sr([70,-84]),b=sr([60,-60]);return lg(x,a[0],a[1],b[0],b[1],[[0,CH[3]],[1,CH[0]]]);},2);
  const wk=[0,1,2,3,4,5].map(k=>[W1[0]+Math.cos(k*Math.PI/3+0.2)*6.5,W1[1]+Math.sin(k*Math.PI/3+0.2)*6.5]); // the knuckled wrist
  card(x,look,()=>poly(x,wk),()=>rg(x,W1[0]-2,W1[1]-2,1,8,[[0,CH[4]],[1,CH[1]]]),2);
  if(N.detail)litLines(x,LIT,0.45,1.2,[OUT.slice(0,4).map((p,k)=>{const n=vn(k);return[p[0]+n[0]*2.2,p[1]+n[1]*2.2];}),[ua[0],ua[1]].map(p=>[p[0],p[1]+1.5])]);
  card(x,look,()=>poly(x,sh),()=>rg(x,26,-152+Y,3,30,[[0,CH[4]],[0.55,CH[2]],[1,CH[0]]]),2.4);
  // the antlers: smooth curved beams with upturned tines, set on the head and tilting with it
  const ant=[];const beam=(b0,dir,a0,curve,tines)=>{let p=b0,a=a0,w=10;for(let i=0;i<7;i++){a+=curve[i]*dir;const q=[p[0]+Math.cos(a)*12.5,p[1]+Math.sin(a)*12.5],w2=Math.max(1.6,w-1.2);ant.push([p[0],p[1],q[0],q[1],w,w2,1]);
      const tn=tines[i];if(tn){let tp=q,ta=-Math.PI/2+dir*tn[1];const tw=w2*0.88;for(let j=0;j<3;j++){ta+=dir*0.16;const tq2=[tp[0]+Math.cos(ta)*tn[0]/3,tp[1]+Math.sin(ta)*tn[0]/3];ant.push([tp[0],tp[1],tq2[0],tq2[1],tw*(1-j/3),j===2?0.4:tw*(1-(j+1)/3),j===0?1:0]);tp=tq2;}}
      p=q;w=w2;}};
  const L0=-Math.PI/2-1.12,R0=-Math.PI/2+1.12,CV=[0,-0.17,-0.17,-0.15,-0.12,-0.08,-0.04];
  beam([-6,-185+Y],-1,L0,CV,[[16,-0.55],[30,-0.2],0,[34,-0.05],0,[28,0.1],0]);
  beam([10,-185+Y],1,R0,CV,[[16,-0.55],[30,-0.2],0,[34,-0.05],0,[28,0.1],0]);
  drawSegs(ant.map(s=>{const a=rot([s[0],s[1]],HC,ht),b=rot([s[2],s[3]],HC,ht);return[a[0],a[1],b[0],b[1],s[4],s[5],s[6]];}),false);
  // the head: a gaunt human half and a spiked beast half with a long jaw and a tusk
  const hd=[[-6,-188],[-11,-180],[-12,-170],[-10,-161],[-6,-155],[1,-152],[8,-149],[13,-154],[15,-162],[19,-168],[14,-173],[17,-182],[9,-186],[2,-189]].map(p=>rot([p[0],p[1]+Y],HC,ht));
  x.fillStyle=INK;taper(x,[2,-150+Y,2,-162+Y,9,8]);
  card(x,look,()=>poly(x,hd),()=>{const c=rot([-3,-176+Y],HC,ht);return rg(x,c[0],c[1],2,22,[[0,CH[4]],[0.55,CH[2]],[1,CH[0]]]);},2.4);
  const tusk=[[11,-156],[16,-150],[17,-142],[14,-135],[13.5,-143],[10,-151]].map(p=>rot([p[0],p[1]+Y],HC,ht));
  card(x,look,()=>poly(x,tusk),()=>{const a=rot([14,-152+Y],HC,ht),b=rot([14,-136+Y],HC,ht);return lg(x,a[0],a[1],b[0],b[1],[[0,CH[3]],[1,CH[0]]]);},1.8);
  // holes through the card: the dead eye, the ember eye, the mouth, and the eye cluster on the shoulder
  const R=p=>rot([p[0],p[1]+Y],HC,ht);
  const deadE=[[-7.5,-173.5],[-4.5,-175],[-2,-173.5],[-2.5,-170.5],[-5.5,-170],[-8,-171.5]].map(R);
  const beastE=[[3,-175],[9,-178],[14,-176],[12,-171],[6,-170]].map(R);
  const mouth=[[0,-161],[6,-163],[13,-162],[12,-158+op*0.5],[6,-156+op],[1,-158+op*0.4]].map(R);
  const cl=[[26,-148,3.4],[35,-145,3],[29,-139,2.8],[39,-137,2.4]].map(e=>[e[0],e[1]+Y,e[2]]);
  const hex=(cx,cy,r)=>[0,1,2,3,4,5].map(i=>[cx+Math.cos(i*Math.PI/3+0.3)*r,cy+Math.sin(i*Math.PI/3+0.3)*r]);
  cutPath(x,deadE);cutPath(x,beastE);cutPath(x,mouth);for(const e of cl)cutPath(x,hex(e[0],e[1],e[2]));
  return (c,o)=>{
    // the dead eye: pale and clouded, no ember
    c.save();const dc=R([-5,-172]);const g=c.createRadialGradient(dc[0],dc[1],0,dc[0],dc[1],4);g.addColorStop(0,"#e9e2d4");g.addColorStop(0.6,"#b9b0a2");g.addColorStop(1,"#3a3438");c.fillStyle=g;c.beginPath();poly(c,deadE);c.closePath();c.fill();c.restore();
    const be=R([8.5,-174]);hollow(c,beastE,be[0],be[1],7,0.95);emberEye(c,be[0],be[1],3,1.9,-0.25+ht);
    const mc=R([6.5,-159+op*0.3]);hollow(c,mouth,mc[0],mc[1],8,0.95);emberMouth(c,mouth.map(p=>[mc[0]+(p[0]-mc[0])*0.8,mc[1]+(p[1]-mc[1])*0.7]),mc[0],mc[1],6);
    const tt=[];for(let i=0;i<4;i++){const a=R([1.5+i*2.8,-161.6]),b=R([2.9+i*2.8,-158.4]),d=R([4.3+i*2.8,-161.8]);tt.push([a[0],a[1],b[0],b[1],d[0],d[1]]);}
    for(let i=0;i<3;i++){const a=R([3+i*3,-156.5+op*0.9]),b=R([4.4+i*3,-159.5+op*0.9]),d=R([5.8+i*3,-156.5+op*0.9]);tt.push([a[0],a[1],b[0],b[1],d[0],d[1]]);}
    teeth(c,tt);
    for(const e of cl){hollow(c,hex(e[0],e[1],e[2]),e[0],e[1],e[2]*1.6,0.95);emberEye(c,e[0],e[1],e[2]*0.62,e[2]*0.62,0);}
  };
};
BOSS_SIZE.dawn=1.2; // the glow behind and the wisp sized as the other reworked bosses
BOSS_BOXES.dawn=[-140,-278,140,12]; // measured over a stepping cycle

/* The approved settings (rounds 1-9). The boss functions still take a look and a nod, from the rounds when options were
   compared; only these are approved: graded blacks (tone), the skull's horns, the tree leaning with the wind, and the nod to the
   level's colour as lit details plus the glow behind. */
const BOSS_LOOK={tone:true,horns:true,wind:true},BOSS_NOD={detail:true,aura:true};
const _bossCache=new WeakMap();
function renderBossStrip(cv,t,o){ // the wanderer and the place's boss; on a 7.5 s loop the boss breaks into card pieces and its golden wisp rises
  const c=cv.getContext("2d"),s=cv.height/BOSS_H,SW=cv.width/s,lv=o.level,sk=SKY[lv];
  let K=_bossCache.get(cv);if(!K){K={};_bossCache.set(cv,K);}
  c.setTransform(s,0,0,s,0,0);
  const g=c.createLinearGradient(0,0,0,BOSS_GROUND);g.addColorStop(0,sk[0]);g.addColorStop(0.45,sk[1]);g.addColorStop(0.8,sk[2]);g.addColorStop(1,sk[3]);c.fillStyle=g;c.fillRect(0,0,SW,BOSS_H);
  c.fillStyle=mixc(INK,AIR[lv],0.55);c.beginPath();c.moveTo(0,BOSS_H);for(let x=0;x<=SW;x+=8)c.lineTo(x,236+12*Math.sin(x*0.009)+6*Math.sin(x*0.023+1));c.lineTo(SW,BOSS_H);c.closePath();c.fill();
  c.fillStyle=mixc(INK,AIR[lv],0.3);c.beginPath();c.moveTo(0,BOSS_H);for(let x=0;x<=SW;x+=8)c.lineTo(x,268+6*Math.sin(x*0.015+2));c.lineTo(SW,BOSS_H);c.closePath();c.fill();
  c.fillStyle=INK;c.fillRect(0,BOSS_GROUND,SW,BOSS_H-BOSS_GROUND);
  const wx=SW*0.14;drawWanderer(c,wx,BOSS_GROUND+1,t,false,1,o.rm,LV[lv].edge);
  const bx=SW*0.6,by=BOSS_GROUND+2,ph=t%BOSS_CYCLE;
  if(ph<4.8)bossInto(c,s,lv,t,o,Math.round((bx-230)*s),Math.round((by-300)*s),BOSS_NOD,false,K,BOSS_LOOK);
  else{ // defeated on a loop: card pieces and a large golden wisp, then back again; the glow behind fades and returns with it
    if(!K.M||K.Ms!==s){K.M=mk(460*s,330*s);K.Ms=s;}
    const mc=K.M.getContext("2d");mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,K.M.width,K.M.height);bossInto(mc,s,lv,t,o,0,0,BOSS_NOD,true,K,BOSS_LOOK);
    const fade=ph<7?Math.max(0,1-(ph-4.8)/0.8):(ph-7)/0.5;
    if(fade>0)bossGlow(c,bx,by,lv,fade);
    if(ph<7)bossDefeat(c,K.M,s,bx,by,(ph-4.8)/2.2,77,lv,K);
    else{c.save();c.globalAlpha=(ph-7)/0.5;c.drawImage(K.M,bx-230,by-300,K.M.width/s,K.M.height/s);c.restore();}}
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
      c.save();const g=c.createRadialGradient(cx,cy,0,cx,cy,14);g.addColorStop(0,rgba("#eef3ff",a));g.addColorStop(1,rgba("#c8d6ff",0));c.fillStyle=g;c.fillRect(cx-14,cy-14,28,28);
      c.fillStyle=rgba("#f4f7ff",a);c.beginPath();c.moveTo(cx-3,cy);c.quadraticCurveTo(cx,cy-6,cx+3,cy);c.quadraticCurveTo(cx+2,cy+8,cx-4,cy+16);c.quadraticCurveTo(cx-1,cy+7,cx-3,cy);c.fill();c.restore();}
  }else if(eff==="card"||eff==="cardwisp"){ // falls apart into its card pieces, which tumble away (and, chosen: a soul-wisp rises)
    if(!SH.pieces)SH.pieces=sheetPieces(rng32(911));
    for(const pc of SH.pieces){const cx=x0+w*(pc.poly[0][0]+pc.poly[2][0])/2,cy=y0+h*(pc.poly[0][1]+pc.poly[2][1])/2,tx=pc.vx*u*70,ty=pc.vy*u*60+u*u*260,rot=pc.spin*u,al=u<0.55?1:Math.max(0,1-(u-0.55)/0.45);
      c.save();c.globalAlpha=al;c.translate(cx+tx,cy+ty);c.rotate(rot);c.translate(-cx,-cy);
      c.beginPath();pc.poly.forEach((q,i)=>{const px=x0+q[0]*w,py=y0+q[1]*h;i?c.lineTo(px,py):c.moveTo(px,py);});c.closePath();c.save();c.clip();c.drawImage(M,ox,oy,M.width/s,M.height/s);c.restore();
      c.restore();}
    if(eff==="cardwisp"){const wu=(u-0.35)/0.65;if(wu>0){const cx=lerp(x0+w/2,X+120,wu*wu),cy=lerp(y0+h*0.4,y0-120,wu),a=Math.sin(wu*Math.PI)*0.85;
      c.save();const g=c.createRadialGradient(cx,cy,0,cx,cy,14);g.addColorStop(0,rgba("#eef3ff",a));g.addColorStop(1,rgba("#c8d6ff",0));c.fillStyle=g;c.fillRect(cx-14,cy-14,28,28);
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


/* ============================== the door: LanternBox.world ============================== */
const PLACE_SET = { night: "village5", storm: "town", dawn: "moor", mist: "forest" };
const _scenes = {};
function sceneAt(s) { // one Scene per sharpness step, as the directions page keeps them
  const sc = Math.min(2, Math.max(0.5, Math.round(s * 4) / 4));
  return _scenes[sc] || (_scenes[sc] = new Scene(5, sc));
}
function options(level, extra) { // the approved look's options, as the directions page passes them (minus its sketch HUD)
  const lv = level || "night";
  return Object.assign({ level: lv, rm: false, walking: true, facing: 1, hud: false, splash: "on", emberMouth: true,
    defeat: "cardwisp", dcol: EMBER.danger, dglow: EMBER.glow, win: GOLD_LIGHT, litP: LV[lv].litP }, extra || {});
}
const _off = new WeakMap();
function drawPlace(cv, o) { // a whole place into a canvas of any size: the picture is 540 lines tall, its width follows the canvas
  o = o || {};
  const S = cv.height / LH, W = cv.width / S;
  let off = _off.get(cv);
  if (!off || off.width !== cv.width || off.height !== cv.height) { off = mk(cv.width, cv.height); _off.set(cv, off); }
  const ctx = cv.getContext("2d"); ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneAt(S).render(ctx, off, S, W, o.t || 0, o.camX == null ? 600 : o.camX, options(o.level, o));
}
function drawMonsters(cv, t, o) { // the five sample monsters side by side, one defeated at a time (every 3.6 s)
  o = o || {};
  renderSheet(cv, t || 0, options(o.level, Object.assign({ walking: false }, o)), sceneAt(cv.height / SHEET_H));
}
function drawBosses(cv, t, o) { // the wanderer and the place's boss (version 6); on a 7.5 s loop it breaks into card pieces and its golden wisp rises
  o = o || {};
  renderBossStrip(cv, t || 0, options(o.level, Object.assign({ walking: false }, o)));
}
function splash(ctx, place, X, Y, t, rm, seed) { // the place's splash of colour, witch-green at the intense glow
  drawSplash(ctx, PLACE_SET[place] || "village5", "on", X, Y, t || 0, !!rm, seed || 0, "green", "intense");
}
return {
  version: "8.0.0",
  world: {
    LH: LH, GROUND: gY, PLACES: ["night", "storm", "dawn", "mist"], places: LV, bossNames: BOSS_NAME,
    pal: { INK: INK, SKY: SKY, AIR: AIR, HAZE: HAZE, MOON: MOON, MOONPAL: MOONPAL, CLOUD_PAL: CLOUD_PAL, EMBER: EMBER, WITCH: WITCH,
      GOLD_LIGHT: GOLD_LIGHT, POTION: POTION, BONE: BONE, BOSS_AURA: BOSS_AURA, CARD_BLACKS: CH, NOD_COL: NOD_COL },
    options: options, scene: sceneAt, drawPlace: drawPlace, drawMonsters: drawMonsters, drawBosses: drawBosses,
    drawWanderer: drawWanderer, splash: splash,
    parts: {
      Scene: Scene, Pools: Pools, building: building, KINDS: KINDS, SIZE: SIZE, drawSprite: drawSprite, fillHoles: fillHoles, geomSprite: geomSprite,
      pollardGeom: pollardGeom, windGeom: windGeom, snagGeom: snagGeom, overhangGeom: overhangGeom, windOverhangGeom: windOverhangGeom,
      grassSprite: grassSprite, windGrassSprite: windGrassSprite, fernSprite: fernSprite,
      drawGrave5: drawGrave5, drawFence: drawFence, drawWall: drawWall, drawBarrels: drawBarrels, drawCrates: drawCrates, drawWell: drawWell,
      drawMenhir: drawMenhir, drawCairn: drawCairn, drawFallen: drawFallen, drawStoneWall: drawStoneWall, drawBigStump: drawBigStump,
      drawStumpProp: drawStumpProp, drawFerns: drawFerns, drawLog: drawLog,
      drawCandle: drawCandle, drawWallLamp: drawWallLamp, drawStreetLamp: drawStreetLamp, drawPost: drawPost, drawShrine: drawShrine,
      drawPotion: drawPotion, drawFairy: drawFairy,
      drawBat: drawBat, drawCrow: drawCrow, crowSide: crowSide, drawCrowFlocks: drawCrowFlocks, drawCrowsAlone: drawCrowsAlone, drawLeaves: drawLeaves, leafShape: leafShape, drawSwarm: drawSwarm, drawBigBats: drawBigBats, drawCrows: drawCrows,
      drawMoon: drawMoon, moonSprite4: moonSprite4, drawStars: drawStars, drawDaybreak: drawDaybreak, drawSetMoon: drawSetMoon,
      drawSun: drawSun, drawRays: drawRays, drawRain: drawRain, drawBolt: drawBolt, lightning: lightning,
      renderCutClouds: renderCutClouds, renderMist: renderMist,
      MONSTER: MONSTER, MON_BOX: MON_BOX, drawDefeat: drawDefeat, cardFill: cardFill, cardTaper: cardTaper,
      BOSS: BOSS, bossInto: bossInto, bossDefeat: bossDefeat, bossAura: bossAura, bossGlow: bossGlow, BOSS_SIZE: BOSS_SIZE, BOSS_BOXES: BOSS_BOXES,
      BOSS_LOOK: BOSS_LOOK, BOSS_NOD: BOSS_NOD, card: card, hollow: hollow, cutPath: cutPath, litLines: litLines,
      drawSplash: drawSplash, SPLASH: SPLASH, SETS: SETS,
      rng32: rng32, hsh: hsh, mixc: mixc, rgba: rgba, mk: mk
    }
  }
};
})();
