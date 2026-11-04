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
- Coloured as the layer they fly in front of, never pure `ink` (pure black is for the play strip). The moor's crow flocks are the exception: a quarter of the way from `ink` towards the air, so they show against the dawn sky (version 9). In front of a cloud, the far bat swarm is lit through a cloud (version 10): where a cloud is behind them, backdrop layers 1 and 2 and the far bat swarm are `ink` mixed towards the cloud's own colour, by `thru-cloud` (0.75) of their tint, instead of towards the air, so they read a step darker than the cloud and never lighter. Wings beat on a sine; the scene paints 17 wing positions once (the kit's way).
- They never carry ember eyes: a bat with ember eyes is the flyer monster (Monsters).

## Version 8
- The crow is redrawn side on, beating its wings like the bats (`crowSide`): a long body, a heavy beak, a fanned tail and long wings with five splayed fingers. On the moor two flocks of about twenty cross left to right (`drawCrowFlocks`, made as `drawSwarm` is) and three bigger crows fly alone nearer (`drawCrowsAlone`); the Mist has three far crows. Leaves blow across the Mist from left to right in gusts, far and near, never in front of the path (`drawLeaves`). The old `drawCrow` and `drawCrows` stay in bundle.js for reference but are no longer drawn. Under Reduce motion there are fewer and they move slower.

## Version 9
- The moor's two crow flocks are drawn a quarter of the way from `ink` towards Dawn's air (about 31, 36, 48) instead of as backdrop layer 2 (`tn[1]*0.9`, about 64, 77, 100), which was barely lighter than the sky from the middle of the screen to the right and the same hue. They now read as dark birds across the whole width, over the daybreak and the blue alike. The near crows, the Mist's crows and the leaves are unchanged (found on Barney's Pixel, 4 November 2026).

## Version 10
- The far bat swarm, where it crosses in front of a cloud, takes the cloud's own colour a step darker (lit through the cloud: see Places), so the bats read as dark shapes in front of Night's violet clouds instead of copper ones. Elsewhere they are unchanged. The big near bats, the crows and the leaves are unchanged.
