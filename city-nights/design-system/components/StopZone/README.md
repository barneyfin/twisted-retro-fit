# StopZone

The bay where the player stops: to pick a passenger up, or to drop them off. Bold paint in the kerbside lane, a low lit sign at its start and three lit posts along its far half. One design in two colours: teal for pick-up, pink for drop-off.

## When to use
- **Pick-up**: beside a waiting passenger (Passenger). **Drop-off**: at the fare's destination, with no one waiting.
- One bay at a time. In Grunge City Rider holding the brake with at least three-quarters of the taxi inside counts; no full stop is needed (`GAMEPLAY-grunge-city-rider.md`).

## How it is drawn
Canvas 2D, by `CityNights.street`: the bay's pictures are made once, then the paint is laid on the road with its light, and the sign and posts stand with the street's other upright things:

```js
var S = CityNights.street;
var pickup = S.bay('pickup'), dropoff = S.bay('dropoff');   // made once and kept: paint, glow, spill, sign, post
S.drawBay(g, pt, pickup, d0, d0 + 10, -4.85, -1.85);        // 10 m along, 3 m across the kerbside lane
S.bayStands(pickup, d0, -4.85).forEach(function (it) {      // the posts, far to near, then the sign
  S.stand(g, pt, it.spr, it.d, it.x);
});
```
- `drawBay` lays the bay's light on the wet road, then the paint, then the glow of its edges.
- `bayStands` says where the upright parts go, so the game can sort them by distance with its passengers, people and power-ups. Each is `{ spr, d, x }`.

## The game provides
- Where the bay is, which kind, how much of the taxi is inside it, and when the stop has counted.

## Rules
- **Never in the clear stretch** (`clear-stretch`, 40 m) before a tunnel, nor inside one (Tunnel; Barney, 30 October 2026).
- **Made to stand out on a phone** (Barney, 31 October 2026, from play-testing on his Pixel: C with B's last three posts, bays round 1). It replaces option A's faint wash, dashed sides and road lettering (29 October 2026), which were hard to see at 70 km/h, turned pale under a street lamp, and couldn't be read squashed by the low camera.
- **The paint**: a deep fill of the bay's colour, darkened towards the road so a street lamp's light can't turn it pale; bold diagonal bars across it; solid 0.3 m edges all round. The glow comes from the edges alone, so the middle keeps its colour. **No words on the road.**
- **The sign** (`bay-sign-size`): a low lightbox on two legs, square to the traffic, 0.4 m before the bay's start and 0.85 m in from its kerb edge: a 1.6 m by 1 m panel from 1.1 m to 2.1 m up, `neon-board` inside the bay's tube, with 上客 PICK-UP or 落客 DROP-OFF in the tube's core colour. It stands low so the pin's tag (TargetPin) never sits on it; a sign 2.3 m up was tried, and at 12 m the tag covered it.
- **The posts** (`bay-post-size`): three, at 5, 7.5 and 10 m along the bay, 0.3 m in from its kerb edge. Dark, 1.2 m tall and 0.2 m across, each with a steady band of the bay's colour near its top.
- **What shows when**: from far off, only the pin (TargetPin); in this camera nothing flat shows past the taxi at 35 m. From about 20 m the sign and posts show, over the taxi's roof even when it is in the bay's lane, and the sign reads by about 12 m; the paint shows from about 20 m in the other lanes. Once the taxi is all the way in, the sign stands by the meter and the caption for a moment until the taxi moves on (Barney kept it there, 31 October 2026, rather than moving it to the far end, where it was hard to read on the way in).
- **Two colours** (Barney, 29 October 2026): pick-up `tube-teal`, its sign lettered 上客 PICK-UP in `tube-core-teal`; drop-off `tube-pink`, its sign lettered 落客 DROP-OFF in `tube-core-pink`. Teal and pink differ in lightness as well as hue, the sign's words differ, and a passenger waits only at a pick-up, so colour is never the only clue.
- **Size**: `bay-size`, 3 m across and 10 m along, about twice the taxi's length: that is the stopping area. Kept on 31 October 2026: from this camera a longer bay gains only a few pixels on screen, and it would make stopping easier.
- **Place**: the kerbside lane on the left, its kerb edge 0.15 m from the kerb; the sign and posts on the pavement beside it.
- The sign's lettering: Noto Sans TC Bold (`zh-sans`) and Antonio (`display`).
- Steady: the bay, its sign and its posts never flash or pulse. Their light is a light (`grain-signs`, none); the paint takes the road's grain, and the sign's legs and the posts take the street's.
- **The bay's ring** (Barney, 30 October 2026: round 2, A, keeping only the inner ring): once three-quarters of the taxi is inside, the bay's colour gathers in a ring of light on the road round the taxi, close to it; it fades in over `ring-fade` and fades out once the stop has counted. No second, spreading ring. While it shows, 保's ring steps aside (TaxiMarks). Drawn on the road before the taxi, so the taxi hides what is under it:
  ```js
  CityNights.hud.bayRing(g, pt, laneX, 'tube-teal', a);   // laneX: the taxi's lane centre in metres; 'tube-pink' for a drop-off; a: 0 to 1
  ```
  An ellipse 3.4 m along by 1.45 m across round the taxi's middle (2.3 m ahead of its rear bumper), stroked 16 and 5 picture pixels wide with soft blurs and a fine white line, over a faint fill. It is the bay's light, so it takes no grain.
- **Why a ring**: once the taxi is in a bay, the taxi hides almost all of the paint; the posts and, for a moment, the sign still show beside it. On the way in, the pin (TargetPin) marks the bay from far off.
- **The passenger getting in**: see Passenger.
- Chinese: 上客 and 落客, on the sign, are on the word list for the Cantonese reader.
