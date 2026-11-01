/* ============================== the kit way: draw once, slide every frame ==============================
   The mock-up rebuilds every backdrop layer, shape by shape, on every frame. The kit way draws each layer once,
   in tiles as the camera reaches them, and then only slides the tiles. Things that move are drawn fresh over the
   top: lights that twinkle, eyes that blink, flames, splashes, monsters and the wanderer. A puppet monster changes
   pose only in steps (8 a second at its own pace), so each pose is painted once and reused until the next step. */
const TWP=1024,TMP=840;                    // a tile's width, and the margin drawn round it so glows and wide shapes join up (device pixels)
const POSE_RATE={crawler:1.3,bat2:1.6,ghoul2:1,walker:0.6}; // the pace of each puppet monster's steps (see pz)
const CROWD_KINDS=["crawler","ghoul2","walker","bat2","hatmaw"],CROWD_GAP=150;
const RISE=LH*0.5,RISE_PER=8;              // the camera rises by up to half a screen and comes down again every 8 s (starting figures)
const KIT={frame:0,built:false,builds:0,buildMs:0,poses:0,bytes:0};
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
  const key=lv+"@"+s;if(KIT.fs&&KIT.fs.key===key)return KIT.fs;
  const h=Math.ceil(1.8*s+15),cv=mk(2*h,2*h),c=cv.getContext("2d");
  c.setTransform(s,0,0,s,h,h);c.fillStyle=lv==="storm"?"rgb(255,201,168)":"rgb(255,241,200)";c.shadowColor="#ffd27a";c.shadowBlur=8;
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
  kitReset(key){this.kitKey=key;this.tiles={};this.poses=new Map();this.sky=null;this.vig=null;this.scr=null;},
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
  crowd(monsters,W,camX,t){ // extra monsters along the path, to load the picture for the test (they don't fight)
    const a=Math.ceil((camX-160)/CROWD_GAP),b=Math.floor((camX+W+160)/CROWD_GAP);
    for(let j=a;j<=b;j++){
      const wx=j*CROWD_GAP,X=wx-camX,kind=CROWD_KINDS[posmod(j,CROWD_KINDS.length)];
      if(Math.abs(X-W*0.28)<60||Math.abs(X-W*0.74)<130)continue; // clear of the wanderer and the boss
      const fly=kind==="bat2",Y=fly?232+Math.sin(t*1.1+j)*22:gY(wx)+(kind==="crawler"?3:kind==="ghoul2"?2:0);
      monsters.push({kind,X:fly?X+Math.sin(t*0.9+j)*26:X,Y,ph:j*0.77+0.3,id:"c"+j});
    }
  },
  bossAt(ctx,s,lv,t,o,bx,by){
    if(!this.kit){bossInto(ctx,s,lv,t,o,Math.round((bx-230)*s),Math.round((by-300)*s)+(this.dyS||0));return;}
    const step=o.rm?-KIT.frame:Math.floor(t*BOSS_HZ);let E=this.bossC;
    if(!E||E.lv!==lv||E.s!==s)E=this.bossC={cv:mk(460*s,330*s),lv,s,step:null};
    if(E.step!==step){const c=E.cv.getContext("2d");c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,E.cv.width,E.cv.height);bossInto(c,s,lv,t,o,0,0);E.step=step;}
    ctx.drawImage(E.cv,Math.round((bx-230)*s)/s,Math.round((by-300)*s)/s,E.cv.width/s,E.cv.height/s);
  },
  renderKit(ctx,s,W,t,camX,camY,o){
    const lv=o.level,rm=o.rm,L=LV[lv],tn=L.tints,W2=W*2,key=lv+"@"+s.toFixed(4)+"@"+Math.round(W*s);
    KIT.frame++;KIT.built=false;this.kit=true;
    this.ensure(W,s,lv);
    if(this.kitKey!==key)this.kitReset(key);
    const off=k=>Math.round(camY*k*s),at=k=>ctx.setTransform(s,0,0,s,0,off(k)),f=k=>rm?k*0.4:k;
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
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.drawImage(this.sky,0,0);
    const mb=after=>{if(!L.mist)return;L.mist.bands.forEach((b,i)=>{if(b[0]!==after)return;const cv=this.cache.mist[i],k=[0.03,0.12,0.28,0.5][after]*(rm?0.4:1),ox=posmod(t*b[3]*(rm?0.4:1)+camX*k,W2);
      at(k);ctx.save();ctx.globalAlpha=b[2];ctx.drawImage(cv,-ox,b[1]-100,W2,200);ctx.drawImage(cv,-ox+W2,b[1]-100,W2,200);ctx.restore();});};
    if(this.cache.cl0)for(const d of [0,1]){const cv=this.cache["cl"+d],sp=(d?11:5)*(rm?0.4:1),k=d?0.06:0.03,ox=posmod(t*sp+camX*k,W2);at(k);ctx.drawImage(cv,-ox,0,W2,LH);ctx.drawImage(cv,-ox+W2,0,W2,LH);}
    at(0);
    if(lv==="storm"){
      const st=lightning(t);
      if(st.bolt>0)drawBolt(ctx,W,st);
      if(st.swell>0){ctx.save();ctx.globalCompositeOperation="screen";ctx.fillStyle=rgba("#ffb39a",0.32*st.swell);ctx.fillRect(0,0,W,440);ctx.restore();}
    }
    mb(0);
    if(L.light==="sun"){at(f(0.05));drawFarRanges(ctx,W,camX,rm,lv);}
    this.kitLayer(ctx,s,W,t,camX*f(0.12),1,tn[0],o,off(f(0.12)));mb(1);
    if(lv==="storm"){at(0);drawRain(ctx,W,t,0,rm);}
    this.kitLayer(ctx,s,W,t,camX*f(0.28),2,tn[1],o,off(f(0.28)));mb(2);
    if(L.light==="sun"){at(0);drawRays(ctx,W,t,rm);}
    at(f(0.34));KIT.fly=s;
    if(L.fly==="bats")drawSwarm(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9));
    else drawCrows(ctx,W,t,camX*f(0.34),rm,mixc(INK,AIR[lv],tn[1]*0.9),L.fly==="crows"?7:3,false);
    KIT.fly=null;this.kitLayer(ctx,s,W,t,camX*f(0.5),3,tn[2],o,off(f(0.5)));mb(3);KIT.fly=s;
    at(f(0.62));
    if(L.fly==="bats")drawBigBats(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.7));
    else if(L.fly==="crows")drawCrows(ctx,W,t,camX*f(0.62),rm,mixc(INK,AIR[lv],tn[2]*0.7),0,true);
    KIT.fly=null;
    this.kitLayer(ctx,s,W,t,camX*f(0.76),4,tn[3],o,off(f(0.76)));
    // the path: its still parts from tiles, then everything that moves on it
    this.drawTiles(ctx,this.kitTiles("play",camX,W,s,i=>this.buildPlayTile(i,s,t,o)),camX,s,off(1));
    at(1);this.dyS=off(1);this.pass="live";this.play(ctx,s,W,t,camX,o);this.pass=null;this.dyS=0;
    if(lv==="storm"){at(0);drawRain(ctx,W,t,1,rm);}
    const fk=rm?1.08:1.35;
    this.drawTiles(ctx,this.kitTiles("fore",camX*fk,W,s,i=>this.buildForeTile(i,s,t,o,"g")),camX*fk,s,off(fk));
    this.drawTiles(ctx,this.kitTiles("foreTop",camX*fk,W,s,i=>this.buildForeTile(i,s,t,o,"t")),camX*fk,s,0); // branches stay hung from the top edge
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.vig,0,0);
    at(0);if(o.hud)drawHUD(ctx,W);
    // tidy: forget poses not used for a while; count the memory the tiles hold
    if(this.poses.size>60)for(const [k,E] of this.poses)if(E.used<KIT.frame-120)this.poses.delete(k);
    let by=0;for(const k in this.tiles)for(const tl of this.tiles[k].values())by+=tl.bytes;KIT.bytes=by;
  }
});
