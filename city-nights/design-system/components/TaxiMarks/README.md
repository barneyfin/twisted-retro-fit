# TaxiMarks

What the taxi carries and what it is doing, drawn on and round it: the power-up badges under its rear bumper, 保's ring of light, the bay's ring when it is in a bay, and its TAXI roof sign going out while it is hired.

## When to use
- Grunge City Rider, throughout a run (Barney, 30 October 2026: HUD round 1, C; round 2's bay ring and getting in).

## How it is drawn
Canvas 2D, by `CityNights.hud`:

```js
var H = CityNights.hud;
H.shieldRing(g, x, y, s);                                         // 保 held: x, y the taxi's rear on the road, s pixels per metre there
H.badges(g, x, y, k, m, [{ kind: 'speed', left: 0.6 }, { kind: 'shield' }, { kind: 'fare' }]);   // 'double' for 雙
H.bayRing(g, pt, laneX, 'tube-teal', a);                          // in a bay (StopZone); drawn on the road before the taxi
```
- Badges and 保's ring go on a canvas over the street at the taxi's place, following its sway. The bay's ring is drawn on the road (the street's overlay, before the taxi), so the taxi hides what is under it.
- `k`: canvas pixels per pixel of a 720-line window; `m`: canvas pixels per CSS pixel.

## The game provides
- Which power-ups are on, 快's time left (0 to 1), whether the taxi is in a bay and how far the ring has faded in, and whether a passenger is aboard.

## Rules
- **Badges**, in order 快, 保, then the fare boost (錢 or 雙, never both): each a power-up token's face and ink (PowerUp) in a `case` rim with its face colour's glow, `badge-size` 28 on a 720-line window, no smaller than 19 CSS pixels on phones, 5.75 apart, centred 4.6 below the taxi's rear on the road. 快 has a ring round it that empties clockwise from the top over its 10 s, on a dark track. 時 works at once and has no badge.
- **保's ring**: while 保 is held, a soft ring of `tube-blue` light on the road round the taxi, brightest towards its edge, 3.5 times the taxi's half-width across. It goes when 保 is used (the SAFE! sign, ShieldSign). **In a bay it steps aside** for the bay's ring and comes back as the taxi leaves (Barney, 30 October 2026).
- **The bay's ring**: see StopZone. One ring only, close to the taxi; no spreading second ring.
- **The roof sign** is lit (for hire) with no passenger aboard and **goes out while one is aboard**, as a Hong Kong taxi's does when hired; it lights again when the fare is paid (Barney, 30 October 2026). Out: the sign's face drops to near-black (about 86% of the way to `case`) with its red TAXI only just showing, and no glow. The kit bakes both looks into the taxi's pictures.
- Steady: badges never bob or flash; 快's ring empties smoothly. No grain on badges or rings (lights).
- Chinese: 快, 保, 錢 and 雙 are on the word list.
