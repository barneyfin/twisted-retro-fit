# ShieldSign

The shielded hit: when 保 takes a crash, a small blue neon sign of the crash pop's family, without the smoke, lights over the point of contact: a shield with 保 and SAFE! in the pop's comic letters on a curve. Without it the taxi would seem to drive through a car.

## When to use
- Grunge City Rider (Barney, 30 October 2026: round 2b, B): when the taxi hits a vehicle, a roadworks barrier or cone, or an animal while 保 is held.

## How it is drawn
Canvas 2D, by `CityNights.hud`:

```js
CityNights.hud.shieldSign(g, x, y, k, alpha, springScale);   // x, y: its middle, over the point of contact
```
- `k`: canvas pixels per pixel of a 720-line window. The sign is `shield-box`, 300 × 210, round its middle. Draw it once into its own canvas at the window's size (like the crash pop's words), then draw that with the spring scale and the opacity each frame.

## The game provides
- The point of contact on screen and the moment. When the car or barrier hit is in the taxi's own lane, the contact is behind the taxi, so the sign sits over the taxi's roof: the taxi's rear on the road, 2.55 m up.

## Rules
- **Look**: a shield on `neon-board` at 92% in a 7 `tube-blue` tube with its glow and a 2.2 `tube-core-blue` core; 保 in Noto Serif TC Black, 58px, `tube-core-blue`; SAFE! in Bangers (`shield-word`, 62px, 3px apart), white with a 7px `face-blue` edge, each letter placed and turned along a curve rising over the shield.
- **Life**: the crash pop's: it springs in and settles in the first fifth of a second, holds, and is gone within `pop-time` (1 s). Under Reduce motion it only fades. It never flashes.
- **Underneath**: the car or barrier hit is cleared away while the sign covers it, as under a crash pop; an animal bolts as usual. The game does not freeze, and no life or tip is lost. 保's badge and ring go (TaxiMarks).
- Smaller than the crash pop on purpose (about a quarter of its box): a save, not a crash.
- No grain (a light). Chinese: 保 is on the word list.
