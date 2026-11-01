# Flyers

Bats and crows: small black shapes crossing between the backdrop layers, tinted with the air. Scenery, unlike the flyer monster.

## When to use
- Bats at Night and in Blood-red rain (a swarm far off, a few big ones nearer); crows at Dawn (seven far, some near) and a few in Mist.

## Code
```js
const p = W.parts;
p.drawBat(ctx, X, Y, scale, wingPhase, colour);   p.drawCrow(ctx, X, Y, scale, wingPhase, colour);
// the scene uses drawSwarm, drawBigBats and drawCrows, coloured W.parts.mixc(W.pal.INK, W.pal.AIR[level], tint)
```

## The game provides
- Nothing: the place draws its own flyers.

## Rules
- Coloured as the layer they fly in front of, never pure `ink` (pure black is for the play strip). Wings beat on a sine; the scene paints 17 wing positions once (the kit's way).
- They never carry ember eyes: a bat with ember eyes is the flyer monster (Monsters).
