# Flyers

Bats and crows: small black shapes crossing between the backdrop layers, tinted with the air. Scenery, unlike the flyer monster.

## When to use
- Bats at Night and in Blood Red Rain (a swarm far off, a few big ones nearer); crows at Dawn (seven far, some near) and a few in Mist.

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

## Version 8
- The crow is redrawn side on, beating its wings like the bats (`crowSide`): a long body, a heavy beak, a fanned tail and long wings with five splayed fingers. On the moor two flocks of about twenty cross left to right (`drawCrowFlocks`, made as `drawSwarm` is) and three bigger crows fly alone nearer (`drawCrowsAlone`); the Mist has three far crows. Leaves blow across the Mist from left to right in gusts, far and near, never in front of the path (`drawLeaves`). The old `drawCrow` and `drawCrows` stay in bundle.js for reference but are no longer drawn. Under Reduce motion there are fewer and they move slower.
