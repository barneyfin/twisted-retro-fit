# Buildings

The building kinds: crooked cut-outs, every storey leaning, with lit and dark windows cut through them. Neighbours never match.

## When to use
- In the backdrop layers of Night (village houses, a chapel, a manor) and Blood Red Rain (crowded townhouses, taverns, a watchtower); ruins, mills, crypts and towers on the moor; a woodcutter's hut and a great stump in the forest. The one on the path is the mouth-hat's perch.

## Code
```js
const p = W.parts, r = p.rng32(p.hsh(41, i, kind.length, 4)), z = p.SIZE[kind];
const sprite = p.building(kind, r, { w, h, detail: 1 /* 2 on the path */, door, wing, storeys }, scale);
p.drawSprite(ctx, sprite, X, groundY, k, flip);
p.fillHoles(ctx, sprite, X, groundY, k, rng, { litP, win: W.pal.GOLD_LIGHT, a: 0.95, bar: W.pal.INK, dark: "#1a1218" });
// kinds (W.parts.KINDS): manor, townhouse, cottage, ruin, windmill, watchtower, crypt, tavern, chapel, dolmen, stump
```

## The game provides
- Which kinds stand where (the scene's pools pick them so neighbours never match), and the share of lit windows.

## Rules
- Nine building kinds plus the moor's dolmen and the forest's stump. All `ink`, tinted towards the place's air with their layer; windows cut after every solid part, lit `gold-light` or dark `window-dark`.
- Quirky, not cute: sagging roofs, jutting storeys, bent spires, missing tiles, broken sails.
