"""Builds Lantern Box speed test 1 (index.html) from the Gloam Hallow directions page, round 12 (src/directions-round12.html).
The directions page's drawing code is kept as it is; this script adds the kit's way of drawing (src/kit.js), the test page
(src/page.js, src/body.html, src/extra.css) and a few small switches in the drawing code so the still and moving parts can be
drawn apart. Run:  python build.py   (standard library only)."""
import re,sys,os
D=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(D,"src","directions-round12.html"),encoding="utf-8").read()
def rep(s,old,new,n=1):
    c=s.count(old); assert c==n,(old[:80],c); return s.replace(old,new)
s=src
s=rep(s,"<title>Gloam Hallow Directions</title>","<title>Lantern Box Speed Test</title>")
s=rep(s,"</style>",open(os.path.join(D,"src","extra.css")).read()+"</style>")
a=s.index('<div class="wrap">'); b=s.index("\n<script>")
s=s[:a]+open(os.path.join(D,"src","body.html")).read()+s[b:]
# layer: lights and eyes can be collected instead of drawn (the kit draws them fresh every frame)
s=rep(s,"    for(const fl of fairies)drawFairy(x,fl,t,o.level);\n    if(eyes.length)drawTreeEyes(x,eyes,t,L,o.rm);",
        "    if(this.collect){this.collect.fairies.push(...fairies);this.collect.eyes.push(...eyes);}\n    else{for(const fl of fairies)drawFairy(x,fl,t,o.level);\n    if(eyes.length)drawTreeEyes(x,eyes,t,L,o.rm);}")
# play: a still pass (for tiles) and a live pass (every frame); the mock-up way does both at once
pa=s.index("  play(ctx,s,W,t,camX,o){"); pb=s.index("  monsterInto(c,s,m,t,o,dx,dy,H){")
P=s[pa:pb]
P=rep(P,"    x.fillStyle=INK;\n    x.beginPath();x.moveTo(-10,LH+10);for(let sx=-10;sx<=W+10;sx+=6)x.lineTo(sx,gY(sx+camX));x.lineTo(W+10,LH+10);x.closePath();x.fill();",
        "    const st=this.pass!==\"live\",lv=this.pass!==\"static\";\n    if(st){x.fillStyle=INK;\n    x.beginPath();x.moveTo(-10,LH+10);for(let sx=-10;sx<=W+10;sx+=6)x.lineTo(sx,gY(sx+camX));x.lineTo(W+10,LH+10);x.closePath();x.fill();}")
P=rep(P,'if(it.k==="hatmaw"){if(hX>-400&&hX<W+400)','if(it.k==="hatmaw"){if(lv&&hX>-400&&hX<W+400)')
P=rep(P,'case "house":{drawSprite(x,hs,X,hY,1,false);\n            const hr=rng32(hsh(29,p));\n            fillHoles(x,hs,X,hY,1,hr,{litP:0.34,win:o.win,a:0.95,bar:INK,dark:"#1a1218",crack:true});\n            if(hs.lampAt)',
        'case "house":{if(st){drawSprite(x,hs,X,hY,1,false);\n            const hr=rng32(hsh(29,p));\n            fillHoles(x,hs,X,hY,1,hr,{litP:0.34,win:o.win,a:0.95,bar:INK,dark:"#1a1218",crack:true});}\n            if(lv&&hs.lampAt)')
P=rep(P,"x.lineWidth=1;x.strokeStyle=INK;x.beginPath();x.moveTo(ax,ay);x.quadraticCurveTo(qx,qy,bx,by);x.stroke();drawFairy(x,[ax,ay,qx,qy,bx,by,p+7],t,o.level);}",
        "if(st){x.lineWidth=1;x.strokeStyle=INK;x.beginPath();x.moveTo(ax,ay);x.quadraticCurveTo(qx,qy,bx,by);x.stroke();}if(lv){if(this.kit)drawFairyKit(x,[ax,ay,qx,qy,bx,by,p+7],t,o.level,s);else drawFairy(x,[ax,ay,qx,qy,bx,by,p+7],t,o.level);}}")
LIVE={"potion","thorns","ghoul","bat","candle","shrine"}
STILL={"grave","fence","wall","post","lamp","barrels","crates","well","menhir","cairn","fallen","stonewall","stump","bigstump","grass","ferns","log"}
def gate(m):
    k,body=m.group(1),m.group(2)
    if k in LIVE: return 'case "%s":if(lv){%s}break;'%(k,body)
    if k in STILL: return 'case "%s":if(st){%s}break;'%(k,body)
    raise SystemExit("unknown case "+k)
P,n=re.subn(r'case "(\w+)":(?!\{)(.*?)break;',gate,P)
print("gated cases",n)
P=rep(P,"    const spk=set===\"village\"?\"village5\":set;","    if(!lv)return;\n    const spk=set===\"village\"?\"village5\":set;")
P=rep(P,"    for(const m of monsters)if(m.X>-160&&m.X<W+160)this.monster(ctx,s,m,t,o);",
        "    if(o.crowd)this.crowd(monsters,W,camX,t);\n    for(const m of monsters)if(m.X>-160&&m.X<W+160)this.monster(ctx,s,m,t,o);\n    if(o.crowd){const bx=W*0.74;this.bossAt(ctx,s,o.level,t,o,bx,gY(camX+bx)+2);}")
s=s[:pa]+P+s[pb:]
s=rep(s,"function drawBat(x,X,Y,k,ph,col){\n","function drawBat(x,X,Y,k,ph,col){if(KIT.fly)return drawFlyerKit(x,'bat',X,Y,k,ph,col);\n")
s=rep(s,"function drawCrow(x,X,Y,k,ph,col){\n","function drawCrow(x,X,Y,k,ph,col){if(KIT.fly)return drawFlyerKit(x,'crow',X,Y,k,ph,col);\n")
# the front layer: its ground plants and its overhanging branches can be drawn apart, so the branches can stay pinned
# to the top edge while the camera rises (Barney, 1 Nov). The random draws still happen in the same order either way.
s=rep(s,"drawSprite(ctx,moor?Wd.heather[Math.floor(r()*4)]:Wd.fern[Math.floor(r()*3)],X,LH+4,","this.fs(ctx,'g',moor?Wd.heather[Math.floor(r()*4)]:Wd.fern[Math.floor(r()*3)],X,LH+4,")
s=rep(s,"drawSprite(ctx,Wd.wgrass[Math.floor(r()*4)],X,LH+8,","this.fs(ctx,'g',Wd.wgrass[Math.floor(r()*4)],X,LH+8,")
s=rep(s,"drawSprite(ctx,Wd.fo[Math.floor(r()*2)],X,-6,","this.fs(ctx,'t',Wd.fo[Math.floor(r()*2)],X,-6,")
s=rep(s,"drawSprite(ctx,Pp.tuft[Math.floor(r()*4)],X,LH+4,","this.fs(ctx,'g',Pp.tuft[Math.floor(r()*4)],X,LH+4,")
s=rep(s,"drawSprite(ctx,Pp.fgb[j],X,-6,","this.fs(ctx,'t',Pp.fgb[j],X,-6,")
# monsters: the kit paints each pose once and reuses it until the puppet's next step
s=rep(s,"  monster(ctx,s,m,t,o){this.monsterInto(ctx,s,m,t,o,Math.round((m.X-130)*s),Math.round((m.Y-230)*s));}",
"""  monster(ctx,s,m,t,o){
    if(!this.kit){this.monsterInto(ctx,s,m,t,o,Math.round((m.X-130)*s),Math.round((m.Y-230)*s));return;}
    const bb=MON_BOX[m.kind]||[-128,-228,128,18],G=18,id=m.id||(m.kind+"|"+m.ph),r=POSE_RATE[m.kind];
    const step=(r&&!o.rm)?Math.floor((r*t+m.ph)*8):-KIT.frame;
    let E=this.poses.get(id);
    if(!E){E={cv:mk((bb[2]-bb[0]+2*G)*s,(bb[3]-bb[1]+2*G)*s),step:null};this.poses.set(id,E);}
    if(E.step!==step){const c=E.cv.getContext("2d");c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,E.cv.width,E.cv.height);
      this.monsterInto(c,s,m,t,o,Math.round((G-130-bb[0])*s),Math.round((G-230-bb[1])*s));E.step=step;KIT.poses++;}
    E.used=KIT.frame;
    ctx.drawImage(E.cv,Math.round((m.X+bb[0]-G)*s)/s,Math.round((m.Y+bb[1]-G)*s)/s,E.cv.width/s,E.cv.height/s);
  }""")
s=rep(s,"\n/* ============================== sky ============================== */","\n"+open(os.path.join(D,"src","kit.js")).read()+"\n/* ============================== sky ============================== */")
ga=s.index("/* ============================== the page ============================== */")
gb=s.index("})();\n</script>")+len("})();\n</script>")
page=open(os.path.join(D,"src","page.js")).read()
page=page.replace('const os=/Android ([\\d.]+)/.test(ua)?"Android "+RegExp.$1:','const am=ua.match(/Android ([\\d.]+)/),os=am?"Android "+am[1]:')
assert "RegExp.$1" not in page
s=s[:ga]+page+s[gb:]
page='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+s+'</body></html>'
open(os.path.join(D,"index.html"),"w",encoding="utf-8",newline="\n").write(page)
print("built index.html,",len(page),"characters")
