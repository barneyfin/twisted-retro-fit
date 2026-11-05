/* Lantern Box: the play parts, design system version 11 (5 November 2026). Version 1.1.0 of this file.
   Everything designed and agreed for Gloam Hallow in step 4b, the play-parts rounds 1 to 12 (3 and 4 November 2026), as the
   review page drew it, in the order it loads. It runs beside bundle.js (LanternBox.world, here LB and LP) and reads it.
   This is the spec for the kit change (step 4c): Claude Code turns it into kit code; the drawing, sizes and timings here are
   the agreed ones, and the loops (loopX functions) are the reference for each moment's timing. Starting figures (damage,
   speeds, rates) are marked so in the gameplay note.
   Version 1.0.1 (design system 9, two fixes found while building the kit, Barney, 4 November 2026): the mouth-hat's
   signal eyes follow its hop as its own eyes do, so no second pair shows at rest (the crawler's and the flyer's own eyes
   never move, so theirs already sat on them); the Veiled Ghost's "behind" signal fades smoothly out and back in instead
   of flickering 8 times a second (the limit is 3 a second for anything bigger than a character).
   Version 1.1.0 (design system 11, round 13, agreed by Barney, 5 November 2026): one health and one mana potion can be kept and drunk
   when the player chooses: the HUD's two potion sockets (hud13.js, replacing hud10.js: HUD.build's sockets, HUD.set's potions and potFx,
   HUD.OPTS), their moments' world side (pot13.js, new) and the drink sounds (snd13.js, replacing snd12.js); the ghoul lurches about 30
   forward as it swipes, so it outreaches the sword (mvmon.js); the Gaping Tree's long branch sweeps at head height (mvboss.js).
     wand.js, pstrip.js, moves.js   the wanderer as a posable puppet: poses, the play strip, his lantern and tie belt (rounds 1, 2)
     mvmoves.js, mvscene.js         the moves (walk, jump, climb, roll, sword, cast, hurt, life lost) and their effects
     mvloops.js                     the moves' review loops
     mvspells.js                    heal and fireball, stronger with each scroll, and not enough mana (round 3)
     mvloot.js                      the loot on the ground, dropping and picked up (round 4)
     mvcourse.js, mvcourse2.js      round 5 and 5b (ledges, not chosen); kept for the helpers mvroll.js draws pieces with
     mvroll.js, mvlevel.js          the rolling ground, its pieces and pits; the hill sections and each place's order (rounds 5c to 5e)
     mvlamp.js                      the checkpoint lanterns on each place's post (round 6)
     mvmon.js                       the monsters, posable, with their attacks, signals and hit reactions (round 7)
     mvboss.js                      the bosses' attacks, signals, ground warnings, the arrival and the boss bar (round 8)
     mv10.js                        hits and a life lost, the return at the checkpoint, the end of a place (round 10)
     hud13.js                       the HUD builder for bundle.css's HUD parts (rounds 9, 10), with the potion sockets (round 13)
     clips12.js, snd13.js           the sound: synthesised effects and places, and Barney's two recordings (round 12); the drinks (round 13)
     pot13.js                       the potions' moments: kept (the flight to its socket) and drunk (the motes on him) (round 13)
*/

/* ======================================== wand.js ======================================== */
/* ============================== 4b round 1: the wanderer, three directions ==============================
   Feet at (0,0), up is negative, facing right (+x is forward); drawn at 1.32 as the stand-in. Flat ink with the place's lit edge
   (the design system's rule for the wanderer), the lantern's gold glow, and the long red tie belt at the waist in place of the scarf
   (PRD question 8, pencilled by Barney).
   A, the pilgrim: the stand-in refined. Pointed hood, knee-length ragged cloak, sword forward, lantern swinging behind.
   B, the hunter: short cape over a belted tunic, legs and boots showing, lantern hung at the hip, the free hand ready to cast.
   C, the lantern-bearer: deep forward cowl with a long point, cloak to the ankles, lantern held out in front to lead into the dark,
      the sword trailing low behind. */
const W_INK="#060508",W_RED="#b3261e";
function wTaper(x,s){const x1=s[0],y1=s[1],x2=s[2],y2=s[3],w1=s[4],w2=s[5],dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  x.beginPath();x.moveTo(x1+nx*w1/2,y1+ny*w1/2);x.lineTo(x2+nx*w2/2,y2+ny*w2/2);x.lineTo(x2-nx*w2/2,y2-ny*w2/2);x.lineTo(x1-nx*w1/2,y1-ny*w1/2);x.closePath();x.fill();
  x.beginPath();x.arc(x2,y2,w2/2,0,Math.PI*2);x.fill();if(w1>3){x.beginPath();x.arc(x1,y1,w1/2,0,Math.PI*2);x.fill();}}
function wPoly(x,pts){x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();}
function wState(t,walking,rm){const p=walking?t*7:0;return{p,bob:walking?Math.abs(Math.sin(p))*1.1:0,s1:Math.sin(p)*7,sw:Math.sin(t*(rm?1.4:3))*(rm?0.6:1.8),
  bil:walking?(rm?2:4.5)+Math.sin(p*0.5)*(rm?0.4:1.2):1,tip:walking?Math.sin(p)*0.8:2.5,swing:walking?Math.sin(p)*(rm?0.12:0.32):Math.sin(t*(rm?0.8:1.6))*0.06};}
// where the lantern hangs from (local units, before the bob), per direction
function wLanternAt(o,S){if(o==="A")return[-9.5+Math.sin(S.swing)*9,-34.5];if(o==="B")return[5.5,-27.5];if(o==="D")return[13.4,-33.5];return[19,-49.5];}
function wLantern(x,hx,hy,ang,fill){ // a lantern hanging from (hx,hy): bail, short chain, hood, glass box, base
  x.save();x.translate(hx,hy);x.rotate(ang);x.lineWidth=1.1;x.lineCap="round";
  x.beginPath();x.arc(0,1.2,1.4,0,Math.PI*2);x.stroke();x.beginPath();x.moveTo(0,2.6);x.lineTo(0,5);x.stroke();
  wPoly(x,[[-3.2,5],[3.2,5],[4.4,7.2],[-4.4,7.2]]);x.lineWidth=1.2;x.strokeRect(-3.8,7.2,7.6,8.8);x.fillRect(-4.4,16,8.8,1.8);
  if(fill){x.fillStyle=fill;x.fillRect(-2.9,8.1,5.8,7);x.fillStyle="#fff2c4";x.beginPath();x.ellipse(0,12.6,1.1,2.2,0,0,Math.PI*2);x.fill();}
  x.restore();}
function wSil(x,t,walking,rm,o){
  const S=wState(t,walking,rm),{p,bob,s1,sw,bil,tip}=S;x.lineCap="round";x.lineJoin="round";
  for(const lg of [[-2,s1],[2.2,-s1]]){const hx2=lg[0],s=lg[1],kx=hx2+s*0.45,ky=-12.5+Math.abs(s)*0.15,fx=hx2+s;
    x.lineWidth=o==="B"?4.2:4.4;x.beginPath();x.moveTo(hx2,-25-bob);x.lineTo(kx,ky);x.lineTo(fx,-3);x.stroke();
    if(o==="B"){x.lineWidth=5.2;x.beginPath();x.moveTo(kx+(fx-kx)*0.25,ky+(-3-ky)*0.25);x.lineTo(fx,-3.5);x.stroke();} // tall boots
    wPoly(x,[[fx-2.6,-5.5],[fx+2.2,-5.5],[fx+5.6,-1.4],[fx+5.6,0.6],[fx-3,0.6]]);}
  x.save();x.translate(0,-bob);
  const hemAt=(y0,y1,x0,x1,n)=>{const out=[];for(let i=0;i<=n;i++){const u=i/n;out.push([x0+(x1-x0)*u,(i%2?y1:y0)+(walking?Math.sin(p*1.3+i)*(rm?0.3:0.9):0)]);}return out;};
  if(o==="A"){ // knee-length ragged cloak
    x.beginPath();x.moveTo(-8.5,-56);x.lineTo(8.5,-56);x.quadraticCurveTo(8.2,-40,11.5+sw*0.4,-20);
    for(const h of hemAt(-16.5,-20.5,8,-15-bil,7))x.lineTo(h[0],h[1]);x.quadraticCurveTo(-9.5-bil*0.6,-38,-8.5,-56);x.closePath();x.fill();
  }else if(o==="B"){ // belted tunic to the hips, a short cape over the shoulders flaring back
    wPoly(x,[[-6.2,-50],[6.4,-50],[6.2,-36],[8.4,-24],...hemAt(-22,-25.5,7,-8.5,5),[-6.6,-36]]);
    x.beginPath();x.moveTo(-10,-58);x.lineTo(9.5,-58);x.quadraticCurveTo(12,-50,11,-44);
    for(const h of hemAt(-41,-45,9,-17-bil*1.3,6))x.lineTo(h[0],h[1]);x.quadraticCurveTo(-13-bil*0.7,-50,-10,-58);x.closePath();x.fill();
  }else{ // C and D: cloak to the ankles, wide at the hem
    x.beginPath();x.moveTo(-8.5,-56);x.lineTo(8.5,-56);x.quadraticCurveTo(8.6,-36,12.5+sw*0.5,-8);
    for(const h of hemAt(-5,-9.5,10,-19-bil*1.4,9))x.lineTo(h[0],h[1]);x.quadraticCurveTo(-10.5-bil*0.8,-36,-8.5,-56);x.closePath();x.fill();
  }
  if(o!=="B")wPoly(x,[[-10,-58],[10,-58],[12.5,-48],[9,-45],[6.5,-47.5],[3,-44],[0,-47],[-3.5,-43.5],[-7,-46.5],[-10.5-bil*0.3,-44],[-13-bil*0.4,-47]]); // the shoulder cape's ragged edge
  // hood: drawn at 86% about the head, with the face opening notched into its front (C's cowl overhangs instead)
  x.save();x.translate(0,-60);x.scale(0.86,0.86);x.translate(0,60);x.beginPath();
  if(o==="A"){x.moveTo(-7,-55);x.quadraticCurveTo(-11,-64,-8.5,-71);x.quadraticCurveTo(-14-bil*0.5,-73,-19-bil,-66+tip);x.quadraticCurveTo(-13-bil*0.4,-70.5,-6.5,-75.5);
    x.quadraticCurveTo(1,-81,7,-75);x.quadraticCurveTo(10.5,-72,10.4,-69);x.lineTo(6.4,-67.5);x.lineTo(6.6,-62.6);x.lineTo(9.6,-61.4);x.quadraticCurveTo(9.4,-60.5,7.2,-60.2);x.quadraticCurveTo(8,-57.5,6.5,-55);}
  else if(o==="B"){x.moveTo(-7,-55);x.quadraticCurveTo(-10,-63,-8,-70);x.quadraticCurveTo(-11.5,-72,-13.5-bil*0.3,-68+tip*0.6);x.quadraticCurveTo(-10.5,-73,-6,-76);
    x.quadraticCurveTo(1,-80,6.5,-75);x.quadraticCurveTo(9.5,-72,9.6,-69);x.lineTo(6,-67.6);x.lineTo(6.2,-62.8);x.lineTo(9,-61.6);x.quadraticCurveTo(8.6,-60.6,6.8,-60.3);x.quadraticCurveTo(7.6,-57.5,6.2,-55);}
  else{ // C and D: the deep cowl
    x.moveTo(-7,-55);x.quadraticCurveTo(-12,-64,-9,-72);x.quadraticCurveTo(-16-bil*0.6,-76,-25-bil*1.2,-63+tip);x.quadraticCurveTo(-15-bil*0.5,-73,-6,-78.5);
    x.quadraticCurveTo(3,-85,10.5,-77.5);x.quadraticCurveTo(14.5,-72.5,14,-64.5);x.quadraticCurveTo(10.5,-62.5,8,-61);x.quadraticCurveTo(8.6,-58,6.5,-55);}
  x.closePath();x.fill();x.restore();
  // arms, sword and lantern
  const LA=wLanternAt(o,S);
  if(o==="A"||o==="B"||o==="D"){
    x.lineWidth=3.8;x.beginPath();x.moveTo(5,-52);x.lineTo(12,-44);x.lineTo(17,-37.5);x.stroke(); // sword arm, forward
    x.lineWidth=2.4;x.beginPath();x.moveTo(14.6,-41.6);x.lineTo(20.2,-32.6);x.stroke();x.beginPath();x.arc(14.2,-38.8,1.9,0,Math.PI*2);x.fill();
    wTaper(x,[18.6,-36.2,49,-21,2.8,0.5]);
  }
  if(o==="A"){x.lineWidth=3.6;x.beginPath();x.moveTo(-5,-51);x.lineTo(-8.5,-42);x.lineTo(LA[0],LA[1]);x.stroke();wLantern(x,LA[0],LA[1],-S.swing*0.6);}
  else if(o==="B"||o==="D"){x.lineWidth=3.4;x.beginPath();x.moveTo(-4,-51);x.lineTo(-1,-43);x.lineTo(4.5,-41.5);x.stroke(); // the free hand, ready to cast
    wLantern(x,LA[0],LA[1],S.swing*0.25);}
  else{x.lineWidth=3.8;x.beginPath();x.moveTo(5,-52);x.lineTo(12.5,-47);x.lineTo(LA[0],LA[1]);x.stroke();wLantern(x,LA[0],LA[1],S.swing*0.35); // lantern held out in front
    x.lineWidth=3.6;x.beginPath();x.moveTo(-5,-51);x.lineTo(-9,-42);x.lineTo(-10.5,-34.5);x.stroke(); // sword arm, trailing
    x.lineWidth=2.4;x.beginPath();x.moveTo(-7.4,-36.6);x.lineTo(-13.6,-32.2);x.stroke();wTaper(x,[-11.6,-33.2,-36,-13.5,2.8,0.5]);}
  x.restore();return S;}
function wDetail(x,t,walking,rm,o,S){ // the tie belt, and the lantern's lit glass
  const {bob,p}=S;x.save();x.translate(0,-bob);
  const y0=o==="B"?-31:-34.5,hw=o==="B"?7.4:(o==="A"?9.4:9.8),kx=o==="B"?-7.8:-9.6; // D wears it as C
  x.fillStyle=W_RED;wPoly(x,[[-hw,y0-1.8],[hw+0.4,y0-1.8],[hw+0.6,y0+1.6],[-hw,y0+1.6]]);
  if(o==="D"){x.lineWidth=1.3;x.strokeStyle=W_INK;x.beginPath();x.moveTo(hw-0.6,y0);x.lineTo(13.4,-33.5);x.stroke();x.fillStyle=W_RED;} // the lantern's hook off the front of the belt
  x.beginPath();x.ellipse(kx,y0,2.3,2,0.3,0,Math.PI*2);x.fill(); // the knot at the back
  const L=walking?34:24,amp=walking?(rm?1.4:3.6):(rm?0.6:1.3),fq=rm?2.5:7;
  for(let k=0;k<2;k++){const top=[],bot=[];
    for(let i=0;i<=8;i++){const u=i/8,px=kx-u*(L-k*7)*(walking?1:0.5),py=y0+k*2.2+u*(walking?6:17)+Math.sin(t*fq+u*5+k*1.3)*u*amp,w=1.6-u*0.75;top.push([px,py-w]);bot.push([px,py+w]);}
    x.beginPath();x.moveTo(top[0][0],top[0][1]);for(const q of top)x.lineTo(q[0],q[1]);for(let i=bot.length-1;i>=0;i--)x.lineTo(bot[i][0],bot[i][1]);x.closePath();x.fill();}
  const LA=wLanternAt(o,S),ang=o==="A"?-S.swing*0.6:(o==="B"||o==="D")?S.swing*0.25:S.swing*0.35;
  x.fillStyle=W_INK;x.strokeStyle=W_INK;wLantern(x,LA[0],LA[1],ang,"#ffd27a");
  x.restore();}
function drawWand(x,X,Y,t,walking,facing,rm,edge,o,k){ // as drawWanderer: the lantern's pool of light, the lit edge, the ink figure, its details
  k=k||1.32;const f=facing||1,S0=wState(t,walking,rm),LA=wLanternAt(o,S0),lx=X+f*LA[0]*k,ly=Y+(LA[1]+12-S0.bob)*k;
  let g=x.createRadialGradient(lx,ly,2,lx,ly,74*k/1.32);g.addColorStop(0,"rgba(255,201,106,0.42)");g.addColorStop(1,"rgba(255,201,106,0)");x.fillStyle=g;x.fillRect(lx-80*k,ly-80*k,160*k,160*k);
  x.save();x.translate(X+1.3*k/1.32,Y-1.3*k/1.32);x.scale(f*k,k);x.fillStyle=x.strokeStyle=edge||"rgba(255,231,184,0.9)";wSil(x,t,walking,rm,o);x.restore();
  x.save();x.translate(X,Y);x.scale(f*k,k);x.fillStyle=x.strokeStyle=W_INK;const S=wSil(x,t,walking,rm,o);wDetail(x,t,walking,rm,o,S);x.restore();
  g=x.createRadialGradient(X,Y+1,1,X,Y+1,30*k/1.32);g.addColorStop(0,"rgba(255,201,106,0.2)");g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(X-32*k,Y-6*k,64*k,14*k);}

/* ======================================== pstrip.js ======================================== */
/* the page's own drawing: a place strip (sky, hills, path) with a wanderer, a ghoul and a walker for scale; and a close-up */
const LB=LanternBox.world,LP=LB.parts,PH=320,PG=292;
function pSky(c,lv,SW,H,G){const k=LB.pal.SKY[lv],g=c.createLinearGradient(0,0,0,G);g.addColorStop(0,k[0]);g.addColorStop(0.45,k[1]);g.addColorStop(0.8,k[2]);g.addColorStop(1,k[3]);c.fillStyle=g;c.fillRect(0,0,SW,H);
  const A=LB.pal.AIR[lv];c.fillStyle=LP.mixc(LB.pal.INK,A,0.55);c.beginPath();c.moveTo(0,H);for(let x=0;x<=SW;x+=8)c.lineTo(x,G-56+12*Math.sin(x*0.009)+6*Math.sin(x*0.023+1));c.lineTo(SW,H);c.closePath();c.fill();
  c.fillStyle=LP.mixc(LB.pal.INK,A,0.3);c.beginPath();c.moveTo(0,H);for(let x=0;x<=SW;x+=8)c.lineTo(x,G-24+6*Math.sin(x*0.015+2));c.lineTo(SW,H);c.closePath();c.fill();
  c.fillStyle=LB.pal.INK;c.fillRect(0,G,SW,H-G);}
function pMonster(c,s,K,kind,X,Y,t,o){if(!K.mon||K.monS!==s){K.mon=LP.mk(260*s,250*s);K.monS=s;K.H={};}
  const mc=K.mon.getContext("2d");mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,K.mon.width,K.mon.height);LB.scene(s).monsterInto(mc,s,{kind,X,Y,ph:0.4},t,o,0,0,K.H);
  c.drawImage(K.mon,X-130,Y-230,K.mon.width/s,K.mon.height/s);}
function renderPlay(cv,t,lv,opt,walking,K){const c=cv.getContext("2d"),s=cv.height/PH,SW=cv.width/s,o=LB.options(lv,{walking:false});
  c.setTransform(s,0,0,s,0,0);pSky(c,lv,SW,PH,PG);
  pMonster(c,s,K,"ghoul2",SW*0.56,PG+2,t,o);pMonster(c,s,K,"walker",SW*0.82,PG,t,o);
  c.setTransform(s,0,0,s,0,0);drawWand(c,SW*0.24,PG+1,t,walking,1,false,LB.places[lv].edge,opt);
  c.textAlign="center";c.textBaseline="top";c.font='12px "Alegreya Sans",sans-serif';c.fillStyle="#c9a25a";
  c.fillText("the wanderer, "+opt,SW*0.24,PG+10);c.fillText("ghoul",SW*0.56,PG+10);c.fillText("walker",SW*0.82,PG+10);}
function renderClose(cv,t,lv,opt,walking){const c=cv.getContext("2d"),H=150,s=cv.height/H,SW=cv.width/s,G=136;c.setTransform(s,0,0,s,0,0);
  const k=LB.pal.SKY[lv],g=c.createLinearGradient(0,0,0,G);g.addColorStop(0,k[1]);g.addColorStop(0.7,k[2]);g.addColorStop(1,k[3]);c.fillStyle=g;c.fillRect(0,0,SW,H);
  c.fillStyle=LB.pal.INK;c.fillRect(0,G,SW,H-G);drawWand(c,SW*0.46,G+1,t,walking,1,false,LB.places[lv].edge,opt);}

/* ======================================== moves.js ======================================== */
/* ============================== 4b round 2: the wanderer, posable ==============================
   The chosen wanderer (round 1b, D) as a card puppet with joints. A pose P is plain numbers in local units (feet origin at (0,0),
   up negative, facing right is +x; drawn at 1.32 as before):
     hx,hy   the hip, relative to the feet origin (standing: 0,-25)
     lean    the upper body's tilt about the hip (radians, forward positive)
     ft      the two ankles [[x,y,angle],[x,y,angle]], back foot first; the knees are worked out (two-bone IK, knees forward)
     sH,sb   the sword hand (in the upper body's frame, hip at 0,0) and the blade's angle in that frame; sbend flips the elbow
     fH,fl   the free hand (same frame) and its arm's two lengths; fbend flips the elbow
     hem,lift,flare,pool  the cloak: length factor, hem lifted towards the hip, back flared out
     bil,tip the cowl's point (billow back, lift) ; nod the head's tilt ; vx,vy the speed felt by the belt tails (local units a second)
     lan     the lantern's swing ; ball  when set, the tucked roll at that angle ; hand  a glow at the free hand (0..1)
   Everything that moves on its own (the hem's flutter, the tails' ripple) reads a stepped time, so the whole figure steps
   like the monsters' puppets; only where it stands glides. */
const MV_INK="#060508",MV_RED="#b3261e",MV_GLASS="#ffd27a",MV_GOLD="#ffcf6a",MV_LAMP="#ffdf9a";
const MV_BASE={hx:0,hy:-25,lean:0,ft:[[-2,-3,0],[2.2,-3,0]],sH:[17,-12.5],sb:0.4636,sbend:-1,fH:[4.5,-16.5],fl:[8.5,5.7],fbend:1,
  hem:1,lift:0,flare:0,bil:1,tip:2.5,nod:0,vx:0,vy:0,lan:0,ball:null,hand:0,flut:0,sword:true};
function mvP(o){const P=Object.assign({},MV_BASE,o||{});P.ft=(o&&o.ft)||MV_BASE.ft;return P;}
function mvMix(A,B,u){const P=Object.assign({},A);for(const k in B){const a=A[k],b=B[k];
  if(typeof a==="number"&&typeof b==="number")P[k]=a+(b-a)*u;else if(Array.isArray(a)&&Array.isArray(b))P[k]=a.map((q,i)=>Array.isArray(q)?q.map((r,j)=>r+(b[i][j]-r)*u):q+(b[i]-q)*u);else P[k]=u<0.5?a:b;}return P;}
function mvIK(hx,hy,ax,ay,L1,L2,sg){const dx=ax-hx,dy=ay-hy;let d=Math.hypot(dx,dy)||0.001;const m=L1+L2-0.02;
  if(d>m){ax=hx+dx/d*m;ay=hy+dy/d*m;d=m;}const b=Math.atan2(dy,dx),c=Math.acos(Math.max(-1,Math.min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))));
  const a=b-sg*c;return[hx+L1*Math.cos(a),hy+L1*Math.sin(a),ax,ay];}
// the figure's joints for pose P, in the feet-origin frame; tq is the stepped time
function mvGeo(P,tq){
  const c=Math.cos(P.lean),s=Math.sin(P.lean),T=(x,y)=>[P.hx+x*c-y*s,P.hy+x*s+y*c];
  const legs=[[-2,0],[2.2,0]].map((h,i)=>{const H=T(h[0],h[1]),f=P.ft[i],K=mvIK(H[0],H[1],f[0],f[1],12.8,9.9,1);return{H,K:[K[0],K[1]],A:[K[2],K[3]],a:f[2]||0};});
  const sA=mvIK(5,-27,P.sH[0],P.sH[1],10.6,8.2,P.sbend),fS=P.fS||[-4,-26],fA=mvIK(fS[0],fS[1],P.fH[0],P.fH[1],P.fl[0],P.fl[1],P.fbend);
  let sb=P.sb;const B=mvBlade(P),tipY=a=>{const hx=sA[2]+Math.cos(a)*(B.len+1.9),hy=sA[3]+Math.sin(a)*(B.len+1.9);return P.hy+hx*s+hy*c;};
  if(P.sword&&P.ball==null){const fwd=Math.cos(sb+P.lean)>=0;for(let i=0;i<40&&tipY(sb)>-1;i++)sb+=fwd?-0.04:0.04;}
  const u=[Math.cos(sb),Math.sin(sb)];
  return{T,c,s,sb,fS,legs,sE:[sA[0],sA[1]],sHd:[sA[2],sA[3]],fE:[fA[0],fA[1]],fHd:[fA[2],fA[3]],u,hook:T(13.4,-8.5),knot:T(-9.6,-9.5),chest:T(4,-22),head:T(3,-40)};}
function mvBlade(P){const r=(P.lvl&&P.lvl.r)||0;return{len:34+7*r,w:2.8+0.25*r};}
function mvSword(x,G,P){ // the sword arm and the sword, in the upper body's frame
  const h=G.sHd,u=G.u,B=mvBlade(P);x.lineWidth=3.8;x.beginPath();x.moveTo(5,-27);x.lineTo(G.sE[0],G.sE[1]);x.lineTo(h[0],h[1]);x.stroke();
  if(!P.sword)return;const ga=G.sb+0.55,gx=Math.cos(ga)*5.3,gy=Math.sin(ga)*5.3,gc=[h[0]+u[0]*0.4,h[1]+u[1]*0.4];
  x.lineWidth=2.4;x.beginPath();x.moveTo(gc[0]-gx,gc[1]-gy);x.lineTo(gc[0]+gx,gc[1]+gy);x.stroke();
  x.beginPath();x.arc(h[0]-u[0]*3.1,h[1]-u[1]*3.1,1.9,0,Math.PI*2);x.fill();
  const b0=[h[0]+u[0]*1.9,h[1]+u[1]*1.9];wTaper(x,[b0[0],b0[1],b0[0]+u[0]*B.len,b0[1]+u[1]*B.len,B.w,0.5]);}
function mvRunes(x,G,P){const n=(P.lvl&&P.lvl.s)||0;if(!n||!P.sword)return;const h=G.sHd,u=G.u,B=mvBlade(P),nx=-u[1],ny=u[0];
  x.fillStyle=MV_GOLD;for(let i=0;i<n;i++){const d=7+i*(B.len-12)/Math.max(3,n),px=h[0]+u[0]*(1.9+d),py=h[1]+u[1]*(1.9+d),r=1.45;
    x.beginPath();x.moveTo(px+u[0]*r*1.6,py+u[1]*r*1.6);x.lineTo(px+nx*r,py+ny*r);x.lineTo(px-u[0]*r*1.6,py-u[1]*r*1.6);x.lineTo(px-nx*r,py-ny*r);x.closePath();x.fill();}}
function mvBoot(x,A,a){x.save();x.translate(A[0],A[1]);x.rotate(a);wPoly(x,[[-2.6,-2.5],[2.2,-2.5],[5.6,1.6],[5.6,3.6],[-3,3.6]]);x.restore();}
function mvCloak(x,G,P,tq){
  const sh=G.T(0,-31),dx=(sh[0]-P.hx)*0.5,avail=-1.6-P.hy,want=20*P.hem,pool=Math.max(0,want-avail),dep=Math.min(want,avail),fl=P.flut;
  const top1=G.T(-8.5,-31),top2=G.T(8.5,-31),fc=G.T(8.6,-11),bc=G.T(-10.5-P.bil*0.8-P.flare*0.3,-11),sw=Math.sin(tq*3)*1.8;
  const fa=G.legs[1].A,fo=Math.max(0,fa[0]+4-(P.hx+dx+12.5)),ba=G.legs[0].A,bo=Math.max(0,(P.hx+dx-19-P.bil*1.4-P.flare)-(ba[0]-5));
  let fbx=P.hx+dx+12.5+sw*0.5+pool*0.9+fo,fby=P.hy+dep*0.85-P.lift*0.6,hf=0;
  if(P.part&&fa[0]>P.hx+5){const kx=G.legs[1].K[0];const nx=Math.min(fbx,kx-0.5);hf=(fbx-nx)*P.part;fbx-=hf;}
  const fb=[fbx,fby];
  x.beginPath();x.moveTo(top1[0],top1[1]);x.lineTo(top2[0],top2[1]);x.quadraticCurveTo(fc[0],fc[1],fb[0],fb[1]);
  for(let i=0;i<=9;i++){const u=i/9,hx=P.hx+dx+10+pool*0.9+(fo-hf)*(1-u)+(-29-P.bil*1.4-P.flare-pool*1.8-bo)*u,hy=P.hy+(i%2?15.5:20)*dep/20-P.lift*(0.3+0.7*u)+Math.sin(tq*9+i)*fl;x.lineTo(hx,hy);}
  x.quadraticCurveTo(bc[0],bc[1],top1[0],top1[1]);x.closePath();x.fill();}
function mvCowl(x,P){const b=P.bil,tp=P.tip;x.save();x.translate(0,-30);x.rotate(P.nod);x.translate(0,30);
  x.translate(0,-35);x.scale(0.86,0.86);x.translate(0,35);x.beginPath();
  x.moveTo(-7,-30);x.quadraticCurveTo(-12,-39,-9,-47);x.quadraticCurveTo(-16-b*0.6,-51,-25-b*1.2,-38+tp);x.quadraticCurveTo(-15-b*0.5,-48,-6,-53.5);
  x.quadraticCurveTo(3,-60,10.5,-52.5);x.quadraticCurveTo(14.5,-47.5,14,-39.5);x.quadraticCurveTo(10.5,-37.5,8,-36);x.quadraticCurveTo(8.6,-33,6.5,-30);
  x.closePath();x.fill();x.restore();}
function mvBody(x,G,P){x.save();x.translate(P.hx,P.hy);x.rotate(P.lean);}
function mvBall(x,P,tq,det){ // the tucked roll: the cloak wrapped round into a ragged ball, the cowl's point and the boots showing
  const R=12.5;x.save();x.translate(P.hx,-R-0.5);x.rotate(P.ball);
  if(!det){x.beginPath();for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=R+(i%2?-1.4:0.6)*(a>2.4&&a<4.6?1.6:0.5);i?x.lineTo(Math.cos(a)*r,Math.sin(a)*r):x.moveTo(Math.cos(a)*r,Math.sin(a)*r);}x.closePath();x.fill();
    x.beginPath();x.moveTo(-6,-10.5);x.quadraticCurveTo(-14,-15,-21-P.bil,-9+P.tip);x.quadraticCurveTo(-13,-11,-10,-4);x.closePath();x.fill(); // the cowl's point
    mvBoot(x,[6,9.5],-0.9);mvBoot(x,[1.5,11.5],-0.5);}
  else{x.save();x.beginPath();x.arc(0,0,R-0.6,0,Math.PI*2);x.clip();x.fillStyle=MV_RED;x.save();x.rotate(0.5);x.fillRect(-R,1.2,R*2,3.4);x.restore();x.restore();
    x.fillStyle=MV_GLASS;x.fillRect(5.2,-3.4,3.6,4.2);}
  x.restore();}
function mvSil(x,P,tq){x.lineCap="round";x.lineJoin="round";
  if(P.ball!=null){mvBall(x,P,tq,false);return null;}
  const G=mvGeo(P,tq);
  for(const L of G.legs){x.lineWidth=4.4;x.beginPath();x.moveTo(L.H[0],L.H[1]);x.lineTo(L.K[0],L.K[1]);x.lineTo(L.A[0],L.A[1]);x.stroke();mvBoot(x,L.A,L.a);}
  mvCloak(x,G,P,tq);
  mvBody(x,G,P);
  wPoly(x,[[-10,-33],[10,-33],[12.5,-23],[9,-20],[6.5,-22.5],[3,-19],[0,-22],[-3.5,-18.5],[-7,-21.5],[-10.5-P.bil*0.3,-19],[-13-P.bil*0.4,-22]]);
  mvCowl(x,P);mvSword(x,G,P);
  x.lineWidth=3.4;x.beginPath();x.moveTo(G.fS[0],G.fS[1]);x.lineTo(G.fE[0],G.fE[1]);x.lineTo(G.fHd[0],G.fHd[1]);x.stroke();
  x.restore();
  wLantern(x,G.hook[0],G.hook[1],P.lan);return G;}
function mvTails(x,G,P,tq,origin){const sp=Math.min(1,Math.hypot(P.vx,P.vy)/54);let dx=-0.6-2.6*Math.max(-1.6,Math.min(1.6,P.vx/54))-Math.min(1,Math.abs(P.vy)/90)*1.1,dy=0.9-2.2*Math.max(-1.2,Math.min(1.2,P.vy/54));
  const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;const nx=-dy,ny=dx,L=24+10*sp,amp=1.3+2.3*sp,K=origin||G.knot;
  for(let k=0;k<2;k++){const top=[],bot=[];for(let i=0;i<=8;i++){const u=i/8,w=1.6-u*0.75,wv=Math.sin(tq*7+u*5+k*1.3)*u*amp,px=K[0]+dx*u*(L-k*7)+nx*wv,py=K[1]+k*2.2+dy*u*(L-k*7)+ny*wv;top.push([px-nx*w,py-ny*w]);bot.push([px+nx*w,py+ny*w]);}
    x.beginPath();x.moveTo(top[0][0],top[0][1]);for(const q of top)x.lineTo(q[0],q[1]);for(let i=bot.length-1;i>=0;i--)x.lineTo(bot[i][0],bot[i][1]);x.closePath();x.fill();}}
function mvDet(x,P,tq,G){
  if(P.ball!=null){mvBall(x,P,tq,true);const a=P.ball+0.5,K=[P.hx-Math.cos(a)*11,-13-Math.sin(a)*11];x.fillStyle=MV_RED;mvTails(x,null,P,tq,K);return;}
  mvBody(x,G,P);x.fillStyle=MV_RED;wPoly(x,[[-9.8,-11.3],[10.2,-11.3],[10.4,-7.9],[-9.8,-7.9]]);
  x.lineWidth=1.3;x.strokeStyle=MV_INK;x.beginPath();x.moveTo(9.2,-9.5);x.lineTo(13.4,-8.5);x.stroke();
  x.fillStyle=MV_RED;x.beginPath();x.ellipse(-9.6,-9.5,2.3,2,0.3,0,Math.PI*2);x.fill();x.restore();
  x.fillStyle=MV_RED;mvTails(x,G,P,tq);
  mvBody(x,G,P);x.fillStyle=x.strokeStyle=MV_INK;mvSword(x,G,P);mvRunes(x,G,P);x.restore();
  x.fillStyle=x.strokeStyle=MV_INK;wLantern(x,G.hook[0],G.hook[1],P.lan,MV_GLASS);}
// the wanderer in pose P with its feet origin at (X,Y) picture units; o: {edgeA (the lit edge's strength, 0..1), pool (lantern light, 0..1)}
function mvDraw(x,X,Y,P,tq,f,edge,k,o){k=k||1.32;f=f||1;o=o||{};const eA=o.edgeA==null?1:o.edgeA,pl=o.pool==null?1:o.pool;
  // where the lantern hangs, for its pool of light
  let lx,ly;if(P.ball!=null){lx=X+f*(P.hx+5)*k;ly=Y-13*k;}else{const G0=mvGeo(P,tq);lx=X+f*G0.hook[0]*k;ly=Y+(G0.hook[1]+12)*k;}
  if(pl>0){const g=x.createRadialGradient(lx,ly,2,lx,ly,74*k/1.32);g.addColorStop(0,"rgba(255,201,106,"+(0.42*pl)+")");g.addColorStop(1,"rgba(255,201,106,0)");x.fillStyle=g;x.fillRect(lx-80*k,ly-80*k,160*k,160*k);}
  if(eA>0){x.save();x.globalAlpha=eA;x.translate(X+1.3*k/1.32,Y-1.3*k/1.32);x.scale(f*k,k);x.fillStyle=x.strokeStyle=edge||"rgba(255,231,184,0.9)";mvSil(x,P,tq);x.restore();}
  if(o.aura&&o.aura.a>0){const A=o.aura,top=Y-A.h*100*k;x.save();x.beginPath();x.rect(X-140*k,top,280*k,Y+30*k-top);x.clip();x.globalAlpha=Math.min(1,A.a);
    for(let i=0;i<8;i++){const an=i*Math.PI/4;x.save();x.translate(X+Math.cos(an)*A.w*k/1.32,Y+Math.sin(an)*A.w*k/1.32);x.scale(f*k,k);x.fillStyle=x.strokeStyle=A.col;mvSil(x,P,tq);x.restore();}x.restore();}
  x.save();x.translate(X,Y);x.scale(f*k,k);x.fillStyle=x.strokeStyle=MV_INK;const G=mvSil(x,P,tq);mvDet(x,P,tq,G);x.restore();
  if(o.feet!==false){const g=x.createRadialGradient(X,Y+1,1,X,Y+1,30*k/1.32);g.addColorStop(0,"rgba(255,201,106,"+(0.2*pl)+")");g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(X-32*k,Y-6*k,64*k,14*k);}
  return G;}
// a point of the figure (in the upper body's frame) in picture units
function mvPt(G,P,X,Y,f,k,bx,by){const p=G?G.T(bx,by):[P.hx+bx,P.hy+by];return[X+f*p[0]*k,Y+p[1]*k];}

/* ======================================== mvmoves.js ======================================== */
/* ============================== 4b round 2: the moves ==============================
   Each move is a run of held poses (card-puppet steps) and a path for where the wanderer stands, which glides.
   Time is counted in steps: at 8 steps a second (the monsters' rate) or 12. */
// a pose authored with the hands placed in the feet frame (sW, fW) and the blade's angle on screen (sbw): converted to the body frame
function mvA(o){const P=mvP(o),c=Math.cos(P.lean),s=Math.sin(P.lean),B=p=>{const x=p[0]-P.hx,y=p[1]-P.hy;return[x*c+y*s,-x*s+y*c];};
  if(o.sW)P.sH=B(o.sW);if(o.fW)P.fH=B(o.fW);if(o.sbw!=null)P.sb=o.sbw-P.lean;return P;}
const FT=(a,b,c,d,e,f)=>[[a,b,e||0],[c,d,f||0]];
// ---------- standing and walking
function mvIdle(i){const b=[0,0.25,0.4,0.2][i%4];return mvP({hy:-25+b,ft:FT(-2.5,-3,2.6,-3),sH:[17,-12.5+b*0.6],sb:0.4636+b*0.04,lan:[0.04,0,-0.04,0][i%4],tip:2.5-b,bil:1+b*0.5});}
const WF=[[11,-3,-0.15],[6,-3,0],[0.5,-3,0],[-5,-3.4,0.15],[-10,-4.8,0.5],[-5,-9.5,0.35],[1.5,-10,0.05],[7.5,-6.5,-0.2]],WH=[-23.6,-23.3,-24.8,-25.4];
function mvWalk(i){i=((i%8)+8)%8;const a=i*Math.PI/4,fb=WF[(i+4)%8],ff=WF[i];
  return mvP({hy:WH[i%4],hx:0.5,lean:0.07+(i%4===3?0.02:0),ft:[[fb[0]-2,fb[1],fb[2]],[ff[0]+2.2,ff[1],ff[2]]],sH:[17+Math.sin(a)*1.2,-12.5+Math.cos(a)*0.8],sb:0.47+Math.sin(a)*0.04,
    fH:[4.5-Math.sin(a)*1.6,-16.5],bil:4.5+Math.sin(a*0.5)*1.2,tip:Math.sin(a)*0.8,flare:1.5,flut:0.9,vx:54,part:1,lift:2.5,lan:Math.sin(a)*0.14});}
// ---------- the jump
const PJ={
  crouch:mvP({hy:-18.5,hx:-1,lean:0.28,ft:FT(-5,-3,4.5,-3),sH:[15,-8],sb:0.75,fH:[2,-12],nod:0.1,bil:1.5}),
  launch:mvP({hy:-26.5,lean:0.12,ft:FT(-4.5,-2,1.5,-1.5,0.7,0.55),sH:[17,-16],sb:0.3,fH:[6,-30],fl:[8.6,7.5],vy:-150,bil:2,tip:4,lift:-2}),
  rise:mvP({hy:-24,lean:0.05,ft:FT(-2.5,-13.5,3,-15.5,0.45,0.2),sH:[16,-18],sb:0.15,fH:[3,-28],fl:[8.6,7],vy:-90,lift:2,flare:3,bil:3,tip:4}),
  apex:mvP({hy:-24,lean:0.08,ft:FT(-2,-14,3.5,-14.5,0.35,0.1),sH:[17,-16],sb:0.2,fH:[-1,-30],fl:[8.6,7],vy:0,lift:6,flare:6,bil:4,tip:1,flut:0.8}),
  fall:mvP({hy:-25,lean:0.02,ft:FT(-4,-5,4.5,-6.5,0.35,0.1),sH:[17,-20],sb:0,fH:[-8,-30],fl:[8.6,7.5],vy:150,lift:9,flare:5,bil:5,tip:-2,flut:1}),
  land:mvP({hy:-16.5,hx:0.5,lean:0.33,ft:FT(-6.5,-3,6.5,-3),sH:[17,-4],sb:0.85,fH:[3,-6],bil:2,tip:3,nod:0.15}),
  recover:mvP({hy:-22.5,lean:0.12,ft:FT(-4,-3,4,-3),sH:[16.5,-11],sb:0.55})};
// ---------- climbing onto a ledge (its top 96 units up, its front edge at x 0) and dropping down through one
const LEDGE=96;
const PC={
  look:mvP({hy:-20,lean:0.1,ft:FT(-4,-3,4,-3),nod:-0.35,sH:[14,-6],sb:0.9,fH:[-3,-10],bil:1.5}),
  grab:mvA({hy:-25,lean:-0.03,ft:FT(-1.5,-1,2,-1.5,0.6,0.5),sW:[12.5,-66.5],sbw:0,fW:[10,-66],fl:[10,9.6],nod:-0.3,lift:-1,vy:-60,bil:1.5,tip:3.5}),
  pull:mvA({hy:-25,lean:0.3,ft:FT(-4,-5,0.5,-8,0.4,0.2),sW:[14,-40],sbw:0,fW:[11,-40.5],fl:[10,9.6],nod:0.1,bil:2,tip:3}),
  knee:mvA({hy:-24,lean:0.45,ft:FT(-3,-2,8,-26,0.4,0),sW:[16,-26],sbw:0,fW:[12,-26.5],fl:[10,9.6],nod:0.15,bil:2,tip:3}),
  rise:mvP({hy:-18,lean:0.3,ft:FT(-4,-3,5,-3),sH:[15,-6],sb:0.8,fH:[3,-8],bil:1.5}),
  stand:mvP({ft:FT(-2.5,-3,2.6,-3)})};
const PD={
  crouch:mvP({hy:-18,lean:0.2,ft:FT(-4,-3,4,-3),nod:0.25,sH:[15,-7],sb:0.85,fH:[2,-10]}),
  drop:mvP({hy:-26,ft:FT(-2.5,-1.5,2.5,-2,0.5,0.45),sH:[17,-18],sb:0.15,fH:[-6,-32],fl:[8.6,7.6],lift:5,flare:3,bil:3,tip:-1,vy:100}),
  fall:mvP({hy:-25,ft:FT(-4,-4,4,-5.5,0.35,0.15),sH:[18,-20],sb:-0.05,fH:[-9,-32],fl:[8.6,7.6],lift:10,flare:5,bil:5,tip:-3,vy:200,flut:1}),
  land:mvP({hy:-16,lean:0.35,ft:FT(-6.5,-3,6.5,-3),sH:[17,-3],sb:0.9,fH:[3,-5],bil:2,nod:0.2}),
  recover:mvP({hy:-22.5,lean:0.12,ft:FT(-4,-3,4,-3),sH:[16.5,-11],sb:0.55})};
// ---------- the sword
const PS={
  ready:mvP({hy:-24,ft:FT(-4,-3,4,-3)}),
  wind:mvP({hy:-23.5,lean:-0.12,ft:FT(-6,-3,5,-3),sH:[2,-43],sb:-1.95,fH:[4,-18],nod:-0.05,bil:1.5}),
  strike:mvP({part:1,hy:-21.5,hx:1.5,lean:0.2,ft:FT(-8,-3,9,-3,0,-0.05),sH:[19,-21],sb:0.02,fH:[-6,-18],bil:3,flare:2,tip:1,vx:30}),
  follow:mvP({part:1,hy:-22,lean:0.26,ft:FT(-8,-3,9,-3),sH:[16,-6],sb:1.05,fH:[-5,-16],bil:2.5,tip:2}),
  recover:mvP({hy:-23.5,lean:0.1,ft:FT(-5,-3,5,-3),sH:[17,-11],sb:0.6})};
// ---------- the dodge roll
const PR={
  dive:mvA({hy:-15.5,hx:2,lean:0.75,ft:FT(-9,-3.5,5,-3,0.5,0),nod:0.35,sW:[12,-16],sbw:2.95,fW:[10,-10],bil:3,tip:3,vx:60}),
  rise:mvP({hy:-17,lean:0.4,ft:FT(-5,-3,5,-3),nod:0.15,sH:[15,-5],sb:0.85,fH:[3,-7],bil:3,vx:30}),
  recover:mvP({hy:-23,lean:0.12,ft:FT(-4,-3,4,-3),sH:[16.5,-11],sb:0.55})};
const mvBallP=a=>mvP({ball:a,vx:90,bil:2,tip:2});
// ---------- casting: heal and fireball (the free hand casts; the sword is lowered)
const PH2={
  raise:mvP({hy:-24.5,lean:-0.06,nod:-0.25,ft:FT(-4,-3,4,-3),sH:[13,-6],sb:1.2,fS:[2,-27],fbend:-1,fH:[19,-40],fl:[10.2,9.8],hand:1}),
  hold:mvP({hy:-25,lean:-0.04,nod:-0.2,ft:FT(-4,-3,4,-3),sH:[13,-6],sb:1.2,fS:[2,-27],fbend:-1,fH:[19,-42],fl:[10.2,9.8],hand:0.8}),
  lower:mvP({hy:-24,ft:FT(-4,-3,4,-3),sH:[15,-9],sb:0.8,fH:[3,-20],fl:[8.6,7],hand:0})};
const PF={
  back:mvP({hy:-23.5,lean:-0.12,ft:FT(-6,-3,5,-3),fH:[-17,-18],fl:[10.2,9.8],hand:1,sH:[14,-8],sb:1}),
  thrust:mvP({part:1,hy:-22.5,hx:1,lean:0.18,ft:FT(-7,-3,8,-3),fS:[2,-27],fH:[24,-27],fl:[10.2,9.8],hand:0.7,sH:[12,-6],sb:1.2,bil:2.5,tip:1.5}),
  hold:mvP({hy:-23,hx:0.5,lean:0.12,ft:FT(-7,-3,8,-3),fS:[2,-27],fH:[23,-25],fl:[10.2,9.8],hand:0.25,sH:[12,-6],sb:1.2,bil:2}),
  recover:mvP({hy:-24,lean:0.05,ft:FT(-4,-3,4,-3),fH:[4,-17],sH:[16,-11],sb:0.6})};
// ---------- hurt, and the life lost
const PU={
  hit:mvP({hy:-23.5,hx:-1,lean:-0.32,nod:-0.25,ft:FT(-7,-3,5,-6,0,-0.3),sH:[13,-20],sb:-0.2,fH:[-11,-27],fl:[9,8],bil:4,tip:-2,flare:3,vx:-40}),
  stagger:mvP({hy:-21.5,lean:-0.1,ft:FT(-6,-3,4,-3),sH:[15,-10],sb:0.7,fH:[-2,-14]}),
  recover:mvP({hy:-24,ft:FT(-4,-3,4,-3)})};
const PL={
  buckle:mvP({hy:-16.5,lean:0.3,nod:0.4,ft:FT(-5,-3,5,-3),sH:[12,-2],sb:1.35,fH:[2,-3]}),
  kneel:mvA({hy:-14,hx:-1,lean:0.38,nod:0.55,ft:FT(-13,-2.5,7,-3,1.3,0),sW:[14,-20],sbw:0.45,fW:[6,-12]})};
// ---------- sequences: [pose or function(step), steps]
function mvSeq(keys){let t=0;const ks=keys.map(k=>{const o={P:k[0],n:k[1],s0:t,tag:k[2]||""};t+=k[1];return o;});
  return{total:t,keys:ks,at(s){s=((s%t)+t)%t;for(const k of ks)if(s<k.s0+k.n){const st=Math.floor(s-k.s0),P=typeof k.P==="function"?k.P(st,Math.floor(s)):k.P;return{P,k,st,u:(s-k.s0)/k.n,s};}const k=ks[ks.length-1];return{P:typeof k.P==="function"?k.P(0,0):k.P,k,st:0,u:1,s};},
    start(tag){const k=ks.find(q=>q.tag===tag);return k?k.s0:0;}};}
// a path through points [step, x, y, ease]: ease on the way into that point: "in" falls (speeds up), "out" slows, else even
function mvPath(pts,s){if(s<=pts[0][0])return[pts[0][1],pts[0][2]];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];if(s<=b[0]){let u=(s-a[0])/((b[0]-a[0])||1);const e=b[3];
  const uy=e==="in"?u*u:e==="out"?1-(1-u)*(1-u):u;return[a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*uy];}}const z=pts[pts.length-1];return[z[1],z[2]];}
const STEP=5.5; // how far a walking step carries the wanderer (local units): a stride of 44 in eight steps

/* ======================================== mvscene.js ======================================== */
/* ============================== 4b round 2: effects, scenes and pose sheets ============================== */
const K132=1.32,rgbaS=(h,a)=>LP.rgba(h,a);
function mvRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
// ---------- effects (picture units)
function fxSlash(c,X,Y,f,k,P,a0,a1,al,col,lvl){ // the sword's sweep: a crescent round the shoulder, thickest where the blade is now
  if(al<=0)return;const G=mvGeo(P,0),sh=G.T(5,-27),B=mvBlade(P),r=Math.hypot(G.sHd[0]-5+G.u[0]*(B.len+1.9),G.sHd[1]+27+G.u[1]*(B.len+1.9))+1,n=22,w=7+((lvl&&lvl.r)||0)*1.2;
  c.save();c.translate(X,Y);c.scale(f*k,k);const pts=[],inn=[];
  for(let i=0;i<=n;i++){const u=i/n,a=a0+(a1-a0)*u,ww=w*Math.pow(u,1.4);pts.push([sh[0]+Math.cos(a)*r,sh[1]+Math.sin(a)*r]);inn.push([sh[0]+Math.cos(a)*(r-ww),sh[1]+Math.sin(a)*(r-ww)]);}
  c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));for(let i=inn.length-1;i>=0;i--)c.lineTo(inn[i][0],inn[i][1]);c.closePath();
  c.globalAlpha=al;c.fillStyle=col;c.fill();
  const sN=(lvl&&lvl.s)||0;if(sN){c.strokeStyle=MV_GOLD;c.lineWidth=0.8+sN*0.7;c.beginPath();pts.slice(Math.floor(n*0.25)).forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();}
  c.restore();}
function fxGlowAt(c,x,y,r,a,col){if(a<=0)return;c.save();c.globalCompositeOperation="screen";const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgbaS(col,a));g.addColorStop(0.4,rgbaS(col,a*0.55));g.addColorStop(1,rgbaS(col,0));c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function fxMote(c,x,y,r,a,col){if(a<=0)return;c.save();c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.moveTo(x,y-r*1.6);c.lineTo(x+r*0.6,y);c.lineTo(x,y+r*1.6);c.lineTo(x-r*0.6,y);c.closePath();c.fill();c.restore();}
function fxHand(c,X,Y,f,k,P,G){if(!P.hand||!G)return;const p=G.T(G.fHd[0],G.fHd[1]),x=X+f*p[0]*k,y=Y+p[1]*k;fxGlowAt(c,x,y,14*P.hand+4,0.85*P.hand,MV_GOLD);fxMote(c,x,y,1.6*P.hand,P.hand,MV_LAMP);}
function fxHeal(c,X,Y,k,u,tq){ // a pale gold glow rising round the wanderer, with motes lifting off (provisional: the spells are round 3)
  if(u<0||u>1)return;const env=Math.sin(Math.min(1,u*1.3)*Math.PI*0.5)*(u>0.7?(1-u)/0.3:1),cy=Y-44*k-u*14*k;
  c.save();c.globalCompositeOperation="screen";const g=c.createRadialGradient(X,cy,4,X,cy,62*k);g.addColorStop(0,rgbaS("#fff0c0",0.55*env));g.addColorStop(0.5,rgbaS(MV_GOLD,0.28*env));g.addColorStop(1,rgbaS(MV_GOLD,0));
  c.fillStyle=g;c.fillRect(X-70*k,cy-70*k,140*k,140*k);c.restore();
  const r=mvRng(77);for(let i=0;i<10;i++){const st=r()*0.4,lu=(u-st)/0.6;if(lu<0||lu>1)continue;const px=X+(r()-0.5)*44*k,py=Y-(4+lu*(70+r()*30))*k;fxMote(c,px+Math.sin(tq*6+i)*2*k,py,(1.1+r()*0.8)*k,Math.sin(lu*Math.PI),i%3?MV_LAMP:"#fff6dc");}}
function fxFireball(c,x,y,f,k,tq,a){ // the fireball: a bright core with a flickering tail and its glow (provisional, and in the lantern's gold: see the note)
  const fl=[0,1.5,-1,0.8][Math.floor(tq*16)%4];fxGlowAt(c,x,y,26*k,0.75*a,MV_GOLD);
  c.save();c.globalAlpha=a;c.translate(x,y);c.scale(f*k,k);c.fillStyle=MV_GOLD;c.beginPath();c.moveTo(6,0);c.quadraticCurveTo(5,-6,0,-5.5);c.quadraticCurveTo(-8,-5+fl,-17,-1+fl*0.6);c.quadraticCurveTo(-8,2,-9,6+fl*0.5);c.quadraticCurveTo(-2,6,0,5.5);c.quadraticCurveTo(5,6,6,0);c.fill();
  c.fillStyle=MV_LAMP;c.beginPath();c.ellipse(1.2,0,4.2,3.3,0,0,Math.PI*2);c.fill();c.fillStyle="#fff8e6";c.beginPath();c.ellipse(2,0,2,1.6,0,0,Math.PI*2);c.fill();c.restore();
  for(let i=1;i<=3;i++)fxMote(c,x-f*(14+i*7+fl*2)*k,y+((i*37+Math.floor(tq*16))%5-2)*k,(1.3-i*0.25)*k,a*(1-i*0.25),MV_LAMP);}
function fxBurst(c,x,y,k,u,col,core){if(u<0||u>1)return;fxGlowAt(c,x,y,(18+u*20)*k,0.8*(1-u),col);const r=mvRng(5);
  for(let i=0;i<9;i++){const a=r()*Math.PI*2,d=(6+u*(20+r()*14))*k;fxMote(c,x+Math.cos(a)*d,y+Math.sin(a)*d+u*u*8*k,(1.4-u)*k,1-u,core||MV_LAMP);}}
function fxEmber(c,x,y,f,k,u){ // hurt: a hot ember glow where the blow lands and a spray of ember streaks thrown off it (one burst, nothing repeats)
  if(u<0||u>1)return;fxGlowAt(c,x,y,(16+u*12)*k,0.9*(1-u)*(1-u),"#ff5a1f");fxGlowAt(c,x,y,(7+u*4)*k,0.8*(1-u)*(1-u)*(1-u),"#ffc27a");
  const r=mvRng(31);for(let i=0;i<18;i++){const a=(r()-0.5)*Math.PI*1.8-0.55,sp=24+r()*30,d=(2+u*sp)*k,dx=f*Math.cos(a),dy=Math.sin(a)+u*0.9,dl=Math.hypot(dx,dy)||1,
    px=x+f*Math.cos(a)*d,py=y+Math.sin(a)*d+u*u*16*k,L=(3+(1-u)*6+r()*2)*k,tx=dx/dl,ty=dy/dl,w=(1.9+r()*0.6-u*0.8)*k;
    c.save();c.globalAlpha=Math.min(1,(1-u)*1.5);c.lineCap="round";c.strokeStyle="#ff7a3a";c.shadowColor="#ff5a1f";c.shadowBlur=7;c.lineWidth=w;
    c.beginPath();c.moveTo(px,py);c.lineTo(px-tx*L,py-ty*L);c.stroke();c.shadowBlur=0;c.strokeStyle="#ffd9a0";c.lineWidth=w*0.45;
    c.beginPath();c.moveTo(px,py);c.lineTo(px-tx*L*0.45,py-ty*L*0.45);c.stroke();c.restore();}}
function fxShards(c,x,y,f,k,u,edge){ // armour takes the hit: a few card shards fall away
  if(u<0||u>1)return;const r=mvRng(12);for(let i=0;i<5;i++){const vx=(r()-0.3)*26,px=x+f*vx*u*k,py=y+(-4+r()*20)*k+u*u*44*k,rot=(r()-0.5)*7*u,sz=(2.5+r()*2)*k;
  c.save();c.globalAlpha=u<0.6?1:(1-u)/0.4;c.translate(px,py);c.rotate(rot);c.fillStyle=edge;c.beginPath();c.moveTo(-sz+0.9,-sz*0.6-0.9);c.lineTo(sz+0.9,-sz*0.2-0.9);c.lineTo(0.9,sz-0.9);c.closePath();c.fill();
  c.fillStyle=MV_INK;c.beginPath();c.moveTo(-sz,-sz*0.6);c.lineTo(sz,-sz*0.2);c.lineTo(0,sz);c.closePath();c.fill();c.restore();}}
// ---------- the life lost: the kneeling figure cut into card pieces, each lit along its edges in gold
function mvPieces(s,P,edge){const k=K132,W=Math.ceil(110*k*s),H=Math.ceil(110*k*s),ox=50*k,oy=96*k;
  const fig=LP.mk(W,H),fc=fig.getContext("2d");fc.setTransform(s,0,0,s,0,0);
  fc.save();fc.translate(ox+1.3,oy-1.3);fc.scale(k,k);fc.fillStyle=fc.strokeStyle=MV_GOLD;mvSil(fc,P,0);fc.restore();
  fc.save();fc.translate(ox,oy);fc.scale(k,k);fc.fillStyle=fc.strokeStyle=MV_INK;const G=mvSil(fc,P,0);mvDet(fc,P,0,G);fc.restore();
  const r=mvRng(404),cols=4,rows=5,gx=[],x0=-26,x1=48,y0=-74,y1=2,pts=[];
  for(let j=0;j<=rows;j++){pts.push([]);for(let i=0;i<=cols;i++){const jx=(i>0&&i<cols)?(r()-0.5)*9:0,jy=(j>0&&j<rows)?(r()-0.5)*7:0;pts[j].push([x0+(x1-x0)*i/cols+jx,y0+(y1-y0)*j/rows+jy]);}}
  const out=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const q=[pts[j][i],pts[j][i+1],pts[j+1][i+1],pts[j+1][i]];const tri=r()<0.5?[[q[0],q[1],q[2]],[q[0],q[2],q[3]]]:[[q[0],q[1],q[3]],[q[1],q[2],q[3]]];
    for(const poly of tri){const pc=LP.mk(W,H),pcx=pc.getContext("2d");pcx.setTransform(s,0,0,s,0,0);pcx.save();pcx.beginPath();poly.forEach((p,i)=>{const X=ox+p[0]*k,Y=oy+p[1]*k;i?pcx.lineTo(X,Y):pcx.moveTo(X,Y);});pcx.closePath();pcx.clip();
      pcx.setTransform(1,0,0,1,0,0);pcx.drawImage(fig,0,0);pcx.setTransform(s,0,0,s,0,0);pcx.restore();
      pcx.globalCompositeOperation="source-atop";pcx.strokeStyle=MV_GOLD;pcx.lineWidth=1.6;pcx.beginPath();poly.forEach((p,i)=>{const X=ox+p[0]*k,Y=oy+p[1]*k;i?pcx.lineTo(X,Y):pcx.moveTo(X,Y);});pcx.closePath();pcx.stroke();
      const cx=(poly[0][0]+poly[1][0]+poly[2][0])/3,cy=(poly[0][1]+poly[1][1]+poly[2][1])/3;
      out.push({cv:pc,cx:cx*k,cy:cy*k,vx:(cx-8)/30+(r()-0.5)*0.8,vy:-0.6-r()*1.1,spin:(r()-0.5)*6});}}
  return{fig,out,ox,oy,W,H,s};}
function mvShatter(c,K,X,Y,f,u,edge){ // u 0..1 over the second the pieces tumble
  const s=c.getTransform().a;if(!K.pc||K.pcS!==s){K.pc=mvPieces(s,PL.kneel,edge);K.pcS=s;}const S=K.pc;
  for(const p of S.out){const al=u<0.45?1:Math.max(0,1-(u-0.45)/0.55),tx=p.vx*u*46,ty=p.vy*u*34+u*u*80;if(al<=0)continue;
    c.save();c.globalAlpha=al;c.translate(X+f*(p.cx+tx),Y+p.cy+ty);c.rotate(p.spin*u*f);c.scale(f,1);c.translate(-p.cx,-p.cy);c.drawImage(p.cv,-S.ox,-S.oy,S.W/S.s,S.H/S.s);c.restore();}}
// ---------- scene pieces
function scGround(c,lv,SW,H,G){pSky(c,lv,SW,H,G);}
function scLedge(c,lv,x0,x1,y,G,wall){ // a stand-in rooftop ledge: boards on brackets out from a wall at the right (ledges get their own round)
  const ink=LB.pal.INK,e=LB.places[lv].edge;c.fillStyle=ink;if(wall)c.fillRect(x1,y-70,wall,G-y+70);
  c.fillStyle=e;c.fillRect(x0,y-1.4,x1-x0,1.4);c.fillStyle=ink;c.fillRect(x0,y,x1-x0,7);
  for(let i=0;i<(x1-x0)/18;i++){c.fillRect(x0+i*18+2,y+7,1.5,2.5);}
  c.beginPath();c.moveTo(x1,y+7);c.lineTo(x1-38,y+7);c.lineTo(x1,y+44);c.closePath();c.fill();
  c.fillStyle="rgba(0,0,0,0)";}
function scLabel(c,txt,x,y,al){c.save();c.globalAlpha=al==null?1:al;c.textAlign="center";c.textBaseline="top";c.font='13px "Alegreya Sans",sans-serif';c.fillStyle="#f1d79a";c.fillText(txt,x,y);c.restore();}
function scFade(c,SW,H,a){if(a<=0)return;c.fillStyle="rgba(6,5,8,"+Math.min(1,a)+")";c.fillRect(0,0,SW,H);}
const FX_BASE=st=>Math.floor(st);

/* ======================================== mvloops.js ======================================== */
/* ============================== 4b round 2: the loops on the page ============================== */
const IDLE=(st,g)=>mvIdle(g),WALK=(st)=>mvWalk(st);
function scSet(cv,H){const c=cv.getContext("2d"),s=cv.height/H,SW=cv.width/s;c.setTransform(s,0,0,s,0,0);return{c,s,SW};}
function tipAng(P){const G=mvGeo(P,0),B=mvBlade(P),h=G.sHd,sh=G.T(5,-27),tp=G.T(h[0]+G.u[0]*(B.len+1.9),h[1]+G.u[1]*(B.len+1.9));return Math.atan2(tp[1]-sh[1],tp[0]-sh[0]);}
function withLvl(P,l){const Q=Object.assign({},P);Q.lvl=l;return Q;}
// --- walking and standing
const SQ_WALK=mvSeq([[IDLE,4],[WALK,16,"w1"],[IDLE,3,"i2"],[WALK,16,"w2"],[IDLE,3,"i3"]]);
function loopWalk(cv,t,lv,R,K){const H=230,G=212,{c,s,SW}=scSet(cv,H),st=t*R,q=SQ_WALK.at(st),S=q.s,tq=Math.floor(st)/R;scGround(c,lv,SW,H,G);
  const x=mvPath([[0,0,0],[4,0,0],[20,88,0],[23,88,0],[39,0,0]],S)[0],f=(S>=23&&S<39)?-1:1,X=SW*0.5-44*K132;
  mvDraw(c,X+x*K132,G+1,q.P,tq,f,LB.places[lv].edge);}
// --- the jump, back and forth over a crawler
const SQ_JUMP1=[[IDLE,3],[PJ.crouch,1],[PJ.launch,1],[PJ.rise,2],[PJ.apex,1],[PJ.fall,2],[PJ.land,1],[PJ.recover,1],[IDLE,3]];
const SQ_JUMP=mvSeq(SQ_JUMP1.concat(SQ_JUMP1));
function jumpRoot(S){const h=S>=15,u=S-(h?15:0),x0=h?44:0,x1=h?0:44;if(u<4)return[x0,0];if(u<10){const v=(u-4)/6;return[x0+(x1-x0)*v,-58*4*v*(1-v)];}return[x1,0];}
function loopJump(cv,t,lv,R,K){const H=250,G=230,{c,s,SW}=scSet(cv,H),st=t*R,q=SQ_JUMP.at(st),S=q.s,tq=Math.floor(st)/R;scGround(c,lv,SW,H,G);
  const X=SW*0.5-22*K132,r=jumpRoot(S),f=S>=15?-1:1,o=LB.options(lv,{walking:false});
  pMonster(c,s,K,"crawler",X+22*K132+(S>=15?-6:6),G+1,tq,o);c.setTransform(s,0,0,s,0,0);
  mvDraw(c,X+r[0]*K132,G+1+r[1]*K132,q.P,tq,f,LB.places[lv].edge,K132,{feet:r[1]>-4});}
// --- climbing onto a ledge, walking along it, dropping down through it and walking back underneath
const SQ_CLIMB=mvSeq([[IDLE,2],[PC.look,1,"look"],[PC.grab,1],[PC.pull,2],[PC.knee,1],[PC.rise,1],[PC.stand,1],[WALK,8],[PD.crouch,1],[PD.drop,1],[PD.fall,2],[PD.land,1],[PD.recover,1],[IDLE,1],[WALK,12,"back"],[IDLE,3,"end"]]);
const CLIMB_PATH=[[0,-10,0],[3,-10,0],[3.5,-12,-30,"out"],[4,-12,-30],[5.5,-11,-56,"out"],[6,-11,-56],[6.5,-6,-70,"out"],[7,-6,-70],[7.5,6,-96,"out"],[8,6,-96],[9,8,-96],[17,52,-96],[18,52,-96],[21,56,0,"in"],[24,56,0],[36,-10,0],[39,-10,0]];
function loopClimb(cv,t,lv,R,K){const H=300,G=282,{c,s,SW}=scSet(cv,H),st=t*R,q=SQ_CLIMB.at(st),S=q.s,tq=Math.floor(st)/R;scGround(c,lv,SW,H,G);
  const E=SW*0.34,LY=G-LEDGE*K132;scLedge(c,lv,E,SW*0.82,LY,G,SW*0.18+2);
  const r=mvPath(CLIMB_PATH,S),f=(S>=24&&S<36)||(S>=36&&S<37)?-1:1;
  mvDraw(c,E+r[0]*K132,G+1+r[1]*K132,q.P,tq,f,LB.places[lv].edge,K132,{feet:r[1]===0||r[1]===-96});}
// --- the sword: a swing at a ghoul, the sword's look changing each swing
const LVLS=[{r:0,s:0,n:"the sword as found"},{r:1,s:0,n:"longer reach, 1"},{r:2,s:0,n:"longer reach, 2"},{r:0,s:1,n:"stronger hits, 1"},{r:0,s:2,n:"stronger hits, 2"},{r:2,s:2,n:"both, 2 each"}];
const SQ_SW1=[[PS.ready,2],[PS.wind,1],[PS.strike,1,"strike"],[PS.follow,1,"follow"],[PS.recover,1],[PS.ready,3]];
const SQ_SWORD=mvSeq(SQ_SW1);
function swordAt(st,lvl){const q=SQ_SWORD.at(st),P=withLvl(q.P,lvl);let arc=null;
  if(q.k.tag==="strike")arc=[tipAng(withLvl(PS.wind,lvl)),tipAng(P),0.85];else if(q.k.tag==="follow")arc=[tipAng(withLvl(PS.strike,lvl))-0.5,tipAng(P),0.4];return{P,arc,hit:q.k.tag==="strike"||q.k.tag==="follow"};}
function loopSword(cv,t,lv,R,K,fixed){const H=230,G=212,{c,s,SW}=scSet(cv,H),st=t*R,tq=Math.floor(st)/R,o=LB.options(lv,{walking:false});scGround(c,lv,SW,H,G);
  const n=Math.floor(st/SQ_SWORD.total)%LVLS.length,L=fixed||LVLS[n],a=swordAt(st,L),X=SW*0.36,e=LB.places[lv].edge;
  pMonster(c,s,K,"ghoul2",X+102+(a.hit?5:0),G+2,tq,o);c.setTransform(s,0,0,s,0,0);
  mvDraw(c,X,G+1,a.P,tq,1,e);if(a.arc)fxSlash(c,X,G+1,1,K132,a.P,a.arc[0],a.arc[1],a.arc[2],e,L);
  if(!fixed)scLabel(c,"sword: "+L.n,SW*0.5,10);}
// --- the dodge roll, there and back
const SQ_ROLL1=[[IDLE,3],[PR.dive,1],[st=>mvBallP([0,1.95,3.9][st]),3,"ball"],[PR.rise,1],[PR.recover,1],[IDLE,3]];
const SQ_ROLL=mvSeq(SQ_ROLL1.concat(SQ_ROLL1));
function rollRoot(S){const h=S>=12,u=S-(h?12:0),x=mvPath([[0,0,0],[3,0,0],[4,6,0],[7,54,0],[8,60,0],[9,62,0]],u)[0];return h?62-x:x;}
function loopDodge(cv,t,lv,R,K){ /* version 8: was loopRoll (mvroll.js has the course's loopRoll) */const H=200,G=182,{c,s,SW}=scSet(cv,H),st=t*R,q=SQ_ROLL.at(st),S=q.s,tq=Math.floor(st)/R;scGround(c,lv,SW,H,G);
  const X=SW*0.5-31*K132;mvDraw(c,X+rollRoot(S)*K132,G+1,q.P,tq,S>=12?-1:1,LB.places[lv].edge);}
// --- casting: heal, then a fireball at a ghoul
const SQ_CAST=mvSeq([[IDLE,3],[PH2.raise,1,"heal"],[PH2.hold,2],[PH2.lower,1],[IDLE,3],[PF.back,1,"fire"],[PF.thrust,1,"thrust"],[PF.hold,1],[PF.recover,1],[IDLE,5]]);
function loopCast(cv,t,lv,R,K,opt){opt=opt||{};const H=opt.H||230,G=opt.G||212,{c,s,SW}=opt.c?opt:scSet(cv,H),st=t*R,q=SQ_CAST.at(st),S=q.s,tq=Math.floor(st)/R,o=LB.options(lv,{walking:false});
  if(!opt.c)scGround(c,lv,SW,H,G);const X=opt.X||SW*0.22,GX=opt.GX||SW*0.8,e=LB.places[lv].edge;
  const sF=SQ_CAST.start("thrust"),fy=G-40,hx=X+30*K132,dist=GX-26-hx,dur=dist/380*R,fu=(S-sF)/dur,bu=(S-sF-dur)/(0.35*R);
  const jolt=bu>=0&&bu<1?5:0;if(!opt.noGhoul){pMonster(c,s,K,"ghoul2",GX+jolt,G+2,tq,o);c.setTransform(s,0,0,s,0,0);}
  if(opt.heal!==false)fxHeal(c,X,G+1,K132,(S-SQ_CAST.start("heal"))/4,tq);
  const Gm=mvDraw(c,X,G+1,q.P,tq,1,e);fxHand(c,X,G+1,1,K132,q.P,Gm);
  if(fu>=0&&fu<1)fxFireball(c,hx+dist*fu,fy+2,1,K132,tq,1);if(bu>=0&&bu<1)fxBurst(c,GX-26,fy,K132,bu,MV_GOLD);}
// --- hurt: armour takes the first hit, health the second; each followed by the second of safety
function hurtSeq(R){const a=Math.round(R*1.4),b=Math.round(R*1.6);return mvSeq([[IDLE,4],[PU.hit,1,"A"],[PU.stagger,1],[PU.recover,1],[IDLE,a],[PU.hit,1,"B"],[PU.stagger,1],[PU.recover,1],[IDLE,b],[WALK,3,"walk"],[IDLE,2]]);}
function loopHurt(cv,t,lv,R,K){const H=230,G=212,{c,s,SW}=scSet(cv,H);if(!K.hs||K.hR!==R){K.hs=hurtSeq(R);K.hR=R;}const Q=K.hs,st=t*R,q=Q.at(st),S=q.s,tq=Math.floor(st)/R,o=LB.options(lv,{walking:false});
  scGround(c,lv,SW,H,G);const sA=Q.start("A"),sB=Q.start("B"),sW=Q.start("walk"),X=SW*0.4,e=LB.places[lv].edge;
  const x=mvPath([[0,0,0],[sA,0,0],[sA+1,-8,0,"out"],[sB,-8,0],[sB+1,-16,0,"out"],[sW,-16,0],[sW+3,0,0]],S)[0];
  pMonster(c,s,K,"ghoul2",X+86,G+2,tq,o);c.setTransform(s,0,0,s,0,0);
  const tA=(S-sA)/R,tB=(S-sB)/R,tau=tB>=0?tB:tA,eA=tau>=0&&tau<1?0.2+0.8*(0.5+0.5*Math.cos(Math.PI*2*1.5*tau)):1;
  const Xw=X+x*K132,Gm=mvDraw(c,Xw,G+1,q.P,tq,1,e,K132,{edgeA:eA});const ch=mvPt(Gm,q.P,Xw,G+1,1,K132,12,-21);
  if(tB<0)fxShards(c,ch[0],ch[1],1,K132,tA/0.5,e);else fxEmber(c,ch[0],ch[1],1,K132,tB/0.45);
  scLabel(c,tB>=0?"health takes the hit: ember sparks, then the second of safety":"armour takes the hit: card shards fall, then the second of safety",SW*0.5,10,tau>=0&&tau<1.6?1:0.55);}
// --- the life lost
const SQ_LIFE=mvSeq([[IDLE,4],[PU.hit,1,"hit"],[PL.buckle,1],[PL.kneel,2]]);
function loopLife(cv,t,lv,R,K){const H=230,G=212,{c,s,SW}=scSet(cv,H),T1=SQ_LIFE.total/R,T=T1+2.75,tt=t%T,e=LB.places[lv].edge,X=SW*0.52;scGround(c,lv,SW,H,G);
  if(tt<T1){const st=tt*R,q=SQ_LIFE.at(st),S=q.s,tq=Math.floor(st)/R,sH=SQ_LIFE.start("hit"),x=mvPath([[0,0,0],[sH,0,0],[sH+1,-6,0,"out"]],S)[0];
    const Gm=mvDraw(c,X+x*K132,G+1,q.P,tq,1,e);const ch=mvPt(Gm,q.P,X+x*K132,G+1,1,K132,12,-21);fxEmber(c,ch[0],ch[1],1,K132,(S-sH)/R/0.45);return;}
  const u=tt-T1;if(u<1.1){mvShatter(c,K,X-6*K132,G+1,1,u/1.1,e);scFade(c,SW,H,(u-0.75)/0.35);return;}
  const v=u-1.1;if(v<0.35){scFade(c,SW,H,1);return;}
  mvDraw(c,SW*0.22,G+1,mvIdle(Math.floor(v*R)),Math.floor(v*R)/R,1,e,K132,{edgeA:1});scFade(c,SW,H,1-(v-0.35)/0.35);
  scLabel(c,"back at the last checkpoint",SW*0.22,10,Math.min(1,(v-0.35)/0.3));}
// --- at play size, beside a ghoul
function loopPlay(cv,t,lv,R,K){const {c,s,SW}=scSet(cv,PH),st=t*R,tq=Math.floor(st)/R,e=LB.places[lv].edge,o=LB.options(lv,{walking:false});pSky(c,lv,SW,PH,PG);
  if(!K.J)K.J={};if(!K.C)K.C={};
  // the jump
  {const q=SQ_JUMP.at(st),r=jumpRoot(q.s);mvDraw(c,SW*0.05+r[0]*K132,PG+1+r[1]*K132,q.P,tq,q.s>=15?-1:1,e,K132,{feet:r[1]>-4});}
  // the sword
  {const a=swordAt(st,LVLS[0]),X=SW*0.25;mvDraw(c,X,PG+1,a.P,tq,1,e);if(a.arc)fxSlash(c,X,PG+1,1,K132,a.P,a.arc[0],a.arc[1],a.arc[2],e,LVLS[0]);}
  // the roll
  {const q=SQ_ROLL.at(st);mvDraw(c,SW*0.47+rollRoot(q.s)*K132,PG+1,q.P,tq,q.s>=12?-1:1,e);}
  // casting at the ghoul
  loopCast(cv,t,lv,R,K.C,{c,s,SW,H:PH,G:PG,X:SW*0.75,GX:SW*0.94});
  c.setTransform(s,0,0,s,0,0);c.textAlign="center";c.textBaseline="top";c.font='12px "Alegreya Sans",sans-serif';c.fillStyle="#c9a25a";
  c.fillText("jump",SW*0.05+29,PG+10);c.fillText("sword",SW*0.25,PG+10);c.fillText("roll",SW*0.47+41,PG+10);c.fillText("cast",SW*0.75,PG+10);c.fillText("ghoul",SW*0.94,PG+10);}
// ---------- the pose sheets
function sheetBg(c,lv,x,w,h,G){const k=LB.pal.SKY[lv],g=c.createLinearGradient(0,0,0,G);g.addColorStop(0,k[1]);g.addColorStop(0.7,k[2]);g.addColorStop(1,k[3]);c.fillStyle=g;c.fillRect(x,0,w,h);c.fillStyle=LB.pal.INK;c.fillRect(x,G,w,h-G);}
const SHEETS={
  walk:{cw:92,ch:140,cells:[0,1,2,3,4,5,6,7].map(i=>({P:mvWalk(i)}))},
  jump:{cw:92,ch:170,cells:[{P:PJ.crouch},{P:PJ.launch,y:6},{P:PJ.rise,y:22},{P:PJ.apex,y:30},{P:PJ.fall,y:16},{P:PJ.land},{P:PJ.recover}]},
  climb:{cw:126,ch:270,ledge:"climb",cells:[{P:PC.look,x:-10},{P:PC.grab,x:-12,y:30},{P:PC.pull,x:-11,y:56},{P:PC.knee,x:-6,y:70},{P:PC.rise,x:6,y:96},{P:PC.stand,x:8,y:96}]},
  drop:{cw:96,ch:270,ledge:"drop",cells:[{P:PD.crouch,y:96},{P:PD.drop,x:1,y:82},{P:PD.fall,x:3,y:40},{P:PD.land,x:4},{P:PD.recover,x:4}]},
  sword:{cw:116,ch:196,ax:0.28,cells:[{P:PS.ready},{P:PS.wind},{P:PS.strike,arc:[tipAng(PS.wind),tipAng(PS.strike),0.85]},{P:PS.follow,arc:[tipAng(PS.strike)-0.5,tipAng(PS.follow),0.4]},{P:PS.recover}]},
  ladder:{cw:136,ch:200,ax:0.24,cells:LVLS.map(L=>({P:withLvl(PS.strike,L),lvl:L,arc:[tipAng(withLvl(PS.wind,L)),tipAng(withLvl(PS.strike,L)),0.85]}))},
  roll:{cw:84,ch:140,cells:[{P:PR.dive},{P:mvBallP(0)},{P:mvBallP(1.95)},{P:mvBallP(3.9)},{P:PR.rise}]},
  cast:{cw:92,ch:150,cells:[{P:PH2.raise,heal:0.45},{P:PH2.hold,heal:0.7},{P:PF.back},{P:PF.thrust,fire:true},{P:PF.hold}]},
  hurt:{cw:100,ch:140,ax:0.46,cells:[{P:PU.hit,ember:0.3},{P:PU.stagger,pulse:0.33},{P:PU.recover,pulse:0.62}]},
  life:{cw:104,ch:140,ax:0.42,cells:[{P:PU.hit,ember:0.2},{P:PL.buckle},{P:PL.kneel},{P:PL.kneel,shatter:0.3}]}};
function sheetLayout(cv,spec){const n=spec.cells.length,rows=((cv.parentElement&&cv.parentElement.clientWidth)||cv.clientWidth||900)<620&&n>3?2:1,cols=Math.ceil(n/rows);return{rows,cols,aspect:(cols*spec.cw)/(rows*spec.ch)};}
function drawSheet(cv,lv,spec){lv=spec.lv||lv;const L=sheetLayout(cv,spec),c=cv.getContext("2d"),s=Math.min(cv.width/(L.cols*spec.cw),cv.height/(L.rows*spec.ch)),e=LB.places[lv].edge;
  c.setTransform(1,0,0,1,0,0);c.fillStyle="#0e090b";c.fillRect(0,0,cv.width,cv.height);
  spec.cells.forEach((cl,i)=>{const col=i%L.cols,row=Math.floor(i/L.cols),G=spec.ch-16;c.setTransform(s,0,0,s,col*spec.cw*s,row*spec.ch*s);
    c.save();c.beginPath();c.rect(1,1,spec.cw-2,spec.ch-2);c.clip();sheetBg(c,lv,0,spec.cw,spec.ch,G);
    if(cl.draw){cl.draw(c,spec.cw,spec.ch,G,lv);c.restore();c.font='600 12px "Alegreya Sans",sans-serif';c.textBaseline="top";c.textAlign="left";c.fillStyle="#c9a25a";c.fillText(String(i+1),6,G+2);return;}
    let X=spec.cw*(spec.ax||0.36);
    if(spec.ledge==="climb"){X=spec.cw*0.4;scLedge(c,lv,X,spec.cw+60,G-LEDGE*K132,G,0);}
    else if(spec.ledge==="drop"){scLedge(c,lv,-10,spec.cw+60,G-LEDGE*K132,G,0);X=spec.cw*0.36;}
    const px=X+(cl.x||0)*K132,py=G+1-(cl.y||0)*K132;
    if(cl.shatter!=null){spec._K=spec._K||{};mvShatter(c,spec._K,px,py,1,cl.shatter,e);c.restore();c.font='600 12px "Alegreya Sans",sans-serif';c.textBaseline="top";c.textAlign="left";c.fillStyle="#c9a25a";c.fillText(String(i+1),6,G+2);return;}
    if(cl.heal)fxHeal(c,px,py,K132,cl.heal,0);
    const Gm=mvDraw(c,px,py,cl.P,0,1,e,K132,{edgeA:cl.pulse!=null?0.2+0.8*(0.5+0.5*Math.cos(Math.PI*2*1.5*cl.pulse)):1,feet:!cl.y});
    fxHand(c,px,py,1,K132,cl.P,Gm);if(cl.arc)fxSlash(c,px,py,1,K132,cl.P,cl.arc[0],cl.arc[1],cl.arc[2],e,cl.lvl);
    if(cl.fire){const hp=mvPt(Gm,cl.P,px,py,1,K132,Gm.fHd[0],Gm.fHd[1]);fxFireball(c,hp[0]+16,hp[1]+1,1,K132*0.9,0,1);}
    if(cl.ember){const ch=mvPt(Gm,cl.P,px,py,1,K132,12,-21);fxEmber(c,ch[0],ch[1],1,K132,cl.ember);}
    c.restore();c.font='600 12px "Alegreya Sans",sans-serif';c.textBaseline="top";c.textAlign="left";c.fillStyle="#c9a25a";c.fillText(String(i+1),6,G+2);});}

/* ======================================== mvspells.js ======================================== */
/* ============================== 4b round 3: the spells ==============================
   Heal and fireball, both in the lantern's gold (decided in round 2), and how each grows stronger with each scroll.
   The rule for growth works for any number of levels; how many there are stays Claude Code's starting figure. */
const SP_PALE="#fff0c0";
// ---------- heal
function healEnv(u){return u<0||u>1?0:Math.min(1,u/0.18)*(u>0.68?(1-u)/0.32:1);}
function fxRingHalf(c,X,Y,k,ru,front,lvl){if(ru<=0||ru>=1)return;const cy=Y-(4+ru*90)*k,a=Math.sin(ru*Math.PI)*0.95,rx=(24+lvl*1.5)*k,ry=5.5*k;
  c.save();c.globalCompositeOperation="screen";c.strokeStyle=rgbaS(MV_LAMP,a);c.lineWidth=(1.6+lvl*0.25)*k;c.shadowColor=MV_GOLD;c.shadowBlur=6;c.beginPath();
  c.ellipse(X,cy,rx,ry,0,front?0:Math.PI,front?Math.PI:Math.PI*2);c.stroke();c.restore();}
function healRings(c,X,Y,k,u,lvl,front){for(let j=0;j<lvl-1;j++)fxRingHalf(c,X,Y,k,(u-0.08-j*0.16)/0.62,front,lvl);}
function healMotes(c,X,Y,k,u,lvl,tq){const r=mvRng(77+lvl),n=4+lvl*4;for(let i=0;i<n;i++){const st=r()*0.45,lu=(u-st)/0.55;const px0=(r()-0.5)*(40+lvl*6)*k,h=70+r()*34+lvl*6;
  if(lu<0||lu>1)continue;fxMote(c,X+px0+Math.sin(tq*6+i)*2*k,Y-(4+lu*h)*k,(1.1+r()*0.7+lvl*0.12)*k,Math.sin(lu*Math.PI),i%3?MV_LAMP:"#fff6dc");}}
function healGlow(c,X,Y,k,u,lvl,col){const e=healEnv(u);if(e<=0)return;const cy=Y-44*k-u*12*k;c.save();c.globalCompositeOperation="screen";
  const g=c.createRadialGradient(X,cy,4,X,cy,(54+lvl*8)*k);g.addColorStop(0,rgbaS(col||SP_PALE,(0.34+0.1*lvl)*e));g.addColorStop(0.5,rgbaS(MV_GOLD,(0.16+0.06*lvl)*e));g.addColorStop(1,rgbaS(MV_GOLD,0));
  c.fillStyle=g;c.fillRect(X-90*k,cy-90*k,180*k,180*k);c.restore();}
// draw a healing wanderer: A = a glow rising round it with motes; B = the lantern's light runs up its outline in gold, with motes
function drawHealer(c,X,Y,P,tq,f,edge,u,lvl,kind,o){o=o||{};const k=K132;
  if(u>=0&&u<=1){healRings(c,X,Y,k,u,lvl,false);if(kind==="A")healGlow(c,X,Y,k,u,lvl);else healGlow(c,X,Y,k,u,lvl*0.6);}
  const aura=kind==="B"&&u>=0&&u<=1?{col:MV_LAMP,h:Math.min(1,u/0.42)*1.05,a:healEnv(u)*1.1,w:1.5+0.5*(lvl-1)}:null;
  const G=mvDraw(c,X,Y,P,tq,f,edge,k,Object.assign({aura},o));fxHand(c,X,Y,f,k,P,G);
  if(u>=0&&u<=1){healRings(c,X,Y,k,u,lvl,true);healMotes(c,X,Y,k,u,lvl,tq);}return G;}
// ---------- fireball
function fxFire(c,x,y,f,k,tq,a,lvl){const sc=1+0.3*(lvl-1),fl=[0,1.5,-1,0.8][Math.floor(tq*12)%4];fxGlowAt(c,x,y,(20+lvl*3)*k*sc,Math.min(1,0.62+0.08*lvl)*a,MV_GOLD);
  c.save();c.globalAlpha=a;c.translate(x,y);c.scale(f*k*sc,k*sc);c.fillStyle=MV_GOLD;const tl=17+lvl*4;
  c.beginPath();c.moveTo(6,0);c.quadraticCurveTo(5,-6,0,-5.5);c.quadraticCurveTo(-8,-5+fl,-tl,-1+fl*0.6);c.quadraticCurveTo(-8,2,-9-lvl,6+fl*0.5);c.quadraticCurveTo(-2,6,0,5.5);c.quadraticCurveTo(5,6,6,0);c.fill();
  if(lvl>=2){c.beginPath();c.moveTo(-2,-4);c.quadraticCurveTo(-9,-9-fl,-tl*0.75,-7+fl);c.quadraticCurveTo(-9,-4,-4,-2);c.fill();}
  if(lvl>=3){c.beginPath();c.moveTo(-2,4);c.quadraticCurveTo(-9,10+fl,-tl*0.7,8-fl);c.quadraticCurveTo(-9,5,-4,2);c.fill();}
  c.fillStyle=MV_LAMP;c.beginPath();c.ellipse(1.2,0,4.2,3.3,0,0,Math.PI*2);c.fill();c.fillStyle="#fff8e6";c.beginPath();c.ellipse(2,0,2,1.6,0,0,Math.PI*2);c.fill();c.restore();
  for(let i=1;i<=2+lvl;i++)fxMote(c,x-f*(14*sc+i*7+fl*2)*k,y+((i*37+Math.floor(tq*12))%5-2)*k*sc,(1.4-i*0.18)*k,a*(1-i/(3+lvl)),MV_LAMP);}
function fxBurstL(c,x,y,k,u,lvl){if(u<0||u>1)return;const sc=1+0.3*(lvl-1);fxGlowAt(c,x,y,(18+u*22)*k*sc,0.85*(1-u),MV_GOLD);fxGlowAt(c,x,y,(8+u*6)*k*sc,0.8*(1-u)*(1-u),"#fff6dc");
  for(let j=0;j<lvl;j++){const uj=(u-j*0.1)/(1-j*0.1);if(uj<0)continue;const r=mvRng(5+j*13),n=8+j*3;
    for(let i=0;i<n;i++){const a=(i+r()*0.6)/n*Math.PI*2,d=(5+uj*(18+j*12+r()*8))*k*sc;fxMote(c,x+Math.cos(a)*d,y+Math.sin(a)*d+uj*uj*7*k,(1.5-uj)*k*(1+j*0.15),1-uj,j%2?MV_GOLD:MV_LAMP);}}}
function fxFizzle(c,x,y,k,u){if(u<0||u>1)return; // not enough mana, over 0.6 s: the hand's light gutters, pops into falling sparks, and a cloud of smoke curls up
  if(u<0.3){const v=u/0.3;fxGlowAt(c,x,y,(18-v*12)*k,0.85*(1-v),MV_GOLD);fxMote(c,x,y,(3.4-v*3.2)*k,1,MV_LAMP);}
  const r=mvRng(9);for(let i=0;i<11;i++){const a=-0.2-r()*2.6,sp=14+r()*18,lu=(u-0.1)/0.75;if(lu<0||lu>1)continue;
    const px=x+Math.cos(a)*sp*lu*k,py=y+Math.sin(a)*sp*lu*k+lu*lu*44*k;fxMote(c,px,py,(2.1-lu*1.1)*k,1-lu*lu,i%2?MV_GOLD:MV_LAMP);}
  for(let i=0;i<4;i++){const lu=(u-0.1-i*0.07)/0.8;if(lu<0||lu>1)continue;const px=x+(2+(i%2)*6-i+lu*(6+i*3))*k,py=y-(3+lu*(30+i*7))*k,rr=(6+lu*(17+i*3))*k,al=Math.min(1,lu*4)*(1-lu);
    let g=c.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,rgbaS("#332d36",0.92*al));g.addColorStop(0.65,rgbaS("#332d36",0.6*al));g.addColorStop(1,rgbaS("#332d36",0));c.fillStyle=g;c.fillRect(px-rr,py-rr,rr*2,rr*2);
    g=c.createRadialGradient(px-rr*0.3,py-rr*0.35,0,px-rr*0.3,py-rr*0.35,rr*0.62);g.addColorStop(0,rgbaS("#b4a8b8",0.75*al));g.addColorStop(1,rgbaS("#b4a8b8",0));c.fillStyle=g;c.fillRect(px-rr,py-rr,rr*2,rr*2);}}
// ---------- loops
const SQ_HEAL=mvSeq([[IDLE,4],[PH2.raise,1,"go"],[PH2.hold,3],[PH2.lower,1],[IDLE,7]]);
function loopHeal(cv,t,lv,R,K,kind){const H=230,G=212,{c,s,SW}=scSet(cv,H),st=t*R,q=SQ_HEAL.at(st),S=q.s,tq=Math.floor(st)/R,e=LB.places[lv].edge;scGround(c,lv,SW,H,G);
  const u=(S-SQ_HEAL.start("go"))/R/0.6;[0.2,0.5,0.8].forEach((fx,i)=>{drawHealer(c,SW*fx,G+1,q.P,tq,1,e,u,i+1,kind);scLabel(c,"level "+(i+1),SW*fx,10,0.95);});}
// the fireball: three casts on the ground (levels 1 to 3) over a crawler into a ghoul, then a cast in mid-air at a flyer
const SQ_FIRE1=[[IDLE,3],[PF.back,1],[PF.thrust,1,"thr"],[PF.hold,1],[PF.recover,1],[IDLE,6]];
const PJC=Object.assign({},PJ.apex,{fS:[2,-27],fH:[24,-29],fl:[10.2,9.8],hand:0.8,fbend:1});
const PJB=Object.assign({},PJ.rise,{fS:[0,-27],fH:[-15,-20],fl:[10.2,9.8],hand:1});
const SQ_FIRE=mvSeq(SQ_FIRE1.concat(SQ_FIRE1,SQ_FIRE1,[[IDLE,2],[PJ.crouch,1,"jump"],[PJ.launch,1],[PJB,2],[PJC,2,"jthr"],[PJ.fall,2],[PJ.land,1],[PJ.recover,1],[IDLE,6]]));
function loopFire(cv,t,lv,R,K,opt){opt=opt||{};const H=opt.H||250,G=opt.G||230,{c,s,SW}=opt.c?opt:scSet(cv,H),st=t*R,q=SQ_FIRE.at(st),S=q.s,tq=Math.floor(st)/R,e=LB.places[lv].edge,o=LB.options(lv,{walking:false});
  if(!opt.c)scGround(c,lv,SW,H,G);const X=opt.X||SW*0.16,GX=opt.GX||SW*0.84,CX=opt.CX||SW*0.5,BX=opt.BX||SW*0.66,BY=G-150;
  // which cast is this?
  const sJ=SQ_FIRE.start("jump"),blk=S<sJ?Math.floor(S/SQ_FIRE1.reduce((a,b)=>a+b[1],0)):3,lvl=opt.lvl||(blk<3?blk+1:2);
  let y=0;if(S>=sJ){const u=S-sJ-1;if(u>=0&&u<7){const v=u/7;y=-58*4*v*(1-v);}}
  const thrS=blk<3?blk*13+4:SQ_FIRE.start("jthr")+0.5;
  // the fireball's flight from the throwing hand
  const P2=blk<3?PF.thrust:PJC,yT=blk<3?0:(()=>{const v=(thrS-sJ-1)/7;return -58*4*v*(1-v);})(),Gm0=mvGeo(P2,0),hp=Gm0.T(Gm0.fHd[0],Gm0.fHd[1]);
  const hx=X+hp[0]*K132+10,hy=G+1+(hp[1]+yT)*K132,tx=blk<3?GX-22:BX-10,dist=tx-hx,dur=dist/380*R,fu=(S-thrS)/dur,bu=(S-thrS-dur)/(0.4*R);
  const hitG=blk<3&&bu>=0&&bu<1,hitB=blk===3&&bu>=0&&bu<1;
  if(!opt.noMon){pMonster(c,s,K,"crawler",CX,G+1,tq,o);pMonster(c,s,K,"ghoul2",GX+(hitG?6:0),G+2,tq,o);pMonster(c,s,K,"bat2",BX+(hitB?6:0),BY,tq,o);c.setTransform(s,0,0,s,0,0);}
  const Gm=mvDraw(c,X,G+1+y*K132,q.P,tq,1,e,K132,{feet:y>-4});fxHand(c,X,G+1+y*K132,1,K132,q.P,Gm);
  if(fu>=0&&fu<1)fxFire(c,hx+dist*fu,hy,1,K132,tq,1,lvl);if(bu>=0&&bu<1)fxBurstL(c,tx,hy,K132,bu,lvl);
  if(!opt.c)scLabel(c,blk<3?"fireball, level "+lvl:"cast in mid-air, at a flyer",SW*0.5,10);}
const PFZ1=Object.assign({},PF.hold,{hand:0,lean:-0.06,nod:0.1,hx:-0.5,fH:[16,-33],fl:[10.2,9.8],fS:[2,-27]}),PFZ2=Object.assign({},PF.recover,{lean:-0.02,nod:0.18,fS:[2,-27],fH:[14,-17],fl:[10.2,9.8]});
const SQ_FIZ=mvSeq([[IDLE,4],[PF.back,1],[Object.assign({},PF.thrust,{hand:0.5}),1,"fiz"],[PFZ1,2],[PFZ2,2],[PF.recover,1],[IDLE,7]]);
function loopFizzle(cv,t,lv,R,K){const H=200,G=182,{c,s,SW}=scSet(cv,H),st=t*R,q=SQ_FIZ.at(st),S=q.s,tq=Math.floor(st)/R,e=LB.places[lv].edge;scGround(c,lv,SW,H,G);
  const X=SW*0.42,Gm=mvDraw(c,X,G+1,q.P,tq,1,e);fxHand(c,X,G+1,1,K132,q.P,Gm);const P2=Object.assign({},PF.thrust),G2=mvGeo(P2,0),hp=G2.T(G2.fHd[0],G2.fHd[1]);
  fxFizzle(c,X+hp[0]*K132+3,G+1+hp[1]*K132,K132,(S-SQ_FIZ.start("fiz"))/R/0.6);scLabel(c,"not enough mana",SW*0.5,10);}
function loopPlay3(cv,t,lv,R,K){const {c,s,SW}=scSet(cv,PH),st=t*R,q=SQ_HEAL.at(st),tq=Math.floor(st)/R,e=LB.places[lv].edge;pSky(c,lv,SW,PH,PG);if(!K.F)K.F={};
  const u=(q.s-SQ_HEAL.start("go"))/R/0.6;drawHealer(c,SW*0.09,PG+1,q.P,tq,1,e,u,2,"B");
  {const q2=SQ_FIZ.at(st),X2=SW*0.25,Gz=mvDraw(c,X2,PG+1,q2.P,tq,1,e);fxHand(c,X2,PG+1,1,K132,q2.P,Gz);const G2=mvGeo(PF.thrust,0),hp=G2.T(G2.fHd[0],G2.fHd[1]);
   fxFizzle(c,X2+hp[0]*K132+3,PG+1+hp[1]*K132,K132,(q2.s-SQ_FIZ.start("fiz"))/R/0.6);}
  loopFire(cv,t,lv,R,K.F,{c,s,SW,H:PH,G:PG,X:SW*0.44,CX:SW*0.64,GX:SW*0.9,BX:SW*0.78});
  c.setTransform(s,0,0,s,0,0);c.textAlign="center";c.textBaseline="top";c.font='12px "Alegreya Sans",sans-serif';c.fillStyle="#c9a25a";
  c.fillText("heal",SW*0.09,PG+10);c.fillText("no mana",SW*0.25,PG+10);c.fillText("fireball",SW*0.44,PG+10);c.fillText("crawler",SW*0.64,PG+10);c.fillText("flyer",SW*0.78,PG+10);c.fillText("ghoul",SW*0.9,PG+10);}
// ---------- sheets: heal over time (level 2), and the fireball in flight and bursting at each level
const H_US=[0.12,0.3,0.5,0.75];
function healCell(kind,u,lvl){return{draw(c,cw,ch,G,lv){const X=cw*0.5,e=LB.places[lv].edge;drawHealer(c,X,G+1,u<0.75?PH2.hold:PH2.lower,0,1,e,u,lvl,kind);}};}
function fireCell(lvl,burst){return{draw(c,cw,ch,G,lv){const y=G-46;if(burst==null)fxFire(c,cw*0.58,y,1,K132,0,1,lvl);else fxBurstL(c,cw*0.5,y,K132,burst,lvl);}};}
Object.assign(SHEETS,{
  healA:{cw:112,ch:150,cells:H_US.map(u=>healCell("A",u,2))},
  healB:{cw:112,ch:150,cells:H_US.map(u=>healCell("B",u,2))},
  fire:{cw:96,ch:110,cells:[fireCell(1),fireCell(2),fireCell(3),fireCell(1,0.3),fireCell(2,0.3),fireCell(3,0.3)]}});

/* ======================================== mvloot.js ======================================== */
/* ============================== 4b round 4: the loot ==============================
   Ink cut-outs with a glowing part in their own colour, hovering a little above the ground over a pool of their light, bobbing slowly.
   Each has a clue besides colour: its outline (round flask, tall vial, hanging scroll, sword, rune stone, shield) and an emblem matching the HUD
   (the heart on the health potion, the flame on the mana potion, the spell's picture on a scroll, the rune on the stone).
   Origin (X, Y) is the ground point under the item; sizes in picture pixels (play size). */
const L_RED="#e0473c",L_TEAL="#5fdcca",L_TEAL2="#2a9f8f";
const LOOT=[{k:"health",n:"health potion"},{k:"mana",n:"mana potion"},{k:"heal",n:"heal scroll"},{k:"fire",n:"fireball scroll"},{k:"reach",n:"sword: longer reach"},{k:"rune",n:"sword: stronger hits"},{k:"shield",n:"armour"}];
const lootCol=k=>k==="health"?L_RED:k==="mana"?L_TEAL:MV_GOLD;
function lHeart(c,x,y,s){c.beginPath();c.moveTo(x,y+s*0.9);c.bezierCurveTo(x-s*1.4,y-s*0.1,x-s*0.7,y-s*1.05,x,y-s*0.35);c.bezierCurveTo(x+s*0.7,y-s*1.05,x+s*1.4,y-s*0.1,x,y+s*0.9);c.fill();}
function lFlame(c,x,y,s){c.beginPath();c.moveTo(x,y-s*1.25);c.quadraticCurveTo(x+s*0.95,y-s*0.2,x+s*0.6,y+s*0.55);c.quadraticCurveTo(x,y+s*1.05,x-s*0.6,y+s*0.55);c.quadraticCurveTo(x-s*0.85,y-s*0.1,x-s*0.15,y-s*0.55);c.quadraticCurveTo(x-s*0.05,y-s*0.15,x+s*0.1,y-s*0.1);c.quadraticCurveTo(x+s*0.25,y-s*0.6,x,y-s*1.25);c.fill();}
function lDiamond(c,x,y,rx,ry){c.beginPath();c.moveTo(x,y-ry);c.lineTo(x+rx,y);c.lineTo(x,y+ry);c.lineTo(x-rx,y);c.closePath();c.fill();}
function lSpellPic(c,kind,x,y,s,col){c.save();c.fillStyle=c.strokeStyle=col;c.lineCap="round";c.lineJoin="round";
  if(kind==="heal"){c.lineWidth=1.1*s;c.beginPath();c.ellipse(x,y+1.6*s,3.6*s,1.25*s,0,0,Math.PI*2);c.stroke();c.lineWidth=1.3*s;c.beginPath();c.moveTo(x,y+1.2*s);c.lineTo(x,y-3.2*s);c.stroke();
    c.beginPath();c.moveTo(x-2*s,y-1.6*s);c.lineTo(x,y-3.6*s);c.lineTo(x+2*s,y-1.6*s);c.stroke();}
  else{c.beginPath();c.arc(x+2*s,y,2.4*s,0,Math.PI*2);c.fill();
    for(const q of [[0.9,-1.9,-4.2,-3.8,-0.4,-0.7],[0.2,-0.6,-5.8,0.2,0.2,0.9],[0.9,1.9,-3.9,3.4,-0.4,0.8]]){c.beginPath();c.moveTo(x+q[0]*s,y+q[1]*s);c.lineTo(x+q[2]*s,y+q[3]*s);c.lineTo(x+q[4]*s,y+q[5]*s);c.closePath();c.fill();}}
  c.restore();}
// the item's own drawing, at (0,0) = its base, before any hover; col = the edge it is drawn with (its own light), body = ink
function lootShape(c,k,t,rm){const col=lootCol(k);c.lineJoin="round";c.lineCap="round";const edge=()=>{c.lineWidth=1.3;c.strokeStyle=col;c.stroke();c.fillStyle=MV_INK;c.fill();};
  if(k==="health"){c.beginPath();c.arc(0,-9,8,0,Math.PI*2);c.rect(-2.6,-23,5.2,8);c.rect(-4.2,-25.5,8.4,3);edge();
    c.save();c.beginPath();c.arc(0,-9,6.4,0,Math.PI*2);c.clip();c.fillStyle=L_RED;c.fillRect(-8,-11.5,16,12);c.restore();
    c.fillStyle=MV_INK;lHeart(c,0,-6.6,2.6);c.fillStyle="rgba(255,255,255,0.6)";c.beginPath();c.arc(-3,-12,1.3,0,Math.PI*2);c.fill();}
  else if(k==="mana"){c.beginPath();c.moveTo(-4.8,-1.5);c.lineTo(-4.8,-16);c.quadraticCurveTo(-4.8,-19,-2.2,-21.5);c.lineTo(-2.2,-26.5);c.lineTo(-3.4,-26.5);c.lineTo(-3.4,-29);c.lineTo(3.4,-29);c.lineTo(3.4,-26.5);c.lineTo(2.2,-26.5);c.lineTo(2.2,-21.5);c.quadraticCurveTo(4.8,-19,4.8,-16);c.lineTo(4.8,-1.5);c.quadraticCurveTo(4.8,0.5,2.8,0.5);c.lineTo(-2.8,0.5);c.quadraticCurveTo(-4.8,0.5,-4.8,-1.5);c.closePath();edge();
    c.save();c.beginPath();c.rect(-3.4,-15.5,6.8,14.6);c.clip();c.fillStyle=L_TEAL;c.fillRect(-4,-15.5,8,15);c.fillStyle=L_TEAL2;c.fillRect(-4,-4,8,4);c.restore();
    c.fillStyle=MV_INK;lFlame(c,0,-8,3.1);c.fillStyle="rgba(255,255,255,0.55)";c.fillRect(-2.6,-14.5,1,8);}
  else if(k==="heal"||k==="fire"){c.save();c.shadowColor=MV_GOLD;c.shadowBlur=6;c.fillStyle="#fff0c0";c.beginPath();c.moveTo(-6,-23);c.lineTo(6,-23);c.lineTo(6,-7.5);for(let i=0;i<=4;i++)c.lineTo(6-i*3,-7.5+(i%2?1.2:0));c.closePath();c.fill();c.restore();
    c.fillStyle=MV_LAMP;c.fillRect(-6,-23,12,2);lSpellPic(c,k,0,-15,1,MV_INK);
    for(const y of [-25.5,-8]){c.beginPath();c.rect(-8,y,16,3.2);c.arc(-8.6,y+1.6,1.9,0,Math.PI*2);c.arc(8.6,y+1.6,1.9,0,Math.PI*2);edge();}}
  else if(k==="reach"){c.beginPath();c.moveTo(-2.4,-28);c.lineTo(2.4,-28);c.lineTo(0.5,-2);c.lineTo(-0.5,-2);c.closePath();c.rect(-6.5,-30.2,13,2.4);c.rect(-1.3,-35.5,2.6,5.5);c.moveTo(1.9,-37.2);c.arc(0,-37.2,1.9,0,Math.PI*2);edge();
    c.strokeStyle=MV_LAMP;c.lineWidth=0.8;c.beginPath();c.moveTo(0.9,-27.5);c.lineTo(0.2,-4);c.stroke();}
  else if(k==="rune"){c.beginPath();c.moveTo(-5,0);c.lineTo(-7.2,-9.5);c.lineTo(-3.6,-21.5);c.lineTo(2.8,-24.5);c.lineTo(7,-13);c.lineTo(5.4,0);c.closePath();edge();
    c.save();c.shadowColor=MV_GOLD;c.shadowBlur=5;c.fillStyle=MV_GOLD;lDiamond(c,0,-11,2.6,4.4);c.strokeStyle=MV_GOLD;c.lineWidth=1.1;c.beginPath();c.moveTo(-4.3,-15);c.lineTo(-4.3,-7);c.moveTo(4.3,-15);c.lineTo(4.3,-7);c.stroke();c.restore();}
  else if(k==="shield"){c.beginPath();c.moveTo(-7.5,-24);c.lineTo(7.5,-24);c.lineTo(7.5,-14);c.quadraticCurveTo(7.3,-5,0,-0.5);c.quadraticCurveTo(-7.3,-5,-7.5,-14);c.closePath();edge();
    c.strokeStyle=MV_GOLD;c.lineWidth=0.9;c.beginPath();c.moveTo(0,-22);c.lineTo(0,-3);c.moveTo(-5.5,-15);c.lineTo(5.5,-15);c.stroke();c.fillStyle=MV_GOLD;lDiamond(c,0,-15,2.3,2.3);}}
// an item resting: its pool of light on the ground, a soft glow, a slow bob and, now and then, a glint. o: {a, sc, lift, x, y, pool, glint}
function drawLoot(c,k,X,Y,t,o){o=o||{};const col=lootCol(k),a=o.a==null?1:o.a,sc=o.sc||1,b=o.bob==null?Math.sin(t*5)*1.6:o.bob,hov=o.hov==null?4:o.hov,pl=o.pool==null?1:o.pool;
  if(pl>0){c.save();c.translate(X,Y+1);c.scale(1,0.32);const g=c.createRadialGradient(0,0,1,0,0,24);g.addColorStop(0,rgbaS(col,0.55*pl*a));g.addColorStop(1,rgbaS(col,0));c.fillStyle=g;c.fillRect(-26,-26,52,52);c.restore();}
  const x=X+(o.x||0),y=Y-hov-b+(o.y||0);fxGlowAt(c,x,y-13*sc,20*sc,(0.32+0.08*Math.sin(t*5))*a,col);
  c.save();c.globalAlpha=a;c.translate(x,y);c.scale(sc,sc);if(o.rot)c.rotate(o.rot);lootShape(c,k,t);c.restore();
  if(k==="health"||k==="mana"){const r=k==="health"?L_RED:L_TEAL;for(let i=0;i<3;i++){const ph=(t*0.5+i/3)%1;fxMote(c,x+Math.sin(ph*6+i)*4*sc,y-(k==="mana"?30:26)*sc-ph*16*sc,1.1*sc,0.75*(1-ph)*a,r);}}
  if(o.glint!==false){const gp=((t+(o.seed||0))%2.6)/0.45;if(gp<1){const s=Math.sin(gp*Math.PI)*3.2*sc;c.save();c.globalAlpha=a;c.fillStyle="#fff6dc";c.translate(x+6*sc,y-24*sc);
    c.beginPath();c.moveTo(0,-s*1.6);c.lineTo(s*0.3,-s*0.3);c.lineTo(s*1.6,0);c.lineTo(s*0.3,s*0.3);c.lineTo(0,s*1.6);c.lineTo(-s*0.3,s*0.3);c.lineTo(-s*1.6,0);c.lineTo(-s*0.3,-s*0.3);c.closePath();c.fill();c.restore();}}}
// dropping out of a defeated monster (u 0..1 over 0.45 s): a hop from where it fell to its resting place, a little bounce, its light coming up
function drawLootDrop(c,k,X,Y,mx,my,u,t){if(u<0)return;if(u>=1){drawLoot(c,k,X,Y,t);return;}const v=Math.min(1,u/0.8),x=mx+(X-mx)*v,y0=my+((Y-4)-my)*v-Math.sin(v*Math.PI)*22;
  const sq=u>0.8?1-Math.sin((u-0.8)/0.2*Math.PI)*0.18:1;drawLoot(c,k,x,Y,t,{x:0,y:y0-(Y-4),hov:0,bob:0,pool:Math.max(0,(u-0.6)/0.4),glint:false,sc:sq});}
// picked up (u 0..1 over 0.5 s): it lifts and flies into the wanderer's chest, shrinking, then a gold glint and a ring of its motes
function drawLootPick(c,k,X,Y,cx,cy,u,t){if(u<0||u>1)return;const col=lootCol(k),e=u*u,x=X+(cx-X)*e,y=(Y-4)+(cy-(Y-4))*e-Math.sin(u*Math.PI)*18;
  if(u<0.8)drawLoot(c,k,X,Y,t,{x:x-X,y:y-(Y-4),hov:0,bob:0,sc:1-u*0.75,a:1-u*0.3,pool:1-u*1.6,glint:false});
  if(u>0.65){const g=(u-0.65)/0.35,s=(2+g*6)*(1-g*0.4);fxGlowAt(c,cx,cy,(10+g*10),0.9*(1-g),MV_GOLD);c.save();c.globalAlpha=1-g;c.fillStyle="#fff6dc";c.translate(cx,cy);
    c.beginPath();c.moveTo(0,-s*1.6);c.lineTo(s*0.3,-s*0.3);c.lineTo(s*1.6,0);c.lineTo(s*0.3,s*0.3);c.lineTo(0,s*1.6);c.lineTo(-s*0.3,s*0.3);c.lineTo(-s*1.6,0);c.lineTo(-s*0.3,-s*0.3);c.closePath();c.fill();c.restore();
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,d=4+g*14;fxMote(c,cx+Math.cos(a)*d,cy+Math.sin(a)*d,1.2*(1-g),1-g,col);}}}
// ---------- scenes
function loopGround(cv,t,lv,R,K){const H=120,G=100,{c,s,SW}=scSet(cv,H);scGround(c,lv,SW,H,G);
  LOOT.forEach((L,i)=>{const X=SW*(0.08+i*0.84/6);drawLoot(c,L.k,X,G+1,t,{seed:i*0.37});c.textAlign="center";c.textBaseline="top";c.font='600 8px "Alegreya Sans",sans-serif';c.fillStyle="#c9a25a";c.fillText(String(i+1),X,G+5);});}
function monInto(K,s,kind,X,Y,t,o){if(!K.mon||K.monS!==s){K.mon=LP.mk(260*s,250*s);K.monS=s;K.H={};}const mc=K.mon.getContext("2d");mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,K.mon.width,K.mon.height);LB.scene(s).monsterInto(mc,s,{kind,X,Y,ph:0.4},t,o,0,0,K.H);return K.mon;}
function loopDrop(cv,t,lv,R,K){const H=230,G=212,{c,s,SW}=scSet(cv,H),e=LB.places[lv].edge,o=LB.options(lv,{walking:false}),T=4.1,n=Math.floor(t/T),tt=t%T,L=LOOT[n%LOOT.length];scGround(c,lv,SW,H,G);
  const X0=SW*0.24,GX=X0+102,LX=GX+4,tS=0.25,tStrike=tS+1/R,tWalk=1.25,steps=12,tPick=tWalk+steps/R,tEnd=3.75;
  // the ghoul: standing, then breaking into its card pieces as the strike lands
  if(tt<tStrike)pMonster(c,s,K,"ghoul2",GX,G+2,Math.floor(tt*8)/8,o);else{const M=monInto(K,s,"ghoul2",GX,G+2,Math.floor(tStrike*8)/8,o);LP.drawDefeat(c,M,s,GX,G+2,LP.MON_BOX.ghoul2,Math.min(1,(tt-tStrike)/1.6),"cardwisp",n*7+3);}
  c.setTransform(s,0,0,s,0,0);
  // the wanderer: a swing, a pause, a walk to the loot, standing
  let P,x=0,tq=Math.floor(tt*R)/R;if(tt<tS)P=mvIdle(Math.floor(tt*R));else if(tt<tS+6/R){const a=swordAt((tt-tS)*R+2,LVLS[0]);P=a.P;if(a.arc)fxSlash(c,X0,G+1,1,K132,a.P,a.arc[0],a.arc[1],a.arc[2],e,LVLS[0]);}
  else if(tt<tWalk)P=mvIdle(Math.floor(tt*R));else if(tt<tPick){const st=(tt-tWalk)*R;P=mvWalk(Math.floor(st));x=st*STEP;}else{P=mvIdle(Math.floor(tt*R));x=steps*STEP;}
  // the loot: dropping out, resting, picked up
  const Gw=mvDraw(c,X0+x*K132,G+1,P,tq,1,e);const ch=mvPt(Gw,P,X0+x*K132,G+1,1,K132,4,-22);
  if(tt<tPick)drawLootDrop(c,L.k,LX,G+1,GX-10,G-50,(tt-0.55)/0.45,tt);else drawLootPick(c,L.k,LX,G+1,ch[0],ch[1],(tt-tPick)/0.5,tt);
  scLabel(c,L.n,SW*0.5,10);scFade(c,SW,H,tt>tEnd?(tt-tEnd)/0.35:(tt<0.15?1-tt/0.15:0));}
function loopPlay4(cv,t,lv,R,K){const {c,s,SW}=scSet(cv,PH),st=t*R,tq=Math.floor(st)/R,e=LB.places[lv].edge,o=LB.options(lv,{walking:false});pSky(c,lv,SW,PH,PG);
  mvDraw(c,SW*0.07,PG+1,mvIdle(Math.floor(st)),tq,1,e);LOOT.forEach((L,i)=>{const X=SW*(0.19+i*0.105);drawLoot(c,L.k,X,PG+1,t,{seed:i*0.37});});
  pMonster(c,s,K,"ghoul2",SW*0.95,PG+2,tq,o);c.setTransform(s,0,0,s,0,0);c.textAlign="center";c.textBaseline="top";c.font='12px "Alegreya Sans",sans-serif';c.fillStyle="#c9a25a";
  LOOT.forEach((L,i)=>c.fillText(String(i+1),SW*(0.19+i*0.105),PG+10));c.fillText("ghoul",SW*0.95,PG+10);}
// ---------- sheets
function lootCell(k,f,z){z=z||1;return{draw(c,cw,ch,G,lv){c.save();c.translate(cw*0.5,G+1);c.scale(z,z);f(c,0,0,lv);c.restore();}};}
Object.assign(SHEETS,{
  potion:{cw:120,ch:120,cells:[lootCell("health",(c,X,Y,lv)=>{LP.drawPotion(c,X,Y,1.2,false);},2.2),lootCell("health",(c,X,Y)=>drawLoot(c,"health",X,Y,1.2,{glint:false}),2.2)]},
  loot:{cw:70,ch:80,cells:LOOT.map(L=>lootCell(L.k,(c,X,Y)=>drawLoot(c,L.k,X,Y,0.6,{glint:false})))},
  pick:{cw:150,ch:170,cells:[
    lootCell("rune",(c,X,Y)=>drawLootDrop(c,"rune",X+6,Y,X-24,Y-48,0.35,0),1.8),
    lootCell("rune",(c,X,Y)=>drawLootDrop(c,"rune",X,Y,X-30,Y-48,0.9,0),1.8),
    lootCell("rune",(c,X,Y)=>drawLoot(c,"rune",X,Y,0.6),1.8),
    lootCell("rune",(c,X,Y)=>drawLootPick(c,"rune",X+8,Y,X-22,Y-50,0.45,0),1.8),
    lootCell("rune",(c,X,Y)=>drawLootPick(c,"rune",X+8,Y,X-22,Y-50,0.8,0),1.8)]}});

/* ======================================== mvcourse.js ======================================== */
/* ============================== 4b round 5: ledges, rooftops, pits and crumbling ledges ==============================
   The rules: anything the wanderer can stand on carries a lit top edge in the place's light (scenery that can't be stood on has none);
   a crumbling stretch shows that edge broken into pieces, with cracks; a pit is a gap in the path you see the air through, its lips lit.
   Heights (picture px above the path): low about 50 (a jump, or a climb), mid about 140 (one climb), high about 250 (two climbs).
   A pit is at most about 45 wide (one jump). Each place builds these from its own scenery. Drawn into the place by overriding the
   bundle's Scene.play, so the sky, backdrops, rain, fore layer and vignette are the design system's own. */
const CS_L1=[200,380,50],CS_L2=[380,560,140],CS_L3=[540,800,250],CS_CR=[700,800],CS_PIT=[900,942],CS_LOOT=640;
const csG=x=>LB.GROUND(x);
const CS_Y0=468;function csTop(L){return CS_Y0-L[2];}
function litLine(c,x0,x1,y,edge,w){c.save();c.strokeStyle=edge;c.lineWidth=w||2.4;c.lineCap="round";c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();c.restore();}
function brokenLine(c,x0,x1,y,edge){const n=Math.max(3,Math.round((x1-x0)/13));c.save();c.strokeStyle=edge;c.lineWidth=2.4;c.lineCap="round";
  for(let i=0;i<n;i++){const a=x0+(x1-x0)*i/n+1.8,b=x0+(x1-x0)*(i+1)/n-1.8;c.beginPath();c.moveTo(a,y+(i%2?0.6:-0.2));c.lineTo(b,y+(i%2?0.2:0.6));c.stroke();}c.restore();}
function cracks(c,x0,x1,y,th,seed){const r=mvRng(seed);c.save();c.strokeStyle=rgbaS("#000000",0);c.restore();return r;}
const INKc=()=>LB.pal.INK;
// ---------- the crumbling stretch: pieces of the place's material, state by time since the wanderer stepped on it (sec), or null
function csCrumble(c,lv,x0,x1,y,th,edge,ts){const n=Math.max(3,Math.round((x1-x0)/14)),w=(x1-x0)/n,r=mvRng(71+lv.length);let alpha=1,fall=-1,jit=0;
  if(ts!=null){if(ts<0.5)jit=(Math.floor(ts*12)%2?1:-1)*1.1;else if(ts<1.4)fall=(ts-0.5)/0.9;else if(ts<3.5)return;else alpha=Math.min(1,(ts-3.5)/0.4);}
  for(let i=0;i<n;i++){const px=x0+i*w,rot=(r()-0.5)*2.4,vx=(r()-0.5)*18,dl=r()*0.25;let ox=jit*(i%2?1:-1)*0.6,oy=jit*(i%2?-0.5:0.5),a=alpha,ro=0;
    if(fall>=0){const u=Math.max(0,(fall-dl)/(1-dl));ox+=vx*u;oy+=u*u*160;ro=rot*u;a=1-Math.max(0,(u-0.5)/0.5);}
    if(a<=0)continue;c.save();c.globalAlpha=a;c.translate(px+w/2+ox,y+th/2+oy);c.rotate(ro);
    c.fillStyle=INKc();c.beginPath();c.moveTo(-w/2+0.8,-th/2);c.lineTo(w/2-0.8,-th/2+(i%2?0.6:0));c.lineTo(w/2-1.4,th/2);c.lineTo(-w/2+1.6,th/2-(i%3?1.5:0));c.closePath();c.fill();
    if(fall<0)brokenLine(c,-w/2+0.8,w/2-0.8,-th/2,edge);else litLine(c,-w/2+1,w/2-1,-th/2,edge,1.2);
    c.restore();}}
// ---------- the pit: a gap in the path, the air showing through, its lips lit, the place's dressing
function csPath(c,W,lv){const A=LB.pal.AIR[lv],ink=INKc(),pl=CS_PIT[0],pr=CS_PIT[1];c.fillStyle=ink;
  for(const seg of [[-10,pl],[pr,W+10]]){c.beginPath();c.moveTo(seg[0],LB.LH+10);for(let x=seg[0];x<=seg[1];x+=6)c.lineTo(x,csG(x));c.lineTo(seg[1],csG(seg[1]));c.lineTo(seg[1],LB.LH+10);c.closePath();c.fill();}
  const gt=Math.min(csG(pl),csG(pr)),g=c.createLinearGradient(0,gt,0,LB.LH);g.addColorStop(0,LP.mixc(ink,A,0.5));g.addColorStop(0.55,LP.mixc(ink,A,0.2));g.addColorStop(1,ink);
  c.fillStyle=g;c.beginPath();c.moveTo(pl,csG(pl));c.lineTo(pl+3,csG(pl)+14);c.lineTo(pl+1,LB.LH+10);c.lineTo(pr-1,LB.LH+10);c.lineTo(pr-3,csG(pr)+12);c.lineTo(pr,csG(pr));c.closePath();c.fill();
  // ragged walls of the gap, in ink
  c.fillStyle=ink;const r=mvRng(5);for(const side of [0,1]){const x=side?pr:pl,d=side?-1:1;c.beginPath();c.moveTo(x,csG(x)-1);for(let y=0;y<=70;y+=7)c.lineTo(x+d*(1+r()*4),csG(x)+y);c.lineTo(x,csG(x)+80);c.closePath();c.fill();}}
function csPitLips(c,lv,edge){const pl=CS_PIT[0],pr=CS_PIT[1];litLine(c,pl-12,pl,csG(pl),edge,1.6);litLine(c,pr,pr+12,csG(pr),edge,1.6);}
// ---------- each place's pieces. Every structure stands on the path and is plain ink; standable tops get the lit edge
const CS_PLACE={
  night:{name:"the graveyard",parts:["a broken churchyard wall","a crypt's flat roof","a ruined chapel wall","its loose top stones","an open grave"],
    draw(c,lv,e,t){const ink=INKc();c.fillStyle=ink;
      // low: the broken wall, stones stepping down at its left end
      const y1=csTop(CS_L1);c.beginPath();c.moveTo(CS_L1[0]-6,csG(CS_L1[0])+4);c.lineTo(CS_L1[0]-6,y1+18);c.lineTo(CS_L1[0]+4,y1+12);c.lineTo(CS_L1[0]+6,y1+4);c.lineTo(CS_L1[0]+14,y1);c.lineTo(CS_L1[1],y1);c.lineTo(CS_L1[1],csG(CS_L1[1])+4);c.closePath();c.fill();
      litLine(c,CS_L1[0]+14,CS_L1[1],y1,e);
      // mid: the crypt, roof slab overhanging, an arched door with a candle's glow
      const y2=csTop(CS_L2);c.fillRect(CS_L2[0],y2+8,CS_L2[1]-CS_L2[0],csG(CS_L2[0])-y2);c.fillRect(CS_L2[0]-6,y2,CS_L2[1]-CS_L2[0]+12,9);c.fillRect(CS_L2[0]+4,y2+9,CS_L2[1]-CS_L2[0]-8,4);
      const dx=(CS_L2[0]+CS_L2[1])/2-20,gy=csG(dx);fxGlowAt(c,dx+10,gy-22,26,0.45+0.06*Math.sin(t*1.7),MV_GOLD);c.fillStyle="#3a2418";c.beginPath();c.moveTo(dx,gy);c.lineTo(dx,gy-34);c.arc(dx+10,gy-34,10,Math.PI,0);c.lineTo(dx+20,gy);c.closePath();c.fill();
      c.fillStyle=MV_LAMP;c.beginPath();c.ellipse(dx+10,gy-14,1.4,2.6,0,0,Math.PI*2);c.fill();c.fillStyle=ink;
      litLine(c,CS_L2[0]-6,CS_L2[1]+6,y2,e);
      // high: the ruined chapel wall, a buttress, a broken gable rising at its right; loose stones at the top's right end crumble
      const y3=csTop(CS_L3),x0=CS_L3[0]+18,S=c.getTransform().a,KK=CS_PLACE.night;
      if(!KK._cv||KK._s!==S){const bw=340,bh=330,cv=LP.mk(Math.ceil(bw*S),Math.ceil(bh*S)),q=cv.getContext("2d");q.setTransform(S,0,0,S,-(CS_L3[0]-10)*S,-(y3-60)*S);q.fillStyle=ink;
        q.beginPath();q.moveTo(x0,csG(x0)+4);q.lineTo(x0,y3+10);q.lineTo(CS_L3[0],y3+10);q.lineTo(CS_L3[0],y3);q.lineTo(CS_CR[0],y3);q.lineTo(CS_CR[0],y3+12);q.lineTo(CS_L3[1]+14,y3+12);q.lineTo(CS_L3[1]+26,y3-40);q.lineTo(CS_L3[1]+34,y3-12);q.lineTo(CS_L3[1]+40,y3+30);q.lineTo(CS_L3[1]+44,csG(CS_L3[1]+44)+4);q.closePath();q.fill();
        q.globalCompositeOperation="destination-out";for(const wx of [x0+60,x0+150]){q.beginPath();q.moveTo(wx,y3+150);q.lineTo(wx,y3+70);q.quadraticCurveTo(wx,y3+42,wx+16,y3+34);q.quadraticCurveTo(wx+32,y3+42,wx+32,y3+70);q.lineTo(wx+32,y3+150);q.closePath();q.fill();}
        q.globalCompositeOperation="source-over";q.fillStyle=ink;for(const wx of [x0+60,x0+150]){q.fillRect(wx+14.5,y3+40,3,112);q.fillRect(wx,y3+96,32,3);}
        KK._cv=cv;KK._s=S;}
      c.drawImage(KK._cv,CS_L3[0]-10,y3-60,KK._cv.width/S,KK._cv.height/S);
      if(false){c.beginPath();c.moveTo(x0,csG(x0)+4);c.lineTo(x0,y3+10);c.lineTo(CS_L3[0],y3+10);c.lineTo(CS_L3[0],y3);c.lineTo(CS_CR[0],y3);c.lineTo(CS_CR[0],y3+12);c.lineTo(CS_L3[1]+14,y3+12);c.lineTo(CS_L3[1]+26,y3-40);c.lineTo(CS_L3[1]+34,y3-12);c.lineTo(CS_L3[1]+40,y3+30);c.lineTo(CS_L3[1]+44,csG(CS_L3[1]+44)+4);c.closePath();c.fill();}
      c.beginPath();c.moveTo(x0+100,csG(x0+100)+4);c.lineTo(x0+108,y3+190);c.lineTo(x0+124,y3+190);c.lineTo(x0+136,csG(x0+136)+4);c.closePath();c.fill();
      litLine(c,CS_L3[0],CS_CR[0],y3,e);return{th:12};},
    pit(c,lv,e){const pr=CS_PIT[1],ink=INKc();c.fillStyle=ink;c.beginPath();c.moveTo(pr+2,csG(pr));c.quadraticCurveTo(pr+16,csG(pr)-16,pr+34,csG(pr+34));c.closePath();c.fill();
      c.lineWidth=2.2;c.strokeStyle=ink;c.beginPath();c.moveTo(pr+20,csG(pr)-8);c.lineTo(pr+26,csG(pr)-40);c.stroke();c.fillRect(pr+21,csG(pr)-46,9,3);c.beginPath();c.moveTo(pr+17,csG(pr)-6);c.lineTo(pr+23,csG(pr)-6);c.lineTo(pr+21,csG(pr)+4);c.closePath();c.fill();}},
  storm:{name:"the old town",parts:["a stack of crates","a timber balcony","a townhouse's lead roof","its slates","an open cellar"],
    draw(c,lv,e,t){const ink=INKc();c.fillStyle=ink;
      const y1=csTop(CS_L1);c.fillRect(CS_L1[0],y1,96,csG(CS_L1[0])-y1+4);c.fillRect(CS_L1[0]+96,y1+10,CS_L1[1]-CS_L1[0]-96,csG(CS_L1[1])-y1);
      c.fillRect(CS_L1[0]+6,y1-22,60,24);
      // the crates' boards, faintly lit at the seams
      c.strokeStyle=rgbaS("#ffffff",0.06);c.lineWidth=1;for(const yy of [y1+12,y1+26])c.strokeRect(CS_L1[0]+3,yy-10,90,14);
      litLine(c,CS_L1[0]+6,CS_L1[0]+66,y1-22,e);litLine(c,CS_L1[0]+66,CS_L1[0]+96,y1,e);litLine(c,CS_L1[0]+96,CS_L1[1],y1+10,e);
      // the townhouse: wall from the balcony's back to past the roof; balcony boards on two brackets; a lit window
      const y2=csTop(CS_L2),y3=csTop(CS_L3),hx0=CS_L2[1];c.fillStyle=ink;c.fillRect(hx0,y3,CS_L3[1]+30-hx0,csG(hx0)-y3+4);
      c.fillRect(CS_L2[0]-6,y2,hx0-CS_L2[0]+6,7);for(const bx of [CS_L2[0]+20,CS_L2[0]+110]){c.beginPath();c.moveTo(bx,y2+7);c.lineTo(hx0,y2+7);c.lineTo(hx0,y2+40);c.closePath();c.fill();}
      c.lineWidth=1.6;c.strokeStyle=ink;for(let i=0;i<7;i++){c.beginPath();c.moveTo(CS_L2[0]-2+i*26,y2);c.lineTo(CS_L2[0]-2+i*26,y2-18);c.stroke();}c.fillRect(CS_L2[0]-4,y2-19,hx0-CS_L2[0]+4,2.5);
      litLine(c,CS_L2[0]-6,hx0,y2,e);
      for(const [wx,wy] of [[hx0+40,y2-40],[hx0+120,y2-40],[hx0+40,y2+40],[hx0+200,y2+40]]){fxGlowAt(c,wx+9,wy+13,22,0.35,MV_GOLD);c.fillStyle="#ffcf6a";c.fillRect(wx,wy,18,26);c.fillStyle=ink;c.fillRect(wx+8,wy,2,26);c.fillRect(wx,wy+12,18,2);}
      // the roof: a lead walk with a low parapet and a chimney; slates at its right end crumble
      c.fillStyle=ink;c.fillRect(CS_L3[0],y3,CS_CR[0]-CS_L3[0],10);c.fillRect(CS_L3[0]+150,y3-46,22,46);c.fillRect(CS_L3[0]+146,y3-50,30,6);
      litLine(c,CS_L3[0],CS_L3[0]+150,y3,e);litLine(c,CS_L3[0]+172,CS_CR[0],y3,e);litLine(c,CS_L3[0]+146,CS_L3[0]+176,y3-50,e,1.2);return{th:9};},
    pit(c,lv,e){const pl=CS_PIT[0],pr=CS_PIT[1],ink=INKc();c.fillStyle=ink;c.save();c.translate(pl,csG(pl));c.rotate(-1.15);c.fillRect(-1,-2,26,4);c.restore();
      c.save();c.translate(pr,csG(pr));c.rotate(-2.0);c.fillRect(-1,-2,24,4);c.restore();}},
  dawn:{name:"the open moor",parts:["a drystone wall","a stone circle's lintel","a granite tor","its loose top slabs","a bog hole"],
    draw(c,lv,e,t){const ink=INKc();c.fillStyle=ink;
      const y1=csTop(CS_L1);c.beginPath();c.moveTo(CS_L1[0],csG(CS_L1[0])+4);for(let i=0;i<=12;i++){const x=CS_L1[0]+(CS_L1[1]-CS_L1[0])*i/12;c.lineTo(x,y1+(i===0?10:i%2?-1.5:1));}c.lineTo(CS_L1[1],csG(CS_L1[1])+4);c.closePath();c.fill();
      litLine(c,CS_L1[0]+10,CS_L1[1],y1,e);
      const y2=csTop(CS_L2);for(const sx of [CS_L2[0]+4,CS_L2[1]-32]){c.beginPath();c.moveTo(sx,csG(sx)+4);c.lineTo(sx+2,y2+14);c.lineTo(sx+26,y2+12);c.lineTo(sx+28,csG(sx+28)+4);c.closePath();c.fill();}
      c.beginPath();c.moveTo(CS_L2[0]-6,y2+14);c.lineTo(CS_L2[0]-4,y2);c.lineTo(CS_L2[1]+4,y2+1);c.lineTo(CS_L2[1]+6,y2+14);c.closePath();c.fill();litLine(c,CS_L2[0]-4,CS_L2[1]+4,y2,e);
      const y3=csTop(CS_L3),r=mvRng(33);let yy=csG(CS_L3[0]+20)+4;const slabs=[[CS_L3[0]+30,CS_L3[1]+20,0.5],[CS_L3[0]+14,CS_L3[1]+6,0.28],[CS_L3[0]+2,CS_L3[1]-6,0.12],[CS_L3[0],CS_CR[0],0]];
      for(const s of slabs){const top=y3+(csG(CS_L3[0])-y3)*s[2],j=r()*6-3,mid=(yy+top)/2;c.beginPath();c.moveTo(s[0]+3,yy);c.lineTo(s[0]-3+j,mid+4);c.lineTo(s[0]+1,top+5);c.lineTo(s[0]+7,top);c.lineTo(s[1]-6,top-0.5);c.lineTo(s[1]+1,top+6);c.lineTo(s[1]+4-j,mid);c.lineTo(s[1]-1,yy);c.closePath();c.fill();
        c.strokeStyle=rgbaS(LB.pal.AIR[lv],0.18);c.lineWidth=1;c.beginPath();c.moveTo(s[0]+8,yy-1);c.lineTo(s[1]-8,yy-1);c.stroke();yy=top+1;}
      litLine(c,CS_L3[0]+4,CS_CR[0],y3,e);return{th:12};},
    pit(c,lv,e){const pl=CS_PIT[0],pr=CS_PIT[1],ink=INKc();c.strokeStyle=ink;c.lineWidth=1.4;for(const [x,d] of [[pl-8,1],[pl-3,1],[pr+4,-1],[pr+9,-1]]){for(let k=0;k<3;k++){c.beginPath();c.moveTo(x+k*2,csG(x));c.quadraticCurveTo(x+k*2+d*3,csG(x)-10,x+k*2+d*(5+k*2),csG(x)-18-k*4);c.stroke();}}
      const wy=LB.LH-28;c.strokeStyle=rgbaS("#dbe7ff",0.45);c.lineWidth=1.2;c.beginPath();c.moveTo(pl+8,wy);c.lineTo(pr-8,wy);c.stroke();}},
  mist:{name:"the wind-bent forest",parts:["a fallen trunk","a bent tree's bough","a plank walkway","its rotten boards","a ravine"],
    draw(c,lv,e,t){const ink=INKc();c.fillStyle=ink;
      const y1=csTop(CS_L1)+12;c.beginPath();c.moveTo(CS_L1[0]+10,csG(CS_L1[0])+4);c.quadraticCurveTo(CS_L1[0]-6,y1+10,CS_L1[0]+14,y1);c.lineTo(CS_L1[1],y1-1);c.lineTo(CS_L1[1],csG(CS_L1[1])+4);c.closePath();c.fill();
      c.lineWidth=3;c.strokeStyle=ink;c.beginPath();c.moveTo(CS_L1[0]+80,y1+4);c.lineTo(CS_L1[0]+92,y1-16);c.lineTo(CS_L1[0]+100,y1-20);c.stroke();litLine(c,CS_L1[0]+14,CS_L1[1],y1,e);
      // the bent tree: a trunk leaning with the wind, a thick bough out to the left at mid height, roots spreading
      const y2=csTop(CS_L2),y3=csTop(CS_L3),tx=CS_L2[1]+8;c.fillStyle=ink;c.beginPath();c.moveTo(tx-26,csG(tx)+4);c.quadraticCurveTo(tx-6,csG(tx)-30,tx-10,y2+20);c.quadraticCurveTo(tx-8,y3-40,tx+30,y3-160);
      c.lineTo(tx+52,y3-150);c.quadraticCurveTo(tx+24,y3-40,tx+22,y2+20);c.quadraticCurveTo(tx+22,csG(tx)-30,tx+46,csG(tx)+4);c.closePath();c.fill();
      c.strokeStyle=ink;c.lineCap="round";for(const b of [[tx+36,y3-150,tx+120,y3-176,9,tx+170,y3-166],[tx+30,y3-120,tx+110,y3-120,7,tx+150,y3-100],[tx+16,y3-70,tx+80,y3-80,6,tx+120,y3-60],[tx+40,y3-156,tx+62,y3-196,6,tx+98,y3-210]]){
        c.lineWidth=b[4];c.beginPath();c.moveTo(b[0],b[1]);c.quadraticCurveTo(b[2],b[3],b[5],b[6]);c.stroke();c.lineWidth=b[4]*0.4;c.beginPath();c.moveTo((b[0]+b[5])/2+10,(b[1]+b[6])/2-4);c.lineTo((b[0]+b[5])/2+34,(b[1]+b[6])/2-18);c.stroke();}
      c.beginPath();c.moveTo(tx-8,y2+18);c.quadraticCurveTo(CS_L2[0]+80,y2+8,CS_L2[0]-6,y2+4);c.lineTo(CS_L2[0]-8,y2);c.lineTo(tx-6,y2);c.closePath();c.fill();litLine(c,CS_L2[0]-6,tx-10,y2,e);
      // the walkway: planks from the trunk to the right, hung on ropes from above, a rope rail; rotten boards at its right end
      c.fillRect(CS_L3[0],y3,CS_CR[0]-CS_L3[0],6);c.lineWidth=1;c.strokeStyle=ink;for(const rx of [CS_L3[0]+70,CS_L3[0]+150,CS_L3[1]-2]){c.beginPath();c.moveTo(rx,y3);c.lineTo(rx+30,0);c.stroke();}
      c.beginPath();c.moveTo(CS_L3[0],y3-18);c.quadraticCurveTo((CS_L3[0]+CS_L3[1])/2,y3-8,CS_L3[1],y3-18);c.stroke();litLine(c,CS_L3[0],CS_CR[0],y3,e);return{th:6};},
    pit(c,lv,e){const pl=CS_PIT[0],pr=CS_PIT[1],ink=INKc();c.strokeStyle=ink;c.lineCap="round";for(const [x,d,l] of [[pl-2,1,40],[pl+2,1,26],[pr+2,-1,34],[pr-1,-1,22]]){c.lineWidth=2;c.beginPath();c.moveTo(x,csG(x)+4);c.quadraticCurveTo(x+d*6,csG(x)+l*0.5,x+d*3,csG(x)+l);c.stroke();}}}};
// ---------- the wanderer's run through the course (steps at R; positions in picture px; y up negative from the path)
function csRun(){const K=K132,ST=STEP*K,seg=[];let x=60,y=0,f=1;const L1y=-CS_L1[2],L2y=-CS_L2[2],L3y=-CS_L3[2];
  const walk=(x1,yy)=>{const n=Math.round(Math.abs(x1-x)/ST),x0=x;seg.push({n,fn:(st,g)=>({P:mvWalk(g),x:x0+(x1-x0)*st/n,y:yy,f})});x=x1;};
  const jump=(x1,y0,y1,h)=>{const x0=x,ks=[[PJ.crouch,1],[PJ.launch,1],[PJ.rise,2],[PJ.apex,1],[PJ.fall,2],[PJ.land,1],[PJ.recover,1]],n=9;
    seg.push({n,fn:(st)=>{let k=0,a=0;for(const q of ks){if(st<a+q[1]){k=q;break;}a+=q[1];}const P=(k||ks[ks.length-1])[0];if(st<1)return{P,x:x0,y:y0,f};if(st>=7)return{P,x:x1,y:y1,f};
      const v=(st-1)/6,top=Math.min(y0,y1)-h;const yy=v<0.5?y0+(top-y0)*(1-(1-v*2)*(1-v*2)):top+(y1-top)*((v-0.5)*2)*((v-0.5)*2);return{P,x:x0+(x1-x0)*v,y:yy,f};}});x=x1;y=y1;};
  const climb=(h,y0)=>{const s=h/(LEDGE*K),x0=x,pts=[[0,0,0],[1,0,0],[1.5,-2,-30*s,"out"],[2,-2,-30*s],[3.5,-1,-56*s,"out"],[4,-1,-56*s],[4.5,4,-70*s,"out"],[5,4,-70*s],[5.5,16,-96*s,"out"],[6,16,-96*s],[7,18,-96*s]];
    const ks=[[PC.look,1],[PC.grab,1],[PC.pull,2],[PC.knee,1],[PC.rise,1],[PC.stand,1]];seg.push({n:7,fn:(st)=>{let k=ks[0],a=0;for(const q of ks){if(st<a+q[1]){k=q;break;}a+=q[1];}const p=mvPath(pts,st);return{P:k[0],x:x0+p[0]*K,y:y0+p[1]*K,f};}});x=x0+18*K;y=y0-h;};
  walk(140,0);jump(205,0,L1y,30);walk(CS_L2[0]-16,L1y);climb(CS_L2[2]-CS_L1[2],L1y);walk(CS_L3[0]-16,L2y);climb(CS_L3[2]-CS_L2[2],L2y);
  const onCr=x+ (CS_CR[0]-x),nCr=Math.round((CS_CR[0]-x)/ST),crS=seg.reduce((a,b)=>a+b.n,0)+nCr;walk(CS_CR[0]+44,L3y);
  {const x0=x,n=7,ks=[[PD.drop,1],[PD.fall,4],[PD.land,1],[PD.recover,1]];seg.push({n,fn:(st)=>{let k=ks[0],a=0;for(const q of ks){if(st<a+q[1]){k=q;break;}a+=q[1];}const v=Math.min(1,st/5);return{P:k[0],x:x0+10*v,y:L3y+(0-L3y)*v*v,f};}});x=x0+10;y=0;}
  walk(CS_PIT[0]-20,0);jump(CS_PIT[1]+5,0,0,58*K);walk(1060,0);seg.push({n:6,fn:(st,g)=>({P:mvIdle(g),x:1060,y:0,f})});
  let a=0;for(const s of seg){s.s0=a;a+=s.n;}return{seg,total:a,crS};}
const CS_RUN=csRun();
function csAt(S){S=Math.max(0,Math.min(CS_RUN.total-0.001,S));for(const s of CS_RUN.seg)if(S<s.s0+s.n){const st=S-s.s0;return Object.assign(s.fn(st,Math.floor(S)),{st});}return CS_RUN.seg[CS_RUN.seg.length-1].fn(0,0);}
// the course drawn as the place's play strip
class CourseScene extends LP.Scene{play(ctx,s,W,t,camX,o){if(this.fn)this.fn(ctx,s,W,t,o);}}
const _csc={};function courseScene(s){const sc=Math.min(2,Math.max(0.5,Math.round(s*4)/4));return _csc[sc]||(_csc[sc]=new CourseScene(5,sc));}
function csBaseY(q){return q.y===0?csG(q.x)+1:csG(q.x)+(CS_Y0-csG(q.x))*Math.min(1,-q.y/20)+q.y+1;}
(()=>{let S=0;for(;S<CS_RUN.total;S+=0.25){const q=csAt(S);if(q.y===-CS_L3[2]&&q.x>=CS_LOOT-18)break;}CS_RUN.pickS=S;})();
function loopCourse(cv,t,lvAll,R,K,lvFixed){const lv=lvFixed||lvAll,S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d");if(!K.off||K.off.width!==cv.width||K.off.height!==cv.height)K.off=LP.mk(cv.width,cv.height);
  const total=CS_RUN.total/R+0.8,tt=t%total,Sx=tt*R,e=LB.places[lv].edge,PL=CS_PLACE[lv],sc=courseScene(S);
  sc.fn=(x,s,W2,t2)=>{csPath(x,W2,lv);PL.pit(x,lv,e);csPitLips(x,lv,e);const g=PL.draw(x,lv,e,t2);
    const ts=(Sx-CS_RUN.crS)/R;csCrumble(x,lv,CS_CR[0],CS_CR[1],csTop(CS_L3),g.th,e,ts>=0?ts:null);
    const q=csAt(Sx),by=csBaseY(q),lvl=[0,-CS_L1[2],-CS_L2[2],-CS_L3[2]].includes(q.y);
    const Gm=mvDraw(x,q.x,by,q.P,Math.floor(Sx)/R,q.f,e,K132,{feet:lvl});const ch=mvPt(Gm,q.P,q.x,by,q.f,K132,4,-22);
    if(Sx<CS_RUN.pickS)drawLoot(x,"rune",CS_LOOT,csTop(CS_L3)+1,t2);else drawLootPick(x,"rune",CS_LOOT,csTop(CS_L3)+1,ch[0],ch[1],(Sx-CS_RUN.pickS)/R/0.5,t2);};
  sc.render(c,K.off,S,W,t,0,LB.options(lv,{walking:false}));sc.fn=null;
  c.setTransform(S,0,0,S,0,0);scFade(c,W,LB.LH,tt>total-0.4?(tt-(total-0.4))/0.4:(tt<0.25?1-tt/0.25:0));}
// ---------- the crumble, stage by stage, for one place
function crumbleCell(lv,ts){return{draw(c,cw,ch,G,lvx){const e=LB.places[lv].edge,y=G-40,th=lv==="storm"?9:lv==="mist"?6:12;
  litLine(c,4,22,y,e);c.fillStyle=INKc();c.fillRect(0,y,22,th);csCrumble(c,lv,22,cw-4,y,th,e,ts);}};}
for(const lv of ["night","storm","dawn","mist"])SHEETS["cr_"+lv]={lv,cw:96,ch:110,cells:[null,0.2,0.75,2.0,3.7].map(ts=>crumbleCell(lv,ts))};

/* ======================================== mvcourse2.js ======================================== */
/* ============================== 4b round 5b: ledges from the places' own scenery ==============================
   Every standable top is taken from a piece the design system already draws: the churchyard wall, a ruin, the tavern's railed rooftop
   walk, a watchtower, the drystone wall, dolmens, the woodcutter's log pile, the great stump, the forest's overhanging limb on a snag.
   The walk along each top is read from the piece's own silhouette, so the lit edge and the wanderer's feet follow its crooked line.
   Ledges work both ways: the wanderer drops through them, and climbs onto one from beneath (within one climb). A crumbling stretch is cut
   from the real scenery, so its own stones or boards break off. */
const C2_INK="#060508";
function c2Sprite(S,w,h,ox,oy,fn){const c=LP.mk(Math.ceil(w*S),Math.ceil(h*S)),x=c.getContext("2d");x.setTransform(S,0,0,S,ox*S,oy*S);x.fillStyle=C2_INK;x.strokeStyle=C2_INK;fn(x);return{c,ox,oy,w,h};}
// the top of a sprite's silhouette, per column: the first row of at least four solid rows, so thin twigs and rails are ignored
function c2Top(sp){if(sp._top)return sp._top;const c=sp.c,W=c.width,H=c.height,d=c.getContext("2d").getImageData(0,0,W,H).data,sc=W/sp.w,out=new Float32Array(W).fill(1e9),run=Math.max(3,Math.round((sp.run||3)*sc));
  for(let x=0;x<W;x++){let n=0;for(let y=0;y<H;y++){if(d[(y*W+x)*4+3]>110){n++;if(n>=run){out[x]=(y-run+1)/sc-sp.oy;break;}}else n=0;}}return sp._top={out,sc};}
function c2At(pl,x){const sp=pl.sp,u=pl.flip?(pl.X-x)/pl.k:(x-pl.X)/pl.k,T=c2Top(sp),col=Math.round((u+sp.ox)*T.sc);if(col<0||col>=T.out.length)return 1e9;return pl.Y+T.out[col]*pl.k;}
// a walk along a placed piece's top between x0 and x1, smoothed a little; or flat at a set height
function c2Walk(pl,x0,x1,flatY,band){if(flatY==null&&band){let m=1e9;for(let x=x0;x<=x1;x+=1)m=Math.min(m,c2At(pl,x));while(x0<x1&&c2At(pl,x0)>m+band)x0+=1;while(x1>x0&&c2At(pl,x1)>m+band)x1-=1;}
  if(flatY==null){const st=x=>Math.abs(c2At(pl,x+4)-c2At(pl,x))>7||c2At(pl,x)>1e8;while(x0<x1-8&&(st(x0)||c2At(pl,x0)>1e8))x0+=1;while(x1>x0+8&&(st(x1-4)||c2At(pl,x1)>1e8))x1-=1;}const ys=[];for(let x=x0;x<=x1+0.5;x+=2)ys.push(flatY!=null?flatY:c2At(pl,x));
  const sm=ys.map((y,i)=>{const w=ys.slice(Math.max(0,i-2),i+3).filter(v=>v<1e8).sort((a,b)=>a-b);return w.length?w[Math.floor(w.length/2)]:y;});
  return{x0,x1,pl,y:x=>{const i=Math.max(0,Math.min(sm.length-1,(x-x0)/2)),a=Math.floor(i),b=Math.min(sm.length-1,a+1);return sm[a]+(sm[b]-sm[a])*(i-a);}};}
function c2Draw(c,pl){LP.drawSprite(c,pl.sp,pl.X,pl.Y,pl.k,pl.flip);if(pl.sp.holes&&pl.sp.holes.length){c.save();if(pl.flip){c.translate(pl.X,pl.Y);c.scale(-1,1);c.translate(-pl.X,-pl.Y);}
  LP.fillHoles(c,pl.sp,pl.X,pl.Y,pl.k,mvRng(pl.seed||7),{litP:0.45,win:LB.pal.GOLD_LIGHT,a:0.95,bar:C2_INK,dark:"#1a1218",crack:true});c.restore();}}
function c2Lit(c,wk,x0,x1,edge){c.save();c.strokeStyle=edge;c.lineWidth=2.2;c.lineCap="round";c.lineJoin="round";c.beginPath();for(let x=x0;x<=x1;x+=2){const y=wk.y(x);x===x0?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();c.restore();}
function c2Broken(c,wk,x0,x1,edge,dx,dy){const n=Math.max(3,Math.round((x1-x0)/12));c.save();c.strokeStyle=edge;c.lineWidth=2.2;c.lineCap="round";
  for(let i=0;i<n;i++){const a=x0+(x1-x0)*i/n+2,b=x0+(x1-x0)*(i+1)/n-2;c.beginPath();c.moveTo(a+(dx||0),wk.y(a)+(dy||0)+(i%2?0.6:0));c.lineTo(b+(dx||0),wk.y(b)+(dy||0));c.stroke();}c.restore();}
// a crumbling stretch of a placed piece: the band of its top between x0 and x1 is cut out of the piece and drawn as falling slices
function c2Band(wk,x0,x1,up,th){const top=[],bot=[];for(let x=x0;x<=x1+0.1;x+=2){top.push([x,wk.y(x)-up]);bot.push([x,wk.y(x)+th]);}return top.concat(bot.reverse());}
function c2DrawWithCrumble(c,pl,wk,cr,ts,edge,draw){const [x0,x1,up,th]=cr,n=Math.max(3,Math.round((x1-x0)/13)),r=mvRng(91);
  if(ts==null){draw();c2Broken(c,wk,x0,x1,edge);return;}
  c.save();c.beginPath();c.rect(-50,-50,3000,1200);const B=c2Band(wk,x0,x1,up,th);B.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip("evenodd");draw();c.restore();
  let fall=-1,jit=0,al=1;if(ts<0.5)jit=(Math.floor(ts*12)%2?1:-1)*1.2;else if(ts<1.4)fall=(ts-0.5)/0.9;else if(ts<3.5)return;else al=Math.min(1,(ts-3.5)/0.4);
  for(let i=0;i<n;i++){const a=x0+(x1-x0)*i/n,b=x0+(x1-x0)*(i+1)/n,rot=(r()-0.5)*2.4,vx=(r()-0.5)*20,dl=r()*0.25;let ox=jit*(i%2?1:-1),oy=jit*(i%2?-0.6:0.6),ro=0,a2=al;
    if(fall>=0){const u=Math.max(0,(fall-dl)/(1-dl));ox+=vx*u;oy+=u*u*170;ro=rot*u;a2=1-Math.max(0,(u-0.5)/0.5);}if(a2<=0)continue;
    const cx=(a+b)/2,cy=wk.y(cx);c.save();c.globalAlpha=a2;c.translate(cx+ox,cy+oy);c.rotate(ro);c.translate(-cx,-cy);
    c.beginPath();const S2=c2Band(wk,a,b,up,th);S2.forEach((p,j)=>j?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip();draw();c.restore();
    if(fall<0){c.save();c.globalAlpha=a2;c2Broken(c,{y:x=>wk.y(x)},a,b,edge,ox,oy);c.restore();}}}
// ---------- the places
const C2={};
function c2Build(lv,S){const key=lv+"@"+S.toFixed(3);if(C2[key])return C2[key];const B=(k,seed,o)=>LP.building(k,mvRng(seed),Object.assign({detail:2},o),S),G=csG;let P;
  if(lv==="night"){
    const wall={sp:c2Sprite(S,150,90,10,80,x=>LP.drawWall(x,0,0,130,58,3)),X:150,Y:G(150),k:1},crypt={sp:B("crypt",18,{w:58,h:46,door:true}),X:330,Y:G(330)+3,k:1.75,seed:3},
      ruin={sp:B("ruin",19,{w:150,h:118}),X:468,Y:G(468)+4,k:1.15,seed:4};
    P={pieces:[ruin,crypt,wall],wall,crypt,ruin};
    P.A=c2Walk(wall,156,276);P.Bw=c2Walk(crypt,318,438,null,46);P.Cw=c2Walk(ruin,470,520);P.route={jump:[90,165],cB:252,cC:416,cr:[498,522,14,12],crPiece:ruin,potion:220};}
  else if(lv==="storm"){
    const bar={sp:c2Sprite(S,80,70,20,62,x=>{LP.drawBarrels(x,0,0);LP.drawCrates(x,30,0);}),X:70,Y:G(70),k:1.15},tav={sp:B("tavern",11,{w:150,h:108,door:true,wing:true}),X:215,Y:G(215)+2,k:1.25,seed:5};
    const pc=tav.sp.perch,an=tav.sp.anchor,wy=tav.Y+pc.y*tav.k,wx0=tav.X+(pc.x-(an[0]-pc.x))*tav.k,wx1=tav.X+an[0]*tav.k;
    const tw={sp:B("watchtower",6,{w:46,h:150}),X:wx1-14,Y:G(wx1)+2,k:1.0,seed:6};
    P={pieces:[tw,tav,bar],tav,tw,bar};P.A=c2Walk(bar,40,140);P.Bw=c2Walk(tav,wx0,wx1,wy);P.Cw=c2Walk(tw,wx1-60,wx1+80);
    P.route={start:-30,jump:[14,P.A.x0+10],offA:true,cB:P.Bw.x0+4,cC:P.Cw.x0-22,cr:[P.Cw.x1-26,P.Cw.x1,16,12],crPiece:tw};}
  else if(lv==="dawn"){
    const d1={sp:B("dolmen",21,{w:124,h:62}),X:330,Y:G(330)+3,k:1,seed:2},d2={sp:B("dolmen",22,{w:150,h:112,crack:true}),X:470,Y:G(470)+3,k:1,seed:3},
      wall={sp:c2Sprite(S,170,80,10,70,x=>{x.save();x.translate(0,-LB.GROUND(150));LP.drawStoneWall(x,0,150,140,44,5);x.restore();}),X:150,Y:G(150),k:1};
    P={pieces:[d2,d1,wall],d1,d2,wall};
    P.A=c2Walk(wall,156,286);P.Bw=c2Walk(d1,326,462);P.Cw=c2Walk(d2,470,636);P.route={jump:[96,166],cB:296,cC:436,cr:[572,636,10,24],crPiece:d2};}
  else{
    const hut={sp:B("cottage",24,{w:118,h:56,logs:true}),X:120,Y:G(120)+2,k:1.2,seed:8},st={sp:B("stump",23,{w:92,h:98}),X:430,Y:G(430)+3,k:1,seed:9},
      snag={sp:LP.geomSprite(LP.snagGeom(mvRng(31),330),S),X:700,Y:G(700)+6,k:1},limb={sp:Object.assign(LP.geomSprite(LP.overhangGeom(mvRng(42),3),S),{run:7}),X:690,Y:G(690)-196,k:0.8,flip:true};
    P={pieces:[snag,limb,st,hut],hut,st,snag,limb};const pc=hut.sp.perch,an=hut.sp.anchor,wy=hut.Y+pc.y*hut.k;
    P.A=c2Walk(hut,hut.X+(pc.x-20)*hut.k,hut.X+(an[0]+6)*hut.k,wy);P.Bw=c2Walk(st,452,506);P.Cw=c2Walk(limb,500,676);P.route={jump:[230,294],cB:0,cC:474,cr:[586,630,8,14],crPiece:limb,stepB:true};}
  return C2[key]=P;}

// ---------- the run through a place: a jump onto A, a climb to B, a climb to C, along C onto the crumbling stretch, the fall, the pit
function c2Run(P){const K=K132,ST=STEP*K,seg=[],R=P.route;let x=R.start!=null?R.start:40,y=csG(x)+1,f=1;const gy=X=>csG(X)+1;
  const walk=(x1,yf)=>{const n=Math.max(1,Math.round(Math.abs(x1-x)/ST)),x0=x;seg.push({n,fn:(st,g)=>{const X=x0+(x1-x0)*st/n;return{P:mvWalk(g),x:X,y:yf(X),lv:true};}});x=x1;y=yf(x1);};
  const keys=(ks,st)=>{let a=0;for(const q of ks){if(st<a+q[1])return q[0];a+=q[1];}return ks[ks.length-1][0];};
  const jump=(x1,y1,h)=>{const x0=x,y0=y,ks=[[PJ.crouch,1],[PJ.launch,1],[PJ.rise,2],[PJ.apex,1],[PJ.fall,2],[PJ.land,1],[PJ.recover,1]];
    seg.push({n:9,fn:(st)=>{const P=keys(ks,st);if(st<1)return{P,x:x0,y:y0,lv:true};if(st>=7)return{P,x:x1,y:y1,lv:true};const v=(st-1)/6,top=Math.min(y0,y1)-h,yy=v<0.5?y0+(top-y0)*(1-(1-v*2)*(1-v*2)):top+(y1-top)*((v-0.5)*2)*((v-0.5)*2);return{P,x:x0+(x1-x0)*v,y:yy};}});x=x1;y=y1;};
  const climb=(yf)=>{const x0=x,y0=y,x1=x0+18*K,y1=yf(x1),h=y0-y1,s=h/(LEDGE*K),pts=[[0,0,0],[1,0,0],[1.5,-2,-30*s,"out"],[2,-2,-30*s],[3.5,-1,-56*s,"out"],[4,-1,-56*s],[4.5,4,-70*s,"out"],[5,4,-70*s],[5.5,16,-96*s,"out"],[6,16,-96*s],[7,18,-96*s]];
    const ks=[[PC.look,1],[PC.grab,1],[PC.pull,2],[PC.knee,1],[PC.rise,1],[PC.stand,1]];seg.push({n:7,fn:(st)=>{const p=mvPath(pts,st);return{P:keys(ks,st),x:x0+p[0]*K,y:y0+p[1]*K,lv:st>=6};}});x=x1;y=y1;};
  const drop=()=>{const x0=x,y0=y,ks=[[PD.drop,1],[PD.fall,1],[PD.land,1],[PD.recover,1]];seg.push({n:4,fn:(st)=>{const v=Math.min(1,st/2),X=x0+12*v;return{P:keys(ks,st),x:X,y:y0+(gy(X)-y0)*v*v,lv:st>=2};}});x=x0+12;y=gy(x);};
  walk(R.jump[0],gy);jump(R.jump[1],P.A.y(R.jump[1]),30);
  if(R.offA){walk(P.A.x1-4,P.A.y);drop();walk(R.cB,gy);}else walk(R.cB||P.A.x1-8,P.A.y);
  if(R.stepB)jump(P.Bw.x0+12,P.Bw.y(P.Bw.x0+12),26);else climb(P.Bw.y);walk(R.cC,P.Bw.y);climb(P.Cw.y);
  const crS=seg.reduce((a,b)=>a+b.n,0)+Math.round(Math.max(0,R.cr[0]-x)/ST);walk(R.cr[0]+Math.min(40,(R.cr[1]-R.cr[0])*0.7),P.Cw.y);
  {const x0=x,y0=y,ks=[[PD.drop,1],[PD.fall,4],[PD.land,1],[PD.recover,1]];seg.push({n:7,fn:(st)=>{const v=Math.min(1,st/5),X=x0+10*v;return{P:keys(ks,st),x:X,y:y0+(gy(X)-y0)*v*v,lv:st>=5};}});x=x0+10;y=gy(x);}
  walk(CS_PIT[0]-20,gy);jump(CS_PIT[1]+5,gy(CS_PIT[1]+5),58*K);walk(1060,gy);seg.push({n:6,fn:(st,g)=>({P:mvIdle(g),x:1060,y:gy(1060),lv:true})});
  let a=0;for(const z of seg){z.s0=a;a+=z.n;}return{seg,total:a,crS};}
function c2RunAt(run,S){S=Math.max(0,Math.min(run.total-0.001,S));for(const z of run.seg)if(S<z.s0+z.n)return z.fn(S-z.s0,Math.floor(S));return run.seg[run.seg.length-1].fn(0,0);}

function c2PitDress(c,lv,e){const pl=CS_PIT[0],pr=CS_PIT[1];if(lv==="night"||lv==="mist")CS_PLACE[lv].pit(c,lv,e);
  else if(lv==="dawn"){const wy=LB.LH-28;c.strokeStyle=rgbaS("#dbe7ff",0.45);c.lineWidth=1.2;c.beginPath();c.moveTo(pl+8,wy);c.lineTo(pr-8,wy);c.stroke();}}
function c2Prep(lv,S){const P=c2Build(lv,S);if(!P.run){P.run=c2Run(P);const R=P.route,lx=P.Cw.x0+(R.cr[0]-P.Cw.x0)*0.35;P.lootX=lx;let S2=0;
  for(;S2<P.run.total;S2+=0.25){const q=c2RunAt(P.run,S2);if(q.x>=lx-16&&Math.abs(q.y-P.Cw.y(Math.min(P.Cw.x1,Math.max(P.Cw.x0,q.x))))<3&&q.x<=P.Cw.x1)break;}P.pickS=S2;}return P;}
function loopCourse2(cv,t,lvAll,R,K,lvFixed){const lv=lvFixed||lvAll,S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d");if(!K.off||K.off.width!==cv.width||K.off.height!==cv.height)K.off=LP.mk(cv.width,cv.height);
  const P=c2Prep(lv,S),run=P.run,total=run.total/R+0.8,tt=t%total,Sx=tt*R,e=LB.places[lv].edge,sc=courseScene(S),RT=P.route;
  sc.fn=(x,s,W2,t2)=>{csPath(x,W2,lv);c2PitDress(x,lv,e);csPitLips(x,lv,e);
    const ts=(Sx-run.crS)/R;for(const pl of P.pieces){if(pl===RT.crPiece)c2DrawWithCrumble(x,pl,P.Cw,RT.cr,ts>=0?ts:null,e,()=>c2Draw(x,pl));else c2Draw(x,pl);}
    c2Lit(x,P.A,P.A.x0,P.A.x1,e);c2Lit(x,P.Bw,P.Bw.x0,P.Bw.x1,e);c2Lit(x,P.Cw,P.Cw.x0,RT.cr[0],e);if(RT.cr[1]<P.Cw.x1)c2Lit(x,P.Cw,RT.cr[1],P.Cw.x1,e);
    if(RT.potion)drawLoot(x,"health",RT.potion,P.A.y(RT.potion)+1,t2);
    const q=c2RunAt(run,Sx),Gm=mvDraw(x,q.x,q.y,q.P,Math.floor(Sx)/R,1,e,K132,{feet:!!q.lv}),ch=mvPt(Gm,q.P,q.x,q.y,1,K132,4,-22),ly=P.Cw.y(P.lootX)+1;
    if(Sx<P.pickS)drawLoot(x,"rune",P.lootX,ly,t2);else drawLootPick(x,"rune",P.lootX,ly,ch[0],ch[1],(Sx-P.pickS)/R/0.5,t2);};
  sc.render(c,K.off,S,W,t,0,LB.options(lv,{walking:false}));sc.fn=null;
  c.setTransform(S,0,0,S,0,0);scFade(c,W,LB.LH,tt>total-0.4?(tt-(total-0.4))/0.4:(tt<0.25?1-tt/0.25:0));}

/* ======================================== mvroll.js ======================================== */
/* ============================== 4b round 5c: the rolling ground ==============================
   The play strip's ground rolls up from today's floor (never below it): the moor's hills up to about half the screen, the graveyard and
   the forest about 35 to 40%, the old town's streets about 25%. A few steep banks need a jump or a climb; pits lie in the dips. Each place
   has small, right-sized pieces to stand on and climb (a lit top edge on each; walk off, nothing is dropped through). The camera follows
   the wanderer along and up, so the layers rise at their own rates. Drawn into the real places by overriding the Scene's play strip. */
const RL_MAX={night:190,storm:135,dawn:270,mist:200};
// control points [x, height as a share of the place's maximum, kind of the stretch that follows: s smooth, b bank (steep), f flat]
// (round 5d: each bank face is now 28 wide and broken into ledges; the "flat" tops and the smooth rises get small undulations below)
const RL_PTS={
  night:[[0,0,"f"],[200,0,"s"],[520,0.34,"f"],[700,0.34,"b"],[728,0.74,"s"],[880,0.86,"s"],[1150,0,"f"],[1340,0,"s"],[1560,0.3,"s"],[1800,0,"f"],[2400,0,"f"]],
  storm:[[0,0,"f"],[240,0,"b"],[268,0.48,"f"],[560,0.48,"s"],[780,1,"f"],[960,1,"s"],[1150,0,"f"],[1350,0,"s"],[1540,0.35,"s"],[1800,0,"f"],[2400,0,"f"]],
  dawn:[[0,0,"f"],[160,0,"s"],[470,0.42,"s"],[640,0.52,"s"],[900,0.94,"s"],[1000,1,"b"],[1028,0.66,"s"],[1300,0,"f"],[1440,0,"s"],[1640,0.22,"s"],[1860,0,"f"],[2400,0,"f"]],
  mist:[[0,0,"f"],[230,0,"s"],[560,0.48,"b"],[588,0.84,"s"],[760,0.96,"s"],[1000,0.9,"s"],[1200,0,"f"],[1380,0,"s"],[1600,0.25,"s"],[1820,0,"f"],[2400,0,"f"]]};
const RL_PIT={night:[1196,1240],storm:[1196,1240],dawn:[1336,1380],mist:[1236,1280]};
// smooth value noise: the ground's small undulations at several scales, and the crumble of a bank's face
function rlHash(k,s){let n=(Math.imul(k|0,374761393)+Math.imul(s|0,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967296*2-1;}
function rlNoise(s,x){const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return rlHash(i,s)*(1-u)+rlHash(i+1,s)*u;}
const RL_SEED={night:11,storm:23,dawn:37,mist:53},RL_ROUGH={night:1,storm:0.55,dawn:1.25,mist:1.05}; // the moor roughest, the old town's streets smoothest
// a terrain: its control points, its pits, the place's maximum height, seed and roughness. Round 5d's stretches are one per place (rlT);
// round 5e's whole levels are built from sections (mvlevel.js) into the same form
const _rlT={};function rlT(lv){return _rlT[lv]||(_rlT[lv]={key:lv,lv,pts:RL_PTS[lv],pits:[RL_PIT[lv]],max:RL_MAX[lv],seed:RL_SEED[lv],rough:RL_ROUGH[lv],len:2400});}
function tRough(T,x){const s=T.seed;return rlNoise(s,x/150)*6+rlNoise(s+1,x/61)*4.2+rlNoise(s+2,x/26)*2.5+rlNoise(s+3,x/10.5)*1.1;}
// a bank's face: two or three steep pitches with short, tilted shelves between, different for every bank
const _rlBank={};
function tBankU(TR,i,u){let T=_rlBank[TR.key+"#"+i];
  if(!T){const r=mvRng(TR.seed*7+i*13),n=2+Math.floor(r()*2);T=[[0,0]];let p=0,h=0;
    for(let k=0;k<n;k++){const span=1/n,steep=span*(0.4+r()*0.2);if(k===n-1){T.push([1,1]);break;}p+=steep;h=Math.min(0.9,h+span*(0.75+r()*0.5));T.push([p,h]);p+=span-steep;h=Math.min(0.93,h+0.03+r()*0.05);T.push([p,h]);}
    _rlBank[TR.key+"#"+i]=T;}
  for(let k=0;k<T.length-1;k++){const a=T[k],b=T[k+1];if(u<=b[0]){let v=(u-a[0])/Math.max(1e-6,b[0]-a[0]);v=v*v*(3-2*v);return a[1]+(b[1]-a[1])*v;}}return 1;}
function tHill(T,x){const P=T.pts,M=T.max;let lo=0,hi=P.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(P[m][0]<=x)lo=m;else hi=m;} // a binary search: levels have many points
  for(let i=lo;i<=lo;i++){const a=P[i],b=P[i+1];if(b&&x>=a[0]&&x<b[0]){const u0=(x-a[0])/(b[0]-a[0]);let u=u0,cr=0;
  if(a[2]==="b"){u=tBankU(T,i,u0);cr=Math.sin(Math.PI*u0)*Math.abs(b[1]-a[1])*M*0.07*rlNoise(T.seed+9,x/3.4);}
  else if(a[2]==="s")u=(1-Math.cos(u0*Math.PI))/2;else u=0;return M*(a[1]+(b[1]-a[1])*u)+cr;}}return 0;}
// the ground: the big shape, then the undulations (gentle on the floor itself, fuller once the ground has risen)
function tGround(T,x){const h=tHill(T,x),w=Math.max(0,Math.min(1,h/40)),a=(0.3+0.7*w*w*(3-2*w))*T.rough;return LB.GROUND(x)-h-tRough(T,x)*a;}
const _rlAvg={};function tRise(T,x){if(!_rlAvg[T.key]){const a=[];for(let X=0;X<=T.len;X+=4){let s=0,n=0;for(let d=-110;d<=110;d+=10){s+=tHill(T,X+d);n++;}a.push(s/n);}_rlAvg[T.key]=a;}
  const a=_rlAvg[T.key],i=Math.max(0,Math.min(a.length-1,x/4));return a[Math.floor(i)]*0.8;}
const rlHill=(lv,x)=>tHill(rlT(lv),x),rlGround=(lv,x)=>tGround(rlT(lv),x),rlRise=(lv,x)=>tRise(rlT(lv),x);
// ---------- the new small pieces, in the same hand
function rlBoxTomb(x){x.beginPath();x.moveTo(-4,3);x.lineTo(-3,-6);x.lineTo(78,-7);x.lineTo(80,3);x.closePath();x.fill();
  x.beginPath();x.moveTo(2,-6);x.lineTo(3,-34);x.lineTo(72,-35);x.lineTo(73,-6);x.closePath();x.fill();
  x.beginPath();x.moveTo(-6,-33);x.quadraticCurveTo(36,-37,82,-34);x.lineTo(81,-41);x.quadraticCurveTo(38,-44,-5,-41);x.closePath();x.fill();
  x.save();x.globalCompositeOperation="destination-out";for(const cx of [16,37,58]){x.beginPath();x.ellipse(cx,-20,4,7,0,0,Math.PI*2);x.fill();}x.restore();}
// drawing helpers for hand-cut pieces: a tapered band along a curve (roots, splinters, poles, spokes); a cut (a thin, wavering slit of light)
function rlTaper(x,p0,p1,p2,w0,w1,n){n=n||14;const L=[],R=[];for(let i=0;i<=n;i++){const t=i/n,m=1-t,px=m*m*p0[0]+2*m*t*p1[0]+t*t*p2[0],py=m*m*p0[1]+2*m*t*p1[1]+t*t*p2[1],dx=2*m*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]),dy=2*m*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]),l=Math.hypot(dx,dy)||1,w=(w0+(w1-w0)*t)/2;L.push([px-dy/l*w,py+dx/l*w]);R.push([px+dy/l*w,py-dx/l*w]);}
  x.beginPath();x.moveTo(L[0][0],L[0][1]);for(const p of L)x.lineTo(p[0],p[1]);for(let i=R.length-1;i>=0;i--)x.lineTo(R[i][0],R[i][1]);x.closePath();x.fill();}
function rlBlob(x,pts){const n=pts.length,m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],s=m(pts[n-1],pts[0]);x.beginPath();x.moveTo(s[0],s[1]);for(let i=0;i<n;i++){const q=m(pts[i],pts[(i+1)%n]);x.quadraticCurveTo(pts[i][0],pts[i][1],q[0],q[1]);}x.closePath();x.fill();}
function rlCut(x,a,b,w,wob,r){x.save();x.globalCompositeOperation="destination-out";x.lineWidth=w;x.lineCap="round";x.beginPath();x.moveTo(a[0],a[1]);x.quadraticCurveTo((a[0]+b[0])/2+(r()-0.5)*wob,(a[1]+b[1])/2+(r()-0.5)*wob,b[0],b[1]);x.stroke();x.restore();}
// a big crate: a hand-cut box, its frame and diagonal brace and the boards between shown by slits of light
function rlCrate(x,X,w,h,seed,rot){const r=mvRng(seed),j=()=>(r()-0.5)*1.6,f=4.6;x.save();x.translate(X+w/2,0);x.rotate(rot||0);x.translate(-w/2,0);
  const P=[[j(),2],[j()*0.8,-h+j()],[w+j()*0.8,-h+j()],[w+j(),2]];x.beginPath();x.moveTo(P[0][0],P[0][1]);for(let i=1;i<=4;i++){const a=P[i-1],b=P[i%4];x.quadraticCurveTo((a[0]+b[0])/2+j()*0.6,(a[1]+b[1])/2+j()*0.6,b[0],b[1]);}x.closePath();x.fill();
  const cw=1.25;for(let k=1;k<3;k++){const y=-f-(h-2*f)*k/3+j()*0.5;rlCut(x,[f+1,y],[w-f-1,y+j()*0.6],cw,1,r);} // the boards
  const d=2.7,len=Math.hypot(w-2*f,h-2*f),nx=(h-2*f)/len*d,ny=(w-2*f)/len*d;x.beginPath();x.moveTo(f-nx*0.2,-f+ny*0.2);x.lineTo(f+nx*1.6,-f+ny*1.6+0.4);x.lineTo(w-f+nx*0.2,-h+f-ny*0.2);x.lineTo(w-f-nx*1.6,-h+f-ny*1.6-0.4);x.closePath();x.fill(); // the brace, over the boards
  for(const s of [-1,1])rlCut(x,[f+1.5+s*nx,-f-1.5+s*ny],[w-f-1.5+s*nx,-h+f+1.5+s*ny],cw,1.2,r);
  rlCut(x,[f,-f],[w-f,-f+j()*0.4],cw,0.8,r);rlCut(x,[f,-h+f],[w-f,-h+f+j()*0.4],cw,0.8,r);rlCut(x,[f,-f],[f+j()*0.4,-h+f],cw,0.8,r);rlCut(x,[w-f,-f],[w-f+j()*0.4,-h+f],cw,0.8,r); // the frame
  x.restore();}
// a barrel: bellied staves, hoops near each end, a stave seam or two
function rlBarrel(x,X,w,h,seed){const r=mvRng(seed),hw=w/2,cx=X+hw,b=w*0.14;x.beginPath();x.moveTo(cx-hw+b,2);x.bezierCurveTo(cx-hw-1.2,-h*0.3,cx-hw-1.2,-h*0.7,cx-hw+b,-h);x.quadraticCurveTo(cx,-h-1.6,cx+hw-b,-h+0.4);x.bezierCurveTo(cx+hw+1.2,-h*0.7,cx+hw+1.2,-h*0.3,cx+hw-b,2);x.closePath();x.fill();
  const half=f=>hw-b+(b+0.9)*Math.sin(Math.PI*f)*0.95;for(const f of [0.13,0.22,0.78,0.87]){const y=-h*f,hh=half(f)-1.6;rlCut(x,[cx-hh,y],[cx+hh,y+0.3],1.2,0.6,r);}
  for(const s of [-0.38,0.3]){x.save();x.globalCompositeOperation="destination-out";x.lineWidth=1;x.lineCap="round";x.beginPath();x.moveTo(cx+s*hw*0.8,-h*0.25);x.quadraticCurveTo(cx+s*hw*1.12,-h*0.5,cx+s*hw*0.8,-h*0.75);x.stroke();x.restore();}}
// the old town's handcart, parked: a tilted bed of three crooked boards on a beam, one big wheel, a prop at the front, the handle raised behind, a slumped sack
function rlCart(x){const r=mvRng(31),yT=X=>-51-X*0.065;x.lineJoin="round";
  rlTaper(x,[98,yT(98)+18],[128,yT(122)+9],[154,-62],5.2,3.6);x.beginPath();x.ellipse(154.5,-62.5,3,2.4,-0.6,0,Math.PI*2);x.fill(); // the handle and its worn grip
  rlTaper(x,[13,yT(13)+15],[9.5,-16],[6,1],5.6,4.2,8);x.beginPath();x.ellipse(6,1.2,5.2,2.2,0,0,Math.PI*2);x.fill(); // the prop and its foot
  rlTaper(x,[-3,yT(-3)+17.6],[56,yT(56)+19.2],[116,yT(116)+17.4],4.4,4.6,10); // the beam
  for(let k=0;k<3;k++){const t0=k*5.7,e0=(r()-0.5)*4.4,e1=(r()-0.5)*4.4,bw=(k===1?1:-1)*(0.8+r()*1.2); // three boards, light between them
    x.beginPath();x.moveTo(-1+e0,yT(-1)+t0);x.quadraticCurveTo(54,yT(54)+t0+bw,108+e1,yT(108)+t0);x.lineTo(108.4+e1,yT(108)+t0+4.4);x.quadraticCurveTo(54,yT(54)+t0+4.4+bw,-1.3+e0,yT(-1)+t0+4.4);x.closePath();x.fill();}
  for(const [px,up] of [[1,4],[54,0],[104,5]]){const t=yT(px);x.beginPath();x.moveTo(px-2.3,t+17.5);x.lineTo(px-2,t-up);x.quadraticCurveTo(px,t-up-1.3,px+2.2,t-up+0.3);x.lineTo(px+2.5,t+17.5);x.closePath();x.fill();} // the stakes
  const wx=62,wy=-22.6,R0=22.6;x.lineWidth=4.6;x.beginPath();for(let i=0;i<=30;i++){const a=i/30*Math.PI*2,rr=R0-2.3+rlNoise(5,i*0.8)*0.45,px=wx+Math.cos(a)*rr,py=wy+Math.sin(a)*rr;i?x.lineTo(px,py):x.moveTo(px,py);}x.closePath();x.stroke(); // the rim, a touch out of true
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2+0.25+(r()-0.5)*0.09,c=Math.cos(a),s=Math.sin(a),bend=(r()-0.5)*1.4;rlTaper(x,[wx+c*4,wy+s*4],[wx+c*10-s*bend,wy+s*10+c*bend],[wx+c*(R0-3),wy+s*(R0-3)],3.3,2.2,6);} // nine spokes
  x.beginPath();x.arc(wx,wy,5.4,0,Math.PI*2);x.fill();
  const Y=X=>yT(X);rlShape(x,[[2,Y(2)+1.5,1],[-0.5,Y(0)-5],[2.5,Y(3)-11],[7.5,Y(8)-14.5],[11,Y(11)-17],[12.6,Y(12.6)-21.5],[15.4,Y(15.4)-23.6],[18.2,Y(18)-21.4],[17.4,Y(17.4)-17.6],[22.5,Y(22.5)-15.4],[29,Y(29)-11.6],[33.5,Y(33.5)-6.4],[35.5,Y(35.5)+1.5,1]]); // the sack, slumped
  rlShape(x,[[14.8,Y(15)-22.6,1],[18.6,Y(18.6)-27.6],[22.4,Y(22.4)-26.4],[21,Y(21)-23.4],[17.8,Y(17.8)-22.2]]); // its tied neck, flopped over
  rlCut(x,[6,Y(6)-8.5],[16,Y(16)-12],1.1,2,r);rlCut(x,[19,Y(19)-10],[30,Y(30)-6.5],1.1,2,r);}
// an outline through points: those marked sharp are corners (splinter tips, notches), the rest are smoothed through; the first must be sharp
function rlShape(x,pts){const n=pts.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];x.beginPath();x.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<=n;i++){const p=pts[i%n],q=pts[(i+1)%n];if(p[2])x.lineTo(p[0],p[1]);else{const e=q[2]?q:mid(p,q);x.quadraticCurveTo(p[0],p[1],e[0],e[1]);}}x.closePath();x.fill();}
// the forest's great stump: no ruler edges. A trunk that bulges and leans a little (a burr on its right flank), flaring into buttresses and
// gnarled roots (the right one arched clear of the ground); a broken crown, its middle standable, splintered at both ends; a stub of branch,
// shelf fungi, a couple of bark fissures, and a torn hollow (pointed at the top, its lower lip toothed) in place of the old egg-shaped hole
function rlGreatStump(x){const r=mvRng(23),N=rlNoise,lean=0.06,E=Math.exp;
  const xl=h=>18+0.085*h-22*E(-h/9)+4.4*N(41,h/22)+N(43,h/5),xr=h=>92-0.03*h+22*E(-h/10)+4.4*N(42,h/22)+N(44,h/5)+5*E(-(((h-52)/8)**2));
  const pts=[[xl(0)-3,4,1]];for(let h=2;h<=94;h+=3)pts.push([xl(h),-h]);
  pts.push([26.4,-100],[25.6,-108],[26.6,-116,1],[28.8,-109],[30.6,-103],[31.6,-99.5,1]); // the splinter on the left
  for(let X=36;X<=72;X+=4)pts.push([X,-97.4+(X-36)*0.06+N(45,X/5)*2.1+(X>52?1.6:0)]); // the broken surface, falling a little to the right
  pts.push([75.6,-95,1],[77.6,-101,1],[79.8,-96.4],[82.4,-99.6,1],[84.8,-93.6],[87.4,-96.2,1],[89.4,-91.6]); // splinters on the right
  for(let h=88;h>=2;h-=3)pts.push([xr(h),-h]);pts.push([xr(0)+3,4,1]);rlShape(x,pts);
  rlTaper(x,[xl(6)+3,-5],[0,-6.5],[-9,-1.2],8,5,8);rlTaper(x,[-9,-1.2],[-15,1],[-20,4.5],5,1.6,8);rlTaper(x,[6,-2],[2,0],[-1,4.5],5,1.8,6); // roots, left
  rlTaper(x,[xr(7)-3,-6],[116,-11.5],[123,-4],8,5,8);rlTaper(x,[123,-4],[127,0],[129,4.5],5,1.6,6);rlTaper(x,[106,-2],[111,0],[113,4.5],5,1.8,6); // roots, right: the long one arches just clear
  const bx=xr(66);rlTaper(x,[bx-6,-63],[bx+10,-70],[bx+18,-84],10,4.6,10);rlShape(x,[[bx+15.6,-81,1],[bx+16.6,-90,1],[bx+18.6,-85,1],[bx+21,-89.5,1],[bx+21.2,-82,1]]); // the stub branch
  for(const [h,s] of [[35,1],[43,0.85]]){const e=xl(h)+1;rlShape(x,[[e+1.5,-h+1.6,1],[e+1.5,-h-1.2,1],[e-5*s,-h-3.4],[e-11*s,-h-3],[e-15*s,-h-0.6],[e-15.5*s,-h+1.4,1],[e-9*s,-h+0.6],[e-4*s,-h+1.4]]);} // shelf fungi
  x.save();x.globalCompositeOperation="destination-out";x.lineCap="round";x.lineWidth=1.05;
  for(const [fx,h0,h1] of [[40,58,82],[73,12,32],[75,64,84]]){x.beginPath();for(let h=h0;h<=h1;h+=2){const X=fx+lean*h+N(fx,h/7)*1.8;h===h0?x.moveTo(X,-h):x.lineTo(X,-h);}x.stroke();} // bark fissures
  // the hollow: a torn split, pointed at both ends, wider below the middle, its two sides lumpy and unequal, a splinter jutting into it
  rlShape(x,[[49.6,-62,1],[51.6,-55],[54.4,-48],[56.8,-41.5],[57.4,-35],[55.2,-29.5],[56.4,-25.5,1],[53.6,-23.5],[50.6,-20,1],[47.6,-23.5],[44.4,-27.5],[43.6,-34],[46.2,-38.4,1],[44.4,-42.6],[46.4,-50],[48.2,-56.5]].map(([X,Y,k])=>[52+(X-50.6)*0.85,-37+(Y+41)*0.58,k]));
  rlShape(x,[[74.6,-71,1],[77.2,-73,1],[78.6,-68.6],[76.8,-65.6],[74.6,-67.4]]); // a knot hole
  x.restore();}
function rlBoulders(x){const r=mvRng(17),b=(cx,cy,rx,ry,tilt)=>{x.beginPath();const n=14;for(let i=0;i<=n;i++){const a=Math.PI+i/n*Math.PI,k=0.86+r()*0.2;x.lineTo(cx+Math.cos(a+tilt)*rx*k,cy+Math.sin(a+tilt)*ry*k);}x.lineTo(cx+rx*0.9,6);x.lineTo(cx-rx*0.95,6);x.closePath();x.fill();};
  b(24,2,28,30,0.12);b(74,4,30,24,-0.1);b(46,-18,24,20,0.25);b(98,4,14,12,0);}
function rlMossRock(x){x.beginPath();x.moveTo(-6,4);x.quadraticCurveTo(-8,-26,18,-38);x.quadraticCurveTo(48,-46,70,-30);x.quadraticCurveTo(84,-14,82,4);x.closePath();x.fill();
  x.lineCap="round";x.lineWidth=1.4;for(let i=0;i<9;i++){const px=8+i*8,py=-36+Math.abs(i-4)*1.6;x.beginPath();x.moveTo(px,py+3);x.quadraticCurveTo(px+1,py-4,px+3,py-7);x.stroke();}}
// the moor's drystone wall (round 5e, in place of the design system's stone wall here): laid along the ground, so its foot and its top
// follow the rise and fall of the hill; a row of coping stones set on edge along its top; one end tumbled into a heap of loose stones,
// the other a rough cheek end, fallen stones at its foot. No straight edges anywhere.
function rlDryWall(S,X,L,h,G,seed){const r=mvRng(seed);let Y=-1e9;for(let q=X;q<=X+L;q+=2)Y=Math.max(Y,G(q));Y+=3;let dm=0;for(let q=X;q<=X+L;q+=2)dm=Math.max(dm,Y-G(q));
  const base=lx=>G(X+lx)-Y+4,oy=h+dm+18,sp=c2Sprite(S,L+30,oy+10,14,oy,x=>{const body=h-7,T0=16,T1=L-8;
    const top=lx=>base(lx)-body+rlNoise(seed,lx/14)*1.6; // the body's top, a little uneven
    // the body: from the heap's shoulder to the cheek end
    const pts=[[T0-4,base(T0-4)+6,1]];for(let lx=T0-4;lx<=T0+2;lx+=2)pts.push([lx+(lx-T0)*0.2,top(lx)+(T0+2-lx)*1.4]);
    for(let lx=T0+4;lx<=T1-4;lx+=4)pts.push([lx,top(lx)]);
    pts.push([T1-1,top(T1-1)+0.5,1],[T1+1.4,top(T1)+5],[T1+0.6,top(T1)+11,1],[T1+2.6,top(T1)+15],[T1+2,base(T1)-body*0.42,1],[T1+3.8,base(T1)-body*0.3],[T1+4.6,base(T1)+6,1]);rlShape(x,pts);
    // the coping: stones on edge, leaning a little this way and that
    for(let lx=T0+1;lx<T1-3;){const w=4.6+r()*3.2,hh=4.6+r()*3.4,lean=(r()-0.5)*0.36,cx=lx+w/2,y0=top(cx)+1.2;x.save();x.translate(cx,y0);x.rotate(lean);
      rlShape(x,[[-w/2,1.5,1],[-w/2+0.3,-hh*0.7],[-w*0.2,-hh],[w*0.25,-hh*0.96],[w/2-0.2,-hh*0.62],[w/2,1.5,1]]);x.restore();lx+=w+0.5;}
    // the tumbled end: loose stones heaped up to the wall's shoulder
    for(const [lx,ly,rx,ry] of [[3,-3.2,5.4,3.6],[11,-4,6,4.4],[7,-10,4.8,3.6],[16,-9,5.6,4.2],[12.5,-16,5,3.8],[18,-21,4.6,3.6],[-3.5,-1.6,3.6,2.6]]){const cy=base(lx)+ly+3,q=[];for(let k=0;k<7;k++){const a=k/7*Math.PI*2+r()*0.5,rr=0.78+r()*0.36;q.push([lx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr]);}rlBlob(x,q);}
    // fallen stones at the cheek end's foot
    for(const [lx,rx,ry] of [[L-1,4.2,3],[L+6,3.2,2.4]]){const cy=base(lx)+1,q=[];for(let k=0;k<6;k++){const a=k/6*Math.PI*2+r()*0.6,rr=0.8+r()*0.3;q.push([lx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr]);}rlBlob(x,q);}
  });return{sp,X,Y,k:1,w:L,wr:[12,L-8]};}
// ---------- each place: its pieces (sprite, x), its dressing, its run
const RL={};
function rlBuild(lv,S){const key=lv+"@"+S.toFixed(3);if(RL[key])return RL[key];const B=(k,seed,o)=>LP.building(k,mvRng(seed),Object.assign({detail:2},o),S),G=x=>rlGround(lv,x);
  const put=(sp,x,w,k,o)=>{let y=-1e9;for(let q=x;q<=x+w;q+=4)y=Math.max(y,G(q));return Object.assign({sp,X:x,Y:y+3,k:k||1,w},o||{});};
  const flatSp=(w,h,ox,oy,fn)=>c2Sprite(S,w,h,ox,oy,fn),onFlat=(fn,wx)=>x=>{x.save();x.translate(0,-LB.GROUND(wx));fn(x);x.restore();};let P;
  if(lv==="night"){const wall=put(flatSp(150,90,10,80,x=>LP.drawWall(x,0,0,130,58,3)),560,130),tomb=put(flatSp(100,60,10,52,rlBoxTomb),800,80),wall2=put(flatSp(130,80,10,70,x=>LP.drawWall(x,0,0,100,44,8)),1500,100);
    P={pieces:[wall,tomb,wall2],dress:(c,cam,t)=>{for(const [x,v] of [[300,3],[380,4],[470,1],[1000,5],[1080,2],[1380,0],[1440,3],[1690,4]])LP.drawGrave5(c,x-cam,G(x)+4,1.45,v);LP.drawCandle(c,1012-cam,G(1012)+4,t,false);},
      loot:[860,1],run:[["walk",510],["jumpOn",0,575],["walkOn",0,684],["off"],["bank",742],["walk",790],["jumpOn",1,812],["walkOn",1,874],["off"],["walk",1150],["pit"],["walk",1470],["jumpOn",2,1512],["walkOn",2,1594],["off"],["walk",1900]]};}
  else if(lv==="storm"){const crate=(w,h,sd,rot)=>flatSp(w+16,h+16,8,h+10,x=>rlCrate(x,0,w,h,sd,rot)),brl=put(flatSp(46,56,8,48,x=>rlBarrel(x,0,30,40,41)),396,30),cA=put(crate(48,46,43,0),428,48),cC=put(crate(42,40,45,0.015),478,42),
      cB={sp:crate(40,38,44,-0.035),X:440,Y:cA.Y-46.5,k:1,w:40},cart=put(flatSp(176,88,12,78,rlCart),826,110,1,{wr:[38,100]}),
      pile2=put(flatSp(96,64,8,54,x=>{rlCrate(x,0,44,42,51,0.02);rlBarrel(x,45,28,36,52);}),1556,74);
    P={pieces:[brl,cA,cC,cB,cart,pile2],dress:(c,cam,t)=>{for(const x of [120,640,1060,1420,1760])LP.drawStreetLamp(c,x-cam,G(x),LB.pal.GOLD_LIGHT);LP.drawWell(c,1300-cam,G(1300));},
      loot:[884,4],run:[["bank",280],["walk",370],["jumpOn",0,406],["walkOn",0,418],["jumpOn",3,452],["walkOn",3,470],["offTo",2,494],["walkOn",2,512],["off"],["walk",812],["jumpOn",4,862],["walkOn",4,920],["off"],["walk",1150],["pit"],["walk",1520],["jumpOn",5,1568],["walkOn",5,1622],["off"],["walk",1900]]};}
  else if(lv==="dawn"){const wall=rlDryWall(S,420,140,44,G,61),dol=put(B("dolmen",21,{w:124,h:62}),640,124),bould=put(flatSp(110,80,10,72,rlBoulders),890,100),cairn=put(flatSp(80,80,40,74,x=>LP.drawCairn(x,0,0,1.3)),1600,60);
    P={pieces:[wall,dol,bould,cairn],dress:(c,cam,t)=>{for(const [x,v] of [[260,0],[598,1],[1160,2],[1500,0],[1760,1]])LP.drawMenhir(c,x-cam,G(x)+2,1,v);},
      loot:[930,2],run:[["walk",370],["jumpOn",0,436],["walkOn",0,548],["off"],["walk",610],["climbOn",1],["walkOn",1,754],["off"],["walk",850],["jumpOn",2,906],["walkOn",2,980],["off"],["drop",1046],["walk",1290],["pit"],["walk",1550],["jumpOn",3,1590],["walkOn",3,1620],["off"],["walk",1900]]};}
  else{const log=put(flatSp(190,70,20,60,onFlat(x=>LP.drawLog(x,0,150,150,30,2),150)),270,150,1,{desp:1}),stump=put(flatSp(166,146,26,138,rlGreatStump),760,110,1,{wr:[35,73]}),rock=put(flatSp(100,60,10,52,rlMossRock),1560,80),st2=put(flatSp(80,70,30,64,x=>LP.drawStumpProp(x,0,0,1.5,1)),420,40);
    P={pieces:[log,st2,stump,rock],dress:(c,cam,t)=>{LP.drawFerns(c,380-cam,380,120,3,G);LP.drawFerns(c,1380-cam,1380,150,4,G);LP.drawShrine(c,1700-cam,G(1700)+2,t,false);},
      loot:[806,2],run:[["walk",222],["jumpOn",0,290],["walkOn",0,400],["off"],["bank",604],["walk",769],["climbOn",2],["walkOn",2,834],["off"],["walk",1190],["pit"],["walk",1500],["jumpOn",3,1574],["walkOn",3,1630],["off"],["walk",1900]]};}
  const desp=w=>{const y0=w.y;w.y=x=>{let m=-1e9;for(let d=-6;d<=6;d+=1.5)m=Math.max(m,y0(Math.max(w.x0,Math.min(w.x1,x+d))));return m;};return w;}; // narrow stubs don't count as standing ground
  P.walks=P.pieces.map(pl=>pl.desp?desp(c2Walk(pl,pl.X-6,pl.X+(pl.w||100)*(pl.k||1)+6,null,60)):pl.wr?c2Walk(pl,pl.X+pl.wr[0]*pl.k,pl.X+pl.wr[1]*pl.k,null,null):c2Walk(pl,pl.X-6,pl.X+(pl.w||100)*(pl.k||1)+6,null,pl.sp.perch?null:60));
  P.G=G;return RL[key]=P;}
// ---------- the run
function rlRun(lv,P){const K=K132,ST=STEP*K,seg=[],G=X=>P.G(X)+1;let x=40,y=G(40);const keys=(ks,st)=>{let a=0;for(const q of ks){if(st<a+q[1])return q[0];a+=q[1];}return ks[ks.length-1][0];};
  const add=(n,fn)=>seg.push({n,fn});
  const walk=(x1,yf)=>{const n=Math.max(1,Math.round(Math.abs(x1-x)/ST)),x0=x;add(n,(st,g)=>{const X=x0+(x1-x0)*st/n;return{P:mvWalk(g),x:X,y:yf(X),lv:1};});x=x1;y=yf(x1);};
  const jump=(x1,y1,h)=>{const x0=x,y0=y,ks=[[PJ.crouch,1],[PJ.launch,1],[PJ.rise,2],[PJ.apex,1],[PJ.fall,2],[PJ.land,1],[PJ.recover,1]];
    add(9,(st)=>{const Pp=keys(ks,st);if(st<1)return{P:Pp,x:x0,y:y0,lv:1};if(st>=7)return{P:Pp,x:x1,y:y1,lv:1};const v=(st-1)/6,top=Math.min(y0,y1)-h,yy=v<0.5?y0+(top-y0)*(1-(1-v*2)*(1-v*2)):top+(y1-top)*((v-0.5)*2)*((v-0.5)*2);return{P:Pp,x:x0+(x1-x0)*v,y:yy};});x=x1;y=y1;};
  const climb=(yf,dx)=>{const x0=x,y0=y,sx=dx?dx/(18*K):1,x1=x0+18*K*sx,y1=yf(x1),h=y0-y1,s=h/(LEDGE*K),pts=[[0,0,0],[1,0,0],[1.5,-2,-30*s,"out"],[2,-2,-30*s],[3.5,-1,-56*s,"out"],[4,-1,-56*s],[4.5,4,-70*s,"out"],[5,4,-70*s],[5.5,16,-96*s,"out"],[6,16,-96*s],[7,18,-96*s]];
    const ks=[[PC.look,1],[PC.grab,1],[PC.pull,2],[PC.knee,1],[PC.rise,1],[PC.stand,1]];add(7,(st)=>{const p=mvPath(pts,st);return{P:keys(ks,st),x:x0+p[0]*K*sx,y:y0+p[1]*K,lv:st>=6};});x=x1;y=y1;};
  const fall=(x1,yf)=>{const x0=x,y0=y,ks=[[PD.drop,1],[PD.fall,2],[PD.land,1],[PD.recover,1]];add(5,(st)=>{const v=Math.min(1,st/3),X=x0+(x1-x0)*v;return{P:keys(ks,st),x:X,y:y0+(yf(X)-y0)*v*v,lv:st>=3};});x=x1;y=yf(x1);};
  const face=(top)=>{const Pt=RL_PTS[lv];let f=null;for(let i=0;i<Pt.length-1;i++)if(Pt[i][2]==="b"&&Pt[i][0]<=top)f=[Pt[i][0],Pt[i+1][0]];return f;};
  const up=(x1,y1)=>{if(y-y1<=72)jump(x1,y1,26);else climb(X=>y1);};
  for(const c of P.run){const k=c[0];
    if(k==="walk")walk(c[1],G);
    else if(k==="jumpOn"){const w=P.walks[c[1]];up(c[2],w.y(c[2]));}
    else if(k==="climbOn"){const w=P.walks[c[1]];climb(w.y);}
    else if(k==="walkOn"){const w=P.walks[c[1]];walk(c[2],w.y);}
    else if(k==="off")fall(x+14,G);
    else if(k==="offTo"){const w=P.walks[c[1]];fall(c[2],w.y);}
    else if(k==="drop"){const f=face(c[1]);walk(f[0]-2,G);fall(c[1],G);}
    // up a bank: a jump from its foot if it is low enough, otherwise a scramble up its broken face
    else if(k==="bank"){const f=face(c[1]),top=c[1];if(G(f[0]-6)-G(top)<=72){if(x<f[0]-6)walk(f[0]-6,G);jump(top,G(top),26);}else{if(x<f[0]-3)walk(f[0]-3,G);climb(G,f[1]+5-x);walk(top,G);}}
    else if(k==="pit"){const pr=RL_PIT[lv][1]+8;walk(RL_PIT[lv][0]-22,G);jump(pr,G(pr),58*K);}}
  add(8,(st,g)=>({P:mvIdle(g),x,y:G(x),lv:1}));let a=0;for(const z of seg){z.s0=a;a+=z.n;}return{seg,total:a};}
function rlAt(run,S){S=Math.max(0,Math.min(run.total-0.001,S));for(const z of run.seg)if(S<z.s0+z.n)return z.fn(S-z.s0,Math.floor(S));return run.seg[run.seg.length-1].fn(0,0);}
// ---------- drawing
class RollScene extends LP.Scene{play(ctx,s,W,t,camX,o){if(this.fn)this.fn(ctx,s,W,t,o);}fore(ctx,s,W,t,lx,o){if(!this.noFore)super.fore(ctx,s,W,t,lx,o);}}
const _rls={};function rollScene(s){const sc=Math.min(2,Math.max(0.5,Math.round(s*4)/4));return _rls[sc]||(_rls[sc]=new RollScene(5,sc));}
// a bank's face dressed so its line is broken: stones jutting out of it, and the place's own touch: roots hanging over the forest's lip,
// grass over the graveyard's and the moor's, set stones in the old town's
function rlFaces(c,T,cam,W,G){const Pt=T.pts,lv=T.lv,SD=T.seed;c.fillStyle=C2_INK;c.strokeStyle=C2_INK;c.lineCap="round";
  for(let i=0;i<Pt.length-1;i++){if(Pt[i][2]!=="b")continue;const a0=Pt[i][0],a1=Pt[i+1][0];if(a1<cam-40||a0>cam+W+40)continue;
    const up=Pt[i+1][1]>Pt[i][1],d=up?-1:1,r=mvRng(SD*3+i),top=up?a1:a0,F=u=>a0+(a1-a0)*u;
    // the face's own outline pushed out into the air in small, uneven jags, so no pitch is one straight line (ink is only ever added)
    const path=[];for(let X=a0-4;X<=a1+4;X+=1)path.push([X,G(X)]);const len=[0];for(let k=1;k<path.length;k++)len.push(len[k-1]+Math.hypot(path[k][0]-path[k-1][0],path[k][1]-path[k-1][1]));
    const L=len[len.length-1],jag=[];let k=0;for(let a=0;a<=L;a+=3.2){while(k<len.length-2&&len[k+1]<a)k++;const p0=path[k],p1=path[k+1],f=(a-len[k])/Math.max(1e-6,len[k+1]-len[k]),px=p0[0]+(p1[0]-p0[0])*f,py=p0[1]+(p1[1]-p0[1])*f,
      tl=Math.hypot(p1[0]-p0[0],p1[1]-p0[1])||1,tx=(p1[0]-p0[0])/tl,ty=(p1[1]-p0[1])/tl,amp=Math.sin(Math.PI*a/L)*(1-Math.abs(tx)*0.7)*(1.2+Math.abs(rlNoise(SD+i*5,a/5))*4.2);jag.push([px+ty*amp,py-tx*amp]);}
    c.beginPath();c.moveTo(jag[0][0]-cam,jag[0][1]);for(const q of jag)c.lineTo(q[0]-cam,q[1]);c.lineTo(a1+4-cam,G(a1+4)+40);c.lineTo(a0-4-cam,G(a0-4)+40);c.closePath();c.fill();
    for(const u of [0.14,0.36,0.58,0.8]){const X=F(u+(r()-0.5)*0.08),Y=G(X)+3+r()*4,rad=3.4+r()*3.2,cx=X-cam+d*rad*0.55,pts=[],n=lv==="storm"?5:7;
      for(let k=0;k<n;k++){const ang=k/n*Math.PI*2+(lv==="storm"?0.6:r()*0.5),rr=rad*(lv==="storm"?0.95+r()*0.1:0.75+r()*0.4);pts.push([cx+Math.cos(ang)*rr*1.25,Y+Math.sin(ang)*rr*0.8]);}rlBlob(c,pts);}
    if(lv==="mist")for(let k=0;k<3;k++){const X0=top-d*(3+k*5),Y0=G(X0)+3,L=18+r()*22;rlTaper(c,[X0-cam,Y0],[X0-cam+d*(6+r()*5),Y0+L*0.45],[X0-cam+d*(3+r()*4),Y0+L],2.8,0.7,8);}
    if(lv==="night"||lv==="dawn")for(let k=0;k<6;k++){const X0=top-d*(1+k*2.6+r()),Y0=G(X0)+1.5,h=4+r()*5;c.lineWidth=1.2;c.beginPath();c.moveTo(X0-cam,Y0);c.quadraticCurveTo(X0-cam+d*1.5,Y0-h*0.6,X0-cam+d*(2+r()*2.5),Y0-h);c.stroke();}}}
// the ground with its pits: solid between the pits, each pit a gap showing the air (ragged walls, lit lips, the place's dressing)
function rlPath(c,T,cam,W,G){const lv=T.lv,A=LB.pal.AIR[lv],ink=C2_INK,pits=T.pits.filter(p=>p[1]>cam-80&&p[0]<cam+W+80);c.fillStyle=ink;
  const segs=[];let x0=cam-20;for(const [pl,pr] of pits){segs.push([x0,pl+8]);x0=pr-8;}segs.push([x0,cam+W+20]);
  for(const sg of segs){if(sg[1]<sg[0])continue;c.beginPath();c.moveTo(sg[0]-cam,LB.LH+400);for(let x=Math.floor(sg[0]/2)*2;x<=sg[1];x+=2)c.lineTo(x-cam,G(x));c.lineTo(sg[1]-cam,G(sg[1]));c.lineTo(sg[1]-cam,LB.LH+400);c.closePath();c.fill();}
  for(const [pl,pr] of pits){const gt=Math.min(G(pl),G(pr)),g=c.createLinearGradient(0,gt,0,LB.LH+60);g.addColorStop(0,LP.mixc(ink,A,0.5));g.addColorStop(0.5,LP.mixc(ink,A,0.2));g.addColorStop(1,ink);
    // the pit's walls ragged, not ruled: each steps in and out a little on the way down
    const wall=(x0,d,sd)=>{const out=[];for(let k=0;k<=16;k++){const y=G(x0)+k*6.5;out.push([x0+d*(Math.min(k,2)*1.2+k*0.25+Math.abs(rlNoise(sd,k*0.9))*5.2*Math.min(1,k/2)),y]);}return out;},wl=wall(pl,1,71+pl),wr=wall(pr,-1,72+pr);
    c.fillStyle=g;c.beginPath();c.moveTo(pl-cam,G(pl));for(const p of wl)c.lineTo(p[0]-cam,p[1]);c.lineTo(pl+3-cam,LB.LH+400);c.lineTo(pr-3-cam,LB.LH+400);for(let i=wr.length-1;i>=0;i--)c.lineTo(wr[i][0]-cam,wr[i][1]);for(let X=pr-2;X>pl;X-=2)c.lineTo(X-cam,G(X));c.closePath();c.fill();}
  // a faint rim of the place's light along the ground, so the rolling line reads against the dark layer behind
  const inPit=x=>pits.some(p=>x>p[0]&&x<p[1]);
  c.save();c.strokeStyle=LB.places[lv].edge;c.globalAlpha=0.32;c.lineWidth=1.3;c.beginPath();let on=false;for(let x=Math.floor(cam/2)*2-10;x<=cam+W+10;x+=2){if(inPit(x)){on=false;continue;}const X=x-cam,Y=G(x);on?c.lineTo(X,Y):c.moveTo(X,Y);on=true;}c.stroke();c.restore();
  rlFaces(c,T,cam,W,G);c.fillStyle=ink;
  // each pit's lips lit, and its dressing: the open grave's earth and spade; the ravine's roots; the bog's far water
  for(const [pl,pr] of pits){
  c.save();c.strokeStyle=LB.places[lv].edge;c.lineWidth=2;c.lineCap="round";for(const [a,b] of [[pl-12,pl],[pr,pr+12]]){c.beginPath();c.moveTo(a-cam,G(a));c.lineTo(b-cam,G(b));c.stroke();}c.restore();
  c.fillStyle=ink;c.strokeStyle=ink;if(lv==="night"){c.beginPath();c.moveTo(pr+2-cam,G(pr));c.quadraticCurveTo(pr+16-cam,G(pr)-16,pr+34-cam,G(pr+34));c.closePath();c.fill();c.lineWidth=2.2;c.beginPath();c.moveTo(pr+20-cam,G(pr)-8);c.lineTo(pr+26-cam,G(pr)-40);c.stroke();c.fillRect(pr+21-cam,G(pr)-46,9,3);}
  else if(lv==="mist"){c.lineCap="round";for(const [x,d,l] of [[pl-2,1,40],[pl+2,1,26],[pr+2,-1,34],[pr-1,-1,22]]){c.lineWidth=2;c.beginPath();c.moveTo(x-cam,G(x)+4);c.quadraticCurveTo(x+d*6-cam,G(x)+l*0.5,x+d*3-cam,G(x)+l);c.stroke();}}
  else if(lv==="dawn"){c.strokeStyle=rgbaS("#dbe7ff",0.45);c.lineWidth=1.2;c.beginPath();c.moveTo(pl+8-cam,LB.LH-28);c.lineTo(pr-8-cam,LB.LH-28);c.stroke();}}}
function loopRoll(cv,t,lvAll,R,K,lvFixed){const lv=lvFixed||lvAll,S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d");
  if(!K.off||K.off.width!==cv.width||K.off.height!==cv.height){K.off=LP.mk(cv.width,cv.height);K.scr=LP.mk(cv.width,cv.height);K.base=LP.mk(cv.width,cv.height);}
  const P=rlBuild(lv,S);if(!P.runR)P.runR=rlRun(lv,P);const run=P.runR,total=run.total/R+0.6,tt=t%total,Sx=tt*R,e=LB.places[lv].edge,sc=rollScene(S),L=LB.places[lv],base=L.lift||0;
  const q=rlAt(run,Sx),cam=Math.max(0,Math.min(2000-W,q.x-W*0.32)),rise=rlRise(lv,q.x);
  sc.fn=(x,s,W2,t2)=>{rlPath(x,rlT(lv),cam,W2,P.G);P.dress(x,cam,t2);
    x.save();x.translate(-cam,0);P.pieces.forEach((pl,i)=>{c2Draw(x,pl);const w=P.walks[i];c2Lit(x,w,w.x0,w.x1,e);});
    const lw=P.walks[P.loot[1]],lx=P.loot[0],ly=lw.y(lx)+1;if(!K.pk||Sx<K.pkS)K.pk=null;
    const Gm=mvDraw(x,q.x,q.y,q.P,Math.floor(Sx)/R,1,e,K132,{feet:!!q.lv}),ch=mvPt(Gm,q.P,q.x,q.y,1,K132,4,-22);
    if(!K.pk&&q.x>=lx-14&&Math.abs(q.y-ly)<6)K.pk={s:Sx};K.pkS=Sx;if(!K.pk)drawLoot(x,"rune",lx,ly,t2);else drawLootPick(x,"rune",lx,ly,ch[0],ch[1],(Sx-K.pk.s)/R/0.5,t2);
    x.restore();};
  const opts=LB.options(lv,{walking:false}),dy=Math.round(rise*S),oc=K.off.getContext("2d"),st=oc.setTransform,gt=oc.getTransform;
  oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,K.off.width,K.off.height);
  // the camera rises: every transform the scene sets is lowered by the rise, so each layer lands where its own rate puts it, up to the top
  oc.setTransform=function(a,b,c2,d,e,f){if(typeof a==="object"&&a)return st.call(this,a.a,a.b,a.c,a.d,a.e,a.f+dy);return st.call(this,a,b,c2,d,e,f+dy);};
  oc.getTransform=function(){const m=gt.call(this);return new DOMMatrix([m.a,m.b,m.c,m.d,m.e,m.f-dy]);};
  L.lift=base+rise;sc.noFore=true;
  try{sc.render(oc,K.scr,S,W,t,cam,opts);}finally{oc.setTransform=st;oc.getTransform=gt;L.lift=base;sc.noFore=false;sc.fn=null;}
  c.setTransform(1,0,0,1,0,0);c.drawImage(K.off,0,0);c.setTransform(S,0,0,S,0,0);
  if(rise>0.5){const vg=c.createRadialGradient(W/2,LB.LH*0.45+dy/S,LB.LH*0.35,W/2,LB.LH*0.5+dy/S,W*0.72);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,"+(L.vig||0.5)+")");c.fillStyle=vg;c.fillRect(0,0,W,dy/S);}
  if(lv==="storm"&&rise>1){c.save();c.beginPath();c.rect(0,0,W,dy/S+1);c.clip();LP.drawRain(c,W,t,1,false);c.restore();}
  sc.fore(c,S,W,t,cam*1.35,LB.options(lv,{walking:false}));scFade(c,W,LB.LH,tt>total-0.4?(tt-(total-0.4))/0.4:(tt<0.25?1-tt/0.25:0));}

/* ======================================== mvlevel.js ======================================== */
/* ============================== 4b round 5e: hill sections, and a whole level built from them ==============================
   Seven section shapes, each starting and ending on the floor, their heights a share of the place's maximum (so the same section is a
   mound in the old town and a hill on the moor). Each place strings ten of them in its own order, never the same one twice running, with a
   flat lead-in at the start and the flat boss arena at the end. The checkpoints sit at the start, after the fifth section, and at the boss
   door. The fly-through shows a place's whole level at about seven times walking pace, with a map of the level along the bottom. */
const LV_SEC={
  A:{name:"Ripples",L:820,pts:[[0,0,"s"],[210,0.14,"s"],[420,0.05,"s"],[630,0.17,"s"]],spots:[210,630]},
  B:{name:"Long climb, crag drop",L:980,pts:[[0,0,"s"],[520,0.68,"s"],[660,0.78,"b"],[688,0.36,"s"],[900,0,"f"]],spots:[590]},
  C:{name:"Bank and plateau",L:940,pts:[[0,0,"f"],[60,0,"b"],[88,0.42,"f"],[330,0.46,"s"],[460,0.58,"s"],[840,0,"f"]],spots:[200]},
  D:{name:"Pit in the dip",L:860,pts:[[0,0,"s"],[170,0.24,"s"],[360,0,"f"],[440,0,"s"],[620,0.2,"s"],[800,0,"f"]],pits:[[378,422]],spots:[170,620]},
  E:{name:"The big hill",L:1000,pts:[[0,0,"s"],[300,0.5,"b"],[328,0.86,"s"],[540,1,"s"],[880,0,"f"]],spots:[520]},
  F:{name:"Terraces",L:920,pts:[[0,0,"f"],[40,0,"b"],[68,0.28,"f"],[230,0.31,"b"],[258,0.6,"s"],[440,0.68,"s"],[820,0,"f"]],spots:[150,440]},
  G:{name:"Mound between pits",L:900,pts:[[0,0,"f"],[130,0,"s"],[310,0.32,"s"],[480,0.27,"s"],[680,0,"f"]],pits:[[64,108],[740,784]],spots:[390]}};
const LV_ORDER={night:"ACDBFGEDAF",storm:"AFDCBGEADC",dawn:"ABDEFGCDEA",mist:"ACGFEDBADF"};
const LV_LEAD=300,LV_ARENA=1300;
// the level's terrain, in the same form as round 5d's stretches (rlT), so the same ground, banks, pits and camera rise draw it
const _lvT={};
function lvTerrain(lv){if(_lvT[lv])return _lvT[lv];const pts=[[0,0,"f"]],pits=[],secs=[];let x=LV_LEAD;const ord=LV_ORDER[lv];
  for(let i=0;i<ord.length;i++){const S=LV_SEC[ord[i]];secs.push({id:ord[i],x0:x,x1:x+S.L});for(const p of S.pts)if(p[0]<S.L)pts.push([x+p[0],p[1],p[2]]);for(const q of S.pits||[])pits.push([x+q[0],x+q[1]]);x+=S.L;}
  const arena=x;pts.push([arena,0,"f"]);const len=arena+LV_ARENA;pts.push([len,0,"f"],[len+4000,0,"f"]);
  const cps=[{x:120,name:"start"},{x:secs[4].x1,name:"middle"},{x:arena+60,name:"boss door"}];
  return _lvT[lv]={key:"level-"+lv,lv,pts,pits,max:RL_MAX[lv],seed:RL_SEED[lv]+100,rough:RL_ROUGH[lv],len,arena,secs,cps};}
// each place's pieces (the same as round 5d's), one on each section's crest or plateau in turn, and its scenery scattered
const _lvP={};
function lvBuild(lv,S){const key=lv+"@"+S.toFixed(3);if(_lvP[key])return _lvP[key];const T=lvTerrain(lv),G=x=>tGround(T,x);
  const B=(k,seed,o)=>LP.building(k,mvRng(seed),Object.assign({detail:2},o),S),sp=(w,h,ox,oy,fn)=>c2Sprite(S,w,h,ox,oy,fn),onFlat=(fn,wx)=>x=>{x.save();x.translate(0,-LB.GROUND(wx));fn(x);x.restore();};
  const put=(s,x,w,k,o)=>{let y=-1e9;for(let q=x;q<=x+w*(k||1);q+=4)y=Math.max(y,G(q));return Object.assign({sp:s,X:x,Y:y+3,k:k||1,w},o||{});};
  let kinds;
  if(lv==="night"){const a=sp(150,90,10,80,x=>LP.drawWall(x,0,0,130,58,3)),b=sp(100,60,10,52,rlBoxTomb),c=sp(130,80,10,70,x=>LP.drawWall(x,0,0,100,44,8));kinds=[[X=>put(a,X,130),130],[X=>put(b,X,80),80],[X=>put(c,X,100),100]];}
  else if(lv==="storm"){const a=sp(96,64,8,54,x=>{rlCrate(x,0,44,42,51,0.02);rlBarrel(x,45,28,36,52);}),b=sp(176,88,12,78,rlCart),c=sp(64,62,8,56,x=>rlCrate(x,0,48,46,43,0));kinds=[[X=>put(a,X,74),74],[X=>put(b,X,110,1,{wr:[38,100]}),110],[X=>put(c,X,48),48]];}
  else if(lv==="dawn"){const b=B("dolmen",21,{w:124,h:62}),c=sp(110,80,10,72,rlBoulders),d=sp(80,80,40,74,x=>LP.drawCairn(x,0,0,1.3));let n=0;kinds=[[X=>rlDryWall(S,X,140,44,G,61+(n++)),140],[X=>put(b,X,124),124],[X=>put(c,X,100),100],[X=>put(d,X,60),60]];}
  else{const a=sp(190,70,20,60,onFlat(x=>LP.drawLog(x,0,150,150,30,2),150)),b=sp(80,70,30,64,x=>LP.drawStumpProp(x,0,0,1.5,1)),c=sp(166,146,26,138,rlGreatStump),d=sp(100,60,10,52,rlMossRock);
    kinds=[[X=>put(a,X,150,1,{desp:1}),150],[X=>put(b,X,40),40],[X=>put(c,X,110,1,{wr:[35,73]}),110],[X=>put(d,X,80),80]];}
  const pieces=[];let n=0;for(const s of T.secs){for(const c of LV_SEC[s.id].spots){const [mk,w]=kinds[n++%kinds.length];pieces.push(mk(s.x0+c-w/2));}}
  const desp=w=>{const y0=w.y;w.y=x=>{let m=-1e9;for(let d=-6;d<=6;d+=1.5)m=Math.max(m,y0(Math.max(w.x0,Math.min(w.x1,x+d))));return m;};return w;};
  const walks=pieces.map(pl=>pl.desp?desp(c2Walk(pl,pl.X-6,pl.X+pl.w*pl.k+6,null,60)):pl.wr?c2Walk(pl,pl.X+pl.wr[0]*pl.k,pl.X+pl.wr[1]*pl.k,null,null):c2Walk(pl,pl.X-6,pl.X+pl.w*pl.k+6,null,pl.sp.perch?null:60));
  // scenery: kept off pits, bank faces and pieces
  const r=mvRng(RL_SEED[lv]*31),banks=[];for(let i=0;i<T.pts.length-1;i++)if(T.pts[i][2]==="b")banks.push([T.pts[i][0],T.pts[i+1][0]]);
  const clear=(x,m)=>!T.pits.some(p=>x>p[0]-m-20&&x<p[1]+m+20)&&!banks.some(b=>x>b[0]-m-12&&x<b[1]+m+12)&&!pieces.some(p=>x>p.X-m&&x<p.X+p.w*p.k+m);
  const dress=[],gap={night:[110,190],storm:[360,480],dawn:[300,460],mist:[420,600]}[lv];
  for(let x=180;x<T.arena-100;x+=gap[0]+r()*(gap[1]-gap[0])){if(clear(x,lv==="mist"?70:14))dress.push([x,Math.floor(r()*6)]);}
  const P={T,G,pieces,walks,dress};return _lvP[key]=P;}
function lvDress(c,P,cam,W,t){const lv=P.T.lv,G=P.G;for(const [x,v] of P.dress){if(x<cam-160||x>cam+W+160)continue;const X=x-cam;
  if(lv==="night"){LP.drawGrave5(c,X,G(x)+4,1.45,v);if(v===2)LP.drawCandle(c,X+26,G(x+26)+4,t,false);}
  else if(lv==="storm"){if(v===5)LP.drawWell(c,X,G(x));else LP.drawStreetLamp(c,X,G(x),LB.pal.GOLD_LIGHT);}
  else if(lv==="dawn")LP.drawMenhir(c,X,G(x)+2,1,v%3);
  else{if(v===5)LP.drawShrine(c,X,G(x)+2,t,false);else LP.drawFerns(c,X,x,110+v*10,v,G);}}}
// the place's edge colours are rgba strings: the same colour at another strength
const lvA=(e,a)=>/^rgba/.test(e)?e.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/,"rgba($1,$2,$3,"+a+")"):LP.rgba(e,a);
// the level's map, in its own strip under the picture: the whole profile, the sections lettered, the pits, the checkpoints (gold), and
// the stretch on screen now. Drawn in map units: 50 high.
function lvMap(c,T,Wm,cam,Wv){const L=T.len,m=14,sx=x=>m+x/L*(Wm-2*m),k=24/270,base=44;
  c.fillStyle="#0d0a0c";c.fillRect(0,0,Wm,50);
  const e=LB.places[T.lv].edge,inPit=x=>T.pits.some(p=>x>p[0]&&x<p[1]);c.fillStyle=lvA(e,0.22);c.strokeStyle=e;c.lineWidth=1.1;
  c.beginPath();let on=false;for(let x=0;x<=L;x+=L/900){const X=sx(x),Y=base-tHill(T,x)*k;if(inPit(x)){if(on){c.lineTo(X,base);c.closePath();}on=false;continue;}if(!on){c.moveTo(X,base);on=true;}c.lineTo(X,Y);}if(on){c.lineTo(sx(L),base);c.closePath();}c.fill();
  c.beginPath();on=false;for(let x=0;x<=L;x+=L/900){const X=sx(x),Y=base-tHill(T,x)*k;if(inPit(x)){on=false;continue;}on?c.lineTo(X,Y):c.moveTo(X,Y);on=true;}c.stroke();
  c.font="500 9px 'Alegreya Sans', sans-serif";c.textAlign="center";c.fillStyle=lvA(e,0.85);
  for(const s of T.secs){c.fillText(s.id,sx((s.x0+s.x1)/2),11);c.fillRect(sx(s.x0),base+1,0.8,3);}c.fillText("boss",sx(T.arena+LV_ARENA/2),11);
  for(const p of T.cps){const X=sx(p.x);c.fillStyle=MV_GOLD;c.beginPath();c.moveTo(X,base-12);c.lineTo(X+2.6,base-8.5);c.lineTo(X,base-5);c.lineTo(X-2.6,base-8.5);c.closePath();c.fill();}
  c.strokeStyle="rgba(255,231,176,0.9)";c.lineWidth=1.2;c.strokeRect(sx(cam),14,Math.max(3,sx(cam+Wv)-sx(cam)),34);}
function loopLevel(cv,t,lvAll,R,K,lvFixed){const lv=lvFixed||lvAll,MH=Math.round(Math.max(cv.height*0.11,cv.width*0.05)),S=(cv.height-MH)/LB.LH,W=cv.width/S,c=cv.getContext("2d");
  if(!K.off||K.off.width!==cv.width||K.off.height!==cv.height){K.off=LP.mk(cv.width,cv.height);K.scr=LP.mk(cv.width,cv.height);}
  const P=lvBuild(lv,S),T=P.T,V=640,dur=(T.len-W)/V,total=dur+1.6,tt=t%total,cam=Math.max(0,Math.min(T.len-W,(tt-0.6)*V)),e=LB.places[lv].edge,sc=rollScene(S),L=LB.places[lv],base=L.lift||0;
  const rise=tRise(T,cam+W*0.32);
  sc.fn=(x,s,W2,t2)=>{rlPath(x,T,cam,W2,P.G);lvDress(x,P,cam,W2,t2);x.save();x.translate(-cam,0);
    P.pieces.forEach((pl,i)=>{if(pl.X>cam+W2+40||pl.X+pl.w*pl.k<cam-40)return;c2Draw(x,pl);const w=P.walks[i];c2Lit(x,w,w.x0,w.x1,e);});x.restore();};
  const opts=LB.options(lv,{walking:false}),dy=Math.round(rise*S),oc=K.off.getContext("2d"),st=oc.setTransform,gt=oc.getTransform;
  oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,K.off.width,K.off.height);
  oc.setTransform=function(a,b,c2,d,e2,f){if(typeof a==="object"&&a)return st.call(this,a.a,a.b,a.c,a.d,a.e,a.f+dy);return st.call(this,a,b,c2,d,e2,f+dy);};
  oc.getTransform=function(){const m=gt.call(this);return new DOMMatrix([m.a,m.b,m.c,m.d,m.e,m.f-dy]);};
  L.lift=base+rise;sc.noFore=true;
  try{sc.render(oc,K.scr,S,W,t,cam,opts);}finally{oc.setTransform=st;oc.getTransform=gt;L.lift=base;sc.noFore=false;sc.fn=null;}
  c.setTransform(1,0,0,1,0,0);c.drawImage(K.off,0,0);c.setTransform(S,0,0,S,0,0);
  if(rise>0.5){const vg=c.createRadialGradient(W/2,LB.LH*0.45+dy/S,LB.LH*0.35,W/2,LB.LH*0.5+dy/S,W*0.72);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,"+(L.vig||0.5)+")");c.fillStyle=vg;c.fillRect(0,0,W,dy/S);}
  if(lv==="storm"&&rise>1){c.save();c.beginPath();c.rect(0,0,W,dy/S+1);c.clip();LP.drawRain(c,W,t,1,false);c.restore();}
  sc.fore(c,S,W,t,cam*1.35,LB.options(lv,{walking:false}));scFade(c,W,LB.LH,tt>total-0.4?(tt-(total-0.4))/0.4:(tt<0.3?1-tt/0.3:0));
  const d=MH/50;c.setTransform(d,0,0,d,0,cv.height-MH);lvMap(c,T,cv.width/d,cam,W);c.setTransform(1,0,0,1,0,0);}
// the sections sheet: the seven shapes side by side, drawn at the moor's scale, pits as gaps and banks as broken faces
function loopSecs(cv,t,lvAll,R,K){if(K.done)return;K.done=1;const c=cv.getContext("2d"),Wc=cv.width,Hc=cv.height,cols=Wc/Hc>1.4?4:2,rows=Math.ceil(7/cols),cw=Wc/cols,ch=Hc/rows,d=Math.min(2,window.devicePixelRatio||1);
  c.setTransform(1,0,0,1,0,0);c.fillStyle="#0d0a0c";c.fillRect(0,0,Wc,Hc);const ids="ABCDEFG";
  for(let i=0;i<7;i++){const id=ids[i],Sx=LV_SEC[id],T={key:"sec-"+id,lv:"dawn",pts:Sx.pts.concat([[Sx.L,0,"f"],[Sx.L+400,0,"f"]]),pits:Sx.pits||[],max:270,seed:90+i,rough:0},X0=(i%cols)*cw,Y0=Math.floor(i/cols)*ch,pad=10*d;
    const sx=x=>X0+pad+x/1000*(cw-2*pad),base=Y0+ch-pad*1.2,k=(ch-pad*4.6)/270,inPit=x=>T.pits.some(p=>x>p[0]&&x<p[1]);
    c.fillStyle="#17121a";c.fillRect(X0+pad*0.5,Y0+pad*0.5,cw-pad,ch-pad);
    c.fillStyle="#060508";c.beginPath();let on=false;for(let x=0;x<=Sx.L;x+=2){const X=sx(x),Y=base-tHill(T,x)*k;if(inPit(x)){if(on){c.lineTo(X,base+2);c.closePath();}on=false;continue;}if(!on){c.moveTo(X,base+2);on=true;}c.lineTo(X,Y);}if(on){c.lineTo(sx(Sx.L),base+2);c.closePath();}c.fill();
    c.strokeStyle="#bcd2ff";c.lineWidth=1.2*d;c.beginPath();on=false;for(let x=0;x<=Sx.L;x+=2){const X=sx(x),Y=base-tHill(T,x)*k;if(inPit(x)){on=false;continue;}on?c.lineTo(X,Y):c.moveTo(X,Y);on=true;}c.stroke();
    c.strokeStyle="rgba(188,210,255,0.25)";c.setLineDash([3*d,3*d]);c.beginPath();c.moveTo(sx(0),base-135*k);c.lineTo(sx(Sx.L),base-135*k);c.stroke();c.setLineDash([]);
    c.fillStyle="#f3dfb4";c.font=`${Math.round(Math.min(15*d,cw/15))}px 'IM Fell English', serif`;c.textAlign="left";c.fillText(id+"  "+Sx.name,X0+pad*1.4,Y0+pad*2.6);
    c.fillStyle="#a99a86";c.font=`${Math.round(11*d)}px 'Alegreya Sans', sans-serif`;c.fillText(Sx.L+" long"+(Sx.pits?", "+Sx.pits.length+" pit"+(Sx.pits.length>1?"s":""):""),X0+pad*1.4,Y0+pad*4);}
  const i=7,X0=(i%cols)*cw,Y0=Math.floor(i/cols)*ch,pad=10*d;if(i<cols*rows){c.fillStyle="#a99a86";c.font=`${Math.round(12*d)}px 'Alegreya Sans', sans-serif`;c.textAlign="left";
    const lines=["Drawn at the moor's height.","The dashed line is half of it:","the old town's tallest."];lines.forEach((s,j)=>c.fillText(s,X0+pad*1.4,Y0+pad*2.6+j*16*d));}}

/* ======================================== mvlamp.js ======================================== */
/* ============================== 4b round 6: the checkpoint lanterns ==============================
   A lantern on a post that lights as the wanderer passes (the gameplay note: start, middle, boss door). The lantern is the wanderer's own
   lantern made big (ring, links, a pointed cap, a tapered glass box, a tray), so a checkpoint reads as "his light". Three directions for the
   post: A the waymark post with an arm (one post everywhere), B each place's own post, C the pilgrim's crook (one post everywhere).
   Unlit: dark glass with a cold glint, and the place's lit edge round post and lantern, so it can be seen ahead. Lighting (0.5 s): a gold
   spark leaps from the wanderer's lantern, the glass flares white-gold with a ring and a burst of motes, then settles. Lit: gold glass, a
   flickering flame, a halo, a pool of light on the ground, motes rising. Gold only: the lantern's light, never ember. */
const CP_PK=1.2,CP_LK=1.3; // the posts and the lantern drawn larger than first sketched, so a checkpoint stands out at play size
const CP_DIRS={A:"The waymark post",B:"Each place's own post",C:"The pilgrim's crook"};
function cpBlobAt(c,cx,cy,rx,ry,seed){const r=mvRng(seed),q=[];for(let k=0;k<7;k++){const a=k/7*Math.PI*2+r()*0.5,rr=0.78+r()*0.34;q.push([cx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr]);}rlBlob(c,q);}
// the posts, drawn in col with the ground at y 0; each returns the hook the lantern hangs from
function cpPostA(c,col){c.fillStyle=col;c.strokeStyle=col;c.lineCap="round";
  rlBlob(c,[[-14,4],[-12,-2.6],[-4.6,-6.4],[5,-6],[12.4,-2.2],[14.4,4]]); // earth and stones heaped at its foot
  cpBlobAt(c,-9,-3,4.4,3.2,11);cpBlobAt(c,8.6,-2.6,4,3,12);
  rlTaper(c,[0,3],[-2.6,-66],[1.6,-134],9.6,6.6,16); // the post, a little crooked
  rlShape(c,[[-2.2,-133,1],[-1.2,-138.6,1],[0.6,-135,1],[2.4,-139.4,1],[4.8,-133.4,1]]); // its split top
  rlTaper(c,[-1.2,-123],[18,-126.5],[37.5,-121.4],5.8,4.4,10); // the arm, drooping a little at its end
  rlTaper(c,[0.8,-97],[9.4,-106],[19.4,-123],3.8,3,8); // the brace
  c.lineWidth=1.9;c.beginPath();c.moveTo(34,-121.6);c.quadraticCurveTo(35.4,-116,33.6,-113);c.stroke(); // the hook
  return[33.6,-113];}
function cpPostC(c,col){c.fillStyle=col;c.strokeStyle=col;c.lineCap="round";
  cpBlobAt(c,-6,1,5.4,3.8,21);cpBlobAt(c,5.4,1.4,4.6,3.4,22);cpBlobAt(c,0,-3.6,4,3,23); // a few stones holding it
  rlTaper(c,[0,3],[2.8,-72],[-1,-136],5.6,4.4,16); // the staff, wavering
  rlTaper(c,[-1,-135],[1.6,-157],[17,-154],4.4,4,12);rlTaper(c,[17,-154],[28,-151.5],[25.6,-139],4,3.2,10); // its crook
  rlShape(c,[[-2.8,-125.4,1],[3,-126.6,1],[4.8,-121.6],[9.4,-112.6],[7,-104,1],[5.2,-110],[2.6,-105.4,1],[1.4,-114],[-2.6,-120,1]]); // a rag tied below the crook
  return[25.6,-139];}
function cpPostB(c,col,lv){c.fillStyle=col;c.strokeStyle=col;c.lineCap="round";c.lineJoin="round";
  if(lv==="night"){ // the graveyard: a wrought-iron crook on a stone plinth
    rlShape(c,[[-9.4,4,1],[-9,-12.6],[-5.6,-16.4,1],[5.6,-16.4,1],[9,-12.6],[9.4,4,1]]);
    rlTaper(c,[0,-15],[0.8,-76],[0,-136],4.4,3.4,12);rlBlob(c,[[-3.8,-79],[3.8,-79],[4,-74],[-4,-74]]);
    rlShape(c,[[-2.6,-134.6,1],[0,-146,1],[2.6,-134.6,1]]);
    c.lineWidth=2.8;c.beginPath();c.moveTo(0,-128.6);c.bezierCurveTo(14,-133,30,-135,34,-124.6);c.stroke();
    c.lineWidth=1.9;c.beginPath();c.moveTo(34,-124.6);c.bezierCurveTo(36,-118,30,-116,28.4,-120.2);c.bezierCurveTo(27.4,-123.4,31.2,-124.4,31.6,-122);c.stroke();
    c.lineWidth=1.6;c.beginPath();c.moveTo(1.6,-114);c.bezierCurveTo(8,-118,15,-126,21,-130.4);c.stroke();
    c.beginPath();c.moveTo(1.6,-114);c.bezierCurveTo(-1,-116,1,-119,3,-117.6);c.stroke();
    c.lineWidth=1.7;c.beginPath();c.moveTo(24,-132.2);c.quadraticCurveTo(24.8,-128,24,-124.4);c.stroke();return[24,-124.4];}
  if(lv==="storm"){ // the old town: a timber post on a stone bollard, an iron sign bracket (not a street lamp: the lantern hangs, it doesn't sit on top)
    rlShape(c,[[-8.4,4,1],[-8,-17.6],[-4.4,-21.6,1],[4.4,-21.6,1],[8,-17.6],[8.4,4,1]]);
    rlTaper(c,[0,-18],[-0.9,-80],[0.6,-138],7.2,6,12);rlShape(c,[[-4.6,-136.6,1],[0,-143,1],[4.6,-136.6,1]]);
    c.lineWidth=2.6;c.beginPath();c.moveTo(1,-128.4);c.quadraticCurveTo(18,-130,35,-128);c.stroke();
    c.lineWidth=1.8;c.beginPath();c.moveTo(2,-108);c.bezierCurveTo(10,-112,22,-118,28,-127.6);c.stroke();
    c.beginPath();c.moveTo(14,-115.4);c.bezierCurveTo(13,-121,18,-123,19.6,-120);c.bezierCurveTo(20.6,-118,18.4,-116.6,17.4,-118.4);c.stroke();
    rlShape(c,[[34,-131,1],[38,-128.4,1],[34,-125.8,1]]);
    c.lineWidth=1.7;c.beginPath();c.moveTo(31.6,-128.4);c.quadraticCurveTo(32.4,-125,31.6,-121.6);c.stroke();return[31.6,-121.6];}
  if(lv==="dawn"){ // the moor: a gnarled waymark stake, leaning, a peg for the lantern, a cairn at its foot
    for(const [x,y,rx,ry,s] of [[-12,1,6,4,31],[0,0.6,7,4.6,32],[11.4,1,5,3.6,33],[-6,-5.6,5.4,4,34],[5.4,-6.4,5,3.6,35],[0,-11.6,4.4,3.4,36]])cpBlobAt(c,x,y,rx,ry,s);
    rlTaper(c,[0,-4],[-3.4,-70],[4,-134],10,7,16);cpBlobAt(c,-4.6,-58,3.4,4.4,37);cpBlobAt(c,3.6,-100,3,3.8,38);
    rlShape(c,[[1.4,-133,1],[3,-139,1],[5,-134.6,1],[7,-137.6,1],[8,-132,1]]);
    rlTaper(c,[3.4,-117],[16,-123],[27.6,-117.4],4.8,3.6,8);return[26.4,-115.4];}
  // the forest: a sapling pole lashed upright, its top bent over and drooping
  rlBlob(c,[[-8,4],[-5.6,-2],[2,-4.4],[7.6,-1],[8.6,4]]);
  rlTaper(c,[0,3],[-2.4,-90],[8,-138],7.4,5,16);rlTaper(c,[8,-138],[22.4,-153],[32.6,-128],5,3,12);
  rlTaper(c,[3,-109],[-6,-118],[-11,-127],2.4,0.8,6);rlTaper(c,[20.4,-147],[25,-158],[22.6,-165],2,0.6,6);
  for(const [x,y] of [[4.6,-121],[5.6,-126]])rlBlob(c,[[x-4.6,y-1.2],[x+4.6,y-2],[x+4.8,y+0.8],[x-4.4,y+1.6]]);
  return[32.4,-127.6];}
// the lantern, hung from (0,0): frame in col
const CP_GLASS=[[-6.6,21],[6.6,21],[5.6,39.4],[-5.6,39.4]];
function cpFrame(c,col){c.fillStyle=col;c.strokeStyle=col;c.lineCap="round";c.lineJoin="round";
  c.lineWidth=1.6;c.beginPath();c.arc(0,2.4,2.4,0,Math.PI*2);c.stroke();
  c.lineWidth=1.3;c.beginPath();c.ellipse(0,7.2,1.5,2.4,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(0,11.4,1.5,2.4,0,0,Math.PI*2);c.stroke();
  rlShape(c,[[0,12.6,1],[2.6,14.4],[6.6,17.2],[9.6,19.6,1],[-9.6,19.6,1],[-6.6,17.2],[-2.6,14.4]]);
  rlShape(c,[[-9.2,19,1],[9.2,19,1],[8.8,21.4,1],[-8.8,21.4,1]]);
  rlShape(c,[[-9,20,1],[-6.6,20,1],[-5.6,40,1],[-7.9,40,1]]);rlShape(c,[[9,20,1],[6.6,20,1],[5.6,40,1],[7.9,40,1]]);
  rlShape(c,[[-9.8,39.2,1],[9.8,39.2,1],[10.6,42.4],[8.2,44.8,1],[-8.2,44.8,1],[-10.6,42.4]]);}
function cpLantern(c,X,Y,ang,lit,flare,edge,t){c.save();c.translate(X,Y);c.rotate(ang);c.scale(CP_LK,CP_LK);const path=()=>{c.beginPath();CP_GLASS.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();};
  path();c.fillStyle="#241f29";c.fill();
  if(lit<1){c.save();c.globalAlpha=1-lit;c.strokeStyle=lvA(edge,0.7);c.lineWidth=1.2;c.lineCap="round";c.beginPath();c.moveTo(-4.2,23.6);c.lineTo(-2.2,31);c.stroke();c.beginPath();c.arc(-1.6,34.2,0.7,0,Math.PI*2);c.fillStyle=lvA(edge,0.6);c.fill();c.restore();}
  if(lit>0){c.save();c.globalAlpha=lit;path();const g=c.createRadialGradient(0,32,1,0,30,14);g.addColorStop(0,"#fff6dc");g.addColorStop(0.45,MV_GLASS);g.addColorStop(1,"#c98a34");c.fillStyle=g;c.fill();
    const fl=1+0.12*Math.sin(t*5.3)+0.07*Math.sin(t*8.7);c.fillStyle="#fffaf0";c.beginPath();c.moveTo(0,35.6-9*fl);c.quadraticCurveTo(3,32.6,0,36);c.quadraticCurveTo(-3,32.6,0,35.6-9*fl);c.fill();c.restore();}
  if(flare>0){c.save();c.globalAlpha=flare;path();c.fillStyle="#fffaf0";c.fill();c.restore();}
  c.save();c.translate(1.3,-1.3);cpFrame(c,lvA(edge,0.85));c.restore();cpFrame(c,LB.pal.INK);c.restore();
  return[X-Math.sin(ang)*30*CP_LK,Y+Math.cos(ang)*30*CP_LK];}
// a whole checkpoint at (X,Y): post (with its lit edge), lantern, and its light. st = {lit, flare, ring, spark:[from x,y,u]}
function cpDraw(c,dir,lv,X,Y,st,t){const edge=LB.places[lv].edge,post=(col)=>dir==="A"?cpPostA(c,col):dir==="C"?cpPostC(c,col):cpPostB(c,col,lv);
  c.save();c.translate(X,Y);c.scale(CP_PK,CP_PK);c.save();c.translate(1.1,-1.1);post(lvA(edge,0.85));c.restore();const h=post(LB.pal.INK);c.restore();
  const hx=X+h[0]*CP_PK,hy=Y+h[1]*CP_PK,ang=0.05*Math.sin(t*1.6)+0.025*Math.sin(t*2.9),lit=st.lit||0,fl=st.flare||0;
  if(lit>0){c.save();c.globalCompositeOperation="screen";c.translate(hx,Y);c.scale(2.6,0.5);const g=c.createRadialGradient(0,0,0,0,0,26);g.addColorStop(0,rgbaS(MV_GOLD,0.34*lit));g.addColorStop(1,rgbaS(MV_GOLD,0));c.fillStyle=g;c.fillRect(-26,-26,52,52);c.restore();} // the pool on the ground
  const gc=[hx-Math.sin(ang)*30*CP_LK,hy+Math.cos(ang)*30*CP_LK];
  if(lit>0){c.save();const g=c.createRadialGradient(gc[0],gc[1],4,gc[0],gc[1],90);g.addColorStop(0,rgbaS(MV_GOLD,0.2*lit));g.addColorStop(1,rgbaS(MV_GOLD,0));c.fillStyle=g;c.fillRect(gc[0]-90,gc[1]-90,180,180);c.restore();} // a warm wash that still shows on the pale places
  if(lit>0||fl>0){const pu=1+0.05*Math.sin(t*3.1);fxGlowAt(c,gc[0],gc[1],(64+50*fl)*pu,0.5*lit+0.5*fl,MV_GOLD);fxGlowAt(c,gc[0],gc[1],120,0.16*lit,MV_GOLD);}
  cpLantern(c,hx,hy,ang,lit,fl,edge,t);
  if(lit>0||fl>0)fxGlowAt(c,gc[0],gc[1],16+10*fl,0.55*lit+0.4*fl,"#fff0c0");
  if(st.ring>0&&st.ring<1){const u=st.ring;c.save();c.strokeStyle=rgbaS(MV_LAMP,(1-u)*0.9);c.lineWidth=2.4*(1-u)+0.6;c.beginPath();c.arc(gc[0],gc[1],10+40*u,0,Math.PI*2);c.stroke();c.restore();
    const r=mvRng(91);for(let i=0;i<10;i++){const a=r()*Math.PI*2,d=(14+r()*36)*u;fxMote(c,gc[0]+Math.cos(a)*d,gc[1]+Math.sin(a)*d-12*u*u,1.5,1-u,i%3?MV_LAMP:"#fff6dc");}}
  if(lit>0.6){for(let i=0;i<3;i++){const ph=((t*0.45+i/3)%1),x=gc[0]+Math.sin(t*1.7+i*2)*5,y=hy+10-ph*52;fxMote(c,x,y,1.3,Math.sin(ph*Math.PI)*0.85*lit,i%2?MV_LAMP:"#fff6dc");}}
  return gc;}
// the spark leaping from the wanderer's lantern to the checkpoint's glass, with a short tail
function cpSpark(c,from,to,u){const [sx,sy]=from,[ex,ey]=to,mx=(sx+ex)/2,my=Math.min(sy,ey)-34;for(let j=0;j<4;j++){const v=Math.max(0,u-j*0.08),m=1-v,x=m*m*sx+2*m*v*mx+v*v*ex,y=m*m*sy+2*m*v*my+v*v*ey;
  fxGlowAt(c,x,y,18-j*3.5,0.9-j*0.18,MV_GOLD);fxMote(c,x,y,3.2-j*0.6,1-j*0.2,"#fff6dc");}}
// the lighting's timing, s seconds after the wanderer comes within reach: spark 0 to 0.18, flare and ring 0.18 to 0.32, settled by 0.5
function cpState(s){if(s==null||s<0)return{lit:0};const st={lit:0,flare:0,ring:0};if(s<0.18){st.spark=s/0.18;return st;}
  const u=(s-0.18);st.flare=Math.max(0,1-u/0.14)*(u<0.14?1:0)+(u>=0.14&&u<0.32?Math.max(0,1-(u-0.14)/0.18)*0.35:0);st.lit=Math.min(1,u/0.14);st.ring=u<0.5?u/0.5:0;return st;}
// a flat stretch of each place for these scenes
const _cpT={};function cpTerr(lv){return _cpT[lv]||(_cpT[lv]={key:"cp-"+lv,lv,pts:[[0,0,"f"],[8000,0,"f"]],pits:[],max:RL_MAX[lv],seed:RL_SEED[lv]+300,rough:RL_ROUGH[lv],len:8000});}
function cpDress(c,lv,G,cam,t,xs){for(const [x,v] of xs){const X=x-cam;if(lv==="night")LP.drawGrave5(c,X,G(x)+4,1.45,v);else if(lv==="storm")LP.drawWell(c,X,G(x));else if(lv==="dawn")LP.drawMenhir(c,X,G(x)+2,1,v%3);else LP.drawFerns(c,X,x,120,v,G);}}
// the loop: the wanderer walks past an unlit checkpoint, which lights, and walks on
function loopCp(cv,t,lvAll,R,K,dir){const lv=lvAll,S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d");if(!K.scr||K.scr.width!==cv.width||K.scr.height!==cv.height)K.scr=LP.mk(cv.width,cv.height);
  const T=cpTerr(lv),G=x=>tGround(T,x),cam=300,X=cam+W*0.56,ST=STEP*K132,xs=cam+W*0.1,xe=cam+W*1.05,n=Math.round((xe-xs)/ST),dur=n/R,total=dur+1.2,tt=t%total,Sx=Math.min(n,tt*R),wx=xs+Sx*ST,wy=G(wx)+1,sc=rollScene(S),e=LB.places[lv].edge;
  const reach=X-56,sTrig=(reach-xs)/ST/R;
  sc.fn=(x,s,W2,t2)=>{rlPath(x,T,cam,W2,G);cpDress(x,lv,G,cam,t2,[[cam+W*0.22,1],[cam+W*0.86,3]]);x.save();x.translate(-cam,0);
    const P=Sx>=n?mvIdle(Math.floor(tt*R)):mvWalk(Math.floor(Sx)),st=cpState(tt-sTrig);
    const gc=cpDraw(x,dir,lv,X,G(X)+3,st,t2),Gm=mvDraw(x,wx,wy,P,Math.floor(Sx)/R,1,e,K132,{feet:true});
    if(st.spark!=null)cpSpark(x,mvPt(Gm,P,wx,wy,1,K132,13.4,3.5),gc,st.spark); // the spark starts at the wanderer's own lantern
    x.restore();};
  const opts=LB.options(lv,{walking:false});c.setTransform(1,0,0,1,0,0);sc.render(c,K.scr,S,W,t,cam,opts);sc.fn=null;c.setTransform(S,0,0,S,0,0);
  scFade(c,W,LB.LH,tt>total-0.35?(tt-(total-0.35))/0.35:(tt<0.25?1-tt/0.25:0));}
// the sheet: each place, unlit above and lit below, with the wanderer beside for scale
function loopCpSheet(cv,t,lvAll,R,K,dir){if(K.done)return;K.done=1;const c=cv.getContext("2d"),Wc=cv.width,Hc=cv.height,lvs=["night","storm","dawn","mist"],wide=Wc/Hc>1.3,cols=wide?4:2,rows=wide?2:4,cw=160,ch=236,s=Math.min(Wc/(cols*cw),Hc/(rows*ch));
  c.setTransform(1,0,0,1,0,0);c.fillStyle="#0e090b";c.fillRect(0,0,Wc,Hc);
  const cells=[];if(wide){for(const st of [0,1])for(const lv of lvs)cells.push([lv,st]);}else{for(const lv of lvs)for(const st of [0,1])cells.push([lv,st]);}
  cells.forEach(([lv,lit],i)=>{const col=i%cols,row=Math.floor(i/cols),Gy=ch-22;c.setTransform(s,0,0,s,col*cw*s,row*ch*s);c.save();c.beginPath();c.rect(1,1,cw-2,ch-2);c.clip();sheetBg(c,lv,0,cw,ch,Gy);
    const e=LB.places[lv].edge;mvDraw(c,34,Gy+1,mvIdle(0),0,1,e,K132,{feet:true});cpDraw(c,dir,lv,86,Gy+2,{lit},1.3);c.restore();
    c.font='600 11px "Alegreya Sans",sans-serif';c.textBaseline="top";c.textAlign="left";c.fillStyle="#c9a25a";c.fillText((lit?"Lit · ":"Unlit · ")+{night:"Night",storm:"Old town",dawn:"Moor",mist:"Forest"}[lv],6,Gy+5);});}

/* ======================================== mvmon.js ======================================== */
/* ============================== 4b round 7: the monsters' attacks ==============================
   Posable copies of the five monsters, registered beside the design system's own (LP.MONSTER.crawlerP and so on), drawn by the Scene's
   own monsterInto, so the graded card, the ember rim and glow and the ember details are exactly the design system's. Each attack has a
   signal first, in one language for all five: the monster winds up (crouches, draws back, raises its arms), its eyes flare and its ember
   parts (mouth, claws, the walker's hollow chest) burn hotter. Then the attack, then a recovery (the opening). Hit: it jolts back a puppet
   step and its ember rim flares once (the gameplay note's moment); a one-hit monster then breaks into card pieces. Ember for danger only. */
const MO={ember:"#ff7a3a",glow:"#ff5a1f",bone:"#d8ccb6"};
function moLimb(x,ax,ay,segs){let px=ax,py=ay;for(const g of segs){const nx=px+Math.sin(g[1])*g[0],ny=py+Math.cos(g[1])*g[0];LP.cardTaper(x,[px,py,nx,ny,g[2],g[3]]);px=nx;py=ny;}return[px,py];}
function moMouth(c,pts,cx,cy,r){c.save();const g=c.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,"#ffd9a0");g.addColorStop(0.45,MO.ember);g.addColorStop(1,"#5a0c08");
  c.fillStyle=g;c.shadowColor=MO.glow;c.shadowBlur=8;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.restore();}
function moTeeth(c,list){c.save();c.fillStyle=MO.bone;for(const q of list){c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[2],q[3]);c.lineTo(q[4],q[5]);c.closePath();c.fill();}c.restore();}
function moSeam(c,pts,w){c.save();c.strokeStyle=LP.rgba(MO.ember,0.9);c.shadowColor=MO.glow;c.shadowBlur=5;c.lineWidth=w||1.1;c.lineCap="round";c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.restore();}
function moEyes(c,o,list,rx,ry,hot){c.save();c.fillStyle=o.dcol;c.shadowColor=o.dglow;c.shadowBlur=7+hot*12;for(const e of list){c.beginPath();c.ellipse(e[0],e[1],rx*(1+hot*0.35),ry*(1+hot*0.35),e[2],0,Math.PI*2);c.fill();}
  if(hot>0){c.globalCompositeOperation="screen";for(const e of list){const g=c.createRadialGradient(e[0],e[1],0,e[0],e[1],rx*5);g.addColorStop(0,LP.rgba(MO.ember,0.55*hot));g.addColorStop(1,LP.rgba(MO.ember,0));c.fillStyle=g;c.fillRect(e[0]-rx*5,e[1]-rx*5,rx*10,rx*10);}}c.restore();}
function moHot(c,x,y,r,a){if(a<=0)return;c.save();c.globalCompositeOperation="screen";const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,LP.rgba("#ffd9a0",0.8*a));g.addColorStop(0.35,LP.rgba(MO.ember,0.6*a));g.addColorStop(1,LP.rgba(MO.glow,0));c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
// an attack's sweep: an ember crescent along the path the claws or branches have just taken (pts newest last)
function moSlash(c,pts,w,a){if(pts.length<2||a<=0)return;c.save();c.globalCompositeOperation="screen";c.lineCap="round";c.lineJoin="round";
  for(let i=1;i<pts.length;i++){const u=i/(pts.length-1);c.strokeStyle=LP.rgba(i===pts.length-1?"#ffd9a0":MO.ember,a*(0.25+0.75*u));c.shadowColor=MO.glow;c.shadowBlur=8;c.lineWidth=w*(0.25+0.75*u);c.beginPath();c.moveTo(pts[i-1][0],pts[i-1][1]);c.lineTo(pts[i][0],pts[i][1]);c.stroke();}c.restore();}
const _pivot=(x,P,px,py)=>{x.translate(px,py);x.rotate(P.tilt||0);x.scale(P.sx||1,P.sy||1);x.translate(-px,-py);x.translate(P.dx||0,P.dy||0);};
Object.assign(LP.MON_BOX,{crawlerP:[-60,-60,52,20],bat2P:[-52,-60,52,40],hatmawP:[-70,-110,60,14],ghoulP:[-95,-140,40,12],walkerP:[-125,-226,70,12]});
Object.assign(LP.MONSTER,{
  // the crawler: squash, stretch and tilt on the design system's own crawler; its legs freeze when P.t is set; the mouth gapes when P.jaw
  crawlerP(x,t,m,rm){const P=m.P||{};x.save();_pivot(x,P,0,-12);const det=LP.MONSTER.crawler(x,P.t!=null?P.t:t,m,rm);x.restore();
    return(c,o)=>{c.save();_pivot(c,P,0,-12);det(c,o);const j=P.jaw||0,h=P.hot||0;moHot(c,-20,-12,8+h*7,h*0.8);
      if(j>0){moMouth(c,[[-29,-15.6-j*3],[-20,-14.2-j*2.4],[-13,-12.6],[-20,-9.6+j*2.6],[-28,-9.4+j*3.4]],-18,-12,9+j*3);moTeeth(c,[[-27,-15.4-j*2.6],[-26,-12.6-j],[-25,-15-j*2.4],[-22,-14.6-j*2],[-21,-12.2-j*0.6],[-20,-14.2-j*1.8],[-26.6,-9.6+j*3],[-25.6,-12.2+j],[-24.6,-9.8+j*2.6],[-21.6,-10+j*2.2],[-20.6,-12+j*0.8],[-19.6,-10.2+j*2]]);}
      moEyes(c,o,[[-21,-16.2,0.2],[-17.5,-17.2,0.2]],1.5,1,h);c.restore();};},
  // the flyer: the design system's flyer, tilted along its dive; its wings freeze (P.t) when it folds them to dive
  bat2P(x,t,m,rm){const P=m.P||{};x.save();_pivot(x,P,0,-2);const det=LP.MONSTER.bat2(x,P.t!=null?P.t:t,m,rm);x.restore();
    return(c,o)=>{c.save();_pivot(c,P,0,-2);det(c,o);const h=P.hot||0;moHot(c,0,-4,6+h*8,h);moEyes(c,o,[[-1.6,-7.2,0.3],[1.6,-7.2,-0.3]],1.1,0.8,h);c.restore();};},
  // the mouth-hat: its own hop frozen (P.t), then squash, hop and a mouth that gapes and snaps (P.bite)
  hatmawP(x,t,m,rm){const P=m.P||{};x.save();_pivot(x,P,0,-8);const det=LP.MONSTER.hatmaw(x,P.t!=null?P.t:t,m,rm);x.restore();
    return(c,o)=>{c.save();_pivot(c,P,0,-8);det(c,o);const b=P.bite||0,h=P.hot||0;moHot(c,-11,-24,10+h*8,h*0.7);
      if(b>0){const cx=-11,cy=-24,k=1+b*0.55;c.save();c.translate(cx,cy);c.scale(k,1+b*0.95);c.translate(-cx,-cy);
        c.fillStyle="#2a0507";c.strokeStyle=MO.ember;c.lineWidth=0.9;c.shadowColor=MO.glow;c.shadowBlur=5;c.beginPath();[[-22,-30],[-16,-34],[-10,-34.2],[-4,-32],[1,-29],[-2,-23],[-8,-17],[-14,-15.8],[-21,-17]].forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.stroke();c.shadowBlur=0;
        moMouth(c,[[-14,-27],[-8,-28],[-5,-25],[-8,-21],[-13,-21.6]],-9,-24.6,5);
        moTeeth(c,[[-20,-31.4],[-18,-25],[-16,-32],[-14,-32.6],[-12,-26],[-10,-32.8],[-8,-32.2],[-6,-26.4],[-4,-31.4],[-18,-17.2],[-16,-23],[-14,-16.4],[-11.6,-16.6],[-9.6,-22.6],[-7.6,-17.4]]);c.restore();}
      {const tt=P.t!=null?P.t:t,hop=Math.max(0,Math.sin(tt*(rm?1.4:2.6)+m.ph)),sq=1-hop*0.06;c.save();c.translate(0,-hop*(rm?3:9));c.scale(1/sq,sq); /* version 9: the signal eyes follow the hop, as bundle.js's hatmaw moves its own eyes */
      moEyes(c,o,[[-13,-41,0.35],[-5,-43,0.15]],3.4,1.4,h);c.restore();}c.restore();};},
  // the ghoul, posable: its front arm (P.a: upper arm, forearm angles) can wind up and swipe; P.op opens the jaw; P.slash draws the sweep
  ghoulP(x,t,m,rm){const P=m.P||{},tq=Math.floor((t+m.ph)*8)/8,s1=P.s1!=null?P.s1:Math.sin(tq*3),bob=P.bob!=null?P.bob:Math.abs(s1)*2,op=P.op!=null?P.op:3+Math.max(0,Math.sin(tq*1.7))*3,lean=P.lean||0;
    x.save();x.translate(P.dx||0,-bob);
    for(const q of [[s1,5],[-s1,11]])moLimb(x,q[1],-48,[[21,-0.45+q[0]*0.25,6.5,4.2],[19,0.65-q[0]*0.2,4.2,3],[11,-0.25,3,1.4]]);
    x.save();x.translate(8,-48);x.rotate(lean);x.translate(-8,48);
    x.beginPath();x.moveTo(15,-50);x.quadraticCurveTo(18,-72,-2,-86);x.quadraticCurveTo(-12,-91,-20,-84);x.quadraticCurveTo(-6,-76,2,-47);x.closePath();LP.cardFill(x);
    for(let i=0;i<5;i++){const u=i/4,bx=15+(-6-15)*u,by=-58+(-86+58)*u-Math.sin(u*Math.PI)*5;x.beginPath();x.moveTo(bx-2.4,by+1.6);x.lineTo(bx+3+u*2,by-6);x.lineTo(bx+2.4,by+1.4);x.closePath();LP.cardFill(x);}
    x.beginPath();x.moveTo(-15,-87);x.lineTo(-30,-89);x.lineTo(-40,-84);x.lineTo(-39,-80);x.lineTo(-18,-79);x.closePath();LP.cardFill(x);
    x.beginPath();x.moveTo(-18,-78);x.lineTo(-37,-79+op);x.lineTo(-35,-75+op);x.lineTo(-17,-73);x.closePath();LP.cardFill(x);
    const claws=(h,ang)=>{x.lineWidth=1.4;for(let k=0;k<3;k++){const a=ang+(k-1)*0.32;x.beginPath();x.moveTo(h[0],h[1]);x.lineTo(h[0]+Math.sin(a)*6.5,h[1]+Math.cos(a)*6.5);x.lineTo(h[0]+Math.sin(a+0.25)*8,h[1]+Math.cos(a+0.25)*8);x.stroke();}};
    {const q=-s1,h=moLimb(x,-8,-82,[[25,-0.4+q*0.22,4.6,3.4],[27,-0.08-q*0.25,3.4,2.2]]);claws(h,-0.3);} // the back arm hangs
    const a=P.a||[-0.4+s1*0.22,-0.08-s1*0.25],hand=moLimb(x,-14,-82,[[25,a[0],4.6,3.4],[27,a[1],3.4,2.2]]);claws(hand,a[1]-0.2);
    x.restore();x.restore();
    return(c,o)=>{c.save();c.translate(P.dx||0,-bob);c.translate(8,-48);c.rotate(lean);c.translate(-8,48);const h=P.hot||0;
      moMouth(c,[[-18,-78.6],[-38,-79.4],[-36,-77.6+op],[-18,-73.6]],-22,-77,12);
      moTeeth(c,[[-35,-79.2],[-33.6,-76.4],[-32.2,-79.1],[-30,-78.9],[-28.8,-76],[-27.4,-78.8],[-25,-78.7],[-24,-76.2],[-23,-78.6],[-34,-76.4+op],[-32.8,-78.8+op*0.6],[-31.6,-76.2+op],[-28.6,-75.8+op*0.8],[-27.6,-78.2+op*0.4],[-26.6,-75.6+op*0.8]]);
      moSeam(c,[[10,-62],[7,-66],[9,-70]],1);moSeam(c,[[2,-74],[-1,-78]],1);moHot(c,hand[0],hand[1],8+h*10,h);
      if(P.slash)moSlash(c,P.slash.map(an=>{const e=[-14+Math.sin(an[0])*25,-82+Math.cos(an[0])*25];return[e[0]+Math.sin(an[1])*30,e[1]+Math.cos(an[1])*30];}),4.2,P.slashA==null?1:P.slashA);
      moEyes(c,o,[[-33,-85,0.3],[-27,-86,0.3]],2.2,1.2,h);c.restore();};},
  // the walker, posable: both branch arms (P.arms: [left, right], each three angles), a crouch on its stilts (P.crouch) and a hollow chest that burns hotter
  walkerP(x,t,m,rm){const P=m.P||{},tq=Math.floor((t*0.6+m.ph)*8)/8,s1=P.s1!=null?P.s1:Math.sin(tq*2.4),cr=P.crouch||0,low=cr*46;
    x.save();x.scale(1.15,1);x.translate(P.dx||0,0);
    for(const q of [[s1,-3],[-s1,5]])moLimb(x,q[1],-112+low,[[44,-0.2+q[0]*0.18-cr*0.95,8,6],[46,0.32-q[0]*0.16+cr*1.25,6,4],[20,-0.12,4,2]]);
    x.translate(0,low);
    x.beginPath();x.moveTo(-8,-108);x.quadraticCurveTo(-12,-140,-6,-168);x.lineTo(8,-168);x.quadraticCurveTo(14,-140,10,-108);x.closePath();LP.cardFill(x);
    x.save();x.globalCompositeOperation="destination-out";x.beginPath();x.ellipse(1,-140,5.5,13,0.05,0,Math.PI*2);LP.cardFill(x);x.restore();
    x.beginPath();x.moveTo(-5,-168);x.quadraticCurveTo(-4,-178,1,-182);x.quadraticCurveTo(7,-178,7,-168);x.closePath();LP.cardFill(x);
    for(const q of [[-1,-180,-2.6],[3,-181,-0.4],[5,-179,0.9]])moLimb(x,q[0],q[1],[[10,q[2]+Math.PI,2.2,1.2],[7,q[2]+Math.PI+(q[2]<0?-0.7:0.7),1.2,0.5]]);
    const hands=[];[[-s1,-6,-1],[s1,8,1]].forEach((q,i)=>{const sh=[q[1],-164],an=P.arms?P.arms[i]:[q[2]*0.5+q[0]*0.2,q[2]*0.12-q[0]*0.2,q[2]*-0.3],
      e=moLimb(x,sh[0],sh[1],[[30,an[0],4.4,3.2]]),h=moLimb(x,e[0],e[1],[[34,an[1],3.2,2],[14,an[2],2,1]]);hands.push(h);
      moLimb(x,h[0],h[1],[[8,an[2]+0.8,1.2,0.5]]);moLimb(x,h[0],h[1],[[9,an[2]-0.4,1.2,0.5]]);moLimb(x,(sh[0]+e[0])/2,(sh[1]+e[1])/2+4,[[10,an[0]+1.1,1.6,0.6]]);});
    x.restore();
    return(c,o)=>{c.save();c.scale(1.15,1);c.translate(P.dx||0,low);const h=P.hot||0;
      c.save();const g=c.createRadialGradient(1,-138,0,1,-140,14+h*4);g.addColorStop(0,"#ffd9a0");g.addColorStop(0.5,MO.ember);g.addColorStop(1,"#5a0c08");
      c.fillStyle=g;c.shadowColor=MO.glow;c.shadowBlur=8+h*14;c.beginPath();c.ellipse(1,-140,5.5,13,0.05,0,Math.PI*2);c.fill();c.restore();moHot(c,1,-140,18+h*22,h*0.9);
      c.fillStyle=LB.pal.INK;for(let i=0;i<4;i++){const y=-150+i*6;c.beginPath();c.moveTo(-6,y);c.quadraticCurveTo(1,y-2.2,8,y);c.lineTo(8,y+1.6);c.quadraticCurveTo(1,y-0.6,-6,y+1.6);c.closePath();c.fill();}
      moMouth(c,[[-3,-171.5],[4,-171.5],[3,-170],[-2,-170]],0.5,-171,4);moSeam(c,[[-4,-120],[-2,-126],[-4,-131]],1.1);
      if(P.slash)moSlash(c,P.slash,5,P.slashA==null?1:P.slashA);
      for(const hd of hands)moHot(c,hd[0],hd[1],7+h*8,h*0.8);
      moEyes(c,o,[[-2,-175.5,0.2],[3,-175.5,-0.2]],1.6,1,h);c.restore();};}
});
// the walker's hand for given arm angles, in its own (unscaled) frame, for the sweep's trail
function moWalkerHand(arm,an,crouch){const sh=[arm?8:-6,-164+(crouch||0)*46],e=[sh[0]+Math.sin(an[0])*30,sh[1]+Math.cos(an[0])*30],w=[e[0]+Math.sin(an[1])*34,e[1]+Math.cos(an[1])*34];return[w[0]+Math.sin(an[2])*14,w[1]+Math.cos(an[2])*14];}
// one monster drawn through the design system's monsterInto into its own canvas, then placed in the world; flare draws the rim twice
function moDraw(c,K,key,S,m,t,o,flare){const M=K[key]||(K[key]=LP.mk(Math.ceil(260*S),Math.ceil(250*S))),H=K[key+"H"]||(K[key+"H"]={}),mc=M.getContext("2d"),sc=rollScene(S);
  mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,M.width,M.height);sc.monsterInto(mc,S,m,t,o,0,0,H);if(flare){const o2=Object.assign({},o,{dcol:"#ffb070",dglow:MO.glow});sc.monsterInto(mc,S,m,t,o2,0,0,H);}
  c.drawImage(M,m.X-130,m.Y-230,M.width/S,M.height/S);return M;}
const lerpN=(a,b,u)=>a+(b-a)*u,clamp01=u=>Math.max(0,Math.min(1,u)),ease=u=>u*u*(3-2*u),stepT=(t,r)=>Math.floor(t*(r||8))/(r||8);
// the wanderer's track: segments of poses at 12 steps a second, each with its own root path; at(t) gives {P, x, y, f, arc}
function wTrack(x0,list){let t0=0,x=x0;const segs=[];for(const s of list){if(!(s.n>0))continue;const n=s.n,sg={t0,n,x0:x,s};segs.push(sg);t0+=n/12;x+=(s.dx||0);}
  return{total:t0,at(t){let sg=segs[segs.length-1];for(const q of segs)if(t<q.t0+q.n/12){sg=q;break;}const e=Math.min(sg.n-0.001,Math.max(0,(t-sg.t0)*12)),st=Math.floor(e),s=sg.s;
    const r=s.root?s.root(e,st):[(s.dx||0)*e/sg.n,0];return{P:s.P(st,Math.floor(t*12)),x:sg.x0+r[0],y:r[1],f:s.f||1,arc:s.arc?s.arc(st):null,tag:s.tag,st};},
    tag0(tag,nth){let k=0;for(const q of segs)if(q.s.tag===tag){if(k===(nth||0))return q.t0;k++;}return null;},xAt(t){return this.at(t).x;}};}
const W_IDLE=(sec,f)=>({n:Math.round(sec*12),P:(st,g)=>mvIdle(g),f});
const W_READY=(sec,f)=>({n:Math.round(sec*12),P:()=>PS.ready,f});
const W_WALK=(steps,f)=>({n:steps,P:(st)=>mvWalk(st),dx:(f||1)*steps*STEP*K132,f});
const W_JUMP=(f,dx)=>{const ks=[PJ.crouch,PJ.launch,PJ.rise,PJ.rise,PJ.apex,PJ.fall,PJ.fall,PJ.land,PJ.recover];return{n:9,P:st=>ks[st],f,dx:dx||0,root:(e)=>{const v=clamp01((e-1)/6);return[(dx||0)*v,-58*K132*4*v*(1-v)];}};};
const W_ROLL=(f)=>{const ks=st=>st===0?PR.dive:st<4?mvBallP([0,1.95,3.9][st-1]):st===4?PR.rise:PR.recover,pts=[[0,0,0],[1,6,0],[4,54,0],[5,60,0],[6,62,0]];return{n:6,P:ks,f,dx:(f||1)*62*K132,root:(e)=>[(f||1)*mvPath(pts,e)[0]*K132,0]};};
const W_STRIKE=(f)=>{const ks=[PS.ready,PS.wind,PS.strike,PS.follow,PS.recover,PS.ready,PS.ready];return{n:7,P:st=>ks[st],f,tag:"strike",arc:st=>st===2?[tipAng(PS.wind),tipAng(PS.strike),0.85]:st===3?[tipAng(PS.strike)-0.5,tipAng(PS.follow),0.4]:null};};
// the five duels: each returns the wanderer's track, the monster at time t, and the loop's length
const MO_DUEL={
  crawler(wx,G){const tr=wTrack(wx,[W_READY(1.38),W_JUMP(1),W_READY(0.1),{...W_STRIKE(-1)},W_READY(2.2,-1)]);
    const mon=t=>{const m={kind:"crawlerP",ph:0.4,P:{}};let X,lift=0,hit=null,dead=null;
      if(t<1.2){const bursts=[[0,0.45,wx+250,wx+190],[0.45,0.7,wx+190,wx+190],[0.7,1.15,wx+190,wx+128],[1.15,1.2,wx+128,wx+128]];const b=bursts.find(q=>t<q[1])||bursts[3],u=clamp01((t-b[0])/(b[1]-b[0]));X=lerpN(b[2],b[3],u);if(b[2]===b[3])m.P.t=1.0;}
      else if(t<1.55){const u=(t-1.2)/0.35;X=wx+128+ease(u)*5;m.P={t:1.0,sy:1-0.14*ease(u),sx:1+0.06*ease(u),tilt:0.08*ease(u),hot:ease(u),jaw:0.35*u};}
      else if(t<1.88){const u=(t-1.55)/0.33;X=lerpN(wx+133,wx-34,u);lift=-16*4*u*(1-u);m.P={t:0.62,sx:1.14,sy:0.9,tilt:-0.12+0.2*u,hot:1-u*0.4,jaw:1};}
      else{const u=clamp01((t-1.88)/0.2);X=wx-34-8*ease(u);m.P={t:0.62,sy:1-0.08*(1-u),hot:0.2*(1-u),jaw:0.3*(1-u)};}
      if(t>=2.16&&t<2.29){hit=1;X-=6;}if(t>=2.29)dead=(t-2.29)/1.6;
      m.X=X;m.Y=G(X)+3+lift;return{m,hit,dead,box:LP.MON_BOX.crawler};};
    return{tr,mon,total:4.4,note:"Lunge"};},
  flyer(wx,G){const tr=wTrack(wx,[W_READY(1.32),W_ROLL(1),W_READY(0.2),W_IDLE(0.05),{...W_READY(0.75,-1)},{...W_STRIKE(-1)},W_READY(2,-1)]);
    const path=(t)=>{const g=G(wx);
      if(t<1.0){const u=t/1.0;return{X:lerpN(wx+300,wx+170,u),Y:g-118+Math.sin(t*5)*5,P:{}};}
      if(t<1.38){const u=(t-1.0)/0.38;return{X:wx+170+u*6,Y:g-118-10*ease(u),P:{t:0.08,tilt:-0.35*ease(u),hot:ease(u)}};}
      if(t<1.7){const u=(t-1.38)/0.32,v=ease(u);return{X:lerpN(wx+176,wx+30,v),Y:lerpN(g-128,g-58,Math.sin(v*Math.PI/2)),P:{t:0.08,tilt:-0.7,hot:1}};}
      if(t<2.4){const u=(t-1.7)/0.7;return{X:lerpN(wx+30,wx-90,u),Y:g-58-Math.sin(u*Math.PI/2)*80,P:{tilt:0.3*(1-u),hot:0.4*(1-u)}};}
      if(t<2.85){const u=(t-2.4)/0.45;return{X:lerpN(wx-90,wx-20,u),Y:g-138+Math.sin(t*5)*4,P:{}};}
      if(t<3.2){const u=(t-2.85)/0.35;return{X:wx-20-u*4,Y:g-140-8*ease(u),P:{t:0.08,tilt:0.35*ease(u),hot:ease(u)}};}
      const u=clamp01((t-3.2)/0.3),v=ease(u);return{X:lerpN(wx-24,wx+56,v),Y:lerpN(g-148,g-70,Math.sin(v*Math.PI/2)),P:{t:0.08,tilt:0.7,hot:1}};};
    const mon=t=>{const q=path(Math.min(t,3.42)),m={kind:"bat2P",ph:0.9,P:q.P,X:q.X,Y:q.Y};let hit=null,dead=null;if(t>=3.42&&t<3.55){hit=1;m.X-=8;m.Y-=6;}if(t>=3.55)dead=(t-3.55)/1.6;return{m,hit,dead,box:LP.MON_BOX.bat2};};
    return{tr,mon,total:5.5};},
  mouthhat(wx,G){const tr=wTrack(wx,[W_READY(2.05),W_WALK(2),{...W_STRIKE(1)},W_READY(1.2)]);
    const mon=t=>{const m={kind:"hatmawP",ph:0,P:{t:1.9}};let X,lift=0,hit=null;
      if(t<1.2){const u=t/1.2,hop=Math.max(0,Math.sin(t*2.6*2.2));X=lerpN(wx+260,wx+150,u);lift=-hop*9;m.P={t:1.9,sy:1-hop*0.06,sx:1/(1-hop*0.06)};}
      else if(t<1.6){const u=(t-1.2)/0.4,v=ease(u);X=wx+150+4*v;m.P={t:1.9,sy:1-0.16*v,sx:1+0.1*v,hot:v,bite:0.5*v};}
      else if(t<1.95){const u=(t-1.6)/0.35;X=lerpN(wx+154,wx+92,u);lift=-24*4*u*(1-u);m.P={t:1.9,sy:1+0.1*Math.sin(u*Math.PI),sx:1-0.05*Math.sin(u*Math.PI),hot:1-u*0.5,bite:u<0.55?0.5+u:Math.max(0,1-(u-0.55)/0.45*1.2)};}
      else{const u=clamp01((t-1.95)/0.25);X=wx+92;m.P={t:1.9,sy:1-0.1*(1-u)*(1-u),sx:1+0.06*(1-u),hot:0.2*(1-u)};}
      if(t>=2.4&&t<2.53){hit=1;X+=8;}else if(t>=2.53){const u=clamp01((t-2.53)/0.9);X=lerpN(wx+100,wx+150,ease(u));m.P={t:1.9+u*2.4};lift=-Math.max(0,Math.sin(u*Math.PI*3))*7;}
      m.X=X;m.Y=G(X)+lift;return{m,hit};};
    return{tr,mon,total:3.8};},
  ghoul(wx,G){const tr=wTrack(wx,[W_READY(1.5),W_ROLL(1),W_READY(0.08),{...W_STRIKE(1)},W_READY(1.5)]);
    const TAU=Math.PI*2,rest=[-0.4,-0.08],wind=[2.75,3.1],hitA=[-1.55+TAU,-1.35+TAU],fol=[-0.75+TAU,-0.35+TAU],rest2=[-0.4+TAU,-0.08+TAU];
    const mon=t=>{const m={kind:"ghoulP",ph:0.3,P:{}};let X=wx+170,hit=null;
      if(t<1.2){X=lerpN(wx+270,wx+168,t/1.2);}
      else if(t<1.65){const v=ease((t-1.2)/0.45);m.P={a:[lerpN(rest[0],wind[0],v),lerpN(rest[1],wind[1],v)],hot:v,op:3+5*v,lean:0.08*v,s1:0};X=wx+168;}
      else if(t<1.9){const u=(t-1.65)/0.25,stp=Math.floor(u*4)/4,v=ease(stp),a=[lerpN(wind[0],hitA[0],v),lerpN(wind[1],hitA[1],v)],tr2=[];for(let k=0;k<=8;k++){const w=ease(Math.min(stp,k/8));tr2.push([lerpN(wind[0],hitA[0],w),lerpN(wind[1],hitA[1],w)]);}
        m.P={a,hot:1,op:8,lean:-0.12*v,s1:0,slash:tr2.slice(Math.max(0,Math.round(stp*8)-5),Math.round(stp*8)+1)};X=wx+168-30*v; /* version 11: the lurch, about 30 (it was 8), so the swipe outreaches the sword */}
      else if(t<2.15){const u=(t-1.9)/0.25,v=ease(u);m.P={a:[lerpN(hitA[0],fol[0],v),lerpN(hitA[1],fol[1],v)],hot:0.5*(1-v),op:6,lean:-0.12*(1-v),s1:0,slashA:1-v,slash:[0,0.25,0.5,0.75,1].map(k=>[lerpN(hitA[0],fol[0],k*v),lerpN(hitA[1],fol[1],k*v)])};X=wx+138;}
      else{const v=ease(clamp01((t-2.15)/0.4));m.P={a:[lerpN(fol[0],rest2[0],v),lerpN(fol[1],rest2[1],v)],s1:0};X=wx+138;}
      if(t>=2.48&&t<2.61){hit=1;X+=8;m.P.s1=0.6;}else if(t>=2.61)X=wx+138+Math.min(8,(t-2.61)*30);
      m.X=X;m.Y=G(X)+2;return{m,hit};};
    return{tr,mon,total:4.0};},
  walker(wx,G){const tr=wTrack(wx,[W_READY(1.95),W_ROLL(1),W_READY(0.72),W_JUMP(1,0),W_READY(0.05),{...W_STRIKE(1)},W_READY(1.6)]);
    const rest=(i)=>i?[0.5,0.12,-0.3]:[-0.5,-0.12,0.3],up=(i)=>i?[2.75,2.7,2.45]:[2.4,2.55,2.35],hi=(i)=>i?[-1.15+6.2832,-1.45+6.2832,-1.5+6.2832]:[-1.25+6.2832,-1.55+6.2832,-1.6+6.2832],rest2=(i)=>rest(i).map(a=>a+6.2832),back=(i)=>i?[1.1,1.3,1.6]:[0.9,1.2,1.5],lo=(i)=>i?[-1.0,-1.25,-1.45]:[-1.1,-1.35,-1.5];
    const mix=(A,B,v)=>[0,1].map(i=>A(i).map((a,k)=>lerpN(a,B(i)[k],v)));
    const mon=t=>{const m={kind:"walkerP",ph:0.2,P:{}};let X=wx+170,hit=null;
      if(t<1.6){X=lerpN(wx+250,wx+166,t/1.6);}
      else if(t<2.1){const v=ease((t-1.6)/0.5);m.P={arms:mix(rest,up,v),hot:v,s1:0};X=wx+166;}
      else if(t<2.4){const u=(t-2.1)/0.3,stp=Math.floor(u*4)/4,v=ease(stp),arms=mix(up,hi,v),trail=[];for(let k=0;k<=8;k++){const w=ease(Math.min(stp,k/8));trail.push(moWalkerHand(0,mix(up,hi,w)[0],0));}
        m.P={arms,hot:1,s1:0,slash:trail.slice(Math.max(0,Math.round(stp*8)-5),Math.round(stp*8)+1)};X=wx+166;}
      else if(t<2.9){const v=ease(clamp01((t-2.4)/0.35));m.P={arms:mix(hi,rest2,v),hot:0.3*(1-v),s1:0,slashA:1-v,slash:[0.6,0.8,1].map(k=>moWalkerHand(0,mix(up,hi,k)[0],0))};X=wx+166;}
      else if(t<3.4){const v=ease((t-2.9)/0.5);m.P={arms:mix(rest,back,v),crouch:0.75*v,hot:v,s1:0};X=wx+166;}
      else if(t<3.7){const u=(t-3.4)/0.3,stp=Math.floor(u*4)/4,v=ease(stp),arms=mix(back,lo,v),trail=[];for(let k=0;k<=8;k++){const w=ease(Math.min(stp,k/8));trail.push(moWalkerHand(0,mix(back,lo,w)[0],0.75));}
        m.P={arms,crouch:0.75,hot:1,s1:0,slash:trail.slice(Math.max(0,Math.round(stp*8)-5),Math.round(stp*8)+1)};X=wx+166;}
      else{const v=ease(clamp01((t-3.7)/0.45));m.P={arms:mix(lo,rest,v),crouch:0.75*(1-v),hot:0.3*(1-v),s1:0,slashA:Math.max(0,1-v*2),slash:[0.6,0.8,1].map(k=>moWalkerHand(0,mix(back,lo,k)[0],0.75))};X=wx+166;}
      if(t>=4.6&&t<4.73){hit=1;X+=8;}else if(t>=4.73)X=wx+166+Math.min(8,(t-4.73)*30);
      m.X=X;m.Y=G(X);return{m,hit};};
    return{tr,mon,total:5.6};}
};
// a duel's loop at play size, in the place chosen with the page's buttons
function loopDuel(cv,t,lvAll,R,K,who){const lv=lvAll,S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d");if(!K.scr||K.scr.width!==cv.width||K.scr.height!==cv.height)K.scr=LP.mk(cv.width,cv.height);
  const T=cpTerr(lv),G=x=>tGround(T,x),cam=300,wx=cam+W*0.3,key=who+"@"+lv+"@"+W.toFixed(0),D=K.D&&K.D.key===key?K.D:(K.D=Object.assign({key},MO_DUEL[who](wx,G))),tt=t%D.total,sc=rollScene(S),e=LB.places[lv].edge,opts=LB.options(lv,{walking:false});
  sc.fn=(x,s,W2,t2)=>{rlPath(x,T,cam,W2,G);x.save();x.translate(-cam,0);
    const q=D.tr.at(tt),mo=D.mon(tt),wy=G(q.x)+1+q.y;
    if(mo.dead==null)moDraw(x,K,"M",S,mo.m,t2,opts,!!mo.hit);else if(mo.dead<1){const M=moDraw({drawImage(){}},K,"M",S,mo.m,t2,opts,false);LP.drawDefeat(x,M,S,mo.m.X,mo.m.Y,mo.box,mo.dead,opts.defeat||"cardwisp",7);}
    mvDraw(x,q.x,wy,q.P,Math.floor(tt*12)/12,q.f,e,K132,{feet:q.y>-3});if(q.arc)fxSlash(x,q.x,wy,q.f,K132,q.P,q.arc[0],q.arc[1],q.arc[2],e);
    x.restore();};
  c.setTransform(1,0,0,1,0,0);sc.render(c,K.scr,S,W,t,cam,opts);sc.fn=null;c.setTransform(S,0,0,S,0,0);
  scFade(c,W,LB.LH,tt>D.total-0.3?(tt-(D.total-0.3))/0.3:(tt<0.2?1-tt/0.2:0));}
// the signals side by side: each monster as it winds up, in the place chosen with the page's buttons
function loopSignals(cv,t,lvAll,R,K){if(K.done===lvAll)return;K.done=lvAll;const lv=lvAll,c=cv.getContext("2d"),Wc=cv.width,Hc=cv.height,cw=150,ch=280,cells=[
    ["Crawler: crouches, mouth burns",{kind:"crawlerP",ph:0.4,P:{t:1.0,sy:0.86,sx:1.06,tilt:0.08,hot:1,jaw:0.35}},0,3],
    ["Flyer: rises, wings folding",{kind:"bat2P",ph:0.9,P:{t:0.08,tilt:-0.35,hot:1}},-14,-120],
    ["Mouth-hat: squats, mouth gapes",{kind:"hatmawP",ph:0,P:{t:1.9,sy:0.84,sx:1.1,hot:1,bite:0.5}},4,0],
    ["Ghoul: arm drawn back",{kind:"ghoulP",ph:0.3,P:{a:[2.75,3.1],hot:1,op:8,lean:0.08,s1:0}},14,2],
    ["Walker: arms up (high sweep)",{kind:"walkerP",ph:0.2,P:{arms:[[2.4,2.55,2.35],[2.75,2.7,2.45]],hot:1,s1:0}},22,0],
    ["Walker: crouched, arms back (low)",{kind:"walkerP",ph:0.2,P:{arms:[[0.9,1.2,1.5],[1.1,1.3,1.6]],crouch:0.75,hot:1,s1:0}},22,0]],
    wide=Wc/Hc>1.6,cols=wide?6:3,rows=wide?1:2,s=Math.min(Wc/(cols*cw),Hc/(rows*ch)),opts=LB.options(lv,{walking:false});
  c.setTransform(1,0,0,1,0,0);c.fillStyle="#0e090b";c.fillRect(0,0,Wc,Hc);
  cells.forEach(([label,m,ox,oy],i)=>{const col=i%cols,row=Math.floor(i/cols),Gy=ch-26;c.setTransform(s,0,0,s,col*cw*s,row*ch*s);c.save();c.beginPath();c.rect(1,1,cw-2,ch-2);c.clip();sheetBg(c,lv,0,cw,ch,Gy);
    m.X=cw*0.55+ox;m.Y=Gy+oy;moDraw(c,K,"S"+i,s,m,0,opts,false);c.restore();
    c.font='600 10.5px "Alegreya Sans",sans-serif';c.textBaseline="top";c.textAlign="left";c.fillStyle="#c9a25a";const words=label.split(": ");c.fillText(words[0],6,Gy+3);c.font='500 9.5px "Alegreya Sans",sans-serif';c.fillStyle="#a99a86";c.fillText(words[1]||"",6,Gy+14);});}

/* ======================================== mvboss.js ======================================== */
/* ============================== 4b round 8: the bosses' attacks, signals, arrival and bar ==============================
   The design system's four bosses (version 7), drawn by its own bossInto and moved as card puppets: whole-body glides, leaps, rises,
   leans, fades and turns. What a boss reaches out with that isn't in its drawing (tentacles, a long branch, roots, bolts, splinters,
   a wave of pale fire) is drawn here in the same way: ink with the ember rim and glow. Signals follow round 7's language, made bigger:
   a wind-up, eyes flaring and the part that will hurt burning, and for anything that comes up from or down onto the ground, an ember
   warning on the ground where it will land (the gameplay note's ember glow for the skull, cracks for the tree). A hit: the boss jolts
   back, its rim flares once and the bar drops, a lighter trace draining after it. Arrival: the boss comes in, its name on a brass
   plaque at the top for 2 s, and the bar fills along the bottom with its name above. */
const BS_NAME={night:"The Veiled Ghost",storm:"The Tentacled Skull",dawn:"The Moor Mother",mist:"The Gaping Tree"}; // names, so each word capitalised (Barney, 4 Nov)
function bsDraw(x,K,S,lv,X,Y,t,opts,st){const a=st.alpha==null?1:st.alpha;if(a<=0.01)return;
  const B=K.B&&K.BS===S?K.B:(K.BS=S,K.B=LP.mk(Math.ceil(460*S),Math.ceil(330*S))),bc=B.getContext("2d");K.bcache=K.bcache||{};
  bc.setTransform(1,0,0,1,0,0);bc.clearRect(0,0,B.width,B.height);
  // the design system's approved look and nod (graded card blacks, lit lines), as its own boss strip draws them
  const one=(o2)=>{let tt=t,os=null;if(st.sickle!=null&&lv==="dawn"){ // the moor mother's claw arm turns by -sw about its shoulder, sw=sin(tq*1.2)*0.16: for this review its angle is set
      let tq=Math.floor(tt*0.7*8)/8;if(tq===0){tt+=0.2;tq=Math.floor(tt*0.7*8)/8;}const arg=tq*1.2,v=-st.sickle/0.16;let used=false;os=Math.sin;Math.sin=function(a){if(!used&&a===arg){used=true;return v;}return os(a);};}
    try{LP.bossInto(bc,S,lv,tt,o2,0,0,LP.BOSS_NOD,true,K.bcache,LP.BOSS_LOOK);}finally{if(os)Math.sin=os;}};
  if(st.extra){const U=K.U&&K.US===S?K.U:(K.US=S,K.U=LP.mk(B.width,B.height)),uc=U.getContext("2d");
    uc.setTransform(1,0,0,1,0,0);uc.clearRect(0,0,U.width,U.height);uc.setTransform(S,0,0,S,230*S,300*S);uc.fillStyle=LB.pal.INK;uc.strokeStyle=LB.pal.INK;uc.lineCap="round";uc.lineJoin="round";
    st.extra(uc);uc.fillStyle=LB.pal.INK;uc.strokeStyle=LB.pal.INK;const det=LP.BOSS[lv](uc,t,opts.rm,LP.BOSS_NOD,LP.BOSS_LOOK);
    const rim=(o2)=>{bc.shadowColor=LP.rgba(o2.dcol,0.95);bc.shadowBlur=2.5*S;bc.drawImage(U,0,0);bc.shadowColor=LP.rgba(o2.dglow,0.6);bc.shadowBlur=11*S;bc.drawImage(U,0,0);bc.shadowColor="transparent";bc.shadowBlur=0;};
    rim(opts);if(st.flare)rim(Object.assign({},opts,{dcol:"#ffb070"}));bc.drawImage(U,0,0);bc.save();bc.setTransform(S,0,0,S,230*S,300*S);det(bc,opts);bc.restore();}
  else{one(opts);if(st.flare)one(Object.assign({},opts,{dcol:"#ffb070"}));}
  const X1=X+(st.dx||0),Y1=Y+(st.dy||0);if(st.glow!==0)LP.bossGlow(x,X1,Y1,lv,a*(st.glow==null?1:st.glow));
  x.save();x.globalAlpha=a;if(st.clipY!=null){x.beginPath();x.rect(X1-400,-2000,800,2000+st.clipY);x.clip();}x.translate(X1,Y1);x.rotate(st.tilt||0);x.scale((st.flip||1)*(st.sx||1),st.sy||1);x.drawImage(B,-230,-300,460,330);x.restore();}
function bsPt(X,Y,st,lx,ly){const c=Math.cos(st.tilt||0),s=Math.sin(st.tilt||0),px=lx*(st.flip||1)*(st.sx||1),py=ly*(st.sy||1);return[X+(st.dx||0)+px*c-py*s,Y+(st.dy||0)+px*s+py*c];}
// ink shapes with the bosses' ember rim and glow: fn draws the paths (fills); called three times
function bsRim(x,S,fn){x.save();x.fillStyle=LB.pal.INK;x.strokeStyle=LB.pal.INK;x.lineCap="round";x.lineJoin="round";
  x.shadowColor=LP.rgba(MO.ember,0.95);x.shadowBlur=2.5*S;fn(x);x.shadowColor=LP.rgba(MO.glow,0.6);x.shadowBlur=11*S;fn(x);x.shadowColor="transparent";x.shadowBlur=0;fn(x);x.restore();}
function bsTaper(x,p0,p1,p2,w0,w1){rlTaper(x,p0,p1,p2,w0,w1,16);}
// an ember warning on the ground: a glowing patch, flickering in steps, with cracks when cr is set
function bsWarn(x,X,G,w,a,t,cr){if(a<=0)return;const fl=0.85+0.15*Math.sin(Math.floor(t*12)*2.1);x.save();x.globalCompositeOperation="screen";x.translate(X,G(X)+2);x.scale(w/30,0.55);
  const g=x.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,LP.rgba("#ffe2b0",0.95*a*fl));g.addColorStop(0.35,LP.rgba(MO.ember,0.8*a*fl));g.addColorStop(1,LP.rgba(MO.glow,0));x.fillStyle=g;x.fillRect(-30,-30,60,60);x.restore();
  {x.save();x.globalCompositeOperation="screen";const gy=G(X),g2=x.createLinearGradient(0,gy,0,gy-56);g2.addColorStop(0,LP.rgba(MO.ember,0.5*a*fl));g2.addColorStop(1,LP.rgba(MO.glow,0));x.fillStyle=g2;x.beginPath();x.ellipse(X,gy,w*0.42,56,0,Math.PI,0);x.fill();x.restore();} // light rising from it
  if(cr){x.save();x.strokeStyle=LP.rgba(MO.ember,0.9*a);x.shadowColor=MO.glow;x.shadowBlur=6;x.lineWidth=1.6;x.lineCap="round";const r=mvRng(Math.round(X));for(let k=0;k<5;k++){let px=X+(r()-0.5)*w*0.5,py=G(px)+1;x.beginPath();x.moveTo(px,py);for(let j=0;j<3;j++){px+=(r()-0.5)*w*0.5*cr;py=G(px)+1+r()*1.2;x.lineTo(px,py);}x.stroke();}x.restore();}}
// the boss bar and the arrival plaque, on screen
function bsBar(c,W,name,hp,trace,a){if(a<=0)return;const w=Math.min(W*0.42,520),x0=(W-w)/2,y0=LB.LH-30,h=9;c.save();c.globalAlpha=a;
  c.font="16px 'IM Fell English', Georgia, serif";c.textAlign="center";c.textBaseline="alphabetic";c.fillStyle="#e9c98a";c.shadowColor="rgba(0,0,0,0.85)";c.shadowBlur=5;c.fillText(name,W/2,y0-7);c.shadowBlur=0;
  const n=4;c.beginPath();c.moveTo(x0+n,y0);c.lineTo(x0+w-n,y0);c.lineTo(x0+w,y0+n);c.lineTo(x0+w,y0+h+4-n);c.lineTo(x0+w-n,y0+h+4);c.lineTo(x0+n,y0+h+4);c.lineTo(x0,y0+h+4-n);c.lineTo(x0,y0+n);c.closePath();
  c.fillStyle="rgba(12,7,9,0.82)";c.fill();c.strokeStyle="#c9a25a";c.lineWidth=1.4;c.stroke();
  const iw=w-6;if(trace>hp){c.fillStyle="rgba(255,200,150,0.55)";c.fillRect(x0+3+iw*hp,y0+2,iw*(trace-hp),h);}
  const g=c.createLinearGradient(0,y0+2,0,y0+2+h);g.addColorStop(0,"#ff9a5a");g.addColorStop(0.5,MO.ember);g.addColorStop(1,"#a8331a");c.fillStyle=g;c.fillRect(x0+3,y0+2,iw*hp,h);
  c.restore();}
function bsPlaque(c,W,name,a){if(a<=0)return;c.save();c.globalAlpha=a;c.font="26px 'IM Fell English', Georgia, serif";const tw=c.measureText(name).width,w=tw+70,h=48,x0=(W-w)/2,y0=46,n=10;
  c.beginPath();c.moveTo(x0+n,y0);c.lineTo(x0+w-n,y0);c.lineTo(x0+w,y0+n);c.lineTo(x0+w,y0+h-n);c.lineTo(x0+w-n,y0+h);c.lineTo(x0+n,y0+h);c.lineTo(x0,y0+h-n);c.lineTo(x0,y0+n);c.closePath();
  c.fillStyle="rgba(12,7,9,0.78)";c.fill();c.strokeStyle="#c9a25a";c.lineWidth=1.6;c.stroke();c.fillStyle="#e9c98a";c.textAlign="center";c.textBaseline="middle";c.fillText(name,W/2,y0+h/2+2);c.restore();}
const win=(t,a,b)=>t>=a&&t<b?(t-a)/(b-a):null;
const W_CAST=(f)=>({n:6,P:st=>[PF.back,PF.thrust,PF.hold,PF.hold,PF.recover,PS.ready][st],f,tag:"cast"});
const W_TURN=(f)=>({n:1,P:()=>PS.ready,f});
// the four fights. Each returns the wanderer's track, the boss's state and effects at time t, the bar, and the loop's length
const BS_FIGHT={
  night(wx,G){const bx=wx+300,tr=wTrack(wx,[W_READY(2.0),W_ROLL(1),W_READY(2.15),W_ROLL(1),W_READY(2.0),W_JUMP(1,0),W_READY(0.6),W_CAST(1),W_READY(1.5)]);
    const c0=tr.tag0("cast")+1.5/12,c1=c0+0.25,hitT=c1,H=[-70,-62];
    const at=(t)=>{let X=bx,st={dy:-5*Math.sin(t*1.7)},hot=0,fx=[],u;
      if((u=win(t,0,1.0))!=null){st.alpha=ease(u);st.dx=120*(1-ease(u));}
      if((u=win(t,1.6,2.05))!=null){const v=ease(u);st.dx=14*v;st.tilt=0.08*v;hot=v;}
      const glide=(x0,x1,u,flip,tilt)=>{const tr2=[];for(let k=5;k>=0;k--){const v2=ease(Math.max(0,u-k*0.07)),XX=lerpN(x0,x1,v2);tr2.push(bsPt(XX,G(bx)+4,{flip,tilt,dy:st.dy},H[0],H[1]));}fx.push(x=>moSlash(x,tr2,5,1));};
      if((u=win(t,2.05,2.4))!=null){X=lerpN(bx+14,wx+40,ease(u));st.tilt=-0.14;hot=1;glide(bx+14,wx+40,u,1,-0.14);}
      if((u=win(t,2.4,3.2))!=null){const v=ease(u);X=lerpN(wx+40,bx,v);st.alpha=1-0.15*Math.sin(u*Math.PI);st.tilt=-0.14*(1-v);}
      if((u=win(t,3.5,4.0))!=null){st.alpha=1-0.38*Math.sin(u*Math.PI); /* version 9: a smooth fade, was a flicker 8 times a second */hot=ease(u);fx.push(x=>{for(let k=0;k<6;k++){const ph=(t*1.3+k/6)%1;fxMote(x,bx-40+k*16,G(bx)-30-ph*150,1.6,Math.sin(ph*Math.PI)*0.8,"#f0c9e0");}});}
      if((u=win(t,4.0,4.3))!=null){st.alpha=1-ease(u);hot=1-u;}
      if(t>=4.3&&t<4.6)st.alpha=0;
      const back=wx+82-125;
      if((u=win(t,4.6,4.85))!=null){const uu=u;X=back;st.flip=-1;st.alpha=ease(u);fx.push(x=>moHot(x,back,G(back)-120,90*(1-uu)+30,1-uu));}
      if((u=win(t,4.85,4.95))!=null){X=back;st.flip=-1;hot=1;}
      if((u=win(t,4.95,5.25))!=null){X=lerpN(back,wx+60,ease(u));st.flip=-1;st.tilt=0.14;hot=1;glide(back,wx+60,u,-1,0.14);}
      if((u=win(t,5.25,5.6))!=null){X=wx+60;st.flip=-1;st.alpha=1-ease(u);}
      if(t>=5.6&&t<6.0)st.alpha=0;
      if((u=win(t,6.0,6.4))!=null){st.alpha=ease(u);}
      if((u=win(t,6.6,7.2))!=null){const v=ease(u);st.dy=-5*Math.sin(t*1.7)-18*v;st.sy=1+0.06*v;hot=v;}
      if((u=win(t,7.2,8.6))!=null){st.dy=-5*Math.sin(t*1.7)-18*(1-ease(clamp01(u*3)));hot=1-u;const d=(t-7.2)*330,uu=u;fx.push(x=>{for(const sd of [-1,1])bsWave(x,bx+sd*(40+d),G,sd,1-uu*0.7,t);});}
      if((u=win(t,hitT,hitT+0.13))!=null){st.dx=(st.dx||0)+10;st.flare=true;}
      return{X,Y:G(bx)+4,st,hot,fx,eyes:[[-8,-190],[5,-190]],hands:[[-70,-62],[72,-45]]};};
    return{tr,at,total:tr.total+0.1,hitT,cast:[c0,c1],aim:-140};},
  storm(wx,G){const bx=wx+330,tr=wTrack(wx,[W_READY(2.05),W_ROLL(1),W_READY(0.7),W_WALK(12),W_READY(0.2),W_TURN(-1),W_ROLL(-1),W_READY(0.3,-1),W_TURN(1),W_READY(2.0),{...W_STRIKE(1)},{...W_STRIKE(1)},W_READY(0.3),W_CAST(1),W_READY(1.3)]);
    const cs=5.9,k0=tr.tag0("strike",0)+2/12,k1=tr.tag0("strike",1)+2/12,c0=tr.tag0("cast")+1.5/12,c1=c0+0.35,hitT=c1,L0=wx,R0=wx+190,sp=[wx+200,wx+290];
    const at=(t)=>{let st={},hot=0,fx=[],X=bx,u;
      if((u=win(t,0,1.1))!=null){st.dy=150*(1-ease(u));st.clipY=G(bx)+4;st.alpha=Math.min(1,u*2);}
      if((u=win(t,1.5,2.3))!=null){const a=ease(u);fx.push(x=>{bsWarn(x,L0,G,90,a,t,0.5);bsWarn(x,R0,G,90,a,t,0.5);});hot=0.4*u;}
      if((u=win(t,2.3,3.0))!=null){const uu=u,down=u<0.25?ease(u/0.25):u<0.6?1:1-ease((u-0.6)/0.4);fx.push(x=>{bsWarn(x,L0,G,90,1-uu,t,0.5);bsWarn(x,R0,G,90,1-uu,t,0.5);
        bsTentacle(x,_S0,[wx-260,G(wx)+40],[L0+10,G(L0)+2],down,-1,t);bsTentacle(x,_S0,bsPt(bx,G(bx)+4,{},-72,-60),[R0,G(R0)+2],down,1,t);
        if(uu>0.22&&uu<0.5){const v=(uu-0.22)/0.28;for(const p of [L0,R0])fxBurst(x,p,G(p)-4,1.2,v,MO.ember);}});}
      if((u=win(t,4.15,4.5))!=null){const v=ease(u);st.dx=12*v;hot=v;}
      if((u=win(t,4.5,4.72))!=null){const v=ease(u);st.dx=12-82*v;st.tilt=-0.06*v;hot=1;fx.push(x=>{const m=bsPt(bx,G(bx)+4,st,0,-58);moHot(x,m[0],m[1],44*v,v);});}
      if((u=win(t,4.72,5.1))!=null){const v=ease(u);st.dx=-70*(1-v);st.tilt=-0.06*(1-v);}
      if((u=win(t,5.3,5.9))!=null){const v=ease(u);st.dy=-14*v;hot=v;fx.push(x=>{for(const p of sp)bsWarn(x,p,G,46,v,t,0.6);});}
      if(t>=5.9&&t<6.5){st.dy=-14*(1-ease((t-5.9)/0.6));}
      if((u=win(t,hitT,hitT+0.13))!=null){st.dx=10;st.flare=true;}
      return{X,Y:G(bx)+4,st,hot,fx,eyes:[[-25,-98],[23,-98]],mouth:[0,-60],crawlers:sp,cs,dead:[k0-cs,k1-cs],reach:(i)=>tr.xAt(i?k1:k0)+52};};
    return{tr,at,total:tr.total+0.1,hitT,cast:[c0,c1],aim:-90};},
  dawn(wx,G){const bx=wx+330,land=wx-30,tr=wTrack(wx,[W_READY(2.2),W_ROLL(1),W_READY(0.25),W_TURN(-1),W_READY(0.75,-1),W_JUMP(-1,0),W_READY(0.9,-1),W_ROLL(-1),W_READY(0.05,-1),{...W_STRIKE(-1)},W_READY(1.6,-1)]);
    const hitT=tr.tag0("strike")+2/12;
    const at=(t)=>{let st={},hot=0,fx=[],X=bx,u,sick=0,eyes2=0;
      if((u=win(t,0,1.2))!=null){st.dx=150*(1-ease(u));st.alpha=Math.min(1,u*2);st.dy=-Math.abs(Math.sin(u*Math.PI*4))*5;}
      if((u=win(t,1.6,2.1))!=null){const v=ease(u);st.sy=1-0.1*v;st.sx=1+0.04*v;hot=v;}
      if((u=win(t,2.1,2.8))!=null){X=lerpN(bx,land,ease(u));st.dy=-170*4*u*(1-u);st.flip=u<0.5?1:-1;st.tilt=(u<0.5?-1:1)*0.12*Math.sin(u*Math.PI);hot=1-u;}
      if(t>=2.8){X=land;st.flip=-1;}
      if((u=win(t,2.8,3.05))!=null){const uu=u;st.sy=1-0.08*Math.sin(u*Math.PI);fx.push(x=>fxBurst(x,land,G(land)-4,2,uu,"#bcd2ff"));}
      const tipL=(th)=>{const dx=70,dy=100,c=Math.cos(th),s2=Math.sin(th);return[28+dx*c-dy*s2,-142+dx*s2+dy*c];};let tipAt=null;
      if((u=win(t,3.3,3.85))!=null){const v=ease(u);st.tilt=-0.05*v;st.sickle=-1.5*v;sick=v;hot=v*0.6;}
      if((u=win(t,3.85,4.2))!=null){const stp=Math.floor(u*5)/5,v=ease(stp),th=lerpN(-1.5,1.65,v);st.sickle=th;st.dx=70*v;st.tilt=-0.05+0.13*v;sick=1;
        const pts=[];for(let k=6;k>=0;k--){const w=ease(Math.max(0,stp-k*0.07)),t2=lerpN(-1.5,1.65,w);pts.push(bsPt(land,G(land)+4,{flip:-1,dx:70*w,tilt:-0.05+0.13*w},...tipL(t2)));}fx.push(x=>moSlash(x,pts,7,1));}
      if((u=win(t,4.2,4.75))!=null){const v=ease(u);st.sickle=1.65*(1-v);st.dx=70*(1-v);st.tilt=0.08*(1-v);sick=0.4*(1-v);}
      if(st.sickle!=null)tipAt=tipL(st.sickle);
      if((u=win(t,4.9,5.4))!=null){eyes2=ease(u);hot=0.3;}
      if((u=win(t,5.4,6.3))!=null){eyes2=1-u;const o=bsPt(land,G(land)+4,{flip:-1},31,-145);fx.push(x=>{for(const k of [-1,0,1]){const d=(t-5.4)*430,px=o[0]+d,py=o[1]+d*(0.18+k*0.16);if(d<620&&py<G(px))bsBolt(x,px,py,t);}});}
      if((u=win(t,hitT,hitT+0.13))!=null){st.dx=-10;st.flare=true;}
      return{X,Y:G(X)+4,st,hot,fx,eyes:[[-7,-175],[8,-176]],sick,eyes2,sickPt:tipAt};};
    return{tr,at,total:tr.total+0.1,hitT};},
  mist(wx,G){const bx=wx+330,tr=wTrack(wx,[W_READY(2.0),W_ROLL(1),W_READY(1.2),W_ROLL(1),W_READY(1.05),W_ROLL(1),W_READY(0.05),{...W_STRIKE(1)},W_READY(1.6)]);
    const hitT=tr.tag0("strike")+2/12,cr=[wx-40,wx-5,wx+30];
    const at=(t)=>{let st={},hot=0,fx=[],X=bx,u,br=null;
      if((u=win(t,0,1.3))!=null){const uu=u;st.dy=210*(1-ease(u));st.clipY=G(bx)+6;fx.push(x=>{const r=mvRng(3);for(let k=0;k<10;k++){const a=r()*Math.PI,d=uu*120*(0.5+r());fxMote(x,bx+Math.cos(a)*d*(r()<0.5?-1:1),G(bx)-Math.sin(a)*d*0.8+uu*uu*80,2.2,1-uu,"#2a2a22");}});}
      if((u=win(t,1.5,2.25))!=null){const v=ease(u);hot=0.5*v;fx.push(x=>{for(const p of cr)bsWarn(x,p,G,44,v,t,1);});}
      if((u=win(t,2.25,2.95))!=null){const up=u<0.3?ease(u/0.3):u<0.65?1:1-ease((u-0.65)/0.35);fx.push(x=>{bsRim(x,_S0,c=>{const r=mvRng(9);for(const p of cr)for(let k=0;k<2;k++){const bx2=p+(k?14:-10),h=(60+r()*36)*up,lean=(r()-0.5)*0.5;bsTaper(c,[bx2,G(bx2)+6],[bx2+lean*h*0.4,G(bx2)-h*0.5],[bx2+lean*h,G(bx2)-h],9,1.5);}});});}
      if((u=win(t,3.25,3.8))!=null){const v=ease(u);st.tilt=0.035*v;hot=v*0.6;br={grow:0.3*v,ang:-1.75,hot:v};}
      if((u=win(t,3.8,4.15))!=null){const v=ease(u);br={grow:lerpN(0.3,1,v),ang:lerpN(-1.75,-3.20,v),hot:1,sw:v}; /* it grows out as it swings down */st.tilt=0.035-0.06*v;}
      if((u=win(t,4.15,4.6))!=null){const v=ease(u);br={grow:1-v,ang:-3.20,hot:1-v};st.tilt=-0.025*(1-v);}
      if((u=win(t,4.9,5.4))!=null){hot=ease(u);}
      if((u=win(t,5.4,6.1))!=null){const o=bsPt(bx,G(bx)+4,{},0,-52);fx.push(x=>{for(let k=0;k<5;k++){const d=(t-5.4)*470,a=Math.PI+(k-2)*0.11,px=o[0]+Math.cos(a)*d,py=o[1]+Math.sin(a)*d;if(d<600)bsSplinter(x,px,py,a);}});hot=1-u;}
      if((u=win(t,hitT,hitT+0.13))!=null){st.dx=8;st.flare=true;}
      return{X,Y:G(bx)+4,st,hot,fx,eyes:[[-12,-84],[10,-82]],mouth:[0,-52],br};};
    return{tr,at,total:tr.total+0.1,hitT};}
};
let _S0=1;const S0=()=>_S0;
// the skull's tentacle: from a root, arching up and over, its tip coming down onto the ground (down: 0 raised high, 1 slammed)
function bsTentacle(x,S,root,tip,down,sd,t){const top=[(root[0]+tip[0])/2,Math.min(root[1],tip[1])-150-40*(1-down)],tp=[tip[0]+(1-down)*sd*30,tip[1]-(1-down)*170];
  bsRim(x,S,c=>{bsTaper(c,root,top,tp,22,6);});x.save();x.fillStyle="#c0603a";for(let k=1;k<8;k++){const u=k/8,m=1-u,px=m*m*root[0]+2*m*u*top[0]+u*u*tp[0],py=m*m*root[1]+2*m*u*top[1]+u*u*tp[1];x.beginPath();x.arc(px,py+4,2.2*(1-u*0.6),0,Math.PI*2);x.fill();}x.restore();}
// a wave of pale fire rolling along the ground (the ghost's wail)
function bsWave(x,X,G,sd,a,t){x.save();x.globalCompositeOperation="screen";for(let k=0;k<5;k++){const px=X-sd*k*10,h=(42-k*6)*(0.85+0.15*Math.sin(Math.floor(t*12)+k)),g=x.createLinearGradient(0,G(px),0,G(px)-h);g.addColorStop(0,LP.rgba("#ffd9a0",0.8*a));g.addColorStop(0.5,LP.rgba(MO.ember,0.55*a));g.addColorStop(1,LP.rgba("#f0c9e0",0));
  x.fillStyle=g;x.beginPath();x.moveTo(px-8,G(px)+2);x.quadraticCurveTo(px-sd*4,G(px)-h*0.6,px+sd*2,G(px)-h);x.quadraticCurveTo(px+sd*6,G(px)-h*0.5,px+8,G(px)+2);x.closePath();x.fill();}x.restore();}
function bsBolt(x,X,Y,t){fxGlowAt(x,X,Y,16,0.8,MO.ember);x.save();x.fillStyle="#ffd9a0";x.beginPath();x.arc(X,Y,3.2,0,Math.PI*2);x.fill();x.restore();moSlash(x,[[X-26,Y-4],[X-12,Y-2],[X,Y]],4,0.8);}
function bsSplinter(x,X,Y,a){x.save();x.translate(X,Y);x.rotate(a);x.fillStyle=LB.pal.INK;x.shadowColor=LP.rgba(MO.ember,0.95);x.shadowBlur=3;x.beginPath();x.moveTo(12,0);x.lineTo(-10,-2.6);x.lineTo(-13,0);x.lineTo(-10,2.4);x.closePath();x.fill();x.restore();fxGlowAt(x,X+Math.cos(a)*11,Y+Math.sin(a)*11,7,0.7,MO.ember);}
// the tree's long branch, grown out of its left side branch, swinging over and down
// the tree's long branch: grown from inside the trunk and drawn behind it, so it joins without a seam; its silhouette takes the bosses'
// ember rim and glow, and each length is graded across its width like the tree's own limbs (charcoal on its upper side, falling to ink)
const BS_CH=["#060508","#17141b","#27232d","#3a3544","#504a5c"]; // the card blacks (design system version 7)
function bsGradedTaper(x,p0,p1,p2,w0,w1){const dx=p2[0]-p0[0],dy=p2[1]-p0[1],L=Math.hypot(dx,dy)||1;let nx=dy/L,ny=-dx/L;if(ny>0){nx=-nx;ny=-ny;} // n points to the upper side
  const w=(w0+w1)/2,mx=(p0[0]+p2[0])/2,my=(p0[1]+p2[1])/2,hi=w>=6?BS_CH[4]:BS_CH[3],g=x.createLinearGradient(mx+nx*w*0.42,my+ny*w*0.42,mx-nx*w*0.42,my-ny*w*0.42);
  g.addColorStop(0,BS_CH[2]);g.addColorStop(0.3,hi);g.addColorStop(0.68,BS_CH[2]);g.addColorStop(1,BS_CH[0]);x.save();x.fillStyle=g;rlTaper(x,p0,p1,p2,w0*0.7,w1*0.7,16);x.restore();}
// the tree's long branch, in the tree's own picture: rooted inside the trunk and drawn before the tree's pieces, so the trunk covers its
// root and the rim goes round tree and branch as one shape; each length graded across its width like the tree's limbs
function bsBranchPts(br){const o=[4,-84],L=(250+46)*br.grow;const P=[o];let p=o,ang=br.ang;[[0.42,0],[0.31,0.18],[0.27,-0.28]].forEach( /* version 11: at head height (was from -96, bends +0.42, -0.36) */([f,da])=>{ang+=da;const q=[p[0]+Math.cos(ang)*L*f,p[1]+Math.sin(ang)*L*f];P.push(q);p=q;});return P;}
function bsBranchLocal(br){return uc=>{const P=bsBranchPts(br),W=[26,13,7,2],segs=[0,1,2].map(i=>{const a=P[i],b=P[i+1];return[a,[(a[0]+b[0])/2+(b[1]-a[1])*0.06,(a[1]+b[1])/2-(b[0]-a[0])*0.06],b,W[i],W[i+1]+1];}),
    twigs=[[1,22,-0.9],[2,16,0.8],[2,12,-0.7],[3,10,0.6]].map(([i,dl,dd])=>{const p=P[i],a0=Math.atan2(P[i][1]-P[i-1][1],P[i][0]-P[i-1][0])+dd;return[p,[p[0]+Math.cos(a0)*dl*0.5,p[1]+Math.sin(a0)*dl*0.5],[p[0]+Math.cos(a0+0.3)*dl,p[1]+Math.sin(a0+0.3)*dl],2.6,0.6];});
  for(const q of segs)bsTaper(uc,...q);for(const q of twigs)bsTaper(uc,...q);for(const q of segs)bsGradedTaper(uc,...q);uc.fillStyle=LB.pal.INK;};}
function bsBranchFx(x,X,Y,st,br){const P=bsBranchPts(br),tip=bsPt(X,Y,st,P[3][0],P[3][1]);moHot(x,tip[0],tip[1],14+12*br.hot,br.hot);
  if(br.sw!=null){const pts=[];for(let k=6;k>=0;k--){const aa=lerpN(-1.75,-3.20,Math.max(0,br.sw-k*0.1)),q=bsBranchPts({grow:br.grow,ang:aa})[3];pts.push(bsPt(X,Y,st,q[0],q[1]));}moSlash(x,pts,6,1);}}
// a fight's loop at play size in the boss's own place (the camera locked)
function loopFight(cv,t,lvAll,R,K,lv){const S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d");_S0=S;if(!K.scr||K.scr.width!==cv.width||K.scr.height!==cv.height)K.scr=LP.mk(cv.width,cv.height);
  const T=cpTerr(lv),G=x=>tGround(T,x),cam=300,wx=cam+W*0.22,key=lv+"@"+W.toFixed(0),F=K.F&&K.F.key===key?K.F:(K.F=Object.assign({key},BS_FIGHT[lv](wx,G))),tt=t%F.total,sc=rollScene(S),e=LB.places[lv].edge,opts=LB.options(lv,{walking:false});
  const hpAt=tt<F.hitT?1:0.86,trace=tt<F.hitT?1:Math.max(0.86,1-0.14*clamp01((tt-F.hitT-0.35)/0.6)),barA=clamp01((tt-0.6)/0.4)*(tt>F.total-0.4?(F.total-tt)/0.4:1);
  sc.fn=(x,s,W2,t2)=>{rlPath(x,T,cam,W2,G);x.save();x.translate(-cam,0);
    const q=F.tr.at(tt),wy=G(q.x)+1+q.y,b=F.at(tt);
    // the boss: its glow, itself, its signals, its reach
    bsDraw(x,K,S,lv,b.X,b.Y,t2,opts,b.br&&b.br.grow>0?Object.assign({},b.st,{extra:bsBranchLocal(b.br)}):b.st);if(b.br&&b.br.grow>0)bsBranchFx(x,b.X,b.Y,b.st,b.br);
    if(b.hot>0&&(b.st.alpha==null||b.st.alpha>0.3)){for(const p of b.eyes){const w=bsPt(b.X,b.Y,b.st,p[0],p[1]);moHot(x,w[0],w[1],10+12*b.hot,b.hot);}if(b.mouth){const w=bsPt(b.X,b.Y,b.st,b.mouth[0],b.mouth[1]);moHot(x,w[0],w[1],14+14*b.hot,b.hot*0.8);}if(b.hands){for(const h of b.hands){const w=bsPt(b.X,b.Y,b.st,h[0],h[1]);moHot(x,w[0],w[1],10+10*b.hot,b.hot);}}}
    if(b.sick){const w=bsPt(b.X,b.Y,b.st,...(b.sickPt||[98,-42]));moHot(x,w[0],w[1],16+16*b.sick,b.sick);}
    if(b.eyes2){for(const p of [[24,-150],[33,-147],[27,-141],[36,-139]]){const w=bsPt(b.X,b.Y,b.st,p[0],p[1]);moHot(x,w[0],w[1],6+8*b.eyes2,b.eyes2);}}
    // the skull's crawlers
    if(b.crawlers&&tt>=b.cs){b.crawlers.forEach((p,i)=>{const u=tt-b.cs,deadAt=b.dead[i],rise=clamp01(u/0.35),run=clamp01((u-0.45)/(deadAt-0.45)),X=lerpN(p,b.reach(i),run),dead=u>=deadAt?(u-deadAt)/1.2:null;
      if(dead!=null&&dead>=1)return;const m={kind:"crawlerP",ph:i*0.7,P:run>0&&run<1?{}:{t:1.0},X,Y:G(X)+3+(1-rise)*26};
      if(dead==null){x.save();x.beginPath();x.rect(X-80,-2000,160,2000+G(X)+4);x.clip();moDraw(x,K,"C"+i,S,m,t2+i,opts,u>=deadAt-0.13&&u<deadAt);x.restore();if(rise<1)fxBurst(x,p,G(p)-2,1,rise,"#3a2a22");}
      else{const M=moDraw({drawImage(){}},K,"C"+i,S,m,t2,opts,false);LP.drawDefeat(x,M,S,m.X,m.Y,LP.MON_BOX.crawler,dead,opts.defeat||"cardwisp",11+i);}});}
    K.late=b.fx; // drawn after the scene's fore layer, so warnings on the ground stay visible
    // the wanderer, and his fireball when he casts
    const P=q.P,Gm=mvDraw(x,q.x,wy,P,Math.floor(tt*12)/12,q.f,e,K132,{feet:q.y>-3});if(q.arc)fxSlash(x,q.x,wy,q.f,K132,P,q.arc[0],q.arc[1],q.arc[2],e);
    if(F.cast){const [c0,c1]=F.cast,u=win(tt,c0,c1);if(u!=null){const h=[q.x+16,wy-38],tg=bsPt(b.X,b.Y,b.st,0,F.aim);fxFire(x,lerpN(h[0],tg[0],u),lerpN(h[1],tg[1],u),1,K132*0.9,tt,1,1);}const ub=win(tt,c1,c1+0.45);if(ub!=null){const tg=bsPt(b.X,b.Y,b.st,0,F.aim);fxBurstL(x,tg[0],tg[1],K132,ub,1);}}
    x.restore();};
  c.setTransform(1,0,0,1,0,0);K.late=null;sc.render(c,K.scr,S,W,t,cam,opts);sc.fn=null;c.setTransform(S,0,0,S,-cam*S,0);if(K.late)K.late.forEach(f=>f(c));c.setTransform(S,0,0,S,0,0);
  {const pa=tt<0.2?tt/0.2:tt<2.2?1:Math.max(0,1-(tt-2.2)/0.4);if(K.hud)K.plaque={name:BS_NAME[lv],u:tt};else bsPlaque(c,W,BS_NAME[lv],pa);} /* with the HUD, the Interface's name plaque shows it */if(K.hud)K.bar={hp:hpAt,trace,a:barA};else bsBar(c,W,BS_NAME[lv],hpAt,trace,barA);
  scFade(c,W,LB.LH,tt>F.total-0.3?(tt-(F.total-0.3))/0.3:(tt<0.2?1-tt/0.2:0));}

/* ======================================== mv10.js ======================================== */
/* Round 10: the moments still to design, in the places with the HUD. Each loop leaves the HUD's state for this frame in K.hs:
   hits and a life lost (or a fall into a pit), then back at the checkpoint; and the end of a place: the boss falls, its drop, the plaque line,
   walking on, the place card, the next place beginning. */
const MO_LV=["night","storm","dawn","mist"];
const MO_CARD={night:["Night","The Graveyard"],storm:["Blood Red Rain","The Old Town"],dawn:["Dawn","The Open Moor"],mist:["Mist","The Wind Bent Forest"]};
const MO_DROP={night:["fire","Fireball: glows brighter"],storm:["reach","Sword: reaches beyond"],dawn:["heal","Heal: restores deeper"]};
const MO_LINES=[["heal","Heal mastered"],["fire","Fireball mastered"],["heal","Heal: restores deeper"],["fire","Fireball: glows brighter"],["reach","Sword: reaches beyond"],["rune","Sword: bites deeper"],["potH","Kept for later. Q to drink"],["potM","Kept for later. E to drink"],[null,"Again, harder"]];
let LOST_MODE="hits";
// the ghoul's swipe (round 7's poses), u seconds after its wind-up begins; the blow lands at about 0.6
function moSwipe(u){const TAU=Math.PI*2,rest=[-0.4,-0.08],wind=[2.75,3.1],hitA=[-1.55+TAU,-1.35+TAU],fol=[-0.75+TAU,-0.35+TAU],rest2=[-0.4+TAU,-0.08+TAU];
  if(u<0||u>=1.35)return{P:{},dx:0};
  if(u<0.45){const v=ease(u/0.45);return{P:{a:[lerpN(rest[0],wind[0],v),lerpN(rest[1],wind[1],v)],hot:v,op:3+5*v,lean:0.08*v,s1:0},dx:0};}
  if(u<0.7){const w=(u-0.45)/0.25,stp=Math.floor(w*4)/4,v=ease(stp),a=[lerpN(wind[0],hitA[0],v),lerpN(wind[1],hitA[1],v)],tr=[];for(let k=0;k<=8;k++){const q=ease(Math.min(stp,k/8));tr.push([lerpN(wind[0],hitA[0],q),lerpN(wind[1],hitA[1],q)]);}
    return{P:{a,hot:1,op:8,lean:-0.12*v,s1:0,slash:tr.slice(Math.max(0,Math.round(stp*8)-5),Math.round(stp*8)+1)},dx:-8*v};}
  if(u<0.95){const v=ease((u-0.7)/0.25);return{P:{a:[lerpN(hitA[0],fol[0],v),lerpN(hitA[1],fol[1],v)],hot:0.5*(1-v),op:6,lean:-0.12*(1-v),s1:0,slashA:1-v,slash:[0,0.25,0.5,0.75,1].map(k=>[lerpN(hitA[0],fol[0],k*v),lerpN(hitA[1],fol[1],k*v)])},dx:-8};}
  const v=ease((u-0.95)/0.4);return{P:{a:[lerpN(fol[0],rest2[0],v),lerpN(fol[1],rest2[1],v)],s1:0},dx:-8*(1-v)};}
const moPulse=tau=>tau>=0&&tau<1?0.2+0.8*(0.5+0.5*Math.cos(Math.PI*2*1.5*tau)):1;
// coming back at the checkpoint: a spark leaps from its glass to the wanderer's lantern and he forms again in its light
function moReturn(x,lv,e,postX,G,v,t2,S){const st={lit:1},gc=cpDraw(x,"B",lv,postX,G(postX)+3,st,t2),wx=postX+46,wy=G(wx)+1,vv=Math.max(0,v),P=mvIdle(Math.floor(vv*12));
  const a=clamp01((v-0.12)/0.3);x.save();x.globalAlpha=a;const Gm=mvDraw(x,wx,wy,P,Math.floor(vv*12)/12,1,e,K132,{feet:true,edgeA:0.4+0.6*a});x.restore();
  if(v>=0&&v<0.3)cpSpark(x,gc,mvPt(Gm,P,wx,wy,1,K132,13.4,3.5),v/0.3);
  return gc;}
// hits, then a life lost; or a fall into a pit. Both end back at the last checkpoint.
function loopLost(cv,t,lvAll,R,K){if(K.mode!==LOST_MODE){for(const k in K)delete K[k];K.mode=LOST_MODE;}const lv=lvAll,S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d");
  if(!K.scr||K.scr.width!==cv.width||K.scr.height!==cv.height)K.scr=LP.mk(cv.width,cv.height);
  const pit=LOST_MODE==="pit",cam=300,postX=cam+W*0.14,e=LB.places[lv].edge,sc=rollScene(S),opts=LB.options(lv,{walking:false});
  const pw=RL_PIT[lv][1]-RL_PIT[lv][0],pl=cam+W*0.6,key="lost-"+lv+"-"+W.toFixed(0);
  if(!K.T||K.T.key!==key)K.T=pit?{key,lv,pts:[[0,0,"f"],[8000,0,"f"]],pits:[[pl,pl+pw]],max:RL_MAX[lv],seed:RL_SEED[lv]+300,rough:RL_ROUGH[lv],len:8000}:Object.assign({},cpTerr(lv),{key});
  const T=K.T,G=x=>tGround(T,x),hs={pips:1,hp:0.34,mp:0.55,lives:3};K.hs=hs;
  // the timeline: hits (or the fall), the shatter, the fade, the return
  let shat,ret,tt;const ST=STEP*K132,wx0=pit?cam+W*0.6-120:cam+W*0.47;
  const I=[1.6,3.9,6.2],SW0=[1.0,3.3,5.6];
  if(pit){const steps=Math.round((pl+pw*0.42-wx0)/ST);K.steps=steps;K.tFall=0.5+steps/R;shat=K.tFall+0.34;}else shat=I[2]+4/R;
  const tOut=shat+0.8,tBlack=tOut+0.35,tRet=tBlack+0.3,total=tRet+2.4;tt=t%total;ret=tt-tRet;K.tm={tFall:K.tFall,shat,tRet,total};
  sc.fn=(x,s,W2,t2)=>{rlPath(x,T,cam,W2,G);cpDress(x,lv,G,cam,t2,[[cam+W*0.86,3]]);x.save();x.translate(-cam,0);
    if(ret>=0){moReturn(x,lv,e,postX,G,ret,t2,S);x.restore();return;}
    cpDraw(x,"B",lv,postX,G(postX)+3,{lit:1},t2);
    if(!pit){ // the ghoul and its three swipes
      const gx0=wx0+160;let gX=gx0,m={kind:"ghoulP",ph:0.3,P:{}};if(tt<1.0)gX=lerpN(wx0+320,gx0,ease(tt/1.0));
      for(const s0 of SW0){const u=tt-s0;if(u>=0&&u<1.35){const r=moSwipe(u);m.P=r.P;gX=gx0+r.dx;}}
      m.X=gX;m.Y=G(gX)+2;if(tt<shat+0.6)moDraw(x,K,"G",S,m,t2,opts,false);
      // the wanderer: knocked back a step by each blow; the third takes his last health
      let kb=0,P=mvIdle(Math.floor(tt*R)),eA=1,fx=null;
      I.forEach((Ik,k)=>{const d=tt-Ik;if(d<0)return;const st=Math.floor(d*R);kb+=8*K132*Math.min(1,d*R);
        if(k<2){if(st===0)P=PU.hit;else if(st===1)P=PU.stagger;else if(st===2)P=PU.recover;eA=Math.min(eA,moPulse(d));if(d<0.5)fx=[k===0?"shards":"ember",d];}
        else{P=st===0?PU.hit:st===1?PL.buckle:PL.kneel;if(d<0.45)fx=["ember",d];}});
      const X=wx0-kb,Y=G(X)+1;
      if(tt<shat){const Gm=mvDraw(x,X,Y,P,Math.floor(tt*R)/R,1,e,K132,{feet:true,edgeA:eA});const ch=mvPt(Gm,P,X,Y,1,K132,12,-21);
        if(fx){if(fx[0]==="shards")fxShards(x,ch[0],ch[1],1,K132,fx[1]/0.5,e);else fxEmber(x,ch[0],ch[1],1,K132,fx[1]/0.45);}}
      else mvShatter(x,K,X-6*K132,Y,1,Math.min(1,(tt-shat)/1.1),e);
      if(tt>=I[0]){hs.pips=0;if(tt<I[0]+0.4)hs.pipFx={i:0,kind:"crack",u:(tt-I[0])/0.4};}
      if(tt>=I[1])hs.hp=0.12;if(tt>=I[2])hs.hp=0;}
    else{ // walking on, a step too far: he drops into the pit and breaks up as he falls
      hs.pips=1;hs.hp=0.62;const tf=K.tFall,st=Math.min(K.steps,Math.max(0,(tt-0.5)*R));let X=wx0+st*ST,Y=G(X)+1,P=tt<0.5?mvIdle(Math.floor(tt*R)):mvWalk(Math.floor(st));
      if(tt>=tf){const d=tt-tf;X+=26*d;Y+=0.5*980*d*d;P=PJ.fall;}
      x.save();x.beginPath();x.rect(cam-200,-2000,W+400,2000+G(pl)-1);x.rect(pl+3,-2000,pw-6,4000);x.clip("nonzero");
      if(tt<shat)mvDraw(x,X,Y,P,Math.floor(tt*R)/R,1,e,K132,{feet:tt<tf});else mvShatter(x,K,X-6*K132,G(pl)+1+0.5*980*0.34*0.34,1,Math.min(1,(tt-shat)/1.1),e);
      x.restore();}
    x.restore();};
  if(tt>=shat){hs.lives=2;if(tt<shat+0.8)hs.lifeFx={i:2,u:(tt-shat)/0.8};}
  if(ret>=0){hs.pips=0;const r=clamp01((ret-0.3)/0.5),q=Math.round(r*8)/8;hs.hp=q;hs.mp=0.55+0.45*q;hs.lives=2;}
  c.setTransform(1,0,0,1,0,0);sc.render(c,K.scr,S,W,t,cam,opts);sc.fn=null;c.setTransform(S,0,0,S,0,0);
  const fa=tt<0.25?1-tt/0.25:tt<tOut?0:tt<tBlack?(tt-tOut)/0.35:tt<tRet?1:tt<tRet+0.35?1-(tt-tRet)/0.35:tt>total-0.3?(tt-(total-0.3))/0.3:0;
  scFade(c,W,LB.LH,fa);hs.hudA=1;}
// the end of a place: its boss falls, the drop, the plaque line, walking on, the card, the next place. Night's card opens the run.
const _noCtx={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(){},beginPath(){},rect(){},clip(){}};
function loopEnd(cv,t,lvAll,R,K){const lv=lvAll,S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d"),i=MO_LV.indexOf(lv),prev=i>0?MO_LV[i-1]:null;
  if(K.lv!==lv){for(const k in K)delete K[k];K.lv=lv;}if(!K.scr||K.scr.width!==cv.width||K.scr.height!==cv.height)K.scr=LP.mk(cv.width,cv.height);
  const cam=300,imp=0.2+1/R,ST=STEP*K132;let tA,tCard;
  // the boss's end, in the place before
  const bx=cam+W*0.66,T0=prev?cpTerr(prev):null,G0=x=>tGround(T0,x),wx0=bx-150,LX=bx-44;
  let steps=0,tWalk=imp+1.9,tPick=0,tLine=0;if(prev){steps=Math.max(1,Math.round((LX-6-wx0)/ST));tPick=tWalk+steps/R;tLine=tPick+0.35;tA=tLine+2.1;}else tA=0.9;
  tCard=tA;const tC=tCard+3.0,total=tC+2.4,tt=t%total,hs={};K.hs=hs;K.tm={imp,tWalk,tPick,tLine,tCard,tC,total};
  if(tt<imp)K.Kd={};
  c.setTransform(1,0,0,1,0,0);
  const drawPrevEnd=(ta)=>{const e=LB.places[prev].edge,sc=rollScene(S),opts=LB.options(prev,{walking:false});
    sc.fn=(x,s,W2,t2)=>{rlPath(x,T0,cam,W2,G0);x.save();x.translate(-cam,0);const by=G0(bx);
      if(ta<imp)bsDraw(x,K,S,prev,bx,by,t2,opts,{});
      else{if(!K.B||K.BS!==S)bsDraw(_noCtx,K,S,prev,bx,by,t2,opts,{glow:0});const u=Math.min(1,(ta-imp)/2.2),gf=1-u/0.36;if(gf>0)LP.bossGlow(x,bx,by,prev,gf);if(!K.Kd)K.Kd={};LP.bossDefeat(x,K.B,S,bx,by,u,77,prev,K.Kd);}
      // the wanderer: the last blow, a pause, walking to the drop and on
      let X=wx0,P=mvIdle(Math.floor(ta*R)),arc=null;
      if(ta>=0.2&&ta<0.2+6/R){const a=swordAt((ta-0.2)*R+2,LVLS[0]);P=a.P;arc=a.arc;}
      else if(ta>=tWalk){const st=(ta-tWalk)*R;X=wx0+st*ST;P=mvWalk(Math.floor(st));}
      const Y=G0(X)+1,Gm=mvDraw(x,X,Y,P,Math.floor(ta*R)/R,1,e,K132,{feet:true});if(arc)fxSlash(x,X,Y,1,K132,P,arc[0],arc[1],arc[2],e,LVLS[0]);
      const ch=mvPt(Gm,P,X,Y,1,K132,4,-22),kind=MO_DROP[prev][0],gy=G0(LX)+1;
      if(ta<tPick)drawLootDrop(x,kind,LX,gy,bx-10,by-120,(ta-(imp+1.1))/0.45,t2);else drawLootPick(x,kind,LX,gy,ch[0],ch[1],(ta-tPick)/0.5,t2);
      x.restore();};
    sc.render(c,K.scr,S,W,t,cam,opts);sc.fn=null;};
  const drawNext=(tn)=>{if(!K.C)K.C={};loopRoll(cv,tn,lv,R,K.C,lv);};
  if(tt<tCard){if(prev)drawPrevEnd(tt);else{c.fillStyle=LB.pal.INK;c.fillRect(0,0,cv.width,cv.height);}}
  else if(tt<tC){const u=tt-tCard;if(u<0.5&&prev){drawPrevEnd(tCard);c.setTransform(S,0,0,S,0,0);scFade(c,W,LB.LH,u/0.5);}
    else if(u>=1.9){drawNext(0.3);c.setTransform(S,0,0,S,0,0);scFade(c,W,LB.LH,1-(u-1.9)/1.1);}else{c.fillStyle=LB.pal.INK;c.fillRect(0,0,cv.width,cv.height);}}
  else drawNext(0.3+(tt-tC));
  c.setTransform(S,0,0,S,0,0);if(tt>total-0.3){scFade(c,W,LB.LH,(tt-(total-0.3))/0.3);}
  // the HUD's state
  hs.hudA=tt<tCard?(prev?1:0):tt<tC?(tt-tCard<0.5?(prev?1-(tt-tCard)/0.5:0):tt-tCard>=1.9?(tt-tCard-1.9)/1.1:0):1;
  if(prev&&tt<tCard){const after=tt>=imp;hs.boss={name:BS_NAME[prev],hp:after?0:0.12,trace:after?Math.max(0,0.12*(1-(tt-imp-0.2)/0.5)):0.12,a:after?clamp01(1-(tt-imp-0.5)/0.4):1};
    if(tt>=imp+2.0)hs.wisps=211;else hs.wisps=186;if(tt>=tLine&&tt<tLine+2)hs.line={kind:MO_DROP[prev][0],text:MO_DROP[prev][1],u:tt-tLine};}
  else hs.wisps=prev?211:0;
  if(tt>=tCard&&tt<tC){const u=tt-tCard;hs.card={lv,a:u<0.5?0:u<0.9?(u-0.5)/0.4:u<2.4?1:Math.max(0,1-(u-2.4)/0.6)};}
  if(!prev){hs.hp=1;hs.mp=1;hs.pips=0;hs.lives=3;hs.spells=[];}
  if(tt>total-0.3)hs.hudA=Math.min(hs.hudA,1-(tt-(total-0.3))/0.3);}

/* ======================================== hud13.js ======================================== */
/* Round 13 (design system version 11): the potion sockets. One health potion and one mana potion can be kept and drunk when the
   player chooses: two 44px sockets (40 on a computer, as the HUD tiles), each showing a faint outline when empty, the potion when kept,
   and the potion dimmed while its bar is full (it can't be drunk then). Placement "under" the plaque (B) or "beside" the spell (A).
   HUD.set takes potions: {health, mana} and potFx: {k, kind: "keep"|"drink", u}; HUD.opts.rm and HUD.opts.fxOff give the moments'
   Reduce motion and Effects off versions. Computers show each socket's key (Q, E).
   Round 10 (from round 9's HUD): the moments' Interface parts added: the plaque line, the boss's name plaque, the place card.
   Round 9: the HUD. Interface parts in HTML and CSS (the design system's lb- classes, plus hud9.css), laid over the live places.
   HUD.build(el, phone) writes a HUD into a stage; HUD.set(el, st) shows a state; HUD.tick(...) runs the stages and the close-ups each frame. */
const HUD=(()=>{
const SH="M0.8 1.7 Q5 0.1 9.2 1.7 L9.2 5.6 Q9.2 9.5 5 11.5 Q0.8 9.5 0.8 5.6 Z";
// round 13: the two potions in a 24-unit box: the glass's outline (neck, lip, body), the liquid's top when full, and the mark
const POT={health:{glass:"M8.8 2.4 H15.2 V4.4 H13.7 V8.62 A6.6 6.6 0 1 1 10.3 8.62 V4.4 H8.8 Z",body:"M12 9.1 A5.9 5.9 0 1 1 11.99 9.1 Z",top:11.2,
    mark:"M12 18.9 C9.2 17 8.2 15.6 8.2 14.3 A1.9 1.9 0 0 1 12 13.5 A1.9 1.9 0 0 1 15.8 14.3 C15.8 15.6 14.8 17 12 18.9 Z"},
  mana:{glass:"M9.8 2.4 H14.2 V4.4 H13.4 V7 Q15.6 8.3 15.6 10.6 V19.4 Q15.6 21.6 13.4 21.6 H10.6 Q8.4 21.6 8.4 19.4 V10.6 Q8.4 8.3 10.6 7 V4.4 H9.8 Z",
    body:"M9.1 10.6 Q9.1 8.9 10.9 7.9 H13.1 Q14.9 8.9 14.9 10.6 V19.3 Q14.9 20.9 13.3 20.9 H10.7 Q9.1 20.9 9.1 19.3 Z",top:11.6,
    mark:"M12 11.9 C13.8 14 14.3 15.3 14.3 16.6 A2.3 2.3 0 0 1 9.7 16.6 C9.7 15.6 10.3 14.6 11.1 13.9 C11.2 14.8 11.6 15.3 12.1 15.4 C12 14.3 11.7 13.2 12 11.9 Z"}};
const ICON={
  heart:(w,h)=>`<svg width="${w}" height="${h}" viewBox="0 0 14 13" aria-hidden="true"><path d="M7 12.5 C2 9 0 6.5 0 4 A3.6 3.6 0 0 1 7 2.4 A3.6 3.6 0 0 1 14 4 C14 6.5 12 9 7 12.5 Z"/></svg>`,
  flame:(w,h)=>`<svg width="${w}" height="${h}" viewBox="0 0 12 18" aria-hidden="true"><path d="M6 1 C9 6 11 8 11 12 A5 5 0 0 1 1 12 C1 8 3 6 6 1 Z"/></svg>`,
  pip:()=>`<svg class="lb-pip" viewBox="0 0 10 12" aria-hidden="true"><path class="slot" d="${SH}"/><g class="hl"><path class="half" clip-path="url(#lbPipL)" d="${SH}"/></g><g class="hr"><path class="half" clip-path="url(#lbPipR)" d="${SH}"/></g><path class="crack" d="M5 0.9 L4 3.6 L6 6.2 L4.6 8.6 L5 11.4"/><path class="glint" d="M5 2.2 L6.4 6 L5 9.8 L3.6 6 Z"/></svg>`,
  life:()=>`<svg class="lb-life" viewBox="0 0 10 15" aria-hidden="true"><circle class="ring" cx="5" cy="1.5" r="1.1"/><path class="frame" d="M2 4.7 L3.5 2.7 H6.5 L8 4.7 Z"/><rect class="glass" x="2.4" y="4.7" width="5.2" height="7.3"/><path class="flame" d="M5 6.3 Q6.5 8.4 5.9 9.7 Q5 10.9 4.1 9.7 Q3.5 8.4 5 6.3 Z"/><path class="frame" d="M1.6 12 H8.4 L7.5 13.8 H2.5 Z"/><circle class="puff" cx="5" cy="2" r="1.2"/><circle class="puff" cx="5" cy="2" r="1.2"/><circle class="puff" cx="5" cy="2" r="1.2"/></svg>`,
  heal:`<ellipse cx="12" cy="16.3" rx="7.6" ry="2.7"/><path d="M12 15.4 V4.6 M7.6 8.8 L12 4.2 L16.4 8.8"/>`,
  fire:`<circle class="solid" cx="16" cy="12" r="4.8"/><path class="solid" d="M13.8 8.2 L3.6 4.4 L11.2 10.6 Z M12.4 10.8 L0.8 12.4 L12.4 13.8 Z M13.8 15.8 L4.2 18.8 L11.2 13.6 Z"/>`,
  reach:`<path d="M19.2 4.8 L9.4 14.6 M6.8 12 L12 17.2 M9.4 14.6 L5.4 18.6"/><circle class="solid" cx="4.6" cy="19.4" r="1.5"/>`,
  rune:`<path d="M7.2 20 L5.6 11.2 L9.2 4.2 L16 3.6 L18.6 11.8 L16.4 20 Z"/><path class="solid" d="M12 7.4 L14.5 11.6 L12 15.8 L9.5 11.6 Z"/>`,
  full:`<path d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15"/>`,
  pause:`<path d="M9 5 V19 M15 5 V19"/>`,
  help:`<path d="M9.2 9.3 A2.85 2.85 0 1 1 13.4 11.8 C12.4 12.4 12 13 12 14.3"/><circle cx="12" cy="18" r="1.3" style="fill:var(--heading);stroke:none"/>`,
  jump:`<path d="M12 16.5 V4.5 M7 9.5 L12 4.5 L17 9.5 M6 20.5 H18"/>`,
  attack:`<path d="M19.2 4.8 L9.4 14.6 M6.8 12 L12 17.2 M9.4 14.6 L5.4 18.6"/><circle class="solid" cx="4.6" cy="19.4" r="1.5"/>`,
  stick:`<path class="l" d="M23 45 L14 56 L23 67"/><path class="r" d="M89 45 L98 56 L89 67"/><path class="u" d="M45 23 L56 14 L67 23"/>`,
  // round 13: the potions, as on the ground (a round flask with a heart, a tall vial with a flame), for the plaque line and How to play
  potH:`<path d="${POT.health.glass}"/><path class="solid" d="${POT.health.mark}"/>`,
  potM:`<path d="${POT.mana.glass}"/><path class="solid" d="${POT.mana.mark}"/>`
};
const NAME={heal:"heal",fire:"fireball"};
const defs=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="lbPotH" clipPathUnits="userSpaceOnUse"><path d="${POT.health.body}"/></clipPath><clipPath id="lbPotM" clipPathUnits="userSpaceOnUse"><path d="${POT.mana.body}"/></clipPath><linearGradient id="lbLiqH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--health-top)"/><stop offset="1" stop-color="var(--health-low)"/></linearGradient><linearGradient id="lbLiqM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mana-top)"/><stop offset="1" stop-color="var(--mana-low)"/></linearGradient><clipPath id="lbPipL" clipPathUnits="userSpaceOnUse"><path d="M-1 -1 H5 V0.9 L4 3.6 L6 6.2 L4.6 8.6 L5 11.4 V13 H-1 Z"/></clipPath><clipPath id="lbPipR" clipPathUnits="userSpaceOnUse"><path d="M11 -1 H5 V0.9 L4 3.6 L6 6.2 L4.6 8.6 L5 11.4 V13 H11 Z"/></clipPath></defs></svg>`;
let defsDone=false;
function oct(w,cls){const c=w*0.293,a=0.75,b=w-0.75,p=[[c,a],[w-c,a],[b,c],[b,w-c],[w-c,b],[c,b],[a,w-c],[a,c]].map(q=>q.map(v=>v.toFixed(2)).join(",")).join(" ");
  return `<svg class="oct ${cls||""}" viewBox="0 0 ${w} ${w}" aria-hidden="true"><polygon points="${p}"/></svg>`;}
function tile(icon,label,phone){return `<button class="lb-tile${phone?" is-phone":""}" type="button" aria-label="${label}"><span><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[icon]}</svg></span></button>`;}
function vitals(phone,extra,pots){const iw=phone?13:14;
  return `<div class="lb-plaque is-hud lb-vitals is-full${phone?" is-phone":""}${extra||""}" role="group" aria-label=""><div class="lb-face">
    <div class="lb-vitals-rows">
      <div class="lb-bar-row">${ICON.heart(iw,phone?12:13)}<div class="lb-bar hp"><i></i></div><span class="lb-pips">${ICON.pip()}${ICON.pip()}${ICON.pip()}</span></div>
      <div class="lb-bar-row">${ICON.flame(iw,iw)}<div class="lb-bar is-mana mp"><i></i></div></div>
      <div class="lb-lives" aria-hidden="true">${ICON.life()}${ICON.life()}${ICON.life()}</div>
    </div>
    <button class="lb-spell" type="button" aria-label=""><span><svg class="pic" viewBox="0 0 24 24" aria-hidden="true"></svg><span class="lb-spell-marks" aria-hidden="true"></span></span></button>${pots||""}
  </div></div>`;}
// round 13: a potion socket (the button is clipped to its chamfer, so the key sits beside it in the wrapper) and the pair
function potion(k,phone){const P=POT[k],kk=k==="health"?"Q":"E",C=k==="health"?"H":"M";
  return `<span class="lb-potion-wrap${phone?" is-phone":""}"><button class="lb-potion is-${k}${phone?" is-phone":""}" type="button" data-k="${k}" aria-label="No ${k} potion"><span>
    <svg class="pot" viewBox="0 0 24 24" aria-hidden="true"><path class="glass-back" d="${P.glass}"/><g class="liq-g" clip-path="url(#lbPot${C})"><rect class="liq" x="3" y="${P.top}" width="18" height="12" fill="url(#lbLiq${C})"/><path class="shine" d="M${k==="health"?"8.4 13.4 Q8.6 11.4 10.2 10.4":"10.2 11.6 V18.4"}"/></g>
      <path class="glass" d="${P.glass}"/><path class="mark" d="${P.mark}"/><path class="glint" d="M5 22 L9 22 L20 3 L16 3 Z"/></svg></span></button>${phone?"":`<span class="lb-pkey" aria-hidden="true">${kk}</span>`}</span>`;}
function potions(phone,beside){return `<div class="lb-potions${beside?" is-beside":""}${phone?" is-phone":""}" role="group" aria-label="Potions kept">${potion("health",phone)}${potion("mana",phone)}</div>`;}
function counter(phone,label,num){return `<div class="lb-plaque is-hud lb-counter${phone?" is-phone":""}" role="status" aria-label="${num} ${label.toLowerCase()}"><div class="lb-face"><span class="lb-counter-label" aria-hidden="true">${label}</span><span class="lb-counter-num" aria-hidden="true">${num}</span></div></div>`;}
function build(el,phone,opt){if(!defsDone){document.body.insertAdjacentHTML("afterbegin",defs);defsDone=true;}const pot=(opt&&opt.pot)||"under";
  el.insertAdjacentHTML("beforeend",`<div class="lb-ui lb-hud${phone?" is-phone":""}">
    <div class="lb-hud-left">${pot==="beside"?vitals(phone,"",potions(phone,true)):vitals(phone)}${pot==="under"?potions(phone,false):""}</div>
    <div class="lb-hud-right">${phone?"":tile("full","Full screen")}${tile("help","How to play",phone)}${tile("pause","Pause",phone)}${counter(phone,"Wisps","0000")}</div>
    <div class="lb-bossbar" role="meter" aria-valuemin="0" aria-valuemax="100" hidden><p class="lb-bossbar-name"></p><div class="lb-bossbar-edge"><div class="lb-bossbar-track"><i class="trace"></i><i class="fill"></i></div></div></div>
    <div class="lb-plaque is-hud lb-line" hidden><div class="lb-face"><svg class="pic" viewBox="0 0 24 24" aria-hidden="true"></svg><span class="lb-line-text"></span></div></div>
    <div class="lb-plaque is-hud lb-line is-name" hidden><div class="lb-face"><span class="lb-line-text"></span><div class="lb-rule" aria-hidden="true"><i></i></div></div></div>
    <div class="lb-card" hidden><div class="lb-plaque${phone?" is-phone":""}"><div class="lb-face is-centred"><h2 class="lb-heading"></h2><div class="lb-rule" aria-hidden="true"><i></i></div><p class="lb-card-sub"></p></div></div></div>
    ${phone?`<div class="lb-touch" aria-hidden="true">
      <div class="lb-stick">${oct(112,"base")}<svg class="chev" viewBox="0 0 112 112">${ICON.stick}</svg><div class="lb-knob">${oct(50,"knob")}<i></i></div></div>
      <div class="lb-thumb"></div>
      <button class="lb-touch-btn b-jump" type="button" tabindex="-1" style="right:104px;bottom:22px">${oct(64)}<svg class="ic" viewBox="0 0 24 24">${ICON.jump}</svg></button>
      <button class="lb-touch-btn b-attack" type="button" tabindex="-1" style="right:26px;bottom:22px">${oct(64)}<svg class="ic" viewBox="0 0 24 24">${ICON.attack}</svg></button>
      <button class="lb-touch-btn is-small b-cast" type="button" tabindex="-1" style="right:70px;bottom:98px">${oct(54)}<svg class="ic" viewBox="0 0 24 24"></svg></button>
    </div>`:""}
  </div>`);
  return el.lastElementChild;}
// ---- showing a state ----
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mixHex=(a,b,u)=>{const A=hexRGB(a),B=hexRGB(b);return "rgb("+A.map((v,i)=>Math.round(v+(B[i]-v)*u)).join(",")+")";};
const ease=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
function setOnce(o,k,v,f){if(o["_"+k]!==v){o["_"+k]=v;f(v);}}
function picFor(svg,kind){setOnce(svg,"pic",kind||"",k=>{svg.innerHTML=k?ICON[k]:"";});}
function setLine(ln,line){const on=!!line;if(ln.hidden===on)ln.hidden=!on;if(!on)return;
  setOnce(ln,"t",line.text,v=>{ln.querySelector(".lb-line-text").textContent=v;ln.setAttribute("aria-label",v);});ln.classList.toggle("no-pic",!line.kind);if(line.kind)picFor(ln.querySelector(".pic"),line.kind);
  const u=line.u,long=ln.classList.contains("is-name"),T=long?2.6:2,a=u<0.22?u/0.22:u>T-0.4?Math.max(0,(T-u)/0.4):1,dy=-8*(1-ease(Math.min(1,u/0.25)));ln.style.opacity=String(a);ln.style.transform=`translate(-50%,${dy.toFixed(2)}px)`;}
function setCard(cd,card){const on=!!(card&&card.a>0);if(cd.hidden===on)cd.hidden=!on;if(!on)return;
  setOnce(cd,"lv",card.lv,v=>{cd.querySelector(".lb-heading").textContent=MO_CARD[v][0];cd.querySelector(".lb-card-sub").textContent=MO_CARD[v][1];cd.setAttribute("aria-label",MO_CARD[v][0]+", "+MO_CARD[v][1]);});cd.style.opacity=String(card.a);}
// round 13: one socket. Kept: the flask grows in from 0.6 with one glint passing over it (0.4 s); Reduce motion fades it in, Effects off
// leaves out the glint's light. Drunk: the liquid drains in 0.35 s, then the faint outline; Reduce motion fades the liquid out instead.
const OPTS={rm:false,fxOff:false};
function setPotion(b,st){const k=b.dataset.k,has=!!(st.potions&&st.potions[k]),topped=(k==="health"?st.hp:st.mp)>=0.999,fx=st.potFx&&st.potFx.k===k?st.potFx:null,
    svg=b.querySelector(".pot"),liq=b.querySelector(".liq"),gl=b.querySelector(".glint"),mk=b.querySelector(".mark"),top=POT[k].top,rm=OPTS.rm;
  const showFull=has||(fx&&fx.kind==="drink");b.classList.toggle("has-potion",showFull);b.classList.toggle("is-topped",has&&topped&&!fx);b.classList.toggle("fx-off",OPTS.fxOff);
  let sc=1,op=1,ly=top,la=1,ga=0,gx=0;
  if(fx&&fx.kind==="keep"){const u=Math.min(1,fx.u);if(rm){op=Math.min(1,u/0.75);}else{sc=0.6+0.4*ease(Math.min(1,u/0.7));op=Math.min(1,u/0.35);if(u>0.35){const g=(u-0.35)/0.65;ga=Math.sin(Math.min(1,g)*Math.PI)*0.85;gx=-14+28*g;}}}
  if(fx&&fx.kind==="drink"){const u=Math.min(1,fx.u);if(rm){la=1-u;}else{ly=top+(22-top)*ease(u);}if(u>=1){b.classList.remove("has-potion");}}
  svg.style.transform=sc!==1?`scale(${sc.toFixed(3)})`:"";svg.style.opacity=op!==1?op.toFixed(3):"";
  liq.setAttribute("y",ly.toFixed(2));liq.style.opacity=la!==1?la.toFixed(3):"";mk.style.opacity=fx&&fx.kind==="drink"?String(rm?la:Math.max(0,1-fx.u*1.6)):"";
  gl.style.opacity=ga>0.01?ga.toFixed(3):"0";gl.setAttribute("transform",`translate(${gx.toFixed(2)} 0)`);
  const keyTxt=b.parentElement.querySelector(".lb-pkey");if(keyTxt)keyTxt.classList.toggle("is-on",!!(fx&&fx.kind==="drink"&&fx.u<0.5));
  const name=k==="health"?"Health potion":"Mana potion",how=b.classList.contains("is-phone")?"Tap to drink":(k==="health"?"Q to drink":"E to drink");
  setOnce(b,"lab",has?(topped?`${name}, kept. ${k==="health"?"Health":"Mana"} is full`:`${name}, kept. ${how}`):`No ${k} potion kept`,v=>b.setAttribute("aria-label",v));}
function set(hud,st){const q=s=>hud.querySelector(s);
  const hp=Math.round(st.hp*100),mp=Math.round(st.mp*100);
  setOnce(hud,"hp",hp,v=>q(".hp").style.setProperty("--v",v+"%"));setOnce(hud,"mp",mp,v=>q(".mp").style.setProperty("--v",v+"%"));
  const pips=hud.querySelectorAll(".lb-pip");pips.forEach((p,i)=>{const fx=st.pipFx&&st.pipFx.i===i?st.pipFx:null;p.classList.toggle("is-on",i<st.pips||!!fx);
    const hl=p.querySelector(".hl"),hr=p.querySelector(".hr"),ck=p.querySelector(".crack"),gl=p.querySelector(".glint");
    if(fx&&fx.kind==="crack"){const u=fx.u,a=ease(Math.max(0,(u-0.25)/0.75));ck.style.opacity=u<0.25?u/0.25:Math.max(0,1-a*1.6);
      hl.setAttribute("transform",`translate(${-1.6*a} ${3.2*a*a}) rotate(${-16*a} 5 11)`);hr.setAttribute("transform",`translate(${1.6*a} ${3.6*a*a}) rotate(${18*a} 5 11)`);hl.style.opacity=hr.style.opacity=String(1-a);gl.style.opacity=0;}
    else if(fx&&fx.kind==="gain"){const u=fx.u,s=0.35+0.65*ease(Math.min(1,u/0.6));hl.setAttribute("transform",`translate(5 6) scale(${s}) translate(-5 -6)`);hr.setAttribute("transform",`translate(5 6) scale(${s}) translate(-5 -6)`);
      hl.style.opacity=hr.style.opacity=String(Math.min(1,u/0.35));gl.style.opacity=u>0.45?Math.max(0,1-Math.abs(u-0.7)/0.25):0;ck.style.opacity=0;}
    else{if(hl.getAttribute("transform")){hl.removeAttribute("transform");hr.removeAttribute("transform");}hl.style.opacity=hr.style.opacity="";ck.style.opacity=0;gl.style.opacity=0;}});
  const lives=hud.querySelectorAll(".lb-life");lives.forEach((l,i)=>{const fx=st.lifeFx&&st.lifeFx.i===i?st.lifeFx:null,g=l.querySelector(".glass"),f=l.querySelector(".flame"),pf=l.querySelectorAll(".puff");
    if(fx){l.classList.remove("is-out");const u=fx.u,a=Math.min(1,u/0.5);g.style.fill=mixHex("#ffcf6a","#1a1218",ease(a));f.style.opacity=String(Math.max(0,1-a*1.4));f.setAttribute("transform",`translate(5 9.8) scale(${Math.max(0.01,1-a)}) translate(-5 -9.8)`);
      pf.forEach((p,j)=>{const v=(u-0.3-j*0.12)/0.55;if(v<=0||v>=1){p.style.opacity=0;return;}p.setAttribute("cy",String(3-9*v));p.setAttribute("cx",String(5+Math.sin(v*5+j*2)*1.6));p.setAttribute("r",String(1+1.4*v));p.style.opacity=String(0.75*(1-v));});}
    else{l.classList.toggle("is-out",i>=st.lives);g.style.fill="";f.style.opacity="";f.removeAttribute("transform");pf.forEach(p=>p.style.opacity=0);}});
  const sp=q(".lb-spell"),pic=sp.querySelector(".pic"),marks=sp.querySelector(".lb-spell-marks"),n=st.spells.length,kind=n?st.spells[st.sel%n]:null,short=n&&st.mp<st.cost;
  sp.classList.toggle("is-empty",!n);sp.classList.toggle("has-two",n>1);sp.classList.toggle("is-short",!!short);
  picFor(pic,st.flipKind||kind);pic.style.transform=st.flip!=null?`translateY(${n>1?-3:0}px) scaleX(${Math.max(0.04,Math.abs(1-2*st.flip))})`:"";
  setOnce(marks,"m",n>1?n+":"+(st.sel%n):"",v=>{marks.innerHTML=n>1?st.spells.map((s,i)=>`<i${i===st.sel%n?' class="is-on"':""}></i>`).join(""):"";});
  setOnce(sp,"lab",kind?`Spell: ${NAME[kind]}${n>1?". Tap to switch":""}${short?". Not enough mana":""}`:"No spell yet",v=>sp.setAttribute("aria-label",v));
  const cast=q(".b-cast");if(cast){cast.classList.toggle("is-empty",!n);cast.classList.toggle("is-short",!!short);picFor(cast.querySelector(".ic"),kind);}
  setOnce(q(".lb-vitals"),"lab",`Health ${hp} per cent, armour ${st.pips} of 3, mana ${mp} per cent, ${st.lives} ${st.lives===1?"life":"lives"} left`,v=>q(".lb-vitals").setAttribute("aria-label",v));
  hud.querySelectorAll(".lb-potion").forEach(b=>setPotion(b,st));
  const ctr=q(".lb-counter");if(ctr&&st.wisps!=null)setOnce(ctr,"w",st.wisps,v=>{const s=String(v).padStart(4,"0");ctr.querySelector(".lb-counter-num").textContent=s;ctr.setAttribute("aria-label",v+" wisps");});
  const ha=st.hudA==null?1:st.hudA;[".lb-hud-left",".lb-hud-right",".lb-touch"].forEach(sl=>{const e=q(sl);if(e)setOnce(e,"ha",ha.toFixed(2),v=>e.style.opacity=v);});
  const ln=q(".lb-line:not(.is-name)");if(ln)setLine(ln,st.line);const nm=q(".lb-line.is-name");if(nm)setLine(nm,st.name&&st.name.u<2.6?{kind:null,text:st.name.name,u:st.name.u}:null);const cd=q(".lb-card");if(cd)setCard(cd,st.card);
  const bb=q(".lb-bossbar");if(bb){const on=!!(st.boss&&st.boss.a>0&&ha>0);if(bb.hidden===on)bb.hidden=!on;
    if(on){setOnce(bb,"n",st.boss.name,v=>{bb.querySelector(".lb-bossbar-name").textContent=v;bb.setAttribute("aria-label",v);});bb.style.opacity=String(st.boss.a*ha);
      const tr=bb.querySelector(".lb-bossbar-track");tr.style.setProperty("--v",st.boss.hp.toFixed(3));tr.style.setProperty("--trace",Math.max(st.boss.hp,st.boss.trace).toFixed(3));setOnce(bb,"vn",Math.round(st.boss.hp*100),v=>bb.setAttribute("aria-valuenow",String(v)));}}}
// ---- the stages' scenes: the place on the way (round 5's rolling ground), or its boss fight (round 8) with the HUD's bar instead of the drawn one ----
let MODE="way";
function loopHud(cv,t,lv,R,K,arg){const md=arg==="boss"||arg==="way"?arg:MODE;if(K.mode!==md){for(const k in K)delete K[k];K.mode=md;}
  if(md==="boss"){K.hud=true;loopFight(cv,t,lv,R,K,lv);}else{K.bar=null;K.plaque=null;loopRoll(cv,t,lv,R,K,lv);}}
const BASE={hp:0.8,mp:0.62,pips:2,lives:2,spells:["heal","fire"],sel:1,cost:0.25,wisps:186,potions:{health:true,mana:false}};
// ---- the phone's stick: a short demonstration, and the real thing when the phone stage is tried at full size ----
let stickRest="hidden";
function stickShow(hud,x,y,dx,dy,a,thumb){const s=hud.querySelector(".lb-stick");if(!s)return;s.style.left=x+"px";s.style.top=y+"px";s.style.opacity=String(a);
  const k=s.querySelector(".lb-knob");k.style.transform=`translate(${dx}px,${dy}px)`;const sv=s.querySelector(".chev");
  sv.querySelector(".l").classList.toggle("is-lit",dx<-12&&Math.abs(dx)>Math.abs(dy)*0.8);sv.querySelector(".r").classList.toggle("is-lit",dx>12&&Math.abs(dx)>Math.abs(dy)*0.8);sv.querySelector(".u").classList.toggle("is-lit",dy<-12&&-dy>Math.abs(dx)*0.8);
  const th=hud.querySelector(".lb-thumb");if(th){th.style.opacity=String(thumb||0);th.style.left=(x+dx)+"px";th.style.top=(y+dy)+"px";}}
function stickHome(hud){const H=hud.offsetHeight;return [118,H-96];}
function demoPhone(hud,t){const P=6.4,c=Math.floor(t/P),u=t-c*P,spots=[[150,300],[112,262],[196,286]],[x,y]=spots[c%3],home=stickHome(hud);
  let dx=0,dy=0,a=0,th=0;
  if(u<3.4){a=Math.min(1,u/0.15);th=0.9*a;const r=31;
    if(u<0.35){}else if(u<1.9)dx=r*ease((u-0.35)/0.2);else if(u<2.2)dx=r*(1-ease((u-1.9)/0.2));else if(u<3.0)dy=-r*ease((u-2.2)/0.2);else dy=-r*(1-ease((u-3.0)/0.15));
    stickShow(hud,x,y,dx,dy,a,th);}
  else{const v=Math.min(1,(u-3.4)/0.3);if(stickRest==="faint"){const px=x+(home[0]-x)*ease(v),py=y+(home[1]-y)*ease(v);stickShow(hud,px,py,0,0,1-0.62*v,0);}else stickShow(hud,x,y,0,0,1-v,0);}
  const b=(s,on)=>{const e=hud.querySelector(s);if(e)e.classList.toggle("is-pressed",on);};b(".b-attack",u>4.1&&u<4.32);b(".b-jump",u>5.0&&u<5.22);b(".b-cast",u>5.7&&u<5.9);}
// ---- the close-ups: each a little timeline over the plaque ----
const CL={
  armour:{T:6.6,at(u){const s={hp:0.7,mp:0.6,pips:1,lives:3,spells:["fire"],sel:0,cost:0.25},w=(a,b)=>u>=a&&u<b?(u-a)/(b-a):null;let cap="One pip of armour";
      if(u>=0.6){s.pips=2;cap="Armour found: a pip fills with a glint";}const g=w(0.6,1.1);if(g!=null)s.pipFx={i:1,kind:"gain",u:g};
      if(u>=2.3){s.pips=1;cap="A hit takes a pip first: it cracks and falls";}const c1=w(2.3,2.7);if(c1!=null)s.pipFx={i:1,kind:"crack",u:c1};
      if(u>=3.5){s.pips=0;}const c2=w(3.5,3.9);if(c2!=null)s.pipFx={i:0,kind:"crack",u:c2};
      if(u>=4.7){s.hp=0.55;cap="With no armour left, a hit takes health";}return [s,cap];}},
  lives:{T:6.2,at(u){const s={hp:0.14,mp:0.3,pips:1,lives:3,spells:["fire"],sel:0,cost:0.25},w=(a,b)=>u>=a&&u<b?(u-a)/(b-a):null;let cap="Three lives: three lit lanterns";
      if(u>=1.0)cap="Health nearly gone";
      if(u>=1.9){s.lives=2;s.pips=0;cap="A life lost: its lantern gutters out";}const l=w(1.9,2.7);if(l!=null)s.lifeFx={i:2,u:l};
      if(u>=2.9){const r=Math.min(1,(u-2.9)/0.5);s.hp=0.14+0.86*Math.round(ease(r)*8)/8;s.mp=0.3+0.7*Math.round(ease(r)*8)/8;cap="Health and mana refill; the armour is gone";}
      if(u>=4.6)cap="A spent lantern stays, dark, so you can see two of three are left";return [s,cap];}},
  spells:{T:9.6,at(u){const s={hp:0.8,mp:0.6,pips:0,lives:3,spells:[],sel:0,cost:0.25},w=(a,b)=>u>=a&&u<b?(u-a)/(b-a):null;let cap="No spell yet: the socket is empty and dim";
      if(u>=1.4){s.spells=["heal"];cap="Heal learnt: its picture fills the socket";}
      if(u>=3.0){s.spells=["heal","fire"];s.sel=1;cap="Fireball learnt: two diamonds, the lit one is chosen";}
      const f0=w(3.0,3.24);if(f0!=null){s.flip=f0;s.flipKind=f0<0.5?"heal":"fire";}
      if(u>=4.8){s.sel=0;cap="L, or a tap on the socket on a phone, switches";}const f1=w(4.8,5.04);if(f1!=null){s.flip=f1;s.flipKind=f1<0.5?"fire":"heal";s.sel=f1<0.5?1:0;}
      if(u>=6.3){s.sel=1;}const f2=w(6.3,6.54);if(f2!=null){s.flip=f2;s.flipKind=f2<0.5?"heal":"fire";s.sel=f2<0.5?0:1;}
      if(u>=7.0){s.mp=0.6-0.42*Math.min(1,(u-7.0)/0.25);cap="A fireball cast: too little mana left, so its picture dims";}
      if(u>=8.0){s.mp=0.18+0.12*Math.min(1,(u-8.0)/1.2);if(s.mp>=0.25)cap="Mana refills: it brightens again";}return [s,cap];}},
};
// round 13: the potion sockets in a close-up of the plaque: an empty pair, a potion kept, the plaque line, drunk, and a full bar dimming it
CL.potions={T:9.4,at(u){const s={hp:0.5,mp:0.75,pips:1,lives:3,spells:["heal","fire"],sel:1,cost:0.25,potions:{health:false,mana:true}},w=(a,b)=>u>=a&&u<b?(u-a)/(b-a):null;let cap="Health socket empty: a faint outline. A mana potion is kept";
    if(u>=0.8){s.potions.health=true;cap="A health potion kept: it grows into its socket, one glint";}const g=w(0.8,1.2);if(g!=null)s.potFx={k:"health",kind:"keep",u:g};
    if(u>=2.6){cap="Drunk: the flask drains, the bar fills";}const d=w(2.6,2.95);if(d!=null){s.potFx={k:"health",kind:"drink",u:d};}
    if(u>=2.6){s.potions.health=false;s.hp=0.5+0.35*ease(Math.min(1,(u-2.6)/0.4));}
    if(u>=4.6){s.mp=0.75+0.25*ease(Math.min(1,(u-4.6)/1.4));cap="Mana refills of itself";}
    if(u>=6.0){s.mp=1;cap="Mana full: the kept mana potion dims; it can't be drunk";}
    if(u>=8.2){s.mp=0.97;cap="Mana spent a little: it brightens again";}return [s,cap];}};
const CLOCK_START=18*60+29;
// ---- each frame ----
function tick(t,lv,anims,playing){
  document.querySelectorAll(".stage[data-hud]").forEach(stg=>{const hud=stg.__hud;if(!hud)return;const cv=stg.querySelector("canvas"),it=anims.find(a=>a.cv===cv),K=it?it.K:{};
    const st=Object.assign({},BASE,K.hs||{});if(K.bar&&!st.boss)st.boss={name:BS_NAME[(cv&&cv.dataset.lv)||lv],hp:K.bar.hp,trace:K.bar.trace,a:K.bar.a};if(K.plaque)st.name=K.plaque;set(hud,st);if(stg.dataset.demo&&!stg.__live)demoPhone(hud,t);});
  document.querySelectorAll("[data-close]").forEach(box=>{const c=CL[box.dataset.close],hud=box.__hud;if(!hud)return;const u=t%c.T,[s,cap]=c.at(u);set(hud,s);
    const fade=u>c.T-0.25?(c.T-u)/0.25:(u<0.2?u/0.2:1);hud.style.opacity=String(Math.max(0.15,fade));const p=box.parentElement.querySelector(".step");if(p&&p.textContent!==cap)p.textContent=cap;});
  document.querySelectorAll("[data-clock]").forEach(el=>{const s=CLOCK_START+Math.floor(t),m=Math.floor(s/60),x=(m<10?"0":"")+m+":"+String(s%60).padStart(2,"0");if(el.textContent!==x)el.textContent=x;});
  document.querySelectorAll("[data-close10]").forEach(box=>{const kind=box.dataset.close10,el=box.querySelector(kind==="cards"?".lb-card":".lb-line");
    if(kind==="lines"){const P=2.5,n=Math.floor(t/P),L=MO_LINES[n%MO_LINES.length];setLine(el,{kind:L[0],text:L[1]+(L[0]?"":" (later)"),u:t-n*P});}
    else if(kind==="names"){const P=3.0,n=Math.floor(t/P),lvN=MO_LV[n%4],u=t-n*P;setLine(el,{kind:null,text:BS_NAME[lvN],u:Math.min(u,2.6)});if(u>2.6)el.style.opacity="0";}
    else{const P=3.4,n=Math.floor(t/P),lvN=MO_LV[n%4],u=t-n*P;setCard(el,{lv:lvN,a:u<0.4?u/0.4:u<2.6?1:Math.max(0,1-(u-2.6)/0.6)});if(u>=3.2)el.hidden=true;}});}
// ---- the full-size try-out: the phone layout at the screen's own size, with the stick and buttons answering touch ----
function live(stg,on){stg.__live=on;const hud=stg.__hud;if(!hud)return;
  const s=hud.querySelector(".lb-stick"),stick={id:null,x:0,y:0};
  if(!on){if(stg.__off)stg.__off();return;}
  stickShow(hud,0,0,0,0,0,0);if(stickRest==="faint"){const h=stickHome(hud);stickShow(hud,h[0],h[1],0,0,0.38,0);}
  const loc=e=>{const r=stg.getBoundingClientRect(),k=r.width/stg.offsetWidth;return [(e.clientX-r.left)/k,(e.clientY-r.top)/k];};
  const down=e=>{const b=e.target.closest(".lb-touch-btn,.lb-tile,.lb-spell,.lb-potion");if(b){e.preventDefault();if(b.classList.contains("lb-spell")){BASE.sel=(BASE.sel+1)%BASE.spells.length;}
      else if(b.classList.contains("lb-potion")){const k=b.dataset.k,bar=k==="health"?"hp":"mp";if(BASE.potions[k]&&BASE[bar]<0.999){BASE.potions[k]=false;BASE[bar]=Math.min(1,BASE[bar]+(k==="health"?0.35:0.5));}else if(!BASE.potions[k])BASE.potions[k]=true;}
      else b.classList.add("is-pressed");b.__pid=e.pointerId;return;}
    const [x,y]=loc(e);if(x>stg.offsetWidth*0.5||stick.id!=null)return;e.preventDefault();const W=stg.offsetWidth,H=stg.offsetHeight;
    stick.id=e.pointerId;stick.x=Math.max(60,Math.min(W*0.5-60,x));stick.y=Math.max(70,Math.min(H-60,y));stickShow(hud,stick.x,stick.y,x-stick.x,y-stick.y,1,0);move(e);};
  const move=e=>{if(e.pointerId!==stick.id)return;const [x,y]=loc(e);let dx=x-stick.x,dy=y-stick.y;const d=Math.hypot(dx,dy),r=31;if(d>r){dx*=r/d;dy*=r/d;}stickShow(hud,stick.x,stick.y,dx,dy,1,0);};
  const up=e=>{hud.querySelectorAll(".is-pressed").forEach(b=>{if(b.__pid===e.pointerId)b.classList.remove("is-pressed");});
    if(e.pointerId===stick.id){stick.id=null;if(stickRest==="faint"){const h=stickHome(hud);stickShow(hud,h[0],h[1],0,0,0.38,0);}else stickShow(hud,stick.x,stick.y,0,0,0,0);}};
  stg.addEventListener("pointerdown",down);addEventListener("pointermove",move);addEventListener("pointerup",up);addEventListener("pointercancel",up);
  stg.__off=()=>{stg.removeEventListener("pointerdown",down);removeEventListener("pointermove",move);removeEventListener("pointerup",up);removeEventListener("pointercancel",up);stg.__off=null;hud.querySelectorAll(".is-pressed").forEach(b=>b.classList.remove("is-pressed"));};}
return {build,set,setLine,setCard,setPotion,tick,live,loopHud,ICON,POT,OPTS,vitals,potions,counter,setMode:m=>{MODE=m;},setRest:r=>{stickRest=r;document.querySelectorAll(".stage[data-hud=phone]").forEach(s=>{if(s.__live){live(s,false);live(s,true);}});},BASE};
})();

/* ======================================== clips12.js ======================================== */
/* Barney's recordings (Pixabay, royalty-free, no attribution needed), trimmed and encoded small: the first burst of
   "66 voz hombre dolido" (freesound_community, Pixabay 100206) for the hurt, and seven caws from "Crow sound effect HD" (Pixabay 336784). */
const SND_CLIPS={"hurt": "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uY4e7CIx8gwqKOLAUIuFSxqtMTMdurgBOBVVlBmllxpMUlPTXWvM3cZ5c3aPExIPC0crWV+tTpwvVuVrnRtRONrW15ktWmWcjUHKWuf/+1LEnwAKsNtNR5hPgUqaKaj0CipCewnBkLrPHVMCSKMwX6Ao00sVdEJlR0agXRXixUw2WQqz////pQYWoWtCAM6ZK0dDYHHEI2TqULJfmZYAsCEKcwk83osvqskk3MoFQP1Q+W2FbESSWrpOTjuNqWNIum9Ox2VSuNMNaECuqBQuTgqVSIQQuH1kkB9/zDPEKtetQx4hBIQC+VHISx9P/////6WPaXAQ1ZutYKJImEykELjtIZO3kQRtZDJL+nHy+8O1W3XSFPF0zRbz3m3qZ//7UsSogovQlTusPYMBcRJmqYYhuPR+fjcUKoACstbuRL0tCkNjEQyGlVV2YirXwIgStwiidktgA2A7rvLf7VG//o//qQCWSOOBpbOlPBhoGdWmmk8bBGSzDbNKaW7Teh9YGWA00mqVFwRECI69XGo+JBo0BQwTionTkKpTVV2LKy7J8bPF8iiFKFxiDMflLofylaGZgWPVcZ0/R//+d//iquENz7hrIXICXGXwapLZrilBhI/UzKUxVQvy4Tk0obi53YBOA8H0N3We5krCUbal//tSxKkDjTi/Jiw9DdFwEiRFh6WoUC4kKCkjFzajUcqkgmpBQls9kYOmXfPytDpmPwEhb0XUXC2SkK2dxL////ESSqQ/NyVcKbMOWMw5E5MVdMhCYjGLATAGQtAKPI4dUnLI525xEFCWcijQKeguWqnRoqmLAIGgqCp0RSrlHvhosdiXLf2Z1/s///6kvWjRu04qYwMCFVCCIimKMBIUBik2aAWCADg+IEbCakiIo4sy4ejSjiyrhyiyiizLh2LKKdnaTiyiiwTDJn/BkUEj1Cz/+1LEpAPLjLsaLKRvkXEUYgGGGeAqzFJMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7UsSlg8lQbv4MMMpBHRBUgYSZiKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", "caw1": "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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEtgEJaFknBLzIyS8YIoDHjYhVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsS/A8dcONhhmSFAAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV", "caw2": "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", "caw3": "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VA0hSJTImiiLLujRo0mAaKBo1GZKvKcxBJFjqpeFlaJB4oEljRQQwM9bCjBCLjJYVaZNPItFGHWzzRE8HVyqrCJWS6qv//JqVoH+So7/+1LEqwAKYHc9h6THIWMRpaD0jdgkSASVMSS7lALg0VztmZyE+wvsPKj4VlBJ7yp2Rtlv2ZHyX+Cv/+V+Wqfu9+5QdAQJQUAUJpgfjE1bjWppCiIREDoHhQnMPZCpAVMgsLETOt2ttAVFKkP4sLsxUWFv6tQuzFRbUL+KmcX1CzP//1CwsL1MQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsSzAApIdScHsGdBSIykFJeZgFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxL6DBnhpGEMEUoELhhsMwyRYVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=", "caw4": "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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEmYKJnHUhBJhwwTEUokjDCdhVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsSqg8fMXsxDDNCAAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV", "caw5": "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SYAKQN9fhgRwMVGLqnzEjVQwwiBaA+weRQ5LmnQweZV06dmldZZImS0sgCT2oZCRcyyaIJ1OlA8cyqhLtDUWsJFMlwV6DPBzCCqrnlbgGJjZTBkqnUEKA6gCVfzLFGn80hzjaSUVGLpSVZ02dzEC5J8456laTO/2kST7maC6E0EsaY9ohOSSF9GPKc8sQ0lEoZ5kdCenI93pFdlexzjqblFfDhEBo5NNis3dbVo5zomjqOj1b6WKRUepPv/xJ4TpclUZcI6vpWqXlUACRv/7UsRUAAoka1OHjNKxQp4rsPGKXuNRyCXkZfkwKhDwK4LDwpLxBVlZaWufqVHVFKlGm0Ws6/nee1vpZQbEaAtFz5B0GZQ+RePDoQFR1Q03CzRodcGw6xgwOyb0qizX0HttfboiYl2dVRrtZZIC2+EIChzEwAccyUqPkMRjcI7gYL5AIyUunxXJFsBluJpbz7iFlmcjAh2RJ04DaKBJoaCkFHh64wwFio8QDInfjhBWaKJqXdV9imh3VjEQNHa8HgYrE44gxZKLZceEN8sFcwOy//tSxGEACqhhUeeww+FIjq38ww4e60UVTYGSmehANiZVidkPzTPNee5n+TSK8e/ynPpTHNhwm4UjHOFJgKGz4Vl2HiABHkiAoLtYaudzvSr0sKYABJtFtwMtwDcBAgmjwKD+AwSGCgbYaFphIie003dMq4lI7ZE40Cs5s2ZeRxofx9pm84it3aKeDMiU3LgIqQKAEqWnk3qSpN5DlrNuxxMk9JtGeHRAABTkDUYjpZXtxoEyEsEC8KTFaPo8gCqRScqCc7Craay2HnTNW7VV1hj/+1LEawAKjKlJxhhwIVKVKPzEjSQw3C1JyYnWYXOR/9d4spL7XBqLsuDtoJCnMZYXUBrzxizXf2r31DXoAirwMEZteqFe2yJZsQ5FMzKbqaAkSCpNE2TpITdMWY6RtsKjWNswnBkpzMLPi+qtGCsyntFZBf/57Yp/ocXBRxCF4qxN3nAuUWEl/9+6WgIpIklOM1VSgZcytrRcVTwSgdAkIyppsSVBkFYcuUZ5qLjQEHVAqVBVYLCWCp3yxqDR4kyGvVT/lQV+7O+Ii3+t/YstX//7UsR0gApcsUHnsGWhQpVlZPMOQSw0C0IIaz1DAwgwpWUCOUnwwQKoMoMcSQhZkHWhBO8//7tRpTs5RZRRcXm/5NOz0aUaJAj4tnKLLYWFhZv/xYWFWf////6hakxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tSxICCCLxLHOGwx0EakpWkN5mQqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=", "caw6": "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Qnku+B8ugikffAafEkSYnbASw1UmY2NVVVWEVR1XkOClb1bh9ElSRKAlB15ElcSLHjwNnQaU+DMl//f7tZ3/8j9VWRTQwaitaERF2pMoxHISOYvAC0NkhiPPEgyvOmGy42TUm9YyqzQCCiBSxy81n0l2/awoZeywtqQYwGDRESCop4sBSIS//+Wb/H+p//tSxHUACkzHMYY8awkxEaToZg0gTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEg4PJWLT6BLxrAAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==", "caw7": "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auW3QEBCwtyz2usW4OhpqCMqSEqBFeDRIKvK+s7iX7//rgACSXKAoKZceWwUtrpWJYDQWGS4yfd1bAqZNAWFTHdyLbYFJHgk+P6xi/+hlutLav//Ks+pbllmv39aUUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxIAACbBVK4ewbokdDmLUN40gVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEk4PHfDb8YY2AAAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="};

/* ======================================== snd13.js ======================================== */
/* Round 12, the sound: every effect and place sound made in code, as the kit makes its sounds (no audio files).
   The parts: tone (an oscillator through a filter), noise (filtered white noise, optionally torn), bell (inharmonic partials),
   and a short dark room (a generated reverb) that every sound sends a little to. */
const SND=(()=>{let ctx=null,out=null,room=null,nb=null,amb=null,ambLv=null,timers=[];const R=Math.random;
function unlock(){if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;ctx=new AC();out=ctx.createGain();out.gain.value=0.5;out.connect(ctx.destination);
    room=ctx.createConvolver();const n=Math.floor(ctx.sampleRate*2.2),ir=ctx.createBuffer(2,n,ctx.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(R()*2-1)*Math.pow(1-i/n,3.2);}
    room.buffer=ir;const rg=ctx.createGain();rg.gain.value=0.6;room.connect(rg);rg.connect(out);
    nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=R()*2-1;}
  if(!clipsP)clipsP=decodeClips();
  if(ctx.state!=="running"){const p=ctx.resume();if(p&&p.catch)p.catch(()=>{});}return true;}
// the recorded clips, decoded once when sound is first turned on
let clipsP=null;const BUF={};
function decodeClips(){const C=typeof SND_CLIPS!=="undefined"?SND_CLIPS:{};return Promise.all(Object.keys(C).map(k=>new Promise(res=>{try{const bin=atob(C[k]),b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);
  const ok=buf=>{BUF[k]=buf;res();},p=ctx.decodeAudioData(b.buffer,ok,()=>res());if(p&&p.then)p.then(ok,()=>res());}catch(e){res();}})));}
function sample(k,o){if(!live()||!BUF[k])return;o=o||{};const s=ctx.createBufferSource();s.buffer=BUF[k];s.playbackRate.value=o.rate||1;s.connect(bus(o.vol==null?0.5:o.vol,o.wet==null?0.15:o.wet));s.start(ctx.currentTime+(o.at||0));}
const live=()=>ctx&&ctx.state==="running";
let curGain=1;
function bus(vol,wet){vol*=curGain;const g=ctx.createGain();g.gain.value=1;const dry=ctx.createGain();dry.gain.value=vol;g.connect(dry);dry.connect(out);if(wet){const w=ctx.createGain();w.gain.value=vol*wet;g.connect(w);w.connect(room);}return g;}
function env(g,t0,a,peak,d){g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t0+a);g.gain.exponentialRampToValueAtTime(0.0001,t0+a+d);}
function tone(o){if(!live())return;const t0=ctx.currentTime+(o.at||0),dur=o.dur||0.2,os=ctx.createOscillator(),g=ctx.createGain();os.type=o.type||"sine";os.frequency.setValueAtTime(o.f||440,t0);
  if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t0+(o.glide||dur));if(o.vib){const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=o.vib[0];lg.gain.value=o.vib[1];l.connect(lg);lg.connect(os.frequency);l.start(t0);l.stop(t0+dur+0.1);}
  let node=os;if(o.lp){const f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=o.lp;f.Q.value=o.q||0.7;os.connect(f);node=f;}
  env(g,t0,o.a||0.005,1,dur);node.connect(g);g.connect(bus(o.vol==null?0.2:o.vol,o.wet==null?0.25:o.wet));os.start(t0);os.stop(t0+(o.a||0.005)+dur+0.05);}
function noise(o){if(!live())return;const t0=ctx.currentTime+(o.at||0),dur=o.dur||0.3,s=ctx.createBufferSource();s.buffer=nb;s.loop=true;const f=ctx.createBiquadFilter();f.type=o.ft||"lowpass";f.Q.value=o.q||0.8;
  f.frequency.setValueAtTime(o.from||2000,t0);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t0+dur);const g=ctx.createGain();env(g,t0,o.a||0.004,1,dur);
  let last=g;if(o.tear){const m=ctx.createGain();const k=Math.floor(dur*o.tear);m.gain.setValueAtTime(1,t0);for(let i=0;i<k;i++)m.gain.setValueAtTime(R()<0.45?0.15:1,t0+i/o.tear);g.connect(m);last=m;}
  s.connect(f);f.connect(g);last.connect(bus(o.vol==null?0.25:o.vol,o.wet==null?0.2:o.wet));s.start(t0,R()*1.5);s.stop(t0+(o.a||0.004)+dur+0.05);}
function voice(o){if(!live())return;const t0=ctx.currentTime+(o.at||0),dur=o.dur||0.3,os=ctx.createOscillator();os.type="sawtooth";os.frequency.setValueAtTime(o.f,t0);
  if(o.up)os.frequency.linearRampToValueAtTime(o.f*o.up,t0+dur*0.15);os.frequency.exponentialRampToValueAtTime(o.to||o.f*0.7,t0+dur);
  const jit=ctx.createOscillator(),jg=ctx.createGain();jit.frequency.value=o.rasp||9;jg.gain.value=o.f*(o.jit||0.03);jit.connect(jg);jg.connect(os.frequency);
  const g=ctx.createGain();env(g,t0,o.a||0.012,1,dur);const sum=ctx.createGain();sum.gain.value=1;
  (o.form||[[700,6,1],[1150,8,0.7],[2600,10,0.25]]).forEach(([f,q,amp])=>{const b=ctx.createBiquadFilter();b.type="bandpass";b.frequency.value=f;b.Q.value=q;const bg=ctx.createGain();bg.gain.value=amp*q*0.5;os.connect(b);b.connect(bg);bg.connect(sum);});
  if(o.am){const am=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();am.gain.value=1-o.am/2;l.frequency.value=o.amf||55;lg.gain.value=o.am/2;l.connect(lg);lg.connect(am.gain);sum.connect(am);am.connect(g);l.start(t0);l.stop(t0+dur+0.1);}else sum.connect(g);
  g.connect(bus(o.vol==null?0.2:o.vol,o.wet==null?0.25:o.wet));os.start(t0);jit.start(t0);os.stop(t0+dur+0.08);jit.stop(t0+dur+0.08);}
function voice2(o){if(!live())return;const t0=ctx.currentTime+(o.at||0),dur=o.dur||0.3,os=ctx.createOscillator();os.type="sawtooth";os.frequency.setValueAtTime(o.f,t0);
  os.frequency.linearRampToValueAtTime(o.f*(o.up||1),t0+dur*0.2);os.frequency.exponentialRampToValueAtTime(o.to||o.f*0.8,t0+dur);
  const jit=ctx.createOscillator(),jg=ctx.createGain();jit.type="triangle";jit.frequency.value=o.rasp||13;jg.gain.value=o.f*(o.jit||0.04);jit.connect(jg);jg.connect(os.frequency);
  const tilt=ctx.createBiquadFilter();tilt.type="lowpass";tilt.frequency.value=o.tilt||900;tilt.Q.value=0.5;os.connect(tilt);
  const src=ctx.createGain();src.gain.value=1;tilt.connect(src);
  if(o.breath){const n=ctx.createBufferSource();n.buffer=nb;n.loop=true;const ng=ctx.createGain();ng.gain.value=o.breath;n.connect(ng);ng.connect(src);n.start(t0,R()*1.5);n.stop(t0+dur+0.1);}
  const g=ctx.createGain();env(g,t0,o.a||0.006,1,dur);const sum=ctx.createGain();sum.gain.value=1;
  o.form.forEach(([f0,f1,q,amp])=>{const b=ctx.createBiquadFilter();b.type="bandpass";b.frequency.setValueAtTime(f0,t0);b.frequency.linearRampToValueAtTime(f1,t0+dur);b.Q.value=q;const bg=ctx.createGain();bg.gain.value=amp*Math.sqrt(q);src.connect(b);b.connect(bg);bg.connect(sum);});
  if(o.fry){const am=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();l.type="square";am.gain.value=1-o.fry/2;l.frequency.value=o.fryf||68;lg.gain.value=o.fry/2;l.connect(lg);lg.connect(am.gain);sum.connect(am);am.connect(g);l.start(t0);l.stop(t0+dur+0.1);}else sum.connect(g);
  g.connect(bus(o.vol==null?0.3:o.vol,o.wet==null?0.2:o.wet));os.start(t0);jit.start(t0);os.stop(t0+dur+0.1);jit.stop(t0+dur+0.1);}
function rumble(o){if(!live())return;const t0=ctx.currentTime+(o.at||0),dur=o.dur||1,s=ctx.createBufferSource();s.buffer=BROWN();s.loop=true;const f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.setValueAtTime(o.from||400,t0);f.frequency.exponentialRampToValueAtTime(o.to||120,t0+dur);
  const g=ctx.createGain();env(g,t0,o.a||0.2,1,dur);s.connect(f);f.connect(g);g.connect(bus(o.vol||0.3,o.wet==null?0.5:o.wet));s.start(t0,R()*1.5);s.stop(t0+(o.a||0.2)+dur+0.1);}
let brown=null;function BROWN(){if(!brown){brown=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const d=brown.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){l=(l+0.02*(R()*2-1))/1.02;d[i]=l*3.5;}}return brown;}
function ring(o){const f=o.f,P=o.partials;P.forEach(([r,amp,d])=>tone({f:f*r,dur:d,vol:(o.vol||0.1)*amp,a:0.001,wet:o.wet==null?0.3:o.wet,at:o.at||0}));}
function bell(o){const f=o.f||220,P=o.partials||[[1,1,1],[2.0,0.5,0.7],[2.76,0.45,0.55],[5.4,0.25,0.35],[8.93,0.12,0.22]];P.forEach(([r,amp,ds])=>tone({f:f*r,dur:(o.dur||2.5)*ds,vol:(o.vol||0.18)*amp,a:0.003,wet:o.wet==null?0.5:o.wet,at:o.at||0}));}
// ---- the effects ----
function DRINK(ch){noise({ft:"bandpass",from:1900,to:1100,q:3,dur:0.035,vol:0.22,wet:0.1});
  tone({f:190,to:125,dur:0.09,lp:700,vol:0.16,wet:0.05,at:0.07});tone({f:165,to:110,dur:0.08,lp:700,vol:0.12,wet:0.05,at:0.18});
  ch.forEach((f,i)=>tone({f,dur:0.55-i*0.08,a:0.1,vol:0.06,wet:0.6,at:0.27+i*0.05}));}
const FX={
  swing:()=>noise({ft:"bandpass",from:700,to:3200,q:1.4,dur:0.16,a:0.03,vol:0.42,wet:0.1}),
  // a blade striking: a bright crack, a short metal ring, a little weight underneath
  hit:()=>{noise({ft:"highpass",from:2400,dur:0.035,vol:0.18,wet:0.2});ring({f:1180,vol:0.09,wet:0.35,partials:[[1,1,0.22],[1.47,0.7,0.16],[2.09,0.55,0.12],[2.56,0.4,0.09],[3.7,0.25,0.06]]});tone({f:130,to:70,dur:0.08,vol:0.16,wet:0.05});noise({from:1600,to:300,dur:0.07,vol:0.18,wet:0.1});},
  jump:()=>noise({ft:"bandpass",from:500,to:1300,q:1.1,dur:0.1,a:0.02,vol:0.38,wet:0.05}),
  land:()=>{noise({from:500,to:90,dur:0.13,vol:0.28,wet:0.1});tone({f:95,to:52,dur:0.12,vol:0.22,wet:0.05});},
  roll:()=>{noise({ft:"bandpass",from:900,to:400,q:1,dur:0.12,a:0.02,vol:0.32});noise({ft:"bandpass",from:800,to:350,q:1,dur:0.14,a:0.02,vol:0.28,at:0.13});noise({from:400,to:80,dur:0.12,vol:0.32,at:0.26});},
  // the hurt: Barney's recording, its first burst, with the ember crackle of the hit
  hurt:()=>{sample("hurt",{vol:0.5,wet:0.12});for(let i=0;i<4;i++)noise({ft:"bandpass",from:2500+R()*2500,q:4,dur:0.03,vol:0.05,at:0.04+R()*0.3,wet:0.3});},
  // metal armour struck and splitting: a clang of bright partials and a rough crunch
  crack:()=>{ring({f:620,vol:0.12,wet:0.4,partials:[[1,1,0.5],[1.63,0.8,0.38],[2.37,0.7,0.3],[3.12,0.5,0.22],[4.05,0.4,0.16],[5.3,0.3,0.12]]});noise({ft:"bandpass",from:3200,q:1.5,dur:0.14,tear:90,vol:0.3,wet:0.25});noise({ft:"highpass",from:3000,dur:0.03,vol:0.3,wet:0.2});
    for(let i=0;i<3;i++)tone({type:"triangle",f:3000+R()*2000,dur:0.03,vol:0.05,at:0.08+i*0.07,wet:0.4});},
  defeat:()=>{noise({ft:"bandpass",from:2600,to:1800,q:1.3,dur:0.28,tear:70,vol:0.34,wet:0.2});tone({f:660,to:990,glide:0.7,dur:0.9,a:0.12,vol:0.09,vib:[5,6],wet:0.7,at:0.18});},
  pickup:()=>{tone({f:1320,dur:0.12,vol:0.14,wet:0.5});tone({f:1760,dur:0.3,vol:0.12,wet:0.6,at:0.07});tone({f:2640,dur:0.25,vol:0.03,wet:0.7,at:0.12});},
  heal:()=>{[392,494,587,784].forEach((f,i)=>tone({f,dur:0.9-i*0.1,a:0.25,vol:0.07,wet:0.7,at:i*0.08}));},
  // round 13: a potion drunk: the cork, two quick swallows, then a short warm chord rising (lower and redder for health, brighter for mana)
  drinkHealth:()=>DRINK([349,440,523]),
  drinkMana:()=>DRINK([587,740,880]),
  // fire: an ignition, then a fluttering roar with crackles in it
  fireball:()=>{tone({f:110,to:60,dur:0.12,vol:0.2,wet:0.1});noise({from:700,to:1700,dur:0.5,a:0.05,tear:16,vol:0.34,wet:0.25});noise({from:260,dur:0.45,a:0.05,vol:0.22,wet:0.2});
    for(let i=0;i<10;i++)noise({ft:"bandpass",from:1800+R()*3500,q:5,dur:0.02,vol:0.09,at:0.04+R()*0.45,wet:0.2});},
  // the fireball bursting: like the fireball, bigger and longer: a whump, a roar opening out, crackles spreading
  burst:()=>{noise({from:1400,to:180,dur:0.25,a:0.003,vol:0.5,wet:0.3});noise({from:900,to:2400,dur:0.9,a:0.02,tear:13,vol:0.45,wet:0.4});noise({from:320,to:180,dur:0.9,a:0.02,vol:0.35,wet:0.35});
    for(let i=0;i<18;i++)noise({ft:"bandpass",from:1500+R()*3800,q:5,dur:0.02+R()*0.02,vol:0.1,at:0.05+R()*0.9,wet:0.3});},
  fizzle:()=>{tone({type:"triangle",f:900,to:300,dur:0.08,vol:0.08});noise({ft:"highpass",from:3000,to:1200,dur:0.45,a:0.02,vol:0.12,wet:0.2,at:0.04});},
  checkpoint:()=>{noise({ft:"bandpass",from:1500,to:4000,q:2,dur:0.18,a:0.04,vol:0.08,wet:0.3});bell({f:784,dur:1.6,vol:0.1,at:0.18,partials:[[1,1,1],[2.01,0.35,0.6],[3.0,0.2,0.4],[4.2,0.12,0.3]]});},
  line:()=>bell({f:1046,dur:0.9,vol:0.09,partials:[[1,1,1],[2.0,0.3,0.5],[3.01,0.12,0.3]]}),
  lifeLost:()=>{tone({f:392,to:147,glide:1.2,dur:1.4,a:0.02,vol:0.12,wet:0.6});tone({f:587,to:220,glide:1.2,dur:1.2,a:0.02,vol:0.06,wet:0.6});noise({ft:"bandpass",from:2200,to:900,q:1.2,dur:0.6,tear:40,vol:0.16,wet:0.3,at:0.25});},
  // the boss arriving: a deep growling drone that swells, with a rising rush, heard on small speakers too
  bossArrives:()=>{tone({type:"sawtooth",f:55,dur:2.0,a:0.5,lp:420,vol:0.3,wet:0.45});tone({type:"sawtooth",f:58.3,dur:1.8,a:0.7,lp:380,vol:0.2,wet:0.5});tone({type:"sawtooth",f:82.4,dur:1.8,a:0.9,lp:520,vol:0.14,wet:0.5});
    noise({ft:"bandpass",from:250,to:900,q:1.2,dur:1.7,a:0.9,vol:0.3,wet:0.5});noise({from:400,to:90,dur:1.6,a:0.4,vol:0.25,wet:0.4});},
  bossDefeated:()=>{noise({from:1800,to:200,dur:0.5,vol:0.2,wet:0.4});bell({f:196,dur:4,vol:0.2,at:0.3});},
  placeCard:()=>bell({f:98,dur:3,vol:0.16,partials:[[1,1,1],[2.0,0.4,0.6],[2.9,0.25,0.45],[4.1,0.12,0.3]]}),
  win:()=>{bell({f:196,dur:4,vol:0.16});bell({f:247,dur:4,vol:0.12,at:0.7});bell({f:294,dur:4.5,vol:0.12,at:1.4});tone({f:392,dur:3,a:1.2,vol:0.05,wet:0.8,at:1.4});},
  select:()=>tone({type:"triangle",f:620,dur:0.05,lp:2000,vol:0.15,wet:0.15}),
  confirm:()=>bell({f:523,dur:0.6,vol:0.1,partials:[[1,1,1],[2,0.3,0.5]]}),
  back:()=>tone({type:"triangle",f:440,to:330,dur:0.09,lp:1800,vol:0.15,wet:0.15}),
};
// each effect's level, set by measuring how loud it sounds (K-weighted, its loudest 0.4 s) against a target for its kind:
// the big moments loudest, the main actions next, light touches and the menus quieter. GAIN is filled from that measure.
const GAIN={swing: 5.24, hit: 3.07, jump: 8, land: 2.52, roll: 5.59, hurt: 0.78, crack: 1.97, defeat: 2.96, pickup: 1.96, heal: 1.56, fireball: 3.7, burst: 3.86, fizzle: 2.01, checkpoint: 2.13, line: 2.25, lifeLost: 2.89, bossArrives: 1.25, bossDefeated: 1.07, placeCard: 1.47, win: 1.36, select: 4.97, confirm: 1.87, back: 3.83, drinkHealth: 2.37, drinkMana: 2.36}; /* round 13: the drinks measured as the heal and the pick-up are (a light touch, -31) */
// ---- the places' background sound: wind, rain, thunder, bats, crows, creaking trees ----
function loopNoise(ft,f,q,vol,lfoRate,lfoDepth){const s=ctx.createBufferSource();s.buffer=nb;s.loop=true;const fl=ctx.createBiquadFilter();fl.type=ft;fl.frequency.value=f;fl.Q.value=q;
  const g=ctx.createGain();g.gain.value=vol;s.connect(fl);fl.connect(g);g.connect(amb);s.start(0,R()*1.5);const nodes=[s];
  if(lfoRate){const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=lfoRate;lg.gain.value=lfoDepth;l.connect(lg);lg.connect(fl.frequency);l.start();nodes.push(l);
    const l2=ctx.createOscillator(),lg2=ctx.createGain();l2.frequency.value=lfoRate*0.63;lg2.gain.value=vol*0.6;l2.connect(lg2);lg2.connect(g.gain);l2.start();nodes.push(l2);}
  return nodes;}
// rain as City Nights makes it (its kit's rainLoop, which Barney approved): noise only, written out once and looped, a soft wash with
// thousands of tiny ticks in it, and a second loop of another length with heavier pats, its loudness drifting with the gusts
let RAIN=null;
function rainLoop(secs,wash,drops){const sr=ctx.sampleRate,len=Math.floor(sr*secs),fade=Math.floor(sr*0.02),buf=ctx.createBuffer(2,len,sr),L=buf.getChannelData(0),Rr=buf.getChannelData(1),pole=f=>1-Math.exp(-2*Math.PI*f/sr);
  if(wash){const k1=pole(wash.top),k2=pole(wash.top*3),kH=pole(wash.bottom),long=new Float32Array(len+fade);
    for(const d of [L,Rr]){let a=0,b=0,hi=0;for(let i=0;i<long.length;i++){a+=k1*(R()*2-1-a);b+=k2*(a-b);hi+=kH*(b-hi);long[i]=(b-hi)*wash.amp;}for(let i=0;i<len;i++)d[i]=long[i];for(let i=0;i<fade;i++){const u=i/fade;d[i]=long[i]*u+long[len+i]*(1-u);}}}
  for(const [count,grain] of drops){for(let c=0;c<count*secs;c++){const g=grain(),n=Math.floor(g.dur*sr),at=Math.floor(R()*len),pan=R()*Math.PI/2,gl=Math.cos(pan),gr=Math.sin(pan),kA=pole(g.high),kB=pole(g.low),die=Math.exp(-4/n);
      let a=0,b=0,e=g.amp;for(let i=0;i<n;i++){a+=kA*(R()*2-1-a);b+=kB*(a-b);const v=(a-b)*e*Math.min(1,i/(sr*0.0005))*(1-i/n),j=(at+i)%len;L[j]+=v*gl;Rr[j]+=v*gr;e*=die;}}}
  let sum=0;for(let i=0;i<len;i++)sum+=L[i]*L[i];return{buf,rms:Math.sqrt(sum/len)};}
function rainBed(level){if(!RAIN){const rnd=(a,b)=>a+R()*(b-a),lg=(a,b)=>a*Math.pow(b/a,R());
    RAIN={patter:rainLoop(6,{top:1800,bottom:220,amp:0.15},[[300,()=>{const low=lg(600,2400);return{low,high:low*2.2,dur:rnd(0.0015,0.005),amp:0.25+0.9*Math.pow(R(),3)};}]]),
      pats:rainLoop(9.7,null,[[35,()=>{const low=lg(220,520);return{low,high:low*3,dur:rnd(0.008,0.024),amp:0.35+0.8*Math.pow(R(),2)};}]])};}
  const rg=ctx.createGain(),gust=ctx.createOscillator(),gg=ctx.createGain(),lv=level/RAIN.patter.rms;rg.gain.value=lv;gust.frequency.value=0.09;gg.gain.value=lv*0.2;gust.connect(gg);gg.connect(rg.gain);rg.connect(amb);
  const nodes=[gust];for(const l of [RAIN.patter,RAIN.pats]){const src=ctx.createBufferSource();src.buffer=l.buf;src.loop=true;src.connect(rg);src.start();nodes.push(src);}gust.start();return nodes;}
const every=(fn,min,max,first)=>{const go=()=>{fn();timers.push(setTimeout(go,(min+R()*(max-min))*1000));};timers.push(setTimeout(go,(first!=null?first:min*0.4+R()*min)*1000));};
// a crow calling: two to four of the recorded caws in a row, from one of the recording's two runs, each pitched a touch apart
const CAWS=[["caw1","caw2","caw3","caw4"],["caw5","caw6","caw7"]];
const caw=(base,v)=>{const run=CAWS[Math.floor(R()*2)],n=Math.min(run.length,2+Math.floor(R()*3)),s0=Math.floor(R()*(run.length-n+1));let t=0;const rate=0.93+R()*0.08;
  for(let i=0;i<n;i++){const k=run[s0+i];sample(k,{vol:v,wet:0.45,rate,at:t});t+=(BUF[k]?BUF[k].duration:0.6)/rate*0.92+0.03;}};
// a tree creaking: wood sticking and slipping, a slow train of clicks through the trunk's resonances
const creak=v=>{const f=24+R()*10;voice({f,up:1.2,to:f*0.6,dur:0.9+R()*0.8,a:0.18,form:[[620+R()*120,12,1],[1350+R()*200,14,0.6],[2200,10,0.25]],jit:0.18,rasp:2.5,vol:v,wet:0.45});};
const bats=v=>{const n=3+Math.floor(R()*3);for(let i=0;i<n;i++)tone({f:4300+R()*900,to:3000,dur:0.035,a:0.002,vol:v,wet:0.45,at:i*(0.06+R()*0.04)});};
const thunder=v=>{noise({ft:"bandpass",from:2500,to:900,q:0.8,dur:0.5,a:0.005,tear:45,vol:v*0.45,wet:0.6});rumble({from:700,to:200,dur:0.9,a:0.03,vol:v*1.2,at:0.05});
  let t=0.4;while(t<5.5){rumble({from:300+R()*250,to:90+R()*60,dur:0.8+R()*1.4,a:0.25+R()*0.4,vol:v*(0.5+R()*0.7)*(1-t/7),at:t});t+=0.4+R()*0.9;}};
// levels: each place's bed and each sound in it, set by measuring them (as GAIN for the effects)
const BED={night: 1.37, storm: 0.36, dawn: 1.58, mist: 1.31},EV={bat: 2.5, caw: 7.46, creak: 3.09, thunder: 3.52};
const AMB={
  night:()=>{const n=loopNoise("bandpass",420,0.9,0.12*BED.night,0.09,220);every(()=>bats(0.08*EV.bat),3,7,1.2);return n;},
  storm:()=>{const n=rainBed(0.07*BED.storm);every(()=>thunder(0.3*EV.thunder),12,22,3);return n;},
  dawn:()=>{const n=loopNoise("lowpass",380,0.7,0.14*BED.dawn,0.06,180);every(()=>caw(340+R()*70,0.12*EV.caw),5,11,1.5);return n;},
  mist:()=>{const n=loopNoise("bandpass",900,0.6,0.06*BED.mist,0.11,400).concat(loopNoise("lowpass",300,0.7,0.07*BED.mist,0.05,90));
    every(()=>creak(0.14*EV.creak),2.5,6,0.8);every(()=>caw(360+R()*60,0.1*EV.caw),9,17,4);return n;},
};
function ambient(lv){stopAmb();if(!live()||!lv)return;amb=ctx.createGain();amb.gain.setValueAtTime(0.0001,ctx.currentTime);amb.gain.exponentialRampToValueAtTime(0.55,ctx.currentTime+1.2);amb.connect(out);ambLv=lv;amb._nodes=AMB[lv]();}
function stopAmb(){timers.forEach(clearTimeout);timers=[];if(amb){const a=amb;try{a.gain.cancelScheduledValues(ctx.currentTime);a.gain.setValueAtTime(a.gain.value,ctx.currentTime);a.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.6);}catch(e){}
    setTimeout(()=>{(a._nodes||[]).forEach(n=>{try{n.stop();}catch(e){}});a.disconnect();},800);}amb=null;ambLv=null;}
return {_buf:BUF,ready:()=>clipsP||Promise.resolve(),unlock,live,FX,GAIN,BED,EV,get _out(){return out;},_ev:{bats,caw,creak,thunder},play:k=>{if(live()&&FX[k]){curGain=GAIN[k]||1;try{FX[k]();}finally{curGain=1;}}},ambient,stopAmb,get ambLv(){return ambLv;}};
})();

/* ======================================== pot13.js ======================================== */
/* ============================== round 13 (design system version 11): the potions kept for later, the world's side ==============================
   A potion kept: instead of flying into his chest, it lifts and flies up to its socket in the HUD, shrinking (0.45 s); the socket then fills
   (HUD.setPotion, 0.4 s). A potion drunk: motes in the potion's own colour rise round him with a soft glow at his chest (0.9 s), while the
   socket drains and the bar fills (0.4 s). Reduce motion: no flight (the potion fades where it lay as the socket fades in), and the motes stay put
   and fade. Effects off: no glows. Nothing flashes or bounces. HUD.OPTS.rm and HUD.OPTS.fxOff say which; potSound(on) lets the loop play sounds. */
const POT_COL={health:"#e0473c",mana:"#5fdcca"};let POT_SOUND=false;
function potSound(on){POT_SOUND=!!on;}
// a socket's centre in the picture's own units (540 lines tall), from the HUD laid over the canvas
function potSocketAt(cv,k){const stg=cv.parentElement,b=stg&&stg.querySelector(".lb-potion.is-"+k);if(!b)return null;const r=stg.getBoundingClientRect(),q=b.getBoundingClientRect(),z=r.width/stg.offsetWidth,u=LB.LH/stg.offsetHeight;
  return [((q.left+q.right)/2-r.left)/z*u,((q.top+q.bottom)/2-r.top)/z*u];}
// the flight, in screen picture units: from (gx, gy) on the ground to the socket (tx, ty), u 0..1 over 0.45 s; drawn over everything, as the HUD is
function potFlight(c,k,gx,gy,tx,ty,u,t,fxOn){const e2=u*u,px=gx+(tx-gx)*e2,py=gy+(ty+4-gy)*e2-Math.sin(u*Math.PI)*34;
  if(fxOn)fxGlowAt(c,px,py-8,18*(1-u*0.4),0.5*(1-u*0.6),POT_COL[k]);
  c.save();c.translate(px,py);const s2=1.25-u*0.5;c.scale(s2,s2);c.globalAlpha=u>0.85?Math.max(0,1-(u-0.85)/0.15):1;lootShape(c,k,t);c.restore();}
// the drink's light on him: u 0..1 over 0.9 s, at his chest (from mvPt)
function potDrinkFx(x,chest,u,k,rm,fxOn){const col=POT_COL[k];
  if(fxOn)fxGlowAt(x,chest[0],chest[1],32+12*u,0.36*Math.sin(Math.min(1,u*1.4)*Math.PI),col);
  for(let i=0;i<10;i++){const ph=Math.max(0,u-i*0.03),a=Math.sin(Math.min(1,ph*1.25)*Math.PI)*0.95,ang=i/10*Math.PI*2+0.4,rr=16+(i%3)*5;
    const mx=chest[0]+Math.cos(ang)*rr*0.85,my=rm?chest[1]+Math.sin(ang)*rr*0.7:chest[1]+20-ph*64+Math.sin(ang)*7;fxMote(x,mx,my,2.1,a,col);}}
// the review loop. arg "keep": he walks to a health potion and it flies to its socket; "drinkH" / "drinkM": he stands and drinks a kept potion.
// It leaves the HUD's state in K.hs (HUD.tick shows it): the sockets, potFx, the bars and the first-time plaque line.
function loopPot(cv,t,lvAll,R,K,arg){const lv=lvAll,S=cv.height/LB.LH,W=cv.width/S,c=cv.getContext("2d");if(!K.scr||K.scr.width!==cv.width||K.scr.height!==cv.height)K.scr=LP.mk(cv.width,cv.height);
  const T=cpTerr(lv),G=x=>tGround(T,x),cam=300,wx0=cam+W*0.16,sc=rollScene(S),e=LB.places[lv].edge,opts=LB.options(lv,{walking:false}),phone=cv.parentElement&&cv.parentElement.dataset.hud==="phone";
  const keep=arg==="keep",k=arg==="drinkM"?"mana":"health",TT=keep?5.6:4.6,tt=t%TT,rm=HUD.OPTS.rm,fxOn=!HUD.OPTS.fxOff;
  const potX=wx0+134,tTouch=1.75,tDrink=1.0;
  let X=wx0,P;
  if(keep){const steps=Math.max(0,Math.min(tTouch,tt)-0.3)*R;X=wx0+steps*STEP*K132;P=tt>0.3&&tt<tTouch?mvWalk(Math.floor(steps)):mvIdle(Math.floor(tt*R));}
  else{X=wx0+60;P=mvIdle(Math.floor(tt*R));}
  const hs={hp:0.55,mp:0.7,potions:{health:false,mana:false}};
  if(!keep){hs.potions[k]=true;if(k==="health")hs.hp=0.42;else hs.mp=0.3;}
  if(keep){const tFill=rm?tTouch:tTouch+0.45;if(tt>=tFill){hs.potions.health=true;const u=(tt-tFill)/0.4;if(u<1)hs.potFx={k:"health",kind:"keep",u};}
    const lu=tt-(tFill+0.35);if(lu>=0&&lu<2)hs.line={kind:"potH",text:phone?"Kept for later. Tap to drink":"Kept for later. Q to drink",u:lu};
    if(POT_SOUND&&K.lastT!=null&&K.lastT<tTouch&&tt>=tTouch)SND.play("pickup");}
  else{if(tt>=tDrink){hs.potions[k]=false;const u=(tt-tDrink)/0.35;if(u<1)hs.potFx={k,kind:"drink",u};const v=ease(Math.min(1,(tt-tDrink)/0.4));if(k==="health")hs.hp=0.42+0.35*v;else hs.mp=0.3+0.5*v;}
    if(POT_SOUND&&K.lastT!=null&&K.lastT<tDrink&&tt>=tDrink)SND.play(k==="health"?"drinkHealth":"drinkMana");}
  K.lastT=tt;K.hs=hs;
  sc.fn=(x,s,W2,t2)=>{rlPath(x,T,cam,W2,G);x.save();x.translate(-cam,0);
    if(keep){const gy=G(potX)+1;if(tt<tTouch)drawLoot(x,"health",potX,gy,t2,{seed:0.3,pool:fxOn?1:0});
      else if(rm&&tt<tTouch+0.3)drawLoot(x,"health",potX,gy,t2,{a:1-(tt-tTouch)/0.3,pool:0,glint:false});}
    const Y=G(X)+1,Gm=mvDraw(x,X,Y,P,Math.floor(tt*R)/R,1,e,K132,{feet:true,pool:fxOn?1:0}),chest=mvPt(Gm,P,X,Y,1,K132,4,-22);
    if(!keep&&tt>=tDrink&&tt<tDrink+0.9)potDrinkFx(x,chest,(tt-tDrink)/0.9,k,rm,fxOn);
    x.restore();};
  c.setTransform(1,0,0,1,0,0);sc.render(c,K.scr,S,W,t,cam,opts);sc.fn=null;c.setTransform(S,0,0,S,0,0);
  if(keep&&!rm&&tt>=tTouch&&tt<tTouch+0.45){const tg=potSocketAt(cv,"health");if(tg)potFlight(c,"health",potX-cam,G(potX)-14,tg[0],tg[1],(tt-tTouch)/0.45,t,fxOn);}
  scFade(c,W,LB.LH,tt>TT-0.3?(tt-(TT-0.3))/0.3:(tt<0.2?1-tt/0.2:0));
  // a phone's thumb on the socket as it is drunk (a computer's key lights: HUD.setPotion)
  const stg=cv.parentElement,th=stg&&stg.querySelector(".lb-thumb");if(th){const on=!keep&&tt>=tDrink-0.15&&tt<tDrink+0.25,b=stg.querySelector(".lb-potion.is-"+k);
    if(on&&b){const r=stg.getBoundingClientRect(),q=b.getBoundingClientRect(),z=r.width/stg.offsetWidth;th.style.left=((q.left+q.right)/2-r.left)/z+"px";th.style.top=((q.top+q.bottom)/2-r.top)/z+6+"px";th.style.opacity="0.9";}else th.style.opacity="0";}}
