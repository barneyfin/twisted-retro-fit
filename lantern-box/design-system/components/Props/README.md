# Props

The play strip's scenery: graves, fences and walls, barrels and crates, a well, standing stones, cairns and dry-stone walls, stumps and fallen trunks, ferns. All black card on the path.

## When to use
- Along the path of each place: graves, fences and the ruined wall at Night; barrels, crates, a well and street lamps in the old town; menhirs, cairns, fallen stones and dry-stone walls on the moor; great stumps, ferns and a fallen trunk in the forest.

## Code
```js
const p = W.parts, G = W.GROUND;    // most props stand on the ground line G(worldX)
p.drawGrave5(ctx, X, G(wx) + 4, 1.45, v /* 0..5 */);   p.drawFence(ctx, X, wx, width);
p.drawWall(ctx, X, G(wx), w, h, seed);   p.drawBarrels(ctx, X, G(wx));   p.drawCrates(ctx, X, G(wx));   p.drawWell(ctx, X, G(wx));
p.drawMenhir(ctx, X, G(wx) + 2, 1, v);  p.drawCairn(ctx, X, G(wx), 1);  p.drawFallen(ctx, X, wx);  p.drawStoneWall(ctx, X, wx, w, h, seed);
p.drawBigStump(ctx, X, G(wx), v, seed); p.drawStumpProp(ctx, X, G(wx), 1, v); p.drawLog(ctx, X, wx, w, h, seed); p.drawFerns(ctx, X, wx, w, seed);
```

## The game provides
- Where each prop stands (screen X and world x, so the ground line matches), and which variant.

## Rules
- `ink`, on the ground line, never floating: the lowest ground under a footprint sets its base.
- Gravestones lean, crack, sag and bend; six variants. Props are scenery: anything that hurts or helps the player is drawn in a monster's or a pick-up's style instead.
