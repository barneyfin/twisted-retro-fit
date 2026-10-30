# TargetPin

A neon pin over where the taxi is heading: pink 落 over the drop-off with the place's name and the metres to go, teal 上 over a pick-up with the metres. It stands in the street, so the player steers for it.

## When to use
- Throughout a Grunge City Rider run: over the pick-up bay while a passenger waits, over the drop-off bay while one is aboard (Barney, 29 and 30 October 2026: HUD round 1, C, and the pin leading to pick-ups too).
- One pin at a time. None between a drop-off and the next passenger appearing.

## How it is drawn
Canvas 2D, by `CityNights.hud`, on a canvas over the street:

```js
CityNights.hud.pin(g, x, y, k, m, { kind: 'drop', name: '明月酒店', metres: '300' });   // kind 'pick' has no name; bare: true for no tag
```
- `x, y`: the screen point 3.2 m above the middle of the bay, from the game's projection (`pt(dMid, laneX, 3.2)`). Until the bay is within the drawn road, use the far end of the drawn road (about 80 m) in the bay's lane. **Inside a tunnel the pin still shows** there, under the tunnel's ceiling (Barney, 30 October 2026; Tunnel).
- `k`: canvas pixels per pixel of a 720-line window; `m`: canvas pixels per CSS pixel. The pin is `pin-size` (40 × 58) at `k` = 1 and never smaller than 0.6 × `m`; its tag's lettering never smaller than 11 CSS pixels.

## The game provides
- Which bay, its place, the destination's name (drop-offs), and the metres to go, counting down in whole metres (three places at most: a trip is 15–25 s of driving, about 300–490 m).

## Rules
- **The pin**: a teardrop on `neon-board` in a 3.6 tube (`tube-pink` for a drop-off, `tube-teal` for a pick-up) with its 1.3 core (`tube-core-pink`, `tube-core-teal`) and the tube's glow; 落 or 上 in Noto Sans TC Bold, 17px, in the core colour. Its point is on the spot.
- **The tag**, on the kerb side (left) of the pin: `neon-board`, 6px corners, a 2px tube ring with its glow; the name in `pin-name` (drop-offs only) over the metres in `pin-metres` ("300 M"), right-aligned, in the core colour.
- **Destinations are named after the street's own signs** (Barney, 30 October 2026), so the name needs no new characters and the player can spot the sign on arrival.
- **Inside the bay** (three-quarters of the taxi in it) the pin keeps no tag; it goes when the stop counts. After a pick-up the pink pin appears over the drop-off; after a drop-off the next teal pin appears with the next passenger.
- **Missed drop-off**: the pin moves on to the new bay ahead with its new distance.
- **Why it is in the street**: the taxi hides a bay in its own lane from about 20 m, and hides almost all of it once inside, so the pin marks it from far off. It stands above the horizon most of the time, clear of the lane ahead.
- Steady: no bob, no pulse. No grain (it is a light).
- Chinese: 上 and 落 (from 上客 and 落客) and the signs' names are on the word list.
