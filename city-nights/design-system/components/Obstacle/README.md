# Obstacle

Things in the road that give the drive variety: an oil slick, a flooded pothole, roadworks closing a lane, and cargo spilt off a lorry. All true size, all part of the street (World), drawn with the street's light on them.

## When to use
- Placed on the road by the game, in a lane, for the taxi to avoid. Four kinds (Barney, 29 October 2026).
- What each one does to the taxi (a skid, slowing down, a penalty) is Grunge City Rider's gameplay (PRD question 4), not the kit's.

## How it is drawn
Canvas 2D, by `CityNights.street` in `components/bundle.js`, with every colour from a token. No image files.

```js
var S = CityNights.street;
// flat on the road: made once, then laid on the road between d0 (near) and d1 (far), x0 to x1 across
S.decal(g, pt, S.oil(seed), d0, d1, x0, x1, 0.95);        // 2.8 m across, 6.5 m along
S.decal(g, pt, S.pothole(), d0, d1, x0, x1, 1);           // 1.9 m across, 3.2 m along
// with depth: drawn in the street's perspective each time
S.roadworks(g, pt, d, laneX, { camX: camX, lampsA: lampsA }); // lampsA swaps every lamp-time
S.cargo(g, pt, d, laneX, { camX: camX });
```
- `pt(d, x, y)` is the game's projection: `d` metres ahead of the taxi's rear bumper, `x` metres across from the road's centre, `y` metres up, giving `{ x, y, s }` in canvas pixels (`s` is pixels per metre there), or null when out of sight. `camX` is where the camera is across the road, in metres, so the right side faces of boxes show.
- The road pictures (`oil`, `pothole`) are made once and kept; the boxes, cones and sign are cheap enough to draw each frame, or the game can bake them like the traffic.

## The game provides
- Which kind, which lane, how far ahead, and what happens if the taxi hits it.

## Rules
- **Never in the clear stretch** (`clear-stretch`, 40 m) before a tunnel, nor inside one (Tunnel; Barney, 30 October 2026).
- **Oil slick**: darker than the wet road (`oil-dark` at 80%), with the street's tube colours caught in a thin rainbow sheen, its edge feathered into the road. Takes the road's grain.
- **Flooded pothole**: a pale broken lip (`pothole-lip`) round rainwater that mirrors the lamps (`sodium` on the far side) and a neon sign, with rings from the rain. Takes the road's grain.
- **Roadworks** close one lane: four `cone-orange` cones with `face-white` bands lead out from the kerb side, then three water-filled barriers, 1.05 m each, `face-red` and `face-white` with reflective bands, an amber lamp (`lamp-amber`) on each, and a `face-yellow` sign, 1.45 m by 0.7 m, lettered 道路工程 ROAD WORKS in `ink-black` (Noto Serif TC Black and Antonio); the Chinese is never wider than the sign's face.
- **Spilt cargo** across about 2.6 m of a lane: `cardboard` boxes with `parcel-tape`, two marked 易碎 (fragile) in `ink-red`, one burst open, `fruit-orange` oranges rolling.
- **True size** (Barney, 29 October 2026). In this camera anything in the taxi's own lane closer than about 20 m is behind the taxi, so an obstacle is first seen further up the road: its colour and light have to make it readable from there.
- **Motion and safety**: the roadworks lamps take turns, each pair lit for `lamp-time` (0.5 s), so each lamp comes on once a second, well under the flash limit. Nothing else moves or flashes.
- Grain: boxes, barriers, cones and the sign at the traffic's level (`grain-vehicles`); the sign's light and the lamps are lights (`grain-signs`, none).
- Chinese: 道路工程 and 易碎 are on the word list for the Cantonese reader.
