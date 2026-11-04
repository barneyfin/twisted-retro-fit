# Trees

The trees and plants: gnarled pollards with thick spreading limbs, wind-bent trees, dead snags, overhanging limbs, and the fore layer's grass, ferns and heather.

## When to use
- Pollards in Night and Blood Red Rain; wind-bent trees and snags in Mist (all bent the same way); the moor's heather and wind-combed grass at Dawn. Overhanging limbs reach in from the top corners in the fore layer, pinned to the top edge when the camera rises.

## Code
```js
const p = W.parts, r = p.rng32(p.hsh(31, id, i, 2));
p.geomSprite(p.pollardGeom(r, height, { sub: 1, limbs3: 4 }, 5), scale);   // a pollard; 70, 150, 250 or 420 tall by layer
p.geomSprite(p.windGeom(r, height, {}), scale);    p.geomSprite(p.snagGeom(r, height), scale);
p.geomSprite(p.overhangGeom(r, 3), scale);          p.geomSprite(p.windOverhangGeom(r), scale);
p.grassSprite(r, 0.16, scale); p.windGrassSprite(r, scale); p.fernSprite(r, scale);
p.drawSprite(ctx, sprite, X, groundY, k, flip);
```
The scene builds them once into pools (`W.scene(s).pools`, and `.get("wind")` for the forest and moor).

## The game provides
- Nothing directly: the place's layers draw them. A game drawing its own set piece uses these sprites.

## Rules
- All `ink`, tinted with their layer. Tree sizes grow by layer: 70, 150, 250 and 420 picture pixels tall.
- Limbs are tapered strokes with knuckled ends, like the monsters' limbs. Mist's trees carry pale, dim eyes that blink now and then.
